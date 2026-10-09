-- Wunsch Hansi 09.10.2026: „Er ist ja nicht neu“ – Willkommens-Zettel für Manfred sagt „unser Clubmitglied“ statt „unser neues Mitglied“.
-- Nur der Text dieses einen, heute aufgehängten Zettels. Wiederholbar. Rückweg: Text wieder auf „neues Mitglied“ setzen.
update public.kc_club_pinnwand z
set text = left(replace(z.text, 'Wir begrüßen unser neues Mitglied', 'Wir begrüßen unser Clubmitglied'), 200)
where z.entfernt_am is null and z.person_id = 'KC-P-002' and z.erstellt_am > '2026-10-09'
  and z.text like '💐 Herzlich willkommen! Wir begrüßen unser neues Mitglied%'
  and exists (select 1 from public.kc_club_protokoll p where p.aktion = 'pinnwand_willkommen' and p.details->>'zettel' = z.id::text and p.details->>'fuer' = 'KC-P-M0011');
