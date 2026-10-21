-- KC-CLUB-RT-PUSH-ANGEZEIGT (DB ohne App-Build, 20.10.2026, Wunsch Hansi „Warum bekommt man bei WhatsApp graue Haken sobald es auf dem Handy
-- angekommen ist? Bei uns sieht man lange nur einen Haken“ → „Ja, bauen und sofort einspielen“):
-- Meldet das Handy des Empfängers „Push angezeigt“ bzw. „geöffnet“ (Status des Versandauftrags im KC Communicator wechselt auf displayed/opened),
-- bekommt der ABSENDER der Chat-Nachricht sofort dasselbe Signal wie bei „angekommen/gelesen“ (Art „gelesen“ + Chat-Kennung). Seine App lädt
-- den offenen Chat einmal und zeigt die zwei grauen Haken – im Mittel ~5 s nach dem Zustellen statt erst bei der nächsten Sicherheits-Nachfrage
-- (30–60 s; seit 2.510.0 fragt die App bei stehender Leitung nicht mehr alle 4 s nach).
-- Nur Chat-Pushes der Club-App (source_program kc-club, Kennung „club-nachricht:<id>“), nur beim WECHSEL des Status. Nur Signal, nie Inhalt.
-- Ein Fehler im Signal kann die Zustellung nie stören (wird verschluckt). Sparbremse wie immer in kc_club_rt_klingeln.
-- Rückweg: drop trigger kc_club_rt_push_angezeigt on public.kc_communication_requests; drop function public.kc_club_rt_push_angezeigt_trigger();
create or replace function public.kc_club_rt_push_angezeigt_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_von text; v_thread uuid;
begin
  begin
    select m.sender_person_id, m.thread_id into v_von, v_thread
      from public.kc_communication_messages m
     where m.id = split_part(new.correlation_id, ':', 2)::uuid;
    if v_von is not null then
      perform public.kc_club_rt_klingeln(array[v_von], 'gelesen', v_thread);
    end if;
  exception when others then null; -- ein Signal darf die Zustellung nie stören
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_push_angezeigt_trigger() from public, anon, authenticated;
drop trigger if exists kc_club_rt_push_angezeigt on public.kc_communication_requests;
create trigger kc_club_rt_push_angezeigt after update of status on public.kc_communication_requests
  for each row when (new.source_program = 'kc-club' and new.channel = 'push' and new.correlation_id like 'club-nachricht:%'
                     and new.status in ('displayed', 'opened') and old.status is distinct from new.status)
  execute function public.kc_club_rt_push_angezeigt_trigger();
