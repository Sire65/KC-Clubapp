// 2.769.0 KC-CLUB-AKTENSCHRANK-JALOUSIE (Wunsch Hansi 30.10.2026 „Jalousie ins Ordnerregal, von rechts nach links, rechts mittig ein Pfeilschalter,
// der dann ganz links steht; geschlossen nur eine Zeile ‚Aktenschrank‘ mit Anzahl Ordner und Einklapp-Pfeil; öffnen geht von alleine auf; vorne Logo + since 1991“)
import assert from "node:assert/strict";
import fs from "node:fs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), html = lies("index.html");
const block = app.slice(app.indexOf("// ---------- 2.769.0 KC-CLUB-AKTENSCHRANK-JALOUSIE"), app.indexOf("function buRaumHtml() {"));
assert.ok(block.length > 1500, "Baustein gefunden");

// Zustand: gemerkt je Gerät, erstes Mal offen, im Erklär-Video immer offen
let speicher = {}, video = false, animiert = true;
const S = new Function("lsLesen", "lsSetzen", "document", "einst", "matchMedia", "$", block + "\nreturn { buSchrankOffen, buSchrankHtml, buSchrankKlick, BU_SCHRANK };")(
  (k) => speicher[k] ?? null, (k, v) => { speicher[k] = v; }, { body: { classList: { contains: (c) => c === "rg-an" && video } } }, (k, d) => (k === "animiert" ? animiert : d), () => ({ matches: false }), () => null);
assert.equal(S.buSchrankOffen(), true, "erstes Mal offen");
speicher[S.BU_SCHRANK] = "zu"; assert.equal(S.buSchrankOffen(), false, "gemerkt: zu");
video = true; assert.equal(S.buSchrankOffen(), true, "im Erklär-Video immer offen (das Video zeigt das Regal)"); video = false;

// Darstellung zu: nur die Zeile mit Anzahl und ⌄, Körper verborgen, Pfeil rechts ◀
let h = S.buSchrankHtml("<div class=\"bu-wand\">REGAL</div>", 16);
assert.match(h, /<b>Aktenschrank<\/b><small>16 Ordner<\/small><span class="bu-schrank-pfeil" aria-hidden="true">⌄<\/span>/);
assert.match(h, /id="buSchrankKoerper" hidden>/); assert.match(h, /aria-expanded="false"/); assert.match(h, /aria-label="Aktenschrank öffnen">◀<\/button>/);
assert.match(h, /<img src="kc-kochmuetze-weiss\.webp" alt=""><small>since 1991<\/small>/, "Tür: Kochmütze + since 1991");
assert.equal((h.match(/class="bu-jal-lamelle"/g) || []).length, 28, "Lamellen");
// offen: Regal sichtbar, ⌃, Pfeil ganz links ▶
speicher = {}; h = S.buSchrankHtml("<div class=\"bu-wand\">REGAL</div>", 3);
assert.match(h, /class="bu-schrank auf"/); assert.match(h, /id="buSchrankKoerper">/); assert.match(h, /REGAL/); assert.match(h, /aria-label="Aktenschrank schließen">▶<\/button>/);
assert.match(h, /<small>3 Ordner<\/small>/, "Anzahl = Ordner, die diese Person sehen darf");

// Einbau im Büro-Raum: Regal steckt im Schrank, Anzahl = sichtbare Ordner; Liste unverändert
assert.match(app, /\$\{buSchrankHtml\(`<div class="bu-wand"><div class="bu-regal">\$\{ordner\.map\(ruecken\)\.join\(""\)\}<\/div><div class="bu-brett"><\/div><\/div>`, ordner\.length\)\}/);
assert.ok(!/buSchrankHtml/.test(app.slice(app.indexOf("function buStartListeHtml()"), app.indexOf("function buStartListeHtml()") + 3000)), "Liste ohne Schrank");
// Bewegung: Lamellen klappen, Jalousie schiebt nach links, Pfeil fährt mit; ohne Effekte / reduzierte Bewegung sofort
assert.match(block, /rotateY\(68deg\)/); assert.match(block, /j\.animate\(\[\{ width: "100%" \}, \{ width: "0%" \}\], fahrt\)/); assert.match(block, /g\.animate\(\[\{ left: rechts\(\) \}, \{ left: "6px" \}\], fahrt\)/);
assert.match(block, /const buSchrankRuhig = \(\) => !einst\("animiert", true\);/, "2.770.0: nur der App-Schalter zählt (wie alle Effekte seit 2.409.0)");
assert.ok(!/prefers-reduced-motion/.test(block), "Handy-Einstellung „Bewegung reduzieren“ hält die Jalousie nicht an (Fund Hansi 30.10.)");
assert.match(block, /if \(buSchrankRuhig\(\) \|\| !j\.animate\) \{ BU_SCHRANK_LAEUFT = true; return fertig\(\); \}/);
// Aussehen (CD: Weinrot/Beige), Pfeil rechts mittig ↔ ganz links
assert.match(html, /\.bu-jal-griff \{ position: absolute; top: 50%; right: 8px;/); assert.match(html, /\.bu-schrank\.auf \.bu-jal-griff \{ right: auto; left: 6px; \}/);
assert.match(html, /\.bu-schrank\.auf \.bu-jalousie \{ width: 0; \}/); assert.match(html, /:root\.dunkel \.bu-jal-lamelle \{/);
assert.match(app, /id: "aktenschrank", thema: "club", sym: "🗄️", nur: \(\) => !!ICH\?\.buero/, "Hilfe-Zentrum");
console.log("OK – KC-CLUB-AKTENSCHRANK-JALOUSIE (2.769.0)");
