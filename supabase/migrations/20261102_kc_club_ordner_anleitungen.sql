-- KC-CLUB-ANLEITUNGEN (Wunschliste #68, Wunsch Hansi 02.11.2026 „Ordner mit Anleitungen im Admin-Büro, mit Register … bei Bedarf den Mitgliedern zur
-- Verfügung stellen“; Entscheidung: alle drei aus der Clubleitung): Club-Ordner „Anleitungen“ (nur Clubleitung) für EIGENE Anleitungen (z. B. eingelesene
-- PDFs) – er steht im Eingangskorb unter 🏢 Büro zur Wahl. Die eingebauten Blätter liegen in der App (dokumente/anleitungen) und brauchen keine Tabelle.
-- Nur eine Zeile in einer bestehenden Tabelle (keine neue Tabelle, keine Rechte). Legt nichts doppelt an.
-- Rückweg: update public.kc_club_archiv_ordner set geloescht_am = now() where titel = 'Anleitungen' and besitzer is null;
insert into public.kc_club_archiv_ordner (art, jahr, titel, farbe, register, nur_vorstand, erstellt_von, einreichen, einleitung)
select 'sonstiges', 2026, 'Anleitungen', 3, array['Push & E-Mail', 'Installieren', 'Link & Anmelden', 'Sonstiges'], true,
       coalesce((select erstellt_von from public.kc_club_archiv_ordner where titel = 'Schilder' and besitzer is null order by erstellt_am limit 1), 'system'),
       false, 'Eigene Anleitungen als Datei (z. B. PDF). Alles hier steht im Büro unter 📚 Anleitungen – zum Ansehen, Drucken und Weitergeben an Mitglieder.'
 where not exists (select 1 from public.kc_club_archiv_ordner where titel = 'Anleitungen' and besitzer is null and geloescht_am is null);
