// KC-CLUB-ANRUF-TURN (2.563.0, 21.10.2026, Wunsch Hansi „als Sicherheit beim Anrufen und Video“): Umleitungs-Server (TURN, Metered).
// Aufruf: node tests/anruf-turn.test.mjs (offline)  ·  Browser-Test mit echter Umleitung: node tools/anruf/anruf-turn-browser.mjs <node-turn-ordner>
import fs from "node:fs";
import assert from "node:assert/strict";
import { TURN, turnPlan, turnZeile, turnIce, turnAppBis } from "../supabase/functions/kc-club/turn-vorrat.js";
import { programmText } from "./programm.mjs"; // 2.726.0 KC-CLUB-TEILE: app.js + teile/*.js

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), server = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261021_kc_club_v2563_anruf_turn.sql");
const fall = (name) => { const i = server.indexOf(`case "${name}": {`); assert.ok(i > 0, `Server-Aktion ${name} fehlt`); return server.slice(i, server.indexOf("\n      }\n", i)); };

// ---------- 1. Vorrat (rein) ----------
const T0 = Date.parse("2026-10-21T12:00:00Z"), iso = (ms) => new Date(T0 + ms).toISOString(), MIN = 60000, STD = 3600000, TAG = 86400000;
const z = (name, erstellt, nutzbar, gueltig) => ({ username: name, password: "pw-" + name, erstellt_am: iso(erstellt), nutzbar_ab: iso(nutzbar), gueltig_bis: iso(gueltig) });
{
  let p = turnPlan([], T0);
  assert.deepEqual(p, { nutzbar: null, neu: true }, "leerer Vorrat → neu anlegen, noch nichts nutzbar");
  p = turnPlan([z("a", -1 * MIN, 2 * MIN, 7 * TAG)], T0);
  assert.equal(p.nutzbar, null, "gerade angelegt → noch nicht nutzbar (Verteilung bei Metered bis 2 Min.)");
  assert.equal(p.neu, false, "gerade angelegt → nicht gleich noch einen (auch nicht von anderer Server-Instanz)");
  p = turnPlan([z("a", -5 * MIN, -2 * MIN, 7 * TAG)], T0);
  assert.equal(p.nutzbar?.username, "a", "nach der Wartezeit nutzbar");
  assert.equal(p.neu, false, "genug Restlaufzeit → kein neuer");
  p = turnPlan([z("a", -6 * TAG, -6 * TAG, TAG)], T0);
  assert.equal(p.nutzbar?.username, "a", "1 Tag Rest → alter gilt weiter …");
  assert.equal(p.neu, true, "… aber ein neuer wird angelegt (ab 2 Tagen Rest)");
  p = turnPlan([z("b", -1 * MIN, 2 * MIN, 7 * TAG), z("a", -6 * TAG, -6 * TAG, TAG)], T0);
  assert.equal(p.nutzbar?.username, "a", "neuer wartet noch → alter weiter nutzbar");
  assert.equal(p.neu, false, "neuer schon angelegt → keiner mehr");
  p = turnPlan([z("b", -10 * MIN, -7 * MIN, 7 * TAG), z("a", -6 * TAG, -6 * TAG, TAG)], T0);
  assert.equal(p.nutzbar?.username, "b", "neuer nutzbar → der neueste wird genommen");
  p = turnPlan([z("a", -7 * TAG, -7 * TAG, 30 * MIN)], T0);
  assert.equal(p.nutzbar, null, "weniger als 1 Std. Rest → nicht mehr ausgeben");
  assert.equal(p.neu, true, "… und neu anlegen");
  assert.equal(turnPlan([], T0, T0 + 5 * MIN).neu, false, "nach einem Metered-Fehler 10 Min. Pause (keine Abfrage-Flut)");
  assert.equal(turnPlan([], T0, T0 - 1).neu, true, "nach der Pause wieder versuchen");
  assert.equal(turnPlan([{ username: "x", password: "", gueltig_bis: iso(7 * TAG), nutzbar_ab: iso(-TAG), erstellt_am: iso(-TAG) }], T0).nutzbar, null, "Zeile ohne Passwort wird nie ausgegeben");
  assert.equal(turnPlan(null, T0).neu, true, "kaputte Liste wirft nicht");
}
{
  const r = turnZeile({ username: "u1", password: "p1", expiryInSeconds: 604800, apiKey: "k" }, T0);
  assert.deepEqual(r, { username: "u1", password: "p1", gueltig_bis: iso(7 * TAG), nutzbar_ab: iso(3 * MIN) }, "Zeile: 7 Tage gültig, nutzbar ab +3 Min., kein apiKey gespeichert");
  assert.equal(turnZeile({ username: "u1" }, T0), null, "ohne Passwort → keine Zeile");
  assert.equal(turnZeile(null, T0), null, "leere Antwort → keine Zeile");
  assert.equal(TURN.gueltigSek, 7 * 86400);
  const ice = turnIce("global.relay.metered.ca", "u1", "p1");
  assert.equal(ice.length, 1, "nur die Umleitung, kein zusätzlicher STUN-Server von Metered");
  assert.deepEqual(ice[0].urls, ["turn:global.relay.metered.ca:80", "turn:global.relay.metered.ca:80?transport=tcp", "turn:global.relay.metered.ca:443", "turns:global.relay.metered.ca:443?transport=tcp"], "UDP/TCP 80, UDP 443, TLS 443 (Firmen-WLAN)");
  assert.equal(ice[0].username, "u1"); assert.equal(ice[0].credential, "p1");
  assert.equal(turnAppBis(iso(7 * TAG), T0), iso(6 * STD), "App merkt höchstens 6 Std.");
  assert.equal(turnAppBis(iso(2 * STD), T0), iso(STD), "… und höchstens bis 1 Std. vor Ablauf");
}

// ---------- 2. Server ----------
{
  const w = fall("anruf_wege"), s = fall("turn_status");
  assert.ok(/const z = await turnZugang\(\);/.test(w) && /ice: z\?\.ice \?\? \[\]/.test(w), "anruf_wege: Wege oder leere Liste");
  assert.ok(!/turnSchluessel|secretKey|password/.test(w), "anruf_wege gibt nie den Metered-Schlüssel heraus");
  assert.ok(/nurAdmin\(ich\);/.test(s), "turn_status nur für den Admin");
  assert.ok(!/password|username|ice:/.test(s.replace(/select\("username"/, "")), "turn_status zeigt weder Passwort noch Zugangsdaten");
  assert.ok(/if \(!turnSchluessel\(\)\) return json\(\{ eingerichtet: false \}\)/.test(s), "ohne Schlüssel: „nicht eingerichtet“ (nie OK)");
  assert.ok(/Deno\.env\.get\("METERED_TURN_SECRET_KEY"\)/.test(server), "Schlüssel nur aus den Supabase-Geheimnissen");
  assert.ok(!/METERED_TURN_SECRET_KEY/.test(app), "Schlüssel nie in der App");
  const zg = server.slice(server.indexOf("async function turnZugang("), server.indexOf("// KC-CLUB-KONFERENZ (0.82.0)"));
  assert.ok(/\} catch \{ return null; \}\n\}/.test(zg), "turnZugang wirft nie (ein Anruf scheitert nicht an der Umleitung)");
  assert.ok(/TURN_FEHLER_BIS = t \+ TURN\.fehlerPauseMs/.test(zg) && /replace\(\/secretKey=/.test(zg), "Fehler: Pause, Schlüssel nie im Protokoll");
  assert.ok(/signal: AbortSignal\.timeout\(6000\)/.test(server.slice(server.indexOf("async function turnAbruf("))), "Metered-Abruf mit Zeitgrenze");
  assert.ok(/import \{ TURN, turnPlan, turnZeile, turnIce, turnAppBis, turnGrund \} from "\.\/turn-vorrat\.js";/.test(server), "Server nutzt das geprüfte Modul");
}
// Datenbank: nur der Server, nie gespiegelt
assert.ok(/enable row level security/.test(mig) && /revoke all on public\.kc_club_turn_vorrat from public, anon, authenticated;/.test(mig), "Vorrat: RLS, keine Rechte für App/öffentlich");
assert.ok(/grant select, insert, update, delete on public\.kc_club_turn_vorrat to service_role;/.test(mig), "Vorrat: Rechte nur für den Club-Server (KC-SUPABASE-GRANTS)");
assert.ok(/'kc_club_turn_vorrat', 'club', 'secret', false, false, false/.test(mig), "Vorrat: geheim, nicht gespiegelt, nicht gesichert");

// ---------- 3. App ----------
assert.ok(/const iceWarte = rufIce\(\);/.test(app) && /new RTCPeerConnection\(\{ iceServers: await iceWarte \}\)/.test(app), "Anruf/Annehmen: Wege gleichzeitig mit Mikrofon/Kamera holen");
assert.ok(/new RTCPeerConnection\(\{ iceServers: rufIceJetzt\(\) \}\)/.test(app), "Konferenz-Verbindungen mit den gemerkten Wegen");
assert.ok(!/new RTCPeerConnection\(\{ iceServers: ICE \}\)/.test(app), "keine Verbindung mehr nur mit STUN, wenn Umleitung da ist");
assert.ok(/setTimeout\(\(\) => nein\(new Error\("Zeit"\)\), 2500\)/.test(app), "höchstens 2,5 s auf die Wege warten");
assert.ok(/const rufIceJetzt = \(\) => \(RUF_ICE && Date\.now\(\) < RUF_ICE\.bis \? \[\.\.\.ICE, \.\.\.RUF_ICE\.liste\] : ICE\);/.test(app), "STUN bleibt immer dabei");
assert.ok(!/iceTransportPolicy/.test(app), "App erzwingt nie die Umleitung – nur wenn kein direkter Weg klappt");
assert.ok(/umleitung: 300000/.test(app) && /const rufQRate = \(R, stufe\) => \(R\?\.weg === "umleitung" \? Math\.min\(RUF_Q\.stufen\[stufe\], RUF_Q\.umleitung\) : RUF_Q\.stufen\[stufe\]\);/.test(app), "über Umleitung Bild höchstens 300 kbit/s");
assert.ok(/kand\[paar\.localCandidateId\] === "relay" \|\| kand\[paar\.remoteCandidateId\] === "relay"/.test(app), "Umleitung erkannt an beiden Enden");
assert.ok(/daten: \{ verbunden: true, dauer, rolle, umleitung \}/.test(app) && /umleitungDa: !!RUF_ICE\?\.liste\?\.length/.test(app), "Messung: wie oft Umleitung gebraucht/vorhanden");
for (const set of ["WARTEN_STILL", "LADE_NIE", "FP_LEISE"]) assert.ok(new RegExp(`const ${set} = new Set\\(\\[[^\\]]*"anruf_wege"`).test(app), `anruf_wege still im Hintergrund (${set})`);
assert.ok(app.includes('api("anruf_wege"') && server.includes('case "anruf_wege"') && app.includes('api("turn_status"') && server.includes('case "turn_status"'), "App-Aktionen kennt der Server");
assert.ok(/id: "anruf_umleitung", thema: "privat"/.test(app) && /verschlüsselt/.test(app.slice(app.indexOf('id: "anruf_umleitung"'), app.indexOf('id: "anruf_umleitung"') + 900)) && /30 Tage/.test(app.slice(app.indexOf('id: "anruf_umleitung"'), app.indexOf('id: "anruf_umleitung"') + 1200)) && /bei jedem Anruf/.test(app.slice(app.indexOf('id: "anruf_umleitung"'), app.indexOf('id: "anruf_umleitung"') + 1200)), "Hilfe/Datenschutz: Anbieter, verschlüsselt, IP bei jedem Anruf, 30 Tage");
assert.ok(/"🛰️ Umleitung für Anrufe \(Metered\)"/.test(app) && /async function adTurnLaden\(/.test(app), "Admin → Notfall: Lämpchen „Umleitung für Anrufe“");
assert.ok(/kurz: "unbekannt"/.test(app.slice(app.indexOf("async function adTurnLaden("), app.indexOf("async function adZweitLaden("))), "Lämpchen: unbekannt bleibt grau, nie grün");

console.log("anruf-turn: alles ok");

// ---------- 4. 2.565.0 KC-CLUB-ANRUF-TURN-GRUND: Absagen von Metered verständlich machen ----------
{
  const { turnGrund } = await import("../supabase/functions/kc-club/turn-vorrat.js");
  const echt = 'Metered 400: {"message":"please subscribe to a TURN Server plan before using this API"}';
  assert.equal(turnGrund(echt).code, "kein_plan", "echte Meldung vom 21.10. → „kein Plan gewählt“");
  assert.ok(/Plans & pricing/.test(turnGrund(echt).text) && /Free-Plan/.test(turnGrund(echt).text) && /Karte/.test(turnGrund(echt).text), "Anweisung: Free-Plan wählen, keine Karte");
  assert.equal(turnGrund("Metered 401: unauthorized").code, "schluessel");
  assert.equal(turnGrund("Metered 403: {}").code, "schluessel");
  assert.ok(/METERED_TURN_SECRET_KEY/.test(turnGrund("Metered 401").text), "Schlüssel-Hinweis nennt das Geheimnis");
  assert.equal(turnGrund("Metered 404: not found").code, "app");
  assert.equal(turnGrund('Metered 400: {"message":"quota exceeded"}').code, "kontingent");
  assert.ok(/Kein Guthaben aufladen/.test(turnGrund("quota exceeded").text), "Kontingent: nie aufladen (kostenlos bleiben)");
  assert.equal(turnGrund("TimeoutError: Signal timed out.").code, "netz");
  assert.equal(turnGrund("Metered 502: bad gateway").code, "netz");
  const u = turnGrund('Metered 400: {"message":"irgendwas Neues"}');
  assert.equal(u.code, "unbekannt"); assert.ok(u.text.includes("„irgendwas Neues“"), "unbekannte Meldung wird gezeigt");
  const geheim = turnGrund('Metered 400: https://x.metered.live/api?secretKey=GEHEIM123 {"password":"pw9","message":"x"}');
  assert.ok(!/GEHEIM123|pw9/.test(JSON.stringify(geheim)), "Schlüssel und Passwort nie im Grund");
  assert.equal(turnGrund(undefined).code, "unbekannt", "leer wirft nicht");
  const s = fall("turn_status");
  assert.ok(/TURN_FEHLER_BIS = 0; const z = await turnZugang\(\);/.test(s), "Admin-Abfrage versucht sofort neu (keine 10-Min.-Pause)");
  assert.ok(/grund: !z && TURN_GRUND \? \{ code: TURN_GRUND\.code, kurz: TURN_GRUND\.kurz, text: TURN_GRUND\.text \} : null/.test(s), "Grund nur ohne nutzbare Zugangsdaten, ohne Rohtext");
  assert.ok(/try \{ await turnNeu\(\); TURN_GRUND = null; \} catch \(e\) \{[^}]*TURN_GRUND = \{ \.\.\.turnGrund\(/.test(server), "Erfolg löscht den Grund, Fehler setzt ihn");
  assert.ok(/r\.grund\?\.text \? \{ f: "rot", kurz: String\(r\.grund\.kurz \|\| "gestört"\)/.test(app), "Lämpchen zeigt den erkannten Grund");
}
console.log("anruf-turn (Grund): alles ok");
