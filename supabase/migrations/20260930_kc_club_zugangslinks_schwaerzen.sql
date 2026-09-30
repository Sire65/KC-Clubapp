-- KC-CLUB-LINKSCHUTZ (0.77.0, Freigabe Hansi 30.09.2026): persönliche App-Links (…?k=<Schlüssel>) nie im Klartext speichern.
-- Befund: „Link verloren?“ schickt den Link per Communicator-Mail; der Communicator speichert die Mail-Variablen
-- (kc_communication_requests.variables) → 4 Links im Klartext (3 gültig), mitgespiegelt nach Neon.
-- 1) Quelle: kc_club_zugangslinks_schwaerzen() ersetzt den Schlüssel in fertig versendeten Mails durch „[entfernt]“
--    (der Club-Server ruft sie direkt nach dem Versand auf; Zeitplan alle 15 Min. als Netz). Nicht fertige Mails bleiben,
--    sonst käme bei einem Wiederholversuch ein kaputter Link an.
-- 2) Spiegel: Schwärzungs-Verzeichnis kann jetzt Muster (nur der passende Teil wird ersetzt, Rest bleibt) – für
--    kc_communication_requests.variables. Links gelangen so auch dann nicht nach Neon, wenn einer übrig bliebe.
-- Die Links selbst bleiben gültig (Wunsch Hansi: nicht erneuern). Keine Daten gelöscht, nur der Schlüssel im Text ersetzt.

-- Wiederherstellungspunkt der Spiegel-Momentaufnahme
do $sich$ declare d text; begin
  d := pg_get_functiondef('public.kc_db_mirror_snapshot'::regproc);
  d := regexp_replace(d, '(FUNCTION public\.kc_db_mirror_snapshot)\(', '\1_vor_linkschutz(');
  execute d;
end $sich$;
revoke all on function public.kc_db_mirror_snapshot_vor_linkschutz(text) from public, anon, authenticated;

alter table public.kc_db_mirror_redaction add column if not exists muster text;
alter table public.kc_db_mirror_redaction add column if not exists ersatz text;

do $mig$ declare d text; alt text := $x$case when r.column_name is not null then format('null::%s as %I', format_type(a.atttypid, a.atttypmod), a.attname) else format('%I', a.attname) end$x$;
begin
  d := pg_get_functiondef('public.kc_db_mirror_snapshot'::regproc);
  if position(alt in d) = 0 then raise exception 'Schwärzungsstelle in kc_db_mirror_snapshot nicht gefunden'; end if;
  d := replace(d, alt, $x$case when r.column_name is not null and r.muster is not null then format('regexp_replace(%I::text, %L, %L, ''g'')::%s as %I', a.attname, r.muster, coalesce(r.ersatz, '[entfernt]'), format_type(a.atttypid, a.atttypmod), a.attname) when r.column_name is not null then format('null::%s as %I', format_type(a.atttypid, a.atttypmod), a.attname) else format('%I', a.attname) end$x$);
  execute d;
end $mig$;

insert into public.kc_db_mirror_redaction (table_name, column_name, grund, muster, ersatz)
values ('kc_communication_requests', 'variables', 'persönliche App-Links (Zugangsschlüssel) in Mail-Variablen – nur der Schlüssel wird ersetzt', '\?k=[A-Za-z0-9_-]+', '?k=[entfernt]')
on conflict (table_name, column_name) do update set grund = excluded.grund, muster = excluded.muster, ersatz = excluded.ersatz;

create or replace function public.kc_club_zugangslinks_schwaerzen()
returns integer language plpgsql security definer set search_path = pg_catalog, public as $$
declare n integer;
begin
  update public.kc_communication_requests
     set variables = regexp_replace(variables::text, '\?k=[A-Za-z0-9_-]{8,}', '?k=[entfernt]', 'g')::jsonb
   where variables::text ~ '\?k=[A-Za-z0-9_-]{8,}'
     and (status in ('sent','delivered','displayed','opened','acknowledged','failed','dead_lettered','error','cancelled','skipped')
          or created_at < now() - interval '2 days');
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.kc_club_zugangslinks_schwaerzen() from public, anon, authenticated;

select cron.unschedule('kc-club-zugangslinks-schwaerzen') where exists (select 1 from cron.job where jobname = 'kc-club-zugangslinks-schwaerzen');
select cron.schedule('kc-club-zugangslinks-schwaerzen', '*/15 * * * *', $$select public.kc_club_zugangslinks_schwaerzen()$$);
