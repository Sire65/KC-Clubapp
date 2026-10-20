-- 2.508.0 KC-CLUB-AUFGABE-BEMERKUNG (Wunsch Hansi „Wenn er sie erledigt hat, muss er sie bestätigen mit einem Bemerkungstext“):
-- beim Abhaken einer Aufgabe ist eine kurze Bemerkung Pflicht (was ist herausgekommen?). Rückweg: alter table … drop column bemerkung;
alter table public.kc_club_aufgaben add column if not exists bemerkung text check (bemerkung is null or char_length(bemerkung) <= 1000);
