// ---------- KC-CLUB-KUNDENPREISLISTE (3.22.0, Wunsch Hansi 24.11.2026 „Entwurf 20 soll es werden … baue es in die Club-App, die sich alles
// automatisch holt wie Preise und Allergene – für Version 2026 Kundenpreisliste“) ----------
// Büro → 🖨️ Drucker → 📋 Kundenpreisliste (nur Clubleitung). Gestaltung: Entwurf 20 „Tannenzweig & Kugeln“ der Abstimmung (A4 quer,
// Schrift groß, „Nur Barzahlung“ als weinrotes Schild). Hintergrund (Tannenzweige, Rahmen, Kopf „Preise“, heller Kasten) liegt fertig als
// Bild in bilder/kundenpreisliste/hintergrund.jpg; darauf setzt die App die Liste mit den Schriften aus schriften/ (Source Serif 4, Source Sans 3).
// Daten: wie die Preisetiketten – zuerst der vom PC-Manager veröffentlichte Stand (Aktion etiketten_artikel), sonst der Grundstand der Kasse.
// Preise, Pfand, Thermobecher und die Kennzeichnung (LMIV-Buchstaben, Zusatzstoff-Ziffern) kommen aus den Artikeldaten; fest sind nur Aufbau,
// Kundennamen und Unterzeilen (KPL_AUFBAU). Fehlt ein Artikel oder seine Allergenangabe, sagt die Vorschau es – gedruckt wird trotzdem.
// Gedruckt wird ein Bild (300 dpi-nah, html2canvas aus lib/) – Drucken, PDF und Teilen wie bei allen Druckseiten.

const KPL = { artikel: null, quelle: null, stand: null, bild: null, schriften: null };
const KPL_HG = "bilder/kundenpreisliste/hintergrund.jpg";
// Aufbau der Liste: id = Artikel in der Kasse; name/t/d = Kundentext; glas = Glaspfand (*); zange = zusätzlich Feuerzangen-Pfand (**)
const KPL_AUFBAU = [
  { spalte: 1, t: "Alkoholfreie Getränke", posten: [
    { id: "roterfeger", name: "Roter Feger", d: "Beeriger Kinderpunsch", glas: true },
    { id: "apfel", name: "Winterapfel", d: "Apfelpunsch mit feinen Gewürzen", glas: true }] },
  { spalte: 1, t: "Alkoholische Getränke", posten: [
    { id: "grot", name: "Adventsglühwein", t: "(rot)", glas: true },
    { id: "gweiss", name: "Winzerglühwein", t: "(weiß)", glas: true },
    { id: "eier", name: "Eierlikörpunsch", glas: true },
    { id: "feuer", name: "Feuerzangenbowle", glas: true, zange: true },
    { ids: ["schussrum", "schussamaretto"], name: "Extra Schuss", d: "Rum oder Amaretto" }] },
  { spalte: 2, t: "Warme Speisen", posten: [
    { id: "gruenkohl", name: "Grünkohleintopf", d: "nach Köcheclub-Rezept" },
    { id: "gruenkohlmett", name: "Grünkohleintopf mit Mettendchen" },
    { id: "sauerkraut", name: "Sauerkrauteintopf", d: "mit magerem Bauchspeck" },
    { id: "sauerkrautmett", name: "Sauerkrauteintopf mit Mettendchen" },
    { gruppe: "Kartoffelknirpse", unter: [{ id: "knirpsecreme", name: "mit Dip" }, { id: "hering", name: "mit Heringsstip" }] },
    { id: "mettwurst", name: "Mettendchen" }] },
];
const KPL_PFAND = { glas: "glasplus", zange: "zangeplus", becher: "becher" };
// Kennzeichnung nach LMIV (Buchstaben wie auf dem Allergen-Aushang) – erkannt am Text der Allergenangabe; „Spuren“/„kann enthalten“ zählt nicht
const KPL_ALLERGENE = [["A", "Gluten", /gluten|weizen|roggen|gerste|hafer|dinkel/i], ["B", "Krebstiere", /krebs/i], ["C", "Ei", /\bei(er)?\b|eigelb|eiweiß/i],
  ["D", "Fisch", /fisch|hering/i], ["E", "Erdnüsse", /erdnuss|erdnüss/i], ["F", "Soja", /soja/i], ["G", "Milch", /milch|laktose|lactose|sahne|joghurt|quark/i],
  ["H", "Schalenfrüchte", /schalenfr|mandel|haselnuss|walnuss|cashew|pistazie|pekan|macadamia/i], ["I", "Sellerie", /sellerie/i], ["J", "Senf", /senf/i],
  ["K", "Sesam", /sesam/i], ["L", "Sulfite", /sulfit|schwefeldioxid/i], ["M", "Lupinen", /lupine/i], ["N", "Weichtiere", /weichtier|muschel|schnecke|tintenfisch/i]];
const KPL_ZUSATZ = [["1", "mit Farbstoff", /farbstoff/i], ["2", "mit Konservierungsstoff", /konservierung/i], ["3", "mit Antioxidationsmittel", /antioxidation/i],
  ["4", "mit Geschmacksverstärker", /geschmacksverst/i], ["5", "geschwefelt", /geschwefelt/i], ["6", "geschwärzt", /geschwärzt/i], ["7", "gewachst", /gewachst/i],
  ["8", "mit Phosphat", /phosphat/i], ["9", "mit Süßungsmittel", /süßungsmittel|suessungsmittel/i], ["11", "koffeinhaltig", /koffein/i], ["12", "chininhaltig", /chinin/i]];

// Kennzeichen eines Artikels: { kz: ["A","I","J","2","3"], fehlt: true, wenn die Allergenangabe nicht erfasst ist }
function kplKennzeichen(a) {
  if (!a) return { kz: [], fehlt: true };
  const al = String(a.allergene || "").trim(), zu = String(a.zusatz || "").trim(), kz = [];
  if (al && !/^keine\b/i.test(al)) {
    const teile = al.split(/[,;]|\bund\b/).map((x) => x.trim()).filter((x) => x && !/spuren|kann enthalten|möglich/i.test(x));
    for (const [k, , re] of KPL_ALLERGENE) if (teile.some((x) => re.test(x))) kz.push(k);
  }
  if (zu && !/^keine\b|^ohne\b/i.test(zu)) for (const [k, , re] of KPL_ZUSATZ) if (re.test(zu)) kz.push(k);
  return { kz, fehlt: !al };
}
const kplGeld = (n) => Number(n || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

// Aus den Artikeldaten das Modell der Liste bauen (ohne Bildschirm – auch für den Test)
function kplModell(artikel) {
  const nach = new Map((artikel || []).map((a) => [a.id, a])), hinweise = [], benutzt = new Set();
  const posten = (p) => {
    const ids = p.ids || [p.id], da = ids.map((i) => nach.get(i)).filter(Boolean);
    if (!da.length) { hinweise.push(`„${p.name}“ fehlt in den Artikeln der Kasse – steht nicht auf der Liste.`); return null; }
    ids.filter((i) => !nach.has(i)).forEach((i) => hinweise.push(`„${p.name}“: Artikel ${i} fehlt.`));
    const preise = [...new Set(da.map((a) => Number(a.preis)))];
    if (preise.length > 1) hinweise.push(`„${p.name}“: unterschiedliche Preise (${preise.map(kplGeld).join(" / ")}) – gedruckt wird der höchste.`);
    const kz = [];
    for (const a of da) { const k = kplKennzeichen(a); if (k.fehlt) hinweise.push(`„${a.name}“: Allergene nicht erfasst – bitte im PC-Manager eintragen und veröffentlichen.`); k.kz.forEach((x) => kz.includes(x) || kz.push(x)); }
    const reihen = [...KPL_ALLERGENE.map((x) => x[0]), ...KPL_ZUSATZ.map((x) => x[0])]; kz.sort((x, y) => reihen.indexOf(x) - reihen.indexOf(y)); kz.forEach((x) => benutzt.add(x));
    return { name: p.name, t: p.t || "", d: p.d || "", preis: Math.max(...preise), stern: p.zange ? "**" : p.glas ? "*" : "", kz };
  };
  const abschnitte = KPL_AUFBAU.map((s) => ({ spalte: s.spalte, t: s.t, posten: s.posten.map((p) => p.gruppe
    ? { gruppe: p.gruppe, unter: p.unter.map(posten).filter(Boolean) } : posten(p)).filter((p) => p && (!p.gruppe || p.unter.length)) }));
  const preisVon = (id, name) => { const a = nach.get(id); if (!a) { hinweise.push(`${name} fehlt in den Artikeln – Fußzeile ohne Betrag.`); return null; } return Number(a.preis); };
  const glas = preisVon(KPL_PFAND.glas, "Glaspfand"), zange = preisVon(KPL_PFAND.zange, "Feuerzangenpfand"), becher = preisVon(KPL_PFAND.becher, "Außer-Haus-Becher");
  const legende = [...KPL_ALLERGENE, ...KPL_ZUSATZ].filter(([k]) => benutzt.has(k)).map(([k, t]) => `${k} ${t}`);
  return { abschnitte, glas, zange, becher, legende, hinweise };
}

// HTML der Liste (Maße in px auf 1123 × 794 = A4 quer bei 96 dpi; fs = Grundschrift)
function kplHtml(m, fs) {
  const e = (x) => esc(String(x ?? ""));
  const it = (p, vr) => `<li class="kpl-it${vr ? " vr" : ""}"><span class="kpl-n">${e(p.name)}${p.t ? ` <span class="kpl-t">${e(p.t)}</span>` : ""}${p.kz.length ? ` <sup class="kpl-kz">(${e(p.kz.join(", "))})</sup>` : ""}${p.d ? `<span class="kpl-d">${e(p.d)}</span>` : ""}</span><span class="kpl-lead"></span><span class="kpl-p">${e(kplGeld(p.preis))}<span class="kpl-st">${p.stern}</span></span></li>`;
  const sec = (s) => `<section class="kpl-sec"><h3>${e(s.t)}</h3><ul>${s.posten.map((p) => p.gruppe ? `<li class="kpl-gr">${e(p.gruppe)}</li>${p.unter.map((u) => it(u, true)).join("")}` : it(p)).join("")}</ul></section>`;
  const spalte = (n) => `<div class="kpl-spalte">${m.abschnitte.filter((s) => s.spalte === n).map(sec).join("")}</div>`;
  const pfand = [m.glas != null ? `<b>* zzgl. ${e(kplGeld(m.glas))} Pfand</b> pro Glas` : "", m.zange != null ? `<b>**</b> plus ${e(kplGeld(m.zange))} Pfand für die Feuerzange` : ""].filter(Boolean).join(" · ");
  return `<div class="kpl-blatt" style="--fs:${fs}px"><img class="kpl-hg" src="${KPL_HG}" alt="">
    <div class="kpl-body">${spalte(1)}${spalte(2)}</div>
    <div class="kpl-ft"><div class="kpl-ftl">${pfand ? `<div>${pfand}</div>` : ""}${m.becher != null ? `<div><b>Außer Haus:</b> Thermobecher für Speisen zum Mitnehmen ${e(kplGeld(m.becher))}</div>` : ""}
      ${m.legende.length ? `<div class="kpl-klein"><b>Kennzeichnung:</b> ${e(m.legende.join(" · "))}</div>` : ""}
      <div class="kpl-info">Informationen zu Allergenen und Zusatzstoffen: siehe extra Aushang oder fragen Sie unsere Mitarbeiter. Trotz sorgfältiger Zubereitung können Spuren weiterer Allergene nicht ausgeschlossen werden.</div></div>
      <div class="kpl-cash">Nur Barzahlung</div></div></div>`;
}
const KPL_CSS = `.kpl-halter{position:absolute;left:0;top:0;width:1123px;height:794px;z-index:-5;pointer-events:none}
.kpl-blatt{position:relative;width:1123px;height:794px;overflow:hidden;background:#f7efe2;color:#2a1c14;font-family:"KPL Serif",Georgia,serif;font-size:var(--fs);line-height:1.18}
.kpl-hg{position:absolute;left:0;top:0;width:1123px;height:794px}
.kpl-body{position:absolute;left:85px;top:183px;width:952px;height:467px;display:flex;gap:45px}
.kpl-spalte{flex:1;min-width:0;display:flex;flex-direction:column;gap:calc(var(--fs)*.75)}
.kpl-sec h3{margin:0 0 calc(var(--fs)*.28);font-weight:700;font-style:italic;color:#741521;font-size:1.22em;line-height:1.1;padding-bottom:3px;border-bottom:1.4px solid rgba(168,122,28,.6)}
.kpl-sec ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:calc(var(--fs)*.27)}
.kpl-it{display:flex;align-items:baseline;gap:9px}.kpl-it.vr{padding-left:22px}
.kpl-n{min-width:0;font-weight:600}.kpl-t{font-size:.8em;opacity:.8}.kpl-kz{font-size:.55em;font-weight:600;vertical-align:.7em;line-height:0;white-space:nowrap}
.kpl-d{display:block;font-size:.74em;opacity:.82;margin-top:1px}
.kpl-lead{flex:1;min-width:22px;border-bottom:1.4px dotted #a87a1c;opacity:.7;transform:translateY(-.25em)}
.kpl-p{white-space:nowrap;color:#741521;font-weight:700;font-family:"KPL Sans",Arial,sans-serif}.kpl-st{display:inline-block;min-width:1.05em}
.kpl-gr{font-weight:600}
.kpl-ft{position:absolute;left:63px;top:671px;width:997px;height:98px;display:flex;align-items:center;gap:20px;font-family:"KPL Sans",Arial,sans-serif;font-size:15.7px;line-height:1.35}
.kpl-ftl{flex:1;min-width:0}.kpl-ft b{color:#741521}.kpl-klein{font-size:12.4px}.kpl-info{font-size:12.4px;font-style:italic;opacity:.85;margin-top:2px}
.kpl-cash{flex:none;background:#741521;color:#fff;font-weight:700;font-size:28px;padding:6px 20px;border-radius:9px;letter-spacing:.02em}`;

// Schriften als @font-face im <style> (nicht über FontFace-API): html2canvas malt in einer Kopie der Seite – nur so hat die Kopie dieselben Schriften
// (mit FontFace-API standen die Wörter in der Kopie mit Ersatzschrift und überlappten im Bild)
function kplSchriften() {
  if (KPL.schriften) return KPL.schriften;
  const s = [["KPL Serif", "source-serif-4-latin-600-normal", "600", "normal"], ["KPL Serif", "source-serif-4-latin-600-italic", "600", "italic"],
    ["KPL Serif", "source-serif-4-latin-700-normal", "700", "normal"], ["KPL Serif", "source-serif-4-latin-700-italic", "700", "italic"],
    ["KPL Sans", "source-sans-3-latin-400-normal", "400", "normal"], ["KPL Sans", "source-sans-3-latin-600-normal", "600", "normal"], ["KPL Sans", "source-sans-3-latin-700-normal", "700", "normal"]];
  if (!$("kplSchrift")) { const st = document.createElement("style"); st.id = "kplSchrift";
    st.textContent = s.map(([fam, datei, w, st2]) => `@font-face{font-family:"${fam}";src:url(schriften/${datei}.woff2) format("woff2");font-weight:${w};font-style:${st2};font-display:block}`).join("\n");
    document.head.appendChild(st); }
  return (KPL.schriften = Promise.all(s.map(([fam, , w, st2]) => document.fonts.load(`${st2} ${w} 20px "${fam}"`).catch(() => null))));
}

async function kplLaden() {
  let r = null; try { r = await api("etiketten_artikel", {}, { warten: true }); } catch (e) { if (e?.status === 403) throw e; }
  if (Array.isArray(r?.artikel) && r.artikel.length) { KPL.artikel = r.artikel; KPL.quelle = "manager"; KPL.stand = r.stand; return; }
  const d = await (await fetch(new URL("../Kasse/", location.href).href + "etiketten/artikel.json?x=" + Date.now(), { cache: "no-store", signal: zeitSignal(15000) })).json();
  KPL.artikel = d.artikel || []; KPL.quelle = "kasse"; KPL.stand = d.stand || null;
}

// Liste setzen, Schrift so groß wie möglich (passt alles in den hellen Kasten?), als Bild malen
async function kplBild(m) {
  await kplSchriften(); await bfBibliothek();
  if (!$("kplStil")) { const st = document.createElement("style"); st.id = "kplStil"; st.textContent = KPL_CSS; document.head.appendChild(st); }
  const h = document.createElement("div"); h.className = "kpl-halter"; document.body.appendChild(h);
  try {
    let fs = 26;
    for (; fs >= 17; fs -= 0.5) {
      h.innerHTML = kplHtml(m, fs);
      const b = h.querySelector(".kpl-body"), ft = h.querySelector(".kpl-ftl"), grenze = b.getBoundingClientRect().bottom + 1;
      const zuLang = [...b.querySelectorAll(".kpl-spalte")].some((s) => s.scrollHeight > s.clientHeight + 1 || [...s.children].some((c) => c.getBoundingClientRect().bottom > grenze));
      // Kennzeichen nie allein am Zeilenanfang (z. B. „Winzerglühwein (weiß)“ / „(L, 2, 3)“) – dann lieber kleiner
      const kzAllein = [...b.querySelectorAll(".kpl-kz")].some((k) => k.getBoundingClientRect().left < k.parentElement.getBoundingClientRect().left + 4);
      if (!zuLang && !kzAllein && ft.scrollHeight <= h.querySelector(".kpl-ft").clientHeight + 1) break;
    }
    const img = h.querySelector(".kpl-hg"); if (!img.complete) await new Promise((ok) => { img.onload = img.onerror = ok; });
    const c = await window.html2canvas(h.querySelector(".kpl-blatt"), { scale: 3508 / 1123, backgroundColor: "#f7efe2", logging: false, scrollX: 0, scrollY: -window.scrollY, windowWidth: Math.max(1200, innerWidth) });
    return { bild: c.toDataURL("image/jpeg", 0.9), fs };
  } finally { h.remove(); }
}

async function kplStart() {
  const f = blattAuf("kplBlatt", `<h3 style="margin-top:0">📋 Kundenpreisliste Weihnachtsmarkt 2026</h3><div id="kplInhalt"><p class="hinweis">⏳ Preise und Allergene werden geholt …</p></div>`);
  try { await kplLaden(); } catch (e) { $("kplBlatt")?.remove(); return meldeFehler(e); }
  const m = kplModell(KPL.artikel), stand = KPL.stand ? wann(KPL.stand) : "";
  const quelle = KPL.quelle === "manager" ? `✅ Aktuelle Preise und Allergene aus dem PC-Manager${stand ? ` (veröffentlicht ${esc(stand)})` : ""}`
    : "⚠️ Grundstand aus der Kasse – noch nicht vom PC-Manager veröffentlicht. Im PC-Manager „🏷️ Für Preisetiketten in der Club-App veröffentlichen“ antippen, dann stehen hier die aktuellen Preise.";
  const inhalt = $("kplInhalt"); if (!inhalt) return;
  inhalt.innerHTML = `<p class="hinweis">${quelle}</p>${m.hinweise.length ? `<div class="hinweis" style="background:#fff6dc;color:#664400;border-radius:8px;padding:8px 10px"><b>Bitte prüfen:</b><ul style="margin:4px 0 0;padding-left:18px">${m.hinweise.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    <div id="kplVorschau" style="margin:10px 0;text-align:center"><p class="hinweis">⏳ Liste wird gesetzt …</p></div>
    <div class="knoepfe"><button class="knopf haupt" id="kplDruck" disabled>🖨️ Drucken / PDF</button><button class="knopf" data-zu="1">Schließen</button></div>`;
  f.querySelector("[data-zu]")?.addEventListener("click", () => $("kplBlatt")?.remove());
  try {
    const r = await kplBild(m); KPL.bild = r.bild;
    const v = $("kplVorschau"); if (!v) return;
    v.innerHTML = `<img src="${r.bild}" alt="Vorschau der Kundenpreisliste" style="width:100%;max-width:900px;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.25)">`;
    const k = $("kplDruck"); k.disabled = false; k.onclick = () => { $("kplBlatt")?.remove(); druckStarten("kundenpreisliste", { bild: KPL.bild }); };
  } catch (e) { const v = $("kplVorschau"); if (v) v.innerHTML = `<p class="hinweis">⚠️ ${esc(fehlerText(e))}</p>`; }
}
