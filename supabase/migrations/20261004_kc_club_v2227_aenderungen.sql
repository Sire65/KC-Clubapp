-- KC Club-App – Version 2.22.7 (Wunsch Hansi)
-- KC-CLUB-AENDERUNG: „✏️ Meine Daten haben sich geändert“ – Mitglied meldet eine Änderung (Anschrift, Name, Handy, Festnetz, E-Mail,
--   Bankverbindung, Geburtsdatum, Notfallkontakt, Kleidergröße, Mitgliedschaft, Sonstiges). Die Meldung geht je Art an Clubsprecher /
--   Kassenwart / Admin (Push + Mail) und steht im Büro unter „📬 Änderungen“, bis jemand sie nach dem Eintragen (KC Manager) als erledigt
--   markiert – dann bekommt das Mitglied eine Rückmeldung. Kleidergröße (Kochjacke/Kochhose) wird nur hier geführt (Größen-Übersicht).
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Spiegel/Backup: automatische Aufnahme (KC-SPIEGEL-AUTO).
-- Rückweg: drop table kc_club_aenderungen;
create table if not exists kc_club_aenderungen (
  id uuid primary key default gen_random_uuid(),
  person_id text not null,
  art text not null check (art in ('anschrift', 'name', 'handy', 'festnetz', 'mail', 'bank', 'geburtstag', 'notfall', 'kleidung', 'mitgliedschaft', 'sonstiges')),
  alt jsonb,                               -- bisheriger Stand (zum Vergleich für die Empfänger)
  neu jsonb not null,                      -- gemeldete neue Angaben
  gilt_ab date,
  bemerkung text check (bemerkung is null or char_length(bemerkung) <= 1000),
  empfaenger text[] not null default '{}', -- person_ids, die die Meldung sehen und erledigen dürfen
  an_alle boolean not null default false,  -- Mitglied wollte allen Bescheid sagen (nur Anschrift/Handy/Festnetz/E-Mail)
  status text not null default 'offen' check (status in ('offen', 'erledigt', 'zurueckgezogen')),
  erledigt_von text,
  erledigt_am timestamptz,
  antwort text check (antwort is null or char_length(antwort) <= 500),
  versand jsonb,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_aenderungen_person on kc_club_aenderungen (person_id, erstellt_am desc);
create index if not exists kc_club_aenderungen_offen on kc_club_aenderungen (status, erstellt_am desc);
alter table kc_club_aenderungen enable row level security;
revoke all on table kc_club_aenderungen from anon, authenticated;
