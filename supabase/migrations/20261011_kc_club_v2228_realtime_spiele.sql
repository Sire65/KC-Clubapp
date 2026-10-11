-- KC-CLUB-REALTIME-SPIELE (2.228.0, Wunsch Hansi „Spiele auch an die Leitung anschließen“): jeder Zug, jede Herausforderung,
-- Annahme/Aufgabe (Zeile in kc_club_spiele neu/geändert) → Signal „spiel“ an beide Spieler (Kennung des Spiels im Feld „thread“).
-- Nur Signal, kein Spielstand – den holt die App wie bisher über den Server. Rückweg: Trigger löschen, Funktion aus v2226 einspielen.
create or replace function public.kc_club_rt_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    if tg_table_name = 'kc_communication_messages' then
      perform public.kc_club_rt_klingeln(array(select person_id from public.kc_communication_thread_participants where thread_id = new.thread_id and person_id <> new.sender_person_id), 'chat', new.thread_id);
    elsif tg_table_name = 'kc_club_tippen' then
      perform public.kc_club_rt_klingeln(array(select person_id from public.kc_communication_thread_participants where thread_id = new.thread_id and person_id <> new.person_id and hidden_at is null), 'tippt', new.thread_id);
    elsif tg_table_name = 'kc_club_anklopfen' then
      if tg_op = 'INSERT' then perform public.kc_club_rt_klingeln(array[new.an], 'klopfen');
      elsif new.status is distinct from old.status then perform public.kc_club_rt_klingeln(array[new.von, new.an], 'klopfen'); end if;
    elsif tg_table_name = 'kc_club_anruf' then
      if tg_op = 'INSERT' or new.status is distinct from old.status or new.antwort is distinct from old.antwort then
        perform public.kc_club_rt_klingeln(array[new.von, new.an], 'anruf');
      end if;
    elsif tg_table_name = 'kc_club_spiele' then
      perform public.kc_club_rt_klingeln(array_remove(array[new.von, new.an], null), 'spiel', new.id);
    end if;
  exception when others then null;
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_trigger() from public, anon, authenticated;
create trigger kc_club_rt_spiel after insert or update on public.kc_club_spiele for each row execute function public.kc_club_rt_trigger();
