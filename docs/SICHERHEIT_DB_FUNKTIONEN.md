# Sicherheits-Durchsicht: Datenbank-Funktionen mit Außenzugang (Sicherheit Punkt 4)

Stand 23.10.2026 · Wunsch Hansi („baue deine 4, 5, 6“) · Anlass: Supabase-Sicherheitsprüfung (keine Fehler, 49 Warnungen)

**Noch nichts geändert** – erst nach Hansis OK. Jede Änderung ist ein `revoke execute` (rückgängig mit `grant execute`).

## Was geprüft wurde

Alle Funktionen in `public`, die mit Admin-Rechten laufen (`security definer`) und von außen aufgerufen werden dürfen:
- **7** ohne Anmeldung (`anon`) – nur mit dem öffentlichen Schlüssel, den jede Web-Seite kennt
- **35** nur für angemeldete Programme (`authenticated`: Dienstplan 3, PC-Manager, Verwaltung)

Für jede: Prüft sie selbst, wer ruft? Schreibt sie? Wird sie noch benutzt (Aufrufzähler `pg_stat_statements`, Suche in Club-App, Kasse/PC-Manager, DP3, Dienstplan, Leitstand)?

## Ergebnis

### A) Die 35 Funktionen für angemeldete Programme – in Ordnung

Alle 35 prüfen selbst die Anmeldung (`auth.uid()`/`auth.jwt()`) und werden von einem Programm benutzt
(DP3: Veröffentlichen, Wunsch-Eingang, Fehlerliste, Stundenmeldungen; PC-Manager: Datenbank-Zentrale; Club-App-Server: Adress-/Personen-Änderungen;
Leitstand: Datenfluss-Meldung). **Empfehlung: so lassen.**

Einzige offene Frage: `kc_dp_mark_push_receipt` – in keinem der geprüften Programme gefunden (evtl. KC-Communication, privates Repo). → Codex/KC-Communication fragen, sonst abschalten.

### B) Die 7 Funktionen ohne Anmeldung

| Funktion | Schutz | Benutzt | Empfehlung |
|---|---|---|---|
| `kc_communication_push_erneuern` | nur mit geheimem Erneuerungs-Hash **und** alter Push-Adresse | Handys erneuern ihren Push-Zugang | **so lassen** (nötig) |
| `kc_dp_report_error` | prüft Anmeldung, nimmt nur Fehlermeldungen an | DP3 meldet Fehler | **so lassen** |
| `kc_wm_umfrage_absenden` | persönlicher Link-Schlüssel | WM-Präsentations-Umfrage, letzte Antwort **25.09.** | **abschalten** – Umfrage ist vorbei |
| `kc_wm_spruch_liste` / `kc_wm_spruch_waehlen` | persönlicher Link-Schlüssel | Spruchauswahl, zuletzt geöffnet **29.09.**, Status noch „offen“ | **schließen**, sobald alle gewählt haben (Hansi?) – dann abschalten |
| `kc_wm_danke_mail_offen` / `_erledigt` | geheimer Automations-Schlüssel | Danke-Mail-Automatik fragt noch regelmäßig nach (337 Aufrufe, 12 Mails verschickt, zuletzt 21.10.) | wenn alle Danke-Mails raus sind: Automatik beenden und abschalten |

### Vorbereitetes SQL (erst nach OK über „Datenbank einspielen“)

```sql
-- Umfrage vorbei (letzte Antwort 25.09.2026)
revoke execute on function public.kc_wm_umfrage_absenden(text, text, smallint, smallint, text, text, integer, integer) from anon, authenticated, public;
-- nach Hansis OK „Spruchauswahl ist fertig“:
-- update public.kc_wm_spruch_status set offen = false where id = 1;
-- revoke execute on function public.kc_wm_spruch_liste(text) from anon, authenticated, public;
-- revoke execute on function public.kc_wm_spruch_waehlen(text, integer, text) from anon, authenticated, public;
-- nach Hansis OK „Danke-Mails sind fertig“ (Automatik vorher abschalten):
-- revoke execute on function public.kc_wm_danke_mail_offen(text) from anon, authenticated, public;
-- revoke execute on function public.kc_wm_danke_mail_erledigt(text, text, text) from anon, authenticated, public;
```

## Weitere Hinweise der Supabase-Prüfung

- **205 × „RLS an, aber keine Regel“** – gewollt: Diese Tabellen darf von außen niemand lesen, nur der Club-Server. Kein Handlungsbedarf.
- **„Geleakte Passwörter prüfen“ ist aus** – betrifft nur Anmeldungen mit Passwort über Supabase Auth (DP3-Planer-Anmeldung). Laut Supabase nur im bezahlten Tarif; bei uns bleibt es kostenlos → aus lassen, dafür starke Passwörter + Zwei-Faktor beim Planer.

## Geheimnis-Suche (Punkt 5, 23.10.2026)

Gesucht in Club-App, Leitstand, Kasse/PC-Manager, DP3, Dienstplan (Dateien und gesamter Verlauf) nach Passwörtern, geheimen Schlüsseln, Tokens,
Datenbank-Adressen mit Passwort: **nichts gefunden.** Nur öffentliche `anon`-Schlüssel (so gedacht). Die Club-App prüft das ab 2.607.0 vor jedem Einspielen
(`tests/geheimnis-waechter.test.mjs`).
