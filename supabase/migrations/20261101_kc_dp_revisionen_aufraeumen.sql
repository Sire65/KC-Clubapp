-- KC-DP-REVISIONEN-AUFRAEUMEN (Wunsch Hansi 01.11.2026 „Ja mach alle drei, c zuerst“): Dienstplan-Arbeitsstände (DP3) haben bisher keine Löschregel.
-- Messung 01.11.: 72 Fassungen seit 23.10., je ca. 0,6 MB (verschlüsselt), zusammen 46 MB – größte Tabelle, ca. +5 MB am Tag; bei dem Tempo wäre die
-- kostenlose Grenze (500 MB) in etwa zwei Monaten erreicht.
-- DP3 liest nur die NEUESTE Fassung (kc_dp_workspace_read: order by version desc limit 1) und speichert immer max(version)+1 (kc_dp_workspace_save).
-- Ältere Fassungen sind nur Geschichte. Behalten werden je Arbeitsstand (org_id, project_id):
--   * die 10 neuesten Fassungen,
--   * dazu je Tag (deutsche Zeit) die letzte Fassung der vergangenen 30 Tage.
-- Alles andere wird gelöscht. Ältere Stände bleiben trotzdem greifbar: Frankfurt-Sicherung (alle Tabellen, 14 Tage) und B2-Sicherung.
-- Läuft täglich 03:20 UTC (nach FRA-Sicherung 1–3 UTC, vor dem Neon-Spiegel 4:05 UTC). Ergebnis in kc_db_mirror_audit (action dp_revisionen_aufgeraeumt).
-- Rückweg: select cron.unschedule('kc-dp-revisionen-aufraeumen'); (die Funktion darf bleiben).

create or replace function kc_internal.kc_dp_revisionen_aufraeumen(p_behalten int default 10, p_tage int default 30)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_geloescht int := 0; v_bytes bigint := 0;
begin
  with rang as (
    select r.org_id, r.project_id, r.version, octet_length(r.envelope::text) as groesse,
           row_number() over (partition by r.org_id, r.project_id order by r.version desc) as neu,
           row_number() over (partition by r.org_id, r.project_id, (r.created_at at time zone 'Europe/Berlin')::date order by r.version desc) as tag_letzte,
           r.created_at
      from public.kc_dp_workspace_revisions r),
  weg as (
    select org_id, project_id, version, groesse from rang
     where neu > greatest(p_behalten, 1)                                   -- die neueste bleibt immer
       and not (tag_letzte = 1 and created_at > now() - make_interval(days => p_tage))),
  del as (
    delete from public.kc_dp_workspace_revisions d using weg
     where d.org_id = weg.org_id and d.project_id = weg.project_id and d.version = weg.version
    returning weg.groesse)
  select count(*), coalesce(sum(groesse), 0) into v_geloescht, v_bytes from del;
  if v_geloescht > 0 then
    insert into public.kc_db_mirror_audit(severity, action, detail, metadata)
    values ('info', 'dp_revisionen_aufgeraeumt',
            format('Dienstplan-Arbeitsstände: %s alte Fassung(en) gelöscht (ca. %s MB); behalten: die %s neuesten und je Tag die letzte der vergangenen %s Tage.',
                   v_geloescht, round(v_bytes / 1048576.0, 1), p_behalten, p_tage),
            jsonb_build_object('geloescht', v_geloescht, 'bytes', v_bytes, 'behalten', p_behalten, 'tage', p_tage));
  end if;
  return jsonb_build_object('geloescht', v_geloescht, 'bytes', v_bytes);
end $function$;
revoke all on function kc_internal.kc_dp_revisionen_aufraeumen(int, int) from public;

select cron.unschedule('kc-dp-revisionen-aufraeumen') where exists (select 1 from cron.job where jobname = 'kc-dp-revisionen-aufraeumen');
select cron.schedule('kc-dp-revisionen-aufraeumen', '20 3 * * *', 'select kc_internal.kc_dp_revisionen_aufraeumen()');
