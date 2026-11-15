// KC-CLUB-KOPF-ECKE (Fund Hansi 15.11.2026: „Im Tablet-Modus berührt die Flagge die Anzeige der Verbindungsqualität“).
// Ab 600 px zeigt der Netz-Chip zusätzlich das Wort („Sehr gut“) und wird breiter – die Flagge rückt jetzt immer 8 px links daneben.
// Aufruf: node tests/kopf-ecke.test.mjs (offline)
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const stueck = (anf, ende) => { const i = app.indexOf(anf); assert.ok(i >= 0, anf); return app.slice(i, app.indexOf(ende, i)); };
const code = stueck("function kopfEckeAnordnen()", "\naddEventListener(\"resize\"");
const nb = stueck("function netzBalkenZeigen(", "\n// KC-CLUB-KOPF-ECKE");
assert.ok(/if \(!an\) return kopfEckeAnordnen\(\);/.test(nb) && /\n  kopfEckeAnordnen\(\);\n\}$/.test(nb), "nach jedem Zeichnen und beim Ausschalten neu anordnen");
assert.ok(/addEventListener\("resize", \(\) => \{ try \{ kopfEckeAnordnen\(\); \} catch \{\} \}, \{ passive: true \}\);/.test(app), "auch beim Drehen/Größe ändern");

const lauf = ({ breite, rechts = "18px", versteckt = false, da = true }) => {
  const s = { style: { right: "x" } };
  const b = { offsetWidth: breite, classList: { contains: () => versteckt } };
  const f = new Function("$", "getComputedStyle", code + "; return kopfEckeAnordnen;")((id) => (id === "spKnopf" ? s : da ? b : null), () => ({ right: rechts }));
  f(); return s.style.right;
};
assert.equal(lauf({ breite: 123 }), "149px", "Tablet: Chip 123 px breit → Flagge bei 18 + 123 + 8 = 149 px (kein Berühren)");
assert.equal(lauf({ breite: 65 }), "98px", "Handy: schmaler Chip → wie bisher 98 px");
assert.equal(lauf({ breite: 123, versteckt: true }), "", "Chip aus → CSS-Platz wie bisher");
assert.equal(lauf({ breite: 0 }), "", "Kopf eingerollt (Chip unsichtbar) → CSS-Platz");
assert.equal(lauf({ breite: 123, da: false }), "", "kein Chip → CSS-Platz");
console.log("✅ kopf-ecke: alle Prüfungen bestanden");
