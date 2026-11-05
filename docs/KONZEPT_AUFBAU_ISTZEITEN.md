# Konzept: Ist-Stunden an Tagen ohne Stechuhr (Aufbau, Nachbereitung, Sonderzeiten für den Club)

Stand 05.11.2026 · Kennzeichen **DP2-F-IST-OHNE-UHR** · Status: **Konzept, Frage 1 entschieden, weitere Fragen in Abschnitt 6 – erst nach Freigabe Hansi bauen.**

Wunsch Hansi: „Die Wunschphase ist vorbei. Es gibt einen Sollplan. Z. B. an den Aufbautagen hat sich Thomas von 10.00 bis 15.00
eingetragen. Aber um 13.00 war schon alles fertig. Da an den Aufbautagen nicht per Stechuhr gestempelt wird, müssen die Stunden
manuell berichtigt werden.“
Entscheidung Hansi (05.11.): „**Jeder muss selber seinen Plan anpassen.** Nach jedem Aufbau und jeder Nachbereitung soll jeder gefragt
werden, ob er etwas an seiner Einsatzzeit ändern muss. **Wenn nein, bleibt es dabei. Wenn ja, werden die neuen Zeiten in DP2
übernommen – als geändert.** Und dann gibt es ja noch weitere Sonderzeiten, in denen man etwas für den Club erledigt hat.“

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
  Die Änderung ist **sofort in DP2 übernommen** (siehe Frage 6.3 zur Bestätigung).
- **„Ich war nicht da“** → keine Istzeit, Sollschicht „nicht erschienen“ (Grund aus der Auswahl). Der Planer sieht es.
- Bis zum Abschluss des Istplans kann man die eigene Angabe **einmal neu öffnen und ändern** (wieder protokolliert).

### Schritt 2 – Erinnerung

Wer nicht antwortet, bekommt am nächsten Tag **eine** Erinnerung. Der Zettel bleibt in „Mein Dienst“, bis er beantwortet ist.
Was nach Ablauf der Frist gilt, ist **Frage 6.1**.

### Schritt 3 – Planer

- Im Soll-/Ist-Abgleich (DP2) stehen Aufbau und Nachbereitung mit den Spalten **Soll · Ist · Kennzeichen**
  (✓ bestätigt · ✏️ geändert · 🚫 nicht da · ⏳ keine Antwort) und einer Liste „Geändert von Mitgliedern“.
- Der Planer kann weiterhin selbst korrigieren (`correctActual`, mit Grund). Das Mitglied bekommt dann eine Nachricht.
- `closePlan` zählt „keine Antwort“ als ungeklärt. Ein Abschluss ist dann nur mit Begründung möglich (wie heute).
- Kontoauszug des Mitglieds: „Aufbau 02.12. · Soll 10:00–15:00 · Ist 10:00–13:00 ✏️ geändert (früher fertig)“.

## 4. Weitere Sonderzeiten für den Club

Gemeint sind Zeiten **ohne Solldienst**, in denen jemand etwas für den Club erledigt hat: einkaufen, Getränke zuhause mischen, Fahrten,
Material holen, Vorbereitung zuhause …

- Die Rückfrage aus Schritt 1 hat unten zusätzlich **„➕ Ich habe noch etwas anderes für den Club erledigt“**. Der Knopf steht auch dauerhaft
  in „Mein Dienst“ und bei Twinkey.
- Er öffnet die vorhandene **Stundenmeldung** (`hour-reports.js`): Einsatz bzw. Anlass, Tag, Zeit (bei Fahrten von zuhause bis zuhause),
  Tätigkeit aus der Auswahl, auf Wunsch weitere Kollegen, danach „🚗 Fahrtkosten/Auslagen erfassen“.
- **Neu:** Anlass **„Sonstiges für den Club“** ohne festen Sondereinsatz, damit jede Clubarbeit meldbar ist (Tätigkeit + Bemerkung Pflicht).
- Wie bisher: Status „gemeldet“ → Planer bestätigt oder lehnt mit Grund ab → Istzeit `self_report`. Das bleibt so, weil es dafür
  keinen Plan gibt, mit dem man vergleichen könnte (siehe Frage 6.4).

## 5. Für wen gilt was?

| Tag / Zeit | Stechuhr | Ist kommt aus |
|---|---|---|
| Standtage (`market`) | ja | Stechuhr wie bisher |
| Aufbau (`prep`), Nachbereitung (`after`) | **nein** | **Rückfrage an jeden:** passt / ändern / nicht da |
| Sonderzeiten für den Club ohne Solldienst | nein | Stundenmeldung → Planer bestätigt |

Einstellung je Tag: `stempeluhr: false` (Standard für `prep` und `after`), damit es später auch für andere Tage gilt.

## 6. Offene Fragen an Hansi (Vorschlag jeweils fett)

1. **Keine Antwort bis zur Frist** (3 Tage nach dem Tag): **Es gilt das Soll, gekennzeichnet „⏳ nicht beantwortet“**, und der Planer
   sieht es? Oder es zählt nichts, bis jemand antwortet?
2. **Fahrzeit beim Aufbau/bei der Nachbereitung:** **Nur die Zeit vor Ort** (wie an Standtagen). Bei Sonderzeiten zählt weiter „von zuhause bis zuhause“.
3. **Änderungen ohne Bestätigung übernehmen?** **Ja, sofort übernommen, als „geändert“ markiert.** Der Planer sieht die Liste und kann
   korrigieren. Ausnahme: **Mehr Stunden als geplant** (länger geblieben) braucht die Bestätigung des Planers?
4. **Sonderzeiten für den Club:** **Weiter mit Bestätigung durch den Planer** (wie heute)?
5. **Pausen:** **Gleiche Pausenregel wie an Standtagen.**

## 7. Auftrag für Codex (nach Antwort auf Abschnitt 6)

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
   - Protokoll `actual.self_answer` (vorher/nachher). Je nach Antwort auf 6.3: Mehr als Soll → Status `zu_bestaetigen`.
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
5. **DP2 Planer-Ansicht:** Spalten Soll · Ist · Kennzeichen, Liste „Geändert von Mitgliedern“, Filter „keine Antwort“.
   Planer-Korrektur wie bisher mit Grund + Nachricht ans Mitglied. `closePlan` zählt „keine Antwort“ als ungeklärt.
6. **Tests (rot verhindert das Einspielen):**
   - Thomas Soll 10–15, „ändern“ 10–13, Grund „früher fertig“ → Ist 10–13, Kennzeichen geändert, Original 10–15, Soll unverändert.
   - „passt“ → Ist = Soll, bestätigt. „nicht da“ → keine Istzeit, Schicht `absent`.
   - Fremder Dienst, Standtag, zukünftiger Tag, abgeschlossener Istplan → abgelehnt. Zweite Angabe → kein Duplikat, Version +1.
   - Viertelstunden, Ende nach Beginn, höchstens 16 Std.
   - Erinnerung nur einmal, nur 9–20 Uhr, nur an Personen ohne Antwort.
   - Stundenmeldung „Sonstiges für den Club“ ohne Sondereinsatz → gemeldet → bestätigt → Istzeit `self_report`.
   - Browser-Rundgang abgeschirmt: Zettel auf einem 360-px-Handy bedienbar.
7. **Ende:** Eintrag in `CHANGELOG.md`, Hilfe-Text, Rückweg (Version davor), neue Tabelle mit Rechten. Hansi in einfachen Worten berichten.
   Einspielen nur zum Termin.
