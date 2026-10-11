-- KC-CLUB-REALTIME-VORFUEHREN (2.229.0, Wunsch Hansi „Bildschirm zeigen kommt mit etwas Verzögerung an – auch an die direkte
-- Leitung“): neues Live-Bild / Statuswechsel bei „📺 Live zeigen“ (schluessel vorfuehren) und „🔴 Mitschauen“ (schnappschuss) →
-- Signal an beide Seiten (Zuschauer = person_id, Zeigender = wert.von). Nur Signal, nie das Bild. Nur diese zwei Schlüssel (WHEN).
-- Rückweg: drop trigger kc_club_rt_live on public.kc_club_person_einstellung; drop function public.kc_club_rt_live_trigger();
create or replace function public.kc_club_rt_live_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    perform public.kc_club_rt_klingeln(array_remove(array[new.person_id, new.wert->>'von'], null),
      case new.schluessel when 'vorfuehren' then 'vorfuehren' else 'mitschauen' end);
  exception when others then null;
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_live_trigger() from public, anon, authenticated;
create trigger kc_club_rt_live after insert or update on public.kc_club_person_einstellung
  for each row when (new.schluessel in ('vorfuehren', 'schnappschuss')) execute function public.kc_club_rt_live_trigger();
