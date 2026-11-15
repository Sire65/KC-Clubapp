# 🧭 Film „Der Kopf der Club-App“ (KC-CLUB-KOPFFILM)

Ergebnis: `film/kopf-der-app.mp4` (1080×1920, 25 fps, Sprecher + Untertitel) und `film/kopf-vorschau.webp` – in `app.js` `FILME` → `kopffilm`.
Neu aufgebaut 15.11.2026 (App 2.954.0) mit Bildern der echten App; erste Fassung 04.11.2026 (2.856.0).

- `texte.json` – Szenen in Reihenfolge: Etikett, Sprecher-/Untertiteltext
- `szenen.mjs` – Drehbuch: was die App je Szene zeigt (Finger, gelbe Rahmen, Vergrößerung)

Szenen: Titel · vier Teile · Logo/Mond/Kreispfeil · drei Helfer ganz oben · runder Knopf (vier Punkte) · 1×/2×/3×/4× tippen
(Felder → Laufschrift → Statusleiste → alles wieder da, lange drücken, Leuchten bei Neuem) · Verbindungs-Balken · Flagge Deutsch/English ·
Status-Knopf und Lämpchen · erste Karte · ‹ › « » · gelbe Punkte · Schnellstart · Wetter · Für dich · Demnächst · Neueste Fotos ·
Kommunikationszentrale · Startkarte · Szenen im Kopf · Eselsohr · Schluss. Kein Admin-Bereich (Wunsch Hansi 04.11.).

Neu erzeugen: `node tools/film/film.mjs kopffilm voll` – Einzelheiten in `tools/film/README.md`.
