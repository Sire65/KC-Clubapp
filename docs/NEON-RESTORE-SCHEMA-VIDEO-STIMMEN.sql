-- KC-SEC-2026-10-13: additive Wiederherstellungsstruktur fehlt im Neon-Spiegel.
-- Aus den Spalten der Supabase-Quelle abgeleitet, keine Daten und keine Zugangswerte.
-- Nur Vorbereitungsdatei, nicht eingespielt; nicht als vollständige Mirror-Migration behandeln.
-- Vor Einspielen Spiegel-Migrationsweg und Berechtigungen prüfen.
create table if not exists public.kc_club_video_stimmen (
 id integer, plattform text, art text, muster text, name text,
 geschlecht text, guete smallint, tempo numeric(3,2), hoehe numeric(3,2),
 text text, reihenfolge integer, aktiv boolean,
 geaendert_am timestamp with time zone, datei text, groesse_mb integer
);
