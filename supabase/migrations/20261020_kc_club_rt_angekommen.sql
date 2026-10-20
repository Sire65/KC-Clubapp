-- KC-CLUB-RT-ANGEKOMMEN (Server/App 2.510.0, Wunsch Hansi „Ja, 1 und 2 bauen für 12 Uhr“ – Chat sparsamer):
-- Ist eine Nachricht beim Empfänger angekommen (dessen App hat sie geladen → Eintrag „angekommen“ in kc_club_chat_quittung), bekommen die
-- anderen Teilnehmer dasselbe Signal wie bei „gelesen“ (Art „gelesen“ + Chat-Kennung). Die App lädt einen offenen Chat dann einmal neu
-- und zeigt die zwei grauen Haken sofort – statt 60 s lang alle 4 s nachzufragen (bis zu 15 Ladevorgänge à ~34 Abfragen je Nachricht).
-- Nur Signal (Art + Kennung), nie Inhalt. Eigener Trigger, kc_club_rt_trigger bleibt unverändert. Sparbremse wie immer in kc_club_rt_klingeln.
-- Rückweg: drop trigger kc_club_rt_angekommen on public.kc_club_chat_quittung; drop function public.kc_club_rt_angekommen_trigger();
create or replace function public.kc_club_rt_angekommen_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    perform public.kc_club_rt_klingeln(array(select t.person_id from public.kc_communication_thread_participants t
                                               where t.thread_id = new.thread_id and t.person_id <> new.person_id and t.hidden_at is null),
                                       'gelesen', new.thread_id);
  exception when others then null; -- ein Signal darf das Speichern der Quittung nie verhindern
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_angekommen_trigger() from public, anon, authenticated;
drop trigger if exists kc_club_rt_angekommen on public.kc_club_chat_quittung;
create trigger kc_club_rt_angekommen after insert on public.kc_club_chat_quittung
  for each row when (new.art = 'angekommen') execute function public.kc_club_rt_angekommen_trigger();
