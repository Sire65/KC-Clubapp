-- 2.602.0 KC-CLUB-START-KERN (Schritt 2 „Start schneller“, Hansi: „OK machst du weiter“): Beim Start rief der Server vier Datenbank-Funktionen
-- getrennt auf – Start-Paket, ungelesen je Chat, Kachel-Zahlen, Realtime-Kanal – und das mitten im Gedränge von ~20 weiteren Anfragen.
-- Hier ruft EIN Aufruf genau diese vier vorhandenen Funktionen auf (keine neue Rechnung, keine Kopie ihrer Abfragen). Fällt ein Teil aus,
-- liefert er null – der Server holt dann nur diesen Teil wie bisher einzeln. Nur lesend (STABLE), nur der Server (service_role).
-- Not-Aus ohne neue Version: kc_club_konfig 'start_kern' = {"aus": true}.
-- Rückweg: drop function public.kc_club_start_kern(text, text, date, boolean, timestamptz, timestamptz, timestamptz);
create or replace function public.kc_club_start_kern(p_person text, p_org text, p_heute date, p_vorstand boolean, p_jetzt timestamptz,
  p_fotos_seit timestamptz, p_dienst_seit timestamptz)
returns jsonb language plpgsql stable set search_path = public as $$
declare v_paket jsonb; v_uj jsonb; v_kz jsonb; v_rt text;
begin
  begin v_paket := kc_club_start_paket(p_person, p_org, p_heute); exception when others then v_paket := null; end;
  begin
    select coalesce(jsonb_agg(jsonb_build_object('thread_id', u.thread_id, 'last_read_at', u.last_read_at, 'n', u.n) order by u.ord), '[]'::jsonb)
      into v_uj from kc_club_ungelesen_je_chat(p_person) with ordinality u(thread_id, last_read_at, n, ord);
  exception when others then v_uj := null; end;
  begin v_kz := kc_club_kachel_zahlen(p_person, p_vorstand, p_jetzt, p_heute, p_fotos_seit, p_dienst_seit, p_org); exception when others then v_kz := null; end;
  begin v_rt := kc_club_rt_kanal(p_person); exception when others then v_rt := null; end;
  return jsonb_build_object('paket', v_paket, 'uj', v_uj, 'kz', v_kz, 'rt', v_rt);
end $$;
revoke all on function public.kc_club_start_kern(text, text, date, boolean, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.kc_club_start_kern(text, text, date, boolean, timestamptz, timestamptz, timestamptz) to service_role;
