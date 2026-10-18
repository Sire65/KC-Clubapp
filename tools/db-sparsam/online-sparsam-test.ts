// KC-CLUB-ONLINE-SPARSAM (2.485.0): Gleichwertigkeit alt ↔ neu mit dem echten Server-Code (Auszüge aus supabase/functions/kc-club/index.ts)
// und einer kleinen nachgebauten Datenschnittstelle (eq/in/gte/lt/not like/is/or(and(...))/order/limit wie PostgREST). Zufallsdaten, 300 Durchläufe.
// Start: deno run -A tools/db-sparsam/online-sparsam-test.ts
const src = await Deno.readTextFile(new URL("../../supabase/functions/kc-club/index.ts", import.meta.url));
const stueck = (start: string, ende: string) => { const a = src.indexOf(start); if (a < 0) throw new Error("fehlt: " + start); return src.slice(a, src.indexOf(ende, a)); };
const ok = (b: boolean, t: string) => { if (!b) { console.error("FEHLER:", t); Deno.exit(1); } console.log("ok:", t); };

// ---------- nachgebaute Datenschnittstelle ----------
let DATEN: Record<string, any[]> = {}; let ZAEHL = 0;
const vergleich = (v: any, op: string, w: string) => {
  const W = w.replace(/^"|"$/g, "");
  if (op === "eq") return String(v) === W && !(W === "true" || W === "false") || (W === "true" ? v === true : W === "false" ? v === false : String(v) === W);
  if (op === "gte") return v != null && String(v) >= W; if (op === "lt") return v != null && String(v) < W; if (op === "is") return W === "null" ? v == null : v === (W === "true");
  throw new Error("op " + op);
};
function orTeile(x: string): string[] { const t: string[] = []; let d = 0, a = 0; for (let i = 0; i < x.length; i++) { if (x[i] === "(") d++; else if (x[i] === ")") d--; else if (x[i] === "," && d === 0) { t.push(x.slice(a, i)); a = i + 1; } } t.push(x.slice(a)); return t; }
function orPasst(r: any, ausdruck: string): boolean {
  return orTeile(ausdruck).some((teil) => {
    if (teil.startsWith("and(")) return orTeile(teil.slice(4, -1)).every((u) => orPasst(r, u));
    const [feld, op, ...rest] = teil.split("."); return vergleich(r[feld], op, rest.join("."));
  });
}
function q(tabelle: string) {
  const f: ((r: any) => boolean)[] = []; let ord: [string, boolean] | null = null, lim = Infinity, einzel = false, spalten: string[] | null = null;
  const b: any = {
    select: (x = "*") => ((spalten = x === "*" ? null : x.split(",")), b), eq: (k: string, v: any) => (f.push((r) => r[k] === v), b), in: (k: string, v: any[]) => (f.push((r) => v.includes(r[k])), b),
    gte: (k: string, v: string) => (f.push((r) => r[k] != null && r[k] >= v), b), lt: (k: string, v: string) => (f.push((r) => r[k] != null && r[k] < v), b),
    is: (k: string, v: any) => (f.push((r) => (v === null ? r[k] == null : r[k] === v)), b),
    not: (k: string, op: string, v: string) => { if (op === "like") f.push((r) => !String(r[k]).startsWith(v.replace(/%$/, ""))); else if (op === "is") f.push((r) => r[k] != null); return b; },
    or: (x: string) => (f.push((r) => orPasst(r, x)), b), order: (k: string, o?: any) => ((ord = [k, o?.ascending !== false]), b), limit: (n: number) => ((lim = n), b),
    maybeSingle: () => ((einzel = true), b),
    upsert: (zeile: any) => { ZAEHL++; const t = (DATEN[tabelle] ||= []); const i = t.findIndex((r) => r.person_id === zeile.person_id && r.schluessel === zeile.schluessel); if (i >= 0) t[i] = zeile; else t.push(zeile); return Promise.resolve({ data: null, error: null }); },
    then: (fertig: any, fehl: any) => {
      ZAEHL++; let rows = (DATEN[tabelle] || []).filter((r) => f.every((g) => g(r)));
      if (ord) { const [k, auf] = ord; rows = [...rows].sort((a, c) => (String(a[k]) < String(c[k]) ? -1 : String(a[k]) > String(c[k]) ? 1 : 0) * (auf ? 1 : -1)); }
      rows = rows.slice(0, lim).map((r) => (spalten ? Object.fromEntries(spalten.map((k) => [k, r[k] ?? null])) : structuredClone(r)));
      return Promise.resolve({ data: einzel ? rows[0] ?? null : rows, error: null }).then(fertig, fehl);
    },
  };
  return b;
}
const db = { from: q };

// ---------- echter Code ----------
const code = [
  "const db: any = (globalThis as any).__db;",
  "const ONLINE_SEK = 150, ANKLOPFEN_SEK = 180;",
  stueck("async function onlineZeigenMap(", "// KC-CLUB-INKOGNITO"), stueck("async function inkognitoSet(", "// KC-CLUB-STUMM"),
  stueck("async function anklopfenErlaubtMap(", "// KC-CLUB-ANKLOPFEN-ANTWORT"),
  stueck("async function onlineJetzt(", "// ---------- KC-CLUB-ANRUF (0.31.0"),
  "export { onlineJetzt, onlineJetztMit, onlineAnklopfenTeilen, onlineAnrufeTeilen, onlineZeigenMap, anklopfenErlaubtMap };",
].join("\n");
(globalThis as any).__db = db;
const datei = await Deno.makeTempFile({ suffix: ".ts" }); await Deno.writeTextFile(datei, code);
const F: any = await import("file://" + datei);

// ---------- Zufallsdaten ----------
const zuf = (n: number) => Math.floor(Math.random() * n), jetzt = Date.now(), iso = (msZurueck: number) => new Date(jetzt - msZurueck).toISOString();
const leute = Array.from({ length: 9 }, (_, i) => (i === 8 ? "KC-P-TEST1" : "KC-P-" + i));
function welt() {
  const zugang = leute.map((p) => ({ person_id: p, aktiv: Math.random() < 0.9, zuletzt_gesehen: iso(zuf(300) * 1000) }));
  const einst: any[] = [];
  for (const p of leute) {
    if (Math.random() < 0.3) einst.push({ person_id: p, schluessel: "online", wert: { zeigen: Math.random() < 0.5 } });
    if (Math.random() < 0.2) einst.push({ person_id: p, schluessel: "inkognito", wert: { an: Math.random() < 0.7 } });
    if (Math.random() < 0.3) einst.push({ person_id: p, schluessel: "anklopfen", wert: { erlaubt: Math.random() < 0.5 } });
    if (Math.random() < 0.7) einst.push({ person_id: p, schluessel: "online_seit", wert: { seit: iso(zuf(900) * 1000), zuletzt: iso(zuf(60) * 1000) } });
  }
  const rollen = leute.filter(() => Math.random() < 0.3).map((p) => ({ person_id: p, ist_admin: true }));
  const klopf = Array.from({ length: zuf(12) }, (_, i) => ({ id: "k" + i, von: leute[zuf(4)], an: leute[zuf(4)], status: ["offen", "beantwortet", "abgelaufen"][zuf(3)], thread_id: null, beantwortet_am: null, antwort: null, erstellt_am: iso(zuf(900) * 1000) }));
  const anrufe = Array.from({ length: zuf(15) }, (_, i) => ({ id: "a" + i, von: leute[zuf(4)], an: leute[zuf(3)], art: "ton", automatisch: Math.random() < 0.2, status: ["klingelt", "verpasst", "angenommen", "abgelehnt"][zuf(4)],
    angenommen_am: Math.random() < 0.3 ? iso(1000) : null, verpasst_gesehen_am: Math.random() < 0.2 ? iso(1000) : null, erstellt_am: iso(zuf(2 * 86400) * 1000) }));
  return { kc_club_zugang: zugang, kc_club_person_einstellung: einst, kc_club_rollen: rollen, kc_club_anklopfen: klopf, kc_club_anruf: anrufe };
}
const ich = "KC-P-1", ANRUF_KLINGEL_SEK = 45;
let gleichOn = 0, gleichKlopf = 0, gleichRufe = 0, weniger = 0;
for (let lauf = 0; lauf < 300; lauf++) {
  DATEN = welt();
  // alt: onlineJetzt + anklopfenErlaubtMap + online_seit (je eigene Abfrage)
  ZAEHL = 0; const onAlt: Set<string> = await F.onlineJetzt(); onAlt.delete(ich);
  const klopfbarAlt = await F.anklopfenErlaubtMap([...onAlt]);
  const { data: os } = onAlt.size ? await db.from("kc_club_person_einstellung").select("person_id,wert").eq("schluessel", "online_seit").in("person_id", [...onAlt]) : { data: [] };
  const seitAlt = new Map((os ?? []).map((x: any) => [x.person_id, x.wert?.seit]));
  const zAlt = ZAEHL;
  ZAEHL = 0; const { on: onNeu, einst } = await F.onlineJetztMit(["anklopfen", "online_seit"]); onNeu.delete(ich);
  const zNeu = ZAEHL; if (zNeu <= zAlt) weniger++;
  const klopfbarNeu = new Map([...onNeu].map((id: string) => [id, einst.get("anklopfen")?.get(id)?.erlaubt !== false]));
  const gleich = JSON.stringify([...onAlt].sort()) === JSON.stringify([...onNeu].sort())
    && [...onAlt].every((id) => (klopfbarAlt.get(id) !== false) === klopfbarNeu.get(id))
    && [...onAlt].every((id) => (seitAlt.get(id) ?? null) === (einst.get("online_seit")?.get(id)?.seit ?? null));
  if (!gleich) { console.error({ onAlt: [...onAlt], onNeu: [...onNeu] }); ok(false, `Lauf ${lauf}: Online-Liste / Anklopfbar / seit gleich`); } gleichOn++;
  // Anklopfen: alt = zwei Abfragen
  const seit = new Date(jetzt - 180 * 1000).toISOString(), seit10 = new Date(jetzt - 600000).toISOString();
  const { data: anMichAlt } = await db.from("kc_club_anklopfen").select("id,von,erstellt_am").eq("an", ich).eq("status", "offen").gte("erstellt_am", seit).order("erstellt_am", { ascending: false }).limit(3);
  const { data: vonMirAlt } = await db.from("kc_club_anklopfen").select("id,an,status,thread_id,beantwortet_am,antwort").eq("von", ich).gte("erstellt_am", seit10);
  const { data: klopf } = await db.from("kc_club_anklopfen").select("*").or(`and(an.eq.${ich},status.eq.offen,erstellt_am.gte."${seit}"),and(von.eq.${ich},erstellt_am.gte."${seit10}")`).order("erstellt_am", { ascending: false }).limit(60);
  const k = F.onlineAnklopfenTeilen(klopf, ich, seit, seit10);
  const norm = (l: any[], felder: string[]) => JSON.stringify(l.map((x) => felder.map((f) => x[f] ?? null)).sort());
  if (JSON.stringify(k.anMich.map((x: any) => x.id)) !== JSON.stringify((anMichAlt as any[]).map((x) => x.id)) || norm(k.vonMir, ["id", "an", "status"]) !== norm(vonMirAlt as any[], ["id", "an", "status"])) ok(false, `Lauf ${lauf}: Anklopfen gleich`);
  gleichKlopf++;
  // Anrufe: alt = zwei Abfragen
  const klingelEnde = new Date(jetzt - ANRUF_KLINGEL_SEK * 1000).toISOString();
  const { data: rufeAlt } = await db.from("kc_club_anruf").select("id,von,art,erstellt_am").eq("an", ich).eq("status", "klingelt").eq("automatisch", false).gte("erstellt_am", klingelEnde).order("erstellt_am", { ascending: false }).limit(1);
  const { data: verpAlt } = await db.from("kc_club_anruf").select("id,von,art,erstellt_am").eq("an", ich).eq("automatisch", false).is("angenommen_am", null).is("verpasst_gesehen_am", null)
    .gte("erstellt_am", new Date(jetzt - 86400000).toISOString()).or(`status.eq.verpasst,and(status.eq.klingelt,erstellt_am.lt."${klingelEnde}")`).order("erstellt_am", { ascending: false }).limit(5);
  const { data: alle } = await db.from("kc_club_anruf").select("*").eq("an", ich).eq("automatisch", false).gte("erstellt_am", new Date(jetzt - 86400000).toISOString()).order("erstellt_am", { ascending: false }).limit(60);
  const r = F.onlineAnrufeTeilen(alle, klingelEnde);
  if (JSON.stringify(r.rufe) !== JSON.stringify(rufeAlt) || JSON.stringify(r.verp) !== JSON.stringify(verpAlt)) { console.error({ r, rufeAlt, verpAlt }); ok(false, `Lauf ${lauf}: Anrufe gleich`); }
  gleichRufe++;
}
ok(gleichOn === 300, "Online-Liste, Anklopfbar, „seit“: 300/300 gleich (inkl. verborgen, Inkognito-Admin, Testpersonen, inaktiv)");
ok(gleichKlopf === 300, "Anklopfen an mich / von mir: 300/300 gleich");
ok(gleichRufe === 300, "klingelt gerade / verpasst: 300/300 gleich (inkl. automatische Verbindungen)");
ok(weniger === 300, "nie mehr Abfragen als vorher");
console.log("ALLE TESTS GRÜN"); Deno.exit(0);
