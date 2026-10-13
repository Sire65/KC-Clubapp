-- KC-CORE-SPIEGEL-NACHHOLEN (13.10.2026, Wunsch Hansi nach dem roten System-Check 09:30): Fällt beim regulären Spiegellauf (alle 6 Std.)
-- eine einzelne Tabelle aus (13.10. 08:10: kc_club_protokoll – ein Aufruf des Spiegel-Arbeiters brach nach 16 s mit 500 ab, 248/249 ok),
-- blieb sie bis zum nächsten Lauf 6 Std. alt und der Wächter meldete nach 6½ Std. ROT. Jetzt holt der Wächter verpasste Tabellen selbst nach:
--   * nur Tabellen mit mirror_enabled, deren letzter erfolgreicher Spiegel älter ist als der jüngste reguläre Lauf (= diesen verpasst haben);
--     regulärer Lauf = Welle mit mindestens der Hälfte aller Tabellen (einzelne Nachstöße zählen nicht)
--   * frühestens 15 Min. nach Beginn des jüngsten Laufs (der darf erst fertig werden), höchstens 10 Tabellen je Durchgang
--   * höchstens 2 Versuche je Tabelle in 6 Std. (gezählt im Audit) – danach meldet der Wächter wie bisher, nichts schaukelt sich auf
--   * im Normalfall (nichts verpasst) passiert nichts – Neon wird nicht zusätzlich geweckt
-- Nutzt den vorhandenen Weg kc_db_mirror_dispatch (wie „🪞 Spiegel jetzt anstoßen“). Liest und schreibt keine Club-Daten.
-- Rückweg: select cron.unschedule('kc-db-mirror-nachholen'); drop function kc_internal.kc_db_mirror_nachholen();
create or replace function kc_internal.kc_db_mirror_nachholen()
returns integer
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'kc_internal'
as $function$
declare
  v_zyklus timestamptz;
  v_tabellen text[];
begin
  -- Beginn des jüngsten REGULÄREN Laufs = jüngste „Welle“ (30-Min.-Fenster) mit mindestens der Hälfte aller Tabellen (mind. 20).
  -- Einzelne Nachstöße (Admin-Knopf, dieses Nachholen) zählen NICHT als Lauf – sonst sähe alles andere „verpasst“ aus (Trockenprobe 13.10.).
  select min(x.started_at) into v_zyklus
  from public.kc_db_mirror_runs x,
       (select max(w.w) as w from (select date_bin('30 minutes', started_at, timestamptz '2000-01-01') as w, count(*) as n
                                     from public.kc_db_mirror_runs where run_type = 'snapshot' and started_at > now() - interval '7 hours' group by 1) w
         where w.n >= greatest(20, (select count(*) from public.kc_db_mirror_table_rules where mirror_enabled) / 2)) welle
  where x.run_type = 'snapshot' and x.started_at >= welle.w and x.started_at < welle.w + interval '30 minutes';
  if v_zyklus is null or v_zyklus > now() - interval '15 minutes' then return 0; end if;

  select coalesce(array_agg(t.table_name order by t.table_name), '{}') into v_tabellen
  from (
    select r.table_name
    from public.kc_db_mirror_table_rules r
    left join lateral (
      select max(finished_at) as ok_am from public.kc_db_mirror_runs x
       where x.run_type = 'snapshot' and x.status = 'ok' and coalesce(x.mismatch_count, 0) = 0 and x.metrics->>'table' = r.table_name
         and x.started_at > now() - interval '14 days'
    ) s on true
    where r.mirror_enabled
      and r.updated_at < v_zyklus                                   -- neue Tabellen nimmt weiter die automatische Aufnahme
      and (s.ok_am is null or s.ok_am < v_zyklus - interval '5 minutes')
      and (select count(*) from public.kc_db_mirror_audit a
            where a.action = 'mirror_nachholen' and a.happened_at > now() - interval '6 hours'
              and a.metadata->'tabellen' ? r.table_name) < 2
    order by s.ok_am nulls first
    limit 10
  ) t;

  if cardinality(v_tabellen) = 0 then return 0; end if;
  perform public.kc_db_mirror_dispatch(v_tabellen);
  insert into public.kc_db_mirror_audit(severity, action, detail, metadata)
  values ('info', 'mirror_nachholen', format('Spiegel-Nachholen: %s Tabelle(n) haben den Lauf um %s verpasst und werden nachgeholt: %s',
          cardinality(v_tabellen), to_char(v_zyklus at time zone 'Europe/Berlin', 'DD.MM. HH24:MI'), array_to_string(v_tabellen, ', ')),
          jsonb_build_object('tabellen', to_jsonb(v_tabellen), 'zyklus', v_zyklus));
  return cardinality(v_tabellen);
end $function$;
revoke all on function kc_internal.kc_db_mirror_nachholen() from public, anon, authenticated;

select cron.unschedule('kc-db-mirror-nachholen') where exists (select 1 from cron.job where jobname = 'kc-db-mirror-nachholen');
select cron.schedule('kc-db-mirror-nachholen', '25,55 * * * *', 'select kc_internal.kc_db_mirror_nachholen()');
