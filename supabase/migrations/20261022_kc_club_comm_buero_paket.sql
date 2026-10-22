-- 2.601.0 KC-CLUB-START-BUENDEL (Hansi: „Leg los – aber hinterher muss alles sauber und professionell laufen“, Ziel Start ~2 s):
-- Messung 22.10. (Server-Protokoll eines echten Starts): der Server schickte beim Start ~35 Datenbank-Anfragen GLEICHZEITIG los; im
-- Gedränge brauchte jede 100–350 ms statt 20–40 ms allein. Zwei Gruppen machten fast die Hälfte aus und werden hier zu je EINEM Aufruf:
--  • kc_club_comm_paket  – die 5 Lesungen der Communicator-Ampel (bisher commLesen: 5 Anfragen, für alle gleich)
--  • kc_club_buero_paket – die Büro-Eingangszahlen der Clubleitung (bisher bueroEingang: ~10 Anfragen)
-- Jeder Teil ist genau die bisherige Abfrage (gleiche Spalten, Filter, Grenzen); der Server rechnet daraus wie bisher.
-- Nur lesend, nur der Server (service_role) darf aufrufen. Not-Aus ohne neue Version: kc_club_konfig 'start_buendel' = {"aus": true}.
-- Rückweg: drop function public.kc_club_comm_paket(timestamptz, timestamptz, text[]); drop function public.kc_club_buero_paket(text, boolean, date, text, text);
create or replace function public.kc_club_comm_paket(p_seit7 timestamptz, p_seit24 timestamptz, p_fehler text[])
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'st', (select to_jsonb(x) from (select enabled, dispatch_enabled from kc_communication_settings where id = 'global') x),
    'wege', coalesce((select jsonb_agg(to_jsonb(x)) from (select channel, provider_id, role, enabled, health_status, last_success_at, last_failure_at, consecutive_failures
       from kc_communication_provider_routes where enabled = true and channel in ('push', 'email')) x), '[]'::jsonb),
    'bericht', (select to_jsonb(x) from (select created_at, success_rate, avg_push_ms, avg_email_ms, queued, retrying, failed, active_devices
       from kc_communication_health_snapshots order by created_at desc limit 1) x),
    'auftr', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select status, channel, sent_at, created_at, error_code from kc_communication_requests
       where source_program = 'kc-club' and created_at >= p_seit7 order by created_at desc limit 500) x), '[]'::jsonb),
    'alle24', coalesce((select jsonb_agg(to_jsonb(x)) from (select status, error_code from kc_communication_requests
       where status = any(p_fehler) and created_at >= p_seit24 limit 500) x), '[]'::jsonb)
  );
$$;
create or replace function public.kc_club_buero_paket(p_person text, p_admin boolean, p_heute date, p_org text, p_event text)
returns jsonb language sql stable set search_path = public as $$
  with dw as (select id, revision from kc_dp_wish_inbox where org_id = p_org and event_id = p_event and source = 'club_app' limit 300)
  select jsonb_build_object(
    'ausleihen', (select count(*) from kc_club_ausleihen where status = 'angefragt'),
    'vorschlaege', (select count(*) from kc_club_vorschlaege where status = 'offen'),
    'hilfe', (select count(*) from kc_club_hilfe_aufrufe where geschlossen_am is null and datum >= p_heute),
    -- nur Einreichungen in Vereinsordnern (besitzer null) – wie bisher: Dokumente in Prüfung, deren Ordner keinen Besitzer hat
    'archiv', (select count(*) from kc_club_archiv_dokumente d where d.status = 'pruefung' and d.geloescht_am is null
       and d.ordner_id in (select o.id from kc_club_archiv_ordner o where o.besitzer is null)),
    'aufgaben', (select count(*) from kc_club_aufgaben where erledigt_am is null),
    'entwuerfe', (select count(*) from kc_club_sitzungsprotokolle where status = 'entwurf'),
    'ae', coalesce((select jsonb_agg(to_jsonb(x)) from (select id, status, art, empfaenger, kenntnis from kc_club_aenderungen
       where status = 'offen' and (p_admin or empfaenger @> array[p_person]) limit 200) x), '[]'::jsonb),
    'erst', (select count(*) from kc_club_erstattung where status = 'eingereicht'),
    'dw', coalesce((select jsonb_agg(to_jsonb(dw)) from dw), '[]'::jsonb),
    'ekst', coalesce((select jsonb_agg(to_jsonb(s)) from kc_club_eingang_stand s where s.art = 'dienstwunsch' and s.ref_id in (select id::text from dw)), '[]'::jsonb)
  );
$$;
revoke all on function public.kc_club_comm_paket(timestamptz, timestamptz, text[]) from public, anon, authenticated;
revoke all on function public.kc_club_buero_paket(text, boolean, date, text, text) from public, anon, authenticated;
grant execute on function public.kc_club_comm_paket(timestamptz, timestamptz, text[]) to service_role;
grant execute on function public.kc_club_buero_paket(text, boolean, date, text, text) to service_role;
