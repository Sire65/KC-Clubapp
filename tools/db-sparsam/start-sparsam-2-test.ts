// KC-CLUB-START-SPARSAM-2 (Server 2.494.0): Test des echten Server-Codes (Auszüge aus supabase/functions/kc-club/index.ts) gegen eine
// nachgebaute Datenbank: Namen aus der Mitgliederliste = alte Einzelabfrage, Merker für Club-Einstellungen / Wartung / Communicator,
// Speichern leert sofort, laufende Lesung während des Speicherns wird nicht gemerkt, Fehler werden nie gemerkt.
// Start: deno run -A tools/db-sparsam/start-sparsam-2-test.ts
const src = await Deno.readTextFile(new URL("../../supabase/functions/kc-club/index.ts", import.meta.url));
const stueck = (von: string, bis: string) => { const a = src.indexOf(von), b = src.indexOf(bis, a); if (a < 0 || b < 0) throw new Error("Auszug fehlt: " + von); return src.slice(a, b); };
const code = [
  stueck("const MERK_MS =", "const dbWeg ="),
  'type Person = { person_id: string; display_name: string; given_name?: string; preferred_name?: string; email?: string };',
  stueck("// KC-CLUB-START-SPARSAM-2: Namen aktiver", "// KC-CLUB-START-PARALLEL-3 (2.162.0): laufen"),
  stueck("let MG_LAUF:", "async function protokoll("),
  stueck("const KONFIG_WARTE =", "async function sosFuerAlle"),
  stueck("let WARTUNG_MERK:", "// zufällige, kaum"),
  stueck("let COMM_MERK:", "async function communicatorStatus"),
].join("\n");
const kopf = `export const T: any = { db: null }; const db: any = new Proxy({}, { get: (_o, k) => T.db[k] });
const ORG = "ORG"; const APP_ID = "KC_CLUBAPP"; const COMM_FEHLER = ["failed"]; const FREIGABE = { bis: 1 }; let LIVE_KURZ: any = 1;\n`;
const datei = await Deno.makeTempFile({ suffix: ".ts" });
await Deno.writeTextFile(datei, kopf + code + `
export { personen, aktiveMitglieder, konfigZeile, wartungLesen, commLesen, merkerVergessen, treffenGemerkt, MERK_MS };
export const zustand = () => ({ MG_NAMEN, KONFIG_MERK, WARTUNG_MERK, COMM_MERK });
export const commVergessen = () => { COMM_MERK = null; };`);
const M: any = await import("file://" + datei);
const ok = (b: boolean, t: string) => { if (!b) { console.error("FEHLER:", t); Deno.exit(1); } console.log("ok:", t); };
const zuf = (n: number) => Math.floor(Math.random() * n);

// ---- nachgebaute Datenbank (nur was die Auszüge brauchen) ----
let PEOPLE: any[] = [], KONFIG: any[] = [], REG: any = null, FEHLER = false, abfragen: string[] = [], VERZOEGERUNG = 0;
function abfrage(tab: string) {
  const f: any = { tab, eq: [] as any[], in: null as any, not: null as any, single: false, spalten: null as string[] | null };
  const b: any = {
    select: (c?: string) => (f.spalten = c && c !== "*" ? c.split(",") : null, b), order: () => b, limit: () => b, gte: () => b,
    eq: (k: string, v: any) => (f.eq.push([k, v]), b), in: (k: string, v: any[]) => (f.in = [k, v], b), not: (k: string, _o: string, v: string) => (f.not = [k, v], b),
    maybeSingle: () => (f.single = true, b),
    then: (ok2: any, err: any) => new Promise((r) => setTimeout(r, VERZOEGERUNG)).then(() => {
      abfragen.push(tab);
      if (FEHLER) return { data: null, error: { message: "test" } };
      let rows: any[] = tab === "kc_core_people" ? PEOPLE : tab === "kc_club_konfig" ? KONFIG : tab === "kc_core_app_registry" ? (REG ? [REG] : []) : [{ enabled: true, id: tab }];
      rows = rows.filter((x) => f.eq.every(([k, v]: any) => x[k] === undefined || x[k] === v));
      if (f.in) rows = rows.filter((x) => f.in[1].includes(x[f.in[0]]));
      if (f.not) rows = rows.filter((x) => !String(x[f.not[0]]).startsWith(f.not[1].replace("%", "")));
      rows = rows.map((x) => structuredClone(f.spalten ? Object.fromEntries(f.spalten.filter((k: string) => k in x).map((k: string) => [k, x[k]])) : x)); // wie PostgREST: nur die gewählten Spalten
      return { data: f.single ? rows[0] ?? null : rows, error: null };
    }).then(ok2, err),
  };
  return b;
}
M.T.db = { from: (t: string) => abfrage(t) };
// alte Einzelabfrage (wörtlich wie bis 2.493.0)
const personenAlt = async (ids: string[]) => {
  const u = [...new Set(ids.filter(Boolean))]; if (!u.length) return new Map();
  const { data } = await (M.T.db.from("kc_core_people").select("person_id,display_name,given_name,preferred_name,email").in("person_id", u) as any);
  return new Map((data ?? []).map((p: any) => [p.person_id, { person_id: p.person_id, display_name: p.display_name, given_name: p.given_name ?? null, preferred_name: p.preferred_name ?? null, email: p.email ?? null }]));
};
const gleich = (a: Map<string, any>, b: Map<string, any>) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

// 1. Namen: 300 Zufallswelten (aktive, ausgeschiedene, Test-Personen, andere Organisation, fehlende Felder)
let n = 0;
for (let lauf = 0; lauf < 300; lauf++) {
  PEOPLE = Array.from({ length: 1 + zuf(25) }, (_, i) => ({ person_id: (Math.random() < 0.1 ? "KC-P-TEST" : "KC-P-") + i, org_id: Math.random() < 0.9 ? "ORG" : "X", active: Math.random() < 0.8,
    display_name: "N" + i, given_name: Math.random() < 0.7 ? "G" + i : null, preferred_name: Math.random() < 0.3 ? "P" + i : null, email: Math.random() < 0.5 ? `e${i}@x.de` : null, family_name: "F", birth_date: "1960-01-01" }));
  await M.aktiveMitglieder(); // frische Mitgliederliste dieser Welt (füllt auch den Namens-Merker)
  const ids = Array.from({ length: zuf(12) }, () => "KC-P-" + (Math.random() < 0.1 ? "TEST" : "") + zuf(30)).concat(Math.random() < 0.2 ? [""] : []);
  const [alt, neu] = [await personenAlt(ids), await M.personen(ids)];
  if (!gleich(alt, neu)) { console.error(JSON.stringify([...alt]), JSON.stringify([...neu])); ok(false, `Lauf ${lauf}: Namen gleich`); }
  for (const p of neu.values()) if ("birth_date" in p || "family_name" in p) ok(false, "kein Geburtsdatum/Nachname in personen()");
  n++;
}
ok(n === 300, "300 Zufallswelten: Namen aus der Mitgliederliste = alte Einzelabfrage (gleiche Felder, nie Geburtsdatum)");
// Abfragen sparen: alle aktiv → keine kc_core_people-Abfrage mehr
PEOPLE = [{ person_id: "A", org_id: "ORG", active: true, display_name: "Anna" }, { person_id: "B", org_id: "ORG", active: false, display_name: "Bernd" }];
await M.aktiveMitglieder(); abfragen = [];
for (let i = 0; i < 5; i++) await M.personen(["A"]);
ok(abfragen.length === 0, "5× Name eines aktiven Mitglieds: 0 Abfragen (vorher 5)");
await M.personen(["A", "B"]); ok(abfragen.length === 1, "ausgeschiedenes Mitglied: eine Abfrage nur für den Rest");
const k1 = await M.personen(["A"]); k1.get("A").display_name = "verändert"; ok((await M.personen(["A"])).get("A").display_name === "Anna", "jeder Aufruf bekommt eine eigene Kopie");

// 2. Club-Einstellungen
KONFIG = [{ schluessel: "sos", wert: { alle: true }, geaendert_am: "t1" }, { schluessel: "pinnwand", wert: { erinnernTage: 4 }, geaendert_am: "t2" }];
abfragen = [];
const [s1, p1, x1] = await Promise.all([M.konfigZeile("sos"), M.konfigZeile("pinnwand"), M.konfigZeile("gibtsnicht")]);
ok(abfragen.length === 1 && s1.data.wert.alle === true && p1.data.wert.erinnernTage === 4 && x1.data === null, "gleichzeitige Lesungen: eine Abfrage (wie vorher)");
await M.konfigZeile("sos"); await M.konfigZeile("gibtsnicht"); ok(abfragen.length === 1, "danach aus dem Merker (auch „gibt es nicht“)");
s1.data.wert.alle = false; ok((await M.konfigZeile("sos")).data.wert.alle === true, "Merker liefert Kopien (Änderung am Ergebnis schadet nicht)");
KONFIG[0].wert = { alle: false }; M.merkerVergessen("https://x/rest/v1/kc_club_konfig?on_conflict=schluessel");
ok((await M.konfigZeile("sos")).data.wert.alle === false && abfragen.length === 2, "Speichern leert den Merker → neuer Wert sofort");
// Lesung läuft, während gespeichert wird → alter Wert darf nicht gemerkt bleiben
M.merkerVergessen("/rest/v1/kc_club_konfig"); VERZOEGERUNG = 30; const laeuft = M.konfigZeile("sos");
await new Promise((r) => setTimeout(r, 5)); KONFIG[0].wert = { alle: true }; M.merkerVergessen("/rest/v1/kc_club_konfig"); await laeuft; VERZOEGERUNG = 0;
ok((await M.konfigZeile("sos")).data.wert.alle === true, "während des Speicherns gelesener alter Wert wird nicht gemerkt");
M.merkerVergessen("/rest/v1/kc_club_konfig"); FEHLER = true; const fe = await M.konfigZeile("sos"); FEHLER = false;
ok(fe.error && (await M.konfigZeile("sos")).data?.wert?.alle === true, "Fehler wird nicht gemerkt");
M.zustand().KONFIG_MERK.set("sos", { t: Date.now() - M.MERK_MS - 1, z: { wert: { alle: "alt" }, geaendert_am: null } });
ok((await M.konfigZeile("sos")).data.wert.alle === true, "nach MERK_MS wird neu gelesen");

// 3. Wartung
REG = { app_id: "KC_CLUBAPP", wartung: false, wartung_hinweis: null, wartung_seit: null }; abfragen = [];
const w1 = await M.wartungLesen(); await M.wartungLesen(); ok(!w1.an && abfragen.length === 1, "Wartung: einmal gelesen, dann gemerkt");
REG.wartung = true; REG.wartung_hinweis = "Umbau"; M.merkerVergessen("/rest/v1/kc_core_app_registry?app_id=eq.KC_CLUBAPP");
const w2 = await M.wartungLesen(); ok(w2.an && w2.hinweis === "Umbau", "Wartung einschalten: sofort sichtbar (Merker geleert)");
M.merkerVergessen("/rest/v1/kc_core_app_registry"); FEHLER = true; await M.wartungLesen(); FEHLER = false; abfragen = [];
await M.wartungLesen(); ok(abfragen.length === 1, "Wartung: Fehler wird nicht gemerkt");

// 4. Communicator
abfragen = []; await M.commLesen(false); await M.commLesen(false); ok(abfragen.length === 5, "Communicator: 5 Lesungen einmal, dann gemerkt");
await M.commLesen(true); ok(abfragen.length === 10, "Admin-Ansicht liest immer frisch");
M.commVergessen();
FEHLER = true; abfragen = []; await M.commLesen(false); FEHLER = false; await M.commLesen(false); ok(abfragen.length === 10, "Communicator: Fehler wird nicht gemerkt");
// 5. Clubtermine (2.495.0): nur Termin-Zeilen gemerkt, Kopien, Speichern leert, Fehler nie gemerkt
let lesungen = 0, TR = [{ id: "t1", titel: "Treffen" }], TRFEHLER = false;
const lese = () => Promise.resolve().then(() => (lesungen++, TRFEHLER ? { data: null, error: { message: "x" } } : { data: structuredClone(TR), error: null }));
const a1 = await M.treffenGemerkt("naechstes", lese), a2 = await M.treffenGemerkt("naechstes", lese);
ok(lesungen === 1 && a2.data[0].titel === "Treffen", "Termine: einmal gelesen, dann gemerkt");
a1.data[0].titel = "x"; ok((await M.treffenGemerkt("naechstes", lese)).data[0].titel === "Treffen", "Termine: Kopien");
TR = [{ id: "t1", titel: "Neu" }]; M.merkerVergessen("/rest/v1/kc_club_treffen?id=eq.t1");
ok((await M.treffenGemerkt("naechstes", lese)).data[0].titel === "Neu" && lesungen === 2, "Termin speichern leert den Merker");
M.merkerVergessen("/rest/v1/kc_club_treffen"); TRFEHLER = true; await M.treffenGemerkt("kommend", lese); TRFEHLER = false;
const vorher = lesungen; await M.treffenGemerkt("kommend", lese); ok(lesungen === vorher + 1, "Termine: Fehler wird nicht gemerkt");
console.log("ALLE TESTS GRÜN"); Deno.exit(0);
