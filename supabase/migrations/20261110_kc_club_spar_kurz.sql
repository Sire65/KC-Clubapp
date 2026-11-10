-- KC-CLUB-SPAR-KURZ (Egress-Auswertung 10.11.2026, Wunsch Hansi „Ja alles sparsamer machen – trotzdem sicher und schnell, keine Geschwindigkeitseinbußen“):
-- 1) kc_club_manager_mitglieder_kurz: Die Mitgliederliste aus dem KC Manager (kc_manager_state_sections 'members') ist ≈ 109 KB groß (vor allem
--    claims/skills), die Club-App braucht davon nur Kennung, Namen, Telefon, Eintritt und Austritt (≈ 3 KB). Gleiche Reihenfolge, gleiche Feldnamen
--    wie im payload – der Server ersetzt nur das Lesen. Fehlt die Funktion oder antwortet sie nicht, liest der Server wie bisher alles (Rückfall).
-- 2) kc_club_comm_paket_kurz: wie kc_club_comm_paket (Communicator-Ampel), aber statt der bis zu 500 Aufträge der letzten 7 Tage (≈ 70 KB) nur die
--    Zahlen, die die Ampel daraus rechnet: Anzahl je Status (über dieselben neuesten 500), fehlgeschlagene der letzten 24 Std. (Status + Fehlercode)
--    und „zuletzt gesendet“. kc_club_comm_paket bleibt unverändert (Rückfall + Stichproben-Vergleich).
-- Beide nur lesend (stable), nur der Club-Server (service_role). Rückweg: drop function public.kc_club_manager_mitglieder_kurz(text);
--   drop function public.kc_club_comm_paket_kurz(timestamptz, timestamptz, text[], text[]);
create or replace function public.kc_club_manager_mitglieder_kurz(p_org text)
returns jsonb language sql stable set search_path to 'public' as $$
  select jsonb_build_object('data', coalesce((
    select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id', m.e->'id', 'firstName', m.e->'firstName', 'lastName', m.e->'lastName',
             'preferredName', m.e->'preferredName', 'phone', m.e->'phone', 'joinedAt', m.e->'joinedAt', 'exitDate', m.e->'exitDate')) order by m.i)
      from public.kc_manager_state_sections s,
           jsonb_array_elements(case when jsonb_typeof(s.payload->'data') = 'array' then s.payload->'data' else '[]'::jsonb end) with ordinality as m(e, i)
     where s.org_id = p_org and s.section_key = 'members'), '[]'::jsonb));
$$;
revoke all on function public.kc_club_manager_mitglieder_kurz(text) from public, anon, authenticated;
grant execute on function public.kc_club_manager_mitglieder_kurz(text) to service_role;

create or replace function public.kc_club_comm_paket_kurz(p_seit7 timestamptz, p_seit24 timestamptz, p_fehler text[], p_ok text[])
returns jsonb language sql stable set search_path to 'public' as $$
  with a as (select status, error_code, created_at, sent_at from public.kc_communication_requests
              where source_program = 'kc-club' and created_at >= p_seit7 order by created_at desc limit 500)
  select jsonb_build_object(
    'st', (select to_jsonb(x) from (select enabled, dispatch_enabled from public.kc_communication_settings where id = 'global') x),
    'wege', coalesce((select jsonb_agg(to_jsonb(x)) from (select channel, provider_id, role, enabled, health_status, last_success_at, last_failure_at, consecutive_failures
       from public.kc_communication_provider_routes where enabled = true and channel in ('push', 'email')) x), '[]'::jsonb),
    'bericht', (select to_jsonb(x) from (select created_at, success_rate, avg_push_ms, avg_email_ms, queued, retrying, failed, active_devices
       from public.kc_communication_health_snapshots order by created_at desc limit 1) x),
    'zahlen', jsonb_build_object(
      'status', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from a group by status) x), '{}'::jsonb),
      'f24', coalesce((select jsonb_agg(jsonb_build_object('status', status, 'error_code', error_code) order by created_at desc)
                         from a where status = any(p_fehler) and created_at >= p_seit24), '[]'::jsonb),
      'letzte', (select to_jsonb(sent_at) from a where status = any(p_ok) order by created_at desc limit 1)),
    'alle24', coalesce((select jsonb_agg(to_jsonb(x)) from (select status, error_code from public.kc_communication_requests
       where status = any(p_fehler) and created_at >= p_seit24 limit 500) x), '[]'::jsonb)
  );
$$;
revoke all on function public.kc_club_comm_paket_kurz(timestamptz, timestamptz, text[], text[]) from public, anon, authenticated;
grant execute on function public.kc_club_comm_paket_kurz(timestamptz, timestamptz, text[], text[]) to service_role;
