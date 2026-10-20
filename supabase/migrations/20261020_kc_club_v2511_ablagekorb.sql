-- KC-CLUB-ABLAGEKORB (2.511.0, Wunsch Hansi „In anderen Programmen gibt es Teilen – Dokumente, Fotos. Die Club-App braucht eine Art Eingangskorb,
-- um so etwas anzunehmen und erst mal abzulegen. Info an Admin … dann zeigen und ich entscheide: Fotoalbum, Ordner, löschen, in Chats
-- weiterleiten, als Aufgabe delegieren, als Vorschlag für die nächste Sitzung, Weitergabe an Clubsprecher …“; Wahl Hansi: alle Mitglieder
-- dürfen teilen, alles kommt zuerst in den Korb). Je geteiltem Paket eine Zeile: wer, Text, Liste der hochgeladenen Anlagen
-- (kc_communication_attachments, liegen schon im Speicher). Nur der Club-Server (service_role) liest/schreibt.
-- Erledigte Einträge räumt der Server nach 14 Tagen weg (samt Original-Anlagen, die nirgends sonst hängen).
-- Rückweg: drop table public.kc_club_ablagekorb; (der Server fällt dann auf das bisherige Teilen-Menü zurück)
create table if not exists public.kc_club_ablagekorb (
  id uuid primary key default gen_random_uuid(),
  von text not null,
  titel text check (titel is null or length(titel) <= 200),
  text text check (text is null or length(text) <= 4000),
  anlagen jsonb not null default '[]'::jsonb check (jsonb_typeof(anlagen) = 'array' and jsonb_array_length(anlagen) <= 10),
  status text not null default 'offen' check (status in ('offen', 'erledigt')),
  ergebnis text check (ergebnis is null or length(ergebnis) <= 300),
  erledigt_von text,
  erledigt_am timestamptz,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_ablagekorb_status on public.kc_club_ablagekorb (status, erstellt_am desc);
alter table public.kc_club_ablagekorb enable row level security;
revoke all on public.kc_club_ablagekorb from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_ablagekorb to service_role;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_ablagekorb', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-ABLAGEKORB (2.511.0): mit der Club-App geteilte Fotos/Dokumente, bis der Admin entscheidet')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_ablagekorb') on conflict (table_name) do nothing;
