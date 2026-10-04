-- KC Club-App – Version 2.22.11 (Wunsch Hansi)
-- KC-CLUB-HILFE-GESEHEN: wer hat einen Hilfe-Aufruf gesehen (an der Pinnwand als Aushang oder unter „Helfen & Leihen“)?
--   Wie bei Pinnwand-Zetteln (kc_club_pinnwand_gelesen): erste Zeit bleibt stehen. Sichtbar nur für den Verfasser und die Clubleitung.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Spiegel/Backup: automatische Aufnahme (KC-SPIEGEL-AUTO).
-- Rückweg: drop table kc_club_hilfe_gesehen;
create table if not exists kc_club_hilfe_gesehen (
  aufruf_id uuid not null references kc_club_hilfe_aufrufe (id) on delete cascade,
  person_id text not null,
  gesehen_am timestamptz not null default now(),
  primary key (aufruf_id, person_id)
);
alter table kc_club_hilfe_gesehen enable row level security;
revoke all on table kc_club_hilfe_gesehen from anon, authenticated;
