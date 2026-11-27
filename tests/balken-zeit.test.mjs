// KC-CLUB-BALKEN-ZEIT (Fund Hansi 27.11.2026): Uhrzeiten in den Dienst-Balken immer lesbar – Kurzform, sonst neben dem Balken, Antippen = volle Zeit.
// KC-CLUB-UEBERSICHT-ZEITRAUM (Wunsch Hansi 27.11.2026): neben der Woche „📅 Ganzer Zeitraum“, im Gerät gemerkt.
// Aufruf: node tests/balken-zeit.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const js = programmText(), css = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

const block = js.slice(js.indexOf("function balkenKurz("), js.indexOf("let balkenMessCanvas"));
const { balkenKurz, balkenLage } = new Function(block + "; return { balkenKurz, balkenLage };")();

// Kurzform
assert.equal(balkenKurz("11:00", "14:00"), "11–14");
assert.equal(balkenKurz("14:00", "18:30"), "14–18½");
assert.equal(balkenKurz("09:30", "13:00"), "9½–13");
assert.equal(balkenKurz("14:15", "18:00"), "14:15–18");
assert.equal(balkenKurz("22:00", "02:00"), "22–2");

// Platzierung: innen voll → innen kurz → rechts → links → (kein Platz) größere Seite
assert.deepEqual(balkenLage(100, 0, 0, 70, 30), { art: "innen", text: "voll" });
assert.deepEqual(balkenLage(50, 0, 200, 70, 30), { art: "innen", text: "kurz" });
assert.deepEqual(balkenLage(20, 10, 200, 70, 30), { art: "rechts", text: "voll" }, "rechts genug Platz für die volle Zeit");
assert.deepEqual(balkenLage(20, 10, 50, 70, 30), { art: "rechts", text: "kurz" });
assert.deepEqual(balkenLage(20, 200, 10, 70, 30), { art: "links", text: "voll" }, "rechts kein Platz → links");
assert.deepEqual(balkenLage(20, 40, 10, 70, 30), { art: "links", text: "kurz" });
assert.deepEqual(balkenLage(20, 5, 20, 70, 30), { art: "rechts", text: "kurz" }, "nirgends Platz → größere Seite");
assert.deepEqual(balkenLage(20, 25, 20, 70, 30), { art: "links", text: "kurz" });

// Einbau: Balken tragen voll/kurz/Titel, Antippen meldet die volle Zeit, nach dem Zeichnen wird gemessen (auch bei Größenwechsel)
const zeichnen = js.slice(js.indexOf("function dpZeichnen()"), js.indexOf("async function dienstFreigabe"));
assert.ok(/data-voll=/.test(zeichnen) && /data-kurz=/.test(zeichnen) && /title=/.test(zeichnen) && /onclick="dpBalkenTipp\(this\)"/.test(zeichnen), "Balken mit voll/kurz/Titel/Antippen");
assert.ok(/dpBalkenBeschriften\(\$\("dpListe"\)\)/.test(zeichnen), "nach dem Zeichnen beschriften");
assert.ok(/ResizeObserver/.test(js.slice(js.indexOf("function dpBalkenBeschriften"))), "Größenwechsel → neu einteilen");
assert.ok(/function dpBalkenTipp\(b\) \{ if \(b\?\.title\) melde\(b\.title\); \}/.test(js), "Antippen → melde()");

// CSS: kein Abschneiden mehr im Balken; Beschriftung daneben in Textfarbe (hell/dunkel)
const regel = css.match(/\.spur2 \.b \{[^}]*\}/)[0];
assert.ok(!/overflow:\s*hidden/.test(regel), "Balken schneidet die Zeit nicht mehr ab");
assert.ok(/\.spur2 \.bl \{[^}]*color: var\(--text\)/.test(css), "Beschriftung daneben in Textfarbe");

// KC-CLUB-UEBERSICHT-ZEITRAUM: ganzer Zeitraum wählbar, im Gerät gemerkt, eine Abfrage „dienste“ (keine neue Aktion)
const zb = js.slice(js.indexOf("function dpBereich("), js.indexOf("function dpFarbe("));
const tagPlus = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const { dpBereich, dpGanzTage } = new Function("tagPlus", zb + "; return { dpBereich, dpGanzTage };")(tagPlus);
assert.deepEqual(dpBereich(false, "2026-11-30", null, "2026-11-27"), ["2026-11-30", "2026-12-06"], "Woche");
assert.deepEqual(dpBereich(true, "2026-11-30", { von: "2026-12-02", bis: "2026-12-14" }, "2026-11-27"), ["2026-12-02", "2026-12-14"], "ganzer Markt");
assert.deepEqual(dpBereich(true, "2026-11-30", { von: "2026-12-01", bis: "2027-03-01" }, "2026-11-27"), ["2026-12-01", "2027-01-31"], "höchstens zwei Monate (Server)");
assert.deepEqual(dpBereich(true, "2026-11-30", null, "2026-11-27"), ["2026-11-27", "2027-01-21"], "ohne Wunschzeiten: ab heute 8 Wochen");
const t = dpGanzTage("2026-11-27", "2027-01-21", ["2026-12-14", "2026-12-02", "2026-12-05"]);
assert.equal(t.length, 13); assert.equal(t[0], "2026-12-02"); assert.equal(t[12], "2026-12-14");
assert.ok(/localStorage\.getItem\("kc_dp_zeitraum"\) === "ganz"/.test(js) && /try \{ localStorage\.setItem\("kc_dp_zeitraum"/.test(js), "Wahl im Gerät gemerkt (try/catch)");
const laden = js.slice(js.indexOf("async function dienstLaden()"), js.indexOf("// ---------- KC-CLUB-DIENST-WUNSCHZEITEN"));
assert.equal((laden.match(/api\(/g) || []).length, 1, "nur die vorhandene Abfrage „dienste“");
assert.ok(/api\("dienste", \{ von, bis,/.test(laden), "ein Abruf über den ganzen Bereich");
assert.ok(/id="dpGanzKnopf" onclick="dpGanzWahl\(\)"[^>]*>📅 Ganzer Zeitraum</.test(css), "Knopf neben der Wochenwahl");
assert.ok(/const tage = dpGanz \? dpGanzTage\(/.test(zeichnen), "Übersicht zeigt alle Tage");
console.log("balken-zeit: ok");
