-- KICC-F-107 (Wunsch Hansi 18.10.2026 „baue um, dass nur geänderte Daten gespiegelt oder gesichert werden“): Frankfurt-Sicherung.
-- inhalt_sha256: SHA-256 des unverschlüsselten Teil-Inhalts (in der Datenbank gerechnet). Gleich wie ein geprüfter Teil eines
-- früheren Tages → Datei im Neon-Dateispeicher kopiert statt neu abgeholt und hochgeladen. kopiert_von: Tag der Vorlage bzw.
-- 'kopie_fehler' (Kopie im Rücklese-Test durchgefallen → normal neu gesichert). Nur Spalten hinzu, nichts entfernt.
-- Rückweg: Spalten bleiben ungenutzt, wenn der Server-Stand vor KICC-F-107 hochgeladen wird.
alter table public.kc_club_fra_sicherung add column if not exists inhalt_sha256 text;
alter table public.kc_club_fra_sicherung add column if not exists kopiert_von text;
create index if not exists kc_club_fra_sicherung_inhalt_idx on public.kc_club_fra_sicherung (tabelle, inhalt_sha256) where status = 'geprueft';
