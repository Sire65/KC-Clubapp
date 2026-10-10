-- KC Club-App – Version 2.220.0 (Wunsch Hansi „ein Foto, das nur einmal angesehen werden darf – soll verhindern, dass Fotos missbraucht werden“)
-- KC-CLUB-EINMAL-FOTO: ein Foto im Chat darf jeder Empfänger genau einmal öffnen. Der Server gibt das Bild nur über die Aktion
-- „einmal_foto_ansehen“ heraus (nie als Link), merkt sich je Empfänger „gesehen“ (Primärschlüssel = nur einmal möglich) und löscht
-- die Bilddatei, sobald alle es gesehen haben bzw. spätestens nach 7 Tagen. Kein Weiterleiten, kein Archiv, kein Herunterladen.
-- Rückweg: drop table kc_club_einmal_foto_gesehen; drop table kc_club_einmal_foto;
create table if not exists kc_club_einmal_foto (
  attachment_id uuid primary key,
  message_id uuid not null references kc_communication_messages(id) on delete cascade,
  thread_id uuid not null references kc_communication_threads(id) on delete cascade,
  absender text not null,
  erstellt_am timestamptz not null default now(),
  entfernt_am timestamptz
);
create index if not exists kc_club_einmal_foto_offen_idx on kc_club_einmal_foto (erstellt_am) where entfernt_am is null;
alter table kc_club_einmal_foto enable row level security;
revoke all on kc_club_einmal_foto from anon, authenticated;

create table if not exists kc_club_einmal_foto_gesehen (
  attachment_id uuid not null references kc_club_einmal_foto(attachment_id) on delete cascade,
  person_id text not null,
  gesehen_am timestamptz not null default now(),
  primary key (attachment_id, person_id)
);
alter table kc_club_einmal_foto_gesehen enable row level security;
revoke all on kc_club_einmal_foto_gesehen from anon, authenticated;
