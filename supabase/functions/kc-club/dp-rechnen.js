// 2.665.0 KC-CLUB-DP-NEU-RECHNEN (Wunsch Hansi „neuer Wunschplan → Dienstplan-Druck mit einem Tipp neu rechnen“):
// Dieselbe Rechnung wie das Planungswerkzeug (KICC tools/dienstplan-entwurf/solve.py + druck.py), hier ohne Abhängigkeiten,
// damit der Club-Server den Entwurf selbst neu rechnen kann. Nur ein Vorschlag – schreibt nichts in DP2.
// Eingabe: { tage: [{ d, art, baender: [{ start, end, total, front, back }] }], personen: [{ key, name, eintraege: [{ d, t, z, a, b }] }],
//   leer: [{ key, name, label }], bereitschaft: [{ d, name, von, bis }], max, fair, von, bis }
// t: "pref" | "avai" | "if_n" | "unav" · z: "V" | "H" | "B" · Ausgabe: das Format von dp-druck.json (kc_club_person_einstellung „dp_druck“).
const H = 0.5;
const r1 = (x) => Math.round(x * 10) / 10;
export function slots(a, b) { const out = []; for (let x = a; x < b - 1e-9; x += H) out.push(r1(x)); return out; }
const LV = { pref: 3, avai: 2, if_n: 1 };
const ART = { pref: 3, avai: 2, if_n: 1, unav: 9 };
const W = { 3: 1.0, 2: 0.85, 1: 0.35 };
const vgl = (a, b) => (a < b ? -1 : a > b ? 1 : 0); // wie Pythons sorted() für Zeichenketten
// 2.676.0 KC-CLUB-DP-WUNSCHDECKEL (Wunsch Hansi „nicht länger einplanen, als jemand bei Wunschzeit eingetragen hat – Verlagerungen oder Kürzungen sind ok“):
// Wer an einem Tag eine Wunschzeit hat, bekommt höchstens so viele Stunden, wie die Wunschzeit lang ist (wunschDeckel), und mindestens die Hälfte
// (wunschAnteil) des Dienstes liegt in der Wunschzeit – den Rest darf die Kann-Zeit füllen. Ohne Wunschzeit gilt wie bisher die Kann-Zeit.
// DP_REGEL steigt, wenn sich die Rechnung ändert – der Server rechnet dann den gespeicherten Stand von selbst neu.
export const DP_REGEL = 2;

export function dpRechnen(e) {
  const MAXLEN = e.max ?? 8, FAIR = e.fair ?? 1.5, LO = e.von ?? 8, HI = e.bis ?? 23, DECKEL = e.wunschDeckel !== false, ANTEIL = Number.isFinite(e.wunschAnteil) ? e.wunschAnteil : 0.5;
  // Bedarf je Halbstunde: [gesamt, vorne, hinten] (vorne/hinten null an Aufbau/Nachbereitung)
  const dem = new Map();
  for (const t of e.tage) {
    const m = new Map();
    for (const b of t.baender || []) for (const s of slots(Number(b.start), Number(b.end))) m.set(s, [Number(b.total) || 0, b.front ?? null, b.back ?? null]);
    dem.set(t.d, m);
  }
  const kind = new Map(e.tage.map((t) => [t.d, t.art]));
  const full = new Map([...(e.personen || []), ...(e.leer || [])].map((p) => [p.key, p.name]));
  // Verfügbarkeit (Name, Tag) → Halbstunde → [Stufe, Zone]; Sperren entfernen
  const av = new Map(), un = new Map(), wun = new Map(), zone = new Map();
  const k2 = (n, d) => n + "\u0000" + d;
  for (const p of e.personen || []) for (const x of p.eintraege || []) {
    const k = k2(p.key, x.d);
    if (x.t !== "unav") { if (!zone.has(k)) zone.set(k, new Set()); zone.get(k).add(x.z); }
    if (!wun.has(k)) wun.set(k, new Map());
    const w = wun.get(k);
    for (const s of slots(Number(x.a), Number(x.b))) {
      if (x.t === "unav") { if (!un.has(k)) un.set(k, new Set()); un.get(k).add(s); }
      else {
        if (!av.has(k)) av.set(k, new Map());
        const [lv, zz] = av.get(k).get(s) ?? [0, null];
        const z = zz === null ? x.z : (x.z === "B" || zz === "B" || x.z !== zz ? "B" : x.z);
        av.get(k).set(s, [Math.max(lv, LV[x.t] || 0), z]);
      }
      const alt = w.get(s);
      if (alt === "unav") continue;
      if (x.t === "unav" || alt === undefined || ART[x.t] > ART[alt]) w.set(s, x.t);
    }
  }
  for (const [k, ss] of un) if (av.has(k)) for (const s of ss) av.get(k).delete(s);
  const people = [...new Set([...av.keys()].map((k) => k.split("\u0000")[0]))].sort(vgl);
  const hours = new Map(), plan = new Map(), gapsJe = new Map();
  for (const d of [...dem.keys()].sort(vgl)) {
    const need = dem.get(d), staff = new Map([...need.keys()].map((s) => [s, []])), used = new Set(), liste = [];
    const zoneOf = (x, s) => av.get(k2(x, d)).get(s)[1];
    const gain = (n, a, b) => {
      let sc = 0;
      for (const s of slots(a, b)) {
        if (!need.has(s)) { sc -= 1.0; continue; }
        const [lv, z] = av.get(k2(n, d)).get(s), w = W[lv], [t, f, bk] = need.get(s), st = staff.get(s);
        if (st.length < t) {
          let v = 1.0;
          if (f !== null) {
            const fr = st.filter((x) => zoneOf(x, s) === "V").length, bkk = st.filter((x) => zoneOf(x, s) === "H").length, fl = st.filter((x) => zoneOf(x, s) === "B").length;
            const fneed = Math.max(0, f - fr), bneed = Math.max(0, bk - bkk);
            if (z === "V" && fneed - fl <= 0 && bneed > 0) v = 0.5;
            if (z === "H" && bneed - fl <= 0 && fneed > 0) v = 0.5;
          }
          sc += v * w;
        } else sc -= 0.6;
      }
      return sc * H;
    };
    for (;;) {
      let best = null;
      for (const n of people) {
        const k = k2(n, d);
        if (used.has(n) || !av.has(k)) continue;
        const ss = [...av.get(k).keys()].sort((a, b) => a - b), blocks = [];
        let cur = [];
        for (const s of ss) { if (cur.length && Math.abs(s - cur[cur.length - 1] - H) > 1e-9) { blocks.push(cur); cur = []; } cur.push(s); }
        if (cur.length) blocks.push(cur);
        for (const blk of blocks) {
          const lo = blk[0], hi = blk[blk.length - 1] + H, wunsch = DECKEL ? [...av.get(k).values()].filter((x) => x[0] === 3).length * H : 0;
          const deckel = wunsch > 0 ? Math.min(MAXLEN, wunsch) : MAXLEN, minlen = Math.min(2.0, hi - lo, deckel);
          for (let a = lo; a < hi - 1e-9; a += H) for (let b = a + minlen; b <= Math.min(hi, a + deckel) + 1e-9; b += H) {
            if (wunsch > 0 && slots(a, b).filter((x) => av.get(k).get(x)?.[0] === 3).length * H < (b - a) * ANTEIL - 1e-9) continue; // zu wenig in der Wunschzeit
            const cov = gain(n, a, b), g = cov * Math.max(0.05, 1 - FAIR * (hours.get(n) || 0) / 100);
            if (cov > 0.05 && (best === null || g > best[0])) best = [g, n, a, b];
          }
        }
      }
      if (!best) break;
      const [, n, a, b] = best;
      used.add(n); hours.set(n, (hours.get(n) || 0) + b - a); liste.push([n, a, b]);
      for (const s of slots(a, b)) if (staff.has(s)) staff.get(s).push(n);
    }
    plan.set(d, liste);
    gapsJe.set(d, new Map([...need.keys()].map((s) => [s, [staff.get(s).length, Math.max(0, need.get(s)[0] - staff.get(s).length)]])));
  }
  // Ausgabe wie druck.py (Kurzform für die Club App)
  const ALL = slots(LO, HI), WK = { pref: "p", avai: "a", if_n: "i", unav: "u" };
  const leer = new Map((e.leer || []).map((x) => [x.key, x.label]));
  const zonetext = (n, d) => {
    if (leer.has(n)) return leer.get(n);
    const z = zone.get(k2(n, d));
    if (kind.get(d) !== "Markttag" || !z || !z.size) return "";
    return z.has("B") || z.size > 1 ? "vorne+hinten" : z.has("V") ? "vorne" : "hinten";
  };
  const tage = [...dem.keys()].sort(vgl).map((d) => {
    const need = dem.get(d), gm = gapsJe.get(d), dienst = new Map(plan.get(d).map(([n, a, b]) => [n, [a, b]]));
    const mitWunsch = new Set([...wun.keys()].filter((k) => k.split("\u0000")[1] === d).map((k) => k.split("\u0000")[0]));
    const leute = [...new Set([...mitWunsch, ...leer.keys()])].sort((x, y) => (leer.has(x) - leer.has(y)) || (!dienst.has(x) - !dienst.has(y))
      || ((dienst.get(x)?.[0] ?? 99) - (dienst.get(y)?.[0] ?? 99)) || vgl(x, y));
    return {
      d, art: kind.get(d),
      vorne: ALL.map((s) => (need.has(s) ? need.get(s)[1] : null)), hinten: ALL.map((s) => (need.has(s) ? need.get(s)[2] : null)),
      bedarf: ALL.map((s) => (need.has(s) ? need.get(s)[0] : 0)), besetzt: ALL.map((s) => (gm.has(s) ? gm.get(s)[0] : 0)), fehlt: ALL.map((s) => (gm.has(s) ? gm.get(s)[1] : 0)),
      leute: leute.map((n) => ({ n: full.get(n) || n, z: zonetext(n, d), w: ALL.map((s) => WK[wun.get(k2(n, d))?.get(s)] || "-").join(""), s: dienst.has(n) ? dienst.get(n) : null })),
      ber: (e.bereitschaft || []).filter((x) => x.d === d).map((x) => ({ n: x.name, s: [Number(x.von), Number(x.bis)] })),
    };
  });
  return { v: 1, regel: DP_REGEL, von: LO, bis: HI, tage, stunden: Object.fromEntries([...hours].map(([n, h]) => [full.get(n) || n, h])) };
}
