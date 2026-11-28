// KC-CLUB-SAMEN „🌱 Mein Garten“ (Wunschliste #84, Konzept docs/KONZEPT_SAMEN_GARTEN.md, Antworten Hansi 05.11.2026: Samen auch für besondere Taten,
// eigene Kachel, 12 Pflanzen ok, kein Push, Club-Garten mit Frage nach dem Säen, Pflanze geht nie ein; „sparsam mit Datenbank-Abfragen und Traffic“).
// Für Tage dabei und besondere Taten gibt es Samentütchen; daraus wächst über echte Tage eine Pflanze in 5 Stufen. Gießen ~alle 3 Tage, Düngen ~alle 3 Wochen
// oder 🤖 Automatik. Ohne Wasser wächst sie nur halb so schnell und lässt die Blätter hängen – sie geht nie ein.
// Sparsam: höchstens ein Aufruf „garten_tag“ je Tag und Gerät (beim Start), sonst nur beim Säen/Pflegen/Club-Garten. Wachstum rechnet die App selbst
// (gtWachs = gleiche Rechnung wie gartenWachs auf dem Server). Alle Bilder sind hier gezeichnet (SVG), keine Bilder aus dem Netz.
// Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const GT_ARTEN = [ // Registry (gleich halten mit GARTEN_ARTEN im Server): neue Pflanze = neuer Eintrag + Zeichnung in gtSvg; dein = „Dein“/„Deine“ für die Hinweise
  { id: "rose", t: "Rose", sym: "🌹", gruppe: "blumen", tage: 21, fertig: "blüht", farbe: "#c62845", dein: "Deine" },
  { id: "sonnenblume", t: "Sonnenblume", sym: "🌻", gruppe: "blumen", tage: 21, fertig: "blüht", farbe: "#f2b705", dein: "Deine" },
  { id: "tulpe", t: "Tulpe", sym: "🌷", gruppe: "blumen", tage: 21, fertig: "blüht", farbe: "#e2557f", dein: "Deine" },
  // KC-CLUB-GARTEN-BUNT (Wunsch Hansi 15.11.2026 „Auch Blumen, damit der Garten bunt wird“)
  { id: "mohn", t: "Mohn", sym: "🌺", gruppe: "blumen", tage: 21, fertig: "blüht", farbe: "#d7262b", dein: "Dein" },
  { id: "kornblume", t: "Kornblume", sym: "💙", gruppe: "blumen", tage: 21, fertig: "blüht", farbe: "#3f6fd6", dein: "Deine" },
  { id: "ringelblume", t: "Ringelblume", sym: "🧡", gruppe: "blumen", tage: 21, fertig: "blüht", farbe: "#f08a1c", dein: "Deine" },
  { id: "margerite", t: "Margerite", sym: "🌼", gruppe: "blumen", tage: 21, fertig: "blüht", farbe: "#ffffff", dein: "Deine" },
  { id: "dahlie", t: "Dahlie", sym: "🌸", gruppe: "blumen", tage: 28, fertig: "blüht", farbe: "#d6458f", dein: "Deine" },
  { id: "basilikum", t: "Basilikum", sym: "🌿", gruppe: "kraeuter", tage: 21, fertig: "ist erntereif", farbe: "#3f9b3a", dein: "Dein" },
  { id: "rosmarin", t: "Rosmarin", sym: "🌿", gruppe: "kraeuter", tage: 21, fertig: "ist erntereif", farbe: "#5f7f5a", dein: "Dein" },
  { id: "schnittlauch", t: "Schnittlauch", sym: "🌱", gruppe: "kraeuter", tage: 21, fertig: "ist erntereif und blüht", farbe: "#9b59b6", dein: "Dein" },
  // KC-CLUB-GARTEN-ERNTE (Konzept docs/KONZEPT_CLUBGARTEN_KRAEUTERERNTE.md, Freigabe Hansi 15.11.2026): drei neue Kräuter
  { id: "petersilie", t: "Petersilie", sym: "🌿", gruppe: "kraeuter", tage: 28, fertig: "ist erntereif", farbe: "#2f8a3a", dein: "Deine" },
  { id: "dill", t: "Dill", sym: "🌿", gruppe: "kraeuter", tage: 35, fertig: "ist erntereif", farbe: "#6aa84f", dein: "Dein" },
  { id: "kresse", t: "Gartenkresse", sym: "🌱", gruppe: "kraeuter", tage: 7, fertig: "ist erntereif", farbe: "#7cb342", dein: "Deine" },
  { id: "lavendel", t: "Lavendel", sym: "💜", gruppe: "straeucher", tage: 35, fertig: "blüht", farbe: "#8e6cc9", dein: "Dein" },
  { id: "johannisbeere", t: "Johannisbeere", sym: "🍒", gruppe: "straeucher", tage: 35, fertig: "trägt Beeren", farbe: "#c0392b", dein: "Deine" },
  { id: "hortensie", t: "Hortensie", sym: "💠", gruppe: "straeucher", tage: 35, fertig: "blüht", farbe: "#5b8fd6", dein: "Deine" },
  { id: "apfel", t: "Apfelbaum", sym: "🍎", gruppe: "baeume", tage: 56, fertig: "trägt Äpfel", farbe: "#d6312f", dein: "Dein" },
  { id: "zitrone", t: "Zitronenbaum", sym: "🍋", gruppe: "baeume", tage: 56, fertig: "trägt Zitronen", farbe: "#f4d03f", dein: "Dein" },
  { id: "olive", t: "Olivenbaum", sym: "🫒", gruppe: "baeume", tage: 56, fertig: "trägt Oliven", farbe: "#4b5320", dein: "Dein" },
];
const GT_GRUPPEN = [["blumen", "🌸 Blumen"], ["kraeuter", "🌿 Kräuter"], ["straeucher", "🫐 Sträucher"], ["baeume", "🌳 Bäume"]];
const GT_STUFEN = ["Keimling", "kleine Pflanze", "halb gewachsen", "fast fertig"];
const GT_WASSER_TAGE = 3, GT_DUENGER_TAGE = 21, GT_CACHE = "kc_club_garten", GT_STUFE_MERK = "kc_club_garten_stufen", GT_REIF_MERK = "kc_club_garten_reif";
// KC-CLUB-GARTEN-ERNTE: ein festes Rezept je Kraut (Vorlagen docs/KRAEUTERGARTEN_REZEPTE.md) – liegt in der App, keine Datenbank, keine Abfrage
const GT_REZEPTE = {
  basilikum: { t: "Basilikum-Pinienkern-Pesto", lust: "ein frisches Basilikum-Pesto", fuer: "Für 2 Portionen Pasta",
    zutaten: ["30 g Basilikumblätter", "15 g Pinienkerne", "25 g Parmesan, fein gerieben", "½ kleine Knoblauchzehe", "40–50 ml mildes Olivenöl", "Salz nach Geschmack"],
    schritte: ["Basilikum waschen und gut trocken tupfen. Pinienkerne ohne Fett leicht anrösten und abkühlen lassen.", "Basilikum, Pinienkerne und Knoblauch mit 40 ml Öl kurz mixen oder mörsern. Parmesan unterrühren, bei Bedarf etwas Öl ergänzen und abschmecken.", "Für Pasta das Pesto mit 1–2 EL Nudelwasser glattrühren und abseits der Herdplatte unter die heißen Nudeln mischen."],
    dazu: "Schmeckt auch auf Tomatenbrot." },
  rosmarin: { t: "Zitronen-Rosmarin-Quark", lust: "einen Zitronen-Rosmarin-Quark zu Ofenkartoffeln", fuer: "Für 2 Portionen als Beilage",
    zutaten: ["250 g Quark", "2 EL Naturjoghurt", "etwa ½ TL sehr fein gehackte frische Rosmarinnadeln", "etwas Abrieb einer Bio-Zitrone", "Salz und Pfeffer"],
    schritte: ["Quark und Joghurt glatt rühren.", "Rosmarin und Zitronenabrieb unterrühren. Mit Salz und Pfeffer abschmecken."], dazu: "Dazu passen knusprige Ofenkartoffeln." },
  schnittlauch: { t: "Schnittlauch-Radieschen-Quark", lust: "einen Schnittlauch-Radieschen-Quark", fuer: "Für 2 Portionen als Beilage",
    zutaten: ["250 g Quark", "2 EL Naturjoghurt", "2 EL fein geschnittener Schnittlauch", "2 Radieschen, fein gewürfelt", "Salz und Pfeffer"],
    schritte: ["Quark und Joghurt cremig rühren.", "Schnittlauch und Radieschen unterheben und abschmecken. Ein paar Schnittlauchröllchen für obenauf zurückhalten."], dazu: "Dazu passen Pellkartoffeln oder Schwarzbrot." },
  petersilie: { t: "Petersilien-Walnuss-Pesto", lust: "ein Petersilien-Walnuss-Pesto", fuer: "Für 2 Portionen Pasta oder als Würze für Ofengemüse",
    zutaten: ["30 g glatte Petersilie, Blätter und dünne Stiele", "20 g Walnüsse", "25 g Parmesan, fein gerieben", "40–50 ml mildes Olivenöl oder Rapsöl", "1–2 TL Zitronensaft", "Salz und Pfeffer nach Geschmack"],
    schritte: ["Petersilie waschen und gut trocknen. Die Walnüsse ohne Fett anrösten und abkühlen lassen.", "Petersilie und Walnüsse zunächst mit 40 ml Öl grob mixen. Parmesan und Zitronensaft unterrühren, bei Bedarf etwas Öl ergänzen und abschmecken."], dazu: "Dazu passen Ofengemüse, Grillkartoffeln oder Pasta." },
  dill: { t: "Dill-Zitronen-Quark", lust: "einen Dill-Zitronen-Quark", fuer: "Für 2 Portionen als Beilage",
    zutaten: ["250 g Quark", "2 EL Naturjoghurt", "2 EL fein geschnittener Dill", "1 TL Zitronensaft und etwas Abrieb einer Bio-Zitrone", "Salz und Pfeffer"],
    schritte: ["Quark mit Joghurt, Zitronensaft und Zitronenabrieb verrühren.", "Dill unterheben und mit Salz und Pfeffer abschmecken."], dazu: "Dazu passen Gurke, Ofenkartoffeln oder gebratener Fisch." },
  kresse: { t: "Kresse-Senf-Quark", lust: "einen Kresse-Senf-Quark aufs Schwarzbrot", fuer: "Für 1–2 Scheiben Schwarzbrot",
    zutaten: ["100 g Quark", "1 EL Naturjoghurt", "1 EL frisch abgeschnittene Gartenkresse", "½ TL mittelscharfer Senf", "Salz nach Geschmack"],
    schritte: ["Quark, Joghurt und Senf glatt rühren.", "Kresse unterheben und abschmecken. Auf Schwarzbrot streichen und etwas Kresse darüberstreuen."], dazu: "" },
  // KC-CLUB-GARTEN-STRAEUCHER (Wunsch Hansi 28.11.2026 „Ja“ – Rezepte auch für Sträucher und eines mit allen Kräutern). Hortensie ist giftig → nie ein Rezept.
  lavendel: { t: "Lavendel-Zitronen-Limonade", lust: "eine Lavendel-Zitronen-Limonade", fuer: "Für 1 Liter (4 Gläser)",
    zutaten: ["1 TL getrocknete oder 2 TL frische Lavendelblüten (unbehandelt, für die Küche)", "60 g Zucker oder Honig", "250 ml Wasser zum Aufkochen", "Saft von 2 Zitronen", "750 ml kaltes Mineralwasser", "Eiswürfel und Zitronenscheiben"],
    schritte: ["Wasser mit Zucker aufkochen, vom Herd nehmen, Lavendelblüten hineingeben und 10 Minuten ziehen lassen – nicht länger, sonst schmeckt es nach Seife.", "Durch ein feines Sieb gießen und abkühlen lassen.", "Mit Zitronensaft und kaltem Mineralwasser auffüllen, mit Eis und Zitronenscheiben servieren."],
    dazu: "Wenig Lavendel ist mehr – lieber nachwürzen als zu viel." },
  johannisbeere: { t: "Johannisbeer-Quarkspeise", lust: "eine Johannisbeer-Quarkspeise", fuer: "Für 4 Schälchen",
    zutaten: ["250 g rote Johannisbeeren", "500 g Quark", "200 g Sahne", "60 g Zucker", "1 Päckchen Vanillezucker", "Saft von ½ Zitrone", "4 Löffelbiskuits (nach Wunsch)"],
    schritte: ["Johannisbeeren waschen und mit einer Gabel von den Rispen streifen. Ein paar schöne Rispen zum Verzieren beiseitelegen.", "Quark mit Zucker, Vanillezucker und Zitronensaft glatt rühren. Sahne steif schlagen und unterheben.", "Abwechselnd Quarkcreme, Beeren und zerbröselte Löffelbiskuits in Schälchen schichten, mit den Rispen verzieren und 30 Minuten kühlen."],
    dazu: "Die Säure der Beeren und die milde Creme passen perfekt zusammen." },
};
// Mit allen Kräutern (ab 3 verschiedenen erntereifen Kräutern) – Grüne Kräutersoße nach Frankfurter Art, angepasst an die Gartenkräuter
const GT_KRAEUTER_ALLE = "gruene", GT_KRAEUTER_MIN = 3;
const GT_REZEPT_ALLE = { t: "Grüne Kräutersoße aus deinem Garten", lust: "eine Grüne Kräutersoße mit allen deinen Kräutern", fuer: "Für 4 Portionen",
  zutaten: ["100 g gemischte Kräuter aus deinem Garten: Petersilie, Schnittlauch, Dill, Kresse, etwas Basilikum (Rosmarin höchstens eine Prise)", "200 g Schmand oder saure Sahne", "150 g Naturjoghurt", "1 TL mittelscharfer Senf", "2 hart gekochte Eier", "1 Spritzer Zitronensaft", "Salz, Pfeffer, 1 Prise Zucker"],
  schritte: ["Kräuter waschen, gut trocken schütteln und grobe Stiele entfernen.", "Kräuter mit dem Joghurt fein pürieren oder sehr fein hacken.", "Schmand, Senf und Zitronensaft unterrühren. Eier fein hacken und unterheben.", "Mit Salz, Pfeffer und einer Prise Zucker abschmecken und 30 Minuten kühl ziehen lassen."],
  dazu: "Klassisch mit Pellkartoffeln und halbierten Eiern – je mehr verschiedene Kräuter, desto besser." };
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
// Blüten der neuen Blumen (KC-CLUB-GARTEN-BUNT): [Blätter, rx, ry, Abstand, [Mitte r, Farbe], innerer Kranz [n, rx, ry, Farbe, Abstand]]
const GT_BLUETE = { mohn: [4, 7, 8, 7, [3.2, "#222"]], kornblume: [9, 2.4, 7.5, 7, [2.6, "#27408b"]], ringelblume: [14, 2.6, 6.5, 6.5, [3.6, "#b5651d"]],
  margerite: [12, 2.4, 7, 7.5, [3.6, "#f4c20d"]], dahlie: [10, 3.4, 8, 7.5, [2.6, "#a8326b"], [8, 2.4, 5, "#f08bbd", 4]] };
const gtKranz = (n, rx, ry, f, cy, abst, extra = "") => [...Array(n)].map((_, i) => `<ellipse cx="50" cy="${cy - abst}" rx="${rx}" ry="${ry}" fill="${f}"${extra} transform="rotate(${(i * 360) / n} 50 ${cy})"/>`).join("");
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
      else if (GT_BLUETE[art]) { const [n, rx, ry, abst, mitte, innen] = GT_BLUETE[art], cy = ky - 6;
        p += gtKranz(n, rx, ry, a.farbe, cy, abst, art === "margerite" ? ' stroke="#c9c9c9" stroke-width=".7"' : "");
        if (innen) p += gtKranz(innen[0], innen[1], innen[2], innen[3], cy, innen[4]);
        p += `<circle cx="50" cy="${cy}" r="${mitte[0]}" fill="${mitte[1]}"/>`; }
      else p += `<circle cx="50" cy="${ky - 6}" r="9" fill="${a.farbe}"/><path d="M45 ${ky - 6} Q50 ${ky - 13} 55 ${ky - 6} Q50 ${ky - 1} 45 ${ky - 6}" fill="#8e1b30" opacity=".55"/><circle cx="50" cy="${ky - 6}" r="2.6" fill="#8e1b30" opacity=".7"/>`;
    }
  } else if (a.gruppe === "kraeuter") {
    const n = stufe + 1;
    for (let i = 0; i < n; i++) {
      const x = 50 + (i - (n - 1) / 2) * 8, hh = h * (0.75 + (i % 2) * 0.25);
      if (art === "schnittlauch") p += `<path d="M${x} ${y0} Q${x + (i % 2 ? 3 : -3)} ${y0 - hh / 2} ${x + (i % 2 ? 2 : -2)} ${y0 - hh}" stroke="#4e9a45" stroke-width="2.2" fill="none" stroke-linecap="round"/>` + (stufe === 4 && i % 2 === 0 ? `<circle cx="${x + (i % 2 ? 2 : -2)}" cy="${y0 - hh - 3}" r="4.2" fill="${a.farbe}"/>` : "");
      else if (art === "rosmarin") p += stiel(x, hh) + [...Array(Math.max(2, Math.round(hh / 7)))].map((_, j) => `<path d="M${x} ${y0 - 5 - j * 6} l${j % 2 ? 5 : -5} -3" stroke="${a.farbe}" stroke-width="1.8" stroke-linecap="round"/>`).join("") + (stufe === 4 && i === 1 ? `<circle cx="${x}" cy="${y0 - hh - 2}" r="2.2" fill="#8fa8e0"/>` : "");
      else if (art === "petersilie") p += stiel(x, hh) + blatt(x, y0 - hh * 0.6, i % 2 ? 5 : -5, 6, a.farbe) + [-6, 0, 6].map((d) => blatt(x, y0 - hh - 2, d, 5, a.farbe)).join("");
      else if (art === "dill") p += `<path d="M${x} ${y0} L${x} ${y0 - hh}" stroke="#5b8f3c" stroke-width="1.6"/>` + [...Array(Math.max(2, Math.round(hh / 6)))].map((_, j) => `<path d="M${x} ${y0 - 6 - j * 5.5} l-6 -4 M${x} ${y0 - 6 - j * 5.5} l6 -4 M${x} ${y0 - 8 - j * 5.5} l-3 -5 M${x} ${y0 - 8 - j * 5.5} l3 -5" stroke="${a.farbe}" stroke-width="1" stroke-linecap="round"/>`).join("");
      else if (art === "kresse") p += [-3, 3].map((d) => `<path d="M${x + d / 2} ${y0} L${x + d} ${y0 - hh * 0.55}" stroke="#9ccc65" stroke-width="1.4"/><ellipse cx="${x + d - 2}" cy="${y0 - hh * 0.55 - 1}" rx="2.6" ry="1.7" fill="${a.farbe}"/><ellipse cx="${x + d + 2}" cy="${y0 - hh * 0.55 - 1}" rx="2.6" ry="1.7" fill="${a.farbe}"/>`).join("");
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
  if (gtReifeHinweis(g, lagen)) return; // KC-CLUB-GARTEN-ERNTE: Reife hat Vorrang
  if (g.offen > 0) return gtHinweis(`🎁 ${g.tage >= 7 ? `Du bist jetzt ${g.tage} Tage dabei` : "Danke fürs Mitmachen"} – dafür gibt es ${g.offen === 1 ? "ein Samentütchen" : g.offen + " Samentütchen"}. Öffnen?`, "🎁 Öffnen", () => gartenStart(true));
  if (gewachsen) { const [p, l] = gewachsen; return gtHinweis(`${l.a.sym} ${l.a.dein} ${l.a.t} ${l.stufe === 4 ? l.a.fertig : "ist gewachsen – jetzt " + l.text}. Möchtest du nachsehen?`, "🌱 Ansehen", () => gartenStart()); }
  if (durst) { const [, l] = durst; return gtHinweis(`💧 ${l.a.dein} ${l.a.t} hat Durst.`, "💧 Gießen", () => gartenStart()); }
  if (gedueng) { const [, l] = gedueng; return gtHinweis(`${l.a.sym} ${l.a.dein} ${l.a.t} wurde heute gedüngt. Möchtest du nachsehen?`, "🌱 Ansehen", () => gartenStart()); }
}
function gtHinweis(text, knopf, fn, versuch = 0, gezeigt = null) {
  // nie über ein offenes Fenster: dann bis zu 10 × alle 6 s nochmal schauen (z. B. nach dem Film-Hinweis beim Start), sonst entfällt er heute
  if (document.querySelector(FENSTER_OFFEN + ", .dlg, #rgSchicht") || aktuelleAnsicht !== "start") { if (versuch < 10) setTimeout(() => gtHinweis(text, knopf, fn, versuch + 1, gezeigt), 6000); return; }
  document.getElementById("gtHinweis")?.remove(); gtStil();
  const d = document.createElement("div"); d.id = "gtHinweis"; d.className = "gt-hinweis"; d.setAttribute("role", "status");
  d.innerHTML = `<span>${esc(text)}</span><button type="button" class="knopf klein haupt">${esc(knopf)}</button><button type="button" class="gt-zu" aria-label="Schließen">✕</button>`;
  const [ja, zu] = d.querySelectorAll("button"); ja.onclick = () => { d.remove(); fn(); }; zu.onclick = () => d.remove();
  if (gezeigt) { const sp = document.createElement("button"); sp.type = "button"; sp.className = "knopf klein"; sp.textContent = "Später"; sp.onclick = () => d.remove(); zu.before(sp); }
  document.body.appendChild(d); setTimeout(() => d.remove(), 15000);
  if (gezeigt) gezeigt(); // erst jetzt gilt er als gezeigt (wartet er auf ein offenes Fenster, noch nicht)
}
// KC-CLUB-GARTEN-ERNTE: reife Kräuter je Pflanze nur einmal je Gerät melden – auch nach Urlaub nur ein Sammelhinweis; „Später“ wiederholt nichts
function gtReifeHinweis(g, lagen = g.pflanzen.map((p) => [p, gtLage(p, g.automatik)])) {
  let gemeldet = []; try { gemeldet = JSON.parse(localStorage.getItem(GT_REIF_MERK) || "[]"); } catch {}
  const reif = lagen.filter(([p, l]) => (l.a.gruppe === "kraeuter" || l.a.gruppe === "straeucher") && l.stufe === 4 && GT_REZEPTE[p.art] && !gemeldet.includes(p.id));
  if (!reif.length) return false;
  const merken = () => { try { localStorage.setItem(GT_REIF_MERK, JSON.stringify([...gemeldet, ...reif.map(([p]) => p.id)].slice(-60))); } catch {} };
  if (reif.length === 1) { const [p, l] = reif[0];
    const kraut = l.a.gruppe === "kraeuter";
    gtHinweis(`${kraut ? "🌿" : l.a.sym} ${l.a.dein} ${l.a.t} ${kraut ? "ist erntereif" : l.a.fertig}! Lust auf ${GT_REZEPTE[p.art].lust}?`, "📖 Rezept ansehen", () => gtRezept(p.art), 0, merken);
  } else { const namen = reif.map(([, l]) => `${l.a.dein.toLowerCase()} ${l.a.t}`), liste = namen.slice(0, -1).join(", ") + " und " + namen[namen.length - 1];
    const nurKraut = reif.every(([, l]) => l.a.gruppe === "kraeuter");
    // ab 3 verschiedenen reifen Kräutern im Garten gibt es dazu die Grüne Kräutersoße
    const arten = [...new Set(lagen.filter(([p, l]) => l.a.gruppe === "kraeuter" && l.stufe === 4).map(([p]) => p.art))];
    gtHinweis(`${nurKraut ? "🌿" : "🧺"} ${liste.charAt(0).toUpperCase() + liste.slice(1)} sind ${nurKraut ? "erntereif" : "bereit für die Küche"}. Die passenden Rezepte warten auf dich.`, "📖 Rezepte ansehen",
      () => gtRezeptAuswahl([...new Set(reif.map(([p]) => p.art))], arten.length >= GT_KRAEUTER_MIN), 0, merken); }
  return true;
}
// Start, wenn der Tag heute schon gezählt ist: ohne Abfrage nur aus dem Zwischenspeicher prüfen, ob ein Kraut reif geworden ist
async function gartenReif() { const c = gtAusSpeicher(); if (c?.g?.pflanzen?.length) gtReifeHinweis(c.g); }
// Rezeptkarte – nimmt der Pflanze nichts weg (die Ernte in der App ist ein Spielstand)
function gtRezept(art) {
  const alle = art === GT_KRAEUTER_ALLE, r = alle ? GT_REZEPT_ALLE : GT_REZEPTE[art], a = alle ? { sym: "🥣", t: "alle deine Kräuter", gruppe: "kraeuter" } : gtArt(art); if (!r || !a) return; gtStil();
  blattAuf("gtRezept", `<h3 style="margin:0">📖 ${esc(r.t)}</h3><p class="hinweis" style="margin:4px 0 8px">${a.sym} Aus deinem Garten: ${esc(a.t)} · ${esc(r.fuer)}</p>
    <div class="gt-rezept"><h4>Zutaten</h4><ul>${r.zutaten.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>
    <h4>Zubereitung</h4><ol>${r.schritte.map((z) => `<li>${esc(z)}</li>`).join("")}</ol>${r.dazu ? `<p><b>${esc(r.dazu)}</b></p>` : ""}</div>
    <p class="hinweis">${a.gruppe === "kraeuter" && !alle ? `Wenig geerntet? Ein kleiner Quark gelingt schon mit 100 g Quark, 1 EL Naturjoghurt und etwa 1 EL frisch geschnittenen Kräutern${art === "rosmarin" ? " – bei Rosmarin nur eine Prise" : ""}. ` : ""}Deine Pflanze bleibt im Garten – zum Kochen nimmst du ${a.gruppe === "kraeuter" ? "echte Kräuter" : "echte Zutaten"}.</p>
    <div class="knoepfe"><button class="knopf haupt" onclick="fensterZu($('gtRezept'))">Schließen</button></div>`);
}
function gtRezeptAuswahl(arten, mitAllen = false) {
  gtStil();
  blattAuf("gtRezept", `<h3 style="margin:0">🌿 Erntereif in deinem Garten</h3><p class="hinweis" style="margin:4px 0 8px">Welches Rezept möchtest du ansehen?</p>
    <div class="gt-wahl">${mitAllen ? `<button type="button" class="gt-wahl-k" onclick="gtRezept('${GT_KRAEUTER_ALLE}')"><span style="font-size:2.4em">🥣</span><b>Alle Kräuter</b><small>${esc(GT_REZEPT_ALLE.t)}</small></button>` : ""}${arten.map((art) => { const a = gtArt(art), r = GT_REZEPTE[art]; return `<button type="button" class="gt-wahl-k" onclick="gtRezept('${art}')">${gtSvg(art, 4)}<b>${a.sym} ${esc(a.t)}</b><small>${esc(r.t)}</small></button>`; }).join("")}</div>
    <div class="knoepfe"><button class="knopf haupt" onclick="fensterZu($('gtRezept'))">Schließen</button></div>`);
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
      ${l.stufe === 4 && GT_REZEPTE[p.art] ? `<button type="button" class="knopf klein haupt gt-rezept-knopf" onclick="gtRezept('${esc(p.art)}')">📖 Rezept ansehen</button>` : ""}
      ${g.automatik ? '<small class="gt-auto">🤖 Gärtner kümmert sich</small>' : `<div class="gt-pflege">
        <button type="button" class="knopf klein${l.durst ? " haupt" : ""}" onclick="einmal(this, () => gtPflege('${esc(p.id)}', 'giessen'))">💧 Gießen</button>
        ${l.duengen ? `<button type="button" class="knopf klein" onclick="einmal(this, () => gtPflege('${esc(p.id)}', 'duengen'))">🧪 Düngen</button>` : ""}</div>
        ${l.durst ? `<small class="gt-durst-text">${l.haengt ? "😟 lässt die Blätter hängen – " : ""}hat Durst</small>` : ""}`}</div>`; };
  const bis = g.naechste - g.tage;
  blattAuf("gtBlatt", `<h3 style="margin:0">🌱 Mein Garten${nurTest("garten") ? ' <small class="hinweis">🔒 nur für dich (Test)</small>' : ""}</h3>
    <p class="hinweis" style="margin:4px 0 8px">Du bist seit <b>${g.tage} Tag${g.tage === 1 ? "" : "en"}</b> dabei · nächstes Samentütchen in ${bis} Tag${bis === 1 ? "" : "en"} (bei ${g.naechste}) – oder für besondere Taten.</p>
    ${g.offen > 0 ? `<button type="button" class="gt-tuete-knopf" onclick="gtTuetchen()"><span class="gt-tuete">🎁</span><span><b>${g.offen === 1 ? "Ein Samentütchen" : g.offen + " Samentütchen"} für dich!</b><small>Antippen, öffnen und eine Pflanze aussuchen</small></span></button>` : ""}
    ${new Set(g.pflanzen.filter((p) => { const l = gtLage(p, g.automatik); return l.a.gruppe === "kraeuter" && l.stufe === 4; }).map((p) => p.art)).size >= GT_KRAEUTER_MIN
      ? `<button type="button" class="knopf klein haupt gt-rezept-knopf" style="margin:0 0 8px" onclick="gtRezept('${GT_KRAEUTER_ALLE}')">🥣 Rezept mit allen Kräutern: ${esc(GT_REZEPT_ALLE.t)}</button>` : ""}
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
.gt-rezept h4{margin:8px 0 4px}.gt-rezept ul,.gt-rezept ol{margin:0 0 6px;padding-left:1.3em}.gt-rezept li{margin:2px 0}.gt-rezept-knopf{margin-top:4px}
.gt-spross{opacity:0;transform-origin:50px 84px;animation:gtSpross 1.2s ease-out 3.4s both}@keyframes gtSpross{0%{opacity:0;transform:scaleY(.1)}100%{opacity:1;transform:none}}`;
  document.head.appendChild(s);
}
