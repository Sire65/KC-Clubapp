-- KC-SPIEGEL-SCHONEND Nachtrag (15.11.2026, Selbstprüfung nach dem Einspielen): Die Statistik-Zähler beginnen nach einem Neustart der Datenbank
-- wieder bei 0 (so am 15.11. um 16:16 UTC). Damit eine Kennung nach einem Neustart nie zufällig gleich aussieht, gehört der Startzeitpunkt der
-- Datenbank mit hinein – nach jedem Neustart rechnet der Spiegel-Arbeiter darum einmal die echte Prüfsumme. Nur Zahlen, nur service_role.
-- Rückweg: Funktion aus 20261115_kc_spiegel_schonend.sql wieder einspielen.
create or replace function public.kc_db_mirror_stat_sig(p_table_name text)
returns text
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select concat_ws(':', floor(extract(epoch from pg_postmaster_start_time()))::bigint, pg_relation_filenode(c.oid), s.n_tup_ins, s.n_tup_upd, s.n_tup_del)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    join pg_stat_user_tables s on s.relid = c.oid
   where c.relname = p_table_name and c.relkind in ('r', 'p')
     and exists (select 1 from public.kc_db_mirror_table_rules r where r.table_name = p_table_name and r.mirror_enabled)
$function$;
revoke all on function public.kc_db_mirror_stat_sig(text) from public, anon, authenticated;
grant execute on function public.kc_db_mirror_stat_sig(text) to service_role;
