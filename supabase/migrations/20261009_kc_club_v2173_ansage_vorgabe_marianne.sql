-- 2.173.0 KC-CLUB-ANSAGE-VORGABE (Wunsch Hansi 09.10.2026: „bei Marianne einschalten, dass eine Info kommt, wenn jemand online ist oder wieder rausgeht“)
-- Nur eine Vorgabe für KC-P-M0001 (Marianne): ihre App übernimmt sie beim nächsten Öffnen einmal und zeigt einen Hinweis; sie kann es selbst ändern.
-- Rückweg: delete from kc_club_person_einstellung where person_id = 'KC-P-M0001' and schluessel = 'ansage_vorgabe';
insert into kc_club_person_einstellung (person_id, schluessel, wert, geaendert_am)
values ('KC-P-M0001', 'ansage_vorgabe', jsonb_build_object('online', true, 'verlassen', true, 'von', 'Hansi', 'am', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')), now())
on conflict (person_id, schluessel) do update set wert = excluded.wert, geaendert_am = excluded.geaendert_am;
