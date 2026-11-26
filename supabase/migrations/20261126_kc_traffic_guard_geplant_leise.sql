-- KC-LASTWAECHTER-GEPLANT-LEISE (26.11.2026, Wunsch Hansi „ja umbauen“): Der Zeilen-Wächter (kc_traffic_guard_row_sample) schickte um 02:03 Berlin
-- „KRITISCHE Datenbanklast … 82741 Zeilen pro 15 Min. – vermutliche Ursache (geplant): Datensicherung“ aufs Handy. Die Frankfurt-Sicherung (01:00–03:00 UTC)
-- und die Neon-Nachtsicherung (00:35–01:00 UTC) lesen dabei planmäßig alle Tabellen; ebenso die Spiegel-Wellen (04/13/22 UTC :05–:45).
-- Neu: In diesen geplanten Fenstern wird die Stufe weiter gespeichert (sichtbar im Wächter/KC Check), aber KEINE Meldung verschickt –
-- außer die Menge ist extrem (≥ 300.000 Zeilen je 15 Min. = mehr als das Dreifache einer Sicherung): dann wird wie bisher gemeldet.
-- Sonst unverändert (wörtlich übernommen). Rückweg: Funktion aus dem Stand vor dieser Migration (ohne v_geplant) neu einspielen.
CREATE OR REPLACE FUNCTION public.kc_traffic_guard_row_sample()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  total_now bigint:=0;
  previous_sample record;
  base numeric;
  seconds_between numeric;
  rows_per_15m numeric;
  alarm text:='unknown';
  explanation text:='Messbasis fuer Ergebnismengen wird aufgebaut';
  inserted_id bigint;
  prev_alarm text;
  prev_sent timestamptz;
  should_send boolean:=false;
  v_hm int := (extract(hour FROM pg_catalog.timezone('UTC', pg_catalog.now()))::int * 100) + extract(minute FROM pg_catalog.timezone('UTC', pg_catalog.now()))::int;
  v_geplant boolean;
BEGIN
 -- geplante Fenster (UTC): Neon-Nachtsicherung + FRA-Sicherung 00:35–03:15, Spiegel-Wellen 04/13/22 :05–:50
 v_geplant := (v_hm BETWEEN 35 AND 315)
   OR (v_hm / 100 IN (4, 13, 22) AND v_hm % 100 BETWEEN 5 AND 50);
 SELECT coalesce(sum(s.rows),0)::bigint INTO total_now
 FROM extensions.pg_stat_statements s
 WHERE s.dbid=(SELECT d.oid FROM pg_catalog.pg_database d WHERE d.datname=pg_catalog.current_database());
 SELECT id,measured_at,total_rows,level INTO previous_sample
 FROM public.kc_traffic_guard_row_samples ORDER BY measured_at DESC,id DESC LIMIT 1;
 SELECT avg(z.rows_15m) INTO base
 FROM (SELECT t.rows_15m FROM public.kc_traffic_guard_row_samples t
       WHERE t.rows_15m IS NOT NULL AND t.measured_at>pg_catalog.now()-interval '24 hours'
       ORDER BY t.measured_at DESC LIMIT 96) z;
 IF previous_sample.id IS NOT NULL THEN
   seconds_between:=extract(epoch FROM (clock_timestamp()-previous_sample.measured_at));
   IF seconds_between BETWEEN 120 AND 3600 AND total_now>=previous_sample.total_rows THEN
      rows_per_15m:=round((total_now-previous_sample.total_rows)*900.0/seconds_between);
      alarm:='normal';
      explanation:='Ergebnismengen innerhalb des Vergleichsbereichs';
      IF rows_per_15m>=150000 OR (rows_per_15m>=35000 AND base>0 AND rows_per_15m>=base*5) THEN
         alarm:='critical';
      ELSIF rows_per_15m>=65000 OR (rows_per_15m>=15000 AND base>0 AND rows_per_15m>=base*3) THEN
         alarm:='warning';
      END IF;
      IF alarm IN ('warning','critical') THEN
         explanation:='Auffaellige SQL-Ergebnismenge: '||rows_per_15m::text||
           ' Zeilen pro 15 Min. (kein Supabase-Egress-Messwert)';
         IF v_geplant AND rows_per_15m < 300000 THEN
            explanation:=explanation||' – im Fenster der geplanten Sicherung/Spiegelung, keine Meldung';
         END IF;
      END IF;
   ELSE
      explanation:='Messabstand zu kurz/lang oder Statistiken zurueckgesetzt';
   END IF;
 END IF;
 INSERT INTO public.kc_traffic_guard_row_samples(total_rows,rows_15m,baseline_15m,level,detail)
 VALUES(total_now,rows_per_15m,base,alarm,explanation) RETURNING id INTO inserted_id;
 DELETE FROM public.kc_traffic_guard_row_samples WHERE measured_at<pg_catalog.now()-interval '7 days';
 SELECT last_level,last_sent_at INTO prev_alarm,prev_sent FROM public.kc_traffic_guard_row_alert WHERE id=1;
 IF alarm='normal' AND prev_alarm<>'normal' THEN
   UPDATE public.kc_traffic_guard_row_alert SET last_level='normal' WHERE id=1;
 END IF;
 IF alarm='critical' THEN
    should_send:=(prev_alarm IS DISTINCT FROM 'critical' OR prev_sent IS NULL
                  OR prev_sent < pg_catalog.now()-interval '6 hours');
 ELSIF alarm='warning' AND previous_sample.level IN ('warning','critical') THEN
    should_send:=(prev_alarm IS DISTINCT FROM 'warning' AND prev_alarm IS DISTINCT FROM 'critical');
 END IF;
 -- KC-LASTWAECHTER-GEPLANT-LEISE: geplante Sicherung/Spiegelung → nicht melden (außer extrem)
 IF should_send AND v_geplant AND coalesce(rows_per_15m,0) < 300000 THEN
    should_send:=false;
 END IF;
 RETURN jsonb_build_object('sample_id',inserted_id,'level',alarm,'rows_15m',rows_per_15m,
   'baseline_15m',base,'detail',explanation,'measured_at',pg_catalog.now(),'notify',should_send,
   'is_billing_egress',false,'geplant',v_geplant);
END;
$function$;
revoke all on function public.kc_traffic_guard_row_sample() from public, anon, authenticated;
grant execute on function public.kc_traffic_guard_row_sample() to service_role;
