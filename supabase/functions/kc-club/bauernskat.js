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
function bskNeu(vorhand) { // Spieler 0 = ich, 1 = Gegner
  const d = bskMischen(), sp = [0, 1].map((i) => ({ hand: d.slice(i * 16, i * 16 + 8), tisch: [0, 1, 2, 3].map((j) => ({ unten: d[i * 16 + 8 + j], oben: d[i * 16 + 12 + j] })) }));
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
