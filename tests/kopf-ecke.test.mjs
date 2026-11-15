// KC-CLUB-KOPF-ECKE (Fund Hansi 15.11.2026: „Im Tablet-Modus berührt die Flagge die Anzeige der Verbindungsqualität“).
// Ab 600 px zeigt der Netz-Chip zusätzlich das Wort („Sehr gut“) und wird breiter – die Flagge rückt jetzt immer 8 px links daneben.
// Aufruf: node tests/kopf-ecke.test.mjs (offline)
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const stueck = (anf, ende) => { const i = app.indexOf(anf); assert.ok(i >= 0, anf); return app.slice(i, app.indexOf(ende, i)); };
const code = stueck("function kopfEckeAnordnen()", "\n// KC-CLUB-KA-KOPF (15.11.2026");
const nb = stueck("function netzBalkenZeigen(", "\n// KC-CLUB-KOPF-ECKE");
assert.ok(/if \(!an\) return kopfEckeAnordnen\(\);/.test(nb) && /\n  kopfEckeAnordnen\(\);\n\}$/.test(nb), "nach jedem Zeichnen und beim Ausschalten neu anordnen");
assert.ok(/addEventListener\("resize", \(\) => \{ try \{ kopfEckeAnordnen\(\); kaKopfPasst\(\); \} catch \{\} \}, \{ passive: true \}\);/.test(app), "auch beim Drehen/Größe ändern");

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
// KC-CLUB-KA-KOPF (Wunsch Hansi 15.11.2026): neben „Erweiterte Ansicht“ zwei runde Symbol-Knöpfe (ohne Text) – nur wenn welche ausgeblendet sind,
// ab 400 px und nur, wenn sie in die Zeile passen (sonst erst „QR“-Wort weg, dann Knöpfe weg); nicht in der einfachen Ansicht, nicht beim Anordnen
{
  const fs = await import("node:fs");
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.ok(/&lt; Erweiterte Ansicht &gt;<\/button><\/h3><span class="ka-kopf" id="kaKopfKnoepfe"><\/span>/.test(html), "Platz rechts neben „Erweiterte Ansicht“");
  assert.ok(/\.ka-kopf \{ display: none; \} @media \(min-width: 400px\) \{ body:not\(\.einfach\) \.ka-kopf:not\(:empty\):not\(\.kk-eng\) \{ display: flex;/.test(html), "ab 400 px, nicht einfache Ansicht, nicht wenn zu eng");
  assert.ok(/\.abschnitt\.kk-knapp \.qr-wort \{ display: none; \}/.test(html) && /<span class="qr-wort"> QR<\/span>/.test(app), "wenn knapp: beim QR-Knopf nur das Symbol");
  const kz = stueck("function kachelnZeigen()", "\n}\n");
  assert.ok(/kkn\("kaNurAus\(true\)", "👀", `Nur ausgeblendete zeigen \(\$\{ausN\}\)`\)/.test(kz) && /kkn\("kaBearbeiten\(true\)", "🙈",/.test(kz) && /kkn\("kaNurAus\(false\)", "🙈", "Ausgeblendete wieder verbergen", true\)/.test(kz), "dieselben Wege wie unten");
  assert.ok(/: ausN \? kkn\(/.test(kz) && /\) : "";\n  kaKopfPasst\(\);/.test(kz), "nur wenn wirklich welche ausgeblendet sind, danach Platz prüfen");
  assert.ok(/aria-label="\$\{t\}">\$\{sym\}<\/button>/.test(kz), "nur das Symbol, Erklärung als Hinweis/Vorlesen");
  assert.ok(/\$\("kaAusHinweis"\)\.innerHTML = ""; if \(\$\("kaKopfKnoepfe"\)\) \$\("kaKopfKnoepfe"\)\.innerHTML = "";/.test(kz), "beim Anordnen weg");
  // Platz-Prüfung
  const pc = stueck("function kaKopfPasst()", "\naddEventListener(");
  const lauf2 = (hoehen, rechts, qrLinks) => {
    const kl = new Set(), akl = new Set(); let n = 0;
    const k = { innerHTML: "x", classList: { add: (c) => kl.add(c), remove: (c) => kl.delete(c), contains: (c) => kl.has(c) }, getBoundingClientRect: () => ({ right: rechts[Math.min(n, rechts.length - 1)] }),
      closest: () => a };
    const a = { classList: { add: (c) => { akl.add(c); n = 1; }, remove: (c) => akl.delete(c) }, querySelector: () => ({ getBoundingClientRect: () => ({ height: hoehen[Math.min(n, hoehen.length - 1)] }) }) };
    const m = { offsetWidth: 30, getBoundingClientRect: () => ({ left: qrLinks[Math.min(n, qrLinks.length - 1)] }) };
    new Function("$", "getComputedStyle", pc + "; return kaKopfPasst;")((id) => (id === "kaKopfKnoepfe" ? k : m), () => ({ display: "flex" }))();
    return { eng: kl.has("kk-eng"), knapp: akl.has("kk-knapp") };
  };
  assert.deepEqual(lauf2([33], [300], [400]), { eng: false, knapp: false }, "passt → so lassen");
  assert.deepEqual(lauf2([33], [380, 380], [370, 390]), { eng: false, knapp: true }, "zu nah am QR → QR-Wort weg, dann passt es");
  assert.deepEqual(lauf2([61, 61], [380], [370]), { eng: true, knapp: false }, "bricht trotzdem um → Knöpfe oben weg");
}
console.log("✅ kopf-ecke: alle Prüfungen bestanden");
