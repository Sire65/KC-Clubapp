#!/usr/bin/env bash
# KC-EINSPIELEN-SPERRE (Wunsch Hansi 04.11.2026 „Eigentlich hätte ja kein Update reingespielt werden dürfen. … Anne, Wilfried und ich
# waren drin“ – „Ja bauen oder ich sage es explizit: Einspielen“). Läuft in „Seite veröffentlichen“ und „Server hochladen“ direkt vor dem
# Wartungsfenster, also kurz bevor die neue Version bei den Mitgliedern ankommt (nicht schon beim Push – dazwischen liegen Minuten).
#
#   1. Termin: neue App-/Server-Version nur 11:45–13:00 oder 19:45–21:00 Uhr (deutsche Zeit) – sonst Abbruch, nichts geht raus.
#      Ausnahme: Hansi hat ausdrücklich „einspielen“ gesagt → im Commit-Text „[Hansi: einspielen]“ (oder Run workflow, art = hansi).
#   2. Ruhe: nicht während Spiegelung/Datensicherung und nicht, wenn mehr als 2 in der App sind – dann alle 5 Min. neu prüfen,
#      höchstens 60 Min.; danach Abbruch (Hansi fragen, dann „Run workflow“).
#   Notfall (Sicherheit, App für Mitglieder unbenutzbar, Datensicherung kaputt): „[Notfall]“ im Commit-Text (art = notfall) – ohne Warten,
#   vorher kurze Rückmeldung an Hansi (AGENTS.md).
#   Ändert der Push weder version.json noch den Server (z. B. nur Werkzeuge/Doku), startet keine App neu → nichts abzuwarten.
#
# Aufruf: tools/einspielen-ruhe.sh <termin|hansi|notfall> <ja|nein>      (2. Wert: neue Version dabei?)
# Für Tests: EINSPIEL_UHR=HHMM (Berlin), EINSPIEL_UTC=HHMM, EINSPIEL_DRIN=<Zahl>, EINSPIEL_TAKT=<Sek.>, EINSPIEL_RUNDEN=<Anzahl>
set -u
art="${1:-termin}"; neu="${2:-ja}"
takt="${EINSPIEL_TAKT:-300}"; runden="${EINSPIEL_RUNDEN:-12}"

if [ "$neu" != "ja" ]; then echo "Keine neue App- oder Server-Version – nichts abzuwarten."; exit 0; fi
if [ "$art" = "notfall" ]; then echo "NOTFALL – wird ohne Warten eingespielt (Hansi vorher Bescheid geben)."; exit 0; fi

if [ "$art" != "hansi" ]; then
  hm=$((10#${EINSPIEL_UHR:-$(TZ=Europe/Berlin date +%H%M)}))
  if ! { [ "$hm" -ge 1145 ] && [ "$hm" -le 1300 ]; } && ! { [ "$hm" -ge 1945 ] && [ "$hm" -le 2100 ]; }; then
    echo "::error::Außerhalb der Einspiel-Termine (12 und 20 Uhr) – nichts wird eingespielt. Nur wenn Hansi ausdrücklich „einspielen“ sagt: [Hansi: einspielen] in den Commit-Text, sonst zum Termin per „Run workflow“."
    exit 1
  fi
fi

im_fenster() { # Spiegel :05–:30 um 4/10/16/22 UTC, Neon-Nachtsicherung 0:35–1:00, FRA-Sicherung 1:00–3:00
  local u=$((10#${EINSPIEL_UTC:-$(date -u +%H%M)})) h m
  h=$((u / 100)); m=$((u % 100))
  case "$h" in 4|10|16|22) [ "$m" -ge 5 ] && [ "$m" -le 30 ] && return 0;; esac
  [ "$u" -ge 35 ] && [ "$u" -lt 300 ] && return 0
  return 1
}

wie_viele() { # Zahl der Personen in der App (nur Zahl); leer = Server antwortet nicht
  if [ -n "${EINSPIEL_DRIN:-}" ]; then echo "$EINSPIEL_DRIN"; return; fi
  [ -z "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" ] && return
  local token antwort
  token=$(curl -sS -m 15 -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=kc-einspielen" | jq -r .value)
  antwort=$(curl -sS -m 20 -X POST "https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club" -H "content-type: application/json" \
    -H "Authorization: Bearer $token" -d '{"action":"einspielen_ruhe"}')
  echo "$antwort" | jq -r '.drin // empty' 2>/dev/null
}

for ((i = 1; i <= runden; i++)); do
  if im_fenster; then
    echo "Runde $i: Spiegelung/Datensicherung läuft gerade – warte $takt s."
  else
    n=$(wie_viele)
    if [ -z "$n" ]; then
      echo "::warning::Anzahl in der App nicht abrufbar (Server antwortet nicht oder kennt die Frage noch nicht) – es wird eingespielt."
      exit 0
    fi
    if [ "$n" -le 2 ]; then echo "Runde $i: $n in der App – ruhig genug, es wird eingespielt."; exit 0; fi
    echo "Runde $i: $n in der App (mehr als 2) – warte $takt s."
  fi
  [ "$i" -lt "$runden" ] && sleep "$takt"
done
echo "::error::Nach $((runden * takt / 60)) Min. immer noch nicht ruhig – nichts wird eingespielt. Hansi fragen, dann „Run workflow“."
exit 1
