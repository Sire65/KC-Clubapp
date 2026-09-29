-- KC Club-App – Version 0.29.0
-- KC-CLUB-ONLINE: „Anklopfen“ – ein Mitglied fragt ein anderes (das gerade online ist) nach einem direkten Gespräch.
-- Online-Status selbst kommt aus kc_club_zugang.zuletzt_gesehen (wird bei jedem Aufruf gesetzt) + Einstellung „online“.
create table if not exists kc_club_anklopfen (
  id uuid primary key default gen_random_uuid(),
  von text not null,
  an text not null,
  erstellt_am timestamptz not null default now(),
  status text not null default 'offen' check (status in ('offen', 'angenommen', 'spaeter')),
  beantwortet_am timestamptz,
  thread_id uuid
);
create index if not exists kc_club_anklopfen_an on kc_club_anklopfen (an, erstellt_am desc);
create index if not exists kc_club_anklopfen_von on kc_club_anklopfen (von, erstellt_am desc);
alter table kc_club_anklopfen enable row level security;
