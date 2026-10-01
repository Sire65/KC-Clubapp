-- KC Club-App – Version 1.4.0
-- KC-CLUB-SUCHE: globale Suche (Schnellsuche ab 2 Buchstaben + erweiterte Suche mit Bereichen/Zeitraum/Person).
--   kc_club_norm(): Schreibweise vereinheitlichen (klein, ä→a, ae→a, ß→ss …) – „schurzen“ findet „Schürzen“.
--   kc_club_suche(): Treffer je Bereich mit denselben Sichtbarkeitsregeln wie die jeweilige Seite
--   (Nachrichten nur aus eigenen Unterhaltungen, private Termine nur eigene, Protokolle nur mit Recht,
--   Archiv-Ordner „nur Clubleitung“ nur für die Clubleitung). Mitglieder und Aktionen sucht der Server selbst.
--   Suchbegriffe werden nirgends gespeichert. Ausführen darf nur der Server (service_role).
-- Rückweg: drop function kc_club_suche; drop function kc_club_norm;

create or replace function kc_club_norm(t text) returns text language sql immutable parallel safe as $$
  select replace(replace(replace(replace(translate(lower(coalesce(t, '')), 'äöüéèêàáâëïçñ', 'aoueeeaaaeicn'), 'ß', 'ss'), 'ae', 'a'), 'oe', 'o'), 'ue', 'u')
$$;

create or replace function kc_club_suche(
  p_woerter text[], p_bereiche text[], p_person text, p_protokolle boolean, p_vorstand boolean,
  p_von timestamptz default null, p_bis timestamptz default null, p_autor text default null,
  p_anhang boolean default false, p_grenze int default 6
) returns table (bereich text, id text, titel text, inhalt text, datum timestamptz, autor text, extra jsonb, rang int)
language plpgsql stable security definer set search_path = public as $$
declare w text[] := (select array_agg(kc_club_norm(x)) from unnest(p_woerter) x where length(trim(x)) > 0);
begin
  if w is null or array_length(w, 1) is null then return; end if;
  -- Nachrichten: nur Unterhaltungen, in denen ich dabei bin
  if 'nachrichten' = any(p_bereiche) then return query
    select 'nachrichten', m.id::text, coalesce(th.subject, 'Unterhaltung'), m.body, m.created_at, m.sender_person_id, jsonb_build_object('thread', m.thread_id), 1
    from kc_communication_messages m join kc_communication_thread_participants tp on tp.thread_id = m.thread_id and tp.person_id = p_person
    left join kc_communication_threads th on th.id = m.thread_id
    where (select bool_and(kc_club_norm(m.body) like '%' || x || '%') from unnest(w) x)
      and (p_von is null or m.created_at >= p_von) and (p_bis is null or m.created_at < p_bis)
      and (p_autor is null or m.sender_person_id = p_autor)
      and (not p_anhang or exists (select 1 from kc_communication_message_attachments a where a.message_id = m.id))
    order by m.created_at desc limit p_grenze;
  end if;
  -- Anhänge (Dateiname) aus eigenen Unterhaltungen
  if 'nachrichten' = any(p_bereiche) then return query
    select 'nachrichten', m.id::text, coalesce(th.subject, 'Unterhaltung'), '📎 ' || at.file_name, m.created_at, m.sender_person_id, jsonb_build_object('thread', m.thread_id, 'anhang', true), 2
    from kc_communication_message_attachments ma join kc_communication_attachments at on at.id = ma.attachment_id
    join kc_communication_messages m on m.id = ma.message_id
    join kc_communication_thread_participants tp on tp.thread_id = m.thread_id and tp.person_id = p_person
    left join kc_communication_threads th on th.id = m.thread_id
    where (select bool_and(kc_club_norm(at.file_name) like '%' || x || '%') from unnest(w) x)
      and (p_von is null or m.created_at >= p_von) and (p_bis is null or m.created_at < p_bis)
      and (p_autor is null or m.sender_person_id = p_autor)
    order by m.created_at desc limit p_grenze;
  end if;
  if 'termine' = any(p_bereiche) and not p_anhang then
    return query
      select 'termine', t.id::text, t.titel, concat_ws(' · ', t.ort, t.beschreibung), t.beginn, t.erstellt_von, jsonb_build_object('art', 'treffen', 'abgesagt', t.status = 'abgesagt', 'veranstaltung', t.art = 'veranstaltung'),
        case when kc_club_norm(t.titel) like '%' || w[1] || '%' then 3 else 1 end
      from kc_club_treffen t
      where (select bool_and(kc_club_norm(concat_ws(' ', t.titel, t.ort, t.beschreibung)) like '%' || x || '%') from unnest(w) x)
        and (p_von is null or t.beginn >= p_von) and (p_bis is null or t.beginn < p_bis) and (p_autor is null or t.erstellt_von = p_autor)
      order by t.beginn desc limit p_grenze;
    return query
      select 'termine', pt.id::text, pt.titel, concat_ws(' · ', pt.ort, pt.notiz), pt.beginn, pt.person_id, jsonb_build_object('art', 'privat', 'wiederholung', pt.wiederholung),
        case when kc_club_norm(pt.titel) like '%' || w[1] || '%' then 3 else 1 end
      from kc_club_privattermine pt
      where pt.person_id = p_person
        and (select bool_and(kc_club_norm(concat_ws(' ', pt.titel, pt.ort, pt.notiz)) like '%' || x || '%') from unnest(w) x)
        and (p_von is null or pt.beginn >= p_von) and (p_bis is null or pt.beginn < p_bis) and (p_autor is null or pt.person_id = p_autor)
      order by pt.beginn desc limit p_grenze;
    return query
      select 'termine', ta.id::text, ta.anlass, concat_ws(' · ', ta.ort, ta.notiz), ta.beginn, ta.erstellt_von, jsonb_build_object('art', 'anfrage', 'abgesagt', ta.status = 'abgesagt'),
        case when kc_club_norm(ta.anlass) like '%' || w[1] || '%' then 3 else 1 end
      from kc_club_terminanfragen ta
      where (ta.erstellt_von = p_person or exists (select 1 from kc_club_terminanfrage_empfaenger e where e.anfrage_id = ta.id and e.person_id = p_person))
        and (select bool_and(kc_club_norm(concat_ws(' ', ta.anlass, ta.ort, ta.notiz)) like '%' || x || '%') from unnest(w) x)
        and (p_von is null or ta.beginn >= p_von) and (p_bis is null or ta.beginn < p_bis) and (p_autor is null or ta.erstellt_von = p_autor)
      order by ta.beginn desc limit p_grenze;
  end if;
  -- Pinnwand: eigene, an alle, an mich (auch erledigte)
  if 'pinnwand' = any(p_bereiche) and not p_anhang then return query
    select 'pinnwand', z.id::text, left(z.text, 80), z.text, z.erstellt_am, z.person_id, jsonb_build_object('erledigt', z.entfernt_am is not null, 'wichtig', z.wichtig), 1
    from kc_club_pinnwand z
    where (z.person_id = p_person or z.fuer = 'alle' or p_person = any(z.personen))
      and (select bool_and(kc_club_norm(z.text) like '%' || x || '%') from unnest(w) x)
      and (p_von is null or z.erstellt_am >= p_von) and (p_bis is null or z.erstellt_am < p_bis) and (p_autor is null or z.person_id = p_autor)
    order by z.erstellt_am desc limit p_grenze;
  end if;
  -- Protokolle (veröffentlicht; Entwürfe nur Verfasser/Clubleitung) und Aufgaben
  if 'protokolle' = any(p_bereiche) and p_protokolle and not p_anhang then
    return query
      select 'protokolle', pr.id::text, pr.titel, concat_ws(' · ', pr.ort, pr.kurzfassung, array_to_string(pr.tagesordnung, ' · '), array_to_string(pr.beschluesse, ' · ')),
        pr.datum::timestamptz, pr.verfasser, jsonb_build_object('art', 'protokoll', 'entwurf', pr.status <> 'veroeffentlicht'),
        case when kc_club_norm(pr.titel) like '%' || w[1] || '%' then 3 else 1 end
      from kc_club_sitzungsprotokolle pr
      where (pr.status = 'veroeffentlicht' or pr.verfasser = p_person or p_vorstand)
        and (select bool_and(kc_club_norm(concat_ws(' ', pr.titel, pr.ort, pr.kurzfassung, pr.gaeste, array_to_string(pr.tagesordnung, ' '), array_to_string(pr.beschluesse, ' '))) like '%' || x || '%') from unnest(w) x)
        and (p_von is null or pr.datum >= p_von::date) and (p_bis is null or pr.datum < p_bis::date) and (p_autor is null or pr.verfasser = p_autor)
      order by pr.datum desc limit p_grenze;
    return query
      select 'protokolle', au.id::text, au.text, null::text, coalesce(au.faellig::timestamptz, au.erstellt_am), au.erstellt_von, jsonb_build_object('art', 'aufgabe', 'erledigt', au.erledigt_am is not null, 'fuer', au.person_id, 'protokoll', au.protokoll_id), 1
      from kc_club_aufgaben au left join kc_club_sitzungsprotokolle pr on pr.id = au.protokoll_id
      where (au.protokoll_id is null or pr.status = 'veroeffentlicht' or pr.verfasser = p_person or p_vorstand)
        and (select bool_and(kc_club_norm(au.text) like '%' || x || '%') from unnest(w) x)
        and (p_von is null or au.erstellt_am >= p_von) and (p_bis is null or au.erstellt_am < p_bis) and (p_autor is null or au.erstellt_von = p_autor)
      order by au.erstellt_am desc limit p_grenze;
  end if;
  if 'vorschlaege' = any(p_bereiche) and not p_anhang then return query
    select 'vorschlaege', v.id::text, v.titel, v.beschreibung, v.erstellt_am, v.erstellt_von, jsonb_build_object('art', v.art, 'status', v.status),
      case when kc_club_norm(v.titel) like '%' || w[1] || '%' then 3 else 1 end
    from kc_club_vorschlaege v
    where (select bool_and(kc_club_norm(concat_ws(' ', v.titel, v.beschreibung, array_to_string(v.optionen, ' '))) like '%' || x || '%') from unnest(w) x)
      and (p_von is null or v.erstellt_am >= p_von) and (p_bis is null or v.erstellt_am < p_bis) and (p_autor is null or v.erstellt_von = p_autor)
    order by v.erstellt_am desc limit p_grenze;
  end if;
  -- Archiv: Dokumente in Ordnern, die ich sehen darf (nicht im Papierkorb)
  if 'archiv' = any(p_bereiche) then return query
    select 'archiv', d.id::text, d.titel, concat_ws(' · ', o.titel || ' ' || o.jahr, d.register, array_to_string(d.stichworte, ', '), d.datei_name), coalesce(d.datum::timestamptz, d.hochgeladen_am), d.hochgeladen_von,
      jsonb_build_object('ordner', o.id, 'mime', d.mime, 'datei', d.attachment_id, 'vorstand', o.nur_vorstand),
      case when kc_club_norm(d.titel) like '%' || w[1] || '%' then 3 else 1 end
    from kc_club_archiv_dokumente d join kc_club_archiv_ordner o on o.id = d.ordner_id
    where d.geloescht_am is null and o.geloescht_am is null and (not o.nur_vorstand or p_vorstand)
      and (select bool_and(kc_club_norm(concat_ws(' ', d.titel, d.register, d.datei_name, array_to_string(d.stichworte, ' '), o.titel, o.jahr::text)) like '%' || x || '%') from unnest(w) x)
      and (p_von is null or coalesce(d.datum::timestamptz, d.hochgeladen_am) >= p_von) and (p_bis is null or coalesce(d.datum::timestamptz, d.hochgeladen_am) < p_bis)
      and (p_autor is null or d.hochgeladen_von = p_autor)
    order by coalesce(d.datum::timestamptz, d.hochgeladen_am) desc limit p_grenze;
  end if;
  if 'fotos' = any(p_bereiche) then return query
    select 'fotos', f.id::text, coalesce(nullif(f.beschreibung, ''), f.thema, 'Foto'), concat_ws(' · ', f.thema, f.meta->>'ort'), f.datum::timestamptz, f.hochgeladen_von, jsonb_build_object('thema', f.thema), 1
    from kc_club_fotos f
    where f.geloescht_am is null
      and (select bool_and(kc_club_norm(concat_ws(' ', f.thema, f.beschreibung, f.meta->>'ort')) like '%' || x || '%') from unnest(w) x)
      and (p_von is null or f.datum >= p_von::date) and (p_bis is null or f.datum < p_bis::date) and (p_autor is null or f.hochgeladen_von = p_autor)
    order by f.datum desc limit p_grenze;
  end if;
  -- Dienste: nur meine eigenen
  if 'dienste' = any(p_bereiche) and not p_anhang and p_autor is null then return query
    select 'dienste', d.id::text, coalesce(d.event_id, 'Dienst'), concat_ws(' · ', to_char(d.start_time, 'HH24:MI') || '–' || to_char(d.end_time, 'HH24:MI') || ' Uhr', d.area, d.zone), d.work_date::timestamptz, d.person_id, '{}'::jsonb, 1
    from kc_dp_plan_published d
    where d.person_id = p_person
      and (select bool_and(kc_club_norm(concat_ws(' ', d.event_id, d.area, d.zone)) like '%' || x || '%') from unnest(w) x)
      and (p_von is null or d.work_date >= p_von::date) and (p_bis is null or d.work_date < p_bis::date)
    order by d.work_date desc limit p_grenze;
  end if;
end $$;

revoke all on function kc_club_suche(text[], text[], text, boolean, boolean, timestamptz, timestamptz, text, boolean, int) from public, anon, authenticated;
