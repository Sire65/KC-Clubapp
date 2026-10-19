# Club-App – Regeln für Menschen und Coding-Agents (Codex, Claude, …)

Es gilt der KC-Entwicklervertrag: https://github.com/Sire65/KC-Infrastructure-Control-Center/blob/main/AGENTS.md

## Neuerungen gebündelt einspielen (KC-DB-SPARSAM, 18.10.2026, Freigabe Hansi)

Jede neue Version startet alle gerade offenen Apps neu. Ein App-Start kostet rund 71 Datenbank-Abfragen je Gerät
(Messung Server 2.464.0, Server-Log `{"db":"init",…}`). Damit das kostenlose Supabase-Kontingent reicht und keine
Funktion gedrosselt oder abgeschaltet wird:

1. Neuerungen sammeln (Wunschliste, kleine Verbesserungen) und **gebündelt zu festen Terminen** einspielen:
   **12 Uhr und 20 Uhr** (deutsche Zeit). Bis dahin auf einem Arbeitszweig fertigstellen und testen.
2. **Sofort einspielen** (ohne auf den Termin zu warten):
   - wenn Hansi es will („wichtig“, „sofort“, „jetzt einspielen“) – Hansi kann jederzeit zwischendurch einspielen lassen,
   - Fehler, die Mitglieder behindern,
   - Sicherheitskorrekturen,
   - Korrekturen an Datensicherung, Spiegelung oder Notbetrieb.
3. Ein Bündel = eine Version (eine Versionsnummer, ein Eintrag in `CHANGELOG.md` mit allen Punkten).
4. Tests laufen vor jedem Hochladen automatisch; ein roter Test verhindert das Einspielen.

## Supabase-Protokolle nicht durchsuchen (KC-SPARSAM-PROTOKOLLE, 19.10.2026, Wunsch Hansi „es muss kostenlos bleiben“)

Supabase zählt jedes Durchsuchen der Protokolle (Logs Explorer, Berichte-Seiten, MCP `get_logs`/`query_logs`, Management-API)
als „Logs Query“ – im Abrechnungszeitraum 26.09.–26.10.2026 waren es 605 GB bei 100 GB im kostenlosen Tarif, fast alles aus
Fehlersuchen von KI-Sitzungen und Dashboard-Seiten. Darum:

1. Für Lagebilder die eigenen Tabellen nutzen: `kc_db_mirror_runs`, `kc_db_mirror_audit`, `kc_club_messwerte`,
   `kc_traffic_guard_samples`, `cron.job_run_details`, `net._http_response`, `pg_stat_statements`.
2. Protokolle nur, wenn es anders nicht geht – dann mit engem Zeitfenster (Minuten, nicht 24 Stunden) und Filter auf eine Quelle.
3. Keine Schleifen oder Zeitpläne, die Protokolle abfragen.
