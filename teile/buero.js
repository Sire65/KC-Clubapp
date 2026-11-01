// KC-CLUB-TEILE Stufe 4 (2.797.0): Büro-Werkzeuge der Clubleitung (Büro, Eingang, Briefe, Termine, Kontakte, Nachher, Feste, Mitgliederliste, Freud & Leid, Sprache→Brief, Aktenschrank).
// Wird beim ersten Öffnen des Büros geladen (Platzhalter aus TEILE_LISTE). Zustand BU/BNN, Tages-Übersicht, Hinweise und die Empfänger-Wahl (ZWAHL) bleiben im Hauptprogramm.
// Nicht beim Start gebraucht. Nach jeder Änderung: node tools/teile-pruefsumme.mjs
// ---------- KC-CLUB-SPRACHE-BRIEF (2.137.0, Wunsch Hansi „Neuen Brief diktieren“): Büro + Briefbogen öffnen, dann Schritt für Schritt fragen ----------
// Art (Vorlage) → An wen? (Mitglied oder Adressbuch) → Anrede → Betreff → Text (Vorlage oder diktieren) → Gruß → Vorschau.
// Jeder Schritt: antippen ODER sagen; „Überspringen“ lässt das Feld, wie es ist. Alles landet sofort im Briefbogen (Entwurf bleibt gespeichert).
// Nur Büro mit Schreibrecht (wie der Briefbogen selbst); Adressbuch nur für die Clubleitung (wie im Büro).
const SBB = { an: false, adbWarten: null };
const sbbFertig = () => { SBB.an = false; SBB.adbWarten = null; };
// Auswahl-Fenster für einen Schritt: optionen [{ id, t, sym?, re? }]; frei = gesprochener Text wird übernommen.
// Ergebnis: { id } | { text } | "weiter" (überspringen) | null (abgebrochen)
function sbbFrage({ kopf, satz, optionen = [], frei = false, hinweis = "", extra = [] }) {
  return new Promise((fertig) => {
    SB.antwort = fertig;
    const zu = (w) => { if (SB.antwort !== fertig) return; SB.antwort = null; try { SB.erk?.abort(); } catch {} SB.erk = null; try { speechSynthesis.cancel(); } catch {} fensterZu($("sbBlatt")); fertig(w); };
    const f = blattAuf("sbBlatt", `<h3 style="margin:0">${esc(kopf)}</h3>${hinweis ? `<p class="hinweis" style="margin:6px 0 0">${hinweis}</p>` : ""}
      ${optionen.length ? `<div class="sbb-optionen">${optionen.map((o, i) => `<button type="button" class="knopf sbb-opt" data-i="${i}">${o.sym ? `<span class="sbb-sym">${o.sym}</span>` : ""}<span>${esc(o.t)}</span></button>`).join("")}</div>` : ""}
      ${SB_WELLE}<p class="sb-gehoert" id="sbGehoert">${frei ? "Sag es einfach – oder tippe" : "Sag es – oder tippe"}</p>
      <div class="sbb-fuss">${extra.map((x, i) => { const [sym, ...w] = x.t.split(" "); return `<button type="button" class="knopf" data-x="${i}"><span class="sbb-sym">${sym}</span>${w.join(" ")}</button>`; }).join("")}<button type="button" class="knopf" data-a="nochmal"><span class="sbb-sym">🎙️</span>Nochmal</button><button type="button" class="knopf" data-a="weiter"><span class="sbb-sym">⏭️</span>Weiter</button><button type="button" class="knopf" data-a="zu"><span class="sbb-sym">✕</span>Abbrechen</button></div>`);
    f.classList.add("sb-still"); f.onclick = null;
    f.querySelectorAll("[data-i]").forEach((k) => (k.onclick = () => zu({ id: optionen[+k.dataset.i].id })));
    f.querySelectorAll("[data-x]").forEach((k) => (k.onclick = () => { const x = extra[+k.dataset.x]; zu("extra"); x.los(); }));
    f.querySelector('[data-a="weiter"]').onclick = () => zu("weiter");
    f.querySelector('[data-a="zu"]').onclick = () => zu(null);
    const hoeren = () => { if (SB.antwort !== fertig) return; f.classList.remove("sb-still");
      sbZuhoeren((alt) => {
        const t = alt.map(sbNorm);
        if (t.some((x) => /^(überspringen|weiter|nächste[rs]?|egal)$/.test(x))) return zu("weiter");
        if (t.some((x) => /^(abbrechen|stopp|aufhören|ende)$/.test(x))) return zu(null);
        for (const x of t) { const o = optionen.find((o) => (o.re && o.re.test(x)) || x === sbNorm(o.t)); if (o) return zu({ id: o.id }); }
        if (frei && alt[0]?.trim()) return zu({ text: alt[0].trim() });
        if ($("sbGehoert")) $("sbGehoert").textContent = "„" + alt[0] + "“ – bitte antippen oder „Nochmal“";
        f.classList.add("sb-still");
      }, () => { if ($("sbGehoert")) $("sbGehoert").textContent = "Nichts gehört – bitte antippen oder „Nochmal“"; f.classList.add("sb-still"); }); };
    f.querySelector('[data-a="nochmal"]').onclick = hoeren;
    sbSagen(satz, hoeren);
  });
}
// Adressbuch nur laden, nicht anzeigen (für „An wen?“)
async function sbbAdressen() { if (!ICH?.vorstand) return []; return (await adbDatenHolen()) || []; }
function sbbAdressTreffer(roh, adressen) {
  const w = sbWorte(roh).filter((x) => x.length >= 3 && !/^(den|die|das|der|dem|herrn?|frau|firma|an|brief)$/.test(x)); if (!w.length) return [];
  return adressen.map((a) => { const namen = sbWorte([a.company, a.firstName, a.lastName, a.contactPerson].filter(Boolean).join(" "));
    return { a, n: w.filter((x) => namen.some((y) => y === x || (x.length > 4 && sbAbstand(x, y) <= 1))).length }; })
    .filter((x) => x.n).sort((p, q) => q.n - p.n).slice(0, 4).map((x) => x.a);
}
// Anrede-Vorschläge: beim Mitglied beide Formen zum Wählen (nie raten); bei Adressen nur aus der gespeicherten Anrede
function sbbAnreden(wer) {
  if (wer?.m) { const vn = wer.m.vorname || String(wer.m.name).split(" ")[0]; return [`Liebe ${vn},`, `Lieber ${vn},`, `Hallo ${vn},`]; }
  const a = wer?.a; if (!a) return [];
  const nach = [a.title, a.lastName].filter(Boolean).join(" ");
  if (/frau/i.test(a.salutation || "") && a.lastName) return [`Sehr geehrte Frau ${nach},`];
  if (/herr/i.test(a.salutation || "") && a.lastName) return [`Sehr geehrter Herr ${nach},`];
  return a.company ? ["Sehr geehrte Damen und Herren,"] : [];
}
async function sbBrief(b = {}) {
  if (!buSchreiben()) { melde("✉️ Briefe schreibt das Büro der Clubleitung – dafür fehlt dir das Recht.", true); return sbSagen("Briefe schreibt das Büro der Clubleitung. Dafür fehlt dir das Recht."); }
  if (!(await sbEingabenOk())) return melde("✋ Alles bleibt, wie es ist");
  if (!MITGLIEDER) await mitgliederHolen().catch(() => {});
  zeige("buero"); await new Promise((r) => setTimeout(r, 300));
  let alt = null; try { alt = JSON.parse(localStorage.getItem("kc_club_brief_entwurf") || "null"); } catch {}
  buBrief();
  if (alt && (alt.text || "").trim() && alt.text !== BRIEF_VORLAGEN[alt.vorlage]?.text) {
    const neu = await sbFrage("✉️ Angefangener Brief", "Es gibt noch einen angefangenen Brief. Soll ich einen neuen beginnen?", "🆕 Neuer Brief", "✏️ Den alten weiter");
    if (neu === null) return;
    if (neu) { const { absender, fuss, name, amt } = BRIEF; try { localStorage.removeItem("kc_club_brief_entwurf"); } catch {} BRIEF = null; buBrief(); Object.assign(BRIEF, { absender, fuss, name, amt }); }
  }
  SBB.an = true; buZeigen(); window.scrollTo(0, 0);
  // 1) Art
  const art = await sbbFrage({ kopf: "✉️ Was für ein Brief?", satz: "Was für ein Brief? Zum Beispiel Einladung, Dankeschön, Geburtstag, Spende oder Beileid.",
    optionen: Object.entries(BRIEF_VORLAGEN).map(([id, v]) => ({ id, sym: v.sym, t: v.t, re: BRIEF_VORLAGE_WORTE[id] })) });
  if (art === null) return sbbAbbruch();
  if (art?.id) { const v = BRIEF_VORLAGEN[art.id]; Object.assign(BRIEF, { vorlage: art.id, betreff: v.betreff, text: v.text }); briefMerken(); buZeigen(); }
  // 2) An wen?
  const e = await sbbEmpfaenger(b.an || "");
  if (!e) return sbbAbbruch(); if (e === "warten") return; // Adressbuch offen – es geht nach der Auswahl weiter (adbFuerBrief)
  return sbbAnrede();
}
async function sbbEmpfaenger(gesagt) {
  const adressen = await sbbAdressen(), mg = (MITGLIEDER || []).filter((m) => m.person_id !== ICH?.person_id);
  let wort = gesagt;
  for (let runde = 0; runde < 3; runde++) {
    if (!wort) {
      const w = await sbbFrage({ kopf: "👤 An wen geht der Brief?", satz: `An wen geht der Brief? Sag einen Namen – ein Mitglied${adressen.length ? " oder eine Adresse aus dem Adressbuch" : ""}.`, frei: true,
        hinweis: adressen.length ? "Mitglied oder Name/Firma aus dem 📒 Adressbuch" : "Name eines Mitglieds",
        extra: adressen.length ? [{ t: "📒 Adressbuch", los: () => { SBB.adbWarten = (a) => { SBB.adbWarten = null; SBB.wer = { a }; sbbAnrede(); }; adbStart(true); } }] : [] });
      if (w === null) return false; if (w === "weiter") return true; if (w === "extra") return "warten"; wort = w.text || "";
    }
    const n = sbErkennen("Nachricht an " + wort, mg, ICH?.person_id), mids = n?.personen?.length ? n.personen : n?.vorschlag || [];
    const kand = [...mids.map((id) => ({ m: mg.find((x) => x.person_id === id) })).filter((x) => x.m), ...sbbAdressTreffer(wort, adressen).map((a) => ({ a }))].slice(0, 6);
    if (kand.length === 1) return sbbWerSetzen(kand[0]);
    if (kand.length) {
      const w = await sbbFrage({ kopf: `👤 Wen meinst du mit „${wort}“?`, satz: `Wen meinst du? ${kand.map((k) => k.m ? k.m.name : adbName(k.a) || k.a.company).join(" oder ")}?`,
        optionen: kand.map((k, i) => ({ id: i, sym: k.m ? "👤" : "📒", t: k.m ? k.m.name : [k.a.company, adbName(k.a)].filter(Boolean).join(" – "), re: new RegExp("^" + sbNorm(k.m ? k.m.name.split(" ")[0] : (k.a.lastName || k.a.company || "")).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })) });
      if (w === null) return false; if (w === "weiter") return true;
      if (w.id != null && kand[w.id]) return sbbWerSetzen(kand[w.id]);
      wort = w.text || ""; continue;
    }
    melde(`🤔 „${wort}“ habe ich weder bei den Mitgliedern noch im Adressbuch gefunden`); wort = "";
  }
  return true;
}
function sbbWerSetzen(k) { SBB.wer = k; BRIEF.empfaenger = k.m ? k.m.name : adbAnschrift(k.a); briefMerken(); buZeigen(); melde(`✉️ Empfänger: ${k.m ? k.m.name : adbName(k.a) || k.a.company}`); return true; }
async function sbbAnrede() {
  if (!SBB.an) return;
  const vorschlag = sbbAnreden(SBB.wer), liste = [...new Set([...vorschlag, ...BRIEF_ANREDEN.filter((x) => !vorschlag.length || !/…/.test(x))])];
  const w = await sbbFrage({ kopf: "👋 Welche Anrede?", satz: `Welche Anrede? ${liste.slice(0, 3).map((x) => x.replace(/,$/, "")).join(", oder ")}. Oder sag sie selbst.`, frei: true,
    optionen: liste.map((x, i) => ({ id: i, t: x, re: new RegExp("^" + sbNorm(x).replace(/[.*+?^${}()|[\]\\…]/g, "") + "$") })) });
  if (w === null) return sbbAbbruch();
  if (w?.id != null) BRIEF.anrede = liste[w.id]; else if (w?.text) BRIEF.anrede = w.text.replace(/[,.!]*$/, ",");
  briefMerken(); buZeigen(); return sbbBetreff();
}
async function sbbBetreff() {
  const b = (BRIEF.betreff || "").trim();
  const w = await sbbFrage({ kopf: "📌 Betreff", satz: b ? `Betreff: ${b}. Passt das? Sag „passt“ oder sag einen neuen Betreff.` : "Wie lautet der Betreff?", frei: true,
    optionen: b ? [{ id: "lassen", sym: "✅", t: `„${b}“ lassen`, re: /^(passt|ja|lassen|so lassen|gut|okay|ok|stimmt)( so)?$/ }] : [] });
  if (w === null) return sbbAbbruch();
  if (w?.text) { BRIEF.betreff = w.text.charAt(0).toUpperCase() + w.text.slice(1); briefMerken(); buZeigen(); }
  return sbbText();
}
async function sbbText() {
  const vorlage = BRIEF_VORLAGEN[BRIEF.vorlage]?.text, hat = (BRIEF.text || "").trim();
  let w = "diktieren";
  if (hat) {
    const a = await sbbFrage({ kopf: "📝 Brieftext", satz: vorlage && hat === vorlage.trim() ? "Soll ich den Text der Vorlage nehmen, oder möchtest du selbst diktieren?" : "Es steht schon ein Text drin. Lassen, oder neu diktieren?",
      hinweis: `<i>${esc(hat.slice(0, 160))}${hat.length > 160 ? " …" : ""}</i>`,
      optionen: [{ id: "lassen", sym: "✅", t: vorlage && hat === vorlage.trim() ? "Vorlage nehmen" : "Text lassen", re: /vorlage|nehmen|lassen|passt|^ja$|^gut$/ },
        { id: "diktieren", sym: "🎙️", t: "Selbst diktieren", re: /diktier|selbst|eigen|neu/ }, { id: "ergaenzen", sym: "➕", t: "Ergänzen", re: /ergänz|dazu|anhängen/ }] });
    if (a === null) return sbbAbbruch();
    w = a === "weiter" ? "lassen" : a.id || "lassen";
  }
  if (w === "lassen") return sbbGruss();
  if (w === "diktieren") { BRIEF.text = ""; briefMerken(); buZeigen(); }
  await new Promise((r) => setTimeout(r, 300));
  $("briefFeld_text")?.scrollIntoView({ block: "center", behavior: "smooth" });
  if (!DIKTAT_GEHT) { melde("📝 Bitte den Text eintippen – danach geht es mit dem Gruß weiter", true); $("briefFeld_text")?.focus(); return; }
  diktatStart("briefFeld_text", () => sbbGruss(), { weiter: "➜ Weiter: Gruß", immerWeiter: true });
}
async function sbbGruss() {
  if (!SBB.an) return;
  const w = await sbbFrage({ kopf: "🤝 Welcher Gruß?", satz: `Welcher Gruß zum Schluss? ${BRIEF_GRUESSE.slice(0, 3).join(", oder ")}. Oder sag ihn selbst.`, frei: true,
    optionen: BRIEF_GRUESSE.map((x, i) => ({ id: i, t: x, re: new RegExp("^" + sbNorm(x) + "$") })) });
  if (w === null) return sbbAbbruch();
  if (w?.id != null) BRIEF.gruss = BRIEF_GRUESSE[w.id]; else if (w?.text) BRIEF.gruss = w.text.replace(/[,.!]*$/, "");
  briefMerken(); buZeigen(); sbbFertig();
  const klammer = /\[[^\]]+\]/.test(`${BRIEF.betreff} ${BRIEF.text}`);
  const v = await sbFrage("✅ Brief ist fertig", klammer ? "Im Text stehen noch Stellen in eckigen Klammern – bitte noch ersetzen. Vorschau zeigen?" : "Soll ich die Vorschau zum Drucken zeigen?", "👁️ Vorschau & Drucken", "✏️ Erst prüfen");
  if (v) druckStarten("brief"); else { window.scrollTo(0, 0); melde("✏️ Der Brief steht im Büro – prüfen, dann „👁️ Vorschau & Drucken“"); }
}
function sbbAbbruch() { sbbFertig(); melde("✉️ Der Brief bleibt als Entwurf im Büro"); }
function leitungStartSetzen(was, an) {
  const key = was === "tagesinfo" ? "kc_buero_frage_aus" : EKH_AUS;
  try { an ? localStorage.removeItem(key) : localStorage.setItem(key, "1"); } catch {}
  melde(`${was === "tagesinfo" ? "📋 Tages-Übersicht" : "📥 Eingang-Hinweis"} beim Start ${an ? "an" : "aus"} (dieses Gerät)`);
}
function tiHeuteAus() {
  try { localStorage.setItem(TI_HEUTE_AUS, heuteIso()); } catch {}
  $("buGruss")?.remove(); melde("🌙 Heute nicht mehr – morgen kommt die Übersicht wieder. Jederzeit über „📋 Übersicht“.");
}

const begruessungText = (vorname) => `Herzlich willkommen ${vorname}. Schön, dass du da bist. Viel Spaß mit der Köcheclub-App. Wenn etwas nicht klappt, melde dich gerne bei mir. Gruß ${ICH?.vorname || ICH?.name || ""}`.trim();
async function begruessungSenden(pid, vorname) {
  const text = begruessungText(vorname);
  if (!(await frage(`Begrüßung an ${vorname} senden?\n\n„${text}“\n\nKommt als Nachricht mit Push.`, { ja: "✅ Senden", nein: "Nicht jetzt" }))) return;
  try {
    await api("nachricht_senden", { text, wege: ["push"], empfaenger: { personen: [pid], aemter: [], alle: false, vorstand: false }, betreff: "" });
    await api("begruessung_vermerken", { person_id: pid }).catch(() => {});
    melde(`🎉 Begrüßung an ${vorname} ist unterwegs`);
  } catch (e) { meldeFehler(e); }
}
function buStart() { BU.sicht = "start"; zeige("buero"); }
function buNeuOeffnen() {
  const u = BNN.liste[0]; if (!u) return;
  BNN.weg.add(bnnSchluessel(u)); buNeuZeigen(BNN.liste.slice(1));
  chatOeffnen(u.id); // springt zur ersten ungelesenen Nachricht
}
function buNeuWeg() { BNN.liste.forEach((u) => BNN.weg.add(bnnSchluessel(u))); buNeuZeigen([]); }
// KC-CLUB-BUERO-SCHNELL (27.10.2026, Fund Hansi „großer Hänger, Sanduhr läuft lange“ beim Öffnen des Büros, während der Spiegel-Welle > 20 s):
// Das Büro wartete mit der Sanduhr über dem ganzen Bildschirm, bis ALLE fünf Teile da waren. Jetzt ohne Sanduhr (die Seite zeigt selbst „Wird geladen …“),
// und jeder Teil erscheint, sobald er da ist – Sitzungen/Eingang zuerst, Nachher, Feste, Freud & Leid und Änderungen kommen nach. Gleiche Abfragen.
const BU_STILL = { still: true };
async function buLaden() {
  const nachzeichnen = () => { if (aktuelleAnsicht === "buero" && BU.sicht === "start") buZeigen(); };
  const nach = (p) => Promise.resolve(p).then(nachzeichnen, () => {});
  nach(buNachherListe(BU_STILL)); nach(buFesteListe(BU_F?.tage || 60, BU_STILL)); nach(flLaden(BU_STILL)); if (ICH?.vorstand || ICH?.admin) nach(aeEingangLaden(BU_STILL));
  try { BU.start = await api("buero_start", {}, BU_STILL); } catch (e) { if (BU.start) return; $("buInhalt").innerHTML = `<div class="karte hinweis">${esc(fehlerText(e))}</div>`; return; }
  buZeigen();
}
function buZurueck() {
  if (buGeaendert()) return buWeiterFragen("💾 Änderungen speichern?", "Du hast die Tagesordnung geändert, aber noch nicht gespeichert.", [["💾 Speichern", "buSpeichern()", true], ["Ohne Speichern zurück", "buZurueckOhne()"], ["Weiter bearbeiten", ""]]); // 2.749.0
  buZurueckOhne();
}
function buZurueckOhne() { if (BU.sicht !== "start") { BU.sicht = "start"; buLaden(); window.scrollTo(0, 0); } else zeige("start"); }
function buZeigen() { buZeigenRoh(); klappenMerken($("buInhalt")); }
// KC-CLUB-NUTZUNG-BEREICHE (1.89.0): Büro-Fächer einmal je Öffnen zählen (nicht bei jedem Neuzeichnen); Fall/Neu zählen als Freud & Leid
function buNzZaehlen() { const k = { fall: "fl", flneu: "fl" }[BU.sicht] || BU.sicht; if (!k || k === "start" || k === BU.nzSicht) return; BU.nzSicht = k; nzZaehlen("buero_" + k); }
// ---------- KC-CLUB-LIVE-VORSCHAU (1.67.0, Wunsch Hansi „immer eine Vorschau, damit man sieht, wie die Vorlage aussieht“) ----------
// Beim Bearbeiten steht unten ein kleines A4-Blatt, das sich bei jeder Änderung selbst erneuert – gebaut mit dem vorhandenen
// Druck-Kern (DRUCKARTEN + druckSeiteBauen + druckHtml), also genau so, wie es gedruckt wird. Antippen = große Vorschau mit 🖨️.
// Neue Bereiche: Büro-Sicht → Druckart hier eintragen und lvKasten() in die Seite setzen.
const LV_ARTEN = { sitzung: "sitzung", brief: "brief", liste: "mitgliederliste" };
const LV = { art: null, t: 0 };
const lvKasten = () => `<div class="karte lv" id="lvKasten"><div class="lv-kopf"><b>👁️ So sieht es aus</b><button class="knopf klein" onclick="lvGross()">🔍 Groß ansehen</button></div>
  <p class="hinweis lv-hin">Ändert sich sofort mit – genau so wird es gedruckt.</p><div class="lv-blatt"><iframe id="lvRahmen" title="Vorschau" tabindex="-1" aria-hidden="true"></iframe><button class="lv-auf" onclick="lvGross()" aria-label="Vorschau groß ansehen"></button></div></div>`;
function lvNachZeigen() { LV.art = aktuelleAnsicht === "buero" ? LV_ARTEN[BU.sicht] || null : null; if (LV.art && $("lvRahmen")) lvAuffrischen(0); }
function lvAuffrischen(ms = 350) { if (!LV.art) return; clearTimeout(LV.t); LV.t = setTimeout(lvJetzt, ms); }
async function lvJetzt() {
  const r = $("lvRahmen"); if (!r || !LV.art) return;
  const alt = DRUCK; DRUCK = { art: LV.art };
  try {
    if (!(await druckSeiteBauen())) return;
    const zoom = Math.min(1, (r.parentNode.clientWidth || 300) / ((DRUCK.quer ? 297 : 210) * 3.78 + 20));
    r.onload = () => { try { r.style.height = Math.min(4000, r.contentDocument.documentElement.scrollHeight + 4) + "px"; } catch {} };
    r.srcdoc = druckHtml(true).replace("</style>", `html{zoom:${zoom.toFixed(3)}}body{padding:4px 0!important}</style>`);
  } catch (e) { r.srcdoc = `<p style="font:15px sans-serif;color:#666;padding:12px">${esc(fehlerText(e))}</p>`; r.style.height = "60px"; }
  finally { DRUCK = alt; }
}
function lvGross() { if (LV.art) druckStarten(LV.art); }
// Bereich im Büro: Klappkarte mit Pfeil und Schloss wie in den Einstellungen (Zustand je Gerät gemerkt)
const buBereich = (name, titel, inhalt) => `<details class="karte bu-bereich" data-klappe="buero_${name}" data-ohne-unten open><summary>${titel}</summary>${inhalt}</details>`;
function buZeigenRoh() { buNzZaehlen(); if ($("buKopfGruss") && ICH) $("buKopfGruss").textContent = `${buTageszeit()}, ${ICH.vorname || ICH.name}!`; // 1.83.0: Begrüßung in der Kopfzeile
  $("buInhalt").innerHTML = buAnsichtHinweis() + (BU.sicht === "ordner" ? buOrdnerHtml() : BU.sicht === "sitzung" ? buSitzungHtml() : BU.sicht === "eingang" ? buEingangHtml() : BU.sicht === "brief" ? buBriefHtml() : BU.sicht === "termine" ? buTermineHtml() : BU.sicht === "kontakt" ? buKontaktHtml() : BU.sicht === "nachher" ? buNachherHtml() : BU.sicht === "feste" ? buFesteHtml() : BU.sicht === "liste" ? buListeHtml() : BU.sicht === "fl" ? buFlHtml() : BU.sicht === "flneu" ? buFlNeuHtml() : BU.sicht === "fall" ? buFallHtml() : BU.sicht === "rechte" ? buRechteHtml() : buStartHtml()); lvNachZeigen(); }
const BU_TAG = 86400000;
const buVorher = (t, tage) => new Date(new Date(t.beginn).getTime() - tage * BU_TAG);
const buAmTag = (t, tage, stunde) => new Date(taZeitpunkt(isoBerlin(buVorher(t, tage)), `${String(stunde).padStart(2, "0")}:00`)); // Ortszeit, Sommer-/Winterzeit richtig
const buFrist = (t) => buVorher(t, svWerte().einladung_tage); // Einladung mit Tagesordnung
const buBis = (d, uhr = false) => `bis spätestens ${fTag.format(d)}${uhr ? ` ${fZeit.format(d)} Uhr` : ""}`;
const buFristText = (t) => buBis(buFrist(t));
const buKnapp = (t) => Date.now() > buFrist(t).getTime();
const BU_KNAPP_TEXT = "⚠️ Knapp – die Mitglieder haben nur noch wenig Zeit";
const buUnterlagenFrist = (t) => buVorher(t, svWerte().unterlagen_tage), buTaschenFrist = (t) => buAmTag(t, 0, svWerte().tasche_stunde);
const BU_SCHRITTE = [
  // 1. Die Mitglieder reichen Themen ein – Info, keine Aufgabe (Anmeldeschluss wie beim Vorschlag: vsSchluss)
  { id: "vorschlaege", sym: "💡", t: "Vorschläge der Mitglieder", fn: () => "zeige('vorschlaege')",
    stand: (t) => { const d = vsSchluss({ ...t, art: "treffen" }); return !d ? ["fertig", "ohne Anmeldeschluss"] : Date.now() >= d.getTime() ? ["fertig", `Anmeldeschluss war ${wann(d.toISOString())} – danach nur noch ❗ dringend`]
      : ["spaeter", `Die Mitglieder reichen Themen ein – ${buBis(d, true)}`]; } },
  { id: "vorbereiten", sym: "📝", t: "Tagesordnung festlegen", fn: (t) => `buSitzungOeffnen('${t.id}', 'to')`,
    stand: (t) => (t.vorbereitet ? ["fertig", "festgelegt und gespeichert"] : ["jetzt", `Vorschläge aufnehmen, Reihenfolge – ${buFristText(t)}`]), frist: (t) => (t.einladung_am ? null : buFrist(t)),
    frage: () => ({ q: "Die Tagesordnung ist noch nicht festgelegt. Jetzt die Tagesordnung festlegen und die Vorschläge der Mitglieder aufnehmen?", ja: "📝 Ja, jetzt festlegen" }) },
  { id: "einladung", sym: "📨", t: "Mitglieder einladen", fn: (t) => `buEinladung('${t.id}', false${t.geaendert_nach_einladung ? ", true" : ""})`,
    stand: (t) => (!t.vorbereitet ? ["spaeter", `nach dem Festlegen der Tagesordnung – ${buFristText(t)}`] : t.geaendert_nach_einladung ? ["jetzt", "Tagesordnung nach der Einladung geändert – Mitglieder informieren?", "📣 Mitglieder informieren?"]
      : t.einladung_am ? ["fertig", `gesendet ${zeitKurz(t.einladung_am)}`] : ["jetzt", `Brief mit Tagesordnung an alle oder ausgewählte – ${buFristText(t)}`]), frist: (t) => (t.einladung_am ? null : buFrist(t)),
    // 2.751.0 KC-CLUB-AENDERUNG-MELDUNG (Wunsch Hansi 29.10. „Clubleitung fragen, ob die Mitglieder informiert werden – ja: Sende-Menü, nein: nicht senden“)
    frage: (t) => (t.geaendert_nach_einladung ? { q: "Die Tagesordnung hat sich nach der Einladung geändert (z. B. ein dringender Vorschlag). Sollen die Mitglieder informiert werden?", ja: "📣 Ja – Änderungsmeldung senden", nein: ["🙅 Nein, nicht informieren", `buInformierenNein('${t.id}')`], art: "aenderung" }
      : { q: "Die Tagesordnung ist fertig. Sollen alle Mitglieder jetzt die Einladung bekommen?", ja: "✅ Ja, jetzt einladen", nein: ["✏️ Nein, erst die Tagesordnung ändern", `buSitzungOeffnen('${t.id}', 'to')`] }) },
  { id: "erinnerung", sym: "🔔", t: "An die Antwort erinnern", fn: (t) => `buEinladung('${t.id}', true)`,
    stand: (t) => { const ab = buVorher(t, svWerte().erinnerung_tage).getTime(), seit = t.einladung_am ? Date.now() - new Date(t.einladung_am) : 0;
      if (t.erinnerung_am) return ["fertig", `erinnert ${zeitKurz(t.erinnerung_am)}`];
      if (t.einladung_am && !t.ohne) return ["fertig", "alle haben geantwortet 👍"];
      if (!t.einladung_am || Date.now() < ab || seit < BU_TAG) return ["spaeter", `ab ${fTag.format(new Date(Math.max(ab, t.einladung_am ? Date.parse(t.einladung_am) + BU_TAG : 0)))} – nur an die ohne Antwort`];
      return ["jetzt", `${t.ohne} ${t.ohne === 1 ? "hat" : "haben"} noch nicht geantwortet`]; },
    frage: (t) => ({ q: `${t.ohne} ${t.ohne === 1 ? "Mitglied hat" : "Mitglieder haben"} noch nicht geantwortet. Erinnerung senden?`, ja: "🔔 Ja, jetzt erinnern", nein: ["🙅 Nein, nicht nötig", ""] }) },
  { id: "unterlagen", sym: "🖨️", t: "Sitzung vorbereiten", fn: (t) => `buSitzungOeffnen('${t.id}', 'vor')`,
    stand: (t) => { const f = buUnterlagenFrist(t);
      if (t.unterlagen_am) return ["fertig", `vorbereitet ${zeitKurz(t.unterlagen_am)}`];
      if (!t.einladung_am) return ["spaeter", "nach der Einladung – Anwesende ankreuzen, Anmerkung, Mitschreibbogen drucken"];
      return Date.now() < f.getTime() - BU_TAG ? ["spaeter", `ab ${fTag.format(new Date(f.getTime() - BU_TAG))} – Anwesende ankreuzen, Anmerkung, Mitschreibbogen drucken`]
        : ["jetzt", `Anwesende ankreuzen, Anmerkung, Mitschreibbogen drucken – ${buBis(f)}`]; },
    frist: (t) => (t.unterlagen_am ? null : buUnterlagenFrist(t)),
    frage: () => ({ q: "Die Einladung ist raus. Jetzt die Sitzung vorbereiten – Anwesende ankreuzen, Anmerkung zum Protokoll, Mitschreibbogen drucken?", ja: "🖨️ Ja, jetzt vorbereiten" }) },
  { id: "aktentasche", sym: "💼", t: "Aktentasche packen", nur: () => !!ICH?.vorstand, fn: (t) => `atOeffnen('${t.id}')`,
    stand: (t) => { const f = buTaschenFrist(t);
      if (t.aktentasche && t.aktentasche.status === "gepackt") return ["fertig", "gepackt – liegt im Clubabend Live"];
      if (!t.einladung_am) return ["spaeter", "zuletzt – fertige Unterlagen und die Mitnehm-Liste"];
      return !t.unterlagen_am && Date.now() < f.getTime() - BU_TAG ? ["spaeter", `nach dem Vorbereiten – ${buBis(f, true)}`]
        : ["jetzt", `${t.aktentasche?.status === "vorlaeufig" ? "vorläufig gepackt – " : ""}fertige Unterlagen und Mitnehm-Liste – ${buBis(f, true)}`]; },
    frist: (t) => (t.aktentasche?.status === "gepackt" ? null : buTaschenFrist(t)),
    frage: () => ({ q: "Die Sitzung ist vorbereitet. Jetzt die Aktentasche packen – fertige Unterlagen und was du sonst noch mitnehmen musst?", ja: "💼 Ja, jetzt packen" }) },
  { id: "clubabend", sym: "🍽️", t: "Clubabend Live", fn: (t) => `caOeffnen(false, '${t.id}')`,
    stand: (t) => { const b = new Date(t.beginn).getTime(), j = Date.now(); return j >= b - CA_VORHER_MIN * 60000 && j <= b + CA_DAUER_STD * 3600000 ? ["jetzt", "heute – Aktentasche, Anwesende, Tagesordnung, zum Schluss der nächste Termin"] : ["spaeter", "am Abend selbst"]; },
    frage: () => ({ q: "Heute ist Clubsitzung. Jetzt den Clubabend öffnen – Aktentasche, Anwesende, Tagesordnung abhaken, zum Schluss der nächste Termin?", ja: "🍽️ Ja, Clubabend öffnen" }) },
];
function buSchritteFuer(t) {
  return t ? BU_SCHRITTE.filter((x) => !x.nur || x.nur()).map((x) => { const [st, u, knopf] = x.stand(t), fr = x.frist?.(t) || null;
    return { ...x, st, u, knopf: knopf || `${x.sym} ${x.t}`, los: x.fn(t), fristAm: fr, knapp: st === "jetzt" && !!fr && Date.now() > fr.getTime() }; }) : [];
}
function buNaechster(t) { return buSchritteFuer(t).find((x) => x.st === "jetzt")?.id ?? null; }
// Karte „Schritt für Schritt“: erledigt ✅ · jetzt dran 👉 (mit Knopf) · später ⏳
function buSchritteHtml(t, klein = false) {
  const l = buSchritteFuer(t); if (!l.length) return "";
  const dran = l.find((x) => x.st === "jetzt");
  return `<div class="karte bu-schritte${klein ? " klein" : ""}"><div class="bu-schritte-kopf">🧭 Schritt für Schritt: <b>${esc(t.titel)}</b> <small>${esc(wann(t.beginn))}</small></div>${buVertretungHtml(t)}
    <ol>${l.map((x) => `<li class="bu-schritt ${x.st}${x.knapp ? " knapp" : ""}"><span class="bu-schritt-sym">${x.st === "fertig" ? "✅" : x.st === "jetzt" ? "👉" : "⏳"}</span><span><b>${esc(x.t)}</b><small>${esc(x.u)}</small>${x.knapp ? `<small class="bu-knapp">${x.id === "aktentasche" || x.id === "unterlagen" ? "⚠️ Knapp – die Sitzung ist bald" : BU_KNAPP_TEXT}</small>` : ""}</span></li>`).join("")}</ol>
    ${dran && !klein ? `<button class="knopf haupt" style="width:100%;text-align:center" onclick="${dran.los}">${esc(dran.knopf)}</button>` : ""}</div>`;
}
// nächster Schritt fürs Büro (gelber Zettel): Nachbereitung der letzten Sitzung nur, solange die nächste nicht dran ist (≤ 14 Tage und ein Schritt offen).
// 2.751.0 KC-CLUB-SITZUNG-ABLAUF (Wunsch Hansi „auf dem gelben Zettel müssen immer die nächsten Schritte erscheinen“): ist gerade nichts fällig,
// steht dort der nächste anstehende Schritt mit „ab …“ – nie ein leerer Zettel, solange eine Sitzung ansteht.
function buDran(t) {
  const nt = buNachherTipp(), l = buSchritteFuer(t), sch = l.find((x) => x.st === "jetzt"), naechst = l.find((x) => x.st === "spaeter" && x.id !== "vorschlaege");
  const nah = t && new Date(t.beginn) - Date.now() < 14 * BU_TAG;
  if (sch && (!nt || nah)) return { text: sch.knopf, fn: sch.los };
  if (nt) return { text: nt.text, fn: `buNachherWahl(${esc(JSON.stringify(nt.text))})` };
  return naechst && nah ? { text: `${naechst.sym} ${naechst.t} · ${naechst.u.split(" – ")[0]}`, fn: naechst.los, spaeter: true } : null;
}
// 2.751.0 KC-CLUB-SITZUNG-VERTRETUNG (Wunsch Hansi 29.10. „bei Bedarf kann Admin oder Kassenwart den Ablauf machen – wenn der Clubsprecher krank ist,
// muss es ja einer übernehmen“): je Sitzung „🙋 Vorbereitung übernehmen“ / „↩️ Zurückgeben“ – nur Clubleitung mit Büro-Schreibrecht. Danach bekommt die
// Vertretung die Fragen beim Start und den gelben Zettel; nach der Sitzung ist es vorbei (gilt nur für diese Sitzung).
function buVertretungHtml(t) {
  if (!t || !buSchreiben() || !(ICH?.vorstand || ICH?.admin)) return t?.vertretung ? `<p class="hinweis bu-vertretung">🙋 Vertretung: <b>${esc(t.vertretung.name || "")}</b> bereitet diese Sitzung vor</p>` : "";
  const v = t.vertretung, ich = v?.person_id === ICH?.person_id, darf = ich || ICH?.admin || (ICH?.aemter || []).includes(svWerte().vorbereiter_amt);
  if (v) return `<p class="hinweis bu-vertretung">🙋 Vertretung: <b>${ich ? "du" : esc(v.name || "")}</b> ${ich ? "bereitest" : "bereitet"} diese Sitzung vor${darf ? ` <button class="knopf klein" onclick="buVertretung('${t.id}', false)">↩️ Zurückgeben</button>` : ""}</p>`;
  return buVertretungAngebot(t) ? `<p class="hinweis bu-vertretung">Ist der Clubsprecher verhindert (z. B. krank)? <button class="knopf klein" onclick="buVertretung('${t.id}', true)">🙋 Vorbereitung übernehmen</button></p>` : "";
}
// „Vorbereitung übernehmen“ anbieten? (Clubleitung mit Schreibrecht, noch keine Vertretung, ich bereite nicht schon selbst vor)
const buVertretungAngebot = (t) => !!t && buSchreiben() && !!(ICH?.vorstand || ICH?.admin) && !t.vertretung && !(t.vorbereiter || []).includes(ICH?.person_id);
function buKopfKnoepfe(raum, t) {
  return `<div class="bu-knopfreihe bu-ikonreihe">${[
    ICH?.vorstand ? buIkon("📋", "Übersicht", "tagesinfoZeigen(true)", "Übersicht für heute") : "",
    raum ? buIkon("☰", "Liste", "buAnsichtWechseln()", "Büro als Liste zeigen") : buIkon("🗄️", "Raum", "buAnsichtWechseln()", "Büro-Raum mit Regal zeigen"),
    ICH?.vorstand ? buIkon("💼", "Tasche", "atStart()", "Aktentasche") : "",
    buFilmKnopf(),
    buSchreiben() ? buIkon("📥", "Einlesen", "buEinlesen()", "Einlesen: Foto oder Datei") : "",
    raum && BSPR.geht ? buIkon("🎙️", "Sprechen", "buSprechen()", "Sprachsteuerung: sag z. B. „Öffne Ordner Protokolle“ oder „Anrufen Erika“", " bu-mikro") : "",
    raum && buVertretungAngebot(t) ? buIkon("🙋", "Vertreten", `buVertretung('${t.id}', true)`, "Ist der Clubsprecher verhindert (z. B. krank)? Vorbereitung übernehmen") : "",
  ].join("")}</div>`;
}
async function buVertretung(id, an, sofort = false) {
  if (!sofort && !(await frage(an ? "🙋 Vorbereitung übernehmen?\n\nDu bekommst bis zur Sitzung die Erinnerungen und Fragen beim Start. Clubsprecher und Clubleitung bekommen Bescheid." : "↩️ Vertretung zurückgeben?\n\nDann bekommt wieder der Clubsprecher die Erinnerungen.", { ja: an ? "🙋 Übernehmen" : "↩️ Zurückgeben", nein: "Abbrechen" }))) return;
  let r; try { r = await api("buero_vertretung", { treffen_id: id, an }); } catch (e) { return meldeFehler(e); }
  const ts = (BU.start?.sitzungen || []).find((x) => x.id === id);
  if (ts) { ts.vertretung = r.vertretung; ts.vorbereiter = r.vertretung ? [ICH.person_id] : BU.start?.vorbereiter || []; }
  melde(an ? "🙋 Du bereitest diese Sitzung vor – Clubsprecher und Clubleitung wissen Bescheid." : "↩️ Zurückgegeben – der Clubsprecher bekommt wieder die Erinnerungen.");
  if (aktuelleAnsicht === "buero") buZeigen(); else if (an) buStart();
}
// 2.751.0 KC-CLUB-AENDERUNG-MELDUNG: „Nein, Mitglieder nicht informieren“ – gilt für diesen Stand der Tagesordnung (Server merkt ihn)
async function buInformierenNein(id) {
  try { await api("buero_informieren_nein", { treffen_id: id }); } catch (e) { return meldeFehler(e); }
  const ts = (BU.start?.sitzungen || []).find((x) => x.id === id); if (ts) ts.geaendert_nach_einladung = false;
  melde("👍 Gut – die Mitglieder werden nicht informiert. Die Änderung steht in der App, die Einreicher wissen Bescheid."); if (aktuelleAnsicht === "buero") buZeigen();
}
async function svOeffnen() {
  let r; try { r = await api("sitzung_vorgaben", {}, { warten: true }); } catch (e) { return meldeFehler(e); }
  if (!MITGLIEDER) try { await mitgliederHolen(); } catch {} // 2.753.0: für die Auswahl der Ämter
  const v = { ...SV_STANDARD, ...r.vorgaben }, zahlen = (id, von, bis, w, einh) => `<select id="${id}">${Array.from({ length: bis - von + 1 }, (_, i) => von + i).map((n) => `<option value="${n}"${n === w ? " selected" : ""}>${n} ${einh(n)}</option>`).join("")}</select>`;
  const tage = (n) => (n === 1 ? "Tag vorher" : n === 0 ? "Tage vorher (am Sitzungstag)" : "Tage vorher"), uhr = () => "Uhr";
  const aemter = [...new Set([v.vorbereiter_amt, ...(MITGLIEDER || []).flatMap((m) => m.aemter || [])].filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
  blattAuf("svBlatt", `<h3 style="margin:0">⚙️ Sitzungs-Vorgaben</h3><p class="hinweis" style="margin:2px 0 8px">Gilt für alle ordentlichen Sitzungen. Daran richten sich der gelbe Zettel, die Fragen beim Start und der Vorschlag für den nächsten Termin.</p>
    <div class="karte"><b>⏰ Fristen vor der Sitzung</b>
      <label class="feld">💡 Vorschläge der Mitglieder bis<span class="zwei">${zahlen("svVt", 1, 14, v.vorschlag_tage, tage)}${zahlen("svVs", 6, 22, v.vorschlag_stunde, uhr)}</span></label>
      <label class="feld">📨 Einladung spätestens${zahlen("svEt", 1, 14, v.einladung_tage, tage)}</label>
      <label class="feld">🔔 An die Antwort erinnern ab${zahlen("svRt", 1, 7, v.erinnerung_tage, tage)}</label>
      <label class="feld">🖨️ Sitzung vorbereiten bis${zahlen("svUt", 0, 7, v.unterlagen_tage, tage)}</label>
      <label class="feld">💼 Aktentasche gepackt am Sitzungstag bis${zahlen("svTs", 6, 22, v.tasche_stunde, uhr)}</label>
      <label class="feld">🧭 Beim Start fragen ab${zahlen("svLt", 3, 21, v.vorlauf_tage, tage)}</label>
      <label class="feld">👤 Wer bereitet die Sitzung vor (Amt)<select id="svAmt">${aemter.map((a) => `<option${a === v.vorbereiter_amt ? " selected" : ""}>${esc(a)}</option>`).join("")}</select></label>
      <p class="hinweis" style="margin:4px 0 0">Die übrige Clubleitung bekommt nur bei überschrittener Frist einen Hinweis.</p></div>
    <div class="karte"><b>🗓️ Vorschlag für den nächsten Termin</b>
      <label class="feld">Letzter … im Folgemonat<select id="svWt">${SV_WTAGE.map((w, i) => `<option value="${i}"${i === v.wochentag ? " selected" : ""}>${w}</option>`).join("")}</select></label>
      <div class="zwei"><label class="feld">Uhrzeit<input id="svUhr" type="time" value="${esc(v.uhrzeit || "")}"></label><label class="feld">Ort<input id="svOrt" maxlength="120" value="${esc(v.ort || "")}" placeholder="wie beim letzten Treffen"></label></div>
      <p style="margin:6px 0 2px">Monate ohne ordentliche Sitzung (werden übersprungen):</p>
      <div class="hl-chips" id="svOhne">${SV_MONATE.map((m, i) => `<button type="button" class="chip${v.ohne_monate.includes(i + 1) ? " an" : ""}" data-m="${i + 1}" onclick="this.classList.toggle('an')">${m}</button>`).join("")}</div>
      <p class="hinweis" style="margin:4px 0 0">Eine Zusatzsitzung legst du wie gewohnt unter 📅 Termine an.</p></div>
    <div class="knoepfe"><button class="knopf haupt" onclick="svSpeichern(this)">💾 Speichern</button><button class="knopf" onclick="$('svBlatt').remove()">Abbrechen</button></div>`);
}
async function svSpeichern(knopf) {
  const n = (id) => Number($(id).value), vorgaben = { vorschlag_tage: n("svVt"), vorschlag_stunde: n("svVs"), einladung_tage: n("svEt"), erinnerung_tage: n("svRt"), unterlagen_tage: n("svUt"),
    tasche_stunde: n("svTs"), vorlauf_tage: n("svLt"), vorbereiter_amt: $("svAmt").value, wochentag: n("svWt"), uhrzeit: $("svUhr").value || null, ort: $("svOrt").value.trim() || null,
    ohne_monate: [...document.querySelectorAll("#svOhne .chip.an")].map((b) => Number(b.dataset.m)) };
  if (vorgaben.vorschlag_tage <= vorgaben.einladung_tage && !(await frage("Der Vorschlagsschluss liegt nicht vor der Einladung – dann fehlen späte Vorschläge in der Einladung. Trotzdem speichern?"))) return;
  await einmal(knopf, async () => {
    try { const r = await api("sitzung_vorgaben_speichern", { vorgaben }); if (INIT) INIT.sitzungVorgaben = r.vorgaben; if (BU.start) BU.start.vorgaben = r.vorgaben;
      $("svBlatt")?.remove(); melde("💾 Sitzungs-Vorgaben gespeichert"); if (aktuelleAnsicht === "buero") buZeigen(); } catch (e) { meldeFehler(e); }
  });
}
function buInformierenFragen(id) {
  buWeiterFragen("📣 Mitglieder informieren?", "Die Tagesordnung hat sich nach der Einladung geändert. Sollen die Mitglieder eine Änderungsmeldung bekommen (mit „Neu / Entfällt“)? Ohne Meldung steht die Änderung trotzdem in der App.", [
    ["📣 Ja – Änderungsmeldung senden (Vorschau)", `buEinladung('${id}', false, true)`, true], ["🙅 Nein, nicht informieren", `buInformierenNein('${id}')`], ["⏰ Später entscheiden", ""]]);
}
// KC-CLUB-SITZUNG-AUFGABE-START (2.750.0, Wunsch Hansi 29.10. „beim Programmstart erinnern, welche Aufgabe zu erledigen ist – mit Abhaken,
// Ja, Nein oder später nochmal erinnern“): wer die Sitzung im Büro vorbereiten darf, bekommt beim Start (ab 7 Tage vorher, nach den anderen
// Start-Fenstern) genau eine Frage: die nächste offene Aufgabe aus BU_SCHRITTE, darüber die Schritte mit ✅ abgehakt.
// „Später“ = 3 Stunden Ruhe für diese Aufgabe, „Nein“ bei der Erinnerung = für diese Sitzung nicht mehr fragen (je Gerät).
// Liest nur (buero_start), sendet nichts – gesendet wird erst im gewohnten Fenster nach „Ja“.
const BU_AUFGABE_MERK = "kc_club_bu_aufgabe", BU_AUFGABE_RUHE_MS = 3 * 3600000;
const buAufgabeMerker = () => { try { return JSON.parse(localStorage.getItem(BU_AUFGABE_MERK) || "{}") || {}; } catch { return {}; } };
function buAufgabeMerken(schluessel, bis) {
  const m = buAufgabeMerker(), jetzt = Date.now();
  for (const k of Object.keys(m)) if (m[k] !== "nie" && m[k] < jetzt) delete m[k]; // abgelaufene „Später“ wegräumen
  m[schluessel] = bis; if (Object.keys(m).length > 40) delete m[Object.keys(m)[0]];
  try { localStorage.setItem(BU_AUFGABE_MERK, JSON.stringify(m)); } catch {}
}
// nächste Aufgabe zum Fragen: Schritt ist dran, hat eine Frage und ruht nicht (Später/Nein)
function buAufgabeFuer(t, merker = buAufgabeMerker(), jetzt = Date.now()) {
  if (!t || new Date(t.beginn) - jetzt > svWerte().vorlauf_tage * BU_TAG) return null;
  for (const x of buSchritteFuer(t)) {
    if (x.st !== "jetzt" || !x.frage) continue;
    const f = x.frage(t), k = `${t.id}:${x.id}${f.art ? ":" + f.art : ""}`, r = merker[k];
    if (r === "nie" || (r && r > jetzt)) continue;
    return { ...x, f, k };
  }
  return null;
}
// 2.751.0 KC-CLUB-SITZUNG-KONTROLLE (Wunsch Hansi 29.10. „auch Kassenwart und Admin zur Kontrolle“): die Aufgaben fragt die App nur, wer die Sitzung
// vorbereitet (Amt aus den Sitzungs-Vorgaben; hat niemand das Amt: wer im Büro schreiben darf). Die übrige Clubleitung bekommt beim Start nur dann
// einen Hinweis, wenn eine Frist überschritten ist – mit „Anschreiben“ oder selbst ins Büro.
// 2.751.0 KC-CLUB-SITZUNG-VERTRETUNG: hat jemand die Vorbereitung dieser Sitzung übernommen, steht nur er in t.vorbereiter
const buIchBereite = (r = BU.start) => { const v = r?.sitzungen?.[0]?.vorbereiter || r?.vorbereiter || []; return v.length ? v.includes(ICH?.person_id) : buSchreiben(); };
function buKontrolleFuer(t, merker = buAufgabeMerker(), jetzt = Date.now()) {
  if (!t || new Date(t.beginn) - jetzt > svWerte().vorlauf_tage * BU_TAG) return null;
  const l = buSchritteFuer(t).filter((x) => x.knapp), k = `${t.id}:kontrolle:${l.map((x) => x.id).join(",")}`, r = merker[k];
  return l.length && r !== "nie" && !(r && r > jetzt) ? { l, k } : null;
}
async function buAufgabePruefen(versuch = 0) {
  if (!buSchreiben() && !(buDarf() && (ICH?.vorstand || ICH?.admin))) return;
  try { if (sessionStorage.getItem("kc_bu_aufgabe_gezeigt")) return; } catch {}
  const besetzt = () => document.querySelector(FENSTER_OFFEN + ", .dlg, #rgSchicht") || aktuelleAnsicht !== "start";
  if (besetzt()) { if (versuch < 30) setTimeout(() => buAufgabePruefen(versuch + 1), 5000); return; } // erst wenn Tages-Übersicht & Co. zu sind
  let r; try { r = await api("buero_start", {}, { still: true }); } catch { return; } // ohne Verbindung keine Frage (nie raten)
  BU.start = r; const t = r?.sitzungen?.[0];
  if (!buIchBereite(r)) return (ICH?.vorstand || ICH?.admin) && buKontrolleZeigen(t, r, besetzt, versuch);
  const a = buSchreiben() ? buAufgabeFuer(t) : null; if (!a) return;
  if (besetzt()) { if (versuch < 30) setTimeout(() => buAufgabePruefen(versuch + 1), 5000); return; }
  try { sessionStorage.setItem("kc_bu_aufgabe_gezeigt", "1"); } catch {}
  const f = blattAuf("buAufgabeBlatt", `<h3 style="margin:0">🗓️ ${esc(t.titel)} · ${esc(wann(t.beginn))}</h3>
    <p class="hinweis" style="margin:0">Deine Aufgaben für diese Sitzung – erledigte sind abgehakt.</p>
    ${buSchritteHtml(t, true)}
    <p style="margin:6px 0"><b>${esc(a.f.q)}</b></p>${a.knapp ? `<p class="bu-knapp" style="margin:0 0 6px">${BU_KNAPP_TEXT}</p>` : ""}
    <div class="knoepfe" style="flex-direction:column;align-items:stretch"><button class="knopf haupt" style="text-align:center" data-w="ja">${esc(a.f.ja)}</button>
    ${a.f.nein ? `<button class="knopf" style="text-align:center" data-w="nein">${esc(a.f.nein[0])}</button>` : ""}
    <button class="knopf" style="text-align:center" data-w="spaeter">⏰ Später nochmal erinnern${a.frist?.(t) ? " – Änderungen bleiben möglich" : ""}</button></div>`);
  f.querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => {
    f.remove(); const w = b.dataset.w;
    if (w === "spaeter") { buAufgabeMerken(a.k, Date.now() + BU_AUFGABE_RUHE_MS); return melde("⏰ Gut – ich erinnere dich beim nächsten Start in ein paar Stunden wieder."); }
    const fn = w === "ja" ? a.los : a.f.nein[1];
    if (!fn) { buAufgabeMerken(a.k, "nie"); return melde("👍 Gut – für diese Sitzung frage ich nicht mehr danach."); }
    buStart(); new Function(fn)();
  }));
}
async function buKontrolleZeigen(t, r, besetzt, versuch) {
  const kk = buKontrolleFuer(t); if (!kk) return;
  // 2.753.0: die Mitgliederliste lädt die App erst bei Bedarf – ohne sie fehlte der Knopf „Clubsprecher anschreiben“ (Fund beim Film 29.10.)
  if (!MITGLIEDER) try { await mitgliederHolen(); } catch {}
  if (besetzt()) { if (versuch < 30) setTimeout(() => buAufgabePruefen(versuch + 1), 5000); return; }
  try { sessionStorage.setItem("kc_bu_aufgabe_gezeigt", "1"); } catch {}
  const wer = (t?.vorbereiter || r?.vorbereiter || []).map((id) => (MITGLIEDER || []).find((m) => m.person_id === id)).filter(Boolean)[0], amt = t?.vertretung ? "Vertretung" : svWerte().vorbereiter_amt;
  const f = blattAuf("buAufgabeBlatt", `<h3 style="margin:0">⚠️ Zur Kontrolle: ${esc(t.titel)} · ${esc(wann(t.beginn))}</h3>
    <p class="hinweis" style="margin:0">Für die Clubleitung – hier ist eine Frist überschritten:</p>
    <ul class="bu-hinweise">${kk.l.map((x) => `<li><b>${esc(x.sym)} ${esc(x.t)}</b> – Frist war ${esc(fTag.format(x.fristAm))}${x.id === "aktentasche" ? ` ${esc(fZeit.format(x.fristAm))} Uhr` : ""}</li>`).join("")}</ul>
    ${buSchritteHtml(t, true)}
    <div class="knoepfe" style="flex-direction:column;align-items:stretch">${wer ? `<button class="knopf haupt" style="text-align:center" data-w="schreiben">💬 ${esc(wer.vorname || wer.name)} (${esc(amt)}) anschreiben</button>` : ""}
    ${buSchreiben() ? `<button class="knopf" style="text-align:center" data-w="uebernehmen">🙋 Ich übernehme die Vorbereitung (Vertretung)</button>` : ""}
    <button class="knopf${wer ? "" : " haupt"}" style="text-align:center" data-w="buero">🗂️ Ins Büro – selbst erledigen</button>
    <button class="knopf" style="text-align:center" data-w="spaeter">⏰ Später nochmal</button><button class="knopf" style="text-align:center" data-w="nie">🙅 Für diese Frist nicht mehr</button></div>`);
  f.querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => {
    f.remove(); const w = b.dataset.w;
    if (w === "schreiben") return direkt(wer.person_id);
    if (w === "uebernehmen") return buVertretung(t.id, true, true);
    if (w === "buero") return buStart();
    buAufgabeMerken(kk.k, w === "nie" ? "nie" : Date.now() + BU_AUFGABE_RUHE_MS);
    melde(w === "nie" ? "👍 Gut – für diese Frist kommt kein Hinweis mehr." : "⏰ Gut – ich sage beim nächsten Start in ein paar Stunden wieder Bescheid.");
  }));
}
// KC-CLUB-BUERO-RAUM (1.65.0, Wunsch Hansi): Büro als Raum – oben ein Regal mit schmalen Ordnern (nachschlagen), unten der
// Schreibtisch mit Gegenständen (erledigen). Nur eine neue Oberfläche über den vorhandenen Büro-Funktionen; „☰ Liste“ bleibt.
const BU_ANSICHT = "kc_club_buero_ansicht";
const buRaumAn = () => lsLesen(BU_ANSICHT) !== "liste";
function buAnsichtWechseln() { lsSetzen(BU_ANSICHT, buRaumAn() ? "liste" : "raum"); buZeigen(); }
function buStartHtml() { return buRaumAn() ? buRaumHtml() : buStartListeHtml(); }
function buStartListeHtml() {
  const r = BU.start; if (!r) return '<div class="karte hinweis">Wird geladen …</div>';
  const S = buSchreiben(), L = !!ICH?.vorstand; // 1.37.0: S = Büro schreiben, L = Clubleitung (Kontakte, Freud & Leid, Eingang)
  const t = r.sitzungen[0], n = S ? buNaechster(t) : null, e = r.eingang;
  const k = (id, sym, titel, unter, fn, extra = "") => `<button class="mini-kachel${n === id ? " bu-dran" : ""}" onclick="${fn}"><span class="mk-sym">${sym}</span><span class="mk-titel">${esc(titel)}</span><span class="mk-unter">${unter}</span>${extra}</button>`;
  const nt = S ? buNachherTipp() : null, dr = S ? buDran(t) : null, dran = dr?.text; // 2.749.0 KC-CLUB-SITZUNG-SCHRITTE
  const summe = Object.values(e).reduce((a, b) => a + b, 0);
  const eingang = [["📦", "Ausleih-Anfragen", e.ausleihen, "buEingang()"], ["🗳️", "Offene Vorschläge", e.vorschlaege, "buEingang()"], ["🙋", "Hilfe-Aufrufe", e.hilfe, "buEingang()"],
    ["🗄️", "Archiv: zu prüfen", e.archiv, "arStart()"], ["✔️", "Offene Aufgaben", e.aufgaben, "zeige('protokolle')"], ["📄", "Protokoll-Entwürfe", e.entwuerfe, "zeige('protokolle')"],
    ["✏️", "Änderungsmeldungen", e.aenderungen || 0, "aeEingang()"], // KC-CLUB-AENDERUNG (2.22.8)
    ["💶", "Erstattungen", e.erstattungen || 0, "buEingang()"], ["📅", "Dienstzeiten", e.dienstzeiten || 0, "buEingang()"]]; // KC-CLUB-EINGANGSKORB (2.23.6)
  const festHeute = BU_F ? [...BU_F.geburtstage.filter((f) => f.tage === 0).map((f) => f.alter ? `🎉 ${esc(f.vorname)} wird ${f.alter}` : `🎂 ${esc(f.vorname)} hat Geburtstag`), ...BU_F.jubilaeen.filter((f) => f.tage === 0).map((f) => `🏅 ${esc(f.vorname)}: ${f.jahre} Jahre im Club`)] : [];
  const festBald = BU_F ? BU_F.geburtstage.concat(BU_F.jubilaeen).filter((f) => f.tage >= 0 && f.tage <= 7).length : 0;
  return `<div class="karte bu-gruss">${buKopfKnoepfe(false, null)}${festHeute.length ? `<div class="bu-tipp" style="margin:6px 0">🎉 Heute: ${festHeute.join(" · ")} – <button class="knopf klein" onclick="buFeste()">gratulieren</button></div>` : ""}${t ? `Nächste Sitzung: <b>${esc(t.titel)}</b> · ${esc(wann(t.beginn))}<br>✅ ${t.ja} zugesagt · ❌ ${t.nein} abgesagt · ❓ ${t.ohne} ohne Antwort` : "Gerade ist keine Sitzung geplant – lege sie unter 📅 Termine an."}
    ${!S ? '<div class="bu-tipp">👁️ Du hast im Büro <b>Leserechte</b>: ansehen und drucken. Ändern und Versenden schaltet der Admin frei.</div>' : dran ? `<div class="bu-tipp">👉 Nächster Schritt: <b>${esc(dran)}</b></div>` : t ? '<div class="bu-tipp">✅ Für diese Sitzung ist alles erledigt.</div>' : ""}</div>
    ${ICH?.admin ? buBereich("verwaltung", "🔐 Verwaltung", `<div class="mini-kacheln"><button class="mini-kachel" onclick="buRechte()"><span class="mk-sym">🔐</span><span class="mk-titel">Büro-Freigaben</span><span class="mk-unter">wer darf ins Büro – nur lesen oder lesen &amp; schreiben</span></button><button class="mini-kachel" onclick="buRechte()"><span class="mk-sym">👀</span><span class="mk-titel">Für alle zur Ansicht</span><span class="mk-unter">das Büro für alle Mitglieder öffnen – nur ansehen, z. B. während der Clubsitzung</span></button></div>`) : ""}
    ${buBereich("sitzung", "🗂️ Sitzung", `<div class="mini-kacheln">
      ${S && t ? `<div style="grid-column:1/-1">${buSchritteHtml(t)}</div>` : ""}
      ${S ? k("vorbereiten", "📝", "Tagesordnung festlegen", t ? (t.vorbereitet ? "✅ festgelegt – ändern" : "Vorschläge aufnehmen, Reihenfolge") : "keine Sitzung geplant", "buSitzungWahl()") : k("ansehen", "👁️", "Sitzung ansehen", t ? "Anwesenheit, Tagesordnung" : "keine Sitzung geplant", "buSitzungWahl()")}
      ${S ? k("einladung", "📨", "Mitglieder einladen", t?.geaendert_nach_einladung ? "⚠️ geändert – Mitglieder informieren?" : t?.einladung_am ? `✅ gesendet ${esc(zeitKurz(t.einladung_am))}` : "Brief mit Tagesordnung an alle", t?.geaendert_nach_einladung ? `buInformierenFragen('${t.id}')` : "buEinladungWahl(false)") : ""}
      ${S ? k("erinnerung", "🔔", "Erinnern", t ? `${t.ohne} ohne Antwort${t.erinnerung_am ? ` · zuletzt ${esc(zeitKurz(t.erinnerung_am))}` : ""}` : "–", "buEinladungWahl(true)") : ""}
      ${S ? k("unterlagen", "🖨️", "Sitzung vorbereiten", t?.unterlagen_am ? `✅ vorbereitet ${esc(zeitKurz(t.unterlagen_am))}` : "Anwesende, Anmerkung, Mitschreibbogen", "buVorbereitenWahl()") : ""}
      ${k("drucken", "🖨️", "Mitschreibbogen drucken", t?.vorbereitet ? "Tagesordnung mit Schreiblinien" : "erst Tagesordnung festlegen", "buDruckWahl()")}
      ${L ? k("vorgaben", "⚙️", "Sitzungs-Vorgaben", "Fristen, Uhrzeit, Ort, Monate ohne Sitzung", "svOeffnen()") : ""}
      ${k("protokolle", "📄", "Protokolle", "schreiben · veröffentlichen", "zeige('protokolle')")}
      ${S ? k("termine", "📅", "Termine bearbeiten", "anlegen · ändern · absagen", "buTermine()") : ""}
    </div>`)}
    ${S ? buBereich("nachher", "📄 Nach der Sitzung", `<div class="mini-kacheln">
      ${k("foto", "📸", "Protokoll-Foto", "Mitschrift abfotografieren & anhängen", "buNachherWahl('📸 Foto für welche Sitzung?')", nt?.text.startsWith("📸") ? '<span class="marke gelb">jetzt dran</span>' : "")}
      ${k("aufgaben", "✔️", "Aufgaben verteilen", "wer · was · bis wann", "buNachherWahl('✔️ Aufgaben aus welcher Sitzung?')")}
      ${k("veroeffentlichen", "📢", "Protokoll veröffentlichen", "alle bekommen Bescheid · 7 Tage Einspruch", "buNachherWahl('📢 Welches Protokoll?')", nt?.text.startsWith("📢") ? '<span class="marke gelb">jetzt dran</span>' : "")}
    </div>`) : ""}
    ${buBereich("mitglieder", "👥 Mitglieder", `<div class="mini-kacheln">${L ? k("kontakt", "👥", "Mitglieder kontaktieren", "Gruppe wählen · schreiben · anrufen", "buKontakt()") : ""}${k("feste", "🎂", "Geburtstage & Jubiläen", festBald ? `${festBald} in den nächsten 7 Tagen` : "gratulieren · Liste drucken", "buFeste()", festHeute.length ? '<span class="marke gelb">heute!</span>' : "")}${L ? k("fl", "🤍", "Freud & Leid", FL.d ? (FL.d.faelle.filter((f) => f.status === "offen").length ? `${FL.d.faelle.filter((f) => f.status === "offen").length} offen` : "Geburt, Hochzeit, Trauerfall …") : "Geburt, Hochzeit, Trauerfall …", "buFreudLeid()") : ""}${L ? k("liste", "📇", "Mitgliederliste drucken", "Übersicht · Telefon · Adressen · Unterschriften", "buListe()") : ""}</div>`)}
    ${!S ? "" : buBereich("schreiben", "✉️ Schreiben", `<div class="mini-kacheln">${k("brief", "✉️", "Briefbogen", "Brief mit Logo – Spende, Dank, Einladung …", "buBrief()")}</div>`)}
    ${buBereich("drucken", "🖨️ Drucken & Vorlagen", `<div class="mini-kacheln">${k("drucker", "🖨️", "Alle Druckvorlagen", "Sitzung · Listen · Termine · Briefbogen …", "buDrucker()")}${L ? k("haendler", "🪪", "Händler-Ausweis", "Weihnachtsmarkt · Rabatt · QR-Code", "haStart()") : ""}</div>`)} <!-- 2.691.0 KC-CLUB-DRUCKER-LISTE: auch in der Listen-Ansicht (Fund Hansi „wo sind die Ausweise“) -->
    ${!L ? "" : buBereich("eingang", `📥 Eingang ${summe ? `<span class="marke gelb">${summe}</span>` : ""}`, `<button class="knopf haupt" style="width:100%;margin:0 0 8px" onclick="buEingang()">📥 Eingang öffnen – alles auf einen Blick erledigen</button>
    <div class="mini-kacheln">${eingang.map(([sym, t2, z, fn]) => `<button class="mini-kachel${z ? " mk-offen" : ""}" onclick="${fn}"><span class="mk-sym">${sym}</span><span class="mk-titel">${esc(t2)}</span><span class="mk-gross">${z || "–"}</span></button>`).join("")}</div>`)}`;
}
// ---------- KC-CLUB-BUERO-RAUM (1.65.0): Regal + Schreibtisch ----------
// Registry der Ordner im Regal: wer sieht ihn (S = schreiben, L = Clubleitung, A = Admin), was passiert beim Antippen.
// bereich = Teil der Listenansicht, der als „aufgeschlagener Ordner“ gezeigt wird (keine doppelte Oberfläche).
const BU_REGAL = [
  { id: "sitzung", sym: "🗂️", t: "Sitzung", farbe: "#6f7f6a", bereich: "sitzung" },
  { id: "nachher", sym: "📸", t: "Nachbereitung", farbe: "#8a7560", bereich: "nachher", recht: "S" },
  { id: "protokolle", sym: "📄", t: "Protokolle", farbe: "#5d6f82", fn: "zeige('protokolle')" },
  { id: "feste", sym: "🎂", t: "Geburtstage", farbe: "#a1866f", fn: "buFeste()", recht: "oL" }, // 2.129.0: für die Clubleitung in „Freud & Leid“ (Wunsch Hansi), eigener Ordner nur noch für Büro ohne Clubleitung
  { id: "fl", sym: "🤍", t: "Freud & Leid", farbe: "#7d6b7f", fn: "buFreudLeid()", recht: "L" },
  { id: "liste", sym: "📇", t: "Mitglieder", farbe: "#6a7a74", fn: "buListe()", recht: "L" },
  { id: "adressen", sym: "📒", t: "Adressbuch", farbe: "#6d7468", fn: "adbStart()", recht: "L" }, // KC-CLUB-BUERO-ADRESSEN (2.125.0): Original in KC Verwaltung
  { id: "termine", sym: "📅", t: "Termine", farbe: "#8b6f5a", fn: "buTermine()", recht: "S" },
  { id: "briefe", sym: "✉️", t: "Briefe", farbe: "#6e6a5c", fn: "buBrief()", recht: "S" },
  { id: "schilder", sym: "🪧", t: "Schilder-Druckerei", farbe: "#7a5c3e", fn: "schStart()", recht: "L" }, // KC-CLUB-SCHILDER (2.150.0): Hinweise, Preislisten, Öffnungszeiten …
  { id: "erstattung", sym: "💶", t: "Erstattung", farbe: "#7a7f5e", fn: "zeige('erstattung')", recht: "L" },
  { id: "weihnachtsmarkt", sym: "🎄", t: "Weihnachtsmarkt", farbe: "#2e5d3a", fn: "arStartTitel('Weihnachtsmarkt')", recht: "L" }, // 2.147.0 (Wunsch Hansi): Ordner mit Jahren und Unterregistern
  { id: "besprechungen", sym: "🤝", t: "Besprechungen", farbe: "#6b6f86", fn: "arStartTitel('Besprechungen')", recht: "L" }, // KC-CLUB-ARCHIV-KOPIEREN (2.59.0): Entwürfe/Unterlagen, bevor es ein Protokoll ist
  { id: "chronik", sym: "📖", t: "Chronik", farbe: "#8a6d4e", fn: "arStartArt('chronik')" },
  { id: "archiv", sym: "🗄️", t: "Archiv", farbe: "#5f5a57", fn: "arStart()" },
  { id: "inhalt", sym: "🗂️", t: "Inhaltsverzeichnis", farbe: "#5d6b5a", fn: "ivAnsicht()" }, // 2.144.0: erst auf dem Bildschirm (antippbar), Drucken darin // KC-CLUB-INHALTSVERZEICHNIS (2.79.0): alle Ordner als PDF/Ausdruck
  { id: "verwaltung", sym: "🔐", t: "Freigaben", farbe: "#55606b", fn: "buRechte()", recht: "A" },
];
// ---------- KC-CLUB-BUERO-ADRESSEN (2.125.0, Wunsch Hansi): Adressbuch im Büro ----------
// Original = Adressverwaltung in KC Verwaltung. Hier nur LESEN (externe Adressen: Lieferant, Sponsor, Presse, Behörde …) und
// Änderungen als MELDUNG schicken – KC Verwaltung übernimmt sie dort. Mitglieder stehen im Ordner „📇 Mitglieder“ (mit Freigaben).
const ADB = { d: null, such: "", kat: "", wahl: false };
const ADB_FELDER = [["category", "Kategorie"], ["company", "Firma / Einrichtung"], ["salutation", "Anrede"], ["title", "Titel"], ["firstName", "Vorname"], ["lastName", "Nachname"],
  ["contactPerson", "Ansprechpartner"], ["street", "Straße und Nr."], ["zip", "PLZ"], ["city", "Ort"], ["country", "Land"], ["phone1", "Telefon"], ["phone2", "Telefon 2 / Handy"],
  ["fax", "Fax"], ["email1", "E-Mail"], ["email2", "E-Mail 2"], ["website", "Internetseite"], ["notes", "Notiz"]];
const adbTitel = (a) => a.company || adbName(a) || "(ohne Namen)";
async function adbStart(wahl = false) {
  ADB.wahl = !!wahl;
  blattAuf("adbBlatt", `<h3 style="margin:0">📒 Adressbuch${ADB.wahl ? " – Empfänger wählen" : ""}</h3>
    <p class="hinweis" style="margin:4px 0 8px">Lieferanten, Sponsoren, Presse, Behörden … aus <b>KC Verwaltung</b>. Mitglieder stehen im Ordner „📇 Mitglieder“.</p>
    <input id="adbSuche" type="search" class="hz-suche" autocomplete="off" placeholder="🔍 Suchen (Name, Firma, Ort …)" value="${esc(ADB.such)}" oninput="ADB.such=this.value;adbListe()" style="width:100%;box-sizing:border-box;margin-bottom:6px">
    <div class="hl-chips" id="adbKat"></div><div id="adbInhalt"><p class="hinweis">Wird geladen …</p></div>
    <button class="knopf" onclick="$('adbBlatt').remove()">Schließen</button>`);
  await adbLaden();
}
// 2.137.0 KC-CLUB-SPRACHE-BRIEF: nur die Adressen holen (ohne Fenster) – für „An wen?“ im Brief-Assistenten; Fehler → keine Adressen
async function adbDatenHolen() { if (!ADB.d) try { ADB.d = await api("buero_adressen", {}, { still: true }); } catch { return null; } return ADB.d?.adressen || []; }
async function adbLaden() {
  try { ADB.d = await api("buero_adressen", {}, { warten: true }); }
  catch (e) { const z = $("adbInhalt"); if (z) z.innerHTML = `<div class="karte sc-fehler">⚠️ ${esc(fehlerText(e, "Nicht erreichbar"))} – das Adressbuch bleibt leer, bis es wieder geht.</div>`; return; }
  adbListe();
}
function adbListe() {
  const d = ADB.d, z = $("adbInhalt"), k = $("adbKat"); if (!d || !z) return;
  if (k) k.innerHTML = ["", ...d.kategorien].map((x) => `<button class="chip${ADB.kat === x ? " an" : ""}" onclick='ADB.kat=${hlJs(x)};adbListe()'>${esc(x || "Alle")}</button>`).join("");
  const q = ADB.such.trim().toLowerCase();
  const liste = d.adressen.filter((a) => (!ADB.kat || a.category === ADB.kat) && (!q || Object.values(a).join(" ").toLowerCase().includes(q)))
    .sort((a, b) => adbTitel(a).localeCompare(adbTitel(b), "de"));
  const offen = new Map(d.meldungen.filter((m) => m.status === "offen" && m.adresse_id).map((m) => [m.adresse_id, m]));
  const stand = d.stand ? `Stand aus KC Verwaltung: ${esc(new Date(d.stand).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }))}` : "";
  const karte = (a) => `<div class="karte" style="margin:6px 0">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b>${esc(adbTitel(a))}</b>${a.category ? `<span class="chip" style="flex:none">${esc(a.category)}</span>` : ""}</div>
      ${a.company && (a.contactPerson || adbName(a)) ? `<div>${esc(a.contactPerson || adbName(a))}</div>` : ""}
      ${a.street || a.city ? `<div class="hinweis">${esc([a.street, [a.zip, a.city].filter(Boolean).join(" ")].filter(Boolean).join(", "))}</div>` : ""}
      ${a.status && !/^aktiv$/i.test(a.status) ? `<div class="hinweis">Status: ${esc(a.status)}</div>` : ""}
      ${offen.has(a.id) ? '<div class="hinweis">⏳ Meldung an KC Verwaltung offen</div>' : ""}
      <div class="hl-chips" style="margin-top:6px">
        ${ADB.wahl ? `<button class="chip an" onclick='adbFuerBrief(${hlJs(a.id)})'>✉️ Für den Brief</button>` : ""}
        ${a.phone1 ? `<a class="chip" href="tel:${esc(a.phone1.replace(/[^\d+]/g, ""))}">📞 Anrufen</a>` : ""}${a.phone2 ? `<a class="chip" href="tel:${esc(a.phone2.replace(/[^\d+]/g, ""))}">📱 Tel. 2</a>` : ""}
        ${a.email1 ? `<a class="chip" href="mailto:${esc(a.email1)}">✉️ E-Mail</a>` : ""}
        <button class="chip" onclick='adbKopieren(${hlJs(a.id)})'>📋 Kopieren</button>
        ${d.darfMelden && !ADB.wahl ? `<button class="chip" onclick='adbFormular(${hlJs(a.id)})'>✏️ Änderung melden</button><button class="chip" onclick='adbEntfernen(${hlJs(a.id)})'>🗑️ Entfernen melden</button>` : ""}
      </div></div>`;
  const ml = d.meldungen.length && !ADB.wahl ? `<details class="karte" style="margin-top:10px"><summary><b>📨 Meldungen an KC Verwaltung</b> (${d.meldungen.filter((m) => m.status === "offen").length} offen)</summary>
      ${d.meldungen.map((m) => `<div style="padding:6px 0;border-top:1px solid var(--linie)">${{ neu: "➕ Neu", aendern: "✏️ Ändern", entfernen: "🗑️ Entfernen" }[m.art]}: <b>${esc(adbTitel(m.art === "neu" ? m.daten : (d.adressen.find((a) => a.id === m.adresse_id) || m.daten)))}</b>
        <div class="hinweis">${esc(m.von)} · ${esc(new Date(m.erstellt_am).toLocaleDateString("de-DE"))} · ${{ offen: "⏳ wartet auf KC Verwaltung", uebernommen: "✅ übernommen", abgelehnt: "❌ abgelehnt", zurueckgezogen: "↩️ zurückgezogen" }[m.status] || esc(m.status)}${m.antwort ? ` – ${esc(m.antwort)}` : ""}</div>
        ${m.meine && m.status === "offen" ? `<button class="chip" onclick='adbZurueck(${hlJs(m.id)})'>↩️ Zurückziehen</button>` : ""}</div>`).join("")}</details>` : "";
  z.innerHTML = `${!d.vorhanden ? '<div class="karte hinweis">⚠️ In KC Verwaltung ist noch keine Adressliste gespeichert.</div>' : ""}
    <p class="hinweis" style="margin:4px 0">${liste.length} von ${d.adressen.length} Adressen${stand ? " · " + stand : ""}</p>
    ${d.darfMelden && !ADB.wahl ? '<button class="knopf klein" style="margin:0 0 6px" onclick="adbFormular(null)">➕ Neue Adresse melden</button>' : ""}
    ${adbGruppen(liste, karte) || `<div class="karte hinweis">${d.adressen.length ? "Nichts gefunden." : "Noch keine externen Adressen in KC Verwaltung."}</div>`}${ml}`;
}
// 2.127.0 (Wunsch Hansi): Adressen als Klappbereiche je Kategorie – zu, bis gesucht oder eine Kategorie gewählt wird; offene Bereiche merken
const ADB_AUF = new Set();
function adbGruppen(liste, karte) {
  const gr = new Map(); for (const a of liste) { const k = a.category || "Ohne Kategorie"; if (!gr.has(k)) gr.set(k, []); gr.get(k).push(a); }
  const offen = (k) => !!ADB.such.trim() || !!ADB.kat || gr.size === 1 || ADB_AUF.has(k);
  return [...gr.keys()].sort((a, b) => (a === "Ohne Kategorie") - (b === "Ohne Kategorie") || a.localeCompare(b, "de"))
    .map((k) => `<details class="ds-mehr adb-gruppe"${offen(k) ? " open" : ""} ontoggle='adbAuf(${hlJs(k)}, this.open)'><summary>${esc(k)} <span class="hinweis">(${gr.get(k).length})</span></summary>${gr.get(k).map(karte).join("")}</details>`).join("");
}
function adbAuf(k, auf) { if (ADB.such.trim() || ADB.kat) return; auf ? ADB_AUF.add(k) : ADB_AUF.delete(k); }
function adbFuerBrief(id) {
  const a = ADB.d?.adressen.find((x) => x.id === id); if (!a || typeof BRIEF === "undefined" || !BRIEF) return;
  BRIEF.empfaenger = adbAnschrift(a); briefMerken(); $("adbBlatt")?.remove(); buZeigen(); melde("✉️ Empfänger übernommen");
  if (SBB.adbWarten) SBB.adbWarten(a); // 2.137.0 KC-CLUB-SPRACHE-BRIEF: Sprach-Assistent fragt weiter (Anrede …)
}
async function adbKopieren(id) {
  const a = ADB.d?.adressen.find((x) => x.id === id); if (!a) return;
  const t = [adbAnschrift(a), a.phone1 && "Tel. " + a.phone1, a.phone2 && "Tel. " + a.phone2, a.email1 && a.email1].filter(Boolean).join("\n");
  try { await navigator.clipboard.writeText(t); melde("📋 Adresse kopiert"); } catch { melde("Kopieren geht hier nicht – bitte lange auf den Text tippen"); }
}
function adbFormular(id) {
  const a = id ? ADB.d?.adressen.find((x) => x.id === id) : null; if (id && !a) return;
  const kats = ADB.d?.kategorien || [];
  const feld = ([k, l]) => k === "category"
    ? `<label class="feld">${l}<select id="adbF_${k}"><option value=""></option>${kats.map((x) => `<option${a?.[k] === x ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></label>`
    : k === "notes" ? `<label class="feld">${l}<textarea id="adbF_${k}" rows="3" maxlength="1000">${esc(a?.[k] || "")}</textarea></label>`
    : `<label class="feld">${l}<input id="adbF_${k}" maxlength="${k === "website" ? 160 : 120}" value="${esc(a?.[k] || "")}"${/email/.test(k) ? ' type="email"' : /phone|fax/.test(k) ? ' type="tel"' : ""}></label>`;
  blattAuf("adbFormBlatt", `<h3 style="margin:0">${a ? "✏️ Änderung melden" : "➕ Neue Adresse melden"}</h3>
    <p class="hinweis" style="margin:4px 0 8px">Geht als Meldung an <b>KC Verwaltung</b> – dort wird sie übernommen. Bis dahin bleibt die Adresse hier wie bisher.</p>
    ${ADB_FELDER.map(feld).join("")}<label class="feld">Kurzer Grund (freiwillig)<input id="adbF_grund" maxlength="300" placeholder="z. B. neue Anschrift laut Rechnung"></label>
    <button class="knopf haupt" onclick='adbSenden(${hlJs(id || "")}, this)'>📨 An KC Verwaltung melden</button><button class="knopf" onclick="$('adbFormBlatt').remove()">Abbrechen</button>`);
}
async function adbSenden(id, knopf) {
  const daten = {}; for (const [k] of ADB_FELDER) { const v = ($("adbF_" + k)?.value || "").trim(); if (v) daten[k] = v; }
  if (!daten.company && !daten.lastName && !daten.firstName) return melde("Bitte mindestens Firma oder Name angeben.");
  const alt = id ? ADB.d?.adressen.find((x) => x.id === id) : null;
  if (alt && ADB_FELDER.every(([k]) => (daten[k] || "") === (alt[k] || ""))) return melde("Es wurde nichts geändert.");
  if (knopf) knopf.disabled = true;
  try {
    await api("buero_adresse_melden", { art: id ? "aendern" : "neu", adresse_id: id || null, daten, grund: $("adbF_grund")?.value || "" }, { warten: true });
    $("adbFormBlatt")?.remove(); melde("📨 Gemeldet – KC Verwaltung übernimmt die Adresse"); adbLaden();
  } catch (e) { if (knopf) knopf.disabled = false; meldeFehler(e); }
}
async function adbEntfernen(id) {
  const a = ADB.d?.adressen.find((x) => x.id === id); if (!a) return;
  if (!(await frage(`„${adbTitel(a)}“ zum Entfernen an KC Verwaltung melden?`))) return;
  try { await api("buero_adresse_melden", { art: "entfernen", adresse_id: id }, { warten: true }); melde("📨 Gemeldet – KC Verwaltung entscheidet"); adbLaden(); } catch (e) { meldeFehler(e); }
}
async function adbZurueck(id) {
  if (!(await frage("Diese Meldung zurückziehen?"))) return;
  try { await api("buero_adresse_zurueckziehen", { id }, { warten: true }); melde("↩️ Zurückgezogen"); adbLaden(); } catch (e) { meldeFehler(e); }
}
const buRecht = (x) => !x.recht || (x.recht === "S" && buSchreiben()) || (x.recht === "L" && !!ICH?.vorstand) || (x.recht === "A" && !!ICH?.admin) || (x.recht === "oL" && !ICH?.vorstand);
// ---------- 2.769.0 KC-CLUB-AKTENSCHRANK-JALOUSIE (Wunsch Hansi 30.10.2026 „Jalousie-Funktion ins Ordnerregal, von rechts nach links; rechts mittig ein
// Pfeilschalter, der öffnet den Schrank, dann ändert sich der Pfeil und ist ganz links. Geschlossen komplett ein Einklapp-Bereich: nur eine Zeile
// ‚Aktenschrank‘ mit Anzahl Ordner, ganz rechts der Einklapp-Pfeil; öffnet man ihn, geht der Aktenschrank von alleine auf. Vorne auf die Tür das Logo und
// since 1991 – dann kann der Schrank zubleiben, wenn man nur am Schreibtisch etwas machen möchte“; Vorbild: Jalousie im Kopf) ----------
// Zu = nur die Zeile „🗄️ Aktenschrank · n Ordner ⌄“. Öffnen: Bereich klappt auf, die geschlossene Jalousie (Lamellen, Kochmütze + „since 1991“) klappt
// ihre Lamellen auf und schiebt sich nach links zusammen; der runde Pfeil wandert mit (rechts mittig ◀ → ganz links ▶). Schließen umgekehrt, danach
// wieder nur die Zeile. Gemerkt je Gerät (Bequemlichkeit); erstes Mal offen. Ohne Effekte (App-Schalter „✨ Animierte Knöpfe“): sofort. Während eines Erklär-Videos
// steht der Schrank immer offen (das Video zeigt das Regal). Ordner über Sprache, Suche oder Film öffnen eigene Ansichten – dafür muss der Schrank nicht auf sein.
const BU_SCHRANK = "kc_club_bu_schrank", BU_SCHRANK_KLAPP_MS = 320, BU_SCHRANK_FAHRT_MS = 1100, BU_SCHRANK_TUER_MS = 500, BU_SCHRANK_LAMELLEN = 28;
const buSchrankOffen = () => lsLesen(BU_SCHRANK) !== "zu" || document.body.classList.contains("rg-an");
// 2.770.0 (Fund Hansi „Jalousie-Effekt sieht man nicht“ – sein Handy meldet „Bewegung reduzieren“, wie 2.161.0 beim Kopf): wie bei allen Effekten seit
// 2.409.0 zählt nur der App-Schalter „✨ Animierte Knöpfe“, nicht die Handy-Einstellung
const buSchrankRuhig = () => !einst("animiert", true);
function buSchrankHtml(regal, anzahl) {
  const auf = buSchrankOffen();
  return `<div class="bu-schrank${auf ? " auf" : ""}" id="buSchrank">
      <button type="button" class="bu-schrank-zeile" onclick="buSchrankKlick()" aria-expanded="${auf}" aria-controls="buSchrankKoerper"><span class="bu-schrank-sym" aria-hidden="true">🗄️</span><b>Aktenschrank</b><small>${anzahl} Ordner</small><span class="bu-schrank-pfeil" aria-hidden="true">${auf ? "⌃" : "⌄"}</span></button>
      <div class="bu-schrank-koerper" id="buSchrankKoerper"${auf ? "" : " hidden"}>${regal}
        <div class="bu-jalousie" aria-hidden="true"><div class="bu-jal-lamellen">${'<i class="bu-jal-lamelle"></i>'.repeat(BU_SCHRANK_LAMELLEN)}</div>
          <div class="bu-jal-marke"><img src="kc-kochmuetze-weiss.webp" alt=""><small>since 1991</small></div></div>
        <button type="button" class="bu-jal-griff" onclick="buSchrankKlick()" aria-label="${auf ? "Aktenschrank schließen" : "Aktenschrank öffnen"}">${auf ? "▶" : "◀"}</button>
      </div></div>`;
}
let BU_SCHRANK_LAEUFT = false;
async function buSchrankKlick() {
  const s = $("buSchrank"); if (!s || BU_SCHRANK_LAEUFT) return;
  const auf = !s.classList.contains("auf"), k = $("buSchrankKoerper"), j = s.querySelector(".bu-jalousie"), g = s.querySelector(".bu-jal-griff");
  lsSetzen(BU_SCHRANK, auf ? "auf" : "zu");
  const fertig = () => { s.classList.toggle("auf", auf); k.hidden = !auf; j.style.width = ""; s.querySelectorAll(".bu-jal-lamelle").forEach((l) => (l.style.transform = ""));
    s.querySelector(".bu-schrank-zeile").setAttribute("aria-expanded", String(auf)); s.querySelector(".bu-schrank-pfeil").textContent = auf ? "⌃" : "⌄";
    g.textContent = auf ? "▶" : "◀"; g.setAttribute("aria-label", auf ? "Aktenschrank schließen" : "Aktenschrank öffnen"); BU_SCHRANK_LAEUFT = false; };
  if (buSchrankRuhig() || !j.animate) { BU_SCHRANK_LAEUFT = true; return fertig(); }
  BU_SCHRANK_LAEUFT = true;
  const lam = [...s.querySelectorAll(".bu-jal-lamelle")], warte = (a) => a.finished.catch(() => {});
  const fahrt = { duration: BU_SCHRANK_FAHRT_MS, easing: "cubic-bezier(.45,.05,.3,1)", fill: "forwards" };
  const rechts = () => Math.max(6, k.clientWidth - 52) + "px"; // Pfeil fährt mit der Jalousie-Kante: rechts mittig ↔ ganz links
  try {
    if (auf) { // Bereich aufklappen, Jalousie steht zu (Pfeil rechts mittig) → Lamellen klappen auf → Jalousie fährt nach links zusammen
      s.classList.remove("auf"); j.style.width = "100%"; k.hidden = false; g.textContent = "◀";
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      j.style.setProperty("--sb", k.clientWidth + "px"); g.style.right = "auto"; g.style.left = rechts();
      await new Promise((r) => setTimeout(r, BU_SCHRANK_TUER_MS)); // kurz die geschlossene Tür zeigen (Kochmütze, since 1991)
      await Promise.all(lam.map((l, i) => warte(l.animate([{ transform: "rotateY(0deg)" }, { transform: "rotateY(68deg)" }], { duration: BU_SCHRANK_KLAPP_MS, delay: (lam.length - 1 - i) * 12, fill: "forwards" }))));
      await Promise.all([warte(j.animate([{ width: "100%" }, { width: "0%" }], fahrt)), warte(g.animate([{ left: rechts() }, { left: "6px" }], fahrt))]);
    } else { // Jalousie fährt von links nach rechts zu → Lamellen klappen zu → Bereich klappt zur Zeile ein
      j.style.setProperty("--sb", k.clientWidth + "px"); g.style.right = "auto"; g.style.left = "6px";
      s.classList.remove("auf"); j.style.width = "0%"; lam.forEach((l) => (l.style.transform = "rotateY(68deg)"));
      await Promise.all([warte(j.animate([{ width: "0%" }, { width: "100%" }], fahrt)), warte(g.animate([{ left: "6px" }, { left: rechts() }], fahrt))]);
      g.textContent = "◀";
      await Promise.all(lam.map((l, i) => warte(l.animate([{ transform: "rotateY(68deg)" }, { transform: "rotateY(0deg)" }], { duration: BU_SCHRANK_KLAPP_MS, delay: i * 12, fill: "forwards" }))));
      await new Promise((r) => setTimeout(r, BU_SCHRANK_TUER_MS));
    }
  } catch {}
  [j, g, ...lam].forEach((x) => x.getAnimations?.().forEach((a) => a.cancel())); g.style.left = g.style.right = "";
  fertig();
}
function buRaumHtml() {
  const r = BU.start; if (!r) return '<div class="karte hinweis">Wird geladen …</div>';
  if (!Array.isArray(r.sitzungen) || !r.eingang) return '<div class="karte hinweis">⚠️ Das Büro ist gerade nicht abrufbar – bitte gleich noch einmal öffnen.</div>'; // 2.24.15: unvollständige Antwort nie als leer/OK zeigen
  const S = buSchreiben(), L = !!ICH?.vorstand, t = r.sitzungen[0], n = S ? buNaechster(t) : null, e = r.eingang;
  const summe = Object.values(e).reduce((a, b) => a + b, 0), nt = S ? buNachherTipp() : null;
  const dr = S ? buDran(t) : null, dran = dr?.text, dranFn = dr?.fn; // 2.749.0 KC-CLUB-SITZUNG-SCHRITTE
  const fest = BU_F ? BU_F.geburtstage.concat(BU_F.jubilaeen).filter((f) => f.tage >= 0 && f.tage <= 7) : [], festHeute = fest.filter((f) => f.tage === 0);
  const flOffen = FL.d ? FL.d.faelle.filter((f) => f.status === "offen").length : 0;
  const zahl = { fl: flOffen + (L ? fest.length : 0), feste: fest.length, nachher: nt ? 1 : 0, liste: AE.offen }; // 2.22.10: Änderungsmeldungen im Ordner „Mitglieder“
  const ordner = BU_REGAL.filter(buRecht);
  const ruecken = (o) => `<button class="bu-ordner" style="--of:${o.farbe}" onclick="${o.bereich ? `buOrdner('${o.id}')` : o.fn}" aria-label="${esc(o.t)}"><span class="bu-osym">${o.sym}</span><span class="bu-otext">${esc(o.t)}</span>${zahl[o.id] ? `<span class="bu-ozahl">${zahl[o.id]}</span>` : ""}<span class="bu-oloch"></span></button>`;
  const naechst = (r.sitzungen || []).find((x) => new Date(x.beginn) >= Date.now() - 6 * 3600000) || t;
  const kal = naechst ? new Date(naechst.beginn) : null;
  const ding = (cls, inhalt, label, fn, extra = "") => `<button class="bu-ding ${cls}" onclick="${fn}">${inhalt}<span class="bu-dlabel">${label}</span>${extra}</button>`;
  return `<div class="karte bu-gruss">${buKopfKnoepfe(true, naechst)}
      ${festHeute.length ? `<div class="bu-tipp" style="margin:6px 0 0">🎉 Heute: ${festHeute.map((f) => f.jahre ? `${esc(f.vorname)} – ${f.jahre} Jahre im Club` : `${esc(f.vorname)} hat Geburtstag`).join(" · ")}</div>` : ""}
      ${!S ? '<div class="bu-tipp">👁️ Du hast im Büro <b>Leserechte</b>: ansehen und drucken.</div>' : ""}${naechst && !buVertretungAngebot(naechst) ? buVertretungHtml(naechst) : ""}</div>
    <div class="bu-raum">
      ${buSchrankHtml(`<div class="bu-wand"><div class="bu-regal">${ordner.map(ruecken).join("")}</div><div class="bu-brett"></div></div>`, ordner.length)}
      <div class="bu-tisch">
        <div class="bu-zettelreihe">
          ${dran ? `<button class="bu-zettel" onclick="${dranFn}"><b>Nächster Schritt</b>${esc(dran.replace(/^\S+\s/, ""))}</button>` : `<div class="bu-zettel ruhig"><b>Nächster Schritt</b>${!naechst ? "Keine Sitzung geplant" : !t ? "Sitzung ist vorbereitet 👍" : !t.vorbereitet ? "Tagesordnung noch nicht festgelegt" : t.einladung_am ? "Eingeladen ✅" : "Tagesordnung festgelegt ✅"}</div>`}
          ${L ? `<button class="bu-zettel blau" onclick="buEingang()"><b>Eingang</b>${summe ? `${summe} ${summe === 1 ? "Sache wartet" : "Sachen warten"} auf dich` : "Alles erledigt 👍"}</button>`
            : `<button class="bu-zettel blau" onclick="zeige('termine')"><b>Nächster Termin</b>${naechst ? esc(naechst.titel || "Sitzung") + " · " + esc(fTagDp.format(new Date(naechst.beginn))) : "Keiner geplant"}</button>`}
        </div>
        <div class="bu-dinge">
          ${L ? ding("bu-korb", `<span class="bu-dsym">📥</span>${summe ? `<span class="bu-dzahl">${summe}</span>` : ""}`, "Eingang", "buEingang()") : ""}
          ${ding("bu-fueller", '<span class="bu-dsym">✒️</span>', "Schreiben", "buFueller()", S ? "" : '<span class="bu-nur">nur lesen</span>')}
          ${L ? ding("bu-telefon", '<span class="bu-dsym">☎️</span>', "Anrufen", "buTelefon()") : ""}
          ${L ? ding("bu-post", '<span class="bu-dsym">📨</span>', "Nachricht &amp; Mail", "buNachricht()") : ""}
          ${ding("bu-kalender", kal ? `<span class="bu-kal"><span class="bu-kmon">${esc(kal.toLocaleDateString("de-DE", { month: "short" }))}</span><span class="bu-ktag">${kal.getDate()}</span><span class="bu-kwt">${esc(kal.toLocaleDateString("de-DE", { weekday: "short" }))}</span></span>` : '<span class="bu-dsym">📅</span>', kal ? esc(naechst.titel || "Nächster Termin") : "Termine", S ? "buTermine()" : "zeige('termine')")}
          ${ding("bu-drucker", '<span class="bu-dsym">🖨️</span>', "Drucken", "buDrucker()")}
          ${S ? ding("bu-scanner", '<span class="bu-dsym">📠</span>', "Einlesen", "buEinlesen()") : ""}
          ${fest.length ? ding("bu-karte", '<span class="bu-dsym">🎂</span>', fest.length === 1 ? "1 Glückwunsch" : `${fest.length} Glückwünsche`, "buFeste()") : ""}
        </div>
      </div>
    </div>`;
}
// Ordner aus dem Regal „aufschlagen“: zeigt genau den Bereich der Listenansicht (eine Oberfläche, nicht zwei)
function buOrdner(id) { BU.sicht = "ordner"; BU.ordner = id; buZeigen(); window.scrollTo(0, 0); }
function buOrdnerHtml() {
  const o = BU_REGAL.find((x) => x.id === BU.ordner); if (!o) return buRaumHtml();
  const tmp = document.createElement("div"); tmp.innerHTML = buStartListeHtml();
  const teil = tmp.querySelector(`[data-klappe="buero_${o.bereich}"]`);
  const inhalt = teil ? [...teil.children].filter((c) => c.tagName !== "SUMMARY").map((c) => c.outerHTML).join("") : '<p class="hinweis">Hier ist gerade nichts.</p>';
  return `<div class="bu-aufgeschlagen" style="--of:${o.farbe}"><div class="bu-auf-kopf"><span>${o.sym}</span><b>${esc(o.t)}</b><button class="knopf klein" onclick="buZurueck()">‹ Zurück ins Büro</button></div><div class="bu-auf-blatt">${inhalt}</div></div>`;
}
// ✒️ Füller: „Was möchtest du schreiben?“ – nur, was man darf
function buFueller() {
  const S = buSchreiben(), L = !!ICH?.vorstand;
  const w = [[S, "✉️", "Brief", "mit Briefkopf – Dank, Spende, Einladung", "buBrief()"], [S, "📨", "Einladung zur Sitzung", "mit Tagesordnung an alle", "buEinladungWahl(false)"],
    [true, "📄", "Protokoll", "schreiben · veröffentlichen", "zeige('protokolle')"], [L, "👥", "Nachricht an Mitglieder", "Gruppe wählen · schreiben", "buKontakt()"], [L, "🪧", "Schild drucken", "Hinweis · Preisliste · Öffnungszeiten", "schStart()"],
    [true, "🎂", "Glückwunsch", "Geburtstag oder Jubiläum", "buFeste()"], [true, "📌", "Zettel an die Pinnwand", "für alle oder einzelne", "zeige('pinnwand')"]].filter((x) => x[0]);
  const f = blattAuf("buFuellerBlatt", `${einwHtml("b-bu-schreiben")}<h3 style="margin-top:0">✒️ Was möchtest du schreiben?</h3>${S ? "" : '<p class="hinweis">👁️ Mit Leserechten kannst du Briefe und Einladungen nicht verschicken.</p>'}
    <div class="bu-wahl">${w.map(([, sym, t2, u, fn]) => `<button class="mini-kachel" data-fn="${esc(fn)}"><span class="mk-sym">${sym}</span><span class="mk-titel">${esc(t2)}</span><span class="mk-unter">${esc(u)}</span></button>`).join("")}</div>
    <div class="knoepfe"><button class="knopf" data-zu="1">Abbrechen</button></div>`);
  f.querySelectorAll("[data-fn]").forEach((b) => (b.onclick = () => { f.remove(); new Function(b.dataset.fn)(); }));
  f.querySelector("[data-zu]").onclick = () => f.remove();
}
// 🖨️ Drucker: alles, was das Büro drucken kann
function buDrucker() {
  const L = !!ICH?.vorstand, S = buSchreiben();
  const w = [[true, "📝", "Sitzungs-Vorlage", "mit Schreiblinien", "buDruckWahl()"], [L, "📇", "Mitgliederliste", "Telefon · Adressen · Unterschriften", "buListe()"],
    [true, "📅", "Termine", "Kalender oder To-do-Liste", "druckStarten('termine')"], [true, "🎂", "Geburtstage & Jubiläen", "Liste", "druckStarten('feste')"], [S, "✉️", "Briefbogen", "Brief mit Logo", "buBrief()"],
    [!!ICH?.admin, "📲", "Einrichtungskarte", "QR-Code + Schritte für ein Mitglied", "buPersonWahl('🖨️ Einrichtungskarte für wen?', '📲', einrichtungskarte)"],
    [L, "🪪", "Händler-Ausweis", "Weihnachtsmarkt · Rabatt · QR-Code", "haStart()"]].filter((x) => x[0]); // 2.690.0 KC-CLUB-HAENDLERAUSWEIS
  const f = blattAuf("buDruckerBlatt", `${einwHtml("b-bu-drucker")}<h3 style="margin-top:0">🖨️ Was möchtest du drucken?</h3>
    <div class="bu-wahl">${w.map(([, sym, t2, u, fn]) => `<button class="mini-kachel" data-fn="${esc(fn)}"><span class="mk-sym">${sym}</span><span class="mk-titel">${esc(t2)}</span><span class="mk-unter">${esc(u)}</span></button>`).join("")}</div>
    <div class="knoepfe"><button class="knopf" data-zu="1">Abbrechen</button></div>`);
  f.querySelectorAll("[data-fn]").forEach((b) => (b.onclick = () => { f.remove(); new Function(b.dataset.fn)(); }));
  f.querySelector("[data-zu]").onclick = () => f.remove();
}
// ☎️ Telefon: Person aussuchen → freigegebene Nummer → das Handy wählt wirklich (tel:). Ohne Nummer: Nachricht anbieten.
// Personenwahl (gemeinsam für ☎️ Telefon und 📨 Nachricht): suchen, antippen; oben optional zusätzliche Knöpfe
async function buPersonWahl(titel, sym, weiter, oben = "") {
  try { if (!MITGLIEDER) await mitgliederHolen(); } catch (e) { return meldeFehler(e); }
  const f = blattAuf("buTelBlatt", `<h3 style="margin-top:0">${titel}</h3>${einwHtml("b-bu-person")}${oben}
    <input id="buTelSuche" type="search" placeholder="🔍 Name suchen …" autocomplete="off" style="width:100%;margin-bottom:8px">
    <div id="buTelListe" class="bu-telliste"></div><div class="knoepfe"><button class="knopf" data-zu="1">Abbrechen</button></div>`);
  f.querySelector("[data-zu]").onclick = () => f.remove();
  const liste = () => { const q = $("buTelSuche").value || "";
    $("buTelListe").innerHTML = suFiltern(MITGLIEDER.filter((m) => m.person_id !== ICH.person_id), q, (m) => m.name).sort((a, b) => a.name.localeCompare(b.name))
      .map((m) => `<button class="bu-telzeile" data-p="${m.person_id}"><span class="zpunkt ${ONL.ids?.has(m.person_id) ? "on" : ""}"></span><b>${esc(m.name)}</b><span class="pfeil">${sym}</span></button>`).join("") || '<p class="hinweis">Niemand gefunden.</p>';
    $("buTelListe").querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => weiter(b.dataset.p))); };
  $("buTelSuche").oninput = liste; liste();
  return f;
}
async function buTelefon() { return buPersonWahl("☎️ Wen möchtest du anrufen?", "📞", buTelPerson); }
// 📨 Nachricht (1.66.0, Wunsch Hansi): an eine Person per App-Nachricht, E-Mail oder WhatsApp – oder an mehrere (vorhandenes „Mitglieder kontaktieren“)
async function buNachricht() {
  const f = await buPersonWahl("📨 An wen möchtest du schreiben?", "✉️", buNachrichtPerson,
    '<button class="knopf haupt" style="width:100%;margin:0 0 8px" data-mehrere="1">👥 An mehrere oder eine Gruppe …</button>');
  f?.querySelector("[data-mehrere]")?.addEventListener("click", () => { f.remove(); buKontakt(); });
}
async function buNachrichtPerson(pid) {
  const m = MITGLIEDER.find((x) => x.person_id === pid), name = m?.name || "", vn = name.split(" ")[0];
  try {
    const d = await api("mitglied_details", { person_id: pid }, { warten: true }), k = d.kontakt || {};
    const f = blattAuf("buTelBlatt", `<h3 style="margin-top:0">📨 ${esc(name)}</h3>
      <div class="knoepfe" style="flex-direction:column;align-items:stretch">
        <button class="knopf haupt" style="min-height:52px" data-w="app">💬 Nachricht in der App</button>
        ${k.mail ? `<a class="knopf" style="justify-content:center;min-height:52px" href="mailto:${esc(k.mail)}">✉️ E-Mail an ${esc(k.mail)}</a>` : ""}
        ${k.handy ? '<button class="knopf" style="min-height:52px" data-w="wa">🟢 WhatsApp</button>' : ""}</div>
      ${!k.mail || !k.handy ? `<p class="hinweis">${esc(vn)} hat ${!k.mail && !k.handy ? "keine E-Mail und keine Handynummer" : !k.mail ? "keine E-Mail" : "keine Handynummer"} freigegeben.</p>` : ""}
      <div class="knoepfe"><button class="knopf" data-w="zurueck">‹ Andere Person</button><button class="knopf" data-w="zu">Schließen</button></div>`);
    f.querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { const w = b.dataset.w;
      if (w === "app") { f.remove(); direkt(pid); } else if (w === "wa") { f.remove(); extern("whatsapp", k.handy); } else if (w === "zurueck") buNachricht(); else f.remove(); }));
  } catch (e) { meldeFehler(e); }
}
// ---------- KC-CLUB-BUERO-SPRACHE (1.66.0, Wunsch Hansi): Sprachsteuerung im Büro – „Öffne Ordner Protokolle“, „Anrufen Erika“ ----------
// Spracherkennung des Handys (Web Speech API, kostenlos; bei Chrome erkennt Google die Sprache – nur solange das Mikrofon an ist).
// Befehle kommen aus Registries (Regal BU_REGAL + Schreibtisch BU_SPRACHE); Rechte gelten wie beim Antippen. Nichts wird ohne Antippen
// verschickt – Sprache öffnet nur (Ordner, Telefon mit Person, Nachricht an Person).
const BSPR = { geht: !!(window.SpeechRecognition || window.webkitSpeechRecognition), erk: null };
const BU_SPRACHE = [
  { w: ["eingang", "post", "ablage", "korb"], fn: "buEingang()", t: "Eingang", recht: "L" },
  { w: ["schreiben", "fuller", "fueller", "stift"], fn: "buFueller()", t: "Schreiben" },
  { w: ["drucken", "drucker", "ausdrucken"], fn: "buDrucker()", t: "Drucken" },
  { w: ["ubersicht", "uebersicht", "tagesubersicht"], fn: "tagesinfoZeigen(true)", t: "Übersicht", recht: "L" },
  { w: ["liste", "listenansicht"], fn: "buAnsichtWechseln()", t: "Listenansicht" },
  { w: ["zuruck", "zurueck", "regal", "buro", "buero", "schreibtisch"], fn: "BU.sicht !== 'start' ? buZurueck() : null", t: "Büro" },
];
const BU_REGAL_WORTE = { sitzung: ["sitzung", "sitzungen", "vorbereiten", "einladung"], nachher: ["nachbereitung", "nachher", "mitschrift"], protokolle: ["protokoll", "protokolle"],
  feste: ["geburtstag", "geburtstage", "jubilaum", "jubilaen", "feste"], fl: ["freud", "leid", "trauer", "hochzeit"], liste: ["mitglieder", "mitgliederliste", "adressen"],
  termine: ["termin", "termine", "kalender"], briefe: ["brief", "briefe", "briefbogen"], erstattung: ["erstattung", "kasse", "kosten"], chronik: ["chronik", "geschichte"],
  archiv: ["archiv"], verwaltung: ["freigabe", "freigaben", "rechte"] };
const sprWorte = (t) => suNorm(t).replace(/[^a-z0-9ß ]/g, " ").split(/\s+/).filter(Boolean);
// Text → Befehl { fn, t } oder null (rein, testbar). Reihenfolge: Anrufen/Nachricht mit Name → Regal-Ordner → Schreibtisch.
function buSprachDeuten(text, mitglieder = [], darf = () => true) {
  const w = sprWorte(text); if (!w.length) return null;
  const hat = (...x) => x.some((y) => w.includes(y));
  const person = () => { const rest = w.filter((x) => x.length > 2); return mitglieder.find((m) => sprWorte(m.name).some((n) => rest.includes(n))) || null; };
  if (hat("anrufen", "anruf", "telefon", "telefonieren", "ruf", "rufe")) { const p = person(); return darf({ recht: "L" }) ? { fn: p ? `buTelPerson('${p.person_id}')` : "buTelefon()", t: p ? `Anrufen: ${p.name}` : "Telefon" } : { verboten: "Telefon" }; }
  if (hat("nachricht", "email", "mail", "whatsapp", "schreib", "schicke", "schick")) { const p = person(); if (p || !hat("schreib")) return darf({ recht: "L" }) ? { fn: p ? `buNachrichtPerson('${p.person_id}')` : "buNachricht()", t: p ? `Nachricht an ${p.name}` : "Nachricht" } : { verboten: "Nachricht" }; }
  for (const o of BU_REGAL) if ((BU_REGAL_WORTE[o.id] || []).some((x) => w.includes(x))) return darf(o) ? { fn: o.bereich ? `buOrdner('${o.id}')` : o.fn, t: `Ordner ${o.t}` } : { verboten: o.t };
  for (const b of BU_SPRACHE) if (b.w.some((x) => w.includes(x))) return darf(b) ? { fn: b.fn, t: b.t } : { verboten: b.t };
  return null;
}
async function buSprechen() {
  if (!BSPR.geht) return melde("Dieses Gerät kann leider keine Sprache erkennen.", true);
  try { if (!MITGLIEDER) await mitgliederHolen(); } catch {}
  BSPR.erk?.abort?.();
  const Erk = window.SpeechRecognition || window.webkitSpeechRecognition, e = new Erk(); BSPR.erk = e;
  e.lang = "de-DE"; e.interimResults = true; e.maxAlternatives = 3;
  const f = blattAuf("buSprachBlatt", `<div class="bu-hoeren"><span class="bu-hpunkt">🎙️</span><b id="buSprText">Ich höre zu …</b>
    <p class="hinweis">Sag z. B. „Öffne Ordner Protokolle“, „Anrufen Erika“, „Nachricht an Klaus“, „Eingang“, „Drucken“ oder „Zurück“.</p>
    <p class="hinweis" style="font-size:.8rem">🔒 Das Handy erkennt die Sprache nur, solange dieses Fenster offen ist.</p>
    <button class="knopf" data-zu="1">Abbrechen</button></div>`);
  f.querySelector("[data-zu]").onclick = () => { e.abort(); f.remove(); };
  let fertig = false;
  e.onresult = (ev) => {
    const r = ev.results[ev.results.length - 1]; $("buSprText") && ($("buSprText").textContent = `„${r[0].transcript}“`);
    if (!r.isFinal || fertig) return; fertig = true;
    const darf = (x) => buRecht(x);
    const treffer = [...r].map((a) => buSprachDeuten(a.transcript, MITGLIEDER || [], darf)).find(Boolean);
    setTimeout(() => { f.remove();
      if (!treffer) return melde(`🎙️ „${r[0].transcript}“ habe ich nicht verstanden – sag z. B. „Öffne Ordner Protokolle“.`, true);
      if (treffer.verboten) return melde(`🎙️ „${treffer.verboten}“ ist für dich im Büro nicht freigeschaltet.`, true);
      melde(`🎙️ ${treffer.t}`); new Function(treffer.fn)(); }, 450);
  };
  e.onerror = (ev) => { if (fertig) return; fertig = true; f.remove(); if (ev.error === "not-allowed" || ev.error === "service-not-allowed") melde("🎙️ Bitte das Mikrofon für die App erlauben (Handy-Einstellungen).", true); else if (ev.error !== "aborted") melde("🎙️ Ich habe nichts verstanden – bitte nochmal.", true); };
  e.onend = () => { if (!fertig) { fertig = true; f.remove(); melde("🎙️ Ich habe nichts gehört – bitte nochmal auf das Mikrofon tippen."); } };
  try { e.start(); } catch { f.remove(); melde("🎙️ Mikrofon gerade nicht verfügbar.", true); }
}
async function buTelPerson(pid) {
  const m = MITGLIEDER.find((x) => x.person_id === pid), name = m?.name || "";
  try {
    const d = await api("mitglied_details", { person_id: pid }, { warten: true }), k = d.kontakt || {};
    const nummern = [["📱 Handy", k.handy], ["☎️ Festnetz", k.festnetz]].filter((x) => x[1]);
    const f = blattAuf("buTelBlatt", `<h3 style="margin-top:0">☎️ ${esc(name)}</h3>
      ${nummern.length ? `<div class="knoepfe" style="flex-direction:column;align-items:stretch">${nummern.map(([t2, nr]) => `<a class="knopf haupt" style="justify-content:center;min-height:52px;font-size:1.05rem" href="tel:${esc(nurZiffern(nr))}">${t2}: ${esc(nr)}</a>`).join("")}</div>
        <p class="hinweis">Antippen – dein Handy wählt die Nummer.</p>` : `<p class="hinweis">${esc(name.split(" ")[0])} hat keine Telefonnummer freigegeben.</p>`}
      <div class="knoepfe"><button class="knopf" data-nachricht="1">💬 Nachricht schreiben</button><button class="knopf" data-zurueck="1">‹ Andere Person</button><button class="knopf" data-zu="1">Schließen</button></div>`);
    f.querySelector("[data-zu]").onclick = () => f.remove();
    f.querySelector("[data-zurueck]").onclick = () => buTelefon();
    f.querySelector("[data-nachricht]").onclick = () => { f.remove(); direkt(pid); };
  } catch (e) { meldeFehler(e); }
}
// ---------- KC-CLUB-BUERO-RECHTE (1.37.0, Wunsch Hansi): Admin schaltet das Büro frei – erst WAS (lesen / schreiben / entziehen), dann WER ----------
let BR = { liste: null, recht: null, wahl: new Set() };
const BR_RECHTE = { lesen: ["👁️", "Nur lesen", "ansehen und drucken – nichts ändern, nichts versenden"], schreiben: ["✏️", "Lesen & schreiben", "Sitzung vorbereiten, Einladung senden, Termine, Briefe, Aufgaben"], keins: ["⛔", "Zugang entziehen", "das Büro ist für diese Mitglieder nicht mehr sichtbar"] };
async function buRechte() {
  if (!ICH?.admin) return;
  BR = { liste: null, recht: null, wahl: new Set() }; BU.sicht = "rechte"; buZeigen(); window.scrollTo(0, 0);
  try { const [r, a] = await Promise.all([api("buero_rechte", {}, { warten: true }), api("buero_ansicht").catch(() => null)]); BR.liste = r.mitglieder || []; BR.ansicht = a; } catch (e) { BR.liste = []; meldeFehler(e); }
  buZeigen();
}
// ---------- 2.765.0 KC-CLUB-BUERO-ANSICHT (Wunsch Hansi 30.10.2026 „Schalter, dass ich heute Abend während der Clubsitzung das Büro für alle zur
// Ansicht freischalte – allen nur read only: ansehen alles, aber nix auslösen und verändern; fertige Zeitknöpfe 12, 24, 48 Std., Woche, Monat,
// bis auf Widerruf“) ----------
// Server: kc_club_konfig „buero_ansicht“; solange an, bekommt jedes Mitglied ohne eigenes Büro-Recht „nur lesen“ (Gäste/Aushilfen nie). Registry der
// Knöpfe: BU_ANSICHT_DAUER (gleiche Schlüssel wie BUERO_ANSICHT_DAUER im Server). Andere Mitglieder sehen das Büro nach spätestens 1–3 Minuten.
const BU_ANSICHT_DAUER = [["12h", "12 Std."], ["24h", "24 Std."], ["48h", "48 Std."], ["woche", "1 Woche"], ["monat", "1 Monat"], ["dauernd", "Bis auf Widerruf"]];
const buAnsichtBis = (a) => (a?.bis ? `bis ${fTag.format(new Date(a.bis))} ${fZeit.format(new Date(a.bis))} Uhr` : "bis auf Widerruf");
function buAnsichtKarte() {
  const a = BR.ansicht?.ansicht || null;
  return `<div class="karte bu-ansicht${a ? " an" : ""}"><h3 style="margin-top:0">👀 Büro für alle zur Ansicht</h3>
    <p style="margin:0 0 6px">${a ? `<b>🟢 Freigeschaltet ${esc(buAnsichtBis(a))}</b> – alle Mitglieder können das Büro ansehen, aber nichts ändern oder versenden.` : "⚪ Aus – nur wer oben ein Büro-Recht hat, sieht das Büro."}</p>
    <p class="hinweis" style="margin:0 0 8px">Nur lesen: Sitzung, Tagesordnung, Anwesende, Termine, Briefe und Ordner ansehen und drucken. Nichts speichern, nichts versenden. Adressbuch, Aktentasche, Freud &amp; Leid und Eingang bleiben bei der Clubleitung. Gäste und Aushilfen nie.</p>
    <div class="wahl bu-ansicht-zeiten">${BU_ANSICHT_DAUER.map(([k, t]) => `<button onclick="buAnsichtSetzen('${k}', this)">⏱️ ${t}</button>`).join("")}</div>
    ${a ? `<button class="knopf" style="width:100%;text-align:center;margin-top:8px" onclick="buAnsichtSetzen('aus', this)">⛔ Jetzt wieder schließen</button>` : ""}</div>`;
}
async function buAnsichtSetzen(dauer, knopf) {
  if (knopf) knopf.disabled = true;
  try { const r = await api("buero_ansicht_setzen", { dauer }, { warten: true }); BR.ansicht = { ...(BR.ansicht || {}), ansicht: r.ansicht };
    melde(r.ansicht ? `👀 Büro für alle zur Ansicht – ${buAnsichtBis(r.ansicht)}` : "⛔ Büro wieder nur für die Berechtigten"); }
  catch (e) { meldeFehler(e); }
  buZeigen();
}
// Für Mitglieder, die das Büro nur durch die Freischaltung sehen: Hinweis oben im Büro
const buAnsichtHinweis = () => ICH?.bueroAnsicht ? `<div class="karte bu-ansicht-hinweis">👀 <b>Das Büro ist gerade für alle zur Ansicht geöffnet</b> (${esc(buAnsichtBis(ICH.bueroAnsicht))}). Du kannst alles ansehen und drucken – ändern und versenden kann nur die Clubleitung.</div>` : "";
function buRechteHtml() {
  if (!BR.liste) return '<div class="karte hinweis">Wird geladen …</div>';
  const name = (r) => BR.liste.filter((m) => m.recht === r).map((m) => esc(m.name.split(" ")[0]) + (m.admin ? " (Admin)" : "")).join(", ") || "–";
  const marke = (m) => m.recht === "schreiben" ? '<span class="marke gruen br-recht">✏️ schreiben</span>' : m.recht === "lesen" ? '<span class="marke br-recht">👁️ lesen</span>' : '<span class="hinweis br-recht">⛔ kein Zugang</span>';
  return `${buAnsichtKarte()}<div class="karte"><h3 style="margin-top:0">🔐 Büro-Freigaben</h3>
      <p style="margin:0 0 4px">✏️ <b>Lesen & schreiben:</b> ${name("schreiben")}</p><p style="margin:0">👁️ <b>Nur lesen:</b> ${name("lesen")}</p>
      <p class="hinweis" style="margin:8px 0 0">🔒 Freud & Leid, die Mitgliederliste mit Kontakten, der Eingang und das Alter bei runden Geburtstagen bleiben immer nur für die Clubleitung.</p></div>
    <div class="karte"><h3 style="margin-top:0">1️⃣ Was soll gelten?</h3><div class="wahl">${Object.entries(BR_RECHTE).map(([k, [sym, t, u]]) =>
      `<button class="${BR.recht === k ? "an" : ""}" onclick="BR.recht='${k}';buZeigen()">${sym} <b>${t}</b><br><small>${u}</small></button>`).join("")}</div></div>
    ${BR.recht ? `<div class="karte"><h3 style="margin-top:0">2️⃣ Für wen?</h3><div class="bu-haken-liste br-liste">${BR.liste.map((m) => m.admin
      ? `<label class="bu-haken"><input type="checkbox" disabled> <span class="br-name">${esc(m.name)}</span> <small class="hinweis br-recht">Admin – immer voll</small></label>`
      : `<label class="bu-haken${BR.wahl.has(m.person_id) ? " an" : ""}"><input type="checkbox" ${BR.wahl.has(m.person_id) ? "checked" : ""} onchange="BR.wahl[this.checked ? 'add' : 'delete']('${m.person_id}');buZeigen()"> <span class="br-name">${esc(m.name)}</span> ${marke(m)}</label>`).join("")}</div></div>
    <div class="bu-leiste"><button class="knopf haupt" style="width:100%;text-align:center" ${BR.wahl.size ? "" : "disabled"} onclick="buRechteSpeichern(this)">✅ ${esc(BR_RECHTE[BR.recht][1])} für ${BR.wahl.size} Mitglied${BR.wahl.size === 1 ? "" : "er"} speichern</button></div>` : ""}`;
}
async function buRechteSpeichern(knopf) {
  const r = BR_RECHTE[BR.recht], namen = BR.liste.filter((m) => BR.wahl.has(m.person_id)).map((m) => m.name);
  if (!r || !namen.length) return;
  if (!(await frage(`${r[0]} ${r[1]}\n\nfür: ${namen.join(", ")}\n\nJetzt speichern? (Es wird keine Nachricht verschickt.)`))) return;
  knopf.disabled = true;
  try { const x = await api("buero_rechte_setzen", { recht: BR.recht, personen: [...BR.wahl] }, { warten: true }); melde(`🔐 Gespeichert – ${x.geaendert} Mitglied${x.geaendert === 1 ? "" : "er"}: ${r[1]}. Wirkt beim nächsten Öffnen der App.`); await buRechte(); }
  catch (e) { meldeFehler(e); knopf.disabled = false; }
}
// Mehrere Sitzungen → antippen, welche
function buSitzungWaehlen(titel, weiter) {
  const l = BU.start?.sitzungen || [];
  if (!l.length) return melde("Es ist keine Sitzung geplant – bitte zuerst unter 📅 Termine anlegen.", true);
  if (l.length === 1) return weiter(l[0].id);
  window.__buWeiter = weiter;
  blattAuf("buWahl", `${einwHtml("b-bu-sitzung")}<h3 style="margin-top:0">${titel}</h3><div class="wahl">${l.map((t) => `<button onclick="$('buWahl').remove();window.__buWeiter('${t.id}')">${esc(t.titel)}<br><small>${esc(wann(t.beginn))}${t.vorbereitet ? " · ✅ vorbereitet" : ""}</small></button>`).join("")}</div>
    <div class="knoepfe"><button class="knopf" onclick="$('buWahl').remove()">Abbrechen</button></div>`);
}
const buSitzungWahl = () => buSitzungWaehlen("📝 Tagesordnung für welche Sitzung?", (id) => buSitzungOeffnen(id, "to"));
const buVorbereitenWahl = () => buSitzungWaehlen("🖨️ Welche Sitzung vorbereiten?", (id) => buSitzungOeffnen(id, "vor")); // 2.751.0 KC-CLUB-SITZUNG-ABLAUF
const buDruckWahl = () => buSitzungWaehlen("🖨️ Vorlage für welche Sitzung?", async (id) => { const t = BU.start.sitzungen.find((x) => x.id === id); if (!t?.vorbereitet) { if ((await frage("Für diese Sitzung ist noch keine Tagesordnung festgelegt.\n\nJetzt festlegen?"))) buSitzungOeffnen(id, "to"); return; } await buSitzungLaden(id); druckStarten("sitzung"); });
const buEinladungWahl = (nurOffen) => buSitzungWaehlen(nurOffen ? "🔔 Für welche Sitzung erinnern?" : "📨 Einladung für welche Sitzung?", (id) => buEinladung(id, nurOffen));
async function buSitzungLaden(id) {
  BU.s = await api("buero_sitzung", { treffen_id: id }, { warten: true });
  // 2.744.0 KC-CLUB-SITZUNG-LEER: nach einer Einladung ohne Vorbereitung gibt es eine Zeile ohne Tagesordnung – dann der übliche Vorschlag
  const v = BU.s.vorbereitung?.tagesordnung?.length ? BU.s.vorbereitung : null, st = BU.s.standard;
  BU.f = { anwesend: new Set(v ? v.anwesend : st.anwesend), anmerkung: v ? v.anmerkung || "" : BU.s.anmerkungVorschlag, tagesordnung: (v ? v.tagesordnung : st.tagesordnung).map((x) => ({ ...x })), zeilen: v ? v.zeilen : st.zeilen, neu: "" };
  // 2.749.0 KC-CLUB-SITZUNG-SCHRITTE: Antworten nach dem Speichern übernehmen (Absage → nicht mehr angehakt, neue Zusage → angehakt) und sagen
  BU.hinweise = [];
  if (v) {
    const seit = Date.parse(v.geaendert_am || 0) || 0;
    for (const m of BU.s.mitglieder || []) {
      if (m.antwort === "nein" && BU.f.anwesend.has(m.person_id)) { BU.f.anwesend.delete(m.person_id); BU.hinweise.push(`❌ ${m.name} hat abgesagt – nicht mehr angehakt`); }
      else if (m.antwort === "ja" && !BU.f.anwesend.has(m.person_id) && Date.parse(m.antwort_am || 0) > seit) { BU.f.anwesend.add(m.person_id); BU.hinweise.push(`✅ ${m.name} hat zugesagt – jetzt angehakt`); }
    }
    const neu = (BU.s.vorschlaege || []).filter((x) => x.fuerDiese && !BU.f.tagesordnung.some((t) => t.id === x.id)).length;
    if (neu) BU.hinweise.push(`💡 ${neu} ${neu === 1 ? "neuer Vorschlag" : "neue Vorschläge"} für diese Sitzung – bei „📝 Tagesordnung festlegen“ unter „Weitere Vorschläge“ antippen zum Aufnehmen`); // 2.751.0: zwei Seiten
  }
  BU.stand = v?.geaendert_am || null; BU.urfassung = buFassung();
}
// gespeicherter Stand zum Vergleichen („Änderungen speichern?“ beim Verlassen)
function buFassung() { const f = BU.f; return f ? JSON.stringify([[...f.anwesend].sort(), f.anmerkung || "", f.tagesordnung.map((x) => [x.t, x.art, x.id || ""]), f.zeilen]) : ""; }
const buGeaendert = () => BU.sicht === "sitzung" && !!BU.f && buSchreiben() && (buFassung() !== BU.urfassung || !!(BU.f.neu || "").trim());
// 2.751.0 KC-CLUB-SITZUNG-ABLAUF: zwei Seiten – „to“ = Tagesordnung festlegen (vor der Einladung), „vor“ = Sitzung vorbereiten (danach: Anwesende,
// Anmerkung, Schreiblinien, Mitschreibbogen). Ohne Angabe: noch keine Tagesordnung → „to“, sonst „vor“. Beide speichern dasselbe (ein Stand).
async function buSitzungOeffnen(id, teil) {
  try { await buSitzungLaden(id); } catch (e) { return meldeFehler(e); }
  BU.teil = teil === "to" || teil === "vor" ? teil : BU.s.vorbereitung?.tagesordnung?.length ? "vor" : "to";
  BU.sicht = "sitzung"; buZeigen(); window.scrollTo(0, 0);
}
function buTeil(teil) { BU.teil = teil; buZeigen(); window.scrollTo(0, 0); } // ohne Neuladen – Eingaben bleiben, gespeichert wird beides zusammen
function buSitzungHtml() {
  const s = BU.s, f = BU.f; if (!s) return "";
  const m = s.mitglieder.slice().sort((a, b) => a.name.localeCompare(b.name));
  const nein = m.filter((x) => x.antwort === "nein"), rest = m.filter((x) => x.antwort !== "nein");
  const haken = (x) => `<label class="bu-haken${f.anwesend.has(x.person_id) ? " an" : ""}"><input type="checkbox" ${f.anwesend.has(x.person_id) ? "checked" : ""} onchange="buAnw('${x.person_id}', this.checked)"> ${esc(x.name)} <small>${x.antwort === "ja" ? "✅" : x.antwort === "vielleicht" ? "❓" : ""}</small></label>`;
  const verfuegbar = s.vorschlaege.filter((v) => !f.tagesordnung.some((t) => t.id === v.id));
  // 2.749.0 KC-CLUB-SITZUNG-SCHRITTE: oben sichtbar, ob gespeichert oder nur Vorschlag, was sich seitdem geändert hat und wo man im Ablauf steht
  const v = s.vorbereitung?.tagesordnung?.length ? s.vorbereitung : null, ts = (BU.start?.sitzungen || []).find((x) => x.id === s.treffen?.id);
  const stand = `<div class="karte bu-stand ${v ? "gespeichert" : "vorschlag"}">${v ? `✅ <b>Gespeichert</b> ${esc(zeitKurz(v.geaendert_am))}${v.geaendert_von ? ` von ${esc(v.geaendert_von)}` : ""}` : "📝 <b>Vorschlag der App</b> – noch nicht gespeichert. Prüfen, anpassen, dann unten speichern."}
    ${(BU.hinweise || []).length ? `<ul class="bu-hinweise">${BU.hinweise.map((h) => `<li>${esc(h)}</li>`).join("")}</ul><p class="hinweis" style="margin:4px 0 0">Bitte unten speichern, damit es überall gilt.</p>` : ""}
    ${v && v.anmerkung && s.anmerkungVorschlag && v.anmerkung !== s.anmerkungVorschlag && f.anmerkung === v.anmerkung ? `<p class="hinweis" style="margin:6px 0 0">ℹ️ Neuer Stand zum letzten Protokoll: „${esc(s.anmerkungVorschlag)}“ <button class="knopf klein" onclick="BU.f.anmerkung=BU.s.anmerkungVorschlag;buZeigen()">Übernehmen</button></p>` : ""}</div>`;
  // 2.751.0 KC-CLUB-SITZUNG-ABLAUF: Seite „to“ (Tagesordnung festlegen) oder „vor“ (Sitzung vorbereiten); oben ein Umschalter
  const VOR = BU.teil === "vor", TO = !VOR;
  const umschalter = `<div class="hl-chips bu-teil"><button class="chip${TO ? " an" : ""}" onclick="buTeil('to')">📝 Tagesordnung festlegen</button><button class="chip${VOR ? " an" : ""}" onclick="buTeil('vor')">🖨️ Sitzung vorbereiten</button></div>`;
  const topKurz = `<div class="karte"><h3 style="margin-top:0">📋 Tagesordnung <small class="hinweis">(${f.tagesordnung.length} Punkte)</small></h3><ol class="bu-top-kurz">${f.tagesordnung.map((t) => `<li>${esc(t.t)}</li>`).join("")}</ol>
    ${buSchreiben() ? `<button class="knopf klein" onclick="buTeil('to')">✏️ Tagesordnung ändern</button>` : ""}</div>`;
  // 1.37.0: nur Leserecht → alles sichtbar, aber gesperrt (fieldset disabled); Drucken bleibt
  return `${buSchreiben() && ts ? buSchritteHtml(ts, true) : ""}${umschalter}${stand}${ICH?.vorstand && s.treffen?.id ? `<button class="knopf at-sitzung" onclick="atOeffnen('${esc(s.treffen.id)}')">💼 Aktentasche für diese Sitzung</button>` : ""}${buSchreiben() ? "" : '<p class="bu-tipp">👁️ Nur ansehen – Ändern schaltet der Admin frei.</p>'}<fieldset class="bu-fs"${buSchreiben() ? "" : " disabled"}><div class="karte bu-kopf"><img src="kc-kochmuetze-weiss.webp" alt="" class="bu-logo"><div><b>Köcheclub Werne</b><br><span style="font-size:1.15rem;font-weight:800">${esc(s.treffen.titel)}</span><br>${esc(wann(s.treffen.beginn, true))}${s.treffen.ort ? " · 📍 " + esc(s.treffen.ort) : ""}</div></div>
    ${VOR ? `<div class="karte"><h3 style="margin-top:0">1️⃣ Wer ist dabei?</h3><p class="hinweis" style="margin:0 0 6px">Angehakt sind alle, die zugesagt haben. Antippen ändert es.</p>
      <div class="bu-haken-liste">${rest.map(haken).join("")}</div>
      <p style="margin:10px 0 0"><b>Entschuldigt:</b> ${nein.length ? nein.map((x) => esc(x.name) + (x.notiz ? ` <small class="hinweis">(${esc(x.notiz)})</small>` : "")).join(", ") : "–"}</p></div>
    <div class="karte"><h3 style="margin-top:0">2️⃣ Anmerkung zum letzten Protokoll</h3>
      <label class="feld" style="margin:0"><textarea id="buAnmerkung" rows="3" maxlength="1000" oninput="BU.f.anmerkung=this.value;lvAuffrischen()">${esc(f.anmerkung)}</textarea></label>
      ${s.aufgaben.filter((a) => !a.erledigt).length ? `<p style="margin:8px 0 2px"><b>Offene Aufgaben aus dem letzten Protokoll:</b></p><ul style="margin:0;padding-left:20px">${s.aufgaben.filter((a) => !a.erledigt).map((a) => `<li>${esc(a.wer)}: ${esc(a.text)}</li>`).join("")}</ul>` : ""}</div>
` : ""}
    ${TO ? `<div class="karte"><h3 style="margin-top:0">📋 Tagesordnung</h3><p class="hinweis" style="margin:0 0 6px">Vorschläge der Mitglieder aufnehmen, Reihenfolge festlegen, eigene Punkte dazu. Einladung ${esc(ts ? buFristText(ts) : "spätestens 3 Tage vorher")}.</p>
      <ol class="bu-top">${f.tagesordnung.map((t, i) => `<li class="bu-top-${t.art}"><span>${esc(t.t)}${t.art === "vorschlag" ? ` <small class="hinweis">· ${t.id && !s.vorschlaege.some((x) => x.id === t.id) ? "⚠️ Vorschlag wurde zurückgezogen" : buVon(s, t) ? `Vorschlag von ${esc(buVon(s, t))}` : "Vorschlag"}</small>` : ""}</span>
        <span class="bu-top-knoepfe"><button ${i ? "" : "disabled"} onclick="buTop(${i},-1,this)" aria-label="nach oben">▲</button><button ${i < f.tagesordnung.length - 1 ? "" : "disabled"} onclick="buTop(${i},1,this)" aria-label="nach unten">▼</button><button onclick="buTopWeg(${i})" aria-label="streichen">✕</button></span></li>`).join("")}</ol>
      ${verfuegbar.length ? `<p class="hinweis" style="margin:8px 0 4px">Weitere Vorschläge – antippen zum Aufnehmen:</p><div class="hl-chips">${verfuegbar.map((v) => `<button class="chip" onclick="buTopVorschlag('${v.id}')">＋ ${esc(v.text)}${v.unterstuetzt ? ` · 👍${v.unterstuetzt}` : ""}</button>`).join("")}</div>` : ""}
      <div class="zwei" style="align-items:end"><label class="feld">Eigener Punkt<input id="buNeu" maxlength="200" placeholder="z. B. Planung Weihnachtsmarkt" enterkeyhint="done" value="${esc(f.neu)}" oninput="BU.f.neu=this.value" onkeydown="if(event.key==='Enter'){event.preventDefault();buTopNeu()}"></label><button class="knopf" onclick="buTopNeu()">＋ Dazu</button></div></div>` : topKurz}
    ${VOR ? `<div class="karte"><h3 style="margin-top:0">3️⃣ Schreiblinien je Punkt</h3><div class="hl-chips">${s.zeilenWahl.map((z) => `<button class="chip${f.zeilen === z ? " an" : ""}" onclick="BU.f.zeilen=${z};buZeigen()">${z ? z + " Zeilen" : "keine"}</button>`).join("")}</div></div>
    ${s.protokoll && s.protokoll.status !== "entwurf" ? '<p class="hinweis">ℹ️ Das Protokoll dieser Sitzung ist schon veröffentlicht – es wird nicht verändert.</p>' : ""}
    ${lvKasten()}` : ""}
    ${buSchreiben() ? `<div class="bu-leiste"><button class="knopf haupt" style="width:100%;text-align:center" onclick="buSpeichern(this)">${VOR ? "✅ Fertig – vorbereitet" : "✅ Tagesordnung speichern"}</button></div>` : ""}</fieldset>
    ${buSchreiben() ? "" : '<div class="bu-leiste"><button class="knopf haupt" style="width:100%;text-align:center" onclick="buDruckWahl()">🖨️ Vorlage drucken</button></div>'}`;
}
function buAnw(id, an) { an ? BU.f.anwesend.add(id) : BU.f.anwesend.delete(id); lvAuffrischen(); }
// 2.692.0 KC-CLUB-VORSCHLAG-VON: Name des Einreichers bei Tagesordnungspunkten (Büro, Vorlage, Einladung, Protokoll)
const buVon = (s, t) => (t?.id ? (s?.vorschlaege || []).find((v) => v.id === t.id)?.von : null) || null;
// 2.749.0 KC-CLUB-SITZUNG-SCHRITTE: der verschobene Punkt bleibt unter dem Finger und leuchtet kurz auf (sonst tauscht weiteres Tippen nur hin und her)
function buTop(i, d, knopf) {
  const l = BU.f.tagesordnung, j = i + d, y = knopf?.getBoundingClientRect().top; [l[i], l[j]] = [l[j], l[i]]; buZeigen();
  const li = document.querySelectorAll("#buInhalt .bu-top li")[j], b = li?.querySelectorAll(".bu-top-knoepfe button")[d < 0 ? 0 : 1];
  if (b && y != null) window.scrollBy(0, b.getBoundingClientRect().top - y);
  if (li) { li.classList.add("bu-top-bewegt"); setTimeout(() => li.classList.remove("bu-top-bewegt"), 1400); }
}
async function buTopWeg(i) { const t = BU.f.tagesordnung[i]; if (!t || !(await frage(`„${t.t}“ von der Tagesordnung streichen?`, { ja: "✕ Streichen", nein: "Behalten" }))) return; BU.f.tagesordnung.splice(i, 1); buZeigen(); }
// neue Punkte vor „Verschiedenes“ einreihen
function buTopEinfuegen(p) { const l = BU.f.tagesordnung, v = l.findIndex((x) => x.art === "fest" && /^Verschiedenes$/i.test(x.t)); l.splice(v < 0 ? l.length : v, 0, p); buZeigen(); }
function buTopVorschlag(id) { const v = BU.s.vorschlaege.find((x) => x.id === id); if (v) buTopEinfuegen({ t: v.text, art: "vorschlag", id: v.id }); }
function buTopNeu() { const t = (BU.f.neu || "").trim(); if (!t) return melde("Bitte kurz eingeben, worum es geht.", true); BU.f.neu = ""; buTopEinfuegen({ t, art: "eigen" }); }
async function buSpeichern(knopf, ueberschreiben = false) {
  const f = BU.f, s = BU.s;
  // 2.749.0 KC-CLUB-SITZUNG-SCHRITTE: eingetippter, aber nicht hinzugefügter eigener Punkt geht nicht verloren
  const offen = (f.neu || "").trim(); if (offen) { f.neu = ""; buTopEinfuegen({ t: offen, art: "eigen" }); melde(`➕ „${offen}“ mit aufgenommen`); }
  if (!f.tagesordnung.length) return melde("Die Tagesordnung ist leer.", true);
  await einmal(knopf, async () => {
    try {
      const r = await api("buero_speichern", { treffen_id: s.treffen.id, anwesend: [...f.anwesend], anmerkung: f.anmerkung, tagesordnung: f.tagesordnung, zeilen: f.zeilen, stand: BU.stand, ueberschreiben, teil: BU.teil });
      if (r.zusammenstoss) return buWeiterFragen("⚠️ Inzwischen geändert", `${esc(r.von || "Jemand anderes")} hat die Tagesordnung ${esc(zeitKurz(r.am))} gespeichert – während du sie bearbeitet hast. Was soll gelten?`, [
        ["🔄 Neu laden und ansehen (deine Änderungen verwerfen)", `buSitzungOeffnen('${s.treffen.id}')`, true], ["💾 Meine Fassung speichern (die andere überschreiben)", "buSpeichern(null, true)"], ["Abbrechen", ""]]);
      s.protokoll = r.protokoll_id ? { id: r.protokoll_id, status: s.protokoll?.status || "entwurf" } : s.protokoll;
      s.vorbereitung = { ...(s.vorbereitung || {}), anwesend: [...f.anwesend], anmerkung: f.anmerkung, tagesordnung: f.tagesordnung, zeilen: f.zeilen, geaendert_am: r.stand, geaendert_von: ICH?.name || null };
      BU.stand = r.stand; BU.urfassung = buFassung(); BU.hinweise = [];
      const ts = (BU.start?.sitzungen || []).find((x) => x.id === s.treffen.id);
      if (ts) Object.assign(ts, { vorbereitet: true, geaendert_nach_einladung: !!r.informieren, unterlagen_am: r.unterlagen_am ?? null });
      const prot = { angelegt: " Der Protokoll-Entwurf ist angelegt.", aktualisiert: " Der Protokoll-Entwurf ist angepasst.", fehler: " ⚠️ Der Protokoll-Entwurf konnte nicht angelegt werden – bitte später noch einmal speichern." }[r.protokollStand]
        || (s.protokoll && s.protokoll.status !== "entwurf" ? " Das Protokoll ist schon veröffentlicht und bleibt unverändert." : s.protokoll ? " ℹ️ Den Protokoll-Entwurf bearbeitet jetzt der Schriftführer – er wurde nicht verändert." : "");
      buZeigen();
      const id = s.treffen.id, tasche = ICH?.vorstand ? [["💼 Weiter: Aktentasche packen", `atOeffnen('${id}')`, BU.teil === "vor"]] : [];
      // 2.751.0 KC-CLUB-SITZUNG-ABLAUF / KC-CLUB-AENDERUNG-MELDUNG: Tagesordnung nach der Einladung geändert → Clubleitung entscheidet „Mitglieder informieren?“
      if (r.informieren) return buWeiterFragen("✅ Gespeichert – Mitglieder informieren?", `Die Einladung ist schon raus, die Tagesordnung hat sich seitdem geändert. Sollen die Mitglieder eine Änderungsmeldung bekommen (mit „Neu / Entfällt“)? Ohne Meldung steht die Änderung trotzdem in der App.${prot}`, [
        ["📣 Ja – Änderungsmeldung senden (Vorschau)", `buEinladung('${id}', false, true)`, true], ["🙅 Nein, nicht informieren", `buInformierenNein('${id}')`], ["⏰ Später entscheiden", ""]]);
      if (BU.teil === "vor") return buWeiterFragen("✅ Sitzung vorbereitet", `Anwesende, Anmerkung und Mitschreibbogen sind gespeichert.${prot} Jetzt den Mitschreibbogen drucken – und zuletzt die Aktentasche packen.`, [
        ["🖨️ Mitschreibbogen drucken", "buDruckJetzt()", !tasche.length], ...tasche, ["🗂️ Zurück ins Büro", "buStart()"]]);
      buWeiterFragen(r.einladung_am ? "✅ Tagesordnung gespeichert" : "✅ Schritt erledigt: Tagesordnung gespeichert",
        `${r.einladung_am ? "Die Mitglieder kennen diesen Stand schon." : `Als Nächstes lädst du die Mitglieder mit dieser Tagesordnung ein – ${esc(ts ? buFristText(ts) : "spätestens 3 Tage vorher")}`}${prot}`, [
        r.einladung_am ? ["🖨️ Weiter: Sitzung vorbereiten", `buTeil('vor')`, true] : ["📨 Weiter: Mitglieder einladen", `buEinladung('${id}', false)`, true], ["🗂️ Zurück ins Büro", "buStart()"]]);
    } catch (e) { meldeFehler(e); }
  });
}
// Logische Abfolge: nach jedem Schritt die sinnvollen nächsten anbieten
function buWeiterFragen(titel, text, knoepfe) {
  blattAuf("buWeiter", `<h3 style="margin-top:0">${titel}</h3><p style="margin:0;font-size:1.05rem">${text}</p>
    <div class="knoepfe" style="flex-direction:column;align-items:stretch">${knoepfe.map(([t, fn, haupt]) => `<button class="knopf${haupt ? " haupt" : ""}" style="text-align:center" onclick="$('buWeiter').remove();${fn}">${t}</button>`).join("")}</div>`);
}
function buDruckJetzt() { druckStarten("sitzung"); }
// Druckvorlage: Kopf (Logo + Köcheclub Werne kommen aus dem Druckrahmen), Anwesenheit, Entschuldigt, Anmerkung, Tagesordnung mit Linien
function druckSitzung() {
  const s = BU.s, f = BU.f; if (!s || !f) throw new Error("Bitte die Sitzung zuerst im Büro vorbereiten.");
  const m = s.mitglieder.slice().sort((a, b) => a.name.localeCompare(b.name)), nein = m.filter((x) => x.antwort === "nein"), rest = m.filter((x) => x.antwort !== "nein");
  const linien = (n) => Array.from({ length: n }, () => '<div style="border-bottom:1px solid #999;height:8.5mm"></div>').join("");
  const box = (an) => `<span style="display:inline-block;width:4.2mm;height:4.2mm;border:1.4px solid #222;margin-right:2mm;vertical-align:-0.6mm;text-align:center;line-height:4mm;font-size:3.6mm;font-weight:800">${an ? "✓" : ""}</span>`;
  const h = (t) => `<h2 style="font-size:4.6mm;margin:6mm 0 2mm;border-bottom:2px solid #741521;padding-bottom:1mm">${t}</h2>`;
  const auf = s.aufgaben.filter((a) => !a.erledigt);
  // KC-CLUB-VORLAGE-KOPF (1.82.0, Wunsch Hansi): oben Protokollführer, Ort, Entschuldigt bzw. fehlend, Gäste – wenig Platz;
  // unten „Nächster Termin“ (vorbelegt, wenn schon eine weitere Sitzung geplant ist)
  const strich = (mm) => `<span style="display:inline-block;width:${mm}mm;border-bottom:1px solid #555;height:4mm;vertical-align:-1mm"></span>`;
  const zeile = (t, inhalt) => `<div style="font-size:3.6mm;margin:0 0 2mm"><b>${t}:</b> ${inhalt}</div>`;
  const kopf = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 6mm;margin:0 0 1mm">${zeile("Protokollführer", strich(48))}${zeile("Ort", s.treffen.ort ? esc(s.treffen.ort) : strich(55))}</div>`;
  const weiter = (BU.start?.sitzungen || []).find((x) => x.id !== s.treffen.id && new Date(x.beginn) > new Date(s.treffen.beginn));
  const html = `${kopf}${h("Anwesend")}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5mm 4mm;font-size:3.6mm">${rest.map((x) => `<div>${box(f.anwesend.has(x.person_id))}${esc(x.name)}</div>`).join("")}</div>
    <p style="margin:3mm 0 0;font-size:3.6mm"><b>Entschuldigt bzw. fehlend:</b> ${nein.length ? nein.map((x) => esc(x.name) + (x.notiz ? ` (${esc(x.notiz)})` : "")).join(", ") + " · " : ""}${strich(nein.length ? 50 : 120)}</p>
    <p style="margin:2mm 0 0;font-size:3.6mm"><b>Gäste:</b> ${strich(150)}</p>
    ${h("Anmerkung zum letzten Protokoll")}<div style="font-size:3.6mm;white-space:pre-wrap">${esc(f.anmerkung || "")}</div>
    ${auf.length ? `<p style="margin:2mm 0 1mm;font-size:3.6mm"><b>Offene Aufgaben:</b></p><ul style="margin:0;padding-left:6mm;font-size:3.5mm">${auf.map((a) => `<li>${box(false)}${esc(a.wer)}: ${esc(a.text)}</li>`).join("")}</ul>` : ""}${linien(2)}
    ${h("Tagesordnung")}${f.tagesordnung.map((t, i) => `<div style="break-inside:avoid;margin:0 0 3mm"><div style="font-size:4mm;font-weight:800;margin-top:3mm">TOP ${i + 1}: ${esc(t.t)}${buVon(s, t) ? ` <span style="font-weight:400;font-size:3.4mm">(Vorschlag von ${esc(buVon(s, t))})</span>` : ""}</div>${linien(f.zeilen)}</div>`).join("")}
    <div style="break-inside:avoid">${h("Beschlüsse / Sonstiges")}${linien(Math.max(3, f.zeilen))}
    <p style="margin:3mm 0 0;font-size:3.8mm"><b>Nächster Termin:</b> ${weiter ? `${esc(wann(weiter.beginn, true))}${weiter.ort ? " · " + esc(weiter.ort) : ""}` : `Datum ${strich(30)} Uhrzeit ${strich(18)} Ort ${strich(55)}`}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:9mm;font-size:3.3mm"><div style="border-top:1px solid #222;padding-top:1mm">Protokoll (Name, Unterschrift)</div><div style="border-top:1px solid #222;padding-top:1mm">Sitzungsleitung (Name, Unterschrift)</div></div></div>`;
  return { titel: s.treffen.titel, unter: `${wann(s.treffen.beginn, true)}${s.treffen.ort ? " · " + s.treffen.ort : ""}`, html, fuss: "Protokoll-Vorlage aus dem Büro" };
}
// Einladung / Erinnerung: Vorschau, Weg wählen, erst nach Bestätigung senden
async function buEinladung(id, nurOffen, aenderung = false) {
  let s; try { s = await api("buero_sitzung", { treffen_id: id }, { warten: true }); } catch (e) { return meldeFehler(e); }
  const top = (s.vorbereitung?.tagesordnung || []).map((t, i) => `${i + 1}. ${t.t}${buVon(s, t) ? ` – Vorschlag von ${buVon(s, t)}` : ""}`);
  // 2.749.0 KC-CLUB-EINE-TAGESORDNUNG: eingeladen wird nur mit der festgelegten Tagesordnung – sonst stünde überall etwas anderes
  if (!nurOffen && !top.length) return buWeiterFragen("📝 Zuerst die Tagesordnung festlegen", "Die Einladung enthält die Tagesordnung. Bitte lege sie zuerst fest und speichere sie – danach geht es hier weiter.", [["📝 Tagesordnung festlegen", `buSitzungOeffnen('${id}')`, true], ["Abbrechen", ""]]);
  const ohneKomm = new Set((MITGLIEDER || []).filter(okAus).map((m) => m.person_id)); // 2.538.0: 📵 bekommt keine Benachrichtigungen
  const empf = new Set((s.empfaenger || s.mitglieder.map((m) => m.person_id)).filter((id) => zwIch(id) && !ohneKomm.has(id))); // wie der Server: ohne mich, ohne Aushilfen, ohne 📵
  const ohne = s.mitglieder.filter((m) => empf.has(m.person_id) && (!m.antwort || m.antwort === "keine")).length;
  const anzahl = nurOffen ? ohne : empf.size;
  const schon = nurOffen ? s.vorbereitung?.erinnerung_am : s.vorbereitung?.einladung_am;
  window.__buSend = { id, nurOffen, aenderung: !nurOffen && aenderung, wege: [], s, empf }; // KC-CLUB-EINLADUNG-AN (2.739.0) · Empfänger: ZWAHL.buAn (KC-CLUB-ZIELWAHL)
  blattAuf("buEinladung", `${einwHtml("b-bu-einladung")}<h3 style="margin-top:0">${nurOffen ? "🔔 Erinnerung" : aenderung ? "📣 Änderungsmeldung" : "📨 Einladung"}: ${esc(s.treffen.titel)}</h3>
    ${schon ? `<p class="hinweis" style="margin:0">ℹ️ Schon einmal gesendet: ${esc(zeitKurz(schon))}</p>` : ""}
    <p class="hinweis" style="margin:0 0 4px">So sieht der Brief aus – jeder bekommt ihn mit seinem eigenen Vornamen:</p>
    <div class="karte" id="buBrief" style="margin:0;white-space:pre-wrap;font-size:.95rem"></div>
    <label class="feld">Persönliche Zeile (freiwillig)<input id="buZusatz" maxlength="500" placeholder="z. B. Bitte Kassenbuch mitbringen" oninput="buBriefZeigen()"></label>
    <div class="hinweis" style="margin:8px 0 4px">An wen?</div><div id="buAn"></div>
    <div class="hinweis" style="margin:8px 0 4px">Wie benachrichtigen?</div>
    <div class="hl-chips" id="buWege">${[["", "⚙️ Wie jeder es eingestellt hat"], ["push", "🔔 Push"], ["email", "✉️ E-Mail"], ["beide", "🔔+✉️ Beides"]].map(([w, t]) => `<button class="chip${w === "" ? " an" : ""}" data-w="${w}" onclick="buWeg('${w}')">${t}</button>`).join("")}</div>
    <div class="knoepfe" style="flex-direction:column;align-items:stretch"><button class="knopf haupt" id="buSendKnopf" style="text-align:center" ${anzahl ? "" : "disabled"} onclick="buSenden(this)">${anzahl ? `📨 Jetzt an ${anzahl} ${anzahl === 1 ? "Mitglied" : "Mitglieder"} senden` : "Alle haben schon geantwortet 👍"}</button>
    <button class="knopf" style="text-align:center" onclick="$('buEinladung').remove()">Abbrechen</button></div>`);
  window.__buSend.top = (s.vorbereitung?.tagesordnung || []).map((t, i) => `${i + 1}. ${t.t}`); buBriefZeigen(); // KC-CLUB-EINLADUNG-BRIEF (2.740.0): wie der Server
  zwStart("buAn", { titel: "👤 Wer bekommt die Einladung?", alleText: nurOffen ? "alle, die noch nicht geantwortet haben" : BU_ALLE_TEXT, alle: buBerechtigt, nachher: buAnNachher,
    extra: () => [["ja", "✅ Zugesagt", s.mitglieder.filter((m) => zwIch(m.person_id) && m.antwort === "ja").map((m) => m.person_id)], ["ohne", "❓ Noch ohne Antwort", s.mitglieder.filter((m) => zwIch(m.person_id) && (!m.antwort || m.antwort === "keine")).map((m) => m.person_id)]] });
}
// KC-CLUB-EINLADUNG-AN (2.739.0, Wunsch Hansi „vor dem Absenden auswählen, an wen die Einladung geht: Alle, Gruppen, Auswahl“):
// 👥 Alle (wie bisher) · 🧑‍🤝‍🧑 Gruppe (Zugesagt, Noch ohne Antwort, Ämter, eigene Gruppen) · ☑️ Auswahl (gemeinsames Auswahlfenster zielAuswahl).
// Der Server schickt nur an Mitglieder, die auch sonst die Einladung bekämen (Schnittmenge) – der Knopf zeigt die echte Zahl.
// KC-CLUB-EINLADUNG-BRIEF (2.740.0, Wunsch Hansi): Vorschau mit denselben Sätzen wie der Server (einladungBrief) – Anrede mit dem ersten Empfänger
const BRIEF_AMT_RE = /^(clubsprecher|stellv|kassenwart|schriftf|admin)/i;
// 2.751.0 KC-CLUB-AENDERUNG-MELDUNG: wie der Server (topDiff) – neu dazu, entfällt, Reihenfolge
function topDiff(alt, neu) {
  if (!Array.isArray(alt) || !alt.length) return null;
  const k = (x) => (x?.id ? "v:" + x.id : "t:" + String(x?.t || "").trim().toLowerCase());
  const ka = alt.map(k), kn = neu.map(k);
  const dazu = neu.map((x, i) => ({ nr: i + 1, t: String(x.t), dringend: /^❗/.test(String(x.t)) })).filter((_, i) => !ka.includes(kn[i]));
  const weg = alt.filter((_, i) => !kn.includes(ka[i])).map((x) => String(x.t));
  const bleibt = kn.filter((x) => ka.includes(x)), vorher = ka.filter((x) => kn.includes(x));
  return { dazu, weg, reihenfolge: bleibt.join("|") !== vorher.join("|") };
}
function einladungBrief(d) {
  const tag = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d.beginn)).replace(", ", ", den ");
  const was = /^clubsitzung\b/i.test(d.titel) ? "Clubsitzung" : `Sitzung „${d.titel}“`, wann = `am ${tag}, um ${fZeit.format(new Date(d.beginn))} Uhr`;
  const gruss = `Liebe Grüße\n${d.von}${d.amt ? "\n" + d.amt : ""}\nKöcheclub Werne`, kopf = `Hallo${d.vorname ? " " + d.vorname : ""},\n\n`;
  if (d.erinnerung) return kopf + `kleine Erinnerung: ${wann} ist unsere ${was}${d.ort ? ` – ${d.ort}` : ""}.\n\nBitte sag kurz in der Club-App zu oder ab – das hilft uns bei der Vorbereitung:\n${d.url}`
    + (d.zusatz ? `\n\n${d.zusatz}` : "") + `\n\n${gruss}`;
  // 2.749.0 KC-CLUB-SITZUNG-SCHRITTE: nach der Einladung geänderte Tagesordnung mitteilen (gleicher Text in App-Vorschau und Versand)
  // 2.751.0 KC-CLUB-AENDERUNG-MELDUNG: mit „Neu / Entfällt“ und 🆕 an den neuen Punkten (Vergleich mit der zuletzt an alle verschickten Tagesordnung)
  if (d.aenderung) {
    const df = d.diff, nurDazu = !!df && df.dazu.length > 0 && !df.weg.length, nurWeg = !!df && df.weg.length > 0 && !df.dazu.length, nurFolge = !!df && !df.dazu.length && !df.weg.length && df.reihenfolge;
    const satz = nurDazu ? (df.dazu.length === 1 ? "ist noch ein Punkt dazugekommen" : "sind noch Punkte dazugekommen") : nurWeg ? `${df.weg.length === 1 ? "entfällt ein Punkt" : "entfallen Punkte"}`
      : nurFolge ? "hat sich die Reihenfolge der Tagesordnung geändert" : "hat sich die Tagesordnung geändert";
    const neuNr = new Set((df?.dazu ?? []).map((x) => x.nr));
    const teile = df ? [df.dazu.length ? `Neu:\n${df.dazu.map((x) => `${x.nr}. ${x.t}`).join("\n")}` : "", df.weg.length ? `Entfällt:\n${df.weg.map((t) => `– ${t}`).join("\n")}` : ""].filter(Boolean) : [];
    return kopf + `zu unserer ${was} ${wann}${d.ort ? ` – ${d.ort}` : ""} ${satz}.` + (teile.length ? `\n\n${teile.join("\n\n")}` : "")
      + `\n\n${df ? "Die vollständige Tagesordnung" : "So sieht die Tagesordnung jetzt aus"}:\n${d.top.map((x, i) => (neuNr.has(i + 1) ? `${x} 🆕` : x)).join("\n")}`
      + (d.zusatz ? `\n\n${d.zusatz}` : "") + `\n\nFalls du noch nicht zu- oder abgesagt hast, bitte kurz in der Club-App:\n${d.url}\n\n${gruss}`;
  }
  return kopf + `hiermit laden wir dich herzlich zu unserer ${was} ein:\n\n📅 ${wann}${d.ort ? `\n📍 ${d.ort}` : ""}`
    + (d.top.length ? `\n\nFolgende Punkte stehen auf der Tagesordnung:\n${d.top.join("\n")}` : "")
    + (d.top.length ? "\n\nDringende Vorschläge oder Änderungen können bis zur Sitzung noch dazukommen." : "") // 2.751.0 KC-CLUB-SITZUNG-ABLAUF (Wunsch Hansi 29.10.)
    + (d.zusatz ? `\n\n${d.zusatz}` : "")
    + `\n\nWir freuen uns auf eine schöne, konstruktive Sitzung.\nBitte sag kurz in der Club-App zu oder ab:\n${d.url}\n\n${gruss}`;
}
function buBriefZeigen() {
  const x = window.__buSend, z = $("buBrief"); if (!x || !z) return; const t = x.s.treffen;
  const Z = ZWAHL.buAn, erst = Z && Z.art !== "alle" && Z.ids[0] ? vfName(Z.ids[0]).split(" ")[0] : "Marianne"; // Beispiel-Anrede
  z.textContent = einladungBrief({ vorname: erst, titel: t.titel, beginn: t.beginn, ort: t.ort || "", top: x.top || [], zusatz: ($("buZusatz")?.value || "").trim(), url: "(Link zur Club-App)",
    von: ICH?.vorname || ICH?.name || "", amt: (ICH?.aemter || []).find((a) => BRIEF_AMT_RE.test(a)) || (ICH?.aemter || [])[0] || "", erinnerung: x.nurOffen, aenderung: x.aenderung,
    diff: x.aenderung ? topDiff(x.s.vorbereitung?.versandt_top, x.s.vorbereitung?.tagesordnung || []) : null });
}
function buBerechtigt() { const x = window.__buSend; return x.s.mitglieder.filter((m) => zwIch(m.person_id) && (!x.empf || x.empf.has(m.person_id)) && (!x.nurOffen || !m.antwort || m.antwort === "keine")).map((m) => m.person_id); } // 2.749.0: dieselben Empfänger wie der Server
function buAnZahl() { const Z = ZWAHL.buAn, b = buBerechtigt(); return Z.art === "alle" ? b.length : b.filter((id) => Z.ids.includes(id)).length; }
function buAnNachher() {
  buBriefZeigen();
  const n = zwBereit("buAn") ? buAnZahl() : 0, k = $("buSendKnopf");
  if (k) { k.disabled = !n; k.textContent = n ? `📨 Jetzt an ${n} ${n === 1 ? "Mitglied" : "Mitglieder"} senden` : ZWAHL.buAn.art === "alle" ? "Alle haben schon geantwortet 👍" : "Bitte erst auswählen"; }
}
function buWeg(w) { window.__buSend.wege = w === "beide" ? ["push", "email"] : w ? [w] : []; document.querySelectorAll("#buWege .chip").forEach((b) => b.classList.toggle("an", b.dataset.w === w)); }
async function buSenden(knopf) {
  const x = window.__buSend, A = ZWAHL.buAn;
  if (!zwBereit("buAn")) return melde(A.art === "gruppe" ? "Bitte eine Gruppe antippen." : A.art === "amt" ? "Bitte ein Amt antippen." : "Bitte Mitglieder auswählen.", true);
  const anzahl = buAnZahl();
  if (!anzahl) return melde("An diese Auswahl geht nichts – alle haben schon geantwortet oder niemand passt.", true);
  if (!(await frage(`${x.nurOffen ? "Erinnerung" : "Einladung"} jetzt an ${anzahl} ${anzahl === 1 ? "Mitglied" : "Mitglieder"} senden?${A.art === "gruppe" || A.art === "amt" ? `\n\n${A.art === "amt" ? "Amt" : "Gruppe"}: ${A.name.replace(/^\S+ /, "")}` : A.art === "einzeln" ? "\n\nNur an deine Auswahl." : ""}`))) return;
  await einmal(knopf, async () => {
    try {
      const r = await api("buero_einladung", { treffen_id: x.id, nur_offen: x.nurOffen, aenderung: !!x.aenderung, wege: x.wege, text: $("buZusatz")?.value || "", ...(A.art === "alle" ? {} : { ziel: { art: A.art, name: A.name || "", ids: A.ids } }) });
      $("buEinladung")?.remove();
      // 2.749.0 KC-CLUB-SITZUNG-SCHRITTE: ehrliche Meldung (0 Empfänger, nur Auswahl) und gleich der nächste Schritt
      if (!r.empfaenger) return melde("⚠️ Es ging nichts raus – die Auswahl passt auf niemanden.", true);
      const ts = (BU.start?.sitzungen || []).find((y) => y.id === x.id), jetzt = new Date().toISOString();
      if (ts && r.alle) Object.assign(ts, x.nurOffen ? { erinnerung_am: jetzt } : { einladung_am: jetzt, geaendert_nach_einladung: false });
      const nurAuswahl = r.alle ? "" : ` Das war nur deine Auswahl – ${x.nurOffen ? "die Erinnerung" : "die Einladung"} an alle steht noch aus.`;
      if (x.nurOffen) { melde(`🔔 Erinnerung an ${r.empfaenger} ${r.empfaenger === 1 ? "Mitglied" : "Mitglieder"} gesendet.${nurAuswahl}`); return buStart(); }
      // 2.751.0 KC-CLUB-SITZUNG-ABLAUF: nach der Einladung kommt (ein paar Tage später) „Sitzung vorbereiten“, zuletzt die Aktentasche – das Büro erinnert daran
      buWeiterFragen(x.aenderung ? "✅ Die Mitglieder wissen Bescheid" : "✅ Einladung gesendet",
        `${r.empfaenger} ${r.empfaenger === 1 ? "Mitglied hat" : "Mitglieder haben"} ${x.aenderung ? "die Änderungsmeldung" : "die Einladung"} bekommen.${nurAuswahl}${x.aenderung ? "" : " Als Nächstes erinnert dich das Büro an alle, die noch nicht geantwortet haben, dann kommt „Sitzung vorbereiten“ (Anwesende, Anmerkung, Mitschreibbogen) und zuletzt die Aktentasche."}`,
        [["🗂️ Zurück ins Büro", "buStart()", true], ...(x.aenderung ? [] : [["🖨️ Sitzung jetzt schon vorbereiten", `buSitzungOeffnen('${x.id}', 'vor')`]]), ["🏠 Zur Club-App", "zeige('start')"]]);
    } catch (e) { meldeFehler(e); }
  });
}
function buEingang() { BU.sicht = "eingang"; buZeigen(); buEingangLaden(); window.scrollTo(0, 0); }
// 2.584.0 KC-CLUB-EINGANG-PAKET (Wunsch Hansi „Aufbau des Eingangskorbs dauert lange“): alle Listen in EINEM Aufruf (eine Anmeldung,
// gemeinsamer Lese-Puffer am Server). Die Antworten sind genau die der einzelnen Aufrufe und werden wie bisher verarbeitet. Kennt der Server das
// Paket nicht (alt) oder klappt es nicht, lädt die App wie bisher einzeln (buEingangLadenEinzeln).
async function buEingangLaden() {
  const L = ICH?.vorstand || ICH?.admin;
  const teile = ["leihen_liste", "vorschlaege_liste", "hilfe_liste", ...(ICH?.protokolle === false ? [] : ["protokolle_liste"]), "archiv_liste", ...(L ? ["aenderungen_liste", "eingang_korb"] : []), "buero_start"];
  let pk = null;
  try { pk = (await api("buero_eingang_paket", { teile }))?.teile || null; } catch { pk = null; }
  if (!pk || !teile.every((t) => pk[t])) return buEingangLadenEinzeln();
  const teil = (t) => (pk[t]?.ok ? { status: "fulfilled", value: pk[t].daten } : { status: "rejected", reason: pk[t] });
  if (pk.aenderungen_liste?.ok) try { AE.eingang = pk.aenderungen_liste.daten; AE.offen = AE.eingang.meldungen.filter((x) => x.wartetAufMich ?? x.status === "offen").length; } catch {} // wie aeEingangLaden (dort fängt allSettled Fehler ab)
  if (pk.eingang_korb?.ok) BU_EIN.korb = pk.eingang_korb.daten;
  if (pk.buero_start?.ok) BU.start = pk.buero_start.daten;
  buEingangUebernehmen(teil("leihen_liste"), teil("vorschlaege_liste"), teil("hilfe_liste"), ICH?.protokolle === false ? { status: "rejected" } : teil("protokolle_liste"), teil("archiv_liste"));
}
async function buEingangLadenEinzeln() {
  const [l, v, h, pr, ar] = await Promise.allSettled([api("leihen_liste"), api("vorschlaege_liste"), api("hilfe_liste"),
    ICH?.protokolle === false ? Promise.reject(0) : api("protokolle_liste"), api("archiv_liste"),
    ICH?.vorstand || ICH?.admin ? aeEingangLaden() : Promise.reject(0), // KC-CLUB-AENDERUNG (2.22.8): Meldungen im Posteingang
    ICH?.vorstand || ICH?.admin ? api("eingang_korb").then((k) => { BU_EIN.korb = k; }) : Promise.reject(0), // KC-CLUB-EINGANGSKORB (2.23.6)
    api("buero_start").then((b) => { BU.start = b; })]); // KC-CLUB-TEMPO (2.113.0): gleichzeitig statt danach – eine Wartezeit weniger
  buEingangUebernehmen(l, v, h, pr, ar);
}
function buEingangUebernehmen(l, v, h, pr, ar) {
  if (pr.status === "fulfilled") BU_EIN.protokolle = pr.value;
  if (ar.status === "fulfilled") { BU_EIN.archiv = ar.value; if (!AR.daten) AR.daten = ar.value; }
  if (l.status === "fulfilled") { BU_EIN.leihen = l.value; HL.leihen = l.value; }
  if (v.status === "fulfilled") { BU_EIN.vorschlaege = v.value.vorschlaege; VORSCHLAG_MAP = new Map(v.value.vorschlaege.map((x) => [x.id, x])); VORSCHLAG_TREFFEN = v.value.treffen; }
  if (h.status === "fulfilled") { BU_EIN.hilfe = h.value; HL.hilfe = h.value; }
  if (aktuelleAnsicht === "buero" && BU.sicht === "eingang") buZeigen();
}
// KC-CLUB-BUERO-EINGANGSLISTE (1.74.0, Wunsch Hansi): eine Liste statt Kacheln – jede Zeile antippen → Bearbeiten, zurück in
// den Eingang oder zum passenden Ordner. Nur, was die Clubleitung selbst erledigen kann (persönliche Ordner prüft der Besitzer).
function buEingangPosten() {
  const l = BU_EIN.leihen, v = BU_EIN.vorschlaege, h = BU_EIN.hilfe, pr = BU_EIN.protokolle, ar = BU_EIN.archiv, P = [];
  ekPosten(P); // KC-CLUB-EINGANGSKORB (2.23.6): Erstattungen + Dienstzeiten zuerst
  for (const d of einlKorbDoks(ar)) // 2.101.0 KC-CLUB-BUERO-EINLESEN: Eingelesenes, das „später erledigt“ werden soll
    P.push({ wer: ICH?.name, datum: d.am || d.datum, sym: arDateiSym(d.mime), gruppe: "Eingelesen – noch zu erledigen", titel: d.titel, unter: [d.name, d.datum ? tagKurz(d.datum) : ""].filter(Boolean).join(" · "), auf: `einlKorbOeffnen('${d.id}')`,
      ordner: ["🗄️", "Archiv", "arStart()"], schnell: [["🗄️ Ablegen / 💬 Senden", `einlKorbOeffnen('${d.id}')`, true], ["✔ Erledigt", `einlKorbErledigt('${d.id}')`]] });
  const leihWas = (a) => a.positionen.length === 1 ? `${a.positionen[0].anzahl} × ${a.positionen[0].name}` : a.positionen.map((x) => `${x.anzahl}× ${x.name}`).join(", ");
  for (const a of (l?.ausleihen || []).filter((x) => x.status === "angefragt"))
    P.push({ wer: a.eigen ? ICH?.name : a.wer, datum: a.abholung, sym: a.positionen[0]?.sym || "📦", gruppe: "Ausleihe – bitte entscheiden", titel: leihWas(a), unter: `${a.eigen ? "Du" : a.wer} · 📤 ${hlTagName(a.abholung)}`, auf: `HL.tab='leihen';leihInfo('${a.id}')`, ordner: ["🤝", "Helfen & Leihen", "hlStart()"] });
  for (const a of (l?.ausleihen || []).filter((x) => x.status === "genehmigt" && x.abholung <= heuteIso()))
    P.push({ wer: a.eigen ? ICH?.name : a.wer, datum: a.abholung, sym: "📤", gruppe: "Genehmigt – Abholung fällig", titel: leihWas(a), unter: `${a.eigen ? "Du" : a.wer} · ${hlTagName(a.abholung)}`, auf: `HL.tab='leihen';leihInfo('${a.id}')`, ordner: ["🤝", "Helfen & Leihen", "hlStart()"] });
  for (const x of (v || []).filter((y) => y.status === "offen"))
    P.push({ wer: x.von?.name, datum: x.erstellt_am, sym: x.art === "spende" ? "💝" : x.art === "abstimmung" ? "🗳️" : "💡", gruppe: x.art === "spende" ? "Spenden-Vorschlag" : "Offener Vorschlag", titel: x.art === "spende" ? (x.spenden?.[0]?.empfaenger || "Spende") : x.titel, unter: `von ${x.von?.name || "?"}`, auf: `vorschlagInfo('${x.id}')`, schnell: ICH?.vorstand || ICH?.admin ? [["🗄️ Ablegen …", `ekAblage('vorschlag','${x.id}')`]] : [], ordner: ["🗳️", "Vorschläge", "zeige('vorschlaege')"] });
  for (const a of (h?.aufrufe || []).filter((x) => x.offen && !hlVoll(x)))
    P.push({ wer: a.von?.name, datum: a.datum || a.erstellt_am, sym: "🙋", gruppe: "Hilfe-Aufruf – noch Helfer gesucht", titel: (h.arten?.[a.art] || a.art).replace(/^\S+\s/, ""), unter: `${hlWann(a).replace(/^\S+\s/, "")} · ✋ ${hlStand(a)}`, auf: `HL.tab='helfen';hilfeOeffnen('${a.id}')`, ordner: ["🤝", "Helfen & Leihen", "hlStart()"] });
  if (ar?.darf) for (const d of (ar.dokumente || []).filter((x) => x.status === "pruefung")) {
    const o = (ar.ordner || []).find((y) => y.id === d.ordner_id); if (!o || o.besitzer) continue;
    P.push({ wer: d.von, datum: d.datum, sym: "🗄️", gruppe: `Archiv: zur Prüfung · ${o.titel || "Ordner"}`, titel: d.titel, unter: `eingereicht von ${d.von || "?"}`, auf: `arAnlage('${d.id}', true)`,
      ordner: o.art === "chronik" ? ["📖", "Chronik", "arStartArt('chronik')"] : ["🗄️", "Archiv", "arStart()"],
      schnell: [["✔ In den Ordner legen (annehmen)", `buEinArchiv('${d.id}', true)`, true], ["✖ Ablehnen", `buEinArchiv('${d.id}', false)`]] });
  }
  // KC-CLUB-AENDERUNG (2.22.8, Wunsch Hansi): Änderungsmeldungen der Mitglieder (nur die an mich gerichteten; Admin alle)
  for (const x of (AE.eingang?.meldungen || []).filter((y) => y.wartetAufMich ?? y.status === "offen")) {
    const a = AE.eingang.arten.find((y) => y.id === x.art) || { sym: "✏️", t: x.art };
    P.push({ wer: x.name, datum: x.erstellt_am, sym: a.sym, gruppe: "Änderungsmeldung – bitte ansehen", titel: a.t, unter: `${x.name} · ${zeitKurz(x.erstellt_am)}${x.gilt_ab ? " · ab " + aeDatum(x.gilt_ab) : ""}`,
      auf: "aeEingang()", ordner: ["📇", "Mitglieder", "buListe()"],
      schnell: [...(x.kenntnisIch ? [] : [["👁️ Zur Kenntnis genommen", `aeKenntnis('${x.id}', null)`, !x.darfFreigeben]]), ...(x.darfFreigeben ? [["✅ Freigeben", `aeFreigeben('${x.id}', null)`, true]] : []), ["🗄️ Ablegen …", `ekAblage('aenderung','${x.id}')`]] }); // 2.22.19, 2.23.6
  }
  for (const p of (pr?.protokolle || []).filter((x) => x.status === "entwurf" && x.darfBearbeiten))
    P.push({ wer: prSchreiber(p), datum: p.datum, sym: "📄", gruppe: "Protokoll-Entwurf", titel: p.titel, unter: `${tagKurz(p.datum)} · ${prSchreiber(p) ? "von " + prSchreiber(p) : "Schriftführer noch offen"}`, auf: `protokollOeffnen('${p.id}')`, ordner: ["📄", "Protokolle", "zeige('protokolle')"] });
  for (const a of (pr?.aufgaben || []))
    P.push({ wer: a.name, datum: a.faellig, sym: "✔️", gruppe: "Offene Aufgabe", titel: a.text, unter: [a.name, faelligText(a.faellig).replace(/<[^>]+>/g, "").trim()].filter(Boolean).join(" · "), auf: "zeige('protokolle')", ordner: ["📄", "Protokolle", "zeige('protokolle')"],
      schnell: a.meine || ICH?.vorstand ? [["✔ Erledigt", `buEinAufgabe('${a.id}')`, true]] : [] });
  return P;
}
function buEingangHtml() {
  const geladen = BU_EIN.leihen || BU_EIN.vorschlaege || BU_EIN.hilfe, P = (BU_EIN.posten = buEingangPosten());
  const zeig = P.map((x, i) => [x, i]).filter(([x]) => ekfPasst(x)), aktiv = ["jahr", "monat", "art", "wer"].filter((k) => EKF[k]).length;
  return `<div class="ek-kopf"><b>📥 Eingang${P.length ? ` – ${P.length} ${P.length === 1 ? "Sache" : "Sachen"}` : ""}</b>${dvKnopf()}<button class="knopf klein pr-filter-knopf" onclick="ekfUmschalten()" title="Eingang filtern (Jahr, Monat, Art, Name)" aria-label="Eingang filtern" aria-expanded="${EKF.offen}">🔽${aktiv ? `<span class="anz">${aktiv}</span>` : ""}</button></div>
    ${EKF.offen ? ekfHtml(P, zeig.length) : ""}
    <div class="karte bu-gruss"><span class="hinweis">Antippen → bearbeiten, zurück in den Eingang oder zum Ordner. Es bleibt hier, bis es erledigt ist; mit 🗄️ Ablegen in einen oder mehrere Ordner legen (auch in den Ordner des Mitglieds).</span></div>
    ${!geladen ? '<div class="karte hinweis">Wird geladen …</div>' : !zeig.length && P.length ? '<div class="karte hinweis">Zu diesem Filter liegt nichts im Eingang – <button class="knopf klein" onclick="ekfLeeren()">↺ Alle zeigen</button></div>' : P.length ? `<div class="karte" style="padding:4px 12px">${zeig.map(([x, i]) => `<button class="bu-ein-zeile" onclick="buEinPosten(${i})"><span class="sym">${esc(x.sym)}</span>
      <span class="txt"><small>${esc(x.gruppe)}</small><b>${esc(x.titel)}</b><small>${esc(x.unter)}</small></span><span class="pfeil">›</span></button>`).join("")}</div>` : '<div class="karte hinweis">📭 Alles erledigt – im Eingang liegt nichts 👍</div>'}
    <div class="knoepfe"><button class="knopf" onclick="ersCsvOeffnen()">📊 Erstattungen für Excel (CSV)</button><button class="knopf" onclick="buEingangLaden()">↻ Neu laden</button><button class="knopf" onclick="buZurueck()">🗂️ Zurück ins Büro</button></div>`;
}
// ---------- 2.583.0 KC-CLUB-ERSTATTUNG-CSV (Wunsch Hansi „Erstattungen als CSV, damit der Kassierer sie in seine Excel-Tabelle übernehmen kann“) ----------
// Alles per Auswahl (kein Freitext): was (nur neue / alle im Zeitraum), Zeitraum, Status, Form (je Position / je Antrag). Die Datei rechnet der Server
// (deutsches Excel: Semikolon, Dezimalkomma, Umlaute). Danach: teilen (z. B. per Mail an sich selbst) oder speichern – und auf Wunsch als
// „übernommen“ markieren, damit „Nur neue“ beim nächsten Mal nichts doppelt liefert.
const ERS_CSV = { was: "neu", zeit: "alles", status: "alle", form: "position", erg: null };
function ersCsvZeitraum(z) {
  const h = heuteIso(), j = +h.slice(0, 4), m = +h.slice(5, 7), mm = (n) => String(n).padStart(2, "0"), ende = (jj, mo) => `${jj}-${mm(mo)}-${mm(new Date(Date.UTC(jj, mo, 0)).getUTCDate())}`;
  if (z === "monat") return { von: `${j}-${mm(m)}-01`, bis: ende(j, m) };
  if (z === "vormonat") { const jj = m === 1 ? j - 1 : j, mo = m === 1 ? 12 : m - 1; return { von: `${jj}-${mm(mo)}-01`, bis: ende(jj, mo) }; }
  if (z === "jahr") return { von: `${j}-01-01`, bis: `${j}-12-31` };
  if (z === "vorjahr") return { von: `${j - 1}-01-01`, bis: `${j - 1}-12-31` };
  return { von: "", bis: "" };
}
function ersCsvOeffnen() { ERS_CSV.erg = null; ersCsvZeichnen(); }
function ersCsvZeichnen() {
  const w = (feld, liste) => `<div class="ecsv-wahl">${liste.map(([id, t]) => `<button type="button" class="knopf klein${ERS_CSV[feld] === id ? " haupt" : ""}" data-f="${feld}" data-w="${id}">${t}</button>`).join("")}</div>`;
  const e = ERS_CSV.erg;
  blattAuf("ersCsvBlatt", `<h3 style="margin:0">📊 Erstattungen für Excel</h3>
    <p class="hinweis" style="margin:4px 0 10px">Erstellt eine CSV-Datei, die Excel direkt öffnet (Spalten, Beträge und Umlaute passen). Abgelehnte Anträge kommen nicht mit.</p>
    <h4 class="cf-h">Welche Anträge?</h4>${w("was", [["neu", "🆕 Nur neue (noch nicht übernommen)"], ["alle", "📋 Alle im Zeitraum"]])}
    <h4 class="cf-h">Zeitraum (eingereicht)</h4>${w("zeit", [["alles", "Alle"], ["monat", "Dieser Monat"], ["vormonat", "Letzter Monat"], ["jahr", "Dieses Jahr"], ["vorjahr", "Letztes Jahr"]])}
    <h4 class="cf-h">Status</h4>${w("status", [["alle", "Offen + erstattet"], ["erstattet", "Nur erstattet"], ["eingereicht", "Nur offen"]])}
    <h4 class="cf-h">Aufbau</h4>${w("form", [["position", "Je Position (ausführlich)"], ["antrag", "Je Antrag (eine Zeile)"]])}
    ${e ? `<div class="karte" style="margin-top:12px">${e.anzahl ? `<b>${e.anzahl} ${e.anzahl === 1 ? "Antrag" : "Anträge"}</b> · ${e.positionen} Positionen · Summe ${esc(e.summe.toFixed(2).replace(".", ","))} €${e.schonUebernommen ? `<br><small class="hinweis">Davon ${e.schonUebernommen} schon früher übernommen.</small>` : ""}
      <div class="knoepfe" style="margin-top:8px"><button type="button" class="knopf haupt" data-k="teilen">📤 Teilen (z. B. per Mail)</button><button type="button" class="knopf" data-k="speichern">⬇️ Speichern</button></div>`
      : "📭 Keine Anträge zu dieser Auswahl."}</div>` : ""}
    <div class="knoepfe" style="margin-top:12px"><button type="button" class="knopf${e ? "" : " haupt"}" data-k="erstellen">📊 CSV erstellen</button><button type="button" class="knopf" onclick="$('ersCsvBlatt').remove()">Schließen</button></div>`);
  const f = $("ersCsvBlatt");
  f.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => { ERS_CSV[b.dataset.f] = b.dataset.w; ERS_CSV.erg = null; ersCsvZeichnen(); }));
  f.querySelector('[data-k="erstellen"]').onclick = ersCsvErstellen;
  f.querySelector('[data-k="teilen"]')?.addEventListener("click", () => ersCsvAusgeben(true));
  f.querySelector('[data-k="speichern"]')?.addEventListener("click", () => ersCsvAusgeben(false));
}
async function ersCsvErstellen() {
  const { von, bis } = ersCsvZeitraum(ERS_CSV.zeit);
  try { ERS_CSV.erg = await api("erstattung_export", { nurNeu: ERS_CSV.was === "neu", von, bis, status: ERS_CSV.status, form: ERS_CSV.form }, { warten: true }); ersCsvZeichnen(); }
  catch (e) { meldeFehler(e); }
}
async function ersCsvAusgeben(teilen) {
  const e = ERS_CSV.erg; if (!e?.csv) return;
  const datei = new File([e.csv], `Erstattungen_${heuteIso()}.csv`, { type: "text/csv" });
  let ok = false;
  if (teilen) { try { if (navigator.canShare?.({ files: [datei] })) { await navigator.share({ files: [datei], title: "Erstattungen (CSV)" }); ok = true; } } catch (x) { if (x?.name === "AbortError") return; } }
  if (!ok) { const url = URL.createObjectURL(datei), a = document.createElement("a"); a.href = url; a.download = datei.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); melde("💾 CSV gespeichert – in Excel öffnen"); }
  const neu = e.anzahl - (e.schonUebernommen || 0);
  if (neu > 0 && (await frage(`${neu} ${neu === 1 ? "Antrag" : "Anträge"} als „in Excel übernommen“ markieren?\n\nDann kommen sie bei „Nur neue“ nicht noch einmal.`))) {
    try { const r = await api("erstattung_export_markieren", { ids: e.ids }, { warten: true }); melde(`✅ ${r.markiert} als übernommen markiert`); ERS_CSV.erg = null; ersCsvZeichnen(); } catch (x) { meldeFehler(x); }
  }
}
const EKF_ART = { Genehmigt: "Ausleihe", "Spenden-Vorschlag": "Vorschlag", "Offener Vorschlag": "Vorschlag", "Protokoll-Entwurf": "Protokoll", "Offene Aufgabe": "Aufgabe", Archiv: "Archiv-Prüfung" };
const ekfArt = (x) => { const g = String(x.gruppe || "").split(/ – |: | · /)[0]; return EKF_ART[g] || g; };
const ekfTag = (x) => (/^\d{4}-\d{2}/.test(String(x.datum || "")) ? isoBerlin(new Date(String(x.datum).length > 10 ? x.datum : x.datum + "T12:00:00Z")) : "");
const ekfPasst = (x) => { const t = ekfTag(x); return (!EKF.jahr || t.slice(0, 4) === EKF.jahr) && (!EKF.monat || t.slice(5, 7) === EKF.monat) && (!EKF.art || ekfArt(x) === EKF.art) && (!EKF.wer || x.wer === EKF.wer); };
const EKF_MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
function ekfHtml(P, treffer) {
  const wahl = (k, alle, werte, name = (w) => w) => `<select onchange="ekfSetzen('${k}', this.value)"><option value="">${alle}</option>${werte.map((w) => `<option value="${esc(w)}"${w === EKF[k] ? " selected" : ""}>${esc(name(w))}</option>`).join("")}</select>`;
  const uniq = (l) => [...new Set(l.filter(Boolean))];
  return `<div class="karte pr-filter ek-filter"><button type="button" class="pr-filter-zu" onclick="ekfUmschalten(false)" aria-label="Filter schließen" title="Filter schließen">✕</button>
    <div class="pr-filter-raster">
      <label class="feld">📅 Jahr${wahl("jahr", "Alle Jahre", uniq(P.map((x) => ekfTag(x).slice(0, 4))).sort().reverse())}</label>
      <label class="feld">🗓️ Monat${wahl("monat", "Alle Monate", uniq(P.map((x) => ekfTag(x).slice(5, 7))).sort(), (m) => EKF_MONATE[Number(m) - 1])}</label>
      <label class="feld">🏷️ Art${wahl("art", "Alle Arten", uniq(P.map(ekfArt)).sort((a, b) => a.localeCompare(b, "de")))}</label>
      <label class="feld">👤 Name${wahl("wer", "Alle Namen", uniq(P.map((x) => x.wer)).sort((a, b) => a.localeCompare(b, "de")))}</label>
    </div>
    <div class="pr-filter-fuss"><span class="hinweis">${treffer} von ${P.length} ${P.length === 1 ? "Sache" : "Sachen"}</span><button class="knopf klein" onclick="ekfLeeren()">↺ Alle zeigen</button></div></div>`;
}
function ekfUmschalten(an) { EKF.offen = an ?? !EKF.offen; buZeigen(); }
function ekfSetzen(k, v) { EKF[k] = String(v || ""); buZeigen(); }
function ekfLeeren() { Object.assign(EKF, { jahr: "", monat: "", art: "", wer: "" }); buZeigen(); }

// ---------- KC-CLUB-DIENST-UEBERSICHT (2.23.39, Wunsch Hansi): alle Dienstzeiten quer – vorne Name, oben die Tage, Zeitbalken, Stunden ----------
// Jedes Tagesfeld zeigt 8–24 Uhr: hellgrün = Kann, dunkelgrün = Wunsch, gelb = Wenn nötig, rot gestreift = Sperre. „Gesamt“ = Stunden Kann
// (Kann ∪ Wunsch ∪ Wenn nötig, ohne Doppelzählung). Unten: Stunden und Personen je Tag. Drucken: A4 quer über den zentralen Druck-Kern.
// 🗄️ Ablegen: jede Aufstellung in den Ordner des Mitglieds (Register „Dienstpläne“) und ins Büro „Dienstpläne <Jahr>“ (Wünsche) + Gesamtplan als Bild.
const DV = { daten: null, sort: "name" };
const DV_TYP = { available: "kann", preferred: "wunsch", if_needed: "noetig", unavailable: "sperre" };
const dvTage = (P) => { const alle = P.flatMap((x) => x.eintraege.map((e) => e.d)).sort(); if (!alle.length) return [];
  const t = [], ende = new Date(alle[alle.length - 1] + "T12:00:00Z"); for (let d = new Date(alle[0] + "T12:00:00Z"); d <= ende && t.length < 62; d.setUTCDate(d.getUTCDate() + 1)) t.push(d.toISOString().slice(0, 10)); return t; };
const dvStunden = (eintr) => { const h = new Set(); for (const e of eintr) if (e.t !== "unavailable") for (let i = Math.max(0, e.s); i < Math.min(24, e.e); i++) h.add(e.d + ":" + i); return h.size; };
function dvGanttHtml() {
  const P = [...(DV.daten?.personen || [])].filter((x) => x.eintraege.length);
  const std = new Map(P.map((x) => [x.id, dvStunden(x.eintraege)]));
  P.sort((a, b) => (DV.sort === "stunden" ? std.get(b.id) - std.get(a.id) : 0) || a.name.localeCompare(b.name, "de"));
  const tage = dvTage(P), WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], x = (h) => ((Math.max(8, Math.min(24, h)) - 8) / 16) * 100;
  if (!tage.length) return '<p class="hinweis">Noch keine Dienstzeiten eingegangen.</p>';
  const we = (t) => [0, 6].includes(new Date(t + "T12:00:00Z").getUTCDay());
  let h = `<div class="dv-gantt" style="grid-template-columns:minmax(120px,170px) repeat(${tage.length},minmax(calc(46px * var(--dvz, 1)),1fr)) 70px"><div class="dv-h dv-name">Name</div>`; // 2.570.0 --dvz = Zoom (nur am Bildschirm)
  h += tage.map((t) => `<div class="dv-h${we(t) ? " dv-we" : ""}">${t.slice(8)}.${t.slice(5, 7)}.<small>${WT[new Date(t + "T12:00:00Z").getUTCDay()]}</small></div>`).join("") + `<div class="dv-h">Gesamt</div>`;
  for (const p of P) {
    h += `<div class="dv-name">${esc(p.name)}</div>`;
    for (const t of tage) {
      const e = p.eintraege.filter((y) => y.d === t), kann = e.filter((y) => y.t === "available").map((y) => `${y.s}–${y.e}`);
      const bal = ["unavailable", "available", "if_needed", "preferred"].flatMap((typ) => e.filter((y) => y.t === typ).map((y) => `<i class="dv-bal ${DV_TYP[typ]}" style="left:${x(y.s)}%;width:${Math.max(2, x(y.e) - x(y.s))}%"></i>`)).join("");
      const titel = e.map((y) => `${{ available: "Kann", preferred: "Wunsch", if_needed: "Wenn nötig", unavailable: "Sperre" }[y.t]} ${y.s}–${y.e} Uhr`).join(", ");
      h += `<div class="dv-zelle${we(t) ? " dv-we" : ""}"${titel ? ` title="${esc(titel)}" onclick="melde(${jsArg(`${p.name.split(" ")[0]} ${t.slice(8)}.${t.slice(5, 7)}.: ${titel}`)})"` : ""}>${bal}${kann.length ? `<small>${kann.join(" ")}</small>` : ""}</div>`;
    }
    const wunsch = dvStunden(p.eintraege.filter((y) => y.t === "preferred"));
    h += `<div class="dv-ges">${std.get(p.id)} Std${wunsch ? `<small>Wunsch ${wunsch}</small>` : ""}</div>`;
  }
  h += `<div class="dv-summe dv-name">Summe je Tag</div>`;
  for (const t of tage) { const am = P.filter((p) => p.eintraege.some((y) => y.d === t && y.t !== "unavailable"));
    h += `<div class="dv-summe${am.length <= 2 ? " dv-duenn" : ""}">${am.reduce((s, p) => s + dvStunden(p.eintraege.filter((y) => y.d === t)), 0)} Std<small>${am.length} Pers.</small></div>`; }
  h += `<div class="dv-summe">${[...std.values()].reduce((a, b) => a + b, 0)} Std</div></div>`;
  return h;
}
const dvLegende = () => `<div class="dv-leg"><span><i class="dv-bal kann"></i>Kann</span><span><i class="dv-bal wunsch"></i>Wunsch</span><span><i class="dv-bal noetig"></i>Wenn nötig</span><span><i class="dv-bal sperre"></i>Sperre</span><span class="hinweis">Tagesfeld = 8 bis 24 Uhr · Gesamt = Stunden „Kann“</span></div>`;
// KC-CLUB-DW-FEHLT (2.222.0, Wunsch Hansi): wer hat noch keine Dienstwünsche abgegeben + freundlich erinnern (geplant wird in DP2)
function dvFehltHtml() {
  const F = DV.daten?.fehlen; if (!Array.isArray(F)) return "";
  if (!F.length) return `<div class="karte innen dv-fehlt ok">✅ Alle Mitglieder haben ihre Dienstwünsche abgegeben.</div>`;
  const offen = F.filter((f) => !f.erinnert || Date.now() - Date.parse(f.erinnert) > 24 * 3600000).length;
  return `<div class="karte innen dv-fehlt"><b>⏳ Noch nicht abgegeben: ${F.length}</b>
    <div class="dv-fehlt-namen">${F.map((f) => `<span>${esc(f.name)}${f.erinnert ? ` <small title="zuletzt erinnert">🔔 ${esc(zeitKurz(f.erinnert))}</small>` : ""}</span>`).join("")}</div>
    ${offen ? `<button class="knopf haupt" onclick="dvErinnern(this)">🔔 ${offen === F.length ? "Alle" : offen} freundlich erinnern</button>` : `<small class="hinweis">Alle wurden in den letzten 24 Stunden erinnert.</small>`}</div>`;
}
async function dvErinnern(knopf) {
  if (!(await frage("🔔 Freundlich erinnern?\n\nAlle, die noch keine Dienstwünsche abgegeben haben, bekommen eine kurze Nachricht (Push und E-Mail) mit dem Link zum Eintragen. Du bekommst eine Kopie.", { ja: "🔔 Erinnern", nein: "Abbrechen" }))) return;
  await einmal(knopf, async () => { try { const r = await api("dw_erinnern", {}, { warten: true }); melde(r.erinnert ? `🔔 ${r.erinnert} erinnert` : r.hinweis || "Niemand zu erinnern"); DV.daten = await api("dienst_uebersicht", {}, { warten: true }); dvZeichnen(); } catch (e) { meldeFehler(e); } });
}
function dvZeichnen() {
  const z = $("dvInhalt"); if (!z) return;
  const P = DV.daten?.personen || [];
  z.innerHTML = dvFehltHtml() + (DV.daten?.nurFreigegeben ? `<div class="karte innen dv-fehlt">👁️ Du siehst deine eigenen Zeiten und die der Mitglieder, die ihre Zeiten freigegeben haben – nicht alle. Freigeben: „Dienstpläne“ → „Meine Dienstzeiten für andere sichtbar“.</div>` : "") + `<p class="hinweis" style="margin:0">${esc(DV.daten?.veranstaltung || "")} · ${P.filter((x) => x.eintraege.length).length} Personen · Stand ${esc(zeitKurz(new Date().toISOString()))}</p>
    ${dvLegende()}
    <div class="dv-leiste"><button class="knopf klein${DV.sort === "name" ? " haupt" : ""}" onclick="DV.sort='name';dvZeichnen()">🔤 Name</button><button class="knopf klein${DV.sort === "stunden" ? " haupt" : ""}" onclick="DV.sort='stunden';dvZeichnen()">⏱️ Stunden</button>
      <button class="knopf klein" onclick="dvDrucken()">🖨️ Drucken (A4 quer)</button>${DV.daten?.nurFreigegeben ? "" : '<button class="knopf klein" onclick="dvAblegen()">🗄️ In Ordner ablegen</button>'}</div>
    <div class="dv-leiste dv-zoomleiste"><button class="knopf klein" onclick="dvZoom(dvZoomJetzt() / 1.25, true)" aria-label="Kleiner">🔍−</button><button class="knopf klein" id="dvZoomWert" onclick="dvZoom(1, true)" title="Zurück auf 100 %">100 %</button><button class="knopf klein" onclick="dvZoom(dvZoomJetzt() * 1.25, true)" aria-label="Größer">🔍+</button></div>
    <div class="dv-rahmen" data-pinch>${dvGanttHtml()}</div>
    <p class="hinweis" style="margin:0">Feld antippen = genaue Uhrzeiten. Größer/kleiner: mit zwei Fingern ziehen oder 🔍+ / 🔍−. Auf dem Handy am besten quer halten – sonst seitlich wischen.</p>`;
  dvZoomEinrichten();
}
// 2.570.0 KC-CLUB-DV-ZOOM (Wunsch Hansi „Zoom in der Grafik Dienstzeiten – alles recht klein, evtl. mit 2 Fingern größer ziehen“): nur die Grafik
// wird größer (Tage breiter, Zeilen höher, Schrift größer über --dvz – kein CSS-zoom, sonst klebt die Namen-Spalte nicht mehr links), die Stelle
// zwischen den Fingern bleibt unter den Fingern; die Größe merkt sich das Gerät.
// data-pinch nimmt die Grafik aus dem Schrift-Zoom der ganzen App heraus (szEigeneGeste).
const DV_ZOOM = { min: 0.6, max: 3, key: "kc_club_dv_zoom", t: null };
const dvZoomJetzt = () => parseFloat(document.querySelector("#dvInhalt .dv-gantt")?.style.getPropertyValue("--dvz")) || 1;
function dvZoom(w, merken, fx, fy) {
  const r = document.querySelector("#dvInhalt .dv-rahmen"), g = r?.querySelector(".dv-gantt"); if (!g) return;
  const alt = dvZoomJetzt(), neu = Math.round(Math.min(DV_ZOOM.max, Math.max(DV_ZOOM.min, w)) * 100) / 100, hoch = r.closest(".blatt-innen");
  const rb = r.getBoundingClientRect(), px = (fx ?? rb.left + rb.width / 2) - rb.left, py = (fy ?? rb.top + Math.min(rb.height, innerHeight) / 2) - rb.top;
  const bx = (r.scrollLeft + px) / r.scrollWidth, hAlt = g.offsetHeight; // Stelle in der Grafik, die stehen bleiben soll
  g.style.setProperty("--dvz", String(neu));
  r.scrollLeft = bx * r.scrollWidth - px; if (hoch && hAlt) hoch.scrollTop += py * (g.offsetHeight / hAlt - 1);
  const z = $("dvZoomWert"); if (z) z.textContent = `${Math.round(neu * 100)} %`;
  if (merken) try { localStorage.setItem(DV_ZOOM.key, String(neu)); } catch {}
}
function dvZoomEinrichten() {
  const r = document.querySelector("#dvInhalt .dv-rahmen"); if (!r) return;
  let w = 1; try { const v = parseFloat(localStorage.getItem(DV_ZOOM.key)); if (v >= DV_ZOOM.min && v <= DV_ZOOM.max) w = v; } catch {}
  dvZoom(w, false);
  const abst = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY), mitte = (t) => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
  r.addEventListener("touchstart", (e) => { DV_ZOOM.t = e.touches.length === 2 ? { a: abst(e.touches), w: dvZoomJetzt() } : null; }, { passive: true });
  r.addEventListener("touchmove", (e) => {
    if (!DV_ZOOM.t || e.touches.length !== 2) return;
    if (e.cancelable) e.preventDefault();
    const [mx, my] = mitte(e.touches); dvZoom(DV_ZOOM.t.w * abst(e.touches) / DV_ZOOM.t.a, false, mx, my);
  }, { passive: false });
  r.addEventListener("touchend", (e) => { if (DV_ZOOM.t && e.touches.length < 2) { DV_ZOOM.t = null; dvZoom(dvZoomJetzt(), true); } }, { passive: true });
  ["gesturestart", "gesturechange"].forEach((t) => r.addEventListener(t, (e) => e.preventDefault(), { passive: false })); // iPhone/iPad: kein Seiten-Zoom
}
async function dvStart() {
  const f = blattAuf("dvBlatt", `<div class="dv-kopf"><h3>📊 Dienstzeiten-Übersicht</h3><button type="button" class="pr-filter-zu" aria-label="Übersicht schließen" title="Schließen" onclick="$('dvBlatt').remove()">✕</button></div><div id="dvInhalt"><p class="hinweis">Wird geladen …</p></div>`);
  f.classList.add("dv-blatt");
  if ($("dwFenster")) f.style.zIndex = "2100"; // aus den Dienstwünschen geöffnet: über deren Vollbild-Fenster
  try { DV.daten = await api("dienst_uebersicht", {}, { warten: true }); } catch (e) { f.remove(); return meldeFehler(e); }
  dvZeichnen();
}
function druckDienstUebersicht() {
  if (!DV.daten) return null;
  return { titel: `Dienstzeiten-Übersicht ${DV.daten.veranstaltung}`, unter: "Kann · Wunsch · Wenn nötig · Sperre – je Tag 8 bis 24 Uhr", quer: true, html: dvLegende() + dvGanttHtml() };
}
async function dvDrucken() {
  DRUCK = { art: "dienstuebersicht" };
  try { if (!(await druckSeiteBauen())) return; } catch (e) { return meldeFehler(e); }
  druckJetzt();
}
async function dvAblegen() {
  if (!(await frage("Alle Dienstzeiten ablegen?\n\n• jede Aufstellung in den Ordner des Mitglieds (Register „Dienstpläne“)\n• ins Büro „Dienstpläne“ (Register „Wünsche“)\n• dazu diese Übersicht als Gesamtplan (Bild)\n\nSchon Abgelegtes wird nicht doppelt abgelegt.", { ja: "🗄️ Ablegen", nein: "Abbrechen" }))) return;
  let r; try { r = await api("dienst_ablegen", {}, { warten: true }); } catch (e) { return meldeFehler(e); }
  let bild = false;
  try { // Gesamtplan als Bild (html2canvas liegt lokal in lib/)
    await bfBibliothek();
    const el = document.querySelector("#dvInhalt .dv-gantt");
    const c = await window.html2canvas(el, { scale: 2, backgroundColor: "#ffffff", logging: false, width: el.scrollWidth, height: el.scrollHeight, windowWidth: el.scrollWidth + 40, onclone: bfKlonGlaetten });
    const daten = c.toDataURL("image/png").split(",")[1], heute = isoBerlin(new Date());
    await api("archiv_hochladen", { ordner_id: r.ordner_id, register: r.register, titel: `Gesamtplan Dienstzeiten ${DV.daten.veranstaltung} (Stand ${zeitKurz(new Date().toISOString())})`, datum: heute,
      stichworte: `Dienstplan, Gesamtplan, ${DV.daten.veranstaltung}`, name: `Dienstzeiten-Gesamtplan-${heute}.png`, mime: "image/png", daten }, { warten: true });
    bild = true;
  } catch (e) { console.warn("Gesamtplan-Bild", e); }
  melde(`🗄️ Abgelegt: ${r.neu} neu${r.vorhanden ? `, ${r.vorhanden} schon da` : ""}${bild ? " + Gesamtplan" : " – Gesamtplan-Bild ging nicht"}${r.fehler ? ` · ⚠️ ${r.fehler} ging nicht` : ""}`, !!r.fehler || !bild);
}
function buEinPosten(i) {
  const x = BU_EIN.posten[i]; if (!x) return;
  const f = blattAuf("buEinBlatt", `${einwHtml("b-bu-eingang")}<div style="display:flex;gap:10px;align-items:center"><span style="font-size:2rem">${esc(x.sym)}</span><div><small class="hinweis">${esc(x.gruppe)}</small><h3 style="margin:2px 0">${esc(x.titel)}</h3><small class="hinweis">${esc(x.unter)}</small></div></div>
    <div style="display:grid;gap:8px;margin-top:14px">
      <button class="knopf haupt" data-fn="${esc(x.auf)}">✏️ Öffnen &amp; bearbeiten</button>
      ${(x.schnell || []).map(([t, fn, haupt]) => `<button class="knopf${haupt ? " gruen" : ""}" data-fn="${esc(fn)}">${esc(t)}</button>`).join("")}
      <button class="knopf" data-fn="${esc(x.ordner[2])}">${x.ordner[0]} Zum Ordner „${esc(x.ordner[1])}“</button>
      <button class="knopf" data-zu="1">📥 Zurück in den Eingang</button></div>`);
  f.querySelectorAll("[data-fn]").forEach((b) => (b.onclick = () => { f.remove(); new Function(b.dataset.fn)(); }));
  f.querySelector("[data-zu]").onclick = () => f.remove();
}
// ---------- KC-CLUB-EINGANGSKORB (2.23.6, Wunsch Hansi): Erstattungen + Dienstzeiten im Eingang, Ablage in mehrere Ordner ----------
// Alle drei der Clubleitung (Clubsprecher, Kassenwart, Admin) sehen alles und dürfen alles. Es bleibt im Eingang, bis es erledigt ist:
// Erstattung bis „✅ Erstattet“ oder „✖ Ablehnen“, Dienstzeiten bis „👁️ Zur Kenntnis“ (geändert → wieder im Eingang).
// „🗄️ Ablegen …“: Ordner per Häkchen wählen (mehrere) – Club-Ordner, Ordner des Mitglieds, mein Ordner. Die App merkt sich die Wahl je Art.
const ekErst = (id) => (BU_EIN.korb?.erstattungen || []).find((x) => x.id === id);
function ekPosten(P) {
  const k = BU_EIN.korb; if (!k) return;
  for (const x of k.erstattungen || [])
    P.push({ wer: x.name, datum: x.erstellt_am, sym: "💶", gruppe: "Erstattung – bitte bearbeiten", titel: `${x.name}: ${euro(x.summe)}`,
      unter: `${zeitKurz(x.erstellt_am)} · ${x.positionen.length} Position${x.positionen.length === 1 ? "" : "en"} · ${x.auszahlung === "bar" ? "bar" : "Überweisung"}${x.kenntnis.length ? " · 👁️ " + x.kenntnis.join(", ") : ""}`,
      auf: `ekErstInfo('${x.id}')`, ordner: ["🗄️", "Archiv", "arStart()"],
      schnell: [...(x.kenntnisIch ? [] : [["👁️ Zur Kenntnis genommen", `ekKenntnis('erstattung','${x.id}')`]]), ["✅ Erstattet", `ekErstattet('${x.id}')`, true],
        ["✖ Ablehnen", `ekErstAblehnen('${x.id}')`], ["🗄️ Ablegen …", `ekAblage('erstattung','${x.id}')`]] });
  // KC-CLUB-ERSTATTUNG-SONDER (2.419.0): offene Kautionen und abzugebende Papierbelege – auch nach der Erstattung
  for (const x of k.nachverfolgen || [])
    P.push({ wer: x.name, datum: x.erstellt_am, sym: "🔎", gruppe: "Erstattung – nachverfolgen", titel: `${x.name}: ${x.offen.map((y) => y.kaution ? "🔐 Kaution " + euro(y.betrag) : "🧾 Beleg").join(" · ")}`,
      unter: `${zeitKurz(x.erstellt_am)} · Antrag ${x.status === "erstattet" ? "erstattet" : "eingereicht"}`, auf: `ekNachInfo('${x.id}')`, ordner: ["🗄️", "Archiv", "arStart()"],
      schnell: [["🔎 Öffnen", `ekNachInfo('${x.id}')`, true]] });
  for (const x of k.dienstwuensche || [])
    P.push({ wer: x.name, datum: x.zuletzt, sym: "📅", gruppe: x.geaendert ? "Dienstzeiten – geändert" : "Dienstzeiten – neu", titel: x.name,
      unter: `${x.tage} Tag${x.tage === 1 ? "" : "e"} · zuletzt ${zeitKurz(x.zuletzt)}${x.uebernommen ? " · im Dienstplan übernommen" : ""}${x.kenntnis.length ? " · 👁️ " + x.kenntnis.join(", ") : ""}`,
      auf: `ekDienstInfo('${x.id}')`, ordner: ["📅", "Dienste", "zeige('dienste')"],
      schnell: [["👁️ Zur Kenntnis genommen", `ekKenntnis('dienstwunsch','${x.id}')`, true], ["🗄️ Ablegen …", `ekAblage('dienstwunsch','${x.id}')`]] });
}
async function ekNach(text) { if (text) melde(text); await buEingangLaden().catch(() => {}); }
async function ekKenntnis(art, id) {
  try { await api("eingang_kenntnis", { art, id }); await ekNach("👁️ Zur Kenntnis genommen"); } catch (e) { return meldeFehler(e); }
  if (art === "dienstwunsch") ekAblage(art, id, "Erledigt – wo soll es abgelegt werden?");
}
function ekErstInfo(id) {
  const x = ekErst(id); if (!x) return melde("Nicht mehr im Eingang – schon bearbeitet?");
  const f = blattAuf("ekErstBlatt", `<h3 style="margin-top:0">💶 Erstattung ${esc(x.name)}</h3>${einwHtml("b-ek-erstattung")}
    <p class="hinweis">Eingereicht ${esc(zeitKurz(x.erstellt_am))} · Auszahlung gewünscht: <b>${x.auszahlung === "bar" ? "bar" : "per Überweisung"}</b></p>
    <div class="karte" style="padding:6px 12px">${x.positionen.map((y) => `<div class="zeile" style="display:flex;justify-content:space-between;gap:8px"><span>${esc(aeDatum(y.datum))} · ${esc(y.text)}</span><b>${euro(y.betrag)}</b></div>`).join("")}
      <div class="zeile" style="display:flex;justify-content:space-between;border-top:1px solid var(--linie);margin-top:4px;padding-top:4px"><b>Summe</b><b>${euro(x.summe)}</b></div>
      ${x.vorschuss ? `<div class="zeile" style="display:flex;justify-content:space-between"><span>abzüglich Vorschuss → ${x.summe - x.vorschuss >= 0 ? "Auszahlung" : "Rückzahlung an den Club"}</span><b>${euro(Math.abs(x.summe - x.vorschuss))}</b></div>` : ""}
      ${x.positionen.some((y) => y.kaution) ? '<p class="hinweis" style="margin:4px 0 0">🔐 Kautionen zählen nicht zur Summe – sie bleiben unter „Nachverfolgen“, bis sie zurück sind.</p>' : ""}${x.positionen.some((y) => y.beleg === "papier") ? '<p class="hinweis" style="margin:4px 0 0">🧾 Papierbelege werden abgegeben – „Beleg erhalten“ unter „Nachverfolgen“.</p>' : ""}</div>
    ${x.bemerkung ? `<p>💬 ${esc(x.bemerkung)}</p>` : ""}${x.kenntnis.length ? `<p class="hinweis">👁️ Gesehen: ${esc(x.kenntnis.join(", "))}</p>` : ""}
    <p class="hinweis">Belege und Aufstellung kamen zusätzlich per Mail.</p>
    <div style="display:grid;gap:8px">${x.kenntnisIch ? "" : `<button class="knopf" data-fn="ekKenntnis('erstattung','${x.id}')">👁️ Zur Kenntnis genommen</button>`}
      <button class="knopf" data-fn="ekErstBlatt('${x.id}')">📄 Antrag als PDF / Drucken</button>
      <button class="knopf haupt" data-fn="ekErstattet('${x.id}')">✅ Erstattet</button><button class="knopf" data-fn="ekErstAblehnen('${x.id}')">✖ Ablehnen</button>
      <button class="knopf" data-fn="ekAblage('erstattung','${x.id}')">🗄️ Ablegen …</button><button class="knopf" data-fn="">Schließen</button></div>`);
  f.querySelectorAll("[data-fn]").forEach((b) => (b.onclick = () => { f.remove(); if (b.dataset.fn) new Function(b.dataset.fn)(); }));
}
function ekErstBlatt(id) { const x = ekErst(id); if (x) erstAnsehen(erstDaten({ ...x, status: "eingereicht – in Bearbeitung" })); } // 2.526.0
function ekErstattet(id) {
  const x = ekErst(id); if (!x) return;
  const bar = x.auszahlung === "bar", vor = esc(x.name.split(" ")[0]);
  const f = blattAuf("ekErstBlatt", `<h3 style="margin-top:0">✅ Erstattung ${esc(x.name)}: ${euro(x.summe)}</h3>
    <p class="hinweis">Gewünscht: ${bar ? "bar" : "per Überweisung"} · ${vor} bekommt Bescheid (Push + Mail).</p>
    <label class="feld">Kurze Nachricht an ${vor} (freiwillig)<input id="ekAntw" maxlength="500" placeholder="z. B. Danke fürs Fahren!"></label>
    <div style="display:grid;gap:8px">${(bar ? ["bar", "ueberweisung"] : ["ueberweisung", "bar"]).map((w, i) => `<button class="knopf${i ? "" : " haupt"}" data-w="${w}">${w === "bar" ? "💵 Bar ausgezahlt" : "🏦 Wird überwiesen"}</button>`).join("")}
      <button class="knopf" data-w="">Abbrechen</button></div>`);
  f.querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { const w = b.dataset.w, antwort = f.querySelector("#ekAntw").value; f.remove(); if (w) ekErledigen(id, "erstattet", w, antwort); }));
}
async function ekErstAblehnen(id) {
  const x = ekErst(id); if (!x) return;
  const grund = await eingabe(`Erstattung von ${x.name.split(" ")[0]} ablehnen – warum? (${x.name.split(" ")[0]} bekommt den Grund)`, "", { mehrzeilig: true });
  if (!grund || !grund.trim()) return;
  ekErledigen(id, "abgelehnt", null, grund);
}
function ekNachInfo(id) {
  const x = (BU_EIN.korb?.nachverfolgen || []).find((y) => y.id === id); if (!x) return melde("Nichts mehr offen – schon erledigt?");
  const knopf = (t, fn, haupt) => `<button class="knopf${haupt ? " haupt" : ""}" data-fn="${fn}">${t}</button>`;
  const f = blattAuf("ekNachBlatt", `<h3 style="margin-top:0">🔎 Nachverfolgen – ${esc(x.name)}</h3><p class="hinweis">Antrag vom ${esc(zeitKurz(x.erstellt_am))} · ${x.status === "erstattet" ? "bereits erstattet" : "noch eingereicht"}</p>
    ${x.offen.map((y) => `<div class="karte" style="padding:8px 12px"><div>${esc(aeDatum(y.datum))} · ${esc(y.text)} · <b>${euro(y.betrag)}</b></div><div style="display:grid;gap:6px;margin-top:6px">
      ${y.beleg ? knopf("🧾 Beleg erhalten", `ekPosSetzen('${x.id}',${y.i},{beleg:'erhalten'})`, true) : ""}
      ${y.kaution ? (y.bezahlt_aus === "vorschuss" ? knopf("🏦 Kaution beim Club eingegangen", `ekPosSetzen('${x.id}',${y.i},{kaution:'beim_club'})`, true) : knopf("↩️ Kaution an Mitglied zurück", `ekPosSetzen('${x.id}',${y.i},{kaution:'zurueck_mitglied'})`, true))
        + knopf(y.bezahlt_aus === "vorschuss" ? "✖ Kaution verfallen" : "✖ Kaution verfallen – wird erstattet", `ekPosSetzen('${x.id}',${y.i},{kaution:'verfallen'})`) : ""}</div></div>`).join("")}
    <div style="display:grid;gap:8px">${knopf("Schließen", "")}</div>`);
  f.querySelectorAll("[data-fn]").forEach((b) => (b.onclick = () => { f.remove(); if (b.dataset.fn) new Function(b.dataset.fn)(); }));
}
async function ekPosSetzen(id, index, was) {
  if (was.kaution === "verfallen" && !(await frage("Kaution als verfallen markieren?\n\nAus eigenem Geld bezahlt: der Betrag wird dem Mitglied zusätzlich erstattet."))) return;
  try { await api("erstattung_position_setzen", { id, index, ...was }); } catch (e) { return meldeFehler(e); }
  await ekNach(was.beleg ? "🧾 Beleg als erhalten vermerkt" : was.kaution === "verfallen" ? "🔐 Kaution verfallen – Mitglied hat Bescheid bekommen" : "🔐 Kaution erledigt");
}
async function ekErledigen(id, status, ausgezahlt, antwort) {
  try { await api("erstattung_erledigen", { id, status, ausgezahlt, antwort }); } catch (e) { return meldeFehler(e); }
  await ekNach(status === "erstattet" ? "✅ Erstattet – Mitglied hat Bescheid bekommen" : "✖ Abgelehnt – Mitglied hat Bescheid bekommen");
  ekAblage("erstattung", id, "Erledigt – wo soll es abgelegt werden?");
}
async function ekDienstInfo(id) {
  let d; try { d = await api("eingang_dienstwunsch", { id }); } catch (e) { return meldeFehler(e); }
  const f = blattAuf("ekDwBlatt", `${einwHtml("b-ek-dienstzeiten")}<h3 style="margin-top:0">📅 Dienstzeiten ${esc(d.name)}</h3>
    <p class="hinweis">${esc(d.veranstaltung)} · Stand ${esc(d.stand)} · Fassung ${esc(String(d.revision))}${d.uebernommen ? " · ✅ im Dienstplan übernommen" : " · noch nicht im Dienstplan"}</p>
    ${d.tage.length ? `<div class="karte" style="padding:6px 12px">${d.tage.map((t) => `<div class="zeile"><b>${esc(t.tag)}</b>${t.zeilen.map((z) => `<br><small>${esc(z)}</small>`).join("")}</div>`).join("")}</div>` : '<p class="hinweis">Keine Zeiten eingetragen.</p>'}
    ${d.comment ? `<p>💬 ${esc(d.comment)}</p>` : ""}<p class="hinweis">Eingeplant wird im Dienstplan-Programm (DP2).</p>
    <div style="display:grid;gap:8px">${d.tage.length ? `<button class="knopf" data-fn="ekDwBestaetigung('${d.id}')">📧 Bestätigung an ${esc(d.name)} schicken</button>` : ""}<button class="knopf haupt" data-fn="ekKenntnis('dienstwunsch','${d.id}')">👁️ Zur Kenntnis genommen</button>
      <button class="knopf" data-fn="ekAblage('dienstwunsch','${d.id}')">🗄️ Ablegen …</button><button class="knopf" data-fn="">Schließen</button></div>`);
  f.querySelectorAll("[data-fn]").forEach((b) => (b.onclick = () => { f.remove(); if (b.dataset.fn) new Function(b.dataset.fn)(); }));
}
// 2.325.0 KC-CLUB-DW-BESTAETIGUNG-KOPIE (Wunsch Hansi): Bestätigung mit Zusammenfassung an das Mitglied – CC Clubsprecher + Kassenwart, BCC Admin
async function ekDwBestaetigung(id) {
  if (!await frage("📧 Bestätigung mit Zusammenfassung schicken?\nDas Mitglied bekommt alle Eingaben per E-Mail und App-Nachricht – mit dem Hinweis „Wunschplanung, noch nicht der fertige Dienstplan“. In CC: Clubsprecher und Kassenwart, in BCC: du.", { ja: "📧 Schicken", nein: "Abbrechen" })) return;
  try { const r = await api("dw_bestaetigung_senden", { id }, { warten: true }); melde(r.gesendet ? `📧 Bestätigung an ${r.name} verschickt (${r.cc} in CC, ${r.bcc} in BCC)` : `⚠️ Bestätigung an ${r.name} konnte nicht zugestellt werden`); }
  catch (e) { meldeFehler(e); }
}
const EK_WAHL_KEY = (art) => "kc_club_ek_ablage_" + art;
async function ekAblage(art, id, frage) {
  let d; try { d = await api("eingang_ablage_ziele", { art, id }); } catch (e) { return meldeFehler(e); }
  let w = null; try { w = JSON.parse(localStorage.getItem(EK_WAHL_KEY(art)) || "null"); } catch {}
  const an = (o) => w ? (w.ordner || []).includes(o.id) : o.vorschlag, reg = (o) => (w?.reg?.[o.id] && o.register.includes(w.reg[o.id]) ? w.reg[o.id] : o.registerVor);
  const f = blattAuf("ekAblageBlatt", `${einwHtml("b-ek-ablage")}<h3 style="margin-top:0">🗄️ ${esc(frage || "Wo ablegen?")}</h3>
    <p style="margin:0 0 6px"><b>${esc(d.titel)}</b></p>${d.schonAbgelegt ? `<p class="hinweis">Schon ${d.schonAbgelegt}× abgelegt (zuletzt ${esc(zeitKurz(d.zuletzt))}) – nochmal ablegen legt eine neue Fassung dazu.</p>` : ""}
    <p class="hinweis" style="margin:4px 0">Häkchen setzen – mehrere Ordner gehen.</p>
    ${d.mitglied ? `<label class="schalter"><span>👤 Im Ordner von <b>${esc(d.mitglied.name)}</b> (zum Nachvollziehen)</span><input type="checkbox" id="ekM"${w ? (w.mitglied ? " checked" : "") : " checked"}></label>` : ""}
    ${d.ordner.length ? d.ordner.map((o) => `<div class="ek-ordner" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid var(--linie)">
      <label style="flex:1;min-width:160px;display:flex;gap:8px;align-items:center"><input type="checkbox" data-o="${esc(o.id)}"${an(o) ? " checked" : ""}> ${esc(o.sym)} ${esc(o.titel)} ${esc(String(o.jahr))}</label>
      <select data-r="${esc(o.id)}" aria-label="Register">${o.register.map((r) => `<option${r === reg(o) ? " selected" : ""}>${esc(r)}</option>`).join("")}</select></div>`).join("")
      : '<p class="hinweis">Noch keine Club-Ordner – Clubsprecher oder Admin legen sie im 🗄️ Archiv an.</p>'}
    <label class="schalter"><span>👤 In meinen eigenen Ordner</span><input type="checkbox" id="ekMein"${w?.mein ? " checked" : ""}></label>
    <div style="display:grid;gap:8px;margin-top:10px"><button class="knopf haupt" id="ekAblegenKnopf">🗄️ Ablegen</button><button class="knopf" id="ekNichtKnopf">Nicht ablegen</button></div>`);
  f.querySelector("#ekNichtKnopf").onclick = () => f.remove();
  f.querySelector("#ekAblegenKnopf").onclick = (e) => einmal(e.target, async () => {
    const ordner = [...f.querySelectorAll("[data-o]")].filter((c) => c.checked).map((c) => c.dataset.o);
    const regs = Object.fromEntries([...f.querySelectorAll("[data-r]")].map((s) => [s.dataset.r, s.value]));
    const mitglied = !!f.querySelector("#ekM")?.checked, mein = !!f.querySelector("#ekMein")?.checked;
    if (!ordner.length && !mitglied && !mein) return melde("Bitte mindestens einen Ordner ankreuzen.", true);
    try { localStorage.setItem(EK_WAHL_KEY(art), JSON.stringify({ ordner, reg: regs, mitglied, mein })); } catch {}
    try {
      const r = await api("eingang_ablegen", { art, id, ziele: ordner.map((o) => ({ ordner_id: o, register: regs[o] })), mitglied, mein }, { warten: true });
      f.remove(); AR.daten = null;
      const gut = r.ergebnis.filter((x) => x.ok).length, schlecht = r.ergebnis.filter((x) => !x.ok);
      if (schlecht.length) melde(`🗄️ ${gut} abgelegt – nicht geklappt: ${schlecht.map((x) => x.ordner).join(", ")}`, true);
      else melde(`🗄️ Abgelegt in ${gut} Ordner${gut === 1 ? "" : "n"}`);
    } catch (err) { meldeFehler(err); }
  });
}
async function buEinArchiv(id, annehmen) {
  if (!annehmen && !(await frage("Dieses Dokument ablehnen? Es wird gelöscht und der Absender bekommt Bescheid."))) return;
  try { await api("archiv_pruefung", { id, annehmen }); melde(annehmen ? "✔ Angenommen – liegt jetzt im Ordner" : "✖ Abgelehnt und gelöscht"); AR.daten = null; } catch (e) { meldeFehler(e); }
  buEingangLaden();
}
async function buEinAufgabe(id) {
  const bemerkung = await aufgabeBemerkung(); if (bemerkung === null) return; // KC-CLUB-AUFGABE-BEMERKUNG
  try { await api("aufgabe_erledigt", { id, erledigt: true, bemerkung }); melde("✔ Aufgabe erledigt"); } catch (e) { meldeFehler(e); }
  buEingangLaden();
}
function buBrief() {
  const eb = INIT?.einstellungen?.briefbogen || {};
  let entwurf = null; try { entwurf = JSON.parse(localStorage.getItem("kc_club_brief_entwurf") || "null"); } catch {}
  BRIEF = entwurf || { vorlage: "leer", empfaenger: "", ort: "Werne", datum: heuteIso(), betreff: "", anrede: BRIEF_ANREDEN[0], text: "", gruss: BRIEF_GRUESSE[0] };
  if (BRIEF.absender == null) BRIEF.absender = eb.absender || "Köcheclub Werne"; if (BRIEF.fuss == null) BRIEF.fuss = eb.fuss || ""; if (BRIEF.name == null) BRIEF.name = eb.name || ICH?.name || ""; if (BRIEF.amt == null) BRIEF.amt = eb.amt || (ICH?.aemter || [])[0] || "";
  BU.sicht = "brief"; buZeigen(); window.scrollTo(0, 0);
  if (entwurf) melde("✏️ Dein letzter Brief-Entwurf ist wieder da");
}
function briefFeld(k, el) { BRIEF[k] = el.value; briefMerken(); lvAuffrischen(); }
let briefTimer = null;
function briefMerken() { clearTimeout(briefTimer); briefTimer = setTimeout(() => { try { localStorage.setItem("kc_club_brief_entwurf", JSON.stringify(BRIEF)); } catch {} }, 400); }
async function briefVorlage(k) {
  const v = BRIEF_VORLAGEN[k]; if (!v) return;
  if ((BRIEF.text || "").trim() && BRIEF.text !== BRIEF_VORLAGEN[BRIEF.vorlage]?.text && !(await frage("Deinen bisherigen Text durch die Vorlage ersetzen?"))) return;
  Object.assign(BRIEF, { vorlage: k, betreff: v.betreff, text: v.text }); briefMerken(); buZeigen();
}
function briefWahl(k, w) { BRIEF[k] = w; briefMerken(); buZeigen(); }
function buBriefHtml() {
  const b = BRIEF, chips = (k, l) => `<div class="hl-chips">${l.map((w) => `<button class="chip${b[k] === w ? " an" : ""}" onclick='briefWahl(${hlJs(k)}, ${hlJs(w)})'>${esc(w)}</button>`).join("")}</div>`;
  const fe = (k, label, ph, rows) => `<label class="feld">${label}${rows ? `<textarea id="briefFeld_${k}" rows="${rows}" maxlength="${k === "text" ? 6000 : 400}" placeholder="${esc(ph)}" oninput="briefFeld('${k}', this)">${esc(b[k])}</textarea>` : `<input id="briefFeld_${k}" maxlength="200" placeholder="${esc(ph)}" value="${esc(b[k])}" oninput="briefFeld('${k}', this)">`}</label>`;
  return `<div class="karte bu-kopf"><img src="kc-kochmuetze-weiss.webp" alt="" class="bu-logo"><div><b>✉️ Briefbogen</b><br><small class="hinweis">Mit Logo und „Köcheclub Werne“ – zum Ausdrucken oder als PDF</small></div></div>
    <div class="karte"><h3 style="margin-top:0">1️⃣ Vorlage</h3><div class="mini-kacheln">${Object.entries(BRIEF_VORLAGEN).map(([k, v]) => `<button class="mini-kachel${b.vorlage === k ? " mk-offen" : ""}" onclick="briefVorlage('${k}')"><span class="mk-sym">${v.sym}</span><span class="mk-titel">${esc(v.t)}</span></button>`).join("")}</div>
      <p class="hinweis" style="margin:6px 0 0">Stellen in [eckigen Klammern] bitte ersetzen.</p></div>
    <div class="karte"><h3 style="margin-top:0">2️⃣ An wen?</h3>${ICH?.vorstand ? '<button class="knopf klein" style="margin:0 0 6px" onclick="adbStart(true)">📒 Aus dem Adressbuch</button>' : ""}${fe("empfaenger", "Empfänger (Name und Anschrift)", "z. B. Kinderhospiz Lünen/Werne\nStraße Nr.\n59368 Werne", 4)}
      <div class="zwei">${fe("ort", "Ort", "Werne")}<label class="feld">Datum<input type="date" value="${esc(b.datum)}" onchange="briefFeld('datum', this)"></label></div></div>
    <div class="karte"><h3 style="margin-top:0">3️⃣ Text</h3>${fe("betreff", "Betreff", "z. B. Spende des Köcheclubs Werne")}
      <div class="hinweis" style="margin:6px 0 4px">Anrede</div>${chips("anrede", BRIEF_ANREDEN)}
      ${fe("anrede", "", "Anrede")}${fe("text", "Brieftext", "Text …", 9)}
      <div class="hinweis" style="margin:6px 0 4px">Gruß</div>${chips("gruss", BRIEF_GRUESSE)}</div>
    <div class="karte"><h3 style="margin-top:0">4️⃣ Unterschrift & Absender</h3><div class="zwei">${fe("name", "Name", "Vor- und Nachname")}${fe("amt", "Amt", "z. B. Clubsprecher")}</div>
      ${fe("absender", "Absenderzeile (oben, klein)", "Köcheclub Werne · Straße · 59368 Werne")}${fe("fuss", "Zusatz unter der Fußzeile (freiwillig)", "z. B. Bankverbindung, E-Mail, Internet")}<p class="hinweis" style="margin:2px 0 8px">Fußzeile immer: <b>${esc(KC_CD.name)} · ${esc(KC_CD.briefAmt)} · ${esc(cdClubsprecher())}</b> (Corporate Design)</p>
      <button class="knopf klein" onclick="briefStandardSpeichern()">💾 Absender & Unterschrift für nächstes Mal merken</button></div>
    ${lvKasten()}
    <div class="bu-leiste"><div class="bu-brief-knoepfe"><button class="knopf haupt" onclick="druckStarten('brief')">👁️ Vorschau & Drucken</button><button class="knopf" onclick="briefNeu()">🆕 Neu</button><button class="knopf" onclick="briefVerwerfen()">🗑️ Verwerfen</button></div></div>`;
}
// 2.146.0 KC-CLUB-BRIEF-VERWERFEN (Wunsch Hansi): Entwurf ganz wegwerfen und zurück ins Büro – nichts wird gesendet, nichts gedruckt
async function briefVerwerfen() {
  if (!(await frage("🗑️ Diesen Brief verwerfen?\n\nDer Entwurf wird gelöscht – er wurde nicht verschickt und nicht gedruckt.", { ja: "🗑️ Verwerfen", nein: "Behalten" }))) return;
  clearTimeout(briefTimer); try { localStorage.removeItem("kc_club_brief_entwurf"); } catch {}
  BRIEF = null; sbbFertig(); BU.sicht = "start"; buLaden(); window.scrollTo(0, 0); melde("🗑️ Brief verworfen – der Entwurf ist gelöscht");
}
async function briefNeu() {
  if (!(await frage("Neuen, leeren Brief beginnen? Der jetzige Entwurf wird verworfen."))) return;
  try { localStorage.removeItem("kc_club_brief_entwurf"); } catch {}
  const { absender, fuss, name, amt } = BRIEF; BRIEF = null; buBrief(); Object.assign(BRIEF, { absender, fuss, name, amt }); buZeigen();
}
async function briefStandardSpeichern() {
  const wert = { absender: BRIEF.absender, fuss: BRIEF.fuss, name: BRIEF.name, amt: BRIEF.amt };
  try { await api("einstellung_setzen", { schluessel: "briefbogen", wert }); INIT.einstellungen = { ...(INIT.einstellungen || {}), briefbogen: wert }; melde("💾 Gemerkt – beim nächsten Brief schon ausgefüllt"); }
  catch (e) { meldeFehler(e); }
}
// Brief nach DIN 5008 (vereinfacht): Briefkopf mit Logo, Absenderzeile über der Anschrift (Fensterumschlag), Datum rechts
function druckBrief() {
  const b = BRIEF; if (!b) throw new Error("Bitte den Brief im Büro ausfüllen.");
  const datum = b.datum ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(b.datum + "T12:00:00Z")) : "";
  const absatz = (t) => esc(t).replace(/\n/g, "<br>");
  const html = `<div class="cd-blatt cd-brief">${cdKopf()}
    <div style="display:flex;justify-content:space-between;margin-top:12mm;gap:10mm">
      <div style="width:85mm"><div style="font-size:2.6mm;color:#555;border-bottom:.2mm solid #888;padding-bottom:.6mm;margin-bottom:3mm">${esc(b.absender || "Köcheclub Werne")}</div>
        <div style="min-height:30mm">${absatz(b.empfaenger || "")}</div></div>
      <div style="text-align:right;align-self:flex-end">${esc([b.ort, datum].filter(Boolean).join(", "))}</div></div>
    ${b.betreff ? `<div style="font-weight:700;margin-top:12mm">${esc(b.betreff)}</div>` : '<div style="margin-top:12mm"></div>'}
    <div style="margin-top:7mm">${absatz(b.anrede || "")}</div>
    <div style="margin-top:4mm">${absatz(b.text || "")}</div>
    <div style="margin-top:7mm">${esc(b.gruss || "")}</div>
    <div style="height:16mm"></div>
    <div>${esc(b.name || "")}${b.amt ? `<br><span style="color:${KC_CD.grau}">${esc(b.amt)}, ${esc(KC_CD.name)}</span>` : ""}</div>
    <div style="flex:1"></div>
    ${cdFuss(b.fuss ? absatz(b.fuss) : "", true)}</div>`;
  return { titel: b.betreff || "Brief", ohneRahmen: true, html };
}

// ---------- KC-CLUB-BUERO-TERMINE (1.27.0, Wunsch Hansi): Termine im Büro – kommende Termine als Kacheln, antippen → alles dazu ----------
// Nutzt die vorhandenen Wege (treffen_liste, treffenForm, treffenAbsagen, Büro-Vorbereitung/Einladung) – nichts doppelt.
let BU_TERMINE = null;
function buTermine() { BU.sicht = "termine"; buZeigen(); buTermineLaden(); window.scrollTo(0, 0); }
async function buTermineLaden() {
  try { const r = await api("treffen_liste"); orteMerken(r.treffen); BU_TERMINE = r.treffen.filter((t) => new Date(t.ende || t.beginn) > Date.now() - 3 * 3600000).sort((a, b) => a.beginn.localeCompare(b.beginn)); }
  catch (e) { return meldeFehler(e); }
  if (aktuelleAnsicht === "buero" && BU.sicht === "termine") buZeigen();
}
function buTermineHtml() {
  const l = BU_TERMINE;
  const kachel = (t) => { const va = t.art === "veranstaltung", ab = t.status === "abgesagt";
    return `<button class="mini-kachel${ab ? "" : va ? "" : " mk-offen"}" onclick="buTerminInfo('${t.id}')"><span class="mk-sym">${ab ? "🚫" : va ? "🎪" : "🍽️"}</span><span class="mk-titel">${esc(t.titel)}</span>
      <span class="mk-unter">${esc(wann(t.beginn))}${t.ort ? " · " + esc(t.ort) : ""}</span>${ab ? '<span class="marke rot">abgesagt</span>' : va ? "" : `<span class="mk-unter">✅ ${t.ja} · ❌ ${t.nein} · ❓ ${t.vielleicht}</span>`}</button>`; };
  return `<div class="karte bu-gruss">📅 <b>Termine</b> – antippen zum Ändern, Absagen, Vorbereiten oder Einladen.</div>
    <div class="knoepfe" style="margin:0 0 8px"><button class="knopf haupt" style="flex:1" onclick="buTerminNeu()">＋ Neuer Termin</button><button class="knopf" onclick="termineArt='kalender';zeige('termine')">📆 Kalender</button></div>
    ${!l ? '<div class="karte hinweis">Wird geladen …</div>' : l.length ? `<div class="mini-kacheln">${l.map(kachel).join("")}</div>` : '<div class="karte hinweis">Keine kommenden Termine. Tippe auf „＋ Neuer Termin“.</div>'}
    <div class="knoepfe"><button class="knopf" onclick="termineArt='liste';zeige('termine')">🧭 Terminfindung & Anfragen</button><button class="knopf" onclick="buZurueck()">🗂️ Zurück ins Büro</button></div>`;
}
const buTerminObj = (t) => ({ id: t.id, titel: t.titel, beginn: t.beginn, ende: t.ende, ort: t.ort, beschreibung: t.beschreibung, gastgeber: t.gastgeber?.person_id || "", art: t.art, ganztaegig: t.ganztaegig });
function buTerminInfo(id) {
  const t = (BU_TERMINE || []).find((x) => x.id === id); if (!t) return;
  const va = t.art === "veranstaltung", ab = t.status === "abgesagt", offen = !ab && new Date(t.ende || t.beginn) > Date.now();
  const namen = (a) => (t.teilnahme || []).filter((y) => y.antwort === a).map((y) => esc(y.name)).join(", ") || "–";
  const kn = [
    offen ? `<button class="knopf haupt" onclick="buTerminAendern('${id}')">✏️ Ändern (Datum, Zeit, Ort …)</button>` : "",
    offen && !va ? `<button class="knopf" onclick="$('buTermin').remove();buSitzungOeffnen('${id}')">📝 Sitzung vorbereiten</button>` : "",
    offen && !va ? `<button class="knopf" onclick="$('buTermin').remove();buEinladung('${id}', false)">📨 Einladung mit Tagesordnung</button>` : "",
    offen && !va ? `<button class="knopf" onclick="$('buTermin').remove();buEinladung('${id}', true)">🔔 An Antwort erinnern</button>` : "",
    offen ? `<button class="knopf" onclick="$('buTermin').remove();buTerminAbsagen('${id}', ${va})">🚫 Absagen (alle bekommen Bescheid)</button>` : "",
  ].filter(Boolean).join("");
  const f = blattAuf("buTermin", `<div class="info-gross"><h3 style="margin:0">${va ? "🎪" : "🍽️"} ${esc(t.titel)}</h3>
    <p style="margin:4px 0 0">🗓️ ${esc(wann(t.beginn, true))}${t.ort ? `<br>📍 ${esc(t.ort)}` : t.gastgeber ? `<br>🏠 bei ${esc(t.gastgeber.name)}` : ""}</p>
    ${t.beschreibung ? `<p style="white-space:pre-wrap;margin:8px 0 0">${esc(t.beschreibung)}</p>` : ""}
    ${va ? "" : `<p style="margin:8px 0 0">✅ <b>Kommen:</b> ${namen("ja")}<br>❓ <b>Vielleicht:</b> ${namen("vielleicht")}<br>❌ <b>Abgesagt:</b> ${namen("nein")}</p>`}
    ${ab ? '<p><span class="marke rot">abgesagt</span></p>' : ""}</div>
    <div class="knoepfe" style="flex-direction:column;align-items:stretch">${kn}<button class="knopf" onclick="$('buTermin').remove()">Schließen</button></div>`);
  f.dataset.id = id;
}
function buTerminAendern(id) { const t = (BU_TERMINE || []).find((x) => x.id === id); $("buTermin")?.remove(); termineArt = "liste"; zeige("termine"); treffenForm(buTerminObj(t)); melde("✏️ Ändern, dann „Speichern“ – zurück ins Büro über 🗂️"); }
function buTerminNeu() { termineArt = "liste"; zeige("termine"); treffenForm(); }
async function buTerminAbsagen(id, va) { await treffenAbsagen(id, va); buTermineLaden(); }

// ---------- KC-CLUB-BUERO-KONTAKT (1.27.0): Mitglieder kontaktieren – Gruppe antippen, Auswahl prüfen, Weg wählen ----------
// Schreiben läuft über die vorhandene „Neue Nachricht“ (mit Push/Mail-Wahl); Anrufen/WhatsApp über die Mitglieder-Seite
// mit deren Freigaberegeln – das Büro zeigt keine Kontaktdaten zusätzlich an.
let BU_K = { wahl: new Set(), gruppe: "", antworten: null };
async function buKontakt() {
  BU.sicht = "kontakt"; BU_K = { wahl: new Set(), gruppe: "", antworten: null }; buZeigen(); window.scrollTo(0, 0);
  try { await mitgliederHolen(); } catch (e) { return meldeFehler(e); }
  const t = BU.start?.sitzungen?.[0];
  if (t) try { const s = await api("buero_sitzung", { treffen_id: t.id }); BU_K.antworten = new Map(s.mitglieder.map((m) => [m.person_id, m.antwort])); BU_K.sitzung = t; } catch {}
  if (aktuelleAnsicht === "buero" && BU.sicht === "kontakt") buZeigen();
}
function buKGruppen() {
  const andere = (MITGLIEDER || []).filter((m) => m.person_id !== ICH?.person_id), a = BU_K.antworten;
  const g = [["alle", "👥 Alle", andere.map((m) => m.person_id)], ["online", "🟢 Gerade online", andere.filter((m) => m.online || ONL?.ids?.has(m.person_id)).map((m) => m.person_id)]];
  if (a) g.push(["ja", "✅ Kommen zur Sitzung", andere.filter((m) => a.get(m.person_id) === "ja").map((m) => m.person_id)],
    ["ohne", "❓ Noch ohne Antwort", andere.filter((m) => !a.get(m.person_id) || a.get(m.person_id) === "keine").map((m) => m.person_id)],
    ["nein", "❌ Abgesagt", andere.filter((m) => a.get(m.person_id) === "nein").map((m) => m.person_id)]);
  for (const amt of AEMTER || []) { const ids = andere.filter((m) => (m.aemter || []).includes(amt)).map((m) => m.person_id); if (ids.length) g.push(["amt:" + amt, "🎖️ " + amt, ids]); }
  return g;
}
function buKGruppe(k) { const g = buKGruppen().find((x) => x[0] === k); if (!g) return; BU_K.gruppe = k; BU_K.wahl = new Set(g[2]); buZeigen(); }
function buKToggle(id) { BU_K.wahl.has(id) ? BU_K.wahl.delete(id) : BU_K.wahl.add(id); BU_K.gruppe = ""; buZeigen(); }
function buKontaktHtml() {
  if (!MITGLIEDER) return '<div class="karte hinweis">Wird geladen …</div>';
  const andere = MITGLIEDER.filter((m) => m.person_id !== ICH?.person_id).sort((a, b) => a.name.localeCompare(b.name)), n = BU_K.wahl.size;
  const ant = (id) => ({ ja: "✅", nein: "❌", vielleicht: "❓" }[BU_K.antworten?.get(id)] || "");
  return `<div class="karte bu-gruss">👥 <b>Mitglieder kontaktieren</b> – Gruppe antippen oder einzelne Personen, dann den Weg wählen.</div>
    <div class="abschnitt"><h3>1️⃣ Wen?</h3></div>
    <div class="hl-chips">${buKGruppen().map(([k, t, ids]) => `<button class="chip${BU_K.gruppe === k ? " an" : ""}" onclick='buKGruppe(${hlJs(k)})'>${esc(t)} · ${ids.length}</button>`).join("")}<button class="chip" onclick="BU_K.wahl=new Set();BU_K.gruppe='';buZeigen()">✕ Keine</button></div>
    ${BU_K.sitzung ? `<p class="hinweis" style="margin:2px 0 6px">✅❓❌ beziehen sich auf: ${esc(BU_K.sitzung.titel)} · ${esc(wann(BU_K.sitzung.beginn))}</p>` : ""}
    <div class="bu-haken-liste" style="grid-template-columns:repeat(auto-fill, minmax(260px, 1fr))">${andere.map((m) => `<div class="bu-haken${BU_K.wahl.has(m.person_id) ? " an" : ""}" style="justify-content:space-between">
      <label style="display:flex;gap:6px;align-items:center;flex:1;min-width:0;cursor:pointer"><input type="checkbox" ${BU_K.wahl.has(m.person_id) ? "checked" : ""} onchange="buKToggle('${m.person_id}')"> ${esc(m.name)} <small>${ant(m.person_id)}${m.online ? " 🟢" : ""}</small></label>
      <button class="knopf klein" style="padding:6px 8px;flex-shrink:0" title="Kontakt (Anrufen, WhatsApp …)" onclick="mitgliedOeffnen('${m.person_id}')">👤</button></div>`).join("")}</div>
    <div class="abschnitt"><h3>2️⃣ Wie? ${n ? `<span class="marke gelb">${n} ausgewählt</span>` : ""}</h3></div>
    <div class="mini-kacheln">
      <button class="mini-kachel" ${n ? "" : "disabled"} onclick="buKSchreiben()"><span class="mk-sym">💬</span><span class="mk-titel">Nachricht schreiben</span><span class="mk-unter">in der App – mit Push und/oder E-Mail</span></button>
      <button class="mini-kachel" ${n === 1 ? "" : "disabled"} onclick="mitgliedOeffnen([...BU_K.wahl][0])"><span class="mk-sym">📞</span><span class="mk-titel">Anrufen / WhatsApp</span><span class="mk-unter">${n === 1 ? "Kontakt öffnen" : "genau 1 Person wählen"}</span></button>
      <button class="mini-kachel" ${n === 1 ? "" : "disabled"} onclick="buKBrief()"><span class="mk-sym">✉️</span><span class="mk-titel">Brief schreiben</span><span class="mk-unter">${n === 1 ? "Briefbogen mit Namen" : "genau 1 Person wählen"}</span></button>
      <button class="mini-kachel" onclick="zeige('pinnwand');pwForm(true)"><span class="mk-sym">📌</span><span class="mk-titel">Zettel an die Pinnwand</span><span class="mk-unter">kurz & für alle sichtbar</span></button>
    </div>
    <div class="knoepfe"><button class="knopf" onclick="buZurueck()">🗂️ Zurück ins Büro</button></div>`;
}
async function buKSchreiben() {
  const ids = [...BU_K.wahl]; if (!ids.length) return;
  await neueNachricht(); empfWahl.personen = ids; empfListe();
  melde(`💬 ${ids.length} Empfänger übernommen – Betreff und Text schreiben, dann senden`);
}
function buKBrief() {
  const m = MITGLIEDER.find((x) => x.person_id === [...BU_K.wahl][0]); buBrief();
  if (m && !BRIEF.empfaenger) { BRIEF.empfaenger = m.name; BRIEF.anrede = `Liebe/r ${m.vorname || m.name.split(" ")[0]},`; BRIEF.gruss = "Herzliche Grüße"; briefMerken(); buZeigen(); }
}

// ---------- KC-CLUB-BUERO-NACHHER (1.28.0, Wunsch Hansi): nach der Sitzung – Foto der Mitschrift, Aufgaben verteilen, veröffentlichen ----------
// Nutzt das vorhandene Protokoll (Anlagen, Aufgaben, Veröffentlichen mit Einspruchsfrist): die Büro-Seite rendert #prAnlagen/#prAufgaben,
// damit die bekannten Funktionen (protokollDateien, prNeuLaden, aufgabeZeile) hier genauso arbeiten.
let BU_N = { liste: null, t: null, wer: new Set(), was: "", bis: "" };
async function buNachherListe(opt = {}) { try { const r = await api("buero_nachher", {}, opt); BU_N.liste = Array.isArray(r?.sitzungen) ? r.sitzungen : []; BU_N.fehler = false; } catch { BU_N.liste = []; BU_N.fehler = true; } return BU_N.liste; } // 2.749.0: Fehler merken
// Hinweis auf der Büro-Startseite: was nach der letzten Sitzung noch fehlt
function buNachherTipp() {
  const t = (BU_N.liste || []).find((x) => new Date(x.beginn) < Date.now() && Date.now() - new Date(x.beginn) < 21 * 86400000); if (!t) return null;
  if (!t.protokoll || (!t.fotos && t.protokoll.status !== "veroeffentlicht")) return { t, text: `📸 Foto der Mitschrift von „${t.titel}“ anhängen` }; // 2.749.0: veröffentlicht → kein Foto mehr verlangen
  if (t.nichtMitgeteilt && t.protokoll.status === "veroeffentlicht") return { t, text: "✔️ Aufgaben mitteilen" };
  if (t.protokoll.status === "entwurf") return { t, text: `📢 Protokoll „${t.titel}“ veröffentlichen` };
  return null;
}
function buNachherWahl(titel) {
  const l = (BU_N.liste || []).filter((x) => new Date(x.beginn) < Date.now() + 6 * 3600000);
  if (!l.length) return melde(BU_N.fehler ? "⚠️ Die letzten Sitzungen konnten gerade nicht geladen werden – bitte gleich noch einmal versuchen." : "Es gab in den letzten Wochen keine Sitzung.", true); // 2.749.0: unbekannt ≠ leer
  if (l.length === 1) return buNachher(l[0].id);
  blattAuf("buWahl", `${einwHtml("b-bu-sitzung")}<h3 style="margin-top:0">${titel}</h3><div class="wahl">${l.map((t) => `<button onclick="$('buWahl').remove();buNachher('${t.id}')">${esc(t.titel)}<br><small>${esc(wann(t.beginn))} · ${t.protokoll ? (t.protokoll.status === "entwurf" ? "📝 Entwurf" : "✅ veröffentlicht") : "noch kein Protokoll"}${t.fotos ? ` · 📸 ${t.fotos}` : ""}${t.aufgaben ? ` · ✔️ ${t.aufgaben}` : ""}</small></button>`).join("")}</div>
    <div class="knoepfe"><button class="knopf" onclick="$('buWahl').remove()">Abbrechen</button></div>`);
}
async function buNachher(tid) {
  const t = (BU_N.liste || []).find((x) => x.id === tid); if (!t) return;
  try {
    // Protokoll da? Sonst Entwurf aus der Sitzung anlegen (vorhandene Vorlage: Anwesende, Tagesordnung …)
    const pid = t.protokoll?.id || (await api("protokoll_vorlage", { treffen_id: tid }, { warten: true })).id;
    prId = pid; PR = await api("protokoll_laden", { id: pid }, { warten: true }); aufgabenMitGruppe(PR.aufgaben || []);
    if (!MITGLIEDER) await mitgliederHolen();
  } catch (e) { return meldeFehler(e); }
  BU_N = { ...BU_N, t, wer: new Set(), was: "", bis: "" };
  BU.sicht = "nachher"; buZeigen(); window.scrollTo(0, 0);
  document.querySelectorAll("#prAnlagen img[data-anlage]").forEach(bildLaden);
}
async function buNachherNeu() { await prNeuLaden(); buZeigen(); document.querySelectorAll("#prAnlagen img[data-anlage]").forEach(bildLaden); }
function buNachherHtml() {
  if (!PR) return '<div class="karte hinweis">Wird geladen …</div>';
  const p = PR.protokoll, t = BU_N.t, entwurf = p.roh === "entwurf";
  const naechste = (BU.start?.sitzungen || []).find((x) => new Date(x.beginn) > Date.now());
  const bisWahl = [["", "ohne Frist"], [tagPlus(heuteIso(), 7), "in 1 Woche"], [tagPlus(heuteIso(), 14), "in 2 Wochen"], ...(naechste ? [[berlinIso(naechste.beginn), "bis zur nächsten Sitzung"]] : [])];
  const tops = (p.tagesordnung || []).filter(Boolean).filter((x) => !/^(Begrüßung|Verschiedenes|Genehmigung des letzten Protokolls)$/i.test(x));
  const andere = MITGLIEDER.slice().sort((a, b) => a.name.localeCompare(b.name));
  const offenMit = (PR.aufgaben || []).filter((a) => !a.erledigt_am).length;
  return `<div class="karte bu-kopf"><img src="kc-kochmuetze-weiss.webp" alt="" class="bu-logo"><div><b>📄 Nach der Sitzung</b><br><span style="font-size:1.1rem;font-weight:800">${esc(p.titel)}</span><br>${esc(t ? wann(t.beginn) : p.datum)} · ${entwurf ? "📝 Protokoll-Entwurf" : "✅ veröffentlicht"}</div></div>
    <div class="karte"><h3 style="margin-top:0">1️⃣ Foto der Mitschrift</h3>
      <p class="hinweis" style="margin:0 0 6px">Die ausgefüllte Vorlage einfach abfotografieren – jede Seite ein Foto. Gut ausleuchten, gerade von oben.</p>
      ${entwurf ? `<div class="knoepfe" style="margin:0 0 8px"><button class="knopf haupt" onclick="dateiWahl('buFotoKamera', buNachherDateien)">📷 Foto machen</button><button class="knopf" onclick="dateiWahl('prBild', buNachherDateien)">🖼️ Aus der Galerie</button><button class="knopf" onclick="$('prDok').click()">📄 Datei</button></div>`
        : '<p class="hinweis">Das Protokoll ist veröffentlicht – Fotos ergänzen geht über „Protokoll öffnen → Korrigieren“.</p>'}
      <div id="prAnlagen">${anlagenListe(entwurf)}</div></div>
    <div class="karte"><h3 style="margin-top:0">2️⃣ Aufgaben verteilen</h3>
      <div class="hl-frage" style="margin-top:0">Wer?</div>
      <div class="hl-chips">${andere.map((m) => `<button class="chip${BU_N.wer.has(m.person_id) ? " an" : ""}" onclick="buNWer('${m.person_id}')">${esc(m.name)}</button>`).join("")}</div>
      <div class="hl-frage">Was?</div>
      ${tops.length ? `<div class="hl-chips">${tops.map((x) => `<button class="chip" onclick='buNWas(${hlJs(x)})'>📌 ${esc(x)}</button>`).join("")}</div>` : ""}
      <label class="feld" style="margin:0"><input id="buNWas" maxlength="300" placeholder="z. B. Angebot für Glühwein einholen" value="${esc(BU_N.was)}" oninput="BU_N.was=this.value"></label>
      <div class="hl-frage">Bis wann?</div>
      <div class="hl-chips">${bisWahl.map(([w, x]) => `<button class="chip${BU_N.bis === w ? " an" : ""}" onclick="BU_N.bis='${w}';buZeigen()">${esc(x)}</button>`).join("")}
        <label class="hl-kal${BU_N.bis && !bisWahl.some(([w]) => w === BU_N.bis) ? " an" : ""}">📅 ${BU_N.bis && !bisWahl.some(([w]) => w === BU_N.bis) ? esc(fTagDp.format(new Date(BU_N.bis + "T12:00:00Z"))) : "Datum"}<input type="date" min="${heuteIso()}" onchange="if(this.value){BU_N.bis=this.value;buZeigen()}"></label></div>
      <button class="knopf haupt" style="width:100%;margin-top:8px" onclick="buNAufgabe(this)">＋ Aufgabe eintragen${BU_N.wer.size > 1 ? ` (für ${BU_N.wer.size})` : ""}</button>
      <div class="hl-frage">Eingetragen</div><div id="prAufgaben">${(PR.aufgaben || []).map((a) => aufgabeZeile(a, true, true)).join("") || '<p class="hinweis">Noch keine Aufgaben.</p>'}</div>
      ${offenMit ? (entwurf ? `<p class="hinweis" style="margin:8px 0 0">📨 Die Mitglieder bekommen ihre Aufgabe automatisch, sobald das Protokoll veröffentlicht ist.</p><button class="knopf" style="margin-top:6px" onclick="buNMitteilen(this)">📨 Jetzt schon mitteilen</button>`
        : `<button class="knopf" style="margin-top:8px" onclick="buNMitteilen(this)">📨 Neue Aufgaben jetzt mitteilen</button>`) : ""}</div>
    <div class="karte"><h3 style="margin-top:0">3️⃣ Protokoll fertigstellen</h3>
      <p class="hinweis" style="margin:0 0 6px">${entwurf ? "Im Protokoll noch Beschlüsse/Kurzfassung ergänzen und dann „Veröffentlichen“ tippen. Alle Mitglieder bekommen Bescheid, 7 Tage Einspruchsfrist laufen automatisch." : "Das Protokoll ist veröffentlicht."}</p>
      <button class="knopf haupt" style="width:100%" onclick="protokollOeffnen('${p.id}')">📄 Protokoll öffnen${entwurf ? " & veröffentlichen" : ""}</button></div>
    <div class="knoepfe"><button class="knopf" onclick="buZurueck()">🗂️ Zurück ins Büro</button></div>`;
}
async function buNachherDateien(input) { await protokollDateien(input); buZeigen(); document.querySelectorAll("#prAnlagen img[data-anlage]").forEach(bildLaden); }
function buNWer(id) { BU_N.wer.has(id) ? BU_N.wer.delete(id) : BU_N.wer.add(id); buZeigen(); }
function buNWas(x) { BU_N.was = x + ": "; buZeigen(); const e = $("buNWas"); if (e) { e.focus(); e.setSelectionRange(e.value.length, e.value.length); } }
async function buNAufgabe(knopf) {
  const text = (BU_N.was || "").trim();
  if (!BU_N.wer.size) return melde("Bitte antippen, wer die Aufgabe übernimmt.", true);
  if (!text || text.endsWith(":")) return melde("Bitte kurz eintragen, was zu tun ist.", true);
  await einmal(knopf, async () => {
    try {
      await api("aufgabe_speichern", { protokoll_id: prId, person_ids: [...BU_N.wer], text, faellig: BU_N.bis || null });
      melde(`✔️ Aufgabe für ${BU_N.wer.size === 1 ? nameVon([...BU_N.wer][0]) : BU_N.wer.size + " Personen"} eingetragen`);
      BU_N.wer = new Set(); BU_N.was = ""; await buNachherNeu();
    } catch (e) { meldeFehler(e); }
  });
}
async function buNMitteilen(knopf) {
  if (!(await frage("Die eingetragenen Aufgaben jetzt an die Mitglieder schicken?"))) return;
  await einmal(knopf, async () => {
    try { const r = await api("buero_aufgaben_mitteilen", { protokoll_id: prId }); melde(r.personen ? `📨 ${r.personen} Mitglied${r.personen === 1 ? "" : "er"} benachrichtigt` : "Alle Aufgaben waren schon mitgeteilt"); await buNachherNeu(); }
    catch (e) { meldeFehler(e); }
  });
}
async function buFesteListe(tage = 60, opt = {}) {
  try { const r = await api("buero_feste", { tage }, opt); BU_F = r && Array.isArray(r.geburtstage) && Array.isArray(r.jubilaeen) ? r : null; } catch { BU_F = null; } // unvollständig = nichts anzeigen statt Absturz
  return BU_F;
}
const buFTag = (f) => f.tage === 0 ? "heute 🎉" : f.tage === 1 ? "morgen" : f.tage === -1 ? "gestern" : f.tage < 0 ? `vor ${-f.tage} Tagen` : `${fTagDp.format(new Date(f.datum + "T12:00:00Z"))} · in ${f.tage} Tagen`;
function buFeste(vonFl = false) { BU.festeVonFl = !!vonFl; BU.sicht = "feste"; buZeigen(); buFesteListe(BU_F?.tage || 60).then(() => { if (aktuelleAnsicht === "buero" && BU.sicht === "feste") buZeigen(); }); window.scrollTo(0, 0); }
function buFesteKachel(f, art) {
  const heute = f.tage === 0;
  return `<button class="mini-kachel${heute ? " bu-dran" : f.rund ? " mk-offen" : ""}" onclick="buFestInfo('${art}','${f.person_id}')"><span class="mk-sym">${art === "geb" ? (f.alter ? "🎉" : "🎂") : f.rund ? "🏆" : "🏅"}</span>
    <span class="mk-titel">${esc(f.name)}</span><span class="mk-unter">${art === "geb" ? (f.alter ? `<b>wird ${f.alter}</b> – runder Geburtstag!` : "Geburtstag") : `<b>${f.jahre} Jahre</b> im Club${f.rund ? " – rund!" : ""}`}</span><span class="mk-unter">${esc(buFTag(f))}</span></button>`;
}
function buFesteHtml() {
  const d = BU_F; if (!d) return '<div class="karte hinweis">Wird geladen …</div>';
  const alle = [...d.geburtstage.map((f) => ({ ...f, art: "geb" })), ...d.jubilaeen.map((f) => ({ ...f, art: "jub" }))].sort((a, b) => a.datum.localeCompare(b.datum));
  const gruppe = (titel, l) => l.length ? `<div class="abschnitt"><h3>${titel}</h3></div><div class="mini-kacheln">${l.map((f) => buFesteKachel(f, f.art)).join("")}</div>` : "";
  return `<div class="karte bu-gruss">🎉 <b>Geburtstage & Jubiläen</b> – antippen zum Gratulieren (Nachricht, Brief oder Pinnwand).</div>
    ${ICH?.admin ? '<button class="knopf" style="width:100%;margin-bottom:8px" onclick="ggUebersicht()">🎂 Meine Geburtstagsgrüße – automatisch kurz nach 0 Uhr in meinem Namen</button>' : ""}
    <div class="hl-chips">${[30, 60, 90, 366].map((t) => `<button class="chip${d.tage === t ? " an" : ""}" onclick="buFesteListe(${t}).then(buZeigen)">${t === 366 ? "ganzes Jahr" : `nächste ${t} Tage`}</button>`).join("")}</div>
    ${gruppe("🎉 Heute", alle.filter((f) => f.tage === 0))}
    ${gruppe("📅 Diese Woche", alle.filter((f) => f.tage > 0 && f.tage <= 7))}
    ${gruppe("🗓️ Danach", alle.filter((f) => f.tage > 7))}
    ${gruppe("⏪ Gerade vorbei", alle.filter((f) => f.tage < 0))}
    ${!alle.length ? '<div class="karte hinweis">In diesem Zeitraum steht nichts an.</div>' : ""}
    ${d.ohneFreigabe ? `<p class="hinweis">🔒 ${d.ohneFreigabe} Mitglied${d.ohneFreigabe === 1 ? " hat seinen" : "er haben ihren"} Geburtstag nicht freigegeben – deshalb ${d.ohneFreigabe === 1 ? "erscheint er" : "erscheinen sie"} hier nicht.</p>` : ""}
    <div class="knoepfe"><button class="knopf" onclick="druckStarten('feste')">🖨️ Liste drucken</button>${BU.festeVonFl ? '<button class="knopf" onclick="buFreudLeid()">🤍 Zurück zu Freud & Leid</button>' : '<button class="knopf" onclick="buZurueck()">🗂️ Zurück ins Büro</button>'}</div>`;
}
// ---------- 2.617.0 KC-CLUB-GEBURTSTAG-GRUSS (Wunsch Hansi „30 verschiedene Geburtstagsgrüße, 2 Tage vorher klicke ich an, welchen er bekommen soll –
// in meinem Namen; vergesse ich es, automatisch einen passenden, kurz nach 24 Uhr“) ----------
// Nur Admin. Texte, Auswahl und Versand liegen beim Server (Aktion „geb_gruss“); die App zeigt Übersicht und Auswahl. Push „Gruß auswählen“ → #gebgruss=…
const GG = { stand: null };
const ggTag = (x) => x.tage === 0 ? "heute 🎉" : x.tage === 1 ? "morgen" : x.tage === 2 ? "übermorgen" : `${fTagDp.format(new Date(x.tag + "T12:00:00Z"))} · in ${x.tage} Tagen`;
const ggNr = (nr) => nr > 100 ? "Gruß zum runden Geburtstag" : `Gruß ${nr}`;
const ggStatus = (x) => x.gesendet ? `✅ verschickt (${ggNr(x.gesendet.nr)}${x.gesendet.auto ? ", automatisch" : ""})` : x.wahl ? `✍️ ${ggNr(x.wahl)} ausgewählt` : "🤖 noch keiner gewählt – geht automatisch";
async function ggUebersicht() {
  if (!ICH?.admin) return;
  try { GG.stand = await api("geb_gruss", { a: "stand", tage: 60 }); } catch (e) { return meldeFehler(e); }
  const s = GG.stand;
  blattAuf("ggBlatt", `<h3 style="margin-top:0">🎂 Meine Geburtstagsgrüße</h3>
    <div class="schalter"><div><b>Grüße in meinem Namen verschicken</b><div class="hinweis">Kurz nach 0 Uhr bekommt jedes Mitglied an seinem Geburtstag eine Nachricht von dir – den Gruß, den du ausgewählt hast, sonst automatisch einen passenden (nie zweimal denselben für dieselbe Person). 2 Tage vorher erinnert dich ein Push: „Gruß auswählen“.</div></div>
      <input type="checkbox" id="ggAn" aria-label="Geburtstagsgrüße an oder aus" ${s.an ? "checked" : ""} onchange="ggSchalten(this.checked)"></div>
    ${s.meineAnrede ? "" : `<p class="hinweis">✍️ Unterschrift: ${ggAnredeKnoepfe(ICH.person_id, null, "Dein", "Deine")} – sonst „Liebe Grüße“.</p>`}
    <div class="abschnitt"><h3>Die nächsten 60 Tage</h3></div>
    ${s.liste.length ? s.liste.map((x) => `<button class="mini-kachel" style="width:100%;text-align:left" onclick="ggWahl('${esc(x.person_id)}')"><span class="mk-sym">🎂</span>
      <span class="mk-titel">${esc(x.name)}</span><span class="mk-unter">${esc(ggTag(x))}${x.rund ? ` · <b>wird ${x.rund} 🎉</b>` : ""}</span><span class="mk-unter">${esc(ggStatus(x))}${x.anrede ? "" : " · ⚠️ Lieber/Liebe fehlt"}</span></button>`).join("")
      : '<div class="karte hinweis">In den nächsten 60 Tagen hat niemand Geburtstag.</div>'}
    ${s.ohneDatum ? `<p class="hinweis">ℹ️ ${s.ohneDatum} Mitglied${s.ohneDatum === 1 ? " hat" : "er haben"} kein Geburtsdatum in der KC-Verwaltung – ${s.ohneDatum === 1 ? "es bekommt" : "sie bekommen"} keinen Gruß.</p>` : ""}
    <div class="knoepfe"><button class="knopf" onclick="$('ggBlatt').remove()">Schließen</button></div>`);
}
const ggAnredeKnoepfe = (pid, anrede, er = "Lieber", sie = "Liebe") => `<button type="button" class="chip${anrede === "Lieber" ? " an" : ""}" onclick="ggAnrede('${esc(pid)}','Lieber')">${er}</button> <button type="button" class="chip${anrede === "Liebe" ? " an" : ""}" onclick="ggAnrede('${esc(pid)}','Liebe')">${sie}</button>`;
async function ggSchalten(an) {
  try { await api("geb_gruss", { a: "schalten", an: !!an }); melde(an ? "🎂 Geburtstagsgrüße in deinem Namen sind eingeschaltet." : "Geburtstagsgrüße ausgeschaltet."); } catch (e) { meldeFehler(e); }
  ggUebersicht();
}
async function ggAnrede(pid, anrede) {
  try { await api("besuch", { a: "anrede", person_id: pid, anrede }); } catch (e) { return meldeFehler(e); }
  if ($("ggWahlBlatt") && pid !== ICH.person_id) return ggWahl(pid);
  ggUebersicht();
}
async function ggWahl(pid) {
  if (!ICH?.admin) return;
  let v; try { v = await api("geb_gruss", { a: "vorschau", person_id: pid }); } catch (e) { return meldeFehler(e); }
  const gesendet = v.gesendet;
  blattAuf("ggWahlBlatt", `<div style="text-align:center"><div style="font-size:2.4rem;line-height:1.2" aria-hidden="true">🎂</div>
      <h3 style="margin:4px 0">${esc(v.name)}</h3><p style="margin:0">${esc(ggTag(v))}${v.rund ? ` · <b>wird ${v.rund.alter} 🎉</b>` : ""}</p></div>
    <p class="hinweis" style="margin-top:8px">Anrede: ${ggAnredeKnoepfe(pid, v.anrede)}${v.anrede ? "" : " – noch offen, bis dahin „Hallo“"}</p>
    ${gesendet ? `<div class="karte">✅ Schon verschickt: ${ggNr(gesendet.nr)}.</div>` : `<p class="hinweis">Tippe einen Gruß an – er geht kurz nach 0 Uhr am Geburtstag als Nachricht von dir raus.</p>`}
    <button type="button" class="karte" style="display:block;width:100%;text-align:left${v.wahl ? "" : ";outline:3px solid var(--akzent, #2a7)"}" ${gesendet ? "disabled" : ""} onclick="ggWaehlen('${esc(pid)}',0)">🤖 <b>Automatisch</b> – passend ausgesucht (zurzeit ${v.auto > 100 ? "ein Gruß zum runden " + v.rund?.alter + "." : "Gruß " + v.auto})</button>
    ${[...(v.rund ? [`<div class="abschnitt"><h3>🎉 Zum runden ${v.rund.alter}.</h3></div>`, ...v.rund.texte.map((x) => ggKarte(pid, x.nr, x.text, v.wahl, gesendet, "🎉")), '<div class="abschnitt"><h3>🎂 Alle Geburtstagsgrüße</h3></div>'] : []),
      ...v.texte.map((t, i) => ggKarte(pid, i + 1, t, v.wahl, gesendet, `${i + 1}.`))].join("")}
    <div class="knoepfe"><button class="knopf" onclick="$('ggWahlBlatt').remove();ggUebersicht()">🎂 Alle Geburtstage</button><button class="knopf" onclick="$('ggWahlBlatt').remove()">Schließen</button></div>`);
  if (v.wahl) setTimeout(() => document.querySelector(`#ggWahlBlatt [aria-pressed="true"]`)?.scrollIntoView({ block: "center" }), 50);
}
// 2.617.0 KC-CLUB-SPRUCH-ARCHIV: runder Geburtstag → eigene Grüße mit Alter (Nr. ab 101) stehen oben
const ggKarte = (pid, nr, t, wahl, gesendet, marke) => `<button type="button" class="karte" style="display:block;width:100%;text-align:left;white-space:pre-line${wahl === nr ? ";outline:3px solid var(--akzent, #2a7)" : ""}" ${gesendet ? "disabled" : ""} aria-pressed="${wahl === nr}" onclick="ggWaehlen('${esc(pid)}',${nr})"><b>${marke}</b> ${esc(t)}</button>`;
async function ggWaehlen(pid, nr) {
  try { await api("geb_gruss", { a: "waehlen", person_id: pid, nr }); } catch (e) { return meldeFehler(e); }
  melde(nr ? `✍️ ${ggNr(nr)} ausgewählt – geht kurz nach 0 Uhr raus.` : "🤖 Automatisch – ein passender Gruß geht kurz nach 0 Uhr raus.");
  $("ggWahlBlatt")?.remove(); ggUebersicht();
}
function buFest(art, pid) { return (art === "geb" ? BU_F?.geburtstage : BU_F?.jubilaeen)?.find((x) => x.person_id === pid); }
function buFestInfo(art, pid) {
  const f = buFest(art, pid); if (!f) return;
  blattAuf("buFest", `<div class="info-gross"><div style="font-size:3rem;line-height:1">${art === "geb" ? "🎂" : f.rund ? "🏆" : "🏅"}</div><h3 style="font-size:1.35rem;margin:4px 0">${esc(f.name)}</h3>
    <p style="margin:0">${art === "geb" ? (f.alter ? `wird <b>${f.alter}</b> – runder Geburtstag 🎉` : "hat Geburtstag") : `ist seit <b>${esc(f.eintritt)}</b> im Köcheclub – <b>${f.jahre} Jahre</b>${f.rund ? " 🎉" : ""}`}<br>📅 ${esc(buFTag(f))}</p></div>
    <div class="knoepfe" style="flex-direction:column;align-items:stretch">
      <button class="knopf haupt" onclick="$('buFest').remove();buFestNachricht('${art}','${pid}')">💬 Glückwunsch als Nachricht</button>
      <button class="knopf" onclick="$('buFest').remove();buFestBrief('${art}','${pid}')">✉️ Glückwunschkarte als Brief</button>
      <button class="knopf" onclick="$('buFest').remove();buFestPinnwand('${art}','${pid}')">📌 Gruß an die Pinnwand (für alle)</button>
      <button class="knopf" onclick="$('buFest').remove()">Schließen</button></div>`);
}
const buFestText = (art, f) => art === "geb" ? `Alles Gute zum ${f.alter ? f.alter + ". " : ""}Geburtstag, ${f.vorname}! 🎂🥳 Herzliche Grüße vom ganzen Köcheclub.`
  : `Herzlichen Glückwunsch, ${f.vorname}, zu ${f.jahre} Jahren im Köcheclub Werne! 🏅 Danke für deine Treue und deinen Einsatz.`;
async function buFestNachricht(art, pid) {
  const f = buFest(art, pid); if (!f) return;
  if (pid === ICH?.person_id) return melde("Das bist du selbst 😊", true);
  await direkt(pid); textVorbelegen(buFestText(art, f)); $("text").dispatchEvent(new Event("input")); entwurfMarkeZeigen?.();
  melde("💬 Text ist vorbereitet – ändern oder direkt mit ➤ senden");
}
function buFestBrief(art, pid) {
  const f = buFest(art, pid); if (!f) return;
  buBrief();
  Object.assign(BRIEF, { vorlage: "glueckwunsch", empfaenger: f.name, anrede: `Liebe/r ${f.vorname},`, gruss: "Herzliche Grüße",
    betreff: art === "geb" ? `Herzlichen Glückwunsch zum ${f.alter ? f.alter + ". " : ""}Geburtstag` : `Herzlichen Glückwunsch zu ${f.jahre} Jahren im Köcheclub Werne`,
    text: art === "geb" ? (f.alter ? `zu deinem ${f.alter}. Geburtstag` : "zu deinem Geburtstag") + " gratulieren wir dir im Namen aller Mitglieder des Köcheclubs Werne ganz herzlich.\n\nFür das neue Lebensjahr wünschen wir dir Gesundheit, Glück und viele schöne Stunden – gern auch in unserer Küche."
      : `seit ${f.eintritt} bist du Mitglied im Köcheclub Werne – das sind nun ${f.jahre} Jahre! Dafür möchten wir dir im Namen aller Mitglieder ganz herzlich danken.\n\nDeine Treue und dein Einsatz machen unseren Verein aus. Wir freuen uns auf viele weitere gemeinsame Jahre.` });
  briefMerken(); buZeigen();
}
function buFestPinnwand(art, pid) {
  const f = buFest(art, pid); if (!f) return;
  zeige("pinnwand"); pwForm(true);
  setTimeout(() => { const t = $("pwText"); if (!t) return; t.value = (art === "geb" ? `🎂 ${f.vorname} hat ${f.tage === 0 ? "heute" : "am " + fTagDp.format(new Date(f.datum + "T12:00:00Z"))} Geburtstag – herzlichen Glückwunsch!` : `🏅 ${f.vorname}: ${f.jahre} Jahre im Köcheclub – herzlichen Glückwunsch & danke!`).slice(0, 200); pwFuer?.("alle"); pwZaehlen?.(); }, 300);
}
// Ausdruck: Liste für den gewählten Zeitraum
function druckFeste() {
  const d = BU_F; if (!d) throw new Error("Bitte die Liste im Büro öffnen.");
  const alle = [...d.geburtstage.map((f) => ({ ...f, art: f.alter ? `🎉 ${f.alter}. Geburtstag` : "🎂 Geburtstag" })), ...d.jubilaeen.map((f) => ({ ...f, art: `🏅 ${f.jahre} Jahre im Club${f.rund ? " (rund)" : ""}` }))].sort((a, b) => a.datum.localeCompare(b.datum));
  const zeile = (f) => `<tr><td style="padding:1.5mm 2mm;border-bottom:.2mm solid #bbb;white-space:nowrap">${esc(fTagDp.format(new Date(f.datum + "T12:00:00Z")))}</td><td style="padding:1.5mm 2mm;border-bottom:.2mm solid #bbb"><b>${esc(f.name)}</b></td><td style="padding:1.5mm 2mm;border-bottom:.2mm solid #bbb">${esc(f.art)}</td><td style="padding:1.5mm 2mm;border-bottom:.2mm solid #bbb;width:30mm">☐ gratuliert</td></tr>`;
  return { titel: "Geburtstage & Jubiläen", unter: `${d.tage === 366 ? "Das nächste Jahr" : `Die nächsten ${d.tage} Tage`} ab ${dz(d.heute)}`, fuss: "Geburtstage nur bei Freigabe · Alter nur bei runden Geburtstagen mit eigener Freigabe",
    html: alle.length ? `<table style="width:100%;border-collapse:collapse;font-size:3.6mm"><thead><tr style="text-align:left;border-bottom:.5mm solid #741521"><th style="padding:1.5mm 2mm">Datum</th><th style="padding:1.5mm 2mm">Name</th><th style="padding:1.5mm 2mm">Anlass</th><th></th></tr></thead><tbody>${alle.map(zeile).join("")}</tbody></table>` : "<p>In diesem Zeitraum steht nichts an.</p>" };
}

// ---------- KC-CLUB-BUERO-MITGLIEDERLISTE (1.31.0, Wunsch Hansi): Mitgliederliste zum Drucken – Art antippen, Vorschau, drucken ----------
// Kontaktdaten nur nach den Regeln der Mitglieder-Seite (eigene, Admin, sonst nur Freigegebenes); Arten als Registry.
const ML_ARTEN = {
  uebersicht: { sym: "📇", t: "Übersicht", u: "Name · Ämter · Mitglied seit", spalten: ["name", "aemter", "eintritt"] },
  telefon: { sym: "📞", t: "Telefonliste", u: "Name · Handy · Festnetz · E-Mail", spalten: ["name", "handy", "festnetz", "mail"] },
  adressen: { sym: "🏠", t: "Adressliste", u: "Name · Anschrift", spalten: ["name", "adresse"] },
  // KC-CLUB-ML-ALLE (27.10.2026, Wunsch Hansi „eine Übersicht aller Mitgliederdaten mit Telefon und Adresse“): alles in einer Tabelle, quer gedruckt
  alle: { sym: "📋", t: "Alle Daten", u: "Telefon, E-Mail und Anschrift zusammen", spalten: ["nr", "name", "handy", "festnetz", "mail", "adresse"], quer: true },
  unterschrift: { sym: "✍️", t: "Unterschriften", u: "z. B. Anwesenheit, Empfang", spalten: ["nr", "name", "unterschrift"] },
  abhaken: { sym: "☑️", t: "Abhakliste", u: "z. B. Beitrag, Rückmeldung", spalten: ["nr", "name", "haken", "notiz"] },
  // 2.721.0 KC-CLUB-ANFAHRT (Wunsch Hansi „aus den Adressen eine km-Anzeige machen“): Wohnort und Entfernung zum Markt, weiteste zuerst
  anfahrt: { sym: "🚗", t: "Anfahrt", u: "Wohnort · km zum Markt Werne", spalten: ["nr", "name", "ort", "anfahrt"], sortKm: true },
};
const ML_SPALTEN = { ort: "Wohnort", anfahrt: "Anfahrt zum Markt", nr: "Nr.", name: "Name", aemter: "Ämter", eintritt: "Mitglied seit", handy: "Handy", festnetz: "Festnetz", mail: "E-Mail", adresse: "Anschrift", unterschrift: "Unterschrift", haken: "✓", notiz: "Notiz" };
let ML = { daten: null, art: "uebersicht", sort: "name", titel: "" };
async function buListe() {
  BU.sicht = "liste"; buZeigen(); window.scrollTo(0, 0);
  try { [ML.daten] = await Promise.all([api("buero_mitgliederliste"), ICH?.vorstand || ICH?.admin ? aeEingangLaden().catch(() => null) : null]); } catch (e) { return meldeFehler(e); }
  if (aktuelleAnsicht === "buero" && BU.sicht === "liste") buZeigen();
}
function mlZeilen() {
  const l = (ML.daten?.liste || []).slice();
  if (ML_ARTEN[ML.art]?.sortKm) return l.sort((a, b) => (b.anfahrt?.luft ?? -1) - (a.anfahrt?.luft ?? -1) || a.nachname.localeCompare(b.nachname)); // 2.721.0: weiteste Anfahrt zuerst
  return ML.sort === "eintritt" ? l.sort((a, b) => (a.eintritt || "9999").localeCompare(b.eintritt || "9999") || a.nachname.localeCompare(b.nachname))
    : l.sort((a, b) => a.nachname.localeCompare(b.nachname) || a.name.localeCompare(b.name));
}
function mlWert(m, s, i) {
  const k = m.kontakt || {};
  return { ort: m.anfahrt?.ort || "", anfahrt: anfahrtText(m.anfahrt), nr: String(i + 1), name: m.name, aemter: (m.aemter || []).join(", "), eintritt: m.eintritt ? m.eintritt.split("-").reverse().join(".") : "", handy: k.handy || "", festnetz: k.festnetz || "", mail: k.mail || "", adresse: k.adresse || "", unterschrift: "", haken: "☐", notiz: "" }[s] ?? "";
}
function buListeHtml() {
  const d = ML.daten, a = ML_ARTEN[ML.art];
  const vorschau = d ? `<div class="karte" style="overflow-x:auto"><table class="ml-tab"><thead><tr>${a.spalten.map((s) => `<th>${esc(ML_SPALTEN[s])}</th>`).join("")}</tr></thead>
    <tbody>${mlZeilen().map((m, i) => `<tr>${a.spalten.map((s) => `<td>${esc(mlWert(m, s, i))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : '<div class="karte hinweis">Wird geladen …</div>';
  const hinweis = d && d.verborgen && ["telefon", "adressen", "alle"].includes(ML.art) ? `<p class="hinweis">🔒 ${d.verborgen} Angabe${d.verborgen === 1 ? " ist" : "n sind"} nicht freigegeben und ${d.verborgen === 1 ? "bleibt" : "bleiben"} leer.</p>` : "";
  // KC-CLUB-AENDERUNG (2.22.10, Wunsch Hansi): Änderungsmeldungen + Größen gehören in den Ordner „Mitglieder“ (vorher eigener Ordner)
  const ae = `<button class="knopf${AE.offen ? " haupt" : ""}" style="width:100%;margin-bottom:8px" onclick="aeEingang()">📬 Änderungsmeldungen${AE.offen ? ` – ${AE.offen} offen` : ""} · 👕 Größen</button>`;
  return `${ae}<div class="karte bu-gruss">📇 <b>Mitgliederliste</b> – Art antippen, prüfen, drucken. ${d ? `${d.liste.length} aktive Mitglieder.` : ""}</div>
    <div class="mini-kacheln">${Object.entries(ML_ARTEN).map(([k, x]) => `<button class="mini-kachel${ML.art === k ? " mk-offen" : ""}" onclick="ML.art='${k}';buZeigen()"><span class="mk-sym">${x.sym}</span><span class="mk-titel">${esc(x.t)}</span><span class="mk-unter">${esc(x.u)}</span></button>`).join("")}</div>
    <div class="hl-chips" style="margin-top:8px"><button class="chip${ML.sort === "name" ? " an" : ""}" onclick="ML.sort='name';buZeigen()">🔤 nach Name</button><button class="chip${ML.sort === "eintritt" ? " an" : ""}" onclick="ML.sort='eintritt';buZeigen()">📅 nach Eintritt</button></div>
    ${["unterschrift", "abhaken"].includes(ML.art) ? `<label class="feld">Überschrift (freiwillig)<input maxlength="100" placeholder="${ML.art === "unterschrift" ? "z. B. Anwesenheit Jahreshauptversammlung" : "z. B. Jahresbeitrag 2027"}" value="${esc(ML.titel)}" oninput="ML.titel=this.value;lvAuffrischen()"></label>` : ""}
    ${hinweis}${d ? lvKasten() : vorschau}
    <div class="bu-leiste"><div class="knoepfe" style="margin:0"><button class="knopf haupt" style="flex:1;text-align:center" ${d ? "" : "disabled"} onclick="druckStarten('mitgliederliste')">🖨️ Vorschau & Drucken</button><button class="knopf" onclick="buZurueck()">🗂️ Büro</button></div></div>`;
}
function druckMitgliederliste() {
  const d = ML.daten, a = ML_ARTEN[ML.art]; if (!d) throw new Error("Bitte die Liste im Büro öffnen.");
  const breit = { nr: "8mm", haken: "10mm", unterschrift: "60mm", notiz: "45mm" };
  const hoch = ["unterschrift", "abhaken"].includes(ML.art) ? "height:9mm;" : "";
  const zelle = "padding:1.4mm 2mm;border-bottom:.2mm solid #999;vertical-align:middle;";
  const html = `<table style="width:100%;border-collapse:collapse;font-size:3.5mm"><thead><tr style="text-align:left;border-bottom:.5mm solid #741521">${a.spalten.map((s) => `<th style="padding:1.4mm 2mm;${breit[s] ? `width:${breit[s]};` : ""}">${esc(ML_SPALTEN[s])}</th>`).join("")}</tr></thead>
    <tbody>${mlZeilen().map((m, i) => `<tr style="break-inside:avoid">${a.spalten.map((s) => `<td style="${zelle}${hoch}${s === "name" ? "font-weight:700;" : ""}">${esc(mlWert(m, s, i))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const privat = ["telefon", "adressen", "alle"].includes(ML.art);
  return { titel: ML.titel.trim() || `Mitgliederliste – ${a.t}`, unter: `${d.liste.length} aktive Mitglieder · ${ML.sort === "eintritt" ? "nach Eintritt" : "nach Name"}${ML.titel.trim() ? " · " + a.t : ""}`, html,
    fuss: privat ? "Vertraulich – nur für Vereinszwecke, nicht weitergeben · nur freigegebene Angaben" : "", quer: !!a.quer }; // KC-CLUB-ML-ALLE: „Alle Daten“ quer
}

// ---------- KC-CLUB-FREUD-LEID (1.32.0, Wunsch Hansi): Freud & Leid – nur Clubleitung ----------
// Fall anlegen in drei Schritten (Was? – Wen? – Was ist zu tun?), Checkliste aus der Server-Registry mit Wer/Bis wann vorbelegt.
let FL = { d: null, neu: null, fall: null };
async function flLaden(opt = {}) { try { const r = await api("fl_liste", {}, opt); FL.d = r && Array.isArray(r.faelle) ? r : null; } catch { FL.d = null; } return FL.d; }
function buFreudLeid() { BU.sicht = "fl"; buZeigen(); Promise.all([flLaden(), BU_F ? null : buFesteListe(60)]).then(() => { if (aktuelleAnsicht === "buero" && BU.sicht === "fl") buZeigen(); }); window.scrollTo(0, 0); } // 2.129.0: Geburtstage gleich mit laden
const flArt = (k) => FL.d?.arten?.[k] || { sym: "🤍", t: k, gruppe: "freude" };
const flLeid = (f) => flArt(f.art).gruppe === "leid";
function flKachel(f) {
  const a = flArt(f.art), n = f.schritte.length;
  return `<button class="mini-kachel${f.status === "offen" && flLeid(f) ? " fl-leid" : f.status === "offen" ? " mk-offen" : ""}" onclick="flFall('${f.id}')"><span class="mk-sym">${a.sym}</span>
    <span class="mk-titel">${esc(f.name || "?")}</span><span class="mk-unter">${esc(a.t)}</span><span class="mk-unter">${f.status === "offen" ? `✔️ ${f.erledigt} von ${n} erledigt` : "✅ abgeschlossen"}</span></button>`;
}
function buFlHtml() {
  const d = FL.d; if (!d) return '<div class="karte hinweis">Wird geladen …</div>';
  const offen = d.faelle.filter((f) => f.status === "offen"), zu = d.faelle.filter((f) => f.status !== "offen");
  return `<div class="karte bu-gruss">🤍 <b>Freud & Leid</b> – was im Leben unserer Mitglieder passiert und was der Club daraus macht. <small class="hinweis">Nur für die Clubleitung sichtbar.</small></div>
    <button class="knopf haupt hl-gross" onclick="flNeu()">＋ Neuer Fall</button>
    <div class="abschnitt"><h3>Offen</h3></div>${offen.length ? `<div class="mini-kacheln">${offen.map(flKachel).join("")}</div>` : '<div class="karte hinweis">Gerade nichts offen.</div>'}
    ${zu.length ? `<details class="karte"><summary><b>Abgeschlossen (${zu.length})</b></summary><div class="mini-kacheln" style="margin-top:8px">${zu.map(flKachel).join("")}</div></details>` : ""}
    ${flFesteHtml()}
    <div class="knoepfe"><button class="knopf" onclick="buZurueck()">🗂️ Zurück ins Büro</button></div>`;
}
// 2.129.0 KC-CLUB-FL-GEBURTSTAGE (Wunsch Hansi): Geburtstage & Jubiläen gehören zu „Freud & Leid“ – als Klappbereich mit den nächsten 30 Tagen;
// „Alle anzeigen“ öffnet die volle Liste (Zeitraum, Drucken, Gratulieren) und führt zurück hierher.
function flFesteHtml() {
  const d = BU_F; if (!d) return '<details class="karte"><summary><b>🎂 Geburtstage & Jubiläen</b></summary><p class="hinweis">Wird geladen …</p></details>';
  const alle = [...d.geburtstage.map((f) => ({ ...f, art: "geb" })), ...d.jubilaeen.map((f) => ({ ...f, art: "jub" }))].filter((f) => f.tage >= 0 && f.tage <= 30).sort((a, b) => a.datum.localeCompare(b.datum));
  const bald = alle.filter((f) => f.tage <= 7).length;
  return `<details class="karte"${bald ? " open" : ""}><summary style="display:list-item"><b>🎂 Geburtstage & Jubiläen</b><br><small class="hinweis">${alle.length} in den nächsten 30 Tagen${bald ? ` · ${bald} diese Woche` : ""}</small></summary>
    ${alle.length ? `<div class="mini-kacheln" style="margin-top:8px">${alle.map((f) => buFesteKachel(f, f.art)).join("")}</div>` : '<p class="hinweis">In den nächsten 30 Tagen steht nichts an.</p>'}
    <button class="knopf klein" style="margin-top:8px" onclick="buFeste(true)">🗓️ Alle anzeigen · drucken</button></details>`;
}
// --- neuer Fall ---
function flBis(regel) {
  const h = heuteIso();
  if (regel === "sofort") return h;
  if (regel === "termin") return FL.neu?.termin ? FL.neu.termin.slice(0, 10) : tagPlus(h, 5);
  if (regel === "sitzung") { const t = (BU.start?.sitzungen || []).find((x) => new Date(x.beginn) > Date.now()); return t ? berlinIso(t.beginn) : tagPlus(h, 14); }
  return /^\d+$/.test(regel || "") ? tagPlus(h, Number(regel)) : "";
}
function flWer(rolle) { const r = FL.d?.rollen || {}; return rolle === "alle" ? "alle" : (r[rolle] || []).find((id) => MITGLIEDER?.some((m) => m.person_id === id)) || ""; }
async function flNeu() {
  if (!MITGLIEDER) try { await mitgliederHolen(); } catch (e) { return meldeFehler(e); }
  if (!FL.d) await flLaden();
  FL.neu = { art: "", person: "", notiz: "", datum: heuteIso(), termin: "", terminZeit: "11:00", ort: "", betrag: "", schritte: [], mitteilen: true };
  BU.sicht = "flneu"; buZeigen(); window.scrollTo(0, 0);
}
function flArtWahl(k) {
  const a = flArt(k); FL.neu.art = k; FL.neu.betrag = a.betrag ?? "";
  FL.neu.schritte = (a.schritte || []).map((s) => ({ an: true, text: s.t, wer: flWer(s.wer), regel: s.bis || "", bis: flBis(s.bis) }));
  buZeigen();
}
function flTermin(el, feld) { FL.neu[feld] = el.value; if (feld === "termin") FL.neu.schritte.forEach((s) => { if (s.regel === "termin") s.bis = el.value || s.bis; }); buZeigen(); }
function buFlNeuHtml() {
  const n = FL.neu, d = FL.d; if (!n || !d) return '<div class="karte hinweis">Wird geladen …</div>';
  const gruppe = (g, titel) => `<div class="hl-frage">${titel}</div><div class="mini-kacheln">${Object.entries(d.arten).filter(([, a]) => a.gruppe === g).map(([k, a]) => `<button class="mini-kachel${n.art === k ? (g === "leid" ? " fl-leid" : " mk-offen") : ""}" onclick="flArtWahl('${k}')"><span class="mk-sym">${a.sym}</span><span class="mk-titel">${esc(a.t)}</span></button>`).join("")}</div>`;
  const a = n.art ? flArt(n.art) : null, leid = a?.gruppe === "leid", tod = /^tod_/.test(n.art);
  const mg = MITGLIEDER.slice().sort((x, y) => x.name.localeCompare(y.name));
  const werChips = (i, s) => `<select onchange="FL.neu.schritte[${i}].wer=this.value" style="max-width:100%"><option value="">– noch offen –</option>${s.wer === "alle" || /Mitglieder fragen|wer mitkommt/i.test(s.text) ? `<option value="alle" ${s.wer === "alle" ? "selected" : ""}>👥 Aufruf an alle</option>` : ""}${mg.map((m) => `<option value="${m.person_id}" ${s.wer === m.person_id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select>`;
  return `<div class="karte"><h3 style="margin-top:0">1️⃣ Was ist passiert?</h3>${gruppe("freude", "🎉 Freude")}${gruppe("leid", "🕯️ Leid")}</div>
    ${a ? `<div class="karte"><h3 style="margin-top:0">2️⃣ Wen betrifft es?</h3>
      <div class="hl-chips">${mg.map((m) => `<button class="chip${n.person === m.person_id ? " an" : ""}" onclick="FL.neu.person='${m.person_id}';buZeigen()">${esc(m.name)}</button>`).join("")}</div>
      <label class="feld">Kurze Notiz (freiwillig)<input maxlength="500" placeholder="${leid ? "z. B. Mutter verstorben" : "z. B. Enkelin Mia geboren"}" value="${esc(n.notiz)}" oninput="FL.neu.notiz=this.value"></label>
      ${tod || leid ? `<div class="zwei"><label class="feld">${tod ? "Beerdigung am" : "Termin (freiwillig)"}<input type="date" value="${esc(n.termin)}" onchange="flTermin(this,'termin')"></label><label class="feld">Uhrzeit<input type="time" value="${esc(n.terminZeit)}" onchange="FL.neu.terminZeit=this.value"></label></div>
        <label class="feld">Ort${tod ? " (Friedhof/Kirche)" : ""}<input maxlength="120" value="${esc(n.ort)}" oninput="FL.neu.ort=this.value"></label>` : ""}
      <label class="feld">Betrag für Blumen/Geschenk (€)<input type="number" min="0" max="10000" step="1" value="${esc(n.betrag)}" oninput="FL.neu.betrag=this.value" placeholder="offen"></label></div>
    <div class="karte"><h3 style="margin-top:0">3️⃣ Was ist zu tun?</h3><p class="hinweis" style="margin:0 0 6px">Vorschlag – Häkchen weg, wenn etwas nicht passt. Zuständige bekommen ihre Aufgabe mit Erinnerung.</p>
      ${n.schritte.map((s, i) => `<div class="fl-schritt${s.an ? "" : " aus"}"><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" ${s.an ? "checked" : ""} onchange="FL.neu.schritte[${i}].an=this.checked;buZeigen()"><span><b>${esc(s.text)}</b></span></label>
        ${s.an ? `<div class="zwei" style="margin-top:6px">${werChips(i, s)}<input type="date" value="${esc(s.bis)}" onchange="FL.neu.schritte[${i}].bis=this.value"></div>` : ""}</div>`).join("")}
      <div class="zwei" style="align-items:end;margin-top:6px"><label class="feld" style="margin:0">Eigener Schritt<input id="flEigen" maxlength="200" placeholder="z. B. Trauerkarte in die Zeitung"></label><button class="knopf" onclick="flEigen()">＋ Dazu</button></div>
      <label class="schalter" style="margin-top:8px"><span>Zuständige gleich benachrichtigen</span><input type="checkbox" ${n.mitteilen ? "checked" : ""} onchange="FL.neu.mitteilen=this.checked"></label></div>
    <div class="bu-leiste"><div class="knoepfe" style="margin:0"><button class="knopf haupt" style="flex:1;text-align:center" onclick="flSpeichern(this)">✅ Fall anlegen</button><button class="knopf" onclick="buFreudLeid()">Abbrechen</button></div></div>` : ""}`;
}
function flEigen() { const t = ($("flEigen")?.value || "").trim(); if (!t) return melde("Bitte kurz eintragen, was zu tun ist.", true); FL.neu.schritte.push({ an: true, text: t, wer: "", regel: "", bis: "" }); buZeigen(); }
async function flSpeichern(knopf) {
  const n = FL.neu;
  if (!n.art) return melde("Bitte antippen, was passiert ist.", true);
  if (!n.person) return melde("Bitte antippen, wen es betrifft.", true);
  const termin = n.termin ? new Date(taZeitpunkt(n.termin, n.terminZeit || "11:00")).toISOString() : null;
  await einmal(knopf, async () => {
    try {
      const r = await api("fl_anlegen", { art: n.art, person_id: n.person, notiz: n.notiz, datum: n.datum, termin, termin_ort: n.ort, betrag: n.betrag === "" ? null : Number(n.betrag), mitteilen: n.mitteilen,
        schritte: n.schritte.filter((s) => s.an).map((s) => ({ text: s.text, wer: s.wer === "alle" ? null : s.wer || null, alle: s.wer === "alle", bis: s.bis || null })) });
      melde("✅ Fall angelegt"); await flLaden(); flFall(r.id, true);
    } catch (e) { meldeFehler(e); }
  });
}
// --- Fall ansehen / bearbeiten ---
function flFall(id, nachAnlegen) {
  FL.fall = id; BU.sicht = "fall"; buZeigen(); window.scrollTo(0, 0);
  const f = FL.d?.faelle.find((x) => x.id === id);
  if (nachAnlegen && f && f.schritte.some((s) => s.alle) && !f.informiert_am)
    buWeiterFragen("✅ Fall angelegt", flLeid(f) ? "Möchtest du die Mitglieder jetzt informieren und fragen, wer zur Beerdigung mitkommt? (Bitte vorher mit der Familie absprechen.)" : "Möchtest du die Mitglieder jetzt informieren?",
      [["📣 Mitglieder informieren", `flInformieren('${id}')`, true], ["Später", "void 0"]]);
}
function buFallHtml() {
  const f = FL.d?.faelle.find((x) => x.id === FL.fall); if (!f) return '<div class="karte hinweis">Fall nicht gefunden.</div><div class="knoepfe"><button class="knopf" onclick="buFreudLeid()">‹ Zurück</button></div>';
  const a = flArt(f.art), leid = flLeid(f), offen = f.status === "offen";
  return `<div class="karte bu-kopf${leid ? " fl-kopf-leid" : ""}"><div style="font-size:2.4rem">${a.sym}</div><div><b>${esc(a.t)}</b><br><span style="font-size:1.15rem;font-weight:800">${esc(f.name || "")}</span>
      ${f.notiz ? `<br>${esc(f.notiz)}` : ""}${f.termin ? `<br>🗓️ ${esc(wann(f.termin, true))}${f.termin_ort ? " · 📍 " + esc(f.termin_ort) : ""}` : ""}${f.betrag !== null ? `<br>💶 ${esc(spEuro(f.betrag))}` : ""}</div></div>
    <div class="karte"><h3 style="margin-top:0">✔️ Was ist zu tun? <span class="marke ${f.erledigt === f.schritte.length ? "gruen" : "gelb"}">${f.erledigt} von ${f.schritte.length}</span></h3>
      ${f.schritte.map((s) => `<div class="zeile"><button class="knopf klein ${s.erledigt ? "gruen" : ""}" ${offen ? "" : "disabled"} onclick="flSchritt('${f.id}','${s.id}', ${!s.erledigt})">${s.erledigt ? "✔" : "☐"}</button>
        <div style="flex:1${s.erledigt ? ";text-decoration:line-through;opacity:.6" : ""}"><b>${esc(s.text)}</b><div class="hinweis" style="font-size:.85rem">${s.alle ? "👥 Aufruf an alle" : s.werName ? "👤 " + esc(s.werName) : "noch offen, wer"}${s.bis ? " · " + faelligText(s.bis) : ""}${s.mitgeteilt ? " · 📨 mitgeteilt" : ""}</div></div>
        ${offen ? `<button class="knopf klein" aria-label="Schritt löschen" onclick="flSchrittWeg('${f.id}','${s.id}')">🗑️</button>` : ""}</div>`).join("") || '<p class="hinweis">Keine Schritte.</p>'}
      ${offen ? `<div class="zwei" style="align-items:end;margin-top:8px"><label class="feld" style="margin:0">Weiterer Schritt<input id="flNeuSchritt" maxlength="200" placeholder="z. B. Danke-Karte der Familie aushängen"></label><button class="knopf" aria-label="Schritt hinzufügen" onclick="flSchrittNeu('${f.id}')">＋</button></div>` : ""}</div>
    ${f.aufruf ? `<div class="karte"><b>🚶 ${/^tod_/.test(f.art) ? "Abordnung zur Beerdigung" : "Begleitung"}:</b> ${f.aufruf.kommen.length ? esc(f.aufruf.kommen.join(", ")) : "noch keine Zusagen"}</div>` : ""}
    ${offen ? `<div class="mini-kacheln">
      <button class="mini-kachel" onclick="flInformieren('${f.id}')"><span class="mk-sym">📣</span><span class="mk-titel">Mitglieder informieren</span><span class="mk-unter">${f.informiert_am ? "✅ " + esc(zeitKurz(f.informiert_am)) : leid ? "nach Absprache mit der Familie" : "Push / E-Mail"}</span></button>
      <button class="mini-kachel" onclick="flKarte('${f.id}')"><span class="mk-sym">✉️</span><span class="mk-titel">Karte / Brief</span><span class="mk-unter">${leid ? "Beileid · Genesung" : "Glückwunsch"}</span></button>
      ${f.person_id && !leid ? `<button class="mini-kachel" onclick="direkt('${f.person_id}')"><span class="mk-sym">💬</span><span class="mk-titel">Nachricht an ${esc((f.name || "").split(" ")[0])}</span></button>` : ""}
      <button class="mini-kachel" onclick="flAngaben('${f.id}')"><span class="mk-sym">✏️</span><span class="mk-titel">Angaben ändern</span><span class="mk-unter">Termin · Ort · Betrag</span></button>
      <button class="mini-kachel" onclick="flAbschliessen('${f.id}')"><span class="mk-sym">✅</span><span class="mk-titel">Fall abschließen</span><span class="mk-unter">wird im Archiv abgelegt</span></button></div>` : '<p class="hinweis">Abgeschlossen – liegt im Archiv (Ordner „Admin“, Register „Freud & Leid“).</p>'}
    <div class="knoepfe"><button class="knopf" onclick="buFreudLeid()">🤍 Alle Fälle</button><button class="knopf" onclick="buZurueck()">🗂️ Büro</button></div>`;
}
async function flAendern(id, daten, meldung) {
  try { await api("fl_aendern", { id, ...daten }); if (meldung) melde(meldung); await flLaden(); buZeigen(); } catch (e) { meldeFehler(e); }
}
const flSchritt = (id, sid, erledigt) => flAendern(id, { was: "schritt_erledigt", schritt_id: sid, erledigt }, erledigt ? "✔ Erledigt" : "Wieder offen");
const flSchrittWeg = async (id, sid) => { if ((await frage("Diesen Schritt streichen?"))) flAendern(id, { was: "schritt_weg", schritt_id: sid }, "Gestrichen"); };
const flSchrittNeu = (id) => { const t = ($("flNeuSchritt")?.value || "").trim(); if (!t) return melde("Bitte kurz eintragen, was zu tun ist.", true); flAendern(id, { was: "schritt_neu", text: t }, "＋ Schritt ergänzt"); };
function flAngaben(id) {
  const f = FL.d.faelle.find((x) => x.id === id); if (!f) return;
  const tag = f.termin ? berlinIso(f.termin) : "", zeit = f.termin ? fZeit.format(new Date(f.termin)) : "11:00";
  blattAuf("flAng", `${einwHtml("b-fl-angaben")}<h3 style="margin-top:0">✏️ Angaben ändern</h3>
    <label class="feld">Notiz<input id="flAN" maxlength="500" value="${esc(f.notiz || "")}"></label>
    <div class="zwei"><label class="feld">Termin<input id="flAT" type="date" value="${tag}"></label><label class="feld">Uhrzeit<input id="flAZ" type="time" value="${zeit}"></label></div>
    <label class="feld">Ort<input id="flAO" maxlength="120" value="${esc(f.termin_ort || "")}"></label>
    <label class="feld">Betrag (€)<input id="flAB" type="number" min="0" max="10000" value="${f.betrag ?? ""}"></label>
    <div class="knoepfe"><button class="knopf haupt" onclick="flAngabenSpeichern('${id}')">💾 Speichern</button><button class="knopf" onclick="$('flAng').remove()">Abbrechen</button></div>`);
}
function flAngabenSpeichern(id) {
  const t = $("flAT").value, termin = t ? new Date(taZeitpunkt(t, $("flAZ").value || "11:00")).toISOString() : null;
  const b = $("flAB").value; $("flAng").remove();
  flAendern(id, { was: "angaben", notiz: $("flAN")?.value ?? "", termin, termin_ort: $("flAO")?.value ?? "", betrag: b === "" ? null : Number(b) }, "Gespeichert");
}
// Mitglieder informieren – bei Leid ruhiger Textvorschlag und Rückfrage „mit der Familie abgesprochen?“
function flInformieren(id) {
  const f = FL.d.faelle.find((x) => x.id === id); if (!f) return;
  const leid = flLeid(f), tod = /^tod_/.test(f.art), vn = (f.name || "").split(" ")[0];
  const vorschlag = f.art === "tod_mitglied" ? `in tiefer Trauer müssen wir euch mitteilen, dass unser Mitglied ${f.name} verstorben ist. Unsere Gedanken sind bei der Familie.${f.termin ? `\n\nDie Beerdigung ist am ${wann(f.termin, true)}${f.termin_ort ? " in " + f.termin_ort : ""}.` : ""}`
    : f.art === "tod_angehoeriger" ? `leider müssen wir euch mitteilen, dass ${vn} einen nahen Angehörigen verloren hat${f.notiz ? ` (${f.notiz})` : ""}. Wir sind in Gedanken bei ${vn} und der Familie.${f.termin ? `\n\nDie Beerdigung ist am ${wann(f.termin, true)}${f.termin_ort ? " in " + f.termin_ort : ""}.` : ""}`
    : leid ? `${vn} geht es gerade nicht gut${f.notiz ? ` (${f.notiz})` : ""}. Ein kurzer Gruß oder eine Nachricht freut sicher sehr.`
    : `schöne Nachricht: ${f.name} – ${flArt(f.art).t}${f.notiz ? ` (${f.notiz})` : ""}! Herzlichen Glückwunsch vom ganzen Club. 🎉`;
  window.__flSend = { id, wege: [] };
  blattAuf("flInfo", `${einwHtml("b-fl-informieren")}<h3 style="margin-top:0">📣 Mitglieder informieren</h3>
    <label class="feld">Text (ändern, wie es passt)<textarea id="flIT" rows="6" maxlength="1000">${esc(vorschlag)}</textarea></label>
    ${tod && !f.aufruf ? `<label class="schalter"><span><b>🚶 Fragen, wer zur Beerdigung mitkommt</b><br><small class="hinweis">Mitglieder sagen mit „✋ Ich komme“ zu</small></span><input type="checkbox" id="flIA" checked></label>` : ""}
    ${leid ? `<label class="schalter fl-abgesprochen"><span><b>Mit der Familie abgesprochen?</b><br><small class="hinweis">Bitte erst senden, wenn die Familie einverstanden ist.</small></span><input type="checkbox" id="flIOK"></label>` : ""}
    <div class="hinweis" style="margin:4px 0">Wie benachrichtigen?</div>
    <div class="hl-chips" id="flWege">${[["", "⚙️ Wie eingestellt"], ["push", "🔔 Push"], ["email", "✉️ E-Mail"], ["beide", "🔔+✉️ Beides"]].map(([w, t]) => `<button class="chip${w === "" ? " an" : ""}" data-w="${w}" onclick="window.__flSend.wege=('${w}'==='beide'?['push','email']:'${w}'?['${w}']:[]);document.querySelectorAll('#flWege .chip').forEach((b)=>b.classList.toggle('an',b.dataset.w==='${w}'))">${t}</button>`).join("")}</div>
    <div class="knoepfe" style="flex-direction:column;align-items:stretch"><button class="knopf haupt" style="text-align:center" onclick="flSenden(this)">📣 An alle Mitglieder senden</button><button class="knopf" style="text-align:center" onclick="$('flInfo').remove()">Abbrechen</button></div>`);
}
async function flSenden(knopf) {
  const x = window.__flSend, f = FL.d.faelle.find((y) => y.id === x.id), leid = flLeid(f);
  if (leid && !$("flIOK")?.checked) return melde("Bitte zuerst bestätigen, dass es mit der Familie abgesprochen ist.", true);
  if (!(await frage("Nachricht jetzt an alle Mitglieder senden?"))) return;
  await einmal(knopf, async () => {
    try {
      const r = await api("fl_informieren", { id: x.id, text: $("flIT").value, abgesprochen: leid ? true : undefined, abordnung: !!$("flIA")?.checked, wege: x.wege });
      $("flInfo")?.remove(); melde(`📣 ${r.empfaenger} Mitglieder informiert${r.aufruf ? " – Zusagen erscheinen hier" : ""}`); await flLaden(); buZeigen();
    } catch (e) { meldeFehler(e); }
  });
}
function flKarte(id) {
  const f = FL.d.faelle.find((x) => x.id === id); if (!f) return;
  const k = /^tod_/.test(f.art) ? "beileid" : ["krankheit", "unfall"].includes(f.art) ? "genesung" : f.art === "geburt" ? "geburt" : ["hochzeit", "ehejubilaeum"].includes(f.art) ? "hochzeit" : "glueckwunsch";
  buBrief(); const v = BRIEF_VORLAGEN[k];
  Object.assign(BRIEF, { vorlage: k, empfaenger: f.art === "tod_mitglied" ? `Familie ${(f.name || "").split(" ").slice(-1)[0]}` : f.name, betreff: v.betreff, text: v.text,
    anrede: f.art === "tod_mitglied" ? "Liebe Familie,": `Liebe/r ${(f.name || "").split(" ")[0]},`, gruss: /^tod_/.test(f.art) ? "In stiller Anteilnahme" : "Herzliche Grüße" });
  briefMerken(); buZeigen();
}
async function flAbschliessen(id) {
  const f = FL.d.faelle.find((x) => x.id === id);
  const offen = f ? f.schritte.length - f.erledigt : 0;
  if (!(await frage(`Fall abschließen?${offen ? `\n\nNoch ${offen} Schritt(e) offen.` : ""}\n\nEr wird im Archiv abgelegt (Ordner „Admin“, Register „Freud & Leid“).`))) return;
  try { const r = await api("fl_abschliessen", { id }); melde(r.abgelegt ? "✅ Abgeschlossen und im Archiv abgelegt" : "✅ Abgeschlossen (Archiv-Ablage hat nicht geklappt)"); await flLaden(); buFreudLeid(); }
  catch (e) { meldeFehler(e); }
}
