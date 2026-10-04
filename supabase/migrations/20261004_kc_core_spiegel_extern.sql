-- KC-CORE-SPIEGEL-EXTERN (04.10.2026, Wunsch/Freigabe Hansi nach der Supabase-Störung vom 04.10. nachts):
-- Ein GitHub-Zeitplan (.github/workflows/spiegel-waechter.yml) fragt stündlich von außen nach, ob die Neon-Spiegelung
-- pünktlich gelaufen ist. Nur wenn der normale Lauf (Cron kc-neon-low-compute-cycle, alle 6 h, Anstoß über pg_net)
-- ausgefallen ist, stößt der Spiegel-Arbeiter die Pakete selbst an – ohne pg_net (Edge → Edge).
-- Im Normalbetrieb wird Neon dadurch NICHT zusätzlich geweckt (keine Extra-Rechenzeit).
--
-- Kein Parallel-Kern: die Paketbildung (bisher fest in kc_neon_low_compute_cycle) steht jetzt in EINER Funktion
-- kc_db_mirror_pakete_vorbereiten(), die der Cron-Lauf und der externe Anstoß gemeinsam nutzen. Verhalten unverändert.
--
-- Schutz: kc_db_mirror_extern_plan() ist nur für service_role (Spiegel-Arbeiter) ausführbar, handelt nur bei
--   (a) keine Wartung, (b) letzter Spiegel-Lauf älter als 390 Min. (= Fenster des Mirror-Watchdogs),
--   (c) kein externer Anstoß in den letzten 60 Min. (Sperre über Advisory-Lock + Protokollzeile).
-- Rückweg: kc_neon_low_compute_cycle aus dem Stand vor dieser Migration (Funktionsdefinition mit eigener Schleife)
--   wieder einspielen; drop function kc_db_mirror_extern_plan(); drop function kc_db_mirror_pakete_vorbereiten();

create or replace function public.kc_db_mirror_pakete_vorbereiten()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
 v_pakete jsonb := '[]'::jsonb; v_paket text[] := '{}'::text[]; v_bytes bigint := 0; z record;
 c_max_tabellen constant int := 25; c_max_bytes constant bigint := 8 * 1024 * 1024;
begin
 update public.kc_db_mirror_table_rules r set mirror_enabled=true,updated_at=now()
 where exists(select 1 from public.kc_neon_resume_tables x where x.table_name=r.table_name)
   and r.mirror_enabled=false;
 for z in
   select t.table_name, coalesce(pg_total_relation_size(to_regclass(format('public.%I', t.table_name))), 0) as b
   from public.kc_db_mirror_table_rules t
   join public.kc_neon_resume_tables x on x.table_name = t.table_name
   where t.mirror_enabled
   order by 2, 1
 loop
   if cardinality(v_paket) > 0 and (cardinality(v_paket) >= c_max_tabellen or v_bytes + z.b > c_max_bytes) then
     v_pakete := v_pakete || jsonb_build_array(to_jsonb(v_paket));
     v_paket := '{}'::text[]; v_bytes := 0;
   end if;
   v_paket := v_paket || z.table_name; v_bytes := v_bytes + z.b;
 end loop;
 if cardinality(v_paket) > 0 then v_pakete := v_pakete || jsonb_build_array(to_jsonb(v_paket)); end if;
 return v_pakete;
end $function$;

create or replace function public.kc_neon_low_compute_cycle()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
 v_until timestamptz; v_count int := 0; v_reqs jsonb := '[]'::jsonb; v_pakete jsonb; p jsonb;
begin
 select maintenance_until into v_until from public.kc_neon_compute_policy where id='primary';
 if now()<coalesce(v_until,'infinity'::timestamptz) then
   return jsonb_build_object('status','maintenance','compute_opened',false,'until',v_until);
 end if;
 v_pakete := public.kc_db_mirror_pakete_vorbereiten();
 for p in select value from jsonb_array_elements(v_pakete) loop
   v_reqs := v_reqs || to_jsonb(public.kc_db_mirror_dispatch(array(select jsonb_array_elements_text(p))));
   v_count := v_count + jsonb_array_length(p);
 end loop;
 if v_count=0 then return jsonb_build_object('status','nothing_to_mirror','compute_opened',false); end if;
 update public.kc_neon_compute_policy set mode='low_compute_active',updated_at=now() where id='primary';
 return jsonb_build_object('status','mirror_dispatched','compute_opened',true,'tables',v_count,'requests',v_reqs);
end $function$;

create or replace function public.kc_db_mirror_extern_plan()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
 v_until timestamptz; v_letzter timestamptz; v_anstoss timestamptz; v_pakete jsonb; v_tabellen int := 0;
 c_fenster constant interval := interval '390 minutes';
 c_sperre constant interval := interval '60 minutes';
begin
 perform pg_advisory_xact_lock(hashtext('kc_db_mirror_extern_plan'));
 select maintenance_until into v_until from public.kc_neon_compute_policy where id='primary';
 if now()<coalesce(v_until,'infinity'::timestamptz) then
   return jsonb_build_object('status','wartung','bis',v_until);
 end if;
 select max(started_at) into v_letzter from public.kc_db_mirror_runs where run_type='snapshot';
 if v_letzter is not null and v_letzter > now() - c_fenster then
   return jsonb_build_object('status','frisch','letzter_lauf',v_letzter);
 end if;
 select max(started_at) into v_anstoss from public.kc_db_mirror_runs where run_type='extern_anstoss';
 if v_anstoss is not null and v_anstoss > now() - c_sperre then
   return jsonb_build_object('status','schon_angestossen','letzter_lauf',v_letzter,'angestossen_um',v_anstoss);
 end if;
 v_pakete := public.kc_db_mirror_pakete_vorbereiten();
 select coalesce(sum(jsonb_array_length(value)),0) into v_tabellen from jsonb_array_elements(v_pakete);
 if v_tabellen = 0 then
   return jsonb_build_object('status','nichts_zu_spiegeln','letzter_lauf',v_letzter);
 end if;
 insert into public.kc_db_mirror_runs(run_type,status,started_at,finished_at,source_rows,target_rows,mismatch_count,message,metrics)
 values ('extern_anstoss','ok',now(),now(),v_tabellen,0,0,
   format('Spiegel von außen angestoßen (GitHub-Wächter): letzter Lauf %s, %s Tabellen in %s Paketen',
     coalesce(to_char(v_letzter at time zone 'Europe/Berlin','DD.MM. HH24:MI'),'unbekannt'), v_tabellen, jsonb_array_length(v_pakete)),
   jsonb_build_object('quelle','github','letzter_lauf',v_letzter,'tabellen',v_tabellen,'pakete',jsonb_array_length(v_pakete)));
 update public.kc_neon_compute_policy set mode='low_compute_active',updated_at=now() where id='primary';
 return jsonb_build_object('status','angestossen','letzter_lauf',v_letzter,'tabellen',v_tabellen,'pakete',v_pakete);
end $function$;

revoke all on function public.kc_db_mirror_pakete_vorbereiten() from public, anon, authenticated;
revoke all on function public.kc_db_mirror_extern_plan() from public, anon, authenticated;
revoke all on function public.kc_neon_low_compute_cycle() from public, anon, authenticated;
grant execute on function public.kc_db_mirror_pakete_vorbereiten() to service_role;
grant execute on function public.kc_db_mirror_extern_plan() to service_role;
grant execute on function public.kc_neon_low_compute_cycle() to service_role;
