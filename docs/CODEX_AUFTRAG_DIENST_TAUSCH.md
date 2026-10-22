# Codex-Auftrag: Dienst-Tausch-Börse im Dienstplan übernehmen (DP3)

Stand 22.10.2026 · Wunsch Hansi („Dienst-Tausch-Börse“) · Club-App 2.601.0

## Ausgangslage

- Die Club-App führt die Tauschbörse in `public.kc_club_dienst_tausch` (Supabase ptblnpiroqftcvlsrhac), zunächst nur für den Admin zum Testen.
- Ablauf: Mitglied bietet einen veröffentlichten Dienst an (`dienst_ref` = `kc_dp_plan_published.source_shift_id`) → ein anderes Mitglied übernimmt (`an_person`) → der Planer (Admin) bestätigt (`status = 'bestaetigt'`, `entschieden_von/_am`).
- `kc_dp_plan_published` wird von der Club-App **nie** geändert. Bis DP3 die Übergabe übernimmt, rechnet die Club-App bestätigte Übergaben selbst ein (Mein Dienst, Dienst-Anmeldung, Erinnerungen, Admin-Übersicht „Wer ist heute da“).
- `probe = true` sind Test-Angebote des Admins ohne Dienstplan – immer ignorieren.

## Auftrag B2 – Dienstplan DP3 (Repo Sire65/dp3)

1. Bestätigte Übergaben (`status = 'bestaetigt' and probe = false`) lesen (server-seitig, Planer-Rechte) und beim nächsten Veröffentlichen die Schicht `dienst_ref` von `von_person` auf `an_person` umschreiben.
2. Im Planer anzeigen: offene und übernommene Angebote („wartet auf Bestätigung“), damit der Planer sie auch dort sieht.
3. Nach der Übernahme in den Plan nichts in `kc_club_dienst_tausch` ändern (die Club-App erkennt den neuen Plan selbst: die Schicht steht dann direkt bei `an_person`; die Übergabe zählt dann doppelt nicht, weil `von_person` die Schicht nicht mehr hat).

## Abnahme

- Angebot bestätigt → nach dem Veröffentlichen steht die Schicht bei der übernehmenden Person, in der Club-App genau einmal.
- Probe-Angebote erscheinen nirgends im Dienstplan.
- Club-App-Tests `tests/dienst-tausch.test.mjs` bleiben grün.
