-- KICC-F-110 (Wunsch Hansi 29.10.2026 „schau, was die Werte hochtreibt und was wir tun können, damit es reicht“): Spiegel-Blöcke auch nach Zeit.
-- Anlass: Supabase-Egress hochgerechnet 5,6 von 5 GB (PostgREST 75 %). Tabellen ohne einfachen Ganzzahl-Schlüssel gingen bei jeder
-- Änderung komplett über die Leitung – z. B. kc_communication_requests (uuid, ≈ 5 MB × 4 täglich) und kc_club_db_last
-- (Schlüssel quelle + zeit, ≈ 1,8 MB × 4 täglich), obwohl nur die Zeilen der letzten Stunden neu waren.
-- Neu: Fehlt der Ganzzahl-Schlüssel (KICC-F-109), wird nach Tagen geteilt: Block = Sekunden seit 1970 / 86400 der Zeitspalte.
-- Zeitspalte = erste Zeitspalte im Primärschlüssel, sonst created_at/erstellt_am (NOT NULL); nicht, wenn sie geschwärzt wird.
-- Prüfsumme je Block: Zeilen nach Zeitspalte, dann nach Zeilentext (Sortierung "C", in Supabase und Neon gleich).
-- Alles Weitere wie KICC-F-109: nur abweichende Blöcke holen, danach Prüfung der ganzen Tabelle; passt sie nicht → ganze Tabelle wie bisher.
-- Rückwärtsverträglich: Für Zeit-Tabellen liefert kc_db_mirror_block_hashes pk = null + zeit; ein Spiegel-Arbeiter vor KICC-F-110
-- sieht kein pk und überträgt wie bisher die ganze Tabelle. Ganzzahl-Tabellen: Ergebnis unverändert.
-- Nur Lesefunktionen, nur service_role. Rückweg: 20261019_kicc_f109_spiegel_bloecke.sql erneut einspielen (nach drop function
-- public.kc_db_mirror_block_quelle(text)) – der Spiegel-Arbeiter fällt dann für Zeit-Tabellen von selbst auf die ganze Tabelle zurück.

drop function if exists public.kc_db_mirror_block_quelle(text);

create function public.kc_db_mirror_block_quelle(p_table_name text, out pk text, out cols text, out zeit text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_rel regclass;
begin
  if p_table_name !~ '^[a-z0-9_]+$' then raise exception 'invalid table name'; end if;
  if not exists (select 1 from public.kc_db_mirror_table_rules where table_name = p_table_name and mirror_enabled and sensitivity in ('normal', 'sensitive')) then
    raise exception 'table not allowed for mirror: %', p_table_name;
  end if;
  if p_table_name in ('kc_core_people', 'kc_dp_memberships', 'kc_manager_memberships', 'kc_dp_pilot_testers', 'kc_dp_push_deliveries',
                      'kng_keys', 'kng_key_assignments', 'kng_key_movements', 'kc_core_organizations') then
    return;
  end if;
  v_rel := format('public.%I', p_table_name)::regclass;
  select a.attname into pk
    from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
   where c.conrelid = v_rel and c.contype = 'p' and cardinality(c.conkey) = 1
     and a.atttypid in ('int2'::regtype, 'int4'::regtype, 'int8'::regtype);
  if pk is null then -- KICC-F-110: Zeitspalte für Tagesblöcke
    select a.attname into zeit
      from pg_attribute a
      left join pg_constraint c on c.conrelid = a.attrelid and c.contype = 'p' and a.attnum = any(c.conkey)
     where a.attrelid = v_rel and a.attnum > 0 and not a.attisdropped
       and a.atttypid in ('timestamptz'::regtype, 'timestamp'::regtype)
       and (c.conname is not null or (a.attnotnull and a.attname in ('created_at', 'erstellt_am')))
       and not exists (select 1 from public.kc_db_mirror_redaction r where r.table_name = p_table_name and r.column_name = a.attname)
     order by (c.conname is null), a.attnum
     limit 1;
    if zeit is null then return; end if;
  end if;
  select string_agg(case when r.column_name is not null and r.muster is not null
      then format('regexp_replace(%I::text, %L, %L, ''g'')::%s as %I', a.attname, r.muster, coalesce(r.ersatz, '[entfernt]'), format_type(a.atttypid, a.atttypmod), a.attname)
    when r.column_name is not null then format('null::%s as %I', format_type(a.atttypid, a.atttypmod), a.attname)
    else format('%I', a.attname) end, ', ' order by a.attnum)
    into cols
    from pg_attribute a
    left join public.kc_db_mirror_redaction r on r.table_name = p_table_name and r.column_name = a.attname
   where a.attrelid = v_rel and a.attnum > 0 and not a.attisdropped;
end $function$;

create or replace function public.kc_db_mirror_block_hashes(p_table_name text, p_width bigint default 500)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v record; r jsonb;
begin
  if p_width < 10 or p_width > 1000000 then raise exception 'invalid block width'; end if;
  select * into v from public.kc_db_mirror_block_quelle(p_table_name);
  if v.pk is not null then
    execute format('select coalesce(jsonb_agg(jsonb_build_array(b, n, h) order by b), ''[]''::jsonb) from (
        select (q.%1$I / %3$s)::bigint as b, count(*) as n, md5(string_agg(row_to_json(q)::text, '''' order by q.%1$I)) as h
          from (select %2$s from public.%4$I) q group by 1) x', v.pk, v.cols, p_width, p_table_name) into r;
    return jsonb_build_object('pk', v.pk, 'width', p_width, 'blocks', r);
  end if;
  if v.zeit is null then return null; end if;
  -- KICC-F-110: Tagesblöcke (Breite fest 86400 s, unabhängig von p_width)
  execute format('select coalesce(jsonb_agg(jsonb_build_array(b, n, h) order by b), ''[]''::jsonb) from (
      select floor(extract(epoch from q.%1$I) / 86400)::bigint as b, count(*) as n,
             md5(string_agg(row_to_json(q)::text, '''' order by q.%1$I, row_to_json(q)::text collate "C")) as h
        from (select %2$s from public.%3$I) q group by 1) x', v.zeit, v.cols, p_table_name) into r;
  return jsonb_build_object('pk', null, 'zeit', v.zeit, 'width', 86400, 'blocks', r);
end $function$;

create or replace function public.kc_db_mirror_block_rows(p_table_name text, p_width bigint, p_blocks bigint[])
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v record; v_payload text; v_count bigint;
begin
  if p_width < 10 or p_width > 1000000 then raise exception 'invalid block width'; end if;
  if cardinality(p_blocks) > 5000 then raise exception 'too many blocks'; end if;
  select * into v from public.kc_db_mirror_block_quelle(p_table_name);
  if v.pk is not null then
    execute format('select coalesce(jsonb_agg(to_jsonb(q)), ''[]''::jsonb)::text, count(*) from (select %s from public.%I) q where (q.%I / %s)::bigint = any($1)',
      v.cols, p_table_name, v.pk, p_width) using p_blocks into v_payload, v_count;
  elsif v.zeit is not null then -- KICC-F-110
    execute format('select coalesce(jsonb_agg(to_jsonb(q)), ''[]''::jsonb)::text, count(*) from (select %s from public.%I) q where floor(extract(epoch from q.%I) / %s)::bigint = any($1)',
      v.cols, p_table_name, v.zeit, p_width) using p_blocks into v_payload, v_count;
  else
    raise exception 'table not suitable for block mirror: %', p_table_name;
  end if;
  return jsonb_build_object('payload_text', v_payload, 'row_count', v_count);
end $function$;

revoke all on function public.kc_db_mirror_block_quelle(text) from public, anon, authenticated;
revoke all on function public.kc_db_mirror_block_hashes(text, bigint) from public, anon, authenticated;
revoke all on function public.kc_db_mirror_block_rows(text, bigint, bigint[]) from public, anon, authenticated;
grant execute on function public.kc_db_mirror_block_hashes(text, bigint) to service_role;
grant execute on function public.kc_db_mirror_block_rows(text, bigint, bigint[]) to service_role;
