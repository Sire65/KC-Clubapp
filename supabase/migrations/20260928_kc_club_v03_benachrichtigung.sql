-- KC Club-App – Version 0.3.0
-- Feature KC-CLUB-BENACHRICHTIGUNG: Jedes Mitglied wählt je Bereich, ob es Push und/oder E-Mail bekommt.
--   Push ✓ E-Mail ✗ → Regel „…_push“  (Push; kommt er nicht an, automatisch E-Mail)
--   Push ✓ E-Mail ✓ → Regel „…_beide“ (Push und E-Mail)
--   Push ✗ E-Mail ✓ → Regel „…_mail“  (nur E-Mail)
--   beides aus      → keine Benachrichtigung
--   keine Auswahl gespeichert → bisherige Standardregel (unverändert)
-- Feature KC-CLUB-DIENSTERINNERUNG: Erinnerung am Vorabend an die eigenen Dienste (nur wer sie einschaltet).

create table if not exists kc_club_benachrichtigung (
  person_id text not null references kc_core_people(person_id),
  bereich text not null check (bereich in ('termine','nachrichten','vorschlaege','dienste')),
  push boolean not null default true,
  email boolean not null default false,
  geaendert_am timestamptz not null default now(),
  primary key (person_id, bereich)
);
alter table kc_club_benachrichtigung enable row level security;

-- Doppelversand verhindern: je Person und Tag höchstens eine Dienst-Erinnerung
create table if not exists kc_club_dienst_erinnerung (
  person_id text not null references kc_core_people(person_id),
  datum date not null,
  gesendet_am timestamptz not null default now(),
  primary key (person_id, datum)
);
alter table kc_club_dienst_erinnerung enable row level security;

insert into kc_communication_event_rules (source_program, event_key, display_name, channels, channel_mode, template_id, quiet_hours_mode, recipient_rule)
select v.a, v.b, v.c, v.d, v.e, 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb from (values
  ('kc-club','club_dienst','Club-App – Dienst-Erinnerung', array['push','email'], 'fallback'),
  ('kc-club','club_dienst_mail','Club-App – Dienst-Erinnerung (nur Mail)', array['email'], 'fallback'),
  ('kc-club','club_nachricht_push','Club-App – Nachricht (Push, sonst Mail)', array['push','email'], 'fallback'),
  ('kc-club','club_nachricht_beide','Club-App – Nachricht (Push und Mail)', array['push','email'], 'all'),
  ('kc-club','club_treffen_push','Club-App – Treffen (Push, sonst Mail)', array['push','email'], 'fallback'),
  ('kc-club','club_treffen_beide','Club-App – Treffen (Push und Mail)', array['push','email'], 'all'),
  ('kc-club','club_erinnerung_push','Club-App – Erinnerung (Push, sonst Mail)', array['push','email'], 'fallback'),
  ('kc-club','club_erinnerung_beide','Club-App – Erinnerung (Push und Mail)', array['push','email'], 'all'),
  ('kc-club','club_vorschlag_push','Club-App – Vorschlag (Push, sonst Mail)', array['push','email'], 'fallback'),
  ('kc-club','club_vorschlag_beide','Club-App – Vorschlag (Push und Mail)', array['push','email'], 'all'),
  ('kc-club','club_dienst_push','Club-App – Dienst-Erinnerung (Push, sonst Mail)', array['push','email'], 'fallback'),
  ('kc-club','club_dienst_beide','Club-App – Dienst-Erinnerung (Push und Mail)', array['push','email'], 'all')
) v(a,b,c,d,e)
where not exists (select 1 from kc_communication_event_rules r where r.source_program = v.a and r.event_key = v.b);
