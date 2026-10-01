-- KC Club-App – Version 1.23.0 (Wunsch Hansi 01.10.2026)
-- KC-CLUB-LEIHEN   „📦 Ausleihen“: Vereinsgegenstände anfragen (Stehtische, Pavillon …). Anfrage geht an Clubsprecher,
--                  Kassenwart und Admin – eine Zusage genügt. Antrag + Bescheid landen als Textdatei im Vereinsordner
--                  „Admin <Jahr>“ (Register „Ausleihe“) und im persönlichen Ordner des Mitglieds (Register „Ausleihe“).
-- KC-CLUB-HELFEN   „🙋 Wer kann helfen?“: Hilfe-Aufruf (Was/Wann/Wie viele/Wo) an alle oder an alle gerade online;
--                  Antwort per Knopf „✋ Ich komme“ / „🙅 Kann nicht“.
-- KC-CLUB-SPENDE   Vorschläge: neue Art „spende“ mit einem oder mehreren Spendenprojekten (Empfänger + Betrag).
-- Zugriff nur über den Server (kc-club), RLS an, keine Policies. Spiegel/Sicherung wie die übrigen Club-Tabellen.
-- Rückweg: die vier neuen Tabellen droppen (Spiegel-Regeln löschen); alter table kc_club_vorschlaege drop column spenden;
--          art-Check wieder auf ('thema','abstimmung') – vorher Vorschläge mit art 'spende' sichern/entfernen.

-- Gegenstände (Bestand pflegt die Clubleitung in der App)
create table if not exists kc_club_leih_gegenstaende (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  sym text not null default '📦' check (char_length(sym) between 1 and 8),
  anzahl integer not null check (anzahl between 0 and 999),
  aktiv boolean not null default true,
  sort integer not null default 0,
  geaendert_am timestamptz not null default now()
);
create unique index if not exists kc_club_leih_gegenstaende_name on kc_club_leih_gegenstaende (lower(name));

insert into kc_club_leih_gegenstaende (name, sym, anzahl, sort) values
  ('Stehtische', '🪑', 8, 10), ('Bierzeltgarnitur', '🍻', 4, 20), ('Pavillon', '⛺', 2, 30),
  ('Zapfanlage', '🍺', 1, 40), ('Glühweintopf', '🍷', 2, 50), ('Kühlbox', '❄️', 3, 60),
  ('Gastrobräter', '🔥', 1, 70), ('Warmhaltebehälter', '🍲', 4, 80), ('Kabeltrommel', '🔌', 3, 90)
on conflict do nothing;

create table if not exists kc_club_ausleihen (
  id uuid primary key default gen_random_uuid(),
  person_id text not null references kc_core_people(person_id),
  -- [{id, name, sym, anzahl}] – Name wird mitgespeichert, damit alte Anträge lesbar bleiben
  positionen jsonb not null check (jsonb_typeof(positionen) = 'array' and jsonb_array_length(positionen) between 1 and 20),
  abholung date not null,
  abholung_slot text check (abholung_slot is null or char_length(abholung_slot) <= 20),
  rueckgabe date not null,
  rueckgabe_slot text check (rueckgabe_slot is null or char_length(rueckgabe_slot) <= 20),
  zweck text check (zweck is null or char_length(zweck) <= 20),
  notiz text check (notiz is null or char_length(notiz) <= 500),
  status text not null default 'angefragt' check (status in ('angefragt', 'genehmigt', 'abgelehnt', 'abgeholt', 'zurueck', 'storniert')),
  entschieden_von text references kc_core_people(person_id),
  entschieden_am timestamptz,
  grund text check (grund is null or char_length(grund) <= 300),
  erinnert_am timestamptz,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  check (rueckgabe >= abholung)
);
create index if not exists kc_club_ausleihen_zeit on kc_club_ausleihen (rueckgabe, abholung) where status in ('angefragt', 'genehmigt', 'abgeholt');
create index if not exists kc_club_ausleihen_person on kc_club_ausleihen (person_id, erstellt_am desc);

create table if not exists kc_club_hilfe_aufrufe (
  id uuid primary key default gen_random_uuid(),
  von text not null references kc_core_people(person_id),
  art text not null check (char_length(art) between 1 and 20),
  datum date not null,
  slot text check (slot is null or char_length(slot) <= 20),
  anzahl smallint not null default 1 check (anzahl between 1 and 20),
  ort text check (ort is null or char_length(ort) <= 80),
  notiz text check (notiz is null or char_length(notiz) <= 300),
  ziel text not null default 'alle' check (ziel in ('alle', 'online')),
  voll_gemeldet_am timestamptz,
  geschlossen_am timestamptz,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_hilfe_aufrufe_datum on kc_club_hilfe_aufrufe (datum desc);

create table if not exists kc_club_hilfe_antworten (
  aufruf_id uuid not null references kc_club_hilfe_aufrufe(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  antwort text not null check (antwort in ('komme', 'kann_nicht')),
  am timestamptz not null default now(),
  primary key (aufruf_id, person_id)
);

alter table kc_club_leih_gegenstaende enable row level security;
alter table kc_club_ausleihen enable row level security;
alter table kc_club_hilfe_aufrufe enable row level security;
alter table kc_club_hilfe_antworten enable row level security;
revoke all on kc_club_leih_gegenstaende, kc_club_ausleihen, kc_club_hilfe_aufrufe, kc_club_hilfe_antworten from anon, authenticated;

-- Spendenprojekte in Vorschlägen: [{empfaenger, betrag}]
alter table kc_club_vorschlaege add column if not exists spenden jsonb;
alter table kc_club_vorschlaege drop constraint if exists kc_club_vorschlaege_art_check;
alter table kc_club_vorschlaege add constraint kc_club_vorschlaege_art_check check (art in ('thema', 'abstimmung', 'spende'));
alter table kc_club_vorschlaege drop constraint if exists kc_club_vorschlaege_spenden_check;
alter table kc_club_vorschlaege add constraint kc_club_vorschlaege_spenden_check check (
  (art = 'spende' and jsonb_typeof(spenden) = 'array' and jsonb_array_length(spenden) between 1 and 10) or (art <> 'spende' and spenden is null));

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_leih_gegenstaende', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-LEIHEN (1.23.0): Bestand'),
  ('kc_club_ausleihen', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-LEIHEN (1.23.0): Anfragen'),
  ('kc_club_hilfe_aufrufe', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-HELFEN (1.23.0): ort = Treffpunkt (Freitext/Auswahl), kein GPS'),
  ('kc_club_hilfe_antworten', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-HELFEN (1.23.0): Antworten')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values
  ('kc_club_leih_gegenstaende'), ('kc_club_ausleihen'), ('kc_club_hilfe_aufrufe'), ('kc_club_hilfe_antworten')
on conflict (table_name) do nothing;
