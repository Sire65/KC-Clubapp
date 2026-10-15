-- KC-CLUB-RT-KANAL-WECHSEL (2.426.0, Wunsch Hansi nach dem Generalcheck): der Name der „direkten Leitung“ je Person wechselt,
-- sobald sich am Zugang etwas ändert (neuer Link, vorgemerkter Link übernommen, andere Geräte abgemeldet, Zugang beendet, Sperre).
-- Vorher war er für immer gleich: ein altes Handy oder ein entfernter Gast hätte weiter mitbekommen, WANN jemand Nachrichten/Anrufe
-- bekommt (nie Inhalte). Jetzt: Kanal = HMAC(Geheimnis, person_id + ":" + Zählnummer). Zählnummer 0 = genau der bisherige Name
-- (laufende Geräte merken nichts); erst der nächste Wechsel gibt einen neuen Namen, den die eigenen Geräte beim nächsten Abruf bekommen.
-- Rückweg: Funktion kc_club_rt_kanal aus 20261011_kc_club_v2226_realtime.sql einspielen, kc_club_rt_neu und Spalte rt_epoche löschen.

alter table public.kc_club_zugang add column if not exists rt_epoche integer not null default 0;

create or replace function public.kc_club_rt_kanal(p_person text) returns text
language sql stable security definer set search_path = '' as $$
  select 'kc-club-' || left(encode(extensions.hmac(
    p_person || coalesce(':' || nullif((select z.rt_epoche from public.kc_club_zugang z where z.person_id = p_person), 0)::text, ''),
    (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_rt_geheimnis'), 'sha256'), 'hex'), 32)
$$;
revoke all on function public.kc_club_rt_kanal(text) from public, anon, authenticated;
grant execute on function public.kc_club_rt_kanal(text) to service_role;

-- neuer Kanalname für eine Person (Server ruft das bei jeder Zugangsänderung auf)
create or replace function public.kc_club_rt_neu(p_person text) returns void
language sql security definer set search_path = '' as $$
  update public.kc_club_zugang set rt_epoche = rt_epoche + 1 where person_id = p_person
$$;
revoke all on function public.kc_club_rt_neu(text) from public, anon, authenticated;
grant execute on function public.kc_club_rt_neu(text) to service_role;
