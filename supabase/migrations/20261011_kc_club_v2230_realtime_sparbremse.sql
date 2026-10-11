-- KC-CLUB-RT-SPARBREMSE + weitere Bereiche an der direkten Leitung (2.230.0, Wunsch Hansi „Sparbremse und Alarm/SOS einbauen,
-- dann alle weiteren“). Kostenlos-Kontingent Supabase Realtime: 2 Mio. Signale/Monat (Regel 6: Zero-Cost ist Release-Gate).
--  • Zähler je Monat (Europe/Berlin). Ab 70 % keine „teuren“ Signale mehr (tippt, vorfuehren, mitschauen, online, pinnwand,
--    termin, abstimmung), ab 95 % nur noch Alarm. Die App fragt dann wie früher selbst nach – es geht nichts verloren.
--  • Alarm: Notfall-Meldung (Text beginnt mit „🚨 NOTFALL“) → Signal „alarm“ (App lädt sofort).
--  • Gelesen-Haken: nur wenn jemand tatsächlich Nachrichten ANDERER gelesen hat (kein Hin-und-her zwischen zwei Geräten).
--  • Online: nur bei Beginn einer neuen Sitzung, nicht bei jedem Lebenszeichen; nicht bei verborgener Online-Anzeige / Inkognito.
--  • Pinnwand, Termin-Zusagen, Abstimmungen (offene Stimmen + Status; geheime Stimmen bewusst ohne Signal).
-- Weiter gilt: nur Signal (Art + Kennung), nie Inhalt. Rückweg: Trigger löschen, Funktionen aus v2229 einspielen, Tabelle löschen.

create table if not exists public.kc_club_rt_zaehler (
  monat text primary key, anzahl bigint not null default 0, gewarnt jsonb not null default '{}'::jsonb, geaendert_am timestamptz not null default now());
alter table public.kc_club_rt_zaehler enable row level security;
revoke all on table public.kc_club_rt_zaehler from public, anon, authenticated;

create or replace function public.kc_club_rt_klingeln(p_personen text[], p_art text, p_thread uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare p text; v_monat text := to_char(now() at time zone 'Europe/Berlin', 'YYYY-MM'); v_n bigint; v_anz int := coalesce(array_length(p_personen, 1), 0);
begin
  if v_anz = 0 then return; end if;
  begin
    select anzahl into v_n from public.kc_club_rt_zaehler where monat = v_monat;
    v_n := coalesce(v_n, 0);
    if p_art <> 'alarm' and v_n >= 1900000 then return; end if; -- 95 %: nur noch Alarm
    if p_art in ('tippt', 'vorfuehren', 'mitschauen', 'online', 'pinnwand', 'termin', 'abstimmung') and v_n >= 1400000 then return; end if; -- 70 %
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

-- alle mit aktivem Club-App-Zugang (für „an alle“-Signale)
create or replace function public.kc_club_rt_alle(p_ohne text default null) returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(person_id), '{}') from public.kc_club_zugang where aktiv and person_id is distinct from p_ohne
$$;
revoke all on function public.kc_club_rt_alle(text) from public, anon, authenticated;

create or replace function public.kc_club_rt_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    if tg_table_name = 'kc_communication_messages' then
      perform public.kc_club_rt_klingeln(array(select person_id from public.kc_communication_thread_participants where thread_id = new.thread_id and person_id <> new.sender_person_id),
        case when coalesce(new.body, '') ~ '^\s*🚨\s*NOTFALL' then 'alarm' else 'chat' end, new.thread_id);
    elsif tg_table_name = 'kc_communication_thread_participants' then
      -- nur wenn wirklich ungelesene Nachrichten ANDERER gelesen wurden
      if exists (select 1 from public.kc_communication_messages m where m.thread_id = new.thread_id and m.sender_person_id <> new.person_id
                   and m.created_at > coalesce(old.last_read_at, '-infinity'::timestamptz) and m.created_at <= new.last_read_at) then
        perform public.kc_club_rt_klingeln(array(select person_id from public.kc_communication_thread_participants where thread_id = new.thread_id and person_id <> new.person_id and hidden_at is null), 'gelesen', new.thread_id);
      end if;
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
    elsif tg_table_name = 'kc_club_pinnwand' then
      perform public.kc_club_rt_klingeln(case when coalesce(array_length(new.personen, 1), 0) > 0
        then array(select distinct x from unnest(new.personen || array[new.person_id]) x where x is not null) else public.kc_club_rt_alle(null) end, 'pinnwand');
    elsif tg_table_name = 'kc_club_teilnahme' then
      perform public.kc_club_rt_klingeln(public.kc_club_rt_alle(new.person_id), 'termin');
    elsif tg_table_name = 'kc_club_stimmen' then
      perform public.kc_club_rt_klingeln(public.kc_club_rt_alle(new.person_id), 'abstimmung');
    elsif tg_table_name = 'kc_club_vorschlaege' then
      if tg_op = 'INSERT' or new.status is distinct from old.status then perform public.kc_club_rt_klingeln(public.kc_club_rt_alle(null), 'abstimmung'); end if;
    end if;
  exception when others then null;
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_trigger() from public, anon, authenticated;

-- Online: nur Beginn einer neuen Sitzung (wert.seit neu); nicht bei verborgener Online-Anzeige oder Inkognito
create or replace function public.kc_club_rt_online_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    if tg_op = 'INSERT' or (new.wert->>'seit') is distinct from (old.wert->>'seit') then
      if not exists (select 1 from public.kc_club_person_einstellung e where e.person_id = new.person_id
                       and ((e.schluessel = 'online' and e.wert->>'zeigen' = 'false') or (e.schluessel = 'inkognito' and e.wert->>'an' = 'true'))) then
        perform public.kc_club_rt_klingeln(public.kc_club_rt_alle(new.person_id), 'online');
      end if;
    end if;
  exception when others then null;
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_online_trigger() from public, anon, authenticated;
