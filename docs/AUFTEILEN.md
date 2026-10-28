# Programm aufteilen (KC-CLUB-TEILE) – Plan, Regeln, Rückweg

Wunsch Hansi 28.10.2026 (Prüfbericht Wunsch #44, Punkt C): „gut aufteilen, damit später alles besser, schneller, sicherer läuft“ –
vorsichtig, lieber langsamer und gründlich, vorher eine Sicherung.

## Sicherung

| Was | Wo |
|---|---|
| Kompletter Stand vor dem Umbau (2.725.0, alle Tests grün) | Zweig `sicherung/vor-aufteilen-2.725.0` auf GitHub (wird nie verändert) |
| Datenbank, Fotos, Nachrichten | vom Umbau nicht betroffen (nur das Laden des Programms ändert sich); nächtliche Sicherungen laufen weiter |

## Rückweg

Release-Artefakte sind unveränderlich (AGENTS Regel 17) – zurück geht es immer mit einer **neuen** Versionsnummer.

1. **Eine Stufe zurück** (Normalfall, ca. 5 Min.): den Stand vor der Stufe holen (`git checkout <Commit vor der Stufe> -- .`),
   Version auf die nächste freie Nummer heben, alle Tests + `node tests/rundgang.browser.mjs`, einspielen.
2. **Ganz zurück**: Inhalt von `sicherung/vor-aufteilen-2.725.0` holen
   (`git checkout origin/sicherung/vor-aufteilen-2.725.0 -- .`), dabei neuere Funktionen, die nach dem 28.10. dazukamen, wieder einsetzen,
   Version auf die nächste freie Nummer heben, testen, einspielen.
3. **Nur ein Teil kaputt** (Meldung „Dieser Teil der App konnte gerade nicht geladen werden“, Fehlerprotokoll `laden: Programmteil …`):
   Der Rest der App läuft weiter. Ursache meist: Fingerabdruck vergessen → `node tools/teile-pruefsumme.mjs`, neue Version.

## Wie es funktioniert

- Hauptprogramm `app.js` (alles, was beim Start gebraucht wird) + nachladbare Teile `teile/<name>.js`.
- **Registry** `TEILE_LISTE` in `app.js`: je Teil die Einstiegs-Funktionen und der Fingerabdruck (`sri`, sha384).
- **Platzhalter**: Für jede Einstiegs-Funktion steht beim Start ein Platzhalter bereit. Erster Aufruf → Teil laden → echte Funktion aufrufen.
  Steht eine Funktion (noch) in `app.js`, gilt die – der Platzhalter wird dann gar nicht angelegt.
- **Nie Mischstand** (Regel 16): Teil-Adresse `teile/<name>.js?v=<Version>`; der Browser führt ein Teil nur aus, wenn der Fingerabdruck
  exakt passt. Passt er nicht (z. B. alte App, Server hat schon die neue Datei), wird das Teil nicht ausgeführt und nach einem Update gesucht.
- **Service Worker**: `TEILE` in `sw.js` – beim Update kommen alle Teile mit app.js in den Speicher der neuen Version (alles oder nichts),
  danach aus dem Speicher, auch ohne Netz.
- **Tests**: `tests/programm.mjs` liest app.js + alle Teile – die Vertragstests finden jede Stelle, egal wo sie steht.
  Der Klick-Rundgang lädt jedes Teil und prüft, dass seine Platzhalter ersetzt werden.

## Pflege-Regeln

1. Nach jeder Änderung an `teile/*.js`: `node tools/teile-pruefsumme.mjs` (sonst wird der Vertragstest rot).
2. Neues Teil: Datei `teile/<name>.js`, Eintrag in `TEILE_LISTE` (app.js) und `TEILE` (sw.js), Fingerabdruck eintragen.
3. Ein Teil darf nur Funktionen enthalten, die **nicht beim Start** gebraucht werden. Was das Hauptprogramm von einem Teil braucht, geht nur
   über Einstiegs-Funktionen (Platzhalter). Kein `const`/`let` mit gleichem Namen wie im Hauptprogramm (der Vertragstest übersetzt alles zusammen).
4. `import()` in einem Teil löst sich vom Teil aus auf (teile/…) – nur `import(new URL("lib/…", location.href).href)` benutzen (Test prüft das).
5. Einstiegs-Funktionen geben beim ersten Aufruf ein Versprechen (Promise) zurück – nur Funktionen auslagern, deren Rückgabewert der Aufrufer
   nicht sofort braucht (Knöpfe, „öffnen“, „starten“).

## Stufen

| Stufe | Inhalt | Version | Stand |
|---|---|---|---|
| 0 | Nachlade-Weg, Probe-Teil, Tests, Rundgang, diese Anleitung | 2.727.0 | eingespielt 28.10. |
| 1 | Erklär-Videos (`teile/videos.js`, ~420 KB; Katalog, Zustand RG und Startseiten-Hinweis bleiben im Hauptprogramm) | 2.737.0 | gebaut, alle 57 Videos geprüft, Start-Rechenzeit −12 % |
| 2 | Spiele (`teile/spiele.js`, ~300 KB; Spiel-Einladung, Live-Anfragen, Einstellungen, Zustand SP bleiben) | 2.738.0 | gebaut, 7 Spiele Handy+PC geprüft, Start-Rechenzeit gesamt −13 % |
| 3 | Sim-Jü, Rückseite, Bühne, Effekte | | geplant |
| 4 | Büro-Werkzeuge der Clubleitung | | geplant |
| 5 | Hilfe-Texte | | geplant |

Nach jeder Stufe: alle Tests, Klick-Rundgang, echte Startzeit messen (Fehlerprotokoll `startzeit`), erst dann die nächste Stufe.
