-- KC-LASTWAECHTER-ARBEITSZEIT (16.11.2026, Wunsch Hansi „Warnungen schlauer machen, aber trotzdem gut aufpassen auf alles“).
-- Anlass: Warnung „6132 SQL-Aufrufe / 15 Min. (Durchschnitt 2406)“ um 18:18 – 4 Mitglieder hatten die App geöffnet, die Datenbank war in der
-- halben Stunde nur ≈ 27 s beschäftigt (≈ 1,5 %). Gestern Abend (echte Langsamkeit) waren es 391 s je halbe Stunde – bei kaum mehr Aufrufen.
-- Der Wächter misst darum zusätzlich die ARBEITSZEIT der Datenbank (Summe total_exec_time aus pg_stat_statements, nur Zahlen):
--   • viele Aufrufe, aber Arbeitszeit < 60 s je 15 Min. → „normal“ mit Hinweis „viele kurze Aufrufe“ (kein GELB mehr)
--   • NEU: Arbeitszeit ≥ 180 s je 15 Min. (20 %) → GELB, ≥ 450 s (50 %) → ROT – auch bei wenigen Aufrufen (passt schärfer auf als vorher)
--   • ≥ 20.000 Aufrufe je 15 Min. bleiben immer ROT (Schutz gegen Schleifen, auch wenn jeder Aufruf kurz ist)
--   • ohne Vergleichswert (erste Messung, Neustart) gilt die bisherige Regel.
-- Rückweg: Funktion aus der Sicherung im Kommentar unten (bisherige Fassung = ohne v_exec*), Spalten dürfen bleiben.
alter table public.kc_traffic_guard_samples add column if not exists total_exec_ms numeric;
alter table public.kc_traffic_guard_samples add column if not exists exec_ms_15m numeric;

create or replace function public.kc_traffic_guard_sample()
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
DECLARE
 v_calls bigint := 0;
 v_tx bigint := 0;
 v_exec numeric := 0;
 v_prev record;
 v_dt numeric;
 v_per15 numeric;
 v_txper15 numeric;
 v_exec15 numeric;
 v_baseline numeric;
 v_level text := 'unknown';
 v_aufrufe_level text := 'normal';
 v_detail text := 'Messbasis wird aufgebaut';
 v_id bigint;
 v_last text;
 v_last_at timestamptz;
 v_notify boolean := false;
BEGIN
 SELECT COALESCE(SUM(calls),0)::bigint, COALESCE(SUM(total_exec_time),0) INTO v_calls, v_exec FROM extensions.pg_stat_statements
  WHERE dbid=(SELECT oid FROM pg_catalog.pg_database WHERE datname=pg_catalog.current_database());
 SELECT (x.xact_commit+x.xact_rollback)::bigint INTO v_tx
  FROM pg_catalog.pg_stat_database x WHERE x.datname=pg_catalog.current_database();
 SELECT s.id,s.measured_at,s.total_calls,s.total_transactions,s.total_exec_ms,s.level
  INTO v_prev FROM public.kc_traffic_guard_samples s
  ORDER BY s.measured_at DESC,s.id DESC LIMIT 1;
 SELECT AVG(q.calls_15m) INTO v_baseline FROM
  (SELECT s.calls_15m FROM public.kc_traffic_guard_samples s
    WHERE s.calls_15m IS NOT NULL AND s.measured_at>pg_catalog.now()-INTERVAL '24 hours'
    ORDER BY s.measured_at DESC LIMIT 96) q;
 IF v_prev.id IS NOT NULL THEN
   v_dt:=EXTRACT(EPOCH FROM (clock_timestamp()-v_prev.measured_at));
   IF v_dt BETWEEN 120 AND 3600 AND v_calls>=v_prev.total_calls AND v_tx>=v_prev.total_transactions THEN
     v_per15:=round((v_calls-v_prev.total_calls)*900.0/v_dt);
     v_txper15:=round((v_tx-v_prev.total_transactions)*900.0/v_dt);
     IF v_prev.total_exec_ms IS NOT NULL AND v_exec>=v_prev.total_exec_ms THEN
       v_exec15:=round((v_exec-v_prev.total_exec_ms)*900.0/v_dt);
     END IF;
     v_level:='normal';
     v_detail:='Datenbanklast unauffaellig (kein Egress-Abrechnungswert)';
     -- bisherige Regel nach Anzahl der Aufrufe
     IF v_per15>=20000 OR (v_per15>=9000 AND v_baseline>0 AND v_per15>=v_baseline*3) THEN
       v_aufrufe_level:='critical';
     ELSIF v_per15>=10000 OR (v_per15>=4000 AND v_baseline>0 AND v_per15>=v_baseline*2.5) THEN
       v_aufrufe_level:='warning';
     END IF;
     IF v_exec15 IS NULL THEN
       v_level:=v_aufrufe_level; -- ohne Arbeitszeit-Vergleich: wie bisher
     ELSIF v_per15>=20000 OR v_exec15>=450000 THEN
       v_level:='critical';
     ELSIF v_exec15>=180000 THEN
       v_level:='warning';
     ELSIF v_aufrufe_level<>'normal' AND v_exec15>=60000 THEN
       v_level:=v_aufrufe_level;
     END IF;
     IF v_level<>'normal' THEN
       v_detail:='Auffaellige Datenbanklast: '||v_per15::text||' SQL-Aufrufe / 15 Min.'
         ||CASE WHEN v_baseline>0 THEN ' (Durchschnitt '||round(v_baseline)::text||')' ELSE '' END
         ||CASE WHEN v_exec15 IS NOT NULL THEN ', Datenbank '||round(v_exec15/1000.0)::text||' s von 900 s beschaeftigt ('||round(v_exec15/9000.0)::text||' %)' ELSE '' END
         ||'. Indikator, keine abrechenbaren Egress-GB.';
     ELSIF v_aufrufe_level<>'normal' THEN
       v_detail:='Viele kurze Aufrufe ('||v_per15::text||' / 15 Min.), Datenbank aber nur '||round(v_exec15/1000.0)::text
         ||' s von 900 s beschaeftigt – unbedenklich (z. B. mehrere App-Starts gleichzeitig). Kein Egress-Abrechnungswert.';
     END IF;
   ELSE
     v_detail:='Statistikzaehler zurueckgesetzt oder Messabstand ungueltig';
   END IF;
 END IF;
 INSERT INTO public.kc_traffic_guard_samples (total_calls,total_transactions,total_exec_ms,calls_15m,transactions_15m,exec_ms_15m,baseline_15m,level,detail)
 VALUES (v_calls,v_tx,v_exec,v_per15,v_txper15,v_exec15,v_baseline,v_level,v_detail) RETURNING id INTO v_id;
 DELETE FROM public.kc_traffic_guard_samples WHERE measured_at<pg_catalog.now()-INTERVAL '7 days';
 SELECT last_alert_level,last_alert_at INTO v_last,v_last_at
   FROM public.kc_traffic_guard_alert_state WHERE id=1;
 IF v_level='normal' AND v_last<>'normal' THEN
   UPDATE public.kc_traffic_guard_alert_state SET last_alert_level='normal' WHERE id=1;
 END IF;
 IF v_level='critical' THEN
   v_notify:=v_last IS DISTINCT FROM 'critical' OR v_last_at IS NULL OR v_last_at<pg_catalog.now()-INTERVAL '6 hours';
 ELSIF v_level='warning' AND v_prev.level IN ('warning','critical') THEN
   v_notify:=v_last IS DISTINCT FROM 'warning' AND v_last IS DISTINCT FROM 'critical';
 END IF;
 RETURN jsonb_build_object('sample_id',v_id,'level',v_level,'detail',v_detail,'calls_15m',v_per15,
   'transactions_15m',v_txper15,'exec_ms_15m',v_exec15,'baseline_15m',v_baseline,'measured_at',pg_catalog.now(),
   'notify',v_notify,'is_billing_egress',false,'billing_egress_gb',null,'billing_source','not_configured');
END;
$function$;
revoke all on function public.kc_traffic_guard_sample() from public, anon, authenticated;
grant execute on function public.kc_traffic_guard_sample() to service_role;
