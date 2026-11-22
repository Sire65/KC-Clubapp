// KC-SICHERUNG-PACKEN (15.11.2026, Wunsch Hansi „Neon wird voll – setze 1 um“): Tagessicherungen vor dem Verschlüsseln mit gzip packen.
// Format: payload {kc_encrypted, alg, key_version, compression:"gzip", iv, ciphertext}; AES-GCM mit Zusatzdaten "kc-backup|gzip".
// Ungepackte Altsätze bleiben lesbar. Aufruf: node tests/sicherung-packen.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { entschluesseln } from "../tools/notfall/sicherung-lesen.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const w = lies("supabase/functions/kc-db-backup-worker/index.ts"), v = lies("supabase/functions/kc-db-backup-verify-v2/index.ts");
// Schreiber: packt, schützt das Merkmal, speichert es mit, kopiert nur schon gepackte Snapshots
assert.ok(/new TextEncoder\(\)\.encode\("kc-backup\|gzip"\)/.test(w) && /additionalData:GZ_AAD\},key,await packen\(/.test(w), "Worker packt vor dem Verschlüsseln");
assert.ok(/'compression',\$10::text/.test(w) && /redacted\.has\(table\),env\.compression\]/.test(w), "Merkmal im gespeicherten Umschlag");
assert.ok(/s\.payload->>'compression'='gzip' order by b\.started_at desc limit 1/.test(w), "unverändert kopiert wird nur, was schon gepackt ist");
assert.ok(/X-KC-Function-Version":"23"/.test(w), "Worker Version 23 (22 + KC-BACKUP-PRUEFUNG-SPAETER)");
// Leser: Prüfdienst (stückweise und im Ganzen) und Notfall-Werkzeug verstehen beide Formen
assert.ok(/payload->>'compression' c,length\(payload->>'ciphertext'\) l/.test(v) && /if\(gz\)plain=await entpacken\(plain\)/.test(v), "Prüfdienst stückweise");
assert.ok(/async function decrypt\(p:any,key:CryptoKey\)\{[^\n]*gzArt\(p\?\.compression\)/.test(v) && /X-KC-Function-Version":"13"/.test(v), "Prüfdienst im Ganzen, Version 13");
assert.ok(/const gzArt=\(c:any\)=>\{if\(c==null\|\|c===""\)return false;if\(c==="gzip"\)return true;throw/.test(v), "unbekannte Packart ist ein Fehler");
// Rundweg mit dem echten Notfall-Werkzeug (Testschlüssel, Testdaten)
const geheim = "test-geheimnis-nicht-echt-1234567890", daten = JSON.stringify(Array.from({ length: 500 }, (_, i) => ({ id: i, aktion: "test", zeit: "2026-11-15T07:00:00Z" })));
const k = await crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", new TextEncoder().encode(geheim)), { name: "AES-GCM" }, false, ["encrypt"]);
const iv = crypto.getRandomValues(new Uint8Array(12)), b = (x) => Buffer.from(x).toString("base64");
const neu = { kc_encrypted: true, compression: "gzip", iv: b(iv), ciphertext: b(new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode("kc-backup|gzip") }, k, gzipSync(daten)))) };
const alt = { kc_encrypted: true, iv: b(iv), ciphertext: b(new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(daten)))) };
assert.equal(await entschluesseln(neu, geheim), daten, "gepackt lesbar");
assert.equal(await entschluesseln(alt, geheim), daten, "ungepackter Altsatz lesbar");
assert.ok(neu.ciphertext.length * 5 < alt.ciphertext.length, "gepackt deutlich kleiner");
await assert.rejects(entschluesseln({ ...neu, compression: undefined }, geheim), "Merkmal entfernt → abgelehnt");
await assert.rejects(entschluesseln({ ...neu, compression: "br" }, geheim), /Packart/);
console.log("sicherung-packen: ok");
