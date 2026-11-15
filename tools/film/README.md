# Erklärfilme der Club-App neu erzeugen (KC-CLUB-FILME-NEU)

Zwei Filme werden hier gebaut – mit Bildern der **echten App** aus diesem Ordner (index.html + app.js), erfundenen Beispieldaten
(„Hans Test“, „Erika Beispiel“ …) und dem Sprecher `de_DE-thorsten-medium` (Piper, offline):

| Film | Kennung in `FILME` (app.js) | Datei | Quellen |
|---|---|---|---|
| 🧭 Der Kopf der Club-App | `kopffilm` | `film/kopf-der-app.mp4`, `film/kopf-vorschau.webp` | `tools/film/kopffilm/` |
| 🧹 Deine App – so, wie du sie willst | `ansichtfilm` | `film/app-selbst-einrichten.mp4`, `film/app-einrichten-vorschau.webp` | `tools/film/ansichtfilm/` |

Je Film: `texte.json` (Szenen in Reihenfolge – Etikett über dem Handy, Sprecher- und Untertiteltext, Titel-/Kartenbilder) und
`szenen.mjs` (Drehbuch: was in der App je Szene gezeigt wird – Finger, gelbe Rahmen, Vergrößerung).
Gemeinsam: `film.mjs` (Ablauf), `gemeinsam.mjs` (Web-Server, Browser, Beispieldaten, Filmrahmen, Aussprache), `stimme.py` (Piper).

Format wie bisher: 1080×1920 (Hochformat), 25 Bilder/s, H.264 + AAC, Untertitel als Textkasten unten im Bild, Vorschaubild 540×960 WebP.

## Neu erzeugen

```bash
pip install piper-tts                       # einmal; Stimmmodell: stimmen/de_DE-thorsten-medium.onnx
node tools/film/film.mjs kopffilm probe     # nur Bilder ansehen: tools/film/kopffilm/arbeit/bilder/
node tools/film/film.mjs kopffilm voll      # Stimme → Bilder → film/kopf-der-app.mp4 + film/kopf-vorschau.webp
node tools/film/film.mjs ansichtfilm voll   # film/app-selbst-einrichten.mp4 + film/app-einrichten-vorschau.webp
```

Voraussetzungen: Node mit Playwright + Chromium (`PW_CORE`, `PW_CHROME` wie bei den anderen Browser-Werkzeugen), ffmpeg, Python mit `piper-tts`.
Zwischendateien liegen in `tools/film/*/arbeit/` (nicht eingecheckt).

Danach in `app.js` bei `FILME` die Zahl hinter `?v=` erhöhen (sonst zeigt das Handy den alten Film aus dem Zwischenspeicher) und `dauer` prüfen.

## Regeln

- **Nie gegen den echten Server** (AGENTS.md KC-TESTS-OHNE-ECHTSERVER): Netzsperre `OHNE_ECHTSERVER` + `--no-proxy-server` beim Start,
  `seite.route("**/*")` lässt nur localhost/data:/blob: durch, Club-Server-Aufrufe beantwortet der Browser selbst mit Beispieldaten, keine WebSocket-Leitung.
  `tests/browser-abgeschirmt.test.mjs` prüft das.
- Nur erfundene Beispieldaten, keine echten Mitglieder, keine Chat-Inhalte, kein Admin-Bereich.
- Aussprache englischer Wörter (App → „Äpp“, WhatsApp, Push …): Liste `AUSSPRACHE` in `gemeinsam.mjs` – der Untertitel bleibt unverändert.
