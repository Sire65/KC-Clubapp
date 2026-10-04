# Club-App-Anleitung (PDF) bauen – KC-CLUB-ANLEITUNG

Erzeugt `dokumente/Koecheclub-App_Anleitung_V<n>.pdf` – gleiche Gestaltung wie die Kasse-Anleitung (Bilderrechner).
Alle Bildschirmfotos zeigen **erfundene Demodaten** (`demo.mjs`, „Max Mustermann“ …), nie echte Mitgliederdaten.

1. Arbeitsordner anlegen: `$S/anl` mit diesen Dateien, `bild/` (leer) und `fonts/Lato-{Regular,Bold,Italic}.ttf`
   (Google Fonts, OFL) sowie `bild/icon.png` (= icon-192.png).
2. App lokal starten: `python3 -m http.server 8765` im Repo-Ordner (Server-Aufrufe werden im Browser durch Demodaten ersetzt).
3. `S=<ordner> node fotos.mjs`, danach `S=<ordner> node fotos2.mjs` (Bilder der neuen Funktionen ab V2) und `S=<ordner> node fotos3.mjs` (ab V3: Hilfe-Aushang, Kurzansicht, Anmelde-Code, ohne Netz …) und `S=<ordner> node fotos4.mjs` (ab V4: Spiele, Hilfe-Zentrum, Erinnerung, Wunschbogen, Meine Daten, SOS an alle, Über die App) → Bildschirmfotos, Ausschnitte und Nummernlage (`marken.json`); muss „alles gefunden“ melden.
4. `S=<ordner> node bau.mjs` → `Koecheclub-App_Anleitung.pdf`. Seiten ansehen, dann als neue Version nach `dokumente/`
   legen (alte PDFs bleiben unverändert) und in `DOKUMENTE` (index.html) eintragen.

Texte stehen in `inhalt.mjs` (Version/Stand oben anpassen). Benötigt Playwright + Chromium.
