-- KC-CLUB-LEITUNG-SPARSAM (19.11.2026, Wunsch Hansi „so viel wie möglich über die direkte Leitung, DB-Abfragen minimieren“):
--  • Neue Signal-Arten „gespraech“ (Telefonat angenommen/beendet) und „sichtbar“ (Online-Anzeige/Inkognito/Anklopfen geändert) –
--    der Club-Server schickt sie an alle, die gerade in der App sind (rtKlingelnInApp). Nur die Art, nie Inhalt oder Namen.
--  • Sparbremse: beide gelten als „teuer“ wie „online“ – ab 70 % des Monatskontingents keine Signale mehr (die App gleicht dann im
--    10-Minuten-Sicherheitstakt bzw. ohne Leitung im alten Takt ab). Sonst unverändert gegenüber 20261106_kc_club_rt_terminanfrage.sql.
-- Rückweg: kc_club_rt_klingeln aus 20261106_kc_club_rt_terminanfrage.sql einspielen (dann zählen beide Arten bis 95 %).

create or replace function public.kc_club_rt_klingeln(p_personen text[], p_art text, p_thread uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare p text; v_monat text := to_char(now() at time zone 'Europe/Berlin', 'YYYY-MM'); v_n bigint; v_anz int := coalesce(array_length(p_personen, 1), 0);
begin
  if v_anz = 0 then return; end if;
  begin
    select anzahl into v_n from public.kc_club_rt_zaehler where monat = v_monat;
    v_n := coalesce(v_n, 0);
    if p_art <> 'alarm' and v_n >= 1900000 then return; end if; -- 95 %: nur noch Alarm
    if p_art in ('tippt', 'spricht', 'diktiert', 'vorfuehren', 'mitschauen', 'online', 'pinnwand', 'termin', 'abstimmung', 'livetermin', 'gespraech', 'sichtbar') and v_n >= 1400000 then return; end if; -- 70 %
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
grant execute on function public.kc_club_rt_klingeln(text[], text, uuid) to service_role;
