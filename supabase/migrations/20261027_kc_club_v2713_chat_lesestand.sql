-- 2.713.0 KC-CLUB-CHAT-LESESTAND (Wunsch Hansi „in der Nachrichten-Übersicht sofort sehen: wie viele Empfänger, wie viele zugestellt
-- (2 Haken), wie viele gelesen (blaue Haken) – in allen Chats, für alle“): Das Paket der Nachrichten-Übersicht liefert zusätzlich je Chat den
-- Stand MEINER letzten eigenen Nachricht (aus denselben 1000 neuesten Nachrichten wie bisher): Empfänger, angekommen, gelesen.
-- Gleiche Regeln wie „ℹ️ Details“ (nachricht_details): gelesen = Chat seit der Nachricht geöffnet (last_read_at) oder Quittung „gelesen“;
-- angekommen = gelesen oder Quittung „angekommen“ oder Club-App seitdem geöffnet – bei Admins mit Inkognito nie aus Quittung/App-Öffnen.
-- Push-Rückmeldungen des Handys zählt nur „ℹ️ Details“ (die Liste soll kein zusätzliches Durchsuchen des Versand-Journals auslösen).
-- Alles andere im Paket bleibt Zeichen für Zeichen gleich; weiterhin EIN Datenbank-Aufruf. Nur lesend; nur der Server (service_role).
-- Rückweg: Fassung aus 20261022_kc_club_unterhaltungen_paket.sql erneut einspielen (der Server zeigt dann einfach keine Haken in der Liste).
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
  ), mein as (
    select distinct on (thread_id) thread_id, id, created_at from msgs where sender_person_id = p_person order by thread_id, created_at desc
  ), inko as (
    select e.person_id from kc_club_person_einstellung e join kc_club_rollen r on r.person_id = e.person_id and r.ist_admin
     where e.schluessel = 'inkognito' and (e.wert->>'an') = 'true'
  ), stand as (
    select mm.thread_id, mm.id, mm.created_at, count(*) as empf,
           count(*) filter (where s.gel) as gelesen, count(*) filter (where s.gel or s.ang) as angekommen
      from mein mm
      join kc_communication_thread_participants p on p.thread_id = mm.thread_id and p.person_id <> p_person
      cross join lateral (select
        (p.last_read_at is not null and p.last_read_at >= mm.created_at)
          or exists (select 1 from kc_club_chat_quittung q where q.thread_id = mm.thread_id and q.art = 'gelesen' and q.person_id = p.person_id
                       and q.am >= mm.created_at and (q.seit is null or q.seit < mm.created_at)) as gel,
        p.person_id not in (select person_id from inko) and (
          exists (select 1 from kc_club_chat_quittung q where q.thread_id = mm.thread_id and q.art = 'angekommen' and q.person_id = p.person_id
                    and q.am >= mm.created_at and (q.seit is null or q.seit < mm.created_at))
          or exists (select 1 from kc_club_zugang z where z.person_id = p.person_id and z.zuletzt_gesehen >= mm.created_at)) as ang) s
     group by mm.thread_id, mm.id, mm.created_at
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
                      from agg a join letzte l on l.thread_id = a.thread_id), '[]'::jsonb),
    'stand', coalesce((select jsonb_agg(jsonb_build_object('thread_id', s.thread_id, 'id', s.id, 'zeit', s.created_at, 'empf', s.empf, 'angekommen', s.angekommen, 'gelesen', s.gelesen))
                      from stand s), '[]'::jsonb)
  )
$$;
revoke all on function public.kc_club_unterhaltungen_paket(text) from public, anon, authenticated;
grant execute on function public.kc_club_unterhaltungen_paket(text) to service_role;
