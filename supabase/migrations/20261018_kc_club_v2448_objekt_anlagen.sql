-- KC-CLUB-OBJEKT-ANLAGEN (2.448.0, Wunschliste #10, Wunsch Hansi „bei allen Möglichkeiten soll man eine Anlage mit hochladen – Foto, PDF oder
-- Dateimanager; bei Vorschlägen z. B. eine Skizze, bei Spenden z. B. einen Flyer des Spendenempfängers“).
-- Verknüpft vorhandene Anlagen (kc_communication_attachments, gleiche Ablage wie im Chat) mit einem Vorschlag/Spendenprojekt, einer
-- Terminfindung oder einer Terminanfrage. Höchstens 5 je Eintrag (prüft der Server). Sehen darf sie, wer den Eintrag sehen darf.
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated.
-- Rückweg: drop table public.kc_club_objekt_anlagen;
create table if not exists public.kc_club_objekt_anlagen (
  art text not null check (art in ('vorschlag', 'terminumfrage', 'terminanfrage')),
  objekt_id uuid not null,
  attachment_id uuid not null,
  reihenfolge smallint not null default 0,
  erstellt_am timestamptz not null default now(),
  primary key (art, objekt_id, attachment_id)
);
create index if not exists kc_club_objekt_anlagen_datei on public.kc_club_objekt_anlagen (attachment_id);
alter table public.kc_club_objekt_anlagen enable row level security;
revoke all on public.kc_club_objekt_anlagen from anon, authenticated;
grant select, insert, delete on public.kc_club_objekt_anlagen to service_role;
