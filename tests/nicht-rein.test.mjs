// KC-CLUB-NICHT-REIN + KC-CLUB-FEHLVERSUCHE-WECHSELND (2.874.0, Fund Hansi 06.11.2026: ein Mitglied kam tagelang nicht in die App).
// Aufruf: node tests/nicht-rein.test.mjs (offline)
import assert from "node:assert/strict";
import fs from "node:fs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), html = lies("index.html"), srv = lies("supabase/functions/kc-club/index.ts");
// Anmeldeseite: Karte „Ich komme nicht rein“ mit Name und Knopf – innerhalb von #gesperrt
const gesperrt = html.slice(html.indexOf('<div id="gesperrt"'), html.indexOf('<div id="app"'));
assert.ok(gesperrt.includes("<h3>🆘 Ich komme nicht rein</h3>") && gesperrt.includes('id="nrName"') && gesperrt.includes('onclick="nichtReinMelden()"'), "Karte auf der Anmeldeseite");
// Meldung über den anonymen Hilferuf (mit Alarm an die Admins), Name Pflicht, kein Link/Schlüssel im Text
const f = app.slice(app.indexOf("function nichtReinMelden() {"), app.indexOf("async function fpProblemMelden() {"));
assert.ok(f.includes('fpNeu("hilferuf_anonym", {') && f.includes("window.KCFP?.senden(true)") && f.includes("name.length < 2"), "Hilferuf mit Name");
assert.ok(!/KEY|\?k=/.test(f), "kein Schlüssel im Hilferuf");
assert.ok(/const alarm = neu\.find\(\(e: any\) => \["start_kaputt", "hilferuf_anonym"\]\.includes/.test(srv), "Server alarmiert bei hilferuf_anonym");
// Server: Fehlversuche auch bei wechselnden Geräte-Kennungen (gleiche Browser-Kennung, mind. 2 verschiedene Kennungen)
const fv = srv.slice(srv.indexOf("async function fehlversucheMelden("), srv.indexOf("// KC-CLUB-FEHLER-ALARM (2.48.0"));
assert.ok(fv.includes('async function fehlversucheMelden(geraet: string, e: any, ua = "")'), "UA wird übergeben");
assert.ok(fv.includes('.eq("details->>ua", uaKurz)') && fv.includes("verschiedene >= 2") && fv.includes("(nUa ?? 0) >= FV_SCHWELLE"), "Zählung je Browser-Kennung");
assert.ok(fv.includes("if ((heute ?? 0) >= FV_MAX_TAG) return;") && fv.includes("!(schonUa ?? 0)"), "Grenzen: je Tag, je Browser-Kennung 1×");
assert.ok(srv.includes("nebenbei(fehlversucheMelden(geraet, zf[zf.length - 1], ua).catch("), "Aufruf mit UA");
console.log("nicht-rein: ok");
