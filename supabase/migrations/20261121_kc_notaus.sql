-- KC-NOTAUS (21.11.2026, Wunsch Hansi „Baue mir einen roten Notfall-Knopf wie an technischen Maschinen. Sobald ich den drücke, sofort und so schnell
-- wie möglich Nachrichten und auch E-Mails im KC Communicator stoppen, damit nix rausgeht.“ – Freigabe: „Alle Nachrichten stoppen und den Not-Aus in
-- das Nachrichten-Modul und auch in KC Communicator.“)
--
-- Gemeinsamer Vertrag Club-App ⇄ KC Communicator:
--   kc_communication_settings (Zeile id = 'global'): dispatch_enabled = false heißt NOT-AUS aktiv (Router und Dispatcher lehnen ab bzw. halten an);
--     neu notaus_seit / notaus_von / notaus_quelle ('club' | 'communicator').
--   kc_communication_requests: neuer Status 'angehalten' (status ist text ohne CHECK). Der alte Status steht in audit_meta->>'notaus_vorher'
--     (die JSON-Spalte heißt audit_meta – eine Spalte „metadata“ gibt es nicht), dazu audit_meta.notaus_am / notaus_verworfen_am.
--     'processing' (läuft gerade) wird nie angefasst.
--   kc_notaus_ausloesen(p_von, p_quelle, p_probe) · kc_notaus_entriegeln(p_von, p_aktion 'senden'|'verwerfen'|'behalten') · kc_notaus_stand()
--   Alle drei nur für den Server (service_role) – kein Eintrag im Prüfregister nötig (KC-SECURITY-DEFINER-REGISTER Punkt 1).
--   kc_notaus_stand liefert nur Zahlen – nie Texte oder Empfänger (KC-CHATS-PRIVAT).
-- Keine neue Tabelle (keine neuen Tabellenrechte nötig). Wiederholbar.
--
-- Rückweg: drop function if exists public.kc_notaus_ausloesen(text, text, boolean); drop function if exists public.kc_notaus_entriegeln(text, text);
--   drop function if exists public.kc_notaus_stand(); alter table public.kc_communication_settings drop column if exists notaus_seit,
--   drop column if exists notaus_von, drop column if exists notaus_quelle;
--   (vorher angehaltene Aufträge freigeben: select public.kc_notaus_entriegeln('rueckweg', 'senden');)

alter table public.kc_communication_settings add column if not exists notaus_seit timestamptz;
alter table public.kc_communication_settings add column if not exists notaus_von text;
alter table public.kc_communication_settings add column if not exists notaus_quelle text;

-- Angehaltene Aufträge schnell finden (Stand, Entriegeln) – Teilverzeichnis, normalerweise leer
create index if not exists kc_communication_requests_angehalten_idx
  on public.kc_communication_requests (channel) where status = 'angehalten';

create or replace function public.kc_notaus_ausloesen(p_von text, p_quelle text, p_probe boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seit timestamptz;
  v_n integer := 0;
  v_quelle text := case when p_quelle in ('club', 'communicator') then p_quelle else 'club' end;
begin
  if coalesce(p_probe, false) then
    -- Probe: nur zählen, nichts ändern
    select count(*) into v_n from public.kc_communication_requests
     where status in ('queued', 'retry_scheduled', 'pending', 'routed');
    select case when dispatch_enabled then null else coalesce(notaus_seit, now()) end into v_seit
      from public.kc_communication_settings where id = 'global';
    return jsonb_build_object('ok', true, 'aktiv', v_seit is not null, 'seit', v_seit, 'angehalten', v_n, 'probe', true);
  end if;

  -- zuerst den Schalter (ab jetzt nimmt niemand mehr etwas an), dann die wartenden Aufträge anhalten – alles in dieser einen Transaktion
  update public.kc_communication_settings
     set dispatch_enabled = false,
         notaus_seit = coalesce(notaus_seit, now()),
         notaus_von = coalesce(notaus_von, left(coalesce(p_von, ''), 80)),
         notaus_quelle = coalesce(notaus_quelle, v_quelle)
   where id = 'global'
  returning notaus_seit into v_seit;

  update public.kc_communication_requests
     set status = 'angehalten',
         audit_meta = coalesce(audit_meta, '{}'::jsonb) || jsonb_build_object('notaus_vorher', status, 'notaus_am', now(), 'notaus', true)
   where status in ('queued', 'retry_scheduled', 'pending', 'routed');
  get diagnostics v_n = row_count;

  return jsonb_build_object('ok', true, 'aktiv', true, 'seit', v_seit, 'angehalten', v_n, 'probe', false);
end
$$;

create or replace function public.kc_notaus_entriegeln(p_von text, p_aktion text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_frei integer := 0;
  v_weg integer := 0;
  v_rest integer := 0;
begin
  if p_aktion is null or p_aktion not in ('senden', 'verwerfen', 'behalten') then
    raise exception 'kc_notaus_entriegeln: unbekannte Aktion %', p_aktion using errcode = '22023';
  end if;

  update public.kc_communication_settings
     set dispatch_enabled = true, notaus_seit = null, notaus_von = null, notaus_quelle = null
   where id = 'global';

  if p_aktion = 'senden' then
    -- der Warteschlangen-Takt des Routers holt queued mit scheduled_for <= now() ab
    update public.kc_communication_requests
       set status = 'queued', scheduled_for = now(), locked_at = null, next_attempt_at = null,
           audit_meta = coalesce(audit_meta, '{}'::jsonb) || jsonb_build_object('notaus_frei_am', now(), 'notaus_frei_von', left(coalesce(p_von, ''), 80))
     where status = 'angehalten';
    get diagnostics v_frei = row_count;
  elsif p_aktion = 'verwerfen' then
    update public.kc_communication_requests
       set status = 'verworfen', locked_at = null, next_attempt_at = null,
           audit_meta = coalesce(audit_meta, '{}'::jsonb) || jsonb_build_object('notaus_verworfen_am', now(), 'notaus_verworfen_von', left(coalesce(p_von, ''), 80))
     where status = 'angehalten';
    get diagnostics v_weg = row_count;
  else
    select count(*) into v_rest from public.kc_communication_requests where status = 'angehalten';
  end if;

  return jsonb_build_object('ok', true, 'aktiv', false, 'aktion', p_aktion, 'freigegeben', v_frei, 'verworfen', v_weg, 'behalten', v_rest);
end
$$;

create or replace function public.kc_notaus_stand()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  -- nur Zahlen: kein Text, kein Empfänger, keine Variablen
  select jsonb_build_object(
    'aktiv', coalesce(not s.dispatch_enabled, false),
    'seit', case when s.dispatch_enabled then null else s.notaus_seit end,
    'von', case when s.dispatch_enabled then null else s.notaus_von end,
    'quelle', case when s.dispatch_enabled then null else s.notaus_quelle end,
    'angehalten', (select count(*) from public.kc_communication_requests where status = 'angehalten'),
    'nach_kanal', coalesce((select jsonb_object_agg(k.channel, k.n) from (
        select coalesce(channel, 'sonst') as channel, count(*) as n from public.kc_communication_requests
         where status = 'angehalten' group by 1) k), '{}'::jsonb))
  from (select 1) x
  left join public.kc_communication_settings s on s.id = 'global'
$$;

revoke all on function public.kc_notaus_ausloesen(text, text, boolean) from public, anon, authenticated;
revoke all on function public.kc_notaus_entriegeln(text, text) from public, anon, authenticated;
revoke all on function public.kc_notaus_stand() from public, anon, authenticated;
grant execute on function public.kc_notaus_ausloesen(text, text, boolean) to service_role;
grant execute on function public.kc_notaus_entriegeln(text, text) to service_role;
grant execute on function public.kc_notaus_stand() to service_role;
