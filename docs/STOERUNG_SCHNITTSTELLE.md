# Störung 11.10.2026: Datenbank-Schnittstelle hing (04:21–04:46 Uhr)

## Was passiert ist
- 04:21 Uhr: Kurz nach dem Einspielen einer neuen Tabelle (Migration `20261011_kc_club_v2233_dokumente_kopie.sql`) blieb die
  Datenbank-Schnittstelle von Supabase (PostgREST) stehen. Die Datenbank selbst lief, die Anmeldung auch – aber kein Server
  bekam mehr Daten. Die Club-App schaltete richtig in den Notbetrieb (Stand 04:15 Uhr, Schreiben wurde zwischengespeichert).
- Gemerkt wurde es erst durch Hansis Bildschirmfoto (04:23). Neuladen der Schnittstelle und Trennen ihrer Verbindungen halfen nicht.
- 04:46 Uhr: Hansi hat das Projekt im Supabase-Dashboard neu gestartet → alles lief wieder. Keine Daten verloren.
- Die App verließ den Notbetrieb erst nach Neuöffnen (Prüfung nur 1× je Minute, im Hintergrund ruhen die Zeitgeber).

## Absicherungen (umgesetzt)
1. **Schnittstellen-Wächter** (`.github/workflows/schnittstellen-waechter.yml`): prüft alle 5 Min. von außen. Hängt die
   Schnittstelle 3× hintereinander, während der Supabase-Eingang antwortet, wird das Projekt **automatisch neu gestartet**
   (über den Club-Server, Schlüssel im Tresor) und Hansi bekommt von GitHub eine E-Mail (roter Lauf). Bremse: höchstens 2 Neustarts je
   Stunde; bei Netz-/Anbieterstörung kein Neustart (hilft nicht). Von Hand: „Run workflow“ mit `neustart_erzwingen = ja`.
2. **Pflicht nach jeder Datenbank-Änderung** (Menschen und Agents): `tools/schnittstelle-pruefen.sh` ausführen. Hängt die
   Schnittstelle → sofort Wächter mit `neustart_erzwingen = ja` starten, nicht erst auf Meldungen warten.
3. **Datenbank-Änderungen bündeln**: je Ausbau eine Migration statt mehrerer kurz hintereinander (jede Änderung lässt die
   Schnittstelle ihr Verzeichnis neu einlesen).
4. **App kehrt schneller zurück** (2.234.0): nach der ersten guten Antwort wird nach 5 Sek. bestätigt (statt 1 Min.), und beim
   Zurückkehren in die App wird sofort geprüft – Neuöffnen ist nicht mehr nötig.

## Neustart-Knopf (2.235.0)
Admin → Supabase → „🔄 Projekt neu starten …“: zeigt, ob die Schnittstelle antwortet, und startet Supabase nach Bestätigung neu.
Funktioniert auch, wenn die Schnittstelle hängt (der Server prüft den Admin dann über den direkten Datenbank-Weg).
Der Wächter nutzt denselben Weg (Aktion `notfall_neustart`, Ausweis = von GitHub signiertes Token, kein Secret).
Sperre: 20 Min. zwischen zwei Neustarts; alles steht im Protokoll (`notfall_neustart`).

## Einmalig einzurichten (Hansi, in der App)
1. https://supabase.com/dashboard/account/tokens → „Generate new token“ → Name `kc-neustart`, nur dieses Projekt.
2. App → Admin → Supabase → „🔄 Projekt neu starten …“ → Schlüssel (beginnt mit `sbp_`) einfügen → „Schlüssel prüfen und speichern“.
   Der Server prüft ihn bei Supabase und legt ihn in den Tresor (Vault `kc_supabase_neustart_token`) – nie im Browser oder Repository.
Ohne Schlüssel meldet der Wächter nur (E-Mail), und der Knopf öffnet die Supabase-Verwaltung wie bisher.
