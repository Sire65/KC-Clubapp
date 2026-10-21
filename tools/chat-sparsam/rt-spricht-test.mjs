// KC-CLUB-SCHREIBT-HINWEIS (2.529.0): echte Migration in Postgres 16 im Speicher (PGlite). Sprachaufnahme → Signal „spricht“, Diktat → „diktiert“
// an die anderen sichtbaren Teilnehmer; normales Tippen → kein zusätzliches Signal; gestörtes Signal verhindert das Speichern nie.
// Start: PGLITE=<Pfad zu node_modules/@electric-sql/pglite> node tools/chat-sparsam/rt-spricht-test.mjs
import fs from "node:fs"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PGlite } = require(process.env.PGLITE || "@electric-sql/pglite");
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const mig = fs.readFileSync(new URL("../../supabase/migrations/20261020_kc_club_rt_spricht.sql", import.meta.url), "utf8");
const db = new PGlite();
await db.exec(`create role anon; create role authenticated;
create table kc_communication_thread_participants (thread_id uuid, person_id text, hidden_at timestamptz);
create table kc_club_tippen (thread_id uuid, person_id text, bis timestamptz, text text, art text not null default 'text', primary key (thread_id, person_id));
create table signale (an text[], art text, thread uuid); create table schalter (kaputt boolean); insert into schalter values (false);
create function public.kc_club_rt_klingeln(p_personen text[], p_art text, p_thread uuid default null) returns void language plpgsql as $$
begin if (select kaputt from public.schalter) then raise exception 'Leitung kaputt'; end if; insert into public.signale values (p_personen, p_art, p_thread); end $$;`);
await db.exec(mig); ok(true, "Migration läuft in Postgres 16"); await db.exec(mig); ok(true, "ein zweites Mal ausführbar");
const T = "00000000-0000-0000-0000-0000000000a1";
await db.exec(`insert into kc_communication_thread_participants values ('${T}','P1',null),('${T}','P2',null),('${T}','P3',now());`);
const sig = async () => (await db.query("select an, art from signale order by ctid")).rows.map((r) => JSON.stringify(r.an) + r.art);
await db.exec(`insert into kc_club_tippen values ('${T}','P1',now(),'Hallo','text')`); ok((await sig()).length === 0, "normales Tippen → kein zusätzliches Signal (dafür gibt es „tippt“)");
await db.exec(`update kc_club_tippen set art='sprache', text=null where person_id='P1'`); ok(JSON.stringify(await sig()) === JSON.stringify(['["P2"]spricht']), "Sprachnachricht → „spricht“ an P2 (nicht an sich selbst, nicht an ausgeblendete)");
await db.exec(`update kc_club_tippen set art='sprache', text='diktat' where person_id='P1'`); ok((await sig())[1] === '["P2"]diktiert', "Diktat → „diktiert“");
await db.exec(`update schalter set kaputt=true; update kc_club_tippen set bis=now() where person_id='P1'`); ok((await db.query("select count(*)::int n from kc_club_tippen")).rows[0].n === 1, "Signal gestört → Speichern klappt trotzdem");
console.log("ALLE TESTS GRÜN"); process.exit(0);
