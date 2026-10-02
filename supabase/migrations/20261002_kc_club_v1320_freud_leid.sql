-- KC Club-App – Version 1.32.0 (Wunsch Hansi 02.10.2026; Freigabe „1 nur Clubleitung, 2 100 Euro bei Todesfall, 3 ja fragen, 4 passt“)
-- KC-CLUB-FREUD-LEID: Fälle (Freude: Geburt, Hochzeit, Jubiläum …; Leid: Tod eines Mitglieds/Angehörigen, Krankheit …)
-- mit Checkliste (Was – Wer – Bis wann). Schritte mit Zuständigem werden als Aufgabe (kc_club_aufgaben) angelegt und so
-- mitgeteilt/erinnert wie bisher. Nur die Clubleitung sieht die Fälle (Zugriff nur über den Server, RLS ohne Policies).
-- Rückweg: beide Tabellen droppen (verknüpfte Aufgaben bleiben als normale Aufgaben bestehen); Spiegel-Regeln löschen.

create table if not exists kc_club_fl_faelle (
  id uuid primary key default gen_random_uuid(),
  art text not null check (char_length(art) between 1 and 30),
  person_id text references kc_core_people(person_id),
  notiz text check (notiz is null or char_length(notiz) <= 500),
  datum date,
  termin timestamptz,
  termin_ort text check (termin_ort is null or char_length(termin_ort) <= 120),
  betrag numeric(8,2) check (betrag is null or (betrag >= 0 and betrag <= 10000)),
  status text not null default 'offen' check (status in ('offen', 'abgeschlossen')),
  informiert_am timestamptz,
  aufruf_id uuid references kc_club_hilfe_aufrufe(id) on delete set null,
  erstellt_von text not null references kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  abgeschlossen_am timestamptz
);
create index if not exists kc_club_fl_faelle_status on kc_club_fl_faelle (status, erstellt_am desc);

create table if not exists kc_club_fl_schritte (
  id uuid primary key default gen_random_uuid(),
  fall_id uuid not null references kc_club_fl_faelle(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 200),
  wer text references kc_core_people(person_id),
  alle boolean not null default false,
  bis date,
  aufgabe_id uuid references kc_club_aufgaben(id) on delete set null,
  erledigt_am timestamptz,
  erledigt_von text references kc_core_people(person_id),
  sort smallint not null default 0
);
create index if not exists kc_club_fl_schritte_fall on kc_club_fl_schritte (fall_id, sort);

alter table kc_club_fl_faelle enable row level security;
alter table kc_club_fl_schritte enable row level security;
revoke all on kc_club_fl_faelle, kc_club_fl_schritte from anon, authenticated;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_fl_faelle', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-FREUD-LEID (1.32.0): Fälle – nur Clubleitung'),
  ('kc_club_fl_schritte', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-FREUD-LEID (1.32.0): Checklisten-Schritte')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_fl_faelle'), ('kc_club_fl_schritte') on conflict (table_name) do nothing;
