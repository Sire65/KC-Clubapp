# Änderungen

## Backup-Prüfdienst kc-db-backup-verify-v2 Version 11 – 2026-10-24 (KICC-F-108) · App unverändert
- Fund Tagesprüfung 24.10.: Die nächtliche Rücklese-Probe der Sicherung meldete 40 von 283 Tabellen als Fehler („part_failed“) – nicht wegen kaputter Daten, sondern weil der Prüfdienst beim Paket mit der größten Tabelle (kc_dp_workspace_revisions, ~18 MB verschlüsselt) „Memory limit exceeded“ bekam. Die Sicherung selbst war vollständig.
- Neu: Daten je Tabelle statt aller 40 auf einmal; verschlüsselte Daten stückweise (1 MB) lesen und ohne atob-Zwischenkopie entschlüsseln; bricht ein Paket trotzdem ab, wird es halbiert (bis zur einzelnen Tabelle). Prüfregeln, Prüfsummen, Antwortformat und Einträge unverändert; eine nicht prüfbare Tabelle bleibt Fehler.
- Geprüft am echten Satz vom 24.10.: große Tabelle 28 Zeilen, Prüfsumme gleich; Paket 40/40; vollständige Probe 283/283, 0 Fehler. Quelle jetzt im Repo (supabase/functions/kc-db-backup-verify-v2), Test tests/backup-verify-teile.test.mjs. Eingespielt per Supabase (Version 12 der Funktion).

## 2.640.0 – 2026-10-25 – Uhr: Wecker, Stoppuhr, Timer (KC-CLUB-UHR-WECKER, Wunschliste #38)
Auf der Uhr-Seite der Kopf-Rückseite oben die Wahl 🕰️ Uhr · ⏰ Wecker · ⏱️ Stoppuhr · ⏲️ Timer – jeweils im gewählten Uhren-Stil. Stoppuhr mit Runden und Zehnteln; Timer mit 1/3/5/10/15 Min. oder eigener Zeit, letzte 10 s rot; Wecker mit Uhrzeit und Text. Klingeln mit der gewählten Stundenuhr (Aus, +1 Min., 💤 5 Min. später). Ist die App zu, kommt ein Push (neue Tabelle kc_club_wecker, Minuten-Zeitplan erweitert). Startseite zeigt oben, was läuft.

## 2.639.0 – 2026-10-25 – Clubabend Live: Auswahl bei mehreren
KC-CLUB-CLUBABEND-AUSWAHL (Wunschliste #42, Hansi „Clubabend-Auswahl, wenn mehrere da sind, im Knopf Clubabend Live“): Gibt es mehr als einen passenden Clubabend, fragt „🍽️ Clubabend Live“ zuerst „Welcher Clubabend?“ – der heutige steht oben mit ⭐; danach öffnet sich das gewohnte Fenster für genau diesen Abend (auch die 20-Sekunden-Aktualisierung bleibt bei ihm). Gibt es nur einen, öffnet er sich sofort wie bisher. Mitglieder sehen weiter nur den Abend selbst, die Vorschau bis 60 Tage gibt es für die Clubleitung. Server 2.639.0 (prüft, dass nur ein erlaubter Abend geöffnet wird).

## 2.638.0 – 2026-10-25 – Inkognito: Fußzeile pulsiert mit
KC-CLUB-INKO-FUSS (Wunschliste #41, Hansi „unten die Fußzeile soll bei Inkognito auch pulsieren und Farbe ändern wie oben – damit ich es überall sehen kann“): Ist Inkognito an, bekommt die Fußzeile (Start, Termine, Nachrichten, Mitglieder, Mehr) denselben gelb-roten, pulsierenden Rahmen im Takt der Brille wie oben der Kopf und einen gelblichen Hauch – so sieht man es auf jeder Seite. Bei „weniger Bewegung“ langsamer; ohne Inkognito unverändert.

## 2.637.0 – 2026-10-25 – Weitere Empfänger mit ➕, WhatsApp an mehrere
KC-CLUB-WEITERE-EMPFAENGER (Wunschliste #40, Hansi „ein Pluszeichen in die kleine Zeile mit der Tastatur – alle Mitglieder, weitere wählen, die die Nachricht auch bekommen“ → Variante B): ➕ in der kleinen Zeile über der Tastatur öffnet die Mitgliederliste; über dem Schreibfeld steht „➕ auch an: …“. Beim Senden wird aus dem Chat eine Runde mit allen (bisherige + neue Empfänger), die Nachricht geht dorthin; der alte Verlauf bleibt privat. Bei einer neuen Nachricht kommen sie einfach zu den Empfängern dazu; feste Gruppen weiter über „Gruppe bearbeiten“. KC-CLUB-WA-MEHRERE: Ist der grüne WhatsApp-Knopf an und gibt es mehrere Empfänger, erscheint nach dem Senden „🟢 Per WhatsApp weitergeben“ mit einem Knopf je Person – WhatsApp öffnet sich direkt im richtigen Chat mit dem Text (WhatsApp erlaubt nur einen Empfänger auf einmal); ohne freigegebene Nummer ausgegraut.

## 2.636.0 – 2026-10-25 – Fotos und Dateien verschlüsselt senden
KC-CLUB-VN-ANLAGEN (Wunschliste #36, Teil 2, Hansi „Bilder und Anhänge auch verschlüsseln“): Ist im Chat das 🔒 an, werden ausgewählte Fotos und Dateien nicht mehr unverschlüsselt hochgeladen, sondern erst beim Senden auf dem Handy verschlüsselt (AES-GCM 256, je Datei ein eigener Zufallsschlüssel) – auf dem Server liegt nur unlesbarer Datensalat. Die Dateischlüssel reisen im verschlüsselten Text mit (eigener Schlüssel oder Schlüsselbund). Ohne Schlüssel sieht man „🔒 Verschlüsselte Anlage“, mit Schlüssel erscheinen Bild bzw. Datei normal. Einmal-Foto und 🔒 gehen nicht zusammen; vorher schon unverschlüsselt hochgeladene Anlagen meldet die App. Hilfe und Rundgang-Text angepasst.

## 2.635.0 – 2026-10-25 – Nachrichten und Bildunterschriften jederzeit ändern
KC-CLUB-BEARBEITEN-JEDERZEIT (Wunschliste #36, Teil 1, Hansi „jederzeit Bildunterschriften ändern wie bei WhatsApp – auch für normale Texte“): Eigene Nachrichten lassen sich ohne Zeitgrenze ändern (vorher 15 Minuten). Bilder und Dateien bekommen im Menü „✏️ Unterschrift hinzufügen“ bzw. „✏️ Unterschrift ändern“ – leer lassen entfernt die Unterschrift. Wie bisher steht „bearbeitet“ daran und es kommt keine neue Benachrichtigung; verschlüsselte 🔒-Texte werden nicht im Klartext bearbeitet. Server 2.635.0.

## 2.634.0 – 2026-10-25 – Kopfbild kompakter, Wünsche mit Anlagen
KC-CLUB-KOPF-KOMPAKT (Wunschliste #34, Hansi „das Kopfbild der Startseite mit den LEDs etwas zusammenschieben – zwischen den Bereichen ist Platz“): weniger Rand oben, kleinere Abstände Kopfzeile → Statusleiste (LEDs) → Infofeld, kleinerer Innenrand im Infofeld; der Status „🟢 verfügbar“ steht in einer Zeile (vorher Umbruch). In der erweiterten Ansicht rund 45 Pixel weniger Höhe; Platz für Wimpel/Lichterkette bleibt. KC-CLUB-WUNSCH-ANLAGEN: Bei „Wünsche an Claude“ lassen sich Fotos, Kamera-Bilder und Dateien (PDF usw.) anhängen – beim Eintragen, Ändern und beim Antworten auf Rückfragen; sie erscheinen als Vorschau am Wunsch. Nur Admin. Server 2.634.0, Datenbank: art „wunsch“ + Kopie für Claude.

## 2.633.0 – 2026-10-25 – Neues Kopf-Thema Seifenblasen
KC-CLUB-SEIFENBLASEN (Wunschliste #33, Wunsch Hansi): Neues Thema 🫧 Seifenblasen im Kopf der Startseite. Ein Kind läuft in die Mitte und pustet Seifenblasen, dann kommen von links und rechts drei weitere Kinder dazu. Die Blasen (klein, groß, schillernd mit Glanzlicht) steigen, platzen und hinterlassen Schlieren auf einer „Scheibe“ über dem Kopf (Tippen geht hindurch) – der Kopf wird immer verschmierter. Drei dicke Blasen wölben den Kopf jeweils kurz wie ein Fischauge (nicht bei „Animationen aus“/Sparmodus). Dann kommt der Fensterputzer mit Leiter, Eimer und gelbem Tuch und wischt die Scheibe an drei Stellen in Bahnen wieder klar; danach beginnt alles von vorn. Vorschau unter ⚙️ → ✨ Effekte. Nur Bild, nichts wird gespeichert oder gesendet.

## 2.632.0 – 2026-10-25 – Chat: größere Einklapp-Pfeile
KC-CLUB-KLAPP-PFEILE (Wunschliste #32, Wunsch Hansi „die Einklapp-Pfeile sind zu klein“): Im Chat sind die Pfeile an eingeklappten Tagen und Wochen jetzt runde Weinrot-Knöpfe mit weißem Pfeil (30 px statt Textgröße, grau). Aufgeklappte Tages- und Wochenköpfe zeigen denselben Knopf mit ▾ zum Zuklappen. Sonst unverändert.

## 2.631.0 – 2026-10-25 – Dienstwünsche: Ungespeichertes abfangen, Bestätigung ehrlich
KC-CLUB-DW-UNGESPEICHERT (Fund 25.10.: Karla hakte am 05.12. „Ganzer Tag gesperrt“ an, tippte aber nie „Tag speichern“ – die Bestätigung kam mit den alten Zeiten; Hansi: „Die App muss es abfangen, wenn man verlassen will, aber nicht alle Knöpfe gedrückt wurden“): Vor „✅ Fertig“, „‹ Zurück“ und der Zurück-Taste prüft die Club-App, ob in Twinkey ein Tag geändert, aber nicht gespeichert ist → „💾 Noch nicht gespeichert! – Zurück zum Speichern / Trotzdem verlassen“. Schon Gemerktes, das (z. B. ohne Netz) noch nicht beim Server ist, wird vorher nachgeschickt, auch beim Wegwischen der App. Twinkey selbst bleibt unverändert. KC-CLUB-DW-BESTAETIGUNG-EHRLICH (Wunschliste #37): „Bestätigung ist unterwegs“ nur noch, wenn der Server den Versand wirklich meldet – sonst „gespeichert, nur die Bestätigung ging nicht raus, bitte später noch einmal Fertig“. Datenkorrektur: Sperrtag 05.12. für Karla und Ruth eingetragen (alter Stand im Protokoll).

## 2.630.0 – 2026-10-25 – Vertretung: E-Mail an das vertretene Mitglied
KC-CLUB-VERTRETUNG-MAIL (Hansi 25.10.: „Ja, Ruth hat E-Mail“): Handelt ein Mitglied für ein anderes, bekommt das vertretene Mitglied nach jedem gespeicherten Schritt eine E-Mail, z. B. „Karla hat beim Termin „Clubabend“ für dich zugesagt“. Dienstwünsche höchstens eine Mail am Tag (Twinkey speichert bei jeder Änderung); dieselbe Meldung nie doppelt (erst Protokoll, dann senden). Läuft im Hintergrund, der Vertreter wartet nicht. Server 2.630.0.

## 2.629.0 – 2026-10-25 – Vertretung: für ein anderes Mitglied handeln
KC-CLUB-VERTRETUNG (Wunschliste #35, Wunsch Hansi „Karla darf für Ruth“): Der Admin legt in der Mitgliedskarte unter „🤝 Darf für … handeln“ fest, für wen ein Mitglied handeln darf (höchstens 5). Dieses Mitglied sieht in Termine, Abstimmungen und Dienstwünsche „Handeln für: 👤 Mich · 🤝 Ruth“ und unten die Leiste „🤝 Für Ruth – ✖ Beenden“. Erlaubt sind nur Termine zu-/absagen, Terminumfragen, Dienstwünsche (Twinkey) und Abstimmungen (nicht geheime). Nachrichten, Daten und Rechte nie. Der Server prüft die Erlaubnis bei jeder Anfrage neu, nutzt Rechte und Sperre des Vertretenen und schreibt jeden Schritt bei beiden ins Protokoll. Der Modus gilt nur bis zum Neustart der App und nie im Notbetrieb. Server 2.629.0.

## 2.628.0 – 2026-10-24 – Bühne: klarer, Ansagen in Sekunden
Wunschliste #31: Twinkey sagt beim Endspurt „noch 10 Sekunden“ (gezählt werden Sekunden, keine Wiederholungen), danach „noch 3 Sekunden – zwei – eins“. Beim Training liegt die Erklärung nicht mehr auf den Knöpfen Pause/Weiter. Die Auswahl ist in Schritte gegliedert (① Wie? ② Wie lange?), mit einem großen Start-Knopf; Club-Song und Nur Musik klein darunter; die schwebenden Hilfe-Knöpfe verdecken nichts mehr (KC-CLUB-BUEHNE-ORDNUNG).

## 2.627.0 – 2026-10-24 – Termin ändern: Benachrichtigung aus
Beim Ändern eines Termins ist „Mitglieder benachrichtigen“ jetzt aus – wer nur einen Tippfehler korrigiert, verschickt keine neue Einladung mehr. Bei wichtigen Änderungen (Tag, Uhrzeit, Ort) den Haken setzen. Beim Neuanlegen bleibt alles wie bisher (KC-CLUB-AENDERN-STILL).

## 2.626.0 – 2026-10-24 – Zeitumstellung auch per E-Mail
Die automatische Meldung zur Zeitumstellung (Samstag vorher, 18 Uhr) geht an alle Mitglieder: mit App als Push wie bisher, ohne App jetzt als E-Mail mit demselben Text. Wie jeder Sammelversand nur Zugang „Mitglied“ (KC-CLUB-ZEITUMSTELLUNG-MAIL) · Server 2.626.0.

## 2.625.0 – 2026-10-24 – 🌹 Rose aus der Schießbude (KC-CLUB-ROSE) · Server 2.625.0
- Wunsch Hansi: Wer in der Mitglieder-Karte (nur Admin) das Häkchen „🌹 Rose aus der Schießbude (einmalig)“ hat, bekommt nach 3 Minuten auf der Startseite (sichtbar, kein Fenster offen, nichts getippt) einmalig eine große rote langstielige Baccara-Rose mit Schild „Nur für dich“ und Vornamen. Zur Kirmes (Sim-Jü mit Schießbude sichtbar) wächst sie aus der Schießbude; sonst kommt sie mit „Ein Gruß aus der Schießbude – habe ich für dich geschossen 🎯“. Sparmodus/weniger Bewegung: ohne Flug.
- Server: Aktionen rose_setzen / rose_liste (nur Admin), rose_erhalten (nur für sich, nie zweimal); init leitet „rose“ aus den schon geladenen Einstellungen ab (keine zusätzliche Abfrage); Merker nicht über einstellung_setzen setzbar.
- Tests: tests/rose.test.mjs, tools/rose/rose-browser.mjs. Auf Wunsch Hansi sofort eingespielt.

## 2.624.0 – 2026-10-24 – 🔵 Geplante Lastspitzen ohne Warnkasten · 📶 Verbindungstest: Netz und Server getrennt (KC-TRAFFIC-GEPLANT-STILL, KC-CLUB-VB-AUFTEILUNG)
- KC-TRAFFIC-GEPLANT-STILL (Fund Hansi 24.10., 3:03 Uhr: gelber Kasten „ungewöhnlich hohe Datenbanklast … Ursache (geplant): Datensicherung“): Erkennt der Last-Wächter eine geplante Spitze (geplant=true – Datensicherung, neue Version, Notpaket, Rundnachricht), steht auf der Startseite kein Warnkasten mehr; im Admin-Bereich „🔵 Geplante Last – kein Grund zur Sorge“. Kritische Last zeigt weiter immer. kc-traffic-guard-ui.js?v=4.
- KC-CLUB-VB-AUFTEILUNG (Wunsch Hansi „immer so unterschiedlich“ → „Ja“): Im Verbindungstest steht unter jeder Antwortzeit „Netz … · Server …“; der Server-Anteil stammt jetzt aus derselben Messung wie die beste Antwortzeit und wird im Geräte-Verlauf gemerkt.
- Nur App. Auf Wunsch Hansi sofort eingespielt.

## 2.623.0 – 2026-10-24 – 🧾 Weniger Server-Protokoll, Push für das neue Apple-Format vorbereitet (KC-CLUB-LOG-SPARSAM, KC-CLUB-PUSH-DEKLARATIV)
Anbieter-Check 24.10.2026 (Wunsch Hansi, „sparsam“): Supabase berechnet ab Anfang 2027 auch das Schreiben ins Protokoll.
- Der Club-Server schreibt nur noch Ausreißer ins Protokoll: Messzeile erst ab 120 statt 15 Datenbank-Abfragen, Tempo-Zeile erst ab 5 statt 1,5 Sekunden. Fehler werden weiter protokolliert.
- Der Service Worker versteht zusätzlich das neue Apple-Push-Format (Declarative Web Push, iPhone ab iOS 18.4).
- Communicator (kc-communication-dispatch v21, am 24.10. direkt hochgeladen; Kopie unter docs/archiv/communicator/): iPhones der Club-App bekommen das neue Format mit „mutable“ – der Service Worker zeigt die Mitteilung wie bisher (mit Quittungen), schläft er, zeigt das iPhone sie selbst. Titel/Text/Link stehen zusätzlich wie bisher oben, damit ältere Geräte und alte App-Stände nichts merken. Android/PC unverändert.

## 2.622.0 – 2026-10-24 – 🚧 Baustelle: nach der Sprengung gesprungenes Handyglas (KC-CLUB-BAUSTELLE-GLASBRUCH)
Wunsch Hansi: „Nach der Sprengung, als wenn der ganze Handy-Bildschirm kaputt ist – das ganze Glas gesprungen, wie wenn ein Handy runtergefallen ist.“
- Mit dem Knall legt sich über den ganzen Bildschirm ein Spinnennetz aus Sprüngen („Spider-App“): Risse vom Aufschlagpunkt nach außen, Ringe dazwischen, kleine Splitter in der Mitte. Die Sprünge wachsen blitzschnell, bleiben gut 4 Sekunden und verblassen dann – kurz bevor der Kopf zurückkommt.
- Nur ein Bild: Tippen geht hindurch, nichts ist wirklich kaputt.

## 2.621.0 – 2026-10-24 – 🥠 Nachhol-Keks (KC-CLUB-GLUECKSKEKS-NACHHOLEN)
Wunsch Hansi: Wer schon über dem 10. Tag war, als es den Glückskeks noch nicht gab (z. B. Klaus, Willfried), bekommt seinen ersten Keks beim nächsten Öffnen an einem neuen Tag – statt erst am 20. Tag. Kommt der nächste reguläre Keks ohnehin in weniger als 3 Tagen, wartet er auf diesen (kein Doppel-Keks).

## 2.620.0 – 2026-10-24 – 🎡 Sim-Jü: Feuerwerk nur am Montag, Schießbude ruhiger (KC-CLUB-SIMJUE-FEUERWERK-MONTAG)
Wunsch Hansi: „Bei Sim-Jü außer Montag kein Feuerwerk, und die Figuren in der Schießbude langsamer laufen lassen.“
- In der Sim-Jü-Woche gibt es das kleine Feuerwerk am Ende jedes Durchlaufs nur noch am Montag; dazu wie gehabt das große Feuerwerk Montag 21:00–21:20 Uhr. Außerhalb der Sim-Jü-Woche (Thema oder Vorschau) bleibt es wie bisher.
- Enten und Sterne in der Schießbude laufen weniger als halb so schnell, ein Treffer alle 4 statt 2,6 Sekunden.

## 2.619.0 – 2026-10-24 – 🎡 Sim-Jü im Info-Feld ausschalten (KC-CLUB-SIMJUE-SCHALTER)
Wunsch Hansi: „Im Info-Feld einen Schalter Sim-Jü ausschalten – wem es nicht gefällt, kann es dann ausmachen.“
- Während Sim-Jü steht im Info-Feld „🎡 Sim-Jü im Kopf der Startseite – Gefällt dir nicht? Hier kannst du es ausschalten“ mit dem Knopf „🚫 Sim-Jü aus“.
- Ausgeschaltet zeigt der Kopf wieder die eigene Einstellung; im Info-Feld steht dann „🎡 Einschalten“. Gilt je Gerät und nur für dieses Jahr – beim nächsten Sim-Jü ist es wieder an.

## 2.618.0 – 2026-10-24 – 🎡 Sim-Jü: großes Herz, Schießbude, Lauflichter, Feuerwerk am Montag um 21 Uhr (KC-CLUB-SIMJUE-SCHIESSBUDE, KC-CLUB-SIMJUE-LAUFLICHT, KC-CLUB-SIMJUE-FEUERWERK)
Wunsch Hansi: „Das Sim-Jü-Herz größer und mittig, dass man den Namen lesen kann, links noch eine Schießbude, und am Montag um 21 Uhr Feuerwerk gleichzeitig mit dem echten Feuerwerk.“
- Das Lebkuchenherz ist fast doppelt so groß und hängt in der Mitte unten im Bodenstreifen – der Vorname steht groß darauf und liegt nicht mehr unter dem Infofeld.
- Links eine Schießbude: rot-weiß gestreiftes Dach, Schild „🎯 SCHIESSBUDE“, hinten laufen Enten und Sterne, vorn liegt ein Gewehr – alle paar Sekunden ein Treffer mit Mündungsblitz und „Treffer!“.
- Lauflichter am Riesenrad (Wunsch Hansi): ein bunter Lichterpulk läuft rund um den Kranz (Farbe wechselt je Runde), auf den Speichen laufen Lichter nach außen, an den Stützen läuft ein Licht hoch.
- Am Sim-Jü-Montag (2026: 26.10.) von 21:00 bis 21:20 Uhr großes Feuerwerk in der Szene, zur selben Zeit wie das echte: dunkler Himmel, ununterbrochen Raketen, größere Sterne, Goldregen. In dieser Zeit wird nicht ausgeblendet und das Bild bleibt nicht stehen.

## 2.617.0 – 2026-10-24 – 🎂 Geburtstagsgrüße in meinem Namen · 📜 Spruch-Archiv · 🥠 Glückskeks · 🚧 Baustelle · 🎡 Sim-Jü für alle · 📣 Info-Band läuft weiter · 🕵️ Geheimagent auch im Chat (KC-CLUB-GEBURTSTAG-GRUSS, KC-CLUB-SPRUCH-ARCHIV, KC-CLUB-GLUECKSKEKS, KC-CLUB-BAUSTELLE, KC-CLUB-SIMJUE-FUER-ALLE, KC-CLUB-INFOBAND-WEITER, KC-CLUB-GEHEIMAGENT-SCHLANGE)
Wunsch Hansi: „30 verschiedene Geburtstagsgrüße – 2 Tage vorher klicke ich an, welchen er bekommen soll; in meinem Namen; vergesse ich es, automatisch einen passenden; kurz nach 24 Uhr, damit ich immer der Erste bin.“
- Büro → Geburtstage & Jubiläen → „🎂 Meine Geburtstagsgrüße“ (nur Admin): ein/aus, die Geburtstage der nächsten 60 Tage mit Stand (ausgewählt, automatisch, verschickt).
- Antippen zeigt alle 30 Grüße fertig mit Namen und passender Form (Lieber/Liebe, er/sie); Lieber/Liebe lässt sich dort festlegen (unbekannt → „Hallo“).
- Kurz nach 0 Uhr (00:04) geht der Gruß als normale Nachricht von Hansi ins Zweiergespräch – Push/Mail nach den Einstellungen des Empfängers (ohne App per Mail, in der Ruhezeit ohne Ton). Fällt der Lauf aus, holen die nächsten Stundenläufe ihn nach.
- Nichts ausgewählt → automatisch ein passender Gruß: nie einer, den die Person schon bekam, und nicht die zuletzt verschickten.
- 2 Tage vorher ab 9 Uhr ein Push „🎂 … hat übermorgen Geburtstag – Gruß auswählen“ (nur wenn noch keiner gewählt ist), Antippen öffnet die Auswahl.
- Sparsam: der Lauf prüft nur zu 7 Stundenläufen am Tag (1 Abfrage, wenn ausgeschaltet).

📜 Spruch-Archiv (KC-CLUB-SPRUCH-ARCHIV, Wunsch Hansi „Spruch-Archiv nur für mich, Ordner mit Registern für die Anlässe, schon gefüllt“):
- Archiv → 👤 Mein Ordner → Ordner „📜 Sprüche“ (nur Admin). 16 Register mit 163 Sprüchen und Emojis: Geburtstag (mit den 30 Geburtstagsgrüßen), Runder Geburtstag (12 zum 80., dazu 50/60/70/75/90), Jubiläum, Geburt eines Kindes, Taufe & Kommunion, Namenstag, Hochzeit, Hochzeitstag, Trauer, Gute Besserung, Ruhestand, Dank & Anerkennung, Feste & Feiertage, Willkommen, Küchen-Sprüche.
- Je Spruch: 📋 Kopieren, 💬 Senden (Mitglied wählen – [Name] wird zum Vornamen, Text bleibt vor dem Senden änderbar), ✏️ Abwandeln. Eigene Sprüche anlegen, ändern, löschen; Vorlagen ausblenden (🙈) und wieder zeigen. Suche über alle Register.
- Senden aus dem Archiv setzt „Liebe/r“ passend ein (Lieber/Liebe aus der Anrede-Liste, auch „Rentner/in“); für alle Mitglieder ist die Anrede jetzt hinterlegt (Wunsch Hansi). Die Erinnerung 2 Tage vorher warnt, falls sie bei einem neuen Mitglied fehlt.
- Runde Geburtstage (50, 60, 70, 75, 80 …) bekommen in den Geburtstagsgrüßen oben 8 eigene Grüße mit Alter („Lieber Klaus, 80 Jahre …“); automatisch wird dann einer davon gewählt. Übersicht zeigt „wird 80 🎉“.

Fund Hansi: „Info-Band läuft nicht weiter“ – es hielt (seit 2.337.0 KC-CLUB-AKKU-2) wie die Daueranimationen nach 45 s ohne Antippen an.
- Das Info-Band blättert jetzt weiter, auch wenn niemand das Display berührt (es wechselt nur alle 6 s den Text). Angehalten wird es nur noch bei knappem Akku (unter 30 % und nicht am Laden), beim Antippen (9 s) und wenn die App im Hintergrund ist.
- Laufende Rahmen und atmende Lämpchen halten weiterhin nach 45 s an.

Fund Hansi: „Erste Nachricht an Klaus verschlüsselt geschickt – keinen Geheimagent gesehen.“ Seit 2.603.0 (KC-CLUB-SENDE-SCHLANGE) gehen Texte in einem bestehenden Chat über die Sende-Schlange; dort drehte sich nur der 🔑, der Agent fehlte.
- Verschlüsselte Nachrichten im bestehenden Chat: erst dreht sich der 🔑, dann läuft der 🕵️ Geheimagent – wie bei einer neuen Unterhaltung. Bei 🏎️ Express bleibt es beim Rennwagen.
- Beim Empfänger war der Agent nie betroffen.
- Wunsch Hansi „in den Voreinstellungen kann man ihn nicht sehen“: unter ⚙️ → „✨ Effekte“ → „✉️ Effekt beim Senden“ gibt es jetzt „🕵️ Vorschau „verschlüsselt““ (neben „🚨 Vorschau „wichtig““), dazu ein Satz im Hinweis. Fester Bote bleibt er nicht – er gehört zu 🔒.

🥠 Glückskeks (KC-CLUB-GLUECKSKEKS, Wunsch Hansi „bei der 10., 20., 25., 30. … Anmeldung eine Nachricht – Hey Klaus, das ist heute deine x. Anmeldung … Such dir einen Glückskeks aus. Liebe Grüße Hansi“):
- Gezählt werden Tage mit der App, nicht jede Öffnung (Wunsch Hansi „Tage zählen“ – sonst bekämen Vielnutzer zu schnell Kekse). Am 10., 20., 25., 30., 40., 50., 75., 100., 150., 200., 250., 300. und 365. Tag (danach jedes volle Jahr) erscheint die Nachricht von Hansi („Heute ist schon dein 20. Tag mit der Köcheclub-App …“) mit 3 Glückskeksen. Der Zähler startet mit den Tagen seit Beginn der Aufzeichnung (7.10.).
- Antippen: der Keks wackelt, zerspringt in zwei Hälften (Krümel fliegen), und ein weißer Papierstreifen mit Spruch und Glückszahlen kommt heraus. 40 Sprüche, ohne Wiederholung, bis alle einmal dran waren.
- Zur selben Anmeldung keine Fee. Ohne Bewegung (Einstellung/Sparmodus) erscheint der Streifen sofort.

🚧 Thema Baustelle (KC-CLUB-BAUSTELLE, Wunsch Hansi): wählbar wie die anderen Themen, Vorschau unter ⚙️ → ✨ Effekte → 🚧 Baustelle.
- Rechts ein Erdhaufen; ein Radlader in Baustellengelb schaufelt ihn in vier Ladungen auf einen Kipplaster (Haufen schrumpft, Ladefläche füllt sich), wendet dabei jedes Mal. Aus seinem Auspuff steigen Rauchwolken, die zum Vornamen werden.
- Zwischendurch laufen Bauarbeiter mit gelben Helmen durch (mit Brett, Schubkarre, winkend). Der Laster fährt voll davon, der Radlader weg.
- Das Sprengkommando (rote Helme, Kiste TNT) verteilt überall Dynamit, Schild „Achtung Sprengung“, Kabel zum Zündkasten mit T-Griff, 3 – 2 – 1 (Piepen) – Auslöser: Blitz, und der ganze Kopf zerfällt in Stücke und fliegt davon (Feuerbälle, Wackeln). Ton bei ⚙️ Ton an und außerhalb der Ruhezeit: Rumms und klirrendes Glas.
- Nach 6,5 Sekunden ist der Kopf wieder da und alles beginnt von vorn (ein Lauf ≈ 77 s).

🎡 Sim-Jü für alle (KC-CLUB-SIMJUE-FUER-ALLE, Wunsch Hansi): von Samstag bis einschließlich Dienstag der Sim-Jü-Woche (2026: 24.–27.10.) zeigt jeder Kopf die Sim-Jü-Szene mit Riesenrad, Lebkuchenherz und Feuerwerk – egal welche Jahreszeit oder welches Thema eingestellt ist. Mittwoch um 0 Uhr stellt er sich von selbst zurück; so jedes Jahr.
- Auch bei allen, die „🍂 Jahreszeiten im Kopf“ oder die Animationen ausgeschaltet haben (Wunsch Hansi: „viele wissen gar nicht, dass man es einschalten kann“). Nur der Sparmodus (Akku) hält die Szene weiter an. Nach Sim-Jü gilt wieder die eigene Einstellung.

## 2.616.0 – 2026-10-24 – 🕐 Testlisten mit Tagesangabe · 🕰️ Stundenuhr still nach eigener Ruhezeit (KC-CLUB-TESTLISTE-HEUTE, KC-CLUB-KUCKUCK-RUHEZEIT)
Fund Hansi: In „Letzte Tests auf diesem Gerät“ sah der Test von 01:01 Uhr wie ein Datum (1. Januar) aus – Tests von heute zeigten nur die Uhrzeit.
- „Verbindung testen“ und „Internet-Tiefentest“: Zeit immer mit Tagesangabe – „heute 01:01“, „gestern 19:32“, sonst „23.10. 08:42“.
- Die übrige Zeitanzeige der App (Chat usw.) bleibt unverändert.

**🕰️ Uhr zur vollen Stunde: Stille nach der eigenen Ruhezeit (KC-CLUB-KUCKUCK-RUHEZEIT)** – Frage Hansi „Uhr erschien um 1 Uhr ohne Ton – macht der nachts keine Töne?“
- Bisher war der Kuckuck (und Big Ben & Co.) fest von 22 bis 7 Uhr stumm. Jetzt gilt die eigene Ruhezeit unter „Nicht stören“: darin zeigt sich die Uhr ohne Ton; ohne Ruhezeit ruft sie rund um die Uhr. Probehören (▶) klingt weiter immer.
- Hilfe („Der Kuckuck ruft, aber ich höre nichts“, „Warum höre ich den Kuckuck nicht?“, „Nachts nichts stören“) sagt das.

## 2.615.0 – 2026-10-23 – 📊 Nachrichten-Statistik öffnet sofort statt nach Minuten (KC-CLUB-STATISTIK-SCHNELL)
- Fehler (Fund Hansi „dauert sehr lange, Meldung: hat gehangen“): Bei ~1.900 Einträgen in 30 Tagen war die App 13 s blockiert – der Server antwortete nach ~1,3 s, die Zeit ging beim Zeichnen verloren: für jeden Eintrag × jeden Tag bzw. × jede Stunde entstand ein neuer Datums-Umrechner (~160.000 Stück).
- Jetzt Tag und Stunde je Eintrag einmal berechnen, dann nur zählen; `berlinStunde` merkt sich seinen Umrechner. Browser-Vergleich mit 1.900 Einträgen: 42 s → 0,05 s (Handy-Tempo 264 s → 0,17 s), Anzeige Zeichen für Zeichen gleich. Nur App. Auf Wunsch Hansi sofort eingespielt.

## 2.614.0 – 2026-10-23 – 🧑‍🍳 „An alle“ ohne Aushilfen (KC-CLUB-SAMMELVERSAND-OHNE-AUSHILFEN)
Wunsch Hansi („Leon und Ruth sollen keine E-Mails usw. bekommen – immer wenn man Schnellnachricht an alle anklickt, bekommen die Aushilfen auch Infos“). Beide haben den Zugang „Aushilfe“; bisher fielen bei „👥 Alle“ nur Personen mit 📵 heraus.
- Neue Regel: Alles, was **an alle** geht, erreicht nur Personen mit Zugang „Mitglied“ (Admin immer). Aushilfen und Gäste fallen heraus – im Server (zentrale Liste `sammelEmpfaenger`, Zugang aus `kc_club_rollen`) und in der App.
- Betroffen: Kommunikationszentrale „👥 Alle“/„🟢 Online“, Neue Nachricht „Alle“/„Online“, Terminanfrage und Mitfragen „Alle“, Abstimmung „Alle an“; Server: Nachrichten/Startnachrichten mit „alle“, neue/geänderte/abgesagte Termine und Terminreihen, Erinnerungen und Nachfragen zu Terminen, Terminumfragen, Abstimmungen und Ergebnisse, Sitzungseinladung, Hilfe-Aufrufe (auch „online“ und ❗ wichtig), Hilfe-Angebote, Pinnwand „für alle“, Geburtstags-Hinweise, Clubjahr, Freud-und-Leid-Mitteilung, Adressänderung „an alle“.
- Unverändert: einzeln angetippt, über ihr Amt oder eine Gruppe bekommen Aushilfen die Nachricht weiter; ebenso Dienstplan, Dienst-Tausch, Dienstwunsch-Erinnerung und der 🚨 SOS-Notfall. Sehen können sie in der App alles wie bisher.
- Zugangsliste nicht lesbar → letzter bekannter Stand; gab es noch keinen, geht der Sammelversand an niemanden (unbekannt ≠ leer).
- Zentrale zeigt „An: alle n Mitglieder (ohne Aushilfen)“; Rollen-Fenster und Hilfe nennen die Regel.
- Test: Vertragstest-Block 2.614.0. Rückweg: App/Server 2.613.0.

## 2.613.0 – 2026-10-23 – 🎤 Club-Song: neuer Text an vier Stellen (KC-CLUB-SONG)
Wunsch Hansi („Der Text gefällt mir an 2–3 Stellen noch nicht … ändere den Text mit den Änderungen“). Strophe 2: „es duftete nach Grünkohl, der **Eierpunsch**, der lief“ (statt „und der Glühwein“) und „Am **Sonntag** in Rot“ (statt Freitag). Refrain: „wir rühren zusammen, **der Kessel bleibt heiß**!“ (statt „das ist unser Preis“). Bridge: „in jedem Rezept und bei jeder **Schlemmerei**“ (statt „in jeder Feierei“). Silbenzahl jeder Zeile = Töne der Melodie (geprüft), Melodie unverändert. Eingespielt zum 20-Uhr-Termin. Rückweg: App 2.612.0.

## 2.612.0 – 2026-10-23 – 🕙 Termin aus Nachricht: Uhrzeit nicht mehr verdreht (KC-CLUB-TERMIN-UHRZEIT)
Fund Hansi: „…haben wir uns auf 10 Uhr verständigt. Nachmittags wird es schon früh dunkel“ wurde als 22:00 Uhr übernommen. Ursache: Ein „abends/nachmittags/mittags“ irgendwo in der Nachricht hat jede Uhrzeit von 1 bis 11 auf den Abend geschoben.
- Tageszeit-Wörter zählen nur noch direkt bei der Uhrzeit, nie über Komma oder Satzende hinweg („10 Uhr abends“, „abends um 7“, „morgens um 10“).
- Eine ausdrücklich genannte Uhrzeit (10 Uhr, 10:00) bleibt, wie sie ist. Nur 1–5 Uhr wird weiter als Nachmittag vermutet.
- Bleibt es unklar (z. B. „um 7“, „halb 8“ oder ein „nachmittags“ an anderer Stelle), zeigt „📅 Als Termin übernehmen“ beide Möglichkeiten zur Wahl („10:00 Uhr“ / „22:00 Uhr“); eingetragen wird erst nach der Wahl oder eigener Eingabe. Der Knopf an der Nachricht zeigt „10:00 oder 22:00 Uhr“.
- Vertragstest mit Hansis Nachricht und Gegenproben.

## 2.611.0 – 2026-10-23 – Start: Anfrage und Anzeige gleichzeitig
Beim Öffnen schickt die App die Anfrage an den Server jetzt zuerst los und zeichnet währenddessen den gespeicherten Stand – vorher lief beides nacheinander (KC-CLUB-START-GLEICHZEITIG). Neu gemessen: wann die Startseite zu sehen ist (KC-CLUB-START-SICHTBAR).

## 2.610.0 – 2026-10-23 – 🚂 Kachel-Zug etwas schneller (KC-CLUB-KACHEL-ZUG-TEMPO)
Wunsch Hansi („Der Effekt Zug ist jetzt gut, aber er dauert zu lange, bis alle Karten an ihrem Platz liegen – etwas schneller fahren lassen“): jede Kachel 2,4 s statt 3 s unterwegs, dichter hintereinander (höchstens 170 ms Abstand, alle Abfahrten zusammen höchstens 2,6 s). Bei 16 Kacheln ~5 s statt ~7 s bis alle liegen; gleiche Bahn, gleicher Ablauf. Eingespielt zum 12-Uhr-Termin. Rückweg: App 2.609.0.

## 2.609.0 – 2026-10-23 – ✍️ Abstimmung mit freier Antwort + Vorlage Weihnachtsessen (KC-CLUB-ABSTIMMUNG-FREITEXT)
Wunsch Hansi („welche Allergie oder Unverträglichkeiten“ und „beim Restaurant-Vorschlag Platz lassen für einen Namen“).
- Abstimmung mit mehreren Fragen: neue Frage-Art „✍️ Freie Antwort – zum Eintippen statt Ankreuzen“ (höchstens 100 Zeichen, ändern oder leeren bis zum Ende). Nur bei offenen Abstimmungen – bei geheimen würde der Text verraten, wer schreibt.
- Ergebnis: die verschiedenen Antworten mit Namen (gleiche Texte zusammengezählt), auch in der Ergebnis-Mail. Ankreuzbogen: Schreiblinien.
- Vorlage „🍽️ Weihnachtsessen – wohin gehen wir?“: bei „Anderer Vorschlag“ fragt die App nach dem Namen des Restaurants; bei „Allergie oder Unverträglichkeit“ folgt die Liste (Gluten, Laktose/Milch, Ei, Nüsse, Erdnüsse, Fisch, Krebstiere, Soja, Sellerie, Senf, Sesam, Etwas anderes) und bei „Etwas anderes“ ein Feld zum Eintragen. Verschickt wird erst mit „Abstimmung starten“.
- Test: Vertragstest-Block 2.609.0. Rückweg: App/Server 2.608.0.

## 2.608.0 – 2026-10-23 – Nachricht als Termin übernehmen
Die App erkennt Tag, Uhrzeit, Ort und Titel in Nachrichten (viele Schreibweisen). Knopf „📅 … eintragen“ direkt an der Nachricht, „📅 Als Termin übernehmen“ im Nachrichten-Menü und 📅 in der kleinen Zeile am Schreibfeld. Ziel: eigener Kalender (mit Erinnerung, auf Wunsch auch Handy-Kalender) oder – Clubleitung – Clubtermin über das gewohnte Formular (KC-CLUB-NACHRICHT-TERMIN).

## 2.607.0 – 2026-10-23 – 🔐 Sicherheit: Zugangslinks aufräumen, Geheimnis-Wächter, Durchsicht der Datenbank-Funktionen (KC-CLUB-ZUGANG-AUFRAEUMEN, KC-CLUB-GEHEIMNIS-WAECHTER)
Wunsch Hansi („baue deine 4, 5, 6“ nach der Frage zur PHP-Lücke – Club-App nutzt kein PHP, nicht betroffen).
- 🔑 Sicherheits-Check (nur Admin): neue Karte „Zugangslinks“ – oben stehen 💤 seit über 21 Tagen nie benutzte Links, 🕰️ über 60 Tage nicht in der App, 🚪 Links von Personen, die kein aktives Mitglied mehr sind. Je Person „⛔ Link abschalten“ (sofort ungültig, auch auf angemeldeten Geräten) oder „🔗 Neuer Link“. Die App schaltet nie von selbst ab; eigener Zugang nicht abschaltbar.
- 🛡️ Geheimnis-Wächter: neuer Test vor jedem Einspielen durchsucht alle Dateien nach Passwörtern und geheimen Schlüsseln (Supabase-Geheimschlüssel, service_role-JWT, private Schlüssel, GitHub-/Google-/AWS-/Stripe-Token, Datenbank-Adressen mit Passwort …); erlaubt sind nur die öffentlichen anon-Schlüssel. Fund = roter Test = kein Einspielen.
- 🧰 Durchsicht der 42 Datenbank-Funktionen mit Außenzugang: docs/SICHERHEIT_DB_FUNKTIONEN.md (Empfehlungen, noch nichts geändert).
- Test: tests/zugang-pruefen.test.mjs, tests/geheimnis-waechter.test.mjs, Vertragstest-Block 2.607.0. Rückweg: App/Server 2.606.0.

## 2.606.0 – 2026-10-23 – 🔁 Dienst-Tausch-Börse – nur Admin zum Testen (KC-CLUB-DIENST-TAUSCH)
Wunsch Hansi („3 hört sich gut an“ – Dienst-Tausch-Börse). Noch nicht freigegeben: bis Hansi freigibt, sieht es nur der Admin (🔒 Test).
- „Mein Dienst“ → 🔁 Tauschbörse (auch Push-Link #diensttausch, Sprung-Knopf „Dienst-Tausch-Börse“): eigene kommende Dienste mit „🔁 Kann ich nicht – anbieten“ (freiwillig mit Text), alle bekommen Bescheid.
- Andere sehen „🙋 Gesucht – kannst du übernehmen?“ und tippen „🙋 Ich übernehme“ (nicht bei eigenen Diensten, nicht wenn man zu der Zeit selbst Dienst hat; wer zuerst kommt). „↩️ Doch nicht“ geht bis zur Bestätigung.
- Planer (Admin bzw. Amt „Dienstplaner“): ✅ Bestätigen / ✖ Ablehnen (mit Grund), offene Angebote auch „🙋 Eintragen“ für ein Mitglied (z. B. nach Anruf). Jeder Schritt mit Push an die Beteiligten.
- Anbieten bis 2 Std. vor Beginn; danach direkt den Planer anrufen.
- Erst die Bestätigung zählt: Mein Dienst (🔁 übernommen), Dienst-Anmeldung, Erinnerungen und „Wer ist heute da“ rechnen die Übergabe ein. Der Dienstplan selbst (kc_dp_plan_published) bleibt unverändert – Übernahme in DP3: docs/CODEX_AUFTRAG_DIENST_TAUSCH.md.
- 🧪 Probe-Angebot (nur Admin, ohne Dienstplan) zum Testen; Benachrichtigungen gehen bis zur Freigabe bzw. bei Proben nur an Admins.
- Datenbank: supabase/migrations/20261023_kc_club_v2606_dienst_tausch.sql (Tabelle kc_club_dienst_tausch, RLS, nur service_role, Spiegel). Ohne Tabelle läuft alles wie bisher.
- Test: tests/dienst-tausch.test.mjs, Vertragstest-Block 2.606.0, Typprüfung ohne neue Meldungen. Rückweg: App 2.605.0, Server 2.604.0.

## 2.605.0 – 2026-10-23 – Push-Ruhe beim schnellen Schreiben
Kommen viele Push-Mitteilungen schnell hintereinander, lädt die offene App nur einmal neu – bei offenem Chat nur den Chat (KC-CLUB-PUSH-RUHE).

## 2.604.0 – 2026-10-23 – Sofort-Senden (Korrektur Versionsnotiz)
Wie 2.603.0 (Sende-Warteschlange); 2.603.0 wurde wegen eines roten Tests (Versionsnotiz) nicht eingespielt – hier korrigiert.

## 2.603.0 – 2026-10-23 – Nachrichten: Sofort-Senden mit Warteschlange
➤ legt die Nachricht in eine Warteschlange: sie steht sofort im Chat (⏳), das Schreibfeld ist sofort frei – gleich weiterschreiben. Abgearbeitet wird der Reihe nach, 🏎️ Express überholt die wartenden. Bei Netz-Wacklern bis zu 3 neue Versuche; der Server speichert jede Nachricht trotzdem nur einmal (Kennung). Klappt es nicht: ⚠️ mit 🔄 Nochmal / 🗑️ Löschen. Der Server antwortet nach dem Speichern sofort, Push/Mail laufen im Hintergrund (Notfall, Express, ❗ wichtig, @Erwähnung wie bisher). (KC-CLUB-SENDE-SCHLANGE)

## 2.602.0 – 2026-10-23 – Start schneller, Schritt 2: Kern in einem Aufruf
Start-Paket, ungelesene Nachrichten je Chat, Kachel-Zahlen und Live-Leitung kommen jetzt in EINEM Datenbank-Aufruf statt vier (KC-CLUB-START-KERN) – genau die vorhandenen Funktionen, gebündelt; fehlt ein Teil, wird nur er einzeln geholt; Not-Aus. Außerdem leeren die Paket-Abfragen den Zwischenspeicher des Servers nicht mehr.

## 2.601.0 – 2026-10-22 – Start schneller: weniger gleichzeitige Datenbank-Anfragen
Beim Start fragte der Server ~35-mal gleichzeitig die Datenbank – im Gedränge dauerte jede Anfrage 5–10-mal so lange. Die Communicator-Ampel (5 Anfragen) und die Büro-Zahlen der Clubleitung (~10 Anfragen) kommen jetzt in je EINEM Aufruf (KC-CLUB-START-BUENDEL). Gleiche Daten, gleiche Rechnung; Rückfall, Not-Aus und Stichproben-Vergleich wie bei den anderen Paketen.

## 2.600.0 – 2026-10-22 – 💬 Startnachricht mit Antworten „Ja · Später · Nein“ (KC-CLUB-STARTNACHRICHT-ANTWORT)
Wunsch Hansi („auch bei Marianne und Reinhilde – mit ja, nein, später usw“).
- 📣 Startnachricht verfassen: neuer Haken „💬 Antworten ✅ Ja · ⏰ Später · ✖ Nein anbieten“ – statt nur „gelesen“.
- Empfänger: ✅ Ja (mit Knopf-Ziel gleich dorthin, z. B. „Mein Bild wählen“), ⏰ Später (Fenster kommt nach 24 Std. wieder), ✖ Nein, danke. ↩️ Rückfrage bleibt.
- Absender sieht unter „Gesendet“ je Person ✅ Ja / ✖ Nein bzw. „⏰ später – kommt wieder …“.
- Ältere Apps zeigen wie bisher „gelesen bestätigen“.
- Test: Vertragstest-Block 2.600.0. Rückweg: App/Server 2.599.0.

## 2.599.0 – 2026-10-22 – 📣 Startnachricht mit Knopf zu einer Stelle der App (KC-CLUB-STARTNACHRICHT-SPRUNG)
Wunsch Hansi für Dieter („möchtest du dir einen Avatar zulegen … Taste, damit er direkt dort hinkommt“).
- 📣 Startnachricht verfassen: neue Auswahl „🔘 Knopf zu einer Stelle der App“ – Ziele aus der bekannten Sprung-Liste (z. B. 🧑‍🍳 Mein Bild wählen, 🗓️ Mein Dienst, 📝 Dienstwünsche), nur Ziele, die alle schon haben.
- Beim Empfänger steht der Knopf im Fenster der Startnachricht; Antippen bestätigt „gelesen“ und öffnet direkt die Stelle. Der Knopf „🔔 Benachrichtigungen einschalten“ bleibt wie bisher (hat Vorrang, wenn beides gewählt).
- Server nimmt nur „push“ oder „zu:<ziel>“ (2–20 Kleinbuchstaben); unbekannte Ziele zeigt die App nicht. Ältere Apps zeigen nur den Text.
- Test: Vertragstest-Block 2.599.0. Rückweg: App/Server 2.598.0.

## 2.598.0 – 2026-10-22 – ⚡ Stufe 3: Nachrichten-Übersicht in einem Datenbank-Aufruf + 🛟 Notbetrieb erst nach zweiter Probe, mit Bericht (KC-CLUB-UNTERHALTUNGEN-PAKET, KC-CLUB-NOTBETRIEB-ZWEITPROBE, KC-CLUB-NOTBETRIEB-BERICHT)
Wunsch Hansi („Ja baue Pak 3“). Gleiche Liste, gleiche Zahlen, gleiche Regeln.
- Die Nachrichten-Übersicht (auch Kommunikationszentrale im Kopf jede Minute, Büro, Notfall-Paket) holte bisher in 3–4 Schritten Chats, Teilnehmer, Gruppen, „wichtig“ und bis zu 1000 GANZE Nachrichten – nur um je Chat die letzte Zeile und die Zahlen zu zeigen. Jetzt EIN Aufruf (kc_club_unterhaltungen_paket): die Datenbank rechnet je Chat aus denselben 1000 neuesten Nachrichten Anzahl, ungelesen, ❗ neu (unter den ersten 300 ungelesenen) und die letzte Nachricht (Text höchstens 120 Zeichen). Namen und Archiv laufen gleichzeitig dazu.
- Sicherheitsnetz wie bei den anderen Paketen: nur lesend, nur der Server darf aufrufen; Fehler oder Not-Aus (kc_club_konfig 'unterhaltungen_paket' = {"aus": true}) → bisheriger Weg (unverändert als unterhaltungenAlt); jeder 10. Aufruf vergleicht nebenbei alt ↔ neu (Protokoll „unterhaltungen_paket_abweichung“).
- Vorab nur lesend gegen die echten Daten geprüft: bei allen 18 Mitgliedern dieselbe Nachrichtenmenge. Datenbank: supabase/migrations/20261022_kc_club_unterhaltungen_paket.sql (Probelauf tools/db-test/89_unterhaltungen_paket_test.sql).
- Mitglieder-Liste: bewusst KEIN eigenes Paket – nach Stufe 1 sind es noch 3 Schritte; ein Paket müsste sechs Prüf-Funktionen (online, inkognito, zuletzt da, Status, Sperren, Probephase) nachbauen – zu viel Risiko für wenig Gewinn.
- 🛟 Notbetrieb (Fund Hansi „scheinbar gab es Notbetrieb“ – der Server lief laut Protokoll durchgehend): Vor dem Umschalten fragt die App den Club-Server jetzt ZWEIMAL (nach 3 s und nochmal 4 s später) – ein einzelner Netz-Aussetzer am Handy löst keinen Notbetrieb mehr aus; ein echter Ausfall wird weiter erkannt, nur ein paar Sekunden später (KC-CLUB-NOTBETRIEB-ZWEITPROBE).
- 🛟 Bericht: Schaltet ein Gerät in den Notbetrieb, merkt es sich wann, wodurch (Aktion + Fehlertext, kein Inhalt) und ob das Handy Netz meldete; ist der Server wieder da (auch nach einem Neustart der App), geht EIN kurzer Bericht mit Dauer an den Server (diagnose_notbetrieb). Die Admin-Probe wird nicht gemeldet (KC-CLUB-NOTBETRIEB-BERICHT).
- Test: Vertragstest-Block 2.598.0, Typprüfung ohne neue Meldungen. Rückweg: App/Server 2.597.0 (die Funktion kann bleiben).

## 2.597.0 – 2026-10-22 – ⚡ Stufe 2: Online-Takt und Nachrichten-Mahnung gebündelt (KC-CLUB-ONLINE-PAKET, KC-CLUB-MAHNUNG-PAKET)
Wunsch Hansi („bündeln statt einzeln nacheinander“ → Stufe 1 eingespielt → „Ja weiter“). Gleiche Abfragen, gleiche Regeln, gleiches Ergebnis.
- Online-Takt (jedes offene Handy jede Minute): „online seit“/Fenster merken, wer sonst online ist und die Live-Umfrage laufen gleichzeitig statt nacheinander; „wer ist online“ (Zugang → Einstellungen → Inkognito-Admins, bisher 2–3 Wege nacheinander) kommt in EINEM Datenbank-Aufruf (kc_club_online_jetzt).
- Start/Abgleich: die Mahnung „Nachrichten älter als 5 Tage / ❗ wichtig ungelesen“ las bisher EINE Abfrage je ungelesenem Chat (bis zu 40) + eine für „wichtig“ – jetzt EIN Aufruf (kc_club_nachricht_mahnung), gleiche Grenzen (100 je Chat, 300 für „wichtig“) und Chat-Reihenfolge.
- Sicherheitsnetz wie bei den bisherigen Paketen: nur lesend, nur der Server darf aufrufen; Fehler oder noch nicht eingespielte Datenbank → bisheriger Weg; Not-Aus ohne neue Version (kc_club_konfig 'online_paket' bzw. 'mahnung_paket' = {"aus": true}); nebenbei Vergleich alt ↔ neu (Online jeder 50., Mahnung jeder 10. Aufruf) mit Protokolleintrag bei Abweichung.
- Datenbank: supabase/migrations/20261022_kc_club_online_mahnung_paket.sql (Probelauf tools/db-test/88_online_mahnung_paket_test.sql). Vorab nur lesend gegen die echten Daten geprüft: gleiche Online-Personen/Einstellungen/Inkognito, Mahnung bei 12 Mitgliedern identisch.
- Test: Vertragstest-Block 2.597.0, Typprüfung (deno check) ohne neue Meldungen. Rückweg: App 2.596.0, Server 2.593.0 (die Funktionen können bleiben).
## 2.596.0 – 2026-10-22 – 📼 Anrufbeantworter-Aufnahme wie im Chat + Chat-Signale gebündelt (KC-CLUB-AB-WIE-CHAT, KC-CLUB-CHAT-BUENDELN)
Wunsch Hansi („Spracheingabe beim Anrufbeantworter genau so wie bei der Spracheingabe im Chat. Und nochmal prüfen, wenn viele Nachrichten abwechselnd geschickt werden, damit der Server nicht durcheinanderkommt“).
- Anrufbeantworter: dieselbe Aufnahme-Leiste wie bei der Sprachnachricht im Chat – blinkender roter Punkt, Laufzeit, echte Mikrofon-Welle (gleiches Oszilloskop), „✖ Verwerfen“ und „➤ Senden“; darüber für wen und wie viel Zeit noch bleibt (2 Min., Admin 15 Min.). Senden/Verwerfen/Zeitgrenze wie bisher (gleiche Aufnahme, gleiches Hochladen).
- Chat: pro Nachricht kamen beim Absender bis zu drei Signale fast gleichzeitig (Nachricht, „angekommen“, „gelesen“) – jedes lud den Chat ganz. Signale innerhalb von 0,5 s werden jetzt zu EINEM Nachladen zusammengefasst; läuft schon eins, kommt genau eins danach (2.594.0). Zusammen mit 2.594.0 (keine Startseite bei offenem Chat): statt bis zu 4 Ladevorgängen (~150 Abfragen) je Nachricht beim Absender höchstens 2.
- Test: Vertragstest-Block 2.596.0, Browser-Probe (Aufnahme mit Test-Mikrofon, Signal-Bündelung). Rückweg: App 2.595.0.

## 2.595.0 – 2026-10-22 – 📼 Anrufbeantworter: Messpunkte beim Aufsprechen + Meldung statt Stille (KC-CLUB-AB-DIAGNOSE)
Fund Hansi („Steven hat den Anrufbeantworter eingeschaltet, ich bekomme die Nachricht, konnte aber nicht aufsprechen“). Server: Anklopfen 17:19 → Steven schaltete 7 s später den Anrufbeantworter ein (Status richtig), danach kam bei Hansi KEIN Aufsprech-Versuch und kein Fehler an. Im Browser mit Test-Mikrofon läuft der ganze Ablauf (Angebot → Aufnahme → Hochladen → Senden).
- Jeder Schritt meldet sich jetzt (diagnose_ab: Angebot, Wahl, Aufnahme-Start mit Format, Fertig mit Länge/Größe, Fehler mit Name) – nur technische Werte, kein Ton, kein Inhalt.
- Lief noch eine Aufnahme (z. B. Sprachnachricht), brach „Aufsprechen“ bisher still ab – jetzt mit Hinweis. Lässt sich der Rekorder auf dem Handy nicht starten, kommt ebenfalls ein Hinweis statt eines stillen Abbruchs.
- Sofort eingespielt (Fehler, der Mitglieder behindert). Rückweg: App 2.594.0.

## 2.594.0 – 2026-10-22 – 💬 Schnelles Hin-und-her-Schreiben bremst die App nicht mehr aus (KC-CLUB-CHAT-RUHE)
Fund Hansi („Steven und ich schreiben – das verträgt die App nicht gut, wenn zu schnell geschrieben wird“). Server-Messung 17:11–17:14 Uhr: einzelne Aufrufe bis 24 s, selbst die Anmeldung 13 s; Datenbank unauffällig – der Club-Server war mit Aufrufen zugestaut.
- Ursache: Jede neue Nachricht lud bei jedem, der den Chat offen hatte, den Chat (~27 Abfragen) UND 1,5 s später die ganze Startseite (37–72 Abfragen). Kommt die Nachricht aus dem gerade offenen Chat, entfällt jetzt das Laden der Startseite; sie wird nach dem Chat beim nächsten Takt (≤ 1 Min.) frisch geladen.
- Kam eine Nachricht, während der Chat noch lud, ging das Signal verloren (Nachricht erst beim nächsten Takt, bis 30 s später). Jetzt wird genau einmal nachgeladen, sobald das Laden fertig ist – nie mehrere gleichzeitig.
- Sofort eingespielt (Fehler, der Mitglieder behindert). Test: Vertragstest-Block 2.594.0, Browser-Probe Signale. Rückweg: App 2.593.0.

## 2.593.0 – 2026-10-22 – ⚡ Abfragen gleichzeitig statt nacheinander, „schreibt …“ ohne ganzen Chat (KC-CLUB-GLEICHZEITIG, KC-CLUB-TIPPT-LEICHT)
Wunsch Hansi („prüfe die ganze Club-App, wo Datenbank-Abfragen gebündelt statt einzeln nacheinander laufen können – wie neu bei Nachrichten“ → „Leg los, aber sorgfältig und vorsichtig“). Stufe 1: nur Reihenfolge, keine neuen Datenbank-Funktionen – gleiche Abfragen, gleiche Regeln, gleiches Ergebnis.
- Server: Abfragen, die nicht voneinander abhängen, laufen jetzt gleichzeitig – Nachrichten-Übersicht (Gruppen + Archiv mit den Chats, Namen + „wichtig“ zusammen), Nachricht senden (Empfänger, Betreff, Gruppe, Teilnehmer zusammen), Mitglieder (~6 Schritte → 1), Pinnwand (Hilfe-Aufrufe von Anfang an statt am Ende; gelesen/Mitglieder/Willkommen zusammen), Kalender (Schulungen mit, Themen direkt an den Treffen), Vorschläge (Treffen + Spenden mit der Liste), Mitglied-Details (Festnetz, Notfall, zuletzt da, Chat-Anzahl, Probephase zusammen). Was voneinander abhängt (z. B. erst „gesehen“ eintragen, dann lesen; erst Sitzungen zuordnen, dann Vorschläge lesen), bleibt in der Reihenfolge.
- „✍️ schreibt …“: Das Signal der direkten Leitung lud beim Empfänger alle 1–3 s den ganzen Chat neu (inkl. Gelesen-Schreiben). Jetzt holt die App nur, wer gerade schreibt (neue Aktion „tippen_stand“, gleiche Regeln). Beginnt/endet das Schreiben oder klappt der kleine Aufruf nicht, lädt sie wie bisher ganz.
- Bewusst NICHT geändert: die Mitgliederliste wird im Server weiterhin nicht zwischengespeichert (wird auch aus der Verwaltung geändert).
- Test: Vertragstest-Block 2.593.0, Typprüfung (deno check) ohne neue Meldungen, Browser-Probe „tippt“. Rückweg: App 2.592.0, Server 2.590.0.
## 2.592.0 – 2026-10-22 – Internet-Tiefentest
Neuer Internet-Tiefentest (Netz-Symbol oben → 🔬 Tiefentest): misst Aussetzer, Schwankungen, Download/Upload, Router-Stau unter Last und verlorene Datenpakete; Dauertest 5/15/30 Min. findet kurze Aussetzer. Ergebnis in einfachen Sätzen mit Tipps und zum Teilen (KC-CLUB-NETZ-TIEFENTEST).

## 2.591.0 – 2026-10-22 – 🖼️ Chat: nur den Hintergrund zeigen (KC-CLUB-CHAT-NUR-HG)
Wunsch Hansi („In Nachrichten unten die Zeile mit Tastatur, Pfeil und Umschalten der Nachrichten – einen weiteren Klick, und alle Nachrichten werden komplett ausgeblendet, damit man den Hintergrund sehen kann“).
- Der Knopf 👥 in der kleinen Zeile über dem Schreibfeld hat einen vierten Stand: 1× 👤 nur die anderen, 2× 🙋 nur meine, **3× 🖼️ nur der Hintergrund** – alle Nachrichten blenden sanft aus (der Platz bleibt, nichts springt), Angeheftetes und Runde ebenso, das Hintergrundbild erscheint in voller Stärke (auch im Nachtmodus ungedimmt). 4× wieder alle.
- Oben steht der gelbe Hinweis „🖼️ Nur der Hintergrund – Nachrichten ausgeblendet · ✕ alle zeigen“ (ohne eigenes Bild: „noch kein Hintergrundbild – ⋮ → Chat-Farben“); Antippen zeigt sofort wieder alles. Beim Verlassen und neuen Öffnen des Chats ist alles wieder sichtbar.
- Nur Anzeige, nichts wird gelöscht oder geladen. Hilfe-Eintrag „Nur die anderen, nur meine – oder nur den Hintergrund“, Lupe-Treffer, Twinkey-Frage.
- Test: `tools/chat-nur-hg/nur-hg-browser.mjs` · Vertragstest-Block 2.591.0.
- Rückweg: App 2.590.0 erneut einspielen.

## 2.590.0 – 2026-10-22 – 🟢 Dienst anmelden/abmelden in der App – Stufe 1, nur Admin zum Testen (KC-CLUB-DIENST-STEMPEL)
Wunsch Hansi (Konzept „Dienst-Anmeldung in der Club-App“; Entscheidungen 22.10.: Ort nur markieren 300 m, Zeitfenster ±2 Std., Grund ab 15 Min., selbst korrigieren 24 Std., spontan mithelfen ja, Aushilfen ja; „Bau ein, aber noch nicht freigegeben – erst ich teste. Ohne Probleme mit den anderen Programmen“).
- **Noch nicht freigegeben:** neue Freigabe „🟢 Dienst anmelden/abmelden“ (Standard: nur Admin, mit 🔒 Test). Für Mitglieder ändert sich nichts, bis Hansi unter Admin → Freigaben „für alle“ wählt.
- Startseite: Karte „🟢 Dienst beginnen · heute 14:00–22:00“ ab 30 Min. vor Dienstbeginn bzw. „🔴 Dienst beenden · läuft seit …“, solange angemeldet. Blatt mit großer Uhr: Vorschlag = geplante Zeit (wenn innerhalb 30 Min.), sonst jetzt; −1 Std./−5/+5/+1 Std., „Jetzt“, „Wie geplant“; Pause beim Gehen (aus dem Plan bzw. Pausenregel); Grund-Knöpfe ab 15 Min. Abweichung (wie an der Kasse + „Später/Früher gekommen“, „Spontan mitgeholfen“); „Ich helfe spontan mit“; „Kommen vergessen“ trägt Kommen + Gehen in einem Zug nach; eigene Buchungen 24 Std. änderbar (alte Zeit bleibt sichtbar). Ohne Netz wird die Buchung gemerkt und nachgeschickt.
- Standort nur beim Buchen und nur, wenn Dienst-Orte eingerichtet sind: Ergebnis „vor Ort ja/nein“ wird gespeichert, der Standort nicht. Nicht vor Ort = nur markiert, gebucht wird trotzdem.
- Admin: „👥 Wer ist im Dienst“ (Ampel: fehlt / noch angemeldet / da / noch nicht da, mit Nachtragen), „📍 Dienst-Orte“ (am Ort „Hier ist ein Dienst-Ort“ tippen, Umkreis 150/300/500 m).
- Erinnerungen (Push, im 15-Min.-Takt der Wartung): kurz vor Beginn, zum geplanten Ende, 1 Std. danach „Abmelden vergessen?“ – vor der Freigabe nur an Admins.
- Server 2.590.0: Aktionen dienst_stand, dienst_buchen, dienst_korrigieren (Mitglieder/Aushilfen) und dienst_heute, dienst_nachtragen, dienst_orte (Admin); init liefert die Lage nur, wenn freigegeben (sonst keine Abfrage). Regeln in dienst-stempel.js.
- Datenbank: Migration 20261022_kc_club_v2590_dienst_stempel.sql – gemeinsames Buchungsbuch kc_dp_stempel (Format der Kassen-Stechuhr KC_TIME_CLOCK_V1, vorbereitet für die Kasse: kasse_event_id) + Ansicht kc_dp_stempel_paare (Kommen+Gehen als Ist-Zeile) zum Lesen für den Dienstplan. **Kasse und Dienstplan unverändert**; es wird nichts in die Ist-Tabelle des Dienstplans geschrieben (Stufe 2, Codex).
- Test: tests/dienst-stempel.test.mjs (Regeln + Einbau), Browser-Durchlauf. Rückweg: App/Server 2.589.0/2.584.0; Tabelle stört nicht.

## 2.589.0 – 2026-10-22 – Info-Feld: ganze Nachricht beim Antippen
Meldungen im Info-Feld ohne eigenes Ziel (z. B. „Uhr zurückstellen“) öffnen beim Antippen jetzt die ganze Nachricht zum Lesen (KC-CLUB-INFO-LESEN).

## 2.588.0 – 2026-10-22 – CSV-Knopf auch unter Erstattung
Die Clubleitung findet den Knopf „📊 CSV für Excel erstellen“ jetzt auch oben auf der Seite „Erstattung“ (zusätzlich zu Büro → Eingang).

## 2.587.0 – 2026-10-22 – Kopf-Pfeil blinkt nur noch, solange der Grund besteht (KC-CLUB-KOPF-PFEIL-GRUND)
Fund Hansi: Der Pfeil blinkte weiter, obwohl Dieter schon wieder offline war. Jetzt: Kommt jemand online, blinkt der Pfeil nur, solange die Person online ist. Neue Nachrichten und neue Mitglieder lassen ihn weiter blinken – bis zum Ausrollen bzw. bis alles gelesen ist.

## 2.586.0 – 2026-10-22 – Kachel-Zug langsamer und deutlicher
Wunsch Hansi „zu schnell, man sieht keinen Effekt“: Jede Kachel ist jetzt etwa 3 Sekunden unterwegs (gleichmäßig wie ein Zug), mit etwas mehr Abstand und unterwegs größer.

## 2.585.0 – 2026-10-22 – Neuer Kachel-Effekt „🚂 Kachel-Zug“ (KC-CLUB-KACHEL-ZUG)
Die Kacheln kommen eine nach der anderen oben links herein, fahren wie ein Zug am linken Rand hinunter, machen unten eine Kurve nach rechts und reihen sich auf ihrem Platz ein. Wählbar unter ⚙️ → 🎬 Effekt beim Register-Wechsel (auch bei Zufall/Abwechselnd dabei).

## 2.584.0 – 2026-10-22 – Eingangskorb lädt schneller (KC-CLUB-EINGANG-PAKET)
Der Eingangskorb im Büro holt seine Listen jetzt in einem einzigen Aufruf statt in acht getrennten – eine Anmeldung, gleiche Abfragen nur einmal. Bisheriger Weg bleibt als Rückfall.

## 2.583.0 – 2026-10-22 – Erstattungen als CSV für Excel (KC-CLUB-ERSTATTUNG-CSV)
Im Büro-Eingang gibt es für die Clubleitung „📊 Erstattungen für Excel (CSV)“: Auswahl nach Zeitraum, Status und Aufbau (je Position oder je Antrag), teilen oder speichern. Übernommene Anträge können markiert werden, damit „Nur neue“ nichts doppelt liefert.

## 2.582.0 – 2026-10-22 – Eigenes Foto als Chat-Hintergrund (KC-CLUB-CHAT-HG-FOTO)
Unter 🎨 Chat-Farben kann jetzt auch ein eigenes Foto als Hintergrund gewählt werden – aus der Galerie, direkt mit der Kamera oder als Datei. Stärke wählbar (blass, mittel, kräftig), damit die Nachrichten gut lesbar bleiben.

## 2.581.0 – 2026-10-22 – Unser Clubjahr: Sammelaktion „Mein Clubmoment“ (KC-CLUB-CLUBJAHR-MOMENTE)
Ab 1. November kann jedes Mitglied seinen schönsten Clubmoment 2026 einreichen (Foto + ein, zwei Sätze, bis 15.12.). Die Clubleitung gibt frei, fragt zurück, trägt für Mitglieder ohne App ein und kann den Einsendeschluss ändern. Daraus entsteht das Clubjahr-Heft fürs Weihnachtsessen im Januar.

## Datenbank 2.580.0 – 2026-10-22 (ohne App-/Server-Build) – ⏰ Wartungsaufgaben versetzt statt alle zur vollen Stunde (KC-CLUB-ZEITPLAN-VERSETZT)
Wunsch Hansi („ja“ zum Vorschlag): Hansis App-Start um 06:00 Uhr brauchte am Server 8,4 s statt 0,6 s – zur vollen Stunde liefen ~17 Zeitplaner-Aufgaben gleichzeitig an (alle Start-Teile 4–13× langsamer).
- Die schweren Aufgaben der Club-App laufen jetzt versetzt, gleich oft wie bisher: Wartung :04/:19/:34/:49 (stündliche Teile weiter einmal je Stunde, Minute < 15), Zugangslinks schwärzen :06/:21/:36/:51, Notfall-Paket :09/:24/:39/:54, Termine-Wartung :01/:11/:21/:31/:41/:51. Erinnerungen hängen nicht an der Minute (±7-Min.-Fenster).
- Aufgaben anderer Programme (System-Check, Communicator) unverändert. Kein Neustart der Apps nötig.
- Migration 20261022_kc_club_v2580_zeitplan_versetzt.sql (nur cron.alter_job). Test: Vertragstest-Block. Rückweg: alte Zeiten (*/15 bzw. */10) einspielen.

## 2.579.0 – 2026-10-22 – 🕵️ Fremde Anmeldeversuche: wann, welcher Schlüssel, Vermutung wer (KC-CLUB-FREMDZUGRIFF)
Wunsch Hansi („Fremde Anmeldeversuche wann, mit welchem Schlüssel, Vermutung wer“) nach dem Gesamt-Check vom 22.10. (abgelehnte Schlüssel wurden bisher nicht vermerkt).
- Server 2.579.0: jede abgelehnte Anmeldung wird im Hintergrund vermerkt (neue Tabelle kc_club_fremdzugriff): Zeit, Grund (Schlüssel unbekannt / alter Link / Zugang gesperrt / Schlüssel beschädigt), **Kurzkennung des Schlüssels** (erste 12 Zeichen seines SHA-256 – der Schlüssel selbst wird nie gespeichert), Netz-Kennung (Hash der Internetverbindung), Gerät/Browser in Worten, App-Version.
- **Vermutung, wer:** ① gesperrte Person mit richtigem Schlüssel, ② **alter Link eines Mitglieds** (neue Tabelle kc_club_zugang_alt: ein Trigger merkt sich jeden ersetzten oder abgeschalteten Link; öffnet nichts, dient nur der Zuordnung), ③ **gleiche Internetverbindung** wie ein Mitglied in der letzten Stunde, ④ genau dieser Browser schon bei einem Mitglied gesehen, sonst „unbekannt“.
- **Bescheid an Hansi** (Push, eilig): ab 5 abgelehnten Versuchen in 15 Min. oder sofort, wenn ein Programm/Bot (curl, python …) es versucht – höchstens einmal je Stunde. Bremse gegen Fluten: gleicher Schlüssel aus gleichem Netz höchstens alle 10 Min., höchstens 60 Einträge je Stunde und Server-Instanz. Einträge werden nach 90 Tagen gelöscht.
- App (nur Admin): Sicherheits-Check → neue Karte **🕵️ Fremde Anmeldeversuche (30 Tage)** mit Zeit, Grund, Gerät, Schlüssel-Kennung, Netz und Vermutung; der Push öffnet sie direkt.
- Datenbank: Migration 20261022_kc_club_v2579_fremdzugriff.sql (zwei Tabellen, Rechte nur für den Club-Server, RLS, Trigger). Bis zum Einspielen bleibt alles wie bisher (Karte zeigt „noch nicht eingerichtet“).
- Test: tests/fremdzugriff.test.mjs (Gerät, Vermutung, Alarm, Kurzkennung, Einbau). Rückweg: App/Server 2.578.0; Tabellen stören nicht.

## 2.578.0 – 2026-10-21 – Chats öffnen sofort (KC-CLUB-CHAT-SOFORT / KC-CLUB-CHAT-PAKET)
Ein Chat zeigt beim Öffnen sofort den zuletzt geladenen Stand (markiert „wird aktualisiert“); der Server holt die Chat-Daten in einem einzigen Datenbank-Aufruf statt rund 28 nacheinander. Bisheriger Weg bleibt als Rückfall, Not-Aus eingebaut.

## 2.577.0 – 2026-10-21 – 🧑‍🍳 Kochmütze in der Handy-Statusleiste größer + 👥 Chat-Filter (KC-CLUB-PUSH-MUETZE-GROSS, KC-CLUB-CHAT-FILTER)
Wunsch Hansi Chat-Filter („Texte in Nachrichten nur seine oder nur die des Partners oder wieder alle … Togglebutton in der kleinen Zeile mit Tastatur, Lautsprecher, Schloss. Beim Öffnen immer alles, 1× nur Fremduser, nochmals nur meine, dann wieder alles“).
- Chat: neuer Knopf **👥** in der kleinen Zeile über dem Schreibfeld (neben ⌨️ 🔊 🔒). 1× → **👤 nur die Nachrichten der anderen** (im Zweierchat „Nur Nachrichten von Dieter“), 2× → **🙋 nur meine**, 3× → wieder alle. Oben im Chat steht dann „👤 Nur Nachrichten von Dieter · ✕ alle zeigen“ (antippen = alle). Beim Öffnen eines Chats immer alle. Nur Anzeige, lädt nichts nach.
Wunsch Hansi („Die kleine Kochmütze oben in der Statusleiste vom Handy ist zu klein. Kannst du größer machen“).
- badge-muetze.png (Zeichen oben in der Statusleiste bei Mitteilungen, Android zeigt nur die Form): weiter die Club-Logo-Kochmütze (aus kc-kochmuetze-weiss.webp), jetzt randlos auf volle Breite (94 statt 86 px von 96) und mit kräftigeren Linien – in der kleinen Statusleiste besser zu erkennen. (Ein erster Entwurf mit gezeichneter Mütze wurde verworfen: „Es soll die Logo-Kochmütze des Clubs sein“.)
- Wirkt bei der nächsten Mitteilung, sobald die neue Version auf dem Handy ist (Service Worker lädt das Bild neu). Server unverändert.
- Test: Vertragstest-Block 2.577.0 (Größe 96×96, im Push verwendet). Rückweg: App 2.576.0.

## 2.576.0 – 2026-10-21 – Schnellerer Start (KC-CLUB-START-PAKET)
Die vielen kleinen Start-Abfragen kommen jetzt in einem einzigen Datenbank-Aufruf. Der bisherige Weg bleibt als Rückfall, ein Not-Aus ist eingebaut.

## 2.575.0 – 2026-10-21 – Push-Zeichen aus dem Club-Logo
- Fund Hansi „falsche Kochmütze – nimm das richtige Logo“: das Push-Zeichen oben in der Leiste ist jetzt aus dem Club-Logo (dieselbe Kochmütze wie oben links in der App), Linien für die kleine Leiste leicht verstärkt – statt der selbst gezeichneten Mütze.

## 2.574.0 – 2026-10-21 – Große Standuhr mit echtem Klang (KC-CLUB-STANDUHR-ECHT)
- Neue Stundenuhr „🕰️ Große Standuhr – echt“: echte alte Großvateruhr (London-Hackney, gemeinfreie Aufnahme von radio aporee über archive.org) – erst das Ticken mit dem Anlauf des Schlagwerks, dann so viele echte Stundenschläge, wie es Uhr ist, im Takt der Uhr (0,85 s).
- Pause nach der Melodie jetzt je Uhr einstellbar (diese Uhr schlägt wie das Original direkt nach dem Anlauf).

## 2.573.0 – 2026-10-21 – Stundenuhren: Pause vor dem ersten Schlag
- Fund Hansi „immer ein Schlag zu wenig“: Zählung und Uhrzeit stimmten (Diagnose z. B. 19 Uhr → 7 Schläge, alle gespielt; Zeitzone Europe/Berlin, Winterzeit stellt sich von selbst um). Bei Uhren mit Melodie kam der 1. Schlag nur 0,4–1,6 s nach dem letzten, noch nachklingenden Melodieton und ging darin unter. Jetzt 2,5 s Pause wie bei echten Uhren.

## 2.572.0 – 2026-10-21 – Adventsgesteck + Kochmütze als Push-Zeichen
- 🕯️ Adventsgesteck oben rechts im Kopf vom 1. Advent bis Heiligabend: Tannengrün, 2 rote glänzende Kugeln, 1 Tannenzapfen, je Adventssonntag eine brennende Kerze mehr. ⚙️ → Effekte: ein/aus + Vorschau.
- Push-Mitteilungen zeigen oben in der Leiste die Kochmütze statt eines Vierecks (eigenes Statusleisten-Zeichen badge-muetze.png).

## 2.571.0 – 2026-10-21 – Clubabend Live + Chat öffnet bei der neuesten Nachricht
- Kachel heißt jetzt „🍽️ Clubabend Live“; beim Admin immer sichtbar (außerhalb des Abends als Vorschau auf den nächsten Clubabend), für alle anderen weiter nur am Abend.
- Chat öffnen springt immer sofort zur neuesten Nachricht (Wunsch Hansi); die Linie „Neue Nachrichten“ bleibt als Markierung. Hilfe-Texte angepasst.

## 2.570.0 – 2026-10-21 – Dienstzeiten-Übersicht: Zoom (KC-CLUB-DV-ZOOM)
- In der 📊 Dienstzeiten-Übersicht mit zwei Fingern größer/kleiner ziehen oder 🔍+ / 🔍− (100 % = zurück). Tage werden breiter, Zeilen höher, Schrift größer; das Gerät merkt sich die Größe.
- Behoben: Die Namen-Spalte blieb beim seitlichen Wischen nicht links stehen.

## 2.569.0 – 2026-10-21 – Kachel „Clubabend“ (KC-CLUB-CLUBABEND, Wunschliste #27)
- Am Clubabend (2 Std. vorher bis Ende) erscheint die Kachel 🍽️ Clubabend (+ Hinweis im Info-Feld): Tagesordnung (aus der Büro-Vorbereitung, Themen mit 👍), Anwesende, Fotos vom Abend, Geburtstage seit dem letzten Treffen, offene Aufgaben aus dem letzten Protokoll.
- Nur die Clubleitung: Tagesordnung abhaken, Anwesenheit vor Ort eintragen (geht ins Protokoll), Protokoll anlegen/öffnen, nächsten Termin live abstimmen, Album anlegen. Mitglieder sehen nur (alle 20 s aktuell).
- Server 2.569.0 (clubabend, clubabend_setzen), Tabelle kc_club_clubabend; Clubleitung kann über die Lupe „Clubabend“ vorab eine Vorschau öffnen.

## 2.568.0 – 2026-10-21 – 📼 Anrufbeantworter beim Anklopfen + 🧭 Kacheln: Einfliegen, Horizontal/Vertikal drehen, Fallblatt-Uhr (KC-CLUB-ANRUFBEANTWORTER, KC-CLUB-KACHEL-EINFLUG)
Bündel 20 Uhr. Wunsch Hansi zum Anrufbeantworter: „Wenn ich anklopfe und derjenige möchte das Gespräch nicht annehmen … mehrere Antworten parat und einen Sofort-Button ‚Anrufbeantworter einschalten‘ … Nachricht hinterlassen, Sekunden laufen runter, höchstens 2 Min., Admin beliebig … Dieter: ‚Du hast x neue Nachrichten auf deinem Anrufbeantworter‘ … anhören, blättern, löschen … und mir Rückmeldung: ‚abgehört am … um …‘“.
- Anklopf-Fenster: neuer roter Knopf **📼 Anrufbeantworter einschalten** und sechs weitere Kurzantworten (⏱️ Gleich – in 5 Minuten, 📅 Termin, 🩺 Arzt, 👨‍👩‍👧 Familie, 🛒 einkaufen, 😴 Ruhe).
- Wer anklopft, bekommt sofort „📼 Anrufbeantworter eingeschaltet – Möchtest du jetzt eine Nachricht für Dieter hinterlassen?“ → **🎤 Ja, jetzt aufsprechen**: Mikrofon an, Uhr läuft von 2:00 rückwärts (Admin bis 15 Min.), bei 0 wird automatisch gesendet; ✅ Fertig oder 🗑️ Verwerfen. Aufsprechen geht nur, wenn der Angeklopfte den Anrufbeantworter für dieses Anklopfen eingeschaltet hat (15 Min.), höchstens 10 Nachrichten je Stunde.
- Der Empfänger bekommt sofort eine Mitteilung bzw. beim nächsten Start „📼 Du hast 2 neue Nachrichten auf deinem Anrufbeantworter. Jetzt anhören?“. **💬 Nachrichten → 📼 Mein Anrufbeantworter**: neueste zuerst, ◀ Neuere / Ältere ▶, ▶️ Anhören (mit 1,5×/2×), 📞 Zurückrufen, 👋 Anklopfen, 💬 Schreiben, 🗑️ Löschen (Aufnahme wird entfernt).
- ⚙️ → Privatsphäre → Anklopfen → **📼 Anrufbeantworter beim Anklopfen** (Wunsch Hansi „auch in Voreinstellungen“): „Nur, wenn ich ihn beim Anklopfen einschalte“ (Standard) · „Automatisch, wenn ich nicht innerhalb 1 Minute annehme“ · „Immer sofort an – ich möchte nicht gestört werden“ (keine Mitteilung, gilt auch bei ausgeschaltetem Anklopfen).
- Der Absender sieht, sobald abgehört wurde: „✅ Deine Nachricht an Dieter vom … wurde am … um … Uhr abgehört.“ (sofort per Signal oder beim nächsten Start).
- Server 2.568.0: Aktionen ab_aufsprechen, ab_liste, ab_anhoeren, ab_loeschen, ab_stand, ab_quittung_gesehen; Anklopfen-Antwort „ab“; init liefert den Stand (eine Abfrage). Datenbank: Migration 20261021_kc_club_v2568_anrufbeantworter.sql (neue Tabelle kc_club_anrufbeantworter mit Rechten nur für den Club-Server, Status 'anrufbeantworter', Signal „ab“). Bis zum Einspielen der Migration ist der Anrufbeantworter einfach still.
- Test: tests/anrufbeantworter.test.mjs, Browser-Durchlauf mit Test-Mikrofon (Anklopf-Fenster, Angebot, Aufnahme mit Rückwärts-Uhr, Senden, Abhören, Quittung, Hinweis „neue Nachrichten“). Rückweg: App/Server 2.567.0; Tabelle bleibt (stört nicht).

### Kacheln (KC-CLUB-KACHEL-EINFLUG)
Wunsch Hansi („einfliegen, dass sie aus verschiedenen Richtungen kommen, horizontal reindrehen und vertikal reindrehen und vielleicht noch wie eine Falluhr“).
- ⚙️ → ✨ Effekte → „🎬 Effekt beim Register-Wechsel“ – neu: **🧭 Einfliegen** (jede Kachel aus einer anderen der 8 Richtungen, gegeneinander versetzt), **↔️ Horizontal drehen** (wie eine Drehtür um die senkrechte Kante, linke Spalte links, rechte rechts angeschlagen), **↕️ Vertikal drehen** (halbe Drehung um die waagerechte Mitte, Reihe für Reihe), **🕰️ Fallblatt-Uhr** (klappt dreimal rasch um wie die alten Bahnhofstafeln und bleibt stehen).
- Alle vier sind auch bei 🔁 Abwechselnd und 🎲 Zufall dabei. Wie bisher nur Bewegung (transform/opacity), keine Datenbank-Abfragen; aus bei „✨ Animierte Knöpfe“ aus, im Sparmodus und in der einfachen Ansicht.
- Erklär-Video, Hilfe-Texte ergänzt. Test: Vertragstest-Block 2.568.0, Browser-Bilder der Abläufe. Rückweg: App 2.567.0.

## 2.567.0 – 2026-10-21 – 👋 Verpasstes Anklopfen + „ist angekommen“ für den Anklopfenden (KC-CLUB-ANKLOPFEN-VERPASST)
Wunsch Hansi nach Fall Dieter („Hat er es nicht bekommen?“ – die Mitteilung war 2 s nach dem Anklopfen angezeigt, aber nicht geöffnet worden; „baue beides und spiel sofort ein“).
- Wer ein Anklopfen verpasst hat, sieht beim nächsten Besuch einmal: „👋 Hansi hat bei dir angeklopft – du hast den Gesprächswunsch nicht angenommen. Möchtest du Hansi jetzt erreichen oder eine Nachricht schreiben?“ mit **👋 Zurück anklopfen**, **💬 Nachricht schreiben**, **Später**. Nur die letzten 24 h, je Person das neueste, höchstens 3 in einem Fenster; nicht, wenn ihr danach telefoniert oder im Zweiergespräch geschrieben habt. „Gesehen“ steht auf dem Server (gilt für alle Geräte, ohne neue Tabelle: kc_club_person_einstellung „klopf_verpasst“).
- Wer anklopft, sieht im Warte-Fenster „📲 Ist um 16:58 Uhr auf dem Handy von Dieter angekommen“ bzw. „hat die Mitteilung geöffnet“; nach dem Auflegen: „Dieter hat die Mitteilung um 16:58 Uhr auf dem Handy bekommen, aber nicht geöffnet (vielleicht lautlos oder weggelegt)“ oder „… hat den Empfang nicht bestätigt (aus, kein Netz oder Stromsparen)“. Ob ein Handy stumm ist, verrät kein Browser.
- Server 2.567.0: Online-Abfrage liefert verpasstes Anklopfen aus derselben Anklopfen-Abfrage (24 h statt 3 Min. für „an mich“); Zusatzabfragen nur, wenn es ein verpasstes gibt bzw. solange angeklopft wird. Neue Aktion anklopfen_verpasst_gesehen; anklopfen_abbrechen meldet den Stand der Mitteilung.
- Test: tests/anklopfen-verpasst.test.mjs (Regeln, Stand der Mitteilung, Fall Dieter), Vertragstest-Block 2.567.0. Rückweg: App 2.566.0, Server 2.565.0.

## 2.566.0 – 2026-10-21 – 🌀 Kacheln: 9 Effekte, Abwechselnd, Start, Welle, Wackeln, Abschied (KC-CLUB-KACHEL-WIRBEL, KC-CLUB-KACHEL-EXTRAS)
Wunsch Hansi („dass die Kacheln reingedreht kommen“, dann „baue alle, baue in Zahnrad und mach dass die auch Abwechslung gehen“).
- ⚙️ → ✨ Effekte → „🎬 Effekt beim Register-Wechsel“ – neu: **🌀 Hereindrehen** (klein und gedreht von außen herein, linke Spalte von links, rechte von rechts), **🎰 Spielautomat** (Spalten rollen wie Walzen herein und rasten nacheinander ein), **🫧 Seifenblasen** (steigen schwankend auf und ploppen auf), **🧲 Magnet** (fliegen aus der Mitte auf ihren Platz), **🍳 Pfanne** (hochgeworfen, in der Luft gewendet, landen federnd) und **🔁 Abwechselnd** (jedes Mal der nächste Effekt der Reihe, gemerkt je Gerät). 🎲 Zufall nimmt jetzt alle neun.
- Neue Schalter darunter (je Gerät, Standard an): **🚀 Kacheln beim Öffnen der App** (einmal mit dem gewählten Effekt, höchstens einmal pro Stunde), **💧 Welle beim Antippen** (Wellenring vom Finger aus), **🔔 Neues wackelt** (Kacheln mit Zahl wackeln beim Öffnen der Startseite einmal, höchstens alle 30 s), **👋 Abschied beim Abmelden** (Kacheln verschwinden – abwechselnd Jalousie zu, weggewirbelt oder fallend).
- Wie bisher: nur Bewegung (transform/opacity), keine Datenbank-Abfragen; aus bei „✨ Animierte Knöpfe“ aus, im Sparmodus und in der einfachen Ansicht.
- Erklär-Video „Effekte“, Hilfe-Texte und Suche ergänzt.
- Test: Vertragstest-Blöcke 2.566.0 (Effekte, Abwechselnd, Schalter, Grenzen), Browser-Bilder der Abläufe. Server unverändert (2.565.0). Rückweg: App 2.565.0.

## 2.565.0 – 2026-10-21 – 🛰️ Umleitung: Lämpchen nennt den Grund und was zu tun ist (KC-CLUB-ANRUF-TURN-GRUND)
Wunsch Hansi („Kannst du nicht die Fehlermeldung erkennen“, „bau es und spiel ein“). Anlass: Metered meldete „please subscribe to a TURN Server plan before using this API“.
- Server 2.565.0: erkennt die Absagen von Metered und übersetzt sie – kein Plan gewählt, Schlüssel falsch, App nicht gefunden, Kontingent erschöpft, nicht erreichbar, sonst die Meldung selbst (gekürzt). Schlüssel und Passwörter werden geschwärzt. Fragt der Admin ausdrücklich nach, versucht der Server es sofort neu (ohne 10-Min.-Pause).
- Admin → 🧯 Notfall → „🛰️ Umleitung für Anrufe“: zeigt den Grund mit Handlungsanweisung, z. B. „kein Plan gewählt – im Metered-Dashboard unter Plans & pricing den Free-Plan ($0) wählen, bei Abfrage nach Karte/PayPal abbrechen“.
- Test: tests/anruf-turn.test.mjs (Block „Grund“, mit der echten Meldung vom 21.10.), Vertragstests grün. Rückweg: App 2.563.0, Server 2.564.0.

## Server 2.564.0 – 2026-10-21 (ohne App-Build) – Umleitung: Grund der Metered-Absage mitprotokollieren (KC-CLUB-ANRUF-TURN)
Nach dem Einspielen von 2.563.0 meldete das Lämpchen „gestört“: Metered antwortete auf das Anlegen der Zugangsdaten mit 400 (ungültige Anfrage), der Grund stand nicht im Protokoll.
- Server: Bei einer Absage schreibt er jetzt den Antworttext von Metered ins Protokoll (gekürzt, Schlüssel und Passwörter geschwärzt). Sonst unverändert; Anrufe laufen bis zur Klärung wie bisher direkt.
- Test: Vertragstests grün. Rückweg: Server 2.563.0.

## 2.563.0 – 2026-10-21 – 🛰️ Anrufe und Videoanrufe auch ohne direkten Weg: Umleitungs-Server (KC-CLUB-ANRUF-TURN)
Wunsch Hansi („als Sicherheit beim Anrufen und Video“; Punkt 1 aus der Anruf-Verbesserung – Cloudflare verlangte eine Karte, darum Metered Free-Plan ohne Karte, 50 GB/Monat).
- Finden zwei Handys keinen direkten Weg (manche Mobilfunknetze, Firmen-WLAN), läuft das Gespräch jetzt automatisch über einen **Umleitungs-Server (TURN)** statt abzubrechen – für Ton, Video und Konferenz. Der Browser nimmt ihn nur, wenn es direkt nicht klappt; die Verbindung bleibt Ende-zu-Ende verschlüsselt (Metered leitet nur weiter).
- Server 2.563.0: Aktion `anruf_wege` liefert die Umleitung mit Zugangsdaten (STUN hat die App wie bisher selbst) (7 Tage gültig, Vorrat in `kc_club_turn_vorrat`, weil neue Zugangsdaten bei Metered bis zu 2 Min. brauchen; ab 2 Tagen Restlaufzeit kommt automatisch ein neuer). Schlüssel nur als Supabase-Geheimnis `METERED_TURN_SECRET_KEY`. Kein Schlüssel, Metered gestört oder zu langsam (> 2,5 s) → wie bisher nur STUN; ein Anruf scheitert nie an der Umleitung.
- Über die Umleitung ist das Bild auf höchstens 300 kbit/s begrenzt (schont das Kontingent), der Ton bleibt unverändert; „Verbindung schwach“-Stufen wie in 2.556.0.
- Admin → 🧯 Notfall: Lämpchen „🛰️ Umleitung für Anrufe (Metered)“ mit Gültigkeit und Monatsverbrauch (unbekannt bleibt grau). Messung beim Auflegen: wie oft die Umleitung gebraucht wurde.
- Hilfe/Datenschutz: „Anrufe bei schlechtem Netz: die Umleitung“ (Anbieter Metered/Kanada, verschlüsselt; das Handy meldet sich bei jedem Anruf kurz an, Metered speichert die IP-Adresse 30 Tage zur Missbrauchsabwehr). Kein zusätzlicher STUN-Server von Metered.
- Datenbank: Migration `20261021_kc_club_v2563_anruf_turn.sql` (Tabelle nur für den Club-Server, geheim, nicht gespiegelt/gesichert) – vor dem Server einspielen.
- Tests: tests/anruf-turn.test.mjs (Vorrat, Server, App), tools/anruf/anruf-turn-browser.mjs (zwei echte WebRTC-Seiten ohne direkten Weg über lokalen TURN-Server: Video + Ton verbunden, 300 kbit/s, Messung; ohne Umleitung scheitert es wie bisher), tools/anruf/anruf-browser.mjs unverändert grün, Vertragstest-Block 2.563.0. Rückweg: App 2.562.0, Server 2.556.0 (Tabelle kann bleiben).
## 2.562.0 – 2026-10-21 – Vorlage: Kommen/Gehen mit Ausweis UND Handy-QR (KC-CLUB-ABSTIMMUNG-VORLAGE)
Wunsch Hansi („bei der Stundenberechnung nicht entweder oder, sondern beides – Mitgliedsausweis / QR-Code am Handy“).
- Frage 9: Antworten jetzt Ja / Nein / Enthaltung; Erklärung „Beides geht: mit dem Mitgliedsausweis oder mit dem QR-Code in der Club-App am Handy.“
- Nur die Vorlage – App und Server unverändert. Rückweg: App 2.561.0.

## 2.561.0 – 2026-10-21 – Vorlage „Technik, Bilderrechner, Abrechnung“: Einleitung und zwei Änderungen (KC-CLUB-ABSTIMMUNG-VORLAGE)
Wunsch Hansi nach Durchsicht.
- Neue Einleitung oben: „Für den kommenden Weihnachtsmarkt sollten im Vorfeld einige Entscheidungen getroffen werden. So ist sichergestellt, dass alle nach den gleichen Regeln arbeiten und keine Unsicherheiten entstehen. Alle, die bei Hansi in der Bilderrechner-Schulung waren, wurden über die verschiedenen Vorgehensweisen informiert.“
- Frage 2 (Stand vernetzen) mit Erklärung: „Die Geräte können automatisch Daten austauschen und, wenn nötig, auch in die Datenbank senden.“
- Frage 8 (Entnahmen für Personalverpflegung): „möglichst“ gestrichen.
- Nur die Vorlage (vorlagen/abstimmungen.json) – App und Server unverändert. Rückweg: App 2.560.0.

## 2.560.0 – 2026-10-21 – 🖨️ Ankreuzbogen schon vor dem Start ansehen und senden (KC-CLUB-ABSTIMMUNG-BOGEN-ENTWURF)
Hansi: „ich sehe den Button nicht, um den leeren Bogen wegzuschicken“ – der Bogen ging bisher nur aus einer gestarteten Abstimmung.
- Im Formular „📋 Mehrere Fragen mit Überschrift“ neu: **🖨️ Bogen ansehen / senden** – baut den Ankreuzbogen aus dem Entwurf (Überschrift, Fragen, Frist, geheim), mit „Für wen?“ und derselben Druckvorschau (🖨️ Drucken, 📄 PDF, 💬 In der Club-App senden). Nichts wird gespeichert, das Formular bleibt offen.
- Test: ap-browser.mjs, Vertragstest-Block 2.560.0. Server unverändert. Rückweg: App 2.559.0.

## 2.559.0 – 2026-10-21 – 💬 Ausdrucke als PDF-Anlage in der Club-App senden (KC-CLUB-DRUCK-SENDEN)
Wunsch Hansi („als Anlage in der Club-App senden – immer weniger mit WhatsApp, darum habe ich ja die Club-App gebaut“).
- In jeder Druckvorschau neu: **💬 In der Club-App senden** – macht dasselbe A4-PDF wie „📄 PDF“, lädt es wie einen Chat-Anhang hoch und öffnet „Neue Nachricht“ mit dem PDF als Anlage. Empfänger wählen (z. B. Klaus und Dieter), „Weiter zum Schreiben“, Text dazu, ➤.
- Gilt für alle Ausdrucke (Ankreuzbogen, Ergebnis, Brief, Protokoll-Vorlage …). Nichts geht an fremde Dienste.
- Test: ap-browser.mjs (PDF hochgeladen, Neue Nachricht mit Anlage), Vertragstest-Block 2.559.0. Server unverändert. Rückweg: App 2.558.0.

## 2.558.0 – 2026-10-21 – 🗳️ Ankreuzbogen als Tabelle, „Für wen?“ mit Namenssuche, Profil-QR oben rechts (KC-CLUB-ABSTIMMUNG-BOGEN-2)
Wunsch Hansi („saubere Tabelle zum Abstimmen, oben Kopf, Name entweder manuell aus Combobox suchen oder schon automatisch einsetzen, wenn über App, und rechts oben wieder den altbekannten QR-Code zur Identifizierung“).
- Ankreuzbogen als Tabelle je Bereich: Nr. · Frage (mit Erklärung, „mehrere möglich“, Folgefrage-Hinweis) · Antwort ankreuzen (☐ je Antwort untereinander). Kopfbogen oben, Fußzeile mit Name.
- Vor dem Druck „Für wen?“: 👤 für mich (Name und QR automatisch) · 🔍 für ein Mitglied (Namen eintippen, aus der Liste wählen) · 👥 für alle Mitglieder (je eine Seite) · ✏️ leer (Name von Hand).
- Oben rechts der bekannte Profil-QR wie auf Wunschbogen und Bestätigung (KCDP-FORM-PROFILE-1, Mitglieds-ID, Art club-abstimmung-v1, ref = Abstimmung). Geheim: ohne Namen und QR.
- Geht am Handy wie am PC (Druckvorschau, 📄 PDF, Teilen). Test: ap-browser.mjs (Tabelle, ich/Mitglied/alle), Vertragstest-Block angepasst. Server unverändert. Rückweg: App 2.557.0.

## 2.557.0 – 2026-10-21 – 🖨️ Abstimmung als Ankreuzbogen und Ergebnis auf dem Köcheclub-Kopfbogen (KC-CLUB-ABSTIMMUNG-DRUCK)
Wunsch Hansi („sauberes, ordentliches Ankreuzformular mit Köcheclub-Kopfbogen“ + Ergebnis als Schriftstück; „beides bauen und sofort einspielen“).
- Im Fenster einer Abstimmung mit mehreren Fragen: **🖨️ Ankreuzbogen** – A4 auf dem CD-Kopfbogen (Kochmütze, Köcheclub Werne, Fußzeile), Überschrift, Beschreibung, Name/Datum, alle Fragen nummeriert nach Bereichen mit ☐-Kästchen, Erklärungen, „☑️ mehrere möglich“, Folgefragen mit „↪️ nur ausfüllen, wenn bei Frage 5 „Ja“ angekreuzt ist“, Abgabefrist, Ort/Datum/Unterschrift. Geheim: ohne Namen und Unterschrift.
- **📊 Ergebnis drucken** – je Frage Balken (stärkste Antwort weinrot), Anzahl und Prozent, „9 von 12 haben abgestimmt“, Namen bei offenen Abstimmungen; „Zwischenstand“ solange sie läuft, sonst „Endergebnis (beendet am …)“. Geheime Fragen erst nach dem Ende.
- Beides über die vorhandene Druckvorschau (🖨️ Drucken, 📄 PDF, Teilen). Auf Papier Angekreuztes trägt die App nicht selbst ein.
- Vorlage „Technik, Bilderrechner, Abrechnung“: doppelter Hinweis bei „Wer zählt zu den Helfern?“ entfernt.
- Test: tools/abstimmung-paket/ap-browser.mjs (Bogen + Ergebnis), Vertragstest-Block 2.557.0. Server unverändert (2.556.0). Rückweg: App 2.556.0.

## 2.556.0 – 2026-10-21 – 📞 Anrufe stabiler (Neuaufbau bei Netzwechsel, schneller, schwaches Netz) · 🔐 neue Tabellen mit ausdrücklichen Rechten (KC-CLUB-ANRUF-BESSER, KC-SUPABASE-GRANTS, KC-CLUB-RC-NACHTRAG)
- KC-CLUB-ANRUF-BESSER (Wunsch Hansi „bau 2 bis 4 jetzt“): Bricht die Verbindung im Gespräch ab oder wechselt das Netz (WLAN ↔ Mobilfunk), baut die App sie bis zu 3-mal neu auf („🔄 Verbindung wird neu aufgebaut …“), erst danach endet das Gespräch. Aufbau schneller (Annehmen → verbunden 0,8 s statt 1,5 s; mit direkter Leitung 0,2 s), mit direkter Leitung im Gespräch halb so viele Nachfragen. Ton mit Fehlerkorrektur und Lautstärke-Ausgleich; bei schwachem Netz „📶 Verbindung schwach“, Bild erst kleiner, dann pausiert, Ton läuft weiter. Server: anruf_neu_angebot / anruf_neu_antwort (nur Beteiligte, nur angenommene Einzelgespräche). Konferenzen nur mit schnellerem Aufbau.
- KC-SUPABASE-GRANTS: Ab 30.10.2026 vergibt Supabase für neue Tabellen keine Rechte mehr von selbst – Regel in AGENTS.md und Test tests/migration-rechte.test.mjs.
- KC-CLUB-RC-NACHTRAG: Migration 20261020_kc_club_rc_nachtrag.sql (Eltern-Tabelle in der Spiegel-Liste, schreibende Verwaltungs-Funktionen nicht über PUBLIC).
- Tests: tests/anruf-besser.test.mjs, tools/anruf/anruf-browser.mjs (zwei echte WebRTC-Seiten). Server 2.556.0.

## 2.555.0 – 2026-10-21 – Abstimmung mit Überschrift und mehreren Fragen (KC-CLUB-ABSTIMMUNG-PAKET)
Wunsch Hansi („Abstimmung mit Überschrift – Technik, Bilderrechner, Abrechnung – und mehreren Fragen, z. B. Tablets jetzt beschaffen oder Leihgeräte, Stand vernetzen, Kommen/Gehen per QR-Code, Barcode mit Metallschildern“).
- Vorschläge → ＋ Neu → 🗳️ Abstimmung: neu die Wahl „❓ Eine Frage“ (wie bisher) oder „📋 Mehrere Fragen mit Überschrift“. Dann: Überschrift, Beschreibung, Bereiche (z. B. Technik, Abrechnung) mit beliebig vielen Fragen (höchstens 30), jede Frage mit eigenen Antworten (eine pro Zeile, vorbelegt Ja/Nein/Enthaltung). Geheim, Frist, „An wen?“, Termin und Anlage (z. B. Muster) gelten für die ganze Abstimmung.
- In der Liste eine Kachel je Abstimmung („📋 4 Fragen“, „👉 noch 3 offen“). Antippen zeigt alle Fragen nach Bereichen, jede mit Antwortknöpfen und Ergebnis; das Fenster bleibt beim Abstimmen offen und an derselben Stelle. Oben „Du hast 1 von 4 Fragen beantwortet“.
- Eine Benachrichtigung für die ganze Abstimmung (Push/Mail mit allen Fragen nach Bereichen); am Ende ein Ergebnis mit allen Fragen. „🏁 Abstimmung beenden“, „Zurückziehen“ und „🗑️ Löschen“ wirken auf alle Fragen (nur Clubleitung). Einzelne Fragen lassen sich mit ✏️ bearbeiten wie bisher.
- Je Frage zusätzlich: **Erklärung** (z. B. „Vorteil: genaue Auswertung nach dem Weihnachtsmarkt“), **☑️ Mehrere Antworten ankreuzen** (bis 12 Antworten; offen sofort gespeichert, geheim erst ankreuzen und einmal abgeben) und **„Nur zeigen, wenn …“** (Auswahl aus den Antworten der Fragen davor, z. B. „Wer zählt zu den Helfern?“ nur bei „Ja“ zu „Speisen/Getränke für Helfer kostenlos?“). Ändert jemand seine Antwort, fällt die eigene Stimme bei der nicht mehr passenden Folgefrage weg.
- **📄 Vorlage** (KC-CLUB-ABSTIMMUNG-VORLAGE): fertige Abstimmungen aus `vorlagen/abstimmungen.json` übernehmen, danach frei änderbar. Erste Vorlage „Technik, Bilderrechner, Abrechnung“ mit 12 Fragen (Technik 2, Bilderrechner 6, Abrechnung 4).
- Jede Frage bleibt eine normale Abstimmung (gleiche Stimmen-, Geheim- und Fristregeln); einzelne Abstimmungen unverändert. Mehrfach-Stimmen stehen als Liste in `wahl` und werden je Antwort gezählt (Liste, Ergebnis, Clubleben).
- Server 2.555.0: Aktion abstimmungspaket_speichern; vorschlag_status/vorschlag_loeschen mit „paket: true“. Datenbank: Spalte kc_club_vorschlaege.paket (Migration 20261021_kc_club_v2555_abstimmung_paket.sql – vor dem Server einspielen).
- Test: tools/abstimmung-paket/ap-browser.mjs (anlegen, Kachel, Fenster nach Bereichen, abstimmen, beenden, Einzelfrage wie bisher, Vorlage, Folgefrage, Mehrfachauswahl), Vertragstest-Block 2.555.0. Rückweg: App/Server 2.554.0; Spalte kann bleiben.

## 2.554.0 – 2026-10-21 – Pinnwand: Zettel nur bei Lesern abnehmen (KC-CLUB-PINNWAND-TEIL-AB)
- „🗑️ abnehmen“ fragt, wenn manche den Zettel schon gesehen haben und andere nicht: „🧹 Nur bei denen abnehmen, die ihn gelesen haben“ oder „Für alle abnehmen“.
- Wer ihn noch nicht gesehen hat, behält ihn; nach dem Lesen (30 Min. Zeit für Antworten/✓) fällt er auch dort ab. Haben ihn alle gesehen, ist er ganz weg.
- Verfasser/Clubleitung sehen „🧹 Bei Lesern abgenommen – hängt noch bei …“. Server 2.554.0, Spalte kc_club_pinnwand.teil_ab.

## 2.553.0 – 2026-10-21 – Geburtstags-Vogel größer, langsamer, mit Runde und Lied
- Vogel und Paket gut anderthalbmal so groß, Flug etwa doppelt so lang, eine Runde im Kreis vor dem Abwurf.
- Dazu leise das Ständchen „Happy Birthday“ (vorhandene Melodie), nur wenn Töne an sind.

## 2.552.0 – 2026-10-21 – Einstellungen als Übersicht (KC-CLUB-EINST-UEBERSICHT)
- Einstellungen beginnen mit einer Übersicht wie beim Handy: Gruppen „Für mich“, „Aussehen“, „Technik“, „Nur Admin“; jede Zeile mit Symbol, Inhalt und „x von y an“. Antippen öffnet den Bereich als eigene Seite (‹ Alle Einstellungen / Zurück-Taste).
- Klappfelder gut sichtbar (Goldrand, runder weinroter Knopf), Häkchen als Schalter (grün = an).
- Suche, Hilfe-Sprünge, Wegweiser unverändert; 🗂️ Kartei weiter wählbar (einmalig auf Übersicht zurückgestellt).

## 2.551.0 – 2026-10-20 – Geplante Nachricht vorher abrufen (KC-CLUB-GEPLANT-VORAB)
- Beim Planen einer einmaligen Nachricht fragt die App: Darf der Empfänger sie schon vorher abrufen? Bei Ja bekommt er sofort einen Hinweis (ohne Text) und im Chat einen Knopf „📩 Jetzt abrufen“; sonst kommt sie zur geplanten Zeit.
- Unter ⏰ bei der geplanten Nachricht: „📩 Vorher abrufen erlauben / 🔒 ausschalten“ (auch für schon geplante). Der Absender bekommt einen Push, wenn abgerufen wurde.
- Server 2.551.0: Aktion geplant_abrufen (nur andere Teilnehmer, Sperre des Absenders geprüft, nie doppelt); Spalte kc_club_geplant.vorab.

## 2.550.0 – 2026-10-20 – 🔑 Push an dich bei wiederholten Versuchen ohne gültigen Link (KC-CLUB-FEHLVERSUCHE)
Wunsch Hansi („herausfinden, wer ohne gültigen Zugang in unsere private App will“ → Vorschlag 1 „Ja“).
- Server: Öffnet dasselbe Gerät (anonyme Geräte-Kennung der App) die Club-App in 2 Stunden 3-mal ohne persönlichen Link oder mit ungültigem Link, bekommen die Admins einen Push: „🔑 3× versucht, die Club-App ohne persönlichen Link zu öffnen“ mit Gerätetyp (System, Browser wie von der App gemeldet), Uhrzeit und Geräte-Kennung. Je Gerät höchstens 1× am Tag, insgesamt höchstens 5 am Tag. Keine IP-Adresse.
- Der Google-Vorlesedienst gilt jetzt als Roboter und wird nicht mehr als Fehlversuch mitgeschrieben (Fund 20.10., 3:37 Uhr).
- Vertragstest-Block 2.550.0. Rückweg: Server 2.549.0.

## 2.549.0 – 2026-10-20 – ⏰ Wecker neben geplanten Nachrichten: Infos und „Ändern“ (KC-CLUB-GEPLANT-WECKER)
Wunsch Hansi („Zeige neben einer zeitgeplanten Nachricht rechts daneben einen Wecker. Wenn man drauf tippt, dann Infos anzeigen wie geplante Zeit usw. und einen Button Ändern“).
- Im Chat steht rechts neben jeder geplanten Nachricht ein ⏰ (klingelt beim Öffnen einmal kurz, ruhig bei „Bewegung reduzieren“).
- Antippen zeigt die Infos: wird gesendet (Zeit), wie oft, Benachrichtigung (🔔 Push / ✉️ E-Mail), ❗ wichtig, geplant am, zuletzt geändert, Fehler beim letzten Mal – dazu „✏️ Ändern“, „📤 Jetzt senden“, „🗑️ Löschen“.
- „✏️ Ändern“: 🕐 Zeit oder Wiederholung (bisherige Auswahl) oder 📝 Text der Nachricht (neu).
- Server 2.549.0: geplante Nachrichten liefern zusätzlich Wege, angelegt/geändert; beim Ändern darf auch der Text mitkommen (nur eigene, offene; gleiche Regeln wie beim Anlegen).
- Browser-Test (Wecker rechts, Infos, Ändern-Auswahl). Vertragstest-Block 2.549.0. Rückweg: App 2.548.0 / Server 2.541.0.

## 2.548.0 – 2026-10-20 – 🐪 Neues Thema Wüste: Pyramiden, Karawane, Oase, Pharao auf der Sänfte, Flaschengeist – Name aus Goldstaub, Sonnenuntergang · 🪶 Friedenspfeife langsamer (KC-CLUB-WUESTE, KC-CLUB-FRIEDENSPFEIFE-2)
Wunsch Hansi („Szene Wüste: im Hintergrund Pyramiden, vorne zieht eine Karawane vorbei, links eine Oase, dann kommt der Pharao – er wird auf einer Sänfte getragen –, rechts kommt ein Flaschengeist aus der Lampe“; Ende: „1 + 3, eigenes Thema, einspielen“).
- **🐪 Thema Wüste** (⚙️ → Themen; Vorschau unter ✨ Effekte): hinten drei Pyramiden mit Licht- und Schattenseite, Sonne darüber; links eine Oase mit Wasser, Palmen und Datteln; vorne zieht eine Karawane mit vier Kamelen (Reiter mit Turban, Decken, Gepäck) von rechts nach links.
- Ab 26 s wird der **Pharao auf seiner Sänfte** (Baldachin, vier Träger, Nemes-Kopftuch, Krummstab) bis zur Mitte getragen. Rechts steht eine goldene Lampe: sie wackelt, der **blaue Flaschengeist** steigt mit Rauchschweif heraus, schwebt zum Pharao und verbeugt sich.
- **Ende 1:** Er schnippt – aus der Lampe steigt **Goldstaub** und schreibt langsam (2,6 s je Buchstabe) den **Vornamen** in Goldschrift in den Himmel (ohne Namen „Köcheclub“). Danach wirbelt der Geist zurück in die Lampe, die Lampe wackelt, der Name verblasst, der Pharao wird davongetragen.
- **Ende 3:** **Sonnenuntergang** – die Sonne sinkt glutrot hinter die Pyramiden, Sterne und Halbmond gehen auf, die Karawane rastet mit kleinem Lagerfeuer an der Oase; dann wird es wieder Tag und alles beginnt von vorn (Lauf ≈ 95 s, richtet sich nach der Namenslänge).
- Design Sonnenuntergang, Laternen-Girlande, Kopf-Effekt Theater, Hilfe/Twinkey/Lupe ergänzt.
- **🪶 Friedenspfeife (Wilder Westen) langsamer** (Hansi: „der Name kommt zu schnell – das muss sich etwas hinziehen“): je Buchstabe bis 2,8 s statt 1,4 s, die Rauchwolke schwebt 2,4 s statt 1,6 s, der Buchstabe erscheint langsam; bei langen Namen so, dass er vor dem Verwehen fertig ist.
- Test: tools/wueste/wu-browser.mjs (zwei Läufe à 30 Bilder/s, alle Abschnitte), tools/wildwest/ww-browser.mjs angepasst, Vertragstest-Block 2.548.0. Rückweg: App 2.547.0.

## 2.547.0 – 2026-10-20 – Kochmütze mit „since 1991“ auf Holzklappe und Servierglocke (KC-CLUB-KOPF-EMBLEM)
Wunsch Hansi („Baue noch auf die Holzklappe und die Glocke die Kochmütze mit since 1991“).
- Kopf-Effekt 🎪 Holzklappe: neben dem Schild „Geschlossen“ die Kochmütze mit „since 1991“, hell wie eingebrannt.
- Kopf-Effekt 🛎️ Servierglocke: in der Mitte der Glocke dieselbe Marke, dunkel wie eingraviert (glänzt beim Öffnen mit).
- Gleiche CD-Kochmütze wie oben im Kopf, nur Bild, nicht antippbar. Browser-Test beider Effekte. Rückweg: App 2.546.0.

## 2.546.0 – 2026-10-20 – „since 1991“ jetzt im Knopf der Kochmütze (KC-CLUB-KOPF-SEIT-2)
Wunsch Hansi („Besser sähe es aus, wenn es mit im Button der Mütze ist – pack es darein“).
- Der Schriftzug steht jetzt im Kochmützen-Feld unter der (etwas kleineren) Mütze; das Feld bleibt 54 × 54 px, die Versionsnummer steht darunter wie vorher.
- Browser-Test bei 320 und 390 px: Schriftzug ganz im Knopf. Vertragstest angepasst + Block 2.546.0. Rückweg: App 2.545.0.

## 2.545.0 – 2026-10-20 – „since 1991“ unter der Kochmütze im Kopf (KC-CLUB-KOPF-SEIT)
Wunsch Hansi („Oben auf der Kopfseite ganz links ist die Kochmütze. Schreibe dort noch klein darunter „since 1991““).
- Klein, kursiv, in Beige aus dem Corporate Design direkt unter der Kochmütze, darunter wie bisher die Versionsnummer. Nicht antippbar (der Kochmützen-Knopf und die Version bleiben wie sie sind).
- Browser-Test bei 320 und 390 px: sichtbar, nichts läuft über. Vertragstest-Block 2.545.0. Rückweg: App 2.544.0.

## 2.544.0 – 2026-10-20 – 🔔 Eingerollter Kopf: der Pfeil blinkt bei Neuem (KC-CLUB-KOPF-PFEIL-NEU)
Wunsch Hansi („Wenn ich den Kopfbereich mit einem oder zwei Pfeilen hochfahre, sehe ich nicht, in welchem der 3 Felder neue Sachen ankommen – der Pfeil, mit dem hochgefahren wurde, soll blinken, wenn eine neue Nachricht da ist oder neue Mitglieder angemeldet sind“).
- Ist der Kopf mit ⌃ (halb) oder ⌃⌃ (ganz) eingerollt, blinkt der Pfeil dieser Stellung gelb-orange, sobald mehr ungelesene Nachrichten da sind, ein Mitglied neu online kommt oder die Mitgliederzahl steigt. Startet die App schon eingerollt, blinkt er auch bei vorhandenen ungelesenen Nachrichten.
- Ausrollen beendet das Blinken (dann sind die drei Felder wieder zu sehen). Ohne Bewegung (Effekte aus, Sparmodus) leuchtet der Pfeil fest statt zu blinken.
- Keine zusätzlichen Datenbank-Abfragen: es werden nur die vorhandenen Zahlen aus Abgleich und Online-Takt verglichen.
- Test: Vertragstest-Block 2.544.0, Browser-Probe (eingerollt + neue Nachricht → Pfeil blinkt, ausrollen → aus). Rückweg: App 2.543.0.

## 2.543.0 – 2026-10-20 – 🎬 Video „Geheim schreiben“: so kommt die verschlüsselte Nachricht beim Empfänger an (KC-CLUB-VIDEO-GEHEIM-2)
Wunsch Hansi („Wie sieht z. B. Klaus die verschlüsselte, wenn sie ankommt – einmal mit Schlüsselbund oder temporärem Schlüssel“ → „Ja, Video ergänzen und einspielen“).
- Fünf neue Stationen aus Sicht des Empfängers: 📲 die Mitteilung aufs Handy (kein Wort vom Inhalt), 🕵️ der Agent liefert ab (echter Ankunfts-Effekt im Beispiel-Chat), 🔑 Einmal-Schlüssel eintippen, ❌ Falscher Schlüssel, 🔑 mit Schlüsselbund öffnet sie sich von selbst.
- Nur Beispielbilder im Beispiel-Chat mit Anne – es wird nichts verschlüsselt, gesendet oder gespeichert. Video-Stand 2 (ca. 5 Min.).
- Test: tools/hilfe/hilfe-nachtrag4-browser.mjs (17 Schritte, jedes Pflicht-Ziel sichtbar, nichts an den Server), Vertragstest-Block 2.543.0. Rückweg: App 2.542.0.

## 2.542.0 – 2026-10-20 – 💬 Chats mit neuen Nachrichten sind in der Übersicht markiert (KC-CLUB-CHAT-NEU-MARKIERT)
Wunsch Hansi („Wenn man in die Nachrichten-Übersicht reingeht, sollen die Zeilen markiert sein, wo neue Nachrichten drin sind – Ameisenlauf, Blinken oder die Anzahl blinkt“).
- Alle drei Ideen kombiniert, aber ruhig: Beim Öffnen läuft 5 s ein Ameisenrahmen um jeden Chat mit Neuem (vorhandener Rahmen der hervorgehobenen Gruppe, höchstens 1× je Minute), die rote Zahl pulsiert 3×. Danach bleibt die Zeile leicht golden getönt mit roter Leiste links und fettem Namen – bis gelesen.
- Gilt in der Liste und in der Chat-Kartei; stummgeschaltete Chats werden nicht hervorgehoben. Bei „Bewegung reduzieren“ im Handy pulsiert nichts.
- Test: Vertragstest-Block 2.542.0, Browser-Test (2 neue Chats markiert, gelesener normal). Rückweg: App 2.541.0.

## 2.541.0 – 2026-10-20 – 👀 Push an dich, wenn ein Gesperrter die Club-App öffnen will (KC-CLUB-SPERRE-MELDUNG)
Wunsch Hansi („Informiere mich, wenn Thomas sich anmelden will“).
- Server: Öffnet eine gesperrte Person die App, bekommen die Admins einen Push „👀 <Name> wollte die Club-App öffnen – Gesperrt (Wartung) – sah nur den Hinweis“. Gleiche Drossel wie der Protokolleintrag aus 2.539.0: höchstens einmal je 10 Minuten und Person. Läuft im Hintergrund; die gesperrte Person merkt davon nichts.
- Test: Vertragstest-Block 2.541.0. Rückweg: Server 2.540.0.

## 2.540.0 – 2026-10-20 – 🔒 Gesperrte: kein Notfall-Paket und kein gespeicherter Offline-Stand mehr (KC-CLUB-SPERRE-NOTPAKET, KC-CLUB-SPERRE-OFFLINE)
Prüfung nach Hansis Auftrag (20.10.: „Prüfe jetzt nochmal alles, dass er nicht ins Programm kommt, die Wartung sieht, keine Push und E-Mail bekommt – also keinerlei Kommunikation“).
- Lücke 1: Das Notfall-Paket (Notbetrieb bei Ausfall von Supabase) enthielt auch für Gesperrte Termine und Chats. Jetzt baut es nur noch für nicht Gesperrte; sind die Sperren nicht lesbar, wird nicht gebaut (altes Paket bleibt).
- Lücke 2: Die App merkt sich einen Stand für den Offline-Start. Bekommt sie vom Server „gesperrt“ (423), löscht sie diesen Stand.
- Geprüft und schon dicht: App (Wartungs-Bildschirm bei jedem Aufruf), Kalender-Abo (403 bei Sperre), direkte Leitung (2.426.0), Push/E-Mail (stumme Sperre + Liste „Ohne Benachrichtigungen“), Termine-Mails (kc-termine), Nachtrag aus dem Notbetrieb.
- Test: Vertragstest-Block 2.540.0. Rückweg: App/Server 2.539.0.

## 2.539.0 – 2026-10-20 – 👀 Gesperrte: Öffnungsversuche werden aufgezeichnet und in der Sperrliste angezeigt (KC-CLUB-SPERRE-VERSUCHE)
Hansi (20.10.: „Ich möchte ihn sperren. Er bekommt ja dann Wartung angezeigt. Du zeichnest es ja auf, wenn er sich anmelden will.“) – bisher wurde das NICHT aufgezeichnet.
- Server: Öffnet eine gesperrte Person die App, kommt vor dem Wartungs-/Störungs-Bildschirm ein Protokolleintrag `gesperrt_versuch` (Art der Sperre, Name der Aktion – keine Inhalte), höchstens einmal je 10 Minuten und Person.
- Admin → 🛠️ Wartung → „Zurzeit gesperrt“: je Person „👀 n× versucht, die App zu öffnen · zuletzt …“ bzw. „seit der Sperre nicht versucht“ (Lesefehler → „unbekannt“, nie 0).
- Gesperrt mit 📵 (keine Push/E-Mail) gilt jetzt auch für das Ausgrauen in den Empfänger-Listen (2.538.0).
- Test: Vertragstest-Block 2.539.0, Browser-Test der Sperrliste. Rückweg: App/Server 2.538.0.

## 2.538.0 – 2026-10-20 – 📵 Wer keine Benachrichtigungen bekommt, ist in allen Empfänger-Listen ausgegraut (KC-CLUB-KOMMUNIKATION-AUS-GRAU)
Wunsch Hansi („Dass wenn jemand Nachricht an alle auswählt oder Terminanfrage usw. Thomas ausgegraut ist und nicht gewählt werden kann“).
- Die Mitgliederliste vom Server meldet je Person `ohne_komm` (aus der Registry `kc_club_kommunikation_aus`).
- Ausgegraut, nicht ankreuzbar, mit Hinweis „📵 keine Benachrichtigungen“ in: Neue Nachricht/Rundnachricht, Zentrale, Terminanfrage, Frage an Mitglieder, Pinnwand-Zettel für Personen, Abstimmung (Auswahl), Gruppe anlegen/bearbeiten, To-do „Wer?“. Wer schon gewählt war (z. B. alte Gruppe), bleibt abwählbar.
- „👥 Alle“, Ämter und „🟢 Online“ wählen sie nicht mit. Der Server sendet ihnen ohnehin nichts (2.536.0).
- Test: Vertragstest-Block 2.538.0, Browser-Test (Liste, Alle, Terminanfrage, Zentrale, To-do). Rückweg: App/Server 2.537.0.

## 2.537.0 – 2026-10-20 – 📵 Admin-Schalter „Ohne Benachrichtigungen“ (KC-CLUB-KOMMUNIKATION-AUS-SCHALTER)
Wunsch Hansi („Ja, Schalter im Admin-Bereich einbauen, dann kann ich ihn komplett aus der Kommunikation rausnehmen“).
- Neue Admin-Kachel **📵 Ohne Benachrichtigungen**: zeigt, wer zurzeit keine Push/E-Mail bekommt, mit Knopf „🔔 Wieder benachrichtigen“. „＋ Mitglied herausnehmen“ öffnet die Mitgliederliste mit Suche – antippen, Rückfrage bestätigen, fertig.
- Server: Aktionen `komm_aus_liste` / `komm_aus_setzen` (nur Admin, nicht sich selbst) pflegen die Registry `kc_club_kommunikation_aus` aus 2.536.0; wirkt sofort, auf anderen Server-Instanzen nach höchstens 60 s. Jede Änderung im Protokoll.
- Test: Vertragstest-Block 2.537.0, Browser-Test der Kachel. Rückweg: App/Server 2.536.0 (Liste bleibt erhalten).

## 2.536.0 – 2026-10-20 – Keine Benachrichtigungen: Mitglieder ganz aus der Club-Kommunikation herausnehmen (KC-CLUB-KOMMUNIKATION-AUS)
Wunsch Hansi (20.10.: „Thomas Hess möchte aus der Kommunikation der Club-App herausgenommen werden … auch wenn ich eine Nachricht an alle schreibe, bekommt er nix. Stelle das sicher.“).
- Befund: Die Haken in den Einstellungen gelten nur, solange der Absender „wie eingestellt“ sendet. Wählt er 🔔/✉️ ausdrücklich, bei Express, Notfall oder als Kopie ging die Nachricht trotzdem raus.
- Neu: Registry `kc_club_kommunikation_aus` (nur Server). Wer dort steht, bekommt über keinen Weg der Club-App (kc-club) und der Termine (kc-termine) Push oder Mail – geprüft an der einen Stelle, durch die jeder Versand läuft (wie die stumme Sperre). Chats und Inhalte bleiben in der App sichtbar.
- Ist die Liste nicht lesbar, gilt der letzte bekannte Stand; gibt es noch keinen, wird nicht gesendet (Regel 11).
- Nicht betroffen: andere Programme (KICC-Handmail, Weihnachtsmarkt-Umfrage).
- Test: Vertragstest-Block 2.536.0. Rückweg: App/Server 2.535.0, Tabelle bleibt unschädlich.

## 2.535.0 – 2026-10-20 – Notfall-Paket: Pause nach Fehlschlag · Teilen: ehrliche Meldung, wenn das Handy nichts mitschickt
Anlass: Lastwarnung 20.10.2026 16:03 („10417 SQL-Aufrufe / 15 Min., Ursache unbekannt“) und Hansis Rechnung-PDF (1,2 MB), die beim Teilen leer ankam.
- **Server – KC-CLUB-NOTPAKET-FEHLERPAUSE:** Das Notfall-Paket (~3.000 Abfragen je Bau) scheiterte um 15:45 (Zeitlimit 546) und 16:00 (Datenbank-Zeitgrenze, 503). Weil der 3-Stunden-Abstand seit dem letzten guten Paket schon um war, baute jeder 15-Min.-Lauf sofort neu. Jetzt nach einem Fehlschlag immer frühestens nach 30 Min. (nicht bei „erzwingen“). Fehlschläge kommen als `notpaket_fehler` ins Protokoll (Grundlage, damit die Lastwarnung die Ursache nennen kann).
- **App – KC-CLUB-TEILEN-LEER korrigiert:** Die Meldung nannte als Grund „Dateityp unbekannt“ und empfahl Neu-Installieren. Am 20.10. kamen PDFs (106 KB, 158 KB) aus demselben Dateimanager aber an – nur die größere nicht. Neue Meldung: das Handy hat keine Datei mitgeschickt, bitte über 📎 anhängen (bis 8 MB).
- **KC-CLUB-TEILEN-GROESSE:** Der Service Worker hält bei jedem Teilen fest, wie groß die Sendung vom Handy war (nur Zahl, keine Inhalte) – so sieht man, ob eine große Datei leer ankam.
- Test: Vertragstest-Block 2.535.0. Rückweg: App 2.534.0 / Server 2.529.0 erneut einspielen.

## 2.534.0 – 2026-10-20 – 🧭 „Einstellungen erklärt“: alle Einstellungen wie im Explorer (KC-CLUB-EINST-WEGWEISER)
Wunsch Hansi („spezielle Anleitung – Voreinstellungen leicht gemacht: die gesamten Möglichkeiten auflisten und kurz erklären … als eigene Kachel unter Technik, wie der Explorer bei Windows; Überschrift z. B. ‚Farben einstellen‘, antippen, dann kommt die Erklärung“).
- **Neue Kachel „🧭 Einstellungen erklärt“** unter Technik: alle Einstellungen als Ordner-Baum (Bereiche wie in ⚙️, ▸ klappt auf, daneben die Anzahl). Jede Einstellung mit ihrem aktuellen Stand (✅ an / ⬜ aus / gewählter Wert). **Antippen** klappt die Erklärung auf: „Was bewirkt das?“, „Jetzt: …“, wo sie in ⚙️ steht – dazu **👉 Hinbringen** (öffnet ⚙️, klappt den Bereich auf, der Schalter leuchtet), **📖 Ganze Hilfe** (wenn es einen Hilfe-Text dazu gibt) und **🎬 Video** zum Bereich.
- **Suche** oben (auch per 🎤, verzeiht Tippfehler), **▾ Alle auf**, **🖨️ Als Schriftstück** (Druck/PDF mit Inhaltsverzeichnis, je Bereich alle Einstellungen mit Erklärung und aktuellem Stand).
- **Immer aktuell:** Der Wegweiser liest die Einstellungen direkt aus der Seite ⚙️ – neue Einstellungen erscheinen von selbst. Es gilt dieselbe Sicht: einfache Ansicht nur ihre Einstellungen. **Nichts über den Admin** (Wunsch Hansi „aber nix über Admin, Inkognito, was der Admin sehen kann usw.“): Admin- und Leitungs-Bereich, Inkognito, Brille und Admin-Schalter fehlen – auch beim Admin –, Sätze und Hilfe-Texte, die vom Admin reden, werden weggelassen; „Runde Geburtstage“ erklärt nur noch „die Clubleitung“. Dazu in den Hilfen von 2.533.0 (Verschlüsseln, Ablagekorb, Video „Geheim schreiben“, Twinkey) die Erwähnungen des Admins herausgenommen. Wo ⚙️ keinen grauen Hinweis hat (rund 30 Einstellungen, z. B. Push-Knopf, Ruhezeit von/bis, Kontaktdaten sichtbar, Notfallkontakt, Stimmen, Spiele, Handy-Kalender, Tag/Nacht), steht jetzt eine Erklärung im Wegweiser (Liste `EW_ERKL`).
- Nur lesen: Der Wegweiser stellt nichts um; keine eigene Datenbank-Abfrage (füllt die Werte wie beim Öffnen von ⚙️ – dafür ist der Füll-Teil jetzt die Funktion `einstFuellen()`).
- Hilfe-Eintrag „Alle Einstellungen erklärt – wie im Explorer“, Lupe-Treffer, Twinkey-Frage „Was bewirken die ganzen Einstellungen?“, Sprachbefehl „Einstellungen erklärt“.
- Test: `tools/einst-wegweiser/ew-browser.mjs` (109 Einstellungen in 10 Bereichen, alle mit Erklärung; Erklärung, Suche, Hinbringen, Schriftstück, einfache Ansicht, Admin, nichts umgestellt, keine Abfrage) · Vertragstest-Block 2.534.0.
- Rückweg: App 2.533.0 erneut einspielen.

## 2.533.0 – 2026-10-20 – 🕵️ Hilfe neu aufgebaut: Video „Geheim schreiben“, Twinkey, Lupe und Sprachsuche zu allen Neuheiten · 🪶 Friedenspfeife im Wilden Westen (KC-CLUB-HILFE-NACHTRAG-4, KC-CLUB-VIDEO-GEHEIM, KC-CLUB-FRIEDENSPFEIFE)
Wunsch Hansi („Prüfe alles und baue die Hilfen neu auf wie Twinkey, Lupe, Suchfunktion, Sprachsuche, Video auch mit Verschlüsselung usw.“). Geprüft wurden alle Neuheiten seit dem letzten Nachtrag (2.508.0–2.532.0) gegen Hilfe-Zentrum, Twinkey, Lupe, Sprachsteuerung und Erklär-Videos – nur Mitglieder-Funktionen.
- **Neues Erklär-Video „🕵️ Geheim schreiben: verschlüsseln & Schlüsselbund“** (Thema „Schreiben & Kontakt“, ca. 3 Min.): an einem Beispiel-Zweierchat mit Anne – die kleine Zeile (▾ ⌨️ 🔊 🔒), Schloss an, Rückfrage „Ja, mit Schlüssel / Normal senden“, Schlüssel festlegen und auf anderem Weg weitersagen, 🔑 und Geheimagent beim Senden, verschlossene und geöffnete Nachricht, ⋮ → Schlüsselbund, fünf Schlüssel als Datei, Grenzen. Es wird nichts verschlüsselt, gesendet oder gespeichert (Platzhalter-Blasen, Beispielbilder, Weiche vor api nur für den Beispiel-Chat); am Ende ist alles wie vorher.
- **Video „Hilfe, Suche & Twinkey“ Fassung 2:** die Lupe in Aktion (Beispielwort „verschlüsselt“, nur Treffer unter den App-Funktionen – ohne Server-Anfrage und ohne eigenen Verlaufseintrag) und die 🎤 Sprachsuche. **„Chat für Fortgeschrittene“ Fassung 2:** „✍️ Anne schreibt dir gerade“ außerhalb des Chats; Haken-Erklärung nach KC-CLUB-RT-PUSH-ANGEZEIGT.
- **Hilfe-Zentrum:** neu „🔑 Schlüsselbund“, „📝 Normal, ❗ Wichtig oder 🏎️ Express – die Leiste über dem Schreibfeld“, „✍️ … schreibt dir gerade“, „📄 Aus jeder Druckvorschau ein PDF“, „💬 Die Meldung oben blinkt zweimal“. Auf den neuen Stand gebracht: „Nachricht verschlüsselt senden“ (Rückfrage, Schloss geht beim Chatwechsel aus, Geheimagent, „Zeig mir“ startet das Video), „Wer bringt deine Nachricht?“ (Geheimagent bei jeder verschlüsselten Nachricht), Haken und „Wer hat gelesen?“ (zwei graue Haken, sobald die Mitteilung angezeigt wird), „Fotos aus der Galerie“ und „Teilen → Köcheclub“ (Ablagekorb, jeder Dateityp, Dubletten-Hinweis, Abhilfe), „Kurz erklärt“ bei Nachrichten (Versand-Leiste, 🔒) und Fotoalbum (▶️ Diashow).
- **Twinkey:** 13 neue Fragen (verschlüsselt senden, „will gar nicht verschlüsseln“, verschlüsselte Nachricht öffnen / Schlüssel vergessen, Schlüsselbund, Geheimagent, wo Wichtig und Express sind, Teilen → Ablagekorb, „schreibt dir gerade“, Tippgeräusch schnell aus, nur ein Haken, Erstattung als PDF, Vorschlag für eine Sitzung ohne Datum, Wilder Westen); Antwort „Diashow“ nennt den neuen Knopf im Fotoalbum; Wörter wie geheim, Schloss, Kennwort, Schlüsselbund, Ablagekorb, PDF, Cowboy führen zur richtigen Antwort; Twinkey bietet Hilfetext und Video an. Korrektur: Tipp „Nachts Ruhe“ bot sein Video nie an (Schlüssel `h:ruhe` statt `t:ruhe`).
- **Lupe:** 10 neue Treffer (verschlüsselt senden, Schlüsselbund, Video Geheim schreiben, Schloss aus, Versand-Leiste, Tippgeräusch aus, „schreibt dir gerade“, Teilen/Ablagekorb, Diashow aus dem Fotoalbum, PDF aus der Druckvorschau) – auch mit Tippfehlern.
- **Sprachsuche:** „verschlüsselt schreiben“, „geheime Nachricht“, „Schlüsselbund“, „Diashow (starten)“, „Ablagekorb“, „Versand-Leiste“ öffnen die Lupe mit dem passenden Treffer („Nachricht an Klaus …“ bleibt eine Nachricht).
- Nur App, keine Datenbank-Abfrage mehr. Test: `tools/hilfe/hilfe-nachtrag4-browser.mjs` (alle drei Videos Schritt für Schritt: Ziele sichtbar, nichts an den Server, kein Schlüssel gespeichert, am Ende alles zurück; Twinkey, Lupe, Sprachsuche) · Vertragstest-Block 2.533.0.
- **🪶 Friedenspfeife (KC-CLUB-FRIEDENSPFEIFE, Wunsch Hansi „Der Häuptling soll eine Friedenspfeife rauchen und daraus entsteht wieder Buchstabe für Buchstabe der Username“):** Im Thema „🤠 Wilder Westen“ hält der Häuptling ab 3 s die Friedenspfeife (Holzstiel, roter Steinkopf, zwei Federn), ein feiner Rauchfaden steigt auf. Je Buchstabe ein Zug – die Glut leuchtet auf –, eine Rauchwolke steigt hoch, schwebt an ihren Platz über den Tafelbergen und wird zum Buchstaben des Vornamens (weiße, leicht schwebende Rauchschrift; ohne Vornamen „Köcheclub“, höchstens 12 Buchstaben). Ab 26 s verweht der Wind den Namen – rechtzeitig vor dem Duell (29 s). Alles aus der Zeit im Lauf berechnet, nur Bild. Hilfe-Eintrag und Twinkey-Antwort „Wilder Westen“ ergänzt. Test: `tools/wildwest/ww-browser.mjs` (Pfeife, Glut, Namenszeiten und Lage).
- Rückweg: App 2.532.0 erneut einspielen.

## 2.532.0 – 2026-10-20 – 🤠 Wilder Westen: Indianer und Häuptling, Saguaro-Kakteen, Steppenläufer, Duell mit Abtransport (KC-CLUB-WILDWEST-2)
Wunsch Hansi („es fehlen noch 2 Indianer und ein Häuptling, rechts ein paar Kakteen so groß wie im Westen, ab und an ein Windstoß, der einen Ballen weht, und 2 Cowboys, die sich duellieren – dann kommt eine flache Kutsche und der Verwundete wird abtransportiert“):
- Am Lagerfeuer sitzen zwei Indianer (einer hebt ab und zu die Hand), daneben steht der Häuptling mit Federhaube und verschränkten Armen. Wenn der Boden bebt, laufen alle drei vor der Herde davon – im nächsten Lauf sind sie wieder da.
- Rechts zwei große Saguaro-Kakteen und ein kleiner Kugelkaktus mit Blüte.
- Ab und zu ein Windstoß (Windstriche), der einen Steppenläufer-Ballen hüpfend durchs Bild rollt.
- Duell: zwei Cowboys kommen, stehen sich gegenüber, ziehen – Mündungsfeuer, „PENG!“, einer fällt um (der Hut fliegt), der Sieger geht davon. Ein flacher Wagen kommt, der Verwundete wird mit Kopfverband aufgeladen und abtransportiert.
- Zeitplan so verschoben, dass sich nichts überschneidet (Reiter 8 s/56 s, Kutsche 13 s/64 s, Duell 29–56 s, Herde 77 s). Alles nur Bild, keine Datenbank.
- Test: `tools/wildwest/ww-browser.mjs` erweitert (Steppenläufer, Duell und Abtransport über 800 Bilder ohne Fehler) · Vertragstest-Block 2.532.0.
- Rückweg: App 2.531.0 erneut einspielen.

## 2.531.0 – 2026-10-20 – Korrektur: geplante, selbstlöschende und vorgemerkte Nachrichten im Chat wieder sichtbar
Fehler aus 2.529.0 (KC-CLUB-VN-RUECKFRAGE): Ein Kommentar stand mitten in einer Zeile und schaltete dahinter drei Aufrufe ab – im offenen Chat fehlten seitdem die eigenen geplanten Nachrichten („später senden“), die Selbstlösch-Anzeige und die ohne Netz vorgemerkten Nachrichten. Jetzt wieder auf eigener Zeile. Neuer Vertragstest prüft genau diese Zeile; alle Änderungen seit 2.494.0 auf dasselbe Muster durchsucht – keine weitere Stelle.
- Rückweg: nicht sinnvoll (2.529.0/2.530.0 enthalten den Fehler).

## 2.530.0 – 2026-10-20 – 🕵️ Geheimagent bringt verschlüsselte Nachrichten · 🔑 Schlüssel beim Senden (KC-CLUB-GEHEIMAGENT)
Wunsch Hansi („Beim Versenden mit Schlüsselbund kurz einen Schlüssel zeigen … welche besondere Figur könnte die verschlüsselte wegbringen?“ → „🕵️ Geheimagent“).
- Beim Senden einer verschlüsselten Nachricht (🔒 Kennwort oder Schlüsselbund) blitzt am Senden-Knopf kurz ein goldener 🔑 Schlüssel auf und dreht sich wie im Schloss. Danach läuft ein Geheimagent (Hut, Sonnenbrille, Trenchcoat, Aktenkoffer) mit der Nachricht davon – statt des gewählten Boten.
- Beim Empfänger kommt der Geheimagent ebenfalls an, bleibt kurz stehen, der Schlüssel dreht sich, das Kofferschloss springt auf.
- Express behält Vorrang (Rennwagen). „Effekte aus“ gilt weiter. Hilfe-Eintrag „Wer bringt deine Nachricht?“ ergänzt. Nur App.

## 2.529.0 – 2026-10-20 – 🤠 Thema „Wilder Westen“ · 🔒 Schloss fragt erst · ✍️ „… schreibt dir gerade“ auch außerhalb des Chats (KC-CLUB-WILDWEST, KC-CLUB-VN-RUECKFRAGE, KC-CLUB-SCHREIBT-HINWEIS) · Server 2.529.0
Wunsch Hansi („neue Szene Wild West: links ein Indianerzelt, davor ein Lagerfeuer, am Horizont laufen Büffel, ab und an reiten 2 Cowboys vorbei, zwischendurch eine Kutsche – dann eine riesige Büffelherde, trampelt alles nieder, Staubwolke, Szene fängt wieder von vorne an“):
- Unten im Kopf der Startseite die Prärie: links ein Tipi, davor knistert ein Lagerfeuer (Funken, leichter Rauch). Am Horizont ziehen kleine Büffel vor Tafelbergen und Kakteen.
- Zweimal je Lauf reiten zwei Cowboys vorbei (einer schwingt das Lasso), zweimal rumpelt die Postkutsche „KÖCHECLUB“ durch.
- Zum Schluss bebt der Boden: eine riesige Büffelherde donnert von rechts heran, trampelt Zelt und Feuer nieder, eine Staubwolke deckt alles zu – aus dem Staub heraus beginnt die Szene von vorn (nahtlos, ein Lauf ≈ 96 s).
- Thema „🤠 Wilder Westen“ (Design Ocker, Western-Schrift, Wimpel in Westernfarben), Vorschau unter ⚙️ → ✨ Effekte, Hilfe-Eintrag, Suchwörter. Alles nur Bild, nichts wird gespeichert oder gesendet; keine Datenbank-Abfrage.
- Tests: `tools/wildwest/ww-browser.mjs` (echtes app.js, zwei Läufe à 30 Bilder/s: Ablauf, Niedertrampeln, Staubwolke, nahtloser Neustart) · Vertragstest-Block 2.529.0.
- **🔒 Schloss fragt erst (KC-CLUB-VN-RUECKFRAGE, Fund Hansi „ich wollte Klaus antworten, soll aber eine Verschlüsselungsnummer eingeben – ich will gar nicht verschlüsseln“):** Das Schloss am Schreibfeld (neben ▾ ⌨️ 🔊) war aus Versehen an; Abbrechen der Schlüssel-Frage hieß „nicht senden“. Jetzt fragt die App zuerst „🔒 Ja, mit Schlüssel“ oder „✉️ Normal senden“ – „Normal senden“ schaltet das Schloss aus und schickt die Nachricht wie immer. Beim Wechsel in einen anderen Chat geht das Schloss von selbst aus. (Mit Schlüsselbund bleibt alles wie bisher.)
- **✍️ „Hansi schreibt dir gerade …“ auch außerhalb des Chats (KC-CLUB-SCHREIBT-HINWEIS, Wunsch Hansi):** Ist jemand in der App, hat den Einzelchat aber nicht offen, erscheint oben kurz „✍️ Hansi schreibt dir gerade …“, „🗣️ Hansi diktiert dir gerade eine Nachricht …“ oder „🎤 Hansi nimmt gerade eine Sprachnachricht für dich auf …“ – Antippen öffnet den Chat, die ankommende Nachricht nimmt den Hinweis weg. Nur Einzelchats, nicht bei stumm geschalteten Chats; wer die Online-Anzeige aus hat, meldet wie bisher nichts. Im Chat steht jetzt auch „🗣️ … diktiert …“. Kostet nichts extra: es nutzt die Signale der direkten Leitung. DB: `supabase/migrations/20261020_kc_club_rt_spricht.sql` (Trigger: Signal „spricht“/„diktiert“; keine neue Spalte).
- Tests dazu: `tools/chat-sparsam/schreibt-hinweis-browser.mjs` (Schloss-Rückfrage, Chatwechsel, Hinweis außerhalb des Chats, Diktat) · `tools/chat-sparsam/rt-spricht-test.mjs` (Trigger in Postgres 16 im Speicher).
- Rückweg: App/Server 2.528.0/2.527.0 erneut einspielen; `drop trigger kc_club_rt_spricht on public.kc_club_tippen;`

## DB – 2026-10-20 (ohne App-Build) – Graue Haken sofort, wenn der Push auf dem Handy angezeigt wird (KC-CLUB-RT-PUSH-ANGEZEIGT)
Wunsch Hansi („Warum bekommt man bei WhatsApp graue Haken, sobald es auf dem Handy angekommen ist? Bei uns sieht man lange nur einen Haken“ → „Ja, bauen und sofort einspielen“).
- Ursache: Meldete das Handy „Push angezeigt“, erfuhr das die App des Absenders nur beim nächsten Nachsehen. Seit 2.510.0 fragt sie bei stehender Leitung nicht mehr alle 4 s nach, sondern verlässt sich auf Signale – für „Push angezeigt“ gab es aber keins. Folge: graue Haken erst nach 30–60 s oder später.
- Jetzt: Wechselt der Versandauftrag eines Chat-Pushes auf „angezeigt“ oder „geöffnet“, bekommt der Absender sofort das Signal (wie bei „angekommen/gelesen“) – die zwei grauen Haken kommen im Mittel ~5 s nach dem Zustellen. Nur Chat-Pushes der Club-App, nur beim Wechsel, nur Signal; ein gestörtes Signal kann die Zustellung nie stören.
- Grenze (wie bei jeder Web-App): Zeigt ein Handy den Push nicht an oder meldet nichts zurück (Stromsparen, Mitteilungen aus, manche iPhones – 7 Tage: 27 von 59 Pushes mit Rückmeldung), kommen die grauen Haken erst, wenn der Empfänger die App öffnet.
- DB: `supabase/migrations/20261020_kc_club_rt_push_angezeigt.sql` (bereits eingespielt; live geprüft: Absender bei 57 von 59 Chat-Pushes gefunden, die übrigen 2 Nachrichten sind gelöscht). Test: `tools/chat-sparsam/rt-push-angezeigt-test.mjs`.
- Rückweg: `drop trigger kc_club_rt_push_angezeigt on public.kc_communication_requests;`

## 2.528.0 – 2026-10-20 – 📝❗🏎️ Versand-Leiste erst beim Schreiben (KC-CLUB-VERSAND-BEIM-SCHREIBEN)
Wunsch Hansi („Die Leiste mit Express usw. erst einblenden, wenn Text eingetragen wird“). Die Leiste konnte das schon – für den Admin stand die Einstellung „Versand-Leiste immer zeigen“ aber von Haus aus auf an. Jetzt ist für alle (auch den Admin) „erst beim Schreiben“ der Standard; die alte Voreinstellung greift nicht mehr (neuer Speicherplatz). Wer sie immer sehen möchte: ⚙️ → „Versand-Leiste immer zeigen“. Mit Anhang oder gewähltem ❗/🏎️ bleibt sie sichtbar. Abmelden löscht auch die neue Einstellung. Nur App. Tests grün; Browserprobe als Admin mit alter „immer“-Einstellung: leeres Feld → Leiste versteckt, „Hallo“ getippt → sichtbar.

## DB – 2026-10-20 (ohne App-Build) – Chat-Nachfrage schneller (KC-CLUB-CHAT-STAND-TEMPO)
Wunsch Hansi („Ja dann optimiere die Chat Nachfrage“). Die kurze Chat-Nachfrage (Fingerabdruck, 2.510.0) brauchte im Schnitt 80 ms – fast alles Planung der großen Abfrage bei jedem Aufruf.
- `kc_club_chat_stand` ist jetzt plpgsql statt SQL: dieselbe Abfrage Zeichen für Zeichen, Postgres merkt sich den Plan je Datenbank-Verbindung. Gleiche Signatur, gleiche Rechte (nur der Server), gleicher Fingerabdruck – App und Server unverändert.
- Live vor dem Einspielen geprüft (nur lesend, Prüf-Funktion nur vorübergehend): 149 Fingerabdrücke alt = neu, je Aufruf Ø 7,3 → 1,5 ms.
- DB: `supabase/migrations/20261020_kc_club_chat_stand_plpgsql.sql` (bereits eingespielt). Test: `tools/chat-sparsam/chat-stand-test.mjs` rechnet in jeder Testwelt beide Fassungen und verlangt Gleichheit (56 von 56).
- Rückweg: `supabase/migrations/20261020_kc_club_chat_stand.sql` erneut ausführen.

## 2.527.0 – 2026-10-20 – 📅 Vorschläge: übernächste Sitzung schon vorwählen (KC-CLUB-VORSCHLAG-SPAETER) · Server 2.527.0 · Datenbank
Wunsch Hansi („bei Vorschläge: jetziges Datum oder nächste oder übernächste Sitzung (Datum noch nicht bekannt) – aber schon mal vorwählen“).
- Unter „Für welchen Termin?“ stehen wie bisher die geplanten Termine mit Datum; fehlen Sitzungen bis zur übernächsten, kommen **„📅 Nächste/Übernächste Sitzung – Datum noch offen“** dazu (auch beim Bearbeiten).
- Der Vorschlag zeigt dann „für die übernächste Sitzung (Datum folgt)“. Sobald die Sitzung angelegt ist (Termin der Art „Treffen“), ordnet der Server ihn automatisch zu – beim Speichern des Termins und beim Laden der Vorschläge.
- Datenbank: `kc_club_vorschlaege.sitzung_nr` (1–3) und `sitzung_ab` (Migration `20261020_kc_club_v2527_vorschlag_sitzung_spaeter.sql`).
- Hilfe-Eintrag „Vorschlag für eine spätere Sitzung“.
- Tests: Vertragstests grün; Browserprobe (Auswahl mit „Übernächste Sitzung – Datum noch offen“, gesendet als sitzung_nr 2), keine Fehler.

## 2.526.0 – 2026-10-20 – 📄 Erstattungsantrag auf dem Club-Briefbogen als PDF · ▶️ Diashow im Fotoalbum · Teilen: klare Abhilfe (KC-CLUB-ERSTATTUNG-BRIEFBOGEN, KC-CLUB-DRUCK-PDF, KC-CLUB-FOTO-DIASHOW, KC-CLUB-TEILEN-LEER)
Drei Wünsche/Funde von Hansi, eine Version:
- **Erstattung auf dem Kopfbogen** („wenn ein Mitglied eine km- oder sonstige Erstattung einreicht, auf den Kopfbogen des Köcheclubs als PDF für einen vernünftigen Ausdruck – und den Ausdruck an den Stellen anbieten, z. B. fürs Mitglied oder Leitungsteam“): Blatt im Briefbogen-Stil (Kochmütze, „Köcheclub Werne“, Fußzeile mit Clubsprecher) mit Antragsteller, Positionen, Summe, Vorschuss/Kaution, Bemerkung und drei Unterschriftsfeldern (Antragsteller · Kassenwart · Leitungsteam). Angeboten **nach dem Einreichen** (danach wie bisher die Ablage-Frage) und im **Eingang beim Antrag** („📄 Antrag als PDF / Drucken“ für Kassenwart/Leitungsteam); auch der bisherige Druck „Erstattungsantrag“ nutzt das Blatt.
- **📄 PDF in jeder Druckvorschau**: echtes A4-PDF (mehrseitig), das die App selbst baut (Druckseite als Bild, Logo eingebettet) – teilen (z. B. WhatsApp/Mail) oder speichern; nichts geht an fremde Dienste.
- **▶️ Diashow im Fotoalbum** („in den grünen Kopf bei Fotos ansehen: Diashow mit Musik und vorher Album wählen“): Knopf oben im Fotoalbum → 🎵 Musik an/aus, Album (oder alle) antippen → die Diashow läuft sofort mit Club-Song.
- **Teilen**: kommt das Paket leer an (Fund 20.10.: PDF aus dem Dateimanager, die installierte App kannte den Dateityp noch nicht), sagt die App jetzt, was hilft (App neu installieren, bis dahin 📎).
- Hilfe-Einträge „Erstattungsantrag als PDF“ und „Diashow aus dem Fotoalbum“. Nur App.
- Tests: Vertragstests grün; Browserprobe (Antrag-Vorschau, PDF 1 Seite A4 mit Kopf/Positionen/Unterschriften geprüft, Diashow aus dem Fotoalbum mit Album + Musik), keine Fehler.

## 2.525.0 – 2026-10-20 – Teilen-Diagnose genauer (KC-CLUB-TEILEN-DIAGNOSE-2)
Nachtrag zu 2.522.0: Hansis neuer Versuch (10:44 Uhr, v2.524.0) kam wieder mit „Es ist nichts angekommen“ an – die Diagnose konnte aber nicht unterscheiden, ob im Zwischenspeicher gar nichts stand (Teilen hat den Hintergrund-Dienst nicht erreicht oder der Speicher ist voll) oder ob das Handy ein leeres Paket geschickt hat (Dateityp für die installierte App noch nicht freigeschaltet). Jetzt meldet die Diagnose zusätzlich, welche Angaben im Zwischenspeicher standen, wie viele Felder das Handy schickte und welche Version des Hintergrund-Dienstes das Teilen angenommen hat. Nur App, keine Inhalte.

## Datenbank 20.10.2026 – web.de-Bremse enger: 3 je Minute, 20 je Stunde (KC-COMM-WARTEN, Nachschärfung)
Erster Echtbetrieb der Mail-Warteschlange (10:01–10:12 Uhr, 3 Rundnachrichten, 41 Mails): die Warteschlange arbeitete (höchstens 5 je Minute über web.de, alle Mails kamen an), aber web.de lehnte nach 26 Mails in 9 Minuten ab – Brevo übernahm die übrigen 14. Freigabe Hansi „Ja“: Bremse auf 3 je Minute und 20 je Stunde (Migration `20261020_kc_comm_webde_bremse_enger.sql`, nur Einstellung in `kc_communication_providers`, kein Programmcode). Keine neue App-Version.

## 2.524.0 – 2026-10-20 – Versand-Leiste über dem Schreibfeld: 📝 Normal · ❗ Wichtig · 🏎️ Express (KC-CLUB-VERSANDART)
Wunsch Hansi („Unter dem Schreibfeld sind viele Knöpfe. Wichtig und Express raus und vor dem Senden als Option: Normal ist schon markiert, dann Wichtig, dann Express. Wenn Express, Haken bei Normal raus. Wichtig und Express muss zusammen möglich sein“; Wahl Hansi: Leiste fest, WhatsApp bleibt am Platz).
- ❗ und 🏎️ sind aus der Knopfreihe unter dem Schreibfeld heraus (jetzt 9 statt 11 runde Knöpfe – passen in eine Reihe).
- Neu direkt über dem Schreibfeld: **☐/✔ 📝 Normal · ❗ Wichtig · 🏎️ Express**. Normal ist vorgewählt – eine normale Nachricht braucht weiter nur ➤. Wichtig oder Express anhaken nimmt den Haken bei Normal raus; beides zusammen geht (Server konnte das schon: Push + E-Mail, Wichtigkeit hoch, eilig). Normal antippen nimmt beides weg; ist beides abgewählt, ist Normal wieder markiert – es ist nie „nichts“ gewählt.
- Die Leiste erscheint, sobald etwas im Feld steht oder ein Anhang dran ist; Antippen lässt die Tastatur offen. Der Express-Zähler „2/5“ steht neben Express; Farben wie bisher (Wichtig orange, Express rot). Nach dem Senden und beim Chatwechsel wieder Normal – jetzt auch nach „gleiche Nachricht an mehrere Chats“ (dort blieb Express bisher an).
- Die kleine Zeile (▾ Einklappen, ⌨️ Tastatur, 🔊 Tippgeräusche, 🔒 Verschlüsselt) bleibt unverändert ganz oben; WA bleibt am bisherigen Platz.
- Die Frage „Wie wichtig ist diese Nachricht?“ vor dem Senden (KC-CLUB-WICHTIGKEIT-FRAGE, 2.287.0) entfällt – die Leiste zeigt die Wahl schon vorher. Ihr Schalter in ⚙️ → 🔔 heißt jetzt „📝❗🏎️ Versand-Leiste immer zeigen“ (auch ohne Text; bisherige Einstellung bleibt erhalten, Standard: an für den Admin).
- Hilfe, Rundgang und Suche sagen „über dem Schreibfeld anhaken“ statt „auf 🏎️ tippen“.
- Nur App. Tests: Vertragstests grün (neu: Verhalten der Haken – Start Normal, Express ohne Normal, Wichtig + Express, zurück auf Normal, Leiste mit/ohne Text, WA am Platz); Browserprobe 390 px: Leiste einzeilig, keine Fehler.

## 2.523.0 – 2026-10-20 – Meldung oben auffällig · ✕ im Schlüsselbund-Fenster (KC-CLUB-MELDUNG-AUFFAELLIG)
- KC-CLUB-MELDUNG-AUFFAELLIG (Wunsch Hansi „kontrastreich und 2× aufblinken, damit es auffällt“): Meldungen oben jetzt weiß und fett auf fast Schwarz mit goldenem Rand (Fehler: weiß auf Rot mit weißem Rand); beim Erscheinen blinken sie zweimal kurz auf (nur Farbe/Leuchten, kein Wackeln).
- KC-CLUB-DLG-SCHLIESSEN (Wunsch Hansi): Das Fenster „🔑 Schlüsselbund“ hat oben rechts ein Schließkreuz ✕ (wie „Schließen“).

## 2.522.0 – 2026-10-20 – Teilen: Fehler sichtbar statt „Es ist nichts angekommen“ (KC-CLUB-TEILEN-FEHLER)
Fund Hansi (Screenshot v2.521.0: „Es ist nichts angekommen …“ – „scheinbar wieder ein Format, das er nicht kennt“). Die Diagnose zeigte: keine Dateien, kein Text, keine Felder – das Annehmen im Hintergrund (Service Worker) war abgebrochen, und der Fehlerweg öffnete die App ohne jede Spur. Außerdem kamen Listen in der Teilen-Diagnose seit 2.515.0 leer an (der Server speichert nur Text/Zahlen).
- Das Handy vermerkt jetzt, warum es nicht geklappt hat (nur Art und Größe, keine Inhalte); eine Datei, die nicht in den Zwischenspeicher passt, wird übersprungen statt alles abzubrechen.
- Klare Meldungen: „zu groß für den Zwischenspeicher – kleiner teilen oder über 📎 anhängen“, „Das Handy hat die Datei leer übergeben – aus Galerie/Drive/„Dateien“ teilen oder über 📎 anhängen“, oder allgemein „konnte nicht übernommen werden“; bei mehreren Dateien kommen die übrigen trotzdem an.
- Diagnose: Felder, Dateitypen und Fehler kommen jetzt lesbar an.
- Nur App. Tests: Vertragstests grün; Browserprobe (Speicher voll → „zu groß“, 0-Byte-Datei → „leer übergeben“, Diagnose mit Fehler lesbar), keine Fehler.

## 2.521.0 – 2026-10-20 – 🎓 Schulung im Info-Feld nur, wenn Termine angeboten sind · 📈 Admin-Verlauf zeigt wieder alle Tage (KC-CLUB-SCHULUNG-INFO, KC-CLUB-VERLAUF-SEITEN) · Server 2.521.0
Wunsch Hansi („Dass in der Info nix von Schulungstermin steht, wenn ich im Schulungsteil nix freigegeben habe. Erst wenn ich welche anbiete, dann in der Info darauf hinweisen“). Anlass: Hansi las im Info-Feld „Schulung: bitte einen Termin wählen – Hansi hat dir Termine vorgeschlagen“, obwohl kein Termin angeboten war – gezählt hatte eine abgelaufene Einladung (Admin-„wartet“-Zahl, dazu „Protokoll fehlt“/„Nachfrage“).
- Mitglieder: „🎓 Schulung: bitte einen Termin wählen“ im Info-Feld, der Start-Hinweis und die Zahl auf der Kachel „Meine Schulung“ nur noch bei offener Einladung **mit freien Terminen**.
- Admin: im Info-Feld nur noch „🎓 Schulung: x Termin(e) warten auf deine Freigabe“, wenn ein Mitglied einen Termin gewählt oder einen Gegenvorschlag gemacht hat (öffnet die Schulungen). Abgelaufene Einladungen, fehlende Protokolle und Nachfragen bleiben im Schulungs-Hinweis und an der Kachel „🎓 Schulungen“.
- Server: zusätzliche Zahl `schulungFrei` (ohne weitere Abfrage).
- **Admin-Verlauf repariert** (Fund Hansi, Screenshot 7 Tage: „61 % erreichbar · 16× gestört“, ab 17.10. alles rot, Antwortzeit-Linie bricht ab): Die Messungen liefen lückenlos (alle 10/15 Min.), aber die Datenschnittstelle liefert je Abfrage höchstens 1000 Zeilen – 7 Tage sind ~1700 Messwerte, 30 Tage ~7200. Der Server lädt den Verlauf jetzt seitenweise; Erreichbarkeit, Antwortzeit, Hintergrund-Aufrufe und Größe zeigen wieder den ganzen Zeitraum.
- Tests: Vertragstests grün (neu: Info-Feld nach Angebot, Admin nur bei Freigabe).

## 2.520.0 – 2026-10-20 – ✉️ Mails über web.de mit Zeitverzögerung statt Brevo (KC-COMM-WARTEN) · Server 2.520.0
Wunsch Hansi („Wenn es mehr Mails sind als 5, sollte eine Zeitverzögerung eingehalten werden, damit web.de nicht zumacht“; Wahl Hansi: warten, nach 15 Minuten übernimmt Brevo). Anlass: Reinhildes Rundnachricht am 20.10. ging zur Hälfte über web.de, zur Hälfte über Brevo (zwei verschiedene Absender).
- Communicator (KC-Communication, Router): Ist die web.de-Grenze erreicht (5 je Minute, 40 je Stunde), bekommt die Mail einen **Warteplatz** statt sofort Brevo – gleichmäßig verteilt, nie mehr als 5 in einer Minute. Eine Rundmail an 16 Leute ist nach gut 3 Minuten komplett draußen, alle mit demselben Absender. Müsste eine Mail länger als 15 Minuten warten, Express/Notfall oder Push: wie bisher sofort über den nächsten Weg. Klappt web.de beim Abarbeiten nicht, übernimmt gleich Brevo.
- Club-App-Server: Der Minuten-Zeitplan (geplante Nachrichten) arbeitet auch die fälligen wartenden Mails ab; Zustellanzeige „⏳ in der Warteschlange“ gab es schon, wartende Mails zählen als angenommen.
- Datenbank: Zeitplan „kc-club-geplant-minute“ startet zusätzlich, wenn wartende Mails fällig sind (sonst still wie bisher).
- Tests: Vertragstests grün (neu: Zeitplan ruft Warteschlange, Migration); Communicator: neuer Test KC-COMM-WARTEN (16 Mails → 5 sofort, Rest alle 12 s, höchstens 5 je Minute, Stundengrenze 40), alle bisherigen Tests grün.

## 2.519.0 – 2026-10-20 – RC-Prüfung: Rundumschlag vor der stabilen Version (KC-CLUB-RC-PRUEFUNG)
- Server: Speichern nur noch als „gespeichert“ melden, wenn es wirklich geklappt hat (Freigaben Telefon/Geburtstag/Dienstzeiten, Notfallkontakt, Zusage zum Treffen, Status, Kalender- und Eltern-Link); Sperre gilt auch für geplante Nachrichten und den Notbetrieb-Nachtrag; Zeitgrenzen für Ersatz-Server, KICC-Herzschlag, Router (kc-termine), Eltern-Push, Frankfurt (2 statt 10 Wiederholungen); unmögliche Tage werden abgewiesen, Listen und Zahlen begrenzt; Tagesgrenzen in deutscher Zeit (Protokoll, private Termine); Aufräumen der Einmal-Fotos läuft sicher zu Ende; Hash-Vergleich in kc-termine in gleichbleibender Zeit; ungenutzte Aktion `notbetrieb_info` entfernt.
- App: Tippflächen mindestens 44 px, Einstellungs-Reiter lesbar (.8rem, Umbruch), Rot in der Nachtansicht über das Farbschema, aria-label an Emoji-Knöpfen, „Niemand gefunden“ bei leerer Suche, Hinweis wenn eine Einstellung nur auf dem Gerät gespeichert wurde, Abmelden räumt alle eigenen Schlüssel, „💾 Speichern“ und „🖨️ Drucken / PDF“ vereinheitlicht, Hilfetext Sperrzeit mit echten Twinkey-Beschriftungen, möglicher Startfehler (KOCH vor dem Start) behoben, onclick-Daten sicher maskiert, toter Code entfernt.
- Sparsam: Zurück in die App lädt höchstens einmal je 60 s neu.
- KC-CLUB-MINDESTVERSION: `version.json` „mindest“ 2.500.0 – ältere Apps werden beim Start um ein Update gebeten und aktualisieren sich.
- KC-CLUB-PAGES-NACH-TESTS: neuer Ablauf „Seite veröffentlichen“ (Tests → Bau → Veröffentlichen); wirksam nach Umstellung der Pages-Quelle auf „GitHub Actions“. Hochlade-Abläufe führen alle Tests aus.
- KC-CLUB-RC-DATENBANK: Migration `20261020_kc_club_rc_datenbank.sql` (Rechte enger, Lastmessung nur Unterschiede, Frankfurt-Zeitplan mit Vorprüfung, Eltern-Tabelle geschwärzt im Spiegel) – Einspielen über „Datenbank einspielen“.
- Tests: `tests/rc-server.test.mjs`, `tests/rc-app.test.mjs`. Server 2.519.0.

## 2.518.0 – 2026-10-20 – 🔑 Schlüsselbund für verschlüsselte Nachrichten · 🔒 in die kleine Zeile (KC-CLUB-SCHLUESSELBUND, KC-CLUB-VERSCHLUESSELT-KLEIN)
Zwei Wünsche von Hansi, eine Version:
- **Schlüsselbund** („mit einem Partner 5 verschiedene Schlüssel festlegen, die hat man auf dem Handy in einer Datei; kommt die Nachricht an, guckt das Handy, ob ein Schlüssel passt – wenn ja anzeigen, sonst Fehlermeldung“; Wahl Hansi: Übergabe per Datei). Im Zweier-Chat oben ⋮ → „🔑 Schlüsselbund mit …“ (oder beim Einschalten von 🔒): die App legt 5 zufällige 256-Bit-Schlüssel an und gibt sie als Datei weiter (Teilen-Menü, Empfehlung WhatsApp/Signal, nicht Mail). Der Partner tippt die Datei an → Teilen → Club-App (oder „Datei einlesen“); sie landet **nicht** im Ablagekorb und geht nie über den Club-Server. Danach: 🔒 an und senden – kein Eintippen, die App nimmt einen der 5 Schlüssel; beim Empfänger öffnet sich die Nachricht von selbst. Passt keiner: „❌ Kein passender Schlüssel im Schlüsselbund …“, dann wie bisher Schlüssel eintippen. Dazu „Datei nochmal schicken“, „Sicherung speichern“ (neues Handy) und „Schlüsselbund löschen“. Nachrichtenformat und Server bleiben gleich (HKDF-SHA-256 → AES-GCM 256 im „🔒KCV1:“-Format); Gruppen weiter mit eingetipptem Schlüssel.
- **🔒 in die kleine Zeile** („Unten sind jetzt zu viele Symbole. Nimm das Schloss in die kleine Zeile mit dem Lautsprecher, Tastatur, Pfeil“): Der Knopf sitzt jetzt über dem Schreibfeld neben ▾, ⌨️ und 🔊 (grün, wenn an); Antippen lässt die Tastatur offen.
- Hilfe-Eintrag ergänzt. Nur App.
- Tests: Vertragstests grün; Browserprobe mit zwei Handys (Hansi legt an → Datei → Klaus liest über Teilen ein, kein Server-Aufruf; Hansi sendet ohne Eintippen, nur Geheimtext geht raus; Klaus sieht die Nachricht von selbst; falscher Schlüsselbund → Fehlermeldung), keine Fehler.

## 2.517.0 – 2026-10-20 – 🔒 Nachrichten mit eigenem Schlüssel verschlüsseln (KC-CLUB-VERSCHLUESSELT) · Server 2.517.0
Wunsch Hansi („Wenn ich eine Nachricht an jemanden schicke, vorher einen Schlüssel festlegen, z. B. 1234 oder abcd – damit wird meine Nachricht verschlüsselt. Aber wie kommt der Empfänger an den Schlüssel?“; Wahl Hansi: selbst gewählter Schlüssel, mindestens 6 Zeichen, je Person merkbar).
- Unten im Chat neuer Knopf **🔒** (grün, wenn an). Beim Senden fragt die App nach dem Schlüssel (mindestens 6 Zeichen; „1234“ wäre in Sekunden geknackt). Die Nachricht wird **auf dem Handy** verschlüsselt (PBKDF2-SHA-256 mit 310 000 Runden → AES-GCM 256, zufälliges Salz je Nachricht) – auf dem Server, in der Datenbank, in Push und Mail steht nur Zeichensalat bzw. „🔒 Verschlüsselte Nachricht“. Auch der Admin kann sie nicht lesen.
- Der Empfänger sieht „🔒 Verschlüsselte Nachricht – antippen und Schlüssel eingeben“; falscher Schlüssel → „Falscher Schlüssel“. Den Schlüssel bekommt er **auf anderem Weg** (persönlich, Telefon, SMS) – das sagt die App beim Festlegen.
- Das Handy merkt sich den Schlüssel je Unterhaltung (nur auf dem Gerät) und öffnet weitere Nachrichten mit demselben Schlüssel gleich mit. Chatliste, Hinweise und Zitate zeigen „🔒 Verschlüsselte Nachricht“.
- Grenzen: Fotos/Dateien werden nicht verschlüsselt (Hinweis), Text bis etwa 2.800 Zeichen; Schlüssel vergessen = Nachricht nicht mehr lesbar.
- Hilfe-Eintrag „Nachricht verschlüsselt senden“.
- Tests: Vertragstests grün; Ver-/Entschlüsseln (richtiger/falscher Schlüssel, Umlaute/Emojis, je Nachricht anderer Geheimtext); Browserprobe Absender → Empfänger (nur Geheimtext gesendet, falscher Schlüssel abgelehnt, richtiger öffnet), keine Fehler.

## 2.516.0 – 2026-10-20 – ⚠️ Dubletten im Ablagekorb deutlich anzeigen (KC-CLUB-ABLAGEKORB-DUBLETTE-DEUTLICH)
Fund Hansi („Datei liegt im Eingangskorb. Dubletten-Check hätte sie eigentlich anmeckern müssen – die müssten schon in der Club-App sein“). Die Prüfung hatte die PDF richtig erkannt (gleiche Datei im Archiv „Bescheinigung Ehrenamt … (2)“ vom 17.10., in einem Chat und bei einem Vorschlag) – angezeigt wurde das aber nur als kleine orange Zeile unter der Datei.
- Jetzt steht oben im Eintrag ein deutlicher Warnkasten „⚠️ Diese Datei gibt es schon in der Club-App“ mit allen Fundstellen je Datei und dem Knopf **„🗑️ Dublette(n) löschen“** (die vorhandenen in der Club-App bleiben; ist der Eintrag danach leer, verschwindet er).
- Wer als Mitglied etwas Doppeltes teilt, bekommt den Hinweis „… gibt es schon in der Club-App“.
- Nur App. Tests: Vertragstest grün; Browserprobe (Warnkasten mit Fundstellen, keine Fehler).

## 2.515.0 – 2026-10-20 – Teilen-Diagnose (KC-CLUB-TEILEN-DIAGNOSE)
Nachtrag zu 2.514.0 (Hansi: Datei aus dem Datenspeicher kommt weiterhin leer an – vermutlich hat das Handy die erweiterte Teilen-Liste der installierten App noch nicht übernommen). Die App merkt sich jetzt beim Teilen, welche Felder und Dateitypen das Handy wirklich schickt (nur Feldname, Typ und Größe, keine Inhalte) und schreibt das in die Diagnose – so lässt sich genau sehen, woran es liegt. Nur App.

## 2.514.0 – 2026-10-20 – 📥 Teilen: auch Dateien aus dem Dateimanager (KC-CLUB-TEILEN-ALLE-DATEIEN)
Fund Hansi („Konnte eine Datei aus dem Datenspeicher nicht teilen“ – Meldung „Es ist nichts angekommen“; Diagnose: 0 Dateien, kein Text). Die Teilen-Liste der App nahm nur bestimmte Dateitypen an (Fotos, PDF, Word, Excel, ZIP, Audio, Text) – andere Dateien (oder Dateimanager, die einen anderen Typ melden) kamen leer an.
- Die App nimmt jetzt **alle Dateitypen** an (manifest `*/*`, dazu Video, Text, Anwendungen); der Service Worker übernimmt jede mitgeschickte Datei, egal unter welchem Feldnamen. Gefährliche Typen (Programme, Skripte, HTML/SVG) lehnt der Server weiterhin ab.
- Die erweiterte Teilen-Liste übernimmt das Handy beim nächsten Aktualisieren der installierten App (meist beim nächsten Start, spätestens nach einem Tag) – die Meldung sagt das jetzt auch.
- Behebt einen Fehler, der die Benutzung verhindert → sofort eingespielt (AGENTS.md). Nur App.
- Tests: Vertragstests grün.

## 2.513.0 – 2026-10-20 – 📥 Ablagekorb → Fotoalbum: erst nach dem Hochladen erledigt (KC-CLUB-ABLAGEKORB-ALBUM-FIX)
Fund Hansi („Ich habe über den Ablagekorb Fotos ins Album gelegt. Da sind sie aber nicht zu sehen“): „📷 Fotoalbum“ markierte den Eintrag schon beim Öffnen des Hochlade-Formulars als erledigt – im Album landen die Fotos aber erst mit „Hochladen“ (bei Hansi kam zudem ein App-Update dazwischen, das Formular war weg). Die 10 Fotos waren nicht verloren (Ablagekorb → „Zuletzt erledigt“ → „↩ Wieder offen“).
- Jetzt merkt sich die App den Eintrag und erledigt ihn erst, wenn **alle** Fotos wirklich im Album sind („10 Fotos ins Fotoalbum hochgeladen“). Klappt etwas nicht oder wird das Formular verlassen, bleibt der Eintrag offen.
- Im Hochlade-Formular steht ein goldener Hinweis: „Aus dem Ablagekorb: Thema wählen und ‚Hochladen‘ tippen – erst dann sind die Fotos im Album.“ Gilt auch für „📷 n ins Fotoalbum“ bei ausgewählten Fotos.
- Behebt einen Fehler, der die Benutzung verhindert → sofort eingespielt (AGENTS.md). Nur App.
- Tests: Vertragstest grün; Browserprobe (Öffnen → nichts erledigt; nach dem Hochladen beider Fotos erledigt; keine Fehler).

## 2.512.0 – 2026-10-20 – 📥 Ablagekorb: Fotos einzeln auswählen · ⚠️ Dubletten-Check (KC-CLUB-ABLAGEKORB-AUSWAHL, KC-CLUB-ABLAGEKORB-DUBLETTEN) · Server 2.512.0
Wunsch Hansi („Wenn z. B. 10 Fotos im Eingangskorb liegen, dass man anklicken kann, welche ins Album sollen oder gelöscht werden sollen. Außerdem Dubletten-Check einbauen: wenn was in den Ablagekorb reinkommt, wird alles durchsucht, ob es das schon gibt“).
- **Auswahl:** Bei mehreren Dateien hat jede ein Häkchen. Darunter „☑️ 3 von 10 ausgewählt“ mit **Alle / Keine / ⚠️ Dubletten** und den Knöpfen **📷 3 ins Fotoalbum** und **🗑️ 3 löschen**. Was ins Album geht, wird als eigener erledigter Eintrag abgelegt (14 Tage wiederherstellbar), der Rest bleibt offen.
- **Dubletten-Check** beim Ablegen (und von Hand mit „🔍 Dubletten prüfen“, auch für ältere Einträge): gesucht wird die exakt gleiche Datei im **Fotoalbum, Archiv, in Chats, Vorschlägen, Sitzungsprotokollen und im Ablagekorb**; bei Fotos zusätzlich wie im Album gespeichert (dort verkleinert): **gleiche Aufnahmezeit + Kamera** bzw. **gleiche Original-Datei** (Name + Größe). Auch zweimal dieselbe Datei im selben Paket. Treffer stehen orange unter dem Bild: „⚠️ gibt es schon: Fotoalbum“ (Fundstelle beim Antippen/Halten). Nichts wird automatisch gelöscht.
- Grenze: Ein Foto, das schon einmal bearbeitet/zugeschnitten oder über WhatsApp verkleinert wurde, ohne Aufnahmedaten, erkennt die Prüfung nicht als gleich.
- Nur App + Server, keine Datenbank-Änderung (die Treffer stehen bei den Dateien des Eintrags).
- Tests: Vertragstests grün; Dubletten-Prüfung mit nachgestellter Datenbank (Album+Chat, Archiv, doppelt im Paket, Album über Original-Datei, neues Foto ohne Treffer); Browserprobe (10 Fotos, 2 Dubletten markiert, Dubletten wählen, Auswahl löschen, keine Fehler).

## 2.511.0 – 2026-10-20 – 📥 Ablagekorb für alles, was mit der Club-App geteilt wird (KC-CLUB-ABLAGEKORB) · Server 2.511.0
Wunsch Hansi („In anderen Programmen gibt es Teilen – Dokumente, Fotos. Die Club-App braucht eine Art Eingangskorb, um so etwas anzunehmen und erst mal abzulegen. Info an Admin … dann mir zeigen, und ich entscheide: Fotoalbum, Ordner, löschen, in Chats weiterleiten, als Aufgabe delegieren, als Vorschlag für die nächste Sitzung, Weitergabe an Clubsprecher …“; Wahl Hansi: alle Mitglieder dürfen teilen, alles kommt zuerst in den Korb).
- **Teilen → Köcheclub** (aus Galerie, WhatsApp, Mail, Dateien): Fotos, Dokumente und Text landen sofort im 📥 Ablagekorb – bis 10 Dateien, Fotos im Original (Aufnahmedatum bleibt fürs Album). Das Mitglied sieht „Im Ablagekorb abgelegt – Hansi kümmert sich darum“. Gäste/Aushilfen und ohne Verbindung: wie bisher selbst wählen (Chat, Fotoalbum, Archiv).
- **Admin** bekommt eine Push/Mail „📥 Neu im Ablagekorb – Klaus hat 2 Fotos geteilt“, einen orangen Hinweis im Info-Feld und die Admin-Kachel „📥 Ablagekorb“. Je Eintrag: Absender, Text, Vorschaubilder/Dateien (antippen = öffnen) und die Knöpfe **📷 Fotoalbum**, **🗄️ In Ordner** (mit Ablage-Vorschlag), **💬 In Chat**, **👤 Weitergeben** (Clubsprecher und Kassenwart stehen oben), **✅ Als Aufgabe** (To-do für die Person + Unterlagen per Nachricht), **🗳️ Vorschlag Sitzung** (Thema für die nächste Sitzung mit Anlagen), **✔ Erledigt**, **🗑️ Löschen**. Nachrichten werden nur vorbereitet – gesendet wird mit ➤.
- Erledigtes steht unter „Zuletzt erledigt“ (mit „↩ Wieder offen“) und wird nach 14 Tagen samt Original-Dateien weggeräumt (stündlicher Lauf). Zum Weitergeben legt der Server eine Kopie in den Bereich des Admins – es gelten überall die üblichen Regeln.
- Datenbank: neue Tabelle `kc_club_ablagekorb` (Migration `20261020_kc_club_v2511_ablagekorb.sql`, Probelauf `tools/db-test/84_ablagekorb_test.sql`). Ohne Tabelle teilt die App wie bisher.
- Hilfe: „Teilen → Köcheclub: alles landet im Ablagekorb“ und „Ablagekorb bearbeiten (Admin)“.
- Tests: Vertragstests grün; Browserprobe Mitglied (2 Dateien hochgeladen und abgelegt) und Admin (Korb mit 3 Einträgen, alle Knöpfe, Weitergeben mit Kassenwart oben, Info-Feld, Kachel), keine Fehler.

## 2.510.0 – 2026-10-20 – Chat sparsamer: Haken per Signal, seltener nachfragen, kurze Nachfrage statt ganz laden (KC-CLUB-RT-ANGEKOMMEN, KC-CLUB-CHAT-SPARSAM, KC-CLUB-CHAT-STAND) · Server 2.510.0
Wunsch Hansi („Ja, 1 und 2 bauen für 12 Uhr“). Messung vorher: ein offener Chat lud nach jeder eigenen Nachricht 60 s lang alle 4 s komplett neu (je ~34 Abfragen), während der andere tippte sogar alle 2 s.
- **„Angekommen“ als Signal (KC-CLUB-RT-ANGEKOMMEN):** Lädt die App des Empfängers die neue Nachricht (Eintrag „angekommen“), bekommt der Absender sofort dasselbe Signal wie bei „gelesen“ – die zwei grauen Haken erscheinen sofort. DB: `supabase/migrations/20261020_kc_club_rt_angekommen.sql` (nur ein Trigger, nur Signal ohne Inhalt, ein gestörtes Signal verhindert nie das Speichern).
- **Seltener nachfragen (KC-CLUB-CHAT-SPARSAM):** Steht die direkte Leitung, fragt die App nach dem Senden nicht mehr alle 4 s nach den Haken, und während der andere tippt nur alle 6 statt 2 s („schreibt …“ verschwindet nach höchstens 6 s). Ohne Leitung (oder bei Sparbremse) alles wie bisher.
- Ergebnis im Browser-Test (2 Min. offener Chat, mit Leitung): nach dem Senden 32 → 4 Ladevorgänge, beim Tippen 60 → 20. Ohne Leitung und im Ruhefall unverändert.
- **Kurze Nachfrage statt ganz laden (KC-CLUB-CHAT-STAND, Wunsch Hansi „Ja Bau das jetzt“):** Im Takt holt die App erst nur einen „Fingerabdruck“ des Chats (1 Abfrage statt ~34) und lädt ihn nur ganz, wenn er sich geändert hat – sonst, ohne Fingerabdruck, bei einem Fehler oder spätestens alle 5 Minuten wie bisher. Signale der direkten Leitung und eigene Aktionen laden weiter sofort ganz. Der Fingerabdruck umfasst alles, was der Chat zeigt (Nachrichten, Haken, Zustellung, Reaktionen, Umfragen, Anheften, Express, Tippen, „online / zuletzt da“, Selbstlöschen …); das eigene „gelesen bis“ zählt nicht mit. DB: `supabase/migrations/20261020_kc_club_chat_stand.sql` (bereits eingespielt, nur lesend, nur der Server; live geprüft an 40 Chats: stabil, Ø 8 ms). Server: Aktion `unterhaltung_stand`, `unterhaltung` liefert `stand` mit (vor dem Lesen berechnet).
- Tests: `tools/chat-sparsam/chat-stand-test.mjs` (echte Funktion in Postgres 16 im Speicher: 39 sichtbare Änderungen ändern den Fingerabdruck, auch Zeitabläufe; 8 unsichtbare nicht) · `tools/chat-sparsam/chat-stand-browser.mjs` (App lädt nur bei Änderung/Fehler/alle 5 Min. ganz) · `tools/chat-sparsam/rt-angekommen-test.mjs` (echte Migration in Postgres 16 im Speicher: Signal an die anderen, nicht an sich selbst/ausgeblendete, kein Doppel-Signal bei „gelesen“, Störung harmlos) · `tools/chat-sparsam/chat-takt-browser.mjs` (echtes app.js, alt gegen neu) · Vertragstest-Block 2.510.0.
- Rückweg: App 2.509.0 / Server 2.508.0 erneut einspielen; `drop trigger kc_club_rt_angekommen on public.kc_club_chat_quittung;` (die Funktion kc_club_chat_stand bleibt dann ungenutzt).
## 2.509.0 – 2026-10-20 – 🔊 Mini-Lautsprecher im Chat · ✏️ schreibender Stift (KC-CLUB-TIPPTON-KNOPF, KC-CLUB-STIFT-SCHREIBT)
Wunsch Hansi („Im Chat gibt es einen kleinen Pfeil und eine kleine Tastatur. Daneben noch ein Mini-Lautsprecher-Symbol, das den Tastatur-Anschlag-Sound abschaltet“).
- Unten im Chat neben ▾ (Schreibbereich einklappen) und ⌨️ (Tastatur) sitzt jetzt ein kleiner Lautsprecher: 🔊 = Tippgeräusche an – antippen schaltet sie aus (🔇, ausgegraut); nochmal antippen schaltet die zuletzt gewählte Art wieder ein (Tastatur oder Schreibmaschine). Kurze Meldung zur Bestätigung.
- Dieselbe Einstellung wie ⚙️ → Benachrichtigungen → „⌨️ Tippgeräusche“, gilt für dieses Gerät; der Knopf nimmt der Handy-Tastatur den Fokus nicht weg. Hilfe-Eintrag ergänzt. Nur App.
- **✏️ Schreibender Stift** (Wunsch Hansi „Es bewegen sich 3 Punkte, wenn jemand im Chat schreibt. Daneben ist ein Stiftsymbol – animiere den Stift, als wenn er den Text schreibt“): Der Stift in „✏️ Klaus schreibt …“ macht jetzt eine kleine Schreibbewegung – im Zickzack nach rechts, kurz absetzen, zurück an den Zeilenanfang. Bei „Bewegung reduzieren“ langsamer.
- Tests: Vertragstests grün; Browserprobe (Schreibmaschine → 🔇 aus → 🔊 wieder Schreibmaschine; Stift bewegt sich; keine Fehler).

## DB – 2026-10-20 (ohne App-Build) – DP2 liest „Nicht für den Dienstplan“ (KC-DP-NICHT-PLANBAR)
Wunsch Hansi („Fridbert soll auch nicht mehr bei der Dienstplan-Erstellung auftauchen“ – DP2 führt ihn bisher fest im Programm, `K.nonPlanningPersonIds`):
- Neue Lesefunktion `kc_dp_nicht_planbar(p_org)` → `{ vertrag: "KC_DP_NICHT_PLANBAR_V1", personIds: [...], stand }` aus der Club-App-Liste `kc_club_dienst_ausnahmen`. Nur für aktive DP2-Planungsrollen (admin/planner/duty_manager) der Organisation, nur deren Personen, nur lesend; anon ohne Zugriff, Tabelle selbst bleibt nur für den Server.
- Geprüft: Planer bekommt `["KC-P-M0004"]`, Fremder → „Keine aktive dp2-Planungsberechtigung“.
- DP2 (Codex) muss die Funktion noch nutzen – Auftrag an Codex über Hansi.
- Rückweg: `drop function public.kc_dp_nicht_planbar(text);`

## 2.508.0 – 2026-10-20 – 🎁 Geburtstags-Vogel im Kopf (KC-CLUB-GEBURTSTAG-VOGEL)
- Feature KC-CLUB-GEBURTSTAG-VOGEL (Wunsch Hansi): Hat heute ein Mitglied Geburtstag (nur freigegebene Geburtstage), fliegt im Kopf der Startseite ein Vogel mit Geschenkpaket herein und wirft es ab; unten platzt es, ein Blumenstrauß springt heraus, darüber ein bunter „Happy Birthday“-Schriftzug mit Vornamen. Höchstens einmal je Stunde und Gerät; blockiert keine Bedienung. ⚙️ → ✨ Effekte: 🎁 Geburtstags-Vogel (an/aus + ▶ Vorschau).
- KC-CLUB-HILFE-NACHTRAG-3 (Wunsch Hansi „Hilfetexte, Lupe, Twinkey und Videos an die neuen Sachen anpassen – nix von Adminfunktionen“): 11 neue Hilfe-Einträge (Kopf-Effekte, Geburtstags-Vogel, Tippgeräusche, 📊 Dienstzeiten-Übersicht, Dienstwunsch-Hinweis, Vorschlag bearbeiten + 📎 Anlagen-Zahl, Protokoll drucken, „Kurz erklärt“ einklappen, Neues im Info-Feld, heutiger Tag im Kalender, Terminanfrage an mehrere), „Kurz erklärt“ für Dienstpläne/Protokolle ergänzt, 6 Twinkey-Fragen, 4 Lupe-Treffer; Videos „Effekte & Wetter“ (Kopf auf/zu, Geburtstag, Einstellungen), „Mein Dienst“ (📊 wer kann wann), „Anpassen“ und „Privatsphäre“ ergänzt – Fassung 2 für Effekte, Dienst, Anpassen. Keine Admin-Funktionen; Vorführungen ändern keine Einstellung (kopfRolloFahren mit Vorgabe).
- KC-CLUB-DIENST-AUSNAHMEN (Wunsch Hansi: ein Mitglied ist weit weggezogen und steht für den Dienstplan nicht zur Verfügung): neue Registry `kc_club_dienst_ausnahmen` (RLS, nur service_role; Migration `20261019_kc_club_dienst_ausnahmen.sql`, bereits eingespielt, Eintrag KC-P-M0004). Wer dort steht, bleibt Mitglied, wird aber nicht an Dienstwünsche erinnert, steht nicht unter „noch nicht abgegeben“ und bekommt den Laufband-Hinweis nicht. DP2 führt dasselbe heute in `K.nonPlanningPersonIds` (Codex). Server 2.508.0. Rückweg: Server 2.507.0 + `drop table public.kc_club_dienst_ausnahmen`.
- KC-CLUB-AUFGABE-BEMERKUNG (Wunsch Hansi „Wenn er sie erledigt hat, muss er sie bestätigen mit einem Bemerkungstext“): Abhaken einer Aufgabe nur mit kurzer Bemerkung (Fenster „Was ist dabei herausgekommen?“, Protokoll und Büro; Server prüft mind. 3 Zeichen). Wer die Aufgabe eingetragen hat, bekommt einen Push (ohne App: Mail) mit der Bemerkung; im Protokoll steht sie unter der erledigten Aufgabe. DB: Spalte `kc_club_aufgaben.bemerkung` (Migration `20261019_kc_club_aufgaben_bemerkung.sql`, bereits eingespielt). Rückweg: App 2.506.0 / Server 2.507.0 (Spalte kann bleiben).

## Server 2.507.0 – 2026-10-19 (ohne App-Build) – Halbe Stunden in der Dienstwunsch-Bestätigung (KC-CLUB-DW-HALBE-STUNDE)
Fund Hansi (Bestätigung Dieter: „Kann: 11:00–12.5:00 Uhr“): Die Wunschzeiten sind als Dezimalstunden gespeichert (12.5 = 12:30). Mail und „📄 Aufstellung“ setzten einfach „:00“ dahinter.
- Jetzt richtig: „11:00–12:30 Uhr“ (auch Viertelstunden, Bereitschaft und Spalten-Ansicht). Die gespeicherten Wünsche waren immer richtig – nur die Anzeige.
- Nur Server, die App bleibt 2.506.0 (kein Neustart aller Apps).
- Tests: Vertragstest (12.5 → 12:30, 9.25 → 09:15, 13.75 → 13:45 …) grün.

## 2.506.0 – 2026-10-19 – Protokoll veröffentlichen ohne Warten (KC-CLUB-PROTOKOLL-SCHNELL)
- KC-CLUB-PROTOKOLL-SCHNELL (Hansi: Veröffentlichen dauerte 21 s): Das Protokoll ist sofort veröffentlicht; die Benachrichtigung der Mitglieder, die Aufgaben-Mitteilung und der Protokolleintrag laufen im Hintergrund (Fehler landen im Server-Log und im Protokoll).
- Server 2.506.0.

## 2.505.0 – 2026-10-19 – Kopf: Theatervorhang, Servierglocke, Marktbude · Tippgeräusche beim Live-Tippen
- Feature KC-CLUB-KOPF-EFFEKTE-2 (Wunsch Hansi): drei neue Arten, den Kopf auf- und zuzumachen – 🎪 Theatervorhang (weinroter Samt), 🍽️ Servierglocke („Voilà!“), 🏠 Marktbude (Holzklappe) – und „🎭 Passend zum Thema bzw. zur Jahreszeit“ (Themen-Registry `kopf`; ohne Thema: Advent → Marktbude, sonst Servierglocke).
- KC-CLUB-KOPF-CLIMBER-2 (Hansi: „soll sich Lamelle für Lamelle hochkrempeln“): Der Climber arbeitet jetzt wie ein echter Raffstore – die Endschiene fährt hoch und sammelt Lamelle für Lamelle ein; Öffnen umgekehrt.
- Feature KC-CLUB-TIPP-GERAEUSCH (Wunsch Hansi): Zeigt die Gegenseite live, was sie tippt, sind ihre Anschläge zu hören – ⌨️ Tastatur oder 📠 Schreibmaschine (mit Glöckchen). ⚙️ → Benachrichtigungen, je Gerät, Standard aus; nur in der offenen, nicht stummen Unterhaltung.

## 2.504.0 – 2026-10-19 – 📎 Anzahl der Anlagen auf den Vorschlags-Kacheln (KC-CLUB-VORSCHLAG-ANLAGEN-ZAHL)
- Feature KC-CLUB-VORSCHLAG-ANLAGEN-ZAHL (Wunsch Hansi, „sofort einspielen“): Themen-, Abstimmungs- und Spendenkacheln zeigen „📎 2 Anlagen“, wenn Anlagen dranhängen. Nur App (Server liefert `anlagen` schon).

## Server 2.504.0 – 2026-10-19 (ohne App-Build) – Kachel-Zahlen in einer Abfrage (KC-CLUB-KACHEL-EINS, Stufe 2 Punkt 4)
Wunsch Hansi („Punkt 4 bis 20 Uhr bauen“):
- Die Zahlen auf den Kacheln 📅 Termine, 🤝 Helfen, 📷 Fotos und 🗓️ Dienste kommen beim App-Start aus EINER Datenbank-Abfrage (neue Lesefunktion `kc_club_kachel_zahlen`) statt aus bis zu 9. Gleiche Rechnung wie vorher; 🗂️ Büro wie bisher.
- Schlägt die Funktion fehl, rechnet der Server wie bisher einzeln (alte Rechnung bleibt als Rückfall).
- DB: `supabase/migrations/20261019_kc_club_kachel_zahlen.sql` (bereits eingespielt, nur lesend; nur der Server darf sie aufrufen).
- Tests: `tools/db-sparsam/kachel-test.mjs` – echte Funktion in Postgres 16 im Speicher (PGlite), 400 Zufallswelten × 4 Personen/Rollen, alt = neu. Zusätzlich an den echten Daten nur lesend geprüft: 19 Mitglieder, 0 Abweichungen. Vertragstest-Block Server 2.504.0.
- Rückweg: Server 2.503.0 erneut hochladen (die Funktion bleibt dann ungenutzt).
## 2.503.0 – 2026-10-19 – 🪟 Kopf-Effekte wählbar, 🦉 Uhu als Bote
- Feature KC-CLUB-KOPF-EFFEKTE (Wunsch Hansi): unter ⚙️ → ✨ Effekte Häkchen „🪟 Anderer Effekt beim Einrollen des Kopfes“; Klappbereich mit Jalousie (Standard), Lamellenvorhang (zu den Seiten), Climber (Lamellen kippen und schieben sich nach oben) und Automatisch (wechselt), ▶ Ausprobieren. Ohne Häkchen bleibt die Jalousie.
- Feature KC-CLUB-UHU (Wunsch Hansi): neuer Sende-Bote „🦉 Uhu mit Posttasche“ – blaue Briefträger-Mütze, Umhängetasche in Club-Farben; fliegt wie die Brieftaube, beim Empfänger fällt das Kuvert aus der Tasche. Auch bei „Abwechselnd“ dabei.
- Server 2.503.0: `SENDE_EFFEKT_ARTEN` kennt „uhu“.

## 2.502.0 – 2026-10-19 – Bündel 20 Uhr: Vorschläge bearbeiten, Protokoll drucken, Hilfetexte einklappen, Protokoll-Hinweis
- Feature KC-CLUB-VORSCHLAG-BEARBEITEN (Wunsch Hansi): Knopf „✏️ Bearbeiten“ an offenen Vorschlägen (Ersteller und Clubleitung) – Thema, Beschreibung, Termin und Anlagen nachträglich ändern; vorhandene Anlagen bleiben (✕ entfernt), neue kommen dazu. Ohne Benachrichtigung, alter Stand im Protokoll; bei Abstimmungen bleibt die Frage nach der ersten Stimme fest. Server: `vorschlag_aendern`, `darfBearbeiten`.
- Feature KC-CLUB-PROTOKOLL-DRUCKEN (Wunsch Hansi): „🖨️ Drucken / PDF“ im Protokoll-Entwurf und in der Leseansicht; der Entwurf wird vorher gespeichert und frisch geladen.
- Feature KC-CLUB-EINW-KLAPPEN (Wunsch Hansi): alle Hilfetexte „🎓 Kurz erklärt“ lassen sich einklappen (Pfeil klappt wieder auf); gemerkt je Gerät.
- Feature KC-CLUB-PROTOKOLL-NEU-INFO (Wunsch Hansi): im Info-Feld „Neues Besprechungsprotokoll eingestellt“ mit Titel – Antippen öffnet das Protokoll. Server liefert `protokollNeu` beim Start.
- Server 2.502.0.

## 2.501.0 – 2026-10-19 – 📊 Dienstzeiten-Übersicht für Mitglieder (KC-CLUB-DV-MITGLIEDER)
- Feature KC-CLUB-DV-MITGLIEDER (Wunsch Hansi): Der 📊-Knopf steht jetzt auch für Mitglieder bereit. Mitglieder sehen ihre eigenen Zeiten und die der Mitglieder, die das Teilen erlaubt haben (gleiche Regel wie in „Dienstpläne“); „wer fehlt noch“, Erinnern und Ablegen bleiben bei der Clubleitung.
- Server 2.501.0: `dienst_uebersicht` filtert für Nicht-Leitung serverseitig.

## 2.500.0 – 2026-10-19 – 📊 Dienstzeiten-Übersicht überall beim Dienstplan (KC-CLUB-DV-UEBERALL)
- Feature KC-CLUB-DV-UEBERALL (Wunschliste Nr. 27): Der 📊-Knopf aus dem Büro-Eingang steht jetzt auch in „Dienstpläne“, „Mein Dienst“ und den Dienstwünschen – gleicher Knopf, gleiches Recht (Clubleitung).

## 2.499.0 – 2026-10-19 – Protokoll: diktierte Texte mit einem Tipp übernehmen (KC-CLUB-PROTOKOLL-NACHTRAG)
- Feature KC-CLUB-PROTOKOLL-NACHTRAG: Texte, die Hansi diktiert und Claude als Vorschlag abgelegt hat, erscheinen oben im Protokoll-Entwurf; ✅ Übernehmen hängt sie an die Kurzfassung (bzw. als Beschluss-Zeilen), ✕ Verwerfen fragt nach. Nur wer das Protokoll bearbeiten darf, nur im Entwurf; Doppeltipp-sicher.
- DB: neue Tabelle `kc_club_protokoll_nachtrag` (RLS an, nur service_role), Migration `20261019_kc_club_protokoll_nachtrag.sql`. Rückweg: `drop table public.kc_club_protokoll_nachtrag`.
- Server 2.499.0: Aktion `protokoll_nachtrag`, `protokoll_laden` liefert `nachtraege`.

## 2.498.0 – 2026-10-19 – 📸 „x neue Fotos hochgeladen“ im Info-Feld – direkt zu den neuen Fotos (KC-CLUB-FOTOS-NEU-INFO)
Wunsch Hansi („Schreibe in die Info-Box ‚x neue Fotos hochgeladen‘ und dann bei Klick direkt dorthin“).
- Im Info-Feld steht jetzt „📸 3 neue Fotos hochgeladen – Antippen: direkt zu den neuen Fotos“ (mit Knopf „📸 Ansehen“). Gezählt werden wie bisher Fotos anderer seit dem letzten Öffnen des Albums.
- Antippen öffnet das Fotoalbum mit einem goldenen Kasten ganz oben: „🆕 3 neue Fotos – von Dieter, Klaus“ mit genau diesen Fotos (antippen = groß ansehen); im Raster darunter tragen sie zusätzlich ein rotes „NEU“. Die Seite scrollt direkt dorthin. Bisher landete man nur im Album und musste die neuen Fotos selbst suchen (sie stehen nach Aufnahmedatum, oft weiter unten).
- Nur App, keine zusätzliche Datenbank-Abfrage.
- Tests: Vertragstest grün; Browserprobe (Kasten mit 2 fremden neuen Fotos, eigenes Foto nicht gezählt, NEU-Marken, keine Fehler).

## 2.497.0 – 2026-10-19 – ✨ Heutiger Tag im Kalender blinkt langsam (KC-CLUB-KALENDER-HEUTE-BLINKT)
Wunsch Hansi („Baue ein, dass im Kalender der aktuelle Tag langsam blinkt, damit man ihn sofort sieht“).
- Um den heutigen Tag pulsiert ein goldener Ring mit sanftem Schein (alle 2,4 Sekunden, kein hartes Flackern) – auch wenn der Tag gerade ausgewählt ist oder farbig markiert (Treffen, Feiertag, Geburtstag …); die Farben bleiben.
- Bei „Bewegung reduzieren“ im Handy steht der Ring ruhig. Nur App.
- Tests: Vertragstest grün; Browserprobe (Ring hell ↔ blass sichtbar).

## 2.496.0 – 2026-10-19 – 🕑 Zeitumstellung und 🏛️ Werne-Wissen im Info-Feld (KC-CLUB-ZEITUMSTELLUNG-INFO, KC-CLUB-WERNE-WISSEN)
Wunsch Hansi („Wird in der Info auf Uhrzeit umstellen hingewiesen?“ – bisher nur der Push am Samstag ab 18 Uhr).
- Ab Donnerstag vor der Umstellung (letzter Sonntag im März/Oktober) steht im Info-Feld „🕑 In der Nacht zum Sonntag: Uhr zurückstellen“ (bzw. vorstellen), am Samstag gelb „Heute Nacht: Uhr zurückstellen – eine Stunde länger schlafen 😴“, am Sonntag „Seit heute Nacht Winterzeit – Backofen-, Auto- und Wanduhren schon umgestellt?“. Jedes Jahr von selbst berechnet.
- Der Push am Samstag ab 18 Uhr bleibt. Hilfe-Eintrag „Erinnerung an die Zeitumstellung“ ergänzt. Nur App, keine zusätzliche Datenbank-Abfrage.
- **Werne-Wissen (KC-CLUB-WERNE-WISSEN, Wunsch Hansi „in die Info einbauen“):** jeden Tag ein „🏛️ Wusstest du? …“ über Werne im Info-Feld (Lippe, Kreis Unna, Sim-Jü, Sole, Turmkater, St. Christophorus, Altes Rathaus, Gersteinwerk, Stadtteile, Wildgehege, Sprichwörterbrunnen …) – nur sichere Fakten, Jahreszahlen erst nach Prüfung. Antippen oder „🧩 Werne-Rätsel“ dreht die Bühne um und öffnet das Bilderrätsel „Wie gut kennst du …?“. Das Werne-Wissensquiz selbst ist vorgemerkt (Wunschliste #26).
- Tests: Vertragstests (Zeitumstellung Oktober 2026/März 2027; Werne-Wissen täglich wechselnd, keine Jahreszahlen) grün.

## Server 2.495.0 – 2026-10-19 (ohne App-Build) – App-Start sparsamer, Stufe 2 Punkt 3 (KC-CLUB-START-SPARSAM-2)
Wunsch Hansi („Bau die offenen Positionen noch, damit sie um 12:00 noch rübergehen“):
- Clubtermine für den App-Start je Server-Instanz 60 s gemerkt: das nächste Treffen (Startseite) und die kommenden Treffen für die Zahl auf der Termin-Kachel. Gemerkt werden nur die Termin-Zeilen – Zu- und Absagen werden weiter jedes Mal frisch gelesen. Speichert die App einen Termin (anlegen, ändern, absagen, Erinnerung), ist der Merker sofort weg; Fehler werden nie gemerkt. Spart 2 Abfragen je App-Start.
- Punkt 4 (Kachel-Zahlen in einer Datenbank-Funktion) braucht eine neue Datenbank-Funktion und mehr Tests – kommt mit dem 20-Uhr-Bündel.
- Tests: `tools/db-sparsam/start-sparsam-2-test.ts` erweitert (Termine gemerkt, Kopien, Speichern leert, Fehler nie gemerkt) · Vertragstest-Block 2.495.0.
- Rückweg: Server 2.494.0 erneut hochladen (keine Datenbank-Änderung).

## Server 2.494.0 – 2026-10-19 (ohne App-Build) – App-Start sparsamer, Stufe 2 (KC-CLUB-START-SPARSAM-2)
Freigabe Hansi („Ja“ zu Stufe 2, Punkte 1, 2 und 5 – „vorsichtig, damit alles lauffähig bleibt“). Gleiche Anzeige, weniger Datenbank-Abfragen:
- Selten geänderte Daten merkt sich jede Server-Instanz 60 s: Club-Einstellungen (SOS, Pinnwand, Einstieg, Thema, Schnellantworten – jetzt in der gebündelten Lesung), Wartungsmodus, Funktions-Freigaben (vorher 15 s) und der Zustand des KC Communicators (5 Lesungen). Speichert die App selbst etwas davon, ist der Merker sofort weg; andere Instanzen sehen es spätestens nach 60 s. Fehler werden nie gemerkt. Die Admin-Ansicht des Communicators liest immer frisch.
- Namen aktiver Mitglieder kommen aus der (60 s gemerkten) Mitgliederliste statt aus je einer eigenen Abfrage – die häufigste Abfrage überhaupt (pg_stat_statements: gut 25.000 Aufrufe). Gleiche Felder wie vorher, nie Geburtsdatum; Ausgeschiedene/Gäste wie bisher einzeln.
- Online-Meldung: eigener Fenster-Abgleich (zwei Browser) nur noch jedes 2. Mal geschrieben (30 → 75 s; die App meldet sich alle 60 s). Live-Umfrage 30 statt 15 s gemerkt, Speichern einer Umfrage leert den Merker. „Online seit“ und „zuletzt gesehen“ bleiben bewusst bei 30 s – längere Abstände würden die Online-Anzeige flackern lassen.
- Die Zählung „welche Tabelle wie oft“ (KC-CLUB-DB-PFADE, 2.489.0) ist wieder ausgebaut (KC-SPARSAM-PROTOKOLLE: messen über eigene Tabellen und pg_stat_statements).
- Tests: `tools/db-sparsam/start-sparsam-2-test.ts` (echter Server-Code, 300 Zufallswelten: Namen alt = neu; Merker: Kopien, Speichern leert, Lesung während des Speicherns wird nicht gemerkt, Fehler nie gemerkt) · Vertragstest-Block 2.494.0.
- Rückweg: Server 2.493.0 erneut hochladen (keine Datenbank-Änderung).

## Server – 2026-10-19 (ohne App-Build) – KC-CLUB-ANFRAGE-ALLE-INFO: Terminanfrage an mehrere – alle erfahren Antworten
- Wunsch Hansi („Termin mit Dieter und Klaus … wenn Zusagen, Absagen, andere Vorschläge kommen, müssen alle benachrichtigt werden“): Anfragen an mehrere Personen gingen schon (Mitglieder wählen oder Gruppe), Antworten und Gegenvorschläge erfuhr aber nur der Anfragende. Jetzt bekommen auch die übrigen Eingeladenen Push/E-Mail bei Ja, Vielleicht, Nein und Gegenvorschlag („… zu der du auch eingeladen bist“). Angenommene Vorschläge (neue Zeit) und Absagen gingen schon an alle.
- Rückweg: Server-Stand vor diesem Eintrag erneut hochladen.

## Spiegel – 2026-10-19 (ohne App-Build) – KICC-F-109: Spiegel überträgt nur geänderte Blöcke
Wunsch Hansi („mach du die Umbauten, es muss kostenlos bleiben“; Supabase-Egress 7,19 von 5 GB). Nichts wird reduziert – jede Tabelle wird weiter alle 6 Stunden gespiegelt und vollständig geprüft.
- Tabellen mit Ganzzahl-Schlüssel werden in Blöcke zu 500 Schlüsselnummern geteilt. Supabase liefert je Block nur Zeilenzahl + Prüfsumme (`kc_db_mirror_block_hashes`, ~1 KB je Tabelle), Neon rechnet dasselbe; übertragen werden nur abweichende Blöcke (`kc_db_mirror_block_rows`). Beispiel kc_club_protokoll: statt 3,4 MB je Lauf meist nur der letzte Block.
- Danach Prüfung der ganzen Tabelle wie bisher. Passt sie nicht, ist der Block-Weg nicht möglich oder sind über 60 % der Blöcke anders → ganze Tabelle wie früher.
- DB: `supabase/migrations/20261019_kicc_f109_spiegel_bloecke.sql` (bereits eingespielt, nur Lesefunktionen).
- Rückweg: Spiegel-Arbeiter-Stand vor diesem Eintrag erneut hochladen.

## 2.493.0 – 2026-10-19 – „Dienstplan Weihnachtsmarkt: Wünsche eingeben?“ im Info-Laufband (KC-CLUB-DW-LAUFBAND) · Server 2.493.0
Wunsch Hansi („Dienstplan Weihnachtsmarkt eingeben? – wer schon eingegeben hat, nicht anzeigen – und dann zu Twinkey führen“):
- Rote Meldung im Info-Laufband mit Knopf „📝 Mit Twinkey eingeben“ – öffnet direkt die Dienstwünsche mit Twinkey. Nach dem Öffnen bis zum nächsten App-Start nicht mehr.
- Nur für Mitglieder/Aushilfen, die für den Weihnachtsmarkt 2026 noch keine Wünsche abgegeben haben (Server prüft kc_dp_wish_inbox, submitted_at), nur bei offener Wunschphase (Stand 5 Min. gemerkt). Fehler → keine Meldung. Stand 19.10.: 9 von 17 noch offen.
- Start: 1 Abfrage mehr (nur bei offener Wunschphase).
- Tests: tools/dienstwunsch/dw-laufband-browser.mjs (Chromium, 4 Prüfungen), Vertragstests grün, Typprüfung unverändert.

## 2.492.0 – 2026-10-19 – „Unterstützung bei der Club-App?“ – Anfrage mit kurzem Fragebogen (KC-CLUB-UNTERSTUETZUNG-ANFRAGE) · Server 2.492.0
Wunsch Hansi („Unterstützung Club App?? Anfrage senden … Fragebogen in Kategorien … weniger Punkte, sonst wird der User überfordert“):
- Info-Laufband (und Mehr → 🙋 Unterstützung anfragen): „Unterstützung bei der Club-App? – Anfrage senden“. Ausblendbar; nach dem Senden 30 Tage Pause.
- Fragebogen mit nur 8 Punkten in 5 Bereichen (Einrichten, Benachrichtigungen, Bedienung, Nachrichten, Termine & Dienste) + „Etwas anderes“ + Kontaktwunsch (📞 Anruf, 💬 Nachricht, 🤝 Persönlich). Eine offene Anfrage je Person – neue Angaben ergänzen sie.
- Admin: Push + E-Mail, orange Meldung im Laufband mit Anzahl, Liste unter Mehr → 🙋 Unterstützung mit 📞 Anrufen, 💬 Nachricht, 🔧 Übernehmen (Mitglied bekommt „… kümmert sich“), ✅ Erledigt.
- Neue Tabelle kc_club_unterstuetzung (gespiegelt, gesichert). Start: 1 Abfrage mehr nur für den Admin.
- Tests: tools/unterstuetzung/ua-browser.mjs (Chromium, echte App, 8 Prüfungen), Vertragstests grün (neuer Block, gleiche Punkte in App und Server), Typprüfung unverändert.
- Rückweg: App 2.490.0 / Server 2.491.0 erneut einspielen; die Tabelle stört dann nicht.

## Server 2.491.0 – 2026-10-19 – Notfall-Paket: seltener, gemeinsam, nur Geänderte (KC-CLUB-NOTPAKET-SELTENER/-GEMEINSAM/-NUR-GEAENDERTE)
Wunsch Hansi („Kannst du das Notfall-Paket in kleinen Stücken bauen? … Ja bau 1 und 2. Und auch 3“; Anlass: Warnung „hohe Datenbank-Last“ – ein Bau kostet ~3.300 Abfragen). Nur Server, die App bleibt 2.490.0 (kein Neustart aller Apps).
- **1 · Seltener:** tagsüber höchstens alle 3 Std. statt stündlich, nachts (22–6 Uhr) gar nicht wegen geänderter Daten. Weiter immer: neuer Tag, erstes Paket, nach einem Fehler (frühestens nach 30 Min.), „erzwingen“. Der Nachtrag aus dem Notbetrieb läuft unverändert alle 15 Min.
- **2 · Gemeinsame Abfragen nur einmal:** Der erste Teil-Aufruf (4 Mitglieder) läuft allein und gibt die Antworten, die er mehrfach brauchte (für alle gleich: Mitglieder, Treffen, Pinnwand …), an die übrigen Teile weiter. Gleicher Schlüssel = exakt dieselbe Abfrage; nur fehlerfreie Antworten, höchstens 1,5 MB.
- **3 · Nur geänderte Mitglieder:** Haben sich seit dem letzten Bau nur Chats geändert (neue/bearbeitete Nachrichten, Reaktionen, Anheften, Ausblenden, neue Chats), werden nur die Teilnehmer dieser Chats neu gebaut, alle anderen kommen unverändert aus dem letzten Paket (Messung der letzten 4 Tage: meist 1–3 von 17 Mitgliedern). Bei jedem Zweifel wie bisher alles: Löschungen, jede andere Tabelle, neuer Tag, geänderte Zugänge, zurückgesetzte Zähler, weniger gefundene als gezählte Zeilen, fast alle betroffen, spätestens alle 6 Std.
- Datenbank: neue Funktion `kc_club_notpaket_zaehler()` (nur lesend) und Tabelle `kc_club_notpaket_vorrat` (letztes Paket, nur Server, nie gespiegelt) – Migration `20261019_kc_club_v2491_notpaket_teile.sql`, Probelauf `tools/db-test/83_notpaket_teile_test.sql`. Ohne Migration baut der Server einfach wie bisher alles.
- Protokoll „notpaket_gebaut“ zeigt zusätzlich Teilbau ja/nein, neu gebaute Mitglieder, Plan-Grund und übernommene Vorrat-Antworten.
- Tests: Planer mit nachgestellter Datenbank (13 Fälle: nur Nachricht → nur Teilnehmer; Löschung/Treffen/Zähler zurück/fehlende Zeile/neuer Tag/6 Std./fast alle → alles), Vorrat hin und zurück; Vertragstests grün.
- Rückweg: Server 2.490.0 erneut hochladen; Datenbank: `drop function public.kc_club_notpaket_zaehler(); drop table public.kc_club_notpaket_vorrat;`

## 2.490.0 – 2026-10-19 – Link-Vorschau: auch „www.…“ und bei schnellem Senden · Server 2.490.0
Fund Hansi (Test an mich: „www.puerform.de“ – keine Karte): Die Vorschau erkannte nur Links mit http(s)://, und beim sofortigen Senden (Karte noch nicht geladen) ging der Link nicht mit.
- App erkennt jetzt auch „www.…“ (ergänzt https://) und gibt den Link beim Senden immer mit – außer man hat für genau diesen Link ✖ getippt. Der Server holt die Vorschau ohnehin selbst.
- Server akzeptiert „www.…“ im Text; beim Bearbeiten bleibt die Karte, solange der Link (auch ohne https://) im Text steht.
- Tests: lv-browser.mjs um beide Fälle erweitert (12 Prüfungen grün), lv-test.ts grün, Vertragstests grün. Behebt einen Fehler, der Mitglieder behindert → sofort eingespielt (AGENTS.md).

## Server 2.489.0 – 2026-10-19 – App-Start sparsamer, Stufe 1 + genaue Messung (KC-CLUB-START-SPARSAM, KC-CLUB-DB-PFADE)
Wunsch Hansi („Online-Meldung nachmessen, App-Start sparsamer – vorsichtig, damit alles lauffähig bleibt“). Nur Server, die App bleibt 2.488.0 (kein Neustart aller Apps).
- **App-Start, gleiche Antwort:** offene Vorschläge einmal statt dreimal holen (Abstimmungen, Vorschlags-Zahl, Themen zur Sitzung); meine Freigaben einmal statt zweimal (Geburtstag/Kontakt); meine Einstellungen einmal statt zweimal („stumm“ für die Zähler); öffentlicher Push-Schlüssel 10 Min. gemerkt. ≈ 5 Abfragen weniger je Start (72 → ≈ 67).
- **Messung:** bei jedem 4. App-Start, jeder 4. Online-Meldung und jedem 4. Chat-Öffnen schreibt der Server ins Log, welche Tabelle/Funktion wie oft gefragt wurde (nur Namen und Anzahl, keine Inhalte) – Grundlage für Stufe 2.
- Tests: tools/db-sparsam/start-sparsam-test.ts (500 Zufallswelten alt = neu), online-sparsam-test.ts, db-puffer-test.ts grün; Vertragstests grün (Prüfungen auf die gleichwertige Form erweitert); Typprüfung unverändert (17).
- Rückweg: Server 2.488.0 bzw. 2.486.0 erneut hochladen.

## 2.488.0 – 2026-10-18 – 🥫 Sardinenbüchse öffnet die Rückseite des Kopfs (KC-CLUB-SARDINENDOSE)
Wunsch Hansi: „Wenn die Sardinenbüchse auf ist, muss die Bühne bzw. die Rückseite des Kopfbereichs kommen – genau so, als wenn ich doppelt aufs Eselsohr klicke.“
- Lange aufs Eselsohr drücken: Der Kopf rollt sich wie der Deckel einer Sardinenbüchse von rechts unten nach links oben auf (Messing-Rolle mit Dosenschlüssel) – und darunter liegt schon die **Rückseite** mit der zuletzt gewählten Ansicht (Bühne, Diashow, Tafel, Uhr …). Am Ende derselbe Zustand wie nach dem Doppeltipp.
- **Rückgängig mit langem Festhalten** (Nachtrag Hansi): lange aufs Eselsohr hinten drücken – der Deckel rollt sich von links oben nach rechts unten wieder über die Rückseite zu, danach ist der Kopf wieder vorne. Doppelt tippen (oder nach rechts ziehen) geht weiterhin. Das Röllchen „Bühne ausrollen“ und das Doseninnere entfallen; ein in 2.487.0 gemerktes „aufgerollt“ wird gelöscht, der Kopf ist wieder da.
- Bei „Bewegung reduzieren“ dreht der Kopf einfach um. Nur App.

## 2.487.0 – 2026-10-18 – 🥫 Bühne aufrollen wie eine Sardinenbüchse (KC-CLUB-SARDINENDOSE)
Wunsch Hansi: „Die Bühne bei Doppelklick unten rechts auf die Ecke von rechts unten nach links oben wie eine Sardinenbüchse aufrollen – aber so, dass man es wieder rückgängig machen kann.“ (Wahl Hansi: lange drücken statt Doppeltipp, weil der Doppeltipp schon den Kopf umdreht; danach ein Röllchen mit Dosenschlüssel.)
- **Lange aufs Eselsohr drücken** (ohne zu ziehen): Die Bühne wird schräg von rechts unten nach links oben weggerollt – eine goldene Messing-Rolle mit Dosenschlüssel-Ring läuft mit und wird dicker; darunter kommt das Innere der Dose zum Vorschein – silberne Sardinen der Länge nach nebeneinander, dunkles Öl, silberner Rand (nach Hansis Vorbild-Foto).
- Danach oben links ein **Röllchen mit Dosenschlüssel** („🥫 Bühne ausrollen“) – antippen rollt die Bühne rückwärts wieder ab.
- Doppeltipp aufs Eselsohr dreht den Kopf wie bisher um; Ziehen nach links ebenso. Der Hinweis beim einfachen Antippen nennt jetzt auch das lange Drücken.
- Gemerkt auf diesem Gerät (bleibt auch nach Neustart aufgerollt); bei „Bewegung reduzieren“ ohne Animation. Hilfe-Eintrag „Bühne aufrollen wie eine Sardinenbüchse“. Nur App.

## 2.486.0 – 2026-10-18 – Link-Vorschau in Nachrichten (KC-CLUB-LINK-VORSCHAU) · Server 2.486.0
Wunsch Hansi („Ja, Link-Vorschau bauen“, Vergleich mit WhatsApp): Steht ein Link in einer Nachricht, zeigt die App eine kleine Karte mit Bild, Titel, Kurztext und Seite.
- Beim Schreiben: 0,8 s nach dem Tippen holt der Server die Vorschau (keine Datenbank-Abfrage); Karte über dem Schreibfeld, ✖ = ohne Vorschau senden. App-Sprung-Links bekommen keine Karte.
- Beim Senden holt der SERVER die Angaben selbst (aus dem 10-Min.-Merker) – der Absender kann keine Vorschau fälschen. Gespeichert: Text + Bild-ADRESSE in kc_club_link_vorschau (löscht sich mit der Nachricht, gespiegelt und gesichert). Chat-Laden: 1 Abfrage mehr (parallel).
- Sicherheit: nur http(s) Port 80/443, keine IP-Adressen und internen Namen, jede Weiterleitung neu geprüft (höchstens 3), 5 s, 512 KB, nur HTML; je Person höchstens 30 Abrufe je 10 Min.; alles als Text dargestellt; Bilder nur https, ohne Absender-Angabe (no-referrer), erst beim Ansehen geladen.
- YouTube über die offizielle Vorschau-Schnittstelle (oEmbed). Manche Seiten sperren Abrufe von Servern (z. B. Chefkoch) – dann geht der Link ohne Karte raus.
- Bearbeiten: Link entfernt → Karte entfernt. Hilfe-Eintrag „Vorschau zu Links in Nachrichten“, Twinkey-Frage.
- Tests: tools/link-vorschau/lv-test.ts (Adressen-Schutz 21 Fälle, Auswertung, Bremse; mit --netz echte Seiten: Wikipedia, Tagesschau, YouTube), tools/link-vorschau/lv-browser.mjs (Chromium, echte App: 10 Prüfungen inkl. eingeschleustes HTML), Vertragstests grün, Typprüfung unverändert (17).
- Rückweg: App 2.484.0 und Server 2.485.0 erneut einspielen; die Tabelle stört dann nicht.

## Server 2.485.0 – 2026-10-18 – Weniger Datenbank-Abfragen: Online-Meldung und Wartung (KC-CLUB-ONLINE-SPARSAM, KC-CLUB-WARTUNG-STUNDE)
Anlass: Rangliste 18.10. (10:46–20:30 MESZ, Hansi „OK 2 und 3“): Online-Meldung 17 Abfragen je Aufruf (20 % aller gemessenen), Wartung 71 je Lauf alle 15 Min. (14 %).
- **Online-Meldung, gleiche Antwort:** eigene Einstellungen (online_seit, fenster, online, vorführen, schnappschuss) in EINER Abfrage statt fünf; Anklopfen an mich/von mir in einer statt zwei; klingelt gerade/verpasst in einer statt zwei; Einstellungen der Online-Leute (sichtbar, Inkognito, anklopfbar, online seit, Gerät) in einer statt vier bis fünf; eigenes Fenster höchstens alle 30 s neu schreiben (Erkennung „anderes Gerät“ prüft 180 s); laufende Live-Umfrage 15 s gemerkt. Vorher ≈ 17, jetzt ≈ 8–10 Abfragen.
- **Wartung:** Aufräumen (Spur, App-Starts, Lesebestätigungen, Geräte-Kennungen, Protokoll-Wächter) und Tagesaufgaben mit Stundenschwelle oder Fristen von Stunden/Tagen (Wochenbericht, DB-Größe, Stadt-Termine, Schulung, Reise-Checkliste, Dienst-Gruß, Realtime-Kontingent, Antwort-Erinnerung 2 Tage, wichtig-ungelesen, Probephase, To-do-Fristen, Geburtstags-Zettel, Zeitumstellung, Admin-abwesend, Geburtstags-Push, Nachfassen) nur noch im Lauf zur vollen Stunde – die Schwellen sind volle Stunden, darum kommt alles zur selben Zeit wie bisher. Minutengenaues bleibt alle 15 Min. (Fehler-Push, Postausgang, Änderungen, Gastgeber, Archiv-Kopie nachts, Sonderstunden, Dienstwunsch-Eingang, Abstimmungsfristen, Dienst-Erinnerung, Termin-/Spiel-/Privat-Erinnerungen, Ruhezeit). Messung getrennt: Server-Log „wartung“ und „wartung_stunde“.
- Nur Server – die App bleibt 2.484.0 (kein Neustart aller Apps).
- Tests: tools/db-sparsam/online-sparsam-test.ts (echter Server-Code, nachgebaute Datenschnittstelle, 300 Zufallswelten: Online-Liste, Anklopfen, Anrufe alt = neu, nie mehr Abfragen); Vertragstests grün (bestehende Prüfungen auf die neue Form erweitert, neuer Block 2.485.0); Typprüfung unverändert (17); Server-Probestart lokal ok.
- Rückweg: Server 2.484.0 erneut hochladen.

## Server – 2026-10-18 (ohne App-Build) – KC-CLUB-PUSH-NEU-EINGESCHALTET: kein Rot mehr nach neu eingeschaltetem Push
- Fall Christina: Push am 12.10. nicht angekommen (altes Abo abgelaufen), am 18.10. neu eingeschaltet – in der Mitgliederliste blieb sie rot, weil Rot erst nach dem nächsten erfolgreich zugestellten Push verschwand. Jetzt hebt ein Push-Abo, das nach dem Fehler eingeschaltet wurde, das Rot auf. Scheitert der nächste Push, wird es wieder rot. Nur Admin-Anzeige.
- Rückweg: Server-Stand vor diesem Eintrag erneut hochladen.

## 2.484.0 – 2026-10-18 – 🏖️ Schulferien im Kalender (KC-CLUB-FERIEN) · Server 2.484.0
Wunsch Hansi: „Baue Ferien-Termine in den Kalender wie Feiertage. Und einstellbar genau wie Feiertage. Darunter eine einklappbare Liste mit den Bundesländern zum Anhaken.“
- Im Club-Kalender sind Ferientage sandfarben hinterlegt (mit Punkt); antippen zeigt „🏖️ Herbstferien · Schulferien Nordrhein-Westfalen · 17.10.–31.10.“. Gleiche Ferien mehrerer Länder werden ein Eintrag. Andere Termine (Sitzung, Feiertag, Geburtstag …) behalten ihre Farbe – Ferien färben nur Tage ohne anderes.
- Einstellbar wie die Feiertage: ⚙️ → 🧩 Startseite & Ansicht → **🏖️ Schulferien im Kalender** (an/aus, je Gerät); darunter aufklappbar **🗺️ Bundesländer wählen** mit allen 16 Ländern zum Anhaken (vorgewählt: Nordrhein-Westfalen).
- Auch in Legende, Kalender-Druck („🏖️ Schulferien“), Hilfe und Einstellungs-Suche.
- Quelle: OpenHolidays (openholidaysapi.org, frei, ohne Schlüssel). Server ohne Datenbank, 24 Std. im Speicher; das Gerät hält je Jahr 30 Tage vor.
## 2.483.0 – 2026-10-18 – Bündel: sechs Glocken-Uhren mit echten Aufnahmen · TÜV-Pakete 1–3 · Adventskalender als Überraschung
- KC-CLUB-STUNDENUHREN-ECHT: Wunsch Hansi „schneiden und als Uhren einbauen“: Big Ben 1945 (gemeinfrei), Westminster-Glockenspiel (Carillon, CC BY-SA 4.0), Kieler Rathaus-Glockenspiel (CC BY 4.0), Freiburger Rathaus-Glockenspiel (CC BY-SA 4.0), Berliner Dom (CC BY-SA 4.0), Röhrenglocken-Standuhr (CC0) – freie Aufnahmen von Wikimedia Commons, gekürzt (mono MP3, je < 160 KB), Quelle/Urheber/Lizenz bei der Uhr. Ohne Datei spielt der selbst erzeugte Ton einer verwandten Uhr.
- Fehler an der Quelle behoben: echte Aufnahmen wurden geladen, bevor die Tonausgabe lief – beim ersten Mal lud nichts. Jetzt Laden nach dem Start, bis zu 4 s Warten auf die Aufnahme.
- TÜV-Paket 1 (Hansi: „1 Fehler beheben“): KC-CLUB-MARKE-UMLAUT („KÖCHECLUB“ – Ö-Punkte waren abgeschnitten), KC-CLUB-EINFACH-DIENSTWUNSCH (einfache Ansicht: „Mein Dienst“ = Blatt mit Wunsch → Plan → Zeiten), KC-CLUB-CHATLISTE-ANTIPPEN (Antippen öffnet; Favorit/Archiv/Löschen über ⋯; Markieren unverändert), KC-CLUB-START-FEHLER (Start bei Serverfehler: Hinweis + „Nochmal“ + Wiederholung nach 5/15/30 s; Status vor dem Laden ⚪ statt 🟢), KC-CLUB-FEHLER-EHRLICH („Der Fehler ist gemeldet“ meldet jetzt wirklich; RangeError/„Cannot convert“ deutsch), KC-CLUB-LANGE-LINKS, KC-CLUB-ZURUECK-SITZUNG (nach Update/Neuladen führt Zurück nicht mehr in leere Seiten des vorigen Starts), Einschalten-Knopf bei großer Schrift, Twinkey „Fragen“ ohne Text, gleicher Chat per Push = kein doppeltes Zurück.
- TÜV-Paket 2 (Hansi: „2 Schneller + weniger Daten“): KC-CLUB-LADEANZEIGE (sofort Kochmütze + „Die Club-App wird geladen …“ statt bis zu 30 s leerer Fläche; langsames Netz löst nicht mehr „startet nicht richtig“ aus), KC-CLUB-UPDATE-SPARSAM (Update 3,1 → 1,5 MB, erster Start 3,0 → 1,5 MB: Programm/Seite nur einmal laden, Seite muss zur Version passen), KC-CLUB-VERLAUF-KURZ (version.json 172 KB → 5 KB, ganzer Verlauf in verlauf.json – Werkzeug tools/verlauf-kuerzen.mjs), KC-CLUB-AKKU-TUEV (Jahreszeiten-Bild 20 statt 30 Bilder/s, Ruhe nach 20 s, schwache Handys sparsam).
- TÜV-Paket 3, Teil 1 (Hansi: „3 Aufräumen & einheitlich“): KC-CLUB-START-KOMPAKT („Warum diese App?“ als kompakte Zeile – erste Kachel sofort sichtbar), KC-CLUB-EINFACH-MEHR (einfache Ansicht + Fotos, Vorschläge, Erstattung), KC-CLUB-EIN-HINWEIS (Unterstützungs-Frage nur, wenn bei diesem Öffnen noch kein Info-Fenster kam – vorhandener Kern KC-CLUB-RUHE), KC-CLUB-KONTRAST, KC-CLUB-TIPPFLAECHE, KC-CLUB-MELDUNG-EINMAL, KC-CLUB-OFFLINE-KLARTEXT, KC-CLUB-CD-HAKEN (Häkchen weinrot). Nichts entfernt.
- TÜV-Paket 3, Teil 2 (Hansi: „2, 3“): KC-CLUB-EINST-LISTE-EINFACH (einfache Ansicht: Einstellungen als ruhige Liste mit Klappbereichen statt Reiter + Kartenstapel; eigene Kartei-Wahl bleibt), KC-CLUB-KLAPPE-EINHEIT (alle kleinen Klappbereiche mit demselben weinroten Pfeil ▸/▾ links – vorher Browser-Dreieck, Strich oder gar kein Zeichen; große Karten unverändert).
- KC-CLUB-ADVENT-UEBERRASCHUNG (Wunsch Hansi „Nimm den Adventskalender aus der Info – das ist eine Überraschung“): vor dem 1. Dezember sehen Mitglieder ihn nirgends (Hilfe, „Neu in der App“, ⚙️ Effekte); Admins sehen ihn zum Prüfen. Laufband-Erinnerung kam ohnehin erst im Dezember.

## 2.482.0 – 2026-10-18 – 🏙️ Info-Laufband: „Diese Woche in Werne“ (KC-CLUB-LAUFBAND-WERNE) · 📣 Startnachricht mit Lesebestätigung (KC-CLUB-STARTNACHRICHT) · Server 2.482.0

**📣 Startnachricht** (Wunsch Hansi: „Als Admin direkt als Startnachricht an alle, eine Gruppe oder eine Personenwahl eine Nachricht schicken, als wichtig markierbar. Beim Programmstart bekommen die Ausgewählten sie. Bestätigungs-Knopf ‚gelesen‘ als Pflicht und ein Rückfrage-Knopf – die Antwort kommt bei mir an. Auch für Clubsprecher und Kassenwart, aber für die beiden noch nicht freischalten.“)
- Admin-Register → **📣 Startnachricht**: Text, **❗ als wichtig markieren** (rot + Push „Bitte die App öffnen“), Empfänger **Alle / Ämter / Chat-Gruppe / Personen**.
- Die Empfänger bekommen sie beim nächsten Öffnen der App als Fenster: **Pflicht** „Ich habe die Nachricht gelesen“ ankreuzen → „✅ Gelesen – bestätigen“ (nicht wegtippbar, kein ✕); **↩️ Rückfrage** kommt als Chat-Nachricht beim Absender an. Mehrere Startnachrichten kommen nacheinander.
- Überblick „Gesendet“: wer gelesen hat (mit Uhrzeit), wer noch nicht, Rückfragen; **zurückziehen** möglich.
- Auf Wunsch mit Knopf **🔔 Benachrichtigungen jetzt einschalten** (Fall Dieter): je nach Handy der Knopf, „✅ sind an“ oder die Anleitung, wenn sie im Handy gesperrt sind.
- **Clubsprecher und Kassenwart**: fertig eingebaut, aber **noch nicht freigeschaltet** – Schalter dafür im selben Fenster (nur Admin). Freigeschaltet sehen sie die Kachel unter „Meins“ und nur ihre eigenen Startnachrichten.
- Ohne neue Tabelle und ohne zusätzliche Abfrage beim App-Start (steht in den persönlichen Einstellungen, die der Start ohnehin lädt); selbst überschreiben können Mitglieder sie nicht.

Wunsch Hansi: Punkt 3 des Info-Feld-Konzepts – „Programm in Werne“, damit es lebendiger wird.
- Im Info-Laufband erscheint je Runde ein Tipp aus dem Veranstaltungskalender der Stadt Werne (Feste, Märkte, Sim-Jü, Sonstiges, Theater & Konzerte, Führungen & Ausstellungen; ohne Wochenmarkt): „🏙️ Diese Woche in Werne: Herbstkirmes · Sa., 24.10. – So., 25.10. · Innenstadt“, am Tag selbst „Heute in Werne: …“. Täglich ein anderer; antippen öffnet die Seite der Stadt. Mit ✕ für heute ausblendbar.
- Sparsam: neue Server-Aktion `stadt_woche` für alle Mitglieder **ohne Datenbank** (Stadt-Kalender von werne.de, Ergebnis 6 Std. im Speicher); jedes Gerät fragt **höchstens einmal am Tag** und erst 4 s nach dem Start.

## 2.481.0 – 2026-10-18 – 📣 Info-Laufband schlauer und lebendiger (KC-CLUB-LAUFBAND-SCHLAU) · 🏠 Frühwarnung für Gastgeber (KC-CLUB-GASTGEBER-FRUEHWARNUNG) · 🔔 Anklopfen-Fehler behoben · Server 2.481.0
Wunsch Hansi: „Das muss noch etwas intelligenter werden. Wer schon zugesagt oder eine Abstimmung schon gemacht hat, braucht nur einen Hinweis mit grünem Haken – nicht zu etwas auffordern, was schon erledigt ist. Und ab und an auf neue Funktionen hinweisen, damit es lebendiger wird.“
- **Neue grüne Stufe** = erledigt / gut so. Zugesagt: „✅ Du bist dabei · 👥 7/18“ (grüner Rahmen); abgesagt: „❌ Abgesagt – jederzeit änderbar“; „Vielleicht“ bleibt rot mit Knöpfen.
- **Erledigtes wird bestätigt statt gefordert**: Was heute rot war und erledigt ist (Eingangskorb, Abstimmung, Terminanfrage, Terminfindung, Schulung, Aufgabe, Benachrichtigungen, Büro-Eingang), erscheint bis zum Abend als grüner Haken („Deine Stimme ist abgegeben“, „Erledigt – danke!“). Ausgeblendetes zählt nicht.
- **Neuheiten** (je Gerät an höchstens 3 Tagen, nach dem Antippen nie wieder, eine pro Runde) mit **▶ Ansehen**: 🎃 Halloween-Szene (10.10.–2.11.), 🐕 Herbst mit Kürbis-Hund (Sept.–Nov.), 🐠 Unterwasserwelt – spielt die Szene oben gleich als Vorschau ab; dazu neue Hilfe-Einträge der letzten Versionen.
- **Tageszeit & Anlass**: „Guten Morgen/Guten Abend, Hansi – alles erledigt 👍“, „Gute Nacht 🌙“; Advent, Nikolaus, Weihnachten, Silvester, Neujahr, Halloween. **Am Treffen-Tag** „Heute 18:00 Uhr · Hütte Anne“ mit **🚗 Mitfahrt**, während des Treffens „🍳 Viel Spaß!“, danach **„🙏 Danke fürs Kommen – Fotos hochladen?“**.
- Übersichtlich: höchstens 7 Meldungen plus Tipp im Umlauf. Alles lokal, keine zusätzliche Server-Abfrage.

**🏠 Frühwarnung für Gastgeber** (Wunsch Hansi: „1 Tag vorher E-Mail und Push, wie viele sich angemeldet haben, 2 Stunden vorher nochmal – aber nur, falls Änderungen da sind; ansonsten nur bei Änderung. Und wenn der Clubsprecher das Treffen vorbereitet, E-Mail und Push mit Einladung, Tagesordnung, Uhrzeit und Treffpunkt.“) – Server 2.481.0, ohne DB-Änderung:
- **Vorabend ab 18 Uhr** wie bisher: Anmeldestand an Gastgeber/in und Clubleitung (Push + E-Mail).
- **Danach jede Änderung** (Zu-/Absage, zurückgenommen, neue Notiz) kurz an die Gastgeberin, mit Namen: „❌ Steven hat abgesagt – jetzt 6 Zusagen“. Gesammelt (höchstens alle 15 Min.), nachts 22–7 Uhr zurückgehalten.
- **2 Stunden vorher** der ganze Stand **nur, wenn sich seit der letzten Meldung etwas geändert hat** (mit „Neu seit der letzten Meldung“); sonst bleibt es ruhig.
- **Einladung** aus dem Büro (Tagesordnung, Uhrzeit, Treffpunkt), **Änderung** und **Absage** des Treffens bekommt die Gastgeberin immer per Push **und** E-Mail – egal welcher Weg gewählt ist – mit „Du bist Gastgeberin – aktuell 5 Zusagen“; nicht doppelt.

**🔔 Anklopfen kam nicht an** (KC-CLUB-PUSH-ERLAUBNIS-WEG, Fall Dieter: „angeklopft, er hat nicht angenommen – das passiert öfter“): Hatte das Handy die Erlaubnis für Benachrichtigungen verloren (Android räumt auf, Neuinstallation), stand das alte Abo beim Server weiter als aktiv – der Push-Dienst nahm an, das Handy zeigte nichts, und die App dachte „ein anderes Gerät bekommt ihn“ und schwieg. Betroffen waren 4 Mitglieder. Jetzt meldet die App beim Start die alten Abos dieses Geräts ab und zeigt „🔔 Deine Benachrichtigungen sind aus – jetzt wieder einschalten“; wer anklopft, sieht ehrlich „bekommt gerade keine Benachrichtigungen“.
- **Anklopfen blockiert** (KC-CLUB-ANKLOPFEN-GESPERRT, Wunsch Hansi): Klopft man bei jemandem an, der Anklopfen ausgeschaltet hat, kommt statt einer kurzen Einblendung ein eigenes Fenster „🔕 Dieter hat Anklopfen blockiert – schreib Dieter doch eine Nachricht über den Chat oder ruf an“ mit **💬 Nachricht schreiben** und **📞 Anrufen**. Der 🔕-Knopf in der Online-Liste öffnet es auch (vorher ausgegraut).

## 2.480.0 – 2026-10-18 – SOS-Seite immer mit Notrufnummern
- KC-CLUB-ZEIGE-FUELLEN (TÜV 18.10., Fehler behindert Mitglieder → sofort): Über Hilfe „Zeig mir wo“, Twinkey „Was mache ich im Notfall?“ oder Zurück nach Neuladen öffnete die SOS-Seite leer – ohne Notrufnummern. Ursache: nur sosStart() füllte sie. Jetzt füllt zeige() selbst (wie bei allen anderen Seiten); ebenso Sicherheits-Check. „Neue Gruppe“ ohne Formular → Nachrichten, „Neue Nachricht“ ohne Mitgliederliste lädt sie erst.

## Server-Sicherung – 2026-10-18 (ohne App-Build, Server-Version unverändert) – KICC-F-107: Frankfurt-Sicherung überträgt nur geänderte Teile
Wunsch Hansi („baue um, dass nur geänderte Daten gespiegelt oder gesichert werden“). Nichts wird reduziert – weiter jede Tabelle jeden Tag, verschlüsselt, mit Rücklese-Test und 14 Tagesständen.
- Teilgrenzen großer Tabellen werden vom letzten geprüften Lauf übernommen (`supabase/functions/kc-club/fra-teile.js`); bisher verschob schon eine gelöschte alte Zeile alle Grenzen. Nur der letzte Bereich wird neu geteilt; passt ein Bereich nicht mehr, wird die Tabelle wie bisher neu geteilt.
- Je Teil rechnet die Datenbank zuerst nur die Prüfsumme (SHA-256 des Inhalts). Gleich wie ein geprüfter Teil eines früheren Tages → Datei im Neon-Dateispeicher kopiert (nichts verlässt Supabase); sonst wie bisher abholen, packen, verschlüsseln, hochladen. Der Rücklese-Test prüft auch jede Kopie; eine kaputte Kopie wird verworfen und normal neu gesichert.
- Stand zeigt neu `kopiert` und `uebertragen_roh_bytes`. Wirkung ab dem zweiten Lauf (heute Nacht entstehen die ersten Prüfsummen).
- DB: `supabase/migrations/20261018_kicc_f107_fra_nur_geaenderte.sql` (bereits eingespielt, nur neue Spalten). Test: `tests/fra-teile.test.mjs`.
- Rückweg: Server-Stand vor diesem Eintrag erneut hochladen.

## Spiegel – 2026-10-18 (ohne App-Build) – KICC-F-107: Spiegel und Backup übertragen nur geänderte Tabellen
Wunsch Hansi („baue um, dass nur geänderte Daten gespiegelt oder gesichert werden“; Supabase-Hinweis: Egress unter 5,5 GB). Nichts wird reduziert – jede Tabelle wird weiter gespiegelt und gesichert.
- Spiegel-Arbeiter fragt zuerst nur den Fingerabdruck (`kc_db_mirror_fingerprint`: Zeilen + Prüfsumme, ~100 Byte). Unverändert → kein Abholen; ist die letzte Prüfung älter als 24 h, wird das Ziel in Neon nachgerechnet statt neu übertragen. Geändert → Abholen über `kc_db_mirror_snapshot_text` (bisher kam jede Tabelle doppelt über die Leitung).
- DB: `supabase/migrations/20261018_kicc_f107_spiegel_fingerabdruck.sql` (bereits eingespielt). Backup-Arbeiter v20 im KICC-Repo.
- Rückweg: Spiegel-Arbeiter-Stand vor diesem Eintrag erneut hochladen (Workflow „Spiegel-Arbeiter hochladen“).

## 2.479.0 – 2026-10-18 – Sicherheit: Anlagen-Namen
- KC-CLUB-SICHER-ANLAGENNAME (TÜV 18.10.): Dateiname/-typ einer Anlage (Vorschläge, Terminanfragen, Umfragen) und Stadttermin-Schlüssel gingen per esc() in onclick – der Browser macht aus &#39; vor dem Ausführen wieder ' → präparierter Dateiname hätte fremden Code starten können; nebenbei ging „Hansi's Rezept.pdf“ nicht auf. Jetzt jsArg() wie überall sonst; Test verbietet das Muster.

## 2.478.0 – 2026-10-18 – Einstellungen wieder in der gewohnten Aufteilung, Unterauswahl klappt mit dem Häkchen auf · Admin hört das Gerät (Handy/Tablet/PC) · Server 2.478.0
- KC-CLUB-EINST-KLAPPEN (Wunsch Hansi „Die neue Aufteilung gefällt mir nicht. Besser wieder wie vorher, aber innerhalb der Gruppen einklappbare Bereiche – z. B. Szenen einschalten, dann öffnet sich der Klappbereich mit den Szenen“): Hauptbereiche aus 2.476.0 (KC-CLUB-EINST-GRUPPEN) und „💡 Hilfe & Lernen“ wieder entfernt – Bereiche, Reihenfolge und Namen wie vorher („🗣️ Ansagen, Töne & Tipps“). Neu: 9 Unterauswahlen als eigene, eingerückte Klappbereiche, die beim Einschalten des Schalters von selbst aufgehen (Szenen der Jahreszeiten, Nicht-stören-Zeiten, Sprachbefehle, Schritte vorlesen, Einweisungen, Spiele, Anklopfton, Blinken, Schnellstart-Symbole); Häkchen aus = grau mit 🔒. Suchfeld und Fragezeichen-Korrektur bleiben.
- Wunsch Hansi („Kannst du nur für Admin sagen: Klaus ist vom PC oder Tablet oder Handy online“): Der Server erkennt das Gerät an der Browser-Kennung (User-Agent) bzw. am Hinweis der App (iPad gibt sich als Mac aus – Berührung zählt). Nur Admins: Push „🟢 Klaus (am Handy) ist jetzt online (10:05 Uhr)“, Ansage „Klaus am Handy ist jetzt online“, Meldung beim Öffnen „Im Moment sind Klaus (am PC) …“. Alle anderen wie bisher ohne Gerät. Gespeichert wird nur handy/tablet/pc. Server 2.477.0.

## 2.477.0 – 2026-10-18 – KC Fernhilfe F2: nur Änderungen statt Vollbild · Server 2.477.0
**KC-CLUB-FERNHILFE F2** (Wunsch Hansi „mit F2 weitermachen“, Konzept docs/FERNHILFE_KONZEPT.md): Beim Mitschauen und Vorführen über die direkte Leitung geht nach dem ersten Vollbild nur noch die geänderte Stelle raus (gleicher Anfang/Ende entfallen, große Mitte gepackt). Jede Änderung trägt die Nummer ihres Bildes; passt sie beim Empfänger nicht, fordert er ein Vollbild an (nie ein falsches Bild). Spätestens alle 60 s ein Vollbild (Selbstheilung). Nur an Apps, die das können (Meldung „hallo + f2“) – ältere bekommen weiter Vollbilder; Datenbank-Rückfall unverändert. Server: Protokoll je Sitzung zusätzlich Vollbilder/Änderungen.
Tests: tools/fernhilfe/fh-aenderungen-test.ts 21/21 (Änderung 158 Zeichen statt 28.277 bei 356 KB Liste), tools/fernhilfe/fh-aenderungen-browser.mjs (Chromium, echte App) grün, fh-leitung-test.ts 11/11, fern-bedienen-test.mjs grün, Vertragstests grün, Typprüfung unverändert (17). Hilfe/Twinkey/Lupe: keine sichtbare Änderung, nichts nachzuziehen.
Rückweg: 2.476.0 erneut einspielen.

## 2.476.0 – 2026-10-18 – Bündel: Adventskalender, Einstellungen neu geordnet, echter Hahn, „Heute“ im Kalender, letzte Chat-Nachricht offen, Uhren ohne Kratzen
Bündel (Wunsch Hansi „Spiele alles ein, was noch offen ist“) – eine Version mit:
- KC-CLUB-ADVENTSKALENDER: 24 Türchen mit Bastelanleitungen für süße Naschereien (Wunschliste #17): Wunsch Hansi „Adventskalender einbauen“: vom 1. bis 24. Dezember jeden Tag ein Türchen (Weinrot/Beige, heutiges leuchtet golden) mit einer Bastelanleitung für eine kleine süße Nascherei. Erinnerung im Info-Laufband, solange das heutige Türchen zu ist; frühere nachholbar, spätere gesperrt. Merkt sich das Gerät (kein Server). ⚙️ → Effekte → 🎄 Adventskalender (an/aus, Kalender ansehen); Hilfe-Eintrag. Nur App.
- KC-CLUB-EINST-GRUPPEN: Einstellungen übersichtlicher – Hauptbereiche, Suche, Unterauswahl erst nach Häkchen: Wunsch Hansi („Der Einstellungen-Bereich ist riesengroß … erst wenn man ein Klickkästchen aktiviert, sollen sich die weiteren Auswahlen öffnen lassen“, alle 4 Punkte): (1) Unterauswahlen grau mit 🔒, bis der Schalter darüber an ist – Nicht stören, Sprachsteuerung, Spiele, Anklopfen, Jahreszeiten, Verbindungs-Symbol, Schnellstart, Schritt-Unterstützung, Einweisung, Stundenuhr (data-abh). (2) Fragezeichen in der einfachen Ansicht nur noch einmal; neuer Bereich „💡 Hilfe & Lernen“ (Tipp des Tages, Was neu, Unterstützung, Einweisung, Rundgang, Videos). (3) Erweiterte Ansicht: 6 Hauptbereiche (+ Admin), darin die bisherigen Bereiche als Unterbereiche (Registry EINST_GRUPPEN, nur umgehängt – Schalter, ids, gemerkte Zustände bleiben); einfache Ansicht unverändert flach. (4) „🔍 Einstellung suchen“ oben. Hilfe-Sprünge, Rundgang und Sprachziele angepasst. Nur App.
- KC-CLUB-STUNDENUHREN-ORIGINAL: echter Hahnenschrei bei der Prager Rathausuhr: Wunsch Hansi „Baue die echten Aufnahmen ein“: freie Aufnahme „Kukuriku“ (Yosef Ben Melamed, Wikimedia Commons, CC BY-SA 4.0; gekürzt, 19 KB) statt des nachgebauten Hahns. Quelle, Urheber und Lizenz stehen bei der Uhr im Klappbereich. Registry SU_AUFNAHMEN für weitere Aufnahmen (Download der übrigen bei Commons zurzeit gesperrt); ohne Datei/offline klingt der selbst erzeugte Ton. Nur App.
- KC-CLUB-KAL-HEUTE: „📍 Heute“ oben im Kalender: Wunsch Hansi („oben im Kalender ‚Heute‘, damit man gleich auf den heutigen Tag landet – platzsparend, keine Zeile verschwenden“): kleiner Knopf „📍 Heute“ in der Jahreszeile unter dem Monatsnamen (keine neue Zeile). Rot, wenn ein anderer Monat/Tag gezeigt wird; grau, wenn man schon bei heute ist. Antippen springt auf den heutigen Tag. Nur App.
- KC-CLUB-CHAT-LETZTE-OFFEN: letzte Nachricht im Chat bleibt offen: Wunsch Hansi („In Nachrichten die letzte Nachricht offen lassen“): Beim Einklappen vergangener Tage bleibt der Tag mit der letzten Nachricht immer offen – vorher war ohne Nachricht von heute alles eingeklappt (auch wenn er über eine Woche zurückliegt). Hinweistext in den Einstellungen angepasst. Nur App.
- KC-CLUB-STUNDENUHREN-KLANG: Uhren ohne Kratzen: Fund Hansi („In den Tönen der Uhren sind Kratzgeräusche“): Der Nachhall war ein Faltungshall aus 2,8 s Rauschen – rechenschwer (auf dem Handy Aussetzer = Knacksen) und körnig. Jetzt vier Rückkopplungs-Echos mit Tiefpass: 25–45 % weniger Rechenzeit (gemessen), glatter Ausklang, Pegel unverändert (Spitze ≤ 0,87). Klöppel-Geräusch leiser. Stabilität der Rückkopplung im Test geprüft. Nur App.

## 2.475.0 – 2026-10-18 – KC Fernhilfe (Mitschauen direkt, Bedienen, Ton) + Hilfe auf dem neuesten Stand · Server 2.475.0 (sofort eingespielt, Wunsch Hansi)
**KC-CLUB-FERNHILFE F1** (Konzept docs/FERNHILFE_KONZEPT.md): Mitschauen und Vorführen schicken Live-Bild und Zeiger nicht mehr über die Datenbank (bisher ≈ 100–375 Abfragen je Live-Minute), sondern direkt über einen geheimen Supabase-Realtime-Kanal je Sitzung; jede Nachricht AES-GCM-verschlüsselt, Kanal + Schlüssel nur an die beiden Beteiligten (erst mit der Zusage), Ende löscht ihn. Server nur noch alle 15 s für Stand/Dauer/Ende. Große Bilder in Teilen (≤ 180.000 Zeichen, Grenze 256 KB). Ältere App-Stände laufen automatisch über den bisherigen Weg. Messwerte je Sitzung (Nachrichten, KB, größtes Bild, Befehle) im Protokoll. Rückweg: FH_BROADCAST = false im Server.
**KC-CLUB-FERNHILFE F3:** Bedienen aus der Ferne – nur nach „🖱️ Bedienen erlauben“ des Mitglieds (Rückfrage, jederzeit „Bedienen aus“). Helfer tippt/wischt im Live-Bild, Pult: Hoch, Runter, Zurück, Text. Jeder Tipp grün markiert; Senden, Löschen, SOS/Notfall, Express, Abmelden, Zugang, Admin, Anrufe nur nach Rückfrage beim Mitglied; Leiste und Rückfragen nie aus der Ferne; kein Text in Geheimfelder; Bremse 200 ms. Server-Aktion fernbedienung_melden (Protokoll).
**KC-CLUB-FERNHILFE F4:** Ton beim Mitschauen über den vorhandenen App-Anruf (wie beim Vorführen): „🔊 Ton an“ in der Leiste bzw. im Pult, kompakt statt Vollbild, Mikrofon erst nach eigenem Annehmen, Ende der Sitzung = Ton aus.
**KC-CLUB-HILFE-AKTUELL:** Hilfe (11 Texte korrigiert, 6 neu inkl. „Wenn dir jemand aus der Ferne hilft“, neue Themen im ?), Twinkey (Synonyme, 3 Fragen, Video-Verweise), Lupe (13 neue Treffer), Erklär-Videos (Info-Laufband, Diashow-Musik, Haken, Kalender verbinden, Figur bearbeiten, neue Hüte, Unterwasserwelt, Erstattungsarten).
Tests: Vertragstests grün; tools/fernhilfe/fh-leitung-test.ts (gegen echtes Realtime) 11/11; tools/fernhilfe/fern-bedienen-test.mjs (Chromium) 18/18; tools/notpaket/db-puffer-test.ts 13/13; Typprüfung unverändert.

## Server 2.464.0 – 2026-10-18 – KC-CLUB-DB-SPARSAM: jeder App-Aufruf mit Lese-Puffer + Messung der Datenbank-Abfragen je Aktion
Anlass (Hansi: „Anfragen minimieren, damit keine Funktionen gedrosselt oder abgeschaltet werden“; „kommen viele SQL-Aufrufe durch das ewige Einspielen?“): Jede neue Version startet die App neu (Anmeldung + Startdaten); wie viele Abfragen eine Aktion wirklich kostet, war bisher nicht messbar.
- Jeder Aufruf der App bekommt den Lese-Puffer aus 2.453.0: dieselbe Leseabfrage innerhalb von 2 s nur einmal an die Datenbank. Schreiben (auch Communicator, Termin-Baustein, Eltern-Hinweis, direkter Datenbank-Weg) leert ihn; Fehler werden nie gepuffert; andere gleichzeitige Aufrufe sehen ihn nie. Notpaket-Teile behalten den Puffer über den ganzen Aufruf.
- Messung: ab 15 Abfragen schreibt der Server eine Zeile ins Server-Log – Aktion, Abfragen, gespart, Dauer. Keine Inhalte, keine Personen, keine Datenbank-Schreibung (kostet nichts).
- Test: tools/notpaket/db-puffer-test.ts 13/13 grün (neu: Haltbarkeit 2 s), Server-Probestart lokal (Deno 2.1.4) ok, Typprüfung unverändert.
- Rückweg: Server 2.463.0 erneut hochladen.

## Server 2.456.0 – 2026-10-18 – KC-CLUB-NOTPAKET-PUFFER: Nachbesserung nach Messung
Erster Bau mit 2.453.0 (09:18, erzwungen): Paket einwandfrei (17/17, 26,7 s, 5 statt 17 Aufrufe), aber nur 113 von 5.203 Abfragen gespart (2 %). Ursache: drei nur lesende Datenbank-Funktionen (kc_club_rt_kanal, kc_club_ungelesen_je_chat, kc_communication_get_server_secret – geprüft: STABLE bzw. reines SELECT) wurden als Schreiben gewertet und leerten den Puffer mehrmals je Mitglied. Jetzt lassen nur diese drei den Puffer stehen; jede andere Funktion leert ihn weiter vorsichtshalber. Lauf-Test um zwei Fälle erweitert (11/11 grün).

## Server 2.453.0 – 2026-10-18 – KC-CLUB-NOTPAKET-PUFFER: Notfall-Paket mit deutlich weniger Datenbank-Abfragen (wird je Bau gemessen)
Anlass (Prüfbericht KC-Infrastruktur 18.10.2026, Hansi: „Datenbank-Zugriffe minimieren, Notfall-Paket prüfen“): Jeder Bau des Notfall-Pakets stellte ~5.000 Datenbank-Abfragen in einer Minute (87 % der 11 Lastspitzen des Tages, Auslöser der „KRITISCHE Datenbanklast“-Pushs). Messung 07:45: von 4.988 Leseabfragen waren nur 2.308 verschieden – dieselben Mitglieder-, Rechte- und Chat-Abfragen liefen für jedes Mitglied erneut. Am 17.10. 11:30 brach ein Bau deshalb mit „Datenbank antwortet nicht“ ab (altes Paket blieb korrekt stehen) und lief 15 Min. später komplett noch einmal.
- Ein Notpaket-Teil baut jetzt 4 Mitglieder nacheinander (17 → 5 Aufrufe, weiter 4 gleichzeitig). Innerhalb des Teils wird jede gleiche Leseabfrage nur einmal gestellt (Lese-Puffer nur für diesen Aufruf – andere gleichzeitige Anfragen sehen ihn nie; jedes Schreiben leert ihn; Fehler und Zeitüberschreitungen werden nie gepuffert).
- Unverändert: alle Mitglieder, gleiche Antworten wie bisher, Ed25519-Signatur, stündliche Bremse, Nachtrag alle 15 Min., „fehlt ein Teil → altes Paket bleibt“ (jetzt zusätzlich: jedes Mitglied der Gruppe muss im Ergebnis stehen).
- Neu im Protokoll je Bau (nur Zahlen): Grund (daten_geaendert / neuer_tag / nach_fehler / erzwungen), Mitglieder, Aufrufe, DB-Abfragen, gesparte Abfragen, Größe, Dauer – Messgrundlage.
- Test: tools/notpaket/db-puffer-test.ts (Deno 2.1.4 wie Supabase, echter dbFetch-Code, 9 Fälle grün). Typprüfung unverändert gegenüber vorher.
- Rückweg: Server-Stand vor diesem Eintrag (2.452.0) erneut hochladen.

## DB – 2026-10-18 (ohne App-Build) – KC-CORE-BACKUP-NACHHOLEN-DISPATCH: kein roter Restore-Test mehr durch neue Tabellen
Anlass: Restore-Lesetest 18.10. 06:40 rot („type public.kc_club_wunschliste does not exist“). Die neue Tabelle wurde um 06:32 automatisch aufgenommen und vom Nachholen in den schon geprüften Satz des Tages geladen – in Neon gab es sie erst nach dem nächsten Spiegellauf. Gleiches Muster am 11.10., 13.10., 17.10. Keine Daten verloren (Satz 02:50 bestand 266/266).
- Nachholen lädt nur noch Tabellen, die zum Satz gehören; neue bzw. beim Dispatch zurückgestellte kommen in den nächsten Tagessatz (Audit backup_table_deferred). Bestehende Tabellen werden weiter immer nachgeholt.
- Die Morgenprüfung prüft einen Satz erneut, wenn sein letzter Restore-Test nicht bestanden ist (vorher blieb er bis zum nächsten Tag rot).
- Probelauf in Supabase (zurückgerollt) 8/8 grün, eingespielt 18.10. ~08:03. Rückweg: docs/BACKUP_NACHHOLEN_2026-10-18.md.

## DB – 2026-10-14 (ohne App-Build) – KC-CLUB-DB-AUFRAEUMEN-KUERZER: Messwerte 30 Tage, System-Check-Verlauf nach 14 Tagen ausgedünnt
Anlass (Hansi): „Der Communicator hat doch auch ein Journal – das müsste ziemlich voll sein.“ Messung: Datenbank 141 von 500 MB; das Versand-Journal selbst ist klein (Aufträge 2,8 MB, Zustellmeldungen 1 MB, eigene 180-Tage-Regel). Groß sind die Communicator-Messwerte (17 MB, ≈ 240/Tag) und der System-Check-Verlauf (40 MB, ≈ 9,5 kB je Prüfung) – beide wurden erst nach 90 Tagen gelöscht (System-Check wäre auf ≈ 85 MB gewachsen). Jetzt im nächtlichen Aufräumen (3:50 Uhr): Messwerte nach 30 Tagen weg; System-Check-Einträge nach 14 Tagen ausgedünnt (je Prüfpunkt bleiben Name, Status, Gesundheit – Verlauf bleibt sichtbar), gelöscht weiter nach 90 Tagen. Probelauf: 2.780 Einträge 20 MB → 3,6 MB, 5.859 Messwerte. Probe tools/db-test/73_db_aufraeumen_kuerzer_test.sql. Rückweg: 20261006_kc_club_v2247_db_aufraeumen.sql.

## DB – 2026-10-14 (ohne App-Build) – KC-CLUB-ANMELDUNG-SPARSAM: Anmeldung schreibt „zuletzt gesehen“ höchstens alle 30 s
Anlass (Hansi): „Check nochmals … alle Sachen, die zu viele Datenbank-Abfragen machen und die DB überlasten.“ Messung: kc_club_anmeldung war der größte Einzelposten (rund ein Drittel der DB-Zeit, zuletzt 600 ms je Aufruf statt 36 ms – gleichzeitige Anfragen derselben Person warteten auf die Zeilensperre). Jetzt nur lesen; geschrieben wird beim ersten Mal, nach > 30 s oder bei neuer App-Version. Online-Anzeige (150 s) und Online-Push (vorher-Stand) unverändert. Probelauf tools/db-test/72_anmeldung_sparsam_test.sql. Rückweg: 20261002_kc_club_v1510_erstmals.sql.

## Server 2.388.0 – 2026-10-14 – KC-CLUB-EXPRESS-ADMIN-FREI: Admin ohne Express-Tagesgrenze
Anlass (Hansi): „Wer hat die Grenze von 5 Express festgelegt?“ – Die Grenze (5 je Person und Tag) war beim Bau von 2.362.0 als Schutz vor Missbrauch eingesetzt worden, nicht von Hansi vorgegeben. Der Admin hat jetzt keine Grenze mehr; für Mitglieder gilt sie weiter, bis Hansi anders entscheidet.

## Server 2.384.0 – 2026-10-14 – KC-CLUB-EXPRESS-SOFORT: Express mit höchster Zustell-Dringlichkeit
Anlass (Hansi): „Express heißt so schnell wie möglich.“ – Express ging bisher als Priorität „high“; der Versand setzt die Push-Dringlichkeit „high“ aber nur bei „critical“. Mit „normal“ darf Android den Push im Stromsparmodus zurückhalten. Jetzt geht Express wie der Notfall als „critical“ (Push-Dringlichkeit hoch); Text, Titel, Mail und ❗ wichtig bleiben unverändert. Weiter: durch Ruhezeit und Stummschaltung, Push + Mail.

## Server 2.382.0 – 2026-10-14 – KC-CLUB-NOTPAKET-STUENDLICH: weniger Datenbank-Last
Anlass (Hansi): „Checke alle Programme durch und reduziere die DB-Anfragen auf das Nötigste und Sinnvollste.“ – Das Notfall-Paket (alle Mitglieder
für den Ersatz-Server) kostet je Bau ~3.000 Datenbankabfragen und wurde tagsüber alle 15 Min. neu gebaut, weil sich fast immer etwas ändert.
Jetzt höchstens 1× pro Stunde (Nachtrag aus dem Notbetrieb weiter alle 15 Min., „erzwingen“ baut sofort). Im Ausfall ist der Stand damit höchstens ~1 Std. alt.

## 2.474.0 – 2026-10-18 – KC-CLUB-AVATAR-UEBERLAPPUNG: Figuren-Bereiche in „Mein Bild“ liegen nicht mehr übereinander (sofort eingespielt)
Fund Hansi (Bildschirmfoto „Überlappungen“): Das Fenster ist ein Raster; Klappbereiche mit overflow hidden/clip durften darin auf ihre Mindesthöhe 0 schrumpfen – alle Bereiche lagen übereinander (die Korrektur aus 2.457.0 mit min-height half nicht). Jetzt ohne overflow, die runden Ecken trägt die Kopfzeile. Klappbereiche klarer benannt: „🙂 Einfache Figuren“ und „👑 Hochwertige Figuren“. Sofort eingespielt (Fehler behindert Mitglieder, AGENTS KC-DB-SPARSAM); das 20-Uhr-Bündel enthält dieselbe Änderung. Nur App.

## 2.467.0 – 2026-10-18 – KC-CLUB-STUNDENUHREN: Big Ben, Kölner Dom und 8 weitere Uhren zur vollen Stunde (Wunschliste #23) + Auswahl nur nach Häkchen
Wunsch Hansi: Neben der Kuckucksuhr Big Ben (Westminster-Schlag), Kölner Dom (Petersglocke), Münchner Glockenspiel, Prager Rathausuhr, Hamburger Michel (Turmbläser „Lobe den Herren“), Schiffsglocke (Glasen), Standuhr (Whittington), Ave-Maria-Glockenspiel (Lourdes-Lied), Westerkerk Amsterdam. Alles im Handy erzeugt (Originalaufnahmen sind geschützt); Melodien nach freien Quellen, München/Amsterdam eigene Melodie im Stil. Auswahl mit ▶ Probe, mehrere = jede Stunde eine andere. Gleicher Ablauf wie der Kuckuck (Ton-Freigabe, Nachtruhe, Mitzählen). Nur App. Neu (Wunsch Hansi): jede Uhr ein eigener Klappbereich; die Auswahl „Welche Uhr?“ öffnet sich erst, wenn „Uhr zur vollen Stunde“ angehakt ist (KC-CLUB-EINST-ABHAENGIG, allgemein über data-abh nutzbar).

## 2.466.0 – 2026-10-18 – Laufband: Schulung und Aufgaben öffnen die richtige Seite (KC-CLUB-LAUFBAND-ZIELE)
Wunschliste #24: Antippen von „Schulung: bitte einen Termin wählen“ und von Aufgaben im Info-Laufband öffnete eine leere Seite (Sprungziel gab es nicht). Jetzt: Schulung → Schulungsauswahl, Aufgabe → Protokolle/Aufgaben. Neuer Test prüft alle Sprungziele.
## 2.463.0 – 2026-10-18 – KC-CLUB-THEMEN-LAUFBAND: Info-Feld fordert zum Abstimmen über die Sitzungs-Themen auf (Wunschliste #22)
Wunsch Hansi: In den 3 Wochen vor einer Sitzung steht im Info-Laufband „x Themen für die Sitzung am …“ mit „👍 Abstimmen“ und „＋ Thema“ (Formular mit vorgewählter Sitzung). Gelb, solange man noch nicht alle Themen unterstützt hat. App + Server.

## 2.462.0 – 2026-10-18 – KC-CLUB-STIMMEN-TABELLE: Stimmen bei Vorschlägen und Abstimmungen werden wieder gespeichert
Fund 18.10.: Seit 2.351.0 las und schrieb der Server Stimmen (👍 bei Themen/Spenden, Abstimmungen, „wartet auf deine Stimme“) in der Tabelle der Twinkey-Stimmen statt in kc_club_stimmen – 8 Stellen, versehentlich beim Einbau der Video-Stimmen umbenannt. Stimmen gingen still verloren (Logs: 21 Lese- und 1 Schreibfehler in 24 Std.). Jetzt richtige Tabelle, Schreibfehler werden gemeldet. Server 2.462.0.

## 2.461.0 – 2026-10-18 – KC-CLUB-TERMIN-LINK-PROSPEKT: Clubtermin mit Webseite, Prospekt und Laufband (Wunschliste #20)
Wunsch Hansi (Adventsmarkt der Freilichtbühne): Clubtermine bekommen 🌐 Link zur Webseite (nur https), 📎 Prospekt (Foto/PDF) und „📣 Im Info-Laufband ankündigen“ (Startseite, ab 3 Wochen vorher, mit Knopf 🌐 Webseite). DB: kc_club_treffen.link/im_laufband, Objekt-Anlagen art 'treffen'. App + Server + DB.

## 2.460.0 – 2026-10-18 – KC-CLUB-AVATAR-BEARBEITEN-MITGLIED: ✏️ auch auf der eigenen Mitglieder-Seite
Fund Hansi (Foto): Auf der eigenen Mitglieder-Seite das Bild angetippt – in der Großansicht fehlte „✏️ Bearbeiten“. Jetzt dort beim eigenen Bild (Figur) vorhanden, bei anderen Mitgliedern nie. Nur App.

## 2.459.0 – 2026-10-18 – KC-CLUB-SCHRIFT-ZOOM-AUS: Schrift mit zwei Fingern abschaltbar (Wunschliste #16)
Fund Hansi: Nach dem Vergrößern in Nachrichten erschien beim Scrollen ständig die Prozentanzeige – ein aufliegender Daumen plus scrollender Finger zählte als Auseinanderziehen. Jetzt nur noch, wenn sich beide Finger deutlich bewegen; neuer Schalter ⚙️ → Darstellung → „✌️ Schrift mit zwei Fingern ändern“; die Anzeige nennt ihn. Nur App.

## 2.458.0 – 2026-10-18 – KC-CLUB-VORSCHLAEGE-ANZAHL: Kachel zeigt alle laufenden Vorschläge (Wunschliste #15)
Wahl Hansi „Alle Vorschläge“: Die Zahl auf der Kachel 🗳️ Vorschläge zeigt jetzt alle laufenden Vorschläge (gleiche Sichtbarkeit wie die Liste). Wie viele Abstimmungen auf die eigene Stimme warten, steht darunter und weiter unter „Heute wichtig“. App + Server.

## 2.457.0 – 2026-10-18 – KC-CLUB-AVATAR-UEBERSICHT + KC-CLUB-AVATAR-BEARBEITEN: Figuren wieder sichtbar, ✏️ am eigenen Bild
Fund Hansi: In „Mein Bild“ waren die Klappbereiche „Bisherige“ und „Hochwertige Avatare“ auf dem Handy nur noch Striche (im Fenster auf Höhe 0 gedrückt) – behoben (overflow:clip, min-height). Neu: „✏️ Bearbeiten“ unter dem jetzigen Bild und in der Großansicht des eigenen Bilds öffnet den Baukasten mit der eigenen Figur. Nur App.

## 2.455.0 – 2026-10-18 – KC-CLUB-TASTATUR-KNOPF: Tastatur im Chat aus- und einblenden (Wunschliste #14)
Unten im Chat neben dem Pfeil ▾ die Taste ⌨️: rot = Tastatur offen, antippen blendet sie aus (mehr Platz), nochmal antippen holt sie zurück; der Text bleibt. Nur auf Handy/Tablet. Nur App.

## 2.454.0 – 2026-10-18 – KC-CLUB-WER-IST-DA: Ansage beim Reinkommen (Wunschliste #13)
Beim Öffnen der App (oder nach 10 Min. Pause) einmal Meldung + Ansage: „Im Moment sind Hansi, Klaus und Anne online und 2 weitere Mitglieder.“ Gleiche Online-Liste wie überall (Verborgene/Inkognito nicht genannt), nie in der Ruhezeit, abschaltbar unter Ansagen („👋 Beim Öffnen“). Nur App.

## 2.453.0 – 2026-10-18 – KC-CLUB-DIA-MUSIK: Diashow mit Club-Song (Wunschliste #12)
In der Diashow schaltet 🎵 unseren Club-Song dazu (gemerkt, startet nur nach Antippen, ⏸ hält Bilder und Musik an, beim Verlassen aus). Die Leiste liegt jetzt über den Hilfe-Knöpfen. Nur App.

## 2.452.0 – 2026-10-18 – KC-CLUB-AVATAR-SCHUERZE: Schürze an der Koch-Figur (Wunschliste #19)
Die Koch-Figur kann eine Schürze tragen: 10 Farben, Muster (Nadelstreifen, Längsstreifen, Karo, Punkte, Jeans), Träger um den Hals, Initialen rechts. Alte Bild-Codes bleiben gültig. App + Server (Prüfung der längeren Bild-Codes).

## 2.451.0 – 2026-10-18 – Mütze und Rahmen aufs eigene Foto (KC-CLUB-FOTO-MUETZE, Wunschliste #11)
Beim eigenen Foto (Selfie, Galerie, Datei) kann man vor dem Übernehmen eine Mütze aufsetzen – Nikolausmütze, Kochmütze, Chefmütze, Jägerhut, Cowboyhut, Zylinder, Strohhut, Bommelmütze, Beanie, Krone, Partyhütchen, Wikingerhelm – mit dem Finger verschieben, Größe und Drehung einstellen, dazu ein Rahmen (Weinrot, Gold, Weihnacht, Bunt). Es sind dieselben Zeichnungen wie bei der Koch-Figur (gemeinsamer Baustein avMuetzeSvg). Mütze und Rahmen werden fest ins kleine Foto gezeichnet; klappt das auf einem Gerät nicht, wird das Foto ohne gespeichert (Hinweis). Nur App.

## 2.450.0 – 2026-10-18 – Neue Kopfbedeckungen + alle Avatare wieder sichtbar (KC-CLUB-AVATAR-HUETE, Wunschliste #11)
Neun neue Kopfbedeckungen im Baukasten (Selbst zusammenstellen → 🧢 Kopfbedeckung): Nikolausmütze, Jägerhut mit Feder, Cowboyhut, Zylinder, Strohhut, Wikingerhelm, Krone, Partyhütchen und Bommelmütze – je mit Farbe und Muster wählbar. Hinten angehängt, alle bisherigen Figuren bleiben unverändert. Fund Hansi „ich sehe nicht mehr die komplette Übersicht“: Bei Foto oder eigener Figur war „Bisherige Avatare“ zugeklappt – jetzt sind die einfachen und die hochwertigen Avatare immer offen. Nur App.

## 2.449.0 – 2026-10-18 – Früheres Bild zurückholen (KC-CLUB-BILD-VERLAUF, Wunschliste #21)
Fund Hansi: Avatar-Bild durch ein Selfie ersetzt – das alte war weg (der Server löschte das alte Foto beim Wechsel). Jetzt merkt die App bei jedem Wechsel automatisch das bisherige Bild – Foto, Selfie oder Koch-Figur –, höchstens die letzten 3. Unter Mein Bild steht „🕘 Zuletzt benutzt“: antippen, oben ✅ Übernehmen, das alte Bild ist wieder da (auch ein früheres Foto). Die tägliche Jacken-Automatik zählt nicht als Wechsel. Der Verlauf gehört nur der Person selbst und ist nicht im Start-Paket. Server + App.

## 2.448.0 – 2026-10-18 – Anlage bei Vorschlag, Spende, Terminfindung, Terminanfrage (KC-CLUB-OBJEKT-ANLAGEN, Wunschliste #10)
Neues Feld „📎 Anlage“ in Vorschlag/Spendenprojekt, Terminfindung und Terminanfrage: 🖼️ Foto, 📷 Kamera oder 📄 PDF/Datei aus dem Dateimanager (z. B. Skizze, Flyer des Spendenempfängers), höchstens 5, sofort hochgeladen wie im Chat (Bilder verkleinert, gleiche Speicher-/Tagesgrenzen). Am Eintrag: Bilder als kleine Vorschau, Dateien als Knopf (Öffnen/Teilen/Speichern). Sehen darf sie nur, wer den Eintrag sieht (Abstimmungs-Zielgruppe, Empfänger der Terminanfrage). DB: neue Tabelle kc_club_objekt_anlagen (nur Server, RLS; Probelauf 80 grün, eingespielt). Server + App.

## 2.447.0 – 2026-10-18 – Gelesen/zugestellt wie WhatsApp (KC-CLUB-GRUPPEN-QUITTUNG, Wunschliste #8)
Antippen der Haken an eigener Nachricht (oder ℹ️ Details) zeigt eine einfache Übersicht wie WhatsApp: blaue ✓✓ „Gelesen von“ mit Name und Uhrzeit, graue ✓✓ „Zugestellt an“ mit Uhrzeit, ✓ „Noch nicht zugestellt“. Express und ❗ wichtig stehen oben. Die bisherige Ampel samt Push/E-Mail-Verlauf bleibt unter „Mehr Einzelheiten“. DB: neue Tabelle kc_club_chat_quittung (+ Funktion kc_club_chat_quittung_merken, nur Server, RLS) hält fest, wann neue Nachrichten in der App ankamen und wann der Chat geöffnet wurde – nur erste echte Uhrzeit, ältere Nachrichten „Uhrzeit unbekannt“; Inkognito wird nicht verraten; nach 400 Tagen gelöscht. Server + App.

## 2.446.0 – 2026-10-18 – Thema Kegelabend (KC-CLUB-KEGELN, Wunschliste #4)
Neues Kopf-Thema 🎳 Kegelabend (Farben Schokolade): unten eine Holzbahn mit 9 Kegeln (König mit roter Krone). Ein Koch mit Kochmütze nimmt Anlauf und rollt die Kugel – Kegel fliegen um, „5 Holz!“, dann stellen sie sich wieder auf. Oben rechts die Kreidetafel mit dem Vornamen: Strichliste und Summe. Der 6. Wurf ist immer „Alle Neune!“ mit Konfetti, der Koch jubelt; danach wischt ein Schwamm die Tafel sauber und der nächste Durchgang beginnt nahtlos. Vorschau, Hilfe, Lupe ergänzt. Nur App.

## 2.445.0 – 2026-10-18 – Thema Bauernhof (KC-CLUB-BAUERNHOF, Wunschliste #3)
Neues Kopf-Thema 🐄 Bauernhof (Farben Küchengrün, rustikale Schrift): ein ganzer Tag auf dem Hof. Morgens geht die Sonne auf, der Hahn kräht auf dem Zaunpfosten („Kikeriki!“); Kuh, Schwein und Hühner kommen auf die Wiese, das Schwein suhlt sich in der Pfütze, Vögel und Wolken ziehen. Der Traktor bringt Stroh und lädt einen Ballen ab, dann steht ein Holzschild „Hof <Vorname>“. Abends Abendrot, alle Tiere gehen in den roten Stall, das Tor schließt, im Fenster brennt Licht; nachts Mond und Sterne, der Hahn schläft (zzz). Der nächste Lauf beginnt in der Nacht und wird Morgen – kein Bruch. Vorschau, Hilfe, Lupe ergänzt. Nur App.

## 2.444.0 – 2026-10-18 – Thema Weltraum (KC-CLUB-WELTRAUM, Wunschliste #2)
Neues Kopf-Thema 🚀 Weltraum (Farben Tiefsee): der Kopf wird zum Nachthimmel – Sterne funkeln, ein Ringplanet schwebt herein, oben der Mond, ab und zu eine Sternschnuppe. Ein Astronaut schwebt herein und winkt, eine Rakete startet mit Feuerschweif, dann schreibt der Astronaut den Vornamen in Sternenschrift unten in den Kopf. Zum Schluss holt ihn ein UFO mit dem Lichtstrahl ab; nach gut 1½ Minuten beginnt alles von vorn. Vorschau unter ⚙️ → ✨ Effekte, Hilfe und Lupe ergänzt. Nur App.

## 2.443.0 – 2026-10-18 – Ausweis-QR (KC-CLUB-AUSWEIS-QR, Wunschliste #9)
Mitgliedsausweis als QR in der App: Knopf „QR“ neben Schnellzugriff (statt der zweiten Versionsnummer; bei Update zeigt er weiter 🆕) und Kachel Meins → 🪪 Mein Ausweis-QR. Inhalt = nur die Mitgliedsnummer (KC-0005) – so liest die Kasse jeden Ausweis (Bedieneranmeldung + Stechuhr). Nur die eigene Nummer (Server: mein_ausweis, auch Aushilfen); ohne Nummer erscheint ein Hinweis statt eines QR. Der QR wird je Person auf dem Gerät gemerkt und geht auch ohne Netz (markiert). Versionsnummer unter der Kochmütze bleibt (antippen = Update prüfen). Hilfe, Twinkey und Lupe ergänzt.

## 2.442.0 – 2026-10-18 – Push zur Zeitumstellung
Am Samstag vor der Zeitumstellung (März und Oktober) kommt ab 18 Uhr ein Push: Uhr vor- bzw. zurückstellen. Jedes Jahr automatisch.

## 2.441.0 – 2026-10-18 – 📣 Info-Laufband: das Treffen ist der erste Punkt, Karte viel niedriger (KC-CLUB-LAUFBAND-TREFFEN)
Fund Hansi: „Noch nicht optimal. Was da über dem neuen Feld steht, sollte in das Feld rein als ein Punkt. Jetzt ist alles viel zu hoch.“
- Die Kopfzeile (Treffen, Datum, Ort, Zu-/Absage, x/y angemeldet) ist weg – sie ist jetzt der **erste Punkt im Laufband**. Die Karte ist dadurch deutlich niedriger.
- Noch keine Antwort: roter Rahmen, Datum · Ort, Knöpfe **✔ Zusagen / ✖** und „✅ 5/18“; der Zusagen-Knopf blinkt wie bisher ab 5 Tagen gelb, ab 2 Tagen rot. Die Meldung kommt zwischendurch wieder.
- Schon geantwortet: weißer Rahmen, „✅ Ich komme · ✅ 5/18“. Kein Termin: „Kein Termin geplant“. Antippen führt wie bisher zu den Terminen; nicht ausblendbar.
- **Nichts doppelt mit den 3 Feldern darunter** (Nachfrage Hansi): „Jetzt zu- oder absagen“ und „Noch x Tage bis …“ entfallen (stehen im Treffen-Punkt bzw. im Feld „Clubtreffen“), ebenso „x Mitglieder online“ (Feld „Mitglieder“). Geburtstag am Tag selbst steht nur noch im Laufband (mit 💬 Gratulieren); das Feld „Clubtreffen“ zeigt Mitglieder-Geburtstage nur noch vorab (1–14 Tage).
- Das Laufband frischt sich auch ohne Wechsel auf (z. B. nach der Zusage) und zeichnet nur neu, wenn sich etwas geändert hat. Nur App.
## 2.440.0 – 2026-10-18 – Admin: Wünsche an Claude
Neue Admin-Liste „📝 Wünsche an Claude“: Vorschläge, Fehler und Ideen eintragen (auch per 🎤), Reihenfolge und ⭐ wichtig festlegen; Claude arbeitet sie der Reihe nach ab und schreibt Ergebnis, Version oder Rückfrage hinein.

## 2.439.0 – 2026-10-16 – 📣 Info-Laufband auf der Startseite (KC-CLUB-INFO-LAUFBAND)
Wunsch Hansi: „Über den 3 Feldern Nachricht, online, Termine ein großes Info-Feld – komplett gerahmt, so breit wie die 3 zusammen; dort abwechselnd Infos, z. B. 3 Dokumente im Eingangskorb oder ‚jetzt noch für die nächste Sitzung anmelden‘.“
- In der ersten Info-Karte zwischen Überschrift und den 3 Feldern: **genau so breit wie die 3 Felder zusammen**, gleiche Rundung, feste Höhe (die Karte springt beim Wechsel nicht).
- **Rahmenfarbe nach Wichtigkeit**: rot = bitte erledigen (Eingangskorb, Zu-/Absage zum nächsten Treffen, Terminanfragen, Abstimmungen, Terminfindung, Schulung, fällige Aufgaben, Benachrichtigungen aus), orange = Clubleitung (Büro-Eingang), gold = Hinweise (App installieren, Dienst heute/morgen, neues Protokoll, Countdown, Regen am Treffen-Tag), weiß = schöne Infos (Geburtstag, wer online ist, neue Fotos, neues Dokument, Wetter).
- Wechselt alle 6 s sanft, **Wischen** blättert, **Berühren** hält an; Punkte zeigen, wie viele Meldungen da sind. Wichtiges (rot) kommt öfter dran.
- **Antippen** öffnet das Ziel; direkte Knöpfe: ✔ Zusagen / ✖, ✔ erledigt, 💬 Gratulieren, Einschalten. **✕** blendet eine Meldung für heute aus.
- Steht nichts an: „Alles erledigt 👍“ und der **Tipp des Tages**. „Heute wichtig“ darunter bleibt die vollständige Liste.
- Keine zusätzliche Server-Abfrage (nutzt die schon geladenen Startdaten); steht in der Ruhephase still. Nur App, kein Server- oder DB-Update.
## 2.438.0 – 2026-10-16 – Power-Kette mit Hampelmann
Neue 8. Bewegung in der Power-Kette: Hampelmann (zweimal je 2 s) vor dem Sprung – mit kleinem Hopser, Beine auf, Arme über den Kopf.

## 2.437.0 – 2026-10-16 – 🪦 Halloween: Grabstein deutlich mit lesbarer Inschrift (KC-CLUB-GRABSTEIN-DEUTLICH)
Fund Hansi: „Der Grabstein ist nicht gut zu erkennen, der muss deutlicher – die Inschrift sieht man nicht.“
- Größer (gut ein Drittel), heller Stein mit Verlauf und **dunklem Rand**, **Mondlicht-Kante** links und leisem Schein dahinter – hebt sich vom dunklen Halloween-Hintergrund ab.
- **Eingemeißeltes Kreuz** und große, helle **„R.I.P.“**-Inschrift (Serifenschrift) mit dunkler Schattenkante – gut lesbar; dazu Gras am Fuß. Das Skelett kommt jetzt rechts daneben aus der Erde.
- Nur App, kein Server- oder DB-Update.

## 2.436.0 – 2026-10-16 – 🎃 Halloween unten: Grab mit Skelett, Katze, Hexenkessel, Süßes oder Saures · Hexe fliegt tiefer (KC-CLUB-HALLOWEEN-UNTEN) · 🐦 Kuckuck: Lautsprecher wecken, Rufe mitzählen
Fund Hansi: „Die Hexe hat keine gute Flugbahn, die fliegt genau hinter dem Stück mit den LEDs – besser ein Stück tiefer. Und unten muss noch mehr passieren.“ Gewählt: Grab mit Skelett, schwarze Katze, Hexenkessel, Süßes oder Saures.
- **Flughöhe:** Hexe und kleine Geister fliegen jetzt **unterhalb der Lämpchen-Leiste** – deren Lage wird gemessen (sie hängt davon ab, wie viel im Kopf steht); reicht der Platz nicht, so tief wie möglich über dem Boden.
- **🪦 Grab mit Skelett:** Grabstein „R.I.P.“ mit Erdhügel; eine Knochenhand greift heraus und winkt, das Skelett klettert heraus, tanzt („Klapper!“) und zerfällt zu einem Knochenhaufen, der versinkt.
- **🐈‍⬛ Schwarze Katze** mit leuchtendem Auge schleicht zweimal über den Boden; auf dem ersten Weg kracht mitten im Bild ein Blitz – sie macht einen Buckel, sträubt den Schwanz: „Fauch!“
- **🧪 Hexenkessel** über flackerndem Feuer, grünes Gebräu blubbert, grüner Dampf steigt auf. Zum Schluss fliegt die Hexe erst zum Kessel und **rührt** darin (es blubbert wild), dann steigt sie auf und zaubert.
- **🐦 Kuckucksuhr** (Fund Hansi „hat 18 angezeigt, aber nach 4 Rufen war der Kuckuck weg“): Die Diagnose zeigt 6 Rufe gezählt und 6 gespielt, Ton lief – viele Android-Handys schalten den Lautsprecher nach einer Pause ab und verschlucken beim Wiedereinschalten die ersten ~1–1,5 s. Jetzt läuft vor dem ersten Ruf 1,2 s ein unhörbar leiser Ton, der den Lautsprecher weckt; erst dann ruft der Kuckuck. Unter der Uhr zählen Punkte jeden Ruf sichtbar mit (●●●○○○).
- **🍬 Süßes oder Saures:** drei verkleidete Kinder (Gespenst, Kürbis, kleine Hexe) mit Laterne und Kürbis-Eimer ziehen vorbei: „Süßes oder Saures, <Vorname>!“
- Nur App, kein Server- oder DB-Update.

## 2.435.0 – 2026-10-16 – 🎃 Halloween: Hexe, Geister, Gewitter, Vampir im Sarg (KC-CLUB-HALLOWEEN-GEWITTER)
Wunsch Hansi: „Bei Halloween noch die Hexe auf ihrem Besen durchfliegen lassen, mehr Geister und Blitz und Donner wie Gewitter. Auf seinem Sarg kommt ein Vampir mit Umhang – der setzt sich erst hin, dann steht er auf und geht weg. Und die Hexe fuchtelt mit ihrem Zauberstab und die Szene ist vorbei.“
- **Gewitter:** dunkle Wolken ziehen über den Mond; etwa alle 7–15 s ein **Blitz** (heller Lichtschein, zweimal aufflackernd, Zickzack mit Ast), kurz danach **Donner** – das Bild wackelt einen Moment.
- **Mehr Geister:** bis zu drei kleine Geister schweben gleichzeitig vorbei (dazu wie bisher das große „Buuuh, <Vorname>!“-Gespenst hinter dem Kürbis).
- **🧙 Hexe auf dem Besen** (grünes Gesicht, langer Nase, spitzem Hut, orangen Haaren, wehendem Umhang) fliegt zweimal durch – in der Mitte „Hihihi!“.
- **🧛 Vampir im Sarg:** unten steht ein Sarg; nach gut 20 s geht der Deckel (mit goldenem Kreuz) auf, der Vampir richtet sich auf, sitzt und grüßt „Guten Abend, <Vorname>!“, steigt heraus und geht mit wehendem, innen rotem Umhang davon; der Deckel schließt sich wieder.
- **Schluss:** die Hexe schwebt in die Mitte, **fuchtelt mit dem Zauberstab** (bunte Funken), ein lila **Zauberblitz** – sie fliegt davon und die Szene ist vorbei (danach beginnt sie von vorn).
- Nur App, kein Server- oder DB-Update.

## 2.434.0 – 2026-10-16 – 🐠 Neues Thema Unterwasserwelt (KC-CLUB-UNTERWASSER) · 🎃 Herbst-Kürbis mit Kerze (KC-CLUB-HERBST-KUERBIS)
Wunsch Hansi: „Als neues Thema eine Unterwasserwelt – bunte Fische, Luftblasen, Taucher, Helmtaucher mit dickem Helm und Luftschlauch, grüne Pflanzen, Muscheln, ein Seepferdchen schreibt den Namen. Zieht der Taucher den Stöpsel, läuft das ganze Wasser ab und alles ist verschwunden; dann kommt Regen und baut die Szene von vorne auf.“
- **Thema 🐠 Unterwasserwelt** (⚙️ → 🎨 Darstellung → 🎭 Themen; Farben „Nordsee“, Effekt Taube, Schrift „Strand“, Wimpel in Meeresfarben) mit eigener Szene im Kopf der Startseite, Vorschau unter ⚙️ → ✨ Effekte.
- **Ablauf je Lauf (≈ 1 Min. 50 s):** Regenwolken und Regen füllen das Becken (Tropfen machen Ringe) → Sand, grüne Pflanzen wachsen und wiegen sich, Muscheln und ein Seestern erscheinen, Lichtstrahlen im Wasser → bunte Fische (Clownfisch, Doktorfisch u. a., ab und zu ein kleiner Schwarm), Luftblasen steigen und platzen an der Oberfläche → ein **Helmtaucher** mit Kupferhelm, Fenstern, Bleigürtel und schweren Stiefeln stapft herein, sein **Luftschlauch** führt nach oben, aus dem Ventil blubbert es → ein **Seepferdchen** schwimmt und **schreibt den Vornamen** in Blasenschrift → ein **Taucher** mit Flossen und gelber Flasche schwimmt vorbei → später taucht er zum **Stöpsel**, zerrt an der Kette – **„Plopp!“** → **Strudel**, das Wasser läuft ab und zieht alles spiralförmig in den Abfluss → leer → es regnet wieder und alles baut sich von vorne auf.
- Nur Bild auf dem eigenen Gerät, nichts wird gespeichert oder gesendet; Bildrate und Akku-Sparen wie bei den anderen Szenen.

**🎃 Herbst-Kürbis mit Kerze** (Wunsch Hansi: „Im Herbst noch einen Halloween-Kürbis; wenn das Abend-Schema da ist, soll ein Licht wie eine flackernde Kerze aus dem Kürbis leuchten. Der Hund soll den Kürbis kurz vor dem Wechsel von Tag auf Nacht hereinrollen.“)
- Etwa **20 Min. vor Sonnenuntergang** (Tag/Nacht „automatisch“ nach Sonnenstand in Werne) kommt der Hund von rechts und **schiebt mit der Nase einen geschnitzten Kürbis** herein – der Kürbis rollt und kommt aufrecht an –, schnuppert daran und trottet zurück.
- Sobald das **Nacht-Schema** da ist, **flackert eine Kerze** im Kürbis: Augen und Mund leuchten unruhig gelb-orange, dazu ein warmer Schein und ein Lichtfleck auf dem Boden. Am Morgen (Tag-Schema) ist der Kürbis wieder weg.
- Wer die App erst abends öffnet (oder Nacht fest eingestellt hat), findet ihn schon brennend da. Mit Helligkeitssensor ist der Wechsel nicht vorhersehbar – dann steht er mit dem Nacht-Schema einfach da.
- Vorschau: ⚙️ → ✨ Effekte → Extras → **🎃 Kürbis-Hund** (nach 3 s rollt er herein, 3 s später brennt die Kerze).
- Nur App, kein Server- oder DB-Update.

## 2.433.0 – 2026-10-16 – 📥 Eingangskorb: beim Annehmen Ordner und Register wählen (KC-CLUB-EINGANG-WOHIN) · ▾ Schreibbereich einklappen (KC-CLUB-SCHREIBEN-KLAPPEN) · Server 2.433.0
Wunsch Hansi: „Frag dann noch Steven, in welchen Ordner und in welches Register – mach aber schon einen Vorschlag dazu.“
- Tippt das Mitglied bei einem Dokument im eigenen Ordner auf **✔ Annehmen**, fragt die App jetzt **„Wohin?“**: Ordner (eigene Jahrgänge) und Register. Vorausgewählt ist der **💡 Vorschlag** des Absenders (Ordner des laufenden Jahres, gewähltes Register) – ein Tipp auf „✔ Hierhin übernehmen“ genügt, oder es ändert die Auswahl.
- Beim Hineinlegen heißt das Feld jetzt „Register (Vorschlag – … kann es beim Annehmen ändern)“.
- **▾ Schreibbereich einklappen** (Wunsch Hansi: „im Nachrichten-Fenster einen Einklapppfeil nach unten, um den Bereich kurz wegzuklappen und mehr Nachrichten zu sehen – beim Öffnen aber immer den Schreibbereich offen“): kleiner ▾-Griff oben mittig über dem Schreibfeld; eingeklappt bleibt nur eine schmale Leiste „▴ ✏️ Schreiben“ (Antippen öffnet und setzt die Schreibmarke ins Feld). Der Platz geht an die Nachrichten (auf dem Handy rund 100 Pixel mehr). Beim Öffnen eines Chats ist der Schreibbereich immer offen.
- **Server:** archiv_pruefung nimmt beim Annehmen ordner_id/register an – nur eigene, nicht gelöschte Ordner; unbekanntes Register → Vorschlag bzw. erstes Register. Keine DB-Änderung.

## 2.432.0 – 2026-10-16 – 🐕 Herbst-Hund naturgetreuer (KC-CLUB-HUND-KOPF) · 📥 Eingangskorb für Mitglieder (KC-CLUB-EINGANGSKORB) · Server 2.432.0
Wunsch Hansi: „Den Hund im Herbst noch etwas naturgetreuer – der Kopf ist zu hoch und evtl. zu lang.“
- Kopf sitzt jetzt etwa auf Rückenhöhe (vorher deutlich darüber), kräftiger Hals schräg nach vorn, der Rücken geht glatt in den Hals über.
- Kleinerer Schädel mit schmaler werdender Schnauze und Maul statt runder Kugel mit Wurstschnauze – der Kopf ist kürzer (etwa 40 % der Körperlänge statt gut 55 %).
- Beim Schnuppern senkt er die Nase tiefer ins Laub; das Schnupper-Wölkchen sitzt an der neuen Nase.

**📥 Eingangskorb für Mitglieder** (Wunsch Hansi: „Steven ein Dokument in seinen Archiv-Ordner legen“ → „Eingangskorb für Mitglieder“). Persönliche Ordner sind privat; bisher ging das nur, wenn das Mitglied eine Freigabe „Hochladen“ erteilt hatte.
- **Mitgliedsfenster → „📥 In den Eingangskorb“** (Admin und Clubleitung): Datei (PDF, Bild, Word, Excel, Text, bis 8 MB), Titel, Register (Standard „Sonstiges“), kurze Nachricht. Das Dokument kommt in den persönlichen Ordner des laufenden Jahres (fehlt er, wird er angelegt) – **nur zur Prüfung**.
- **Das Mitglied** bekommt „📥 Neu in deinem Eingangskorb“ (Push/Mail wie gewohnt) und sieht unter **„Heute wichtig“ → 📥 Eingangskorb** die Anzahl; Antippen öffnet den Ordner mit den wartenden Dokumenten: ✔ annehmen (liegt dann im Ordner) oder ✖ ablehnen (wird gelöscht). Die Leitung sieht den Ordner auch danach nicht.
- Nicht für Gäste/Aushilfen (kein Archiv), voller Ordner (50 MB) wird abgelehnt.
- **Server:** neue Aktion archiv_eingang_senden (nur Leitung), init liefert eingangskorb. Keine DB-Änderung.

## 2.431.0 – 2026-10-16 – 👪 Eltern-Handy für Kinder (KC-CLUB-ELTERN) · Server 2.431.0 · neue Edge Function kc-eltern · DB
Wunsch Hansi: „Können Push auch an zwei Handys gehen – das Kind auf seins und die Eltern auf ihres? So sachte wie möglich, Kinder brauchen auch Privatsphäre. Eltern nur, wenn das Kind einen Termin hat oder eine Nachricht vom Leitungsteam oder Admin; untereinander keine Push an die Eltern. Hinterlegt mit der Handynummer, nicht über einen extra Zugangscode.“
- **Mitgliedsfenster → „👪 Eltern-Handy“** (nur Admin und Clubleitung): Name + Handynummer eintragen (höchstens 3 je Mitglied), dann geht WhatsApp an diese Nummer auf – mit Link und Erklärung. Liste mit Stand (✅ eingeschaltet / ⏳ noch nicht), „🟢 Link per WhatsApp“, „📋 Link kopieren“ (immer ein frischer Link, der alte gilt dann nicht mehr), „🗑️ Entfernen“.
- **Elternseite eltern/** (ohne App, ohne Anmeldung): zeigt, was die Eltern bekommen und was nicht, „🔔 Einschalten“ / „🔕 Ausschalten“, iPhone-Hinweis (erst zum Home-Bildschirm). Der Link erlaubt nur das Ein-/Ausschalten – kein Zugang zur App, keine Daten. Eigener Service Worker; der Haupt-Service-Worker lässt eltern/ aus.
- **Was Eltern bekommen – nur ein kurzer Hinweis, nie Text:** Club-Treffen/Veranstaltungen neu, geändert, Terminreihe, abgesagt; Erinnerung am Vortag; Schulungen (neue Einladung, Bestätigung, Erinnerung, Absage durch Hansi); „📨 Nachricht der Clubleitung“, wenn Admin oder Clubleitung dem Kind schreibt (höchstens alle 20 Min.), Notfall-Meldung. **Nie:** Chats unter Mitgliedern, Anklopfen, Spiele, Pinnwand, Dienste, Testeinladungen; nachts (22–7 Uhr) nichts außer Notfall.
- **Das Kind sieht es:** ⚙️ → 🔒 Privatsphäre zeigt „👪 Hinweise an Eltern: …“ (nur Namen, keine Nummer).
- **Server:** eltern_liste/anlegen/link_neu/entfernen (nur Leitung), eltern_meine (Kind). Neue Edge Function **kc-eltern** (Ablauf eltern-hochladen.yml): Versand an die Eltern-Handys mit demselben VAPID-Schlüssel wie der Communicator; „senden“ nur mit dem Dienstschlüssel. Schlüssel aus dem Link nur als SHA-256 gespeichert.
- **👋 Anklopfen sofort (KC-CLUB-ANKLOPFEN-SOFORT, Fall Steven):** Steven bekam Hansis Anklopfen am 15.10. abends nicht angezeigt – beide Browser auf seinem Android-10-Tablet hatten den Push angenommen, aber das schlafende Tablet zeigte ihn nicht (keine „angezeigt“-Rückmeldung). Anklopfen ging bisher mit normaler Dringlichkeit; jetzt wie Express als „critical“ (Push-Dringlichkeit hoch), damit Android ihn im Stromsparmodus nicht zurückhält. Ruhezeit und Anklopfen-Schalter bleiben wie bisher.
- **🧚 Fee in 3D (KC-CLUB-FEE-3D, Wunsch Hansi):** Beim Umdrehen dreht sich die Fee jetzt räumlich um die Hochachse (Perspektive, die Seitenansicht dreht weg und wird dunkler, die Vorderansicht dreht überlappend herein, kurzes Anheben und Neigen, schnellerer Flügelschlag) statt flach von der Seiten- zur Vorderansicht umzuklappen. Im Flug paddeln die Beine leicht (abschaltbar über „Bewegung reduzieren“ des Handys).
- **DB:** neue Tabelle kc_club_eltern (RLS, nur Server). Migration 20261016_kc_club_v2431_eltern.sql, Probe tools/db-test/77_eltern_test.sql. Rückweg: drop table public.kc_club_eltern.

## 2.430.0 – 2026-10-16 – 📲 Kalender einfach verbinden (KC-CLUB-KALENDER-EINFACH) · Server 2.430.0
Wunsch Hansi: „Die richtige und einfache Möglichkeit, den Kalender zu verknüpfen – nicht nur ics erstellen.“ Das Kalender-Abo gab es schon, aber versteckt in ⚙️; der Link ließ sich nur einmal anzeigen – für ein zweites Gerät (iPhone UND Google) musste ein neuer her, der den ersten abschaltete.
- **Ein Knopf „📲“ oben in 📅 Termine** (und im Termin-Fenster „In meinen Kalender“ als Tipp, und in ⚙️): öffnet „Kalender verbinden“ mit drei großen Wegen – 🍎 iPhone/iPad/Mac (webcal → „Abonnieren“), 🟦 Google Kalender (Konto-Seite „Hinzufügen“), 🟦 Outlook – plus Anleitung von Hand und „Link kopieren“. Gibt es noch keinen Link, wird er gleich angelegt (keine Rückfrage).
- **Server:** Der Link ist jetzt aus dem Server-Geheimnis abgeleitet (HMAC aus Person + Erstellzeit, gespeichert weiter nur der Hash) und lässt sich mit `kalender_abo_holen` jederzeit wieder anzeigen. Ältere Links (Zufall) bleiben gültig; für ein weiteres Gerät einmal „Neuen Link erzeugen“.
- Keine Datenbank-Änderung.

## 2.429.0 – 2026-10-16 – 📂 Vergangene Chat-Tage eingeklappt (KC-CLUB-TAGE-EINKLAPPEN) · 📡 Router/Satellit in Nachrichten (KC-CLUB-NETZ-SYMBOL)
Wunsch Hansi: „Die Sache mit dem Ein- und Ausklappen der Nachrichten auch in KC Club“ (wie im Bachkreis) und „wenn mit WLAN verbunden in Nachrichten oben links ein blinkender Router, mit Handynetz ein blinkender Satellit; antippen zeigt Infos und Verbindungsqualität; Animation in den Einstellungen abschaltbar“.
- **Chat:** Tage mit Trenner („Heute“, „Gestern“, „Mo, 11.11.26“). Vergangene Tage als eine Zeile (Anzahl, Absender, rechts das Datum), ältere Wochen als „KW 45/26“. Offen bleiben heute, Tage mit Ungelesenem (Linie „Neue Nachrichten“), beim Suchen und im Rundgang alles. Sprung zu Zitat/📌 klappt den Tag auf. „⤢ Alle aufklappen“ / „⤡ Vergangene Tage einklappen“. ⚙️ → „🧩 Startseite & Ansicht“: zwei Schalter (Standard an).
- **Netz-Symbol:** oben links in 💬 Nachrichten – Router (WLAN) oder Satellit (Mobilfunk), Wellen = Qualität aus den echten Antwortzeiten der App (sonst Schätzung des Handys, ohne Messung grau = unbekannt, ✕ = offline/keine Verbindung). Netzart nur, wo das Handy sie verrät (Android); sonst die zuletzt gewählte, ohne Wahl 🌐. Antippen: Blatt mit Netzart (wählbar), Qualität, Messwerten und „📏 Jetzt messen“ (3× ping); Admin zusätzlich „📊 Ausführlich“. ⚙️ → „✨ Effekte“: Symbol an/aus, Blinken an/aus (auch aus bei „Animationen“ aus und bei „Bewegung reduzieren“).
- Nur App, kein Server- oder DB-Update.
## 2.428.0 – 2026-10-16 – 🐦 Kuckuck: Ton freigeben statt stumm rufen (KC-CLUB-KUCKUCK-FREIGABE)
Fund Hansi: „Der Kuckuck ruft nur einmal. Er hätte 10× machen müssen. Die Uhr war da, die 10 stand daneben, aber der Ton kam nicht.“ Diagnose vom Handy (10:01 Uhr, Android, 2.427.0): 10 Rufe gezählt, 0 gespielt, Ton „suspended“. Ursache: Android/Chrome gibt den Ton erst frei, wenn man in der App einmal getippt hat; öffnet man die App zur vollen Stunde, ruft der Kuckuck sofort – ohne Tippen stumm.
- **Hauptursache (nachgestellt):** Der Akku-Schutz (2.361.0, KC-CLUB-AKKU-6) legt die Tonausgabe 3 s nach dem letzten Ton schlafen. Das traf die Lücke zwischen Freigabe und erstem Ruf; danach war „nur bei laufendem Ton“ nie mehr erfüllt – der Kuckuck rief stumm zu Ende. Nachgestellt im Browser (Ton vorher eingeschlafen): alter Code 0–1 von 10 hörbar, neu 10 von 10 (3 Läufe). Jetzt hält jeder Ruf den Ton wach und weckt ihn, falls er schläft; gespielt wird nur, wenn er binnen 0,4 s läuft (nie übereinander).
- **Neu:** Ist der Ton noch gesperrt, wartet die Uhr bis zu 20 s mit „🔊 Antippen – der Kuckuck ruft 10×“. Das Tippen gibt den Ton frei, dann ruft er hörbar so oft, wie es Uhr ist. Ohne Tippen ruft er stumm (richtig oft) und bietet danach eine Minute lang „🔊 Antippen – 10× mit Ton“ an.
- Hat Android den Ton im Hintergrund angehalten, gibt ihn das nächste Tippen irgendwo in der App wieder frei.
- Nachts bleibt er wie bisher stumm; die Probe in den Einstellungen klingt immer.

## 2.427.0 – 2026-10-15 – 💬 Neue Nachricht an eine Person ohne Betreff öffnet den bisherigen Chat (KC-CLUB-NEU-ALTER-CHAT)
Frage Hansi: „Wenn ich Neue Nachricht wähle und Klaus antippe – neuer Chat oder vorhandener?“ Bisher erschien ein leeres Schreibfenster, gesendet wurde aber (ohne Betreff) schon in den vorhandenen Zweier-Chat – man sah den Verlauf erst danach. Jetzt öffnet „Weiter zum Schreiben“ bei genau einer Person ohne Betreff gleich den vorhandenen Chat mit Verlauf, wie über 👥 Mitglieder → „💬 Nachricht“ (gibt es noch keinen, ein neuer). Mit Betreff beginnt wie bisher ein eigener Chat zum Thema. Nur App, kein Server, keine Datenbank. Rundgang-Text ergänzt.

## 2.426.0 – 2026-10-15 – 🔐 Direkte Leitung: Kanal wechselt bei jeder Zugangsänderung (KC-CLUB-RT-KANAL-WECHSEL) · Server 2.426.0 · DB
Wunsch Hansi nach dem Generalcheck („Ja“ zum wechselnden Kanalnamen). Die direkte Leitung (Supabase Realtime) meldet nur „es gibt Neues“ – nie Inhalte. Ihr Name je Person war aber für immer gleich: ein abgemeldetes Handy oder ein entfernter Gast hätte weiter gesehen, WANN jemand Nachrichten, Anrufe oder Anklopfen bekommt.
- **Neu:** Kanal = HMAC(Geheimnis, Person + Zählnummer). Die Zählnummer steigt bei neuem Link, übernommenem vorgemerkten Link, selbst angefordertem Zugang, „Andere Geräte abmelden“, beendetem Zugang und Sperre. Die eigenen Geräte bekommen den neuen Namen beim nächsten Abruf; das Gerät, auf dem „Andere Geräte abmelden“ gedrückt wird, wechselt sofort.
- **Nichts bricht:** Zählnummer 0 ergibt genau den bisherigen Namen – laufende Geräte merken nichts. Vor dem Datenbank-Update läuft alles wie bisher (der Server ruft die neue Funktion nur „wenn vorhanden“).
- DB: Spalte `kc_club_zugang.rt_epoche`, Funktionen `kc_club_rt_kanal` (neu berechnet) und `kc_club_rt_neu` – nur für den Server. Probelauf 76 (lokal mit PostgreSQL 16 grün: bisheriger Name gleich, neuer Name nach Wechsel, zweimal einspielbar, keine Testreste).

## 2.425.0 – 2026-10-15 – 🩺 Generalcheck: Fehler, einheitliche Bedienung, Sicherheit (KC-CLUB-GENERALCHECK) · Server 2.425.0 · kc-termine · Spiegel-Arbeiter
Anlass (Hansi): „Tiefer Generalcheck – bedienerfreundlich, logisch, gleiche Bedienung, gleiche Bezeichnungen, Sicherheit, TÜV, Komfort … gerne auch mit externen Programmen.“ Geprüft mit den eigenen Tests, ESLint, Semgrep, detect-secrets, axe (Barrierefreiheit), Lighthouse, KICC-Regression (52 Browser-Tests) und drei Code-Prüfungen. Keine Datenbank-Änderung nötig (Rechte der Sicherungsfunktionen live geprüft: gesperrt).
**Paket A – Fehler**
- **Gast/Aushilfe:** keine Notfall-Meldung an alle mehr, auch wenn „SOS für alle“ an ist (Server 403, App zeigt den Knopf nicht) – SOS an die Clubleitung bleibt.
- **Doppeltes Senden:** SOS an alle, Kurznachricht und Weiterleiten gegen Doppeltippen gesperrt; nach Netzfehler (WLAN↔Mobilnetz) wird nur noch Lesen still wiederholt, Schreiben nie (App und Dienstwunsch).
- **Update beim Zurückkehren** wartet, solange ein Erstattungsantrag Positionen hat oder Fotos ausgewählt sind (vorher waren sie weg).
- **Dienstwunsch bei schlechtem Netz:** der Service Worker liefert die Startseite nur noch für die App selbst – vorher lief im Twinkey-Fenster die ganze App ein zweites Mal.
- **Spiele:** jeder eigene Zug startete einen weiteren Abfrage-Takt (Akku, Server) – jetzt immer nur einer. **Fitness:** Doppeltipp auf „Los geht’s“ ließ die Uhr doppelt laufen.
- **Uhrzeiten** (Treffen, Umfragen, Fristen, Freud & Leid, Termin-Vorschläge …) immer in deutscher Zeit – auch wenn das Handy im Urlaub auf andere Zeit steht. **Beträge** mit Tausenderpunkt („1.250,00“). **km-Abrechnung** „letzter Monat“ am 1. kurz nach Mitternacht richtig. Fehler 413/429/408 in Klartext.
- **Kalender-Abo** endet, wenn der Zugang entzogen oder gesperrt ist. **Anlagen-Links** für Gäste/Aushilfen nur eigene und Chat-Anlagen. Aushilfen: Album ändern entfernt (nur ansehen, wie entschieden).
**Paket B – einheitliche Bedienung**
- **Rückfragen:** Verwerfen, Zurücksetzen, Überschreiben, Vergessen, Sperren und 🗑️-Knöpfe sind jetzt rot mit Fokus auf „Abbrechen“; „Fernhilfe erlauben“ und „Feedback neu“ nicht mehr fälschlich rot. Gefahr-Knopf hell mit rotem Rand – deutlich anders als der weinrote Hauptknopf. Löschfenster (Nachricht, Termin aus Reihe) gleich gestaltet.
- **Eingaben schützen:** wer in einem Fenster getippt hat und daneben tippt, ✕, Escape oder „Zurück“ drückt, wird gefragt („Verwerfen / Weiter bearbeiten“). Chat-✕ „Text löschen“ mit „Rückgängig“.
- **Begriffe:** „🔧 Erweiterte Ansicht“ überall (statt „Alle Funktionen“/„Erweitert“), „🧪 Test an mich“, Namenssuche „🔍 Name suchen …“, „💾 … gespeichert“, Kachel „✏️ Änderung melden“, „📆 Termine im Handy-Kalender“ (📲 nur noch App-Installation), Knöpfe in gewohnter Reihenfolge.
- **Hilfetexte** zeigen auf die richtigen Stellen (Boten → ✨ Effekte, Kurzanleitung, Sprachsteuerung, Sprachansagen, Männerstimme, Einweisung, „📤 Teilen“); Push-Hinweis mit Sprung-Knopf (auch in der einfachen Ansicht). Schalter, die nur auf diesem Handy gelten, sagen es.
- **Barrierefreiheit/Komfort:** kleine Knöpfe 44 px, größere ✕ in Chips, Beschriftungen für Vorleseprogramme (Emoji-Knöpfe, Chat-Feld, Auswahllisten), größere Tippfläche für Online-Lämpchen und Versionsnummer, Kontrast (Dienstplan-Legende, Termin-Seite). Termin-Seite: du/ihr beim Absagen und Bestätigung danach.
- Die Fußleiste behält „Mehr“: „Einstellungen“ passt auf kleinen Handys mit großer Schrift nicht (gemessen).
**Paket C – Sicherheit**
- **Mengengrenzen** gegen das Leeren des Mail-Kontingents: Hilfe-Aufrufe und Hilfe-Angebote je 5/Tag, neue Nachrichten an alle 10/Tag (Gäste/Aushilfen 3), „wichtig“-Bescheid je Zettel/Aufruf nur einmal. Admin ohne Grenze.
- **Hochladen:** Kontingent je Person (300 MB/Tag, Gäste/Aushilfen 60 MB), angebliches Bild ohne Bild-Inhalt nur als Download.
- **Notfall-Chat:** Selbstlöschen und Anheften nur der Admin. **Push** nur über echte Push-Dienste (Google, Mozilla, Apple, Microsoft – alle vorhandenen Anmeldungen geprüft). **Notbetrieb-Nachtrag** übernimmt nur die Felder, die der Ersatz-Server annimmt.
- **kc-termine:** keine internen Datenbank-Texte nach außen, Geheimnisse zeitkonstant verglichen (auch Spiegel-Arbeiter).
- Bewusst unverändert (Abwägung): Kurzcode-Bremse (löscht bei Überlauf offene Codes – Schutz gegen Erraten), Push-Anmeldung wandert bei geteiltem Gerät zur neu angemeldeten Person, Realtime-Kanal und Verschlüsselung des Notfall-Pakets beim Ersatz-Server (größerer Umbau, eigener Auftrag).

## 2.424.0 – 2026-10-15 – Texte: „KC-Verwaltung“ statt „KC Manager“ · Server 2.424.0
Hinweis Hansi: „Es gibt ein Programm KC-Verwaltung und ein Programm PC Manager – das sind 2 Programme. Verwaltung ist das Verwaltungssystem, PC Manager managt hauptsächlich die Kassen.“ Die Club-App nannte die Verwaltung in sichtbaren Texten „KC Manager“ (alter interner Name, technisch weiter `KC_MANAGER`/`kc_manager_state_sections`).
- Änderungen der Mitglieder (Hilfe, Hinweis „freigegeben – liegt für die KC-Verwaltung bereit“, Freigabe-Frage und Meldung), Aktionen/Ausflüge („Die Angaben kommen aus der KC-Verwaltung“), Austritts-Checkliste und Server-Meldung „kann nur in der KC-Verwaltung eingetragen werden“.
- Nur Texte; keine Funktion, keine Daten, keine Datenbank geändert.

## 2.423.0 – 2026-10-15 – Sonderstunden mit Stand: gutgeschrieben, offen, abgelehnt (KC-CLUB-SONDERSTUNDEN-KONTO, KICC-F-100)
Wunsch Hansi: „noch bauen mit den Stunden“ – Mitglieder sehen ihre bestätigten Sonderstunden jetzt auch in der App (vorher nur die Nachricht „gutgeschrieben“ und der Kontoauszug in DP2).
- **🗓️ Mein Dienst:** neue Karte „★ Sonderstunden“ – Summe gutgeschrieben, offen gemeldet (zählt erst nach Bestätigung), je Meldung Tag, Zeit, Einsatz und Stand; abgelehnt mit Grund. Gilt für die ganze Veranstaltung (nicht nur 60 Tage). Pausen zählen wie in DP2.
- **Twinkey (DP2 Build 291, unverändert übernommen):** „Meine erfassten Zeiten“ zeigt Sonderstunden mit Stand und Summe; der Knopf war in der App bisher immer gesperrt (keine Stempelzeiten) und ist jetzt bei eigenen Meldungen wählbar.
- Termin Abholung korrigiert: 29.11.2026 (Grünkohl kochen 28.11.2026). Server 2.423.0 (2.421.0/2.422.0 waren parallel vergeben).

## 2.422.0 – 2026-10-15 – 🔒 Zugang für Gäste und Aushilfen (KC-CLUB-ZUGANG) · Server 2.422.0 · DB
Anlass (Hansi): „Wir müssen den Zugang für Gäste und Aushilfen einschränken – die dürfen Nachricht schreiben, SOS und Clubtermine … und Spiele.“ Entscheidungen Hansi: Aushilfen sehen das Fotoalbum (nur ansehen); Gäste schreiben an alle Mitglieder; Spiele auch gegen Mitglieder; kein Ablaufdatum.
- **Zugang je Person** (`kc_club_rollen.zugang`): 👤 Mitglied (alles wie bisher), 🧑‍🍳 Aushilfe, 🙋 Gast. Einstellbar im Rollen-Fenster (🎖️ Ämter und Rechte). Admin ist immer Mitglied.
- **Sperre auf dem Server:** `zugangPruefen` als erste Zeile von `aktionAusfuehren` – gilt für normale Anfragen, geplante Nachrichten, Notfall-Paket und Nachtrag. Für Gäste/Aushilfen ist nur erlaubt, was in `ZUGANG_AKTIONEN` steht; alles andere → 403.
  - **Gast:** Clubtermine (ansehen, zu-/absagen, Kalender, eigene private Termine), Nachrichten (an alle), SOS, Spiele + Rätsel, Hilfe/Twinkey/Feedback, Einstellungen, Push und Technik.
  - **Aushilfe:** dazu Mein Dienst/Dienstwünsche (inkl. Sondereinsatz-Zusage und Stunden melden), Fotoalbum ansehen, Schulung.
  - Gesperrt u. a.: Archiv, Protokolle, Pinnwand, Vorschläge, Erstattung, Büro, Helfen & Leihen, To-dos, Suche, Admin.
- Gäste/Aushilfen sehen **nie Protokolle und keine Kontaktdaten anderer** (`zugangAnwenden` in `ichAus`); **SOS** zeigt ihnen nur die Clubleitung (mit deren freigegebenen Nummern) und sich selbst.
- **App:** dieselbe Liste (`ZUGANG_AKTIONEN`) – Verbotenes wird gar nicht erst geschickt; Kacheln (erweitert + einfach) passend gefiltert (`ZUGANG_KACHELN`).
- **Datenbank:** `supabase/migrations/20261015_kc_club_v2422_zugang.sql` (Spalte `zugang`, Standard „mitglied“, Prüfregel; bisherige Aushilfen = Amt „Aushilfe“ → „aushilfe“). Probelauf `tools/db-test/74_zugang_test.sql`. Bis zum Einspielen gilt für alle „mitglied“; das Rollen-Fenster speichert weiter (Zugang dann mit Hinweis). Rückweg in der Migration.
- Vertragstest: gleiche Liste in App und Server, alle Aktionen vorhanden, heikle Bereiche gesperrt, Sandkasten der App-Regeln (Gegenprobe: ohne Server-Sperre rot).

## 2.421.0 – 2026-10-15 – ☑️ Kacheln auswählen (KC-CLUB-KACHEL-AUSWAHL)
Anlass (Hansi): „Unter Einstellungen generell die Kacheln anhaken, die man haben möchte – die anderen sind verborgen. In 3 Blöcken Club, Meins, Technik, einklappbar, alle auflisten mit Klickkästchen – nebeneinander, nicht zu viel Platz verschwenden.“
- ⚙️ → „🧩 Startseite & Ansicht“ → **„☑️ Kacheln auswählen“**: drei einklappbare Blöcke 🏠 Club, 🙋 Meins, 🛠️ Technik mit Zähler („13 von 14“), Kästchen im Raster nebeneinander (Handy 2 Spalten, breiter 3–4); „✅ Alle anzeigen“ je Bereich.
- Kein eigener Speicher: Haken = nicht in `KA.aus` – dasselbe Ausblenden wie „Anordnen“ (✕/👁️), gilt auf allen Geräten. Gezeigt werden nur Kacheln, die man sehen darf (`kachelnAlle`); das Admin-Register bleibt außen vor.
- `kaSichtbar(id, sichtbar, leise)`: neuer optionaler Parameter, damit beim Ankreuzen nicht jedes Mal ein Hinweis erscheint; über ✕ bleibt der Hinweis wie bisher.
- In der einfachen Ansicht steht ein Hinweis, dass die Auswahl für die erweiterte Ansicht gilt. Hilfe-Eintrag und Suchbegriff ergänzt, Vertragstest.

## 2.420.0 – 2026-10-15 – Sondereinsätze: vorläufige Einteilung durch den Planer (KC-CLUB-SONDER-VORGESEHEN, KICC-F-100)
Wunsch Hansi: „Kochen am 28.11.26, Abholung am 29.12.26 – zum Kochen Wilfried, Steven, Manfred eintragen, zum Abholen Frank und Wilfried. Vorläufig geplant.“
- **Twinkey (DP2 Build 290, unverändert übernommen):** Bei „Bei einem Sondereinsatz helfen“ steht „👥 Du bist vorgesehen (vorläufig)“. Beim Melden der Sonderstunden sind die vorgesehenen Kollegen schon ausgewählt (abwählbar, wer nicht dabei war).
- **Server kc-club 2.420.0:** liefert die Einteilung mit (`payload->vorgesehen` aus kc_dp_special_events). Erinnerung nach der Meldefrist geht jetzt auch an Vorgesehene ohne Meldung („du warst … eingeteilt“), weiterhin einmal je Person und nur bei festem Termin.
- Zusagen bleiben die eigene Entscheidung der Mitglieder; die Einteilung ist ein Vorschlag des Planers.

## 2.419.0 – 2026-10-15 – Sonderstunden melden, Zusagen & Fahrgemeinschaften, Erstattung bei Sondereinsätzen (KC-CLUB-SONDERSTUNDEN, KICC-F-100)
Wunsch Hansi: Grünkohl kochen im Krankenhaus Dortmund, Abholung nach Hamm, Getränke zuhause – Stunden aufs Stundenkonto Weihnachtsmarkt, Kosten über die Erstattung.
- **Twinkey (DP2 Build 289, unverändert übernommen):** „Sonderstunden melden“ – Einsatz, Tag, Zeit von zuhause bis zuhause, Tätigkeit, Fahrtrolle, weitere Kollegen mit jeweils eigenen Stunden, „✓ Gutschreiben lassen“; danach „🚗 Fahrtkosten / Auslagen erfassen“ (öffnet die Erstattung vorausgefüllt). „Bei einem Sondereinsatz helfen“ – Zusage mit Anreise (fahre mit freien Plätzen / brauche Mitfahrt / komme selbst) und Startort (nur Ort); die eigene Fahrgemeinschaft wird angezeigt. Nur Mitglieder wählbar; fehlende Club-Mitglieder werden ergänzt.
- **Server kc-club:** `stunden_melden` (Prüfung Termin/Datum/Zeiten/Mitglieder, Doppelschutz, je Person eine Zeile in kc_dp_hour_reports, Push an mitgemeldete Kollegen), `sondereinsatz_zusage`, `dienstwunsch_laden` liefert Einsätze, Meldungen, Zusagen, Fahrgemeinschaften, Mitglieder. Wartung: Nachricht bei Bestätigung/Ablehnung durch den Planer; Erinnerung 3 Tage nach dem Einsatz an Zugesagte ohne Meldung (einmal, 9–20 Uhr).
- **Erstattung:** neue Arten 🅿️ Parkgebühren, ⛽ Kraftstoff (nur Miet-/Clubfahrzeug – mit eigenem Auto nur km-Pauschale), 🔐 Kaution (zählt nicht zur Summe; bezahlt aus eigenem Geld → zurück ans Mitglied, aus Club-Vorschuss → zurück an den Club; verfallen → wird erstattet). Je Position „Bon/Quittung vorhanden?“ (📷 Foto / 🧾 Papier / ❌ nein mit Begründung), Bezug zum Sondereinsatz, Vorschuss vom Club (Auszahlung bzw. Rückzahlung). Mitfahrer laut Fahrgemeinschaft, der km abrechnet → Hinweis für den Kassenwart.
- **Büro-Eingangskorb:** „🔎 Erstattung – nachverfolgen“ für offene Kautionen und abzugebende Papierbelege (auch nach der Erstattung): „Beleg erhalten“, „Kaution an Mitglied zurück“ / „beim Club eingegangen“ / „verfallen“.
- Voraussetzung: Migrationen aus dp3 (20261015120000/130000/140000) und 20261015_kc_club_v2418_erstattung_sonder. Server 2.419.0. (Nummer 2.418.0 war parallel für die Startseiten-Vorschläge vergeben.)

## 2.418.0 – 2026-10-15 – 💡 Vorschläge zur Startseite (KC-CLUB-KACHEL-VORSCHLAG)
Anlass (Hansi): „Die App soll merken, welche Funktionen am meisten genutzt werden, und dann vorschlagen: sollen wir Kacheln verbergen oder weitere Funktionen freischalten?“ – adaptive Startseite, aber **nur als Vorschlag**, die App baut nie selbst um.
- **Zählen nur auf dem Gerät:** Beim Öffnen einer Kachel merkt sich die App Anzahl und letzten Tag (localStorage `kc_club_nutzung`), dazu die Tage mit Nutzung. Nichts geht an den Server.
- **Wann:** frühestens nach 21 Tagen und 8 Nutzungstagen, höchstens alle 7 Tage ein Vorschlag, beim Start nach der Bewegungs-Einladung und nie über einem offenen Fenster.
- **Erweiterte Ansicht – „ausblenden?“:** die am längsten ungenutzte sichtbare Kachel (≥ 28 Tage). Nie vorgeschlagen: SOS, Termine, Nachrichten, Mein Dienst, Dienstwünsche und Kacheln mit neuer Zahl. „🙈 Ja“ nutzt das bestehende Ausblenden (👁️ holt sie zurück), „👍 Nein, behalten“ wird gemerkt.
- **Einfache Ansicht – „weitere Funktionen freischalten?“:** wer gut zurechtkommt (≥ 4 verschiedene Kacheln, ≥ 20 Mal geöffnet). „✨ Ja“ schaltet zur erweiterten Ansicht, „⏰ Später“ fragt nach 14 Tagen wieder, „🙂 Nein, danke“ nie mehr.
- **Abschaltbar:** „🔕 Keine Vorschläge mehr“ im Fenster oder ⚙️ → „🧩 Startseite & Ansicht“ → „💡 Vorschläge zur Startseite“; dort auch „🧹 Gemerktes löschen“. Hilfe-Eintrag, Frage „Wie schalte ich … ab?“ und Suchbegriff ergänzt.
- Vertragstest spielt die Regeln im Sandkasten durch (mit Gegenprobe).

## 2.417.0 – 2026-10-15 – 🎤 Club-Song: neue Zeilen im Refrain · 🎬 Filmseite für den Werbefilm
**Club-Song** (Anlass Hansi, beim Werbefilm „Köcheclub to go“): Im Refrain von „Seit einundneunzig“ heißt es jetzt „Seit einundneunzig – da **glüht** unser Herd, / weil Freundschaft **immer dazu** gehört!“ (vorher „da brennt unser Herd, / weil Freundschaft und Kochen für immer gehört“). Die zweite Zeile hat zwei Silben weniger; ihre Melodie ist auf 9 Töne gekürzt (gleicher Bogen, Schluss auf dem Grundton). Karaoke und Takte bleiben gleich (jede Zeile 2 Takte, letzte Silbe gehalten). Der Werbefilm singt denselben Text.

**Filmseite** (KC-CLUB-WERBEFILM-SEITE, Wunsch Hansi „Link, der den Film sofort abspielt“ – für Mitglieder, die die App noch nicht haben): neue Seite `film/` (https://sire65.github.io/KC-Clubapp/film/) mit dem Werbefilm (2:11, 20 MB, Hochformat), Kochmütze + „since 1991“ und dem Hinweis „Noch keine App? Deinen persönlichen Zugangslink bekommst du bei Hansi“. Ohne app.js, ohne Anmeldung, ohne Daten; `noindex`; Vorschaubild für WhatsApp (og:image). Der Service Worker lässt `film/` aus (wie `stimmen/`): der Film kommt nicht in den Offline-Speicher, Abspielen mit Range-Anfragen (iPhone) läuft direkt übers Netz. Quellen des Films: KC-Infrastructure-Control-Center, Ordner `werbefilm/`.

## 2.416.0 – 2026-10-15 – Kuckucksuhr ruft wieder so oft, wie es Uhr ist (KC-CLUB-KUCKUCK-ZAEHLEN)
Fund Hansi: „um 15:00 Uhr nur einen Kuckuck – falsche Zeitzone oder Fehler?“ Zeitzone (Europe/Berlin) und Zählung (15 Uhr → 3 Rufe) stimmten. Ursache: Kommt die Uhr ohne vorheriges Antippen, ist der Ton auf dem Handy oft noch angehalten – seine interne Uhr steht. Alle drei Rufe wurden auf denselben Zeitpunkt gelegt und erklangen beim Freigeben gleichzeitig, also wie ein einziger Kuckuck. Jetzt wartet die Uhr bis zu 1,5 s, bis der Ton läuft, und spielt jeden Ruf nur bei laufendem Ton – nie mehr übereinander (notfalls ruft der Kuckuck stumm, aber richtig oft). Einmal je Sitzung meldet die App zur Kontrolle Stunde, Rufe, gespielte Rufe und Ton-Zustand (Diagnose „kuckuck“).

## 2.415.0 – 2026-10-15 – Hilfe, Twinkey, Lupe und Videos zu den neuen Avataren (KC-CLUB-AVATAR-HILFE)
Wunsch Hansi: „Passe die Hilfetexte, Twinkey, Lupe und Video an die neuen Avatare an.“
- Hilfe: „Ein Bild statt Buchstaben“ nennt Bisherige und Hochwertige Avatare; neu „👑 Hochwertige Avatare“ und „🧩 Figur individuell anpassen (Schmuck, Kochjacke, Stil)“ mit Hinweis zur eigenen Brille.
- Twinkey: Antworten zu Kochbild und Baukasten aktualisiert; neu „Was sind die hochwertigen Avatare?“, „Ohrringe, Kette oder Piercing?“, „Kann ich meine eigene Brille verwenden?“.
- Lupe: findet „Mein Bild“ auch mit „hochwertig“, „Avatare“ …; neuer Treffer „🧩 Figur anpassen“ (Frisur, Brille, Ohrringe, Kette, Piercing, Schürze …).
- Geführte Hilfe: zeigt auf den aufgeklappten Bereich; im Baukasten zusätzlich Jackenschnitt, Ohrringe, Halskette, Piercing.
- Videos (Fassung 2): „Koch-Figur aussuchen“ mit Bisherige/Hochwertige Avatare und Individuell anpassen; „Eigene Figur zusammenstellen“ mit Kacheln, Stil, Schmuck, neuen Bärten, Mützen, Brillen und Jackenschnitt. Klappbereiche öffnet das Video nur vorübergehend.

## 2.414.0 – 2026-10-15 – Hochwertige Avatare, mehr Accessoires, Baukasten mit Kacheln (KC-CLUB-AVATAR-PREMIUM)
Anlass (Hansi, Vorlage aus ChatGPT): hochwertige Avatar-Auswahl in die bestehende App einbauen, bisherige Avatare unverändert lassen.
- „Mein Bild“ hat jetzt die drei Bereiche der Vorlage: **Bisherige Avatare** (die 40 Figuren, unverändert), **Hochwertige Avatare** (36 neue Figuren: 18 Köchinnen, 18 Köche, alle Hauttöne, jung bis reif, viele Frisuren, Kopfbedeckungen und Kochjacken) und **Individuell anpassen** (Kacheln, die den Baukasten direkt an der richtigen Stelle öffnen).
- Die hochwertigen Figuren sind keine Bilder, sondern Codes „p…“ aus denselben Bausteinen wie der Baukasten, gezeichnet mit Licht, Schatten und Konturen. Darum ist jede im Baukasten anpassbar und wird zuverlässig gespeichert. Zusätzlich liegt jede als eigenständige SVG-Datei in avatare/premium/ (erzeugt mit tools/avatare-erzeugen.mjs).
- Neue Teile, nur hinten an die Listen angehängt (alte Codes bleiben gleich): Ohrringe (7), Halsketten (5), Piercings (6), Jackenschnitt (zweireihig, schräg, mit Schürze), Falten, 5 Frisuren, 4 Haarfarben, 4 Bärte, Beanie/Barett/Turban, 2 Brillen (Panto, Browline), 4 Jackenfarben, 4 Jackenmuster, 7 Hintergründe, 3 Halstücher.
- Baukasten: Kacheln „Was möchtest du ändern?“, Vorschaubilder bei Frisur, Kopfbedeckung, Bart, Brille und Schmuck, Stil klassisch/hochwertig. Alle bisherigen Einstellungen bleiben. Die Brille „randlos“ (nach Hansis Foto gezeichnet) bleibt, dazu der Hinweis „📷 Eigene Brille: Foto schicken, wird nachgezeichnet“.
- Freigabe „👑 Hochwertige Avatare“ (neu, Standard: nur Admin) – erst testen, dann unter 🚦 Freigaben für alle einschalten.
- Rückwärts-Prüfung: tests/avatar-rueckwaerts.test.mjs zeichnet 1.844 bisherige Bilder (alle 40 Figuren, die 7 echten Mitglieder-Bilder, 300 b- und 1.500 c-Codes) und verlangt das exakt gleiche Bild wie in 2.413.0. Keine Datenbank-Änderung.

## 2.413.0 – 2026-10-15 – „Mein Bild“: Klappbereiche als Karten (Vorlage von Hansi)
Anlass (Hansi): Entwurf aus ChatGPT („Dein Avatar“ mit „Bisherige Avatare“ und „Hochwertige Avatare“). Die vier Klappbereiche haben jetzt einen Kopf als Karte: Symbol, Titel, Untertitel („weiterhin verfügbar“ bzw. „mit mehr Ausdruck“), Pfeil rechts; zugeklappt zeigt der Kopf eine kleine Vorschau mit den ersten Figuren (KC-CLUB-AVATAR-KARTEN). Bisherige Figuren und Zuordnungen bleiben unverändert.

## 2.412.0 – 2026-10-15 – „Mein Bild“: Klappbereiche und Platz für hochwertige Figuren
Anlass (Hansi): „ChatGPT baut gerade neue, bessere Avatare. Baue sie in Klappbereiche ein – weibliche, männliche, hochwertige weibliche, hochwertige männliche. Die alten bleiben erhalten und zugeordnet.“ In „Mein Bild“ gibt es jetzt vier Klappbereiche: 👩‍🍳 Köchinnen, 👨‍🍳 Köche (die bisherigen Figuren, unverändert), ✨ Köchinnen – hochwertig, ✨ Köche – hochwertig. Die hochwertigen sind Bilddateien (avatare/gw01.webp …, gm01.webp …) und stehen in avatare/avatare.json – neue Figuren kommen ohne Programm-Update dazu (Anleitung: avatare/LIESMICH.md). Server: Codes gw/gm gültig.

## 2.411.0 – 2026-10-15 – Dienstpläne: „Wen anzeigen?“ zum Zuklappen
Anlass (Hansi): „Baue dort einen Klappbereich ein, damit man besser sieht, dass es unten weitergeht.“ Die Namensauswahl ist jetzt ein Klappbereich (anfangs zu, wird gemerkt, mit 🔒 feststellbar); zugeklappt steht im Kopf, wer gewählt ist („· Ich, Christina +2“), und der Dienstplan rückt nach oben. Einführung und Hilfe klappen ihn selbst auf.

## 2.410.0 – 2026-10-15 – ✨ Aufblitzen im Kopf wie im Vorspann
Anlass (Hansi): „Der Effekt ist noch nicht, wie ich es mir vorstelle – es soll ein Aufblitzen sein, wie man es in Werbung oder im Vorspann sieht, wenn ein Logo erscheint.“ Jetzt: Ein weiches Licht startet an der Kochmütze, wandert schräg nach unten rechts, verdichtet sich in der Mitte zu einem hellen Punkt und blitzt dort auf wie eine Spiegelung (der Kopf leuchtet rundherum mit); danach löst es sich weich auf (2 s). Glanzstreifen und Stern hat Hansi nach den Vorschauen gestrichen.

## 2.409.0 – 2026-10-15 – Lichtschein auch bei „Animationen entfernen“
Die Rückmeldung aus 2.408.0 zeigte: Auf Hansis Handy ist „Animationen entfernen“ aktiv – deshalb blieb der Lichtschein aus, während Herbst-Bühne, Laub und Kuckucksuhr liefen. Wahl Hansi: Der Lichtschein folgt jetzt nur noch dem App-Schalter „✨ Animierte Knöpfe“, wie die übrigen Effekte.

## 2.408.0 – 2026-10-15 – Lichtschein: länger warten, Rückmeldung warum
Anlass (Hansi): „Lichtschein immer noch nicht gesehen.“ Der Schein wartet jetzt bis zu 10 Minuten, bis die Startseite frei von Fenstern ist (vorher 20 s). Außerdem meldet die App einmal je Sitzung über die vorhandene Diagnose, ob er gelaufen ist und sonst warum nicht (z. B. „Animierte Knöpfe“ aus, „Bewegung reduzieren“ am Handy, Fenster offen) – nur technische Werte, keine Inhalte.

## 2.407.0 – 2026-10-15 – Lichtschein im Kopf wird jetzt sichtbar
Anlass (Hansi): „Den Lichteffekt im Kopf habe ich noch nicht gesehen.“ Der Schein lief sofort beim Öffnen – während die App noch lädt (auf langsameren Handys war er vorbei, bevor etwas gezeichnet wurde) und oft unter einem Start-Fenster. Jetzt startet er erst, wenn die Startseite fertig geladen und frei von Fenstern ist; beim Zurückholen nach ≥ 1 Minute ebenso.

## 2.406.0 – 2026-10-15 – 🐦 Kuckucksuhr mit echter Aufnahme
Anlass (Hansi): „Such eine freie Aufnahme.“ Der Ruf kommt jetzt aus der Aufnahme einer echten Kuckucksuhr („Cuckoo Clock.wav“ von DiArchangeli, freesound.org/s/128177, Lizenz CC0 – gemeinfrei, ohne Namensnennung nutzbar). Ein Ruf (0,84 s, 7 KB) liegt als kuckuck-ruf.mp3 in der App und im Offline-Speicher; Takt wie bei der echten Uhr. Lädt die Datei nicht, ruft der bisherige selbst erzeugte Klang.

## 2.405.0 – 2026-10-15 – 🐦 Kuckucksuhr klingt wie die echte Schwarzwälder Uhr
Anlass (Hansi): „Tonfolge stimmt, hört sich aber nicht so gut an“ – „recherchiere, wie sich eine echte Kuckucksuhr anhört“. Nach Recherche (Uhrenmuseum, Uhrenbau): Vor jedem Ruf schlägt der Hammer auf den Spiralgong, das Türchen klackt, dann rufen zwei gedackte Holzpfeifen „Ku – ckuck“, gestimmt auf A und F (große Terz abwärts, tiefer und weicher als vorher). Gedackt = fast reiner, hohler Ton mit kurzem höheren Anblasen; Takt 1,5 s wie bei der Uhr. Anhören: Einstellungen → „🔊 Probe“.

## 2.404.0 – 2026-10-14 – 🐦 Kuckucksuhr klingt echt, Probe-Knopf
Anlass (Hansi): „Kuckucksuhr gekommen, aber kein Ton – dafür gibt es den typischen Ton solcher Uhren.“ Der Ton fehlte, weil die Uhr nachts (22–7 Uhr) absichtlich stumm ist. Der Ruf klingt jetzt wie eine echte Kuckucksuhr: Türchen klackt, dann zwei Holzpfeifen mit Blasebalg-Luft (hoch – tief). Neu in den Einstellungen: „🔊 Probe“ zeigt die Uhr sofort mit Ton – auch nachts.

## 2.403.0 – 2026-10-14 – 🏎️ Express: Priorität 1, ehrliche Rückmeldung, Hinweis vorab
Anlass (Hansi): Prüfung „wie läuft Express?“ – Christina bekam Express nur per Mail, die App meldete aber „nicht zugestellt“; bei ihr stand „angekommen“, obwohl sie nicht in der App war.
- Express geht mit Priorität 1 raus: je Empfänger ein eigener Auftrag, alle gleichzeitig; der Versanddienst lässt Express an der Minutengrenze vorbei (KC Communication, Router).
- Nach dem Senden steht je Empfänger, was wirklich raus ist: „🔔 Push + ✉️ Mail“, „✉️ Mail (kein Push auf dem Handy)“ oder „❌ nicht zugestellt“.
- Schon beim Einschalten von 🏎️ sagt die App, wer keinen Push bekommt (nur Mail bzw. gar nichts).
- „Angekommen“ zählt erst, wenn das Express-Fenster beim Empfänger wirklich auf dem Bildschirm steht (bzw. beim Antworten / Öffnen des Chats) – das bloße Laden zählt nicht mehr.

## 2.402.0 – 2026-10-14 – 🐦 Kuckucksuhr zur vollen Stunde
Solange die App offen ist, kommt zu jeder vollen Stunde oben eine Kuckucksuhr herein: Die Tür geht auf und der Kuckuck ruft so oft, wie es Uhr ist (13 Uhr → 1×, 12 Uhr → 12×). Wer die App in den ersten zwei Minuten nach der vollen Stunde öffnet, bekommt sie auch noch. Nachts (22–7 Uhr) und mit „Töne aus“ ohne Ton. Antippen schließt die Uhr. Abschaltbar unter Einstellungen → „🐦 Kuckucksuhr zur vollen Stunde“.

## 2.401.0 – 2026-10-14 – Lichtschein auch beim Zurückholen der App
Öffnet man die App, holt Android sie meist nur aus dem Hintergrund zurück, ohne sie neu zu starten – dann kam bisher kein Lichtschein. Jetzt läuft er auch dann, wenn die App mindestens eine Minute im Hintergrund war.

## 2.400.0 – 2026-10-14 – Lichtschein über den Kopf beim Start
Beim Öffnen der App läuft einmal ein heller Lichtschein von links nach rechts über den ganzen Kopf der Startseite (knapp 2 s). Er läuft flüssig, auch während die App beim Start noch rechnet, und kommt beim Zurückkehren zur Startseite nicht erneut. Bei „Animationen aus“ und bei „Bewegung reduzieren“ am Gerät entfällt er.

## 2.399.0 – 2026-10-14 – Bühne: Power-Kette im Takt und natürlicher
Ansagen passen jetzt genau zur Bewegung (kurz, beim Wechsel, Begrüßung kürzer, Einzählen erst nach der Erklärung). Bewegungen neu: Knie beugen sich, Hüftschwung, echte Seitschritte, Hocke mit tiefer Hüfte, Sprung mit Ausholen – fließende Übergänge.

## 2.398.0 – 2026-10-14 – Herbst: Name aus Nüssen besser lesbar
Der Name, den das Eichhörnchen legt, ist größer, aus mehr und kleineren Nüssen und hat einen hellen Rand – die Buchstaben sind gut zu erkennen.

## 2.397.0 – 2026-10-14 – ⭐ Favoriten auch in der Mitgliederliste
Ein Stern je Person: in der Mitgliederliste ☆/⭐ antippen oder beim Einzelchat „⭐ Als Favorit“ – es ist derselbe Stern und er erscheint an beiden Stellen. Gruppenchats behalten ihren eigenen Stern. Neu: Filter „⭐ Favoriten“ bei den Mitgliedern.

## 2.396.0 – 2026-10-14 – Hilfe, Suche, Twinkey und Video für die Neuheiten
Neue Hilfetexte (Express 5/Tag mit Zähler, Express-Zustellung, Favoriten, ✅ Alle, Online mit Uhrzeit, Terminanfragen oben, Wer kommt wann), Twinkey beantwortet Express, Zurückholen, Favoriten, Später senden; die Lupe findet sie; Video „Neue Nachricht“ mit Express, Später senden, Zurückholen und Favoriten.

## 2.395.0 – 2026-10-14 – Meins: „Meine Einstellungen“
Die Kachel „Einstellungen“ unter Meins heißt jetzt „Meine Einstellungen“.

## 2.394.0 – 2026-10-14 – Kein Fehlalarm bei doppelt offener App, Igel ganz stachelig
Ist die Club-App zweimal offen, meldet das geleerte Fenster keine Fehler mehr (war ein Fehlalarm). Der Igel hat jetzt auf Rücken und Seiten überall Stacheln.

## 2.393.0 – 2026-10-14 – Hund mit Gelenken, Igel mit feinen Stacheln
Der Herbst-Hund läuft mit Knie, Sprunggelenk und Pfoten; der Igel hat feinere Stacheln, auch an den Seiten.

## 2.392.0 – 2026-10-14 – Herbst: Mitte frei, Pilze kleiner
Pilze etwas kleiner, höchstens 2 Fliegenpilze; in der Mitte, wo das Eichhörnchen den Namen legt, liegen keine Eicheln und wachsen keine Pilze – nur Laub.

## 2.391.0 – 2026-10-14 – Express-Zähler 2/5
Am 🏎️-Knopf steht, wie viele Express-Sendungen heute schon verschickt wurden (z. B. 2/5). Sind alle 5 verbraucht, geht Express nicht an – mit Hinweis, ab wann es wieder geht. Admin unbegrenzt.

## 2.390.0 – 2026-10-14 – Online-Push mit Uhrzeit + Wer kommt wann?
„🟢 Klaus ist jetzt online (19:05 Uhr)“ mit Datum; kommt die Mitteilung mehr als 10 Minuten später an (PC war aus), steht dort „war um 19:05 Uhr online“ und es gibt keine Ansage. Neu in Admin → Nutzung: „📅 Wer kommt wann?“ – Wochentag × Uhrzeit, je Mitglied filterbar.

## 2.389.0 – 2026-10-14 – 📊 DB-Abfragen im Admin, 📨 Terminanfragen sichtbar, 🍄 Herbst-Pilze
KC-CLUB-DB-LAST (Wunsch Hansi): Admin → Supabase zeigt eine Balkengrafik der Datenbank-Abfragen der letzten 7 Tage je Stunde (Wochentag + Uhrzeit), farbig nach Quelle (Club-App, Verwaltung/PC-Manager, Kasse, DP2, Kommunikation, Spiegel, Überwachung, Zeitpläne …), dazu Summe je Uhrzeit und Anteil je Quelle; Umschalter Anzahl/Rechenzeit; Balken antippen = Klartext. Messung alle 10 Min. (kc_club_db_last). KC-CLUB-TERMINANFRAGE-SICHTBAR (Fund Hansi „Klaus hat meine Terminanfrage nicht gesehen“): offene persönliche Terminanfragen stehen ganz oben unter „Heute wichtig“ (orange umrandet, „Antworten“), in „Für dich“ und als Zahl an der Termine-Kachel. KC-CLUB-HERBST-PILZE: im Herbst wachsen unten Fliegenpilze, Steinpilze und kleine Braune; der Laubbläser wirbelt sie davon. Server 2.389.0.

## 2.387.0 – 2026-10-14 – ⭐ Favoriten bei den Nachrichten
KC-CLUB-CHAT-FAVORITEN (Wunsch Hansi): Oben bei den Nachrichten „⭐ Favoriten“ – zeigt die mit ⭐ markierten Chats (zuerst) und automatisch die 5 Chats mit den meisten Nachrichten („· oft“). Chat einmal antippen → „⭐ Als Favorit“ / „☆ Kein Favorit mehr“. Die Sternchen gelten auf allen Geräten (Einstellung chat_favoriten, Server 2.387.0).

## 2.386.0 – 2026-10-14 – Eselsohr mit runder Spitze, „Alle“ beim Benachrichtigen
KC-CLUB-ESELSOHR-RUND (Hinweis Hansi): Die umgeklappte Spitze des Eselsohrs ist jetzt rund wie die Ecke des Kopfes (auch beim Aufblinken). KC-CLUB-ZUSTELL-ALLE (Wunsch Hansi): Neue Taste „✅ Alle“ bei „Benachrichtigen“ markiert Push, E-Mail und WhatsApp auf einmal; nochmal tippen nimmt alle drei weg.

## 2.385.0 – 2026-10-14 – Express: angekommen um / gelesen um
KC-CLUB-EXPRESS-ZUSTELLUNG (Wunsch Hansi): Nach dem Senden „🏎️ Nachricht wurde per Express versandt“. Unter der eigenen Express-Sendung je Empfänger „📬 angekommen um … Uhr“ (früheste Rückmeldung: Push auf dem Handy angezeigt, in der App angekommen oder gelesen) und „👁 gelesen um … Uhr“ (Chat geöffnet; die Vorschau zählt nicht). Uhrzeiten nur aus echten Rückmeldungen. Server 2.385.0, neue Tabelle kc_club_express_zustellung (nur Server).

## 2.383.0 – 2026-10-14 – Online-Ansage nicht verspätet nachholen
KC-CLUB-ONLINE-ANSAGE-NICHT-NACHTRAEGLICH (Fund Hansi „Ansage kommt sehr spät, der Push schneller“): War die App beim Online-Push nicht zu sehen, zeigt das Handy die Mitteilung – die App holte die Ansage beim Zurückkommen bis 3 Min. später nach. Wer schon per Mitteilung gemeldet wurde, wird auf diesem Gerät nicht noch einmal angesagt. Bei offener App bleibt die Ansage sofort.

## 2.381.0 – 2026-10-14 – 🎙️ KC-CLUB-KNOEPFE-PLATZ: Mikrofon der Sprachsteuerung ausgemessen
Anlass (Hansi): „Du musst auch das Mikrofon für die Sprachsteuerung ausmessen, damit es nicht zu sehr stört.“
- Handy/Tablet hoch: 🎙️ jetzt 44 px wie 👆 ? 🔍 (vorher 56 px, ragte höher) und in derselben Reihe über der Fußleiste, links.
- PC: 48 px, mittig auf Höhe der Fußleiste links daneben. Gemessen 320 bis 1920 px Breite: nichts überlappt.

## 2.380.0 – 2026-10-14 – 👆 ❓ 🔍 KC-CLUB-KNOEPFE-PLATZ: schwebende Knöpfe neu ausgemessen
Anlass (Hansi, Bildschirmfoto PC): „Die 3 Knöpfe Lupe, Zeiger usw. sind nicht gut angeordnet – neu ausmessen, dass sie nicht im Weg stehen, bei kleinem Handy
und Tablet auch.“ – Am PC ist der Inhalt breiter als die Fußleiste (höchstens 760 px); die Knöpfe hingen an einer 744-px-Spalte und standen mitten auf den Kacheln.
Gemessen bei 320×568, 375×667, 412×915, 768×1024, 1024×768, 1080×720, 1200×700, 1366×768, 1920×1080:
- Handy und Tablet hoch: 👆 ? 🔍 in einer Reihe direkt über der Fußleiste rechts (vorher zwei Reihen) – halb so viel verdeckt; der Abstand unten (150 px) reicht.
- 1024–1099 px: ? und 🔍 rechts neben der Fußleiste, 👆 links daneben (🎙️ Sprachsteuerung ganz links) – alle auf Höhe der Fußleiste, nichts über dem Inhalt.
- ab 1100 px: 👆 ? 🔍 zusammen rechts neben der Fußleiste, 🎙️ links neben ihr.

## 2.379.0 – 2026-10-14 – 🧚 KC-CLUB-FEE: abschaltbar per Häkchen
Anlass (Hansi): „Bau ein, dass sich die Fee abschalten lässt – mit Klickkästchen, und schreiben: bei jedem 20. Start kommt die Fee und beim Antippen gibt sie dir einen Spruch.“
- ⚙️ → ✨ Effekte → „🧚 Die kleine Fee“: Häkchen (je Gerät, Standard an) und Text „Bei jedem 20. Start kommt die Fee – und beim Antippen gibt sie dir einen
  Spruch. Aus: sie kommt nicht mehr.“; „🧚 Fee ansehen“ bleibt darunter und geht auch, wenn sie aus ist.
- `feeKommt` kommt ohne Häkchen nicht mehr von selbst; die Einstellungs-Suche findet „Fee“; Hilfe-Tipp nennt das Abschalten.

## 2.378.0 – 2026-10-14 – 🧚 KC-CLUB-FEE: Zauberstab macht eine Rundbewegung
Anlass (Hansi): „Beim Schwenken des Zauberstabs muss sie eine Rundbewegung machen, jetzt wedelt sie nur rechts–links.“
- `feeWedeln`: Hand und Stab beschreiben einen ganzen Kreis (1,2 s, 16 Stützpunkte); der Stern zieht dabei einen Glitzerkreis, der kurz stehen bleibt.
- Erst wenn der Kreis geschlossen ist, wirbelt der Zauberschnee los; die Fee bleibt dafür ~0,6 s länger stehen.

## 2.377.0 – 2026-10-14 – 🧚 KC-CLUB-FEE: Beinhaltung im Flug wie klassische Feen
Anlass (Hansi): „Beim Fliegen ist die Beinstellung noch nicht gut – schau dir an, wie Feen fliegen.“ – Vorher zeigte ein Knie nach vorn (wirkte wie Laufen).
Jetzt wie bei klassischen Feen-Bildern: beide Beine ziehen hinter dem Körper her, das hintere lang nach hinten unten gestreckt mit gestreckter Fußspitze,
das vordere im Knie gebeugt, der Unterschenkel schwingt hinten hoch (Ballett-„Attitude“). Ballettschuhe mit Bändern bleiben.

## 2.376.0 – 2026-10-14 – 🧚 KC-CLUB-FEE: von rechts, Vorderansicht, Zauberschnee, wechselnde Flugbahnen
Anlass (Hansi): „Lass sie von der anderen Seite einfliegen; wenn sie vor einem steht, muss die Front zu sehen sein – ein Bein gestreckt, eins leicht im Knie
gebeugt. Sie wedelt einmal mit dem Zauberstab, dann fliegt der Zauberschnee wild umher, dann fliegt sie weiter. Jedes Mal eine andere Flugbahn.“
- Fliegt von rechts nach links (Seitenansicht gespiegelt). Beim Stehenbleiben dreht sie sich um (kurzes Drehen) und zeigt sich von vorn
  (`FEE_VORN_SVG`: symmetrische Flügel, Gesicht von vorn, linkes Bein gestreckt mit gestrecktem Fuß, rechtes Bein im Knie gebeugt, Fuß dahinter).
- Lächelt, wedelt einmal mit dem Stab (`feeWedeln`), dann wirbeln 64 Flocken und Funken wild durchs Startbild und rieseln aus (`feeZauberschnee`);
  danach dreht sie sich zurück und fliegt weiter.
- `feeBahn()`: Einflug welle/bogen/looping/sturz × Abflug welle/steil/bogen/sturz, Haltepunkt, Höhe, Wellenhöhe und -takt zufällig; dieselbe Kombination
  nie zweimal hintereinander (gemerkt im Gerät). Glitzerspur kommt immer aus dem Stern des Stabs.

## 2.375.0 – 2026-10-14 – 🧚 KC-CLUB-FEE: Gesicht, Beine und Füße neu gezeichnet
Anlass (Hansi): „Gesicht nicht gut, Beine und Füße nicht gut – der Rest kann so bleiben.“
- Gesicht: ovale Dreiviertel-Form mit Kinn und Wangenschatten, mandelförmige Augen mit Lidstrich, Wimpern, Lidfalte und glänzender Iris, feine Nase,
  geformte Ober- und Unterlippe mit leichtem Lächeln (lacht beim Stehenbleiben mit Zähnen), seitlicher Pony.
- Beine: geformt mit Oberschenkel, Knie, Wade und schmalem Knöchel statt gleich dicker Striche; Füße gestreckt in rosé Ballettschuhen mit gekreuzten Bändern.

## 2.374.0 – 2026-10-14 – 🧚 KC-CLUB-FEE: neue, erwachsene Fee
Anlass (Hansi, mit Beispielbildern): „Nein, die Fee ist zu kindlich.“ – Neu gezeichnet (eigene Zeichnung, keine fremden Bilder): schlanke, erwachsene Fee
im eleganten Flug (leicht nach vorn geneigt, ein Knie angewinkelt), lange wehende blonde Haare, Augen mit Wimpern, Lippen, rosé Korsage und mehrlagiger
Tüllrock mit feinem Glitzer, schimmernde Libellenflügel (rosé–flieder–mint), Zauberstab mit Sternenspur. Beim Stehenbleiben lächelt sie, der Stern leuchtet auf.

## 2.373.0 – 2026-10-14 – 🧚 KC-CLUB-FEE: eigene Zeile „Die kleine Fee“ unter ⚙️ → ✨ Effekte
Anlass (Hansi): „Unter Darstellung finde ich sie nicht.“ – Der Vorschau-Knopf stand versteckt in der Sende-Effekt-Zeile. Jetzt eigene Zeile direkt unter
„✨ Animierte Knöpfe“ mit Erklärung und „🧚 Fee ansehen“; Hilfe-Tipp nennt den richtigen Weg.

## 2.372.0 – 2026-10-14 – 🧚 KC-CLUB-FEE: kleine Fee bei jeder 20. Anmeldung (Server 2.372.0)
Anlass (Hansi): „Bei jeder 20. Anmeldung soll eine ganz süße Fee durchs obere Bild schweben, einmal kurz stehen bleiben, lächeln und weiterfliegen.
Leicht rosé Glitzersachen, Zauberstab in der Hand. Wer drauf tippt, bekommt einen motivierenden Spruch.“
- Server zählt in `start_melden` je Mitglied über alle Geräte (`kc_club_person_einstellung` „fee_zaehler“; Starts im Hintergrund zählen nicht) und meldet `fee: true` bei jeder 20.
- Die Fee (SVG: rosé Glitzerkleid, flatternde Flügel, Krönchen, Zauberstab mit Stern) schwebt in Wellen von links bis zur Mitte des Startbilds, bleibt ~3 s stehen,
  lächelt und schwingt den Stab, fliegt rechts hinaus; Glitzerstaub hinterher. Nur wenn Animationen an sind und die Startseite sichtbar ist (wartet sonst bis 2 Min.).
- Antippen: Funkenregen und ein Fenster mit einem von 40 Mut-Sprüchen. Vorschau: ⚙️ → 🎨 Darstellung → „🧚 Fee ansehen“. Neuer Hilfe-Tipp.
- Test-Nachtrag: die versehentlich überschriebene Prüfung „Serverversion erhöht“ (2.301.0-Block) wiederhergestellt.

## 2.371.0 – 2026-10-14 – 🐕 KC-CLUB-HERBST-HUND: streunender Hund im Herbstbild
Anlass (Hansi): „Lass in der Herbst-Animation ab und an einen streunenden Hund mit wedelndem Schwanz durchs Bild laufen. Ca. in der Mitte bleibt er stehen,
schnuppert ein bisschen rum und läuft dann weiter.“
- Etwa alle 1½–4 Min. (erstes Mal nach ½–1 Min.; Vorschau-Extra „hund“: nach 3 s) trottet ein struppiger Streuner (braun, dunkler Fleck, Schlappohr) von einer
  Seite herein, bleibt um die Mitte stehen, senkt die Nase ins Laub (Blätter rascheln, Schnupper-Wölkchen), hebt kurz den Kopf, macht zwei Schritte, schnuppert
  weiter und trottet hinaus. Schwanz wedelt immer, beim Schnuppern schneller. Kommt nie mitten durch den Laubbläser.
- Kostet nichts extra: läuft im vorhandenen Kopfbild (steht nach 3 Min. ohne Bedienung still wie alles andere).
- Update-Hinweis für Mitglieder: nur „Kleine Systemanpassung“.

## 2.370.0 – 2026-10-14 – 🔥 KC-CLUB-BUEHNE-POWERKETTE: neue Übung auf der Bühne – die Power-Kette
Anlass (Hansi): „Eine neue Übung für Twinkey auf der Bühne: im Stehen abwechselnd Knie hoch rechts, Knie hoch links, einen Schritt nach links,
einen Schritt nach rechts, einmal in die Kniebeuge mit Armen nach vorn, einmal Hula-Hoop, einen Sprung in die Luft – und wieder von vorn.
Mit markigen Sprüchen, in 3 Durchgängen und immer schön loben.“
- Bühne → neue Auswahl „🔥 Power-Kette“ (neben Im Sitzen / Im Stehen / Küchenhelfer). Feste 3 Durchgänge statt Minuten-Wahl, ca. 4 Min.
- Je Bewegung 4 Schläge (2 s bei 120 Schlägen/Min.), eine Kette 14 s, ein Durchgang 4 Ketten (56 s), dazwischen 15 s verschnaufen und ausschütteln.
  Oben steht immer die aktuelle Bewegung („Bewegung 3 von 7“) – auch ohne Ton lesbar.
- Twinkey turnt spiegelbildlich vor wie ein Vorturner („rechts“ ist auf deiner rechten Seite). Neue Bewegungen: Knie hoch rechts/links mit
  Armschwung, Seitschritt links/rechts, Kniebeuge mit Armen nach vorn, Sprung mit Armen über dem Kopf; Hula-Hüfte und Beinarbeit der Kniebeuge
  nutzen die vorhandenen Bewegungen.
- Ansagen: zu jeder Bewegung ein markiges Kommando („Rechtes Knie hoch – zack!“, „Und hoch in die Luft – hopp!“), je Kette Lob („Toll gemacht!“,
  „Super Einsatz von dir!“, „Ja, so geht’s gut – weiter so!“, „Weiter so, auch wenn’s brennt in den Beinen!“, „Jetzt nicht nachlassen!“) oder ein
  markiger Spruch; je Durchgang eigene An- und Absage („Na komm – eine Runde geht noch!“, „Letzter Durchgang – jetzt nicht nachlassen!“).
- Bisherige Übungen unverändert (30 s Übung, 6 s Ausschütteln); die Uhr „noch“ rechnet jetzt mit der Dauer jeder Übung.
- Update-Hinweis für Mitglieder: nur „Kleine Systemanpassung“.

## Server 2.369.0 – 2026-10-14 – 🔐 KC-CLUB-FRA-VERSCHLUESSELT: Frankfurt-Sicherung und Archiv-Kopie nur noch verschlüsselt
Anlass (Hansi, nach der Backup-Prüfung): „Ja alles sicher machen“. Befund: Die Dateien in Neon Frankfurt (Fach kc-archiv) waren nur gepackt,
nicht verschlüsselt, und enthielten alle Spalten aller Tabellen – auch Geheimnis-Tabellen und Spalten, die der Neon-Spiegel schwärzt.
- Datenbank-Teile: gepackt und mit AES-256-GCM verschlüsselt (Format KCE1, Datei *.json.gz.enc). Schlüssel = Vault kc_db_backup_key_v1, gleiche
  Ableitung wie die Neon-Sicherung – die vorhandene Notfall-Kopie (Cloudflare-Tresor / GitHub-Secret KC_BACKUP_KEY) öffnet auch diese Dateien.
  Fehlt der Schlüssel, wird nichts hochgeladen (nie Klartext). Rücklese-Test: Prüfsumme + Entschlüsseln (prüft Echtheit) + Entpacken + Zeilenzahl.
- Tabellen mit Einstufung „secret“ im Spiegel-Register kommen nicht mehr mit; Spalten aus kc_db_mirror_redaction werden wie im Spiegel geleert
  bzw. ersetzt. Personendaten bleiben (verschlüsselt) enthalten – die Frankfurt-Sicherung bleibt eine Komplett-Sicherung zum Wiederherstellen.
- Archiv-Kopie (archiv/…): Dateien verschlüsselt (*.enc); die bisherigen Klartext-Kopien werden in den nächsten Nachtläufen verschlüsselt neu
  abgelegt und die alten Dateien entfernt. PDF-Handbücher (dokumente/…) bleiben unverändert – sie sind ohnehin öffentlich.
- Alte Klartext-Dateien der Tagesstände werden gelöscht, sobald der erste verschlüsselte Lauf ohne Fehler geprüft ist.
- Inhaltsverzeichnis (manifest.json) nennt Verschlüsselung, ausgeschlossene Tabellen und geschwärzte Spalten (keine Inhalte).
- Neu: tools/notfall/fra-entschluesseln.mjs (öffnet eine Datei ohne Supabase), Test tests/fra-verschluesselung.test.mjs.
  Nur Server – kein App-Download für die Mitglieder.
## 2.368.0 – 2026-10-14 – 🔕 KC-CLUB-FP-RESIZE: „ResizeObserver loop“ ist kein schwerwiegender Fehler
Anlass (Hansi, Screenshot 08:08): Alarm-Push „🔴 2 schwerwiegende Probleme in der Club-App – ohne Anmeldung: ResizeObserver loop completed with undelivered notifications“.
- Befund: 2× heute 07:45 (Android, 2.366.0), erstmals überhaupt; harmlose Browser-Warnung (Größenmeldung ein Bild später zugestellt). app.js filterte sie schon
  (AS_HARMLOS), der Start-Wächter in index.html schrieb sie aber als „skript“ mit → Server stufte „skript“ als schwer ein → Alarm-Push.
- Jetzt: Start-Wächter schreibt sie nicht mehr mit; Server stuft sie (auch von älteren App-Ständen) als Info ein; Chat-Abstand (ResizeObserver am Schreibfeld)
  wird erst im nächsten Bild gesetzt (requestAnimationFrame) → Warnung entsteht gar nicht erst.
- Update-Hinweis für Mitglieder: nur „Kleine Systemanpassung“.

## 2.367.0 – 2026-10-14 – ✔️ KC-CLUB-HAKEN-SCHNELL: Zustell-Haken kommen nach dem Senden zügig
Anlass (Hansi): „Habe gerade eine Express-Nachricht an Steven geschickt. Das hat lange gedauert, bis ich 2 graue Haken bekommen habe.“
- Gemessen: gesendet 07:46:14, Push raus 07:46:16, Mail 07:46:17, Stevens Handy „angezeigt“ 07:46:34 (20 s). Verzögerung lag bei der Anzeige beim
  Absender: bei stehender Leitung fragte der Chat nur alle 30–60 s nach (die Empfangsmeldung des Handys löst kein Signal an den Absender aus).
- Jetzt: nach dem eigenen Senden 60 s lang alle 4 s nachfragen, nur bei offenem, sichtbarem Chat und nur bis die letzte eigene Nachricht „angekommen“ ist
  (höchstens ~15 kleine Abfragen je gesendeter Nachricht).
- Update-Hinweis für Mitglieder: nur „Kleine Systemanpassung“.

## 2.366.0 – 2026-10-14 – 🌗 KC-CLUB-FELD-KONTRAST: Auswahl- und Eingabefelder im Dunkelmodus lesbar
Anlass (Hansi, Screenshot „Wege der Mitglieder“): „In der weißen Zeile kann man nix lesen. Kontrast anpassen.“
- Ursache: Felder ohne eigene Gestaltung erbten die helle Schrift (button, input, select, textarea { color: inherit }), behielten aber den weißen
  Standard-Hintergrund des Browsers. Betroffen: rund 60 Auswahlfelder ohne eigene Klasse, u. a. die Tagesauswahl in „Wege der Mitglieder“.
- Jetzt: :where(select, textarea, input[Text-Arten]) { background-color: var(--karte); color: var(--text); Rahmen var(--linie) } – schwächste Regel, gestaltete
  Felder bleiben unverändert; :root.dunkel { color-scheme: dark } (aufklappende Liste dunkel); Optionen in Schema-Farben.
- Update-Hinweis für Mitglieder: nur „Kleine Systemanpassung“.

## 2.365.0 – 2026-10-14 – 🔍 KC-CLUB-SCHRIFT-ZOOM-TEXT: Zwei-Finger-Zoom nur für Lese-Texte
Anlass (Hansi): „Das Zoomen sollte wirklich nur bei Text sein, nicht die komplette Oberfläche.“
- html bleibt bei var(--fs); --zoom wirkt per CSS „zoom“ nur auf .blase .txt, .blase .zitat, .uhk-msg, .zettel .ztext, .prl-text, .alarm-text, .dlg-text.
  Kopfzeile, Knöpfe, Schreibfeld-Leiste und untere Leiste bleiben gleich groß (Ausgleichsregeln der unteren Leiste aus 2.364.0 entfernt). Geste/Speicher/A−/A+ unverändert.
- Update-Hinweis für Mitglieder: nur „Kleine Systemanpassung“.

## Server 2.365.0 – 2026-10-14 – 👣 KC-CLUB-WEGE-KLAR: „Wege der Mitglieder“ benennt Chats eindeutig
Anlass (Hansi): „Wilfried hat sich heute Nachrichten angesehen, die an andere gegangen sind – er darf doch keine fremden Nachrichten ansehen.“
- Geprüft: alle 6 von Wilfried geöffneten Chats – er war überall Empfänger von Anfang an (4 Rundschreiben von Klaus an alle 18, 2 Chats mit Hansi).
  Der Server lässt nur Teilnehmer hinein (binTeilnehmer → „Unterhaltung nicht gefunden“), es wurde nichts Fremdes gezeigt.
- Ursache des Eindrucks: die Admin-Ansicht zeigte bei Chats ohne Betreff nur die ANDEREN Teilnehmer („Andrea, Annegret, … +11“).
- Jetzt: „📢 Rundschreiben von Klaus an alle (18 Personen, mit dabei)“, „💬 Zweier-Chat mit Hansi“, „👥 Gruppe … (mit dabei)“, „💬 Runde von … mit … (mit dabei)“.
  Nur Server – kein App-Download für die Mitglieder.

## 2.364.0 – 2026-10-14 – 🔍 Schrift-Zoom mit zwei Fingern + 🔋 Eco-Gesamtprüfung
Anlass (Hansi): „Check nochmal, dass alle Funktionen Eco sind, ohne Akku leer zu saugen.“
- Gemessen (Browser, alle 31 Ansichten, nach 4 Min. Ruhe, je 8 s): Rechenlast überall < 1 % (Start 0,82 %, Rest 0,04–0,65 %), 0 laufende Animationen,
  0 Bildwechsel/s; nach dem Rundgang zurück auf Start kein einziger zusätzlicher Zeitgeber (nichts „vergessen“).
- Aktive Funktionen geprüft: Live-Zeigen (Sender 400 ms, Zuschauer 800 ms – beide im Hintergrund still), Schach-Uhr, Quiz, Rückseiten-Uhr, Countdown-Kachel,
  Fitness-Timer, Musik/Karaoke, Anruf/Konferenz – enden mit der Funktion bzw. pausieren im Hintergrund. Neue Funktionen (⏰, ↩️, 🏎️, Boten, 🎩) ohne Dauer-Last.
- Einziger Fund: Mitschauen (ssHolen, 0,8–1,5 s) fragte auch im Hintergrund weiter → jetzt still im Hintergrund, beim Zurückkommen sofort frisch.
- 🔍 KC-CLUB-SCHRIFT-ZOOM (Wunsch Hansi „Texte und Nachrichten auf dem Handy zoomen“): Zwei-Finger-Geste (auseinander = größer, zusammen = kleiner, 70–200 %)
  ändert --zoom → html { font-size: calc(var(--fs) * var(--zoom)) } – die ganze App wächst mit (rem), kein seitliches Schieben, kein Seiten-Zoom (touchmove/gesture*
  verhindert). Fotos, Videos, Canvas, Spielbretter, Video-Rundgang und Zeiger-Fläche behalten ihre Gesten. Doppeltipp mit zwei Fingern = 100 %. Untere Leiste wächst
  höchstens +15 %. Gemerkt je Gerät (kc_club_schrift_zoom). ⚙️ → Darstellung (erweitert und einfach): „🔍 Schriftgröße“ mit A− / A+ / ↺ 100 %. Hilfe-Tipp.

## 2.363.0 – 2026-10-14 – 🎩 KC-CLUB-MUENCHHAUSEN: Baron Münchhausen als Bote
Anlass (Hansi): „Auch noch Baron Münchhausen als Bote der Nachricht dazu.“
- Neuer Sende-Effekt „🎩 Baron Münchhausen“ (Ritt auf der Kanonenkugel: Dreispitz, roter Rock, weiße Perücke, Brief in der Hand). Absender: „BUMM!“-Wölkchen am
  Senden-Knopf, dann im hohen Bogen nach links hinaus. Empfänger: kommt im Bogen von rechts oben, setzt über der Blase auf (Blase hüpft), fliegt links davon.
- Wählbar unter ⚙️ → 🎨 Darstellung → Senden, läuft bei „Abwechselnd“ mit; Server kennt die Art „muenchhausen“ (Einstellung sende_effekt).

## 2.362.0 – 2026-10-13 – ⏰ Später senden, ↩️ Zurückholen, 🏎️ Express-Sendung, 🚴 neue Boten
Anlass (Hansi): „Bau das zeitversetzte Senden ein – bedienerfreundlich, logisch, einfach … evtl. auch Wiederholungen, z. B. jeden Montag um 8.00 die gleiche Nachricht.“
- Bedienung: ⏰ neben ⏳ unter dem Schreibfeld → Fenster „Wann soll die Nachricht ankommen?“: 1. Wann? (🌇 Heute Abend 18:00 – nur bis 17:45,
  🌅 Morgen früh 8:00, ☀️ Morgen Mittag 12:00, 📅 Andere Zeit … mit Tag/Uhrzeit) · 2. Wie oft? (Nur einmal, Jeden Tag, Werktags, Jeden <Wochentag>,
  Jeden Monat am <Tag>.) · Zusammenfassung „Wird gesendet: morgen um 8:00 Uhr – danach jeden Mittwoch“ · ⏰ Planen.
- Im Chat: blasse, gestrichelte Blase unten (nur für den Absender) mit Zeit und Wiederholung; antippen → 📤 Jetzt senden (bei Wiederholung „einmal extra“),
  🕐 Zeit ändern, 🗑️ Löschen (Wiederholung beenden). Fehlschlag wird in der Blase angezeigt.
- Bewusst einfach: nur Text, nur in einem vorhandenen Chat, höchstens 31 Tage im Voraus, höchstens 25 offene je Person; Notfall-Meldungen nie planbar.
- Server: Tabelle kc_club_geplant (RLS an, nur service_role), Aktionen geplant_speichern/geplant_loeschen/geplant_jetzt, geplante Nachrichten des Chats in „unterhaltung“.
  pg_cron „kc-club-geplant-minute“ ruft „geplant_faellig“ nur, wenn etwas fällig ist. Senden über nachricht_senden im Namen des Absenders (Push/Mail, stumm,
  Selbstlöschen des Chats wie von Hand). Erst belegen (nächste Zeit bzw. fertig), dann senden → nie doppelt. Wiederholung rechnet ab der ersten Zeit in Berliner Zeit
  (wiederholungen(), Sommer-/Winterzeit geprüft: Mo 8:00 bleibt 8:00 über den 25.10.); verpasste Termine einmal nachholen, nie stapeln.
- Hilfe-Tipp „Nachricht später senden – auch jeden Montag“ und Station „⏰ Später senden“ im Chat-Erklärvideo.
- ↩️ KC-CLUB-ZURUECKHOLEN (Wunsch Hansi „Nachricht anklicken, rechte Maustaste oder über Info-Button zurückholen – solange nicht gelesen wieder im
  eigenen Fenster anzeigen, dort ändern und nochmals abschicken“): im Nachrichten-Menü (Antippen, NEU: rechte Maustaste am PC), im Pfeil-Menü und im ⓘ-Fenster.
  Nur eigene Textnachrichten ohne Anlage/Abstimmung/Kontakt/Notfall und nur, solange kein anderer Teilnehmer sie gelesen hat (Server prüft last_read_at;
  sonst „Zu spät – … schon gelesen“). Nachricht verschwindet für alle (Papierkorb-Sicherung wie Löschen), Realtime-Signal frischt offene Chats sofort auf;
  Text, ❗ und „Antwort auf“ kommen zurück ins Schreibfeld. Ehrlicher Hinweis: schon verschickte Push-Mitteilungen/E-Mails lassen sich nicht zurückholen.
- 🏎️ KC-CLUB-EXPRESS (Wunsch Hansi „per Rennwagen – Express-Sendung, sofort zugestellt, beim Empfänger ploppt ein Fenster auf: Öffnen, Später, Nein;
  Empfang bestätigen als Kästchen“; Hansis Wahl „durchbricht alles“): 🏎️-Knopf neben ❗ schaltet Express für die nächste Nachricht ein. Server: kc_club_express
  (+ _antwort), Push + Mail immer, auch stummgeschaltet (stumm.clear), auch für gerade in der App Aktive, auch in der Ruhezeit (sendenGewaehlt opt.notfall – ohne
  Änderung am Communicator), Wichtigkeit „hoch“, Titel „🏎️ EXPRESS – …“; höchstens 5 je Person/Tag. init liefert ungelesene Express-Sendungen (7 Tage, ohne
  „Nein“/laufendes „Später“) → Fenster mit Rennwagen: 📬 Öffnen / ⏰ Später (30 Min.) / ✖ Nein + ☑ Empfang bestätigen (vorab an) → Absender bekommt Push
  „📬 Express angekommen“ und sieht unter seiner Nachricht „📬 Empfang bestätigt: Klaus 10:42“. Blasen tragen „🏎️ EXPRESS“; Empfangs-Effekt = Rennwagen.
- 🚴 KC-CLUB-BOTEN: neue Sende-Effekte 🚴 Postbote mit Fahrrad (Posttasche, Klingel-Vibration), 🍾 Flaschenpost (schaukelt auf Wellen), 🚀 Rakete (Flamme),
  🎈 Luftballon (Brief an der Schnur) – unter ⚙️ → 🎨 Darstellung → Senden und in „Abwechselnd“; beim Empfänger je eigene Ankunft. Server kennt die neuen Arten.

## 2.361.0 – 2026-10-13 – 🔋 KC-CLUB-AKKU-6: Stromsauger Tonausgabe + Kopfbild steht in Ruhe
Anlass (Hansi, Akku-Übersicht: Chrome 25 % in einer Stunde): „Unsere App scheint das Handy-Akku leer zu saugen – finde die Stromsauger.“
- Fund 1 (Tonausgabe): Die gemeinsamen AudioContexts (audio für ton()/Ständchen/Spiele, QZ.ac, rkAudio, RGP.ctx) wurden nie angehalten – nach dem
  ersten Ton lief die Tonausgabe dauerhaft („running“, gemessen) → Audio-Chip/Mixer wach, kein Tiefschlaf, auch im Hintergrund.
  Jetzt: AudioContext wird zentral umhüllt; jede Tonausgabe schläft 3 s nach dem letzten geplanten Ton ein (suspend) und wacht beim nächsten
  start() von selbst auf. Ausgenommen: Kontexte mit Mikrofon/Medienstrom (Anruf, Sprachnachricht, Oszilloskop).
- Fund 2 (Kopfbild): Auch 6–12 Bilder/s halten Grafikchip und Bildschirm-Pipeline wach. Nach 3 Min. ohne Bedienung steht das Bild
  (JZB.steht), erste Bedienung startet es sofort. Gemessen: 2,03 % → 0,31 % Rechenlast. Ersetzt die 6-Bilder/s-Stufe aus 2.360.0.
- Geprüft und in Ordnung: keine dauerhaften CSS-Animationen in Ruhe (0 laufend), Standort teilen nur auf Wunsch mit Ablauf, Chat-Takt mit Leitung 60 s.

## 2.360.0 – 2026-10-13 – 🔋 KC-CLUB-AKKU-5: weniger Nachfragen und Malen in Ruhe
Anlass (Hansi): „Alles optimieren und stromsparend.“
- Pinnwand-Takt (pwLive, 45 s): bei stehender Leitung (RT.ok) höchstens alle 3 Min. – neue Zettel meldet die Leitung ohnehin sofort (rtSignal „pinnwand“ ruft pwLive ohne Bremse).
- Admin-Startseite (adLaden = 3 Abfragen): alle 3 statt jede Minute, nach 5 Min. ohne Bedienung gar nicht.
- Jahreszeiten-Kopf: nach 5 Min. ohne Bedienung 6 statt 12 Bilder/s (JZB_FPS_SCHLAF).
- rtLedZeigen (3 s), vbStatusLed (5 s), onlineLedZeigen/grOnlineAuffrischen (30 s): im Hintergrund kein Malen; beim Zurückkommen sofort frisch.
- Unverändert (bewusst): Lebenszeichen 60 s (System Check), Online-Ping 60 s mit Leitung, Hänger-Wächter 1 s (billig).

## 2.359.0 – 2026-10-13 – 🔋 KC-CLUB-AKKU-4: Gesamtprüfung Leistung/Akku – Hintergrund-Leitung und Neuladen sparsamer
Anlass (Hansi): „Prüfe alle Funktionen unserer App, ob da was optimiert werden muss.“
Geprüft: Rechenzeit je Bereich in Ruhe (Browser): Start 2,5 %, alle anderen < 1 % · laufende Zeitgeber (21 in Ruhe, alle im Sekunden- bis Minutentakt, billig) · Server-Anfragen in Ruhe (online, spur, nutzung – gering) ·
Start der Seite bei 4-fach gedrosselter CPU ≈ 0,9 s · Datenbank (pg_stat_statements: teuerste Abfrage im Mittel 23 ms; Advisor-Hinweise betreffen nur sehr große Datenmengen) · Startzeit im Feld: Server-„init“ heute ≈ 2,1 s statt 1,5 s – sehr wahrscheinlich Kaltstarts der Edge Function nach vielen Server-Updates an einem Tag.
- Fund 1: Die Realtime-Leitung (WebSocket) blieb im Hintergrund offen, Herzschlag alle 25 s → weckt das Funkmodul. Jetzt: nach 60 s im Hintergrund rtTrennen(); beim Zurückkommen baut die vorhandene visibilitychange-Regel sie sofort wieder auf (und lädt frisch).
- Fund 2: neuLaden() (komplettes init) jede Minute, auch wenn die Leitung steht und Neues ohnehin sofort meldet. Jetzt: bei stehender Leitung höchstens alle 3 Min.
- Empfehlung: Server- und App-Updates bündeln (ein Update am Tag) – jedes Update lädt 3,7 MB neu und startet den Server kalt.

## 2.358.0 – 2026-10-13 – 🔋 KC-CLUB-AKKU-3: pausiertes Video und Jahreszeit-Vorschau sparen Akku
Anlass (Hansi): „In kurzer Zeit 30 % Akku verloren. Liegt das an unserer App?“
- Befund 1: Während eines Erklär-Videos hielt die App den Bildschirm wach (Wake Lock) – auch in der Pause (⏸, Stimmen-Auswahl, Verweis-Frage). Ein offen gelassenes, pausiertes Video ließ den Bildschirm nie ausgehen. Jetzt: nach 30 s Pause wird der Wake Lock freigegeben (beim Weiterspielen wieder geholt), nach 10 Min Pause endet das Video still.
- Befund 2: Eine Jahreszeit-Vorschau (z. B. Nikolaus, Herbst) malte dauerhaft mit 30 Bildern/s, die Ruhe-Bildrate griff nicht. Jetzt volle Rate nur 2 Min nach dem Start, danach wie sonst; nach 15 Min endet die Vorschau still (ohne Ansichtswechsel). Messung (Browser, Startseite in Ruhe): ohne Vorschau ≈ 2 % CPU, Vorschau frisch ≈ 5 %, nach 2 Min ≈ 3 %.
- Hilfe „Akku sparen mit der Club-App“ ergänzt.

## DB/Spiegel – 2026-10-13 (ohne App-Build) – 🛡️ KC-CORE-BACKUP-NEUE-TABELLEN: neue Tabellen erst nach dem ersten Spiegellauf sichern
Anlass: System Check ROT um 11:42 – Restore-Lesetest scheiterte an der neuen Tabelle kc_club_video_stimmen („type … does not exist“): im Backup schon enthalten, im Neon-Spiegel erst nach dem nächsten regulären Spiegellauf. Keine Daten fehlten; nach dem Spiegellauf neu geprüft: 250/250 ok. Hansi: „Ja, bau das ein“.
- kc_db_backup_daily(): eine Tabelle wird nur dann zurückgestellt, wenn ihre Regel in den letzten 24 h angelegt/geändert wurde UND sie in 2 Tagen noch keinen erfolgreichen Spiegellauf hatte. Bestehende Tabellen werden immer gesichert. Zurückgestellte stehen im Audit (backup_table_deferred) und im Dispatch-Eintrag (deferred).
- Vorab geprüft: heute 250 gesichert, 0 zurückgestellt (wie bisher). Migration 20261013_kc_core_backup_neue_tabellen_nach_spiegel.sql.

## 2.357.0 – 2026-10-13 – 🐌 KC-CLUB-SCHNECKE-RICHTUNG
Anlass (Hansi): „Bei mir laufen die Schnecken gerade auf dem PC von rechts nach links, allerdings gucken die Schnecken in die falsche Richtung.“
- Ursache: das Zeichen 🐌 sieht je Gerät anders aus – Apple, Android und Linux (Noto) schauen nach links, Windows (Segoe UI Emoji) nach rechts. Die Schnecken kriechen nach links.
- Unter Windows bekommt :root die Klasse schnecke-spiegeln → .schnecke i { transform: scaleX(-1) } (das Kriechen nutzt die eigene scale-Eigenschaft und bleibt). Zum Prüfen: localStorage kc_club_schnecke_spiegeln = "1"/"0".

## 2.356.0 – 2026-10-13 – ❄️🍂 KC-CLUB-NAME-WEG: Schneeraupe und Laubbläser räumen den Namen weg
Anlass (Hansi): „Ich habe doppelt meinen Namen Hansi aus Blättern und aus Eis. Wenn ich eine Sache beende, muss der Name auch weg sein. Ändere das Konzept: der Name soll weg sein, wenn die Schneeraupe ihn wegschiebt – dann zerspringt der Name in Stücke. Beim Herbstlaub soll das der Laubbläser sein – dann werden die Blätter aufgewirbelt.“
- Ursache „doppelt“: der Eis-Name wurde beim Wechsel der Vorschau (Winter → Herbst) nie gelöscht und ohne Jahreszeit-Prüfung gemalt. Jetzt: nur im Winter, und jahreszeitVorschau() räumt Eis- und Nuss-Namen bei jedem Wechsel/Ende.
- Winter: Schmelzen durch die Sonne entfällt. Ist der Name fertig (75 s, Vorschau 15 s), kommt die Schneeraupe bald; ihr Schild lässt jeden Buchstaben in Eis-Scherben (neue fx „scherbe“) und Schnee zerspringen. Während die Raupe fährt, fällt kein neues Eisstück.
- Herbst: das Eichhörnchen holt die Nüsse nicht mehr zurück; ist der Name fertig, kommt der Laubbläser und wirbelt jeden Buchstaben als Blätter und Nüsse (neue fx „nuss“) auf. Danach baut das Eichhörnchen den Namen neu.
- Hilfe „Wer kommt im Kopf zu Besuch?“ und Video-Text angepasst.

## 2.355.0 – 2026-10-13 – 🔲 KC-CLUB-KACHEL-ZULETZT · 🧑‍🍳 KC-CLUB-KOCH-EMOJI · 👁 KC-CLUB-VORSCHAU-ENDE
Anlass (Hansi): „Die letzte gewählte Kachel soll einen leichten Rand haben und minimal vergrößern, bis eine andere gewählt wird – auch in einfacher Ansicht. In der PC-Version sieht Twinkey beim Fegen der Blätter anders aus: laufende Beine, ein Gesicht daneben und eine Pfanne mit Spiegelei … so sieht auch die Kachel ‚Mein Bild‘ aus. Und wenn ich in den Einstellungen z. B. Nikolaus-Stiefel wähle, wie bekomme ich ihn wieder weg?“
- Kachel zuletzt: Tipp auf eine Kachel merkt ihre id (localStorage kc_club_kachel_zuletzt, je Gerät); kachelnZeigen markiert sie (.zuletzt: Ring in Weinrot, scale 1.025). Nicht beim Anordnen und nicht im Erklär-Video.
- Koch-Emoji: 🧑‍🍳 ist ein ZWJ-Emoji (🧑 + 🍳); ältere Windows-PCs/Browser malen beide Teile nebeneinander. Beim Start Breitenmessung im Canvas; fällt sie durch, ersetzt ein MutationObserver 🧑‍🍳/👨‍🍳/👩‍🍳 in Texten durch Twemoji-Bilder (lib/emoji/, CC BY 4.0) – nicht in Eingabefeldern/Auswahllisten – und Twinkey im Kopf wird als Bild gemalt. Zum Testen erzwingbar mit localStorage kc_club_koch_bild = "1".
- Vorschau-Ende: solange JZB.vorschau/extra gesetzt ist, steht auf der Startseite „👁 Vorschau: … · ✕ beenden“ (nur dort, nicht im Video); Chip in den Einstellungen heißt „📅 Heute (Vorschau beenden)“. Hilfe ergänzt.

## 2.354.0 – 2026-10-13 – 🔍 KC-CLUB-VIDEO-STIMMEN-SUCHE: Stimmen des Geräts selbst suchen und anzeigen
Anlass (Hansi): „Wenn keine gewählt wird, erst mal die im Handy, Tablet oder PC vorhandene … kannst du eine Suchfunktion beim ersten Aufruf einschalten, die die vorhandenen Stimmen des jeweiligen Geräts selber sucht und mit anzeigt.“
- rgsSuchen(): weckt die Sprachausgabe mit einem stummen Satz (Chrome/Android meldet Stimmen sonst erst nach dem ersten Sprechen), fragt bis zu 6 s nach, bis die Liste stabil ist; zeigt „🔍 Ich suche …“, dann „N gefunden, davon M mit guter Qualität“ bzw. „keine gefunden“ – mit „🔍 Nochmal suchen“. Läuft bei jedem Öffnen der Auswahl (beim ersten Video automatisch).
- Reihenfolge: zuerst „📱 Stimmen auf deinem Handy/iPhone/PC“ (Standard, ohne Auswahl die beste davon), darunter „⬇️ Oder eine bessere Stimme herunterladen“ (Thorsten, Dii).

## 2.353.0 – 2026-10-13 – 🗣️ KC-CLUB-VIDEO-STIMMEN-AUSWAHL: nur noch Thorsten und Dii
Anlass (Hansi): „Die einzige Stimme ist Thorsten, die brauchbar ist, die anderen sind schrecklich, stottern … suche bessere raus.“ – 9 Kandidaten (Thorsten HD/Hörbuch/ruhig/fröhlich, Dii, Miro, Pavoque, Jarvis, 40 MLS-Sprecher) erzeugt, per Spracherkennung vorgeprüft und als Hörproben geschickt; Wahl Hansi: „Thorsten und Dii, die anderen weg“.
- Kerstin, Eva, Ramona, Karlsson entfernt (Dateien, Hörproben, Grundliste; in kc_club_video_stimmen aktiv = false). Neu: Dii (Frau, OpenVoiceOS, CC BY-NC-ND 4.0 – nicht-gewerblich, unverändert, Namensnennung; stimmen/LIZENZEN.txt).
- Wer eine alte Stimme gewählt hatte, bekommt automatisch Thorsten (RGP_ALT); alte Stimm-Dateien werden beim nächsten Öffnen der Auswahl vom Gerät geräumt; die 7 Tage gemerkte Tabelle zeigt sie nicht mehr an.
- Dii im Browser-Arbeiter geprüft (spricht, Spracherkennung versteht den Text). Migration 20261013_kc_club_v2353_video_stimmen_auswahl.sql.

## 2.352.0 – 2026-10-13 – 🔒 KC-CLUB-GERAETE-ABMELDEN + 📦 KC-CORE-NOTFALL-ZWEITKOPIE: Handy verloren? Andere Geräte abmelden · zweite Sicherungskopie getrennt von Neon
Wunsch Hansi (Lücken aus dem Sicherheits-Abgleich schließen, „aber nicht zu kompliziert“). (1) Handy verloren oder gestohlen: unter ⚙️ → 🔒 Privatsphäre neuer Knopf „🔒 Alle anderen Geräte abmelden“ – dieses Gerät bekommt einen neuen persönlichen Schlüssel, der alte gilt sofort nirgends mehr; offene Kurzcodes und vorgemerkte Mail-Links verfallen; andere Geräte bekommen keine Benachrichtigungen mehr. Wieder anmelden dort mit „🔢 Code für ein anderes Gerät“ oder neuem Link. Neue Hilfe „Handy verloren oder gestohlen – was tun?“. Admin: „neuer Link“ sagt jetzt dazu, dass der alte auf allen Geräten ungültig wird (richtig bei verlorenem Handy). (2) Zweitkopie: GitHub-Ablauf „Notfall – Zweitkopie“ legt montags die neueste VERSCHLÜSSELTE Tagessicherung zusätzlich bei Cloudflare ab (KV kc-notfall-zweitkopie, kostenlos, 5 Wochen), liest sie zurück, prüft Prüfsumme und entschlüsselt eine Tabelle – mit dem Neon-Passwort kommt man an diese Kopie nicht heran (Neon-Schnappschüsse gibt es im kostenlosen Tarif nicht). Admin → 🧯 Notfall: Lämpchen „📦 Zweitkopie (Cloudflare)“. (3) Auftrag an Codex für die Funde in Kasse/DP2/Backup-Worker: docs/CODEX_AUFTRAG_SICHERHEIT_2026-10-13.md.

## 2.351.0 – 2026-10-13 – 🎬 KC-CLUB-VIDEOS-NEU + 🗣️ KC-CLUB-VIDEO-STIMMEN (+ -DOWNLOAD): 11 neue Erklär-Videos, Stimmen-Auswahl, Download-Stimmen
Anlass (Hansi): „Checke die ganze App, ob wir für alle Themen Videos haben … Ja, mach alle so wie vorgeschlagen, logisch aufgebaut und gut erklärt. Am Anfang verschiedene Stimmen anbieten … in sb eine Tabelle mit Stimmen hinterlegen, die man bei Bedarf nachladen kann … User sucht sich eine aus und klickt sie an, du holst sie aus der DB und installierst sie je nach Browser.“
- 11 neue Videos (je Station Ziel sichtbar, genannte Knöpfe pulsieren, nichts wird gespeichert oder gesendet; im Browser Station für Station geprüft):
  push (Benachrichtigungen), privat (Privatsphäre & Handy weitergeben), probleme (Wenn etwas nicht klappt), chatprofi (Chat für Fortgeschrittene, Beispiel-Chat nur auf dem Bildschirm),
  gruppen, terminfinden (Terminanfrage, Vorbehalt, Terminfindung, Reihen), todo, einfach (die einfache Ansicht – nur vorgeführt, nicht gespeichert), raetsel, buehne, buero (nur Clubleitung).
- Dienst-Video: Fertig ist Pflicht, leerer Wunschbogen; Mitglieder-Video: Wer ist online, Anwesenheitstafel, Geburtstage/Gratulieren (rgMitErg).
- Hilfe-Karten zeigen „🎬 Video: …“, wenn es zum Thema ein Video gibt (TW_VIDEOS, 66 + neue Verknüpfungen); Twinkey ebenso.
- Stimmen-Auswahl (🗣️ im Video, in der Video-Liste, beim ersten Video): Gerätestimmen nach Güte sortiert (Erkennung über Tabelle kc_club_video_stimmen, Aktion „stimmen“, 7 Tage gemerkt), Hörprobe, Tempo, Anleitungen für bessere Gerätestimmen je Plattform.
- Download-Stimmen (Piper, freie Stimmen): stimmen/piper-worker.js rechnet im Browser (ONNX Runtime Web 1.18 + Piper-Phonemize/eSpeak, Dateien unter stimmen/, GitHub Pages); Tabelle art „download“ sagt, welche angeboten werden. Antippen lädt die Stimme mit Fortschritt in den Browser-Speicher (Cache „kc-stimmen-v1“, persist), danach auch ohne Netz. Hörprobe vorher (stimmen/proben/*.mp3), 🗑️ entfernt. Satz für Satz gerechnet, der nächste während der vorige läuft. Lizenzen: stimmen/LIZENZEN.txt. Der Service Worker merkt stimmen/ nicht doppelt.
- Laut-Nummern immer aus der Laut-Tabelle der jeweiligen Stimme (kleine Stimmen kennen weniger Laute); geprüft gegen das offizielle Piper und per Spracherkennung.
- Fund beim Gruppen-Video: ⋮-Fenster im Chat scrollt jetzt (max. 88 % Höhe). Fund beim Bühnen-Video: nach „Die Rückseite“ sind Lupe, ? und Mikrofon wieder da. Hilfetext Terminfindung: legt nur die Clubleitung an.
- Migration 20261013_kc_club_v2348_video_stimmen.sql (eigener Name – kc_club_stimmen ist die Tabelle der Abstimmungs-Stimmen und bleibt unberührt).

## 2.350.0 – 2026-10-13 – 🛡️ KC-SICHERHEIT-ABGLEICH: Sicherheitskonzept App + Datenbanken geprüft, Kleinigkeiten behoben
Wunsch Hansi (gesamtes Sicherheitskonzept abgleichen: Zugänge, Verschlüsselung, Spiegelung, Rücksicherung, Angriffe, Einwahlversuche, Manipulation, Geheimnisse, Admin-Zugriff). Geprüft: 280 Tabellen (alle mit Zeilenschutz), Rechte anon/angemeldet, 85 Server-Funktionen (Quelltext), Club-Server (Anmeldung, Admin-Rechte, Eingaben, XSS), 11 Repositories samt Verlauf auf Geheimnisse (keine gefunden), Tresor, Neon (unveränderliche Sicherung, Rollen). Sofort behoben: (1) DP2-Mail-Eingang (kc-dp-mail-inbound): der nie genutzte Brevo-Weg nahm ohne Prüfung gefälschte Mails an und konnte Pushes an alle Planer auslösen – jetzt nur mit Zugangsschlüssel (Quelle: Sire65/dienstplan, Zweig claude/sicherheit-mail-inbound); (2) zwei alte DP2-Pilot-Einstiege mit fest eingebautem Tester-Schlüssel stillgelegt (Pilot seit 29.08. beendet); (3) GitHub-Ausweise (Neustart-Wächter, Datenbank einspielen, Notfall-Übergabe, Notfall-Tresor) zusätzlich an die feste Repository- und Besitzer-Nummer gebunden; Notfall-Übergabe nur bei Hand-/Zeitplan-/Push-Lauf; (4) Trigger-Funktion kc_wm_umfrage_instant_notify nicht mehr über die Datenschnittstelle aufrufbar (Migration 20261013_kc_sicherheit_trigger_rechte). Club-App-Oberfläche unverändert.

## 2.349.0 – 2026-10-13 – 🩺 KC-CLUB-VERLAUF-FEHLALARM: kein falsches Rot im Verlauf
Fund Hansi (Screenshot Admin → 📈 Verlauf: ein rotes Kästchen, drei gelbe, rote Säulen). Geprüft in der Datenbank: Das Rot (07:30–08:00) war ein Fehlalarm – die Messung begann um 07:56 mitten im Kästchen, die Schnittstellen-Messung erst um 08:00. Die gelben Kästchen kamen von je einem einzigen fehlgeschlagenen Hintergrund-Aufruf unter rund 85 (zwei kurze Namensauflösungs-Zeitüberläufe beim Anbieter, ein 5-Sekunden-Zeitüberlauf zur vollen Stunde, einmal der bekannte Spiegel-Abbruch, den der Nachholer erledigt hat). Geändert: Kästchen mit Messbeginn ohne Schnittstellen-Messung = grau statt rot; gelb erst ab 2 % fehlgeschlagener Hintergrund-Aufrufe im Kästchen (vorher schon bei einem einzigen). Die roten Säulen zeigen weiterhin jeden einzelnen Fehler. Rot bleibt wie bisher bei fehlender Messung, fehlender Schnittstelle oder überwiegend fehlgeschlagenen Aufrufen.

## 2.348.0 – 2026-10-13 – 🔐 KC-CORE-NOTFALL-TRESOR: Schlüssel-Kopie automatisch – nichts mehr abtippen
Wunsch Hansi („nicht schon wieder überall manuell eintragen in Supabase und GitHub – kannst du das übernehmen?“). Die Kopie des Sicherungsschlüssels und der Neon-Verbindung kommt jetzt automatisch in einen Cloudflare-Tresor (Worker kc-notfall-tresor, kostenlos): GitHub-Ablauf „Notfall einrichten“ lädt kurz die Übergabe-Funktion kc-notfall-schluessel hoch (gibt nur diesem Ablauf etwas, geprüft über das GitHub-OIDC-Token), legt die Werte maskiert per wrangler secret put ab, löscht die Funktion immer wieder und prüft, dass Fremde 401 bekommen; läuft auch am 1. jedes Monats (Schlüsselwechsel). Die Wochenprobe holt die Kopie per OIDC aus dem Tresor (hilfsweise GitHub-Secrets). Admin → Notfall: „🔐 Schlüssel-Kopie (automatisch)“ mit Knopf „⚙️ Notfall einrichten“ statt der 4 Handschritte. Tresor-Test mit 13 Gegenproben (fremdes Repo/Zweig/Ablauf/Zielgruppe, abgelaufen, fremde Signatur, alg none …).

## 2.347.0 – 2026-10-13 – 🔐 KC-CORE-NOTFALL-LESEN: Admin → Notfall – Daten zurückholen, wenn Supabase ausfällt
Wunsch Hansi („in der Club-App unter Admin für den Notfall Werkzeuge hinterlegen“). Im Admin-Blatt „🧯 Notfall“ neuer Abschnitt „💾 Daten zurückholen, wenn Supabase ausfällt“: Lämpchen „🔐 Wochenprobe“ (Ergebnis des GitHub-Ablaufs „Notfall – Sicherung lesen“, öffentlich und ohne Schlüssel abgefragt, höchstens alle 30 Min.): grün nur bei erfolgreicher Probe ≤ 8 Tage, rot bei Fehler, grau bei nicht eingerichtet/nie gelaufen/veraltet/nicht abrufbar. „🧭 Was tun, wenn …“ (kurz weg → Notbetrieb; länger weg → Spiegel im Neon SQL-Editor lesen; verloren → Wiederherstellen nach notfall_JJJJMMTT), „🔐 Schlüssel-Kopie einrichten“ (Supabase-Tresor → GitHub-Secret, öffnet sich von selbst, solange die Kopie fehlt), Knöpfe „🧪 Probe jetzt starten“, „📖 Anleitung“, Direktsprünge in Neon und GitHub. Keine Schlüssel oder Eingabefelder in der App. Ablauf: Schritt „Einrichtung prüfen“ – ohne Secrets wird „Sicherung lesen“ übersprungen (grau statt grün).

## 2.346.0 – 2026-10-13 – 🎬 KC-CLUB-VIDEO-PASST + KC-CLUB-VIDEO-VERWEIS: Bild und Text der Erklär-Videos stimmen überein, Verweise auf eigene Videos
Anlass (Hansi): „Im zweiten Video stimmen die Bilder mit dem Text nicht überein. Die Stimme erklärt die 3 Felder im Kopfbereich, der ist aber durch die Jalousien zu … Im Text erklärst du von SOS, Foto, Termine, Nachrichten, aber zeigst im Bild die Kacheln aus Technik … Durchsuche alle Videos … Und Verweise in deinen Videos … möchtest du dir das Video jetzt direkt ansehen? Ja, nein, später, nicht mehr fragen.“
- `rgAutoSicht(s)` für jede Station: Liegt das Ziel im Kopf, wird der Kopf aufgerollt (und die Vorderseite gezeigt). Nennt eine Station Kacheln (`kacheln: [ids]` oder `rgKachel(...)` im Wähler), kommt das Register mit den meisten davon nach vorn. Ohne eigene Puls-Liste leuchten die genannten Kacheln nacheinander auf. Am Ende wird alles zurückgestellt.
- Stationen mit Kacheln: Rundgang „🔲 Die Kacheln“ und „✨ Und noch viel mehr“ (in der einfachen Ansicht mit eigenem Text); „Warum diese App?“: „🏠 Alles an einem Ort“ und „🧩 Einfacher und besser organisiert“.
- Alle Videos wurden Station für Station automatisch abgespielt: Ziel sichtbar, Kopf offen, genannte Kacheln zu sehen.
- Station `video: "id"` → nach dem Sprechen die Frage „Dazu gibt es ein eigenes Video … jetzt ansehen?“ mit ▶ Ja / Nein / ⏰ Später / 🔕 Nicht mehr fragen. Ja: das Video läuft, danach geht es an der nächsten Station weiter (`RG.fortsetzen`). Später: in der Video-Liste mit 📌 und angehakt; nach dem Ansehen nicht mehr gemerkt. Abschalten und wieder einschalten: unten in der Liste der Erklär-Videos. Je Video höchstens einmal pro Sitzung gefragt, nie zum laufenden oder schon eingereihten Video.
- Verweise u. a.: Kopf/Farben/Tag-Nacht → „🎨 Meine App nach meinem Geschmack“, Eselsohr → „📄 Die Rückseite“, Jahreszeiten-Bild → „✨ Effekte & Wetter“, Kacheln/Startseite → „🎨 Oberfläche nach Wunsch“, Mehr → „⚙️ Alle Einstellungen“, Nachrichten/Zusagen/Status/Dienst/Hilfe/Sprache → jeweiliges Video.
- Hilfe („Erklär-Videos mit Ton“), Twinkey-Frage „Das Video fragt nach einem anderen Video – was jetzt?“ und Lupe ergänzt.

## DB/Spiegel – 2026-10-13 (ohne App-Build) – 🔐 KC-CORE-NOTFALL-LESEN: Sicherung auch ohne Supabase lesen
Wunsch Hansi („wenn Supabase ausfällt: wie holen wir wichtige Daten zurück und können sie lesen – sie sind ja verschlüsselt? Ein Wächter soll manchmal eine einzelne Tabelle zurücklesen und prüfen“). Befund: Die tägliche Prüfung (kc-db-backup-verify-v2) entschlüsselt alle Tabellen – aber mit dem Schlüssel aus dem Supabase-Tresor; fällt Supabase weg, fehlt der Schlüssel. Neu: Werkzeug tools/notfall/sicherung-lesen.mjs + GitHub-Ablauf „Notfall – Sicherung lesen“ (sonntags 04:17 UTC): entschlüsselt eine zufällige Tabelle der neuesten Neon-Sicherung mit der HINTERLEGTEN Schlüsselkopie (Secret KC_BACKUP_KEY) und vergleicht Zeilenzahl und Prüfsumme; ändert nichts (der System Check sieht weiter die volle Tagesprüfung); keine Inhalte im öffentlichen Protokoll. Von Hand „wiederherstellen“ (nur mit JA): alle oder eine Tabelle entschlüsselt in ein eigenes Schema notfall_JJJJMMTT auf Neon, lesbar im Neon SQL Editor; public bleibt unberührt. Ohne Secrets grau „Noch nicht eingerichtet“. Anleitung: docs/NOTFALL_DATEN_ZURUECKHOLEN.md. Lokal geprüft (Postgres 16): richtiger/falscher Schlüssel, Prüfsumme gleich/abweichend, Wiederherstellen ohne/mit JA.

## DB/Spiegel – 2026-10-13 (ohne App-Build) – 🛡️ KC-CORE-SPIEGEL-NACHHOLEN: Wächter holt verpasste Tabellen selbst nach
Anlass: System-Check ROT um 09:30 – beim regulären Spiegellauf 08:10 fehlte kc_club_protokoll (ein Aufruf des Spiegel-Arbeiters brach nach 16 s mit 500 ab, 248/249 ok); ohne Eingriff wäre sie erst um 14:10 nachgezogen worden. Sofort von Hand nachgeholt (4.630/4.630 Zeilen, Prüfsumme gleich). Neu: kc_internal.kc_db_mirror_nachholen() (pg_cron kc-db-mirror-nachholen um :25 und :55) – Tabellen, die den jüngsten regulären Lauf (Welle mit mindestens der Hälfte aller Tabellen) verpasst haben, werden frühestens 15 Min. danach einzeln nachgeholt, höchstens 10 je Durchgang und 2 Versuche je Tabelle in 6 Std.; im Normalfall passiert nichts (Neon wird nicht zusätzlich geweckt). Trockenprobe: hätte um 08:40 genau kc_club_protokoll gewählt, jetzt keine. Rückweg in der Migration.

## 2.345.0 – 2026-10-13 – KC-CLUB-VIDEO-WARUM-2
Wunsch Hansi („ins Video Warum diese App: Die App soll das Clubleben anzeigen und organisieren, alles in einer App; Dinge vereinfachen, besser organisieren, Hilfestellung geben, aber auch Spaß machen und neugierig machen, was die App alles kann; sie kann an Termine erinnern u. v. m.“). RG_WARUM: neue Stationen „🧑‍🍳 Unser Clubleben in einer App“ (Kopf), „🧩 Einfacher und besser organisiert“ (Dienstwünsche, To-do, Erstattung, Fotos, Protokolle, Archiv), „⏰ Die App denkt mit“ (Erinnerungen an Termine, Dienste, Geburtstage, Aufgaben; Benachrichtigungen; Handy-Kalender), „🎉 Spaß und Neugier“ (Jahreszeiten, Eselsohr mit Bühne, Club-Song, Rätsel; Spiele; Themen). Dauer ca. 3 Min. Neuer Hilfe-Eintrag „💡 Wozu gibt es die Club-App?“ (Bereiche kurz erklärt; Twinkey findet ihn) mit Start des Videos.

## 2.344.0 – 2026-10-13 – KC-CLUB-HILFE-NACHTRAG + KC-CLUB-VIDEO-ANPASSEN
Wunsch Hansi („alle letzten Änderungen prüfen, ob sie in Hilfe, Suchlupe, Twinkey und Schulungsvideo stehen; ein extra Video zu Themen, Farben, Jahreszeiten – wie kann ich meine App anpassen“). Geprüft 2.303–2.343. Neu in der Hilfe (Twinkey findet sie mit): Rätsel, Club-Song, Wer kommt im Kopf zu Besuch (Laubbläser, Eichhörnchen mit Nuss-Namen, Schneeraupe, Skifahrer, Iglu, Eis-Name), Deko an der Leiste, Sparmodus, Akku sparen, „Meine App nach meinem Geschmack“; ergänzt: Eselsohr (sieben Reiter, blinkt), Bühne (Trainingsuhr, Knöpfe im Training ausgeblendet). Lupe: Thema wählen, Schrift des Themas, Jahreszeiten-Bild, Deko, Animierte Knöpfe, Kachel-/Sende-Effekt, Sparmodus/Akku, Video „Meine App …“, Trainingsuhr, Dienstwunsch-Bestätigung. Twinkey-Fragen: „Wie passe ich das Aussehen der App an?“, „Warum bewegt sich oben im Kopf nichts?“, „Wie spiele ich das Rätsel?“ (mit Video-Verweisen). Videos: Rückseite mit sieben Reitern und Station „🧩 Rätsel“; Dienst: „Fertig“ mit Bestätigung per E-Mail (Wunschplanung). Neues Erklär-Video „🎨 Meine App nach meinem Geschmack“ (14 Stationen, ca. 4 Min., Thema „Ich & meine App“): Themen, Schrift des Themas, Farbdesign, Tag/Nacht, große Schrift, Jahreszeiten-Bild, Herbst-Vorschau mit Eichhörnchen, Deko an der Leiste, Kachel- und Sende-Effekt, ruhig oder lebendig, Sparmodus und Akku, Eselsohr und Startseite, Zurückstellen – nur vorgeführt, nichts wird umgestellt.

## 2.343.0 – 2026-10-13 – KC-CLUB-TODO-LEER
Fund Hansi (Screenshot: „＋ Eintragen“ im To-do → rote Meldung „Bitte kurz aufschreiben, was zu tun ist“, Feld leer). Nachgestellt im Handy-Format: Text eingeben → Eintragen klappt (todo_anlegen kommt an). Neu: Ist das Feld leer, wird es rot umrandet, wackelt kurz und bekommt den Fokus (Tastatur geht auf); Hinweis „Erst oben ins Feld … schreiben – dann auf ＋ Eintragen tippen“ als normale Meldung. Feld ohne Browser-Autofill-Leiste (autocomplete=off) und mit „Fertig“-Taste (enterkeyhint=done).

## 2.342.0 – 2026-10-13 – KC-CLUB-TEMPO: schnellerer Start ohne Inhaltsänderung
Gemessen (13.10., 24 Std. Server-Protokoll): 1.227 CORS-Vorabfragen auf 3.564 Anfragen, je ~230 ms Serverzeit + Netzweg; Start installierte App Median 2,5 s, davon 1,35 s Warten auf den Server (7 Tage, 422 Starts). Geändert: (1) Server schickt Access-Control-Max-Age 7200 – der Browser merkt sich die Erlaubnis 2 Std. statt 5 s (Kopfzeilen unverändert); (2) index.html baut die Verbindung zum Club-Server (DNS + Verschlüsselung) schon beim Laden auf (preconnect); (3) Hilfe-Zahl auf der Kachel: Antworten, Gesehen und Ausleih-Zahl gleichzeitig statt nacheinander. Inhalte und Abläufe unverändert.

## 2.341.0 – 2026-10-13 – KC-CLUB-ADMIN-VERLAUF: Admin-Register Stufe 2 – Verlauf
Admin-Register Stufe 2 (vorbereitet in 2.21.0, jetzt eingebaut, Wunsch Hansi): neue Kachel „📈 Verlauf“ – Erreichbarkeit als Kästchen-Band (grün/gelb/rot, grau = keine Messung), Antwortzeit der Datenbank als Linie, fehlgeschlagene Hintergrund-Aufrufe als Säulen, Datenbankgröße; wählbar 24 Std. / 7 / 30 Tage. Messung alle 10 Min. direkt in der Datenbank (pg_cron, auch wenn die Schnittstelle hängt) und alle 15 Min. über die Schnittstelle vom Club-Server – fehlt diese, wird der Abschnitt rot. Tabelle kc_club_messwerte: nur Zahlen, 35 Tage, nur Server-Zugriff, bewusst nicht gespiegelt. Der Neustart-über-GitHub-Teil von damals entfällt (ersetzt durch den Ein-Knopf-Neustart seit 2.235.0).

## 2.340.0 – 2026-10-13 – KC-CLUB-RAETSEL-FRUEHER
Fund Hansi („die Fotos sind zu lange unkenntlich – etwas eher kenntlich machen, sonst hat man nie Chancen auf höhere Punkte“). Pixelblöcke jetzt 26 → 18 → 12 → 8 → 5 → 3 → 2 → scharf (vorher ab 44); die Stufen kommen am Anfang schneller (bei 0 / 2 / 4,5 / 7 / 10 / 13 / 17 / 22 s statt gleichmäßig alle 3,75 s) – nach 22 s ist das Bild scharf. Punkte fallen in 30 s von 1000 auf 250 (vorher auf 0); falsche Tipps weiter −150. Erkennen nach 5–7 s bringt so rund 850 Punkte.

## 2.339.0 – 2026-10-13 – KC-CLUB-RAETSEL
Wunsch Hansi („Spiel auf der Rückseite: Wie gut kennst du …? In Abständen kommen Pixel dazu, man muss erkennen, was auf dem Bild ist, z. B. Rathaus Werne. Roter Buzzer, 6 Tipps zur Auswahl, bei jedem Tipp Punkte abziehen, ein Zeitbalken läuft; Motive aus dem Netz“ – Entscheidung: Wikimedia und eigene Fotos, 20 Werne + 15 Küche, Club-Bestenliste). Neuer Reiter „🧩 Rätsel“ auf der Rückseite (Eselsohr). Ein Bild: startet grob verpixelt (Blöcke 44 px) und wird in 8 Stufen scharf (30 s, neu gemalt nur bei neuer Stufe); Punkte starten bei 1000 und laufen mit der Zeit herunter; roter Buzzer (Ton, Vibration) hält die Uhr an, 6 Tipps (1 richtig, 5 aus derselben Gruppe bzw. passende Zusatznamen); falsch = −150 (blinkt rot), Tipp wird durchgestrichen, es geht weiter; richtig = Bild scharf, Konfetti, ein Satz zum Motiv und der Bildnachweis (Fotograf, Lizenz, Commons-Link). Zeit um = 0 Punkte. Runde = 5 Bilder, Schlussbild mit Spruch. Wochen-Rätsel: aus der ISO-Kalenderwoche errechnet bekommen alle dieselben 5 Bilder und Tipps (3 Werne + 2 Küche bzw. 2 + 2 + 1 eigenes Club-Foto); der erste Durchgang je Person und Woche zählt (Server prüft Woche und Werte; zweiter Versuch = Übung). Club-Bestenliste: diese Woche und gesamt (Summe aller Wochen), eigene Zeile hervorgehoben. Üben: Werne, Küche, Köcheclub. Bilder: 35 freie Fotos von Wikimedia Commons (CC BY/BY-SA, GFDL 1.2, gemeinfrei; Fotos mit Sonder-Lizenzbedingungen bewusst nicht genommen), verkleinert als WebP (zusammen 1,9 MB, geladen erst beim Spielen) in raetsel/, Nachweise in raetsel/QUELLEN.md und im Spiel unter „📜 Bildnachweise“, GFDL-Text in raetsel/GFDL-1.2.txt. Eigene Bilder: der Admin wählt unter „📸 Eigene Bilder“ Fotos aus dem Club-Album und gibt die Lösung (und einen Satz) ein. Server: raetsel_stand, raetsel_ergebnis, raetsel_motiv_neu/-weg (Admin); Tabellen kc_club_raetsel_ergebnis und kc_club_raetsel_motiv (RLS an, nur service_role). Lupe: „Rätsel“.

## 2.338.0 – 2026-10-13 – KC-CLUB-TIPPFLAECHEN + KC-DATA-API-FREIGABEN-2
Aus der Gesamtprüfung, Freigabe Hansi („1 und 2“): (1) Datenbank: neue Tabellen/Sequenzen in public bekommen nicht mehr automatisch Lese-/Schreibrecht für anon und authenticated (nur noch service_role); bestehende Tabellen unverändert (geprüft: keine offen, Sichten mit security_invoker). Eingespielt 13.10., Rückweg in der Migration; Test verlangt künftig ausdrückliche Freigabe, wenn RLS-Regeln für anon/authenticated angelegt werden. (2) Größere Tippflächen für ältere Finger: Info-Pfeile 40 statt 32 px, Info-Punkte höhere Tippfläche, Mitglieder-Knöpfe 💬👋📞🎥 mindestens 38×40 px, am Handy ordentlich 2 × 2.

## 2.337.0 – 2026-10-13 – KC-CLUB-TUEV-4: Gesamtprüfung – Fehler, Hilfe-Wege, Akku, Abmelden, einheitliche Bedienung
Gesamtprüfung (Wunsch Hansi „App auf Herz und Nieren prüfen“: TÜV, Akku, Bedienung, Logik, Inhalte, Sicherheit) mit vier Prüfbereichen. Behoben: Hilfe- und Sprachsprünge führten zu „Darstellung“, obwohl Info-Feld, Kacheln, Mitglieder-Ansicht, Feiertage in „Startseite & Ansicht“ und Animierte Knöpfe in „Effekte“ stehen (neuer Test prüft jeden Sprung gegen die echte Einstellungsseite); Tag/Nacht-Automatik richtig beschrieben; neue Hilfe-Einträge (Push-Selbstheilung, Ansage nachholen, App doppelt offen, Dienstwünsche Fertig, Jahreszeiten & Deko, Abmelden). Fehler: Osterhase verschwand beim Laufende → Eier unfindbar; Halloween ging 2028/2034 in der Sim-Jü-Woche unter; Deko blieb leer, wenn sie bei verdeckter Startseite gesetzt wurde; Bildschirmfoto-Knopf sammelte Fenster-Listener; Admin-Zentrale zeigte bei altem Bericht grüne Lampen (jetzt grau, Regel 11). Termine, Dienstpläne, Erstattung und Fotos zeigen bei Ladefehler eine Fehlerkarte mit „🔄 Nochmal laden“ statt leer bzw. ewig „Wird geladen“. Rückfrage vor dem Löschen (Schach-Archiv, eigener Checklisten-Punkt), ✕ zum Löschen → 🗑️, Zurück-Knöpfe einheitlich „‹ Zurück“, „✓ Erledigt“ statt „✓ erl.“, Silbentrennung in Termin-Kacheln, Beschriftung für Vorleseprogramme. Akku: Rahmen-Ameisen und atmende Lämpchen halten in Ruhe an (Messung Startseite in Ruhe 8,0 % → 4,3 % Rechenzeit). Neu: ⚙️ → Privatsphäre → „🚪 Von diesem Gerät abmelden“ (löscht nach Rückfrage Zugang und alle Club-Daten auf dem Gerät).

## 2.336.0 – 2026-10-12 – KC-CLUB-DEKO-OBEN-FREI
Wunsch Hansi („dafür soll ganz oben nichts hin – Wimpel usw.“). Die Kopf-Bühnen der Themen malen oben keine Girlanden mehr: Sim-Jü ohne Lichterkette, Oktoberfest ohne blau-weiße Wimpelkette, Karneval ohne Luftschlangen vom oberen Rand. Diese Deko hängt seit 2.335.0 an der Leiste (KC-CLUB-DEKO: Sim-Jü bunte Lichter, Oktoberfest blau-weiße Wimpel, Karneval bunte Wimpel). Riesenrad, Fass, Wagen, Konfetti usw. bleiben.

## 2.335.0 – 2026-10-12 – KC-CLUB-DEKO
Wunsch Hansi („Deko: Wimpel, Lichterkette usw. – an die Stelle, wo du auch die Eiszapfen hängen hast“). Unter der Leiste mit den Lämpchen hängt eine Girlande in Bögen (Bogenzahl nach Breite): 🎏 Wimpel (Dreiecke mit Glanzkante), 💡 Lichterkette (Birnen mit Fassung und Schein, jede dritte funkelt sanft – im Sparmodus/bei ruhigen Knöpfen nicht) oder 🏮 Laternen (runde Papierlaternen mit Rippen, innen leuchtend, Quaste). Automatisch nach Jahreszeit/Thema: Herbst Laternen in Laubfarben, Advent warmweiße Lichter, Silvester goldene Lichter, Sommer bunte Wimpel, Frühling Pastell-Wimpel, Oktoberfest blau-weiße Wimpel, Karneval bunte Wimpel, Sim-Jü bunte Lichter, Karibik bunte Laternen, Halloween orange-lila Lichter; im tiefen Winter hängen dort die Eiszapfen. Wahl je Gerät unter ⚙️ → 🍂 Jahreszeiten: Automatisch / Wimpel / Lichterkette / Laternen / Aus. Stilles SVG-Bild (kein Akkuverbrauch), auch im Sparmodus und in der einfachen Ansicht; Tippen geht hindurch.

## 2.334.0 – 2026-10-12 – KC-CLUB-AKKU
Fund Hansi („wenn ich die Club-App aufmache, ist ruck, zuck der Akku leer – das Handy meldet hohen Akkuverbrauch“). Messung (Startseite, Handy-Format, 10 s): Das Jahreszeiten-Bild im Kopf (Leinwand über den ganzen Kopf) wurde 60× je Sekunde in 2-facher Auflösung neu gemalt – das war der Hauptverbraucher; keine dauerhaften CSS-Animationen auf der Startseite, Netz-Abfragen selten (≈ 2/Min.). Neu: höchstens 30 Bilder/s (Bewegung rechnet mit der echten Zeit, sieht gleich aus), nach 45 s ohne Tippen/Tasten nur noch 12 Bilder/s, bei Akku unter 30 % und nicht am Laden immer 12 Bilder/s; zwischen zwei Bildern schläft die App (Zeitgeber statt Dauerschleife); Auflösung höchstens 1,5-fach (knapp halb so viele Bildpunkte). Gemessene Rechenzeit: 7,1 % → 4,3 % aktiv, 2,5 % in Ruhe; Bilder/s 60 → 30 bzw. 12. Außerdem lief ein 30-ms-Takt fürs Kachel-Ziehen immer (33 Weckrufe/s) – jetzt nur, solange eine Kachel gezogen wird. Im Hintergrund oder auf anderen Seiten ruht das Bild wie bisher ganz.

## 2.333.0 – 2026-10-12 – KC-CLUB-THEMEN-SCHRIFT: passende Schrift je Thema für die Begrüßung
Themen bringen eine passende Schrift für die Begrüßung im Kopf mit: Fraktur (Oktoberfest), Grusel (Halloween), Comic (Karneval), Weihnachtsschrift, Pacifico (Karibik), Rye (Sim-Jü), Lobster (Sommer, Silvester), Dancing Script (Frühling, Ostern). Freie Schriften (OFL/Apache) im Ordner schriften/, nur bei Bedarf geladen, kein fremder Server. Der Schriftzug „Köcheclub Werne“ und alles Gedruckte bleiben im CD. Die Themen-Auswahl zeigt jeden Namen in seiner Schrift. Abschaltbar: ⚙️ → Themen → „✍️ Schrift des Themas“.

## 2.332.0 – 2026-10-12 – KC-CLUB-THEMEN-BUEHNE-2: Ostern, Karneval, Halloween
Drei weitere Themen: 🐣 Ostern (Osterhase hoppelt mit Korb herein und legt die Eier – erst dann findbar; das gilt auch für die Ostereier an Ostern), 🎭 Karneval (Luftschlangen, Konfetti bleibt liegen, Wagen mit „Helau, <Vorname>!“, Kamelle, Konfetti-Kanonen), 🎃 Halloween (Mond, Spinnennetz mit Spinne, leuchtende Kürbisse, Fledermäuse, Gespenst „Buuuh, <Vorname>!“). Nach Kalender: Karneval (Weiberfastnacht–Veilchendienstag, 11.11.), Ostern (Palmsonntag–Ostermontag), Halloween (31.10.). Osterformel als gemeinsame Funktion osterSonntag().

## 2.331.0 – 2026-10-12 – KC-CLUB-THEMEN-BUEHNE: neue Bühnenbilder Sim-Jü, Oktoberfest, Karibik
Drei neue Themen mit eigenem Bild im Kopf: 🎡 Sim-Jü (Lichterkette, Riesenrad, Luftballons, Lebkuchenherz mit Vornamen, Feuerwerk), 🥨 Oktoberfest (Wimpel, Brezn, Fass anzapfen „O'zapft is!“, Maßkrüge „Prost!“), 🌴 Karibik (Meer, Palme mit Kokosnuss, Segelboot, Papagei/Fisch, Name im Sand, Sonnenuntergang). Nach Kalender: Oktoberfest (Samstag nach dem 15.9. bis 1. Oktobersonntag) und Sim-Jü (Samstag–Dienstag um den 28.10.). Vorschau unter ✨ Effekte.

## 2.330.0 – 2026-10-12 – KC-CLUB-EFFEKTE-GRUND
Fund Hansi (Screenshot: Vorschau „Herbst“ antippen → nur „Effekte sind aus – ✨ Animierte Knöpfe einschalten (und Sparmodus aus)“, obwohl „Animierte Knöpfe“ an war). Ursache: Der Sparmodus hatte sich automatisch eingeschaltet (z. B. „die letzten Starts waren langsam“ – heute während des Postgres-Updates); im Sparmodus ruhen Effekte und Jahreszeiten. Neu: fxAusHinweis nennt den echten Grund und bietet die Lösung mit einem Tipp an – „✨ Einschalten“ (Animierte Knöpfe aus) oder „🐢 Sparmodus aus“ (mit Grund, wenn er sich selbst eingeschaltet hat; zurück auf Automatisch unter ⚙️ → 🎨 Darstellung) – danach läuft die gewünschte Vorschau gleich weiter. Gilt für Jahreszeiten-Vorschau, Sende-Effekt, Blaulicht und Kachel-Effekt.

## 2.329.0 – 2026-10-12 – KC-CLUB-NUSSNAME
Wunsch Hansi (Herbst-Gegenstück zum Eis-Namen, Variante 2 „mit dem Eichhörnchen“). Das Eichhörnchen kommt mit voller Backe, legt die Nuss ab, und der nächste Buchstabe des Vornamens entsteht (Funkeln) – jeder Buchstabe aus vielen kleinen Eicheln und Haselnüssen (Rasterpunkte innerhalb der Buchstabenform, zwischengespeichert) auf dunklem Untergrund, damit er gut lesbar ist; die Nüsse purzeln von unten nach oben dazu. Solange der Name entsteht, kommt es öfter (alle 12–25 s, sonst 35–75 s; dazwischen frisst es weiter Nüsse vom Boden). Ist der Name fertig, hüpft es ans Ende und sitzt 4,5 s stolz daneben (Funkeln). Nach 2 Minuten holt es sich die Nüsse vom Ende her wieder, Buchstabe für Buchstabe, danach beginnt es von vorn. Nicht während der Laubbläser läuft. Nur Herbst, nur auf diesem Gerät. Hilfetext „🍂 Herbst im Kopf“ ergänzt.

## 2.328.0 – 2026-10-12 – KC-CLUB-HERBST-BLAESER + KC-CLUB-HERBST-HOERNCHEN
Wunsch Hansi („im Herbst: wenn der Laubhaufen groß genug ist, einen Mann mit Laubbläser einblenden, der das Laub wegpustet; Eicheln auf dem Boden und ab und an ein Eichhörnchen, das eine dicke Nuss in den Mund nimmt und wieder wegläuft“). Laubhaufen voll → im Wechsel (Lauf mod 3) Windstoß, Twinkey mit Besen oder der Gärtner mit Rückentrage-Laubbläser: läuft herein, pustet langsam quer über den Kopf (Luftstrom-Striche aus der Düse), Blätter in 14–72 px vor der Düse wirbeln in Blasrichtung davon; noch fallende Blätter werden mitgenommen; bleibt doch etwas liegen, holt es der Wind. Eicheln (mit Hütchen) und Haselnüsse liegen unter dem Laub (4–7 Stück); sind es weniger als 3, fällt nach 20–40 s eine neue herunter und hüpft auf. Alle 25–55 s flitzt ein Eichhörnchen (buschiger Schwanz, Ohrpinsel) zu einer Nuss, schnuppert, stopft sie sich in die Backe (Backe wird dick, es kaut) und saust zur näheren Seite davon; das Laub raschelt. Nicht während der Laubbläser läuft. Vorschau-Extras „blaeser“ und „hoernchen“. Hilfetext „🍂 Herbst im Kopf“ ergänzt.

## 2.327.0 – 2026-10-12 – KC-CLUB-ESELSOHR-BLINKEN
Wunsch Hansi („das Eselsohr soll zwischendurch kurz doppelt blinken, um zu zeigen: hier doppelt klicken – in schöner Signalfarbe, damit es auffällt“). 4 s nach dem Start und danach alle 35–60 s leuchtet die Ecke zweimal kurz in Gelb-Orange (#ffd400 → #ff5e00) mit leuchtendem Schein auf (1,3 s); ist der Kopf umgedreht, blinkt das Eselsohr der Rückseite. Nicht bei „Bewegung reduzieren“, nicht im Hintergrund, nicht während des Trainings, nicht beim Ziehen und nur auf der Startseite. Außerdem (Wunsch Hansi): im Update-Hinweis zu 2.325.0 steht nicht mehr, dass die Mail in BCC an den Admin geht (am Versand ändert sich nichts).

## 2.326.0 – 2026-10-12 – KC-CLUB-DW-FERTIG-PFLICHT
Wunsch Hansi („der Fertig-Knopf soll Pflicht sein, sonst geht es an der Stelle nicht weiter – Fertig und Abbrechen anbieten“). Wer in den Dienstwünschen etwas gespeichert und noch nicht abgeschlossen hat, bekommt beim „← Zurück“ (auch beim Zurück aus Twinkey selbst) nur „✅ Fertig“ oder „Abbrechen“: Fertig schickt die Bestätigung mit Zusammenfassung per E-Mail (CC/BCC wie 2.325.0) und schließt das Fenster, Abbrechen führt zurück in die Eingabe. „Nein, danke“ gibt es nicht mehr. Ausnahme, damit niemand festsitzt: Schlägt der Versand fehl (Netz), steht der Fehler da und das nächste Zurück schließt. Die Leiste „Alle Tage eingetragen“ bietet ebenso „✅ Fertig – Bestätigung mit Zusammenfassung per E-Mail“ oder „Abbrechen“ (statt „Später“).

## 2.325.0 – 2026-10-12 – KC-CLUB-DW-BESTAETIGUNG-KOPIE
Wunsch Hansi („bei Frank die Anrede Lieber eintragen, ihm und seiner Frau Christina die Bestätigung senden – immer mich in BCC und Klaus und Dieter in CC“). Gemeinsamer Versand dwBestaetigungSenden für „✅ Fertig“/„📧 Bestätigung anfordern“ des Mitglieds und den neuen Leitungs-Knopf: E-Mail + App-Nachricht an das Mitglied, CC an die Ämter Clubsprecher und Kassenwart (kc_club_rollen – heute Klaus und Dieter Zander), BCC an die Admins (Hansi). Die bisherige getrennte Vorgang-Kopie entfällt dafür (Kennung club-dwbest, kein Doppel). Neu im Eingang → Dienstzeiten eines Mitglieds: „📧 Bestätigung an … schicken“ (nur Clubleitung, höchstens 1× je 2 Min. je Mitglied; Protokoll mit „durch“). Anrede in kc_besuche_anrede: Frank „Lieber“, Christina „Liebe“.

## 2.324.0 – 2026-10-12 – KC-CLUB-DW-BESTAETIGUNG-MAIL
Wunsch Hansi („Hat Frank eine Bestätigung bekommen? In DP2 am Ende der Eingabe anklickbar machen: Bestätigung mit Zusammenfassung per E-Mail anfordern – mit dem Hinweis, dass es sich um eine Wunschplanung handelt und noch nicht der fertige, freigegebene Sollplan ist“). Anlass: Frank hat am 12.10. alle 13 Tage eingetragen, aber den Knopf „✅ Fertig“ oben nicht gefunden – bisher hat noch niemand die Bestätigung angefordert. Neu: (1) Sobald alle Tage einen Eintrag haben, meldet der Datenanschluss (dp2-club/daten.js, DP2 selbst unverändert) das an die Club-App; unten im Fenster erscheint „🎉 Alle 13 Tage eingetragen – danke!“ mit dem großen Knopf „📧 Bestätigung mit Zusammenfassung per E-Mail anfordern“ (und „Später“). (2) Wer in dieser Sitzung gespeichert und noch keine Bestätigung angefordert hat, wird beim „← Zurück“ gefragt: „📧 Bestätigung mit Zusammenfassung per E-Mail anfordern?“. (3) E-Mail nach Hansis Wortlaut: „Lieber/Liebe (Anrede aus der Besuchs-Anrede, sonst Hallo) Frank, danke, dass du deine Dienstplanung per App gemacht hast. Deine Angaben sind angekommen und werden in das Dienstplan-Programm DP2 übernommen. ⚠️ Bitte beachte: Es handelt sich um deine Wunschplanung – das ist noch nicht der fertige, freigegebene Sollplan. Der fertige Dienstplan wird sicherlich bald veröffentlicht.“ – darunter alle Eingaben Tag für Tag, Link zur Aufstellung, „Liebe Grüße, Köcheclub Werne“. Betreff mit „Wunschplanung“. (4) Kopfreihe passt aufs Handy (Raster-Spalte minmax(0,1fr)).

## 2.323.0 – 2026-10-12 – Themen: Weihnachten, Indian Summer & Co.
Neu unter ⚙️ → Darstellung → 🎭 Themen: Ein Tipp stellt Farben, das Bild im Kopf der Startseite und den Effekt beim Senden passend ein – Köcheclub klassisch, Frühling, Sommer, Herbst, Indian Summer (leuchtend rotes und goldenes Laub), Winter, Weihnachten und Silvester. „Nach Kalender“ wechselt das Thema von selbst. Einzelnes lässt sich trotzdem ändern. Der Admin kann ein Club-Thema für alle festlegen; jedes Mitglied kann es für sich abschalten.

## 2.322.0 – 2026-10-12 – Eisstücke fallen jetzt auch bei dir
Auf Handys mit der Einstellung „Bewegung reduzieren“ fiel bisher weder ein Wassertropfen noch ein Eisstück von den Eiszapfen. Jetzt läuft das wie das übrige Winterbild. Das erste Eisstück fällt gleich nach dem Öffnen, danach etwa jedes zweite Mal statt eines Tropfens – und es ist etwas größer.

## 2.321.0 – 2026-10-12 – Benachrichtigungen reparieren sich selbst
Verliert ein Handy die Erlaubnis für Benachrichtigungen (z. B. nach Neuinstallation oder wenn das Handy aufräumt), richtet die App den Zugang beim nächsten Start von selbst neu ein – oder fragt deutlich „Jetzt wieder einschalten“, wenn das Handy erst gefragt werden muss. Wer anklopft, sieht jetzt, wenn das Gegenüber gerade keine Benachrichtigungen bekommen kann.

## 2.320.0 – 2026-10-12 – Winter: Iglu, Eskimo und Huskies
Ab und an fährt ein Hundeschlitten mit vier Huskies vorbei. Abwechselnd mit dem Schneemann baut ein Eskimo Block für Block ein Iglu und geht hinein; dann kommt der Schlittenmann mit seinen Huskies heim – er wohnt dort – und im Eingang geht Licht an. Kommt die Sonne, fahren beide mit dem Gespann davon, und das Iglu schmilzt – wie der Schneemann und der Eis-Name.

## 2.319.0 – 2026-10-12 – Online-Ansage nachholen, Name aus Glitzer-Eis
Kommt jemand online, während deine App gerade zu ist, sagt sie beim Zurückkommen trotzdem an, wer in den letzten 3 Minuten dazugekommen ist. Im Winter fällt ab und an vom größten Eiszapfen ein Eisstück taumelnd herunter – unten wird daraus Buchstabe für Buchstabe dein Vorname aus Glitzer-Eis. Kommt die Sonne zum Schneemann, schmilzt der Name, und es geht von vorn los.

## 2.318.0 – 2026-10-12 – KC-CLUB-WINTER-PISTE
Wunsch Hansi („im Winter-Design ab und an eine Schneeraupe, die die Schneehügel glättet; ein paar Minuten später 2 Skifahrer, die in verschiedenfarbigen Anzügen vorbeiwedeln; die Kinder bei der Schneeballschlacht haben keine Arme“). Schneeraupe (Pistenraupe): rot, Fahrerhaus mit Fahrer, Kette mit Laufrollen, gelbe Rundumleuchte blinkt, vorn das Schild, hinten die Fräse. Sie fährt (abwechselnd von links/rechts) über den Kopf, trägt Hügel ab und füllt Mulden auf die mittlere Schneehöhe auf (vor dem Schild stäubt Schnee); dahinter bleibt ein Rillenmuster, das in 2 Minuten verblasst. Kommt nur, wenn Schnee liegt und nichts anderes läuft (keine Kinder, kein Twinkey, kein Schneemann), etwa alle 5–8 Minuten. 2–3½ Minuten nach der Raupe wedeln zwei Skifahrer (Anzug mit Streifen, Helm, Skibrille, Stöcke; je zwei andere Farben aus 8 Kombinationen) mit Schwüngen und Schneespritzern vorbei. Die Kinder der Schneeballschlacht (und auf dem Schlitten) haben jetzt zwei sichtbare Arme mit dunklem Rand und Fäustlingen; vor dem Wurf holen sie mit dem Schneeball in der Hand weit nach hinten aus und schleudern ihn nach vorn – der Ball fliegt aus der Hand los.

## 2.317.0 – 2026-10-12 – KC-CLUB-BUEHNE-UHR
Wunsch Hansi („etwas größer neben Twinkey eine Uhr, wie lange die Übungen noch gehen und wie viel Zeit schon abgelaufen ist; Lupe usw. unten rechts und links das Mikro beim Training ausblenden“). Neben Twinkey zwei große Felder: „⏱ schon“ (gelaufene Zeit, Pausen zählen nicht) und „⏳ noch“ (gelb; aktuelle Phase + Rest der Übung + alle folgenden Übungen mit Vorbereitung, Übung und Ausschütteln). Auf dem Handy steht die Uhr links unten neben Twinkey, Twinkey rückt etwas nach rechts. Während das Training läuft, bekommt die Seite die Klasse „bw-training“: 🔍 Lupe, 👆 Hand, ? und 🎙 Mikrofon sind ausgeblendet; bei Ende, Fertig oder Verlassen der Bühne kommen sie zurück.

## 2.316.0 – 2026-10-12 – KC-CLUB-SONG
Wunsch Hansi („Köcheclub-Song schreiben – Schlager mit eingängigem Refrain und Ohrwurm-Melodie, im Helene-Fischer-Stil, in die Bühne einbauen“). „Seit einundneunzig (Köcheclub Werne)“, Text nach der Clubchronik (Mai 1991 Gaststätte Ickorn, Köche aus Krankenhaus und Altenheim, seit 1995 Weihnachtsmarkt, rote/weiße Kochjacken, Erlöse für soziale Zwecke). Ablauf: Intro – Strophe 1 – Pre-Refrain – Refrain – Strophe 2 – Pre-Refrain – Refrain – Bridge – Refrain einen Ganzton höher (2×) – Schluss; 86 Takte, 124 BPM, ca. 2:46 Min. Disco-Fox: Bass-Trommel auf jeden Schlag, Oktav-Bass, Streicher-Fläche, Klatschen auf 2 und 4, Becken zum Refrain, Wirbel vor Refrain und Rückung, „👏👏“ nach „Köcheclub Werne!“. Gesangsmelodie als Synthesizer-Stimme (jede Silbe ein Ton auf Achteln, letzte Silbe gehalten), Refrain-Haken G–G–A–C–C | C–B–A–G–E. Karaoke: laufende Zeile groß, gesungene Silben gold, darunter die nächste Zeile. Neue Musik-Kachel „🎤 Club-Song“, Knopf „🎤 Club-Song“ in der Bühnen-Auswahl, Lupe „Club-Song“. Läuft nicht im Training (dort nur Disco).

## 2.315.0 – 2026-10-12 – KC-CLUB-ZWEI-FENSTER + KC-CLUB-ZWEI-BROWSER
Wunsch Hansi („abfangen, wenn das Programm 2× auf dem gleichen Gerät geöffnet wird – im gleichen Browser und in 2 verschiedenen; dann Meldung“). (1) Gleicher Browser: Beim Start fragt das neue Fenster über einen Funkkanal zwischen den Fenstern (BroadcastChannel, bleibt im Gerät), ob schon eines offen ist. Wenn ja: „🪟 Die Club-App ist schon offen“ – „✅ Hier weitermachen“ legt das andere Fenster schlafen (alle Abfragen aus, Hinweis „Die Club-App ist jetzt in einem anderen Fenster offen“ mit „↻ Hier weitermachen“), „✖ Dieses Fenster schließen“ schließt (oder bittet, den Tab zu schließen, wenn der Browser das nicht erlaubt). (2) Anderer Browser auf demselben Gerät: Der Online-Abgleich schickt die Browser-Kennung mit; der Server merkt sich je Person höchstens 6 Kennungen (Browser-Name, System, Netz nur als Prüfsumme, Zeit). War in den letzten 3 Minuten eine andere Kennung derselben Person im selben Netz mit demselben System aktiv, kommt „📱 Die Club-App ist noch woanders offen … Bitte Firefox schließen“ – „👍 Mach ich“ (1 Std. Ruhe) oder „📲 Das ist ein anderes Gerät“ (für diese Kennung nie wieder). PC und Handy im selben WLAN lösen nichts aus (anderes System). Anlass: Steven am 10.10. mit Chrome und Firefox gleichzeitig.

## 2.314.1 – 2026-10-12 – KC-CLUB-VORFUEHREN-HINTERGRUND
Aus der Prüfung „langsamer Server“ (Wunsch Hansi). Am 10.10. 9:00–9:30 kamen über 3.300 Anfragen in 30 Minuten: Live-Vorführung Hansi → Steven, bei Steven in zwei Browsern gleichzeitig (Firefox und Chrome), der Zuschauer fragt alle 0,8 s nach. Der Server blieb schnell (Ø 0,6–0,8 s je Anfrage). Jetzt fragt ein Zuschauer-Fenster im Hintergrund nicht mehr nach (wie Chat und Online-Abgleich schon) – sobald es wieder vorn ist, geht es weiter.

## 2.314.0 – 2026-10-12 – KC-CLUB-BEWEGUNG-EINLADUNG + KC-CLUB-SPIEGEL + KC-CLUB-BUEHNE-RECHERCHE
Wunsch Hansi. (1) Einladung beim Start: Twinkey (winkend) fragt „Hallo <Vorname>! Heute Lust auf eine kleine Bewegungseinheit mit mir?“ – 💪 Ja (dreht den Kopf um und öffnet die Bühne), ⏰ Später (frühestens in 2 Std. wieder), 🙂 Heute nicht (erst morgen), 🔕 Nicht mehr fragen (Schalter unter ⚙️ → „🧩 Startseite & Ansicht“). Höchstens einmal am Tag, nie über einem offenen Fenster, während eines Erklär-Videos oder wenn das Eselsohr aus ist; gemerkt je Gerät. (2) Neuer Reiter 🪞 Spiegel auf der Rückseite: Silberrahmen; erst „📷 Kamera an“ startet die Frontkamera (nie von selbst), das Bild ist gespiegelt und mit „🐹 Pausbäckchen“ breiter mit aufgeblasenen Wangen (Verzerrungs-Tabelle, im Gerät berechnet) – umschaltbar auf „🙂 Normal“; nach kurzer Zeit sagt Twinkey „Na, wir sollten mal wieder mit Twinkey eine Bewegungseinheit machen!“, „🎭 Zur Bühne“ führt hin. Die Kamera geht aus bei „📷 Aus“, Reiterwechsel, Zurückdrehen und sobald die App in den Hintergrund geht; nichts wird gespeichert oder gesendet. (3) Recherche (Stuhlgymnastik/Seniorengymnastik, Fitness-Sprüche): neue Übungen Liegestütz an der Arbeitsplatte (Stehen und Küche, Seitenansicht mit Arbeitsplatte), Wasserflaschen seitlich heben, Zum Salzstreuer greifen, Applaus für den Koch (Sitzen), Brotteig kneten (Küche); zehn neue Sprüche mit Augenzwinkern, drei neue Lob-Sprüche, ein neuer Endspurt-Spruch. Hilfe, Lupe, Twinkey und das Video „Die Rückseite“ kennen Spiegel und Einladung.

## 2.313.0 – 2026-10-12 – KC-CLUB-BUEHNE-KARTON + KC-CLUB-BUEHNE-ABWECHSLUNG
Wunsch Hansi. Neue Übung „📦 Karton-Steigen“ (Stehen) bzw. „Karton aus dem Lager“ (Küche): Twinkey von der Seite, vor ihm ein Pappkarton – erst der eine Fuß drauf und wieder runter, dann der andere (8 Schläge), Arme schwingen gegengleich; Spruch „So kriegen wir das Fett weg!“. Abwechslung: Bisher kamen immer dieselben ersten Übungen in derselben Reihenfolge – jetzt zufällig gemischt, die Übungen der letzten Runde (je Modus, auf diesem Gerät gemerkt) kommen erst, wenn alle anderen dran waren, und nie zweimal dieselbe Bewegung hintereinander. Neue Übungen: Ans Gewürzregal, Zum Vorratsschrank, Topf aus dem Unterschrank (Küche), Ins Oberregal greifen und Teig ausrollen (Sitzen). Schlusswort nach dem Sport (gesprochen und auf der Abschluss-Seite): „Nach dieser Plackerei habe ich mir einen Eierpunsch und eine Portion Grünkohl mit doppelt Mettwurst am Köcheclub-Stand verdient. Die kochen dort extra warm!“

## 2.312.0 – 2026-10-12 – Dienstwünsche: mehr Platz, Bereitschaft einmal fragen
Die Dienstwunsch-Eingabe ist auf dem Handy kompakter: oben nur noch eine Reihe Knöpfe, der Sperrzeit-Tipp ist zugeklappt, die doppelte DP2-Kopfzeile ist weg – die Frage steht gleich oben. „Nur wenn nötig“ ist bei der Kann-Zeit ein auffälliges oranges Feld mit Erklärung, bei der Wunschzeit ist das ausgegraute Kästchen weg. Neu am Anfang: „Bist du generell bereit, auch Bereitschaftsdienste zu übernehmen?“ – bei Nein kommt die Bereitschaftsfrage nicht mehr an jedem Tag.

## 2.311.0 – 2026-10-12 – Twinkey: Becken, Nudelholz und Schweißtuch
Beim Deckel-Klatschen treffen sich die Topfdeckel jetzt genau vor der Brust – und genau dann klingt das Becken. Das Nudelholz wird mit beiden Händen an den Griffen kräftig vor- und zurückgerollt, bei „Fäuste machen“ streckt Twinkey die Arme vor und öffnet die Hände weit. Ab und zu wischt er sich vor dem Ausschütteln mit dem Schweißtuch die Stirn, und er hat neue Sprüche (Beinstulpen von Nena, Möhren schon geschält).

## 2.310.2 – 2026-10-12 – KC-CLUB-FP-RUHIG
Wunsch Hansi („Info statt Fehler anzeigen und alles optimieren, damit so etwas nicht zu oft vorkommt“). Anzeige: Im 🩺 Fehlerprotokoll sind ⚪ Info-Einträge (Startzeit, Gerät & Browser, alte Version, Updates, App geöffnet) ausgeblendet – je Person steht „⚪ n Info-Einträge ausgeblendet“, der Knopf „⚪ Info zeigen“ holt sie zurück. update_selbst/update_start zählen jetzt als Info (bisher 🟡 Hinweis) und haben verständliche Namen. Weniger Einträge: (1) Server speichert dieselbe Meldung (gleiche Art + Zeitstempel) nur einmal – nach einem Update schickte die neue Seite nach, was die alte schon gesendet hatte. (2) Suchmaschinen-Roboter (z. B. BitsExplorerBot) werden weder im Gerät noch auf dem Server mitgeschrieben. (3) „Handy offline“ höchstens einmal je 5 Minuten statt für jede einzelne Anfrage (iPad: 11 Einträge in 2 s). Stabiler: Lese-Anfragen wiederholen sich auch bei kaputter Antwort (Server startet gerade neu, z. B. beim Hochladen) einmal still.

## 2.310.1 – 2026-10-12 – KC-CLUB-AUFWACHEN + Fehlerprotokoll-Funde
Aus dem Club-Fehlerprotokoll (Wunsch Hansi „Check das mal“). 1) „Keine Verbindung zum Server“ bei terminanfragen_liste/init, obwohl online: Kommt das Handy aus dem Ruhezustand, fragt die App nach 2,5 s im Hintergrund – das Netz ist dann oft noch nicht bereit (Preflight kam an, die Anfrage nicht). Lese-Anfragen werden bei einem solchen Netzfehler jetzt nach 1,6 s einmal still wiederholt (Schreiben nie). 2) Skriptfehler „Cannot read properties of undefined (reading '0')“ in esTafelAbwischen: Die Bildzeit von requestAnimationFrame kann vor dem Startzeitpunkt liegen → negativer Fortschritt → bahn[-1]; jetzt auf 0 begrenzt (ebenso beim Zahlen-Hochzählen).

## 2.310.0 – 2026-10-12 – Twinkey bewegt sich echter
Twinkey rührt jetzt richtig: Beim Teig führt er den Schneebesen in großen Kreisen durch die Schüssel und hält sie mit der anderen Hand fest. Bei der Suppe hält er einen großen Kochlöffel mit beiden Händen und rührt große Kreise im Topf. Beim Oberkörper-Drehen wandern die Fäuste weit nach links und rechts, der Kopf schaut mit. Und wenn er „Jetzt andersherum!“ sagt, kreist er auch wirklich andersherum.

## 2.309.0 – 2026-10-12 – KC-CLUB-BUEHNE-BEREIT: „Lege dir bereit“, Weiter überspringt, Luftballon und Hanteln
Nach „Vorhang auf!“ zeigt und sagt Twinkey zuerst, was für diesen Durchgang bereitliegen soll (Stuhl, Springseil, 2 Wasserflaschen als Hanteln, Luftballon, Schneebesen, Kochlöffel … – aus den geplanten Übungen); dann „Alles bereit – los!“. Vor jeder Übung sagt er, was man in die Hand nimmt. Fehlt etwas: „⏭ Weiter“ überspringt die Übung – jetzt auch schon in der Vorbereitung (vorher startete sie dann sofort). Neue Übungen: Luftballon hochtippen (Sitzen/Stehen), Hanteln über den Kopf (Sitzen), Hanteln seitlich heben (Stehen) mit Wasserflaschen.

## 2.308.1 – 2026-10-12 – KC-CLUB-BESUCH-DANKE
Wunsch Hansi. Die Zusammenfassung nach einer Schulung (Push + Mail, Kopie im Archiv-Ordner) dankt jetzt auch ausdrücklich: „Vielen Dank für deine Zeit und dein tolles Mitmachen!“ (bei mehreren: „eure Zeit und euer tolles Mitmachen“).

## 2.308.0 – 2026-10-12 – KC-CLUB-BUEHNE-REIFEN-SEIL: Hula-Hoop mit Reifen und Seilspringen
Zwei neue Übungen im Stehen: Hula-Hoop mit echtem Reifen (kreist um die Hüfte, hintere Hälfte hinter dem Körper, bunte Streifen drehen mit, Arme hoch; zur Hälfte andersherum) und Seilspringen (kleine Sprünge im Takt, das Seil schwingt über den Kopf und unter den Füßen durch). Der bisherige „Hula-Hoop in der Küche“ bleibt.

## 2.307.0 – 2026-10-12 – KC-CLUB-BUEHNE-RICHTUNGEN: Musikrichtungen als Kacheln, 12 neue Lieder, mehr Sprüche
„Nur Musik hören“: oben Kacheln je Musikrichtung (Disco, Reggae, Funky, Rock, Ballade, Latin, Schlager & Polka), darunter die Lieder der Richtung; weiter geht es innerhalb der Richtung. Neu: Ska-Kartoffel, Funky Fritteuse, Soul-Suppe, Pfannen-Rock, Küchen-Highway, Rock'n'Roll im Kühlhaus, Kerzenschein am Herd, Abschied vom Weihnachtsmarkt, Cha-Cha-Champignon, Bossa am Backofen, Walzer im Weinkeller, Schunkel-Schlager. Training: 12 neue motivierende Sätze und 12 neue Augenzwinker-Sprüche; „Küchenband“ wird englisch („Bänd“) gesprochen.

## 2.306.0 – 2026-10-12 – KC-CLUB-SPRACHE-HAENGT: Twinkey spricht wieder
Chrome auf Android lässt die Sprachausgabe nach einem Ansichts- oder App-Wechsel manchmal auf Pause stehen oder dauerhaft „beschäftigt“ – dann war Twinkey trotz eingeschalteter Ansage stumm. Jetzt wird die Sprache vor jedem Satz geprüft und wieder in Gang gesetzt; jedes Training startet sie frisch; beim Zurückkehren in die App läuft sie weiter. Gilt für alle Vorlese-Stellen, die über die gemeinsame Sprachausgabe laufen.

## 2.305.0 – 2026-10-12 – KC-CLUB-START-VORDERSEITE: Start führt von der Bühne zurück
Auf der Rückseite (Bühne, Uhr, Tafel …) tat ein Tipp auf 🏠 Start nichts – der Kopf blieb umgedreht. Jetzt dreht Start den Kopf zurück auf die Vorderseite; Training, Musik und Ansage hören dabei auf.

## 2.304.0 – 2026-10-12 – KC-CLUB-BUEHNE-BEWEGUNG-3: sechs neue Übungen im Stehen
Nach Recherche (Seniorentanz, Line-Dance-Grundschritte, Sturzprophylaxe): Fuß nach hinten tippen und abwechselnd, vor und zurück (beides von der Seite gezeigt), Tanzschritt Seit-Tipp mit Klatschen, Hampelmann ohne Hüpfen, Fersen zum Po, Arme kreisen im Stehen. Kleine Schritte, Hinweis auf Festhalten am Stuhl.

## 2.303.0 – 2026-10-12 – KC-CLUB-BUEHNE-BEWEGUNG-2 + KC-CLUB-BUEHNE-DISCO: neue Übungen und Disco-Stücke
Twinkey kann jetzt: kleine Hüpfer, den Storch (ein Bein in der Luft, zur Hälfte Seitenwechsel), im Kreis gehen, um den Stuhl laufen (dahinter verdeckt) und – von der Seite gezeigt – mit ausgestreckten Armen aufstehen und hinsetzen (im Sitzen und im Stehen). Vier neue Disco-Stücke (Spiegelkugel-Fieber, Nachtschicht-Boogie, Samstagnacht im Kochclub, Euro-Disco Knödel); beim Training wechselt das Disco-Stück jedes Mal, im Tempo der Übungen. Die neuen Stehen-Übungen sind zwischen die bisherigen gereiht, damit sie schon in 5 Min. vorkommen.

## 2.302.0 – 2026-10-12 – KC-CLUB-BUEHNE-MUSIK: Nur Musik hören auf der Bühne, 7 Stücke
Auf der Bühne neuer Knopf „🎶 Nur Musik hören“: Twinkey tanzt, es läuft nur Musik – ohne Übungen und Ansage. Sieben Stücke (Küchen-Disco, Reggae am Kochtopf, Sonnenschein-Reggae, Funky Schneebesen, Samba in der Pfanne, Abendrot-Ballade, Biergarten-Polka), je ca. 2½ Min., dann das nächste; antippen wählt, ⏮ ⏭ ⏸, Lautstärke-Regler. Im Handy erzeugt, kein Internet.

## 2.301.0 – 2026-10-12 – KC-CLUB-SCHNECKE-NETZ: Schnecke nur bei langsamem Netz, Admin-Start schneller
Die Schnecke zeigte sich auch bei gutem Netz, weil die Rechenzeit des Servers beim Start (beim Admin bis 2,3 s) mitgezählt wurde. Jetzt zählt nur die Zeit im Netz. Außerdem rechnet der Server beim Admin-Start die Schulungszahl gleichzeitig statt danach (spart 0,2–0,8 s).

## 2.300.0 – 2026-10-12 – KC-CLUB-VIDEO-RUECKSEITE + KC-CLUB-RUECKSEITE-HILFE
Wunsch Hansi („Videos an das Eselsohr anpassen, eigenes Video über die Rückseite, Hilfetexte und Suche bei Lupe und Twinkey anpassen“). Neues Erklär-Video „📄 Die Rückseite: Eselsohr“ (12 Stationen, Thema „👤 Ich & meine App“, nur wenn das Eselsohr eingeschaltet ist): Eselsohr, fünf Reiter, Diashow, Tafel, Flipchart, Sichern & Verschicken, große Uhr (alle vier Stile werden kurz gezeigt, danach wieder der eigene), Bühne (Auswahl), Twinkey turnt (nur als Bild – ohne Musik, Ansage und Uhrwerk), die zwei Regler, Pause & Ende, Zurückdrehen. Der Kopf bleibt während des Videos umgedreht und dreht sich am Ende (auch bei ✕ Beenden) zurück; nichts wird gespeichert oder verschickt. „Versteckte Helfer“: Rückseiten-Station nennt die Regler und verweist auf das neue Video. Hilfe: Eselsohr-Text überarbeitet, neu „Rückseite: Diashow“, „Rückseite: Tafel & Flipchart“, „Rückseite: große Uhr“, „Rückseite: Bühne für Bewegung“ und „Bühne: Musik und Stimme lauter oder leiser“ – jeweils mit Knopf direkt auf den richtigen Reiter (esOeffnen; ist das Eselsohr ausgeblendet, geht es zur Einstellung). Twinkey: sechs neue Fragen (Eselsohr, Skizzieren, Bewegung zu Musik, Lautstärke, große Uhr, Diashow), neue Wortgruppen (Rückseite/umdrehen, Diashow, Skizze/zeichnen/malen, Uhr, Bewegung/Turnen/Gymnastik, Lautstärke/Regler) und Verweis auf das neue Video. Lupe („In der App“): sieben neue Einträge, die direkt auf die Rückseite springen. Neuer Tipp des Tages „Dreh doch mal den Kopf um!“.

## 2.299.4 – 2026-10-12 – KC-CLUB-BUEHNE-LOB
Wunsch Hansi („prima kommt zu kurz hintereinander“). Lobwörter (Prima, Klasse, Super, Spitze, Tip top, Toll, Bravo, Jawoll, Stark) werden gemerkt: Ein Wort kommt erst wieder, wenn fünf andere dran waren – das gilt für Lob, kurze Anfeuerungen, Endspurt- und Ausschüttel-Sprüche. „Klasse“ ist wieder dabei (im Wechsel), dazu „Tip top“, „Nicht aufgeben!“ und „Weiter so und nicht aufgeben – die neue Kochjacke soll doch passen!“.

## 2.299.3 – 2026-10-12 – KC-CLUB-BUEHNE-GERAEUSCHE
Wunsch Hansi. Topf-Trommeln: zu jedem Kochlöffel-Schlag ein blecherner Topfklang (kurzer Anschlag, unharmonische Metall-Obertöne, dumpfer Bauch), auf jede Achtel abwechselnd links/rechts – genau dann, wenn Twinkeys Löffel unten ist; auf dem Schlag etwas kräftiger. Deckel-Klatschen: wenn die Deckel zusammenkommen (auf 2 und 4), ein Becken-Krach wie im Orchester mit langem Nachklingen. Die Geräusche gehören zur Musik (folgen dem Musik-Regler, schweigen bei Pause oder ausgeschalteter Musik).

## 2.299.2 – 2026-10-12 – KC-CLUB-BUEHNE-BEGRUESSUNG
Wunsch Hansi. Kurze Anfangsrede beim Start der Bühne: „Hallo! Lass uns ein bisschen Bewegung in den Alltag einbauen. Mach nur so viel, wie dir guttut. Los geht’s!“ – danach „Als Erstes: …“ mit der Erklärung der ersten Übung. Die Begrüßung steht in der Sprechblase; die erste Vorbereitung dauert dafür 6 Sekunden länger.

## 2.299.1 – 2026-10-12 – KC-CLUB-BUEHNE-STIMME (Spruch)
Wunsch Hansi. Neuer Spruch mit Augenzwinkern für Twinkey: „Ich bin ja nicht zu dick – ich bin nur zu klein für mein Gewicht!“

## 2.299.0 – 2026-10-12 – KC-CLUB-BUEHNE-STIMME
Wunsch Hansi. Auf der laufenden Bühne links ein zweiter Keil-Regler für Twinkeys Stimme (grün; oben 📣, unten 🗣️) – gleiche Bedienung wie der Musik-Regler rechts. Unten aufs Symbol tippen schaltet stumm (🤐, rot hinterlegt, Twinkey verstummt sofort), nochmal tippen holt die vorige Lautstärke zurück; das gilt auch für die Musik (🎵 → 🔇). Beide Einstellungen werden gemerkt; die Sprechblase zeigt den Text weiterhin. „Klasse“ aus den Sprüchen genommen (jetzt „Spitze“/„Prima“). Neue Sprüche mit Augenzwinkern, bei jeder Übung einer: „Hättest du nicht so viel am Pudding genascht, bräuchten wir das jetzt nicht machen!“, „Nächstes Mal weniger Nudeln – dann schwingen die Hüften auch besser mit!“, „Alles, was du isst, muss ich zum Glück nicht auf meinen Hüften tragen!“ und neun weitere. Sprechblase schmaler, damit sie die Regler nicht verdeckt.

## 2.298.0 – 2026-10-12 – KC-CLUB-BUEHNE-LAUTSTAERKE
Wunsch Hansi („Musik immer noch zu leise“). Auf der laufenden Bühne rechts ein senkrechter Lautstärkeregler für die Musik: Keil, unten dünn (🎵) und nach oben dicker (🔊), gelb gefüllt bis zum weißen Griff; hochziehen = lauter, runter = leiser, ganz unten stumm; per Pfeiltasten bedienbar; die Einstellung wird gemerkt. Technik: Die Lautstärke sitzt jetzt hinter dem Kompressor (bisher hat der Kompressor die Musik wieder leiser gedrückt) und geht bis gut 4-fach (Standard 80 % ≈ 2,3-fach); ein Begrenzer davor verhindert Übersteuern. Die Absenkung beim Sprechen bleibt.

## 2.297.0 – 2026-10-12 – KC-CLUB-BUEHNE-KUECHE-2
Wunsch Hansi. Twinkeys Kochjacke hat jetzt 10 Knöpfe (zwei Reihen à 5). Neue Übungen aus der Küche: im Sitzen „Suppe rühren“ (beide Arme kreisen vor dem Topf), „Treppe aus dem Lager“ (Knie im Wechsel hoch), „Kopf zur Seite“ (abwechselnd links/rechts), „Nacken stärken“ (Hände am Hinterkopf, Kopf drückt dagegen), „Tisch abwischen“, „Pfanne schwenken“ (Pfannkuchen hüpft und dreht sich in der Pfanne); im Stehen „Treppe aus dem Lager“, „Hula-Hoop in der Küche“ (Rumpf kreisen mit Neon-Reifen) und „Suppe rühren“. Ton: Musik lauter (Kompressor -16 dB / 6:1), beim Sprechen nur noch auf etwa ein Drittel abgesenkt; Twinkeys Stimme leiser (70 %).

## 2.296.0 – 2026-10-12 – KC-CLUB-FLIPCHART-MUSTER + KC-CLUB-BUEHNE-80ER
Wunsch Hansi. Flipchart: ein Knopf schaltet das Papier weiter – ▢ blanko → ▦ kariert → ☰ liniert (hellgraue Linien, wird gemerkt, kommt mit ins gesicherte Bild); die Striche liegen auf einer eigenen Ebene, der Radierer nimmt nur Striche weg, Karos und Linien bleiben. Bühne: Musik deutlich lauter (mit Kompressor gegen Übersteuern), beim Sprechen schnell auf etwa ein Fünftel abgesenkt und danach sanft wieder hoch. Ansagen schneiden sich nicht mehr ab: Das Einzählen „fünf, sechs, sieben, acht“ wartet (bis 10 s), bis die Erklärung der nächsten Übung fertig ist; „Los geht’s!“ wird angehängt statt dazwischenzufahren; Nebenbei-Sprüche nur, wenn gerade niemand spricht; nur „noch 3/2/1“ und „ausschütteln“ dürfen unterbrechen. Sprüche gleichmäßig verteilt (27 · 21 · 15 · 10 · 6 · 3-2-1 Sekunden, dazu kurze Anfeuerungen). Twinkey im 80er-Look: Kochjacke in Neonfarben mit farbigen Knöpfen, bunte gerippte Stulpen über den roten Turnschuhen, Schweißbänder an beiden Handgelenken, Stirnband in der Bandfarbe, dunkle Leggings – bei jeder Übung eine andere Farbkombination.

## 2.295.0 – 2026-10-12 – KC-CLUB-FLIPCHART + KC-CLUB-ESELSOHR-2: Flipchart, Doppeltipp, ganzer Bildschirm
Wunsch Hansi. Eselsohr kleiner (28 px, Tippfläche bleibt größer); Doppeltipp öffnet und schließt (vorne wie hinten), ein einzelner Tipp erklärt es nur, Ziehen geht weiter. Neuer Reiter 📋 Flipchart: weißes Papier am Ständer mit Klemmleiste, Marker in sechs Farben, drei Dicken, Radierer, ↶; „⤴ Umblättern“ klappt das Blatt nach hinten über die Leiste (neues oder nächstes Blatt), „⤵“ holt das vorige nach vorn, „✂️“ reißt ein Blatt ab (mit Rückfrage); Blattzähler; 📤 Sichern des sichtbaren Blatts als Nachricht oder ins Archiv. Tafel und Flipchart teilen sich jetzt einen Zeichen-Kern; die Werkzeugleiste steht unter dem Papier (ganze Fläche zum Zeichnen). Die Rückseite ist so hoch, dass sie bis zur Fußleiste reicht (Kopf rückt dafür an den oberen Rand); die fünf Reiter stehen gleichmäßig nebeneinander (Symbol über dem Namen), wenig Rand. Diashow: Foto antippen blendet Leiste und Text aus, ⛶ echtes Vollbild (wo möglich), Querformat-Fotos auf weichgezeichnetem Hintergrund statt schwarzer Balken.

## 2.294.0 – 2026-10-12 – KC-CLUB-BEWEGUNGSBUEHNE-2: natürlichere Bewegungen, rote Turnschuhe, bessere Musik, mehr Sprüche
Wunsch Hansi. Grundlage: Empfehlungen für Seniorenkurse (Tempo um 120 Schläge/Min., Auf- und Abwärmen ruhiger, Rhythmus erleichtert die Anstrengung, Einzählen) und die Animations-Grundregeln (versetzte Gelenke, Nachschwingen, Mitwippen). Twinkey ist auf der Bühne jetzt eine eigene Gliederpuppe: Schulter → Ellbogen → Hand, Hüfte → Knie → Fuß, jedes Gelenk mit eigenem Drehpunkt; Unterarme schwingen leicht versetzt nach, der Körper wippt und der Kopf nickt im Takt. 23 Bewegungen neu, links/rechts gespiegelt erzeugt, Dauer in Schlägen (--b) und Start auf dem Schlag der Musik (--ph). Rote Turnschuhe mit weißer Sohle und drei weißen Streifen, Wangen. Rühren in einer Schüssel, Trommeln auf dem Topf, Nudelholz waagerecht mit beiden Händen; Fäuste in Boxhaltung. Musik: Pop/Disco-Arrangement (Am–F–C–G) mit Bass-Trommel, offenen Hi-Hats, Klatschen auf 2 und 4, Oktav-Bass, Fläche, Akkord-Stößen, Hook-Melodie mit Echo, Arpeggio, Trommelwirbel alle 8 Takte, Riser vor dem Start und Becken auf „Los!“; in Vorbereitung und Ausschütteln ruhiger. Tempo: im Sitzen 112, Küchenhelfer 116, im Stehen 120. Ansagen: Einzählen „fünf, sechs, sieben, acht“, „Los geht’s!“, je Übung zwei eigene Sprüche, 16 Lob-Sprüche, Seitenwechsel, Endspurt, „noch 3 – 2 – 1“, wechselnde Ausschüttel-Sprüche, Halbzeit- und Trink-Hinweis, Applaus am Ende. Der Spruch steht zusätzlich als Sprechblase da (bei Ankündigungen kurz).

## 2.293.0 – 2026-10-12 – KC-CLUB-BEWEGUNGSBUEHNE: Bühne für Bewegung auf der Rückseite
Wunsch Hansi: Vierter Reiter 🎭 Bühne auf der Rückseite des Kopfes. Roter Glitzervorhang, Scheinwerfer, Holzboden; Twinkey trägt ein rotes Schweißstirnband statt der Kochmütze (mit Haaren und ab und zu einem Schweißtropfen). Wahl: 🪑 Im Sitzen, 🧍 Im Stehen oder 🥄 Küchenhelfer (großer Schneebesen, Kochlöffel mit Topf zum Trommeln, Nudelholz, Wasserflaschen als Hanteln, Topfdeckel als Becken, Geschirrtuch zum Dehnen), 5/10/15 Min., Musik und Ansage einzeln abschaltbar. „Vorhang auf!“ öffnet den Vorhang; je Übung 30 s mit großem Countdown und Balken, Ansagen wie beim Fitnesstrainer (Ankündigung mit Anleitung, „Und los!“, zur Hälfte Seitenwechsel oder Lob, „Noch 10 Sekunden!“, „noch 3, noch 2, noch 1“, „und ausschütteln!“ mit Schüttel-Bewegung), am Ende Jubel und Applaus. Musik wird im Handy erzeugt (Web Audio, Pop-Takt 108 Schläge/Min., leiser, solange Twinkey spricht) – keine Datei, kein Internet. Nur auf dem Gerät, nichts gespeichert; Bildschirm bleibt an; nicht zu sehen → automatisch Pause; Zurückdrehen oder Reiterwechsel beendet Musik und Ansage. Neue Bewegungen: Winken, Seitheben, Hochdrücken, Klatschen, Trommeln, Rühren, Seitbeuge, Rollen, Hochhalten, Ausschütteln, Jubel.

## 2.292.0 – 2026-10-12 – KC-CLUB-ESELSOHR: Kopf umdrehen – Diashow, Tafel, große Uhr
Wunsch Hansi: Unten rechts am Kopf ein Eselsohr. Nach links ziehen dreht den ganzen Kopf um (3D-Drehung, ohne Animation sofort); die Rückseite ist eine große Fläche mit drei Reitern: 🖼️ Diashow (Fotos aus dem Fotoalbum, alle oder ein Album, überblendet und langsam gezoomt, ◀ ⏸ ▶; große Fassung wird nachgeladen), 🖍️ Tafel (Kreidefarben, drei Stiftdicken, 🧽 Schwamm zum Wischen, ↶ zurück, 🧹 alles abwischen mit Schwamm-Animation; 📤 Sichern: als Nachricht – gleicher Weg wie Teilen, man drückt selbst ➤ – oder ins Archiv mit Ordner-Vorschlag; die Tafel bleibt auf dem Gerät gemerkt) und 🕰️ große Uhr (Digital grün als 7-Segment, Fallblatt mit abwechselnd Uhrzeit und Datum, Bahnhofsuhr, Groß & klar – Stil wird gemerkt). Doppelt aufs Eselsohr tippen (oder nach rechts ziehen) dreht zurück. Uhr und Diashow laufen nur, solange man sie sieht. Abschaltbar unter ⚙️ → „🧩 Startseite & Ansicht“; neu im Video „Versteckte Helfer“ und im Hilfe-Zentrum.

## 2.291.0 – 2026-10-11 – KC-CLUB-VIDEO-KACHELGROESSE: Kachelgröße 3 × 3 / 4 × 4 im Video „Versteckte Helfer“
Wunsch Hansi: Drei neue Stationen nach dem Kachel-Anordnen – Einstellung unter ⚙️ → Darstellung → „Kacheln auf der Startseite“ (Finger tippt Klein und Sehr klein an), dann auf der Startseite vorgeführt: 3 nebeneinander, 4 nebeneinander, mit Hinweis auf den Sprachbefehl. Nur vorgeführt – die eigene Kachelgröße bleibt; während des Videos nimmt kachelnZeigen() die vorgeführte Größe, am Ende wieder die gespeicherte.

## 2.290.0 – 2026-10-11 – KC-CLUB-SCHLEIMSPUR-2: Schleimspur bleibt liegen
Wunsch Hansi: Die Spur wanderte mit dem Trupp mit. Jetzt steht sie fest im Streifen (rechts verankert, auch das unregelmäßige Muster) und wächst im Takt der Schnecken bis unter die erste nach. Die Glanzpunkte funkeln an Ort und Stelle statt zu wandern.

## 2.289.0 – 2026-10-11 – KC-DP-PLANERPAPIERE-QR: DP2 Build 267 übernommen
Planer-Papiere in DP2 (Leerplan, Papierplanung, persönlicher Dienstplan) tragen jetzt einen QR-Code; DP2 erkennt sie beim Einlesen und meldet veraltete Dienstpläne. In der Club-App: DP2-Bausteine (PDF, Dokument-QR) auf Build 267.

## 2.288.0 – 2026-10-11 – KC-CLUB-SCHLEIMSPUR: Schleimspur unter allen drei Schnecken, unregelmäßig und silbrig
Wunsch Hansi: Die Spur hängt jetzt am Schnecken-Trupp (wandert mit) und beginnt schon unter der ersten Schnecke – auch die erste und zweite hinterlassen sichtbar Schleim. Form über eine unregelmäßige Maske (dicker/dünner, kleine Tröpfchen), Farbe Silber, das nach hinten blasser wird, darüber laufen helle Glanzpunkte. Ohne Animation (Bewegung reduzieren) bleibt die Spur wie bisher aus.

## 2.287.0 – 2026-10-11 – KC-CLUB-AMPEL + KC-CLUB-WICHTIGKEIT: Zustell-Ampel und Wichtigkeit normal/hoch
Wunsch Hansi („nachvollziehen, ob er sie bekommen und gelesen hat“; „immer fragen, ob Wichtigkeit normal oder hoch“). Je Empfänger eine Ampel ✉️ Gesendet → 📬 Angekommen → 👀 Gelesen → ✅ Beantwortet – in den ℹ️ Infos einer Nachricht (Absender/Admin) und bei 🎓 Schulungen je Einladung (Gesendet, Angekommen, Link geöffnet, Geantwortet). Grün nur mit echter Rückmeldung (Push angezeigt/geöffnet, Mail-Anbieter, Club-App seitdem geöffnet, gelesen, Antwort); web.de meldet keine Zustellung, das wird ehrlich als grau gezeigt. Vor dem Senden fragt die App „📝 Normal / ❗ Hoch“ (je Chat höchstens alle 30 Min.; Schalter unter ⚙️ → 🔔 Benachrichtigungen, Standard an für den Admin). ❗ Hoch geht wie der Notfall immer per Push und E-Mail raus, wird an den Communicator als Priorität „high“ übergeben (Notfall „critical“) und meldet dem Absender nach 24 Std. einmal, wer noch nicht gelesen hat (Wartung, Protokoll „wichtig_ungelesen“).

## 2.286.0 – 2026-10-11 – KC-DP-FORMULARE-EINHEITLICH: Wunsch-Formulare einheitlich mit DP2-QR
DP2 Build 266 übernommen: Jeder QR auf den Wunsch-Formularen trägt jetzt auch die Dokumentart; DP2 ordnet Bögen aus der Club-App sicher über die Mitglieds-ID zu, nimmt nur ausfüllbare Wunschbögen an und meldet einen fremden Zeitraum. Bereitschaft mit mittigen Kästchen und großen Zellen, ausgefüllte Zeiten groß, ☒ als Kästchen mit Kreuz. Die Bestätigung „Meine Dienstwünsche“ hat jetzt oben rechts denselben DP2-QR mit Mitglieds-ID und größere Tageszeilen.

## 2.285.0 – 2026-10-11 – KC-CLUB-DP2-265: Wunschbogen lesbarer
DP2 Build 265 übernommen: Im gedruckten Wunschbogen (Persönliche Verfügbarkeitsmatrix) stehen Datum, Tag/Bereich und Rahmenzeit größer und mittig, die Kästchen für Sperrtag und Nur wenn nötig stehen mittig in ihren Zellen.

## 2.284.0 – 2026-10-11 – KC-CLUB-DP2-264: Regelzeit erster Markt-Freitag 10:00
DP2 Build 264 übernommen: Der erste Weihnachtsmarkt-Freitag (04.12.) hat die Regelzeit 10:00–23:00 statt 11:00–23:00 – im Twinkey, im Wunschbogen und in DP2. Alle übrigen Regelzeiten (Aufbau 08–18, Sa/So/Di/Fr 11–23, Mo/Mi/Do 13–23) entsprachen bereits der Vorgabe.

## 2.283.0 – 2026-10-11 – KC-CLUB-WINTER-KINDER-2: bunte Mützen und Schals, öfter Tropfen von den langen Zapfen
Jedes Kind trägt eine andere, kräftige Farbkombination – Mütze und Schal immer verschiedenfarbig (z. B. gelbe Mütze und grüner Schal), in einer Gruppe nie doppelt. Die Eiszapfen tropfen öfter (alle 3½–8 Sekunden), nur von den langen Zapfen und nie dreimal vom selben – unten wächst die Pfütze.

## 2.282.0 – 2026-10-11 – KC-CLUB-WINTER-KINDER: Schlitten, Schneeballschlacht, Eistropfen mit Pfütze
Im Winter sausen ab und zu zwei Kinder mit Bommelmützen auf dem Schlitten vorbei – die Schals wehen nach hinten, einmal von links, beim nächsten Mal von rechts. Abwechselnd dazu machen ein paar Kinder eine Schneeballschlacht (Würfe im Bogen, Schnee stäubt beim Treffer). Die Tropfen von den Eiszapfen sind deutlicher und fallen bis auf den Boden – dort bildet sich langsam eine blaue Pfütze.

## 2.281.0 – 2026-10-11 – KC-CLUB-EIS-TROPFEN: ab und an ein Tropfen von den Eiszapfen
Von den Eiszapfen tropft nur noch ab und an ein leicht blauer Wassertropfen – höchstens einer alle 7 bis 16 Sekunden, jedes Mal an einem anderen längeren Zapfen: er wächst an der Spitze, löst sich und fällt kurz. Bei bewegungsarmer Einstellung des Geräts keine Tropfen.

## 2.280.0 – 2026-10-11 – KC-CLUB-SCHMELZTROPFEN: Wassertropfen beim Schmelzen des Schneemanns
Wenn die Sonne den Schneemann schmelzen lässt, lösen sich blaue Wassertropfen am Rand der Kugeln und rinnen mit einer kurzen Wasserspur an ihm herunter in die Pfütze – wie beim echten Schmelzen.

## 2.279.0 – 2026-10-11 – KC-CLUB-EISZAPFEN-3: Eiszapfen realitätsnah – auch am PC
Eiszapfen werden in echten Pixeln gezeichnet statt in die Breite gezogen: am breiten PC-Bildschirm mehr Zapfen statt breiter Dreiecke. Jeder Zapfen leicht schief mit Verdickung, rundem Ende, Eis-Verlauf, Glanzkante und Kontur; oben ein unregelmäßiger Eisrand; Tropfen erscheinen nur, wenn sie fallen.

## 2.278.0 – 2026-10-11 – KC-CLUB-EISZAPFEN-2: Eiszapfen reichen bis ins Feld darunter
Eiszapfen an der Leiste mit den Lämpchen sind länger: insgesamt längere Zapfen, jeder fünfte lang, und die längsten Spitzen ragen gerade 6 px in das Feld darunter – gemessen am echten Abstand auf dem Gerät (neu gemessen beim Ein-/Ausrollen des Kopfes und beim Drehen des Handys).

## 2.277.1 – 2026-10-11 – Testvertrag an die Schneemann-Sonne angepasst
Nur Prüfung: der ältere Test „Schneemann steht 50 s“ kennt jetzt die Sonne – das Verhalten der App ist unverändert.

## 2.277.0 – 2026-10-11 – KC-CLUB-SCHNEEMANN-SONNE: Sonne lässt den Schneemann schmelzen, Schal fliegt davon · Eiszapfen länger
Nach einer Weile geht von links eine strahlende Sonne auf und steigt ein Stück über den Schneemann – er schmilzt, nur sein weinroter Schal bleibt liegen; der Wind wirbelt ihn dann mit dem Schnee durch die Luft davon. Eiszapfen an der Leiste mit den Lämpchen sind jetzt länger und unterschiedlich wie am Dach (viele kurze, einige lange, höchstens 22 px – das Infofeld bleibt frei).

## 2.276.0 – 2026-10-11 – KC-CLUB-VIDEO-INSTALL: Erklär-Videos zum Installieren + Knopf „Erweiterte Ansicht“
Neues Video-Thema „📲 App installieren“: Einführung (persönlicher Link vom Admin per WhatsApp oder E-Mail – nicht weitergeben), danach Browser wählen; je ein Video für Chrome, Edge, Samsung Internet, Safari (iPhone/iPad) und Firefox mit nachgebauten Original-Bildschirmen und Menüpunkten bis zur Kochmütze auf dem Startbildschirm; „Weiteres Gerät“ (Tablet, PC mit 6-stelligem Code) und „Link, Code & Co.“ (Unterschiede, Link verloren, Link einfügen). Einrichtungs-Assistent und Einstellungen bieten die Videos an. Der Knopf unten auf der Startseite heißt jetzt wie oben „🔧 Erweiterte Ansicht“.

## 2.275.0 – 2026-10-11 – KC-CLUB-VIDEO-ZAHLEN-2: Rundgang erklärt die Zahlen an Registern und Kacheln
Auch der Rundgang „die App im Überblick“ erklärt jetzt die Zahl hinten am Register (10 von 12 = 10 sichtbar, 2 ausgeblendet) und die Zahlen auf den Kacheln (ungelesene Nachrichten, offene Termine, offene Zettel) – die Zahlen leuchten dabei auf.

## 2.274.0 – 2026-10-11 – KC-CLUB-VIDEO-ZAHLEN: Video erklärt die Zahlen an Registern und Kacheln
Im Erklär-Video „Oberfläche nach Wunsch“ zwei neue Schritte: die Zahl hinten am Register (z. B. 10/12 = 10 Kacheln sichtbar, 2 ausgeblendet – wieder einblendbar) und die Zahlen auf den Kacheln (ungelesene Nachrichten, offene Termine, offene Zettel an der Pinnwand) – live mit aufleuchtender Zahl.

## 2.273.0 – 2026-10-11 – KC-CLUB-JAHRESZEIT-AUTOMATIK: Jahreszeiten-Automatik nach Kalender, Eiszapfen im tiefen Winter
Neue Wahl „📅 Welche Jahreszeit?“ in den Einstellungen: 🔄 Automatik (Standard) stellt die Kopfleiste nach den offiziellen Anfängen (Frühling, Sommer, Herbst, Winter – astronomisch auf die Minute) von selbst um, oder eine feste Jahreszeit. Im tiefen Winter (Winteranfang bis Februar, an Frosttagen laut frischem Wetter oder bei fester Wahl Winter) hängen kurze Eiszapfen (höchstens 9 px) an der LED-Leiste.

## 2.272.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS-8: Versteckte Helfer, Kommunikationszentrale, Sprachsteuerung (Wunsch Hansi)
- 🔎 „Versteckte Helfer“: Kochmütze (Internetseite, kommt noch), Tag/Nacht mit A/T/N (Nacht nur vorgeführt), Kopf halb/ganz einrollen, ‹ › und « » im Info-Feld, die gelben Pünktchen, im Kopf wischen, Lämpchen mit Verbindungs-Anzeige, 🐌 Schnecke und 🐢 Schildkröte, das Wort „Schnellzugriff“, Kacheln lange drücken/verschieben/umdrehen, Register anordnen und wischen, „Mehr Funktionen anzeigen“, Lupe, 👆 „Was kann ich antippen?“, Fragezeichen lange drücken, Schnellstart einrichten. Stationen aus „Oberfläche nach Wunsch“ werden wiederverwendet (bleiben gleich).
- 📡 „Kommunikationszentrale“: Anzeige mit Uhr/online/neu/Push und Ticker, an wen, Pult (Anrufen, Video, Anklopfen, Sprache, Chat, Standort, Termin), zusätzliche Wege, Schnellnachricht mit Rückmeldung.
- 🎙️ „Sprachsteuerung komplett“: einschalten, Mikrofon unten links, lange drücken = ausschalten, Liste aller Befehle (antippen = ausführen, stumm), „Nachricht an Klaus“ mit anschließendem Diktieren, weitere Befehle, Sprach-Training, Lernen/Vergessen, Diktieren in allen Feldern.
- Nur vorgeführt: nichts gespeichert, gesendet, angerufen oder eingeschaltet; Auswahl der Zentrale, Nacht-Vorschau, „Was kann ich antippen?“ und Fenster am Ende zurück.

## 2.271.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS-7: die restlichen Erklär-Videos (Wunsch Hansi)
- 🧳 „Aktionen & Reisen“: Liste, Einzelheiten (Reiseverlauf, Teilnehmer, Preis, Veranstalter), Reise-Checkliste, Fotos.
- 🏋️ „Fit bleiben“ (nur mit Freigabe): Gesundheitshinweis, Stufe und Dauer, Ansage, „Los geht's“, Auswertung.
- 🎬 „Studio: live zeigen“ (nur für Freigeschaltete): Mitglied wählen, Zustimmung, verdeckte Chats, Vorhang, 30 Minuten.
- 🔧 „Technik: Update & Sicherheit“: Version und Update, Version oben, Sicherheits-Check, Test an mich, Freigegebene Programme.
- Damit hat jede Kachel für Mitglieder ein Erklär-Video. Nur vorgeführt: keine Anmeldung, kein Training, kein Live-Zeigen, keine Test-Nachricht; Fenster schließen mit ihrem eigenen Schließen (Training/Studio sauber beendet).

## 2.270.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS-6: Rezeptbuch, Meine Schulung, Feedback (Wunsch Hansi)
- 📖 „Rezeptbuch“ (nur mit Freigabe): suchen, Arten, Rezept aufschlagen, Portionen umrechnen (live auf 10), Zutaten abhaken, Einkaufsliste/Drucken/Teilen, eigenes Rezept.
- 🎓 „Meine Schulung“: Einladung, Termin aussuchen (bei mir / bei Hansi), eigenen Termin vorschlagen, Zusammenfassung im Archiv.
- 💭 „Feedback geben“: drei Schritte antippen, Ideen/Mitteilung, ohne Namen, später ändern.
- Nur vorgeführt: nichts angelegt, gewählt oder geschickt; Fenster und Feedback-Schritt am Ende zurück. Themen: Club & Archiv, Einstieg; Twinkey bietet „Feedback“ an.

## 2.269.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS-5: vier neue Erklär-Videos (Wunsch Hansi „prüfen, ob noch Videos fehlen“)
- Abgleich Kacheln ↔ Videos: ohne Video waren u. a. Dienst, Status, Protokolle/Dokumente, Meine Daten, Aktionen, Rezeptbuch, Fit bleiben, Schulung, Studio, Feedback, Update/Sicherheit/Programme.
- Neu: 🗓️ „Mein Dienst & Dienstplan“ (Wunsch → Soll → Ist, Wünsche mit Twinkey, Wochen blättern, Zeiten vergleichen), 🟢 „Mein Status“ (Urlaub mit Bis-Datum und Hinweis), 📄 „Protokolle & Dokumente“ (Liste, Ansicht, Filter, Anleitungen), 🔐 „Meine Daten & Änderungen“ (Übersicht, Änderung melden).
- Nur vorgeführt: nichts gespeichert, gemeldet oder als gelesen markiert; Fenster und Register am Ende zurück. Themen: Termine & Dienst, Club & Archiv, Ich & meine App; Twinkey bietet die Videos bei passenden Fragen an.

## 2.268.0 – 2026-10-11 – KC-CLUB-START-HINWEIS-2: Start-Hinweis mit drei Knöpfen – Ansehen, Später, Keinen Hinweis mehr (Wunsch Hansi)
Der Hinweis auf ungelesene Nachrichten hat jetzt drei Knöpfe: „💬 Ansehen“ öffnet die Nachrichten, „⏰ Später“ fragt beim nächsten Start noch einmal (die Nachrichten-Kachel leuchtet kurz auf), „🔕 Keinen Hinweis mehr auf diese Nachrichten“ beendet den Hinweis. Knöpfe untereinander, gut lesbar.

## 2.267.0 – 2026-10-11 – KC-CLUB-START-HINWEIS: einmaliger Hinweis beim nächsten Start auf ungelesene Nachrichten (Wunsch Hansi)
Der Admin kann bei einem Mitglied einen Start-Hinweis setzen (Einstellung start_hinweis, Art „ungelesen“). Beim nächsten Start – nachdem andere Start-Fenster zu sind – kommt einmal: „Hallo <Vorname>, du hast <n> ungelesene Nachrichten. Möchtest du sie jetzt anschauen, dann tippe doch <Lage> auf die Nachrichten-Kachel – oder gleich hier auf ‚💬 Jetzt ansehen‘.“ Zahl und Lage der Kachel sind echt (erweiterte Ansicht: Register Club). „Später“ zeigt die Kachel kurz hervorgehoben. Danach erledigt; hat das Mitglied inzwischen alles gelesen, wird still erledigt. Für Willfried gesetzt (6 ungelesene Nachrichten in 5 Chats).

## 2.266.0 – 2026-10-11 – KC-CLUB-VIDEO-GESEHEN: 👁 wie oft angesehen und ✅ in der Video-Liste; alle Videos geprüft und gestrafft (Wunsch Hansi)
In der Liste der Erklär-Videos steht bei jedem Video ein Auge mit der Zahl, wie oft du es bis zum Ende angesehen hast, und ein grüner Haken, wenn du es schon gesehen hast; auf den Themen-Kacheln steht „✓ 2 von 3 angesehen“. Gespeichert beim Server (auf allen deinen Geräten gleich) und als Rückfall auf dem Gerät. Alle 22 Videos geprüft: Einstellungen und Rundgang gestrafft (weniger Aufzählungen), Hinweis auf die Videos nach Themen statt veralteter Liste, „Tippe deine Frage“, „Neu:“ beim Countdown-Häkchen entfernt, Büro-Regal kürzer; im Video Effekte & Wetter steht der Nikolaus-Stiefel nicht mehr beim Sommer. Überarbeitete Videos (Rundgang, Einstellungen) zählen bei der Bewertung neu.

## 2.265.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS-EFFEKTE: Erklär-Video „Effekte & Wetter“ (Wunsch Hansi)
- Live mit dem Finger: Kacheln schweben herein (Jalousie, Kartenstapel, Umdrehen) · Herbst mit Laubschicht und Igel · Wind oder Twinkey mit Besen (mit Spruch) · Winter mit Schneemann · Frühling · Sommer mit Sonnenblume und Twinkey mit Gießkanne (im Zeitraffer vorgespult).
- Wo eingestellt wird: Einstellungen → Effekte (Jahreszeiten im Kopf + Vorschau, Kachel- und Sende-Effekt, Hauptschalter „Animierte Knöpfe“).
- Wetter im Info-Feld: Tages-Kacheln, kurz antippen = Wetter dieses Tages, lange festhalten = alle Einzelheiten.
- Durchgehend der Hinweis: alles nur Möglichkeiten, jederzeit wieder abschaltbar. Nichts wird gespeichert; Jahreszeit, Wetter-Tag und Wetter-Fenster am Ende zurück. Thema „Ich & meine App“; Twinkey bietet das Video beim Wetter an.

## 2.264.0 – 2026-10-11 – Video „Oberfläche nach Wunsch“: Hinweis auf weitere Einstellungen (Wunsch Hansi)
Kurz vor Schluss: Es gibt noch viele weitere Möglichkeiten, die Oberfläche anzupassen – mit anderen Farben oder Spezialeffekten. Die Einstellungen findest du im Register Meins unter Einstellungen (einfache Ansicht: unten unter Mehr); dort ist noch sehr viel individuell einstellbar. Probier es gerne aus und stell es nach deinen Vorlieben und Bedürfnissen ein. Zu den Einstellungen gibt es auch eigene Erklär-Videos. Live: der Finger tippt auf Meins und auf Einstellungen, die Einstellungen öffnen sich. Außerdem weicht die Erklär-Tafel in allen Videos nach oben aus, sobald sie das gezeigte Element verdecken würde.

## 2.263.0 – 2026-10-11 – KC-CLUB-JAHRESZEIT-BUEHNE: läuft auch bei „Bewegung reduzieren“ (Fund Hansi)
- Fund Hansi „Blätter bleiben immer noch nicht liegen“: Ursache war nicht der Boden, sondern die Handy-Einstellung „Bewegung reduzieren“ (Hansis Handy meldet sie, vgl. Jalousie 2.161.0). Dann lief nur die alte Emoji-Deko (Blätter fallen durch, kein Liegen, kein Wind, kein Twinkey). Nachgestellt im Browser: mit „Bewegung reduzieren“ 0 liegende Blätter, ohne 20 nach 40 s.
- Die Bühne läuft jetzt immer; abschalten weiter mit „🍂 Jahreszeiten im Kopf“ (oder „✨ Animierte Knöpfe“ aus / Sparmodus).

## 2.262.0 – 2026-10-11 – KC-CLUB-VIDEO-LIVE-2: Kachel dreht sich im Video sichtbar um (Pinnwand), Register-Verschieben gut zu sehen (Fund Hansi)
Umdrehen: Bei „Bewegung reduzieren“ am Handy schaltet die App ihre Dreh-Animation ab – im Video wechselte die Kachel deshalb blitzartig. Jetzt dreht das Video die Kachel mit einer eigenen, langsamen Drehung: im Register Club die Kachel Pinnwand doppelt antippen, sie dreht sich bis zur Kante und zeigt die Rückseite (Neuer Zettel, Pinnwand), dann tippt der Finger auf „Pinnwand“ und die Pinnwand öffnet sich. Register: Club wird festgehalten, hebt sich, wandert Stück für Stück nach rechts, Meins und Technik rücken sichtbar nach links, Club landet am Ende; im nächsten Schritt rücken sie sichtbar zurück. Der Text nennt nur die sichtbaren Register. Außerdem bewegte sich das Abbild beim Ziehen (Kachel/Register) nicht mit – behoben. Nichts wird gespeichert.

## 2.261.0 – 2026-10-11 – KC-CLUB-VIDEO-LIVE: Erklär-Videos zeigen die Aktionen live – ein Finger tippt, drückt, zieht und wischt
Wunsch Hansi: Erklärt war es gut, aber man sah es nicht. Jetzt macht ein Zeigefinger jede Aktion vor, und sie passiert sichtbar: Kopf halb/ganz einrollen und wieder aus, im Info-Feld weiter- und zurückblättern, Kachel lange drücken → Anordnen, Kachel ziehen und loslassen, mit ▶/◀ verschieben, ✕ verbergen, 👁️ einblenden, Fertig, „Nur ausgeblendete zeigen“, Kachel doppelt antippen → dreht sich um und mit ↩ zurück, Register festhalten und ziehen, über die Kacheln wischen → nächstes Register. In den anderen Videos tippt der Finger erst „＋ Neu“, die Kachel, das Spiel, den Ordner, den Termin, die Leiste unten oder die Farbe an – dann öffnet bzw. ändert sich die Ansicht (Ursache → Wirkung). Weiterblättern wartet, bis die Vorführung fertig ist. Alles nur vorgeführt: nichts wird gespeichert oder gesendet, am Ende ist alles wie vorher.

## 2.260.0 – 2026-10-11 – KC-CLUB-SUCHE-KOCHBILD: „Kochbild“ wird in Hilfe-Suche, Lupe und Twinkey gefunden (Fund Hansi)
Die Hilfe-Suche und die Lupe suchen nach genauen Wörtern – „Kochbild“ stand nirgends. Jetzt heißt der Hilfetext „Ein Bild statt Buchstaben (Kochbild, Profilbild)“, und die Lupe kennt „Mein Bild“ unter Kochbild, Profilbild, Profilfoto, Avatar, Koch-Figur. Beides nur, wenn „Mein Bild“ für das Mitglied freigegeben ist (sonst würde die Hilfe etwas erklären, das man nicht sieht).

## 2.259.0 – 2026-10-11 – KC-CLUB-JAHRESZEIT-TWINKEY: eigener Boden, Twinkey fegt, schippt und gießt (Fund + Wunsch Hansi)
- Fund Hansi „Blätter bleiben immer noch nicht liegen“: Vermessen – unter dem Infofeld blieben nur ~8–18 px; liegendes Laub lag mit der Mitte auf der runden Unterkante, flachgedrückt und halb abgeschnitten (auf dem Handy praktisch unsichtbar). Jetzt: eigener Bodenstreifen (Kopf unten 32 statt 18 px, nicht im eingerollten Kopf), die Bühne endet 3 px über der Kante, Laub liegt ganz sichtbar (Unterkante auf dem Boden, weniger flach), nichts in den runden Ecken.
- 🧹 Herbst: im Wechsel Windstoß (Seite wechselt jedes Mal) oder Twinkey mit dem Besen – fegt das Laub weg und sagt einen Spruch („Ja, ja – im Herbst gehört das Laubfegen wohl dazu!“). ❄️ Winter: Windstoß oder Twinkey schippt den Schnee beiseite; jeder 3. Lauf bleibt der Schneemann. 🌱🌻 Frühling/Sommer: Twinkey kommt mit der Gießkanne und gießt Blumen bzw. Sonnenblume.
- Twinkey = 🧑‍🍳 wie beim Schach, mit gezeichneten Beinen und Werkzeug; der Spruch erscheint als Sprechblase. Vorschau: ⚙️ → ✨ Effekte → „🧹 Twinkey fegt“.

## 2.258.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS-OBERFLAECHE: Erklär-Video „Oberfläche nach Wunsch“
Neues Erklär-Video (Thema „Ich & meine App“): die beiden Pfeile oben (Kopf halb/ganz einrollen), ‹ › im Info-Feld, Kacheln lange drücken und verschieben (◀ ▲ ▼ ▶), mit ✕ verbergen, verborgene Kachel und 👁️ Einblenden, „Nur ausgeblendete zeigen“, Kachel per Doppeltipp umdrehen, Register festhalten und ziehen, zwischen Registern wischen. Alles wird echt vorgeführt, aber nichts gespeichert – am Ende ist die Startseite genau wie vorher. In der einfachen Ansicht: Kopf-Pfeile, Kacheln anordnen und der Weg zur erweiterten Ansicht.

## 2.257.0 – 2026-10-11 – KC-CLUB-TWINKEY-MERKEN-AUS: „Twinkey merkt sich das“ standardmäßig aus (Wunsch Hansi)
- Anlass: Die persönliche Antwort an Wilfried („Hallo Wilfried …“) landete in Twinkeys Wissen, weil der Haken von selbst an war. Jetzt ist er aus und wird nur bewusst angehakt; kurzer Hinweis darunter.

## 2.256.0 – 2026-10-11 – KC-CLUB-VIDEO-THEMEN: Erklär-Videos in Themen-Kacheln, anhaken und nacheinander abspielen
Bei vielen Videos zeigt das Fenster Themen-Kacheln (Einstieg, Schreiben & Kontakt, Termine, Club & Archiv, Ich & meine App, Spiele & Notfall; Clubleitung und Admin nur für sie) mit der Anzahl der Videos und wie viele angehakt sind. In jedem Thema Kästchen zum Anhaken, „Alle anhaken“ und ▶ für ein einzelnes Video; unten „▶ angehakte Videos nacheinander abspielen“. Nach jedem Video kommt wie bisher die 👍/👎-Frage mit „Danach: …“, dann startet das nächste; ✕ Beenden stoppt die ganze Reihe. Videos ohne Thema landen unter „✨ Weitere“.

## 2.255.0 – 2026-10-11 – KC-CLUB-TWINKEY-BEANTWORTET: gesendete Twinkey-Antworten nachsehen + Kopie (Wunsch Hansi)
- Anlass: „Hat Wilfried die Push bekommen? Wo sehe ich das? Normal bekomme ich immer eine Kopie.“
- In „📥 Fragen an Twinkey“ (nur Admin) der Bereich „📤 Beantwortet“: die letzten 30 Antworten mit Name, Zeit, Frage, vollem Antworttext, Weg und Ergebnis (🔔 Push / ✉️ E-Mail: ✅ gesendet, ⚠️ Fehler, ❔ unbekannt) und 📱 Club-App: 👀 gelesen / ⏳ noch nicht gelesen. Versandergebnis aus dem Protokoll.
- Twinkey-Antworten gehören jetzt zur Vorgangs-Kopie: der Admin bekommt eine Kopie-Mail mit Empfänger, Weg, Ergebnis und dem Text – auch bei „nur Club-App“.

## 2.254.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS-4: Erklär-Videos „Warum diese App?“ (als Erstes), Spiele und Archiv
Einleitungs-Video „💡 Warum diese App?“: motivierend und einfach – alles an einem Ort (Nachrichten, Termine, Fotos, Aktionen, Dienstwünsche mit Twinkey), einfache Bedienung, viel Hilfe, Datensicherheit; steht als Erstes in der Liste, die Startseite bietet es an, danach wird der Rundgang angeboten. Neue Videos „🎲 Spiele“ (Spiel aussuchen, gegen Computer oder Mitglieder) und „🗄️ Archiv & Clubchronik“; Twinkey bietet sie bei passenden Fragen an. Gesagt wird nur, was im Bild zu sehen ist; nichts wird gespielt, gesendet oder angelegt, Spiel- und Archiv-Stand werden zurückgestellt.

## 2.253.0 – 2026-10-11 – KC-CLUB-TWINKEY-VERGESSEN: gelernte Antworten wieder vergessen (Wunsch Hansi)
- Anlass: Die Antwort an Wilfried („Kochbild“) wurde mit „Twinkey merkt sich das“ gesendet – Twinkey hätte allen „Hallo Wilfried …“ gezeigt (vorher von Hand in der Datenbank zurückgenommen).
- In „📥 Fragen an Twinkey“ (nur Admin) jetzt die Liste „🧠 Was Twinkey gelernt hat“: Frage, Anfang der Antwort, „🗑️ Vergessen“ mit Rückfrage. Neue Server-Aktion twinkey_vergessen (nur Admin, protokolliert) setzt nur „gemerkt“ zurück – die fragende Person behält ihre Antwort unter „📬 Deine Fragen“.

## 2.252.0 – 2026-10-11 – KC-CLUB-TWINKEY-BILD + KC-CLUB-TWINKEY-VIDEOS (Fund Hansi: Wilfried fragte „Kochbild“)
- Twinkey versteht Kochbild, Avatar, Profilbild, Profilfoto, Koch-Figur, Figur, Selfie, Baukasten und antwortet mit zwei neuen Einträgen: „Wie bekomme ich ein Kochbild (Koch-Figur) statt meiner Buchstaben?“ und „Wie stelle ich meine Koch-Figur selbst zusammen oder ändere sie?“ (nur, wenn Mein Bild bzw. der Baukasten für das Mitglied freigegeben ist).
- Gibt es zur Antwort ein Erklär-Video, bietet Twinkey es an: „Du kannst es im Hilfetext nachlesen. Es gibt aber auch Erklär-Videos mit Ton. Was möchtest du dir ansehen?“ – 📖 Hilfetext lesen oder 🎬 Video starten. Zuordnung an einer Stelle (TW_VIDEOS): Bild, Nachricht, Termin, Pinnwand, Vorschlag, Zusagen, Fotoalbum, Erstattung, SOS, Helfen & Leihen, Mitglieder. Es werden nur Videos angeboten, die das Mitglied sehen darf.

## 2.251.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS-PULS: erwähnte Knöpfe pulsieren + 7 neue Erklär-Videos
- Erwähnte Knöpfe, Felder und Register pulsieren nacheinander (Leuchten + leicht größer; ohne Bewegung bei „weniger Bewegung“) – in allen Videos, ohne Liste pulst das erklärte Element.
- Neue Videos: Mitglieder/anklopfen/anrufen, Zu- und absagen, Fotoalbum, Erstattung, Hilfe/Suche/Twinkey, SOS, Helfen & Leihen. Nur gezeigt – nichts wird angerufen, gesendet, hochgeladen oder gespeichert.
- SOS-Video füllt die Seite wie sosStart (nur lesend); Termin-Info wartet auf die Terminliste. Avatar-Videos aus 2.248.0 (andere Sitzung) übernommen, kein doppeltes Video.

## 2.250.0 – 2026-10-11 – KC-CLUB-JAHRESZEIT-BUEHNE: Laub bleibt liegen, Windstoß sichtbar, längere Blüte (Fund Hansi)
- Fund Hansi „Blätter bleiben unten nicht liegen, Windstoß nicht gesehen“: Wechselt das Infofeld die Karte, ändert der Kopf seine Höhe – liegendes Laub blieb an der alten Stelle hängen (mitten im Bild oder unsichtbar unter dem Rand). Liegendes Laub und gelandete Blütenblätter merken sich jetzt ihren Abstand zum Boden und bleiben immer unten.
- Figuren (Schneemann, Sonnenblume, Topf …) ändern ihre Größe nicht mehr mit jeder Infofeld-Höhe, nur bei eingerolltem Kopf werden sie kleiner.
- Windstoß deutlicher: mehr, längere und kräftigere Windstriche, etwas länger, die Blätter wirbeln höher.
- Fund Hansi „Sonnenblume nur kurz“: Blumen und Sonnenblume blühen jetzt 2½ Minuten, der Schneemann steht 50 Sekunden.

## 2.249.0 – 2026-10-11 – KC-CLUB-JAHRESZEIT-EXTRAS: Besonderes auf der Kopf-Bühne (Wunsch Hansi)
- 🥾 Nikolaus (6.12.): gefüllter Stiefel (Mandarine, Schoko-Nikolaus, Zuckerstange, Nüsse) steht im Schnee.
- ☔ Regen: nur wenn die Wetterdaten frisch sind und es gerade regnet (Niesel, Regen, Gewitter) – Tropfen, Pfützen mit Ringen, ab und zu läuft ein gelber Schirm mit Gummistiefeln vorbei. Kein zusätzlicher Wetter-Abruf; alte Daten zeigen keinen Regen.
- 🍲 Heute ist Treffen: dampfender Kochtopf mit klapperndem Deckel und weinrotem KC-Band (bis 5 Std. nach Beginn).
- 🥚 Ostern (Karfreitag bis Ostermontag): 5 bunte Eier im Frühlingsgras – antippen, dann schlüpft ein Küken; Meldung, wie viele noch versteckt sind.
- 🦔 Herbst: ab und zu läuft ein Igel durchs Laub, bleibt kurz schnuppernd stehen, das Laub raschelt.
- Vorschau je Extra unter ⚙️ → ✨ Effekte.

## 2.248.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS-FIGUR: Erklär-Videos zur Koch-Figur (Wunsch Hansi)
- 🧑‍🍳 „Koch-Figur als Bild aussuchen“: Meins → Mein Bild, Köchinnen/Köche, Figur antippen (große Vorschau), Übernehmen/Bearbeiten, Kochjacke täglich wechselnd, eigenes Foto (nur wenn freigegeben).
- 🧩 „Eigene Figur zusammenstellen“: Selbst zusammenstellen oder Bearbeiten, Vorschau und Zufall, dann Teil für Teil mit Vorführung an einer Beispiel-Figur (Koch/Köchin, Haare, Kopfbedeckung, Bart, Gesicht, Brille, Kochjacke, Hintergrund/Halstuch), ⓘ Anzahl, Speichern – und wie man die Figur später ändert.
- Nur vorgeführt, nichts wird gespeichert; Fenster gehen am Ende wieder zu. Sichtbar nur, wenn „Mein Bild“ (bzw. der Baukasten) für das Mitglied freigegeben ist. Bewertung 👍/👎 wie bei den anderen Videos.

## 2.247.0 – 2026-10-11 – KC-CLUB-JAHRESZEIT-BUEHNE: Jahreszeiten im Kopf mit Boden (Wunsch Hansi)
- 🍂 Herbst: Laub fällt oben und bleibt unten im Kopf liegen; liegt genug, kommt ein Windstoß – abwechselnd von links und von rechts – und weht es weg.
- ❄️ Winter/Advent: Schnee bildet unten eine Decke und wird ebenso weggeweht. Jeder 3. Lauf wird daraus ein lachender Schneemann (Kochmütze, weinroter Schal mit Goldstreifen; im Advent Weihnachtsmütze), der winkt, lacht und nach einer halben Minute schmilzt.
- 🌱 Frühling: Gras wächst mit den ersten Blumen (Gänseblümchen, Tulpe, Krokus, Löwenzahn), Blüten schweben herab, Schmetterlinge; jeder 3. Lauf hoppelt ein Osterhase vorbei. 🌻 Sommer: eine Sonnenblume wächst (jeder 3. Lauf drei) mit Biene, abends Glühwürmchen; im Spätsommer fallen die Blütenblätter, dann Windstoß.
- Silvester bleibt Feuerwerk. Vorschau je Jahreszeit unter ⚙️ → ✨ Effekte. Zeichnet nur, wenn die Startseite sichtbar ist (hinter Text und Infofeld); aus bei „✨ Animierte Knöpfe“ aus, Sparmodus oder „Bewegung reduzieren“. Tippen geht durch.

## 2.246.0 – 2026-10-11 – KC-CLUB-VIDEO-BEWERTUNG: 👍/👎 am Ende der Erklär-Videos + Auswertung; Video-Ziel bleibt im Bild
- Am Ende jedes Erklär-Videos: „Hat dir das Video gefallen?“ und „Hilft es dir weiter?“ mit 👍/👎 (Abschicken/Überspringen). Server speichert je Mitglied, Video und Fassung (DB kc_club_video_bewertung).
- Admin: Erklär-Videos → 📊 Auswertung (nur Zahlen): 🟢 gut ab 80 % 👍, 🟡 beobachten, 🔴 überarbeiten unter 60 %, ⚪ unter 3 Stimmen. Überarbeitete Videos (stand hochzählen) zählen neu.
- Fund Hansi (Bildschirmfoto): Nachrichten-Video – bei langsamem Server scrollte die Chat-Rollkartei nach, „＋ Neu“ lag außerhalb, Rahmen am Rand. Kartei scrollt im Video nicht mehr, Ziel wird 6 s lang im Bild gehalten, kein Rahmen am Rand.

## 2.245.1 – 2026-10-11 – Erklär-Videos: Ziel bleibt im Bild (Rollkartei)
- Fund Hansi: Im Video „Neue Nachricht“ scrollte die Chat-Rollkartei die Seite nach unten – „＋ Neu“ war nicht zu sehen. Das Video holt das erklärte Element jetzt wieder ins Bild, wenn die Seite danach noch scrollt (gilt für alle Videos). Text zur Empfänger-Auswahl an die Bildschirm-Knöpfe angepasst. Geprüft: alle 8 Videos, beide Ansichten, alle Rollkarteien an.

## 2.245.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS-ROLLEN: Videos ohne Admin-/Leitungs-Inhalte, eigene Videos für Clubleitung und Admin
- Videos für alle erwähnen und zeigen keine Admin- oder Leitungs-Funktionen mehr (während des Videos ausgeblendet: Admin-Register/-Kacheln/-Einstellungen, Lämpchen, Herz, Brille, Büro-Kachel, Leitungs-Einstellungen).
- Neu „Für die Clubleitung: Büro & mehr“ (Büro mit Regal, Schreibtisch, Eingang, Schreiben, Telefon/Post/Drucker; Termine für alle, Abstimmung, Leitungs-Einstellungen) und „Für Admins: Leitstand“ – nur für die jeweilige Rolle sichtbar.

## 2.244.0 – 2026-10-11 – KC-CLUB-ERKLAERVIDEOS: Erklär-Videos mit Ton (Teil 2)
- Mehrere Rundgänge (Registry RUNDGAENGE): Überblick, Alle Einstellungen erklärt (mit Vorführung: Küchengrün, Nachtmodus, große Schrift – nur angezeigt, nie gespeichert), Neue Nachricht, Termin eintragen, Zettel an die Pinnwand, Vorschlag einreichen. Formulare mit Beispiel, nichts wird gesendet/gespeichert; beim Ende alles zurück.
- Neue Kachel Technik → 🎬 Erklär-Videos; Hinweis im Überblick; Auswahl auch in ❓ Hilfe & Tipps und ⚙️ Mehr; Link #rundgang=<id>. Rollkartei blättert mit.

## 2.243.0 – 2026-10-11 – KC-CLUB-RUNDGANG-HINWEIS: Hinweis auf den Rundgang auf der Startseite
- Einmalige Karte unter dem Infofeld: ▶ Jetzt ansehen / Später (morgen wieder) / Nein, danke. Erledigt wird geräteübergreifend gemerkt (Einstellung rundgang), auch wenn der Rundgang anderswo gestartet wurde.

## 2.242.0 – 2026-10-11 – KC-CLUB-PRIVAT-STARTSEITE: private Termine auf der Startseite (Countdown/Fallblatt)
- Privater Termin: neues Häkchen „📌 Auf der Startseite“ → der Termin läuft oben in der Countdown-Kachel mit (noch x Tage, am Tag selbst die Uhrzeit), auch bei „Nur Clubtreffen“. Bis zu 5, bei Reihen der nächste Termin. DB: kc_club_privattermine.startseite (Standard aus).

## 2.241.0 – 2026-10-11 – KC-CLUB-RUNDGANG: vertonter Rundgang durch die App
- 17 Stationen (Kopf, Status, Infofeld, Ansichten, Register, Kacheln, Leiste unten, Nachrichten, Termine, Pinnwand, Mitglieder, Mehr, Überblick, Hilfe): echtes Element hervorgehoben, Rest abgedunkelt, Sprachausgabe des Handys liest vor, blättert selbst weiter. Pause, ◀ ▶, Beenden; App währenddessen gesperrt, Bildschirm bleibt an, beim Verlassen Pause.
- Start: ⚙️ Mehr (einfache + erweiterte Ansicht), oben in ❓ Hilfe & Tipps, Hilfe-Eintrag „Zeig mir wo“, Link …#rundgang zum Weitergeben.

## 2.240.0 – 2026-10-11 – KC-CLUB-ANTWORT-ERINNERUNG-2T: Push-Erinnerung 2 Tage vor dem Treffen an alle ohne Zu-/Absage
- Server (Zeitplaner): 48 Std. vor einem Köcheclub-Treffen einmal Push „🔴 Bitte zu- oder absagen“ an alle aktiven Mitglieder ohne ja/nein (vielleicht zählt nicht). Einmal je Treffen (Protokoll treffen_erinnerung_2t).

## 2.239.0 – 2026-10-11 – Zu-/Absage blinkt vor der Sitzung
KC-CLUB-ANTWORT-BLINKEN: Wer noch nicht zu- oder abgesagt hat, sieht oben im Treffen-Feld „❔ Bitte zu- oder absagen“ ab 5 Tagen vor der Köcheclub-Sitzung gelb blinkend und ab 2 Tagen vorher rot dauerblinkend – bis zur Zu- oder Absage („vielleicht“ zählt nicht).

## 2.238.0 – 2026-10-11 – Anmeldestand für Gastgeber und Clubleitung
KC-CLUB-GASTGEBER-STAND: Wer bei einem Treffen als Gastgeber/in eingetragen ist (z. B. Anne beim Treffen in der Hütte), bekommt am Vorabend ab 18 Uhr und 2 Stunden vor Beginn Push und E-Mail mit dem Anmeldestand: Zusagen mit Namen, vielleicht, Absagen, noch offen, Hinweise der Teilnehmenden und „Bitte plane für … Personen“. Die Clubleitung bekommt denselben Stand.

## 2.237.0 – 2026-10-11 – Gespräch in Kopfzeile und Statusleiste
KC-CLUB-ANRUF-ANZEIGE: Während eines App-Anrufs steht oben in der App 📞 bzw. 🎥 mit Gesprächsdauer (antippen = zurück ins Gespräch); im Anrufbildschirm gibt es „⌄ Verkleinern“, um während des Gesprächs in der App weiterzublättern. In der Statusleiste des Handys erscheint ein Telefon- bzw. Kamera-Symbol mit stiller Mitteilung „Anruf mit … – läuft seit … Uhr“, die mit dem Gespräch verschwindet.

## 2.236.2 – 2026-10-11 – Frankfurt-Sicherung zeilengenau
KC-CLUB-FRA-SICHERUNG: Der erste Lauf (11.10.) sicherte 288 von 289 Teilen; ein Stück der System-Check-Messwerte war ausgepackt bis 34 MB groß und brach den Server ab. Große Tabellen werden jetzt zeilengenau nach echter Textgröße in Teile von höchstens 3 MB zerlegt; ein Teil, der dreimal abbricht, wird als Fehler gemeldet statt endlos wiederholt; die Meldung nennt gesichert/zurückgelesen statt „offen“.

## 2.236.1 – 2026-10-11 – Frankfurt-Sicherung schonender
KC-CLUB-FRA-SICHERUNG: Große Tabellen werden nach ihrer echten Größe (inkl. ausgelagerter Daten) in Teile von höchstens 3 MB zerlegt und je Schritt höchstens 8 MB verarbeitet – die 35-MB-Tabelle der System-Check-Messwerte hatte am 11.10. um 05:42 den Server kurz ausgebremst. Fortschrittsanzeige: gesichert / zurückgelesen.

## 2.236.0 – 2026-10-11 – Komplett-Sicherung nach Frankfurt
KC-CLUB-FRA-SICHERUNG: Jede Nacht sichert der Server alle Tabellen der Supabase-Datenbank als gepackte Dateien in den Neon-Dateispeicher Frankfurt (große Tabellen in Blöcken, Prüfsumme je Datei, Inhaltsverzeichnis mit Spalten), liest danach jede Datei zurück und zählt die Zeilen (Rücklese-Test). 14 Tagesstände, ältere werden gelöscht. Admin-Zentrale: Lampe „Sicherung Frankfurt“ + Füllstand; bei Fehler Push an den Admin. Außerdem melden Hintergrundfehler der App jetzt die Fundstelle mit.

## 2.235.0 – 2026-10-11 – Neustart-Knopf für Supabase
KC-CLUB-NOTFALL-NEUSTART: Admin → Supabase → „Projekt neu starten“ prüft die Datenbank-Schnittstelle und startet Supabase nach Bestätigung direkt aus der App neu – auch wenn die Schnittstelle hängt (Admin-Prüfung über den direkten Datenbank-Weg). Danach prüft die App alle 15 Sekunden, bis alles wieder läuft. Schlüssel einmalig in der App hinterlegen (nur im Server-Tresor). Der Schnittstellen-Wächter nutzt denselben Weg ohne GitHub-Secret. Sperre 20 Min., Protokoll.

## 2.234.0 – 2026-10-11 – Schnittstellen-Wächter nach dem Ausfall
KC-CLUB-SCHNITTSTELLEN-WAECHTER: Nach dem Ausfall der Datenbank-Schnittstelle am 11.10. (04:21–04:46) prüft ein GitHub-Wächter alle 5 Minuten von außen und startet das Supabase-Projekt bei einem Hänger automatisch neu (Bremse 2/Stunde, E-Mail an Hansi). Pflicht-Prüfung nach jeder Datenbank-Änderung (tools/schnittstelle-pruefen.sh). App verlässt den Notbetrieb schneller und ohne Neuöffnen. Bericht: docs/STOERUNG_SCHNITTSTELLE.md.

## 2.233.1 – 2026-10-11 – Schnellanleitung Bilderrechner Version 4.3
KC-CLUB-DOKUMENTE: „Schnellanleitung Bilderrechner“ zeigt jetzt die Kurzanleitung **Version 4.3** (`dokumente/Kurzanleitung_Bilderrechner_V4.3.pdf`, 33 Seiten). Neu: Kombi-Kacheln halb Getränk, halb Essen (bei „Grünkohl-Wurst“ die Wurst gut sichtbar), jede Kombi nur einmal; Seite 12 „Sammelbestellung“ neu aus der laufenden Kasse fotografiert (aktuelle Warengruppen-Reihenfolge, neue Kombi-Bilder). Version 4.2 bleibt als Datei unverändert (Regel 17). Die Archiv-Kopie (2.233.0) nimmt die neue Datei von selbst mit.

## 2.233.0 – 2026-10-11 – Handbücher und Schulungsunterlagen in der Archiv-Kopie
KC-CLUB-ARCHIV-KOPIE Stufe 2: Auch die PDF-Handbücher der Club-App (dokumente/) und alle PDFs aus dem Kasse-Paket (Kassen-Training Karteikarten/Übungsliste, Hüttenblatt, Scanner-Testblatt) kommen nachts in den Neon-Dateispeicher Frankfurt; neue PDFs kommen von selbst mit. Prüfung mit der Git-Prüfsumme. Persönliche Ordner werden weiter mitgesichert (Entscheidung Hansi). Admin-Zentrale zeigt die Aufteilung.

## 2.232.0 – 2026-10-11 – Archiv-Kopie in Neon Frankfurt
KC-CLUB-ARCHIV-KOPIE: Jede Nacht (2–5 Uhr) legt der Server von neuen und geänderten Archiv-Dateien eine zweite Kopie im Neon-Dateispeicher in Frankfurt ab (eigenes kostenloses Projekt „KC Archiv Kopie“, 5 GB, privat; Zugang nur im Vault). Prüfsumme wird verglichen; gelöschte Dokumente verschwinden 30 Tage nach dem Löschen auch aus der Kopie. Admin-Zentrale: Lampe „Archiv-Kopie“ (grau bei unbekannt oder älter als 26 Std.) und Füllstand-Balken.

## 2.231.1 – 2026-10-11 – Neon-Füllstand rechnet mit 1 GB
KC-CLUB-NEON-GROESSE: Neon hat das kostenlose Kontingent am 02.10.2026 auf 1 GB je Projekt verdoppelt; Admin-Zentrale (Balken, Übersicht, Speicher) rechnet jetzt mit 1 GB statt 0,5 GB.

## 2.231.0 – 2026-10-11 – Live-Abstimmung über den nächsten Sitzungstermin
KC-CLUB-LIVE-TERMIN: Am Ende der Sitzung startet der Clubsprecher „🔴 Live-Abstimmung: nächster Termin“ (bei Termine). Vorschlag aus dem Kalender: letzter Freitag im nächsten Monat, Uhrzeit und Ort wie beim letzten Treffen (änderbar). Alle mit offener App bekommen sofort ein Fenster: Termin, Blick in den eigenen Club-App-Kalender (Termine, eigene Einträge, Dienste) und ✅ Ich kann · ❔ Unter Vorbehalt · ❌ Ich kann nicht. Der Sprecher sieht das Ergebnis live mit Namen, kann den Termin annehmen (legt ihn an, Zusagen werden übernommen) oder eine Alternative zur Abstimmung stellen. Nach dem Annehmen fragt jedes Handy: „Soll ich den Termin in deinen Kalender eintragen?“ (Handy-Kalender, Google, Outlook). Läuft über die direkte Leitung.

## 2.230.0 – 2026-10-11 – Sparbremse, Alarm und weitere Bereiche an der direkten Leitung
KC-CLUB-RT-SPARBREMSE: Die Datenbank zählt die Signale der direkten Leitung je Monat (kostenlos: 2 Mio.). Ab 70 % gehen „schreibt gerade“, Live-Bild, Online, Pinnwand, Termine und Abstimmungen wieder über das normale Nachfragen, ab 95 % nur noch Alarm – es entstehen nie Kosten. Admin: Warnung per Push bei 50/70/95 %, neue Lage-Kachel „⚡ Direkte Leitung“ mit Verbrauch. Neu an der Leitung: 🚨 Alarm/Notfall-Meldung sofort, ✓✓ Gelesen-Haken, 🟢 wer online kommt, 📌 Pinnwand, 📅 Termin-Zusagen und 🗳️ Abstimmungen (geheime Stimmen ohne Signal).

## 2.229.0 – 2026-10-11 – Bildschirm zeigen an der direkten Leitung
KC-CLUB-REALTIME-VORFUEHREN: „📺 Live zeigen“ und „🔴 Mitschauen“ hängen jetzt an der direkten Leitung – jedes neue Bild meldet sich sofort beim Zuschauer (statt Nachfragen alle 0,8 s), Änderungen gehen beim Zeigenden schneller raus (alle 0,4 statt 0,7 s). Über die Leitung kommt nur das Signal, das Bild selbst weiter sicher über den Server. Ohne Leitung wie bisher.

## 2.228.0 – 2026-10-11 – Spiele an der direkten Leitung
KC-CLUB-REALTIME-SPIELE: Schach, Bauernskat, Mensch ärgere dich nicht, Tic-Tac-Toe & Co. hängen jetzt an der direkten Leitung – der Zug des Gegners, neue Herausforderungen, Annahme und Aufgabe kommen sofort statt im 3-Sekunden-Takt. Steht die Leitung, fragt das Spiel nur noch alle 30 s zur Sicherheit nach (bei laufender Schachuhr wie bisher).

## 2.227.0 – 2026-10-11 – LED für die direkte Leitung
KC-CLUB-REALTIME-LED: Neue LED oben (nur Admin) zeigt die direkte Leitung: 🟢 steht – Neues kommt sofort, 🟡 wird aufgebaut oder antwortet nicht, 🔴 unterbrochen (die App fragt solange selbst nach), 🔵 pausiert (Hintergrund/Notbetrieb), ⚪ nicht verfügbar. Antippen zeigt Stand, Anzahl der Signale und „🔄 Neu verbinden“. Antwortet die Leitung 90 s nicht, baut die App sie selbst neu auf.

## 2.226.0 – 2026-10-11 – Direkte Leitung (Realtime) für Chat, Anklopfen und Anrufe
KC-CLUB-REALTIME: Die App hält eine direkte Leitung zum Server (Supabase Realtime, kostenlos). Neue Nachrichten, „schreibt gerade“, Anklopfen und Anrufe kommen sofort statt im Abfrage-Takt – das spart Akku und Server-Aufrufe. Über die Leitung kommt nur ein Signal („es gibt Neues“), nie Text oder Namen; der Inhalt kommt wie bisher sicher über den Server. Fällt die Leitung aus, fragt die App wie früher selbst nach und verbindet sich von allein neu.

## 2.225.0 – 2026-10-11 – Suche verzeiht Tippfehler
KC-CLUB-SUCHE-UNSCHARF: Die Suche findet auch bei Tippfehlern – „Würdemann“ findet Wördemann, „Wilfried“ findet Willfried, auch nur der Wortanfang („Würd“). Gilt für die große Suche (Mitglieder, Aktionen, Chats/Gruppen, App-Funktionen), das Hilfe-Zentrum und die Mitglieder-Auswahl (Telefon, Kontakt teilen, SOS). Erst kommen genaue Treffer; ähnliche nur, wenn es keine genauen gibt. Findet die Suche nichts: „🔎 Meintest du …?“.

## 2.224.0 – 2026-10-10 – Dienst-Gruß mit Kochjacke und Wetter · Checkliste „Nicht mehr erinnern“
KC-CLUB-DIENST-GRUSS: Wer heute Dienst hat, bekommt beim Start ein Fenster „Ich wünsche dir einen angenehmen Dienst heute!“ mit Schicht, Kochjacke (Weihnachtsmarkt: Freitag, Samstag, Sonntag rot – sonst weiß) und Kleidungs-Hinweisen aus dem Wetter (Kälte → Handschuhe und Mütze, Regen → Schirm, Schnee, Wind). Während des Weihnachtsmarkts zusätzlich morgens eine Push; die Erinnerung am Vorabend nennt die Kochjacke. Reise-Checkliste: Wahl „🔕 Nicht mehr erinnern“.

## 2.223.0 – 2026-10-10 – Reise-Checkliste für die Kreuzfahrt + Nachrichten-Kachel mahnt
KC-CLUB-REISE-CHECKLISTE: 14 Tage vor einer Kreuzfahrt bekommt jede/r Teilnehmende die persönliche Checkliste angeboten – ausdrucken (PDF auf dem Köcheclub-Kopfbogen, zweispaltig mit Blöcken inkl. Hilfsmitteln, unten leerer Block) oder am Bildschirm abhaken (Stand auf allen Geräten); Ablage im eigenen Archiv-Ordner; 2 Tage vorher Erinnerung, wenn noch etwas offen ist. KC-CLUB-NACHRICHT-MAHNUNG: Kachel „Neue Nachr.“ blinkt rot/orange bei ungelesenen Nachrichten älter als 5 Tage, bei ❗ wichtigen sofort und schneller – bis alles gelesen ist.

## 2.222.0 – 2026-10-10 – 🔔 Wer fehlt noch? + Änderung direkt eintragen
🔔 In der Dienstzeiten-Übersicht steht, wer noch keine Dienstwünsche abgegeben hat – mit Knopf „Freundlich erinnern“. ✅ Freigegebene Änderungsmeldungen kann der Admin selbst eintragen, wenn der KC Manager sie nicht abholt.

## 2.221.0 – 2026-10-10 – 📋 Kopie aller Vorgänge an den Admin
📋 Bei jedem Vorgang (Änderungsmeldung, Erstattung, Dienstwunsch, Zugang, Leihen) bekommt der Admin eine Kopie-Mail – mit Empfänger und ob die Zustellung geklappt hat

## 2.220.0 – 2026-10-10 – 👁️ Foto nur einmal ansehen
👁️ Fotos im Chat lassen sich als „Einmal ansehen“ senden: Der Empfänger kann es nur ein einziges Mal öffnen (mit seinem Namen als Wasserzeichen), danach ist es weg – ein zweiter Versuch zeigt einen Hinweis. Kein Weiterleiten, Speichern oder Ablegen.

## 2.219.0 – 2026-10-10 – 🧑‍🍳👑 Fang den Koch und Doppelkopf gegen Mitglieder
🧑‍🍳 Fang den Koch gegen ein Mitglied: Gerichte und Länge beim Herausfordern wählen; der Server würfelt, mischt, stellt die 🧪 Hygienefrage und prüft jeden Schritt; fremde Handkarten bleiben verdeckt (KC-CLUB-FDK-MG)
👑 Doppelkopf gegen ein Mitglied: ihr zwei sitzt euch gegenüber, zwei Computer-Köche spielen mit; Hochzeit/still allein für jeden; fremde Hände verlässt nie den Server (KC-CLUB-DK-MG)
📅 Wie bei allen Partien: nicht online → Terminanfrage, Revanche, Aufgeben, Pokal und Rangliste
🗄️ Datenbank: Migration 20261010_kc_club_v2219_fdk_dk_mitglieder.sql (zwei Spalten, Prüfregeln) – vor dem Herausfordern einspielen

## 2.218.0 – 2026-10-10 – ⚠️ Warnung beim Selbstlöschen
⚠️ Wer Selbstlöschen einschaltet, wird jetzt deutlich gewarnt: Die Nachrichten verschwinden auf allen Geräten und können nicht wiederhergestellt werden

## 2.217.0 – 2026-10-10 – 📝 Wunschzeiten unter Dienstpläne
📝 Unter 🗓️ Dienstpläne stehen jetzt auch die abgegebenen Wunschzeiten (Kann, Wunsch, Wenn nötig, Sperre) – deutlich als „unter Vorbehalt“ markiert, bis der Dienstplan veröffentlicht ist

## 2.216.0 – 2026-10-10 – 🏠 Start führt zur Startseite
🏠 Der Start-Knopf unten links führt aus dem Admin-Register (und auf der Startseite aus jedem Register) zurück zur Startseite

## 2.215.0 – 2026-10-10 – 🎲 Gleiche Knöpfe in allen Spielen
🎲 Tic-Tac-Toe, Schach, Bauernskat, Küchenterror, Mensch ärgere dich nicht, Fang den Koch und Doppelkopf haben dieselbe Knopfleiste im festen Raster (Handy 3, breit 4 nebeneinander): Spielknöpfe · ↺ Neues Spiel · ✖ Abbrechen · 🔔 Töne · 🔊 Ansage · Extras
✖ Abbrechen überall (fragt, zählt nicht, Spielstand bleibt); ↺ Neues Spiel auch mitten im Spiel
🔔 Töne in allen Spielen mit einem gemeinsamen Schalter (KC-CLUB-SPIELE-LEISTE)

## 2.214.0 – 2026-10-10 – 🪟 Zweite Jalousie im Kopf
🪟 Oben im Kopf gibt es jetzt zwei Pfeile: ⌃ rollt nur das Infofeld ein (Status und LEDs bleiben), ⌃⌃ rollt alles bis auf die Kopfzeile ein

## 2.213.0 – 2026-10-10 – 🃏 Fang den Koch wird spannender
🃏 Aktionskarten auf die Hand (max. 3): Turbo (2 Würfel), Abkürzung, Zutat klauen, Gas abdrehen, Lieferant, Mise en place, Schutzschild – im eigenen Zug vor dem Würfeln ausspielen; beide starten mit derselben Karte
📦 Knappe Vorräte: jede Station hat 2 Portionen, leer heißt warten – im Büro wird alles nachbestellt
⚡ Mehr Tempo und Töne (Würfel, Schritte, Kochen, Pech/Glück) – schaltbar mit 🔔 Töne an/aus; Twinkey spielt seine Karten selbst (KC-CLUB-FDK-SPANNUNG)

## 2.212.0 – 2026-10-10 – 🕐 Datum und Uhrzeit im Countdown
📆🕐 Der Countdown zeigt im Wechsel auch das Tagesdatum und die Uhrzeit – im Fallblatt als Klappkarten

## 2.211.0 – 2026-10-10 – 🔢 Fallblatt sortiert sich ab und zu neu
🔢 Fallblatt-Anzeige: jeder 20. Wechsel rattert kurz durch, als ob sie sich neu sortiert

## 2.210.0 – 2026-10-10 – 🔢 Fallblatt-Anzeige für den Countdown
🔢 Countdown oben wahlweise als Fallblatt-Anzeige wie am Bahnhof (⚙️ → Startseite & Ansicht)

## 2.209.1 – 2026-10-10 – 🧪 Testversion (RC) für 3.0 – Freigabeplan
🧪 Testwoche vor der fertigen Version 3.0

## 2.209.0 – 2026-10-10 – 🔧 Gesamtprüfung: viele kleine Verbesserungen
🔧 Gesamtprüfung: zuverlässiger offline und bei Updates, Push-Antippen führt direkt zum Ziel, klarere Meldungen

## 2.208.0 – 2026-10-10 – 🎄 Countdown bis zum Weihnachtsmarkt
🎄 Oben im Countdown: „Weihnachtsmarkt · 55 Tage“, während er läuft „läuft!“

## 2.207.0 – 2026-10-10 – 🟢 Ameisenlauf an der Mitglieder-Kachel, wenn jemand online ist
🟢 Ist jemand online, läuft ein grüner Ameisenlauf um die Mitglieder-Kachel

## 2.206.0 – 2026-10-10 – ↻ Umschaltknöpfe statt Knopfreihen
↻ Aufgeräumt: statt mehrerer Knöpfe ein Umschaltknopf – antippen schaltet weiter, lange drücken zeigt alle

## 2.205.0 – 2026-10-10 – 🚢 Schiffsymbol bei der Kreuzfahrt
🚢 Kreuzfahrt im Countdown mit Schiff

## 2.204.0 – 2026-10-10 – 🕯️ Gedenkkerze für verstorbene Mitglieder
🕯️ Gedenkkerze, wenn ein Mitglied verstorben ist

## 2.203.0 – 2026-10-10 – ⏳ Countdown in kurzen Sätzen
⏳ Countdown kurz: „Weihnachten 75 Tage“, „Clubtreffen 6 Tage“, „Geb. Klaus 3 Tage“

## 2.202.0 – 2026-10-10 – ⏳ Wechselnder Countdown oben: Treffen, Reisen, Weihnachten, Geburtstage
⏳ Oben wechselt der Countdown: Clubtreffen, eigene Reisen, Weihnachten, Silvester, Geburtstage – einstellbar

## 2.201.0 – 2026-10-10 – 🧰 Werkzeugkasten beim Live zeigen: Pfeil, Einkreisen, Punkt
🧰 Beim Live zeigen: Pfeil, rot einkreisen und ein strahlender Punkt

## 2.200.0 – 2026-10-10 – 👉 Zeigepfeil beim Live zeigen · Warte-Mütze nur nach eigenem Tippen · 🟢 Online-Mitglieder vorne in der Rollkartei
👉 Roter Zeigepfeil beim Live zeigen · keine Warte-Mütze mehr im offenen Chat

## 2.199.0 – 2026-10-10 – 🔊 Live zeigen mit Ton: beim Zeigen miteinander sprechen
🔊 Beim Live zeigen könnt ihr jetzt miteinander sprechen

## 2.198.0 – 2026-10-10 – 📺 Zuschauen-Einladung: Danebentippen sagt nicht mehr ab
🔧 Kleine Systemverbesserungen

## 2.197.0 – 2026-10-10 – ⌨️ Schreibfeld bleibt über den Nachrichten
🔧 Kleine Systemverbesserungen

## 2.196.0 – 2026-10-10 – ⌨️ Lange Nachrichten bei offener Tastatur scrollbar
🔧 Kleine Systemverbesserungen

## 2.195.0 – 2026-10-10 – 🐌 Schnecken als Trupp mit Schleimspur
🔧 Kleine Systemverbesserungen

## 2.194.0 – 2026-10-10 – 🎙️ Sprachsteuerung: Chat öffnen ohne falschen Text
🔧 Kleine Systemverbesserungen

## 2.193.0 – 2026-10-10 – 💬 Chat-Kartei: besser lesbar
🔧 Kleine Systemverbesserungen

## 2.192.0 – 2026-10-10 – 🔄 Neuladen per Ziehen nur auf der Startseite
🔧 Kleine Systemverbesserungen

## 2.191.0 – 2026-10-10 – 💬 Chats als Rollkartei, Jalousie weg
🔧 Kleine Systemverbesserungen

## 2.190.0 – 2026-10-10 – 🪟 Jalousie rollt sofort und schneller hoch
🔧 Kleine Systemverbesserungen

## 2.189.0 – 2026-10-10 – 👥 Mitglieder-Kartei: mehr Platz
🔧 Kleine Systemverbesserungen

## 2.188.0 – 2026-10-10 – 🪟 Rollkartei: echte Jalousie
🔧 Kleine Systemverbesserungen

## 2.187.0 – 2026-10-10 – 🪟 Rollkartei mit Jalousie
🔧 Kleine Systemverbesserungen

## 2.186.0 – 2026-10-10 – 🗂️ Liste: Bereiche wieder antippbar
🔧 Kleine Systemverbesserungen

## 2.185.0 – 2026-10-10 – 👥 Mitglieder als Rollkartei
🔧 Kleine Systemverbesserungen

## 2.184.0 – 2026-10-10 – 🗂️ Rollkartei in den Einstellungen wählbar
🔧 Kleine Systemverbesserungen

## 2.183.0 – 2026-10-10 – 🗂️ Rollkartei: antippen, drehen, endlos
🔧 Kleine Systemverbesserungen

## 2.182.0 – 2026-10-10 – 🗂️ Rollkartei: Mikrofon verdeckt das Rad nicht mehr
🔧 Kleine Systemverbesserungen

## 2.181.0 – 2026-10-10 – ⏱️ Startstatistik: Hintergrund-Starts getrennt
🔧 Kleine Systemverbesserungen

## 2.180.0 – 2026-10-10 – 🗂️ Einstellungen als Rollkartei
🔧 Kleine Systemverbesserungen

## 2.179.0 – 2026-10-09 – 🕊️ Effekte auch für später gelesene Nachrichten
🔧 Kleine Systemverbesserungen

## 2.178.0 – 2026-10-09 – ✈️ Flieger lässt Buchstaben regnen – daraus wird die Nachricht
🔧 Kleine Systemverbesserungen

## 2.177.0 – 2026-10-09 – 🕊️ Nachricht kommt beim Empfänger mit Taube, Flieger, Postauto oder Blaulicht an
🔧 Kleine Systemverbesserungen

## 2.176.0 – 2026-10-09 – 🚐 Senden: gelbes Postauto, bei ❗ wichtig Blaulicht
🔧 Kleine Systemverbesserungen

## 2.175.0 – 2026-10-09 – 🕊️ Senden: Papierflieger in Schlangenlinien oder Brieftaube
🔧 Kleine Systemverbesserungen

## 2.174.0 – 2026-10-09 – ✉️ Papierflieger größer und auffälliger
🔧 Kleine Systemverbesserungen

## 2.173.0 – 2026-10-09 – 🗣️ Admin kann Online-/Verlassen-Ansagen für ein Mitglied einschalten (KC-CLUB-ANSAGE-VORGABE)
🔧 Kleine Systemverbesserungen

## 2.172.0 – 2026-10-09 – ✨ Neue Effekte: Papierflieger beim Senden, Zettel wird angepinnt, Zahlen zählen hoch, Jahreszeiten im Kopf, Geburtstagskerze (KC-CLUB-EFFEKTE-2)
🔧 Kleine Systemverbesserungen

## 2.171.0 – 2026-10-09 – 🐌 Schnecken wandern wieder (auch bei „Bewegung reduzieren“ am Handy) und kriechen dabei
🔧 Kleine Systemverbesserungen

## 2.170.0 – 2026-10-09 – 🎙️ Sprachbefehle-Liste: jeder Befehl lässt sich antippen und führt aus (KC-CLUB-SPRACHE-LISTE-TIPPEN)
🔧 Kleine Systemverbesserungen

## 2.169.0 – 2026-10-09 – 🎬 Spezialeffekte: Kacheln als Jalousie, Kartenstapel oder Umdrehen beim Register-Wechsel + 🎉 Konfetti bei Sieg und Geburtstag (KC-CLUB-REGISTER-EFFEKTE, KC-CLUB-KONFETTI)
🔧 Kleine Systemverbesserungen

## 2.168.0 – 2026-10-09 – 🗂️ Datei-Menü in Ordnern (rechte Maustaste/lang drücken: Ausschneiden, Kopieren, Einfügen, Senden, Speichern, Löschen) + ⏳ auch eigene alte Nachrichten selbstlöschend (KC-CLUB-ARCHIV-MENUE, KC-CLUB-SELBSTLOESCHEN-ALT)
🔧 Kleine Systemverbesserungen

## 2.167.0 – 2026-10-09 – 📄 Anlage im Chat antippen öffnet wieder das richtige Fenster (KC-CLUB-ANLAGE-OEFFNEN)
🔧 Kleine Systemverbesserungen

## 2.166.0 – 2026-10-09 – 📄 PDF-Anlagen: zweiter Weg + Diagnose (KC-CLUB-ANLAGE-OEFFNEN)
🔧 Kleine Systemverbesserungen

## 2.165.0 – 2026-10-09 – 📄 PDF-Anlagen öffnen sich direkt in der App (KC-CLUB-ANLAGE-OEFFNEN)
🔧 Kleine Systemverbesserungen

## 2.164.0 – 2026-10-09 – 📎 Anlage geht nicht mehr verloren: Senden wartet, bis sie hochgeladen ist (KC-CLUB-ANLAGE-WARTEN)
🔧 Kleine Systemverbesserungen

## 2.163.0 – 2026-10-09 – ⏳ Selbstlöschen-Leiste antippbar mit Erklärung (KC-CLUB-SELBSTLOESCHEN)
🔧 Kleine Systemverbesserungen

## 2.162.0 – 2026-10-09 – ⚡ Schnellerer Start: weniger Datenbank-Anfragen (ungelesene je Chat in einer Abfrage, gebündelte Lesungen) (KC-CLUB-START-PARALLEL-3)
🔧 Kleine Systemverbesserungen

## 2.161.0 – 2026-10-09 – 🪟 Kopf-Jalousie läuft auch bei „Bewegung reduzieren“ (KC-CLUB-KOPF-ROLLO)
🔧 Kleine Systemverbesserungen

## 2.160.0 – 2026-10-09 – 🪟 Kopf-Jalousie: echte Lamellen, fährt langsam hoch und runter (KC-CLUB-KOPF-ROLLO)
🔧 Kleine Systemverbesserungen

## 2.159.0 – 2026-10-09 – 🪟 Kopf als Jalousie: Pfeil oben rollt den Kopf ein und aus (KC-CLUB-KOPF-ROLLO)
🔧 Kleine Systemverbesserungen

## 2.158.0 – 2026-10-09 – Korrektur: Startmessung-Test (KC-CLUB-START-PARALLEL-3)
🔧 Kleine Systemverbesserungen

## 2.157.0 – 2026-10-09 – ⚡ Schnellerer Start: Server-Teilzeiten messen, Kachel-Zahlen gleichzeitig (KC-CLUB-START-PARALLEL-3)
🔧 Kleine Systemverbesserungen

## 2.156.0 – 2026-10-09 – Korrektur: Startdaten wieder vollständig (Einstellungen, ungelesen, Aufgaben)
🔧 Kleine Systemverbesserungen

## 2.155.1 – 2026-10-09 – Korrektur: Startdaten wieder vollständig (Einstellungen, ungelesen, Aufgaben)
🔧 Kleine Systemverbesserungen

## 2.155.0 – 2026-10-09 – ⚡ Schnellerer Start: Server fragt beim Start alles gleichzeitig ab, misst seine Zeit mit; Büro-Absturz bei Adresse ohne Kennung abgesichert (KC-CLUB-START-PARALLEL-2)
🔧 Kleine Systemverbesserungen

## 2.154.1 – 2026-10-09 – 🧮 Schnellanleitung Bilderrechner Version 4.2
- Meine Dokumente: Kurzanleitung Bilderrechner **Version 4.2** (33 Seiten) ersetzt Version 4.1.
- Teil 7 neu: **Reklamation** mit Bildkacheln und Anzahl (mehrere Artikel, Schuss Rum/Amaretto), Pfand als Spende
  mit Rückfrage; Personalverbrauch, Konto und Menge mit aktuellen Bildern.
- Teil 8 neu: **geparkte Bons verbinden** (Markieren, Verbinden, Alle holen), **halbe Portion** fest auf 0,5 mit
  Auflösen über den Mülleimer, **Gutschein einlösen auch bei zu wenig Guthaben** (Teilzahlung).
- Gutschein gilt bis zum 31.12. des dritten Jahres. Version 4.1 bleibt als Datei erhalten.

## 2.154.0 – 2026-10-09 – 🧑‍🍳 Fang den Koch: Küchenrallye gegen Twinkey (Wunsch Hansi)
Fang den Koch ist neu gebaut – wie ein Brettspiel (KC-CLUB-FDK-RALLYE, ersetzt KC-CLUB-FDK-EINFACH):
- Rundweg mit 24 Feldern um die Küche: 🌾 Lager, 🧊 Kühlhaus, 🥕 Gemüse, 🧂 Gewürzregal, 🔥 Herd, 🍟 Fritteuse, ♨️ Ofen, 📋 Büro,
  ❗ Ereignisfelder; in der Mitte der 🛎️ Pass mit Klingel, erreichbar über vier Durchreichen.
- Würfeln, dann ein leuchtendes Feld antippen – links- oder rechtsherum; an einer Station, die man braucht, darf man
  unterwegs anhalten („Halt“, Rest-Augen verfallen). Erst alle Zutaten holen, dann kochen (manches dauert 2 Züge), dann
  an einer Durchreiche abgeben – die Klingel stoppt die eigene Stoppuhr.
- Stoppuhr in Küchenminuten (jeder Wurf 3 Min.) – die echte Zeit zählt nicht. Punkte je Gericht: Grundpunkte
  (leicht 10 / mittel 15 / schwer 20), Tempo unter der Richtzeit, +3 Erster am Pass, +2 sauber gearbeitet;
  −3 je vergessene Zutat, −5 je fehlender Schritt („🛎️ Jetzt abgeben“ an der Durchreiche, mit Rückfrage).
- Gerichte nach Stufe: leicht z. B. Pfannkuchen, mittel z. B. Gulasch, schwer z. B. Rinderroulade. Beide Köche bekommen
  gleich schwere Gerichte mit gleich vielen Zutaten und Arbeitsschritten und ähnlich langem Weg. Länge 1, 2 oder 3 Gerichte.
- ❗ Ereigniskarten: Azubi lässt etwas fallen, Gemüse braun, Kühlhaus offen, kein Gas (erst ins 📋 Büro), Fritteuse
  übergeschäumt, 🧪 Hygienekontrolle mit einer Frage aus Küchenterror; Glück: Lieferant, Chef hilft, Spüler, Mise en place, Lob.
- Zusammenstoß: Landet ein Koch im Gang genau auf dem anderen, lässt der eine Zutat fallen.
- Twinkey (blaue Mütze) ist der Gegner – mit Sprüchen und Männerstimme (🔊 Ansage); Tabletts links (Du) und rechts (Twinkey),
  auf dem Handy nebeneinander über dem Brett; während der Partie ist oben alles ausgeblendet; wer anfängt, wechselt.
- Abrechnung am Ende mit Punkten je Gericht; der bisherige Spielstand bleibt erhalten.
- Geprüft mit 450 durchgespielten Partien im Vertragstest (Länge, Fairness, Tempo-Bonus, Pech-Anteil) und im Browser.

## 2.153.0 – 2026-10-09 – 🕶️ Inkognito: beim Chat-Beginnen fragen, ob Inkognito aufgehoben werden soll (KC-CLUB-INKOGNITO-CHAT)
🔧 Kleine Systemverbesserungen

## 2.152.0 – 2026-10-09 – 🎓 Sprach-Training: Sätze nachsprechen, die App lernt wie jeder spricht (Satz- und Namens-Varianten), Tipp des Tages für alle (KC-CLUB-SPRACH-TRAINING)
🔧 Kleine Systemverbesserungen

## 2.151.0 – 2026-10-09 – 🎙️ Sprache: Kachelgröße und Einstellungen genau ansteuern, „Chat mit … öffnen“, Gelerntes vergessen (KC-CLUB-SPRACHE-EINSTELLUNG, KC-CLUB-SPRACHE-VERGESSEN)
🔧 Kleine Systemverbesserungen

## 2.150.0 – 2026-10-09 – 🪧 Schilder-Druckerei im Büro: Vorlagen nach Anlass, gestalten, drucken, an Mitglieder senden, ablegen, wiederverwenden (KC-CLUB-SCHILDER)
DB (Weg B): 20261009_kc_club_v2150_schilder.sql – neue Tabelle kc_club_schilder (gespeicherte Schilder, weich löschbar); Server: schild_liste / schild_speichern / schild_loeschen (nur Clubleitung).
🔧 Kleine Systemverbesserungen

## 2.149.0 – 2026-10-09 – Spruch im Corporate Design: „Gemeinsam kochen, gemeinsam helfen“ (KC-CLUB-CD-SPRUCH)
🔧 Kleine Systemverbesserungen

## 2.148.0 – 2026-10-09 – ⏳ Nachrichten löschen sich selbst (je Chat oder je Nachricht: 1 Std / 24 Std / 7 Tage) + ✕ Text im Schreibfeld löschen (KC-CLUB-SELBSTLOESCHEN, KC-CLUB-EINGABE-LEEREN)
DB (Weg B): 20261009_kc_club_v2148_selbstloeschen.sql – zwei neue Tabellen, Löschfunktion, Zeitplaner alle 5 Minuten; Kern-Tabellen unverändert. Push/Mail selbstlöschender Nachrichten ohne Text.
🔧 Kleine Systemverbesserungen

## 2.147.0 – 2026-10-09 – 🎄 Büro-Ordner „Weihnachtsmarkt“ mit Jahren (2026, 2027 …) und Unterregistern (Checklisten, Verträge …) (KC-CLUB-ARCHIV-UNTERREGISTER)
🔧 Kleine Systemverbesserungen

## 2.146.0 – 2026-10-09 – 🗑️ Briefbogen: Knopf „Verwerfen“ löscht den Entwurf (KC-CLUB-BRIEF-VERWERFEN)
🔧 Kleine Systemverbesserungen

## 2.145.0 – 2026-10-09 – 🎨 Chat-Farben: eigene und fremde Sprechblasen + Hintergrund mit Motiv (Wolken, Sonnenuntergang, Schneeberge …) – für alle Chats (KC-CLUB-CHAT-FARBEN)
🔧 Kleine Systemverbesserungen

## 2.144.0 – 2026-10-09 – 🗂️ Inhaltsverzeichnis auf dem Bildschirm: Ordner, Register oder Dokument antippen öffnet genau das – füllt sich selbst (KC-CLUB-INHALTSVERZEICHNIS-ANTIPPEN)
🔧 Kleine Systemverbesserungen

## 2.143.0 – 2026-10-09 – 🎬 Studio-Kachel nur noch unter „Meins“ bei freigeschalteten Mitgliedern (Admin: Studio-Karte im Kopf)
🔧 Kleine Systemverbesserungen

## 2.142.0 – 2026-10-09 – 🐌 Schnecken wandern auch im Sparmodus (KC-CLUB-SCHNECKEN-WANDERN)
🔧 Kleine Systemverbesserungen

## 2.141.0 – 2026-10-09 – ♟️ Schach: Seite bleibt beim Schieben ruhig (Wunsch Hansi)
Beim Schieben einer Figur mit dem Finger verschob sich manchmal die ganze Seite. Jetzt bewegt sich in einer laufenden Partie
auf dem Brett nichts mit – auch am Rand mit den Zahlen und während Twinkey überlegt; die Seite federt nicht nach und lädt
nicht neu, wenn man über den Rand hinaus zieht (Android). Unter dem Brett lässt sich die Seite weiter normal schieben.
Zusätzlich eine Sperre per Programm für iOS, das die CSS-Sperre nicht überall beachtet (KC-CLUB-SCHACH-STILL).

## 2.140.0 – 2026-10-09 – 🔴 ON-AIR-Schild wie im Filmstudio, solange eine Live-Verbindung läuft (KC-CLUB-ON-AIR); 🎬-Knopf aus der Statusleiste entfernt (Studio als Kachel + Karte)
🔧 Kleine Systemverbesserungen

## 2.139.0 – 2026-10-09 – 🎬 Studio als Karte im Kopf – aufgebaut wie die Admin-Zentrale (Anzeige mit Lämpchen und Uhr, Online-Mitglieder, Pult) (KC-CLUB-STUDIO-KARTE)
🔧 Kleine Systemverbesserungen

## 2.138.0 – 2026-10-09 – Push bei neuen Nachrichten nur, wenn das Mitglied gerade nicht in der App ist (KC-CLUB-PUSH-NUR-OFFLINE); 🎬 Studio auch als Kachel
🔧 Kleine Systemverbesserungen

## 2.137.0 – 2026-10-09 – 🎙️ Sprachsteuerung „Neuen Brief diktieren“: Büro + Briefbogen öffnen, dann Art, Empfänger (Mitglied/Adressbuch), Anrede, Betreff, Text, Gruß abfragen (KC-CLUB-SPRACHE-BRIEF)
🔧 Kleine Systemverbesserungen

## 2.136.0 – 2026-10-09 – 🎬 Studio-Zentrale: Mitglied wählen, Foto · Mitschauen · Live zeigen an einem Platz, Uhr, Fotos speichern, Freischalten; echtes Live statt Fotos (KC-CLUB-STUDIO)
🔧 Kleine Systemverbesserungen

## 2.135.0 – 2026-10-09 – Bildschirm-Schnappschuss/Live: Bild bei mir speichern (Fotos über Teilen-Menü)
🔧 Kleine Systemverbesserungen

## 2.134.0 – 2026-10-09 – Geburtstags-Ständchen und Gratulieren an der Pinnwand
🔧 Kleine Systemverbesserungen
Admin-Notiz (KC-CLUB-GEBURTSTAG-PINNWAND / -STAENDCHEN, Wunsch Hansi): Wer an seinem (freigegebenen) Geburtstag die App öffnet, bekommt eine Glückwunsch-Karte mit „Happy Birthday“ (selbst erzeugte Melodie, einmal je Tag/Gerät, bei „Ton aus“ per Knopf). Gleichzeitig hängt die Clubleitung einen ❗ wichtigen Zettel „🎂 Heute hat unser Clubmitglied … Geburtstag“ für alle auf, mit „🎂 Ich möchte auch gratulieren“ (öffnet den Chat mit „Alles Gute zum Geburtstag …“). Einmal je Jahr, ohne Push/Mail; die Wartung nimmt ihn am nächsten Tag ab. Willkommens- und Geburtstags-Zettel teilen sich clubZettelAushaengen().

## 2.133.0 – 2026-10-09 – Begrüßung: unser Clubmitglied
🔧 Kleine Systemverbesserungen
Admin-Notiz (Wunsch Hansi): Willkommens-Zettel an der Pinnwand sagt „Wir begrüßen unser Clubmitglied … in der Köcheclub-App“ (statt „neues Mitglied“ – die meisten sind langjährige Mitglieder, nur neu in der App). Manfreds Zettel wurde am 09.10. erneut aufgehängt und angepasst (Weg B).

## 2.132.0 – 2026-10-09 – Erinnerung an To-do-Fristen
🔧 Kleine Systemverbesserungen
Admin-Notiz (KC-CLUB-TODO-ERINNERUNG, Wunsch Hansi): offene To-dos mit Frist erinnern automatisch 5 Tage vorher und am Tag selbst morgens ab 7 Uhr („⏰ Frist läuft heute ab“) per Push + E-Mail (nach den Benachrichtigungs-Einstellungen der Person) – an die Zuständigen, sonst an den, der es aufgeschrieben hat; je Frist nur einmal (Merkspalten erinnert_vorher/erinnert_heute, Weg B).

## 2.131.0 – 2026-10-09 – To-do-Fristen im Kalender
🔧 Kleine Systemverbesserungen
Admin-Notiz (KC-CLUB-TODO-IM-KALENDER, Wunsch Hansi): eigene bzw. mir zugeteilte offene To-dos mit Frist erscheinen im Kalender am Fälligkeitstag (weinroter Punkt, „✅ Frist: …“, antippen → To-do-Liste). Daten (Weg B, KC-CLUB-WM-TODO): 17 To-dos Weihnachtsmarkt Kirchplatz 04.–13.12. aus dem Vertrag mit Werne Marketing für Hansi („nur ich“, ohne Benachrichtigung).

## 2.130.0 – 2026-10-09 – Corporate Design für alle Ausdrucke
🔧 Kleine Systemverbesserungen
Admin-Notiz (KC-CLUB-CD, Wunsch Hansi): Corporate Design festgelegt (docs/CORPORATE_DESIGN.md) – Kochmütze im weinroten Kreis, Schriftzug „Köcheclub Werne“, Weinrot + Beige. Zentraler Druckrahmen und Briefbogen nutzen nur noch cdKopf/cdFuss; Fußzeile Briefbogen „Köcheclub Werne · Clubsprecher · <aktueller Clubsprecher>“ (eigene Zusätze wie Bankverbindung darunter). Tabellenköpfe beige. Regel 19 in AGENTS.md + Vertragstest.

## 2.129.0 – 2026-10-09 – Geburtstage in Freud & Leid
🔧 Kleine Systemverbesserungen
Admin-Notiz (KC-CLUB-FL-GEBURTSTAGE, Wunsch Hansi): Ordner „🎂 Geburtstage“ für die Clubleitung in „🤍 Freud & Leid“ eingebaut – Klappbereich „Geburtstage & Jubiläen“ (nächste 30 Tage, offen wenn diese Woche etwas ansteht), „Alle anzeigen · drucken“ öffnet die volle Liste mit Rückweg; Zahl am Ordner Freud & Leid zählt die Glückwünsche dieser Woche mit. Büro ohne Clubleitung behält den eigenen Ordner Geburtstage.

## 2.128.0 – 2026-10-09 – Anhänge teilen
🔧 Kleine Systemverbesserungen
Admin-Notiz (KC-CLUB-ANLAGE-TEILEN, Wunsch Hansi): Datei-Anhang in Nachrichten und Protokollen antippen → „👁️ Öffnen“, „📤 Teilen / Weiterleiten“ (Teilen-Menü des Handys, z. B. an Claude, Mail, WhatsApp) oder „⬇️ Auf dem Gerät speichern“. Die Datei wird beim Öffnen des Fensters schon geladen (Server prüft das Recht wie bisher).

## 2.127.0 – 2026-10-09 – Adressbuch übersichtlicher
🔧 Kleine Systemverbesserungen
Admin-Notiz (Wunsch Hansi): Adressbuch – Suchfeld mit gutem Kontrast (wie die übrigen Suchfelder, auch dunkel), Adressen als Klappbereiche je Kategorie (zu, bis gesucht/gefiltert wird; offene bleiben offen).

## 2.126.0 – 2026-10-09 – Drei wandernde Schnecken
🔧 Kleine Systemverbesserungen
Fehler behoben (Meldung Hansi 09.10.): Adressbuch stürzte beim Anzeigen ab („reading 'replace'“) – ab der 2. Adresse fehlte die Kennung (adrSauber direkt an .map übergeben).
Admin-Notiz (KC-CLUB-SCHNECKEN-WANDERN, Wunsch Hansi): Im Langsam-Modus wandern oben 3 🐌 von rechts nach links (Streifen lässt Tipps durch, Schnecke antippen = Info; Sparmodus/„weniger Bewegung“: stehen still in der Mitte).

## 2.125.0 – 2026-10-09 – Adressbuch im Büro
🔧 Kleine Systemverbesserungen
Admin-Notiz (KC-CLUB-BUERO-ADRESSEN, Wunsch Hansi): Büro-Ordner „📒 Adressbuch“ (Clubleitung) – liest die externen Adressen (Lieferant, Sponsor, Presse, Behörde …)
aus der Adressverwaltung von KC Verwaltung (Abschnitt addresses, Original bleibt dort); Suchen, Kategorien, Anrufen, E-Mail, Kopieren, „Aus dem Adressbuch“ im Briefbogen.
Neu/Ändern/Entfernen nur als Meldung (kc_club_adress_meldungen, Weg B) – KC Verwaltung 54.8.19 zeigt „📥 Meldungen aus der Club-App“, übernimmt und quittiert.
Mitglieder bleiben im Ordner „📇 Mitglieder“ (mit Kontakt-Freigaben). Datenvertrag: adressen (Eigentümer KC_KNG, Club-App liest), adress_meldungen.
Außerdem: große Schrift – Startseite war 15 px zu breit („Neue Nachr.“).

## 2.124.0 – 2026-10-08 – Notfall-Paket in Teilen, Tablet-Hinweis
🔧 Kleine Systemverbesserungen
Admin-Notiz: Notfall-Paket wird je Mitglied in einem eigenen Server-Aufruf gebaut (KC-CLUB-NOTPAKET-TEILE) – der Gesamtlauf brach mit „CPU Time exceeded“ (546) ab; fehlt ein Teil, bleibt das alte Paket.
Schulungs-Einladung: Tablet-Hinweis klar – „Kommst du zu mir, bring bitte dein Tablet mit – komme ich zu dir, leg es bitte bereit“; sind alle freien Termine gleicher Art, nur der passende Satz (KC-TERMINE-TABLET-TEXT).

## 2.123.0 – 2026-10-08 – ♟️ Schach: Elfenbein-Figuren auf grauem Brett, plastische Figuren zur Wahl, Twinkey mit Männerstimme
Der Testerin gefielen Figuren und Stimme noch nicht. Aus sechs kostenlosen Figurensätzen kam „Spatial“ dazu; Standard bleibt
auf Wunsch Hansi der klassische Satz (Cburnett).
- Klassisch (Standard) im Look nach Hansis Vorlage: Cburnett-Figuren in Elfenbein bzw. Tiefschwarz mit sanftem Verlauf
  (abgeleitet unter BSD, `lib/schach/elfenbein`, erzeugt mit `tools/schach/elfenbein.mjs`, Formen unverändert), graues Brett
  mit leichtem Glanz, Beschriftung außen – Zahlen links, Buchstaben unten (KC-CLUB-SCHACH-ELFENBEIN).
- Neuer Figurensatz „plastisch“ (Spatial von Maurizio Monge, MIT-Lizenz, `lib/schach/plastisch`). Der Knopf „♟️ Figuren“
  schaltet reihum: Klassisch (Standard) → Plastisch → Brigade (je Gerät). Wer die Brigade gewählt hatte, behält sie (KC-CLUB-SCHACH-FIGUREN).
- Twinkey spricht mit der Männerstimme – dieselbe wie „Männer im Chat“ (⚙️ Einstellungen → Stimme); hat das Gerät keine,
  spricht dieselbe Stimme tiefer; die Zugansage bleibt in der normalen Stimme (KC-CLUB-SCHACH-STIMME).
- Sprache in drei Stufen statt „🔊 Ansage an/aus“: 🔇 Stumm → 🗣️ Nur Twinkey (Sprüche und Tipps) → 🔊 Twinkey + Züge;
  wer bisher die Ansage an hatte, startet bei „Twinkey + Züge“ (KC-CLUB-SCHACH-SPRACHE).

## 2.122.0 – 2026-10-08 – Gesamtprüfung 4
🔧 Kleine Systemverbesserungen
Admin-Notiz (Gesamtprüfung 4): Notfall-Paket baut 4 Mitglieder parallel (KC-CLUB-NOTPAKET-TEMPO, vorher ~100 s → Abbrüche 546);
Anruf: Auflegen während der Vorbereitung stürzt nicht mehr ab; #zu=-Sprunglinks beim Start funktionieren wieder (KC-CLUB-SPRUNG-START);
Mitschauen: nur eine Abfrage gleichzeitig, keine falsche „Keine Antwort“-Meldung (KC-CLUB-SS-TAKT); „online“ nie aus altem Stand (KC-CLUB-ONLINE-FRISCH);
„Laden hat nicht geklappt“ antwortet nach 60 s / bei Netz-Rückkehr von selbst (KC-CLUB-LADE-FRAGE-FRIST); Mitglieder-Seite wackelte 7 px seitlich (KC-CLUB-MG-SCHALTER-BREITE);
große Schrift „📨 Jetzt senden“; Server: Mail-Bremse zählt Versuche vor dem Senden (KC-CLUB-MAIL-BREMSE), Spur/Start/Diagnose/Sprache je Person und Stunde begrenzt (KC-CLUB-PROTOKOLL-BREMSE).

## 2.121.0 – 2026-10-08 – Online-Zahl überall gleich
„Online (n)“ auf der Mitgliederseite, der Online-Filter und die Anklopf-/Anruf-Knöpfe nehmen jetzt dieselbe, laufend aufgefrischte Online-Liste wie die Zahl in der unteren Leiste (KC-CLUB-ONLINE-EINE-QUELLE).

## 2.120.0 – 2026-10-08 – Schulung unter Vorbehalt im Kalender
Angebotene Schulungstermine, die noch niemand gewählt hat, stehen für den Admin gestrichelt lila im Kalender – „unter Vorbehalt“, mit dem Namen der Eingeladenen (KC-CLUB-SCHULUNG-VORBEHALT).

## 2.119.0 – 2026-10-08 – Kein Stau beim Tippen
Bei langsamem Netz stauten sich die „schreibt …“-Meldungen und bremsten danach Chat und Senden. Jetzt ist immer nur eine unterwegs (KC-CLUB-TEMPO).
Vorbereitet als 2.115.0 (Zweig claude/aenderungsmeldung); live als 2.119.0, weil 2.116.0 und 2.118.0 (Schach) schon vorher live gingen.

## 2.118.0 – 2026-10-08 – 🧑‍🍳 Twinkey: viele neue Schach-Sprüche, 📼 Partien nachspielen (Wunsch Hansi)
Twinkey hat je Spiellage mehr Sprüche (6–9 statt 2–4) – frech im Stil bekannter Schach-Figuren aus Lern-Apps, aber eigene
Küchen-Sprüche: „Meine Dame! Was wird bloß mein Küchenchef dazu sagen?“, „Ich hol mir jetzt die Kochmütze – Schach!“,
„Das war natürlich Absicht – ich wollte dir eine Freude machen!“, „Ich verlange eine Revanche – gleich nach dem Abwasch!“,
„Noch ein Sieg für Team Kochmütze!“, „Sei nicht traurig – ich bin halt ein Naturtalent am Herd.“ Auch gegen Mitglieder mehr
Sprüche. 2.117.0 bleibt frei für die Änderungsmeldung (claude/aenderungsmeldung) (KC-CLUB-SCHACH-SPRUECHE).

**📼 Partien aufzeichnen und nachspielen (KC-CLUB-SCHACH-ARCHIV, Wunsch Hansi):** Jede Partie gegen Twinkey wird am Ende von
selbst aufgezeichnet (auch beim Abbrechen ab 2 Zügen), Partien gegen Mitglieder, sobald man sie beendet ansieht. „📼 Meine Partien“
listet die letzten 40 (Datum, Gegner, Ergebnis); „▶ Nachspielen“ zeigt das große Brett mit ⏮ ◀ ▶ ⏭, Schieberegler, ▶️ Abspielen und
anklickbarer Zugliste – Figuren gleiten, mit 🔊 Ansage wird jeder Zug vorgelesen. In Partien gegen Mitglieder zusätzlich „📼 Nachspielen“.
Gespeichert werden nur die Züge, auf dem Gerät (keine Datenbank-Änderung, keine Kosten).

## 2.116.0 – 2026-10-08 – ♟️ Schach macht mehr Spaß – Twinkey spielt mit, mehr Platz fürs Brett (Test-Rückmeldung + Wunsch Hansi)
Ein Testnutzer fand Schach „macht keinen Spaß“: Figuren schlecht zu erkennen, Brettmuster zu dominant, Rochade „klappt nicht“.
Die Rochade-Regel war richtig (chess.js) – es fehlten Schieben und eine Erklärung, wenn sie nicht erlaubt ist (KC-CLUB-SCHACH-SPASS).
- Figuren **schieben** mit Finger oder Maus – Antippen geht weiter. Rochade: König auf den Turm schieben.
- Geht die Rochade nicht, sagt Twinkey warum: König/Turm hat schon gezogen, Figuren dazwischen, im Schach, Feld angegriffen.
- Gezeichnete Figuren (Cburnett, BSD-Lizenz, `lib/schach`) statt Schriftzeichen; **klassisch ist jetzt Standard**,
  die Küchenbrigade bleibt über „👨‍🍳 Brigade“ wählbar (Kaltmamsell mit eigenem Rand, gut vom Küchenchef zu unterscheiden).
- Ruhiges helles Brett (Hellgrau/Weiß, dünner Rand), sanfte Markierungen, eigener Turm als gestricheltes Rochade-Ziel.
- 🧑‍🍳 **Twinkey** in einer Sprechblase: gegen den Computer ist er der Gegner („Heute schlage ich dich bestimmt – ich habe die ganze
  Nacht geübt!“, „Dein Läufer ist heute aber schnell unterwegs!“), gegen Mitglieder schaut er zu und hilft. Hinweise bei falschen
  Zügen. **💡 Tipp** (gegen den Computer, ohne Uhr) zeigt einen guten Zug. Mit 🔊 Ansage spricht Twinkey auch.
- Figuren gleiten beim Ziehen (nicht im Sparmodus / bei „Bewegung reduzieren“), leise Holz-Töne (🔔 Töne an/aus, je Gerät).
- Regeln, Server und Datenbank unverändert. Test „Schach soll Spaß machen“.

**Mehr Platz fürs Brett (KC-CLUB-SCHACH-FOKUS):** Läuft eine Partie (gegen den Computer ab dem ersten Zug, gegen Mitglieder solange sie läuft), verschwindet alles über dem Brett:
„Köcheclub Edition“, Computer/Mitglieder, Stärke/Farbe/Uhr, Spielstand – und die Fußleiste. Das Brett wird so groß, wie der
Bildschirm es zulässt (bis 640 px). Twinkey ist kleiner (eine Zeile mit Namen davor). Ist die Partie zu Ende oder abgebrochen
(neue Partie, ‹ Übersicht, andere Seite), ist alles wieder da. „⚙️ Einstellungen“ blendet es für diese Partie wieder ein,
„🔲 Mehr Platz“ wieder aus (KC-CLUB-SCHACH-FOKUS).

## Google-Skript – 2026-10-07 – Keine Mails mehr an Gäste (KC-KALENDER-STILL, App unverändert)
- Fall Thomas: Sein Termin war in Google von Hand mit ihm als Gast eingetragen. Jede Änderung durch das Skript (Titel, Zeit,
  Ort, Text, Farbe einzeln) löste bei Google eine Mail „Aktualisierte Einladung“ an ihn aus – 4 Mails am 07.10.
- `google/KalenderAbgleich.gs`: Einträge mit Gästen nur noch still ändern/löschen (erweiterter Dienst „Google Calendar API“,
  sendUpdates = none) und die Gäste dabei still entfernen – Grundsatz: Google verschickt nie Mails, nur die Köcheclub-App;
  ist der Dienst aus, bleiben Einträge mit Gästen unverändert. Ohne Gäste nur das setzen, was sich geändert hat.
- Hansi muss das Skript einmal erneuern (google/ANLEITUNG.md → „Skript erneuern“).

## 2.114.0 – 2026-10-08 – Protokoll-Wächter
Der nächtliche Wartungslauf hält das Club-Protokoll klein: Ansehen/Diagnose nach 60 Tagen, Alltägliches nach einem Jahr; Wichtiges (Zugänge, Rechte, Sperren, Löschungen, Datenänderungen, Notfall) bleibt. Über 50.000 Einträge werden die ältesten nicht-wichtigen entfernt (KC-CLUB-PROTOKOLL-WAECHTER).

## 2.113.0 – 2026-10-08 – Tempo: Sofort-Start, Verzeichnisse, Tempo-Messung
Die App zeigt beim Öffnen sofort den zuletzt geladenen Stand (markiert „wird gerade aktualisiert“) und lädt im Hintergrund frisch. Die Datenbank bekommt Verzeichnisse für die wachsende Protokoll-Tabelle und häufige Verknüpfungen. Der Server notiert langsame Vorgänge (nur Name und Dauer). Büro-Eingang lädt alles gleichzeitig (KC-CLUB-TEMPO, KC-CLUB-SOFORTSTART).

## 2.112.0 – 2026-10-08 – Einlesen aus dem Eingang: Anhänge mitschicken?
Gehören zu einem Vorgang aus dem Eingang Belege oder Bilder (z. B. bei einer Erstattung), fragt die App, welche mitgeschickt bzw. mit abgelegt werden sollen – Häkchen je Anhang. Mail aus dem Büro: bis zu 10 Dateien (KC-CLUB-BUERO-EINLESEN-EINGANG).

## 2.111.0 – 2026-10-08 – Einlesen: auch aus dem Büro-Eingang
Beim Einlesen im Büro stehen unter „📥 Aus Eingangskorb oder Eingang“ jetzt auch Erstattungen, Dienstzeiten, Änderungsmeldungen und offene Vorschläge aus dem Eingang – antippen, dann ablegen, als Nachricht schicken oder per E-Mail (An/CC/BCC) versenden (KC-CLUB-BUERO-EINLESEN-EINGANG).

## 2.110.0 – 2026-10-08 – Hilfe-Zentrum und Bedienungsanleitung V9
Neue Hilfe-Einträge zu allen Neuerungen seit Anleitung V8 (Schnecke, Laden dauert zu lange, 7/18 angemeldet, Schritt-Hilfe überall, Büro: Einlesen und Mail mit An/CC/BCC u. a.) und die Bedienungsanleitung Version 9 mit Teil 21 (63 Seiten) unter Dokumente. Hinweis im Fenster „Wohin damit?“ aktualisiert, Mail-Fenster passt jetzt auch mit langen Namen (KC-CLUB-ANLEITUNG-V9).

## 2.109.0 – 2026-10-08 – Büro-Mail mit CC und BCC
Beim Mailen aus dem Büro wählst du je Person An, CC oder BCC; „Kopie an mich“ geht als BCC (KC-CLUB-BUERO-MAIL).

## 2.108.0 – 2026-10-08 – Büro: Mail direkt aus der App
Eingelesene Dokumente gehen im Büro jetzt direkt aus der Club-App per E-Mail an ausgewählte Mitglieder – Empfänger anhaken, Betreff, Text, Anhang hängt schon an, auf Wunsch Kopie an mich. Für Adressen außerhalb des Clubs bleibt „Anderes Mail-Programm“ (KC-CLUB-BUERO-MAIL).

## 2.107.0 – 2026-10-08 – Lade-Sicherheit überall
Dauert Laden wegen langsamem Netz zu lange (12 s) oder klappt nicht, erscheint überall eine Leiste „Laden dauert zu lange – bitte gleich nochmal versuchen“ mit 🔄 Nochmal versuchen und Abbrechen. Senden/Speichern wird nie doppelt wiederholt. Alle übrigen Abrufe haben jetzt eine Zeitgrenze (KC-CLUB-LADE-SICHERHEIT).

## 2.106.0 – 2026-10-08 – Schnecke bei langsamem Netz + Twinkey hängt nicht mehr
🐌 erscheint auf jeder Seite, solange das Netz gerade langsam ist (gemessen an den echten Antwortzeiten), und verschwindet von selbst. Twinkey zeigt bei langsamem Netz nach 8 s einen Hinweis und statt endlosem Laden „🔄 Nochmal versuchen“ (KC-CLUB-SCHNECKE, KC-CLUB-TWINKEY-FRIST).

## 2.105.0 – 2026-10-08 – 👣 Schritt-Hilfe jetzt überall
Alle Seiten der App (außer SOS) haben jetzt eine Schritt-Hilfe – auch Startseite, Hilfe & Tipps, PDF-Ansicht, Standorte, Sicherheits-Check, alle Büro-Bereiche sowie die Fenster Änderungsmeldung, Mitfahren anbieten, Fotoalbum anlegen und Einlesen.

## 2.104.0 – 2026-10-08 – 👣 Schritt-Hilfe: Aktionen, Dokumente, Feedback, Büro
Die Schritt-Hilfe zeigt jetzt auch bei Aktionen, Meine Dokumente, Feedback (Schritt für Schritt bis „Absenden“) und im Büro, was als Nächstes zu tun ist.

## 2.103.0 – 2026-10-08 – 🔴 Live mitschauen (Admin, mit Erlaubnis)
Neu für den Admin bei Nutzung → Wege eines Mitglieds: „🔴 Live mitschauen“. Nach dem Ja des Mitglieds kommt alle paar Sekunden ein neues Bild der Club-App; beim Mitglied steht oben „🔴 … schaut zu – Beenden“. Endet spätestens nach 10 Minuten.

## 2.102.0 – 2026-10-08 – 📊 Terminkachel „3/18 angemeldet“ + 📸 Bildschirm ansehen (Admin, mit Erlaubnis)
Auf der Terminkachel steht jetzt, wie viele schon zugesagt haben – z. B. „✅ 3/18 angemeldet“. Neu für den Admin: bei Nutzung → Wege eines Mitglieds „📸 Bildschirm ansehen“ – das Mitglied wird gefragt und entscheidet selbst; dann kommt ein einziges Bild der Club-App, das man speichern kann.

## 2.101.0 – 2026-10-08 – 📥 Büro: Dokumente einlesen
Im Büro gibt es „📥 Einlesen“: Foto machen, Datei wählen, am PC hineinziehen oder aus dem Eingangskorb holen. Danach fragt die App, wohin damit – in einen Ordner (mit Vorschlag), in den Eingangskorb für später, als Nachricht in der App oder per E-Mail mit Anhang.

## 2.100.0 – 2026-10-08 – 🧊 Kein falscher Hänger-Alarm nach Pause (iPad)
iPad/iPhone frieren die App ein, wenn man kurz in eine andere App wechselt – danach kam fälschlich „Die App hat kurz gehangen“. Pausen über einer Minute zählen jetzt nicht mehr als Hänger.

## 2.99.0 – 2026-10-08 – 🕶️ Inkognito: Status-Feld pulsiert Gelb ↔ Rot (Admin)
Ist Inkognito an, pulsiert jetzt auch das eigene Status-Feld von Gelb nach Rot – im Takt der Brille.

## 2.98.0 – 2026-10-08 – 🎙️ Sprachsteuerung bleibt nicht mehr hängen
Auf manchen Geräten (z. B. iPad als Home-Bildschirm-App) meldete sich die Spracherkennung nie zurück und „Ich höre zu …“ blieb stehen. Jetzt bricht die App nach 6 bzw. 15 Sekunden von selbst ab – mit dem bisher Gehörten oder einem verständlichen Hinweis.

## 2.97.0 – 2026-10-08 – 🔄 Aktualisieren bleibt nicht mehr hängen
Auf iPad/iPhone konnte das Aktualisieren nach langer Pause im Hintergrund hängen bleiben (blaue LED). Jetzt hat jeder Schritt eine Frist – spätestens nach 30 Sekunden lädt die App neu.

## 2.96.0 – 2026-10-08 – 📖 Bedienungsanleitung Version 8
Die Bedienungsanleitung gibt es jetzt in Version 8 (58 Seiten) – neu ist Teil 20 mit allem, was seit Version 7 dazugekommen ist: Unterstützung wählen, Schritt-für-Schritt-Hilfe, Sprachsteuerung, 👆 Was kann ich antippen?, neue Spiele, Inhaltsverzeichnis, Rückfragen und mehr. Zu finden unter Meine Dokumente.

## 2.95.0 – 2026-10-08 – 🧭 Browser-Meldungen im Fehlerprotokoll grau
„Script error.“ ohne Fundstelle kommt vom Browser selbst (z. B. Safari) und steht jetzt grau als „Browser-Meldung“ statt gelb als Programmfehler.

## 2.94.0 – 2026-10-08 – 🆘 Notfallkontakt: Hinweis „eine andere Person eintragen“
Beim Notfallkontakt steht jetzt deutlich: bitte nicht sich selbst eintragen, sondern eine andere Person, die im Notfall benachrichtigt werden soll. Trägt man doch den eigenen Namen oder die eigene Nummer ein, fragt die App nach.

## 2.93.0 – 2026-10-08 – 💬 „Korrektur meiner Daten“ landet im vorhandenen Chat
Wer „📝 Korrektur meiner Daten“ schickt, schreibt jetzt in den vorhandenen Chat mit dem Admin – statt jedes Mal einen neuen Chat anzulegen.

## 2.92.0 – 2026-10-08 – 🟢 Bei Anmeldung fragen: „Möchtest du sehen, was … gerade macht?“ (Admin)
Meldet sich ein Mitglied an, fragt die App den Admin, ob er sehen möchte, was es gerade macht. Bei Ja öffnet sich „Wege der Benutzung“ mit allen, die gerade in der App sind – zum Antippen. Nicht in der Ruhezeit und nie über einem anderen offenen Fenster; abschaltbar.

## 2.91.0 – 2026-10-08 – 🔢 Anmeldung mit Code einfacher (iPad/iPhone) + 💬 Rückfragen zur Änderungsmeldung
Nach dem Code-Eintippen dreht die Kochmütze, bis die App startet. Auf iPhone/iPad zeigt die App zuerst, wie die Kochmütze auf den Home-Bildschirm kommt – der Code wird dann direkt dort eingegeben, ein zweiter Code ist nicht mehr nötig. Bei eigenen, noch nicht eingetragenen Änderungsmeldungen gibt es den Knopf „💬 Rückfragen?“ – er öffnet direkt den Chat mit dem, der die Meldung bearbeitet.

## 2.90.0 – 2026-10-08 – 👣 Schritt-Hilfe: Ausleihen, Hilfe anbieten, Dienstpläne, Einstellungen, Spiele
Die Schritt-Hilfe zeigt jetzt auch beim Ausleihen, beim Hilfe-Anbieten, in den Dienstplänen, in den Einstellungen und bei den Spielen, was als Nächstes zu tun ist.

## 2.89.0 – 2026-10-08 – 🎙️ Weniger Knöpfe am Mikrofon
📋 Alle Befehle und 🔇 Mikro aus stehen jetzt im Fenster „Ich höre zu …“ statt als zwei zusätzliche Knöpfe auf dem Bildschirm. Merkblatt „Die App hilft dir“ aktualisiert (mit den neuen Befehlen der Stufe 3). (KC-CLUB-SPRACHE-LISTE)

## 2.88.0 – 2026-10-08 – 📮 Gemeldete Änderungen sichtbar
Hat ein Mitglied z. B. eine neue Anschrift gemeldet, steht in „Meine Daten“ und auf der eigenen Mitglieder-Seite: „📮 Von dir gemeldet – noch nicht eingetragen: Anschrift (ab …): 👍 freigegeben – wird in Kürze eingetragen“. Nach der Freigabe bekommt das Mitglied einmal eine Push-Nachricht. Nur Anzeige – eingetragen wird weiter im KC Manager. (KC-CLUB-AE-HINWEIS, KC-CLUB-AE-FREIGABE-PUSH, Server 2.88.0)

## 2.87.0 – 2026-10-08 – 🎙️ Sprachsteuerung Stufe 3
Neue Sprachbefehle: „Ich komme zum Clubabend“ / „Ich kann nicht“ / „Vielleicht“ (Antwort für den nächsten Termin, nach Rückfrage), „Lies mir die neuen Nachrichten vor“ (sagt, wer geschrieben hat, und liest vor), „Was steht auf der Pinnwand?“ (liest die Zettel vor), „Ruf Klaus an“ (in der App, wenn online – sonst Telefon & WhatsApp), „Öffne den Ordner Verträge“. Alle auch in der 📋 Liste. (KC-CLUB-SPRACHE-STUFE3)

## 2.86.0 – 2026-10-08 – 🤝 Merkblatt „Die App hilft dir“
Neues Merkblatt (2 Seiten, mit Bildern) unter 📚 Meine Dokumente: Wie viel Hilfe, Schritt-Hilfe mit rotem Rahmen und Vorlesen, Ablage-Vorschlag, Sprachsteuerung mit Beispielsätzen, Stumm und Liste, die App lernt dazu. Zum Ausdrucken für den Clubabend. (KC-CLUB-MERKBLATT-HILFE)

## 2.85.0 – 2026-10-08 – 🤝 Wie viel Unterstützung möchtest du?
Einmal beim Start (wenn nichts anderes offen ist) fragt die App: 🙋 Viel Hilfe (einfache Ansicht, große Schrift, Schritt-Hilfe mit Vorlesen, Sprachsteuerung), 👌 Ein bisschen (Schritt-Hilfe) oder 😎 Ich komme klar. Jederzeit änderbar unter ⚙️ → 🤝 Unterstützung. (KC-CLUB-UNTERSTUETZUNG, Server 2.85.0)

## 2.84.0 – 2026-10-08 – 🔇 Stumm und 📋 Liste am Mikrofon
Über dem 🎙️-Knopf zwei kleine Knöpfe: 🔇 Stumm schaltet das Mikrofon aus (Knopf wird grau, Tippen öffnet die Liste) – 📋 Liste zeigt alle Sprachbefehle mit Erklärung, auch die gelernten, mit Live-Suche zum Scrollen; Antippen führt den Befehl aus; oben „🎙️ Mikrofon wieder an“. (KC-CLUB-SPRACHE-LISTE)

## 2.83.0 – 2026-10-08 – 🎙️ Selbstlernende Sprachsteuerung
Kennt die Sprachsteuerung einen Satz nicht (z. B. „Treffen planen“), fragt sie: „Was meinst du damit?“ – Antippen führt es aus und merkt es sich in der Datenbank; beim nächsten Mal wird der Satz erkannt (auch mit kleinen Hörfehlern). Gelernt gilt erst für das Mitglied selbst, ab 2 Mitgliedern mit gleicher Zuordnung für alle. Admin: 👥 Nutzung → 🎙️ Sprachbefehle (unbekannte Sätze zuordnen, 🌍 für alle an/aus). Nur kurze Sätze (bis 8 Wörter) werden gespeichert. Neue direkte Befehle: „Neuer Termin“, „Fotos hochladen“, „Archiv“, „Mitglieder“, „Börse“ … (KC-CLUB-SPRACHE-LERNEN, Server 2.83.0)

## 2.82.0 – 2026-10-08 – 👣 Schritt-Hilfe: Mitglieder, Helfen & Börse, Fotos
Schritt-Unterstützung jetzt auch für 👥 Mitglieder (antippen → schreiben, anklopfen, anrufen), 🤝 Helfen & Leihen (Hilfe-Aufruf Schritt für Schritt: wobei, wann, wie viele, wo, an wen, Beschreibung; 🛍️ Börse: biete/suche, Rubrik, was, Preis, Fotos, Beschreibung) und 📷 Fotos (wählen, Thema, Anlass, Beschreibung, hochladen). (KC-CLUB-SCHRITT-HILFE)

## 2.81.0 – 2026-10-08 – 👣 Schritt-Hilfe Archiv & Erstattung, Wege der Mitglieder live
Schritt-Unterstützung jetzt auch für 💶 Erstattung (Art, Datum, km/Betrag, Grund, Beleg, Position, Auszahlung, senden), das 🗄️ Archiv (Ordner öffnen, Dokument ablegen) und den Ablage-Vorschlag. 👣 Wege der Mitglieder: wer gerade in der App ist, steht oben mit 🟢, die Seite aktualisiert sich alle 20 Sekunden von selbst, und die Handys schicken neue Schritte schon nach 15 Sekunden. Oben „🟢 Gerade in der App“: wer ist gerade wo („Erika ist bei 📌 Pinnwand · gerade eben“), bei allen anderen „zuletzt: …“ (Server 2.81.0). (KC-CLUB-SCHRITT-HILFE, KC-CLUB-SPUR-LIVE)

## 2.80.0 – 2026-10-08 – 💡 Ablage-Vorschlag: wohin gehört das Dokument?
Bei jedem Dokument, Foto oder Papier schlägt die App vor, wo es hingehört: „Soll ich das in den Ordner „Verträge 2026“ im Register „Vereinsverträge“ ablegen?“ – nach dem Senden mit Anhang, beim Ablegen aus Chats/Nachrichten/Fotos/Protokollen und beim Hochladen im Archiv (Register vorgewählt, besserer Ordner als Knopf). Erkennt Verträge, Miete, Versicherungen, Lieferanten, Protokolle, Rechnungen, Urkunden, Fotos … und passende Register-Namen; zur Not „Sonstiges“. (KC-CLUB-ABLAGE-VORSCHLAG)

## 2.79.0 – 2026-10-08 – 🗂️ Inhaltsverzeichnis aller Ordner (PDF/Druck)
Neuer Knopf im Büro, im Archiv und in jedem Ordner: Inhaltsverzeichnis zum Ausdrucken oder als PDF – Übersicht, dann je Bereich (persönlich / mit mir geteilt / öffentlich / nur Clubleitung) jeder Ordner mit seinen Registern und Einträgen. Wahl: alles, nur persönliche oder nur öffentliche Ordner; optional Clubleben, Dateiname und „abgelegt von“. (KC-CLUB-INHALTSVERZEICHNIS)

## 2.78.0 – 2026-10-08 – ⚠️ Vertrauliches an Nicht-Mitglieder: Rückfrage
Steht in einer Nachricht etwas Vertrauliches (z. B. Vertrag im Text oder Dateinamen, oder ein Dokument wie PDF/Word/Excel) und ist ein Empfänger kein ordentliches Mitglied (Gast, ausgetreten), fragt die App vor dem Senden – auch beim Weiterleiten – mit Namen: „Sollen diese Personen die Nachricht wirklich bekommen?“ Server 2.78.0 liefert dafür das Merkmal. (KC-CLUB-SENSIBEL-GAESTE)

## 2.77.0 – 2026-10-08 – 🎙️ Lange drücken: Sprachsteuerung ausschalten
Lange auf den 🎙️-Knopf drücken fragt: „Sprachsteuerung ausschalten?“ – kurz tippen hört wie bisher zu. (KC-CLUB-SPRACHSTEUERUNG)

## 2.76.0 – 2026-10-08 – 🎙️ Sprachsteuerung Stufe 2: Rückfragen
„Nachricht an Klaus“: bei mehreren Klaus „Welchen Klaus?“, unbekannte Namen → ähnliche Namen vorschlagen, nur „Nachricht“ → „An wen?“. Namen werden nach Klang erkannt (Claus/Klaus, Maier/Meier). Angekommen fragt die App sofort: „Soll ich das Diktieren gleich einschalten?“ – Ja/Nein sagen oder tippen. Auch beim neuen Pinnwand-Zettel. Gesendet wird weiter nur per Tipp. (KC-CLUB-SPRACHSTEUERUNG)

## 2.75.0 – 2026-10-08 – 🎙️ Sprachsteuerung (Stufe 1)
Eigener 🎙️-Knopf unten links (unter ⚙️ einschalten): Nachricht an …, Zettel an die Pinnwand, Termine, nächster Termin, Suche, Startseite. Nie wird von selbst gesendet. Vor „Startseite“ und beim 🏠 Start-Knopf unten wird gefragt, ob ungespeicherte Eingaben verworfen werden sollen. (KC-CLUB-SPRACHSTEUERUNG)

## 2.74.0 – 2026-10-08 – KC-CLUB-SPEICHERNAME
- Fehler behoben: Dateien mit Umlauten oder Sonderzeichen im Namen (z. B. „Vertrag_Köcheclub Werne.pdf“) ließen sich nicht hochladen. Der Speicherpfad wird jetzt umgeschrieben, angezeigt wird weiter der echte Name. Server 2.74.0.

## 2.73.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE Mein Bild
- Schritt-Unterstützung für „Mein Bild“ (Figur antippen → Übernehmen/Bearbeiten) und den Baukasten (Typ → Haut → Frisur → Haarfarbe → Kopf → … → Kochjacke → Muster → Knöpfe → Hintergrund → Halstuch → Speichern). Kern: Fenster können einen eigenen Ablauf haben.

## 2.72.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE Vorschläge
- Schritt-Unterstützung bei Vorschlägen: ＋ Neu → Art (💡 Thema / 💝 Spende / 🗳️ Abstimmung) → Titel/Frage → Beschreibung → Sitzung → (Abstimmung: Antworten, geheim, Frist, an wen) → Bescheid → Vorschlagen.

## 2.71.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE Protokolle
- Schritt-Unterstützung bei Protokollen: Liste (＋ Anlegen / ＋ Neu / öffnen), Formular (Titel → Datum/Ort → Anwesend → Tagesordnung → Beschlüsse → Anhängen → Aufgaben → Veröffentlichen), Lesen (Einwand / Archiv).

## 2.70.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE Termine komplett
- Schritt-Unterstützung bei Termine jetzt auch für Kalender (Tag antippen), To-do (aufschreiben → wer → für wen → eintragen) und Terminfindung (Clubleitung); Auswahlfenster „Wer soll es machen?“ wird gezeigt; Hinweis auf offene Terminfindungen.

## 2.69.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE Termine
- Schritt-Unterstützung bei Termine: ＋ Neu → Auswahl → privater Termin, Termin für alle (Clubleitung) oder Terminanfrage; Zusagen: Termin antippen → ✅/❓/❌ → Schließen.
- Kern: Rückfrage-Fenster werden zuerst gezeigt, Rahmen/Leiste liegen über allen Fenstern, nach „Geschafft“ läuft die Hilfe beim nächsten Anfang wieder.

## 2.68.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE Nachrichten-Sonderwege
- Schritt-Unterstützung bei Nachrichten auch für: Gespräch öffnen, gleiche Nachricht an mehrere markierte Gespräche (lange drücken), neue Gruppe anlegen. „Geschafft!“ auch nach Senden an mehrere; Leiste setzt sich bei großen Zielen darunter.

## 2.67.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE Nachrichten
- Pinnwand: „❗ Hoch – beim Öffnen zeigen“ wird wieder übernommen (Funktionsname war doppelt seit 2.13.0; Test verhindert das künftig).
- Schritt-Unterstützung jetzt auch bei Nachrichten: ＋ Neu → An wen? → Betreff (freiwillig) → Weiter zum Schreiben → schreiben → ➤. Leiste weicht aus, wenn sie das Ziel verdeckt.

## 2.66.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE Eingabe abwarten
- Pinnwand: Zeichenzähler „34 / 200 Zeichen“ direkt hinter „Kurze Nachricht“.
- Schritt-Unterstützung: Text-Schritt wartet, bis man „Fertig – weiter ➜“ tippt oder selbst den nächsten Schritt antippt (vorher sprang sie nach dem ersten Buchstaben weiter).

## 2.65.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE Puls + Vorlesen
- Schritt-Unterstützung: eigener, kräftig pulsierender Rahmen über dem nächsten Schritt (unabhängig vom Aussehen des Ziels), Text-Schritt mit Emoji-Hinweis, Schritte vorlesen (🔈 in der Leiste oder ⚙️ Einstellungen).

## 2.64.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE verfeinert
- Schritt-Unterstützung: Leiste wandert bei offener Tastatur nach oben, erster Schritt sagt „oben rechts“, Wichtigkeit und Antwort-Knopf sind eigene Schritte (immer nur ein Rahmen), zwei laufende Schuhe als Animation.

## 2.63.0 – 2026-10-08 – KC-CLUB-SCHRITT-HILFE
- Schritt-Unterstützung (⚙️ Einstellungen → „👣 Schritt-Unterstützung“): roter pulsierender Rahmen um den nächsten sinnvollen Schritt, Leiste „Schritt 2 von 4: …“, vorbelegte Auswahl gestrichelt. Zum Ausprobieren erst an der Pinnwand; weitere Bereiche über die Registry SH_ABLAEUFE.

## 2.62.0 – 2026-10-08 – KC-CLUB-DOPPELKOPF
- Doppelkopf zu viert gegen drei Computer-Köche (Erika, Kurt, Paul): 48 Karten, Re/Kontra, Hochzeit oder still allein, Extrapunkte (keine 90/60/30, schwarz, gegen die Alten, Fuchs, Doppelkopf, Karlchen), Stand auf dem Gerät.
- Bauernskat: Trumpfwahl erscheint jetzt im grünen Spielbereich und verschwindet nach der Wahl.

## 2.61.0 – 2026-10-07 – KC-CLUB-WARTEBILD
Neues Wartebild „🥞 Pfannkuchen wenden“: farbige Pfanne wirft den Pfannkuchen hoch, er dreht sich in der Luft und landet wieder.

## 2.60.1 – 2026-10-07 – KC-CLUB-KLICK-ZEIGEN
Die roten Rahmen beim 👆 pulsieren jetzt ruhig (bei „Bewegung reduzieren“ stehend).

## 2.60.0 – 2026-10-07 – KC-CLUB-KLICK-ZEIGEN
Neuer Knopf 👆 über dem „?“: zeigt rot umrandet alles, was man antippen kann (Aus mit ✕ oder nach 2 Minuten).

## 2.59.0 – 2026-10-07 – KC-CLUB-ARCHIV-KOPIEREN
Archiv: Dokumente „📋 Kopieren nach …“ / „➡️ Verschieben nach …“ mit Vorschlag; Ablage auch in Vereinsordner; neuer Ordner „🤝 Besprechungen“ im Büro.

## 2.58.0 – 2026-10-07 – KC-CLUB-PUSH-PERSOENLICH
Push bei Nachrichten sagt, wer was geschickt hat (z. B. „Klaus hat dir eine Nachricht in der Club-App geschickt“) – nur an die Empfänger.

## 2.57.0 – 2026-10-07 – KC-CLUB-MEHRFACH-NACHRICHT
Chat-Übersicht: Chats lange drücken = markieren (✓), weitere antippen; „＋ Neu“ schreibt eine Nachricht, die jeder markierte Chat einzeln bekommt.

## 2.56.1 – 2026-10-07 – KC-CLUB-AVATAR-INITIALEN
Initialen auf allen Kochmützen (hohe Kochmütze, Pizza-, Kochkappe, Schiffchen) und schon ab kleiner Größe.

## 2.56.0 – 2026-10-07 – KC-CLUB-VORFUEHREN
Neu (Admin): 📺 Live zeigen – auf der Mitglied-Seite. Nach Zusage folgt die App des Mitglieds deiner App: Seitenwechsel, Tipps als rote Markierung, Scrollen, geöffnete Fenster als Hinweis. Das Mitglied sieht seine eigenen Daten, beim Zuschauer wird nichts ausgelöst; beide können jederzeit beenden. Server 2.56.0.

## 2.55.0 – 2026-10-07 – KC-CLUB-FITNESS
Neu (vorerst nur Admin, Freigabe wie Rezeptbuch): 🏋️ Fit bleiben im Bereich Mein – Twinkey macht 15 sanfte Übungen vor (im Sitzen, im Stehen, Dehnen & Gleichgewicht), Stufe Sanft/Mittel/Fordernd, Dauer 5–20 Min., großer Countdown, Ansage, Pause/Überspringen; Auswertung nach Tag/Woche/Monat/Jahr mit Stufen- und Übungsfilter, Säulen, Monatskalender, Anteilen, Tabelle und Druck. Daten nur für einen selbst. Server 2.55.0.

## 2.54.0 – 2026-10-07 – KC-CLUB-AVATAR-OHR-FEIN
Ohren natürlicher: feiner Ohrrand, Ohrmuschel mit leichtem Schatten und kleiner Ohrknorpel – bei allen Ohrformen, auch den bisherigen Figuren. Warte-Bilder: in der Auswahl bewegen sich alle Bilder; bei „Animationen reduzieren“ am Handy laufen sie langsamer statt still (wie die Kochmütze). Emojis (Wunsch Karla): deutlich mehr Auswahl wie bei WhatsApp, neue Gruppen „Tiere & Natur“ und „Dinge“. Startseiten-Kacheln auch „Sehr klein – 4 nebeneinander“ (Einstellungen → Darstellung). Kachel umdrehen (KC-CLUB-KACHEL-RUECKSEITE): doppelt tippen → Rückseite mit Schnellaktionen (z. B. Neue Nachricht, Neuer Zettel, Foto hochladen); Reißwolf (KC-CLUB-REISSWOLF) beim Löschen von Nachrichten, Pinnwand-Zetteln und Fotos. Beides in der Darstellung abschaltbar. Links (KC-CLUB-LINK-AN-MICH, Fall Manfred): eigene Knöpfe heißen „Meinen eigenen Link mailen“; beim 🔗 App-Link eines Mitglieds neu „📧 An mich mailen (zum Einrichten)“ – Mail an den Admin, Betreff „Link für … (NICHT dein eigener)“. Server 2.54.0. Protokolle als Liste untereinander („Protokoll Sitzung vom 25.09.2026“, darunter der Ort), oben umschaltbar auf Kacheln (KC-CLUB-PROTOKOLL-LISTE). Twinkey strenger (KC-CLUB-TWINKEY-STRENGER): Fragen außerhalb der App (z. B. „Wie wird Pizza gemacht?“) bekommen keine unpassende Hilfe mehr, sondern „Dazu weiß ich noch nichts“ – mit ➤ Fragen geht die Frage an den Admin.

## 2.53.0 – 2026-10-07 – KC-CLUB-AVATAR-GESICHT-2
Figur zusammenstellen: Ohren (eng anliegend, abstehend, groß, klein, spitz), Nasen (zierlich, klein, Stupsnase, gerade, breit, groß, Adlernase, Knollennase) und Augenfarbe (blau, hellblau, grün, graugrün, braun, haselnuss, grau, bernstein). Das Halstuch geht jetzt sichtbar um den Hals herum. Alte Figuren bleiben unverändert. Server 2.53.0. Grau meliert: feinere und mehr helle Strähnen.

## 2.52.1 – 2026-10-07 – KC-CLUB-ALT-ANDROID
Euro-Anzeige (Spendenprojekte) stürzt auf älteren Browsern (Leih-Tablet, Chrome 81) nicht mehr mit „maximumFractionDigits value is out of range“ ab.

## 2.52.0 – 2026-10-07 – KC-CLUB-FDK-TABLETT
Fang den Koch: links dein Tablett, rechts das von Kurt – darauf liegen die Zutaten des Bons (gesammelte groß, fehlende blass). Das Feld, auf dem ein Koch steht, ist in seiner Farbe umrandet, die Figur größer und hüpft beim Laufen; nimmt ein Koch eine Zutat, erscheint sie groß in der Brettmitte.

## 2.51.0 – 2026-10-07 – KC-CLUB-PROBEPHASE
Admin kann Mitglieder erst in eine Probephase setzen (2/4/8 Wochen): kein Willkommens-Zettel, keine Begrüßung, Push/Mail nur nach eigener Wahl (Termine weiter per Mail), nicht in der Nutzung, keine Stimmabgabe. Danach ✅ Übernehmen (optional begrüßen) oder 🚪 Beenden (Link ungültig, Geräte ab, Einstellungen weg, aus Gruppen; Nachrichten bleiben, optional ersetzen). Frist-Erinnerung an den Admin. Server 2.51.0.

## 2.50.0 – 2026-10-07 – KC-CLUB-AVATAR-KOMBI
Wunsch Hansi: Im Baukasten „🧩 Figur zusammenstellen“ ein kleiner blauer ⓘ-Knopf. Er zeigt, wie viele verschiedene Figuren möglich sind (derzeit rund 11,8 Trillionen), geordnet nach Person, Gesicht, Kopfbedeckung, Brille, Kochjacke, Hintergrund, mit kurzer Erklärung der Rechnung und einem Vergleich (eine Figur je Sekunde ≈ 375 Milliarden Jahre). Die Zahlen rechnet die App aus ihren Auswahllisten – sie stimmen nach jeder Erweiterung von selbst. Nur App.

## 2.49.0 – 2026-10-07 – KC-CLUB-AVATAR-MUETZEN-2
Wunsch Hansi (nach Bildern): neue Kopfbedeckungen „Pizzabäcker-Mütze“ (weich, hängt zur Seite), „Kochkappe (flach)“ und „Schiebermütze“; neue Muster Schachbrett, Hahnentritt, Nadelstreifen (für alle Kopfbedeckungen); neue Farben Creme, Anthrazit, Petrol, Gold, Salbei (auch für Streifen und Kragen der Jacke). Alte Bilder unverändert. Nur App.

## 2.48.0 – 2026-10-07 – KC-CLUB-FEHLER-ALARM
Wunsch Hansi: Ernste Fehler bei angemeldeten Mitgliedern (Programmfehler, mehrere Fehler kurz hintereinander, App hängt ≥ 10 s, App startet nicht) melden sich jetzt sofort beim Admin per Push und E-Mail – mit Name, Art, Fehlertext, Bereich, Gerät/Browser und App-Version, nie mit Inhalten. Höchstens 1 Alarm je Mitglied in 6 Stunden und 3 je Stunde insgesamt; nicht an den Verursacher selbst, keine Testpersonen. Jeder Alarm steht im 🩺 Fehlerprotokoll („📣 Admin benachrichtigt“). Server SERVER_VERSION 2.48.0.

## 2.47.0 – 2026-10-07 – KC-CLUB-ABSTURZSCHUTZ
Wunsch Hansi: Absturzsicherung ergänzt. Nicht abgefangene Programmfehler zeigen jetzt eine verständliche Meldung (höchstens alle 20 s; bisher nur still im Protokoll). Häufen sie sich (3 in 2 Minuten), bietet die App „🔄 App neu laden“ an und vermerkt „instabil“. Hänger-Wächter: reagiert die App über 5 s nicht, wird das protokolliert (ab 10 s mit Hinweis). Dauert ein Vorgang über 20 s, sagt die Warte-Anzeige „Dauert länger als üblich“ und es wird protokolliert. Netz-/Server-/Datenbankausfälle wie bisher (Meldung, LEDs, Notbetrieb). Neue Arten im 🩺 Fehlerprotokoll. Nur App.

## 2.46.0 – 2026-10-07 – KC-CLUB-WARTEBILD
Wunsch Hansi: Warte-Anzeige mit Motiven aus der Profiküche – Schneebesen rührt im Kreis durch die Schüssel (mit Rührspur), Pfanne schwenken, Suppentopf, Messer & Brett, Nudelholz, Spritzbeutel, Küchenwecker, Herdflamme, im Dezember Plätzchen ausstechen, dazu wie bisher die Kochmütze. Schlichte weiße Strichgrafik im Markenkreis, ruhige Bewegung, passender Text. Einstellungen → 🎨 Darstellung → „⏳ Warte-Bild“ (Klappbereich): fest, 🔀 abwechselnd, 📅 täglich anders, 🗓️ nach Jahreszeit; je Gerät. Sparmodus/„Bewegung reduzieren“: ohne Bewegung. Nur App.

## 2.45.1 – 2026-10-07 – KC-CLUB-STUNDE
Fund Hansi („Uhrzeiten sind nicht drin“): Die Stunde wurde als „11 Uhr“ statt als Zahl gelesen – darum blieben in der 📨 Nachrichten-Statistik die Uhrzeit-Balken leer und die Nutzung je Uhrzeit (seit 2.23.17) wurde nie gezählt. Jetzt eine gemeinsame Funktion berlinStunde (deutsche Zeit, 0–23). Alte ungültige Zwischenstände werden verworfen. Nur App.

## 2.45.0 – 2026-10-07 – KC-CLUB-AVATAR-JACKE-BRILLE
Wunsch Hansi: Brille – acht weitere Farben (Silber, Rosé, Lila, Türkis, Blau, Weiß, Grün, Orange), „✨ mit Strass“ (Glitzersteine am Rahmen) und drei Damenformen mit verzierten Bügeln (Schmetterling, Oversize, Herz). Kochjacke – Nikolausrot, Orange, Pink; Jackenmuster „Längsstreifen“ mit wählbarer Streifenfarbe; Kragenfarbe frei wählbar (z. B. rot mit schwarzem Kragen, weiß mit orangem). Code bis 23 Zeichen, alte Bilder unverändert. Server: Avatar-Code bis 23 Zeichen. SERVER_VERSION 2.45.0.

## 2.44.0 – 2026-10-07 – KC-CLUB-DIENSTWUNSCH: DP2 Build 263 RC (KC-DP-KLAPPBEREICH)
DP2 auf Build 263 RC übernommen (dp3 ceefe07, Zweig codex/club-app-interface, Codex nach Auftrag docs/DP2_CODEX_AUFTRAG_KLAPPBEREICHE.md). In den Dienstwünschen haben alle Klappbereiche jetzt wie in der Club-App Pfeil ▾, Schloss 🔓/🔒 (feststellen), gemerkten Zustand und unten „▴ Zuklappen“; Twinkey respektiert festgestellte Bereiche. Neue DP2-Dateien src/ui/fold-sections.js/.css. Datenformat, Fragen, Speichern/Versand unverändert. RC.

## 2.43.1 – 2026-10-07 – KC-CLUB-TERMIN-WER-SAGT-AB
Fund Hansi: Thomas hatte abgesagt, beim Streichen des ganzen Termins bekam er trotzdem „leider muss ich unseren Termin absagen“. Jetzt fragt „🚫 Termin absagen“ bei gebuchten Terminen zuerst „Wer sagt ab?“: „📱 <Name> hat abgesagt“ öffnet direkt „Mitglied hat abgesagt“ (keine „ich muss absagen“-Mail, Bestätigung freiwillig, kein neuer Link); nur „🙋 Ich sage ab“ schickt die Absage mit neuem Link. Server kc-termine: t_slot_absagen bei gebuchtem Termin nur mit ausdrücklichem ich_sage_ab (sonst 409, nichts geändert).

## 2.43.0 – 2026-10-07 – KC-CLUB-JACKE-WOCHENTAG
Wunsch Hansi: Bei 🧑‍🍳 Mein Bild der Schalter „🔄 Kochjacke wechselt jeden Tag“ (auch im Baukasten unter Kochjacke: „🔄 täglich wechselnd“). Mo weiß/schwarze Knöpfe, Di schwarz/gold, Mi weinrot/weiß, Do marineblau/weiß, Fr grau/weinrot, Sa grün/gold, So hellblau/marine – nach deutscher Zeit; alle sehen dieselbe Tagesfarbe (steckt im Bild-Code). Neue feste Jackenfarben: weinrot, marineblau, grün, hellblau. Kein Server-Eingriff nötig.

## 2.42.0 – 2026-10-07 – KC-CLUB-MG-ONLINE-FARBE, -AVATAR-GROSS, -KOPFFORM, -MUETZEN
Wunsch Hansi: Mitglieder-Kacheln von Mitgliedern, die gerade online sind, sind grün hinterlegt (sofort erkennbar). Bei 🧑‍🍳 Mein Bild und beim Zusammenstellen: Vorschau antippen = groß ansehen. Neu im Baukasten: Kopfform (normal, rundlich, eckig, oval, länglich, herzförmig) und auf dem Kopf „Chefmütze (hoch)“, „Schiffchen (Lehrling)“ und „Spitzenhaube“ (wie früher Hausmädchen) – mit Farbe und Muster. Code bekommt ein 19. Zeichen (Kopfform), alte Codes bleiben gültig. Server: Avatar-Code bis 19 Zeichen. SERVER_VERSION 2.42.0.

## 2.41.0 – 2026-10-07 – KC-CLUB-DIENSTWUNSCH: DP2 Build 262 RC
DP2 auf Build 262 RC übernommen (dp3 d8976b9, Zweig codex/club-app-interface, Wunsch Hansi). Für die Mitglieder-Eingabe (Twinkey) neu aus Build 258–260: ganzer Sperrtag ohne Bereitschaft, „Deine Dienstzeiten wurden erfolgreich verschickt“ erst nach bestätigtem Speichern (sonst Hinweis), Abgleich des vollständigen Twinkey-Auftrags, freiwillige Unterbrechungen, kompakte Tagesauswahl (Tage zum Aufklappen, „Twinkey hilft dir“ eingeklappt). Build 261/262 (Personenkonto, Handschrift-Ziffern) betreffen nur DP2. DP2-Dateien unverändert (Prüfsummen in dp2/QUELLE.json). Datenformat unverändert. RC.
- Auftrag an Codex: docs/DP2_CODEX_AUFTRAG_KLAPPBEREICHE.md (KC-DP-KLAPPBEREICH, DP2 Build 263) – Klappbereiche in DP2 wie in der Club-App (Pfeil ▾, Schloss 🔓/🔒, gemerkt, unten „▴ Zuklappen“).

## 2.40.1 – 2026-10-07 – KC-CLUB-SPUR-BILD
Wunsch Hansi (Klaus' neues Bild fehlte in „👣 Wege der Mitglieder“): Öffnen von „🧑‍🍳 Mein Bild“ und jedes Speichern (Koch-Figur, eigene Figur, Foto, entfernt) stehen jetzt im Wege-Protokoll – nur die Art, nie das Bild.

## 2.40.0 – 2026-10-07 – KC-CLUB-EINZELCHAT
Wunsch Hansi: „💬 Nachricht in der App“ (Mitgliederseite und überall, wo man jemandem schreibt) öffnet jetzt den vorhandenen Chat mit dieser Person – mit allen bisherigen Nachrichten. Gibt es noch keinen, kommt wie bisher ein neuer. Vorbereitete Anfänge (Geburtstag, Hilfe, Börse, Büro) überschreiben keinen angefangenen Entwurf. Server: einzelchat_finden. SERVER_VERSION 2.40.0.

## 2.39.1 – 2026-10-07 – KC-CLUB-ANHANG-ANSEHEN
Meldung Hansi (Bildschirmfoto an Christina/Reinhilde kam nicht an – beim Antippen war es weg): Ein Anhang über dem Schreibfeld zeigt jetzt ein kleines Vorschaubild. Antippen öffnet ihn groß (✅ Behalten / 🗑️ Entfernen); entfernt wird nur noch über das eigene ✕.

## 2.39.0 – 2026-10-07 – KC-CLUB-AVATAR-RANDLOS
Wunsch Hansi (nach Foto seiner Brille): neue Brille „randlos“ – rechteckige Gläser ohne Rand, dünner Metallsteg mit Nasenpads, dünne Bügel; dazu Brillenfarbe Titan-Grau.

## 2.38.0 – 2026-10-07 – KC-CLUB-AVATAR-KNOEPFE-OBEN
Wunsch Hansi: Bei 🧑‍🍳 Mein Bild stehen „🧩 Selbst zusammenstellen“, 🤳 Selfie, 🖼️ Galerie und 📁 Datei jetzt oben direkt rechts neben dem Bild (mit Trennlinie) – kein Runterscrollen mehr. Unten nur noch ein Hinweis darauf.

## 2.37.1 – 2026-10-07 – KC-CLUB-NUR-AUSGEBLENDETE (Nachbesserung)
Wunsch Hansi: Ohne ausgeblendete Kacheln steht unten kein Hinweis mehr – auch nicht nach dem Wischen in ein Register ohne ausgeblendete; „nur ausgeblendete“ schaltet sich dort von selbst ab.

## 2.37.0 – 2026-10-07 – KC-CLUB-NUR-AUSGEBLENDETE
Wunsch Hansi: Unter den Kacheln „👀 Nur ausgeblendete zeigen“ – dann stehen nur die ausgeblendeten Kacheln da (gestrichelt umrandet) und lassen sich ganz normal öffnen. „🙈 Ausgeblendete wieder verbergen“ schaltet zurück. Nur Anzeige, die gespeicherte Anordnung bleibt unverändert.

## 2.36.0 – 2026-10-07 – KC-CLUB-MEINE-NACHRICHTEN-STATISTIK
Wunsch Hansi: Jedes Mitglied sieht im Chat unter ⋮ „📊 Meine Nachrichten-Statistik“ – eigene E-Mails, Push und Club-Nachrichten (bekommen/geschrieben), je Tag, Uhrzeit, letzte 20. Nur Anzahl und Zeit, keine Inhalte. Server: meine_nachrichten_statistik (nur ich.person_id). SERVER_VERSION 2.36.0.

## 2.35.0 – 2026-10-06 – Nachfrage 4 Wochen nach der Schulung
KC-CLUB-SCHULUNG-NACHFRAGE (Wunsch Hansi): Besuchsprotokoll – installiert auf (neu: Notebook, Leihgerät folgt) und Programme (Bilderrechner, Köcheclub-App, Kasse, Dienstplan, KC Verwaltung, Präsentation). 4 Wochen nach der Schulung: Push an Hansi und Karte in 🎓 Schulungen „📨 Nachfrage senden?“ mit fertigem Text (änderbar, Ihr-Form bei zweien) – Senden mit einem Tipp als Club-Nachricht, oder „Nicht nötig“. Nie automatisch an Mitglieder.

## 2.34.0 – 2026-10-06 – Nachrichtenzahl und Nachrichten-Statistik
KC-CLUB-NACHRICHTEN-ZAHL: Mitgliederseite „💬 Nachricht in der App – 37 Nachrichten“ (Einzelchat zwischen dir und dem Mitglied), Chatliste „💬 37“. KC-CLUB-NACHRICHTEN-STATISTIK (nur Admin): Mitgliederseite „📊 Statistik“ und Nutzung → „📨 Nachrichten“ – E-Mail, Push (angezeigt/geöffnet), Club-Nachrichten; 7/30/90 Tage/1 Jahr; Balken je Tag, Uhrzeit, die letzten 20 – nur Art, Zeit und Status, keine Inhalte.

## 2.33.0 – 2026-10-06 – Avatar: Brillenbügel, neue Kopfbedeckungen, Farben und Muster
KC-CLUB-AVATAR-KOPF (Wunsch Hansi): Brillen mit Bügeln bis zum Ohr; neue Kopfbedeckungen Bandana, Military-Mütze, Kopftuch lang, Stirnband, Haarreif, Haarspange, Kappe verkehrt; für jede Kopfbedeckung (auch Kochmütze) Farbe (13) und Muster (Punkte, Streifen, Karo, Tarnmuster, Blümchen, Paisley). Alte Figuren bleiben unverändert.

## 2.32.0 – 2026-10-06 – Fang den Koch neu und einfach
KC-CLUB-FDK-EINFACH (Wunsch Hansi): Fang den Koch komplett vereinfacht – Rundweg mit 12 Feldern um ein 4 × 4-Brett, nur vorwärts; Bon mit 3 Zutaten; Zutaten im Vorbeigehen automatisch; alle 3 ✓ + am Pass vorbei = 1 ⭐; genau auf Kurt landen = Zutat wegnehmen; ⭐-Glücksfelder (noch einmal würfeln, Topf übergekocht, Lieferant). Unten nur 🎲 Würfeln, 📖 Regeln, ✖ Abbrechen; Regeln mit 3 Bildern beim ersten Spiel. 15 Runden, Gleichstand: mehr ✓ auf dem Bon.

## 2.31.0 – 2026-10-06 – Startstatistik für den Admin
KC-CLUB-STARTSTATISTIK: Jeder App-Start wird mit Zeitpunkt, Dauer (Teile: Seite, Programm, Server, Anzeige), Gerät, Browser, App/Browser, Netz und Version gemeldet; Admin → Nutzung → ⏱️ Startstatistik mit 7/30/90/180 Tagen, Filter Mitglied/Gerät, Übersicht je Mitglied, je Gerät/Browser, je Netz und Starts einzeln (grün/gelb/rot). Aufbewahrung 180 Tage.

## 2.30.1 – 2026-10-06 – Abgesagte Schulungen im Kalender, Begrüßen-Knopf
KC-CLUB-SCHULUNG-ABGESAGT-KALENDER: abgesagte Schulungstermine bleiben im Kalender – grau, durchgestrichen, „❌ abgesagt“; Handy-Abo CANCELLED; Google-Kalender „❌ Abgesagt: KC-Besuch Name“ in Rot. KC-CLUB-WILLKOMMEN-BEGRUESSEN: am Willkommens-Zettel „💐 Ich möchte auch begrüßen“ → Chat mit dem neuen Mitglied, Anfang eingetragen.

## 2.30.0 – 2026-10-06 – Schnellerer Start + Sparmodus
KC-CLUB-START-PARALLEL: Der Server beantwortet den Start mit allen Abfragen gleichzeitig statt ~20 nacheinander (Inhalt unverändert). KC-CLUB-SPARMODUS: bei langsamem Netz, Datensparen, wenig Speicher oder zwei langsamen Starts automatisch: keine Bewegungen, Hintergrund seltener (×3); 🐢 im Kopf; Einstellungen → Darstellung: Automatisch / Immer an / Aus.
- KC-CLUB-SPUR-OEFFNEN (Fall Reinhilde): Jedes Öffnen der App ist ein Schritt „📲 App geöffnet“ im Weg und wird nach 3 s gemeldet – auch ganz kurze Besuche nur auf der Startseite sind sichtbar.

## 2.29.0 – 2026-10-06 – Willkommens-Post-it für neue Mitglieder
KC-CLUB-WILLKOMMEN-PINNWAND: Meldet sich ein neues Mitglied zum ersten Mal an, hängt die Clubleitung automatisch ein ❗ wichtiges Post-it „💐 Herzlich willkommen! Wir begrüßen unser neues Mitglied …“ für alle an die Pinnwand – genau einmal, ohne Push/Mail.

## 2.28.1 – 2026-10-06 – Avatar: grau meliert feiner
Grau meliert = dunkelblond mit feinen, fast senkrechten grauen Strähnen (statt grober Schrägstreifen); Farbpunkt im Baukasten angepasst.

## 2.28.0 – 2026-10-06 – Terminprogramm komplett in der Club-App; Absage durch Mitglied eintragen
KC-TERMINE-UMZUG: Quellcode kc-termine, Mitgliederseite termin.html, Google-Skript und Termin-Doku liegen jetzt im Repo KC-Clubapp; Hochladen bei Änderung unter supabase/functions/kc-termine; alte Links leiten weiter. KC-CLUB-SCHULUNG-MITGLIED-ABSAGE: 🚫 Absagen → 📱 Mitglied hat abgesagt (WhatsApp/Telefon/persönlich, Notiz, Bestätigungsmail ohne Link); 📨 Neu einladen danach nur mit angekreuzten Terminen.

## 2.27.2 – 2026-10-06 – Avatar: Kinnbart, Halstuch, meliert, Brillen, Knöpfe, Initialen
Avatar-Baukasten: Kinnbart sitzt am Kinn (nicht mehr am Hals); Halstuch größer mit Knoten und zwei herabhängenden Zipfeln; Haarfarbe „grau meliert“; Brillen zusätzlich oval, Hornbrille, Katzenauge, Pilotenbrille; Knopffarbe der Kochjacke wählbar (passend, gold, schwarz, rot, blau, weiß, silber) mit Doppelreihe; auf der Kochmütze klein die Initialen. Alte Figuren bleiben gültig. (KC-CLUB-AVATAR-FEIN, Wunsch Hansi)

## 2.27.1 – 2026-10-06 – Admin: Brille auf der Startseite ausblendbar
Einstellungen (nur Admin): „🕶️ Brille oben auf der Startseite zeigen“ – aus = die Brille ist auf der Startseite ausgeblendet (z. B. bei einer Vorführung), gilt für dieses Gerät. (KC-CLUB-INKO-KNOPF, Wunsch Hansi)

## 2.27.0 – 2026-10-06 – 🧑‍🍳 Fang den Koch (Stufe 1)
Neues Küchen-Brettspiel in der Köcheclub Edition: Fang den Koch – gegen Koch Kurt (Computer, leicht/mittel/schwer). Küche aus 9 großen Kacheln, würfeln = Schritte, Feld für Feld laufen; an jeder Station Zutaten nehmen, im Geräteregal das Gerät holen (gibt es nur einmal), an der richtigen Station kochen, am Pass abgeben; Gäste warten 8 Runden (Rest = Trinkgeld). „Fang den Koch!“: wer auf den anderen läuft, nimmt ihm etwas ab. 8 Gerichte, 15 Runden, Ansage, Pause, Abbrechen, Kachel-Knöpfe. Stufe 2 (gegen Mitglieder) folgt. (KC-CLUB-FDK, Idee Hansi)

## 2.26.0 – 2026-10-06 – 🎲 Mensch ärgere dich nicht
Neues Spiel in der Köcheclub Edition: Mensch ärgere dich nicht. Gegen den Computer (1–3 Computer-Gegner, Stärke, eigene Farbe) und gegen Mitglieder mit Herausforderung, Terminvereinbarung und Einladung – zu zweit, die freien Farben spielt auf Wunsch der Computer. Sauberes Spielfeld (klassisches Kreuz), großer Würfel, leuchtende Figuren zum Antippen, Ansage, Pause, Abbrechen, Knöpfe als Kacheln. Der Server würfelt und prüft jeden Zug. (KC-CLUB-MAE, Wunsch Hansi)

## 2.25.12 – 2026-10-06 – Spiele-Übersicht wieder richtig
Korrektur zu 2.25.11: Die neuen Kachel-Knöpfe bei Tic-Tac-Toe/Bauernskat hatten denselben Klassennamen wie die Spiele-Übersicht – dadurch waren die Spiel-Kacheln schmal und abgeschnitten. Eigener Name (sp-knopfreihe), Übersicht wieder wie vorher; Test verhindert die Doppelbelegung. (KC-CLUB-SP-KACHELN, Fund Hansi)

## 2.25.11 – 2026-10-06 – Spiele: Knöpfe als Kacheln nebeneinander
Tic-Tac-Toe und Bauernskat gegen den Computer: „↺ Neue Runde/Neues Spiel“, „🗑️ Stand löschen“ und (bei Tic-Tac-Toe) „🔊 Töne“ als gleich große Kacheln nebeneinander – wie beim Küchenterror. (KC-CLUB-SP-KACHELN, Wunsch Hansi)
Mitglieder-Seite: Nachricht, Spiel herausfordern, App-Link, Einrichtungskarte, Amt & Rechte, Telefonbuch (und online: Anklopfen, Anrufen, Video) als gleich breite Kacheln, 2 je Reihe. (KC-CLUB-MD-KACHELN, Wunsch Hansi)

## 2.25.10 – 2026-10-06 – Küchenterror: Spiel abbrechen
Küchenterror gegen den Computer: Neuer Knopf „✖ Spiel abbrechen“ – die Uhr hält an, nach Rückfrage endet die Runde ohne Wertung (Spielstand bleibt); „▶ Weiterspielen“ macht mit 3-2-1 weiter. (KC-CLUB-KT-ABBRECHEN, Wunsch Hansi)

## 2.25.9 – 2026-10-06 – Küchenterror: Knöpfe ordentlich nebeneinander
Küchenterror gegen den Computer: Stufe über die volle Breite mit gleich hohen Feldern (Symbol, Name, Sekunden untereinander); „▶ Los geht’s“, „🔊 Ansage“ und „🗑️ Stand löschen“ als drei gleich große Kacheln nebeneinander (Symbol über dem Text). (KC-CLUB-KT-KNOEPFE, Wunsch Hansi)

## 2.25.8 – 2026-10-06 – Gruppen: grüne LED wenn alle online
Am Symbol einer festen Gruppe leuchtet unten rechts eine grüne LED, wenn alle anderen Mitglieder gerade online sind; das 🔗 sitzt jetzt unten links. (KC-CLUB-GRUPPE-ALLE-ONLINE)

## 2.25.7 – 2026-10-06 – KC-CLUB-SPUR-AKTUALISIEREN: ↻ bei „👣 Wege der Mitglieder“ (Wunsch Hansi)
- Admin → 📊 Nutzung → 👣 Wege der Mitglieder: runder ↻-Knopf oben rechts wie auf der Startseite. Lädt denselben Tag (und, falls offen, dieselbe Person) neu; vorher werden die eigenen noch nicht gesendeten Schritte übertragen. Dreht sich beim Laden.
- Hinweis: Die Apps der Mitglieder senden ihre Schritte gesammelt alle 2 Minuten (und beim Verlassen der App) – ganz frische Schritte erscheinen erst danach.
- Server unverändert (kc-club bleibt 2.25.5).

## 2.25.6 – 2026-10-06 – KC-CLUB-MG-AKTUALISIEREN: ↻ auf der Mitglieder-Seite (Wunsch Hansi)
- 👥 Mitglieder: oben rechts ein runder ↻-Knopf wie auf der Startseite. Holt den Online-Stand und die Mitgliederliste neu (Status, LED, „online seit“, „zuletzt online“) – gilt für Kacheln, Liste und Anwesenheitstafel. Dreht sich, solange geladen wird.
- Server unverändert (kc-club bleibt 2.25.5).

## 2.25.5 – 2026-10-06 – KC-CLUB-ONLINE-SEIT: Anwesenheitstafel mit „online seit …“ / „zuletzt online um …“ (Wunsch Hansi)
- 📋 Mitglieder → Anwesenheitstafel: unter jedem Namen eine kleine Zeile – grün „online seit 14:32“ (über Mitternacht „seit gestern 23:50“), sonst „zuletzt online heute um 18:05“, „zuletzt online gestern“, „am 28.09.“ oder „länger nicht online“.
- Server merkt sich beim Online-Takt den Beginn der aktuellen Sitzung (Einstellung „online_seit“; neue Sitzung nach mehr als 150 s Pause, geschrieben höchstens alle 30 s) und liefert ihn über „zuletzt da“ mit – dieselben Privatsphäre-Regeln (Online/Zuletzt verborgen, Inkognito) wie bisher. Ohne Angabe steht nichts da, nie geraten.
- Online-Zustand aus derselben Quelle wie LED und Ring (2.24.18). Server kc-club 2.25.5, keine Datenbankänderung.

## 2.25.4 – 2026-10-06 – KC-CLUB-ERSTATTUNG-BESUCHE: km aus Besuchen über die Erstattung an den Kassenwart (Wunsch Hansi)
- 💶 Erstattung → 🚗 Fahrtkosten (nur Admin): neuer Knopf „🎓 Fahrten aus Besuchen übernehmen“. Zeigt stattgefundene Besuche mit km (Hin + Rück), die noch in keinem Antrag stehen; Haken setzen → als Fahrtpositionen übernehmen (Datum, km, Satz am Fahrtag, Grund „Mitgliederbesuch/Schulung: Name (Anzahl) · Zeit“, Ziel = Ort, Besuchs-ID).
- Danach wie gewohnt „📨 Antrag senden“ – Mail an Kassenwart (CC Clubsprecher), Büro-Eingangskorb, Bestätigung. In der Mail steht je Fahrt die Besuchs-ID.
- Server prüft: Besuch hat stattgefunden, Datum und km wie im Besuchsprotokoll, nicht schon in einem anderen (nicht abgelehnten) Antrag. Ein abgelehnter Antrag gibt die Besuche wieder frei.
- Besuche bei mir (0 km) und geplante Besuche erscheinen nicht. Server kc-club 2.25.4.

## 2.25.3 – 2026-10-06 – KC-CLUB-KM-ABRECHNUNG: Fahrten-/km-Abrechnung der Besuche (Wunsch Hansi)
- 🎓 Schulungen → Besuche: neuer Knopf „🖨️ km-Abrechnung“ (Zeitraum: Jahr, letzter Monat oder von–bis; Besuche bei mir mit 0 km wahlweise).
- Blatt mit Kopf (Kochmütze, Köcheclub Werne), Antragsteller, Zeitraum; je Einsatz Nr., ID, Datum, Zeit von–bis (mit Dauer), besuchte Personen mit Anzahl, Grund, km (Hin + Rück).
- Gesamtzeile mit Anzahl Einsätze, Gesamtzeit und Gesamt-km; darunter Ort, Datum, Unterschrift Antragsteller und „Geprüft / ausgezahlt – Kassenwart“.
- Nur stattgefundene Besuche (geplante zählen nicht, wie bei den Kennzahlen). Fehlende km bei „Ich fahre hin“ stehen als „fehlt“ und werden nie als 0 gezählt.
- Druck-Auswahl liegt jetzt über offenen Fenstern (z-index), damit sie aus 🎓 Schulungen heraus sichtbar ist. Server unverändert (kc-club bleibt 2.25.2).

## 2.25.2 – 2026-10-06 – KC-CLUB-SCHULUNG-VERSANDSTAND: auch über den Club-Chat (Hinweis Hansi „die Sachen sind über den Club rübergekommen“)
- Die Felder Einladung · Bestätigung · Erinnerung · Danksagung zählen jetzt drei Wege: Termin-Programm (mit Ergebnis je Person), eigene Nachricht im Club-Chat und Mail von Hand über den Communicator.
- Club-Chat zählt nur in Unterhaltungen, in denen außer dir ausschließlich die Personen dieser Einladung sind (keine großen Gruppen). Zuordnung: „erinner…“ in den 3 Tagen vor dem Termin = Erinnerung, „dank…“ bis 7 Tage danach = Danksagung.
- Fehler aus 2.25.1 behoben: Die Erinnerung zeigte ✅, sobald der Server sie vermerkt hatte – auch wenn sie „nicht zugestellt“ war (Karla/Ruth, 05.10.: keine Mail-Adresse, kein Push). Jetzt: ✅ nur wenn alle Personen erreicht wurden, ◐ teilweise, ⚠️ nicht zugestellt.
- Antippen zeigt zuerst die Belege (Weg, Zeit, an wen, Textanfang bzw. Ergebnis), darunter den Versand im Communicator.
- Server kc-club 2.25.2: t_init liefert zusätzlich versandstand (nur lesend).

## 2.25.1 – 2026-10-06 – KC-CLUB-SCHULUNG-VERSANDSTAND: bei jeder Einladung sehen, was raus ist (Wunsch Hansi)
- 🎓 Schulungen → Einladungen: unter jedem Eintrag vier Felder – Einladung, Bestätigung, Erinnerung, Danksagung – mit ✅ (verschickt), ⬜ (noch offen), ⚠️ (Problem, z. B. keine E-Mail-Adresse oder Termin vorbei ohne Erinnerung) und ➖ (entfällt, z. B. direkt bestätigt ohne Einladung).
- Antippen zeigt die Details: wann, ob Mail oder Push, an wen, Betreff und Fehler (aus dem KC Communicator über die vorhandene Chronologie); bei der Danksagung Empfänger und Versandzeit aus dem Besuchsprotokoll. Von dort „📜 Ganzer Ablauf“.
- ✅ nur bei echtem Versandzeitpunkt (Einladung: Mail verschickt; Bestätigung: Mail verschickt; Erinnerung: vom Server vermerkt; Danksagung: Mail an das Mitglied). „Keine E-Mail-Adresse“ zählt nie als verschickt.
- Server unverändert (kc-club bleibt 2.25.0, kc-termine unverändert).

## 2.25.0 – 2026-10-06 – KC-CLUB-KUECHENTERROR-ABWECHSLUNG: 100 neue Fragen, jede Partie fängt anders an (Wunsch Hansi)
- 🔪 Küchenterror hat 100 neue Fragen (k191–k290: 80 normale, 20 🎖️ Meisterfragen) – jetzt 290 insgesamt. Die neuen fangen bewusst unterschiedlich an (kein „Was ist …?“/„Was bedeutet …?“), damit man sich nicht am Satzanfang orientiert. Die richtige Antwort ist auch hier nicht an der Länge erkennbar (Vertragstest 424).
- Fragenauswahl gegen Mitglieder (Server): zuerst Fragen, die **beide** Spieler in ihren letzten 40 Küchenterror-Partien noch nicht hatten, zufällig gemischt. Erst wenn die nicht reichen, kommen die am längsten zurückliegenden. So beginnt jede Partie (auch die Revanche) mit anderen Fragen und es wiederholt sich nichts, bis der Vorrat durch ist.
- Gegen den Computer (App): gleiche Regel, Gedächtnis der letzten 150 Fragen auf dem Gerät (nur Komfort; ohne Speicher wird wie bisher zufällig gewählt).
- Bestehende Fragen-ids unverändert (laufende Partien merken sich die ids). Fragen-Datei mit ?v=3, damit Geräte die neuen Fragen laden.
- Server kc-club 2.25.0 (wird beim Push auf main automatisch hochgeladen). Keine Datenbankänderung.

## 2.24.19 – 2026-10-06 – KC-CLUB-GRUPPE-AUS-RUNDE + KC-CLUB-CHAT-KOPF-BILD
- Feste Gruppen haben jetzt ein 🔗-Abzeichen am Symbol (Liste und Chat-Kopf), Runden (Nachricht an mehrere ohne feste Gruppe) einen gestrichelten grauen Kreis mit den Anfangsbuchstaben – so sieht jeder, was eine feste Gruppe ist (Wunsch Hansi).
- Wer eine Runde begonnen hat, bekommt beim zweiten Mal (zweite eigene Nachricht dort oder weitere Runde mit genau denselben Leuten) im Chat einen Streifen „Daraus eine feste Gruppe machen?“ – Name und Symbol wählen, dieselbe Unterhaltung wird zur Gruppe, alle Nachrichten bleiben. Kein Fenster beim Öffnen, keine Push/Mail an alle; „Nein, danke“ gilt für diese Runde dauerhaft (Gerät).
- Server: neue Aktion runde_zu_gruppe (nur Ersteller oder Admin, ab 3 Personen), Unterhaltung liefert runde {ersteller, gleiche}.
- Chat-Kopf: vorn das Bild (Avatar bzw. Gruppensymbol), dann der Name in einer Zeile; Vorlesen, Lupe und Menü kleiner ganz rechts (Wunsch Hansi).
- Knöpfe oben im Chat (Vorlesen, Lupe, Menü) mit hellem Grund, dunklem Symbol und Rand – vorher weiß auf hell, kaum sichtbar (Hinweis Hansi); Vorlesen an = grün hinterlegt.
- Tipp auf Bild oder Namen oben im Gruppen-/Runden-Chat zeigt die Mitglieder mit Bild, Online-Ring und 👑; Tipp auf ein Mitglied öffnet es, darunter „⋮ Gruppe & Einstellungen“ (Wunsch Hansi). Im Einzelchat öffnet der Tipp das Mitglied.

## 2.24.18 – 2026-10-06 – KC-CLUB-ONLINE-EINE-QUELLE: Online-Anzeige überall gleich
- Der grüne Ring „gerade online“ um Bild/Namen nimmt jetzt denselben Stand wie die LED oben und die Zahl (Online-Takt alle 15–60 s). Vorher kam er aus der Mitgliederliste, die nur beim Öffnen geladen wurde – darum zeigten LED und Ring zu unterschiedlichen Zeiten an (Hinweis Hansi).
- Kommt jemand online oder geht, zeichnet sich die Mitgliederseite sofort neu. Ist der Online-Stand älter als 3 Minuten, gilt wie bisher der Wert aus der Liste (unbekannt nie als OK).
- Kommt die Ansage „X ist jetzt online“ per Push, fragt die App sofort nach – LED, Zahl und Ring erscheinen gleichzeitig mit der Ansage statt bis zu 60 s später.
- Server unverändert (kc-club bleibt 2.24.16).

## 2.24.17 – 2026-10-06 – KC-CLUB-KOPF-ORDNUNG: Kopfzeile aufgeräumt (Wunsch Hansi)
- Obere Zeile: Kochmütze, darunter klein die Versionsnummer (antippen = Update prüfen, bei neuer Version gelb mit 🆕); daneben „KÖCHECLUB WERNE“ und der Gruß „Hallo …!“; rechts nur noch 🌙 und ↻ gleich groß.
- Darunter eine Statusleiste: links der Status mit dem Pfeil auf der Unterkante, rechts die Verbindungs-LEDs (jetzt waagerecht), nach einem Trennstrich Herz und 🕶️ (nur Admin).
- Einfache Ansicht: unverändert ruhig – nur der Status ohne dunklen Balken, LEDs nur bei Störung.
- Server unverändert (kc-club bleibt 2.24.16).

## DB – 2026-10-06 – KC-CORE-PERSON-UEBERNAHME V1 (gebaut und lokal getestet, NICHT eingespielt)
- Migration `20261006_kc_core_person_uebernahme_v1.sql` (abgestimmt mit Codex, Antworten 1–6):
  - Speicherschutz Manager-Abschnitte: `kc_manager_section_speichern` (Compare-and-swap) und Trigger „version = alt + 1“ im Modus „melden“ (Erzwingen nur nach eigener Freigabe).
  - Personenübernahme: `kc_core_person_aenderung_uebernehmen` schreibt Kernwerte, Audit (`kc_core_people_audit`) und Status in einem Datenbankvorgang; Vorgangsnummern (`kc_core_person_vorgaenge`) auch für Ablehnungen; Mitgliedschaft nur Admin; Festnetz gesperrt.
  - `kc_core_person_aenderungen_offen` zusätzlich mit `erwartet_schluessel` und `schreibbar`.
- Lokale Datenbank-Tests unter `tools/db-test/` (30 Fälle, gleichzeitige Aufrufe, Speicherschutz). Die Club-App ruft nichts davon auf.

## 2.24.16 – 2026-10-06 – Kurzanleitung Bilderrechner Version 4.1 (Wunsch Hansi)
- Dokumente: „Schnellanleitung Bilderrechner“ zeigt jetzt `dokumente/Kurzanleitung_Bilderrechner_V4.1.pdf` (28 Seiten, Stand Kasse 06.10.2026).
  Neu gegenüber 4: Seite 21 „Bon drucken / Letzten Bon“ mit „Bon ansehen“ (🖨 Drucken, ← Zurück zur Kasse); auf der Titelseite der
  Hinweis auf die laufenden, gestrichelten Rahmen (Warengruppe grün, Artikel hellblau, Warenkorbzeile blau). Version 4 bleibt im Ordner.

## 2.24.15 – 2026-10-06 – KC-CLUB-PRUEFUNG-4: Status-Pfeil + Hilfe-Korrekturen
- Status-Pfeil oben: als Zeichnung genau mittig auf der Unterkante (vorher bis 2 px links), in der Farbe des Status mit weißem Rand (Wunsch Hansi).
- Hilfe/Tipps: Sprung in die Einstellungen öffnet den Bereich auch in der einfachen Ansicht; „Was ist neu“-Schalter zu „Ansagen, Töne & Tipps“ (auch einfache Ansicht), Hilfetext mit Spielen; Twinkey „Urlaub/krank“ öffnet den Status (vorher Standort); Dienstwünsche-Weg über 🗓️ Mein Dienst; Entwickler-Weg über ℹ️ App-Info; Tipp-Text „höchstens einmal in der Woche“; „Später“-Meldungen ohne falsche Tage; Kachel-Tipp nur erweitert; keine Versprechen „was zuletzt dazugekommen ist“.
- Büro: unvollständige Server-Antwort zeigt Hinweis statt Fehler.
- Hilfe „Was speichert die App über mich?“ nur noch für den Admin sichtbar (Wunsch Hansi), Mitglieder sehen keinen Hinweis.
- Bedienungsanleitung Version 7 (51 Seiten, neuer Teil 19 „Neu in Version 7“, korrigierte Stellen) ersetzt V6 in „Meine Dokumente“; V6-Datei bleibt unverändert.
- Knopf „📌 Pinnwand-Einträge ansehen“ richtig geschrieben (vorher „Eintrage“).

## 2.24.14 – 2026-10-06 – Tagesmeldung mit Spielen
Die Meldung beim Öffnen nennt jetzt auch Spiele, die auf dich warten. Unten kann man sie ausschalten. (KC-CLUB-WAS-NEU)

## 2.24.13 – 2026-10-06 – Weniger Fenster beim Öffnen
Beim Öffnen kommt höchstens noch ein Hinweis-Fenster. Tipp des Tages und Spiele-Einladung höchstens einmal in der Woche. (KC-CLUB-RUHE)

## 2.24.12 – 2026-10-06 – Was ist neu – beim Öffnen
Beim Öffnen zeigt die App, wie viele neue Nachrichten (in Chats und Gruppen) und Pinnwand-Einträge da sind – mit Knopf direkt dorthin. (KC-CLUB-WAS-NEU)

## 2.24.11 – 2026-10-06 – Startzeit messen
Unter ⚙️ → ℹ️ App-Info steht jetzt, wie lange der letzte Start gedauert hat – aufgeteilt in Seite, Programm, Einrichten, Server und Anzeigen, dazu die letzten 10 Starts. (KC-CLUB-STARTZEIT)

## 2.24.10 – 2026-10-06 – Mein Bild aus Datei
Mein Bild: „Datei“ öffnet jetzt den Datei-Explorer statt der Galerie.

## 2.24.9 – 2026-10-06 – Bauernskat nach Köcheclub-Regeln
Bauernskat: jeder hat 8 Häufchen (verdeckt, offen darauf); vor jedem Spiel wird sichtbar gemischt und in Viererpäckchen ausgeteilt – je zweimal verdeckt, dann zweimal offen. Wer gibt, wechselt; Trumpf-Ansage bleibt. (KC-CLUB-BAUERNSKAT-AUSTEILEN)

## 2.24.8 – 2026-10-06 – Schnellerer Start
Das Programm liegt jetzt in einer eigenen Datei, die das Handy fertig eingelesen behält – die App startet schneller. Seite und Programm werden immer zusammen aktualisiert. (KC-CLUB-SCHNELLSTART-DATEI)

## 2.24.7 – 2026-10-06 – Datenbank aufräumen
Admin: im Bereich 🗄️ Supabase sieht man, was am meisten Platz braucht, und kann alte technische Protokolle aufräumen. Läuft jede Nacht auch von selbst; ab 400 MB kommt eine Warnung. (KC-CLUB-DB-AUFRAEUMEN)

## 2.24.6 – 2026-10-06 – Bild speichern ohne Fehlermeldung
Beim Speichern des eigenen Bildes kam manchmal eine Fehlermeldung, obwohl alles gespeichert war. Behoben.

## 2.24.5 – 2026-10-06 – Ruhiger Start
Nach dem Öffnen dreht sich die Kochmütze nicht mehr bei Prüfungen, die die App von selbst im Hintergrund macht. (KC-CLUB-START-STILL)

## 2.24.4 – 2026-10-06 – Online-Ring leuchtet
Wer gerade online ist, hat jetzt einen grünen Ring um sein Bild, der langsam an- und abschwillt. (KC-CLUB-ONLINE-ATEM)

## 2.24.3 – 2026-10-06 – Gruppen-Admins
Wer eine Gruppe anlegt, kann weitere 👑 Gruppen-Admins bestimmen und die Gruppe beim Verlassen übergeben. (KC-CLUB-GRUPPEN-ADMIN)

## 2.24.2 – 2026-10-06 – Update kommt schneller an
Findet die App beim Öffnen eine neue Version, lädt sie sie sofort – nicht erst beim nächsten Öffnen. (KC-CLUB-UPDATE-START)

## 2.24.1 – 2026-10-06 – ✨ Animierte Knöpfe an/aus (Wunsch Hansi)
- KC-CLUB-ANIMATION-SCHALTER: Einstellungen → 🎨 Darstellung → „✨ Animierte Knöpfe“ (Standard an, je Gerät). Aus: Kacheln öffnen ohne Zoom sofort, Reiter-Rahmen läuft nicht, „＋ Neu“ leuchtet nicht auf. Tipp/Hilfe „Ruhige oder lebendige Knöpfe“. Nur App.

## 2.24.0 – 2026-10-06 – 📋 Meine Gruppen + gemeinsame Gruppen (Wunsch Hansi)
- KC-CLUB-GRUPPEN-UEBERSICHT: bei 👥 Mitglieder neben den Gruppen „📋 Übersicht“ (alle eigenen Gruppen mit Mitgliedern, 💬 Zum Gruppen-Chat, 👥 Als Liste); auf der eigenen Mitglieds-Seite „📋 Meine Gruppen“; bei anderen „👥 Gemeinsame Gruppen“. Gezeigt werden nur Gruppen, in denen man selbst ist – private Gruppen anderer bleiben privat. Nur App.

## 2.23.99 – 2026-10-06 – Baukasten: mehr Gesichtsteile, große Vorschau, Zufall + Hinweis „wird als Knopf angezeigt“ (Wunsch Hansi)
- KC-CLUB-AVATAR-BAUKASTEN: neue Teile Augen (normal, lachend, groß, Wimpern), Augenbrauen (normal, schmal, kräftig, buschig), Mund (Lächeln, breites Lachen, verschmitzt, ruhig), Wangen (zart, keine, kräftig, Sommersprossen), Brille (rund, eckig, Halbbrille, Sonnenbrille) mit 4 Farben, Kochjacke (weiß, schwarz, grau). Vorschau 160 px, 🎲 Zufall. Neuer Code „c…“ (15 Teile); alle bisherigen Figuren und b-Codes zeichnen unverändert (340 Codes verglichen). Server nimmt c-Codes an.
- KC-CLUB-SPRUNGKNOPF: Hinweis unter dem Schreibfeld „🔘 Wird nach dem Senden als Knopf angezeigt: …“, solange ein App-Sprung im Entwurf steht.

## 2.23.98 – 2026-10-06 – Mein Bild: auswählen, dann übernehmen oder bearbeiten (Wunsch Hansi)
- Figur antippen = auswählen; oben große Vorschau mit „✅ Übernehmen“ und „✏️ Bearbeiten“ (öffnet den Baukasten mit genau dieser Figur als Vorlage – nur, solange der Baukasten freigegeben ist; sonst nur Übernehmen). „Kein Bild“ und die eigene Figur genauso. Hilfe „Ein Bild statt Buchstaben“ angepasst. Nur App.

## 2.23.97 – 2026-10-06 – Knopf in der Nachricht, der an eine App-Stelle führt (Wunsch Hansi)
- KC-CLUB-SPRUNGKNOPF: 📎 → „🔘 Knopf zu einer App-Stelle“ (Mein Bild, Meine Daten, Mein Dienst, Dienstwünsche, Termine, Pinnwand, Mitglieder, Anwesenheitstafel, Fotos, Vorschläge, Helfen, Spiele, Dokumente, Einstellungen, Hilfe, Twinkey, Mikrofon, Update). In der Nachricht steht die App-Adresse …/#zu=<ziel>; die App zeigt einen Knopf, ältere Apps/Push/E-Mail den Link, der die App dort öffnet. Nur Ziele aus der Liste, nicht freigegebene Neuheiten werden nicht angeboten. Hilfe „Einen Knopf in die Nachricht setzen“. Nur App.

## 2.23.96 – 2026-10-06 – 10 Köche mit Schnauzer (Wunsch Hansi)
- KC-CLUB-AVATAR: 10 neue Koch-Figuren m16–m25 mit Schnauzer (jetzt 40); neue Bartformen Zwirbelbart, Walross und Schnauzer mit Kinnbart (auch im Baukasten, nur angehängt – alte Codes bleiben gültig); Schnurrbart kräftiger, alle Schnauzer mit feinem Rand (heller Bart auf heller Haut bleibt sichtbar). Server lässt m16–m25 zu. Hilfe und Anleitung V6: 40 Figuren.

## 2.23.95 – 2026-10-06 – Hilfetexte zu den Neuerungen + Bedienungsanleitung V6 (Wunsch Hansi)
- ❓ Hilfe-Zentrum: 15 neue Hilfen (Mein Bild, Punkt am Bild, Anwesenheitstafel, Bild groß, 📞/🎥 auf der Kachel, Meine Daten, Mein Dienst, Pfeil-Menü, nachträglich wichtig, Ganzer Chat, Abstimmung an wen, grüner Haken, Verbindung an Hansi, Mitglieder fragen, unter Vorbehalt); „Mitglieder als Kacheln, Liste oder Tafel“ ergänzt.
- KC-CLUB-ANLEITUNG-V6: Bedienungsanleitung Version 6 (48 Seiten) – neu Teil 18 „Neu in Version 6“ mit Bildern. Ersetzt V5 in „Meine Dokumente“; V1–V5 bleiben unverändert. Baukasten tools/anleitung: fotos5.mjs, inhalt.mjs (V6).
- Bewusst nicht in Hilfen/Anleitung: Admin-Werkzeuge und noch nicht freigegebene Funktionen.

## 2.23.94 – 2026-10-06 – Inkognito nicht mehr in der Suche
- Wunsch Hansi: „Inkognito“ taucht in der App-Suche nicht mehr auf – auch nicht beim Admin (fester Eintrag entfernt, Admin-Kachel aus der Suche ausgenommen). Mitglieder fanden es schon vorher nicht.

## 2.23.93 – 2026-10-06 – Eigener Eintrag immer grün (auch mit Inkognito)
- Hinweis Hansi: Auf der Anwesenheitstafel stand man selbst mit Inkognito nur blau. Jetzt ist der eigene Kreis/LED immer „gerade online“ (Inkognito verbirgt einen nur vor den anderen); Tafel zeigt „(du · 🕶️ inkognito)“.

## 2.23.92 – 2026-10-06 – „＋ Neu“: heller Rand schwillt langsam auf und ab
- KC-CLUB-NEU-PULS (Hinweis Hansi): statt Hüpfen leuchtet der Rand 3× langsam auf und ab (1,3 s je Mal) – nur Leuchten, daher auch bei „Bewegung reduzieren“ sichtbar.

## 2.23.91 – 2026-10-06 – „＋ Neu“ pulsiert beim Betreten einer Seite
- KC-CLUB-NEU-PULS: Kommt man auf eine Seite mit „＋ Neu“ oben (Termine, Nachrichten, Fotoalbum, Helfen, Vorschläge, Pinnwand …), pulsiert der Knopf 3× kurz mit hellem Rand. Bei „weniger Bewegung“ nur der Rand.

## 2.23.90 – 2026-10-06 – Tipp des Tages: Kacheln verkleinern (nur erweiterte Ansicht)
- Neuer Tipp „🔲 Kacheln kleiner – 3 nebeneinander“: Einstellungen → Darstellung, nur in der erweiterten Ansicht; „Zeigen“ springt direkt zur Einstellung.

## 2.23.89 – 2026-10-06 – Abzeichen am Bild, Anwesenheitstafel, Bild groß, eigenes Foto als Bild
- KC-CLUB-AVATAR-ABZEICHEN: mit Figur/Foto Zustand als Abzeichen unten rechts (✓ online, blau heute, orange abwesend, ! Fehler, grau selten; unbekannt ohne), Ring breiter.
- KC-CLUB-ANWESENHEIT: Mitglieder → 📋 Anwesenheitstafel (nur Name + LED, keine Knöpfe); antippen öffnet das Mitglied. Auch unter Einstellungen → Darstellung.
- Mitglieds-Seite: Bild oben (96 px), antippen = groß.
- KC-CLUB-AVATAR-FOTO: eigenes Foto (🤳 Selfie, 🖼️ Galerie, 📁 Datei), 256×256 JPEG in den persönlichen Einstellungen (kein Dateispeicher, keine DB-Änderung); erst nur Admin (🚦 Freigaben); Admin kann Fotos entfernen; anderes Bild gewählt → Foto gelöscht.

## 2.23.88 – 2026-10-06 – KC-CLUB-SPUR: Wege der Mitglieder für den Admin (was geöffnet, mit wem, Uhrzeit – ohne Inhalte, 30 Tage)
- App merkt sich Bereiche, angesehene Mitglieder, geöffnete Unterhaltungen, gesendet (ohne Text), Anruf/Video/Anklopfen/Telefon/WhatsApp/Mail – je mit Uhrzeit.
- Server: spur_melden (nur Kürzel + Kennungen, kein freier Text), spur_liste nur Admin; Speicherung im Club-App-Protokoll, Wartung löscht nach 30 Tagen. Keine DB-Änderung.
- Admin: 👥 Nutzung → 👣 Wege der Mitglieder (Tag wählen → Mitglied → Schritte mit Uhrzeit).
- Hilfe → 🔒 Privatsphäre: „Was speichert die App über mich?“. Die namenlose Nutzungsstatistik bleibt unverändert ohne Namen.

## 2.23.87 – 2026-10-05 – 📞🎥 auf Mitglieder-Kacheln + kleine Kacheln (Wunsch Hansi)
- Mitglieder als Kacheln: zusätzlich 📞 Anrufen und 🎥 Videoanruf – aktiv, wenn die Person online ist; sonst blass mit Hinweis
  (derselbe Baustein mgAnrufKnoepfe wie in der Liste, 2.23.67). Knöpfe brechen bei Bedarf in eine zweite Reihe um.
- KC-CLUB-KACHEL-KLEIN: Einstellungen → 🎨 Darstellung → „🔲 Kacheln auf der Startseite“: ▣ Normal (2 nebeneinander) oder ▦ Klein
  (3 nebeneinander) – nur in der erweiterten Ansicht, je Gerät gespeichert (Bildschirme sind verschieden groß). Nutzt dieselben Regeln wie die
  kleinen Kacheln im Admin-Register. Test 438.

## 2.23.86 – 2026-10-05 – 🚦 Freigaben + 🧩 Figur selbst zusammenstellen (Wunsch Hansi)
- KC-CLUB-FREIGABE: Admin-Register → „🚦 Freigaben“: je neue Funktion „🔒 Nur für mich (Test)“ oder „✅ Für alle frei“ (mit Rückfrage,
  nichts wird verschickt). Mitglieder sehen nicht Freigegebenes gar nicht; der Admin sieht es mit „🔒 Test“-Hinweis. Der Server prüft mit
  (Rezeptbuch-Aktionen, Avatar-Speichern). Standard: 📖 Rezeptbuch = nur Admin, 🧑‍🍳 Mein Bild (30 Figuren) = für alle, 🧩 Baukasten = nur Admin.
  Migration 20261005_kc_club_v22386_funktion_freigabe.sql (neue Tabelle, RLS an). Protokoll „funktion_freigabe“.
- KC-CLUB-AVATAR-BAUKASTEN: „🧩 Selbst zusammenstellen“ in „Mein Bild“ – große Vorschau, Teile zum Antippen: Typ (Koch/Köchin), Hautton,
  Frisur (9), Haarfarbe (7), Kopf (Kochmütze/Kopftuch/Kappe/nichts), Bart (4), Brille, Hintergrund (12), Tuchfarbe (8). Gespeichert als kurzer
  Code („b…“), Server prüft Form und Freigabe. Zunächst nur für den Admin (Freigabe). Test 437.

## 2.23.85 – 2026-10-05 – 🧑‍🍳 Mein Bild – 30 Koch-Figuren (Wunsch Hansi)
- KC-CLUB-AVATAR: Neue Kachel „🧑‍🍳 Mein Bild“ in Meins – 30 selbst gezeichnete Koch-Figuren (15 Köchinnen, 15 Köche; Hauttöne,
  Frisuren, Bart, Brille, Kochmütze/Kopftuch/Kappe) oder „Kein Bild“ (Buchstaben wie bisher). Die Figur erscheint überall im Namenskreis
  (Mitglieder, Chat-Liste, Wer ist online …); die Zustandsfarbe (online, heute da, abwesend …) bleibt als Ring sichtbar. Reine SVG-Zeichnung
  im Code – keine fremden Bilder, keine Rechte Dritter, keine Kosten; gespeichert wird nur der Code (Einstellung „avatar“, Server prüft w01–w15/m01–m15).
  DP2-Decknamen werden bewusst NICHT verwendet (Urheberrecht, und sie sollen anonym bleiben). Später als Update: Figur selbst zusammenstellen. Test 436.

## 2.23.84 – 2026-10-05 – 🔍 Gesamtprüfung 3
- Gesamtprüfung 3 (Wunsch Hansi): automatischer Rundgang durch alle Kacheln in hell, dunkel und großer Schrift, erweiterte und einfache
  Ansicht (Fehler, Überlappungen, zu breite Seiten, abgeschnittene Texte). Behoben: Hilfe & Tipps – „x Hilfen“ ragte rechts über den Rand
  (Seite seitlich verschiebbar); Erstattung und alle Dreier-Umschalter – bei großer Schrift breiter als der Bildschirm; Mitglieder – „Alle /
  Online“ bei großer Schrift zu breit; Dokumente/Programme – lange Wörter wurden abgeschnitten, jetzt sauber getrennt (Bedienungs-anleitung,
  Schnell-anleitung, Bilder-rechner); Mein Dienst und Meine Daten zeigen bei unvollständiger Server-Antwort „unbekannt“ statt abzubrechen.
  Geprüft und in Ordnung: Farbauswahl, Admin-Blätter, Rezeptbuch, Wochenbericht, Sperren, Nachrichten-Menüs. Test 435.

## 2.23.83 – 2026-10-05 – 📖 Club-Rezeptbuch (Wunsch Hansi)
- KC-CLUB-REZEPTBUCH: Neue Kachel „📖 Rezeptbuch“ (Verein). Gemeinsame Club-Rezepte mit Foto, Kategorie, Portionen, Dauer, Zutaten und
  Zubereitung. Suche (auch nach Zutaten) und Kategorie-Chips. Im Rezept: Portionen −/＋ oder 2/4/6/10/20/50 – alle Mengen werden umgerechnet;
  Zutaten antippen = abhaken; „🛒 Einkaufsliste“ (nur nicht abgehakte, umgerechnet) teilen/kopieren; „🖨️ Drucken“ (Druckvorschau, mit Foto);
  „📤 Teilen“. Zutaten als Zeilen („500 g Mehl“, „1 1/2 EL Öl“, „½ TL Salz“) – Menge/Einheit werden erkannt. Ändern/löschen nur, wer es
  eingestellt hat (Admin alle); Löschen = ausblenden; beim Einstellen geht nichts an alle raus. Rezeptfotos dürfen alle Mitglieder sehen.
  Migration 20261005_kc_club_v22383_rezeptbuch.sql (neue Tabelle, RLS an). Test 434.

## 2.23.82 – 2026-10-05 – 🔐 Meine Daten (Wunsch Hansi)
- KC-CLUB-MEINE-DATEN: Neue Kachel „🔐 Meine Daten“ in Meins (vor „Meine Daten geändert?“): zeigt, was über mich gespeichert ist –
  👤 Stammdaten, 🔑 Zugang (erstellt, zuerst/zuletzt da, Version), 🛡️ Rollen & Rechte, 🔔 Benachrichtigungen/Status/Geräte für Push,
  📦 was ich angelegt habe (nur Anzahlen). Knöpfe ✏️ Änderung melden, 🖨️ Drucken, 💾 Als Datei sichern. Server-Aktion meine_daten nur
  lesend, nur die eigene Person, keine Schlüssel und keine Geräte-Adressen; Aufruf wird protokolliert. Test 433.

## 2.23.81 – 2026-10-05 – 📊 Wochenbericht für den Admin (Wunsch Hansi)
- KC-CLUB-WOCHENBERICHT: Jeden Montag ab 8 Uhr automatisch an die Admins per Push und E-Mail (einmal pro Woche, im Zeitplaner
  „wartung“): 👥 Nutzung (aktiv, neu, nie angemeldet, alte Version), 🩺 Fehler (schwerwiegend/Hinweise), 🛡️ Sicherheit (Schutz, Spiegel,
  Sicherung, Wiederherstellung, Überwachung), 📨 Benachrichtigungen (zugestellt/fehlgeschlagen), 📋 Offen bei dir (Erstattungen,
  Änderungsmeldungen, Twinkey-Fragen, Abstimmungen/Vorschläge, Dienstwünsche, Besuche ohne Protokoll, Gesperrte). Nur Zahlen, keine Inhalte;
  unbekannt bleibt „unbekannt“. Admin-Register → 📊 Lage: „📊 Wochenbericht“ (Vorschau) und „📨 Jetzt senden“ (Bremse 3/Std.). Test 432.

## 2.23.80 – 2026-10-05 – Pfeil an der Nachricht: Ausschneiden, Archivieren, Löschen (Wunsch Hansi)
- KC-CLUB-PFEIL-MENUE: Der Pfeil neben einer einzelnen Nachricht bietet jetzt außer ↪️ Weiterleiten und 📋 Kopieren auch ✂️ Ausschneiden
  (Text kopieren, danach die gewohnte Lösch-Rückfrage „für mich / für alle“), 🗄️ Archivieren (Nachricht als Textdatei mit Absender, Chat
  und Zeit in den eigenen Archiv-Ordner; Dateien/Fotos der Nachricht auf Wunsch mit – über den Archiv-Ablage-Kern, Art „nachricht“) und
  🗑️ Löschen (gewohnte Rückfrage). Schmale Knöpfe, zwei nebeneinander. Test 431.
- KC-CLUB-WICHTIG-NACHTRAEGLICH: am Pfeil „❗ Wichtig“ / „➖ Nicht wichtig“ – eigene Nachricht (Admin: jede) nachträglich wichtig markieren:
  orangener Rahmen + „❗ WICHTIG“ wie beim Senden mit ❗, für alle im Chat; keine neue Benachrichtigung. Server-Aktion nachricht_wichtig
  (vorhandene Tabelle kc_club_nachricht_wichtig, Protokoll). 
- Ganzer Chat (Hansi: „aber wo?“): im Chat oben rechts ⋮ → Abschnitt „Ganzer Chat“ mit 📋 Kopieren (ganzer Verlauf als Text) und
  🖨️ Ausdrucken (Druckvorschau, wichtige Nachrichten hervorgehoben) – dort wie bisher auch 🗄️ ins Archiv, 📦 archivieren und 🗑️ löschen.

## 2.23.79 – 2026-10-05 – 🔒 Sperren in drei klaren Schritten + Uhrzeit + 🔔/📵 je Person (Wunsch Hansi)
- KC-CLUB-PERSON-SPERRE Stufe 2 (Hansi: „Weg nicht ganz klar“): Wartungs-Blatt in zwei Kästen – „📢 Für alle: Wartung ankündigen“ und
  „🔒 Nur einzelne Personen sperren“ (mit Liste „Zurzeit gesperrt“). Sperren in drei Schritten: ① Was sehen sie? (🔵 Wartungsarbeiten /
  ⚪ Server nicht erreichbar) → ② Bis wann? (🔓 bis ich freigebe / 🕘 bis Datum + Uhrzeit – danach automatisch frei) → ③ Wer? – neben
  jedem Namen 🔔/📵 zum Antippen (📵 = keine Push, keine E-Mail; Antippen kreuzt die Person mit an). In der Liste der Gesperrten ist 🔔/📵
  weiter umschaltbar (Server-Aktion sperre_stumm). Bei ③ Schnellwahl: 👥 Alle, jede Chat-Gruppe, „📵 Alle Angekreuzten ohne Push/E-Mail“, ✖ Keiner
  (Admins werden vom Server nie gesperrt). Das Sperrfenster zeigt „Voraussichtlich wieder erreichbar: …“, wenn eine Uhrzeit gesetzt ist.
  Migration 20261005_kc_club_v22379_sperre_bis.sql (eine leere Spalte). Test 430.
- KC-CLUB-BLATT-HAKEN Nachbesserung: der grüne ✓ erscheint nur noch für einen Knopf UNTERHALB des sichtbaren Bereichs (vorher auch für
  einen schon nach oben weggescrollten, z. B. „Verstanden“ der Einweisung).

## 2.23.78 – 2026-10-05 – ✓ Grüner Haken oben in langen Fenstern (Wunsch Hansi)
- KC-CLUB-BLATT-HAKEN: Lange Fenster mit genau einem Bestätigungs-Knopf (Übernehmen, OK, Speichern, Fertig, Bestätigen, Anwenden,
  Verstanden) bekommen oben links in der vorhandenen ✕-Leiste (KC-CLUB-BLATT-X, ein Kern) einen grünen ✓, der diesen Knopf antippt –
  kein Scrollen nach unten. Erscheint nur, solange der Knopf unten nicht zu sehen ist; nie bei mehreren Kandidaten, nie für Löschen/
  Senden/Sperren, nie bei kurzen Fenstern und nie beim Notfall-Fenster. Gesperrter Knopf → ✓ ebenfalls gesperrt. Leiste mit eigenem Platz,
  nichts wird überdeckt. Test 429.

## 2.23.77 – 2026-10-05 – 🔒 Einzelne Personen sperren (Wunsch Hansi)
- KC-CLUB-PERSON-SPERRE: Admin-Register → 🛠️ Wartung → „🔒 Personen sperren“: eine oder mehrere Personen ankreuzen (Suche), wählen, was sie
  sehen – 🔵 „Wartungsarbeiten“ („Zur Zeit führen wir für Sie Wartungsarbeiten durch. Bitte versuchen Sie es später nochmals. Wir bitten um
  Verständnis.“) oder ⚪ „Server nicht erreichbar“ – auf Wunsch „📵 Auch Benachrichtigungen abschalten“ (keine Push/E-Mail aus der
  Club-App; Filter im zentralen Versandweg routerSendenRoh, auch Kopien) – Rückfrage, sperren. Liste der Gesperrten mit „🔓 Freigeben“.
  Server: nach der Anmeldung Antwort 423 mit Art für Gesperrte (alle Aktionen); Admins und man selbst können nicht gesperrt werden;
  Liste je Instanz 15 s im Speicher, Lesefehler sperren nie alle (Regel 12). Protokoll person_gesperrt / person_entsperrt.
  Migration 20261005_kc_club_v22377_person_sperre.sql (neue Tabelle, RLS an, keine Policies; Aufheben = aktiv false). Test 428.

## 2.23.76 – 2026-10-05 – 📶 LED-Fenster: Drucken + an Admin senden (Wunsch Hansi)
- KC-CLUB-VERBINDUNG-MELDEN: Im Verbindungs-Fenster (Tippen auf die LEDs) „🖨️ Drucken“ (A4-Bericht über die Druckvorschau) und
  „📨 An Admin senden“; Mitglieder haben in ihrer einfachen Ansicht „📨 Ergebnis an Hansi senden“. Inhalt: Server-LED, Communicator-LED,
  Push/E-Mail-Zustand, Zustellquote, Warteschlange, Antwortzeit, Download/Upload, Datenbank, letzte Antwort, Anfragen/Fehler, letzter Fehler,
  Handy/Netz, Version App/Server. Unbekannt bleibt „unbekannt“, nicht gemessen bleibt „nicht gemessen“ (Regel 11).
  Server-Aktion verbindung_melden: immer Push UND E-Mail an die Admins, Protokoll „verbindung_gemeldet“, Bremse 3 pro Stunde, nur Technik-Werte.
  Test 427.

## 2.23.75 – 2026-10-05 – 💡 Sperrzeit: Beispiel + Prüfung nach jedem Tag (Fund Hansi)
- KC-CLUB-SPERRZEIT-PRUEFUNG: Mitglieder trugen zusätzlich zur Kann-Zeit den Rest des Tages als Sperrzeit ein (unnötig – außerhalb der
  Kann-Zeit plant DP2 ohnehin nicht). Im Dienstwunsch-Fenster steht jetzt kurz mit Beispiel: „Sperrzeit nur, wenn du innerhalb deiner Kann-Zeit
  kurz weg musst – Kann 10–18 Uhr, Arzt 13–14 Uhr → Sperrzeit 13–14 Uhr.“ Nach jedem gespeicherten Tag prüft die Club-App (dp2-club/daten.js),
  ob eine Sperrzeit außerhalb der Kann-Zeit liegt, und zeigt dann „💡 Sperrzeit nicht nötig“ mit Tag, Zeiten und dem Weg zum Entfernen
  (je Tag einmal pro Sitzung). Die Angaben selbst ändert die Club-App nicht; DP2-Dateien unverändert. Dauerhafte Lösung im Assistenten: Auftrag an DP2.
  Test 426.

## 2.23.74 – 2026-10-05 – 🗓️ Mein Dienst (Wunsch → Soll → Ist) + Küchenterror fairer (Wunsch Hansi)
- KC-CLUB-MEIN-DIENST: Im Register Meins (erweiterte Ansicht) ersetzt EINE Kachel „🗓️ Mein Dienst“ die Kacheln „Mein Dienstplan“ und
  „Dienstwünsche“ (Unterzeile: nächster Dienst). Fenster mit drei Stufen: 📝 Wunschplan (Stand: abgegeben / übernommen, Wunschphase, „📝 Wünsche
  eintragen“), 📅 Sollplan (kommende Dienste, Anzahl im Monat, „📅 Meinen Dienstplan ansehen“), ⏱️ Istplan (Stempelzeiten der letzten
  60 Tage mit Vergleich Soll ↔ Ist; ohne Daten ehrlich „Noch keine Ist-Zeiten“). Server-Aktion mein_dienst nur lesend – den Dienstplan pflegt DP2.
  Die einfache Ansicht behält die bisherigen großen Knöpfe; alle bisherigen Wege bleiben erreichbar.
- KC-CLUB-KUECHENTERROR-FAIR (Fund Hansi): Die richtige Antwort war bei 156 von 190 Fragen die längste. Falsche Antworten sind jetzt genauso
  ausführlich und glaubwürdig (teils richtige Antwort gekürzt, Detail in die Erklärung) – jetzt nur noch 31 von 190, nie mehr deutlich länger.
  ids, Fragen und Reihenfolge unverändert; Server-Kopie gleich. Tests 424, 425.

## 2.23.73 – 2026-10-05 – Abstimmung an alle, eine Gruppe oder eine Auswahl (Wunsch Hansi)
- KC-CLUB-ABSTIMMUNG-ZIEL: Beim Anlegen einer Abstimmung „An wen?“ – 👥 Alle (wie bisher), 🧑‍🤝‍🧑 Gruppe (alle Gruppen zur Auswahl) oder
  ☑️ Auswahl (Fenster mit allen Mitgliedern zum Anklicken, Suche, „Alle an“/„Keiner“). Anzeige „An: …“ mit Namen.
- Server: Nur die Ausgewählten (und wer sie angelegt hat; Admin sieht alle) sehen die Abstimmung, dürfen abstimmen und bekommen
  Push/Mail – auch das Ergebnis am Ende. „x von n“ rechnet mit der Zielgruppe; Kachel-Zahl „offene Abstimmungen“ ebenso.
  Kachel zeigt „🔐 Gruppe …“ bzw. „🔐 n ausgewählte Mitglieder“. Migration 20261005_kc_club_v22373_abstimmung_ziel.sql (2 leere Spalten).
- Sicherheits-Check (Fund Hansi „orange Problem“): Rundinstrument „App ↔ Server“ realistisch fürs Handy-Netz – bis 1 s grün „schnell“,
  bis 2 s „normal“, darüber „langsam“ (vorher 0,7 / 1,5 s). Unten in jeder Ansicht 64 px Platz, damit ❓ und 🔍 nichts mehr verdecken.
- Enthält 2.23.72 (🧭 Mikrofon-Assistent). Test 423.

## 2.23.72 – 2026-10-05 – 🧭 Mikrofon-Assistent (Wunsch Hansi: „so wie heute mit mir, Schritt für Schritt“)
- KC-CLUB-MIKRO-ASSISTENT: Selbsttest (getUserMedia) → Schritt 1 WhatsApp-Test („🟢 WhatsApp öffnen“, ✅ geht / ❌ geht nicht → liegt am
  Handy: andere Sprach-App beenden, neu starten) → Schritt 2 Handy-Einstellung für den Browser („Nur während der Nutzung zulassen“, nicht
  „Jedes Mal fragen“) → Schritt 3 Website-Einstellung im Browser (sire65.github.io → Zulassen) → Schritt 4 Spracherkennung fürs Diktieren.
  Nach jedem Schritt „✅ Erledigt – jetzt prüfen“ (App prüft selbst). Browser wird erkannt und ist umstellbar: Chrome, Samsung Internet,
  Firefox, Opera, Edge, Safari, Chrome (iPhone); Android, iPhone und PC mit eigenen Anleitungen. Am Ende ggf. „📨 Hansi Bescheid geben“
  (nur Prüf-Codes + Browser, keine Inhalte). Erreichbar: „🧭 Schritt für Schritt helfen“ im Mikrofon-Fenster, Hilfe-Zentrum „Diktieren
  oder Sprachnachricht klappt nicht“, Sprung #mikrofon. Die Einstellungsseiten kann eine Web-App nicht selbst öffnen. Test 422.

## 2.23.71 – 2026-10-05 – Besuchsliste: „🗂️ Vergangene Termine“ zugeklappt (Wunsch Hansi)
- KC-CLUB-BESUCH-TERMINSTAND: Oben stehen nur geplante Besuche und solche mit „📝 Protokoll fehlt“; erledigte Besuche liegen zugeklappt unter
  „🗂️ Vergangene Termine (n)“, darunter „✖ Abgesagte Termine (n)“. Zahlen (Besuche, Stunden, km) unverändert über alle.
  Zahlen-Kacheln: oben 🗂️ Besuche (vergangen) · Stunden · km, darunter 📅 geplant · 📝 Protokoll fehlt · ✖ abgesagt. Test 420.
- KC-CLUB-PINNWAND-ANZAHL (Wunsch Hansi): Die Kachel „📌 Pinnwand“ zeigt unter dem Namen „📌 n Zettel · m von dir“ (alle Zettel, die du siehst,
  und deine eigenen). Die rote Zahl bleibt wie bisher: Neues/Offenes für dich. Test 421.

## 2.23.70 – 2026-10-05 – Besuchsliste: abgesagte Termine getrennt (Wunsch Hansi: „Christina steht 2× drauf“)
- KC-CLUB-BESUCH-TERMINSTAND: Die Besuchsliste kennt den Stand des Termins je Besuch (Server: besuch/liste liefert termin = bestaetigt /
  vorgemerkt / abgesagt). Geplante Besuche, deren Termin abgesagt wurde, stehen nicht mehr als „geplant“ in der Liste, sondern unten
  zugeklappt unter „✖ Abgesagte Termine (n)“ (blass, zählen nicht als geplant). Nichts wird gelöscht – ein abgesagter Besuch mit Notizen
  bleibt erhalten; im Formular steht dann „✖ Termin wurde abgesagt – nur ausfüllen, wenn der Besuch doch stattfand“.
- Geplanter Besuch, dessen Tag vorbei ist: „📝 Protokoll fehlt“ statt „geplant · Termin bestätigt“. „0 km“ bei „kam zu mir“ ausgeblendet. Test 419.

## 2.23.69 – 2026-10-05 – Schulungstermine: Ablauf rund gemacht (Wunsch Hansi, 5 Punkte)
- KC-CLUB-SCHULUNG-PROTOKOLL: Nach einem bestätigten Termin (letzte 30 Tage) steht unter „⏳ Wartet auf dich“ „📝 Termin war – Protokoll fehlt“
  mit „📝 Besuch eintragen“, bis das Protokoll gespeichert ist. Zählt auch im Start-Hinweis und auf der Kachel.
- KC-CLUB-SCHULUNG-VERSCHIEBEN: „🔁 Verschieben“ bei gebuchten Terminen – neue Zeit, Mitglied bekommt die geänderte Bestätigung (Push + Mail
  mit Kalenderdatei); Erinnerungen gelten für die neue Zeit (kc-termine 1.3.12). Bei mehreren Einladungen im selben Termin: Hinweis „Absagen + neu“.
- KC-CLUB-SCHULUNG-ANGEBOT: Beim Einladen „Diese Termine anbieten“ mit Häkchen (vorbelegt: alle) – das Mitglied sieht und wählt nur diese
  (kc-termine 1.3.12, Spalte slot_ids; Migration 20261005_kc_club_v22369_termine_einladung_slots.sql).
- Plätze beim Anbieten vorbelegt mit 1 (statt 2). Reihenfolge: ⏳ Wartet → 📅 Meine Termine → ✉️ Einladen → ➕ Anbieten → 📨 Einladungen →
  Google-Kalender/Protokoll (zugeklappt). Hilfe ergänzt. Test 418.

## 2.23.68 – 2026-10-05 – Hinweise zu Schulungsterminen für den Admin (Wunsch Hansi)
- KC-CLUB-SCHULUNG-HINWEIS: Beim Start (Admin) ein Hinweis „🎓 Schulungen“ mit „Wartet auf dich“ (⏳ gewählt – freigeben, 💬 Gegenvorschlag,
  ⌛ keine Antwort), „📅 Steht an“ (bestätigte Termine heute/morgen) und „Neu seit dem letzten Mal“ (👀 Link geöffnet, ⏳ gewählt, 💬, ✖, 🔄,
  ⌛, ⏰ erinnert) – 👀 Jetzt ansehen / ⏰ Später (4 Std.) / 🌙 Heute nicht mehr. Server-Aktion schulung_hinweis (nur Admin, nur lesend).
  Zahl auf der Kachel „🎓 Schulungen“ = was auf dich wartet (init.kz.schulung; Fehler → keine Zahl).
- kc-termine 1.3.11 (KC-Besuchsprotokoll, über .github/deploy/kc-termine.ref): Push an Hansi am Vorabend ab 18 Uhr (alle Termine von morgen)
  und 1 Std. vor jedem bestätigten Termin; Links in Meldungen an Hansi und im Google-Kalender führen in die Club-App (🎓 Schulungen).
  Migration 20261005_kc_club_v22368_termine_hansi_erinnerung.sql (2 leere Spalten, Versand-Regel termin_erinnerung_hansi nur Push). Test 417.

## 2.23.67 – 2026-10-05 – 📞 / 🎥 bei jedem Namen in der Mitgliederliste (Wunsch Hansi)
- KC-CLUB-ANRUF-LISTE: In 👥 Mitglieder (Listenansicht) stehen bei jedem Namen 💬 📞 🎥 (online zusätzlich 👋). Ist die Person online,
  startet 📞 den Anruf, 🎥 den Videoanruf (vorhandener Anruf-Kern, App zu App, kostenlos). Nicht online: Knöpfe blass, Antippen erklärt
  „geht nur, wenn ihr beide die App offen habt“. Knöpfe kompakt im Block (3 nebeneinander) – Admin-Knöpfe 🔗 🖨️ 🎖️ bleiben dabei.
  Auf der Mitgliedsseite ein Hinweis, wenn die Person nicht online ist. Test 416.

## 2.23.66 – 2026-10-05 – 📅 Festen Termin geben (Wunsch Hansi: „wenn ich einen direkt anspreche, muss ich einen anderen Weg gehen“)
- KC-CLUB-SCHULUNG-FEST: Unter 🎓 Schulungen → „✉️ Mitglieder einladen“ neben „Einladen“ der Knopf „📅 Festen Termin geben“: Mitglied(er)
  ankreuzen (1–3), „🏠 Kommt zu mir“ / „🚗 Ich fahre hin“, Tag, Von, Bis → „📅 Termin bestätigen“. Sofort Push + Mail mit Kalenderdatei,
  Erinnerung am Vortag, Club-Kalender, geplanter Besuch – derselbe Kern wie „📝 Besuche → 📅 Geplanter Termin“ (bleibt zusätzlich).
  Hinweise bei fehlender E-Mail und bei noch offener Einladung. Kein Server-Umbau. Hilfe ergänzt. Test 415.

## 2.23.65 – 2026-10-05 – Schulungen: alles aus dem alten Programm übernommen (Wunsch Hansi „alle Funktionen übernommen?“)
Abgleich Funktion für Funktion mit dem bisherigen Besuchsprotokoll/Termin-Programm; was fehlte, ist jetzt in der Club-App:
- KC-CLUB-SCHULUNG-ADMIN: „📆 Google-Kalender“ – „🔑 Google-Kalender verbinden“ / „Neuen Schlüssel erzeugen“ (Schlüssel nur einmal sichtbar,
  📋 Schlüssel kopieren, 📋 Skript kopieren, 5 Schritte). Server: t_kalender_schluessel freigegeben (nur Admin, Inhalt nicht protokolliert).
  Einladungen zeigen den Mail-Link-Stand (aktuell / veraltet / ohne gültigen Link). „📜 Ablauf“ wie bisher mit Symbolen, Art der Nachricht
  (Einladung, Bestätigung, Erinnerung …), Zustellung (zugestellt, geöffnet, nicht zustellbar …) und Details zum Aufklappen.
- KC-CLUB-BESUCHE: Entwurf eines neuen Besuchs bleibt auf dem Gerät, falls die App zugeht („📝 Entwurf ist wieder da“ + „🗑️ Verwerfen“).
  Bei geplantem Besuch mit bestätigtem Termin: „Schon bestätigt am … für …“ und „Geänderten Termin erneut bestätigen“. Liste: „✅ Termin
  bestätigt“ und „Dazu n geplante Besuche – zählen erst nach dem Besuch“. Sprung #besuch=B-… öffnet den Besuch (wie im alten Programm), #schulungen.
- Aufgeräumt (Wunsch Hansi „Buttons schmal, nebeneinander, platzsparend“): in Schulungen, Besuchen und Meine Schulung schmale Knöpfe
  nebeneinander, kürzere Beschriftungen (✅ Bei mir / ✅ Ich fahre hin, 🔄 Neue Termine anbieten, 📨 Neu einladen, 🔗 Link, ✖ Beenden,
  🚫 Absagen, 📝 Protokoll, 📅 Geplanter Termin, 🏠 Kommt zu mir), Reiter „📅 Termine“ auf dem Handy, Datum + km und Thema + Ergebnis
  nebeneinander, „Speichern | Abbrechen“ in einer Zeile unten fest, Erklärtexte gekürzt. Für den Admin ist „🎓 Schulungen verwalten“
  oben in „Meine Schulung“ (2.23.64, nicht eingespielt) enthalten.
- Bewusst nicht übernommen: „Foto auswerten“ (kostenpflichtig, Wunsch Hansi). Test 414.

## 2.23.64 – 2026-10-05 – „🎓 Schulungen verwalten“ auch aus „Meine Schulung“ (Hansi: „Ich lande im Archiv“)
- KC-CLUB-SCHULUNG-MITGLIED: Für den Admin oben in „🎓 Meine Schulung“ der Knopf „🎓 Schulungen verwalten“ (vorher nur der Archiv-Link –
  so landete man im Archiv). Die Admin-Kachel „🎓 Schulungen“ steht bei eigener Kachel-Reihenfolge wie jede neue Kachel ganz unten im
  Register Club (unverändert, Test 36). Test 413.

## 2.23.63 – 2026-10-05 – Schulungen: Prüfung nach dem Einspielen (Wunsch Hansi „alles noch mal prüfen“)
- KC-CLUB-SCHULUNG-ADMIN: Die Zahl am Reiter „📅 Termine & Einladungen (n)“ zeigte den vorherigen Stand – jetzt erst nach dem Zählen.
  Das Nachladen der Besuche baut die Seite nicht mehr komplett neu (Suchtext und persönliche Zeile bleiben stehen).
- KC-CLUB-BESUCHE: Ging nach dem Speichern ein Foto nicht hoch, legte „Speichern“ beim zweiten Versuch einen doppelten Besuch an
  (und hätte die Terminbestätigung doppelt geschickt) – jetzt wird der gespeicherte Besuch weiterbearbeitet, nur die fehlenden Fotos folgen.
  Tippen neben das Formular schließt es nicht mehr (Eingaben gingen verloren; auch „Kein Termin passt“). Ein geplanter Besuch, dessen Tag
  vorbei ist, öffnet als stattgefunden (Gesprächspunkte + Zusammenfassung). „📝 Protokoll öffnen“ lädt die Besuche, falls noch nicht da
  (sonst doppelter Besuch).
- KC-CLUB-SCHULUNG-MITGLIED: Konnte der Stand nicht (vollständig) geladen werden, stand dort „keine offene Einladung“ – jetzt
  „⚠️ Stand konnte nicht geladen werden“ + „🔄 Nochmal versuchen“ (UNKNOWN nie als OK). Handy-Kalender-Eintrag führt zu „Meine Schulung“. Test 412.

## 2.23.62 – 2026-10-05 – 🎓 Meine Schulung: Termin in der Club-App aussuchen (Wunsch Hansi, Stufe 3)
- KC-CLUB-SCHULUNG-MITGLIED: Die bisherige „bald“-Kachel „🎓 Meine Schulung“ (Register Meins) ist jetzt aktiv: Eingeladene sehen die freien
  Termine und tippen „✅ Diesen Termin nehmen“ (bei „Mitglied wählt“: bei mir / bei Hansi), „💬 Kein Termin passt“ mit bis zu 2 Vorschlägen
  (Tag, Von/Bis, Ort, Bemerkung), „✖ Zurzeit kein Besuch“, „🔄 Anders wählen“. Bestätigt: Termin, Ort, Tablet-Hinweis, „📅 In meinen
  Handy-Kalender“. Abgelaufen: Hinweis + „💬 Hansi schreiben“. Beim Start ein Hinweis, solange eine Einladung offen ist (jetzt / später 4 Std. /
  heute nicht mehr). Link zu den Zusammenfassungen im Archiv. Zahl auf der Kachel = offene Einladungen.
- Ein Kern: Wahl, Vorschlag, Absage laufen über den Termin-Baustein kc-termine (sichere Platzvergabe, Meldung an Hansi). Dafür nimmt kc-termine
  (KC-Besuchsprotokoll 1.3.10) die Mitglieder-Aktionen zusätzlich mit dem internen Schlüssel + Person der Einladung an; der Mail-Link gilt
  weiter. Server prüft, dass die Einladung dem angemeldeten Mitglied gehört. Hilfe-Eintrag. Test 411.

## 2.23.61 – 2026-10-05 – 📝 Besuchsprotokoll in der Club-App (Wunsch Hansi, Stufe 2)
- KC-CLUB-BESUCHE: In „🎓 Schulungen“ zweiter Reiter „📝 Besuche“ (nur Admin): Liste mit Besuchen, Stunden und km je Jahr, ➕ Neuer Besuch,
  📅 Abgesprochenen Termin eintragen, bearbeiten. Formular wie im bisherigen Besuchsprotokoll: Ort (Ich fahre hin / Mitglied kommt zu mir),
  Mitglieder (Name + Anwesende werden vorgeschlagen, Adresse als Ort), Datum, Von/Bis, km (Hin+Rück wird gerechnet), „📅 Geplant“ (mit
  Terminbestätigung über den Termin-Baustein t_besuch_termin, bei Änderungen wird der Termin nachgezogen), Gesprächspunkte 1–7, Thema,
  installiert auf Tablet/PC/Handy, Notizen/Vereinbarungen/Bemerkungen (🎤), Fotos vom Papierprotokoll (nur speichern – Foto-Auswertung
  weggelassen, Wunsch Hansi). „Speichern & senden“: Dank-Zusammenfassung (gleiche Worte wie bisher) per Push + Mail mit BCC an Hansi über
  die Club-Benachrichtigung, Kopie als Text in den Archiv-Ordner jedes Mitglieds (Register „Schulung“). Aus „Meine Termine“:
  „📝 Besuch eintragen / Protokoll öffnen“. Gleiche Tabelle kc_besuche und Fotos – keine Datenübernahme nötig. Test 410.

## 2.23.60 – 2026-10-05 – 🎓 Schulungen: Termin-Programm in der Club-App (Wunsch Hansi, Stufe 1)
- KC-CLUB-SCHULUNG-ADMIN: Neue Kachel „🎓 Schulungen“ (nur Admin) – die Bedienung des Termin-Programms gehört jetzt zur Club-App:
  ⏳ Wartet auf dich (gewählt → ✅ Bestätigen / ✖ Ablehnen, Gegenvorschläge annehmen oder neue Termine anbieten, Frist vorbei → erneut
  einladen), ➕ Termin anbieten (bei mir / beim Mitglied / Mitglied wählt, 1–3 Plätze, Notiz), 📅 Meine Termine (absagen/löschen),
  ✉️ Mitglieder einladen (einzeln oder gemeinsam bis 3, Stand je Mitglied: 🎓 geschult, ✅ Termin, ⏳ gewählt, 💬 Gegenvorschlag,
  ✉️ eingeladen, ⌛ keine Antwort), 📨 Einladungen mit 📜 Ablauf, 🔗 Link erneuern & teilen (WhatsApp), Google-Kalender-Stand, Protokoll.
  Ein Kern: der Club-App-Server ruft den vorhandenen Termin-Baustein kc-termine intern mit dem Admin-Schlüssel aus dem Vault auf
  (Aktion „schulung“, feste Liste erlaubter Aktionen, nur Admin) – sichere Platzvergabe, Fristen, Erinnerungen, Mails mit Link für
  Mitglieder ohne App und Google-Abgleich laufen unverändert. Club-Protokoll nur mit der Art. Hilfe-Eintrag. Test 409.

## 2.23.59 – 2026-10-05 – 🎓 Schulungstermine aus dem Termin-Programm im Club-Kalender (Wunsch Hansi)
- KC-CLUB-SCHULUNGSTERMINE: Gebuchte Schulungs-/Besuchstermine aus Hansis Termin-Programm (kc_termin_slots/_buchungen/_einladungen,
  vorgemerkt oder bestätigt, nicht abgesagt, keine Tests) erscheinen automatisch im Club-Kalender (lila, „🎓 14:00–17:30 Schulung: Karla,
  Ruth · bei Hansi · ✅ bestätigt“), in „Demnächst“ und im Kalender-Abo (UID je Buchung – Verlegen/Absagen kommt dort von selbst).
  Nur lesend, das Termin-Programm bleibt führend. Admin sieht alle, Mitglieder nur ihre eigenen. Nur Vornamen, keine Kontaktdaten. Test 408.
- Daten (kein Build): Termin 06.10. B-2026-006 – Ruth Kazik in Einladung/Buchung nachgetragen (2 Personen, 2 Plätze), Protokoll
  „person_nachgetragen“, Sicherung vorher. Erinnerung an Karla kam am 05.10. nicht an (keine Mail, kein Push) – Hansi per WhatsApp.

## 2.23.58 – 2026-10-05 – 📅 Terminanfrage im Handy-Kalender, auch nach Verlegen (Wunsch Hansi)
- KC-CLUB-ANFRAGE-KALENDER: Jede eigene bzw. zugesagte Terminanfrage hat „📅 In meinen Handy-Kalender“ (Datei mit Erinnerung, feste UID).
  Die App merkt sich, welche Zeit eingetragen wurde. Wird der Termin verlegt (Gegenvorschlag angenommen), zeigt die Karte
  „📅 Termin verlegt – im Handy-Kalender steht noch …“ mit „📅 Neuen Termin eintragen“ und dem Hinweis, den alten Eintrag im Kalender zu
  löschen (fremde Kalender-Einträge löschen kann eine Web-App kostenlos nicht). Bei Absage: Hinweis zum Löschen. Vorbehalt steht im Titel
  („unter Vorbehalt“, Status vorläufig). Kalender-Abo: Vorbehalt im Titel/vorläufig, SEQUENCE nach Beginn – Verlegungen ersetzen dort den
  alten Eintrag automatisch. Test 407.

## 2.23.57 – 2026-10-05 – 🤔 Gegenvorschlag unter Vorbehalt annehmen (Wunsch Hansi)
- KC-CLUB-ANFRAGE-VORBEHALT: Beim Gegenvorschlag jetzt drei Knöpfe – „✅ Neue Zeit annehmen“, „🤔 Unter Vorbehalt“, „❌ Passt nicht“. Alle öffnen
  ein Fenster mit Vorschlag, Notiz des Gegenübers und einem kurzen Text (bei „unter Vorbehalt“ Pflicht, sonst freiwillig, 🎤 möglich).
  Der Text steht in Push/Mail an den Vorschlagenden; der Vorbehalt bleibt bei der Anfrage sichtbar („🤔 Unter Vorbehalt: …“) und geht bei
  mehreren Empfängern auch in die Neu-Anfrage. Spalte vorbehalt in kc_club_terminanfragen. Protokoll ohne Text. Test 406.

## 2.23.56 – 2026-10-05 – 🔍 Suchen-Knopf (Wunsch Hansi)
- KC-CLUB-SUCHEN-KNOPF: Im Hilfe-Zentrum („Wonach suchst du?“) und in der 🔍 Lupe-Suche steht jetzt neben dem Feld ein Knopf
  „🔍 Suchen“ – für alle, bei denen Sprechen nicht geht oder die nicht wissen, dass schon beim Tippen gesucht wird. Er sucht, schließt
  die Tastatur und zeigt die Treffer; ist das Feld leer bzw. zu kurz, kommt ein Hinweis. Enter auf der Tastatur macht dasselbe.
  (Bei Frag Twinkey gibt es schon „➤ Fragen“.) Test 405.

## 2.23.55 – 2026-10-05 – 🎙️ Diktieren: richtige Ursache erkennen (Fund Hansi)
- KC-CLUB-MIKRO-URSACHE: Sprachnachrichten brauchen nur das Mikrofon, Diktieren zusätzlich die Spracherkennung von Google – die hat auf
  Android eine eigene Mikrofon-Erlaubnis. Darf Chrome das Mikrofon (Stand „granted“ oder „Jetzt freischalten“ klappt) und die
  Spracherkennung meldet trotzdem „gesperrt“, zeigt die App jetzt „Die Spracherkennung darf nicht zuhören“ mit der Anleitung
  (Einstellungen → Apps → Google bzw. Google-Sprachdienste → Berechtigungen → Mikrofon → Zulassen) und „🔄 Nochmal probieren“.
  Immer dabei: „🎤 Tastatur-Mikrofon nutzen“ (geht auf jedem Handy) und „⌨️ Weiter tippen“. „Jetzt freischalten“ versucht es bei belegtem
  Mikrofon ein zweites Mal; „belegt“ wird nicht mehr als „gesperrt“ gemeldet. Kleine Code-Zeile im Fenster und diagnose_mikro im
  Fehlerprotokoll (nur Codes). Test 404.

## 2.23.54 – 2026-10-05 – 🎙️ Diktieren fragt das Handy wie die Sprachnachricht (Fund Hansi)
- KC-CLUB-MIKRO-WIE-CHAT: Beim Diktieren (z. B. Frag Twinkey) fragt die App das Handy jetzt immer direkt nach dem Mikrofon – wie die
  Sprachnachricht im Chat („Nur dieses Mal“ / „Bei Nutzung der App erlauben“). Bisher wurde bei Stand „gesperrt“ die Abfrage übersprungen
  (2.22.18) und es kam gleich „Mikrofon ist gesperrt“. Die Erklärung vorab kommt nur noch beim allerersten Mal (nicht nach jedem
  „Nur dieses Mal“). Klappt es trotzdem nicht, kommt wie bisher das Fenster mit „🎙️ Jetzt freischalten“. Test 339 angepasst, Test 403.

## 2.23.53 – 2026-10-05 – 🎙️ Mikrofon gleich freischalten und weiter (Wunsch Hansi)
- KC-CLUB-MIKRO-SOFORT: Das Fenster „🎙️ Mikrofon ist gesperrt“ (z. B. bei Frag Twinkey) hat jetzt „🎙️ Jetzt freischalten“ – das Handy
  fragt erneut, nach „Zulassen“ läuft das Diktat im selben Feld sofort weiter. Fragt das Handy nicht mehr (endgültig gesperrt), zeigt das
  Fenster die Anleitung für genau dieses Gerät (Android/iPhone/PC, andere aufklappbar) mit „🔄 Nochmal probieren“; wird die Erlaubnis in den
  Einstellungen erteilt, macht die App von selbst weiter. „⌨️ Weiter tippen“ schließt und setzt den Cursor ins Feld. Fenster liegt über
  Twinkey und Diktat. Nur App. Test 402.

## 2.23.52 – 2026-10-05 – 📨 Hinweis: neue Terminanfrage (Wunsch Hansi)
- KC-CLUB-TERMINANFRAGE-HINWEIS: Beim Öffnen der App und zwischendurch (zurück in die App, nach einem Push, alle 5 Min.) erscheint
  „📨 Du hast eine neue Terminanfrage“ mit Liste (von wem, Anlass, wann, Ort) und „👀 Ja, jetzt ansehen“ (springt zur Anfrage),
  „⏰ Später“ (2 Std.) oder „🌙 Heute nicht mehr fragen“. Nur Anfragen an mich ohne Antwort/Gegenvorschlag, nicht abgelaufen, ohne
  Spiel-Termine; nie über einem offenen Fenster oder im Termine-Bereich. Kommt eine weitere Anfrage dazu, erscheint der Hinweis wieder.
  Nur App, kein Server-Umbau. Hilfe-Eintrag. Test 401.

## 2.23.51 – 2026-10-05 – 👥 Ein Mitglied fragen (Wunsch Hansi)
- KC-CLUB-MITGLIEDER-FRAGEN: Bei „🧑‍🍳 Frag Twinkey“ (Link unter dem Fragefeld und in der „gute Frage“-Antwort) eine Frage an andere
  Mitglieder stellen: „👥 Alle Mitglieder“ oder einzelne/mehrere anhaken (mit Namenssuche), Weg wählen (📱 Club-App, 🔔 Push, ✉️ E-Mail,
  mehrere möglich), „📤 Frage senden“. Die Gefragten sehen sie bei Twinkey unter „❓ Fragen an dich“ (bei neuer Frage öffnet sich Twinkey
  beim Start; Push/Mail führen mit #mfrage dorthin) und tippen „✍️ Antworten“, „🔎 Ich recherchiere und antworte dir“, „🤷 Ich weiß es
  nicht“ oder „🚫 Bitte nicht mehr fragen“ (dann keine Mitglieder-Fragen mehr; „Wieder fragen lassen“ macht es rückgängig). Wer gefragt
  hat, bekommt Antworten/Recherche/„weiß nicht“ als Mitteilung und sieht unter „👥 Deine Fragen an Mitglieder“ die Antworten und den Stand
  je Person (gefragt, gelesen, recherchiert, weiß es nicht, geantwortet, möchte nicht gefragt werden); „✅ Erledigt“ schließt die Frage.
  Höchstens 10 Fragen am Tag. Neue Tabellen kc_club_mitfragen + kc_club_mitfrage_empfaenger (RLS an, keine Policies), Aktionen
  mf_senden/_antwort/_gelesen/_aus/_erledigt, Daten über twinkey_daten. Protokoll ohne Inhalte. Twinkey-Frage + Hilfe-Eintrag. Test 400.

## 2.23.50 – 2026-10-05 – 📨 Terminanfrage: an wen und wie steht es (Wunsch Hansi)
- KC-CLUB-TERMINANFRAGE-STATUS: Eigene Anfragen zeigen „Anfrage an Klaus“ (Liste, Kalender, Demnächst) und den Stand je Empfänger:
  📨 angefragt · 👁️ gelesen · ✅ bestätigt · 🤔 vielleicht · ❌ abgelehnt · 🔄 Gegenvorschlag · ⌛ abgelaufen (keine Antwort bis zur Frist
  bzw. bis zum Termin). Bei einem Empfänger steht der Stand als Marke oben auf der Karte. „Gelesen“ = die Anfrage wurde dem Empfänger in
  den Terminen angezeigt (terminanfrage_gelesen).
- Gegenvorschlag: Empfänger tippen „🔄 Andere Zeit vorschlagen“ (Tag, von/bis, Notiz) → wer angefragt hat, bekommt Bescheid und wählt
  „✅ Neue Zeit annehmen“ (Termin wird verlegt, der Vorschlagende hat zugesagt, die anderen werden neu gefragt, Erinnerungen laufen neu)
  oder „❌ Passt nicht“ (es bleibt bei der Zeit). Nicht bei Spiel-Terminen. Spalten gelesen_am, vorschlag_beginn/_ende. Hilfe-Eintrag. Test 399.

## 2.23.49 – 2026-10-05 – 🧑‍🍳 Frag Twinkey (Wunsch Hansi, Stufe 2 – löst „Frag den Küchenchef“ ab)
- KC-CLUB-TWINKEY: „Frag den Küchenchef“ heißt jetzt „🧑‍🍳 Frag Twinkey“ (früher waren viele Twinkeys auch Küchenchefs) – Kachel, Knopf im
  Hilfe-Zentrum, Hilfe-Eintrag, Tagestipp. 35 eigene Fragen + Antworten (TW_FAQ: Nachricht, Gruppe, Foto, Zusage, Mitfahrt, Anrufen, Zettel,
  Hilfe, Leihen, Börse, Vorschlag, Dienstwünsche, Protokolle, Archiv, Anleitung, Erstattung, Umzug, Status, Notfall, Standort, Spiele,
  Kosten, Datenschutz, Update, Nicht stören, Feedback …) und mehr Synonyme.
- KC-CLUB-TWINKEY-FRAGEN: Weiß Twinkey etwas nicht und tippt man auf „➤ Fragen“ (oder „🙋 Das beantwortet meine Frage nicht“), sagt er
  „Das ist eine gute Frage. Ich werde recherchieren und dir bei Gelegenheit eine Antwort zukommen lassen.“ – die Frage geht an den Admin
  (Push/Mail nach seinen Einstellungen). Nur auf ausdrückliches Fragen, nie beim bloßen Tippen. Der Admin beantwortet sie unter
  „📥 Fragen an Twinkey beantworten“ (im Twinkey-Fenster): Antwort schreiben oder 🎤 sprechen, Weg wählen (📱 Club-App, 🔔 Push, ✉️ E-Mail,
  mehrere möglich), „🧠 Twinkey merkt sich das“ → Frage + Antwort kommen in Twinkeys Wissen für alle. Verwerfen statt Löschen.
  Mitglieder sehen ihre Fragen unter „📬 Deine Fragen“; bei „📱 Club-App“ öffnet sich Twinkey beim nächsten Start mit der Antwort.
  Neue Tabelle kc_club_twinkey_fragen (RLS an, keine Policies), Server-Aktionen twinkey_daten/_frage/_antworten/_verwerfen/_gelesen.
  Protokoll nur mit Art und IDs, nicht mit Inhalten. Kostenlos (keine fremde KI). Test 397 angepasst, Test 398.

## 2.23.48 – 2026-10-05 – 🧑‍🍳 Frag den Küchenchef (Wunsch Hansi, Stufe 1)
- KC-CLUB-KUECHENCHEF: Fragen in eigenen Worten stellen – tippen oder 🎤 sprechen („Wie ändere ich die Farben?“, „Wie stelle ich eine
  Terminanfrage?“). Antwort aus den vorhandenen Hilfen (Hilfe-Zentrum, Tipps, Kurz erklärt) mit „👉 Zeig es mir“, 🔊 Vorlesen, 👍/👎 und
  „Oder meintest du …“. Versteht andere Wörter für dasselbe (Synonym-Liste), Wortformen, zusammengesetzte Wörter und kleine Tippfehler.
  Nichts gefunden → „Anders fragen“, „Alle Hilfen“ oder „Frage an Hansi weitergeben“ (nur vorbereitet im Chat, Senden tippt man selbst).
  Kostenlos, ohne fremde Server, auch ohne Netz. Kachel „🧑‍🍳 Frag den Küchenchef“ + Knopf oben im Hilfe-Zentrum. Hilfe-Eintrag. Test 397.

## 2.23.47 – 2026-10-05 – 🎤 Sprechen statt tippen an 5 Stellen (Wunsch Hansi)
- KC-CLUB-DIKTAT-FELD: kleines 🎤 rechts im Feld bei 🔍 Lupe (Suche überall), ❓ Hilfe-Zentrum, 📌 Pinnwand-Zettel, 🙋 Hilfe-Aufruf
  (Beschreibung) und 🤲 Angebot („Was genau?“). Antippen → „Ich schreibe mit …“, der Text erscheint im Feld; Suchfelder sind nach dem
  ersten Satz fertig. In Feldern kein „Senden“ – nichts wird verschickt. Ein Baustein (data-diktat) über den vorhandenen Diktier-Kern des
  Chats; kann das Gerät nicht diktieren, erscheint kein 🎤. SOS behält „🎙️ Einsprechen“. Diktier-Fenster liegt jetzt auch über der Suche.
  Hilfe „Sprechen statt tippen“. Nur App. Test 396.

## 2.23.46 – 2026-10-05 – 🗂️ Clubleitung beim Start: Tages-Übersicht und Eingang-Hinweis an/aus (Wunsch Hansi)
- KC-CLUB-LEITUNG-START-SCHALTER: neuer Bereich in ⚙️ Einstellungen „🗂️ Clubleitung beim Start“ (nur Clubsprecher, Kassenwart, Admin):
  „📋 Tages-Übersicht beim Start“ und „📥 Hinweis: viel im Eingangskorb“ – je Gerät an/aus, Start: an (wie bisher). Die Tages-Übersicht
  nutzt den vorhandenen Merker (gleich wie „Auf diesem Gerät nicht mehr beim Start zeigen“ im Fenster). Hilfe ergänzt. Nur App. Test 395.

## 2.23.45 – 2026-10-05 – 💡 Tipp des Tages: Club-App auch auf Tablet oder PC (Wunsch Hansi)
- KC-CLUB-TIPP-TABLET-PC: neuer Tipp „💻 Club-App auch auf Tablet oder PC nutzen?“ (kommt als nächster): 1. „🔢 Code holen“ (6-stelliger
  Code, kurz gültig, einmal), 2. am Tablet/PC im Browser die Club-Adresse öffnen und „🔢 Mit Code anmelden“, 3. im Browser-Menü „Zum
  Startbildschirm hinzufügen“ bzw. „App installieren“. Hinweis: Zugangsdaten persönlich, nicht weitergeben. Knopf „🔢 Code holen“ öffnet
  den vorhandenen Code für ein anderes Gerät. Steht auch im Hilfe-Zentrum (Kapitel Technik). Nur App. Test 394.

## 2.23.44 – 2026-10-05 – 📣 Hilfe veröffentlichen: Pinnwand, Push, E-Mail + Anfrage mit Betreff (Wunsch Hansi)
- KC-CLUB-HILFE-KANAELE: Beim Einstellen eines Hilfe-Aufrufs („Ich suche Hilfe“) und eines Angebots („Ich biete Hilfe an“) fragt die App
  „📣 Wie möchtest du es veröffentlichen?“ – 📌 Pinnwand, 🔔 Push, ✉️ E-Mail (mehrere möglich, Wahl je Gerät gemerkt; Start: Pinnwand + Push).
  Nichts gewählt = nur in Helfen & Leihen, nichts wird verschickt. Knöpfe „📣 Aufruf / Angebot veröffentlichen“.
  - Pinnwand: Aufrufe wie bisher als grüner Aushang (nur noch, wenn gewählt; ältere unverändert), Angebote neu als „🤲 HILFE ANGEBOTEN“ –
    antippen öffnet das Angebot. Push/E-Mail an alle Mitglieder mit Sprung #hilfe=… bzw. neu #angebot=….
  - Angebot anfragen: „💬 Nachricht“ beginnt mit „Betreff: Dein Angebot „…“ vom TT.MM.JJJJ“, „📨 Termin anfragen“ trägt das als Anlass ein.
- Migration supabase/migrations/20261005_kc_club_v22344_hilfe_kanaele.sql (eingespielt: Spalte kanaele + Prüfregel). Hilfe-Eintrag. Test 393.

## 2.23.43 – 2026-10-05 – 📥 Hinweis an die Clubleitung: viel im Eingangskorb (Wunsch Hansi)
- KC-CLUB-EINGANG-HINWEIS: Liegen mehr als 5 Sachen im Eingangskorb, zeigt die App Clubsprecher, Kassenwart und Admin beim Start ein Fenster
  „📥 Im Eingangskorb liegen 10 Sachen“ mit kleiner Liste je Art (z. B. 4 Dienstpläne, 1 Kostenerstattung, 1 Hilfegesuch). Zeile antippen =
  Eingangskorb, gleich gefiltert auf diese Art. Darunter „✅ Ja, jetzt bearbeiten“ / „⏰ Später“ (3 Stunden Ruhe) / „🌙 Heute nicht mehr“.
  Kommt erst, wenn kein anderes Fenster offen ist (z. B. nach der Tages-Übersicht); ohne Verbindung kein Hinweis. Kein Push, keine Mail.
  Server-Aktion eingang_zahlen (nur Clubleitung, nur Zahlen). Hilfe „Hinweis: viel im Eingangskorb“. Test 392.

## 2.23.42 – 2026-10-05 – Texte zu „Alle auf/zu“ und Neue Gruppe + Bedienungsanleitung V5 (Wunsch Hansi)
- 🎓 Kurz erklärt: Einstellungen nennt „▾ Alle auf / ▴ Alle zu“ und das Schloss; neu „👥 Neue Gruppe“ (Deine Gruppen, Name & Symbol,
  Wer ist dabei?, Pfeil und Schloss).
- 💡 Tagestipps: „Bereiche festhalten“ erwähnt Neue Gruppe; neuer Tipp „Alle Bereiche auf einmal öffnen?“ (mit „Zeig mir wo“).
- ❓ Hilfe-Zentrum: neu „Alle Bereiche auf einmal auf- oder zuklappen“ (seit 2.23.40) und „Neue Gruppe: Bereiche auf- und zuklappen“
  (seit 2.23.41); das „?“ bei Neue Gruppe zeigt jetzt die eigene Einweisung.
- KC-CLUB-ANLEITUNG-V5: Bedienungsanleitung Version 5 (44 Seiten) – neu: Neue Gruppe (Kap. 3), Alle auf/zu + Schloss (Kap. 8),
  Schachuhr (Kap. 14), 👍/👎 bei den Hilfen (Kap. 15). Ersetzt V4 in „Meine Dokumente“; V1–V4 bleiben unverändert. Test 391.

## 2.23.41 – 2026-10-05 – Neue Gruppe: Bereiche mit Pfeil und Schloss (Wunsch Hansi)
- KC-CLUB-GRUPPE-KLAPPEN: „👥 Deine Gruppen“, „✏️ Name & Symbol“ und „👤 Wer ist dabei?“ sind Klappbereiche mit ▾-Pfeil und 🔓/🔒-Schloss
  wie überall (Stand wird gemerkt). „Deine Gruppen“ auch bei „Neue Nachricht“. Kurze Bereiche ohne unteren „Zuklappen“-Knopf. Nur App. Test 390.

## 2.23.40 – 2026-10-05 – ▾ Alle auf / ▴ Alle zu in den Einstellungen (Wunsch Hansi)
- KC-CLUB-KLAPPEN-ALLE: Oben in ⚙️ Einstellungen ein Umschalter „▾ Alle auf“ / „▴ Alle zu“ (Beschriftung passt sich dem Stand an).
  Wirkt auf alle sichtbaren Bereiche; mit 🔒 festgestellte Bereiche bleiben, wie sie sind. Allgemein gebaut (data-wurzel), für
  weitere Seiten wiederverwendbar. Nur App. Test 389.

## 2.23.39 – 2026-10-04 – 🔽 Eingang filtern, 📊 Dienstzeiten-Übersicht quer, Dienstpläne in die Ordner (Wunsch Hansi)
- KC-CLUB-EINGANG-FILTER: Im Büro-Eingang oben 🔽 (wie bei den Protokollen) → Jahr, Monat, Art, Name (Auswahl nur aus dem, was im Eingang
  liegt), „x von y Sachen“, „↺ Alle zeigen“, ✕ oben rechts schließt (Auswahl bleibt, Zahl am 🔽).
- KC-CLUB-DIENST-UEBERSICHT: 📊 im Eingang (nur Clubleitung) – alle Dienstzeiten quer: vorne Name, oben Tage (Wochenende dunkler), je Tag
  ein Zeitbalken 8–24 Uhr (Kann / Wunsch / Wenn nötig / Sperre) mit Uhrzeit, rechts Gesamtstunden (+ Wunsch), unten Stunden und Personen
  je Tag (≤ 2 Personen rot). Sortieren nach Name oder Stunden, Feld antippen = genaue Zeiten, 🖨️ Drucken A4 quer über den Druck-Kern.
  Server-Aktion dienst_uebersicht (Fehler beim Laden = Meldung, nie „leer“).
- KC-CLUB-DIENST-ABLAGE: „🗄️ In Ordner ablegen“ legt jede Aufstellung in den persönlichen Ordner des Mitglieds (Register „Dienstpläne“) und ins
  Büro „Dienstpläne <Jahr>“ (Register „Wünsche“), dazu die Übersicht als Bild (Register „Gesamtplan“). Schon Abgelegtes nicht doppelt.
  Ablegen aus dem Eingang schlägt den Büro-Ordner vor; persönliches Register heißt jetzt „Dienstpläne“ (Stevens Register „Dienstplan“ umbenannt).
- Test 388.

## 2.23.38 – 2026-10-04 – ⏱️ Schachuhr + aufgeräumtes Schachfenster (Wunsch Hansi)
- KC-CLUB-SCHACH-UHR: Bedenkzeit je Spieler „Ohne“, 5, 10 oder 15 Minuten (FIDE: Blitz bis 10 Min., Schnellschach über 10 bis unter 60 Min.).
  Wie im Turnier: nach jedem Zug hält die eigene Uhr an und die des Gegners läuft; beide ersten Züge sind frei. Letzte Minute: Uhr rot,
  leises Ticken. Zeit abgelaufen = verloren – außer der Gegner kann nicht mehr mattsetzen (nur König, König+Läufer, König+Springer) → Remis
  (FIDE-Regeln Art. 6.9).
  - 🤖 Gegen den Computer: Auswahl „⏱️ Uhr“ oben; die App zählt, die Uhr hält an, wenn das Schachfenster nicht zu sehen ist (auch bei ⏸ Pause).
    Mit Uhr kein „Zug zurück“. Zählt im Spielstand.
  - 👥 Gegen Mitglieder: beim Herausfordern „📨 Fern“ (wie bisher, ohne Uhr) oder „⏱️ 5′/10′/15′“ (Live). Der SERVER misst die Zeit
    (App zu = Uhr läuft weiter) und beendet die Partie bei Zeitüberschreitung, egal wer nachsieht; beide bekommen Bescheid.
    Revanche übernimmt die Uhr. Läuft eine Uhr, schaut die App weiter alle 3 s nach.
- KC-CLUB-SCHACH-AUFGERAEUMT: Stärke/Farbe/Uhr in einer Zeile als Auswahlfelder, Brett mittig, Uhren links (Gegner) und rechts (du) –
  auf dem Handy nebeneinander über dem Brett, auf breiten Bildschirmen neben dem Brett. Knöpfe schmal in einer Leiste, „Wer ist wer“ eingeklappt.
- Migration supabase/migrations/20261004_kc_club_v22338_schach_uhr.sql (eingespielt, nur Spalte uhr + Prüfregel). Test 387.

## 2.23.37 – 2026-10-04 – ✕ Schließkreuz im Protokoll-Filter (Wunsch Hansi)
- KC-CLUB-PROTOKOLL-FILTER-ZU: Das Filterfenster in „📄 Protokolle“ hat oben rechts ein rundes ✕ (40 px, Farben je Design).
  Es schließt nur das Fenster; gewählte Filter bleiben aktiv (Zahl am 🔽). Nur App. Test 386.

## 2.23.36 – 2026-10-04 – 🔽 Protokolle filtern nach Jahr, Monat, Ort, Protokollführer (Wunsch Hansi)
- KC-CLUB-PROTOKOLL-FILTER: In „📄 Protokolle“ oben das Symbol 🔽 – antippen öffnet die Filterfelder ordentlich in zwei Spalten:
  📅 Jahr, 🗓️ Monat, 📍 Ort, ✍️ Protokollführer (Auswahl nur aus vorhandenen Protokollen), darunter „x von y Protokollen“ und
  „↺ Alle zeigen“. Die Zahl am Symbol zeigt aktive Filter. Wirkt zusammen mit dem bisherigen Suchfeld; bleibt beim Neuladen erhalten.
  Kopfzeile bleibt einzeilig. Nur App (keine Server-Änderung). Test 385.
- Daten: Protokoll „Sitzung des Köcheclubs, 04.09.26“ (handschriftlich von Anne Reinkober) als Entwurf angelegt, ohne Nachricht;
  Hansi hat den Scan angehängt und veröffentlicht.

## 2.23.35 – 2026-10-04 – „Schnellzugriff“ führt zu den Schnellstart-Symbolen oben (Wunsch Hansi)
- KC-CLUB-SCHNELLZUGRIFF-LINK: Das Wort „Schnellzugriff“ auf der Startseite ist antippbar (gepunktet unterstrichen) und blättert oben im
  Kopf zur Karte „⚡ Schnellstart“ mit den Lieblings-Symbolen, scrollt nach oben und lässt den Kopf kurz aufleuchten (Farbe wie der Tipp-Puls).
  Einfache Ansicht: Rückfrage, ob zur erweiterten Ansicht gewechselt werden soll. Schnellstart aus: öffnet ⚙️ → „⚡ Schnellstart“ zum Einschalten.
  Test 384.

## 2.23.34 – 2026-10-04 – 👍/👎 „Hat dir das weitergeholfen?“ unter jeder Hilfe (Wunsch Hansi)
- KC-CLUB-HILFE-BEWERTUNG: Unter jeder Hilfe im Hilfe-Zentrum (auch beim „?“ und in der Suche) „Hat dir das weitergeholfen? 👍 Ja / 👎 Nein“.
  Bei 👎 freiwillig „Was hat gefehlt?“ (Vorschläge: zu kurz, schwer verständlich …). Danach „Danke …“ mit „ändern“.
- Admin: im Inhalt „📊 Bewertungen der Hilfen“ – Summen je Hilfe (am wenigsten hilfreich zuerst) und die Hinweise OHNE Namen.
- DB: kc_club_hilfe_bewertung (je Person + Hilfe eine Zeile, RLS an, nur über kc-club), Migration 20261004_kc_club_v22334_hilfe_bewertung.sql
  (eingespielt). Server: hilfe_bewerten, hilfe_bewertungen (nur Admin). Protokoll nur Art + Wert. Test 383.

## 2.23.33 – 2026-10-04 – 📖 Bedienungsanleitung Version 4 (Wunsch Hansi)
- KC-CLUB-ANLEITUNG-V4: dokumente/Koecheclub-App_Anleitung_V4.pdf (43 Seiten, Stand 2.23.32) in „Meine Dokumente“ (neue id → leise „NEU“
  bis 30.11.). V1–V3 bleiben unverändert im Repo (Release-Artefakte unveränderlich).
  - Alle Bildschirmfotos neu (aktuelles Aussehen: Ringe, „?“ und Lupe, Kopfleiste) – nur Demodaten („Max Mustermann“ …).
  - Neue Kapitel: 14. Spiele, 15. Hilfe & Tipps, 16. Dienstwünsche (Twinkey + leerer Wunschbogen), 17. Meine Daten haben sich geändert.
  - Ergänzt: 3. Nachrichten (Chats archivieren/löschen), 4. Termine (Terminanfragen + eigene Erinnerung), 7. SOS (Nachricht an alle –
    Admin bzw. nach Freigabe), 8. Einstellungen (Über die App). „NEU“ markiert nur noch die V4-Neuerungen.
  - Baukasten tools/anleitung: fotos4.mjs (neue Bilder), basis.mjs (Startfenster „Kurz erklärt“/Spiel-Einladung für Bilder aus,
    sonst verdecken sie die Ansicht), inhalt.mjs V4, README. Tests 232/261/284 auf V4 erweitert, Test 382.

## 2.23.32 – 2026-10-04 – 👨‍🍳 Über die App: Entwickler mit Passbild (Wunsch Hansi)
- KC-CLUB-ENTWICKLER: Fenster „Über die App“ mit Passbild und Lebenslauf von Hans-Joachim Koch – wie „Entwickler“ in KC Futura Academy
  (Text von dort, letzter Absatz für die Club-App). Foto aus KC Futura Academy (shared/hans-joachim-koch.jpg, dort bereits öffentlich)
  als entwickler-hans-joachim-koch.webp (20 KB, ohne Kameradaten/EXIF). Rund mit Goldrand. Knopf „💬 Hansi schreiben“ (nicht bei ihm selbst).
  Erreichbar: ⚙️ Mehr → ℹ️ App-Info „👨‍🍳 Über den Entwickler“, einfache Ansicht „👨‍🍳 Über die App“, Hilfe-Zentrum (Technik),
  Schnellsuche. Test 381.

## 2.23.31 – 2026-10-04 – Tagesübersicht: „Heute nicht mehr anzeigen“ (Wunsch Hansi)
- KC-CLUB-TAGESINFO-HEUTE-AUS: In der Tagesübersicht (Clubleitung, beim Start) neuer Knopf „🌙 Heute nicht mehr anzeigen“ – bis Mitternacht
  erscheint sie beim Start nicht mehr (je Gerät, localStorage), morgen wieder wie gewohnt. „📋 Übersicht“ öffnet sie jederzeit.
  Der bisherige Schalter „Auf diesem Gerät nicht mehr beim Start zeigen“ (dauerhaft) bleibt. Test 380.

## 2.23.30 – 2026-10-04 – Abgesagte Terminanfragen als Stornierung, ohne Zahl und ohne „offen“ (Wunsch Hansi)
- KC-CLUB-TERMINANFRAGE: Abgesagte Anfragen bleiben in der Liste blass mit „🚫 abgesagt“ stehen, bis der Termin vorbei ist (wie bisher),
  zählen aber nicht mehr in der Zahl neben „📨 Terminanfragen“ und zeigen keine Antwortzeile („✅ 0 · 🤔 0 · ❌ 0 · ⏳ 1 offen“) mehr.
  Im Kalender stehen sie weiterhin nicht. Test 379.

## 2.23.29 – 2026-10-04 – Roter Puls-Ring auch nachts gut sichtbar; Kontrastprüfung aller Farbdesigns (Wunsch Hansi)
- Kontrastprüfung aller 22 Farbdesigns (Tag + Nacht): Text, grauer Text, weiße Knopfschrift, rote Schrift – überall ausreichend (≥ 4,5:1).
  Einziger Fund: der rote Puls-Ring war nachts in allen Designs zu schwach (≈ 1,6:1).
- KC-CLUB-PULS-KONTRAST: Ringfarbe zentral als Variable --pulsRing/--pulsRingA – Tag unverändert (208,2,27 · 0,55), Nacht kräftiges
  Hellrot (255,77,94 · 0,9; in allen Designs ≥ 3,5:1). Gilt für den Tipp-Puls und die pulsierenden Knöpfe (vsPuls).
  Der Tipp-Puls prüft zusätzlich den echten Hintergrund hinter dem Element (auch Verläufe, z. B. dunkler Kopf) und nimmt bei zu wenig
  Kontrast (< 2,5:1) die nächste Farbe (Hellrot → Rot → Gelb → Weiß). Test 376 (rechnet alle Nacht-Designs nach).
- KC-CLUB-SPIEL-TERMIN-ABSAGE (Fund Hansi: Herausforderung zurückgezogen, der Termin dazu stand noch im Kalender): Wird eine
  Spiel-Herausforderung zurückgezogen, sagt die App die offene Terminanfrage dazu mit ab (Beteiligte bekommen wie bei „🚫 Absagen“
  die Absage). Lehnt der Herausgeforderte ab, wird die Terminanfrage still mit abgesagt (die Spiel-Push meldet die Ablehnung schon).
  Absagen an einer Stelle (anfrageAbsagen) – „🚫 Absagen“ unverändert. Abgesagte Anfragen stehen nicht mehr im Kalender, in der Liste
  „Terminanfragen“ mit „🚫 abgesagt“. Datenkorrektur: die eine betroffene Anfrage (Hansi, 06.10.) auf abgesagt gesetzt, ohne Nachricht. Test 377.
- Twinkey-Fenster (Funde Hansi): Die drehende Mütze beim Twinkey-Laden (eigene Seite dienstwunsch.html) zeigt jetzt auch hinten
  „since 1991“. Kopfleiste in zwei Reihen (oben Zurück + Titel, darunter „🖨️ Leerer Bogen“ und „✅ Fertig – Bestätigung“ gleich breit).
  „✉️ Per E-Mail an mich“: deutliche grüne Bestätigung im Fenster „Die E-Mail wurde an dich geschickt“ (Fehler rot).
- Fund dabei: Kurzmeldungen (melde) lagen unter Vollbild-Fenstern wie Twinkey (z-index 50 < 2000) und waren dort unsichtbar – jetzt
  z-index 2300, überall sichtbar. Test 378.
- KC-CLUB-LUPE-RING (Wunsch Hansi): Die runde Lupe unten rechts bekommt einen Kontrastring (vorher ohne Rand); das „?“ daneben nutzt
  dieselbe Ringfarbe --textRot statt --rot (nachts war dessen dunkelroter Rand kaum zu sehen). Kontrast in allen Designs: Tag ≥ 8,7:1, Nacht ≥ 6,9:1.

## 2.23.28 – 2026-10-04 – Chats archivieren, wieder aktivieren, bei mir komplett löschen (Wunsch Hansi)
- KC-CLUB-CHAT-ARCHIV: In der Chat-Liste (einmal tippen) und im Chat-Menü:
  - „📦 Archivieren“ – der Chat verschwindet aus der Liste und steht oben unter „📦 Archiviert (n)“ (mit Zahl ungelesener Nachrichten).
    Er bleibt archiviert, auch wenn jemand schreibt (Push wie bisher; Stummschalten bleibt getrennt). Nur für mich.
  - „📤 Wieder aktivieren“ – holt ihn aus dem Archiv zurück in die Liste.
  - „🗑️ Bei mir komplett löschen“ – alle bisherigen Nachrichten nur für mich weg (wie „Für mich löschen“, kc_communication_message_hidden),
    Chat aus Liste und Archiv. Die anderen behalten alles; schreibt jemand neu, kommt nur das Neue. Aus dem offenen Chat wird vorher die
    Ablage als Dokument im persönlichen Archiv angeboten.
  - Bestehend unverändert: „🙈 Nur bei mir entfernen“, „⚠️ Für alle löschen“ (Admin), „🗄️ Chat in mein Archiv legen“ (Dokument).
- Server: Aktionen unterhaltung_archivieren (zurueck) und unterhaltung_leeren; Liste „unterhaltungen“ liefert archiviert (Zeitpunkt).
  Speicherung je Person in kc_club_person_einstellung („chat_archiv“) – keine neue Tabelle. Protokoll nur Aktionsart, keine Inhalte.
- Hilfe-Eintrag „Chats archivieren, zurückholen und löschen“. Test 374.
- KC-CLUB-WUNSCHBOGEN (Wunsch Hansi): Unter „📝 Dienstwünsche“ oben „🖨️ Leerer Bogen“ (auch Schnellsuche, Hilfe, Link #wunschbogen):
  der leere, persönliche Bogen zum Ausfüllen von Hand – DP2s „Persönliche Verfügbarkeitsmatrix V12“ (Kann/Wunsch/Sperre je Tag, Seite 2
  Bereitschaft + Anleitung), erzeugt mit DP2s eigenem Druckteil (DP2-Code unverändert). Name oben, QR oben rechts mit der Mitglieds-ID:
  {"schema":"KCDP-FORM-PROFILE-1","profileId":"KC-P-…","periodId":"…"} – nur ID und Zeitraum, kein Zugang. Profil-Nummer = Mitglieds-ID
  (dp2-club/daten.js), dadurch auch beim DP2-Ausdruck „Meine Angaben“ dieselbe, feste Nummer.
  Vorschau in der App, „🖨️ Drucken“ (Druck-Kern, randlos A4 quer), „📤 Teilen / Speichern“, „✉️ Per E-Mail an mich“ (Server-Aktion
  wunschbogen_mailen: nur PDF, nur an die eigene hinterlegte Adresse als Anhang, höchstens 1× je 2 Min.). Test 375; Test 1.64.0
  (gemeinsamer PDF-Helfer) zählt jetzt „mindestens 2“ Nutzer.
- KC-CLUB-TIPP-PULS (Wunsch Hansi): Der Schriftzug „> Einfache Ansicht <“ / „< Erweiterte Ansicht >“ pulst jetzt auch (größer + roter Ring).
  Er tauscht sich beim Antippen gegen seinen Partner – ein Knopf, der dabei unsichtbar wird, zählt wie neu gezeichnet; es pulst,
  was an derselben Stelle steht. Gilt zentral für alle so getauschten Knöpfe. Test 2.23.24 erweitert.

## 2.23.27 – 2026-10-04 – Roter Ring auch bei Knöpfen, die sofort ein Fenster öffnen (Wunsch Hansi)
- KC-CLUB-TIPP-PULS: Der Puls startet jetzt schon beim Aufsetzen des Fingers – so ist der rote Ring auch bei Knöpfen/Kacheln zu sehen,
  die sofort ein Fenster oder eine andere Ansicht öffnen. Wird gescrollt (Finger > 10 px bewegt), bricht der Puls ab.
  Neu gezeichnete Reiter pulsieren weiterhin an derselben Stelle nach. Eingabefelder nie. Test 2.23.24 erweitert.

## 2.23.26 – 2026-10-04 – Tipp-Puls wie die pulsierenden Knöpfe (Wunsch Hansi)
- KC-CLUB-TIPP-PULS: statt kurzem Zusammenziehen jetzt derselbe Puls wie bei den pulsierenden Knöpfen (vsPuls): zweimal größer werden
  (kleine Elemente 1,12, große Flächen 1,03) mit rotem Ring, gut 0,8 s. „Weniger Bewegung“: nur einmal der Ring, ohne Größerwerden.
  Gilt für alle Reiter, Knöpfe, Kacheln usw. (zentrale Stelle). Test 2.23.24 angepasst.

## 2.23.25 – 2026-10-04 – Spiele: offene Herausforderung erreichbar, Termin dafür vereinbaren (Fund Hansi)
- Fund: Herausforderung an Klaus zurückgezogen, später erneut herausgefordert (offen) – der nächste Versuch „Termin vereinbaren“ meldete nur
  „Du hast diese Person schon herausgefordert“, und die offene Herausforderung ließ sich in der Liste nicht antippen.
- KC-CLUB-SPIEL-SCHON-OFFEN: Offene Herausforderungen (von dir und an dich) sind in der Liste antippbar → darin „📅 Termin vereinbaren“.
  Kommt beim Herausfordern „schon herausgefordert“, öffnet die App direkt die vorhandene Herausforderung bzw. beim Termin-Weg gleich deren
  Termin-Fenster (statt nur der Fehlermeldung).
- KC-CLUB-TIPP-PULS nachgebessert (Fund Hansi „die Tabs pulsierten nicht“): Reiter zeichnen sich beim Antippen neu – der Puls lief am alten,
  schon entfernten Element. Jetzt pulst nach dem Klick das Element, das dann an der Stelle steht (Register, Mitglieder, Termine geprüft).
  Puls etwas deutlicher (0,9 statt 0,92, heller). Auslöser ist der Klick – Scrollen löst nie einen Puls aus. Test 373.

## 2.23.24 – 2026-10-04 – Alles Anklickbare pulsiert kurz beim Antippen (Wunsch Hansi)
- KC-CLUB-TIPP-PULS: Knöpfe, Reiter (Register, Termine, Mitglieder …), Kacheln, Info-Feld, Chips, Links, Schalter-Zeilen und Zeilen mit
  Tipp-Funktion ziehen sich beim Antippen kurz zusammen und werden etwas heller (0,28 s). Eine Stelle für die ganze App – neue Elemente
  bekommen es automatisch. Läuft neben vorhandenen Animationen (eigene „scale“-Animation), Scrollen löst keinen Puls aus, große Flächen
  pulsieren nur leicht, „weniger Bewegung“ nur angedeutet, Eingabefelder nie. Test 372.

## 2.23.23 – 2026-10-04 – „since 1991“ auf der Rückseite der Kochmütze (Wunsch Hansi)
- KC-CLUB-MUETZE-SINCE: Die drehende Kochmütze zeigt vorne die Mütze, hinten „since 1991“ – beim Warten („Einen Moment …“), beim
  Twinkey-Laden und im Sicherheits-Check (kleine Mütze ohne Text). Zentral per CSS (Rückseite, backface-visibility).
  Drehung beim Warten etwas ruhiger (1,6 s statt 1,1 s), damit man den Spruch lesen kann. Test 371.

## 2.23.22 – 2026-10-04 – ⏰ Eigene Erinnerung zu jeder Terminanfrage (Wunsch Hansi)
- KC-CLUB-ERINNERUNG-WAHL: Nach der Zusage (Ja/Vielleicht) und nach dem Vorschlagen fragt die App „⏰ Erinnerung für dich“ – für alle
  Terminanfragen, auch Spiel-Termine. Ordentlich gegliedert: Kopf (Anlass, Zeit, Ort) · „1 · Wann?“ (Keine/15/30 Min./1/2 Std. + Schalter
  „Zusätzlich am Vortag“) · „2 · Wie?“ (Kacheln 🔔 Push, ✉️ E-Mail, 📅 Handy-Kalender) · Knöpfe „Erinnerung speichern“ / „Keine Erinnerung“.
  Jede Person stellt selbst ein; die App merkt sich die Wahl als Vorschlag. An der Anfrage/Partie: „⏰ Erinnerung: … ✏️ Ändern“.
- Handy-Kalender: Termin-Datei mit eingebautem Alarm (klingelt auch ohne Internet). Wecker stellen kann eine Web-App nicht (gesperrt).
- Server: neue Tabelle kc_club_erinnerungen, Aktion erinnerung_setzen; Wartung schickt eigene Erinnerungen per gewähltem Weg (bis 7 Min.
  früher wegen 15-Min.-Takt, Text nennt die echte Restzeit), Standard-Erinnerung nur noch an Personen ohne eigene Einstellung,
  „am Vortag“ abwählbar. Erinnerungs-Pushes (⏰) bleiben stehen und vibrieren kräftiger (Service Worker).
- Spiel-Termin-Formular: Auswahl „Erinnerung kurz vorher“ entfällt (jeder stellt selbst ein, Standard 1 Std.). Test 2.9.10 angepasst, Test 370.

## 2.23.21 – 2026-10-04 – Gruppen auf der Mitglieder-Seite fallen auf (Wunsch Hansi)
- KC-CLUB-GRUPPEN-AMEISEN: Beim Öffnen der Mitglieder-Seite läuft 4 Sekunden lang ein oranger Ameisenrahmen um die Gruppen-Knöpfe
  (z. B. „📋 Innovation“), danach ruhig. Bei jedem neuen Öffnen wieder; „weniger Bewegung“ → langsamer. Test 369.

## 2.23.20 – 2026-10-04 – ✕ oben rechts in langen Fenstern (Wunsch Hansi)
- KC-CLUB-BLATT-X: Jedes Fenster, dessen Schließen-Knopf erst nach Scrollen erreichbar ist, bekommt oben rechts ein rundes ✕ in einer
  schmalen Leiste, die beim Scrollen oben stehen bleibt – der Inhalt rutscht darunter durch, nichts wird verdeckt. Es schließt wie „Zurück“
  (fensterZu, Rückfragen = Abbrechen). Nicht bei kurzen Fenstern, nicht wenn oben schon ein ✕/Schließen sitzt, nie beim Notfall-Fenster.
  Zentral an einer Stelle – auch künftige Fenster bekommen es automatisch. Test 368.

## 2.23.19 – 2026-10-04 – Online-Mitglieder fallen mehr auf (Wunsch Hansi)
- KC-CLUB-MG-ONLINE-PULS: In der Mitglieder-Übersicht hat der Namenskreis aller, die gerade online sind, einen hellgrünen Rand
  (#6ee87a) und pulsiert leicht (2,4 s, um 6 % größer, mit sanftem Lichtring) – in der Kachel- und in der Listenansicht.
  Bei „Bewegung reduzieren“ nur der Rand. Test 367.

## 2.23.18 – 2026-10-04 – Randpfeile farbig, bei Neuem 5× blinken (Wunsch Hansi)
- KC-CLUB-MINI-PFEIL-BLINK: Die drei Pfeile „›“ auf dem Rand der Felder oben (erweiterte Ansicht) sind farbig, sobald im Feld etwas
  ist: Neue Nachr. gelb (ungelesene Nachrichten), Mitglieder grün (jemand online), Nächster Termin hellblau – mit Frist grün/orange/rot
  wie die Ameisenstraße. Bei neuem Stand (mehr Nachrichten, mehr Leute online, anderer Termin/andere Frist) blinkt der Pfeil 5×
  hintereinander (5 × 0,8 s), danach bleibt er ruhig farbig. Neuzeichnen setzt das Blinken nicht neu an. Ist nichts da: weiß wie bisher.
  Tests 202/207 an den neuen Aufbau angepasst, Test 366.

## 2.23.17 – 2026-10-04 – Nutzung nach Uhrzeit und Wochentag (Wunsch Hansi)
- KC-CLUB-NUTZUNG-UHRZEIT: „📊 Nutzung – ohne Namen“ (Admin) zeigt jetzt auch, **zu welchen Uhrzeiten** die App genutzt wird:
  24 Stunden-Säulen (stärkste Stunde rot), die drei stärksten Stunden, Tageszeiten (morgens/mittags/nachmittags/abends/nachts)
  mit Anteil, dazu **Wochentage** (aus den vorhandenen Tageszahlen, auch rückwirkend). „Wie oft was aufgerufen“ wie bisher.
- Gezählt wird beim Antippen nur die Stunde (Berliner Zeit) – in eigener Tabelle `kc_club_nutzung_stunden` (Tag, Stunde, Anzahl),
  bewusst ohne Person, Gerät und ohne Bereich. Migration 20261004_kc_club_v22317_nutzung_stunden.sql (angewendet). Test 365.

## 2.23.16 – 2026-10-04 – Ansichtsname größer, mit < > und > < (Wunsch Hansi)
- KC-CLUB-ANSICHT-NAME: Der Name hinter „Schnellzugriff“ ist etwas größer (.66 → .82rem). Statt Klammern zeigen Pfeile die Richtung:
  erweitert „< Erweiterte Ansicht >“ (nach außen), einfach „> Einfache Ansicht <“ (nach innen). Antippen schaltet weiter um.
  Hinweistext in der Hilfe angepasst, Test 88 angepasst.

## 2.23.15 – 2026-10-04 – „Kurz erklärt“ in allen Arbeitsfenstern (Wunsch Hansi)
- KC-CLUB-EINWEISUNG: Prüfung „Haben alle Unterpunkte eine Karte?“ – 23 von 31 Ansichten (8 Unterseiten bewusst ohne) und 5 von 62 Fenstern
  hatten eine. Jetzt haben 26 weitere Arbeitsfenster eine eigene Karte oben (mit Vorlesen, „Verstanden“, „Keine Einweisungen mehr“):
  Archiv ablegen, Bildschirmfoto, Kurze Abstimmung, Gemerkte Nachrichten, Kontakt teilen, Mikrofon-Wahl, ＋ Neu, Mitfahrt anbieten,
  Fotoalbum (wählen / anlegen), Herausfordern, Termin für die Partie, Mit Köcheclub geteilt; Büro (nur Büro-Berechtigte): Drucken,
  Schreiben, Person wählen, Sitzung wählen, Einladung, Eingangskorb-Eintrag, Erstattung, Dienstzeiten, Ablegen, Freud &amp; Leid (Angaben,
  Informieren); Admin: Persönlicher Link, Ämter und Rechte. Ohne Karte bleiben kleine Info-/Rückfragefenster und Fenster, die selbst
  schon erklären (Diktat, Einrichten, Code, Mikrofon-Hilfe, Server-Störung). Test 364.

## 2.23.14 – 2026-10-04 – „Kurz erklärt“ auch in den Schritten von „Meine Daten haben sich geändert“ (Wunsch Hansi)
- KC-CLUB-EINWEISUNG: Bisher stand die Karte „🎓 Kurz erklärt“ nur auf der Auswahlseite. Jetzt erscheint sie auch nach dem
  Antippen einer Art (Anschrift, Name, Handy, Festnetz, E-Mail, Geburtsdatum, Notfallkontakt, Kleidergröße, Mitgliedschaft,
  Sonstiges) oben im Fenster – Text passend zur Art, mit Vorlesen, „Verstanden“ und „Keine Einweisungen mehr“ wie überall.
  Neue Einweisung `b-aenderung-schritt` (auch im Hilfe-Zentrum). Empfänger nennt die Karte nicht (stehen weiter unten, vom Server). Test 363.

## 2.23.13 – 2026-10-04 – Feedback-Bogen an den heutigen Stand angepasst (Wunsch Hansi)
- KC-CLUB-FEEDBACK: neuer Bogen „2026-3“ (2026-2 hatte noch keine Antworten). „Was nutzt du?“ + Spiele, Hilfe-Zentrum, Termine der Stadt,
  Erstattung, Meine Daten geändert; „Probleme“ + Diktieren/Mikrofon; neue Frage „Hilft dir die Hilfe?“ (bei Teils/Nein: was fehlt?).
  Wünsche: „Auch ohne Internet lesen“ raus (gibt es), neu „Weniger Benachrichtigungen“, „Weitere Spiele“.
  „✅ Schon umgesetzt“ um acht Punkte ergänzt. Test 252 angepasst, Test 362.

## 2.23.12 – 2026-10-04 – Tipp des Tages auch aus dem Hilfe-Zentrum (Wunsch Hansi)
- KC-CLUB-TIPP / KC-CLUB-HILFEZENTRUM: der Tipp des Tages nimmt jetzt außer den 26 TIPPS auch die Hilfen aus HILFE (ohne Kapitel
  „Erste Schritte“, nur was für mich gilt, z. B. Büro nur Clubleitung) – Vorrat für Monate. Reihenfolge: Hilfen, die nach dem ersten
  Tipp-Tag neu dazukommen (seit > stand), zuerst; sonst wie in den Listen. Es geht reihum durch die Kapitel (Startseite, Darstellung,
  Nachrichten, Termine, Clubleben …). Weiter höchstens einer je Tag, „Kenne ich“, „Später“, „Keine Tipps mehr“ wie bisher (bisherige
  Antworten bleiben gültig). Neu im Tipp: „❓ Mehr dazu“ öffnet das Hilfe-Zentrum genau bei dieser Hilfe; Hilfen mit „Zeig mir wo“
  haben das als Hauptknopf, sonst „📖 In der Hilfe ansehen“.
- Server: Einstellung „tipps“ nimmt Schlüssel „h:id“ an (bis 40 Zeichen, bis 400 Einträge statt 80) und speichert „stand“ und
  „letztesThema“ – sonst wären „Kenne ich“ für die neuen Tipps verloren gegangen. Test 356.

## 2.23.11 – 2026-10-04 – Inkognito: auch der gelbe Rahmen blinkt (Wunsch Hansi)
- KC-CLUB-INKO-BLINKEN: Der gelbe Rahmen um den Kopfbereich der Startseite blinkt im Takt der Brille gelb ↔ rot (1,2 s; bei
  „weniger Bewegung“ 2,4 s). Die Ameisen beim Einschalten bleiben wie bisher. Test 361.

## 2.23.10 – 2026-10-04 – Datenbank-Zeitgrenze: schneller in den Notbetrieb (Freigabe Hansi)
- Anlass: Nacht 03./04.10. – Supabase-Störung 3:55–5:40 Uhr (Anfragen hingen 80–150 s, dann 503/546) und Datenbank-Neustart 5:36 Uhr.
- KC-CLUB-DB-ZEITGRENZE: Jede Datenbank-Abfrage des Servers (REST/RPC) bricht nach 15 s ab. Ist dabei während einer Anfrage etwas
  hängen geblieben, antwortet der Server mit 503 „Die Datenbank antwortet gerade nicht“ – nie mit einem halben Ergebnis (Regel 11).
  Die App wertet 503 schon als „Leitung gestört“ → schneller Notbetrieb bzw. gespeicherter Stand. Datei-Speicher (Fotos, Archiv) unverändert.
- Notfall-Paket: hängt die Datenbank beim Bauen, bleibt das letzte gute Paket stehen (kein lückenhaftes Paket). Test 360.

## 2.23.9 – 2026-10-04 – Spar-Takt: weniger Server-Aufrufe (Prüfung „Optimierung“, Freigabe Hansi)
- Anlass: 15.646 Server-Aufrufe in 24 Std. (davon 9.929 Club-App) → hochgerechnet ~470.000/Monat, kostenlose Grenze 500.000 (Zero-Cost-Gate).
- KC-CLUB-SPARTAKT Chat: tippt jemand → weiter alle 2 s; anderer online und in den letzten 90 s geschrieben → 4 s, sonst 8 s;
  niemand da → 12 s, mit Push 20 s (Push bringt neue Nachrichten sofort). Im Hintergrund keine Abfragen (beim Zurückholen lädt der Chat neu).
- Spiele gegen Mitglieder: ich bin dran → alle 15 s, Gegner dran → 3 s, nach 2 Min. ohne Zug 9 s; jede Änderung → wieder schnell.
- Aufgeräumt: alte Funktion aeErledigt (Knopf „Im KC Manager eingetragen“, seit 2.22.19 durch Freigabe ersetzt, nirgends mehr aufgerufen).
  Die vermeintlich ungenutzten Wisch-/Zieh-/Lang-Drücken-Funktionen starten sich selbst und bleiben. Test 359.

## 2.23.8 – 2026-10-04 – Hilfe-Zentrum kennt die Neuerungen aus 2.23.6
- KC-CLUB-HILFEZENTRUM: fünf neue Hilfen (mit „neu“-Marke und „Zeig mir wo“): 📥 Eingangskorb, 🗄️ in mehrere Ordner ablegen,
  💬 neue Nachricht im Büro (Clubleitung/Büro), 🔊 Tic-Tac-Toe mit Tönen (alle), 🕶️ Brille blinkt rot (nur Admin). Test 358.
## 2.23.7 – 2026-10-04 – Hilfe-Zentrum: „?“ zeigt genau die Hilfen zum Bereich (Prüfung Hansi)
- KC-CLUB-HILFEZENTRUM: Prüfung „passen die Hilfen zum gerade Angezeigten?“ – alle 31 Ansichten gegen alle Hilfen abgeglichen.
  Befund: Protokolle, Aktionen, Standort öffneten „Clubleben“, Dokumente/Überblick „Technik“ – dort stand nichts dazu; Pinnwand,
  Fotos, Mitglieder, Spiele … landeten im ganzen Kapitel „Clubleben“ (21 gemischte Hilfen), Einstellungen nur bei „Aussehen“.
- Neu: das „?“ öffnet „Hilfe zu diesem Bereich“ – zuerst die Kurz-Erklärung des Bereichs, dann genau die passenden Hilfen (Registry
  HZ_SICHT_HILFEN, quer über alle Kapitel, mit ihrer Nummer), darunter „Ganzes Kapitel n ›“ und „📖 Inhalt“. „Zeig mir wo“ →
  „Zurück zur Hilfe“ kehrt auf diese Seite zurück. Dokumente/Überblick verweisen jetzt auf Kapitel „Startseite & Bedienung“.
- Zwei neue Hilfen für bisher unversorgte Bereiche: „Deine Aufgaben aus dem Protokoll“ und „Ausflüge und Reisen auf einen Blick“.
- Aufgesetzt auf 2.23.6 (Eingangskorb, Inkognito-Brille, Tic-Tac-Toe-Töne). Server nur Versionsnummer. Test 355.

## 2.23.6 – 2026-10-04 – Eingangskorb mit Mehrfach-Ablage, Inkognito-Brille blinkt, Tic-Tac-Toe-Töne (Wunsch Hansi)
- Zusammengeführt auf das Hilfe-Zentrum (2.23.5); die Entwürfe 2.22.21/2.22.22 wurden nie eingespielt und kommen hiermit live.

### (Entwurf 2.22.22) Inkognito-Brille blinkt, Tic-Tac-Toe mit Tönen (Wunsch Hansi)
- KC-CLUB-INKO-BLINKEN: Solange Inkognito an ist, blinkt die 🕶️-Brille oben rot (bei „weniger Bewegung“ langsamer). Nur Admin sieht sie.
- KC-CLUB-TTT-TOENE: Tic-Tac-Toe bekommt den Lautsprecher-Schalter („🔊 Töne an / 🔇 aus“, je Gerät, Standard aus) – nur Töne, keine Sprache:
  eigener Zug hell, Zug des Gegners/Computers tiefer, Spielende: Sieg aufsteigend, Niederlage absteigend, Unentschieden zwei gleiche Töne.
  Gegen Computer und Mitglieder. Schalter-Test (2.22.16) angepasst, Test 356.

### (Entwurf 2.22.21) Eingangskorb: Erstattungen, Dienstzeiten, Vorschläge + Ablage in mehrere Ordner (Wunsch Hansi)
- KC-CLUB-EINGANGSKORB: Clubsprecher, Kassenwart und Admin bekommen alles und dürfen alles bearbeiten.
  - 💶 Erstattung (Fahrtkosten/Auslagen): Push „📥 Erstattung von …“ an alle drei (Mail wie bisher). Im Eingang bis erledigt:
    „👁️ Zur Kenntnis“, „✅ Erstattet“ (🏦 überwiesen / 💵 bar, freiwillige Nachricht) oder „✖ Ablehnen“ (mit Grund) – das Mitglied bekommt Bescheid.
  - 📅 Dienstzeiten (Dienstwünsche aus der Club-App): Push an alle drei, sobald das Mitglied 10 Minuten nichts mehr geändert hat
    (die Seite speichert laufend). Im Eingang bis „👁️ Zur Kenntnis“; ändert das Mitglied danach etwas, kommt es als „geändert“ wieder.
    Einzelansicht mit allen Tagen. Eingeplant wird weiter im DP2 (kc_dp_wish_inbox unverändert).
  - 💡 Themen-/Spendenvorschläge: Meldung jetzt auch an den Admin (bisher nur Clubsprecher/Kassenwart).
  - Büro-Übersicht zählt „Erstattungen“ und „Dienstzeiten“ mit; Push führt mit #eingang direkt in den Eingangskorb.
- „🗄️ Ablegen …“ bei Erstattung, Dienstzeiten, Vorschlag und Änderungsmeldung (nach „Erstattet/Abgelehnt“ und „Zur Kenntnis“ automatisch
  gefragt): Ordner per Häkchen, mehrere möglich – Club-Ordner mit Register, Ordner des Mitglieds (zum Nachvollziehen), eigener Ordner.
  Die App merkt sich die Wahl je Art; passender Ordner vorausgewählt (Erstattung → Finanzen). Ablage als Textdatei, im Vorgang vermerkt.
- Migration 20261004_kc_club_v22221_eingangskorb.sql (kc_club_eingang_stand; kc_club_erstattung: erledigt_von/_am, antwort, ausgezahlt).
- aeAblegen nutzt jetzt aeDoku (gleicher Text, auch für „Ablegen …“). Tests 333/335 angepasst, Test 355.
## 2.23.5 – 2026-10-04 – Hilfe-Zentrum: „?“ per Lang-Drücken ausblenden (Wunsch Hansi)
- KC-CLUB-HILFEZENTRUM: lange (0,6 s) auf das „?“ drücken → Rückfrage „❓ Fragezeichen ausblenden?“, die gleich sagt, wie man es
  zurückholt; „🙈 Ausblenden“ oder „Behalten“. Der Fingertipp nach dem Lang-Drücken öffnet die Hilfe nicht.
- Zurückholen: ⚙️ Einstellungen → „❓ Fragezeichen unten rechts“ – in der einfachen Ansicht unter „Das Wichtigste“, in der erweiterten
  unter „🗣️ Ansagen, Töne & Tipps“ (beide Schalter zeigen denselben Stand). Gespeichert je Gerät. Neue Hilfe 2.x „Das Fragezeichen
  unten rechts“ mit „Zeig mir wo“. Server nur Versionsnummer. Test 354.

## 2.23.4 – 2026-10-04 – Hilfe-Zentrum: „?“ in jeder Ansicht (Wunsch Hansi)
- KC-CLUB-HILFEZENTRUM: in allen Ansichten (erweitert und einfach) ein rundes „?“ unten rechts neben der Lupe 🔍 (engt keine
  Kopfzeile ein; im Chat stattdessen ⋮ → „❓ Hilfe zum Chat“). Antippen öffnet direkt das
  passende Kapitel (Registry HZ_SICHT_THEMA, z. B. Nachrichten/Chat → „Nachrichten & Chat“, SOS → „Notfall“, Einstellungen →
  „Aussehen & Darstellung“). „‹“ in der Hilfe führt zurück in die Ansicht, aus einem Chat wieder genau in diesen Chat.
- Nichts öffnet sich von selbst. Vertragstest: jede Ansicht aus zeige() hat eine Zuordnung. Server nur Versionsnummer. Test 353.

## 2.23.3 – 2026-10-04 – Hilfe-Zentrum: Kapitel 1 „Erste Schritte“ (Text Hansi)
- KC-CLUB-HILFEZENTRUM: neues Thema „👋 Erste Schritte“ ganz vorne (= Kapitel 1, die übrigen rücken auf), fünf Hilfen nach Hansis Text:
  1.1 Herzlich willkommen · 1.2 Zuerst: deine Einstellungen (⚙️, „Zeig mir wo“) · 1.3 Mit der einfachen Ansicht beginnen ·
  1.4 Kurze Hilfetexte in jedem Bereich (auch vorlesen) · 1.5 Dein Feedback ist mir wichtig (Register „Club“, Gruß von Hansi).
  Erscheint auch im Ausdruck/PDF als erstes Kapitel. Server nur Versionsnummer. Test 352.

## 2.23.2 – 2026-10-04 – Hilfe-Zentrum: Suchfeld, Kapitel, Zurück-Leiste, Ausdruck/PDF (Wunsch Hansi)
- KC-CLUB-HILFEZENTRUM: Suchfeld deutlicher – eigene Karte „🔍 Wonach suchst du?“ mit rotem Rand, größerer Schrift und Fokus-Rahmen.
- Kapitel: Themen heißen jetzt „Kapitel 1, 2, 3 …“ (Inhalt mit runder Nummer, Register mit Nummer, Kapitelkopf mit „KAPITEL n“),
  jede Hilfe hat ihre Nummer (1.1, 1.2 …), auch in den Suchtreffern („Kapitel 3 · 💬 …“). Mehr Abstand zwischen den Abschnitten.
  Unten im Kapitel „Kapitel n+1 ›“ zum Weiterblättern. Nummern ergeben sich von selbst aus den Themen mit Inhalt.
- „👉 Zeig mir wo“: oben rechts erscheint eine Leiste „↩️ Zurück zur Hilfe“ (schließt offene Fenster, zurück an dieselbe Hilfe,
  kurz hervorgehoben; nach einer Suche zurück zur Trefferliste) und „✕ Abbrechen“ (Leiste weg, man bleibt und stellt gleich ein).
- 🖨️ oben rechts: Drucken oder „Als PDF speichern“ über den vorhandenen Druckweg (Vorschau, iPhone „Druckseite teilen“). Auswahl
  „📖 Ganze Hilfe“ (Inhaltsverzeichnis mit Kapiteln und Anzahl, jedes Kapitel auf neuer Seite) oder ein einzelnes Kapitel
  (vorausgewählt, wenn man gerade in einem Kapitel ist). Druckart DRUCKARTEN.hilfe.
- Server nur Versionsnummer. Test 351.

## 2.23.1 – 2026-10-04 – Hilfe-Zentrum: 53 weitere Hilfen aus der ganzen App (Wunsch Hansi)
- KC-CLUB-HILFEZENTRUM: ganze App nach Funktionen durchsucht (Funktions-IDs + CHANGELOG, Bezeichnungen gegen den aktuellen Code geprüft) und
  53 neue Einträge in der Registry HILFE ergänzt (jetzt 86 eigene, zusammen mit Tipps und Einweisungen rund 140 Hilfen):
  Chat (anheften, merken, Abstimmung, Kontakt teilen, kopieren, weiterleiten, Linie „Neue Nachrichten“, Entwurf, ohne Netz, Haken,
  Sprachtempo, Chat vorlesen, WA, Gruppe löschen), Termine (Wiederholen, To-do, Terminanfrage, Terminfindung, Liste/Kalender, Drucken,
  Nächster Termin, Dienst-Erinnerung), Clubleben (Status, wer ist online, Gratulieren, Pinnwand antworten/wichtig/alte Zettel, Foto-Details,
  Teilen → Köcheclub, Hilfe anbieten/nach Absprache, Vorschläge unterstützen, Spende, Spiele gegen Mitglieder/Pause), Töne (Meine Geräte,
  Anklopfton, Ansage „verlässt die App“), Privatsphäre (Live-Tippen, zuletzt da, Link verloren, Code für weiteres Gerät), Notfall
  (Notfallkontakt, Notfallpass sichern), Bedienung/Technik (Info-Feld « », Sonne/Mond-Knopf, Wetter-Woche, Lämpchen, App schließen,
  PC/Tablet, Was ist neu) und für die Clubleitung die Büro-Sprachsteuerung (nur mit Büro-Recht).
- Ton: freundlich, nicht drängend, jeder Text beginnt anders (Vertragstest prüft die ersten drei Wörter). Deckblatt und Themenseiten haben
  wechselnde Einleitungen (neu gewählt beim Öffnen und Themenwechsel, auf Wunsch mit Vornamen). Neue Einträge `seit: "2.23.1"` → 🆕.
- Keine neuen Meldungen oder Fenster: alles bleibt im Hilfe-Zentrum zum Nachlesen. Server nur Versionsnummer. Test 350.

## 2.23.0 – 2026-10-04 – Hilfe-Zentrum: alle Tipps und Hinweise nach Themen (Wunsch Hansi)
- KC-CLUB-HILFEZENTRUM: neue Kachel „❓ Hilfe & Tipps“ im Register Technik (zusätzlich ⚙️ → „🗣️ Ansagen, Töne & Tipps“ → „❓ Alle Tipps nachlesen“,
  Sprung `#hilfezentrum` bzw. `#hilfezentrum=<thema>`). Vorne ein Deckblatt „📖 Inhalt“: jedes Thema als Link mit Anzahl der Hilfen;
  darüber die Register je Thema (mit Zahl), eine Suche (umlaut-tolerant, Treffer im Titel zuerst) und bei jeder Hilfe „👉 Zeig mir wo“ + 🔊 Vorlesen.
- Themen: Startseite & Bedienung, Aussehen & Darstellung, Nachrichten & Chat, Termine & Kalender, Clubleben, Benachrichtigungen & Töne,
  Privatsphäre & Zugang, Notfall, Technik & Probleme lösen, Bereiche kurz erklärt (+ Auffang „Weitere Tipps“, nur wenn nötig).
- Passt sich selbst an: gesammelt wird bei jedem Öffnen aus TIPPS (Tipp des Tages), EINWEISUNG (Bereiche kurz erklärt) und der neuen Registry HILFE
  (33 neue Hilfetexte, z. B. Kacheln lange drücken zum Anordnen, Farbe unter Darstellung einstellen, Register ziehen). Anzahlen werden gezählt,
  nichts doppelt gepflegt. Neue Einträge mit `seit: "x.y.z"` erscheinen als 🆕 und als Zahl auf der Kachel.
- Die Tipps des Tages und die Einweisungskarten bleiben unverändert (zusätzlich jetzt jederzeit nachlesbar).
- Server: nur Versionsnummer und Nutzungsbereich „hilfezentrum“ (NUTZUNG_BEREICHE). Test 349.

## 2.22.20 – 2026-10-04 – Büro: Hinweis bei neuer Nachricht (Wunsch Hansi)
- KC-CLUB-BUERO-NEU-NACHRICHT: Kommt eine neue Nachricht, während man im Büro ist, erscheint oben ein Hinweis
  „💬 Neue Nachricht von Klaus“ (Gruppe: „von Reinhilde in „Vorstand““, wichtige mit ❗ und rotem Rand) mit den ersten Worten.
  Tippen öffnet die Unterhaltung direkt an der ersten ungelesenen Nachricht; ✕ schließt den Hinweis. Mehrere → „＋ n weitere“.
  Stummgeschaltete Unterhaltungen und eigene Nachrichten lösen keinen Hinweis aus. Mit Push sofort, ohne Push spätestens nach etwa 1 Minute.
  Nur App-Logik (Server nur Versionsnummer). Test 348.

## 2.22.19 – 2026-10-04 – Änderungsmeldung: zur Kenntnis nehmen → freigeben → für KC-Programme bereit (Wunsch Hansi)
- KC-CLUB-AENDERUNG-FREIGABE: im Büro-Eingangskorb je Meldung „👁️ Zur Kenntnis genommen“, „✅ Freigeben“, „↩️ Rückfrage“, „📋 Kopieren“.
  Freigeben darf der Clubsprecher (an den die Meldung ging) oder der Admin; Bankverbindung nur Kassenwart oder Admin.
  Ablage im Vereinsordner „Personal“ (bisher „Mitglieder“), Register Meldungen.
- Nach der Freigabe liegt die Änderung als Übergabe (Felder wie street/postal_code/city, phone, email …) in der Datenbank bereit.
  Die KC-Programme (KC Manager) holen sie über `kc_core_person_aenderungen_offen(org)` und melden mit `kc_core_person_aenderung_quittieren`
  „uebernommen“ oder „abgelehnt“ zurück. Die Club-App schreibt kc_core_people weiterhin nicht selbst.
- Übernommen → Mitglied bekommt „✅ Eingetragen“; abgelehnt → Freigebende und Admins werden informiert (nicht das Mitglied).
- Bankverbindung zurzeit nicht nötig: in „Meine Daten geändert?“ ausgegraut, Server lehnt sie ab.
- Migration 20261004_kc_club_v22219_aenderung_freigabe.sql (neue Spalten, Status, 2 Funktionen nur für Admin/KC-Manager, anon gesperrt).
- Enthält 2.22.18. Tests 333/335 angepasst, Test 347.

## 2.22.18 – 2026-10-04 – Diktieren: bei „gesperrt“ trotzdem versuchen (Fund Hansi)
- KC-CLUB-MIKRO-FREIGABE: Android meldete „Mikrofon gesperrt“ → die App zeigte nur die Anleitung („Verstanden“) und diktierte nicht – obwohl die
  Google-Spracherkennung auf manchen Handys trotzdem hört. Jetzt: bei „gesperrt“ oder abgelehnter Abfrage trotzdem diktieren; nur wenn die
  Spracherkennung selbst „nicht erlaubt“ meldet, kommt die Anleitung (wie bisher). Erklärfenster vor der ersten Abfrage bleibt. Test 339 angepasst.

## 2.22.17 – 2026-10-04 – Rochade einfacher, „ist jetzt online“-Push für alle wählbar (Wunsch Hansi)
- Schach: Rochade geht wie bisher (König → Feld zwei weiter) und jetzt auch über den Turm: König antippen, dann den eigenen Turm – oder
  erst den Turm, dann den König (schRochade / schZieleMitRochade, gegen Computer und Mitglieder; Server prüft wie immer mit chess.js).
  Hinweis unter dem Brett „Rochade: König, dann Turm antippen“. Normale Turmzüge unverändert.
- KC-CLUB-ONLINE-PUSH-ALLE: „📲 Push, wenn sich jemand anmeldet“ („🟢 Hansi ist jetzt online“) bisher nur für Admins – jetzt für alle Mitglieder
  in den Einstellungen; Admins Standard an, alle anderen Standard aus (eigene Wahl). Unsichtbare/Inkognito-Mitglieder werden wie bisher nie
  gemeldet, Ruhezeit gilt. Test zu „nur an Admins“ angepasst. Test 346.

## 2.22.16 – 2026-10-04 – 🔊 Spiele ansagen lassen (Wunsch Hansi)
- KC-CLUB-SPIEL-ANSAGE: je Spiel ein Schalter „🔊 Ansage an / 🔇 aus“ (gilt für dieses Gerät, Standard aus), mit der vorhandenen Vorlese-Stimme:
  ♟️ Schach (gegen Computer und Mitglieder): jeder Zug – „Dein Bauer auf E 4“, „Schwarzer Läufer auf E 5 – hat gerade deinen Springer geschlagen“,
  „schlägt den schwarzen Bauern“, Rochade, Umwandlung, Schach / Schachmatt / Remis; Figurennamen passend zum Stil (klassisch / Küchenbrigade).
  Den Zug des Gegenübers rechnet die App aus der zuletzt gesehenen Stellung nach.
  🔪 Küchenterror: Frage mit allen vier Antworten (A–D), danach die Auflösung mit richtiger Antwort und Erklärung (die Zeit läuft wie immer weiter).
  🃏 Bauernskat: Trumpf-Ansage, Karten des Gegners („Der Computer spielt Herz Ass“), wer den Stich mit wie vielen Augen bekommt, Ergebnis.
  ❌⭕ Tic-Tac-Toe bewusst ohne. Erklärung „Spiele“ nennt den Schalter. Ansage-Helfer für Bauernskat stehen außerhalb der Regeln
  (Server-Kopie bauernskat.js unverändert).
- Schutz: Test 344 findet „// KC-…“-Kommentare, die Code dahinter verschlucken (Fehlerart aus 2.22.12) – in App und Server. Test 345.

## 2.22.15 – 2026-10-04 – Erklärung „Termine“: Handy-Kalender (Wunsch Hansi)
- KC-CLUB-EINWEISUNG: die Erklärung zu 📅 Termine nennt jetzt auch ⚙️ Einstellungen → „📲 Termine im Handy-Kalender“ (alle Club-Termine
  automatisch im Handy-Kalender) – mit dem Hinweis „leider nicht umgekehrt“. Wird wie alle Erklärungen auch vorgelesen. Test 343.

## 2.22.14 – 2026-10-04 – Zahl auf den Kacheln oben rechts (Fund Hansi)
- Die Zahl auf den großen Kacheln stand unten rechts und verdeckte den Untertitel (z. B. „Zu- & Absagen“). Jetzt oben rechts neben dem
  Symbol (im Deko-Kreis), mit leichtem Schatten. Nur CSS (.kachel .zahl). Test 342.

## 2.22.13 – 2026-10-04 – Fehlerbehebung Anmeldung nach Neuladen; Herausforderungen zu Spielen bei allen an (Wunsch Hansi)
- FEHLER aus 2.22.12 behoben: in neuLadenRoh hatte ein Zeilenkommentar („// KC-CLUB-KACHEL-ZAHLEN“) den Rest der Zeile auskommentiert
  (ICH = INIT.ich, Einstellungen, Admin-Name, Klassen …) → nach dem Laden galt man als „nicht angemeldet“ („Einen Moment – die App meldet dich
  noch an …“). Jetzt Blockkommentar; Test 341 verhindert das künftig.
- KC-CLUB-SPIELE-STANDARD-AN: wer nichts eingestellt hat, ist jetzt für alle vier Spiele (Tic-Tac-Toe, Schach, Bauernskat, Küchenterror)
  herausforderbar (Server spielBereitMap: aktive Mitglieder ohne Einstellung = alle Spiele; App: Schalter steht dann auf „an“).
  Wer es selbst ausgeschaltet hat, bleibt aus – die eigene Wahl geht immer vor. Keine Datenbank-Änderung, keine Einstellungen überschrieben.
- Beim ersten Mal (je Gerät, nur ohne eigene Einstellung) der Hinweis, dass es an ist und wo man es abstellt (⚙️ Einstellungen → Privatsphäre →
  „🎲 Andere dürfen mich zu Spielen herausfordern“): als Fenster beim Öffnen von 🎲 Spiele („👍 Passt so“ / „⚙️ Abstellen / einstellen“ führt
  direkt hin) oder im Herausforderungs-Fenster, wenn die erste Herausforderung zuerst kommt. Test 340.

## 2.22.12 – 2026-10-04 – Zahlen auf weiteren großen Kacheln, Mikrofon-Freigabe vor dem Diktieren (Wunsch Hansi)
- KC-CLUB-KACHEL-ZAHLEN: in der erweiterten Ansicht zeigen jetzt auch diese Kacheln, ob etwas auf mich wartet (einfache Ansicht bleibt ruhig):
  📅 Termine (Treffen und Terminanfragen ohne meine Antwort + offene Terminfindungen), 🤝 Helfen & Leihen (offene Hilfe-Aufrufe anderer ohne
  meine Antwort, nicht voll; Clubleitung + Ausleih-Anfragen), 🗂️ Büro (alles im Eingangskorb), 📷 Fotoalbum (neue Fotos anderer seit dem letzten
  Öffnen), 🗓️ Dienstpläne (meine Dienste ab heute, neu/geändert seit dem letzten Öffnen). „Zuletzt geöffnet“ merkt sich das Gerät.
- Server: init liefert kz (kachelZahlen) – jede Zahl einzeln abgesichert, Fehler → null → keine Zahl (nie „0 = erledigt“ aus fehlenden Daten).
  Kachel-Einträge unverändert, Zahlen über KZ_KACHELN angehängt. Test zu init angepasst (Parameter). Test 338.
- KC-CLUB-MIKRO-FREIGABE (Wunsch Hansi): vor dem Diktieren zuerst die Mikrofon-Freigabe – kurzes Erklärfenster („Gleich fragt dein Handy …
  bitte Zulassen tippen“), dann die Abfrage des Handys, erst danach das Diktat-Fenster. Schon erlaubt → sofort los (ohne Fenster);
  gesperrt → Anleitung zum Freischalten (Android, iPhone, PC) statt der kurzen Meldung. Gilt für alle 🎙️-Diktate (Chat, SOS …). Test 339.

## 2.22.11 – 2026-10-04 – Hilfe-Aufrufe: wer hat ihn gesehen? Pinnwand: Antwort-Knopf wählbar (Wunsch Hansi)
- KC-CLUB-HILFE-GESEHEN: wie bei Pinnwand-Zetteln merkt sich die App, wer einen offenen Hilfe-Aufruf angezeigt bekommen hat (Pinnwand-Aushang,
  Helfen & Leihen, Link aus Push/Mail) – erste Zeit bleibt stehen, eigene Aufrufe zählen nicht, Notfall-Paket schreibt nichts.
  Wer geantwortet hat, gilt ebenfalls als „gesehen“.
- Verfasser und Clubleitung sehen im Aufruf „👁️ gesehen n/m“ mit Namen und Zeit sowie „Noch nicht gesehen: …“ (bei Aufrufen an alle;
  bei „gerade online“ ist der Empfängerkreis nicht mehr bekannt). Erfassung erst ab diesem Update – frühere Ansichten sind nicht bekannt.
- Datenbank: neue Tabelle kc_club_hilfe_gesehen (Migration 20261004_kc_club_v22211_hilfe_gesehen.sql, RLS ohne Policies). Test 336.
- KC-CLUB-PINNWAND-ANTWORTKNOPF (Wunsch Hansi): beim Anheften „✍️ Mit Antwort-Knopf“ / „🚫 Ohne Antwort-Knopf“ (Standard: mit, wie bisher;
  bei „Nur für mich“ ausgeblendet). Ohne → kein „✍️ Antworten“ an der Wand und im Post-it-Fenster beim Öffnen. Emoji-Reaktionen bleiben.
  Datenbank: Spalte kc_club_pinnwand.antworten (Standard true – alte Zettel unverändert), Migration 20261004_kc_club_v22211_pinnwand_antworten.sql. Test 337.

## 2.22.10 – 2026-10-04 – Änderungsmeldungen: Eingangskorb + Ordner „Mitglieder“ (Wunsch Hansi)
- KC-CLUB-AENDERUNG: der eigene Regal-Ordner „📬 Änderungen“ entfällt. Meldungen kommen in den 📥 Eingangskorb (wie bisher, Liste mit
  „✔ Erledigt“ – Weg führt jetzt zum Ordner „📇 Mitglieder“) und in den Büro-Ordner „📇 Mitglieder“: oben Knopf „📬 Änderungsmeldungen – n offen
  · 👕 Größen“, Zahl offener Meldungen am Ordnerrücken.
- Archiv: eigener Vereinsordner „Mitglieder <Jahr>“ (nur Clubleitung, Register „Meldungen“) statt „Admin <Jahr>“; persönlicher Ordner wie bisher.
  adminOrdner() ist jetzt vereinsOrdner(ADMIN_ORDNER, …) – gleiche Regel für beide Ordner (Ausleihe/Sicherheits-Check unverändert).
  Schon abgelegte Meldungen bleiben, wo sie sind. Test 335 (Test zu adminOrdner angepasst).

## 2.22.9 – 2026-10-04 – Fehlende Erklärungsfenster (🎓 Kurz erklärt + 🔊 Vorlesen) ergänzt (Wunsch Hansi)
- KC-CLUB-EINWEISUNG: Bereiche ohne Einweisung ergänzt – 💶 Erstattung, 💭 Feedback, 🆘 SOS, 💻 Programme, 🛡️ Sicherheits-Check, 📍 Standorte.
- Neu: Einweisung auch in Fenstern (Registry-Einträge mit blatt: true, einwHtml()): ✏️ Meine Daten geändert, 📬 Änderungen (Clubleitung),
  🏙️ Stadt-Termine (Admin), 🛠️ Admin-Register (Admin), 🚨 SOS-Nachricht (Karte UNTEN – im Ernstfall nicht im Weg).
  Gleiche Karte, gleiche Regeln wie bisher (👍 Verstanden, „Keine Einweisungen mehr“, nach 3 Tagen ohne Antippen nicht mehr), 🔊 Vorlesen.
  einwZeigen() baut die Karte jetzt aus einwHtml() (eine Stelle). Test 334.

## 2.22.8 – 2026-10-04 – Änderungsmeldungen im Büro-Posteingang und im Archiv (Wunsch Hansi)
- KC-CLUB-AENDERUNG: offene Änderungsmeldungen stehen jetzt im Büro-Posteingang – als Kachel „✏️ Änderungsmeldungen“ (Zahl) und in der
  Eingangsliste je Meldung („Änderungsmeldung – bitte eintragen“, Schnellknopf „✔ Erledigt – eingetragen“, Ordner „📬 Änderungen“).
  Zählung serverseitig nur für die Meldungen an mich (Admin: alle).
- Ablage ins Archiv wie bei der Ausleihe (archivTextAblegen): beim Melden und beim Erledigen je eine Textdatei in den Vereinsordner
  „Admin <Jahr>“ (nur Clubleitung) und in den persönlichen Ordner des Mitglieds, jeweils Register „Meldungen“ (wird bei Bedarf ergänzt).
  Bankverbindung im Archiv nur mit den letzten 4 Stellen. Ablage-Fehler halten die Meldung nicht auf (Protokoll „ablage“). Test 333.

## 2.22.7 – 2026-10-04 – ✏️ Meine Daten haben sich geändert (Wunsch Hansi)
- KC-CLUB-AENDERUNG: Kachel „✏️ Meine Daten geändert?“ im Register „Meins“ (und Knopf auf der eigenen Mitglieder-Seite). Antippen, was
  sich geändert hat (Register AENDERUNG auf dem Server): 🏠 Anschrift, 🪪 Name, 📱 Handy, ☎️ Festnetz, ✉️ E-Mail, 🏦 Bankverbindung (IBAN geprüft),
  🎂 Geburtsdatum, 🆘 Notfallkontakt, 👕 Kleidergröße (Kochjacke/Kochhose), ⏸️ Mitgliedschaft ruhen/austreten, 💬 Sonstiges (Empfänger wählbar).
  Bisheriger Stand steht dabei, „gilt ab“ wo sinnvoll. Empfänger je Art aus den Ämtern (Clubsprecher/Kassenwart/Admin), Push + Mail – die Mail
  nennt nur, WAS gemeldet wurde; Einzelheiten nur in der App. Bei Anschrift/Handy/Festnetz/E-Mail auf Wunsch „📣 allen Bescheid sagen“.
- Notfallkontakt wird wie bisher sofort gespeichert, Kleidergröße nur hier geführt – beide gleich „erledigt“ (Info an die Clubleitung).
- Clubleitung: „📬 Änderungen“ im Büro-Regal (Zahl offener Meldungen, auch an der Meins-Kachel), Link #aenderungen aus Push/Mail. Je Meldung
  bisher/neu nebeneinander, „📋 Kopieren“ (für den KC Manager), „✅ Erledigt“ mit kurzer Antwort → Mitglied bekommt Bescheid. Jeder sieht nur,
  was an ihn ging (Admin alles). Bankverbindung: nur Kassenwart/Admin, nach „Erledigt“ bleiben nur die letzten 4 Stellen gespeichert.
  👕 Größen-Übersicht mit Summen je Größe und „Liste kopieren“ für die Bestellung. Mitglied kann offene Meldungen zurückziehen.
- Datenbank: neue Tabelle kc_club_aenderungen (Migration 20261004_kc_club_v2227_aenderungen.sql, RLS ohne Policies). Höchstens 10 Meldungen
  je Mitglied und Tag. Protokoll nur Art/Anzahl, keine Inhalte. Test 332.

## 2.22.6 – 2026-10-04 – Ameisenrahmen um „Innovation“, Spiele live, 🏙️ Termine der Stadt Werne (Wunsch Hansi)
- KC-CLUB-GRUPPE-AMEISEN: beim Öffnen von „💬 Nachrichten“ läuft um die Gruppe „Innovation“ (Liste UH_HERVOR) 5 Sekunden ein roter
  Ameisenrahmen (gleiche Animation wie bei den Registern), danach ruhig; höchstens 1× je Minute, bleibt auch beim Neuzeichnen der Liste.
- SOS: der WhatsApp-Knopf nennt die Club-Gruppe „KCW Köcheclub Werne“ (WA_GRUPPE), damit man sie in der WhatsApp-Auswahl sofort findet.
  (Eine bestimmte Gruppe direkt mit Text öffnen erlaubt WhatsApp nicht – Auswahl bleibt ein Tipp.) Test 329.
- Spiel-Einladung beim Start nennt jetzt auch 🔪 Küchenterror („Tic-Tac-Toe, Bauernskat und das Küchen-Quiz 🔪 Küchenterror …“, Symbol 🔪 dazu);
  Kachel „Spiele“: „Tic-Tac-Toe · Schach · Bauernskat · Küchenterror“ (Fund Hansi).
- KC-CLUB-SPIEL-LIVE: Bin ich online und jemand fordert mich heraus, erscheint sofort ein Fenster „Klaus fordert dich heraus!“ mit Spiel
  (z. B. ❌⭕ Tic-Tac-Toe · 3 × 3) und „✅ Annehmen & los“ (öffnet die Partie) / „⏰ Später“ / „Ablehnen“ – je Anfrage einmal, Handy vibriert.
  Server: „online“ liefert frische Herausforderungen an mich (15 Min.). Push wie bisher.
- Herausfordern (Wunsch Hansi): sofort nur, wer gerade online ist („🟢 Gerade online – sofort spielen“). Alle anderen über „🔎 Person suchen“
  → „📅 Terminanfrage“: legt die Herausforderung an und öffnet gleich die vorhandene Terminanfrage für Partien (steht dann bei beiden im Kalender).
- Spiele-Erklärung: Küchenterror „je Frage 20, 15 oder 10 Sekunden – je nach Stufe“ (war noch „10 Sekunden“). Test 330.
- KC-CLUB-STADT-TERMINE (Wunsch Hansi): Admin-Kachel „🏙️ Stadt-Termine“. Der Server liest die offiziellen Kalender-Abos der Stadt Werne
  (Feste & Events, Märkte, Sim-Jü, Sonstige, Theater & Konzerte, Führungen, Sport, Kinder & Jugend – Register STADT, kostenlos, ohne Schlüssel),
  fasst mehrtägige Feste zusammen (Sim-Jü 24.–27.10. = ein Termin) und lässt Wochenmärkte weg. Der Admin kreuzt an, was als Veranstaltung
  „🏙️ …“ in den Clubkalender kommt – still, ohne Nachricht an die Mitglieder; nichts wird doppelt eingetragen, ein gelöschter Stadt-Termin kommt
  nicht wieder. Auf Wunsch „🔁 automatisch“: einmal pro Woche neue Termine aus den gewählten Kalendern (Zeitplaner „wartung“).
  Gespeichert als Club-Einstellung „stadt_termine“ (kc_club_konfig – keine Datenbank-Änderung), protokolliert. Test 331.

## 2.22.5 – 2026-10-04 – 👥 SOS für alle freigeben (Wunsch Hansi)
- KC-CLUB-SOS-FREIGABE: im SOS-Fenster (nur beim Admin) Schalter „👥 SOS für alle Mitglieder freigeben“ – mit Rückfrage. Gespeichert als
  Club-Einstellung „sos“ (kc_club_konfig, keine Datenbank-Änderung), protokolliert (sos_freigabe). Bei Freigabe sehen alle den roten
  „🚨 SOS“-Knopf in „Nachrichten“ und auf der SOS-Seite; Notfall-Meldung (inkl. Probe) erlaubt der Server dann allen. Ausschalten = wieder nur
  Admin/Vertretung. Admin-Register und Freigabe-Schalter bleiben nur beim Admin. Test 328.

## 2.22.4 – 2026-10-04 – 🔊 Notfall-Meldung wird sofort vorgelesen (Wunsch Hansi)
- KC-CLUB-NOTFALL-VORLESEN: das rote Alarm-Fenster liest die Meldung sofort vor („Achtung, Notfall-Meldung von … “) – mit der vorhandenen
  Vorlese-Stimme des Geräts (sprechAusgabe). Links und Koordinaten werden nicht vorgelesen, die Adresse schon. Erlaubt ein Handy das
  Sprechen erst nach einer Berührung, liest die App beim ersten Antippen vor; zusätzlich „🔊 Nochmal vorlesen“. „Gelesen“ beendet das Vorlesen.
  Die SOS-Probe liest die Vorschau ebenfalls vor. Test 327.

## 2.22.3 – 2026-10-04 – SOS-Textfeld lesbar im Nachtmodus (Fund Hansi)
- Im Nachtmodus war der Text beim Schreiben nicht zu sehen (helle Schrift erbt, Feld blieb weiß). Das Textfeld nimmt jetzt Hintergrund und
  Schrift aus dem gewählten Design (var(--bg)/var(--text)), Platzhalter in Grau, roter Schreibstrich. Geprüft: Klassik und Küchengrün,
  Tag und Nacht; Alarm-Fenster und Knöpfe ebenfalls gut lesbar. Test 326.

## 2.22.2 – 2026-10-04 – 🚨 SOS-Fenster: Senden nach oben, Standort, Notrufe (Wunsch Hansi)
- KC-CLUB-NOTFALL-ORT-RUF: „🚨 JETZT AN ALLE SENDEN“ steht direkt unter dem Textfeld; Erklärung klein nach unten.
- „📍 Meinen Standort anhängen“: bestimmt den Standort wie „Wo bin ich?“ (Adresse über den vorhandenen kostenlosen Adapter, nichts gespeichert)
  und hängt Adresse, Koordinaten und Karten-Link an die Meldung – damit geht er per Push, Mail, WhatsApp und SMS mit.
- „📞 Notruf direkt anrufen“: 🚑 112 Feuerwehr & Rettungsdienst, 🚓 110 Polizei; weitere Nummern (Bereitschaftsarzt, Giftnotruf, Apotheken,
  Seelsorge, Sperr-Notruf) aufklappbar. Gleiche Nummernliste und gleiche Sicherheitsabfrage („ECHTER ANRUF – KEIN TEST“) wie auf der SOS-Seite.
- Test 325.

## 2.22.1 – 2026-10-04 – 🧪 SOS-Probe nur an mich (Wunsch Hansi)
- KC-CLUB-NOTFALL-PROBE: im SOS-Fenster „🧪 Probe nur an mich“ – dieselbe Meldung (roter Rand, „🚨 NOTFALL-PROBE – <Vorname>“, Push + Mail
  auch in Ruhezeit) geht nur an den Admin selbst (eigene Unterhaltung „🧪 SOS-Probe“, nicht in die Notfall-Unterhaltung aller). Danach zeigt
  die App das rote Alarm-Fenster als Vorschau, wie es alle sehen würden. Ohne Text: „Das ist eine SOS-Probe. Bitte nicht reagieren.“
  Protokoll: notfall_probe. Test 324.

## 2.22.0 – 2026-10-04 – 🚨 SOS in „Nachrichten“: an alle auf allen Kanälen (Wunsch Hansi)
- KC-CLUB-NOTFALL-KANAELE: in „💬 Nachrichten“ oben rechts neben „＋ Neu“ der rote Knopf „🚨 SOS“ – nur beim Admin/Vertretung (Mitglieder
  sehen ihn nicht). Öffnet die Notfall-Meldung mit kurzer Erklärung („Neue Nachricht an alle auf allen Kanälen“).
- Schreiben oder 🎙️ einsprechen: das vorhandene Diktat schreibt jetzt auch in andere Felder (diktatStart(ziel, nachSenden)); „📤 Senden“ im
  Diktat-Fenster sendet die Notfall-Meldung direkt. Der Chat-Weg bleibt unverändert.
- Senden: 🔔 Push + ✉️ E-Mail automatisch an alle (wie 2.21.0). Danach sofort „🟢 In WhatsApp senden (Club-Gruppe wählen)“ und
  „💬 Als SMS senden“ mit fertigem Text sowie „📋 Text kopieren“. Automatischer WhatsApp-/SMS-Versand ohne Zutun bräuchte kostenpflichtige
  Schnittstellen (WhatsApp Business, SMS-Anbieter) – Zero-Cost-Regel; deshalb fertig vorbereitet mit einem Tipp. Weitergabe wird protokolliert.
- Ist der Club-Server gestört, bleibt die Meldung nicht hängen: Hinweis + direkt WhatsApp/SMS/Kopieren.
- Nur das Alarm-Fenster beim Empfänger liegt über allem (z-index nur für #alarmBlatt), Rückfragen und Diktat bleiben beim Absender bedienbar.
- Test 323.

## 2.21.0 – 2026-10-04 – 🚨 Alarm an alle: Notfall-Meldung mit Alarmstufe Rot (Wunsch Hansi)
- KC-CLUB-NOTFALL-MELDUNG: nur Admin/Vertretung. Schreiben → „🚨 JETZT AN ALLE SENDEN“ → einmal bestätigen. Zu finden als erste Kachel
  „🚨 Alarm an alle“ im Register Admin, im Notfall-Fahrplan und oben auf der SOS-Seite (Mitglieder sehen den Knopf nicht; ihre SOS-Seite
  bleibt wie sie ist – Notrufe + Kontakte).
- Versand über die vorhandene Nachrichten-Strecke (kein zweites System): eine feste Unterhaltung „🚨 Notfall-Meldungen“ mit allen aktiven
  Mitgliedern (neue kommen automatisch dazu), Nachricht ist immer ❗ wichtig mit Marke „🚨 NOTFALL:“, immer Push + E-Mail – auch bei
  stummgeschaltetem Chat und in der Ruhezeit (bewusste Ausnahme nur für den Notfall; sonst bleibt stumm stumm). Push-Titel
  „🚨 NOTFALL – <Vorname>“. Die Marke kann nur der Admin setzen – bei allen anderen wird sie entfernt (nicht fälschbar).
- Empfänger: im Chat roter Rand + rote, pulsierende Marke „🚨 NOTFALL“; beim Öffnen der App ein rotes Alarm-Fenster über allem anderen
  (ungelesene Notfall-Meldung der letzten 48 Std., je Meldung einmal, Handy vibriert) mit „💬 Öffnen und antworten“ / „✅ Gelesen“.
  Server: init liefert dafür „alarm“. Protokoll: notfall_meldung (Anzahl Empfänger/Zustellungen, keine Inhalte).
- Robustheit Admin-Register: unvollständige Lage-Daten gelten als unbekannt (grau) statt Absturz der Kacheln.
- Test 322 (Stufe 2 – Verlauf/Neustart über GitHub – liegt fertig auf Zweig claude/admin-stufe2 und kommt danach als 2.22.0).

## 2.20.0 – 2026-10-04 – 🛡️ Register „Admin“: Cockpit für Wartung, Überwachung und Notfall (Wunsch Hansi), Stufe 1
- KC-CLUB-ADMIN-REGISTER: auf der Startseite neben Club · Meins · Technik ein viertes Register „Admin“ – nur für Admin/Vertretung
  (Mitglieder sehen weiter drei Register; jede Admin-Kachel auch in Suche/Schnellstart nur für Admins). Mit vier Registern passen alle in
  eine Reihe. Kleinere Kacheln, 3 je Reihe, Farbstreifen je Gruppe (blau Überwachung, lila Dienste, grün App, grau Direktsprünge,
  rot Notfall) und Lämpchen rechts oben (grün/gelb/rot gemessen; grau = unbekannt oder älter als 15 Min. – nie grün).
- Kacheln: 📊 Lage (Ringe für Supabase/Neon/Fotos/B2, alle Lämpchen, Säulen Mitglieder) · 🧯 Notfall-Fahrplan (Diagnose → Störungsseite →
  nach 30 Min. Neustart → Diagnose → Claude; Spiegel, Notbetrieb-Probe, Ernstfall) · 🖥️ Server · 🗄️ Supabase (Belegung, Störungsseite,
  Neustart …) · 🪞 Neon-Spiegel · 🛟 Backups · 💾 B2-Backup (Stand des Backup-PCs, Ring von 10 GB) · 🚑 Notbetrieb · 📨 Communicator (Säulen
  gesendet/wartet/Fehler) · ✉️ Mail · Brevo (alle Mail-Wege) · 🔔 Push · 🧾 Kasse · Gateway (öffentliche Gesundheitsabfrage + Hinweis
  Regression) · 💻 KC-Programme · 📱 Versionen · 🩺 Fehler · 👥 Nutzung · 🔑 Zugänge · 🛠️ Wartung · 🕶️ Inkognito.
- Direktsprünge (Registry AD_DIENSTE): Supabase (u. a. Neustart, API-Schlüssel, Geheimnisse der Server-Funktionen, Logs, Cron, SQL,
  Konto-Zugangsschlüssel), Neon, Cloudflare, GitHub (Abläufe, Spiegel-Wächter, Secrets), Backblaze B2, Brevo, KICC. Keine Passwörter oder
  Schlüssel in der App – Anmeldung beim Anbieter. Neustart nur nach Rückfrage (was passiert, wann sinnvoll), Eingriff wird protokolliert
  (neue Server-Aktion admin_eingriff, nur Admin, feste Arten).
- Server: admin_lage liefert zusätzlich den B2-Stand (kc_backup_machine_telemetry, nur lesend). Grafiken selbst gezeichnet (SVG), kostenlos.
- Stufe 2 (später): Verlaufsmessung für Linien/Säulen über die Zeit, Neustart-Knopf direkt über GitHub (braucht einmal einen Schlüssel).
- Test 321.

## DB/Spiegel – 2026-10-04 (ohne App-Build) – 🛡️ Spiegel-Wächter von außen (Wunsch/Freigabe Hansi)
- Anlass: Störung 04.10. nachts – der Supabase-Zeitplan konnte nichts nach außen schicken (pg_net-DNS-Timeouts). Die Neon-Spiegelung
  hing bisher allein an diesem Anstoß.
- KC-CORE-SPIEGEL-EXTERN: GitHub-Zeitplan „Spiegel-Wächter“ (.github/workflows/spiegel-waechter.yml, stündlich, ohne Secrets) fragt
  den Spiegel-Arbeiter (kc-db-mirror-worker, aktion extern_pruefen). Die Datenbank entscheidet (kc_db_mirror_extern_plan): nur wenn
  keine Wartung, der letzte Spiegel-Lauf älter als 390 Min. (Watchdog-Fenster) und kein externer Anstoß in den letzten 60 Min. → der
  Arbeiter schickt die Pakete selbst an sich (Edge → Edge, ohne pg_net), Protokollzeile run_type „extern_anstoss“. Im Normalbetrieb wird
  Neon nicht geweckt (keine Extra-Rechenzeit). Die Antwort enthält nie den Arbeiter-Schlüssel.
- Kein Parallel-Kern: Paketbildung jetzt in kc_db_mirror_pakete_vorbereiten(), genutzt vom Cron-Lauf kc_neon_low_compute_cycle und vom
  Wächter (Cron-Lauf unverändert: max. 25 Tabellen / 8 MB je Paket). Alle drei Funktionen nur service_role.
- Neu: Workflow „Spiegel-Arbeiter hochladen“ (wie „Server hochladen“) – der Arbeiter kommt jetzt immer aus dem Repository.
- Grenze (ehrlich): ist die Datenschnittstelle selbst gestört (wie am 04.10.), kann auch der Arbeiter nicht lesen – dann ändern sich aber
  auch keine Daten, der letzte Spiegel ist vollständig. Der Wächter hilft, wenn nur der Zeitplan-Anstoß ausfällt.
- Probelauf mit Rückrollen: frisch → nichts; überfällig → 224 Tabellen in 10 Paketen; sofort danach → Sperre. Test 320.
- Rückweg: alte kc_neon_low_compute_cycle (eigene Schleife) einspielen, drop function kc_db_mirror_extern_plan(),
  kc_db_mirror_pakete_vorbereiten(); Workflow spiegel-waechter.yml löschen.

## 2.19.0 – 2026-10-04 – ℹ️ „Was ist los?“ im Notbetrieb + 🩺 Server-Diagnose für den Admin (Wunsch Hansi)
- Anlass: Störung beim Anbieter (Supabase eu-west-2, „API Gateway degraded“) ab 04.10. 03:43 Uhr – Datenschnittstelle (REST) 504,
  Datenbank selbst gesund; Notbetrieb sprang korrekt ein.
- KC-CLUB-NOTBETRIEB-INFO: im Notbetrieb-Band Knopf „ℹ️ Was ist los?“ – ruhige Erklärung für Mitglieder: Club-Server gerade nicht
  erreichbar (seit …), Störung beim Anbieter, nicht am Handy, es wird mit Hochdruck gearbeitet; Ansehen geht (Stand …), nichts geht
  verloren (wartende Einträge gezählt), Fotos/Push erst danach, nichts tun – schaltet von selbst zurück.
- KC-CLUB-SERVER-DIAGNOSE: Admin (⚙️ Admin-Bereich bzw. im „Was ist los?“-Fenster) „🩺 Server-Diagnose“ prüft der Reihe nach:
  Internet (eigene App-Seite), Club-Server (Anklopfen ohne Anmeldung → 401 = läuft), Datenbank (angemeldeter ping, dbMs), Notbetrieb-
  Server (Cloudflare), Störungsseite des Anbieters (status.supabase.com, öffentlich). Ampeln, nicht Geprüftes ⚪ (nie grün), Fazit in einem
  Satz mit Handlungsempfehlung, „📋 Ergebnis kopieren“ zum Weitergeben. Nur lesend, keine Server-Änderung nötig.

## 2.18.4 – 2026-10-03 – Diktat: auch nachgebesserte Wörter ohne Dopplung (Fund Hansi)
- KC-CLUB-DIKTAT-DOPPELT (Nachtrag): zweites Bild „Hi hi hi hi Steven hi Steven das …“ (noch mit 2.18.2 aufgenommen). Nachgestellt mit
  2.18.3 blieben zwei Sonderfälle: gleiches kurzes Stück zweimal in derselben Hör-Runde („Hi“, „hi“) und nachgebesserte Wörter
  („… seine neue“ → „… eine neue Funktion“). diktatMerge kennt jetzt „gleiche Runde“: dort ersetzt ein gleiches Stück das alte, und ein
  Stück mit gleichem Anfang (mind. die Hälfte der Wörter) gilt als Nachbesserung. Zwischen Runden bleibt es streng („ja ja“ bleibt).
- Geprüft: Steven-Beispiel → „Hi Steven das ist eine neue Funktion du kannst einfach mal aus“, Android-kumulativ, Desktop, mehrere Runden.

## 2.18.3 – 2026-10-03 – Diktat: keine Wiederholungen mehr auf Android (Fund Hansi)
- KC-CLUB-DIKTAT-DOPPELT: Fund (Bild): eingesprochener Text wiederholte sich „kannst du deinen Text kannst du deinen Text einsprechen …“.
  Ursache: Android-Chrome liefert beim Dauer-Zuhören jedes Stück erneut als ganzen bisherigen Satz und zählt neu – die App hängte jedes
  Stück an. Jetzt werden die Ergebnisse jeder Hör-Runde neu zusammengesetzt und zusammengeführt (diktatMerge: neues Stück, das mit dem
  letzten beginnt, ersetzt es; schon vorhandenes Ende fällt weg; kurze echte Wiederholungen wie „ja ja“ bleiben). Auf Android zusätzlich
  Satz-für-Satz-Hören (continuous aus, nach jeder Pause automatisch weiter, wie bisher höchstens 5 Minuten).
- Geprüft mit nachgestellten Android-Ergebnissen, normalem Desktop-Verlauf, mehreren Runden und „ja ja“.

## 2.18.2 – 2026-10-03 – Storno bei der Ausleihe geht wieder (Fund Hansi)
- KC-CLUB-LEIHEN-STORNO: Fund „Storno in Ausleihe klappt nicht“ – Ursache: in leihStatus hieß der Rückfragetext „frage“ und verdeckte
  die Funktion frage() → „frage is not a function“, die App brach vor der Rückfrage ab (nichts ging an den Server). Gleicher Fehler in
  vorschlagStatus (Vorschlag zurückziehen / Abstimmung beenden / erledigt). Beide umbenannt (text). Ganze App per Scope-Analyse
  (acorn) geprüft: keine weiteren Überdeckungen (das Werkzeug findet in der Vorversion genau diese zwei). Neuer Vertragstest verbietet
  Variablen, die zentrale Hilfsfunktionen verdecken (frage, melde, api, zeige, meldeFehler, blattAuf, sprechen).
- Geprüft im Browser: Storno → Rückfrage „Ausleihe stornieren?“ → leihen_status gesendet; ebenso Vorschlag zurückziehen.

## 2.18.1 – 2026-10-03 – Küchenterror gegen den Computer: jede Frage ist deine (Fund Hansi)
- KC-CLUB-KUECHENTERROR-GLEICHZEITIG: Fund „Antworten lassen sich immer noch manchmal nicht anklicken, kurz vor Ablauf ist B markiert“ –
  Ursache: gegen den Computer kam abwechselnd eine Frage an den Computer; dort war (gewollt) nichts antippbar und der Computer wählte
  oft spät. Jetzt beantwortest du alle 12 Fragen selbst, der Computer rät gleichzeitig mit (Wahl und Zeit werden beim Start der Frage
  nach Stufe ausgelost; „🤖 hat schon geantwortet!“ erscheint, sobald er fertig wäre). Auflösung zeigt darunter „🤖 Computer: B)
  richtig in 2,9 s – +171“. 11 Fragen + 1 🎖️ Meisterfrage zum Schluss (wie gegen Mitglieder). Geprüft: alle 12 Fragen mit 4
  antippbaren Antworten.
- Keine neue Fehl-Anmeldung: die Admin-Meldung 23:15 war die Sammelmeldung zum anonymen Vorfall 23:02 (in 2.17.3 behoben).

## 2.18.0 – 2026-10-03 – ⏸ Pause / ▶ Weiter in jedem Spiel (Wunsch Hansi)
- KC-CLUB-SPIELE-PAUSE: unten ein Umschalter „⏸ Pause“ ↔ „▶ Weiter“ in jedem Spiel gegen den Computer (Tic-Tac-Toe, Schach,
  Bauernskat, Küchenterror). Pause: Spiel steht still – der Computer zieht nicht (sein Zug wird nachgeholt), die Küchenterror-Uhr hält
  an (verbrauchte Zeit gemerkt), Brett bzw. Frage sind verschwommen (nichts ablesen, nichts antippen), Vorlesen verstummt.
  Weiter: Küchenterror gibt nochmal 3-2-1 Lesezeit, dann läuft die Restzeit weiter (geprüft: 8 s vor → 8 s nach der Pause).
- Küchenterror gegen Mitglieder: der Server misst die Zeit, darum „⏸ Pause nach dieser Frage“ – danach geht es erst mit ▶ Weiter
  (oder „Los geht’s“) weiter. Brettspiele gegen Mitglieder warten ohnehin, dort keine Leiste. Spielwechsel/Verlassen hebt die Pause auf;
  eine angehaltene Küchenterror-Frage geht beim Zurückkommen mit Lesezeit weiter.

## 2.17.3 – 2026-10-03 – App startet wieder auf älteren Browsern (Fund Hansi: „App startet nicht bei einem Mitglied“)
- KC-CLUB-ALTGERAETE: Protokoll (anonym, 21:02 UTC): „SyntaxError: Unexpected token '='“, Zeile 6240, „App-Programm ist gar nicht
  angelaufen“ – Gerät meldet sich als Chrome 116/Linux, kann aber keine logischen Zuweisungen (||=, ES2021). Ein einziger solcher
  Ausdruck lässt das ganze App-Programm nicht starten. Ersetzt: 5× ||= und 4× ??= (gleiches Verhalten), .at(-1) → slice(-1)[0],
  structuredClone → JSON-Kopie. Der App-Code ist jetzt geprüft gültig nach ES2020 (acorn) – neuer Vertragstest verbietet ||= ??= &&=,
  .at(), structuredClone und Zahlen mit „_“ im App-Code dauerhaft.
- Hinweis: chess.js (Fremdbibliothek, unverändert) braucht neuere Browser – wird nur beim Öffnen von Schach geladen, die App startet
  davon unabhängig. Der Service Worker lädt die Startseite online immer frisch – das Gerät bekommt die Reparatur beim nächsten Öffnen.

## 2.17.2 – 2026-10-03 – Küchenterror: Tipp zählt sofort (Fund Hansi „ich kann oft die Antworten nicht antippen“)
- KC-CLUB-KUECHENTERROR-TIPP: Hansis Handy (Android/Chrome) lief beim Fund noch auf 2.17.0 (ohne die Freistellung aus 2.17.1).
  Zusätzlich: Android wertet einen Tipp nicht als „Klick“, wenn der Finger dabei leicht verrutscht – unter Zeitdruck häufig. Jetzt zählt
  die Antwort schon beim Aufsetzen des Fingers (pointerdown; Klick als Rückfall, genau einmal gezählt), touch-action: manipulation
  (keine Doppeltipp-Verzögerung), gewählte Antwort sofort blau markiert, alle Knöpfe gesperrt; gegen Mitglieder „⏳ Antwort ist
  angekommen – wird geprüft …“ bis der Server antwortet. Meldungen oben fangen während der Frage keine Tipps ab.
- Geprüft: nur Aufsetzen ohne Klick → gewertet; Aufsetzen + Klick → einmal gezählt; während 3-2-1 → nichts.

## 2.17.1 – 2026-10-03 – Küchenterror: alle Antworten frei antippbar (Fund Hansi)
- KC-CLUB-KUECHENTERROR-FREI: Fund „ich konnte mehrmals die richtige Antwort nicht anklicken“ (keine Fehler im Protokoll) – Ursache:
  die unterste Antwort lag teils hinter der Menüleiste unten, die schwebende 🔍-Lupe deckte rechts Antworten ab. Jetzt während einer
  Quizfrage (gegen Computer und Mitglieder): Menüleiste und Lupe ausgeblendet, die Frage wird einmal nach oben geholt; danach
  (Übersicht, Ergebnis, andere Ansicht) ist alles wieder da. Geprüft auf 360×640, 390×844 und 820×1180: alle 4 Antworten sichtbar und
  der Tipp trifft genau den Knopf.
- Klarer, wer dran ist: „👨‍🍳 Deine Frage – tippe die richtige Antwort an“ bzw. „🤖 Frage an den Computer – du schaust nur zu“
  (Antworten dann blass und gestrichelt).

## 2.17.0 – 2026-10-03 – ⏱ Küchenterror: Zeit-Wächter + 3-2-1 Lesezeit (Fund/Wunsch Hansi)
- KC-CLUB-KUECHENTERROR-WAECHTER: Fund „die Zeit läuft nicht gleichmäßig ab, einiges geht schneller“ – Ursache: der Balken war eine
  CSS-Animation, die beim Neuzeichnen, Ruckeln oder kurzem Hintergrund neu startet bzw. springt. Jetzt stellt ein Wächter alle 0,1 s
  Balken und Sekundenanzeige („⏱ 7 s“) aus der festen Endzeit (Uhrzeit) – immer die echte Restzeit; läuft sie ab, löst er genau einmal
  „Zeit abgelaufen“ aus. Geprüft: 10 s-Stufe läuft gleichmäßig ~10 % je Sekunde. Gegen Mitglieder misst zusätzlich der Server.
- Lesezeit: Die Frage erscheint, 3 – 2 – 1 zählt herunter („Lies die Frage …“), erst dann erscheinen die Antworten und die Sekunden
  laufen. Antippen während der Lesezeit zählt nicht. Server: Startzeit der Frage = jetzt + 3 s (KT_LESEN_MS), liefert lesenMs/restMs;
  der Computergegner antwortet ebenfalls erst nach der Lesezeit.

## 2.16.0 – 2026-10-03 – ⏱ Küchenterror-Zeitstufen + 🔊 ganzen Chat vorlesen mit zwei Stimmen (Wunsch Hansi)
- KC-CLUB-KUECHENTERROR-ZEIT: Zeit je Frage nach Stufe – 😊 leicht 20 s, 🙂 mittel 15 s, 😎 schwer 10 s (wie bisher). Gegen den
  Computer über die Stufe (Computer antwortet passend langsamer), gegen Mitglieder wählt der Herausforderer die Zeit (Standard
  mittel), gilt für beide und bleibt bei der Revanche. Zeitbonus rechnet relativ zur Stufe. Server: quiz.stufe, ktLimit();
  laufende Partien ohne Stufe = 10 s.
- KC-CLUB-CHAT-VORLESEN: im Chat ⋮ → „🔊 Vorlesen ab den neuen Nachrichten“ (ab der Linie „Neue Nachrichten“) oder „🔊 Ganzen Chat
  vorlesen“, an jeder Nachricht „🔊 Ab hier alles vorlesen“. Liest der Reihe nach (Name nur beim Sprecherwechsel, „wichtig“,
  Fotos/Sprachnachrichten/Dateien werden genannt), markiert die gerade gelesene Nachricht und scrollt mit. Leiste mit ⏭ (weiter)
  und ⏹ (Stopp); Verlassen des Chats beendet das Vorlesen.
- Zwei Stimmen: Männer mit Männerstimme, Frauen mit Frauenstimme. Wer schreibt, legt selbst fest, wie er klingt (⚙️ „Wenn andere
  meine Nachrichten vorlesen, klinge ich wie …“, Einstellung „vorlesestimme“ am Konto); ohne Angabe nach Vorname geraten.
  Welche Männer-/Frauenstimme das Gerät nimmt, wählt jeder in ⚙️ – Liste mit Güte (⭐⭐ Premium / ⭐ Erweitert / Standard /
  Spaßstimme), gute zuerst, mit Probe; Hinweis, wie man am iPad Premium-Stimmen lädt. Fehlt eine passende Stimme, spricht dieselbe
  Stimme tiefer bzw. höher. Server: Nachrichten tragen vonId, neue Aktion vorlese_stimmen (nur selbst eingestellte Angaben).

## 2.15.0 – 2026-10-03 – 🎖️ Meisterfrage im Küchenterror + ❗ wichtige Hilfe-Aufrufe (Wunsch Hansi)
- KC-CLUB-KUECHENTERROR-MEISTER: 40 schwere Meisterfragen (m: true, ids k151–k190: Saucen-Ableitungen, Garnituren „à la …“,
  Kartoffel-Klassiker, Fleischteile, Fonds, Patisserie). Sie zählen doppelt (richtig = 2 × (100 + Zeitbonus), also bis 400).
  Gegen Mitglieder ist die 12. Frage für beide dieselbe Meisterfrage (Server wählt 11 normale + 1 Meisterfrage), gegen den Computer
  bekommt jeder zum Schluss eine (Computer trifft dort seltener). Goldener Hinweis „🎖️ Meisterfrage – richtig zählt doppelt!“,
  in der Tafel golden hinterlegt, im Rückblick mit 🎖️. Laufende Partien bleiben unverändert. Fragen-Datei ?v=2.
- KC-CLUB-HILFE-WICHTIG: Hilfe-Aufrufe („🙋 Hilfe gesucht“ an der Pinnwand) lassen sich vom Ersteller oder der Clubleitung als
  ❗ wichtig markieren – roter Rahmen, rote Nadel, „❗ WICHTIG · 🙋 HILFE GESUCHT“. Auf Wunsch nochmal Bescheid (Push/Mail) an alle,
  die noch nicht geantwortet haben. Wichtige offene Aufrufe öffnen beim Start die Pinnwand („❗ Es wird dringend Hilfe gesucht.“).
  Server-Aktion hilfe_wichtig; Migration supabase/migrations/20261003_kc_club_v2150_hilfe_wichtig.sql (eingespielt).

## 2.14.0 – 2026-10-03 – 🔪 Küchenterror – das Küchenquiz auf Zeit (Wunsch Hansi)
- KC-CLUB-KUECHENTERROR: viertes Spiel (eigene Kachel). 150 Fragen aus dem professionellen Küchenalltag (Garmethoden, Brigade,
  Saucen, Schnittarten, Fleisch/Fisch, Patisserie, Hygiene/HACCP, Warenkunde, Klassiker) in lib/kuechenterror/fragen.js – je
  4 Antworten, nur eine richtig, dazu eine kurze Erklärung nach der Antwort. Zeitbalken 10 Sekunden (grün → gelb → rot).
  Punkte: richtig = 100 + Zeitbonus bis 100 (je schneller, desto mehr), falsch/zu spät = 0. Wer die meisten Punkte hat, gewinnt.
- Gegen den Computer (nur auf dem Gerät): abwechselnd je eine Frage, 12 Fragen; Stärke leicht/mittel/schwer (Trefferquote und
  Antwortzeit), Spielstand mit Zurücksetzen.
- Gegen Mitglieder: 12 gleiche Fragen in 4 Runden à 3, abwechselnd wie beim Quizduell (x R1 → o R1+R2 → x R2+R3 → o R3+R4 → x R4).
  Der Server wählt/mischt (crypto), merkt die Startzeit jeder Frage (Neuladen setzt sie nicht zurück, 0,8 s Übertragungs-Gnade),
  verrät die Lösung erst nach dem Antworten und wertet selbst. Punkte des Gegenübers erst sichtbar, wenn man dieselbe Frage auch
  hatte. Ende: Tafel je Runde + „Alle Fragen mit Lösung“. Herausfordern, Revanche, Aufgeben, Termin, Rangliste/Pokal wie gehabt;
  in ⚙️ Einstellungen → 🎲 Spiele als viertes Spiel anhakbar.
- Fragen eine Quelle: Server-Kopie supabase/functions/kc-club/kt-fragen.js (tools/kuechenterror/server-kopie.mjs), Vertragstest
  prüft Gleichheit, eindeutige ids und je 3 verschiedene falsche Antworten. Neue Fragen nur hinten anfügen (ids nie ändern).
- Migration supabase/migrations/20261003_kc_club_v2140_kuechenterror.sql (eingespielt): kc_club_spiele.quiz + Prüfregeln.

## 2.13.0 – 2026-10-03 – 📌 Pinnwand: Zettel nachträglich ❗ wichtig machen (Wunsch Hansi)
- KC-CLUB-PINNWAND-WICHTIG-NACHTRAEGLICH: Auf eigenen Zetteln „❗ wichtig machen“ bzw. „❗ nicht mehr wichtig“. Beim Einschalten
  fragt die App, ob die Empfänger, die den Zettel noch nicht abgehakt haben, nochmal Bescheid bekommen (Push/Mail wie beim Anheften,
  über die vorhandene Benachrichtigung „pinnwand“ – jede Person steuert das selbst; Standard-Antwort „Nur markieren“).
  Wichtige offene Zettel öffnen beim Start wie bisher die Pinnwand. Nur der Verfasser darf das; Protokoll „pinnwand_wichtig“.
- Server: neue Aktion pinnwand_wichtig (keine Datenbankänderung, Spalte wichtig gibt es schon).

## 2.12.0 – 2026-10-03 – 🎲 Spiel-Einladung beim App-Start (Wunsch Hansi)
- KC-CLUB-SPIEL-EINLADUNG: Beim Start: „Hey <Vorname>, heute Lust auf eine Partie? Schach gegen den Computer – oder fordere doch ein
  anderes Mitglied heraus. Tic-Tac-Toe oder Bauernskat habe ich auch im Angebot.“ (plus „X Partien warten schon auf dich“, wenn ja).
  Knöpfe: ✅ Ja (öffnet die Spiele-Kacheln) · ⏰ Später (frühestens in 2 Std. wieder, auch bei offener App) · Nein, heute nicht ·
  🚫 Keine Spiele (aus – Einstellung „spiel_einladung“ am Konto, gilt auf allen Geräten, in ⚙️ Einstellungen wieder einschaltbar).
- Höchstens einmal am Tag, nur auf der Startseite ohne Sprung-Link, wartet bis Tagesinfo/Neuigkeiten zu sind (max. 2 Min.),
  nie im Notbetrieb. Daneben tippen = Später.
- Spiele-Kacheln zählen robust, auch wenn die Liste noch nicht geladen ist.

## 2.11.0 – 2026-10-03 – Spiele als Kacheln + Schach mit Küchenbrigade (Wunsch Hansi)
- KC-CLUB-SPIELE-KACHELN: „🎲 Spiele“ zeigt zuerst je Spiel eine große Kachel (Tic-Tac-Toe, Schach, Bauernskat) mit gelber Zahl,
  wenn dort jemand auf dich wartet (du bist dran / neue Herausforderung). Erst in der Kachel: Gegen den Computer / Gegen Mitglieder
  und die Einstellungen. „‹“ führt Partie → Spiel → Übersicht → Startseite. Unter „Gegen Mitglieder“ stehen nur die Partien des
  gewählten Spiels (Rangliste/Pokal unverändert für alle Spiele). Aus Push/Herausforderung öffnet sich direkt das richtige Spiel.
- KC-CLUB-SCHACH-BRIGADE: Schachfiguren als Küchenbrigade – König = Küchenchef 👨‍🍳 (Goldrand), Dame = Kaltmamsell 👩‍🍳,
  Turm = Souschef 🍲, Läufer = Patissier 🎂, Springer = Springer 🔪 (heißt in der Küche so), Bauer = Praktikant 🥄; runde Marken
  hell/dunkel für Weiß/Schwarz, Legende unter dem Brett, Umwandlung „Der Praktikant wird befördert“. Knopf „♟️ Klassische Figuren“
  schaltet um (merkt sich das Gerät). Regeln, Server und Computergegner unverändert.

## 2.10.0 – 2026-10-03 – 🃏 Bauernskat gegen Mitglieder (Wunsch Hansi)
- KC-CLUB-BAUERNSKAT-MG: Bauernskat jetzt auch unter „👥 Gegen Mitglieder“ – herausfordern, annehmen, abwechselnd spielen,
  Revanche (Vorhand wechselt), Aufgeben, Termin vereinbaren, zählt für Rangliste und Pokal des Monats. Einstellungen → 🎲 Spiele:
  Bauernskat als drittes Spiel anhakbar.
- Fair: Der Server mischt und hält alle verdeckten Karten (neue Spalte kc_club_spiele.bsk, verlässt nie den Server; Tabelle hat RLS
  ohne Richtlinien). Die App bekommt nur ihre eigene Sicht (eigene Hand – vor der Ansage nur die ersten 4 –, offene Bauern, Stich,
  gewonnene Stiche). Jede Karte prüft der Server nach denselben Regeln: supabase/functions/kc-club/bauernskat.js ist eine wörtliche
  Kopie aus index.html (tools/bauernskat/server-kopie.mjs, Vertragstest wacht über Gleichheit) – kein zweiter Regel-Kern.
- Voller Stich wird sofort abgerechnet; wer den Stich bekommt, ist gleich wieder dran (dann keine Push-Nachricht). Am Ende: Ansager
  braucht 61 Augen (bei 60:60 gewinnt der Nicht-Ansager). Tischansicht zeigt „Letzter Stich – an …“.
- Migration supabase/migrations/20261003_kc_club_v2100_bauernskat_mitglieder.sql (eingespielt).

## 2.9.3 – 2026-10-03 – Bauernskat-Karten noch näher am Original (Wunsch Hansi)
- KC-CLUB-KARTEN-ECHT: echte französische Kartenbilder (32 SVG + Rückseite) in lib/karten/ – Vorlage Adrian Kennard über
  npm @letele/playing-cards 0.1.0, gemeinfrei (CC0, LICENSE/HERKUNFT.txt beiliegend, kostenfrei). Eckzeichen J/Q auf deutsche
  B/D umgestellt, Pik-Ass ohne QR-Code/Fremdtext. Generator: tools/karten/. Fallback: lädt ein Bild nicht (offline),
  bleibt die gezeichnete Karte aus 2.9.2 sichtbar (onerror). Bilder werden beim Öffnen von Bauernskat vorgeladen.

## 2.9.2 – 2026-10-03 – Bauernskat-Karten wie ein echtes französisches Blatt (Wunsch Hansi)
- KC-CLUB-BAUERNSKAT: Eckzeichen (Wert + Farbe) oben links und unten rechts gedreht, Zahlenkarten 7–10 mit klassisch angeordneten
  Symbolen (untere Hälfte auf dem Kopf), Ass mit großem Mittelsymbol, Bildkarten mit Rahmen und Figur – Köcheclub Edition: Bube als
  Koch 👨‍🍳, Dame 👸, König 🤴. Größen wachsen mit der Karte (Container-Einheiten). Rückseite in Clubfarben mit weißem Rand.

## 2.9.1 – 2026-10-03 – 📅 Termin zu einer Partie vereinbaren (Wunsch Hansi)
- KC-CLUB-SPIEL-TERMIN: An jeder offenen Partie gegen ein Mitglied „📅 Termin vereinbaren“ (Tag, Uhrzeit, Ort, Erinnerung
  etwa 30 Min./1 Std./2 Std. vorher oder nur Vortag, Notiz). Nutzt die vorhandene Terminanfrage (kein Parallel-Kern): steht bei
  beiden im Kalender und im Handy-Kalender-Abo, Vortags-Erinnerung wie bisher, Push/Mail „Terminanfrage von …“ öffnet die Partie.
  Gegenüber sagt direkt an der Partie zu („✅ Passt“) oder ab; Stand sichtbar (⏳/✅/❌), anderer Termin jederzeit vorschlagbar.
- Neu im Wartungslauf (alle 15 Min.): Erinnerung kurz vor Beginn an Absender + Zugesagte („⏰ In 30 Min.: Schach-Partie …“),
  nur wenn zugesagt wurde, nie später als 10 Min. nach Beginn.
- Migration supabase/migrations/20261003_kc_club_v2910_spiel_termin.sql (eingespielt): kc_club_terminanfragen + spiel_id,
  erinnerung_min, kurz_erinnert_am.

## 2.9.0 – 2026-10-03 – 🃏 Bauernskat – Köcheclub Edition gegen den Computer (Wunsch Hansi, Stufe 3)
- KC-CLUB-BAUERNSKAT: dritte Spielwahl im Bereich „🎲 Spiele“. Regeln nach Hansi: 2 Spieler, 32 Karten, je 8 Handkarten +
  4 Bauern (offen auf verdeckt); Vorhand sieht offene Bauern + erste 4 Handkarten und sagt Trumpf an (Farbe oder Grand = nur
  Buben); Buben ♣ ♠ ♥ ♦ höchste Trümpfe, dann A 10 K D 9 8 7; Bedienpflicht, sonst stechen oder abwerfen; gespielter Bauer →
  Karte darunter wird aufgedeckt; Ansager braucht 61 Augen (60 : 60 gewinnt der Gegner). Vorhand wechselt jedes Spiel.
- Gegen den Computer (nur auf dem Gerät): Leicht (oft zufällig) / Mittel (Regeln + Faustregeln) / Schwer (jede Karte mit
  24 zufälligen Verteilungen der unbekannten Karten zu Ende gespielt). Große Karten, ♥ ♦ rot, Trümpfe goldener Rand, spielbare
  Karten weiß mit grünem Rand, andere grau; Stich in der Mitte, Augen beider Seiten, Spielstand + Zurücksetzen, Kurzregeln.
  Laufendes Spiel bleibt nach dem Schließen erhalten. Gegen Mitglieder folgt in der nächsten Version.

## 2.8.0 – 2026-10-03 – ♟️ Schach – Köcheclub Edition (Wunsch Hansi, Stufe 2 der Spiele)
- KC-CLUB-SCHACH: Spielauswahl oben im Bereich „🎲 Spiele“ (❌⭕ Tic-Tac-Toe / ♟️ Schach). Regeln, Schach/Matt/Patt/Remis, Rochade,
  en passant, Umwandlung über chess.js 1.4.0 (BSD-2-Clause, lokal in lib/chess und im Funktionsordner – keine fremden Server,
  keine Kosten). Brett in Clubfarben, Figur antippen → erlaubte Felder leuchten, letzter Zug gelb, König im Schach rot,
  geschlagene Figuren, Zugliste, Umwandlungs-Auswahl (Dame/Turm/Läufer/Springer).
- 🤖 Gegen den Computer (nur auf dem Gerät): Leicht/Mittel/Schwer (Alpha-Beta Tiefe 1/2/3 + ruhige Suche für Schlagzüge,
  Figurenwerte + Lagetabellen, Zeitgrenze 1,5/3 s), Farbe Weiß/Schwarz/Wechselnd, „↶ Zug zurück“, „↺ Neue Partie“,
  Spielstand + Zurücksetzen; laufende Partie bleibt nach dem Schließen erhalten.
- 👥 Gegen Mitglieder: wie Tic-Tac-Toe (Herausfordern mit Spielwahl, Annehmen, Revanche, Aufgeben, Push). Der Server prüft
  jeden Zug mit chess.js (Farbe am Zug, Regeln) und erkennt Matt/Remis. Einstellungen: zu welchen Spielen man sich
  herausfordern lässt (Tic-Tac-Toe / Schach). Rangliste und Pokal des Monats zählen alle Spiele.
- Migration supabase/migrations/20261003_kc_club_v2800_spiele_schach.sql (eingespielt): Prüfregeln für Schach, Spalten
  letzter_zug und verlauf.

## 2.7.1 – 2026-10-03 – 🏆 Pokal des Monats (Wunsch Hansi)
- KC-CLUB-SPIELE-POKAL: In „👥 Gegen Mitglieder“ oben eine Pokal-Karte: Pokalgewinner des Vormonats (meiste Punkte, Gleichstand →
  mehrere) und „<Monat> – wer liegt vorn?“ (Top 5 des laufenden Monats, deutsche Zeit). Darunter die Rangliste aller Zeiten.
  Sieg 2, Unentschieden 1 Punkt; nur Partien gegen Mitglieder. Keine Nachricht an alle (Ankündigung nur nach Rückfrage).

## 2.7.0 – 2026-10-03 – 🎲 Spiele – Köcheclub Edition: Tic-Tac-Toe (Wunsch Hansi)
- KC-CLUB-SPIELE: Neuer Bereich „🎲 Spiele“ (Kachel im Register Club und in der einfachen Ansicht, Sprunglink #spiele/#spiel=…).
  Tic-Tac-Toe 3×3 (drei in einer Reihe) oder 4×4 (vier in einer Reihe), 🍅 Tomate gegen 🥦 Brokkoli, Gewinnreihe golden,
  Siegerbanner, „↺ Neue Runde“ und „Spielstand zurücksetzen“.
- 🤖 Gegen den Computer: nur auf dem Gerät, Stärke leicht/mittel/schwer (3×3 schwer unschlagbar – Alpha-Beta vollständig;
  4×4 begrenzte Tiefe + Bewertung offener Reihen), Beginn Ich/Computer/Wechselnd, Spielstand bleibt auf dem Gerät.
- 👥 Gegen Mitglieder: Herausfordern (Liste nur mit Mitgliedern, die es erlauben; auch auf der Mitgliederseite „🎲 Zu Tic-Tac-Toe
  herausfordern“), Annehmen/Ablehnen, abwechselnd ziehen (Server prüft Reihenfolge, Feld, Stand-Zähler; Sieg/Unentschieden),
  Aufgeben, Revanche (Rollen getauscht), Club-Rangliste (Sieg 2, Unentschieden 1 Punkt). Push „fordert dich heraus“/„Du bist
  dran“ nur, wenn das Gegenüber die App nicht offen hat und keine Ruhezeit ist; offene Partie fragt alle 3 s nach.
- Einstellungen → 🔒 Privatsphäre: „🎲 Andere dürfen mich zu Spielen herausfordern“ (Standard aus, Einstellung „spiele“).
  Höchstens 8 offene Spiele je Person. Kachel-Zahl = Partien, in denen ich dran bin + Herausforderungen an mich.
- Neue Tabelle kc_club_spiele (RLS ohne Policies), Migration supabase/migrations/20261003_kc_club_v2700_spiele.sql (eingespielt).
  Einweisung „Spiele“, Nutzung „🎲 Spiele“. Schach und Bauernskat folgen als eigene Stufen.

## 2.6.2 – 2026-10-03 – Bessere Vorlese-Stimme, Stimme wählbar (Fund Hansi: iPad klingt schrecklich)
- KC-CLUB-STIMME: Bisher nahm die App die erste deutsche Stimme – auf Apple-Geräten oft eine Spaß-/Roboterstimme (Eloquence/
  Novelty). Jetzt eine Stelle (deStimme/sprechAusgabe) für alle Ansagen und das Vorlesen: eigene Wahl je Gerät oder automatisch
  die beste (Premium/Erweitert, bekannte gute Namen wie Anna/Helena/Markus, Spaßstimmen ausgeschlossen).
- ⚙️ → Ansagen, Töne & Tipps: „🗣️ Stimme zum Vorlesen“ mit ▶ Probe und Hinweis, wie man auf iPhone/iPad kostenlos eine
  Premium-Stimme lädt. Auch über die Lupe.

## 2.6.1 – 2026-10-03 – Gesamtprüfung 2 (Stand 2.6.0): Funde behoben
- KC-CLUB-START-BEREIT (Ursache der Meldung „Cannot read properties of null (reading 'person_id')“ bei Hansi nach dem Auto-Update):
  Kacheln waren vor der Anmeldung (init) antippbar, ICH = null. Bereiche außer Start/SOS warten jetzt auf die Anmeldung
  („⏳ Einen Moment …“) und öffnen sich dann von selbst. Auch nach Offline-Start.
- Selbst-Update nur angemeldet, auf der Startseite, ohne Chat/Anruf/Sprunglink; ohne funktionierenden Speicher nie (sonst
  Schleife/Abmeldung); bleibt die Version nach einem Versuch alt → 6 Std. Pause + Fehlerprotokoll „update_misslungen“.
- Notbetrieb: Gegenprobe nur, wenn der Notbetrieb eingerichtet ist (sonst sofort weiter, Zähler zurück); Umschalten nur einmal
  gleichzeitig; Zeitgrenzen für notbetrieb.json/Status; zeitSignal() auch für ältere iPhones (ohne AbortSignal.timeout).
- Einstellungen, deren Speichern noch läuft, werden von einem gleichzeitig ankommenden init nicht überschrieben (EINST_OFFEN).
- Einweisung: Texte an die echte Oberfläche angepasst (Start einfache Ansicht ohne Pfeile, Termine ✅/❓/❌ + To-do, Dokumente
  Pfeil ‹, Lupe unten rechts); nach 3 Tagen ohne „Verstanden“ nicht mehr zeigen (Tipp des Tages wartet sonst ewig); Speichern
  wird abgewartet, Fehler gemeldet und zurückgesetzt; vorhandene Karte wird nicht neu gebaut.
- Vorlesen: eigene Ausgabe, Knopf zeigt „⏹ Aufhören“, 44 px, stoppt beim Bereichswechsel/„Keine Einweisungen mehr“.
- Inkognito: 🕶️ klein vor „Hallo …!“ statt in der vollen Knopfreihe; gilt nur, solange Admin (Entzug → sofort sichtbar,
  Einstellung gelöscht; Ausschalten darf jeder); verrät den Admin nicht mehr über Zustellhaken, Admin-Zentrale anderer Admins,
  „aktiv“; Hilfe-Aufruf „an alle online“ erreicht ihn trotzdem.
- Server: rolle_setzen nur für aktive Mitglieder, Admin-Recht nur bei ausdrücklichem Feld (alte App entzieht nichts),
  Speicherfehler → Abbruch; neuer Link macht alten sofort ungültig (Aufruf stand versehentlich im Kommentar);
  „kein Admin seit 10 Tagen“ nur bei sicherem Stand, nur an aktive Clubleitung; adminAnzahl/Nutzung: unbekannt statt 0;
  Nutzung: höchstens 120 neue Geräte-Kennungen je Tag, Fehler → App schickt später nochmal, Vortag geht nicht verloren.
- Einfache Ansicht: keine Pfeile › auf dem Rand der drei oberen Kacheln (Wunsch Hansi). Begriffe „⚙️ Mehr → Einstellungen“,
  📄 Protokolle in der Nutzung, aria-label für 🌙/↻.

## 2.6.0 – 2026-10-03 – Nutzung: von wie vielen verschiedenen Mitgliedern (ohne Namen, Wunsch Hansi)
- KC-CLUB-NUTZUNG-PERSONEN: Hansi wollte ein Protokoll je Person; abgelehnt (heimliche Einzelüberwachung, DSGVO/Vertrauen).
  Sein Ziel „sehen, welche Funktionen genutzt werden“ jetzt ohne Namen: je Gerät eine zufällige Kennung (in der App erzeugt,
  mit keiner Person verknüpft), je Tag einmal „Bereich genutzt“. Neue Tabelle kc_club_nutzung_geraete (tag, bereich, geraet),
  RLS ohne Policies, Funktion kc_club_nutzung_geraete_zahlen (nur Zahlen), Aufbewahrung 100 Tage (Wartungslauf).
  Migration supabase/migrations/20261003_kc_club_v2600_nutzung_geraete.sql (eingespielt).
- Admin → 📊 Nutzung: je Bereich „👤 n“ verschiedene Mitglieder (Geräte), „👤 1“ hervorgehoben, Gesamtzahl „von N Mitgliedern“,
  Karte „🚫 Nie geöffnet“ (jetzt auch Teilbereiche). Zeitraum wie bisher 7/30/90 Tage.

## 2.5.0 – 2026-10-03 – 🔊 Vorlesen bei Einweisung und Tipp des Tages (Wunsch Hansi)
- KC-CLUB-VORLESEN-HILFE: Knopf „🔊 Vorlesen“ oben rechts in jeder Einweisungs-Karte und im Tipp des Tages. Liest Überschrift
  und Text mit der Sprachausgabe des Handys vor (vorhandene Funktion sprechen(), ohne Emojis/Pfeilzeichen); nochmal tippen =
  aufhören; „Verstanden“/Schließen beendet das Vorlesen. Kein externer Dienst (Zero-Cost).

## 2.4.2 – 2026-10-03 – Programmfehler werden protokolliert und verständlich gezeigt (Fund Hansi)
- KC-CLUB-FEHLER-FANG: Hansi sah nach dem Update auf 2.4.1 die rote Meldung „Cannot read properties of null (reading
  'person_id')“. Server-Protokolle sauber (kein 5xx, keine Fehler-Nr.), Fehlerprotokoll leer – der Fehler wurde in einem catch
  gefangen und nur angezeigt. Nachstellen im Test gelang nicht. Daher: alle 247 Stellen `melde(e.message, true)` → `meldeFehler(e)`.
  JS-Programmfehler (TypeError/ReferenceError) gehen mit Fundstelle (Stapel) als „fehler_gefangen“ ins Fehlerprotokoll; das
  Mitglied sieht „Da hat in der App etwas nicht geklappt – bitte nochmal versuchen. Der Fehler ist gemeldet.“ Fachliche
  Server-Meldungen bleiben wörtlich. Ursache wird mit dem nächsten Protokolleintrag an der Quelle behoben.
- KC-CLUB-INKOGNITO: Rahmen um den Kopfbereich jetzt gelb (#f1c40f) statt schwarz – im dunklen Design war Schwarz nicht zu
  sehen (Hansi). Ameisen beim Einschalten schwarz auf gelb.

## 2.4.1 – 2026-10-03 – Inkognito sichtbar am Kopfbereich (Wunsch Hansi)
- KC-CLUB-INKOGNITO: Solange Inkognito an ist, schwarzer Rahmen (4 px) um den oberen Kopfbereich der Startseite (body.inkognito).
  Beim Einschalten läuft 4 s ein schwarz-gelber Ameisenrahmen (gleiche Animation ameisenLauf wie „Neue Nachr.“), danach bleibt
  der schwarze Rahmen. Nur Admin (inkognitoAn setzt Admin voraus).

## 2.4.0 – 2026-10-03 – Einweisung beim ersten Öffnen eines Bereichs (Wunsch Hansi)
- KC-CLUB-EINWEISUNG: Registry EINWEISUNG (15 Bereiche: Start, Nachrichten, Pinnwand, Termine, Mitglieder, Fotos, Helfen &
  Leihen, Archiv, Dokumente, Einstellungen, Protokolle, Vorschläge, Dienstpläne, Aktionen, Büro nur Clubleitung). Beim ersten
  Öffnen erscheint oben im Bereich eine grüne Karte „🎓 Kurz erklärt“ (kein Fenster, blockiert nichts) mit „👍 Verstanden“
  (für diesen Bereich nie wieder) und „Keine Einweisungen mehr“. Gilt für alle, je Bereich einmal, geräteübergreifend in der
  Server-Einstellung „einweisung“ (geprüft: Bereichs-IDs, Datum, höchstens 40).
- Einstellungen: Schalter „🎓 Einweisung beim ersten Öffnen“ (Standard an) + „Alle Einweisungen nochmal zeigen“; auch über die Lupe.
- Tipp des Tages wartet, bis die Startseite erklärt ist (nicht zwei Hinweise auf einmal).
- Admin-Zentrale → Einzelheiten: wie viele Mitglieder Einweisungen gesehen haben, je Bereich – nur Zahlen, keine Namen.

## 2.3.3 – 2026-10-03 – Kein Fehlalarm-Notbetrieb mehr (Fund Hansi: oranges Band, Server lief einwandfrei)
- KC-CLUB-NOTBETRIEB-GEGENPROBE: Vor dem automatischen Umschalten wartet die App 3 s und fragt den Club-Server einmal direkt
  (ohne Region, 10 s). Antwortet er überhaupt (auch mit 400/401), bleibt sie im Normalbetrieb und setzt den Fehlerzähler zurück.
  Handy offline → kein Notbetrieb (Offline-Warteschlange greift). Gleichzeitige Fehler teilen sich eine Probe.
  Ernstfall-Simulation und Probe schalten unverändert um. Ursache vorher: 2 Aussetzer genügten (schwaches Netz / App aus dem
  Hintergrund geholt, mehrere Anfragen scheitern gleichzeitig). Server-Protokolle 18:00–19:00 ohne einen einzigen 5xx.

## 2.3.2 – 2026-10-03 – Updates automatisch auch beim Start und bei offener App (Wunsch Hansi)
- KC-CLUB-UPDATE-AUTO: Bisher aktualisierte sich die App nur beim Zurückholen aus dem Hintergrund selbst. Jetzt zusätzlich
  4 s nach dem Start und alle 10 Min., solange die App sichtbar auf der Startseite steht (kein Chat offen). Unverändert geschützt:
  nie während Anruf, Sprachaufnahme, Übertragung, offenem Fenster oder Eingabe; höchstens 1× je 10 Min. und Version.

## 2.3.1 – 2026-10-03 – Inkognito-Knopf in der Kopfleiste (Fund Hansi: „Wo ist der Schalter?“)
- KC-CLUB-INKOGNITO: 🕶️-Knopf oben in der Kopfleiste neben 🌙 (nur Admin, auch in der einfachen Ansicht). Aus = blass,
  an = dunkel mit gelbem Ring. Antippen schaltet um. Schalter in Admin-Zentrale und Einstellungen bleiben.

## 2.3.0 – 2026-10-03 – Inkognito-Hauptschalter für den Admin (Wunsch Hansi)
- KC-CLUB-INKOGNITO: Neue Einstellung „inkognito“ (nur Admins, Server lehnt sonst mit 403 ab; jede Änderung wird als
  „inkognito_geaendert“ protokolliert). Ist sie an, sehen andere den Admin nicht online (onlineJetzt), nicht „heute da“,
  nicht „zuletzt da“; keine Online-Ansage und kein Online-Push. Anders als „online verbergen“ NICHT gegenseitig: der Admin
  sieht die anderen weiter. Er erscheint nicht als „verborgen“ (grauer Kreis), damit Inkognito nicht auffällt.
- Schalter: Admin-Zentrale („🕶️ Inkognito einschalten/ausschalten“), Einstellungen → 🔒 Privatsphäre (nur Admin sichtbar),
  Suche in den Einstellungen. Solange an: 🕶️-Marke an der Mitglieder-Kachel.
- Unverändert: Lesebestätigung/„zugestellt“ in Chats und „schreibt …“ beim eigenen Tippen.

## 2.2.0 – 2026-10-03 – Vertretung des Admins vorbereitet (Konzept „Hansi ist der einzige Schlüssel“, AGENTS Regel 12)
- KC-CLUB-VERTRETUNG: Im Fenster „🎖️ Amt & Rechte“ (nur Admin, nicht für sich selbst) neuer Schalter „🛡️ Admin (Vertretung)“ –
  Vergabe nur mit ausdrücklicher Rückfrage; Server protokolliert „admin_recht_geaendert“ (vorher/nachher) und benachrichtigt die
  Person. Vorher fehlte der Schalter in der App (der Server konnte es bereits; ohne Schalter wurde „admin“ nie gesendet).
  Noch kein zweiter Admin bestimmt.
- Admin-Zentrale zeigt „🛡️ Noch keine Admin-Vertretung“, solange es nur einen aktiven Admin gibt (admin_lage liefert „admins“).
- Wartungslauf: War über 10 Tage kein Admin in der App, bekommt die Clubleitung (ohne Admins) höchstens 1× je 7 Tage einen ruhigen
  Hinweis mit Verweis auf Notfall-Umschlag und Betriebsanleitung.
- Dokument „🛡️ Vertretung des Admins“ (dokumente/Vertretung_Admin_V1.pdf, 4 Seiten, nur für Admins in „Meine Dokumente“ sichtbar):
  Betriebsanleitung (häufige Fälle Schritt für Schritt, wöchentlicher Blick) + Notfall-Umschlag zum Ausfüllen von Hand + Protokoll
  beim Öffnen. Enthält absichtlich KEINE Zugangsdaten (AGENTS Regel 15). Werkzeug: tools/vertretung/bau.mjs.
- „Link erzeugt“-Fenster: zwei echte Knöpfe „🟢 Per WhatsApp schicken“ / „📋 Kopieren“ statt „Abbrechen = kopieren“.

## 2.1.2 – 2026-10-03
- KC-CLUB-ANLEITUNG-V3 (Wunsch Hansi „Handbuch neu“): Bedienungsanleitung Version 3 (32 Seiten, Stand App 2.1.1) in
  „Meine Dokumente“ – alle Bilder neu (Demodaten), neue Teile „12. Helfen & Leihen“ (Formular mit „nach Absprache“/„egal wie viele“,
  Kurzansicht mit drei Antworten, eigener Aufruf) und „13. Bedienen, Anmelden & ohne Netz“ (Zurück-Taste, Rückfragen, Verbindung,
  ohne Internet, Einrichtungskarte, Updates); Start in 5 Schritten mit „Mit Code anmelden“; Pinnwand mit Hilfe-Aushang und Emojis;
  Nachrichten ohne Netz; Mitglieder-Kachel → nur Online; einfaches Verbindungs-Lämpchen; Sprachansagen „verlässt die App“ und
  Zusammenfassung ab 4. V1/V2 bleiben unverändert im Repo. Werkzeug: tools/anleitung/fotos3.mjs (neu), fotos.mjs ohne Herz.

## 2.1.1 – 2026-10-03 – Nachprüfung der Versionen 1.88–2.1 (Funde behoben)
- ‹ im Chat: Verlaufseintrag behält seine Tiefe – vorher Schleife Chat ↔ Nachrichten (kritisch).
- Zeitgrenze: Lesen 25 s, Schreiben 140 s (Server speichert erst, benachrichtigt dann) – sonst doppelte Nachrichten bei langsamem
  Communicator. Vorgemerkte Nachricht bei Zeitüberschreitung nicht erneut senden, sondern „bitte prüfen“.
- Kurzcode: je Netz zählen wieder nur Fehlversuche (Einrichten im Club-WLAN blockiert nicht), gesamt jeder Versuch; App sendet
  den Code nicht doppelt (6. Ziffer + Enter).
- Selbst-Update nie während Anruf, Sprachaufnahme oder laufender Übertragung.
- Einfache Verbindungsansicht der Mitglieder wird nicht mehr nach Sekunden durch die Technik-Ansicht ersetzt.
- API_LESEN: anruf_start/standort_start nicht mehr als „Lesen“ (keine stille Wiederholung); fehlende Lese-Aktionen ergänzt.
- Neu laden nach dem Speichern: läuft schon ein Laden, folgt genau ein frisches (sonst kurz alter Stand).
- Link vormerken: gleichzeitige Anfragen beim ersten Öffnen → kein falsches „Link ungültig“; Link wird nur verschickt/angezeigt,
  wenn er wirklich gespeichert ist.
- Escape im Eingabefenster schließt nur dieses; Gefahr-Knopf nimmt das Verb nur aus dem ersten Satz („Neues Feedback starten?“
  heißt nicht mehr „Löschen“).
- Wieder online: Offline-Stand bleibt sichtbar, bis frische Daten da sind (kein leerer Zustand bei wackligem Netz).
- Start: fehlt nur eine einzelne Ungelesen-Zahl, kein Notbetrieb mehr – die Leiste zeigt „?“ bzw. „3+“ statt still 0.

## 2.1.0 – 2026-10-03 – Paket 5 (Gesamtprüfung)
- KC-CLUB-OFFLINE: Nachricht schreiben ohne Netz → wird auf dem Gerät vorgemerkt (Blase „⏳ wartet auf Netz“) und automatisch
  gesendet, sobald wieder Internet da ist (nur wenn das Handy sicher offline war – dann kann nichts doppelt ankommen; nur
  bestehende Chats, ohne Anhänge). Start ohne Netz: der zuletzt geladene eigene Stand wird gezeigt, deutlich markiert
  „📴 Kein Netz – das ist dein Stand von …“ (nie als aktuell, AGENTS Regel 11); nur passend zum eigenen Link auf dem Gerät.
  Kommt das Netz zurück, lädt die App neu und schickt Vorgemerktes.
- KC-CLUB-KOPF-EINFACH: Mitglieder sehen oben nur noch ein Verbindungs-Lämpchen; antippen zeigt „✅ Verbindung in Ordnung“ bzw.
  „⚠️ Störung“ mit Test-Mitteilung und „Problem melden“. Technik-Lämpchen (Communicator, Datenverkehr), Messwerte und das
  Lebenszeichen-Herz nur noch für den Admin.
- KC-CLUB-FENSTER-KERN: eine Regel zum Schließen für alle Fenster (fest im HTML → verstecken, zur Laufzeit gebaut → entfernen,
  Rückfragen → „Abbrechen“); gilt für Handy-Zurück und neu auch für die Escape-Taste (schließt nur das oberste Fenster).

## 2.0.0 – 2026-10-03 – Restpunkte der Gesamtprüfung (Paket 4)
- Server: Versand über den Communicator stürzt bei Ausfall nicht mehr ab (20-s-Grenze, „0 gesendet“ statt Fehler → kein doppeltes
  Senden durch das Mitglied). Alarm „ohne Anmeldung“ an die Admins höchstens 3× je Stunde insgesamt; Links aus fremdem Text entfernt.
  Ungültige End-Zeit und gelöschte Nachricht → klare Meldung statt Absturz. Unerwartete Fehler zeigen eine kurze Fehler-Nr. statt
  interner Texte (Details im Server-Log). Datei-Anlagen: SVG/XML gesperrt, unlesbare Datei = klare Meldung, Speicher-Grenze wie bei Fotos.
  Kilometersatz nach Berliner Datum (1. Januar).
- App-Start: Bleibt der Bildschirm nach 12 s leer, erscheint Hilfe mit „Nochmal versuchen“ und neu „🧹 Speicher der App leeren und
  neu laden“ (Anmeldung bleibt). Service Worker wird als Erstes eingerichtet; jeder Aufbauschritt ist einzeln abgesichert.
  Fehlerprotokoll: dauerhaft abgelehnte Einträge werden nicht endlos neu gesendet.
- Notbetrieb: Nur Lese-Aktionen werden automatisch über den Ersatz-Server wiederholt (Schreiben → klare Meldung, nichts doppelt).
- Datum nach Berliner Zeit statt UTC: Notfallpass im Archiv, Archiv-Freigaben, „einmal am Tag“-Hinweis. Speicherzugriff beim
  Installieren abgesichert.

## 1.99.0 – 2026-10-03
- KC-CLUB-ADMIN-NAME (Wunsch Hansi „Ja zu deinen Vorschlägen“): Ansprechpartner in Texten („bitte … Bescheid geben“, „Korrektur an …“,
  „Problem an …“, Feedback, Sicherheits-Check, Einrichtung, Druck-Karte, „Link verloren?“-Mail) kommt vom Server (Vorname des Admins,
  `init.adminName`, 10 Min. gemerkt; Rückfall „Hansi“). Feste HTML-Stellen tragen <span class="admin-name">, die nach dem Laden gefüllt
  werden. Urheberschaft („Gebaut von Hansi“, Begrüßungsbrief) und Beispiele bleiben. Link-Nachricht ist mit dem Vornamen des
  Absenders unterschrieben.
- KC-CLUB-KACHEL-BALD: Kacheln mit „bald“ (z. B. 🎓 Meine Schulungen) erscheinen erst, wenn es die Funktion gibt; der Überblick
  nennt sie weiter unter „Kommt bald“.
- Manifest: App-Symbol getrennt als „any“ und „maskable“ (Empfehlung von Chrome; gleiches Bild – das Motiv liegt bereits im
  sicheren Bereich, Aussehen unverändert).

## 1.98.0 – 2026-10-03 – Bedienung (Gesamtprüfung, Paket 3)
- KC-CLUB-ZURUECK-KNOPF: Alle ‹-Knöpfe, die direkt eine Ansicht öffneten, gehen jetzt im Verlauf zurück (zurueck()), wenn es eine
  vorige App-Ansicht gibt – vorher legte ‹ einen neuen Eintrag an und die Handy-Zurück-Taste öffnete die verlassene Ansicht
  wieder (Schleife). Mitglied aus dem Chat geöffnet → ‹ führt zurück in den Chat. Verlaufseinträge tragen eine Tiefe.
  Eigene ‹-Logik (Büro, Archiv, Fotoalbum, Gruppe) bleibt unverändert. Alle ‹ haben aria-label „Zurück“.
- KC-CLUB-ZURUECK-FENSTER: Ist ein Fenster oder eine Rückfrage offen, schließt die Handy-Zurück-Taste nur das Fenster
  (Rückfrage = „Abbrechen“, Eingabe = abgebrochen); die Ansicht und angefangene Eingaben bleiben.
- KC-CLUB-RUECKFRAGE-KLAR: Gefährliche Rückfragen haben einen sprechenden roten Knopf („🗑️ Löschen“, „Entfernen“, „Absagen“ …)
  statt „Ja“; der Fokus steht auf „Abbrechen“.
- KC-CLUB-BEGRIFFE: einheitlich „Nachrichten“ (statt „Kommunikation“ in Kachel/Überschrift; Untertitel „Chats, Gruppen & Anlagen“),
  „Zettel“ (statt „Post-it“ in den Pinnwand-Fenstern/Einstellungen), „Club“ (Clubarchiv, Clubordner, Clubleben statt Verein…).
  Interne Namen und Server-Texte (Push-Erkennung) unverändert.
- KC-CLUB-GROSSE-SCHRIFT: Bei „große Schrift“ werden untere Leiste und Kopf nicht mehr abgeschnitten (Leistenschrift fest 10 px,
  Clubname darf umbrechen, «/» ausgeblendet – Wischen und Punkte bleiben).
- KC-CLUB-TIPPFLAECHE: kleine Knöpfe mind. 40 px, Auswahl-Chips mind. 38 px hoch. Unten mehr Platz, damit 🔍 nichts verdeckt.
- KC-CLUB-EINRICHTEN-MINIBROWSER: Einrichtungs-Assistent erkennt Mini-Browser (WhatsApp, Facebook, Instagram, Google-App/Lens)
  und zeigt zuerst „In Safari/Chrome öffnen“; Firefox am PC: Hinweis auf Chrome/Edge. Code-Feld: Platzhalter „6 Ziffern“.
  „Link verloren?“-Mail nennt Safari (iPhone/iPad) bzw. Chrome (Android) statt nur Chrome.
- Bewusst unverändert (Regel 1 / Entscheidung offen): Kachel „Meine Schulungen (bald)“, Name „Hansi“ in Texten, App-Symbol.

## 1.97.0 – 2026-10-03 – Updates & Ausfallsicherheit (Gesamtprüfung, Paket 2)
- KC-CLUB-UPDATE-SICHER: „Jetzt aktualisieren“ wartet, bis die neue Version fertig eingerichtet ist (bis 15 s), schaltet um und lädt
  erst nach der Übernahme ganz neu (vorher oft 400 ms → neue Version blieb „wartend“). Beim Zurückholen der App aktualisiert sie
  sich selbst, wenn es eine neue Version gibt und gerade nichts eingegeben wird (höchstens 1× je 10 Min. und Version).
  Service Worker: Dateien beim Einrichten am Browser-Zwischenspeicher vorbei (cache: reload) – kein Mischstand alt/neu
  (AGENTS Regel 16); Seitenaufrufe immer frisch nachfragen; nichts mit persönlichem Schlüssel (?k=) und keinen Notbetrieb-Schalter
  speichern; Offline-Ersatz „Startseite“ nur noch für Seitenaufrufe (nicht für Bilder/Skripte).
- KC-CLUB-ZEITGRENZE: Server-Anfragen brechen nach 25 s (Hochladen 90 s) ab und zählen als Verbindungsfehler → Meldung statt
  endloser Sanduhr, Notbetrieb kann übernehmen. Nach Region-Störung (502–504) werden nur noch Lese-Aktionen still wiederholt
  (keine doppelt gespeicherten Einträge); Datenverkehrs-LED bleibt dabei nicht mehr hängen.
- KC-CLUB-LADEN-EINMAL: gleichzeitige Neu-Lade-Anstöße (Takt, Zurückholen, Push) teilen sich ein Laden – keine ältere Antwort
  überschreibt eine neuere. Chat: nie zwei Takte; eine verspätete Antwort einer vorher offenen Unterhaltung wird verworfen.
- KC-CLUB-EINMAL-SENDEN: Aufgabe eintragen, Chat-Abstimmung, Kontakt teilen, Erstattung senden, Status speichern, Korrektur melden,
  Chronik anlegen laufen nie doppelt gleichzeitig (Doppeltippen).
- KC-CLUB-UNBEKANNT-NICHT-OK (AGENTS Regel 11): Communicator-Licht grün nur, wenn Push und E-Mail sicher „ok“ sind, sonst grau;
  fehlende Erfolgsquote zählt nicht als 100 %; „nicht eingerichtet“ (404) gilt als nicht erreichbar. Startdaten: klemmt die
  Datenbank, kommt ehrlich „gerade nicht möglich“ statt „0 ungelesen / Alles erledigt“.

## 1.96.0 – 2026-10-03 – Sicherheitspaket (Gesamtprüfung, Paket 1)
- KC-CLUB-KURZCODE-BREMSE: Jeder Code-Versuch wird zuerst eingetragen, dann gezählt (vorher erst nach der Prüfung → viele
  gleichzeitige Anfragen kamen an der Bremse vorbei). Grenzen wie bisher (8 je Netz / 60 gesamt in 15 Min.); läuft die
  Gesamtgrenze über, werden alle offenen Codes ungültig – Erraten unmöglich, neue Codes gehen sofort.
- KC-CLUB-REAKTION-SICHER: Reaktionen nehmen nur noch Emoji-Zeichen an (Server, verankert, höchstens 8 Zeichen); die App setzt
  Reaktionen zusätzlich maskiert ein (esc + JSON) – kein fremder Text/Code über Reaktionen.
- KC-CLUB-ZUGANG-VORMERKEN: „Link verloren?“ sperrt niemanden mehr aus – der neue Link wird 24 h vorgemerkt, der bisherige bleibt
  gültig, bis der neue zum ersten Mal geöffnet wird (Protokoll „zugang_uebernommen“). Ein vom Admin erzeugter Link löscht eine
  Vormerkung. Mail-Text angepasst. Migration 20261003_kc_club_v1960_zugang_vormerken.sql (Rückweg in der Datei).
- KC-CLUB-GRUPPE-PRIVAT: Die Clubleitung darf fremde Gruppen weiter verwalten/auflösen, sich aber nicht selbst hinzufügen
  (sonst rückwirkendes Mitlesen privater Gruppen).
- Geprüft ohne Befund: Spiegel-/Sicherungsfunktionen (kc_db_mirror_snapshot u. a.) sind für anon/authenticated gesperrt.

## 1.95.0 – 2026-10-03
- KC-CLUB-HILFE-KURZ (Wunsch Hansi: „ich sehe immer die Langversion von meinem Aufruf“): Auch der eigene offene Aufruf öffnet
  zuerst die Kurzansicht – Überschrift „Dein Aufruf – so sehen ihn die Mitglieder“, darunter wer zugesagt hat, wie viele nicht
  können und wie viele noch fehlen, Knöpfe „✏️ Ändern“ (öffnet das Formular) und „🔒 Aufruf schließen“. Clubleitung sieht bei
  fremden Aufrufen zusätzlich Stand + kleine Knöpfe „✏️ Ändern (Clubleitung)“ / „🔒 Schließen“. Pinnwand-Aushang öffnet für alle
  die Kurzansicht.
- KC-CLUB-ONLINE-ANSAGE-SAMMELN (Wunsch Hansi): Online-Meldungen, die kurz nacheinander kommen (z. B. beim Start), werden 1,5 s
  gesammelt und als eine Ansage gesprochen; bei mehr als 3 Personen ohne Namen: „5 Clubkameradinnen und Kameraden sind gerade
  online“. Bis 3 Personen weiter mit Namen („Klaus und Steven sind jetzt online“).

## 1.94.0 – 2026-10-03
- KC-CLUB-PINNWAND-EMOJI (Wunsch Hansi: „auf Post-its Emojis einsetzen, z. B. jemand ist krank und man wünscht gute Besserung“):
  Unter dem Zettel-Text eine Schnellreihe 🤒 💐 🍀 💪 ❤️ 🙏 🤗 🎂 🎉 👍 ☀️ 🍲 und „😊 Mehr“ für die volle Auswahl (gleiche Gruppen und
  „Zuletzt“ wie im Chat). Tippen fügt an der Schreibstelle ein; Zeichenzähler läuft mit, ist der Zettel voll, kommt ein Hinweis.
  Umsetzung über den vorhandenen Emoji-Kern (KC-CLUB-EMOJI) mit Zielfeld (EMO_ORTE) – kein zweiter Kern; Chat unverändert.

## 1.93.0 – 2026-10-03
- KC-CLUB-HILFE-KURZ (Wunsch Hansi: „beim Anklicken nicht den kompletten Menüpunkt mit allen Eingabemöglichkeiten, sondern eine
  Zusammenfassung, was gesucht wird – dann: ich kann helfen / dabei kann ich nicht helfen / ich brauche noch mehr Details“):
  Fremde offene Aufrufe zeigen beim Antippen eine Kurzansicht (wer sucht · Wobei · Wann · Wo · Gesucht/Stand · Beschreibung) mit drei
  großen Knöpfen: „✋ Ja, ich kann helfen“, „🙅 Dabei kann ich nicht helfen“, „❓ Ich brauche noch mehr Details“ (öffnet eine
  Nachricht an die suchende Person mit vorbereitetem Anfang). Antworten lassen sich zurücknehmen. Vom Pinnwand-Aushang geht die
  Kurzansicht direkt über der Pinnwand auf (kein Sprung in den ganzen Bereich). Push/E-Mail zu Aufruf und Änderung führen mit
  `#hilfe=<id>` direkt dorthin. Wer den Aufruf gestartet hat (und die Clubleitung) bekommt weiter das Formular zum Ändern.

## 1.92.1 – 2026-10-03
- KC-CLUB-HILFE-AENDERN (Fund Hansi: „ich hab geschlossen, wollte den Vorgang aber nicht schließen“ – tatsächlich wurde nur
  gespeichert, das Formular ging zu und es sah aus wie „weg“): Nach „💾 Änderungen speichern“ geht jetzt der Aufruf selbst auf,
  Meldung „Gespeichert – der Aufruf bleibt offen“; offene Aufrufe zeigen „🟢 offen“ (geschlossene weiter „🔒 geschlossen“).

## 1.92.0 – 2026-10-03
- KC-CLUB-HILFE-AENDERN (Wunsch Hansi: „Hilfe-Kachel antippen → alles öffnet sich, damit ich ändern kann“): Wer einen Aufruf
  gestartet hat (oder die Clubleitung) bekommt beim Antippen der Kachel – auch vom Pinnwand-Aushang („✏️ Ansehen & ändern“) und
  aus dem Büro-Eingang – das ganze Formular mit allen Angaben: Wobei, Wann (Tag/nach Absprache), Anzahl, Ort, Beschreibung; oben
  der Stand der Zusagen; „💾 Änderungen speichern“ und „🔒 Aufruf schließen“. Kein neuer Rundruf; wer schon „Ich komme“ gesagt hat,
  bekommt Bescheid, wenn sich Tag oder Ort ändern. Andere Mitglieder sehen weiter die Einzelheiten mit „Ich komme / Kann nicht“.
  Server: neue Aktion `hilfe_aendern` (Rechte wie Schließen, protokolliert vorher/nachher).
- KC-CLUB-HILFE-OHNE-GRENZE (Wunsch Hansi: „bei Anzahl muss es auch ohne geben, egal wie viele sich melden“): „♾️ Egal wie viele“
  neben der Anzahl – dann keine Obergrenze, Anzeige „✋ 3 dabei“ statt „3 von 2“, der Aufruf wird nie „voll“.
- DB: Migration 20261003_kc_club_v1920_hilfe_ohne_grenze.sql (anzahl darf leer sein; Rückweg in der Datei).

## 1.91.0 – 2026-10-03
- KC-CLUB-ONLINE-SEITE (Wunsch Hansi): Die Kachel „Mitglieder · 🟢 online“ oben im Kopfbereich (ganze Kachel und die grüne
  Zahl) öffnet jetzt immer die Mitglieder-Seite nur mit den Online-Mitgliedern – statt Mitgliederliste mit gemerktem Filter bzw.
  dem kleinen Online-Fenster. Einmalig: Die gemerkte Wahl (👥 Alle / 🟢 Online) für „Mitglieder“ in der unteren Leiste bleibt
  unverändert; „👥 Alle“ auf der Seite schaltet wie gewohnt um. Das Online-Fenster bleibt über Suche und Schnellzugriff „👋 Online“.

## 1.90.0 – 2026-10-03
- KC-CLUB-HILFE-PINNWAND (Wunsch Hansi: „Hilferuf an die Pinnwand hängen, von dort gezielt zum Hilfebereich“): Offene
  Hilfe-Aufrufe hängen als grüner Aushang (grüne Nadel, „🙋 HILFE GESUCHT“, was · wann · ✋ x von y) vorne an der Pinnwand;
  „🙋 Ansehen & zusagen“ öffnet Helfen & Leihen mit genau diesem Aufruf. Zählt nicht zu den 4 eigenen Zetteln. Die Zahl auf der
  Pinnwand-Kachel enthält Aufrufe, auf die man noch nicht geantwortet hat. Beim Start geht – einmal je Aufruf und Gerät – die
  Pinnwand mit dem Hinweis „🙋 Es wird Hilfe gesucht“ auf (wie bei wichtigen Zetteln). Server: `pinnwand` liefert `hilfe`
  (aus dem vorhandenen hilfeListe-Kern, kein zweiter Kern).
- KC-CLUB-HILFE-ABSPRACHE (Wunsch Hansi: „ich suche nicht für heute, sondern nach Terminabsprache“): Beim Hilfe-Aufruf unter
  „Wann?“ jetzt „📅 Bestimmter Tag“ oder „🤝 Nach Absprache“. Nach Absprache: kein Tag/Zeitfenster, Aufruf bleibt 30 Tage offen
  (vorher schließbar); Anzeige, Push, E-Mail, Zusage-Meldung und Büro-Eingang sagen „nach Absprache“. Standard bleibt „Bestimmter Tag“.
- KC-CLUB-HILFE-TEXT (Wunsch Hansi: „Texteingabe für das Gesuch größer“): „Beschreibung“ ist jetzt ein großes Textfeld
  (6 Zeilen), bis 1000 statt 300 Zeichen.
- DB: Migration 20261003_kc_club_v1900_hilfe_absprache.sql (Spalte nach_absprache, Hinweis-Länge 1000; Rückweg in der Datei).

## 1.89.0 – 2026-10-03
- KC-CLUB-NUTZUNG-BEREICHE (Wunsch Hansi „Nutzung-Übersicht anpassen, z. B. Büro fehlt“): Die Statistik „📊 Nutzung – ohne Namen“
  kennt jetzt alle Bereiche: 🗂️ Büro, 🤝 Helfen & Leihen, 📄 Dokument gelesen, 🛡️ Sicherheits-Check, 🆘 SOS, 📆 Kalender-Abo – dazu
  Teilbereiche, eingerückt unter dem Hauptbereich (↳): Büro-Fächer (Eingang, Sitzung, Nach der Sitzung, Einladen, Briefe, Termine,
  Geburtstage, Freud & Leid, Mitgliederliste, Büro-Ordner, Freigaben), Helfen-Reiter (Wer kann helfen?, Ausleihen, Börse),
  📖 Chronik, 📖 Blättern, 📸 eigenes Fotoalbum; Chat/Mitglied/Aktion/Protokoll/Dokument stehen eingerückt unter ihrer Liste.
  Büro-Fächer zählen einmal je Öffnen (nicht bei jedem Neuzeichnen). Weiterhin nur Tag + Bereich + Anzahl, nie wer.
  Server: NUTZUNG_BEREICHE um die neuen Schlüssel erweitert (unbekannte Schlüssel werden weiter verworfen).

## 1.88.0 – 2026-10-03
- KC-CLUB-EINRICHTUNGSKARTE (Wunsch Hansi): Einrichtungskarte zum Ausdrucken (A4) – großer QR-Code mit dem persönlichen Link,
  „Kamera drauf halten → Link antippen → App führt Schritt für Schritt“, darunter die Schritte für iPhone/iPad und Android
  (inkl. Samsung-Browser), Hinweis „persönlich – nicht weitergeben“. Nur Admin: beim Mitglied „🖨️ Einrichtungskarte“, in der
  Mitgliederliste 🖨️ und im Büro-Drucker. Erzeugt dafür einen neuen Link (bei Mitgliedern, die die App schon nutzen, mit
  Rückfrage). Kein Code auf Papier – den zeigt die App nach dem Scannen. QR-Baustein: lib/qrcode (qrcode-generator 1.4.4, MIT,
  liegt in der App, wird nur beim Drucken geladen). QR-Inhalt im Test mit jsQR gegengelesen.
- KC-CLUB-VERLASSEN (Wunsch Hansi): neue Sprachansage „🚪 Jemand verlässt die App“ – z. B. „Hansi hat die Club-App verlassen“,
  mit kurzer Meldung auf dem Bildschirm. Standard aus, unter ⚙️ → Sprachansagen ankreuzbar. Grundlage ist die Online-Liste
  (wer dort fehlt, ist weg – kommt daher etwa 2–3 Minuten nach dem Schließen); höchstens 3 Namen auf einmal, nicht in der Ruhezeit.

## 1.87.0 – 2026-10-03
- KC-CLUB-KURZCODE (Wunsch Hansi: „Installation einfacher – der lange Code schreckt ab“): Anmelden mit einem 6-stelligen Code
  statt Link kopieren/einfügen. Der Anmeldebildschirm zeigt oben „🔢 Mit Code anmelden“ (großes Zahlenfeld, meldet bei 6 Ziffern
  sofort an). Den Code zeigt ein bereits angemeldetes Gerät: im Einrichtungs-Assistenten (iPhone/iPad, Schritt 4) oder unter
  ⚙️ → App-Installation → „🔢 Code für ein anderes Gerät“. Gültig 15 Minuten, nur einmal, je Person nur ein Code; der Schlüssel liegt
  bis dahin AES-GCM-verschlüsselt (Server-Geheimnis) und wird beim Einlösen gelöscht; Bremse: 8 Fehlversuche je Netz bzw. 60
  insgesamt je 15 Min.; Code eines älteren Links wird abgelehnt. DB: Tabelle kc_club_kurzcodes (Migration v1870, nur Server).
- KC-CLUB-EINRICHTEN: Einrichtungs-Assistent erkennt Gerät und Browser (iPhone, iPad, Safari/Chrome, Android Chrome, Samsung
  Internet, PC) und zeigt nur die passenden Schritte – mit kleinem Bild der Browserleiste/des Menüs, der gesuchte Punkt rot
  markiert, beide üblichen Namen („Zum Home-Bildschirm“/„Zum Startbildschirm“, „App installieren“/„Zum Startbildschirm
  hinzufügen“). Android mit Installations-Angebot: oben „📲 Jetzt installieren – ein Tipp genügt“. Öffnet sich auf Handy/Tablet
  im Browser einmal von selbst; danach über „Heute wichtig“ und ⚙️ → App-Installation („🧭 Schritt für Schritt einrichten“).
- Vertragstest 64 (Startreihenfolge) um den Assistenten ergänzt.

## 1.86.0 – 2026-10-03
- KC-CLUB-ORDNER-EINLEITUNG (Wunsch Hansi: Einleitung für die Clubchronik): Vereinsordner können eine Einleitung haben (erste Zeile
  = Überschrift, Absätze mit Leerzeile; Clubleitung pflegt sie unter „✏️ Ordner“). Sie steht oben im Ordner („📜 Wie alles begann“)
  und beim Blättern als erste Seite nach dem Deckblatt. DB: Spalte `kc_club_archiv_ordner.einleitung` (Migration v1860, nur Ergänzung).
- Daten (Wunsch Hansi): Clubchronik – Gründungsjahr 1991 (vorher 1995), Einleitung „Wie alles begann“ (Mai 1991 erstes Treffen in
  der Gaststätte Ickorn, 1995 erstmals auf dem Weihnachtsmarkt; Grundlage: Text der Club-Website). Vorher-Stand im App-Protokoll.

## 1.85.0 – 2026-10-03
- KC-CLUB-ZOOM-OEFFNEN (Wunsch Hansi „Button antippen – etwas zoomen, dann öffnen“): Kacheln auf der Startseite, Mini-Kacheln,
  Büro-Ordner, Schreibtisch-Gegenstände, die Felder im Kopf und Archiv-Ordner zoomen beim Antippen kurz (180 ms) und öffnen dann.
  Nicht beim Anordnen/Ziehen von Kacheln und nicht, wenn ein Knopf innerhalb einer Kachel getippt wird.

## 1.84.0 – 2026-10-03
- KC-CLUB-PROTOKOLL-NAECHSTER-TERMIN (Wunsch Hansi): Das digitale Protokoll hat unten das Feld „📅 Nächster Termin“ (freier
  Text, max. 200 Zeichen). Beim Schreiben schlägt die App die nächste geplante Sitzung nach dem Protokolldatum vor
  („📅 Übernehmen: …“). Erscheint in der Protokoll-Ansicht, im Ausdruck/PDF (vor den Unterschriften) und in der Archiv-Textfassung.
- DB: Spalte `kc_club_sitzungsprotokolle.naechster_termin` (Migration 20261003_kc_club_v1840, nur Ergänzung; Rückweg im Kopf).

## 1.83.0 – 2026-10-03
- KC-CLUB-BUERO-KOPF (Wunsch Hansi, kein Platz verschenken): Begrüßung („🌤️ Guten Tag, Hansi!“) steht oben in der Kopfzeile
  neben „🗂️ Büro“; „📋 Übersicht“ und „☰ Liste“ (bzw. „🗄️ Büro-Raum“) stehen nebeneinander in einer Reihe.
- Regal: alle Ordner gleich hoch und breit (die absichtlich unterschiedlichen Höhen entfallen) – ordentlicher.
- Vertragstest 157 (Knopf „Übersicht“ im Büro) an die Knopfreihe angepasst.

## 1.82.0 – 2026-10-03
- KC-CLUB-VORLAGE-KOPF (Wunsch Hansi): Protokoll-Vorlage zum Mitschreiben (Büro → Drucken → Sitzungs-Vorlage) mit kompaktem Kopf:
  „Protokollführer: ____“ und „Ort:“ (vorbelegt, sonst Strich) nebeneinander; „Entschuldigt bzw. fehlend:“ (Absagen vorbelegt +
  Strich zum Ergänzen); „Gäste:“ als Strich. Unten „Nächster Termin:“ – vorbelegt, wenn schon eine weitere Sitzung geplant ist,
  sonst Datum/Uhrzeit/Ort zum Eintragen. Abstände leicht gekürzt, die Vorlage bleibt auf einer Seite.

## 1.81.0 – 2026-10-03
- KC-CLUB-ANLEITUNG Version 2 (Wunsch Hansi: „Handbuch überarbeiten, weil sich einiges geändert hat“): 27 Seiten,
  `dokumente/Koecheclub-App_Anleitung_V2.pdf`. Neu bzw. geändert (mit NEU markiert): Register Club/Meins/Technik mit
  Ameisenlauf, Mikrofon (Sprachnachricht oder Diktieren), Tippfehler rot unterstrichen, Emoji-Auswahl, Sprachansagen (mit
  „Wann spricht das Handy?“), Mikrofon-Einstellung, weitere und ausgefallene Farbschemen, Meine Dokumente in der App,
  neuer Teil 10 „Fotos & Alben“ und Teil 11 „Archiv & Chronik“ (Mein Ordner, Clubchronik, Blättern). Alle Bilder neu
  (Demodaten). V1-Datei bleibt unverändert; „Meine Dokumente“ zeigt jetzt V2 (neue id → einmal die leise NEU-Zeile).
- Werkzeug: `tools/anleitung/fotos2.mjs` (Bilder der neuen Funktionen), `inhalt.mjs` auf V2; README ergänzt.

## 1.80.0 – 2026-10-03
- KC-CLUB-REGISTER-AMEISEN überarbeitet (Fund Hansi: „sitzt nicht genau auf dem Rand, läuft nicht; heller Rahmen soll bleiben“):
  Rahmen jetzt als SVG-Rechteck genau auf der Knopfkante (gleiche runde Ecken, gemessen), gleiche Technik und Animation wie der
  gelbe Ameisenlauf bei „Neue Nachr.“. Beim Wechsel läuft er 1,6 s – auch bei „Bewegung reduzieren“ (vorher dort still, daher
  „läuft nicht“) –, danach bleibt er als ruhiger heller Rahmen im Ton des eigenen Designs stehen. Vertragstest 259 an die neuen
  Klassennamen angepasst.

## 1.79.0 – 2026-10-03
- KC-CLUB-REGISTER-AMEISEN (Wunsch Hansi): Beim Wechsel des Registers (Club/Meins/Technik) läuft auf dem neu gewählten Knopf
  kurz (1,6 s) ein „Ameisenlauf“ – gestrichelter, wandernder Rahmen in einem helleren Ton des eigenen Farbdesigns. Bei
  „Bewegung reduzieren“ steht der Rahmen still. Der gelbe gestrichelte Rahmen bei „Neue Nachr.“ bleibt unverändert.
- Tipp „neue Farbschemen“ angepasst: zählt jetzt alle neuen Schemen (14) und nennt ruhige und ausgefallene getrennt;
  „Jetzt einstellen“ öffnet beide Klappzonen.

## 1.78.0 – 2026-10-03
- KC-CLUB-DESIGN-BUNT (Wunsch Hansi „etwas ausgefallenere Schemata“): 6 Farbschemen mit Farbverlauf oben (wie Disko/Regenbogen):
  Sonnenuntergang, Polarlicht, Kirschblüte, Tiefsee, Glut, Retro 70er – je Tag und Nacht, Kontrast geprüft. Eigene Klappzone
  „✨ Ausgefallene Farbschemen (6)“ unter ⚙️ → Darstellung (und in der einfachen Ansicht unter „Lieblingsfarbe“).

## 1.77.0 – 2026-10-03
- Tipp des Tages „Farbschemen“ für alle (Wunsch Hansi): „🎨 Hallo Klaus, hast du schon unsere 8 neuen Farbschemen entdeckt?“
  – persönlich mit Vornamen, steht ganz vorne (kommt als nächster Tipp). Knöpfe: „🎨 Jetzt einstellen“ (öffnet ⚙️ und die
  Klappzone „Weitere Farbschemen“), „⏰ Später“, „🙈 Nicht mehr anzeigen“. Nicht für Mitglieder, die schon ein neues Schema nutzen.
- Tipp-Titel dürfen jetzt persönlich sein (Funktion statt fester Text); Titel werden dabei sicher dargestellt.
- Einfache Ansicht: unter „🎨 Lieblingsfarbe“ ebenfalls die Klappzone „Weitere Farbschemen“.

## 1.76.0 – 2026-10-03
- KC-CLUB-DESIGN-MEHR (Wunsch Hansi): 8 weitere Farbschemen – Toskana, Weinberg, Salbei, Lavendel, Ocker, Schokolade, Petrol,
  Rosé (je Tag und Nacht, Kontrast geprüft: Schrift ≥ 7:1, weiße Schrift auf Knöpfen ≥ 4,5:1). Sie stehen unter ⚙️ →
  Darstellung in einer eigenen Klappzone „🎨 Weitere Farbschemen (8)“, damit die Auswahl übersichtlich bleibt; ist eines gewählt,
  steht die Zone offen.
- Tipps des Tages geprüft (Wunsch Hansi): „Sprachansage“ beschreibt jetzt „⚙️ → 🗣️ Sprachansagen“ mit ▶ Beispiel;
  „Kalender“ beschreibt den Handy-Kalender statt Google/Outlook. Neu: Diktieren, eigene Fotoalben, Clubchronik zum Blättern,
  Helfen/Leihen/Börse. Die übrigen Tipps stimmen mit der App überein.

## 1.75.1 – 2026-10-03
- Tipp des Tages „Emojis“ (Fund Hansi): Text sagte „neben dem Schreibfeld“ – die Knöpfe sitzen inzwischen unter dem Schreibfeld.
  Jetzt: „Im Chat unter dem Schreibfeld auf 😊 tippen – darüber öffnet sich die bunte Emoji-Auswahl.“

## 1.75.0 – 2026-10-03
- Sprachansagen (Fund Hansi: „Steven eingeloggt, keine Ansage, obwohl eingeschaltet“): Die Online-Ansage („Steven ist jetzt
  online“) hatte einen eigenen Schalter und fehlte in der neuen Liste „🗣️ Sprachansagen“. Jetzt steht sie dort als erste Zeile
  „🟢 Jemand kommt online“ (mit ▶ Beispiel) – gespeichert weiter im bisherigen Schalter, nichts geht verloren. Die alte
  Einzelzeile ist ausgeblendet (ein Ort statt zwei); der Tipp des Tages führt zur Zeile „Sprachansagen“ (Vertragstest angepasst).

## 1.74.0 – 2026-10-03
- KC-CLUB-BUERO-ZETTEL (Wunsch Hansi): auf dem Schreibtisch zwei Zettel nebeneinander mit Pinnnadel – gelb „Nächster Schritt“
  (rote Nadel) und hellblau „Eingang – n Sachen warten auf dich“ (blaue Nadel; ohne Clubleitung: „Nächster Termin“).
- KC-CLUB-BUERO-EINGANGSLISTE (Fund Hansi: Korb zeigte 5, führte aber nur zu den Ordnern): Der Eingang ist jetzt eine Liste
  aller wartenden Sachen (Ausleihen, Abholungen, Vorschläge, Hilfe-Aufrufe, Archiv-Einreichungen, Protokoll-Entwürfe, offene
  Aufgaben). Zeile antippen → „✏️ Öffnen & bearbeiten“, Schnellknöpfe (Archiv: „In den Ordner legen“/„Ablehnen“, Aufgabe:
  „Erledigt“), „Zum Ordner …“ oder „📥 Zurück in den Eingang“. Nutzt die vorhandenen Listen und Info-Fenster.
- Server: „Archiv: zu prüfen“ zählt nur noch Einreichungen in Vereinsordnern – in persönlichen Ordnern entscheidet allein der
  Besitzer (vorher zählten z. B. Stevens 2 Dokumente mit, obwohl die Clubleitung sie nicht annehmen kann).

## 1.73.0 – 2026-10-03
- KC-CLUB-FEEDBACK (Wunsch Hansi: an die vielen neuen Funktionen anpassen, nicht zu viel fragen): neuer Bogen „2026-2“.
  Schritt 1 nur noch 6 Fragen (vorher 10): Gefallen, „Findest du dich gut zurecht?“ (bei „Geht so/zu viel“ freiwillig warum,
  mit Tipp „Einfache Ansicht“), Tempo, meistgenutzt (jetzt mit Fotos & Alben, Archiv & Chronik, Helfen/Leihen/Börse,
  Dienstwünsche), Probleme (+ „Zu viele Funktionen“), dauerhaft einsetzen (Begründung bei Nein bleibt Pflicht).
  Schrift, Farben, Nutzungshäufigkeit entfallen (Schrift/Farben stellt jeder selbst ein, Nutzung sieht der Server).
- Wünsche abgeglichen: Gebautes (Dokumente/Archiv, Sprache, Fotoalben, Geburtstage, Schulung, Fahrgemeinschaften, Aufgaben)
  wandert nach „✅ Schon umgesetzt“ (jetzt 22 Punkte, zum Aufklappen); offen bleiben/neu: Rezepte, Mitbringliste, Beiträge/Kasse,
  Dienste tauschen, automatische Diashow, ohne Internet lesen, Club-Rundbrief, Meine Dienste & Teilnahmen.
- Vertragstest 30: Beispiel-Wunsch „Geburtstagsliste“ (jetzt umgesetzt) durch „Rezepte-Sammlung“ ersetzt – Prüflogik unverändert.

## 1.72.0 – 2026-10-03
- Register auf der Startseite (Wunsch Hansi): „Verein“ heißt jetzt „Club“, „Programme“ heißt „Technik“ (dort liegen Update,
  freigegebene Programme und Sicherheits-Check); auch im Überblick („🏠 Im Club“, „🛠️ Technik“). Interne IDs bleiben – eigene
  Register-Reihenfolge und Kachel-Anordnung bleiben erhalten.
- Blätter-Pfeile ans Farbkonzept angepasst (Wunsch Hansi: „zu krass in Weinrot“): Info-Feld oben jetzt Glas-Knöpfe, die jedem
  Farbdesign folgen (vorher festes Weinrot); Blättern in Ordnern/Chronik runde helle Knöpfe mit grauem Pfeil statt dunkler Balken.

## 1.71.0 – 2026-10-03
- KC-CLUB-SPRACHANSAGEN (Wunsch Hansi): Das Handy sagt an, was mich betrifft – z. B. „Christina hat dir eine Nachricht
  geschickt“, „Klaus klopft gerade bei dir an“, „Christina hat ein Post-it an die Pinnwand gehängt“, „Klaus hat auf deine
  Hilfeanfrage reagiert und kommt“, „Klaus fährt bei dir mit“, „Christina teilt den Standort mit dir. Christina ist noch etwa
  12 Kilometer entfernt, Luftlinie.“ (danach Ansage beim Näherkommen: 10/5/2/1 km, „ist gleich da“).
- Übersichtlich: unter ⚙️ → „Ansagen, Töne & Tipps“ nur eine Zeile „🗣️ Sprachansagen – Auswählen“; im Fenster 7 Bereiche zum
  Ankreuzen, je mit ▶ zum Probehören. Standard (je Gerät): Nachrichten + Anklopfen.
- Quelle ist der normale Push (Service Worker gibt Titel/Text/Link an die offene App); Anklopfen kommt direkt aus der App.
  Nur bei offener App (Web-Apps dürfen geschlossen nicht sprechen), nie in der Ruhezeit, nicht für den gerade offenen Chat,
  derselbe Satz nicht doppelt, ab 3 Meldungen auf einmal eine Sammelansage. Entfernung: eigener Standort bleibt auf dem Gerät.

## 1.70.0 – 2026-10-03
- KC-CLUB-RECHTSCHREIBUNG (Wunsch Hansi: Fehler im Chat rot unterstreichen): Die App schaltet die Rechtschreibhilfe des
  Handys/Browsers in allen Schreibfeldern ausdrücklich ein (spellcheck, Deutsch, Satzanfang groß; nicht bei E-Mail, Telefon,
  Zahlen, Passwort, Suche). Kostenlos, kein Fremddienst – der Text verlässt das Gerät nicht.
- ⚙️ → „Ansagen, Töne & Tipps“ → „🖍️ Tippfehler rot unterstreichen“ → Prüfen: Testsatz mit zwei Fehlern und – passend zum
  erkannten Gerät (Android/Samsung/iPhone/PC) – die Anleitung, falls die Tastatur-Rechtschreibprüfung aus ist. Neuer Tipp des Tages.

## 1.69.3 – 2026-10-03
- Dienstwunsch-Bestätigung (Wortlaut Hansi): „Vielen Dank für die Übermittlung deiner Dienstzeiten für den Weihnachtsmarkt Werne 2026.
  Bitte beachte, dass es sich um deine Wünsche handelt – eine Abstimmung mit allen Clubmitgliedern erfolgt noch.“ – in App-Nachricht/
  E-Mail, auf der A4-Aufstellung (umrandet oben) und in der Archiv-Datei; eine Stelle (DW_HINWEIS) für alle drei.

## 1.69.2 – 2026-10-03
- KC-CLUB-EINGABEN-ARCHIV (Wunsch Hansi: Stevens Unterlagen in seinen Ordner, passendes Register): Aufstellungen (Erstattungsantrag →
  Register „Rechnungen“, Dienstwünsche → Register „Dienstplan“, wird bei Bedarf vor „Sonstiges“ ergänzt) als Textdatei in den
  persönlichen Archiv-Ordner. Legt jemand anderes ab (Clubleitung über den Postausgang, Art „archiv_ablage“), landen die Dokumente
  „zur Prüfung“ – der Besitzer bekommt Bescheid und nimmt an oder lehnt ab (persönliche Ordner bleiben seine Sache). Selbst
  abgelegt: nach „✅ Fertig – Bestätigung“ fragt die App „Auch in deinen Archiv-Ordner legen?“ (Server: eingaben_ablegen).

## 1.69.1 – 2026-10-03
- KC-CLUB-POSTAUSGANG (Wunsch Hansi: Steven die Bestätigung nachträglich schicken): Tabelle kc_club_postausgang – der Wartungslauf
  (alle 15 Min.) verschickt offene Einträge über den normalen Versandweg (App-Nachricht + E-Mail) und hält Veranlasser und Ergebnis
  fest (Audit). Erste Art: erstattung_bestaetigung (nur an den Antragsteller des Antrags).
- Erstattungs-Bestätigung: ein gemeinsamer Text (beim Senden und aus dem Postausgang) – jetzt immer mit dem Hinweis
  „Unter Vorbehalt: Dein Antrag wird vom Kassenwart geprüft – die Erstattung erfolgt nach Freigabe.“

## 1.69.0 – 2026-10-03
- KC-CLUB-BESTAETIGUNG (Wunsch Hansi, Fall Steven): Aufstellung der eigenen Eingaben als Bestätigung – **App-Nachricht + E-Mail**.
  Dienstwünsche: neuer Knopf „✅ Fertig – Bestätigung“ oben im Dienstwunsch-Fenster (kein Versand bei jedem Zwischenspeichern;
  höchstens 1× je 2 Min.). Die Mail enthält die Aufstellung je Tag (Kann / Am liebsten / Wenn nötig / Kann nicht / Bereitschaft –
  Bereitschaft aus Tagesübersicht ODER Tageswunsch). Erstattung: der Antragsteller bekommt beim Senden zusätzlich eine
  App-Nachricht (die Mail kam schon als BCC). Link „#bestaetigung=…“ öffnet die Aufstellung als A4-Blatt (Dienstwünsche im
  Querformat, Erstattung wie der vorhandene Antrags-Ausdruck) – ansehen, drucken, als PDF speichern. Server: meine_eingaben,
  eingaben_bestaetigen; Versand über den KC Communicator (club_nachricht_beide / club_nachricht_push).

## 1.68.0 – 2026-10-03
- KC-CLUB-DIKTAT (Wunsch Hansi): Das 🎤 im Chat fragt „🎤 Sprachnachricht“ (wie bisher, Ton) oder „✍️ Diktieren“ – das Handy
  schreibt live ins Schreibfeld mit; „📤 Senden“ schickt es als normale Textnachricht, „✅ Fertig – noch prüfen“ lässt es zum
  Korrigieren stehen, „✕ Verwerfen“ stellt den alten Text wieder her. Gesagte Satzzeichen („Punkt“, „Komma“, „Fragezeichen“,
  „Ausrufezeichen“, „Doppelpunkt“, „neue Zeile“) werden ersetzt, Satzanfang groß. Nach Sprechpausen hört es weiter zu (bis 5 Min.).
  „Immer so“ merkt die Wahl; ändern unter ⚙️ → „Ansagen, Töne & Tipps“ → „🎤 Mikrofon im Chat“. Ohne Spracherkennung auf dem
  Gerät: wie bisher direkt die Sprachnachricht. Erkennung durch das Handy (kostenlos; nur solange das Fenster offen ist).

## 1.67.0 – 2026-10-03
- KC-CLUB-LIVE-VORSCHAU (Wunsch Hansi „immer eine Vorschau, damit man sieht, wie die Vorlage aussieht“): Beim Bearbeiten steht
  unten ein kleines A4-Blatt „👁️ So sieht es aus“, das sich bei jeder Änderung selbst erneuert – in „Sitzung vorbereiten“
  (Anwesende, Anmerkung, Tagesordnung, Schreiblinien), im Briefbogen (jedes Feld) und in der Mitgliederliste (Art, Sortierung,
  Überschrift; ersetzt dort die bisherige Tabellen-Vorschau). Gebaut mit dem vorhandenen Druck-Kern – genau so, wie gedruckt
  wird. Antippen oder „🔍 Groß ansehen“ öffnet die große Vorschau mit 🖨️ Drucken. Registry LV_ARTEN für weitere Bereiche.

## 1.66.0 – 2026-10-03
- Büro-Schreibtisch (Wunsch Hansi): neu **📨 Nachricht & Mail** (App, E-Mail, WhatsApp) – Person suchen → „💬 Nachricht in der App“,
  „✉️ E-Mail“ (wenn freigegeben, öffnet das Mailprogramm) oder „🟢 WhatsApp“ (vorhandener WhatsApp-Weg); oben „👥 An mehrere oder
  eine Gruppe“ (vorhandenes „Mitglieder kontaktieren“). Telefon und Nachricht nutzen dieselbe Personenwahl.
- KC-CLUB-BUERO-SPRACHE: **🎙️ Sprachsteuerung** im Büro – Mikrofon „Sag mir, was du brauchst“: „Öffne Ordner Protokolle“,
  „Chronik“, „Anrufen Erika“, „Nachricht an Klaus“, „Eingang“, „Drucken“, „Schreiben“, „Übersicht“, „Zurück“. Befehle aus den
  Registries (Regal + Schreibtisch), Rechte wie beim Antippen. Sprache öffnet nur – verschickt oder wählt nie von selbst.
  Erkennung durch das Handy (Web Speech API, kostenlos; nur solange das Mikrofon-Fenster offen ist). Ohne Unterstützung kein Knopf.

## 1.65.0 – 2026-10-03
- KC-CLUB-BUERO-RAUM (Wunsch Hansi): Das Büro als Raum – oben ein **Regal** mit schmalen Ordnern (quer beschriftet, dezente
  Farben, leicht unterschiedliche Höhen; antippen zieht den Ordner heraus): Sitzung, Nachbereitung, Protokolle, Geburtstage,
  Freud & Leid, Mitglieder(liste), Termine, Briefe, Erstattung, Chronik, Archiv, Freigaben – je nach Recht (Registry BU_REGAL).
  Zahlen am Rücken (offene Fälle, Glückwünsche). Unten der **Schreibtisch**: 📥 Ablagekorb (Eingang mit Zahl), ✒️ Füller
  („Was möchtest du schreiben?“ – Brief, Einladung, Protokoll, Nachricht, Glückwunsch, Pinnwand), ☎️ Telefon (Person suchen →
  freigegebene Nummer → das Handy wählt wirklich; ohne Nummer „💬 Nachricht“), 📅 Tischkalender mit dem nächsten Datum,
  🖨️ Drucker (Vorlage, Mitgliederliste, Termine, Geburtstage, Briefbogen), 🎂 Glückwunschkarte (nur wenn bald jemand feiert),
  gelber Zettel „Nächster Schritt“. Leserechte: Füller mit Hinweis „nur lesen“.
- Ein Ordner „aufgeschlagen“ zeigt genau den Bereich der bisherigen Büro-Liste (keine zweite Oberfläche). „☰ Liste“ /
  „🗄️ Büro-Raum“ schaltet um (je Gerät gemerkt). Neu im Archiv: arStartArt() öffnet direkt einen Ordner einer Art (Chronik).

## 1.64.2 – 2026-10-03
- KC-CLUB-ARCHIV-AUSBLENDEN (Wunsch Hansi „Löschen muss in allen Ordnern möglich sein“ – zwei Bildschirmfotos standen unter
  „🤖 Vereinsleben → Anhänge“ ohne Löschknopf): jede Zeile im Vereinsleben hat jetzt 🗑️. Standard: nur für mich entfernen –
  Termine, Protokolle, Abstimmungen usw. bleiben in ihrem Bereich unangetastet. Eigene Chat-Anlage: wahlweise „Nur hier im
  Archiv“ oder „Auch im Chat löschen“ (vorhandenes nachricht_loeschen mit Sicherung). Zurückholen: Archiv → 🗑️ Papierkorb →
  „🤖 Aus dem Vereinsleben entfernt“ → ♻️. Gespeichert je Person (Einstellung archiv_ausgeblendet), Server-Aktion archiv_ausblenden.

## 1.64.1 – 2026-10-03
- Fund Hansi „Blättern wird im Clubordner nicht angezeigt“: „📖 Blättern“ jetzt auch in „🤖 Vereinsleben“ – jeder Eintrag
  (Termin, Protokoll, Abstimmung, Aktion …) wird eine Karten-Seite mit Symbol, Titel, Datum und Text; Lesezeichen je Bereich.

## 1.64.0 – 2026-10-03
- KC-CLUB-CHRONIK (Vorschlag + Freigabe Hansi): Clubchronik im Vereinsarchiv – ein Ordner für alle Jahre (Rücken: Gründungsjahr),
  steht über allen Jahren. Anlegen mit „📖 Chronik anlegen“ (fragt das Gründungsjahr). Register: Gründung, Presse, Rekorde &
  Höhepunkte, Feste & Jubiläen, Mitglieder im Wandel, In Gedenken, Ehrungen & Urkunden, Sonstiges. Einträge als Zeitleiste
  (Datum des Ereignisses, alt → neu) mit kurzer Beschreibung („Was sieht man? Wer, was, wo“). Anleitung „📌 So füllen wir
  unsere Chronik“ oben im Ordner (Datenschutz: In Gedenken nur mit Einverständnis der Familie, Ausgeschiedene ohne Gründe).
- Einreichen mit Prüfung: Vereinsordner können „📥 Alle dürfen einreichen“ (Chronik: an). Mitglieder legen Beiträge hinein, alle
  sehen sie erst nach „✔ Annehmen“ durch Clubsprecher/Admin (die bekommen Bescheid; der Einreicher auch nach der Entscheidung).
  Einreicher kann zurückziehen. Fremde Einreichungen sind auch per Link nicht abrufbar.
- KC-CLUB-BLAETTERN (Wunsch Hansi „wie Einkaufsprospekte“): „📖 Blättern“ in jedem Ordner (Verein, persönlich, geteilt) und in
  jedem Fotoalbum – Vollbild, Umblätter-Effekt, Wischen oder ‹ ›, quer auf dem Tablet zwei Seiten wie ein Buch, Lesezeichen je
  Register, Regler zum Springen, Antippen vergrößert. Fotos/Scans direkt, PDFs Seite für Seite (pdf.js lokal), Word/Excel als
  Karte „📄 Öffnen“. Chronik beginnt mit Deckblatt und Anleitung. Zurück-Taste schließt das Blättern. Server: archiv_blaettern
  (alle Links eines Ordners in einem Aufruf). PDF-Seite→Bild ist ein gemeinsamer Helfer (Dokument-Anzeige + Blättern).
- KC-CLUB-ONLINE-ANSAGE-PUSH (Fund Hansi: „Steven hat sich angemeldet, aber keine Ansage“): Der Admin-Push „🟢 X ist jetzt
  online“ entfiel, sobald der Admin auf irgendeinem Gerät online war (z. B. Tablet offen) – das Handy bekam dann nichts. Jetzt geht
  der Push immer (außer Ruhezeit/abgeschaltet); jedes Gerät entscheidet selbst: App sichtbar → Ton + Ansage in der App, sonst
  Mitteilung. Dieselbe Person wird je Gerät höchstens einmal in 10 Min. angesagt (Online-Takt und Push zusammen).
- DB: kc_club_archiv_ordner.einreichen, kc_club_archiv_dokumente.beschreibung (Migration 20261003_kc_club_v1640_chronik.sql).

## 1.63.0 – 2026-10-03
- KC-CLUB-FOTO-ALBEN (Wunsch Hansi): eigene Fotoalben mit Namen (z. B. „Weihnachtsmarkt 2026“). Im Fotoalbum oben
  „📸 Alben“ mit „＋ Neues Album“; „☑️ Auswählen“ → Fotos antippen (grüner Haken) → unten „📸 Ins Album“ (vorhandenes
  oder neues Album). Im Album: „＋ Fotos hinzufügen“, „✏️ Ändern“ (Name, Jahr, Deckblatt), „➖ Aus Album nehmen“,
  „🗑️ Album“ (30 Tage im Papierkorb, „♻️ Zurückholen“). In der Großansicht: „📸 Album“ für ein einzelnes Foto.
  Sichtbarkeit beim Anlegen: „🔒 Nur ich“ oder „👥 Alle Mitglieder“ (nur der Besitzer ändert sie; Club-Alben pflegen
  Besitzer und Clubleitung). Alben verweisen nur auf die Fotos – keine Kopien, kein zusätzlicher Speicher.
- Archiv: Alben stehen als eigene Rücken (📸, Deckblatt, Jahr, Name, Anzahl) im Regal – private unter „👤 Mein Ordner“,
  Club-Alben im Vereinsarchiv beim Jahr; neuer Filter „📸 Fotoalben“. Antippen öffnet das Album, „‹“ führt zurück ins Archiv.
- DB: kc_club_foto_alben, kc_club_foto_album_fotos (Migration 20261003_kc_club_v1630_foto_alben.sql, nur Server-Zugriff).
  Server: foto_album_speichern, foto_album_fotos, foto_album_loeschen, foto_alben_papierkorb, foto_album_wiederherstellen;
  fotos_liste (album_id, alben) und archiv_liste (alben) erweitert.

## 1.62.0 – 2026-10-03
- KC-CLUB-DOK-ANZEIGE (Fund Hansi: „Wenn ich das Dokument aufrufe, wie komme ich wieder in die App?“): PDFs aus „Meine
  Dokumente“ öffnen jetzt IN der App (eigene Ansicht, alle Seiten untereinander). Oben „‹“ und „🖨️ Drucken“ (über den
  vorhandenen Druck-Kern, randlos A4) sowie „📤 Teilen / Speichern“ (die PDF-Datei selbst). Die Zurück-Taste des Handys
  führt zurück zur Liste; Link #dokument=<id> öffnet direkt. Der bisherige Weg bleibt als „↗ Im PDF-Betrachter öffnen“
  (und automatisch, wenn die Anzeige auf einem alten Gerät nicht klappt).
- pdf.js 4.10.38 (Mozilla, Apache-2.0, kostenlos) liegt unverändert in lib/pdfjs und wird erst beim Öffnen eines Dokuments
  geladen (isEvalSupported: false); keine fremden Server.

## 1.61.0 – 2026-10-03
- KC-CLUB-DOK-NEU (Wunsch Hansi: alle sollen die neue Anleitung bekommen, aber nicht mit Meldungen überhäufen): Neue
  Dokumente bekommen in der Registry DOKUMENTE ein „neuBis“-Datum. Bis dahin erscheint leise genau EINE Zeile
  „📖 Neu: … › ✕“ bei „Heute wichtig“ und ganz unten bei „🔔 Für dich“, dazu „NEU“ an der
  Kachel. Kein Fenster, kein Push, keine Update-Meldung. Weg nach dem Öffnen, mit ✕ oder nach neuBis (je Gerät gemerkt).
  Erstes Dokument: Bedienungsanleitung Club-App (bis 31.10.2026).

## 1.60.0 – 2026-10-03
- KC-CLUB-ANLEITUNG (Wunsch Hansi): Vollständige Bedienungsanleitung der Club-App als PDF mit Bildschirmfotos –
  gleiche Gestaltung wie die Kasse-Anleitung (Kopf mit Kochmütze, nummerierte Bilder mit Legende, Zeilen „Bild – Erklärung“,
  „Gut zu wissen“, NEU-Marken). 9 Teile: Startseite einfach/erweitert, Nachrichten (Haken, ❗ wichtig, Vorlesen), Termine,
  Mitglieder, Pinnwand, SOS, Einstellungen, Notbetrieb. Nur erfundene Demodaten. In „Meine Dokumente“ als
  „📖 Bedienungsanleitung Club-App“; die Kurzanleitung „In 3 Schritten zur App“ bleibt. Bau-Werkzeug: tools/anleitung/.

## 1.59.0 – 2026-10-03
- KC-CLUB-VORLESEN (Wunsch Hansi): Nachrichten vorlesen lassen – Lautsprecher 🔇/🔊 oben im Chat (und Schalter „🔊 Neue
  Nachrichten vorlesen“ im Kasten „Ansagen, Töne & Tipps“): neue Nachrichten anderer im offenen Chat werden vorgelesen
  („Klaus: …“, ❗ als „wichtig“). Einzelne Nachricht: antippen → „🔊 Vorlesen“. Das Gerät spricht selbst (kostenlos).
- Tipp des Tages neu: „Möchtest du hören, wenn sich jemand anmeldet? … Soll ich dir zeigen, wo?“ und „Nachrichten vorlesen
  lassen?“ – „👉 Ja, zeig mir wo“ springt genau zum Schalter und hebt ihn hervor, „⏰ Nein, später“ bietet es später erneut an;
  erscheint nur, solange der Schalter aus ist. Tipps können jetzt eigene Knopftexte haben (ja/nein/neinSpaeter).
- Fund Hansi (Tablet): Symbole in runden Knöpfen (🎤, WA, …) sitzen jetzt genau mittig (Flex-Zentrierung, kein Innenabstand).

## 1.58.2 – 2026-10-03
- Fund Hansi: Die Update-Meldung zeigte bei jedem Update wieder den Text von 1.53.6 („🐜 Feld Nächster Termin …“), weil
  version.json „neu“ beim Hochzählen nicht mitgezogen wurde. Jetzt wieder nur „🔧 Kleine Systemverbesserungen“; neuer
  Vertragstest: „neu“ muss zum neuesten Eintrag im Verlauf passen.

## 1.58.1 – 2026-10-03
- Wunsch Hansi: Schalter „💡 Tipp des Tages“ aus „Das Wichtigste“ (nur einfache Ansicht) in den Kasten „🗣️ Ansagen, Töne &
  Tipps“ umgezogen – jetzt in beiden Ansichten sichtbar.

## 1.58.0 – 2026-10-03
- KC-CLUB-FP-UEBERWACHUNG (Wunsch Hansi): Fehlerprotokoll mit Einstufung 🔴 schwerwiegend / 🟡 Hinweis / ⚪ Info (eine Regel
  im Server: Hilferuf, App startet gar nicht, echter Programmfehler, Sicherheitsbericht mit Problemen = schwer; Updates,
  App-Starts, Gerät-Infos = Info; „Script error.“ ohne Einzelheiten = Hinweis). Knopf „🗑️ Protokoll leeren“ (Admin, mit
  Rückfrage; vorher Sicherung als ein Protokolleintrag „fp_geleert“). Überwachung: Wartung (15 Min.) schickt bei neuen
  schwerwiegenden Einträgen eine Push an den Admin (nicht in der Ruhezeit – dann danach). Ab 300 Einträgen fragt die
  Tagesinfo „Soll ich das Fehlerprotokoll leeren? Es sind X Einträge drin – Y schwerwiegend …“.
- Ursache vieler Einträge behoben: Im Notbetrieb (und der Simulation) landen Meldungen nicht mehr im Fehlerprotokoll;
  Ersatz-Server beantwortet die Hintergrund-Abfrage neuer Zettel still. Communicator-Regel club_fehler (nur Push).

## 1.57.1 – 2026-10-03
- KC-CLUB-ONLINE-ANSAGE (Fund Hansi „Schalter nicht zu sehen“): Die Schalter Ansage / Anmelde-Ton / Anmelde-Push standen im
  Kasten „Das Wichtigste“, der nur in der einfachen Ansicht erscheint. Jetzt eigener Kasten „🗣️ Ansagen & Töne“ – in beiden
  Ansichten sichtbar.

## 1.57.0 – 2026-10-03
- KC-CLUB-ONLINE-PUSH (Wunsch Hansi): Admin bekommt auch bei geschlossener App eine Push „🟢 Klaus ist jetzt online“ (normaler
  Benachrichtigungston des Handys – eigener Ton/Sprache gehen bei geschlossener App technisch nicht). Nur wenn das Mitglied
  ≥ 10 Min. weg war, nicht in der Ruhezeit des Admins, nicht wenn dessen App gerade offen ist, nicht für Mitglieder mit
  verborgenem Online-Status. Schalter „📲 Push, wenn sich jemand anmeldet (Admin)“, Standard an. Nur Push, keine Mail.
  DB: kc_club_anmeldung liefert zusätzlich „vorher“; Communicator-Regel club_online.

## 1.56.0 – 2026-10-03
- KC-CLUB-ONLINE-ANSAGE (Wunsch Hansi): Einstellung „🗣️ Ansage, wenn jemand online kommt“ – das Handy sagt „Klaus ist jetzt
  online“ (mehrere: „Klaus und Dieter sind jetzt online“). Admin zusätzlich „🔔 Ton, wenn sich jemand anmeldet“ (Standard an).
  Sprache/Ton macht das Gerät selbst (kostenlos). Nur bei offener App, nicht in der eigenen Ruhezeit, dieselbe Person erst
  nach 10 Min. Abwesenheit wieder, nach langer Pause keine Sammelansage. Nutzt die vorhandene Online-Liste (gleiche
  Privatsphäre). Einstellung je Gerät.

## 1.55.0 – 2026-10-03
- KC-CLUB-HAKEN (Wunsch Hansi „wie WhatsApp“): Haken an eigenen Nachrichten – ✓ gesendet (noch nicht auf dem Handy des anderen),
  ✓✓ grau angekommen, ✓✓ blau gelesen. „Angekommen“ je Empfänger: Push auf seinem Handy angezeigt/geöffnet (Rückmeldung des
  Handys) oder seine App war nach der Nachricht online. In Gruppen erst grau/blau, wenn es für alle gilt; wer schon gelesen
  hat, steht klein daneben (z. B. 2/5). Push-Text („🔔 angekommen“) aus der Zeile genommen (Einzelheiten weiter unter ℹ️),
  ✉️ zeigt weiter, dass auch eine Mail ging. Server: unterhaltung liefert haken.

## 1.54.1 – 2026-10-03
- KC-CLUB-NOTBETRIEB-ERNSTFALL (Wunsch Hansi): Admin-Knopf „🧯 Ernstfall simulieren (Supabase weg, nur dieses Gerät)“. Anders als
  die Probe schaltet nichts von Hand um: Auf diesem Gerät scheitert jede Anfrage an den Club-Server wie bei einem echten
  Ausfall; Erkennen, automatisches Umschalten, Rückkehr (2 erfolgreiche Antworten) und Nachtragen laufen wie im Ernstfall.
  Band „Notbetrieb (Ernstfall-Simulation)“ mit „Simulation beenden“; simulierte Fehler landen nicht im Fehlerprotokoll.
  Ersatz-Server: verständlichere Meldung bei neuem Chat im Notbetrieb.

## 1.54.0 – 2026-10-02
- KC-CLUB-NOTBETRIEB-STUFE2 (Wunsch Hansi): Im Notbetrieb gehen jetzt auch Nachricht in einem bestehenden Chat (Text, ❗),
  Zu-/Absage, Status und Pinnwand-Zettel. Der Ersatz-Server legt sie in seinen Eingang (nichts doppelt, max. 40 je Mitglied);
  die App zeigt ⏳-Blasen im Chat und „📨 N warten“ im orangen Band. Zurück im Normalbetrieb holt der Club-Server den Eingang
  signiert ab und trägt jeden Eintrag genau einmal über die normale Aktion nach (gleiche Prüfungen, Push/Mail, Hinweis
  „🟠 im Notbetrieb geschrieben um …“). Abgelehntes (mit Grund) bekommt das Mitglied gemeldet und der Admin in der Tagesinfo.
  Server: notEingangLauf (Zeitplaner + Aktion notbetrieb_nachtragen), DB: kc_club_notbetrieb_eingang, kc_club_notbetrieb.nachtrag.
  Worker: /eingang/abholen, /eingang/quittieren (signiert, Zeitstempel). Doku: docs/NOTBETRIEB.md.

## 1.53.6 – 2026-10-02
- KC-CLUB-FRIST-AMEISEN (Wunsch Hansi): Das Feld „Nächster Termin“ oben rechts bekommt je nach Tagen bis zum nächsten
  Termin eine laufende Ameisenstraße (wie „Neue Nachr.“): ≤ 5 Tage hellgrün und langsam (2,4 s), ≤ 3 Tage orange (1,4 s),
  ≤ 1 Tag (morgen/heute) rot und schnell (0,8 s). Mehr als 5 Tage oder kein Termin: kein Rand. Grundlage ist dieselbe
  Tageszahl, die im Feld steht. Bei „Bewegung reduzieren“ langsam (3 s).

## 1.53.5 – 2026-10-02
- Dokumente: „Schnellanleitung Bilderrechner“ zeigt jetzt die **Kurzanleitung Version 4** (28 Seiten,
  `dokumente/Kurzanleitung_Bilderrechner_V4.pdf`). Neu bzw. geändert gegenüber Version 3 (Kasse vom 02.10.2026):
  Rabatt (farbige Gründe mit Vorschlag, Kontrollzeile), Weitere Funktionen (Gruppen Geld/Rückgabe/Bon und Übersicht,
  farbig), Bargeldentnahme (Münzen und Scheine), Gutschein (echte Scheine), Helfer (Küche DO, farbig) und neu
  „Bargeld vom Kassenwart übernehmen“ (Scanfeld, Vorschau, Kurzcode). Knöpfe einzeln sauber ausgeschnitten.
  Unveränderte Seiten aus Version 3 übernommen; die Datei Version 3 bleibt im Ordner erhalten.

## 1.53.4 – 2026-10-02
- KC-CLUB-NEU-AMEISEN (Rückmeldung Hansi „bewegt sich nicht“): Die Ameisenstraße ist jetzt ein echtes SVG im Feld statt eines
  Hintergrundbilds – die Bewegung im Hintergrundbild lief nicht auf jedem Handy. Bei „Bewegung reduzieren“ läuft sie langsam
  (3 s) statt stillzustehen (wie die Schreib-Punkte).

## 1.53.3 – 2026-10-02
- KC-CLUB-NEU-AMEISEN (Wunsch Hansi): Feld „Neue Nachr.“ im Kopf wird bei neuen Nachrichten nicht mehr ganz orange, sondern
  bleibt in der Kopffarbe wie die anderen Felder; eine orange „Ameisenstraße“ läuft um den Rand, die Zahl ist orange.
  Bei „Bewegung reduzieren“ steht der Rand still.

## 1.53.2 – 2026-10-02
- Wunsch Hansi: Reiter „Mein Bereich“ heißt jetzt „Meins“ (kürzer, die Zahl bricht nicht mehr um; Inhalt unverändert).
- KC-CLUB-TIPPT: „✏️ Klaus schreibt …“ – Stift vor dem Namen, die hüpfenden Punkte (Welle) bleiben.

## 1.53.1 – 2026-10-02
- KC-CLUB-WICHTIG (Wunsch Hansi): In „ℹ️ Nachricht – Einzelheiten“ steht bei wichtigen Nachrichten oben orange umrandet
  „❗ Wichtige Nachricht – Wichtigkeit: hoch“ (Server: nachricht_details liefert wichtig). Stummgeschaltete Chats bleiben
  auch bei ❗ stumm (Entscheidung Hansi).

## 1.53.0 – 2026-10-02
- KC-CLUB-WICHTIG (Wunsch Hansi): ❗-Knopf unter dem Schreibfeld = Nachricht mit „Wichtigkeit hoch“. Beim Schreiben werden
  Knopf und Schreibfeld orange; die Nachricht erscheint bei allen orange umrandet mit der Marke „❗ WICHTIG“. In der Chat-Liste
  fallen Chats mit ungelesener wichtiger Nachricht auf (orange Kante, „❗“ an der Zahl). Push/Mail tragen „❗ Wichtig –“ im
  Titel. Gilt nur für die nächste Nachricht im aktuellen Chat (danach wieder normal). Stummgeschaltete Chats bleiben stumm.
  DB: kc_club_nachricht_wichtig (hängt an kc_communication_messages, Kern-Tabelle unverändert; RLS an, Spiegel wie üblich).

## 1.52.2 – 2026-10-02
- KC-CLUB-STATUS-PFEIL (Wunsch Hansi): Pfeil des Status-Felds mittig auf der Unterkante statt rechts zwischen Feld und LEDs
  (Feld dadurch schmaler). Feld-Pfeile der drei Kopf-Felder in der erweiterten Ansicht einheitlich tiefer auf dem rechten
  Rand (74 %) – der rechte sitzt nicht mehr unten im Text „Nächster Termin“, sondern unter » zum Blättern.

## 1.52.1 – 2026-10-02
- KC-CLUB-NOTBETRIEB (Probe Hansi): Das orange Notbetrieb-Band verdeckte rote/dunkle Meldungen oben (z. B. „Im Notbetrieb
  gerade nicht möglich“). Meldungen und SOS-Balken rutschen jetzt um die Höhe des Bandes nach unten (CSS-Variable --notH,
  wird beim Ein-/Ausblenden und bei Größenänderung gesetzt). Ersatz-Server eingetragen (notbetrieb.json), Zeitplaner wartet
  120 s auf den Paketbau.

## 1.52.0 – 2026-10-02
- KC-CLUB-NOTBETRIEB (Wunsch Hansi, Weg B): Fällt Supabase aus, schaltet die App auf einen Ersatz-Server bei Cloudflare um
  (kostenlos, keine Neon-Rechenzeit). Der Club-Server berechnet alle 15 Min. – nur wenn sich etwas geändert hat
  (Fingerabdruck) – für jedes Mitglied dieselben Antworten wie sonst (Start, Mitglieder, Termine, SOS, Pinnwand, Nachrichten,
  Aufgaben, Dienste; gleiche Rechte, eine Regel) und legt sie signiert (Ed25519) beim Ersatz-Server ab. Der Ersatz-Server prüft
  Signatur und Zugang (nur Prüfwert) und gibt nur diese Antworten zurück; Ändern ist im Notbetrieb nicht möglich (klare Meldung).
  App: Umschalten nach 2 Verbindungsfehlern bzw. wenn schon der Start scheitert; oranges Band „Notbetrieb – Stand von …“;
  zurück, sobald der Club-Server 2× antwortet. Handschalter notbetrieb.json (auto/an/aus), Admin: „Notbetrieb-Probe auf
  diesem Gerät“. Server: Aktionen in aktionAusfuehren() (unverändert), ichAus() gemeinsam mit der Anmeldung, nurLesen-Schutz.
  Neu: notbetrieb/ (Worker + wrangler.toml), Workflow „Notbetrieb hochladen“ (läuft erst mit Cloudflare-Secrets),
  Migration 20261002_kc_club_v1520_notbetrieb (Tabelle kc_club_notbetrieb nie gespiegelt, Fingerabdruck, Zeitplaner 15 Min.).
  Solange kein Ersatz-Server eingetragen ist, bleibt alles aus.

## 1.51.0 – 2026-10-02
- KC-CLUB-ANKLOPFEN-WARTEN: Nach dem Anklopfen erscheint „👋 Klopfe gerade an bei X …“ mit Sekunden-Uhr (1:00 → 0:00) und „Auflegen“. Nach einer Minute: „Weiter anklopfen“, „Nachricht senden: Melde dich doch mal bei mir. Gruß …“ (mit Push) oder „Auflegen“. Auflegen schließt die Anklopf-Frage beim Gegenüber („X hat aufgelegt“). Neuer Status 'abgebrochen', Aktion anklopfen_abbrechen.
- KC-CLUB-BEGRUESSUNG: Tages-Übersicht (Admin) zeigt „XY hat sich heute zum ersten Mal angemeldet – Begrüßungs-Nachricht senden?“. Ja → Nachricht mit Push „Herzlich willkommen XY. Schön, dass du da bist. Viel Spaß mit der Köcheclub-App. Wenn etwas nicht klappt, melde dich gerne bei mir. Gruß <Absender>“; danach nicht mehr angeboten. Datenbank: kc_club_zugang.erstmals_gesehen (Anmeldung setzt sie einmalig; Bestand aus Protokoll übernommen).

## 1.50.0 – 2026-10-02
- KC-CLUB-STATUS-RUHE: Während der eigenen „Nicht stören“-Zeit (⚙️ → Benachrichtigungen) zeigt der Status „🌙 Ruhezeit bis HH:MM“ – oben im Kopf (live, minütlich) und für die anderen in Mitgliederliste/-seite. Nur Anzeige, nichts gespeichert; Urlaub/krank/beschäftigt/nicht erreichbar haben Vorrang. Nicht als Status wählbar; Kreis bleibt dabei nicht orange.
- KC-CLUB-STATUS-PFEIL: Pfeil am Statusfeld rechts mittig auf dem Rand (wie bei den Feldern darunter), Statusfeld dadurch schmaler.

## 1.49.2 – 2026-10-02
- KC-CLUB-ZUSTELLFEHLER: Roter Kreis (nur Admin) nur noch, wenn nach einem Zustellfehler auf demselben Weg nichts mehr angekommen ist (vorher blieb ein einzelner alter Push-Fehler 7 Tage rot). „Kein Push und keine E-Mail“ ist kein roter Fehler mehr, sondern ein Hinweis „📵 nicht erreichbar“ in Liste und Kachel (nur Admin).

## 1.49.1 – 2026-10-02
- KC-CLUB-SOS-KACHELN: Eigene Kachel „(du)“ vorne (auch in der Liste) – zeigt, ob der eigene Notfallkontakt hinterlegt ist; Antippen zeigt ihn und führt zu „ändern/eintragen“. Namenskreise im SOS neutral grau, damit Rot nur „Notfallkontakt“ bedeutet.

## 1.49.0 – 2026-10-02
- KC-CLUB-SOS-KACHELN: SOS → „Mitglieder im Notfall erreichen“ als Kacheln (Name, Amt, erreichbar/keine Nummer frei); Antippen öffnet Anrufen/SMS/WhatsApp. Für die Clubleitung: Notfallkontakt rot umrandet + rotes Schild, im Fenster rot hinterlegt. Mitglieder sehen weiter keine Notfallkontakte; Clubleitung-Bereich als Kacheln mit goldenem Rand. Umschalter 🔲 | ☰ (gleiche Einstellung wie bei Mitglieder); Liste zeigt 🆘 neben dem Namen. Notrufknöpfe unverändert.

## 1.48.0 – 2026-10-02
- KC-CLUB-EINFACH-ANORDNEN: Auch in der einfachen Ansicht lassen sich die Kacheln anordnen (lange drücken → nach oben/unten ziehen oder ▲ ▼). Eigene Reihenfolge, getrennt von der erweiterten Ansicht, geräteübergreifend gespeichert (Einstellung „kacheln“, Schlüssel „einfach“). Kein Ausblenden in der einfachen Ansicht; „↺ Standard“ setzt dort nur deren Reihenfolge zurück.

## 1.47.3 – 2026-10-02
- KC-CLUB-MINI-PFEIL: Die drei Felder im Startkopf (Neue Nachr., Mitglieder, Nächster Termin) zeigen ihren ›-Pfeil rechts mittig auf dem Rand, etwas größer, ohne Umrandung.

## 1.47.2 – 2026-10-02
- KC-CLUB-ONLINE-ZAHL: Zahl der Online-Mitglieder im Startfeld größer (1.3rem, LED 13 px).

## 1.47.1 – 2026-10-02 (DEV)

- KC-CLUB-DIENSTWUNSCH / KC-DP-TWINKEY-EINFACH (Wunsch Hansi vor Wilfrieds Eingabe): DP2 auf Build 257 RC übernommen
  (dp3 `37bd067`). Sperr-Frage mit drei klaren Antworten (Weiter ohne Antwort gesperrt), ein Zurück je Schritt,
  „Bisherige Besetzung“ nur noch bei der (Wunschzeit) als Link, kurze Tageszusammenfassung (Details zugeklappt),
  Tageskacheln „Mi., 2.12. · Aufbau · 08:00–18:00“ mit Statusfarbe, „Überspringen“ auf dem Willkommensbildschirm entfällt.
  Begriffe (Kann-Zeit)/(Wunschzeit) bleiben wie auf Papiermatrix und Excel. Datenformat unverändert. Test 205, Tests
  142/146/149/151/199/201 erweitert. RC.

## 1.47.0 – 2026-10-02
- KC-CLUB-MG-UMSCHALTER: Mitgliederübersicht hat oben einen Umschalter 🔲 Kacheln | ☰ Liste (gleiche Einstellung wie unter Darstellung), daneben 👥 Alle | 🟢 Online.
- KC-CLUB-ONLINE-ZAHL: Im Startfeld „Mitglieder“ statt „keiner online“ nur eine LED mit Zahl (grün = jemand online, grau = niemand; Stand unbekannt = grau mit „?“).
- KC-CLUB-KOPF-EINFACH: Einfache Ansicht ohne 🌙, ↻ und ♥ im Kopf; die Verbindungs-LEDs erscheinen dort nur bei einer Störung. Kopf dadurch niedriger, Clubname ungekürzt.

## 1.46.1 – 2026-10-02
- KC-CLUB-VORSCHLAG-KACHELN: Themen, Abstimmungen und Erledigtes unter „Vorschläge“ als kleine Kacheln; Antippen öffnet alle Einzelheiten mit Unterstützen/Abstimmen/Abschließen.

## 1.46.0 – 2026-10-02 (DEV)

Einheitliches Bedienkonzept (Wunsch Hansi „überall das gleiche Bedienkonzept, nichts überladen“; Freigabe A–D). Für die
Mitglieder nur als „Kleine Systemverbesserungen“ angekündigt.
- KC-CLUB-DIALOG: Alle 81 Rückfragen (confirm) und 20 Eingaben (prompt) laufen als App-Fenster (frage()/eingabe(), über
  allem, Überschrift + Text, „OK = …, Abbrechen = …“ wird zu Knopf-Beschriftungen, Löschen/Absagen mit rotem Knopf).
  Per Code-Analyse umgestellt (10 Funktionen dafür asynchron, Ergebnisse nirgends direkt weiterverwendet). Von Hand neu:
  Amt & Rechte in einem Fenster (Häkchen statt Komma-Eingabe + drei Ja/Nein-Fragen), Mitfahrt anbieten in einem Fenster
  (Plätze 1–8 antippen + Treffpunkt), Notiz bei „Kann nicht/Vielleicht“ mit Vorschlägen („Ohne Notiz“ antwortet wie bisher).
- KC-CLUB-NEU-EINHEITLICH: Termine nur noch „＋ Neu“ (Auswahl Termin / Terminanfrage / Terminfindung) + Drucker in einer
  Zeile; Helfen & Leihen mit „＋ Neu“ oben rechts (je Reiter); Fotoalbum „＋ Neu“ statt „＋ Fotos“.
- KC-CLUB-PROTOKOLL-KACHELN: Protokolle als kleine Kacheln (Status, neu, Anlagen/Aufgaben); „Offene Aufgaben“ und
  „Protokoll schreiben“ als Klappbereiche mit Schloss; Löschen im geöffneten Protokoll. Pinnwand (Zettelwand) und Archiv
  (Ordnerregal) bleiben – dort ist die Darstellung bereits bildhaft und übersichtlich.
- Begriffe: sichtbar einheitlich Termin (Oberbegriff) / Sitzung / Veranstaltung („Nächster Termin“, „Vergangene Termine“,
  Legende/Filter „Sitzung(en)“, Titelvorschlag „Köcheclub-Sitzung“). Terminanfrage-Anlass „Treffen“ bleibt (privat).
- Klappbereiche mit Pfeil und Schloss auch bei Termine (Terminfindung, Terminanfragen, private Termine).

## 1.45.1 – 2026-10-02 (DEV)

- KC-CLUB-DIENSTWUNSCH / KC-DP-TWINKEY-EINFACH (Wunsch Hansi nach UX-Prüfung, vor Wilfrieds Eingabe): DP2 auf Build 256 RC
  übernommen (dp3 `51518cc`, Zweig codex/club-app-interface). Twinkey „Selbst eingeben“: „x von 13 Tagen fertig“ und
  „▶ Weiter mit <nächster offener Tag>“ in Tagesliste und nach dem Speichern; „Fertig“ fragt bei offenen Tagen nach;
  Kann-Zeit nicht mehr mit dem ganzen Tag vorausgefüllt („Ganze freie Zeit übernehmen“ als bewusster Knopf); Wunschzeit-
  „Weiter“ erst nach Wahl; „Diesen Tag eintragen“/„Angaben bearbeiten“ sofort sichtbar. Datenformat unverändert. Test 201,
  Tests 142/146/149/151/199 erweitert. RC.

## 1.45.0 – 2026-10-02 (DEV)

- KC-CLUB-MG-KACHELN (Wunsch Hansi, Entwurf freigegeben; „jeder kann selbst wählen“): „👥 Aktive Mitglieder“ wahlweise als
  Kacheln (Kreis mit Statusfarbe, grüner Ring = online, Name, Amt, Status, zuletzt da, 💬 / 👋) oder als bisherige Liste.
  Umschalter unter ⚙️ Einstellungen → 🎨 Darstellung → „👥 Mitglieder anzeigen als“ (je Gerät, Standard Kacheln).
  Kachel antippen öffnet die Mitglied-Details; dort für den Admin jetzt auch 🔗 App-Link und 🎖️ Amt & Rechte.

## 1.44.1 – 2026-10-02 (DEV)

- KC-CLUB-DIENSTWUNSCH / KC-DP-WUNSCH-SPERRE: DP2 auf Build 255 RC übernommen (dp3 `ae349c0`, Zweig codex/club-app-interface,
  Codex). DP2 reserviert jeden Club-App-Eingang je PC (kc_dp_wish_inbox_claim) erst nach Tagesvergleich und unmittelbar vor dem
  lokalen Eintragen, quittiert nur mit eigener Reservierung (ack_claimed), erkennt nach Neustart die eigene Quittierung über
  takenClaim und rollt bei claim_lost/stale gezielt zurück; Kollegenfreigabe nur noch aus der Serverantwort. Die Twinkey-Dateien
  der Club-App sind unverändert (Planer-Seite), nur dp2/QUELLE.json + Cache-Schlüssel neu. Vertragstests 142/146/149/151
  erweitert, Test 199. RC: Wiederherstellungsprüfung und Live-Test mit zwei echten Planer-PCs (alle auf Build 255) offen.

## 1.44.0 – 2026-10-02 (DEV)

- KC-CLUB-TERMIN-KACHELN (Wunsch Hansi „wirkt so erschlagen“): Termine → Liste zeigt kommende Termine als kleine Kacheln
  (🍽️ Treffen / 🎪 Veranstaltung / 🚫 abgesagt, Titel, Datum, Ort, eigene Antwort bzw. „👉 Antwort fehlt“, Zu-/Absagen,
  „🚗 x Plätze frei“). Antippen öffnet den vollständigen Termin wie bisher (Zusagen, Mitfahren, Kalender, Ändern/Absagen/
  Löschen, Drucken). Vergangene Treffen als zugeklappter Bereich. Kalender-Ansicht unverändert.

## 1.43.0 – 2026-10-02 (DEV)

- KC-CLUB-BOERSE (Wunsch Hansi; Freigabe „1 ja, 2 ja, 3 b, 30 Tage mit Verlängerung, 3 Tage vorher Erinnerung“): Club-Börse
  als dritter Reiter in „🤝 Helfen & Leihen“. „🟢 Ich biete …“ / „🔵 Ich suche …“, Rubrik (Küche, Musik & Bücher, Sport &
  Freizeit, Kleidung, Haushalt, Sonstiges), Preis (zu verschenken / Festpreis / VB / Tausch), bis 3 Fotos (verkleinert),
  Beschreibung. Kacheln mit Foto, Filter Biete/Suche und Rubrik, „📋 Meine Anzeigen“. Kontakt per vorbereiteter Nachricht.
  Laufzeit 30 Tage; 3 Tage vorher Push/Mail „verlängern oder auslaufen lassen“ (Sprung #boerse=…), Verlängern um 7/14/30
  Tage („bis TT.MM.“), höchstens 60 Tage im Voraus. Treffer: neue Anzeige teilt ein Stichwort mit einer Gegen-Anzeige →
  deren Ersteller bekommt einmal Bescheid (kc_club_boerse_treffer). Kein Versand an alle. Erledigt/abgelaufen nach 30
  Tagen samt Fotos entfernt. Fotos aktiver Anzeigen dürfen alle Mitglieder sehen (anlage_url). Clubleitung kann entfernen.

## 1.42.1 – 2026-10-02 (DEV)

- KC-CLUB-BILD-LINK (Fehlermeldung Klaus 02.10., 9:33 „img nicht geladen: Bildschirmfoto…“): Bilder im Chat bekommen vom
  Server einen 10-Minuten-Link (anlage_url). Die App hat ihn für immer gemerkt – bei länger offenem Chat blieb ein Bild
  nach dem Neuzeichnen leer. Jetzt wird der Link höchstens 8 Minuten wiederverwendet und bei einem Ladefehler einmal frisch
  geholt. Datei und Zugriffsrecht waren in Ordnung (geprüft). Server unverändert.

## 1.42.0 – 2026-10-02 (DEV)

- KC-CLUB-HILFE-ANGEBOT (Wunsch Hansi): Unter „🤝 Helfen & Leihen → Wer kann helfen?“ neben „🙋 Ich suche Hilfe“ jetzt
  „🤲 Ich biete Hilfe an“ – dauerhafte Angebote als Kacheln (z. B. „Einrichtung der Club-App“, „Einführung in den
  Bilderrechner“; Vorschläge antippbar, Symbol wählbar, Beschreibung freiwillig). Mitglieder tippen die Kachel an:
  „📨 Termin anfragen“ (vorhandene Terminanfrage, Anbieter schon gewählt, Anlass = Angebot) oder „💬 Nachricht“ (Text
  vorbereitet, Senden selbst). Anlegen verschickt nichts. Ändern/Beenden: Anbieter oder Clubleitung. Neue Tabelle
  kc_club_hilfe_angebote (RLS, Spiegel), Aktionen hilfe_angebot_speichern / hilfe_angebot_beenden; hilfe_liste liefert angebote.

## 1.41.0 – 2026-10-02 (DEV)

- KC-CLUB-MITFAHRT-BESCHEID (Wunsch Hansi): Wer mitfahren will, aber es gibt noch keine Fahrt mit freiem Platz, bekommt ein
  Meldungsfenster „Zurzeit gibt es noch keine Mitfahrgelegenheit. Soll ich das für dich im Auge behalten und dich
  informieren, sobald eine neue Gelegenheit eingestellt wird?“ – Ja / Nein. Ja trägt die Suche ein (vorhandene Funktion:
  neue Fahrt → Push/Mail „🚗 Mitfahrgelegenheit gefunden“ an alle Suchenden). Auslöser: „🙋 Ich suche …“ ohne freie Plätze
  und Schnellstart „🚗 Mitfahrt“ (nach Zusage zum nächsten Treffen). Hinweis im Fenster: andere sehen den Namen als suchend.

## 1.40.0 – 2026-10-02 (DEV)

- KC-CLUB-DIENSTWUNSCH (Hinweis Hansi „beim Twinkey-Aufruf keine drehende Kochmütze“): Die Ladeanzeige der Twinkey-Seite
  zeigte die weiße Mütze blass eingefärbt auf Hellbeige – praktisch unsichtbar. Jetzt wie in der Club-App: weiße Mütze auf
  dunkelrotem Kreis, dreht sich. Zusätzlich erscheint die Mütze schon im Fenster, während die Twinkey-Seite selbst noch lädt
  (verschwindet beim Laden der Seite). DP2-Dateien (dp2/) unverändert.

## 1.39.0 – 2026-10-02 (DEV)

- KC-CLUB-MITFAHRT-SITZE (Wunsch Hansi, Entwurf freigegeben): Mitfahrgelegenheiten mit echten Sitzplätzen – je Fahrer ein
  Auto von oben (Fahrer vorne links), so viele Sitze wie angeboten; bei mehr als 4 Plätzen weitere Reihen wie ein Kleinbus
  (bis 8). Grün „frei“ antippen = reservieren, blau „Du“ antippen = freigeben (jeweils Rückfrage, Fahrer bekommt wie bisher
  Bescheid), rot gestrichen = belegt (nicht wählbar, Name darunter). Statuszeile „x von n frei“ mit 🟢/🔴/✔. Server unverändert.

## 1.38.0 – 2026-10-02 (DEV)

- KC-CLUB-TAGESINFO-MANUELL (Wunsch Hansi, keine neue Kachel): Die Tages-Übersicht vom Start ist jederzeit wieder
  aufrufbar – Knopf „📋 Übersicht“ rechts in der Karte „Heute wichtig“ und in der Büro-Begrüßung (nur Clubleitung:
  Clubsprecher, Kassenwart, Admin). Manuell aufgerufen bleibt „Seit deinem letzten Besuch“ auf dem Stand vom App-Start
  (Merkpunkt wird nur beim automatischen Start-Aufruf weitergesetzt).

## 1.37.0 – 2026-10-02 (DEV)

- KC-CLUB-BUERO-RECHTE (Wunsch Hansi): Der Admin schaltet das Büro je Mitglied frei – im Büro unter „🔐 Verwaltung →
  Büro-Freigaben“: erst festlegen WAS (👁️ nur lesen / ✏️ lesen & schreiben / ⛔ Zugang entziehen), dann WER (Häkchen),
  Rückfrage, speichern (keine Nachricht an die Mitglieder). Neue Spalte kc_club_rollen.buero_recht; bisherige Clubleitung
  (Klaus, Dieter) behält „schreiben“, der Admin hat immer vollen Zugang. Server: Büro-Aktionen prüfen Lese-/Schreibrecht;
  Termine anlegen/ändern/absagen auch mit Büro-Schreibrecht, endgültig löschen bleibt Clubleitung. Freud & Leid,
  Mitgliederliste mit Kontakten, Eingang, Tages-Übersicht und das Alter bei runden Geburtstagen bleiben nur Clubleitung.
  Lesemodus: „Sitzung ansehen“ (gesperrt, Drucken möglich), keine Versand-/Änderungs-Kacheln.
- KC-CLUB-EINGABE-KONTRAST: Knöpfe unter dem Schreibfeld hell mit Rand und Schatten; 🎤 größer mit kräftigem Ring.

## 1.36.0 – 2026-10-02 (DEV)

- KC-CLUB-WA-EINFUEGEN (Wunsch Hansi: WhatsApp bietet bei Text-Nachrichten kein „Teilen“): Im Chat neuer Knopf 📋
  „Aus WhatsApp einfügen“. In WhatsApp Nachrichten markieren → Kopieren, in der App 📋 tippen. Die App liest die
  Zwischenablage (Zeitlimit 8 s; ohne Berechtigung erscheint ein Einfügefeld), entfernt WhatsApp-Zeitstempel und alle
  Telefonnummern (auch als Absender → „Mitglied“) und schreibt je Nachricht „Vorname (hh:mm): Text“ ins Schreibfeld.
  Gesendet wird nie automatisch – nur mit ➤. Rein im Gerät, kein Server, keine Kosten.

## 1.35.0 – 2026-10-02 (DEV)

- KC-CLUB-BUERO-KLAPPE (Wunsch Hansi): Die Büro-Startseite ist in Klappbereiche gegliedert (🗂️ Sitzung, 📄 Nach der
  Sitzung, 👥 Mitglieder, ✉️ Schreiben, 📥 Eingang) – je Bereich Klapppfeil und Schloss 🔒/🔓 wie in den Einstellungen;
  Zustand und Feststellung je Gerät gemerkt. klappenMerken() ist dafür für nachträglich gezeichnete Bereiche wiederverwendbar
  (je Bereich nur einmal eingerichtet); Einstellungen unverändert.

## 1.34.0 – 2026-10-02 (DEV)

- KC-CLUB-MG-GRUPPEN (Wunsch Hansi): „👥 Aktive Mitglieder“ zeigt unter „Alle | Nur online“ die eigenen Gruppen
  (z. B. „📋 Innovation (6)“). Antippen filtert die Liste auf die Mitglieder der Gruppe (kombinierbar mit „Nur online“),
  dazu „💬 In die Gruppe schreiben“ und „✖ Alle zeigen“. Server unterhaltungen liefert bei Gruppen zusätzlich die
  person_ids der Teilnehmer (nur Gruppen, in denen ich selbst bin – keine neuen Daten über das bisher Sichtbare hinaus).
- Status-Knopf oben rechts trägt jetzt die kleine Überschrift „Mein Status“.

## 1.33.2 – 2026-10-02 (DEV)

- KC-CLUB-GRUPPEN-WAHL (Rückmeldung Hansi: „die erstellte Gruppe wird nicht angezeigt“): Auch „👥 Gruppe“ in der
  Kommunikation (bisher nur „Neue Gruppe anlegen“) zeigt oben die vorhandenen Gruppen; Antippen öffnet die Gruppe. Die Liste
  wird an beiden Stellen jedes Mal frisch vom Server geholt (kein veralteter Zwischenstand).

## 1.33.1 – 2026-10-02 (DEV)

- KC-CLUB-GRUPPEN-WAHL (Wunsch Hansi: „Gruppe Innovation sollte bei der Auswahl angezeigt werden“): „Neue Nachricht“ zeigt
  oben „👥 Deine Gruppen“ (alle Gruppen-Unterhaltungen, in denen ich bin) mit Mitgliederzahl; Antippen öffnet die
  vorhandene Gruppe (kein Doppel-Chat). Quelle: vorhandene Aktion unterhaltungen.

## 1.33.0 – 2026-10-02 (DEV)

- KC-CLUB-TAGESINFO (Wunsch Hansi; Freigabe „Kassenwart ja, Ampel 70/90 %, so bauen“): Die Begrüßung der Clubleitung beim
  Start wird zur Tages-Übersicht. Server tagesinfo (nur Clubleitung, nur lesend): „seit“ = letzter Blick (vom Gerät,
  höchstens 7 Tage), Eingang, eigene heute fällige/überfällige Aufgaben; Kassenwart/Admin: laufende Ausleihen, fällige
  Rückgaben, offene Erstattungen (Summe), offene Spendenvorschläge (Summe), offene Freud-&-Leid-Beträge; Admin: Problem-
  Meldungen, Sicherheitsberichte, Feedback seit dem letzten Besuch, Programmfehler-Zahl, Datenbank-Füllstand
  (kc_club_db_groesse, Grenze 500 MB Supabase Free), Spiegel/Sicherung/Überwachung (kc_club_sicherheit_status), Mitglieder
  mit älterer App-Version. App ergänzt Geburtstage/Jubiläen heute und nächste Sitzung (vorhandene Büro-Aktionen).
  Ampel: 🟢/🟡/🔴, fehlender Wert = ⚪ „nicht geprüft“ (nie grün); Datenbank 🟡 ab 70 %, 🔴 ab 90 %. Jede Zeile führt
  direkt zur passenden Stelle. Einmal je App-Start, je Gerät abschaltbar; sendet nichts.
- DB: Migration 20261002_kc_club_v1330_tagesinfo.sql (Funktion kc_club_db_groesse, nur service_role).

## 1.32.2 – 2026-10-02 (DEV)

- KC-CLUB-BILDSCHIRMFOTO im Chat (Wunsch Hansi mit Bildschirmfoto „neben dem WA-Knopf ist noch Platz“): runder Knopf 📸 in
  der Eingabezeile des Chats. Startet den vorhandenen Auslöser und merkt sich den Chat; in der Vorschau steht dann oben
  „💬 In den Chat mit <Name>“ (Bild wird wie gewohnt als Anlage eingefügt, gesendet wird erst mit ➤), darunter
  „In einen anderen Chat“, Problem an Hansi, Archiv, Handy.

## 1.32.1 – 2026-10-02 (DEV)

- KC-CLUB-KOPFZEILE (Hinweis Hansi mit Bildschirmfoto: „＋ Neu fehlt, wofür ist der Stern?“): Bei großer Schrift schob die
  Kopfzeile der Kommunikation „＋ Neu“ aus dem Bildschirm. Jetzt steht nur „＋ Neu“ in der Kopfzeile; „👥 Gruppe“,
  „⭐ Gemerkt“ (vorher nur ⭐) und „🧪 Test“ in einer eigenen, beschrifteten Reihe darunter. Alle Kopfzeilen (.kopf2)
  brechen bei Platzmangel um, statt Knöpfe abzuschneiden.

## 1.32.0 – 2026-10-02 (DEV)

- KC-CLUB-FREUD-LEID (Wunsch Hansi; Freigabe „nur Clubleitung, 100 € bei Todesfall, Abordnung fragen, Checklisten passen“):
  Büro-Kachel „🤍 Freud & Leid“. Fälle (kc_club_fl_faelle) mit Checkliste (kc_club_fl_schritte), nur Clubleitung.
  - Registry FL_ARTEN: Freude (runder Geburtstag, Jubiläum, Geburt, Hochzeit, Ehejubiläum, Prüfung, Ruhestand, wieder
    gesund) und Leid (Tod eines Mitglieds, Tod eines nahen Angehörigen, Krankheit, Unfall) mit vorgeschlagenen Schritten
    (Rolle Clubsprecher/Kassenwart/Admin, „Aufruf an alle“; Frist sofort/Tage/Termin/nächste Sitzung), 100 € bei Todesfall.
  - Anlegen in drei Schritten; Schritte mit Zuständigem werden als Aufgabe angelegt (vorhandene Mitteilung/Erinnerung,
    „Meine Aufgaben“), Abhaken im Fall erledigt auch die Aufgabe.
  - „📣 Mitglieder informieren“: Textvorschlag, bei Leid Pflicht-Bestätigung „mit der Familie abgesprochen“, betroffenes
    Mitglied bekommt die Leid-Nachricht nicht; bei Todesfall optional Abordnung („Wer kommt mit?“) als Hilfe-Aufruf
    (neue Hilfe-Art „Abordnung / Begleitung“), Zusagen erscheinen im Fall.
  - Briefbogen-Vorlagen: Beileid, Gute Besserung, Geburt, Hochzeit; Gruß „In stiller Anteilnahme“.
  - Sitzung vorbereiten schlägt nach dem Tod eines Mitglieds (90 Tage) „Gedenken an … (Schweigeminute)“ vor.
  - Abschließen legt den Fall als Textdatei im Vereinsordner „Admin <Jahr>“, Register „Freud & Leid“, ab.
- DB: Migration 20261002_kc_club_v1320_freud_leid.sql (2 Tabellen, RLS ohne Policies, Spiegel-Regeln).

## 1.31.0 – 2026-10-02 (DEV)

- KC-CLUB-BUERO-MITGLIEDERLISTE (Wunsch Hansi): Büro-Kachel „📇 Mitgliederliste drucken“. Server buero_mitgliederliste
  (nur Clubleitung, protokolliert): aktive Mitglieder mit Ämtern, Eintritt (KC Manager), Geburtstag nur bei Freigabe;
  Kontaktdaten nach denselben Regeln wie die Mitglieder-Seite (eigene, Admin, sonst nur Freigegebenes mit Recht
  „Kontakte sehen“) – nicht freigegebene Angaben bleiben leer und werden nur gezählt. Arten als Registry: Übersicht,
  Telefonliste, Adressliste, Unterschriftenliste, Abhakliste (mit eigener Überschrift); Sortierung nach Name/Eintritt;
  Vorschau am Bildschirm, Druck über die Druckvorschau; Telefon-/Adressliste mit Fußzeile „vertraulich“.

## 1.30.0 – 2026-10-02 (DEV)

- KC-CLUB-RUNDER-GEBURTSTAG (Wunsch Hansi „bau den Schalter für runde Geburtstage ein“): neue freiwillige Freigabe je
  Mitglied (kc_club_freigaben, Bereich 'runder_geburtstag', Aktion runder_geburtstag_freigabe, Schalter in den
  Einstellungen unter „Meinen Geburtstag anzeigen“). Nur mit dieser Freigabe zeigt das Büro (nur Clubleitung) bei runden
  Geburtstagen (ab 18: jede volle 10, ab 65 auch jede 5) das Alter – auch wenn der Geburtstag sonst nicht öffentlich ist.
  Ohne Freigabe bleibt alles wie bisher (nie ein Jahr). Glückwunsch-Texte, Brief und Druckliste nennen dann „zum 60.“.
- DB: Migration 20261002_kc_club_v1300_runder_geburtstag.sql (Check-Erweiterung, rein additiv).

## 1.29.0 – 2026-10-02 (DEV)

- KC-CLUB-BUERO-FESTE (Wunsch Hansi): Büro-Kachel „🎂 Geburtstage & Jubiläen“. Server buero_feste (nur Clubleitung):
  Geburtstage nur von Mitgliedern mit Freigabe (wie überall, nur Tag/Monat, kein Jahr – Anzahl ohne Freigabe wird nur
  gezählt), Vereinsjubiläen aus dem Eintrittsdatum (joinedAt) im KC Manager, gleiche Namenszuordnung wie bei Aktionen,
  runde Jubiläen (alle 5 Jahre) hervorgehoben; Zeitraum 30/60/90 Tage oder ein Jahr, inkl. der letzten 7 Tage.
  Antippen → Glückwunsch als Nachricht (vorbereiteter Text im Zweier-Chat, nichts automatisch), Glückwunschkarte als
  Brief (Briefbogen, Vorlage passend vorbelegt) oder Gruß an der Pinnwand. Liste mit „☐ gratuliert“ zum Ausdrucken.
  Büro-Startseite zeigt „🎉 Heute: …“.

## 1.28.0 – 2026-10-02 (DEV)

- KC-CLUB-BUERO-NACHHER (Wunsch Hansi „Protokoll-Foto und Aufgaben verteilen“): Büro-Bereich „📄 Nach der Sitzung“ mit
  Kacheln 📸 Protokoll-Foto, ✔️ Aufgaben verteilen, 📢 Protokoll veröffentlichen. Sitzungen der letzten 90 Tage zur
  Auswahl (Server buero_nachher, nur Clubleitung); fehlt das Protokoll, legt die vorhandene Vorlage den Entwurf an.
  Eine Seite mit drei Schritten: 1) Foto direkt mit der Kamera, aus der Galerie oder als Datei (vorhandene Protokoll-
  Anlagen); 2) Aufgaben: Wer (Chips, mehrere), Was (Chips aus der Tagesordnung + Feld), Bis wann (1/2 Wochen, bis zur
  nächsten Sitzung, Datum) – vorhandene aufgabe_speichern; Mitteilen wie bisher beim Veröffentlichen, zusätzlich
  „📨 Jetzt schon mitteilen“ (buero_aufgaben_mitteilen, nutzt aufgabenMitteilen, je Aufgabe nur einmal); 3) Protokoll
  öffnen & veröffentlichen. „👉 Nächster Schritt“ im Büro weist nach einer Sitzung auf Foto/Veröffentlichen hin.

## 1.27.0 – 2026-10-02 (DEV)

- KC-CLUB-BUERO-TERMINE (Wunsch Hansi): Büro-Bereich „📅 Termine bearbeiten“ – kommende Termine (aus treffen_liste) als
  Kacheln mit Zu-/Absagen; Info-Fenster mit Wer kommt/vielleicht/abgesagt und Knöpfen Ändern (vorhandenes Termin-Formular),
  Sitzung vorbereiten, Einladung, Erinnern, Absagen; „＋ Neuer Termin“, Kalender, Terminfindung.
- KC-CLUB-BUERO-KONTAKT: „👥 Mitglieder kontaktieren“ – Gruppen-Chips (Alle, Gerade online, zur nächsten Sitzung: kommen /
  ohne Antwort / abgesagt, je Amt) und Einzelauswahl; Wege: Nachricht (vorhandene „Neue Nachricht“ mit vorbelegten
  Empfängern und Push/Mail-Wahl), Anrufen/WhatsApp (Mitglieder-Seite mit deren Freigaberegeln – das Büro zeigt keine
  zusätzlichen Kontaktdaten), Brief (Briefbogen mit Namen), Pinnwand-Zettel. Gesendet wird nichts ohne eigenes Absenden.

## 1.26.0 – 2026-10-02 (DEV)

- KC-CLUB-BUERO-EINGANG (Wunsch Hansi „bau den Eingang“): eigene Büro-Seite „📥 Eingang“ – Ausleih-Anfragen (entscheiden),
  genehmigte Ausleihen mit fälliger Abholung, offene Vorschläge, Hilfe-Aufrufe mit zu wenigen Helfern als kleine Kacheln;
  Antippen öffnet die vorhandenen Info-Fenster mit allen Knöpfen, danach frischt sich der Eingang selbst auf. Archiv-Prüfung,
  offene Aufgaben und Protokoll-Entwürfe als Sprung-Kacheln. Keine zweite Datenhaltung (vorhandene Listen-Aktionen).
- KC-CLUB-BRIEFBOGEN: Brief mit Logo im Büro. Vorlagen-Registry (leer, Spendenübergabe, Dankeschön, Einladung,
  Glückwunsch), Anrede- und Gruß-Kacheln, Empfänger/Ort/Datum/Betreff/Text, Unterschrift mit Amt, Absender- und Fußzeile.
  Entwurf bleibt auf dem Gerät erhalten; Absender/Fuß/Name/Amt per Einstellung „briefbogen“ für alle Geräte merkbar.
  Druck über die Druckvorschau mit eigenem Briefkopf (DIN-5008-nah, Absenderzeile über der Anschrift für Fensterumschläge).

## 1.25.0 – 2026-10-02 (DEV)

- KC-CLUB-BUERO (Wunsch Hansi, Freigabe „ganze Clubleitung, feste Punkte passen, so bauen“): Büro für Clubsprecher,
  Kassenwart und Admin (ICH.vorstand).
  - Begrüßung beim App-Start („Guten Morgen/Tag/Abend, <Vorname>! Möchtest du etwas im Büro erledigen?“) einmal je
    Start, nicht nach Sprung-Links, nicht über anderen Fenstern; je Gerät abschaltbar. „Nein“ → normale Club-App.
  - Büro-Startseite: nächste Sitzung mit Zu-/Absagen, „👉 Nächster Schritt“ (vorbereiten → Einladung → Erinnerung),
    Kacheln Sitzung vorbereiten, Vorlage drucken, Einladung, Erinnern, Protokolle, Termine; Eingang mit Zahlen
    (Ausleih-Anfragen, offene Vorschläge, Hilfe-Aufrufe, Archiv-Prüfung, offene Aufgaben, Protokoll-Entwürfe).
  - Sitzung vorbereiten: Anwesenheit (Zusagen vorangehakt), Entschuldigte mit Grund, Anmerkung zum letzten Protokoll
    (Vorschlag aus dessen Stand) + offene Aufgaben, Tagesordnung = Begrüßung, Genehmigung des letzten Protokolls,
    Bericht des Kassenwarts, Vorschläge der Sitzung, Verschiedenes (▲▼✕, weitere Vorschläge per Chip, eigener Punkt),
    Schreiblinien 0/3/5/8/12. Speichern legt den Protokoll-Entwurf an bzw. führt ihn vor der Sitzung mit (veröffentlichte
    Protokolle und Entwürfe nach Sitzungsbeginn bleiben unberührt). Danach Auswahl: drucken / Einladung / Entwurf öffnen.
  - Druckvorlage (Druckvorschau wie gewohnt): Logo + Köcheclub Werne, Titel/Datum/Ort, Anwesenheit mit Kästchen,
    Entschuldigt, Gäste, Anmerkung, offene Aufgaben, TOPs mit Schreiblinien, Beschlüsse, Unterschriften.
  - Einladung/Erinnerung: Vorschau, persönliche Zeile, Weg (Einstellung/Push/E-Mail/beides), Senden erst nach
    Bestätigung; Erinnerung nur an Mitglieder ohne Antwort. Zeitpunkt wird gemerkt.
- DB: Migration 20261002_kc_club_v1250_buero.sql (kc_club_buero_sitzung, RLS ohne Policies, Spiegel-Regel).

## 1.24.1 – 2026-10-02 (DEV)

- KC-CLUB-THEMA-FRAGE (Wunsch Hansi): nach „Ich komme“ bei einem Club-Treffen (nicht bei Veranstaltungen, nicht beim
  Zurücknehmen) fragt ein Fenster „Möchtest du … ein Thema vorschlagen?“. „Ja“ öffnet die Vorschläge mit dem Hinweis
  „Deine Vorschläge sind immer willkommen! Tippe jetzt oben rechts auf „＋ Neu“ … Es kommt auf die Tagesordnung für … Schon
  mal vielen Dank!“, „＋ Neu“ pulsiert kurz, und im Formular ist diese Sitzung schon vorgewählt. „Nein, danke“ schließt nur.

## 1.24.0 – 2026-10-02 (DEV)

- KC-CLUB-BILDSCHIRMFOTO (Wunsch Hansi „erst Symbol antippen, dann Inhalt suchen, dann Auslöser“): Schnellstart-Symbol
  und Suche „📸 Bildschirmfoto“ blenden einen verschiebbaren roten Auslöser ein (bleibt beim Wechseln der Ansicht).
  Auslöser → die App bildet den sichtbaren Bereich ab (Auslöser und Meldungen nicht mit drauf), Blitz, Vorschau.
  Darauf rot einzeichnen (Rückgängig/Alles weg), dann: in einen Chat (vorhandener Teilen-Weg), als Problem an Hansi
  (neue Nachricht an den Admin mit Bild und Ansicht/Version), ins Archiv (Archiv-Ablage), aufs Handy (Teilen bzw.
  Download) oder neues Foto. Nichts wird automatisch gesendet oder gespeichert.
- Grenzen (Web-App): nur die Club-App selbst, kein Video, keine fremden Apps – dafür bleibt die Handy-eigene Aufnahme.
- Bibliothek html2canvas 1.4.1 (MIT, kostenlos) liegt unter lib/ und wird erst beim ersten Foto geladen;
  SHA-256 e87e5507…38eab8cb, identisch von jsdelivr und unpkg geprüft. Keine Abhängigkeit zur Laufzeit von fremden Servern.

## 1.23.3 – 2026-10-02 (DEV)

- KC-CLUB-HELFEN/-LEIHEN Nachtrag (Abgleich mit dem besprochenen Vorschlag, Freigabe Hansi „bau 1, 2 und 3“):
  1. Schnellstart-Symbole „🙋 Hilfe suchen“ und „📦 Ausleihen“ (öffnen direkt das Formular; Formular wartet auf die Daten).
  2. Registry ergänzt: HILFE_ARTEN + „Tische tragen“, „Verkauf am Stand“ (Aufbauen/Abbauen umbenannt), LEIH_ZWECKE +
     „Nachbarschaftsfest“, „Vereinsfest“ → „Vereinsveranstaltung“; Schlüssel unverändert. Bei „Sonstiges“ ein kurzes Feld,
     das als „Wobei:“/„Wofür:“ in die Notiz kommt (keine Schemaänderung).
  3. App-Suche: Einträge „Hilfe suchen“, „Etwas ausleihen“ (mit allen Gegenständen als Suchwörter) und „Spendenprojekt
     vorschlagen“. „Unsere App auf einen Blick“ zeigt die Kachel schon automatisch (aus KACHELN).

## 1.23.2 – 2026-10-01 (DEV)

- KC-CLUB-MINIKACHELN (Wunsch Hansi): Hilfe-Aufrufe (offen und vorbei) als kleine Kacheln – Symbol, Wobei, Tag mit
  Zeitfenster-Symbol, Ort, „✋ n von m“; grüner Rand, wenn ich zugesagt habe oder genug Helfer da sind. Antippen öffnet das
  große Info-Fenster mit allen Einzelheiten und den Knöpfen; nach einer Antwort frischt es sich selbst auf.

## 1.23.1 – 2026-10-01 (DEV)

- KC-CLUB-MINIKACHELN (Wunsch Hansi „kleine Kacheln nebeneinander, anklicken → Info-Fenster groß und lesbar“):
  offene Spendenprojekte (Vorschläge), Ausleihen (offen/verliehen/erledigt/meine) und der Bestand erscheinen als kleine
  Kacheln im Raster. Antippen öffnet ein Blatt mit der vollständigen Karte in großer Schrift samt allen Knöpfen
  (unterstützen, genehmigen, ablehnen, abgeholt, zurück, stornieren); nach einer Aktion frischt sich das Blatt selbst auf.
  Bestand-Kachel: Anzahl, heute frei, eingeplante Zeiträume (ohne Namen) und „ausleihen“ mit vorgewähltem Gegenstand.

## 1.23.0 – 2026-10-01 (DEV)

- KC-CLUB-HELFEN (Wunsch Hansi „Wer kann helfen … nicht viel tippen, Auswahl als Kacheln“): Hilfe-Aufruf mit Kacheln für
  Wobei (Registry HILFE_ARTEN), Tag (Heute/Morgen/Wochentage/📅), Zeitfenster (Registry ZEITFENSTER), Anzahl per ＋/－,
  Ort aus zuletzt genutzten Orten. An alle (persönliche Benachrichtigungs-Einstellung) oder an alle gerade online (Push).
  Antwort „✋ Ich komme“/„🙅 Kann nicht“; wer aufruft, erfährt jede Zusage, „genug Helfer“ genau einmal.
- KC-CLUB-LEIHEN: Vereinsgegenstände ausleihen. Startbestand nach Hansis Freigabe: 8 Stehtische, 4 Bierzeltgarnituren,
  2 Pavillons, 1 Zapfanlage, 2 Glühweintöpfe, 3 Kühlboxen, 1 Gastrobräter, 4 Warmhaltebehälter, 3 Kabeltrommeln –
  die Clubleitung pflegt Anzahl/Gegenstände in der App (⚙️). „Noch frei“ je Zeitraum (genehmigte/abgeholte Ausleihen,
  ohne Namen), der Server lässt nie mehr als frei zu. Anfrage per Push + E-Mail an Clubsprecher, Kassenwart und Admin;
  eine Zusage genügt (nur die erste Entscheidung zählt), über die eigene Anfrage entscheidet jemand anderes. Ablehnen mit
  Begründungs-Kachel. Antrag und Bescheid als Textdatei im Vereinsordner „Admin <Jahr>“ und im persönlichen Ordner des
  Mitglieds, jeweils Register „Ausleihe“ (entsteht von selbst). Status abgeholt/zurück/storniert; Erinnerung am Rückgabetag.
- KC-CLUB-SPENDE: Vorschläge haben die neue Art „💝 Spende“ (jedes Mitglied): ein bis zehn Projekte mit Empfänger
  (Kachel – Kinderhospiz Lünen/Werne und bisher genutzte – oder „✏️ Andere“) und Betrag (50/100/250/500/1000 € oder
  eigener), Summe sichtbar. Wird wie ein Thema unterstützt und erscheint beim Treffen und im Protokoll-Vorschlag.
- Eine Kachel „🤝 Helfen & Leihen“ im Register Verein (Sprung #helfen).
- DB: Migration 20261001_kc_club_v1230_helfen_leihen.sql (4 Tabellen, RLS ohne Policies, Spiegel-Regeln; Vorschläge:
  Spalte spenden, art-Check um 'spende' erweitert). Rückweg steht in der Migration.

## 1.22.2 – 2026-10-01 (DEV)

- KC-CLUB-KONTRAST (Hinweis Hansi „kein guter Kontrast in Nachtsicht, immer leserlich“): SOS 112/110 im Nacht-Design
  dunkelrot mit heller Schrift statt hellrosa. Zentrale Schriftfarben --textRot/--textGruen/--textOrange/--textNotruf (Tag =
  bisherige Farben, Nacht = hell) für gewählte Reiter/Fußleiste, Status „verfügbar“, „online“, „schreibt …“, Schnellstart-
  Nummern, Install-Hinweis, Notfallpass-Titel. Dazu: Info-Knopf i, WA-Knopf, grauer Namenskreis, Post-it-Fußzeile und
  „WICHTIG“, Pinnwand-Zähler und das Grau der hellen Designs etwas dunkler. Geprüft mit einem automatischen Kontrast-Scan
  (WCAG 4,5:1, große Schrift 3:1) über 11 Seiten in allen 8 Designs, jeweils Tag und Nacht.

## 1.22.1 – 2026-10-01 (DEV)

- KC-CLUB-SICHERHEIT-ZUSTELLUNG (Wunsch Hansi „der Bericht muss mich erreichen“): Sicherheits-Check-Bericht geht immer per
  Push UND E-Mail an den Admin (sendenGewaehlt, unabhängig von der persönlichen Benachrichtigungs-Einstellung).
- KC-CLUB-SICHERHEIT-ARCHIV: jeder Bericht zusätzlich als Textdatei im Vereinsordner „Admin <Jahr>“ (art sonstiges, nur
  Clubleitung, Farbe 8), Register „Sicherheitscheck“; Ordner und Register entstehen beim ersten Bericht von selbst.
  Fehler beim Ablegen stoppen die Meldung nicht (Antwort „abgelegt: false“, Serverprotokoll).

## 1.22.0 – 2026-10-01 (DEV)

- KC-CLUB-TEILEN-ALLES (Wunsch Hansi „WhatsApp-Nachrichten in den Club-Chat“, Weg 1 – kostenlos, ohne Meta): „Teilen →
  Köcheclub“ nimmt jetzt Text (bis 4000 Zeichen), Links und Dateien jeder gängigen Art an (Fotos, PDF, Text, Office, Audio,
  WhatsApp-Chat-Export .txt/.zip). Danach Auswahl: 💬 in einen Club-Chat (Liste der Chats oder „Neue Nachricht“; Text und
  Dateien werden eingefügt, gesendet wird erst mit ➤), 📷 ins Fotoalbum (nur Fotos, wie bisher), 🗄️ ins eigene Archiv
  (Anlass „geteilt“; WhatsApp-Export wird erkannt und empfohlen). Manifest share_target erweitert (Android; iPhone erlaubt
  Web-Apps kein Teilen-Ziel). Service Worker speichert wie bisher nur kurz im eigenen Zwischenspeicher.
- KC-CLUB-NEU-ORANGE (Wunsch Hansi): Kennzahl „Neue Nachr.“ im großen Kopf-Feld oben links wird bei ungelesenen
  Nachrichten orange (sanftes Leuchten, bei „Bewegung reduzieren“ ruhig).

## 1.21.5 – 2026-10-01 (DEV)

- KC-CLUB-TIPPT-WELLE (Hinweis Hansi „Punkte bei ‚Steven schreibt‘ nicht animiert“): Ursache 1 – bei „Animationen
  reduzieren“ (auf vielen Android-Handys z. B. im Energiesparmodus an) standen die Punkte still; jetzt ruhige, langsamere
  Welle (2,2 s). Ursache 2 – die Anzeige wurde bei jedem Chat-Takt (2 s) neu gezeichnet und die Welle begann von vorn;
  jetzt nur noch bei Änderung. Gleiches für die Oszilloskop-Welle („nimmt eine Sprachnachricht auf“).

## 1.21.4 – 2026-10-01 (DEV)

- KC-CLUB-NEU-KACHEL (Wunsch Hansi): Kachel „💬 Kommunikation“ bzw. „Nachrichten“ (einfache Ansicht) bekommt bei ungelesenen
  Nachrichten einen anderen Hintergrund (hellgrün mit grünem Rand, sanftes Leuchten; Nacht-Design dunkelgrün; bei „Bewegung
  reduzieren“ ohne Leuchten). Registry-Merkmal neuFarbe an der Kachel; Farbe und Zahl ziehen beim Zählertakt sofort mit.

## 1.21.3 – 2026-10-01 (DEV)

- KC-CLUB-WA-SENDEN (Wunsch Hansi): grüner Knopf „WA“ in der Knopfzeile unter dem Schreibfeld. Kopiert den Text in die
  Zwischenablage und öffnet WhatsApp: im Einzel-Chat mit freigegebener Handynummer direkt bei der Person (vorhandener Weg
  whatsappWeitergeben), sonst WhatsApp mit dem Text zur Empfängerwahl (Android intent, iPhone whatsapp://, PC wa.me im neuen
  Tab). Der Text bleibt im Feld (Entwurf). Keine Nummern im Browser ohne Freigabe, kein neuer Serverweg.

## 1.21.2 – 2026-10-01 (DEV)

- KC-CLUB-ONLINE-RUNDE (Wunsch Hansi „temporäre Gruppe, z. B. mit allen online“): Startseite „Gerade online“ hat ab zwei
  Personen „💬 Mit allen N schreiben“ → neue Nachricht, alle gerade Online sind angehakt, Betreff „🟢 Runde TT.MM., HH:MM Uhr“
  (änderbar). Beim Schreiben zusätzlich die Schnellwahl „🟢 Alle gerade online“. Ergebnis ist ein gemeinsamer
  Mehrpersonen-Chat wie bisher (keine feste Gruppe, mit Farben je Absender); entfernen wie jeder Chat. Kein neuer Serverweg.

## 1.21.1 – 2026-10-01 (DEV)

- KC-CLUB-GRUPPE-FARBEN (Wunsch Hansi, wie WhatsApp): in Gruppen-Chats hat jeder Absender eine eigene Farbe – Name über der
  Nachricht und Streifen links an der Blase. Farben aus der Registry GRUPPEN_FARBEN (je Tag-/Nacht-Design lesbar), innerhalb
  einer Gruppe alle verschieden (Reihenfolge nach Name; ausgetretene Absender behalten eine feste Farbe aus dem Namen).
  Rot zuletzt, weil eigene Blasen rot sind. Einzel-Chats unverändert.

## 1.21.0 – 2026-10-01 (DEV)

- KC-CLUB-EINGABE-GROSS (Wunsch Hansi „Eingabe größer und breiter“): Schreibfeld im Chat oben über die volle Breite (2 Zeilen
  hoch, größere Schrift, wächst bis 40 % der Höhe) mit ➤ daneben; 📎 🎤 😊 🔔 als kleinere Knöpfe in einer Zeile darunter.
  Alle Knöpfe und Funktionen unverändert.
- KC-CLUB-ENTWURF-ANZEIGE: steht Text im Feld, der noch nicht gesendet ist, erscheint „✏️ Entwurf – noch nicht gesendet“;
  in der Chatliste steht bei solchen Chats „✏️ Entwurf: …“ statt der letzten Nachricht (wie WhatsApp). Grundlage ist der
  vorhandene Entwurfs-Speicher (KC-CLUB-ENTWURF 1.12.0, nur auf dem Gerät).

## 1.20.1 – 2026-10-01 (DEV)

- KC-CLUB-CHAT-KOPF (Wunsch Hansi): im Chat bleibt die Kopfzeile (‹, Name, 🔍, ⋮, Suchleiste, „zuletzt da“/Teilnehmer,
  Angeheftetes) beim Scrollen oben stehen (sticky, eigener Bereich #chatKopf). Sprung zu einer Nachricht (Antwort, Suche,
  Neue-Nachrichten-Linie) hält Abstand zur Kopfzeile (scroll-margin aus der gemessenen Kopfhöhe).

## 1.20.0 – 2026-10-01 (DEV)

- KC-CLUB-ZULETZT-DA (Wunsch Hansi: „eingeschaltet, alle drei Stellen“): „zuletzt da“ wie WhatsApp „zuletzt online“ –
  im Einzel-Chat oben (unter dem Namen), in der Mitgliederliste (klein, grau) und auf der Mitglieder-Seite. Server liefert nur
  grob: { online, tag, zeit nur für heute } bzw. „länger nicht da“ (> 30 Tage). Gegenseitig: wer Online- oder Zuletzt-Anzeige
  verbirgt, sieht sie auch bei anderen nicht. Neue Einstellung „zuletzt“ (Standard an) unter ⚙️ → Privatsphäre, auch über die
  Einstellungs-Suche. Ankündigung über „Neu in dieser Version“. Quelle zuletzt_gesehen (nur solange die App sichtbar offen ist).
  Admin-Angaben (genaue Zeit, Ansicht) unverändert.

## 1.19.0 – 2026-10-01 (DEV)

- KC-CLUB-ARCHIV-ABLAGE (Wunsch Hansi „alles einbauen“): neue Anlässe in der Registry ARCHIV_ABLAGE_ARTEN –
  💬 Chat (Verlauf als Textdatei UTF-8, auf Wunsch mit allen Dateien/Fotos; Chat-Menü „🗄️ Chat in mein Archiv legen“),
  📎 Dateien einer Nachricht (Nachrichtenmenü; beim ⭐ Merken einer Nachricht mit Datei fragt die App), 📷 Foto aus dem Album,
  📝 Protokoll (Text + auf Wunsch Protokoll-Dateien). Vor „Nur bei mir entfernen“, „Für alle löschen“, „Gruppe löschen“ und
  „Gruppe verlassen“ fragt die App „Vorher in dein persönliches Archiv ablegen?“ (Ja → ablegen, dann weiter · Nein → weiter ·
  Abbrechen). Klappt die Ablage nicht, wird erst nach Rückfrage gelöscht. Dateitypen, die das Archiv nicht annimmt
  (Sprachnachrichten), werden übersprungen und genannt. Weiter kein neuer Serverweg für die Ablage.
- KC-CLUB-ARCHIV-LOESCHEN: 🗑️ direkt an jedem Dokument (eigene Ordner bzw. Archivpflege), „🗑️ Register … löschen“ im
  gewählten Register (Inhalt verschieben oder mit in den Papierkorb; das letzte Register bleibt), im Papierkorb ❌ endgültig
  löschen und „❌ Papierkorb leeren“. Server: neue Aktion archiv_endgueltig – nur für Einträge im Papierkorb, gleiche Rechte
  wie Wiederherstellen, Metadaten-Sicherung (geloescht) + Protokoll; der Speicher (persönlich 50 MB) wird sofort frei.
- KC-CLUB-INFO-SPRUNG (Wunsch Hansi): im farbigen Kopfbereich unter dem einfachen Pfeil ‹ bzw. › je ein Doppelpfeil –
  « springt sofort zur ersten, » sofort zur letzten Karte. Einfache Ansicht unverändert (dort keine Pfeile).
- KC-CLUB-SI-MUETZE (Hinweis Hansi „hakt, wackelt, zu unruhig“): Ursache 1 – die Anzeige wurde bei jedem Prüfschritt neu
  gezeichnet und die Drehung begann von vorn; jetzt läuft die Phase weiter (negative Verzögerung aus der Uhrzeit). Ursache 2 –
  harte Achsen-Sprünge; jetzt zwei Ebenen: Mütze kippt gleichmäßig (5 s), die Kippachse wandert langsam im Kreis (14 s) –
  waagerecht → diagonal → senkrecht fließend. Nachtrag (Hinweis Hansi „obere Mütze ruckelt“): Der Sicherheits-Check zeichnet
  nicht mehr alles neu – Kopf, Uhren, Liste und Knöpfe sind eigene Bereiche; während der Prüfung ändern sich nur der Zähler
  und fertig gewordene Zeilen, die laufenden Mützen bleiben unangetastet (gemessen: gleichmäßig, keine Sprünge).
## 1.18.2 – 2026-10-01 (DEV)

- KC-DP-WUNSCH-SPERRE (Freigabe Hansi „Claude macht die DB, Codex das Programm“): Reservierung je Wunsch-Eingang gegen zwei
  gleichzeitig importierende DP2-PCs. Migration 20261001_kc_dp_wunsch_eingang_sperre.sql (live, nur additiv): Spalten
  claim_token/claimed_by/claimed_device/claimed_revision/claimed_until/taken_claim; neue RPCs kc_dp_wish_inbox_claim
  (1–30 Min., gilt nur für die reservierte Revision, gleiches Gerät verlängert), kc_dp_wish_inbox_ack_claimed (quittiert nur mit
  eigener Reservierung: stale | not_open | claim_lost), kc_dp_wish_inbox_release; pending/receipt um Reservierungsstand und
  takenClaim ergänzt. kc_dp_wish_inbox_ack (Build ≤ 254) unverändert außer: aktive fremde Reservierung → claimed statt Quittierung.
  Kollegenfreigabe unverändert (interne Hilfsfunktion, Kopieren nie erweitert). Probe-Transaktion mit 17 Fällen, zurückgerollt.
  Auftrag an Codex: docs/DP2_CODEX_AUFTRAG_BUILD255_SPERRE.md (DP2 Build 255). Test 152. RC: DP2 255, Wiederherstellungsprüfung,
  Live-Handtest offen.

## 1.18.1 – 2026-10-01 (DEV)

- KC-CLUB-DIENSTWUNSCH: DP2 auf Build 254 RC übernommen (dp3 `3945960`, Zweig codex/club-app-interface, Wunsch Hansi):
  „🖨️ Meine Angaben ausdrucken (PDF mit QR)“ am Ende von Tagesmatrix, Twinkey-Auswertung und einfachem Assistenten –
  Sicherheitsabfrage, dann PDF-Vorschau (Desktop eingebettet, Handy PDF-Anzeige), erst danach Drucken/Speichern.
  Ausgefüllter V12-Bogen mit QR oben rechts (gleiche Profil-ID wie die Papiermatrix) und Original-Kochmütze.
  Ganzer Sperrtag: Bildschirmwege sperrten V/H/B bereits; Papierimport übernimmt am Sperrtag kein V/H/B und keine Zeiten
  (zur Prüfung sichtbar). dienstwunsch.html: CSP frame-src blob: (nur die selbst erzeugte PDF-Vorschau). Test 151.
  RC: Live-Handtest, Kollegenfreigabe, serverseitige Claim-Prüfung offen.

## 1.18.0 – 2026-10-01 (DEV)

- KC-CLUB-ARCHIV-ABLAGE (Wunsch Hansi): gemeinsame Rückfrage „🗄️ Auch in deinen Archiv-Ordner legen?“ mit Auswahl
  Ordner (nur eigene, besitzer = ich) und Register (Vorschlag je Anlass aus der Registry ARCHIV_ABLAGE_ARTEN). Erster Anlass:
  Erstattungsantrag (Kilometer, Einkauf, Auslagen) – erst NACH erfolgreichem Versand an den Kassenwart. Abgelegt werden der
  Antrag als gut lesbares Bild (Positionen, Summe, Auszahlung, Empfänger) und jeder Beleg (Foto verkleinert / PDF), Register
  „Rechnungen“. Dateien entstehen erst bei „Ja“; die Beleg-Dateien bleiben bis dahin nur im Speicher des Geräts. Kein neuer
  Serverweg (archiv_liste + archiv_hochladen). Archiv nicht erreichbar → Frage entfällt, der Antrag ist trotzdem verschickt.
- KC-CLUB-SI-MUETZE (Wunsch Hansi): Sicherheits-Check zeigt während der Prüfung statt der drehenden Sanduhr die originale
  Kochmütze, die in alle Richtungen wirbelt (waagerecht, senkrecht, diagonal, flach). Bei „Bewegung reduzieren“ langsam.

## 1.17.2 – 2026-10-01 (DEV)

- KC-CLUB-DIENSTWUNSCH: DP2 auf Build 253 RC übernommen (dp3 `d50ed58`, Zweig codex/club-app-interface, Freigabe Hansi) –
  gemeinsamer Stand aus Club-App-Schnittstelle/Button-Logik/Konfliktprüfung (250–252 RC) und den PDF-/QR-Korrekturen des
  DP2-Hauptzweigs (Build 250/251). Neu in dp2/: document-identity, qrcode-generator, personalized-forms, adapters/pdf.js –
  „Meine Unterlagen → Papiermatrix/Handschriftprobe“ im Twinkey erzeugt den Bogen (vorher „Cannot read properties of
  undefined (reading 'downloadPdf')“). Alle bisherigen DP2-Dateien unverändert. RC: Live-Handtest, zentrale
  Kollegenfreigabe und serverseitige Claim-/Versionsprüfung offen. Test 149.

## 1.17.1 – 2026-10-01 (DEV)

- KC-CLUB-ARCHIV-MUETZE (Wunsch Hansi): originale Köcheclub-Kochmütze (kc-kochmuetze-weiss.webp, schon im Offline-Speicher)
  als Aufdruck auf jedem Ordnerrücken im Archiv-Regal (über dem Griffloch) und im Kopf eines geöffneten Ordners.
  Nur Darstellung, keine Funktionsänderung.

## 1.17.0 – 2026-10-01 (DEV)

- KC-CLUB-NOTFALLPASS-ARCHIV (Wunsch Hansi): Notfallpass-Anzeige hat „🗄️ In mein Archiv kopieren“. Vorher deutlicher
  Hinweis: Bisher nur auf dem Handy – die Kopie liegt danach auch auf dem Server, im Spiegel und in Sicherungen, sichtbar
  nur für den Besitzer (und wem er den Ordner freigibt). Auswahl nur eigener Ordner (besitzer = ich) und deren Register
  (Vorschlag „Gesundheit“/„Sonstiges“, kein Freitext). Abgelegt wird ein gut lesbares PNG (nur ausgefüllte Angaben,
  Notfallkontakt, Stand). Liegt schon ein Notfallpass im Ordner, wird darauf hingewiesen (alter bleibt, löschen im Archiv).
  Kein neuer Serverweg: archiv_liste + archiv_hochladen (Rechte, 50-MB-Grenze, Dateityp prüft der Server). Der Pass auf
  dem Gerät bleibt unverändert.

## 1.16.1 – 2026-10-01 (DEV)

- KC-CLUB-DIENSTWUNSCH: Nachtrag zu DP2 Build 251 RC übernommen (dp3 c0d279a, docs/CLAUDE-BUTTON-LOGIK-NACHTRAG.md):
  gesperrtes „Weiter“ in Twinkey zeigt den Grund („Bitte mit oder ohne Twinkey wählen.“ / „Bitte zuerst eine Aufgabe
  wählen.“). Prüfsummen in dp2/QUELLE.json erneuert. Lader: Cache-Schlüssel der DP2-Dateien enthält jetzt auch die
  Commit-Kennung – Nachträge bei gleicher Build-Nummer kommen ohne alte Dateien aus dem Browser-Speicher an.

## 1.16.0 – 2026-10-01 (DEV)

- KC-CLUB-NAHE-REGION (Hinweis Hansi „sieht langsam aus“): Messung in den Server-Protokollen: Aufrufe aus Deutschland liefen
  in Frankfurt (eu-central-1), die Datenbank steht in London (eu-west-2) – jede Abfrage pendelte; Median 571 ms, p90 1,4 s.
  App und Dienstwunsch-Lader rufen den Server jetzt mit forceFunctionRegion=SERVER_REGION (eu-west-2) auf (Supabase
  Regional Invocation, kostenlos). Rückweg: Netzfehler oder 502–504 aus der Region → sofort Standardweg, 10 Min. dabei
  bleiben (kein Single Point of Failure). Beim Datenbank-Umzug SERVER_REGION mitändern.
- KC-CLUB-SCHNELLSTART-SERVER: init zählt ungelesene Nachrichten aller Unterhaltungen gleichzeitig statt nacheinander.
- Sicherheits-Check: zwei Messungen, der bessere Wert zählt (Aufwecken des Servers verfälscht die Anzeige nicht);
  Index für die Prüffunktion (Migration 20261001_kc_club_v1160_index).

## 1.15.0 – 2026-10-01 (DEV)

- KC-CLUB-SICHERHEIT-MELDEN (Wunsch Hansi): Knopf „📨 Ergebnis an Hansi (Admin) senden“ im Sicherheits-Check (hervorgehoben,
  wenn ein Punkt nicht bestätigt ist; freiwillige Notiz). Neue Aktion sicherheit_melden: Server prüft selbst neu, nur
  Verbindung/Version/Antwortzeit kommen vom Gerät; Push + Mail an alle Admins (Weg wie „Problem melden“), Eintrag
  „fehler_sicherheit“ im Fehlerprotokoll; höchstens 3 Meldungen je Person und Stunde.

## 1.14.0 – 2026-10-01 (DEV)

- KC-CLUB-SICHERHEIT (Wunsch Hansi): Kachel „🛡️ Sicherheits-Check“ im Reiter Programme. Prüfreihe mit 11 echten Prüfungen
  (Registry SICHERHEIT_PRUEFUNGEN): verschlüsselte Verbindung, persönlicher Zugang, Server erreichbar, Daten-Speicher
  antwortet, verschlüsselte Speicherung (fest eingebaut), Zugriffsschutz auf allen Tabellen (RLS), Sicherungskopie im
  zweiten Speicher aktuell (< 8 Std.), nächtliche Sicherung (< 30 Std.), Wiederherstellung getestet (< 8 Tage, kein Fehler
  danach), Überwachung aktiv (< 2 Std.), App-Version aktuell. Zwei Rundinstrumente (Antwortzeit App↔Server, Daten-Speicher;
  schnell/normal/langsam immer mit Wort). „Alle Systeme laufen einwandfrei“ nur, wenn jede Zeile OK ist; Unbekanntes =
  „nicht geprüft“ (Regel 11). Keine Datenbank-/Anbieternamen. Neue Aktion sicherheit_pruefen + SQL-Funktion
  kc_club_sicherheit_status (nur Server).

## 1.13.0 – 2026-10-01 (DEV)

- KC-CLUB-DIENSTWUNSCH: DP2-Twinkey auf Build 251 RC übernommen (Sire65/dp3, Branch codex/club-app-interface, Commit
  f893f5d, 0.20.0-build251) mit tools/dp2-twinkey-uebernehmen.mjs – unverändert, Prüfsummen in dp2/QUELLE.json.
  Neu: src/ui/member-button-logic.js (Button-Logik: eigene Daten, Berechtigung, Wunschphase, gültige Eingaben; gesperrte
  Knöpfe grau, nicht anklickbar, mit kurzem Grund), Ergänzungen in auth.js, role-ux.js, simple-wish-assistant.js,
  wish-assistant.js, mobile-wish-matrix.js. Club-App-Seite: Einträge aus dem Wunsch-Eingang mit Status „offen“ zählen
  als vorhandene eigene Angaben (daten.js liefert sie DP2 als aktive Wünsche) – „offen“ heißt nur „Übernahme durch DP2
  noch nicht bestätigt“. Browserprüfung 320/768/1280 px: mit offenen Angaben, ohne Angaben, Phase geschlossen (mit/ohne).
  Offen (DP2/Codex): zentrale Verarbeitung der Kollegenfreigabe, Live-Handtest.

## 1.12.0 – 2026-10-01 (DEV)

- KC-CLUB-RUHIGE-EINGABE (Wunsch Hansi): Leiste „Benachrichtigen: Push/E-Mail/WhatsApp“ nur noch auf Wunsch über ein
  kleines 🔔 im Eingabefeld; 🔔 leuchtet, wenn etwas Besonderes gewählt ist. Nach dem Senden/Chatwechsel wieder zu.
- KC-CLUB-NEU-LINIE: beim Öffnen eines Chats Linie „⬇ Neue Nachrichten“ über der ersten ungelesenen Nachricht anderer,
  die App springt dorthin (Server liefert gelesenBis = Lesestand vor dem Öffnen).
- KC-CLUB-ENTWURF: halb geschriebener Text je Chat auf dem Gerät gemerkt (localStorage je Person, höchstens 50 Chats),
  beim Senden gelöscht.
- KC-CLUB-NACH-UNTEN: ⬇️-Knopf, wenn man > 500 px nach oben gescrollt hat (mit Punkt bei neuer Nachricht); neue Nachrichten
  reißen beim Lesen älterer nicht mehr nach unten.
- KC-CLUB-SPRACHTEMPO: Sprachnachrichten mit 1× / 1,5× / 2× abspielen (Wahl auf dem Gerät gemerkt).
- Behoben: Stimmen, Bearbeitungen, Anheften/Merken anderer werden jetzt beim regelmäßigen Nachladen sichtbar (Neuzeichnen
  auch bei diesen Änderungen); Ton nur bei wirklich neuen Nachrichten.

## 1.11.0 – 2026-10-01 (DEV)

- KC-CLUB-CHAT-ABSTAND (Hinweis Hansi): Abstand unter der letzten Nachricht = gemessene Höhe des Eingabebereichs + Luft
  (ResizeObserver, CSS-Variable --chatUnten) statt fester 160 px – nichts stößt mehr unten an.
- KC-CLUB-TIPPT-WELLE (Wunsch Hansi): „schreibt …“ größer (Punkte 9 px, Schrift 0,98 rem, fett) und als Welle animiert
  (bei „Bewegung reduzieren“ ohne Animation).
- KC-CLUB-SPRICHT (Wunsch Hansi): Wer eine Sprachnachricht aufnimmt, meldet das wie „schreibt …“ (tippen mit sprache,
  alle 3 s, nur bei sichtbarem Online-Status); die anderen sehen „🎤 … nimmt eine Sprachnachricht auf“ mit laufender
  Oszilloskop-Welle. Eigene Aufnahme: echtes Oszilloskop der Mikrofon-Welle (Web Audio, lokal). Migration: kc_club_tippen.art.

## 1.10.0 – 2026-10-01 (DEV)

- KC-CLUB-ANHEFTEN (Wunsch Hansi, wie WhatsApp): Nachricht antippen → „📌 Oben anheften“ / „Lösen“; bis zu 3 je
  Unterhaltung (die älteste fällt heraus), Leiste oben im Chat springt zur Nachricht. Aktion nachricht_anheften.
- KC-CLUB-MERKEN: „⭐ Merken“ – eigene Merkliste (nur für mich) unter 💬 → ⭐, antippen öffnet Chat und springt hin.
  Aktionen nachricht_merken, gemerkte_nachrichten (nur aus Unterhaltungen, in denen ich noch bin).
- KC-CLUB-CHATUMFRAGE: 📎 → „📊 Abstimmung“ – Frage + 2–8 Antworten, einfach oder mehrfach; Stimmen mit Namen und Balken,
  nochmal tippen nimmt die Stimme zurück. nachricht_senden mit umfrage, Aktion chat_umfrage_stimmen. Nicht bearbeitbar.
- KC-CLUB-KONTAKT: 📎 → „👤 Kontakt teilen“ – Karte mit „📇 Kontakt ansehen“ (vorhandene Mitglieder-Ansicht mit ihren
  Freigaberegeln) und „💬 Schreiben“. Gespeichert wird nur die Person, keine Telefonnummer/Mail.
- Migration 20261001_kc_club_v1100_nachrichten_extras (5 neue Tabellen, Kern-Tabelle unverändert, RLS, Spiegel).

## 1.9.0 – 2026-10-01 (DEV)

- KC-CLUB-BEARBEITEN (Wunsch Hansi, wie WhatsApp): eigene Nachricht mit Text bis 15 Minuten nach dem Senden ändern
  (Antipp-Menü „✏️ Bearbeiten“). Neue Aktion nachricht_bearbeiten (nur Absender, auch Admin nicht bei fremden); Kennzeichen
  in neuer Tabelle kc_club_nachricht_bearbeitet (Kern-Tabelle kc_communication_messages ohne neue Spalte). Kein neuer
  Push/keine Mail; Protokoll ohne Text. Blase zeigt „bearbeitet“.
- KC-CLUB-STUMM (Wunsch Hansi): Unterhaltung stummschalten (⋮ → 8 Stunden / 1 Woche / immer, „Wieder laut“). Server
  schickt Stummgeschalteten keinen Push und keine Mail (@Erwähnung kommt trotzdem); kein Ton in der App (init liefert
  ungelesenLaut). 🔕 an Chat-Titel und in der Liste. Einstellung „stumm“ (geräteübergreifend).
- KC-CLUB-CHATSUCHE (Wunsch Hansi): 🔍 oben im Chat – sucht in Text und Absender der Nachrichten dieses Gesprächs
  (Umlaut-tolerant, ab 2 Zeichen), Treffer markiert, „x von y“, ▲▼/Enter springt. Schließt beim Verlassen/Wechseln.

## 1.8.3 – 2026-10-01 (DEV)

- KC-CLUB-NA-SEITE (Wunsch Hansi, wie WhatsApp): neben jeder Nachricht (fremde rechts, eigene links) ein gebogener Pfeil
  → kleines Menü „↪️ Weiterleiten“ / „📋 Kopieren“, und ein blaues „i“ → vorhandene Info (geschrieben von, Empfänger,
  gelesen, Zustellung; nachricht_details). Beim Wischen ausgeblendet. Antipp-Menü unverändert.

## 1.8.2 – 2026-10-01 (DEV)

- KC-CLUB-KOPIEREN (Wunsch Hansi): Im Antipp-Menü einer Nachricht „📋 Kopieren“ (nur bei Nachrichten mit Text) – Text in die
  Zwischenablage, um ihn in einem anderen Chat (auch außerhalb der App) einzufügen. Rückfall: alter Kopierweg bzw. Text zum
  Markieren. „↪️ Weiterleiten“ (innerhalb der App) bleibt unverändert.

## 1.8.1 – 2026-10-01 (DEV)

- KC-CLUB-SCHNELLSTART (Wunsch Hansi): Schnellstart ist keine extra Kachel unter dem Info-Feld mehr, sondern eine eigene
  Karte im farbigen Info-Feld oben (Registry INFO_ALLE, zweite Karte nach „Nächstes Treffen“, nur erweiterte Ansicht und
  wenn eingeschaltet). Als Startkarte wählbar unter ⚙️ („Beim Start zeigen“). Ansichtswechsel aktualisiert die Karten.

## 1.8.0 – 2026-10-01 (DEV)

- KC-CLUB-SCHNELLSTART (Wunsch Hansi): große Kachel „⚡ Schnellstart“ oben auf der Startseite – nur in der erweiterten Ansicht.
  8 Symbole ohne lange Texte, jedes startet direkt die Funktion (Schreiben, nächster Termin, neuer Zettel, Foto hochladen,
  Standort, mein Dienst, Suche, SOS). Registry SCHNELL (16 Einträge, mit Rechte-Bezug „kachel“); jedes Mitglied wählt unter
  ⚙️ → „⚡ Schnellstart“ bis zu 8 aus (Reihenfolge = Antipp-Reihenfolge), an/aus, Grundeinstellung. Server-Einstellung
  „schnellstart“ (geräteübergreifend).
- KC-CLUB-ANKLOPFEN-ERLAUBEN (Wunsch Hansi): ⚙️ → Privatsphäre „👋 Anklopfen erlauben“ (Standard an). Aus: Server lehnt
  Anklopfen ab (409 mit Hinweis), Online-Liste zeigt 🔕 statt 👋 (antippen = Nachricht schreiben). Einstellung „anklopfen“.
- KC-CLUB-ANKLOPFEN-ANTWORT (Wunsch Hansi): Im Anklopf-Fenster Kurzantwort-Kacheln (Server-Registry KLOPF_ANTWORTEN:
  beschäftigt, melde mich später, ruf mich an, schreib mir, unterwegs, am Herd) – antippen beendet das Anklopfen sofort,
  der Anklopfende sieht den Text. Neue Spalte kc_club_anklopfen.antwort (Migration 20261001_kc_club_v180_anklopfen_antwort).
  „Annehmen“ und „⏳ Später“ bleiben unverändert.
- KC-CLUB-ANKLOPFTON (Wunsch Hansi): Anklopfton wählbar (Registry KLOPF_TOENE: Holz-Klopfen, Ding-Dong, Gong, Glöckchen,
  kein Ton) mit „▶ Testton“ unter ⚙️ → Privatsphäre; im Gerät erzeugt (Web Audio, keine Dateien), spielt beim Anklopfen.

## 1.7.2 – 2026-10-01 (DEV)

- KC-CLUB-SOS-WO (Live-Test Hansi: Hausnummer vom Nachbarhaus): Die App schickt die GPS-Genauigkeit mit; Photon nennt
  zusätzlich bis zu 2 Nachbarhäuser derselben Straße im Messumkreis (10–40 m), z. B. „Friedensstraße 4 (oder Nachbarhaus
  Nr. 6, 2)“, dazu der Hinweis „Hausnummer vor Ort kurz prüfen“. Foto-Ortsnamen unverändert.

## 1.7.1 – 2026-10-01 (DEV)

- KC-CLUB-SOS-WO (Live-Test Hansi: „Adresse nicht gefunden“): Nominatim lehnt Anfragen vom Supabase-Server ab (403).
  Neuer kostenloser Adapter „photon“ (komoot, OpenStreetMap-Daten) im Ortsnamen-Registry ORTSNAMEN, Reihenfolge
  ORTSNAME_QUELLEN = photon → nominatim (Ausweichweg) über ortsnameHolen(); gilt auch für Foto-Ortsnamen.
  Nominatim mit „genau“ jetzt auf Hausnummer-Ebene (zoom 18).

## 1.7.0 – 2026-10-01 (DEV)

- KC-CLUB-SOS-WO (Wunsch Hansi): In der SOS-Ansicht „📍 Wo bin ich?“ – eigener Standort (Koordinaten, Genauigkeit, Uhrzeit)
  mit Adresse inkl. Hausnummer/PLZ zum Vorlesen am Telefon; Kopieren, SMS, WhatsApp, Karte. Nur auf Knopfdruck, nichts wird
  gespeichert, Koordinaten nicht im Protokoll. Neue Aktion sos_ort (gleicher kostenloser Ortsnamen-Adapter wie Fotos, Option
  „genau“; höchstens 1 Abfrage je Person in 5 s, global 1/s für OpenStreetMap).
- KC-CLUB-NOTFALLPASS (Wunsch Hansi): freiwilliger Notfallpass (Geburtsdatum, Blutgruppe, Allergien, Vorerkrankungen,
  Medikamente, Hinweise, Hausarzt, Krankenkasse, Organspende; Registry NFP_FELDER) + eigener Notfallkontakt. Gesundheitsdaten
  bleiben NUR auf dem Gerät (localStorage je Person) – kein Server, keine Sicherung, kein Neon, auch nicht für die Clubleitung.
  Großanzeige zum Vorzeigen; Hinweis auf den Notfallpass des Handys (Sperrbildschirm). Beide auch über die Suche erreichbar.
- Entscheidung Hansi: Notfallkontakte anderer Mitglieder sieht weiterhin nur die Clubleitung.

## 1.6.0 – 2026-10-01 (DEV)

- KC-CLUB-KLAPPE-UNTEN (Wunsch Hansi): Jeder Klappbereich (details[data-klappe], außer inneren Admin-Bereichen) hat unten
  „▴ Zuklappen“ – klappt zu und springt zur Überschrift; festgestellte Bereiche (🔒) bleiben wie sie sind.
- KC-CLUB-WISCHEN (Wunsch Hansi, wie WhatsApp): Nachricht nach rechts wischen = antworten, nach links = löschen mit
  Rückfrage: eigene (Admin: jede) „für alle“ oder „nur für mich“, fremde „nur für mich“ (neue Aktion nachricht_ausblenden →
  kc_communication_message_hidden; „unterhaltung“ lässt diese weg). Nur waagerechtes Wischen zählt. Im Antipp-Menü neu „🗑️ Löschen“.
- KC-CLUB-SOS (Wunsch Hansi): rote Kachel „SOS – Notfall“ (auch in der einfachen Ansicht). Notrufnummern als Registry NOTRUFE
  (112, 110, 116 117, Giftnotruf NRW, Apotheken-Notdienst, Telefonseelsorge, Sperr-Notruf) – Wählen nur nach deutlicher
  Rückfrage „ECHTER ANRUF – KEIN TEST“, nie direkt per Link. Mitglieder im Notfall erreichen (Anruf, SMS, WhatsApp, Festnetz,
  E-Mail) – nur freigegebene Angaben (gleiche Regeln wie „Mitglied ansehen“); Notfallkontakte unverändert nur für die
  Clubleitung, alle anderen sehen die Clubleitung oben. Neue Aktion sos_kontakte (protokolliert „sos_geoeffnet“).
- KC-CLUB-IOS-CHROME (Meldung Thomas Hess: nutzt nur Chrome, Safari deaktiviert): Kein „auf dem iPhone nur Safari“ mehr. Seit
  iOS 16.4 legt auch Chrome die App auf den Home-Bildschirm (dann mit Push). Neuer Hinweis „ios_chrome“ mit Anleitung (höchstens
  1× pro Woche, nur im Browser), Push-/Installationshinweise, Einstellungen und Kurzanleitung nennen Safari oder Chrome;
  Firefox/Opera auf dem iPhone: Tipp „Safari oder Chrome“. Start-Fehlerseite ohne „bitte Safari“.
- KC-CLUB-TIPP (Wunsch Hansi): Tipp des Tages beim Öffnen (höchstens einer je Tag, nach dem Einstiegs-Tipp, Registry TIPPS):
  „👉 Jetzt ausprobieren“ führt hin, „✔ Kenne ich“, „⏰ Später“ (3 Tage), „🔕 Keine Tipps mehr“. Schalter unter ⚙️ → „Das
  Wichtigste“ (Standard an). Server-Einstellung „tipps“ (geräteübergreifend).

## 1.5.1 – 2026-10-01 (DEV)

- KC-CLUB-ARCHIV-PERSOENLICH (Live-Test): Wer eine gültige Freigabe nur für ein Register/Dokument hat und etwas anderes öffnen
  will, bekommt jetzt „Dieses Dokument ist für dich nicht freigegeben.“ (vorher fälschlich „Freigabe abgelaufen“) – kein Alarm.
  Freigabe-Fenster: Kästchen für Personen/Gruppen sauber neben dem Namen; Admin-Übersicht einzeilig.

## 1.5.0 – 2026-10-01 (DEV)

- KC-CLUB-ARCHIV-PERSOENLICH (Wunsch Hansi): Im Archiv hat jedes Mitglied eigene Ordner je Jahr (Rücken: Jahr oben, Name
  darunter) mit Registern (Urkunden, Schulungen, Rechnungen, Fotos, Sonstiges – frei änderbar). Der Ordner des laufenden Jahres
  entsteht beim ersten Öffnen; „＋ weiteres Jahr“ legt ältere an. Zugriff nur der Besitzer – auch Admin und Clubsprecher nicht
  (Entscheidung Hansi); der Admin sieht nur eine Übersicht (Name, Jahr, Anzahl, Größe). Fremdversuch (Ordner, Dokument oder
  Datei-Link) → abgewiesen, Protokoll „archiv_fremdzugriff“, Meldung an Besitzer und Admins (höchstens 1× pro Stunde je
  Person/Ordner); abgelaufene Freigabe → nur Hinweis. Freigabe auf Zeit (1 Tag … 365 Tage, nie unbefristet) für Personen
  und/oder Gruppen: ganzer Ordner, Register oder einzelnes Dokument; optional „hineinlegen zur Prüfung“ – der Besitzer bekommt
  Bescheid und nimmt an oder lehnt ab (abgelehnt = gelöscht, Absender wird informiert; Einreicher kann zurückziehen).
  50 MB je Mitglied. Globale Suche zeigt persönliche Dokumente nur im Rahmen dieser Rechte. Neue Tabelle
  kc_club_archiv_freigaben, Spalten kc_club_archiv_ordner.besitzer und kc_club_archiv_dokumente.status
  (Migration 20261001_kc_club_v150_persoenliche_ordner).

## DB/Spiegel – 2026-10-01 (ohne App-Build)

- KC-SPIEGEL-AUTO (Freigabe Hansi „1 ja, 2 ja“): Neue Tabellen kommen automatisch in den Neon-Spiegel. Die Abdeckungsprüfung
  (alle 30 Min.) legt für Tabellen ohne Regel selbst eine an (gespiegelt + gesichert, im 6-h-Lauf); Tabellen mit Spalten, die
  nach Geheimnis oder Standort aussehen, werden angemeldet, aber nicht gespiegelt („AUTO-HALT“, WARNING bis zur Admin-Freigabe).
  Der Spiegel-Arbeiter (v26) legt fehlende Neon-Tabellen und -Spalten vor dem Kopieren additiv an (nie löschen, nie Typ ändern;
  Datenschutz-Tabellen mit fester Spaltenliste: nur melden). Neu: kc_db_mirror_spalten (nur service_role). Erste Anwendung:
  8 Tabellen aus Club-App 0.92–1.4.1 und kc_club_mitfahrt_suche gespiegelt; kc_club_standort_live bewusst nicht (GPS).
  Migration 20261001_kc_core_spiegel_auto_aufnahme; Rückweg: kc_db_mirror_abdeckung_check_vor_autoaufnahme.

## 1.4.1 – 2026-10-01 (DEV)

- KC-CLUB-ARCHIV-SUCHE (Wunsch Hansi: „Bau die Suche im Archiv auch als Live-Suche“): Regal-Suche wie die globale
  Suche – ab 2 Buchstaben, Umlaut-tolerant (gleiche Vereinheitlichung suNorm), alle Wörter müssen vorkommen (Titel,
  Stichworte, Register, Dateiname, Ordner, Jahr), Treffer markiert, Ergebnis gruppiert (Ordner · Dokumente ·
  Vereinsleben) mit Zahl; Esc leert. Neu: „In diesem Ordner suchen“ (ab 4 Einträgen, im gewählten Register).
  Fix: Markierung teilt den Text vor dem Escapen (vorher konnte z. B. „am“ in „&amp;“ markiert werden). Test 130.

## 1.4.0 – 2026-10-01 (DEV)

- KC-CLUB-SUCHE (Wunsch Hansi: globale Live-Suche ab 2 Buchstaben + erweiterte Suche; „Lupe als kleines Symbol, keine
  große Kachel“): 🔍 klein im Kopf der Startseite und rechts in jeder Unterseiten-Kopfzeile. Suchfenster mit Live-Treffern
  (0,3 s nach dem Tippen, je Bereich 4, markiert, Umlaut-tolerant: ä=a=ae, ß=ss), Sprung direkt an die Stelle (Nachricht
  in der Unterhaltung hervorgehoben, Protokoll, Aktion, Archiv-Ordner …), letzte 5 Suchen nur auf dem Gerät.
  „⚙️ Filter“ = erweiterte Suche: Wo suchen (Kästchen, Alle/Keine, gemerkt), Zeitraum, Von wem, nur mit Anhang,
  genaue Wortfolge, Sortierung; Ergebnis-Reiter je Bereich. App-Funktionen (Kacheln, Einstellungen) ohne Server.
  Rechte wie auf den Seiten (Nachrichten nur eigene Unterhaltungen, private Termine nur eigene, Protokolle nur mit
  Recht, Archiv „nur Clubleitung“). Suchbegriffe werden nicht gespeichert. Migration v130 (kc_club_norm,
  kc_club_suche – nur service_role; angewendet). Server 1.4.0. Test 129.

## 1.3.0 – 2026-09-30 (DEV)

- KC-CLUB-GRUPPE-LOESCHEN (Wunsch Hansi: „Angelegte Gruppen müssen löschbar sein“): im ⋮-Menü einer Gruppe
  „🗑️ Gruppe löschen (für alle)“ für die, die die Gruppe verwalten dürfen (angelegt von mir, Clubsprecher, Kassenwart,
  Admin). Vorher vollständige Sicherung (Gruppe, Teilnehmer, Nachrichten) im Änderungsprotokoll; die anderen
  Mitglieder bekommen einen kurzen Hinweis. Server 1.3.0. Test 128.

## 1.2.0 – 2026-09-30 (DEV)

- KC-CLUB-ARCHIV (Wunsch Hansi: „Kachel Archiv … wie verschiedene Ordner mit Register, Jahreszahl drauf und Inhalt“):
  Kachel 🗄️ Archiv (Reihe „Verein“, hinter Protokolle). Regal je Jahr mit Aktenordner-Rücken (Farbe, Jahreszahl, Inhalt),
  im Ordner Register-Reiter.
  - Automatisch „🤖 Vereinsleben JJJJ“ (nur lesen, nichts doppelt gespeichert): vergangene Treffen (mit Anzahl dabei),
    veröffentlichte Protokolle (nur mit Protokoll-Recht), beendete Abstimmungen mit Ergebnis, vergangene Aktionen,
    erledigte Pinnwand-Zettel (nur eigene/an mich/an alle), Anhänge aus meinen Unterhaltungen, meine vergangenen Dienste.
  - Von Hand: Ordner mit Art (Satzung & Recht, Versammlungen, Verträge & Versicherungen, Finanzen, Presse, Chronik,
    Sonstiges – je mit Standard-Registern, änderbar), Jahr, Beschriftung, Farbe, „🔒 nur Vorstand“ (Clubsprecher,
    Kassenwart, Admin). Dokumente: PDF/Foto/Word/Excel bis 8 MB, „Papier fotografieren“ (verkleinert), Titel, Datum,
    Register, Stichworte; verschieben in anderen Ordner. Pflegen dürfen Clubsprecher und Admin (Server prüft).
  - Suche über Titel/Stichworte/Inhalt, Filter Jahr + Art (gemerkt). Papierkorb 30 Tage, danach entfernt die Wartung
    Dateien und Zeilen. Dateien im Anlagen-Kern; anlage_url prüft die Ordner-Sichtbarkeit.
  Migration v120 (kc_club_archiv_ordner, kc_club_archiv_dokumente; angewendet). Server 1.2.0. Test 127.

## 1.1.0 – 2026-09-30 (DEV)

- KC-CLUB-WIEDERHOLUNG (Wunsch Hansi: „Wiederholen fehlt bei Terminen – täglich, wöchentlich, jährlich usw.“):
  Auswahl täglich / werktags (Mo–Fr) / wöchentlich / alle 2 Wochen / monatlich (gleicher Tag; 31. → Monatsletzter) /
  monatlich am gleichen Wochentag („jeden 1. Freitag“, „letzter Mittwoch“) / jährlich (29.02. → 28.02.), optional „bis“.
  Immer in deutscher Ortszeit (18:00 bleibt 18:00 über die Zeitumstellung).
  - Private Termine: echte Reihe (eine Zeile; der Server rechnet die Termine je Zeitraum aus). Löschen fragt „nur diesen
    Termin“ (Ausnahme) oder „ganze Reihe“; Ändern gilt für die ganze Reihe. Kalender-Abo mit RRULE/EXDATE (TZID
    Europe/Berlin). Erinnerung je Termin der Reihe (erinnert_bis).
  - Club-Termine (Clubleitung, beim Anlegen): Terminreihe = einzelne Treffen mit eigenen Zu-/Absagen, „bis“ Pflicht,
    höchstens 1 Jahr / 60 Termine, EINE Sammel-Einladung an alle statt vieler Einzelmeldungen.
  Migration v101 (4 Spalten an kc_club_privattermine, angewendet). Server 1.1.0. Test 126.

## 1.0.0 – 2026-09-30 (DEV)

- KC-CLUB-PRIVATTERMIN (Wunsch Hansi: „Privateintrag im Kalender – Neu und dann Häkchen privat“): „＋ Neu“ in Termine jetzt für
  alle. Mitglieder legen private Einträge an (Häkchen „🔒 Privat“ fest gesetzt, Hinweis auf „📨 Anfrage“); die Clubleitung
  wechselt per Häkchen zwischen Club-Termin (bisheriges Formular, unverändert) und privatem Eintrag. Felder: Titel, Datum,
  Uhrzeit, bis (auch mehrtägig), ganztägig, Ort, Notiz, Erinnerung (15 Min … 2 Tage vorher). Sichtbar NUR für die Person
  selbst: Liste „🔒 Meine privaten Termine“, Kalender (blau-grauer Punkt), „Demnächst“, eigenes Kalender-Abo (CLASS:PRIVATE).
  Erinnerung über die Wartung an die Person selbst (nach ihren Benachrichtigungs-Einstellungen, Ruhezeit gilt).
  Server-Aktionen privattermin_speichern / _loeschen / privattermine_liste – jeweils nur eigene (person_id = ich); kein
  Protokolleintrag mit Inhalt. Tabelle kc_club_privattermine (Migration v100, angewendet). Server 1.0.0. Test 125.

## 0.99.2 – 2026-09-30 (DEV)

- Text (Wunsch Hansi): Hinweissatz zur Nutzungsstatistik unter ⚙️ Mehr → Privatsphäre entfernt. Keine Funktionsänderung.

## 0.99.1 – 2026-09-30 (DEV)

- Texte (Wunsch Hansi): Update-Beschreibung für 0.93.0 (Fehlerprotokoll) und 0.99.0 (Nutzungsstatistik) lautet für die
  Mitglieder „🔧 Kleine Systemverbesserung“; unter ⚙️ Mehr → Privatsphäre entfällt der Zusatz „Hansi als Admin sieht alles“.
  Keine Funktionsänderung.

## 0.99.0 – 2026-09-30 (DEV)

- KC-CLUB-NUTZUNG (Freigabe Hansi: „Statistik ohne Namen“, statt Ansichten je Mitglied mitzuschreiben): jede geöffnete
  Ansicht zählt +1 auf dem Gerät, gebündelt alle 2 Min. bzw. beim Verlassen (nutzung_melden). Der Server addiert nur
  Tag + Bereich + Anzahl (RPC kc_club_nutzung_zaehlen, nur mit Server-Schlüssel ausführbar) – kein Protokoll-Eintrag,
  keine Person, kein Gerät, keine Uhrzeit. Nur bekannte Bereiche, je Meldung höchstens 200.
  Admin: „📊 Nutzung der App – ohne Namen“ (Admin-Zentrale / Admin-Einstellungen): 7 / 30 / 90 Tage, Öffnungen je Tag als
  Säulen, je Bereich als Balken, „nicht geöffnet“-Liste. Transparenz-Satz unter ⚙️ Mehr → Privatsphäre.
  Migration 20260930_kc_club_v99 (Tabelle kc_club_nutzung + Zählfunktion, angewendet). Server 0.99.0. Test 124.

## 0.98.1 – 2026-09-30 (DEV)

- KC-CLUB-FEHLERPROTOKOLL, zweiter Fehlalarm behoben (Fund im Protokoll bei Frank: 3 Nachrichten geschrieben, trotzdem
  „Klappt etwas nicht?“ – Android lädt die App beim Wechsel in eine andere App oft komplett neu). Läuft die App nach der
  Anmeldung 30 s ordentlich, wird der Zähler für „mehrmals geöffnet“ geleert; es zählen nur noch Starts, die nicht
  richtig durchlaufen. Test 123.

## 0.98.0 – 2026-09-30 (DEV)

Vorschlag „Weiterleiten/Umleiten“, Punkte 1, 5 und 3 (Freigabe Hansi):
- KC-CLUB-WEITERLEITEN: Nachricht antippen → „↪️ Weiterleiten“ → letzte Unterhaltungen oder Mitglied (Suche). Text mit Vermerk
  „↪️ Weitergeleitet von …“, Anhänge gehen mit. Server: nachricht_senden nimmt weiterleiten_von; Anhänge der Quell-Nachricht
  sind nur erlaubt, wenn man Teilnehmer ihrer Unterhaltung ist. Protokoll „nachricht_weitergeleitet“.
- KC-CLUB-RUHEZEIT: ⚙️ Mehr → Benachrichtigungen → „🌙 Nicht stören“ von/bis (Standard 22–7 Uhr), „📣 @Erwähnungen trotzdem“.
  In der Zeit kein Push: „Push + Mail“ → nur Mail; nur Push → gezählt; nach dem Ende schickt die Wartung EINE Sammelmeldung
  „🌅 Während Nicht stören: n Meldungen“. Anrufe/Anklopfen laufen nicht über senden() und kommen immer durch. Gilt in
  senden() und sendenGewaehlt() (zentral), Einstellung ruhezeit / Zähler ruhezeit_verpasst in kc_club_person_einstellung.
- KC-CLUB-GERAETE: „📱 Meine Geräte“ listet die eigenen aktiven Push-Geräte (Art, Browser, seit, zuletzt zugestellt, Fehler,
  „dieses Gerät“) mit „Entfernen“ (setzt das Abo inaktiv; beim eigenen Gerät wird es auch im Browser abgemeldet).
  Aktionen geraete_liste / geraet_entfernen (nur eigene Geräte).
- Server 0.98.0. Test 122. Keine Datenbank-Änderung.

## 0.97.0 – 2026-09-30 (DEV)

WhatsApp-Vergleich, die drei wichtigsten Punkte (Freigabe Hansi):
- KC-CLUB-REAKTION: Nachricht antippen → kleines Menü mit 6 Schnell-Reaktionen (👍 ❤️ 😂 😮 😢 🙏), „↩️ Antworten“ und
  „ℹ️ Details“ (vorher öffnete Antippen direkt die Details – jetzt einen Schritt darunter). Je Person eine Reaktion je
  Nachricht, gleiche nochmal = weg, andere = ersetzt. Chips unter der Nachricht mit Anzahl, Namen beim Draufhalten, eigene
  hervorgehoben, antippen setzt/entfernt. Autor bekommt bei neuer Reaktion eine Meldung (Bereich Nachrichten, nach seinen
  Einstellungen). Tabelle kc_club_reaktionen, Aktion reaktion_setzen.
- KC-CLUB-ANTWORT: „Antworten“ zeigt über dem Schreibfeld „↩️ Antwort an …“ (✕ bricht ab); die gesendete Nachricht trägt
  oben ein Zitat, antippen springt zur Bezugsnachricht (leuchtet kurz auf). Nutzt die vorhandene Communicator-Spalte
  kc_communication_messages.reply_to_message_id (nur Nachrichten derselben Unterhaltung), keine neue Tabelle.
- KC-CLUB-ERWAEHNUNG: in Unterhaltungen mit mehreren anderen schlägt „@“ beim Tippen die Teilnehmer vor; @Namen werden in
  der Nachricht hervorgehoben, Nachrichten, in denen ich erwähnt bin, bekommen einen goldenen Rahmen. Erwähnte bekommen statt
  der normalen eine eigene Meldung „📣 … hat dich erwähnt“ – immer aufs Handy (ohne App: Mail). Nur Teilnehmer der
  Unterhaltung. Tabelle kc_club_erwaehnungen.
- Migration 20260930_kc_club_v97 (nur neue Tabellen, angewendet). Server 0.97.0. Test 121.

## 0.96.0 – 2026-09-30 (DEV)

- KC-CLUB-ONLINE-LED (Wunsch Hansi: „unter die 3 LEDs eine weitere, grün wenn jemand online ist – sonst sieht man es nicht,
  wenn man andere Fenster aufhat; die andere Anzeige muss so bleiben“): vierte LED in derselben Leiste, durch einen kleinen
  Strich abgesetzt. Grün (sanft pulsierend) = mindestens eine andere Person online; grau = niemand, Online-Anzeige
  ausgeschaltet oder Stand älter als 3 Minuten (unbekannt wird nie als OK gezeigt). Antippen öffnet „Gerade online“
  (Anklopfen, Anruf, Nachricht); die drei Verbindungs-LEDs öffnen wie bisher das Verbindungsfenster. Die Online-Anzeige
  auf der Startseite ist unverändert. Weil die LED-Leiste nur auf der Startseite steht, zeigt zusätzlich die untere Leiste in
  JEDER Ansicht einen grünen Punkt mit Anzahl auf „👥 Mitglieder“. Test 120.

## 0.95.1 – 2026-09-30 (DEV)

- KC-CLUB-FEHLERPROTOKOLL, Fehlalarm behoben (Fund im Protokoll bei Steven): Nach „Jetzt aktualisieren“ zählte das Neuladen als
  weiteres Öffnen → „3× in 10 Minuten“ → Hinweis „Klappt etwas nicht?“, obwohl alles lief. jetztAktualisieren() setzt jetzt
  einen Merker, der Fehlerfänger zählt diesen einen Neustart nicht mit. Test 119.

## 0.95.0 – 2026-09-30 (DEV)

- KC-CLUB-EMOJI (Wunsch Hansi: „Emojis in die Nachrichten – gut angeordnet, nicht zu unübersichtlich“): 😊-Knopf neben dem
  Schreibfeld im Chat öffnet eine kompakte Auswahl direkt über der Eingabe: oben 7 Reiter (🕘 Zuletzt, 😀 Gesichter,
  👍 Hände, ❤️ Herzen, 🍲 Essen & Trinken, 🎉 Feiern, 🚗 Unterwegs, ✅ Zeichen), darunter je 24 Emojis in 8 Spalten.
  Tippen fügt an der Schreibstelle ein, das Feld bleibt offen; ✕, Senden oder Tippen daneben schließt es. „Zuletzt“
  merkt sich die 16 zuletzt benutzten auf dem Gerät. Alle anderen Emojis weiter über die Handy-Tastatur. Test 118.

## 0.94.0 – 2026-09-30 (DEV)

- KC-CLUB-NACHRICHT-INFO (Wunsch Hansi: „wenn man auf eine geschriebene Nachricht klickt, Info-Fenster mit Details – wann,
  womit rausgegangen, angekommen, bestätigt“). Nachricht antippen (nicht auf Bild/Knopf) → Fenster mit: geschrieben um;
  je Empfänger gelesen in der App ja/nein (zuletzt geöffnet); für Absender und Admin je Zustellweg (🔔 Push / ✉️ E-Mail)
  an wen, Stand und Verlauf mit Sekunden (in Auftrag gegeben → wird verschickt → verschickt über web.de/Push-Dienst →
  angezeigt → geöffnet), Fehler, Versuche, nächster Versuch, aufgegeben. Hinweis, dass Mail-Öffnen nicht zurückgemeldet wird.
  Mail-Adressen werden nie angezeigt, nur Namen. Quelle: kc_communication_requests / delivery_events (Communicator).
  Neue Server-Aktion nachricht_details (nur Teilnehmer der Unterhaltung). Server 0.94.0. Test 117.

## 0.93.0 – 2026-09-30 (DEV)

- KC-CLUB-FEHLERPROTOKOLL (Auftrag Hansi nach Fund bei Marianne – 6× in Chrome auf dem iPhone geöffnet, alte Version 0.69,
  keine Fehlermeldung gespeichert: „jede Kleinigkeit ins Protokoll … gezielte Hilfeschritte, keine unverständlichen Meldungen“).
  - Fehlerfänger als eigenes ES5-Skript ganz oben im <head>: läuft auch, wenn die App auf einem alten Gerät gar nicht startet.
    Schreibt mit: Skriptfehler (Datei/Zeile/Stapel), unbehandelte Fehler, nicht geladene Dateien, mehrfaches Öffnen (≥3 in
    10 Min), gesperrter Speicher (privater Modus), Start hängt (12 s) bzw. App-Programm gar nicht angelaufen (dann einfache
    Hilfe-Seite mit „Nochmal versuchen“). Sammelt auf dem Gerät (max. 60), schickt gebündelt (25 je Sendung, jede Minute,
    beim Verlassen, nach der Anmeldung sofort) – angemeldet mit Namen (fehler_melden), sonst anonym mit Geräte-Kennung
    (fehler_anonym, max. 40/Std. je Gerät, 150/Std. gesamt). Gleiche Meldung höchstens alle 30 s. Nie Zugangsdaten:
    Server filtert Schlüssel-Felder und ?k=… aus allen Texten.
  - App ergänzt: jede fehlgeschlagene Serveranfrage (außer Hintergrund-Takt) bzw. „offline“, alte Version, Service Worker
    nicht eingerichtet, Start langsam (>6 s), ohne/ungültiger Link, einmal je Sitzung Gerät & Browser (System, Browser,
    installiert?, Push-Erlaubnis, Speicher, Bildschirm, Sprache, Netz).
  - Hilfe-Schritte statt Fehlermeldungen (je Hinweis höchstens 1× am Tag, wird mitprotokolliert): iPhone/iPad in Chrome/
    Firefox/Edge/Opera → „Bitte in Safari öffnen“ mit „🔗 Meinen Link kopieren“ und Schritten bis zum Home-Bildschirm;
    eingebauter Mini-Browser (WhatsApp/Facebook/Instagram) → im richtigen Browser öffnen; Android mit Firefox u. a. → Chrome;
    privater Modus; mehrfaches Öffnen → „Klappt etwas nicht?“ mit Checkliste und „Problem melden“.
  - 🆘 „Problem melden“ (App-Info und Hilfe-Fenster): Admins bekommen Push/Mail mit Gerät, Browser, Version (hilfe_anfordern,
    max. 3/Std.).
  - Alte Version: Hinweis oben jetzt mit „🔄 Jetzt aktualisieren“ direkt (vorher nur „Was ist neu?“).
  - Admin: „🩺 Fehlerprotokoll & Startprobleme“ (Admin-Zentrale und Admin-Einstellungen) – je Mitglied Auffälligkeiten,
    verständlich übersetzt mit „→ was tun“, 24 Std. / 2 / 7 / 14 Tage (Aktion fehlerprotokoll, nur Admin).
- Server 0.93.0. Test 116.

## 0.92.0 – 2026-09-30 (DEV)

- KC-CLUB-TERMINANFRAGE (Wunsch Hansi: „Terminanfrage an Mitglied senden mit Datum, Zeit, Anlass, Ort, ja, nein, vielleicht –
  jeder an jeden oder mehrere oder Gruppe“). Vorher gab es nur Treffen und Terminfindung – beide nur für die Clubleitung
  und immer an alle. Neu: Termine → „📨 Anfrage“ bzw. Kommunikationszentrale → 📨 Termin (übernimmt die dort Gewählten).
  Empfänger antworten ✅ Ja / 🤔 Vielleicht / ❌ Nein (mit freiwilliger Notiz, nochmal tippen nimmt zurück), der Absender
  bekommt jede Antwort als Push/Mail und kann absagen. Anfragen stehen im Kalender (goldener Punkt), unter „Demnächst“ und
  im Kalender-Abo (eigene und zugesagte). Erinnerung am Vortag an Zugesagte, „bitte noch antworten“ an Offene.
  Eigene Tabellen kc_club_terminanfragen / kc_club_terminanfrage_empfaenger – bewusst NICHT kc_club_treffen, damit eine
  private Anfrage nie in Liste, Kalender-Abo oder „Demnächst“ aller Mitglieder erscheint. Grenzen: 100 Empfänger je
  Anfrage, 30 Anfragen je Person und Tag.
- KC-CLUB-STANDORT: 📍 in der Kommunikationszentrale – „Jetzt einmal senden“ (normale Nachricht mit OpenStreetMap-Link,
  keine neue Tabelle) oder live teilen für 15 Min / 1 Std / bis ich beende (höchstens 8 Std). Nur an die Gewählten, je
  Person eine laufende Freigabe, roter Balken oben mit „Beenden“ (löscht sofort). Ansicht „📍 Standorte“ (#standort) mit
  Karte, „aktualisiert vor … Min“, ab 5 Min als veraltet markiert. Live nur, solange die App offen ist (Web-Apps werden im
  Hintergrund nicht geortet). Abgelaufene Standorte löscht die Wartung; im Protokoll stehen nie Koordinaten.
  Kostenlos: Karten von OpenStreetMap, kein Kartendienst mit Schlüssel. Tabelle kc_club_standort_live.
- Migration 20260930_kc_club_v92_terminanfrage_standort (nur neue Tabellen, RLS an, Zugriff nur über kc-club).
  Die neuen Tabellen sind absichtlich (noch) nicht im Neon-Spiegel; Standorte sollen nie gespiegelt werden.
- Server 0.92.0. Tests 113–115.

## 0.91.0 – 2026-09-30 (DEV)

- KC-CLUB-PINNWAND-KNOPF (Fund Hansi: „das Schild 4/4 verdeckt den ＋-Knopf, man weiß nicht, was man da machen soll“):
  Bei vier hängenden Zetteln wurde aus „＋ Zettel“ der Text „4/4 Zettel“. Jetzt heißt der Knopf immer „＋ Zettel“, der
  Stand (z. B. 1/4, 4/4) steht klein im Knopf; bei vollen Plätzen erklärt eine Zeile unter dem Kopf, dass erst ein eigener
  Zettel abgenommen werden muss. Das Formular mit „einen abnehmen“ bleibt unverändert. Test 112.

## DB – 2026-09-30 (ohne App-Build)

- KC-DP-WUNSCH-FREIGABE (Freigabe Hansi, Übergabe aus DP2 Build 250 RC): kc_dp_wish_inbox_ack speichert bei erfolgreicher,
  revisionsgleicher Übernahme die Kollegenfreigabe aus dem Eingang (nur inbox.org_id + inbox.person_id, nur wenn angegeben;
  Nein schaltet auch Kopieren ab) im selben Vorgang wie die Quittierung; Rückgabe zusätzlich sharingApplied.
  Neu: kc_dp_wish_inbox_receipt (lesender Übernahmebeleg inkl. takenByMe) für verlorene ACK-Antworten. Migration
  20260930_kc_dp_wunsch_eingang_freigabe; Rückweg: ack-Fassung aus 20260929_kc_dp_wunsch_eingang_v1.

## 0.90.0 – 2026-09-30 (DEV)

- KC-CLUB-ANTWORT-ZURUECK (Fund Hansi): Eine Antwort auf einen Termin ließ sich nur wechseln, nicht zurücknehmen. Jetzt:
  nochmal auf die eigene (farbige) Antwort tippen → Rückfrage → Antwort weg (treffen_antwort mit antwort "keine" löscht die
  Zeile in kc_club_teilnahme, eine offene Mitfahr-Suche entfällt). Wie bei „Kann nicht“ fragt die App, ob ein gebuchter Platz
  frei werden bzw. die eigene Fahrt abgesagt werden soll. Hinweiszeile unter den Knöpfen, sobald man geantwortet hat.

## 0.89.0 – 2026-09-30 (DEV)

- KC-CLUB-DATENSTROM (Wunsch Hansi: „Im KC Check sieht man die Bewegung der Club-App nicht“): Die Route „KC Club-App →
  Supabase“ im KC System Check (flow-live-v4) bewegt sich nur bei positiver Differenz von traffic_tx zwischen zwei
  Lebenszeichen – die App schickte bisher trafficTx null. Jetzt zählt die App jede beantwortete Anfrage an den Club-Server
  (ohne das Lebenszeichen selbst) als steigenden Zähler je Gerät (localStorage kc_club_verkehr_v1) und schickt ihn mit dem
  Lebenszeichen; der Server gibt ihn als trafficTx weiter und meldet sourceId „kc-clubapp“ statt der Geräte-ID (Gerät bleibt
  instanceId). Echte Telemetrie, keine Animation ohne Messung. Empfänger und KC System Check unverändert.

## 0.88.0 – 2026-09-30 (DEV)

- KC-CLUB-HERZ-ABSTAND (Fund Hansi): In der Lebenszeichen-Liste stand „fehlt – rate_limited“, 2 s nach einem angekommenen
  Lebenszeichen. Ursache: Rückkehr in die App (visibilitychange) und Minutentakt schickten kurz nacheinander; der Empfänger
  kicc-program-heartbeat nimmt je Gerät höchstens eins pro 5 s an. herzSenden hält jetzt 20 s Mindestabstand und schickt nie
  zwei gleichzeitig. Empfänger und Server unverändert.

## 0.87.0 – 2026-09-30 (DEV)

- KC-CLUB-MITFAHRT-SUCHE (Wunsch Hansi): Mitfahren bei allen Terminen ausgebaut. Neu „🙋 Ich suche eine Mitfahrgelegenheit“
  (Tabelle kc_club_mitfahrt_suche, Migration 20260930_kc_club_mitfahrt_suche, RLS ohne Richtlinien; Spiegel-/Sicherungsregel
  vorerst aus – Neon-Tabelle fehlt noch). Fahrer mit freien Plätzen bekommen Bescheid, wenn jemand sucht; Suchende bekommen
  Bescheid bei einem neuen Angebot. „🚗 Ich biete eine Mitfahrgelegenheit“ (bisher „Ich fahre und nehme mit“), Platz buchen
  „🚗 Platz buchen“ / „✔ Platz gebucht · freigeben“ mit Anzeige der freien Plätze. Bei Treffen erst nach „✅ Ich komme“
  (Server mitfahrtErlaubt, App-Hinweis); Veranstaltungen und Aktionen ohne Zusage. Wer bucht oder selbst fährt, sucht nicht mehr.
  Absage („Kann nicht“): Frage „Soll ich den gebuchten Platz wieder freigeben?“ bzw. ob die eigene Fahrt abgesagt werden soll;
  eine offene Suche entfällt automatisch (treffen_antwort).

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
