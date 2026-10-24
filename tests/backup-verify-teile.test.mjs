// KICC-F-108 · kc-db-backup-verify-v2 Version 11: abgebrochene Pakete werden halbiert statt komplett als Fehler gezaehlt;
// eine Tabelle, die wirklich nicht passt, bleibt Fehler (nie „bestanden“). Quelle: supabase/functions/kc-db-backup-verify-v2.
import assert from "node:assert/strict";
import fs from "node:fs";
import { splitIntoParts, mergePartChecks, runPartAdaptive } from "../supabase/functions/kc-db-backup-verify-v2/parts.js";

const t = Array.from({ length: 40 }, (_, i) => "t" + i);
// t7 passt nie (z. B. Speicher), alle anderen nur in Paketen bis 10 Tabellen
const run = async (x) => (x.includes("t7") || x.length > 10 ? null : { checks: x.map((table) => ({ table, status: "ok" })) });
const r = await runPartAdaptive(t, run);
const m = mergePartChecks([t], [r]);
assert.equal(m.length, 40, "jede Tabelle genau einmal");
assert.equal(m.filter((c) => c.status !== "ok").length, 1, "nur die eine Tabelle scheitert");
assert.equal(m.find((c) => c.table === "t7").reason, "part_failed", "die nicht pruefbare Tabelle zaehlt als Fehler");
const ganz = await runPartAdaptive(["a", "b"], async (x) => ({ checks: x.map((table) => ({ table, status: "ok" })) }));
assert.equal(ganz.split, undefined, "klappt das Paket gleich, wird nicht geteilt");
assert.equal(await runPartAdaptive(["x"], async () => null), null, "einzelne Tabelle abgebrochen → kein Ergebnis → Fehler");
assert.deepEqual(splitIntoParts(["a", "b", "a", "c"], 2), [["a", "b"], ["c"]]);

const src = fs.readFileSync(new URL("../supabase/functions/kc-db-backup-verify-v2/index.ts", import.meta.url), "utf8");
assert.ok(/results\[i\]=await runPartAdaptive\(parts\[i\],\(t:string\[\]\)=>runPart\(token,set,t\)\)/.test(src), "Hauptaufruf nutzt das Halbieren");
assert.ok(/let text:string\|null=await ladeUndEntschluessle\(neon,set,table,key\);/.test(src) && !/select table_name,row_count,content_hash,payload from/.test(src), "Daten je Tabelle, nicht alle auf einmal");
assert.ok(/substr\(payload->>'ciphertext',\$3,\$4\)/.test(src) && /const STUECK=4\*262144;/.test(src), "stueckweise lesen (Vielfaches von 4)");
// Base64-Dekoder gegen Node pruefen (auch Stueckgrenzen und Auffuellzeichen)
const dek = src.slice(src.indexOf("const B64="), src.indexOf("const STUECK")).replace(/\(s:string,ziel:Uint8Array,pos:number\)/, "(s,ziel,pos)");
const b64InFeld = new Function(dek + "; return b64InFeld;")();
const crypto = await import("node:crypto");
for (const n of [0, 1, 2, 3, 100, 300001]) {
  const buf = crypto.randomBytes(n), s = buf.toString("base64"), z = new Uint8Array(Math.floor((s.length * 3) / 4)); let p = 0;
  for (let i = 0; i < s.length; i += 4 * 1000) p = b64InFeld(s.slice(i, i + 4 * 1000), z, p);
  assert.ok(p === n && Buffer.compare(Buffer.from(z.subarray(0, p)), buf) === 0, "Base64 richtig bei " + n + " Bytes");
}
console.log("OK – Backup-Pruefdienst: Halbieren, stueckweises Lesen, Base64");
