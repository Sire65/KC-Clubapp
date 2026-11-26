// KICC-F-114 / KC-CLUB-FAHRTKOSTEN-SAMMEL (Hansi 25./26.11.2026): „Das ganze logisch aufgebaut, einfach, bedienerfreundlich, selbst erklärend. Und unter Meins
// eine saubere Aufmachung der Erfassungsmaske. Alles sauber und ausgerichtet aufgebaut. Chronologisch, nicht relevante Sachen ausgegraut, Plausibilitätsprüfung.“
// Meins → 🚗 Fahrten & Abrechnung: 1. Fahrtprofil (🚶 keine Fahrtkosten = Vorgabe | 🚗 eigenes Auto, km hin und zurück – gilt für alle Veranstaltungen),
// 2. Sammel-Abrechnung je Veranstaltung (Vorschlag vom Server aus den geprüften Diensten; km je Zeile änderbar, Zeile abwählbar; ausgegraut mit Grund).
// Clubleitung: 📋 Sammel-Freigabe (alle auf einmal, über die vorhandene Aktion erstattung_erledigen – jedes Mitglied bekommt seine Nachricht) und 🚗 Fahrtprofile.
// Konzept: KICC docs/KONZEPT-CLUB-FAHRTKOSTEN-SAMMEL.md. Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const FSS = { profil: null, kmMax: 500, v: null, ev: null, aend: {}, auszahlung: "ueberweisung", leit: null, leitTab: "freigabe", leitEv: null, wahl: new Set() };
const FS_PLAUSI = { kmHoch: 300, abweichung: 0.5, profilHoch: 150 };
const fsEuro = (n) => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",") + " €";
const fsZahl = (n, st = 1) => (Math.round(Number(n) * 10 ** st) / 10 ** st).toLocaleString("de-DE", { maximumFractionDigits: st });
const fsTag = (iso) => { try { return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return iso; } };
const fsKmLesen = (v) => { const n = Number(String(v ?? "").trim().replace(",", ".")); return Number.isFinite(n) ? Math.round(n * 10) / 10 : NaN; };

// ---------- Mitglied ----------
async function fsStart(veranstaltung) {
  if (!$("fsBlatt")) blattAuf("fsBlatt", `<h3 style="margin:0">🚗 Fahrten &amp; Abrechnung</h3><div id="fsInhalt"><p class="hinweis">Wird geladen …</p></div>`);
  try {
    const [p, v] = await Promise.all([api("fahrtprofil", {}, { warten: true }), api("fahrt_sammel_vorschlag", veranstaltung ? { veranstaltung } : {}, { warten: true })]);
    Object.assign(FSS, { profil: p.profil, kmMax: p.kmMax || 500, v, ev: v.veranstaltung?.id || null, aend: {} });
  } catch (e) { if ($("fsInhalt")) $("fsInhalt").innerHTML = `<div class="karte">⚠️ ${esc(fehlerText(e, "Nicht geladen"))}</div>`; return; }
  fsZeichnen();
}
function fsProfilHtml() {
  const p = FSS.profil || { art: "keine" }, auto = p.art === "auto";
  return `<section class="karte fs-karte"><div class="fs-kopf"><b>1. Meine Fahrt zum Stand</b><small>gilt für alle Veranstaltungen</small></div>
    <div class="umschalter fs-wahl" role="radiogroup" aria-label="Fahrtkosten">
      <button type="button" role="radio" aria-checked="${!auto}" class="${auto ? "" : "an"}" onclick="fsArt('keine')">🚶 Keine Fahrtkosten<small>zu Fuß, Rad, wohne am Ort</small></button>
      <button type="button" role="radio" aria-checked="${auto}" class="${auto ? "an" : ""}" onclick="fsArt('auto')">🚗 Eigenes Auto<small>km hin und zurück</small></button></div>
    <div id="fsKmZeile" class="fs-kmzeile${auto ? "" : " versteckt"}"><label class="feld" style="margin:0">km hin und zurück (je Dienst)
      <input id="fsKm" inputmode="decimal" placeholder="z. B. 12" value="${auto && p.km ? esc(String(p.km).replace(".", ",")) : ""}"></label>
      <button type="button" class="knopf haupt" onclick="fsProfilSpeichern('auto')">💾 Speichern</button></div>
    <p class="hinweis" style="margin:6px 0 0">${p.geaendert ? `✓ Gespeichert am ${esc(fsTag(String(p.geaendert).slice(0, 10)))} · ` : ""}Gespeichert werden nur die km – keine Adresse. Bei einer Fahrgemeinschaft bekommt nur der Fahrer km.</p></section>`;
}
function fsArt(art) {
  if (art === "keine") { if ((FSS.profil?.art || "keine") !== "keine") fsProfilSpeichern("keine"); return; }
  $("fsKmZeile")?.classList.remove("versteckt"); document.querySelectorAll(".fs-wahl button").forEach((b, i) => { b.classList.toggle("an", i === 1); b.setAttribute("aria-checked", String(i === 1)); });
  $("fsKm")?.focus();
}
async function fsProfilSpeichern(art) {
  const km = art === "auto" ? fsKmLesen($("fsKm")?.value) : null;
  if (art === "auto") {
    if (!(km >= 0.5 && km <= FSS.kmMax)) return melde(`Bitte die km hin und zurück angeben (0,5 bis ${FSS.kmMax}).`, true);
    if (km > FS_PLAUSI.profilHoch && !(await frage(`🚗 ${fsZahl(km)} km hin und zurück – für jeden Dienst. Stimmt das?`, { ja: "Ja, stimmt", nein: "Ändern" }))) return;
  }
  try { const r = await api("fahrtprofil", { art, km }); FSS.profil = r.profil; melde(art === "auto" ? `✓ Fahrtprofil gespeichert: ${fsZahl(km)} km je Dienst` : "✓ Gespeichert: keine Fahrtkosten"); fsStart(FSS.ev); }
  catch (e) { meldeFehler(e); }
}
// Zeile: zählt sie (Vorschlag), mit welchen km, und ist sie ausgewählt?
function fsZeileStand(z) {
  const e = FSS.aend[z.key] || {}, an = z.zaehlt && e.aus !== true, km = e.km !== undefined ? e.km : z.km;
  const warn = !an ? null : !(km >= 0 && km <= FSS.kmMax) ? `bitte 0 bis ${FSS.kmMax} km` : km > FS_PLAUSI.kmHoch ? "über 300 km – stimmt das?"
    : FSS.profil?.km && Math.abs(km - FSS.profil.km) > FSS.profil.km * FS_PLAUSI.abweichung ? `weicht vom Fahrtprofil ab (${fsZahl(FSS.profil.km)} km)` : null;
  return { an, km: Number.isFinite(km) ? km : NaN, warn, fehler: an && !(km >= 0 && km <= FSS.kmMax) };
}
function fsSummen() {
  const z = (FSS.v?.zeilen || []).map((x) => ({ x, st: fsZeileStand(x) })), an = z.filter((y) => y.st.an && y.st.km > 0);
  return { fahrten: an.length, km: an.reduce((n, y) => n + y.st.km, 0), euro: an.reduce((n, y) => n + y.st.km * (y.x.satz || 0), 0),
    std: (FSS.v?.zeilen || []).filter((x) => x.geprueft && x.art !== "erstattung").reduce((n, x) => n + x.min, 0) / 60,
    warn: z.filter((y) => y.st.an && y.st.warn).map((y) => `${fsTag(y.x.datum)}: ${y.st.warn}`), fehler: z.some((y) => y.st.fehler) };
}
function fsZeileHtml(z) {
  const st = fsZeileStand(z), zeit = z.von ? `${z.von}–${z.bis}` : "–";
  return `<div class="fs-zeile${z.zaehlt ? (st.an ? "" : " fs-ab") : " fs-aus"}" data-key="${esc(z.key)}">
    <div class="fs-links"><div class="fs-z1"><b>${esc(fsTag(z.datum))}</b><span>${esc(zeit)}</span><span class="fs-std">${z.min ? fsZahl(z.min / 60, 2) + " Std." : ""}</span></div>
      <div class="fs-z2">${z.art === "sonder" ? "★ " : z.art === "erstattung" ? "💶 " : "🎪 "}${esc(z.anlass)}</div>
      ${z.grund ? `<div class="fs-grund">${esc(z.grund)}</div>` : ""}${st.warn ? `<div class="fs-warn${st.fehler ? " fs-fehler" : ""}">⚠️ ${esc(st.warn)}</div>` : ""}</div>
    <div class="fs-rechts">${z.zaehlt ? `<input class="fs-km${st.fehler ? " fs-fehler" : st.warn ? " fs-gelb" : ""}" inputmode="decimal" aria-label="km am ${esc(fsTag(z.datum))}" value="${Number.isFinite(st.km) ? esc(String(st.km).replace(".", ",")) : ""}" ${st.an ? "" : "disabled"} onchange="fsKm(this.closest('.fs-zeile').dataset.key, this.value)">
      <label class="fs-haken" title="Fahrt abrechnen"><input type="checkbox" ${st.an ? "checked" : ""} onchange="fsAn(this.closest('.fs-zeile').dataset.key, this.checked)" aria-label="Fahrt am ${esc(fsTag(z.datum))} abrechnen"></label>`
      : `<span class="fs-km fs-leer">–</span><span class="fs-haken"></span>`}</div></div>`;
}
function fsKm(key, wert) { const km = fsKmLesen(wert); FSS.aend[key] = { ...(FSS.aend[key] || {}), km: Number.isFinite(km) ? km : NaN }; fsZeichnen(true); }
function fsAn(key, an) { FSS.aend[key] = { ...(FSS.aend[key] || {}), aus: !an }; fsZeichnen(true); }
function fsZeichnen(nurAbrechnung) {
  const v = FSS.v; if (!v || !$("fsInhalt")) return;
  const s = fsSummen(), evs = v.veranstaltungen || [];
  const abr = `<section class="karte fs-karte" id="fsAbr"><div class="fs-kopf"><b>2. Abrechnung ${esc(v.veranstaltung?.name || "")}</b>
      ${evs.length > 1 ? `<select aria-label="Veranstaltung" onchange="fsStart(this.value)">${evs.map((e) => `<option value="${esc(e.id)}" ${e.id === v.veranstaltung?.id ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select>` : ""}</div>
    ${v.sammel ? `<p class="fs-status fs-ok">📨 Eingereicht am ${esc(wann(v.sammel.am))} · ${esc(fsEuro(v.sammel.summe))} · ${v.sammel.status === "erstattet" ? "✅ erstattet" : "beim Kassenwart"}</p>`
      : `<p class="fs-status${v.abrechenbar ? " fs-ok" : ""}">${v.abrechenbar ? "✓ Bereit: bitte prüfen und einreichen." : esc(v.hinweis || "")}</p>`}
    <p class="hinweis" style="margin:2px 0 6px">Alle deine geprüften Dienste und Einsätze, nach Datum. Ausgegraut ist, was nicht abgerechnet wird – der Grund steht darunter. km kannst du je Fahrt ändern oder die Fahrt abwählen.</p>
    <div class="fs-tabelle" role="table"><div class="fs-zeile fs-kopfzeile" role="row"><div class="fs-links">Tag · Zeit · Einsatz</div><div class="fs-rechts"><span class="fs-km">km</span><span class="fs-haken">✓</span></div></div>
      ${(v.zeilen || []).map(fsZeileHtml).join("") || '<p class="hinweis" style="padding:8px 0">Noch keine geprüften Dienste für diese Veranstaltung.</p>'}
      <div class="fs-zeile fs-summe"><div class="fs-links"><b>${s.fahrten} Fahrt${s.fahrten === 1 ? "" : "en"}</b> · ${fsZahl(s.std, 2)} Std. im Stundenkonto</div><div class="fs-rechts"><b>${fsZahl(s.km)} km</b><b class="fs-euro">${fsEuro(s.euro)}</b></div></div></div>
    ${v.sammel ? "" : `<div class="umschalter" style="margin:10px 0 0" role="radiogroup" aria-label="Auszahlung"><button type="button" class="${FSS.auszahlung === "ueberweisung" ? "an" : ""}" onclick="FSS.auszahlung='ueberweisung';fsZeichnen(true)">🏦 Überweisung</button><button type="button" class="${FSS.auszahlung === "bar" ? "an" : ""}" onclick="FSS.auszahlung='bar';fsZeichnen(true)">💶 Bar</button></div>
      <button type="button" class="knopf haupt" style="margin-top:10px;width:100%" ${v.abrechenbar && s.fahrten && !s.fehler ? "" : "disabled"} onclick="fsEinreichen()">✅ Abrechnung einreichen · ${esc(fsEuro(s.euro))}</button>
      ${s.fehler ? '<p class="hinweis fs-fehler" style="margin:4px 0 0">Bitte die rot markierten km korrigieren.</p>' : ""}`}</section>`;
  if (nurAbrechnung && $("fsAbr")) { const y = $("fsInhalt").scrollTop; $("fsAbr").outerHTML = abr; $("fsInhalt").scrollTop = y; return; }
  $("fsInhalt").innerHTML = fsProfilHtml() + abr;
}
async function fsEinreichen() {
  const s = fsSummen(), v = FSS.v; if (!v?.abrechenbar || !s.fahrten || s.fehler) return;
  if (!(await frage(`Fahrtkosten ${v.veranstaltung.name} einreichen?\n\n${s.fahrten} Fahrt${s.fahrten === 1 ? "" : "en"} · ${fsZahl(s.km)} km = ${fsEuro(s.euro)} (${FSS.auszahlung === "bar" ? "bar" : "Überweisung"})${s.warn.length ? `\n\nBitte prüfen:\n• ${s.warn.join("\n• ")}` : ""}\n\nDer Antrag geht an den Kassenwart. Du bekommst eine Kopie.`, { ja: "✅ Einreichen", nein: "Zurück" }))) return;
  const zeilen = {}; for (const [k, e] of Object.entries(FSS.aend)) zeilen[k] = { ...(e.aus ? { aus: true } : {}), ...(e.km !== undefined ? { km: e.km } : {}) };
  try {
    const r = await api("fahrt_sammel_einreichen", { veranstaltung: v.veranstaltung.id, zeilen, auszahlung: FSS.auszahlung });
    melde(`📨 Abrechnung über ${fsEuro(r.summe)} eingereicht – du bekommst eine Kopie per Mail.`);
    fsStart(v.veranstaltung.id);
  } catch (e) { meldeFehler(e); fsStart(v.veranstaltung.id); }
}

// ---------- Clubleitung: Sammel-Freigabe und Fahrtprofile ----------
async function fsLeitung(tab) {
  if (tab) FSS.leitTab = tab;
  if (!$("fsLeitBlatt")) blattAuf("fsLeitBlatt", `<h3 style="margin:0">🚗 Fahrtkosten – Clubleitung</h3><div class="umschalter" style="margin:8px 0" role="tablist" id="fsLeitTabs"></div><div id="fsLeitInhalt"><p class="hinweis">Wird geladen …</p></div>`);
  $("fsLeitTabs").innerHTML = [["freigabe", "📋 Sammel-Freigabe"], ["profile", "🚗 Fahrtprofile"]].map(([t, n]) => `<button type="button" role="tab" aria-selected="${FSS.leitTab === t}" class="${FSS.leitTab === t ? "an" : ""}" onclick="fsLeitung('${t}')">${n}</button>`).join("");
  try {
    FSS.leit = FSS.leitTab === "profile" ? await api("fahrtprofil_liste", {}, { warten: true }) : await api("erstattung_sammel_liste", FSS.leitEv ? { veranstaltung: FSS.leitEv } : {}, { warten: true });
  } catch (e) { $("fsLeitInhalt").innerHTML = `<div class="karte">⚠️ ${esc(fehlerText(e, "Nicht geladen"))}</div>`; return; }
  if (FSS.leitTab === "freigabe") FSS.wahl = new Set((FSS.leit.antraege || []).filter((a) => a.status === "eingereicht").map((a) => a.id));
  fsLeitZeichnen();
}
function fsLeitZeichnen() {
  const d = FSS.leit; if (!d || !$("fsLeitInhalt")) return;
  if (FSS.leitTab === "profile") {
    const auto = (d.liste || []).filter((x) => x.art === "auto");
    $("fsLeitInhalt").innerHTML = `<p class="hinweis" style="margin:0 0 6px">${auto.length} von ${(d.liste || []).length} Mitgliedern rechnen Fahrtkosten ab. Jeder entscheidet selbst – hier nur zum Draufschauen.</p>
      <div class="fs-tabelle">${(d.liste || []).map((x) => `<div class="fs-zeile${x.art === "auto" ? "" : " fs-aus"}"><div class="fs-links"><b>${esc(x.name)}</b>${x.geaendert ? `<div class="fs-grund">geändert ${esc(fsTag(String(x.geaendert).slice(0, 10)))}</div>` : ""}</div>
        <div class="fs-rechts"><span class="fs-km">${x.art === "auto" ? `🚗 ${fsZahl(x.km)} km` : "🚶 keine"}</span></div></div>`).join("")}</div>`;
    return;
  }
  const offen = (d.antraege || []).filter((a) => a.status === "eingereicht"), gew = offen.filter((a) => FSS.wahl.has(a.id)), summe = gew.reduce((n, a) => n + a.summe, 0);
  $("fsLeitInhalt").innerHTML = `${(d.veranstaltungen || []).length > 1 ? `<label class="feld" style="margin:0 0 6px">Veranstaltung<select onchange="FSS.leitEv=this.value;fsLeitung('freigabe')">${d.veranstaltungen.map((e) => `<option value="${esc(e.id)}" ${e.id === d.veranstaltung.id ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select></label>` : ""}
    <p class="hinweis" style="margin:0 0 6px">${(d.antraege || []).length} Sammel-Abrechnung${(d.antraege || []).length === 1 ? "" : "en"} für ${esc(d.veranstaltung.name)} · ${offen.length} offen. Haken setzen, dann alle auf einmal freigeben – jedes Mitglied bekommt seine Nachricht.</p>
    <div class="fs-tabelle"><div class="fs-zeile fs-kopfzeile"><div class="fs-links">Mitglied · Fahrten · km</div><div class="fs-rechts"><span class="fs-euro">Betrag</span><span class="fs-haken">✓</span></div></div>
      ${(d.antraege || []).map((a) => `<div class="fs-zeile${a.status === "eingereicht" ? "" : " fs-aus"}" data-key="${esc(a.id)}"><div class="fs-links"><b>${esc(a.name)}</b><div class="fs-z2">${a.fahrten} Fahrt${a.fahrten === 1 ? "" : "en"} · ${fsZahl(a.km)} km · ${a.auszahlung === "bar" ? "💶 bar" : "🏦 Überweisung"}</div>${a.status === "eingereicht" ? "" : '<div class="fs-grund">✅ schon erstattet</div>'}</div>
        <div class="fs-rechts"><b class="fs-euro">${esc(fsEuro(a.summe))}</b>${a.status === "eingereicht" ? `<label class="fs-haken"><input type="checkbox" ${FSS.wahl.has(a.id) ? "checked" : ""} onchange="fsWahl(this.closest('.fs-zeile').dataset.key, this.checked)" aria-label="${esc(a.name)} freigeben"></label>` : '<span class="fs-haken"></span>'}</div></div>`).join("") || '<p class="hinweis" style="padding:8px 0">Noch keine Sammel-Abrechnungen.</p>'}
      <div class="fs-zeile fs-summe"><div class="fs-links"><b>${gew.length} ausgewählt</b></div><div class="fs-rechts"><b class="fs-euro">${esc(fsEuro(summe))}</b><span class="fs-haken"></span></div></div></div>
    <button type="button" class="knopf haupt" style="margin-top:10px;width:100%" ${gew.length ? "" : "disabled"} onclick="fsAlleFreigeben()">✅ ${gew.length === offen.length && gew.length > 1 ? "Alle" : gew.length} freigeben · ${esc(fsEuro(summe))}</button>
    <p class="hinweis" id="fsLeitFortschritt" style="margin:6px 0 0"></p>`;
}
function fsWahl(id, an) { if (an) FSS.wahl.add(id); else FSS.wahl.delete(id); fsLeitZeichnen(); }
async function fsAlleFreigeben() {
  const gew = (FSS.leit?.antraege || []).filter((a) => a.status === "eingereicht" && FSS.wahl.has(a.id)); if (!gew.length) return;
  const summe = gew.reduce((n, a) => n + a.summe, 0);
  if (!(await frage(`${gew.length} Sammel-Abrechnung${gew.length === 1 ? "" : "en"} über zusammen ${fsEuro(summe)} als erstattet markieren?\n\nJedes Mitglied bekommt eine Nachricht (Überweisung bzw. bar wie gewünscht).`, { ja: "✅ Freigeben", nein: "Abbrechen" }))) return;
  const fehler = []; let n = 0;
  for (const a of gew) {
    if ($("fsLeitFortschritt")) $("fsLeitFortschritt").textContent = `Wird freigegeben … ${n + 1} von ${gew.length}`;
    try { await api("erstattung_erledigen", { id: a.id, status: "erstattet", ausgezahlt: a.auszahlung === "bar" ? "bar" : "ueberweisung" }); n++; }
    catch (e) { fehler.push(`${a.name}: ${fehlerText(e, "nicht freigegeben")}`); }
  }
  melde(fehler.length ? `${n} freigegeben, ${fehler.length} nicht: ${fehler.join("; ")}` : `✅ ${n} Abrechnung${n === 1 ? "" : "en"} freigegeben`, !!fehler.length);
  fsLeitung("freigabe");
}
