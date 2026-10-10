// KC-CLUB-FDK-MG: Spielregeln Fang den Koch – wörtliche Kopie aus app.js (erzeugt von tools/fdk/server-kopie.mjs, nicht von Hand ändern)
const FDK_KEY = "kc_club_fdk3", FDK_N = 24, FDK_MIN = 3, FDK_VORRAT = 2, FDK_HAND = 3; // Küchenminuten je Wurf, Kisten je Station, Karten auf der Hand
const FDK_LAGER = ["lager", "kuehl", "gemuese", "gewuerz"];
// Felder: s = Station, d = Durchreiche zum Pass, e = Ereignis, f = frei
const FDK_FELD = ["start", "e", "lager", "d", "kuehl", "e", "gemuese", "f", "gewuerz", "d", "e", "herd", "f", "e", "fritteuse", "d", "f", "ofen", "e", "f", "buero", "d", "e", "f"];
const FDK_ST = { start: ["🚪", "Start"], lager: ["🌾", "Lager"], kuehl: ["🧊", "Kühlhaus"], gemuese: ["🥕", "Gemüse"], gewuerz: ["🧂", "Gewürzregal"],
  herd: ["🔥", "Herd"], fritteuse: ["🍟", "Fritteuse"], ofen: ["♨️", "Ofen"], buero: ["📋", "Büro"], d: ["🛎️", "Durchreiche"], e: ["❗", "Ereignis"], f: ["", ""] };
const FDK_STUFEN = { leicht: { name: "Leicht", grund: 10 }, mittel: { name: "Mittel", grund: 15 }, schwer: { name: "Schwer", grund: 20 } };
// Gericht: [Zeichen, Name, Stufe, Zutaten [Station, Zeichen, Name], Arbeitsschritte [Station, Text, Züge]]
// Je Stufe gleich viele Zutaten und gleich viele Arbeitszüge – so bekommen beide Köche gleich viel zu tun.
const FDK_GERICHTE = {
  pfannkuchen: ["🥞", "Pfannkuchen", "leicht", [["lager", "🌾", "Mehl"], ["kuehl", "🥚", "Eier"], ["kuehl", "🥛", "Milch"]], [["herd", "in der Pfanne backen", 1]]],
  ruehrei: ["🍳", "Rührei mit Brot", "leicht", [["kuehl", "🥚", "Eier"], ["gemuese", "🌱", "Schnittlauch"], ["lager", "🍞", "Brot"]], [["herd", "Rührei braten", 1]]],
  currywurst: ["🌭", "Currywurst mit Pommes", "leicht", [["kuehl", "🌭", "Bratwurst"], ["gemuese", "🥔", "Kartoffeln"], ["gewuerz", "🍛", "Currypulver"]], [["fritteuse", "Pommes frittieren", 1]]],
  kaiserschmarrn: ["🥮", "Kaiserschmarrn", "leicht", [["lager", "🌾", "Mehl"], ["kuehl", "🥚", "Eier"], ["gewuerz", "🍚", "Puderzucker"]], [["herd", "in der Pfanne zupfen", 1]]],
  bratkartoffeln: ["🥔", "Bratkartoffeln mit Spiegelei", "leicht", [["gemuese", "🥔", "Kartoffeln"], ["kuehl", "🥚", "Eier"], ["gewuerz", "🧂", "Salz & Pfeffer"]], [["herd", "goldbraun braten", 1]]],
  gulasch: ["🍲", "Rindergulasch", "mittel", [["kuehl", "🥩", "Rindfleisch"], ["gemuese", "🧅", "Zwiebeln"], ["gemuese", "🫑", "Paprika"], ["gewuerz", "🌶️", "Paprikapulver"]], [["herd", "schmoren", 2]]],
  bolognese: ["🍝", "Spaghetti Bolognese", "mittel", [["kuehl", "🥩", "Hackfleisch"], ["gemuese", "🍅", "Tomaten"], ["lager", "🍝", "Spaghetti"], ["gewuerz", "🌿", "Oregano"]], [["herd", "Soße köcheln", 2]]],
  schnitzel: ["🥩", "Schnitzel mit Pommes", "mittel", [["kuehl", "🥩", "Schweineschnitzel"], ["lager", "🍞", "Paniermehl"], ["kuehl", "🥚", "Eier"], ["gemuese", "🥔", "Kartoffeln"]], [["herd", "Schnitzel braten", 1], ["fritteuse", "Pommes frittieren", 1]]],
  fishchips: ["🐟", "Fish & Chips", "mittel", [["kuehl", "🐟", "Kabeljau"], ["lager", "🌾", "Mehl"], ["gemuese", "🥔", "Kartoffeln"], ["gewuerz", "🧂", "Meersalz"]], [["fritteuse", "Fisch und Pommes frittieren", 2]]],
  curry: ["🍛", "Hähnchen-Curry mit Reis", "mittel", [["kuehl", "🍗", "Hähnchen"], ["lager", "🍚", "Reis"], ["gemuese", "🫑", "Paprika"], ["gewuerz", "🍛", "Curry"]], [["herd", "Curry köcheln", 2]]],
  roulade: ["🥩", "Rinderroulade", "schwer", [["kuehl", "🥩", "Rindfleisch"], ["kuehl", "🥓", "Speck"], ["gemuese", "🥒", "Gewürzgurken"], ["gewuerz", "🟡", "Senf"], ["lager", "🍷", "Rotwein"]], [["herd", "scharf anbraten", 1], ["ofen", "schmoren", 2]]],
  sauerbraten: ["🍖", "Sauerbraten", "schwer", [["kuehl", "🥩", "Rinderbraten"], ["lager", "🍶", "Essig"], ["gemuese", "🧅", "Zwiebeln"], ["gewuerz", "🍃", "Lorbeer"], ["lager", "🍇", "Rosinen"]], [["herd", "anbraten", 1], ["ofen", "schmoren", 2]]],
  schweinebraten: ["🍖", "Schweinebraten mit Klößen", "schwer", [["kuehl", "🥩", "Schweinebraten"], ["lager", "🍺", "Bier"], ["gemuese", "🧅", "Zwiebeln"], ["gewuerz", "🌱", "Kümmel"], ["lager", "⚪", "Kloßteig"]], [["ofen", "braten", 2], ["herd", "Klöße ziehen lassen", 1]]],
  ente: ["🦆", "Ente mit Rotkohl", "schwer", [["kuehl", "🦆", "Ente"], ["gemuese", "🟣", "Rotkohl"], ["gemuese", "🍎", "Äpfel"], ["gewuerz", "🌿", "Beifuß"], ["lager", "⚪", "Klöße"]], [["ofen", "knusprig braten", 2], ["herd", "Rotkohl schmoren", 1]]],
  kohlrouladen: ["🥬", "Kohlrouladen", "schwer", [["kuehl", "🥩", "Hackfleisch"], ["gemuese", "🥬", "Weißkohl"], ["gemuese", "🧅", "Zwiebeln"], ["gewuerz", "🌱", "Kümmel"], ["lager", "🍞", "Brötchen"]], [["herd", "anbraten", 1], ["ofen", "schmoren", 2]]],
};
// Ereigniskarten – Pech immer mit einer klaren Aufgabe, Glück hilft weiter
const FDK_KARTEN = [
  ["fallen", 2], ["braun", 1], ["warm", 1], ["gas", 2], ["schaum", 1], ["hygiene", 2],
  ["turbo", 2], ["abkuerzung", 2], ["klau", 2], ["gaszu", 1], ["liefer", 2], ["mise", 1], ["schutz", 1], ["lob", 1],
];
const FDK_PECH = new Set(["fallen", "braun", "warm", "gas", "schaum"]);
const FDK_AKTION = new Set(["turbo", "abkuerzung", "klau", "gaszu", "liefer", "mise", "schutz"]); // kommen auf die Hand
const FDK_AKTION_NAME = { turbo: ["⚡", "Turbo", "Mit zwei Würfeln würfeln"], abkuerzung: ["🚪", "Abkürzung", "Direkt zur nächsten Station, die du brauchst (statt würfeln)"],
  klau: ["🤏", "Zutat klauen", "Eine Zutat vom anderen Tablett – die du brauchst, sonst fällt sie herunter"], gaszu: ["🔧", "Gas abdrehen", "Beim anderen geht der Herd aus, bis er im Büro war"],
  liefer: ["🚚", "Lieferant", "Eine fehlende Zutat kommt direkt aufs Tablett"], mise: ["🔪", "Mise en place", "Dein nächster Arbeitsschritt ist sofort fertig"],
  schutz: ["🛡️", "Sous-Chef", "Schützt dich von selbst vor dem nächsten Pech"] };
const fdkAbstand = (a, b) => { const d = Math.abs(a - b) % FDK_N; return Math.min(d, FDK_N - d); };
const fdkFelderVon = (art) => FDK_FELD.map((f, i) => (f === art ? i : -1)).filter((i) => i >= 0);
const FDK_DURCH = fdkFelderVon("d");
const fdkStPos = (st) => FDK_FELD.indexOf(st);
// kürzester Weg vom Feld p über alle Stationen (Zutaten in beliebiger Folge, dann Arbeitsschritte der Reihe nach) bis zu einer Durchreiche
function fdkWeglaenge(p, zutStationen, schrittStationen) {
  const st = [...new Set(zutStationen)].map(fdkStPos); let best = Infinity;
  const perm = (rest, pos, sum) => {
    if (sum >= best) return;
    if (!rest.length) { let q = pos, s = sum; for (const x of schrittStationen) { s += fdkAbstand(q, fdkStPos(x)); q = fdkStPos(x); } s += Math.min(...FDK_DURCH.map((d) => fdkAbstand(q, d))); best = Math.min(best, s); return; }
    rest.forEach((x, i) => perm(rest.filter((_, j) => j !== i), x, sum + fdkAbstand(pos, x)));
  };
  perm(st, p, 0); return best;
}
const fdkGerichtWeg = (g, p = 0) => { const G = FDK_GERICHTE[g]; return fdkWeglaenge(p, G[3].map((z) => z[0]), G[4].map((x) => x[0])); };
// Richtzeit in Würfen: Weg / 3 Felder je Wurf, je Halt ein halber Wurf, Schmoren dauert, plus etwas Luft
function fdkRichtWuerfe(g) {
  const G = FDK_GERICHTE[g], halte = new Set(G[3].map((z) => z[0])).size + G[4].length + 1;
  return Math.round(fdkGerichtWeg(g) / 3 + halte * 0.6 + G[4].reduce((a, x) => a + x[2] - 1, 0) + 4);
}
// zwei gleich schwere Gerichte mit ähnlich langem Weg (höchstens 2 Felder Unterschied), möglichst nicht schon gehabt
function fdkGerichtPaar(stufe, zufall, schonDa = []) {
  const ids = Object.keys(FDK_GERICHTE).filter((g) => FDK_GERICHTE[g][2] === stufe);
  const paare = [];
  for (const a of ids) for (const b of ids) if (a !== b && Math.abs(fdkGerichtWeg(a) - fdkGerichtWeg(b)) <= 2) paare.push([a, b]);
  const frisch = paare.filter(([a, b]) => !schonDa.includes(a) && !schonDa.includes(b)), l = frisch.length ? frisch : paare;
  return l[Math.floor(zufall() * l.length) % l.length];
}
function fdkNeuerBon(g) { const G = FDK_GERICHTE[g]; return { g, hat: G[3].map(() => false), schritt: G[4].map(() => false), uhr: 0, pech: false }; }
function fdkNeu({ stufe = "leicht", anzahl = 2, zufall = Math.random } = {}) {
  const plan = [[], []];
  for (let i = 0; i < anzahl; i++) { const [a, b] = fdkGerichtPaar(stufe, zufall, [...plan[0], ...plan[1]]); const tausch = zufall() < 0.5; plan[0].push(tausch ? b : a); plan[1].push(tausch ? a : b); }
  const stapel = []; for (const [k, n] of FDK_KARTEN) for (let i = 0; i < n; i++) stapel.push(k);
  for (let i = stapel.length - 1; i > 0; i--) { const j = Math.floor(zufall() * (i + 1)) % (i + 1); [stapel[i], stapel[j]] = [stapel[j], stapel[i]]; }
  const sp = () => ({ pos: 0, punkte: 0, nr: 0, bon: null, fertig: false, aussetzen: 0, wartet: 0, gasLeer: false, mise: false, wuerfe: 0, ergebnisse: [], hand: [], gespielt: false, turbo: false });
  const F = { stufe, anzahl, plan, sp: [sp(), sp()], dran: 0, phase: "wuerfeln", wurf: 0, stapel, ablage: [], log: [], zug: 0, erster: [], vorrat: Object.fromEntries(FDK_LAGER.map((l) => [l, FDK_VORRAT])) };
  F.sp[0].bon = fdkNeuerBon(plan[0][0]); F.sp[1].bon = fdkNeuerBon(plan[1][0]);
  const start = ["turbo", "abkuerzung", "liefer", "klau"][Math.floor(zufall() * 4) % 4]; F.sp[0].hand.push(start); F.sp[1].hand.push(start); // Startkarte – beide dieselbe (fair)
  return F;
}
const fdkG = (S) => FDK_GERICHTE[S.bon.g];
const fdkAlleZutaten = (S) => S.bon.hat.every(Boolean);
const fdkFertigGekocht = (S) => S.bon.schritt.every(Boolean);
const fdkFehlendeZutaten = (S) => fdkG(S)[3].filter((_, i) => !S.bon.hat[i]);
const fdkNaechsterSchritt = (S) => { const i = S.bon.schritt.indexOf(false); return i < 0 ? null : { i, st: fdkG(S)[4][i][0], text: fdkG(S)[4][i][1], zuege: fdkG(S)[4][i][2] }; };
// Was kann der Koch an Feld p gerade tun? (für „hier anhalten“ und die grünen Felder). F für den Vorrat (ohne F: unbegrenzt)
const fdkBrauchtVon = (S, l) => fdkG(S)[3].some((z, i) => z[0] === l && !S.bon.hat[i]);
const fdkLeerGebraucht = (F, S) => !!F && FDK_LAGER.some((l) => F.vorrat[l] <= 0 && fdkBrauchtVon(S, l));
function fdkNutzen(S, p, F) {
  if (S.fertig) return null;
  const f = FDK_FELD[p];
  if (FDK_LAGER.includes(f) && fdkBrauchtVon(S, f)) return F && F.vorrat[f] <= 0 ? null : "holen";
  const n = fdkNaechsterSchritt(S);
  if (n && n.st === f && fdkAlleZutaten(S)) return S.gasLeer && f === "herd" ? null : "kochen";
  if (f === "buero" && (S.gasLeer || fdkLeerGebraucht(F, S))) return "bestellen";
  if (f === "d") return "pass";
  return null;
}
// Zielfelder nach einem Wurf w: in beide Richtungen das Endfeld und jede nützliche Station unterwegs (dort anhalten)
function fdkOptionen(F, s, w) {
  const S = F.sp[s], m = new Map();
  for (const r of [1, -1]) {
    const weg = [];
    for (let i = 1; i <= w; i++) {
      const p = (S.pos + r * i + FDK_N * 10) % FDK_N; weg.push(p);
      const nutzen = fdkNutzen(S, p, F), ende = i === w;
      if (!ende && !(nutzen && nutzen !== "pass") && !(nutzen === "pass" && fdkAlleZutaten(S) && fdkFertigGekocht(S))) continue;
      const alt = m.get(p); if (!alt || alt.weg.length > weg.length) m.set(p, { feld: p, weg: [...weg], richtung: r, halt: !ende, nutzen });
    }
  }
  return [...m.values()];
}
const fdkKarteZiehen = (F) => { if (!F.stapel.length) { F.stapel = F.ablage.reverse(); F.ablage = []; } const k = F.stapel.pop(); F.ablage.push(k); return k; };
// eine Zutat fallen lassen (bevorzugt von einer bestimmten Station) – gibt die Zutat zurück oder null
function fdkVerliert(S, station, zufall) {
  const idx = S.bon.hat.map((h, i) => (h ? i : -1)).filter((i) => i >= 0 && !fdkFertigGekocht(S) && (!station || fdkG(S)[3][i][0] === station));
  if (!idx.length || S.bon.schritt.some(Boolean)) return null; // schon gekocht: nichts mehr zu verlieren
  const i = idx[Math.floor(zufall() * idx.length) % idx.length]; S.bon.hat[i] = false; return fdkG(S)[3][i];
}
// 🛡️ Sous-Chef auf der Hand fängt das nächste Pech ab
const fdkGeschuetzt = (S) => { const i = S.hand.indexOf("schutz"); if (i < 0) return false; S.hand.splice(i, 1); return true; };
// Ankunft auf Feld p: Station erledigen. Gibt Ereignisse zurück.
function fdkAnkunft(F, s, abgeben, zufall) {
  const S = F.sp[s], O = F.sp[1 - s], p = S.pos, ev = [], nutzen = fdkNutzen(S, p, F);
  if (nutzen === "holen") { fdkG(S)[3].forEach((z, i) => { if (z[0] === FDK_FELD[p] && !S.bon.hat[i]) { S.bon.hat[i] = true; ev.push({ art: "holt", z }); } });
    F.vorrat[FDK_FELD[p]]--; if (F.vorrat[FDK_FELD[p]] <= 0) ev.push({ art: "leer", l: FDK_FELD[p] }); }
  else if (nutzen === "kochen") { const n = fdkNaechsterSchritt(S), z = Math.max(1, n.zuege - (S.mise ? 1 : 0)); S.mise = false;
    if (z <= 1) { S.bon.schritt[n.i] = true; ev.push({ art: "kocht", text: n.text, st: n.st }); } else { S.wartet = z - 1; S.kochtGerade = n.i; ev.push({ art: "kochtLang", text: n.text, st: n.st, zuege: z }); } }
  else if (nutzen === "bestellen") { if (S.gasLeer) { S.gasLeer = false; ev.push({ art: "gas" }); }
    const leer = FDK_LAGER.filter((l) => F.vorrat[l] < FDK_VORRAT); if (leer.length) { for (const l of leer) F.vorrat[l] = FDK_VORRAT; ev.push({ art: "nachbestellt", l: leer }); } }
  else if (nutzen === "pass" && (abgeben || (fdkAlleZutaten(S) && fdkFertigGekocht(S)))) ev.push(fdkAbgeben(F, s));
  // Zusammenstoß: genau auf dem anderen Koch gelandet – nur im Gang (freie und ❗-Felder); an Stationen arbeiten beide friedlich nebeneinander
  if (!S.fertig && !O.fertig && O.pos === p && (FDK_FELD[p] === "f" || FDK_FELD[p] === "e")) {
    if (O.bon.hat.some(Boolean) && !O.bon.schritt.some(Boolean) && fdkGeschuetzt(O)) ev.push({ art: "geschuetzt", wer: 1 - s });
    else { const z = fdkVerliert(O, null, zufall); ev.push({ art: "stoss", z }); if (z) O.bon.pech = true; } }
  if (FDK_FELD[p] === "e" && !S.fertig) ev.push(...fdkKarte(F, s, zufall));
  return ev;
}
function fdkKarte(F, s, zufall) {
  const S = F.sp[s], k = fdkKarteZiehen(F), ev = [{ art: "karte", k }];
  if (FDK_AKTION.has(k)) { S.hand.push(k); if (S.hand.length > FDK_HAND) ev[0].weg = S.hand.shift(); ev[0].hand = true; return ev; }
  if (FDK_PECH.has(k) && fdkGeschuetzt(S)) { ev[0].geschuetzt = true; return ev; }
  if (k === "fallen") { const z = fdkVerliert(S, null, zufall); ev[0].z = z; if (z) S.bon.pech = true; }
  else if (k === "braun") { const z = fdkVerliert(S, "gemuese", zufall); ev[0].z = z; if (z) S.bon.pech = true; }
  else if (k === "warm") { const z = fdkVerliert(S, "kuehl", zufall); ev[0].z = z; if (z) S.bon.pech = true; }
  else if (k === "gas") { const brauch = fdkG(S)[4].some((x, i) => x[0] === "herd" && !S.bon.schritt[i]); if (brauch) { S.gasLeer = true; S.bon.pech = true; } ev[0].trifft = brauch; }
  else if (k === "schaum") { S.aussetzen++; S.bon.pech = true; }
  else if (k === "hygiene") F.phase = "frage"; // Bildschirm stellt die Frage, dann fdkHygiene(F, s, richtig)
  else if (k === "lob") { S.punkte += 2; }
  return ev;
}
// 🃏 Aktionskarte ausspielen (vor dem Würfeln, eine je Zug). Gibt { ev, zugVorbei } zurück – Abkürzung ersetzt das Würfeln.
function fdkKannSpielen(F, s, k) {
  const S = F.sp[s], O = F.sp[1 - s];
  if (F.dran !== s || F.phase !== "wuerfeln" || S.fertig || S.gespielt || !S.hand.includes(k)) return false;
  if (k === "schutz") return false; // wirkt von selbst
  if (k === "liefer") return S.bon.hat.includes(false);
  if (k === "klau") return !O.fertig && O.bon.hat.some(Boolean) && !O.bon.schritt.some(Boolean);
  if (k === "gaszu") return !O.fertig && !O.gasLeer && fdkG(O)[4].some((x, i) => x[0] === "herd" && !O.bon.schritt[i]);
  if (k === "abkuerzung") return fdkNaechstesZiel(S, F) != null;
  if (k === "mise") return !S.mise && S.bon.schritt.includes(false);
  return k === "turbo" && !S.turbo;
}
function fdkKarteSpielen(F, s, k, zufall = Math.random) {
  if (!fdkKannSpielen(F, s, k)) return null;
  const S = F.sp[s], O = F.sp[1 - s], ev = [{ art: "spielt", k }]; let zugVorbei = false;
  S.hand.splice(S.hand.indexOf(k), 1); S.gespielt = true;
  if (k === "turbo") S.turbo = true;
  else if (k === "mise") S.mise = true;
  else if (k === "liefer") { const i = S.bon.hat.indexOf(false); S.bon.hat[i] = true; ev[0].z = fdkG(S)[3][i]; }
  else if (k === "gaszu") { if (fdkGeschuetzt(O)) ev[0].geschuetzt = true; else { O.gasLeer = true; O.bon.pech = true; } }
  else if (k === "klau") {
    if (fdkGeschuetzt(O)) ev[0].geschuetzt = true;
    else { const idx = O.bon.hat.map((h, i) => (h ? i : -1)).filter((i) => i >= 0), brauch = idx.filter((i) => fdkG(S)[3].some((z, j) => z[2] === fdkG(O)[3][i][2] && !S.bon.hat[j]));
      const i = (brauch.length ? brauch : idx)[Math.floor(zufall() * (brauch.length || idx.length)) % (brauch.length || idx.length)], z = fdkG(O)[3][i];
      O.bon.hat[i] = false; O.bon.pech = true; ev[0].z = z;
      const j = fdkG(S)[3].findIndex((y, n) => y[2] === z[2] && !S.bon.hat[n]); if (j >= 0) { S.bon.hat[j] = true; ev[0].behalten = true; } } }
  else if (k === "abkuerzung") { fdkWurfBeginn(F, s); const ziel = fdkNaechstesZiel(S, F); S.pos = ziel; F.zug++; ev[0].feld = ziel; ev.push(...fdkAnkunftOhneKarte(F, s, zufall)); zugVorbei = true; }
  for (const e of ev) F.log.push({ s, e });
  return { ev, zugVorbei };
}
function fdkAnkunftOhneKarte(F, s, zufall) { const p = F.sp[s].pos, alt = FDK_FELD[p]; return alt === "e" ? [] : fdkAnkunft(F, s, false, zufall); }
function fdkHygiene(F, s, richtig) { const S = F.sp[s]; if (!richtig) { S.aussetzen++; S.bon.pech = true; } F.phase = "wuerfeln"; return { art: "hygiene", richtig }; }
// nächstes sinnvolles Feld für den Koch (kürzester Weg)
function fdkNaechstesZiel(S, F) {
  if (S.fertig) return null;
  const ziele = [];
  for (let p = 0; p < FDK_N; p++) { const n = fdkNutzen(S, p, F); if (n && (n !== "pass" || (fdkAlleZutaten(S) && fdkFertigGekocht(S)))) ziele.push(p); }
  if (!ziele.length) return null;
  return ziele.sort((a, b) => fdkAbstand(S.pos, a) - fdkAbstand(S.pos, b))[0];
}
// Abgeben am Pass + Klingel: Punkte für dieses Gericht
function fdkAbgeben(F, s) {
  const S = F.sp[s], G = fdkG(S), stufe = FDK_STUFEN[G[2]], nr = S.nr;
  const fehlZ = S.bon.hat.filter((h) => !h).length, fehlS = S.bon.schritt.filter((x) => !x).length, voll = !fehlZ && !fehlS;
  const richt = fdkRichtWuerfe(S.bon.g), tempo = voll ? Math.max(0, Math.min(10, richt - S.bon.uhr)) : 0;
  const erster = !F.erster[nr] ? (F.erster[nr] = s + 1, voll ? 3 : 0) : 0, sauber = voll && !S.bon.pech ? 2 : 0;
  const punkte = Math.max(0, stufe.grund + tempo + erster + sauber - 3 * fehlZ - 5 * fehlS);
  const e = { art: "abgabe", g: S.bon.g, nr, punkte, teile: { grund: stufe.grund, tempo, erster, sauber, fehlZ, fehlS }, minuten: S.bon.uhr * FDK_MIN, richtMin: richt * FDK_MIN };
  S.punkte += punkte; S.ergebnisse.push(e);
  S.nr++; if (S.nr >= F.anzahl) S.fertig = true; else S.bon = fdkNeuerBon(F.plan[s][S.nr]);
  return e;
}
// Ein Zug: Wurf w ist gefallen, Koch s geht zu option. abgeben = auch unvollständig abgeben (nur nach Rückfrage).
function fdkZiehen(F, s, option, { abgeben = false, zufall = Math.random } = {}) {
  const S = F.sp[s]; S.pos = option.feld; F.zug++;
  const ev = fdkAnkunft(F, s, abgeben, zufall);
  for (const e of ev) F.log.push({ s, e });
  return ev;
}
// Uhr läuft bei jedem eigenen Wurf (auch Aussetzen / Schmoren kosten Zeit)
function fdkWurfBeginn(F, s) { const S = F.sp[s]; S.wuerfe++; if (!S.fertig) S.bon.uhr++; }
// Augen eines Wurfs: mit ⚡ Turbo zwei Würfel
function fdkAugen(F, s, zufall = Math.random) { const S = F.sp[s], w = () => 1 + Math.floor(zufall() * 6) % 6; if (S.turbo) { S.turbo = false; const a = w(), b = w(); return { w: a + b, a, b }; } const a = w(); return { w: a, a }; }
// Wer ist als Nächstes dran? Aussetzen und Schmoren werden dabei automatisch abgearbeitet (mit Ereignis für die Anzeige).
function fdkWeiter(F) {
  const ev = [], S0 = F.sp[F.dran];
  if (S0.nochmal) { S0.nochmal = false; S0.gespielt = false; F.phase = "wuerfeln"; return [{ s: F.dran, e: { art: "nochmal" } }]; }
  for (let k = 0; k < 8; k++) {
    if (F.sp.every((S) => S.fertig)) { F.phase = "ende"; return ev; }
    F.dran = 1 - F.dran; const S = F.sp[F.dran];
    if (S.fertig) continue;
    if (S.wartet > 0) { fdkWurfBeginn(F, F.dran); S.wartet--; const e = { art: "wartet", rest: S.wartet };
      if (!S.wartet && S.kochtGerade != null) { S.bon.schritt[S.kochtGerade] = true; e.fertig = fdkG(S)[4][S.kochtGerade][1]; S.kochtGerade = null; }
      ev.push({ s: F.dran, e }); continue; }
    if (S.aussetzen > 0) { fdkWurfBeginn(F, F.dran); S.aussetzen--; ev.push({ s: F.dran, e: { art: "aussetzen" } }); continue; }
    S.gespielt = false; F.phase = "wuerfeln"; return ev;
  }
  F.phase = F.sp.every((S) => S.fertig) ? "ende" : "wuerfeln"; return ev;
}
// Twinkey wählt sein Zielfeld: Fortschritt zuerst, sonst so nah wie möglich ans nächste Ziel; Zusammenstoß mitnehmen
function fdkKiWahl(F, s, opts, zufall = Math.random) {
  const S = F.sp[s], O = F.sp[1 - s];
  const wert = (o) => { const n = o.nutzen; let w = 0;
    if (n === "pass" && fdkAlleZutaten(S) && fdkFertigGekocht(S)) w += 100; else if (n === "holen") w += 60; else if (n === "kochen") w += 70; else if (n === "bestellen") w += 65;
    const alt = S.pos; S.pos = o.feld; const z = fdkNaechstesZiel(S, F); w -= z == null ? 0 : fdkAbstand(o.feld, z) * 3; S.pos = alt;
    if (O.pos === o.feld && !O.fertig && O.bon.hat.some(Boolean) && (FDK_FELD[o.feld] === "f" || FDK_FELD[o.feld] === "e")) w += 8;
    if (FDK_FELD[o.feld] === "e") w -= 1;
    return w + zufall() * 0.5; };
  return [...opts].sort((a, b) => wert(b) - wert(a))[0];
}
// Twinkey spielt eine Karte aus, wenn sie gerade richtig nützt (oder null)
function fdkKiKarte(F, s) {
  const S = F.sp[s], O = F.sp[1 - s], ziel = fdkNaechstesZiel(S, F), weit = ziel == null ? 0 : fdkAbstand(S.pos, ziel);
  const gut = { liefer: true, klau: O.bon.hat.filter(Boolean).length >= 2 || fdkG(O)[3].some((z, i) => O.bon.hat[i] && fdkG(S)[3].some((y, j) => y[2] === z[2] && !S.bon.hat[j])),
    gaszu: fdkAlleZutaten(O) || O.bon.hat.filter(Boolean).length >= O.bon.hat.length - 1, abkuerzung: weit >= 6, turbo: weit >= 7, mise: fdkAlleZutaten(S) };
  return ["liefer", "abkuerzung", "gaszu", "klau", "mise", "turbo"].find((k) => gut[k] && fdkKannSpielen(F, s, k)) || null;
}
function fdkSieger(F) { const [a, b] = F.sp.map((S) => S.punkte); return a > b ? 0 : b > a ? 1 : -1; }
export { FDK_FELD, FDK_AKTION, fdkNeu, fdkOptionen, fdkZiehen, fdkWurfBeginn, fdkAugen, fdkWeiter, fdkKannSpielen, fdkKarteSpielen, fdkHygiene, fdkAbgeben, fdkSieger, fdkKiWahl, fdkKiKarte };
