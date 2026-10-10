# Freigabe Club-App 3.0 (FINAL)

Stand: 10.10.2026 · Grundlage: AGENTS.md Regel 9 (DEV → RC → FINAL), Regel 8 (Version), Regel 17 (Release unveränderlich)

## 1. Stufen und Zeitplan

| Stufe | Version | Zeitraum | Bedeutung |
|---|---|---|---|
| RC (Testversion) | **2.209.0** | ab 10.10.2026, mindestens 7 Tage | alle Mitglieder nutzen sie normal; nur Fehler werden behoben |
| FINAL | **3.0.0** | frühestens 18.10.2026 | nur wenn alle Prüfschritte unten grün sind |

Die Stufe steht in `version.json` (`"stufe"`) und in `app.js` (`APP_STUFE`); der Vertragstest prüft, dass beide gleich sind.
Der Admin sieht die Stufe neben der Versionsnummer („v2.209.0 RC“), Mitglieder nicht.

## 2. Regeln während der Testwoche (RC)

- **Nur Fehlerbehebungen.** Jede Korrektur bekommt eine neue Patch-Version (2.209.1, 2.209.2 …) und bleibt RC.
- **Keine neuen Funktionen.** Neue Wünsche kommen in die Liste „3.1“ (Abschnitt 6) und werden nach FINAL gebaut.
  Grund: Was in der Testwoche neu dazukommt, ist selbst nicht getestet.
- **Kritischer Fehler** (Datenverlust, Anmeldung geht nicht, Nachrichten kommen nicht an, App startet nicht):
  sofort beheben, neue RC-Version, die Testwoche beginnt für den betroffenen Bereich neu.
- Rückmeldungen der Mitglieder über **💬 Feedback** in der App oder direkt an Hansi.

## 3. Tägliche Prüfung in der Testwoche

| Was | Woher | Grenze |
|---|---|---|
| Fehlermeldungen der Apps | `kc_club_protokoll`, `fehler_*` (ohne Hinweis-Arten wie alte_version, update_*, umgebung, startzeit) | kein wiederkehrender Fehler auf 2.209.x |
| Server-Fehler | Edge-Function-Logs `kc-club`, `kc-termine` | keine 5xx außer einzelnen Netzaussetzern |
| Startzeit installierte App | `app_start` (`details.ms`, `app=true`) | Median ≤ 3 s, p90 ≤ 6 s |
| Datenbank | `db_monitor.report()` | `healthy` |
| Sicherung | `kc_club_sicherheit_status()` | Sicherung ≤ 26 h alt, kein Wiederherstellungsfehler |

## 4. Prüfschritte vor FINAL (Regel 9)

### 4.1 Regression (automatisch)
- [ ] `node tests/app-vertrag.test.mjs` grün
- [ ] `node tests/termine-kennung.test.mjs` grün
- [ ] DB-Testsuite `tools/db-test` (Fall 10, lokale PostgreSQL) plausibel
- [ ] Browser-Rundgang über alle 31 Seiten (Handy 393×873, Tablet 800×1280, Nacht, große Schrift, einfache Ansicht): keine Programmfehler, kein Überlauf
- [ ] ESLint (Programmfehler-Regeln) ohne echte Funde, alle `onclick`-Namen vorhanden, keine doppelten IDs

### 4.2 Visual-TÜV (Menschen, echte Geräte)
Jeweils durchsehen: Startseite (Countdown, Kerze, Ameisen), Nachrichten + Chat (Schreibfeld mit Tastatur), Termine (Liste/Kalender/To-do),
Mitglieder (alle 4 Ansichten), Pinnwand, Einstellungen (Rollkartei + Umschaltknöpfe), Live zeigen mit Werkzeugen und Ton.

| Gerät | Wer | erledigt |
|---|---|---|
| Android-Handy, Chrome, installiert | Hansi | [ ] |
| iPad, Safari | Hansi | [ ] |
| Android-Tablet, Chrome, installiert | Steven | [ ] |
| Handy mit Firefox | Steven | [ ] |
| ein Mitglied mit großer Schrift / einfacher Ansicht | (frei) | [ ] |
| Gedrucktes im Corporate Design (Regel 19): Einladung, Protokoll, Mitgliederliste, Brief | Hansi | [ ] |

### 4.3 Sicherheit
- [ ] Supabase-Sicherheitsberater: keine neuen Funde für `kc_club_*`
- [ ] `db_monitor.report()` → `healthy` (keine Tabelle ohne RLS, keine ungedeckten Rechte)
- [ ] Geheimnis-Suche über alle Dateien im Repository: keine Schlüssel
- [ ] Endpunkte ohne Anmeldung antworten 401 (`kc-club`, `kc-termine`, `kc-db-einspielen`)

### 4.4 Framework-Studio-/Architekturprüfung
- [ ] Keine Parallel-Cores: Umschaltknöpfe nur über KC-CLUB-ZYKLUS, Ton nur über KC-CLUB-ANRUF, Rollkartei nur über den Rollkartei-Kern
- [ ] Neue Anlässe/Werkzeuge über Registries (CD_ARTEN, VF_WERKZEUGE, SPRUENGE) statt fest verdrahtet
- [ ] Status ≠ Traffic, UNKNOWN nie als OK (Online-Anzeige ohne Netz, Live-Bild)
- [ ] Dokumentation aktuell (diese Datei, docs/STUDIO.md, docs/TERMINE.md, CHANGELOG.md)

### 4.5 Release-TÜV
- [ ] Zero-Cost-Check: keine kostenpflichtigen Dienste oder Abhängigkeiten neu dazugekommen
- [ ] Version 3.0.0 überall gleich (app.js, sw.js, index.html, version.json, Server), `"stufe": "FINAL"`
- [ ] „Was ist neu in 3.0“ für die Mitglieder geschrieben (statt „Kleine Systemverbesserungen“)
- [ ] Handbuch (Club-App-Anleitung) auf Stand 3.0
- [ ] Rückweg festgehalten: letzte RC-Version als Commit (RC 2.209.1 = `544bb26`), Rücksprung = diesen Stand erneut ausrollen
- [ ] Release-Tag `v3.0.0` auf GitHub (unveränderlich, Regel 17); Fehler danach nur mit 3.0.1 ff.
- [ ] Ankündigung an die Mitglieder (Pinnwand/Push)

## 5. Offene Punkte aus der Gesamtprüfung 5 (nicht blockierend)

- Nächtlicher Sicherungs-Arbeiter (`kc-db-backup-worker`, nicht in diesem Repository) endet mit HTTP 500 beim nachträglichen Status-Eintrag; Sicherung und Wiederherstellungstest selbst laufen (Status geprüft 10.10.).
- Liegen gebliebene, nie verknüpfte Anhänge (~1,4 MB) automatisch aufräumen.
- Notfall-Thread: soll dort nur der Admin schreiben dürfen? (Entscheidung Hansi)
- Einige kleine Tippflächen im Chat (Löschen, Reaktion) unter 40 px.
- `kc-termine`: Geheimnisvergleich wie in `kc-club` in gleichbleibender Zeit.
- Leistung: app.js ist groß (≈ 830 KB über die Leitung); Start installiert im Mittel 2,5 s – für 3.1 prüfen, ob selten genutzte Teile später geladen werden.

## 6. Wünsche für 3.1 (nach FINAL)

- Umschaltknöpfe Stufe 2 (Büro-Mitgliederliste, Schulungen, Inhaltsverzeichnis, Fitness, Helfen)
- Admin-Register Stufe 2 (Verlauf + Neustart über GitHub)
- Server-Start schneller (KC-CLUB-START-PARALLEL-3)
- weitere Countdown-Anlässe (Ostern, Sommerfest, Jahreshauptversammlung)
