-- 2.886.0 KC-CLUB-NUTZUNG-PERSON (Wunsch Hansi 07./08.11.2026: „Pro Person eine Nutzungsstatistik … Nachrichten versendet, Termine, Bildschirmzeit, Zeit im
-- Hintergrund … mit Grafiken“; Antworten: alle 3 Stufen, Admin sieht alle, in „Meine Nutzung“ steht, dass für die Statistik bestimmte Sachen aufgezeichnet werden).
-- 1. Tabelle kc_club_nutzung_person: EINE Zeile je Mitglied und Tag – Sekunden sichtbar / im Hintergrund, Anzahl je Bereich, Anzahl je Stunde, Geräteart.
--    Nie Inhalte. Nach 365 Tagen werden die Tageszeilen zu einer Zeile je Monat verdichtet (Tag = Monatserster, monat = true).
-- 2. kc_club_nutzung_person_dazu: addiert eine Meldung der App (atomar, Grenzen je Tag).
-- 3. kc_club_nutzung_bericht: zählt je Person nur ANZAHLEN aus vorhandenen Tabellen (Nachrichten nach Absender/Zeit/Gruppe/Anlage-Art – nie Text,
--    Zu-/Absagen, Stimmen, Umfragen, Zettel, Anrufe, Starts, Fehler, Push) – in der Datenbank, damit nur die Summen übertragen werden (Datenvolumen).
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop function public.kc_club_nutzung_bericht(date, date, text[], boolean); drop function public.kc_club_nutzung_person_dazu(text, date, integer, integer, jsonb, jsonb, text);
--          drop function public.kc_club_nutzung_person_verdichten(); drop table public.kc_club_nutzung_person;
--          delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_nutzung_person'; delete from public.kc_neon_resume_tables where table_name = 'kc_club_nutzung_person';
create table if not exists public.kc_club_nutzung_person (
  person_id text not null references public.kc_core_people(person_id),
  tag date not null,
  monat boolean not null default false,
  sichtbar_s integer not null default 0 check (sichtbar_s >= 0),
  hintergrund_s integer not null default 0 check (hintergrund_s >= 0),
  bereiche jsonb not null default '{}'::jsonb check (jsonb_typeof(bereiche) = 'object'),
  stunden jsonb not null default '{}'::jsonb check (jsonb_typeof(stunden) = 'object'),
  geraete text[] not null default '{}',
  geaendert_am timestamptz not null default now(),
  primary key (person_id, tag, monat)
);
create index if not exists kc_club_nutzung_person_tag on public.kc_club_nutzung_person (tag);
alter table public.kc_club_nutzung_person enable row level security;
revoke all on public.kc_club_nutzung_person from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_nutzung_person to service_role;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_nutzung_person', 'Club-App', 'normal', false, true, true, 'KC-CLUB-NUTZUNG-PERSON: Nutzung je Mitglied und Tag (nur Zahlen)')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_nutzung_person') on conflict (table_name) do nothing;

-- Meldung der App aufaddieren: Sekunden je Tag höchstens 86 400, Bereiche/Stunden als Zähler (je Wert höchstens 500 je Meldung), Geräteart als Menge.
create or replace function public.kc_club_nutzung_person_dazu(p_person text, p_tag date, p_sichtbar integer, p_hintergrund integer, p_bereiche jsonb, p_stunden jsonb, p_geraet text)
returns void language plpgsql security invoker set search_path = public as $$
declare
  b jsonb := coalesce((select jsonb_object_agg(k, least(500, greatest(0, (v #>> '{}')::numeric))::int) from jsonb_each(case when jsonb_typeof(p_bereiche) = 'object' then p_bereiche else '{}'::jsonb end) e(k, v)
    where k ~ '^[a-z0-9_]{1,40}$' and jsonb_typeof(v) = 'number'), '{}'::jsonb);
  s jsonb := coalesce((select jsonb_object_agg(k, least(500, greatest(0, (v #>> '{}')::numeric))::int) from jsonb_each(case when jsonb_typeof(p_stunden) = 'object' then p_stunden else '{}'::jsonb end) e(k, v)
    where k ~ '^([01]?[0-9]|2[0-3])$' and jsonb_typeof(v) = 'number'), '{}'::jsonb);
  g text[] := case when p_geraet in ('handy', 'tablet', 'pc') then array[p_geraet] else '{}' end;
begin
  if p_tag is null or p_tag < current_date - 3 or p_tag > current_date + 1 then return; end if;
  insert into public.kc_club_nutzung_person as n (person_id, tag, monat, sichtbar_s, hintergrund_s, bereiche, stunden, geraete)
  values (p_person, p_tag, false, least(86400, greatest(0, coalesce(p_sichtbar, 0))), least(86400, greatest(0, coalesce(p_hintergrund, 0))), b, s, g)
  on conflict (person_id, tag, monat) do update set
    sichtbar_s = least(86400, n.sichtbar_s + excluded.sichtbar_s),
    hintergrund_s = least(86400, n.hintergrund_s + excluded.hintergrund_s),
    bereiche = (select coalesce(jsonb_object_agg(k, sum), '{}'::jsonb) from (select k, sum((v #>> '{}')::int) from (select * from jsonb_each(n.bereiche) union all select * from jsonb_each(excluded.bereiche)) x(k, v) group by k) y),
    stunden = (select coalesce(jsonb_object_agg(k, sum), '{}'::jsonb) from (select k, sum((v #>> '{}')::int) from (select * from jsonb_each(n.stunden) union all select * from jsonb_each(excluded.stunden)) x(k, v) group by k) y),
    geraete = (select coalesce(array_agg(distinct x), '{}') from unnest(n.geraete || excluded.geraete) x),
    geaendert_am = now();
end $$;
revoke all on function public.kc_club_nutzung_person_dazu(text, date, integer, integer, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.kc_club_nutzung_person_dazu(text, date, integer, integer, jsonb, jsonb, text) to service_role;

-- Tageszeilen älter als 365 Tage zu Monatszeilen verdichten (nächtliche Wartung des Club-Servers)
create or replace function public.kc_club_nutzung_person_verdichten()
returns integer language plpgsql security invoker set search_path = public as $$
declare n integer;
begin
  with alt as (
    delete from public.kc_club_nutzung_person where not monat and tag < current_date - 365 returning *
  ), alt2 as (select *, date_trunc('month', tag)::date m from alt
  ), summe as (
    select g0.person_id, g0.m tag, sum(g0.sichtbar_s)::int sichtbar_s, sum(g0.hintergrund_s)::int hintergrund_s,
      (select coalesce(jsonb_object_agg(k, s), '{}'::jsonb) from (select k, sum((v #>> '{}')::int) s from alt2 a2, jsonb_each(a2.bereiche) e(k, v) where a2.person_id = g0.person_id and a2.m = g0.m group by k) z) bereiche,
      (select coalesce(jsonb_object_agg(k, s), '{}'::jsonb) from (select k, sum((v #>> '{}')::int) s from alt2 a2, jsonb_each(a2.stunden) e(k, v) where a2.person_id = g0.person_id and a2.m = g0.m group by k) z) stunden,
      (select coalesce(array_agg(distinct g), '{}') from alt2 a2, unnest(a2.geraete) g where a2.person_id = g0.person_id and a2.m = g0.m) geraete
    from alt2 g0 group by g0.person_id, g0.m
  ), rein as (
    insert into public.kc_club_nutzung_person as n (person_id, tag, monat, sichtbar_s, hintergrund_s, bereiche, stunden, geraete)
    select person_id, tag, true, sichtbar_s, hintergrund_s, bereiche, stunden, geraete from summe
    on conflict (person_id, tag, monat) do update set sichtbar_s = n.sichtbar_s + excluded.sichtbar_s, hintergrund_s = n.hintergrund_s + excluded.hintergrund_s,
      bereiche = (select coalesce(jsonb_object_agg(k, sum), '{}'::jsonb) from (select k, sum((v #>> '{}')::int) from (select * from jsonb_each(n.bereiche) union all select * from jsonb_each(excluded.bereiche)) x(k, v) group by k) y),
      stunden = (select coalesce(jsonb_object_agg(k, sum), '{}'::jsonb) from (select k, sum((v #>> '{}')::int) from (select * from jsonb_each(n.stunden) union all select * from jsonb_each(excluded.stunden)) x(k, v) group by k) y),
      geraete = (select coalesce(array_agg(distinct x), '{}') from unnest(n.geraete || excluded.geraete) x), geaendert_am = now()
    returning 1
  ) select count(*) into n from rein;
  return n;
end $$;
revoke all on function public.kc_club_nutzung_person_verdichten() from public, anon, authenticated;
grant execute on function public.kc_club_nutzung_person_verdichten() to service_role;

-- Bericht: je Person nur Anzahlen und Sekunden im Zeitraum [p_von, p_bis] (Berliner Kalendertage). p_details = Tagesreihe, Bereiche, Raster, Geräte.
create or replace function public.kc_club_nutzung_bericht(p_von date, p_bis date, p_personen text[], p_details boolean default true)
returns jsonb language sql stable security invoker set search_path = public as $$
with z as (select (p_von::timestamp at time zone 'Europe/Berlin') a, ((p_bis + 1)::timestamp at time zone 'Europe/Berlin') b),
pers as (select distinct unnest(p_personen) pid),
msg as (
  select m.id, m.sender_person_id pid, (m.created_at at time zone 'Europe/Berlin')::date tag, exists (select 1 from public.kc_club_gruppen g where g.thread_id = m.thread_id) gruppe
  from public.kc_communication_messages m, z where m.sender_person_id = any(p_personen) and m.created_at >= z.a and m.created_at < z.b
),
anl as (
  select ma.message_id, max(case when a.mime_type like 'image/%' or a.mime_type like 'video/%' then 1 else 0 end) foto, max(case when a.mime_type like 'audio/%' then 1 else 0 end) sprache
  from public.kc_communication_message_attachments ma join public.kc_communication_attachments a on a.id = ma.attachment_id
  where ma.message_id in (select id from msg) group by ma.message_id
),
nachr as (
  select msg.pid, count(*) n, count(*) filter (where gruppe) gruppe, count(*) filter (where not gruppe) einzel,
    count(*) filter (where anl.foto = 1) fotos, count(*) filter (where anl.sprache = 1) sprache
  from msg left join anl on anl.message_id = msg.id group by msg.pid
),
treffen as (select t.id, t.erstellt_von, t.erstellt_am from public.kc_club_treffen t, z where t.beginn >= z.a and t.beginn < z.b and t.status <> 'abgesagt' and coalesce(t.art, 'treffen') in ('treffen', 'veranstaltung')),
termine as (
  select p.pid, (select count(*) from treffen) gesamt,
    (select count(*) from public.kc_club_teilnahme tn where tn.person_id = p.pid and tn.antwort = 'ja' and tn.treffen_id in (select id from treffen)) ja,
    (select count(*) from public.kc_club_teilnahme tn where tn.person_id = p.pid and tn.antwort = 'nein' and tn.treffen_id in (select id from treffen)) nein,
    (select count(*) from public.kc_club_teilnahme tn where tn.person_id = p.pid and tn.antwort not in ('ja', 'nein') and tn.treffen_id in (select id from treffen)) vielleicht,
    (select count(*) from public.kc_club_treffen t, z where t.erstellt_von = p.pid and t.erstellt_am >= z.a and t.erstellt_am < z.b) angelegt
  from pers p
),
abst as (
  select p.pid,
    (select count(*) from public.kc_club_vorschlaege v, z where v.art not in ('thema', 'spende') and v.erstellt_am >= z.a and v.erstellt_am < z.b and (v.ziel_ids is null or p.pid = any(v.ziel_ids))) moeglich,
    (select count(distinct st.vorschlag_id) from public.kc_club_stimmen st join public.kc_club_vorschlaege v on v.id = st.vorschlag_id, z
       where st.person_id = p.pid and v.art not in ('thema', 'spende') and v.erstellt_am >= z.a and v.erstellt_am < z.b) abgestimmt,
    (select count(distinct o.umfrage_id) from public.kc_club_terminumfrage_antworten an join public.kc_club_terminumfrage_optionen o on o.id = an.option_id, z
       where an.person_id = p.pid and an.geaendert_am >= z.a and an.geaendert_am < z.b) umfragen,
    (select count(*) from public.kc_club_pinnwand pw, z where pw.person_id = p.pid and pw.erstellt_am >= z.a and pw.erstellt_am < z.b) zettel
  from pers p
),
anrufe as (
  select p.pid, count(*) filter (where a.von = p.pid) gemacht, count(*) filter (where a.an = p.pid and a.angenommen_am is not null) angenommen,
    count(*) filter (where a.an = p.pid and a.angenommen_am is null) verpasst,
    coalesce(round(sum(extract(epoch from (a.beendet_am - a.angenommen_am))) filter (where a.angenommen_am is not null and a.beendet_am > a.angenommen_am) / 60.0), 0)::int minuten
  from pers p join public.kc_club_anruf a on (a.von = p.pid or a.an = p.pid), z where a.erstellt_am >= z.a and a.erstellt_am < z.b group by p.pid
),
prot as (
  select pr.person_id pid, count(*) filter (where pr.aktion = 'diagnose_start') starts, count(*) filter (where pr.aktion like 'fehler\_%' and substr(pr.aktion, 8) <> all (array['alte_version', 'update_getippt', 'umgebung', 'startzeit', 'hinweis', 'link_kopiert', 'zugang_angefordert', 'offline', 'anonym_admin_benachrichtigt', 'update_selbst', 'update_start', 'update_mindest', 'schluessel_zurueck'])) fehler, -- nur echte Fehler (wie FP_INFO im Server)
    array_agg(distinct (pr.zeit at time zone 'Europe/Berlin')::date) filter (where pr.aktion = 'diagnose_start') starttage
  from public.kc_club_protokoll pr, z where pr.person_id = any(p_personen) and (pr.aktion = 'diagnose_start' or pr.aktion like 'fehler\_%') and pr.zeit >= z.a and pr.zeit < z.b group by pr.person_id
),
push as (
  select d.person_id pid, count(*) n, count(*) filter (where d.opened_at is not null) geoeffnet
  from public.kc_dp_push_deliveries d, z where d.person_id = any(p_personen) and d.created_at >= z.a and d.created_at < z.b group by d.person_id
),
np as (select * from public.kc_club_nutzung_person n where n.person_id = any(p_personen) and n.tag >= p_von and n.tag <= p_bis),
zeit as (select person_id pid, sum(sichtbar_s)::bigint sichtbar, sum(hintergrund_s)::bigint hintergrund, array_agg(tag) filter (where sichtbar_s > 0 and not monat) tage from np group by person_id),
zug as (select person_id pid, max(app_version) version, max(zuletzt_gesehen) zuletzt from public.kc_club_zugang where person_id = any(p_personen) and aktiv group by person_id)
select coalesce(jsonb_object_agg(p.pid, jsonb_build_object(
  'nachrichten', jsonb_build_object('n', coalesce(nachr.n, 0), 'gruppe', coalesce(nachr.gruppe, 0), 'einzel', coalesce(nachr.einzel, 0), 'fotos', coalesce(nachr.fotos, 0), 'sprache', coalesce(nachr.sprache, 0)),
  'termine', jsonb_build_object('gesamt', termine.gesamt, 'ja', termine.ja, 'nein', termine.nein, 'vielleicht', termine.vielleicht, 'offen', greatest(0, termine.gesamt - termine.ja - termine.nein - termine.vielleicht), 'angelegt', termine.angelegt),
  'abstimmungen', jsonb_build_object('moeglich', abst.moeglich, 'abgestimmt', abst.abgestimmt), 'umfragen', abst.umfragen, 'zettel', abst.zettel,
  'anrufe', jsonb_build_object('gemacht', coalesce(anrufe.gemacht, 0), 'angenommen', coalesce(anrufe.angenommen, 0), 'verpasst', coalesce(anrufe.verpasst, 0), 'minuten', coalesce(anrufe.minuten, 0)),
  'starts', coalesce(prot.starts, 0), 'fehler', coalesce(prot.fehler, 0),
  'aktiveTage', (select count(distinct d) from unnest(coalesce(prot.starttage, '{}') || coalesce(zeit.tage, '{}') || coalesce((select array_agg(distinct msg.tag) from msg where msg.pid = p.pid), '{}')) d),
  'push', jsonb_build_object('n', coalesce(push.n, 0), 'geoeffnet', coalesce(push.geoeffnet, 0)),
  'zeit', jsonb_build_object('sichtbar', coalesce(zeit.sichtbar, 0), 'hintergrund', coalesce(zeit.hintergrund, 0)),
  'version', zug.version, 'zuletzt', zug.zuletzt
) || case when not p_details then '{}'::jsonb else jsonb_build_object(
  'tage', coalesce((select jsonb_agg(jsonb_build_object('t', d, 's', coalesce((select sum(sichtbar_s) from np where np.person_id = p.pid and np.tag = d and not np.monat), 0),
      'h', coalesce((select sum(hintergrund_s) from np where np.person_id = p.pid and np.tag = d and not np.monat), 0),
      'm', (select count(*) from msg where msg.pid = p.pid and msg.tag = d),
      'st', (select count(*) from unnest(coalesce(prot.starttage, '{}')) x where x = d)) order by d)
    from generate_series(p_von, p_bis, interval '1 day') g(d0), lateral (select g.d0::date d) dd), '[]'::jsonb),
  'monate', coalesce((select jsonb_agg(jsonb_build_object('t', np.tag, 's', np.sichtbar_s, 'h', np.hintergrund_s) order by np.tag) from np where np.person_id = p.pid and np.monat), '[]'::jsonb),
  'bereiche', coalesce((select jsonb_object_agg(k, s) from (select k, sum((v #>> '{}')::int) s from np, jsonb_each(np.bereiche) e(k, v) where np.person_id = p.pid group by k) x), '{}'::jsonb),
  'raster', coalesce((select jsonb_object_agg(wh, s) from (select extract(isodow from np.tag)::int || '-' || k wh, sum((v #>> '{}')::int) s from np, jsonb_each(np.stunden) e(k, v) where np.person_id = p.pid and not np.monat group by 1) x), '{}'::jsonb),
  'geraete', coalesce((select jsonb_object_agg(g, n) from (select g, count(*) n from np, unnest(np.geraete) g where np.person_id = p.pid group by g) x), '{}'::jsonb)
) end), '{}'::jsonb)
from pers p
left join nachr on nachr.pid = p.pid left join termine on termine.pid = p.pid left join abst on abst.pid = p.pid left join anrufe on anrufe.pid = p.pid
left join prot on prot.pid = p.pid left join push on push.pid = p.pid left join zeit on zeit.pid = p.pid left join zug on zug.pid = p.pid
$$;
revoke all on function public.kc_club_nutzung_bericht(date, date, text[], boolean) from public, anon, authenticated;
grant execute on function public.kc_club_nutzung_bericht(date, date, text[], boolean) to service_role;
