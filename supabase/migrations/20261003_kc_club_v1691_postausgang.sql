-- KC Club-App – Version 1.69.1
-- KC-CLUB-POSTAUSGANG (Wunsch Hansi: Steven die Erstattungs-Bestätigung nachträglich schicken): Nachrichten, die der Club-Server
-- beim nächsten Wartungslauf (alle 15 Min.) über den normalen Versandweg (KC Communicator) verschickt. Nur der Server (service_role)
-- liest und schreibt; jede Zeile hält fest, wer sie veranlasst hat und was beim Versand herauskam (Audit).
-- Rückweg: drop table kc_club_postausgang;
create table if not exists kc_club_postausgang (
  id uuid primary key default gen_random_uuid(),
  person_id text not null references kc_core_people(person_id),
  art text not null check (art in ('erstattung_bestaetigung')),
  bezug text not null,
  hinweis text not null default '' check (char_length(hinweis) <= 500),
  veranlasst_von text not null references kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  gesendet_am timestamptz,
  ergebnis jsonb
);
create index if not exists kc_club_postausgang_offen on kc_club_postausgang (erstellt_am) where gesendet_am is null;
alter table kc_club_postausgang enable row level security;
revoke all on kc_club_postausgang from anon, authenticated;
