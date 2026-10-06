// KC-CLUB-BAUERNSKAT-MG: Spielregeln Bauernskat – wörtliche Kopie aus index.html (erzeugt von tools/bauernskat/server-kopie.mjs, nicht von Hand ändern)
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
export { BSK_FARBEN, bskNeu, bskErlaubt, bskSpielen, bskStichAbschliessen, bskErgebnis, bskSumme };
