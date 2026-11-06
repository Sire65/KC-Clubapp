-- KC-CLUB-RT-TERMINANFRAGE (2.874.0): Probelauf – läuft in einer Transaktion, die am Ende absichtlich abbricht → nichts bleibt
-- (keine Testpersonen, keine Anfrage, kein Signal, kein Zählerstand). Testpersonen KC-P-ZZTEST1/2, keine Echtdaten.
do $t$
declare
  ka text; kb text; t0 timestamptz := clock_timestamp(); v_id uuid;
  n_neu int; n_antwort int; n_gelesen int; n_absage int; n_inhalt int; n_ta_vor int; n_ta int; n_spricht int;
begin
  insert into public.kc_core_people(person_id, org_id, display_name, given_name, family_name)
    values ('KC-P-ZZTEST1', 'KC_WERNE', 'Test Eins', 'Test', 'Eins'), ('KC-P-ZZTEST2', 'KC_WERNE', 'Test Zwei', 'Test', 'Zwei');
  ka := public.kc_club_rt_kanal('KC-P-ZZTEST1'); kb := public.kc_club_rt_kanal('KC-P-ZZTEST2');
  -- 1. neue Anfrage von 1 an 2 → genau 1 Signal an 2
  insert into public.kc_club_terminanfragen (erstellt_von, anlass, beginn) values ('KC-P-ZZTEST1', 'Treffen', now() + interval '2 days') returning id into v_id;
  insert into public.kc_club_terminanfrage_empfaenger (anfrage_id, person_id) values (v_id, 'KC-P-ZZTEST2');
  select count(*) into n_neu from realtime.messages where inserted_at >= t0 - interval '1 minute' and topic = kb and payload->>'art' = 'terminanfrage';
  -- 2. nur gelesen → kein Signal; Antwort → 1 Signal an den Absender 1
  update public.kc_club_terminanfrage_empfaenger set gelesen_am = now() where anfrage_id = v_id;
  select count(*) into n_gelesen from realtime.messages where inserted_at >= t0 - interval '1 minute' and topic = ka and payload->>'art' = 'terminanfrage';
  update public.kc_club_terminanfrage_empfaenger set antwort = 'ja', geantwortet_am = now() where anfrage_id = v_id;
  select count(*) into n_antwort from realtime.messages where inserted_at >= t0 - interval '1 minute' and topic = ka and payload->>'art' = 'terminanfrage';
  -- 3. Absage → Signal an den Empfänger 2 (zusammen mit 1. also 2)
  update public.kc_club_terminanfragen set status = 'abgesagt' where id = v_id;
  select count(*) into n_absage from realtime.messages where inserted_at >= t0 - interval '1 minute' and topic = kb and payload->>'art' = 'terminanfrage';
  -- 4. nur die Art, nie Inhalt
  select count(*) into n_inhalt from realtime.messages where inserted_at >= t0 - interval '1 minute' and topic in (ka, kb) and (payload - 'art') <> '{}'::jsonb;
  -- 5. Sparbremse: ab 70 % kein „spricht“ mehr, „terminanfrage“ schon
  insert into public.kc_club_rt_zaehler (monat, anzahl) values (to_char(now() at time zone 'Europe/Berlin', 'YYYY-MM'), 1500000)
    on conflict (monat) do update set anzahl = 1500000;
  select count(*) into n_ta_vor from realtime.messages where inserted_at >= t0 - interval '1 minute' and topic = kb and payload->>'art' = 'terminanfrage';
  perform public.kc_club_rt_klingeln(array['KC-P-ZZTEST2'], 'spricht');
  perform public.kc_club_rt_klingeln(array['KC-P-ZZTEST2'], 'terminanfrage');
  select count(*) - n_ta_vor into n_ta from realtime.messages where inserted_at >= t0 - interval '1 minute' and topic = kb and payload->>'art' = 'terminanfrage';
  select count(*) into n_spricht from realtime.messages where inserted_at >= t0 - interval '1 minute' and topic = kb and payload->>'art' = 'spricht';
  raise exception 'TESTBERICHT neu=% | gelesen=% | antwort=% | absage=% | inhalt=% | bremse70_spricht=% | bremse70_terminanfrage=%', n_neu, n_gelesen, n_antwort, n_absage, n_inhalt, n_spricht, n_ta;
end $t$;
