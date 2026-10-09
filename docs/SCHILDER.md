# 🪧 Schilder-Druckerei (KC-CLUB-SCHILDER, ab 2.150.0)

Wunsch Hansi (09.10.2026): Hinweisschilder, Preislisten, Öffnungszeiten usw. schnell in der Club-App erstellen – auch vor Ort
am Stand (ohne Drucker): Schild an ein oder mehrere Mitglieder senden, die drucken zuhause. Fertige Schilder ablegen und
nächstes Jahr wieder benutzen.

## Wer / Wo
- **Nur Clubleitung** (Vorstand/Admin) – App (`schDarf`) und Server (`nurLeitung`).
- Büro-Regal **🪧 Schilder-Druckerei** und Büro → ✒️ Schreiben → **🪧 Schild drucken**.

## Ablauf (wie eine kleine Druckerei)
1. **Anlass** wählen (Weihnachtsmarkt, Feste & Feiern, Kochabend & Kurs, Vereinsheim, Allgemein) → passende **Vorlagen** mit Vorschaubild.
2. **Text**: Überschrift, Text (Enter = neue Zeile), Preisliste (Artikel/Preis, „3,5“ → „3,50 €“). F/K/U = fett, kursiv, unterstrichen.
3. **Aussehen**: Hoch-/Querformat, 4 Schriften, 4 Farben (Weinrot/Schwarz aus dem CD, Signalrot für Verbote, Grün festlich), 6 Rahmen, 24 Symbole.
4. **🖨️ Drucken** (zentraler Druck) oder **📤 Senden & Ablegen** – derselbe Weg wie „📥 Einlesen“: Büro-Ordner, Nachricht (auch an mehrere), E-Mail.
5. **💾 Speichern** → „Gespeicherte Schilder“ je Anlass; öffnen, ändern, wieder drucken. Löschen ist weich (`entfernt_am`).

## Technik
- Zeichnen per Canvas (`schZeichnen`) – Vorschau und Druck/PDF mit derselben Funktion. Schriftgröße passt sich automatisch an.
- PDF baut die App selbst (`schPdf`: eine A4-Seite, Bild 200 dpi als JPEG) – keine Bibliothek, kein Dienst, kostenlos.
- CD: unten auf jedem Schild Kochmütze im weinroten Kreis + „Köcheclub Werne“ (aus `KC_CD`), Spruch in Vorlagen aus `KC_CD.zeile`.
- Erweiterbar über Listen: `SCH_ANLAESSE`, `SCH_VORLAGEN`, `SCH_SCHRIFTEN`, `SCH_FARBEN`, `SCH_RAHMEN`, `SCH_SYMBOLE`.
- Preise in Vorlagen bleiben leer („… €“) – nichts wird erfunden.
- DB: `kc_club_schilder` (Migration `20261009_kc_club_v2150_schilder.sql`, Weg B), RLS an, Zugriff nur über den Server.
- Server: `schild_liste`, `schild_speichern` (Daten geprüft: `schildDaten`), `schild_loeschen`. Protokoll nur Aktion + Kennung.
- Tests: `tests/app-vertrag.test.mjs` Abschnitt 2.150.0.
