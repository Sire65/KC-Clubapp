# Änderungen

## 0.86.0 – 2026-09-30 (DEV)

- KC-CLUB-KALENDER-WAHL (Wunsch Hansi): Kalender-Abo (nur einseitig Club → Kalender, bewusst keine Rück-Synchronisation)
  mit Knöpfen „➕ In Google Kalender“ (calendar.google.com/calendar/r?cid=webcal:…) und „➕ In Outlook“
  (outlook.live.com/calendar/0/addfromweb?url=…); Hinweis für PC/Outlook-Programm bleibt. Einzelner Termin:
  „📲 In meinen Kalender“ öffnet eine Auswahl – Google (render?action=TEMPLATE), Outlook (deeplink/compose) oder
  Handy-Kalender (.ics wie bisher); ganztägige Termine korrekt als Datum. Öffnen über extOeffnen.
- Fehlerbehebung Terminliste (seit 0.1.0): kommend.map(treffenKarte) gab den Listenindex als „vorbei“ weiter – ab dem
  zweiten anstehenden Treffen fehlten Zu-/Absage, Mitfahren und „In meinen Kalender“. Jetzt map((t) => treffenKarte(t)).

## 0.85.0 – 2026-09-30 (DEV)

- KC-CLUB-LED-EMPFAENGER (Fehlalarm, Freigabe Hansi): Die Communicator-LED war seit 30.09. 10:20 gelb, weil ein Anklopf-Push
  an Klaus mit PUSH_NO_ACTIVE_SUBSCRIPTION scheiterte (er schaltete Push 2 Min. später ein) – ein Fehler auf Empfängerseite,
  keine Störung. Empfängerfehler (dieselbe Liste wie kc-communication router/dispatch „empfaengerFehler“) zählen nicht mehr:
  club.fehler24 nur Systemfehler; statt „failed“ aus dem Zustandsbericht (zählt Empfängerfehler mit) werden die fehlgeschlagenen
  Aufträge aller Programme der letzten 24 h ohne Empfängerfehler gezählt. Neu club.ohneWeg24 nur zur Anzeige im
  Verbindungsfenster („… Empfänger ohne Push/Adresse – keine Störung“). Echte Störungen (Weg gestört, Systemfehler,
  Erfolgsquote < 90 %, Bericht veraltet → grau) bleiben unverändert.

## 0.84.0 – 2026-09-30 (DEV)

- KC-CLUB-HEARTBEAT (Wunsch Hansi): Lebenszeichen wie die anderen KC-Programme. Die App meldet jede Minute (nur wenn
  sichtbar) über ihren eigenen Server (neue Aktion „lebenszeichen“, angemeldet mit dem Club-Link); der Server baut den
  Umschlag im KICC-Format (kicc.remote-program-heartbeat.v1 / kicc.program-heartbeat.v1, programId „kc-clubapp“, Gerät =
  Zufalls-ID, frische Nonce) und reicht ihn an den gemeinsamen Empfänger kicc-program-heartbeat weiter – Erlaubt-Liste,
  Nonce, Frische, Takt und Ablage in kicc_program_heartbeats bleiben dort (kein eigener Kern, kein Direktschreiben).
  So bleibt die App ohne Supabase-Schlüssel im Browser (Vertragstest 3). Sichtbar im KC System Check unter „Lebenszeichen
  der Programme“ (appMatches KC_CLUBAPP ↔ „clubapp“). Herz ♥ in der Kopfzeile blinkt bei jedem angekommenen Lebenszeichen
  kurz rot, blass bei Fehler; Tipp → die letzten 15 mit Zeit, Stand und Antwortzeit (nur im Gerät).
  Voraussetzung: „kc-clubapp“ in der Erlaubt-Liste von kicc-program-heartbeat (Quelle: KC-System-Check).

## 0.83.0 – 2026-09-30 (DEV)

- KC-CLUB-PROGRAMME (Wunsch Hansi): Kachel „💻 Freigegebene Programme“ ist nicht mehr „bald“, sondern öffnet die Ansicht
  v-programme. Registry PROGRAMME (id, sym, t, u, url) – erster Eintrag „🧾 Kassen-Schulung“ →
  https://sire65.github.io/Kasse/schulung/ (öffentliche Schulungsseite, kein persönlicher Link). Öffnen über extOeffnen()
  (gemeinsam mit dokOeffnen, ohne opener). In „Club-App auf einen Blick“ erscheint die Gruppe „💻 Programme“.
- KC-CLUB-DOKUMENTE: „Schnellanleitung Bilderrechner“ hinterlegt – dokumente/Kurzanleitung_Bilderrechner_V3.pdf
  (Bilderrechner – Kurzanleitung Version 3, 23 Seiten, Stand 28.09.2026, von Hansi; geprüft: keine persönlichen Daten,
  keine eingebetteten Skripte).

## 0.82.0 – 2026-09-30 (DEV)

- KC-CLUB-KONFERENZ (Wunsch Hansi, Stufe 2): Konferenz bis 4 Personen, zuerst nur Ton, kostenlos direkt von Handy zu Handy
  (jeder mit jedem). Zwei Wege: im Gespräch „➕“ → Mitglied wählen (anruf_start mit konferenz_mit; der Eingeladene sieht
  „👥 … holt dich in eine Konferenz“) oder beim zweiten Anruf „➕ Dazuholen (Konferenz)“ (konferenz_dazu).
  Datenmodell: jede Verbindung bleibt eine Zeile in kc_club_anruf; neue Spalten konferenz_id und automatisch (Migration
  20260930_kc_club_anruf_konferenz, nur additiv). Querverbindungen zwischen Teilnehmern baut die App selbst auf
  (konferenz_status alle 2 s, konferenz_bein; die kleinere Mitgliedsnummer ruft, die andere App nimmt ohne Klingeln an).
  Automatische Verbindungen klingeln nie, erscheinen nicht als verpasst und werden beim nächsten eigenen Anruf nicht beendet.
  Legt jemand auf, bleiben die anderen verbunden. Verbindungsdaten (SDP) nur an die jeweils andere Seite.
  Geprüft mit drei echten App-Fenstern (simulierter Server, simuliertes Mikrofon): Zusammenführen, Einladen, Auflegen eines Teilnehmers.

## 0.81.0 – 2026-09-30 (DEV)

- KC-CLUB-ANRUF-KURZANTWORT (Wunsch Hansi, Stufe 1): Beim Klingeln „💬 Mit Text ablehnen“ – Kacheln mit Schnellantworten
  plus eigener Text. Server anruf_antwort: Anruf abgelehnt, Text in kc_club_anruf.kurzantwort (neue Spalte, Migration
  20260930_kc_club_anruf_kurzantwort), zusätzlich als Nachricht „📞 Zu deinem Anruf: …“ in die Zweier-Unterhaltung
  (Benachrichtigung nach den Einstellungen des Anrufers). Der Anrufer sieht die Antwort 6 s im Anrufbildschirm (anruf_status
  liefert kurzantwort nur an ihn). Texte als Registry kc_club_konfig „anruf_antworten“, im Admin-Bereich „📞 Anrufe:
  Schnellantworten“ einstellbar (anruf_antworten_setzen, höchstens 8 × 60 Zeichen), Grundeinstellung 5 Texte.
- KC-CLUB-ANRUF-ZWEIT: Ruft während eines Gesprächs jemand anderes an, erscheint oben ein Hinweis mit Anklopf-Ton:
  „Auflegen & annehmen“, „Ablehnen“, „💬 Antwort“. Endet das Gespräch, während der zweite noch klingelt, wird er normal
  zum Annehmen angezeigt. (Gleichzeitiges Anrufen derselben zwei Personen bleibt bei KC-CLUB-GEGENANRUF.)
- KC-CLUB-ANRUF-VERPASST: online liefert verpasste Anrufe der letzten 24 h (nicht angenommen, nicht selbst abgelehnt,
  nicht gesehen, kein späteres Gespräch mit derselben Person); Fenster „📞 Verpasster Anruf“ mit „Zurückrufen“,
  anruf_verpasst_gesehen setzt verpasst_gesehen_am (neue Spalte).
- Neon-Spiegel: die zwei neuen Spalten werden erst gespiegelt, wenn sie in Neon angelegt sind (jsonb_populate_recordset
  übernimmt nur vorhandene Spalten – kein Fehler).
- Stufe 2 (Konferenz zu dritt, zuerst nur Ton) folgt als eigene Version.

## 0.80.0 – 2026-09-30 (DEV)

- KC-CLUB-GEGENANRUF (Fehler, gemeldet von Hansi: „Annehmen fehlt auf der Gegenseite“): Riefen sich zwei Mitglieder
  gleichzeitig an (30.09. 12:32, Hansi ↔ Klaus, 3 s Abstand), wartete jede App auf ihren eigenen Anruf und ignorierte den
  eingehenden (anrufEingehend bricht ab, solange RUF läuft) – keiner sah „Annehmen“, beide Anrufe „verpasst“.
  Server anruf_start: klingelt schon ein Anruf der Gegenseite an mich, wird kein zweiter angelegt, sondern
  { gegenanruf: id } zurückgegeben; die App nimmt ihn direkt an (gegenanrufAnnehmen, Ton/Video wie gewählt).
  Fallback bei exakt gleichzeitigem Anlegen: im Online-Takt gibt die höhere Mitgliedsnummer ihren Anruf auf und nimmt den
  anderen an. Gilt für Ton und Video.
- KC-CLUB-ANRUF-TAKT: Ohne Push erfuhr die offene App von einem Anruf nur über den 60-s-Online-Takt, ein Anruf klingelt aber
  nur 45 s – er konnte ganz durchrutschen. Ohne aktiven Push jetzt alle 15 s (PUSH_AKTIV, pushAktivPruefen); mit Push bleibt
  es bei 60 s, weil der Push die offene App sofort weckt.

## 0.79.0 – 2026-09-30 (DEV)

- KC-CLUB-UEBERBLICK (Wunsch Hansi): neue Ansicht „🗺️ Club-App auf einen Blick“ (📚 Meine Dokumente, auch in der einfachen
  Ansicht). Aktualisiert sich selbst: Bereiche aus der Kachel-Registry KACHELN (fertige, für mich freigegebene; „bald“-Kacheln
  als „Kommt bald“), Neuigkeiten aus version.json (neueste 8 Versionen, ältere aufklappbar, nur bis zur installierten Version,
  Admin-Neuerungen nur für Admins). Fester Text nur Einleitung/Beta/Warum (UE_TEXT). Drucken mit Vorschau über DRUCKARTEN
  „ueberblick“ aus derselben Quelle. DOKUMENTE-Einträge können jetzt statt einer PDF eine App-Ansicht (v) öffnen.
  Die öffentliche Übersichtsseite (Artifact) ist auf Stand 0.78 gebracht.

## 0.78.0 – 2026-09-30 (DEV)

- KC-CLUB-LINK-MAIL (Wunsch Hansi, iPad): unter ⚙️ Mehr → App-Installation → „💻 Auch am PC oder Tablet nutzen“ neuer
  Knopf „📧 Per E-Mail an mich“ – schickt den eigenen, bestehenden Link an die eigene hinterlegte Adresse (Server-Aktion
  zugang_link_mailen aus 0.77.0: kein neuer Schlüssel, 15-Min.-Sperre, Link wird nach dem Versand geschwärzt). Nur sichtbar,
  wenn eine Adresse hinterlegt ist. Tablet/PC-Tipp und Knopf nutzen dieselbe Funktion zugangMailen(). Hinweis ergänzt:
  iPad → Safari → Teilen → „Zum Home-Bildschirm“.

## 0.77.0 – 2026-09-30 (DEV)

- KC-CLUB-LINKSCHUTZ (Sicherheit, Freigabe Hansi): persönliche App-Links lagen im Klartext im Mail-Speicher des
  Communicators (kc_communication_requests.variables, 4 Einträge aus „Link verloren?“, 3 gültig) und im Neon-Spiegel.
  Migration 20260930_kc_club_zugangslinks_schwaerzen: kc_club_zugangslinks_schwaerzen() ersetzt den Schlüssel in fertig
  versendeten Mails durch „?k=[entfernt]“ (Club-Server ruft sie direkt nach jedem Link-Versand auf, Zeitplan alle 15 Min.);
  Schwärzungs-Verzeichnis des Spiegels kann jetzt Muster (nur der passende Teil wird ersetzt) – Regel für
  kc_communication_requests.variables. Die 4 Einträge sind geschwärzt; Neon übernimmt das beim nächsten Spiegellauf.
  Links nicht erneuert (Wunsch Hansi). Wiederherstellungspunkt: kc_db_mirror_snapshot_vor_linkschutz.
- KC-CLUB-GERAETE-TIPP (neu): Einstiegs-Tipp nach geraeteTage (Std. 21) Tagen „💻 Die Club-App gibt es auch für Tablet und PC“
  – „Ja, Link per E-Mail schicken“ → neue Aktion zugang_link_mailen: eigener (bestehender) Link an die eigene hinterlegte
  Adresse, höchstens 1× je 15 Min., Schlüssel danach im Mail-Speicher geschwärzt. Nur mit hinterlegter Adresse (angezeigt
  als „h…@web.de“). Frist in den Admin-Einstellungen (1–120 Tage).

## 0.76.0 – 2026-09-30 (DEV)

- KC-CLUB-AUSSETZER (Fehlerbehebung, Meldung Hansi „Fehler 503“ um 08:27): Supabase hatte für eine einzelne Anfrage keinen
  freien Server (Protokoll: 503 ohne Funktions-Kennung, 1 von 114 Anfragen, keine Überlast). Die App wiederholt eine solche
  503-Antwort ohne Programmantwort einmal still nach 0,8 s – sie hat unseren Code nie erreicht, also nichts doppelt. 502/504
  werden nicht wiederholt (könnten schon ausgeführt sein). Bleibt es beim Fehler, verständliche Meldung statt „Fehler 503“.

## 0.75.0 – 2026-09-30 (DEV)

- KC-CLUB-DESIGN-DISKO/REGENBOGEN (neu, Wunsch Hansi): zwei Farbdesigns in der Registry DESIGNS (Tag + Nacht).
  „Disko“: Kopf-Verlauf Nachtlila → Violett → Pink → Türkis, Knöpfe Magenta, Kachel-Ecke Türkis/Pink, mit
  KC-CLUB-DESIGN-SCHWARZLICHT (Neon-Schein um Kopfbereich, Kacheln, Schildchen und aktive Knöpfe; nachts UV-Hintergrund und
  leuchtende Kachel-Titel; ohne Bewegung). „Regenbogen“: Kopf-Verlauf Rot → Orange → Gelb → Grün → Blau → Violett,
  Knöpfe Violett, weiße Kopfschrift mit Schatten (Gelb/Orange sonst schwer lesbar). Neue optionale Design-Felder
  verlauf (Tag/Nacht), heroSchrift, schwarzlicht; bestehende Designs unverändert. Kontraste geprüft (Knöpfe ≥ 5,6:1,
  Text ≥ 16:1).

## 0.74.0 – 2026-09-30 (DEV)

- KC-CLUB-WETTERORT (neu, Wunsch Hansi): eigener Wetterort je Mitglied – ⚙️ → Darstellung „🌦️ Wetter für“: Club-Vorgabe
  (vom Admin) oder Schnellauswahl aus der Umgebung (Registry WETTER_ORTE_NAH: Werne, Unna, Bergkamen, Kamen, Lünen, Hamm,
  Selm, Nordkirchen, Ascheberg, Bönen, Lüdinghausen, Dortmund) oder „🔍 Anderen Ort suchen“. Server-Einstellung „wetterort“
  (geprüft mit wetterOrtPruefen), die Aktion wetter nimmt den eigenen Ort vor der Club-Vorgabe (eigenerOrt im Ergebnis,
  Zwischenspeicher je Ort). wetter_ort_suchen jetzt für alle Mitglieder (Datenquelle wählt nur der Admin).
  Nur in der erweiterten Ansicht, weil die einfache Ansicht kein Wetter zeigt.

## 0.73.0 – 2026-09-30 (DEV)

- KC-CLUB-DOKUMENTE (neu, Wunsch Hansi): Kachel „📚 Meine Dokumente“ (Mein Bereich und einfache Ansicht) mit Unterkacheln aus
  der Registry DOKUMENTE: „📲 Anleitung Club-App“ (dokumente/Koecheclub-App_Kurzanleitung.pdf) und „🧮 Schnellanleitung
  Bilderrechner“ (kommt bald – PDF fehlt noch). Antippen öffnet das PDF im PDF-Betrachter des Geräts (ansehen, drucken,
  teilen). Weitere Anleitungen: PDF nach dokumente/ + Eintrag. Nur Anleitungen – die Dateien sind über die Adresse öffentlich.
  Kurzanleitung nennt jetzt „📚 Meine Dokumente“ (sechs Knöpfe in der einfachen Ansicht).
- KC-CLUB-EINSTIEG-FEEDBACK (neu): vierter Tipp nach feedbackTage (Std. 28) Tagen Nutzung „💭 Möchtest du jetzt dein Feedback
  abgeben? Deine Meinung hilft, die App weiterzuentwickeln“ → Feedback-Seite; nur wenn noch kein Feedback abgegeben wurde
  (init: einstieg.feedbackAbgegeben aus kc_club_feedback). Frist in den Admin-Einstellungen (1–180 Tage).

## 0.72.0 – 2026-09-30 (DEV)

- KC-CLUB-ONLINEFILTER (neu, Wunsch Hansi): in der Mitgliederliste oben rechts (unter dem Status-Knopf) der Umschalter
  „👥 Alle | 🟢 Nur online (n)“; Wahl je Gerät gemerkt. Niemand online → Hinweis mit „Alle anzeigen“. Wer die eigene
  Online-Anzeige verborgen hat, sieht auch andere nicht online – dann ist „Nur online“ gesperrt (keine falsche leere Liste).
  Liste neu gezeichnet ohne erneutes Laden (mitgliederZeichnen).

## 0.71.0 – 2026-09-30 (DEV)

- KC-CLUB-EINSTIEG-FRISTEN (neu, Wunsch Hansi): in ⚙️ → Admin-Einstellungen → „💡 Einstieg: Tipps nach und nach“ (Klappbereich
  mit Schloss): Tipps an/aus, Farb-Tipp ab dem … Nutzungstag (1–20, Std. 3), Voreinstellungs-Tipp … Tage danach (1–30, Std. 3),
  Tipp erweiterte Ansicht nach … Tagen (1–90, Std. 14), „Später“ fragt wieder nach … Tagen (1–30, Std. 3).
  kc_club_konfig „einstieg“, Aktion einstieg_fristen_setzen nur Admin mit Protokoll vorher/nachher; init liefert die Werte.
  Gezählt werden **Nutzungstage** (verschiedene Tage mit App-Start, Europe/Berlin) statt Starts – ein neues Mitglied hatte am
  ersten Morgen durch mehrfaches Öffnen schon 7 „Starts“ und hätte sofort den ersten Tipp bekommen.
  0.70.0 wurde nicht einzeln veröffentlicht und geht mit 0.71.0 raus.

## 0.70.0 – 2026-09-30 (DEV)

- KC-CLUB-EINSTIEG (neu, Wunsch Hansi): Einsteiger nicht mit Fragen überfordern – vernünftige Voreinstellungen, danach Tipps
  nach und nach (höchstens einer je Start und je Tag, nie über anderen Fenstern; Registry EINSTIEG_SCHRITTE):
  1. ab dem 3. Nutzungstag (siehe 0.71.0) „🎨 Möchtest du deine Lieblingsfarbe einstellen?“ → Farbwahl (neu auch in „Das Wichtigste“),
  2. ein paar (3) Tage danach „🔒 Möchtest du deine Voreinstellungen ansehen?“ (Handynummer, Geburtstag …) → Privatsphäre
     (jetzt auch in der einfachen Ansicht),
  3. nach 14 Tagen in der einfachen Ansicht „🔧 Möchtest du einmal die erweiterte Ansicht einschalten?“ → schaltet um und
     erklärt den Rückweg („(Erweiterte Ansicht)“ oben antippen oder „🟢 Einfache Ansicht“ unten).
  „Ja“ führt hin und hebt die Stelle hervor, „Später“ fragt nach 3 Tagen wieder, „Nein, danke“ nie wieder. Schon selbst
  Erledigtes (Farbe gewählt, erweitert an) wird nicht gefragt. Starts = diagnose_start (einmal je Sitzung), Antworten in
  der Server-Einstellung „einstieg“.

## 0.69.0 – 2026-09-30 (DEV)

- KC-CLUB-ANSICHT-NAME (Erweiterung, Wunsch Hansi): der Ansichtsname hinter „Schnellzugriff“ ist ein Knopf – Antippen
  schaltet auf die jeweils andere Ansicht (ansichtWechseln, gespeichert wie der Umschalter unten).

## 0.68.0 – 2026-09-30 (DEV)

- KC-CLUB-MODUS-REIHUM (Wunsch Hansi): Tipp auf Sonne/Mond schaltet reihum A (Automatik) → T (immer Tag) → N (immer Nacht);
  vorher nur Tag/Nacht fest, Automatik nur in ⚙️ → Darstellung (dort weiter wählbar). Hinweis nennt die neue Einstellung.

## 0.67.0 – 2026-09-30 (DEV)

- KC-CLUB-MODUS-ANZEIGE (neu, Wunsch Hansi): kleines Schild am Sonne/Mond-Knopf oben – A = Automatik, T = immer Tag,
  N = immer Nacht (Voreinstellung aus DS.modus); Titel/Bildschirmleser nennen die Einstellung. Bedienung unverändert.

## 0.66.0 – 2026-09-30 (DEV)

- KC-CLUB-ANSICHT-NAME (neu, Wunsch Hansi): hinter „Schnellzugriff“ klein und farbig die aktive Ansicht –
  „(Einfache Ansicht)“ grün bzw. „(Erweiterte Ansicht)“ clubrot; umgeschaltet nur per CSS über body.einfach.

## 0.65.0 – 2026-09-30 (DEV)

- KC-CLUB-ADMIN-EINSTELLUNGEN (neu, Wunsch Hansi): alle Admin-Einstellungen in einem Klappbereich „🛠️ Admin-Einstellungen“
  (mit Schloss), darin je Thema ein Klappbereich mit eigenem Schloss: 📌 Pinnwand, Erstattung (km-Satz), Wetter. Nur für den
  Admin, auch in der einfachen Ansicht sichtbar. Pfeil/Schloss-Regeln gelten je Bereich (verschachtelt korrekt).
- KC-CLUB-PINNWAND-FRISTEN (neu): „Erinnern nach“ (1–30 Tage) und „‚Hängen lassen‘ fragt wieder nach“ (1–60 Tage) stellt der
  Admin ein (kc_club_konfig „pinnwand“, Aktion pinnwand_fristen_setzen nur Admin, Protokoll vorher/nachher). Alle Apps
  bekommen die Fristen mit init (pinnwandFristen); ohne Wert 3 / 7 Tage wie bisher.

## 0.64.0 – 2026-09-30 (DEV)

- KC-CLUB-PINNWAND-ERINNERUNG (neu, Wunsch Hansi): beim Öffnen der App Fenster „📌 Dein Post-it vom 29.09. hängt noch an der
  Pinnwand. Möchtest du es abnehmen?“ für eigene Zettel, die seit PW_ERINNERN_TAGE (3) hängen – je Zettel „🗑️ Abnehmen“,
  „📌 Hängen lassen“ fragt für diese Zettel frühestens nach PW_ERINNERN_PAUSE_TAGE (7) wieder (Server-Einstellung
  „pinnwand_erinnert“, geräteübergreifend, abgenommene werden vergessen). Nie über Startfrage, Begrüßung oder neuem
  Post-it-Fenster.

## 0.63.0 – 2026-09-30 (DEV)

- KC-CLUB-PINNWAND-NAME (neu, Wunsch Hansi): oben auf jedem Zettel „von Hansi / angepinnt am 29.09. 20:32“ (Wand und
  Post-it-Fenster; eigene Zettel mit dem eigenen Vornamen), unten nur noch „für …“. „✍️ Antworten“ an fremden Zetteln als
  erster, deutlich farbiger Knopf. Grenze unverändert: 4 eigene Zettel je Person, die Wand zeigt alle, die einen betreffen.

## 0.62.0 – 2026-09-30 (DEV)

- KC-CLUB-ANSICHT (neu, Wunsch Hansi nach Mitglieder-Rückmeldung „extremer Tobak“): beim ersten Start genau eine Frage
  „Wie möchtest du starten? 🟢 Einfach (empfohlen) / 🔧 Erweitert – jederzeit umschaltbar“ (auch für Mitglieder, die schon
  drin waren; Antippen daneben = Einfach). Wahl je Mitglied geräteübergreifend (Server-Einstellung „ansicht“).
  Einfach: 5 große Kacheln (Termine, Nachrichten, Pinnwand, Mein Dienst, Mitglieder), oben nur „Nächstes Treffen“ ohne
  Blättern, keine Register/Anordnen/Online-Leiste; Einstellungen nur „Das Wichtigste“: „Wie möchtest du Neuigkeiten
  bekommen? 📱 Handy / ✉️ E-Mail / beides“ (setzt alle Bereiche gleich), große Schrift, Ansicht, Kurzanleitung, Feedback,
  App-Installation. iPhone in Chrome bzw. nicht auf dem Home-Bildschirm: „Aufs Handy“ gesperrt mit klarem Safari-Hinweis.
  Umschalter unten auf der Startseite und in den Einstellungen. Nichts entfernt – „Erweitert“ zeigt alles wie bisher
  (inkl. der drei Start-Tipps). Dienstwünsche kommen in „Einfach“ erst, wenn DP2 die Wünsche abholt (DIENSTWUNSCH_EINFACH).
  Admin sieht in der Mitgliederliste, wer welche Ansicht nutzt.
- KC-CLUB-KURZANLEITUNG (neu): „Köcheclub-App in 3 Schritten“ (Link öffnen · auf den Startbildschirm – iPhone/Android ·
  loslegen) als Druckseite mit Vorschau (⚙️ Mehr → Kurzanleitung), auch als PDF zum Verteilen.

## 0.61.0 – 2026-09-29 (DEV)

- KC-CLUB-DRUCKVORSCHAU (neu, Wunsch Hansi): alle Ausdrucke (Termine/Kalender/To-dos, Treffen, Protokoll, Erstattung)
  zeigen erst eine Vorschau – das A4-Blatt genau wie gedruckt (Hoch-/Querformat, auf Bildschirmbreite verkleinert).
  Gedruckt wird erst mit „🖨️ Drucken / als PDF“ in der Vorschau; „✏️ Auswahl ändern“ (wo es eine Auswahl gibt), iPhone-App
  „📤 Teilen“, „✕ Schließen“. Auswahlfenster: „👁️ Vorschau ansehen“ statt direkt drucken. Eine Druckseite (#druck) für
  Vorschau, Druck und Teilen (druckHtml) – keine zweite Darstellung.

## KC-Spiegel: Fehlalarm „System Check ROT“ behoben – 2026-09-29 (Datenbank, ohne App-Build, Freigabe Hansi)

- KC-SPIEGEL-AUFNAHMEFRIST: Watchdog und Quellprüfung gaben neuen Tabellen fest 30 Minuten; der Spiegel läuft aber nur noch im
  sparsamen 6-h-Takt (5-Minuten-Nachlauf seit 20.09. aus) → jede neue Tabelle (heute kc_dp_wish_inbox, kc_dp_days_published)
  galt bis zum nächsten Lauf als Problem, System Check ROT. Aufnahmefrist jetzt = Frischefenster (390 min), Texte angepasst.
- kc_system_check_snapshot: „betroffen“ = Problemtabellen des letzten Watchdog-Laufs statt „5 älteste Läufe > 65 min“
  (nannte gesunde Tabellen und übersah nie gespiegelte).
- Wiederherstellungspunkt: alte Fassungen als *_vor_aufnahmefrist (nur intern ausführbar). Kein Spiegel-/Neon-Lauf ausgelöst.

## 0.60.0 – 2026-09-29 (DEV)

- KC-CLUB-PINNWAND-ANTWORT (neu, Wunsch Hansi): im Post-it-Fenster und an jedem fremden Zettel „✍️ Antworten“ – meldet
  „gesehen“ und öffnet sofort das Schreibfeld, Empfänger = Absender (privat) vorausgewählt, „👥 Für alle“ wählbar.
  Sind alle eigenen Plätze belegt, zeigt das Formular die eigenen Zettel zum Abnehmen (kein Umweg über die Wand).
  pinnwand_neu liefert dafür vonId; antwort_auf nur fürs Protokoll.
- KC-CLUB-PINNWAND-FARBEN (neu): 4 statt 3 Zettel je Person (PINNWAND_MAX, am Server geprüft). Feste Farbe je Zettel
  (Spalte kc_club_pinnwand.farbe 1–4: gelb, rosé, hellgrün, hellblau), neuer Zettel = kleinste freie Farbe, kein Nachrücken;
  eindeutiger Teilindex (person_id, farbe) gegen Doppelvergabe. „Wichtig“ behält roten Rand und Nadel. Migration v60,
  Neon-Spiegelspalte ergänzt (nur hinzugefügt).
- KC-CLUB-KREISE (neu): Namenskreise ganz farbig nach Zustand (Registry KREIS_ARTEN, eine Stelle für Mitgliederliste,
  Online-Liste, Mitgliedskarte, Einzel-Unterhaltungen): grün online · blau heute in der App · orange abwesend (Status) ·
  grau länger nicht/nie · gestrichelt unbekannt (online-Anzeige verborgen – nie als OK) · rot Zustellfehler **nur für den
  Admin** (fehlgeschlagene Push/Mail der letzten 7 Tage oder weder Push noch Mail). Legende in der Mitgliederliste.
  „heute“/„verborgen“ folgen der Online-Privatsphäre (wer sich verbirgt, sieht auch andere nicht).

## 0.59.0 – 2026-09-29 (DEV)

- KC-CLUB-DIENSTWUNSCH (neu, Wunsch Hansi): Dienstwünsche in der Club-App mit **Twinkey aus KC DP2 – 1:1**. Neue Kachel
  „📝 Dienstwünsche“ (Mein Bereich, Sprung #dienstwunsch) öffnet dienstwunsch.html im Vollbild („← Zurück zur Club-App“).
  Die Seite lädt genau die Dateien von DP2s eigener Twinkey-Seite (twinkey-test.html) **unverändert** aus dp2/ – gleicher
  Aufbau, Ablauf, Logik, Bedienung, Bilder und Sprachdateien. Herkunft/Hashes: dp2/QUELLE.json (Sire65/dp3, DP2 0.20.0);
  Übernahme per tools/dp2-twinkey-uebernehmen.mjs, der Vertragstest prüft jede Datei gegen den Hash.
- Nur zwei Club-Dateien stehen dort, wo DP2 seine Beispieldaten/seinen Start lädt: dp2-club/daten.js (Tage/Kernzeit/Bedarf
  aus kc_dp_days_published, bis DP2 veröffentlicht: DP2s Grundeinstellung; eigener Stand aus dem Wunsch-Eingang;
  freigegebene Kollegen; eigener Sollplan) und dp2-club/start.js (identisch zu DP2s Start). dp2-club/lader.js lädt in DP2s
  Reihenfolge. Speichern (K.persistAll) legt den Stand über die neue Server-Aktion dienstwunsch_speichern in
  kc_dp_wish_inbox (Revision +1, Status offen); DP2 holt ab (Auftrag docs/DP2_CODEX_AUFTRAG_WUNSCHEINGANG.md).
- Server: dienstwunsch_laden / dienstwunsch_speichern (nur bei offener Wunschphase, Prüfung Tag/Art/Zeit/Zone, Sperrtag nur
  ganztägig, Bereitschaft; Twinkey-Tagesstatus „Fertig“ und „Nur wenn nötig“ werden unverändert mitgeführt). Die
  Schlüsselreihenfolge von DP2s Tagesstatus wird beim Laden aus DP2s eigener Signatur wiederhergestellt (jsonb sortiert um).
- Bekannte Grenze: Wünsche, die Kollegen direkt in DP2 eintragen, sieht der Club erst, wenn DP2 sie teilt.

## KC DP2 ↔ Club-App: Wunsch-Eingang vorbereitet – 2026-09-29 (Datenbank, ohne App-Build)

- KC-DP-WUNSCHEINGANG (neu, Freigabe Hansi): Supabase-Seite für Dienstwünsche aus der Club-App (Twinkey-Nachbau).
  kc_dp_days_published + RPC kc_dp_days_publish (DP2 veröffentlicht Tage/Kernzeit/Bedarf als Snapshot),
  kc_dp_wish_inbox + RPCs kc_dp_wish_inbox_pending/_ack (DP2 holt je Person den aktuellen Stand ab, Bestätigung nur für die
  aktuelle Revision). Datenvertrag: KC_CLUBAPP liest Dienstplanung, liefert nur über den Eingang; KC_DP holt ab.
  Spiegel-Regeln + Neon-Zieltabellen. Getestet mit simulierter DP2-Planungssitzung (zurückgerollt).
- Auftrag für die DP2-Umsetzung (Codex): docs/DP2_CODEX_AUFTRAG_WUNSCHEINGANG.md.

## 0.58.0 – 2026-09-29 (DEV)

- KC-CLUB-PINNWAND-DIREKT (neu, Wunsch Hansi): statt nur „Du hast ein neues Post-it …“ geht der Zettel selbst als Post-it-Fenster
  auf (Überschrift mit dem Hinweis, Text, Absender, „nur für dich“, Zeit; wichtig rot; bis 5 Zettel). „✓ Gelesen“ erfasst
  „gesehen“ über die neue Aktion pinnwand_gesehen (nur sichtbare fremde Zettel), „📌 Zur Pinnwand“ öffnet die Wand.
  Auch beim App-Start: Zettel, die bei geschlossener App kamen, gehen zuerst als Fenster auf (vorher wurde nur die Wand geöffnet).
  pinnwand_neu liefert dafür Text und Zeit; das Banner aus 0.57.0 entfällt.

## 0.57.0 – 2026-09-29 (DEV)

- KC-CLUB-PINNWAND-LIVE (neu): neue Post-its bei geöffneter App alle 45 s (und beim Zurückkehren in die App) über die reine
  Lese-Aktion pinnwand_neu – markiert nichts als gesehen (die „gelesen“-Anzeige bleibt ehrlich). Einblendung oben
  „📌 Du hast ein neues (wichtiges) (privates) Post-it von X bekommen“ mit „Ansehen“, wichtig in Rot, mit Ton; jeder Zettel nur
  einmal je Gerät. „privat“ nur, wenn der Zettel für genau diese eine Person ist.
- Push beim Anheften an alle Empfänger mit geöffneter App (wichtig und unwichtig), gleicher Text; neuer Bereich „📌 Pinnwand“
  unter Benachrichtigungen (Standard: nur Push – ohne Push-Abo keine Mail je Zettel). Regeln club_pinnwand* (Migration v58),
  Korrelation club-pinnwand:<id> (Communicator verhindert Doppelversand). Push öffnet direkt die Pinnwand (#pinnwand).

## 0.56.1 – 2026-09-29 (DEV)

- KC-CLUB-ANMELDECACHE Teil 2: Messung aus der EU zeigte, dass der Instanz-Speicher selten trifft (Supabase verteilt auf
  wechselnde Instanzen) → Fix an der Quelle: Anmeldung in einer Datenbank-Runde (RPC kc_club_anmeldung, Migration v57:
  Token-Hash prüfen, „zuletzt gesehen“ setzen, Person + Rollen liefern). ping meldet Instanz und Speicher-Treffer.

## 0.56.0 – 2026-09-29 (DEV)

- KC-CLUB-ANMELDECACHE (neu): geprüfte Anmeldung je Server-Instanz 60 s im Speicher (Schlüssel = SHA-256 des Tokens),
  spart je Anfrage zwei Datenbank-Runden. Zugang/Rollen ändern leert den Speicher sofort (andere Instanzen ≤ 60 s).
  „zuletzt gesehen“ höchstens alle 30 s schreiben (Online-Anzeige 150 s bleibt korrekt). ping liefert serverMs/anmeldungMs;
  der Verbindungstest zeigt „Server gesamt … ms“ (Rest der Antwortzeit = Übertragung).
- KC-CLUB-LIVETIPPEN (neu, freiwillig): Einstellung „👁️ Andere sehen live, was ich tippe“ (Privatsphäre, Standard aus).
  Nur dann schickt die App den Entwurf (≤ 300 Zeichen, höchstens 1×/s, letzter Stand kommt nach) und der Server speichert
  ihn – nur für Teilnehmer der Unterhaltung sichtbar (letzte 140 Zeichen), nur in der flüchtigen Tabelle kc_club_tippen
  (nie gespiegelt/gesichert, Aufräumen alle 5 Min., Migration v56). Wer es an hat, sieht im Chat einen Hinweis.

## 0.55.0 – 2026-09-29 (DEV)

- KC-CLUB-NETZART (neu): Verbindungstest mit Netzart-Auswahl (📶 WLAN / 📱 Mobilfunk / ❔ weiß nicht), vorbelegt mit der
  Erkennung des Handys (navigator.connection.type, nur Android teils) oder der letzten Wahl. Die letzten 6 Tests je Gerät
  stehen als Tabelle nebeneinander (localStorage, reine Komfortfunktion); jedes Ergebnis geht zusätzlich als Diagnose
  „verbindung“ ins Club-Protokoll (Netz, Antwortzeit, ↓/↑, Datenbankzeit). Zeile „Handy“ ehrlich beschriftet:
  „Tempo-Klasse 4G“ statt „4G“ (effectiveType ist keine Netzart). Hinweis: Datenbankzeit misst der Server – netzunabhängig.
- KC Core Spiegel: die zwei PC-Manager-Spiegeltabellen in Neon in Supabase-Spaltenreihenfolge neu aufgebaut (Freigabe
  Hansi) → wieder im Tages-Backup, Restore-Lesetest 188/188 ok.

## 0.54.0 – 2026-09-29 (DEV)

- KC-CLUB-TIPPT (neu): „schreibt …“ in Unterhaltungen. Beim Tippen meldet die App höchstens alle 3 s (Aktion tippen),
  das Zeichen gilt 6 s (kc_club_tippen, Migration v54, stündliches Aufräumen, Spiegel-Regel „nicht spiegeln“).
  Anzeige über dem Eingabefeld mit hüpfenden Punkten, im Einzel-Chat zusätzlich in der Kopfzeile; in Gruppen mit Namen.
  Senden, Feld leeren oder Chat verlassen beendet es sofort. Wer die Online-Anzeige ausgeschaltet hat, meldet kein „schreibt …“.
  Chat-Takt 2 s: schreibt jemand → jedes Mal, jemand online → 4 s, sonst 12 s (wie bisher); keine überlappenden Abrufe.
- KC-CLUB-NEON-GROESSE (neu): Admin-Zentrale zeigt den Neon-Füllstand (von 0,5 GB) als Balken mit Messzeit; älter als
  13 Std. → grau „⚠️ veraltet“. Gemessen vom Spiegel-Worker nur, wenn er ohnehin mit Neon verbunden ist (keine Extra-
  Rechenzeit, höchstens alle 30 Min.). Quelltext kc-db-mirror-worker jetzt im Repository (supabase/functions/).

## KC Core Spiegel – 2026-09-29 (Datenbank, ohne App-Build)

- KC-SPIEGEL-ALLE (Admin-Freigabe Hansi): alle 195 Tabellen haben eine Spiegel-Regel (vorher 118 ohne).
  117 Neon-Zieltabellen neu angelegt (supabase/neon/…, nur CREATE); 188 Tabellen gespiegelt und geprüft identisch,
  186 im verschlüsselten Tages-Backup (Restore-Lesetest bestanden).
- Geheimnisse gehen nie nach Neon: Registry kc_db_mirror_redaction (Push-Adressen/-Schlüssel, externe Zugangsdaten,
  Sync-Schlüsselmaterial, Kopplungscode, Quittier-Kennung) → als NULL gleichen Typs gespiegelt.
- Sparmodus-Takt ohne 75er-Grenze (Pakete ≤25 Tabellen/≤8 MB), Tages-Backup ohne feste 36er-Liste (alle backup_enabled).
- Fehler behoben: Prüfsumme hing von der Sortierregel ab (Supabase en_US, Neon C) → collate "C".
- Bewusst nicht gespiegelt (Regel mit Begründung): kc_system_check_history (57 MB Messverlauf),
  kc_communication_health_snapshots (Auslesen 7,5 s > 8-s-Grenze). Vorerst ohne Backup: 2 PC-Manager-Tabellen
  (Spaltenreihenfolge in Neon abweichend, Neuaufbau nach Freigabe). Restore-Lesetest fest um 00:15 eingeplant.

## 0.53.0 – 2026-09-29 (DEV)

- KC-CLUB-DRUCK (neu): Drucken / als PDF speichern über ein schmales Druckersymbol rechts in der Kopfzeile.
  Termine: Auswahlfenster Tag / Woche / Monat (A4 quer) / Jahr / To-do-Liste, mit Datum und Häkchen, was drauf soll
  (Treffen, Aktionen, Geburtstage, Dienste, Abstimmungen, Feiertage); To-do nach Zuständigen, Kategorie oder Fälligkeit.
  Treffen-Karte: Teilnehmerliste mit Antworten, Spalte „da“ zum Abhaken und Mitfahrten. Protokoll: Kopf, Tagesordnung,
  Beschlüsse, Aufgaben, Anlagen, Einwände, Unterschriftszeilen. Erstattung: aktueller Entwurf oder gesendete Anträge
  (Server liefert jetzt Positionen/Bemerkung mit) inkl. Summe und Unterschriften. Druckbild über @media print (nur #druck),
  Kopf mit Club-Logo, Fuß mit Seitenzahl. iPhone-App: zusätzlich „Druckseite teilen“. Kalender-Daten für längere
  Zeiträume in 60-Tage-Stücken; kalEintraege(tag, Quelle, Feiertage) wiederverwendet (kein zweiter Kalender-Kern).
- KC-CLUB-AUFGABEN-MEHRERE (neu): Protokoll-Aufgabe für mehrere Personen (bis 10) – je Person eine Zeile mit
  gemeinsamer Gruppe (kc_club_aufgaben.gruppe, Migration v53), Anzeige „gemeinsam mit …“, im Druck eine Zeile.
- KC-CLUB-PERSONENWAHL (neu): gemeinsames Häkchen-Fenster „Wer?“ für To-dos und Protokoll-Aufgaben.

## 0.52.0 – 2026-09-29 (DEV)

- KC-CLUB-TODO-MEHRERE (neu): mehrere Zuständige je To-do (bis 10). Auswahl per Häkchen-Blatt beim Anlegen und beim Ändern
  (ersetzt die Nummern-Eingabe), Anzeige „👉 du, Klaus, Dieter“ (antippen = ändern), Filter „👉 Mir“ für alle Zuständigen.
  Jeder Zuständige sieht und kann abhaken; Bescheid geht beim Anlegen an alle (außer mir) und beim Ändern nur an neu
  Hinzugekommene. Spalte kc_club_todo.zustaendige (text[], GIN-Index); altes Feld zustaendig bleibt (erster Eintrag).

## 0.51.0 – 2026-09-29 (DEV)

- KC-CLUB-WARTEN: WARTEN_STILL unterdrückte die Kochmütze auch, wenn das Mitglied selbst etwas antippt. Jetzt:
  api(action, daten, { warten: true }) erzwingt sie – bei ↻ Aktualisieren, Wetter (Karte öffnen, Ort geändert), Admin-Zentrale
  („Neu prüfen“, Karte öffnen), Info-Karten (Demnächst, Fotos, Zentrale), Kalender, Nachrichten, Pinnwand, Foto-Ort.
  Hintergrund-Takt (online, Nachladen) bleibt still. Neue Warte-Texte.
- Fehler behoben: Admin-Karte stürzte ab, wenn der Spiegel-Zustand nicht abrufbar war (Watchdog/Abdeckung fehlten → jetzt grau).
- KC-TERMINE-DEPLOY (neu): Workflow „Termin-Programm hochladen“ lädt kc-termine aus Sire65/KC-Besuchsprotokoll
  (Stand in .github/deploy/kc-termine.ref, erst Test, dann Upload, dann Prüfung) – Quellcode bleibt im Besuchsprotokoll.
  Erster Einsatz: Besuchsprotokoll 1.3.9 (Erinnerung nach Terminänderung zuverlässig).

## 0.50.0 – 2026-09-29 (DEV)

- KC Core Spiegel (Migration 20260929_kc_core_mirror_sparmodus_abdeckung.sql, Admin-Freigabe Hansi): Watchdog wieder an
  (alle 30 Min., nur Supabase), Quell-Prüfung stündlich; Frische-Fenster im Sparmodus = Takt + 30 Min. (6:30). Neue
  Abdeckungs-Prüfung: Tabellen ohne Spiegel-Regel – Befund 118 von 195 (u. a. alle kc_club_*, Communicator-Nachrichten,
  Termine, WM). Die „automatische Aufnahme“ im Watchdog war nur eine Meldung; der Worker legt in Neon keine Tabellen an,
  das Backup hat eine feste Liste (36). Aufnahme neuer Tabellen braucht Einstufung (Datenschutz) + Neon-Tabelle + Regel.
- KC-CLUB-ADMIN-SPIEGEL: Zeilen „Watchdog“ (grau, wenn > 90 Min. still) und „Abdeckung“ (gelb bei Tabellen ohne Regel,
  Liste in Einzelheiten).

## 0.49.0 – 2026-09-29 (DEV)

- Betrieb (Admin-Freigabe Hansi): Neon-Spiegel und Backup wieder aufgenommen – über den vorhandenen Sparmodus
  (kc_neon_low_compute_cycle/-backup_cycle): Spiegel alle 6 Std. (Cron 44: 10 */6 * * *), Backup täglich 00:12 (Cron 45),
  Neon-Wartung beendet, Aufräumen/Tagesverdichtung (15, 36) wieder an, Watchdog/5-Min-Spiegel/Quell-Check (17, 41, 14) bleiben
  aus (kein Echtbetrieb, Neon-Rechenzeit sparen). Wiederherstellungspunkt und Freigabe im Spiegel-Audit (3588/3589).
  Sofortlauf 29.09. 18:23: Backup 36/36 Tabellen; Spiegel 67/68 gleich – kc_core_app_registry abweichend, weil die in 0.x
  (Migration v16, 28.09.) ergänzten Spalten wartung/wartung_hinweis/wartung_seit im Neon-Spiegel fehlten → dort ergänzt.
- KC-CLUB-ADMIN-SPIEGEL: Verzögerungsgrenze aus der eingeschalteten Regel (Sparmodus 6,5 Std.; gelb bis doppelt, dann rot).
  Neu: „🪞 Jetzt spiegeln – nur im Notfall“ (Server-Aktion admin_spiegeln, nur Admin, mit Rückfrage, protokolliert).

## 0.48.1 – 2026-09-29 (DEV)

- KC-CLUB-ADMIN-SPIEGEL: Backup-Zeile nennt die Pause auch, wenn die Backup-Regel noch „an“ ist, aber alle Neon-Jobs global
  pausiert wurden (Live-Befund: Regel an, Cron seit 21.09. ausgesetzt). Nur App.

## 0.48.0 – 2026-09-29 (DEV)

- KC-CLUB-ADMIN-SPIEGEL (neu): Admin-Zentrale zeigt „Neon-Spiegel“ und „Backup“ (nur lesend aus kc_db_mirror_policies/-runs/-audit
  und kc_neon_compute_policy). Spiegel: grün nur, wenn eingeschaltet und letzter Abgleich innerhalb der Verzögerungsgrenze; gelb
  bei Pause (mit Datum und Neon-Wartung „bis“) oder bis 1 Std. Verzögerung; rot, wenn er hängt. Backup: grün ≤ 26 Std., gelb
  ≤ 72 Std., sonst rot. Einzelheiten: letzter Wiederherstellungs-Test, Neon-Rechenzeit-Modus, Pausen-Grund, Regeln.
- Befund bei Einbau (29.09.): Spiegel seit 20.09. und alle Neon-Jobs inkl. Tagesbackup seit 21.09. bewusst pausiert
  (Neon-Rechenbudget bis Monatsreset, Wartung bis 01.10.) – wird jetzt sichtbar statt still.

## 0.47.0 – 2026-09-29 (DEV)

- KC-CLUB-ADMINLAGE (neu): 7. Info-Karte „🛡️ Admin-Zentrale“, nur für Admin sichtbar (Registry-Feld nur(); Server-Aktion
  admin_lage mit nurAdmin). Leuchtanzeige mit Lämpchen: Server (Version, Datenbank-Antwortzeit), Kommunikation (bestehender
  communicatorStatus), KC-Programme aus Registry ADMIN_PROGRAMME über ihr Lebenszeichen (kicc_program_heartbeats) + Datenstand
  (KC Verwaltung/PC-Manager, KC Dienstplan, KC System-Check, KICC), Wartung. Grün nur bei frischer Meldung (≤ 60 Min.), gelb bis
  7 Tage, sonst grau „keine aktuelle Meldung“ (Rule 11). Füllstand Datenbank (live, Grenze/Schwellen aus kc_core_system_health)
  und Dateispeicher als Balken. Mitglieder: gesamt, mit Zugang, online, heute, 7 Tage, nie angemeldet, mit Push, alte App-Version.
  „📋 Einzelheiten“: zuletzt aktive Mitglieder mit App-Version, Communicator-Zahlen, Programm-Versionen, System-Check.
  Neue Funktion kc_club_db_groesse() (nur Service-Rolle).

## 0.46.0 – 2026-09-29 (DEV)

- KC-CLUB-WETTER-TAGE (neu): Wetter-Feld mit 7 Tagen in einer Leiste zum Schieben (Tag des Treffens mit 📅). Tag antippen →
  große Anzeige zeigt diesen Tag (Symbol, Höchst/Tiefst, Regen %/mm, Wind; Animation passend zum Tag), „↩ jetzt“ zurück.
  Tag lange drücken (550 ms, kurzes Vibrieren) → Blatt mit Tagesdetails: Höchst/Tiefst, Regen, Wind/Böen, Sonnenstunden,
  Sonnenauf-/untergang, UV-Index mit Einstufung, Verlauf 6–21 Uhr alle 3 Stunden (7 Tage), Hinweis auf das Treffen.
  Wischen in der Tagesleiste blättert nicht das Info-Feld. Server: Open-Meteo-Adapter liefert zusätzlich Tageswerte und Stunden.
- Fehler behoben: In der Foto-Großansicht („✏️ Ändern“) war die Schrift in den Feldern weiß auf hellem Grund. Ursache: Felder
  erbten die Textfarbe der Umgebung – jetzt haben alle Eingabefelder die Textfarbe passend zu ihrem Hintergrund (Tag/Nacht).

## 0.45.0 – 2026-09-29 (DEV)

- KC-CLUB-FOTO-META (neu): Foto in der Großansicht antippen (oder „ℹ️ Details“) → Aufnahmezeit, Ort (Ortsname + Karte
  OpenStreetMap/Google Maps, Höhe), Kamera/Handy, Objektiv, Blende/Belichtung/ISO/Brennweite/Blitz, Pixel/MP, Originalgröße,
  Dateiname, wer wann hochgeladen hat. Fehlendes steht als „unbekannt“ da (nie geraten); alte Fotos ohne Daten mit Hinweis.
  EXIF wird in der App aus dem Original gelesen (exifLesen, ersetzt den Datums-Teil von exifDatum – gleiches Ergebnis), weil das
  Verkleinern EXIF entfernt. Hochladen: „📍 Aufnahmeort mitspeichern“ (Standard an); GPS auf ~10 m gerundet. Ortsname über
  Adapter ORTSNAMEN (Nominatim/OpenStreetMap, kostenlos, max. 1 Anfrage/s, einmal ermittelt und gemerkt) – Aktion foto_ort,
  „🚫 Ort entfernen“ nur für Hochladende/Clubleitung. Spalte kc_club_fotos.meta (jsonb).

## 0.44.0 – 2026-09-29 (DEV)

- KC-CLUB-ZENTRALE (neu): 6. Info-Karte „📡 Kommunikationszentrale“. Digitale Anzeige (Uhr, online, ungelesen, Push-Zustand,
  Laufschrift der letzten Nachrichten), „Wer?“ (👥 Alle, 🟢 Online, ✖ Keiner, ☰ Auswahl mit Ämtern, Chat-Gruppen und einzelnen
  Mitgliedern samt Online-Punkt und Status), Schaltpult 📞 Anrufen (online: App-Anruf, sonst freigegebene Telefonnummer),
  🎥 Video, ✊ Anklopfen, 🎤 Sprachnachricht, 💬 Chat; Kurznachricht mit zusätzlich 🔔 Push / ✉️ E-Mail / 🟢 WhatsApp.
  Nicht mögliche Knöpfe sind blass und sagen beim Antippen warum. Ab 5 Empfängern Rückfrage. Nutzt ausschließlich vorhandene
  Wege (nachricht_senden, anrufen, anklopfen, spracheStart, whatsappWeitergeben) – kein Parallel-Weg.
- Beschluss Admin: alle Mitglieder dürfen alle anschreiben/anrufen/anklopfen – Server-Schalter KOMMUNIKATION.alleDarfJeder
  (vorher „Alle“ nur Clubleitung); „👥 Alle Mitglieder“ im normalen „＋ Neu“ jetzt für alle sichtbar.
- KC-CLUB-INFOFELD: ⚙️ → Darstellung „🪧 Info-Feld oben beim Start“ (zuletzt gezeigte oder feste Karte, gespeichert je Mitglied,
  Einstellung „infofeld“). Pfeile jetzt mittig links/rechts auf dem Rahmen, Punkte direkt unter dem Feld (Steuerzeile entfällt).

## 0.43.0 – 2026-09-29 (DEV)

- KC-CLUB-INFOFELD-DEMNAECHST (neu): 4. Karte im Info-Feld „🗓️ Demnächst“ – die nächsten 4 Einträge der kommenden 8 Wochen aus
  der bestehenden Aktion „kalender“ (Treffen ohne abgesagte, Aktionen, freigegebene Geburtstage, eigene Dienste, offene
  Abstimmungsfristen), sortiert; antippen springt im Kalender auf den Tag (zumTag). Kein neuer Server-Code.
- KC-CLUB-INFOFELD-FOTOS (neu): 5. Karte „📷 Neueste Fotos“ – die 4 zuletzt hochgeladenen Fotos als Vorschau (neue, schlanke
  Server-Aktion fotos_neueste statt der kompletten Fotoliste), antippen öffnet das Foto im Album.
- Registry INFO_FELDER: Felder können eigene Daten laden (laden/neuMin) – erst wenn sie gezeigt werden, Fehler sichtbar.

## 0.42.0 – 2026-09-29 (DEV)

- KC-CLUB-INFOFELD (neu): Das Info-Feld oben auf der Startseite ist blätterbar – ‹ › antippen, im Feld wischen oder einen der
  leuchtenden Punkte (aktuelles Feld leuchtet). Felder aus der Registry INFO_FELDER: 📅 Nächstes Treffen (bisheriger Inhalt
  unverändert), 🌦️ Wetter, 🔔 Für dich (Offenes: Nachrichten, Zusage, Abstimmungen, Terminfindung, Protokolle, Aufgaben, Dienst,
  Geburtstage – antippen führt hin; „Heute wichtig“ unten bleibt). Kein automatisches Weiterblättern; letztes Feld wird gemerkt.
  Gleicher Inhalt wird nicht neu gezeichnet (Online-Takt).
- KC-CLUB-WETTER (neu): Wetter-Feld mit Animation je Wetterlage (Sonne/Mond+Sterne, Wolken, Nebel, Niesel, Regen, Schnee,
  Gewitter mit Blitz, Sturm-Böen ab 62 km/h), Temperatur, gefühlt, Wind, 3-Tage-Vorschau, Wetter am Tag des nächsten Treffens,
  „Stand“ mit ⚠️ veraltet ab 3 h, ohne Daten klarer Hinweis statt Schein-Wetter. „bei reduzierter Bewegung“ stehen Animationen still.
  Server: Registry WETTER_QUELLEN (Adapter Open-Meteo – kostenlos, ohne Schlüssel) und WETTER_APPS (WetterOnline, Windy, DWD,
  Google); Abruf nur über den Server, 30 Minuten Zwischenspeicher. Admin (⚙️ → „🛠️ Admin: Wetter“): Ort per Suche wählen
  (keine Freitext-Koordinaten), Wetter-App und Datenquelle als Auswahl; Änderungen im Protokoll. Neue Tabelle kc_club_konfig (RLS).

## 0.41.0 – 2026-09-29 (DEV)

- KC-CLUB-CHATLISTE (neu): Nachrichten-Übersicht – einmal tippen wählt eine Unterhaltung aus (goldener Rahmen) und zeigt
  „💬 Öffnen“ und „🗑️ Aus meiner Liste“ (Admin zusätzlich „⚠️ Für alle löschen“ mit Sicherung). Doppelt tippen (< 400 ms) öffnet
  direkt. „Aus meiner Liste“ nutzt die bestehende Server-Aktion unterhaltung_ausblenden (nur für mich; schreibt jemand wieder,
  erscheint die Unterhaltung erneut) – mit Rückfrage. Nur App, kein Server-Update.

## 0.40.0 – 2026-09-29 (DEV)

- KC-CLUB-FEEDBACK-DAUERHAFT (neu): Fragebogen Schritt 1 um „Ich halte die Club-App für sinnvoll und werde sie dauerhaft einsetzen.“
  (👍 Ja / 🤔 Vielleicht / 👎 Nein) ergänzt. Bei „Nein“ fragt die App Pflicht-Begründung ab („Warum nicht? Gib doch einen hilfreichen
  Kommentar ab …“), bei „Vielleicht“ freiwillig. Registry-Feld `grund` an der Frage (bei/pflicht/t); Server übernimmt den Text nur zur
  passenden Antwort (max. 500 Zeichen) als antworten["<id>_grund"]. Auswertung (Admin) zeigt die Begründungen, anonym ohne Namen.
  Bogen bleibt 2026-1 (reine Ergänzung, alte Antworten gültig).
- Beta-Hinweis oben im Feedback: noch nicht alles komplett getestet, Funktionen/Ansichten können sich ändern, Feedback erwünscht.

## 0.39.1 – 2026-09-29 (DEV)

- KC-CLUB-BELEGFOTO (neu): Erstattung → Belege mit zwei Knöpfen: „📷 Foto aufnehmen“ (öffnet direkt die Kamera, capture=environment)
  und „📁 Datei wählen“ (Datei-Explorer, Fotos oder PDF, mehrere auf einmal). Bis zu 5 Belege je Position (Grenze des Servers),
  Ladeanzeige je Beleg, ✕ zum Entfernen; „Hinzufügen“ wartet, bis alle Belege hochgeladen sind. Nur App, kein Server-Update.

## 0.39.0 – 2026-09-29 (DEV)

- KC-CLUB-KMSATZ (neu): ⚙️ Einstellungen → „🛠️ Admin: Erstattung (km-Satz)“ (nur Admin). Kilometerpauschale mit „gilt ab“-Datum
  eintragen, Liste aller Sätze (künftige markiert), löschen. Voreinstellung 0,38 € ab 01.01.2026. Jede Fahrt wird mit dem Satz
  berechnet, der am Tag der Fahrt galt – in der Vorschau (App) und im Antrag (Server) nach derselben Regel; der Satz steht je Fahrt
  in Mail und Antrag. Tabelle kc_club_km_satz (RLS).

## 0.38.0 – 2026-09-29 (DEV)

- KC-CLUB-ERSTATTUNG (neu): Kachel „💶 Erstattung“ (Mein Bereich). Positionen sammeln: 🚗 Fahrtkosten (Datum, km, Grund aus
  Auswahlliste – Kochen in Dortmund, Fahrt zum Budendienst, Einkaufsfahrt … oder eigener Grund –, Ziel; Betrag = km × Pauschale
  0,30 €/km aus der Registry), 🛒 Einkauf vorgestreckt (Datum, Betrag, was, Geschäft, Beleg-Foto/PDF) und 📦 Sonstige Auslage.
  Summe, Auszahlung (Überweisung/bar), Bemerkung. Versand als eine Mail über den Communicator: An = Kassenwart, CC = Clubsprecher
  (aus den Ämtern), BCC = Antragsteller + Admin; Belege als Mail-Anhang. Server prüft alle Angaben und rechnet die Summe selbst.
  „📋 Meine Anträge“ mit Status. Tabelle kc_club_erstattung (RLS). routerSenden kann jetzt CC/BCC (Mitgliedsnummern).

## 0.37.0 – 2026-09-29 (DEV)

- KC-CLUB-SPRACHE (neu): 🎤 im Chat – Aufnahme (MediaRecorder, Opus/M4A, ~32 kbit/s, max. 3 Minuten) mit roter Aufnahme-Leiste
  (Zeit, ✖ Verwerfen, ➤ Senden). Die Aufnahme wird wie ein Anhang hochgeladen und als Nachricht „🎤 Sprachnachricht (0:12)“ an
  dieselben Empfänger geschickt wie jede Nachricht (Person, Gruppe, alle; Push/Mail/WhatsApp wie gewählt). Im Chat „▶️ Sprachnachricht
  anhören“ – Datei wird erst beim Antippen geladen. Mikrofon wird nach der Aufnahme sofort freigegeben.
- KC-CLUB-TODO-ZUSTAENDIG (neu): „👉 Wer soll es machen?“ beim Eintragen (oder später „👉 zuweisen“ durch Ersteller/Clubleitung).
  Die zuständige Person bekommt Bescheid (Bereich „Termine“, wie Protokoll-Aufgaben), sieht den Eintrag auch wenn er privat ist
  und darf ihn abhaken. Filter „👉 Mir“. Spalte zustaendig in kc_club_todo.

## 0.36.0 – 2026-09-29 (DEV)

- KC-CLUB-TODO (neu): Termine → dritter Reiter „✅ To-do“. Eintrag mit Text (max. 200), Kategorie (🛒 Einkaufen, 📦 Bestellung,
  🧹 Erledigen, 📞 Anrufen, 🍳 Vorbereiten, 📝 Sonstiges – Registry im Server), optional fällig am, „👤 nur für mich“ oder
  „👥 für alle“. Tabelle mit Häkchen (✓ wer/wann), überfällige rot, Filter Alle/Meine/Für alle, Erledigte ein-/ausblenden.
  Gemeinsame Einträge darf jeder abhaken; löschen nur Ersteller oder Clubsprecher/Kassenwart/Admin. Tabelle kc_club_todo (RLS).
- KC-CLUB-REGISTER-ZIEHEN (neu): Register „Verein · Mein Bereich · Programme“ 0,45 s festhalten, nach links/rechts ziehen,
  loslassen – Reihenfolge wird wie die Kachel-Anordnung je Mitglied gespeichert („↺ Standard“ setzt sie zurück).

## 0.35.0 – 2026-09-29 (DEV)

- KC-CLUB-LINK-HILFE (neu): Wird die App mit einem alten/ungültigen Link geöffnet, zeigt die Sperrseite rot „⚠️ Dieser Link
  gilt nicht mehr“ mit dem Weg „Link verloren? → E-Mail eingeben → neuer Link per Mail“. Zusätzlich allgemeiner Hinweis
  „immer den neuesten Link nehmen“.
- KC-CLUB-LINK-EINFUEGEN (neu): „📋 Link einfügen“ auf der Sperrseite – persönlichen Link (aus Mail/WhatsApp kopiert) einfügen
  oder per „Aus Zwischenablage“ übernehmen; die App merkt ihn und startet. Hilft vor allem beim iPhone.
- iPhone/iPad: Die Home-Bildschirm-App übernimmt den Speicher aus Safari nicht. Solange die App in Safari mit gültigem
  Schlüssel offen ist, bekommt „Zum Home-Bildschirm“ eine Start-Adresse mit dem persönlichen Schlüssel (nur iOS, nur im Browser).
- Einladungstext (🔗) und Installationsanleitung: genauere iPhone-Schritte (Safari → Teilen → Zum Home-Bildschirm → Hinzufügen)
  und der Weg zum Neu-Anfordern, falls der Link nicht funktioniert.

## 0.34.1 – 2026-09-29 (DEV)

- KC-CLUB-STATUSFARBE (neu): Status farbig – 🟢 verfügbar grün, 🟠 beschäftigt orange, 🏖️ Urlaub blau, 🤒 krank lila,
  🔴 nicht erreichbar rot. Der Knopf „Mein Status“ (Mitglieder) zeigt jetzt den eigenen Status statt nur „Mein Status“,
  ebenso der Status-Knopf im Kopf der Startseite; in der Mitgliederliste steht der Status als farbige Marke. Nach dem
  Speichern wird die Liste sofort aktualisiert.

## 0.34.0 – 2026-09-29 (DEV)

- KC-CLUB-QUITTUNG (neu): Der Service Worker der Club-App meldet dem KC Communicator (kc-communication-push-receipt), wenn
  ein Push angezeigt und wenn er geöffnet wurde (Auftragsnummer aus dem Push + eigene Push-Adresse). Bisher kamen solche
  Rückmeldungen nur aus anderen Programmen. Im Chat steht unter eigenen Nachrichten zusätzlich zu ✓/✓✓ (gelesen in der App)
  „🔔 verschickt / angekommen / geöffnet“ und „✉️ Mail“. Rückmeldungen gibt es für Pushs, die nach dem Update empfangen
  werden, und nur von Handys mit der neuen Version (Pushs über andere Programme, z. B. die frühere Push-Seite, melden nur,
  wenn jenes Programm es kann).

## 0.33.0 – 2026-09-29 (DEV)

- KC-CLUB-WARTEN (neu): dauert eine Anfrage länger als 0,35 s, erscheint mittig eine drehende Kochmütze mit passendem Text
  („Nachricht wird gesendet …“, „Termin wird gespeichert …“, „Einen Moment …“). Blockiert nichts, verschwindet auch bei Fehlern.
  Hintergrund-Abfragen (Online-Takt, Chat-Aktualisierung, Anrufstatus, automatisches Speichern, Start) lösen sie nicht aus.

## 0.32.1 – 2026-09-29 (DEV)

- KC-CLUB-ZUSTELLWAHL: Wählt der Absender ausdrücklich 🔔 Push, bekommen auch Mitglieder, die die Club-App noch nie
  geöffnet haben, aber schon ein aktives Push-Abo haben (z. B. von der früheren Push-Seite), den Push – zusätzlich zur Mail
  mit Link-Hinweis; der Push-Text bittet, den persönlichen Link zu öffnen. Ohne Auswahl bleibt es bei der Mail (KC-CLUB-OHNEAPP).

## 0.32.0 – 2026-09-29 (DEV)

- KC-CLUB-VIDEO (neu, Test): 🎥 Videoanruf über die App (gleiche Technik wie der Anruf per Ton). „🎥“ in „Gerade online“ und
  „🎥 Video (Test)“ auf der Mitglied-Karte. Angerufener sieht „🎥 … ruft per Video an“ und nimmt mit 🎥 (mit Bild) oder 📞
  (nur Ton – sieht den anderen trotzdem) an. Im Gespräch: Bild des anderen bildschirmfüllend, eigenes klein (gespiegelt),
  🎙️ stumm, 📷 Kamera aus/an, 🔄 vorne/hinten, ✖ auflegen. Kamera wird beim Auflegen sicher ausgeschaltet.
  Auflösung bewusst 640×480 (schont Datenvolumen). Push-Titel „🎥 … ruft per Video an“. Server speichert nur die Art.

## 0.31.1 – 2026-09-29 (DEV)

- KC-CLUB-ONLINE: Kennzahl „Mitglieder“ zeigt den Online-Stand immer (sofern die eigene Online-Anzeige an ist):
  „🟢 3 online ›“ oder blass „⚪ sonst keiner online“ – antippen öffnet die Liste bzw. einen Hinweis.

## 0.31.0 – 2026-09-29 (DEV)

- KC-CLUB-ANRUF (neu, Test): 📞 Sprechen per Ton direkt über die App (WebRTC, Handy zu Handy, kostenlos). „📞 Anrufen“ in
  „Gerade online“ und auf der Mitglied-Karte (wenn online). Der Angerufene sieht „… ruft an“ (Vollbild, Klingelton + Vibration;
  bei geschlossener App per Push „📞 … ruft an“) mit Annehmen/Ablehnen. Während des Gesprächs: Dauer, 🎙️ stumm, ✖ auflegen.
  Klingeln max. 45 s (dann „verpasst“). Server vermittelt nur Angebot/Antwort (SDP, max. 20 kB, nur an die Gegenseite) –
  Sprache wird nirgends gespeichert. Kostenlose öffentliche STUN-Server; kein (kostenpflichtiger) TURN-Server – kommt keine
  Verbindung zustande (manche Mobilfunknetze), sagt die App das und bietet eine Nachricht an. Tabelle kc_club_anruf (RLS).
  Diagnose: Ergebnis (verbunden ja/nein, Dauer) wird protokolliert, um die Erfolgsquote zu sehen.

## 0.30.0 – 2026-09-29 (DEV)

- KC-CLUB-NEUIGKEITEN (neu): „Update prüfen“ / Versions-Knopf / Balken „Was ist neu?“ öffnet ein kleines Fenster
  „🆕 Neu in Version X“ mit Stichpunkten (auch übersprungene Versionen) und „🔄 Jetzt aktualisieren“ / „Später“.
  Nach einem Update (auch automatisch) erscheint einmal „✅ Aktualisiert auf Version X – das ist neu“ (nicht beim allerersten
  Start, dann kommt die Begrüßung). Quelle: version.json → „verlauf“ (je Version Stichpunkte).
- KC-CLUB-ONLINE: Startseite – Kennzahl „Mitglieder“ zeigt „🟢 3 online“ (nur wenn die eigene Online-Anzeige an ist).
  „🟢 3 online ›“ antippen öffnet „Gerade online“ mit jeder Person und den Knöpfen 👋 Anklopfen / 💬 Schreiben.

## 0.29.0 – 2026-09-29 (DEV)

- KC-CLUB-ONLINE (neu): 🟢 wer gerade online ist (in den letzten 2½ Minuten in der App; die App meldet sich alle 60 s,
  solange sie sichtbar ist). Grüner Punkt in der Mitgliederliste, „Gerade online“-Leiste in der Kommunikation.
  Einstellung ⚙️ → Privatsphäre „Anderen zeigen, wann ich online bin“ – Standard an; wer sie ausschaltet, erscheint nicht
  als online und sieht auch selbst niemanden (fair). Grundlage: vorhandenes kc_club_zugang.zuletzt_gesehen, kein Dauerbetrieb.
- 👋 Anklopfen: bei jemandem, der online ist → er/sie bekommt sofort (Push bzw. Fenster in der offenen App)
  „Hansi klopft an – möchtest du das Gespräch annehmen?“ ✅ Annehmen öffnet bei beiden dasselbe Zweiergespräch,
  ⏳ Später gibt dem Anklopfenden Bescheid. Nur Push, keine Mail; ein offenes Anklopfen je Person (3 Minuten). Tabelle
  kc_club_anklopfen (RLS). Zweiergespräch-Suche als gemeinsame Hilfsfunktion (auch für nachricht_senden, Verhalten gleich).
- 💬 Chat lädt alle 4 s neu, solange jemand aus dem Gespräch online ist (sonst alle 12 s statt 10 s).
- Begrüßung erwähnt die Online-Anzeige und wo man sie abschaltet.

## 0.28.0 – 2026-09-29 (DEV)

- KC-CLUB-BEGRUESSUNG (neu): Beim ersten Start erscheint einmal je Mitglied „Hallo <Vorname>! 👋“ mit drei Tipps
  (1. richtig installieren – oder ✅ schon installiert, 2. persönlich einrichten: Benachrichtigungen, Farbdesign, Schrift,
  Privatsphäre, 3. Meinung über „Feedback“), Gruß von Hansi. „⚙️ Weiter zu den Einstellungen“ öffnet ⚙️ Mehr und klappt
  „App-Installation“ (noch nicht installiert) bzw. „Darstellung“ auf; „Schließen“ beendet. Gemerkt am Server
  (Einstellung „begruessung“) und auf dem Gerät – erscheint danach nie wieder. Wichtige Pinnwand-Zettel springen in dieser
  Sitzung dann nicht zusätzlich auf (die Zahl auf der Kachel bleibt).

## 0.27.4 – 2026-09-29 (DEV)

- KC-CLUB-INSTALLATION: Samsung-Handys – über den Samsung-Browser „Internet“ installierte App gilt als richtige App (keine falsche
  „Verknüpfung“-Warnung, WhatsApp/Karten direkt). Installationsanleitung und Einladungstext um den Samsung-Weg ergänzt.

## 0.27.3 – 2026-09-29 (DEV)

- Einladungstext beim 🔗 Link (Mitglieder, nur Admin): Installationsanleitung wie unter ⚙️ → App-Installation
  („App installieren“ statt nur „Zum Startbildschirm hinzufügen“, damit keine Verknüpfung entsteht; iPhone-Hinweis).

## 0.27.2 – 2026-09-29 (DEV)

- KC-CLUB-ZUM-TREFFEN (neu): „Nächstes Treffen – in X Tagen“ (und das Treffen oben im Kopf) antippen öffnet Termine in der
  Kalender-Ansicht, springt in den Monat des Treffens, wählt den Tag aus und zeigt darunter die Einzelheiten.
- KC-CLUB-KACHELN: Register-Knöpfe (Verein, Mein Bereich, Programme) zeigen „sichtbar/gesamt“, z. B. „8/10“, sobald Kacheln
  ausgeblendet sind; sonst wie bisher nur die Zahl.

## 0.27.1 – 2026-09-29 (DEV)

- KC-CLUB-FEEDBACK-NEU (neu): „🆕 Neues Feedback starten“ nach dem Absenden – löscht die eigenen Antworten und beginnt von vorn.
  Admin: in der Auswertung „🆕 Neue Runde für alle starten“ – löscht alle Antworten, Auswertung beginnt bei null.
  Beides mit Rückfrage; vorher legt der Server eine Kopie in kc_club_feedback_archiv ab (schlägt die Kopie fehl, wird nichts gelöscht).

## 0.27.0 – 2026-09-29 (DEV)

- KC-CLUB-TREFFEN-AUSWAHL (neu): Beim Anlegen eines Termins Titel und Ort per Auswahlliste („Köcheclub-Treffen“, „Grillabend“ …;
  Orte „Garten“, „Hütte bei Anne“ und alle bisher benutzten Orte). „✏️ Eigener Titel/Anderer Ort …“ öffnet ein freies Feld;
  neue Orte stehen beim nächsten Mal automatisch in der Liste. Speichern unverändert.
- Kacheln kleiner (Höhe 100 statt 124 px, kleinere Symbole/Schrift, am PC mehr Spalten).
- Kalender kompakter: Tage 44 px hoch statt quadratisch (vor allem am PC deutlich kleiner), Einträge stehen wie bisher darunter.

## 0.26.3 – 2026-09-29 (DEV)

- KC-CLUB-PC (neu): In der installierten App unter ⚙️ Mehr → 📲 App-Installation „💻 Auch am PC oder Tablet nutzen“ –
  eigenen Link per „Teilen“/Mail an sich selbst schicken oder kopieren. Hinweis: nicht „Link verloren?“ nutzen, weil ein neuer
  Link den bisherigen ersetzt (ein Zugang je Person).

## 0.26.2 – 2026-09-29 (DEV)

- KC-CLUB-DESIGN: Schmuck-Kreis oben rechts auf den Kacheln je Design einstellbar („deko“); bei „Lagune“ Aqua → Gold wie im
  Reiseassistenten statt Pfirsich. Andere Designs unverändert.

## 0.26.1 – 2026-09-29 (DEV)

- KC-CLUB-DESIGN: sechstes Farbdesign „Lagune“ mit den Farben des Reiseassistenten (Navy #082F49, Türkis #0E7490,
  Aqua #14B8A6, Gold #F4B860, Hintergrund #EEF7FB, Kopf-Verlauf #07415E → #0B7F93 → #22B8A6) plus Nacht-Variante.
  Kontrast wie bei allen Designs im Test geprüft.

## 0.26.0 – 2026-09-29 (DEV)

- KC-CLUB-KACHELN-ZIEHEN (neu): Kacheln per Ziehen & Ablegen anordnen. Auf der Startseite eine Kachel 0,6 s festhalten →
  „Anordnen“ startet und die Kachel hängt am Finger (Pfeile ▲ ◀ ▶ ▼ und ✥ zeigen: frei verschiebbar). Schieben, loslassen – fertig.
  Im Anordnen-Modus reichen 0,3 s Festhalten. Der freie Platz wandert gestrichelt mit, am Bildschirmrand scrollt die Seite mit;
  kurzes Wischen scrollt weiterhin normal. Die Knöpfe ◀ ▲ ▼ ▶ bleiben als Alternative.
- KC-CLUB-FEEDBACK: Wunschliste aktualisiert – schon Umgesetztes (Kacheln anordnen, Farbdesigns, große Schrift, Monatskalender,
  Gruppen-Chats, Pinnwand) steht jetzt als „✅ Schon umgesetzt“ über der Liste; neue Ideen: Fahrgemeinschaften, Aufgabenliste für
  Veranstaltungen, Club-Neuigkeiten. „Was nutzt du am meisten?“ um Pinnwand und Gruppen-Chats ergänzt.
- Bereitstellung: Server-Teil wird per GitHub Actions („Server hochladen“) automatisch nach grünen Tests zu Supabase übertragen.

## 0.25.0 – 2026-09-29 (DEV)

- KC-CLUB-PINNWAND (neu): Kachel „📌 Pinnwand“ – Korkwand mit gelben, leicht schrägen Zetteln und roter Nadel.
  Zettel schreiben (höchstens 200 Zeichen, Zähler „25/200“), Wichtigkeit Normal oder ❗ Hoch, für: nur mich / alle / bestimmte Personen.
  Je Person höchstens 3 Zettel gleichzeitig (Server-Prüfung). Offene wichtige Zettel erscheinen beim Öffnen der App.
  „✓ erl.“ je Empfänger; beim ersten Anzeigen wird „gesehen“ mit Zeit erfasst. Wer wann gesehen/erledigt hat, sieht nur der
  Verfasser (und Clubsprecher/Kassenwart/Admin). Abnehmen: Verfasser oder Clubsprecher/Kassenwart/Admin.
  Neue Tabellen kc_club_pinnwand und kc_club_pinnwand_gelesen (RLS).

## 0.24.0 – 2026-09-29 (DEV)

- KC-CLUB-DESIGN (neu): Unter ⚙️ Mehr → Darstellung fünf fertige Farbdesigns mit Vorschau (Köcheclub Klassik = Standard,
  Küchengrün, Nordsee, Schiefer, Großer Kontrast), jedes mit Tag- und Nacht-Variante. Ein Tipp färbt die App sofort um;
  „↺ Standard wiederherstellen“ setzt Klassik + Automatisch. Nur Grundfarben wechseln – Status- und Warnfarben bleiben gleich.
  Jede Kombination wird im Test auf Lesbarkeit (Kontrast) geprüft. Gespeichert je Mitglied (Server-Einstellung „design“).
- Tag-/Nachtmodus: 🔄 Automatisch · ☀️ Immer Tag · 🌙 Immer Nacht. Automatisch = Lichtsensor, wenn das Handy ihn der App
  freigibt, sonst Sonnenauf-/-untergang in Werne (ohne Internetdienst berechnet). Ersetzt den Schalter „Dunkles Design“
  (bisherige Wahl wird übernommen); der 🌙/☀️-Knopf oben schaltet weiterhin direkt um.
- KC-CLUB-SCHLIESSEN (neu): „🚪 App schließen“ unten auf der Startseite und unter ⚙️ Mehr. Schließt die installierte App;
  wo das nicht erlaubt ist, erscheint eine kurze Anleitung.

## 0.23.0 – 2026-09-29 (DEV)

- KC-CLUB-GRUPPEN (neu): Gruppen-Chats mit Name und Symbol („👥 Gruppe“ in der Kommunikation). Mitglieder auswählen,
  alle werden benachrichtigt; im Chat über ⋮: Mitglieder ansehen, „Gruppe bearbeiten“ (Name, Symbol, Mitglieder dazu/entfernen –
  wer sie angelegt hat oder Clubsprecher/Kassenwart/Admin) und „Gruppe verlassen“. Die Unterhaltung liegt im Kommunikations-Kern,
  Name/Symbol in der neuen Tabelle kc_club_gruppen (RLS). Gruppen-Push: „👥 Gruppe: Vorname“.
- KC-CLUB-ZUSTELLWAHL (neu): Beim Schreiben „Benachrichtigen: 🔔 Push · ✉️ E-Mail · 🟢 WhatsApp“. Nichts gewählt = wie jedes
  Mitglied es eingestellt hat; Push/E-Mail gewählt = genau so (Mitglieder ohne App immer per Mail). WhatsApp kostenlos ohne
  Dienst: nach dem Senden wird der Text an WhatsApp übergeben (eine Person: direkt in ihren Chat, sonst „Teilen“ → Gruppe wählen).
- Symbole 🔔 ✉️ 🟢 bei Mitgliedern (Empfänger-, Gruppen- und Mitgliederliste): zeigen, ob jemand per Push, E-Mail oder WhatsApp
  erreichbar ist (WhatsApp nur, wenn die Handynummer für dich freigegeben ist) – nur ja/nein, keine Nummern.

## 0.22.0 – 2026-09-29 (DEV)

- KC-CLUB-KONTAKT: Messung nach der richtigen Installation (WebAPK) – WhatsApp öffnet jetzt direkt. Route: bei richtig
  installierter App öffnet „Route“ zuerst Google Maps direkt (Routenplanung), sonst wie bisher die Karte in der App;
  im Kartenfenster neuer Knopf „🧭 Route in Google Maps starten“ (mit Messung und Ausweichwegen).
- KC-CLUB-APPINFO (neu): Einstellungen → „ℹ️ App-Info“ mit Logo, „Entwicklung & Design: Hans-Joachim Koch“,
  App-/Server-Version, Installationsart, Handy-Modell (sofern der Browser es verrät), System, Browser, Bildschirm,
  Sprache/Zeitzone, Verbindung, Benachrichtigungs- und Kamera-Erlaubnis, Speicher, Hintergrunddienst, Technik.
  „📋 Infos kopieren“ für Hilfe/Fehlersuche – ohne Zugangslink.

## 0.21.0 – 2026-09-29 (DEV)

- KC-CLUB-ZUGANG-SELBST (neu): „Link verloren?“ auf der Seite „Persönlicher Link nötig“ – E-Mail-Adresse eingeben, der
  Server schickt über den KC Communicator (Regel club_nachricht_mail) einen neuen persönlichen Link an die im Club
  hinterlegte Adresse. Antwort verrät nicht, ob die Adresse existiert; höchstens 1× je 15 Min. je Person und 20× je Stunde
  insgesamt; nur aktive Mitglieder, keine Testzugänge; Protokoll „zugang_angefordert“. Der alte Link wird ungültig.
  Anlass: Hansi hatte die Verknüpfung gelöscht und kam nicht mehr in die App.

## 0.20.1 – 2026-09-29 (DEV)

- KC-CLUB-INSTALLATION: Die Verknüpfung auf Hansis Handy hat einen eigenen Speicher – in Chrome fehlte deshalb der
  persönliche Zugang („Persönlicher Link nötig“). Neu unter Einstellungen → App-Installation (nur wenn nicht richtig
  installiert): „📋 Meinen persönlichen Link kopieren“ – der Link geht nur in die Zwischenablage (nicht über den Server,
  nicht in den Chat), zum Einfügen in Chrome und Installieren dort. Hinweis „nicht weitergeben“.

## 0.20.0 – 2026-09-29 (DEV)

- KC-CLUB-INSTALLATION (neu): Die App erkennt, wie sie läuft – richtig installiert (Android-WebAPK, Start mit
  android-app://org.chromium.webapk…; iPhone Home-Bildschirm), nur als Chrome-Verknüpfung oder im Browser. Unsicher gilt nie
  als installiert. Einstellungen → „📲 App-Installation“ zeigt den Stand und eine Schritt-für-Schritt-Anleitung
  („Installieren“ statt „Verknüpfung erstellen“); bei Verknüpfung/Browser erscheint unter „Heute wichtig“ ein Hinweis.
  Im Browser gibt es „Jetzt als App installieren“ (Chrome-Angebot), installierte App wird über getInstalledRelatedApps erkannt.
  Gemessen (diagnose_start), wie die App gestartet wurde.
- KC-CLUB-TEILEN (neu): Fotos aus der Galerie über „Teilen → Köcheclub“ (Web Share Target, nur bei installierter App).
  Der Service Worker legt sie kurz ab (Speicher „kcclub-geteilt“), die App öffnet das Fotoalbum mit den Fotos im Formular.

## 0.19.2 – 2026-09-29 (DEV)

- KC-CLUB-KAMERA (Rückmeldung Hansi): nur noch zwei klare Wege – „🖼️ Aus der Galerie“ und „📷 Kamera“ (Fotoalbum,
  Chat-Anlagen, Protokoll). „📷 Kamera“ nimmt direkt in der App auf (auf Hansis Handy der einzige Weg, der ging –
  Messung: Galerie/Kamera-App gehen dort nach ~1 s ohne Foto wieder zu; Aufnahme in der App + Hochladen hat geklappt).
  Der doppelte Knopf „Kamera in der App“ entfällt.
- KC-CLUB-KACHELN (Rückmeldung Hansi): Kacheln lassen sich jetzt auch nach oben/unten schieben (▲ ▼ = eine Reihe, dazu ◀ ▶);
  ✕ zum Ausblenden sitzt oben rechts. Ausgeblendete Kacheln bleiben beim Anordnen blass an ihrem Platz (statt ans Ende),
  und unter den Kacheln steht „🙈 n ausgeblendete Kacheln – anzeigen“.

## 0.19.1 – 2026-09-29 (DEV)

- KC-CLUB-KAMERA (neu): Auf Hansis Handy kamen Fotos aus Galerie und Kamera nie an (kein einziger Upload beim Server) –
  vermutlich dieselbe Sperre wie bei WhatsApp: Chrome darf dort keine andere App (Galerie, Kamera) öffnen.
  Neu: „📸 Kamera in der App“ im Fotoalbum, im Protokoll und bei Anlagen im Chat – nimmt das Foto direkt in der App auf
  (Browser-Kamera, keine fremde App, kostenlos). Öffnet sich Galerie/Kamera nicht, erscheint automatisch ein Hinweis mit
  diesem Weg. Gemessen wird (Änderungsprotokoll „diagnose_datei“), ob sich die Auswahl geöffnet hat und ob Fotos ankamen.

## 0.19.0 – 2026-09-29 (DEV)

- KC-CLUB-KACHELN (neu, Wunsch aus dem Feedback): Startseite selbst anordnen. Eine Kachel **lange drücken** (0,6 s) →
  Bearbeiten: mit ◀ ▶ verschieben, mit ✕ ausblenden, 👁️ blendet wieder ein; „✅ Fertig“ oder Verlassen der Startseite
  speichert, „↺ Standard“ stellt alles zurück. Auch über Einstellungen → Darstellung → „🧩 Startseite anordnen“.
- Die Anordnung gehört zum Mitglied und wird in der Datenbank gespeichert (gilt auf allen Geräten), zusätzlich auf dem Handy
  zwischengespeichert. Neue Kacheln späterer Versionen erscheinen hinten.
- Datenbank: neue Tabelle kc_club_person_einstellung (Schlüssel + JSON, RLS an) – vorbereitet für weitere persönliche
  Einstellungen; der Server nimmt nur bekannte Schlüssel an (EINSTELLUNGEN) und prüft die Werte.

## 0.18.0 – 2026-09-29 (DEV)

- KC-CLUB-FEEDBACK (neu): Kachel „💭 Feedback“ im Register „Verein“. Fragebogen in 3 Schritten zum Antippen:
  1. Bewertung (gefällt, bedienfreundlich, übersichtlich, Schrift, Farben, Tempo, Nutzung, meistgenutzte Bereiche, Probleme),
  2. Wünsche für neue Funktionen (u. a. Knöpfe anordnen, Farben einstellen, größere Schrift, Monatskalender, Rezepte, Dokumente …)
     plus eigene Idee als Freitext,
  3. „Was möchtest du mir noch mitteilen?“ (Freitext), wahlweise „ohne meinen Namen auswerten“.
  Eine Antwort je Mitglied, jederzeit änderbar. Admin: „📊 Auswertung“ mit Balken je Frage und allen Freitexten.
- Fragebogen steht an einer Stelle im Server (FEEDBACK_FRAGEN, Kennung FEEDBACK_BOGEN); der Server nimmt nur bekannte Antworten an.
- Datenbank: neue Tabelle kc_club_feedback (Migration 20260929_kc_club_v18_feedback.sql, RLS an, nur über die Edge Function).

## 0.17.8 – 2026-09-29 (DEV)

- KC-CLUB-KONTAKT: Auf manchen Handys (Xiaomi + Chrome) lässt Android aus der App heraus keine andere App offen –
  WhatsApp/Maps schließen sofort wieder (Recherche: keine allgemeine Lösung, Galerie → WhatsApp geht, weil keine Web-App).
  Neuer sicherer Weg „📋 Nummer kopieren und in WhatsApp einfügen“ mit Schritt-für-Schritt-Hinweis (Nummer im Format +49…,
  alternativ Namen suchen). Scheitert auf einem Handy ein direkter Weg, wird automatisch der Kopier-Weg zum Standard;
  Handys, auf denen WhatsApp direkt aufgeht, bleiben unverändert.
- „Teilen“ wird nicht mehr als Standard gemerkt (Android meldete „geteilt“, obwohl WhatsApp nicht offen blieb); ein früher
  gemerktes „Teilen“ wird ignoriert.
- Route: Beim Öffnen der Karte wird die Adresse automatisch kopiert (Hinweis im Kartenfenster), zum Einfügen in Google Maps.

## 0.17.7 – 2026-09-29 (DEV)

- KC-CLUB-KONTAKT: Fehler behoben – wer einmal „Nachricht in der Club-App“ gewählt hatte, landete bei „WhatsApp“ danach immer
  im Club-Chat (Ausweichweg wurde als Standard gemerkt). Ausweichwege in der App (Club-Nachricht, Karte) werden nicht mehr gemerkt;
  ein früher gemerkter Ausweichweg wird ignoriert. Teilen-Versuche und Ausweichwege werden jetzt ebenfalls gemessen.

## 0.17.6 – 2026-09-29 (DEV)

- KC-CLUB-KONTAKT: Auf Hansis Handy funktioniert nur, was über eine Android-Auswahl läuft (Anrufen → Telefon/FritzFon).
  Neuer Weg über das Teilen-Menü: „📤 Über ‚Teilen‘ an WhatsApp“ (dort Chat wählen) und „📤 Adresse über ‚Teilen‘ an Google Maps“,
  auch als Knopf im Kartenfenster. Wird gemessen und bei Erfolg gemerkt.

## 0.17.5 – 2026-09-29 (DEV)

- KC-CLUB-KONTAKT: Messung ergab – auf manchen Android-Handys startet WhatsApp/der Browser kurz und schließt sofort wieder.
  Das zählte bisher als „geklappt“ und wurde gemerkt; jetzt gilt ein Weg erst als gelungen, wenn die andere App mindestens
  3 Sekunden vorne bleibt. Kommt man schneller zurück, erscheinen sofort die anderen Wege. Gemerkter Weg wurde zurückgesetzt.
- Neue sichere Wege, die in der App bleiben: „🗺️ Karte hier in der App zeigen“ (Google-Maps-Einbettung, kostenlos, ohne Schlüssel)
  und „💬 Stattdessen Nachricht in der Club-App“.

## 0.17.4 – 2026-09-28 (DEV)

- KC-CLUB-KONTAKT: Messung auf Hansis Handy (installierte App, Android 10, Chrome 154) zeigte: direkte Sprünge in
  WhatsApp/Maps (intent, whatsapp://, geo:) werden blockiert, das Browserfenster schließt sich sofort wieder.
  Neuer Weg „… hier öffnen/anzeigen“: WhatsApp-Seite bzw. Google-Maps-Route im App-Fenster selbst (bleibt stehen,
  „Zurück“ führt in die App). Wird gemerkt, wenn er gewählt wird.

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
