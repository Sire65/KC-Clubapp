// 2.787.0 KC-CLUB-HALLOWEEN-FUER-ALLE (Wunsch Hansi 30.10.2026): am 31.10. von 0 bis 24 Uhr deutscher Zeit bei allen 🎃 Halloween,
// ab 1.11. 0 Uhr wieder die eigene Wahl. Aufruf: node tests/halloween-fuer-alle.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const stueck = (anfang, ende) => { const a = app.indexOf(anfang); assert.ok(a >= 0, `${anfang} fehlt`); return app.slice(a, app.indexOf(ende, a) + ende.length); };
const quelle = stueck("const THEMEN = [", "\n];") + "\n" + stueck("const HW_TAG = ", "\n") + stueck("const halloweenFuerAlle = ", "\n") + stueck("function aktivesThema() {", "\n}");
// Uhr, Club-Thema und eigene Wahl von außen vorgeben
const thema = ({ jetzt, club = null, folgen = true, wahl = "aus", kal = "herbst" }) => {
  class Uhr extends Date { constructor(...a) { super(...(a.length ? a : [jetzt])); } }
  return new Function("Date", "TZ", "clubThemaId", "themaClubFolgen", "themaWahl", "THEMA_KAL", quelle + "; return aktivesThema();")(
    Uhr, "Europe/Berlin", () => club, () => folgen, () => wahl, () => kal);
};
const id = (o) => thema(o)?.id ?? null;
// Mitternacht deutsche Zeit (Winterzeit seit 25.10.2026: UTC+1)
assert.equal(id({ jetzt: "2026-10-30T22:59:00Z" }), null, "30.10. 23:59 – noch kein Halloween");
assert.equal(id({ jetzt: "2026-10-30T23:00:00Z" }), "halloween", "31.10. 0:00 – Halloween an");
assert.equal(thema({ jetzt: "2026-10-31T12:00:00Z" }).quelle, "halloween");
assert.equal(id({ jetzt: "2026-10-31T22:59:00Z" }), "halloween", "31.10. 23:59 – noch Halloween");
assert.equal(id({ jetzt: "2026-10-31T23:00:00Z" }), null, "1.11. 0:00 – Halloween aus, wieder „Kein Thema“");
// Vorrang vor eigener Wahl und Club-Thema – danach gilt beides wieder unverändert
assert.equal(id({ jetzt: "2026-10-31T10:00:00Z", wahl: "weihnachten" }), "halloween", "vor eigener Wahl");
assert.equal(id({ jetzt: "2026-10-31T10:00:00Z", club: "simjue" }), "halloween", "vor Club-Thema");
assert.equal(id({ jetzt: "2026-10-31T10:00:00Z", club: "simjue", folgen: false, wahl: "aus" }), "halloween", "auch wer das Club-Thema abgeschaltet hat");
assert.equal(id({ jetzt: "2026-10-31T23:00:00Z", wahl: "weihnachten" }), "weihnachten", "danach wieder die eigene Wahl");
assert.equal(id({ jetzt: "2026-10-31T23:00:00Z", club: "simjue" }), "simjue", "danach wieder das Club-Thema");
assert.equal(thema({ jetzt: "2026-10-31T23:00:00Z", wahl: "auto", kal: "herbst" }).quelle, "kalender", "danach wieder „Nach Kalender“");
// andere Jahre, Sommerzeit-Grenze nicht betroffen (31.10. ist immer nach der Umstellung)
assert.equal(id({ jetzt: "2027-10-30T23:30:00Z" }), "halloween", "2027");
assert.equal(id({ jetzt: "2028-10-31T23:30:00Z" }), null, "2028 nach Mitternacht");
// nichts wird gespeichert: kein localStorage in der Halloween-Regel
assert.ok(!/localStorage/.test(stueck("const halloweenFuerAlle = ", "\n")), "Halloween-Regel speichert nichts");
// Wechsel um Mitternacht: jede Minute prüfen und bei anderem Thema neu zeichnen
assert.match(app, /setInterval\(\(\) => \{ try \{ const id = aktivesThema\(\)\?\.id \|\| null; if \(THEMA_UHR\.id !== "\?" && id !== THEMA_UHR\.id\) themaAnwenden\(\); THEMA_UHR\.id = id; \} catch \{\} \}, 60000\);/, "Minuten-Prüfung fehlt");
assert.match(app, /akt\.quelle === "halloween" \? " – heute für alle bis Mitternacht, danach wieder deine Wahl"/, "Hinweis in ⚙️ → Themen");
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/halloween-fuer-alle.test.mjs"), "läuft in der CI");
console.log("halloween-fuer-alle: ok");
