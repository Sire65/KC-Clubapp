-- KC Club-App – Version 2.23.6 (Entwurf 2.22.21) (Wunsch Hansi)
-- KC-CLUB-EINGANGSKORB: Erstattungen (Fahrtkosten/Auslagen), Dienstzeiten (Dienstwünsche aus der Club-App) und Vorschläge landen im
--   Büro-Eingangskorb der Clubleitung (Clubsprecher, Kassenwart, Admin – alle drei bekommen alles) und werden dort bearbeitet.
--   kc_club_eingang_stand merkt je Vorgang: wer hat zur Kenntnis genommen (je Stand/Revision), wann wurde die Clubleitung informiert
--   (Dienstwünsche erst, wenn das Mitglied 10 Min. nichts mehr geändert hat) und wohin wurde abgelegt (mehrere Ordner möglich).
--   kc_dp_wish_inbox (Vertrag mit DP2) bleibt unverändert – die Club-App merkt sich ihren Stand nur in der eigenen Tabelle.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Spiegel/Backup: automatische Aufnahme (KC-SPIEGEL-AUTO).
-- Rückweg: drop table kc_club_eingang_stand; alter table kc_club_erstattung drop column erledigt_von, drop column erledigt_am,
--   drop column antwort, drop column ausgezahlt;
create table if not exists kc_club_eingang_stand (
  art text not null check (art in ('erstattung', 'dienstwunsch', 'vorschlag', 'aenderung')),
  ref_id text not null,
  gemeldet_rev integer,                         -- Dienstwünsche: bis zu welcher Revision ist die Clubleitung informiert
  gemeldet_am timestamptz,
  kenntnis jsonb not null default '[]'::jsonb,  -- [{ "person_id": …, "am": …, "rev": … }]
  ablagen jsonb not null default '[]'::jsonb,   -- [{ "ordner_id": …, "register": …, "von": …, "am": … }]
  geaendert_am timestamptz not null default now(),
  primary key (art, ref_id)
);
alter table kc_club_eingang_stand enable row level security;
revoke all on table kc_club_eingang_stand from anon, authenticated;

alter table kc_club_erstattung
  add column if not exists erledigt_von text,
  add column if not exists erledigt_am timestamptz,
  add column if not exists antwort text check (antwort is null or char_length(antwort) <= 500),
  add column if not exists ausgezahlt text check (ausgezahlt is null or ausgezahlt in ('bar', 'ueberweisung'));
create index if not exists kc_club_erstattung_offen on kc_club_erstattung (status, erstellt_am desc);
