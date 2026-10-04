-- KC Club-App – Version 2.23.34 (Wunsch Hansi)
-- KC-CLUB-HILFE-BEWERTUNG: Unter jeder Hilfe im Hilfe-Zentrum „Hat dir das weitergeholfen? 👍 Ja / 👎 Nein“ (bei Nein freiwillig: was hat gefehlt?).
--   Je Person und Hilfe eine Zeile (ändern = überschreiben, zurücknehmen = löschen). Der Admin sieht nur Summen und die Hinweise OHNE Namen.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Spiegel/Backup: automatische Aufnahme (KC-SPIEGEL-AUTO).
-- Rückweg: drop table kc_club_hilfe_bewertung;
create table if not exists kc_club_hilfe_bewertung (
  person_id text not null,
  hilfe_id text not null check (hilfe_id ~ '^[a-z]:[a-z0-9_-]{1,48}$') -- h: Hilfe, t: Tipp, e: Einweisung,
  wert smallint not null check (wert in (-1, 1)),
  notiz text check (notiz is null or char_length(notiz) <= 300),
  geaendert_am timestamptz not null default now(),
  primary key (person_id, hilfe_id)
);
create index if not exists kc_club_hilfe_bewertung_hilfe on kc_club_hilfe_bewertung (hilfe_id);
alter table kc_club_hilfe_bewertung enable row level security;
revoke all on table kc_club_hilfe_bewertung from anon, authenticated;
