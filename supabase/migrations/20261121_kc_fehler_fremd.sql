-- KC-CLUB-FREMDFEHLER (21.11.2026, Fund: Mitglied iPad/Safari bekam beim Einrichten 2× „Script error.“ ohne Datei/Zeile/Stapel → Fenster + Alarm-Mail KC-F-001).
-- Solche Meldungen kommen von Safari, Browser-Erweiterungen oder Inhaltsblockern (fremdes Skript), nicht aus der App. Neue Art „fremd“ im Fehlerkatalog:
-- kein Fenster beim Mitglied, kein Alarm je Fehler – erst ab mehr als 5 an einem Tag ein Hinweis an die Admins (Club-Server).
-- Nur eine neue Zeile in der bestehenden Tabelle (keine neue Tabelle, keine Funktion – Rechte bleiben wie in 20261116_kc_club_fehler_katalog.sql).
-- Hansi geänderte Texte werden nie überschrieben (where not exists). Rückweg: delete from public.kc_club_fehler_katalog where schluessel = 'fremd';
insert into public.kc_club_fehler_katalog (schluessel, fehler_id, symbol, name, ursache, loesung, mitglied_text)
select 'fremd', 'KC-F-022', '🧩', 'Fremdfehler aus dem Browser',
  'Der Browser meldete „Script error.“ ohne Datei, Zeile und Stapel. Das kommt von Safari, einer Browser-Erweiterung oder einem Inhaltsblocker außerhalb der App – nicht aus dem Programm der App.',
  'Meist harmlos, nichts zu tun. Bei Häufung (Hinweis-Mail ab mehr als 5 am Tag): Erweiterungen/Inhaltsblocker am Gerät prüfen bzw. ausschalten oder die App vom Home-Bildschirm nutzen.',
  null
where not exists (select 1 from public.kc_club_fehler_katalog where schluessel = 'fremd' or fehler_id = 'KC-F-022');
