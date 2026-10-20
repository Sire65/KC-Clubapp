-- KC-CLUB-CHAT-STAND (2.510.0, Wunsch Hansi „Ja Bau das jetzt“ – Chat sparsamer, Schritt 3): Fingerabdruck eines Chats in EINER Abfrage.
-- Der offene Chat fragt im Takt erst nur diesen Fingerabdruck ab und lädt den Chat (~34 Abfragen) nur dann ganz, wenn er sich geändert hat.
-- Er umfasst alles, was die Aktion „unterhaltung“ (supabase/functions/kc-club/index.ts) für die Person p_person anzeigt: Nachrichten (Text,
-- Antwort-Bezug), Teilnehmer und deren „gelesen bis“ (das EIGENE zählt nicht – es wird beim Laden selbst weitergesetzt), für mich ausgeblendete,
-- Selbstlöschen (Ablauf, auch durch Zeitablauf), Anlagen und Einmal-Fotos, Sende-Effekte, Zustellung meiner Nachrichten (Push/Mail), „angekommen“
-- über „zuletzt gesehen“ der anderen, Inkognito, Reaktionen, Erwähnungen, Bearbeitet, Angeheftet, Gemerkt, Umfragen und Stimmen, Kontakte,
-- Wichtig, Link-Vorschau, Express (Antworten, Zustellung, Push-Anzeige), Gruppe, Tippen/Sprechen/Entwurf, Bearbeiten-Frist, „online / zuletzt da“
-- des Gegenübers, meine geplanten Nachrichten, Chat-Betreff. Was hier fehlt (Namen, „Daraus eine Gruppe machen?“), holt die App spätestens alle 5 Min.
-- Gibt NULL zurück, wenn p_person nicht im Chat ist. Nur lesend; nur der Server (service_role) darf sie aufrufen.
-- Zeitgrenzen kommen vom Server (eine Stelle): p_online_sek (ONLINE_SEK), p_zuletzt_tage (ZULETZT_TAGE), p_einmal_tage (EINMAL_TAGE), p_bearbeiten_min (BEARBEITEN_MIN).
-- Rückweg: App 2.509.0 / Server 2.508.0 einspielen; drop function public.kc_club_chat_stand(uuid, text, timestamptz, integer, integer, integer, integer);
create or replace function public.kc_club_chat_stand(p_thread uuid, p_person text, p_jetzt timestamptz,
  p_online_sek integer, p_zuletzt_tage integer, p_einmal_tage integer, p_bearbeiten_min integer)
returns text
language sql
stable
set search_path = public
as $$
  with tn as (
    select t.person_id, t.last_read_at from public.kc_communication_thread_participants t where t.thread_id = p_thread
  ), m as (
    select x.id, x.sender_person_id, x.body, x.reply_to_message_id, x.created_at from public.kc_communication_messages x
     where x.thread_id = p_thread order by x.created_at limit 500
  ), eig as (
    select m.id, m.created_at from m where m.sender_person_id = p_person
  ), andere as (
    select tn.person_id from tn where tn.person_id <> p_person
  ), ma as (
    select x.message_id, x.attachment_id from public.kc_communication_message_attachments x where x.message_id in (select id from m)
  ), req as (
    select r.id, r.correlation_id, r.channel, r.status, r.recipient_refs from public.kc_communication_requests r
     where r.correlation_id in (select 'club-nachricht:' || e.id from eig e union all select 'club-nachricht:' || e.id || ':push' from eig e)
  ), partner as (
    select a.person_id from andere a where (select count(*) from andere) = 1
  )
  select case when not exists (select 1 from tn where tn.person_id = p_person) then null else md5(concat_ws('|',
    coalesce((select th.subject from public.kc_communication_threads th where th.id = p_thread), '-'),
    coalesce((select string_agg(m.id::text || ':' || m.sender_person_id || ':' || md5(coalesce(m.body, '')) || ':' || coalesce(m.reply_to_message_id::text, '') || ':' || m.created_at::text, ',' order by m.created_at, m.id) from m), '-'),
    coalesce((select string_agg(tn.person_id || ':' || case when tn.person_id = p_person then '' else coalesce(tn.last_read_at::text, '') end, ',' order by tn.person_id) from tn), '-'),
    coalesce((select string_agg(h.message_id::text, ',' order by h.message_id) from public.kc_communication_message_hidden h where h.person_id = p_person and h.message_id in (select id from m)), '-'),
    coalesce((select string_agg(a.message_id::text || ':' || a.loescht_am::text || ':' || (a.loescht_am <= p_jetzt)::text, ',' order by a.message_id) from public.kc_club_nachricht_ablauf a where a.message_id in (select id from m)), '-'),
    coalesce((select s.stunden::text from public.kc_club_chat_selbstloeschen s where s.thread_id = p_thread), '-'),
    coalesce((select string_agg(ma.message_id::text || ':' || ma.attachment_id::text || ':' || coalesce(at.file_name, '') || ':' || coalesce(at.mime_type, '') || ':' || coalesce(at.size_bytes::text, ''), ',' order by ma.message_id, ma.attachment_id)
                from ma left join public.kc_communication_attachments at on at.id = ma.attachment_id), '-'),
    coalesce((select string_agg(e.attachment_id::text || ':' || e.absender || ':' || coalesce(e.entfernt_am::text, '') || ':' || (p_jetzt - e.erstellt_am > make_interval(days => p_einmal_tage))::text, ',' order by e.attachment_id)
                from public.kc_club_einmal_foto e where e.attachment_id in (select attachment_id from ma)), '-'),
    coalesce((select string_agg(g.attachment_id::text || ':' || g.person_id || ':' || coalesce(g.gesehen_am::text, ''), ',' order by g.attachment_id, g.person_id)
                from public.kc_club_einmal_foto_gesehen g where g.attachment_id in (select attachment_id from ma)), '-'),
    coalesce((select string_agg(pe.person_id || ':' || pe.schluessel || ':' || coalesce(pe.wert::text, ''), ',' order by pe.person_id, pe.schluessel)
                from public.kc_club_person_einstellung pe where pe.schluessel in ('sende_effekt', 'inkognito', 'online', 'zuletzt') and pe.person_id in (select person_id from tn)), '-'),
    coalesce((select string_agg(ro.person_id || ':' || coalesce(ro.ist_admin, false)::text || ':' || coalesce(ro.ist_vorstand, false)::text, ',' order by ro.person_id)
                from public.kc_club_rollen ro where ro.person_id in (select person_id from tn)), '-'),
    coalesce((select string_agg(req.id::text || ':' || coalesce(req.channel, '') || ':' || coalesce(req.status, '') || ':' || coalesce(req.recipient_refs::text, ''), ',' order by req.id) from req), '-'),
    -- „angekommen“ über „zuletzt gesehen“: je anderem Teilnehmer die jüngste eigene Nachricht, die er danach noch gesehen hat
    coalesce((select string_agg(z.person_id || ':' || coalesce((select max(e.created_at) from eig e where e.created_at <= z.zuletzt_gesehen)::text, ''), ',' order by z.person_id)
                from public.kc_club_zugang z where z.person_id in (select person_id from andere) and z.zuletzt_gesehen is not null), '-'),
    coalesce((select string_agg(r.message_id::text || ':' || r.person_id || ':' || r.emoji, ',' order by r.message_id, r.person_id, r.emoji) from public.kc_club_reaktionen r where r.message_id in (select id from m)), '-'),
    coalesce((select string_agg(w.message_id::text || ':' || w.person_id, ',' order by w.message_id, w.person_id) from public.kc_club_erwaehnungen w where w.message_id in (select id from m)), '-'),
    coalesce((select string_agg(b.message_id::text || ':' || coalesce(b.bearbeitet_am::text, ''), ',' order by b.message_id) from public.kc_club_nachricht_bearbeitet b where b.message_id in (select id from m)), '-'),
    coalesce((select string_agg(an.message_id::text || ':' || coalesce(an.am::text, ''), ',' order by an.message_id) from public.kc_club_angeheftet an where an.thread_id = p_thread), '-'),
    coalesce((select string_agg(gm.message_id::text, ',' order by gm.message_id) from public.kc_club_gemerkt gm where gm.person_id = p_person and gm.message_id in (select id from m)), '-'),
    coalesce((select string_agg(u.message_id::text || ':' || md5(coalesce(u.frage, '') || coalesce(u.optionen::text, '')) || ':' || coalesce(u.mehrfach, false)::text, ',' order by u.message_id) from public.kc_club_chat_umfrage u where u.message_id in (select id from m)), '-'),
    coalesce((select string_agg(st.message_id::text || ':' || st.person_id || ':' || coalesce(st.option::text, ''), ',' order by st.message_id, st.person_id, st.option) from public.kc_club_chat_stimme st where st.message_id in (select id from m)), '-'),
    coalesce((select string_agg(k.message_id::text || ':' || k.person_id, ',' order by k.message_id, k.person_id) from public.kc_club_chat_kontakt k where k.message_id in (select id from m)), '-'),
    coalesce((select string_agg(wi.message_id::text, ',' order by wi.message_id) from public.kc_club_nachricht_wichtig wi where wi.message_id in (select id from m)), '-'),
    coalesce((select string_agg(lv.message_id::text || ':' || md5(coalesce(lv.url, '') || coalesce(lv.titel, '') || coalesce(lv.text, '') || coalesce(lv.bild, '') || coalesce(lv.seite, '')), ',' order by lv.message_id) from public.kc_club_link_vorschau lv where lv.message_id in (select id from m)), '-'),
    coalesce((select string_agg(ex.message_id::text, ',' order by ex.message_id) from public.kc_club_express ex where ex.message_id in (select id from m)), '-'),
    coalesce((select string_agg(ea.message_id::text || ':' || ea.person_id || ':' || ea.bestaetigt_am::text, ',' order by ea.message_id, ea.person_id) from public.kc_club_express_antwort ea where ea.message_id in (select id from m) and ea.bestaetigt_am is not null), '-'),
    coalesce((select string_agg(ez.message_id::text || ':' || ez.person_id || ':' || coalesce(ez.angekommen_am::text, '') || ':' || coalesce(ez.gelesen_am::text, ''), ',' order by ez.message_id, ez.person_id) from public.kc_club_express_zustellung ez where ez.message_id in (select id from eig)), '-'),
    coalesce((select count(*)::text || ':' || coalesce(max(de.created_at)::text, '') from public.kc_communication_delivery_events de where de.request_id in (select id from req) and de.event_type in ('displayed', 'opened')), '-'),
    coalesce((select coalesce(gr.name, '') || ':' || coalesce(gr.symbol, '') || ':' || coalesce(gr.erstellt_von, '') || ':' || coalesce(gr.admins::text, '') from public.kc_club_gruppen gr where gr.thread_id = p_thread), '-'),
    coalesce((select string_agg(tp.person_id || ':' || coalesce(tp.art, '') || ':' || coalesce(tp.text, ''), ',' order by tp.person_id) from public.kc_club_tippen tp where tp.thread_id = p_thread and tp.person_id <> p_person and tp.bis > p_jetzt), '-'),
    -- Bearbeiten-Frist eigener Nachrichten läuft mit der Zeit ab
    (select count(*)::text from eig where eig.created_at > p_jetzt - make_interval(mins => p_bearbeiten_min)),
    -- „online / zuletzt da“ des Gegenübers im Einzelchat (gleiche Grenzen wie zuletztDaMap): online, seit wann; sonst Minute und Tag
    coalesce((select string_agg(z.person_id || ':' || case
                 when z.zuletzt_gesehen < p_jetzt - make_interval(days => p_zuletzt_tage) then 'lange'
                 when p_jetzt - z.zuletzt_gesehen < make_interval(secs => p_online_sek) then 'on:' || coalesce((select coalesce(os.wert->>'seit', '') || ':' || coalesce((case when os.wert->>'zuletzt' ~ '^\d{4}-\d\d-\d\dT\d\d:\d\d'
                   then (os.wert->>'zuletzt')::timestamptz > p_jetzt - make_interval(secs => p_online_sek) end)::text, '')
                   from public.kc_club_person_einstellung os where os.person_id = z.person_id and os.schluessel = 'online_seit'), '')
                 else 'aus:' || date_trunc('minute', z.zuletzt_gesehen)::text || ':' || ((z.zuletzt_gesehen at time zone 'Europe/Berlin')::date = (p_jetzt at time zone 'Europe/Berlin')::date)::text end, ',')
                from public.kc_club_zugang z where z.person_id in (select person_id from partner)), '-'),
    coalesce((select string_agg(gp.id::text || ':' || coalesce(gp.senden_um::text, '') || ':' || coalesce(gp.geaendert_am::text, '') || ':' || md5(coalesce(gp.text, '')), ',' order by gp.id)
                from public.kc_club_geplant gp where gp.person_id = p_person and gp.thread_id = p_thread and gp.status = 'offen'), '-')
  )) end;
$$;
revoke all on function public.kc_club_chat_stand(uuid, text, timestamptz, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.kc_club_chat_stand(uuid, text, timestamptz, integer, integer, integer, integer) to service_role;
