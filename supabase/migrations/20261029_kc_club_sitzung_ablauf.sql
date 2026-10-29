-- 2.751.0 KC-CLUB-SITZUNG-ABLAUF / KC-CLUB-AENDERUNG-MELDUNG / KC-CLUB-SITZUNG-VORGABEN (Wunsch Hansi 29.10.2026: Ablauf einer Clubsitzung
-- Schritt für Schritt – Vorschläge 4 Tage vorher, Einladung 3 Tage vorher, danach Sitzung vorbereiten, zuletzt Aktentasche; Änderungen nach der
-- Einladung: Clubleitung entscheidet „Mitglieder informieren?“; Änderungsmeldung mit „Neu / Entfällt“; Vorgaben einstellbar).
-- Nur neue, leere Spalten und ein Einstellungs-Eintrag – bestehende Daten bleiben unverändert. Nur der Club-Server liest/schreibt (RLS wie bisher).
-- versandt_top        = Tagesordnung, wie sie zuletzt an alle verschickt wurde (Einladung oder Änderungsmeldung) – Grundlage für „Neu / Entfällt“
-- informieren_nein_top = Tagesordnung, bei der die Clubleitung „Nein, nicht informieren“ gewählt hat (dann fragt die App dafür nicht noch einmal)
-- unterlagen_am       = Schritt „Sitzung vorbereiten“ (Anwesende, Anmerkung, Mitschreibbogen) erledigt
-- Rückweg: alter table public.kc_club_buero_sitzung drop column versandt_top, drop column informieren_nein_top, drop column unterlagen_am;
--          delete from public.kc_club_konfig where schluessel = 'sitzung_vorgaben';
alter table public.kc_club_buero_sitzung add column if not exists versandt_top jsonb;
alter table public.kc_club_buero_sitzung add column if not exists informieren_nein_top jsonb;
alter table public.kc_club_buero_sitzung add column if not exists unterlagen_am timestamptz;
comment on column public.kc_club_buero_sitzung.versandt_top is 'KC-CLUB-AENDERUNG-MELDUNG (2.751.0): zuletzt an alle verschickte Tagesordnung';
comment on column public.kc_club_buero_sitzung.informieren_nein_top is 'KC-CLUB-AENDERUNG-MELDUNG (2.751.0): Tagesordnung, bei der die Clubleitung „nicht informieren“ gewählt hat';
comment on column public.kc_club_buero_sitzung.unterlagen_am is 'KC-CLUB-SITZUNG-ABLAUF (2.751.0): Schritt „Sitzung vorbereiten“ erledigt';
-- Vorgaben laut Hansi (29.10.2026): letzter Freitag im Folgemonat, 18:00 Uhr, Hütte Anne, im Dezember keine ordentliche Sitzung.
-- Änderbar in der App (Büro → ⚙️ Sitzungs-Vorgaben); fehlende Werte ersetzt der Club-Server durch seine Standardwerte.
insert into public.kc_club_konfig (schluessel, wert, geaendert_von, geaendert_am)
values ('sitzung_vorgaben', '{"vorschlag_tage": 4, "vorschlag_stunde": 17, "einladung_tage": 3, "erinnerung_tage": 2, "unterlagen_tage": 1, "tasche_stunde": 14, "vorlauf_tage": 7, "vorbereiter_amt": "Clubsprecher", "wochentag": 5, "uhrzeit": "18:00", "ort": "Hütte Anne", "ohne_monate": [12]}'::jsonb, 'einrichtung:2.751.0', now())
on conflict (schluessel) do nothing;
