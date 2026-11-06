// KC-CLUB-TURN-FRISCH + KC-CLUB-PUSH-AUFRAEUMEN (06.11.2026). Aufruf: node tests/turn-frisch.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { turnPlan, TURN } from "../supabase/functions/kc-club/turn-vorrat.js";
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const w = server.slice(server.indexOf("const stuendlich = new Date().getUTCMinutes() < 15"), server.indexOf("// Abstimmungen mit abgelaufener Frist beenden"));
assert.ok(w.includes("if (stuendlich) await turnZugang().catch(() => null);"), "Wartung hält den Umleitungs-Vorrat stündlich frisch");
assert.ok(w.includes('from("kc_member_push_messages").delete().lt("created_at", new Date(Date.now() - 180 * 86400000)'), "Push-Meldungen nach 180 Tagen weg");
// Vorrat leer/abgelaufen → neu anlegen; frischer Vorrat → nichts anlegen (keine Flut bei Metered)
const t = Date.parse("2026-11-06T08:00:00Z");
assert.equal(turnPlan([], t).neu, true, "leer → neu");
const frisch = [{ username: "u", password: "p", gueltig_bis: new Date(t + 6 * 86400000).toISOString(), nutzbar_ab: new Date(t - 60000).toISOString(), erstellt_am: new Date(t - 86400000).toISOString() }];
assert.equal(turnPlan(frisch, t).neu, false, "frisch → nichts");
assert.ok(turnPlan(frisch, t).nutzbar, "frisch → nutzbar");
// stündlich prüfen reicht: Erneuerung ab 2 Tagen Restlaufzeit, neuer gilt nach 3 Min.
assert.ok(TURN.erneuernMs > 3600000 * 2 && TURN.wartenMs < 3600000);
// KC-CLUB-WAECHTER-TURN: Wächter „📞 Telefon-Umleitung“ (Server bewertet, App beschreibt); nie Schlüssel/Passwort in der Lage
assert.ok(server.includes('{ id: "turn", sym: "📞", name: "Telefon-Umleitung (Metered)", app: (d) => turnBefund(d.turn) }'));
assert.ok(server.includes("turn: await turnLage().catch(() => null)"));
const lage = server.slice(server.indexOf("async function turnLage()"), server.indexOf("function turnBefund("));
assert.ok(!/password|username/.test(lage.replace(/select\("gueltig_bis,nutzbar_ab"\)/, "")), "Lage ohne Zugangsdaten");
assert.ok(lage.includes("t - TURN_VERBRAUCH.t > 6 * 3600000"), "Metered höchstens alle 6 Std. fragen");
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.ok(app.includes('{ id: "turn", gruppe: "betrieb", sym: "📞", name: "Telefon-Umleitung (Metered)"'));
// KC-CLUB-SPUR-ALLE-DA: Admin sieht in „Gerade in der App“ auch Verborgene (🙈), Quelle Zugangstabelle 3 Min.; Mitglieder werden im Schalter informiert
const sp = server.slice(server.indexOf('case "spur_liste"'), server.indexOf('case "spur_liste"') + 9000);
assert.ok(sp.includes("nurAdmin(ich);") && sp.includes('gt("zuletzt_gesehen", new Date(Date.now() - 180000)') && sp.includes("return json({ tag, jetztDa, personen:"));
assert.ok(app.includes("const da = new Map((r.jetztDa || []).map((x) => [x.person_id, x]));") && app.includes("🙈 Online-Anzeige aus"));
assert.ok(fs.readFileSync(new URL("../index.html", import.meta.url), "utf8").includes("Für Hilfe und Sicherheit sieht der Admin weiterhin, wann du in der App warst."), "Transparenz im Schalter");
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/turn-frisch.test.mjs"), "läuft in der CI");
console.log("turn-frisch: ok");
