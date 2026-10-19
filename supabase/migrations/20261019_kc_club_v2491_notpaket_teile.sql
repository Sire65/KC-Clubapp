-- KC-CLUB-NOTPAKET-NUR-GEAENDERTE (Server 2.491.0, 19.10.2026, Wunsch Hansi „Ja bau 1 und 2. Und auch 3“): Das Notfall-Paket
-- (~3.300 Datenbankabfragen je Bau) wird nur noch für die Mitglieder neu gebaut, die eine Änderung wirklich betrifft – wenn sich seit
-- dem letzten Bau NUR Chats geändert haben (neue/bearbeitete Nachrichten, Reaktionen, Anheften, Ausblenden, neue Chats). Alle anderen
-- Mitglieder übernimmt der Server unverändert aus dem letzten Paket. Bei jedem Zweifel (Löschungen, andere Tabellen, neuer Tag,
-- geänderte Zugänge, Zähler zurückgesetzt) baut er wie bisher ALLES neu.
-- 1) kc_club_notpaket_zaehler(): Zähler je Tabelle (eingefügt/geändert/gelöscht) statt eines einzigen Fingerabdrucks – nur lesend.
-- 2) kc_club_notpaket_vorrat: das letzte Paket (gzip, base64) + die Zähler von damals. Nur der Club-Server (service_role).
--    Enthält dieselben Daten wie das Paket beim Ersatz-Server → nie gespiegelt, nicht in die Sicherung (wird jederzeit neu gebaut).
-- Rückweg: drop function public.kc_club_notpaket_zaehler(); drop table public.kc_club_notpaket_vorrat;
--          (der Server baut dann automatisch wieder jedes Mal alles – keine weitere Änderung nötig)
create table if not exists public.kc_club_notpaket_vorrat (
  id int primary key default 1 check (id = 1),
  paket_gz text,            -- letztes Paket, gzip + base64
  zaehler jsonb,            -- kc_club_notpaket_zaehler() beim Bau dieses Pakets
  voll_am timestamptz,      -- letzter vollständiger Bau (spätestens alle 6 Std. wieder alles)
  geaendert_am timestamptz not null default now()
);
alter table public.kc_club_notpaket_vorrat enable row level security;
revoke all on public.kc_club_notpaket_vorrat from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_notpaket_vorrat to service_role;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_notpaket_vorrat', 'club', 'secret', false, false, false, 'KC-CLUB-NOTPAKET-NUR-GEAENDERTE: Kopie des Notfall-Pakets – bewusst nicht gespiegelt')
on conflict (table_name) do update set mirror_enabled = false, backup_enabled = false, sensitivity = 'secret', note = excluded.note;

-- dieselben Tabellen wie kc_club_notpaket_fingerabdruck() + Chat-Teilnehmer (nur eingefügt/gelöscht – „gelesen“ ändert nur last_read_at)
create or replace function public.kc_club_notpaket_zaehler()
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
  select jsonb_build_object(
    'tabellen', coalesce((select jsonb_object_agg(relname, jsonb_build_array(n_tup_ins,
        case when relname = 'kc_communication_thread_participants' then 0 else n_tup_upd end, n_tup_del))
      from pg_stat_user_tables where schemaname = 'public' and relname in (
        'kc_core_people','kc_club_rollen','kc_club_freigaben','kc_club_notfall','kc_club_status','kc_club_treffen','kc_club_teilnahme',
        'kc_communication_messages','kc_communication_threads','kc_club_gruppen','kc_club_pinnwand','kc_club_aufgaben','kc_club_todo',
        'kc_club_sitzungsprotokolle','kc_club_vorschlaege','kc_club_stimmen','kc_club_terminumfragen','kc_club_terminumfrage_antworten',
        'kc_dp_plan_published','kc_club_reaktionen','kc_club_angeheftet','kc_club_nachricht_bearbeitet','kc_communication_message_hidden',
        'kc_communication_thread_participants')), '{}'::jsonb),
    'zugang', md5(coalesce((select string_agg(person_id || token_hash, ',' order by person_id) from public.kc_club_zugang where aktiv), '')),
    'tag', to_char(now() at time zone 'Europe/Berlin', 'YYYY-MM-DD'),
    'am', now());
$function$;
revoke all on function public.kc_club_notpaket_zaehler() from public, anon, authenticated;
grant execute on function public.kc_club_notpaket_zaehler() to service_role;
