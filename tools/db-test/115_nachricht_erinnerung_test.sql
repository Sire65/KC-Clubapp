-- KC-CLUB-KLUGE-HELFER: Probelauf in Supabase – nach der Migration 20261116_kc_club_kluge_helfer_erinnerung.sql in derselben
-- Transaktion, bricht am Ende absichtlich ab (nichts bleibt). Nur ausgedachte Kennungen (KC-P-ZZTEST1, Chat/Nachricht „test-…“) – liest keine Nachrichten.
do $$
declare w uuid; ok_nachricht boolean; ohne_kennung boolean := false; falsche_art boolean := false; alte_arten boolean; rls boolean;
begin
  insert into public.kc_club_wecker (person_id, art, faellig_um, text, thread_id, message_id)
    values ('KC-P-ZZTEST1', 'nachricht', now() + interval '1 hour', 'Nachricht von Test', 'test-chat', 'test-nachricht') returning id into w;
  select exists (select 1 from public.kc_club_wecker where id = w and art = 'nachricht' and status = 'offen') into ok_nachricht;
  begin
    insert into public.kc_club_wecker (person_id, art, faellig_um) values ('KC-P-ZZTEST1', 'nachricht', now() + interval '1 hour');
  exception when check_violation then ohne_kennung := true;
  end;
  begin
    insert into public.kc_club_wecker (person_id, art, faellig_um) values ('KC-P-ZZTEST1', 'gibtsnicht', now() + interval '1 hour');
  exception when check_violation then falsche_art := true;
  end;
  insert into public.kc_club_wecker (person_id, art, faellig_um) values ('KC-P-ZZTEST1', 'wecker', now() + interval '1 hour'), ('KC-P-ZZTEST1', 'timer', now() + interval '2 minutes');
  select count(*) = 2 from public.kc_club_wecker where person_id = 'KC-P-ZZTEST1' and art in ('wecker', 'timer') into alte_arten;
  select relrowsecurity from pg_class where oid = 'public.kc_club_wecker'::regclass into rls;
  raise exception 'TESTBERICHT nachricht_ok=% | ohne_kennung_abgelehnt=% | falsche_art_abgelehnt=% | wecker_timer_weiter=% | rls=%', ok_nachricht, ohne_kennung, falsche_art, alte_arten, rls;
end $$;
