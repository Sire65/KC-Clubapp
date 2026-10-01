-- KC Club-App – Version 1.5.0
-- KC-CLUB-ARCHIV-PERSOENLICH (Wunsch Hansi 01.10.2026): jedes Mitglied hat im Archiv eigene Ordner (je Jahr, Rücken: Jahr + Name)
-- mit Registern. Zugriff NUR der Besitzer – auch der Admin nicht (Entscheidung Hansi: „1 nein“). Fremdversuch → Meldung an
-- Besitzer und Admins (Entscheidung „2 beide“). Der Besitzer kann Personen oder Gruppen zeitlich begrenzt freigeben:
-- ganzen Ordner, ein Register oder ein einzelnes Dokument; nur ansehen oder zusätzlich „hochladen zur Prüfung“ – der Besitzer
-- bekommt Bescheid und nimmt an oder lehnt ab (Entscheidung „3“). Alle Prüfungen im Server (kc-club), RLS an, keine Policies.
--   kc_club_archiv_ordner.besitzer   Person des persönlichen Ordners (art 'persoenlich'); null = Vereinsordner wie bisher
--   kc_club_archiv_dokumente.status  'ok' | 'pruefung' (von einem Freigabe-Empfänger hochgeladen, wartet auf den Besitzer)
--   kc_club_archiv_freigaben         wer was bis wann sehen (und ggf. hochladen) darf; beendet_am = vorzeitig zurückgenommen
-- Die globale Suche (kc_club_suche) zeigt persönliche Dokumente nur dem Besitzer und im Rahmen gültiger Freigaben.
-- Rückweg: Freigaben-Tabelle droppen, Spalten besitzer/status droppen, Art-Prüfung auf die 7 Vereinsarten zurück,
--          kc_club_suche aus 20261001_kc_club_v130_suche.sql neu einspielen.

alter table kc_club_archiv_ordner add column if not exists besitzer text references kc_core_people(person_id);
alter table kc_club_archiv_ordner drop constraint if exists kc_club_archiv_ordner_art_check;
alter table kc_club_archiv_ordner add constraint kc_club_archiv_ordner_art_check
  check (art in ('satzung','versammlung','vertraege','finanzen','presse','chronik','sonstiges','persoenlich'));
alter table kc_club_archiv_ordner drop constraint if exists kc_club_archiv_ordner_persoenlich_check;
alter table kc_club_archiv_ordner add constraint kc_club_archiv_ordner_persoenlich_check check ((art = 'persoenlich') = (besitzer is not null));
create unique index if not exists kc_club_archiv_ordner_besitzer_jahr on kc_club_archiv_ordner (besitzer, jahr) where besitzer is not null;

alter table kc_club_archiv_dokumente add column if not exists status text not null default 'ok';
alter table kc_club_archiv_dokumente drop constraint if exists kc_club_archiv_dokumente_status_check;
alter table kc_club_archiv_dokumente add constraint kc_club_archiv_dokumente_status_check check (status in ('ok', 'pruefung'));

create table if not exists kc_club_archiv_freigaben (
  id uuid primary key default gen_random_uuid(),
  ordner_id uuid not null references kc_club_archiv_ordner(id) on delete cascade,
  register text,
  dokument_id uuid references kc_club_archiv_dokumente(id) on delete cascade,
  an_person text references kc_core_people(person_id),
  an_gruppe uuid,
  hochladen boolean not null default false,
  bis timestamptz not null,
  erstellt_von text not null references kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  beendet_am timestamptz,
  constraint kc_club_archiv_freigaben_ziel check ((an_person is null) <> (an_gruppe is null)),
  constraint kc_club_archiv_freigaben_umfang check (not (register is not null and dokument_id is not null)),
  constraint kc_club_archiv_freigaben_hochladen check (not (hochladen and dokument_id is not null))
);
create index if not exists kc_club_archiv_freigaben_ordner on kc_club_archiv_freigaben (ordner_id);
create index if not exists kc_club_archiv_freigaben_person on kc_club_archiv_freigaben (an_person) where an_person is not null;
create index if not exists kc_club_archiv_freigaben_gruppe on kc_club_archiv_freigaben (an_gruppe) where an_gruppe is not null;
alter table kc_club_archiv_freigaben enable row level security;
revoke all on kc_club_archiv_freigaben from anon, authenticated;

-- Spiegel/Sicherung wie die übrigen Archiv-Tabellen (die Neon-Tabelle legt der Spiegel-Arbeiter selbst an – KC-SPIEGEL-AUTO)
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_archiv_freigaben', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-ARCHIV-PERSOENLICH (1.5.0): Freigaben persönlicher Archivordner')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_archiv_freigaben') on conflict (table_name) do nothing;

-- Suche: persönliche Ordner nur für den Besitzer bzw. im Rahmen gültiger Freigaben; Dokumente „zur Prüfung“ nur für Besitzer
-- und Einreicher. Gezielter Austausch der Archiv-Bedingung in kc_club_suche (Rest der Funktion bleibt unverändert).
do $m$
declare d text; alt text := $x$where d.geloescht_am is null and o.geloescht_am is null and (not o.nur_vorstand or p_vorstand)$x$;
begin
  d := pg_get_functiondef('public.kc_club_suche(text[], text[], text, boolean, boolean, timestamptz, timestamptz, text, boolean, int)'::regprocedure);
  if position(alt in d) = 0 then raise exception 'Archiv-Bedingung in kc_club_suche nicht gefunden'; end if;
  d := replace(d, alt, $x$where d.geloescht_am is null and o.geloescht_am is null and (not o.nur_vorstand or p_vorstand)
      and (o.besitzer is null or o.besitzer = p_person
           or (d.status = 'ok' and exists (select 1 from kc_club_archiv_freigaben f
                 where f.ordner_id = o.id and f.beendet_am is null and f.bis > now()
                   and (f.dokument_id is null or f.dokument_id = d.id) and (f.register is null or f.register = d.register)
                   and (f.an_person = p_person or f.an_gruppe in (select tp.thread_id from kc_communication_thread_participants tp where tp.person_id = p_person))))
           or (d.status = 'pruefung' and d.hochgeladen_von = p_person))
      and (d.status = 'ok' or d.hochgeladen_von = p_person or o.besitzer = p_person)$x$);
  execute d;
end $m$;
revoke all on function kc_club_suche(text[], text[], text, boolean, boolean, timestamptz, timestamptz, text, boolean, int) from public, anon, authenticated;
