// KC-CLUB-ANRUF-BESSER (21.10.2026, Wunsch Hansi „bau 2 bis 4 jetzt“): statische Prüfung der Anruf-Verbesserungen (offline, ohne Server).
// Aufruf: node tests/anruf-besser.test.mjs  ·  Browser-Test mit zwei echten WebRTC-Seiten: node tools/anruf/anruf-browser.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.726.0 KC-CLUB-TEILE: app.js + teile/*.js

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), seite = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts");
const fall = (name) => { const i = server.indexOf(`case "${name}": {`); assert.ok(i > 0, `Server-Aktion ${name} fehlt`); return server.slice(i, server.indexOf("\n      }\n", i)); };

// 2. ICE-Neustart: Server-Aktionen nur für die beiden Beteiligten, nur laufende Einzelgespräche, SDP-Grenze wie beim Anrufen
{
  const ang = fall("anruf_neu_angebot"), ant = fall("anruf_neu_antwort");
  for (const [n, c, rolle] of [["anruf_neu_angebot", ang, "a.von"], ["anruf_neu_antwort", ant, "a.an"]]) {
    assert.ok(/await anrufHolen\(ich, p\.id\)/.test(c), n + ": nur Anrufer/Angerufener (anrufHolen)");
    assert.ok(c.includes(`if (${rolle} !== ich.person_id) throw new Fehler(`), n + ": richtige Seite");
    assert.ok(/a\.status !== "angenommen" \|\| a\.konferenz_id/.test(c), n + ": nur laufendes Einzelgespräch");
    assert.ok(/sdpText\(p\.(angebot|antwort)\)/.test(c), n + ": SDP-Grenze (sdpText)");
  }
  assert.ok(/angebot: sdpText\(p\.angebot\), antwort: null/.test(ang), "neues Angebot leert die Antwort (Trigger → Signal „anruf“)");
  assert.ok(/String\(p\.fuer \|\| ""\) !== ufrag/.test(ant) && /\.is\("antwort", null\)/.test(ant), "Antwort muss zum aktuellen Angebot gehören");
}
// App: Neustart-Ablauf
assert.ok(/createOffer\(opt\)/.test(app) && /rufBeschreibung\(pc, true, \{ iceRestart: true \}\)/.test(app), "Anrufer: Angebot mit iceRestart");
assert.ok(/api\("anruf_neu_angebot", \{ id: R\.id, angebot: pc\.localDescription\.sdp \}\)/.test(app), "App schickt neues Angebot");
assert.ok(/api\("anruf_neu_antwort", \{ id: R\.id, antwort: pc\.localDescription\.sdp, fuer: sdpUfrag\(angebot\) \}\)/.test(app), "App schickt neue Antwort mit ufrag");
assert.ok(/const RUF_NEU = \{ wackel: 3000, versuche: 3, frist: 30000/.test(app), "3 Versuche in 30 s, Wackeln ab 3 s");
assert.ok(/if \(N\.n >= RUF_NEU\.versuche \|\| Date\.now\(\) - N\.seit > RUF_NEU\.frist\) return anrufFehlgeschlagen\(\)/.test(app), "danach bisherige Fehlerbehandlung");
assert.ok(/if \(s === "failed"\) \{ if \(R\.konf\) konfBeinWeg\(R\.id, true\); else if \(R\.verbunden\) rufGestoert\(R\); else anrufFehlgeschlagen\(\); \}/.test(app), "failed: Konferenz wie bisher, Gespräch → Neuaufbau");
assert.ok(/navigator\.connection\?\.addEventListener\?\.\("change", anrufNetzWechsel\)/.test(app) && /addEventListener\("online", anrufNetzWechsel\)/.test(app), "Netzwechsel/online → früher Neustart");
assert.ok(app.includes("🔄 Verbindung wird neu aufgebaut …"), "Hinweis beim Neuaufbau");
assert.ok(/rufNeuWeg\(RUF\); clearInterval\(RUF\.q\?\.uhr\)/.test(app), "Aufräumen: Neuaufbau- und Statistik-Zeitgeber");
// jede neue App-Aktion kennt der Server
for (const a of ["anruf_neu_angebot", "anruf_neu_antwort"]) assert.ok(app.includes(`api("${a}"`) && server.includes(`case "${a}"`), a + " in App und Server");

// 3. Schneller Aufbau, ohne mehr Last im Gespräch
assert.ok(/function iceFertig\(pc, ms = 3000, frueh = 1500\)/.test(app) && /\/ typ \(srflx\|relay\)\//.test(app), "ICE: früh fertig mit srflx, harte Grenze 3 s");
{
  const i = app.indexOf("function rufTaktWahl("), t = app.slice(i, app.indexOf("\n}\n", i));
  assert.ok(i > 0, "rufTaktWahl vorhanden");
  assert.ok(/R\.pc\?\.remoteDescription \? \(rt \? 6000 : 3000\)/.test(t), "im Gespräch: 6 s mit Leitung, 3 s ohne (vorher 3 s)");
  assert.ok(/R\.rolle === "rufer" \? \(rt \? 3000 : jetzt - \(R\.klingelSeit \|\| 0\) < 20000 \? 1000 : 1500\)/.test(t), "Klingeln (Anrufer): 3 s mit Leitung, sonst 1 s für 20 s");
  assert.ok(/: \(rt \? 3000 : 2000\);/.test(t), "Klingeln (Angerufener): nicht öfter als vorher");
}
assert.ok(!/RUF\.poll = setInterval\(anrufPruefen, (1500|2000|3000)\)/.test(app), "keine festen alten Takte mehr");
assert.ok(/if \(s\.art === "klopfen" \|\| s\.art === "anruf"\) \{ onlinePing\(\); if \(RUF\?\.id\) anrufPruefen\(\); return; \}/.test(app), "Signal „anruf“ der direkten Leitung holt sofort den Stand");
assert.ok(/if \(RUF\.pruefe\) \{ RUF\.nochmal = true; return; \}/.test(app), "Signal während einer Abfrage geht nicht verloren");

// 4. Schwaches Netz
assert.ok(/audio: \{ echoCancellation: true, noiseSuppression: true, autoGainControl: true \}/.test(app), "Mikrofon mit automatischer Lautstärke");
assert.ok(/function sdpOpus\(sdp\)/.test(app) && /useinbandfec=1;usedtx=1/.test(app) && /if \(!\/useinbandfec=\/\.test\(z\[i\]\)\) z\[i\] \+= ";useinbandfec=1"/.test(app), "Opus: FEC/DTX nur ergänzen, wenn es fehlt");
assert.ok(/p\.degradationPreference = "balanced"/.test(app) && /stufen: \[500000, 150000, 150000\]/.test(app), "Video: 500 kbit/s Start, dann 150, dann pausiert");
assert.ok(/const RUF_Q = \{ takt: 3000, verlust: 0\.08, rtt: 0\.6/.test(app), "Messung alle 3 s, Grenzen 8 % / 600 ms");
assert.ok(app.includes("📶 Verbindung schwach") && app.includes("Bild pausiert – Ton läuft weiter"), "Hinweise im Anrufbildschirm");
assert.ok(/<div class="anruf-schwach versteckt" id="anrufSchwach" role="status"><\/div>/.test(seite) && /\.anruf-schwach \{/.test(seite), "Hinweisfeld in index.html");

console.log("anruf-besser: alles ok");
