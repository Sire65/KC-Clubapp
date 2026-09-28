-- KC Club-App – Version 0.2.0
-- Feature KC-CLUB-VORSCHLAG: Themen für die nächste Sitzung (TOP) vorschlagen und unterstützen,
-- Abstimmungen (offen oder geheim) mit eigenen Antworten und optionaler Frist.
-- Geheime Abstimmung: gespeichert wird nur, DASS jemand abgestimmt hat (kc_club_stimmen, wahl = null);
-- die Stimme selbst liegt ohne Person und ohne Zeitstempel in kc_club_geheime_stimmen.
-- Alle Tabellen: RLS an, keine Policies → nur die Edge Function kc-club (Service-Rolle).

create table if not exists kc_club_vorschlaege (
  id uuid primary key default gen_random_uuid(),
  art text not null check (art in ('thema','abstimmung')),
  titel text not null,
  beschreibung text,
  optionen text[] not null default '{}',
  geheim boolean not null default false,
  treffen_id uuid references kc_club_treffen(id) on delete set null,
  status text not null default 'offen' check (status in ('offen','abgeschlossen','zurueckgezogen')),
  frist timestamptz,
  erstellt_von text not null references kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  abgeschlossen_am timestamptz,
  abgeschlossen_von text
);
create index if not exists kc_club_vorschlaege_status on kc_club_vorschlaege (status, erstellt_am desc);

create table if not exists kc_club_stimmen (
  vorschlag_id uuid not null references kc_club_vorschlaege(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  wahl text,                         -- null bei geheimer Abstimmung
  geaendert_am timestamptz not null default now(),
  primary key (vorschlag_id, person_id)
);

create table if not exists kc_club_geheime_stimmen (
  id uuid primary key default gen_random_uuid(),   -- zufällig, damit keine Reihenfolge ablesbar ist
  vorschlag_id uuid not null references kc_club_vorschlaege(id) on delete cascade,
  wahl text not null
);
create index if not exists kc_club_geheime_stimmen_v on kc_club_geheime_stimmen (vorschlag_id);

alter table kc_club_vorschlaege enable row level security;
alter table kc_club_stimmen enable row level security;
alter table kc_club_geheime_stimmen enable row level security;

-- Geheime Stimme atomar abgeben: „hat abgestimmt“ + anonyme Stimme in einer Transaktion, nur einmal möglich.
create or replace function kc_club_geheim_abstimmen(p_vorschlag uuid, p_person text, p_wahl text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into kc_club_stimmen (vorschlag_id, person_id, wahl) values (p_vorschlag, p_person, null)
  on conflict do nothing;
  if not found then return false; end if;
  insert into kc_club_geheime_stimmen (vorschlag_id, wahl) values (p_vorschlag, p_wahl);
  return true;
end $$;
revoke all on function kc_club_geheim_abstimmen(uuid, text, text) from public, anon, authenticated;
grant execute on function kc_club_geheim_abstimmen(uuid, text, text) to service_role;

-- Ereignisregeln: club_vorschlag (Push, sonst Mail) und je Ereignis eine reine Mail-Regel „…_mail“
-- für Mitglieder ohne Club-App-Zugang (Feature KC-CLUB-OHNEAPP).
insert into kc_communication_event_rules (source_program, event_key, display_name, channels, channel_mode, template_id, quiet_hours_mode, recipient_rule)
select * from (values
  ('kc-club','club_vorschlag','Club-App – Vorschlag/Abstimmung', array['push','email'], 'fallback', 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb),
  ('kc-club','club_nachricht_mail','Club-App – neue Nachricht (ohne App: Mail)', array['email'], 'fallback', 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb),
  ('kc-club','club_treffen_mail','Club-App – Treffen (ohne App: Mail)', array['email'], 'fallback', 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb),
  ('kc-club','club_erinnerung_mail','Club-App – Erinnerung (ohne App: Mail)', array['email'], 'fallback', 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb),
  ('kc-club','club_vorschlag_mail','Club-App – Vorschlag/Abstimmung (ohne App: Mail)', array['email'], 'fallback', 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb)
) v(a,b,c,d,e,f,g,h)
where not exists (select 1 from kc_communication_event_rules r where r.source_program = v.a and r.event_key = v.b);
