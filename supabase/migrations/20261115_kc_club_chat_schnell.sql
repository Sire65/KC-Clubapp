-- KC-CLUB-CHAT-SCHNELL (15.11.2026, Wunsch Hansi „mach die Chats schnell“): Beim Öffnen eines Chats suchen kc_club_unterhaltung_paket und
-- kc_club_chat_stand die Push-/Mail-Aufträge der eigenen Nachrichten über correlation_id ('club-nachricht:<id>' bzw. ':push'). Dafür gab es
-- kein Verzeichnis – jedes Öffnen ging zweimal die ganze Auftragsliste (≈4.000 Zeilen, 7,6 MB, wächst mit jeder Push) durch.
-- Nur ein Verzeichnis, keine Daten geändert, nichts gelöscht. Rückweg: drop index if exists public.kc_communication_requests_correlation_idx;
create index if not exists kc_communication_requests_correlation_idx
  on public.kc_communication_requests (correlation_id)
  where correlation_id is not null;
analyze public.kc_communication_requests;
