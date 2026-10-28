// KC-CLUB-TEILE Stufe 2 (Prüfbericht C, Wunsch Hansi 28.10.2026): Spiele – Tic-Tac-Toe, Schach, Doppelkopf, Bauernskat, Mensch ärgere dich nicht, Fang den Koch, Küchenterror, Spiel-Termine.
// Wird erst geladen, wenn ein Spiel geöffnet wird (Einstiege: spStart, spZeigen, spLaden, spOeffnen … – Platzhalter in app.js).
// Im Hauptprogramm bleiben: Zustand SP, Spiel-Einladung beim Start, Live-Anfragen (Online-Takt), Spiele-Einstellungen, mdKachelnOrdnen.
// Nach jeder Änderung hier: node tools/teile-pruefsumme.mjs
// ---------- KC-CLUB-SPIELE (2.7.0, Wunsch Hansi: „Spiele – Köcheclub Edition“) ----------
// Tic-Tac-Toe 3×3 (3 in einer Reihe) oder 4×4 (4 in einer Reihe). 🍅 Tomate gegen 🥦 Brokkoli.
// Gegen den Computer: läuft nur auf dem Gerät (Stärke leicht/mittel/schwer, Spielstand bleibt auf dem Gerät, „Zurücksetzen“).
// Gegen Mitglieder: Herausforderung → Annehmen → abwechselnd ziehen; der Server prüft jeden Zug (siehe Server KC-CLUB-SPIELE).
// Wer herausgefordert werden möchte, schaltet das unter ⚙️ → 🎲 Spiele ein (Standard aus).
const SP_ZEICHEN = { x: "🍅", o: "🥦" }, SP_NAME = { x: "Tomate", o: "Brokkoli" };
const SP_KEY = "kc_club_spiel_pc", SP_TAKT_MS = 3000;
const SP_ARTEN = [["ttt", "❌⭕", "Tic-Tac-Toe", "🍅 gegen 🥦 · 3 × 3 oder 4 × 4"], ["schach", "♟️", "Schach", "Die Küchenbrigade tritt an"], ["bsk", "🃏", "Bauernskat", "Zu zweit · französisches Blatt"], ["kt", "🔪", "Küchenterror", "Küchenquiz auf Zeit · 10 Sekunden je Frage"], ["mae", "🎲", "Mensch ärgere dich nicht", "Würfeln, rauswerfen, ins Ziel · bis zu 4 Farben"], ["fdk", "🧑‍🍳", "Fang den Koch", "Küchenrallye · Zutaten holen, kochen, klingeln"], ["dk", "👑", "Doppelkopf", "Zu viert · mit drei Computer-Köchen"]];
// KC-CLUB-SCHACH (2.8.0): Spielauswahl oben (gilt für „gegen den Computer“ und als Vorschlag beim Herausfordern)
function spArtWahl(a) { SP.pause = false; SP.nachholen = null; SP.art = ["schach", "bsk", "kt", "mae", "fdk", "dk"].includes(a) ? a : "ttt"; /* KC-CLUB-FDK-MG / KC-CLUB-DK-MG (2.219.0): jetzt auch gegen Mitglieder */ if (SP.offen) SP.offen = null; spZeigen(); if (SP.tab === "mg") spLaden(true); }
// KC-CLUB-SPIELE-PAUSE (2.18.0, Wunsch Hansi): je Spiel unten ein Umschalter ⏸ Pause ↔ ▶ Weiter.
// Gegen den Computer: Spiel steht still – Computer zieht nicht, Küchenterror-Uhr hält an, das Brett/die Frage ist verschwommen.
// Weiter: Küchenterror gibt nochmal 3-2-1 Lesezeit, dann läuft die restliche Zeit weiter. Gegen Mitglieder (Küchenterror) misst der
// Server die Zeit – dort gilt „Pause nach dieser Frage“ (danach geht es erst mit ▶ Weiter weiter); Brettspiele gegen Mitglieder warten ohnehin.
SP.pause = false; SP.nachholen = null;
function spPauseSichtbar() {
  if (aktuelleAnsicht !== "spiele") return false;
  if (SP.offen) return SP.offen.spiel === "kt" && SP.offen.status === "laeuft" && SP.offen.ichDran;
  if (SP.tab !== "pc" || !SP.art) return false;
  return SP.art !== "kt" || (!!KTP.z && KTP.z.phase !== "ende");
}
function spPauseZeigen() {
  const leiste = $("spPause"); if (!leiste) return;
  const zeigen = spPauseSichtbar(), mg = !!SP.offen;
  leiste.classList.toggle("versteckt", !zeigen);
  $("v-spiele").classList.toggle("pausiert", zeigen && SP.pause && !mg);
  if (!zeigen) return;
  const an = mg ? KTM.pause : SP.pause;
  leiste.innerHTML = an ? `<span class="sp-pause-text">⏸ ${mg && KTM.frage ? "Pause nach dieser Frage" : "Pause"}</span><button class="knopf haupt" onclick="spWeiter()">▶ Weiter</button>`
    : `<button class="knopf" onclick="spPausieren()" aria-label="Spiel anhalten">⏸ Pause</button>`;
}
function spPausieren() {
  if (SP.offen?.spiel === "kt") { KTM.pause = true; spPauseZeigen(); return melde(KTM.frage ? "⏸ Nach dieser Frage ist Pause" : "⏸ Pause – mit ▶ Weiter geht es weiter"); }
  SP.pause = true;
  if (SP.art === "kt") ktPcPausieren();
  try { speechSynthesis.cancel(); } catch {}
  spPauseZeigen();
}
function spWeiter() {
  if (SP.offen?.spiel === "kt") { KTM.pause = false; spPauseZeigen(); if (!KTM.frage && !KTM.aufl && SP.offen.ichDran && SP.offen.quiz?.offenBeiMir > 0) ktMgFrage(); else if (KTM.aufl) ktMgWeiter(); return; }
  SP.pause = false; spPauseZeigen();
  if (SP.art === "kt") return ktPcFortsetzen();
  const f = SP.nachholen; SP.nachholen = null; spZeigen(); if (f) setTimeout(f, 400);
}
const spPauseHalt = (f) => { if (!SP.pause) return false; SP.nachholen = f; return true; }; // Computer wartet, bis ▶ Weiter
function spZurueck() { // ‹ oben: Partie → Spiel → Übersicht → Startseite
  if (SP.offen) { SP.offen = null; spZeigen(); spLaden(true); }
  else if (SP.art) { SP.art = null; spZeigen(); }
  else zurueck("start");
}
function spKachelnZeigen() {
  const L = SP.liste, zahl = (a) => Array.isArray(L?.spiele) ? L.spiele.filter((g) => g.spiel === a && ((g.status === "laeuft" && g.ichDran) || (g.status === "angefragt" && !g.vonMir))).length : 0;
  $("spInhalt").innerHTML = `<p class="hinweis" style="margin:0 0 10px;text-align:center">Köcheclub Edition – such dir ein Spiel aus:</p>
    <div class="sp-kacheln">${SP_ARTEN.map(([a, sym, t, u]) => { const n = zahl(a);
      return `<button class="sp-kachel" onclick="spArtWahl('${a}')"${n ? ` aria-label="${t}, ${n} wartet auf dich"` : ""}><span class="sp-k-sym" aria-hidden="true">${sym}</span><span><b>${t}</b><small>${u}</small></span><span class="sp-k-pfeil" aria-hidden="true">›</span>${n ? `<span class="sp-k-zahl">${n}</span>` : ""}</button>`; }).join("")}</div>`;
  if (!L && !SP.laedt) spLaden(true);
}
let SPC = (() => { let w = null; try { w = JSON.parse(localStorage.getItem(SP_KEY) || "null"); } catch {}
  return { groesse: 3, staerke: "mittel", beginn: "ich", stand: { ich: 0, pc: 0, remis: 0 }, ...(w || {}), brett: null, ende: null, denkt: false }; })();
const spcMerken = () => { try { localStorage.setItem(SP_KEY, JSON.stringify({ groesse: SPC.groesse, staerke: SPC.staerke, beginn: SPC.beginn, stand: SPC.stand })); } catch {} };
function spLinien(n) {
  const l = [];
  for (let i = 0; i < n; i++) { l.push([...Array(n)].map((_, j) => i * n + j)); l.push([...Array(n)].map((_, j) => j * n + i)); }
  l.push([...Array(n)].map((_, j) => j * n + j)); l.push([...Array(n)].map((_, j) => j * n + (n - 1 - j)));
  return l;
}
function spAuswerten(b, n) {
  for (const l of spLinien(n)) { const c = b[l[0]]; if (c !== "." && l.every((i) => b[i] === c)) return { sieger: c, linie: l }; }
  return { sieger: null, linie: null, voll: !b.includes(".") };
}
// Computer: Bewertung über offene Reihen; Suche mit Alpha-Beta (3×3 vollständig = unschlagbar, 4×4 begrenzte Tiefe)
function spHeuristik(b, n) {
  let w = 0;
  for (const l of spLinien(n)) {
    let o = 0, x = 0; for (const i of l) { if (b[i] === "o") o++; else if (b[i] === "x") x++; }
    if (o && !x) w += 10 ** o; else if (x && !o) w -= 10 ** x;
  }
  return w;
}
function spSuche(b, n, tiefe, amZug, alpha, beta) {
  const a = spAuswerten(b, n);
  if (a.sieger === "o") return 100000 + tiefe; if (a.sieger === "x") return -100000 - tiefe; if (a.voll) return 0;
  if (tiefe === 0) return spHeuristik(b, n);
  const frei = []; for (let i = 0; i < b.length; i++) if (b[i] === ".") frei.push(i);
  if (amZug === "o") { let best = -Infinity; for (const i of frei) { best = Math.max(best, spSuche(b.slice(0, i) + "o" + b.slice(i + 1), n, tiefe - 1, "x", alpha, beta)); alpha = Math.max(alpha, best); if (alpha >= beta) break; } return best; }
  let best = Infinity; for (const i of frei) { best = Math.min(best, spSuche(b.slice(0, i) + "x" + b.slice(i + 1), n, tiefe - 1, "o", alpha, beta)); beta = Math.min(beta, best); if (alpha >= beta) break; } return best;
}
function spComputerZug(b, n, staerke) {
  const frei = []; for (let i = 0; i < b.length; i++) if (b[i] === ".") frei.push(i);
  const zufall = () => frei[Math.floor(Math.random() * frei.length)];
  const gewinntMit = (c) => frei.find((i) => spAuswerten(b.slice(0, i) + c + b.slice(i + 1), n).sieger === c);
  const sieg = gewinntMit("o"), block = gewinntMit("x");
  if (staerke === "leicht") return Math.random() < 0.4 && sieg !== undefined ? sieg : Math.random() < 0.25 && block !== undefined ? block : zufall();
  if (staerke === "mittel" && Math.random() < 0.45) return Math.random() < 0.5 ? (sieg ?? block ?? zufall()) : zufall();
  if (sieg !== undefined) return sieg; if (block !== undefined) return block;
  const tiefe = n === 3 ? 9 : staerke === "schwer" ? 4 : 2;
  let best = -Infinity, wahl = []; // gleich gute Züge zufällig wählen – sonst spielt er immer gleich
  for (const i of frei) { const w = spSuche(b.slice(0, i) + "o" + b.slice(i + 1), n, tiefe - 1, "x", -Infinity, Infinity); if (w > best) { best = w; wahl = [i]; } else if (w === best) wahl.push(i); }
  return wahl[Math.floor(Math.random() * wahl.length)] ?? zufall();
}
// ----- Ansicht -----
function spStart(tab, art) { if (tab) SP.tab = tab; SP.art = art || null; SP.offen = null; zeige("spiele"); setTimeout(spHinweisEinmal, 600); /* 2.22.13 */ }
function spTab(t) { SP.tab = t; SP.offen = null; spZeigen(); if (t === "mg") spLaden(); }
function spZeigen() {
  document.body.classList.remove("kt-aktiv"); // 2.17.1: nur während einer Küchenterror-Frage (setzt ktBildFrei)
  setTimeout(spPauseZeigen, 0); // 2.18.0
  const uebersicht = !SP.art && !SP.offen;
  ["spEdition", "spTabs"].forEach((id) => $(id).classList.toggle("versteckt", uebersicht));
  if (uebersicht) { clearInterval(SP.takt); SP.takt = null; return spKachelnZeigen(); }
  document.querySelectorAll("#spTabs button").forEach((b) => b.classList.toggle("an", b.dataset.t === SP.tab));
  const art = SP.tab === "mg" && SP.offen ? SP.offen.spiel : SP.art;
  document.querySelectorAll("#spArt button").forEach((b) => b.classList.toggle("an", b.dataset.a === art));
  $("spArt").classList.add("versteckt"); // Spielwechsel jetzt über die Kacheln (‹ zurück)
  $("spEdition").innerHTML = art === "schach" ? `<b>♟️ Schach</b><span>Köcheclub Edition · ${schBrigade() ? "Küchenbrigade Weiß gegen Schwarz" : "Weiß gegen Schwarz"}</span>` : art === "bsk" ? "<b>🃏 Bauernskat</b><span>Köcheclub Edition · zu zweit</span>" : art === "kt" ? "<b>🔪 Küchenterror</b><span>Köcheclub Edition · Küchenquiz auf Zeit</span>" : art === "mae" ? "<b>🎲 Mensch ärgere dich nicht</b><span>Köcheclub Edition · würfeln, rauswerfen, ins Ziel</span>" : art === "fdk" ? "<b>🧑‍🍳 Fang den Koch</b><span>Köcheclub Edition · das Küchen-Brettspiel</span>" : art === "dk" ? "<b>👑 Doppelkopf</b><span>Köcheclub Edition · zu viert</span>" : "<b>Tic-Tac-Toe</b><span>Köcheclub Edition · 🍅 gegen 🥦</span>";
  clearInterval(SP.takt); SP.takt = null;
  document.body.classList.remove("sch-fokus"); // KC-CLUB-SCHACH-FOKUS: setzt nur das laufende Schachspiel wieder
  schNsStopp(); // KC-CLUB-SCHACH-ARCHIV: Nachspielen endet beim Wechsel
  if (SP.tab === "pc") return SP.art === "schach" ? schPcZeigen() : SP.art === "bsk" ? bskPcZeigen() : SP.art === "kt" ? ktPcZeigen() : SP.art === "mae" ? (maePcZeigen(), maePcFortsetzen()) : SP.art === "fdk" ? (fdkPcZeigen(), fdkFortsetzen()) : SP.art === "dk" ? dkPcZeigen() : spPcZeigen();
  if (SP.offen) return spSpielZeigen();
  spListeZeigen();
}
function spBrettHtml(b, n, { linie = null, klick = null, aus = false } = {}) {
  return `<div class="sp-brett sp-${n}" role="grid" aria-label="Spielfeld ${n} mal ${n}">${[...b].map((c, i) =>
    `<button class="sp-feld${linie?.includes(i) ? " sp-sieg" : ""}${c === "." ? " frei" : ""}" ${c !== "." || aus ? "disabled" : ""} onclick="${klick}(${i})" aria-label="Feld ${Math.floor(i / n) + 1}-${i % n + 1}${c !== "." ? ": " + SP_NAME[c] : " frei"}">${c === "." ? "" : SP_ZEICHEN[c]}</button>`).join("")}</div>`;
}
const spWahl = (name, wert, optionen, fn) => `<div class="sp-wahl" role="group" aria-label="${esc(name)}"><span>${esc(name)}</span>${optionen.map(([w, t]) => `<button class="${w === wert ? "an" : ""}" aria-pressed="${w === wert}" onclick="${fn}('${w}')">${t}</button>`).join("")}</div>`;
function spPcZeigen() {
  if (!SPC.brett || SPC.brett.length !== SPC.groesse ** 2) spPcNeu(false);
  const n = SPC.groesse, s = SPC.stand, e = SPC.ende;
  const status = e ? (e.sieger === "x" ? `<div class="sp-banner sieg">🏆 Du hast gewonnen!</div>` : e.sieger === "o" ? `<div class="sp-banner niederlage">🤖 Der Computer hat gewonnen</div>` : `<div class="sp-banner remis">🤝 Unentschieden</div>`)
    : `<div class="sp-status">${SPC.denkt ? "🤖 Der Computer überlegt …" : `Du bist dran – du spielst ${SP_ZEICHEN.x} ${SP_NAME.x}`}</div>`;
  $("spInhalt").innerHTML = `<div class="karte sp-karte">
      ${spWahl("Feld", String(n), [["3", "3 × 3"], ["4", "4 × 4"]], "spPcGroesse")}
      ${spWahl("Stärke", SPC.staerke, [["leicht", "😊 Leicht"], ["mittel", "🙂 Mittel"], ["schwer", "😎 Schwer"]], "spPcStaerke")}
      ${spWahl("Beginn", SPC.beginn, [["ich", "Ich"], ["pc", "Computer"], ["wechsel", "Wechselnd"]], "spPcBeginn")}
      <div class="sp-stand"><span>${SP_ZEICHEN.x} Du <b>${s.ich}</b></span><span>🤝 <b>${s.remis}</b></span><span><b>${s.pc}</b> Computer ${SP_ZEICHEN.o}</span></div>
      ${status}
      ${spBrettHtml(SPC.brett, n, { linie: e?.linie, klick: "spPcZug", aus: !!e || SPC.denkt })}
      <p class="hinweis" style="text-align:center;margin:6px 0">${n === 3 ? "Drei" : "Vier"} in einer Reihe gewinnen – waagerecht, senkrecht oder schräg.</p>
      ${spLeiste(spNeuKnopf("spPcNeu()"), spAbbrechenKnopf("spPcAbbrechen()"), schTonKnopf(), spStandKnopf("spPcStandWeg()"))}
    </div>`;
}
function spPcNeu(zeigen = true) {
  const n = SPC.groesse; SPC.brett = ".".repeat(n * n); SPC.ende = null; SPC.denkt = false;
  SPC.runde = (SPC.runde || 0) + 1;
  const pcZuerst = SPC.beginn === "pc" || (SPC.beginn === "wechsel" && SPC.runde % 2 === 0);
  if (pcZuerst) { SPC.denkt = true; setTimeout(spPcComputer, 500); }
  if (zeigen) spPcZeigen();
}
const spPcGroesse = (g) => { SPC.groesse = Number(g) === 4 ? 4 : 3; spcMerken(); spPcNeu(); };
const spPcStaerke = (w) => { SPC.staerke = ["leicht", "mittel", "schwer"].includes(w) ? w : "mittel"; spcMerken(); spPcNeu(); };
const spPcBeginn = (w) => { SPC.beginn = ["ich", "pc", "wechsel"].includes(w) ? w : "ich"; spcMerken(); SPC.runde = 0; spPcNeu(); };
async function spPcStandWeg() {
  if (!(await frage("Spielstand gegen den Computer auf 0 : 0 zurücksetzen?", { ja: "🗑️ Zurücksetzen", nein: "Abbrechen" }))) return;
  SPC.stand = { ich: 0, pc: 0, remis: 0 }; spcMerken(); spPcNeu();
}
function spPcEnde() {
  const a = spAuswerten(SPC.brett, SPC.groesse);
  if (!a.sieger && !a.voll) return false;
  SPC.ende = a; SPC.denkt = false;
  if (a.sieger === "x") SPC.stand.ich++; else if (a.sieger === "o") SPC.stand.pc++; else SPC.stand.remis++;
  spcMerken(); try { navigator.vibrate?.(a.sieger === "x" ? [60, 40, 60] : 40); } catch {}
  spTttTon(a.sieger === "x" ? "sieg" : a.sieger === "o" ? "niederlage" : "remis"); // KC-CLUB-TTT-TOENE
  return true;
}
function spPcZug(i) {
  if (SPC.ende || SPC.denkt || SPC.brett[i] !== ".") return;
  SPC.brett = SPC.brett.slice(0, i) + "x" + SPC.brett.slice(i + 1);
  if (!spPcEnde()) { spTttTon("ich"); SPC.denkt = true; setTimeout(spPcComputer, 450); }
  spPcZeigen();
}
function spPcComputer() {
  if (spPauseHalt(spPcComputer)) { SPC.denkt = false; return; }
  if (SPC.ende || aktuelleAnsicht !== "spiele" || SP.art !== "ttt") { SPC.denkt = false; return; }
  const i = spComputerZug(SPC.brett, SPC.groesse, SPC.staerke);
  if (i !== undefined) SPC.brett = SPC.brett.slice(0, i) + "o" + SPC.brett.slice(i + 1);
  SPC.denkt = false; if (!spPcEnde() && i !== undefined) spTttTon("gegner");
  if (SP.tab === "pc" && SP.art === "ttt") spPcZeigen();
}
// ----- gegen Mitglieder -----
async function spLaden(still) {
  if (SP.laedt) return; SP.laedt = true;
  try { SP.liste = await api("spiele_liste", {}, { warten: !still }); } catch (e) { if (!still) meldeFehler(e); } finally { SP.laedt = false; }
  if (aktuelleAnsicht === "spiele" && !SP.art && !SP.offen) spKachelnZeigen();
  else if (aktuelleAnsicht === "spiele" && SP.tab === "mg" && !SP.offen) spListeZeigen();
}
function spErgebnisText(g) { return g.ergebnis === "gewonnen" ? (g.aufgegeben ? "🏆 gewonnen (aufgegeben)" : "🏆 gewonnen") : g.ergebnis === "verloren" ? (g.aufgegeben ? "aufgegeben" : "verloren") : g.ergebnis === "remis" ? "🤝 unentschieden" : ""; }
function spListeZeigen() {
  const L = SP.liste;
  if (!L) { $("spInhalt").innerHTML = '<div class="karte hinweis">Wird geladen …</div>'; return; }
  const art = SP.art, alle = L.spiele.filter((g) => !art || g.spiel === art); // 2.11.0: nur Partien des gewählten Spiels
  const an = alle.filter((g) => g.status === "angefragt" && !g.vonMir), meine = alle.filter((g) => g.status === "angefragt" && g.vonMir);
  const laufend = alle.filter((g) => g.status === "laeuft").sort((a, b) => b.ichDran - a.ichDran), fertig = alle.filter((g) => g.status === "beendet").slice(0, 8);
  const zeile = (g, rechts) => `<div class="zeile sp-zeile" ${["laeuft", "beendet", "angefragt"].includes(g.status) ? `style="cursor:pointer" onclick="if(!event.target.closest('button'))spOeffnen('${g.id}')"` : ""}>${kreis(MITGLIEDER?.find((m) => m.person_id === g.gegner.person_id) || {}, g.gegner.name, 36)}
    <div style="flex:1;min-width:0"><b>${esc(g.gegner.vorname)}</b><div class="hinweis" style="margin:0;font-size:.85rem">${spTitel(g)}</div>${spTerminKurz(g)}</div>${rechts}</div>`;
  $("spInhalt").innerHTML = `
    ${L.ichBereit ? "" : `<div class="karte" style="border:2px solid var(--gruen)"><b>🎲 Möchtest du auch herausgefordert werden?</b><p class="hinweis" style="margin:4px 0 8px">Dann sehen dich die anderen in der Liste und können dich zu einer Partie einladen.</p><button class="knopf haupt" onclick="spBereitSetzen(true)">✅ Ja, ich spiele mit</button></div>`}
    <button class="knopf haupt" style="width:100%" onclick="spHerausfordernBlatt()">🎲 Jemanden herausfordern</button>
    ${spPokalHtml(L)}
    ${an.length ? `<div class="karte"><h3>📩 Herausforderungen an dich</h3>${an.map((g) => zeile(g, "") + `<div class="knoepfe" style="margin:0 0 8px"><button class="knopf haupt" onclick="spAntwort('${g.id}', true)">✅ Annehmen</button><button class="knopf" onclick="spAntwort('${g.id}', false)">Ablehnen</button></div>`).join("")}</div>` : ""}
    ${laufend.length ? `<div class="karte"><h3>▶ Laufende Spiele</h3>${laufend.map((g) => zeile(g, g.ichDran ? '<span class="sp-dran">Du bist dran ›</span>' : '<span class="hinweis">wartet …</span>')).join("")}</div>` : ""}
    ${meine.length ? `<div class="karte"><h3>⏳ Du hast herausgefordert</h3>${meine.map((g) => zeile(g, `<button class="knopf klein" onclick="spAufgeben('${g.id}', true)">Zurückziehen</button>`)).join("")}</div>` : ""}
    ${fertig.length ? `<div class="karte"><h3>✅ Zuletzt gespielt</h3>${fertig.map((g) => zeile(g, `<span class="hinweis">${spErgebnisText(g)}</span>`)).join("")}</div>` : ""}
    ${!an.length && !laufend.length && !meine.length && !fertig.length ? `<div class="karte hinweis">Noch keine Partie gegen Mitglieder. ${L.bereit.length ? `${L.bereit.length} Mitglied${L.bereit.length === 1 ? " spielt" : "er spielen"} gerne mit – fordere jemanden heraus!` : "Noch niemand hat „Herausfordern erlauben“ eingeschaltet."}</div>` : ""}
    ${L.rangliste.length ? `<div class="karte"><h3>📊 Club-Rangliste (alle Zeiten)</h3><p class="hinweis" style="margin:0 0 6px">Sieg = 2 Punkte, Unentschieden = 1 Punkt.</p>${L.rangliste.map((r, i) => `<div class="zeile"><b style="width:1.8em">${["🥇", "🥈", "🥉"][i] || i + 1 + "."}</b><span style="flex:1">${esc(r.vorname)}</span><span class="hinweis">${r.siege} S · ${r.remis} U · ${r.niederlagen} N</span><b style="margin-left:8px">${r.punkte}</b></div>`).join("")}</div>` : ""}`;
}
// KC-CLUB-SPIELE-POKAL (2.7.1, Wunsch Hansi): 🏆 Pokal des Monats – Vormonat vergeben, laufender Monat „wer liegt vorn“
function spPokalHtml(L) {
  const v = L.pokalVormonat, m = L.monat; if (!v && !m) return "";
  const namen = (l) => l.map((x) => esc(x.vorname)).join(" & ");
  return `<div class="karte sp-pokal">
    ${v?.sieger?.length ? `<div class="sp-pokal-kopf"><span class="sp-pokal-sym" aria-hidden="true">🏆</span><div><div class="hinweis" style="margin:0">Pokal des Monats ${esc(v.name)}</div><b>${namen(v.sieger)}</b><div class="hinweis" style="margin:0">${v.sieger[0].siege} Sieg${v.sieger[0].siege === 1 ? "" : "e"} · ${v.sieger[0].punkte} Punkte – herzlichen Glückwunsch!</div></div></div>` : `<div class="sp-pokal-kopf"><span class="sp-pokal-sym" aria-hidden="true">🏆</span><div><b>Pokal des Monats</b><div class="hinweis" style="margin:0">Wer im Monat die meisten Punkte holt, bekommt den Pokal.</div></div></div>`}
    <h3 style="margin:10px 0 4px">${esc(m?.name || "Dieser Monat")} – wer liegt vorn?</h3>
    ${m?.liste?.length ? m.liste.map((r, i) => `<div class="zeile"><b style="width:1.8em">${["🥇", "🥈", "🥉"][i] || i + 1 + "."}</b><span style="flex:1">${esc(r.vorname)}</span><span class="hinweis">${r.siege} S · ${r.remis} U · ${r.niederlagen} N</span><b style="margin-left:8px">${r.punkte}</b></div>`).join("") : '<p class="hinweis" style="margin:0">Noch keine Partie in diesem Monat – der Pokal ist noch zu haben!</p>'}
    <p class="hinweis" style="margin:6px 0 0">Sieg = 2 Punkte, Unentschieden = 1 Punkt. Nur Partien gegen Mitglieder zählen.</p></div>`;
}
async function spHinweisEinmal() {
  if (!spHinweisFaellig()) return;
  lsSetzen(SP_HINWEIS, "1");
  if (await frage(spHinweisText, { ja: "👍 Passt so", nein: "⚙️ Abstellen / einstellen" }) === false) einstiegHin("privat", "setSpiele");
}
function spArtSchalten(art) { const l = spMeineArten(), neu = l.includes(art) ? l.filter((x) => x !== art) : [...l, art]; if (!neu.length) return melde("Mindestens ein Spiel muss angehakt bleiben – sonst „Herausfordern erlauben“ ausschalten."); spBereitSetzen(true, neu); }
async function spBereitSetzen(an, arten) {
  const spiele = arten || spMeineArten();
  try { await einstSpeichern("spiele", { herausforderung: !!an, spiele }); INIT.einstellungen = { ...(INIT.einstellungen || {}), spiele: { herausforderung: !!an, spiele } };
    melde(an ? "🎲 Andere dürfen dich jetzt herausfordern" : "🎲 Niemand kann dich mehr herausfordern"); spEinstZeigen(); if (SP.liste) SP.liste.ichBereit = !!an; if (aktuelleAnsicht === "spiele") spZeigen(); }
  catch (e) { spEinstZeigen(); meldeFehler(e); }
}
async function spHerausfordernBlatt(pid) {
  if (!SP.liste) await spLaden(true);
  const alle = SP.liste?.bereit || [];
  if (!alle.length) return melde("Noch niemand hat „Herausfordern erlauben“ eingeschaltet – frag doch mal im Club 🙂");
  let gr = 3, art = SP.art || "ttt", stufe = "mittel", uhr = "0", maePc = "ja", fdkStufe = FDKP.stufe || "leicht", fdkAnzahl = String(FDKP.anzahl || 2); // 2.219.0: Fang den Koch – Gerichte und Länge // 2.26.0: Mensch ärgere dich nicht – freie Farben spielt der Computer // 2.10.0: auch Bauernskat; 2.16.0: Zeitstufe für Küchenterror; 2.23.38: Schachuhr
  const f = blattAuf("spHerausBlatt", `${einwHtml("b-sp-herausfordern")}<div id="spHerausInhalt"></div><button class="knopf" onclick="fensterZu(document.getElementById('spHerausBlatt'))">Abbrechen</button>`);
  const zeichnen = () => {
    const b = alle.filter((m) => (m.spiele || ["ttt"]).includes(art));
    $("spHerausInhalt").innerHTML = `<h3 style="margin:0">🎲 Herausfordern</h3>
      <div class="kt-wahl sp-spielwahl">${spWahl("Spiel", art, [["ttt", "<span class=\"kt-emo\">❌⭕</span>Tic-Tac-Toe"], ["schach", "<span class=\"kt-emo\">♟️</span>Schach"], ["bsk", "<span class=\"kt-emo\">🃏</span>Bauernskat"], ["kt", "<span class=\"kt-emo\">🔪</span>Küchen&shy;terror"], ["mae", "<span class=\"kt-emo\">🎲</span>Mensch ärgere dich nicht"], ["fdk", "<span class=\"kt-emo\">🧑‍🍳</span>Fang den Koch"], ["dk", "<span class=\"kt-emo\">👑</span>Doppel&shy;kopf"]], "spHerausArt")}</div>
      ${art === "fdk" ? `<div class="kt-wahl">${spWahl("Gerichte", fdkStufe, [["leicht", "<span class=\"kt-emo\">😊</span>Leicht"], ["mittel", "<span class=\"kt-emo\">🙂</span>Mittel"], ["schwer", "<span class=\"kt-emo\">😎</span>Schwer"]], "spHerausFdkStufe")}</div>${spWahl("Länge", fdkAnzahl, [["1", "1 Gericht"], ["2", "2 Gerichte"], ["3", "3 Gerichte"]], "spHerausFdkAnzahl")}` : ""}
      ${art === "mae" ? `<div class="kt-wahl">${spWahl("Mitspieler", maePc, [["ja", "<span class=\"kt-emo\">👥🤖🤖</span>Ihr zwei + 2 Computer"], ["nein", "<span class=\"kt-emo\">👥</span>Nur ihr zwei"]], "spHerausMaePc")}</div>` : ""}
      ${art === "ttt" ? spWahl("Feld", String(gr), [["3", "3 × 3"], ["4", "4 × 4"]], "spHerausGroesse") : ""}
      ${art === "kt" ? spWahl("Zeit", stufe, [["leicht", "😊 20 s"], ["mittel", "🙂 15 s"], ["schwer", "😎 10 s"]], "spHerausStufe") : ""}
      ${art === "schach" ? spWahl("Uhr", uhr, [["0", "📨 Fern"], ...SCH_UHR_MIN.map((m) => [String(m), `⏱️ ${m}′`])], "spHerausUhr") : ""}
      <p class="hinweis" style="margin:0">Wen möchtest du herausfordern? ${art === "mae" ? `Du spielst 🔴 Rot und fängst an, dein Gegenüber spielt 🟢 Grün.${maePc === "ja" ? " 🔵 Blau und 🟡 Gelb spielt der Computer mit – das macht es spannender." : ""} Der Server würfelt für alle – niemand kann schummeln.` : art === "fdk" ? "Ihr bekommt gleich schwere Gerichte – wer schneller und sauberer kocht, gewinnt. Du hast die rote Mütze und fängst an. Der Server würfelt und mischt die Karten – niemand kann schummeln." : art === "dk" ? "Ihr zwei sitzt euch gegenüber, die anderen beiden Plätze spielt der Computer. Wer mit wem spielt, zeigt sich erst mit der ♣ Dame. Wer von euch mehr Punkte holt, gewinnt." : art === "bsk" ? "Du bist Vorhand und sagst Trumpf an. Die Karten mischt der Server – niemand sieht fremde Karten." : art === "kt" ? "12 Küchenfragen in 4 Runden, ihr spielt abwechselnd je eine Runde. Die Zeit je Frage wählst du oben – schnell und richtig gibt die meisten Punkte. Die letzte ist eine 🎖️ Meisterfrage und zählt doppelt. Du fängst an." : `Du fängst an (${art === "schach" ? "Weiß" : SP_ZEICHEN.x}).${art === "schach" ? (uhr === "0" ? " 📨 Fernpartie: jeder zieht, wann er Zeit hat." : ` ⏱️ Live mit Schachuhr: ${uhr} Minuten je Spieler – am besten, wenn ihr beide gerade Zeit habt.`) : ""}`}</p>
      ${(() => {
        // KC-CLUB-SPIEL-LIVE (2.22.6, Wunsch Hansi): sofort herausfordern nur, wer gerade online ist; sonst Person suchen → Terminanfrage
        const sym = art === "schach" ? "♟️" : art === "bsk" ? "🃏" : art === "kt" ? "🔪" : art === "fdk" ? "🧑‍🍳" : art === "dk" ? "👑" : "🎲";
        const on = b.filter((m) => ONL?.ids?.has(m.person_id)), weg = b.filter((m) => !ONL?.ids?.has(m.person_id));
        const q = spHerausSuche.trim().toLowerCase(), treffer = q ? weg.filter((m) => m.name.toLowerCase().includes(q)) : [];
        const person = (m, knopf) => `<div class="zeile sp-wer${m.person_id === pid ? " an" : ""}">${kreis(MITGLIEDER?.find((x) => x.person_id === m.person_id) || {}, m.name, 36)}<b style="flex:1;text-align:left">${esc(m.name)}</b>${knopf}</div>`;
        if (!b.length) return `<p class="hinweis">Für ${esc((SP_NAMEN[art] || "").replace(/^\S+ /, "")) || "Tic-Tac-Toe"} hat sich noch niemand freigeschaltet.</p>`;
        return `<b>🟢 Gerade online – sofort spielen</b>
          ${on.length ? on.map((m) => person(m, `<button class="knopf haupt klein" onclick="spHerausfordern('${m.person_id}')">${sym} Herausfordern</button>`)).join("") : '<p class="hinweis" style="margin:0">Gerade ist niemand online, der mitspielt.</p>'}
          ${weg.length ? `<b style="margin-top:8px;display:block">📅 Nicht online? Termin anfragen</b>
          <input id="spHerausSucheFeld" type="search" placeholder="🔍 Name suchen …" value="${esc(spHerausSuche)}" oninput="spHerausSuchen(this.value)" style="width:100%;box-sizing:border-box;padding:10px;border-radius:12px;border:1px solid var(--linie);background:var(--bg);color:var(--text)">
          ${q ? (treffer.length ? treffer.map((m) => person(m, `<button class="knopf klein" onclick="spHerausTermin('${m.person_id}')">📅 Terminanfrage</button>`)).join("") : '<p class="hinweis" style="margin:0">Niemand gefunden.</p>') : `<p class="hinweis" style="margin:0">${weg.length} weitere${weg.length === 1 ? "s Mitglied spielt" : " Mitglieder spielen"} mit – Namen eingeben.</p>`}` : ""}`;
      })()}`;
  };
  let spHerausSuche = "";
  window.spHerausSuchen = (v) => { spHerausSuche = v; zeichnen(); const e = $("spHerausSucheFeld"); if (e) { e.focus(); e.setSelectionRange(v.length, v.length); } };
  window.spHerausArt = (a) => { art = ["schach", "bsk", "kt", "mae", "fdk", "dk"].includes(a) ? a : "ttt"; zeichnen(); };
  window.spHerausFdkStufe = (w) => { fdkStufe = ["leicht", "mittel", "schwer"].includes(w) ? w : "leicht"; zeichnen(); };
  window.spHerausFdkAnzahl = (w) => { fdkAnzahl = ["1", "2", "3"].includes(String(w)) ? String(w) : "2"; zeichnen(); };
  window.spHerausMaePc = (w) => { maePc = w === "nein" ? "nein" : "ja"; zeichnen(); };
  window.spHerausGroesse = (g) => { gr = Number(g) === 4 ? 4 : 3; zeichnen(); };
  window.spHerausStufe = (w) => { stufe = KT_ZEIT[w] ? w : "mittel"; zeichnen(); };
  window.spHerausUhr = (w) => { uhr = SCH_UHR_MIN.includes(Number(w)) ? String(w) : "0"; zeichnen(); };
  zeichnen();
  // nicht online: Herausforderung anlegen und gleich den Termin vorschlagen (vorhandene Terminanfrage für Partien)
  window.spHerausTermin = async (an) => {
    try { const r = await api("spiel_herausfordern", { an, groesse: gr, spiel: art, ...(art === "kt" ? { stufe } : {}), ...(art === "schach" && uhr !== "0" ? { uhr: Number(uhr) } : {}), ...(art === "mae" ? { computer: maePc === "ja" } : {}), ...(art === "fdk" ? { stufe: fdkStufe, anzahl: Number(fdkAnzahl) } : {}) }, { warten: true }); f.remove();
      SP.tab = "mg"; SP.offen = null; SP.art = art; await spLaden(true); spTerminBlatt(r.spiel.id); }
    catch (e) { if (!(await spSchonOffen(e, an, f, true))) meldeFehler(e); }
  };
  window.spHerausfordern = async (an) => {
    try { const r = await api("spiel_herausfordern", { an, groesse: gr, spiel: art, ...(art === "kt" ? { stufe } : {}), ...(art === "schach" && uhr !== "0" ? { uhr: Number(uhr) } : {}), ...(art === "mae" ? { computer: maePc === "ja" } : {}), ...(art === "fdk" ? { stufe: fdkStufe, anzahl: Number(fdkAnzahl) } : {}) }, { warten: true }); f.remove(); melde(`🎲 Herausforderung an ${r.spiel.gegner.vorname} geschickt`); SP.tab = "mg"; SP.offen = null; SP.art = art; await spLaden(true); if (aktuelleAnsicht !== "spiele") zeige("spiele"); else spZeigen(); }
    catch (e) { if (!(await spSchonOffen(e, an, f, false))) meldeFehler(e); }
  };
}
// KC-CLUB-SPIEL-SCHON-OFFEN (2.23.25, Fund Hansi): gibt es schon eine offene Herausforderung mit dieser Person, statt nur „schon
// herausgefordert“ zu melden direkt dorthin – beim Termin-Weg gleich das Termin-Fenster der vorhandenen Herausforderung
async function spSchonOffen(e, an, f, mitTermin) {
  if (!/schon herausgefordert/i.test(String(e?.message || ""))) return false;
  await spLaden(true);
  const g = (SP.liste?.spiele || []).find((x) => x.status === "angefragt" && x.gegner?.person_id === an); if (!g) return false;
  f?.remove(); SP.tab = "mg"; SP.art = g.spiel;
  if (mitTermin && g.vonMir) { melde(`Es gibt schon eine offene Herausforderung an ${g.gegner.vorname} – Termin dafür vorschlagen:`); spTerminBlatt(g.id); }
  else { melde(g.vonMir ? `Du hast ${g.gegner.vorname} schon herausgefordert – hier ist die offene Herausforderung` : `${g.gegner.vorname} hat dich schon herausgefordert – nimm einfach an`); await spOeffnen(g.id); }
  return true;
}
async function spLiveAntwort(id, annehmen) {
  $("spLiveBlatt")?.remove();
  if (!annehmen) return spAntwort(id, false);
  try { await api("spiel_antwort", { id, annehmen: true }, { warten: true }); await spOeffnen(id); } catch (e) { meldeFehler(e); }
}
async function spAntwort(id, annehmen) {
  try { const r = await api("spiel_antwort", { id, annehmen }, { warten: true }); if (annehmen) { SP.offen = r.spiel; spZeigen(); } else { melde("Abgelehnt"); spLaden(true); } }
  catch (e) { meldeFehler(e); spLaden(true); }
}
async function spOeffnen(id) {
  SP.tab = "mg";
  try { SP.offen = (await api("spiel_holen", { id }, { warten: true })).spiel; SP.art = SP.offen.spiel; } catch (e) { SP.offen = null; meldeFehler(e); }
  if (aktuelleAnsicht !== "spiele") zeige("spiele"); else spZeigen();
}
function spSpielZeigen() {
  clearInterval(SP.takt); SP.takt = null; // 2.425.0 KC-CLUB-GENERALCHECK: jeder eigene Zug startete sonst einen weiteren Takt, der nie endete
  if (SP.offen.spiel === "kt") { ktSpielZeigen(SP.offen); if (SP.offen.status === "laeuft" || SP.offen.status === "angefragt") SP.takt = setInterval(spNachsehen, SP_TAKT_MS); return; }
  if (SP.offen.spiel === "fdk") { fdkSpielZeigen(SP.offen); if (SP.offen.status === "laeuft" || SP.offen.status === "angefragt") SP.takt = setInterval(spNachsehen, SP_TAKT_MS); return; } // KC-CLUB-FDK-MG
  if (SP.offen.spiel === "dk") { dkSpielZeigen(SP.offen); if (SP.offen.status === "laeuft" || SP.offen.status === "angefragt") SP.takt = setInterval(spNachsehen, SP_TAKT_MS); return; } // KC-CLUB-DK-MG
  if (SP.offen.spiel === "mae") { maeSpielZeigen(SP.offen); if (SP.offen.status === "laeuft" || SP.offen.status === "angefragt") SP.takt = setInterval(spNachsehen, SP_TAKT_MS); return; } // KC-CLUB-MAE
  if (SP.offen.spiel === "bsk") { bskSpielZeigen(SP.offen); if (SP.offen.status === "laeuft" || SP.offen.status === "angefragt") SP.takt = setInterval(spNachsehen, SP_TAKT_MS); return; }
  if (SP.offen.spiel === "schach") { schSpielZeigen(SP.offen); if (SP.offen.status === "laeuft" || SP.offen.status === "angefragt") SP.takt = setInterval(spNachsehen, SP_TAKT_MS); return; }
  const g = SP.offen, n = g.groesse, ich = g.ichBin, er = ich === "x" ? "o" : "x";
  spTttTonMg(g); // KC-CLUB-TTT-TOENE
  const banner = g.status === "beendet" ? (g.ergebnis === "gewonnen" ? `<div class="sp-banner sieg">🏆 Du hast gewonnen!${g.aufgegeben ? ` ${esc(g.gegner.vorname)} hat aufgegeben.` : ""}</div>` : g.ergebnis === "verloren" ? `<div class="sp-banner niederlage">${g.aufgegeben ? "Du hast aufgegeben." : `${esc(g.gegner.vorname)} hat gewonnen.`}</div>` : `<div class="sp-banner remis">🤝 Unentschieden</div>`)
    : g.status === "angefragt" ? `<div class="sp-status">⏳ Warte, bis ${esc(g.gegner.vorname)} annimmt …</div>`
    : g.status !== "laeuft" ? `<div class="sp-status">Diese Partie findet nicht statt.</div>`
    : `<div class="sp-status${g.ichDran ? " sp-ichdran" : ""}">${g.ichDran ? `Du bist dran – du spielst ${SP_ZEICHEN[ich]} ${SP_NAME[ich]}` : `${esc(g.gegner.vorname)} ist dran (${SP_ZEICHEN[er]}) …`}</div>`;
  $("spInhalt").innerHTML = `<div class="karte sp-karte">
      <div class="zeile" style="border:none;padding:0"><button class="knopf klein" onclick="SP.offen=null;spZeigen();spLaden(true)">‹ Übersicht</button><b style="flex:1;text-align:right">${SP_ZEICHEN[ich]} Du gegen ${esc(g.gegner.vorname)} ${SP_ZEICHEN[er]}</b></div>
      ${banner}
      ${spTerminHtml(g)}
      ${spBrettHtml(g.brett, n, { linie: g.linie, klick: "spZug", aus: !g.ichDran })}
      <p class="hinweis" style="text-align:center;margin:6px 0">${n === 3 ? "Drei" : "Vier"} in einer Reihe gewinnen. Du musst nicht warten – ${esc(g.gegner.vorname)} bekommt Bescheid.</p>
      ${spLeiste(g.status === "beendet" ? spKnopf("↺", "Revanche", `spRevanche('${g.id}')`, { haupt: true }) : g.status === "laeuft" ? spKnopf("🏳️", "Aufgeben", `spAufgeben('${g.id}')`) : "", schTonKnopf())}
    </div>`;
  if (g.status === "laeuft" || g.status === "angefragt") SP.takt = setInterval(spNachsehen, SP_TAKT_MS);
}
// KC-CLUB-SPARTAKT (2.23.9): Ich bin dran → der andere kann kaum etwas ändern, nur alle 15 s nachsehen. Er ist dran → alle 3 s,
// nach 2 Minuten ohne Zug alle 9 s (jede Änderung setzt wieder auf schnell).
const SPT_TAKT = { n: 0, ruhig: 0 };
async function spNachsehen(sofort) {
  if (!SP.offen || aktuelleAnsicht !== "spiele" || document.hidden || KTM.frage || KTM.aufl) return; // 2.14.0: nie mitten in eine Quizfrage
  if (sofort !== true) { // sofort = Signal über die direkte Leitung (KC-CLUB-REALTIME-SPIELE) – sonst der Takt
    SPT_TAKT.n++; SPT_TAKT.ruhig++;
    if (rtAn() && !SP.offen.uhr?.laeuft && SPT_TAKT.n % 10) return; // Leitung steht: Züge melden sich selbst – nur alle 30 s zur Sicherheit
    if (SP.offen.ichDran ? SPT_TAKT.n % 5 : SPT_TAKT.ruhig > 40 && !SP.offen.uhr?.laeuft && SPT_TAKT.n % 3) return; // 2.23.38: läuft eine Schachuhr, bleibt es schnell
  }
  try { const r = await api("spiel_holen", { id: SP.offen.id }); if (r.spiel.zuege !== SP.offen.zuege || r.spiel.status !== SP.offen.status) { SPT_TAKT.ruhig = 0; const warDran = SP.offen.ichDran; SP.offen = r.spiel; spZeigen(); if (!warDran && r.spiel.ichDran) try { navigator.vibrate?.(40); } catch {} } } catch {}
}
async function spZug(i) {
  const g = SP.offen; if (!g?.ichDran || g.brett[i] !== ".") return;
  g.brett = g.brett.slice(0, i) + g.ichBin + g.brett.slice(i + 1); g.ichDran = false; spSpielZeigen(); // sofort zeigen
  try { SP.offen = (await api("spiel_zug", { id: g.id, feld: i, zuege: g.zuege })).spiel; }
  catch (e) { meldeFehler(e); try { SP.offen = (await api("spiel_holen", { id: g.id })).spiel; } catch {} }
  if (aktuelleAnsicht === "spiele") spZeigen();
}
async function spAufgeben(id, zurueckziehen) {
  if (!(await frage(zurueckziehen ? "Herausforderung zurückziehen?" : "Wirklich aufgeben? Dann hat dein Gegenüber gewonnen.", { ja: zurueckziehen ? "Zurückziehen" : "🏳️ Aufgeben", nein: "Weiterspielen" }))) return;
  try { const r = await api("spiel_aufgeben", { id }, { warten: true }); if (SP.offen?.id === id) SP.offen = r.spiel; spZeigen(); spLaden(true); } catch (e) { meldeFehler(e); }
}
async function spRevanche(id) {
  try { const r = await api("spiel_revanche", { id }, { warten: true }); if (r.schon) return spOeffnen(r.schon); SP.offen = r.spiel; melde("↺ Revanche gestartet"); spZeigen(); } catch (e) { meldeFehler(e); }
}
// Mitglieder-Seite: „🎲 Herausfordern“ nur bei Mitgliedern, die mitspielen möchten
async function spMitgliedKnopf(pid) {
  if (!SP.liste) await spLaden(true);
  const ziel = $("mdSpiel"); if (!ziel || !SP.liste?.bereit?.some((m) => m.person_id === pid)) return;
  ziel.outerHTML = `<button class="knopf" onclick="spHerausfordernBlatt('${pid}')"><span class="kt-ico">🎲</span>Zu einem Spiel herausfordern</button>`; mdKachelnOrdnen();
}

// ---------- KC-CLUB-SCHACH (2.8.0, Wunsch Hansi – Stufe 2 der Spiele): Schach – Köcheclub Edition ----------
// Regeln (erlaubte Züge, Schach, Matt, Patt, Remis, Rochade, en passant, Umwandlung) liefert chess.js (BSD-2, liegt in lib/chess –
// nichts kommt von fremden Servern). Antippen: Figur wählen → erlaubte Felder leuchten → Zielfeld antippen.
// ---------- KC-CLUB-DOPPELKOPF (2.62.0, Wunsch Hansi): Doppelkopf zu viert – du gegen/mit drei Computer-Köchen ----------
// Regeln (Turnierregeln, vereinfacht): 48 Karten (2 × 9 bis Ass), je 12. Trumpf von oben: ♥10 (Dulle), Damen ♣ ♠ ♥ ♦, Buben ♣ ♠ ♥ ♦,
// dann ♦ A 10 K 9. Fehlfarben ♣ und ♠: A 10 K 9, ♥: A K 9. Bedienpflicht; bei zwei gleichen Karten gewinnt die zuerst gespielte.
// Re = wer eine Kreuz-Dame hat (erst sichtbar, wenn sie gespielt wird), die anderen sind Kontra. Hat einer beide Kreuz-Damen,
// sagt er Hochzeit an (wer in den ersten drei Stichen zuerst einen Stich macht, wird Partner; sonst allein) oder spielt
// still allein (zählt dreifach). Die Computer sagen immer Hochzeit an. Re braucht 121 Augen, Kontra gewinnt mit 120.
// Punkte: 1 gewonnen, je 1 für „keine 90 / 60 / 30 / schwarz“, 1 „gegen die Alten“ (Kontra gewinnt); Sonderpunkte: Fuchs gefangen
// (♦ Ass der Gegenseite), Doppelkopf (Stich mit 40 Augen oder mehr), Karlchen (♣ Bube macht den letzten Stich). Ansagen und
// Soli kommen später. Kartenbilder = Bauernskat-Blatt (lib/karten). Stand und laufendes Spiel bleiben auf dem Gerät.
const DK_KEY = "kc_club_doppelkopf", DK_NAMEN = ["Du", "Erika", "Kurt", "Paul"], DK_WERTE = ["A", "10", "K", "9"];
const DK_TRUMPF = ["he-10", "kr-D", "pi-D", "he-D", "ka-D", "kr-B", "pi-B", "he-B", "ka-B", "ka-A", "ka-10", "ka-K", "ka-9"];
const dkBasis = (id) => id.slice(0, id.lastIndexOf("-"));
const dkIstTrumpf = (id) => DK_TRUMPF.includes(dkBasis(id));
const dkFarbe = (id) => (dkIstTrumpf(id) ? "T" : id.split("-")[0]);
const dkAugen = (id) => BSK_AUGEN[id.split("-")[1]];
const dkRang = (id) => (dkIstTrumpf(id) ? 100 + (DK_TRUMPF.length - DK_TRUMPF.indexOf(dkBasis(id))) : 4 - DK_WERTE.indexOf(id.split("-")[1]));
const dkSumme = (l) => l.reduce((a, k) => a + dkAugen(k), 0);
function dkStichGewinner(stich) { // stich = [{s, k}] in Spielreihenfolge – gleiche Karte: die erste gewinnt (nur „>“)
  const f = dkFarbe(stich[0].k); let best = stich[0];
  for (const x of stich.slice(1)) { const fx = dkFarbe(x.k), fb = dkFarbe(best.k);
    if ((fx === "T" && fb !== "T") || (fx === fb && dkRang(x.k) > dkRang(best.k))) best = x; }
  return best.s;
}
function dkNeu(geber, menschen = [0]) { // KC-CLUB-DK-MG: menschen = Plätze, an denen Menschen sitzen (gegen Mitglieder 0 und 2)
  const d = []; for (const f of BSK_FARBEN) for (const w of ["A", "10", "K", "D", "B", "9"]) for (const n of [1, 2]) d.push(`${f}-${w}-${n}`); // 48 Karten
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  const hand = [0, 1, 2, 3].map((s) => d.slice(s * 12, s * 12 + 12));
  const re = [0, 1, 2, 3].filter((s) => hand[s].some((k) => dkBasis(k) === "kr-D"));
  const z = { hand, geber, amZug: (geber + 1) % 4, stich: [], stiche: [[], [], [], []], letzter: null, phase: "spiel", re, solo: null, hochzeit: null, offen: [], sonder: [] };
  // Beide ♣ Damen bei einem: Computer sagen Hochzeit an; ein Mensch entscheidet selbst (Phase „vorbehalt“: 💍 Hochzeit oder 🤫 still allein)
  if (re.length === 1) { if (menschen.includes(re[0])) { z.phase = "vorbehalt"; z.braut = re[0]; } else z.hochzeit = { von: re[0], partner: null }; }
  return z;
}
// Hochzeit: wer von den anderen in den ersten 3 Stichen zuerst einen Stich macht, wird Partner (Re); sonst spielt die Braut allein
function dkVorbehalt(z, art) {
  if (z.phase !== "vorbehalt") return;
  const s = z.braut ?? 0; if (art === "hochzeit") z.hochzeit = { von: s, partner: null }; else z.solo = s;
  z.phase = "spiel";
}
const dkIstRe = (z, s) => z.re.includes(s);
function dkErlaubt(z, s) {
  const h = z.hand[s]; if (!z.stich.length) return [...h];
  const f = dkFarbe(z.stich[0].k), bed = h.filter((k) => dkFarbe(k) === f); return bed.length ? bed : [...h];
}
function dkSpielen(z, s, k) {
  const i = z.hand[s].indexOf(k); if (i < 0) throw new Error("Karte nicht vorhanden");
  z.hand[s].splice(i, 1); z.stich.push({ s, k }); if (dkBasis(k) === "kr-D" && !z.offen.includes(s)) z.offen.push(s);
  z.amZug = (s + 1) % 4; return z.stich.length === 4;
}
function dkStichAbschliessen(z) {
  const g = dkStichGewinner(z.stich), aug = dkSumme(z.stich.map((x) => x.k)), letzter = z.hand.every((h) => !h.length);
  z.stiche[g].push(...z.stich.map((x) => x.k));
  if (z.solo == null) { // Sonderpunkte nur im Normalspiel
    if (aug >= 40) z.sonder.push({ art: "doppelkopf", s: g });
    for (const x of z.stich) if (dkBasis(x.k) === "ka-A" && dkIstRe(z, x.s) !== dkIstRe(z, g)) z.sonder.push({ art: "fuchs", s: g, von: x.s });
    const sieg = z.stich.find((x) => x.s === g);
    if (letzter && dkBasis(sieg.k) === "kr-B") z.sonder.push({ art: "karlchen", s: g });
  }
  if (z.hochzeit && z.hochzeit.partner == null && z.solo == null) { const nr = z.stiche.reduce((a, l) => a + l.length, 0) / 4;
    if (g !== z.hochzeit.von) { z.hochzeit.partner = g; z.re.push(g); } else if (nr >= 3) z.solo = z.hochzeit.von; }
  z.letzter = { stich: z.stich, gewinner: g, augen: aug }; z.stich = []; z.amZug = g;
  if (letzter) z.phase = "ende";
}
function dkErgebnis(z, namen = DK_NAMEN) {
  const reS = [0, 1, 2, 3].filter((s) => dkIstRe(z, s)), koS = [0, 1, 2, 3].filter((s) => !dkIstRe(z, s));
  const reAug = reS.reduce((a, s) => a + dkSumme(z.stiche[s]), 0), koAug = 240 - reAug;
  const reStiche = reS.reduce((a, s) => a + z.stiche[s].length, 0) / 4, koStiche = 12 - reStiche;
  const reGew = reAug >= 121, verlAug = reGew ? koAug : reAug, verlStiche = reGew ? koStiche : reStiche;
  const zeilen = [["Gewonnen", 1]];
  if (verlAug < 90) zeilen.push(["Keine 90", 1]); if (verlAug < 60) zeilen.push(["Keine 60", 1]); if (verlAug < 30) zeilen.push(["Keine 30", 1]);
  if (verlStiche === 0) zeilen.push(["Schwarz", 1]);
  if (!reGew && z.solo == null) zeilen.push(["Gegen die Alten", 1]);
  const name = { doppelkopf: "Doppelkopf", fuchs: "Fuchs gefangen", karlchen: "Karlchen" };
  for (const x of z.sonder) zeilen.push([`${name[x.art]} (${namen[x.s]})`, dkIstRe(z, x.s) === reGew ? 1 : -1]);
  const wert = zeilen.reduce((a, [, p]) => a + p, 0), punkte = [0, 0, 0, 0];
  for (const s of [0, 1, 2, 3]) { const gew = dkIstRe(z, s) === reGew; const faktor = z.solo === s ? 3 : 1; punkte[s] = (gew ? 1 : -1) * wert * faktor; }
  return { reS, koS, reAug, koAug, reGew, zeilen, wert, punkte };
}
// ----- Computer -----
function dkBekanntRe(z, s) { return new Set([...z.offen, ...(dkIstRe(z, s) ? [s] : []), ...(z.hochzeit ? z.re : [])]); } // Hochzeit ist angesagt – alle wissen es
function dkPartnerSicher(z, s, w) { // weiß Spieler s sicher, dass w zu seiner Partei gehört?
  if (w === s) return true; // stille Hochzeit: nur der Alleinspieler weiß es – für die anderen sieht es wie ein Normalspiel aus
  const re = dkBekanntRe(z, s);
  if (dkIstRe(z, s)) return re.has(w);
  return re.size >= 2 && !re.has(w); // Kontra weiß es, wenn beide Re bekannt sind
}
function dkComputerKarte(z, s, staerke) {
  const erl = dkErlaubt(z, s); if (staerke === "leicht" && Math.random() < 0.45) return erl[Math.floor(Math.random() * erl.length)];
  const nachRang = (l) => [...l].sort((a, b) => dkRang(a) - dkRang(b)), nachAugen = (l) => [...l].sort((a, b) => dkAugen(a) - dkAugen(b));
  const tr = erl.filter(dkIstTrumpf), fehl = erl.filter((k) => !dkIstTrumpf(k));
  if (!z.stich.length) { // ausspielen
    const asse = fehl.filter((k) => k.split("-")[1] === "A");
    if (asse.length) { const zahl = (k) => z.hand[s].filter((x) => dkFarbe(x) === dkFarbe(k)).length; return [...asse].sort((a, b) => zahl(a) - zahl(b))[0]; }
    if (dkIstRe(z, s) && tr.length >= 5) return nachRang(tr).reverse().find((k) => dkBasis(k) !== "he-10") || nachRang(tr).pop();
    if (fehl.length) return nachAugen(fehl)[0];
    return nachRang(tr).find((k) => dkBasis(k) !== "ka-A") || nachRang(tr)[0];
  }
  const jetzt = dkStichGewinner(z.stich), letzter = z.stich.length === 3, wert = dkSumme(z.stich.map((x) => x.k));
  const gewinnt = (k) => dkStichGewinner([...z.stich, { s, k }]) === s;
  if (dkPartnerSicher(z, s, jetzt) && (letzter || dkRang(z.stich.find((x) => x.s === jetzt).k) >= dkRang(`kr-D-1`))) {
    const schmier = erl.filter((k) => !["he-10", "kr-D", "pi-D", "he-D"].includes(dkBasis(k))); // Partner hat sicher: Augen dazugeben
    return [...(schmier.length ? schmier : erl)].sort((a, b) => dkAugen(b) - dkAugen(a))[0];
  }
  const sieger = erl.filter(gewinnt);
  if (sieger.length && (letzter || wert >= 10 || staerke === "schwer")) {
    const billig = nachRang(sieger).filter((k) => letzter || dkRang(k) >= dkRang("he-D-1") || !dkIstTrumpf(k));
    return (billig.length ? billig : nachRang(sieger))[0];
  }
  return nachAugen(erl.filter((k) => dkBasis(k) !== "ka-A")).concat(nachAugen(erl))[0];
}
// ----- DK Regeln Ende -----
// ----- Zustand, Anzeige -----
let DK_MG = null; // KC-CLUB-DK-MG: beim Zeichnen einer Mitglieder-Partie die Namen am Tisch
let DK = (() => { let w = null; try { w = JSON.parse(localStorage.getItem(DK_KEY) || "null"); } catch {}
  return { staerke: "mittel", stand: [0, 0, 0, 0], spiele: 0, z: null, ...(w || {}), denkt: false, gewertet: w?.gewertet || false }; })();
const dkMerken = () => { try { localStorage.setItem(DK_KEY, JSON.stringify({ staerke: DK.staerke, stand: DK.stand, spiele: DK.spiele, z: DK.z, gewertet: DK.gewertet })); } catch {} };
const dkSort = (l) => [...l].sort((a, b) => { const fa = dkFarbe(a), fb = dkFarbe(b); return fa === fb ? dkRang(b) - dkRang(a) : fa === "T" ? -1 : fb === "T" ? 1 : BSK_FARBEN.indexOf(fa) - BSK_FARBEN.indexOf(fb); });
function dkKarteHtml(id, { klick = "", blass = false, klein = false } = {}) {
  const html = bskKarteHtml(dkBasis(id), { klein, blass }).replace('class="bsk-karte', `class="bsk-karte${dkIstTrumpf(id) ? " trumpf" : ""}`);
  return klick ? `<button class="dk-k" onclick="${klick}('${id}')" aria-label="${BSK_FNAME[id.split("-")[0]]} ${id.split("-")[1]}${dkIstTrumpf(id) ? ", Trumpf" : ""}">${html}</button>` : html;
}
function dkParteiMarke(z, s) { // was ICH sehe: eigene Partei immer, andere erst wenn bekannt
  if (z.phase === "ende") return dkIstRe(z, s) ? '<span class="dk-re">Re</span>' : '<span class="dk-ko">Kontra</span>';
  if (z.hochzeit?.von === s && z.solo == null) return `<span class="dk-re">💍 Hochzeit</span>`;
  if (s === 0) return z.solo === 0 ? '<span class="dk-re">Re · allein</span>' : dkIstRe(z, 0) ? '<span class="dk-re">Re</span>' : z.phase === "vorbehalt" ? "" : '<span class="dk-ko">Kontra</span>';
  if (z.hochzeit && z.hochzeit.partner === s) return '<span class="dk-re">Re 💍</span>';
  if (z.offen.includes(s)) return '<span class="dk-re">Re ♣D</span>';
  return dkPartnerSicher(z, 0, s) ? `<span class="${dkIstRe(z, 0) ? "dk-re" : "dk-ko"}">${dkIstRe(z, 0) ? "Re" : "Kontra"}</span>` : "";
}
function dkPlatz(z, s) {
  const amZug = z.phase === "spiel" && z.amZug === s && !z.stich.some((x) => x.s === s);
  return `<div class="dk-platz dk-p${s}${amZug ? " dran" : ""}"><b>${DK_MG ? esc(DK_MG.namen[s]) : `${s ? "🤖 " : ""}${DK_NAMEN[s]}`}</b>${dkParteiMarke(z, s)}${s ? `<small>${z.hand[s].length} Karten</small>` : ""}<small>${z.stiche[s].length / 4} Stiche</small></div>`;
}
function dkPcZeigen() {
  bskBilderVorladen();
  if (!DK.z) dkPcNeu(false);
  const z = DK.z, erl = z.phase === "spiel" && z.amZug === 0 && !DK.denkt && z.stich.length < 4 ? dkErlaubt(z, 0) : [];
  const stich = z.stich.length ? z.stich : z.letzter && DK.zeigeLetzten ? z.letzter.stich : [];
  let status;
  if (z.phase === "ende") { const e = dkErgebnis(z), ich = dkIstRe(z, 0) === e.reGew;
    status = `<div class="sp-banner ${ich ? "sieg" : "niederlage"}">${ich ? "🏆 Gewonnen!" : "Verloren"} – ${e.reGew ? "Re" : "Kontra"} gewinnt<br><small>Re (${e.reS.map((s) => DK_NAMEN[s]).join(" & ")}${z.solo != null ? ", allein" : ""}) ${e.reAug} : ${e.koAug} Kontra</small></div>
      <div class="dk-abrechnung">${e.zeilen.map(([t, p]) => `<div><span>${esc(t)}</span><b>${p > 0 ? "+" : ""}${p}</b></div>`).join("")}<div class="dk-summe"><span>Spielwert${z.solo != null ? " (Solo × 3)" : ""}</span><b>${e.wert}</b></div>
      <div class="dk-punkte">${[0, 1, 2, 3].map((s) => `<span>${DK_NAMEN[s]} <b class="${e.punkte[s] > 0 ? "plus" : e.punkte[s] < 0 ? "minus" : ""}">${e.punkte[s] > 0 ? "+" : ""}${e.punkte[s]}</b></span>`).join("")}</div></div>`; }
  else if (z.phase === "vorbehalt") status = `<div class="sp-status sp-ichdran">Du hast beide ♣ Damen – wähle unten auf dem Tisch</div>`;
  else status = `<div class="sp-status${z.amZug === 0 && !DK.denkt ? " sp-ichdran" : ""}">${z.hochzeit && z.hochzeit.partner == null && z.solo == null ? `💍 ${z.hochzeit.von === 0 ? "Deine" : DK_NAMEN[z.hochzeit.von] + "s"} Hochzeit – wer zuerst einen Stich macht, wird Partner · ` : ""}${z.amZug === 0 && !DK.denkt ? (z.stich.length ? "Du bist dran – bedienen, wenn du kannst" : "Du spielst aus") : `🤖 ${DK_NAMEN[z.amZug]} ist dran …`}</div>`;
  const pos = (s) => ["unten", "links", "oben", "rechts"][s];
  $("spInhalt").innerHTML = `<div class="karte sp-karte">
      ${spWahl("Stärke", DK.staerke, [["leicht", "😊 Leicht"], ["mittel", "🙂 Mittel"], ["schwer", "😎 Schwer"]], "dkPcStaerke")}
      <div class="sp-stand dk-stand">${[0, 1, 2, 3].map((s) => `<span>${DK_NAMEN[s]} <b>${DK.stand[s]}</b></span>`).join("")}</div>
      ${status}
      <div class="dk-tisch">
        ${dkPlatz(z, 2)}${dkPlatz(z, 1)}
        <div class="dk-mitte" onclick="dkWeiter()">${z.phase === "vorbehalt" ? `<div class="dk-vorbehalt"><b>Beide ♣ Damen!</b><button class="knopf haupt" onclick="event.stopPropagation();dkPcVorbehalt('hochzeit')">💍 Hochzeit ansagen</button><small>Wer zuerst einen Stich macht, spielt mit dir</small><button class="knopf" onclick="event.stopPropagation();dkPcVorbehalt('solo')">🤫 Still allein spielen</button><small>Zählt dreifach</small></div>` : ""}${stich.map((x) => `<div class="dk-s dk-s-${pos(x.s)}">${dkKarteHtml(x.k, { klein: true })}</div>`).join("") || (z.phase === "vorbehalt" ? "" : '<span class="hinweis dk-leer">Stich</span>')}
          ${!z.stich.length && stich.length ? `<div class="dk-letzter">${z.letzter.gewinner === 0 ? "Dein Stich" : DK_NAMEN[z.letzter.gewinner] + "s Stich"} · ${z.letzter.augen} Augen</div>` : ""}</div>
        ${dkPlatz(z, 3)}${dkPlatz(z, 0)}
      </div>
      <div class="dk-hand">${dkSort(z.hand[0]).map((k) => dkKarteHtml(k, { klick: erl.includes(k) ? "dkPcKarte" : "", blass: erl.length > 0 && !erl.includes(k) })).join("")}</div>
      ${spLeiste(spNeuKnopf("dkPcNeuFragen()", z.phase === "ende" ? "Nächstes Spiel" : "Neues Spiel"), spAbbrechenKnopf("spPcAbbrechen()"), schTonKnopf(), spAnsageKnopf("dk"), spStandKnopf("dkStandWeg()"))}
      <details class="sch-verlauf"><summary>📖 Regeln kurz</summary><p class="hinweis" style="margin:4px 0">Vier Spieler, je 12 Karten. <b>Trumpf</b> von oben: ♥ Zehn, alle Damen (♣ ♠ ♥ ♦), alle Buben (♣ ♠ ♥ ♦), dann ♦ Ass, Zehn, König, Neun. Trümpfe haben einen goldenen Rand. Farbe bedienen ist Pflicht – wer nicht kann, darf stechen oder abwerfen. Bei zwei gleichen Karten gewinnt die zuerst gespielte.<br><b>Re</b> sind die beiden mit einer ♣ Dame – wer das ist, sieht man erst, wenn sie gespielt wird. Re braucht 121 Augen, Kontra reichen 120. Hat einer beide ♣ Damen, sagt er <b>Hochzeit</b> an (wer in den ersten drei Stichen zuerst einen Stich macht, spielt mit ihm) – oder spielt still allein (zählt dreifach).<br><b>Extrapunkte:</b> keine 90/60/30, schwarz, gegen die Alten, Fuchs gefangen (♦ Ass der Gegner), Doppelkopf (Stich mit 40 Augen), Karlchen (♣ Bube macht den letzten Stich).</p></details>
    </div>`;
  if (z.phase === "spiel" && !DK.denkt && !DK.wartet && (z.amZug !== 0 || z.stich.length === 4)) dkPcWeiterLaufen();
}
// ----- KC-CLUB-DK-MG (2.219.0, Wunsch Hansi „auch gegen Mitglieder mit Terminabfrage“): Doppelkopf mit einem Mitglied -----
// Ihr zwei sitzt euch gegenüber, die beiden anderen Plätze spielt der Server-Computer. Wer mit wem spielt (Re/Kontra), zeigt sich wie
// am echten Tisch erst mit der ♣ Dame. Die Hände der anderen schickt der Server nie. Gewonnen hat, wer von euch beiden mehr Punkte holt.
const DKM = { id: null, n: null, sendet: false };
function dkSpielZeigen(g) {
  const z = g.dk; if (!z) { $("spInhalt").innerHTML = '<div class="karte hinweis">Wird geladen …</div>'; return; }
  if (DKM.id !== g.id) { DKM.id = g.id; DKM.n = null; }
  if (DKM.n != null && z.n !== DKM.n) spTon(g.status === "beendet" ? (g.ergebnis === "gewonnen" ? "sieg" : g.ergebnis === "verloren" ? "niederlage" : "remis") : "karte");
  if (DKM.n !== z.n && g.ichDran) spSag("dk", z.phase === "vorbehalt" ? "Du hast beide Kreuz-Damen." : z.stich.length ? "Du bist dran." : "Du spielst aus.", `dkm:${g.id}:${z.n}`, true);
  DKM.n = z.n;
  DK_MG = { namen: z.namen };
  try {
    const ich = g.ichDran && g.status === "laeuft" && !DKM.sendet, erl = ich && z.phase === "spiel" && z.amZug === 0 ? dkErlaubt(z, 0) : [];
    const stich = z.stich.length ? z.stich : z.letzter ? z.letzter.stich : [], pos = (s) => ["unten", "links", "oben", "rechts"][s];
    let status;
    if (z.phase === "ende") { const e = dkErgebnis(z, z.namen), gew = g.ergebnis === "gewonnen";
      status = `<div class="sp-banner ${g.ergebnis === "remis" ? "remis" : gew ? "sieg" : "niederlage"}">${g.aufgegeben ? (gew ? `🏆 ${esc(g.gegner.vorname)} hat aufgegeben.` : "Du hast aufgegeben.") : g.ergebnis === "remis" ? `🤝 Gleich viele Punkte – ihr wart in einer Partei` : gew ? "🏆 Du hast gewonnen!" : `${esc(g.gegner.vorname)} hat gewonnen`} – ${e.reGew ? "Re" : "Kontra"} gewinnt<br><small>Re ${e.reAug} : ${e.koAug} Kontra</small></div>
        <div class="dk-abrechnung">${e.zeilen.map(([t, p]) => `<div><span>${esc(t)}</span><b>${p > 0 ? "+" : ""}${p}</b></div>`).join("")}<div class="dk-summe"><span>Spielwert${z.solo != null ? " (Solo × 3)" : ""}</span><b>${e.wert}</b></div>
        <div class="dk-punkte">${[0, 1, 2, 3].map((s) => `<span>${esc(z.namen[s])} <b class="${e.punkte[s] > 0 ? "plus" : e.punkte[s] < 0 ? "minus" : ""}">${e.punkte[s] > 0 ? "+" : ""}${e.punkte[s]}</b></span>`).join("")}</div></div>`; }
    else if (g.status === "beendet") status = `<div class="sp-banner ${g.ergebnis === "gewonnen" ? "sieg" : "niederlage"}">${g.ergebnis === "gewonnen" ? `🏆 ${esc(g.gegner.vorname)} hat aufgegeben.` : "Du hast aufgegeben."}</div>`;
    else if (g.status === "angefragt") status = `<div class="sp-status">⏳ Warte, bis ${esc(g.gegner.vorname)} annimmt …</div>`;
    else if (z.phase === "vorbehalt") status = z.braut === 0 ? `<div class="sp-status sp-ichdran">Du hast beide ♣ Damen – wähle unten auf dem Tisch</div>` : `<div class="sp-status">⏳ ${esc(g.gegner.vorname)} überlegt …</div>`;
    else status = `<div class="sp-status${ich ? " sp-ichdran" : ""}">${z.hochzeit && z.hochzeit.partner == null && z.solo == null ? `💍 ${z.hochzeit.von === 0 ? "Deine" : esc(z.namen[z.hochzeit.von].replace("🤖 ", "")) + "s"} Hochzeit – wer zuerst einen Stich macht, wird Partner · ` : ""}${ich ? (z.stich.length ? "Du bist dran – bedienen, wenn du kannst" : "Du spielst aus") : `⏳ ${esc(z.namen[z.amZug])} ist dran …`}</div>`;
    $("spInhalt").innerHTML = `<div class="karte sp-karte">
      <div class="zeile" style="border:none;padding:0"><button class="knopf klein" onclick="SP.offen=null;spZeigen();spLaden(true)">‹ Übersicht</button><b style="flex:1;text-align:right">👑 Du und ${esc(g.gegner.vorname)}<br><small class="hinweis">+ 2 Computer-Köche</small></b></div>
      ${status}
      <div class="dk-tisch">
        ${dkPlatz(z, 2)}${dkPlatz(z, 1)}
        <div class="dk-mitte">${z.phase === "vorbehalt" && z.braut === 0 && ich ? `<div class="dk-vorbehalt"><b>Beide ♣ Damen!</b><button class="knopf haupt" onclick="dkMgZug({ vorbehalt: 'hochzeit' })">💍 Hochzeit ansagen</button><small>Wer zuerst einen Stich macht, spielt mit dir</small><button class="knopf" onclick="dkMgZug({ vorbehalt: 'solo' })">🤫 Still allein spielen</button><small>Zählt dreifach</small></div>` : ""}${stich.map((x) => `<div class="dk-s dk-s-${pos(x.s)}">${dkKarteHtml(x.k, { klein: true })}</div>`).join("") || (z.phase === "vorbehalt" ? "" : '<span class="hinweis dk-leer">Stich</span>')}
          ${!z.stich.length && stich.length ? `<div class="dk-letzter">${z.letzter.gewinner === 0 ? "Dein Stich" : esc(z.namen[z.letzter.gewinner]) + "s Stich"} · ${z.letzter.augen} Augen</div>` : ""}</div>
        ${dkPlatz(z, 3)}${dkPlatz(z, 0)}
      </div>
      <div class="dk-hand">${dkSort(z.hand[0]).map((k) => dkKarteHtml(k, { klick: erl.includes(k) ? "dkMgKarte" : "", blass: erl.length > 0 && !erl.includes(k) })).join("")}</div>
      ${spTerminHtml(g)}
      <p class="hinweis" style="text-align:center;margin:6px 0">${g.status === "laeuft" ? `Du musst nicht warten – ${esc(g.gegner.vorname)} bekommt Bescheid. 🤖 ${esc(z.namen[1].replace("🤖 ", ""))} und ${esc(z.namen[3].replace("🤖 ", ""))} spielt der Computer.` : ""}</p>
      ${spLeiste(g.status === "beendet" ? spKnopf("↺", "Revanche", `spRevanche('${g.id}')`, { haupt: true }) : g.status === "laeuft" ? spKnopf("🏳️", "Aufgeben", `spAufgeben('${g.id}')`) : "", schTonKnopf(), spAnsageKnopf("dk"))}
    </div>`;
  } finally { DK_MG = null; }
}
async function dkMgZug(zug) {
  const g = SP.offen; if (!g?.ichDran || DKM.sendet) return;
  DKM.sendet = true; if (zug.karte) spTon("karte");
  try { SP.offen = (await api("spiel_zug", { id: g.id, zug, zuege: g.zuege })).spiel; DKM.n = SP.offen.dk?.n; }
  catch (e) { meldeFehler(e); try { SP.offen = (await api("spiel_holen", { id: g.id })).spiel; } catch {} }
  finally { DKM.sendet = false; }
  if (aktuelleAnsicht === "spiele" && SP.offen?.id === g.id) spZeigen();
}
const dkMgKarte = (k) => dkMgZug({ karte: k });
function dkPcVorbehalt(art) { const z = DK.z; if (!z || z.phase !== "vorbehalt") return; dkVorbehalt(z, art); dkMerken();
  spSag("dk", art === "hochzeit" ? "Du sagst Hochzeit an." : "Du spielst still allein.", null, true); dkPcZeigen(); }
function dkPcStaerke(w) { DK.staerke = w; dkMerken(); dkPcZeigen(); }
async function dkPcNeuFragen() { // KC-CLUB-SPIELE-LEISTE: mitten im Spiel erst fragen
  const z = DK.z; if (z && z.phase === "spiel" && (z.stich.length || z.letzter) && !(await frage("Neues Spiel beginnen? Das laufende Spiel wird nicht gewertet.", { ja: "↺ Neues Spiel", nein: "Weiterspielen" }))) return;
  clearTimeout(DK.wartet); DK.wartet = false; dkPcNeu();
}
async function dkStandWeg() { if (!(await frage("Spielstand Doppelkopf auf 0 zurücksetzen?", { ja: "🗑️ Zurücksetzen", nein: "Abbrechen" }))) return; DK.stand = [0, 0, 0, 0]; DK.spiele = 0; dkMerken(); dkPcZeigen(); melde("🗑️ Spielstand gelöscht"); }
function dkPcNeu(zeigen = true) {
  const geber = DK.z ? (DK.z.geber + 1) % 4 : 3; DK.z = dkNeu(geber); DK.gewertet = false; DK.denkt = false; DK.wartet = false; DK.zeigeLetzten = false; dkMerken();
  if (!zeigen) return;
  spSag("dk", DK.z.phase === "vorbehalt" ? "Neues Spiel. Du hast beide Kreuz-Damen." : `Neues Spiel.${DK.z.hochzeit ? ` ${DK_NAMEN[DK.z.hochzeit.von]} sagt Hochzeit an.` : ""} ${DK.z.amZug === 0 ? "Du spielst aus." : DK_NAMEN[DK.z.amZug] + " spielt aus."}`, "dk:neu:" + Date.now(), true);
  dkPcZeigen();
}
function dkWeiter() { if (DK.wartet) { clearTimeout(DK.wartet); DK.wartet = false; dkStichFertig(); } }
function dkStichFertig() {
  const z = DK.z; if (!z || z.stich.length !== 4) return;
  dkStichAbschliessen(z); DK.zeigeLetzten = true; const l = z.letzter; spTon(l.gewinner === 0 ? "stich" : "schritt");
  spSag("dk", `${l.gewinner === 0 ? "Dein Stich" : DK_NAMEN[l.gewinner] + " bekommt den Stich"}${l.augen ? `, ${l.augen} Augen` : ""}.`);
  if (z.phase === "ende" && !DK.gewertet) { const e = dkErgebnis(z); e.punkte.forEach((p, s) => (DK.stand[s] += p)); DK.spiele++; DK.gewertet = true; spEndeTon(e.punkte[0] > 0);
    spSag("dk", `${e.reGew ? "Re" : "Kontra"} gewinnt mit ${e.reGew ? e.reAug : e.koAug} Augen. ${e.punkte[0] > 0 ? "Du gewinnst" : "Du verlierst"} ${Math.abs(e.punkte[0])} Punkte.`, null, true); }
  dkMerken(); dkPcZeigen();
}
function dkPcKarte(k) {
  const z = DK.z; if (z.phase !== "spiel" || z.amZug !== 0 || DK.denkt || !dkErlaubt(z, 0).includes(k)) return;
  DK.zeigeLetzten = false; dkSpielen(z, 0, k); dkMerken(); spTon("karte");
  dkPcZeigen(); // voller Stich / Computer am Zug: dkPcWeiterLaufen übernimmt
}
function dkPcWeiterLaufen() {
  const z = DK.z; if (DK.denkt || DK.wartet || z.phase !== "spiel" || aktuelleAnsicht !== "spiele" || SP.art !== "dk" || SP.pause) return;
  if (z.stich.length === 4) { DK.wartet = setTimeout(() => { DK.wartet = false; dkStichFertig(); }, 1300); return; }
  if (z.amZug === 0) return;
  DK.denkt = true;
  setTimeout(() => {
    DK.denkt = false; if (DK.z !== z || z.phase !== "spiel" || z.amZug === 0) return;
    const s = z.amZug, k = dkComputerKarte(z, s, DK.staerke); DK.zeigeLetzten = false;
    dkSpielen(z, s, k); dkMerken(); spTon("gegner");
    spSag("dk", `${DK_NAMEN[s]}: ${bskKarteWort(dkBasis(k))}${dkBasis(k) === "kr-D" ? " – Re" : ""}.`);
    dkPcZeigen();
  }, 650);
}
// ---------- KC-CLUB-SPIEL-ANSAGE (2.22.16, Wunsch Hansi): Spiele ansagen lassen – je Spiel ein eigener 🔊-Schalter (Gerät) ----------
// Schach: jeder Zug („Dein Bauer auf C 6“, „Schwarzer Läufer auf E 5 – hat gerade deinen Springer geschlagen“, Schach/Matt),
// Küchenterror: Frage + Antworten und die Auflösung, Bauernskat: Trumpf, Karten des Gegners, wer den Stich bekommt, Ergebnis.
// Tic-Tac-Toe bewusst ohne. Nutzt die vorhandene Vorlese-Stimme (sprechen); jede Ansage nur einmal (SP_GESAGT).
const SP_ANSAGE_KEY = "kc_club_sp_ansage", SP_ANSAGE_NAME = { schach: "Schach", kt: "Küchenterror", bsk: "Bauernskat", ttt: "Tic-Tac-Toe", mae: "Mensch ärgere dich nicht", fdk: "Fang den Koch", dk: "Doppelkopf" };
const spAnsageAn = (art) => { try { return !!JSON.parse(localStorage.getItem(SP_ANSAGE_KEY) || "{}")[art]; } catch { return false; } };
function spAnsageKnopf(art, kachel = false) {
  const an = spAnsageAn(art);
  const was = art === "ttt" ? "Töne" : "Ansage"; // 2.23.6: Tic-Tac-Toe nur Töne, keine Sprache
  return `<button class="knopf sp-ansage" data-art="${art}" data-kachel="1" aria-pressed="${an}" onclick="spAnsageSetzen('${art}', ${!an})"><span class="kt-ico">${an ? "🔊" : "🔇"}</span>${was} ${an ? "an" : "aus"}</button>`; // KC-CLUB-SPIELE-LEISTE (2.215.0): immer Kachelform (kachel bleibt für alte Aufrufe)
}
function spAnsageSetzen(art, an) {
  let w = {}; try { w = JSON.parse(localStorage.getItem(SP_ANSAGE_KEY) || "{}") || {}; } catch {}
  w[art] = !!an; lsSetzen(SP_ANSAGE_KEY, JSON.stringify(w));
  document.querySelectorAll(`.sp-ansage[data-art="${art}"]`).forEach((b) => (b.outerHTML = spAnsageKnopf(art, !!b.dataset.kachel)));
  if (art === "ttt") { if (an) spTttTon("sieg"); return melde(an ? "🔊 Töne für Tic-Tac-Toe an" : "🔇 Töne für Tic-Tac-Toe aus"); } // KC-CLUB-TTT-TOENE (2.23.6)
  try { speechSynthesis.cancel(); } catch {}
  if (an) { if (!("speechSynthesis" in window)) return melde("Dieses Gerät kann leider nicht vorlesen.", true); sprechen(`Ansage für ${SP_ANSAGE_NAME[art]} ist an.`); }
  else melde(`🔇 Ansage für ${SP_ANSAGE_NAME[art]} aus`);
}
// KC-CLUB-TTT-TOENE (2.23.6, Wunsch Hansi): Tic-Tac-Toe mit Lautsprecher – nur Töne: eigener Zug (hell), Zug des Gegners/Computers
// (tiefer), Spielende (Sieg aufsteigend, Niederlage absteigend, Unentschieden zwei gleiche). Schalter gilt für dieses Gerät, Standard aus.
// KC-CLUB-SPIELE-LEISTE (2.215.0): dieselben Töne jetzt für alle Spiele – ein gemeinsamer Schalter „🔔 Töne an/aus“ (schToeneAn, Standard an).
const SP_TTT_TOENE = { ich: [[660, 0, 0.1]], gegner: [[392, 0, 0.14]], sieg: [[523, 0, 0.14], [659, 0.14, 0.14], [784, 0.28, 0.14], [1047, 0.42, 0.32]],
  niederlage: [[523, 0, 0.2], [440, 0.2, 0.2], [349, 0.4, 0.4]], remis: [[523, 0, 0.16], [523, 0.24, 0.16]],
  karte: [[1250, 0, 0.04], [880, 0.03, 0.06]], stich: [[523, 0, 0.1], [784, 0.1, 0.16]], wuerfel: [[190, 0, 0.04], [240, 0.07, 0.04], [170, 0.14, 0.04], [260, 0.21, 0.05]],
  schritt: [[720, 0, 0.05]], raus: [[620, 0, 0.12], [310, 0.12, 0.26]], richtig: [[659, 0, 0.12], [988, 0.12, 0.22]], falsch: [[233, 0, 0.18], [196, 0.18, 0.3]] };
function spTttTon(was) {
  if (!schToeneAn() || aktuelleAnsicht !== "spiele") return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.();
    for (const [f, t, d] of SP_TTT_TOENE[was] || []) {
      const o = audio.createOscillator(), g = audio.createGain(), s = audio.currentTime + t;
      o.type = ["gegner", "karte", "wuerfel", "schritt"].includes(was) ? "triangle" : "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.22, s + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, s + d);
      o.connect(g).connect(audio.destination); o.start(s); o.stop(s + d + 0.03);
    }
  } catch {}
}
const spTon = spTttTon;
const spEndeTon = (ich, remis = false) => spTon(remis ? "remis" : ich ? "sieg" : "niederlage");
// KC-CLUB-SPIELE-LEISTE (2.215.0, Wunsch Hansi „überall die gleichen Grundfunktionen wie Ton an, Ton aus, gegen Computer oder
// Mitspieler, neues Spiel, abbrechen – alle Knöpfe schön unter- und nebeneinander“): eine Knopfleiste für alle Spiele.
// Gleiche Kachelknöpfe im festen Raster (Handy 3, breit 4 nebeneinander), immer dieselbe Reihenfolge:
// Spielknöpfe · ↺ Neues Spiel · ✖ Abbrechen · 🔔 Töne · 🔊 Ansage · Extras (Regeln, Stand löschen …).
const spKnopf = (ico, text, klick, { haupt = false, aus = false, titel = "", id = "" } = {}) => `<button class="knopf${haupt ? " haupt" : ""}"${id ? ` id="${id}"` : ""} onclick="${klick}"${aus ? " disabled" : ""}${titel ? ` title="${esc(titel)}"` : ""}><span class="kt-ico">${ico}</span>${text}</button>`;
const spLeiste = (...knoepfe) => `<div class="sp-leiste">${knoepfe.flat().filter(Boolean).join("")}</div>`;
const spNeuKnopf = (klick, text = "Neues Spiel", haupt = true) => spKnopf("↺", text, klick, { haupt });
const spAbbrechenKnopf = (klick) => spKnopf("✖", "Abbrechen", klick);
const spStandKnopf = (klick) => spKnopf("🗑️", "Stand löschen", klick, { titel: "Spielstand zurücksetzen" });
// Tic-Tac-Toe, Schach, Bauernskat, Doppelkopf (Einstellungen stehen direkt über dem Spiel): Abbrechen = Partie verwerfen (nicht
// gewertet, Spielstand bleibt) und zurück zur Spieleübersicht. Spiele mit Startseite (Küchenterror, Mensch ärgere dich nicht,
// Fang den Koch) gehen beim Abbrechen auf ihre Startseite zurück.
function spPcLaeuft(art) {
  if (art === "ttt") return !!SPC.brett && !SPC.ende && SPC.brett.replace(/\./g, "").length > 0;
  if (art === "schach") return !!SCH.ch && SCH.ch.history().length > 0 && !SCH.ch.isGameOver() && !SCH.uhr?.aus;
  if (art === "bsk") return !!BSK.z && BSK.z.phase !== "ende";
  if (art === "dk") return !!DK.z && DK.z.phase !== "ende";
  return false;
}
async function spPcAbbrechen() {
  const art = SP.art, laeuft = spPcLaeuft(art);
  if (laeuft && !(await frage("Spiel abbrechen? Diese Partie wird nicht gewertet – dein Spielstand bleibt.", { ja: "✖ Abbrechen", nein: "▶ Weiterspielen" }))) return;
  if (SP.art !== art) return;
  try { speechSynthesis.cancel(); } catch {}
  if (art === "ttt") { SPC.brett = null; SPC.ende = null; SPC.denkt = false; }
  else if (art === "schach") { if (SCH.ch && SCH.ch.history().length >= 2 && !SCH.gewertet) schArchivPc("abgebrochen");
    clearInterval(SCH_UHR_TAKT); SCH_UHR_TAKT = null; SCH.ch = null; SCH.pgn = ""; SCH.uhr = null; SCH.denkt = false; SCH.gewertet = false; SCH.auswahl = null; SCH.ziele = []; SCH.tipp = null; schMerken(); }
  else if (art === "bsk") { BSK.z = null; BSK.denkt = false; bskMerken(); }
  else if (art === "dk") { clearTimeout(DK.wartet); DK.z = null; DK.denkt = false; DK.wartet = false; dkMerken(); }
  SP.art = null; spZeigen();
  if (laeuft) melde("Spiel abgebrochen – nicht gewertet.");
}
const SPT = { id: null, brett: null, status: null }; // zuletzt gezeigte Partie gegen Mitglieder – daraus: wer hat gezogen?
function spTttTonMg(g) {
  const vor = SPT.id === g.id ? { brett: SPT.brett, status: SPT.status } : null;
  SPT.id = g.id; SPT.brett = g.brett; SPT.status = g.status;
  if (!vor?.brett || (vor.brett === g.brett && vor.status === g.status)) return;
  if (g.status === "beendet" && vor.status !== "beendet") return spTttTon(g.ergebnis === "gewonnen" ? "sieg" : g.ergebnis === "verloren" ? "niederlage" : "remis");
  const neu = [...g.brett].findIndex((c, i) => c !== "." && vor.brett[i] === ".");
  if (neu >= 0) spTttTon(g.brett[neu] === g.ichBin ? "ich" : "gegner");
}
const SP_GESAGT = new Set();
function spSag(art, text, schluessel, vorrang = false) {
  if (!spAnsageAn(art) || !text || aktuelleAnsicht !== "spiele") return;
  if (schluessel) { if (SP_GESAGT.has(schluessel)) return; SP_GESAGT.add(schluessel); if (SP_GESAGT.size > 300) SP_GESAGT.clear(); }
  if (vorrang) try { speechSynthesis.cancel(); } catch {}
  sprechen(text);
}
// Schach: Zug in Worten (m = Zug aus chess.js mit verbose-Angaben, ch = Stellung danach, ich = meine Farbe)
const SCH_WEIBLICH = { q: true };
const schFigWort = (t) => (schBrigade() ? SCH_BRIGADE_NAME : SCH_NAME)[t];
const schFigAkk = (t) => (t === "p" ? (schBrigade() ? "Praktikanten" : "Bauern") : schFigWort(t));
const schFeldWort = (f) => `${f[0].toUpperCase()} ${f[1]}`;
// 2.22.17 (Wunsch Hansi „Rochade muss möglich sein“): Rochade auch so – König antippen, dann den eigenen Turm (statt das Feld zwei weiter),
// oder erst den Turm, dann den König. Gibt { von, nach } des Königszugs zurück, sonst null.
function schRochade(ch, von, feld) {
  const a = ch.get(von), b = ch.get(feld); if (!a || !b || a.color !== b.color) return null;
  const k = a.type === "k" ? von : b.type === "k" ? feld : null, turm = a.type === "r" ? von : b.type === "r" ? feld : null; if (!k || !turm) return null;
  const m = ch.moves({ square: k, verbose: true }).find((x) => /[kq]/.test(x.flags) && (turm[0] === "h" ? x.flags.includes("k") : x.flags.includes("q")));
  return m ? { von: k, nach: m.to } : null;
}
// Ziele des ausgewählten Königs: auch die Türme, mit denen eine Rochade geht
function schZieleMitRochade(ch, feld) {
  const z = ch.moves({ square: feld, verbose: true }).map((m) => m.to), f = ch.get(feld);
  if (f?.type === "k") for (const m of ch.moves({ square: feld, verbose: true }).filter((x) => /[kq]/.test(x.flags))) z.push((m.flags.includes("k") ? "h" : "a") + feld[1]);
  return z;
}
function schZugAnsage(m, ch, ich) {
  const fem = (t) => !!SCH_WEIBLICH[t], eigen = m.color === ich, weiss = m.color === "w";
  let s;
  if (/[kq]/.test(m.flags)) s = `${eigen ? "Du machst" : (weiss ? "Weiß" : "Schwarz") + " macht"} die ${m.flags.includes("k") ? "kurze" : "lange"} Rochade.`;
  else {
    s = eigen ? `${fem(m.piece) ? "Deine" : "Dein"} ${schFigWort(m.piece)} auf ${schFeldWort(m.to)}`
      : `${weiss ? (fem(m.piece) ? "Weiße" : "Weißer") : (fem(m.piece) ? "Schwarze" : "Schwarzer")} ${schFigWort(m.piece)} auf ${schFeldWort(m.to)}`;
    if (m.captured) { const o = m.captured;
      s += eigen ? ` – schlägt ${fem(o) ? "die" : "den"} ${weiss ? (fem(o) ? "schwarze" : "schwarzen") : (fem(o) ? "weiße" : "weißen")} ${schFigAkk(o)}`
        : ` – hat gerade ${fem(o) ? "deine" : "deinen"} ${schFigAkk(o)} geschlagen`; }
    if (m.promotion) s += ` und wird ${fem(m.promotion) ? "zur" : "zum"} ${schFigWort(m.promotion)}`;
    s += ".";
  }
  if (ch.isCheckmate()) s += eigen ? " Schachmatt – gewonnen!" : " Schachmatt.";
  else if (ch.isCheck()) s += eigen ? " Schach!" : " Schach – dein König wird angegriffen!";
  else if (ch.isDraw()) s += " Remis.";
  return s;
}
// Gegen den Computer nur auf dem Gerät (Stärke: Suchtiefe 1/2/3 mit Alpha-Beta + Figurenwerte/Lagetabellen), mit „Zug zurück“.
// Gegen Mitglieder über den Server (prüft jeden Zug ebenfalls mit chess.js).
let CHESS = null;
async function chessLaden() { if (!CHESS) CHESS = (await import(new URL("lib/chess/chess.js?v=1.4.0", location.href).href)).Chess /* 2.730.0 KC-CLUB-TEILE: Adresse zur Seite, nicht zum Teil */; return CHESS; }
const SCH_FIG = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }, SCH_NAME = { k: "König", q: "Dame", r: "Turm", b: "Läufer", n: "Springer", p: "Bauer" };
const SCH_KEY = "kc_club_schach_pc", SCH_WERT = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
// Lagetabellen (aus Sicht von Weiß, Feld a8 = Index 0) – klassische einfache Werte
const SCH_LAGE = {
  p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
};
function schBewertung(ch) { // aus Sicht der Seite am Zug
  let w = 0; const brett = ch.board();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const f = brett[r][c]; if (!f) continue;
    const i = f.color === "w" ? r * 8 + c : (7 - r) * 8 + c, v = SCH_WERT[f.type] + SCH_LAGE[f.type][i]; w += f.color === "w" ? v : -v; }
  return ch.turn() === "w" ? w : -w;
}
const schOrdnung = (m) => (m.captured ? 10 * SCH_WERT[m.captured] - SCH_WERT[m.piece] / 10 : 0) + (m.promotion ? 800 : 0) + (m.san.includes("+") ? 50 : 0);
function schRuhig(ch, alpha, beta, q, stopp) { // nur Schlagzüge weiterrechnen – gegen „Figur einstellen“ am Suchhorizont
  const stehen = schBewertung(ch); if (q <= 0 || Date.now() > stopp) return stehen;
  if (stehen >= beta) return stehen; if (stehen > alpha) alpha = stehen;
  for (const m of ch.moves({ verbose: true }).filter((x) => x.captured).sort((a, b) => schOrdnung(b) - schOrdnung(a)).slice(0, 8)) {
    ch.move(m); const w = -schRuhig(ch, -beta, -alpha, q - 1, stopp); ch.undo(); if (w >= beta) return w; if (w > alpha) alpha = w; }
  return alpha;
}
function schSuche(ch, tiefe, alpha, beta, stopp) {
  const zuege = ch.moves({ verbose: true });
  if (!zuege.length) return ch.inCheck() ? -100000 - tiefe : 0;
  if (ch.isDraw()) return 0;
  if (tiefe <= 0 || Date.now() > stopp) return schRuhig(ch, alpha, beta, 3, stopp);
  zuege.sort((a, b) => schOrdnung(b) - schOrdnung(a));
  for (const m of zuege) { ch.move(m); const w = -schSuche(ch, tiefe - 1, -beta, -alpha, stopp); ch.undo(); if (w >= beta) return w; if (w > alpha) alpha = w; }
  return alpha;
}
function schComputerZug(ch, staerke) {
  const zuege = ch.moves({ verbose: true }); if (!zuege.length) return null;
  if (staerke === "leicht" && Math.random() < 0.35) { const s = zuege.filter((m) => m.captured), pool = s.length && Math.random() < 0.6 ? s : zuege; return pool[Math.floor(Math.random() * pool.length)]; }
  const tiefe = { leicht: 1, mittel: 2, schwer: 3 }[staerke] || 2, stopp = Date.now() + (staerke === "schwer" ? 3000 : 1500);
  zuege.sort((a, b) => schOrdnung(b) - schOrdnung(a));
  let best = -Infinity, wahl = [];
  for (const m of zuege) { ch.move(m); const w = -schSuche(ch, tiefe - 1, -Infinity, -best + 10, stopp) + (staerke === "leicht" ? Math.random() * 60 : Math.random() * 8); ch.undo();
    if (w > best) { best = w; wahl = [m]; } else if (Math.abs(w - best) < 1) wahl.push(m); }
  return wahl[Math.floor(Math.random() * wahl.length)];
}
// ----- Brett -----
// KC-CLUB-SCHACH-BRIGADE (2.11.0, Wunsch Hansi): Figuren als Küchenbrigade – König = Küchenchef, Dame = Kaltmamsell,
// Turm = Souschef, Läufer = Patissier, Springer = Springer (heißt in der Küche wirklich so), Bauer = Praktikant.
// Umschaltbar auf klassische Figuren (nur dieses Gerät). Die Regeln bleiben echtes Schach.
// KC-CLUB-SCHACH-SPASS (2.116.0, Test-Rückmeldung „macht keinen Spaß, Figuren schlecht zu erkennen“): klassisch ist jetzt Standard –
// mit gezeichneten Figuren (Cburnett, BSD, lib/schach) statt Schriftzeichen; die Küchenbrigade bleibt wählbar (Knopf „👨‍🍳 Brigade“).
const SCH_BRIGADE = { k: "👨‍🍳", q: "👩‍🍳", r: "🍲", b: "🎂", n: "🔪", p: "🥄" }, SCH_BRIGADE_NAME = { k: "Küchenchef", q: "Kaltmamsell", r: "Souschef", b: "Patissier", n: "Springer", p: "Praktikant" };
// KC-CLUB-SCHACH-FIGUREN (2.123.0, Testerin + Wunsch Hansi): drei Stile – klassisch (Standard, Cburnett, lib/schach),
// plastisch (Spatial von Maurizio Monge, MIT, lib/schach/plastisch) und Küchenbrigade. Wer die Brigade gewählt hatte, behält sie.
const SCH_STILE = ["klassisch", "plastisch", "brigade"], SCH_STIL_NAME = { plastisch: "Plastisch", klassisch: "Klassisch", brigade: "Brigade" };
let SCH_STIL = (() => { try { const w = localStorage.getItem("kc_club_schach_stil2"); if (SCH_STILE.includes(w)) return w;
  return localStorage.getItem("kc_club_schach_stil") === "brigade" ? "brigade" : "klassisch"; } catch { return "klassisch"; } })();
const schBrigade = () => SCH_STIL === "brigade";
const schFigName = (t) => schBrigade() ? SCH_BRIGADE_NAME[t] : SCH_NAME[t];
// KC-CLUB-SCHACH-ELFENBEIN (2.123.0, Wunsch Hansi nach Bild): klassisch = Cburnett in Elfenbein/Tiefschwarz mit Verlauf (lib/schach/elfenbein)
const SCH_BILD_V = 2, schFigBild = (t, farbe) => `lib/schach/${SCH_STIL === "plastisch" ? "plastisch" : "elfenbein"}/${farbe === "w" ? "w" : "b"}${t}.svg?v=${SCH_BILD_V}`;
// fehlt ein Bild (offline, nie geladen), steht dort das Schriftzeichen wie bisher
const schFigHtml = (t, farbe) => schBrigade() ? `<span class="sch-fig brigade ${farbe === "w" ? "weiss" : "schwarz"}${t === "k" ? " chef" : t === "q" ? " dame" : ""}" title="${SCH_BRIGADE_NAME[t]}">${SCH_BRIGADE[t]}</span>`
  : `<span class="sch-fig bild ${farbe === "w" ? "weiss" : "schwarz"}"><img src="${schFigBild(t, farbe)}" alt="" draggable="false" onerror="this.parentNode.classList.remove('bild');this.replaceWith('${SCH_FIG[t]}\uFE0E')"></span>`;
function schStilWechseln() { SCH_STIL = SCH_STILE[(SCH_STILE.indexOf(SCH_STIL) + 1) % SCH_STILE.length]; lsSetzen("kc_club_schach_stil2", SCH_STIL); melde(`♟️ Figuren: ${SCH_STIL_NAME[SCH_STIL]}`); spZeigen(); }
// 2.23.38 KC-CLUB-SCHACH-AUFGERAEUMT: Umschalt-Knopf schmal in der Knopfleiste, „Wer ist wer“ eingeklappt unter dem Brett
const schStilKnopf = () => `<button class="knopf" onclick="schStilWechseln()" title="Figuren wechseln: Klassisch → Plastisch → Brigade"><span class="kt-ico">♟️</span>Figuren: ${SCH_STIL_NAME[SCH_STIL]}</button>`;
const schStilHtml = () => schBrigade() ? `<details class="sch-wer"><summary>👨‍🍳 Wer ist wer?</summary><div class="sch-legende" aria-label="Wer ist wer">${["k", "q", "r", "b", "n", "p"].map((t) => `<span>${SCH_BRIGADE[t]} ${SCH_BRIGADE_NAME[t]}${SCH_BRIGADE_NAME[t] !== SCH_NAME[t] ? ` <small class="hinweis">(${SCH_NAME[t]})</small>` : ""}</span>`).join("")}</div></details>` : "";
// KC-CLUB-SCHACH-SPASS: data-feld/data-klick/data-ich für das Schieben, eigener Turm als Rochade-Ziel (gestrichelt statt „Schlagen“-Ring),
// 💡 Tipp-Feld von Twinkey
function schBrettHtml(ch, { unten = "w", auswahl = null, ziele = [], letzter = null, klick = "", aus = false, tipp = null } = {}) {
  const brett = ch.board(), schachK = ch.inCheck() ? ch.turn() : null, reihen = unten === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const spalten = unten === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  let h = "";
  for (const r of reihen) for (const c of spalten) {
    const feld = "abcdefgh"[c] + (8 - r), f = brett[r][c], hell = (r + c) % 2 === 0, ziel = ziele.includes(feld);
    const kl = ["sch-feld", hell ? "hell" : "dunkel", auswahl === feld ? "gewaehlt" : "", letzter && (letzter.slice(0, 2) === feld || letzter.slice(2, 4) === feld) ? "letzter" : "",
      ziel ? (!f ? "ziel" : f.color === ch.turn() ? "ziel rochade" : "ziel schlag") : "", tipp === feld ? "tipp" : "", f && f.type === "k" && f.color === schachK ? "imschach" : ""].filter(Boolean).join(" ");
    h += `<button class="${kl}" data-feld="${feld}" ${aus ? "disabled" : ""} onclick="${klick}('${feld}')" aria-label="${feld}${f ? ": " + (f.color === "w" ? "Weiß: " : "Schwarz: ") + schFigName(f.type) : ""}">${f ? schFigHtml(f.type, f.color) : ""}</button>`;
  }
  // KC-CLUB-SCHACH-ELFENBEIN: Beschriftung außen – Zahlen links, Buchstaben unten (wie auf einem echten Brett)
  return `<div class="sch-rahmen"><div class="sch-zahlen" aria-hidden="true">${reihen.map((r) => `<span>${8 - r}</span>`).join("")}</div>`
    + `<div class="sch-brett${aus ? " aus" : ""}" role="grid" aria-label="Schachbrett" data-klick="${klick}" data-ich="${unten}">${h}</div>`
    + `<div></div><div class="sch-buchst" aria-hidden="true">${spalten.map((c) => `<span>${"ABCDEFGH"[c]}</span>`).join("")}</div></div>`;
}
// ---------- KC-CLUB-SCHACH-SPASS (2.116.0, Test-Rückmeldung + Wunsch Hansi): Schach soll Spaß machen ----------
// Figuren schieben (Finger oder Maus) zusätzlich zum Antippen, Figuren gleiten, leise Holz-Töne (🔔, Standard an),
// Rochade-Hinweis mit Grund, Twinkey als Gegner (gegen den Computer) bzw. als Zuschauer (gegen Mitglieder): Sprechblase
// mit Sprüchen und Tipps – mit 🔊 Ansage spricht Twinkey auch. Die Regeln bleiben chess.js, der Server prüft wie immer.

// Warum geht die Rochade nicht? seite "k" = kurz, "q" = lang. null = sie geht.
function schRochadeGrund(ch, seite) {
  const c = ch.turn(), r = c === "w" ? "1" : "8", gegner = c === "w" ? "b" : "w", lang = seite === "q", name = lang ? "lange" : "kurze";
  if (ch.moves({ square: "e" + r, verbose: true }).some((m) => m.flags.includes(seite))) return null;
  const k = ch.get("e" + r), turmFeld = (lang ? "a" : "h") + r, turm = ch.get(turmFeld), recht = ch.getCastlingRights(c), koenig = schFigWort("k");
  if (!k || k.type !== "k" || k.color !== c) return `Dein ${koenig} hat schon gezogen – dann ist keine Rochade mehr erlaubt.`;
  if (!recht[seite]) {
    if (!turm || turm.type !== "r" || turm.color !== c) return `Auf ${schFeldWort(turmFeld)} steht kein ${schFigWort("r")} mehr – die ${name} Rochade geht nicht.`;
    const anderer = ch.get((lang ? "h" : "a") + r);
    if (!recht.k && !recht.q && anderer?.type === "r" && anderer.color === c) return `Dein ${koenig} hat schon einmal gezogen – dann ist keine Rochade mehr erlaubt.`;
    return `Dieser ${schFigWort("r")} hat schon gezogen – die ${name} Rochade ist nicht mehr erlaubt.`;
  }
  if (ch.inCheck()) return "Im Schach darfst du nicht rochieren – wehre zuerst das Schach ab.";
  const dazwischen = (lang ? ["b", "c", "d"] : ["f", "g"]).map((s) => ch.get(s + r)).filter(Boolean);
  if (dazwischen.length) return `Zwischen ${koenig} und ${schFigWort("r")} ${dazwischen.length > 1 ? "stehen" : "steht"} noch ${dazwischen.map((f) => (f.type === "q" ? "die " : "der ") + schFigWort(f.type)).join(" und ")} – erst wegziehen, dann rochieren.`;
  for (const s of lang ? ["d", "c"] : ["f", "g"]) if (ch.isAttacked(s + r, gegner)) return s === (lang ? "c" : "g")
    ? `Nach der Rochade stünde dein ${koenig} auf ${schFeldWort(s + r)} im Schach – das ist nicht erlaubt.`
    : `Dein ${koenig} darf nicht über ein angegriffenes Feld ziehen – ${schFeldWort(s + r)} wird angegriffen.`;
  return "Die Rochade geht gerade nicht.";
}
// Twinkeys Sprüche: {dein}/{deinA}/{mein}/{meinA}/{denA}/{zum} = Figur mit Artikel, {bauer} = Bauer/Praktikant, {er} = Gegenüber.
// Gegen den Computer ist Twinkey der Gegner, gegen Mitglieder schaut er zu („mg_…“).
// KC-CLUB-SCHACH-SPRUECHE (2.118.0, Wunsch Hansi): mehr Sprüche je Lage, frech im Stil bekannter Schach-Figuren, aber eigene Küchen-Sprüche
const SCH_TW_SPRUECHE = {
  start: ["Heute schlage ich dich bestimmt – ich habe die ganze Nacht geübt!", "Ich habe keine Angst. Du hast Angst. 😄", "Na, bereit? Ich hab mir extra eine frische Schürze angezogen.",
    "Auf geht's! Möge die bessere Küche gewinnen.", "Ich habe heute schon drei Partien gewonnen – gegen mich selbst.", "Los geht's – aber nicht zu schnell, ich muss noch die Soße abschmecken.",
    "Ich hab mein Glücks-Nudelholz dabei – heute gewinne ich!", "Meine Schürze ist frisch gestärkt. Ich bin bereit!", "Möge der bessere Koch gewinnen – also ich. 😄"],
  startLeicht: ["Ich bin heute noch etwas verschlafen – sei nett zu mir!", "Ich spiel heute ganz gemütlich. Mal sehen, ob das reicht …", "Heute spiel ich nur mit halber Kraft – die andere Hälfte rührt die Suppe."],
  startSchwer: ["Heute spiele ich mit voller Konzentration. Kein Erbarmen in der Küche!", "Ich habe die ganze Nacht Schachbücher gelesen. Zieh dich warm an!", "Heute gewinne ich – das hab ich meinem Küchenchef versprochen."],
  weiter: ["Weiter geht's – ich hab das Brett so gelassen, wie es war. Ehrenwort!", "Da bist du ja wieder! Ich hab schon auf dich gewartet.", "Schön, dass du wieder da bist. Wo waren wir stehengeblieben?"],
  ruhigIch: ["Aha, so willst du das also machen.", "Hm, damit hab ich nicht gerechnet.", "Nicht schlecht, nicht schlecht …", "Mutig, mutig!", "Das merk ich mir für die nächste Partie.", "Interessant … sehr interessant.",
    "Moment … was hast du denn vor?", "Hmm, das sieht verdächtig nach einem Plan aus."],
  ruhigEr: ["So, jetzt du!", "Na, was sagst du jetzt?", "Den Zug hab ich mir beim Zwiebelschneiden ausgedacht.", "Dein Zug, Chef!", "Hehe – der war gut, oder?", "Ich hab da so einen Plan …",
    "Den Zug hab ich aus einem alten Kochbuch.", "Raffiniert, oder? Wie Omas Geheimsoße."],
  schnell: ["{dein} ist heute aber schnell unterwegs!", "Huiii – {dein} rennt ja quer übers Brett!", "Wo will denn {dein} so eilig hin?"],
  bauerWeit: ["Deinen {bauerA} möchte ich so weit vorne eigentlich nicht sehen …", "Halt! Dein {bauer} kommt mir zu nahe!", "Dein {bauer} will wohl befördert werden – nicht mit mir!"],
  ichSchlage: ["Aua, {mein}! Den brauchte ich noch.", "Ich wollte {meinA} sowieso loswerden … ehrlich!", "Hey! Das war {mein}!", "Na warte, das zahl ich dir heim!",
    "Autsch! Das kommt auf deine Rechnung.", "Pff – {mein} war eh nur zur Deko da.", "Den hätte ich noch für die Vorspeise gebraucht!", "Das war ein Test. Du hast ihn bestanden. Leider."],
  ichSchlageDame: ["{mein}! Das gibt's doch nicht!", "Oh nein, {mein} … Jetzt wird's schwer für mich.",
    "{mein}! Was wird bloß mein Küchenchef dazu sagen?", "Nicht {meinA}! Die hatte heute Geburtstag!", "{mein} … ich glaub, ich muss mich kurz setzen.", "Das melde ich der Küchenleitung!"],
  erSchlaegt: ["Danke für {deinA} – kommt direkt in die Suppe!", "Lecker – {deinA} nehme ich gern mit!", "Ups – {dein} stand da ganz schön allein herum.",
    "Hmm, {deinA} nehme ich mit – als Beilage.", "{deinA} werfe ich direkt in den Topf!", "Tja – wer nicht aufpasst, landet in der Suppe."],
  erSchlaegtDame: ["{dein}! Die nehme ich mit Kusshand.", "Ohje – {dein} ist weg. Das tut mir fast leid … aber nur fast.",
    "{dein} hat gekündigt – und arbeitet ab jetzt bei mir.", "{dein}? Die ist jetzt in meiner Küche. 😄"],
  ichSchach: ["Huch, Schach! Da muss ich aufpassen.", "Oha – mein König schwitzt!", "Schach? Das hab ich natürlich kommen sehen …",
    "Huch! Wer hat denn die Herdplatte so heiß gedreht?", "Schach? Moment, das war so nicht abgesprochen!", "Keine Panik, Twinkey … keine Panik …"],
  erSchach: ["Schach! Pass auf deinen König auf.", "Schach! Jetzt wird's heiß in der Küche.", "Schach – wohin jetzt mit deinem König?",
    "Ich hol mir jetzt die Kochmütze – Schach!", "Schach! Riechst du das? Da brennt was an – dein König.", "Schach! Dein König sollte langsam die Schürze packen."],
  ichRochade: ["Schöne Rochade – dein König sitzt jetzt sicher.", "Rochade! Da hat jemand aufgepasst."],
  erRochade: ["Ich bring meinen König in Sicherheit – Rochade!", "Rochade! Mein König macht es sich gemütlich.",
    "Mein König zieht sich in die Speisekammer zurück – Rochade!"],
  ichUmwandlung: ["Was? Dein {bauer} wird {zum}? Das ist unfair!", "Oh nein – dein {bauer} hat es geschafft!",
    "Dein {bauer} wird befördert? Das ging bei mir nie so schnell!"],
  erUmwandlung: ["Mein {bauer} ist durch – Beförderung {zum}!", "Hehe, mein {bauer} wird {zum}!"],
  ichSieg: ["Glückwunsch, du hast gewonnen! Revanche? Diesmal pass ich besser auf.", "Schachmatt … ich geh dann mal Zwiebeln schneiden. Gut gespielt!",
    "Das war natürlich Absicht – ich wollte dir eine Freude machen!", "Ich verlange eine Revanche – gleich nach dem Abwasch!", "Glückwunsch! Ich geh dann mal heimlich in die Zwiebeln weinen.", "Das lag nur am Messer – das war stumpf!", "Na gut – heute koche ich den Nachtisch für dich."],
  erSieg: ["Schachmatt! Hab ich doch gesagt – die ganze Nacht geübt! 😄", "Gewonnen! Aber du hast gut gekämpft. Noch eine?",
    "Noch ein Sieg für Team Kochmütze!", "Sei nicht traurig – ich bin halt ein Naturtalent am Herd.", "Gewonnen – und das ganz ohne Rezept!", "Das gibt heute Abend Extra-Nachtisch – für mich. 😋", "Keine Sorge – auch große Köche haben klein angefangen."],
  remis: ["Unentschieden – wir sind wohl gleich gut!", "Remis! Dann teilen wir uns den Nachtisch.",
    "Unentschieden – dann kochen wir eben zusammen.", "Keiner gewinnt – wie ein Soufflé, das nicht aufgeht."],
  warten: ["Lass dir Zeit – ich hol mir solange einen Kaffee ☕", "Ich mach in der Zwischenzeit schon mal die Spülmaschine an …", "Brauchst du Hilfe? Tipp auf 💡 Tipp, dann verrate ich dir einen Zug.",
    "Keine Eile – ich schäle solange Kartoffeln.", "Ich hab Zeit. Die Suppe muss eh noch ziehen."],
  zurueck: ["Zug zurück? Na gut, ausnahmsweise.", "Okay, wir tun so, als wär nichts gewesen.",
    "Zurücknehmen? Na gut – in der Küche darf man ja auch nachwürzen."],
  mg_start: ["Viel Spaß gegen {er}! Ich schau zu und helfe dir, wenn du nicht weiterweißt.", "Auf eine schöne Partie gegen {er}! Ich drück dir die Daumen."],
  mg_schnell: ["{dein} ist heute aber schnell unterwegs!", "Huiii – {dein} rennt ja quer übers Brett!"],
  mg_bauerWeit: ["Dein {bauer} marschiert mutig nach vorne – {er} wird nervös!"],
  mg_ichSchlage: ["Stark – du hast {er} {denA} abgenommen!", "Zack – {denA} von {er} hast du dir geschnappt!"],
  mg_ichSchlageDame: ["Wow – du hast {er} {denA} abgenommen!",
    "Die Dame von {er} ist weg! Was wird da bloß der Küchenchef sagen?"],
  mg_erSchlaegt: ["Oje – {er} hat {deinA} geschlagen.", "Autsch – {deinA} hat {er} dir weggeschnappt."],
  mg_erSchlaegtDame: ["Oh nein – {er} hat {deinA} geschlagen! Jetzt gut aufpassen."],
  mg_ichSchach: ["Schach! Jetzt muss sich {er} was einfallen lassen."],
  mg_erSchach: ["Achtung, {er} sagt Schach! Rette deinen König.",
    "{er} will sich die Kochmütze holen – Schach! Pass auf."],
  mg_ichRochade: ["Schöne Rochade – dein König sitzt jetzt sicher."],
  mg_erRochade: ["{er} hat rochiert – der König dort steht jetzt sicherer."],
  mg_ichUmwandlung: ["Dein {bauer} wird {zum} – stark!"],
  mg_erUmwandlung: ["Achtung – bei {er} wird ein {bauer} {zum}!"],
  mg_ichSieg: ["Schachmatt – du hast gewonnen! Glückwunsch! 🏆",
    "Gewonnen gegen {er}! Das muss gefeiert werden. 🏆"],
  mg_erSieg: ["Schachmatt – diesmal hat {er} gewonnen. Revanche?",
    "{er} hat gewonnen – aber du verlangst doch sicher eine Revanche?"],
  mg_remis: ["Unentschieden – ihr seid wohl gleich gut!"],
  mg_weiterIch: ["Gut gezogen – jetzt ist {er} dran.", "So, jetzt muss {er} überlegen."],
  mg_weiterEr: ["{er} hat gezogen – du bist dran!", "Jetzt bist du wieder dran."],
};
const SCH_TW = { text: "", hinweis: false, partie: null, neuBis: 0, zuletzt: {}, rochadeTipp: new Set() };
function schTwWahl(art) {
  const l = SCH_TW_SPRUECHE[art] || []; if (!l.length) return "";
  let i = Math.floor(Math.random() * l.length); if (l.length > 1 && i === SCH_TW.zuletzt[art]) i = (i + 1) % l.length; // nicht zweimal derselbe
  SCH_TW.zuletzt[art] = i; return l[i];
}
const schTwFuellen = (text, w = {}) => { const s = text.replace(/\{(\w+)\}/g, (_, k) => w[k] ?? ""); return s.charAt(0).toUpperCase() + s.slice(1); };
const schTwFig = (t) => { const n = schFigWort(t), a = schFigAkk(t), f = t === "q";
  return { mein: (f ? "meine " : "mein ") + n, meinA: (f ? "meine " : "meinen ") + a, dein: (f ? "deine " : "dein ") + n, deinA: (f ? "deine " : "deinen ") + a,
    deinD: (f ? "deiner " : "deinem ") + a, denA: (f ? "die " : "den ") + a, zum: (f ? "zur " : "zum ") + n, bauer: schFigWort("p"), bauerA: schFigAkk("p") }; };
const schTwHtml = () => `<div class="sch-twinkey${SCH_TW.hinweis ? " hinweis" : ""}${Date.now() < SCH_TW.neuBis ? " neu" : ""}" role="status" aria-live="polite"><span class="sch-tw-kopf" aria-hidden="true">🧑‍🍳</span><p class="sch-tw-blase"><b>Twinkey:</b> ${esc(SCH_TW.text || "…")}</p></div>`;
function schTwSag(text, { sprich = true, hinweis = false } = {}) {
  if (!text) return;
  SCH_TW.text = text; SCH_TW.hinweis = hinweis; SCH_TW.neuBis = Date.now() + 300;
  const el = document.querySelector("#spInhalt .sch-twinkey"); if (el) el.outerHTML = schTwHtml();
  if (sprich) schTwSprich(text.replace(/[\p{Extended_Pictographic}️‍]/gu, "").trim());
}
// KC-CLUB-SCHACH-STIMME (2.123.0, Testerin: „Twinkey klingt wie eine Frau“): Twinkey spricht mit der Männerstimme
// (dieselbe wie „Männer im Chat“ in ⚙️ Einstellungen → Stimme; ohne Männerstimme auf dem Gerät dieselbe Stimme tiefer).
// Ob er spricht, regelt der Sprach-Knopf (KC-CLUB-SCHACH-SPRACHE); die Zugansage bleibt in der normalen Stimme.
function schTwSprich(text) {
  if (!text || schSprache() === "aus" || aktuelleAnsicht !== "spiele") return;
  try { if (!("speechSynthesis" in window)) return;
    const st = stimmeFuer("m"), u = new SpeechSynthesisUtterance(text); u.lang = "de-DE";
    if (st.voice) { u.voice = st.voice; u.lang = st.voice.lang; } u.pitch = st.pitch; speechSynthesis.speak(u); } catch {}
}
// KC-CLUB-SCHACH-SPRACHE (2.123.0, Wunsch Hansi „Ton mit den Zügen oder nur die Kommentare von Twinkey“): ein Knopf, drei Stufen –
// 🔇 Stumm (Twinkey nur in der Sprechblase) → 🗣️ Nur Twinkey (Sprüche und Tipps) → 🔊 Twinkey + Züge (wie bisher „🔊 Ansage an“).
// Die Zugansage hängt weiter am bisherigen Ansage-Schalter (spSag) – der wird mitgestellt: an nur bei „Twinkey + Züge“.
const SCH_SPRACHE_KEY = "kc_club_schach_sprache", SCH_SPRACHEN = ["aus", "twinkey", "alles"];
const SCH_SPRACHE_TEXT = { aus: "🔇 Stumm", twinkey: "🗣️ Nur Twinkey", alles: "🔊 Twinkey + Züge" };
function schSprache() {
  try { const w = localStorage.getItem(SCH_SPRACHE_KEY); if (SCH_SPRACHEN.includes(w)) return w; } catch {}
  return spAnsageAn("schach") ? "alles" : "aus"; // noch nichts gewählt: wie der alte Ansage-Schalter
}
const schSprachKnopf = () => { const s = schSprache();
  const [ico, ...wort] = SCH_SPRACHE_TEXT[s].split(" ");
  return `<button class="knopf sch-sprache-knopf" aria-label="Sprache: ${SCH_SPRACHE_TEXT[s]} – antippen zum Wechseln" onclick="schSpracheWechseln()"><span class="kt-ico">${ico}</span>${wort.join(" ")}</button>`; };
function schSpracheWechseln() {
  const neu = SCH_SPRACHEN[(SCH_SPRACHEN.indexOf(schSprache()) + 1) % SCH_SPRACHEN.length];
  lsSetzen(SCH_SPRACHE_KEY, neu);
  let w = {}; try { w = JSON.parse(localStorage.getItem(SP_ANSAGE_KEY) || "{}") || {}; } catch {}
  w.schach = neu === "alles"; lsSetzen(SP_ANSAGE_KEY, JSON.stringify(w));
  document.querySelectorAll(".sch-sprache-knopf").forEach((b) => (b.outerHTML = schSprachKnopf()));
  try { speechSynthesis.cancel(); } catch {}
  if (neu === "aus") return melde("🔇 Schach ist stumm – Twinkey redet nur in der Sprechblase");
  if (!("speechSynthesis" in window)) return melde("Dieses Gerät kann leider nicht vorlesen.", true);
  schTwSprich(neu === "alles" ? "Ich sage dir jetzt jeden Zug an – und gebe meinen Senf dazu." : "Ab jetzt rede nur noch ich. Die Züge siehst du ja selbst.");
}
const schAbstand = (a, b) => Math.max(Math.abs(a.charCodeAt(0) - b.charCodeAt(0)), Math.abs(+a[1] - +b[1]));
// Spruch nach einem Zug (m = Zug aus chess.js, ch = Stellung danach, ich = meine Farbe, er = Name des Gegenübers; ohne er = gegen Twinkey)
function schTwKommentar(m, ch, ich, er = null) {
  const eigen = m.color === ich, vor = er ? "mg_" : "";
  let a = null, f = m.piece;
  if (ch.isCheckmate()) a = eigen ? "ichSieg" : "erSieg";
  else if (ch.isDraw()) a = "remis";
  else if (/[kq]/.test(m.flags)) a = eigen ? "ichRochade" : "erRochade";
  else if (m.promotion) { a = eigen ? "ichUmwandlung" : "erUmwandlung"; f = m.promotion; }
  else if (ch.inCheck()) a = eigen ? "ichSchach" : "erSchach";
  else if (m.captured) { a = (eigen ? "ichSchlage" : "erSchlaegt") + (m.captured === "q" ? "Dame" : ""); f = m.captured; }
  else if (eigen && "brq".includes(m.piece) && schAbstand(m.from, m.to) >= 4 && Math.random() < 0.7) a = "schnell";
  else if (eigen && m.piece === "p" && (ich === "w" ? m.to[1] >= "6" : m.to[1] <= "3") && Math.random() < 0.7) a = "bauerWeit";
  else if (!er && Math.random() < 0.3) a = eigen ? "ruhigIch" : "ruhigEr";
  const t = a ? schTwWahl(vor + a) : "";
  return t ? schTwFuellen(t, { er: er || "", ...schTwFig(f) }) : "";
}
// Hinweis beim Antippen – vorher (feld = angetippt, auswahl/ziele = bisher gewählt)
function schHinweisVor(ch, auswahl, ziele, feld, ich, er = null) {
  const a = auswahl ? ch.get(auswahl) : null, f = ch.get(feld), r = ich === "w" ? "1" : "8";
  if (a?.type === "k" && auswahl === "e" + r && feld[1] === r && !ziele.includes(feld)) {
    const turm = f && f.color === ich && f.type === "r" && "ah".includes(feld[0]), zwei = !f && "cg".includes(feld[0]);
    if (turm || zwei) return schRochadeGrund(ch, "gh".includes(feld[0]) ? "k" : "q");
  }
  if (!a && f && f.color !== ich) return er ? `Das ist eine Figur von ${er} – tipp eine von deinen an.` : "Das ist meine Figur 😉 – nimm eine von deinen.";
  if (a && !ziele.includes(feld) && !(f && f.color === ich)) return ch.inCheck() ? "Du stehst im Schach – zuerst muss dein König in Sicherheit." : schTwFuellen(`{dein} kann nicht nach ${schFeldWort(feld)}.`, schTwFig(a.type));
  return "";
}
// Hinweis nach dem Wählen einer eigenen Figur (schluessel = Partie, damit der Rochade-Tipp nur einmal je Partie kommt)
function schHinweisNach(ch, auswahl, ziele, schluessel) {
  const a = auswahl ? ch.get(auswahl) : null; if (!a) return "";
  if (!ziele.length) return schTwFuellen(`{dein} kann gerade nicht ziehen.${ch.inCheck() ? " Du stehst im Schach – zuerst muss dein König in Sicherheit." : ""}`, schTwFig(a.type));
  if (a.type === "k" && !SCH_TW.rochadeTipp.has(schluessel) && ch.moves({ square: auswahl, verbose: true }).some((m) => /[kq]/.test(m.flags))) {
    SCH_TW.rochadeTipp.add(schluessel);
    return `Tipp: Hier geht die Rochade – schieb deinen ${schFigWort("k")} auf den ${schFigWort("r")} (oder tipp den ${schFigWort("r")} an).`;
  }
  return "";
}
// Töne: leises Holz-Klopfen je Zug, Schlagen, Rochade, Schach, Spielende – Schalter 🔔 gilt für dieses Gerät, Standard an
const SCH_TON_KEY = "kc_club_schach_toene";
const schToeneAn = () => { try { return localStorage.getItem(SCH_TON_KEY) !== "aus"; } catch { return true; } };
const schTonKnopf = () => `<button class="knopf sch-ton-knopf" aria-pressed="${schToeneAn()}" onclick="schToeneSchalten()"><span class="kt-ico">${schToeneAn() ? "🔔" : "🔕"}</span>Töne ${schToeneAn() ? "an" : "aus"}</button>`; // KC-CLUB-SPIELE-LEISTE: Kachelknopf, gilt für alle Spiele
function schToeneSchalten() { lsSetzen(SCH_TON_KEY, schToeneAn() ? "aus" : "an"); document.querySelectorAll(".sch-ton-knopf").forEach((b) => (b.outerHTML = schTonKnopf())); schTon("zug"); }
function schTon(art) {
  if (!schToeneAn() || aktuelleAnsicht !== "spiele") return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.();
    const ton = (t, f, laut, dauer = 0.09, typ = "triangle", fallen = 0.6) => { const o = audio.createOscillator(), g = audio.createGain(), s = audio.currentTime + t;
      o.type = typ; o.frequency.setValueAtTime(f, s); if (fallen !== 1) o.frequency.exponentialRampToValueAtTime(f * fallen, s + dauer);
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(laut, s + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, s + dauer);
      o.connect(g).connect(audio.destination); o.start(s); o.stop(s + dauer + 0.03); };
    if (art === "schlag") { ton(0, 320, 0.3); ton(0.07, 210, 0.26); }
    else if (art === "rochade") { ton(0, 440, 0.22); ton(0.13, 400, 0.22); }
    else if (art === "schach") { ton(0, 440, 0.22); ton(0.06, 880, 0.12, 0.35, "sine", 1); }
    else if (art === "sieg") [523, 659, 784, 1047].forEach((f, i) => ton(i * 0.13, f, 0.16, i === 3 ? 0.4 : 0.14, "sine", 1));
    else if (art === "niederlage") [523, 440, 349].forEach((f, i) => ton(i * 0.2, f, 0.16, i === 2 ? 0.45 : 0.2, "sine", 1));
    else if (art === "remis") { ton(0, 523, 0.15, 0.16, "sine", 1); ton(0.24, 523, 0.15, 0.16, "sine", 1); }
    else ton(0, 440, 0.22);
  } catch {}
}
// Figuren gleiten (nach dem nächsten Zeichnen des Bretts); bei der Rochade gleitet der Turm mit. Nicht nach dem Schieben (liegt schon da).
let SCH_ANIM = null;
function schAnimMerken(m) {
  const z = [[m.from, m.to]], r = m.from[1];
  if (m.flags.includes("k")) z.push(["h" + r, "f" + r]); else if (m.flags.includes("q")) z.push(["a" + r, "d" + r]);
  SCH_ANIM = z;
}
function schAnimStart() {
  const z = SCH_ANIM; SCH_ANIM = null;
  if (!z || SPAR.an || matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const brett = document.querySelector("#spInhalt .sch-brett"); if (!brett) return;
  for (const [von, nach] of z) {
    const a = brett.querySelector(`[data-feld="${von}"]`), b = brett.querySelector(`[data-feld="${nach}"]`), fig = b?.querySelector(".sch-fig"); if (!a || !fig?.animate) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    b.classList.add("gleitet");
    fig.animate([{ transform: `translate(${ra.left - rb.left}px, ${ra.top - rb.top}px)` }, { transform: "none" }], { duration: 230, easing: "ease-out" }).onfinish = () => b.classList.remove("gleitet");
  }
}
// Nach jedem Zug (eigener, Twinkeys oder vom Gegenüber): gleiten, Ton, Twinkeys Spruch
function schZugErlebt(m, ch, ich, { er = null, gezogen = false } = {}) {
  if (!m) return;
  if (!gezogen) schAnimMerken(m);
  schTon(ch.isCheckmate() ? (m.color === ich ? "sieg" : "niederlage") : ch.isDraw() ? "remis" : ch.inCheck() ? "schach" : /[kq]/.test(m.flags) ? "rochade" : m.captured ? "schlag" : "zug");
  const eigen = m.color === ich; // ein alter gelber Hinweis bleibt nach dem Zug nicht stehen
  schTwSag(schTwKommentar(m, ch, ich, er) || (SCH_TW.hinweis ? schTwFuellen(schTwWahl(er ? (eigen ? "mg_weiterIch" : "mg_weiterEr") : eigen ? "ruhigIch" : "ruhigEr"), { er: er || "" }) : ""));
}
// Schieben: Figur festhalten, aufs Zielfeld ziehen, loslassen. Kurzes Antippen bleibt wie bisher (onclick).
// Danach läuft alles über die vorhandenen Klick-Wege (Figur wählen, Zielfeld) – auch Rochade über den Turm und die Hinweise.
// Ein Klick, den der Browser nach dem Loslassen noch schickt, landet auf dem neu gezeichneten Brett ins Leere oder wählt dieselbe Figur – harmlos.
let SCH_ZIEH = null;
function schZiehKontext(brett) {
  const k = brett.dataset.klick, ch = k === "schPcKlick" ? SCH.ch : k === "schMgKlick" ? SP.ch : null;
  return ch ? { ch, fn: k === "schPcKlick" ? schPcKlick : schMgKlick } : null;
}
document.addEventListener("pointerdown", (e) => {
  if (e.button > 0 || SCH_ZIEH) return;
  const el = e.target.closest?.(".sch-brett:not(.aus) .sch-feld"); if (!el) return;
  const brett = el.closest(".sch-brett"), kx = schZiehKontext(brett); if (!kx) return;
  const von = el.dataset.feld, f = kx.ch.get(von); if (!f || f.color !== brett.dataset.ich || kx.ch.turn() !== f.color) return;
  SCH_ZIEH = { ...kx, von, el, brett, x: e.clientX, y: e.clientY, id: e.pointerId, geist: null, ueber: null };
});
document.addEventListener("pointermove", (e) => {
  const z = SCH_ZIEH; if (!z || e.pointerId !== z.id) return;
  if (!z.geist) {
    if (Math.hypot(e.clientX - z.x, e.clientY - z.y) < 6) return;
    const fig = z.el.querySelector(".sch-fig"); if (!fig || !z.el.isConnected) { SCH_ZIEH = null; return; } // Brett inzwischen neu gezeichnet
    const r = z.el.getBoundingClientRect();
    z.geist = fig.cloneNode(true); z.geist.classList.add("sch-geist"); z.geist.style.width = z.geist.style.height = r.width + "px";
    document.body.appendChild(z.geist); fig.classList.add("weg"); z.brett.classList.add("ziehen");
    for (const f of schZieleMitRochade(z.ch, z.von)) z.brett.querySelector(`[data-feld="${f}"]`)?.classList.add("ziehziel");
  }
  e.preventDefault();
  z.geist.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%) scale(1.15)`;
  const unter = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".sch-feld"), neu = unter && z.brett.contains(unter) ? unter : null;
  if (neu !== z.ueber) { z.ueber?.classList.remove("drueber"); neu?.classList.add("drueber"); z.ueber = neu; }
}, { passive: false });
function schZiehEnde(e, abbruch) {
  const z = SCH_ZIEH; if (!z || e.pointerId !== z.id) return;
  SCH_ZIEH = null; if (!z.geist) return; // nur angetippt – das erledigt onclick
  z.geist.remove(); z.ueber?.classList.remove("drueber");
  const nach = !abbruch && z.ueber?.dataset.feld;
  if (nach && nach !== z.von) { z.fn(z.von, true); z.fn(nach, false, true); }
  else z.fn(z.von, true); // zurückgelegt: Figur bleibt gewählt, die Ziele leuchten
}
// KC-CLUB-SCHACH-STILL (2.141.0, Wunsch Hansi „beim Schieben verschiebt sich manchmal das ganze Bild“): während eine Figur
// geschoben wird – und in einer laufenden Partie überhaupt auf dem Brett – darf der Finger die Seite nie mitbewegen
// (iOS Safari beachtet touch-action nicht überall; dieselbe Sperre wie beim Sortieren per Ziehen).
document.addEventListener("touchmove", (e) => {
  if (!e.cancelable) return;
  if (SCH_ZIEH || (document.body.classList.contains("sch-fokus") && e.target.closest?.(".sch-rahmen"))) e.preventDefault();
}, { passive: false });
document.addEventListener("pointerup", (e) => schZiehEnde(e, false));
document.addEventListener("pointercancel", (e) => schZiehEnde(e, true));
// KC-CLUB-SCHACH-FOKUS (2.116.0, Wunsch Hansi „Twinkey nimmt oben Platz weg, Brett zu klein“): Läuft eine Partie, verschwindet alles
// über dem Brett (Edition, Computer/Mitglieder, Stärke/Farbe/Uhr, Spielstand) und das Brett darf größer werden. Ist die Partie zu Ende
// oder abgebrochen (neue Partie, Übersicht), ist alles wieder da. „⚙️ Einstellungen“ blendet es für diese Partie wieder ein.
let SCH_FOKUS_ZEIGEN = null; // Partie, für die oben wieder eingeblendet wurde
function schFokus(aktiv, partie) {
  const an = !!aktiv && SCH_FOKUS_ZEIGEN !== partie && aktuelleAnsicht === "spiele"; // nie auf anderen Seiten (z. B. spätes Nachladen)
  document.body.classList.toggle("sch-fokus", an);
  return an;
}
const schFokusKnopf = (aktiv, partie) => !aktiv ? "" : SCH_FOKUS_ZEIGEN === partie
  ? `<button class="knopf" onclick="SCH_FOKUS_ZEIGEN=null;spZeigen()"><span class="kt-ico">🔲</span>Mehr Platz</button>`
  : `<button class="knopf" onclick="SCH_FOKUS_ZEIGEN='${partie}';spZeigen()"><span class="kt-ico">⚙️</span>Einstellungen</button>`;
function schGeschlagenHtml(ch) {
  const da = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } }, voll = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  for (const zeile of ch.board()) for (const f of zeile) if (f && f.type !== "k") da[f.color][f.type]++;
  const fehlt = (farbe) => ["q", "r", "b", "n", "p"].map((t) => schFigHtml(t, farbe).repeat(Math.max(0, voll[t] - da[farbe][t]))).join("");
  return `<div class="sch-geschlagen"><div>${fehlt("b") || "&nbsp;"}</div><div>${fehlt("w") || "&nbsp;"}</div></div>`;
}
function schUmwandlung(farbe) {
  return new Promise((fertig) => {
    const f = blattAuf("schUmwBlatt", `<h3 style="margin:0">♟️ ${schBrigade() ? "Der Praktikant wird befördert – wozu?" : "Bauer umwandeln – in welche Figur?"}</h3><div class="sch-umw">${["q", "r", "b", "n"].map((t) => `<button data-t="${t}">${schFigHtml(t, farbe)}<small>${schFigName(t)}</small></button>`).join("")}</div>`);
    f.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { f.remove(); fertig(b.dataset.t); }));
    f.onclick = (e) => { if (e.target === f) { f.remove(); fertig(null); } };
  });
}
const schStatusText = (ch, ichFarbe, wer) => ch.isCheckmate() ? "" : ch.turn() === ichFarbe ? `Du bist am Zug (${ichFarbe === "w" ? "Weiß" : "Schwarz"})${ch.inCheck() ? " – <b>Schach!</b>" : ""}` : `${wer} ist am Zug${ch.inCheck() ? " – Schach!" : ""}`;
function schVerlaufHtml(san) {
  if (!san.length) return "";
  const z = []; for (let i = 0; i < san.length; i += 2) z.push(`<span><b>${i / 2 + 1}.</b> ${esc(san[i])}${san[i + 1] ? " " + esc(san[i + 1]) : ""}</span>`);
  return `<details class="sch-verlauf"><summary>📜 Züge (${san.length})</summary><div>${z.join(" ")}</div></details>`;
}
// ---------- KC-CLUB-SCHACH-UHR (2.23.38, Wunsch Hansi): Schachuhr wie im Turnier (FIDE: Blitz bis 10 Min., Schnellschach 10–60 Min.) ----------
// Je Spieler 5/10/15 Minuten. Beide ersten Züge sind frei, danach hält jeder Zug die eigene Uhr an und startet die des Gegners.
// Zeit abgelaufen = verloren – außer der Gegner kann nicht mehr mattsetzen (nur König, König + Läufer, König + Springer) → Remis.
// Gegen den Computer zählt die App (Uhr hält an, wenn das Fenster nicht zu sehen ist); gegen Mitglieder misst der Server.
// In der letzten Minute wird die eigene Uhr rot und tickt leise.
const SCH_UHR_MIN = [5, 10, 15];
const schUhrText = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
function schKannMatt(ch, farbe) { // genug Material, um überhaupt mattsetzen zu können?
  const fig = ch.board().flat().filter((f) => f && f.color === farbe && f.type !== "k").map((f) => f.type);
  return fig.some((t) => t === "p" || t === "q" || t === "r") || fig.length >= 2;
}
const schUhrHtml = (wer, name, st) => `<div class="sch-uhr${st.laeuft === wer ? " laeuft" : ""}${st[wer] < 60000 ? " knapp" : ""}${st.aus === wer ? " aus" : ""}" data-uhr="${wer}" role="timer" aria-label="Bedenkzeit ${esc(name)}"><small>${esc(name)}</small><b>${schUhrText(st[wer])}</b></div>`;
// Brett in der Mitte, Uhren links (Gegner) und rechts (du) – auf dem Handy nebeneinander über dem Brett
const schTischHtml = (mitte, st, nameEr) => `<div class="sch-tisch${st ? " mit-uhr" : ""}">${st ? `<div class="sch-uhr-platz links">${schUhrHtml("er", nameEr, st)}</div>` : ""}<div class="sch-mitte">${mitte}</div>${st ? `<div class="sch-uhr-platz rechts">${schUhrHtml("ich", "Du", st)}</div>` : ""}</div>`;
function schUhrStand() { // { ich, er (ms), laeuft: "ich"|"er"|null, aus } der gerade gezeigten Partie
  if (SP.tab === "pc" && SP.art === "schach") {
    const u = SCH.uhr, ch = SCH.ch; if (!u || !ch) return null;
    const ich = SCH.ichFarbe, er = ich === "w" ? "b" : "w", r = (f) => Math.max(0, u.rest[f] - (u.seit && ch.turn() === f ? Date.now() - u.seit : 0));
    return { ich: r(ich), er: r(er), laeuft: u.seit ? (ch.turn() === ich ? "ich" : "er") : null, aus: u.aus ? (u.aus === ich ? "ich" : "er") : null };
  }
  const g = SP.offen, u = g?.spiel === "schach" ? g.uhr : null; if (!u) return null;
  const weg = u._t ? Date.now() - u._t : 0;
  return { ich: Math.max(0, u.ich - (u.laeuft === "ich" ? weg : 0)), er: Math.max(0, u.er - (u.laeuft === "er" ? weg : 0)), laeuft: u.laeuft, aus: u.aus };
}
let SCH_UHR_TAKT = null, SCH_UHR_SEK = -1;
function schUhrTaktStarten() { if (!SCH_UHR_TAKT) SCH_UHR_TAKT = setInterval(schUhrTakt, 250); }
function schUhrTakt() {
  schPcUhrAbgleich(); // hält die Computer-Uhr an, sobald das Schachfenster nicht mehr zu sehen ist
  const el = document.querySelectorAll("#spInhalt [data-uhr]"), st = el.length && aktuelleAnsicht === "spiele" ? schUhrStand() : null;
  if (!st) { clearInterval(SCH_UHR_TAKT); SCH_UHR_TAKT = null; return; }
  for (const e of el) { const w = e.dataset.uhr; e.querySelector("b").textContent = schUhrText(st[w]); e.classList.toggle("knapp", st[w] < 60000); e.classList.toggle("laeuft", st.laeuft === w); }
  if (st.laeuft === "ich" && st.ich > 0 && st.ich < 60000) { const sek = Math.ceil(st.ich / 1000); if (sek !== SCH_UHR_SEK) { SCH_UHR_SEK = sek; schUhrTon(sek <= 10); } }
  if (st.laeuft && st[st.laeuft] <= 0) schUhrAbgelaufen();
}
function schUhrTon(laut) { // leises Ticken (Holz-Klick)
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.();
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime; o.type = "square"; o.frequency.value = laut ? 1400 : 1000;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(laut ? 0.08 : 0.035, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.06); } catch {}
}
async function schUhrAbgelaufen() {
  if (SP.tab === "pc" && SP.art === "schach") {
    const u = SCH.uhr, ch = SCH.ch; if (!u || u.aus) return;
    const f = ch.turn(); u.rest[f] = 0; u.seit = null; u.aus = f; SCH.denkt = false; SCH.auswahl = null; SCH.ziele = [];
    schPcWerten(); schMerken(); schPcZeigen(); try { navigator.vibrate?.([200, 80, 200]); } catch {} return;
  }
  const g = SP.offen; if (!g?.uhr || g.uhr._gefragt) return;
  g.uhr._gefragt = true; // der Server entscheidet (mit 1,5 s Übertragungs-Gnade) – einmal kurz danach nachfragen
  setTimeout(async () => { try { const r = await api("spiel_holen", { id: g.id }); if (SP.offen?.id === g.id) { SP.offen = r.spiel; if (aktuelleAnsicht === "spiele") spZeigen(); } } catch {} }, 1800);
}
// gegen den Computer: Uhr läuft genau dann, wenn die Partie läuft, beide ersten Züge gemacht sind und das Schachfenster zu sehen ist
function schPcUhrAbgleich() {
  const u = SCH.uhr, ch = SCH.ch; if (!u || !ch) return;
  const soll = !u.aus && !ch.isGameOver() && ch.history().length >= 2 && !document.hidden && aktuelleAnsicht === "spiele" && SP.tab === "pc" && SP.art === "schach" && !$("v-spiele")?.classList.contains("pausiert");
  if (soll && !u.seit) u.seit = Date.now();
  else if (!soll && u.seit) { schPcUhrAnhalten(); schMerken(); }
}
function schPcUhrAnhalten() { const u = SCH.uhr; if (!u?.seit) return; const f = SCH.ch.turn(); u.rest[f] = Math.max(0, u.rest[f] - (Date.now() - u.seit)); u.seit = null; }
const schPcUhrNeu = () => (SCH.uhrMin ? { rest: { w: SCH.uhrMin * 60000, b: SCH.uhrMin * 60000 }, seit: null, aus: null } : null);
// ----- gegen den Computer -----
let SCH = (() => { let w = null; try { w = JSON.parse(localStorage.getItem(SCH_KEY) || "null"); } catch {}
  return { farbe: "w", staerke: "mittel", uhrMin: 0, uhr: null, stand: { ich: 0, pc: 0, remis: 0 }, pgn: "", ...(w || {}), ch: null, auswahl: null, ziele: [], denkt: false, gewertet: false, ichFarbe: "w" }; })();
if (SCH.uhr) SCH.uhr.seit = null; // 2.23.38: nach dem Neuladen ist die Uhr angehalten, bis das Fenster wieder zu sehen ist
const schMerken = () => { try { const u = SCH.uhr ? { ...SCH.uhr, rest: { ...SCH.uhr.rest } } : null; if (u?.seit) { const f = SCH.ch.turn(); u.rest[f] = Math.max(0, u.rest[f] - (Date.now() - u.seit)); u.seit = null; }
  localStorage.setItem(SCH_KEY, JSON.stringify({ farbe: SCH.farbe, staerke: SCH.staerke, uhrMin: SCH.uhrMin, uhr: u, stand: SCH.stand, pgn: SCH.ch?.pgn() || "", ichFarbe: SCH.ichFarbe, gewertet: SCH.gewertet, partieSeit: SCH.partieSeit || null })); } catch {} };
async function schPcZeigen() {
  if (SCH_NS) return schNsZeigen(); // KC-CLUB-SCHACH-ARCHIV: gerade wird nachgespielt
  if (!SCH.ch) { const C = await chessLaden(); SCH.ch = new C(); if (SCH.pgn) try { SCH.ch.loadPgn(SCH.pgn); } catch { SCH.ch = new C(); } }
  const ch = SCH.ch, ich = SCH.ichFarbe, s = SCH.stand, aus = SCH.uhr?.aus, ende = ch.isGameOver() || !!aus;
  if (SCH_TW.partie !== "pc") { SCH_TW.partie = "pc"; SCH_TW.hinweis = false; SCH_TW.text = schTwWahl(ch.history().length ? "weiter" : schTwStart()); } // KC-CLUB-SCHACH-SPASS: Twinkey begrüßt
  const zeitRemis = aus && !schKannMatt(ch, aus === "w" ? "b" : "w");
  const banner = !ende ? `<div class="sp-status${ch.turn() === ich ? " sp-ichdran" : ""}">${SCH.denkt ? "🧑‍🍳 Twinkey überlegt …" : schStatusText(ch, ich, "Twinkey")}</div>`
    : aus ? (zeitRemis ? `<div class="sp-banner remis">⏱️ Zeit abgelaufen – Remis (${aus === ich ? "Twinkey" : "du"} kann nicht mehr mattsetzen)</div>`
      : aus === ich ? `<div class="sp-banner niederlage">⏱️ Deine Zeit ist abgelaufen – Twinkey gewinnt</div>` : `<div class="sp-banner sieg">⏱️ Die Zeit von Twinkey ist abgelaufen – du hast gewonnen!</div>`)
    : ch.isCheckmate() ? (ch.turn() !== ich ? `<div class="sp-banner sieg">🏆 Schachmatt – du hast gewonnen!</div>` : `<div class="sp-banner niederlage">🧑‍🍳 Schachmatt – Twinkey gewinnt</div>`)
    : `<div class="sp-banner remis">🤝 Remis${ch.isStalemate() ? " – Patt" : ch.isThreefoldRepetition() ? " – dreimal dieselbe Stellung" : ch.isInsufficientMaterial() ? " – zu wenig Material" : ""}</div>`;
  const wahl = (name, fn, wert, opt) => `<label>${name}<select onchange="${fn}(this.value)">${opt.map(([w, t]) => `<option value="${w}"${String(wert) === w ? " selected" : ""}>${t}</option>`).join("")}</select></label>`;
  const st = SCH.uhr ? schUhrStand() : null, partie = "pc:" + (SCH.runde || 0), laeuft = !ende && ch.history().length > 0;
  schFokus(laeuft, partie); // KC-CLUB-SCHACH-FOKUS
  $("spInhalt").innerHTML = `<div class="karte sp-karte sch-karte">
      <div class="sch-einst">${wahl("😊 Stärke", "schPcStaerke", SCH.staerke, [["leicht", "Leicht"], ["mittel", "Mittel"], ["schwer", "Schwer"]])}${wahl("♟️ Farbe", "schPcFarbe", SCH.farbe, [["w", "Weiß"], ["b", "Schwarz"], ["wechsel", "Wechselnd"]])}${wahl("⏱️ Uhr", "schPcUhrMin", String(SCH.uhrMin || 0), [["0", "Ohne"], ...SCH_UHR_MIN.map((m) => [String(m), m + " Min."])])}</div>
      <div class="sp-stand"><span>Du <b>${s.ich}</b></span><span>🤝 <b>${s.remis}</b></span><span><b>${s.pc}</b> Twinkey</span></div>
      ${banner}
      ${schTwHtml()}
      ${schTischHtml(schGeschlagenHtml(ch) + schBrettHtml(ch, { unten: ich, auswahl: SCH.auswahl, ziele: SCH.ziele, letzter: (() => { const h = ch.history({ verbose: true }).slice(-1)[0]; return h ? h.from + h.to : null; })(), klick: "schPcKlick", aus: ende || SCH.denkt, tipp: SCH.tipp }), st, "🧑‍🍳 Twinkey")}
      ${spLeiste(SCH.uhr ? "" : spKnopf("↶", "Zug zurück", "schPcZurueck()", { aus: ch.history().length < 1 || SCH.denkt }), SCH.uhr || ende ? "" : spKnopf("💡", "Tipp", "schPcTipp()", { aus: ch.turn() !== ich || SCH.denkt }),
        spNeuKnopf("schPcNeu()"), spAbbrechenKnopf("spPcAbbrechen()"), schTonKnopf(), schSprachKnopf(), schStilKnopf(), schFokusKnopf(laeuft, partie), spKnopf("📼", "Meine Partien", "schArchivOeffnen()"), spStandKnopf("schPcStandWeg()"))}
      ${schVerlaufHtml(ch.history())}
      ${schStilHtml()}
      <p class="hinweis sch-tipp">Figur schieben – oder antippen, dann das Zielfeld. Rochade: König auf den Turm schieben.${SCH.uhr ? " Mit Uhr gibt es kein „Zug zurück“ und keinen Tipp – wie im Turnier." : ""}</p>
    </div>`;
  schAnimStart(); // KC-CLUB-SCHACH-SPASS: Figur gleitet
  schTwWarten(!ende && !SCH.denkt && !SCH.uhr && ch.turn() === ich);
  if (st) schUhrTaktStarten();
}
// KC-CLUB-SCHACH-SPASS: Begrüßung passend zur Stärke, Plaudern nach langer Pause (nur ohne Uhr), 💡 Tipp
const schTwStart = () => (SCH.staerke === "leicht" ? "startLeicht" : SCH.staerke === "schwer" ? "startSchwer" : "start");
let SCH_TW_WARTEN = null;
function schTwWarten(an) {
  clearTimeout(SCH_TW_WARTEN); if (!an) return;
  const fen = SCH.ch?.fen();
  SCH_TW_WARTEN = setTimeout(() => { if (SP.tab === "pc" && SP.art === "schach" && aktuelleAnsicht === "spiele" && !document.hidden && !SCH.denkt && SCH.ch?.fen() === fen) schTwSag(schTwWahl("warten")); }, 75000);
}
function schPcTipp() {
  const ch = SCH.ch; if (!ch || SCH.denkt || SCH.uhr || ch.isGameOver() || ch.turn() !== SCH.ichFarbe) return;
  schTwSag("Moment, ich schau mal …", { sprich: false, hinweis: true });
  setTimeout(() => { // erst die Sprechblase zeigen, dann rechnen
    if (SCH.ch !== ch || SCH.denkt || ch.turn() !== SCH.ichFarbe) return;
    const m = schComputerZug(new ch.constructor(ch.fen()), "mittel"); if (!m) return;
    SCH.auswahl = m.from; SCH.ziele = schZieleMitRochade(ch, m.from); SCH.tipp = m.to;
    const fz = schTwFig(m.piece);
    schTwSag(/[kq]/.test(m.flags) ? `Ich würde jetzt rochieren – dein ${schFigWort("k")} steht dann sicherer.`
      : m.captured ? `Schlag ${schTwFig(m.captured).denA} auf ${schFeldWort(m.to)} – mit ${fz.deinD}!`
      : `Wie wär's, wenn du ${fz.deinA} nach ${schFeldWort(m.to)} ziehst?`, { hinweis: true });
    schPcZeigen();
  }, 80);
}
async function schPcNeu(fragen = true) {
  const ch = SCH.ch;
  if (fragen && ch && ch.history().length > 2 && !ch.isGameOver() && !SCH.uhr?.aus && !(await frage("Neue Partie beginnen? Die laufende Partie wird nicht gewertet.", { ja: "↺ Neue Partie", nein: "Weiterspielen" }))) return;
  if (ch && ch.history().length >= 2 && !SCH.gewertet) schArchivPc("abgebrochen"); // KC-CLUB-SCHACH-ARCHIV
  const C = await chessLaden(); SCH.ch = new C(); SCH.auswahl = null; SCH.ziele = []; SCH.gewertet = false; SCH.uhr = schPcUhrNeu(); SCH.denkt = false; SCH.partieSeit = Date.now();
  SCH.runde = (SCH.runde || 0) + 1; SCH.ichFarbe = SCH.farbe === "wechsel" ? (SCH.runde % 2 ? "w" : "b") : SCH.farbe; SCH.tipp = null;
  SCH_TW.partie = "pc"; schTwSag(schTwWahl(schTwStart())); // KC-CLUB-SCHACH-SPASS
  schMerken(); schPcZeigen(); if (SCH.ichFarbe === "b") schPcComputerStart();
}
const schPcStaerke = (w) => { SCH.staerke = ["leicht", "mittel", "schwer"].includes(w) ? w : "mittel"; schMerken(); schPcZeigen(); };
const schPcFarbe = (w) => { SCH.farbe = ["w", "b", "wechsel"].includes(w) ? w : "w"; SCH.runde = 0; schPcNeu(true); };
const schPcUhrMin = async (w) => { const alt = SCH.uhrMin; SCH.uhrMin = SCH_UHR_MIN.includes(Number(w)) ? Number(w) : 0; await schPcNeu(true);
  if (SCH.ch?.history().length) { SCH.uhrMin = alt; schPcZeigen(); } }; // „Weiterspielen“ gewählt → alte Einstellung bleibt
async function schPcStandWeg() { if (!(await frage("Spielstand gegen den Computer auf 0 : 0 zurücksetzen?", { ja: "🗑️ Zurücksetzen", nein: "Abbrechen" }))) return; SCH.stand = { ich: 0, pc: 0, remis: 0 }; schMerken(); schPcZeigen(); }
function schPcZurueck() {
  const ch = SCH.ch; if (!ch || SCH.denkt || SCH.uhr) return; // mit Uhr kein Zurücknehmen (wie im Turnier)
  ch.undo(); if (ch.turn() !== SCH.ichFarbe) ch.undo(); // bis ich wieder dran bin
  SCH.auswahl = null; SCH.ziele = []; SCH.tipp = null; SCH.gewertet = false; schTwSag(schTwWahl("zurueck")); schMerken(); schPcZeigen();
}
function schPcWerten() {
  const ch = SCH.ch, aus = SCH.uhr?.aus; if (!(ch.isGameOver() || aus) || SCH.gewertet) return;
  SCH.gewertet = true; if (SCH.uhr) SCH.uhr.seit = null;
  const verlierer = aus ? (schKannMatt(ch, aus === "w" ? "b" : "w") ? aus : null) : ch.isCheckmate() ? ch.turn() : null; // KC-CLUB-SCHACH-UHR: Zeit
  if (!verlierer) SCH.stand.remis++; else if (verlierer !== SCH.ichFarbe) SCH.stand.ich++; else SCH.stand.pc++;
  schArchivPc(!verlierer ? "remis" : verlierer !== SCH.ichFarbe ? "gewonnen" : "verloren", aus ? "Zeit" : ch.isCheckmate() ? "Schachmatt" : ch.isStalemate() ? "Patt" : ""); // KC-CLUB-SCHACH-ARCHIV
  try { navigator.vibrate?.(verlierer && verlierer !== SCH.ichFarbe ? [60, 40, 60] : 40); } catch {}
}
// KC-CLUB-SCHACH-SPASS: neu = Auswahl zuerst aufheben (Schieben beginnt), gezogen = Figur wurde geschoben (nicht noch einmal gleiten)
async function schPcKlick(feld, neu = false, gezogen = false) {
  const ch = SCH.ch; if (!ch || SCH.denkt || ch.isGameOver() || SCH.uhr?.aus || ch.turn() !== SCH.ichFarbe) return;
  if (neu) { SCH.auswahl = null; SCH.ziele = []; }
  SCH.tipp = null; const hinweis = schHinweisVor(ch, SCH.auswahl, SCH.ziele, feld, SCH.ichFarbe);
  if (SCH.auswahl) { const r = schRochade(ch, SCH.auswahl, feld); if (r) { SCH.auswahl = r.von; SCH.ziele = [r.nach]; feld = r.nach; } } // 2.22.17: Rochade über den Turm
  const f = ch.get(feld);
  if (SCH.auswahl && SCH.ziele.includes(feld)) {
    const von = SCH.auswahl, bauer = ch.get(von)?.type === "p" && /[18]$/.test(feld);
    const umw = bauer ? await schUmwandlung(SCH.ichFarbe) : undefined; if (bauer && !umw) return;
    if (SCH.uhr?.aus) return; // während der Umwandlungs-Auswahl abgelaufen
    schPcUhrAnhalten(); // KC-CLUB-SCHACH-UHR: eigene Uhr anhalten …
    let mz; try { mz = ch.move({ from: von, to: feld, promotion: umw || "q" }); } catch { schPcUhrAbgleich(); return; }
    spSag("schach", schZugAnsage(mz, ch, SCH.ichFarbe), null, true); // KC-CLUB-SPIEL-ANSAGE
    SCH.auswahl = null; SCH.ziele = []; schZugErlebt(mz, ch, SCH.ichFarbe, { gezogen }); schPcWerten(); schPcUhrAbgleich(); /* … die des Computers starten */ schMerken();
    if (!ch.isGameOver()) SCH.denkt = true; // gleich in einem Zug zeichnen – so gleitet die Figur ungestört
    schPcZeigen(); if (SCH.denkt) schPcComputerStart(false);
    return;
  }
  if (f && f.color === SCH.ichFarbe) { SCH.auswahl = feld; SCH.ziele = schZieleMitRochade(ch, feld); }
  else { SCH.auswahl = null; SCH.ziele = []; }
  schTwSag(hinweis || schHinweisNach(ch, SCH.auswahl, SCH.ziele, "pc:" + (SCH.runde || 0)), { hinweis: true }); // KC-CLUB-SCHACH-SPASS
  schPcZeigen();
}
function schPcComputerStart(zeichnen = true) {
  SCH.denkt = true; if (zeichnen) schPcZeigen();
  setTimeout(() => { // kurz warten, damit das Brett erst neu gezeichnet wird und die eigene Figur fertig geglitten ist
    const ch = SCH.ch; if (!ch || aktuelleAnsicht !== "spiele" || SCH.uhr?.aus) { SCH.denkt = false; return; }
    if (spPauseHalt(schPcComputerStart)) { SCH.denkt = false; return; } // 2.18.0: Pause
    const m = schComputerZug(ch, SCH.staerke); if (SCH.uhr?.aus) { SCH.denkt = false; return; }
    schPcUhrAnhalten(); // KC-CLUB-SCHACH-UHR: die Bedenkzeit des Computers zählt mit
    if (m) { const mz = ch.move(m); spSag("schach", schZugAnsage(mz, ch, SCH.ichFarbe)); schZugErlebt(mz, ch, SCH.ichFarbe); } // KC-CLUB-SPIEL-ANSAGE + KC-CLUB-SCHACH-SPASS
    SCH.denkt = false; schPcWerten(); schPcUhrAbgleich(); schMerken(); if (SP.tab === "pc" && SP.art === "schach") schPcZeigen();
  }, 450);
}
// ----- gegen Mitglieder -----
let SCHM = { id: null, auswahl: null, ziele: [] };
const SCH_STELLUNG = new Map(); // KC-CLUB-SPIEL-ANSAGE: letzte gesehene Stellung je Partie
async function schSpielZeigen(g) {
  if (SCH_NS) return schNsZeigen(); // KC-CLUB-SCHACH-ARCHIV: gerade wird nachgespielt
  const C = await chessLaden(), ch = new C(g.brett), ich = g.ichBin === "x" ? "w" : "b";
  // KC-CLUB-SPIEL-ANSAGE: neuer Zug des Gegenübers seit dem letzten Blick → aus der vorigen Stellung nachvollziehen und ansagen
  const vor = SCH_STELLUNG.get(g.id);
  // KC-CLUB-SCHACH-SPASS: der Zug des Gegenübers gleitet, klingt und Twinkey sagt etwas dazu (Ansage weiterhin nur mit 🔊)
  if (vor && vor.zuege === g.zuege - 1 && g.letzterZug) {
    try { const alt = new C(vor.fen); if (alt.turn() !== ich) { const mz = alt.move({ from: g.letzterZug.slice(0, 2), to: g.letzterZug.slice(2, 4), promotion: g.letzterZug[4] || "q" });
      spSag("schach", schZugAnsage(mz, alt, ich), `sch:${g.id}:${g.zuege}`); schZugErlebt(mz, alt, ich, { er: g.gegner.vorname }); } } catch { /* Zug nicht nachvollziehbar – still */ }
  }
  if (SCH_TW.partie !== g.id) { SCH_TW.partie = g.id; SCH_TW.hinweis = false; SCH_TW.text = g.status === "beendet" ? "Schöne Partie! Lust auf eine Revanche?" : schTwFuellen(schTwWahl("mg_start"), { er: g.gegner.vorname }); }
  SCH_STELLUNG.set(g.id, { fen: g.brett, zuege: g.zuege });
  if (SCHM.id !== g.id + ":" + g.zuege) SCHM = { id: g.id + ":" + g.zuege, auswahl: null, ziele: [] };
  if (g.uhr && !g.uhr._t) g.uhr._t = Date.now(); // KC-CLUB-SCHACH-UHR: Restzeiten gelten ab Empfang
  const er = esc(g.gegner.vorname), zeitAus = g.uhr?.aus;
  const banner = g.status === "beendet" ? (zeitAus ? (g.ergebnis === "remis" ? `<div class="sp-banner remis">⏱️ Zeit abgelaufen – Remis (zu wenig Material zum Mattsetzen)</div>`
      : g.ergebnis === "gewonnen" ? `<div class="sp-banner sieg">⏱️ Die Zeit von ${er} ist abgelaufen – du hast gewonnen!</div>` : `<div class="sp-banner niederlage">⏱️ Deine Zeit ist abgelaufen – ${er} hat gewonnen.</div>`)
    : g.ergebnis === "gewonnen" ? `<div class="sp-banner sieg">🏆 ${g.aufgegeben ? `${er} hat aufgegeben – du hast gewonnen!` : "Schachmatt – du hast gewonnen!"}</div>` : g.ergebnis === "verloren" ? `<div class="sp-banner niederlage">${g.aufgegeben ? "Du hast aufgegeben." : `Schachmatt – ${er} hat gewonnen.`}</div>` : `<div class="sp-banner remis">🤝 Remis${ch.isStalemate() ? " – Patt" : ""}</div>`)
    : g.status === "angefragt" ? `<div class="sp-status">⏳ Warte, bis ${er} annimmt …</div>`
    : `<div class="sp-status${g.ichDran ? " sp-ichdran" : ""}">${schStatusText(ch, ich, er)}</div>`;
  const st = g.uhr ? schUhrStand() : null, laeuft = g.status === "laeuft";
  schFokus(laeuft, g.id); // KC-CLUB-SCHACH-FOKUS
  const nsEintrag = { id: "mg-" + g.id, zeit: Date.parse(g.geaendert) || Date.now(), art: "mg", gegner: g.gegner.vorname, ich, ergebnis: g.ergebnis || "", grund: g.aufgegeben ? "aufgegeben" : g.uhr?.aus ? "Zeit" : "", zuege: g.verlauf || [] };
  SCH_NS_MG = nsEintrag; if (g.status === "beendet") schArchivMerken(nsEintrag); // KC-CLUB-SCHACH-ARCHIV
  $("spInhalt").innerHTML = `<div class="karte sp-karte sch-karte">
      <div class="sch-kopf"><button class="knopf klein" onclick="SP.offen=null;spZeigen();spLaden(true)">‹ Übersicht</button><b>♟️ Du (${ich === "w" ? "Weiß" : "Schwarz"}) gegen ${er}${g.uhr ? ` · ⏱️ ${g.uhr.min} Min.` : ""}</b></div>
      ${banner}
      ${spTerminHtml(g)}
      ${schTwHtml()}
      ${schTischHtml(schGeschlagenHtml(ch) + schBrettHtml(ch, { unten: ich, auswahl: SCHM.auswahl, ziele: SCHM.ziele, letzter: g.letzterZug, klick: "schMgKlick", aus: !g.ichDran }), st, g.gegner.vorname)}
      ${spLeiste(g.status === "beendet" ? spKnopf("↺", "Revanche", `spRevanche('${g.id}')`, { haupt: true }) : g.status === "laeuft" ? spKnopf("🏳️", "Aufgeben", `spAufgeben('${g.id}')`) : "", schTonKnopf(), schSprachKnopf(), schStilKnopf(), schFokusKnopf(laeuft, g.id), (g.verlauf || []).length ? spKnopf("📼", "Nachspielen", "schNachspielen(SCH_NS_MG)") : "")}
      ${schVerlaufHtml(g.verlauf || [])}
      ${schStilHtml()}
      <p class="hinweis sch-tipp">Figur schieben – oder antippen, dann das Zielfeld. Rochade: König auf den Turm schieben. ${g.uhr ? "Live-Partie mit Uhr: beide ersten Züge sind frei, danach läuft die Zeit – auch wenn die App zu ist." : `Du musst nicht warten – ${er} bekommt Bescheid.`}</p>
    </div>`;
  SP.ch = ch;
  schAnimStart(); // KC-CLUB-SCHACH-SPASS: Figur gleitet
  if (st) schUhrTaktStarten();
}
async function schMgKlick(feld, neu = false, gezogen = false) { // KC-CLUB-SCHACH-SPASS: neu/gezogen wie bei schPcKlick
  const g = SP.offen, ch = SP.ch; if (!g?.ichDran || !ch) return;
  const ich = g.ichBin === "x" ? "w" : "b";
  if (neu) { SCHM.auswahl = null; SCHM.ziele = []; }
  const hinweis = schHinweisVor(ch, SCHM.auswahl, SCHM.ziele, feld, ich, g.gegner.vorname);
  if (SCHM.auswahl) { const r = schRochade(ch, SCHM.auswahl, feld); if (r) { SCHM.auswahl = r.von; SCHM.ziele = [r.nach]; feld = r.nach; } } // 2.22.17: Rochade über den Turm
  const f = ch.get(feld);
  if (SCHM.auswahl && SCHM.ziele.includes(feld)) {
    const von = SCHM.auswahl, bauer = ch.get(von)?.type === "p" && /[18]$/.test(feld);
    const umw = bauer ? await schUmwandlung(ich) : "q"; if (!umw) return;
    let mz; try { mz = ch.move({ from: von, to: feld, promotion: umw }); } catch { return; }
    spSag("schach", schZugAnsage(mz, ch, ich), `sch:${g.id}:${g.zuege + 1}`, true); // KC-CLUB-SPIEL-ANSAGE
    schZugErlebt(mz, ch, ich, { er: g.gegner.vorname, gezogen }); // KC-CLUB-SCHACH-SPASS
    if (g.uhr) { const st = schUhrStand(); g.uhr = { ...g.uhr, ich: st.ich, er: st.er, laeuft: !ch.isGameOver() && g.zuege + 1 >= 2 ? "er" : null, _t: Date.now() }; } // Uhr sofort umschalten
    g.brett = ch.fen(); g.ichDran = false; g.letzterZug = von + feld; SCHM.auswahl = null; SCHM.ziele = []; spSpielZeigen(); // sofort zeigen
    try { SP.offen = (await api("spiel_zug", { id: g.id, zug: { von, nach: feld, umwandlung: umw }, zuege: g.zuege })).spiel; }
    catch (e) { meldeFehler(e); try { SP.offen = (await api("spiel_holen", { id: g.id })).spiel; } catch {} }
    if (aktuelleAnsicht === "spiele") spZeigen();
    return;
  }
  if (f && f.color === ich) { SCHM.auswahl = feld; SCHM.ziele = schZieleMitRochade(ch, feld); }
  else { SCHM.auswahl = null; SCHM.ziele = []; }
  schTwSag(hinweis || schHinweisNach(ch, SCHM.auswahl, SCHM.ziele, g.id), { hinweis: true }); // KC-CLUB-SCHACH-SPASS
  schSpielZeigen(g);
}

// ---------- KC-CLUB-SCHACH-ARCHIV (2.118.0, Wunsch Hansi „Partie aufzeichnen, um sie später nochmal anzusehen“) ----------
// Jede Partie gegen Twinkey wird am Ende (oder beim Abbrechen ab 2 Zügen) von selbst aufgezeichnet, Partien gegen Mitglieder,
// sobald man sie beendet ansieht (die Züge liegen ohnehin auf dem Server). Gespeichert sind nur die Züge – auf diesem Gerät,
// die letzten 40 Partien. „📼 Meine Partien“ zeigt die Liste, „Nachspielen“ das Brett mit ⏮ ◀ ▶ ⏭, Schieberegler und Abspielen.
const SCH_ARCHIV_KEY = "kc_club_schach_archiv", SCH_ARCHIV_MAX = 40;
const schArchiv = () => { try { const l = JSON.parse(localStorage.getItem(SCH_ARCHIV_KEY) || "[]"); return Array.isArray(l) ? l : []; } catch { return []; } };
function schArchivMerken(e) {
  if (!e?.id || !Array.isArray(e.zuege) || !e.zuege.length) return;
  const l = schArchiv().filter((x) => x.id !== e.id); l.unshift(e);
  lsSetzen(SCH_ARCHIV_KEY, JSON.stringify(l.slice(0, SCH_ARCHIV_MAX)));
}
function schArchivPc(ergebnis, grund = "") { // Partie gegen Twinkey aufzeichnen (ergebnis aus meiner Sicht)
  const ch = SCH.ch; if (!ch || ch.history().length < 1) return;
  schArchivMerken({ id: "pc-" + (SCH.partieSeit || Date.now()), zeit: Date.now(), art: "pc", gegner: "Twinkey", stufe: SCH.staerke, ich: SCH.ichFarbe, ergebnis, grund, zuege: ch.history() });
}
const schArchivErgebnis = (e) => ({ gewonnen: "🏆 gewonnen", verloren: "verloren", remis: "🤝 unentschieden", abgebrochen: "abgebrochen" }[e.ergebnis] || "") + (e.grund ? ` (${e.grund})` : "");
const schArchivTitel = (e) => `Du (${e.ich === "w" ? "Weiß" : "Schwarz"}) gegen ${e.gegner}${e.art === "pc" && e.stufe ? ` (${{ leicht: "Leicht", mittel: "Mittel", schwer: "Schwer" }[e.stufe] || e.stufe})` : ""}`;
const schArchivDatum = (t) => { try { return new Date(t).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
// Ansicht: SCH_NS = { modus: "liste" } oder { modus: "partie", e, i, vonListe, takt }
let SCH_NS = null, SCH_NS_MG = null; // SCH_NS_MG = gerade offene Partie gegen ein Mitglied (für „📼 Nachspielen“)
function schNsStopp() { if (SCH_NS?.takt) clearInterval(SCH_NS.takt); SCH_NS = null; }
function schArchivOeffnen() { schNsStopp(); SCH_NS = { modus: "liste" }; schNsZeigen(); }
function schNachspielen(e, vonListe = false) {
  if (SCH_NS?.takt) clearInterval(SCH_NS.takt);
  SCH_NS = { modus: "partie", e, i: e.zuege.length, vonListe, takt: null }; schNsZeigen();
}
function schNsZu() { // ‹ Zurück: aus der Partie zur Liste (wenn von dort), sonst zurück ins Spiel
  if (SCH_NS?.modus === "partie" && SCH_NS.vonListe) return schArchivOeffnen();
  schNsStopp(); spZeigen();
}
async function schArchivWeg(id) { if (!(await frage("Diese Partie aus der Liste löschen?", { ja: "🗑️ Löschen", nein: "Abbrechen" }))) return; lsSetzen(SCH_ARCHIV_KEY, JSON.stringify(schArchiv().filter((x) => x.id !== id))); schNsZeigen(); }
let SCH_NS_C = null; // chess.js-Klasse (wird mit dem Spiel geladen)
function schNsStellung(e, bis) { // Stellung nach „bis“ Zügen; ok = false, wenn die Aufzeichnung dort nicht weitergeht
  const ch = new SCH_NS_C(); let letzter = null, ok = true;
  for (let k = 0; k < bis; k++) { try { letzter = ch.move(e.zuege[k]); } catch { ok = false; break; } }
  return { ch, letzter, ok };
}
async function schNsZeigen() {
  const n = SCH_NS; if (!n) return; SCH_NS_C = SCH_NS_C || (await chessLaden());
  if (SCH_NS !== n) return;
  document.body.classList.remove("sch-fokus");
  if (n.modus === "liste") {
    const l = schArchiv();
    $("spInhalt").innerHTML = `<div class="karte sp-karte sch-karte">
      <div class="sch-kopf"><button class="knopf klein" onclick="schNsZu()">‹ Zurück</button><b>📼 Meine Partien</b></div>
      ${l.length ? l.map((e) => `<div class="zeile sch-ns-zeile"><div style="flex:1;min-width:0"><b>${esc(schArchivTitel(e))}</b><div class="hinweis" style="margin:0;font-size:.85rem">${esc(schArchivDatum(e.zeit))} · ${esc(schArchivErgebnis(e))} · ${e.zuege.length} Halbzüge</div></div>
        <button class="knopf klein haupt" onclick="schNachspielen(schArchiv().find((x) => x.id === '${esc(e.id)}'), true)">▶ Nachspielen</button><button class="knopf klein" onclick="schArchivWeg('${esc(e.id)}')" title="Aus der Liste löschen" aria-label="Löschen">🗑️</button></div>`).join("")
        : `<p class="hinweis">Noch keine Partie aufgezeichnet. Jede Partie gegen Twinkey kommt nach dem Ende von selbst hierher, Partien gegen Mitglieder, sobald du sie beendet ansiehst.</p>`}
      <p class="hinweis sch-tipp">Gespeichert auf diesem Gerät – die letzten ${SCH_ARCHIV_MAX} Partien.</p></div>`;
    return;
  }
  document.body.classList.toggle("sch-fokus", aktuelleAnsicht === "spiele"); // wie in der Partie: oben weg, Brett groß
  const e = n.e, i = Math.max(0, Math.min(n.i, e.zuege.length)), { ch, letzter, ok } = schNsStellung(e, i);
  const anz = e.zuege.length, text = !i ? "Ausgangsstellung" : letzter ? `Zug ${i} von ${anz}: ${schZugAnsage(letzter, ch, e.ich)}` : "";
  const knopf = (sym, fn, an, titel) => `<button class="knopf klein" onclick="${fn}" ${an ? "" : "disabled"} aria-label="${titel}" title="${titel}">${sym}</button>`;
  const zuege = []; for (let k = 0; k < anz; k += 2) zuege.push(`<span><b>${k / 2 + 1}.</b> ${[k, k + 1].filter((x) => x < anz).map((x) => `<button class="sch-ns-zug${x + 1 === i ? " an" : ""}" onclick="schNsGehe(${x + 1})">${esc(e.zuege[x])}</button>`).join(" ")}</span>`);
  $("spInhalt").innerHTML = `<div class="karte sp-karte sch-karte">
      <div class="sch-kopf"><button class="knopf klein" onclick="schNsZu()">‹ Zurück</button><b>📼 ${esc(schArchivTitel(e))}</b></div>
      <div class="sp-status">${esc(schArchivDatum(e.zeit))} · ${esc(schArchivErgebnis(e))}</div>
      <p class="sch-ns-text" aria-live="polite">${esc(text)}${ok ? "" : " – die Aufzeichnung ist hier unvollständig."}</p>
      ${schTischHtml(schGeschlagenHtml(ch) + schBrettHtml(ch, { unten: e.ich, letzter: letzter ? letzter.from + letzter.to : null, klick: "schNsGehe", aus: true }), null)}
      <div class="sch-leiste sch-ns-leiste">${knopf("⏮", "schNsGehe(0)", i > 0, "Zum Anfang")}${knopf("◀", `schNsGehe(${i - 1})`, i > 0, "Zug zurück")}${knopf(n.takt ? "⏸ Anhalten" : "▶️ Abspielen", "schNsAbspielen()", n.takt || i < anz, n.takt ? "Anhalten" : "Abspielen")}${knopf("▶", `schNsGehe(${i + 1})`, i < anz, "Zug vor")}${knopf("⏭", `schNsGehe(${anz})`, i < anz, "Zum Ende")}</div>
      <input class="sch-ns-regler" type="range" min="0" max="${anz}" value="${i}" oninput="schNsGehe(+this.value, true)" aria-label="Zug wählen">
      <details class="sch-verlauf" open><summary>📜 Züge (${anz})</summary><div>${zuege.join(" ")}</div></details>
    </div>`;
  schAnimStart();
}
function schNsGehe(i, regler = false) {
  const n = SCH_NS; if (n?.modus !== "partie") return;
  const neu = Math.max(0, Math.min(i, n.e.zuege.length));
  if (neu === n.i + 1) { const { ch, letzter } = schNsStellung(n.e, neu); if (letzter) { if (!regler) schAnimMerken(letzter); schTon(ch.inCheck() ? "schach" : letzter.captured ? "schlag" : /[kq]/.test(letzter.flags) ? "rochade" : "zug"); spSag("schach", schZugAnsage(letzter, ch, n.e.ich), null, true); } }
  n.i = neu; if (n.takt && neu >= n.e.zuege.length) { clearInterval(n.takt); n.takt = null; }
  schNsZeigen();
}
function schNsAbspielen() {
  const n = SCH_NS; if (n?.modus !== "partie") return;
  if (n.takt) { clearInterval(n.takt); n.takt = null; return schNsZeigen(); }
  if (n.i >= n.e.zuege.length) n.i = 0;
  n.takt = setInterval(() => { if (SCH_NS !== n || aktuelleAnsicht !== "spiele") return clearInterval(n.takt); schNsGehe(n.i + 1); }, 1400);
  schNsGehe(n.i + 1);
}

// ---------- KC-CLUB-BAUERNSKAT (2.9.0, Wunsch Hansi – Stufe 3 der Spiele): Bauernskat – Köcheclub Edition ----------
// Regeln nach Hansi: 2 Spieler, 32 Karten. Jeder: 8 Karten auf der Hand + 4 „Bauern“ auf dem Tisch (je 1 verdeckt, 1 offen darauf).
// Vorhand sieht die offenen Bauern + die ersten 4 Handkarten und sagt Trumpf an (Farbe oder Grand = nur Buben), bekommt dann den
// Rest und spielt aus. Buben höchste Trümpfe (♣ ♠ ♥ ♦), dann Trumpffarbe A 10 K D 9 8 7. Bedienpflicht; wer nicht bedienen kann,
// darf stechen oder abwerfen. Wird ein offener Bauer gespielt, wird die Karte darunter sofort aufgedeckt. Ansager braucht 61 Augen
// (60 : 60 gewinnt der Gegner). Gespielt werden kann jede Handkarte und jeder offene Bauer.
const BSK_FARBEN = ["kr", "pi", "he", "ka"], BSK_WERTE = ["A", "10", "K", "D", "B", "9", "8", "7"];
const BSK_SYM = { kr: "♣", pi: "♠", he: "♥", ka: "♦" }, BSK_FNAME = { kr: "Kreuz", pi: "Pik", he: "Herz", ka: "Karo", grand: "Grand" };
const BSK_AUGEN = { A: 11, "10": 10, K: 4, D: 3, B: 2, "9": 0, "8": 0, "7": 0 };
const bskKarte = (k) => ({ f: k.split("-")[0], w: k.split("-")[1] });
const bskAugen = (k) => BSK_AUGEN[bskKarte(k).w];
const bskTrumpf = (k, t) => { const c = bskKarte(k); return c.w === "B" || (t !== "grand" && c.f === t); };
const bskFarbe = (k, t) => (bskTrumpf(k, t) ? "T" : bskKarte(k).f); // „Farbe“ zum Bedienen (Trumpf = eigene Farbe)
function bskRang(k, t) { // größer = stärker; Trümpfe über allem
  const c = bskKarte(k);
  if (c.w === "B") return 200 + (3 - BSK_FARBEN.indexOf(c.f));
  if (bskTrumpf(k, t)) return 100 + (7 - ["A", "10", "K", "D", "9", "8", "7"].indexOf(c.w));
  return 7 - ["A", "10", "K", "D", "9", "8", "7"].indexOf(c.w);
}
function bskStichGewinner(stich, t) { // stich = [{s, k}, {s, k}] – erste Karte ist ausgespielt
  const [a, b] = stich, fa = bskFarbe(a.k, t), fb = bskFarbe(b.k, t);
  if (fb === fa) return bskRang(b.k, t) > bskRang(a.k, t) ? b.s : a.s;
  return fb === "T" ? b.s : a.s;
}
function bskMischen() { const d = []; for (const f of BSK_FARBEN) for (const w of BSK_WERTE) d.push(f + "-" + w);
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }
// KC-CLUB-BAUERNSKAT-AUSTEILEN (2.24.9, Regeln nach Hansi): keine Handkarten – jeder hat 8 Häufchen (verdeckt, offen darauf).
// Ausgeteilt wird in Viererpäckchen, zuerst an Vorhand (wer nicht gibt): 4 verdeckt Vorhand, 4 verdeckt Geber, noch einmal je 4
// verdeckt, dann je 4 offen, noch einmal je 4 offen. Vorhand sagt Trumpf an (Pflicht) und spielt aus; wer gibt, wechselt jedes Spiel.
// Laufende Partien von vorher (8 Handkarten + 4 Häufchen) spielen mit denselben Regeln zu Ende – die Funktionen kennen beides.
const BSK_AUSTEILEN = [["unten", 0], ["unten", 4], ["oben", 0], ["oben", 4]];
function bskNeu(vorhand) { // Spieler 0 = ich, 1 = Gegner
  const d = bskMischen(), sp = [0, 1].map(() => ({ hand: [], tisch: Array.from({ length: 8 }, () => ({ unten: null, oben: null })) }));
  let i = 0;
  for (const [lage, ab] of BSK_AUSTEILEN) for (const s of [vorhand, 1 - vorhand]) for (let j = 0; j < 4; j++) sp[s].tisch[ab + j][lage] = d[i++];
  return { sp, vorhand, trumpf: null, phase: "ansage", amZug: vorhand, stich: [], stiche: [[], []], letzter: null };
}
const bskSichtbarAnsage = (z, s) => [...z.sp[s].tisch.map((p) => p.oben).filter(Boolean), ...z.sp[s].hand.slice(0, 4)]; // was Vorhand vor der Ansage sieht
const bskVerfuegbar = (z, s) => [...z.sp[s].hand, ...z.sp[s].tisch.map((p) => p.oben).filter(Boolean)];
function bskErlaubt(z, s) {
  const alle = bskVerfuegbar(z, s); if (!z.stich.length) return alle;
  const f = bskFarbe(z.stich[0].k, z.trumpf), bed = alle.filter((k) => bskFarbe(k, z.trumpf) === f);
  return bed.length ? bed : alle;
}
function bskSpielen(z, s, k) { // spielt Karte k von Spieler s; gibt true zurück, wenn der Stich voll ist
  const p = z.sp[s], hi = p.hand.indexOf(k);
  if (hi >= 0) p.hand.splice(hi, 1);
  else { const t = p.tisch.find((x) => x.oben === k); if (!t) throw new Error("Karte nicht vorhanden"); t.oben = t.unten; t.unten = null; } // Bauer aufdecken
  z.stich.push({ s, k }); z.amZug = 1 - s;
  return z.stich.length === 2;
}
function bskStichAbschliessen(z) {
  const g = bskStichGewinner(z.stich, z.trumpf); z.stiche[g].push(...z.stich.map((x) => x.k)); z.letzter = { stich: z.stich, gewinner: g }; z.stich = []; z.amZug = g;
  if (!bskVerfuegbar(z, 0).length && !bskVerfuegbar(z, 1).length) z.phase = "ende";
}
const bskSumme = (l) => l.reduce((a, k) => a + bskAugen(k), 0);
function bskErgebnis(z) { const a = z.vorhand, aug = [bskSumme(z.stiche[0]), bskSumme(z.stiche[1])]; return { augen: aug, ansager: a, gewinner: aug[a] >= 61 ? a : 1 - a }; }
// ----- Computer -----
// KC-CLUB-SPIEL-ANSAGE (2.22.16): Karten in Worten
const BSK_WNAME = { A: "Ass", 10: "Zehn", K: "König", D: "Dame", B: "Bube", 9: "Neun", 8: "Acht", 7: "Sieben" };
const bskKarteWort = (k) => { const c = { f: k.split("-")[0], w: k.split("-")[1] }; return `${BSK_FNAME[c.f]} ${BSK_WNAME[c.w]}`; };
const bskTrumpfWort = (t) => (t === "grand" ? "Grand, nur Buben sind Trumpf" : `${BSK_FNAME[t]} ist Trumpf`);
function bskStichWort(z, er) { // nach einem vollen Stich (z.letzter)
  const l = z.letzter; if (!l) return "";
  const augen = l.stich.reduce((a, x) => a + bskAugen(x.k), 0);
  return `${l.gewinner === 0 ? "Du bekommst" : er + " bekommt"} den Stich${augen ? `, ${augen} Augen` : ""}.`;
}
function bskAnsageWahl(karten) { // wählt Trumpf nach Stärke der sichtbaren Karten
  const buben = karten.filter((k) => bskKarte(k).w === "B").length;
  let best = "grand", wert = buben >= 3 ? buben * 4 + karten.filter((k) => bskKarte(k).w === "A").length * 2 : -1;
  for (const f of BSK_FARBEN) { const t = karten.filter((k) => bskTrumpf(k, f)); const w = t.length * 3 + buben * 2 + t.reduce((a, k) => a + (bskAugen(k) >= 10 ? 2 : 0), 0);
    if (w > wert) { wert = w; best = f; } }
  return best;
}
function bskZugHeuristik(z, s) {
  const erl = bskErlaubt(z, s), t = z.trumpf, billig = (l) => [...l].sort((a, b) => bskAugen(a) - bskAugen(b) || bskRang(a, t) - bskRang(b, t))[0];
  if (!z.stich.length) { // ausspielen: Ass in Fehlfarbe, sonst niedrige Fehlfarbe, sonst kleiner Trumpf
    const asse = erl.filter((k) => !bskTrumpf(k, t) && bskKarte(k).w === "A"); if (asse.length) return asse[0];
    const fehl = erl.filter((k) => !bskTrumpf(k, t) && bskAugen(k) === 0); if (fehl.length) return fehl[0];
    const trumpf = erl.filter((k) => bskTrumpf(k, t)); if (trumpf.length >= 4) return [...trumpf].sort((a, b) => bskRang(b, t) - bskRang(a, t))[0];
    return billig(erl);
  }
  const vorn = z.stich[0], gewinnt = erl.filter((k) => bskStichGewinner([vorn, { s, k }], t) === s);
  const wertImStich = bskAugen(vorn.k);
  if (gewinnt.length) { // mit der billigsten Siegkarte stechen, wenn es sich lohnt – oder ohne Verlust geht
    const sieg = [...gewinnt].sort((a, b) => (bskTrumpf(a, t) - bskTrumpf(b, t)) || bskRang(a, t) - bskRang(b, t));
    const kein = sieg.find((k) => !bskTrumpf(k, t)); if (kein) return [...gewinnt.filter((k) => !bskTrumpf(k, t))].sort((a, b) => bskAugen(b) - bskAugen(a))[0]; // in Farbe: hoch drüber, Augen mitnehmen
    if (wertImStich >= 4) return sieg[0];
  }
  return billig(erl);
}
function bskZugComputer(z, s, staerke) {
  const erl = bskErlaubt(z, s);
  if (staerke === "leicht" && Math.random() < 0.5) return erl[Math.floor(Math.random() * erl.length)];
  if (staerke !== "schwer" || erl.length === 1) return bskZugHeuristik(z, s);
  // schwer: jede erlaubte Karte mit vielen zufälligen Verteilungen der unbekannten Karten zu Ende spielen (Heuristik) – beste Durchschnitts-Augen
  const bekannt = new Set([...bskVerfuegbar(z, s), ...z.stiche[0], ...z.stiche[1], ...z.stich.map((x) => x.k), ...bskVerfuegbar(z, 1 - s).filter((k) => !z.sp[1 - s].hand.includes(k))]);
  const unbekannt = []; for (const f of BSK_FARBEN) for (const w of BSK_WERTE) { const k = f + "-" + w; if (!bekannt.has(k)) unbekannt.push(k); }
  let best = null, bestW = -Infinity;
  for (const k of erl) {
    let summe = 0;
    for (let n = 0; n < 24; n++) {
      const kopie = JSON.parse(JSON.stringify(z)), u = [...unbekannt].sort(() => Math.random() - 0.5);
      const g = kopie.sp[1 - s]; let i = 0; g.hand = g.hand.map(() => u[i++]); g.tisch.forEach((p) => { if (p.unten) p.unten = u[i++] ?? p.unten; }); kopie.sp[s].tisch.forEach((p) => { if (p.unten) p.unten = u[i++] ?? p.unten; });
      if (bskSpielen(kopie, s, k)) bskStichAbschliessen(kopie);
      let schutz = 40; while (kopie.phase !== "ende" && schutz--) { const wer = kopie.amZug; if (bskSpielen(kopie, wer, bskZugHeuristik(kopie, wer))) bskStichAbschliessen(kopie); }
      summe += bskSumme(kopie.stiche[s]) - bskSumme(kopie.stiche[1 - s]);
    }
    if (summe > bestW) { bestW = summe; best = k; }
  }
  return best;
}
// ----- Ansicht (gegen den Computer) -----
const BSK_KEY = "kc_club_bauernskat_pc";
let BSK = (() => { let w = null; try { w = JSON.parse(localStorage.getItem(BSK_KEY) || "null"); } catch {}
  return { staerke: "mittel", stand: { ich: 0, pc: 0 }, runde: 0, z: null, ...(w || {}), denkt: false, gewertet: w?.gewertet || false }; })();
const bskMerken = () => { try { localStorage.setItem(BSK_KEY, JSON.stringify({ staerke: BSK.staerke, stand: BSK.stand, runde: BSK.runde, z: BSK.z, gewertet: BSK.gewertet })); } catch {} };
// 2.9.2 (Wunsch Hansi: „wie richtige Karten nach französischem Blatt“): Eckzeichen oben links + unten rechts (gedreht),
// Zahlenkarten mit klassisch angeordneten Symbolen (untere Hälfte auf dem Kopf), Ass mit großem Symbol, Bildkarten mit Rahmen
// und Figur – Köcheclub Edition: der Bube ist ein Koch 👨‍🍳, Dame 👸, König 🤴.
const BSK_BILD = {
  "7": [[25, 8], [75, 8], [50, 29], [25, 50], [75, 50], [25, 92], [75, 92]],
  "8": [[25, 8], [75, 8], [50, 29], [25, 50], [75, 50], [50, 71], [25, 92], [75, 92]],
  "9": [[25, 8], [75, 8], [25, 36], [75, 36], [50, 50], [25, 64], [75, 64], [25, 92], [75, 92]],
  "10": [[25, 8], [75, 8], [50, 22], [25, 36], [75, 36], [25, 64], [75, 64], [50, 78], [25, 92], [75, 92]],
};
const BSK_FIGUR = { B: "👨‍🍳", D: "👸", K: "🤴" };
function bskKartenbild(c) {
  const sym = BSK_SYM[c.f], ecke = (u) => `<span class="bsk-ecke${u ? " unten" : ""}"><b>${c.w}</b><i>${sym}</i></span>`;
  let mitte;
  if (c.w === "A") mitte = `<span class="bsk-mitte-ass">${sym}</span>`;
  else if (BSK_FIGUR[c.w]) mitte = `<span class="bsk-bild"><span class="bsk-figur">${BSK_FIGUR[c.w]}</span><span class="bsk-bild-sym">${sym}</span></span>`;
  else mitte = `<span class="bsk-pips">${BSK_BILD[c.w].map(([x, y]) => `<i style="left:${x}%;top:${y}%"${y > 50 ? ' class="kopf"' : ""}>${sym}</i>`).join("")}</span>`;
  return ecke(false) + mitte + ecke(true);
}
// KC-CLUB-KARTEN-ECHT (2.9.3, Wunsch Hansi „noch näher am Original“): Kartenbilder einmal vorladen, damit beim Spielen nichts nachlädt
let bskBilderGeladen = false;
function bskBilderVorladen() { if (bskBilderGeladen) return; bskBilderGeladen = true; for (const f of BSK_FARBEN) for (const w of BSK_WERTE) { const i = new Image(); i.src = `lib/karten/${f}-${w}.svg?v=1`; } }
function bskKarteHtml(k, { klick = "", aus = false, klein = false, verdeckt = false, trumpf = null, blass = false } = {}) {
  if (verdeckt) return `<span class="bsk-karte rueck${klein ? " klein" : ""}" aria-label="verdeckte Karte"></span>`;
  const c = bskKarte(k), rot = c.f === "he" || c.f === "ka", tr = trumpf && bskTrumpf(k, trumpf);
  // 2.9.3: echtes Kartenbild (französisches Blatt, CC0, lib/karten) über der gezeichneten Karte – fehlt das Bild (offline), bleibt die gezeichnete
  const inhalt = bskKartenbild(c) + `<img class="bsk-bildkarte" src="lib/karten/${k}.svg?v=1" alt="" draggable="false" onerror="this.remove()">`;
  return klick ? `<button class="bsk-karte${rot ? " rot" : ""}${klein ? " klein" : ""}${tr ? " trumpf" : ""}" ${aus ? "disabled" : ""} onclick="${klick}('${k}')" aria-label="${BSK_FNAME[c.f]} ${c.w}${tr ? ", Trumpf" : ""}">${inhalt}</button>`
    : `<span class="bsk-karte${rot ? " rot" : ""}${klein ? " klein" : ""}${tr ? " trumpf" : ""}${blass ? " blass" : ""}" aria-label="${BSK_FNAME[c.f]} ${c.w}${blass ? " (jetzt nicht spielbar)" : ""}">${inhalt}</span>`;
}
const bskSort = (l, t) => [...l].sort((a, b) => { const fa = bskFarbe(a, t || "kr"), fb = bskFarbe(b, t || "kr"); return fa === fb ? bskRang(b, t || "kr") - bskRang(a, t || "kr") : (fa === "T" ? -1 : fb === "T" ? 1 : BSK_FARBEN.indexOf(fa) - BSK_FARBEN.indexOf(fb)); });
function bskTischHtml(z, s, { klick = "", erlaubt = [], aus = false, ichDran = false } = {}) {
  return `<div class="bsk-tisch">${z.sp[s].tisch.map((p) => `<div class="bsk-stapel${p.unten ? " mit-unten" : ""}">${p.unten ? bskKarteHtml(null, { verdeckt: true, klein: true }) : ""}${p.oben ? bskKarteHtml(p.oben, { klick: klick && erlaubt.includes(p.oben) ? klick : "", aus, trumpf: z.trumpf, blass: ichDran && !erlaubt.includes(p.oben) }) : '<span class="bsk-leer"></span>'}</div>`).join("")}</div>`;
}
// 2.62.0 (Wunsch Hansi): Trumpfwahl erscheint im grünen Spielbereich (statt oben) und verschwindet nach der Wahl
const bskAnsageKnoepfe = (fn) => `<div class="bsk-ansage bsk-ansage-tisch" role="group" aria-label="Trumpf wählen"><b>Was ist Trumpf?</b>${BSK_FARBEN.map((f) => `<button class="${f === "he" || f === "ka" ? "rot" : ""}" onclick="${fn}('${f}')">${BSK_SYM[f]}<small>${BSK_FNAME[f]}</small></button>`).join("")}<button onclick="${fn}('grand')">🃏<small>Grand</small></button></div>`;
function bskBrettHtml(z, ich, { klick, aus, gegnerName, ansageSicht, ansageKlick }) {
  const er = 1 - ich, erl = !aus && z.phase === "spiel" && z.amZug === ich ? bskErlaubt(z, ich) : [];
  const hand = ansageSicht ? z.sp[ich].hand.slice(0, 4) : bskSort(z.sp[ich].hand, z.trumpf), mitHand = z.sp[ich].hand.length > 0 || z.sp[er].hand.length > 0; // 2.24.9: neue Partien ohne Hand
  const rest = (s) => z.sp[s].hand.length + z.sp[s].tisch.reduce((a, p) => a + (p.oben ? 1 : 0) + (p.unten ? 1 : 0), 0);
  const aug = [bskSumme(z.stiche[0]), bskSumme(z.stiche[1])];
  const stich = z.stich.length ? z.stich : z.letzterZeigen ? z.letzter?.stich || [] : [];
  return `<div class="bsk">
    <div class="bsk-kopf"><span>${esc(gegnerName)} · ${mitHand ? z.sp[er].hand.length + " Handkarten" : rest(er) + " Karten"}</span><span>Augen: <b>${aug[er]}</b></span></div>
    ${bskTischHtml(z, er)}
    <div class="bsk-mitte"><div class="bsk-trumpf">${z.trumpf ? `Trumpf<br><b>${z.trumpf === "grand" ? "Grand<br><small>nur Buben</small>" : BSK_SYM[z.trumpf] + " " + BSK_FNAME[z.trumpf]}</b>` : "Trumpf<br><b>?</b>"}<br><small>Ansager: ${z.vorhand === ich ? "Du" : esc(gegnerName)}</small></div>
      ${ansageKlick && z.phase === "ansage" ? bskAnsageKnoepfe(ansageKlick) : `<div class="bsk-stich">${stich.map((x) => `<div class="bsk-stich-karte ${x.s === ich ? "ich" : "er"}">${bskKarteHtml(x.k, { trumpf: z.trumpf })}</div>`).join("") || '<span class="hinweis">Stich</span>'}</div>`}
      ${!z.stich.length && stich.length ? `<div class="bsk-letzter">Letzter Stich – ${z.letzter.gewinner === ich ? "an dich" : "an " + esc(gegnerName)}</div>` : ""}</div>
    ${bskTischHtml(z, ich, { klick, erlaubt: erl, aus, ichDran: erl.length > 0 })}
    ${mitHand ? `<div class="bsk-hand">${hand.map((k) => bskKarteHtml(k, { klick: erl.includes(k) ? klick : "", trumpf: z.trumpf, blass: erl.length > 0 && !erl.includes(k) })).join("")}${ansageSicht && z.sp[ich].hand.length ? '<span class="bsk-karte rueck"></span>'.repeat(4) : ""}</div>` : ""}
    <div class="bsk-kopf"><span>Du</span><span>Augen: <b>${aug[ich]}</b></span></div>
  </div>`;
}
// KC-CLUB-BAUERNSKAT-AUSTEILEN (2.24.9, Wunsch Hansi „vorher das Mischen, dann das Ausgeben an beide – aber schnell“):
// neues Spiel → Stapel in der Mitte wird gemischt (0,7 s), dann fliegen die Viererpäckchen in der echten Reihenfolge an ihren Platz
// (BSK_AUSTEILEN, erst Vorhand). Ein Tipp auf den Tisch = sofort fertig. Mit „✨ Animierte Knöpfe“ aus: Karten liegen gleich da.
let BSK_TEILT = null;
function bskTeilenEnde() {
  const t = BSK_TEILT; if (!t) return; BSK_TEILT = null; t.zeiten.forEach(clearTimeout);
  t.wurzel.querySelectorAll(".bsk-warte, .bsk-flug").forEach((e) => e.classList.remove("bsk-warte", "bsk-flug"));
  t.wurzel.querySelector(".bsk-mischen")?.remove(); t.wurzel.classList.remove("bsk-teilt"); t.fertig?.();
}
function bskAusteilen(wurzel, z, ich, fertig) {
  bskTeilenEnde();
  const tische = wurzel?.querySelectorAll(".bsk-tisch");
  if (!wurzel || tische?.length !== 2 || !einst("animiert", true)) return fertig?.();
  const seite = { [1 - ich]: tische[0], [ich]: tische[1] }, karte = (s, j, lage) => { const st = seite[s].children[j]; return !st ? null : lage === "unten" ? st.querySelector(".rueck.klein") : st.lastElementChild; };
  const mitte = wurzel.querySelector(".bsk-mitte"), m = document.createElement("div"); m.className = "bsk-mischen"; m.setAttribute("aria-hidden", "true");
  m.innerHTML = '<span class="bsk-karte rueck"></span>'.repeat(5); (mitte || wurzel).appendChild(m);
  const pakete = []; for (const [lage, ab] of BSK_AUSTEILEN) for (const s of [z.vorhand, 1 - z.vorhand]) pakete.push([0, 1, 2, 3].map((j) => karte(s, ab + j, lage)).filter(Boolean));
  pakete.flat().forEach((e) => e.classList.add("bsk-warte"));
  wurzel.classList.add("bsk-teilt");
  BSK_TEILT = { wurzel, fertig, zeiten: [] };
  const MISCHEN = 700, TAKT = 170, FLUG = 300;
  pakete.forEach((paket, n) => BSK_TEILT.zeiten.push(setTimeout(() => {
    const q = m.getBoundingClientRect();
    paket.forEach((e) => { const r = e.getBoundingClientRect(); e.style.setProperty("--dx", `${q.left + q.width / 2 - (r.left + r.width / 2)}px`); e.style.setProperty("--dy", `${q.top + q.height / 2 - (r.top + r.height / 2)}px`);
      e.classList.remove("bsk-warte"); e.classList.add("bsk-flug"); });
  }, MISCHEN + n * TAKT)));
  BSK_TEILT.zeiten.push(setTimeout(bskTeilenEnde, MISCHEN + pakete.length * TAKT + FLUG));
  wurzel.addEventListener("click", bskTeilenEnde, { once: true, capture: true });
}
function bskPcZeigen() {
  bskBilderVorladen(); bskTeilenEnde(); // 2.24.9: neu gezeichnet → Austeilen sofort fertig
  if (!BSK.z) bskPcNeu(false);
  if (!BSK.denkt && BSK.z && ((BSK.z.phase === "spiel" && BSK.z.amZug === 1 && BSK.z.stich.length < 2) || (BSK.z.phase === "ansage" && BSK.z.vorhand === 1)) && !bskPcZeigen.laeuft) { bskPcZeigen.laeuft = true; setTimeout(() => { bskPcZeigen.laeuft = false; bskPcComputer(); }, 700); }
  const z = BSK.z, s = BSK.stand;
  let status;
  if (z.phase === "ansage") status = z.vorhand === 0 ? `<div class="sp-status sp-ichdran">Du bist Vorhand – wähle unten auf dem grünen Tisch, was Trumpf ist</div>` : `<div class="sp-status">🤖 Der Computer überlegt, was Trumpf wird …</div>`;
  else if (z.phase === "ende") { const e = bskErgebnis(z), ich = e.gewinner === 0;
    status = `<div class="sp-banner ${ich ? "sieg" : "niederlage"}">${ich ? "🏆 Du hast gewonnen!" : "🤖 Der Computer hat gewonnen"}<br><small>${e.augen[0]} : ${e.augen[1]} Augen · ${e.ansager === 0 ? "du hast" : "der Computer hat"} angesagt – ${e.augen[e.ansager] >= 61 ? "61 geschafft" : "unter 61 geblieben"}</small></div>`; }
  else status = `<div class="sp-status${z.amZug === 0 ? " sp-ichdran" : ""}">${BSK.denkt || z.amZug === 1 ? "🤖 Der Computer ist dran …" : z.stich.length ? "Du bist dran – bedienen, wenn du kannst" : "Du spielst aus"}</div>`;
  $("spInhalt").innerHTML = `<div class="karte sp-karte">
      ${spWahl("Stärke", BSK.staerke, [["leicht", "😊 Leicht"], ["mittel", "🙂 Mittel"], ["schwer", "😎 Schwer"]], "bskPcStaerke")}
      <div class="sp-stand"><span>Du <b>${s.ich}</b></span><span><b>${s.pc}</b> Computer</span></div>
      ${status}
      ${bskBrettHtml(z, 0, { klick: "bskPcKarte", aus: BSK.denkt || z.phase !== "spiel" || z.amZug !== 0, gegnerName: "Computer", ansageSicht: z.phase === "ansage", ansageKlick: z.phase === "ansage" && z.vorhand === 0 ? "bskPcAnsage" : "" })}
      ${spLeiste(spNeuKnopf("bskPcNeu()"), spAbbrechenKnopf("spPcAbbrechen()"), schTonKnopf(), spAnsageKnopf("bsk"), spStandKnopf("bskPcStandWeg()"))}
      <details class="sch-verlauf"><summary>📖 Regeln kurz</summary><p class="hinweis" style="margin:4px 0">Jeder hat 8 Häufchen auf dem Tisch: unten verdeckt, oben offen. Ausgeteilt wird in Viererpäckchen – je zweimal verdeckt, dann zweimal offen; wer gibt, wechselt. Vorhand sieht ihre offenen Karten und muss Trumpf ansagen – eine Farbe oder Grand (nur Buben), dann spielt sie aus. Gespielt wird immer eine offene Karte; die Karte darunter wird sofort aufgedeckt. Buben sind die höchsten Trümpfe (♣ ♠ ♥ ♦), dann Ass, Zehn, König, Dame, 9, 8, 7. Farbe bedienen, wenn möglich – sonst stechen oder abwerfen. Der Ansager braucht 61 Augen (Ass 11, Zehn 10, König 4, Dame 3, Bube 2).</p></details>
    </div>`;
  if (BSK.teilen) { BSK.teilen = false; bskAusteilen($("spInhalt").querySelector(".bsk"), z, 0); } // KC-CLUB-BAUERNSKAT-AUSTEILEN
}
async function bskPcNeu(fragen = true) {
  if (fragen && BSK.z && BSK.z.phase === "spiel" && (BSK.z.stiche[0].length + BSK.z.stiche[1].length) > 0 && !(await frage("Neues Spiel beginnen? Das laufende Spiel wird nicht gewertet.", { ja: "↺ Neues Spiel", nein: "Weiterspielen" }))) return;
  BSK.runde = (BSK.runde || 0) + 1; BSK.z = bskNeu(BSK.runde % 2 ? 0 : 1); BSK.gewertet = false; BSK.denkt = false; BSK.teilen = true; bskMerken(); // Geber wechselt jedes Spiel
  if (fragen !== false || aktuelleAnsicht === "spiele") bskPcZeigen();
  if (BSK.z.vorhand === 1) setTimeout(bskPcComputer, 700);
}
const bskPcStaerke = (w) => { BSK.staerke = ["leicht", "mittel", "schwer"].includes(w) ? w : "mittel"; bskMerken(); bskPcZeigen(); };
async function bskPcStandWeg() { if (!(await frage("Spielstand Bauernskat auf 0 : 0 zurücksetzen?", { ja: "🗑️ Zurücksetzen", nein: "Abbrechen" }))) return; BSK.stand = { ich: 0, pc: 0 }; bskMerken(); bskPcZeigen(); }
function bskPcAnsage(t) { const z = BSK.z; if (z.phase !== "ansage" || z.vorhand !== 0) return; spSag("bsk", `Du sagst an: ${bskTrumpfWort(t)}.`, null, true); z.trumpf = t; z.phase = "spiel"; z.amZug = 0; bskMerken(); melde(`Trumpf: ${t === "grand" ? "Grand – nur Buben" : BSK_SYM[t] + " " + BSK_FNAME[t]}`); bskPcZeigen(); }
function bskPcWerten() { const z = BSK.z; if (z.phase !== "ende" || BSK.gewertet) return; BSK.gewertet = true; const e = bskErgebnis(z);
  spSag("bsk", `Spiel vorbei. ${e.augen[0]} zu ${e.augen[1]} Augen. ${e.gewinner === 0 ? "Du hast gewonnen!" : "Der Computer hat gewonnen."}`); /* KC-CLUB-SPIEL-ANSAGE */ if (e.gewinner === 0) BSK.stand.ich++; else BSK.stand.pc++; spEndeTon(e.gewinner === 0); try { navigator.vibrate?.(e.gewinner === 0 ? [60, 40, 60] : 40); } catch {} }
const bskZeichnen = () => { if (aktuelleAnsicht === "spiele" && SP.tab === "pc" && SP.art === "bsk") bskPcZeigen(); }; // nur, wenn Bauernskat gerade sichtbar ist
function bskPcNachStich(voll) {
  const z = BSK.z;
  if (voll) { z.letzterZeigen = true; bskMerken(); bskZeichnen(); BSK.denkt = true;
    setTimeout(() => { bskStichAbschliessen(z); spTon("stich"); z.letzterZeigen = false; BSK.denkt = false; spSag("bsk", bskStichWort(z, "Der Computer")); bskPcWerten(); bskMerken(); bskZeichnen(); if (z.phase === "spiel" && z.amZug === 1) setTimeout(bskPcComputer, 500); }, 1100);
    return; }
  bskMerken(); bskZeichnen(); if (z.amZug === 1) setTimeout(bskPcComputer, 600);
}
function bskPcKarte(k) {
  const z = BSK.z; if (BSK.denkt || z.phase !== "spiel" || z.amZug !== 0 || !bskErlaubt(z, 0).includes(k)) return;
  spTon("karte"); bskPcNachStich(bskSpielen(z, 0, k));
}
function bskPcComputer() {
  if (spPauseHalt(bskPcComputer)) return; // 2.18.0: Pause
  const z = BSK.z; if (!z || aktuelleAnsicht !== "spiele" || SP.art !== "bsk") return; // weiter, sobald Bauernskat wieder offen ist (siehe bskPcZeigen)
  if (BSK_TEILT) return setTimeout(bskPcComputer, 300); // 2.24.9: erst fertig austeilen
  if (z.phase === "ansage" && z.vorhand === 1) { z.trumpf = bskAnsageWahl(bskSichtbarAnsage(z, 1)); z.phase = "spiel"; z.amZug = 1; bskMerken();
    melde(`🤖 Der Computer sagt an: ${z.trumpf === "grand" ? "Grand – nur Buben" : BSK_SYM[z.trumpf] + " " + BSK_FNAME[z.trumpf]}`); spSag("bsk", `Der Computer sagt an: ${bskTrumpfWort(z.trumpf)}.`); bskZeichnen(); setTimeout(bskPcComputer, 800); return; }
  if (z.phase !== "spiel" || z.amZug !== 1) return;
  const kc = bskZugComputer(z, 1, BSK.staerke); spSag("bsk", `Der Computer spielt ${bskKarteWort(kc)}.`); // KC-CLUB-SPIEL-ANSAGE
  spTon("gegner"); bskPcNachStich(bskSpielen(z, 1, kc));
}
// ----- KC-CLUB-BAUERNSKAT-MG (2.10.0, Wunsch Hansi): gegen ein Mitglied -----
// Der Server mischt und hält die verdeckten Karten; die App bekommt nur ihre eigene Sicht (ich = Spieler 0) und zeichnet sie mit
// derselben Tischansicht wie gegen den Computer. Jede Karte prüft der Server nach denselben Regeln (wörtliche Kopie, bauernskat.js).
const BSK_GESEHEN = new Map(); // KC-CLUB-SPIEL-ANSAGE: was je Partie schon angesagt ist
function bskMgAnsagen(g, z) {
  const er = g.gegner.vorname, alt = BSK_GESEHEN.get(g.id), neu = { zuege: g.zuege, trumpf: z.trumpf, letzter: JSON.stringify(z.letzter || null), stich: JSON.stringify(z.stich || []) };
  BSK_GESEHEN.set(g.id, neu);
  if (alt && alt.zuege !== g.zuege) spTon(g.status === "beendet" ? (g.ergebnis === "gewonnen" ? "sieg" : g.ergebnis === "verloren" ? "niederlage" : "remis") : "karte"); // KC-CLUB-SPIELE-LEISTE
  if (!alt || alt.zuege === g.zuege || !spAnsageAn("bsk")) return; // erster Blick: nichts Altes vorlesen
  const teile = [];
  if (!alt.trumpf && z.trumpf && z.vorhand === 1) teile.push(`${er} sagt an: ${bskTrumpfWort(z.trumpf)}.`);
  if (neu.letzter !== alt.letzter && z.letzter) { const seine = z.letzter.stich.find((x) => x.s === 1); if (seine && !JSON.parse(alt.stich).some((x) => x.s === 1 && x.k === seine.k)) teile.push(`${er} spielt ${bskKarteWort(seine.k)}.`); teile.push(bskStichWort(z, er)); }
  const offen = (z.stich || []).find((x) => x.s === 1); if (offen && neu.stich !== alt.stich) teile.push(`${er} spielt ${bskKarteWort(offen.k)}.`);
  if (g.status === "beendet" && !g.aufgegeben) teile.push(g.ergebnis === "gewonnen" ? "Du hast gewonnen!" : `${er} hat gewonnen.`);
  if (teile.length) spSag("bsk", teile.join(" "), `bsk:${g.id}:${g.zuege}`);
}
function bskSpielZeigen(g) {
  bskTeilenEnde(); // 2.24.9
  bskBilderVorladen();
  const z = g.bsk, er = esc(g.gegner.vorname);
  if (z) bskMgAnsagen(g, z); // KC-CLUB-SPIEL-ANSAGE
  if (!z) { $("spInhalt").innerHTML = '<div class="karte hinweis">Spielstand fehlt – bitte „‹ Übersicht“ und neu öffnen.</div>'; return; }
  let status;
  if (g.status === "beendet") {
    const a = [bskSumme(z.stiche[0]), bskSumme(z.stiche[1])], ansagerIch = z.vorhand === 0;
    const zeile = g.aufgegeben ? "" : `<br><small>${a[0]} : ${a[1]} Augen · ${ansagerIch ? "du hast" : er + " hat"} angesagt – ${a[z.vorhand] >= 61 ? "61 geschafft" : "unter 61 geblieben"}</small>`;
    status = g.ergebnis === "gewonnen" ? `<div class="sp-banner sieg">🏆 ${g.aufgegeben ? `${er} hat aufgegeben – du hast gewonnen!` : "Du hast gewonnen!"}${zeile}</div>`
      : `<div class="sp-banner niederlage">${g.aufgegeben ? "Du hast aufgegeben." : `${er} hat gewonnen.`}${zeile}</div>`;
  } else if (g.status === "angefragt") status = `<div class="sp-status">⏳ Warte, bis ${er} annimmt …</div>`;
  else if (g.status !== "laeuft") status = `<div class="sp-status">Diese Partie findet nicht statt.</div>`;
  else if (z.phase === "ansage") status = g.ichDran ? `<div class="sp-status sp-ichdran">Du bist Vorhand – wähle unten auf dem grünen Tisch, was Trumpf ist</div>`
    : `<div class="sp-status">${er} ist Vorhand und sagt Trumpf an …</div>`;
  else status = `<div class="sp-status${g.ichDran ? " sp-ichdran" : ""}">${g.ichDran ? (z.stich.length ? "Du bist dran – bedienen, wenn du kannst" : "Du spielst aus") : `${er} ist dran …`}</div>`;
  $("spInhalt").innerHTML = `<div class="karte sp-karte">
      <div class="zeile" style="border:none;padding:0"><button class="knopf klein" onclick="SP.offen=null;spZeigen();spLaden(true)">‹ Übersicht</button><b style="flex:1;text-align:right">🃏 Du gegen ${er}</b></div>
      ${status}
      ${spTerminHtml(g)}
      ${bskBrettHtml(z, 0, { klick: "bskMgKarte", aus: !g.ichDran || z.phase !== "spiel", gegnerName: g.gegner.vorname, ansageSicht: z.phase === "ansage", ansageKlick: z.phase === "ansage" && g.ichDran && g.status === "laeuft" ? "bskMgAnsage" : "" })}
      <p class="hinweis" style="text-align:center;margin:6px 0">Karte antippen zum Spielen. Du musst nicht warten – ${er} bekommt Bescheid.</p>
      ${spLeiste(g.status === "beendet" ? spKnopf("↺", "Revanche", `spRevanche('${g.id}')`, { haupt: true }) : g.status === "laeuft" ? spKnopf("🏳️", "Aufgeben", `spAufgeben('${g.id}')`) : "", schTonKnopf(), spAnsageKnopf("bsk"))}
    </div>`;
  // KC-CLUB-BAUERNSKAT-AUSTEILEN (2.24.9): eine neue Partie sieht man einmal mischen und austeilen
  if (g.status === "laeuft" && z.phase === "ansage" && !z.sp[0].hand.length && !BSK_GETEILT.has(g.id)) { BSK_GETEILT.add(g.id); bskAusteilen($("spInhalt").querySelector(".bsk"), z, 0); }
}
const BSK_GETEILT = new Set();
async function bskMgZug(zug) {
  const g = SP.offen; if (!g?.ichDran || SP.sendet) return;
  SP.sendet = true; g.ichDran = false; bskSpielZeigen(g); // sofort sperren (kein Doppeltippen)
  try { SP.offen = (await api("spiel_zug", { id: g.id, zug, zuege: g.zuege })).spiel; }
  catch (e) { meldeFehler(e); try { SP.offen = (await api("spiel_holen", { id: g.id })).spiel; } catch {} }
  finally { SP.sendet = false; }
  if (aktuelleAnsicht === "spiele" && SP.offen) spZeigen();
}
function bskMgAnsage(t) { const z = SP.offen?.bsk; if (z?.phase === "ansage" && z.vorhand === 0) bskMgZug({ ansage: t }); }
function bskMgKarte(k) {
  const g = SP.offen, z = g?.bsk; if (!g?.ichDran || z?.phase !== "spiel" || !bskErlaubt(z, 0).includes(k)) return;
  const p = z.sp[0], hi = p.hand.indexOf(k); // Karte sofort in den Stich legen (der verdeckte Bauer darunter kommt vom Server), Server rechnet ab
  if (hi >= 0) p.hand.splice(hi, 1); else { const t = p.tisch.find((x) => x.oben === k); if (t) t.oben = null; }
  z.stich.push({ s: 0, k }); bskMgZug({ karte: k });
}
async function spEinlAntwort(a) {
  $("spEinlBlatt")?.remove();
  try { if (a === "spaeter") localStorage.setItem(SPE_SPAETER, String(Date.now() + SPE_SPAETER_MS)); else { localStorage.setItem(SPE_TAG, heuteIso()); localStorage.removeItem(SPE_SPAETER); } } catch {}
  if (a === "ja") return spStart();
  if (a === "spaeter") { clearTimeout(spEinlAntwort.t); spEinlAntwort.t = setTimeout(() => spEinladung(), SPE_SPAETER_MS + 1000); return melde("⏰ Gut, ich frage ein andermal"); }
  if (a === "aus") return spEinlSchalter(false);
}
async function spEinlSchalter(an) {
  try { await einstSpeichern("spiel_einladung", { an: !!an }); INIT.einstellungen = { ...(INIT.einstellungen || {}), spiel_einladung: { an: !!an } };
    melde(an ? "🎲 Spiel-Einladung beim Start ist an" : "🚫 Keine Spiel-Einladungen mehr – in ⚙️ Einstellungen wieder einschaltbar"); }
  catch (e) { meldeFehler(e); }
  spEinstZeigen();
}

// ---------- KC-CLUB-MAE (2.26.0, Wunsch Hansi): Mensch ärgere dich nicht – Köcheclub Edition ----------
// Klassische Regeln: 40 Felder Runde, je Farbe 4 Figuren, Haus, Startfeld und 4 Zielfelder. Mit einer 6 muss eine Figur raus (wenn das
// Startfeld frei ist), danach wird nochmal gewürfelt; das Startfeld muss geräumt werden, solange noch Figuren im Haus sind. Wer auf ein
// besetztes Feld kommt, schlägt die fremde Figur zurück ins Haus (eigene Figuren blockieren). Ins Ziel nur genau und ohne eigene Figuren
// im Ziel zu überspringen. Hat jemand keine Figur auf der Runde (alle im Haus bzw. im Ziel aufgerückt), gibt es 3 Versuche für eine 6.
// Gegen den Computer: nur auf dem Gerät. Gegen Mitglieder: der Server würfelt und prüft jeden Zug, freie Farben spielt der Server-Computer.
// Die Regeln unten (MAE_FARBEN … „MAE Regeln Ende“) bekommt der Server als wörtliche Kopie: node tools/mae/server-kopie.mjs
const MAE_FARBEN = ["rot", "blau", "gruen", "gelb"], MAE_FNAME = ["Rot", "Blau", "Grün", "Gelb"];
// Figur-Stand: -1 = im Haus, 0–39 = Schritte ab dem eigenen Startfeld, 40–43 = Zielfelder
const maeFeld = (f, p) => (f * 10 + p) % 40; // Rundenfeld (0–39) einer Figur der Farbe f
function maeNeu(sitze, regel = "erster") { // sitze in Zugreihenfolge: [{ f: 0–3, wer: "ich" | "pc" | person_id }]
  return { sitze: sitze.map((s) => ({ f: s.f, wer: s.wer, fig: [-1, -1, -1, -1] })), dran: 0, wurf: null, versuche: 0, phase: "wuerfeln", sieger: null, platz: [], regel, n: 0, log: [] };
}
function maeBesetzt(z, feld) { // wer steht auf Rundenfeld feld? { s: Sitz, i: Figur } oder null
  for (let s = 0; s < z.sitze.length; s++) { const S = z.sitze[s]; for (let i = 0; i < 4; i++) { const p = S.fig[i]; if (p >= 0 && p < 40 && maeFeld(S.f, p) === feld) return { s, i }; } }
  return null;
}
function maeZiel(z, s, i, w) { // neuer Stand von Figur i (Sitz s) mit Wurf w – oder null, wenn der Zug nicht geht
  const S = z.sitze[s], p = S.fig[i];
  if (p < 0) { if (w !== 6) return null; const b = maeBesetzt(z, maeFeld(S.f, 0)); return b && b.s === s ? null : 0; }
  const q = p + w; if (q > 43) return null;
  if (q >= 40) { for (let k = Math.max(40, p + 1); k <= q; k++) if (S.fig.includes(k)) return null; return q; } // im Ziel nicht überspringen
  const b = maeBesetzt(z, maeFeld(S.f, q)); return b && b.s === s ? null : q;
}
function maeMoeglich(z, s = z.dran, w = z.wurf) { // Figuren, die jetzt ziehen dürfen (Pflichtregeln beachtet)
  if (!w || z.phase === "ende") return [];
  const S = z.sitze[s], alle = [0, 1, 2, 3].filter((i) => maeZiel(z, s, i, w) !== null), imHaus = S.fig.some((p) => p < 0);
  if (w === 6 && imHaus) { const raus = alle.filter((i) => S.fig[i] < 0); if (raus.length) return [raus[0]]; } // 6 → raus ist Pflicht (Haus-Figuren sind gleich)
  const aufStart = S.fig.indexOf(0);
  if (imHaus && aufStart >= 0 && alle.includes(aufStart)) return [aufStart]; // Startfeld räumen ist Pflicht
  return alle;
}
function maeFest(z, s) { // keine Figur auf der Runde, Zielfiguren ganz hinten aufgerückt → 3 Versuche für eine 6
  const f = z.sitze[s].fig; if (f.some((p) => p >= 0 && p < 40)) return false;
  return f.filter((p) => p >= 40).sort((a, b) => b - a).every((p, k) => p === 43 - k);
}
function maeLog(z, e) { z.log.push({ n: ++z.n, ...e }); if (z.log.length > 40) z.log.splice(0, z.log.length - 40); }
function maeWeiter(z, nochmal) { // nächster Wurf: derselbe Sitz (nach einer 6) oder der nächste, der noch spielt
  z.wurf = null; z.phase = "wuerfeln"; z.versuche = 0;
  if (nochmal) return;
  for (let k = 1; k <= z.sitze.length; k++) { const s = (z.dran + k) % z.sitze.length; if (!z.platz.includes(s)) { z.dran = s; return; } }
}
function maeWuerfeln(z, w) { // w = 1–6 (den Zufall liefert der Aufrufer); Ergebnis: erlaubte Figuren ([] = kein Zug)
  if (z.phase !== "wuerfeln" || !(w >= 1 && w <= 6)) return null;
  z.wurf = w; maeLog(z, { t: "wurf", s: z.dran, w });
  const m = maeMoeglich(z);
  if (m.length) { z.phase = "ziehen"; return m; }
  if (maeFest(z, z.dran) && w !== 6 && z.versuche < 2) { const v = z.versuche + 1; z.wurf = null; z.versuche = v; maeLog(z, { t: "nochmal", s: z.dran, v }); return []; }
  maeLog(z, { t: "aus", s: z.dran, w }); maeWeiter(z, w === 6); return [];
}
function maeZiehen(z, i) { // Figur i des Sitzes am Zug ziehen; Ergebnis: Zug-Ereignis oder null (nicht erlaubt)
  if (z.phase !== "ziehen") return null;
  const s = z.dran, S = z.sitze[s], m = maeMoeglich(z);
  if (S.fig[i] < 0 && !m.includes(i)) { const h = m.find((k) => S.fig[k] < 0); if (h !== undefined) i = h; } // Haus: jede Figur gilt
  if (!m.includes(i)) return null;
  const von = S.fig[i], w = z.wurf, nach = maeZiel(z, s, i, w);
  let opfer = null;
  if (nach < 40) { const b = maeBesetzt(z, maeFeld(S.f, nach)); if (b && b.s !== s) { opfer = { s: b.s, i: b.i, p: z.sitze[b.s].fig[b.i] }; z.sitze[b.s].fig[b.i] = -1; } }
  S.fig[i] = nach; maeLog(z, { t: "zug", s, i, von, nach, w, opfer });
  const e = z.log[z.log.length - 1];
  if (S.fig.every((p) => p >= 40)) {
    z.platz.push(s); maeLog(z, { t: "fertig", s, platz: z.platz.length });
    if (z.regel !== "mensch" || S.wer !== "pc") { z.phase = "ende"; z.sieger = s; z.wurf = null; return e; }
    if (z.sitze.every((x, k) => z.platz.includes(k) || x.wer === "pc")) { z.phase = "ende"; z.wurf = null; return e; }
    maeWeiter(z, false); return e;
  }
  maeWeiter(z, w === 6); return e;
}
function maeComputerWahl(z, staerke = "mittel", zufall = Math.random) { // welche Figur zieht der Computer?
  const s = z.dran, m = maeMoeglich(z); if (m.length <= 1) return m[0];
  if (staerke === "leicht" && zufall() < 0.5) return m[Math.floor(zufall() * m.length)];
  const S = z.sitze[s], w = z.wurf, hart = staerke === "schwer";
  const gefahr = (feld) => { // fremde Figuren, die dieses Feld mit einem Wurf erreichen (auch frisch aus dem Haus aufs Startfeld)
    let n = 0;
    for (let t = 0; t < z.sitze.length; t++) { if (t === s) continue; const T = z.sitze[t];
      for (const p of T.fig) if (p >= 0 && p < 40) { const d = (feld - maeFeld(T.f, p) + 40) % 40; if (d >= 1 && d <= 6 && p + d < 40) n++; }
      if (hart && T.fig.some((p) => p < 0) && maeFeld(T.f, 0) === feld) n++; }
    return n; };
  let best = m[0], bw = -1e9;
  for (const i of m) {
    const von = S.fig[i], nach = maeZiel(z, s, i, w); let v = 0;
    if (von < 0) v += 60;
    if (nach >= 40) v += 50 + nach;
    else {
      const b = maeBesetzt(z, maeFeld(S.f, nach)); if (b && b.s !== s) v += 80 + z.sitze[b.s].fig[b.i] / 2; // schlagen – weit gekommene Figuren zuerst
      v -= gefahr(maeFeld(S.f, nach)) * (hart ? 25 : 15);
      if (von >= 0) v += gefahr(maeFeld(S.f, von)) * (hart ? 20 : 10); // aus der Gefahr ziehen
      v += nach * 0.5;
    }
    if (von === 0 && S.fig.some((p) => p < 0)) v += 30;
    v += zufall() * (hart ? 2 : 8);
    if (v > bw) { bw = v; best = i; }
  }
  return best;
}
// ----- MAE Regeln Ende -----
// Spielfeld: 11 × 11 Raster. Runde im Uhrzeigersinn, Rot startet links oben, dann Blau, Grün, Gelb.
const MAE_RUNDE = [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2], [4, 1], [4, 0], [5, 0], [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [10, 5],
  [10, 6], [9, 6], [8, 6], [7, 6], [6, 6], [6, 7], [6, 8], [6, 9], [6, 10], [5, 10], [4, 10], [4, 9], [4, 8], [4, 7], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 5]];
const MAE_ZIEL = [[[1, 5], [2, 5], [3, 5], [4, 5]], [[5, 1], [5, 2], [5, 3], [5, 4]], [[9, 5], [8, 5], [7, 5], [6, 5]], [[5, 9], [5, 8], [5, 7], [5, 6]]];
const MAE_HAUS = [[[0, 0], [1, 0], [0, 1], [1, 1]], [[9, 0], [10, 0], [9, 1], [10, 1]], [[9, 9], [10, 9], [9, 10], [10, 10]], [[0, 9], [1, 9], [0, 10], [1, 10]]];
const maeXY = (f, p, i) => p < 0 ? MAE_HAUS[f][i] : p >= 40 ? MAE_ZIEL[f][p - 40] : MAE_RUNDE[maeFeld(f, p)];
const MAE_AUGEN = { 1: [[5, 5]], 2: [[2.6, 2.6], [7.4, 7.4]], 3: [[2.6, 2.6], [5, 5], [7.4, 7.4]], 4: [[2.6, 2.6], [7.4, 2.6], [2.6, 7.4], [7.4, 7.4]],
  5: [[2.6, 2.6], [7.4, 2.6], [5, 5], [2.6, 7.4], [7.4, 7.4]], 6: [[2.6, 2.4], [7.4, 2.4], [2.6, 5], [7.4, 5], [2.6, 7.6], [7.4, 7.6]] };
function maeWuerfelSvg(w) {
  return `<svg viewBox="0 0 10 10" aria-hidden="true"><rect x=".4" y=".4" width="9.2" height="9.2" rx="2" class="mae-w-flaeche"/>${(MAE_AUGEN[w] || []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".95" class="mae-w-auge"/>`).join("")}${w ? "" : '<text x="5" y="6.6" text-anchor="middle" class="mae-w-frage">?</text>'}</svg>`;
}
// Brett als SVG: Felder, Haus, Ziel, Figuren. klick = Funktionsname für antippbare Figuren; ziehbar = Figuren-Indizes (Sitz dran)
function maeBrettSvg(z, { klick = "", ziehbar = [], anim = null, letzte = [], aus = false } = {}) {
  const c = (x) => x * 10 + 5, kreis = (xy, kl, r = 4.1) => `<circle cx="${c(xy[0])}" cy="${c(xy[1])}" r="${r}" class="${kl}"/>`;
  const aktiv = new Set(z.sitze.map((S) => S.f)), teile = [];
  teile.push(`<rect x="1" y="1" width="108" height="108" rx="9" class="mae-grund"/>`);
  teile.push(`<polyline points="${[...MAE_RUNDE, MAE_RUNDE[0]].map(([x, y]) => `${c(x)},${c(y)}`).join(" ")}" class="mae-weg"/>`);
  for (let f = 0; f < 4; f++) {
    const fa = MAE_FARBEN[f], blass = aktiv.has(f) ? "" : " mae-leer";
    MAE_HAUS[f].forEach((xy) => teile.push(kreis(xy, `mae-haus mae-${fa}${blass}`)));
    MAE_ZIEL[f].forEach((xy) => teile.push(kreis(xy, `mae-zielfeld mae-${fa}${blass}`)));
  }
  MAE_RUNDE.forEach((xy, k) => teile.push(kreis(xy, k % 10 === 0 ? `mae-start mae-${MAE_FARBEN[k / 10]}${aktiv.has(k / 10) ? "" : " mae-leer"}` : "mae-feld")));
  teile.push(`<text x="55" y="58.5" text-anchor="middle" class="mae-mitte">👨‍🍳</text>`);
  for (const l of letzte) if (l.von !== undefined && l.von >= 0 && l.von < 40) teile.push(kreis(maeXY(z.sitze[l.s].f, l.von, l.i), "mae-spur", 4.6));
  // Ziele der ziehbaren Figuren (gestrichelt), damit man sieht, wohin es geht
  if (ziehbar.length && z.wurf) { const S = z.sitze[z.dran];
    for (const i of ziehbar) { const q = maeZiel(z, z.dran, i, z.wurf); if (q !== null) teile.push(kreis(maeXY(S.f, q, i), `mae-zielhin mae-${MAE_FARBEN[S.f]}`, 4.6)); } }
  z.sitze.forEach((S, s) => S.fig.forEach((p0, i) => {
    const p = anim && anim.s === s && anim.i === i ? anim.p : p0, [x, y] = maeXY(S.f, p, i), kann = s === z.dran && ziehbar.includes(i) && !aus;
    const haus = p < 0 && s === z.dran && ziehbar.some((k) => S.fig[k] < 0) && !aus; // im Haus: jede Figur antippbar
    teile.push(`<g class="mae-figur mae-${MAE_FARBEN[S.f]}${kann || haus ? " mae-kann" : ""}${letzte.some((l) => l.s === s && l.i === i) ? " mae-zuletzt" : ""}"${kann || haus ? ` role="button" tabindex="0" aria-label="${MAE_FNAME[S.f]} Figur ${i + 1} ziehen" onclick="${klick}(${i})"` : ""}>
      <circle cx="${c(x)}" cy="${c(y)}" r="3.5" class="mae-fig-koerper"/><circle cx="${c(x) - 0.9}" cy="${c(y) - 1}" r="1.3" class="mae-fig-glanz"/></g>`);
  }));
  return `<svg class="mae-brett-svg" viewBox="0 0 110 110" role="img" aria-label="Spielfeld Mensch ärgere dich nicht">${teile.join("")}</svg>`;
}
const maeZielZahl = (S) => S.fig.filter((p) => p >= 40).length;
function maeSpielerHtml(z, namen) { // Leiste: wer spielt welche Farbe, wer ist dran, wie viele im Ziel
  return `<div class="mae-spieler">${z.sitze.map((S, s) => `<div class="mae-sp${s === z.dran && z.phase !== "ende" ? " dran" : ""}${z.platz.includes(s) ? " fertig" : ""}">
    <span class="mae-punkt mae-${MAE_FARBEN[S.f]}" aria-hidden="true"></span><b>${esc(namen[s])}</b><small>${z.platz.includes(s) ? `🏁 ${z.platz.indexOf(s) + 1}.` : `🏠 ${maeZielZahl(S)}/4`}</small></div>`).join("")}</div>`;
}
// Ansage/Text zu einem Ereignis (für Verlauf und Vorlesen); wer(s) = Name des Sitzes
function maeEreignisText(e, wer, z) {
  const n = wer(e.s), du = n === "Du", v = (er, dw) => (du ? dw : er); // „Du würfelst“ / „Blau würfelt“
  if (e.t === "wurf") return `${n} ${v("würfelt", "würfelst")} ${e.w === 6 ? "eine 6!" : e.w + "."}`;
  if (e.t === "nochmal") return `${du ? "Du hast" : n + " hat"} noch ${3 - e.v} ${3 - e.v === 1 ? "Versuch" : "Versuche"} für eine 6.`;
  if (e.t === "aus") return `${n} ${v("kann", "kannst")} nicht ziehen.`;
  if (e.t === "fertig") return `🏁 ${n} ${v("hat", "hast")} alle Figuren im Ziel!`;
  if (e.t === "zug") { const o = e.opfer ? ` und ${v("wirft", "wirfst")} ${wer(e.opfer.s) === "Du" ? "dich" : wer(e.opfer.s)} raus! 😱` : "";
    return e.von < 0 ? `${n} ${v("kommt", "kommst")} raus${o || "."}` : e.nach >= 40 ? `${n} ${v("zieht", "ziehst")} ins Ziel${o || "."}` : `${n} ${v("zieht", "ziehst")} ${e.w} ${e.w === 1 ? "Feld" : "Felder"}${o || "."}`; }
  return "";
}
// ----- gegen den Computer -----
const MAE_KEY = "kc_club_mae_pc";
let MAEP = (() => { let w = null; try { w = JSON.parse(localStorage.getItem(MAE_KEY) || "null"); } catch {}
  return { staerke: "mittel", gegner: 3, farbe: 0, stand: { ich: 0, pc: 0 }, ...(w || {}), denkt: false, anim: null, rollt: false, letzte: [], text: "" }; })();
const maepMerken = () => { try { localStorage.setItem(MAE_KEY, JSON.stringify({ staerke: MAEP.staerke, gegner: MAEP.gegner, farbe: MAEP.farbe, stand: MAEP.stand, z: MAEP.z || null })); } catch {} };
const maepSichtbar = () => aktuelleAnsicht === "spiele" && SP.tab === "pc" && SP.art === "mae";
const maepName = (s) => { const S = MAEP.z?.sitze[s]; return !S ? "" : S.wer === "ich" ? "Du" : `🤖 ${MAE_FNAME[S.f]}`; };
function maePcZeigen() {
  const z = MAEP.z, s = MAEP.stand;
  const stand = `<div class="sp-stand"><span>Du <b>${s.ich}</b></span><span><b>${s.pc}</b> Computer</span></div>`;
  if (!z) { $("spInhalt").innerHTML = `<div class="karte sp-karte">
      <div class="kt-wahl">${spWahl("Gegner", String(MAEP.gegner), [["1", "<span class=\"kt-emo\">🤖</span>1 Computer"], ["2", "<span class=\"kt-emo\">🤖🤖</span>2 Computer"], ["3", "<span class=\"kt-emo\">🤖🤖🤖</span>3 Computer"]], "maePcGegner")}</div>
      <div class="kt-wahl">${spWahl("Stärke", MAEP.staerke, [["leicht", "<span class=\"kt-emo\">😊</span>Leicht"], ["mittel", "<span class=\"kt-emo\">🙂</span>Mittel"], ["schwer", "<span class=\"kt-emo\">😎</span>Schwer"]], "maePcStaerke")}</div>
      <div class="kt-wahl">${spWahl("Deine Farbe", String(MAEP.farbe), MAE_FNAME.map((n, f) => [String(f), `<span class="mae-punkt mae-${MAE_FARBEN[f]}" aria-hidden="true"></span>${n}`]), "maePcFarbe")}</div>
      ${stand}
      <p style="margin:6px 0">🎲 <b>Mensch ärgere dich nicht</b> – bring alle 4 Figuren ins Ziel. Mit einer <b>6</b> kommt eine Figur raus, und du darfst nochmal würfeln.
        Kommst du auf ein Feld mit einer fremden Figur, fliegt sie zurück ins Haus. Ins Ziel geht es nur genau. Wer zuerst alle 4 drin hat, gewinnt!</p>
      ${spLeiste(spKnopf("▶", "Los geht’s", "maePcStart()", { haupt: true }), schTonKnopf(), spAnsageKnopf("mae"), s.ich + s.pc ? spStandKnopf("maePcStandWeg()") : "")}</div>`; return; }
  const namen = z.sitze.map((_, k) => maepName(k)), ich = z.sitze[z.dran]?.wer === "ich", m = ich && z.phase === "ziehen" && !MAEP.anim ? maeMoeglich(z) : [];
  const status = z.phase === "ende" ? (z.sitze[z.sieger]?.wer === "ich" ? `<div class="sp-banner sieg">🏆 Du hast gewonnen!</div>` : `<div class="sp-banner niederlage">${esc(maepName(z.sieger))} war schneller</div>`)
    : `<div class="sp-status${ich ? " sp-ichdran" : ""}">${MAEP.text ? esc(MAEP.text) + " " : ""}${ich ? (z.phase === "wuerfeln" ? (z.versuche ? `🎲 Nochmal würfeln – noch ${3 - z.versuche} ${3 - z.versuche === 1 ? "Versuch" : "Versuche"} für eine 6` : "🎲 Du bist dran – würfeln!") : MAEP.anim ? "" : "👆 Tippe die Figur an, die ziehen soll") : MAEP.anim ? "" : `${esc(maepName(z.dran))} ist dran …`}</div>`;
  $("spInhalt").innerHTML = `<div class="karte sp-karte mae-karte">
      ${maeSpielerHtml(z, namen)}
      ${status}
      <div class="mae-brett" id="maeBrett">${maeBrettSvg(z, { klick: "maePcFigur", ziehbar: m, anim: MAEP.anim, letzte: MAEP.letzte, aus: SP.pause })}</div>
      <div class="mae-wurfzeile">${maeWuerfelKnopf(z.wurf, { kann: ich && z.phase === "wuerfeln" && !MAEP.rollt && !MAEP.anim, rollt: MAEP.rollt, klick: "maePcWuerfeln()", farbe: MAE_FARBEN[z.sitze[z.dran]?.f ?? 0] })}</div>
      ${z.phase === "ende" ? spLeiste(spNeuKnopf("maePcStart()"), spKnopf("⚙️", "Einstellen", "MAEP.z=null;maepMerken();maePcZeigen()"), schTonKnopf(), spAnsageKnopf("mae"))
        : spLeiste(spNeuKnopf("maePcAbbrechen(true)", "Neues Spiel", false), spAbbrechenKnopf("maePcAbbrechen()"), schTonKnopf(), spAnsageKnopf("mae"))}
    </div>`;
}
function maeWuerfelKnopf(w, { kann, rollt, klick, farbe }) {
  return `<button class="mae-wuerfel mae-${farbe}${rollt ? " rollt" : ""}${kann ? " kann" : ""}" ${kann ? `onclick="${klick}"` : "disabled"} aria-label="${kann ? "Würfeln" : w ? `Gewürfelt: ${w}` : "Würfel"}">${maeWuerfelSvg(rollt ? 1 + Math.floor(Math.random() * 6) : w)}</button>${kann ? '<span class="mae-w-text">Antippen zum Würfeln</span>' : ""}`;
}
function maeBrettNeu() { const el = $("maeBrett"); if (!el || !MAEP.z) return; const z = MAEP.z, ich = z.sitze[z.dran]?.wer === "ich";
  el.innerHTML = maeBrettSvg(z, { klick: "maePcFigur", ziehbar: ich && z.phase === "ziehen" && !MAEP.anim ? maeMoeglich(z) : [], anim: MAEP.anim, letzte: MAEP.letzte, aus: SP.pause }); }
const maePcGegner = (n) => { MAEP.gegner = [1, 2, 3].includes(Number(n)) ? Number(n) : 3; maepMerken(); maePcZeigen(); };
const maePcStaerke = (w) => { MAEP.staerke = ["leicht", "mittel", "schwer"].includes(w) ? w : "mittel"; maepMerken(); maePcZeigen(); };
const maePcFarbe = (f) => { MAEP.farbe = [0, 1, 2, 3].includes(Number(f)) ? Number(f) : 0; maepMerken(); maePcZeigen(); };
async function maePcStandWeg() { if (!(await frage("Spielstand Mensch ärgere dich nicht auf 0 : 0 zurücksetzen?", { ja: "🗑️ Zurücksetzen", nein: "Abbrechen" }))) return; MAEP.stand = { ich: 0, pc: 0 }; maepMerken(); maePcZeigen(); }
function maePcStart() {
  const F = MAEP.farbe, n = MAEP.gegner, farben = n === 1 ? [F, (F + 2) % 4] : n === 2 ? [F, (F + 1) % 4, (F + 2) % 4] : [F, (F + 1) % 4, (F + 2) % 4, (F + 3) % 4];
  MAEP.z = maeNeu(farben.map((f, k) => ({ f, wer: k ? "pc" : "ich" }))); MAEP.letzte = []; MAEP.text = ""; MAEP.anim = null; MAEP.rollt = false;
  maepMerken(); spSag("mae", `Neues Spiel. Du spielst ${MAE_FNAME[F]} und fängst an.`, "maep:start:" + Date.now(), true); maePcZeigen();
}
const maeWarte = (ms) => new Promise((r) => setTimeout(r, ms));
async function maePcWuerfeln() {
  const z = MAEP.z; if (!z || z.phase !== "wuerfeln" || z.sitze[z.dran].wer !== "ich" || MAEP.rollt || SP.pause) return;
  await maeWurf(z);
  if (!maepSichtbar() || MAEP.z !== z) return;
  maePcNach();
}
async function maeWurf(z) { // Würfel rollen lassen (Animation), dann werten
  MAEP.rollt = true; MAEP.text = ""; maePcZeigen();
  const t0 = Date.now(), tick = setInterval(() => { const b = document.querySelector(".mae-wuerfel.rollt"); if (b) b.innerHTML = maeWuerfelSvg(1 + Math.floor(Math.random() * 6)); }, 90);
  try { navigator.vibrate?.(25); } catch {}
  spTon("wuerfel");
  await maeWarte(Math.max(0, 650 - (Date.now() - t0))); clearInterval(tick); MAEP.rollt = false;
  if (MAEP.z !== z) return;
  const w = 1 + Math.floor(Math.random() * 6), vor = z.n, m = maeWuerfeln(z, w);
  MAEP.text = maeEreignisText(z.log.find((e) => e.n === vor + 1), maepName, z);
  const rest = z.log.filter((e) => e.n > vor + 1).map((e) => maeEreignisText(e, maepName, z)).join(" ");
  spSag("mae", `${MAEP.text} ${rest}`.trim(), `maep:${z.n}`, z.sitze[z.log.find((e) => e.n === vor + 1).s]?.wer === "ich");
  if (rest) MAEP.text += " " + rest;
  maepMerken(); maePcZeigen();
  return m;
}
async function maePcNach() { // nach dem Würfeln: genau ein Zug → selbst ziehen; Computer am Zug → Computer
  const z = MAEP.z; if (!z || !maepSichtbar()) return;
  if (z.phase === "ende") return maePcWerten();
  const ich = z.sitze[z.dran].wer === "ich";
  if (ich && z.phase === "ziehen") { const m = maeMoeglich(z); if (m.length === 1) { await maeWarte(650); if (MAEP.z === z && z.phase === "ziehen" && !SP.pause) return maePcFigur(m[0]); } return; }
  if (!ich) { await maeWarte(700); if (MAEP.z === z) maePcComputer(); }
}
async function maePcFigur(i) {
  const z = MAEP.z; if (!z || z.phase !== "ziehen" || z.sitze[z.dran].wer !== "ich" || MAEP.anim || SP.pause) return;
  await maeZugMitAnimation(z, i);
  if (MAEP.z === z) maePcNach();
}
async function maeZugMitAnimation(z, i) { // Figur Feld für Feld laufen lassen, dann den Zug wirklich ausführen
  const s = z.dran, S = z.sitze[s], m = maeMoeglich(z); if (S.fig[i] < 0 && !m.includes(i)) i = m.find((k) => S.fig[k] < 0) ?? i;
  if (!m.includes(i)) return;
  const von = S.fig[i], nach = maeZiel(z, s, i, z.wurf);
  if (von >= 0) for (let p = von + 1; p < nach; p++) { MAEP.anim = { s, i, p }; maeBrettNeu(); spTon("schritt"); await maeWarte(150); if (MAEP.z !== z) return; }
  MAEP.anim = null;
  const vor = z.n, e = maeZiehen(z, i); if (!e) return maePcZeigen();
  MAEP.letzte = [{ s: e.s, i: e.i, von: e.von }];
  const texte = z.log.filter((x) => x.n > vor).map((x) => maeEreignisText(x, maepName, z));
  MAEP.text = texte.join(" ");
  if (e.opfer) { spTon("raus"); try { navigator.vibrate?.([40, 30, 60]); } catch {} }
  if (e.opfer || texte.length > 1 || z.sitze[s].wer !== "ich") spSag("mae", MAEP.text, `maep:${z.n}`);
  maepMerken(); maePcZeigen();
}
async function maePcComputer() { // die Computer ziehen nacheinander, bis du wieder dran bist (nur eine Kette gleichzeitig)
  if (MAEP.kette) return; MAEP.kette = true;
  try {
    for (;;) {
      const z = MAEP.z; if (!z || z.phase === "ende" || !maepSichtbar()) break;
      if (z.sitze[z.dran].wer === "ich") { maePcZeigen(); break; }
      if (spPauseHalt(maePcComputer)) break;
      if (z.phase === "wuerfeln") { await maeWurf(z); if (MAEP.z !== z || !maepSichtbar()) break; await maeWarte(z.phase === "ziehen" ? 550 : 800); }
      if (MAEP.z !== z || !maepSichtbar() || spPauseHalt(maePcComputer)) break;
      if (z.phase === "ziehen") { await maeZugMitAnimation(z, maeComputerWahl(z, MAEP.staerke)); await maeWarte(450); }
      if (MAEP.z !== z) break;
      if (z.phase === "ende") { maePcWerten(); break; }
    }
  } finally { MAEP.kette = false; }
}
function maePcWerten() {
  const z = MAEP.z; if (!z || z.phase !== "ende" || z.gewertet) return;
  z.gewertet = true; const sieg = z.sitze[z.sieger]?.wer === "ich";
  if (sieg) MAEP.stand.ich++; else MAEP.stand.pc++;
  spEndeTon(sieg);
  maepMerken(); spSag("mae", sieg ? "Glückwunsch! Du hast alle Figuren im Ziel und gewinnst!" : `${maepName(z.sieger).replace("🤖 ", "")} war schneller. Revanche?`, `maep:ende:${z.n}`, true);
  try { navigator.vibrate?.(sieg ? [60, 40, 60, 40, 120] : 80); } catch {}
  maePcZeigen();
}
// wie beim Küchenterror: Abbrechen ohne Wertung (Spielstand bleibt)
async function maePcAbbrechen(neu = false) { // KC-CLUB-SPIELE-LEISTE: neu = gleich ein neues Spiel mit denselben Einstellungen
  const z = MAEP.z; if (!z || z.phase === "ende") return;
  try { speechSynthesis.cancel(); } catch {}
  if (!(await frage(`${neu ? "Neues Spiel beginnen?" : "Spiel abbrechen?"} Diese Runde wird nicht gewertet – dein Spielstand bleibt.`, { ja: neu ? "↺ Neues Spiel" : "✖ Abbrechen", nein: "▶ Weiterspielen" }))) { if (MAEP.z === z && z.sitze[z.dran].wer !== "ich") maePcComputer(); return; }
  if (MAEP.z !== z) return;
  MAEP.z = null; MAEP.anim = null; MAEP.rollt = false; maepMerken();
  if (neu) return maePcStart();
  if (maepSichtbar()) maePcZeigen();
  melde("Spiel abgebrochen – nicht gewertet.");
}
function maePcFortsetzen() { // nach Rückkehr in die Ansicht: läuft der Computer gerade nicht, wieder anstoßen
  const z = MAEP.z; if (!z || z.phase === "ende" || MAEP.kette || MAEP.anim || MAEP.rollt) return;
  if (z.sitze[z.dran].wer !== "ich") setTimeout(maePcComputer, 500);
}
// ----- gegen Mitglieder (der Server würfelt und prüft) -----
const MAE_GESEHEN = new Map(); // Partie → zuletzt gezeigtes Ereignis (für Verlauf/Ansage)
let MAEM = { sendet: false, rollt: false, letzte: [], texte: [] };
const maeMgName = (g, s) => { const S = g.mae?.sitze[s]; return !S ? "" : S.wer === "ich" ? "Du" : S.wer === "pc" ? `🤖 ${MAE_FNAME[S.f]}` : S.name || "?"; };
function maeSpielZeigen(g) {
  if (MAEM.id !== g.id) MAEM = { sendet: false, rollt: false, letzte: [], texte: [], id: g.id };
  const z = g.mae; if (!z) { $("spInhalt").innerHTML = '<div class="karte hinweis">Wird geladen …</div>'; return; }
  const gesehen = MAE_GESEHEN.has(g.id) ? MAE_GESEHEN.get(g.id) : z.n, neu = (z.log || []).filter((e) => e.n > gesehen);
  if (neu.length) { // was die anderen (und der Computer) inzwischen gemacht haben
    MAEM.texte = neu.map((e) => maeEreignisText(e, (s) => maeMgName(g, s), z)).filter(Boolean).slice(-6);
    MAEM.letzte = neu.filter((e) => e.t === "zug").map((e) => ({ s: e.s, i: e.i, von: e.von }));
    if (neu.some((e) => e.s !== z.ich)) spSag("mae", MAEM.texte.join(" "), `maem:${g.id}:${z.n}`, true);
    if (MAE_GESEHEN.has(g.id)) spTon(g.status === "beendet" ? (g.ergebnis === "gewonnen" ? "sieg" : "niederlage") : neu.some((e) => e.opfer) ? "raus" : neu.some((e) => e.s !== z.ich) ? "gegner" : "schritt"); // KC-CLUB-SPIELE-LEISTE
  }
  MAE_GESEHEN.set(g.id, z.n);
  const namen = z.sitze.map((_, s) => maeMgName(g, s)), m = g.ichDran && z.phase === "ziehen" ? z.moeglich || [] : [];
  const banner = g.status === "beendet" ? (g.ergebnis === "gewonnen" ? `<div class="sp-banner sieg">🏆 Du hast gewonnen!${g.aufgegeben ? ` ${esc(g.gegner.vorname)} hat aufgegeben.` : ""}</div>` : `<div class="sp-banner niederlage">${g.aufgegeben ? "Du hast aufgegeben." : `${esc(g.gegner.vorname)} hat gewonnen.`}</div>`)
    : g.status === "angefragt" ? `<div class="sp-status">⏳ Warte, bis ${esc(g.gegner.vorname)} annimmt …</div>`
    : g.status !== "laeuft" ? `<div class="sp-status">Diese Partie findet nicht statt.</div>`
    : `<div class="sp-status${g.ichDran ? " sp-ichdran" : ""}">${g.ichDran ? (z.phase === "wuerfeln" ? (z.versuche ? `🎲 Nochmal würfeln – noch ${3 - z.versuche} ${3 - z.versuche === 1 ? "Versuch" : "Versuche"} für eine 6` : "🎲 Du bist dran – würfeln!") : `Du hast eine ${z.wurf} – 👆 tippe die Figur an, die ziehen soll`) : `${esc(namen[z.dran])} ist dran …`}</div>`;
  $("spInhalt").innerHTML = `<div class="karte sp-karte mae-karte">
      <div class="zeile" style="border:none;padding:0"><button class="knopf klein" onclick="SP.offen=null;spZeigen();spLaden(true)">‹ Übersicht</button><b style="flex:1;text-align:right">🎲 Du gegen ${esc(g.gegner.vorname)}</b></div>
      ${maeSpielerHtml(z, namen)}
      ${banner}
      <div class="mae-brett" id="maeBrett">${maeBrettSvg(z, { klick: "maeMgFigur", ziehbar: m, letzte: MAEM.letzte, aus: MAEM.sendet })}</div>
      <div class="mae-wurfzeile">${maeWuerfelKnopf(z.wurf, { kann: g.ichDran && z.phase === "wuerfeln" && !MAEM.sendet, rollt: MAEM.rollt, klick: "maeMgWuerfeln()", farbe: MAE_FARBEN[z.sitze[z.dran]?.f ?? 0] })}</div>
      ${MAEM.texte.length && g.status !== "angefragt" ? `<div class="mae-verlauf" aria-live="polite"><b>Zuletzt:</b>${MAEM.texte.slice(-4).map((t) => `<div>${esc(t)}</div>`).join("")}</div>` : ""}
      ${spTerminHtml(g)}
      <p class="hinweis" style="text-align:center;margin:6px 0">${g.status === "laeuft" ? `Du musst nicht warten – ${esc(g.gegner.vorname)} bekommt Bescheid, wenn er dran ist.${z.sitze.some((S) => S.wer === "pc") ? " 🤖 Die freien Farben spielt der Computer." : ""}` : ""}</p>
      ${spLeiste(g.status === "beendet" ? spKnopf("↺", "Revanche", `spRevanche('${g.id}')`, { haupt: true }) : g.status === "laeuft" ? spKnopf("🏳️", "Aufgeben", `spAufgeben('${g.id}')`) : "", schTonKnopf(), spAnsageKnopf("mae"))}
    </div>`;
  if (g.ichDran && z.phase === "ziehen" && m.length === 1 && !MAEM.sendet) setTimeout(() => { if (SP.offen?.id === g.id && SP.offen.ichDran && SP.offen.mae?.phase === "ziehen") maeMgFigur(m[0]); }, 700);
}
async function maeMgZug(zug) {
  const g = SP.offen; if (!g?.ichDran || MAEM.sendet) return;
  MAEM.sendet = true;
  try { SP.offen = (await api("spiel_zug", { id: g.id, zug, zuege: g.zuege })).spiel; }
  catch (e) { meldeFehler(e); try { SP.offen = (await api("spiel_holen", { id: g.id })).spiel; } catch {} }
  finally { MAEM.sendet = false; }
  if (aktuelleAnsicht === "spiele" && SP.offen?.id === g.id) spZeigen();
}
async function maeMgWuerfeln() {
  const g = SP.offen; if (!g?.ichDran || g.mae?.phase !== "wuerfeln" || MAEM.sendet || MAEM.rollt) return;
  MAEM.rollt = true; spZeigen();
  const tick = setInterval(() => { const b = document.querySelector(".mae-wuerfel.rollt"); if (b) b.innerHTML = maeWuerfelSvg(1 + Math.floor(Math.random() * 6)); }, 90);
  try { navigator.vibrate?.(25); } catch {}
  const t0 = Date.now(); MAEM.sendet = true; let neu = null;
  try { neu = (await api("spiel_zug", { id: g.id, zug: { wuerfeln: true }, zuege: g.zuege })).spiel; }
  catch (e) { meldeFehler(e); try { neu = (await api("spiel_holen", { id: g.id })).spiel; } catch {} }
  await maeWarte(Math.max(0, 650 - (Date.now() - t0))); clearInterval(tick); MAEM.rollt = false; MAEM.sendet = false;
  if (neu) SP.offen = neu;
  if (aktuelleAnsicht === "spiele" && SP.offen?.id === g.id) spZeigen();
}
function maeMgFigur(i) { const g = SP.offen; if (!g?.ichDran || g.mae?.phase !== "ziehen") return; const S = g.mae.sitze[g.mae.dran], m = g.mae.moeglich || [];
  if (S.fig[i] < 0 && !m.includes(i)) i = m.find((k) => S.fig[k] < 0) ?? i; if (m.includes(i)) maeMgZug({ figur: i }); }

// ---------- KC-CLUB-FDK-RALLYE (2.154.0, Wunsch Hansi): 🧑‍🍳 Fang den Koch – Küchenrallye gegen Twinkey ----------
// Ersetzt KC-CLUB-FDK-EINFACH (2.32.0). Rundweg mit 24 Feldern um die Küche, in der Mitte der 🛎️ Pass (vier Durchreichen).
// Jeder Koch hat einen Bon: Zutaten in Lager/Kühlhaus/Gemüse/Gewürzregal holen, dann am Herd/in der Fritteuse/im Ofen
// zubereiten, an einer Durchreiche abgeben und klingeln. Würfeln, Richtung frei wählen; an einer Station, die man braucht,
// darf man unterwegs anhalten (Rest-Augen verfallen). Eigene Stoppuhr in Küchenminuten (jeder Wurf 3 Min.) – die echte Zeit
// zählt nicht. Punkte: Grundpunkte je Stufe, Tempo-Bonus unter der Richtzeit, Erster am Pass, Abzug für Vergessenes,
// „Sauber gearbeitet“ ohne Pech. ❗-Felder: Ereigniskarten (Pech mit Aufgabe, Glück). Genau auf dem anderen landen =
// Zusammenstoß, er lässt eine Zutat fallen. Beide bekommen gleich schwere Gerichte mit gleich vielen Zutaten/Arbeitsschritten
// und ähnlich langem Weg. Regeln hier rein (ohne Bildschirm), damit der Vertragstest ganze Partien durchspielen kann.
// KC-CLUB-FDK-SPANNUNG (Wunsch Hansi „langweilig“): 🃏 Aktionskarten auf die Hand (höchstens 3, vor dem Würfeln eine ausspielen:
// Turbo, Abkürzung, Klauen, Gas abdrehen, Lieferant, Mise en place; Sous-Chef schützt von selbst vor dem nächsten Pech) und
// 📦 knappe Vorräte: jede Vorratsstation hat nur FDK_VORRAT Kisten – leer heißt: im 📋 Büro nachbestellen (füllt für beide auf).
const FDK_KEY = "kc_club_fdk3", FDK_N = 24, FDK_MIN = 3, FDK_VORRAT = 2, FDK_HAND = 3; // Küchenminuten je Wurf, Kisten je Station, Karten auf der Hand
const FDK_LAGER = ["lager", "kuehl", "gemuese", "gewuerz"];
// Felder: s = Station, d = Durchreiche zum Pass, e = Ereignis, f = frei
const FDK_FELD = ["start", "e", "lager", "d", "kuehl", "e", "gemuese", "f", "gewuerz", "d", "e", "herd", "f", "e", "fritteuse", "d", "f", "ofen", "e", "f", "buero", "d", "e", "f"];
const FDK_ST = { start: ["🚪", "Start"], lager: ["🌾", "Lager"], kuehl: ["🧊", "Kühlhaus"], gemuese: ["🥕", "Gemüse"], gewuerz: ["🧂", "Gewürzregal"],
  herd: ["🔥", "Herd"], fritteuse: ["🍟", "Fritteuse"], ofen: ["♨️", "Ofen"], buero: ["📋", "Büro"], d: ["🛎️", "Durchreiche"], e: ["❗", "Ereignis"], f: ["", ""] };
const FDK_STUFEN = { leicht: { name: "Leicht", grund: 10 }, mittel: { name: "Mittel", grund: 15 }, schwer: { name: "Schwer", grund: 20 } };
// Gericht: [Zeichen, Name, Stufe, Zutaten [Station, Zeichen, Name], Arbeitsschritte [Station, Text, Züge]]
// Je Stufe gleich viele Zutaten und gleich viele Arbeitszüge – so bekommen beide Köche gleich viel zu tun.
const FDK_GERICHTE = {
  pfannkuchen: ["🥞", "Pfannkuchen", "leicht", [["lager", "🌾", "Mehl"], ["kuehl", "🥚", "Eier"], ["kuehl", "🥛", "Milch"]], [["herd", "in der Pfanne backen", 1]]],
  ruehrei: ["🍳", "Rührei mit Brot", "leicht", [["kuehl", "🥚", "Eier"], ["gemuese", "🌱", "Schnittlauch"], ["lager", "🍞", "Brot"]], [["herd", "Rührei braten", 1]]],
  currywurst: ["🌭", "Currywurst mit Pommes", "leicht", [["kuehl", "🌭", "Bratwurst"], ["gemuese", "🥔", "Kartoffeln"], ["gewuerz", "🍛", "Currypulver"]], [["fritteuse", "Pommes frittieren", 1]]],
  kaiserschmarrn: ["🥮", "Kaiserschmarrn", "leicht", [["lager", "🌾", "Mehl"], ["kuehl", "🥚", "Eier"], ["gewuerz", "🍚", "Puderzucker"]], [["herd", "in der Pfanne zupfen", 1]]],
  bratkartoffeln: ["🥔", "Bratkartoffeln mit Spiegelei", "leicht", [["gemuese", "🥔", "Kartoffeln"], ["kuehl", "🥚", "Eier"], ["gewuerz", "🧂", "Salz & Pfeffer"]], [["herd", "goldbraun braten", 1]]],
  gulasch: ["🍲", "Rindergulasch", "mittel", [["kuehl", "🥩", "Rindfleisch"], ["gemuese", "🧅", "Zwiebeln"], ["gemuese", "🫑", "Paprika"], ["gewuerz", "🌶️", "Paprikapulver"]], [["herd", "schmoren", 2]]],
  bolognese: ["🍝", "Spaghetti Bolognese", "mittel", [["kuehl", "🥩", "Hackfleisch"], ["gemuese", "🍅", "Tomaten"], ["lager", "🍝", "Spaghetti"], ["gewuerz", "🌿", "Oregano"]], [["herd", "Soße köcheln", 2]]],
  schnitzel: ["🥩", "Schnitzel mit Pommes", "mittel", [["kuehl", "🥩", "Schweineschnitzel"], ["lager", "🍞", "Paniermehl"], ["kuehl", "🥚", "Eier"], ["gemuese", "🥔", "Kartoffeln"]], [["herd", "Schnitzel braten", 1], ["fritteuse", "Pommes frittieren", 1]]],
  fishchips: ["🐟", "Fish & Chips", "mittel", [["kuehl", "🐟", "Kabeljau"], ["lager", "🌾", "Mehl"], ["gemuese", "🥔", "Kartoffeln"], ["gewuerz", "🧂", "Meersalz"]], [["fritteuse", "Fisch und Pommes frittieren", 2]]],
  curry: ["🍛", "Hähnchen-Curry mit Reis", "mittel", [["kuehl", "🍗", "Hähnchen"], ["lager", "🍚", "Reis"], ["gemuese", "🫑", "Paprika"], ["gewuerz", "🍛", "Curry"]], [["herd", "Curry köcheln", 2]]],
  roulade: ["🥩", "Rinderroulade", "schwer", [["kuehl", "🥩", "Rindfleisch"], ["kuehl", "🥓", "Speck"], ["gemuese", "🥒", "Gewürzgurken"], ["gewuerz", "🟡", "Senf"], ["lager", "🍷", "Rotwein"]], [["herd", "scharf anbraten", 1], ["ofen", "schmoren", 2]]],
  sauerbraten: ["🍖", "Sauerbraten", "schwer", [["kuehl", "🥩", "Rinderbraten"], ["lager", "🍶", "Essig"], ["gemuese", "🧅", "Zwiebeln"], ["gewuerz", "🍃", "Lorbeer"], ["lager", "🍇", "Rosinen"]], [["herd", "anbraten", 1], ["ofen", "schmoren", 2]]],
  schweinebraten: ["🍖", "Schweinebraten mit Klößen", "schwer", [["kuehl", "🥩", "Schweinebraten"], ["lager", "🍺", "Bier"], ["gemuese", "🧅", "Zwiebeln"], ["gewuerz", "🌱", "Kümmel"], ["lager", "⚪", "Kloßteig"]], [["ofen", "braten", 2], ["herd", "Klöße ziehen lassen", 1]]],
  ente: ["🦆", "Ente mit Rotkohl", "schwer", [["kuehl", "🦆", "Ente"], ["gemuese", "🟣", "Rotkohl"], ["gemuese", "🍎", "Äpfel"], ["gewuerz", "🌿", "Beifuß"], ["lager", "⚪", "Klöße"]], [["ofen", "knusprig braten", 2], ["herd", "Rotkohl schmoren", 1]]],
  kohlrouladen: ["🥬", "Kohlrouladen", "schwer", [["kuehl", "🥩", "Hackfleisch"], ["gemuese", "🥬", "Weißkohl"], ["gemuese", "🧅", "Zwiebeln"], ["gewuerz", "🌱", "Kümmel"], ["lager", "🍞", "Brötchen"]], [["herd", "anbraten", 1], ["ofen", "schmoren", 2]]],
};
// Ereigniskarten – Pech immer mit einer klaren Aufgabe, Glück hilft weiter
const FDK_KARTEN = [
  ["fallen", 2], ["braun", 1], ["warm", 1], ["gas", 2], ["schaum", 1], ["hygiene", 2],
  ["turbo", 2], ["abkuerzung", 2], ["klau", 2], ["gaszu", 1], ["liefer", 2], ["mise", 1], ["schutz", 1], ["lob", 1],
];
const FDK_PECH = new Set(["fallen", "braun", "warm", "gas", "schaum"]);
const FDK_AKTION = new Set(["turbo", "abkuerzung", "klau", "gaszu", "liefer", "mise", "schutz"]); // kommen auf die Hand
const FDK_AKTION_NAME = { turbo: ["⚡", "Turbo", "Mit zwei Würfeln würfeln"], abkuerzung: ["🚪", "Abkürzung", "Direkt zur nächsten Station, die du brauchst (statt würfeln)"],
  klau: ["🤏", "Zutat klauen", "Eine Zutat vom anderen Tablett – die du brauchst, sonst fällt sie herunter"], gaszu: ["🔧", "Gas abdrehen", "Beim anderen geht der Herd aus, bis er im Büro war"],
  liefer: ["🚚", "Lieferant", "Eine fehlende Zutat kommt direkt aufs Tablett"], mise: ["🔪", "Mise en place", "Dein nächster Arbeitsschritt ist sofort fertig"],
  schutz: ["🛡️", "Sous-Chef", "Schützt dich von selbst vor dem nächsten Pech"] };
const fdkAbstand = (a, b) => { const d = Math.abs(a - b) % FDK_N; return Math.min(d, FDK_N - d); };
const fdkFelderVon = (art) => FDK_FELD.map((f, i) => (f === art ? i : -1)).filter((i) => i >= 0);
const FDK_DURCH = fdkFelderVon("d");
const fdkStPos = (st) => FDK_FELD.indexOf(st);
// kürzester Weg vom Feld p über alle Stationen (Zutaten in beliebiger Folge, dann Arbeitsschritte der Reihe nach) bis zu einer Durchreiche
function fdkWeglaenge(p, zutStationen, schrittStationen) {
  const st = [...new Set(zutStationen)].map(fdkStPos); let best = Infinity;
  const perm = (rest, pos, sum) => {
    if (sum >= best) return;
    if (!rest.length) { let q = pos, s = sum; for (const x of schrittStationen) { s += fdkAbstand(q, fdkStPos(x)); q = fdkStPos(x); } s += Math.min(...FDK_DURCH.map((d) => fdkAbstand(q, d))); best = Math.min(best, s); return; }
    rest.forEach((x, i) => perm(rest.filter((_, j) => j !== i), x, sum + fdkAbstand(pos, x)));
  };
  perm(st, p, 0); return best;
}
const fdkGerichtWeg = (g, p = 0) => { const G = FDK_GERICHTE[g]; return fdkWeglaenge(p, G[3].map((z) => z[0]), G[4].map((x) => x[0])); };
// Richtzeit in Würfen: Weg / 3 Felder je Wurf, je Halt ein halber Wurf, Schmoren dauert, plus etwas Luft
function fdkRichtWuerfe(g) {
  const G = FDK_GERICHTE[g], halte = new Set(G[3].map((z) => z[0])).size + G[4].length + 1;
  return Math.round(fdkGerichtWeg(g) / 3 + halte * 0.6 + G[4].reduce((a, x) => a + x[2] - 1, 0) + 4);
}
// zwei gleich schwere Gerichte mit ähnlich langem Weg (höchstens 2 Felder Unterschied), möglichst nicht schon gehabt
function fdkGerichtPaar(stufe, zufall, schonDa = []) {
  const ids = Object.keys(FDK_GERICHTE).filter((g) => FDK_GERICHTE[g][2] === stufe);
  const paare = [];
  for (const a of ids) for (const b of ids) if (a !== b && Math.abs(fdkGerichtWeg(a) - fdkGerichtWeg(b)) <= 2) paare.push([a, b]);
  const frisch = paare.filter(([a, b]) => !schonDa.includes(a) && !schonDa.includes(b)), l = frisch.length ? frisch : paare;
  return l[Math.floor(zufall() * l.length) % l.length];
}
function fdkNeuerBon(g) { const G = FDK_GERICHTE[g]; return { g, hat: G[3].map(() => false), schritt: G[4].map(() => false), uhr: 0, pech: false }; }
function fdkNeu({ stufe = "leicht", anzahl = 2, zufall = Math.random } = {}) {
  const plan = [[], []];
  for (let i = 0; i < anzahl; i++) { const [a, b] = fdkGerichtPaar(stufe, zufall, [...plan[0], ...plan[1]]); const tausch = zufall() < 0.5; plan[0].push(tausch ? b : a); plan[1].push(tausch ? a : b); }
  const stapel = []; for (const [k, n] of FDK_KARTEN) for (let i = 0; i < n; i++) stapel.push(k);
  for (let i = stapel.length - 1; i > 0; i--) { const j = Math.floor(zufall() * (i + 1)) % (i + 1); [stapel[i], stapel[j]] = [stapel[j], stapel[i]]; }
  const sp = () => ({ pos: 0, punkte: 0, nr: 0, bon: null, fertig: false, aussetzen: 0, wartet: 0, gasLeer: false, mise: false, wuerfe: 0, ergebnisse: [], hand: [], gespielt: false, turbo: false });
  const F = { stufe, anzahl, plan, sp: [sp(), sp()], dran: 0, phase: "wuerfeln", wurf: 0, stapel, ablage: [], log: [], zug: 0, erster: [], vorrat: Object.fromEntries(FDK_LAGER.map((l) => [l, FDK_VORRAT])) };
  F.sp[0].bon = fdkNeuerBon(plan[0][0]); F.sp[1].bon = fdkNeuerBon(plan[1][0]);
  const start = ["turbo", "abkuerzung", "liefer", "klau"][Math.floor(zufall() * 4) % 4]; F.sp[0].hand.push(start); F.sp[1].hand.push(start); // Startkarte – beide dieselbe (fair)
  return F;
}
const fdkG = (S) => FDK_GERICHTE[S.bon.g];
const fdkAlleZutaten = (S) => S.bon.hat.every(Boolean);
const fdkFertigGekocht = (S) => S.bon.schritt.every(Boolean);
const fdkFehlendeZutaten = (S) => fdkG(S)[3].filter((_, i) => !S.bon.hat[i]);
const fdkNaechsterSchritt = (S) => { const i = S.bon.schritt.indexOf(false); return i < 0 ? null : { i, st: fdkG(S)[4][i][0], text: fdkG(S)[4][i][1], zuege: fdkG(S)[4][i][2] }; };
// Was kann der Koch an Feld p gerade tun? (für „hier anhalten“ und die grünen Felder). F für den Vorrat (ohne F: unbegrenzt)
const fdkBrauchtVon = (S, l) => fdkG(S)[3].some((z, i) => z[0] === l && !S.bon.hat[i]);
const fdkLeerGebraucht = (F, S) => !!F && FDK_LAGER.some((l) => F.vorrat[l] <= 0 && fdkBrauchtVon(S, l));
function fdkNutzen(S, p, F) {
  if (S.fertig) return null;
  const f = FDK_FELD[p];
  if (FDK_LAGER.includes(f) && fdkBrauchtVon(S, f)) return F && F.vorrat[f] <= 0 ? null : "holen";
  const n = fdkNaechsterSchritt(S);
  if (n && n.st === f && fdkAlleZutaten(S)) return S.gasLeer && f === "herd" ? null : "kochen";
  if (f === "buero" && (S.gasLeer || fdkLeerGebraucht(F, S))) return "bestellen";
  if (f === "d") return "pass";
  return null;
}
// Zielfelder nach einem Wurf w: in beide Richtungen das Endfeld und jede nützliche Station unterwegs (dort anhalten)
function fdkOptionen(F, s, w) {
  const S = F.sp[s], m = new Map();
  for (const r of [1, -1]) {
    const weg = [];
    for (let i = 1; i <= w; i++) {
      const p = (S.pos + r * i + FDK_N * 10) % FDK_N; weg.push(p);
      const nutzen = fdkNutzen(S, p, F), ende = i === w;
      if (!ende && !(nutzen && nutzen !== "pass") && !(nutzen === "pass" && fdkAlleZutaten(S) && fdkFertigGekocht(S))) continue;
      const alt = m.get(p); if (!alt || alt.weg.length > weg.length) m.set(p, { feld: p, weg: [...weg], richtung: r, halt: !ende, nutzen });
    }
  }
  return [...m.values()];
}
const fdkKarteZiehen = (F) => { if (!F.stapel.length) { F.stapel = F.ablage.reverse(); F.ablage = []; } const k = F.stapel.pop(); F.ablage.push(k); return k; };
// eine Zutat fallen lassen (bevorzugt von einer bestimmten Station) – gibt die Zutat zurück oder null
function fdkVerliert(S, station, zufall) {
  const idx = S.bon.hat.map((h, i) => (h ? i : -1)).filter((i) => i >= 0 && !fdkFertigGekocht(S) && (!station || fdkG(S)[3][i][0] === station));
  if (!idx.length || S.bon.schritt.some(Boolean)) return null; // schon gekocht: nichts mehr zu verlieren
  const i = idx[Math.floor(zufall() * idx.length) % idx.length]; S.bon.hat[i] = false; return fdkG(S)[3][i];
}
// 🛡️ Sous-Chef auf der Hand fängt das nächste Pech ab
const fdkGeschuetzt = (S) => { const i = S.hand.indexOf("schutz"); if (i < 0) return false; S.hand.splice(i, 1); return true; };
// Ankunft auf Feld p: Station erledigen. Gibt Ereignisse zurück.
function fdkAnkunft(F, s, abgeben, zufall) {
  const S = F.sp[s], O = F.sp[1 - s], p = S.pos, ev = [], nutzen = fdkNutzen(S, p, F);
  if (nutzen === "holen") { fdkG(S)[3].forEach((z, i) => { if (z[0] === FDK_FELD[p] && !S.bon.hat[i]) { S.bon.hat[i] = true; ev.push({ art: "holt", z }); } });
    F.vorrat[FDK_FELD[p]]--; if (F.vorrat[FDK_FELD[p]] <= 0) ev.push({ art: "leer", l: FDK_FELD[p] }); }
  else if (nutzen === "kochen") { const n = fdkNaechsterSchritt(S), z = Math.max(1, n.zuege - (S.mise ? 1 : 0)); S.mise = false;
    if (z <= 1) { S.bon.schritt[n.i] = true; ev.push({ art: "kocht", text: n.text, st: n.st }); } else { S.wartet = z - 1; S.kochtGerade = n.i; ev.push({ art: "kochtLang", text: n.text, st: n.st, zuege: z }); } }
  else if (nutzen === "bestellen") { if (S.gasLeer) { S.gasLeer = false; ev.push({ art: "gas" }); }
    const leer = FDK_LAGER.filter((l) => F.vorrat[l] < FDK_VORRAT); if (leer.length) { for (const l of leer) F.vorrat[l] = FDK_VORRAT; ev.push({ art: "nachbestellt", l: leer }); } }
  else if (nutzen === "pass" && (abgeben || (fdkAlleZutaten(S) && fdkFertigGekocht(S)))) ev.push(fdkAbgeben(F, s));
  // Zusammenstoß: genau auf dem anderen Koch gelandet – nur im Gang (freie und ❗-Felder); an Stationen arbeiten beide friedlich nebeneinander
  if (!S.fertig && !O.fertig && O.pos === p && (FDK_FELD[p] === "f" || FDK_FELD[p] === "e")) {
    if (O.bon.hat.some(Boolean) && !O.bon.schritt.some(Boolean) && fdkGeschuetzt(O)) ev.push({ art: "geschuetzt", wer: 1 - s });
    else { const z = fdkVerliert(O, null, zufall); ev.push({ art: "stoss", z }); if (z) O.bon.pech = true; } }
  if (FDK_FELD[p] === "e" && !S.fertig) ev.push(...fdkKarte(F, s, zufall));
  return ev;
}
function fdkKarte(F, s, zufall) {
  const S = F.sp[s], k = fdkKarteZiehen(F), ev = [{ art: "karte", k }];
  if (FDK_AKTION.has(k)) { S.hand.push(k); if (S.hand.length > FDK_HAND) ev[0].weg = S.hand.shift(); ev[0].hand = true; return ev; }
  if (FDK_PECH.has(k) && fdkGeschuetzt(S)) { ev[0].geschuetzt = true; return ev; }
  if (k === "fallen") { const z = fdkVerliert(S, null, zufall); ev[0].z = z; if (z) S.bon.pech = true; }
  else if (k === "braun") { const z = fdkVerliert(S, "gemuese", zufall); ev[0].z = z; if (z) S.bon.pech = true; }
  else if (k === "warm") { const z = fdkVerliert(S, "kuehl", zufall); ev[0].z = z; if (z) S.bon.pech = true; }
  else if (k === "gas") { const brauch = fdkG(S)[4].some((x, i) => x[0] === "herd" && !S.bon.schritt[i]); if (brauch) { S.gasLeer = true; S.bon.pech = true; } ev[0].trifft = brauch; }
  else if (k === "schaum") { S.aussetzen++; S.bon.pech = true; }
  else if (k === "hygiene") F.phase = "frage"; // Bildschirm stellt die Frage, dann fdkHygiene(F, s, richtig)
  else if (k === "lob") { S.punkte += 2; }
  return ev;
}
// 🃏 Aktionskarte ausspielen (vor dem Würfeln, eine je Zug). Gibt { ev, zugVorbei } zurück – Abkürzung ersetzt das Würfeln.
function fdkKannSpielen(F, s, k) {
  const S = F.sp[s], O = F.sp[1 - s];
  if (F.dran !== s || F.phase !== "wuerfeln" || S.fertig || S.gespielt || !S.hand.includes(k)) return false;
  if (k === "schutz") return false; // wirkt von selbst
  if (k === "liefer") return S.bon.hat.includes(false);
  if (k === "klau") return !O.fertig && O.bon.hat.some(Boolean) && !O.bon.schritt.some(Boolean);
  if (k === "gaszu") return !O.fertig && !O.gasLeer && fdkG(O)[4].some((x, i) => x[0] === "herd" && !O.bon.schritt[i]);
  if (k === "abkuerzung") return fdkNaechstesZiel(S, F) != null;
  if (k === "mise") return !S.mise && S.bon.schritt.includes(false);
  return k === "turbo" && !S.turbo;
}
function fdkKarteSpielen(F, s, k, zufall = Math.random) {
  if (!fdkKannSpielen(F, s, k)) return null;
  const S = F.sp[s], O = F.sp[1 - s], ev = [{ art: "spielt", k }]; let zugVorbei = false;
  S.hand.splice(S.hand.indexOf(k), 1); S.gespielt = true;
  if (k === "turbo") S.turbo = true;
  else if (k === "mise") S.mise = true;
  else if (k === "liefer") { const i = S.bon.hat.indexOf(false); S.bon.hat[i] = true; ev[0].z = fdkG(S)[3][i]; }
  else if (k === "gaszu") { if (fdkGeschuetzt(O)) ev[0].geschuetzt = true; else { O.gasLeer = true; O.bon.pech = true; } }
  else if (k === "klau") {
    if (fdkGeschuetzt(O)) ev[0].geschuetzt = true;
    else { const idx = O.bon.hat.map((h, i) => (h ? i : -1)).filter((i) => i >= 0), brauch = idx.filter((i) => fdkG(S)[3].some((z, j) => z[2] === fdkG(O)[3][i][2] && !S.bon.hat[j]));
      const i = (brauch.length ? brauch : idx)[Math.floor(zufall() * (brauch.length || idx.length)) % (brauch.length || idx.length)], z = fdkG(O)[3][i];
      O.bon.hat[i] = false; O.bon.pech = true; ev[0].z = z;
      const j = fdkG(S)[3].findIndex((y, n) => y[2] === z[2] && !S.bon.hat[n]); if (j >= 0) { S.bon.hat[j] = true; ev[0].behalten = true; } } }
  else if (k === "abkuerzung") { fdkWurfBeginn(F, s); const ziel = fdkNaechstesZiel(S, F); S.pos = ziel; F.zug++; ev[0].feld = ziel; ev.push(...fdkAnkunftOhneKarte(F, s, zufall)); zugVorbei = true; }
  for (const e of ev) F.log.push({ s, e });
  return { ev, zugVorbei };
}
function fdkAnkunftOhneKarte(F, s, zufall) { const p = F.sp[s].pos, alt = FDK_FELD[p]; return alt === "e" ? [] : fdkAnkunft(F, s, false, zufall); }
function fdkHygiene(F, s, richtig) { const S = F.sp[s]; if (!richtig) { S.aussetzen++; S.bon.pech = true; } F.phase = "wuerfeln"; return { art: "hygiene", richtig }; }
// nächstes sinnvolles Feld für den Koch (kürzester Weg)
function fdkNaechstesZiel(S, F) {
  if (S.fertig) return null;
  const ziele = [];
  for (let p = 0; p < FDK_N; p++) { const n = fdkNutzen(S, p, F); if (n && (n !== "pass" || (fdkAlleZutaten(S) && fdkFertigGekocht(S)))) ziele.push(p); }
  if (!ziele.length) return null;
  return ziele.sort((a, b) => fdkAbstand(S.pos, a) - fdkAbstand(S.pos, b))[0];
}
// Abgeben am Pass + Klingel: Punkte für dieses Gericht
function fdkAbgeben(F, s) {
  const S = F.sp[s], G = fdkG(S), stufe = FDK_STUFEN[G[2]], nr = S.nr;
  const fehlZ = S.bon.hat.filter((h) => !h).length, fehlS = S.bon.schritt.filter((x) => !x).length, voll = !fehlZ && !fehlS;
  const richt = fdkRichtWuerfe(S.bon.g), tempo = voll ? Math.max(0, Math.min(10, richt - S.bon.uhr)) : 0;
  const erster = !F.erster[nr] ? (F.erster[nr] = s + 1, voll ? 3 : 0) : 0, sauber = voll && !S.bon.pech ? 2 : 0;
  const punkte = Math.max(0, stufe.grund + tempo + erster + sauber - 3 * fehlZ - 5 * fehlS);
  const e = { art: "abgabe", g: S.bon.g, nr, punkte, teile: { grund: stufe.grund, tempo, erster, sauber, fehlZ, fehlS }, minuten: S.bon.uhr * FDK_MIN, richtMin: richt * FDK_MIN };
  S.punkte += punkte; S.ergebnisse.push(e);
  S.nr++; if (S.nr >= F.anzahl) S.fertig = true; else S.bon = fdkNeuerBon(F.plan[s][S.nr]);
  return e;
}
// Ein Zug: Wurf w ist gefallen, Koch s geht zu option. abgeben = auch unvollständig abgeben (nur nach Rückfrage).
function fdkZiehen(F, s, option, { abgeben = false, zufall = Math.random } = {}) {
  const S = F.sp[s]; S.pos = option.feld; F.zug++;
  const ev = fdkAnkunft(F, s, abgeben, zufall);
  for (const e of ev) F.log.push({ s, e });
  return ev;
}
// Uhr läuft bei jedem eigenen Wurf (auch Aussetzen / Schmoren kosten Zeit)
function fdkWurfBeginn(F, s) { const S = F.sp[s]; S.wuerfe++; if (!S.fertig) S.bon.uhr++; }
// Augen eines Wurfs: mit ⚡ Turbo zwei Würfel
function fdkAugen(F, s, zufall = Math.random) { const S = F.sp[s], w = () => 1 + Math.floor(zufall() * 6) % 6; if (S.turbo) { S.turbo = false; const a = w(), b = w(); return { w: a + b, a, b }; } const a = w(); return { w: a, a }; }
// Wer ist als Nächstes dran? Aussetzen und Schmoren werden dabei automatisch abgearbeitet (mit Ereignis für die Anzeige).
function fdkWeiter(F) {
  const ev = [], S0 = F.sp[F.dran];
  if (S0.nochmal) { S0.nochmal = false; S0.gespielt = false; F.phase = "wuerfeln"; return [{ s: F.dran, e: { art: "nochmal" } }]; }
  for (let k = 0; k < 8; k++) {
    if (F.sp.every((S) => S.fertig)) { F.phase = "ende"; return ev; }
    F.dran = 1 - F.dran; const S = F.sp[F.dran];
    if (S.fertig) continue;
    if (S.wartet > 0) { fdkWurfBeginn(F, F.dran); S.wartet--; const e = { art: "wartet", rest: S.wartet };
      if (!S.wartet && S.kochtGerade != null) { S.bon.schritt[S.kochtGerade] = true; e.fertig = fdkG(S)[4][S.kochtGerade][1]; S.kochtGerade = null; }
      ev.push({ s: F.dran, e }); continue; }
    if (S.aussetzen > 0) { fdkWurfBeginn(F, F.dran); S.aussetzen--; ev.push({ s: F.dran, e: { art: "aussetzen" } }); continue; }
    S.gespielt = false; F.phase = "wuerfeln"; return ev;
  }
  F.phase = F.sp.every((S) => S.fertig) ? "ende" : "wuerfeln"; return ev;
}
// Twinkey wählt sein Zielfeld: Fortschritt zuerst, sonst so nah wie möglich ans nächste Ziel; Zusammenstoß mitnehmen
function fdkKiWahl(F, s, opts, zufall = Math.random) {
  const S = F.sp[s], O = F.sp[1 - s];
  const wert = (o) => { const n = o.nutzen; let w = 0;
    if (n === "pass" && fdkAlleZutaten(S) && fdkFertigGekocht(S)) w += 100; else if (n === "holen") w += 60; else if (n === "kochen") w += 70; else if (n === "bestellen") w += 65;
    const alt = S.pos; S.pos = o.feld; const z = fdkNaechstesZiel(S, F); w -= z == null ? 0 : fdkAbstand(o.feld, z) * 3; S.pos = alt;
    if (O.pos === o.feld && !O.fertig && O.bon.hat.some(Boolean) && (FDK_FELD[o.feld] === "f" || FDK_FELD[o.feld] === "e")) w += 8;
    if (FDK_FELD[o.feld] === "e") w -= 1;
    return w + zufall() * 0.5; };
  return [...opts].sort((a, b) => wert(b) - wert(a))[0];
}
// Twinkey spielt eine Karte aus, wenn sie gerade richtig nützt (oder null)
function fdkKiKarte(F, s) {
  const S = F.sp[s], O = F.sp[1 - s], ziel = fdkNaechstesZiel(S, F), weit = ziel == null ? 0 : fdkAbstand(S.pos, ziel);
  const gut = { liefer: true, klau: O.bon.hat.filter(Boolean).length >= 2 || fdkG(O)[3].some((z, i) => O.bon.hat[i] && fdkG(S)[3].some((y, j) => y[2] === z[2] && !S.bon.hat[j])),
    gaszu: fdkAlleZutaten(O) || O.bon.hat.filter(Boolean).length >= O.bon.hat.length - 1, abkuerzung: weit >= 6, turbo: weit >= 7, mise: fdkAlleZutaten(S) };
  return ["liefer", "abkuerzung", "gaszu", "klau", "mise", "turbo"].find((k) => gut[k] && fdkKannSpielen(F, s, k)) || null;
}
function fdkSieger(F) { const [a, b] = F.sp.map((S) => S.punkte); return a > b ? 0 : b > a ? 1 : -1; }
// ----- FDK Regeln Ende -----
// ----- Ansicht (KC-CLUB-FDK-RALLYE) -----
// Brett 7 × 7: außen der Rundweg (24 Felder), innen der Pass mit Klingel, Würfel und Ansage. Tabletts links (Du, rote Mütze)
// und rechts (Twinkey, blaue Mütze); auf schmalen Handys stehen sie nebeneinander über dem Brett.
const FDK_RING = (() => { const r = []; for (let x = 0; x < 7; x++) r.push([x, 0]); for (let y = 1; y < 7; y++) r.push([6, y]); for (let x = 5; x >= 0; x--) r.push([x, 6]); for (let y = 5; y >= 1; y--) r.push([0, y]); return r; })();
const FDK_KARTE_TEXT = {
  fallen: ["🫣", "Der Azubi ist gestolpert!", (z) => z ? `${z[1]} ${z[2]} liegt auf dem Boden – hol neue im ${FDK_ST[z[0]][1]}.` : "Zum Glück war noch nichts auf dem Tablett."],
  braun: ["🥦", "Das Gemüse ist schon braun!", (z) => z ? `${z[1]} ${z[2]} ist nicht mehr gut – hol frische im 🥕 Gemüse.` : "Zum Glück hattest du noch kein Gemüse geholt."],
  warm: ["🌡️", "Das Kühlhaus stand offen!", (z) => z ? `${z[1]} ${z[2]} ist nicht mehr kalt genug – hol neue im 🧊 Kühlhaus.` : "Zum Glück hattest du noch nichts aus dem Kühlhaus."],
  gas: ["🔥", "Der Gasherd hat kein Gas mehr!", (z, k) => k.trifft ? "Geh ins 📋 Büro und bestell neues – bis dahin bleibt der Herd aus." : "Den Herd brauchst du zum Glück nicht mehr."],
  schaum: ["🍟", "Die Fritteuse ist übergeschäumt!", () => "Erst putzen – einmal aussetzen."],
  hygiene: ["🧪", "Hygienekontrolle!", () => "Beantworte eine Küchenfrage. Richtig: weiter. Falsch: einmal aussetzen."],
  lob: ["⭐", "Ein Gast lobt die Küche!", () => "2 Extrapunkte."],
};
const FDK_TW = {
  start: ["Auf die Plätze, fertig, kochen!", "Heute koche ich dich unter den Tisch!", "Schürze an – los geht's!"],
  holt: ["Hab ich!", "Ab aufs Tablett damit.", "Eins nach dem anderen …"],
  kocht: ["Das brutzelt schön!", "Riechst du das?", "Jetzt wird gekocht!"],
  abgabe: ["Ding! Mein Gericht ist raus!", "Service! Einmal heiß und lecker!", "Bitte schön, Tisch drei!"],
  pechTw: ["Mist, so ein Pech!", "Das darf doch nicht wahr sein …", "Na toll – und jetzt?"],
  pechDu: ["Uiii – das war Pech!", "Kopf hoch, das holst du wieder auf!", "Ach herrje!"],
  stossTw: ["Tschuldigung – die Küche ist eng!", "Hoppla! Vorsicht, heiß!"],
  stossDu: ["Hey! Pass doch auf, wo du hinläufst!", "Aua – mein Tablett!"],
  gluck: ["Glück muss man haben!", "Läuft bei mir!", "Die Karte heb ich mir auf …"],
  holtDu: ["Na, schon wieder schneller als ich?", "Lass mir auch noch was übrig!", "Hmm, die hätte ich auch gebraucht …"],
  leer: ["Leer! Ha – da musst du jetzt ins Büro!", "Das war die letzte Kiste!"],
  karteTw: { turbo: "Turbo! Jetzt geht's ab!", abkuerzung: "Ich kenn da eine Abkürzung …", klau: "Danke, die nehm ich mit!", gaszu: "Ups – wer hat denn da am Gashahn gedreht? 😇", liefer: "Mein Lieferant ist pünktlich!", mise: "Mise en place – alles vorbereitet!" },
  beklaut: ["Hey! Das war meins!", "Na warte, das gibt Rache!"],
  gasWeg: ["Wer hat mir das Gas abgedreht?!", "Na super – ab ins Büro …"],
  sieg: ["Feierabend – und ich hab gewonnen! Revanche?", "Gewonnen! Die Küche gehört heute mir."],
  niederlage: ["Glückwunsch, Chefkoch! Du warst besser.", "Respekt – heute warst du schneller am Pass."],
};
let FDKP = (() => { let w = null; try { w = JSON.parse(localStorage.getItem(FDK_KEY) || "null"); } catch {}
  if (!w) try { const alt = JSON.parse(localStorage.getItem("kc_club_fdk2") || "null"); if (alt?.stand) w = { stand: alt.stand, regelnGesehen: false }; } catch {} // Spielstand aus dem alten Fang den Koch übernehmen
  if (w?.F) { if (!w.F.vorrat) w.F.vorrat = Object.fromEntries(FDK_LAGER.map((l) => [l, FDK_VORRAT])); for (const S of w.F.sp || []) { if (!S.hand) S.hand = []; S.gespielt = !!S.gespielt; S.turbo = !!S.turbo; } } // Partie aus der Vorversion weiterspielen
  return { stand: { ich: 0, pc: 0, remis: 0 }, regelnGesehen: false, stufe: "leicht", anzahl: 2, runde: 0, ...(w || {}), rollt: false, text: "", kette: false, anim: null, tw: "", fragt: false }; })();
const fdkMerken = () => { try { localStorage.setItem(FDK_KEY, JSON.stringify({ stand: FDKP.stand, regelnGesehen: FDKP.regelnGesehen, stufe: FDKP.stufe, anzahl: FDKP.anzahl, runde: FDKP.runde, F: FDKP.F || null, tw: FDKP.tw, text: FDKP.text })); } catch {} };
const fdkSichtbar = () => aktuelleAnsicht === "spiele" && SP.tab === "pc" && SP.art === "fdk";
// KC-CLUB-FDK-MG (2.219.0): gegen ein Mitglied steht dessen Vorname statt „Twinkey“ (FDK_MG wird nur beim Zeichnen gesetzt)
let FDK_MG = null;
let FDKM = { id: null, anim: null, rollt: false, fragt: false, klingelt: false, sendet: false, texte: [], gesehen: null };
const fdkUi = () => (FDK_MG ? FDKM : FDKP);
const fdkGeg = () => FDK_MG?.name || "Twinkey";
const fdkWer = (s) => (s ? fdkGeg() : "Du");
const fdkZuf = (l) => l[Math.floor(Math.random() * l.length)];
function fdkSag(text, tw = false) { // Ansage (mit 🔊), Twinkeys Sätze mit Männerstimme
  if (!text || !spAnsageAn("fdk") || aktuelleAnsicht !== "spiele") return;
  try { if (!("speechSynthesis" in window)) return; const u = new SpeechSynthesisUtterance(text.replace(/[\p{Extended_Pictographic}️‍]/gu, "").trim()); u.lang = "de-DE";
    if (tw) { const st = stimmeFuer("m"); if (st.voice) { u.voice = st.voice; u.lang = st.voice.lang; } u.pitch = st.pitch; } else { const st = deStimme(); if (st) { u.voice = st; u.lang = st.lang; } }
    speechSynthesis.speak(u); } catch {}
}
function fdkTw(art, k) { const t = k ? FDK_TW[art]?.[k] : fdkZuf(FDK_TW[art] || []); if (!t) return; FDKP.tw = t; fdkSag(t, true); }
// KC-CLUB-FDK-SPANNUNG: Geräusche (Schalter 🔔 Töne – derselbe wie beim Schach, je Gerät)
function fdkTon(art) {
  if (!schToeneAn() || aktuelleAnsicht !== "spiele") return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.();
    const ton = (t, f, laut, dauer, typ = "triangle", ziel = f) => { const o = audio.createOscillator(), g = audio.createGain(), s = audio.currentTime + t;
      o.type = typ; o.frequency.setValueAtTime(f, s); if (ziel !== f) o.frequency.exponentialRampToValueAtTime(ziel, s + dauer);
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(laut, s + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, s + dauer);
      o.connect(g).connect(audio.destination); o.start(s); o.stop(s + dauer + 0.03); };
    const rauschen = (t, dauer, laut, frq) => { const n = Math.floor(audio.sampleRate * dauer), buf = audio.createBuffer(1, n, audio.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const q = audio.createBufferSource(), fl = audio.createBiquadFilter(), g = audio.createGain();
      fl.type = "bandpass"; fl.frequency.value = frq; g.gain.value = laut; q.buffer = buf; q.connect(fl).connect(g).connect(audio.destination); q.start(audio.currentTime + t); };
    if (art === "wuerfel") for (let i = 0; i < 5; i++) ton(i * 0.07, 500 + Math.random() * 500, 0.12, 0.04, "square");
    else if (art === "schritt") ton(0, 340, 0.06, 0.05, "sine");
    else if (art === "holen") { ton(0, 520, 0.16, 0.08, "sine"); ton(0.07, 780, 0.16, 0.1, "sine"); }
    else if (art === "kochen") rauschen(0, 0.7, 0.35, 3200);
    else if (art === "pech") { ton(0, 440, 0.15, 0.18, "sawtooth", 300); ton(0.18, 330, 0.15, 0.3, "sawtooth", 200); }
    else if (art === "glueck") [523, 659, 784].forEach((f, i) => ton(i * 0.09, f, 0.14, 0.14, "sine"));
    else if (art === "karte") rauschen(0, 0.25, 0.5, 1800);
    else if (art === "leer") ton(0, 160, 0.16, 0.25, "square");
  } catch {}
}
function fdkKlingel() { // 🛎️ Pass-Klingel: zwei helle Töne
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.();
    for (const [f, t] of [[1568, 0], [2093, 0.02], [1568, 0.28]]) { const o = audio.createOscillator(), g = audio.createGain(), s = audio.currentTime + t;
      o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.18, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.9);
      o.connect(g).connect(audio.destination); o.start(s); o.stop(s + 1); } } catch {}
  try { navigator.vibrate?.([30, 40, 30]); } catch {}
}
// Text für ein Ereignis (für die Ansagezeile)
function fdkText(s, e) {
  const du = !s, wer = fdkWer(s);
  if (e.art === "holt") return `${wer} ${du ? "holst" : "holt"} ${e.z[1]} ${e.z[2]}.`;
  if (e.art === "kocht") return `${FDK_ST[e.st][0]} ${wer}: ${e.text} – erledigt.`;
  if (e.art === "kochtLang") return `${FDK_ST[e.st][0]} ${wer}: ${e.text} – dauert ${e.zuege} Züge.`;
  if (e.art === "gas") return `📋 ${wer} ${du ? "bestellst" : "bestellt"} neues Gas – der Herd geht wieder.`;
  if (e.art === "wartet") return e.fertig ? `✅ ${wer}: ${e.fertig} – fertig!` : `⏳ ${wer} ${du ? "wartest" : "wartet"} am Herd …`;
  if (e.art === "aussetzen") return `⏸ ${wer} ${du ? "setzt" : "setzt"} einmal aus.`;
  if (e.art === "nochmal") return `🎲 ${wer} ${du ? "darfst" : "darf"} noch einmal würfeln.`;
  if (e.art === "stoss") return e.z ? `💥 Zusammenstoß! ${du ? fdkGeg() + " lässt" : "Dir fällt"} ${e.z[1]} ${e.z[2]} ${du ? "fallen" : "herunter"}.` : "💥 Zusammenstoß – zum Glück ist nichts heruntergefallen.";
  if (e.art === "spueler") return `🧽 ${wer} ${du ? "gehst" : "geht"} direkt zu ${FDK_ST[FDK_FELD[e.feld]][0]} ${FDK_ST[FDK_FELD[e.feld]][1]}.`;
  if (e.art === "hygiene") return e.richtig ? `🧪 ${du ? "Richtig – Kontrolle bestanden!" : fdkGeg() + " besteht die Kontrolle."}` : `🧪 ${du ? "Leider falsch – einmal aussetzen." : fdkGeg() + " lag falsch und setzt einmal aus."}`;
  if (e.art === "wurf") return `🎲 ${wer} ${du ? "würfelst" : "würfelt"} ${fdkWurfText(e)}.`; // KC-CLUB-FDK-MG: Server-Ereignisse
  if (e.art === "lauf") return "";
  if (e.art === "karte" && e.hand && e.k === "verdeckt") return `🃏 ${wer} ${du ? "bekommst" : "bekommt"} eine Karte auf die Hand.`;
  if (e.art === "karte" && e.hand) { const A = FDK_AKTION_NAME[e.k]; return `🃏 ${wer} ${du ? "bekommst" : "bekommt"} ${A[0]} ${A[1]} auf die Hand.${e.weg ? ` (${FDK_AKTION_NAME[e.weg][1]} fällt weg – höchstens ${FDK_HAND} Karten.)` : ""}`; }
  if (e.art === "karte" && e.geschuetzt) { const K = FDK_KARTE_TEXT[e.k]; return `${K[0]} ${K[1]} – 🛡️ ${du ? "dein" : fdkGeg() + "s"} Sous-Chef hat aufgepasst, nichts passiert!`; }
  if (e.art === "karte") { const K = FDK_KARTE_TEXT[e.k]; return `${K[0]} ${du ? "" : fdkGeg() + ": "}${K[1]} ${K[2](e.z, e)}`; }
  if (e.art === "leer") return `📦 Das war die letzte Kiste – ${FDK_ST[e.l][0]} ${FDK_ST[e.l][1]} ist leer. Nachbestellen im 📋 Büro!`;
  if (e.art === "nachbestellt") return `📋 ${wer} ${du ? "bestellst" : "bestellt"} nach – ${e.l.map((l) => FDK_ST[l][0]).join(" ")} wieder voll.`;
  if (e.art === "geschuetzt") return `🛡️ ${e.wer ? fdkGeg() + "s" : "Dein"} Sous-Chef hat aufgepasst – nichts heruntergefallen!`;
  if (e.art === "spielt") { const A = FDK_AKTION_NAME[e.k], d = du ? "spielst" : "spielt";
    if (e.k === "turbo") return `⚡ ${wer} ${d} Turbo – mit zwei Würfeln!`;
    if (e.k === "abkuerzung") return `🚪 ${wer} ${du ? "nimmst" : "nimmt"} die Abkürzung zu ${FDK_ST[FDK_FELD[e.feld]][0]} ${FDK_ST[FDK_FELD[e.feld]][1] || "der Durchreiche"}.`;
    if (e.k === "liefer") return `🚚 ${wer} ${d} den Lieferanten – ${e.z[1]} ${e.z[2]} kommt aufs Tablett.`;
    if (e.k === "mise") return `🔪 ${wer} ${d} Mise en place – der nächste Arbeitsschritt geht sofort.`;
    if (e.geschuetzt) return `${A[0]} ${wer} ${d} ${A[1]} – aber 🛡️ der Sous-Chef ${du ? "von " + fdkGeg() : "von dir"} passt auf!`;
    if (e.k === "gaszu") return `🔧 ${wer} ${du ? "drehst " + fdkGeg() : "dreht dir"} das Gas ab – ${du ? fdkGeg() + " muss" : "du musst"} erst ins 📋 Büro!`;
    if (e.k === "klau") return `🤏 ${wer} ${du ? "klaust " + fdkGeg() : "klaut dir"} ${e.z[1]} ${e.z[2]}${e.behalten ? ` – ${du ? "die brauchst du selbst" : "gebraucht wird sie dort selbst"}!` : " – sie fällt herunter."}`;
    return `${A[0]} ${wer} ${d} ${A[1]}.`; }
  if (e.art === "abgabe") return `🛎️ ${wer}: ${FDK_GERICHTE[e.g][0]} ${FDK_GERICHTE[e.g][1]} am Pass – ${e.punkte} Punkte!`;
  return "";
}
function fdkTablett(F, s) {
  const S = F.sp[s], G = fdkG(S), richt = fdkRichtWuerfe(S.bon.g) * FDK_MIN, uhr = S.bon.uhr * FDK_MIN;
  const zut = G[3].map((z, i) => `<li class="${S.bon.hat[i] ? "ok" : ""}"><span>${S.bon.hat[i] ? "✅" : FDK_ST[z[0]][0]}</span><span class="fdk-tx">${z[1]} ${esc(z[2])}</span></li>`).join("");
  const sch = G[4].map((x, i) => `<li class="${S.bon.schritt[i] ? "ok" : S.kochtGerade === i ? "laeuft" : ""}"><span>${S.bon.schritt[i] ? "✅" : S.kochtGerade === i ? "⏳" : FDK_ST[x[0]][0]}</span><span class="fdk-tx">${esc(x[1])}${x[2] > 1 ? ` (${x[2]} Züge)` : ""}</span></li>`).join("");
  const sperre = S.gasLeer ? `<div class="fdk-sperre">🔥 kein Gas – erst 📋 Büro</div>` : S.aussetzen ? `<div class="fdk-sperre">⏸ setzt aus</div>` : "";
  return `<div class="fdk-tablett fdk-t${s}${F.dran === s && F.phase !== "ende" ? " dran" : ""}" aria-label="Tablett ${fdkWer(s)}">
    <div class="fdk-t-kopf"><span class="fdk-muetze fdk-m${s}">${s ? "🧑‍🍳" : "👨‍🍳"}</span><b>${esc(fdkWer(s))}</b><span class="fdk-pkt">⭐ ${S.punkte}</span></div>
    ${S.fertig ? `<div class="fdk-t-fertig">✅ Alle ${F.anzahl} Gerichte am Pass</div>` : `<div class="fdk-t-gericht">${G[0]} <b>${esc(G[1])}</b><small>${FDK_STUFEN[G[2]].name} · Gericht ${S.nr + 1} von ${F.anzahl}</small></div>
    <ul class="fdk-liste">${zut}</ul><ul class="fdk-liste fdk-schritte">${sch}<li class="${""}"><span>🛎️</span><span class="fdk-tx">an den Pass + klingeln</span></li></ul>
    <div class="fdk-uhr${uhr > richt ? " drueber" : ""}">⏱️ ${uhr} Min.<small>Richtzeit ${richt}</small></div>${sperre}`}
    ${s && S.hand?.length ? `<div class="fdk-t-hand" title="${esc(fdkGeg())}s Karten (verdeckt)">🃏 × ${S.hand.length}${S.hand.includes("schutz") ? " · 🛡️" : ""}</div>` : ""}</div>`;
}
function fdkBrettHtml(F) {
  const pos = fdkUi().anim || F.sp.map((S) => S.pos), wahl = F.phase === "wahl" && F.dran === 0 && !fdkUi().anim ? new Map(F.optionen.map((o) => [o.feld, o])) : null;
  const S0 = F.sp[0];
  const felder = FDK_FELD.map((f, i) => { const [x, y] = FDK_RING[i], koeche = [0, 1].filter((s) => pos[s] === i && !(F.sp[s].fertig && !fdkUi().anim)), st = FDK_ST[f];
    const nutzen = !S0.fertig && F.phase !== "ende" ? fdkNutzen(S0, i, F) : null, gut = nutzen && (nutzen !== "pass" || (fdkAlleZutaten(S0) && fdkFertigGekocht(S0)));
    const o = wahl?.get(i), kl = ["fdk-feld", "fdk-" + f, gut ? "fdk-gut" : "", o ? "fdk-ziel" + (o.halt ? " fdk-halt" : "") : ""].filter(Boolean).join(" ");
    const inhalt = `${st[0] ? `<span class="fdk-sym" aria-hidden="true">${st[0]}</span>` : ""}${f.length > 1 ? `<span class="fdk-name">${f === "gewuerz" ? "Gewürze" : st[1]}</span>` : ""}${o?.halt ? `<span class="fdk-halt-schild">Halt</span>` : ""}${F.vorrat && FDK_LAGER.includes(f) ? `<span class="fdk-vorrat${F.vorrat[f] <= 0 ? " leer" : ""}" title="Kisten im Vorrat">${F.vorrat[f] <= 0 ? "leer" : "📦" + F.vorrat[f]}</span>` : ""}`
      + (koeche.length ? `<span class="fdk-koeche">${koeche.map((s) => `<span class="fdk-muetze fdk-m${s}">${s ? "🧑‍🍳" : "👨‍🍳"}</span>`).join("")}</span>` : "");
    const name = `${st[1] || "Gang"}${koeche.length ? " – " + koeche.map(fdkWer).join(" und ") : ""}${o ? " – hierhin gehen" : ""}`;
    return o ? `<button class="${kl}" style="grid-column:${x + 1};grid-row:${y + 1}" onclick="${FDK_MG ? "fdkMgFeld" : "fdkFeldKlick"}(${i})" aria-label="${name}">${inhalt}</button>`
      : `<div class="${kl}" style="grid-column:${x + 1};grid-row:${y + 1}" aria-label="${name}">${inhalt}</div>`; }).join("");
  const ich = F.dran === 0 && F.phase === "wuerfeln" && (!FDK_MG || FDK_MG.dran) && !fdkUi().rollt && !fdkUi().anim && !fdkUi().fragt;
  const mitte = `<div class="fdk-mitte"><div class="fdk-pass"><span class="fdk-glocke${fdkUi().klingelt ? " klingelt" : ""}" aria-hidden="true">🛎️</span><b>Pass</b></div>
      ${F.phase === "ende" ? `<div class="fdk-ende-sym">🏁</div>` : maeWuerfelKnopf(F.wurf, { kann: ich, rollt: fdkUi().rollt, klick: FDK_MG ? "fdkMgWuerfeln()" : "fdkWuerfeln()", farbe: F.dran ? "blau" : "rot" })}
      <div class="fdk-wer-dran">${F.phase === "ende" ? "Feierabend!" : F.phase === "wahl" && F.dran === 0 ? "👆 Leuchtendes Feld antippen" : F.dran === 0 ? "👨‍🍳 Du bist dran" : `🧑‍🍳 ${esc(fdkGeg())} ist dran`}</div></div>`;
  return `<div class="fdk-brett" role="group" aria-label="Küche">${felder}${mitte}</div>`;
}
function fdkPcZeigen() {
  const F = FDKP.F, s = FDKP.stand;
  document.body.classList.toggle("sch-fokus", !!F && F.phase !== "ende" && fdkSichtbar()); // KC-CLUB-SCHACH-FOKUS: oben weg, Brett groß
  if (!F) {
    const wahl = (name, fn, wert, opt) => `<label>${name}<select onchange="${fn}(this.value)">${opt.map(([w, t]) => `<option value="${w}"${String(wert) === String(w) ? " selected" : ""}>${t}</option>`).join("")}</select></label>`;
    $("spInhalt").innerHTML = `<div class="karte sp-karte fdk-karte">
      <div class="sp-stand"><span>Du <b>${s.ich}</b></span><span>🤝 <b>${s.remis}</b></span><span><b>${s.pc}</b> 🧑‍🍳 Twinkey</span></div>
      <p style="margin:6px 0">🧑‍🍳 <b>Fang den Koch – Küchenrallye</b>: Du (rote Mütze) gegen Twinkey (blaue Mütze). Hol die Zutaten, koch das Gericht, ab an den Pass und klingeln!</p>
      <div class="sch-einst fdk-einst">${wahl("😊 Gerichte", "fdkStufe", FDKP.stufe, [["leicht", "Leicht"], ["mittel", "Mittel"], ["schwer", "Schwer"]])}${wahl("🍽️ Länge", "fdkAnzahl", FDKP.anzahl, [[1, "1 Gericht"], [2, "2 Gerichte"], [3, "3 Gerichte"]])}</div>
      <p class="hinweis" style="margin:6px 0">Leicht z. B. Pfannkuchen, mittel z. B. Gulasch, schwer z. B. Rinderroulade. Beide bekommen gleich schwere Gerichte.</p>
      ${spLeiste(spKnopf("▶", "Los geht’s", "fdkStart()", { haupt: true }), schTonKnopf(), spAnsageKnopf("fdk"), spKnopf("📖", "Regeln", "fdkRegeln()"), s.ich + s.pc + s.remis ? spStandKnopf("fdkStandWeg()") : "")}</div>`; return; }
  const sg = F.phase === "ende" ? fdkSieger(F) : null, [A, B] = F.sp.map((S) => S.punkte);
  const ende = F.phase !== "ende" ? "" : `<div class="sp-banner ${sg === 0 ? "sieg" : sg === 1 ? "niederlage" : "remis"}">${sg === 0 ? "🏆 Feierabend – du hast gewonnen!" : sg === 1 ? "Feierabend – 🧑‍🍳 Twinkey war besser." : "🤝 Feierabend – unentschieden!"} ⭐ ${A} : ${B}</div>${fdkAbrechnung(F)}`;
  $("spInhalt").innerHTML = `<div class="karte sp-karte fdk-karte">${ende}
      <div class="sch-twinkey" role="status" aria-live="polite"><span class="sch-tw-kopf" aria-hidden="true">🧑‍🍳</span><p class="sch-tw-blase"><b>Twinkey:</b> ${esc(FDKP.tw || "Auf die Plätze, fertig, kochen!")}</p></div>
      <div class="fdk-tisch">${fdkTablett(F, 0)}${fdkBrettHtml(F)}${fdkTablett(F, 1)}</div>
      ${fdkHandHtml(F)}
      <div class="sp-status fdk-ansage${F.dran === 0 && (F.phase === "wuerfeln" || F.phase === "wahl") ? " sp-ichdran" : ""}" aria-live="polite">${esc(FDKP.text || "🎲 Tippe auf den Würfel.")}</div>
      ${F.phase === "ende" ? spLeiste(spNeuKnopf("fdkStart()"), spKnopf("⚙️", "Einstellen", "FDKP.F=null;fdkMerken();fdkPcZeigen()"), schTonKnopf(), spAnsageKnopf("fdk"), spKnopf("📖", "Regeln", "fdkRegeln()"))
        : spLeiste(spKnopf("🎲", "Würfeln", "fdkWuerfeln()", { haupt: true, aus: !(F.dran === 0 && F.phase === "wuerfeln" && !FDKP.rollt && !FDKP.anim && !FDKP.fragt) }), fdkKannAbgeben(F) ? spKnopf("🛎️", "Jetzt abgeben", "fdkJetztAbgeben()") : "",
          spNeuKnopf("fdkAbbrechen(true)", "Neues Spiel", false), spAbbrechenKnopf("fdkAbbrechen()"), schTonKnopf(), spAnsageKnopf("fdk"), spKnopf("📖", "Regeln", "fdkRegeln()"))}
    </div>`;
}
function fdkAbrechnung(F) { // Punkte je Gericht nachvollziehbar
  const zeile = (s) => F.sp[s].ergebnisse.map((e) => { const t = e.teile;
    return `<tr><td>${s ? "🧑‍🍳" : "👨‍🍳"} ${FDK_GERICHTE[e.g][0]} ${esc(FDK_GERICHTE[e.g][1])}<small>${e.minuten} Min. (Richtzeit ${e.richtMin})</small></td><td>${t.grund}</td><td>${t.tempo ? "+" + t.tempo : "–"}</td><td>${t.erster ? "+3" : "–"}</td><td>${t.sauber ? "+2" : "–"}</td><td>${t.fehlZ || t.fehlS ? "−" + (3 * t.fehlZ + 5 * t.fehlS) : "–"}</td><td><b>${e.punkte}</b></td></tr>`; }).join("");
  return `<div class="fdk-abrechnung"><table><tr><th>Gericht</th><th>Grund</th><th>Tempo</th><th>Erster</th><th>Sauber</th><th>Fehlt</th><th>⭐</th></tr>${zeile(0)}${zeile(1)}</table></div>`;
}
const fdkStufe = (w) => { FDKP.stufe = FDK_STUFEN[w] ? w : "leicht"; fdkMerken(); };
const fdkAnzahl = (w) => { FDKP.anzahl = [1, 2, 3].includes(+w) ? +w : 2; fdkMerken(); };
function fdkRegeln(danach) {
  const bild = (n, sym, titel, text) => `<div class="fdk-regel"><div class="fdk-regel-nr">${n}</div><div class="fdk-regel-sym" aria-hidden="true">${sym}</div><div><b>${titel}</b><div class="hinweis" style="margin:2px 0 0">${text}</div></div></div>`;
  const f = blattAuf("fdkRegelBlatt", `<h3 style="margin:0 0 6px">📖 So geht Fang den Koch</h3>
    ${bild(1, "🧾", "Dein Bon", "Links liegt dein Tablett: das Gericht, die Zutaten (mit der Station, wo es sie gibt) und die Arbeitsschritte. Twinkey hat rechts ein gleich schweres Gericht.")}
    ${bild(2, "🎲", "Würfeln und laufen", "Würfeln – dann ein leuchtendes Feld antippen, links- oder rechtsherum. Kommst du an einer Station vorbei, die du brauchst, darfst du dort anhalten (Schild „Halt“) – die restlichen Augen verfallen. Grün = hier gibt es etwas für dich.")}
    ${bild(3, "🔥", "Kochen", "Erst alle Zutaten aufs Tablett, dann am 🔥 Herd, in der 🍟 Fritteuse oder im ♨️ Ofen zubereiten. Manches dauert 2 Züge.")}
    ${bild(4, "🛎️", "Pass und Klingel", "Fertig? An eine 🛎️ Durchreiche – dann ist das Gericht am Pass und deine Stoppuhr hält an. Wer es eilig hat, darf an der Durchreiche mit „🛎️ Jetzt abgeben“ auch früher klingeln. Jeder Wurf zählt 3 Küchenminuten. Punkte: Grundpunkte, Tempo unter der Richtzeit, +3 Erster am Pass, +2 ohne Pech; −3 je vergessene Zutat, −5 je fehlender Schritt.")}
    ${bild(5, "❗", "Ereignisse und Zusammenstoß", "Auf einem ❗-Feld ziehst du eine Karte. Pech wirkt sofort und hat eine Aufgabe (z. B. „kein Gas: erst ins 📋 Büro“). Landest du im Gang genau auf Twinkey, lässt er eine Zutat fallen – und umgekehrt!")}
    ${bild(6, "🃏", "Aktionskarten", "Glückskarten kommen auf die Hand (höchstens 3) – jeder startet mit einer. Vor dem Würfeln darfst du eine ausspielen: ⚡ Turbo (zwei Würfel), 🚪 Abkürzung, 🤏 Zutat klauen, 🔧 Twinkey das Gas abdrehen, 🚚 Lieferant, 🔪 Mise en place. 🛡️ Sous-Chef schützt von selbst vor dem nächsten Pech.")}
    ${bild(7, "📦", "Knappe Vorräte", "Jede Vorratsstation hat nur 2 Kisten – wer zuerst kommt, nimmt! Ist eine leer, muss jemand im 📋 Büro nachbestellen; das füllt für beide wieder auf.")}
    <div class="sp-knopfreihe"><button class="knopf haupt" id="fdkRegelOk"><span class="kt-ico">👍</span>Verstanden</button></div>`);
  f.style.zIndex = "2100";
  $("fdkRegelOk").onclick = () => { $("fdkRegelBlatt")?.remove(); FDKP.regelnGesehen = true; fdkMerken(); if (typeof danach === "function") danach(); };
}
async function fdkStandWeg() { if (!(await frage("Spielstand Fang den Koch auf 0 : 0 zurücksetzen?", { ja: "🗑️ Zurücksetzen", nein: "Abbrechen" }))) return; FDKP.stand = { ich: 0, pc: 0, remis: 0 }; fdkMerken(); fdkPcZeigen(); }
function fdkStart() {
  if (!FDKP.regelnGesehen) return fdkRegeln(fdkStart);
  FDKP.runde = (FDKP.runde || 0) + 1;
  const F = fdkNeu({ stufe: FDKP.stufe, anzahl: FDKP.anzahl }); F.dran = FDKP.runde % 2 ? 0 : 1; // wer anfängt, wechselt (fair)
  FDKP.F = F; FDKP.rollt = false; FDKP.anim = null; FDKP.fragt = false; fdkTw("start");
  FDKP.text = F.dran === 0 ? "Die Küche ist offen – du fängst an. Tippe auf den Würfel!" : "Die Küche ist offen – Twinkey fängt an.";
  fdkMerken(); fdkSag(FDKP.text); fdkPcZeigen(); if (F.dran === 1) fdkPcZug();
}
async function fdkWurfAnimation(F, s) { // gibt { w, a, b } zurück – mit ⚡ Turbo zwei Würfel
  FDKP.rollt = true; fdkPcZeigen(); fdkTon("wuerfel");
  const tick = setInterval(() => { const b = document.querySelector(".mae-wuerfel.rollt"); if (b) b.innerHTML = maeWuerfelSvg(1 + Math.floor(Math.random() * 6)); }, 80);
  try { navigator.vibrate?.(25); } catch {}
  await maeWarte(SPAR?.an ? 200 : 420); clearInterval(tick); FDKP.rollt = false;
  return fdkAugen(F, s);
}
const fdkWurfText = (r) => (r.b ? `${r.a} + ${r.b} = ${r.w} (⚡ Turbo)` : `${r.w}`);
async function fdkLaufen(F, s, weg) { // Koch läuft Feld für Feld
  FDKP.anim = F.sp.map((S) => S.pos);
  for (const p of weg) { FDKP.anim[s] = p; if (fdkSichtbar()) fdkPcZeigen(); fdkTon("schritt"); await maeWarte(SPAR?.an ? 80 : 170); if (FDKP.F !== F) return false; }
  FDKP.anim = null; return true;
}
// Ereignisse eines Zugs zeigen: Text, Twinkey-Spruch, Klingel, Karten (beim Menschen als Karte zum Antippen)
async function fdkEreignisse(F, s, ev) {
  const texte = ev.map((e) => fdkText(s, e)).filter(Boolean);
  if (texte.length) FDKP.text = texte.join(" ");
  for (const e of ev) {
    if (e.art === "abgabe") { FDKP.klingelt = true; fdkKlingel(); setTimeout(() => { FDKP.klingelt = false; if (fdkSichtbar()) fdkPcZeigen(); }, 1200); if (s) fdkTw("abgabe"); }
    if (e.art === "holt") { fdkTon("holen"); if (s ? Math.random() < 0.6 : Math.random() < 0.25) fdkTw(s ? "holt" : "holtDu"); }
    if (e.art === "kocht" || e.art === "kochtLang") { fdkTon("kochen"); if (s) fdkTw("kocht"); }
    if (e.art === "leer") { fdkTon("leer"); if (s) fdkTw("leer"); }
    if (e.art === "stoss" && e.z) { fdkTon("pech"); fdkTw(s ? "stossTw" : "stossDu"); }
    if (e.art === "geschuetzt") fdkTon("glueck");
    if (e.art === "karte") { const pech = FDK_PECH.has(e.k) && !e.geschuetzt && (e.z || e.trifft || e.k === "schaum"); if (pech) { fdkTon("pech"); fdkTw(s ? "pechTw" : "pechDu"); } else if (e.k !== "hygiene") { fdkTon("glueck"); if (s) fdkTw("gluck"); } }
  }
  fdkSag(FDKP.text); fdkMerken(); if (fdkSichtbar()) fdkPcZeigen();
  if (!s) for (const e of ev) {
    if (e.art === "karte" && e.k !== "hygiene") await fdkKarteZeigen(e);
    if (e.art === "abgabe") await fdkAbgabeZeigen(e);
  }
  if (F.phase === "frage") await fdkHygieneFrage(F, s);
}
function fdkKarteZeigen(e) {
  return new Promise((weiter) => { const K = FDK_KARTE_TEXT[e.k], pech = FDK_PECH.has(e.k), A = e.hand ? FDK_AKTION_NAME[e.k] : null;
    const bild = A ? `<div class="fdk-kartenbild glueck"><div class="fdk-k-sym">${A[0]}</div><b>Neue Karte: ${A[1]}</b><p>${esc(A[2])}.</p><p class="hinweis">${e.k === "schutz" ? "Sie wirkt von selbst beim nächsten Pech." : "Sie liegt jetzt unter dem Brett – vor dem Würfeln antippen, wenn du sie brauchst."}${e.weg ? ` (${FDK_AKTION_NAME[e.weg][1]} ist dafür weggefallen.)` : ""}</p></div>`
      : `<div class="fdk-kartenbild${pech && !e.geschuetzt ? " pech" : " glueck"}"><div class="fdk-k-sym">${K[0]}</div><b>${K[1]}</b><p>${e.geschuetzt ? "🛡️ Dein Sous-Chef hat aufgepasst – nichts passiert!" : esc(K[2](e.z, e))}</p></div>`;
    const f = blattAuf("fdkKarteBlatt", `${bild}
      <div class="sp-knopfreihe"><button class="knopf haupt" id="fdkKarteOk"><span class="kt-ico">👍</span>${pech && !e.geschuetzt && !A ? "Na gut" : "Prima"}</button></div>`);
    f.style.zIndex = "2100"; $("fdkKarteOk").onclick = () => { $("fdkKarteBlatt")?.remove(); weiter(); }; });
}
function fdkAbgabeZeigen(e) {
  return new Promise((weiter) => { const t = e.teile, G = FDK_GERICHTE[e.g];
    const f = blattAuf("fdkAbgabeBlatt", `<div class="fdk-kartenbild glueck"><div class="fdk-k-sym">🛎️</div><b>${G[0]} ${esc(G[1])} ist am Pass!</b>
      <p>⏱️ ${e.minuten} Küchenminuten (Richtzeit ${e.richtMin})</p>
      <table class="fdk-pkt-tab"><tr><td>Grundpunkte</td><td>${t.grund}</td></tr>${t.tempo ? `<tr><td>Tempo</td><td>+${t.tempo}</td></tr>` : ""}${t.erster ? `<tr><td>Erster am Pass</td><td>+3</td></tr>` : ""}${t.sauber ? `<tr><td>Sauber gearbeitet</td><td>+2</td></tr>` : ""}${t.fehlZ ? `<tr><td>${t.fehlZ} Zutat(en) vergessen</td><td>−${3 * t.fehlZ}</td></tr>` : ""}${t.fehlS ? `<tr><td>${t.fehlS} Schritt(e) nicht gekocht</td><td>−${5 * t.fehlS}</td></tr>` : ""}<tr><td><b>Punkte</b></td><td><b>${e.punkte}</b></td></tr></table></div>
      <div class="sp-knopfreihe"><button class="knopf haupt" id="fdkAbgabeOk"><span class="kt-ico">👍</span>Weiter</button></div>`);
    f.style.zIndex = "2100"; $("fdkAbgabeOk").onclick = () => { $("fdkAbgabeBlatt")?.remove(); weiter(); }; });
}
async function fdkHygieneFrage(F, s) { // 🧪 Küchenfrage aus „Küchenterror“ – Twinkey liegt zu 70 % richtig
  let richtig;
  if (s) richtig = Math.random() < 0.7;
  else { FDKP.fragt = true; let fr = null; try { const l = await ktFragenLaden(); fr = l[Math.floor(Math.random() * l.length)]; } catch {}
    if (!fr) richtig = true; // ohne Fragen (offline): bestanden
    else richtig = await new Promise((fertig) => { const ant = [fr.r, ...fr.x].sort(() => Math.random() - 0.5);
      const f = blattAuf("fdkFrageBlatt", `<h3 style="margin:0 0 6px">🧪 Hygienekontrolle</h3><p style="margin:0 0 8px"><b>${esc(fr.f)}</b></p>
        <div class="fdk-antworten">${ant.map((a, i) => `<button class="knopf" data-i="${i}">${esc(a)}</button>`).join("")}</div><div id="fdkFrageErg"></div>`);
      f.style.zIndex = "2100";
      f.querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => { const ok = ant[+b.dataset.i] === fr.r;
        f.querySelectorAll("[data-i]").forEach((x) => { x.disabled = true; if (ant[+x.dataset.i] === fr.r) x.classList.add("haupt"); });
        $("fdkFrageErg").innerHTML = `<p style="margin:8px 0">${ok ? "✅ Richtig – Kontrolle bestanden!" : "❌ Leider falsch – einmal aussetzen."}${fr.e ? `<br><small class="hinweis">${esc(fr.e)}</small>` : ""}</p><div class="sp-knopfreihe"><button class="knopf haupt" id="fdkFrageOk">Weiter</button></div>`;
        $("fdkFrageOk").onclick = () => { $("fdkFrageBlatt")?.remove(); fertig(ok); }; })); });
    FDKP.fragt = false; }
  const e = fdkHygiene(F, s, richtig); F.log.push({ s, e }); FDKP.text = fdkText(s, e); fdkSag(FDKP.text); fdkMerken(); if (fdkSichtbar()) fdkPcZeigen();
}
// nach jedem Zug: wer ist dran (Aussetzen/Schmoren laufen automatisch), Ende werten, Twinkey ziehen lassen
async function fdkNachZug(F) {
  if (F.phase === "frage") return;
  const ev = fdkWeiter(F); if (ev.length) { FDKP.text = (FDKP.text ? FDKP.text + " " : "") + ev.map((x) => fdkText(x.s, x.e)).join(" "); }
  fdkMerken();
  if (F.phase === "ende") return fdkWerten();
  if (fdkSichtbar()) fdkPcZeigen();
  if (F.dran === 1) fdkPcZug();
}
async function fdkWuerfeln() {
  const F = FDKP.F; if (!F || F.dran !== 0 || F.phase !== "wuerfeln" || FDKP.rollt || FDKP.anim || FDKP.fragt || SP.pause) return;
  fdkWurfBeginn(F, 0); const r = await fdkWurfAnimation(F, 0), w = r.w; if (FDKP.F !== F) return;
  F.wurf = Math.min(6, r.a); F.optionen = fdkOptionen(F, 0, w); F.phase = "wahl";
  FDKP.text = `Du würfelst ${fdkWurfText(r)}. Tippe ein leuchtendes Feld an${F.optionen.some((o) => o.halt) ? " – „Halt“ heißt: dort anhalten, Rest verfällt" : ""}.`;
  fdkMerken(); fdkPcZeigen();
}
async function fdkFeldKlick(p) {
  const F = FDKP.F; if (!F || F.dran !== 0 || F.phase !== "wahl" || FDKP.anim) return;
  const o = F.optionen.find((x) => x.feld === p); if (!o) return;
  F.phase = "laeuft"; FDKP.text = "";
  if (!(await fdkLaufen(F, 0, o.weg))) return;
  const ev = fdkZiehen(F, 0, o); F.optionen = null; if (F.phase === "laeuft") F.phase = "wuerfeln";
  if (!ev.length) FDKP.text = FDK_FELD[p] === "d" ? "Du stehst an der Durchreiche – mit „🛎️ Jetzt abgeben“ kannst du schon klingeln (kostet Punkte für Fehlendes)." : "Hier gibt es gerade nichts für dich.";
  await fdkEreignisse(F, 0, ev); if (FDKP.F !== F) return;
  await fdkNachZug(F);
}
// 🃏 Deine Karten: vor dem Würfeln eine ausspielen (Sous-Chef wirkt von selbst)
function fdkHandHtml(F) {
  const S = F.sp[0]; if (!S.hand?.length || F.phase === "ende") return "";
  const frei = F.dran === 0 && F.phase === "wuerfeln" && (!FDK_MG || FDK_MG.dran) && !fdkUi().anim && !fdkUi().rollt && !fdkUi().fragt;
  return `<div class="fdk-hand" aria-label="Deine Karten"><span class="fdk-hand-titel">🃏 Deine Karten${S.gespielt ? " (schon eine gespielt)" : S.turbo ? " – ⚡ Turbo bereit" : ""}</span>${S.hand.map((k) => { const A = FDK_AKTION_NAME[k], kann = frei && fdkKannSpielen(F, 0, k);
    return `<button class="fdk-handkarte${k === "schutz" ? " passiv" : ""}" ${kann ? `onclick="${FDK_MG ? "fdkMgKarte" : "fdkKarteAusspielen"}('${k}')"` : "disabled"} title="${esc(A[2])}"><span>${A[0]}</span><b>${A[1]}</b><small>${k === "schutz" ? "wirkt von selbst" : esc(A[2])}</small></button>`; }).join("")}</div>`;
}
async function fdkKarteAusspielen(k) {
  const F = FDKP.F; if (!F || F.dran !== 0 || F.phase !== "wuerfeln" || FDKP.anim || FDKP.rollt || FDKP.fragt) return;
  const r = fdkKarteSpielen(F, 0, k); if (!r) return;
  fdkTon("karte"); if (k === "klau" && !r.ev[0].geschuetzt) fdkTw("beklaut"); if (k === "gaszu" && !r.ev[0].geschuetzt) fdkTw("gasWeg");
  await fdkEreignisse(F, 0, r.ev); if (FDKP.F !== F) return;
  if (r.zugVorbei) return fdkNachZug(F);
  if (k === "turbo") FDKP.text += " Jetzt würfeln!";
  fdkMerken(); fdkPcZeigen();
}
// 🛎️ Jetzt abgeben: an einer Durchreiche darf man jederzeit klingeln – auch wenn noch etwas fehlt (nach Rückfrage, kostet Punkte)
const fdkKannAbgeben = (F) => F && F.dran === 0 && F.phase === "wuerfeln" && !FDKP.anim && !FDKP.rollt && !FDKP.fragt && !F.sp[0].fertig && FDK_FELD[F.sp[0].pos] === "d";
async function fdkJetztAbgeben() {
  const F = FDKP.F; if (!fdkKannAbgeben(F)) return; const S = F.sp[0];
  const fehlt = [...fdkFehlendeZutaten(S).map((z) => `${z[1]} ${z[2]}`), ...fdkG(S)[4].filter((_, i) => !S.bon.schritt[i]).map((x) => `${FDK_ST[x[0]][0]} ${x[1]}`)];
  if (fehlt.length && !(await frage(`Jetzt schon abgeben und klingeln? Es fehlt noch: ${fehlt.join(", ")}. Das kostet Punkte (−3 je Zutat, −5 je Schritt).`, { ja: "🛎️ Trotzdem abgeben", nein: "Weiterkochen" }))) return;
  if (FDKP.F !== F || !fdkKannAbgeben(F)) return;
  const e = fdkAbgeben(F, 0); F.log.push({ s: 0, e });
  await fdkEreignisse(F, 0, [e]); if (FDKP.F !== F) return;
  if (S.fertig) await fdkNachZug(F); else { FDKP.text += " Neuer Bon – würfeln!"; fdkMerken(); fdkPcZeigen(); }
}
async function fdkPcZug() { // Twinkey zieht von selbst – auch mehrmals hintereinander („Der Chef hilft mit“, oder wenn du schon fertig bist)
  if (FDKP.kette) return; FDKP.kette = true;
  try {
    for (let k = 0; k < 200; k++) {
      const F = FDKP.F; if (!F || F.dran !== 1 || F.phase !== "wuerfeln" || !fdkSichtbar()) return;
      if (spPauseHalt(fdkPcZug)) return;
      await maeWarte(SPAR?.an ? 250 : 450); if (FDKP.F !== F || !fdkSichtbar()) return;
      const karte = fdkKiKarte(F, 1);
      if (karte) { const r = fdkKarteSpielen(F, 1, karte); fdkTon("karte"); fdkTw("karteTw", karte);
        await fdkEreignisse(F, 1, r.ev); if (FDKP.F !== F) return; await maeWarte(SPAR?.an ? 300 : 700);
        if (r.zugVorbei) { await fdkNachZug(F); if (F.dran !== 1 || F.phase !== "wuerfeln") return; continue; } }
      fdkWurfBeginn(F, 1); const r = await fdkWurfAnimation(F, 1), w = r.w; if (FDKP.F !== F) return;
      F.wurf = Math.min(6, r.a); const o = fdkKiWahl(F, 1, fdkOptionen(F, 1, w));
      FDKP.text = `🧑‍🍳 Twinkey würfelt ${fdkWurfText(r)}.`; F.phase = "laeuft";
      if (!(await fdkLaufen(F, 1, o.weg))) return;
      const ev = fdkZiehen(F, 1, o); if (F.phase === "laeuft") F.phase = "wuerfeln";
      if (!ev.length) FDKP.text = `🧑‍🍳 Twinkey würfelt ${w} und läuft weiter.`;
      await fdkEreignisse(F, 1, ev); if (FDKP.F !== F) return;
      await fdkNachZug(F); // ruft fdkPcZug nicht doppelt auf (Kette läuft schon)
      if (F.dran !== 1 || F.phase !== "wuerfeln") return;
    }
  } finally { FDKP.kette = false; }
}
function fdkWerten() {
  const F = FDKP.F; if (!F || F.phase !== "ende" || F.gewertet) return;
  F.gewertet = true; const sg = fdkSieger(F), [a, b] = F.sp.map((S) => S.punkte);
  if (sg === 0) FDKP.stand.ich++; else if (sg === 1) FDKP.stand.pc++; else FDKP.stand.remis++;
  fdkTw(sg === 1 ? "sieg" : "niederlage");
  FDKP.text = sg === 0 ? `Feierabend! Du gewinnst mit ${a} zu ${b} Punkten.` : sg === 1 ? `Feierabend! Twinkey gewinnt mit ${b} zu ${a} Punkten.` : `Feierabend! Unentschieden, ${a} zu ${b}.`;
  fdkMerken(); fdkSag(FDKP.text);
  try { navigator.vibrate?.(sg === 0 ? [60, 40, 60, 40, 120] : 80); } catch {}
  fdkPcZeigen();
}
async function fdkAbbrechen(neu = false) { // KC-CLUB-SPIELE-LEISTE: neu = gleich ein neues Spiel mit denselben Einstellungen
  const F = FDKP.F; if (!F || F.phase === "ende") return;
  try { speechSynthesis.cancel(); } catch {}
  if (!(await frage(`${neu ? "Neues Spiel beginnen?" : "Spiel abbrechen?"} Diese Partie wird nicht gewertet – dein Spielstand bleibt.`, { ja: neu ? "↺ Neues Spiel" : "✖ Abbrechen", nein: "▶ Weiterspielen" }))) { if (FDKP.F === F && F.dran === 1) fdkPcZug(); return; }
  if (FDKP.F !== F) return; FDKP.F = null; FDKP.rollt = false; FDKP.anim = null; fdkMerken();
  if (neu) return fdkStart();
  if (fdkSichtbar()) fdkPcZeigen(); melde("Spiel abgebrochen – nicht gewertet.");
}
// ----- KC-CLUB-FDK-MG (2.219.0, Wunsch Hansi „auch gegen Mitglieder mit Terminabfrage“): Fang den Koch gegen ein Mitglied -----
// Der Server würfelt, mischt und prüft jeden Schritt (Karte → würfeln → Feld; 🧪 Frage; 🛎️ Jetzt abgeben). Die App bekommt die eigene
// Sicht (ich = Koch 0, rote Mütze) und zeichnet sie mit demselben Brett wie gegen Twinkey. Termin vorschlagen wie bei allen Partien.
function fdkMgDialoge(F, vor) { // eigene neue Karten / Abgaben als Fenster zeigen (wie gegen Twinkey)
  return (F.log || []).filter((x) => x.n > vor && x.s === 0 && ((x.e.art === "karte" && x.e.k !== "hygiene" && x.e.k !== "verdeckt") || x.e.art === "abgabe" || x.e.art === "hygiene")).map((x) => x.e);
}
function fdkSpielZeigen(g) {
  if (FDKM.id !== g.id) FDKM = { id: g.id, anim: null, rollt: false, fragt: false, klingelt: false, sendet: false, texte: [], gesehen: null };
  const F = g.fdk; if (!F) { $("spInhalt").innerHTML = '<div class="karte hinweis">Wird geladen …</div>'; return; }
  FDK_MG = { name: g.gegner.vorname, dran: g.ichDran && g.status === "laeuft" && !FDKM.sendet };
  try {
    const neu = FDKM.gesehen == null ? [] : (F.log || []).filter((x) => x.n > FDKM.gesehen);
    if (FDKM.gesehen == null) FDKM.texte = (F.log || []).slice(-4).map((x) => fdkText(x.s, x.e)).filter(Boolean);
    else if (neu.length) {
      FDKM.texte = [...FDKM.texte, ...neu.map((x) => fdkText(x.s, x.e)).filter(Boolean)].slice(-6);
      const seine = neu.filter((x) => x.s === 1);
      if (seine.length) { spSag("fdk", seine.map((x) => fdkText(1, x.e)).filter(Boolean).join(" "), `fdkm:${g.id}:${F.n}`, true);
        const arten = new Set(seine.map((x) => x.e.art));
        if (arten.has("abgabe")) fdkKlingel(); else if (arten.has("stoss") || arten.has("hygiene")) fdkTon("pech"); else if (arten.has("kocht") || arten.has("kochtLang")) fdkTon("kochen"); else if (arten.has("holt")) fdkTon("holen"); else if (arten.has("wurf")) fdkTon("wuerfel"); }
    }
    FDKM.gesehen = F.n;
    const banner = g.status === "beendet" ? (g.ergebnis === "gewonnen" ? `<div class="sp-banner sieg">🏆 Feierabend – du hast gewonnen!${g.aufgegeben ? ` ${esc(g.gegner.vorname)} hat aufgegeben.` : ` ${F.sp[0].punkte} : ${F.sp[1].punkte} Punkte`}</div>`
        : g.ergebnis === "verloren" ? `<div class="sp-banner niederlage">${g.aufgegeben ? "Du hast aufgegeben." : `Feierabend – ${esc(g.gegner.vorname)} gewinnt ${F.sp[1].punkte} : ${F.sp[0].punkte}.`}</div>` : `<div class="sp-banner remis">🤝 Unentschieden – ${F.sp[0].punkte} : ${F.sp[1].punkte}</div>`)
      : g.status === "angefragt" ? `<div class="sp-status">⏳ Warte, bis ${esc(g.gegner.vorname)} annimmt …</div>`
      : g.status !== "laeuft" ? `<div class="sp-status">Diese Partie findet nicht statt.</div>`
      : `<div class="sp-status fdk-ansage${g.ichDran ? " sp-ichdran" : ""}" aria-live="polite">${g.ichDran ? (F.phase === "wahl" ? `Du hast ${esc(fdkWurfText(F.augen || { w: F.wurf }))} gewürfelt – 👆 tippe ein leuchtendes Feld an.` : F.phase === "frage" ? "🧪 Hygienekontrolle – beantworte die Frage." : "🎲 Du bist dran – würfeln (oder vorher eine Karte ausspielen).") : `⏳ ${esc(g.gegner.vorname)} ist dran …`}</div>`;
    const laeuft = g.status === "laeuft", kannAbgeben = laeuft && g.ichDran && F.phase === "wuerfeln" && !F.sp[0].fertig && FDK_FELD[F.sp[0].pos] === "d" && !FDKM.sendet;
    $("spInhalt").innerHTML = `<div class="karte sp-karte fdk-karte">
      <div class="zeile" style="border:none;padding:0"><button class="knopf klein" onclick="SP.offen=null;spZeigen();spLaden(true)">‹ Übersicht</button><b style="flex:1;text-align:right">🧑‍🍳 Du gegen ${esc(g.gegner.vorname)}<br><small class="hinweis">${FDK_STUFEN[F.stufe]?.name || ""} · ${F.anzahl} ${F.anzahl === 1 ? "Gericht" : "Gerichte"}</small></b></div>
      ${banner}
      <div class="fdk-tisch">${fdkTablett(F, 0)}${fdkBrettHtml(F)}${fdkTablett(F, 1)}</div>
      ${laeuft ? fdkHandHtml(F) : ""}
      ${FDKM.texte.length && g.status !== "angefragt" ? `<div class="mae-verlauf" aria-live="polite"><b>Zuletzt:</b>${FDKM.texte.slice(-4).map((t) => `<div>${esc(t)}</div>`).join("")}</div>` : ""}
      ${spTerminHtml(g)}
      <p class="hinweis" style="text-align:center;margin:6px 0">${laeuft ? `Du musst nicht warten – ${esc(g.gegner.vorname)} bekommt Bescheid, wenn ${esc(g.gegner.vorname)} dran ist. Der Server würfelt und mischt – niemand kann schummeln.` : ""}</p>
      ${spLeiste(laeuft && g.ichDran && F.phase === "wuerfeln" ? spKnopf("🎲", "Würfeln", "fdkMgWuerfeln()", { haupt: true, aus: FDKM.sendet || FDKM.rollt }) : "", kannAbgeben ? spKnopf("🛎️", "Jetzt abgeben", "fdkMgAbgeben()") : "",
        g.status === "beendet" ? spKnopf("↺", "Revanche", `spRevanche('${g.id}')`, { haupt: true }) : laeuft ? spKnopf("🏳️", "Aufgeben", `spAufgeben('${g.id}')`) : "", schTonKnopf(), spAnsageKnopf("fdk"), spKnopf("📖", "Regeln", "fdkRegeln()"))}
    </div>`;
  } finally { FDK_MG = null; }
  if (g.ichDran && g.status === "laeuft" && F.phase === "frage" && F.frage && !FDKM.fragt && !FDKM.sendet) fdkMgFrage(F.frage);
}
async function fdkMgZug(zug) {
  const g = SP.offen; if (!g?.ichDran || FDKM.sendet) return null;
  FDKM.sendet = true; const vor = g.fdk?.n ?? 0;
  try { SP.offen = (await api("spiel_zug", { id: g.id, zug, zuege: g.zuege })).spiel; }
  catch (e) { meldeFehler(e); try { SP.offen = (await api("spiel_holen", { id: g.id })).spiel; } catch {} }
  finally { FDKM.sendet = false; }
  if (aktuelleAnsicht !== "spiele" || SP.offen?.id !== g.id) return null;
  const F = SP.offen.fdk; spZeigen();
  for (const e of F ? fdkMgDialoge(F, vor) : []) {
    if (e.art === "abgabe") { FDKM.klingelt = true; fdkKlingel(); setTimeout(() => { FDKM.klingelt = false; }, 1200); await fdkAbgabeZeigen(e); }
    else if (e.art === "karte") { fdkTon(FDK_PECH.has(e.k) && !e.geschuetzt ? "pech" : "glueck"); await fdkKarteZeigen(e); }
    else if (e.art === "hygiene") await new Promise((weiter) => { const f = blattAuf("fdkFrageBlatt", `<h3 style="margin:0 0 6px">🧪 Hygienekontrolle</h3><p style="margin:0 0 8px"><b>${esc(e.frage || "")}</b></p>
        <p style="margin:8px 0">${e.richtig ? "✅ Richtig – Kontrolle bestanden!" : `❌ Leider falsch – einmal aussetzen.<br>Richtig ist: <b>${esc(e.r || "")}</b>`}${e.erkl ? `<br><small class="hinweis">${esc(e.erkl)}</small>` : ""}</p>
        <div class="sp-knopfreihe"><button class="knopf haupt" id="fdkFrageOk">Weiter</button></div>`); f.style.zIndex = "2100"; fdkTon(e.richtig ? "glueck" : "pech"); $("fdkFrageOk").onclick = () => { $("fdkFrageBlatt")?.remove(); weiter(); }; });
  }
  return SP.offen;
}
async function fdkMgWuerfeln() {
  const g = SP.offen; if (!g?.ichDran || g.fdk?.phase !== "wuerfeln" || FDKM.sendet || FDKM.rollt) return;
  FDKM.rollt = true; spZeigen(); fdkTon("wuerfel");
  const tick = setInterval(() => { const b = document.querySelector(".mae-wuerfel.rollt"); if (b) b.innerHTML = maeWuerfelSvg(1 + Math.floor(Math.random() * 6)); }, 80);
  try { navigator.vibrate?.(25); } catch {}
  const t0 = Date.now(), warten = maeWarte(450); await Promise.all([fdkMgZug({ wuerfeln: true }).catch(() => null), warten]);
  clearInterval(tick); FDKM.rollt = false; if (Date.now() - t0 >= 0 && SP.offen?.id === g.id && aktuelleAnsicht === "spiele") spZeigen();
}
async function fdkMgFeld(p) {
  const g = SP.offen, F = g?.fdk; if (!g?.ichDran || F?.phase !== "wahl" || FDKM.sendet || FDKM.anim) return;
  const o = (F.optionen || []).find((x) => x.feld === p); if (!o) return;
  FDKM.anim = F.sp.map((S) => S.pos); // Koch läuft Feld für Feld, dann prüft der Server
  for (const q of o.weg) { FDKM.anim[0] = q; spZeigen(); fdkTon("schritt"); await maeWarte(SPAR?.an ? 80 : 150); if (SP.offen?.id !== g.id) break; }
  FDKM.anim = null; await fdkMgZug({ feld: p });
}
async function fdkMgKarte(k) { const g = SP.offen; if (!g?.ichDran || g.fdk?.phase !== "wuerfeln" || FDKM.sendet) return; fdkTon("karte"); await fdkMgZug({ karte: k }); }
async function fdkMgAbgeben() {
  const g = SP.offen, F = g?.fdk; if (!g?.ichDran || F?.phase !== "wuerfeln" || FDKM.sendet) return; const S = F.sp[0];
  const fehlt = [...fdkFehlendeZutaten(S).map((z) => `${z[1]} ${z[2]}`), ...fdkG(S)[4].filter((_, i) => !S.bon.schritt[i]).map((x) => `${FDK_ST[x[0]][0]} ${x[1]}`)];
  if (fehlt.length && !(await frage(`Jetzt schon abgeben und klingeln? Es fehlt noch: ${fehlt.join(", ")}. Das kostet Punkte (−3 je Zutat, −5 je Schritt).`, { ja: "🛎️ Trotzdem abgeben", nein: "Weiterkochen" }))) return;
  await fdkMgZug({ abgeben: true });
}
function fdkMgFrage(fr) { // 🧪 die Frage stellt der Server (aus Küchenterror) – die richtige Antwort kennt nur er
  FDKM.fragt = true;
  const f = blattAuf("fdkFrageBlatt", `<h3 style="margin:0 0 6px">🧪 Hygienekontrolle</h3><p style="margin:0 0 8px"><b>${esc(fr.f)}</b></p>
    <div class="fdk-antworten">${fr.a.map((a, i) => `<button class="knopf" data-i="${i}">${esc(a)}</button>`).join("")}</div>`);
  f.style.zIndex = "2100";
  f.querySelectorAll("[data-i]").forEach((b) => (b.onclick = async () => { f.remove(); await fdkMgZug({ antwort: Number(b.dataset.i) }); FDKM.fragt = false; }));
}
function fdkFortsetzen() { // nach dem Neuladen: halbe Züge sauber fortsetzen
  const F = FDKP.F; if (!F || F.phase === "ende") return;
  if (F.phase === "laeuft") { F.phase = F.dran === 0 && F.optionen ? "wahl" : "wuerfeln"; }
  if (F.phase === "frage") { fdkHygieneFrage(F, F.dran).then(() => fdkNachZug(F)); return; }
  if (F.dran === 1 && !FDKP.kette && !FDKP.rollt) setTimeout(fdkPcZug, 400);
}

// ---------- KC-CLUB-KUECHENTERROR (2.14.0, Wunsch Hansi): Küchenquiz auf Zeit – Fragen aus dem Profi-Küchenalltag ----------
// 4 Antworten, nur eine richtig. Zeitbalken 10 Sekunden. Punkte: richtig = 100 + Zeitbonus bis 100 (je schneller, desto mehr),
// falsch oder zu spät = 0. Gegen den Computer: abwechselnd je eine Frage (12 Fragen, je 6), nur auf dem Gerät.
// Gegen Mitglieder: 4 Runden à 3 Fragen, abwechselnd wie beim Quizduell; der Server stellt die Fragen, misst die Zeit und wertet.
// Fragen: lib/kuechenterror/fragen.js (eine Quelle, Server bekommt eine wörtliche Kopie).
const KT_MS = 10000, KT_KEY = "kc_club_kuechenterror_pc";
// 2.16.0 (Wunsch Hansi): Zeit je Frage nach Stufe – leicht 20 s, mittel 15 s, schwer 10 s (wie bisher)
const KT_ZEIT = { leicht: 20000, mittel: 15000, schwer: KT_MS };
const ktpLimit = () => KT_ZEIT[KTP.staerke] || KT_MS;
let KT_FRAGEN_L = null;
async function ktFragenLaden() { if (!KT_FRAGEN_L) KT_FRAGEN_L = (await import(new URL("lib/kuechenterror/fragen.js?v=3", location.href).href)).KT_FRAGEN /* 2.730.0 KC-CLUB-TEILE: Adresse zur Seite, nicht zum Teil */; return KT_FRAGEN_L; }
const ktMischen = (l) => { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// KC-CLUB-KUECHENTERROR-ABWECHSLUNG (2.25.0): Liste der zuletzt gespielten Frage-ids (neueste zuerst), nur auf diesem Gerät
const KT_ZULETZT_MAX = 150;
function ktZuletzt() { try { const l = JSON.parse(localStorage.getItem("kc_club_kt_zuletzt") || "[]"); return Array.isArray(l) ? l : []; } catch { return []; } }
function ktZuletztMerken(ids) { try { const l = [...ids, ...ktZuletzt().filter((id) => !ids.includes(id))].slice(0, KT_ZULETZT_MAX); localStorage.setItem("kc_club_kt_zuletzt", JSON.stringify(l)); } catch {} }
// ungespielte zuerst (gemischt), dann die am längsten zurückliegenden
const ktWahl = (pool, zuletzt, n) => { const rang = (id) => { const i = zuletzt.indexOf(id); return i < 0 ? 1e9 : i; }; return ktMischen(pool).sort((a, b) => rang(b) - rang(a)).slice(0, n); };
const ktPunkte = (ok, ms, lim = KT_MS) => (ok && ms <= lim ? 100 + Math.round(100 * (1 - ms / lim)) : 0); // Zeitbonus relativ zur Stufe
const ktSek = (ms) => (ms / 1000).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
// Frage mit Zeitbalken; aufl = Auflösung (richtig/gewaehlt/ok/p/ms/e) – dann sind die Knöpfe gesperrt und eingefärbt
function ktFrageHtml(fr, { klick = "", aufl = null, kopf = "", denkt = false } = {}) {
  const lim = fr.limitMs || KT_MS, rest = aufl ? Math.max(0, lim - (aufl.ms || 0)) : lim;
  return `${kopf}${fr.m ? '<div class="kt-meister">🎖️ Meisterfrage – richtig zählt doppelt!</div>' : ""}<div class="kt-frage">${esc(fr.f)}</div>
    <div class="kt-zeit" role="timer" aria-label="Zeit: ${lim / 1000} Sekunden"><i ${aufl ? "" : 'id="ktBalken"'} style="width:${(rest / lim * 100).toFixed(1)}%;background:${rest / lim > 0.45 ? "#27ae60" : rest / lim > 0.2 ? "#f1c40f" : "#c0392b"}"></i></div>
    ${aufl ? "" : '<div class="kt-uhr"><span id="ktLesen" class="kt-lesen-zahl versteckt" aria-live="polite"></span><span id="ktSek"></span></div>'}
    <div class="kt-antworten${aufl ? "" : " kt-lesen"}">${fr.a.map((t, i) => `<button class="kt-antwort${aufl ? (i === aufl.richtig ? " richtig" : i === aufl.gewaehlt ? " falsch" : "") : ""}${denkt ? " denkt" : ""}" ${aufl || !klick ? "disabled" : ""} ${klick ? `onpointerdown="ktTipp(this, ${i}, '${klick}')" onclick="ktTipp(this, ${i}, '${klick}')"` : ""}>${"ABCD"[i]}) ${esc(t)}</button>`).join("")}</div>
    ${aufl ? "" : '<div class="kt-uhr" id="ktGetippt" aria-live="polite"></div>'}
    ${aufl ? `<div class="kt-ergebnis">${aufl.ok ? `✅ Richtig in ${ktSek(aufl.ms)} s – <b>+${aufl.p} Punkte${fr.m ? " (doppelt!)" : ""}</b>` : aufl.gewaehlt < 0 || aufl.zuSpaet ? "⏰ Zeit abgelaufen – 0 Punkte" : "❌ Leider falsch – 0 Punkte"}</div>
      <p class="kt-erkl">💡 ${esc(aufl.e || "")}</p>` : ""}`;
}
// KC-CLUB-KUECHENTERROR-WAECHTER (2.17.0, Fund Hansi „die Zeit läuft nicht gleichmäßig“): Zeit-Wächter statt CSS-Animation.
// Er rechnet alle 0,1 s mit der festen Endzeit (Uhrzeit) – Balken und Sekunden zeigen immer die echte Restzeit, auch wenn das Handy
// kurz hängt, neu zeichnet oder im Hintergrund war; läuft die Zeit ab, löst der Wächter genau einmal „Zeit abgelaufen“ aus.
// Davor 3 Sekunden Lesezeit: die Frage steht schon da, 3 – 2 – 1 zählt runter, erst dann erscheinen die Antworten und die Uhr läuft.
const KT_LESEN_MS = 3000;
let KTU = { t: null, start: 0, ende: 0, lim: KT_MS, fertig: null, aus: true };
function ktUhrStart(lesenMs, restMs, lim, beiEnde) {
  ktUhrStopp();
  const jetzt = Date.now(); KTU = { t: null, start: jetzt + Math.max(0, lesenMs), ende: jetzt + Math.max(0, lesenMs) + Math.max(0, restMs), lim: lim || KT_MS, fertig: beiEnde, aus: false };
  const tick = () => {
    if (KTU.aus) return;
    const now = Date.now(), b = $("ktBalken"), sek = $("ktSek"), les = $("ktLesen"), ant = document.querySelector(".kt-antworten");
    if (now < KTU.start) {
      if (les) { les.textContent = String(Math.ceil((KTU.start - now) / 1000)); les.classList.remove("versteckt"); }
      ant?.classList.add("kt-lesen"); if (b) b.style.width = "100%"; if (sek) sek.textContent = "Lies die Frage …"; return;
    }
    les?.classList.add("versteckt"); ant?.classList.remove("kt-lesen");
    const rest = Math.max(0, KTU.ende - now), f = Math.min(1, rest / KTU.lim);
    if (b) { b.style.width = (f * 100).toFixed(1) + "%"; b.style.background = f > 0.45 ? "#27ae60" : f > 0.2 ? "#f1c40f" : "#c0392b"; }
    if (sek) sek.textContent = `⏱ ${Math.ceil(rest / 1000)} s`;
    if (rest <= 0) { const fn = KTU.fertig; ktUhrStopp(); fn?.(); }
  };
  KTU.t = setInterval(tick, 100); tick();
}
function ktUhrStopp() { clearInterval(KTU.t); KTU.t = null; KTU.aus = true; }
const ktLiest = () => !KTU.aus && Date.now() < KTU.start; // während 3-2-1 keine Antwort
// 2.17.2: ein Tipp – egal ob Finger aufsetzt (pointerdown) oder Klick kommt – zählt genau einmal; sofort blau markiert
function ktTipp(btn, i, fn) {
  if (btn.disabled || btn.closest(".kt-antworten")?.classList.contains("kt-lesen") || document.querySelector(".kt-antwort.getippt")) return;
  if (ktLiest()) return;
  btn.classList.add("getippt"); document.querySelectorAll(".kt-antwort").forEach((b) => (b.disabled = true));
  const h = $("ktGetippt"); if (h && fn === "ktMgAntwort") h.textContent = "⏳ Antwort ist angekommen – wird geprüft …";
  window[fn]?.(i);
}
// 2.17.1: Quizfrage im Bild – Fußleiste/Lupe ausblenden und die Frage nach oben holen (einmal je Frage)
let KT_GESCROLLT = "";
function ktBildFrei(an, schluessel) {
  document.body.classList.toggle("kt-aktiv", !!an);
  if (an && schluessel && KT_GESCROLLT !== schluessel) { KT_GESCROLLT = schluessel; requestAnimationFrame(() => { try { $("spInhalt").scrollIntoView({ block: "start" }); } catch {} }); }
}
// KC-CLUB-SPIEL-ANSAGE (2.22.16): Frage + Antworten vorlesen, danach die Auflösung (die Zeit läuft dabei wie immer weiter)
const ktFrageSprache = (fr, nr) => `${fr.m ? "Meisterfrage" : "Frage " + nr}. ${fr.f} ${fr.a.map((x, i) => `${"ABCD"[i]}: ${x}.`).join(" ")}`;
function ktAuflSprache(fr, a) {
  const richtig = fr.a[a.richtig];
  return `${a.ok ? `Richtig! Plus ${a.p} Punkte.` : a.gewaehlt < 0 || a.zuSpaet ? "Zeit abgelaufen." : "Leider falsch."} ${a.ok ? "" : `Richtig ist ${"ABCD"[a.richtig]}: ${richtig}.`} ${a.e || ""}`.replace(/\s+/g, " ").trim();
}
// ----- gegen den Computer -----
let KTP = (() => { let w = null; try { w = JSON.parse(localStorage.getItem(KT_KEY) || "null"); } catch {} return { staerke: "mittel", stand: { ich: 0, pc: 0, remis: 0 }, ...(w || {}), z: null, uhr: null, pcUhr: null }; })();
const ktpMerken = () => { try { localStorage.setItem(KT_KEY, JSON.stringify({ staerke: KTP.staerke, stand: KTP.stand })); } catch {} };
const KT_STAERKE = { leicht: { quote: 0.45, von: 4000, bis: 16000 }, mittel: { quote: 0.65, von: 3000, bis: 11000 }, schwer: { quote: 0.85, von: 1500, bis: 5000 } }; // Antwortzeit passt zur Zeitstufe
const ktpSichtbar = () => aktuelleAnsicht === "spiele" && SP.tab === "pc" && SP.art === "kt";
async function ktPcZeigen() {
  const F = await ktFragenLaden(); if (!ktpSichtbar()) return;
  const z = KTP.z, s = KTP.stand;
  ktBildFrei(false);
  const stand = `<div class="sp-stand"><span>Du <b>${s.ich}</b></span><span>🤝 <b>${s.remis}</b></span><span><b>${s.pc}</b> Computer</span></div>`;
  if (!z) { $("spInhalt").innerHTML = `<div class="karte sp-karte">
      <div class="kt-wahl">${spWahl("Stufe", KTP.staerke, [["leicht", "<span class=\"kt-emo\">😊</span>Leicht<br><small>20 s</small>"], ["mittel", "<span class=\"kt-emo\">🙂</span>Mittel<br><small>15 s</small>"], ["schwer", "<span class=\"kt-emo\">😎</span>Schwer<br><small>10 s</small>"]], "ktPcStaerke")}</div>
      ${stand}
      <p style="margin:6px 0">🔪 <b>Küchenterror</b> – ${F.length} Fragen aus dem Profi-Küchenalltag. Du beantwortest <b>alle 12 Fragen</b> – der Computer rät jedes Mal <b>gleichzeitig mit</b>.
        Jede Frage hat 4 Antworten, nur eine ist richtig. Der Zeitbalken läuft je nach Stufe <b>20, 15 oder 10 Sekunden</b>: richtig gibt 100 Punkte plus bis zu 100 Punkte Zeitbonus – wer schneller ist, holt mehr. Die letzte ist eine schwere <b>🎖️ Meisterfrage</b> – die zählt doppelt!</p>
      ${spLeiste(spKnopf("▶", "Los geht’s", "ktPcStart()", { haupt: true }), schTonKnopf(), spAnsageKnopf("kt"), s.ich + s.pc + s.remis ? spStandKnopf("ktPcStandWeg()") : "")}</div>`; return; } // KC-CLUB-KT-KNOEPFE (2.25.9, Wunsch Hansi): Knöpfe ordentlich nebeneinander
  const kopf = `<div class="kt-kopf"><span>Du <b>${z.punkte[0]}</b></span><span>Frage ${Math.min(z.i + 1, 12)}/12</span><span><b>${z.punkte[1]}</b> Computer</span></div>`;
  if (z.phase === "ende") {
    const [a, b] = z.punkte, sieg = a > b, remis = a === b;
    $("spInhalt").innerHTML = `<div class="karte sp-karte">${stand}<div class="sp-banner ${remis ? "remis" : sieg ? "sieg" : "niederlage"}">${remis ? "🤝 Unentschieden!" : sieg ? "🏆 Du hast gewonnen!" : "🤖 Der Computer hat gewonnen"}<br><small>${a} : ${b} Punkte</small></div>
      ${spLeiste(spNeuKnopf("ktPcStart()"), spKnopf("⚙️", "Stufe ändern", "KTP.z=null;ktPcZeigen()"), schTonKnopf(), spAnsageKnopf("kt"))}</div>`; return; }
  const f = F.find((q) => q.id === z.ids[z.i]), alle = [f.r, ...f.x], fr = { f: f.f, a: z.perm.map((k) => alle[k]), m: !!f.m, limitMs: ktpLimit() };
  const kopfWer = z.phase === "frage" ? `<div class="sp-status sp-ichdran">👨‍🍳 Tippe die richtige Antwort an – 🤖 der Computer rät mit <span id="ktPcStatus"></span></div>` : "";
  const pc = z.aufl?.pc, pcZeile = z.phase === "aufl" && pc ? `<div class="kt-ergebnis" style="font-size:1rem">🤖 Computer: ${pc.wahl < 0 ? "keine Antwort" : `${"ABCD"[pc.wahl]}) ` + (pc.ok ? `richtig in ${ktSek(pc.ms)} s – +${pc.p}` : "falsch – 0")}</div>` : "";
  ktBildFrei(true, "pc:" + z.ids.join() + ":" + z.i);
  const ktSchl = "ktp:" + z.ids.join() + ":" + z.i; // KC-CLUB-SPIEL-ANSAGE
  if (z.phase === "frage") spSag("kt", ktFrageSprache(fr, z.i + 1), ktSchl + ":f", true);
  else if (z.phase === "aufl" && z.aufl) spSag("kt", ktAuflSprache(fr, z.aufl) + (z.aufl.pc ? ` Der Computer: ${z.aufl.pc.wahl < 0 ? "keine Antwort" : z.aufl.pc.ok ? "richtig" : "falsch"}.` : ""), ktSchl + ":a", true);
  $("spInhalt").innerHTML = `<div class="karte sp-karte">${kopf}${kopfWer}${ktFrageHtml(fr, { klick: z.phase === "frage" ? "ktPcAntwort" : "", aufl: z.phase === "aufl" ? z.aufl : null })}${pcZeile}
    ${spLeiste(z.phase === "aufl" ? spKnopf(z.i >= 11 ? "🏁" : "›", z.i >= 11 ? "Ergebnis" : "Weiter", "ktPcWeiter()", { haupt: true }) : "", spNeuKnopf("ktPcAbbrechen(true)", "Neues Spiel", z.phase !== "aufl"), spAbbrechenKnopf("ktPcAbbrechen()"), schTonKnopf(), spAnsageKnopf("kt"))}</div>`; // KC-CLUB-KT-ABBRECHEN (2.25.10)
  if (z.phase === "frage" && z.pausiert && !SP.pause) return ktPcFortsetzen(); // 2.18.0: nach Rückkehr weiter
  if (z.phase === "frage" && !SP.pause) ktPcUhren();
  spPauseZeigen();
}
// 2.18.1 (Fund Hansi „Antworten lassen sich manchmal nicht antippen, kurz vor Ablauf ist B markiert“): vorher gab es abwechselnd
// Fragen an den Computer (dort war nichts antippbar, er wählte spät). Jetzt beantwortest du jede Frage – der Computer rät gleichzeitig:
// seine Wahl und Zeit werden beim Start der Frage ausgelost und erst bei der Auflösung gezeigt.
function ktPcNeueFrage(z) {
  const st = KT_STAERKE[KTP.staerke] || KT_STAERKE.mittel, f = KT_FRAGEN_L.find((q) => q.id === z.ids[z.i]);
  z.phase = "frage"; z.seit = z.lesenBis = Date.now() + KT_LESEN_MS; z.perm = ktMischen([0, 1, 2, 3]); z.aufl = null;
  z.pcZeit = Math.min(ktpLimit() + 500, st.von + Math.random() * (st.bis - st.von));
  const trifft = Math.random() < st.quote * (f?.m ? 0.8 : 1);
  z.pcWahl = z.pcZeit > ktpLimit() ? -1 : trifft ? z.perm.indexOf(0) : [0, 1, 2, 3].filter((k) => z.perm[k] !== 0)[Math.floor(Math.random() * 3)];
}
function ktPcUhren() { // Zeitablauf über den Wächter – auch nach Wiederkommen in die Ansicht
  const z = KTP.z; clearTimeout(KTP.uhr); clearTimeout(KTP.pcUhr);
  if (SP.pause) return ktUhrStopp(); // 2.18.0: angehalten
  const jetzt = Date.now(), lim = ktpLimit(), lesenEnde = Math.max(jetzt, z.lesenBis || z.seit); // 2.18.0: nach Pause neue Lesezeit
  ktUhrStart(lesenEnde - jetzt, lim - Math.max(0, lesenEnde - z.seit), lim, () => ktPcAntwort(-1, true));
  if (z.pcWahl >= 0) KTP.pcUhr = setTimeout(() => { const e = $("ktPcStatus"); if (e) e.textContent = "· 🤖 hat schon geantwortet!"; }, Math.max(lesenEnde - jetzt, z.pcZeit - (jetzt - z.seit)));
}
async function ktPcStart() {
  const F = await ktFragenLaden();
  // 11 normale Fragen + zum Schluss 1 🎖️ Meisterfrage (wie gegen Mitglieder)
  // KC-CLUB-KUECHENTERROR-ABWECHSLUNG (2.25.0): zuletzt gespielte Fragen (auf diesem Gerät) kommen erst dran, wenn die anderen durch sind
  const zuletzt = ktZuletzt();
  KTP.z = { ids: [...ktWahl(F.filter((q) => !q.m).map((q) => q.id), zuletzt, 11), ...ktWahl(F.filter((q) => q.m).map((q) => q.id), zuletzt, 1)], i: 0, punkte: [0, 0] };
  ktZuletztMerken(KTP.z.ids);
  ktPcNeueFrage(KTP.z);
  ktPcZeigen();
}
function ktPcAntwort(wahl, vonUhr) {
  const z = KTP.z; if (!z || z.phase !== "frage") return;
  if (SP.pause || z.pausiert) return; // 2.18.0: angehalten
  if (!vonUhr && Date.now() < (z.lesenBis || z.seit)) return; // noch Lesezeit (3-2-1)
  clearTimeout(KTP.uhr); clearTimeout(KTP.pcUhr); ktUhrStopp();
  const lim = ktpLimit(), ms = Math.min(Date.now() - z.seit, lim + 1), ok = wahl >= 0 && z.perm[wahl] === 0 && ms <= lim;
  const f = KT_FRAGEN_L.find((q) => q.id === z.ids[z.i]), mal = f?.m ? 2 : 1; // 🎖️ Meisterfrage doppelt
  const p = ktPunkte(ok, ms, lim) * mal, pcOk = z.pcWahl >= 0 && z.perm[z.pcWahl] === 0, pcP = ktPunkte(pcOk, z.pcZeit, lim) * mal;
  z.punkte[0] += p; z.punkte[1] += pcP; z.phase = "aufl";
  z.aufl = { richtig: z.perm.indexOf(0), gewaehlt: wahl, ok, p, ms, zuSpaet: ms > lim, e: f?.e, pc: { wahl: z.pcWahl, ok: pcOk, p: pcP, ms: z.pcZeit } };
  spTon(ok ? "richtig" : "falsch");
  try { navigator.vibrate?.(ok ? 30 : [40, 30, 40]); } catch {}
  if (ktpSichtbar()) ktPcZeigen();
}
function ktPcPausieren() { // Uhr anhalten, verbrauchte Zeit merken
  const z = KTP.z; if (!z || z.phase !== "frage" || z.pausiert) return;
  const jetzt = Date.now(); z.pausiert = { verbraucht: Math.max(0, jetzt - z.seit) }; ktUhrStopp(); clearTimeout(KTP.uhr); clearTimeout(KTP.pcUhr);
}
function ktPcFortsetzen() { // nochmal 3-2-1 Lesezeit, dann die restliche Zeit
  const z = KTP.z; if (z?.pausiert) { z.lesenBis = Date.now() + KT_LESEN_MS; z.seit = z.lesenBis - z.pausiert.verbraucht; delete z.pausiert; }
  ktPcZeigen();
}
function ktPcWeiter() {
  const z = KTP.z; if (!z || z.phase !== "aufl") return;
  z.i++;
  if (z.i >= 12) { z.phase = "ende"; const [a, b] = z.punkte; if (a > b) KTP.stand.ich++; else if (b > a) KTP.stand.pc++; else KTP.stand.remis++; ktpMerken(); spEndeTon(a > b, a === b); }
  else ktPcNeueFrage(z);
  ktPcZeigen();
}
const ktPcStaerke = (w) => { KTP.staerke = KT_STAERKE[w] ? w : "mittel"; ktpMerken(); ktPcZeigen(); };
// KC-CLUB-KT-ABBRECHEN (2.25.10, Wunsch Hansi „kein Abbrechen-Knopf, wenn man zwischendurch aufhören will“): Uhr anhalten, fragen;
// bei „Abbrechen“ endet das Spiel ohne Wertung (Spielstand bleibt), bei „Weiterspielen“ geht es mit 3-2-1 weiter.
async function ktPcAbbrechen(neu = false) { // KC-CLUB-SPIELE-LEISTE: neu = gleich ein neues Spiel
  const z = KTP.z; if (!z || z.phase === "ende") return;
  const lief = z.phase === "frage" && !z.pausiert; if (lief) ktPcPausieren();
  try { speechSynthesis.cancel(); } catch {}
  if (!(await frage(`${neu ? "Neues Spiel beginnen?" : "Spiel abbrechen?"} Diese Runde wird nicht gewertet – dein Spielstand bleibt.`, { ja: neu ? "↺ Neues Spiel" : "✖ Abbrechen", nein: "▶ Weiterspielen" }))) { if (lief && KTP.z === z && ktpSichtbar()) ktPcFortsetzen(); return; }
  if (KTP.z !== z) return;
  clearTimeout(KTP.uhr); clearTimeout(KTP.pcUhr); ktUhrStopp(); KTP.z = null;
  if (neu) return ktPcStart();
  if (ktpSichtbar()) ktPcZeigen();
  melde("Spiel abgebrochen – nicht gewertet.");
}
async function ktPcStandWeg() { if (!(await frage("Spielstand Küchenterror auf 0 : 0 zurücksetzen?", { ja: "🗑️ Zurücksetzen", nein: "Abbrechen" }))) return; KTP.stand = { ich: 0, pc: 0, remis: 0 }; ktpMerken(); ktPcZeigen(); }
// ----- gegen Mitglieder -----
let KTM = { id: null, frage: null, aufl: null, uhr: null, sendet: false, pause: false };
function ktSpielZeigen(g) {
  if (KTM.id !== g.id) { clearTimeout(KTM.uhr); KTM = { id: g.id, frage: null, aufl: null, uhr: null, sendet: false, pause: false }; }
  setTimeout(spPauseZeigen, 0); // 2.18.0
  const q = g.quiz, er = esc(g.gegner.vorname);
  if (!q) { $("spInhalt").innerHTML = '<div class="karte hinweis">Spielstand fehlt – bitte „‹“ und neu öffnen.</div>'; return; }
  const zurueck = `<div class="zeile" style="border:none;padding:0"><button class="knopf klein" onclick="ktMgUebersicht()">‹ Übersicht</button><b style="flex:1;text-align:right">🔪 Du gegen ${er}<br><small class="hinweis">⏱ ${(q.limitMs || KT_MS) / 1000} Sekunden je Frage</small></b></div>`;
  if (KTM.frage || KTM.aufl) {
    const fr = KTM.frage || KTM.aufl.frage, rest = 0; /* Restzeit stellt der Wächter */
    ktBildFrei(true, "mg:" + g.id + ":" + fr.nr);
    const kopf = `<div class="kt-kopf"><span>Frage ${fr.imZug}/${fr.vonImZug}</span><span>Runde ${Math.ceil(fr.nr / 3)} von 4</span></div>`;
    if (KTM.frage) spSag("kt", ktFrageSprache(fr, fr.nr), `ktm:${g.id}:${fr.nr}:f`, true); // KC-CLUB-SPIEL-ANSAGE
    else if (KTM.aufl) spSag("kt", ktAuflSprache(fr, KTM.aufl), `ktm:${g.id}:${fr.nr}:a`, true);
    $("spInhalt").innerHTML = `<div class="karte sp-karte">${ktFrageHtml({ ...fr, restMs: rest }, { klick: KTM.frage ? "ktMgAntwort" : "", aufl: KTM.aufl, kopf })}
      ${KTM.aufl ? spLeiste(spKnopf("›", g.ichDran && q.offenBeiMir > 0 ? "Nächste Frage" : "Fertig", "ktMgWeiter()", { haupt: true }), schTonKnopf(), spAnsageKnopf("kt")) : ""}</div>`;
    return;
  }
  ktBildFrei(false);
  const zelle = (x) => !x ? "–" : x.verdeckt ? "✔︎" : `<span class="${x.ok ? "ok" : "nein"}">${x.ok ? x.p : "0"}</span>`;
  const tafel = `<table class="kt-tafel"><tr><th></th><th colspan="3">Du</th><th colspan="3">${er}</th></tr>${q.runden.map((rd, i) => `<tr><th>R${i + 1}</th>${rd.map((k, j) => `<td${i * 3 + j === q.meisterNr ? ' class="meister" title="Meisterfrage"' : ""}>${zelle(k.ich)}</td>`).join("")}${rd.map((k, j) => `<td${i * 3 + j === q.meisterNr ? ' class="meister" title="Meisterfrage"' : ""}>${zelle(k.er)}</td>`).join("")}</tr>`).join("")}
    <tr><th>Σ</th><td colspan="3"><b>${q.summe[0]}</b></td><td colspan="3"><b>${q.summe[1]}</b>${q.ende ? "" : '<small class="hinweis"> *</small>'}</td></tr></table>
    ${q.ende ? "" : '<p class="hinweis" style="margin:0">* Punkte des Gegenübers siehst du erst, wenn du dieselben Fragen auch gespielt hast (✔︎ = schon beantwortet).</p>'}`;
  let status;
  if (g.status === "beendet") status = g.ergebnis === "gewonnen" ? `<div class="sp-banner sieg">🏆 ${g.aufgegeben ? `${er} hat aufgegeben – du hast gewonnen!` : "Du hast gewonnen!"}<br><small>${q.summe[0]} : ${q.summe[1]} Punkte</small></div>`
    : g.ergebnis === "verloren" ? `<div class="sp-banner niederlage">${g.aufgegeben ? "Du hast aufgegeben." : `${er} hat gewonnen.`}<br><small>${q.summe[0]} : ${q.summe[1]} Punkte</small></div>` : `<div class="sp-banner remis">🤝 Unentschieden!<br><small>${q.summe[0]} : ${q.summe[1]} Punkte</small></div>`;
  else if (g.status === "angefragt") status = `<div class="sp-status">⏳ Warte, bis ${er} annimmt …</div>`;
  else if (g.status !== "laeuft") status = `<div class="sp-status">Diese Partie findet nicht statt.</div>`;
  else status = g.ichDran ? `<div class="sp-status sp-ichdran">Du bist dran – ${q.offenBeiMir} ${q.offenBeiMir === 1 ? "Frage" : "Fragen"} warten auf dich</div>
      <div class="knoepfe"><button class="knopf haupt" style="width:100%" onclick="ktMgFrage()">${q.laeuft != null ? "▶ Weiter – deine Frage läuft noch!" : "▶ Los geht’s"}</button></div>
      <p class="hinweis" style="margin:4px 0 0;text-align:center">Je Frage ${(q.limitMs || KT_MS) / 1000} Sekunden – erst tippen, wenn du bereit bist. Mittendrin aufhören zählt als „Zeit abgelaufen“.</p>`
    : `<div class="sp-status">${er} ist dran …</div>`;
  $("spInhalt").innerHTML = `<div class="karte sp-karte">${zurueck}${status}${spTerminHtml(g)}${tafel}
    ${q.rueckblick ? `<details class="sch-verlauf"><summary>📖 Alle Fragen mit Lösung</summary>${q.rueckblick.filter(Boolean).map((x, i) => `<p style="margin:6px 0"><b>${i + 1}. ${x.m ? "🎖️ " : ""}${esc(x.f)}</b><br>✅ ${esc(x.r)}<br><small class="hinweis">💡 ${esc(x.e)}</small></p>`).join("")}</details>` : ""}
    ${spLeiste(g.status === "beendet" ? spKnopf("↺", "Revanche", `spRevanche('${g.id}')`, { haupt: true }) : g.status === "laeuft" ? spKnopf("🏳️", "Aufgeben", `spAufgeben('${g.id}')`) : "", schTonKnopf(), spAnsageKnopf("kt"))}</div>`;
}
function ktMgUebersicht() { clearTimeout(KTM.uhr); ktUhrStopp(); KTM.frage = null; KTM.aufl = null; SP.offen = null; spZeigen(); spLaden(true); }
async function ktMgFrage() {
  const g = SP.offen; if (!g?.ichDran || KTM.sendet) return;
  KTM.pause = false; KTM.sendet = true;
  try { const r = await api("spiel_zug", { id: g.id, zug: { kt: "frage" }, zuege: g.zuege }, { warten: true }); SP.offen = r.spiel;
    if (r.verpasst) melde("⏰ Eine Frage war schon abgelaufen – 0 Punkte");
    if (r.frage) { KTM.frage = { ...r.frage, empfangen: Date.now() }; KTM.aufl = null; clearTimeout(KTM.uhr); ktUhrStart(r.frage.lesenMs || 0, r.frage.restMs, r.frage.limitMs, () => ktMgAntwort(-1)); } }
  catch (e) { meldeFehler(e); try { SP.offen = (await api("spiel_holen", { id: g.id })).spiel; } catch {} }
  finally { KTM.sendet = false; }
  if (aktuelleAnsicht === "spiele" && SP.offen) spZeigen();
}
async function ktMgAntwort(wahl) {
  const g = SP.offen, fr = KTM.frage; if (!g || !fr || KTM.sendet) return;
  if (wahl >= 0 && ktLiest()) return; // noch Lesezeit (3-2-1)
  KTM.sendet = true; clearTimeout(KTM.uhr); ktUhrStopp();
  document.querySelectorAll(".kt-antwort").forEach((b) => (b.disabled = true));
  try { const r = await api("spiel_zug", { id: g.id, zug: { kt: "antwort", wahl }, zuege: g.zuege }, { warten: true }); SP.offen = r.spiel;
    KTM.frage = null; KTM.aufl = r.antwort ? { ...r.antwort, frage: fr } : null; if (r.antwort) spTon(r.antwort.ok ? "richtig" : "falsch"); try { navigator.vibrate?.(r.antwort?.ok ? 30 : [40, 30, 40]); } catch {} }
  catch (e) { meldeFehler(e); KTM.frage = null; KTM.aufl = null; try { SP.offen = (await api("spiel_holen", { id: g.id })).spiel; } catch {} }
  finally { KTM.sendet = false; }
  if (aktuelleAnsicht === "spiele" && SP.offen) spZeigen();
}
function ktMgWeiter() { const g = SP.offen; KTM.aufl = null; if (!KTM.pause && g?.ichDran && g.quiz?.offenBeiMir > 0) return ktMgFrage(); spZeigen(); } // 2.18.0: bei Pause zur Übersicht

// ---------- KC-CLUB-SPIEL-TERMIN (2.9.1, Wunsch Hansi): zu einer Partie einen Termin vereinbaren ----------
// Nutzt die vorhandene Terminanfrage (steht dann bei beiden im Kalender und im Kalender-Abo, Vortags-Erinnerung). Dazu eine
// Erinnerung kurz vor Beginn an beide, sobald zugesagt ist. Zu-/Absagen direkt an der Partie.
const spTitel = (g) => g.spiel === "ttt" ? `❌⭕ Tic-Tac-Toe ${g.groesse}×${g.groesse}` : SP_NAMEN[g.spiel] || "🎲 Spiel";
const spTerminZeit = (t) => new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(t.beginn)) + " Uhr";
function spTerminKurz(g) {
  const t = g.termin; if (!t) return "";
  const st = t.antwort === "ja" ? "✅" : t.antwort === "nein" ? "❌" : "⏳";
  return `<div class="hinweis sp-termin-kurz" style="margin:0;font-size:.85rem">📅 ${esc(spTerminZeit(t))} ${st}</div>`;
}
function spTerminHtml(g) {
  if (!["angefragt", "laeuft"].includes(g.status)) return "";
  const t = g.termin, neu = `<button class="knopf klein" onclick="spTerminBlatt('${g.id}')">📅 ${t ? "Anderen Termin vorschlagen" : "Termin vereinbaren"}</button>`;
  if (!t) return `<div class="sp-termin">${neu}<span class="hinweis">Lieber zu einer festen Zeit spielen? Steht dann bei euch beiden im Kalender.</span></div>`;
  const wer = esc(g.gegner.vorname);
  const st = t.antwort === "ja" ? `✅ ${t.vonMir ? wer + " hat zugesagt" : "du hast zugesagt"}` : t.antwort === "nein" ? `❌ ${t.vonMir ? wer + " kann nicht" : "du hast abgesagt"}` : t.vonMir ? `⏳ wartet auf ${wer}` : "Passt dir der Termin?";
  const knoepfe = !t.vonMir && !t.antwort ? `<div class="knoepfe" style="margin:6px 0 0"><button class="knopf haupt klein" onclick="spTerminAntwort('${t.id}', 'ja')">✅ Passt</button><button class="knopf klein" onclick="spTerminAntwort('${t.id}', 'nein')">❌ Passt nicht</button></div>` : "";
  return `<div class="sp-termin"><b>📅 ${esc(spTerminZeit(t))}</b>${t.ort ? ` · ${esc(t.ort)}` : ""}<div class="hinweis" style="margin:2px 0 0">${st}</div>${spErinZeile(g)}${knoepfe}${t.antwort === "nein" || t.vonMir ? `<div style="margin-top:6px">${neu}</div>` : ""}</div>`;
}
// KC-CLUB-ERINNERUNG-WAHL: eigene Erinnerung unter dem Spiel-Termin (zugesagt oder selbst vorgeschlagen)
function spErinZeile(g) {
  const t = g.termin; if (!t || !(t.vonMir || t.antwort === "ja")) return "";
  return erinZeileHtml(t.erinnerung, `erinSpiel('${g.id}')`, t.erinnerungMin);
}
function erinSpiel(gid) {
  const g = SP.offen?.id === gid ? SP.offen : SP.liste?.spiele?.find((x) => x.id === gid); if (!g?.termin) return;
  erinFragen({ ...g.termin, anlass: g.termin.anlass || spTitel(g) + " mit " + g.gegner.vorname, spielId: g.id });
}
function spTerminBlatt(id) {
  const g = SP.offen?.id === id ? SP.offen : SP.liste?.spiele?.find((x) => x.id === id); if (!g) return;
  const morgen = new Date(Date.now() + 86400000), tag = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(morgen);
  const f = blattAuf("spTerminBlatt", `${einwHtml("b-sp-termin")}<h3 style="margin:0">📅 Termin für die Partie</h3>
    <p class="hinweis" style="margin:0">${esc(spTitel(g))} mit ${esc(g.gegner.vorname)} – ${esc(g.gegner.vorname)} bekommt die Anfrage und kann zu- oder absagen. Der Termin steht dann bei euch beiden im Kalender.</p>
    <div class="zwei"><label class="feld">Tag<input type="date" id="spTTag" value="${tag}" min="${new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date())}"></label>
      <label class="feld">Uhrzeit<input type="time" id="spTZeit" value="18:00" step="900"></label></div>
    <label class="feld">Wo?<select id="spTOrt"><option>In der Köcheclub-App (jeder bei sich)</option><option>Im Clubheim</option><option>Bei mir</option><option>Beim Treffen</option></select></label>
    <label class="feld">Notiz (freiwillig)<input id="spTNotiz" maxlength="200" placeholder="z. B. Revanche vom letzten Mal 😉"></label>
    <div class="knoepfe"><button class="knopf haupt" id="spTSenden">📨 Termin vorschlagen</button><button class="knopf" onclick="fensterZu(document.getElementById('spTerminBlatt'))">Abbrechen</button></div>`);
  f.querySelector("#spTSenden").onclick = async () => {
    const tagW = $("spTTag").value, zeit = $("spTZeit").value;
    if (!tagW || !zeit) return melde("Bitte Tag und Uhrzeit wählen.", true);
    const beginn = new Date(taZeitpunkt(tagW, zeit));
    if (isNaN(beginn.getTime()) || beginn.getTime() < Date.now()) return melde("Der Termin liegt in der Vergangenheit.", true);
    try {
      await api("terminanfrage_senden", { anlass: `${spTitel(g)}-Partie: ${ICH?.vorname || ""} & ${g.gegner.vorname}`.replace(/ ×/, "×"), beginn: beginn.toISOString(), ende: new Date(beginn.getTime() + (g.spiel === "ttt" ? 30 : 90) * 60000).toISOString(),
        ort: $("spTOrt").value, notiz: $("spTNotiz").value.trim(), spiel_id: g.id, erinnerung_min: 60 }, { warten: true }); // 2.23.22: jeder stellt seine Erinnerung selbst ein (Standard 1 Std.)
      f.remove(); melde(`📅 Termin an ${g.gegner.vorname} geschickt – steht in deinem Kalender`); await spLaden(true);
      if (SP.offen?.id === g.id) { SP.offen.termin = SP.liste?.spiele?.find((x) => x.id === g.id)?.termin || null; spZeigen(); }
      const t = SP.liste?.spiele?.find((x) => x.id === g.id)?.termin; if (t) erinFragen({ ...t, anlass: t.anlass || spTitel(g) + " mit " + g.gegner.vorname, spielId: g.id }); // KC-CLUB-ERINNERUNG-WAHL
    } catch (e) { meldeFehler(e); }
  };
}
async function spTerminAntwort(anfrageId, antwort) {
  try { await api("terminanfrage_antwort", { id: anfrageId, antwort }, { warten: true }); melde(antwort === "ja" ? "✅ Zugesagt – steht in deinem Kalender" : "Abgesagt – schlag gern einen anderen Termin vor");
    await spLaden(true); if (SP.offen) { SP.offen.termin = SP.liste?.spiele?.find((x) => x.id === SP.offen.id)?.termin || null; spZeigen(); }
    if (antwort === "ja") { const g = SP.liste?.spiele?.find((x) => x.termin?.id === anfrageId); if (g) erinFragen({ ...g.termin, anlass: g.termin.anlass || spTitel(g) + " mit " + g.gegner.vorname, spielId: g.id }); } } // KC-CLUB-ERINNERUNG-WAHL
  catch (e) { meldeFehler(e); }
}
