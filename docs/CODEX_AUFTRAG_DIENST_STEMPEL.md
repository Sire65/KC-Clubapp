# Codex-Auftrag: Dienst-Anmeldung – Kasse und Dienstplan an das gemeinsame Buchungsbuch (Stufe 2)

Stand 22.10.2026 · Wunsch Hansi („Alle Programme müssen zusammen arbeiten“) · Konzept: „Dienst-Anmeldung in der Club-App“ (Claude Docs)

## Ausgangslage

- Die Club-App (2.590.0) bucht Kommen/Gehen in die neue Tabelle `public.kc_dp_stempel` (Supabase-Projekt ptblnpiroqftcvlsrhac), zunächst nur für den Admin zum Testen.
- Format wie die Stechuhr der Kasse (`KC_TIME_CLOCK_V1`): `art` in/out, `zeit` = gebuchte Zeit (effectiveAt), `erfasst_am` = Eingabe (recordedAt), `quelle` app|kasse|planer, `grund`, `pause_min`, `dienst_ref` (= `kc_dp_plan_published.source_shift_id`), `member_no` (KC-00xx), `person_id` (KC-P-…).
- Nie überschreiben: Korrektur = neue Zeile mit `korrektur_von`, alte Zeile bekommt `storniert_am`.
- Ansicht `public.kc_dp_stempel_paare`: Kommen + Gehen je Person als Ist-Zeile (`status` complete | missing_end | missing_start), nur für service_role.
- Es wird bewusst **nichts** in `kc_dp_timeclock_actuals` geschrieben.

## Auftrag A – Kasse (Repo Sire65/Kasse)

1. Jedes Kommen/Gehen-Ereignis der Stechuhr zusätzlich in `kc_dp_stempel` schreiben (über den PC-Manager bzw. die Edge Function `kc-zentrale`, nicht direkt vom Tablet):
   - `quelle='kasse'`, `kasse_event_id` = Ereignis-ID (`ZEIT-…`; Spalte ist unique → doppelt melden schadet nicht), `geraet` = Kassen-Name, `grund` = `shiftReason`/`correctionReason`, `erstellt_von` = Person.
2. Vor dem Buchen den Stand aus dem gemeinsamen Buch berücksichtigen, damit ein Kommen in der App an der Kasse als „angemeldet seit … (App)“ erscheint und Gehen angeboten wird. Ohne Netz weiter wie heute aus dem lokalen Buch (offline-fähig bleibt Pflicht).
3. Stornos (`voidedAt`) als `storniert_am` übertragen.
4. Unverändert lassen: Bedienung, Ausweis-/Geburtstagscode, Pseudonyme, Bediener-Wechsel.

## Auftrag B – Dienstplan DP3 (Repo Sire65/dp3)

1. Ist-Zeiten aus `kc_dp_stempel_paare` lesen (Server-seitig, z. B. RPC mit Planer-Rechten), zusätzlich zur heutigen Datei-/`kc_dp_timeclock_actuals`-Übernahme.
2. Unvollständige Paare (`missing_end`) später vervollständigen können – heutiges Problem: `kc_dp_timeclock_publish` verwirft wegen `on conflict … do nothing` eine spätere vollständige Zeile.
3. Quelle (App/Kasse/Planer), `grund`, `vor_ort` (true/false/null) und `spontan` beim Planer anzeigen; `spontan` braucht Bestätigung.
4. Abgeschlossene Tage (closePlan) sperren: Die Club-App zeigt sie dann nur noch an (Stufe 3).

## Abnahme

- Gleiche Person: Kommen an der Kasse, Gehen in der App → eine vollständige Ist-Zeile im Dienstplan.
- Doppelt gemeldetes Kassen-Ereignis → eine Zeile.
- Kasse offline → Buchung kommt später an, Reihenfolge stimmt.
- Club-App-Tests `tests/dienst-stempel.test.mjs` bleiben grün.
