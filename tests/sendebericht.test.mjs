// KC-CLUB-SENDEBERICHT (19.11.2026, Wunsch Hansi „genaue, wahrheitsgemäße Übersicht – sozusagen einen detaillierten Sendebericht“):
// statische Prüfung + echte Funktionen in der Sandbox (offline). Aufruf: node tests/sendebericht.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
const stueck = (q, von, bis) => { const i = q.indexOf(von); assert.ok(i >= 0, `fehlt: ${von}`); const j = q.indexOf(bis, i + von.length); assert.ok(j > i, `Ende fehlt: ${bis}`); return q.slice(i, j); };

// --- Server: Zustellung je Person mischen (TS-Typen weg, dann ausführen)
const mischen = stueck(server, "function zustellungMischen(", "\n}\n") + "\n}";
const rang = server.match(/const WEG_RANG: Record<string, number> = (\{[^\n]+\});/)[1];
const zusammen = stueck(server, "function sendeZusammen(", "\n}\n") + "\n}";
const js = (t) => t.replace(/\(z: Zustellung, ids: string\[\], key: string, r: any\)/, "(z, ids, key, r)").replace(/ as const/g, "")
  .replace(/\(b: Record<string, \{ push: string; mail: string; ruhe\?: boolean \}>\)/, "(b)");
const S = new Function(`const WEG_RANG = ${rang};\n${js(mischen)}\n${js(zusammen)}\nreturn { zustellungMischen, sendeZusammen };`)();
const z = {};
S.zustellungMischen(z, ["a"], "club_treffen_beide", { gesendet: 1, fehler: 1, wege: { a: { push: "kein", mail: "ja" } } });
S.zustellungMischen(z, ["b"], "club_treffen_beide", { gesendet: 2, fehler: 0, wege: { b: { push: "ja", mail: "ja" } } });
S.zustellungMischen(z, ["c"], "club_treffen_beide", { gesendet: 0, fehler: 1 }); // Versanddienst nicht erreichbar → echter Fehler
S.zustellungMischen(z, ["d"], "club_treffen_beide", { gesendet: 0, fehler: 0 }); // gesperrt/„keine Benachrichtigungen“ → aus
S.zustellungMischen(z, ["e"], "club_treffen_mail", { gesendet: 1, fehler: 0, wege: { e: { push: "-", mail: "ja" } } });
S.zustellungMischen(z, ["e"], "club_treffen_push", { gesendet: 0, fehler: 1, wege: { e: { push: "kein", mail: "-" } } }); // zweiter Aufruf mischt, „ja“ bleibt
assert.deepEqual(z, { a: { push: "kein", mail: "ja" }, b: { push: "ja", mail: "ja" }, c: { push: "fehler", mail: "fehler" }, d: { push: "aus", mail: "aus" }, e: { push: "kein", mail: "ja" } });
const zs = S.sendeZusammen(z);
assert.equal(zs.echteFehler, 2, "„kein Push-Gerät“ ist KEIN Fehler – nur versucht und gescheitert");
assert.equal(zs.nichtErreicht, 2, "nicht erreicht = ohne einen einzigen „ja“-Weg");
assert.deepEqual([zs.pushJa, zs.mailJa, zs.keinPush, zs.keineMail, zs.personen], [1, 3, 2, 0, 5]);

// --- Server: sendenGewaehlt/senden liefern zusätzlich zustellung + ruhig, „wege“ bleibt die gewählte Liste (Aufrufer unverändert)
const sg = stueck(server, "async function sendenGewaehlt(", "\nconst zustellwege");
assert.ok(/return \{ gesendet, fehler, wege: w, zustellung, ruhig \};/.test(sg), "sendenGewaehlt: wege bleibt, dazu zustellung/ruhig");
assert.ok(/ruhig\.push\(\.\.\.still\)/.test(sg) && /korrelation \+ ":ruhe"\)\)/.test(sg), "Ruhezeit wird mitgeschrieben");
assert.ok(/zustellung\[id\]\.push === "-"\) zustellung\[id\]\.push = "kein"/.test(sg), "ohne App und ohne Push-Abo: kein Gerät");
const se = stueck(server, "async function senden(", "\n// KC-CLUB-ZUSTELLWAHL");
assert.ok(/return \{ gesendet, fehler, ruhezeit: verpasst\.length, zustellung, ruhig:/.test(se), "senden: ruhezeit bleibt Zahl, dazu zustellung/ruhig");
assert.ok(/return \{ korr, versand \};/.test(server), "Gastgeber-Sonderweg liefert Kennung und Ergebnis (wahr wie bisher)");

// --- Server: Einladung protokolliert den Bericht, versand.fehler = nur echte Fehler
const ei = stueck(server, 'case "buero_einladung"', 'case "sendebericht"');
assert.ok(/versand: \{ gesendet: zusammen\.pushJa \+ zusammen\.mailJa, fehler: zusammen\.echteFehler, bericht, zusammen \}/.test(ei), "Protokoll: Bericht + Zusammenfassung");
assert.ok(/gast_korr: \(gast as any\)\.korr/.test(ei) && /eintragen\(t\.gastgeber_person_id, \(gast as any\)\.versand, true\)/.test(ei), "Gastgeber im Bericht");
assert.ok(/korr \}\); \/\/ KC-CLUB-SENDEBERICHT/.test(ei), "Antwort an die App enthält die Kennung");

// --- Server: Aktion sendebericht – Rechte, keine Inhalte/Adressen
const sb = stueck(server, 'case "sendebericht"', 'case "buero_nachher"');
assert.ok(/if \(!ich\.admin && !ich\.vorstand\) nurBueroLesen\(ich\);/.test(sb), "nur Büro, Admin, Clubleitung");
assert.ok(/if \(!ich\.admin && !ich\.vorstand && e\.person_id !== ich\.person_id\) throw new Fehler/.test(sb), "sonst nur, wer versendet hat");
assert.ok(/SENDEBERICHT_KORR\.test\(korr\)/.test(sb), "Kennung geprüft");
assert.ok(!/\bemail\b|text|betreff|kurz/.test(sb.replace(/\/\/[^\n]*/g, "").replace(/"[^"\n]*"/g, "\"\"")), "keine Inhalte, keine Mail-Adressen");
const st = stueck(server, "async function sendeStand(", "\n}\n");
assert.ok(/select\("id,correlation_id,channel,status"\)\.like\("correlation_id", korr \+ ":%"\)/.test(st) && /\["displayed", "opened"\]/.test(st), "Zustellstand aus Aufträgen + Ereignissen");
assert.ok(SENDEBERICHT_OK(), "Kennung-Muster");
function SENDEBERICHT_OK() {
  const re = new RegExp(server.match(/const SENDEBERICHT_KORR = \/(.+)\/;/)[1]);
  return re.test("club-buero-einladung:3f2a9c1e-1111-4222-8333-123456789abc:1763550000000") && !re.test("club-nachricht:x:1") && !re.test("club-buero-einladung:%:1763550000000");
}

// --- App: Knopf nach dem Senden, Kachel im Büro, Fenster mit Namen
const bs = stueck(app, "async function buSenden(knopf)", "function buEingang()");
assert.ok(/\["📊 Sendebericht", `buSendebericht\(\{ korr: '\$\{kr\}' \}\)`\]/.test(bs), "📊 Sendebericht nach dem Senden");
assert.ok(!/Fehler/.test(stueck(bs, "const raus =", "\n")), "Erfolgsmeldung nennt keine „Fehler“ für Mitglieder ohne Push-Gerät");
assert.ok(/k\("sendebericht", "📊", "Sendebericht der letzten Einladung"/.test(app), "Kachel im Büro");
assert.ok(/sendeBerichtBlatt: "📊 Sendebericht"/.test(app), "Fenstername eingetragen");
assert.ok(/api\("sendebericht", wer\)/.test(app) && /↻ Aktualisieren/.test(stueck(app, "async function buSendebericht(", "function buEingang()")), "Bericht mit ↻ Aktualisieren");

// --- App: Kopfzeile und Zellen wahrheitsgemäß (echte Funktionen)
const A = new Function(`${stueck(app, "const SB_PUSH =", "async function buSendebericht(")}\nreturn { sbPushText, sbMailText, sbKopfzeile };`)();
const kopf = A.sbKopfzeile({ zusammen: { personen: 12, nichtErreicht: 0, pushJa: 6, pushAngezeigt: 4, pushGeoeffnet: 1, mailJa: 10, keinPush: 4, echteFehler: 0, spaeterFehler: 0 } });
assert.equal(kopf, "12 von 12 erreicht · 6 per Push (4 angezeigt, 1 geöffnet) · 10 per E-Mail · 4 ohne Push-Gerät → per E-Mail · 0 Fehler");
assert.deepEqual(A.sbPushText({ push: "kein" }), ["📵 kein Gerät", false]);
assert.deepEqual(A.sbPushText({ push: "fehler" }), ["❌ Fehler", true]);
assert.deepEqual(A.sbPushText({ push: "ja", stand: { push: "geoeffnet" } }), ["👆 geöffnet", false]);
assert.deepEqual(A.sbPushText({ push: "-", ruhe: true }), ["🌙 Ruhezeit", false]);
assert.deepEqual(A.sbMailText({ mail: "kein" }), ["📭 keine Adresse", false]);
assert.deepEqual(A.sbMailText({ mail: "ja", stand: { mail: "gesendet" } }), ["✅ gesendet", false]);
// Server sortiert „nicht erreicht“ nach oben, dann echte Fehler
assert.ok(/\.sort\(\(x, y\) => Number\(x\.erreicht\) - Number\(y\.erreicht\) \|\| Number\(y\.fehler\) - Number\(x\.fehler\)/.test(sb), "nicht erreicht ganz oben");
console.log("sendebericht: ok");
