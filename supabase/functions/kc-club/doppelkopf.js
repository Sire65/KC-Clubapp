// KC-CLUB-DK-MG: Spielregeln Doppelkopf – wörtliche Kopie aus app.js (erzeugt von tools/dk/server-kopie.mjs, nicht von Hand ändern)
const BSK_FARBEN = ["kr", "pi", "he", "ka"], BSK_WERTE = ["A", "10", "K", "D", "B", "9", "8", "7"];
const BSK_AUGEN = { A: 11, "10": 10, K: 4, D: 3, B: 2, "9": 0, "8": 0, "7": 0 };
const DK_KEY = "kc_club_doppelkopf", DK_NAMEN = ["Du", "Erika", "Kurt", "Paul"], DK_WERTE = ["A", "10", "K", "9"];
const DK_TRUMPF = ["he-10", "kr-D", "pi-D", "he-D", "ka-D", "kr-B", "pi-B", "he-B", "ka-B", "ka-A", "ka-10", "ka-K", "ka-9"];
const dkBasis = (id) => id.slice(0, id.lastIndexOf("-"));
const dkIstTrumpf = (id) => DK_TRUMPF.includes(dkBasis(id));
const dkFarbe = (id) => (dkIstTrumpf(id) ? "T" : id.split("-")[0]);
const dkAugen = (id) => BSK_AUGEN[id.split("-")[1]];
const dkRang = (id) => (dkIstTrumpf(id) ? 100 + (DK_TRUMPF.length - DK_TRUMPF.indexOf(dkBasis(id))) : 4 - DK_WERTE.indexOf(id.split("-")[1]));
const dkSumme = (l) => l.reduce((a, k) => a + dkAugen(k), 0);
function dkStichGewinner(stich) { // stich = [{s, k}] in Spielreihenfolge – gleiche Karte: die erste gewinnt (nur „>“)
  const f = dkFarbe(stich[0].k); let best = stich[0];
  for (const x of stich.slice(1)) { const fx = dkFarbe(x.k), fb = dkFarbe(best.k);
    if ((fx === "T" && fb !== "T") || (fx === fb && dkRang(x.k) > dkRang(best.k))) best = x; }
  return best.s;
}
function dkNeu(geber, menschen = [0]) { // KC-CLUB-DK-MG: menschen = Plätze, an denen Menschen sitzen (gegen Mitglieder 0 und 2)
  const d = []; for (const f of BSK_FARBEN) for (const w of ["A", "10", "K", "D", "B", "9"]) for (const n of [1, 2]) d.push(`${f}-${w}-${n}`); // 48 Karten
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  const hand = [0, 1, 2, 3].map((s) => d.slice(s * 12, s * 12 + 12));
  const re = [0, 1, 2, 3].filter((s) => hand[s].some((k) => dkBasis(k) === "kr-D"));
  const z = { hand, geber, amZug: (geber + 1) % 4, stich: [], stiche: [[], [], [], []], letzter: null, phase: "spiel", re, solo: null, hochzeit: null, offen: [], sonder: [] };
  // Beide ♣ Damen bei einem: Computer sagen Hochzeit an; ein Mensch entscheidet selbst (Phase „vorbehalt“: 💍 Hochzeit oder 🤫 still allein)
  if (re.length === 1) { if (menschen.includes(re[0])) { z.phase = "vorbehalt"; z.braut = re[0]; } else z.hochzeit = { von: re[0], partner: null }; }
  return z;
}
// Hochzeit: wer von den anderen in den ersten 3 Stichen zuerst einen Stich macht, wird Partner (Re); sonst spielt die Braut allein
function dkVorbehalt(z, art) {
  if (z.phase !== "vorbehalt") return;
  const s = z.braut ?? 0; if (art === "hochzeit") z.hochzeit = { von: s, partner: null }; else z.solo = s;
  z.phase = "spiel";
}
const dkIstRe = (z, s) => z.re.includes(s);
function dkErlaubt(z, s) {
  const h = z.hand[s]; if (!z.stich.length) return [...h];
  const f = dkFarbe(z.stich[0].k), bed = h.filter((k) => dkFarbe(k) === f); return bed.length ? bed : [...h];
}
function dkSpielen(z, s, k) {
  const i = z.hand[s].indexOf(k); if (i < 0) throw new Error("Karte nicht vorhanden");
  z.hand[s].splice(i, 1); z.stich.push({ s, k }); if (dkBasis(k) === "kr-D" && !z.offen.includes(s)) z.offen.push(s);
  z.amZug = (s + 1) % 4; return z.stich.length === 4;
}
function dkStichAbschliessen(z) {
  const g = dkStichGewinner(z.stich), aug = dkSumme(z.stich.map((x) => x.k)), letzter = z.hand.every((h) => !h.length);
  z.stiche[g].push(...z.stich.map((x) => x.k));
  if (z.solo == null) { // Sonderpunkte nur im Normalspiel
    if (aug >= 40) z.sonder.push({ art: "doppelkopf", s: g });
    for (const x of z.stich) if (dkBasis(x.k) === "ka-A" && dkIstRe(z, x.s) !== dkIstRe(z, g)) z.sonder.push({ art: "fuchs", s: g, von: x.s });
    const sieg = z.stich.find((x) => x.s === g);
    if (letzter && dkBasis(sieg.k) === "kr-B") z.sonder.push({ art: "karlchen", s: g });
  }
  if (z.hochzeit && z.hochzeit.partner == null && z.solo == null) { const nr = z.stiche.reduce((a, l) => a + l.length, 0) / 4;
    if (g !== z.hochzeit.von) { z.hochzeit.partner = g; z.re.push(g); } else if (nr >= 3) z.solo = z.hochzeit.von; }
  z.letzter = { stich: z.stich, gewinner: g, augen: aug }; z.stich = []; z.amZug = g;
  if (letzter) z.phase = "ende";
}
function dkErgebnis(z, namen = DK_NAMEN) {
  const reS = [0, 1, 2, 3].filter((s) => dkIstRe(z, s)), koS = [0, 1, 2, 3].filter((s) => !dkIstRe(z, s));
  const reAug = reS.reduce((a, s) => a + dkSumme(z.stiche[s]), 0), koAug = 240 - reAug;
  const reStiche = reS.reduce((a, s) => a + z.stiche[s].length, 0) / 4, koStiche = 12 - reStiche;
  const reGew = reAug >= 121, verlAug = reGew ? koAug : reAug, verlStiche = reGew ? koStiche : reStiche;
  const zeilen = [["Gewonnen", 1]];
  if (verlAug < 90) zeilen.push(["Keine 90", 1]); if (verlAug < 60) zeilen.push(["Keine 60", 1]); if (verlAug < 30) zeilen.push(["Keine 30", 1]);
  if (verlStiche === 0) zeilen.push(["Schwarz", 1]);
  if (!reGew && z.solo == null) zeilen.push(["Gegen die Alten", 1]);
  const name = { doppelkopf: "Doppelkopf", fuchs: "Fuchs gefangen", karlchen: "Karlchen" };
  for (const x of z.sonder) zeilen.push([`${name[x.art]} (${namen[x.s]})`, dkIstRe(z, x.s) === reGew ? 1 : -1]);
  const wert = zeilen.reduce((a, [, p]) => a + p, 0), punkte = [0, 0, 0, 0];
  for (const s of [0, 1, 2, 3]) { const gew = dkIstRe(z, s) === reGew; const faktor = z.solo === s ? 3 : 1; punkte[s] = (gew ? 1 : -1) * wert * faktor; }
  return { reS, koS, reAug, koAug, reGew, zeilen, wert, punkte };
}
// ----- Computer -----
function dkBekanntRe(z, s) { return new Set([...z.offen, ...(dkIstRe(z, s) ? [s] : []), ...(z.hochzeit ? z.re : [])]); } // Hochzeit ist angesagt – alle wissen es
function dkPartnerSicher(z, s, w) { // weiß Spieler s sicher, dass w zu seiner Partei gehört?
  if (w === s) return true; // stille Hochzeit: nur der Alleinspieler weiß es – für die anderen sieht es wie ein Normalspiel aus
  const re = dkBekanntRe(z, s);
  if (dkIstRe(z, s)) return re.has(w);
  return re.size >= 2 && !re.has(w); // Kontra weiß es, wenn beide Re bekannt sind
}
function dkComputerKarte(z, s, staerke) {
  const erl = dkErlaubt(z, s); if (staerke === "leicht" && Math.random() < 0.45) return erl[Math.floor(Math.random() * erl.length)];
  const nachRang = (l) => [...l].sort((a, b) => dkRang(a) - dkRang(b)), nachAugen = (l) => [...l].sort((a, b) => dkAugen(a) - dkAugen(b));
  const tr = erl.filter(dkIstTrumpf), fehl = erl.filter((k) => !dkIstTrumpf(k));
  if (!z.stich.length) { // ausspielen
    const asse = fehl.filter((k) => k.split("-")[1] === "A");
    if (asse.length) { const zahl = (k) => z.hand[s].filter((x) => dkFarbe(x) === dkFarbe(k)).length; return [...asse].sort((a, b) => zahl(a) - zahl(b))[0]; }
    if (dkIstRe(z, s) && tr.length >= 5) return nachRang(tr).reverse().find((k) => dkBasis(k) !== "he-10") || nachRang(tr).pop();
    if (fehl.length) return nachAugen(fehl)[0];
    return nachRang(tr).find((k) => dkBasis(k) !== "ka-A") || nachRang(tr)[0];
  }
  const jetzt = dkStichGewinner(z.stich), letzter = z.stich.length === 3, wert = dkSumme(z.stich.map((x) => x.k));
  const gewinnt = (k) => dkStichGewinner([...z.stich, { s, k }]) === s;
  if (dkPartnerSicher(z, s, jetzt) && (letzter || dkRang(z.stich.find((x) => x.s === jetzt).k) >= dkRang(`kr-D-1`))) {
    const schmier = erl.filter((k) => !["he-10", "kr-D", "pi-D", "he-D"].includes(dkBasis(k))); // Partner hat sicher: Augen dazugeben
    return [...(schmier.length ? schmier : erl)].sort((a, b) => dkAugen(b) - dkAugen(a))[0];
  }
  const sieger = erl.filter(gewinnt);
  if (sieger.length && (letzter || wert >= 10 || staerke === "schwer")) {
    const billig = nachRang(sieger).filter((k) => letzter || dkRang(k) >= dkRang("he-D-1") || !dkIstTrumpf(k));
    return (billig.length ? billig : nachRang(sieger))[0];
  }
  return nachAugen(erl.filter((k) => dkBasis(k) !== "ka-A")).concat(nachAugen(erl))[0];
}
export { dkNeu, dkVorbehalt, dkErlaubt, dkSpielen, dkStichAbschliessen, dkErgebnis, dkComputerKarte, dkIstRe };
