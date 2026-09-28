# Köcheclub Werne – Club-App

Handy-App (PWA, später optional APK) für die Mitglieder des Köcheclub Werne.
Farben Weinrot/Beige, Logo Kochmütze, große Knöpfe, ohne Ballast.

**Adresse:** https://sire65.github.io/KC-Clubapp/ – Zugang nur über den persönlichen Link (`?k=…`), den Hansi in der App unter *Mitglieder → 🔗* erzeugt.

## Bereiche (Version 0.2.0)

| Bereich | Stand |
|---|---|
| Termine / Club-Treffen – Einladung, Zusage/Absage/Vielleicht (für alle sichtbar), Erinnerung am Vortag | ✅ |
| Kommunikation – an Einzelne, Gruppen, Ämter (Clubsprecher, Kassenwart …), Vorstand, alle; Lesebestätigung ✓✓; Anlagen (PDF, Kamera, Galerie) | ✅ |
| Aktive Mitglieder mit Status | ✅ |
| Eigener Status (verfügbar, beschäftigt, Urlaub, krank, abwesend – optional „bis“) | ✅ |
| Einstellungen ⚙️ – Push, Warnton, große Schrift, Dunkel-Modus, Installieren, Update | ✅ |
| Vorschläge nächste Sitzung – Themen (👍 unterstützen), Abstimmungen offen/geheim mit Frist | ✅ 0.2.0 |
| Dienstpläne – eigene Zeiten, andere nur mit Freigabe, mehrere nebeneinander mit Zeitbalken | ✅ 0.2.0 |
| Benachrichtigungen je Bereich (Push / E-Mail), Dienst-Erinnerung am Vorabend | ✅ 0.3.0 |
| „Zurück“ bleibt in der App, Kennzahlen im Kopf führen in die Bereiche | ✅ 0.3.0 |
| Protokolle | bald |
| Freigegebene Programme | bald |

### Dienstpläne – Datenquelle

Die App liest **nur** den veröffentlichten Sollplan `kc_dp_plan_published` (befüllt vom Dienstplan über `kc_dp_plan_publish`,
„Sollplan veröffentlichen“). Die verschlüsselten Sync-Daten des Dienstplans werden nicht gelesen. Fremde Dienstzeiten sind nur
sichtbar, wenn das Mitglied in der App „Meine Dienstzeiten für andere sichtbar“ eingeschaltet hat (`kc_club_freigaben`, Standard aus).
Die Freigaben des Dienstplans selbst (`kc_dp_plan_sharing`: Kann/Wunsch/Bereitschaft) bleiben unberührt.

## Aufbau

- `index.html` – komplette App (ohne Build-Schritt), `sw.js` – Service Worker (Cache, Push, Badge), `manifest.webmanifest`, `version.json`
- `supabase/functions/kc-club/index.ts` – Server (Edge Function `kc-club`, verify_jwt aus, eigener Token-Zugang)
- `supabase/migrations/` – Tabellen `kc_club_*` (RLS an, Zugriff nur über die Edge Function)
- Nutzt vorhandene KC-Kerne: `kc_core_people`, KC Communicator (Threads, Nachrichten, Anlagen, Router mit Push → Mail über web.de), `kc_member_push_subscriptions`
- Zeitplaner: pg_cron `kc-club-wartung-15min` → `action: "wartung"` (Geheimnis im Vault `kc_club_cron_secret`)

## Version & Update

Die Version steht gleichlautend in `index.html` (`APP_VERSION`), `sw.js` (`VERSION`) und `version.json`.
Jede Änderung erhöht alle drei gemeinsam; die App meldet neue Versionen und aktiviert sie auf Knopfdruck komplett (kein Mischstand).

## Test

```
node tests/app-vertrag.test.mjs
```

## Sicherheit

- Zugangstoken wird nur als SHA-256 gespeichert und sofort aus der Adresszeile entfernt.
- Keine Schlüssel im Browsercode; Server-Geheimnisse nur in Supabase Secrets/Vault.
- Übertragung per TLS, Daten verschlüsselt gespeichert, Nachrichten/Anlagen nur für Teilnehmer der Unterhaltung. Keine Ende-zu-Ende-Verschlüsselung.
