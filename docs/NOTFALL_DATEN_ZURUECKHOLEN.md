# Notfall: Daten zurückholen, wenn Supabase ausfällt

KC-CORE-NOTFALL-LESEN + KC-CORE-NOTFALL-TRESOR, Stand 13.10.2026

## Wo liegen unsere Daten?

| Ort | Was | Lesbar ohne Supabase? |
|---|---|---|
| **Supabase** (London) | Die echte Datenbank. Die Club-App arbeitet hier. | – |
| **Neon „KC Core Mirror“**: Spiegel | Alle Tabellen. Alle 6 Std. kopiert (02:10, 08:10, 14:10, 20:10). Personendaten sind gekürzt (Datenschutz). | **Ja**, direkt. |
| **Neon „KC Core Mirror“**: Tagessicherung | Täglich jede Tabelle **vollständig**. Verschlüsselt (AES-GCM) und unveränderlich, in `kc_backup_snapshots`. | **Nur mit dem Sicherungsschlüssel.** |

Der Sicherungsschlüssel heißt im Supabase-Tresor (Vault) `kc_db_backup_key_v1`.
Fällt Supabase ganz aus, ist auch der Tresor weg. Deshalb liegt eine **Kopie des Schlüssels außerhalb von Supabase**: im **Cloudflare-Tresor** `kc-notfall-tresor`. Sie wird **automatisch** dort abgelegt, siehe „Schlüssel-Kopie (automatisch)“.

## Wer prüft, ob die Sicherung lesbar ist?

- **Täglich, in Supabase:** `kc-db-backup-verify-v2` entschlüsselt jede Tabelle und vergleicht sie mit der Prüfsumme. Dafür nimmt sie den Schlüssel aus dem Tresor. Das Ergebnis steht im System Check.
- **Wöchentlich, ohne Supabase (neu):** Der GitHub-Ablauf **„Notfall – Sicherung lesen“** läuft sonntags um 04:17 UTC.
  - Er nimmt eine **zufällige Tabelle** aus der neuesten Sicherung.
  - Er entschlüsselt sie mit der **hinterlegten Kopie** des Schlüssels und vergleicht Zeilenzahl und Prüfsumme.
  - Das Ergebnis steht im GitHub-Lauf. Ist er rot, schickt GitHub eine Fehlermail.
  - In die Datenbank schreibt die Probe nichts. Der System Check sieht weiter die vollständige Tagesprüfung.
  - So ist jede Woche bewiesen: Schlüssel-Kopie stimmt, Daten sind auch ohne Supabase lesbar.
  - Inhalte stehen **nie** im Protokoll, denn das Repository ist öffentlich.

## Was tun, wenn …

### 1. Supabase ist kurz weg (Minuten bis Stunden)
Die Club-App geht in den **Notbetrieb**, siehe `docs/NOTBETRIEB.md`. Nichts zurückholen, abwarten.

### 2. Supabase ist länger weg, wir müssen etwas nachsehen
1. Neon-Konsole öffnen: console.neon.tech → Projekt **KC Core Mirror** → **SQL Editor**.
2. Den Spiegel direkt lesen, zum Beispiel `select * from kc_club_treffen order by 1 desc limit 50;`

Der Stand ist höchstens 6 Stunden alt. Bei Personen-Tabellen fehlen geschützte Spalten.

### 3. Supabase ist verloren: alles vollständig zurückholen
1. GitHub → Repository **KC-Clubapp** → **Actions** → **Notfall – Sicherung lesen** → **Run workflow**.
   - `modus`: `wiederherstellen`
   - `tabelle`: leer lassen für alle Tabellen, oder einen Namen eintragen
   - `bestaetigen`: `JA`
2. Der Ablauf schreibt die entschlüsselten Zeilen auf Neon in ein **eigenes Schema** `notfall_JJJJMMTT`, zum Beispiel `notfall_20261013`.
   - Jede Tabelle hat eine Spalte `zeile` mit dem vollständigen Datensatz.
   - Der Spiegel (`public`) wird **nicht** verändert.
3. Lesen im Neon SQL Editor:
   - `select zeile from notfall_20261013."kc_club_treffen";`
   - welche Felder es gibt: `select distinct jsonb_object_keys(zeile) from notfall_20261013."kc_club_treffen";`
   - einzelne Felder: `select zeile->>'feldname' from notfall_20261013."kc_club_treffen";`
4. Aus diesem Schema kann ein neues Supabase-Projekt befüllt werden. Das ist ein Schritt mit Analyse, Freigabe und Prüfung (AGENTS.md Regel 10).

## Schlüssel-Kopie (automatisch)

Niemand muss den Schlüssel abtippen oder kopieren. Das erledigt der GitHub-Ablauf **„Notfall einrichten“**:

1. Er lädt den Cloudflare-Tresor `kc-notfall-tresor` hoch.
2. Bei Supabase lädt er kurz die Übergabe-Funktion `kc-notfall-schluessel` hoch.
   - Sie gibt Schlüssel und Neon-Verbindung **nur an diesen Ablauf** heraus. Das prüft das von GitHub signierte Ausweis-Token (OIDC).
3. Die Werte legt er verschlüsselt im Tresor ab (`wrangler secret put`).
   - Im Protokoll sind sie unkenntlich gemacht, im Repository stehen sie nie.
4. Danach löscht er die Übergabe-Funktion **immer** wieder.
5. Zum Schluss prüft er: Ist der Tresor befüllt? Bekommt ein Fremder nichts (401)?

Wann der Ablauf läuft:
- von selbst **am 1. jedes Monats**, falls der Schlüssel je gewechselt wurde;
- bei Änderungen am Tresor;
- von Hand: Club-App → Admin → 🧯 Notfall → „⚙️ Notfall einrichten“ → Run workflow.

Der Tresor gibt die Kopie **nur** an den Ablauf „Notfall – Sicherung lesen“ (Zweig main) heraus, ebenfalls über das GitHub-Ausweis-Token. Jeder andere Aufruf bekommt 401. Der Tresor läuft ohne Supabase.

Wahlweise kann man die Kopie zusätzlich von Hand als GitHub-Secrets `KC_BACKUP_KEY` und `KC_NEON_URL` hinterlegen. Dann nimmt die Probe diese. Nötig ist das nicht.

Für den allergrößten Notfall (GitHub **und** Cloudflare weg) gibt es noch einen Weg: den Schlüssel aus dem Supabase-Tresor (`kc_db_backup_key_v1`) einmal in den Passwort-Manager oder den versiegelten Notfall-Umschlag legen. Das ist freiwillig.

> Schlüssel und Verbindungsdaten **nie** in einen Chat, eine Mail oder ins Repository kopieren (AGENTS.md Regel 15).

## Technik

| Teil | Wert |
|---|---|
| Werkzeug | `tools/notfall/sicherung-lesen.mjs` (Node 20, Paket `postgres`) |
| Abläufe | `.github/workflows/notfall-sicherung-lesen.yml` (Probe/Wiederherstellen), `.github/workflows/notfall-einrichten.yml` (Schlüssel-Kopie) |
| Tresor | `notfall-tresor/` (Cloudflare Worker `kc-notfall-tresor`, kostenloser Tarif), Test `tests/notfall-tresor.test.mjs` |
| Übergabe | `supabase/functions/kc-notfall-schluessel` (nur während „Notfall einrichten“ vorhanden) |
| Entschlüsselung | wie `kc-db-backup-verify-v2`: AES-GCM, Schlüssel = SHA-256 des Geheimnisses, `payload = {iv, ciphertext}` in Base64 |
| Prüfsumme | dieselbe Rechnung wie verify-v2 (`jsonb_populate_recordset` mit dem Tabellentyp des Spiegels) |
| Rückweg | Ablauf löschen. Er verändert nichts außer dem Schema `notfall_*`, und das nur bei „wiederherstellen“. |
