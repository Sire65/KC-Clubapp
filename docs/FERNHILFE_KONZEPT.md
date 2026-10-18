# KC Fernhilfe – Messung und Konzept (KC-CLUB-FERNHILFE)

**Stand:** 18.10.2026 · **Status:** Konzept, noch nichts gebaut · **Auftrag:** Hansi („mit Fernhilfe Messung und Konzept anfangen“)

## 1. Ziel

Ein Helfer (Admin oder freigeschaltetes Mitglied) sieht die Club-App eines Mitglieds live und kann – nach Zustimmung – darin
zeigen und bedienen. Später optional Sprachkontakt. Dabei möglichst **keine Datenbanklast**, damit nichts gedrosselt wird.

**Kein neues Parallel-Modul** (KC-Entwicklervertrag Regel 3): Die Club-App hat das schon als **🎬 Studio** (KC-CLUB-STUDIO,
2.103.0/2.136.0): *Mitschauen* (Mitglied → Helfer) und *Vorführen* (Helfer → Mitglied, mit Zeiger). KC Fernhilfe ist die
Weiterentwicklung davon: gleiche Oberfläche, gleiche Rechte, gleiche Zustimmung – neuer Übertragungsweg und neue Steuerung.

## 2. Messung: was das Studio heute kostet

### Nutzung (Protokoll `kc_club_protokoll`)
| Aktion | Anzahl | Zeitraum |
|---|---:|---|
| Vorführen gestartet | 8 | 07.–10.10.2026 |
| Mitschauen angefragt / erlaubt / beendet | je 1 | 09.10.2026 |
| Bildschirmfoto angefragt / erlaubt | je 1 | 09.10.2026 |

→ Heute selten genutzt; die Kosten fallen also nur während einer Sitzung an, dann aber kräftig.

### Ablauf heute (aus dem Code, `app.js` + `kc-club`)
- **Sender** (`spgSenderStart`): prüft alle **400 ms** auf Änderungen (MutationObserver, Scroll, Eingabe). Bei Änderung
  wird der **ganze sichtbare App-Inhalt** (HTML, gzip, Base64) als neuer Rahmen geschickt; ohne Änderung alle 4 s ein „Ping“.
- **Server** (`schnappschuss_bild` / `vorfuehren_bild`): je Rahmen **1 Lesen + 1 Schreiben** in
  `kc_club_person_einstellung` – der Rahmen (bis 2 MB) wird in die Datenbank geschrieben.
- **Empfänger** (`ssHolen` / `vfHolen`): fragt alle **800 ms** nach (`schnappschuss_holen` / `vorfuehren_holen`) –
  je Abfrage **1 Lesen** des ganzen Eintrags samt Rahmen.

### Kosten je Live-Minute (berechnet aus dem Code, nicht live gemessen)
| | Aufrufe/Min. | Datenbank-Abfragen/Min. |
|---|---:|---:|
| Empfänger (alle 800 ms) | 75 | ≈ 75 Lesen |
| Sender, ruhige Seite (Ping alle 4 s) | 15 | ≈ 30 |
| Sender, viel Bewegung (bis alle 400 ms) | bis 150 | bis ≈ 300 (Hälfte Schreiben) |
| **Summe** | **90–225** | **≈ 105–375** |

→ Eine 30-Minuten-Sitzung kostet **≈ 3.000–11.000 Datenbank-Abfragen**, dazu werden bei viel Bewegung je Minute
bis zu 150 ganze Bildschirm-Rahmen in die Datenbank geschrieben und wieder gelesen. Zum Vergleich: ein Bau des
Notfall-Pakets kostet seit heute ≈ 3.300 Abfragen.

**Noch offen (Messpunkt F0):** tatsächliche Rahmengröße (KB je Rahmen) und der heutige Realtime-Verbrauch der App
(die App nutzt Realtime schon für Signale „neu“). Beides wird vor dem Bau gemessen.

## 3. Grenzen des kostenlosen Tarifs (Supabase-Doku, abgerufen 18.10.2026)

Quelle: https://supabase.com/docs/guides/realtime/limits · https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages

| Grenze (Free) | Wert | Folge für die Fernhilfe |
|---|---:|---|
| Realtime-Nachrichten je Monat | **2 Mio.** | jede Broadcast-Nachricht zählt **1× gesendet + 1× je Empfänger** |
| Nachrichten je Sekunde (Projekt) | 100 | eigene Obergrenze je Sitzung nötig |
| Gleichzeitige Verbindungen | 200 | unkritisch (17 Mitglieder) |
| Broadcast-Nachrichtengröße | **256 KB** | Vollbild muss klein bleiben bzw. aufgeteilt werden |
| Überschreitung (Free) | Hinweis + Kulanzfrist, Fair-Use | darf nicht passieren → harte Bremse |

**Budget-Rechnung:** Eine Sitzung mit höchstens **8 Nachrichten/s** (2 Bildänderungen + 6 Zeiger/Klicks) und 1 Empfänger
= 16 gezählte Nachrichten/s → 30 Min. ≈ **29.000**. Bei 2 Mio./Monat wären das rechnerisch ~65 Sitzungen à 30 Min.
– genug, aber nur mit Bremse und Monatszähler (der Rest der App braucht ihr Kontingent auch).

## 4. Konzept

### 4.1 Übertragung: Broadcast statt Datenbank
- Bild, Zeiger, Klicks laufen über **Supabase Realtime Broadcast** – nicht über Tabellen. Während der Sitzung: **0 Datenbank-
  Abfragen** für die Übertragung. Datenbank nur für Start (Anfrage, Zustimmung), Ende und Protokoll (≈ 5–10 Abfragen je Sitzung).
- **Nur Änderungen:** Beim Start ein Vollbild (gzip; > 200 KB → in Teile ≤ 200 KB), danach nur geänderte Bereiche
  (DOM-Änderungen je Abschnitt mit Prüfsumme), Scroll-Position, Zeiger, Klicks. Alle 60 s oder auf Nachfrage ein
  frisches Vollbild (Selbstheilung, falls ein Teil verloren ging).
- **Harte Bremsen:** ≤ 2 Bildänderungen/s, ≤ 6 Zeiger/Klick-Nachrichten/s, Nachrichtengröße ≤ 200 KB, Sitzung höchstens
  30 Min. (wie heute), Monatszähler mit Warnung an den Admin ab 50 % des Kontingents und Sperre neuer Sitzungen ab 80 %.
- **Sparmodus / langsames Netz:** weniger Bilder pro Sekunde, Zeiger zusammengefasst.

### 4.2 Abgesicherter Kanal – zwei Wege (Entscheidung beim Bau, nach Prüfung)
Private Broadcast-Kanäle prüfen den Zutritt über Zugriffsregeln auf `realtime.messages` mit dem **JWT** des Nutzers.
Die Club-App meldet Mitglieder aber nicht über Supabase Auth an, sondern über den persönlichen Link. Daher:

- **Weg A (bevorzugt): privater Kanal mit kurzlebigem Sitzungs-JWT.** `kc-club` stellt nach Zustimmung beiden Seiten ein
  JWT aus (gültig ≤ 30 Min., nur Thema `fernhilfe:<sitzung>`, Rolle Helfer/Mitglied). Zugriffsregel: nur dieses Thema, nur
  diese beiden. Voraussetzung: Signierschlüssel des Projekts in der Edge Function verfügbar – wird in F0 geprüft.
- **Weg B (Rückfall ohne JWT): geheimes Sitzungsthema + Ende-zu-Ende-Verschlüsselung.** Zufälliges Thema je Sitzung
  (wie heute `kc_club_rt_kanal`, aber je Sitzung neu) und jede Nachricht mit AES-GCM verschlüsselt; den Schlüssel bekommen
  nur die beiden über `kc-club`. Wer das Thema errät, sieht nur Rauschen und kann nichts einschleusen.
- In beiden Fällen: Projekt-Einstellung „nur private Kanäle“ erst nach Umstellung der übrigen App-Kanäle prüfen
  (die heutigen Signal-Kanäle sind öffentlich angemeldet).

### 4.3 Steuerung (Fernhilfe im engeren Sinn)
- Der Helfer kann im Bild **zeigen** (Zeiger, wie heute) und – nur wenn das Mitglied „🖱️ Bedienen erlauben“ antippt –
  **tippen, scrollen, Bereiche öffnen**. Ausgeführt wird in der App des Mitglieds über die normalen Funktionen.
- **Nie ferngesteuert:** Senden von Nachrichten, Löschen, Express/Notfall, Zahlungen/Erstattung absenden,
  Einstellungen zu Privatsphäre/Zugang, Abmelden – hier erscheint beim Mitglied „Helfer möchte … – ✔ Ja / ✖ Nein“.
- **Nicht übertragen:** Eingabefelder für Geheimnisse und Zugangsdaten (wie heute im Studio: privat-Modus,
  „Vorhang“), Notfallpass-Inhalte.
- Nur innerhalb der Club-App (eine Web-App kann andere Apps grundsätzlich nicht sehen oder bedienen).

### 4.4 Sicherheit und Ablauf
1. Helfer: Mitglied → „🛟 Fernhilfe anbieten“ (nur Admin oder freigeschaltete Helfer, Rechte wie Studio).
2. Mitglied bekommt Push + Fenster: „Hansi möchte dir helfen – ✔ Zusehen lassen / 🖱️ Zusehen und bedienen lassen / ✖ Nein“.
3. Während der Sitzung beim Mitglied immer sichtbar: rote Leiste „🛟 Fernhilfe läuft – ⏹ Beenden“; beide können jederzeit beenden.
4. Automatisches Ende nach 30 Min. oder 3 Min. ohne Lebenszeichen.
5. Protokoll: angefragt, erlaubt (Stufe), beendet (durch wen), Dauer, Anzahl Nachrichten – keine Inhalte.

### 4.5 Sprachkontakt (später, Stufe F4)
Sprache direkt zwischen den Geräten (WebRTC) mit öffentlichem STUN; Broadcast nur für den Verbindungsaufbau.
Zero-Cost-Grenze: ohne eigenen TURN-Server klappt es in manchen Netzen nicht – dann Hinweis „Bitte anrufen“.
Eigener TURN-Server wäre kostenpflichtig oder Selbstbetrieb → erst nach Freigabe.

## 5. Stufen, Tests, Definition of Done

| Stufe | Inhalt | Tests / Messkriterium |
|---|---|---|
| **F0** | Messen: Rahmengröße, heutiger Realtime-Verbrauch, Signierschlüssel für Weg A verfügbar? | Zahlen im Dokument nachgetragen |
| **F1** | Mitschauen und Vorführen über Broadcast (gleiche Oberfläche), alter Datenbank-Weg als Rückfall per Schalter | Lauf-Test (Deno) Sender/Empfänger lokal; Vertragstests; 1 Testsitzung Admin ↔ Testzugang: 0 DB-Abfragen während der Übertragung (Server-Log `{"db":…}`), Realtime-Nachrichten ≤ 8/s |
| **F2** | Nur Änderungen statt Vollbild, Teile ≤ 200 KB, Selbstheilung | Testseite mit großen Listen; kein Rahmen > 200 KB; Bild nach künstlichem Verlust ≤ 60 s wieder vollständig |
| **F3** | Bedienen mit Zustimmung, Sperrliste, Bestätigungsfenster | Tests: gesperrte Aktionen lösen nie direkt aus; Ende durch Mitglied wirkt sofort |
| **F4** | Sprache (optional) | nach eigener Freigabe |

**DoD je Stufe:** Feature-ID im Code, Tests grün, Server-Log-Messung dokumentiert, CHANGELOG, Hilfe/Twinkey/Lupe/Video
nachgezogen, Rückweg beschrieben.

**Rückweg:** Schalter „Fernhilfe über Broadcast“ aus → alter Studio-Weg (Datenbank) wie bisher. Keine Datenbank-Änderung
nötig außer ggf. Zugriffsregel auf `realtime.messages` (Weg A), die per Migration wieder entfernt werden kann.

## 6. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Realtime-Kontingent (2 Mio./Monat) wird knapp | Bremsen je Sitzung, Monatszähler, Sperre ab 80 % |
| Großes Vollbild > 256 KB | Aufteilen, Bilder/Avatare als Platzhalter statt Inhalt |
| Unbefugtes Mithören | Weg A (privater Kanal) oder Weg B (E2E-Verschlüsselung), Sitzung je Thema neu |
| Fehlbedienung aus der Ferne | Sperrliste + Bestätigung beim Mitglied, sichtbare Leiste, sofortiges Ende |
| Mischstand alte/neue App bei Sitzung | Sitzung prüft Version beider Seiten; bei Unterschied alter Weg |
