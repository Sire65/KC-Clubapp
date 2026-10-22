-- 2.597.0 KC-CLUB-ONLINE-PAKET + KC-CLUB-MAHNUNG-PAKET (Prüfung „bündeln statt einzeln nacheinander“, Wunsch Hansi „sorgfältig und vorsichtig“):
-- zwei häufige Lesewege in EINEM Datenbank-Aufruf statt mehreren nacheinander. Jeder Teil ist genau die bisherige Abfrage (gleiche Filter,
-- Grenzen, Reihenfolge) – der Server rechnet daraus wie bisher. Nur lesend; nur der Server (service_role) darf aufrufen.
-- Not-Aus ohne neue Version: kc_club_konfig 'online_paket' bzw. 'mahnung_paket' = {"aus": true} → Server nimmt den bisherigen Weg.
-- Rückweg: drop function public.kc_club_online_jetzt(timestamptz, text[]); drop function public.kc_club_nachricht_mahnung(text, jsonb, timestamptz);

-- Wer ist gerade online (onlineJetztMit): Zugang → Einstellungen der Online-Personen → Admins unter den Inkognito-Personen.
-- Vorher 2–3 Wege nacheinander, bei jedem Online-Takt (jedes offene Handy jede Minute).
create or replace function public.kc_club_online_jetzt(p_seit timestamptz, p_schluessel text[])
returns jsonb language sql stable set search_path = public as $$
  with ids as (
    select distinct z.person_id from kc_club_zugang z
     where z.aktiv = true and z.zuletzt_gesehen >= p_seit and z.person_id not like 'KC-P-TEST%'
  ), es as (
    select e.person_id, e.schluessel, e.wert from kc_club_person_einstellung e
     where e.schluessel = any (array['online', 'inkognito'] || coalesce(p_schluessel, '{}'::text[])) and e.person_id in (select person_id from ids)
  )
  select jsonb_build_object(
    'ids', coalesce((select jsonb_agg(person_id) from ids), '[]'::jsonb),
    'einst', coalesce((select jsonb_agg(jsonb_build_object('person_id', person_id, 'schluessel', schluessel, 'wert', wert)) from es), '[]'::jsonb),
    -- Inkognito gilt nur, solange die Person Admin ist (wie bisher: nur für Personen mit inkognito.an = true)
    'inko', coalesce((select jsonb_agg(r.person_id) from kc_club_rollen r where r.ist_admin = true
       and r.person_id in (select person_id from es where schluessel = 'inkognito' and wert -> 'an' = 'true'::jsonb)), '[]'::jsonb)
  )
$$;
revoke all on function public.kc_club_online_jetzt(timestamptz, text[]) from public, anon, authenticated;
grant execute on function public.kc_club_online_jetzt(timestamptz, text[]) to service_role;

-- Nachrichten-Mahnung beim Start (pMahnung): bisher EINE Abfrage je ungelesenem Chat (bis zu 40) + eine für „wichtig“.
-- p_threads = die Chats in der Reihenfolge des Servers: [{"t": thread_id, "lr": last_read_at|null}, …] (höchstens 40).
-- Je Chat wie bisher: Nachrichten anderer nach „gelesen bis“, älteste zuerst, höchstens 100; davon die ersten 300 (Chat-Reihenfolge) für „wichtig“.
create or replace function public.kc_club_nachricht_mahnung(p_person text, p_threads jsonb, p_grenze timestamptz)
returns jsonb language sql stable set search_path = public as $$
  with th as (
    select (x ->> 't')::uuid as thread_id, nullif(x ->> 'lr', '')::timestamptz as lr, o as nr
      from jsonb_array_elements(coalesce(p_threads, '[]'::jsonb)) with ordinality as a(x, o)
     where o <= 40
  ), m as (
    select th.nr, mm.id, mm.created_at, mm.rn
      from th cross join lateral (
        select msg.id, msg.created_at, row_number() over (order by msg.created_at) as rn from kc_communication_messages msg
         where msg.thread_id = th.thread_id and msg.sender_person_id <> p_person and (th.lr is null or msg.created_at > th.lr)
         order by msg.created_at limit 100
      ) mm
  ), erste as (
    select id from m order by nr, rn limit 300
  )
  select jsonb_build_object(
    'alt', (select count(*) from m where created_at < p_grenze),
    'wichtig', (select count(*) from kc_club_nachricht_wichtig w where w.message_id in (select id from erste))
  )
$$;
revoke all on function public.kc_club_nachricht_mahnung(text, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.kc_club_nachricht_mahnung(text, jsonb, timestamptz) to service_role;
