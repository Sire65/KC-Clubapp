-- KC-CLUB-SPUR-PINNWAND-ECHT: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
do $$
declare v_rest bigint; v_andere bigint;
begin
  select count(*) into v_rest from public.kc_club_protokoll p, jsonb_array_elements(p.details -> 's') e
   where p.aktion = 'spur' and p.zeit >= '2026-10-29' and e->>1 = 'tat_pinnwand'
     and not exists (select 1 from public.kc_club_pinnwand z where z.person_id = p.person_id
       and z.erstellt_am between to_timestamp((e->>0)::bigint / 1000.0) - interval '10 minutes' and to_timestamp((e->>0)::bigint / 1000.0) + interval '10 minutes');
  select count(*) into v_andere from public.kc_club_protokoll p, jsonb_array_elements(p.details -> 's') e
   where p.aktion = 'spur' and p.zeit >= '2026-10-30 08:44' and p.zeit < '2026-10-30 08:45' and p.person_id = 'KC-P-M0015' and e->>1 in ('termine', 'vorschlaege', 'geoeffnet', 'wieder_789');
  raise exception 'TESTBERICHT falsche_weg=% | andere_schritte_bleiben=%', v_rest = 0, v_andere >= 4;
end $$;
