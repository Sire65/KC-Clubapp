// KC-CLUB-IST-RUECKFRAGE (Wunsch Hansi 08.11.2026): „🗓️ Meine Ist-Zeiten“ – nach dem Dienst die geplante Zeit übernehmen (✅ Ja), andere Zeiten eintragen
// (✏️, Grund freiwillig) oder „❌ War nicht da“. Hat die Kasse (QR-Stechuhr) bzw. „Dienst anmelden“ schon Kommen und Gehen erfasst, wird nicht gefragt –
// dann nur „🧾 Korrektur melden“ (der Planer entscheidet). Nicht passende Knöpfe sind ausgegraut und sagen beim Antippen, warum.
// Daten vom Server (ist_offen / ist_antworten), DP2 liest dieselben Rückmeldungen. Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const IRB = { ref: null, modus: null, start: 0, ende: 0, pause: 0, grund: "", bemerkung: "" };
const irUhrF = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const irTagF = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit" });
const irUhr = (ms) => irUhrF.format(new Date(ms)), irTag = (ms) => irTagF.format(new Date(ms));
const irMinuten = (a, b, p) => Math.max(0, Math.round((b - a) / 60000) - (p || 0));
function irDauer(min) { min = Math.round(min); const h = Math.floor(Math.abs(min) / 60), m = Math.abs(min) % 60; return `${h ? `${h} Std.` : ""}${h && m ? " " : ""}${m || !h ? `${m} Min.` : ""}`; }
const IR_STATUS = { automatisch: "zählt so", zu_bestaetigen: "⏳ wartet auf den Planer", bestaetigt: "✔️ vom Planer bestätigt", abgelehnt: "❌ vom Planer abgelehnt", offen: "" };
const IR_ZUSTAND = { offen: "⏳ offen", halb: "⏳ Gehen fehlt", beantwortet: "✔️ erledigt", erfasst: "🧾 erfasst", zu: "🔒 abgeschlossen" };
const IR_QUELLE = { kasse: "Kasse", app: "App (Dienst anmelden)", planer: "Planer" };
const irDienst = () => (IRL?.dienste || []).find((x) => x.ref === IRB.ref) || null;
async function irOeffnen(ref) {
  if (!frei("ist_rueckfrage")) return melde("Diese Funktion ist noch nicht freigegeben.");
  blattAuf("irBlatt", `<h3 style="margin:0">🗓️ Meine Ist-Zeiten</h3><div id="irInhalt"><p class="hinweis">Wird geladen …</p></div>`);
  try { const r = await api("ist_offen", {}, { warten: true }); IRL = r?.aktiv ? r : null; irKarteZeichnen(); }
  catch (e) { if ($("irInhalt")) $("irInhalt").innerHTML = `<div class="karte ta-st-nein">⚠️ ${esc(fehlerText(e, "Nicht geladen"))}</div>`; return; }
  const l = IRL?.dienste || [];
  const wahl = l.find((x) => x.ref === ref) || l.find((x) => x.zustand === "offen" || x.zustand === "halb") || l[0];
  IRB.ref = wahl?.ref || null; IRB.modus = null; irZeichnen();
}
// Antwort in Worten
function irAntwortText(d) {
  const a = d.antwort; if (!a) return "";
  const z = a.start && a.ende ? `${irUhr(Date.parse(a.start))}–${irUhr(Date.parse(a.ende))}` : "";
  const was = a.ergebnis === "passt" ? `✅ Übernommen: ${z}` : a.ergebnis === "geaendert" ? `✏️ Geändert: ${z}` : a.ergebnis === "nicht_da" ? "🚫 Nicht da" : `🧾 Korrektur gemeldet: ${z}`;
  return `${was}${a.grund ? ` · ${esc(a.grund)}` : ""}${IR_STATUS[a.status] ? ` · <b>${IR_STATUS[a.status]}</b>` : ""}${a.status === "abgelehnt" && a.planerGrund ? ` (${esc(a.planerGrund)})` : ""}`;
}
// Knopf: aktiv oder ausgegraut mit Erklärung (antippen zeigt, warum)
const irKnopf = (t, aktiv, onclick, warum, haupt) => aktiv
  ? `<button type="button" class="knopf${haupt ? " haupt" : ""}" onclick="${onclick}">${t}</button>`
  : `<button type="button" class="knopf ir-aus" aria-disabled="true" onclick="melde('${esc(warum).replace(/'/g, "\\'")}')">${t}</button>`;
function irZeichnen() {
  const box = $("irInhalt"); if (!box) return;
  const l = IRL?.dienste || [];
  if (!l.length) { box.innerHTML = `<p>In den letzten ${7} Tagen hattest du keinen Dienst im veröffentlichten Plan.</p><div class="knoepfe"><button class="knopf" onclick="fensterZu($('irBlatt'))">Schließen</button></div>`; return; }
  const d = irDienst() || l[0]; IRB.ref = d.ref;
  const s = Date.parse(d.start), e = Date.parse(d.ende), soll = irMinuten(s, e, d.pause), z = d.zustand, er = d.erfasst;
  const reiter = l.length > 1 ? `<div class="ir-reiter" role="tablist">${l.map((x) => `<button type="button" role="tab" aria-selected="${x.ref === d.ref}" class="stmarke${x.ref === d.ref ? " an" : ""}" onclick="IRB.ref='${esc(x.ref)}';IRB.modus=null;irZeichnen()">${esc(irTag(Date.parse(x.start)))} ${esc(irUhr(Date.parse(x.start)))} <small>${IR_ZUSTAND[x.zustand] || ""}</small></button>`).join("")}</div>` : "";
  const offenOderNeu = z === "offen" || z === "halb" || z === "beantwortet";
  const nichtDaGeht = (z === "offen" || z === "beantwortet") && !er?.kommen;
  const zuWarum = z === "zu" ? (d.abgeschlossen ? "Der Tag ist im Dienstplan abgeschlossen – Änderungen bitte über den Planer." : "Die 7 Tage sind vorbei – Änderungen bitte über den Planer.") : "";
  const erfWarum = "Deine Zeiten sind schon erfasst (" + (IR_QUELLE[er?.quelle] || "Kasse") + ") – bei einem Fehler bitte „Korrektur melden“.";
  const status = z === "erfasst" ? `🧾 Erfasst (${esc(IR_QUELLE[er.quelle] || er.quelle)}): <b>${esc(irUhr(Date.parse(er.kommen)))}–${esc(irUhr(Date.parse(er.gehen)))}</b>`
    : z === "halb" ? `Gekommen <b>${esc(irUhr(Date.parse(er.kommen)))}</b> (${esc(IR_QUELLE[er.quelle] || er.quelle)}) – <b>wann bist du gegangen?</b>`
    : d.antwort ? irAntwortText(d) : z === "zu" ? "🔒 Keine Angabe – " + esc(zuWarum) : "Soll ich die geplante Zeit als Ist-Zeit übernehmen?";
  const jaText = z === "halb" ? `✅ Bis ${esc(irUhr(e))} (wie geplant)` : "✅ Ja, stimmt";
  const knoepfe = `<div class="ir-knoepfe">
    ${irKnopf(jaText, offenOderNeu && !(d.antwort?.ergebnis === "passt"), "irAntworten('passt')", z === "zu" ? zuWarum : z === "erfasst" ? erfWarum : "Schon so übernommen.", true)}
    ${irKnopf("✏️ Andere Zeiten", offenOderNeu, "irModus('zeiten')", z === "zu" ? zuWarum : erfWarum)}
    ${irKnopf("❌ War nicht da", nichtDaGeht, "irModus('nicht')", z === "zu" ? zuWarum : er?.kommen ? "Für diesen Dienst ist schon ein Kommen erfasst." : "Geht hier nicht.")}
    ${irKnopf("🧾 Korrektur melden", z === "erfasst" || (z === "beantwortet" && !!er?.komplett), "irModus('korrektur')", z === "zu" ? zuWarum : "Es gibt keine Kassen- oder App-Buchung zu korrigieren – nutze „Andere Zeiten“.")}
  </div>`;
  box.innerHTML = reiter + `<div class="karte ir-karte-blatt">
    <b>${esc(irTag(s))} · geplant ${esc(irUhr(s))}–${esc(irUhr(e))}</b> <span class="hinweis">(${esc(irDauer(soll))}${d.pause ? `, ${d.pause} Min. Pause` : ""}${d.bereich ? ` · ${esc(d.bereich)}` : ""})</span>
    <p style="margin:8px 0">${status}</p>${knoepfe}
    ${IRB.modus === "zeiten" || IRB.modus === "korrektur" ? irZeitenHtml(d) : IRB.modus === "nicht" ? irNichtHtml() : ""}
    ${!IRB.modus && (d.antwort || z === "erfasst") && d.antwort?.ergebnis !== "nicht_da" && Date.now() <= Date.parse(d.frist) ? irFeedbackHtml(d) : ""}
    ${z !== "zu" ? `<p class="hinweis" style="margin:8px 0 0">Eintragen bis ${esc(irTag(Date.parse(d.frist)))} (7 Tage) oder bis der Planer den Tag abschließt.</p>` : ""}
  </div>
  <div class="knoepfe" style="margin-top:10px">${(() => { const n = l.find((x) => x.ref !== d.ref && (x.zustand === "offen" || x.zustand === "halb")); return n ? `<button class="knopf haupt" onclick="IRB.ref='${esc(n.ref)}';IRB.modus=null;irZeichnen()">➡️ Nächster offener Dienst</button>` : ""; })()}${ICH?.admin || (ICH?.aemter || []).some((a) => a === "Clubsprecher" || a === "Kassenwart") ? '<button class="knopf" onclick="irAenderungen()">📋 Alle Zeitänderungen</button>' : ""}<button class="knopf" onclick="fensterZu($('irBlatt'))">Schließen</button></div>`;
  if (IRB.modus) irVorschau();
}
function irModus(m) {
  const d = irDienst(); if (!d) return;
  IRB.modus = IRB.modus === m ? null : m; IRB.grund = ""; IRB.bemerkung = "";
  const a = d.antwort, er = d.erfasst;
  const basis = m === "korrektur" && er?.komplett ? [Date.parse(er.kommen), Date.parse(er.gehen), er.pause ?? d.pause]
    : a?.start && a?.ende ? [Date.parse(a.start), Date.parse(a.ende), a.pause ?? d.pause] : [er?.kommen ? Date.parse(er.kommen) : Date.parse(d.start), Date.parse(d.ende), d.pause || 0];
  [IRB.start, IRB.ende, IRB.pause] = basis;
  irZeichnen();
}
// Uhrzeiten im 5-Minuten-Raster rund um den Dienst (nie in der Zukunft)
function irZeitOptionen(d, gewaehlt, istEnde) {
  const schritt = (IRL?.regeln?.schrittMin || 5) * 60000, spann = (IRL?.regeln?.spannStd || 6) * 3600000;
  const von = Math.ceil((Date.parse(d.start) - spann) / schritt) * schritt, bis = Math.min(Date.parse(d.ende) + spann, Math.floor((Date.now() + 5 * 60000) / schritt) * schritt);
  const tag0 = irTag(Date.parse(d.start)), out = [];
  for (let t = von; t <= bis; t += schritt) { const tg = irTag(t); out.push(`<option value="${t}"${t === gewaehlt ? " selected" : ""}>${tg !== tag0 ? esc(tg) + " " : ""}${esc(irUhr(t))}</option>`); }
  return out.join("");
}
function irZeitenHtml(d) {
  const halb = d.zustand === "halb", korr = IRB.modus === "korrektur";
  const pausen = Array.from({ length: 25 }, (_, i) => i * 5).map((p) => `<option value="${p}"${p === IRB.pause ? " selected" : ""}>${p} Min.</option>`).join("");
  return `<div class="ir-zeiten">
    <div class="ir-zeile"><label>Beginn <select id="irVon" onchange="IRB.start=+this.value;irVorschau()"${halb ? ' disabled title="Kommen ist schon erfasst"' : ""}>${irZeitOptionen(d, IRB.start, false)}</select></label>
      <label>Ende <select id="irBis" onchange="IRB.ende=+this.value;irVorschau()">${irZeitOptionen(d, IRB.ende, true)}</select></label>
      <label>Pause <select id="irPause" onchange="IRB.pause=+this.value;irVorschau()">${pausen}</select></label></div>
    <p class="ir-vorschau" id="irVorschau"></p>
    <p style="margin:6px 0 4px"><b>Grund</b> <span class="hinweis">${korr ? "(bitte angeben)" : "(freiwillig)"}</span></p>
    <div class="ir-gruende">${(IRL?.gruende || []).map((g) => `<button type="button" class="stmarke" onclick="irGrund(this,'${esc(g)}')">${esc(g)}</button>`).join("")}</div>
    <input type="text" id="irGrundText" maxlength="120" placeholder="${korr ? "Was stimmt nicht? z. B. an der Kasse vergessen abzumelden" : "oder in eigenen Worten (freiwillig)"}" oninput="IRB.grund=this.value.trim();irVorschau()" style="margin-top:6px;width:100%">
    <div class="knoepfe" style="margin-top:8px"><button type="button" class="knopf haupt" id="irSpeichern" onclick="irAntworten('${korr ? "korrektur" : "geaendert"}')">${korr ? "🧾 Korrektur melden" : "💾 Speichern"}</button></div></div>`;
}
function irNichtHtml() {
  return `<div class="ir-zeiten"><p style="margin:4px 0"><b>Grund</b> <span class="hinweis">(freiwillig)</span></p>
    <div class="ir-gruende">${(IRL?.nichtDa || []).map((g) => `<button type="button" class="stmarke" onclick="irGrund(this,'${esc(g)}')">${esc(g)}</button>`).join("")}</div>
    <div class="knoepfe" style="margin-top:8px"><button type="button" class="knopf haupt" onclick="irAntworten('nicht_da')">❌ Melden: war nicht da</button></div></div>`;
}
function irGrund(b, g) {
  const an = !b.classList.contains("an");
  b.parentElement.querySelectorAll(".stmarke").forEach((x) => x.classList.remove("an"));
  if (an) b.classList.add("an");
  IRB.grund = an ? g : ""; if ($("irGrundText")) $("irGrundText").value = ""; irVorschau();
}
// Vorschau „statt … → …“ und Speichern nur, wenn es etwas zu speichern gibt (sonst ausgegraut mit Erklärung)
function irVorschau() {
  const d = irDienst(), v = $("irVorschau"), k = $("irSpeichern"); if (!d || !v || !k) return;
  const s = Date.parse(d.start), e = Date.parse(d.ende), soll = irMinuten(s, e, d.pause), ist = irMinuten(IRB.start, IRB.ende, IRB.pause), diff = ist - soll;
  const korr = IRB.modus === "korrektur", er = d.erfasst;
  const gleichPlan = IRB.start === s && IRB.ende === e && IRB.pause === (d.pause || 0);
  const gleichBuchung = korr && er?.komplett && IRB.start === Date.parse(er.kommen) && IRB.ende === Date.parse(er.gehen);
  let fehler = IRB.ende <= IRB.start ? "Das Ende muss nach dem Beginn liegen." : IRB.pause >= Math.round((IRB.ende - IRB.start) / 60000) ? "Die Pause ist länger als die Zeit." : "";
  if (!fehler && !korr && gleichPlan) fehler = "Gleiche Zeiten wie geplant – dann einfach „✅ Ja, stimmt“.";
  if (!fehler && korr && gleichBuchung && !IRB.grund) fehler = "Bitte die richtigen Zeiten wählen oder einen Grund angeben.";
  if (!fehler && korr && !IRB.grund) fehler = "Bitte kurz den Grund angeben.";
  const abw = (Math.max(Math.abs(IRB.start - s), Math.abs(IRB.ende - e)) / 60000) + Math.abs(IRB.pause - (d.pause || 0));
  v.innerHTML = fehler ? `<span class="ir-fehler">${esc(fehler)}</span>`
    : `Statt <b>${esc(irDauer(soll))}</b> → <b>${esc(irDauer(ist))}</b> (${diff >= 0 ? "+" : "−"}${esc(irDauer(Math.abs(diff)))})${korr || abw >= (IRL?.regeln?.abweichMin || 15) ? " · <span class=\"hinweis\">der Planer schaut kurz drüber</span>" : ""}`;
  k.classList.toggle("ir-aus", !!fehler); k.setAttribute("aria-disabled", fehler ? "true" : "false"); k.dataset.warum = fehler;
}
async function irAntworten(ergebnis) {
  const d = irDienst(); if (!d) return;
  const k = $("irSpeichern"); if ((ergebnis === "geaendert" || ergebnis === "korrektur") && k?.dataset.warum) return melde(k.dataset.warum);
  const p = { ref: d.ref, ergebnis, ...(ergebnis === "geaendert" || ergebnis === "korrektur" ? { start: new Date(IRB.start).toISOString(), ende: new Date(IRB.ende).toISOString(), pause: IRB.pause } : {}), ...(IRB.grund ? { grund: IRB.grund } : {}) };
  if (ergebnis === "nicht_da" && !(await frage(`Wirklich melden, dass du am ${irTag(Date.parse(d.start))} nicht da warst?`, { ja: "❌ Ja, melden", nein: "Abbrechen", gefahr: false }))) return;
  try {
    const r = await api("ist_antworten", p, { warten: true });
    IRL = r.lage?.aktiv ? r.lage : IRL; irKarteZeichnen();
    melde(ergebnis === "passt" ? "✅ Übernommen – danke!" : ergebnis === "nicht_da" ? "❌ Gemeldet – danke!" : r.status === "zu_bestaetigen" ? "✏️ Gespeichert – der Planer schaut kurz drüber" : "✏️ Gespeichert – danke!");
    IRB.modus = null; IRB.ref = d.ref; irZeichnen(); // beim Dienst bleiben – darunter die freiwilligen Fragen zu Zufriedenheit und Besetzung
  } catch (e) { meldeFehler(e); }
}
// Wunsch Hansi 08.11.: „Wie warst du heute zufrieden mit deinem Dienst?“ (3 Gesichter) und „Waren die Schichten richtig besetzt?“ – freiwillig, ein Tipp speichert
const IR_GESICHT = [[1, "😀", "gut"], [2, "🙂", "geht so"], [3, "☹️", "nicht gut"]], IR_BESETZT = [["zu_wenig", "Zu wenig"], ["passt", "Genau richtig"], ["zu_viel", "Zu viele"]];
function irFeedbackHtml(d) {
  const f = d.feedback || {}, heute = irTag(Date.parse(d.start)) === irTag(Date.now());
  return `<div class="ir-zeiten ir-feedback"><p style="margin:2px 0 6px"><b>Wie zufrieden warst du ${heute ? "heute" : "an dem Tag"} mit deinem Dienst?</b> <span class="hinweis">(freiwillig)</span></p>
    <div class="ir-gesichter" role="group" aria-label="Zufriedenheit">${IR_GESICHT.map(([w, g, t]) => `<button type="button" class="ir-gesicht${f.zufrieden === w ? " an" : ""}" aria-pressed="${f.zufrieden === w}" onclick="irFeedback({ zufrieden: ${w} })"><span aria-hidden="true">${g}</span><small>${t}</small></button>`).join("")}</div>
    <p style="margin:10px 0 6px"><b>Waren die Schichten richtig besetzt?</b></p>
    <div class="ir-gruende" role="group" aria-label="Besetzung">${IR_BESETZT.map(([w, t]) => `<button type="button" class="stmarke${f.besetzung === w ? " an" : ""}" aria-pressed="${f.besetzung === w}" onclick="irFeedback({ besetzung: '${w}' })">${t}</button>`).join("")}</div>
    <p class="hinweis" style="margin:6px 0 0">Das hilft bei der weiteren Planung. Danke!</p></div>`;
}
async function irFeedback(werte) {
  const d = irDienst(); if (!d) return;
  try { const r = await api("ist_feedback", { ref: d.ref, ...werte }, { warten: true }); IRL = r.lage?.aktiv ? r.lage : IRL; melde("Danke für deine Rückmeldung! 🙏"); irZeichnen(); }
  catch (e) { meldeFehler(e); }
}
// Clubsprecher, Kassenwart, Admin: alle Zeitänderungen der letzten 30 Tage
async function irAenderungen() {
  blattAuf("irAeBlatt", `<h3 style="margin:0">📋 Zeitänderungen (30 Tage)</h3><div id="irAeInhalt"><p class="hinweis">Wird geladen …</p></div>`);
  let r; try { r = await api("ist_aenderungen", {}, { warten: true }); } catch (e) { $("irAeInhalt").innerHTML = `<div class="karte ta-st-nein">⚠️ ${esc(fehlerText(e, "Nicht geladen"))}</div>`; return; }
  const z = (iso) => (iso ? irUhr(Date.parse(iso)) : "–");
  $("irAeInhalt").innerHTML = (r.liste || []).length ? `<table class="vb-tabelle ir-ae">${r.liste.map((x) => `<tr><td><b>${esc(x.name)}</b><br><small>${esc(irTag(Date.parse(x.soll_start)))}${x.bereich ? ` · ${esc(x.bereich)}` : ""}</small></td>
      <td>${x.ergebnis === "nicht_da" ? "🚫 nicht da" : `${x.ergebnis === "korrektur" ? "🧾 " : "✏️ "}${esc(z(x.ist_start))}–${esc(z(x.ist_ende))}`}<br><small>statt ${esc(z(x.soll_start))}–${esc(z(x.soll_ende))}${x.grund ? ` · ${esc(x.grund)}` : ""}</small></td>
      <td><small>${IR_STATUS[x.planer_status] || esc(x.planer_status)}</small></td></tr>`).join("")}</table>`
    : '<p class="hinweis">Keine Zeitänderungen in den letzten 30 Tagen.</p>';
  if ((r.stimmung || []).length) $("irAeInhalt").insertAdjacentHTML("beforeend", `<h4 style="margin:12px 0 4px">😀 Stimmung &amp; Besetzung</h4><table class="vb-tabelle ir-ae">${r.stimmung.map((g) => `<tr><td><b>${esc(irTag(Date.parse(g.tag + "T12:00:00Z")))}</b>${g.bereich ? `<br><small>${esc(g.bereich)}</small>` : ""}</td>
      <td>😀 ${g.gut} · 🙂 ${g.mittel} · ☹️ ${g.schlecht}</td><td><small>zu wenig ${g.zu_wenig} · richtig ${g.passt} · zu viele ${g.zu_viel}</small></td></tr>`).join("")}</table>`);
  $("irAeInhalt").insertAdjacentHTML("beforeend", `<div class="knoepfe" style="margin-top:10px"><button class="knopf" onclick="fensterZu($('irAeBlatt'))">Schließen</button></div>`);
}
