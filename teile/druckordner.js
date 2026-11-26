// ---------- KC-CLUB-DRUCKORDNER (Wunsch Hansi 26.11.2026 „Druckordner ähnlich wie die Aktentasche: verschiedene Preislisten, Etiketten,
// Kassen-QR-Codes reinlegen, dahinter die Anzahl, dann wird alles gedruckt – als Druckvorlagen Weihnachtsmarkt 2026 speichern“; dazu
// „anhaken und alle übernehmen statt eins wählen – zurück – wieder eins“, „keine alten Archiv-Sachen“, „interne Preisliste mit Mengen in
// Weinrot mit Logo und Gold, groß oben ‚Interne Preisliste‘“, „Kassen-Codes: oben wie gehabt, unten als Ausschneide-Scheckkarte, dann Pfand-
// artikel und Bezahl-Code, jeweils die gewünschte Menge“). Büro → 🖨️ Drucker → 🗂️ Druckordner (nur Clubleitung).
// EINE Seite, nichts springt zurück: Haken und − Anzahl + direkt an jeder Zeile. Alles „lebend“ aus den aktuellen Artikeldaten (wie die
// Preisetiketten: vom PC-Manager veröffentlicht, sonst Grundstand der Kasse) – nie veraltet. Aus dem Archiv nur der Büro-Ordner „Weihnachtsmarkt“.
// Gespeichert wie das Druckpaket der Schilder-Druckerei (kc_club_schilder, daten.vorlage = "druckpaket", Teile mit typ live/etikett/karte/archiv).
// Gedruckt: jede Seite als A4-Bild (Querformat gedreht), alles hintereinander über den zentralen Druck (randlos; dort auch 📄 PDF).

const DO = { auswahl: new Map(), id: null, titel: "Druckvorlagen Weihnachtsmarkt 2026", archiv: [], format: 6, formatK: 5, kassen: [], seiten: [], geladen: false };
const DO_FEST = [["kpl", "📋", "Kundenpreisliste", "Entwurf 20 · A4 quer · Preise zzgl. Pfand"], ["mpl", "📊", "Interne Preisliste", "Mengen 1–10 inkl. Pfand · nur für Mitarbeiter · A4 quer"],
  ["allergene", "🧾", "Allergen-Aushang", "Allergene & Zusatzstoffe aus den Artikeldaten · A4 quer"]];
const doKey = (typ, ref) => `${typ}:${ref}`;
const doGet = (typ, ref) => DO.auswahl.get(doKey(typ, ref)) || { n: 0, an: false };
function doSet(typ, ref, n, titel) { const k = doKey(typ, ref), alt = DO.auswahl.get(k) || {}; n = Math.max(0, Math.min(50, n)); DO.auswahl.set(k, { typ, ref, titel: titel || alt.titel || ref, n, an: n > 0 }); }
const doGeld = (v) => Number(v || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const doPfand = (a) => (Array.isArray(a?.pfand) ? a.pfand : []).reduce((s, k) => s + (Number(k?.betrag) || 0), 0);
// Artikel: wie bei den Preisetiketten (PE.artikel, schon sortiert, inkl. Kassen-Code BAR); ohne inaktive (der PC-Manager veröffentlicht nur aktive)
const doArtikel = () => (PE.artikel || []).filter((a) => a && a.nummer && a.name);
const doVerkauf = () => doArtikel().filter((a) => !a.spezial && !/^(Pfand|Sonstiges)$/i.test(a.kategorie || "") && Number(a.preis) > 0);
const doPfandArt = () => doArtikel().filter((a) => /^Pfand$/i.test(a.kategorie || ""));
// 26.11.2026 (Hansi: „Glaspfand und Feuerzange und Check-Out müssen wie die anderen Etiketten sein, in z. B. 5 × 5. Nur die 3 Kassen-QR-Codes
// zum Verbinden sollen im Scheckkarten-Format sein“): Pfandartikel (Pfand, Rückgaben) und BAR sind Etiketten mit eigener Größe (Vorgabe 5 cm);
// Scheckkarten gibt es nur für die QR-Codes, mit denen ein Tablet als Kasse gekoppelt wird (vom Mini-PC gemeldet, nur Admin – Admin-Zentrale → 🔳 QR-Codes).
const doKassenCodes = () => [...doPfandArt(), ...doArtikel().filter((a) => a.spezial === "bar")];
const doPreisArtikel = () => doArtikel().filter((a) => !a.spezial && !/^Pfand$/i.test(a.kategorie || ""));
const doKasseRef = (k) => String(k.kasse || "").replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 60) || "kasse";

async function doStart() {
  const f = blattAuf("doBlatt", `<h3 style="margin-top:0">🗂️ Druckordner</h3><div id="doInhalt"><p class="hinweis">⏳ Aktuelle Preise, Etiketten und Ordner werden geholt …</p></div>`);
  try {
    await peLaden(); KPL.artikel = PE.artikel.filter((a) => !a.spezial); KPL.quelle = PE.quelle; KPL.stand = PE.stand;
    let r = null; try { r = await api("archiv_liste", {}, { warten: true }); } catch { /* ohne Archiv geht der Rest */ }
    const ordner = (r?.ordner || []).filter((o) => /weihnachtsmarkt/i.test(o.titel || "")), oids = new Set(ordner.map((o) => o.id));
    DO.archiv = (r?.dokumente || []).filter((d) => oids.has(d.ordner_id) && d.status === "ok" && d.datei && (istPdf(d.name, d.mime) || /^image\//.test(d.mime || ""))).slice(0, 40);
    DO.kassen = []; if (ICH?.admin) try { await qrLaden(); DO.kassen = (await api("admin_qr_kassen", {}, { warten: true })).kassen || []; } catch { /* Kassen-Codes nur, wenn der Mini-PC sie gemeldet hat */ }
    let liste = null; try { liste = await api("schild_liste", {}, { warten: true }); } catch {}
    const gesp = (liste?.schilder || []).find((x) => x?.daten?.vorlage === "druckpaket" && /^Druckvorlagen/i.test(x.titel || "") && (x.daten.paket || []).some((t) => t.typ === "live"));
    DO.auswahl = new Map();
    if (gesp) { DO.id = gesp.id; DO.titel = gesp.titel; for (const t of gesp.daten.paket) { if (t.typ === "etformat") { if (t.ref[0] === "k") DO.formatK = Number(t.ref.slice(1)) || 5; else DO.format = Number(t.ref.slice(1)) || 6; } else DO.auswahl.set(doKey(t.typ, t.ref), { ...t, n: t.an === false ? 0 : t.n }); } }
    else for (const [ref, , t] of DO_FEST) doSet("live", ref, 1, t);
  } catch (e) { $("doBlatt")?.remove(); return meldeFehler(e); }
  if (!$("doInhalt")) return;
  doZeigen(f);
}

function doZeile(typ, ref, sym, titel, unter, extra = "", gr = "") {
  const x = doGet(typ, ref);
  return `<div class="do-z${x.n > 0 ? " an" : ""}" data-gr="${gr || (typ === "etikett" ? "preis" : "")}" data-typ="${typ}" data-ref="${esc(ref)}" data-titel="${esc(titel)}">
    <label><input type="checkbox" ${x.n > 0 ? "checked" : ""} data-do="haken"><span><b>${sym} ${esc(titel)}</b>${unter ? `<small>${esc(unter)}</small>` : ""}</span></label>${extra}
    <span class="do-n"><button type="button" class="knopf" data-do="-" aria-label="weniger">−</button><b>${x.n}</b><button type="button" class="knopf" data-do="+" aria-label="mehr">＋</button></span></div>`;
}
function doZeigen(f) {
  const stand = PE.stand ? wann(PE.stand) : "";
  const quelle = PE.quelle === "manager" ? `✅ Preise und Allergene aus dem PC-Manager${stand ? ` (veröffentlicht ${esc(stand)})` : ""}` : "⚠️ Grundstand der Kasse – im PC-Manager „An Kassen senden“ drücken, dann stehen hier die aktuellen Preise.";
  const art = (a) => `${doGeld(Number(a.preis) + doPfand(a))} €${doPfand(a) ? " inkl. Pfand" : ""} · ${a.nummer}`;
  const grp = (titel, inhalt, knoepfe = "") => `<section class="do-grp"><div class="do-gk"><h4>${titel}</h4>${knoepfe}</div>${inhalt}</section>`;
  const alle = (typ, gr = "") => `<span class="do-alle"><button type="button" class="knopf klein" data-alle="${typ}" data-gr="${gr}" data-wert="1">alle 1 ×</button><button type="button" class="knopf klein" data-alle="${typ}" data-gr="${gr}" data-wert="0">keine</button></span>`;
  const groesse = (feld) => [8, 7, 6, 5].map((k) => `<button type="button" class="chip${DO[feld] === k ? " an" : ""}" data-feld="${feld}" data-format="${k}">${k} cm</button>`).join("");
  $("doInhalt").innerHTML = `<p class="hinweis" style="margin:0 0 6px">${quelle}</p>
    <p class="hinweis" style="margin:0 0 10px">Haken setzen oder mit ＋ die Anzahl wählen – alles bleibt auf dieser Seite. Unten „🖨️ Alles drucken“.</p>
    ${grp("⭐ Immer aktuell", DO_FEST.map(([ref, sym, t, u]) => doZeile("live", ref, sym, t, u)).join(""))}
    ${grp(`🏷️ Preisetiketten <small class="hinweis">(Größe ${groesse("format")})</small>`,
      doPreisArtikel().map((a) => doZeile("etikett", a.id, "🏷️", a.name, `${a.kategorie || ""} · ${art(a)}`)).join(""), alle("etikett", "preis"))}
    ${grp(`♻️ Pfand- und Kassen-Etiketten <small class="hinweis">(Pfand, Rückgaben, BAR · Größe ${groesse("formatK")})</small>`,
      doKassenCodes().map((a) => doZeile("etikett", a.id, a.spezial ? "💶" : "♻️", a.name, a.spezial ? "Bezahl-Code: scannen = bar kassieren" : art(a), "", "kasse")).join(""), alle("etikett", "kasse"))}
    ${ICH?.admin ? grp("🔳 Kassen verbinden – QR als Scheckkarte <small class=\"hinweis\">(85 × 54 mm · nur Admin · nur im WLAN des Stand-Routers gültig)</small>",
      DO.kassen.length ? DO.kassen.map((k) => doZeile("karte", doKasseRef(k), "🧾", k.kasse, `${k.stand || ""} · Tablet damit als diese Kasse koppeln`)).join("")
        : '<p class="hinweis">Noch keine Kassen-Codes da. Sie kommen vom Mini-PC am Stand, sobald dort „KC Kasse starten“ läuft und er Internet hat.</p>') : ""}
    ${grp("📁 Aus dem Büro-Ordner „Weihnachtsmarkt“", DO.archiv.length ? DO.archiv.map((d) => doZeile("archiv", d.datei, arDateiSym(d.mime), d.titel || d.name, d.datum ? wann(d.datum) : "")).join("")
      : `<p class="hinweis">Im Büro-Ordner „Weihnachtsmarkt“ liegt noch nichts. Dateien dort ablegen (📥 Einlesen), dann erscheinen sie hier.</p>`)}
    <div class="do-fuss"><b id="doSumme"></b>
      <div class="knoepfe"><button class="knopf haupt" id="doDruck">🖨️ Alles drucken</button><button class="knopf" id="doSpeichern">💾 Speichern</button><button class="knopf" data-zu="1">Schließen</button></div></div>
    <style>#doBlatt .do-grp{margin:12px 0}#doBlatt .do-gk{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;border-bottom:2px solid #c9a227;margin-bottom:4px}
      #doBlatt .do-gk h4{margin:4px 0;color:#741521}#doBlatt .do-z{display:flex;align-items:center;gap:8px;padding:5px 4px;border-bottom:1px solid #eee}#doBlatt .do-z.an{background:#fbf6ee}
      #doBlatt .do-z label{flex:1;display:flex;gap:8px;align-items:center;cursor:pointer;min-width:0}#doBlatt .do-z label span{display:flex;flex-direction:column;min-width:0}
      #doBlatt .do-z small{opacity:.75}#doBlatt .do-n{display:inline-flex;gap:4px;align-items:center}#doBlatt .do-n b{min-width:1.8em;text-align:center}
      #doBlatt .do-fuss{position:sticky;bottom:0;background:var(--karte,#fff);padding:8px 0;border-top:2px solid #741521}</style>`;
  const summe = () => { let teile = 0, aus = 0; for (const x of DO.auswahl.values()) if (x.n > 0) { teile++; aus += x.n; } $("doSumme").textContent = `🖨️ ${teile} ${teile === 1 ? "Teil" : "Teile"} gewählt · ${aus} ${aus === 1 ? "Ausdruck/Stück" : "Ausdrucke/Stück"}`; };
  const zeile = (z) => { const x = doGet(z.dataset.typ, z.dataset.ref); z.classList.toggle("an", x.n > 0); z.querySelector("[data-do=haken]").checked = x.n > 0; z.querySelector(".do-n b").textContent = x.n; summe(); };
  f.querySelectorAll(".do-z").forEach((z) => {
    const { typ, ref, titel } = z.dataset;
    z.querySelector("[data-do=haken]").onchange = (e) => { doSet(typ, ref, e.target.checked ? Math.max(1, doGet(typ, ref).n) : 0, titel); zeile(z); };
    z.querySelector("[data-do='+']").onclick = () => { doSet(typ, ref, doGet(typ, ref).n + 1, titel); zeile(z); };
    z.querySelector("[data-do='-']").onclick = () => { doSet(typ, ref, doGet(typ, ref).n - 1, titel); zeile(z); };
  });
  f.querySelectorAll("[data-alle]").forEach((b) => (b.onclick = () => f.querySelectorAll(`.do-z[data-typ="${b.dataset.alle}"]${b.dataset.gr ? `[data-gr="${b.dataset.gr}"]` : ""}`).forEach((z) => { doSet(z.dataset.typ, z.dataset.ref, Number(b.dataset.wert), z.dataset.titel); zeile(z); })));
  f.querySelectorAll("[data-format]").forEach((b) => (b.onclick = () => { DO[b.dataset.feld] = Number(b.dataset.format); f.querySelectorAll(`[data-feld="${b.dataset.feld}"]`).forEach((x) => x.classList.toggle("an", x === b)); }));
  f.querySelector("[data-zu]").onclick = () => $("doBlatt")?.remove();
  $("doDruck").onclick = (e) => doDrucken(e.currentTarget);
  $("doSpeichern").onclick = (e) => doSpeichern(e.currentTarget);
  summe();
}

async function doSpeichern(knopf) {
  const paket = [...DO.auswahl.values()].filter((x) => x.n > 0 || x.typ === "live").map((x) => ({ typ: x.typ, ref: x.ref, titel: x.titel, n: Math.max(1, x.n), an: x.n > 0 }));
  paket.push({ typ: "etformat", ref: "f" + DO.format, titel: `Etiketten ${DO.format} cm`, n: 1, an: true }, { typ: "etformat", ref: "k" + DO.formatK, titel: `Pfand-/Kassen-Etiketten ${DO.formatK} cm`, n: 1, an: true });
  const name = await eingabe("💾 Unter welchem Namen speichern?", DO.titel); if (!name || !name.trim()) return;
  await einmal(knopf, async () => {
    const r = await api("schild_speichern", { id: DO.id, titel: name.trim(), anlass: "weihnachtsmarkt", daten: { vorlage: "druckpaket", paket } });
    DO.id = r.id; DO.titel = name.trim(); melde(`💾 Gespeichert als „${DO.titel}“ – beim nächsten Öffnen ist alles wieder so eingestellt.`);
  });
}

// ---------- Seiten bauen ----------
const DO_A4 = { w: 2480, h: 3508 }; // 300 dpi hoch
async function doBildAusSrc(src) { const img = new Image(); img.src = src; await img.decode(); const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d").drawImage(img, 0, 0); const s = schHochkant(c); c.width = c.height = 0; return s; }
async function doHtmlBild(html, css) { // 1123 × 794 px (A4 quer bei 96 dpi) → Bild 300 dpi, gedreht auf hoch
  await kplSchriften(); await bfBibliothek();
  if (!$("kplStil")) { const st = document.createElement("style"); st.id = "kplStil"; st.textContent = KPL_CSS; document.head.appendChild(st); }
  let st = $("doStil"); if (!st) { st = document.createElement("style"); st.id = "doStil"; document.head.appendChild(st); } st.textContent = css;
  const h = document.createElement("div"); h.className = "kpl-halter"; h.innerHTML = html; document.body.appendChild(h);
  try {
    await Promise.all([...h.querySelectorAll("img")].map((i) => (i.complete ? null : new Promise((ok) => { i.onload = i.onerror = ok; }))));
    const c = await window.html2canvas(h.firstElementChild, { scale: 3508 / 1123, backgroundColor: "#ffffff", logging: false, scrollX: 0, scrollY: -window.scrollY, windowWidth: Math.max(1200, innerWidth) });
    const s = schHochkant(c); c.width = c.height = 0; return s;
  } finally { h.remove(); }
}

// Interne Preisliste: Mengen 1–10 inkl. Pfand – Club-Design (Weinrot, Gold, Kochmütze), wie die gedruckte „Preisliste 2026“ vom Stand
const DO_MIT_ALK = ["eier", "grot", "gweiss", "feuer"], DO_SCHUSS = ["schussrum", "schussamaretto"], DO_OHNE_ALK = ["roterfeger", "apfel"];
function doMplGruppen() {
  const v = doVerkauf(), getr = v.filter((a) => /^Getränke$/i.test(a.kategorie || ""));
  const mit = getr.filter((a) => !DO_SCHUSS.includes(a.id) && (DO_MIT_ALK.includes(a.id) || (!DO_OHNE_ALK.includes(a.id) && a.alkohol)));
  const ohne = getr.filter((a) => !DO_SCHUSS.includes(a.id) && !mit.includes(a));
  const schuss = getr.filter((a) => DO_SCHUSS.includes(a.id)), rest = v.filter((a) => !getr.includes(a));
  const pfText = (a) => { const p = Array.isArray(a.pfand) ? a.pfand.filter((k) => Number(k?.betrag) > 0) : []; if (!p.length) return "";
    return p.length === 1 ? `inkl. ${doGeld(p[0].betrag)} € ${p[0].name || "Pfand"}` : `inkl. ${doGeld(doPfand(a))} € Pfand (${p.map((k) => String(k.name || "").replace(/n?pfand$/i, "") || "Pfand").join(" + ")})`; };
  const zeile = (a) => ({ name: a.name, unter: pfText(a), preis: Number(a.preis) + doPfand(a) });
  const g = [];
  if (mit.length || schuss.length) g.push({ t: "Getränke mit Alkohol", f: "#741521", z: [...mit.map(zeile), ...(schuss.length ? [{ name: "+ Schuss " + schuss.map((a) => a.name.replace(/^Schuss\s*/i, "")).join(" / "), unter: "Zuschlag je Glas – ohne Pfand", preis: Math.max(...schuss.map((a) => Number(a.preis))), klein: true }] : [])] });
  if (ohne.length) g.push({ t: "Alkoholfreie Getränke", f: "#2f6b34", z: ohne.map(zeile) });
  const nachKat = {}; rest.forEach((a) => (nachKat[a.kategorie || "Weitere"] = nachKat[a.kategorie || "Weitere"] || []).push(a));
  Object.entries(nachKat).forEach(([k, l]) => g.push({ t: k, f: /speisen/i.test(k) ? "#a8641c" : "#5b544d", z: l.map(zeile) }));
  return g;
}
function doMplHtml() {
  const g = doMplGruppen(), e = (x) => esc(String(x ?? "")), heute = new Date().toLocaleDateString("de-DE");
  const glas = doPfandArt().find((a) => a.id === "glasplus"), zange = doPfandArt().find((a) => a.id === "zangeplus");
  const zeilen = g.map((gr) => `<tr class="mpl-gr" style="--f:${gr.f}"><th colspan="11">${e(gr.t)}</th></tr>` + gr.z.map((z, i) => `<tr class="${i % 2 ? "ug" : ""}${z.klein ? " kl" : ""}" style="--f:${gr.f}">
      <td class="n"><b>${e(z.name)}</b>${z.unter ? `<small>${e(z.unter)}</small>` : ""}</td>${Array.from({ length: 10 }, (_, k) => `<td class="${k ? "" : "e"}">${doGeld(z.preis * (k + 1))}</td>`).join("")}</tr>`).join("")).join("");
  return `<div class="mpl"><div class="mpl-rahmen">
    <div class="mpl-kopf"><span class="mpl-logo"><img src="${esc(new URL(KC_CD.logo, location.href).href)}" alt=""></span><div class="mpl-marke"><b>${e(KC_CD.name)}</b><i>${e(KC_CD.zeile)}</i></div>
      <div class="mpl-titel"><h1>Interne Preisliste ${new Date().getFullYear()}</h1><div>Nur für Mitarbeiter · nicht für Kunden</div></div></div>
    <table><thead><tr><th class="n">Anzahl →<small>Preise in € · Getränke inkl. Pfand</small></th>${Array.from({ length: 10 }, (_, k) => `<th>${k + 1}</th>`).join("")}</tr></thead><tbody>${zeilen}</tbody></table>
    <div class="mpl-hinweis"><span><b>Pfand</b> ist in den Getränkepreisen schon enthalten${glas ? `: Glaspfand ${doGeld(glas.preis)} €` : ""}${zange ? ` · Feuerzangenpfand ${doGeld(zange.preis)} €` : ""}. Pfand gibt es bei Rückgabe von Glas bzw. Feuerzange zurück.</span><span class="st">Stand ${heute} · Preise aus dem PC-Manager</span></div>
    <div class="mpl-fuss"><span>${e(KC_CD.name)} · <b>Weihnachtsmarkt ${new Date().getFullYear()}</b></span><span class="mpl-bar">Nur Barzahlung</span></div></div></div>`;
}
const DO_MPL_CSS = `.mpl{width:1123px;height:794px;box-sizing:border-box;background:#741521;padding:14px;font-family:"KPL Sans",Arial,sans-serif;color:#1d1a17}
.mpl-rahmen{height:100%;box-sizing:border-box;background:#fbf7f0;border:2.5px solid #c9a227;border-radius:10px;padding:12px 22px 0;display:flex;flex-direction:column}
.mpl-kopf{display:flex;align-items:center;gap:14px;border-bottom:3px solid #c9a227;padding-bottom:8px}.mpl-logo{width:58px;height:58px;border-radius:50%;background:#741521;display:grid;place-items:center;box-shadow:0 0 0 3px #c9a227}
.mpl-logo img{width:40px;height:40px;object-fit:contain}.mpl-marke{display:flex;flex-direction:column}.mpl-marke b{font-family:"KPL Serif",Georgia,serif;font-size:26px;color:#741521}.mpl-marke i{font-size:13px;color:#5b544d;white-space:nowrap}
.mpl-titel{margin-left:auto;text-align:right}.mpl-titel h1{margin:0;font-family:"KPL Serif",Georgia,serif;font-size:40px;line-height:1;color:#741521}.mpl-titel div{color:#a87a1c;font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin-top:4px}
.mpl table{width:100%;border-collapse:collapse;margin-top:6px;font-size:15.5px;line-height:1.3}.mpl thead th{background:#741521;color:#f6e7b8;font-size:19px;padding:2px 6px;text-align:right;font-family:"KPL Serif",Georgia,serif}
.mpl thead th.n{text-align:left;font-size:17px}.mpl thead th.n small{display:block;font-size:11px;font-family:"KPL Sans",Arial;font-weight:400;opacity:.85}
.mpl-gr th{background:var(--f);color:#fff;text-align:left;padding:3px 8px;font-size:16px;font-family:"KPL Serif",Georgia,serif;font-style:italic}
.mpl td{padding:1px 6px;text-align:right;border-bottom:1px solid #e6d9c6;font-variant-numeric:tabular-nums;font-weight:600}.mpl tr.ug td{background:#f3e9dc}
.mpl td.n{text-align:left;font-weight:700;border-left:5px solid var(--f)}.mpl td.n small{display:block;font-size:10.5px;color:var(--f);font-weight:700}.mpl td.e{color:var(--f);font-weight:800;font-size:17px}
.mpl tr.kl td{font-size:13px}.mpl-hinweis{margin-top:auto;padding:6px 0;font-size:12px;display:flex;justify-content:space-between;gap:10px}.mpl-hinweis b{color:#741521}.mpl-hinweis span.st{font-style:italic;color:#5b544d;white-space:nowrap}
.mpl-fuss{margin:0 -22px;padding:7px 22px;background:#741521;color:#f3e9dc;display:flex;justify-content:space-between;align-items:center;font-size:14px;border-radius:0 0 8px 8px}.mpl-fuss b{color:#e7c35a}
.mpl-bar{border:2px solid #c9a227;color:#f6e7b8;border-radius:6px;padding:2px 10px;font-weight:700}`;

// Allergen-Aushang aus den Artikeldaten: ✕ enthalten, (✕) Spuren/kann enthalten, – nicht enthalten, leer = noch nicht erfasst
function doAllergenStatus(a) {
  const al = String(a?.allergene || "").trim(), drin = new Set(), spur = new Set();
  if (al && !/^keine\b/i.test(al)) for (const t of al.split(/[,;]|\bund\b/).map((x) => x.trim()).filter(Boolean)) {
    const ziel = /spuren|kann enthalten|möglich/i.test(t) ? spur : drin; for (const [k, , re] of KPL_ALLERGENE) if (re.test(t)) ziel.add(k);
  }
  for (const k of drin) spur.delete(k);
  return { drin, spur, fehlt: !al, zusatz: kplKennzeichen(a).kz.filter((k) => /^\d+$/.test(k)) };
}
function doAllergenHtml() {
  const nach = new Map(doArtikel().map((a) => [a.id, a])), e = (x) => esc(String(x ?? ""));
  const zeilen = KPL_AUFBAU.map((s) => `<tr class="ag"><td colspan="${KPL_ALLERGENE.length + 2}">${e(s.t)}</td></tr>` + s.posten.flatMap((p) => p.gruppe ? p.unter.map((u) => ({ ...u, name: `${p.gruppe} ${u.name}` })) : (p.ids ? p.ids.map((id) => ({ id, name: p.name, t: nach.get(id)?.name.replace(/^Schuss\s*/i, "") })) : [p]))
    .filter((p) => nach.has(p.id)).map((p, i) => { const a = nach.get(p.id), st = doAllergenStatus(a);
      return `<tr class="${i % 2 ? "ug" : ""}"><td class="n"><b>${e(p.name)}</b> ${p.t || p.d ? `<small>${e(p.t || p.d)}</small>` : ""}</td>${KPL_ALLERGENE.map(([k]) => `<td>${st.drin.has(k) ? '<i class="j">✕</i>' : st.spur.has(k) ? '<i class="s">✕</i>' : st.fehlt ? '<i class="o"></i>' : "–"}</td>`).join("")}<td class="z">${a.zusatz == null ? "" : st.zusatz.join(", ") || "–"}</td></tr>`; }).join("")).join("");
  return `<div class="ala"><div class="ala-kopf"><span class="mpl-logo"><img src="${esc(new URL(KC_CD.logo, location.href).href)}" alt=""></span><div class="mpl-marke"><b>${e(KC_CD.name)}</b><i>${e(KC_CD.zeile)}</i></div>
    <div class="mpl-titel"><h1>Allergene &amp; Zusatzstoffe</h1><div>Weihnachtsmarkt ${new Date().getFullYear()}</div></div></div>
    <table><thead><tr><th class="n">Artikel</th>${KPL_ALLERGENE.map(([k, t]) => `<th><small>${e(t)}</small>${k}</th>`).join("")}<th class="z">Zusatz-<br>stoffe</th></tr></thead><tbody>${zeilen}</tbody></table>
    <div class="ala-leg"><span><i class="j">✕</i> enthalten · <i class="s">✕</i> kann enthalten bzw. Spuren · – nicht enthalten · <i class="o"></i> noch nicht erfasst</span>
      <span>${KPL_ZUSATZ.map(([k, t]) => `<b>${k}</b> ${e(t)}`).join(" · ")}</span><span>Angaben nach bestem Wissen. Trotz sorgfältiger Zubereitung können Spuren weiterer Allergene nicht ausgeschlossen werden. · Stand ${new Date().toLocaleDateString("de-DE")}</span></div></div>`;
}
const DO_ALA_CSS = `.ala{width:1123px;height:794px;box-sizing:border-box;background:#fffdf9;padding:0 26px 14px;font-family:"KPL Sans",Arial,sans-serif;color:#1d1a17;display:flex;flex-direction:column}
.ala-kopf{display:flex;align-items:center;gap:14px;margin:0 -26px;padding:10px 26px;background:#741521;color:#fff}.ala-kopf .mpl-marke b{color:#fff}.ala-kopf .mpl-marke i{color:#f3e9dc}
.ala-kopf .mpl-titel h1{color:#fff;font-size:32px}.ala-kopf .mpl-titel div{color:#e7c35a}
.ala table{width:100%;border-collapse:collapse;margin-top:10px;font-size:14px}.ala thead th{font-size:17px;color:#741521;font-family:"KPL Serif",Georgia,serif;border-bottom:2px solid #741521;padding:2px;vertical-align:bottom}
.ala thead th small{display:block;font-size:8.5px;font-family:"KPL Sans",Arial;color:#5b544d;font-weight:600;line-height:1.1;margin-bottom:2px}.ala th.n{text-align:left;width:280px}.ala th.z{width:70px;font-size:12px}
.ala td{text-align:center;padding:3px 2px;border-bottom:1px solid #eadfcf;color:#9a8f84}.ala tr.ug td{background:#f8f1e7}.ala td.n{text-align:left;color:#1d1a17;white-space:nowrap}.ala td.n small{color:#5b544d}
.ala td.z{color:#741521;font-weight:700}.ala tr.ag td{text-align:left;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#741521;font-size:12px;padding-top:8px;border-bottom:2px solid #741521;background:none}
.ala i{display:inline-block;width:17px;height:17px;line-height:17px;border-radius:3px;font-style:normal;font-size:12px;font-weight:700}.ala i.j{background:#741521;color:#fff}.ala i.s{border:1.5px dashed #741521;color:#741521;line-height:14px}.ala i.o{border:1.5px solid #b9ab9c}
.ala-leg{margin-top:auto;display:flex;flex-direction:column;gap:3px;font-size:11.5px;border-top:1px solid #d9cbb8;padding-top:6px}.ala-leg b{color:#741521}.ala-leg i{width:14px;height:14px;line-height:14px;font-size:10px;vertical-align:-2px}`;

// Preisetiketten: wie „🖨️ Drucken“ im Etiketten-Fenster (gleiches Raster, gleiche Schnittmarken), aber mit den Anzahlen aus dem Druckordner
async function doEtikettSeiten(liste, format = DO.format) {
  PE.format = format; await qrLaden(); const r = peRaster(format), K = r.K, je = r.sp * r.ze, W = Math.round(210 * PE_MM), H = Math.round(297 * PE_MM), seiten = [];
  for (let i = 0; i < liste.length; i += je) {
    const teil = liste.slice(i, i + je), c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const ze = Math.ceil(teil.length / r.sp), x0 = (210 - r.sp * K) / 2, y0 = (297 - r.ze * K) / 2;
    for (let k = 0; k < teil.length; k++) await doEtikett(g, teil[k], x0 + (k % r.sp) * K, y0 + Math.floor(k / r.sp) * K, K);
    g.fillStyle = "#000"; const mk = (x, y, w, h) => g.fillRect(x * PE_MM, y * PE_MM, w * PE_MM, h * PE_MM);
    for (let c2 = 0; c2 <= r.sp; c2++) { const x = x0 + c2 * K; mk(x - 0.125, y0 - 6, 0.25, 4); mk(x - 0.125, y0 + ze * K + 2, 0.25, 4); }
    for (let z = 0; z <= ze; z++) { const y = y0 + z * K; mk(x0 - 6, y - 0.125, 4, 0.25); mk(x0 + r.sp * K + 2, y - 0.125, 4, 0.25); }
    seiten.push(c.toDataURL("image/jpeg", 0.9)); c.width = c.height = 0;
  }
  return seiten;
}
// Ein Etikett wie im Etiketten-Fenster; BAR (Check-out) im selben Format wie die anderen, aber ohne Foto: Farbband „KASSEN-CODE / BAR – bezahlen“,
// darunter groß der QR-Code mit der Nummer (statt des eigenen BAR-Etiketts aus dem Etiketten-Fenster)
async function doEtikett(g, a, x, y, K) {
  if (a.spezial !== "bar") return peEtikett(g, a, x, y, K);
  const alt = { ...PE.aus }; Object.assign(PE.aus, { foto: false, preis: false, pfand: false, allergene: false, zusatz: false, alkohol: false });
  try { await peEtikett(g, { ...a, spezial: undefined, kategorie: "Kassen-Code", name: "BAR – bezahlen", warengruppeFarbe: "#1b5e20", farbe: "#1b5e20" }, x, y, K); } finally { PE.aus = alt; }
}
// Kassen-Codes als Scheckkarte (85,6 × 54 mm, ISO-Kartengröße): 2 × 5 je A4-Bogen, Schnittmarken außen. Oben das Farbband (Warengruppe bzw.
// Grün für BAR), links Name und Preis (Getränke inkl. Pfand), rechts der QR-Code mit der Artikelnummer – dieselbe Nummer wie auf den Etiketten.
async function doKartenSeiten(liste) {
  await qrLaden(); const M = PE_MM, KW = 85.6, KH = 54, sp = 2, ze = 5, x0 = (210 - sp * KW) / 2, y0 = (297 - ze * KH) / 2, W = Math.round(210 * M), H = Math.round(297 * M), seiten = [];
  for (let i = 0; i < liste.length; i += sp * ze) {
    const teil = liste.slice(i, i + sp * ze), c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    for (let k = 0; k < teil.length; k++) await doKarte(g, teil[k], x0 + (k % sp) * KW, y0 + Math.floor(k / sp) * KH, KW, KH);
    const rz = Math.ceil(teil.length / sp); g.fillStyle = "#000"; const mk = (x, y, w, h) => g.fillRect(x * M, y * M, w * M, h * M);
    for (let s = 0; s <= sp; s++) { const x = x0 + s * KW; mk(x - 0.125, y0 - 6, 0.25, 4); mk(x - 0.125, y0 + rz * KH + 2, 0.25, 4); }
    for (let z = 0; z <= rz; z++) { const y = y0 + z * KH; mk(x0 - 6, y - 0.125, 4, 0.25); mk(x0 + sp * KW + 2, y - 0.125, 4, 0.25); }
    seiten.push(c.toDataURL("image/jpeg", 0.9)); c.width = c.height = 0;
  }
  return seiten;
}
// 26.11.2026 (Hansi: „Bei den Pfandrückgaben müssen noch die Bilder drauf wie bei den Artikel-Etiketten. Und die Check-Out müssen auch das
// Format haben, aber ohne Bild“): jede Karte gleich aufgebaut – Farbband mit Name, links das Foto (wie auf den Preisetiketten, aus der Kasse),
// daneben Preis und Zusatz, rechts der QR-Code; ohne Foto (BAR, Artikel ohne Bild) rückt der Text nach links.
async function doKarte(g, k, x, y, w, h) {
  const M = PE_MM, X = (v) => (x + v) * M, Y = (v) => (y + v) * M, farbe = "#741521", S = PE_SCHRIFT;
  g.save(); g.fillStyle = "#fff"; peRund(g, X(0.6), Y(0.6), (w - 1.2) * M, (h - 1.2) * M, 3 * M); g.fill(); g.lineWidth = 0.5 * M; g.strokeStyle = farbe; g.stroke(); g.clip();
  g.fillStyle = farbe; g.fillRect(X(0), Y(0), w * M, 10 * M);
  g.fillStyle = "#fff"; g.textAlign = "left"; g.textBaseline = "middle"; g.font = `800 ${5 * M}px ${S}`; g.fillText(`Kasse verbinden · ${k.kasse}`, X(4), Y(5.3));
  const qs = 38, q = qrcode(0, "M"); q.addData(String(k.url)); q.make(); const n = q.getModuleCount(), z = (qs * M) / (n + 2), qx = X(w - qs - 2.5), qy = Y(11.5);
  g.fillStyle = "#000"; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(Math.floor(qx + (c + 1) * z), Math.floor(qy + (r + 1) * z), Math.ceil(z), Math.ceil(z));
  g.textBaseline = "alphabetic"; const tb = w - qs - 2.5 - 4 - 2; let ty = 18;
  const zeile = (t, gr, gew, farb, abst = 1.35) => { g.font = `${gew} ${gr * M}px ${S}`; g.fillStyle = farb; const l = []; let z0 = "";
    for (const wort of String(t).split(" ")) { const v = z0 ? z0 + " " + wort : wort; if (g.measureText(v).width > tb * M && z0) { l.push(z0); z0 = wort; } else z0 = v; } if (z0) l.push(z0);
    for (const zz of l) { g.fillText(zz, X(4), Y(ty)); ty += gr * abst; } };
  zeile(k.kasse, 7, 900, farbe, 1.2); ty += 0.5; zeile("Mit dem Tablet scannen – es wird diese Kasse.", 2.9, 700, "#1d1a17"); ty += 0.8;
  zeile("Nur im WLAN des Stand-Routers gültig.", 2.6, 600, "#5b544d"); zeile("Nicht weitergeben – bei Verlust im PC-Manager „Gerät verloren“.", 2.4, 600, "#b91c1c");
  g.fillStyle = "#555"; g.font = `600 ${2.4 * M}px ${S}`; g.fillText(`${k.stand || "Stand"} · Köcheclub Werne`, X(4), Y(h - 3.2));
  g.restore();
}

async function doDrucken(knopf) {
  const L = [...DO.auswahl.values()].filter((x) => x.n > 0);
  if (!L.length) return melde("Bitte mindestens ein Teil ankreuzen.", true);
  await einmal(knopf, async () => {
    const seiten = [], fehlt = [], nach = new Map(doArtikel().map((a) => [a.id, a]));
    const reihe = (typ) => doArtikel().filter((a) => doGet(typ, a.id).n > 0).flatMap((a) => Array(doGet(typ, a.id).n).fill(a));
    for (const t of L.filter((x) => x.typ === "live")) {
      melde(`⏳ ${t.titel} …`);
      try {
        const b = t.ref === "kpl" ? await doBildAusSrc((await kplBild(kplModell(KPL.artikel))).bild) : t.ref === "mpl" ? await doHtmlBild(doMplHtml(), DO_MPL_CSS) : await doHtmlBild(doAllergenHtml(), DO_MPL_CSS + DO_ALA_CSS);
        for (let i = 0; i < t.n; i++) seiten.push(b);
      } catch (e) { fehlt.push(`${t.titel} (${e?.message || e})`); }
    }
    const kasse = new Set(doKassenCodes().map((a) => a.id)), et = reihe("etikett");
    for (const [teil, fmt, name] of [[et.filter((a) => !kasse.has(a.id)), DO.format, "Preisetiketten"], [et.filter((a) => kasse.has(a.id)), DO.formatK, "Pfand- und Kassen-Etiketten"]]) {
      if (!teil.length) continue; melde(`⏳ ${teil.length} ${name} …`); try { seiten.push(...(await doEtikettSeiten(teil, fmt))); } catch (e) { fehlt.push(`${name} (${e?.message || e})`); } }
    const ka = DO.kassen.filter((k) => doGet("karte", doKasseRef(k)).n > 0).flatMap((k) => Array(doGet("karte", doKasseRef(k)).n).fill(k));
    if (ka.length) { melde(`⏳ ${ka.length} Kassen-Karten …`); try { seiten.push(...(await doKartenSeiten(ka))); } catch (e) { fehlt.push(`Kassen-Karten (${e?.message || e})`); } }
    for (const t of L.filter((x) => x.typ === "archiv")) { melde(`⏳ ${t.titel} …`); try { const b = await schPaketBilder(t); for (let i = 0; i < t.n; i++) seiten.push(...b); } catch (e) { fehlt.push(`${t.titel} (${e?.message || e})`); } }
    for (const x of L.filter((x) => x.typ === "etikett" && !nach.has(x.ref))) fehlt.push(`${x.titel} (Artikel gibt es nicht mehr)`);
    for (const x of L.filter((x) => x.typ === "karte" && !DO.kassen.some((k) => doKasseRef(k) === x.ref))) fehlt.push(`${x.titel} (Kassen-Code gerade nicht da – Mini-PC am Stand prüfen${ICH?.admin ? "" : ", nur für Admin"})`);
    if (fehlt.length) {
      if (!seiten.length) return melde("⚠️ Nichts druckbar: " + fehlt.join(", "), true);
      if (!(await frage(`⚠️ Nicht druckbar:\n${fehlt.join("\n")}\n\nDen Rest trotzdem drucken?`, { ja: "🖨️ Rest drucken", nein: "Abbrechen" }))) return;
    }
    DO.seiten = seiten; melde(`🖨️ ${seiten.length} ${seiten.length === 1 ? "Seite" : "Seiten"} bereit`); druckStarten("druckordner");
  });
}
function doDruckSeite() {
  const s = DO.seiten || []; if (!s.length) return null;
  return { ohneRahmen: true, randlos: true, titel: DO.titel || "Druckordner", html: s.map((b) => `<img class="dseite" src="${b}" alt="">`).join("") };
}
