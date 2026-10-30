-- KC-CLUB-PROTOKOLL-SCHREIBER-OFFEN: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
do $$
declare v_heute boolean; v_alt bigint;
begin
  select bool_and(verfasser_offen) into v_heute from public.kc_club_sitzungsprotokolle where status = 'entwurf' and datum >= '2026-10-30';
  select count(*) into v_alt from public.kc_club_sitzungsprotokolle where status <> 'entwurf' and verfasser_offen;
  raise exception 'TESTBERICHT spalte_da=% | heutiger_entwurf_offen=% | veroeffentlichte_unveraendert=%',
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kc_club_sitzungsprotokolle' and column_name = 'verfasser_offen'),
    coalesce(v_heute, true), v_alt = 0;
end $$;
