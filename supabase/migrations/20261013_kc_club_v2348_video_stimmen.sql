-- KC Club-App – Version 2.348.0 (Wunsch Hansi „verschiedene Stimmen für die Erklär-Videos anbieten – eine Auswahl, falls eine Stimme sich
--   nicht gut anhört; in Supabase eine Tabelle mit Stimmen hinterlegen, die man bei Bedarf nachladen kann“)
-- KC-CLUB-VIDEO-STIMMEN: Die Sprachausgabe läuft im Handy/Browser (Web Speech) – Stimmen selbst können nicht aus dem Netz in den Browser geladen
--   werden. Die Tabelle hält deshalb (1) bekannte gute deutsche Stimmen je Gerät als Erkennungsmuster mit Güte, Tempo und Tonhöhe und
--   (2) Anleitungen je Gerät, wie man bessere Stimmen ins Handy lädt. Die App holt sie nur bei Bedarf (Stimmen-Auswahl), merkt sie 7 Tage.
--   Neue Stimmen/Hinweise: einfach Zeilen einfügen oder aktiv = false setzen – ohne App-Update.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Rückweg: drop table kc_club_video_stimmen;
create table if not exists kc_club_video_stimmen (
  id serial primary key,
  plattform text not null default 'alle' check (plattform in ('alle', 'android', 'ios', 'mac', 'windows')),
  art text not null default 'stimme' check (art in ('stimme', 'hinweis')),
  muster text check (muster is null or char_length(muster) <= 300),          -- regulärer Ausdruck auf den Stimmen-Namen (ohne Groß/Klein)
  name text not null check (char_length(name) between 1 and 80),
  geschlecht text check (geschlecht is null or geschlecht in ('w', 'm')),
  guete smallint not null default 1 check (guete between 0 and 3),            -- 0 Spaß/schlecht · 1 Standard · 2 Erweitert · 3 Premium/Natürlich
  tempo numeric(3,2) not null default 1 check (tempo between 0.5 and 1.5),
  hoehe numeric(3,2) not null default 1 check (hoehe between 0.5 and 1.5),
  text text check (text is null or char_length(text) <= 600),                 -- Hinweis-Text (art = 'hinweis') oder kurze Beschreibung
  reihenfolge integer not null default 100,
  aktiv boolean not null default true,
  geaendert_am timestamptz not null default now()
);
alter table kc_club_video_stimmen enable row level security;
revoke all on table kc_club_video_stimmen from anon, authenticated;
grant select, insert, update, delete on public.kc_club_video_stimmen to service_role;
grant usage, select on sequence kc_club_video_stimmen_id_seq to service_role;

insert into kc_club_video_stimmen (plattform, art, muster, name, geschlecht, guete, tempo, hoehe, text, reihenfolge) values
  ('windows', 'stimme', 'katja.*(online|natural)', 'Katja (natürlich)', 'w', 3, 1, 1, 'Sehr natürliche Online-Stimme von Microsoft – in Edge', 10),
  ('windows', 'stimme', 'conrad.*(online|natural)', 'Conrad (natürlich)', 'm', 3, 1, 1, 'Sehr natürliche Online-Stimme von Microsoft – in Edge', 11),
  ('windows', 'stimme', 'amala.*(online|natural)', 'Amala (natürlich)', 'w', 3, 1, 1, 'Online-Stimme von Microsoft – in Edge', 12),
  ('windows', 'stimme', 'seraphina.*(online|natural)', 'Seraphina (natürlich)', 'w', 3, 1, 1, 'Online-Stimme von Microsoft – in Edge', 13),
  ('windows', 'stimme', 'florian.*(online|natural)', 'Florian (natürlich)', 'm', 3, 1, 1, 'Online-Stimme von Microsoft – in Edge', 14),
  ('windows', 'stimme', 'killian.*(online|natural)', 'Killian (natürlich)', 'm', 3, 1, 1, 'Online-Stimme von Microsoft – in Edge', 15),
  ('android', 'stimme', 'katja.*(online|natural)', 'Katja (natürlich)', 'w', 3, 1, 1, 'In Microsoft Edge auf dem Handy', 16),
  ('android', 'stimme', 'conrad.*(online|natural)', 'Conrad (natürlich)', 'm', 3, 1, 1, 'In Microsoft Edge auf dem Handy', 17),
  ('windows', 'stimme', '^microsoft (hedda|katja)( |$)', 'Hedda / Katja', 'w', 1, 1, 1, 'Eingebaute Windows-Stimme', 30),
  ('windows', 'stimme', '^microsoft stefan( |$)', 'Stefan', 'm', 1, 1, 1, 'Eingebaute Windows-Stimme', 31),
  ('alle', 'stimme', '^google deutsch', 'Google Deutsch', 'w', 2, 1, 1, 'Online-Stimme von Google – in Chrome', 20),
  ('android', 'stimme', 'de-de-x-[a-z]{3}-(network|local)|deutsch.*deutschland', 'Google-Sprachausgabe', null, 2, 1, 1, 'Stimme der Google-Sprachausgabe im Handy', 21),
  ('android', 'stimme', 'samsung', 'Samsung-Stimme', null, 1, 1, 1, 'Stimme der Samsung-Sprachausgabe', 40),
  ('ios', 'stimme', 'petra.*premium', 'Petra (Premium)', 'w', 3, 1, 1, 'Beste Apple-Stimme – vorher im iPhone laden', 1),
  ('ios', 'stimme', 'anna.*(premium|erweitert|enhanced)', 'Anna (Erweitert)', 'w', 3, 1, 1, 'Apple-Stimme – vorher im iPhone laden', 2),
  ('ios', 'stimme', 'markus.*(premium|erweitert|enhanced)', 'Markus (Erweitert)', 'm', 3, 1, 1, 'Apple-Stimme – vorher im iPhone laden', 3),
  ('ios', 'stimme', 'helena.*(premium|erweitert|enhanced)', 'Helena (Erweitert)', 'w', 3, 1, 1, 'Apple-Stimme – vorher im iPhone laden', 4),
  ('ios', 'stimme', 'yannick.*(premium|erweitert|enhanced)', 'Yannick (Erweitert)', 'm', 3, 1, 1, 'Apple-Stimme – vorher im iPhone laden', 5),
  ('ios', 'stimme', 'viktor.*(premium|erweitert|enhanced)', 'Viktor (Erweitert)', 'm', 3, 1, 1, 'Apple-Stimme – vorher im iPhone laden', 6),
  ('ios', 'stimme', '^(anna|helena|markus|petra|yannick|viktor|martin)( |$)', 'Apple-Stimme', null, 1, 1, 1, 'Eingebaute Apple-Stimme', 25),
  ('mac', 'stimme', '(anna|petra|markus|yannick|helena|viktor).*(premium|erweitert|enhanced)', 'Apple-Stimme (Premium/Erweitert)', null, 3, 1, 1, 'Vorher im Mac laden', 5),
  ('mac', 'stimme', '^(anna|helena|markus|petra|yannick|viktor|martin)( |$)', 'Apple-Stimme', null, 1, 1, 1, 'Eingebaute Apple-Stimme', 25),
  ('alle', 'stimme', 'eddy|flo\b|grandma|grandpa|reed|rocko|sandy|shelley|zarvox|bad news|good news|bubbles|bells|boing|cellos|jester|organ|superstar|trinoids|whisper|wobble|albert|fred|junior|kathy|ralph', 'Spaßstimme', null, 0, 1, 1, 'Lustig, aber für Erklärungen ungeeignet', 90),
  ('ios', 'hinweis', null, 'Bessere Stimme ins iPhone/iPad laden', null, 1, 1, 1, 'Einstellungen öffnen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Deutsch. Dort zum Beispiel „Anna (Erweitert)“ oder „Petra (Premium)“ antippen und laden lassen (WLAN). Danach die Club-App einmal ganz schließen und neu öffnen – dann steht die neue Stimme hier zur Auswahl.', 1),
  ('mac', 'hinweis', null, 'Bessere Stimme in den Mac laden', null, 1, 1, 1, 'Systemeinstellungen → Bedienungshilfen → Gesprochene Inhalte → Systemstimme → Stimmen verwalten → Deutsch → „Anna (Premium)“ oder „Petra (Premium)“ laden. Danach den Browser neu starten.', 2),
  ('android', 'hinweis', null, 'Bessere Stimme ins Android-Handy laden', null, 1, 1, 1, 'Handy-Einstellungen → Bedienungshilfen (bei Samsung: Allgemeine Verwaltung) → Text-in-Sprache-Ausgabe → als Modul „Sprachausgabe von Google“ wählen → Zahnrad → Sprachdaten installieren → Deutsch → eine Stimme laden. Besonders natürlich klingen die Online-Stimmen Katja und Conrad, wenn du die Club-App in Microsoft Edge öffnest.', 3),
  ('windows', 'hinweis', null, 'Bessere Stimme am Windows-PC', null, 1, 1, 1, 'Am natürlichsten klingt es in Microsoft Edge: dort gibt es die Online-Stimmen Katja, Conrad, Amala und Seraphina. Weitere Stimmen: Windows-Einstellungen → Zeit und Sprache → Sprache und Region → Deutsch → Sprachausgabe installieren.', 4),
  ('alle', 'hinweis', null, 'Keine passende Stimme?', null, 1, 1, 1, 'Probier eine andere Stimme oder ein anderes Tempo. Hilft das nicht, lade eine bessere Stimme ins Gerät (Anleitung oben) – oder lies einfach mit: Der Text steht in jedem Video auch zum Lesen da.', 9);

-- Teil 2 (Wunsch Hansi „User sucht sich eine Stimme aus, klickt sie an – die App holt sie und installiert sie je nach Browser“):
-- art = 'download': freie Piper-Stimmen (Rhasspy Piper, Lizenzen siehe stimmen/LIZENZEN.txt), die im Browser selbst rechnen – auf jedem
-- Gerät gleich, nach dem Laden auch ohne Netz. Die Dateien liegen neben der App unter stimmen/ (GitHub Pages); hier steht nur, was angeboten wird.
alter table public.kc_club_video_stimmen drop constraint if exists kc_club_video_stimmen_art_check;
alter table public.kc_club_video_stimmen add constraint kc_club_video_stimmen_art_check check (art in ('stimme', 'hinweis', 'download'));
alter table public.kc_club_video_stimmen add column if not exists datei text check (datei is null or datei ~ '^[a-zA-Z0-9_-]{3,80}$');
alter table public.kc_club_video_stimmen add column if not exists groesse_mb integer check (groesse_mb is null or groesse_mb between 1 and 500);
insert into public.kc_club_video_stimmen (plattform, art, datei, groesse_mb, name, geschlecht, guete, tempo, hoehe, text, reihenfolge) values
  ('alle', 'download', 'de_DE-thorsten-medium', 63, 'Thorsten', 'm', 3, 1, 1, 'Männerstimme, klar und natürlich – die beste freie deutsche Stimme', 1),
  ('alle', 'download', 'de_DE-kerstin-low', 63, 'Kerstin', 'w', 2, 1, 1, 'Frauenstimme, freundlich', 2),
  ('alle', 'download', 'de_DE-eva_k-x_low', 21, 'Eva', 'w', 2, 1, 1, 'Frauenstimme – klein und schnell geladen, etwas einfacher im Klang', 3),
  ('alle', 'download', 'de_DE-ramona-low', 63, 'Ramona', 'w', 2, 1, 1, 'Frauenstimme, ruhig', 4),
  ('alle', 'download', 'de_DE-karlsson-low', 63, 'Karlsson', 'm', 2, 1, 1, 'Männerstimme, tief', 5);
