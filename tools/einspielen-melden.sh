#!/usr/bin/env bash
# 2.736.0 KC-CLUB-EINSPIELEN-FENSTER: meldet dem Club-Server „wird gerade eingespielt“ (an) bzw. „fertig“ (aus).
# Ausweis: von GitHub signiertes OIDC-Token (Zielgruppe kc-einspielen) – kein Geheimnis. Bricht den Ablauf NIE ab:
# klappt die Meldung nicht, gibt es eben kein Wartungsfenster (und spätestens nach 10 Min. erlischt es von selbst).
# Aufruf: tools/einspielen-melden.sh an [Minuten] | tools/einspielen-melden.sh aus
set +e
art="${1:-an}"; minuten="${2:-5}"
[ "$art" = "an" ] && an=true || an=false
if [ -z "$ACTIONS_ID_TOKEN_REQUEST_URL" ]; then echo "Wartungsfenster: kein OIDC-Token verfügbar (id-token: write fehlt) – übersprungen"; exit 0; fi
token=$(curl -sS -m 15 -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=kc-einspielen" | jq -r .value)
antwort=$(curl -sS -m 20 -X POST "https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club" -H "content-type: application/json" \
  -H "Authorization: Bearer $token" -d "{\"action\":\"einspielen_melden\",\"an\":$an,\"minuten\":$minuten}")
echo "Wartungsfenster $art: $antwort"
exit 0
