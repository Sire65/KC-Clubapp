-- KC Club-App – Version 2.23.50
-- KC-CLUB-TERMINANFRAGE-STATUS (Wunsch Hansi): Wer anfragt, sieht je Empfänger den Stand –
--   📨 angefragt · 👁️ gelesen · ✅ bestätigt · 🤔 vielleicht · ❌ abgelehnt · 🔄 Gegenvorschlag · ⌛ abgelaufen.
--   gelesen_am: die Anfrage wurde beim Empfänger in den Terminen angezeigt.
--   vorschlag_beginn/_ende: Gegenvorschlag des Empfängers (andere Zeit); wer angefragt hat, nimmt ihn an oder lehnt ab.
-- Nur Spalten ergänzt; vorhandene Daten bleiben unverändert. Zugriff weiter nur über die Edge Function.
-- Rückweg: alter table kc_club_terminanfrage_empfaenger drop column gelesen_am, drop column vorschlag_beginn, drop column vorschlag_ende;
alter table kc_club_terminanfrage_empfaenger add column if not exists gelesen_am timestamptz;
alter table kc_club_terminanfrage_empfaenger add column if not exists vorschlag_beginn timestamptz;
alter table kc_club_terminanfrage_empfaenger add column if not exists vorschlag_ende timestamptz;
alter table kc_club_terminanfrage_empfaenger drop constraint if exists kc_club_terminanfrage_empfaenger_vorschlag_check;
alter table kc_club_terminanfrage_empfaenger add constraint kc_club_terminanfrage_empfaenger_vorschlag_check
  check (vorschlag_ende is null or (vorschlag_beginn is not null and vorschlag_ende >= vorschlag_beginn));
