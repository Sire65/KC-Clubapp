-- KC Club-App – Version 0.19.0
-- KC-CLUB-KACHELN: persönliche Oberflächen-Einstellungen je Mitglied (zuerst: Reihenfolge/ausgeblendete Kacheln der Startseite).
-- Allgemein gehalten (Schlüssel + JSON-Wert), damit spätere Einstellungen (z. B. Farben) keine neue Tabelle brauchen.
-- Zugriff nur über die Edge Function (service_role); erlaubte Schlüssel prüft der Server.
create table if not exists kc_club_person_einstellung (
  person_id text not null,
  schluessel text not null,
  wert jsonb not null default '{}'::jsonb,
  geaendert_am timestamptz not null default now(),
  primary key (person_id, schluessel)
);
alter table kc_club_person_einstellung enable row level security;
