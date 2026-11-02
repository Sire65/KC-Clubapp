// 2.805.0 KC-CLUB-RECHNER (Wunschliste #48, Wunsch Hansi 02.11.2026 „Der Tischrechner soll einen wirklichen Rechner aufmachen zum Rechnen. Mit Sprachsteuerung,
// z. B. rechne 5 x 22“): Tischrechner mit großen Tasten, grünem Display und Papierstreifen (letzte 20 Rechnungen, nur auf diesem Gerät). 🎤 nimmt die
// vorhandene Spracherkennung (sbZuhoeren); „rechne …“ geht auch über die Sprachsteuerung der App (sbErkennen → rechnerOeffnen). Gerechnet wird nur auf dem
// Gerät – ohne eval, eigener kleiner Rechenkern (+ − × ÷, Klammern, Prozent). Nichts geht an den Server. Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const RE_KEY = "kc_club_rechner_streifen", RE_MAX = 20;
const RE = { eingabe: "", ergebnis: null, ansagen: false };
const reStreifen = () => { try { const l = JSON.parse(localStorage.getItem(RE_KEY) || "[]"); return Array.isArray(l) ? l.slice(0, RE_MAX) : []; } catch { return []; } };
function reStreifenDazu(z) { try { localStorage.setItem(RE_KEY, JSON.stringify([z, ...reStreifen()].slice(0, RE_MAX))); } catch {} }
const reZahl = (x) => (Number.isFinite(x) ? (Math.round(x * 1e10) / 1e10).toLocaleString("de-DE", { maximumFractionDigits: 10 }) : "Fehler");
// Zahlwörter, die die Spracherkennung manchmal statt Ziffern schreibt
const RE_WORT = { null: 0, eins: 1, ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12,
  zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90, hundert: 100, tausend: 1000 };
// gesprochen/getippt → Rechenzeichen: „5 mal 22“, „125 geteilt durch 4“, „19 prozent von 240“, „das ergebnis plus 30“, „127,50 + 12“
function rechnerAusdruck(roh, vorher) {
  let t = String(roh || "").toLowerCase().trim().replace(/^(bitte )?(rechne|berechne|rechnen|was (ist|sind|ergibt|macht))\s+/, "").replace(/[?!=]+\s*$/, "").trim();
  t = t.replace(/\b(das ergebnis|ergebnis|davon)\b/g, vorher != null ? ` ${vorher} ` : " ");
  t = t.replace(/(\d+)\s+prozent\s+(von|aus)\s+/g, "$1 % * ").replace(/(\d)\s*%\s*(von|aus)\s+/g, "$1 % * ");
  t = t.replace(/\bgeteilt durch\b|\bdurch\b|\bgeteilt\b|÷|:/g, " / ").replace(/\bmal\b|×|\bx\b|\*/g, " * ").replace(/\bplus\b|\bund\b|\+/g, " + ")
    .replace(/\bminus\b|\bweniger\b|−|–/g, " - ").replace(/\bprozent\b/g, " % ").replace(/\bklammer auf\b/g, " ( ").replace(/\bklammer zu\b/g, " ) ").replace(/\bkomma\b/g, ",");
  t = t.replace(/[a-zäöüß]+/g, (w) => (w in RE_WORT ? String(RE_WORT[w]) : " "));
  t = t.replace(/(\d)\.(?=\d{3}(?:\D|$))/g, "$1").replace(/(\d)\s*,\s*(\d)/g, "$1.$2"); // 1.250 → 1250 (Tausenderpunkt), 127,50 → 127.50
  return t.replace(/\s+/g, " ").trim();
}
// kleiner Rechenkern: Zahlen, + − * /, Prozent als Nachzeichen (19 % = 0,19), Klammern, Vorzeichen; Punkt vor Strich
function rechnerRechnen(a) {
  const tok = String(a).match(/\d+(?:\.\d+)?|[-+*/%()]/g); if (!tok || !tok.length) throw new Error("leer");
  let i = 0;
  const zahl = () => { const x = tok[i++]; if (x === "(") { const v = summe(); if (tok[i++] !== ")") throw new Error("Klammer"); return v; }
    if (x === "-") return -zahl(); if (x === "+") return zahl(); const n = Number(x); if (!Number.isFinite(n)) throw new Error("Zahl"); return n; };
  const faktor = () => { let v = zahl(); while (tok[i] === "%") { i++; v /= 100; } return v; };
  const produkt = () => { let v = faktor(); while (tok[i] === "*" || tok[i] === "/") { const o = tok[i++], r = faktor(); v = o === "*" ? v * r : v / r; } return v; };
  const summe = () => { let v = produkt(); while (tok[i] === "+" || tok[i] === "-") { const o = tok[i++], r = produkt(); v = o === "+" ? v + r : v - r; } return v; };
  const v = summe(); if (i < tok.length) throw new Error("Rest"); return v;
}
const reHuebsch = (a) => a.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−").replace(/(\d)\.(\d)/g, "$1,$2");
function rechnerOeffnen(spruch) {
  blattAuf("rechnerBlatt", `<div class="re-geraet"><div class="re-kopf"><b>🧮 Tischrechner</b><button type="button" class="re-ton" id="reTon" onclick="reTonUmschalten()" aria-pressed="false" title="Ergebnis ansagen">🔈</button></div>
    <div class="re-anzeige" aria-live="polite"><small id="reRechnung"></small><b id="reWert">0</b></div>
    <div class="re-tasten" role="group" aria-label="Tasten">${[["C", "c"], ["(", "("], [")", ")"], ["÷", "/"], ["7"], ["8"], ["9"], ["×", "*"], ["4"], ["5"], ["6"], ["−", "-"], ["1"], ["2"], ["3"], ["+", "+"], ["%", "%"], ["0"], [",", "."], ["=", "="]]
      .map(([t, w]) => `<button type="button" class="re-t${/[0-9,]/.test(t) ? " zahl" : t === "=" ? " gleich" : t === "C" ? " loesch" : ""}" data-w="${w ?? t}" aria-label="${t === "C" ? "Löschen" : t}">${t}</button>`).join("")}</div>
    <div class="re-unten"><button type="button" class="knopf" onclick="reZurueck()" aria-label="Letzte Eingabe löschen">⌫</button>${typeof sbZuhoeren === "function" && (window.SpeechRecognition || window.webkitSpeechRecognition) ? '<button type="button" class="knopf haupt" id="reMikro" onclick="reSprechen()">🎤 Sagen</button>' : ""}<button type="button" class="knopf" onclick="fensterZu($('rechnerBlatt'))">Schließen</button></div></div>
    <div class="re-streifen"><div class="re-streifen-kopf"><b>🧾 Papierstreifen</b><button type="button" class="knopf klein" onclick="reStreifenLeeren()">Abreißen</button></div><ol id="reStreifen"></ol></div>
    <p class="hinweis" style="margin:6px 0 0">🎤 Zum Beispiel: „rechne 5 mal 22“, „125 geteilt durch 4“, „19 Prozent von 240“, „das Ergebnis plus 30“. Gerechnet wird nur auf diesem Gerät.</p>`);
  $("rechnerBlatt").querySelectorAll(".re-t").forEach((b) => b.addEventListener("click", () => reTaste(b.dataset.w)));
  reZeigen(); reStreifenZeigen();
  if (spruch) reAusSprache(spruch);
}
function reZeigen() { const r = $("reRechnung"), w = $("reWert"); if (!r || !w) return; r.textContent = RE.ergebnis != null && !RE.eingabe ? "" : reHuebsch(RE.eingabe); w.textContent = RE.eingabe ? reHuebsch(RE.eingabe.split(/[-+*/()% ]/).filter(Boolean).pop() || RE.eingabe.slice(-1)) : RE.ergebnis != null ? reZahl(RE.ergebnis) : "0"; }
function reStreifenZeigen() { const o = $("reStreifen"); if (!o) return; const l = reStreifen();
  o.innerHTML = l.length ? l.map((z) => `<li><button type="button" class="re-zeile" data-e="${esc(String(z.e))}" title="Ergebnis übernehmen">${esc(z.r)} = <b>${esc(reZahl(z.e))}</b></button></li>`).join("") : '<li class="hinweis">Noch leer.</li>';
  o.querySelectorAll(".re-zeile").forEach((b) => b.addEventListener("click", () => { RE.eingabe = String(b.dataset.e); RE.ergebnis = null; reZeigen(); })); }
function reStreifenLeeren() { try { localStorage.removeItem(RE_KEY); } catch {} reStreifenZeigen(); }
function reTonUmschalten() { RE.ansagen = !RE.ansagen; const b = $("reTon"); if (b) { b.textContent = RE.ansagen ? "🔊" : "🔈"; b.setAttribute("aria-pressed", String(RE.ansagen)); } melde(RE.ansagen ? "🔊 Ergebnis wird angesagt" : "🔈 Ergebnis ohne Ansage"); }
function reZurueck() { RE.eingabe = RE.eingabe.slice(0, -1); reZeigen(); }
function reTaste(w) {
  if (w === "c") { RE.eingabe = ""; RE.ergebnis = null; return reZeigen(); }
  if (w === "=") return reAusrechnen(RE.eingabe);
  if (!RE.eingabe && RE.ergebnis != null && /[-+*/%]/.test(w)) RE.eingabe = String(RE.ergebnis); // mit dem Ergebnis weiterrechnen
  RE.eingabe += w; reZeigen();
}
function reAusrechnen(a, gesagt) {
  if (!a) return;
  let e; try { e = rechnerRechnen(a); } catch { melde(gesagt ? `🧮 „${gesagt}“ – das konnte ich nicht ausrechnen. Bitte z. B. „5 mal 22“ sagen.` : "🧮 Die Rechnung ist unvollständig.", true); return; }
  if (!Number.isFinite(e)) { melde("🧮 Durch null geht nicht.", true); return; }
  reStreifenDazu({ r: reHuebsch(a), e }); RE.ergebnis = e; RE.eingabe = ""; reZeigen(); reStreifenZeigen();
  if (RE.ansagen || gesagt) try { speechSynthesis.cancel(); speechSynthesis.speak(sprechAusgabe(`${reHuebsch(a).replace(/×/g, " mal ").replace(/÷/g, " geteilt durch ").replace(/−/g, " minus ").replace(/\+/g, " plus ")} ist ${reZahl(e)}`)); } catch {}
}
function reAusSprache(text) { const a = rechnerAusdruck(text, RE.ergebnis); RE.eingabe = ""; reAusrechnen(a, text); }
function reSprechen() {
  const b = $("reMikro"); if (b) { b.disabled = true; b.textContent = "🎤 Ich höre zu …"; }
  const fertig = () => { if ($("reMikro")) { $("reMikro").disabled = false; $("reMikro").textContent = "🎤 Sagen"; } };
  sbZuhoeren((alt) => { fertig(); const gut = (alt || []).find((x) => { try { return Number.isFinite(rechnerRechnen(rechnerAusdruck(x, RE.ergebnis))); } catch { return false; } }) || alt?.[0]; if (gut) reAusSprache(gut); },
    (grund) => { fertig(); melde(grund || "Ich habe nichts verstanden.", true); });
}
