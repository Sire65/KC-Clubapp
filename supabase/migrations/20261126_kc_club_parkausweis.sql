-- KC-CLUB-PARKAUSWEIS (Hansi 26.11.2026): „Einige Kollegen bekommen einen Parkausweis für die Zeit des Weihnachtsmarktes. Die muss der Kassenwart beantragen …
-- Das sollte man noch einbauen unter Meins mit den Kilometern. Kennzeichen und ‚brauchst du einen Parkausweis für den Weihnachtsmarkt‘. Von bis.
-- Wenn ja angeklickt wird, kann der Kassenwart sich eine Liste ausdrucken mit ID, Name, Vorname, Kennzeichen, die er dort vorlegt.“
-- Erweiterung von kc_club_fahrtprofil (KICC-F-114): Kennzeichen + Parkausweis-Wunsch je Veranstaltung (park_event) mit Zeitraum.
-- Nur Club-Server (Rechte wie bisher). Rein additiv. Rückweg: alter table public.kc_club_fahrtprofil drop column kennzeichen, drop column park_event,
--   drop column park_von, drop column park_bis;
alter table public.kc_club_fahrtprofil add column if not exists kennzeichen text check (kennzeichen is null or kennzeichen ~ '^[A-ZÄÖÜ]{1,3}-[A-Z]{1,2} [1-9][0-9]{0,3}[EH]?$');
alter table public.kc_club_fahrtprofil add column if not exists park_event text check (park_event is null or char_length(park_event) between 1 and 80);
alter table public.kc_club_fahrtprofil add column if not exists park_von date;
alter table public.kc_club_fahrtprofil add column if not exists park_bis date;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'kc_club_fahrtprofil_park_check') then
    alter table public.kc_club_fahrtprofil add constraint kc_club_fahrtprofil_park_check
      check (park_event is null or (kennzeichen is not null and park_von is not null and park_bis is not null and park_bis >= park_von));
  end if;
end $$;
comment on column public.kc_club_fahrtprofil.park_event is 'KC-CLUB-PARKAUSWEIS: Veranstaltung, für die ein Parkausweis gewünscht ist (null = keiner); Zeitraum park_von–park_bis, Kennzeichen.';
