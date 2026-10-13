# Auftrag an Codex: Sicherheitslücken schließen (Stand 13.10.2026)

Der Auftrag stammt aus dem Sicherheits-Abgleich von Claude für Hansi vom 13.10.2026.
Gelesen wurde der Quelltext aller 85 Server-Funktionen im Supabase-Projekt `ptblnpiroqftcvlsrhac` – keine davon wurde aufgerufen.

Bitte jeden Punkt nach dem KICC-Vertrag (AGENTS.md) umsetzen:
- Feature-ID
- Test
- Version erhöhen
- Rückweg

Regel 15 gilt: **keine Geheimnisse in Code, Repository oder Protokoll.**

Grundsatz für alle Server-Funktionen: `verify_jwt = true` schützt **nicht**.
Der öffentliche anon-/publishable-Schlüssel steht im Browser-Code, deshalb kommt jeder damit an der JWT-Prüfung vorbei.
Jede Funktion muss die Berechtigung selbst prüfen:
- angemeldeter Nutzer mit Rolle, oder
- Geheimnis aus Vault/Env, mit konstanter Laufzeit verglichen, oder
- GitHub-OIDC.

---

## 1. DRINGEND – `kc-dp-mail-inbound`: Absicherung übernehmen (Repo Sire65/dienstplan)

**Lücke:** Der Brevo-Weg nahm Mails ohne jede Prüfung an. Jeder konnte gefälschte Mails an `dp2@kc-werne.de` einliefern. Das löste Pushes mit frei gewähltem Absender und Betreff an alle Admins, Planer und Diensthabenden aus – ein Phishing-Kanal.

**Stand:** Claude hat es bereits behoben.
- Version 8 ist in Supabase eingespielt.
- Der Quelltext liegt im Zweig **`claude/sicherheit-mail-inbound`**.
- Neu: Der Brevo-Weg braucht den Header `x-kc-inbound-token`, verglichen mit dem Secret `KC_DP_BREVO_INBOUND_TOKEN`. Ist das Secret nicht gesetzt, ist der Weg zu.
- Der Resend-Weg mit Svix-Signatur bleibt unverändert.

**Zu tun:**
- Den Zweig in `main` übernehmen. **Sonst überschreibt das nächste DP2-Deploy die Absicherung.**
- Falls Brevo-Inbound je gebraucht wird: das Secret setzen und bei Brevo als Header eintragen.

**Fertig, wenn:**
- `main` den Code enthält.
- Ein Aufruf ohne Token 403 liefert.

## 2. `kc-zentrale` (Kasse/Manager): festes Zugangswort aus dem Code entfernen (Repo Sire65/kasse + Server-Funktion)

**Lücke:** Das Zugangswort (Header `x-kc-zugang`) steht fest im Quelltext der Server-Funktion. Wer es hat, kann zwei Dinge:
- alle Mitglieder mit Name, Mitgliedsnummer, Geburtscode (Geburtsdatum TTMMJJ) und Pseudonym lesen;
- Anwesenheiten und POS-Aliasse schreiben.

Außerdem wird `orgId` unmaskiert in die PostgREST-Abfrage gesetzt.

**Zu tun:**
1. Das Zugangswort ins Supabase-Vault oder als Function-Secret legen. Im Code nur noch einen SHA-256-Hash mit konstanter Laufzeit vergleichen.
2. **Neues Zugangswort erzeugen** (rotieren) und an den Kassen-PCs eintragen (`zentral-sync.js` liest `k.zugangswort` aus der lokalen Einstellung).
3. `orgId` nur als feste Liste erlauben (Registry), zum Beispiel `KC_WERNE`, und mit `encodeURIComponent` maskieren.

**Fertig, wenn:**
- Im Quelltext steht kein Zugangswort mehr.
- Das alte Zugangswort liefert 401.
- Die Kasse synchronisiert mit dem neuen Zugangswort.

## 3. `kc-money-butler-account-bootstrap`: Identität per E-Mail exakt zuordnen

**Lücke:** Die Zuordnung „Anmelde-Konto ↔ Mitglied“ läuft über die E-Mail mit `ilike`. Darin sind `_` und `%` Platzhalter, sodass eine ähnlich aussehende Adresse (z. B. `h_nsi@…`) ein fremdes Mitglied übernehmen kann.
Zusätzlich wird eine vom Admin **deaktivierte** Zuordnung stillschweigend wieder aktiviert.

**Zu tun:**
- Exakter Vergleich: `lower(email) = lower(:email)` mit `eq`.
- Nur bestätigte E-Mail-Adressen (`email_confirmed_at is not null`).
- Deaktivierte Zuordnungen nie automatisch reaktivieren.
- Das Ereignis protokollieren.

**Fertig, wenn:** Tests für Platzhalter-Adresse, unbestätigte Adresse und deaktivierte Zuordnung abgelehnt werden.

## 4. `kc-db-backup-verify-v2`: fehlender Token darf nicht durchlassen

**Lücke:** Liefert die RPC für den erwarteten Token `null`, kommt ein Aufruf **ohne** Header durch (`null !== null` ist `false`).

**Zu tun:** `if (!expected) return 401;`, danach mit konstanter Laufzeit vergleichen.

**Fertig, wenn:** Ein Aufruf ohne Header in jedem Fall 401 liefert.

## 5. Tagessicherung: Buchführung stimmt nicht (`kc-db-backup-worker`, Neon `kc_backup_sets`)

**Befund:**
- Die Sätze vom 11. und 13.10. stehen auf `status = 'error'` mit `ok_count = table_count − 1` (199/200, 174/175), obwohl im Satz alle 247 Tabellen gesichert und geprüft sind.
- Ein Satz vom 28.08. hängt noch auf `running`.
- Der System Check meldet deshalb „jüngster Versuch fehlgeschlagen“.

**Zu tun:**
- Ursache im Backup-Worker finden: welche Tabelle zählt als Fehler, und warum steht `table_count` auf 200 bzw. 175 statt 247?
- Den Satzabschluss korrigieren.
- Den Altlasten-Satz über den vorgesehenen Weg abschließen. Die Lösch- und Änderungssperre (Trigger `*_immutable`) bleibt.

**Fertig, wenn:**
- Der nächste Tageslauf `status = 'ok'` mit 247/247 hat.
- Der System Check dazu grün zeigt.

## 6. Kleinigkeiten (niedrig)

- **Vergleich mit konstanter Laufzeit** statt `===`/`!==` in `kc-db-backup-worker`, in der Scheduler-Familie (`kc-communication-scheduler`/`-maintenance`/`-frontend-check`/`-quality-gate`) und in `kc-wm-umfrage-notify`.
- **`kc-communication-machine` → `register`:** Jeder kann die 50 Plätze für wartende Geräte füllen. Eine Grenze je Absender ergänzen.
- **Repo `kasse`, Datei `tools/run-event-simulation.cjs`:** Das feste Simulations-Passwort durch eine Umgebungsvariable ersetzen. Das Repository ist öffentlich.
- **DP2-Admin-Zugang:** Supabase Auth hat für die Admin-Anmeldung keine Zwei-Faktor-Anmeldung. TOTP aktivieren und anbieten; das ist kostenlos.
- **Zur Kenntnis:** Die alten Pilot-Einstiege `kc-dp-i-4e91…` und `kc-dp-i-8a3f…` enthielten feste Tester-Schlüssel. Claude hat sie mit 410 stillgelegt, weil der Pilot seit 29.08. beendet ist. Bitte nicht wieder einspielen.
- **Aufräumen:** Rund 20 stillgelegte Einmal-Funktionen (`*-once`, `*-test`, `*-bootstrap`) liefern nur noch 410. Bei Gelegenheit in Supabase löschen.

---

## Bereits von Claude erledigt (nicht doppelt machen)

- **2.350.0:** Die GitHub-OIDC-Prüfungen sind zusätzlich an die Repository- und Besitzer-Nummer gebunden. Die Trigger-Funktion `kc_wm_umfrage_instant_notify` ist nicht mehr über die Datenschnittstelle aufrufbar.
- **2.352.0:**
  - In der Club-App können Mitglieder „Alle anderen Geräte abmelden“ (Handy verloren).
  - Wöchentlich liegt eine zweite, verschlüsselte Sicherungskopie getrennt von Neon bei Cloudflare.
- **Notfall-Tresor** (Cloudflare, `kc-notfall-tresor`): Er hält die Schlüssel-Kopie außerhalb von Supabase.
