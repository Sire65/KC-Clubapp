-- Club-App 0.57.0 – KC-CLUB-PINNWAND-LIVE: neue Post-its live in der App + Push (wichtig und unwichtig)
-- Neuer Benachrichtigungs-Bereich „pinnwand“ (Mitglied steuert Push/Mail selbst). Standard: nur Push – ohne Push-Abo keine
-- Mail je Zettel (sonst Mail-Flut). Vorlage wie alle Club-Meldungen (kc_club_v1: titel/kurz/betreff/text/url).
alter table public.kc_club_benachrichtigung drop constraint if exists kc_club_benachrichtigung_bereich_check;
alter table public.kc_club_benachrichtigung add constraint kc_club_benachrichtigung_bereich_check
  check (bereich = any (array['termine','nachrichten','vorschlaege','dienste','geburtstage','pinnwand']));

insert into kc_communication_event_rules (source_program, event_key, display_name, channels, channel_mode, template_id, quiet_hours_mode, recipient_rule)
select v.a, v.b, v.c, v.d, v.e, 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb from (values
  ('kc-club','club_pinnwand','Club-App – Pinnwand (nur Push)', array['push'], 'fallback'),
  ('kc-club','club_pinnwand_push','Club-App – Pinnwand (nur Push)', array['push'], 'fallback'),
  ('kc-club','club_pinnwand_beide','Club-App – Pinnwand (Push und Mail)', array['push','email'], 'all'),
  ('kc-club','club_pinnwand_mail','Club-App – Pinnwand (nur Mail)', array['email'], 'fallback')
) v(a,b,c,d,e)
where not exists (select 1 from kc_communication_event_rules r where r.source_program = v.a and r.event_key = v.b);
