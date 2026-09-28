-- KC Club-App – Version 0.15.0
-- KC-CLUB-FOTOALBUM: Club-Fotos im Supabase-Dateispeicher (vorhandener Anlagen-Kern kc_communication_attachments + Bucket).
--   Je Foto: verkleinertes Bild (~250 KB) + kleine Vorschau; Thema, Aufnahmedatum, optional Anlass (Treffen oder Aktion aus dem KC Manager).
--   Löschen = Papierkorb (30 Tage wiederherstellbar), danach entfernt die Wartung die Dateien endgültig (Speicher wird frei).
-- kc_club_speicher_belegt(): belegter Dateispeicher des Projekts (für die Anzeige „x MB von 1 GB“), nur für den Server.

create table if not exists kc_club_fotos (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid not null references kc_communication_attachments(id),
  vorschau_id uuid references kc_communication_attachments(id),
  thema text not null default '',
  datum date not null,
  bezug_art text check (bezug_art in ('treffen','aktion')),
  bezug_id text,
  beschreibung text not null default '',
  groesse bigint not null default 0,
  hochgeladen_von text not null references kc_core_people(person_id),
  hochgeladen_am timestamptz not null default now(),
  geloescht_am timestamptz,
  geloescht_von text
);
create index if not exists kc_club_fotos_datum on kc_club_fotos (datum desc) where geloescht_am is null;
create index if not exists kc_club_fotos_bezug on kc_club_fotos (bezug_art, bezug_id) where geloescht_am is null;
alter table kc_club_fotos enable row level security;

create or replace function kc_club_speicher_belegt() returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce(sum((metadata->>'size')::bigint), 0)::bigint from storage.objects
$$;
revoke all on function kc_club_speicher_belegt() from public, anon, authenticated;
grant execute on function kc_club_speicher_belegt() to service_role;
