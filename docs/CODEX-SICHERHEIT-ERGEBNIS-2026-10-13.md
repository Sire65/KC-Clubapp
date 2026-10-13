# KC-SEC-2026-10-13 – Zwischenstand der Ausführung

## Erledigt

1. Dienstplan main enthält Claudes Zweig claude/sicherheit-mail-inbound und den ergänzten Vergleich mit konstanter Laufzeit. Commit 93d6c40. Quellstand Mail-Inbound 9; live bisher Claude-Stand 8. Lokaler Fixturetest und echter unauthentifizierter POST: 403. Kein Secret gesetzt, kein Brevo-Eingang freigeschaltet.

3. Money-Butler-Bootstrap Quellstand 3: bestätigte Auth-E-Mail erforderlich, exakter Vergleich nach trim/lowercase, kein ilike. Es gibt drei nicht normalisierte zentrale E-Mail-Werte; deshalb liest der Server die aktiven Personen der Organisation mittels eq und filtert die Adresse exakt im Servercode. Bestehende deaktivierte Verknüpfungen werden abgewiesen, kein update(active:true). Ereignisse erscheinen ohne E-Mail/Token in den Serverlogs. Identitäts-, Wildcard-, Unbestätigt-, Deaktiviert- und Fremdzuordnungstests sind grün.

4. Backup-Verify Quellstand 6: fehlendes erwartetes oder übermitteltes Token gibt immer 401. SHA-256-Digests werden ohne frühen Abbruch verglichen. Negative Fixturetests grün; sonstige Backup-/Entschlüsselungslogik unverändert.

## Noch offen

2. Kassenzugang: Vorbereitung ist auf Sire65/Kasse, Branch codex/security-central-transition, Commit f862679, Draft-PR 19 gesichert. Dualer Übergang, Dateiauswahl und PC-Nachweise sind getestet. Kein Secret gewechselt, kein Server/SQL ausgerollt. Vor Rollout bleibt die Herkunftsprüfung des vorhandenen lokalen Companion-Pfads offen; siehe KC-ZENTRALE-UMSTELLUNG.md. Abschalten erst nach allen PCs und ausdrücklicher Entscheidung.

5. Ursache im Backup-Abschluss verifiziert: immutable-Trigger erlaubt Header-Updates ausschließlich aus running. Ein frühzeitig gesetztes error friert die Zähler ein, obwohl weitere Snapshots gespeichert werden. Der jüngste Satz 318ca292-444d-4cb4-88de-9e9c263fb78a enthält 247 Snapshots und eine erfolgreiche Prüfung 247/247, aber Header 175/174/error. Eine direkte Reparatur terminaler Header wäre ein Verstoß gegen den Schutz. Der Worker muss künftig aus running einmalig nach vollständiger Verifikation abschließen; historische Korrekturen brauchen einen ausdrücklich erlaubten, protokollierten Abschlussweg. Trigger bleiben unverändert. Keine Backupdaten geändert.

6. Scheduler 6, Maintenance 5, Frontend-Check 9, Quality-Gate 8 und WM-Notify 6 vergleichen Tokens über SHA-256 ohne frühen Abbruch; live und Negativtests 401/403. Machine 9 begrenzt neue Registrierungen atomar auf fünf je gehashtem Absender/Programm/UTC-Tag, zusätzlich zum vorhandenen globalen Limit. CF-Connecting-IP wird ausschließlich serverseitig mit HMAC gehasht, nicht gespeichert oder protokolliert. Fehlender Absender/Counter ist geschlossen. Die service_role-only RPC und private Zählertabelle sind eingespielt; fünf/sechs, unabhängiger Absender und Berechtigungen wurden in einer zurückgerollten echten DB-Probe geprüft. Advisor: RLS ohne öffentliche Policies ist für diese private service-only Tabelle beabsichtigt. Simulation im Kasse-Zweig verlangt ein Prozesspasswort und speichert es nicht im Bericht. MFA bleibt offen: Enrollment und Prüfung brauchen den angemeldeten Admin mit seinem Authenticator. Stillgelegte Pilot-/Einmalfunktionen wurden nicht reaktiviert oder gelöscht.

## Live-Nachtrag

Money 3 und Verify 6 sind live (Negativtest 401). Worker 19 ist live und bleibt während Teil-Batches running; zählt tatsächlich vorhandene Snapshots gegen das freigegebene Register und finalisiert erst nach bestätigter vollständiger Entschlüsselungsprüfung. Netzwerkfehler bleiben wiederholbar. Trigger unverändert. Fixturetests einschließlich Teillauf, Wiederholung und Registry-Prüfung bestanden.

Neue echte Sicherung zur Abnahme: e57f7b61-68ae-41a9-b6ab-11d101386a41, Register beim Start 250 Tabellen. Ergebnis wird noch geprüft. Alte terminale Header bleiben unverändert. Das Schließen des verlassenen running-Satzes vom 28.08. wurde durch automatische Freigabeprüfung abgewiesen: dauerhafte historische Statusänderung benötigt eine konkrete Zustimmung; nicht erneut versucht.

Die Club-App-Oberfläche wird durch diese separaten Server-Quellstände nicht geändert; keine neue Club-App-Version vorgetäuscht. RC bis vollständiger Abnahme. Rollback: ursprüngliche Funktionsstände 2/5 sind beim Anbieter weiterhin versioniert; nicht ohne Sicherheitsprüfung zurücksetzen.
