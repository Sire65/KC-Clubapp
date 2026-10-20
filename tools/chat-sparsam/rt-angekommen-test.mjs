// KC-CLUB-RT-ANGEKOMMEN (2.509.0): echte Migration in Postgres 16 im Speicher (PGlite, nichts geht an Supabase). Prüft: Eintrag „angekommen“ →
// Signal „gelesen“ mit Chat-Kennung an alle ANDEREN sichtbaren Teilnehmer; „gelesen“-Einträge → kein zusätzliches Signal; Fehler im Signal
// verhindert das Speichern der Quittung nicht. Start: PGLITE=<Pfad zu node_modules/@electric-sql/pglite> node tools/chat-sparsam/rt-angekommen-test.mjs
import fs from "node:fs"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PGlite } = require(process.env.PGLITE || "@electric-sql/pglite");
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const mig = fs.readFileSync(new URL("../../supabase/migrations/20261020_kc_club_rt_angekommen.sql", import.meta.url), "utf8");
const db = new PGlite();
await db.exec(`create role anon; create role authenticated;
create table kc_communication_thread_participants (thread_id uuid, person_id text, hidden_at timestamptz);
create table kc_club_chat_quittung (id bigint generated always as identity primary key, thread_id uuid not null, person_id text not null, art text not null, seit timestamptz, am timestamptz not null default now());
create table signale (an text[], art text, thread uuid);
create table schalter (kaputt boolean); insert into schalter values (false);
-- Ersatz für die echte Funktion: merkt sich nur, was gesendet würde
create function public.kc_club_rt_klingeln(p_personen text[], p_art text, p_thread uuid default null) returns void language plpgsql as $$
begin if (select kaputt from public.schalter) then raise exception 'Leitung kaputt'; end if; insert into public.signale values (p_personen, p_art, p_thread); end $$;`);
await db.exec(mig); ok(true, "Migration läuft in Postgres 16");
await db.exec(mig); ok(true, "Migration ein zweites Mal ausführbar (drop trigger if exists)");
const T1 = "11111111-1111-1111-1111-111111111111", T2 = "22222222-2222-2222-2222-222222222222";
await db.exec(`insert into kc_communication_thread_participants values ('${T1}','A',null),('${T1}','B',null),('${T1}','C',now()),('${T2}','A',null),('${T2}','D',null);`);
await db.exec(`insert into kc_club_chat_quittung (thread_id, person_id, art) values ('${T1}','B','angekommen');`);
let r = (await db.query("select an, art, thread from signale")).rows;
ok(r.length === 1 && JSON.stringify(r[0].an) === '["A"]' && r[0].art === "gelesen" && r[0].thread === T1, "„angekommen“ von B → Signal „gelesen“ an A (nicht an B selbst, nicht an ausgeblendete C)");
await db.exec(`insert into kc_club_chat_quittung (thread_id, person_id, art) values ('${T1}','A','gelesen');`);
ok((await db.query("select count(*)::int n from signale")).rows[0].n === 1, "„gelesen“-Eintrag: kein zusätzliches Signal (kommt schon über last_read_at)");
await db.exec(`insert into kc_club_chat_quittung (thread_id, person_id, art) values ('${T2}','D','angekommen'), ('${T2}','A','angekommen');`);
r = (await db.query("select an from signale where thread = $1 order by 1", [T2])).rows.map((x) => JSON.stringify(x.an)).sort();
ok(JSON.stringify(r) === JSON.stringify(['["A"]', '["D"]']), "je Eintrag eigenes Signal an die jeweils anderen");
await db.exec(`update schalter set kaputt = true; insert into kc_club_chat_quittung (thread_id, person_id, art) values ('${T1}','A','angekommen');`);
ok((await db.query("select count(*)::int n from kc_club_chat_quittung where person_id='A' and art='angekommen' and thread_id=$1", [T1])).rows[0].n === 1, "Signal gestört → Quittung trotzdem gespeichert");
console.log("ALLE TESTS GRÜN"); process.exit(0);
