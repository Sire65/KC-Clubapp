-- KC Club-App – Version 0.8.0
-- Feature KC-CLUB-GEBURTSTAG-PUSH: Hinweis 2 Tage vorher („X hat in 2 Tagen Geburtstag“) und am Tag
--   („X hat heute Geburtstag – möchtest du gratulieren?“). Nur für freigegebene Geburtstage, nur an Mitglieder
--   mit geöffneter App; steuerbar in den Einstellungen (Bereich „geburtstage“).
-- Feature KC-CLUB-VERANSTALTUNG: Termine der Art „veranstaltung“ (z. B. Aufbau, Weihnachtsmarkt, Nachbereitung)
--   ohne Einladung/Zusage-Hinweis; eigene Farbe im Kalender.

alter table kc_club_benachrichtigung drop constraint if exists kc_club_benachrichtigung_bereich_check;
alter table kc_club_benachrichtigung add constraint kc_club_benachrichtigung_bereich_check
  check (bereich in ('termine','nachrichten','vorschlaege','dienste','geburtstage'));

create table if not exists kc_club_geburtstag_hinweis (
  person_id text not null references kc_core_people(person_id),   -- Geburtstagskind
  datum date not null,                                             -- Geburtstag in diesem Jahr
  art text not null check (art in ('vorher','heute')),
  gesendet_am timestamptz not null default now(),
  primary key (person_id, datum, art)
);
alter table kc_club_geburtstag_hinweis enable row level security;

alter table kc_club_treffen add column if not exists art text not null default 'treffen';
alter table kc_club_treffen drop constraint if exists kc_club_treffen_art_check;
alter table kc_club_treffen add constraint kc_club_treffen_art_check check (art in ('treffen','veranstaltung'));

insert into kc_communication_event_rules (source_program, event_key, display_name, channels, channel_mode, template_id, quiet_hours_mode, recipient_rule)
select v.a, v.b, v.c, v.d, v.e, 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb from (values
  ('kc-club','club_geburtstag','Club-App – Geburtstag (nur Push)', array['push'], 'fallback'),
  ('kc-club','club_geburtstag_push','Club-App – Geburtstag (Push, sonst Mail)', array['push','email'], 'fallback'),
  ('kc-club','club_geburtstag_beide','Club-App – Geburtstag (Push und Mail)', array['push','email'], 'all'),
  ('kc-club','club_geburtstag_mail','Club-App – Geburtstag (nur Mail)', array['email'], 'fallback')
) v(a,b,c,d,e)
where not exists (select 1 from kc_communication_event_rules r where r.source_program = v.a and r.event_key = v.b);

-- Mehrtägige/ganztägige Veranstaltungen (z. B. Weihnachtsmarkt Fr.–So.): beginn = erster Tag, ende = letzter Tag
alter table kc_club_treffen add column if not exists ganztaegig boolean not null default false;
