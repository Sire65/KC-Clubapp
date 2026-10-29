# Clubsitzung Schritt für Schritt (ab 2.751.0)

Wunsch Hansi 29.10.2026: „Im richtigen Leben erstellt man die Tagesordnung, nimmt die Vorschläge der Mitglieder auf, schickt 3 Tage vorher die
Einladungen raus. Dann bereitet man die Sitzung vor … als letztes packt man seine Aktentasche … Auf dem gelben Zettel immer die nächsten Schritte,
bei Fristen automatisch erinnern beim Programmstart. Auch Kassenwart und Admin zur Kontrolle.“

## Ablauf (Beispiel: Sitzung Freitag 18 Uhr, Standard-Vorgaben)

| # | Schritt (`BU_SCHRITTE` in app.js) | wann „jetzt dran“ | Frist (rot „⚠️ Knapp“ danach) |
|---|---|---|---|
| 1 | 💡 Vorschläge der Mitglieder (`vorschlaege`) – nur Info | – | Anmeldeschluss Mo 17 Uhr (`vorschlag_tage`, `vorschlag_stunde`), danach nur ❗ dringend |
| 2 | 📝 Tagesordnung festlegen (`vorbereiten`, Seite „to“) | sofort | Di (`einladung_tage`) |
| 3 | 📨 Mitglieder einladen (`einladung`) | nach 2 | Di (`einladung_tage`) |
| 4 | 🔔 An die Antwort erinnern (`erinnerung`) | ab Mi (`erinnerung_tage`), frühestens 1 Tag nach der Einladung | – |
| 5 | 🖨️ Sitzung vorbereiten (`unterlagen`, Seite „vor“): Anwesende, Anmerkung, Schreiblinien, Mitschreibbogen | ab 1 Tag vor der Frist | Do (`unterlagen_tage`) |
| 6 | 💼 Aktentasche packen (`aktentasche`, nur Clubleitung) inkl. 🧳 Mitnehm-Liste | nach 5 oder ab Vortag | Fr 14 Uhr (`tasche_stunde`) |
| 7 | 🍽️ Clubabend Live (`clubabend`): Tasche öffnen/📤 freigeben, Anwesende, Tagesordnung, ✅ Zum Schluss, zuletzt nächster Termin | 2 Std. vorher | – |

- **Gelber Zettel** (Büro-Raum) = `buDran`: der Schritt, der jetzt dran ist; sonst der nächste anstehende mit „ab …“.
- **Frage beim Start** (`buAufgabePruefen`, ab `vorlauf_tage` vorher): nur wer die Sitzung vorbereitet (Amt `vorbereiter_amt`, Standard Clubsprecher;
  hat niemand das Amt: wer im Büro schreiben darf). Ja = gewohntes Fenster, Nein, ⏰ Später = 3 Std. Ruhe (je Gerät).
- **Kontrolle** (`buKontrolleZeigen`): übrige Clubleitung (Kassenwart, Admin) nur bei überschrittener Frist – „Clubsprecher anschreiben“ oder selbst ins Büro.

## Änderung nach der Einladung (KC-CLUB-AENDERUNG-MELDUNG)

- Beim Versand an alle merkt der Server die Tagesordnung (`kc_club_buero_sitzung.versandt_top`).
- Weicht die Tagesordnung davon ab (eigene Änderung oder aufgenommener dringender Vorschlag), fragt die App die Clubleitung „Mitglieder informieren?“:
  **Ja** = Sende-Menü mit Änderungsmeldung („Neu / Entfällt / Reihenfolge“, neue Punkte mit 🆕; Push-Zeile z. B. „2 Punkte dazugekommen (1 dringend)“),
  **Nein** = `buero_informieren_nein` merkt diesen Stand (`informieren_nein_top`) – keine Nachricht, keine weitere Frage dafür.
- Ändert sich die Tagesordnung, ist „Sitzung vorbereiten“ wieder offen (`unterlagen_am` = null) – Mitschreibbogen neu drucken.
- Einladungen von vor 2.751.0 haben keine gemerkte Tagesordnung: war sie seit der Einladung unverändert, trägt der Server sie beim nächsten Speichern nach.
- Push/Mail öffnen direkt den Tag der Sitzung (`#tag=JJJJ-MM-TT`). Push trägt nie Anhänge.

## Sitzungs-Vorgaben (KC-CLUB-SITZUNG-VORGABEN)

`kc_club_konfig` Schlüssel `sitzung_vorgaben` – Büro → ⚙️ Sitzungs-Vorgaben (Clubleitung, Auswahl statt Freitext). Server prüft jeden Wert (`svPruefen`),
fehlende Werte = Standard. Nächster Termin (Live-Abstimmung): letzter `wochentag` im Folgemonat, `ohne_monate` übersprungen (Dezember → Januar),
`uhrzeit`/`ort` (ohne Einstellung wie beim letzten Treffen). Eingerichtet (29.10.2026): Freitag, 18:00, Hütte Anne, ohne Dezember.

## Weitere Teile

- **KC-CLUB-AKTENTASCHE-MITNEHMEN**: Op `mitnehmen` – Dinge außerhalb der App (Muster, Getränkeproben) zum Abhaken; nicht in Druck/Freigabe.
- **KC-CLUB-CLUBABEND-ABSCHLUSS**: `CA_ABSCHLUSS` – Tagesordnung (zählt selbst), Anwesende, Aufgaben (Protokoll), Fotos, nächster Termin als Letztes;
  gespeichert in `kc_club_clubabend.erledigt` (Schlüssel `ab:…`).
- **KC-CLUB-EINGANG-MAILANHANG**: freigegebene Unterlagen gehen an Mitglieder, die per E-Mail benachrichtigt werden, zusätzlich als Anhang
  (Grenzen wie beim Versanddienst: je Datei 10 MB, zusammen 15 MB; sonst nur der Hinweis).

## Tests / Definition of Done

`tests/sitzung-aufgaben.test.mjs` (Reihenfolge, Fristen, Sommer-/Winterzeit, Fragen, Kontrolle, Änderungsmeldung App = Server, Termin-Vorschlag,
Vorgaben-Prüfung, Abschluss-Liste), `tests/sitzung-schritte.test.mjs`, `tests/einladung-brief.test.mjs`; Browser-Probe mit echtem Ablauf
(Frage → Tagesordnung → Einladung → Vorbereiten → Änderung Ja/Nein → Vorgaben → Mitnehm-Liste → Clubabend → Kontrolle → `#tag=`).
Datenbank: `supabase/migrations/20261029_kc_club_sitzung_ablauf.sql` (nur neue leere Spalten + Vorgaben-Eintrag).
