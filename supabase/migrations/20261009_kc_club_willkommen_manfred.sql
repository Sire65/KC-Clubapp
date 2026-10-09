-- KC-CLUB-WILLKOMMEN-PINNWAND – erneut aushängen (09.10.2026, Wunsch Hansi „Ja häng ihn wieder auf“):
-- Manfreds automatischer Willkommens-Zettel (07.10., 12:51) war 20 Min. später abgenommen worden. Gleicher Zettel wie willkommenAushaengen():
-- vom Admin, ❗ wichtig, für alle, Antworten erlaubt, + Protokoll „pinnwand_willkommen“ (→ Knopf „💐 Ich möchte auch begrüßen“).
-- Ohne Push/Mail. Wiederholbar: hängt nichts doppelt auf. Rückweg: Zettel in der App abnehmen.
with neu as (
  insert into public.kc_club_pinnwand (person_id, text, wichtig, fuer, personen, farbe, antworten)
  select 'KC-P-002',
         left('💐 Herzlich willkommen! Wir begrüßen unser neues Mitglied ' || coalesce(nullif(p.display_name, ''), 'Manfred') || ' in der Köcheclub-App. Schön, dass du dabei bist! 💐', 200),
         true, 'alle', '{}', coalesce((select min(f) from unnest(array[1,2,3,4]) f where f not in (select coalesce(farbe, 0) from public.kc_club_pinnwand where person_id = 'KC-P-002' and entfernt_am is null)), 1), true
  from public.kc_core_people p
  where p.person_id = 'KC-P-M0011'
    and not exists (select 1 from public.kc_club_pinnwand z where z.entfernt_am is null and z.text like '💐 Herzlich willkommen! Wir begrüßen unser neues Mitglied%' and z.erstellt_am > '2026-10-09')
    and (select count(*) from public.kc_club_pinnwand where person_id = 'KC-P-002' and entfernt_am is null) < 4
  returning id
)
insert into public.kc_club_protokoll (person_id, aktion, details)
select 'KC-P-002', 'pinnwand_willkommen', jsonb_build_object('zettel', neu.id, 'fuer', 'KC-P-M0011', 'erneut', true) from neu;
