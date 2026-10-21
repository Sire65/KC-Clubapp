-- 2.578.0 KC-CLUB-CHAT-PAKET (Fund Hansi „das Laden der Daten in einem Chat dauert, bis die Nachrichten erscheinen“; Wahl Hansi „so bauen,
-- schön vorsichtig, damit alles lauffähig bleibt“): Beim Öffnen eines Chats fragte der Server die Datenbank ~28-mal NACHEINANDER
-- (Nachrichten, Anlagen, Einmal-Fotos, Haken, Reaktionen, Umfragen, Express …) – gemessen 1,5–2,7 s. Hier dieselben Rohdaten in EINEM
-- Aufruf. Jeder Teil ist genau die bisherige Abfrage (gleiche Spalten, Filter, Bedingungen); der Server rechnet daraus wie bisher.
-- Der Fingerabdruck (kc_club_chat_stand) wird im selben Lese-Stand berechnet – wie bisher „vor dem Lesen“, jetzt sogar exakt gleichzeitig.
-- Nur lesend; nur der Server (service_role) darf aufrufen. Not-Aus ohne neue Version: kc_club_konfig 'chat_paket' = {"aus": true}.
-- Rückweg: drop function public.kc_club_unterhaltung_paket(uuid, text, timestamptz, integer, integer, integer, integer);
create or replace function public.kc_club_unterhaltung_paket(p_thread uuid, p_person text, p_jetzt timestamptz, p_online_sek integer,
  p_zuletzt_tage integer, p_einmal_tage integer, p_bearbeiten_min integer)
returns jsonb language plpgsql stable set search_path = public as $$
declare
  v_alle uuid[]; v_weg uuid[]; v_mids uuid[]; v_aids uuid[]; v_einm uuid[]; v_tn text[]; v_andere text[]; v_eigen uuid[]; v_kor text[];
  v_zg jsonb; v_zgids text[]; v_inko text[]; v_ex uuid[]; v_exeigen uuid[]; v_auftr jsonb; v_expush uuid[]; v_msgs jsonb;
begin
  -- Nachrichten (die ältesten 500, wie bisher order(created_at).limit(500))
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at), '[]'::jsonb), coalesce(array_agg(x.id), '{}')
    into v_msgs, v_alle
    from (select id, sender_person_id, body, created_at, reply_to_message_id from kc_communication_messages
          where thread_id = p_thread order by created_at limit 500) x;
  -- „nur für mich gelöscht“ + Ablaufzeiten (Selbstlöschen); abgelaufene nie zeigen
  select coalesce(array_agg(message_id), '{}') into v_weg from kc_communication_message_hidden where person_id = p_person and message_id = any(v_alle);
  select coalesce(array_agg(m), '{}') into v_mids from unnest(v_alle) m
    where not (m = any(v_weg)) and not exists (select 1 from kc_club_nachricht_ablauf a where a.message_id = m and a.loescht_am <= p_jetzt);
  select coalesce(array_agg(attachment_id), '{}') into v_aids from kc_communication_message_attachments where message_id = any(v_mids);
  select coalesce(array_agg(attachment_id), '{}') into v_einm from kc_club_einmal_foto where attachment_id = any(v_aids);
  select coalesce(array_agg(person_id), '{}') into v_tn from kc_communication_thread_participants where thread_id = p_thread;
  v_andere := array(select x from unnest(v_tn) x where x <> p_person);
  -- meine letzten 60 Nachrichten (für Zustellung/Haken)
  v_eigen := array(select id from (select id, created_at from kc_communication_messages where id = any(v_mids) and sender_person_id = p_person
    order by created_at desc limit 60) e);
  v_kor := array(select 'club-nachricht:' || e || s from unnest(v_eigen) e, unnest(array['', ':push']) s);
  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_auftr
    from (select id, correlation_id, channel, status, recipient_refs from kc_communication_requests where correlation_id = any(v_kor)) x;
  -- wann waren die anderen zuletzt da (nur wenn ich eigene Nachrichten habe) + Inkognito-Admins darunter
  if cardinality(v_eigen) > 0 and cardinality(v_andere) > 0 then
    select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb), coalesce(array_agg(x.person_id), '{}') into v_zg, v_zgids
      from (select person_id, zuletzt_gesehen from kc_club_zugang where person_id = any(v_andere) and zuletzt_gesehen is not null) x;
  else v_zg := '[]'::jsonb; v_zgids := '{}'; end if;
  v_inko := array(select distinct e.person_id from kc_club_person_einstellung e join kc_club_rollen r on r.person_id = e.person_id and r.ist_admin = true
    where e.schluessel = 'inkognito' and e.person_id = any(v_zgids) and e.wert -> 'an' = 'true'::jsonb);
  -- Express
  select coalesce(array_agg(message_id), '{}') into v_ex from kc_club_express where message_id = any(v_mids);
  v_exeigen := array(select id from kc_communication_messages where id = any(v_ex) and id = any(v_mids) and sender_person_id = p_person);
  v_expush := array(select (a ->> 'id')::uuid from jsonb_array_elements(v_auftr) a
    where a ->> 'channel' = 'push' and a ->> 'status' in ('displayed', 'opened') and split_part(a ->> 'correlation_id', ':', 2) = any(v_exeigen::text[]));
  return jsonb_build_object(
    'stand', kc_club_chat_stand(p_thread, p_person, p_jetzt, p_online_sek, p_zuletzt_tage, p_einmal_tage, p_bearbeiten_min),
    't', (select to_jsonb(x) from (select id, subject, created_by_person_id from kc_communication_threads where id = p_thread) x),
    'tn', coalesce((select jsonb_agg(to_jsonb(x)) from (select person_id, last_read_at from kc_communication_thread_participants where thread_id = p_thread) x), '[]'::jsonb),
    'msgs', v_msgs,
    'weg', to_jsonb(v_weg),
    'ablauf', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, loescht_am from kc_club_nachricht_ablauf where message_id = any(v_alle)) x), '[]'::jsonb),
    'sl', (select to_jsonb(x) from (select stunden from kc_club_chat_selbstloeschen where thread_id = p_thread limit 1) x),
    'ma', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, attachment_id from kc_communication_message_attachments where message_id = any(v_mids)) x), '[]'::jsonb),
    'att', coalesce((select jsonb_agg(to_jsonb(x)) from (select id, file_name, mime_type, size_bytes from kc_communication_attachments where id = any(v_aids)) x), '[]'::jsonb),
    'einm', coalesce((select jsonb_agg(to_jsonb(e)) from kc_club_einmal_foto e where e.attachment_id = any(v_aids)), '[]'::jsonb),
    'einmGes', coalesce((select jsonb_agg(to_jsonb(x)) from (select attachment_id, person_id, gesehen_am from kc_club_einmal_foto_gesehen where attachment_id = any(v_einm)) x), '[]'::jsonb),
    'seE', coalesce((select jsonb_agg(to_jsonb(x)) from (select person_id, wert from kc_club_person_einstellung where schluessel = 'sende_effekt' and person_id = any(v_tn)) x), '[]'::jsonb),
    'auftr', v_auftr,
    'zg', v_zg,
    'inko', to_jsonb(v_inko),
    'rk', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, person_id, emoji from kc_club_reaktionen where message_id = any(v_mids)) x), '[]'::jsonb),
    'ew', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, person_id from kc_club_erwaehnungen where message_id = any(v_mids)) x), '[]'::jsonb),
    'bearb', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, bearbeitet_am from kc_club_nachricht_bearbeitet where message_id = any(v_mids)) x), '[]'::jsonb),
    -- angeheftet: wie bisher nur, wenn es Nachrichten gibt; neueste zuerst
    'pins', case when cardinality(v_mids) = 0 then '[]'::jsonb else coalesce((select jsonb_agg(to_jsonb(x) order by x.am desc) from (select message_id, am from kc_club_angeheftet where thread_id = p_thread) x), '[]'::jsonb) end,
    'gem', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id from kc_club_gemerkt where person_id = p_person and message_id = any(v_mids)) x), '[]'::jsonb),
    'umf', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, frage, optionen, mehrfach from kc_club_chat_umfrage where message_id = any(v_mids)) x), '[]'::jsonb),
    'stim', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, person_id, option from kc_club_chat_stimme where message_id = any(v_mids)) x), '[]'::jsonb),
    'kon', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, person_id from kc_club_chat_kontakt where message_id = any(v_mids)) x), '[]'::jsonb),
    'wicht', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id from kc_club_nachricht_wichtig where message_id = any(v_mids)) x), '[]'::jsonb),
    'lvs', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, url, titel, text, bild, seite from kc_club_link_vorschau where message_id = any(v_mids)) x), '[]'::jsonb),
    'ex', to_jsonb(v_ex),
    'exAnt', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, person_id, bestaetigt_am from kc_club_express_antwort where message_id = any(v_ex) and bestaetigt_am is not null) x), '[]'::jsonb),
    'exZu', coalesce((select jsonb_agg(to_jsonb(x)) from (select message_id, person_id, angekommen_am, gelesen_am from kc_club_express_zustellung where message_id = any(v_exeigen)) x), '[]'::jsonb),
    'exEv', coalesce((select jsonb_agg(to_jsonb(x)) from (select request_id, detail, created_at from kc_communication_delivery_events where request_id = any(v_expush) and event_type in ('displayed', 'opened')) x), '[]'::jsonb),
    'gr', (select to_jsonb(g) from kc_club_gruppen g where g.thread_id = p_thread limit 1),
    'tippen', coalesce((select jsonb_agg(to_jsonb(x)) from (select person_id, text, art from kc_club_tippen where thread_id = p_thread and person_id <> p_person and bis > p_jetzt) x), '[]'::jsonb)
  );
end $$;
revoke all on function public.kc_club_unterhaltung_paket(uuid, text, timestamptz, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.kc_club_unterhaltung_paket(uuid, text, timestamptz, integer, integer, integer, integer) to service_role;
