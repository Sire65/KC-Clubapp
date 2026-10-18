-- KC-CLUB-LINK-VORSCHAU (Server 2.486.0, Wunsch Hansi „Ja, Link-Vorschau bauen“): zu einem Link in einer Nachricht eine kleine Karte
-- (Titel, Kurztext, Seite, Bild-Adresse) – wie KC-CLUB-KONTAKT eine eigene Zusatz-Tabelle je Nachricht. Gespeichert wird nur Text und die
-- Bild-ADRESSE (das Bild selbst nicht). Geholt hat die Angaben der Server (nie der Absender – keine gefälschten Vorschauen).
-- Nur additiv; löscht sich mit der Nachricht (on delete cascade, auch beim Selbstlöschen). Rückweg: Tabelle bleibt ungenutzt, wenn der
-- Server 2.485.0 läuft; entfernen nur mit Hansis Freigabe.
create table if not exists public.kc_club_link_vorschau (
  message_id uuid primary key references public.kc_communication_messages(id) on delete cascade,
  url text not null check (url ~ '^https?://' and length(url) <= 2000),
  titel text check (length(titel) <= 200),
  text text check (length(text) <= 300),
  bild text check (bild is null or (bild ~ '^https://' and length(bild) <= 2000)),
  seite text check (length(seite) <= 100),
  erstellt_am timestamptz not null default now()
);
alter table public.kc_club_link_vorschau enable row level security;
revoke all on public.kc_club_link_vorschau from anon, authenticated;
grant select, insert, update, delete on public.kc_club_link_vorschau to service_role;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_link_vorschau', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-LINK-VORSCHAU (2.486.0): Vorschau-Karte zu Links in Nachrichten')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_link_vorschau') on conflict (table_name) do nothing;
