# Änderungen

## 0.17.3 – 2026-09-28 (DEV)

- KC-CLUB-EXTERN-DIAGNOSE: Beim Öffnen von WhatsApp/Route misst die App, was auf dem Handy passiert (Weg, App in den
  Hintergrund ja/nein und nach wie vielen ms, Fokusverlust, Fenster geöffnet, Anzeigemodus) und legt es als „diagnose_extern“
  im Änderungsprotokoll ab – nur technische Angaben, keine Nummern/Adressen. Dient der Fehlersuche auf einzelnen Handys.

## 0.17.2 – 2026-09-28 (DEV)

- KC-CLUB-KONTAKT: „WhatsApp“ und „🗺️ Route“ probieren zuerst den zuletzt erfolgreichen Weg. Öffnet sich nach 2 Sekunden
  nichts, bleibt ein Fenster „Hat sich nichts geöffnet?“ stehen mit allen Wegen (App direkt, Android-Weg, Browser,
  Karten-App auswählen) und „Nummer/Adresse kopieren“. Der Weg, bei dem sich die App wirklich öffnet, wird auf dem Handy gemerkt.
- WhatsApp-Nummern im Format „+49 (0)…“ werden richtig umgesetzt.

## 0.17.1 – 2026-09-28 (DEV)

- KC-CLUB-KONTAKT: „🗺️ Route“ öffnet auf Android jetzt direkt Google Maps mit der Routenplanung zur Adresse
  (ist Maps nicht installiert: dieselbe Route im Browser). Vorher („geo:“) ging teils nur ein leeres Auswahlfenster auf.

## 0.17.0 – 2026-09-28 (DEV)

- KC-CLUB-COMMUNICATOR-STATUS: dritte LED (Mitte) für den KC Communicator (Push & E-Mail): 🟢 läuft, 🟡 eingeschränkt
  (ein Versandweg gestört oder Fehler in den letzten 24 Std.), 🔴 Störung/ausgeschaltet/nicht erreichbar, 🔵 Versand pausiert,
  ⚪ unbekannt (kein aktueller Zustandsbericht oder keine Verbindung zum Server – nie „grün“ geraten).
  Quelle: Einstellungen, Versandwege und Gesundheitsbericht (alle 5 Min.) des Communicators sowie die eigenen Versandaufträge
  der Club-App – nur lesend. Erreichbarkeit wird ohne Versand geprüft.
- Im Fenster „📡 Verbindung“: Abschnitt „KC Communicator“ mit Push/E-Mail-Zustand, Zustellquote, Ø Zustellzeit, Warteschlange,
  Club-Benachrichtigungen der letzten 7 Tage und „🧪 Test-Benachrichtigung an mich“; Versandwege (Anbieter) nur für den Admin.
  „Verbindung testen“ prüft den Communicator mit.

## 0.16.0 – 2026-09-28 (DEV)

- KC-CLUB-VERBINDUNG: zwei kleine LEDs oben im Kopf. Obere LED = Status: 🟢 verbunden, 🔴 keine Verbindung (Handy offline
  oder Server nicht erreichbar), 🔵 Wartung (vom Admin angekündigt oder App-Update läuft), ⚪ unbekannt/veraltet (keine Antwort
  seit über 3 Minuten – wird nie als „OK“ gezeigt). Untere LED flackert nur bei echtem Datenverkehr mit dem Server
  (jede Anfrage der App sowie Fotos/Dateien aus dem Supabase-Speicher).
- Antippen öffnet „📡 Verbindung zum Server“: Rundinstrumente für Antwortzeit, Download und Upload, Anfragen/Fehler,
  letzte Antwort, Netztyp, Versionen; „▶️ Verbindung testen“ misst 5× die Antwortzeit (inkl. Datenbank) sowie 1 MB Download und 512 KB Upload.
- Wartungsmodus (nur Admin) über die zentrale Programm-Registry kc_core_app_registry (neuer Eintrag KC_CLUBAPP,
  neue Spalten wartung/wartung_hinweis/wartung_seit – für alle Programme nutzbar); Hinweis erscheint auch unter „Heute wichtig“.

## 0.15.0 – 2026-09-28 (DEV)

- KC-CLUB-FOTOALBUM: neue Kachel „📷 Fotoalbum“. Fotos (Galerie, mehrere auf einmal, oder Kamera) werden vor dem Hochladen
  verkleinert (ca. 250 KB + kleine Vorschau) und im Supabase-Dateispeicher abgelegt (vorhandener Anlagen-Kern).
  Thema (Auswahl + „Neues Thema“), Anlass (Treffen oder Aktion) und Beschreibung; Datum automatisch aus dem Foto (EXIF).
  Filter nach Thema, Jahr und Anlass; Anzeige nach Monaten; Großansicht mit Blättern/Wischen, Speichern, Teilen, Ändern, Löschen.
  Speicheranzeige „x MB von 1 GB“ mit „Platz für ca. N weitere Fotos“; ab 95 % nimmt das Album nichts mehr an.
  Löschen → Papierkorb (Admin kann 30 Tage zurückholen), danach entfernt die Wartung die Dateien endgültig.
  Bei jeder Aktion: „📷 Fotos zu dieser Aktion“.
- KC-CLUB-ANLAGEN: Hochladen für Nachrichten, Protokolle und Fotos läuft über eine gemeinsame Funktion (dateiAblegen).

## 0.14.1 – 2026-09-28 (DEV)

- KC-CLUB-KONTAKT: „WhatsApp“ und „🗺️ Route“ öffnen jetzt direkt die WhatsApp- bzw. Karten-App (Android: WhatsApp-Intent mit
  wa.me als Rückfall, Karten über geo:; iPhone: whatsapp:// und Apple Karten). Vorher öffnete die installierte App ein
  Zwischenfenster, das sofort wieder zuging.
- Meldungen bleiben je nach Textlänge 4–20 Sekunden stehen (Fehler doppelt so lange) und lassen sich durch Antippen schließen.

## 0.14.0 – 2026-09-28 (DEV)

- KC-CLUB-TERMINFINDUNG: „🗓️ Umfrage“ unter Termine (Clubsprecher, Kassenwart, Admin): 2–10 Terminvorschläge, jede/r kreuzt
  ✅ passt / ❓ vielleicht / ❌ passt nicht an; ⭐ markiert die beste Wahl, „Wer hat was angekreuzt?“ zeigt die Namen.
  📅 legt den Termin fest → normales Treffen mit Einladung; die Antworten werden als Zu-/Absagen übernommen.
  „Heute wichtig“ erinnert, solange man noch nichts angekreuzt hat.
- KC-CLUB-NACHFASSEN: 3 Tage vor einem Club-Treffen einmalig „❔ Kommst du?“ an alle, die noch nicht zu- oder abgesagt haben.
- KC-CLUB-MITFAHREN: bei jedem Treffen/jeder Veranstaltung und bei Aktionen „🚗 Ich fahre und nehme mit“ (Plätze, Treffpunkt);
  andere tippen „Mitfahren“ – der Fahrer bekommt Bescheid, bei voller Fahrt geht nichts mehr; fällt die Fahrt aus, werden die Mitfahrer informiert.
- KC-CLUB-NOTFALL: eigener Notfallkontakt unter Einstellungen → Privatsphäre; sichtbar nur für einen selbst und Clubsprecher,
  Kassenwart, Admin (in den Mitglieder-Details).
- KC-CLUB-KALENDERABO: Einstellungen → „📲 Termine im Handy-Kalender“: persönlicher Abo-Link (iPhone: ein Tipp; Android über
  Google Kalender) mit Treffen, Veranstaltungen, Aktionen und freigegebenen Geburtstagen – aktualisiert sich selbst.
  Zusätzlich bei jedem Termin „📲 In meinen Kalender“ (Einzeltermin, funktioniert auf jedem Handy).

## 0.13.0 – 2026-09-28 (DEV)

- KC-CLUB-KONTAKT: Mitglied in der Liste antippen → Details: Ämter, Status, Geburtstag (falls freigegeben) und
  📱 Handy, ☎️ Festnetz, ✉️ E-Mail, 🏠 Adresse – mit Knöpfen 📞 Anrufen, WhatsApp, ✉️ Mail, 🗺️ Route, 💬 Nachricht in der App
  und 📇 Ins Telefonbuch (Kontakt-Datei).
- Einstellungen → Privatsphäre: jedes Mitglied legt selbst fest, was andere sehen (Handy, Festnetz, E-Mail, Adresse;
  Standard: nichts). „👁️ So sehen mich die anderen“ zeigt die eigene Karte.
- Sichtbarkeit: eigene Daten immer; Admin sieht alles (mit 🔒-Hinweis bei nicht freigegebenen Angaben);
  Aushilfen sehen keine Kontaktdaten (Recht „Kontakte sehen“ in der Rollen-Registry, unter Mitglieder → 🎖️ änderbar).
- „Meine Daten“: Knopf „📝 Korrektur an Hansi melden“ (geht als App-Nachricht an den Admin).
- Quellen: Handy, E-Mail, Adresse aus der zentralen Personenliste; Festnetz aus dem KC Manager (nur gelesen).
  Jeder Abruf fremder Details wird im Änderungsprotokoll vermerkt.

## 0.12.0 – 2026-09-28 (DEV)

- KC-CLUB-AKTIONEN: Übersicht als Kacheln (Symbol, Name, Zeitraum, Countdown „in 225 T.“, „✅ dabei“) – mehrere
  neben- und untereinander. Antippen öffnet die Details (Reiseverlauf, Teilnehmer, Kosten, Reisebüro) in eigener Ansicht;
  „Zurück“ führt wieder zur Übersicht. Aus dem Kalender geht es direkt zur jeweiligen Aktion (Sprung `#aktion=<id>`).

## 0.11.1 – 2026-09-28 (DEV)

- „🧪 Test an mich“ ist jetzt direkt erreichbar: Kachel unter „Mein Bereich“ und Knopf „🧪 Test“ oben in Kommunikation
  (vorher nur über „＋ Neu“). Öffnet die Test-Unterhaltung mit vorbereitetem Text – nur noch auf ➤ tippen.

## 0.11.0 – 2026-09-28 (DEV)

- KC-CLUB-LOESCHEN: 🗑️ Löschen überall dort, wo etwas wieder weg muss (z. B. Tests) – immer mit Sicherheitsabfrage,
  ohne Benachrichtigung der Mitglieder, und vorher mit vollständiger Sicherung im Änderungsprotokoll (Wiederherstellungspunkt;
  schlägt die Sicherung fehl, wird nichts gelöscht).
  - Treffen/Veranstaltungen: Clubsprecher, Kassenwart, Admin (auch vergangene und abgesagte). „Absagen“ mit Nachricht bleibt.
  - Vorschläge/Abstimmungen: Organisation; wer ihn gemacht hat, solange noch niemand sonst abgestimmt hat.
    Geheime Stimmen werden ohne Person gesichert.
  - Protokolle: Entwurf – Schriftführer oder Organisation; veröffentlichtes Protokoll – nur Organisation
    (bisher war nur ein nie veröffentlichter Entwurf löschbar). Aufgaben und Einwände dazu werden mitgelöscht.
  - Aufgaben (auch in der Liste „Offene Aufgaben“) und Einwände (eigene bzw. durch den Schriftführer).
  - Nachrichten: eigene Nachricht für alle löschen (Admin: jede). Unterhaltung: „🙈 Nur bei mir entfernen“ (alle),
    „🗑️ Für alle löschen“ (nur Admin). Schreibt jemand in eine ausgeblendete Unterhaltung, erscheint sie wieder.
- Aktionen (Ausflüge/Reisen) kommen aus dem KC Manager und werden dort gelöscht.

## 0.10.0 – 2026-09-28 (DEV)

- KC-CLUB-AKTIONEN: neue Kachel „🧳 Aktionen“ (Ausflüge & Reisen). Die Daten kommen direkt aus dem KC Manager
  (Bereich „Aktivitäten / Ausflüge“) – keine zweite Datenhaltung, die App liest nur, Datenstand wird angezeigt.
  Erste Aktion: Kreuzfahrt „5 Nächte – Fjordmomente zum Durchatmen, ab/bis Bremerhaven“ (TUI Cruises, 11.–16.05.2027,
  Anreise Zug) mit Reiseverlauf (Bremerhaven · Seetag · Molde · Nordfjordeid · Seetag · Bremerhaven), Countdown und
  Teilnehmern (12 bestätigt, 1 offen). Preis pro Person und Reisebüro sehen nur Mitreisende und Admin, Bemerkungen nur der Admin.
- Aktionen erscheinen im Kalender (türkis, jeder Reisetag, „Tag 3 von 6“).
- Neue Nachricht: „Alle Mitglieder“ und die Ämter (Clubsprecher, Kassenwart, …) setzen jetzt direkt die Häkchen bei
  den zugehörigen Personen – man sieht sofort, wer dazugehört, und kann einzelne wieder abwählen. Zahl im Knopf = Anzahl Personen.
- „🧪 Test an mich“: Nachricht an sich selbst (eigene Unterhaltung „🧪 Test an mich“); Push/Mail kommen so,
  wie sie unter Einstellungen → Benachrichtigungen eingestellt sind – ideal zum Ausprobieren.

## 0.9.0 – 2026-09-28 (DEV)

- KC-CLUB-PROTOKOLLE: Sitzungsprotokolle. Wer diesmal schreibt, tippt beim vergangenen Treffen auf „＋ Anlegen“ – die
  **Vorlage füllt sich selbst**: Datum, Ort, anwesend (Zusagen) / entschuldigt (Absagen), Tagesordnung (Themen),
  Beschlüsse (Abstimmungsergebnisse). Das eigentliche Protokoll wird angehängt: **📷 Foto vom Blatt** (Kamera, mehrere
  Seiten nacheinander), **🖼️ Galerie** oder **📄 Datei (Word/PDF)** über den Dateimanager von Handy/Tablet. Alles speichert
  automatisch. Veröffentlichen → alle Mitglieder außer Aushilfen bekommen Bescheid → **7 Tage Einspruch** → genehmigt.
  Einwände gehen an Schriftführer, Clubsprecher und Kassenwart; „✏️ Korrigieren“ legt eine neue Fassung an, die alte bleibt
  erhalten. Lesebestätigung („Gelesen 5 von 16“) für Schriftführer/Organisation. Schriftführer ist im Protokoll wählbar.
- Leserecht über die Rollen-Registry (`kc_club_rollen.protokolle_lesen`, Standard ja; Aushilfen nein), vom Admin unter
  Mitglieder → 🎖️ änderbar. Die Kachel „Protokolle“ ist aktiv (Zahl = neue Protokolle + eigene Aufgaben), für Aushilfen ausgeblendet.
- KC-CLUB-AUFGABEN: „Wer macht was bis wann“ im Protokoll. Die Person bekommt die Aufgabe beim Veröffentlichen mitgeteilt,
  am Tag vor „bis“ eine Erinnerung; „Heute wichtig“ zeigt eigene Aufgaben (≤ 7 Tage/überfällig) mit „✔ erledigt“.
- Benachrichtigungen dazu laufen im Bereich „📅 Treffen, Protokolle & Aufgaben“.
- Technisch: Upload-Helfer `anlageHochladen` für Nachrichten und Protokolle gemeinsam; Sprung `#protokoll=<id>` aus Push/Mail.

## 0.8.1 – 2026-09-28 (DEV)

- KC-CLUB-FEIERTAGE: gesetzliche Feiertage NRW im Kalender (hellrot, Tag antippen zeigt den Namen). Werden in der App
  für jedes Jahr berechnet (Ostern nach Gauß) – kein Server, keine fremde Quelle. Schalter unter Einstellungen → Darstellung
  „🇩🇪 Feiertage NRW im Kalender“ (Standard an, je Gerät).

## 0.8.0 – 2026-09-28 (DEV)

- KC-CLUB-GEBURTSTAG-FREIGABE (0.7.0): Einstellungen → Privatsphäre „Meinen Geburtstag anzeigen (ohne Jahr)“ (Standard aus);
  Geburtstage nur noch mit Freigabe sichtbar; neu auch in der Terminliste (nächste 30 Tage).
- KC-CLUB-GEBURTSTAG-PUSH: 2 Tage vorher „X hat in 2 Tagen Geburtstag“, am Tag „X hat heute Geburtstag – möchtest du gratulieren?“
  → Antippen öffnet den Chat mit vorbereitetem Glückwunsch. Nur freigegebene Geburtstage, nur an Mitglieder mit App,
  einstellbar unter Benachrichtigungen („🎂 Geburtstage“), höchstens einmal je Anlass.
- KC-CLUB-VERANSTALTUNG: neue Terminart „Veranstaltung“ (z. B. Aufbau, Weihnachtsmarkt, Abbau) – ohne Zu-/Absage und ohne
  Vortags-Erinnerung, grün im Kalender, auch ganztägig und über mehrere Tage; Formular mit „von–bis“.
- Das Wort „Vorstand“ entfällt (im Club gibt es keinen Vorstand). Das Recht, Treffen/Veranstaltungen/Abstimmungen anzulegen,
  heißt jetzt so; Klaus (Clubsprecher), Dieter (Kassenwart) und Admin haben es.
- Daten: Weihnachtsmarkt 2026 eingetragen – Aufbau 02./03.12. 08–18 Uhr, Markt 04.–13.12., Abbau 14.12. 08–13 Uhr.

## 0.6.2 – 2026-09-28 (DEV)

- „Heute wichtig“: Hinweis „Bitte zu- oder absagen“ erscheint erst 7 Tage vor dem Treffen (vorher nicht), jetzt mit Datum.
- Daten: doppelt angelegtes Treffen 30.10. (1ea3e2b4…) auf Anweisung ohne Benachrichtigung entfernt (Protokoll-Eintrag vorhanden).

## 0.6.1 – 2026-09-28 (DEV)

- Doppel-Tipp-Sperre beim Speichern von Treffen und Vorschlägen (Anlass: Treffen 30.10. wurde doppelt angelegt).

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
