// 3.5.0 KC-CLUB-ADMIN-VERBORGEN: nur der Admin sieht Mitglieder online, die ihre Online-Anzeige ausgeschaltet haben (🙈), alle anderen nicht.
// Aufruf: node tests/admin-verborgen.test.mjs   (ohne Netz)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

// Server: onlineJetzt filtert verborgene nur ohne mitVerborgenen
assert.ok(/async function onlineJetzt\(mitInkognito = false, mitVerborgenen = false\)/.test(srv));
assert.ok(/\(mitVerborgenen \|\| zeigen\.get\(id\) !== false\) && \(mitInkognito \|\| !inko\.has\(id\)\)/.test(srv), "Inkognito anderer Admins bleibt verborgen");
// beide Wege (Paket und alt) liefern „versteckt“ – ohne Inkognito und ohne „weg“
const verst = srv.match(/versteckt: new Set\(ids\.filter\(\(id\) => einst\.get\("online"\)\?\.get\(id\)\?\.zeigen === false && !inko\.has\(id\) && !istWeg\(/g) || [];
assert.equal(verst.length, 2, "Paket- und alter Weg");
// Aktion online: nur Admin bekommt die Versteckten, markiert, nicht anklopfbar
assert.ok(/const adminVersteckt = ich\.admin \? \[\.\.\.\(versteckt \?\? \[\]\)\]\.filter\(\(id\) => id !== ich\.person_id && !on\.has\(id\)\) : \[\];/.test(srv), "nur für den Admin");
assert.ok(/online: \[\.\.\.on, \.\.\.adminVersteckt\]\.map\(\(id\) => \(\{ \.\.\.wer\(id\), \.\.\.\(adminVersteckt\.includes\(id\) \? \{ verborgen: true \} : \{\}\), klopfbar: !adminVersteckt\.includes\(id\) && /.test(srv), "markiert, kein Anklopfen");
assert.ok(/zeigen \|\| ich\.admin \? onlineJetztMit\(/.test(srv), "Admin bekommt die Liste auch mit eigener Anzeige aus");
// Mitgliederliste
assert.ok(/on = ichZeige \|\| ich\.admin \? await onlineJetzt\(false, ich\.admin\)/.test(srv));
assert.ok(/verborgen: m\.person_id !== ich\.person_id && !ich\.admin && \(!ichZeige \|\| zeigen\.get\(m\.person_id\) === false\),/.test(srv), "für Mitglieder unverändert");
assert.ok(/\.\.\.\(ich\.admin && m\.person_id !== ich\.person_id && zeigen\.get\(m\.person_id\) === false \? \{ selbstVerborgen: true \} : \{\}\)/.test(srv), "🙈-Kennung nur für den Admin");
// Filter echt rechnen
{
  const ids = ["A", "B", "C", "D"], zeigen = new Map([["B", false], ["D", false]]), inko = new Set(["C"]), weg = new Set(["D"]);
  const f = (mitV) => ids.filter((id) => (mitV || zeigen.get(id) !== false) && !inko.has(id) && !weg.has(id));
  assert.deepEqual(f(false), ["A"], "Mitglied: nur sichtbare");
  assert.deepEqual(f(true), ["A", "B"], "Admin: auch B (Anzeige aus), nicht C (inkognito), nicht D (weg)");
}
// App: 🙈 auf Kachel und Karteikarte, nur Admin, Legende
assert.equal((app.match(/\$\{ICH\?\.admin && m\.selbstVerborgen \? '<span class="mg-verborgen"/g) || []).length, 2, "Kachel + Karteikarte");
assert.ok(/🙈 Online-Anzeige aus \(nur du siehst es\)/.test(app), "Legende");
// Ehrlicher Hinweis beim Schalter
assert.ok(/Aus Sicherheitsgründen sieht nur der Admin, wenn du online bist – und wann du in der App warst\./.test(html), "Mitglieder wissen Bescheid");
console.log("admin-verborgen: alle Prüfungen bestanden");
