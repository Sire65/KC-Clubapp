-- KICC-F-110 Spiegel-Zeitblöcke: Probelauf in Supabase – läuft nach der Migration in derselben Transaktion und bricht am Ende
-- absichtlich ab (nichts bleibt). Nur Lesefunktionen; prüft Ganzzahl-Weg unverändert, Zeit-Weg, Datenschutz-Tabellen, Rechte.
do $$
declare
  vi jsonb; vz jsonb; vc jsonb; vp jsonb; rz jsonb; b jsonb;
begin
  vi := public.kc_db_mirror_block_hashes('kc_club_protokoll', 500);
  vz := public.kc_db_mirror_block_hashes('kc_club_db_last', 500);
  vc := public.kc_db_mirror_block_hashes('kc_communication_requests', 500);
  vp := public.kc_db_mirror_block_hashes('kng_keys', 500);
  b := vz->'blocks'->0;
  rz := public.kc_db_mirror_block_rows('kc_club_db_last', 86400, array[(b->>0)::bigint]);
  raise exception 'TESTBERICHT ganzzahl_unveraendert=% | db_last_zeit=% | requests_zeit=% | breite_tag=% | bloecke_da=% | zeilen_passen=% | personen_ganz=% | anon_kein_recht=% | auth_kein_recht=%',
    vi->>'pk' = 'id' and (vi->>'width')::int = 500 and vi->'zeit' is null,
    vz->'pk' = 'null'::jsonb and vz->>'zeit' = 'zeit',
    vc->'pk' = 'null'::jsonb and vc->>'zeit' = 'created_at',
    (vz->>'width')::int = 86400,
    jsonb_array_length(vz->'blocks') > 0 and jsonb_array_length(vc->'blocks') > 0,
    (rz->>'row_count')::bigint = (b->>1)::bigint,
    vp is null,
    not has_function_privilege('anon', 'public.kc_db_mirror_block_hashes(text,bigint)', 'execute'),
    not has_function_privilege('authenticated', 'public.kc_db_mirror_block_rows(text,bigint,bigint[])', 'execute');
end $$;
