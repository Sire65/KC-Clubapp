// KC-NEON-PRUEFUNG (26.10.2026, Wunsch Hansi): Kontingent-Prüfung in der Admin-Kachel Neon – statische Prüfung + Rechnung (offline, ohne Server).
// Aufruf: node tests/neon-pruefung.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.726.0 KC-CLUB-TEILE: app.js + teile/*.js

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), server = lies("supabase/functions/kc-club/index.ts"), worker = lies("supabase/functions/kc-db-mirror-worker/index.ts");

// 1. Spiegel-Arbeiter misst das Archiv in der ohnehin offenen Verbindung und schreibt es zur Neon-Größe
assert.ok(/pg_total_relation_size\('public\.kc_backup_snapshots'\)/.test(worker) && /metrics:\{bytes:Number\(g\[0\]\?\.b\?\?0\),archiv,batch_id:batchId\}/.test(worker), "Archiv-Messung im Spiegel-Arbeiter");
assert.ok(/catch\(e\)\{console\.error\("neon_archiv"/.test(worker), "Archiv-Messung darf die Größenmessung nie verhindern");
// 2. Server: Neon-Schnittstelle nur mit Schlüssel, Zeitlimit, 30-Min.-Zwischenspeicher, parallel zu den Abfragen
const f = server.slice(server.indexOf("async function neonVerbrauch()"), server.indexOf("// Neon-Spiegel und Backup (0.48.0)"));
assert.ok(/Deno\.env\.get\("NEON_API_KEY"\)/.test(f) && /if \(!key\) return \{ schluessel: false \};/.test(f), "ohne Schlüssel kein Abruf");
assert.ok(/AbortSignal\.timeout\(4000\)/.test(f) && /30 \* 60000/.test(f), "Zeitlimit und Zwischenspeicher");
assert.ok(/const verbrauchP = neonVerbrauch\(\);/.test(server) && /verbrauch, \/\/ KC-NEON-PRUEFUNG/.test(server) && /archiv: ng\.metrics\?\.archiv \?\? null/.test(server), "Bericht liefert Verbrauch und Archiv");
// 3. App: Rechnung mit den Zahlen vom 26.10.2026
const grab = (n) => { const i = app.indexOf("function " + n + "("); assert.ok(i > 0, n); let d = 0; for (let k = app.indexOf("{", i); ; k++) { if (app[k] === "{") d++; if (app[k] === "}" && !--d) return app.slice(i, k + 1); } };
const mb = (b) => Math.round(b / 1048576) + " MB", esc = (x) => x, lampe = (fa) => `[${fa}]`, seitText = () => "jetzt", adZeile = (fa, n, t) => `[${fa}] ${n}: ${t}`;
const np = new Function("mb", "esc", "lampe", "seitText", "adZeile", grab("neonPruefBalken") + grab("neonPruefung") + "; return neonPruefung;")(mb, esc, lampe, seitText, adZeile);
const html = np({ verbrauch: { schluessel: true, zeit: "2026-10-26T04:50:00Z", rechenStd: 15.4, aktivStd: 60.6, uebertragung: 1114616377, ab: "2026-10-01T00:00:00Z", bis: "2026-11-01T00:00:00Z", rechenGrenze: 100, uebertragGrenze: 5 * 1073741824 },
  groesse: { bytes: 410976256, grenze: 1073741824, archiv: { bytes: 341172224, saetze: 12, nutz: 282000000, letzter: 47184460, behalten_max: 14 } } }).replace(/<[^>]+>/g, " ");
assert.ok(/\[gruen\]\s+⚙️ Rechenzeit/.test(html) && /Hochrechnung 18,9 %/.test(html), "Rechenzeit grün, Hochrechnung aufs Monatsende");
assert.ok(/\[gelb\]\s+🔮 Speicher-Prognose/.test(html) && /829 MB \/ 1024 MB/.test(html), "Prognose gelb ab 80 %");
assert.ok(/Neon-Schlüssel fehlt/.test(np({ verbrauch: { schluessel: false } })), "fehlender Schlüssel wird angezeigt");
assert.equal(np(null), "", "ohne Daten nichts anzeigen");
assert.ok(/\$\{id === "neon" \? neonPruefung\(r\?\.spiegel\) : ""\}/.test(app), "nur in der Kachel Neon");
console.log("neon-pruefung: alle Prüfungen bestanden");
