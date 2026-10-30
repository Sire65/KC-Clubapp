-- KC-CLUB-PASSIV (30.10.2026, Wunsch Hansi „Fridbert kommt nicht, macht nichts mit, ist aber weiterhin Mitglied – also passiv.
-- Er soll auch keine Einladungen zu Treffen bekommen usw.“): vierte Zugangsart „passiv“. Rechte in der App wie ein Mitglied, aber nichts
-- von „an alle“ (Einladungen, Erinnerungen, Rundnachrichten) und bei Treffen nicht als „noch offen“ gezählt. Bestehende Tabelle → keine neuen Rechte nötig.
alter table public.kc_club_rollen drop constraint if exists kc_club_rollen_zugang_check;
alter table public.kc_club_rollen add constraint kc_club_rollen_zugang_check check (zugang in ('mitglied', 'aushilfe', 'gast', 'passiv'));
-- Fridbert Köhling (KC-P-M0004) passiv
insert into public.kc_club_rollen (person_id, zugang, geaendert_am) values ('KC-P-M0004', 'passiv', now())
on conflict (person_id) do update set zugang = 'passiv', geaendert_am = now();
