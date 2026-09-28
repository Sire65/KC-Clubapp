-- KC Club-App – Version 0.13.0
-- Feature KC-CLUB-KONTAKT: Mitglieder-Details (Handy, Festnetz, E-Mail, Adresse) – jedes Mitglied gibt selbst frei,
-- was andere Mitglieder sehen (Standard: nichts). Admin sieht alles; Aushilfen (ohne Protokoll-Leserecht) sehen keine Kontaktdaten.
alter table kc_club_freigaben drop constraint if exists kc_club_freigaben_bereich_check;
alter table kc_club_freigaben add constraint kc_club_freigaben_bereich_check
  check (bereich = any (array['dienstzeiten','geburtstag','kontakt_handy','kontakt_festnetz','kontakt_mail','kontakt_adresse']));

-- Recht „Kontaktdaten anderer sehen“ über die Rollen-Registry (Standard ja; Aushilfen nein)
alter table kc_club_rollen add column if not exists kontakte_sehen boolean not null default true;
update kc_club_rollen set kontakte_sehen = false where 'Aushilfe' = any(aemter);
