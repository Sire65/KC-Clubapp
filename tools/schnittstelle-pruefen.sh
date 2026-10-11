#!/bin/sh
# KC-CLUB-SCHNITTSTELLEN-WAECHTER (11.10.2026): nach JEDER Datenbank-Änderung ausführen (Pflicht für Menschen und Agents).
# Prüft 3× über ~40 Sek., ob die Datenbank-Schnittstelle (PostgREST) antwortet. Exit 0 = gut, 1 = hängt
# → dann sofort GitHub-Workflow „Schnittstellen-Wächter“ mit neustart_erzwingen=ja starten (oder Supabase-Dashboard → Restart project).
URL="https://ptblnpiroqftcvlsrhac.supabase.co"; KEY="sb_publishable_SqXIeGN-clcZ4gjmpLdSww_4DLfyy24"
for i in 1 2 3; do
  r=$(curl -s -o /dev/null -w "%{http_code} %{time_total}" --max-time 12 "$URL/rest/v1/kc_club_tippen?limit=1" -H "apikey: $KEY")
  echo "Prüfung $i: $r"
  set -- $r
  case "$1" in 200|401|403|404) awk -v t="$2" 'BEGIN{exit !(t<10)}' && { echo "OK – Schnittstelle antwortet."; exit 0; } ;; esac
  [ $i -lt 3 ] && sleep 15
done
echo "ACHTUNG: Datenbank-Schnittstelle hängt – sofort neu starten (Schnittstellen-Wächter, neustart_erzwingen=ja)."; exit 1
