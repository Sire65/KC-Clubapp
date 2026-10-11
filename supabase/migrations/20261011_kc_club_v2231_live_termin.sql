-- KC-CLUB-LIVE-TERMIN (2.231.0, Wunsch Hansi): Live-Abstimmung über den nächsten Sitzungstermin am Ende der Köcheclub-Sitzung.
-- Baut auf der vorhandenen Terminfindung auf (kc_club_terminumfragen/-optionen/-antworten, Festlegen legt Termin + Zusagen an):
--  • live = true: Abstimmung läuft gerade auf der Sitzung (alle Mitglieder mit offener App bekommen das Fenster)
--  • live_option: der gerade gezeigte Vorschlag (bei „Alternative vorschlagen“ kommt eine neue Option dazu)
-- Signal „livetermin“ über die direkte Leitung an alle (nur Signal, keine Namen/Antworten). Rückweg: Trigger + Spalten löschen.
alter table public.kc_club_terminumfragen add column if not exists live boolean not null default false;
alter table public.kc_club_terminumfragen add column if not exists live_option uuid references public.kc_club_terminumfrage_optionen(id) on delete set null;

create or replace function public.kc_club_rt_live_termin_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_umfrage uuid; v_option uuid;
begin
  begin
    if tg_table_name = 'kc_club_terminumfragen' then
      if new.live or (tg_op = 'UPDATE' and old.live) then perform public.kc_club_rt_klingeln(public.kc_club_rt_alle(null), 'livetermin', new.id); end if;
    else -- Antworten (auch gelöscht)
      v_option := case when tg_op = 'DELETE' then old.option_id else new.option_id end;
      select o.umfrage_id into v_umfrage from public.kc_club_terminumfrage_optionen o join public.kc_club_terminumfragen u on u.id = o.umfrage_id
        where o.id = v_option and u.live;
      if v_umfrage is not null then perform public.kc_club_rt_klingeln(public.kc_club_rt_alle(null), 'livetermin', v_umfrage); end if;
    end if;
  exception when others then null;
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_live_termin_trigger() from public, anon, authenticated;
create trigger kc_club_rt_live_termin after insert or update on public.kc_club_terminumfragen for each row execute function public.kc_club_rt_live_termin_trigger();
create trigger kc_club_rt_live_antwort after insert or update or delete on public.kc_club_terminumfrage_antworten for each row execute function public.kc_club_rt_live_termin_trigger();
