-- KC Club-App – Version 1.51.0 (Wunsch Hansi 02.10.2026)
-- KC-CLUB-BEGRUESSUNG  „XY hat sich heute zum ersten Mal angemeldet – Begrüßung senden?“ in der Tages-Übersicht (Admin).
--                      Dafür merkt sich die Anmeldung den ersten Besuch (erstmals_gesehen, wird nur einmal gesetzt).
--                      Ein neuer Link (link_erzeugen = upsert ohne diese Spalte) lässt den Wert stehen.
-- Bestand: wer schon da war, bekommt den frühesten bekannten Zeitpunkt (erste Protokollzeile, sonst zuletzt_gesehen),
--          damit niemand fälschlich als „heute zum ersten Mal“ erscheint.
-- Rückweg: kc_club_anmeldung aus 0.56.1 wieder einspielen (ohne erstmals_gesehen) und
--          alter table kc_club_zugang drop column erstmals_gesehen;
alter table kc_club_zugang add column if not exists erstmals_gesehen timestamptz;

update kc_club_zugang z set erstmals_gesehen = least(z.zuletzt_gesehen,
       coalesce((select min(p.zeit) from kc_club_protokoll p where p.person_id = z.person_id), z.zuletzt_gesehen))
 where z.erstmals_gesehen is null and z.zuletzt_gesehen is not null;

create or replace function public.kc_club_anmeldung(p_hash text, p_version text default null::text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
declare v_pid text;
begin
  if p_hash !~ '^[0-9a-f]{64}$' then return null; end if;
  update public.kc_club_zugang set zuletzt_gesehen = now(), erstmals_gesehen = coalesce(erstmals_gesehen, now()),
         app_version = coalesce(left(p_version, 20), app_version)
   where token_hash = p_hash and aktiv
   returning person_id into v_pid;
  if v_pid is null then return null; end if;
  return (select jsonb_build_object(
    'person', (select to_jsonb(x) from (select person_id, display_name, given_name, preferred_name, active from public.kc_core_people where person_id = v_pid) x),
    'rollen', (select to_jsonb(r) from public.kc_club_rollen r where r.person_id = v_pid)));
end;
$function$;

-- KC-CLUB-ANKLOPFEN-WARTEN  Wer anklopft, kann nach der Wartezeit „auflegen“ → Status 'abgebrochen' (beim Gegenüber
--                           verschwindet die Frage). Rückweg: Prüfregel ohne 'abgebrochen' (vorher Zeilen auf 'spaeter' setzen).
alter table kc_club_anklopfen drop constraint if exists kc_club_anklopfen_status_check;
alter table kc_club_anklopfen add constraint kc_club_anklopfen_status_check check (status in ('offen', 'angenommen', 'spaeter', 'abgebrochen'));
