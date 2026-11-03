// KC-CLUB-INST-BILDER (2.844.0, Wunsch Hansi 03.11.2026): Installieren mit Bildern – je Browser Schritt für Schritt, Bilder aus den nachgebauten Browsern
// der Installations-Videos, Text wie auf den Anleitungs-Blättern. Aufruf: node tests/inst-bilder.test.mjs (offline)
import assert from "node:assert/strict";
import fs from "node:fs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const vid = lies("teile/videos.js"), app = lies("app.js"), html = lies("index.html");
// Registry und Bilder echt ausführen: die Bild-Bausteine der Installations-Videos + INST_BILDER (ohne Seite; $ findet nichts)
const bau = vid.slice(vid.indexOf("const RG_INST_CODE = "), vid.indexOf("const RG_INST_CODES = "));
const reg = vid.slice(vid.indexOf("const CHROME_MENUE = "), vid.indexOf("const IB = { id: null"));
assert.ok(bau.length > 1000 && reg.length > 1000, "Bausteine gefunden");
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const INST_BILDER = new Function("esc", "APP_URL_CLUB", "$", "rgInstErkannt", `${bau}\n${reg}\nreturn INST_BILDER;`)(esc, "https://sire65.github.io/KC-Clubapp/", () => null, () => "chrome");
const ids = INST_BILDER.map((b) => b.id);
assert.deepEqual(ids, ["chrome", "samsung", "edge", "firefox", "safari", "ipad", "pc"], "Geräte/Browser");
// Jedes Blatt gibt es im Ordner Anleitungen, jedes Video im Video-Katalog
const liste = JSON.parse(lies("dokumente/anleitungen/liste.json")).blaetter.map((b) => b.id);
for (const b of INST_BILDER) {
  assert.ok(liste.includes(b.blatt), "Blatt fehlt: " + b.blatt);
  assert.ok(new RegExp(`\\{ id: "${b.video}", stand:`).test(app), "Video fehlt: " + b.video);
  const s = b.schritte();
  assert.ok(s.length >= 3 && s.length <= 6, b.id + ": 3–6 Schritte");
  s.forEach((x, i) => {
    assert.ok(x.t && x.x && typeof x.bild === "function" && x.ziel, `${b.id} ${i + 1}: t, x, bild, ziel`);
    const bild = x.bild();
    // die Stelle zum Antippen steckt im Bild (die Anmeldeseite wird in der App aus #gesperrt geklont – hier ohne Seite leer)
    if (x.ziel !== "code") assert.ok(bild.includes(`data-s="${x.ziel}"`), `${b.id} ${i + 1}: Ziel „${x.ziel}“ nicht im Bild`);
    else assert.ok(/simAnmeldung\(/.test(String(x.bild)), `${b.id} ${i + 1}: Anmeldeseite`);
  });
}
// Text wie auf den Anleitungs-Blättern (gleiche Wörter wie einrichtenSchritteRoh, aus dem die Blätter erzeugt werden)
const roh = app.slice(app.indexOf("function einrichtenSchritteRoh(g, S) {"), app.indexOf("// einmal je Gerät von selbst"));
for (const satz of ["Oben rechts auf <b>⋮</b> (drei Punkte) tippen.", "Unten rechts auf <b>≡</b> (drei Striche) tippen.", "<b>„Seite hinzufügen zu“</b> antippen (manchmal: <b>„Hinzufügen zu“</b>).",
  "Im Fenster auf <b>„Installieren“</b> tippen. Fragt das Handy, ob etwas auf den Startbildschirm darf: <b>„Zulassen“</b>.", "<b>„Zum Home-Bildschirm“</b> antippen (manchmal: <b>„Zum Startbildschirm“</b>)."])
  assert.ok(roh.includes(satz) && reg.includes(satz), "gleicher Text wie die Anleitung: " + satz);
// Einstieg: nachladbar über den Platzhalter, Knöpfe in den Einstellungen und im Einrichten-Fenster
assert.ok(/videos: \{ einstieg: \[[^\]]*"installAnleitung"/.test(app), "installAnleitung als Einstieg des Teils videos");
assert.ok(html.includes('<button class="knopf" onclick="installAnleitung()">🖼️ Mit Bildern zeigen</button>'), "Knopf in ⚙️ → App-Installation");
assert.ok(app.includes('f.querySelector("[data-bilder]")?.addEventListener("click", () => { f.remove(); installAnleitung(); });') && app.includes('data-bilder="1">🖼️ Mit Bildern</button>'), "Knopf im Einrichten-Fenster");
// Bedienung: eigenes Gerät vorgewählt, Zurück/Weiter, PDF aus dem Ordner Anleitungen, Video; Bild verkleinert, nie antippbar
assert.ok(vid.includes('function ibErkannt() { const g = einrichtenGeraet(); return g.pc ? "pc" : g.ipad ? "ipad" : g.ios ? "safari"'), "Gerät erkennen");
assert.ok(vid.includes('onclick="ibBlaettern(-1)">‹ Zurück</button>') && vid.includes('onclick="ibBlaettern(1)">Weiter ›</button>'), "Blättern");
assert.ok(vid.includes('url: APP_URL_CLUB + "dokumente/anleitungen/" + b.blatt + ".pdf"'), "PDF aus dem Ordner Anleitungen");
assert.ok(/\.ib-rahmen \{[^}]*pointer-events: none/.test(html) && /\.ib-nav \{ position: sticky/.test(html) && /prefers-reduced-motion: reduce\) \{ \.ib-ziel \{ animation: none/.test(html), "CSS");
assert.ok(/aria-hidden="true"><div class="ib-bild/.test(vid), "Bild für Vorleser ausgeblendet (Text steht darüber)");
console.log("inst-bilder: ok");
