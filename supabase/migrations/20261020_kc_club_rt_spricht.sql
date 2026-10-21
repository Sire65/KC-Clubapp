-- KC-CLUB-SCHREIBT-HINWEIS (Server/App 2.529.0, Wunsch Hansi „‚Hansi schreibt gerade an dich‘ oder ‚Hansi diktiert gerade eine Nachricht‘ – damit
-- der andere weiß, dass er noch eine Nachricht bekommt“): Für „schreibt …“ gibt es das Signal „tippt“ schon (kc_club_rt_tippen). Neu: nimmt jemand
-- eine Sprachnachricht auf (kc_club_tippen.art = 'sprache') bzw. diktiert (art 'sprache', text 'diktat'), bekommen die anderen Teilnehmer zusätzlich
-- das Signal „spricht“ bzw. „diktiert“ – die App zeigt dann außerhalb des Chats „🎤 … nimmt eine Sprachnachricht für dich auf“ / „🗣️ … diktiert“.
-- Nur Signal (Art + Chat-Kennung), nie Inhalt; eigener Trigger, kc_club_rt_trigger bleibt unverändert; ein gestörtes Signal stört nie das Speichern.
-- Rückweg: drop trigger kc_club_rt_spricht on public.kc_club_tippen; drop function public.kc_club_rt_spricht_trigger();
create or replace function public.kc_club_rt_spricht_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    perform public.kc_club_rt_klingeln(array(select t.person_id from public.kc_communication_thread_participants t
                                               where t.thread_id = new.thread_id and t.person_id <> new.person_id and t.hidden_at is null),
                                       case when new.text = 'diktat' then 'diktiert' else 'spricht' end, new.thread_id);
  exception when others then null;
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_spricht_trigger() from public, anon, authenticated;
drop trigger if exists kc_club_rt_spricht on public.kc_club_tippen;
create trigger kc_club_rt_spricht after insert or update on public.kc_club_tippen
  for each row when (new.art = 'sprache') execute function public.kc_club_rt_spricht_trigger();
