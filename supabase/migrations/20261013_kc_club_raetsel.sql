-- KC Club-App – Version 2.339.0 (Wunsch Hansi)
-- KC-CLUB-RAETSEL: Bilderrätsel „Wie gut kennst du Werne?“ auf der Rückseite (Eselsohr) – Bild wird Pixel für Pixel schärfer, roter Buzzer,
--   6 Antworten. Wochen-Rätsel: alle bekommen dieselben 5 Bilder, je Person und Woche zählt der erste Durchgang für die Club-Bestenliste.
--   Eigene Rätselbilder: der Admin wählt Fotos aus dem Club-Album und gibt die Lösung ein.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Spiegel/Backup: automatische Aufnahme (KC-SPIEGEL-AUTO).
-- Rückweg: drop table kc_club_raetsel_ergebnis; drop table kc_club_raetsel_motiv;
create table if not exists kc_club_raetsel_ergebnis (
  person_id text not null,
  woche text not null check (woche ~ '^\d{4}-W\d{2}$'),
  punkte integer not null check (punkte between 0 and 5000),
  richtig smallint not null check (richtig between 0 and 5),
  bilder text[] not null default '{}',
  gespielt_am timestamptz not null default now(),
  primary key (person_id, woche)
);
create index if not exists kc_club_raetsel_ergebnis_woche on kc_club_raetsel_ergebnis (woche, punkte desc);
alter table kc_club_raetsel_ergebnis enable row level security;
revoke all on table kc_club_raetsel_ergebnis from anon, authenticated;
grant select, insert, update, delete on public.kc_club_raetsel_ergebnis to service_role;

create table if not exists kc_club_raetsel_motiv (
  id uuid primary key default gen_random_uuid(),
  foto_id text not null,
  antwort text not null check (char_length(antwort) between 2 and 60),
  info text check (info is null or char_length(info) <= 200),
  erstellt_von text not null,
  erstellt_am timestamptz not null default now()
);
alter table kc_club_raetsel_motiv enable row level security;
revoke all on table kc_club_raetsel_motiv from anon, authenticated;
grant select, insert, update, delete on public.kc_club_raetsel_motiv to service_role;
