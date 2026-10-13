# KC-SEC-2026-10-13 – Zwischenstand der Ausführung

## Erledigt

1. Dienstplan main enthält Claudes Zweig claude/sicherheit-mail-inbound und den ergänzten Vergleich mit konstanter Laufzeit. Commit 93d6c40. Quellstand Mail-Inbound 9; live bisher Claude-Stand 8. Lokaler Fixturetest und echter unauthentifizierter POST: 403. Kein Secret gesetzt, kein Brevo-Eingang freigeschaltet.

3. Money-Butler-Bootstrap Quellstand 3: bestätigte Auth-E-Mail erforderlich, exakter Vergleich nach trim/lowercase, kein ilike. Es gibt drei nicht normalisierte zentrale E-Mail-Werte; deshalb liest der Server die aktiven Personen der Organisation mittels eq und filtert die Adresse exakt im Servercode. Bestehende deaktivierte Verknüpfungen werden abgewiesen, kein update(active:true). Ereignisse erscheinen ohne E-Mail/Token in den Serverlogs. Identitäts-, Wildcard-, Unbestätigt-, Deaktiviert- und Fremdzuordnungstests sind grün.

4. Backup-Verify Quellstand 6: fehlendes erwartetes oder übermitteltes Token gibt immer 401. SHA-256-Digests werden ohne frühen Abbruch verglichen. Negative Fixturetests grün; sonstige Backup-/Entschlüsselungslogik unverändert.

## Noch offen

2. Kassenzugang: Rotation muss mit den Kassen-PCs koordiniert werden. Der alte im Funktionsquelltext enthaltene Wert wird hier weder gespeichert noch angezeigt. Vorbereitung und Aktivierung noch nicht abgeschlossen.

5. Ursache im Backup-Abschluss verifiziert: immutable-Trigger erlaubt Header-Updates ausschließlich aus running. Ein frühzeitig gesetztes error friert die Zähler ein, obwohl weitere Snapshots gespeichert werden. Der jüngste Satz 318ca292-444d-4cb4-88de-9e9c263fb78a enthält 247 Snapshots und eine erfolgreiche Prüfung 247/247, aber Header 175/174/error. Eine direkte Reparatur terminaler Header wäre ein Verstoß gegen den Schutz. Der Worker muss künftig aus running einmalig nach vollständiger Verifikation abschließen; historische Korrekturen brauchen einen ausdrücklich erlaubten, protokollierten Abschlussweg. Trigger bleiben unverändert. Keine Backupdaten geändert.

6. Restliche Tokenvergleiche, Registrierungslimit, Simulationspasswort und MFA noch offen. Stillgelegte Pilot-/Einmalfunktionen wurden nicht reaktiviert oder gelöscht.

Die Club-App-Oberfläche wird durch diese separaten Server-Quellstände nicht geändert; keine neue Club-App-Version vorgetäuscht. RC bis vollständiger Abnahme. Rollback: ursprüngliche Funktionsstände 2/5 sind beim Anbieter weiterhin versioniert; nicht ohne Sicherheitsprüfung zurücksetzen.
