# Umzug der Köcheclub-App zu Cloudflare Pages – Ablaufplan (Vorbereitung)

Stand 07.10.2026 · Wunsch Hansi · Feature-ID **KC-CLUB-CLOUDFLARE-UMZUG** · Status: **nur vorbereitet, nichts veröffentlicht**

## Ziel
- Die App läuft weiter wie bisher, nur unter einer neuen Adresse bei **Cloudflare Pages** (kostenlos).
- Das GitHub-Repository **Sire65/KC-Clubapp** wird **privat**. Öffentlich sind danach nur noch die fertigen App-Dateien –
  nicht mehr Server-Code (`supabase/`), Datenbank-Migrationen, Tests, Werkzeuge und Dokumente.
- Ehrlich: Was im Browser läuft, lässt sich nie ganz verstecken. Es wird aber deutlich weniger sichtbar.

## Was schon vorbereitet ist (ohne Auswirkung auf die laufende App)
| Teil | Datei | Zweck |
|---|---|---|
| Paket bauen | `tools/cloudflare/paket-bauen.mjs` | Baut `dist-cloudflare/` mit **nur** den öffentlichen Dateien (Positivliste), dazu `_headers` (kein Zwischenspeichern von Seite/Service Worker/Version – atomares Update) und `PAKET.txt` (Inhaltsliste mit Prüfsummen). |
| Weiterleitung | `tools/cloudflare/weiterleitung/index.html` | Ersetzt am Umzugstag die alte Seite. Nimmt den persönlichen Link `?k=…` und Sprungziele `#…` mit. |
| Probe | lokal geprüft | Paket 2.56.0: 180 Dateien, App startet, keine fehlende Datei, kein Fehler. |

## Ablauf am Umzugstag (erst nach Hansis Freigabe)
1. **Ankündigung** in der App (Pinnwand/Nachricht – Text vorher mit Hansi abstimmen, keine Mail ohne Freigabe).
2. **Cloudflare Pages-Projekt** anlegen (vorhandenes Konto, das schon den Notbetrieb trägt), Name z. B. `koecheclub` → Adresse `https://koecheclub.pages.dev/`.
3. **Paket hochladen** (GitHub-Workflow mit Cloudflare-Schlüssel aus den Repository-Secrets – Schlüssel nie im Code).
4. **Adresse umstellen** an diesen Stellen (alle in einem Release, neue Version):
   - Server `kc-club`: `APP_URL` (Push-/Mail-Links, Links in E-Mails)
   - Server `kc-termine`: `CLUB_APP`
   - App: `SPRUNG_URL`, Hilfe-Texte mit `sire65.github.io` (Mikrofon-Anleitung, Einrichten-Bilder), Platzhalter „Dein persönlicher Link“ in `index.html`, Text „sire65.github.io/KC-Clubapp eingeben“
   - `manifest.webmanifest` (Feld `url` der Verknüpfung)
   - Notbetrieb: `notbetrieb.json` / Worker prüfen (Ziel-Adresse der App)
   - Links in anderen KC-Programmen (KICC, DP2, Kasse) auf die Club-App
5. **Alte Adresse**: `index.html` auf GitHub Pages durch die Weiterleitungsseite ersetzen (Adresse eintragen) – persönliche Links funktionieren weiter.
6. **Probe** mit Hansis Gerät + einem Testzugang: Anmelden, Push, Mail-Link, Termin-Link, Notbetrieb.
7. **Repository privat** schalten – erst wenn 4.–6. grün sind. (GitHub Pages der alten Adresse braucht dann ein eigenes kleines öffentliches Repository nur für die Weiterleitung.)

## Was die Mitglieder merken
- Einmal **App neu auf den Startbildschirm legen** (alte Verknüpfung entfernen).
- Vom Server zurück kommen: Ansicht, Farben, Benachrichtigungen, Bild, Einstellungen am Konto.
- **Neu einzustellen** (lag nur auf dem Gerät): Schriftgröße, Kachel-Anordnung/-Größe, Spielstände gegen den Computer, Warte-Bild, Emoji-„Zuletzt“.
- Push muss einmal neu erlaubt werden.

## Offene Entscheidungen für Hansi
1. **Name der neuen Adresse** (z. B. `koecheclub.pages.dev`). Eigene Domain würde Geld kosten (Zero-Cost-Regel) – daher `.pages.dev`.
2. **Alte Anleitungs-Versionen V1–V6** (zusammen ~55 MB) nicht mehr mitnehmen? Die App verweist nur auf V7.
3. **`dokumente/Vertretung_Admin_V1.pdf`** ist heute öffentlich abrufbar – soll es öffentlich bleiben oder nur noch über die App (Archiv) erreichbar sein?
4. **Code verkleinern/verwürfeln** (macht das Lesen schwerer, nie unmöglich) – ja/nein?
5. **Termin** für den Umzug (ruhige Woche, Hansi erreichbar).

## Rückweg
Bis Schritt 7 jederzeit: Adresse in Server/App zurückstellen, alte `index.html` auf GitHub Pages zurück – die App läuft wie vorher.
