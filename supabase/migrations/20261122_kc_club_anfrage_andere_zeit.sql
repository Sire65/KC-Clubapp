-- KC-CLUB-ANFRAGE-ANDERE-ZEIT (22.11.2026, Wunsch Hansi „ist also eine Zusage, aber um eine andere Zeit“):
-- Neue Antwort „🕐 Ja, aber zu anderer Zeit“ (später kommen / früher gehen) – gespeichert als antwort = 'ja' plus eigene Zeit.
-- zeit_beginn = ab wann die Person kommt, zeit_ende = bis wann (leer = bis zum Ende). Zählt als Zusage.
-- Nicht zu verwechseln mit dem Gegenvorschlag (vorschlag_beginn/_ende), der den ganzen Termin verschieben will.
-- Nur Spalten ergänzen (bestehende Tabelle, Rechte bleiben wie sie sind). Keine Inhalte – es wird nichts nachgetragen.
-- Vor dem Server-Upload einspielen (fehlt sie, speichert der Server Ja/Nein/Vielleicht wie bisher und meldet bei „andere Zeit“ klar, dass es noch nicht geht).
-- Rückweg: alter table public.kc_club_terminanfrage_empfaenger drop column zeit_beginn, drop column zeit_ende;
alter table public.kc_club_terminanfrage_empfaenger add column if not exists zeit_beginn timestamptz;
alter table public.kc_club_terminanfrage_empfaenger add column if not exists zeit_ende timestamptz;
comment on column public.kc_club_terminanfrage_empfaenger.zeit_beginn is 'Zusage zu anderer Zeit: ab wann (nur bei antwort = ja) – KC-CLUB-ANFRAGE-ANDERE-ZEIT';
comment on column public.kc_club_terminanfrage_empfaenger.zeit_ende is 'Zusage zu anderer Zeit: bis wann (leer = bis zum Ende)';
