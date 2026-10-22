-- 2.598.0 KC-CLUB-UNTERHALTUNGEN-PAKET (Stufe 3 „bündeln statt einzeln nacheinander“, Wunsch Hansi „Ja baue Pak 3“, „sorgfältig und vorsichtig“):
-- die Nachrichten-Übersicht in EINEM Datenbank-Aufruf. Bisher: Teilnahme → (Chats, Teilnehmer, bis zu 1000 GANZE Nachrichten, Gruppen) → „wichtig“,
-- dabei gingen alle Nachrichtentexte zum Server, nur um je Chat die letzte Zeile und Zahlen zu zeigen. Jetzt rechnet die Datenbank je Chat genau das,
-- was der Server bisher aus denselben 1000 neuesten Nachrichten gerechnet hat (gleiche Grenzen: 1000 Nachrichten, 300 ungelesene für „wichtig“).
-- Nur lesend; nur der Server (service_role) darf aufrufen. Not-Aus ohne neue Version: kc_club_konfig 'unterhaltungen_paket' = {"aus": true}.
-- Rückweg: drop function public.kc_club_unterhaltungen_paket(text);
create or replace function public.kc_club_unterhaltungen_paket(p_person text)
returns jsonb language sql stable set search_path = public as $$
  with meine as (
    select thread_id, last_read_at from kc_communication_thread_participants where person_id = p_person and hidden_at is null
  ), msgs as (
    select id, thread_id, sender_person_id, body, created_at from kc_communication_messages
     where thread_id in (select thread_id from meine) order by created_at desc limit 1000
  ), un as (
    select m.id, m.thread_id, row_number() over (order by m.created_at desc) as rn
      from msgs m join meine me on me.thread_id = m.thread_id
     where m.sender_person_id <> p_person and (me.last_read_at is null or m.created_at > me.last_read_at)
  ), un300 as (
    select id, thread_id from un where rn <= 300
  ), letzte as (
    select distinct on (thread_id) thread_id, sender_person_id, left(body, 120) as body, created_at from msgs order by thread_id, created_at desc
  ), agg as (
    select m.thread_id, count(*) as n,
           (select count(*) from un where un.thread_id = m.thread_id) as ungelesen,
           (select count(*) from un300 join kc_club_nachricht_wichtig w on w.message_id = un300.id where un300.thread_id = m.thread_id) as wichtig_neu,
           exists (select 1 from un300 where un300.thread_id = m.thread_id) as quittung
      from msgs m group by m.thread_id
  )
  select jsonb_build_object(
    'meine', coalesce((select jsonb_agg(jsonb_build_object('thread_id', thread_id, 'last_read_at', last_read_at)) from meine), '[]'::jsonb),
    'th', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'subject', t.subject, 'created_by_person_id', t.created_by_person_id, 'updated_at', t.updated_at))
                      from kc_communication_threads t where t.id in (select thread_id from meine)), '[]'::jsonb),
    'tn', coalesce((select jsonb_agg(jsonb_build_object('thread_id', p.thread_id, 'person_id', p.person_id))
                      from kc_communication_thread_participants p where p.thread_id in (select thread_id from meine)), '[]'::jsonb),
    'gr', coalesce((select jsonb_agg(jsonb_build_object('thread_id', g.thread_id, 'name', g.name, 'symbol', g.symbol))
                      from kc_club_gruppen g where g.thread_id in (select thread_id from meine)), '[]'::jsonb),
    'agg', coalesce((select jsonb_agg(jsonb_build_object('thread_id', a.thread_id, 'n', a.n, 'ungelesen', a.ungelesen, 'wichtig_neu', a.wichtig_neu, 'quittung', a.quittung,
                      'letzte', jsonb_build_object('sender_person_id', l.sender_person_id, 'body', l.body, 'created_at', l.created_at)))
                      from agg a join letzte l on l.thread_id = a.thread_id), '[]'::jsonb)
  )
$$;
revoke all on function public.kc_club_unterhaltungen_paket(text) from public, anon, authenticated;
grant execute on function public.kc_club_unterhaltungen_paket(text) to service_role;
