-- 3.30.0 KC-CLUB-SAMMELMAIL (Wunsch Hansi 25.11.2026 nach Thomas: „13 E-Mails seit gestern“ – „bau die Sammelmail, die ist gut für alle, aber in Einstellungen anhaken“).
-- Wer „📬 Sammel-E-Mail“ anhakt (kc_club_person_einstellung „sammelmail“ {an, takt}), bekommt Chat-Benachrichtigungen per E-Mail nicht mehr einzeln:
-- der Club-Server legt sie hier ab und schickt sie zum nächsten Termin (9/12/15/18/21 Uhr bzw. 18 Uhr) als EINE Mail, danach werden die Zeilen gelöscht
-- (spätestens nach 14 Tagen). Nur der Club-Server (service_role) liest und schreibt; kein Spiegel, keine Sicherung (kurzlebige Versandschlange).
-- Rückweg: drop table public.kc_club_sammelmail; delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_sammelmail';
create table if not exists public.kc_club_sammelmail (
  id uuid primary key default gen_random_uuid(),
  person_id text not null,
  korrelation text,
  titel text not null,
  kurz text,
  text text,
  url text,
  anlagen integer not null default 0 check (anlagen >= 0),
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_sammelmail_person on public.kc_club_sammelmail (person_id, erstellt_am);
alter table public.kc_club_sammelmail enable row level security;
revoke all on public.kc_club_sammelmail from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_sammelmail to service_role;
comment on table public.kc_club_sammelmail is 'KC-CLUB-SAMMELMAIL: gesammelte Chat-Benachrichtigungen je Mitglied bis zum nächsten Sammel-Termin (nur Club-Server; wird nach Versand gelöscht).';
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_sammelmail', 'Club-App', 'sensitive', false, false, false, 'KC-CLUB-SAMMELMAIL: kurzlebige Versandschlange (Texte wie in den Einzel-Mails), wird nach Versand gelöscht – nicht spiegeln, nicht sichern')
on conflict (table_name) do nothing;
