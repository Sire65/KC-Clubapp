# Notfall: Daten zurückholen, wenn Supabase ausfällt

KC-CORE-NOTFALL-LESEN, Stand 13.10.2026

## Wo liegen unsere Daten?

| Ort | Was | Lesbar ohne Supabase? |
|---|---|---|
| **Supabase** (London) | Die echte Datenbank. Die Club-App arbeitet hier. | – |
| **Neon „KC Core Mirror“**: Spiegel | Alle Tabellen. Alle 6 Std. kopiert (02:10, 08:10, 14:10, 20:10). Personendaten sind gekürzt (Datenschutz). | **Ja**, direkt. |
| **Neon „KC Core Mirror“**: Tagessicherung | Täglich jede Tabelle **vollständig**. Verschlüsselt (AES-GCM) und unveränderlich, in `kc_backup_snapshots`. | **Nur mit dem Sicherungsschlüssel.** |

Der Sicherungsschlüssel heißt im Supabase-Tresor (Vault) `kc_db_backup_key_v1`.
Fällt Supabase ganz aus, ist auch der Tresor weg. Deshalb **muss eine Kopie des Schlüssels außerhalb von Supabase liegen**. Siehe „Einmal einrichten“.

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

## Einmal einrichten (Hansi, am PC)

> Schlüssel und Verbindungsdaten **nie** in einen Chat, eine Mail oder ins Repository kopieren (AGENTS.md Regel 15).

1. **Schlüssel kopieren**
   - Supabase-Dashboard → Projekt → **Project Settings → Vault** (oder Integrations → Vault).
   - Bei `kc_db_backup_key_v1` auf „Reveal“ klicken und den Wert kopieren.
2. **Schlüssel ablegen**
   - GitHub → KC-Clubapp → **Settings → Secrets and variables → Actions → New repository secret**.
   - Name `KC_BACKUP_KEY`, als Wert den Schlüssel einfügen.
   - Zusätzlich in den **Passwort-Manager** und in den versiegelten **Notfall-Umschlag** legen.
3. **Neon-Verbindung ablegen**
   - Neon-Konsole → Projekt **KC Core Mirror** → **Connect**.
   - Die Verbindungszeichenkette kopieren. Sie beginnt mit `postgresql://`.
   - Als GitHub-Secret `KC_NEON_URL` speichern, auch in den Passwort-Manager.
4. **Einmal testen**
   - Actions → **Notfall – Sicherung lesen** → **Run workflow**, `modus` = `probe`.
   - Grün ✅: Die Kopie stimmt.
   - Rot „Entschlüsselung abgelehnt“: Der Schlüssel wurde falsch kopiert. Schritt 1 und 2 wiederholen.

Solange die Secrets fehlen, meldet der wöchentliche Lauf „⚪ Noch nicht eingerichtet“. Das ist grau, kein Fehler.
Wird der Schlüssel in Supabase je gewechselt, muss auch `KC_BACKUP_KEY` erneuert werden. Sonst meldet die nächste Wochenprobe Rot.

## Technik

| Teil | Wert |
|---|---|
| Werkzeug | `tools/notfall/sicherung-lesen.mjs` (Node 20, Paket `postgres`) |
| Ablauf | `.github/workflows/notfall-sicherung-lesen.yml` |
| Entschlüsselung | wie `kc-db-backup-verify-v2`: AES-GCM, Schlüssel = SHA-256 des Geheimnisses, `payload = {iv, ciphertext}` in Base64 |
| Prüfsumme | dieselbe Rechnung wie verify-v2 (`jsonb_populate_recordset` mit dem Tabellentyp des Spiegels) |
| Rückweg | Ablauf löschen. Er verändert nichts außer dem Schema `notfall_*`, und das nur bei „wiederherstellen“. |
