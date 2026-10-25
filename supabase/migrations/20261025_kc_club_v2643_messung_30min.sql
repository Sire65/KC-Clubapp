-- 2.643.0 KC-CLUB-MESSUNG-SPARSAM (Wunschliste #7, Wunsch Hansi „zu viele Datenbank-Zugriffe – optimieren“, Messung 25.10.: 85.000 Anfragen/Tag,
-- „DB-Last messen“ brauchte je Lauf über eine halbe Sekunde Rechenzeit): die beiden Club-Messungen laufen alle 30 statt alle 10 Minuten.
-- Die Messung in der Datenbank zählt die Hintergrund-Aufrufe jetzt über 30 Minuten (sonst fehlten 20 von 30 Minuten). Die Verlaufs-Grafik
-- (kleinster Abschnitt 30 Min.) und die Balkengrafik (je Stunde) bleiben vollständig. Zeitversetzt (:00/:30 und :15/:45), nie gleichzeitig.
-- Rückweg: Migrationen 20261013_kc_club_v2341_messwerte.sql und 20261014_kc_club_v2389_db_last.sql erneut einspielen (Zeitplan */10, Fenster 10 Min.).
create or replace function public.kc_club_messung_db()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.kc_club_messwerte (quelle, db_bytes, verbindungen, net_ok, net_fehler)
  select 'db', pg_database_size(current_database()),
    (select count(*) from pg_stat_activity where datname = current_database()),
    (select count(*) from net._http_response where created > now() - interval '30 minutes' and status_code between 100 and 499),
    (select count(*) from net._http_response where created > now() - interval '30 minutes' and (coalesce(timed_out, false) or status_code is null or status_code >= 500));
  delete from public.kc_club_messwerte where zeit < now() - interval '35 days';
end $function$;
revoke all on function public.kc_club_messung_db() from public, anon, authenticated;
grant execute on function public.kc_club_messung_db() to service_role;

select cron.unschedule('kc-club-messung-10min') where exists (select 1 from cron.job where jobname = 'kc-club-messung-10min');
select cron.unschedule('kc-club-messung-30min') where exists (select 1 from cron.job where jobname = 'kc-club-messung-30min');
select cron.schedule('kc-club-messung-30min', '0,30 * * * *', 'select public.kc_club_messung_db()');
select cron.unschedule('kc-club-db-last-10min') where exists (select 1 from cron.job where jobname = 'kc-club-db-last-10min');
select cron.unschedule('kc-club-db-last-30min') where exists (select 1 from cron.job where jobname = 'kc-club-db-last-30min');
select cron.schedule('kc-club-db-last-30min', '15,45 * * * *', 'select public.kc_club_db_last_messen()');
