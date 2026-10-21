-- KC-CLUB-ANRUF-TURN (Server 2.563.0, 21.10.2026, Wunsch Hansi „als Sicherheit beim Anrufen und Video“): Vorrat an Zugangsdaten für den
-- Umleitungs-Server (TURN, Metered Free-Plan). Neue Zugangsdaten gelten bei Metered erst nach bis zu 2 Minuten – darum legt der Club-Server
-- sie vorher an und merkt sie sich hier (7 Tage gültig, ab 2 Tagen Restlaufzeit kommt ein neuer dazu). Nur der Club-Server (service_role).
-- Enthält ein Passwort (erlaubt nur das Weiterleiten über Metered) → nie gespiegelt, nicht in die Sicherung (wird jederzeit neu angelegt).
-- Rückweg: drop table public.kc_club_turn_vorrat; (der Server ruft dann wie bisher nur mit STUN an – keine weitere Änderung nötig)
create table if not exists public.kc_club_turn_vorrat (
  username text primary key,
  password text not null,
  gueltig_bis timestamptz not null,   -- Metered schaltet die Zugangsdaten danach ab
  nutzbar_ab timestamptz not null,    -- erst ab hier an die Apps geben (Verteilung bei Metered bis zu 2 Min.)
  erstellt_am timestamptz not null default now()
);
alter table public.kc_club_turn_vorrat enable row level security;
revoke all on public.kc_club_turn_vorrat from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_turn_vorrat to service_role;
comment on table public.kc_club_turn_vorrat is 'KC-CLUB-ANRUF-TURN: Zugangsdaten für den Umleitungs-Server (Metered) – nur Club-Server, nicht gespiegelt.';

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_turn_vorrat', 'club', 'secret', false, false, false, 'KC-CLUB-ANRUF-TURN: Zugangsdaten Umleitungs-Server – bewusst nicht gespiegelt')
on conflict (table_name) do update set mirror_enabled = false, backup_enabled = false, sensitivity = 'secret', note = excluded.note;
