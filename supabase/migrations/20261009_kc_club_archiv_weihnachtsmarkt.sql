-- KC-CLUB-ARCHIV-UNTERREGISTER (2.147.0, Wunsch Hansi 09.10.2026): Büro-Ordner „Weihnachtsmarkt“ mit Jahres-Registern und Unterregistern.
-- Register „2026 › Checklisten“ = Unterregister „Checklisten“ im Jahr 2026 (die App zeigt oben die Jahre, darunter die Unterregister).
-- Nur Clubleitung (wie die anderen Büro-Ordner). Weitere Jahre legt man in der App mit „＋ Jahr … anlegen“ an.
-- Nur ein neuer Datensatz, nichts Bestehendes wird geändert; mehrfach ausführbar (legt ihn nur an, wenn es ihn noch nicht gibt).
-- Rückweg: update public.kc_club_archiv_ordner set geloescht_am = now(), geloescht_von = 'KC-P-002' where titel = 'Weihnachtsmarkt' and besitzer is null and geloescht_am is null;
insert into public.kc_club_archiv_ordner (art, jahr, titel, farbe, register, nur_vorstand, erstellt_von, einreichen, einleitung)
select 'sonstiges', 2026, 'Weihnachtsmarkt', 3,
  array['2026 › Checklisten', '2026 › Verträge', '2026 › Genehmigungen', '2026 › Planung & Dienste', '2026 › Einkauf & Kasse', '2026 › Fotos & Presse', '2026 › Sonstiges'],
  true, 'KC-P-002', false,
  E'Weihnachtsmarkt Werne – alles an einem Platz\nOben das Jahr wählen, darunter das Unterregister (z. B. Checklisten). Ein neues Jahr: Knopf „＋ Jahr … anlegen“ – es bekommt dieselben Unterregister.'
where not exists (select 1 from public.kc_club_archiv_ordner where titel = 'Weihnachtsmarkt' and besitzer is null and geloescht_am is null);
