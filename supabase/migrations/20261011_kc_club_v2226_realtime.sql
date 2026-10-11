-- KC-CLUB-REALTIME (2.226.0, Wunsch Hansi): „direkte Leitung“ statt ständigem Nachfragen. Die Datenbank meldet über Supabase
-- Realtime (Broadcast, kostenlos) nur ein SIGNAL „es gibt Neues“ (Art + ggf. Chat-Kennung) – nie Text oder Namen. Den Inhalt holt
-- die App wie bisher über den Server (kc-club, mit Zugangsschlüssel). Kanal je Person = HMAC(Geheimnis, person_id) → nicht erratbar.
-- Fällt Realtime aus, fragt die App wie früher selbst nach (nichts geht verloren). Rückweg: Trigger + Funktionen unten löschen.

-- Geheimnis für die Kanalnamen (nur im Vault, nie in der App)
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'kc_club_rt_geheimnis') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'kc_club_rt_geheimnis', 'KC-CLUB-REALTIME: Schlüssel für die Kanalnamen');
  end if;
end $$;

create or replace function public.kc_club_rt_kanal(p_person text) returns text
language sql stable security definer set search_path = '' as $$
  select 'kc-club-' || left(encode(extensions.hmac(p_person, (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_rt_geheimnis'), 'sha256'), 'hex'), 32)
$$;
revoke all on function public.kc_club_rt_kanal(text) from public, anon, authenticated;
grant execute on function public.kc_club_rt_kanal(text) to service_role;

-- Signal an mehrere Personen; Fehler im Signal dürfen das eigentliche Speichern nie stören
create or replace function public.kc_club_rt_klingeln(p_personen text[], p_art text, p_thread uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare p text;
begin
  foreach p in array coalesce(p_personen, '{}') loop
    begin
      perform realtime.send(jsonb_build_object('art', p_art) || case when p_thread is null then '{}'::jsonb else jsonb_build_object('thread', p_thread) end,
        'neu', public.kc_club_rt_kanal(p), false);
    exception when others then null; -- Realtime gestört → App fragt wie früher selbst nach
    end;
  end loop;
end $$;
revoke all on function public.kc_club_rt_klingeln(text[], text, uuid) from public, anon, authenticated;

create or replace function public.kc_club_rt_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    if tg_table_name = 'kc_communication_messages' then
      perform public.kc_club_rt_klingeln(array(select person_id from public.kc_communication_thread_participants where thread_id = new.thread_id and person_id <> new.sender_person_id), 'chat', new.thread_id);
    elsif tg_table_name = 'kc_club_tippen' then
      perform public.kc_club_rt_klingeln(array(select person_id from public.kc_communication_thread_participants where thread_id = new.thread_id and person_id <> new.person_id and hidden_at is null), 'tippt', new.thread_id);
    elsif tg_table_name = 'kc_club_anklopfen' then
      if tg_op = 'INSERT' then perform public.kc_club_rt_klingeln(array[new.an], 'klopfen');
      elsif new.status is distinct from old.status then perform public.kc_club_rt_klingeln(array[new.von, new.an], 'klopfen'); end if;
    elsif tg_table_name = 'kc_club_anruf' then
      if tg_op = 'INSERT' or new.status is distinct from old.status or new.antwort is distinct from old.antwort then
        perform public.kc_club_rt_klingeln(array[new.von, new.an], 'anruf');
      end if;
    end if;
  exception when others then null;
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_trigger() from public, anon, authenticated;

drop trigger if exists kc_club_rt_nachricht on public.kc_communication_messages;
create trigger kc_club_rt_nachricht after insert on public.kc_communication_messages for each row execute function public.kc_club_rt_trigger();
drop trigger if exists kc_club_rt_tippen on public.kc_club_tippen;
create trigger kc_club_rt_tippen after insert or update on public.kc_club_tippen for each row execute function public.kc_club_rt_trigger();
drop trigger if exists kc_club_rt_anklopfen on public.kc_club_anklopfen;
create trigger kc_club_rt_anklopfen after insert or update on public.kc_club_anklopfen for each row execute function public.kc_club_rt_trigger();
drop trigger if exists kc_club_rt_anruf on public.kc_club_anruf;
create trigger kc_club_rt_anruf after insert or update on public.kc_club_anruf for each row execute function public.kc_club_rt_trigger();
