# 🧹 Film „Deine App – so, wie du sie willst“ (KC-CLUB-ANSICHTFILM)

Ergebnis: `film/app-selbst-einrichten.mp4` (1080×1920, 25 fps, Sprecher + Untertitel) und `film/app-einrichten-vorschau.webp` – in `app.js` `FILME` → `ansichtfilm`.
Neu aufgebaut 15.11.2026 (App 2.954.0) mit Bildern der echten App; erste Fassung 02.11.2026 (Anregung Clubsitzung „die App ist zu voll“).

- `texte.json` – Szenen in Reihenfolge: Etikett, Sprecher-/Untertiteltext, Titel- und Kartenbilder
- `szenen.mjs` – Drehbuch: was die App je Szene zeigt (Finger, gelbe Rahmen, Vergrößerung)

Szenen: Anregung · Titel (zehn Minuten) · einfache Ansicht · erweiterte Ansicht · Club/Meins/Technik · Reiter anordnen · Kachel lange drücken ·
verschieben · ✕ ausblenden und „Fertig“ · vorher/nachher · Zahl am Reiter · 👀 nur ausgeblendete (runder Knopf oben, 2.953.0) · 🙈 wieder verbergen ·
wieder einblenden · Kachelgröße · Kacheln umdrehen 🔄 · Kopf in vier Stufen · Knopf leuchtet bei Neuem · Startmeldungen aus · Rest liegen lassen ·
alles änderbar · weitere Erklär-Videos · Schluss.

Neu erzeugen: `node tools/film/film.mjs ansichtfilm voll` – Einzelheiten in `tools/film/README.md`.
