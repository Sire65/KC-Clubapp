-- KC-CLUB-ANFRAGE-VORSCHLAG-BLEIBT (22.11.2026, Wunsch Hansi): Ein Gegenvorschlag bleibt sichtbar, wenn die Person danach mit Ja/Nein/Vielleicht
-- antwortet oder der Anfragende über ihn entscheidet. vorschlag_beginn/_ende bleiben der OFFENE Vorschlag (Annehmen/Ablehnen);
-- vorschlag_alt_* ist der FRÜHERE Vorschlag (nur Hinweis „🔄 hatte … vorgeschlagen“), Status angenommen/abgelehnt oder leer (durch Antwort abgelöst).
-- Nur Spalten ergänzen (bestehende Tabelle, Rechte bleiben wie sie sind). Keine Inhalte – es wird nichts nachgetragen.
-- Vor dem Server-Upload einspielen (der Server speichert sonst ohne die Spalten weiter wie bisher).
-- Rückweg: alter table public.kc_club_terminanfrage_empfaenger drop column vorschlag_alt_beginn, drop column vorschlag_alt_ende,
--           drop column vorschlag_alt_am, drop column vorschlag_alt_status;
alter table public.kc_club_terminanfrage_empfaenger add column if not exists vorschlag_alt_beginn timestamptz;
alter table public.kc_club_terminanfrage_empfaenger add column if not exists vorschlag_alt_ende timestamptz;
alter table public.kc_club_terminanfrage_empfaenger add column if not exists vorschlag_alt_am timestamptz;
alter table public.kc_club_terminanfrage_empfaenger add column if not exists vorschlag_alt_status text
  check (vorschlag_alt_status is null or vorschlag_alt_status in ('angenommen', 'abgelehnt'));
comment on column public.kc_club_terminanfrage_empfaenger.vorschlag_alt_beginn is 'früherer Gegenvorschlag (abgelöst durch Antwort oder entschieden) – nur Hinweis (KC-CLUB-ANFRAGE-VORSCHLAG-BLEIBT)';
comment on column public.kc_club_terminanfrage_empfaenger.vorschlag_alt_am is 'wann der frühere Gegenvorschlag gemacht wurde';
comment on column public.kc_club_terminanfrage_empfaenger.vorschlag_alt_status is 'angenommen / abgelehnt / leer (durch Ja-Nein-Vielleicht abgelöst)';
