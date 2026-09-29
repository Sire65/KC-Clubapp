-- KC Club-App – Version 0.38.0
-- KC-CLUB-ERSTATTUNG: Antrag auf Erstattung (Fahrtkosten, vorgestreckter Einkauf, sonstige Auslagen) – geht per Mail an
-- Kassenwart (An) und Clubsprecher (CC), Antragsteller und Admin in BCC. Hier nur die Ablage für „Meine Anträge“.
create table if not exists kc_club_erstattung (
  id uuid primary key default gen_random_uuid(),
  person_id text not null,
  positionen jsonb not null,
  summe numeric(10,2) not null,
  km_satz numeric(6,2) not null,
  auszahlung text not null default 'ueberweisung' check (auszahlung in ('ueberweisung', 'bar')),
  bemerkung text,
  status text not null default 'eingereicht' check (status in ('eingereicht', 'erstattet', 'abgelehnt')),
  versand jsonb,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_erstattung_person on kc_club_erstattung (person_id, erstellt_am desc);
alter table kc_club_erstattung enable row level security;
