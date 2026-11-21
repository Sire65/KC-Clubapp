# Sparhebel – Plan (vorbereitet 21.11.2026, noch NICHT gebaut – Freigabe Hansi abwarten)

Grundlage: Sparbilanz 21.11. (App-Aufrufe −50 %, DB-Rechenzeit −42 %, 0 Last-Warnungen seit 20.11.).

## Hebel 1 – Rückkehr in die App: nur Geändertes laden (KC-CLUB-INIT-DELTA)
- Heute: ~3,3 Komplett-Ladungen (`init`, ~45 DB-Abfragen, ~14 KB) je Start; jede Rückkehr/Fokus/online-Event → `neuLaden()`.
- Plan: Server liefert je Bereich einen Stand (Zeitstempel/Zähler: Chats, Pinnwand, Termine, Aufgaben, Mitglieder, Einstellungen); App schickt bei Rückkehr nur die Stände (`init` mit `seit`), Server antwortet nur mit geänderten Teilen. Kompletter `init` nur beim echten Start, nach Update, nach > 30 Min. weg oder wenn die Leitung unterbrochen war.
- Bausteine: vorhandenes Start-Paket (KC-CLUB-START-PAKET, `start_paket_abweichung`), `kzSeit()` in app.js (Fotos/Dienste nutzen das schon).
- Wirkung geschätzt: −20 bis −30 % der Club-App-DB-Abfragen.
- Tests: Vertragstest „Rückkehr ruft init mit seit“, Server-Sandbox „unverändert → leere Teile“.

## Hebel 2 – Notbetrieb-Paket nur bei Änderung (KC-CLUB-NOTPAKET-ETAG)
- Heute: `notpaket_teil` ~335 KB je Aufruf, 4,6–5,4 MB/Tag (~40 % der Daten an die Apps).
- Plan: Server gibt Prüfsumme/Version des Pakets; App speichert sie und fragt mit `wenn_anders`; unverändert → kurze Antwort „gleich“. Paket wird nachts (00:09) gebaut → tagsüber fast immer „gleich“.
- Wirkung geschätzt: ~4 MB/Tag weniger (~0,13 GB/Monat).

## Hebel 3 – Pinnwand/Terminanfragen nicht bei jedem Start/jeder Rückkehr
- Heute nur −23 % / −19 %: laufen bei jedem Start und jeder Rückkehr.
- Plan: bei stehender Leitung nur über Signal + Takt; beim Start Stand aus Hebel 1 mitliefern (kein eigener Aufruf).

## Außerdem (kein Bau)
- Weniger Versionen: 10 Versionen in 28 Std. (20./21.11.) – mehr bündeln, Termine 12/23:50 einhalten.
- „Protokoll sparen“ (2.995.0, `cron.log_statement=off`) wirkt erst nach DB-Neustart – nachts ausführen.
- Echte Egress-Zahl im Supabase-Dashboard → Usage prüfen (Fotos, Spiegel, Sicherung nicht in der eigenen Messung).

Reihenfolge-Vorschlag: Hebel 2 (klein, sicher) → Hebel 3 → Hebel 1 (größer, mit Browser-Test).
