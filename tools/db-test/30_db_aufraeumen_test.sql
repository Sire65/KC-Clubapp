-- Probelauf DB-Aufräumen (2.24.7): ruft Belegung und Aufräumen einmal auf – alles wird durch den Abbruch zurückgerollt.
do $t$
declare b jsonb; r jsonb;
begin
  b := public.kc_club_db_belegung();
  r := public.kc_club_db_aufraeumen(90);
  raise exception 'TESTBERICHT (alles wird zurückgerollt): | belegung=% | tage=% | aufraeumen=ok', jsonb_array_length(b), r->>'tage';
end
$t$;
