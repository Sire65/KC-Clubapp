// KC-CLUB-ADVENT-GADGETS (Wunsch Hansi 22.11.2026): 4 Einzelstücke im Adventskalender, verlost unter allen, die das Türchen am Tag öffnen und bis 22 Uhr
// (Server-Uhr, deutsche Zeit) mitmachen. Auslosung „faul“ beim ersten Abruf nach 22 Uhr, einmal je Tag, niemand gewinnt zweimal, keine Gäste.
// Aufruf: node tests/advent-gadgets.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const js = programmText(), srv = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261122_kc_club_advent_gadgets.sql");

// App und Server kennen dieselben Gadgets (Tag → Name); Fotos vorhanden und klein
const block = js.slice(js.indexOf("const AK_NASCH = ["), js.indexOf("const AK_REIHE"));
const { AK_GADGETS, AK_TUERCHEN } = new Function(block + "; return { AK_GADGETS, AK_TUERCHEN };")();
const srvG = Function("return " + srv.match(/const ADVENT_GADGETS: Record<number, string> = (\{[^}]*\});/)[1])();
const srvAkk = Function("return " + srv.match(/const ADVENT_GADGET_AKK: Record<number, string> = (\{[^}]*\});/)[1])();
assert.deepEqual(Object.fromEntries(Object.entries(AK_GADGETS).map(([t, G]) => [t, G.name])), Object.fromEntries(Object.entries(srvG).map(([t, n]) => [t, n])), "Gadget-Liste in App und Server gleich");
assert.deepEqual(Object.keys(srvG).map(Number), [3, 10, 13, 17], "3., 10., 13. und 17. Dezember");
assert.deepEqual(Object.keys(srvAkk), Object.keys(srvG), "Artikel für jedes Gadget");
for (const [t, G] of Object.entries(AK_GADGETS)) {
  const f = new URL("../" + G.foto, import.meta.url);
  assert.ok(fs.existsSync(f) && fs.statSync(f).size < 150_000, "Foto vorhanden und klein: " + G.foto);
  assert.ok(AK_TUERCHEN[t - 1], "Türchen " + t + " gibt es");
}

// Server-Logik ausführen (reine Funktionen aus index.ts)
const stueck = (name) => { const i = srv.indexOf("const " + name + " = "); return srv.slice(i, srv.indexOf(";\n", i) + 2); };
const ts = (s) => stripTypeScriptTypes(s);
const { adventGadgetPhase, adventGadgetWahl } = new Function(ts(srv.slice(srv.indexOf("const ADVENT_GADGET_SCHLUSS"), srv.indexOf("const zufallIndex"))) + "return { adventGadgetPhase, adventGadgetWahl };")();
// Zeitgrenze 22 Uhr (deutsche Zeit) am Tag selbst
assert.equal(adventGadgetPhase("2026-12-02", 23, 2026, 3), "vorher");
assert.equal(adventGadgetPhase("2026-11-22", 11, 2026, 3), "vorher", "vor Dezember: noch nicht");
assert.equal(adventGadgetPhase("2026-12-03", 0, 2026, 3), "offen");
assert.equal(adventGadgetPhase("2026-12-03", 21, 2026, 3), "offen", "21:59 noch offen");
assert.equal(adventGadgetPhase("2026-12-03", 22, 2026, 3), "vorbei", "ab 22 Uhr vorbei");
assert.equal(adventGadgetPhase("2026-12-04", 9, 2026, 3), "vorbei", "nachgeholt: vorbei");
assert.equal(adventGadgetPhase("2026-12-10", 12, 2026, 10), "offen", "zweistelliger Tag");
// Gewinner: nur Teilnehmer, schon Gewonnene ausgeschlossen, keine Teilnehmer → null
assert.equal(adventGadgetWahl([], new Set(), () => 0), null, "keine Teilnehmer → nicht vergeben");
assert.equal(adventGadgetWahl(["A"], new Set(["A"]), () => 0), null, "nur Gewinner übrig → nicht vergeben");
assert.equal(adventGadgetWahl(["A", "B"], new Set(["A"]), () => 0), "B", "ein Gewinn je Person");
for (let i = 0; i < 3; i++) assert.equal(adventGadgetWahl(["C", "A", "B", "A"], new Set(), () => i), ["A", "B", "C"][i], "Zufall wählt unter allen (ohne Doppelte)");
assert.ok(/crypto\.getRandomValues\(a\)/.test(stueck("zufallIndex")) && /while \(a\[0\] >= grenze\)/.test(stueck("zufallIndex")), "Zufall vom Server, gleich verteilt");

// Ablauf im Server: Zug idempotent (unique jahr,tag + Konflikt 23505 = schon gezogen), faul ohne Zeitplan, in Tag-Reihenfolge, Startnachricht von Hansi
const zieh = srv.slice(srv.indexOf("async function adventGadgetsZiehen"), srv.indexOf("\n}\n", srv.indexOf("async function adventGadgetsZiehen")));
assert.ok(/\.sort\(\(x, y\) => x - y\)/.test(zieh) && /=== "vorbei"/.test(zieh), "fällige Tage der Reihe nach");
assert.ok(/kc_club_advent_gadget_gewinn"\)\.insert\(/.test(zieh) && /error\.code !== "23505"/.test(zieh) && /if \(da\.some\(\(x: any\) => x\.tag === tag\)\) continue;/.test(zieh), "nur einmal je Tag gezogen");
assert.ok(/adventGadgetGlueckwunsch\(wahl, tag\)/.test(zieh), "Gewinner bekommt Startnachricht");
assert.ok(/von: "KC-P-002", vonName: "Hans-Joachim Koch"/.test(srv) && /schluessel: SN_SCHLUESSEL/.test(srv.slice(srv.indexOf("async function adventGadgetGlueckwunsch"))), "Startnachricht von Hansi");
assert.match(srv.match(/const adventGadgetText = [^\n]*/)[0], /🎉 Glückwunsch! Du hast im Adventskalender \$\{ADVENT_GADGET_AKK\[tag\]\} \$\{ADVENT_GADGETS\[tag\]\} gewonnen\. Ausgegeben wird beim Weihnachtsessen im Januar\./);
assert.ok(!/cron|schedule/i.test(zieh), "kein Zeitplan");
const fall = srv.slice(srv.indexOf('case "advent_gadget_stand"'), srv.indexOf('case "rezept_bewerten"'));
assert.ok(/if \(ich\.zugang !== "mitglied" && ich\.zugang !== "aushilfe"\) throw/.test(fall), "keine Gäste");
assert.ok(/if \(phase === "vorbei" \|\| zeile\) throw new Fehler\("Die Verlosung ist vorbei\.", 409\)/.test(fall) && /phase === "vorher"/.test(fall), "nur am Tag bis 22 Uhr");
assert.ok(/if \(schonGewonnen\) throw new Fehler\("Du hast schon gewonnen 🎉/.test(fall), "ein Gewinn je Person");
assert.ok(/onConflict: "jahr,tag,person_id", ignoreDuplicates: true/.test(fall) && /await adventGadgetsZiehen\(jahr, tag\)/.test(fall), "einmal mitmachen; Zug beim Abruf");
assert.ok(/await adventGadgetsZiehen\(j, 24\)/.test(srv) && /gadgets \}\);/.test(srv), "Hansis Liste mit Gadgets");
for (const a of ["advent_gadget_stand", "advent_gadget_mitmachen"]) assert.ok(srv.includes(`"${a}"]`) || srv.includes(`"${a}", `), "Rechte-Liste: " + a);
const basis = srv.slice(srv.indexOf("basis: ["), srv.indexOf("aushilfe: ["));
assert.ok(!/advent_gadget/.test(basis), "nicht in der Gäste-Liste");

// Datenbank: zwei Tabellen, geschützt, eindeutig je Tag und je Gewinner
assert.ok(/primary key \(jahr, tag, person_id\)/.test(mig) && /primary key \(jahr, tag\)/.test(mig), "Schlüssel");
assert.ok(/create unique index if not exists kc_club_advent_gadget_gewinn_einmal on public\.kc_club_advent_gadget_gewinn \(jahr, person_id\) where person_id is not null/.test(mig), "niemand gewinnt zweimal");
for (const t of ["kc_club_advent_gadget_teilnahme", "kc_club_advent_gadget_gewinn"]) {
  assert.ok(mig.includes(`alter table public.${t} enable row level security`) && mig.includes(`revoke all on public.${t} from public, anon, authenticated`) && mig.includes(`grant select, insert, update, delete on public.${t} to service_role`), "Rechte: " + t);
  assert.ok(new RegExp(`kc_neon_resume_tables[^;]*'${t}'`).test(mig) && new RegExp(`'${t}', 'Club-App', 'normal', false, true, true`).test(mig), "gespiegelt und gesichert: " + t);
}

// App: Block zusätzlich zum Türchen, Foto lazy, Knopf, Vorschau-Hinweis, Ergebnis, Liste
assert.ok(/if \(AK_GADGETS\[n\]\) \{ \$\("akInhalt"\)\.insertAdjacentHTML\("beforeend", akGadgetBlock\(n\)\); akGadgetLaden\(n\); \}/.test(js), "zusätzlich, nicht statt");
assert.ok(/🎁 Heute zu gewinnen: \$\{esc\(G\.name\)\}/.test(js) && /class="ak-gadget-foto"[^>]*loading="lazy"/.test(js), "Überschrift und Foto lazy");
assert.ok(/🎲 Ich mache mit/.test(js) && /api\("advent_gadget_mitmachen", \{ tag: n \}/.test(js) && /api\("advent_gadget_stand", \{ tag: n \}\)/.test(js), "Mitmachen über den Server");
assert.ok(/🎲 Im Dezember kannst du hier mitmachen\./.test(js) && /if \(!akHeute\(\)\) return;/.test(js), "Vorschau vor Dezember ohne Abfrage");
assert.ok(/🎉 Gewonnen hat: \$\{esc\(r\.gewinnerVorname\)\}/.test(js) && /Die Verlosung ist vorbei/.test(js) && /Du hast schon gewonnen 🎉/.test(js), "Ergebnis und Hinweise");
assert.ok(/🎁 Gadgets \(verlost\)/.test(js) && /r\.gadgets/.test(js), "Hansis Liste mit Gadgets");
console.log("advent-gadgets: alle Prüfungen bestanden");
