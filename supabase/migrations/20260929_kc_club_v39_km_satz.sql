-- KC Club-App – Version 0.39.0
-- KC-CLUB-KMSATZ: Kilometerpauschale für Erstattungen mit „gilt ab“-Datum (Admin). Jede Fahrt wird mit dem Satz berechnet,
-- der am Tag der Fahrt galt – spätere Änderungen verändern alte Fahrten nicht.
create table if not exists kc_club_km_satz (
  id uuid primary key default gen_random_uuid(),
  satz numeric(6,2) not null check (satz > 0 and satz <= 2),
  gilt_ab date not null unique,
  erstellt_von text not null,
  erstellt_am timestamptz not null default now()
);
alter table kc_club_km_satz enable row level security;
-- Voreinstellung: 0,38 € je km ab 01.01.2026
insert into kc_club_km_satz (satz, gilt_ab, erstellt_von) values (0.38, '2026-01-01', 'KC-P-002') on conflict (gilt_ab) do nothing;
