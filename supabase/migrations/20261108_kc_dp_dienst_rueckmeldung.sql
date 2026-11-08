-- KC-CLUB-IST-RUECKFRAGE (Wunsch Hansi 08.11.2026: „Die Mitglieder können ihre wirklichen Dienstzeiten selber eintragen. Du sagst z. B. deine geplante
-- Dienstzeit wäre heute von 11.00 bis 15.00 Uhr. Soll ich die als Ist-Zeiten übernehmen? Ja, nein, Änderung … Grund freiwillig … Im Abgleich mit DP2.
-- Und es muss abgefangen werden, wenn über die Kasse auch Dienstzeiten automatisch übernommen werden mit QR-Code. Damit es keine Konflikte gibt.“
-- Antworten 08.11.: Push 15 Min. nach Dienstende, wenn noch nicht eingetragen; nach ein paar Stunden freundliche Erinnerung; 7 Tage oder bis der Planer
-- den Tag abschließt; „laut Plan“ automatisch, Abweichung ab 15 Min. und „nicht da“ bestätigt der Planer; für alle im Plan (auch Aushilfen);
-- Live-Buchen (Dienst anmelden) bleibt. Erweitert DP2-F-IST-OHNE-UHR (docs/KONZEPT_AUFBAU_ISTZEITEN.md) auf alle Tage.
-- EINE Zeile je Person und geplantem Dienst (dienst_ref = kc_dp_plan_published.source_shift_id). Die Zeile entsteht, wenn gefragt wird (ergebnis null)
-- oder wenn das Mitglied antwortet. Soll wird beim Fragen/Antworten mitgespeichert (der Plan kann sich später ändern).
-- Rangfolge für das Ist (DP2): Planer > Kasse > App live (kc_dp_stempel) > diese Selbstangabe. Die Selbstangabe überschreibt nie eine Buchung.
-- Zugriff: Club-Server (service_role) direkt; DP2 nur über die Funktionen unten (angemeldet, aktive DP-Rolle admin/planner/duty_manager wie bei
-- kc_dp_hour_report_decide; Mitglieder lesen nur die eigenen). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop function public.kc_dp_rueckmeldungen_liste(text, date, date); drop function public.kc_dp_rueckmeldung_entscheiden(uuid, text, text);
--          drop table public.kc_dp_dienst_rueckmeldung; delete from public.kc_db_mirror_table_rules where table_name = 'kc_dp_dienst_rueckmeldung';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_dp_dienst_rueckmeldung';
create table if not exists public.kc_dp_dienst_rueckmeldung (
  id uuid primary key default gen_random_uuid(),
  org_id text not null default 'KC_WERNE',
  event_id text,
  dienst_ref text not null,
  person_id text not null references public.kc_core_people(person_id),
  work_date date not null,
  bereich text,
  soll_start timestamptz not null,
  soll_ende timestamptz not null,
  soll_pause integer not null default 0 check (soll_pause between 0 and 240),
  ergebnis text check (ergebnis in ('passt', 'geaendert', 'nicht_da', 'korrektur')), -- null = gefragt, noch keine Antwort; korrektur = Wunsch zu einer Kassen-/App-Buchung
  ist_start timestamptz,
  ist_ende timestamptz,
  pause_min integer check (pause_min between 0 and 240),
  grund text check (char_length(coalesce(grund, '')) <= 120),
  bemerkung text check (char_length(coalesce(bemerkung, '')) <= 300),
  planer_status text not null default 'offen' check (planer_status in ('offen', 'automatisch', 'zu_bestaetigen', 'bestaetigt', 'abgelehnt')),
  planer_grund text check (char_length(coalesce(planer_grund, '')) <= 500),
  entschieden_von uuid, entschieden_am timestamptz,
  gefragt_am timestamptz, erinnert_am timestamptz, beantwortet_am timestamptz,
  -- Wunsch Hansi 08.11.: „Wie warst du heute zufrieden mit deinem Dienst? 3 Lachgesichter … Waren die Schichten richtig besetzt? Ja, zu viel, zu wenig – hilft bei der Planung“
  zufrieden smallint check (zufrieden between 1 and 3),            -- 1 = 😀 gut, 2 = 🙂 geht so, 3 = ☹️ nicht gut (freiwillig)
  besetzung text check (besetzung in ('zu_wenig', 'passt', 'zu_viel')), -- freiwillig
  feedback_am timestamptz,
  version integer not null default 0,
  erstellt_am timestamptz not null default now(), geaendert_am timestamptz not null default now(),
  unique (org_id, dienst_ref, person_id),
  check (ergebnis is null or ergebnis = 'nicht_da' or (ist_start is not null and ist_ende is not null and ist_ende > ist_start and ist_ende - ist_start <= interval '16 hours'))
);
create index if not exists kc_dp_dienst_rueckmeldung_tag on public.kc_dp_dienst_rueckmeldung (org_id, work_date);
create index if not exists kc_dp_dienst_rueckmeldung_person on public.kc_dp_dienst_rueckmeldung (person_id, work_date desc);
alter table public.kc_dp_dienst_rueckmeldung enable row level security;
revoke all on public.kc_dp_dienst_rueckmeldung from public, anon, authenticated;
grant select, insert, update, delete on public.kc_dp_dienst_rueckmeldung to service_role;
comment on table public.kc_dp_dienst_rueckmeldung is 'KC-CLUB-IST-RUECKFRAGE: Selbstangabe der Ist-Zeit je Person und Dienst (passt/geändert/nicht da/Korrektur) – Club-Server schreibt, DP2 liest über kc_dp_rueckmeldungen_liste.';
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_dp_dienst_rueckmeldung', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-IST-RUECKFRAGE: Ist-Zeiten selbst bestätigt/geändert (Rückfrage nach dem Dienst)')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_dp_dienst_rueckmeldung') on conflict (table_name) do nothing;

-- DP2: Rückmeldungen eines Zeitraums lesen. Planer (admin/planner/duty_manager) alle der Organisation, sonst nur die eigenen (kc_dp_memberships.person_id).
create or replace function public.kc_dp_rueckmeldungen_liste(p_org_id text, p_von date, p_bis date)
returns jsonb language plpgsql stable security definer set search_path to 'pg_catalog', 'public', 'pg_temp' as $$
declare v_planer boolean; v_person text;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  if p_von is null or p_bis is null or p_bis < p_von or p_bis - p_von > 400 then raise exception 'Zeitraum ungültig'; end if;
  select bool_or(m.role in ('admin', 'planner', 'duty_manager')), max(m.person_id) into v_planer, v_person
    from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = p_org_id and m.active is true;
  if v_planer is null then raise exception 'Keine aktive dp2-Mitgliedschaft'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'event_id', r.event_id, 'dienst_ref', r.dienst_ref, 'person_id', r.person_id, 'work_date', r.work_date,
      'bereich', r.bereich, 'soll_start', r.soll_start, 'soll_ende', r.soll_ende, 'soll_pause', r.soll_pause, 'ergebnis', r.ergebnis, 'ist_start', r.ist_start, 'ist_ende', r.ist_ende,
      'pause_min', r.pause_min, 'grund', r.grund, 'bemerkung', r.bemerkung, 'planer_status', r.planer_status, 'planer_grund', r.planer_grund, 'entschieden_am', r.entschieden_am,
      'gefragt_am', r.gefragt_am, 'beantwortet_am', r.beantwortet_am, 'version', r.version, 'geaendert_am', r.geaendert_am,
      'zufrieden', r.zufrieden, 'besetzung', r.besetzung, 'feedback_am', r.feedback_am) order by r.work_date, r.soll_start)
    from public.kc_dp_dienst_rueckmeldung r
    where r.org_id = p_org_id and r.work_date between p_von and p_bis and (v_planer or r.person_id = v_person)), '[]'::jsonb);
end $$;
revoke all on function public.kc_dp_rueckmeldungen_liste(text, date, date) from public, anon;
grant execute on function public.kc_dp_rueckmeldungen_liste(text, date, date) to authenticated, service_role;

-- DP2: Planer bestätigt oder lehnt eine Abweichung ab (wie kc_dp_hour_report_decide). Ablehnen nur mit Grund. Veraltete Version → stale.
create or replace function public.kc_dp_rueckmeldung_entscheiden(p_id uuid, p_status text, p_grund text default '')
returns jsonb language plpgsql security definer set search_path to 'pg_catalog', 'public', 'pg_temp' as $$
declare v_org text; v_n integer; v_version integer;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  select org_id into v_org from public.kc_dp_dienst_rueckmeldung where id = p_id;
  if v_org is null then raise exception 'Rückmeldung nicht gefunden'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = v_org and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  if p_status not in ('bestaetigt', 'abgelehnt') then raise exception 'Status muss bestaetigt oder abgelehnt sein'; end if;
  if p_status = 'abgelehnt' and coalesce(length(trim(p_grund)), 0) = 0 then raise exception 'Für eine Ablehnung ist ein Grund erforderlich'; end if;
  update public.kc_dp_dienst_rueckmeldung
     set planer_status = p_status, planer_grund = nullif(left(trim(coalesce(p_grund, '')), 500), ''), entschieden_von = (select auth.uid()), entschieden_am = now(),
         version = version + 1, geaendert_am = now()
   where id = p_id and ergebnis is not null and planer_status in ('zu_bestaetigen', 'automatisch', 'bestaetigt', 'abgelehnt')
  returning version into v_version;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', v_n = 1, 'stale', v_n = 0, 'id', p_id, 'status', p_status, 'version', v_version);
end $$;
revoke all on function public.kc_dp_rueckmeldung_entscheiden(uuid, text, text) from public, anon;
grant execute on function public.kc_dp_rueckmeldung_entscheiden(uuid, text, text) to authenticated, service_role;
