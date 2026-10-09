-- KC-CLUB-WM-TODO Nachtrag (09.10.2026, Wunsch Hansi „Kleingeld besorgen auf die To-do“): ein weiteres To-do für den Weihnachtsmarkt.
-- Nur Daten: 1 To-do für Hansi (KC-P-002, „nur ich“, keine Zuständigen → keine Benachrichtigung). Wiederholbar (legt nichts doppelt an).
-- Rückweg: update public.kc_club_todo set entfernt_am = now() where person_id = 'KC-P-002' and text = '🎄 WM: Kleingeld (Wechselgeld) für die Kasse besorgen' and entfernt_am is null;
insert into public.kc_club_todo (person_id, text, kategorie, fuer, faellig)
select 'KC-P-002', '🎄 WM: Kleingeld (Wechselgeld) für die Kasse besorgen', 'erledigen', 'ich', date '2026-11-27'
where not exists (select 1 from public.kc_club_todo t where t.person_id = 'KC-P-002' and t.text = '🎄 WM: Kleingeld (Wechselgeld) für die Kasse besorgen' and t.entfernt_am is null);
