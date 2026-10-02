-- KC Club-App – Version 1.52.0 (Wunsch Hansi 02.10.2026, Weg B)
-- KC-CLUB-NOTBETRIEB  Notfall-Paket für den Ersatz-Server bei Cloudflare. Alle 15 Min. prüft der Zeitplaner, ob sich
--                     etwas geändert hat (Fingerabdruck); nur dann wird das Paket neu gebaut und signiert abgelegt.
--                     Kostet keine Neon-Rechenzeit. Solange kein Ersatz-Server eingetragen ist (url leer), tut der Lauf nichts.
-- Tabelle kc_club_notbetrieb: genau eine Zeile; privat = Signaturschlüssel (nie spiegeln, nie ausgeben).
-- Rückweg: select cron.unschedule('kc-club-notpaket-15min'); drop function kc_club_notpaket_fingerabdruck(); drop table kc_club_notbetrieb;
create table if not exists public.kc_club_notbetrieb (
  id int primary key default 1 check (id = 1),
  url text,
  privat jsonb,
  oeffentlich jsonb,
  fingerabdruck text,
  hochgeladen_am timestamptz,
  bestaetigt_am timestamptz,
  groesse int,
  mitglieder int,
  dauer_ms int,
  fehler text,
  fehler_am timestamptz,
  geaendert_am timestamptz default now()
);
alter table public.kc_club_notbetrieb enable row level security;
revoke all on public.kc_club_notbetrieb from public, anon, authenticated;
insert into public.kc_club_notbetrieb (id) values (1) on conflict (id) do nothing;

-- nie nach Neon (enthält den privaten Signaturschlüssel), auch nicht in die Sicherung
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_notbetrieb', 'club', 'secret', false, false, false, 'KC-CLUB-NOTBETRIEB: Signaturschlüssel – bewusst nicht gespiegelt')
on conflict (table_name) do update set mirror_enabled = false, backup_enabled = false, sensitivity = 'secret', note = excluded.note;

-- Fingerabdruck: ändert sich, sobald sich in den Tabellen des Notfall-Pakets etwas ändert (Zähler der Datenbank).
-- kc_club_zugang nur über aktive Links (zuletzt_gesehen ändert sich ständig und gehört nicht ins Paket).
create or replace function public.kc_club_notpaket_fingerabdruck()
 returns text
 language sql
 stable
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
  select md5(
    coalesce((select string_agg(relname || ':' || (n_tup_ins + n_tup_upd + n_tup_del)::text, ',' order by relname)
      from pg_stat_user_tables where schemaname = 'public' and relname in (
        'kc_core_people','kc_club_rollen','kc_club_freigaben','kc_club_notfall','kc_club_status','kc_club_treffen','kc_club_teilnahme',
        'kc_communication_messages','kc_communication_threads','kc_club_gruppen','kc_club_pinnwand','kc_club_aufgaben','kc_club_todo',
        'kc_club_sitzungsprotokolle','kc_club_vorschlaege','kc_club_stimmen','kc_club_terminumfragen','kc_club_terminumfrage_antworten',
        'kc_dp_plan_published','kc_club_reaktionen','kc_club_angeheftet','kc_club_nachricht_bearbeitet','kc_communication_message_hidden')), '')
    || '|' || coalesce((select string_agg(person_id || token_hash, ',' order by person_id) from public.kc_club_zugang where aktiv), '')
    || '|' || to_char(now() at time zone 'Europe/Berlin', 'YYYY-MM-DD'));  -- einmal am Tag sicher neu (Datumsangaben wie „heute“)
$function$;
revoke all on function public.kc_club_notpaket_fingerabdruck() from public, anon, authenticated;

-- Zeitplaner alle 15 Minuten (wie die Wartung, mit demselben Zeitplaner-Geheimnis aus dem Tresor)
select cron.schedule('kc-club-notpaket-15min', '*/15 * * * *', $cron$
  select net.http_post(
    url => 'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club',
    headers => '{"Content-Type":"application/json"}'::jsonb,
    body => jsonb_build_object('action', 'notpaket',
      'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_cron_secret')),
    timeout_milliseconds => 60000
  );
$cron$);
