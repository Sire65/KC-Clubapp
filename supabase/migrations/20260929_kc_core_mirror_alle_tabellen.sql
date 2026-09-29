-- KC Core Spiegel (Supabase → Neon): ALLE Tabellen aufnehmen – 29.09.2026, Admin-Freigabe Hansi
-- („ja alle Tabellen sollen aufgenommen werden, ist ja wichtig, damit alles gespiegelt ist“)
-- Recovery-Punkt: Neon-Zieltabellen vorher per supabase/neon/20260929_neon_spiegel_alle_tabellen.sql angelegt (nur CREATE).
-- Rückweg: Regeln der Notiz 'KC-SPIEGEL-ALLE' auf mirror_enabled=false setzen und aus kc_neon_resume_tables entfernen.
--
-- 1) public.kc_db_mirror_redaction (Registry): Geheimnis-Spalten, die NIE nach Neon gehen (werden als NULL gespiegelt).
--    Ersetzt keine vorhandenen Sonderfälle (kc_core_people u. a. bleiben wie freigegeben), gilt für alle anderen Tabellen.
-- 2) kc_db_mirror_snapshot: neuer Zweig für Tabellen mit Registry-Einträgen (sonst unverändert).
-- 3) Regeln für 118 Tabellen: 117 gespiegelt, kc_system_check_history bewusst nicht (57 MB Messverlauf, ~21 KB je Zeile –
--    ein Komplett-Kopieren alle 6 Std. sprengt Worker-Speicher und Neon-Rechenzeit). Die 4 Finanztabellen (kc_finance_*),
--    die nach der Rechenzeit-Pause nicht wieder aufgenommen wurden, laufen wieder mit.
-- 4) kc_neon_low_compute_cycle: statt fest max. 3×25 Tabellen alle Regeln in Paketen (≤25 Tabellen, ≤8 MB je Paket).
-- 5) kc_db_backup_daily: statt fest 36 Tabellen alle mit backup_enabled (ohne secret), Pakete à 25.

create table if not exists public.kc_db_mirror_redaction (
  table_name text not null,
  column_name text not null,
  grund text not null,
  erstellt_am timestamptz not null default now(),
  primary key (table_name, column_name)
);
alter table public.kc_db_mirror_redaction enable row level security;
revoke all on public.kc_db_mirror_redaction from public, anon, authenticated;

insert into public.kc_db_mirror_redaction(table_name, column_name, grund) values
  ('kc_external_credentials', 'secret', 'Zugangsgeheimnis externer Dienste'),
  ('kc_external_credentials', 'endpoint', 'kann Zugangsdaten in der URL enthalten'),
  ('kc_dp_sync_keys', 'key_material', 'Schlüsselmaterial der Dienstplan-Synchronisation'),
  ('kc_communication_push_devices', 'endpoint', 'Push-Adresse = Zustellberechtigung'),
  ('kc_communication_push_devices', 'p256dh', 'Push-Verschlüsselungsschlüssel'),
  ('kc_communication_push_devices', 'auth_key', 'Push-Authentifizierungsschlüssel'),
  ('kc_member_push_subscriptions', 'endpoint', 'Push-Adresse = Zustellberechtigung'),
  ('kc_member_push_subscriptions', 'subscription', 'enthält Push-Schlüssel'),
  ('kc_member_push_messages', 'tracking_token', 'Einmal-Kennung zum Quittieren'),
  ('kc_communication_machine_clients', 'pairing_code', 'Kopplungscode')
on conflict (table_name, column_name) do nothing;

create or replace function public.kc_db_mirror_snapshot(p_table_name text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_allowed boolean;
  v_rows jsonb;
  v_payload text;
  v_count bigint;
  v_hash text;
  v_cols text;
begin
  select exists (
    select 1
    from public.kc_db_mirror_table_rules
    where table_name = p_table_name
      and mirror_enabled = true
      and (
        sensitivity in ('normal','sensitive')
        or p_table_name in (
          'kc_core_people','kc_core_club_memberships','kc_core_operational_directory','kc_core_pos_aliases',
          'kc_core_app_access','kc_core_user_links','kc_dp_memberships','kc_manager_memberships',
          'kc_dp_devices','kc_manager_state_sections','kng_key_access_points',
          'kc_dp_daily_push_preview','kc_dp_pilot_testers','kc_dp_push_deliveries',
          'kc_dp_replacement_requests','kc_dp_replacement_responses',
          'kng_keys','kng_key_access_map','kng_key_assignments','kng_key_movements'
        )
      )
  ) into v_allowed;

  if not v_allowed then raise exception 'table not allowed for mirror: %', p_table_name; end if;
  if p_table_name !~ '^[a-z0-9_]+$' then raise exception 'invalid table name'; end if;

  if p_table_name = 'kc_core_people' then
    with q as (
      select person_id,org_id,display_name,
             null::text as email,
             null::text as phone,
             active,created_at,updated_at,
             given_name,family_name,preferred_name,
             null::date as birth_date,
             null::text as street,
             null::text as postal_code,
             null::text as city,
             country_code
      from public.kc_core_people
    )
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kc_dp_memberships' then
    with q as (select org_id,user_id,role,active,created_at,person_id,display_name,null::text as email,null::text as phone,updated_at from public.kc_dp_memberships)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kc_manager_memberships' then
    with q as (select org_id,user_id,role,active,created_at,person_id,display_name,null::text as email,null::text as phone,updated_at from public.kc_manager_memberships)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kc_dp_pilot_testers' then
    with q as (select id,org_id,project_id,person_id,first_name,null::text as phone_e164,expected_device,null::text as invite_token_hash,status,opened_at,installed_at,push_enabled_at,test_received_at,completed_at,revoked_at,created_at,updated_at,access_mode,access_expires_at,null::text as access_person_id from public.kc_dp_pilot_testers)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kc_dp_push_deliveries' then
    with q as (select id,org_id,project_id,notification_id,subscription_id,user_id,person_id,status,null::text as title,error_code,created_at,sent_at,failed_at,opened_at,displayed_at,dismissed_at,delivery_meta from public.kc_dp_push_deliveries)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kng_keys' then
    with q as (select id,internal_id,code,name,key_type,quantity,null::text as location,status,null::text as notes,created_at,updated_at from public.kng_keys)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kng_key_assignments' then
    with q as (select id,key_id,holder_type,holder_id,holder_name,quantity,issued_at,due_at,returned_at,status,null::text as notes,created_by,created_at from public.kng_key_assignments)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kng_key_movements' then
    with q as (select id,key_id,movement_type,quantity,null::text as subject,null::text as reason,actor_id,occurred_at from public.kng_key_movements)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif exists (select 1 from public.kc_db_mirror_redaction r where r.table_name = p_table_name) then
    -- KC-SPIEGEL-ALLE (29.09.2026): Geheimnis-Spalten laut Registry als NULL gleichen Typs (Spaltenreihenfolge bleibt → Prüfsumme passt)
    select string_agg(case when r.column_name is not null then format('null::%s as %I', format_type(a.atttypid, a.atttypmod), a.attname) else format('%I', a.attname) end, ', ' order by a.attnum)
      into v_cols
    from pg_attribute a
    left join public.kc_db_mirror_redaction r on r.table_name = p_table_name and r.column_name = a.attname
    where a.attrelid = format('public.%I', p_table_name)::regclass and a.attnum > 0 and not a.attisdropped;
    execute format('with q as (select %s from public.%I) select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),''[]''::jsonb), coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),''[]''::jsonb)::text, count(*), md5(coalesce(string_agg(row_to_json(q)::text, '''' order by row_to_json(q)::text), '''')) from q', v_cols, p_table_name)
      into v_rows,v_payload,v_count,v_hash;
  else
    execute format('select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text), ''[]''::jsonb), coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text), ''[]''::jsonb)::text, count(*), md5(coalesce(string_agg(row_to_json(t)::text, '''' order by row_to_json(t)::text), '''')) from public.%I t',p_table_name) into v_rows,v_payload,v_count,v_hash;
  end if;

  return jsonb_build_object('table',p_table_name,'rows',v_rows,'payload_text',v_payload,'row_count',v_count,'content_hash',v_hash);
end;
$function$;

-- 3) Regeln: alles, was noch keine Regel hat
with ohne as (
  select jsonb_array_elements_text(public.kc_db_mirror_abdeckung()->'liste') as t
)
insert into public.kc_db_mirror_table_rules(table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note, updated_at)
select t,
  case when t like 'kc_club_%' then 'Club-App'
       when t like 'kc_communication_%' or t like 'kc_member_push_%' then 'communication'
       when t like 'kc_dp_%' or t like 'kc_attendance_%' then 'KC DP'
       when t like 'kc_termin_%' or t like 'kc_besuche%' then 'Besuchsprotokoll'
       when t like 'kc_wm_%' then 'Weihnachtsmarkt'
       when t like 'kc_verwaltung_%' then 'KC Verwaltung'
       when t like 'kc_manager_%' or t like 'kc_pos_%' then 'PC Manager'
       when t like 'kicc_%' or t like 'kc_system_check_%' or t like 'kc_live_operations_%' or t like 'kc_backup_machine_%' then 'KICC'
       else 'KC Core' end,
  case when t like 'kc_club_%' or t like 'kc_communication_%' or t like 'kc_member_push_%' or t like 'kc_termin_%' or t like 'kc_besuche%'
         or t like 'kc_wm_%' or t like 'kc_dp_%' or t like 'kc_attendance_%' or t like 'kc_verwaltung_%'
         or t in (select table_name from public.kc_db_mirror_redaction) or t in ('kc_automation_credentials')
       then 'sensitive' else 'normal' end,
  false,
  t <> 'kc_system_check_history',
  t not in ('kc_system_check_history', 'kc_communication_health_snapshots'),
  case when t = 'kc_system_check_history' then 'KC-SPIEGEL-ALLE: bewusst nicht gespiegelt – Messverlauf 57 MB (~21 KB je Zeile), wird laufend neu erzeugt; Komplett-Kopie alle 6 Std. sprengt Worker/Neon'
       when t = 'kc_communication_health_snapshots' then 'KC-SPIEGEL-ALLE: gespiegelt; nicht im Tages-Backup (12 MB Messwerte, Neon-Speicher 0,5 GB)'
       when t in (select table_name from public.kc_db_mirror_redaction) then 'KC-SPIEGEL-ALLE: gespiegelt, Geheimnis-Spalten geschwärzt (kc_db_mirror_redaction)'
       else 'KC-SPIEGEL-ALLE: gespiegelt und gesichert (29.09.2026)' end,
  now()
from ohne
on conflict (table_name) do nothing;

-- Finanztabellen nach der Rechenzeit-Pause wieder aufnehmen (Neon-Tabellen vorhanden, letzter Lauf 20.09. identisch)
update public.kc_db_mirror_table_rules set mirror_enabled = true, updated_at = now()
where table_name in ('kc_finance_cash_counts','kc_finance_cash_measure_settings','kc_finance_cash_transfers','kc_finance_closing_reports') and not mirror_enabled;

insert into public.kc_neon_resume_tables(table_name, captured_at)
select r.table_name, now() from public.kc_db_mirror_table_rules r
where r.mirror_enabled and not exists (select 1 from public.kc_neon_resume_tables x where x.table_name = r.table_name);

-- 4) Sparmodus-Takt: alle Tabellen, gepackt nach Größe (≤25 Tabellen, ≤8 MB je Worker-Aufruf)
create or replace function public.kc_neon_low_compute_cycle()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
 v_until timestamptz; v_count int := 0; v_reqs jsonb := '[]'::jsonb; v_paket text[] := '{}'::text[]; v_bytes bigint := 0; z record;
 c_max_tabellen constant int := 25; c_max_bytes constant bigint := 8 * 1024 * 1024;
begin
 select maintenance_until into v_until from public.kc_neon_compute_policy where id='primary';
 if now()<coalesce(v_until,'infinity'::timestamptz) then
   return jsonb_build_object('status','maintenance','compute_opened',false,'until',v_until);
 end if;
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
     v_reqs := v_reqs || to_jsonb(public.kc_db_mirror_dispatch(v_paket));
     v_paket := '{}'::text[]; v_bytes := 0;
   end if;
   v_paket := v_paket || z.table_name; v_bytes := v_bytes + z.b; v_count := v_count + 1;
 end loop;
 if cardinality(v_paket) > 0 then v_reqs := v_reqs || to_jsonb(public.kc_db_mirror_dispatch(v_paket)); end if;
 if v_count=0 then return jsonb_build_object('status','nothing_to_mirror','compute_opened',false); end if;
 update public.kc_neon_compute_policy set mode='low_compute_active',updated_at=now() where id='primary';
 return jsonb_build_object('status','mirror_dispatched','compute_opened',true,'tables',v_count,'requests',v_reqs);
end $function$;

-- 5) Tages-Backup: alle Regeln mit backup_enabled (gespiegelt, nicht secret), Pakete à 25
create or replace function public.kc_db_backup_daily()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'vault', 'net'
as $function$
declare
  v_token text;
  v_set uuid := gen_random_uuid();
  v_tabellen text[];
  v_total int;
  v_reqs jsonb := '[]'::jsonb;
  v_req bigint;
  i int := 1;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name='kc_db_mirror_worker_token' limit 1;
  if v_token is null then raise exception 'backup worker token unavailable'; end if;

  select coalesce(array_agg(table_name order by table_name), '{}'::text[]) into v_tabellen
  from public.kc_db_mirror_table_rules
  where backup_enabled and mirror_enabled and sensitivity <> 'secret';
  v_total := cardinality(v_tabellen);
  if v_total = 0 then return jsonb_build_object('backup_set', null, 'status', 'nothing_to_backup'); end if;

  while i <= v_total loop
    select net.http_post(
      url:='https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-db-backup-worker',
      body:=jsonb_build_object('mode','backup','backup_set',v_set::text,'expected_total',v_total,'tables',to_jsonb(v_tabellen[i:i+24])),
      headers:=jsonb_build_object('Content-Type','application/json','x-kc-mirror-token',v_token), timeout_milliseconds:=60000) into v_req;
    v_reqs := v_reqs || to_jsonb(v_req);
    i := i + 25;
  end loop;

  insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
  values('info','immutable_backup_dispatched','Daily immutable Neon backup dispatched',jsonb_build_object('backup_set',v_set,'tables',v_total,'requests',v_reqs));
  return jsonb_build_object('backup_set',v_set,'tables',v_total,'request_ids',v_reqs);
end $function$;

insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
values ('info','mirror_coverage_extended','KC-SPIEGEL-ALLE: alle Tabellen mit Spiegel-Regel (Admin-Freigabe Hansi 29.09.2026)',
  jsonb_build_object('neue_regeln', (select count(*) from public.kc_db_mirror_table_rules where note like 'KC-SPIEGEL-ALLE%'),
                     'geschwaerzte_spalten', (select count(*) from public.kc_db_mirror_redaction),
                     'bewusst_ausgeschlossen', jsonb_build_array('kc_system_check_history')));
