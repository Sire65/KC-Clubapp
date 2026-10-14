# Offene Aufgaben für Codex – Stand 14.10.2026

Claude hat am echten Stand nachgeprüft (Datenbank, Server-Funktionen, Repositories) – nicht nur an Aufträgen.
Bitte der Reihe nach abarbeiten; jeder Punkt nach AGENTS.md mit Feature-ID, Test, Versionserhöhung und Rückweg.
Keine Geheimnisse in Code, Repository oder Protokoll.

## Bereits erledigt (nicht nochmal machen)

- DP2-Mail-Eingang abgesichert (Sire65/dienstplan main).
- Backup-Prüfung `kc-db-backup-verify-v2` gibt ohne Token 401.
- Vergleiche mit konstanter Laufzeit in Backup-Worker, Scheduler-Familie und WM-Umfrage.
- Grenze bei `kc-communication-machine` → `register` (5 je Absender).
- Money-Butler-Zuordnung: exakter Vergleich, nur bestätigte E-Mail, keine Reaktivierung (eingespielt; Quelltext fehlt im Repo, siehe 4).
- Tageslauf der Sicherung 14.10. 05:19: `ok`, 253/253.
- Übergabe der Adress-Änderungen an den KC Manager funktioniert.

## 1. Dringend: `kc-zentrale` (Kasse/Manager) – Zugangswort

- Das Zugangswort steht noch fest im Server-Programm (Version 3); der Vergleich ist `!==`, ohne Hash. Wer es hat, liest alle Mitglieder mit Geburtsdatum.
- `orgId` geht unmaskiert und ohne feste Liste in die Abfrage.
- Zu tun:
  - Wort als Secret ablegen, nur Hash mit konstanter Laufzeit vergleichen.
  - `orgId` nur aus fester Liste (z. B. `KC_WERNE`), maskiert.
  - Neues Wort mit Übergang (alt + neu gültig), Anleitung je Kassen-PC, Übersicht „umgestellt ja/nein“.
  - Erst wenn alle PCs umgestellt sind: altes Wort abschalten, prüfen, dass es 401 liefert.
- In den Kasse-Repos gibt es dazu seit 10.10. noch keine Änderung.

## 2. Sicherung: hängende Läufe

- 14.10. 00:12 und 02:12 stehen auf `running` (0 Tabellen), älter als 2 Std. – der System Check meldet das bald als „hängt“.
- Zu tun: Ursache finden; abgebrochene Versuche sauber als abgebrochen kennzeichnen, damit künftig nichts mehr hängt.
- Alte Sätze (28.08., 11.10., 13.10.) **nicht verändern** – unveränderlich lassen; der System Check soll sie nur als Hinweis „Datenrest“ zeigen.

## 3. Dienstplan-Wünsche kommen live nicht an

- In der Datenbank warten 9 Dienstwünsche aus der Club-App mit Status `offen`; keiner wurde von DP2 abgeholt.
- Es wurden noch keine Tage veröffentlicht (`kc_dp_days_published` leer).
- Grund vermutlich: Die Abhol-Funktion steckt in den Builds 255–268, die nur als RC auf dem Zweig `codex/club-app-interface` liegen; `main` von dp3 steht auf Build 252.
- Zu tun: Handtest mit 2 PCs (Wunsch-Sperre), dann RC → FINAL, Zweig nach `main`; danach prüfen, dass die 9 offenen Wünsche abgeholt und bestätigt werden.

## 4. Quelltexte ins Repository

- Die eingespielten Korrekturen (Money Butler v3, Machine v9, Token-Vergleiche) stehen in keinem Repository.
- Zu tun: einchecken – mit Tests (Platzhalter-Adresse, unbestätigte Adresse, deaktivierte Zuordnung). Sonst überschreibt das nächste Hochladen die Korrekturen.

## 5. Kleinigkeiten

- Repo `kasse`, Datei `tools/run-event-simulation.cjs`: festes Passwort → Umgebungsvariable (Repo ist öffentlich).
- DP2-Admin-Anmeldung: Zwei-Faktor (TOTP) einschalten und anbieten (derzeit 0 eingerichtet).
- 23 von 38 `kc_dp_*`-Tabellen haben Zugriffsregeln, aber keine Leserechte für angemeldete Nutzer. Klären: Absicht (nur über Server-Funktionen) → tote Regeln entfernen; sonst Leserechte ausdrücklich ergänzen.
- Speicherschutz Mitgliederliste (`kc_manager_section_schutz`) steht seit 06.10. auf „melden“ (13 Meldungen). Wenn der KC Manager Konflikte sauber behandelt: auf „schützen“ umstellen. Dabei prüfen: In der KC-Verwaltung werden nach einem Konflikt ausdrücklich freigegebene Änderungen offenbar nicht gespeichert.
- Festnetznummer wird über den Namen zugeordnet → feste Kennung (Personennummer) verwenden.
- Alte Einmal-Funktionen in Supabase (`*-once`, `*-test`, `*-bootstrap`, liefern nur 410) löschen.
