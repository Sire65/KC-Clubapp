# Änderungen

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
