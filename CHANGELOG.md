# Änderungen

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
