// KC-CLUB-RT-PUSH-ANGEZEIGT (DB, 20.10.2026): echte Migration in Postgres 16 im Speicher (PGlite, nichts geht an Supabase). Prüft: Push einer
// Chat-Nachricht wird „angezeigt“/„geöffnet“ → Signal „gelesen“ mit Chat-Kennung an den ABSENDER; sonst (andere Programme, andere Kennungen,
// Mail, gleicher Status, andere Status, kaputte Kennung, gestörtes Signal) kein Signal bzw. keine Störung der Zustellung.
// Start: PGLITE=<Pfad zu node_modules/@electric-sql/pglite> node tools/chat-sparsam/rt-push-angezeigt-test.mjs
import fs from "node:fs"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PGlite } = require(process.env.PGLITE || "@electric-sql/pglite");
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const mig = fs.readFileSync(new URL("../../supabase/migrations/20261020_kc_club_rt_push_angezeigt.sql", import.meta.url), "utf8");
const db = new PGlite();
await db.exec(`create role anon; create role authenticated;
create table kc_communication_messages (id uuid primary key, thread_id uuid, sender_person_id text, body text, created_at timestamptz default now());
create table kc_communication_requests (id uuid primary key default gen_random_uuid(), source_program text, channel text, correlation_id text, status text);
create table signale (an text[], art text, thread uuid);
create table schalter (kaputt boolean); insert into schalter values (false);
create function public.kc_club_rt_klingeln(p_personen text[], p_art text, p_thread uuid default null) returns void language plpgsql as $$
begin if (select kaputt from public.schalter) then raise exception 'Leitung kaputt'; end if; insert into public.signale values (p_personen, p_art, p_thread); end $$;`);
await db.exec(mig); ok(true, "Migration läuft in Postgres 16"); await db.exec(mig); ok(true, "ein zweites Mal ausführbar");
const T = "00000000-0000-0000-0000-0000000000a1", M = "00000000-0000-0000-0000-000000000001";
await db.exec(`insert into kc_communication_messages values ('${M}','${T}','P1','Hallo');
insert into kc_communication_requests (id, source_program, channel, correlation_id, status) values
 ('00000000-0000-0000-0000-0000000000b1','kc-club','push','club-nachricht:${M}','sent'),
 ('00000000-0000-0000-0000-0000000000b2','kc-club','email','club-nachricht:${M}','sent'),
 ('00000000-0000-0000-0000-0000000000b3','kc-club','push','club-vorschlag:${M}','sent'),
 ('00000000-0000-0000-0000-0000000000b4','kc-dp2','push','club-nachricht:${M}','sent'),
 ('00000000-0000-0000-0000-0000000000b5','kc-club','push','club-nachricht:kaputt','sent'),
 ('00000000-0000-0000-0000-0000000000b6','kc-club','push','club-nachricht:00000000-0000-0000-0000-00000000dead','sent');`);
const n = async () => (await db.query("select count(*)::int n from signale")).rows[0].n;
const st = (id, s) => db.exec(`update kc_communication_requests set status='${s}' where id='00000000-0000-0000-0000-0000000000${id}'`);
await st("b1", "processing"); ok(await n() === 0, "anderer Status (processing) → kein Signal");
await st("b1", "displayed"); let r = (await db.query("select an, art, thread from signale")).rows;
ok(r.length === 1 && JSON.stringify(r[0].an) === '["P1"]' && r[0].art === "gelesen" && r[0].thread === T, "Push angezeigt → Signal „gelesen“ an den Absender, mit Chat-Kennung");
await st("b1", "displayed"); ok(await n() === 1, "gleicher Status nochmal → kein weiteres Signal");
await st("b1", "opened"); ok(await n() === 2, "Push geöffnet → Signal");
await st("b2", "displayed"); await st("b3", "displayed"); await st("b4", "displayed"); ok(await n() === 2, "Mail, andere Kennung, anderes Programm → kein Signal");
await st("b5", "displayed"); ok(await n() === 2 && (await db.query("select status from kc_communication_requests where id='00000000-0000-0000-0000-0000000000b5'")).rows[0].status === "displayed", "kaputte Kennung → kein Signal, Status trotzdem gespeichert");
await st("b6", "displayed"); ok(await n() === 2, "Nachricht gibt es nicht (mehr) → kein Signal");
await db.exec("update schalter set kaputt = true; update kc_communication_requests set status = 'sent' where id='00000000-0000-0000-0000-0000000000b1'");
await st("b1", "displayed"); ok((await db.query("select status from kc_communication_requests where id='00000000-0000-0000-0000-0000000000b1'")).rows[0].status === "displayed", "Signal gestört → Zustellung/Status trotzdem gespeichert");
console.log("ALLE TESTS GRÜN"); process.exit(0);
