-- KC Club-App – Version 0.25.0
-- KC-CLUB-PINNWAND: kurze Zettel (max. 200 Zeichen) für mich / alle / bestimmte Personen, „wichtig“ erscheint beim Öffnen der App.
-- Je Person höchstens 3 Zettel gleichzeitig (Prüfung im Server). Gelesen/erledigt wird je Empfänger mit Zeit erfasst.
create table if not exists kc_club_pinnwand (
  id uuid primary key default gen_random_uuid(),
  person_id text not null,
  text text not null check (char_length(text) between 1 and 200),
  wichtig boolean not null default false,
  fuer text not null check (fuer in ('ich', 'alle', 'personen')),
  personen text[] not null default '{}',
  erstellt_am timestamptz not null default now(),
  entfernt_am timestamptz,
  entfernt_von text
);
create index if not exists kc_club_pinnwand_aktiv on kc_club_pinnwand (erstellt_am desc) where entfernt_am is null;
alter table kc_club_pinnwand enable row level security;

create table if not exists kc_club_pinnwand_gelesen (
  zettel_id uuid not null references kc_club_pinnwand(id) on delete cascade,
  person_id text not null,
  gesehen_am timestamptz not null default now(),
  erledigt_am timestamptz,
  primary key (zettel_id, person_id)
);
alter table kc_club_pinnwand_gelesen enable row level security;
