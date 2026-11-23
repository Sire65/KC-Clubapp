-- KC-CLUB-MAIL-ZUSAGE-2 (Rückmeldung Hansi 23.11.2026): Wer auf der Zusage-Seite (antwort.html) „🤔 Vielleicht“ wählt, bestimmt dort, wann er noch einmal
-- erinnert werden möchte (1 Tag vorher / am Tag selbst 3 Std. vorher / 2 Tage vorher / gar nicht). Der Club-Server schickt dann EINMAL eine Mail mit einem
-- neuen persönlichen Link – nur wenn das Treffen noch geplant ist und die Antwort noch „vielleicht“ lautet.
--   erinnern_um: wann erinnert werden soll (null = nicht erinnern; bei ja/nein geleert)
--   erinnert_am: wann erinnert wurde (gesetzt, bevor die Mail rausgeht – so geht sie nie doppelt raus)
-- Nur additiv. Tabelle und Rechte unverändert (nur Club-Server/service_role, RLS an).
--
-- Zeitplan: Der Minuten-Zeitplan „kc-club-geplant-minute“ ruft geplant_faellig nur, wenn etwas fällig ist. Seine Bedingung bekommt am Ende
--   or exists (select 1 from public.kc_club_antwort_links where erinnern_um <= now() and erinnert_am is null)
-- dazu. Der aktuelle Befehl wird NICHT neu geschrieben, sondern aus cron.job gelesen und nur diese Zeile vor dem abschließenden „;“ angehängt
-- (cron.alter_job, wiederholbar: steht „kc_club_antwort_links“ schon drin, passiert nichts). Sieht der Befehl unerwartet aus (kein geplant_faellig,
-- kein „where exists“, kein abschließendes „;“) oder fehlt der Zeitplan, bleibt er unangetastet und stattdessen ruft eine eigene kleine Regel
-- „kc-club-mail-erinnern“ alle 10 Minuten dieselbe Aktion – nur wenn eine Erinnerung fällig ist.
-- Rückweg: Zeile „or exists (… kc_club_antwort_links …)“ per cron.alter_job wieder entfernen bzw. select cron.unschedule('kc-club-mail-erinnern');
--          drop index if exists public.kc_club_antwort_links_erinnern;
--          alter table public.kc_club_antwort_links drop column if exists erinnern_um, drop column if exists erinnert_am;
alter table public.kc_club_antwort_links add column if not exists erinnern_um timestamptz;
alter table public.kc_club_antwort_links add column if not exists erinnert_am timestamptz;
create index if not exists kc_club_antwort_links_erinnern on public.kc_club_antwort_links (erinnern_um)
  where erinnern_um is not null and erinnert_am is null;
alter table public.kc_club_antwort_links enable row level security;
revoke all on public.kc_club_antwort_links from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_antwort_links to service_role;

do $$
declare
  j record;
  neu text;
  zusatz constant text := E'\n       or exists (select 1 from public.kc_club_antwort_links where erinnern_um <= now() and erinnert_am is null);\n';
begin
  select jobid, command into j from cron.job where jobname = 'kc-club-geplant-minute';
  if j.jobid is not null and position('kc_club_antwort_links' in j.command) > 0 then
    return; -- schon eingetragen (wiederholbar)
  end if;
  if j.jobid is not null
     and position('''geplant_faellig''' in j.command) > 0
     and position(') where exists (' in j.command) > 0
     and j.command ~ ';\s*$' then
    neu := regexp_replace(j.command, ';\s*$', zusatz);
    perform cron.alter_job(job_id := j.jobid, command := neu);
    raise notice 'kc-club-geplant-minute: Bedingung für Zusage-Erinnerungen angehängt';
    return;
  end if;
  -- Rückfall: eigene Regel alle 10 Minuten, nur wenn eine Erinnerung fällig ist (Muster wie kc-club-geplant-minute)
  if not exists (select 1 from cron.job where jobname = 'kc-club-mail-erinnern') then
    perform cron.schedule('kc-club-mail-erinnern', '*/10 * * * *', $cron$
  select net.http_post(
    timeout_milliseconds := 30000,
    url => 'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club',
    headers => '{"Content-Type":"application/json"}'::jsonb,
    body => jsonb_build_object('action', 'geplant_faellig', 'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_cron_secret'))
  ) where exists (select 1 from public.kc_club_antwort_links where erinnern_um <= now() and erinnert_am is null);
$cron$);
    raise notice 'kc-club-geplant-minute unerwartet – eigene Regel kc-club-mail-erinnern (alle 10 Min.) angelegt';
  end if;
end $$;
