-- KC Core Spiegel: Prüfsumme unabhängig von der Sortierregel – 29.09.2026 (Fund beim ersten Lauf KC-SPIEGEL-ALLE)
-- Supabase sortiert Texte nach en_US.UTF-8, Neon nach C.UTF-8. Die Prüfsumme md5(string_agg(row_to_json … order by …))
-- war daher bei Tabellen mit Groß-/Kleinschreibung oder Sonderzeichen trotz identischer Daten verschieden
-- (kc_security_reviewed_exceptions, kc_system_check_alarm_state: gleiche Zeilen, gleicher C-Hash, anderer en_US-Hash).
-- Fix an der Quelle: kc_db_mirror_snapshot sortiert die Prüfsumme mit collate "C" (= Neon-Standard, Worker und
-- Backup-Prüfung unverändert). Einmalige Folge: alle Tabellen gelten beim nächsten Lauf als „geändert“ und werden neu kopiert.
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
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text collate "C"),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kc_dp_memberships' then
    with q as (select org_id,user_id,role,active,created_at,person_id,display_name,null::text as email,null::text as phone,updated_at from public.kc_dp_memberships)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text collate "C"),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kc_manager_memberships' then
    with q as (select org_id,user_id,role,active,created_at,person_id,display_name,null::text as email,null::text as phone,updated_at from public.kc_manager_memberships)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text collate "C"),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kc_dp_pilot_testers' then
    with q as (select id,org_id,project_id,person_id,first_name,null::text as phone_e164,expected_device,null::text as invite_token_hash,status,opened_at,installed_at,push_enabled_at,test_received_at,completed_at,revoked_at,created_at,updated_at,access_mode,access_expires_at,null::text as access_person_id from public.kc_dp_pilot_testers)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text collate "C"),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kc_dp_push_deliveries' then
    with q as (select id,org_id,project_id,notification_id,subscription_id,user_id,person_id,status,null::text as title,error_code,created_at,sent_at,failed_at,opened_at,displayed_at,dismissed_at,delivery_meta from public.kc_dp_push_deliveries)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text collate "C"),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kng_keys' then
    with q as (select id,internal_id,code,name,key_type,quantity,null::text as location,status,null::text as notes,created_at,updated_at from public.kng_keys)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text collate "C"),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kng_key_assignments' then
    with q as (select id,key_id,holder_type,holder_id,holder_name,quantity,issued_at,due_at,returned_at,status,null::text as notes,created_by,created_at from public.kng_key_assignments)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text collate "C"),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif p_table_name = 'kng_key_movements' then
    with q as (select id,key_id,movement_type,quantity,null::text as subject,null::text as reason,actor_id,occurred_at from public.kng_key_movements)
    select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb),coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),'[]'::jsonb)::text,count(*),md5(coalesce(string_agg(row_to_json(q)::text,'' order by row_to_json(q)::text collate "C"),'')) into v_rows,v_payload,v_count,v_hash from q;
  elsif exists (select 1 from public.kc_db_mirror_redaction r where r.table_name = p_table_name) then
    -- KC-SPIEGEL-ALLE (29.09.2026): Geheimnis-Spalten laut Registry als NULL gleichen Typs (Spaltenreihenfolge bleibt → Prüfsumme passt)
    select string_agg(case when r.column_name is not null then format('null::%s as %I', format_type(a.atttypid, a.atttypmod), a.attname) else format('%I', a.attname) end, ', ' order by a.attnum)
      into v_cols
    from pg_attribute a
    left join public.kc_db_mirror_redaction r on r.table_name = p_table_name and r.column_name = a.attname
    where a.attrelid = format('public.%I', p_table_name)::regclass and a.attnum > 0 and not a.attisdropped;
    execute format('with q as (select %s from public.%I) select coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),''[]''::jsonb), coalesce(jsonb_agg(to_jsonb(q) order by to_jsonb(q)::text),''[]''::jsonb)::text, count(*), md5(coalesce(string_agg(row_to_json(q)::text, '''' order by row_to_json(q)::text collate "C"), '''')) from q', v_cols, p_table_name)
      into v_rows,v_payload,v_count,v_hash;
  else
    execute format('select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text), ''[]''::jsonb), coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text), ''[]''::jsonb)::text, count(*), md5(coalesce(string_agg(row_to_json(t)::text, '''' order by row_to_json(t)::text collate "C"), '''')) from public.%I t',p_table_name) into v_rows,v_payload,v_count,v_hash;
  end if;

  return jsonb_build_object('table',p_table_name,'rows',v_rows,'payload_text',v_payload,'row_count',v_count,'content_hash',v_hash);
end;
$function$;
