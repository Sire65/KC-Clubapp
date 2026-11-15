# Konzept: Wichteln zu Weihnachten mit Glücksrad

Stand 15.11.2026 · Kennzeichen **KC-CLUB-WICHTELN** · Wunschliste **#90** · Status: **Konzept mit Antworten Hansi (15.11.2026) – Entwurf Rad: [wichtel-rad-entwurf.png](wichtel-rad-entwurf.png)** · geplant für Weihnachten 2027

Wunsch Hansi (14.11.2026): „Für nächstes Jahr Wichteln zu Weihnachten einbauen. Jeder dreht am Glücksrad und bekommt eine Person zugewiesen.
Dann soll er eine Kleinigkeit als Wichtel-Geschenk besorgen und beim Weihnachtsessen überreichen. Also z. B. Hansi dreht Anne, Thomas dreht Marianne usw.“

## 1. Idee in einem Satz

Wer mitmacht, dreht in der App an einem **Glücksrad** und erfährt **geheim**, für wen er ein kleines Geschenk besorgt. Überreicht wird beim **Weihnachtsessen**.

## 2. Grundsätze

1. **Freiwillig.** Nur wer sich anmeldet, wird gezogen und kann gezogen werden.
2. **Geheim.** Wen man gezogen hat, sieht nur man selbst. Auch der Admin sieht es nicht (sonst ist die Überraschung weg). Der Admin sieht nur, **wer schon gedreht hat**.
3. **Gerecht.** Niemand zieht sich selbst, jede Person wird **genau einmal** gezogen. Auf Wunsch ziehen sich Paare nicht gegenseitig (Frage 4).
4. **Spannend, aber ehrlich.** Das Rad dreht sich schön, das Ergebnis steht aber vorher schon fest. Der Server verteilt alle Personen auf einmal, sobald die Anmeldung schließt. So kann am Ende niemand übrig bleiben, und niemand kann „neu drehen“, bis ihm das Ergebnis gefällt.
5. **Kostenlos.** Alles in der App gezeichnet (SVG), keine neuen Dienste.
6. **Mitglieder und Aushilfen** (Hansi 15.11.2026). Keine Gäste.

## 3. Ablauf (was die Mitglieder sehen)

| Wann | Was passiert |
|---|---|
| **Start** (z. B. Anfang November) | Hansi legt die Wichtel-Runde an: Anlass (Weihnachtsessen), Datum, Betrag (z. B. „bis 10 €“), Anmeldeschluss. Alle Mitglieder bekommen **eine** Startnachricht: „🎁 Wichteln zum Weihnachtsessen – machst du mit?“ |
| **Anmeldung** | Knopf **„🎁 Ich mache mit“** (später auch wieder abmelden, bis zum Anmeldeschluss). Liste „Wer macht mit“ für alle sichtbar, nur Vornamen. |
| **Anmeldeschluss** | Der Server verteilt alle Teilnehmer zufällig (jeder genau einmal, niemand sich selbst). |
| **Drehen** | Kachel/Karte **„🎡 Dreh am Glücksrad!“**: Das Rad mit den Vornamen dreht sich ein paar Sekunden, bremst langsam und bleibt bei „deiner“ Person stehen. Text: „Du beschenkst **Anne**! Bitte verrate es niemandem 🤫.“ Das Ergebnis bleibt in der App gespeichert, man kann es jederzeit wieder ansehen. |
| **Wunschzettel** (Frage 5) | Wer mag, schreibt 1–3 Stichworte („mag Tee, kein Alkohol“). Das sieht nur der eigene Wichtel. |
| **Erinnerung** | Eine Woche vor dem Essen **eine** kleine Zeile beim Öffnen: „🎁 Denk an dein Wichtel-Geschenk für Anne – Weihnachtsessen am …“ (kein Push, Frage 6). |
| **Weihnachtsessen** | Geschenke überreichen. Auf Wunsch zeigt die App danach für alle die Auflösung „Wer hat wen beschenkt“ (Frage 7). |

## 4. Für den Admin (Hansi)

- Runde anlegen, Anmeldeschluss ändern, Runde abbrechen.
- Übersicht: **wer macht mit**, **wer hat schon gedreht** (ohne Namen der Gezogenen).
- Nachzügler: Meldet sich nach dem Anmeldeschluss noch jemand, kann Hansi ihn einmal **dazunehmen**. Der Server fügt ihn in den Kreis ein (eine bestehende Zuordnung wird geteilt), ohne die anderen neu zu verlosen – wer schon gedreht hat, behält seine Person.
- Absage nach dem Drehen (krank): Hansi tippt „fällt aus“ – der Server schließt den Kreis wieder (wer die ausgefallene Person hatte, bekommt deren Person). Nur der Betroffene erfährt seine neue Person.

## 5. Technik (kurz)

- Tabelle `kc_club_wichteln_runde` (Anlass, Datum, Betrag, Anmeldeschluss, Status) und `kc_club_wichteln` (Runde, Person, beschenkt_id, gedreht_am, wunschzettel). RLS an, nur der Club-Server; gespiegelt und gesichert.
- **Verteilung:** zufällige Reihenfolge, jede Person beschenkt die nächste in der Reihe (ein großer Kreis) – so zieht niemand sich selbst und jeder wird genau einmal gezogen. Mit Paar-Ausschluss: Reihenfolge so lange neu mischen, bis kein Paar nebeneinander steht.
- Der Server gibt jedem **nur seine eigene** Person heraus (`wichteln_meins`). Die Liste mit allen Zuordnungen gibt es nur nach der Auflösung (Frage 7).
- Glücksrad: neuer Baustein in `teile/wichteln.js` (wird nur geladen, wenn man ihn öffnet), SVG, Drehung mit sanftem Abbremsen; „Bewegung verringern“ zeigt das Ergebnis ohne Drehen.
- Freigabe `wichteln` in der Freigaben-Liste (erst nur Admin zum Testen, dann alle Mitglieder).
- Tests: Verteilung (keiner sich selbst, jeder genau einmal, Paare getrennt, Nachzügler, Ausfall), Geheimhaltung (nur eigene Person), Rechte.

## 6. Fragen an Hansi

1. **Wer darf mitmachen?** Nur Mitglieder (Empfehlung) – oder auch Partnerinnen und Partner, die beim Weihnachtsessen dabei sind?
2. **Betrag:** Soll die App einen Richtwert anzeigen (z. B. „bis 10 €“)? Welcher Betrag?
3. **Wann drehen?** A) Ab Anmeldeschluss kann jeder für sich drehen (Empfehlung) · B) Alle drehen gemeinsam zu einer festen Zeit (z. B. bei einer Sitzung, auf dem großen Bildschirm).
4. **Paare:** Sollen Ehepaare/Partner sich **nicht** gegenseitig ziehen? Dann sag mir einmal, wer zusammengehört.
5. **Wunschzettel** (1–3 Stichworte für den eigenen Wichtel) – ja oder nein?
6. **Erinnerung:** nur eine kleine Zeile beim Öffnen (Empfehlung) – oder auch eine Push-Nachricht?
7. **Auflösung:** Nach dem Weihnachtsessen für alle zeigen „Wer hat wen beschenkt“ – ja oder nein (dann bleibt es für immer geheim)?
8. **Schon dieses Jahr testen?** Wir könnten im Dezember 2026 eine kleine Probe-Runde nur mit dir und 2–3 Freiwilligen machen, damit 2027 alles sitzt.

## 7. Antworten Hansi (15.11.2026) und angepasster Ablauf

1 nur Mitglieder · 2 kein Betrag · 3 **A** (jeder dreht für sich) · 4 Paare ziehen sich **nicht** gegenseitig · 5 kein Wunschzettel · 6 nur Zeile beim Öffnen, **kein Push** · 7 Auflösung nach dem Essen **ja** · 8 keine Probe-Runde.

**Das Rad (Wunsch Hansi):**
- Am Rad hängen die Teilnehmer mit **Avatar/Bild oder ihren 2 Buchstaben** (Hansi: „alle Mitglieder und Aushilfen“ – offen: dürfen Aushilfen mitmachen? Siehe Frage unten).
- **▶ Start**: einige schnelle Runden, **Lichter blinken**, typisches **Glücksrad-Klackern** (in der App erzeugt, kein Ton-Dienst; leise, wenn der Ton aus ist), dann langsamer, **noch 3–6 Felder** weiter, Stopp unter dem Zeiger.
- Frage **„Bist du einverstanden?“** – ✅ Ja, passt · 🔄 **einmal** neu drehen; beim zweiten Dreh kommt die zuerst gezogene Person **nicht** mehr. Danach steht es fest.
- **Geheim:** Nur wer gezogen hat, sieht unter „🎁 Mein Wichtel“, wen er beschenkt. Der Gezogene erfährt nicht, von wem – bis zur Auflösung nach dem Weihnachtsessen.

**Technik geändert (wegen Neu-Drehen):** Statt alle vorher zu verteilen, lost der Server **bei jedem Dreh** aus – aber nur unter den Personen, bei denen danach für alle Übrigen noch eine gültige Zuordnung möglich ist (Prüfung über eine „jeder findet noch jemanden“-Rechnung: nicht sich selbst, nicht der eigene Partner, nicht die abgelehnte Person, niemand doppelt). So bleibt am Ende niemand übrig. Das Rad zeigt dann genau das vom Server gelieferte Ergebnis.

**Antwort Hansi 15.11.2026 (Nachtrag):** **Aushilfen dürfen auch mitmachen** (Anmeldung wie Mitglieder, sie hängen mit am Rad; Gäste nicht). **Keine Paare** – eine Paar-Sperre wird nicht gebraucht (der Baustein bleibt im Plan, falls es später Paare gibt). Damit sind alle Fragen beantwortet; Bau rechtzeitig vor Weihnachten 2027 (Wunschliste #90 bis dahin „zurückgestellt“).
