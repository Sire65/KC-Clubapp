-- KC-CLUB-RT-TERMINANFRAGE (2.874.0, Wunsch Hansi 06.11.2026 „mehr über die Standleitung erledigen“):
--  • Terminanfragen an der direkten Leitung: neue Anfrage → Signal an den Empfänger; Antwort/Gegenvorschlag → Signal an den Absender;
--    Absage → Signal an alle Empfänger. Nur Signal „terminanfrage“ (Art), nie Inhalt. Die App holt wie bisher terminanfragen_liste
--    und fragt bei stehender Leitung nur noch alle 30 statt 5 Minuten zur Sicherheit nach.
--  • Sparbremse: auch „spricht“, „diktiert“ und „livetermin“ sind „teuer“ (wie „tippt“) – ab 70 % des Kontingents keine Signale mehr
--    (bisher vergessen); „terminanfrage“ bleibt bis 95 % (selten, wichtig).
-- Fehler im Signal dürfen das Speichern nie stören (exception when others). Rückweg: Trigger kc_club_rt_ta_* löschen, Funktion
-- kc_club_rt_ta_trigger löschen, kc_club_rt_klingeln aus 20261011_kc_club_v2230_realtime_sparbremse.sql einspielen.

create or replace function public.kc_club_rt_klingeln(p_personen text[], p_art text, p_thread uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare p text; v_monat text := to_char(now() at time zone 'Europe/Berlin', 'YYYY-MM'); v_n bigint; v_anz int := coalesce(array_length(p_personen, 1), 0);
begin
  if v_anz = 0 then return; end if;
  begin
    select anzahl into v_n from public.kc_club_rt_zaehler where monat = v_monat;
    v_n := coalesce(v_n, 0);
    if p_art <> 'alarm' and v_n >= 1900000 then return; end if; -- 95 %: nur noch Alarm
    if p_art in ('tippt', 'spricht', 'diktiert', 'vorfuehren', 'mitschauen', 'online', 'pinnwand', 'termin', 'abstimmung', 'livetermin') and v_n >= 1400000 then return; end if; -- 70 %
    insert into public.kc_club_rt_zaehler (monat, anzahl) values (v_monat, v_anz)
      on conflict (monat) do update set anzahl = public.kc_club_rt_zaehler.anzahl + excluded.anzahl, geaendert_am = now();
  exception when others then null; -- Zähler gestört → trotzdem melden (Signal ist harmlos, Kontingent groß)
  end;
  foreach p in array p_personen loop
    begin
      perform realtime.send(jsonb_build_object('art', p_art) || case when p_thread is null then '{}'::jsonb else jsonb_build_object('thread', p_thread) end,
        'neu', public.kc_club_rt_kanal(p), false);
    exception when others then null;
    end;
  end loop;
end $$;
revoke all on function public.kc_club_rt_klingeln(text[], text, uuid) from public, anon, authenticated;

create or replace function public.kc_club_rt_ta_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    if tg_table_name = 'kc_club_terminanfrage_empfaenger' then
      if tg_op = 'INSERT' then
        perform public.kc_club_rt_klingeln(array[new.person_id], 'terminanfrage');
      elsif row(new.antwort, new.notiz, new.vorschlag_beginn, new.vorschlag_ende) is distinct from row(old.antwort, old.notiz, old.vorschlag_beginn, old.vorschlag_ende) then
        -- Antwort oder Gegenvorschlag → der Absender (nur „gelesen“ ändert nichts für andere → kein Signal)
        perform public.kc_club_rt_klingeln(array(select a.erstellt_von from public.kc_club_terminanfragen a where a.id = new.anfrage_id and a.erstellt_von <> new.person_id), 'terminanfrage');
      end if;
    elsif tg_table_name = 'kc_club_terminanfragen' then
      if new.status is distinct from old.status or new.beginn is distinct from old.beginn or new.ende is distinct from old.ende then
        perform public.kc_club_rt_klingeln(array(select e.person_id from public.kc_club_terminanfrage_empfaenger e where e.anfrage_id = new.id and e.person_id <> new.erstellt_von), 'terminanfrage');
      end if;
    end if;
  exception when others then null; -- das Speichern geht immer vor
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_ta_trigger() from public, anon, authenticated;

drop trigger if exists kc_club_rt_ta_empfaenger on public.kc_club_terminanfrage_empfaenger;
create trigger kc_club_rt_ta_empfaenger after insert or update on public.kc_club_terminanfrage_empfaenger
  for each row execute function public.kc_club_rt_ta_trigger();
drop trigger if exists kc_club_rt_ta_anfrage on public.kc_club_terminanfragen;
create trigger kc_club_rt_ta_anfrage after update on public.kc_club_terminanfragen
  for each row execute function public.kc_club_rt_ta_trigger();
