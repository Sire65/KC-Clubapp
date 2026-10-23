// KC-CLUB-DIENST-TAUSCH (2.606.0, 22.10.2026, Wunsch Hansi): Regeln der Dienst-Tausch-Börse.
// Aufruf: node tests/dienst-tausch.test.mjs (offline)
import assert from "node:assert/strict";
import { DT, dtAnbietenPruefen, dtUeberlapp, dtUebernehmenPruefen, dtWechsel, dtRollen, dtPlanMitTausch, dtText } from "../supabase/functions/kc-club/dienst-tausch.js";

const H = 3600000, T0 = Date.parse("2026-12-05T15:00:00Z"); // Sa 16:00 Berlin
const d = { ref: "s1", startMs: T0, endeMs: T0 + 4 * H, bereich: "Küche" };

// anbieten: mindestens 2 Std. vorher, nicht doppelt
assert.equal(dtAnbietenPruefen(d, T0 - 3 * H, []), null);
assert.match(dtAnbietenPruefen(d, T0 - 1 * H, []), /zu bald/);
assert.match(dtAnbietenPruefen(d, T0 - 3 * H, [{ dienst_ref: "s1", status: "offen" }]), /schon angeboten/);
assert.equal(dtAnbietenPruefen(d, T0 - 3 * H, [{ dienst_ref: "s1", status: "zurueckgezogen" }]), null, "zurückgezogen → neu anbieten geht");
assert.match(dtAnbietenPruefen(d, T0 - 3 * H, Array.from({ length: DT.offenMax }, (_, i) => ({ dienst_ref: "x" + i, status: "offen" }))), /viele/);
assert.match(dtAnbietenPruefen(null, 0, []), /nicht gefunden/);

// Überschneidung (Ende exklusiv)
assert.ok(dtUeberlapp(d, { startMs: T0 + 3 * H, endeMs: T0 + 6 * H }));
assert.ok(!dtUeberlapp(d, { startMs: T0 + 4 * H, endeMs: T0 + 6 * H }), "Anschluss-Dienst ist keine Überschneidung");

// übernehmen
const a = { ...d, von_person: "A", status: "offen" };
assert.equal(dtUebernehmenPruefen(a, "B", [], T0 - H), null);
assert.match(dtUebernehmenPruefen(a, "A", [], T0 - H), /eigener/);
assert.match(dtUebernehmenPruefen({ ...a, status: "uebernommen" }, "B", [], T0 - H), /schneller/);
assert.match(dtUebernehmenPruefen({ ...a, status: "bestaetigt" }, "B", [], T0 - H), /nicht mehr offen/);
assert.match(dtUebernehmenPruefen(a, "B", [], T0 + 1), /begonnen/);
assert.match(dtUebernehmenPruefen(a, "B", [{ startMs: T0 - H, endeMs: T0 + H }], T0 - 2 * H), /schon Dienst/);
assert.equal(dtUebernehmenPruefen(a, "B", [{ startMs: T0 - 2 * H, endeMs: T0 }], T0 - 3 * H), null);

// Rollen + Zustandswechsel
assert.deepEqual(dtRollen(a, "A", false), ["anbieter"]);
assert.deepEqual(dtRollen({ ...a, an_person: "B" }, "B", false), ["uebernehmer", "andere"]);
assert.deepEqual(dtRollen(a, "P", true), ["planer", "andere"]);
assert.deepEqual(dtWechsel("offen", "uebernehmen", ["andere"]), { nach: "uebernommen" });
assert.ok(dtWechsel("offen", "uebernehmen", ["anbieter"]).fehler, "eigenen Dienst nicht übernehmen");
assert.deepEqual(dtWechsel("offen", "zurueckziehen", ["anbieter"]), { nach: "zurueckgezogen" });
assert.ok(dtWechsel("uebernommen", "zurueckziehen", ["anbieter"]).fehler, "nach Übernahme nur noch über den Planer");
assert.deepEqual(dtWechsel("uebernommen", "zuruecktreten", ["uebernehmer", "andere"]), { nach: "offen" });
assert.ok(dtWechsel("uebernommen", "bestaetigen", ["andere"]).fehler, "nur der Planer bestätigt");
assert.deepEqual(dtWechsel("uebernommen", "bestaetigen", ["planer"]), { nach: "bestaetigt" });
assert.deepEqual(dtWechsel("offen", "ablehnen", ["planer"]), { nach: "abgelehnt" });
assert.match(dtWechsel("bestaetigt", "zuruecktreten", ["uebernehmer"]).fehler, /schon bestätigt/);
assert.ok(dtWechsel("offen", "constructor", ["planer"]).fehler);

// Plan mit bestätigten Übergaben
const plan = [{ ref: "s1", person: "A" }, { ref: "s2", person: "A" }];
const neu = dtPlanMitTausch(plan, [{ dienst_ref: "s1", von_person: "A", an_person: "B", status: "bestaetigt" }, { dienst_ref: "s2", von_person: "A", an_person: "C", status: "uebernommen" }]);
assert.deepEqual(neu[0], { ref: "s1", person: "B", getauscht: true, vorher: "A" });
assert.deepEqual(neu[1], plan[1], "nur bestätigte Übergaben zählen");

assert.equal(dtText(d), "Sa 05.12. 16:00–20:00 Uhr · Küche");
console.log("OK – Dienst-Tausch: Regeln geprüft");
