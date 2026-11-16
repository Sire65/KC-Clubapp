-- KC-CLUB-FEHLERKATALOG (16.11.2026, Wunsch Hansi nach dem Hänger bei Klaus: „Hänger-Meldung genauer machen, damit der User weiß, woran es liegt.
-- Am besten auf Dauer eine Tabelle anlegen mit Fehler-ID, Fehlername, Ursache, Lösung“).
-- Eine Zeile je Fehlerart aus dem Fehlerprotokoll (schluessel = Art, bei Hängern Art_Ursache). Die App zeigt dem Mitglied „mitglied_text“,
-- das Fehlerprotokoll und die Alarm-Mail zeigen Fehler-ID, Ursache und Lösung. Hansi kann Texte hier ändern – die Migration überschreibt sie nie
-- (on conflict do nothing). Nur Technik-Texte, keine Personen, keine Inhalte. Nur der Club-Server liest/schreibt (service_role).
-- Rückweg: drop table if exists public.kc_club_fehler_katalog;  (App und Server nehmen dann ihre eingebauten Texte)
create table if not exists public.kc_club_fehler_katalog (
  schluessel text primary key check (schluessel ~ '^[a-z_]{2,40}$'),
  fehler_id text not null unique check (fehler_id ~ '^KC-F-[0-9]{3}$'),
  symbol text not null default '•',
  name text not null,
  ursache text not null,
  loesung text not null,
  mitglied_text text,
  aktiv boolean not null default true,
  geaendert_am timestamptz not null default now()
);
alter table public.kc_club_fehler_katalog enable row level security;
revoke all on public.kc_club_fehler_katalog from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_fehler_katalog to service_role;

insert into public.kc_club_fehler_katalog (schluessel, fehler_id, symbol, name, ursache, loesung, mitglied_text) values
-- Hänger (KC-CLUB-HAENGER-URSACHE): die App misst selbst, woran es lag
('haenger',            'KC-F-100', '🧊', 'App hat gehangen (Ursache nicht messbar)', 'Die App reagierte mehrere Sekunden nicht. Dieser Browser (z. B. Firefox, Safari) kann nicht messen, ob die App selbst oder das Gerät schuld war.', 'Bei Häufung am selben Gerät: Gerät neu starten, andere Programme schließen; sonst an Claude weitergeben (Bereich steht dabei).', 'Die App hat kurz gehangen und läuft wieder. Falls das öfter passiert: andere Programme schließen oder das Gerät neu starten.'),
('haenger_app',        'KC-F-101', '🧊', 'App hat selbst zu lange gerechnet', 'Die App war mit einer großen Aufgabe beschäftigt (z. B. lange Liste aufbauen) und konnte so lange nicht reagieren. Das ist ein Fehler der App.', 'An Claude weitergeben – der Bereich steht im Eintrag, dort muss die App schneller werden.', 'Die App hatte gerade sehr viel zu rechnen. Das ist ein Fehler der App und schon gemeldet – du musst nichts tun.'),
('haenger_geraet',     'KC-F-102', '🖥️', 'Gerät war ausgelastet', 'Der Computer bzw. das Handy hat der App einige Sekunden lang keine Rechenzeit gegeben – meist andere Programme, Windows-Updates, Virenscanner oder Stromsparen. Die App selbst hat in der Zeit nichts gerechnet.', 'Kein Fehler der App. Mitglied: andere Programme und Browser-Tabs schließen, Gerät ab und zu neu starten, Updates fertig laufen lassen.', 'Dein Gerät war gerade stark ausgelastet (andere Programme, Updates oder Virenscanner) – nicht die App. Tipp: andere Programme schließen und das Gerät ab und zu neu starten.'),
('haenger_speicher',   'KC-F-103', '🧠', 'Arbeitsspeicher fast voll', 'Der Browser hatte kaum noch freien Arbeitsspeicher und musste aufräumen – dabei steht alles kurz still.', 'Mitglied: nicht benötigte Browser-Tabs und Programme schließen, App neu laden. Bei Häufung an Claude (die App könnte zu viel Speicher brauchen).', 'Der Speicher deines Geräts war fast voll. Tipp: andere Browser-Tabs und Programme schließen und die App neu laden.'),
('haenger_hintergrund','KC-F-104', '🪟', 'Fenster war im Hintergrund', 'Ein anderes Programm war aktiv. Windows bzw. der Browser bremst Fenster im Hintergrund – die App wartet dann, bis sie wieder dran ist.', 'Kein Fehler, nichts zu tun. Kein Alarm an den Admin, keine Meldung an das Mitglied.', null),
-- bisherige Arten des Fehlerprotokolls
('skript',             'KC-F-001', '🐞', 'Programmfehler', 'Ein Fehler im Programm der App.', 'An Claude/Hansi weitergeben (Datei und Zeile stehen im Eintrag).', 'Da ist etwas schiefgegangen. Der Fehler ist gemeldet – bitte die App neu laden.'),
('versprechen',        'KC-F-002', '🐞', 'Programmfehler im Hintergrund', 'Ein Fehler in einem Vorgang, der im Hintergrund lief.', 'Meist harmlos; bei Häufung weitergeben.', null),
('gefangen',           'KC-F-003', '🐞', 'Programmfehler (abgefangen)', 'Ein Programmfehler, den die App abgefangen hat; das Mitglied sah eine verständliche Meldung.', 'An Claude weitergeben.', null),
('instabil',           'KC-F-004', '⚠️', 'Mehrere Programmfehler kurz hintereinander', 'Mehrere Programmfehler innerhalb von 2 Minuten.', '„App neu laden“ wurde angeboten – bitte an Claude weitergeben.', 'Die App läuft gerade nicht rund. Neu laden hilft meistens; nichts geht dabei verloren.'),
('laden',              'KC-F-005', '📦', 'Datei nicht geladen', 'Ein Teil der App konnte nicht geladen werden – schlechtes Netz oder alter Zwischenspeicher.', 'App neu laden bzw. aktualisieren.', 'Ein Teil der App konnte nicht geladen werden. Bitte Internet prüfen und die App neu laden.'),
('api',                'KC-F-006', '🔌', 'Server-Anfrage ging schief', 'Der Club-Server hat eine Anfrage abgelehnt oder nicht beantwortet; der Grund steht im Text.', 'Text im Eintrag lesen; bei „Datenbank antwortet nicht“ kurz warten.', null),
('offline',            'KC-F-007', '📵', 'Gerät war offline', 'Das Internet war aus.', 'Nichts zu tun.', 'Du bist gerade offline. Sobald das Internet wieder da ist, geht es weiter.'),
('start_haengt',       'KC-F-008', '⏳', 'Start hängt', 'Beim Start kam keine Antwort – Netz sehr langsam oder Server nicht erreichbar.', 'Netz prüfen; bei vielen Fällen gleichzeitig: Server/Datenbank prüfen.', 'Die App startet gerade sehr langsam. Bitte Internet prüfen und es gleich noch einmal versuchen.'),
('start_kaputt',       'KC-F-009', '💥', 'App startet gar nicht', 'Browser zu alt oder falscher Browser.', 'Mitglied anrufen; Chrome bzw. Safari aktualisieren.', null),
('start_langsam',      'KC-F-010', '🐢', 'Start langsam', 'Schwaches Netz oder ausgelastete Datenbank.', 'Nichts zu tun; bei Häufung Startzeiten ansehen.', null),
('warten_lange',       'KC-F-011', '⌛', 'Vorgang dauerte über 20 s', 'Meist langsames Netz; die Aktion steht im Eintrag.', 'Bei Häufung derselben Aktion an Claude weitergeben.', null),
('mehrfachstart',      'KC-F-012', '🔁', 'Mehrmals kurz hintereinander geöffnet', 'Zeichen dafür, dass die App nicht aufging.', 'Hilfe wurde angeboten; Mitglied fragen.', null),
('speicher',           'KC-F-013', '🔒', 'Speicher gesperrt (privater Modus)', 'Der Browser läuft im privaten Modus – die App vergisst den Zugang.', 'Mitglied: App normal (nicht privat) öffnen.', 'Dein Browser ist im privaten Modus – die App kann sich dort nichts merken. Bitte normal öffnen.'),
('alte_version',       'KC-F-014', '🕰️', 'Alte App-Version', 'Das Gerät nutzt noch eine ältere Version.', '„Jetzt aktualisieren“ wurde angeboten – nichts zu tun.', null),
('ohne_link',          'KC-F-015', '🔑', 'Ohne persönlichen Link geöffnet', 'Die App wurde ohne persönlichen Link geöffnet.', 'Link neu schicken.', null),
('link_ungueltig',     'KC-F-016', '🔑', 'Link ungültig', 'Der benutzte Link gilt nicht (mehr).', 'Neuen Link schicken.', null),
('sw',                 'KC-F-017', '💾', 'Offline-Speicher nicht eingerichtet', 'Privater Modus oder sehr alter Browser.', 'Browser aktualisieren bzw. normal öffnen.', null),
('sprache_haengt',     'KC-F-018', '🎙️', 'Sprachsteuerung meldete sich nicht', 'Das Gerät hat die Spracherkennung nicht gestartet bzw. nicht beendet; die App hat von selbst abgebrochen.', 'Nichts zu tun; bei Häufung Mikrofon-Freigabe prüfen.', null),
('schutz',             'KC-F-019', '🛡️', 'Schutzschild hat etwas gesperrt', 'Der Schutzschild der App hat eine Adresse oder Aktion gesperrt.', 'Falls dadurch etwas nicht ging: an Claude weitergeben (Art und Adresse stehen im Eintrag).', null),
('hilferuf',           'KC-F-020', '🆘', 'Problem gemeldet', 'Das Mitglied hat „Problem melden“ getippt.', 'Mitglied kontaktieren.', null),
('hilferuf_anonym',    'KC-F-021', '🆘', 'Problem gemeldet (ohne Anmeldung)', 'Jemand kam nicht in die App und hat sich gemeldet.', 'Geräte-Kennung vergleichen, neuen Link schicken.', null)
on conflict (schluessel) do nothing;
