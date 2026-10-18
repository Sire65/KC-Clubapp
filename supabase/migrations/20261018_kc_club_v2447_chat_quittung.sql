-- KC-CLUB-GRUPPEN-QUITTUNG (2.447.0, Wunschliste #8, Wunsch Hansi „im Gruppenchat eine einfache Übersicht wie in WhatsApp: Zugestellt an xy um
-- x Uhr mit 2 grauen Haken und gelesen von xy um x Uhr mit 2 blauen Haken“).
-- Je Chat und Person ein kurzer Eintrag, WENN neue Nachrichten anderer da sind:
--   art 'angekommen' = die App des Empfängers hat die neuen Nachrichten geladen (Zähler beim Öffnen/Aktualisieren der App),
--   art 'gelesen'    = der Empfänger hat den Chat geöffnet.
-- „seit“ = bis wohin vorher schon angekommen/gelesen war; ein Eintrag gilt für Nachrichten mit seit < Zeit <= am. So bekommt jede
-- Nachricht die ERSTE echte Uhrzeit; Nachrichten von vor dieser Version haben keine (die App zeigt dann „Uhrzeit unbekannt“).
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated. Aufräumen nach 400 Tagen in der Wartung.
-- Rückweg: drop function public.kc_club_chat_quittung_merken(text, uuid[], text); drop table public.kc_club_chat_quittung;
create table if not exists public.kc_club_chat_quittung (
  id bigint generated always as identity primary key,
  thread_id uuid not null,
  person_id text not null,
  art text not null check (art in ('angekommen', 'gelesen')),
  seit timestamptz,
  am timestamptz not null default now()
);
create index if not exists kc_club_chat_quittung_suche on public.kc_club_chat_quittung (thread_id, art, person_id, am);
create index if not exists kc_club_chat_quittung_alter on public.kc_club_chat_quittung (am);
alter table public.kc_club_chat_quittung enable row level security;
revoke all on public.kc_club_chat_quittung from anon, authenticated;
grant select, insert, delete on public.kc_club_chat_quittung to service_role;

-- Merkt für die übergebenen Chats einen Eintrag – nur, wenn die Person Teilnehmer ist und seit dem letzten Stand
-- (gelesen bis bzw. letzter Eintrag dieser Art) wirklich neue Nachrichten anderer gekommen sind. Gibt die Zahl der Einträge zurück.
create or replace function public.kc_club_chat_quittung_merken(p_person text, p_threads uuid[], p_art text)
returns integer
language plpgsql
set search_path = public
as $$
declare n integer;
begin
  if p_art not in ('angekommen', 'gelesen') or p_person is null or coalesce(array_length(p_threads, 1), 0) = 0 then return 0; end if;
  with stand as (
    select t.thread_id,
           greatest(coalesce(t.last_read_at, '-infinity'::timestamptz),
                    coalesce((select max(q.am) from public.kc_club_chat_quittung q
                               where q.thread_id = t.thread_id and q.person_id = p_person and q.art = p_art), '-infinity'::timestamptz)) as seit
      from public.kc_communication_thread_participants t
     where t.person_id = p_person and t.thread_id = any (p_threads[1:50])
  ), neu as (
    insert into public.kc_club_chat_quittung (thread_id, person_id, art, seit, am)
    select s.thread_id, p_person, p_art, nullif(s.seit, '-infinity'::timestamptz), now()
      from stand s
     where exists (select 1 from public.kc_communication_messages m
                    where m.thread_id = s.thread_id and m.sender_person_id <> p_person
                      and m.created_at > s.seit and m.created_at <= now())
    returning 1
  )
  select count(*) into n from neu;
  return n;
end $$;
revoke all on function public.kc_club_chat_quittung_merken(text, uuid[], text) from public, anon, authenticated;
grant execute on function public.kc_club_chat_quittung_merken(text, uuid[], text) to service_role;
