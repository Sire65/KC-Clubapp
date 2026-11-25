// 3.25.0 KC-CLUB-DP-GRUSS: Morgengruß am Diensttag und Änderungs-Nachricht aus dem freigegebenen Sollplan
import assert from "node:assert/strict";
import { DPG, dpgHeute, dpgMorgenText, dpgAenderungen, dpgAenderungText, dpgZeit, dpgTag } from "../supabase/functions/kc-club/dp-gruss.js";

const plan = (tage) => ({ tage });
const alt = plan([
  { d: "2026-12-04", leute: [{ n: "Manfred Schoppmann", p: "KC-P-M0011", s: [18, 23] }, { n: "Frank Brösel", p: "KC-P-M0003", s: [19.5, 23] }, { n: "Ohne Id", s: [10, 12] }, { n: "Test", p: "KC-P-TEST-1", s: [10, 12] }], ber: [] },
  { d: "2026-12-05", leute: [{ n: "Manfred Schoppmann", p: "KC-P-M0011", s: null }], ber: [{ n: "Klaus Zander", p: "KC-P-M0009", s: [17, 23] }] },
  { d: "2026-12-01", leute: [{ n: "Frank Brösel", p: "KC-P-M0003", s: [9, 12] }], ber: [] },
]);
const neu = plan([
  { d: "2026-12-04", leute: [{ n: "Manfred Schoppmann", p: "KC-P-M0011", s: [18, 23] }, { n: "Frank Brösel", p: "KC-P-M0003", s: [18, 23] }], ber: [] },
  { d: "2026-12-05", leute: [{ n: "Manfred Schoppmann", p: "KC-P-M0011", s: [17, 23] }, { n: "Klaus Zander", p: "KC-P-M0009", s: [12, 16] }], ber: [{ n: "Klaus Zander", p: "KC-P-M0009", s: [18, 23] }] },
  { d: "2026-12-01", leute: [], ber: [] },
]);

assert.equal(DPG.ab, 8);
assert.equal(dpgZeit([17, 23]), "17:00 – 23:00 Uhr");
assert.equal(dpgZeit([19.5, 23]), "19:30 – 23:00 Uhr");
assert.equal(dpgTag("2026-12-04"), "Fr 04.12.");

// heute: nur gültige Kennungen, Dienst und Bereitschaft je Person
const h = dpgHeute(alt, "2026-12-04");
assert.deepEqual([...h.keys()].sort(), ["KC-P-M0003", "KC-P-M0011"], "ohne/Test-Kennung nicht");
assert.equal(dpgHeute(alt, "2026-12-24").size, 0);

// Text wie von Hansi vorgegeben
const m = dpgMorgenText("Manfred", { dienst: [17, 23], ber: null });
assert.equal(m.text, "Hallo Manfred,\n\nheute hast du Dienst von 17:00 – 23:00 Uhr. Wir wünschen dir einen angenehmen Dienst in der Weihnachtsmarkthütte.\n\nLiebe Grüße\nKöcheclub Werne");
assert.equal(m.titel, "🗓️ Heute hast du Dienst"); assert.equal(m.kurz, "Heute Dienst von 17:00 – 23:00 Uhr");
const b = dpgMorgenText("Klaus", { dienst: [12, 16], ber: [18, 23] });
assert.ok(/heute hast du Dienst von 12:00 – 16:00 Uhr und Bereitschaft von 18:00 – 23:00 Uhr\./.test(b.text));
const nb = dpgMorgenText("Ruth", { dienst: null, ber: [13, 17] });
assert.equal(nb.titel, "🛎️ Heute hast du Bereitschaft"); assert.ok(/Bereitschaft von 13:00 – 17:00 Uhr\. Wir melden uns, falls wir dich brauchen\./.test(nb.text));

// Änderungen ab heute (01.12. liegt davor und zählt nicht)
const ae = dpgAenderungen(alt, neu, "2026-12-02");
assert.deepEqual([...ae.keys()].sort(), ["KC-P-M0003", "KC-P-M0009", "KC-P-M0011"]);
assert.equal(ae.get("KC-P-M0003").tage.length, 1, "Frank nur 04.12.");
const t = dpgAenderungText("Frank", ae.get("KC-P-M0003").tage);
assert.ok(t.text.includes("🗓️ Fr 04.12.: jetzt Dienst 18:00 – 23:00 Uhr (vorher Dienst 19:30 – 23:00 Uhr)"), t.text);
assert.ok(dpgAenderungText("Manfred", ae.get("KC-P-M0011").tage).text.includes("🗓️ Sa 05.12.: jetzt Dienst 17:00 – 23:00 Uhr (neu)"));
assert.ok(dpgAenderungText("Klaus", ae.get("KC-P-M0009").tage).text.includes("jetzt Dienst 12:00 – 16:00 Uhr und Bereitschaft 18:00 – 23:00 Uhr (vorher Bereitschaft 17:00 – 23:00 Uhr)"));
const weg = dpgAenderungen(neu, alt, "2026-12-02").get("KC-P-M0009").tage[0];
assert.ok(dpgAenderungText("Klaus", [weg]).text.includes("jetzt Bereitschaft 17:00 – 23:00 Uhr"));
const ganzWeg = dpgAenderungen(alt, plan([]), "2026-12-02").get("KC-P-M0003").tage[0];
assert.ok(dpgAenderungText("Frank", [ganzWeg]).text.includes("🗓️ Fr 04.12.: kein Dienst mehr (vorher Dienst 19:30 – 23:00 Uhr)"));
assert.equal(dpgAenderungen(neu, neu, "2026-12-01").size, 0, "gleicher Plan → keine Nachricht");
console.log("OK – Dienst-Nachrichten aus dem freigegebenen Sollplan (Morgengruß, Änderungen)");
