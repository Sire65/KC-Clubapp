# Notiz für den Versionseintrag – KC-CLUB-AUFGABEN-STAND (19.11.2026, Wunsch Hansi)

- 📌 **Wie steht's mit deiner Aufgabe?** (KC-CLUB-AUFGABEN-STAND, Wunsch Hansi „Gib allen mit offenen Aufgaben eine Startmeldung mit der Aufgabe und ob sie
  erledigt ist: Ja, teilweise, nein“): Wer eine offene Aufgabe aus einem Protokoll hat, wird beim Öffnen der App gefragt – eine Woche vor der nächsten Sitzung
  und noch einmal 2 Tage vorher, wenn noch keine Antwort kam (überfällige Aufgaben höchstens einmal pro Woche). Drei große Knöpfe:
  **✅ Ja, erledigt** (kurz schreiben, was herausgekommen ist – wirkt wie das Abhaken, wer die Aufgabe eingetragen hat, bekommt Bescheid),
  **🔶 Teilweise** (kurz schreiben, was noch fehlt), **❌ Noch nicht** (Grund und neues Zieldatum freiwillig). „Später“ oder Schließen = 24 Stunden Ruhe.
  Gemeinsame Aufgaben: eine Meldung gilt für alle – der andere sieht „Frank hat gemeldet: 🔶 teilweise …“ und kann ergänzen. Wer 2 Tage vor der Sitzung
  noch nichts gemeldet hat, bekommt einmal eine Push „📌 Bitte kurz den Stand deiner Aufgabe melden“ (ohne App: Mail, nur 9–20 Uhr).
- 📝 **Stand melden** geht auch jederzeit direkt an der Aufgabe (Protokolle → Offene Aufgaben, im Protokoll); dort steht jetzt auch „🔶 teilweise“ bzw.
  „❌ noch nicht“ mit Datum.
- 📋 **Stand der Aufgaben im Protokoll**: Jedes neue Protokoll hat den Abschnitt „Stand der Aufgaben“ – alle noch offenen Aufgaben aus früheren Protokollen mit
  „✅ erledigt am 21.11.“, „🔶 teilweise“, „❌ noch nicht – neues Ziel …“ oder „❔ keine Rückmeldung“. Nicht Erledigtes erscheint so lange wieder, bis es
  erledigt ist. Im Entwurf aktualisiert er sich laufend, beim Veröffentlichen wird er festgeschrieben; auch im Ausdruck/PDF und im Archiv-Text.
  Wer das Protokoll schreibt, sieht „Rückmeldungen: 3 von 5“ mit den Namen der Fehlenden und kann mit „🔔 Nachfragen“ erinnern (höchstens alle 12 Stunden).
  Die bisherige Aufgaben-Liste in der Kurzfassung neuer Protokolle entfällt (sonst doppelt).
- Datenbank: nur neue Spalten (Migration `20261119_kc_club_aufgaben_stand.sql`, Probelauf `tools/db-test/116_…`); kein zusätzlicher Server-Aufruf beim
  App-Start – die Frage kommt mit den Startdaten (nur beim ersten Laden, 1 kleine Abfrage für Mitglieder mit offenen Aufgaben).
  Tests: `tests/aufgaben-stand.test.mjs`, Browser-Lauf `tools/hilfe/aufgaben-stand-browser.mjs`.

### 💐 Gemeinsame Karte: die Frage kommt jetzt sicher (KC-CLUB-GK-NACHFRAGE-IMMER, Fund Hansi 19.11. „Thomas hat die Anfrage für die Genesungskarte nicht bekommen“)
- Die Frage „💐 … braucht gerade gute Wünsche – magst du auch unterschreiben?“ kam bisher nur auf der **Startseite** und nur in der ersten Minute nach dem Öffnen. Öffnete die App z. B. in „Termine“ (so bei Thomas), kam sie nie.
- Jetzt kommt sie **auf jeder Seite**, sobald kein anderes Fenster offen ist (die App wartet bis zu 30 Minuten), und **bei jedem Öffnen der App wieder**, bis man unterschrieben hat oder „Nein, danke“ tippt. „Später“ = beim nächsten Öffnen nochmal fragen.
- Die zweite, ähnliche Frage nur auf der Startseite ist weg (sonst käme sie doppelt); die Zeile im Info-Laufband bleibt.
