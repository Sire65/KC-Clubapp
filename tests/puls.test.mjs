// KC-CLUB-PULS (Wunsch Hansi 16.11.2026: Aussteuerungsanzeige wie am Mischpult im Kopf beim Admin – „Statusleisten senkrecht, nur Club-App messen,
// ja abschaltbar unter Zahnrad bei Admin“). Aufruf: node tests/puls.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), html = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261116_kc_club_puls.sql");
const o = mig.replace(/--[^\n]*/g, "");
// Datenbank: nur Zählerstände, nur Club-Server, nichts gespeichert
assert.ok(/language sql stable security definer/.test(o) && !/\b(insert|update|delete)\b\s+(into|public|from)/i.test(o.replace(/'[^']*'/g, "")), "nur lesen");
assert.ok(/revoke all on function public\.kc_club_puls\(\) from public, anon, authenticated;/.test(mig) && /grant execute on function public\.kc_club_puls\(\) to service_role;/.test(mig), "nur der Club-Server");
assert.ok(/r\.rolname = 'service_role' and st\.query ~\* '\(kc_club_\|kc_communication_\|kc_core_people\)'/.test(mig), "nur Club-App (Club-Server auf Club-Tabellen)");
assert.ok(/st\.query !~\* 'kc_club_puls'/.test(mig), "die Anzeige zählt sich nicht selbst");
assert.ok(!/query'?,|'query'/.test(o) && /'lesen', /.test(o) && /'schreiben', /.test(o) && /'online', /.test(o), "nur Summen, keine Abfragetexte");
// Server: nur Admin
const fall = server.slice(server.indexOf('case "betrieb_puls": {'), server.indexOf("// ----- KC-CLUB-GEMEINSCHAFTSGERICHT: einreichen"));
assert.ok(/nurAdmin\(ich\);/.test(fall) && /db\.rpc\("kc_club_puls"\)/.test(fall), "Server: nur Admin");
// App: senkrechte Säulen in der Statusleiste, nur Admin, abschaltbar, nur Startseite sichtbar
assert.ok(/id="leds"[^\n]*<\/button><button class="puls versteckt" id="pulsAnzeige"/.test(html), "neben den LEDs in der Statusleiste");
assert.ok(/\.pu-saeule \{ display: flex; flex-direction: column-reverse;/.test(html), "senkrecht, von unten nach oben");
assert.ok(/id="setPuls" onchange="einstellung\('puls', this\.checked\);pulsStarten\(\)"/.test(html) && /\["setPuls", "puls"\]/.test(app), "Schalter unter ⚙️");
assert.ok(/const pulsAn = \(\) => !!ICH\?\.admin && einst\("puls", true\);/.test(app) && /\$\("setPulsZeile"\)\.classList\.toggle\("versteckt", !ICH\?\.admin\)/.test(app), "nur Admin, Standard an");
assert.ok(/if \(!document\.hidden && aktuelleAnsicht === "start"\) \{/.test(app) && /PULS_TAKT = 15000/.test(app), "nur sichtbar und auf der Startseite, alle 15 s (18.11. sparsam)");
// Ausschlag: logarithmisch, 8 Stufen (5 grün, 2 gelb, 1 rot)
const R = new Function(app.slice(app.indexOf("const PULS_TAKT"), app.indexOf("const pulsSaeule")) + "; return { pulsStufe, PULS_MAX };")();
assert.equal(R.pulsStufe(0, 15), 0); assert.equal(R.pulsStufe(0.1, 15), 1, "schon wenig leuchtet einmal");
assert.equal(R.pulsStufe(15, 15), 8); assert.equal(R.pulsStufe(100, 15), 8, "nie über Vollausschlag");
assert.ok(R.pulsStufe(3, 15) >= 3 && R.pulsStufe(3, 15) <= 5, "mittlere Last ≈ Mitte");
assert.ok(/i >= PULS_SEG - 1 \? "rot" : i >= PULS_SEG - 3 \? "gelb" : "gruen"/.test(app), "5 grün, 2 gelb, 1 rot");
// Fund Hansi 16.11.: die 🐢 (Sparmodus) passte neben den Säulen nicht mehr in die Leiste → klein an den Säulen, Erklärung im Fenster
assert.ok(/html\.spar \.puls \.pu-spar \{ display: block; \} html\.spar \.statusleiste:has\(#pulsAnzeige:not\(\.versteckt\)\) #sparZeichen \{ display: none; \}/.test(html), "Schildkröte an den Säulen statt daneben");
assert.ok(/<span class="pu-spar" aria-hidden="true">🐢<\/span>/.test(app) && /🐢 <b>Sparmodus ist an<\/b>/.test(app) && /sparInfo\(\)/.test(app), "Sparmodus im Fenster erklärt");
console.log("✅ puls: alle Prüfungen bestanden");
