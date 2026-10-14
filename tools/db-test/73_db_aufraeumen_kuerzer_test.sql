-- Probelauf DB-Aufräumen kürzer (DB 14.10.2026): ruft das Aufräumen einmal auf und prüft das Ergebnis – alles wird durch den Abbruch zurückgerollt.
do $t$
declare r jsonb; v_alt_mess integer; v_dick integer;
begin
  r := public.kc_club_db_aufraeumen(90);
  select count(*) into v_alt_mess from public.kc_communication_health_snapshots where created_at < now() - interval '30 days';
  select count(*) into v_dick from public.kc_system_check_history x where x.checked_at < now() - interval '14 days'
    and exists (select 1 from jsonb_array_elements(x.results) e where jsonb_typeof(e) = 'object' and exists (select 1 from jsonb_object_keys(e) k where k not in ('id','name','status','health')));
  raise exception 'TESTBERICHT (alles wird zurückgerollt): | ausgeduennt=% | messwerte=% | rest_messwerte_alt=% | rest_dick=% | vorher=% | nachher=%',
    r->>'ausgeduennt', r->>'messwerte', v_alt_mess, v_dick, r->>'vorher', r->>'nachher';
end
$t$;
