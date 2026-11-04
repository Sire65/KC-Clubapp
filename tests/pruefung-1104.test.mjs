// KC-CLUB-PRUEFUNG-1104 (2.848.0, Gesamtprüfung 04.11.2026, Freigabe Hansi): doppelte Fenster-Kennungen und Kontrast.
// Aufruf: node tests/pruefung-1104.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const nutzung = fs.readFileSync(new URL("../teile/nutzung.js", import.meta.url), "utf8");
const prog = programmText();

// 1. blattAuf() entfernt ein vorhandenes Element mit derselben Kennung – ein festes Fenster aus index.html wäre danach weg
//    (so löschte der Mitglieder-Tipp das Einstiegs-Fenster „tippBlatt“ samt tippText/tippJa → Programmfehler).
const fest = new Set([...html.matchAll(/\sid="([A-Za-z][\w-]*)"/g)].map((m) => m[1]));
const dyn = new Set([...prog.matchAll(/blattAuf\("([A-Za-z][\w-]*)"/g)].map((m) => m[1]));
const treffer = [...dyn].filter((id) => fest.has(id));
assert.deepEqual(treffer, [], `blattAuf() mit Kennung eines festen Fensters aus index.html: ${treffer.join(", ")}`);

// 2. FENSTER_NAMEN (Registry für die „Wege der Mitglieder“): jeder Schlüssel nur einmal – sonst überschreibt der zweite den ersten
const start = app.indexOf("const FENSTER_NAMEN = {"), ende = app.indexOf("\n};", start);
assert.ok(start > 0 && ende > start, "FENSTER_NAMEN gefunden");
const schluessel = [...app.slice(start, ende).matchAll(/(?:\{|,)\s*([A-Za-z][\w]*):\s*"/g)].map((m) => m[1]);
const doppelt = schluessel.filter((k, i) => schluessel.indexOf(k) !== i);
assert.deepEqual(doppelt, [], `FENSTER_NAMEN: doppelte Schlüssel ${doppelt.join(", ")}`);
assert.ok(schluessel.length > 200, "FENSTER_NAMEN vollständig gelesen");

// 3. die konkreten Korrekturen
assert.ok(app.includes('blattAuf("nvBlatt"') && app.includes('|| $("nvBlatt")) return;'), "Kachel-Vorschlag: eigene Kennung nvBlatt");
assert.ok(!/blattAuf\("nuBlatt"/.test(app) && nutzung.includes('blattAuf("nuBlatt"'), "nuBlatt gehört nur „So nutzen wir die App“");
assert.ok(app.includes('blattAuf("mtBlatt"') && app.includes('<textarea id="mtText"') && app.includes('($("mtText")?.value || "")'), "Mitglieder-Tipp: eigene Kennungen mtBlatt/mtText");
assert.ok(!/blattAuf\("tippBlatt"/.test(prog), "tippBlatt bleibt das feste Einstiegs-Fenster");
assert.ok(/nvBlatt: "💡 Vorschlag der Bühne"/.test(app) && /mtBlatt: "💡 Ein Tipp für dich"/.test(app) && /tdtBlatt: "💡 Tipp des Tages"/.test(app), "Fensternamen");

// 4. Kontrast Spruch-Archiv-Ordner (Schrift #f9f3eb): mindestens 4,5 : 1 (WCAG AA)
const L = (h) => { const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const kontrast = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const spr = [...app.matchAll(/--of:#([0-9a-fA-F]{6})"[^>]*>(?:<span class="sym">📜<\/span>)/g)].map((m) => m[1]);
assert.equal(spr.length, 2, "Spruch-Archiv: Ordner und Kopf gefunden");
for (const f of spr) assert.ok(kontrast("f9f3eb", f) >= 4.5, `Spruch-Archiv #${f}: Kontrast ${kontrast("f9f3eb", f).toFixed(2)} < 4,5`);


// ---- 2.849.0 KC-CLUB-PRUEFUNG-1104-B (Punkte 1–7 der Gesamtprüfung, Freigabe Hansi 04.11.) ----
{
  const tl = fs.readFileSync(new URL("../teile/tischlive.js", import.meta.url), "utf8");
  // 2. Nachrichten-Leiste: Wörter 12 px, nie gekürzt – Knopf so breit wie sein Wort, Umbruch in eine zweite, gemittelte Reihe statt Wischen
  assert.ok(/html\.kom-sym \.kom-leiste \{ flex-wrap: wrap; gap: 4px; justify-content: center; \}/.test(html), "Leiste bricht um statt zu wischen");
  assert.ok(/html\.kom-sym \.kom-leiste \.knopf:not\(\.versteckt\) \{ flex: 1 0 auto; min-width: 44px; max-width: 50%;/.test(html), "Knopf so breit wie sein Wort, höchstens halbe Breite");
  assert.ok(/html\.kom-sym \.kom-leiste \.kl-k \{ display: block; font-size: \.75rem;/.test(html), "Wörter 12 px");
  // 3. Feedback-Link in Hilfe & Tipps: größere Trefffläche ohne Zeilenverschiebung
  assert.ok(app.includes('<a href="#" class="tipp-link" onclick="zeige(\'feedback\');return false">💭 Feedback</a>') && /\.tipp-link \{ padding: 12px 4px; margin: 0 -4px; \}/.test(html), "Feedback-Link größer antippbar");
  // 4. Hilfe-Suche: auf schmalen Handys nur 🔍, Name bleibt „Suchen“
  assert.ok(html.includes('onclick="hzSucheKnopf()" aria-label="Suchen">🔍<span class="such-wort"> Suchen</span></button>') && /@media \(max-width: 400px\) \{ \.hz-suchfeld \.such-wort \{ display: none; \} \.hz-suchfeld \.such-knopf \{ min-width: 48px; min-height: 44px;/.test(html), "Suchen-Knopf schmal");
  // 5. Barrierefreiheit: Fotos/Videos als benannte Gruppe mit aria-pressed (wie die übrigen Ein/Aus-Knöpfe); Kamera-Auslöser mit Namen
  assert.ok(html.includes('id="faArtWahl" role="group" aria-label="Fotos oder Videos zeigen"><button type="button" data-art="fotos" class="an" aria-pressed="true"') && !/role="tablist"/.test(html), "Fotos/Videos-Umschalter");
  assert.ok(app.includes('b.setAttribute("aria-pressed", String(b.dataset.art === VI.art));'), "aria-pressed folgt der Wahl");
  assert.ok(html.includes('<button class="ausloeser" title="Foto aufnehmen" aria-label="Foto aufnehmen"'), "Auslöser benannt");
  // 6. einheitlich „Wird geladen …“ (Ausnahme: kleiner Abspiel-Knopf in der Sprechblase)
  const laedt = (html + prog).match(/[Ll]ädt …/g) || [];
  assert.equal(laedt.length, 1, "„Lädt …“ nur noch im Abspiel-Knopf");
  assert.ok(app.includes('knopf.textContent = "⏳ lädt …"'), "Ausnahme Abspiel-Knopf");
  // 7. Tasche am Runden Tisch: Doppeltippen auf „Nächstes“ schickt nichts doppelt
  assert.ok(/async function tlTascheNaechstes\(\) \{\n  if \(TL\.tascheSendet\) return;/.test(tl) && tl.includes("TL.tascheSendet = true; try { await tlAusTasche(x); } finally { TL.tascheSendet = false; }"), "Sperre beim Senden");
}

// KC-TESTS-OHNE-ECHTSERVER (2.849.0): Browser-Tests sperren die echten Server-Adressen zusätzlich auf Netz-Ebene
for (const t of ["rundgang", "tisch-live"]) {
  const b = fs.readFileSync(new URL(`./${t}.browser.mjs`, import.meta.url), "utf8");
  assert.ok(/const OHNE_ECHTSERVER = "--host-resolver-rules=MAP \*\.supabase\.co 0\.0\.0\.0, MAP \*\.supabase\.com 0\.0\.0\.0, MAP \*\.workers\.dev 0\.0\.0\.0,/.test(b) && /chromium\.launch\(\{ args: \[OHNE_ECHTSERVER/.test(b), `${t}: Browser ohne Echtserver`);
}

console.log("pruefung-1104: ok");
