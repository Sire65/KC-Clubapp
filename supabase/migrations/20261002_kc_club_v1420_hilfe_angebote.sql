-- KC Club-App – Version 1.42.0 (Wunsch Hansi 02.10.2026)
-- KC-CLUB-HILFE-ANGEBOT  „🤲 Ich biete Hilfe an“: dauerhafte Angebote eines Mitglieds (z. B. „Einrichtung der Club-App“,
--                        „Einführung in den Bilderrechner“). Mitglieder tippen die Kachel an und fragen per Terminanfrage oder
--                        Nachricht an. Es wird beim Anlegen nichts verschickt. Beenden = aktiv false (bleibt für das Protokoll).
-- Zugriff nur über den Server (kc-club), RLS an, keine Policies. Spiegel/Sicherung wie die übrigen Club-Tabellen.
-- Rückweg: drop table kc_club_hilfe_angebote; (Spiegel-/Resume-Regel löschen)
create table if not exists kc_club_hilfe_angebote (
  id uuid primary key default gen_random_uuid(),
  von text not null references kc_core_people(person_id),
  sym text not null default '🤲' check (char_length(sym) between 1 and 8),
  titel text not null check (char_length(titel) between 2 and 80),
  text text check (text is null or char_length(text) <= 600),
  aktiv boolean not null default true,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create index if not exists kc_club_hilfe_angebote_aktiv on kc_club_hilfe_angebote (aktiv, erstellt_am);
alter table kc_club_hilfe_angebote enable row level security;
revoke all on kc_club_hilfe_angebote from anon, authenticated;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_hilfe_angebote', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-HILFE-ANGEBOT (1.42.0): Hilfe-Angebote')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_hilfe_angebote') on conflict (table_name) do nothing;
