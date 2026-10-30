# Konzept: Ruhige Club-App (KC-CLUB-RUHIG)

**Stand:** 31.10.2026 · **Status:** Konzept, Stufe 0 (Halloween aus) gebaut · **Auftrag:** Hansi nach der Clubsitzung vom 30.10.2026

## 1. Anlass

Kritik in der Clubsitzung am 30.10.2026:

- zu kompliziert, zu viel, zu großer Umfang
- zu viele Einblendungen
- Abstürze während der Dienstplan-Eingabe
- „Man kommt mit dem Programm nicht klar.“

Vorgabe Hansi: **„Im Moment keine Einblendungen. Kein Fitness, keine Tipps, keine Hinweise. Das Programm muss ruhiger werden.
Kein Halloween erzwingen. Nicht zwischendurch fragen.“**

## 2. Befund (aus dem Code, Stand 2.788.0)

| Punkt | Befund |
|---|---|
| Einblendungen | **64 Stellen**, an denen die App von selbst etwas zeigt, fragt, ansagt oder abspielt (Inventar in Abschnitt 8). Bis zu **13 davon starten zeitversetzt beim Öffnen** (nach 1,5 bis 25 Sekunden) und stapeln sich nacheinander. |
| Ohne Aus-Schalter | Mindestens 10 Einblendungen lassen sich gar nicht abschalten, z. B. das Pinnwand-Fenster, die Pinnwand, die sich selbst öffnet, der Dienst-Gruß, die Twinkey-Antwort, der Update-Balken und die Hinweise auf zwei Fenster. |
| Einfache Ansicht | Sie sperrt nur die Kachel-Effekte. **Alle anderen Einblendungen kommen trotzdem.** Die Aus-Schalter stehen fast alle nur in der erweiterten Ansicht, wer „einfach“ nutzt, findet sie nicht. |
| Bremse | `ruheInfo()` erlaubt nur ein Info-Fenster je Öffnen. Sie erfasst aber nur 6 der 64 Stellen, und Admins sind ganz ausgenommen. Wer die App als Admin testet, erlebt sie deshalb anders als die Mitglieder. |
| „Nicht stören“ | Schaltet nur Töne und Ansagen stumm. Die Fenster kommen trotzdem. |
| Umfang | 47 Kacheln. Die einfache Ansicht hat 13 statt der ursprünglich 8 Kacheln. `app.js` hat rund 37.000 Zeilen (4,2 MB). |
| Abstürze Dienstplan | Ursache war das Selbst-Update alle 10 Minuten bei bis zu 30 Versionen am Tag (30.10.: 2.759 bis 2.788). Behoben in 2.788.0 (KC-CLUB-UPDATE-DW-SCHUTZ). Die eigentliche Ursache ist die Zahl der Versionen, siehe Stufe 3. |
| Halloween | 2.787.0 hat Halloween am 31.10. bei allen erzwungen, auch bei „Kein Thema“. |

## 3. Leitsatz

> **Die App spricht nur, wenn man sie fragt.**
> Neues erkennt man an einer Zahl auf der Kachel, nicht an einem Fenster.
> Ausnahmen gibt es nur für Sicherheit, Notfall und einen echten Anruf.

## 4. Stufen

### Stufe 0: Halloween nicht erzwingen (KC-CLUB-RUHIG, 2.789.0), gebaut

- `HALLOWEEN_FUER_ALLE = false`: Am 31.10. gilt wieder die eigene Wahl beziehungsweise das Club-Thema.
- Die Regel bleibt im Code (Regel 1 des Vertrags: nichts still entfernen) und ist mit `true` wieder einschaltbar.
  Wer 🎃 möchte, wählt es unter ⚙️ → 🎭 Themen.
- Test: `tests/halloween-fuer-alle.test.mjs` prüft „aus“ als Standard und die Regel selbst.

### Stufe 1: Ruhemodus für alle (KC-CLUB-RUHIG-MODUS)

**Ein** zentraler Schalter `ruhig()` statt 40 einzelner Schalter.

- **Standard: an, für alle Mitglieder und auch für Admins.** Als Admin-Vorgabe server-weit (wie `ansicht`), je Gerät abwählbar.
- Der Schalter steht **in der einfachen Ansicht** unter ⚙️: „🤫 Ruhige App (empfohlen)“. Ausschalten stellt alles wieder her wie vorher (Rückweg ohne neue Version).
- Technisch an drei Stellen, keine Hotfix-Kaskade:
  1. die zwei Start-Blöcke (`neuLadenRoh` nach `INIT` und `start()` nach `neuLaden().then`): alle zeitversetzten Hinweise nur, wenn `!ruhig()`,
  2. `pwStart()`: Was-ist-neu, Pinnwand-Fenster, Einstieg-Tipp, Assistent und Tipp des Tages nur, wenn `!ruhig()`,
  3. `ruheInfo()`: liefert bei `ruhig()` immer `false`, die Admin-Ausnahme gilt dann nicht.
- Kein Code wird gelöscht: Jede Funktion ist weiter über ihre Kachel beziehungsweise ⚙️ erreichbar.

**Im Ruhemodus aus** (Nummern = Inventar Abschnitt 8):

| Gruppe | Was | Stattdessen |
|---|---|---|
| Fenster beim Start | Geburtstags-Karte (1), Ansicht-Frage (2, Standard „einfach“), Begrüßung (3), Was ist neu (4), Pinnwand-Fenster (5), Pinnwand öffnet sich selbst (6), Zettel-Erinnerung (7), Einrichten-Assistent (8), Film-Angebot (22), Dienst-Gruß (26), Reise-Checkliste (27), Twinkey-Antwort öffnet sich (28) | Zahl auf der Kachel; Geburtstag als eine Zeile auf der Startseite |
| Fragen | Unterstützung (32, Standard „wenig“), Einstieg-Fragen und Feedback (33), **Bewegung/Fitness (34)**, Kachel-Vorschlag (35), **Spiel-Einladung (36)**, Spiel-Herausforderung live (29), Push wieder einschalten (39) | gar nicht; Push steht unter ⚙️ |
| Tipps/Hinweise | **Tipp des Tages (43)**, Einweisung „Kurz erklärt“ (44), Rundgang-Hinweis (45), **Twinkey-Hilfe-Blase (47)**, Ansage-Vorgabe-Meldung (48), Laufband (49), Timer-Meldungen wie „Schnecke“ oder „Wer ist da“ (50) | Hilfe nur über ❓ |
| Töne/Ansagen | „Wer ist da“ beim Öffnen (51), Push-Ansagen (54), Kuckuck und Stundenuhren (57), Pinnwand-Ton und Szenen-Töne (58) | still; der Klingelton für einen echten Anruf bleibt |
| Effekte/Themen | Jahreszeit-Kopf mit Szenen (60), Kachel-Effekte (61), Glanz, Eselsohr-Blinken, Vogel, Gesteck (62), Empfangs-Effekt und Konfetti (63), Club-Thema übernehmen (Standard jetzt **aus**) | ruhiger, fester Kopf im Corporate Design |
| Hinweise auf Termine und Schulungen | Terminanfrage (37), Schulung (38), Eingangskorb (20), AB-Quittung (19) | Zahl auf der Kachel |
| Update | Balken „Neue Version“ (11), Selbst-Update während der Benutzung (10) | still beim nächsten Öffnen, siehe Stufe 3 |
| Zwei Fenster/Browser | Meldungen (12, 13) | das zweite Fenster legt sich still schlafen |

**Bleibt auch im Ruhemodus:**

- Notfall-Alarm (18), SOS
- Startnachricht vom Vorstand mit Bestätigung (16), Express-Sendung (17)
- „Neues Gerät – warst du das?“ (14), PIN-Sperre, wenn eingerichtet (15)
- echter Anruf und Anklopfen (30)
- Pflicht-Update (10): nur wenn die Mindestversion unterschritten ist, nie während einer Eingabe
- Vorstand und Büro (23–25, 31) nur, wenn die Person es unter ⚙️ selbst einschaltet

**Fitness:** Neben der Einladung (34) die Kachel „🏋️ Fit bleiben“ über die vorhandene Freigabe (`frei("fitness")`) auf „nur Test“ zurücknehmen.
Dafür ist keine Code-Änderung nötig; die Daten bleiben erhalten.

### Stufe 2: Weniger Umfang auf der Startseite (KC-CLUB-EINFACH-7)

- Einfache Ansicht von 13 auf **7 Kacheln**: 📅 Termine · 💬 Nachrichten · 🗓️ Mein Dienst (mit Dienstwünschen) · 📌 Pinnwand · 👥 Mitglieder · 📸 Fotos · 🆘 SOS.
  (Vorschlag, die endgültige Liste beschließt der Vorstand.)
- Alles andere unter einer Kachel **„➕ Mehr“** beziehungsweise in der erweiterten Ansicht. Es wird nichts gelöscht.
- Neue Funktionen kommen nicht mehr in die einfache Ansicht, nur noch in „Mehr“.

### Stufe 3: Stabilität und Update-Rhythmus (KC-CLUB-UPDATE-RUHIG)

- **Mitglieder bekommen höchstens eine Version pro Woche** (Vorschlag: Sonntag 20 Uhr). Die Bündel um 12 und 20 Uhr bleiben für den Admin und Testgeräte.
  Sofort nur bei Sicherheit, Datenverlust oder einem Fehler, der Mitglieder behindert. Dafür muss `AGENTS.md` angepasst werden (Freigabe Hansi).
- Kein Selbst-Update in einer laufenden Sitzung mehr, sondern nur beim nächsten Öffnen der App. 2.788.0 schützt bereits die Dienstwünsche, künftig gilt das für alles.
- **Bis nach dem Weihnachtsmarkt keine neuen Funktionen.** Nur noch Fehler beheben und Stufen 1–3 umsetzen.

### Stufe 4: Dienstwünsche ohne Umweg (KC-CLUB-DW-DIREKT)

- Ein direkter Link nur für die Dienstwünsche (`dienstwunsch.html`, gibt es schon): eine Seite, keine Kacheln, keine Einblendungen.
  Er wird über „🔗 Mein Zugang“ zusätzlich angeboten.
- Wer mit dem Handy nicht klarkommt: Vertretung (KC-CLUB-VERTRETUNG, gibt es schon). Hansi oder eine Vertrauensperson trägt die Wünsche nach Anruf oder Zettel ein.

## 5. Reihenfolge und Aufwand

| Schritt | Feature-ID | Version | Aufwand |
|---|---|---|---|
| 0 | KC-CLUB-RUHIG (Halloween aus) | 2.789.0 | gebaut, wartet auf Einspielen |
| 1a | Fitness-Freigabe zurücknehmen | ohne Version (Admin-Schalter) | 1 Minute |
| 1b | KC-CLUB-RUHIG-MODUS | nächstes Bündel | 1 Version |
| 2 | KC-CLUB-EINFACH-7 | nach Beschluss des Vorstands | 1 Version |
| 3 | KC-CLUB-UPDATE-RUHIG | zusammen mit 1b | Regel und kleine Code-Änderung |
| 4 | KC-CLUB-DW-DIREKT | vor dem Weihnachtsmarkt | klein |

## 6. Definition of Done

- **Tests (offline, in der CI):**
  - `tests/ruhig.test.mjs`: Bei `ruhig()` startet keiner der Start-Hinweise (Stufe 1); die Ausnahmen (Alarm, Startnachricht, Express, neues Gerät, Anruf) starten weiter.
  - Bei ausgeschaltetem Ruhemodus ist alles wie in 2.788.0.
  - Der Schalter steht im Bereich `einfach` der Einstellungen.
- **Klick-Rundgang** mit einem frischen Mitglieds-Testkonto (einfache Ansicht): App öffnen, 60 Sekunden warten, **kein einziges Fenster und kein Ton**.
  Dann Dienstwünsche eintragen, 15 Minuten lang, dabei eine neue Version und eine Nachricht von außen: kein Rauswurf.
- **Probe mit Mitgliedern:** 2–3 Mitglieder, die in der Sitzung Schwierigkeiten hatten, testen vorher auf ihrem eigenen Handy.
- **Rückmeldung** in der nächsten Clubsitzung (Vorschlag: 4 Wochen).
- `CHANGELOG.md` wird gepflegt; Update-Hinweis für Mitglieder: „Die App ist jetzt ruhiger.“

## 7. Offene Entscheidungen (Vorstand / Hansi)

1. Welche 7 Kacheln kommen in die einfache Ansicht?
2. An welchem Tag kommt die wöchentliche Mitglieder-Version?
3. Geburtstag: nur eine Zeile oder ganz still?
4. Ruhemodus auch für Vorstand und Admin als Standard? (Vorschlag: ja, damit alle dieselbe App erleben.)

## 8. Inventar: was die App von selbst zeigt (2.788.0)

Nur Quellcode, keine Mitgliederdaten. Zeilen in `app.js` ungefähr (Stand 2.788.0/2.789.0).

| # | Name | Funktion | Aus-Schalter heute |
|---|---|---|---|
| 1 | Geburtstags-Karte, Ständchen, Konfetti | `geburtstagPruefen` | keiner |
| 2 | Ansicht-Frage | `ansichtPruefen` | einmalig |
| 3 | Begrüßung „Drei Tipps“ | `begruessungPruefen` | einmalig |
| 4 | Was ist neu | `wasNeuZeigen` | `#setWasNeu` (nur erweitert) |
| 5 | Pinnwand-Fenster (auch alle 45 s) | `pwFenster` / `pwLive` | keiner |
| 6 | Pinnwand öffnet sich selbst | `pwStart` | keiner |
| 7 | Zettel-Erinnerung | `pwErinnern` | nur Fristen (Admin) |
| 8 | Einrichten-Assistent | `einrichtenEinmal` | einmalig |
| 9 | „Neu in Version“ (Admin) | `nachUpdatePruefen` | keiner |
| 10 | Pflicht-/Selbst-Update | `mindestPflicht` / `updateSelbst` | keiner |
| 11 | Update-Balken | `updatePruefen` | keiner |
| 12 | Zwei Fenster | `zweiFensterMelden` | keiner |
| 13 | Zwei Browser | `zweiBrowserMelden` | je Gerät |
| 14 | Neues Gerät | `neuesGeraetFragen` | – (Sicherheit) |
| 15 | PIN-Sperre | `lsPruefen` | PIN-Einstellung |
| 16 | Startnachricht | `snPruefen` | – (gewollt) |
| 17 | Express-Sendung | `expressPruefen` | – |
| 18 | Notfall-Alarm | `alarmPruefen` | – (gewollt) |
| 19 | AB-Quittung | `abStandZeigen` | keiner |
| 20 | Eingangskorb „Neu für dich“ | `eingangHinweisPruefen` | keiner |
| 21 | Ungelesen-Hinweis (Admin-Vorgabe) | `startHinweisPruefen` | Admin |
| 22 | Anleitungsfilm-Angebot | `filmHinweisPruefen` | „Nein, danke“ |
| 23 | Tages-Übersicht (Vorstand) | `buGrussFragen` | je Gerät |
| 24 | Eingangskorb ≥ 6 (Leitung) | `ekHinweisPruefen` | je Gerät |
| 25 | Sitzungs-Aufgabe (Büro) | `buAufgabePruefen` | je Aufgabe |
| 26 | Dienst-Gruß | `dgPruefen` | keiner |
| 27 | Reise-Checkliste | `rcAngebotPruefen` | je Reise |
| 28 | Twinkey-Antwort öffnet sich | `twAntwortPruefen` | keiner |
| 29 | Spiel-Herausforderung live | `spielLive` | „Spielbereit“ |
| 30 | Anruf, Anklopfen, Dazukommen | `onlinePing` | Privatsphäre |
| 31 | Schulungs-Kontrolle (Admin) | `scHinweisPruefen` | Später/Heute |
| 32 | „Wie viel Unterstützung?“ | `ustFragen` | einmalig |
| 33 | Einstieg-Fragen inkl. Feedback | `einstiegPruefen` | Admin `#eiAktiv` |
| 34 | Bewegungs-Einladung (Fitness) | `bwEinladungPruefen` | `#setBwEinladung` (nur erweitert) |
| 35 | Kachel-Vorschlag | `nuVorschlagPruefen` | `#setKachelVorschlag` |
| 36 | Spiel-Einladung | `spEinladung` | `#setSpielEinl` (nur erweitert) |
| 37 | Terminanfrage (alle 5 Min.) | `taHinweisPruefen` | nur Später/Heute |
| 38 | Schulungs-Einladung | `smHinweisPruefen` | Später/Heute |
| 39 | Push wieder einschalten | `pushPruefen` | keiner |
| 40 | „X hat sich angemeldet“ (Admin) | `spurFrage` | Knopf |
| 41–42 | Folge-Fragen eigener Aktionen | `klopfWartenFrage`, `sbLernFrage` | – |
| 43 | Tipp des Tages | `tippDesTages` | `#setTipps` (nur erweitert) |
| 44 | Einweisung „Kurz erklärt“ | `einwZeigen` | `#setEinw` |
| 45 | Rundgang-/Video-Hinweis | `rgHinweisZeigen` | „Nein, danke“ |
| 46 | Hinweis nach „erweitert“ | `einstiegHinweis` | keiner |
| 47 | Twinkey-Hilfe-Blase (10-s-Takt) | `hsPruefen` | `#setHs`/`#setHsE` |
| 48 | Ansage-Vorgabe-Meldung | `ansageVorgabeUebernehmen` | keiner |
| 49 | Laufband Sicherheit | `sdLaufbandAuf` | ✕ je Meldung |
| 50 | Timer-Meldungen (Hänger, Schnecke …) | `melde` | keiner |
| 51 | „Wer ist da“ beim Öffnen (Sprache) | `werIstDa` | Ansagen (nur erweitert) |
| 52–53 | Online/Verlassen-Ansage | `onlineAnsagen` | Standard aus |
| 54 | Push-Ansagen | `ansageMelden` | Ansagen |
| 55 | Anmelde-Ton (Admin) | `anmeldeTon` | `#setAnmeldeTon` |
| 56 | Chat vorlesen | `vorlesenNeue` | Standard aus |
| 57 | Kuckuck/Stundenuhren | `kuckuckPruefen` | `#setKuckuck` (nur erweitert) |
| 58 | Pinnwand-Ton, Ständchen, Szenen-Töne | `pwLive`, `hbSpielen` | `#setTon` |
| 59 | Themen inkl. Halloween/Club-Thema | `aktivesThema` | Halloween ab 2.789.0 aus |
| 60 | Jahreszeit-Kopf und Szenen | `jahreszeitKopf` | `#setJahreszeit` (nur erweitert) |
| 61 | Kachel-Start-Effekt, Wackeln | `kachelStartEffekt` | in „einfach“ schon aus |
| 62 | Glanz, Eselsohr, Vogel, Gesteck, Kerze | diverse | `animiert` u. a. |
| 63 | Empfangs-Effekt, Konfetti | `empfangsEffekt`, `konfetti` | `animiert` |
| 64 | Tag/Nacht, Lichtsensor | Takt | Design-Modus |
