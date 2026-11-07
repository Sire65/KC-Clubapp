// 2.869.0 KC-CLUB-EGRESS-MESSUNG (Supabase-Warnung 05.11.2026, Freigabe Hansi). Aufruf: node tests/egress-messung.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");

// --- Ziel-Namen: nur Tabelle/Funktion/Bereich, nie Filterwerte (Personen, IDs) aus der Adresse ---
const z = /function egressZiel\(url: string, methode: string\) \{\n  const m = (\/[^\n]+\/)\.exec\(url\);\n  return ([^\n]+);\n\}/.exec(server);
assert.ok(z, "egressZiel im Server");
const egressZiel = new Function("url", "methode", `const m = ${z[1]}.exec(url); return ${z[2]};`);
const B = "https://x.supabase.co";
assert.equal(egressZiel(B + "/rest/v1/kc_club_zugang?select=person_id&person_id=eq.KC-P-002", "GET"), "GET kc_club_zugang");
assert.equal(egressZiel(B + "/rest/v1/rpc/kc_club_start_kern", "POST"), "POST rpc/kc_club_start_kern");
assert.equal(egressZiel(B + "/storage/v1/object/public/club-bilder/a/b.webp", "GET"), "GET storage/club-bilder");
assert.equal(egressZiel(B + "/storage/v1/object/sign/club-dateien/geheim.pdf?token=abc", "GET"), "GET storage/club-dateien");
assert.equal(egressZiel("https://example.org/x", "GET"), "GET andere");

// --- Zählen: Datenbank-Antworten (alle Wege), Antworten an die App, gedeckelt, nur Zahlen ---
assert.ok(server.includes("if (!url.includes(\"/rest/v1/\")) return fetch(input, init); // Dateien"), "Speicher-Wege unverändert");
assert.ok(server.includes(".then((x) => egressZaehlen(x, url, methode)).catch((e) => {"), "Datenbank-Weg gezählt (vor dem Puffer – gepufferte Treffer kosten nichts)");
assert.ok(server.includes("if (!m.has(k) && m.size >= EGRESS_MAX_NAMEN) k = \"andere\";"), "Namen gedeckelt (keine Speicherflut durch erfundene Aktionen)");
assert.ok(server.includes("if (pf) pf.antwortBytes = (pf.antwortBytes || 0) + b.byteLength;"), "Antwort-Größe in json()");
assert.ok(server.includes("egressDazu(EGRESS.antwort, String(pf.aktion || req.method).slice(0, 40), pf.antwortBytes ?? (Number(antwort.headers.get(\"content-length\")) || 0)); egressMelden(); } catch {}"), "Antwort je Aktion, Melden ohne Fehler für die App");
const melden = server.slice(server.indexOf("function egressMelden("), server.indexOf("const dbFetchNetz"));
assert.ok(melden.includes('protokoll(null, "egress_messung", details)') && /const details = \{ sek: [^}]*db: egressTop\(EGRESS\.db\), aktion: egressTop\(EGRESS\.aktion\), antwort: egressTop\(EGRESS\.antwort\), version: SERVER_VERSION \};/.test(melden), "nur Namen und Zahlen, ohne Person");
assert.ok(/const EGRESS_MS = 3 \* 60000, EGRESS_MAX_NAMEN = 300, EGRESS_TOP = 40;/.test(server), "alle 10 Minuten, gedeckelt");
assert.ok(/const PROT_LAERM = \[[^\]]*"egress_messung"/.test(server), "nach 60 Tagen aufgeräumt");

// --- Zähl-Strom gibt die Daten unverändert weiter ---
let n = 0; const zaehler = new TransformStream({ transform(c, ctl) { n += c.byteLength; ctl.enqueue(c); } });
const text = JSON.stringify([{ a: "ä".repeat(5000) }]);
const r = new Response(new Response(text).body.pipeThrough(zaehler), { status: 200 });
assert.equal(await r.text(), text); assert.equal(n, Buffer.byteLength(text));
assert.ok(server.includes("const zaehler = new TransformStream<Uint8Array, Uint8Array>({ transform(c, ctl) { n += c.byteLength; ctl.enqueue(c); }, flush() { fertig(n); } });"), "derselbe Zähl-Strom im Server");

// --- 2.877.0 KC-CLUB-NOTPAKET-LEICHTER + KC-CLUB-NOTPAKET-PAUSE-WAECHST (Messung 06./07.11.: 16 Abbrüche, je Versuch 3–6 MB) ---
assert.ok(/const NOT_PARALLEL = 2, NOT_TEIL_MS = 60000;/.test(server) && /const NOT_GRUPPE = 2, NOT_GRUPPE_MS = 140000;/.test(server), "kleinere Teile, weniger gleichzeitig");
assert.ok(/const NOT_FEHLER_PAUSE_MIN = \[30, 60, 120\];/.test(server), "Pause wächst 30 → 60 → 120 Min.");
const np = server.slice(server.indexOf("async function notFehlerPause("), server.indexOf("async function notpaketLauf("));
assert.ok(np.includes('.eq("aktion", "notpaket_fehler").gt("zeit", new Date(seit).toISOString())') && np.includes('{ count: "exact", head: true }'), "zählt nur Fehlschläge seit dem letzten guten Paket (nur Anzahl)");
assert.ok(/return NOT_FEHLER_PAUSE_MIN\[Math\.min\(Math\.max\(\(count \?\? 1\) - 1, 0\), NOT_FEHLER_PAUSE_MIN\.length - 1\)\] \* 60000;/.test(np), "1. → 30, 2. → 60, ab 3. → 120");
const PAUSE = [30, 60, 120], pause = (count) => PAUSE[Math.min(Math.max((count ?? 1) - 1, 0), PAUSE.length - 1)];
assert.deepEqual([0, 1, 2, 3, 9].map(pause), [30, 30, 60, 120, 120]);
const lauf = server.slice(server.indexOf("async function notpaketLauf("), server.indexOf("// ---------- KC-CLUB-SONDERSTUNDEN"));
assert.ok(lauf.includes("const fehlerPauseMs = await notFehlerPause(st, zeitVon);") && lauf.includes("Date.now() - fehlerAm < fehlerPauseMs)") && lauf.includes("Date.now() - zeitVon(st.fehler_am) > fehlerPauseMs;") && !lauf.includes("30 * 60000"), "beide Stellen nutzen die wachsende Pause");
assert.ok(server.includes('pf.aktion = "notpaket_teil";'), "Messung: Teile benannt");
console.log("egress-messung: ok");
