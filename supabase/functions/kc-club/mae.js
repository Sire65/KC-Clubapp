// KC-CLUB-MAE: Spielregeln Mensch ärgere dich nicht – wörtliche Kopie aus app.js (erzeugt von tools/mae/server-kopie.mjs, nicht von Hand ändern)
const MAE_FARBEN = ["rot", "blau", "gruen", "gelb"], MAE_FNAME = ["Rot", "Blau", "Grün", "Gelb"];
// Figur-Stand: -1 = im Haus, 0–39 = Schritte ab dem eigenen Startfeld, 40–43 = Zielfelder
const maeFeld = (f, p) => (f * 10 + p) % 40; // Rundenfeld (0–39) einer Figur der Farbe f
function maeNeu(sitze, regel = "erster") { // sitze in Zugreihenfolge: [{ f: 0–3, wer: "ich" | "pc" | person_id }]
  return { sitze: sitze.map((s) => ({ f: s.f, wer: s.wer, fig: [-1, -1, -1, -1] })), dran: 0, wurf: null, versuche: 0, phase: "wuerfeln", sieger: null, platz: [], regel, n: 0, log: [] };
}
function maeBesetzt(z, feld) { // wer steht auf Rundenfeld feld? { s: Sitz, i: Figur } oder null
  for (let s = 0; s < z.sitze.length; s++) { const S = z.sitze[s]; for (let i = 0; i < 4; i++) { const p = S.fig[i]; if (p >= 0 && p < 40 && maeFeld(S.f, p) === feld) return { s, i }; } }
  return null;
}
function maeZiel(z, s, i, w) { // neuer Stand von Figur i (Sitz s) mit Wurf w – oder null, wenn der Zug nicht geht
  const S = z.sitze[s], p = S.fig[i];
  if (p < 0) { if (w !== 6) return null; const b = maeBesetzt(z, maeFeld(S.f, 0)); return b && b.s === s ? null : 0; }
  const q = p + w; if (q > 43) return null;
  if (q >= 40) { for (let k = Math.max(40, p + 1); k <= q; k++) if (S.fig.includes(k)) return null; return q; } // im Ziel nicht überspringen
  const b = maeBesetzt(z, maeFeld(S.f, q)); return b && b.s === s ? null : q;
}
function maeMoeglich(z, s = z.dran, w = z.wurf) { // Figuren, die jetzt ziehen dürfen (Pflichtregeln beachtet)
  if (!w || z.phase === "ende") return [];
  const S = z.sitze[s], alle = [0, 1, 2, 3].filter((i) => maeZiel(z, s, i, w) !== null), imHaus = S.fig.some((p) => p < 0);
  if (w === 6 && imHaus) { const raus = alle.filter((i) => S.fig[i] < 0); if (raus.length) return [raus[0]]; } // 6 → raus ist Pflicht (Haus-Figuren sind gleich)
  const aufStart = S.fig.indexOf(0);
  if (imHaus && aufStart >= 0 && alle.includes(aufStart)) return [aufStart]; // Startfeld räumen ist Pflicht
  return alle;
}
function maeFest(z, s) { // keine Figur auf der Runde, Zielfiguren ganz hinten aufgerückt → 3 Versuche für eine 6
  const f = z.sitze[s].fig; if (f.some((p) => p >= 0 && p < 40)) return false;
  return f.filter((p) => p >= 40).sort((a, b) => b - a).every((p, k) => p === 43 - k);
}
function maeLog(z, e) { z.log.push({ n: ++z.n, ...e }); if (z.log.length > 40) z.log.splice(0, z.log.length - 40); }
function maeWeiter(z, nochmal) { // nächster Wurf: derselbe Sitz (nach einer 6) oder der nächste, der noch spielt
  z.wurf = null; z.phase = "wuerfeln"; z.versuche = 0;
  if (nochmal) return;
  for (let k = 1; k <= z.sitze.length; k++) { const s = (z.dran + k) % z.sitze.length; if (!z.platz.includes(s)) { z.dran = s; return; } }
}
function maeWuerfeln(z, w) { // w = 1–6 (den Zufall liefert der Aufrufer); Ergebnis: erlaubte Figuren ([] = kein Zug)
  if (z.phase !== "wuerfeln" || !(w >= 1 && w <= 6)) return null;
  z.wurf = w; maeLog(z, { t: "wurf", s: z.dran, w });
  const m = maeMoeglich(z);
  if (m.length) { z.phase = "ziehen"; return m; }
  if (maeFest(z, z.dran) && w !== 6 && z.versuche < 2) { const v = z.versuche + 1; z.wurf = null; z.versuche = v; maeLog(z, { t: "nochmal", s: z.dran, v }); return []; }
  maeLog(z, { t: "aus", s: z.dran, w }); maeWeiter(z, w === 6); return [];
}
function maeZiehen(z, i) { // Figur i des Sitzes am Zug ziehen; Ergebnis: Zug-Ereignis oder null (nicht erlaubt)
  if (z.phase !== "ziehen") return null;
  const s = z.dran, S = z.sitze[s], m = maeMoeglich(z);
  if (S.fig[i] < 0 && !m.includes(i)) { const h = m.find((k) => S.fig[k] < 0); if (h !== undefined) i = h; } // Haus: jede Figur gilt
  if (!m.includes(i)) return null;
  const von = S.fig[i], w = z.wurf, nach = maeZiel(z, s, i, w);
  let opfer = null;
  if (nach < 40) { const b = maeBesetzt(z, maeFeld(S.f, nach)); if (b && b.s !== s) { opfer = { s: b.s, i: b.i, p: z.sitze[b.s].fig[b.i] }; z.sitze[b.s].fig[b.i] = -1; } }
  S.fig[i] = nach; maeLog(z, { t: "zug", s, i, von, nach, w, opfer });
  const e = z.log[z.log.length - 1];
  if (S.fig.every((p) => p >= 40)) {
    z.platz.push(s); maeLog(z, { t: "fertig", s, platz: z.platz.length });
    if (z.regel !== "mensch" || S.wer !== "pc") { z.phase = "ende"; z.sieger = s; z.wurf = null; return e; }
    if (z.sitze.every((x, k) => z.platz.includes(k) || x.wer === "pc")) { z.phase = "ende"; z.wurf = null; return e; }
    maeWeiter(z, false); return e;
  }
  maeWeiter(z, w === 6); return e;
}
function maeComputerWahl(z, staerke = "mittel", zufall = Math.random) { // welche Figur zieht der Computer?
  const s = z.dran, m = maeMoeglich(z); if (m.length <= 1) return m[0];
  if (staerke === "leicht" && zufall() < 0.5) return m[Math.floor(zufall() * m.length)];
  const S = z.sitze[s], w = z.wurf, hart = staerke === "schwer";
  const gefahr = (feld) => { // fremde Figuren, die dieses Feld mit einem Wurf erreichen (auch frisch aus dem Haus aufs Startfeld)
    let n = 0;
    for (let t = 0; t < z.sitze.length; t++) { if (t === s) continue; const T = z.sitze[t];
      for (const p of T.fig) if (p >= 0 && p < 40) { const d = (feld - maeFeld(T.f, p) + 40) % 40; if (d >= 1 && d <= 6 && p + d < 40) n++; }
      if (hart && T.fig.some((p) => p < 0) && maeFeld(T.f, 0) === feld) n++; }
    return n; };
  let best = m[0], bw = -1e9;
  for (const i of m) {
    const von = S.fig[i], nach = maeZiel(z, s, i, w); let v = 0;
    if (von < 0) v += 60;
    if (nach >= 40) v += 50 + nach;
    else {
      const b = maeBesetzt(z, maeFeld(S.f, nach)); if (b && b.s !== s) v += 80 + z.sitze[b.s].fig[b.i] / 2; // schlagen – weit gekommene Figuren zuerst
      v -= gefahr(maeFeld(S.f, nach)) * (hart ? 25 : 15);
      if (von >= 0) v += gefahr(maeFeld(S.f, von)) * (hart ? 20 : 10); // aus der Gefahr ziehen
      v += nach * 0.5;
    }
    if (von === 0 && S.fig.some((p) => p < 0)) v += 30;
    v += zufall() * (hart ? 2 : 8);
    if (v > bw) { bw = v; best = i; }
  }
  return best;
}
export { MAE_FARBEN, maeNeu, maeMoeglich, maeWuerfeln, maeZiehen, maeComputerWahl, maeZiel };
