-- KC-CLUB-SPUR-PINNWAND-ECHT (Fund Hansi 30.10.2026: „Karla hat in Wege wieder ‚Zettel aufgehängt‘ – ich sehe aber keinen Zettel“):
-- Eine App vor 2.759.0 (Fix KC-CLUB-SPUR-VOLL) lag 13 Std. im Hintergrund und meldete beim Aufwachen das stille Nachsehen noch als Handlung.
-- Seit 2.767.0 prüft der Server das selbst. Hier: alle „tat_pinnwand“-Schritte seit dem Fix (29.10.) entfernen, zu denen es von dieser Person
-- keinen Zettel ±10 Min. gibt (Stand 30.10.: 2 Schritte, beide Karla, 09:44). Wird eine Wege-Zeile dadurch leer, fällt sie weg.
-- Nur Daten der Wege-Aufzeichnung (kc_club_protokoll, aktion 'spur'); keine Struktur, keine Rechte.
-- Rückweg: nicht nötig (die entfernten Schritte waren falsch); Sicherung der Zeilen vorher in kc_db_mirror (Neon) und der Nachtsicherung.
with s as (
  select p.id, jsonb_agg(e order by ord) filter (where not (e->>1 = 'tat_pinnwand' and not exists (
      select 1 from public.kc_club_pinnwand z where z.person_id = p.person_id
        and z.erstellt_am between to_timestamp((e->>0)::bigint / 1000.0) - interval '10 minutes' and to_timestamp((e->>0)::bigint / 1000.0) + interval '10 minutes'))) as neu
  from public.kc_club_protokoll p, jsonb_array_elements(p.details -> 's') with ordinality as x(e, ord)
  where p.aktion = 'spur' and p.zeit >= '2026-10-29' and p.details::text like '%tat_pinnwand%'
  group by p.id)
update public.kc_club_protokoll p set details = jsonb_set(p.details, '{s}', s.neu)
  from s where s.id = p.id and s.neu is not null and s.neu is distinct from p.details -> 's';
delete from public.kc_club_protokoll p
 where p.aktion = 'spur' and p.zeit >= '2026-10-29' and p.details::text like '%tat_pinnwand%'
   and not exists (select 1 from jsonb_array_elements(p.details -> 's') e where not (e->>1 = 'tat_pinnwand' and not exists (
      select 1 from public.kc_club_pinnwand z where z.person_id = p.person_id
        and z.erstellt_am between to_timestamp((e->>0)::bigint / 1000.0) - interval '10 minutes' and to_timestamp((e->>0)::bigint / 1000.0) + interval '10 minutes')));
