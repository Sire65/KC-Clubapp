-- KC Club-App – Version 2.148.0 (Wunsch Hansi 09.10.2026)
-- KC-CLUB-SELBSTLOESCHEN  Nachrichten löschen sich nach 1 Std / 24 Std / 7 Tagen selbst – für einen ganzen Chat (⋮ → ⏳ Selbstlöschen)
--                         oder für eine einzelne Nachricht (⏳ beim Schreiben). Jedes Mitglied darf es in seinen Chats einstellen.
--   • kc_club_chat_selbstloeschen: Einstellung je Chat (nur Zeit + wer/wann, kein Text)
--   • kc_club_nachricht_ablauf:    Ablaufzeit je Nachricht; hängt wie ❗ Wichtig an kc_communication_messages (on delete cascade)
--   • kc_club_selbstloeschen_ausfuehren(): löscht abgelaufene Nachrichten (Anlagen-Verknüpfung, Reaktionen usw. folgen per cascade)
--   • Zeitplaner alle 5 Minuten – löscht auch, wenn niemand die App offen hat
-- Die Kern-Tabellen bleiben unverändert. Zugriff nur über den Server (kc-club), RLS an, keine Policies.
-- Rückweg: select cron.unschedule('kc-club-selbstloeschen'); drop function kc_club_selbstloeschen_ausfuehren();
--          drop table kc_club_nachricht_ablauf; drop table kc_club_chat_selbstloeschen; Spiegel-Regeln der beiden Tabellen löschen.
create table if not exists kc_club_chat_selbstloeschen (
  thread_id uuid primary key references kc_communication_threads(id) on delete cascade,
  stunden integer not null check (stunden in (1, 24, 168)),
  von text not null references kc_core_people(person_id),
  am timestamptz not null default now()
);
alter table kc_club_chat_selbstloeschen enable row level security;
revoke all on kc_club_chat_selbstloeschen from anon, authenticated;

create table if not exists kc_club_nachricht_ablauf (
  message_id uuid primary key references kc_communication_messages(id) on delete cascade,
  thread_id uuid not null references kc_communication_threads(id) on delete cascade,
  stunden integer not null check (stunden in (1, 24, 168)),
  loescht_am timestamptz not null
);
create index if not exists kc_club_nachricht_ablauf_zeit_idx on kc_club_nachricht_ablauf (loescht_am);
alter table kc_club_nachricht_ablauf enable row level security;
revoke all on kc_club_nachricht_ablauf from anon, authenticated;

create or replace function public.kc_club_selbstloeschen_ausfuehren()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
set statement_timeout to '30s'
as $function$
declare
  v_n integer;
begin
  delete from public.kc_communication_messages m
    using public.kc_club_nachricht_ablauf a
    where a.message_id = m.id and a.loescht_am <= now();
  get diagnostics v_n = row_count;
  return v_n;
end;
$function$;
revoke all on function public.kc_club_selbstloeschen_ausfuehren() from public, anon, authenticated;
grant execute on function public.kc_club_selbstloeschen_ausfuehren() to service_role;

select cron.schedule('kc-club-selbstloeschen', '*/5 * * * *', $$select public.kc_club_selbstloeschen_ausfuehren();$$);

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_chat_selbstloeschen', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-SELBSTLOESCHEN (2.148.0): nur Zeit je Chat, kein Text'),
  ('kc_club_nachricht_ablauf', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-SELBSTLOESCHEN (2.148.0): nur Ablaufzeit je Nachricht, kein Text')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_chat_selbstloeschen'), ('kc_club_nachricht_ablauf')
on conflict (table_name) do nothing;
