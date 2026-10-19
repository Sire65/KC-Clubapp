-- KC-CLUB-KACHEL-EINS (Server 2.496.0, Stufe 2 Punkt 4 „App-Start sparsamer“, Freigabe Hansi „Punkt 4 bis 20 Uhr bauen“):
-- die Zahlen auf den Kacheln Termine, Helfen, Fotos und Dienste in EINER Abfrage (vorher bis zu 9 je App-Start).
-- Zählt genau wie der Server bisher (kachelZahlen in supabase/functions/kc-club/index.ts, Gleichwertigkeit: tools/db-sparsam/kachel-test.mjs):
--   termine = kommende Treffen (geplant, art treffen) ohne meine Antwort + offene Terminanfragen an mich ohne Antwort
--   helfen  = offene Hilfe-Aufrufe anderer (ab heute) ohne meine Antwort, nicht voll, „online“ nur wenn gesehen (+ Ausleih-Anfragen für den Vorstand)
--   fotos   = neue Fotos anderer seit p_fotos_seit (null → 0) · dienste = meine geänderten Dienste ab heute seit p_dienst_seit (null → 0)
-- Nur lesend; nur der Server (service_role) darf sie aufrufen. Schlägt sie fehl, rechnet der Server wie bisher einzeln.
-- Rückweg: Server 2.495.0 hochladen; drop function public.kc_club_kachel_zahlen(text, boolean, timestamptz, date, timestamptz, timestamptz, text);
create or replace function public.kc_club_kachel_zahlen(p_person text, p_vorstand boolean, p_jetzt timestamptz, p_heute date,
  p_fotos_seit timestamptz, p_dienst_seit timestamptz, p_org text)
returns jsonb
language sql
stable
set search_path = public
as $$
  with tr as (
    select t.id from public.kc_club_treffen t
     where t.status = 'geplant' and t.art = 'treffen' and t.beginn >= p_jetzt
     limit 100
  ), au as (
    select a.id, a.anzahl, a.ziel from public.kc_club_hilfe_aufrufe a
     where a.datum >= p_heute and a.geschlossen_am is null and a.von <> p_person
     limit 100
  )
  select jsonb_build_object(
    'termine',
      (select count(*) from tr
        where not exists (select 1 from public.kc_club_teilnahme n
                           where n.treffen_id = tr.id and n.person_id = p_person and coalesce(n.antwort, '') <> ''))
      + (select count(*) from public.kc_club_terminanfragen q
          where q.status = 'offen' and q.beginn >= p_jetzt
            and q.id in (select e.anfrage_id from public.kc_club_terminanfrage_empfaenger e where e.person_id = p_person and e.antwort is null)),
    'helfen',
      (select count(*) from au
        where (au.ziel is distinct from 'online'
               or exists (select 1 from public.kc_club_hilfe_gesehen g where g.aufruf_id = au.id and g.person_id = p_person))
          and not exists (select 1 from public.kc_club_hilfe_antworten h where h.aufruf_id = au.id and h.person_id = p_person)
          and not (coalesce(au.anzahl, 0) <> 0
                   and (select count(*) from public.kc_club_hilfe_antworten h where h.aufruf_id = au.id and h.antwort = 'komme') >= au.anzahl))
      + case when p_vorstand then (select count(*) from public.kc_club_ausleihen l where l.status = 'angefragt') else 0 end,
    'fotos',
      case when p_fotos_seit is null then 0 else
        (select count(*) from public.kc_club_fotos f
          where f.geloescht_am is null and f.hochgeladen_am > p_fotos_seit and f.hochgeladen_von <> p_person) end,
    'dienste',
      case when p_dienst_seit is null then 0 else
        (select count(*) from public.kc_dp_plan_published d
          where d.org_id = p_org and d.person_id = p_person and d.status = 'published' and d.work_date >= p_heute and d.updated_at > p_dienst_seit) end
  );
$$;
revoke all on function public.kc_club_kachel_zahlen(text, boolean, timestamptz, date, timestamptz, timestamptz, text) from public, anon, authenticated;
grant execute on function public.kc_club_kachel_zahlen(text, boolean, timestamptz, date, timestamptz, timestamptz, text) to service_role;
