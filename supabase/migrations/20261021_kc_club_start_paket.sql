-- 2.576.0 KC-CLUB-START-PAKET (Wunsch Hansi „App ist langsam – Vorsicht, nix kaputt machen, genau planen“): die kleinen persönlichen
-- Start-Abfragen (bisher ~18 einzelne Wege Server → Datenbank) in EINEM Aufruf. Jeder Teil ist genau die bisherige Abfrage (gleiche Spalten,
-- Filter, Sortierung, Grenzen) – der Server baut daraus dieselbe Antwort wie vorher. Nur lesend; nur der Server (service_role) darf aufrufen.
-- Not-Aus ohne neue Version: kc_club_konfig 'start_paket' = {"aus": true} → Server nimmt den bisherigen Weg.
-- Rückweg: drop function public.kc_club_start_paket(text, text, date);
create or replace function public.kc_club_start_paket(p_person text, p_org text, p_heute date)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    -- nächster eigener Dienst (veröffentlicht)
    'nd', coalesce((select jsonb_agg(to_jsonb(x)) from (select work_date, start_time, end_time, area from kc_dp_plan_published
      where org_id = p_org and status = 'published' and person_id = p_person and work_date >= p_heute order by work_date, start_time limit 1) x), '[]'::jsonb),
    -- Benachrichtigungs-Wahl + eigene E-Mail
    'wahl', coalesce((select jsonb_agg(to_jsonb(x)) from (select bereich, push, email from kc_club_benachrichtigung where person_id = p_person) x), '[]'::jsonb),
    'mail', (select to_jsonb(x) from (select email from kc_core_people where person_id = p_person limit 1) x),
    -- Freigaben, Einstellungen (ohne Bild-Verlauf)
    'frei', coalesce((select jsonb_agg(to_jsonb(x)) from (select bereich, erlaubt from kc_club_freigaben where person_id = p_person) x), '[]'::jsonb),
    'einst', coalesce((select jsonb_agg(to_jsonb(x)) from (select schluessel, wert from kc_club_person_einstellung where person_id = p_person and schluessel <> 'avatar_verlauf') x), '[]'::jsonb),
    -- Spiele, bei denen ich dran bin / angefragt
    'spiele', (select count(*) from kc_club_spiele where (status = 'laeuft' and dran = p_person) or (status = 'angefragt' and an = p_person)),
    -- Notfallkontakt, Kalender-Abo, Starttage (Einstieg), Feedback
    'notfall', (select to_jsonb(x) from (select name, telefon, beziehung from kc_club_notfall where person_id = p_person limit 1) x),
    'kabo', (select to_jsonb(x) from (select erstellt_am, zuletzt_abgerufen from kc_club_kalender_abo where person_id = p_person limit 1) x),
    'starts', coalesce((select jsonb_agg(to_jsonb(x)) from (select zeit from kc_club_protokoll where person_id = p_person and aktion = 'diagnose_start' order by zeit limit 1000) x), '[]'::jsonb),
    'feedback', (select count(*) from kc_club_feedback where person_id = p_person),
    -- offene Terminumfragen, bei denen ich noch nichts angekreuzt habe
    'termin', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'titel', u.titel)) from kc_club_terminumfragen u where u.status = 'offen'
      and not exists (select 1 from kc_club_terminumfrage_optionen o join kc_club_terminumfrage_antworten a on a.option_id = o.id where o.umfrage_id = u.id and a.person_id = p_person)), '[]'::jsonb),
    -- Eingangskorb: Dokumente anderer in meinen Ordnern, die auf mich warten
    'eingang', (select count(*) from kc_club_archiv_dokumente d where d.status = 'pruefung' and d.hochgeladen_von <> p_person
      and d.ordner_id in (select id from kc_club_archiv_ordner where besitzer = p_person and geloescht_am is null)),
    -- Aufgaben + Protokolle (Rohdaten wie bisher, der Server rechnet wie vorher)
    'au', coalesce((select jsonb_agg(to_jsonb(x)) from (select id, text, faellig, protokoll_id from kc_club_aufgaben where person_id = p_person and erledigt_am is null order by faellig asc nulls last limit 30) x), '[]'::jsonb),
    'pv', coalesce((select jsonb_agg(to_jsonb(x)) from (select id, status, version, titel, datum, veroeffentlicht_am from kc_club_sitzungsprotokolle where status = 'veroeffentlicht' and veroeffentlicht_am >= now() - interval '180 days') x), '[]'::jsonb),
    'ap', coalesce((select jsonb_agg(to_jsonb(x)) from (select s.id, s.status, s.titel from kc_club_sitzungsprotokolle s where s.id in (select protokoll_id from kc_club_aufgaben where person_id = p_person and erledigt_am is null and protokoll_id is not null)) x), '[]'::jsonb),
    'gl', coalesce((select jsonb_agg(to_jsonb(x)) from (select g.protokoll_id, g.version from kc_club_sitzungsprotokoll_gelesen g where g.person_id = p_person and g.protokoll_id in
      (select id from kc_club_sitzungsprotokolle where status = 'veroeffentlicht' and veroeffentlicht_am >= now() - interval '180 days')) x), '[]'::jsonb),
    -- offene Vorschläge + meine Stimmen bei offenen Abstimmungen
    'vor', coalesce((select jsonb_agg(to_jsonb(x)) from (select id, art, ziel_ids, erstellt_von, treffen_id from kc_club_vorschlaege where status = 'offen' limit 1000) x), '[]'::jsonb),
    'meinest', coalesce((select jsonb_agg(s.vorschlag_id) from kc_club_stimmen s join kc_club_vorschlaege v on v.id = s.vorschlag_id where s.person_id = p_person and v.status = 'offen' and v.art = 'abstimmung'), '[]'::jsonb)
  )
$$;
revoke all on function public.kc_club_start_paket(text, text, date) from public, anon, authenticated;
grant execute on function public.kc_club_start_paket(text, text, date) to service_role;
