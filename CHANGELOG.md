# Änderungen

## 0.6.0 – 2026-09-28 (DEV)

- KC-CLUB-KALENDER: Termine wahlweise als Liste oder Kalender (Wahl wird gemerkt). Blättern Monat ‹ › und Jahr « »,
  Wischen links/rechts, Monatsname antippen = zurück zu heute. Farben: Club-Treffen weinrot, eigener Dienst blau,
  Abstimmungs-Frist gelb, Geburtstag lila, heute goldener Rahmen; Punkte je Eintrag.
- Tag antippen: Treffen als volle Karte mit Zu-/Absage und Tagesordnung, Dienst → Dienstplan, Frist → Vorschläge,
  Geburtstag → direkt gratulieren (Nachricht).
- Geburtstage aus kc_core_people.birth_date – an die App gehen nur Tag und Monat, kein Geburtsjahr.
  „Heute wichtig“ zeigt, wer heute Geburtstag hat.

## 0.5.0 – 2026-09-28 (DEV)

- Kachel „🔄 Update prüfen“ unter Programme mit installierter Versionsnummer; findet sie eine neuere Version,
  zeigt sie „neu“ und bietet das Aktualisieren direkt an.
- Die Versionsanzeige neben „Schnellzugriff“ ist ein Knopf zum Update-Prüfen (🆕 bei neuer Version).

## 0.4.0 – 2026-09-28 (DEV)

- Schnellzugriff: Register Verein / Mein Bereich / Programme per Wischen nach links/rechts wechselbar,
  kleine Zahl am Register zeigt die Anzahl der Kacheln.
- Kopf kompakter: „Hallo …“ unter den beiden Knöpfen, Status direkt unter „KÖCHECLUB WERNE“ (einzeilig).
- Einstellungen: größere Klapp-Pfeile; Schloss je Bereich stellt ihn offen bzw. zu fest (🔒) oder löst ihn (🔓).

## 0.3.0 – 2026-09-28 (DEV)

- KC-CLUB-BENACHRICHTIGUNG: in den Einstellungen je Bereich (Treffen & Erinnerungen, Nachrichten, Vorschläge,
  Dienst-Erinnerung) Push und/oder E-Mail ankreuzen. Nur Push = Push, sonst automatisch E-Mail; beides = beides;
  nichts = keine Benachrichtigung. Ohne Auswahl gilt die bisherige Standardregel. Test-Push geht immer als Push.
- KC-CLUB-DIENSTERINNERUNG: Erinnerung am Vorabend (ab 17 Uhr) an die eigenen Dienste aus dem veröffentlichten
  Sollplan – nur wer sie einschaltet, höchstens einmal je Tag.
- Kopf: „KÖCHECLUB WERNE“ einzeilig, Zahnrad entfernt (Einstellungen unten unter „Mehr“), Knöpfe höher;
  Kennzahlen antippbar (Neue Nachrichten → Kommunikation, Mitglieder → Mitglieder, Nächstes Treffen → Termine);
  Kochmütze → Internetseite des Köcheclubs (Platzhalter bis zur Veröffentlichung).
- KC-CLUB-ZURUECK: „Zurück“ im Browser/am Handy geht eine Ansicht zurück statt die App zu verlassen; auf der
  Startseite erst beim zweiten „Zurück“ raus.
- Einstellungen in aufklappbare Bereiche gegliedert (Zustand wird gemerkt).

## 0.2.0 – 2026-09-28 (DEV)

- KC-CLUB-DIENSTE: Dienstpläne – eigene Dienstzeiten aus dem veröffentlichten Sollplan des Dienstplans (`kc_dp_plan_published`),
  andere Mitglieder nur mit deren Freigabe (`kc_club_freigaben`, Standard aus). Mehrere Personen wählbar, Wochenansicht mit
  Zeitbalken, gemeinsame Dienstzeiten gold markiert, Datenstand sichtbar. „Nächster Dienst“ unter „Heute wichtig“.
- KC-CLUB-VORSCHLAG: Themen für die nächste Sitzung vorschlagen (alle) und mit 👍 unterstützen; Abstimmungen (Vorstand)
  offen oder geheim, eigene Antworten, optionale Frist mit automatischem Ende und Ergebnis an alle.
  Geheim: gespeichert wird nur, dass jemand abgestimmt hat; die Stimme liegt ohne Person und ohne Zeit.
- KC-CLUB-OHNEAPP: Wer die App noch nie geöffnet hat, bekommt Nachrichten, Einladungen und Abstimmungen per Mail statt Push
  (Anlass: Push an Klaus über eine alte Push-Anmeldung führte auf die gesperrte App).

## 0.1.0 – 2026-09-28 (DEV)

Erste Version der Köcheclub-App.

- KC-CLUB-ZUGANG: persönlicher Link, Token nur als Hash gespeichert
- KC-CLUB-TREFFEN: Club-Treffen anlegen/ändern/absagen (Vorstand), Zusage/Absage/Vielleicht für alle sichtbar, automatische Einladung, Erinnerung am Vortag
- KC-CLUB-NACHRICHTEN: Nachrichten an Einzelne, Ämter, Vorstand oder alle (alle nur Vorstand/Admin), Lesebestätigung, Verlauf
- KC-CLUB-ANLAGEN: PDF, Kamera, Galerie (Bilder verkleinert, max. 8 MB)
- KC-CLUB-PUSH: Push mit Warnton und App-Badge, Mail-Rückfall über web.de
- KC-CLUB-STATUS: eigener Status mit optionalem Enddatum
- KC-CLUB-ADMIN: Zugangslinks erzeugen, Vorstand/Ämter setzen
- Oberfläche nach Vorbild Reiseassistent: Info-Kopf, Register-Kacheln, „Heute wichtig“, Fußleiste, ⚙️ Einstellungen
- Protokolle, Dienstpläne, Vorschläge/TOP, Programme als „bald“ markiert
