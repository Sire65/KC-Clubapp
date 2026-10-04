-- KC Club-App – Version 2.23.22 (Wunsch Hansi)
-- KC-CLUB-ERINNERUNG-WAHL: Jede Person stellt zu einer Terminanfrage (auch Spiel-Termine) ihre eigene Erinnerung ein –
--   wann (15/30/60/120 Min. vorher, zusätzlich am Vortag) und wie (Push, E-Mail). Kalender-Eintrag mit Alarm macht die App selbst
--   (Datei für den Handy-Kalender) und braucht keine Tabelle. Ohne eigene Zeile gilt wie bisher die Erinnerung der Anfrage.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Spiegel/Backup: automatische Aufnahme (KC-SPIEGEL-AUTO).
-- Rückweg: drop table kc_club_erinnerungen;
create table if not exists kc_club_erinnerungen (
  person_id text not null,
  anfrage_id uuid not null references kc_club_terminanfragen (id) on delete cascade,
  minuten integer not null default 60 check (minuten in (0, 15, 30, 60, 120)), -- 0 = keine Erinnerung kurz vorher
  vortag boolean not null default true,
  wege text[] not null default '{push}' check (wege <@ array['push', 'email']::text[]),
  gesendet_am timestamptz,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  primary key (person_id, anfrage_id)
);
create index if not exists kc_club_erinnerungen_offen on kc_club_erinnerungen (anfrage_id) where gesendet_am is null;
alter table kc_club_erinnerungen enable row level security;
revoke all on table kc_club_erinnerungen from anon, authenticated;
