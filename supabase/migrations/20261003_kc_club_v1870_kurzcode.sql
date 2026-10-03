-- KC Club-App – Version 1.87.0
-- KC-CLUB-KURZCODE (Wunsch Hansi: Installation einfacher – kein langer Link zum Kopieren): 6-stelliger Code, mit dem sich eine
-- frisch installierte App (v. a. iPhone/iPad vom Home-Bildschirm) anmeldet. Erzeugt wird er auf einem Gerät, das schon angemeldet
-- ist (Link angetippt). Gültig 15 Minuten, nur einmal; der Schlüssel liegt bis dahin AES-GCM-verschlüsselt (Server-Geheimnis),
-- danach wird der Eintrag gelöscht. Fehlversuche werden gebremst (je Gerät/Netz und insgesamt).
-- Kein Zugriff für anon/authenticated – nur der Club-Server (service_role).
-- Rückweg: drop table kc_club_kurzcodes;
create table if not exists kc_club_kurzcodes (
  code_hash text primary key,
  person_id text not null references kc_core_people(person_id) on delete cascade,
  schluessel_enc text not null,
  erstellt_am timestamptz not null default now(),
  gueltig_bis timestamptz not null
);
create index if not exists kc_club_kurzcodes_person on kc_club_kurzcodes (person_id);
alter table kc_club_kurzcodes enable row level security;
revoke all on kc_club_kurzcodes from anon, authenticated;
