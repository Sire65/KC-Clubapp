-- 2.829.0 KC-CLUB-NUTZUNG-ALLE (Wunsch #73 Hansi „Übersicht mit Grafiken: wann die App am meisten genutzt wird, an welchen Tagen, um welche Uhrzeit,
-- wie viel Push, E-Mail und Nachrichten verschickt wurden … allen Mitgliedern zur Verfügung stellen, nicht zu technisch, aber aussagekräftig“).
-- Nur Summen – nie Personen, nie Inhalte: Öffnungen/Bereiche/Stunden (schon anonym gezählt), aktive Mitglieder je Tag (nur Anzahl), Nachrichten/Push/
-- E-Mail je Tag (nur Anzahl), Geräte-Arten (Anteil der Starts), Stand der App-Version (nur Anzahl). Aufruf nur über den Server (service_role).
-- Rückweg: drop function public.kc_club_app_statistik(int, text);
create or replace function public.kc_club_app_statistik(p_tage int, p_version text)
returns jsonb language sql stable security definer set search_path = public as $$
  with g as (select greatest(1, least(90, coalesce(p_tage, 30))) t),
  b as (select (now() at time zone 'Europe/Berlin')::date heute, t from g),
  z as (select heute - (t - 1) von, heute bis, heute - (2 * t - 1) von2, heute - t bis2, t from b),
  tage as (select d::date tag from z, generate_series(z.von, z.bis, interval '1 day') d),
  st as (select (zeit at time zone 'Europe/Berlin')::date tag, person_id, details from kc_club_protokoll, z
         where aktion = 'app_start' and zeit >= (z.von2::timestamp at time zone 'Europe/Berlin')),
  ms as (select (created_at at time zone 'Europe/Berlin')::date tag from kc_communication_messages, z where created_at >= (z.von2::timestamp at time zone 'Europe/Berlin')),
  rq as (select (created_at at time zone 'Europe/Berlin')::date tag, channel from kc_communication_requests, z
         where source_program = 'kc-club' and channel in ('push', 'email') and created_at >= (z.von2::timestamp at time zone 'Europe/Berlin')),
  nz as (select tag, bereich, anzahl from kc_club_nutzung, z where tag >= z.von2 and bereich not like 'hs\_%')
  select jsonb_build_object(
    'tage', (select t from z), 'von', (select von from z),
    'jeTag', (select jsonb_agg(jsonb_build_object('tag', tage.tag,
        'oeffnungen', (select coalesce(sum(anzahl), 0) from nz where nz.tag = tage.tag),
        'aktive', (select count(distinct person_id) from st where st.tag = tage.tag),
        'nachrichten', (select count(*) from ms where ms.tag = tage.tag),
        'push', (select count(*) from rq where rq.tag = tage.tag and channel = 'push'),
        'email', (select count(*) from rq where rq.tag = tage.tag and channel = 'email')) order by tage.tag) from tage),
    'bereiche', (select jsonb_object_agg(bereich, n) from (select bereich, sum(anzahl) n from nz, z where nz.tag >= z.von group by bereich) x),
    'wochenStunden', (select jsonb_agg(jsonb_build_array(w, stunde, n)) from (select extract(isodow from s.tag)::int w, s.stunde, sum(s.anzahl)::int n
        from kc_club_nutzung_stunden s, z where s.tag >= z.von group by 1, 2) x),
    'geraete', (select jsonb_object_agg(art, n) from (select case when details->>'system' ilike 'android%' then 'android' when details->>'system' ilike 'ios%' then 'iphone'
        when details->>'system' ilike 'win%' or details->>'system' ilike 'mac%' or details->>'system' ilike 'linux%' then 'pc' else 'sonst' end
        || case when details->>'app' = 'true' then '_app' else '_browser' end art, count(*) n from st, z where st.tag >= z.von group by 1) x),
    'version', (select jsonb_build_object('aktiv', count(*), 'aktuell', count(*) filter (where app_version = p_version)) from kc_club_zugang, z
        where aktiv and zuletzt_gesehen >= (z.von::timestamp at time zone 'Europe/Berlin')),
    'vergleich', jsonb_build_object(
      'jetzt', (select jsonb_build_object('oeffnungen', (select coalesce(sum(anzahl), 0) from nz where nz.tag >= z.von), 'aktive', (select count(distinct person_id) from st where st.tag >= z.von),
        'nachrichten', (select count(*) from ms where ms.tag >= z.von), 'versand', (select count(*) from rq where rq.tag >= z.von)) from z),
      'vorher', (select jsonb_build_object('oeffnungen', (select coalesce(sum(anzahl), 0) from nz where nz.tag between z.von2 and z.bis2), 'aktive', (select count(distinct person_id) from st where st.tag between z.von2 and z.bis2),
        'nachrichten', (select count(*) from ms where ms.tag between z.von2 and z.bis2), 'versand', (select count(*) from rq where rq.tag between z.von2 and z.bis2)) from z)));
$$;
revoke all on function public.kc_club_app_statistik(int, text) from public, anon, authenticated;
grant execute on function public.kc_club_app_statistik(int, text) to service_role;
