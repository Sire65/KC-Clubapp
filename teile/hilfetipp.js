// 2.835.0 KC-CLUB-HILFE-TIPPS (Wunschliste #71, Wunsch Hansi 03.11.2026): Clubleitung – „💡 Lösung schicken“ an eine Person, Gruppe, ein Amt oder alle
// (Text, Blätter aus dem Ordner 📚 Anleitungen, eigene PDFs, Fotos, Bildschirmfotos), mit oder ohne Rückmeldung; Vorlagen; „📋 Gesendete Tipps“ mit Antworten.
// Ansehen und Antworten beim Mitglied liegen im Hauptprogramm (tippZeigen, tippAntwort). Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const TS = { anlagen: [], vorlagen: null, opt: {}, blaetter: null };
const TS_MAX_ANL = 5;
async function tippSenden(opt = {}) {
  if (!ICH?.admin && !ICH?.vorstand) return melde("Tipps schickt die Clubleitung.", true);
  if (!MITGLIEDER) try { await mitgliederHolen(); } catch (e) { return meldeFehler(e); }
  Object.assign(TS, { anlagen: [], opt });
  blattAuf("tippSendBlatt", `<h3 style="margin:0">💡 Lösung schicken</h3><p class="hinweis" style="margin:2px 0 8px">Ein Tipp für eine Person, eine Gruppe oder alle – auf Wunsch mit Rückmeldung, ob er geholfen hat.</p>
    <div id="tsVorlagen"></div>
    <label class="feld">Problem <small class="hinweis">(kurz, z. B. „Bildschirm zu dunkel“)</small><input id="tsProblem" maxlength="120" value="${esc(opt.problem || "")}" autocomplete="off"></label>
    <label class="feld">Tipp<textarea id="tsText" rows="4" maxlength="1500" placeholder="Oben rechts auf 🌙 tippen – dann wird die App hell."></textarea></label>
    <div class="hl-frage">Dazu legen <small class="hinweis">(höchstens ${TS_MAX_ANL})</small></div>
    <div class="knoepfe" style="margin:4px 0"><button type="button" class="knopf klein" onclick="tsAnleitungWahl()">📚 Aus Anleitungen</button>
      <button type="button" class="knopf klein" onclick="$('tsDateiPdf').click()">📄 PDF</button><button type="button" class="knopf klein" onclick="$('tsDateiBild').click()">📷 Foto / 🖼️ Bildschirmfoto</button></div>
    <input type="file" id="tsDateiPdf" accept="application/pdf" multiple hidden onchange="tsDateien(this)"><input type="file" id="tsDateiBild" accept="image/*" multiple hidden onchange="tsDateien(this)">
    <div id="tsAnlagen"></div>
    <div class="hl-frage">An wen?</div><div id="tsAn"></div>
    <label class="zeile" style="margin-top:10px"><input type="checkbox" id="tsRueck" checked> <span>✅ Rückmeldung verlangen <small class="hinweis">– das Mitglied sagt, ob der Tipp geholfen hat</small></span></label>
    <label class="zeile"><input type="checkbox" id="tsVorlage" checked> <span>📋 Als Vorlage merken</span></label>
    <div class="knoepfe bs-fuss"><button class="knopf haupt" id="tsLos" onclick="tsSenden(this)">💡 Senden</button><button class="knopf" onclick="fensterZu($('tippSendBlatt'))">Abbrechen</button></div>`);
  const alle = () => (MITGLIEDER || []).filter((m) => zwIch(m.person_id) && sammelOk(m)).map((m) => m.person_id);
  zwStart("tsAn", { titel: "👤 Wer bekommt den Tipp?", alleText: "alle Mitglieder", alle, nachher: tsKnopf, ...(opt.an?.length ? { art: "einzeln", ids: opt.an.slice() } : {}) });
  tsAnlagenZeigen(); tsVorlagenLaden();
}
function tsKnopf() {
  const k = $("tsLos"); if (!k || !ZWAHL.tsAn) return;
  const n = zwBereit("tsAn") ? zwIds("tsAn").length : 0;
  k.disabled = !n; k.textContent = n ? `💡 An ${n} ${n === 1 ? "Mitglied" : "Mitglieder"} senden` : "Bitte erst auswählen";
}
async function tsVorlagenLaden() {
  try { if (!TS.vorlagen) TS.vorlagen = (await api("tipp_vorlagen", {}, { still: true })).vorlagen || []; } catch { TS.vorlagen = []; }
  const el = $("tsVorlagen"); if (!el) return;
  el.innerHTML = TS.vorlagen.length ? `<label class="feld">📋 Vorlage nehmen<select id="tsVorlageWahl" onchange="tsVorlageNehmen(this.value)"><option value="">– eigene Lösung schreiben –</option>
    ${TS.vorlagen.map((v) => `<option value="${esc(v.id)}">${esc(v.problem)}${v.benutzt > 1 ? ` (${v.benutzt}×)` : ""}</option>`).join("")}</select></label>` : "";
  // passt eine Vorlage zum Problem der Anfrage, gleich vorschlagen
  const p = (TS.opt.problem || "").toLowerCase(), v = p && TS.vorlagen.find((x) => x.problem.toLowerCase() === p);
  if (v && !$("tsText")?.value) { $("tsVorlageWahl").value = v.id; tsVorlageNehmen(v.id); }
}
function tsVorlageNehmen(id) {
  const v = (TS.vorlagen || []).find((x) => x.id === id); if (!v) return;
  $("tsProblem").value = v.problem; $("tsText").value = v.text; TS.anlagen = (v.anlagen || []).slice(0, TS_MAX_ANL); tsAnlagenZeigen();
}
function tsAnlagenZeigen() {
  const el = $("tsAnlagen"); if (!el) return;
  el.innerHTML = TS.anlagen.map((a, i) => `<div class="tipp-anl"><span>${a.art === "anleitung" ? "📚 " + esc(a.titel) : `${oaSym(a.mime)} ${esc(a.name)}`}</span><button type="button" class="knopf klein" aria-label="Entfernen" onclick="tsAnlWeg(${i})">✕</button></div>`).join("");
}
function tsAnlWeg(i) { TS.anlagen.splice(i, 1); tsAnlagenZeigen(); }
async function tsDateien(inp) {
  const l = [...(inp.files || [])]; inp.value = "";
  for (const d of l) {
    if (TS.anlagen.length >= TS_MAX_ANL) { melde(`Höchstens ${TS_MAX_ANL} Anlagen.`, true); break; }
    if (!/^image\/|^application\/pdf$/.test(d.type || "")) { melde(`${d.name}: bitte ein PDF oder ein Bild.`, true); continue; }
    try { melde(`⏫ ${d.name} wird hochgeladen …`); const r = await anlageHochladen(d); TS.anlagen.push({ art: "datei", id: r.id, name: r.name || d.name, mime: d.type }); tsAnlagenZeigen(); }
    catch (e) { meldeFehler(e); }
  }
}
async function tsAnleitungWahl() {
  try { if (!TS.blaetter) TS.blaetter = (await fetch(`dokumente/anleitungen/liste.json?v=${APP_VERSION}`, { signal: zeitSignal(15000) }).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Liste fehlt"))))).blaetter || []; }
  catch { return melde("Die Anleitungen konnten gerade nicht geladen werden – bitte gleich noch einmal.", true); }
  const nach = {}; for (const b of TS.blaetter) { const k = b.register || "Sonstiges"; (nach[k] = nach[k] || []).push(b); }
  blattAuf("tippAnlBlatt", `<h3 style="margin:0 0 6px">📚 Anleitung dazulegen</h3>${Object.entries(nach).map(([r, l]) => `<div class="hl-frage">${esc(r)}</div>${l.map((b) => `<button type="button" class="tipp-zeile" onclick="tsAnleitungNehmen(${jsArg(b.datei)})"><b>${esc(b.titel)}</b></button>`).join("")}`).join("")}
    <div class="knoepfe"><button class="knopf" onclick="fensterZu($('tippAnlBlatt'))">Abbrechen</button></div>`);
}
function tsAnleitungNehmen(datei) {
  const b = (TS.blaetter || []).find((x) => x.datei === datei); if (!b) return;
  if (TS.anlagen.length >= TS_MAX_ANL) return melde(`Höchstens ${TS_MAX_ANL} Anlagen.`, true);
  const url = APP_URL_CLUB + "dokumente/anleitungen/" + b.datei;
  if (!TS.anlagen.some((a) => a.url === url)) TS.anlagen.push({ art: "anleitung", url, titel: b.titel });
  fensterZu($("tippAnlBlatt")); tsAnlagenZeigen();
}
async function tsSenden(knopf) {
  const problem = ($("tsProblem")?.value || "").trim(), text = ($("tsText")?.value || "").trim();
  if (!problem) return melde("Bitte kurz das Problem eintragen.", true);
  if (!text) return melde("Bitte den Tipp aufschreiben.", true);
  if (!zwBereit("tsAn")) return melde("Bitte auswählen, wer den Tipp bekommt.", true);
  const an = zwIds("tsAn"), rueck = !!$("tsRueck")?.checked;
  if (!an.length) return melde("Bitte auswählen, wer den Tipp bekommt.", true);
  if (!(await frage(`💡 „${problem}“\nan ${an.length} ${an.length === 1 ? "Mitglied" : "Mitglieder"} senden${rueck ? " – mit Rückmeldung" : ""}?`, { ja: "💡 Senden" }))) return;
  knopf.disabled = true;
  try {
    await api("tipp_senden", { problem, text, an, rueckmeldung: rueck, vorlage: !!$("tsVorlage")?.checked, anlagen: TS.anlagen, anfrage: TS.opt.anfrage || null }, { warten: true });
    TS.vorlagen = null; fensterZu($("tippSendBlatt"));
    melde(`💡 Tipp an ${an.length} ${an.length === 1 ? "Mitglied" : "Mitglieder"} gesendet${rueck ? " – du siehst die Antworten unter „📋 Gesendete Tipps“" : ""}`);
    if ($("uaAdminBlatt") && TS.opt.anfrage) uaAdmin();
  } catch (e) { meldeFehler(e); knopf.disabled = false; }
}
// ---------- 📋 Gesendete Tipps: wer hat gelesen, wer wie geantwortet ----------
async function tippListe() {
  if (!ICH?.admin && !ICH?.vorstand) return;
  let r; try { r = await api("tipp_liste", {}, { warten: true }); } catch (e) { return meldeFehler(e); }
  const l = r.tipps || [];
  const karte = (t) => {
    const e = t.empfang || [], n = e.length || 1, zahl = (a) => e.filter((x) => x.antwort === a).length, offen = e.filter((x) => !x.antwort).length;
    const balken = t.rueckmeldung ? [["geholfen", "✅ Geholfen"], ["erledigt", "👍 Erledigt"], ["nein", "❌ Nein"], ["anderes", "🔀 Anderes"], ["keine", "🙅 Keine Antwort"]]
      .map(([a, txt]) => [txt, zahl(a)]).concat([["⏳ Noch offen", offen]]).filter(([, z]) => z).map(([txt, z]) => `<div class="tipp-balken"><span>${txt}</span><i style="width:${Math.round(z / n * 100)}%"></i><b>${z}</b></div>`).join("")
      : `<p class="hinweis" style="margin:0">Ohne Rückmeldung · ${e.filter((x) => x.gelesen_am).length} von ${e.length} gelesen</p>`;
    const leute = e.map((x) => `<div class="tipp-stand"><span>${esc(x.name)}${x.antwort_text ? ` <small class="hinweis">„${esc(x.antwort_text)}“</small>` : ""}</span><small>${x.antwort ? esc(TIPP_ANTW_TEXT[x.antwort] || x.antwort) : x.gelesen_am ? "👁️ gelesen" : "📨 noch nicht gelesen"}</small></div>`).join("");
    return `<div class="ua-karte"><div class="ua-kopf"><b>${esc(t.problem)}</b><small class="hinweis">${esc(wann(t.erstellt_am))}</small></div>
      <small class="hinweis">von ${esc(t.vonName)} · an ${e.length} ${e.length === 1 ? "Mitglied" : "Mitglieder"}${(t.anlagen || []).length ? ` · ${t.anlagen.length} ${t.anlagen.length === 1 ? "Anlage" : "Anlagen"}` : ""}</small>
      ${balken}<details><summary>Wer, wie?</summary>${leute}<div style="margin-top:6px">${tippAbsatz(t.text)}</div>${tippAnlagenHtml(t.anlagen)}</details>
      <div class="knoepfe" style="margin-top:6px">${t.rueckmeldung && offen ? `<button class="knopf klein" onclick="tippErinnern(${jsArg(t.id)}, this)">🔔 Offene erinnern</button>` : ""}
        <button class="knopf klein" onclick="tippNochmal(${jsArg(t.id)})">💡 Nochmal schicken</button></div></div>`;
  };
  TS.liste = l;
  blattAuf("tippListeBlatt", `<h3 style="margin:0 0 6px">📋 Gesendete Tipps</h3>${l.length ? l.map(karte).join("") : '<p class="hinweis">Noch keine Tipps verschickt.</p>'}
    <div class="knoepfe"><button class="knopf haupt" onclick="tippSenden()">💡 Lösung schicken</button><button class="knopf" onclick="fensterZu($('tippListeBlatt'))">Schließen</button></div>`);
}
async function tippErinnern(id, knopf) {
  knopf.disabled = true;
  try { const r = await api("tipp_erinnern", { id }, { warten: true }); melde(r.erinnert ? `🔔 ${r.erinnert} ${r.erinnert === 1 ? "Mitglied" : "Mitglieder"} erinnert` : "🔔 Alle Offenen wurden gerade schon erinnert (höchstens alle 12 Stunden)."); }
  catch (e) { meldeFehler(e); knopf.disabled = false; }
}
function tippNochmal(id) {
  const t = (TS.liste || []).find((x) => x.id === id); if (!t) return;
  tippSenden({ problem: t.problem }).then(() => { if (!$("tsText")) return; $("tsText").value = t.text; TS.anlagen = (t.anlagen || []).slice(0, TS_MAX_ANL); tsAnlagenZeigen(); $("tsRueck").checked = !!t.rueckmeldung; });
}
