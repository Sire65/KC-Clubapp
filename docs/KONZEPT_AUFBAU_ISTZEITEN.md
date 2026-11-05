# Konzept: Ist-Stunden an Tagen ohne Stechuhr (Aufbau, Abbau, Sondereinsätze)

Stand 05.11.2026 · Wunsch Hansi: „Die Wunschphase ist vorbei. Es gibt einen Sollplan. Z. B. an den Aufbautagen hat sich Thomas
von 10.00 bis 15.00 eingetragen. Aber um 13.00 war schon alles fertig. Da an den Aufbautagen nicht per Stechuhr gestempelt wird,
müssen die Stunden manuell berichtigt werden. Wie kann das laufen?“
Kennzeichen: **DP2-F-IST-OHNE-UHR** · Status: **Konzept – offene Fragen unten, erst nach Freigabe Hansi bauen.**

## 1. Ausgangslage (Stand Code)

- Weihnachtsmarkt 2026: **Aufbau 02.12. und 03.12.** (Tagesart `prep`, 8–18 Uhr), **Abbau 14.12.** (`after`, 8–15 Uhr), Standtage `market`.
- Der **Sollplan** steht (`K.shifts`, `layer:'planned'`). Die **Istzeiten** (`K.actualShifts`) kommen an Standtagen von der Stechuhr.
- An Tagen ohne Stechuhr gibt es heute nur:
  - **Sondereinsätze/Z-Dienste:** Stundenmeldung durch Mitglieder (`hour-reports.js`, Twinkey „Sonderstunden melden“) → Planer bestätigt → Istzeit (`self_report`). Ohne Meldung gilt „Meldung ausstehend“.
  - **Planer von Hand:** Soll ins Ist übernehmen (`planned_transfer`, nur unverändert) und danach je Person mit Grund korrigieren (`correctActual`).
- **Lücke:** Aufbau/Abbau stehen im Abgleich als „Buchung fehlt“, nicht als „Meldung ausstehend“. Für viele Personen ist das
  Übernehmen und Korrigieren einzeln mühsam. Es gibt kein „alle waren um 13 Uhr fertig“, und das Mitglied wird nicht gefragt.
  Übernimmt jemand einfach das Soll, bekäme Thomas 5 statt 3 Stunden.

## 2. Grundsätze

1. **Der Sollplan bleibt, wie er war.** Er ist die Zusage. Korrigiert wird nur das **Ist**, mit Grund, Name und Zeit (Protokoll, Original bleibt sichtbar).
2. **Stunden zählen nur bestätigt.** Ungeprüftes Soll wird nie still zum Ist.
3. **Wer dabei war, weiß es am besten:** der Verantwortliche des Tages vor Ort, dann das Mitglied selbst.
4. **Ein Tipp für den Normalfall.** „Alle wie geplant“ oder „alle bis 13:00“. Einzeln ändern nur die Ausnahmen.
5. **Viertelstunden**, wie bei den Sonderstunden. Länger als geplant ist erlaubt, braucht aber einen Grund.

## 3. Ablauf

### Schritt 1 – Tagesabschluss vor Ort (Hauptweg)

Am Ende des Aufbautags (spätestens am nächsten Morgen) öffnet der **Tagesverantwortliche** in der Club-App unter „Mein Dienst“
oder im Büro **„✅ Aufbautag abschließen“**:

```
Aufbau Mi 02.12. – geplant 8 Personen
[ Alle wie geplant ]   [ Alle fertig um … 13:00 ▾ ]

Thomas H.    Soll 10:00–15:00  →  Ist 10:00–13:00   (fertig früher)
Anne K.      Soll 08:00–13:00  →  Ist 08:00–13:00   ✓
Wilfried B.  Soll 12:00–18:00  →  [nicht da]  [später gekommen ▾]
…                                              [+ Person ohne Soll (Helfer)]
Grund (Auswahl): ◉ früher fertig  ○ Wetter  ○ Material fehlte  ○ Sonstiges
                                         [ Speichern und bestätigen ]
```

- „Alle fertig um 13:00“ kürzt nur, wer laut Soll länger geplant war. Wer schon vorher gehen sollte, bleibt bei seinem Soll.
- „Nicht da“ legt keine Istzeit an. Der Solldienst wird „nicht erschienen“, mit Grund aus einer Auswahl.
- Helfer ohne Sollschicht lassen sich ergänzen (nur Mitglieder aus der Liste).
- Gespeichert wird je Person eine Istzeit mit Quelle **`day_close`**. Sie ist mit der Sollschicht verknüpft, mit Original = Soll,
  Grund, Tagesverantwortlichem und Uhrzeit. Damit gilt sie als **bestätigt**.

### Schritt 2 – Das Mitglied sieht es und darf widersprechen

- Push bzw. Nachricht an jede Person: „Dein Aufbau am 02.12.: **3 Std.** (geplant 5 Std.) – Grund: früher fertig. Stimmt das?“
  Knöpfe: **„✓ Stimmt“** und **„✏️ Stimmt nicht“**.
- „Stimmt nicht“ öffnet den vorhandenen **Korrekturantrag** (`createCorrectionRequest`, Recht `roster.actual.dispute_own`):
  Beginn und Ende auswählen, kurze Bemerkung. Die Entscheidung liegt beim Planer (`resolveCorrectionRequest`).
- Frist: **3 Tage** (wie bei den Sonderstunden). Danach gilt der Tagesabschluss.
- Im **Kontoauszug** stehen beide Zeiten: „Soll 10:00–15:00 · Ist 10:00–13:00 (früher fertig, bestätigt von …)“.

### Schritt 3 – Kein Tagesabschluss? Dann fragt die App das Mitglied

Hat bis zum nächsten Tag um 12 Uhr niemand den Tag abgeschlossen, bekommt jede eingeplante Person die Rückfrage
**„Wie lange warst du beim Aufbau? Geplant 10:00–15:00“**, mit den Knöpfen **„✓ Wie geplant“**, **„🕐 Andere Zeit“** und **„Ich war nicht da“**.
Die Antwort ist eine **Meldung** (wie die Sonderstunden, Status „gemeldet“). Erst der Planer bestätigt sie, gesammelt mit
„Alle bestätigen“. Antwortet niemand, bleibt der Fall im Abgleich als **„Meldung ausstehend“** offen. Das Soll wird nicht still übernommen.

### Schritt 4 – Planer schließt den Istplan

- Im Soll-/Ist-Abgleich sind Aufbau und Abbau wie Z-Dienste **„Meldung ausstehend“** statt „Buchung fehlt“.
- Der Planer kann jederzeit selbst **„Tag abschließen“** (dieselbe Maske wie Schritt 1).
- `closePlan` zählt offene Aufbau-/Abbaufälle als ungeklärt. Ein Abschluss ist dann nur mit Begründung möglich (wie heute).

## 4. Für wen gilt das?

| Tag / Dienst | Stechuhr | Ist kommt aus |
|---|---|---|
| Standtage (`market`) | ja | Stechuhr wie bisher, Korrektur wie bisher |
| Aufbau (`prep`), Abbau (`after`) | **nein** | Tagesabschluss → sonst Mitglied → Planer bestätigt |
| Sondereinsätze / Z-Dienste | nein | Stundenmeldung wie bisher, auf Wunsch zusätzlich Tagesabschluss |

Einstellung je Tag: `stempeluhr: false` (Standard für `prep` und `after`), damit es später auch für andere Tage gilt.

## 5. Offene Fragen an Hansi (Vorschlag jeweils fett)

1. **Wer schließt den Aufbautag ab?** **Ein Tagesverantwortlicher je Aufbautag, den der Planer im Sollplan festlegt**, oder nur der Planer bzw. Admin?
2. **Zählt die Fahrzeit beim Aufbau?** Bei Sondereinsätzen zählt „von zuhause bis zuhause“. **Beim Aufbau am Stand nur die Zeit vor Ort**, wie an Standtagen.
3. **Wenn niemand antwortet:** **Es zählt nichts, bis jemand bestätigt** (Fall bleibt offen), oder nach 7 Tagen gilt das Soll?
4. **Pausen beim Aufbau:** **Wie an Standtagen (Pausenregel aus den Einstellungen)** oder keine?

## 6. Auftrag für Codex (nach Freigabe der offenen Fragen)

**Ziel:** Ist-Stunden für Tage ohne Stechuhr (Aufbau 02./03.12., Abbau 14.12., Sondereinsätze) per Tagesabschluss und Rückfrage erfassen,
ohne den Sollplan zu verändern. Kennzeichen `DP2-F-IST-OHNE-UHR`.

Regeln: KC-Entwicklervertrag und `AGENTS.md` der Club-App, insbesondere **Einspielen nur zum Termin 12/20 Uhr**
(`[Hansi: einspielen]` nur auf ausdrückliches Wort), Ruhe-Prüfung, **neue Tabellen mit `grant … to service_role`**, Browser-Tests
**nur abgeschirmt mit Netzsperre**, keine Chat-Inhalte lesen.

1. **Tagesart ohne Stechuhr:** `K.days[*].stempeluhr` (Standard `false` für `prep`/`after`). Hilfsfunktion `K.isNoClockDay(date)`.
2. **`core/actual.js`:**
   - `reportPending()` auch für Sollschichten an Tagen ohne Stechuhr.
   - Neu `closeDay(date, { eintraege:[{shiftId|personId, start, end, breakMinutes, nichtDa, grund}], grund, von })`.
     Legt je Eintrag eine Istzeit mit Quelle `day_close` an: verknüpft mit `linkedShiftId`, `original` = Soll, Viertelstunden.
     „Nicht da“ → Sollschicht `absent` mit Grund. Überschneidungen und abgeschlossenen Istplan wie in `saveActual` prüfen.
     Protokoll `actual.day_close`. Zweiter Abschluss desselben Tages = Korrektur mit Grund, kein Duplikat.
   - Neues Recht `roster.actual.day_close`: Planer immer, Tagesverantwortlicher nur für **seinen** Tag, nur ohne Stechuhr.
   - „Alle fertig um X“: kürzt nur Einträge mit Soll-Ende > X und Soll-Beginn < X.
3. **Rückfrage ans Mitglied:** nach dem Tagesabschluss die Nachricht „Stimmt das?“ (Stimmt / Stimmt nicht → `createCorrectionRequest`).
   Ohne Abschluss bis zum Folgetag 12 Uhr die Rückfrage „Wie lange warst du da?“. Die Antwort ist eine Meldung über den Weg der
   Stundenmeldungen (`hour-reports.js`, Status `gemeldet`, Bestätigung durch den Planer, gesammelt bestätigen). Eine Rückfrage je Person
   und Tag, Push nur zwischen 9 und 20 Uhr.
4. **Club-App und Server (kc-club):** Aktionen `tag_abschliessen` (Rechteprüfung serverseitig), `ist_rueckfrage_antwort`. Anzeige
   in „Mein Dienst“ und im Kontoauszug: Soll, Ist, Grund, bestätigt von. Twinkey-Eintrag „Aufbautag abschließen“ und „Meine Aufbau-Stunden“.
   Neue Tabelle nur, wenn nötig (sonst `kc_dp_actual_shifts` bzw. die vorhandenen Tabellen nutzen). Migration über `db-einspielen.yml` mit Probelauf.
5. **Planer-Ansicht:** Im Soll-/Ist-Abgleich „Tag abschließen“ für Tage ohne Stechuhr; offene Fälle als „Meldung ausstehend“.
   `closePlan` zählt sie als ungeklärt.
6. **Tests (rot verhindert das Einspielen):**
   - Thomas Soll 10–15, „alle fertig um 13:00“ → Ist 10–13, Original 10–15, Grund gespeichert, Soll unverändert.
   - Wer laut Soll vor 13 Uhr geht, bleibt unverändert. „Nicht da“ → keine Istzeit, Schicht `absent`.
   - Ein Tagesverantwortlicher darf nicht an fremden Tagen und nicht an Standtagen abschließen. Ein Mitglied darf gar nicht abschließen.
   - Ohne Abschluss kommt keine stille Übernahme, der Fall bleibt „Meldung ausstehend“.
   - Ein Korrekturantrag des Mitglieds wird angenommen bzw. abgelehnt, das Protokoll stimmt.
   - Kein doppeltes Ist beim zweiten Abschluss. Viertelstunden. Abgeschlossener Istplan sperrt.
   - Browser-Rundgang (abgeschirmt, `OHNE_ECHTSERVER`): Maske auf einem 360-px-Handy bedienbar.
7. **Ende:** Eintrag in `CHANGELOG.md`, Hilfe-Text, Rückweg (Version davor). Hansi in einfachen Worten berichten. Einspielen nur zum Termin.
