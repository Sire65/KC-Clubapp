-- KC Club-App – Version 0.31.0
-- KC-CLUB-ANRUF (Test): Sprechen per Ton direkt von App zu App (WebRTC). Der Server vermittelt nur den Verbindungsaufbau
-- (Angebot/Antwort, je ein SDP-Text); die Sprache selbst läuft direkt zwischen den Handys und wird nirgends gespeichert.
create table if not exists kc_club_anruf (
  id uuid primary key default gen_random_uuid(),
  von text not null,
  an text not null,
  art text not null default 'ton' check (art in ('ton', 'video')),
  status text not null default 'klingelt' check (status in ('klingelt', 'angenommen', 'abgelehnt', 'verpasst', 'beendet')),
  angebot text,
  antwort text,
  erstellt_am timestamptz not null default now(),
  angenommen_am timestamptz,
  beendet_am timestamptz,
  beendet_von text
);
create index if not exists kc_club_anruf_an on kc_club_anruf (an, erstellt_am desc);
create index if not exists kc_club_anruf_von on kc_club_anruf (von, erstellt_am desc);
alter table kc_club_anruf enable row level security;
