-- KC-CLUB-START-PARALLEL-3 (2.162.0, Wunsch Hansi „Start optimieren, nicht schlechter machen“):
-- ungelesene Nachrichten je sichtbarem Chat einer Person in EINER Abfrage (vorher eine Anfrage je Chat).
-- Zählt genau wie der Server bisher: Nachrichten anderer (sender_person_id <> ich), nach last_read_at (falls gesetzt).
-- Nur lesend; nur der Server (service_role) darf sie aufrufen. Rückweg: drop function public.kc_club_ungelesen_je_chat(text);
create or replace function public.kc_club_ungelesen_je_chat(p_person text)
returns table (thread_id uuid, last_read_at timestamptz, n bigint)
language sql
stable
set search_path = public
as $$
  select t.thread_id, t.last_read_at,
         (select count(*) from public.kc_communication_messages m
           where m.thread_id = t.thread_id
             and m.sender_person_id <> p_person
             and (t.last_read_at is null or m.created_at > t.last_read_at)) as n
    from public.kc_communication_thread_participants t
   where t.person_id = p_person
     and t.hidden_at is null;
$$;
revoke all on function public.kc_club_ungelesen_je_chat(text) from public, anon, authenticated;
grant execute on function public.kc_club_ungelesen_je_chat(text) to service_role;
