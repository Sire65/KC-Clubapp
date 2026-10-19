-- KICC-F-109 (Wunsch Hansi 19.10.2026 „mach du die Umbauten, es muss kostenlos bleiben“): Spiegel überträgt nur geänderte Blöcke.
-- Anlass: Supabase-Egress 7,19 von 5 GB. Protokoll-Tabellen (kc_club_protokoll 3,4 MB, kicc_program_flow_events 3,1 MB …) gingen
-- alle 6 Stunden komplett über die Leitung, obwohl nur wenige Zeilen neu waren.
-- Neu: Tabellen mit einfachem Ganzzahl-Schlüssel werden in Blöcke zu 500 Schlüsselnummern geteilt (Block = Schlüssel / 500).
-- kc_db_mirror_block_hashes liefert je Block Zeilenzahl + Prüfsumme (wenige Byte); der Spiegel-Arbeiter rechnet dasselbe in Neon
-- und holt mit kc_db_mirror_block_rows nur die abweichenden Blöcke. Danach Prüfung der ganzen Tabelle wie bisher; passt sie nicht,
-- wird wie früher die ganze Tabelle übertragen. Gleiche Zeilenform wie kc_db_mirror_snapshot (Schwärzung laut kc_db_mirror_redaction).
-- Tabellen mit fester Datenschutz-Spaltenliste, kc_core_organizations und Tabellen ohne Ganzzahl-Schlüssel: unverändert ganze Tabelle.
-- Nur Lesefunktionen, nur service_role. Rückweg: Funktionen bleiben unbenutzt, wenn der Spiegel-Arbeiter vor KICC-F-109 hochgeladen wird.

create or replace function public.kc_db_mirror_block_quelle(p_table_name text, out pk text, out cols text)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if p_table_name !~ '^[a-z0-9_]+$' then raise exception 'invalid table name'; end if;
  if not exists (select 1 from public.kc_db_mirror_table_rules where table_name = p_table_name and mirror_enabled and sensitivity in ('normal', 'sensitive')) then
    raise exception 'table not allowed for mirror: %', p_table_name;
  end if;
  if p_table_name in ('kc_core_people', 'kc_dp_memberships', 'kc_manager_memberships', 'kc_dp_pilot_testers', 'kc_dp_push_deliveries',
                      'kng_keys', 'kng_key_assignments', 'kng_key_movements', 'kc_core_organizations') then
    return;
  end if;
  select a.attname into pk
    from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
   where c.conrelid = format('public.%I', p_table_name)::regclass and c.contype = 'p' and cardinality(c.conkey) = 1
     and a.atttypid in ('int2'::regtype, 'int4'::regtype, 'int8'::regtype);
  if pk is null then return; end if;
  select string_agg(case when r.column_name is not null and r.muster is not null
      then format('regexp_replace(%I::text, %L, %L, ''g'')::%s as %I', a.attname, r.muster, coalesce(r.ersatz, '[entfernt]'), format_type(a.atttypid, a.atttypmod), a.attname)
    when r.column_name is not null then format('null::%s as %I', format_type(a.atttypid, a.atttypmod), a.attname)
    else format('%I', a.attname) end, ', ' order by a.attnum)
    into cols
    from pg_attribute a
    left join public.kc_db_mirror_redaction r on r.table_name = p_table_name and r.column_name = a.attname
   where a.attrelid = format('public.%I', p_table_name)::regclass and a.attnum > 0 and not a.attisdropped;
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
  if v.pk is null then return null; end if;
  execute format('select coalesce(jsonb_agg(jsonb_build_array(b, n, h) order by b), ''[]''::jsonb) from (
      select (q.%1$I / %3$s)::bigint as b, count(*) as n, md5(string_agg(row_to_json(q)::text, '''' order by q.%1$I)) as h
        from (select %2$s from public.%4$I) q group by 1) x', v.pk, v.cols, p_width, p_table_name) into r;
  return jsonb_build_object('pk', v.pk, 'width', p_width, 'blocks', r);
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
  if v.pk is null then raise exception 'table not suitable for block mirror: %', p_table_name; end if;
  execute format('select coalesce(jsonb_agg(to_jsonb(q)), ''[]''::jsonb)::text, count(*) from (select %s from public.%I) q where (q.%I / %s)::bigint = any($1)',
    v.cols, p_table_name, v.pk, p_width) using p_blocks into v_payload, v_count;
  return jsonb_build_object('payload_text', v_payload, 'row_count', v_count);
end $function$;

revoke all on function public.kc_db_mirror_block_quelle(text) from public, anon, authenticated;
revoke all on function public.kc_db_mirror_block_hashes(text, bigint) from public, anon, authenticated;
revoke all on function public.kc_db_mirror_block_rows(text, bigint, bigint[]) from public, anon, authenticated;
grant execute on function public.kc_db_mirror_block_hashes(text, bigint) to service_role;
grant execute on function public.kc_db_mirror_block_rows(text, bigint, bigint[]) to service_role;
