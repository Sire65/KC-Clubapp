-- KC-CLUB-RT (2.230.0) Teil 2: neue Trigger (eigene Datei – Trigger an viel genutzten Tabellen einzeln, wie bei v2226)
create trigger kc_club_rt_gelesen after update of last_read_at on public.kc_communication_thread_participants
  for each row when (new.last_read_at is distinct from old.last_read_at) execute function public.kc_club_rt_trigger();
create trigger kc_club_rt_pinnwand after insert or update on public.kc_club_pinnwand for each row execute function public.kc_club_rt_trigger();
create trigger kc_club_rt_termin after insert or update on public.kc_club_teilnahme for each row execute function public.kc_club_rt_trigger();
create trigger kc_club_rt_stimme after insert or update on public.kc_club_stimmen for each row execute function public.kc_club_rt_trigger();
create trigger kc_club_rt_vorschlag after insert or update on public.kc_club_vorschlaege for each row execute function public.kc_club_rt_trigger();
create trigger kc_club_rt_online after insert or update on public.kc_club_person_einstellung
  for each row when (new.schluessel = 'online_seit') execute function public.kc_club_rt_online_trigger();
