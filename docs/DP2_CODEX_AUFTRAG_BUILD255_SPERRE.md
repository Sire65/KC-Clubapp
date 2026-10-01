# Auftrag an Codex: DP2 Build 255 – Club-App-Wunscheingang gegen zwei gleichzeitige DP2-PCs absichern

Stand: 01.10.2026 · Freigabe: Hansi („Claude macht die DB, Codex das Programm“) · Feature-ID **KC-DP-WUNSCH-SPERRE**
Repository: **Sire65/dp3**, Zweig `codex/club-app-interface`, Ausgang **Build 254 RC (`3945960`)** → neu **Build 255 RC**.
Die Datenbankseite ist **fertig und live** (Projekt `ptblnpiroqftcvlsrhac`, Migration
`kc-clubapp/supabase/migrations/20261001_kc_dp_wunsch_eingang_sperre.sql`, in der Probe-Transaktion mit 17 Fällen geprüft).
In DP2 ist **nur Client-Code** nötig – bitte keine eigenen Tabellen/RPCs anlegen.

## Problem (bisher)
`kc_dp_wish_inbox_ack` verhindert nur die doppelte **Quittierung**. Zwei Planer-PCs holen aber dieselben offenen Eingänge
(`kc_dp_wish_inbox_pending`) und tragen sie **beide lokal ein**, bevor einer quittiert. Der Verlierer merkt es erst danach.
Zusätzlich steht in `src/core/club-wish-inbox.js` (runNow) bewusst: „the RPC cannot distinguish ACK by this/another PC“ –
nach einem ACK-Timeout wird deshalb `complete()` angenommen. Beides lösen die neuen Funktionen.

## Neue / erweiterte RPCs (alle: angemeldet + `kc_dp_memberships.role ∈ admin|planner|duty_manager`, sonst Exception)

| RPC | Parameter | Antwort |
|---|---|---|
| `kc_dp_wish_inbox_claim` **neu** | `p_id uuid, p_revision int, p_device_id text, p_minutes int = 10` (1–30) | `{ok:true, claimToken, claimedUntil, revision, renewed}` · `{ok:false, reason:'claimed', stale:false, claimedUntil, claimedByMe}` · `{ok:false, reason:'stale'\|'not_open', stale:true, status, revision}` |
| `kc_dp_wish_inbox_ack_claimed` **neu** | `p_id, p_revision, p_status ('uebernommen'\|'abgelehnt'), p_result jsonb, p_claim_token uuid` | `{ok:true, stale:false, sharingApplied, shareWithColleagues}` · `{ok:false, stale:true, reason:'stale'\|'not_open'}` · `{ok:false, stale:false, reason:'claim_lost'}` |
| `kc_dp_wish_inbox_release` **neu** | `p_id uuid, p_claim_token uuid` | `{ok:true, released:boolean}` (nur mit passendem Token) |
| `kc_dp_wish_inbox_pending` erweitert | unverändert | jede Zeile zusätzlich `claimActive, claimedUntil, claimedByMe` |
| `kc_dp_wish_inbox_receipt` erweitert | unverändert | zusätzlich `claimActive, claimedUntil, claimedByMe, takenClaim` |
| `kc_dp_wish_inbox_ack` (Build ≤ 254) | unverändert | wie bisher; **nur** bei aktiver fremder Reservierung `{ok:false, stale:false, claimed:true, reason:'claimed'}` |

Regeln der Datenbank:
- Reservierung gilt nur für **diese Revision**. Speichert das Mitglied in der Club-App neu (revision + 1), ist sie wirkungslos.
- **Gleicher Benutzer + gleiches Gerät** (`p_device_id`) ruft `claim` erneut auf → verlängert, **gleicher** `claimToken` (`renewed:true`).
  Gleicher Benutzer an einem **anderen** PC → `reason:'claimed'` (`claimedByMe:true`).
- Abgelaufene Reservierung: jeder Planer-PC darf neu reservieren. Solange niemand neu reserviert hat, akzeptiert
  `ack_claimed` das alte Token noch (Absturz/Neustart wird so sauber zu Ende gebracht).
- `ack_claimed` speichert das Token als `takenClaim` → `receipt.takenClaim === meinToken` beweist **eindeutig**, dass
  **meine** Quittierung durchging (auch bei zwei PCs mit demselben Konto).
- Kollegenfreigabe wie bisher (KC-DP-WUNSCH-FREIGABE): nur bei `uebernommen` und `shareWithColleagues != null`,
  Kopieren wird **nie** erweitert. DP2 setzt sie **nicht** selbst, sondern zeigt `sharingApplied/shareWithColleagues` an.

## Umsetzung in DP2

### 1. Provider (`src/adapters/supabase-provider.js`, neben `wishInboxAck`)
```js
async function wishInboxClaim({id,revision,deviceId,minutes=10}){ /* rpc kc_dp_wish_inbox_claim {p_id,p_revision,p_device_id,p_minutes} */ }
async function wishInboxAckClaimed({id,revision,status,result,claimToken}){ /* rpc kc_dp_wish_inbox_ack_claimed {…, p_claim_token} */ }
async function wishInboxRelease({id,claimToken}){ /* rpc kc_dp_wish_inbox_release */ }
async function wishInboxReceipt({id}){ /* rpc kc_dp_wish_inbox_receipt {p_id} */ }
```
Im Rückgabeobjekt exportieren wie die vorhandenen. Status-Prüfung wie in `wishInboxAck` (`uebernommen|abgelehnt`).

### 2. Geräte-Kennung
Vorhandene, dauerhaft gespeicherte Kennung aus `src/core/multidevice-test.js` (`identity()` → `deviceId`) verwenden –
**nicht** neu erfinden. Ist keine Kennung ermittelbar → **nicht importieren** (Status „Gerätekennung fehlt“), nicht raten.

### 3. Ablauf in `src/core/club-wish-inbox.js` → `importOne`
Reihenfolge **neu** (nur der Kern, alle bisherigen Prüfungen/Review/Konfliktwahl bleiben unverändert):
1. Prüfungen + Review wie bisher (Review-Dialog **ohne** Reservierung – der Planer darf sich Zeit lassen).
2. **Direkt vor** `store().receipts[input.id]=receipt` / `stageLocalBatch`:
   `claim = await wishInboxClaim({id, revision, deviceId})`
   - `reason:'claimed'` → **nichts eintragen**, Status „Wird gerade an einem anderen PC übernommen (bis HH:MM)“, nächster Takt.
   - `stale:true` → `{stale:true}` zurück (wie heute), nichts eintragen.
   - `ok:true` → `receipt.claimToken = claim.claimToken` **mit** in den dauerhaften Beleg (`store().receipts`) schreiben.
3. Lokal eintragen + `K.persistAll()` wie bisher.
4. `acknowledge`: statt `wishInboxAck` → `wishInboxAckClaimed({…, claimToken: receipt.claimToken})`.
   Optional vorher `claim` erneut aufrufen (gleiches Gerät = Verlängerung), falls `claimedUntil` < 2 Min. entfernt ist.
   - `ok:true` → `complete(receipt)`; Anzeige der Kollegenfreigabe aus `sharingApplied/shareWithColleagues`.
   - `stale:true` → `rollback(receipt)` (wie heute).
   - `reason:'claim_lost'` → `rollback(receipt)`, Hinweis „Ein anderer PC hat diesen Eingang übernommen“.
   - Netzwerkfehler → `awaiting_ack` bleibt (wie heute), siehe 5.
5. **Fehler vor dem ACK** (Exception in Schritt 3, `rollback` aus eigenem Grund): `wishInboxRelease({id, claimToken})` –
   Fehler dabei schlucken (die Reservierung läuft ohnehin ab).
6. `reject()` (Person unbekannt / Wunschphase zu): ebenfalls `claim` → `ack_claimed(…,'abgelehnt')`; bei `claimed` nichts tun.

### 4. Wiederaufnahme in `runNow` (ersetzt die Annahme „fehlt = von mir quittiert“)
Für jeden Beleg mit `phase==='awaiting_ack'`:
```
r = await wishInboxReceipt({id})
r.found === false                                   → rollback (Eingang gelöscht)
r.status !== 'offen' && r.takenClaim === receipt.claimToken && r.takenRevision === receipt.revision
                                                    → complete (meine Quittierung ging durch)
r.status !== 'offen' (sonst)                        → rollback (anderer PC / andere Revision)
r.status === 'offen' && r.revision !== receipt.revision → rollback (Mitglied hat neu gespeichert)
r.status === 'offen' && gleiche Revision            → acknowledge(receipt) erneut (ack_claimed entscheidet: ok | claim_lost)
```
Belege **ohne** `claimToken` (noch aus Build 254) → einmalig wie bisher behandeln und danach nur noch über den neuen Weg.

### 5. Anzeige (klein, im vorhandenen E-Mail-/Planungscenter-Status `refreshClubStatus`)
- „In Übernahme an anderem PC (bis HH:MM)“ aus `pending[].claimActive && !claimedByMe`.
- Ergebnis `claim_lost` / `claimed` sichtbar, nie als „OK“ (Developer Contract Regel 11).

## Tests / Definition of Done (Build 255 RC)
Unit-/Smoke-Tests im Stil von `tools/smoke-club-interface.mjs` mit gemocktem Provider:
1. Zwei simulierte PCs (A, B), gleicher Eingang: A `claim` ok, B `claimed` → B trägt **nichts** ein; A quittiert → `complete`.
2. Gleiches Konto, zwei Geräte → B bekommt `claimed` (`claimedByMe:true`), trägt nichts ein.
3. A reserviert, stürzt ab (Beleg `awaiting_ack` + Token gespeichert), Neustart → `receipt` offen, gleiche Revision → `ack_claimed` ok → `complete`, **kein** zweites Eintragen.
4. A abgelaufen, B reserviert neu und quittiert → A beim Neustart: `receipt.takenClaim ≠ A.token` → `rollback`.
5. Mitglied speichert neu während A importiert → `ack_claimed` `stale` → `rollback`; nächster Takt holt neue Revision.
6. ACK-Antwort verloren (Netzwerk), danach `receipt.takenClaim === token` → `complete` (nicht doppelt).
7. Fehler beim lokalen Eintragen → `rollback` + `release` aufgerufen, kein ACK.
8. `reject()` mit Reservierung (`abgelehnt`), bei `claimed` keine Ablehnung.
9. Kollegenfreigabe nur angezeigt, nicht lokal gesetzt; Kopieren nie erweitert.
- Vorhandene Tests (`npm test`, smoke-club-interface, test-wish-print) bleiben grün.
- Version/Build **255** nach zentralem Versionsvertrag (release-version.json, package/package-lock, `KC_DP_BUILD`, `?v=`-Parameter,
  RELEASE.txt, docs/BUILD-255-…md, `node tools/generate-release-manifest.mjs`).
- Stage **RC**. Danach: Wiederherstellungsprüfung, Live-Handtest mit zwei echten PCs, erst dann FINAL.

## Übergang / Wichtig
- **Alle Planer-PCs müssen auf Build 255**, bevor parallel importiert wird. Ein Build-254-PC wird von einer aktiven Reservierung
  zwar am Quittieren gehindert (`claimed`), hat dann aber schon lokal eingetragen und behält den Stapel – das ist genau die
  alte Lücke, nur sichtbar statt still.
- Kein Direktzugriff auf die Tabelle; `kc_dp_wish_inbox_sharing_apply` ist intern (nicht aufrufbar).
- Name „Willfried“ unverändert lassen. Keine Mitgliederdaten ändern.
- Nach Build 255: Claude übernimmt den Commit in die Club-App (`node tools/dp2-twinkey-uebernehmen.mjs`), neue Club-Version,
  Vertragstests 142/146/149/151 erweitern.

## Rückweg Datenbank
Funktionen `kc_dp_wish_inbox_ack/_pending/_receipt` aus `20260930_kc_dp_wunsch_eingang_freigabe.sql` bzw.
`20260929_kc_dp_wunsch_eingang_v1.sql` erneut einspielen, neue Funktionen droppen; Spalten dürfen bleiben (nur additiv).
