# Wege der Mitglieder (KC-CLUB-SPUR, vollständig ab 2.755.0)

Wunsch Hansi 29.10.2026: „Prüfe nochmal die Wege der Mitglieder – einige Schritte werden mir nicht angezeigt. Wichtig ist auch, ob sie die Hilfetexte
lesen oder Erklär-Videos ansehen. Alles soll aufgezeichnet werden, damit ich sehe, was jeder in der App nutzt.“

## Was aufgezeichnet wird (nur Art + Kennung + Uhrzeit, nie Inhalte)

| Art | Schritt (`spur(w, mit)`) | Wo |
|---|---|---|
| Seiten | Name der Seite (`zeige`) | app.js `zeige()` |
| Unterhaltung / Mitglied / Anruf … | `chat`, `mitglied`, `anruf` … mit Unterhaltungs- bzw. Mitglieds-Kennung | wie bisher |
| 🪟 Fenster | `fenster` + Fenster-ID | ein MutationObserver für alle Fenster (`blattAuf` und feste Fenster in index.html); Namen: Registry `FENSTER_NAMEN` |
| ❓ Hilfe | `hz_kapitel`, `hz_eintrag`, `hz_zeig`, `hz_vorlesen`, `hz_frage` (+ Seite), `hz_suche` (nie das Suchwort), `hz_gut`/`hz_schlecht` | Hilfezentrum |
| 🎬 Erklär-Videos | `rg_start`, `rg_ende`, `rg_ab_<Schritt>_<von>` + Video-ID | teile/videos.js `rundgangStart`/`rundgangEnde` |
| 🎞️ Anleitungsfilme | `film_start`, `film_ende`, `film_ab_<Min>_<von>`, `film_frage_an/spaeter/nein` + Film-ID | app.js `filmZeigen`, `filmHinweisPruefen` |
| ✅ Handlungen | `tat_…` (z. B. `tat_termin_ja`, `tat_bu_einladung`, `tat_tasche_packen`) | Registry `SPUR_TATEN`, zentral in `api()` nach erfolgreicher Antwort |

Während ein Erklär-Video läuft (`body.rg-an`), zählen nur `rg_…`/`tat_…` – was das Video selbst vorführt, ist kein Weg des Mitglieds.
Ein Fenster, das nur neu gezeichnet wird (gleiche ID binnen 1,5 s entfernt und wieder angehängt), zählt nicht doppelt.

## Server

- `spur_melden`: `w` = `/^[a-z][a-z0-9_]{0,29}$/`; `mit` = Mitglieds-/Unterhaltungs-Kennung (`SPUR_MIT`) oder Registry-Kennung (`SPUR_KENNUNG`,
  nur Buchstaben/Ziffern/`_:.-`). Unbekanntes `mit` → Schritt bleibt ohne `mit` (vorher fiel er ganz weg). Höchstens 240 Sendungen je Person und Stunde.
- `spur_liste` (Admin): seitenweise (`spurZeilen`, vorher höchstens 1000 Zeilen → an vollen Tagen fehlten Schritte). Registry-Kennungen kommen als `k` zurück,
  die App macht daraus Namen (`spurMitName`).
- `spur_uebersicht` (Admin): je Mitglied über 7/30 Tage – Anzahl je Schritt (`w` oder `w|kennung`), aktive Tage, zuletzt, bei Abbrüchen „am weitesten“.
- Gelöscht nach `SPUR_TAGE` = 30 Tagen (Wartung wie bisher).

## Ansehen (nur Admin)

👥 Nutzung → 👣 Wege der Mitglieder (je Tag) bzw. 📊 Was nutzt jeder? (je Mitglied: Seiten, Hilfe, Erklär-Videos, Filme, Fenster, Handlungen, 🚫 nie benutzt).

## Erweitern

- Neues Fenster: Eintrag in `FENSTER_NAMEN` (der Test `tests/spur-voll.test.mjs` meldet fehlende Namen).
- Neue Handlung: Eintrag in `SPUR_TATEN` + Name in `SPUR_WAS` (Test prüft Server-Muster und Namen).
- Neuer fester Schritt `spur("…")`: Name in `SPUR_WAS` (Test meldet Schritte ohne Namen).
