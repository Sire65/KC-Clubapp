-- Club-App 2.246.0 – KC-CLUB-VIDEO-BEWERTUNG (Wunsch Hansi 11.10.2026): am Ende jedes Erklär-Videos 👍/👎 „Gefallen?“ und „Hilft es weiter?“.
-- Je Mitglied, Video und Fassung (stand) eine Bewertung – erneutes Bewerten ersetzt sie. Auswertung nur für den Admin, nur Zahlen (keine Namen).
-- Nur über die Edge Function (service_role) – RLS an, keine Policies.
create table if not exists public.kc_club_video_bewertung (
  video text not null,
  stand text not null,
  person_id text not null,
  gefallen boolean,
  hilft boolean,
  zeit timestamptz not null default now(),
  primary key (video, stand, person_id)
);
alter table public.kc_club_video_bewertung enable row level security;
revoke all on public.kc_club_video_bewertung from anon, authenticated;

insert into public.kc_db_mirror_table_rules(table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note, updated_at)
values ('kc_club_video_bewertung', 'Club-App', 'normal', false, false, true, 'KC-CLUB-VIDEO-BEWERTUNG: Daumen hoch/runter zu den Erklär-Videos', now())
on conflict (table_name) do nothing;
