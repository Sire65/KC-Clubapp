# Auftrag an Codex: DP2 ↔ Club-App – Tage veröffentlichen + Dienstwünsche aus der Club-App übernehmen

Stand: 29.09.2026 · Freigabe: Hansi (Admin) · Repository: **Sire65/dp3** (KC DP2, aktuell `0.20.0-build247`)
Supabase-Seite ist **fertig und live** (Projekt `ptblnpiroqftcvlsrhac`, Migration `kc-clubapp/supabase/migrations/20260929_kc_dp_wunsch_eingang_v1.sql`). In DP2 ist **nur Client-Code** nötig – bitte keine eigenen Tabellen/RPCs dafür anlegen.

## Ziel (in einem Satz)
Mitglieder tragen ihre Dienstwünsche in der **Club-App** ein (Nachbau des Twinkey-Ablaufs). Die Club-App legt sie im Klartext-Eingang `kc_dp_wish_inbox` ab. **DP2 holt sie automatisch ab, übernimmt sie in seine (verschlüsselten) Wünsche und bestätigt.** Damit die Club-App dieselben Tage/Kernzeiten/Bedarfe zeigt wie Twinkey, **veröffentlicht DP2 seine Tage** in `kc_dp_days_published`.

Datenvertrag (`kc_core_data_contract`): DP2 bleibt Eigentümer der Dienstplanung. Club-App (`KC_CLUBAPP`) liest nur und liefert Wünsche ausschließlich über den Eingang.

---

## Teil 1 – Tage veröffentlichen (DP2 → Supabase)

**Neues Modul** `src/core/days-publish-bridge.js` (Muster: `src/core/plan-manager-bridge.js`), eingebunden in `index.html` direkt nach `plan-manager-bridge.js`.

**Neue Provider-Funktion** in `src/adapters/supabase-provider.js` neben `publishPlan` (Z. ~131):
```js
async function publishDays({eventId, days}){
  const c=validateConfig();
  const {data}=await api('/rest/v1/rpc/kc_dp_days_publish',{method:'POST',body:JSON.stringify({p_org_id:c.orgId,p_event_id:String(eventId||'KC-WM-2026'),p_days:days})});
  return data;
}
```
(im Rückgabeobjekt des Providers wie `publishPlan` exportieren)

**Zeilen bauen** – je Tag aus `K.days` (Model `src/core/model.js:49-53`) **mit den wirksamen Überschreibungen** aus `K.daySettings`/`day_config` (so wie Twinkey/`K.roleUx.openTimes` sie anzeigt – bitte dieselbe Funktion benutzen, keine eigene Berechnung):
```json
{
  "date": "2026-12-04",
  "type": "market",               // prep | market | after
  "start": 11, "end": 23,          // Einsatzzeitraum (Dezimalstunden)
  "open": 12, "close": null,       // KERNZEIT = open bis (close ?? end) – Markt geöffnet, muss abgedeckt sein
  "preOpenMinutes": 60,
  "demand": [ {"start":11,"end":12,"total":4,"front":2,"back":2}, {"start":12,"end":15,"total":6,"front":4,"back":2} ],
  "program": [ {"title":"Eröffnung / Auftakt","start":17,"end":18,"impact":"+"} ],
  "label": "Markttag"
}
```
- `demand`: aus der **wirksamen** Bedarfsmatrix (`demandMatrix`/`K.baseRequirementFor`/`simpleReq`), zusammengefasste Stundenblöcke; `front/back` = `null`, wenn der Tag keine Aufteilung hat.
- Prep/After-Tage ohne Öffnung: `open`/`close` = `null`.

**Auslöser:** in `src/core/auto-sync.js` nach `K.planManagerBridge?.publishNow?.()` – **eigenes** `try{}catch{}` (darf den Sync nicht stören):
```js
try{await K.daysPublishBridge?.publishNow?.();}catch(e){/* nächster Takt */}
```
Zusätzlich direkt nach einer Änderung der Tageskonfiguration (optional, wenn einfach möglich).
**Semantik:** vollständiger Snapshot je `org_id + event_id` (die RPC setzt nicht mehr gelieferte Tage auf `removed`). Event-ID: `K.eventConfig?.eventId || 'KC-WM-2026'`.
**Rechte:** RPC verlangt `kc_dp_memberships.role ∈ admin|planner|duty_manager` – bei Mitglieder-Sitzungen einfach überspringen (Fehler schlucken).

---

## Teil 2 – Wunsch-Eingang übernehmen (Supabase → DP2)

**Neues Modul** `src/core/club-wish-inbox.js`, ebenfalls im Auto-Sync-Takt nach Teil 1 (eigenes try/catch), nur für Planungsrollen.

**Provider-Funktionen:**
```js
async function wishInboxPending({eventId}){ /* rpc kc_dp_wish_inbox_pending {p_org_id, p_event_id} → Array */ }
async function wishInboxAck({id, revision, status, result}){ /* rpc kc_dp_wish_inbox_ack {p_id, p_revision, p_status:'uebernommen'|'abgelehnt', p_result} */ }
```

**Format eines Eingangs** (Contract `KC_DP_WISH_INBOX_V1`):
```json
{
  "id": "uuid", "personId": "KC-P-M0003", "eventId": "KC-WM-2026", "source": "club_app", "revision": 3,
  "entries": [
    {"date":"2026-12-04","start":11,"end":17,"wishType":"available","wishZone":"V","scope":"time","comment":""},
    {"date":"2026-12-04","start":12,"end":15,"wishType":"preferred","wishZone":"V","scope":"time","comment":""},
    {"date":"2026-12-05","start":18,"end":23,"wishType":"if_needed","wishZone":"B","scope":"time","comment":""},
    {"date":"2026-12-06","start":0,"end":24,"wishType":"unavailable","wishZone":"B","scope":"day","comment":"Sperrtag"},
    {"date":"2026-12-07","start":13,"end":15,"wishType":"unavailable","wishZone":"B","scope":"time","comment":""}
  ],
  "standby": {"2026-12-05": {"answer":"yes","slots":[{"start":17,"end":20,"wishZone":"B","reserve":false}]},
              "2026-12-04": {"answer":"no","slots":[]}},
  "comment": "…", "shareWithColleagues": true, "submittedAt": "…"
}
```
Zeiten = Dezimalstunden (17.5 = 17:30), Typen = `KC_DP3_WISH_V1` (`src/core/wish-contract.js`): `available` Kann-Zeit, `preferred` Wunschzeit, `if_needed` Nur wenn nötig, `unavailable` Sperrzeit (`scope:'time'`) bzw. Sperrtag (`scope:'day'`).

**Nachtrag Club-App 0.59.0 (Twinkey 1:1):** Die Club-App nutzt DP2s Twinkey unverändert. Einträge können deshalb zusätzlich
die DP2-eigenen Felder tragen und müssen **unverändert** in den DP2-Wunsch übernommen werden:
- `onlyIfNeeded: true` (nur wenn gesetzt),
- `assistantDay: {standby, completed, completedSignature}` – Twinkeys Tagesstatus „Fertig“ (`src/ui/simple-wish-assistant.js:15-16, 303`).
Sperrtag kommt wie in Twinkey mit dem Tagesrahmen (z. B. `start:11,end:23,scope:'day'`), nicht zwingend 0–24.
**Achtung jsonb:** Supabase sortiert Objektschlüssel um (`{"end":13,"start":11}`, `{"slots":…,"answer":…}`). `completedSignature`
ist ein Text und bleibt exakt. Damit „Fertig“ in DP2 erhalten bleibt, beim Übernehmen `assistantDay.standby` und `standby[date]`
in der Schlüsselreihenfolge herstellen, die in `completedSignature` steht (die Club-App macht das genauso: `dp2-club/daten.js`,
Funktionen `kanon`/`ordnen`). Ohne diese Umordnung zeigt DP2 den Tag als „In Bearbeitung“.

**Übernahme je Eingang (ein Eingang = der vollständige aktuelle Club-App-Stand dieser Person):**
1. Person prüfen: aktiv + `K.personPlanningAllowed(personId)` (falls vorhanden). Sonst `ack(…,'abgelehnt',{reason:'person_unbekannt'})`.
2. Wunschphase prüfen (`K.state.wishPhase==='open'`, Plan nicht veröffentlicht – wie `src/core/mobile-wish-matrix.js:11-30`). Geschlossen → `ack(…,'abgelehnt',{reason:'wunschphase_geschlossen'})`.
3. **Ersetzen statt Anhängen:** alle bisherigen Wünsche dieser Person mit `source==='club_app'` (für die Tage der Veranstaltung) per `K.mutations` auf `deleted` setzen, dann jeden Eintrag mit `K.mutations.saveWish({... , personId, source:'club_app', sourceInboxId:id, status:'confirmed'}, {reason:'Club-App-Wunscheingang'})` speichern. Wünsche, die die Person direkt in DP2 erfasst hat, **nicht** anfassen.
4. Jeden Eintrag mit den DP2-Regeln prüfen (`wish-contract.js`, `planning.js:43-50`, `mobile-wish-matrix.js`): Datum im Zeitraum, Ende > Beginn, Kann-Zeiten überlappen nicht, Wunschzeit liegt in Kann-Zeit, Sperrtag ohne weitere Zeiten. Ungültige Einträge **überspringen** und in `result.problems` melden (nicht den ganzen Eingang verwerfen).
5. Bereitschaft: `K.memberUxData.assistantStandby[personId][date] = standby[date]` (Form wie in `src/ui/simple-wish-assistant.js:303`).
6. `shareWithColleagues` (nur wenn nicht `null`): wie die Twinkey-Frage in `src/ui/chef-companion.js:30` über `K.planSharing` speichern.
7. `await K.persistAll()`, Protokolleintrag „Club-App-Wunscheingang {personId} rev {revision}“.
8. `ack(id, revision, 'uebernommen', {added, replaced, skipped, standbyDays, problems:[…], dp2Version:K.VERSION})`.
   Antwort `{stale:true}` = Person hat inzwischen neu gespeichert → nichts tun, der nächste Takt holt die neue Revision.
9. Fehler bei 3–7: Zustand zurückrollen (Muster `src/core/inbound-wish-import.js:9-11`), **kein** ack → nächster Takt versucht erneut.

Die vorhandene `K.inboundWishImport.applyEntries` (`src/core/inbound-wish-import.js`) kann als Grundlage dienen, braucht aber die Ersetzen-Semantik (Schritt 3), `source:'club_app'`, Bereitschaft und darf die 98-%-Mail-Schwelle für diese Quelle nicht anwenden (die Club-App-Anmeldung ist personengebunden, Konfidenz 1.0).

**Anzeige in DP2 (klein):** im Planungs-/E-Mail-Center eine Zeile „Club-App: n Wünsche übernommen (zuletzt …)“ und Probleme sichtbar.

---

## Teil 3 – Kleine Korrektur
`src/adapters/timeclock-supabase.js:12` nutzt als Fallback-Event `'WM-2026'`, überall sonst gilt `'KC-WM-2026'` (`src/ui/configuration.js:5`). Bitte vereinheitlichen (`K.eventConfig?.eventId || 'KC-WM-2026'`), sonst findet DP2 die Istzeiten des PC-Managers nicht.

---

## Tests / Definition of Done
- Unit-Tests (Stil der vorhandenen Tests):
  1. `days-publish-bridge`: Zeilen für alle 13 Tage, Kernzeit/Überschreibung aus `daySettings`, Bedarf je Block, leere Liste → Snapshot leer.
  2. `club-wish-inbox`: Ersetzen (alte `club_app`-Wünsche weg, direkt erfasste bleiben), Duplikat-Schutz, ungültiger Eintrag → übersprungen + Problem, Wunschphase zu → `abgelehnt`, `stale`-Antwort → keine Änderung, Fehler → Rollback ohne ack, Bereitschaft übernommen.
  3. Event-ID-Korrektur Istzeiten.
- Version/Build erhöhen (zentraler Versionsvertrag), CHANGELOG/Build-Notiz, DEV → RC → FINAL mit Handtest.
- **Handtest** (Hansi): Club-App → „Dienstwünsche“ → Testperson trägt ein → nach dem nächsten Auto-Sync-Takt in DP2 sichtbar, Club-App zeigt „✅ in DP2 übernommen“. Testeingang ohne Club-App (SQL, service_role):
  ```sql
  insert into kc_dp_wish_inbox (org_id, event_id, person_id, revision, entries, standby)
  values ('KC_WERNE','KC-WM-2026','KC-P-LOCAL-01',1,
   '[{"date":"2026-12-04","start":11,"end":17,"wishType":"available","wishZone":"V","scope":"time","comment":"Test"}]'::jsonb, '{}'::jsonb)
  on conflict (org_id,event_id,person_id,source) do update set revision=kc_dp_wish_inbox.revision+1, entries=excluded.entries, status='offen';
  ```
- Kein neuer Parallel-Core: vorhandene `K.mutations`, `K.persistAll`, `wish-contract`, `planSharing`, Provider-Muster verwenden.

## Bereits vorhanden (nicht ändern)
| Objekt | Zweck |
|---|---|
| `kc_dp_days_published` | veröffentlichte Tage (PK org_id+event_id+work_date), Lesen: DP2-Mitglieder, Manager-Admins, service_role |
| `kc_dp_days_publish(p_org_id, p_event_id, p_days)` | Snapshot schreiben, nur Planungsrollen |
| `kc_dp_wish_inbox` | Eingang je Person (unique org+event+person+source), nur service_role direkt |
| `kc_dp_wish_inbox_pending(p_org_id, p_event_id)` | offene Eingänge (jsonb-Array), nur Planungsrollen |
| `kc_dp_wish_inbox_ack(p_id, p_revision, p_status, p_result)` | bestätigen, nur wenn Revision aktuell (`stale` sonst) |
| `kc_core_data_contract` | `dienstplanung/KC_CLUBAPP` (lesen), `dienstwunsch_eingang/KC_CLUBAPP` (liefern), `dienstwunsch_eingang/KC_DP` (abholen/bestätigen) |
| Neon-Spiegel | beide Tabellen gespiegelt + gesichert |
