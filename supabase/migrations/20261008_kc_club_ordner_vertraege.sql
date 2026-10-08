-- KC-CLUB-ARCHIV-ORDNER (Wunsch Hansi/Klaus 08.10.2026): Club-Ordner „Verträge 2026“ (nur Clubleitung) für Vereinsverträge –
-- Klaus legt den Vertrag (PDF aus seiner Nachricht) über „🗄️ Datei in mein Archiv“ hier ab.
-- Nur anlegen, wenn es ihn noch nicht gibt (wiederholbar). Rückweg: Ordner im Archiv in den Papierkorb legen.
insert into kc_club_archiv_ordner (art, jahr, titel, farbe, register, nur_vorstand, erstellt_von, einreichen)
select 'sonstiges', 2026, 'Verträge', 6, array['Vereinsverträge','Versicherungen','Miete & Räume','Lieferanten','Sonstiges'], true, 'KC-P-002', false
where not exists (select 1 from kc_club_archiv_ordner where besitzer is null and titel = 'Verträge' and jahr = 2026 and geloescht_am is null);
