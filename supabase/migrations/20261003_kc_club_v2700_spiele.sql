-- KC Club-App – Version 2.7.0
-- KC-CLUB-SPIELE (Wunsch Hansi: „Spiele – Köcheclub Edition“): Tic-Tac-Toe 3×3 / 4×4 gegen andere Mitglieder.
--   Gegen den Computer läuft alles nur auf dem Gerät (nichts in der Datenbank). Hier nur Spiele zwischen zwei Mitgliedern:
--   Herausforderung → Annehmen/Ablehnen → abwechselnd ziehen. Später weitere Spiele (Schach, Bauernskat) über „spiel“.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Rückweg: drop table kc_club_spiele;
create table if not exists kc_club_spiele (
  id uuid primary key default gen_random_uuid(),
  spiel text not null default 'ttt' check (spiel in ('ttt')),
  groesse smallint not null check (groesse in (3, 4)),
  von text not null,                       -- wer herausgefordert hat
  an text not null,                        -- wer herausgefordert wurde
  spieler_x text not null,                 -- 🍅 beginnt
  spieler_o text not null,                 -- 🥦
  status text not null default 'angefragt' check (status in ('angefragt', 'laeuft', 'beendet', 'abgelehnt', 'abgebrochen')),
  brett text not null check (brett ~ '^[.xo]{9}$|^[.xo]{16}$'),
  dran text,
  gewinner text,                           -- person_id, 'remis' oder null
  linie text,                              -- Gewinnfelder, z. B. '0,4,8'
  aufgegeben boolean not null default false,
  zuege integer not null default 0,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  check (von <> an)
);
create index if not exists kc_club_spiele_von on kc_club_spiele (von, status);
create index if not exists kc_club_spiele_an on kc_club_spiele (an, status);
alter table kc_club_spiele enable row level security;
