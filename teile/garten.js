// KC-CLUB-SAMEN „🌱 Mein Garten“ (Wunschliste #84, Konzept docs/KONZEPT_SAMEN_GARTEN.md, Antworten Hansi 05.11.2026: Samen auch für besondere Taten,
// eigene Kachel, 12 Pflanzen ok, kein Push, Club-Garten mit Frage nach dem Säen, Pflanze geht nie ein; „sparsam mit Datenbank-Abfragen und Traffic“).
// Für Tage dabei und besondere Taten gibt es Samentütchen; daraus wächst über echte Tage eine Pflanze in 5 Stufen. Gießen ~alle 3 Tage, Düngen ~alle 3 Wochen
// oder 🤖 Automatik. Ohne Wasser wächst sie nur halb so schnell und lässt die Blätter hängen – sie geht nie ein.
// Sparsam: höchstens ein Aufruf „garten_tag“ je Tag und Gerät (beim Start), sonst nur beim Säen/Pflegen/Club-Garten. Wachstum rechnet die App selbst
// (gtWachs = gleiche Rechnung wie gartenWachs auf dem Server). Alle Bilder sind hier gezeichnet (SVG), keine Bilder aus dem Netz.
// Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const GT_ARTEN = [ // Registry (gleich halten mit GARTEN_ARTEN im Server): neue Pflanze = neuer Eintrag + Zeichnung in gtSvg
  { id: "rose", t: "Rose", sym: "🌹", gruppe: "blumen", tage: 21, fertig: "blüht", farbe: "#c62845" },
  { id: "sonnenblume", t: "Sonnenblume", sym: "🌻", gruppe: "blumen", tage: 21, fertig: "blüht", farbe: "#f2b705" },
  { id: "tulpe", t: "Tulpe", sym: "🌷", gruppe: "blumen", tage: 21, fertig: "blüht", farbe: "#e2557f" },
  { id: "basilikum", t: "Basilikum", sym: "🌿", gruppe: "kraeuter", tage: 21, fertig: "ist erntereif", farbe: "#3f9b3a" },
  { id: "rosmarin", t: "Rosmarin", sym: "🌿", gruppe: "kraeuter", tage: 21, fertig: "ist erntereif", farbe: "#5f7f5a" },
  { id: "schnittlauch", t: "Schnittlauch", sym: "🌱", gruppe: "kraeuter", tage: 21, fertig: "blüht", farbe: "#9b59b6" },
  { id: "lavendel", t: "Lavendel", sym: "💜", gruppe: "straeucher", tage: 35, fertig: "blüht", farbe: "#8e6cc9" },
  { id: "johannisbeere", t: "Johannisbeere", sym: "🍒", gruppe: "straeucher", tage: 35, fertig: "trägt Beeren", farbe: "#c0392b" },
  { id: "hortensie", t: "Hortensie", sym: "💠", gruppe: "straeucher", tage: 35, fertig: "blüht", farbe: "#5b8fd6" },
  { id: "apfel", t: "Apfelbaum", sym: "🍎", gruppe: "baeume", tage: 56, fertig: "trägt Äpfel", farbe: "#d6312f" },
  { id: "zitrone", t: "Zitronenbaum", sym: "🍋", gruppe: "baeume", tage: 56, fertig: "trägt Zitronen", farbe: "#f4d03f" },
  { id: "olive", t: "Olivenbaum", sym: "🫒", gruppe: "baeume", tage: 56, fertig: "trägt Oliven", farbe: "#4b5320" },
];
const GT_GRUPPEN = [["blumen", "🌸 Blumen"], ["kraeuter", "🌿 Kräuter"], ["straeucher", "🫐 Sträucher"], ["baeume", "🌳 Bäume"]];
const GT_STUFEN = ["Keimling", "kleine Pflanze", "halb gewachsen", "fast fertig"];
const GT_WASSER_TAGE = 3, GT_DUENGER_TAGE = 21, GT_CACHE = "kc_club_garten", GT_STUFE_MERK = "kc_club_garten_stufen";
const GT = { g: null, versatz: 0, club: null, clubZeit: 0 };
const gtArt = (id) => GT_ARTEN.find((a) => a.id === id);
const gtJetzt = () => Date.now() + GT.versatz;
// Wachstum in „Tagen“ (gleiche Rechnung wie gartenWachs im Server): mit Wasser voll, danach halb so schnell; Automatik = immer voll
function gtWachs(p, jetztMs, auto) {
  const st = Date.parse(p.stand), bis = auto ? Infinity : Date.parse(p.gegossen) + GT_WASSER_TAGE * 864e5;
  const voll = Math.max(0, Math.min(jetztMs, bis) - st), halb = Math.max(0, jetztMs - Math.max(st, bis));
  return (Number(p.wachs) || 0) + (voll + halb / 2) / 864e5;
}
// Lage einer Pflanze: Stufe 0–4 (4 = fertig), Durst (≥ 3 Tage ohne Wasser), hängende Blätter (≥ 5 Tage), Dünger fällig (≥ 21 Tage) – nie „tot“
function gtLage(p, auto, jetztMs = gtJetzt()) {
  const a = gtArt(p.art) || GT_ARTEN[0], w = gtWachs(p, jetztMs, auto), anteil = Math.min(1, w / a.tage);
  const ohne = (jetztMs - Date.parse(p.gegossen)) / 864e5, seitDuenger = (jetztMs - Date.parse(p.geduengt)) / 864e5;
  const stufe = anteil >= 1 ? 4 : Math.min(3, Math.floor(anteil * 4));
  return { a, w, anteil, stufe, durst: !auto && ohne >= GT_WASSER_TAGE, haengt: !auto && ohne >= 5, duengen: !auto && seitDuenger >= GT_DUENGER_TAGE,
    // Automatik: alle 21 Tage seit dem Säen wird gedüngt – „heute gedüngt“ nur am Tag selbst (für den Hinweis beim Öffnen)
    autoGeduengt: auto && (jetztMs - Date.parse(p.gesaet)) / 864e5 >= GT_DUENGER_TAGE && ((jetztMs - Date.parse(p.gesaet)) / 864e5) % GT_DUENGER_TAGE < 1,
    text: stufe === 4 ? a.fertig : GT_STUFEN[stufe] };
}
// ---------- Zeichnungen (SVG, 100 × 110): Schale unten, Pflanze wächst je Stufe ----------
function gtSvg(art, stufe, haengt = false, klein = false) {
  const a = gtArt(art) || GT_ARTEN[0], gr = "#4f8a4b", dk = "#3a6e37", h = [12, 26, 40, 54, 64][stufe] || 12, y0 = 84;
  const blatt = (x, y, dx, r = 7, f = gr) => `<ellipse cx="${x + dx}" cy="${y}" rx="${r}" ry="${r / 2.2}" fill="${f}" transform="rotate(${dx < 0 ? 25 : -25} ${x + dx} ${y})"/>`;
  const stiel = (x = 50, hh = h) => `<path d="M${x} ${y0} C${x - 2} ${y0 - hh / 2} ${x + 2} ${y0 - hh / 2} ${x} ${y0 - hh}" stroke="${dk}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  let p = "";
  if (stufe === 0) p = `${stiel(50, 10)}${blatt(50, y0 - 9, -5, 5)}${blatt(50, y0 - 9, 5, 5)}`;
  else if (a.gruppe === "blumen") {
    p = stiel(); for (let i = 1; i <= Math.min(stufe, 3); i++) p += blatt(50, y0 - (h * i) / 4, i % 2 ? -7 : 7, 8);
    const ky = y0 - h;
    if (stufe === 3) p += `<ellipse cx="50" cy="${ky - 3}" rx="4" ry="6" fill="${a.farbe}" opacity=".85"/><path d="M46 ${ky} Q50 ${ky - 4} 54 ${ky}" fill="${gr}"/>`;
    if (stufe === 4) {
      if (art === "sonnenblume") p += [...Array(12)].map((_, i) => `<ellipse cx="50" cy="${ky - 11}" rx="3.2" ry="8" fill="${a.farbe}" transform="rotate(${i * 30} 50 ${ky - 3})"/>`).join("") + `<circle cx="50" cy="${ky - 3}" r="6" fill="#6b3e1d"/>`;
      else if (art === "tulpe") p += `<path d="M42 ${ky - 14} L45 ${ky - 4} Q50 ${ky + 2} 55 ${ky - 4} L58 ${ky - 14} L54 ${ky - 9} L50 ${ky - 16} L46 ${ky - 9} Z" fill="${a.farbe}"/>`;
      else p += `<circle cx="50" cy="${ky - 6}" r="9" fill="${a.farbe}"/><path d="M45 ${ky - 6} Q50 ${ky - 13} 55 ${ky - 6} Q50 ${ky - 1} 45 ${ky - 6}" fill="#8e1b30" opacity=".55"/><circle cx="50" cy="${ky - 6}" r="2.6" fill="#8e1b30" opacity=".7"/>`;
    }
  } else if (a.gruppe === "kraeuter") {
    const n = stufe + 1;
    for (let i = 0; i < n; i++) {
      const x = 50 + (i - (n - 1) / 2) * 8, hh = h * (0.75 + (i % 2) * 0.25);
      if (art === "schnittlauch") p += `<path d="M${x} ${y0} Q${x + (i % 2 ? 3 : -3)} ${y0 - hh / 2} ${x + (i % 2 ? 2 : -2)} ${y0 - hh}" stroke="#4e9a45" stroke-width="2.2" fill="none" stroke-linecap="round"/>` + (stufe === 4 && i % 2 === 0 ? `<circle cx="${x + (i % 2 ? 2 : -2)}" cy="${y0 - hh - 3}" r="4.2" fill="${a.farbe}"/>` : "");
      else if (art === "rosmarin") p += stiel(x, hh) + [...Array(Math.max(2, Math.round(hh / 7)))].map((_, j) => `<path d="M${x} ${y0 - 5 - j * 6} l${j % 2 ? 5 : -5} -3" stroke="${a.farbe}" stroke-width="1.8" stroke-linecap="round"/>`).join("") + (stufe === 4 && i === 1 ? `<circle cx="${x}" cy="${y0 - hh - 2}" r="2.2" fill="#8fa8e0"/>` : "");
      else p += stiel(x, hh) + blatt(x, y0 - hh * 0.55, -5, 7, a.farbe) + blatt(x, y0 - hh * 0.85, 5, 7.5, a.farbe) + `<ellipse cx="${x}" cy="${y0 - hh - 2}" rx="4" ry="5" fill="${a.farbe}"/>`;
    }
  } else if (a.gruppe === "straeucher") {
    const r = 6 + stufe * 4, cy = y0 - r - 2;
    p = [-1, 0, 1].map((k) => `<circle cx="${50 + k * r * 0.8}" cy="${cy + Math.abs(k) * 3}" r="${r * 0.75}" fill="${k ? gr : dk}"/>`).join("");
    if (stufe === 4) {
      const pkt = [[-14, -4], [-6, -12], [4, -9], [13, -2], [-2, 2], [9, 6], [-11, 7]];
      if (art === "lavendel") p += pkt.map(([dx, dy]) => `<rect x="${50 + dx - 1.6}" y="${cy + dy - 9}" width="3.2" height="10" rx="1.6" fill="${a.farbe}"/>`).join("");
      else if (art === "hortensie") p += [[-9, -4], [6, -8], [8, 6], [-6, 7]].map(([dx, dy]) => `<circle cx="${50 + dx}" cy="${cy + dy}" r="6.5" fill="${a.farbe}" opacity=".92"/>`).join("");
      else p += pkt.map(([dx, dy]) => `<circle cx="${50 + dx}" cy="${cy + dy}" r="2.6" fill="${a.farbe}"/>`).join("");
    }
  } else { // Bäume: Stamm + Krone
    const sh = 8 + stufe * 7, r = 6 + stufe * 5, cy = y0 - sh - r * 0.6;
    p = `<rect x="47.5" y="${y0 - sh}" width="5" height="${sh}" rx="2" fill="#7a4a26"/><circle cx="50" cy="${cy}" r="${r}" fill="${art === "olive" ? "#7d9a6b" : gr}"/><circle cx="${50 - r * 0.45}" cy="${cy + r * 0.25}" r="${r * 0.6}" fill="${art === "olive" ? "#6c8a5c" : dk}"/>`;
    if (stufe === 4) p += [[-10, -6], [7, -10], [11, 4], [-4, 8], [0, -2]].map(([dx, dy]) => `<circle cx="${50 + dx}" cy="${cy + dy}" r="${art === "olive" ? 2.6 : 3.6}" fill="${a.farbe}"/>`).join("");
  }
  const schale = `<path d="M24 86 H76 L70 104 H30 Z" fill="#b5603a"/><rect x="21" y="81" width="58" height="7" rx="3" fill="#9c4f2e"/><ellipse cx="50" cy="83" rx="25" ry="3" fill="#5a3a22"/>`;
  return `<svg class="gt-bild${haengt ? " gt-haengt" : ""}" viewBox="0 0 100 110" ${klein ? 'width="44" height="48"' : ""} aria-hidden="true"><g class="gt-pflanze">${p}</g>${schale}</svg>`;
}
// ---------- Daten (sparsam: Zwischenspeicher auf dem Gerät, ein Abruf je Tag) ----------
function gtMerken(r) {
  GT.g = r.garten; GT.versatz = r.jetzt ? Date.parse(r.jetzt) - Date.now() : 0;
  try { localStorage.setItem(GT_CACHE, JSON.stringify({ tag: heuteIso(), g: GT.g, v: GT.versatz })); } catch {}
  if (typeof kachelnZeigen === "function" && aktuelleAnsicht === "start") kachelnZeigen();
}
function gtAusSpeicher() { try { const c = JSON.parse(localStorage.getItem(GT_CACHE) || "null"); if (c?.g) { GT.g = c.g; GT.versatz = c.v || 0; return c; } } catch {} return null; }
async function gtLaden(nurWennAlt = true) {
  const c = gtAusSpeicher();
  if (nurWennAlt && c?.tag === heuteIso()) return GT.g;
  gtMerken(await api("garten_tag")); return GT.g;
}
// Beim Start (höchstens einmal am Tag, aus app.js): Tag zählen, dann EIN kleiner Hinweis – kein Fenster, keine Push-Nachricht
async function gartenTag() {
  const g = await gtLaden(true).catch(() => null); if (!g) return;
  let alt = {}; try { alt = JSON.parse(localStorage.getItem(GT_STUFE_MERK) || "{}"); } catch {}
  const lagen = g.pflanzen.map((p) => [p, gtLage(p, g.automatik)]), neu = {};
  lagen.forEach(([p, l]) => (neu[p.id] = l.stufe));
  try { localStorage.setItem(GT_STUFE_MERK, JSON.stringify(neu)); } catch {}
  const gewachsen = lagen.find(([p, l]) => alt[p.id] !== undefined && l.stufe > alt[p.id]), durst = lagen.find(([, l]) => l.durst), gedueng = lagen.find(([, l]) => l.autoGeduengt);
  if (g.offen > 0) return gtHinweis(`🎁 ${g.tage >= 7 ? `Du bist jetzt ${g.tage} Tage dabei` : "Danke fürs Mitmachen"} – dafür gibt es ${g.offen === 1 ? "ein Samentütchen" : g.offen + " Samentütchen"}. Öffnen?`, "🎁 Öffnen", () => gartenStart(true));
  if (gewachsen) { const [p, l] = gewachsen; return gtHinweis(`${l.a.sym} Deine ${l.a.t} ${l.stufe === 4 ? l.a.fertig : "ist gewachsen – jetzt " + l.text}. Möchtest du sie ansehen?`, "🌱 Ansehen", () => gartenStart()); }
  if (durst) { const [, l] = durst; return gtHinweis(`💧 Deine ${l.a.t} hat Durst.`, "💧 Gießen", () => gartenStart()); }
  if (gedueng) { const [, l] = gedueng; return gtHinweis(`${l.a.sym} Deine ${l.a.t} wurde heute gedüngt. Möchtest du sie ansehen?`, "🌱 Ansehen", () => gartenStart()); }
}
function gtHinweis(text, knopf, fn, versuch = 0) {
  // nie über ein offenes Fenster: dann bis zu 10 × alle 6 s nochmal schauen (z. B. nach dem Film-Hinweis beim Start), sonst entfällt er heute
  if (document.querySelector(FENSTER_OFFEN + ", .dlg, #rgSchicht") || aktuelleAnsicht !== "start") { if (versuch < 10) setTimeout(() => gtHinweis(text, knopf, fn, versuch + 1), 6000); return; }
  document.getElementById("gtHinweis")?.remove(); gtStil();
  const d = document.createElement("div"); d.id = "gtHinweis"; d.className = "gt-hinweis"; d.setAttribute("role", "status");
  d.innerHTML = `<span>${esc(text)}</span><button type="button" class="knopf klein haupt">${esc(knopf)}</button><button type="button" class="gt-zu" aria-label="Schließen">✕</button>`;
  const [ja, zu] = d.querySelectorAll("button"); ja.onclick = () => { d.remove(); fn(); }; zu.onclick = () => d.remove();
  document.body.appendChild(d); setTimeout(() => d.remove(), 15000);
}
// ---------- Garten-Blatt ----------
async function gartenStart(tuetchen = false) {
  gtStil(); gtAusSpeicher();
  if (GT.g) gtZeigen(); else blattAuf("gtBlatt", `<h3 style="margin:0">🌱 Mein Garten</h3><p class="hinweis">⏳ Der Garten wird geholt …</p>`);
  try { await gtLaden(true); gtZeigen(); } catch (e) { if (!GT.g) blattAuf("gtBlatt", `<h3 style="margin:0">🌱 Mein Garten</h3><p class="hinweis">⚠️ Gerade nicht erreichbar: ${esc(e?.message || String(e))}</p><div class="knoepfe"><button class="knopf haupt" onclick="fensterZu($('gtBlatt'))">Schließen</button></div>`); return; }
  if (tuetchen && GT.g.offen > 0) gtTuetchen();
}
function gtZeigen() {
  const g = GT.g; if (!g) return;
  const karte = (p) => { const l = gtLage(p, g.automatik), pz = Math.round(l.anteil * 100);
    return `<div class="gt-karte${l.durst ? " gt-durst" : ""}">${gtSvg(p.art, l.stufe, l.haengt)}<b>${l.a.sym} ${esc(l.a.t)}</b><small>${esc(l.text)}${l.stufe < 4 ? ` · ${pz} %` : ""}</small>
      <div class="gt-balken"><i style="width:${pz}%"></i></div>
      ${g.automatik ? '<small class="gt-auto">🤖 Gärtner kümmert sich</small>' : `<div class="gt-pflege">
        <button type="button" class="knopf klein${l.durst ? " haupt" : ""}" onclick="einmal(this, () => gtPflege('${esc(p.id)}', 'giessen'))">💧 Gießen</button>
        ${l.duengen ? `<button type="button" class="knopf klein" onclick="einmal(this, () => gtPflege('${esc(p.id)}', 'duengen'))">🧪 Düngen</button>` : ""}</div>
        ${l.durst ? `<small class="gt-durst-text">${l.haengt ? "😟 lässt die Blätter hängen – " : ""}hat Durst</small>` : ""}`}</div>`; };
  const bis = g.naechste - g.tage;
  blattAuf("gtBlatt", `<h3 style="margin:0">🌱 Mein Garten${nurTest("garten") ? ' <small class="hinweis">🔒 nur für dich (Test)</small>' : ""}</h3>
    <p class="hinweis" style="margin:4px 0 8px">Du bist seit <b>${g.tage} Tag${g.tage === 1 ? "" : "en"}</b> dabei · nächstes Samentütchen in ${bis} Tag${bis === 1 ? "" : "en"} (bei ${g.naechste}) – oder für besondere Taten.</p>
    ${g.offen > 0 ? `<button type="button" class="gt-tuete-knopf" onclick="gtTuetchen()"><span class="gt-tuete">🎁</span><span><b>${g.offen === 1 ? "Ein Samentütchen" : g.offen + " Samentütchen"} für dich!</b><small>Antippen, öffnen und eine Pflanze aussuchen</small></span></button>` : ""}
    ${g.pflanzen.length ? `<div class="gt-beet">${g.pflanzen.map(karte).join("")}</div>` : `<p class="hinweis">Noch wächst hier nichts. ${g.offen ? "Öffne dein Samentütchen!" : `Dein erstes Samentütchen gibt es nach 7 Tagen in der App.`}</p>`}
    <label class="gt-schalter"><input type="checkbox" ${g.automatik ? "checked" : ""} onchange="gtAuto(this)"> 🤖 Gärtner kümmert sich (gießt und düngt von selbst)</label>
    <label class="gt-schalter"><input type="checkbox" ${g.club ? "checked" : ""} onchange="gtClub(this)"> 🏡 Meine Pflanzen im Club-Garten zeigen</label>
    <p class="hinweis" style="margin:2px 0 6px">Keine Sorge: Deine Pflanzen gehen nie ein. Ohne Wasser wachsen sie nur langsamer.</p>
    <div class="knoepfe"><button class="knopf" onclick="gtClubgarten()">🏡 Club-Garten ansehen</button><button class="knopf haupt" onclick="fensterZu($('gtBlatt'))">Schließen</button></div>`);
}
function gtTuetchen() {
  const g = GT.g; if (!g?.offen) return;
  const da = new Set(g.pflanzen.map((p) => p.art));
  blattAuf("gtTuete", `<h3 style="margin:0">🎁 Dein Samentütchen</h3><p class="hinweis" style="margin:4px 0 8px">Such dir aus, was bei dir wachsen soll:</p>
    ${GT_GRUPPEN.map(([gr, titel]) => `<h4 style="margin:8px 0 4px">${titel}</h4><div class="gt-wahl">${GT_ARTEN.filter((a) => a.gruppe === gr).map((a) => `<button type="button" class="gt-wahl-k" ${da.has(a.id) ? 'disabled title="wächst schon bei dir"' : ""} onclick="gtWahl('${a.id}')">${gtSvg(a.id, 4)}<b>${a.sym} ${esc(a.t)}</b><small>${da.has(a.id) ? "wächst schon bei dir" : `gut ${Math.round(a.tage / 7)} Wochen`}</small></button>`).join("")}</div>`).join("")}
    <div class="knoepfe"><button class="knopf haupt" onclick="fensterZu($('gtTuete'))">Später</button></div>`);
  $("gtTuete").querySelector(".blatt-innen")?.classList.add("gt-tuete-auf");
}
async function gtWahl(art) {
  const a = gtArt(art); if (!a) return;
  if (!(await frage(`${a.sym} ${a.t} – möchtest du deinen Samen aussäen?`, { ja: "🌱 Ja, aussäen", nein: "Andere wählen" }))) return;
  let r; try { r = await api("garten_saeen", { art }); } catch (e) { return meldeFehler(e); }
  fensterZu($("gtTuete")); gtMerken(r);
  await gtSaeFilm(a);
  gtZeigen(); melde(`🌱 Gesät! In den nächsten Tagen siehst du, wie deine ${a.t} wächst.`);
  if (!GT.g.clubGefragt) { // Wunsch Hansi: nach dem Säen fragen, ob die Pflanze in den Club-Garten darf
    const ja = await frage(`🏡 Gibst du deine Pflanzen für den Club-Garten frei?\n\nDann sehen alle Mitglieder im Club-Garten deine ${a.t} mit deinem Vornamen. Du kannst das jederzeit wieder ausschalten.`, { ja: "🏡 Ja, freigeben", nein: "Nein, nur für mich" });
    try { gtMerken(await api("garten_club", { an: !!ja })); gtZeigen(); } catch (e) { meldeFehler(e); }
  }
}
// Kleiner Film beim Säen (ca. 5 s): Schale, Gießkanne gießt, Samen fallen, ein Spross kommt – bei „ohne Animationen“ sofort fertig
function gtSaeFilm(a) {
  return new Promise((fertig) => {
    if (document.documentElement.classList.contains("ohne-anim")) return fertig();
    const f = document.createElement("div"); f.className = "gt-film"; f.setAttribute("aria-hidden", "true");
    f.innerHTML = `<div class="gt-film-buehne"><svg viewBox="0 0 100 110">
      <g class="gt-kanne"><path d="M60 20 h18 v14 h-18 z" fill="#5b8fd6"/><path d="M60 24 L44 30 L46 33 L60 30 Z" fill="#4a78b8"/><path d="M78 22 q8 4 0 10" stroke="#4a78b8" stroke-width="2.5" fill="none"/></g>
      ${[0, 1, 2, 3].map((i) => `<circle class="gt-tropfen" style="animation-delay:${0.9 + i * 0.18}s" cx="${44 + i * 2}" cy="34" r="1.6" fill="#7fb3ff"/>`).join("")}
      ${[0, 1, 2].map((i) => `<ellipse class="gt-samen" style="animation-delay:${2 + i * 0.25}s" cx="${46 + i * 4}" cy="40" rx="1.8" ry="1.2" fill="#6b3e1d"/>`).join("")}
      <g class="gt-spross"><path d="M50 84 C49 79 51 77 50 73" stroke="#3a6e37" stroke-width="2.4" fill="none"/><ellipse cx="46" cy="73" rx="4" ry="2" fill="#4f8a4b"/><ellipse cx="54" cy="73" rx="4" ry="2" fill="#4f8a4b"/></g>
      <path d="M24 86 H76 L70 104 H30 Z" fill="#b5603a"/><rect x="21" y="81" width="58" height="7" rx="3" fill="#9c4f2e"/><ellipse class="gt-erde" cx="50" cy="83" rx="25" ry="3" fill="#7a5233"/></svg>
      <p>${esc(a.sym)} ${esc(a.t)} wird gesät …</p></div>`;
    f.onclick = () => { f.remove(); fertig(); };
    document.body.appendChild(f); setTimeout(() => { f.remove(); fertig(); }, 5200);
  });
}
async function gtPflege(id, was) {
  try { gtMerken(await api("garten_pflege", { id, was })); gtZeigen(); melde(was === "giessen" ? "💧 Gegossen – danke!" : "🧪 Gedüngt – das gibt einen kleinen Schub."); } catch (e) { meldeFehler(e); }
}
async function gtAuto(el) {
  const an = el.checked; el.disabled = true;
  try { gtMerken(await api("garten_auto", { an })); gtZeigen(); melde(an ? "🤖 Der Gärtner kümmert sich ab jetzt ums Gießen und Düngen." : "🧑‍🌾 Du kümmerst dich wieder selbst."); } catch (e) { el.checked = !an; meldeFehler(e); } finally { el.disabled = false; }
}
async function gtClub(el) {
  const an = el.checked; el.disabled = true;
  try { gtMerken(await api("garten_club", { an })); GT.club = null; melde(an ? "🏡 Deine Pflanzen stehen jetzt im Club-Garten." : "🏡 Deine Pflanzen sind nicht mehr im Club-Garten."); } catch (e) { el.checked = !an; meldeFehler(e); } finally { el.disabled = false; }
}
// Club-Garten: nur beim Öffnen holen, 10 Minuten gemerkt
async function gtClubgarten() {
  blattAuf("gtClub", `<h3 style="margin:0">🏡 Club-Garten</h3><p class="hinweis">⏳ …</p>`);
  try { if (!GT.club || Date.now() - GT.clubZeit > 600000) { GT.club = await api("garten_clubgarten"); GT.clubZeit = Date.now(); } }
  catch (e) { blattAuf("gtClub", `<h3 style="margin:0">🏡 Club-Garten</h3><p class="hinweis">⚠️ ${esc(e?.message || String(e))}</p><div class="knoepfe"><button class="knopf haupt" onclick="fensterZu($('gtClub'))">Schließen</button></div>`); return; }
  const j = Date.parse(GT.club.jetzt) || Date.now(), beete = GT.club.beete || [];
  blattAuf("gtClub", `<h3 style="margin:0">🏡 Club-Garten</h3><p class="hinweis" style="margin:4px 0 8px">Hier wächst, was die Mitglieder freigegeben haben.</p>
    ${beete.length ? `<div class="gt-wiese">${beete.flatMap((b) => b.pflanzen.map((p) => { const l = gtLage({ ...p, geduengt: p.stand }, b.automatik, j);
      return `<div class="gt-karte klein">${gtSvg(p.art, l.stufe, l.haengt)}<b>${l.a.sym} ${esc(l.a.t)}</b><small>🏷️ ${esc(b.name)}${b.ich ? " (du)" : ""}</small></div>`; })).join("")}</div>`
      : '<p class="hinweis">Noch hat niemand seine Pflanzen in den Club-Garten gestellt.</p>'}
    <div class="knoepfe"><button class="knopf haupt" onclick="fensterZu($('gtClub'))">Schließen</button></div>`);
}
function gtStil() {
  if (document.getElementById("gtStil")) return;
  const s = document.createElement("style"); s.id = "gtStil";
  s.textContent = `.gt-beet,.gt-wiese{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px;margin:6px 0 10px;padding:8px;border-radius:12px;background:linear-gradient(#e9f4e4,#d4e8c8)}
.gt-wiese{background:linear-gradient(#dff0ff 0,#e9f4e4 30%,#cfe5bf)}
:root.dunkel .gt-beet,:root.dunkel .gt-wiese{background:linear-gradient(#26331f,#1d2919)}
.gt-karte{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:6px;border-radius:10px;background:var(--karte);box-shadow:0 1px 3px #0002}
.gt-karte.klein .gt-bild{width:70px}.gt-bild{width:96px;height:auto;display:block}
.gt-karte small{color:var(--grau,#666);font-size:.78rem}.gt-durst{outline:2px solid #5b8fd6}.gt-durst-text{color:#2d5fa8!important;font-weight:700}:root.dunkel .gt-durst-text{color:#8fc0ff!important}
.gt-haengt .gt-pflanze{filter:saturate(.55);transform:rotate(5deg) scaleY(.94);transform-origin:50px 84px}
.gt-balken{width:80%;height:5px;border-radius:3px;background:#0001;overflow:hidden}.gt-balken i{display:block;height:100%;background:#4f8a4b}
.gt-pflege{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-top:3px}.gt-auto{margin-top:3px}
.gt-schalter{display:flex;gap:8px;align-items:center;margin:6px 0;font-weight:600}.gt-schalter input{width:20px;height:20px}
.gt-tuete-knopf{display:flex;gap:10px;align-items:center;width:100%;text-align:left;padding:10px;border:2px dashed #c58a00;border-radius:12px;background:#fff8e1;color:#3a2a00;cursor:pointer;margin:4px 0 8px}
.gt-tuete-knopf small{display:block;font-weight:400}.gt-tuete{font-size:2rem;animation:gtWackel 1.4s ease-in-out infinite}
@keyframes gtWackel{0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
.gt-wahl{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.gt-wahl-k{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px;border-radius:10px;border:1px solid #0002;background:var(--karte);color:inherit;cursor:pointer;font:inherit}
.gt-wahl-k .gt-bild{width:64px}.gt-wahl-k small{font-size:.72rem;opacity:.75}.gt-wahl-k:disabled{opacity:.45;cursor:default}
.gt-tuete-auf{animation:gtAuf .45s ease-out}@keyframes gtAuf{from{transform:scaleY(.6) translateY(-30px);opacity:0}to{transform:none;opacity:1}}
.gt-hinweis{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9000;display:flex;gap:8px;align-items:center;max-width:min(94vw,520px);padding:10px 12px;border-radius:14px;background:var(--karte,#fff);color:inherit;box-shadow:0 6px 22px #0004;border-left:5px solid #4f8a4b;animation:gtAuf .35s ease-out}
.gt-hinweis span{flex:1;font-weight:600}.gt-zu{border:0;background:none;font-size:1.1rem;cursor:pointer;color:inherit;padding:4px}
.gt-film{position:fixed;inset:0;z-index:9600;display:grid;place-items:center;background:#0008}.gt-film-buehne{background:var(--karte,#fff);border-radius:18px;padding:14px 18px;text-align:center;width:min(78vw,300px)}
.gt-film svg{width:100%;height:auto}.gt-film p{margin:4px 0 0;font-weight:700}
.gt-kanne{animation:gtKanne 1.8s ease-in-out .2s both;transform-origin:70px 28px}@keyframes gtKanne{0%{transform:translate(20px,-10px);opacity:0}30%{transform:none;opacity:1}55%{transform:rotate(-22deg)}85%{transform:rotate(-22deg);opacity:1}100%{transform:rotate(0) translate(10px,-6px);opacity:0}}
.gt-tropfen{opacity:0;animation:gtFall .6s ease-in 3 both}@keyframes gtFall{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(46px)}}
.gt-samen{opacity:0;animation:gtSamen .9s ease-in both}@keyframes gtSamen{0%{opacity:1;transform:translateY(-14px)}100%{opacity:1;transform:translateY(42px)}}
.gt-erde{animation:gtNass 1s ease 1.4s both}@keyframes gtNass{to{fill:#4a2f1c}}
.gt-spross{opacity:0;transform-origin:50px 84px;animation:gtSpross 1.2s ease-out 3.4s both}@keyframes gtSpross{0%{opacity:0;transform:scaleY(.1)}100%{opacity:1;transform:none}}`;
  document.head.appendChild(s);
}
