-- KC Club-App – Version 2.23.51
-- KC-CLUB-MITGLIEDER-FRAGEN (Wunsch Hansi): Bei „Frag Twinkey“ kann man eine Frage an andere Mitglieder stellen – an alle, einzelne oder
--   mehrere, verschickt per 📱 Club-App, 🔔 Push und/oder ✉️ E-Mail. Die Gefragten antworten mit eigenem Text oder tippen
--   „🤷 Ich weiß es nicht“, „🔎 Ich recherchiere und antworte dir“ oder „🚫 Bitte nicht mehr fragen“ (dann bekommen sie keine
--   Mitglieder-Fragen mehr; Einstellung „mitfragen“ in kc_club_person_einstellung, jederzeit umkehrbar).
-- Nichts wird gelöscht: Beenden = status 'erledigt'. Zugriff nur über den Server (kc-club), RLS an, keine Policies.
-- Rückweg: drop table kc_club_mitfrage_empfaenger; drop table kc_club_mitfragen; (Spiegel-/Resume-Regeln löschen)
create table if not exists kc_club_mitfragen (
  id uuid primary key default gen_random_uuid(),
  von text not null references kc_core_people(person_id),
  frage text not null check (char_length(frage) between 3 and 300),
  kanaele text[] not null default '{}' check (kanaele <@ array['app', 'push', 'email']::text[]),
  an_alle boolean not null default false,
  status text not null default 'offen' check (status in ('offen', 'erledigt')),
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create index if not exists kc_club_mitfragen_von on kc_club_mitfragen (von, erstellt_am);
create table if not exists kc_club_mitfrage_empfaenger (
  frage_id uuid not null references kc_club_mitfragen(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  status text not null default 'offen' check (status in ('offen', 'gelesen', 'weiss_nicht', 'recherchiere', 'beantwortet', 'nicht_fragen')),
  antwort text check (antwort is null or char_length(antwort) <= 2000),
  gelesen_am timestamptz,
  geantwortet_am timestamptz,
  primary key (frage_id, person_id),
  check (status <> 'beantwortet' or antwort is not null)
);
create index if not exists kc_club_mitfrage_empfaenger_person on kc_club_mitfrage_empfaenger (person_id, status);
alter table kc_club_mitfragen enable row level security;
alter table kc_club_mitfrage_empfaenger enable row level security;
revoke all on kc_club_mitfragen from anon, authenticated;
revoke all on kc_club_mitfrage_empfaenger from anon, authenticated;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_mitfragen', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-MITGLIEDER-FRAGEN (2.23.51): Fragen an Mitglieder'),
  ('kc_club_mitfrage_empfaenger', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-MITGLIEDER-FRAGEN (2.23.51): Empfänger + Antworten')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_mitfragen'), ('kc_club_mitfrage_empfaenger') on conflict (table_name) do nothing;
