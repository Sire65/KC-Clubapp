-- Club-App 0.54.0 – KC-CLUB-TIPPT: „schreibt …“ in Unterhaltungen (wie WhatsApp)
-- Flüchtig: je Unterhaltung/Person ein Eintrag mit „bis“ (jetzt + 6 s); Senden oder Feld leeren löscht ihn.
-- Nur über die Edge Function (service_role) – RLS an, keine Policies.
create table if not exists public.kc_club_tippen (
  thread_id uuid not null,
  person_id text not null,
  bis timestamptz not null,
  primary key (thread_id, person_id)
);
alter table public.kc_club_tippen enable row level security;
revoke all on public.kc_club_tippen from anon, authenticated;
-- alte Einträge stündlich aufräumen, damit die Tabelle winzig bleibt (nur Supabase, keine Neon-Rechenzeit)
select cron.schedule('kc-club-tippen-aufraeumen', '41 * * * *', $$delete from public.kc_club_tippen where bis < now() - interval '1 hour'$$);
-- Spiegel-Regel: bewusst nicht spiegeln (Sekunden-Zustand, kein Datenbestand) → Abdeckung bleibt vollständig
insert into public.kc_db_mirror_table_rules(table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note, updated_at)
values ('kc_club_tippen', 'Club-App', 'sensitive', false, false, false, 'KC-CLUB-TIPPT: flüchtige „schreibt …“-Anzeige (6 s), nicht spiegeln/sichern', now())
on conflict (table_name) do nothing;
