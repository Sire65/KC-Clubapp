# Konzept: Ist-Stunden an Tagen ohne Stechuhr (Aufbau, Nachbereitung, Sonderzeiten für den Club)

Stand 05.11.2026 · Kennzeichen **DP2-F-IST-OHNE-UHR** · Status: **freigegeben von Hansi (05.11.2026) – bereit für Codex (Abschnitt 7).**

Wunsch Hansi: „Die Wunschphase ist vorbei. Es gibt einen Sollplan. Z. B. an den Aufbautagen hat sich Thomas von 10.00 bis 15.00
eingetragen. Aber um 13.00 war schon alles fertig. Da an den Aufbautagen nicht per Stechuhr gestempelt wird, müssen die Stunden
manuell berichtigt werden.“
Entscheidung Hansi (05.11.): „**Jeder muss selber seinen Plan anpassen.** Nach jedem Aufbau und jeder Nachbereitung soll jeder gefragt
werden, ob er etwas an seiner Einsatzzeit ändern muss. **Wenn nein, bleibt es dabei. Wenn ja, werden die neuen Zeiten in DP2
übernommen – als geändert.** Und dann gibt es ja noch weitere Sonderzeiten, in denen man etwas für den Club erledigt hat.“
Ergänzung Hansi (05.11.): „**Bei jeder Zeitänderung müssen Clubsprecher, Kassenwart und Admin Bescheid bekommen.**“
Entscheidung Hansi (05.11.): „**Fahrzeit zählt nicht als Arbeitszeit, sondern nur vor Ort. Km-Pauschale muss gesondert angegeben werden über Erstattung.**“
→ Das gilt für **alle** Zeiten ohne Stechuhr, auch für Sonderzeiten. Die bisherige Regel „von zuhause bis zuhause“ (Betreiber 15.10.2026) entfällt.

## 1. Ausgangslage (Stand Code)

- Weihnachtsmarkt 2026: **Aufbau 02.12. und 03.12.** (Tagesart `prep`), **Nachbereitung/Abbau 14.12.** (`after`), Standtage `market` mit Stechuhr.
- Der **Sollplan** steht (`K.shifts`, `layer:'planned'`). Die Istzeiten (`K.actualShifts`) kommen an Standtagen von der Stechuhr.
- An Tagen ohne Stechuhr gibt es heute keine Istzeit. Im Abgleich steht „Buchung fehlt“. Der Planer müsste das Soll übernehmen
  (`planned_transfer`) und jede Person einzeln korrigieren (`correctActual`). Das Mitglied wird nicht gefragt.
- **Sonderzeiten für den Club** (Einkauf, Getränke zuhause, Fahrten, Vorbereitung …) gibt es schon als **Stundenmeldung**
  (`hour-reports.js`, Twinkey „Sonderstunden melden“) für **Sondereinsätze**. Der Planer bestätigt, dann wird es zur Istzeit (`self_report`).

## 2. Grundsätze

1. **Jeder passt seine eigene Zeit selbst an.** Es gibt keinen Tagesverantwortlichen und keinen Sammelabschluss.
2. **Der Sollplan bleibt als Zusage erhalten.** Die Änderung landet im **Ist** und ist als **„geändert“** gekennzeichnet. Das Soll bleibt daneben sichtbar.
3. **„Nein, passt“ = das Soll gilt als Ist** (Kennzeichen „bestätigt“). Der Normalfall braucht nur einen Tipp.
4. Zeiten in **Viertelstunden**, Auswahl statt Freitext, nur eigene Einsätze.
5. Jede Änderung wird protokolliert (wer, wann, vorher/nachher). Der Planer sieht alle „geändert“-Fälle in einer Liste.
6. **Bei jeder Zeitänderung bekommen Clubsprecher, Kassenwart und Admin Bescheid** (Abschnitt 3a).
7. **Fahrzeit zählt nie als Arbeitszeit.** Es zählt nur die Zeit vor Ort bzw. die Zeit der eigentlichen Arbeit. Gefahrene Kilometer
   rechnet man **gesondert über die Erstattung** ab (km-Pauschale, nur Fahrer der Fahrgemeinschaft).

## 3. Ablauf nach jedem Aufbau- und Nachbereitungstag

### Schritt 1 – Rückfrage an jeden Eingeplanten

Am Abend des Tages (ab Soll-Ende des letzten Dienstes, spätestens 19 Uhr, Push nur 9–20 Uhr) bekommt **jede Person mit Solldienst
an diesem Tag** in der Club-App:

```
🔧 Aufbau Mi 02.12. – deine Einsatzzeit
Geplant: 10:00 – 15:00 (5 Std.)
Musst du an deiner Zeit etwas ändern?

[ ✓ Nein, passt so ]   [ ✏️ Ja, ändern ]   [ 🚫 Ich war nicht da ]
```

- **„Nein, passt so“** → Istzeit = Soll, Quelle `self_confirm`, Kennzeichen **bestätigt**. Fertig.
- **„Ja, ändern“** → Beginn und Ende aus der Auswahl (Viertelstunden, vorbelegt mit dem Soll), dazu ein Grund aus der Auswahl
  (früher fertig · später gekommen · länger geblieben · Sonstiges + kurze Bemerkung):
  ```
  Beginn [10:00 ▾]   Ende [13:00 ▾]   → 3 Std. statt 5 Std.
  Grund: ◉ früher fertig  ○ später gekommen  ○ länger geblieben  ○ Sonstiges
                                              [ Übernehmen ]
  ```
  → Istzeit mit den neuen Zeiten, Quelle `self_change`, Kennzeichen **geändert**. Das Original (Soll) wird mitgespeichert.
  Die Änderung ist **sofort in DP2 übernommen** (nur **mehr Stunden als geplant** muss der Planer erst bestätigen, siehe 6.3).
- **„Ich war nicht da“** → keine Istzeit, Sollschicht „nicht erschienen“ (Grund aus der Auswahl). Der Planer sieht es.
- Bis zum Abschluss des Istplans kann man die eigene Angabe **einmal neu öffnen und ändern** (wieder protokolliert).

### Schritt 2 – Erinnerung

Wer nicht antwortet, bekommt am nächsten Tag **eine** Erinnerung. Der Zettel bleibt in „Mein Dienst“, bis er beantwortet ist.
Antwortet jemand bis **3 Tage nach dem Tag** nicht, gilt das **Soll als Ist**, gekennzeichnet **„⏳ nicht beantwortet“** (6.1). Der Planer sieht es.

### Schritt 3 – Planer

- Im Soll-/Ist-Abgleich (DP2) stehen Aufbau und Nachbereitung mit den Spalten **Soll · Ist · Kennzeichen**
  (✓ bestätigt · ✏️ geändert · 🚫 nicht da · ⏳ keine Antwort) und einer Liste „Geändert von Mitgliedern“.
- Der Planer kann weiterhin selbst korrigieren (`correctActual`, mit Grund). Das Mitglied bekommt dann eine Nachricht.
- `closePlan` zählt „keine Antwort“ als ungeklärt. Ein Abschluss ist dann nur mit Begründung möglich (wie heute).
- Kontoauszug des Mitglieds: „Aufbau 02.12. · Soll 10:00–15:00 · Ist 10:00–13:00 ✏️ geändert (früher fertig)“.

## 3a. Bescheid an Clubsprecher, Kassenwart und Admin

**Wann:** bei jeder Zeitänderung, also immer, wenn das Ist vom Soll abweicht oder neue Stunden dazukommen:
- ✏️ Mitglied ändert seine Zeit (auch beim erneuten Ändern),
- 🚫 „Ich war nicht da“,
- Planer korrigiert eine Istzeit,
- ➕ neue Sonderzeit für den Club gemeldet (und später bestätigt oder abgelehnt).

**Nicht** bei „✓ Nein, passt so“, denn da ändert sich nichts.

**Wie:**
- Nachricht in der Club-App mit Push (wie die Änderungsmeldungen „Neue Anschrift“ an Clubsprecher, Kassenwart und Admin).
- Empfänger: alle mit Amt **Clubsprecher** oder **Kassenwart** (`kc_club_rollen.aemter`) und der **Admin**. Wer selbst ändert, bekommt
  keine Nachricht über sich selbst.
- Inhalt kurz und ohne Freitext anderer Personen außer dem Grund:
  „✏️ Thomas H. – Aufbau Mi 02.12.: **10:00–13:00 statt 10:00–15:00** (−2 Std., früher fertig)“
  bzw. „➕ Anne K. – Sonderzeit 28.11. Einkauf: 2,5 Std. gemeldet“.
- Ein Knopf **„📋 Alle Änderungen ansehen“** öffnet die Liste „Geändert von Mitgliedern“ (Soll · Ist · Grund · wann).
- Ändern sich am selben Abend viele Zeiten, gilt: Nachricht je Änderung, aber **Push höchstens einmal je 15 Minuten** je
  Empfänger („3 neue Zeitänderungen“). So wird niemand mit Pushes überschüttet.



Gemeint sind Zeiten **ohne Solldienst**, in denen jemand etwas für den Club erledigt hat: einkaufen, Getränke zuhause mischen, Fahrten,
Material holen, Vorbereitung zuhause …

- Die Rückfrage aus Schritt 1 hat unten zusätzlich **„➕ Ich habe noch etwas anderes für den Club erledigt“**. Der Knopf steht auch dauerhaft
  in „Mein Dienst“ und bei Twinkey.
- Er öffnet die vorhandene **Stundenmeldung** (`hour-reports.js`): Einsatz bzw. Anlass, Tag, Zeit **nur der Arbeit vor Ort, ohne Fahrzeit**,
  Tätigkeit aus der Auswahl, auf Wunsch weitere Kollegen.
- Danach kommt der Hinweis: „**Gefahren?** Kilometer bitte über die Erstattung angeben“ mit dem Knopf **„🚗 Fahrtkosten / km-Pauschale erfassen“**
  (öffnet die vorhandene Erstattung, vorausgefüllt mit Tag und Anlass). Die Fahrt selbst steht nicht in den Stunden.
- **Neu:** Anlass **„Sonstiges für den Club“** ohne festen Sondereinsatz, damit jede Clubarbeit meldbar ist (Tätigkeit + Bemerkung Pflicht).
- Wie bisher: Status „gemeldet“ → Planer bestätigt oder lehnt mit Grund ab → Istzeit `self_report`. Das bleibt so, weil es dafür
  keinen Plan gibt, mit dem man vergleichen könnte (entschieden, 6.4).

## 5. Für wen gilt was?

| Tag / Zeit | Stechuhr | Ist kommt aus |
|---|---|---|
| Standtage (`market`) | ja | Stechuhr wie bisher |
| Aufbau (`prep`), Nachbereitung (`after`) | **nein** | **Rückfrage an jeden:** passt / ändern / nicht da |
| Sonderzeiten für den Club ohne Solldienst | nein | Stundenmeldung → Planer bestätigt |

Einstellung je Tag: `stempeluhr: false` (Standard für `prep` und `after`), damit es später auch für andere Tage gilt.

## 6. Entscheidungen Hansi (05.11.2026)

1. **Keine Antwort bis zur Frist** (3 Tage nach dem Tag): Es gilt das **Soll als Ist**, gekennzeichnet **„⏳ nicht beantwortet“**. Der Planer sieht es.
2. **Fahrzeit zählt nie** als Arbeitszeit, nur die Zeit vor Ort. Die km-Pauschale gibt man gesondert über die Erstattung an.
3. **Änderungen werden sofort übernommen**, gekennzeichnet „geändert“. Clubsprecher, Kassenwart und Admin bekommen Bescheid, der Planer kann korrigieren.
   **Ausnahme: mehr Stunden als geplant** (länger geblieben) zählen erst nach Bestätigung durch den Planer.
4. **Sonderzeiten für den Club** zählen wie bisher erst nach Bestätigung durch den Planer.
5. **Pausen:** gleiche Pausenregel wie an Standtagen. Das ist mein Vorschlag, Hansi wurde dazu nicht ausdrücklich gefragt; er kann es noch ändern.

## 7. Auftrag für Codex (freigegeben 05.11.2026)

**Ziel:** Nach jedem Tag ohne Stechuhr (Aufbau 02./03.12., Nachbereitung 14.12.) fragt die Club-App jede eingeplante Person, ob sie
ihre Einsatzzeit ändern muss. „Nein“ → Soll wird Ist (bestätigt). „Ja“ → neue Zeiten werden als Ist übernommen, gekennzeichnet „geändert“.
Dazu die Meldung weiterer Sonderzeiten für den Club. Der Sollplan bleibt unverändert. Kennzeichen `DP2-F-IST-OHNE-UHR`.

**Regeln:**
- KC-Entwicklervertrag und `AGENTS.md` der Club-App.
- **Einspielen nur zum Termin 12/20 Uhr.** `[Hansi: einspielen]` nur auf Hansis ausdrückliches Wort.
- Ruhe-Prüfung vor dem Einspielen.
- **Neue Tabellen mit `grant … to service_role`**, RLS an, `revoke … from public, anon, authenticated`.
- Migration nur über `db-einspielen.yml` mit Probelauf.
- Browser-Tests **nur abgeschirmt mit Netzsperre** (`OHNE_ECHTSERVER`, `--no-proxy-server`).
- Keine Chat-Inhalte lesen. Keine Supabase-Protokolle durchsuchen.

1. **Tage ohne Stechuhr:** `K.days[*].stempeluhr` (Standard `false` für `prep`/`after`), Hilfsfunktion `K.isNoClockDay(date)`.
   `reportPending()` in `core/actual.js` gilt auch für diese Tage. Anzeige „⏳ keine Antwort“ statt „Buchung fehlt“.
2. **`core/actual.js` – Selbstangabe:** neue Funktion `selfAnswer(shiftId, { antwort:'passt'|'aendern'|'nicht_da', start, end, breakMinutes, grund, bemerkung })`.
   - Nur der **eigene** Solldienst und nur an Tagen ohne Stechuhr, erst ab Soll-Beginn des Tages, nicht bei abgeschlossenem Istplan.
     Neues Recht `roster.actual.self_answer` für Mitglieder.
   - `passt` → Istzeit = Soll, Quelle `self_confirm`. `aendern` → Istzeit mit neuen Zeiten (Viertelstunden, Ende nach Beginn, höchstens 16 Std.),
     Quelle `self_change`, `original` = Soll, `geaendert: true`, Grund Pflicht. `nicht_da` → keine Istzeit, Sollschicht `absent` mit Grund.
   - Je Solldienst höchstens **eine** Istzeit. Eine erneute Angabe ändert sie (Version +1), legt aber kein Duplikat an.
   - Protokoll `actual.self_answer` (vorher/nachher). Mehr Stunden als Soll → Status `zu_bestaetigen` (zählt erst nach Bestätigung durch den Planer, `roster.actual.correct`).
   - Frist: 3 Tage nach dem Tag ohne Antwort → Istzeit = Soll, Quelle `no_answer`, Kennzeichen „⏳ nicht beantwortet“ (Zeitplan, einmal je Dienst).
3. **Rückfrage und Erinnerung (Server kc-club):**
   - Zeitplan: am Tag ab Soll-Ende des letzten Dienstes, spätestens 19 Uhr, an jede Person mit Solldienst eine Nachricht/Push mit drei Knöpfen.
   - Am Folgetag eine Erinnerung an alle ohne Antwort. Push nur 9–20 Uhr, je Person und Tag höchstens Rückfrage + 1 Erinnerung.
   - Den Zeitplan wie `kc-club-geplant-minute` nur bei Bedarf aufrufen (kein Dauerlauf, Datenbank sparen).
   - Aktionen `ist_selbst_antworten` (Rechte serverseitig: nur eigener Dienst) und `ist_selbst_laden`.
4. **Club-App:**
   - Zettel „Deine Einsatzzeit“ in „Mein Dienst“ mit Passt / Ändern (Auswahl Viertelstunden, vorbelegt mit Soll, Grund-Auswahl) / Nicht da.
   - Darunter „➕ Ich habe noch etwas anderes für den Club erledigt“ → vorhandene Stundenmeldung mit neuem Anlass **„Sonstiges für den Club“**.
   - Kontoauszug: Soll · Ist · Kennzeichen (✓/✏️/🚫/⏳).
   - Twinkey-Einträge „Meine Aufbau-Zeit ändern“ und „Sonderzeit für den Club melden“. Hilfe-Text.
5. **Bescheid an Clubsprecher, Kassenwart, Admin (Server):**
   - Bei `self_change`, `nicht_da`, Planer-Korrektur (`correctActual`) sowie bei Sonderzeit-Meldung, -Bestätigung und -Ablehnung
     eine Nachricht an alle mit Amt Clubsprecher oder Kassenwart (`kc_club_rollen.aemter`) und an den Admin.
     Nicht an die Person, die die Änderung gemacht hat. Nicht bei `passt`.
   - Text: Name, Tag/Anlass, neue Zeit statt Soll, Differenz in Stunden, Grund. Knopf „📋 Alle Änderungen ansehen“.
   - Push gebündelt: je Empfänger höchstens einer je 15 Minuten („n neue Zeitänderungen“).
   - Vorbild: Empfänger-Regel der Änderungsmeldungen (`an: ["Clubsprecher", "Kassenwart", "admin"]`, `AE_AN_NAME`).
6. **Fahrzeit zählt nicht (Entscheidung Hansi 05.11., ersetzt „Betreiber 2026-10-15“):**
   - `dp2/src/core/hour-reports.js`: Kommentar und Regel anpassen. Ende höchstens 24:00 statt 30:00 (`MAX_END`), höchstens 12 Std. statt 16 (`MAX_SPAN`).
     Tätigkeit „Transport / Fahrt“ umbenennen in **„Transport / Material holen (Ladezeit vor Ort)“**, dazu der Hinweis „Fahrzeit über Erstattung“.
     Bereits gemeldete Zeilen bleiben unverändert, der Planer entscheidet sie wie bisher.
   - Twinkey (`dp2/src/ui/twinkey.js`, Frage „Wann bist du zuhause losgefahren …? Die Fahrzeit zählt mit.“) → **„Von wann bis wann warst du vor Ort
     im Einsatz? Die Fahrzeit zählt nicht – Kilometer gibst du gleich danach über die Erstattung an.“**
   - Club-App Hilfe (`app.js` Eintrag `sonderstunden`, `teile/hilfe.js` `sonderstunden-melden`): „von zuhause bis zuhause“ ersetzen durch
     „nur die Zeit vor Ort, Kilometer über die Erstattung“.
   - Nach jeder Stundenmeldung und nach „✏️ Ja, ändern“ den Knopf „🚗 Fahrtkosten / km-Pauschale erfassen“ anbieten (vorhandene Erstattung,
     vorausgefüllt). Die km-Pauschale gilt weiter nur für Fahrer (Fahrgemeinschaft).
7. **DP2 Planer-Ansicht:** Spalten Soll · Ist · Kennzeichen, Liste „Geändert von Mitgliedern“, Filter „keine Antwort“.
   Planer-Korrektur wie bisher mit Grund + Nachricht ans Mitglied. `closePlan` zählt „keine Antwort“ als ungeklärt.
8. **Tests (rot verhindert das Einspielen):**
   - Thomas Soll 10–15, „ändern“ 10–13, Grund „früher fertig“ → Ist 10–13, Kennzeichen geändert, Original 10–15, Soll unverändert.
   - „passt“ → Ist = Soll, bestätigt. „nicht da“ → keine Istzeit, Schicht `absent`.
   - Fremder Dienst, Standtag, zukünftiger Tag, abgeschlossener Istplan → abgelehnt. Zweite Angabe → kein Duplikat, Version +1.
   - Viertelstunden, Ende nach Beginn, höchstens 16 Std.
   - Erinnerung nur einmal, nur 9–20 Uhr, nur an Personen ohne Antwort.
   - Stundenmeldung „Sonstiges für den Club“ ohne Sondereinsatz → gemeldet → bestätigt → Istzeit `self_report`.
   - Bescheid: Änderung → Nachricht an Clubsprecher, Kassenwart und Admin (nicht an den Ändernden). „Passt“ → keine Nachricht.
     Fünf Änderungen in 10 Minuten → je Empfänger nur ein Push.
   - Fahrzeit: Ende nach 24:00 bzw. mehr als 12 Std. → abgelehnt. Twinkey- und Hilfetexte enthalten nicht mehr „zuhause bis zuhause“.
     Nach der Meldung steht der Knopf zur Erstattung da.
   - Browser-Rundgang abgeschirmt: Zettel auf einem 360-px-Handy bedienbar.
9. **Ende:** Eintrag in `CHANGELOG.md`, Hilfe-Text, Rückweg (Version davor), neue Tabelle mit Rechten. Hansi in einfachen Worten berichten.
   Einspielen nur zum Termin.
