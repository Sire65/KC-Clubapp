-- KC Club-App – Version 2.35.0
-- KC-CLUB-SCHULUNG-NACHFRAGE (Wunsch Hansi): Besuchsprotokoll „installiert auf“ um Notebook und „Leihgerät folgt“ erweitert,
--   neu: welche Programme installiert/gezeigt wurden (Liste, die Namen kommen aus der App), und der Stand der 4-Wochen-Nachfrage
--   (wann Hansi erinnert wurde, wann gesendet, oder „keine Nachfrage“).
-- Nur Prüfregel erweitert und Spalten ergänzt; vorhandene Daten bleiben unverändert.
-- Rückweg: Prüfregel wie bisher (tablet, pc, handy – vorher 'notebook'/'leih' aus installiert_auf entfernen),
--          alter table kc_besuche drop column programme, drop column nachfrage_erinnert_am, drop column nachfrage_gesendet_am, drop column nachfrage_aus;
alter table kc_besuche drop constraint if exists kc_besuche_installiert_auf_check;
alter table kc_besuche add constraint kc_besuche_installiert_auf_check check (installiert_auf <@ array['tablet', 'pc', 'handy', 'notebook', 'leih']::text[]);
alter table kc_besuche add column if not exists programme text[] not null default '{}';
alter table kc_besuche drop constraint if exists kc_besuche_programme_check;
alter table kc_besuche add constraint kc_besuche_programme_check check (cardinality(programme) <= 12);
alter table kc_besuche add column if not exists nachfrage_erinnert_am timestamptz;
alter table kc_besuche add column if not exists nachfrage_gesendet_am timestamptz;
alter table kc_besuche add column if not exists nachfrage_aus boolean not null default false;
