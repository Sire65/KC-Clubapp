// KC-CLUB-CHAT-STAND (2.510.0): echte Migration in Postgres 16 im Speicher (PGlite, nichts geht an Supabase). Änderungstest:
// JEDE Änderung, die die Aktion „unterhaltung“ anders anzeigen würde, muss den Fingerabdruck ändern; Unsichtbares (eigenes „gelesen bis“,
// andere Chats, Lebenszeichen des Gegenübers während er online ist, Quittungen) darf ihn NICHT ändern – sonst spart es nichts.
// Start: PGLITE=<Pfad zu node_modules/@electric-sql/pglite> node tools/chat-sparsam/chat-stand-test.mjs
import fs from "node:fs"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PGlite } = require(process.env.PGLITE || "@electric-sql/pglite");
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const mig = fs.readFileSync(new URL("../../supabase/migrations/20261020_kc_club_chat_stand.sql", import.meta.url), "utf8");
const SCHEMA = `create role anon; create role authenticated; create role service_role;
create table kc_communication_threads (id uuid primary key, org_id text, subject text, created_by_person_id text, created_at timestamptz, updated_at timestamptz);
create table kc_communication_thread_participants (thread_id uuid, person_id text, joined_at timestamptz, last_read_at timestamptz, reply_token_hash text, hidden_at timestamptz);
create table kc_communication_messages (id uuid primary key, thread_id uuid, sender_person_id text, body text, reply_to_message_id uuid, created_at timestamptz);
create table kc_communication_message_hidden (person_id text, message_id uuid, hidden_at timestamptz);
create table kc_communication_message_attachments (message_id uuid, attachment_id uuid, hochgeladen_von_person_id text);
create table kc_communication_attachments (id uuid primary key, file_name text, mime_type text, size_bytes bigint);
create table kc_club_einmal_foto (attachment_id uuid, message_id uuid, thread_id uuid, absender text, erstellt_am timestamptz, entfernt_am timestamptz);
create table kc_club_einmal_foto_gesehen (attachment_id uuid, person_id text, gesehen_am timestamptz);
create table kc_club_nachricht_ablauf (message_id uuid, thread_id uuid, stunden int, loescht_am timestamptz);
create table kc_club_chat_selbstloeschen (thread_id uuid, stunden int, von text, am timestamptz);
create table kc_club_person_einstellung (person_id text, schluessel text, wert jsonb, geaendert_am timestamptz);
create table kc_club_rollen (person_id text, ist_admin boolean, ist_vorstand boolean);
create table kc_communication_requests (id uuid primary key, correlation_id text, channel text, status text, recipient_refs jsonb);
create table kc_communication_delivery_events (id serial, request_id uuid, event_type text, detail jsonb, created_at timestamptz);
create table kc_club_zugang (person_id text, zuletzt_gesehen timestamptz);
create table kc_club_reaktionen (message_id uuid, person_id text, emoji text, zeit timestamptz);
create table kc_club_erwaehnungen (message_id uuid, person_id text);
create table kc_club_nachricht_bearbeitet (message_id uuid, bearbeitet_am timestamptz);
create table kc_club_angeheftet (message_id uuid, thread_id uuid, von text, am timestamptz);
create table kc_club_gemerkt (person_id text, message_id uuid, am timestamptz);
create table kc_club_chat_umfrage (message_id uuid, frage text, optionen jsonb, mehrfach boolean, erstellt_von text);
create table kc_club_chat_stimme (message_id uuid, person_id text, option smallint, am timestamptz);
create table kc_club_chat_kontakt (message_id uuid, person_id text);
create table kc_club_nachricht_wichtig (message_id uuid, person_id text, am timestamptz);
create table kc_club_link_vorschau (message_id uuid, url text, titel text, text text, bild text, seite text);
create table kc_club_express (message_id uuid, thread_id uuid, absender text, erstellt_am timestamptz);
create table kc_club_express_antwort (message_id uuid, person_id text, antwort text, bestaetigt_am timestamptz);
create table kc_club_express_zustellung (message_id uuid, person_id text, angekommen_am timestamptz, gelesen_am timestamptz);
create table kc_club_gruppen (thread_id uuid, name text, symbol text, erstellt_von text, admins text[]);
create table kc_club_tippen (thread_id uuid, person_id text, bis timestamptz, text text, art text);
create table kc_club_geplant (id uuid primary key, person_id text, thread_id uuid, text text, senden_um timestamptz, status text, geaendert_am timestamptz);
create table kc_club_chat_quittung (thread_id uuid, person_id text, art text, am timestamptz);`;
const T = "00000000-0000-0000-0000-0000000000a1", T2 = "00000000-0000-0000-0000-0000000000a2";
const M1 = "00000000-0000-0000-0000-000000000001", M2 = "00000000-0000-0000-0000-000000000002", M3 = "00000000-0000-0000-0000-000000000003";
const A1 = "00000000-0000-0000-0000-0000000000f1", R1 = "00000000-0000-0000-0000-0000000000e1", G1 = "00000000-0000-0000-0000-0000000000c1";
const JETZT = "2026-10-20 10:00:00+00";
const GRUND = `insert into kc_communication_threads values ('${T}','ORG','Betreff','P1',now(),now()), ('${T2}','ORG','Anderer','P1',now(),now());
insert into kc_communication_thread_participants values ('${T}','P1',now(),'2026-10-20 09:00+00',null,null), ('${T}','P2',now(),'2026-10-20 09:10+00',null,null), ('${T2}','P1',now(),null,null,null), ('${T2}','P3',now(),null,null,null);
insert into kc_communication_messages values ('${M1}','${T}','P1','Hallo',null,'2026-10-20 09:20+00'), ('${M2}','${T}','P2','Hi zurück','${M1}','2026-10-20 09:25+00'), ('${M3}','${T}','P1','Foto','${M2}','2026-10-20 09:56+00');
insert into kc_communication_message_attachments values ('${M3}','${A1}','P1'); insert into kc_communication_attachments values ('${A1}','bild.jpg','image/jpeg',1000);
insert into kc_club_einmal_foto values ('${A1}','${M3}','${T}','P1','2026-10-20 09:56+00',null);
insert into kc_club_person_einstellung values ('P2','sende_effekt','{"art":"herz"}',now()), ('P2','online_seit','{"seit":"2026-10-20T09:50:00.000Z","zuletzt":"2026-10-20T09:59:30.000Z"}',now()), ('P9','sende_effekt','{"art":"x"}',now());
insert into kc_club_rollen values ('P1',true,false), ('P2',false,false);
insert into kc_communication_requests values ('${R1}','club-nachricht:${M3}:push','push','sent','[{"personId":"P2"}]');
insert into kc_club_zugang values ('P1','2026-10-20 09:59:50+00'), ('P2','2026-10-20 09:59:30+00');
insert into kc_club_reaktionen values ('${M2}','P1','👍',now()); insert into kc_club_chat_umfrage values ('${M1}','Wann?','["Mo","Di"]',false,'P1');
insert into kc_club_express values ('${M3}','${T}','P1',now()); insert into kc_club_gruppen values ('${T}','Grillteam','🍳','P1','{P1}');`;
const db = new PGlite();
await db.exec(SCHEMA); await db.exec(mig); ok(true, "Migration läuft in Postgres 16 (inkl. revoke/grant)");
const tabellen = (await db.query("select tablename from pg_tables where schemaname='public'")).rows.map((x) => x.tablename);
async function welt() { for (const t of tabellen) await db.exec(`truncate ${t}`); await db.exec(GRUND); }
const stand = async (person = "P1", jetzt = JETZT) => (await db.query("select public.kc_club_chat_stand($1,$2,$3,150,30,7,15) s", [T, person, jetzt])).rows[0].s;
await welt(); const S0 = await stand();
ok(typeof S0 === "string" && S0.length === 32 && S0 === await stand(), "Fingerabdruck stabil (gleiche Daten → gleicher Wert)");
ok((await stand("P3")) === null, "nicht im Chat → NULL");
ok(S0 !== await stand("P2"), "je Person eigener Fingerabdruck (eigene/ausgeblendete/gemerkte Nachrichten)");

const muss = [
  ["neue Nachricht", `insert into kc_communication_messages values (gen_random_uuid(),'${T}','P2','Neu',null,'2026-10-20 09:58+00')`],
  ["Nachricht gelöscht", `delete from kc_communication_messages where id='${M2}'`],
  ["Text geändert (bearbeitet)", `update kc_communication_messages set body='Hallo!' where id='${M1}'`],
  ["Bearbeitet-Kennzeichen", `insert into kc_club_nachricht_bearbeitet values ('${M1}', now())`],
  ["anderer hat gelesen", `update kc_communication_thread_participants set last_read_at='2026-10-20 09:59+00' where thread_id='${T}' and person_id='P2'`],
  ["neuer Teilnehmer", `insert into kc_communication_thread_participants values ('${T}','P4',now(),null,null,null)`],
  ["Teilnehmer ausgetreten", `delete from kc_communication_thread_participants where thread_id='${T}' and person_id='P2'`],
  ["für mich ausgeblendet", `insert into kc_communication_message_hidden values ('P1','${M2}',now())`],
  ["Selbstlöschen-Ablauf gesetzt", `insert into kc_club_nachricht_ablauf values ('${M2}','${T}',1,'2026-10-20 11:00+00')`],
  ["Chat-Selbstlöschen eingestellt", `insert into kc_club_chat_selbstloeschen values ('${T}',24,'P1',now())`],
  ["Anlage dazu", `insert into kc_communication_message_attachments values ('${M1}',gen_random_uuid(),'P1')`],
  ["Einmal-Foto entfernt", `update kc_club_einmal_foto set entfernt_am=now()`],
  ["Einmal-Foto gesehen", `insert into kc_club_einmal_foto_gesehen values ('${A1}','P2',now())`],
  ["Sende-Effekt geändert", `update kc_club_person_einstellung set wert='{"art":"stern"}' where person_id='P2' and schluessel='sende_effekt'`],
  ["Inkognito eingeschaltet", `insert into kc_club_person_einstellung values ('P2','inkognito','{"an":true}',now())`],
  ["Online-Anzeige verborgen", `insert into kc_club_person_einstellung values ('P2','online','{"zeigen":false}',now())`],
  ["Rolle geändert (Vorstand)", `update kc_club_rollen set ist_vorstand=true where person_id='P1'`],
  ["Push angezeigt", `update kc_communication_requests set status='displayed'`],
  ["Mail-Auftrag dazu", `insert into kc_communication_requests values (gen_random_uuid(),'club-nachricht:${M1}','email','sent','[]')`],
  ["Push-Anzeige-Ereignis", `insert into kc_communication_delivery_events (request_id,event_type,created_at) values ('${R1}','displayed',now())`],
  ["Gegenüber hat nach meiner letzten Nachricht die App geladen", `update kc_club_zugang set zuletzt_gesehen='2026-10-20 09:57+00' where person_id='P2'; update kc_club_person_einstellung set wert='{"seit":"2026-10-20T09:50:00.000Z","zuletzt":"2026-10-20T09:57:00.000Z"}' where person_id='P2' and schluessel='online_seit'`],
  ["Reaktion dazu", `insert into kc_club_reaktionen values ('${M1}','P2','❤️',now())`],
  ["Reaktion geändert", `update kc_club_reaktionen set emoji='😂'`],
  ["Reaktion weg", `delete from kc_club_reaktionen`],
  ["Erwähnung", `insert into kc_club_erwaehnungen values ('${M1}','P2')`],
  ["angeheftet", `insert into kc_club_angeheftet values ('${M1}','${T}','P1',now())`],
  ["gemerkt (ich)", `insert into kc_club_gemerkt values ('P1','${M1}',now())`],
  ["Stimme abgegeben", `insert into kc_club_chat_stimme values ('${M1}','P2',1,now())`],
  ["Umfrage geändert", `update kc_club_chat_umfrage set optionen='["Mo","Di","Mi"]'`],
  ["Kontakt geteilt", `insert into kc_club_chat_kontakt values ('${M1}','P2')`],
  ["wichtig markiert", `insert into kc_club_nachricht_wichtig values ('${M1}','P1',now())`],
  ["Link-Vorschau dazu", `insert into kc_club_link_vorschau values ('${M1}','https://x.de','Titel',null,null,'x.de')`],
  ["Express-Bestätigung", `insert into kc_club_express_antwort values ('${M3}','P2','ok',now())`],
  ["Express zugestellt", `insert into kc_club_express_zustellung values ('${M3}','P2',now(),null)`],
  ["Gruppe umbenannt", `update kc_club_gruppen set name='Grillteam 2026'`],
  ["Gruppen-Admin dazu", `update kc_club_gruppen set admins='{P1,P2}'`],
  ["Betreff geändert", `update kc_communication_threads set subject='Neu' where id='${T}'`],
  ["der andere tippt", `insert into kc_club_tippen values ('${T}','P2','2026-10-20 10:00:05+00',null,'text')`],
  ["geplante Nachricht", `insert into kc_club_geplant values (gen_random_uuid(),'P1','${T}','Später','2026-10-21 08:00+00','offen',now())`],
];
for (const [name, sql] of muss) { await welt(); await db.exec(sql); const s = await stand(); if (s === S0) ok(false, "ändert den Fingerabdruck: " + name); }
ok(true, `${muss.length} sichtbare Änderungen ändern alle den Fingerabdruck`);

// mit der Zeit (ohne Datenänderung)
await welt(); await db.exec(`insert into kc_club_nachricht_ablauf values ('${M2}','${T}',1,'2026-10-20 10:05+00')`); const vorAblauf = await stand();
ok(vorAblauf !== await stand("P1", "2026-10-20 10:06:00+00"), "Selbstlöschen läuft ab → Fingerabdruck ändert sich von selbst");
await welt();
ok(S0 !== await stand("P1", "2026-10-20 10:12:00+00"), "Bearbeiten-Frist (15 Min.) läuft ab / Gegenüber geht offline → ändert sich");
await db.exec(`delete from kc_club_tippen; insert into kc_club_tippen values ('${T}','P2','2026-10-20 10:00:05+00',null,'text')`); const tippt = await stand();
ok(tippt !== await stand("P1", "2026-10-20 10:00:06+00"), "Tippen läuft ab (bis) → ändert sich");

const darfNicht = [
  ["mein eigenes „gelesen bis“ (setzt das Laden selbst)", `update kc_communication_thread_participants set last_read_at=now() where thread_id='${T}' and person_id='P1'`],
  ["Quittung gemerkt", `insert into kc_club_chat_quittung values ('${T}','P2','angekommen',now())`],
  ["Nachricht in einem anderen Chat", `insert into kc_communication_messages values (gen_random_uuid(),'${T2}','P3','Woanders',null,now())`],
  ["Einstellung von jemandem außerhalb", `update kc_club_person_einstellung set wert='{"art":"y"}' where person_id='P9'`],
  ["Lebenszeichen des Gegenübers, solange er online ist", `update kc_club_zugang set zuletzt_gesehen='2026-10-20 09:59:55+00' where person_id='P2'; update kc_club_person_einstellung set wert='{"seit":"2026-10-20T09:50:00.000Z","zuletzt":"2026-10-20T09:59:55.000Z"}' where person_id='P2' and schluessel='online_seit'`],
  ["mein eigenes Lebenszeichen", `update kc_club_zugang set zuletzt_gesehen='2026-10-20 09:59:58+00' where person_id='P1'`],
  ["Tippen von mir selbst", `insert into kc_club_tippen values ('${T}','P1','2026-10-20 10:00:05+00',null,'text')`],
  ["abgelaufenes Tippen des anderen", `insert into kc_club_tippen values ('${T}','P2','2026-10-20 09:59:00+00',null,'text')`],
];
for (const [name, sql] of darfNicht) { await welt(); await db.exec(sql); const s = await stand(); if (s !== S0) ok(false, "darf den Fingerabdruck NICHT ändern: " + name); }
ok(true, `${darfNicht.length} unsichtbare Änderungen lassen den Fingerabdruck gleich (sonst kein Spareffekt)`);
console.log("ALLE TESTS GRÜN"); process.exit(0);
