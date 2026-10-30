-- KC-CLUB-SCHILDER-ABLAGE (Wunsch Hansi 30.10.2026 „Eingangskorb z. B. Preisliste → als Ablageort einen Ordner aus dem Büro, z. B. Schilder“;
-- Wahl Hansi: „Ablage in der Druckerei“): Club-Ordner „Schilder“ (nur Clubleitung, wie die Schilder-Druckerei) mit Registern für Dateien –
-- er steht im Eingangskorb unter 🏢 Büro zur Wahl; seine Dateien zeigt die Schilder-Druckerei unter „📎 Abgelegte Dateien“.
-- Nur eine Zeile in einer bestehenden Tabelle (keine neue Tabelle, keine Rechte). Legt nichts doppelt an.
-- Rückweg: update public.kc_club_archiv_ordner set geloescht_am = now() where titel = 'Schilder' and besitzer is null;
insert into public.kc_club_archiv_ordner (art, jahr, titel, farbe, register, nur_vorstand, erstellt_von, einreichen, einleitung)
select 'sonstiges', 2026, 'Schilder', 6, array['Preislisten', 'Hinweise', 'Öffnungszeiten', 'Sonstiges'], true,
       coalesce((select erstellt_von from public.kc_club_archiv_ordner where titel = 'Weihnachtsmarkt' and besitzer is null order by erstellt_am limit 1), 'system'),
       false, 'Preislisten, Hinweise und Öffnungszeiten als Datei (z. B. PDF). Alles hier steht auch in der 🪧 Schilder-Druckerei unter „📎 Abgelegte Dateien“ – zum Ansehen, Drucken und fürs Druckpaket.'
 where not exists (select 1 from public.kc_club_archiv_ordner where titel = 'Schilder' and besitzer is null and geloescht_am is null);
