-- KC-CLUB-ARCHIV-KOPIEREN (2.59.0, Wunsch Hansi): Vereinsordner „Besprechungen 2026“ (nur Clubleitung)
-- für Entwürfe/Unterlagen, die (noch) kein Protokoll sind. Im Büro-Regal als „🤝 Besprechungen“.
-- Nur anlegen, wenn es ihn noch nicht gibt (wiederholbar). Rückweg: Ordner im Archiv in den Papierkorb legen.
insert into kc_club_archiv_ordner (art, jahr, titel, farbe, register, nur_vorstand, erstellt_von, einreichen)
select 'sonstiges', 2026, 'Besprechungen', 4, array['Entwürfe','Protokolle','Unterlagen','Sonstiges'], true, 'KC-P-002', false
where not exists (select 1 from kc_club_archiv_ordner where besitzer is null and titel = 'Besprechungen' and jahr = 2026 and geloescht_am is null);
