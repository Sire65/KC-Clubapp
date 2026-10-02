-- KC Club-App – Version 1.43.0 (Wunsch Hansi 02.10.2026; Freigabe „1 ja, 2 ja, 3 b, 30 Tage mit Verlängerung, 3 Tage vorher Erinnerung“)
-- KC-CLUB-BOERSE  „🛍️ Börse“ (dritter Reiter in Helfen & Leihen): Biete / Suche, Rubrik, Preis-Art, bis 3 Fotos.
--                 Laufzeit 30 Tage; 3 Tage vorher Erinnerung („verlängern bis … oder auslaufen lassen“); Verlängerung möglich.
--                 Treffer: neue Anzeige passt (Stichwort) zu einer Gegen-Anzeige → deren Ersteller bekommt einmal Bescheid.
--                 Bezahlt wird privat, nicht über die App. Clubleitung kann Anzeigen entfernen.
-- Zugriff nur über den Server (kc-club), RLS an, keine Policies. Spiegel/Sicherung wie die übrigen Club-Tabellen.
-- Rückweg: drop table kc_club_boerse_treffer; drop table kc_club_boerse; (Spiegel-/Resume-Regeln löschen; Fotos im Bucket
--          club/<person>/… bleiben als normale Anlagen erhalten)
create table if not exists kc_club_boerse (
  id uuid primary key default gen_random_uuid(),
  von text not null references kc_core_people(person_id),
  art text not null check (art in ('biete', 'suche')),
  rubrik text not null check (char_length(rubrik) between 1 and 20),
  titel text not null check (char_length(titel) between 2 and 80),
  text text check (text is null or char_length(text) <= 600),
  preis_art text not null default 'vb' check (preis_art in ('verschenken', 'preis', 'vb', 'tausch')),
  preis numeric(8,2) check (preis is null or (preis >= 0 and preis <= 99999)),
  fotos jsonb not null default '[]'::jsonb check (jsonb_typeof(fotos) = 'array' and jsonb_array_length(fotos) <= 3),
  status text not null default 'aktiv' check (status in ('aktiv', 'erledigt', 'abgelaufen', 'geloescht')),
  laeuft_bis date not null,
  erinnert_am timestamptz,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create index if not exists kc_club_boerse_aktiv on kc_club_boerse (status, laeuft_bis);
create index if not exists kc_club_boerse_von on kc_club_boerse (von, erstellt_am desc);
create table if not exists kc_club_boerse_treffer (
  anzeige_id uuid not null references kc_club_boerse(id) on delete cascade,
  gegen_id uuid not null references kc_club_boerse(id) on delete cascade,
  am timestamptz not null default now(),
  primary key (anzeige_id, gegen_id)
);
alter table kc_club_boerse enable row level security;
alter table kc_club_boerse_treffer enable row level security;
revoke all on kc_club_boerse, kc_club_boerse_treffer from anon, authenticated;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_boerse', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-BOERSE (1.43.0): Anzeigen Biete/Suche'),
  ('kc_club_boerse_treffer', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-BOERSE (1.43.0): schon gemeldete Treffer')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_boerse'), ('kc_club_boerse_treffer') on conflict (table_name) do nothing;
