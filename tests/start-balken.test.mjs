// KC-CLUB-START-BALKEN (Wunsch Hansi 08.11.2026): Ladeanzeige beim Start mit Fortschritt in Prozent und Dauer. Aufruf: node tests/start-balken.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const seite = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(/id="appLaedtBalken" role="progressbar" aria-label="Ladefortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"/.test(seite) && seite.includes('<div class="app-laedt-zahl" id="appLaedtZahl" aria-hidden="true">0 %</div>'), "Balken mit Prozent (barrierearm)");
assert.equal((seite.match(/<script>/g) || []).length, 1, "kein weiteres eingebettetes Skript (Regel: nur der Fehler-Wächter)");
const kopf = seite.slice(seite.indexOf("<script>"), seite.indexOf("</script>"));
assert.ok(kopf.includes("// KC-CLUB-START-BALKEN") && kopf.includes('localStorage.getItem("kc_club_startmess")') && kopf.includes("upd = typeof durchUpdate"), "Schätzung aus den letzten Starts, Update erkannt");
// Rechnung: nähert sich 95 %, bei der erwarteten Dauer ~90 %
const pct = (t, erw) => Math.min(95, Math.round(95 * (1 - Math.exp(-2.3 * t / erw))));
assert.ok(kopf.includes("pct = Math.min(95, Math.round(95 * (1 - Math.exp(-2.3 * t / erw))))"), "gleiche Formel");
assert.equal(pct(0, 2000), 0); assert.ok(pct(2000, 2000) >= 85 && pct(2000, 2000) <= 90); assert.equal(pct(60000, 2000), 95, "nie 100 %, bevor das Programm läuft");
assert.ok(kopf.includes('zahl.textContent = pct + " % · " + (t / 1000).toFixed(1).replace(".", ",") + " s";'), "Prozent und Sekunden");
assert.ok(kopf.includes("🔄 Die neue Version wird eingerichtet …") && kopf.includes("dauert heute etwas länger"), "erklärt Update und lange Starts");
assert.ok(kopf.includes('if (!document.getElementById("appLaedt")) return;'), "endet, sobald das Programm die Anzeige entfernt");
// Skript im Kopf läuft fehlerfrei an
new Function(kopf.slice("<script>".length));
console.log("start-balken: ok");
