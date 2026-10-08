-- Fehlerprotokoll leeren (Auftrag Hansi, 08.10.2026) – genau wie „🩺 Fehlerprotokoll → Leeren“ in der Admin-Zentrale
-- (case "fehlerprotokoll_leeren" in kc-club): erst EINE Sicherungszeile „fp_geleert“ mit allen Einträgen, dann löschen.
-- Gleicher Filter wie FP_FILTER: aktion like 'fehler_%' oder hilferuf / diagnose_start / zugang_angefordert.
-- Rückweg: die Einträge stehen vollständig in details->'sicherung' der Zeile „fp_geleert“.
create temporary table fp_alle on commit drop as
  select id, zeit, person_id, aktion, details,
    regexp_replace(regexp_replace(aktion, '^fehler_anonym_', ''), '^fehler_', '') as art
  from kc_club_protokoll
  where aktion like 'fehler_%' or aktion in ('hilferuf', 'diagnose_start', 'zugang_angefordert');

insert into kc_club_protokoll (person_id, aktion, details)
select null, 'fp_geleert', jsonb_build_object(
  'anzahl', count(*),
  'schwer', count(*) filter (where art in ('hilferuf', 'hilferuf_anonym', 'start_kaputt')
      or (art = 'skript' and coalesce(details->>'text', '') !~* '^Script error\.?$')
      or (art = 'sicherheit' and jsonb_typeof(details->'probleme') = 'array' and jsonb_array_length(details->'probleme') > 0)),
  'info', count(*) filter (where art in ('alte_version', 'update_getippt', 'umgebung', 'startzeit', 'hinweis', 'link_kopiert', 'diagnose_start', 'zugang_angefordert', 'offline', 'anonym_admin_benachrichtigt')
      or (art = 'sicherheit' and not (jsonb_typeof(details->'probleme') = 'array' and jsonb_array_length(details->'probleme') > 0))),
  'durch', 'Weg B im Auftrag von Hansi',
  'sicherung', jsonb_agg(jsonb_build_object('id', id, 'zeit', zeit, 'person_id', person_id, 'aktion', aktion, 'details', details) order by id))
from fp_alle
having count(*) > 0;

delete from kc_club_protokoll where id in (select id from fp_alle);
