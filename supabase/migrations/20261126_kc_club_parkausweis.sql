-- KC-CLUB-PARKAUSWEIS (Hansi 26.11.2026): „Einige Kollegen bekommen einen Parkausweis für die Zeit des Weihnachtsmarktes. Die muss der Kassenwart beantragen …
-- Kennzeichen und ‚brauchst du einen Parkausweis für den Weihnachtsmarkt‘. Von bis. … Liste mit ID, Name, Vorname, Kennzeichen, die er dort vorlegt.“
-- Hansi 26.11. aus dem Schreiben der Stadt (Beschicker-Info Werne Marketing 20.11.2026): „Donnerstagmorgen in der Tourist-Info am Markt 19. Dort gibt es
-- ebenfalls eine Park-Ausnahmegenehmigung für das Auf- und Abbauen. Zusätzlich kann man für die 10 Tage (oder auch 5 Tage) einen Parkausweis für 2 € pro Tag
-- dort erwerben. Dieser gilt dann für alle öffentlichen Parkplätze in der Stadt.“
-- Erweiterung von kc_club_fahrtprofil (KICC-F-114): Kennzeichen, Wunsch je Veranstaltung (park_event) mit zwei Sorten:
--   park_aufbau = Park-Ausnahmegenehmigung Auf-/Abbau (ohne Gebühr) · park_tage 5|10 mit park_von–park_bis = Parkausweis Marktzeit (Preis je Tag).
-- Preis je Tag, Tage-Auswahl und Abholung stehen in kc_club_konfig „parkausweis“ (Clubleitung kann sie ändern) – nicht im Programmcode.
-- Nur Club-Server (Rechte wie bisher). Rein additiv. Rückweg: alter table public.kc_club_fahrtprofil drop column kennzeichen, drop column park_event,
--   drop column park_aufbau, drop column park_tage, drop column park_von, drop column park_bis; delete from public.kc_club_konfig where schluessel = 'parkausweis';
alter table public.kc_club_fahrtprofil add column if not exists kennzeichen text check (kennzeichen is null or kennzeichen ~ '^[A-ZÄÖÜ]{1,3}-[A-Z]{1,2} [1-9][0-9]{0,3}[EH]?$');
alter table public.kc_club_fahrtprofil add column if not exists park_event text check (park_event is null or char_length(park_event) between 1 and 80);
alter table public.kc_club_fahrtprofil add column if not exists park_aufbau boolean not null default false;
alter table public.kc_club_fahrtprofil add column if not exists park_tage integer check (park_tage is null or park_tage between 1 and 31);
alter table public.kc_club_fahrtprofil add column if not exists park_von date;
alter table public.kc_club_fahrtprofil add column if not exists park_bis date;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'kc_club_fahrtprofil_park_check') then
    alter table public.kc_club_fahrtprofil add constraint kc_club_fahrtprofil_park_check check (
      (park_von is null and park_bis is null and park_tage is null) or (park_von is not null and park_bis is not null and park_tage is not null and park_bis >= park_von));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'kc_club_fahrtprofil_park_wunsch_check') then
    alter table public.kc_club_fahrtprofil add constraint kc_club_fahrtprofil_park_wunsch_check check (
      park_event is null or (kennzeichen is not null and (park_aufbau or park_von is not null)));
  end if;
end $$;
comment on column public.kc_club_fahrtprofil.park_event is 'KC-CLUB-PARKAUSWEIS: Veranstaltung des Wunsches (null = keiner); park_aufbau = Ausnahmegenehmigung Auf-/Abbau, park_tage/park_von/park_bis = Parkausweis Marktzeit.';

-- Einstellung (Registry statt Programmcode): Preis je Tag, wählbare Tage, Abholung laut Schreiben der Stadt
insert into public.kc_club_konfig (schluessel, wert, geaendert_von, geaendert_am)
values ('parkausweis', jsonb_build_object('preisTag', 2, 'tage', jsonb_build_array(5, 10),
  'abholung', 'Donnerstag, 03.12.2026, morgens · Tourist-Info, Markt 19',
  'quelle', 'Beschicker-Info Weihnachtsmarkt – Werne Marketing – 20.11.2026'), 'migration', now())
on conflict (schluessel) do nothing;
