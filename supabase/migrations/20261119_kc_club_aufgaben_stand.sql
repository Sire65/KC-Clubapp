-- KC-CLUB-AUFGABEN-STAND (19.11.2026, Wunsch Hansi „Gib allen mit offenen Aufgaben eine Startmeldung mit der Aufgabe und ob sie erledigt ist:
-- Ja, teilweise, nein. Das Ergebnis muss dann im nächsten Protokoll erscheinen als erledigt am, oder teilweise oder noch nicht.“)
-- Nur neue Spalten an bestehenden Tabellen (keine neue Tabelle → keine neuen Rechte nötig, RLS bleibt wie es ist). Wiederholbar.
--
-- kc_club_aufgaben: Stand je Aufgabe (bei gemeinsamen Aufgaben derselbe Stand in allen Zeilen der Gruppe)
--   stand          offen | teilweise | nicht | erledigt   (erledigt = wie bisher erledigt_am gesetzt)
--   stand_am/_von  wann/wer zuletzt gemeldet hat; stand_text = Bemerkung (was fehlt noch / Grund); stand_ziel = neues Zieldatum
--   stand_verlauf  bisherige Meldungen [{stand, am, von, text, ziel}], höchstens 20 (der Club-Server kürzt)
--   gefragt_am     wann die Startmeldung zuletzt beantwortet bzw. auf „Später“ gesetzt wurde; spaeter_bis = 24 Std. Ruhe
--   nachgefragt_am Erinnerung 2 Tage vor der Sitzung bzw. „🔔 Nachfragen“ der Clubleitung (eigene Spalte – erinnert_am gehört der Fälligkeits-Erinnerung)
-- kc_club_sitzungsprotokolle: aufgaben_stand = Abschnitt „Stand der Aufgaben“, beim Veröffentlichen festgeschrieben (Entwurf: lebendig berechnet);
--   aufgaben_nachgefragt_am = letzte „🔔 Nachfragen“ zu diesem Protokoll (höchstens 1× je 12 Std.)
--
-- Rückweg: alter table public.kc_club_aufgaben drop column stand, drop column stand_am, drop column stand_von, drop column stand_text,
--   drop column stand_ziel, drop column stand_verlauf, drop column gefragt_am, drop column spaeter_bis, drop column nachgefragt_am;
--   alter table public.kc_club_sitzungsprotokolle drop column aufgaben_stand, drop column aufgaben_nachgefragt_am;

alter table public.kc_club_aufgaben add column if not exists stand text not null default 'offen';
alter table public.kc_club_aufgaben add column if not exists stand_am timestamptz;
alter table public.kc_club_aufgaben add column if not exists stand_von text;
alter table public.kc_club_aufgaben add column if not exists stand_text text;
alter table public.kc_club_aufgaben add column if not exists stand_ziel date;
alter table public.kc_club_aufgaben add column if not exists stand_verlauf jsonb not null default '[]'::jsonb;
alter table public.kc_club_aufgaben add column if not exists gefragt_am timestamptz;
alter table public.kc_club_aufgaben add column if not exists spaeter_bis timestamptz;
alter table public.kc_club_aufgaben add column if not exists nachgefragt_am timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'kc_club_aufgaben_stand_check' and conrelid = 'public.kc_club_aufgaben'::regclass) then
    alter table public.kc_club_aufgaben add constraint kc_club_aufgaben_stand_check check (stand in ('offen', 'teilweise', 'nicht', 'erledigt'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'kc_club_aufgaben_stand_text_check' and conrelid = 'public.kc_club_aufgaben'::regclass) then
    alter table public.kc_club_aufgaben add constraint kc_club_aufgaben_stand_text_check check (stand_text is null or char_length(stand_text) <= 1000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'kc_club_aufgaben_stand_verlauf_check' and conrelid = 'public.kc_club_aufgaben'::regclass) then
    alter table public.kc_club_aufgaben add constraint kc_club_aufgaben_stand_verlauf_check check (jsonb_typeof(stand_verlauf) = 'array');
  end if;
end $$;

-- bisher erledigte Aufgaben haben den Stand „erledigt“ (nur die neue Spalte, sonst ändert sich nichts)
update public.kc_club_aufgaben set stand = 'erledigt' where erledigt_am is not null and stand <> 'erledigt';

alter table public.kc_club_sitzungsprotokolle add column if not exists aufgaben_stand jsonb;
alter table public.kc_club_sitzungsprotokolle add column if not exists aufgaben_nachgefragt_am timestamptz;
