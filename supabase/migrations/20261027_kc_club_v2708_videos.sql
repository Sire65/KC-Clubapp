-- 2.711.0 KC-CLUB-VIDEOS (Datei heißt noch v2708, in Supabase eingespielt als kc_club_v2708_videos am 27.10.2026) (Wunsch Hansi „einen Abspieler für Handy-Videos – Szenen vom Clubtreffen für alle hochladen, aufgeteilt nach Foto und Video“;
-- Wahl Hansi: bei Supabase bleiben, streng begrenzt): Videos im Fotoalbum unter „🎬 Videos“. Die App verkleinert jedes Video vor dem Hochladen
-- (720p, höchstens 60 Sekunden, höchstens 15 MB); für Videos zusammen höchstens 300 MB des kostenlosen 1-GB-Speichers. Die Datei selbst liegt wie
-- Fotos im Anlagen-Speicher (kc_communication_attachments), hier stehen nur die Angaben dazu. Eigene Tabelle, damit Startseite, „Neueste Fotos“,
-- Ablagekorb, Diashow usw. weiter nur Fotos sehen. Nur der Club-Server (service_role) liest und schreibt – RLS an, keine Richtlinien für Nutzer.
-- Rückweg: drop table public.kc_club_videos; (vorher die Dateien über die App löschen, sonst bleiben sie im Speicher liegen).
create table if not exists public.kc_club_videos (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid not null,
  vorschau_id uuid,
  thema text not null default '' check (char_length(thema) <= 60),
  datum date not null default current_date,
  bezug_art text check (bezug_art in ('treffen', 'aktion')),
  bezug_id text,
  beschreibung text not null default '' check (char_length(beschreibung) <= 300),
  dauer_sek numeric(6, 1) not null check (dauer_sek > 0 and dauer_sek <= 61),
  groesse bigint not null check (groesse > 0),
  mime text not null check (mime in ('video/mp4', 'video/webm')),
  hochgeladen_von text not null,
  hochgeladen_am timestamptz not null default now()
);
create index if not exists kc_club_videos_datum on public.kc_club_videos (datum desc, hochgeladen_am desc);
alter table public.kc_club_videos enable row level security;
revoke all on public.kc_club_videos from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_videos to service_role;
