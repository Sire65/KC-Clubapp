// 2.830.0 Gesamtprüfung #44 – A Warteliste (KC-CLUB-WARTELISTE), B Teilnahme (KC-CLUB-TEILNAHME), E Datenbank klein halten (KC-DB-KLEIN-HALTEN), Impressum (KC-CLUB-IMPRESSUM).
// Aufruf: node tests/abe-impressum.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8"), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
const lies = (f) => fs.readFileSync("supabase/migrations/" + f, "utf8");
// A Warteliste
assert.ok(/array\['ja'::text, 'nein'::text, 'warte'::text\]/.test(lies("20261103_kc_club_tisch_warteliste.sql")), "Stand „warte“ erlaubt");
const z = server.slice(server.indexOf('case "tisch_zusage"'), server.indexOf('case "tisch_seminare_meine"'));
assert.ok(/if \(!sem\) throw new Fehler\("Eine Warteliste gibt es nur bei Seminaren/.test(z) && /Es ist gerade ein Platz frei – bitte gleich anmelden\./.test(z), "Warteliste nur, wenn wirklich voll");
assert.ok(/if \(sem && vorher\?\.zusage === "ja" && zusage !== "ja"\) await rtNachruecken\(x\)/.test(z), "Abmelden → Nachrücken");
const n = server.slice(server.indexOf("async function rtNachruecken"), server.indexOf("async function rtLage"));
assert.ok(/sort\(\(a: any, b: any\) => String\(a\.zusage_am\)\.localeCompare/.test(n) && /\.eq\("zusage", "warte"\)/.test(n) && /rtZusagePruefen\(x, "ja", ja, erster\.person_id/.test(n), "der Reihe nach, nie überbucht");
assert.ok(/🎉 Ein Platz ist frei/.test(n), "Nachrücker bekommt Bescheid");
assert.ok(/⏳ Auf die Warteliste/.test(app) && /Warteliste – du bist auf Platz/.test(app) && /↩️ Von der Warteliste genommen/.test(app), "Knöpfe und Hinweise");
// B Teilnahme
const t = server.slice(server.indexOf('case "teilnahme_jahr"'), server.indexOf('case "protokoll_einwand"'));
assert.ok(/if \(!ich\.vorstand && !ich\.admin\) throw/.test(t) && /\.eq\("status", "veroeffentlicht"\)/.test(t), "nur Clubleitung, nur veröffentlichte Protokolle");
assert.ok(/prTeilnahme\('\$\{esc\(j\)\}'\)/.test(app) && /teilnahme: \{ bauen: \(\) => \(\{ titel: `Teilnahme an den Sitzungen/.test(app), "Knopf im Jahr und Drucken im CD");
assert.ok(/const prVeroeffentlicht = \(p\) => !!p\.status && p\.status !== "entwurf";/.test(app) && !/p\.status === "veroeffentlicht"\)/.test(app.slice(app.indexOf("const prJahrKnopf"), app.indexOf("const prJahrKnopf") + 400)), "Jahres-Knöpfe erscheinen wieder (Fehler aus 2.802)");
// E Datenbank klein halten
const e = lies("20261103_kc_db_klein_halten.sql");
assert.ok(/end_time < now\(\) - interval '7 days'/.test(e) && /created_at < now\(\) - interval '35 days'/.test(e) && /cron\.schedule\('kc-db-klein-halten', '45 3 \* \* \*'/.test(e), "7 bzw. 35 Tage, nachts");
// Impressum
assert.ok(/onclick="entwicklerZeigen\(\)">👨‍🍳 Über den Entwickler<\/button> <button class="knopf klein" style="margin-top:8px" onclick="impressumZeigen\(\)">§ Impressum<\/button>/.test(html), "Knopf neben dem Entwickler");
const i = app.slice(app.indexOf("const IMPRESSUM = {"), app.indexOf("function impressumZeigen"));
// 2.831.0: Angaben von Hansi eingetragen; Kontakt bleibt offen (E-Mail kam unvollständig an), Register entfällt (kein e. V.)
assert.ok(/rechtsform: "Kein eingetragener Verein/.test(i) && /c\/o Klaus Zander/.test(i) && /vertreten: "Klaus Zander"/.test(i) && /verantwortlich: "Hans-Joachim Koch/.test(i), "Angaben von Hansi");
assert.ok(/kontakt: "E-Mail: zander-k@web\.de"/.test(i) && /E-Mail: ha-joko@web\.de/.test(i) && /register: false,/.test(i), "Kontakt (Klaus) und Entwickler-E-Mail, Register entfällt"); // 2.832.0
assert.ok(/I\.register === null && adm/.test(app), "entfallenes Register wird nicht als fehlend gemeldet");
assert.ok(/fehlt noch/.test(app) && /const I = IMPRESSUM, adm = !!ICH\?\.admin/.test(app), "Lücken nur für den Admin sichtbar");
console.log("abe-impressum: alle Prüfungen bestanden");
