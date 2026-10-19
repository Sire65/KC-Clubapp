// KC-CLUB-KACHEL-EINS (Server 2.496.0): Gleichwertigkeit alt ↔ neu für die Kachel-Zahlen. Die echte Datenbank-Funktion aus der Migration läuft in
// einer Postgres-Datenbank im Speicher (PGlite, nichts geht an Supabase); die alte Rechnung ist die des Servers (kachelZahlen bis 2.495.0, Schritt
// für Schritt nachgebaut, wie PostgREST filtert: eq/neq lassen NULL weg). 400 Zufallswelten, auch NULL, leere Antworten, anzahl 0/negativ.
// Start: PGLITE=<Pfad zu node_modules/@electric-sql/pglite> node tools/db-sparsam/kachel-test.mjs
import fs from "node:fs"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PGlite } = require(process.env.PGLITE || "@electric-sql/pglite");
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const mig = fs.readFileSync(new URL("../../supabase/migrations/20261019_kc_club_kachel_zahlen.sql", import.meta.url), "utf8");
const src = fs.readFileSync(new URL("../../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
// Die alte Rechnung steht noch wörtlich im Server (Rückfall) – sonst passt dieser Nachbau nicht mehr
for (const x of ['.eq("status", "geplant").eq("art", "treffen").gte("beginn", jetztIso).limit(100)', 'const beantwortet = new Set(tn.filter((x) => x.antwort).map((x) => x.treffen_id));',
  '.eq("person_id", ich.person_id).is("antwort", null)', '.eq("status", "offen").gte("beginn", jetztIso).in("id", em.map((x) => x.anfrage_id))',
  '.gte("datum", heute).is("geschlossen_am", null).neq("von", ich.person_id).limit(100)',
  'const offen = au.filter((x) => (x.ziel !== "online" || gesehen.has(x.id)) && !ant.some((y) => y.aufruf_id === x.id && y.person_id === ich.person_id)',
  '&& !(x.anzahl && ant.filter((y) => y.aufruf_id === x.id && y.antwort === "komme").length >= x.anzahl)).length;',
  '.is("geloescht_am", null)\n      .gt("hochgeladen_am", seit(p.fotosSeit)!).neq("hochgeladen_von", ich.person_id)',
  '.eq("person_id", ich.person_id).eq("status", "published").gte("work_date", heute).gt("updated_at", seit(p.dienstSeit)!)']) ok(src.includes(x), "alte Rechnung im Server: " + x.slice(0, 70));

const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
create table kc_club_treffen (id uuid primary key, status text, art text, beginn timestamptz);
create table kc_club_teilnahme (treffen_id uuid, person_id text, antwort text);
create table kc_club_terminanfragen (id uuid primary key, status text, beginn timestamptz);
create table kc_club_terminanfrage_empfaenger (anfrage_id uuid, person_id text, antwort text);
create table kc_club_hilfe_aufrufe (id uuid primary key, von text, anzahl smallint, ziel text, datum date, geschlossen_am timestamptz);
create table kc_club_hilfe_antworten (aufruf_id uuid, person_id text, antwort text);
create table kc_club_hilfe_gesehen (aufruf_id uuid, person_id text);
create table kc_club_ausleihen (id serial, status text);
create table kc_club_fotos (id serial, geloescht_am timestamptz, hochgeladen_am timestamptz, hochgeladen_von text);
create table kc_dp_plan_published (id serial, org_id text, person_id text, status text, work_date date, updated_at timestamptz);`);
await db.exec(mig);
ok(true, "Migration läuft in Postgres 16 (inkl. revoke/grant)");

const zuf = (n) => Math.floor(Math.random() * n), w = (l) => l[zuf(l.length)], uuid = () => crypto.randomUUID();
const JETZT = Date.parse("2026-10-19T10:00:00Z"), HEUTE = "2026-10-19", ORG = "ORG";
const zeit = () => new Date(JETZT + (zuf(4000) - 2000) * 60000).toISOString();
const tag = () => new Date(Date.parse(HEUTE) + (zuf(9) - 4) * 86400000).toISOString().slice(0, 10);
const P = ["P1", "P2", "P3", null];
const tabellen = ["kc_club_treffen", "kc_club_teilnahme", "kc_club_terminanfragen", "kc_club_terminanfrage_empfaenger", "kc_club_hilfe_aufrufe", "kc_club_hilfe_antworten", "kc_club_hilfe_gesehen", "kc_club_ausleihen", "kc_club_fotos", "kc_dp_plan_published"];
async function rein(t, zeilen) { for (const z of zeilen) { const k = Object.keys(z); await db.query(`insert into ${t} (${k.join(",")}) values (${k.map((_, i) => "$" + (i + 1)).join(",")})`, k.map((x) => z[x])); } }
const ms = (s) => Date.parse(s);
let n = 0;
for (let lauf = 0; lauf < 400; lauf++) {
  for (const t of tabellen) await db.exec(`truncate ${t}`); // nur die Test-Datenbank im Speicher
  const W = {
    treffen: Array.from({ length: zuf(8) }, () => ({ id: uuid(), status: w(["geplant", "abgesagt", null]), art: w(["treffen", "veranstaltung", null]), beginn: zeit() })),
    anfragen: Array.from({ length: zuf(6) }, () => ({ id: uuid(), status: w(["offen", "beendet", null]), beginn: zeit() })),
    aufrufe: Array.from({ length: zuf(8) }, () => ({ id: uuid(), von: w(P), anzahl: w([null, 0, 1, 2, 3, -1]), ziel: w([null, "online", "alle", "gruppe"]), datum: tag(), geschlossen_am: Math.random() < 0.3 ? zeit() : null })),
  };
  W.teilnahme = W.treffen.flatMap((t) => P.filter(() => Math.random() < 0.4).map((p) => ({ treffen_id: t.id, person_id: p, antwort: w(["ja", "nein", "vielleicht", "", null]) })));
  W.empf = W.anfragen.flatMap((a) => P.filter(() => Math.random() < 0.5).map((p) => ({ anfrage_id: a.id, person_id: p, antwort: w([null, null, "ja", "nein"]) })));
  W.antworten = W.aufrufe.flatMap((a) => P.filter(() => Math.random() < 0.4).map((p) => ({ aufruf_id: a.id, person_id: p, antwort: w(["komme", "komme", "nein", null]) })));
  W.gesehen = W.aufrufe.flatMap((a) => P.filter((p) => p && Math.random() < 0.4).map((p) => ({ aufruf_id: a.id, person_id: p })));
  W.ausleihen = Array.from({ length: zuf(4) }, () => ({ status: w(["angefragt", "zurueck", null]) }));
  W.fotos = Array.from({ length: zuf(6) }, () => ({ geloescht_am: Math.random() < 0.2 ? zeit() : null, hochgeladen_am: zeit(), hochgeladen_von: w(P) }));
  W.dienste = Array.from({ length: zuf(6) }, () => ({ org_id: w([ORG, ORG, "X"]), person_id: w(P), status: w(["published", "draft"]), work_date: tag(), updated_at: zeit() }));
  await rein("kc_club_treffen", W.treffen); await rein("kc_club_teilnahme", W.teilnahme); await rein("kc_club_terminanfragen", W.anfragen); await rein("kc_club_terminanfrage_empfaenger", W.empf);
  await rein("kc_club_hilfe_aufrufe", W.aufrufe); await rein("kc_club_hilfe_antworten", W.antworten); await rein("kc_club_hilfe_gesehen", W.gesehen); await rein("kc_club_ausleihen", W.ausleihen);
  await rein("kc_club_fotos", W.fotos); await rein("kc_dp_plan_published", W.dienste);
  for (const ich of ["P1", "P2"]) for (const vorstand of [false, true]) {
    const fotosSeit = Math.random() < 0.3 ? null : zeit(), dienstSeit = Math.random() < 0.3 ? null : zeit();
    // ---- alt (wie kachelZahlen bis 2.495.0) ----
    const ids = W.treffen.filter((t) => t.status === "geplant" && t.art === "treffen" && ms(t.beginn) >= JETZT).map((t) => t.id);
    const tn = W.teilnahme.filter((x) => x.person_id === ich && ids.includes(x.treffen_id));
    const beantwortet = new Set(tn.filter((x) => x.antwort).map((x) => x.treffen_id));
    const em = W.empf.filter((x) => x.person_id === ich && x.antwort === null);
    const an = em.length ? W.anfragen.filter((a) => a.status === "offen" && ms(a.beginn) >= JETZT && em.some((e) => e.anfrage_id === a.id)) : [];
    const termine = ids.filter((id) => !beantwortet.has(id)).length + an.length;
    const au = W.aufrufe.filter((a) => a.datum >= HEUTE && a.geschlossen_am === null && a.von !== null && a.von !== ich), aids = au.map((x) => x.id);
    const ant = W.antworten.filter((x) => aids.includes(x.aufruf_id)), gesehen = new Set(W.gesehen.filter((x) => x.person_id === ich && aids.includes(x.aufruf_id)).map((x) => x.aufruf_id));
    const offen = au.filter((x) => (x.ziel !== "online" || gesehen.has(x.id)) && !ant.some((y) => y.aufruf_id === x.id && y.person_id === ich)
      && !(x.anzahl && ant.filter((y) => y.aufruf_id === x.id && y.antwort === "komme").length >= x.anzahl)).length;
    const helfen = offen + (vorstand ? W.ausleihen.filter((x) => x.status === "angefragt").length : 0);
    const fotos = fotosSeit ? W.fotos.filter((f) => f.geloescht_am === null && ms(f.hochgeladen_am) > ms(fotosSeit) && f.hochgeladen_von !== null && f.hochgeladen_von !== ich).length : 0;
    const dienste = dienstSeit ? W.dienste.filter((d) => d.org_id === ORG && d.person_id === ich && d.status === "published" && d.work_date >= HEUTE && ms(d.updated_at) > ms(dienstSeit)).length : 0;
    const alt = { termine, helfen, fotos, dienste };
    // ---- neu ----
    const r = await db.query("select public.kc_club_kachel_zahlen($1,$2,$3,$4,$5,$6,$7) as z", [ich, vorstand, new Date(JETZT).toISOString(), HEUTE, fotosSeit, dienstSeit, ORG]);
    const z = r.rows[0].z, neu = { termine: Number(z.termine), helfen: Number(z.helfen), fotos: Number(z.fotos), dienste: Number(z.dienste) };
    if (JSON.stringify(alt) !== JSON.stringify(neu)) ok(false, `Lauf ${lauf} (${ich}, vorstand ${vorstand}): alt ${JSON.stringify(alt)} ≠ neu ${JSON.stringify(neu)}`);
    n++;
  }
}
ok(n === 1600, "400 Zufallswelten × 4 Personen/Rollen: Termine, Helfen, Fotos, Dienste – alt = neu");
console.log("ALLE TESTS GRÜN"); process.exit(0);
