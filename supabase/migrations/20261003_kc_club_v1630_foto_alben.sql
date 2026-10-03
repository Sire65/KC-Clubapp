-- KC Club-App – Version 1.63.0
-- KC-CLUB-FOTO-ALBEN (Wunsch Hansi): eigene Fotoalben mit Namen (z. B. „Weihnachtsmarkt 2026“).
--   Ein Album verweist nur auf Fotos aus dem Fotoalbum (keine Kopien → kein zusätzlicher Speicher).
--   sichtbar: 'privat' = nur wer es angelegt hat · 'alle' = alle Mitglieder (ändern: Besitzer und Clubleitung, prüft der Server).
--   Löschen eines Albums = Papierkorb (geloescht_am); die Fotos bleiben im Fotoalbum.
--   Wird ein Foto endgültig gelöscht (Wartung nach 30 Tagen Papierkorb), verschwindet es per Fremdschlüssel aus den Alben.
-- Rückweg: drop table kc_club_foto_album_fotos; drop table kc_club_foto_alben;

create table if not exists kc_club_foto_alben (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  jahr integer not null check (jahr between 1950 and 2100),
  sichtbar text not null default 'privat' check (sichtbar in ('privat', 'alle')),
  besitzer text not null references kc_core_people(person_id),
  titelfoto uuid references kc_club_fotos(id) on delete set null,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  geloescht_am timestamptz,
  geloescht_von text
);
create index if not exists kc_club_foto_alben_besitzer on kc_club_foto_alben (besitzer) where geloescht_am is null;
create index if not exists kc_club_foto_alben_alle on kc_club_foto_alben (jahr desc) where geloescht_am is null and sichtbar = 'alle';
alter table kc_club_foto_alben enable row level security;

create table if not exists kc_club_foto_album_fotos (
  album_id uuid not null references kc_club_foto_alben(id) on delete cascade,
  foto_id uuid not null references kc_club_fotos(id) on delete cascade,
  hinzugefuegt_von text not null,
  hinzugefuegt_am timestamptz not null default now(),
  primary key (album_id, foto_id)
);
create index if not exists kc_club_foto_album_fotos_foto on kc_club_foto_album_fotos (foto_id);
alter table kc_club_foto_album_fotos enable row level security;
-- Kein Zugriff für anon/authenticated: nur der Club-Server (service_role) liest und schreibt.
revoke all on kc_club_foto_alben, kc_club_foto_album_fotos from anon, authenticated;
