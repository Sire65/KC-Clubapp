// KC-CLUB-ANLAGE-KLAMMER (03.11.2026, Fund Hansi „Fehlermeldung beim Aufrufen Preisliste“, Fehler-Nr. f02a2f23):
// Seit 2.826.0 schloss eine verrutschte Klammer den Fall „anlage_url“ zu früh, eine andere fehlte – Anlagen, die schon erlaubt waren,
// liefen in den nächsten Fall und endeten mit „Da ist etwas schiefgelaufen“. Dieser Test prüft für ALLE Server-Aktionen:
// Auf „case "…": {“ folgt nach der passenden schließenden Klammer nur noch der nächste case (kein Code dazwischen).
// Aufruf: node tests/server-klammern.test.mjs (offline, ohne TypeScript)
import fs from "node:fs";
import assert from "node:assert/strict";
const src = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
// Zeichenweise: Zeichenketten, Vorlagen (mit ${…}), Kommentare und Regex-Literale überspringen; liefert je Position die Klammertiefe nicht,
// sondern sucht zu einer öffnenden Klammer die passende schließende.
function passendeKlammer(s, auf) {
  let tiefe = 0, i = auf;
  const vorlage = []; // Stapel: Tiefe, bei der eine ${…}-Einbettung in einer Vorlage begann
  const regexDavor = (j) => { let k = j - 1; while (k >= 0 && /\s/.test(s[k])) k--; return k < 0 || /[(,=:[!&|?{};+\-*%<>~^]/.test(s[k]) || /\b(return|typeof|case|in|of)$/.test(s.slice(Math.max(0, k - 6), k + 1)); };
  const zeichenkette = (q) => { i++; while (i < s.length && s[i] !== q) { if (s[i] === "\\") i++; i++; } };
  const vorlageText = () => { i++; while (i < s.length && s[i] !== "`") { if (s[i] === "\\") { i += 2; continue; } if (s[i] === "$" && s[i + 1] === "{") { vorlage.push(tiefe); tiefe++; i += 2; return; } i++; } };
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === "/" && s[i + 1] === "/") { while (i < s.length && s[i] !== "\n") i++; continue; }
    if (c === "/" && s[i + 1] === "*") { i = s.indexOf("*/", i + 2) + 1; continue; }
    if (c === "'" || c === '"') { zeichenkette(c); continue; }
    if (c === "`") { vorlageText(); continue; }
    if (c === "/" && regexDavor(i)) { i++; let klasse = false; while (i < s.length && (s[i] !== "/" || klasse)) { if (s[i] === "\\") i++; else if (s[i] === "[") klasse = true; else if (s[i] === "]") klasse = false; i++; } continue; }
    if (c === "{") tiefe++;
    else if (c === "}") { tiefe--; if (vorlage.length && vorlage[vorlage.length - 1] === tiefe) { vorlage.pop(); i--; vorlageText(); continue; } if (tiefe === 0) return i; }
  }
  return -1;
}
const faelle = [...src.matchAll(/^ {6}case "([a-z0-9_]+)": \{/gm)];
assert.ok(faelle.length > 300, `Server-Aktionen gefunden: ${faelle.length}`);
const fehler = [];
for (const m of faelle) {
  const auf = m.index + m[0].length - 1, zu = passendeKlammer(src, auf);
  if (zu < 0) { fehler.push(`${m[1]}: keine schließende Klammer`); continue; }
  const danach = src.slice(zu + 1).replace(/^(\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, "");
  if (!/^(case "|default:|\})/.test(danach)) fehler.push(`${m[1]}: nach dem Block steht noch Code („${danach.slice(0, 60).replace(/\n/g, " ")}“)`);
}
assert.deepEqual(fehler, [], "Klammern der Server-Aktionen");
// anlage_url: der Block endet mit Link erzeugen + return
const a = src.slice(src.indexOf('case "anlage_url": {'));
const aBlock = a.slice(0, passendeKlammer(a, a.indexOf("{")) + 1);
assert.ok(/return json\(\{ url: s\.signedUrl, name: att\.file_name \}\);\s*\}$/.test(aBlock), "anlage_url endet mit dem Link");
assert.ok(aBlock.includes("2.835.0 KC-CLUB-HILFE-TIPPS") && aBlock.includes("2.581.0 KC-CLUB-CLUBJAHR-MOMENTE") && aBlock.includes("rtTascheVorabErlaubt"), "alle Erlaubnis-Wege im Block");
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/server-klammern.test.mjs"), "läuft in der CI");
console.log(`server-klammern: ${faelle.length} Aktionen ok`);
