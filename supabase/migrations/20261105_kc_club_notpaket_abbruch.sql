-- 2.862.0 KC-CLUB-NOTPAKET-ABBRUCH (Wunsch Hansi 05.11.2026 „Ja, bereite die Abbrüche vor, damit so was vermerkt wird“):
-- Beginn des laufenden Baus des Notfall-Pakets. Bricht der Server mitten im Bau ab (z. B. „CPU Time exceeded“), bleibt der Wert stehen –
-- der nächste Lauf trägt dann „Bau abgebrochen“ als Fehler ein (vorher blieb so ein Abbruch unbemerkt).
-- Rückweg: alter table public.kc_club_notbetrieb drop column if exists bau_start;
alter table public.kc_club_notbetrieb add column if not exists bau_start timestamptz;
