# 🪑 Runder Tisch – Spezifikation (KC-CLUB-RUNDER-TISCH)

**Stand:** 30.10.2026 · **Status:** RT1, RT1b Arten, Gruppen + Platzmessung gebaut und eingespielt als 2.762.0; **Live (Ton, Kamera, Bildschirm, Unterlagen zeigen, Redestab) gebaut als 2.766.0** (Abschnitt 17); 🔒 erst nur Admin zum Testen; Club-Song, Videos, Album, Gäste (RT4) offen · **Auftrag:** Hansi („Runder Tisch für die Club-App, Konzept und Spezifikation“, „fang mit RT1 an“)
**Entwurf zum Anklicken:** https://claude.ai/artifact/5WfwmnFKfEm5nj8FmK2qFL (Tisch mit 2–18 Plätzen, Chat-Ansicht; Namen sind Beispiele)

## 1. Ziel

Ein Mitglied lädt zu einem **Thema** an einem **Tag und einer Uhrzeit** ein, z. B. „Donnerstag 20:00 – Club-Song“.
Wer Interesse hat, sagt zu. Zur Startzeit erscheint in der App ein runder Tisch. Man setzt sich dazu und macht mit:
schreiben, sprechen, Fotos, PDFs, kurze Videos zeigen, gemeinsam den Club-Song hören.

### Entscheidungen Hansi (30.10.2026)
| Frage | Entscheidung |
|---|---|
| Wer darf einladen? | **Jedes Mitglied** |
| Wer darf beitreten? | **Jeder**, auch ohne Zusage (spontan dazukommen) |
| Wie viele? | **Höchstens 18 Personen** am Tisch |
| Speichern | **Nicht lange**, damit die Datenbank nicht vollläuft (Fristen siehe 6.) |
| Gäste | **Externe Gäste** (z. B. Experten) sollen eingeladen werden können – **jedes Mitglied darf Gäste einladen** |
| Fristen | **7 Tage** (Dateien) und **30 Tage** (Chat) passen |

## 2. Keine Parallel-Module (KC-Entwicklervertrag Regel 3)

Der Runde Tisch ist **ein Zusammenschluss vorhandener Bausteine**, keine Neuentwicklung daneben:

| Baustein im Tisch | Vorhanden als | Was neu dazukommt |
|---|---|---|
| Einladung, Zusage, Erinnerung | Clubtermine + KC-CLUB-ERINNERUNG-WAHL | Termin-Art „🪑 Runder Tisch“ mit Thema, Dauer, Plätzen |
| Tisch-Chat (Text, 🎤 Sprachnachricht, ✍️ Diktieren, 📎) | Runden-Chat (KC-CLUB-GRUPPE-AUS-RUNDE), Lesestand | Runde gehört zum Tisch, wird nach Frist aufgeräumt |
| Fotos | Foto-Hochladen mit 💾 Platzsparend (KC-CLUB-FOTO-PLATZ) | Im Tisch immer „platzsparend“, ohne Rückfrage |
| Kurze Videos | KC-CLUB-VIDEOS (720p, ≈10 MB/Min., höchstens 60 s) | – |
| PDF | Anlagen im Chat (KC-CLUB-DRUCK-SENDEN) | „Allen zeigen“: alle springen auf dieselbe Seite |
| Live-Sprechen | KC-CLUB-KONFERENZ (Ton, Handy zu Handy) + KC-CLUB-ANRUF-TURN (Umleitung) + KC-CLUB-ANRUF-BESSER | Sprecherplätze + Zuhörer (siehe 5.) |
| Club-Song | KC-CLUB-SONG (Bühne, Web Audio, Karaoke) | Gemeinsamer Start auf allen Handys |
| Externe Gäste | KC-CLUB-ZUGANG (👤 Mitglied / 🧑‍🍳 Aushilfe / 🙋 Gast) | Neue Zugangsart „Tischgast“ mit Ablauf |
| Live-Zustand (wer sitzt, wer spricht) | Direkte Leitung über Realtime (KC-CLUB-RT-KANAL-WECHSEL) | Eigener Kanal je Tisch |
| Nachladen | KC-CLUB-TEILE | Neues Teil `teile/runder-tisch.js` (nicht beim Start geladen) |

## 3. Ablauf für Mitglieder

1. **Einladen:** Kachel „🪑 Runder Tisch“ → „Tisch einladen“. Möglichst auswählen statt tippen (Vertrag Regel 13):
   Thema (vorhandene Themenliste oder neu), Tag und Uhrzeit (Auswahl), Dauer **30 / 60 / 90 Min.**, Plätze **4–18** (Vorgabe 18),
   optional Gast (siehe 4.). Twinkey kann die Einladung per Frage und Antwort anlegen (wie beim Dienstwunsch).
2. **Ankündigen:** Erscheint in Neuigkeiten und Terminen. Knopf **„Ich setz mich dazu ✋“** (Zusage). Die Zusagen sieht man als
   Kochmützen um den Tisch. Die Erinnerung läuft über KC-CLUB-ERINNERUNG-WAHL (Vorschlag: 1 Tag vorher ab 10 Uhr und 15 Min. vorher).
3. **Tisch erscheint:** 15 Min. vor Beginn steht auf der Startseite (auch in der einfachen Ansicht) die Karte
   „Gleich: Runder Tisch *Thema*, 20:00“. Ab Startzeit heißt der Knopf **„Jetzt Platz nehmen“**.
4. **Spontan dazukommen:** Jedes Mitglied kann beitreten, solange ein Platz frei ist, auch ohne Zusage.
5. **Tisch voll (18):** „Tisch voll – Warteplatz“. Wird ein Platz frei, kommt eine Nachricht in der App (kein Push an alle).
6. **Ende:** Nach Ablauf der Dauer erscheint 5 Min. vorher „Tisch schließt um …“. Der Gastgeber kann um 30 Min. verlängern oder früher schließen.
   Danach ist der Tisch nur noch lesbar, bis die Fristen ablaufen.

## 4. Externe Gäste (Tischgast)

Der heutige 🙋 Gast-Zugang (KC-CLUB-ZUGANG) ist **dauerhaft** und darf u. a. Nachrichten an alle Mitglieder schreiben.
Für Experten von außen passt das nicht. Deshalb kommt eine neue Zugangsart dazu: **`tischgast`**.

- **Wer lädt ein:** der Gastgeber des Tisches. Er gibt Name und Rolle ein (z. B. „Dr. Weber, Musiker“).
- **Link:** persönlicher Link, wie die bestehenden Zugangslinks. Er gilt **nur für diesen einen Tisch**, von **30 Min. vor Beginn bis Tischende**,
  und nur auf **einem Gerät** (das erste Gerät, das ihn öffnet). Danach ist er ungültig, auch wenn er weitergeleitet wurde.
- **Was ein Tischgast darf** (`ZUGANG_AKTIONEN.tischgast`): nur diesen Tisch öffnen, im Tisch-Chat schreiben und zeigen, sprechen, wenn er den Redestab hat.
  **Nichts sonst:** keine Kacheln, keine Mitgliederliste, keine Termine, kein Album, kein Clubchat, keine Kontaktdaten.
  Er sieht von den Teilnehmenden **nur Vornamen und Avatar**.
- **Erkennbar:** goldener Ring und Schild „Gast“ am Platz. In der Einladung steht „Mit Gast: *Name*“, damit jedes Mitglied vorher Bescheid weiß.
- **Höchstens 2 Tischgäste** je Tisch; sie zählen zu den 18 Plätzen.
- **Sperre auf dem Server:** `zugangPruefen` gilt unverändert, die neue Liste kommt dazu. Zusätzlich prüft jede Tisch-Aktion, ob die `tisch_id` die des Links ist.
- **Datenschutz-Hinweis** für den Gast beim ersten Öffnen (was er sieht, was gespeichert wird, wann es gelöscht wird).

## 5. Sprechen

### Was die vorhandene Technik kann
KC-CLUB-KONFERENZ verbindet heute **jeden mit jedem** (bis 4 Personen). Bei 18 Personen wären das 153 Verbindungen;
jedes Handy müsste an 17 andere senden. Das schaffen Handys nicht zuverlässig.

### Lösung: Sprecherplätze und Zuhörer
- **Höchstens 2 Sprecherplätze gleichzeitig** (der Gastgeber und wer den 🥄 Redestab hat).
  Nur Sprechende senden Ton. Alle anderen empfangen nur (Verbindung nur in eine Richtung).
- **Redestab:** „✋ Ich möchte was sagen“ → der Gastgeber tippt auf den Platz und gibt den Löffel weiter. Er kann ihn jederzeit zurücknehmen.
- **Umleitung:** Klappt der direkte Weg nicht, läuft der Ton über die bestehende Umleitung (Metered, KC-CLUB-ANRUF-TURN).
  Grobe Rechnung: Ton ≈ 32 kbit/s × 17 Zuhörer × 60 Min. ≈ 245 MB je Sprecherstunde, auch wenn alles umgeleitet wird.
  Bei 50 GB/Monat reicht das. Der Monatsverbrauch steht schon heute am Lämpchen unter Admin → 🧯 Notfall.
- **Immer möglich: 🎤 Sprachnachrichten** im Tisch-Chat. Klappt Live nicht, sagt die App das klar
  („Live gerade nicht möglich – Sprachnachricht senden“) und zeigt es nie als „verbunden“ (Vertrag Regel 11).
- **Keine Aufzeichnung** des Live-Tons.
- **Stufe RT3 beginnt mit einer Messung** (wie Fernhilfe F0): 1 Sprecher → 17 Zuhörer auf echten Handys über das Mobilnetz.
  Das Ergebnis legt die Höchstzahl für Live-Zuhörer fest. Wird sie überschritten, hören die Übrigen nur Sprachnachrichten.

## 6. Speichern und Aufräumen (KC-DB-SPARSAM)

| Was | Wie lange | Danach |
|---|---|---|
| Fotos, Videos, PDFs, Sprachnachrichten im Tisch | **7 Tage** nach Tischende | gelöscht (Datei + Eintrag) |
| Text im Tisch-Chat | **30 Tage** nach Tischende | gelöscht |
| Kurzprotokoll (Thema, Datum, Gastgeber, Anzahl Teilnehmende, Dauer) | dauerhaft | – |
| Tischgast-Zugang | bis Tischende | ungültig, Zeile nach 7 Tagen gelöscht |
| Live-Zustand (wer sitzt, Redestab, Song) | nur im Realtime-Kanal | wird nicht gespeichert |

- **Ins Fotoalbum übernehmen:** Vor Ablauf kann der Gastgeber oder der Hochladende einzelne Fotos/Videos mit einem Tipp ins Album übernehmen.
  Sie zählen dann zum Album und werden nicht gelöscht.
- **Fristen** stehen als Werte an einer Stelle (Server), nicht verstreut im Code.
- **Aufräumen** läuft in der bestehenden Wartung (Tagesaufgaben), keine eigene Zeitschaltung.
- **Grenzen beim Hochladen:** Fotos immer platzsparend (≈130 KB), Videos höchstens 60 s / 720p, PDF höchstens 10 MB,
  je Person und Tisch höchstens 20 Dateien.

## 7. Datenbank-Last

Die Konferenz fragt heute alle 2 s `konferenz_status` ab. Bei 18 Personen wären das über 500 Abfragen pro Minute.
**Deshalb gilt für den Tisch:**
- Live-Zustand (Anwesenheit, Sprecher, Redestab, ✋, Song-Start, PDF-Seite) läuft **nur über den Realtime-Kanal des Tisches** (Presence/Broadcast), nicht über die Datenbank.
- Die Datenbank wird nur bei **Ereignissen** beschrieben: Tisch anlegen, Zusage, Beitreten/Verlassen (für das Kurzprotokoll), Beitrag im Chat, Ende.
- **Ziel:** höchstens 3 Abfragen je Person und Minute im Mittel, gemessen in RT1 mit 3 Geräten und hochgerechnet auf 18.
- **Realtime-Kontingent:** Grob 18 Personen × 1 Signal je 10 s × 18 Empfänger × 60 Min. ≈ 117.000 Nachrichten je Tischstunde.
  Bei 2 Mio./Monat reicht das für etwa 15 volle Tischstunden im Monat. Darum: Herzschlag alle 15 s statt 10 s und nur Änderungen senden.
  In RT1 wird gemessen; der Monatsstand kommt als Messwert in `kc_club_messwerte`.

## 8. Datenmodell (Vorschlag)

Jede Migration mit `enable row level security`, `revoke all … from public, anon, authenticated` und
`grant select, insert, update, delete … to service_role` (KC-SUPABASE-GRANTS). Zugriff nur über den Club-Server.

- `kc_club_tisch`: `id`, `thema`, `beginn`, `dauer_min`, `plaetze` (4–18), `gastgeber_person_id`, `runde_id` (Tisch-Chat),
  `status` (`geplant`/`offen`/`geschlossen`/`abgesagt`), `geschlossen_am`, `medien_geloescht_am`, `text_geloescht_am`
- `kc_club_tisch_teilnahme`: `tisch_id`, `person_id` oder `gast_id`, `zusage_am`, `erstmals_dabei`, `zuletzt_dabei`
- `kc_club_tisch_gast`: `id`, `tisch_id`, `name`, `rolle`, `link_hash` (nie der Link selbst), `geraet_kennung`, `gueltig_von`, `gueltig_bis`, `eingeladen_von`
- Kurzprotokoll: Eintrag in `kc_club_protokoll` (`tisch_beendet` mit Thema, Anzahl, Dauer), keine neue Tabelle.

Server-Aktionen (Vorschlag): `tisch_anlegen`, `tisch_aendern`, `tisch_absagen`, `tisch_zusage`, `tisch_beitreten`, `tisch_verlassen`,
`tisch_redestab` (nur Gastgeber), `tisch_gast_einladen`, `tisch_gast_zurueckziehen`, `tisch_ins_album`, `tisch_schliessen`.

## 9. Darstellung (siehe Entwurf)

- **2–8 Personen:** große Plätze (Kochmütze/Avatar, Vorname).
- **9–18 Personen:** kleinere Plätze gleichmäßig im Kreis. Wer spricht, rückt nach oben (12 Uhr).
- **Tischmitte:** Thema, Restzeit, was gerade gezeigt wird (PDF-Seite, Foto, 🎵 Club-Song).
- **Zeichen am Platz:** grün pulsierend = spricht · 🥄 Redestab · ✋ möchte sprechen · goldener Ring = Gast ·
  grau = **Zustand unbekannt** (kein Herzschlag seit 45 s), nie als „da“ anzeigen (Vertrag Regel 11).
- **Chat-Ansicht:** Der Kreis wird zur Leiste oben (Sprecher und Gäste vorn), darunter der Chat.
- **Leiste unten:** 💬 Schreiben · 🎙️ Sprechen · 📎 Zeigen · 🎵 Song. Große Knöpfe, auch in der einfachen Ansicht.
- Alle Designs (Küchengrün, Nordsee, Lagune, Nachtmodus, große Schrift) und `prefers-reduced-motion` werden unterstützt.

## 10. Stufen, Tests, Definition of Done

Jede Stufe ist eine eigene Version im 12-/20-Uhr-Bündel (KC-DB-SPARSAM), mit Rückweg.

### RT1 – Einladen, Zusage, Tisch-Chat (KC-CLUB-RUNDER-TISCH-1)
Umfang: Termin-Art Runder Tisch, Zusage, Erinnerung, Startseiten-Karte, Beitreten/Verlassen, Platzgrenze + Warteplatz,
Tisch-Chat mit Text, Sprachnachricht, Foto, PDF, Kurzprotokoll, Aufräumen nach Fristen. Darstellung Tisch + Chat-Ansicht.
**Tests:**
- Vertragstest: Aktionen in App und Server, Zugang (Gast/Aushilfe dürfen nicht anlegen; Mitglied darf), Migration mit Rechten (`migration-rechte.test.mjs`).
- Platzgrenze atomar: der 19. Beitritt wird abgelehnt, auch bei gleichzeitigen Anfragen (Probelauf `tools/db-test/`).
- Aufräumen: nach 7 Tagen Medien weg, nach 30 Tagen Text weg, Kurzprotokoll bleibt, ins Album Übernommenes bleibt.
- Browser-Test mit 3 Fenstern: Einladen → Zusage → Startzeit → Platz nehmen → schreiben → Ende.
- Messung der Datenbank- und Realtime-Last (Ziel aus 7.).
**Fertig, wenn:** Tests grün; Hilfe-Eintrag, Twinkey, Suchbegriff und Erklär-Video vorhanden; CHANGELOG-Eintrag mit Rückweg; Hansi hat es auf dem Handy ausprobiert.

### RT2 – Zeigen und Club-Song (KC-CLUB-RUNDER-TISCH-2)
Umfang: kurze Videos, PDF „Allen zeigen“ (gleiche Seite), „🎵 Club-Song für alle“ (Startzeit per Realtime, jedes Handy spielt selbst, Karaoke-Text), ins Album übernehmen.
**Tests:** Song-Start auf 3 Fenstern höchstens 300 ms auseinander; Spätkommer steigen an der richtigen Stelle ein; Video > 60 s wird gekürzt (bestehender Test KC-CLUB-VIDEOS greift); PDF-Seite folgt dem Gastgeber.
**Fertig, wenn:** wie RT1.

### RT3 – Live-Sprechen mit Redestab (KC-CLUB-RUNDER-TISCH-3)
Umfang: Messung (siehe 5.), danach Sprecherplätze + Zuhörer auf Basis KC-CLUB-KONFERENZ, Redestab, ✋, Umleitung, klarer Rückfall auf Sprachnachrichten.
**Tests:** `tools/anruf/`-Browser-Test mit 1 Sprecher → mehreren Zuhörern, auch über lokalen TURN; Redestab-Wechsel ohne Abbruch; Zuhörer ohne Mikrofon-Freigabe hören trotzdem; Abbruch wird als „getrennt“ angezeigt, nie als „verbunden“.
**Fertig, wenn:** wie RT1, zusätzlich Messwerte im Protokoll und Metered-Verbrauch im Lämpchen geprüft.

### RT4 – Externe Tischgäste (KC-CLUB-RUNDER-TISCH-GAST)
Umfang: Zugangsart `tischgast`, Link mit Zeitfenster und Gerätebindung, Einschränkungen aus 4., Hinweis „Mit Gast“, Datenschutz-Hinweis.
**Tests:** Sandkasten wie bei KC-CLUB-ZUGANG (Gegenprobe: ohne Server-Sperre rot): Tischgast bekommt 403 auf alles außer dem eigenen Tisch;
Link vor Beginn −30 Min. und nach Ende ungültig; zweites Gerät abgelehnt; keine Kontaktdaten in Antworten; Link nur als Hash gespeichert.
**Fertig, wenn:** wie RT1, zusätzlich Sicherheitsdurchsicht (KC-CLUB-RC-PRUEFUNG) bestanden.

## 11. Noch offen (Hansi entscheidet)

Entschieden am 30.10.2026: jedes Mitglied darf Tischgäste einladen (RT4); Fristen 7/30 Tage bleiben.

Entschieden am 30.10.2026 (später): **Gäste dürfen auch reden** (RT3/RT4: wie Mitglieder mit dem 🥄 Redestab); Tische, Seminare und Besprechungen
können **auch nur für eine Gruppe** angesetzt werden (Abschnitt 14, gebaut in 2.762.0). Zurzeit nichts offen.

## 12. Umsetzung RT1 (2.762.0) – was gebaut ist und wo es von oben abweicht

| Teil | Umsetzung |
|---|---|
| Datenbank | `supabase/migrations/20261030_kc_club_v2762_runder_tisch.sql`: `kc_club_tisch`, `kc_club_tisch_teilnahme`, Funktion `kc_club_tisch_beitreten` (Platzgrenze unter Zeilensperre). Probelauf `tools/db-test/96_runder_tisch_test.sql`; zusätzlich lokal 30 gleichzeitige Anfragen auf 18 Plätze → genau 18 Plätze, 12 „voll“ |
| Regeln | `supabase/functions/kc-club/runder-tisch.js` (rein, Test `tests/runder-tisch.test.mjs`) |
| Server | Aktionen `tisch_liste`, `tisch_anlegen`, `tisch_zusage`, `tisch_platz` (Platz nehmen + Herzschlag), `tisch_verlassen`, `tisch_gastgeber` (absagen/verlängern/schließen); Wartung `tischWartung` |
| App | Kachel „🪑 Runder Tisch“ (Club), Karte auf der Startseite ab 15 Min. vor Beginn, Tisch mit Plätzen im Kreis, Einladen mit Auswahl, Push-Link `#tisch=<id>` |
| Freigabe | `runder_tisch` in den Freigaben – bis Hansi „für alle“ wählt, sieht und bekommt es nur der Admin (🔒 Test) |
| Zugang | Nur Mitglieder. Gäste/Aushilfen: Aktionen nicht in `ZUGANG_AKTIONEN` → 403 (externe Tischgäste kommen mit RT4) |

**Abweichungen von der Spezifikation (bewusst):**
- **Eigene Liste statt Clubtermin:** Ein Tisch ist kein Eintrag in `kc_club_treffen`. Sonst stünden die Tische aller Mitglieder im offiziellen
  Terminkalender, in Sitzungs-Abläufen und in den Treffen-Erinnerungen (Mail an alle). Der Tisch hat eigene Zusage und Erinnerung.
- **Anwesenheit per Herzschlag statt Realtime:** In RT1 meldet sich die App alle 60 s beim Server (`tisch_platz`, 3 Abfragen) – erfüllt das Ziel
  „höchstens 3 Abfragen je Person und Minute“ und braucht keinen neuen Kanal. Der Realtime-Kanal je Tisch kommt mit RT2/RT3 (Song-Start, Sprechen).
  Nach 90 s ohne Meldung grau („unbekannt“), nach 150 s ist der Platz frei. Im Hintergrund meldet sich die App nicht.
- **Benachrichtigung wie eine Nachricht** (Bereich „Nachrichten“: Standard nur Push, keine Mail): neue Einladung an alle Mitglieder (abwählbar),
  Erinnerung 7–22 Min. vor Beginn an Zusagen und Gastgeber, Absage an die Zusagen. Keine Erinnerung am Vortag.
- **Tisch-Chat:** wer Platz nimmt, wird Teilnehmer der Unterhaltung „🪑 Thema“. Push für Tisch-Nachrichten wie bei jedem Chat
  (wer gerade in der App ist, bekommt keinen; stummschalten geht).
- **Aufräumen (stündlich):** Dateien 7 Tage nach Ende (nur Dateien, die nicht auch in anderen Chats hängen), Chat 30 Tage nach Ende;
  danach bleibt der Tisch als Kurzprotokoll (Thema, Datum, Gastgeber, Anzahl) und ein Eintrag `tisch_beendet` im Protokoll.
- **Noch nicht in RT1:** Hilfe-Eintrag, Twinkey, Suchbegriff und Erklär-Video kommen mit der Freigabe für alle (solange sieht es nur der Admin).

## 13. Arten: Runder Tisch, Seminar, Besprechung (RT1b, 2.762.0)

Entscheidungen Hansi (30.10.2026): „Besprechung“ statt „Konferenz“ (Konferenz heißt in der App schon die Telefonkonferenz, KC-CLUB-KONFERENZ);
**alle Mitglieder dürfen jede Art ansetzen**; das Seminar bekommt eine **Teilnahmebestätigung**. Eine Technik, drei Arten (`RT_ARTEN` in
`runder-tisch.js`, gleich `RUND_ARTEN` in app.js – der Test prüft das).

| | 🪑 Runder Tisch | 🎓 Seminar / Fortbildung | 🗂️ Besprechung |
|---|---|---|---|
| Wer leitet | lädt ein | Referent | Moderation |
| Teilnahme | spontan, Zusage freiwillig | **Anmeldung nötig**, höchstens so viele wie Plätze | spontan, Zusage freiwillig |
| Ansicht | Plätze im Kreis | Hörsaal: Referent am Pult, Teilnehmer in Reihen | Plätze im Kreis + Tagesordnung |
| Vorher | Thema | Thema, „Was lernt man?“ | Tagesordnung (höchstens 12 Punkte) |
| Danach | Chat zum Nachlesen | Chat + **📄 Teilnahmebestätigung** | Chat zum Nachlesen |

- **Teilnahmebestätigung:** ab der Hälfte der Seminarzeit (Platz genommen bis letzter Herzschlag, höchstens Beginn bis Ende). Druck über den vorhandenen
  Briefbogen-Druck (KC-CLUB-DRUCK-PDF: Drucken, PDF, in der Club-App senden). Dauerhaft unter „🎓 Meine Schulung → Besuchte Seminare“
  (Aktion `tisch_seminare_meine`) – darum bleiben beim Aufräumen eines Seminars Person und Anwesenheitszeit der Teilnehmer stehen (keine Inhalte).
  Wer zwischendurch geht und wiederkommt, wird ab dem ersten Platznehmen gerechnet.
- **Anmeldung:** zwei gleichzeitige Anmeldungen für den letzten Platz → der Server zählt nach und nimmt die überzählige zurück (nie überbucht).
  Platz nehmen ohne Anmeldung lehnt `kc_club_tisch_beitreten` ab („anmeldung“); der Referent darf immer.
- **Später:** Besprechung mit 🔴 Live-Abstimmung und Protokoll aus Clubabend Live; Seminar-Unterlagen vorab; Anbindung an „🎓 Schulungen verwalten“.

## 14. Nur für eine Gruppe (2.762.0)

Wunsch Hansi (30.10.2026): „Auch für Gruppen wie Leitung, Innovation usw. können Tische, Seminare und Besprechungen anberaumt werden.“
- Beim Einladen **„Für wen?“**: 👥 Alle Mitglieder oder eine **feste Chat-Gruppe**, in der man selbst ist (KC-CLUB-GRUPPEN, `kc_club_gruppen`).
  Kein zweites Gruppen-System (Vertrag Regel 3): wer in der Gruppe ist, bestimmt allein die Chat-Gruppe – auch später hinzugekommene Mitglieder.
- Einen Gruppen-Tisch **sehen, zusagen und betreten nur die Mitglieder der Gruppe** und wer ihn leitet; Bescheid bekommen nur sie.
  Die Datenbank prüft das beim Platznehmen selbst (`kc_club_tisch_beitreten` → „gruppe“), der Server bei Liste, Zusage, Verlassen und Leiten.
- Wird die Gruppe gelöscht, bleibt der Tisch für alle anderen unsichtbar (kein Fremdschlüssel, der ihn sonst „für alle“ öffnen würde).
- Migration `20261030_kc_club_v2762_tisch_gruppe.sql` (Spalte `gruppe_id`), Probelauf `tools/db-test/98_tisch_gruppe_test.sql`.

## 15. Platz am Tisch: bis wann Koch-Figuren, ab wann Buchstaben (Messung 30.10.2026, 2.762.0)

Gemessen im Browser (Klick-Rundgang, Chromium) mit dem echten Fenster: Tischbreite **W = 288 px** bei 320 px Handy, 328 (360), 358 (390), 380 (412),
398 (430), höchstens 420 px (Tablet/PC). Mit den festen Größen aus 2.762.0 (52/44/36 px) überlappten ab **16 Personen die Namen**
(320–430 px Handy) und bei **18 Personen auf 320 px die Kreise**; Koch-Figuren in 36-px-Kreisen sind kaum zu erkennen.

Seit 2.762.0 rechnet die App aus dem echten Platz (`rundGroesse` in app.js, Werte in `RUND_PLATZ`):
Abstand zweier Plätze s = 2 · 0,41 · W · sin(π/n); Kreis d = s − 6, höchstens 56 px und 16 % von W. **Koch-Figur ab 40 px**, darunter **Anfangsbuchstaben**;
**Namen unter dem Platz ab s ≥ 78 px**, sonst als Liste „Dabei: …“ unter dem Tisch (grau markiert ⚪ = unbekannt). Dreht man das Handy, wird neu gemessen.

| Handy | 4–8 | 10 | 12 | 14 | 16 | 18 Personen |
|---|---|---|---|---|---|---|
| 320 px | 46 Figur + Name | 46 Figur | 46 Figur | 46 Figur | 40 Figur | **35 Buchstaben** |
| 360 px | 52 Figur + Name | 52 Figur + Name | 52 Figur | 52 Figur | 46 Figur | 40 Figur |
| 390 px | 56 Figur + Name | 56 Figur + Name | 56 Figur | 56 Figur | 51 Figur | 44 Figur |
| 412–430 px | 56 Figur + Name | 56 Figur + Name | 56 Figur + Name | 56 Figur | 54–56 Figur | 48–50 Figur |
| Tablet/PC | 56 Figur + Name | 56 Figur + Name | 56 Figur + Name | 56 Figur | 56 Figur | 53 Figur |

(Zahl = Kreis in px.) Nachgemessen: auf allen Breiten und für 4–18 Personen keine Überlappung von Kreisen oder Namen und nichts außerhalb der Fläche.
**Ergebnis:** Koch-Figuren passen bis 18 Personen ab 360 px Handybreite; nur auf sehr kleinen Handys (320 px) zeigt die App bei 17–18 Personen Buchstaben.
Namen stehen am Platz bis 8 Personen (320 px), 10 (360–390 px) bzw. 12 (ab 412 px). Im Seminar (Hörsaal) passen in jede Reihe so viele 40-px-Plätze,
wie die Breite erlaubt (Figur und Name immer). Der Test `tests/runder-tisch.test.mjs` hält die Werte fest.

## 16. Zeit prüfen: kein Clubabend, immer nur ein Tisch (2.764.0)

Wunsch Hansi (30.10.2026): „Bevor ein Termin mit Uhrzeit angezeigt wird, prüfen, ob noch andere Termine anstehen. Kein Tisch, wenn gleichzeitig
Clubabend ist und die Teilnehmer dort zugesagt haben. Um die Datenbank-Ressourcen zu schonen, keine parallelen Runden Tische – immer nur einer.
Wenn ein weiterer geplant ist, dann Meldung.“

| Zur gewählten Zeit gibt es schon … | Folge |
|---|---|
| einen Runden Tisch, ein Seminar oder eine Besprechung (egal welche Gruppe) | **gesperrt** – „Es geht immer nur einer gleichzeitig“ (bei fremden Gruppen ohne Thema) |
| einen **Clubabend** (Clubtermin Art „Treffen“; ohne Ende gerechnet 3 Std. wie im Kalender-Export) | **gesperrt** – mit Anzahl der Zusagen |
| eine **Veranstaltung** (z. B. Weihnachtsmarkt, auch mehrtägig) | **Hinweis mit Rückfrage** „Trotzdem einladen?“ |

- **Im Formular:** Sobald Tag, Uhrzeit oder Dauer gewählt sind, prüft die App (`tisch_zeit_pruefen`, nur lesen, 3–4 Abfragen) und zeigt
  ✅ frei / ⛔ gesperrt / ⚠️ Hinweis und darunter „An diesem Tag: …“ (Tische, Clubabend, Termine mit Uhrzeit). Bei ⛔ bleibt „Einladen“ gesperrt.
  Kann nicht geprüft werden, steht das so da (nie „frei“); der Server prüft beim Einladen ohnehin noch einmal.
- **Beim Verlängern** (+30 Min.) muss die halbe Stunde danach frei sein (kein nächster Tisch, kein Clubabend).
- **Angrenzend geht:** Ein Tisch bis 20:00 und der nächste ab 20:00 überschneiden sich nicht. Abgesagte Tische zählen nicht; ein früher
  geschlossener Tisch gibt seine Restzeit frei.
- **Datenbank als letzte Sicherung** (zwei laden gleichzeitig ein): Sperre `kc_club_tisch_nur_einer` (keine zwei geplanten Tische mit
  überschneidender Zeit) – Migration `20261030_kc_club_v2764_tisch_nur_einer.sql`, Probelauf `tools/db-test/99_tisch_nur_einer_test.sql`.

## 17. Live am Tisch (2.766.0, KC-CLUB-RUNDER-TISCH-LIVE)

Wunsch Hansi (30.10.2026): „Bau den Runden Tisch weiter mit allen Möglichkeiten wie besprochen – Ton, Video, Bildschirm zeigen, Unterlagen senden. Das muss super werden.“
Umgesetzt aus RT2 und RT3 zusammen, dazu Kamera und Bildschirm (vorher nicht in der Spezifikation).

| Teil | Umsetzung |
|---|---|
| Live-Leitung | `fhLeitung` (Fernhilfe-Technik): Realtime-Broadcast, jede Nachricht AES-GCM. Kanal/Schlüssel = HMAC(Server-Geheimnis, Tisch-Kennung) in `rtLiveLeitung`; nur `tisch_platz` mit Ergebnis ok/da liefert sie. Keine Tabelle, keine DB-Abfrage für Live. |
| Lebenszeichen | `da` alle 15 s und bei jeder Änderung (Mikro, Kamera, Bildschirm, ✋, Stab, Unterlage); ein Neuer schickt `neu`, alle antworten sofort. Nach 45 s grau, nach 135 s weg. |
| Wer spricht | bis 6 live: alle (offenes Gespräch). Ab 7: Leitung + Redestab (`tlRegeln`). Wechselt es, schaltet die App das Mikro selbst aus und sagt warum. |
| Ton/Bild | WebRTC wie App-Anruf (`rufIce` inkl. Umleitung). Je Sender eine Verbindung zu jedem Live-Teilnehmer (nur senden), Empfänger antworten (nur empfangen). Kamera/Bildschirm teilen sich den Bild-Kanal (Bildschirm geht vor); Datenrate je Empfänger `tlKbit` = 2400/n kbit/s, 150–1000. |
| Bildschirm | `getDisplayMedia` – PC/Laptop (Chrome, Edge, Firefox). Handys können es nicht (Hinweis „📎 Unterlagen zeigen“). Erscheint bei allen groß, ⛶ Vollbild. |
| Unterlagen | PDF/Foto vom Gerät oder aus dem Archiv → Upload + Nachricht im Tisch-Chat (Zugriff prüft der Server über die Chat-Teilnahme) → `zeige` mit Kennung und Seite. Empfänger laden selbst (`anlage_url`, pdf.js), folgen der Seite; eigenes Blättern → „↩︎ Folgen“. |
| Messung | beim Beenden `diagnose` „tisch_live“: Sekunden, Verbindungen, Umleitungen, Fehler, höchste Zahl live. |
| Grenzen | höchstens 10 MB je Unterlage; keine Aufzeichnung; wer den Tisch verlässt, beendet Live. |

**Bekannt / bewusst:** Alle am Tisch teilen einen Schlüssel – ein Mitglied könnte technisch Signale „im Namen“ eines anderen senden (z. B. Redestab).
Für Mitglieder untereinander akzeptiert; für externe Gäste (RT4) bekommt der Gast keine Leitungs-Signale der Leitung, sondern nur Ton/Bild (kommt mit RT4).
Ab wie vielen Zuhörern es über Mobilfunk stockt, zeigt erst die Messung auf echten Handys (Diagnose-Protokoll).

**Tests:** `tests/tisch-live.browser.mjs` (3 Fenster, echte Verbindungen, nachgebaute Leitung), `tests/runder-tisch.test.mjs` (Regeln, Sicherungen).
