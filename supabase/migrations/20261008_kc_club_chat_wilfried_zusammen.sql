-- Zwei Einzelchats Hansi ↔ Wilfried zu EINEM zusammenführen (Auftrag Hansi, 08.10.2026, Weg B).
-- Ursache: „📝 Korrektur meiner Daten“ (korrekturMelden) schickte mit Betreff → der Server legte jedes Mal einen neuen Chat an
-- (behoben in 2.93.0: ohne Betreff in den vorhandenen Zweierchat). Die 2 Nachrichten aus dem neuen Chat wandern in den alten.
-- Gelesen-Stand: je Person der spätere der beiden Stände → was ungelesen war, bleibt ungelesen (keine falschen blauen Haken).
-- Nur wenn beide Chats genau so noch existieren (genau 2 Teilnehmer, keine Gruppe); sonst passiert nichts.
-- Sicherung: EINE Protokollzeile „chat_zusammengefuehrt“ mit allen alten Werten (Nachrichten-IDs, Teilnehmer, Betreff).
-- Rückweg: Chat 02463be5-… mit Betreff/Ersteller/Zeit aus der Sicherung neu anlegen, Teilnehmer mit ihren alten last_read_at
-- wieder eintragen und die Nachrichten mit den gesicherten IDs zurück auf diese thread_id setzen.
do $$
declare
  alt constant uuid := '7718b281-cbbc-48ab-9ba3-5bda1f06be07';
  neu constant uuid := '02463be5-1be7-44de-af81-cb90fa12938a';
  ok boolean;
begin
  select (select count(*) from kc_communication_threads where id in (alt, neu)) = 2
     and (select count(*) from kc_club_gruppen where thread_id in (alt, neu)) = 0
     and (select array_agg(person_id order by person_id) from kc_communication_thread_participants where thread_id = alt) = array['KC-P-002', 'KC-P-M0006']
     and (select array_agg(person_id order by person_id) from kc_communication_thread_participants where thread_id = neu) = array['KC-P-002', 'KC-P-M0006']
    into ok;
  if not coalesce(ok, false) then raise notice 'Chats nicht mehr im erwarteten Zustand – nichts geändert'; return; end if;

  insert into kc_club_protokoll (person_id, aktion, details)
  select 'KC-P-002', 'chat_zusammengefuehrt', jsonb_build_object(
    'durch', 'Weg B im Auftrag von Hansi', 'nach', alt, 'von', neu,
    'thread', (select to_jsonb(t) from kc_communication_threads t where id = neu),
    'teilnehmer', (select jsonb_agg(to_jsonb(p)) from kc_communication_thread_participants p where thread_id in (alt, neu)),
    'nachrichten', (select jsonb_agg(id order by created_at) from kc_communication_messages where thread_id = neu));

  update kc_communication_messages set thread_id = alt where thread_id = neu;
  update kc_communication_thread_participants a set last_read_at = greatest(a.last_read_at, b.last_read_at)
    from kc_communication_thread_participants b where a.thread_id = alt and b.thread_id = neu and b.person_id = a.person_id;
  update kc_communication_threads set updated_at = greatest(updated_at, (select updated_at from kc_communication_threads where id = neu)) where id = alt;
  delete from kc_communication_thread_participants where thread_id = neu;
  delete from kc_communication_threads where id = neu;
end $$;
