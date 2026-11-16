-- KC-CLUB-KLUGE-HELFER (16.11.2026, Wunsch Hansi „Baue alle Vorschläge, aber logisch, bedienerfreundlich, nicht überladen“):
-- „⏰ Erinnern“ an eine Chat-Nachricht nutzt die vorhandene Wecker-Tabelle (2.640.0 KC-CLUB-UHR-WECKER) mit der neuen Art „nachricht“.
-- Gespeichert werden nur die Zeit, die Kennungen von Chat und Nachricht und „Nachricht von <Vorname>“ – nie der Nachrichtentext.
-- Der Minuten-Zeitplan „kc-club-geplant-minute“ schaut schon auf fällige Zeilen in kc_club_wecker – er bleibt unverändert.
-- Keine neue Tabelle; Rechte wie bisher nur für den Club-Server (service_role), RLS bleibt an.
-- Rückweg: Zeilen der Art „nachricht“ löschen, die beiden Spalten entfernen, Prüfung wieder auf ('wecker','timer') setzen.
alter table public.kc_club_wecker add column if not exists thread_id text;
alter table public.kc_club_wecker add column if not exists message_id text;
alter table public.kc_club_wecker drop constraint if exists kc_club_wecker_art_check;
alter table public.kc_club_wecker add constraint kc_club_wecker_art_check check (art in ('wecker','timer','nachricht'));
alter table public.kc_club_wecker drop constraint if exists kc_club_wecker_nachricht_check;
alter table public.kc_club_wecker add constraint kc_club_wecker_nachricht_check check (art <> 'nachricht' or (thread_id is not null and message_id is not null));
create index if not exists kc_club_wecker_nachricht on public.kc_club_wecker (person_id, message_id) where status = 'offen' and art = 'nachricht';
alter table public.kc_club_wecker enable row level security;
revoke all on public.kc_club_wecker from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_wecker to service_role;
