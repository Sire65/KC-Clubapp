// 2.865.0 KC-CLUB-DOK-SCHONEND (Fund Hansi 05.11.2026: „Unter Anleitung Version 10 bleibt das PDF leer“, Android/Chrome 156, 77 Seiten; 3 Seiten gehen).
// Aufruf: node tests/dok-schonend.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const anz = app.slice(app.indexOf("async function dokAnzeigen("), app.indexOf("// eine PDF-Seite als JPEG-Bild"));

// nicht mehr alle Seiten auf einmal zeichnen: Platzhalter in Seitengröße, gezeichnet wird nach Nähe zum Bildschirm
assert.ok(!/for \(let n = 1; n <= pdf\.numPages; n\+\+\) \{\s*if \(lauf !== DOKA\.lauf\) return pdf\.destroy\(\);\s*\$\("dokaStand"\)\.textContent = `Seite \$\{n\}/.test(anz), "keine Schleife mehr, die alle Seiten nacheinander zeichnet");
assert.ok(anz.includes('img.style.aspectRatio = `${s1.width} / ${s1.height}`; box.appendChild(img);'), "Platzhalter in Seitengröße");
assert.ok(anz.includes("DOKA.beob = new IntersectionObserver((liste) => { for (const e of liste) dokSeiteNah(lauf, +e.target.dataset.n, e.isIntersecting); }, { rootMargin: lang ? DOK_VORAUS_LANG : DOK_VORAUS });"), "Seiten nahe am Bildschirm");
assert.ok(anz.includes("DOKA.nah.add(1); DOKA.warte.add(1); await dokZeichnen(lauf);"), "erste Seite sofort");
assert.ok(app.includes('const DOK_VORAUS = "300% 0px", DOK_VORAUS_LANG = "150% 0px", DOK_LANG = 20;'), "3 Bildschirme voraus/zurück, bei langen PDFs 1,5");
assert.ok(anz.includes("const lang = pdf.numPages > DOK_LANG, breite = Math.min(1400, Math.round(($(\"dokaSeiten\").clientWidth || innerWidth) * Math.min(lang ? 1.5 : 2, devicePixelRatio || 1)));"), "lange PDFs mit geringerer Pixeldichte");
// weit entfernte Seiten geben den Bildspeicher frei, das gezeichnete Bild bleibt gemerkt
assert.ok(app.includes('if (!nah) { DOKA.nah.delete(n); DOKA.warte.delete(n); if (img.getAttribute("src")) img.removeAttribute("src"); return; }'), "Speicher freigeben");
assert.ok(app.includes('if (DOKA.bilder[n - 1]) { if (!img.getAttribute("src")) img.src = DOKA.bilder[n - 1]; return; }'), "gemerktes Bild wieder zeigen, nicht neu zeichnen");
// Warteschlange: nie hängen bleiben, nie endlos neu versuchen, geschlossene Anzeige ist kein Fehler
const z = app.slice(app.indexOf("function dokZeichnen(lauf)"), app.indexOf("// ganz weiß?"));
assert.ok(z.includes("await null; // erst eintragen") && z.includes("finally { if (lauf === DOKA.lauf) DOKA.laeuft = null; }"), "„läuft“ wird immer zurückgesetzt");
assert.ok(z.includes("if (lauf !== DOKA.lauf) return; // Anzeige inzwischen geschlossen") && z.includes("DOKA.warte.clear(); // nicht endlos neu versuchen"), "Fehler sauber behandelt");
// weiße Seite: halbe Breite neu, einmal als Hinweis gemeldet (nur Zahlen)
assert.ok(z.includes("if (await dokBildWeiss(src)) {") && z.includes("pdfSeiteAlsBild(pdf, n, Math.round(breite / 2))") && z.includes('fpNeu("dokument", { text: "PDF-Seite weiß gezeichnet", seite: n, seiten: DOKA.seiten, breite, nochmal: nochWeiss ? "weiß" : "ok" });'), "Weiß-Prüfung");
// Drucken bekommt alle Seiten, Aufräumen beendet Beobachter und PDF
assert.ok(app.includes("try { await dokAlleSeiten(); } catch (e) { return meldeFehler(e); }") && app.includes("fertig.length < (DOKA.seiten || 0)) return null;"), "Drucken nur mit allen Seiten");
assert.ok(/function dokAufraeumen\(\) \{[^\n]*DOKA\.beob\?\.disconnect\(\);[^\n]*DOKA\.pdf\?\.destroy\(\)/.test(app), "Aufräumen");
assert.ok(app.includes('return diag(DOKA.bilder.some(Boolean) ? "angezeigt" : "nicht_angezeigt"'), "Anlage-Diagnose zählt gezeichnete Seiten");
console.log("dok-schonend: ok");
