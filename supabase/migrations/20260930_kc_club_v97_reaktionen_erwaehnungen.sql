-- KC Club-App – Version 0.97.0
-- KC-CLUB-REAKTION: je Person höchstens EINE Reaktion (Emoji) je Nachricht – wie bei WhatsApp; nochmal tippen nimmt sie weg.
-- KC-CLUB-ERWAEHNUNG: @Erwähnungen in Gruppen – wer erwähnt wurde (für Hervorhebung und gezielte Benachrichtigung).
-- KC-CLUB-ANTWORT: nutzt die vorhandene Spalte kc_communication_messages.reply_to_message_id (KC Communicator, ON DELETE SET NULL)
--   – keine neue Tabelle.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Nachricht gelöscht → Reaktionen/Erwähnungen weg (cascade).
-- Rückweg: drop table kc_club_reaktionen; drop table kc_club_erwaehnungen;

create table if not exists kc_club_reaktionen (
  message_id uuid not null references kc_communication_messages(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  emoji text not null check (char_length(emoji) between 1 and 16),
  zeit timestamptz not null default now(),
  primary key (message_id, person_id)
);
create table if not exists kc_club_erwaehnungen (
  message_id uuid not null references kc_communication_messages(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  primary key (message_id, person_id)
);
create index if not exists kc_club_erwaehnungen_person on kc_club_erwaehnungen (person_id);
alter table kc_club_reaktionen enable row level security;
alter table kc_club_erwaehnungen enable row level security;
