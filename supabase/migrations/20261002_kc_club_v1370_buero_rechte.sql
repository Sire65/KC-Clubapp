-- KC Club-App – Version 1.37.0 (Wunsch Hansi 02.10.2026)
-- KC-CLUB-BUERO-RECHTE  Der Admin schaltet das Büro je Mitglied frei: 'lesen' (nur ansehen/drucken) oder 'schreiben'
--                       (vorbereiten, einladen, Termine …). Kein Eintrag = kein Büro. Der Admin hat immer vollen Zugang.
--                       Bisheriger Stand bleibt erhalten: wer heute Clubleitung ist (ist_vorstand), bekommt 'schreiben'.
--                       Freud & Leid, Mitgliederliste (Kontakte) und Tages-Übersicht bleiben unabhängig davon nur Clubleitung.
-- Rückweg: alter table kc_club_rollen drop column buero_recht;  (Server < 1.37.0 nutzt wieder ist_vorstand)
alter table kc_club_rollen add column if not exists buero_recht text;
alter table kc_club_rollen drop constraint if exists kc_club_rollen_buero_recht_check;
alter table kc_club_rollen add constraint kc_club_rollen_buero_recht_check check (buero_recht is null or buero_recht in ('lesen', 'schreiben'));
update kc_club_rollen set buero_recht = 'schreiben' where ist_vorstand and buero_recht is null;
