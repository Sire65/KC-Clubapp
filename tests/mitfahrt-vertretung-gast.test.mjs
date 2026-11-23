// KC-CLUB-MITFAHRT-VERTRETUNG + KC-CLUB-MITFAHRT-GAST (Wunsch Hansi 23.11.2026)
// Vertretung darf Mitfahrt-Platz buchen/freigeben und Mitfahrt suchen (nicht anbieten/löschen); „＋ Gast mitnehmen“ belegt einen Platz.
// Aufruf: node tests/mitfahrt-vertretung-gast.test.mjs   (ohne Netz, nur Beispieldaten)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mig = readFileSync(new URL("../supabase/migrations/20261123_kc_club_mitfahrt_gast.sql", import.meta.url), "utf8");
const fall = (name) => { const i = srv.indexOf(`case "${name}": {`); assert.ok(i > 0, `case ${name}`); return srv.slice(i, srv.indexOf("\n      case ", i + 20)); };

// 1. Vertretung: Listen gleich, Mitfahrt-Platz und -Suche erlaubt, anbieten/löschen/Gast nicht
{
  const liste = (q, name) => q.match(new RegExp("const " + name + " = new Set\\(\\[([^\\]]+)\\]\\)"))[1];
  const s = liste(srv, "VERTRETUNG_AKTIONEN"), a = liste(app, "VT_AKTIONEN");
  assert.equal(s, a, "App und Server kennen dieselben Vertretungs-Aktionen");
  const set = new Set(JSON.parse("[" + s + "]"));
  assert.ok(set.has("mitfahrt_platz") && set.has("mitfahrt_suchen"), "Platz buchen/freigeben und suchen in Vertretung");
  for (const x of ["mitfahrt_anbieten", "mitfahrt_loeschen", "mitfahrt_gast"]) assert.ok(!set.has(x), `${x} nie in Vertretung (Fahrer bleibt man selbst)`);
  assert.ok(set.has("treffen_liste"), "Mitfahrten kommen mit treffen_liste (als das vertretene Mitglied)");
  const v = srv.slice(srv.indexOf("async function vertretungIch("), srv.indexOf("async function vertretungIch(") + 400);
  assert.ok(/if \(!VERTRETUNG_AKTIONEN\.has\(a\)\) throw/.test(v), "andere Aktionen werden in Vertretung abgewiesen");
}
// 2. Fahrer-Nachricht nennt beide, Mail an das vertretene Mitglied
{
  const p = fall("mitfahrt_platz");
  assert.ok(/vt \? `\$\{vt\.name\} hat für \$\{ich\.name\} einen Platz gebucht`/.test(p), "„Karla hat für Ruth einen Platz gebucht“");
  assert.ok(/`\$\{vt\.name\} hat den Platz für \$\{ich\.name\} wieder freigegeben`/.test(p), "Freigabe nennt beide");
  const m = srv.slice(srv.indexOf("async function vertretungMelden("), srv.indexOf("async function vertretungMelden(") + 6000);
  assert.ok(/\} else if \(a === "mitfahrt_platz"\) \{/.test(m) && /`einen Platz bei \$\{fahrer\} gebucht – „\$\{titel\}“`/.test(m), "Mail: „Karla hat für dich einen Platz bei Hansi gebucht“");
  assert.ok(/\} else if \(a === "mitfahrt_suchen"\) \{/.test(m), "Mail auch bei Mitfahrt-Suche");
  assert.ok(/kurz: `\$\{von\.vorname\} hat \$\{mf \? "für dich " : ""\}\$\{was\}\.`/.test(m), "Kurztext mit „für dich“");
  // Beispiel: Kurztext zusammensetzen
  const von = { vorname: "Karla" }, was = "einen Platz bei Hansi gebucht – „Köcheclub-Sitzung“", mf = true;
  assert.equal(`${von.vorname} hat ${mf ? "für dich " : ""}${was}.`, "Karla hat für dich einen Platz bei Hansi gebucht – „Köcheclub-Sitzung“.");
}
// 3. Server-Rechnung: Gäste zählen, Name, Entfernen-Rechte
const teil = srv.slice(srv.indexOf("const MITFAHRT_GAST_MAX"), srv.indexOf("// Gäste zu Fahrten"));
const { mitfahrtFrei, mitfahrtGastName, mitfahrtGastDarfEntfernen, MITFAHRT_GAST_MAX } = new Function(stripTypeScriptTypes(teil, { mode: "transform" }) + "\nreturn { mitfahrtFrei, mitfahrtGastName, mitfahrtGastDarfEntfernen, MITFAHRT_GAST_MAX };")();
{
  assert.equal(MITFAHRT_GAST_MAX, 2, "höchstens 2 Gäste je Mitglied und Fahrt");
  assert.equal(mitfahrtFrei(3, 1, 0), 2, "ohne Gast: 2 von 3 frei");
  assert.equal(mitfahrtFrei(3, 1, 1), 1, "Gast belegt einen Platz");
  assert.equal(mitfahrtFrei(3, 2, 1), 0, "voll");
  assert.equal(mitfahrtFrei(2, 2, 1), 0, "nie negativ");
  assert.equal(mitfahrtGastName("  Ruth   Muster "), "Ruth Muster");
  assert.equal(mitfahrtGastName("x".repeat(60)).length, 40, "höchstens 40 Zeichen");
  assert.equal(mitfahrtGastName("<b>Ruth</b>"), "bRuth/b", "keine spitzen Klammern");
  assert.equal(mitfahrtGastName("   "), "", "leer bleibt leer");
  const g = { eingetragen_von: "KC-P-KARLA" }, m = { fahrer: "KC-P-HANSI" };
  assert.ok(mitfahrtGastDarfEntfernen({ person_id: "KC-P-KARLA" }, g, m), "wer ihn eingetragen hat");
  assert.ok(mitfahrtGastDarfEntfernen({ person_id: "KC-P-HANSI" }, g, m), "der Fahrer");
  assert.ok(mitfahrtGastDarfEntfernen({ person_id: "KC-P-ADMIN", admin: true }, g, m), "der Admin");
  assert.ok(!mitfahrtGastDarfEntfernen({ person_id: "KC-P-ANNE" }, g, m), "sonst niemand");
}
// 4. Server: voll → Fehler, Gäste überall mitgezählt, Protokoll ohne Namen
{
  const p = fall("mitfahrt_platz");
  assert.ok(/const gae = await mitfahrtGaeste\(\[m\.id\]\);/.test(p) && /if \(mitfahrtFrei\(m\.plaetze, count \?\? 0, gae\.length\) <= 0\) throw new Fehler\("Leider sind schon alle Plätze vergeben\.", 409\);/.test(p), "Platz buchen: Gäste zählen mit, voll → Fehler");
  assert.ok(/kc_club_mitfahrt_gast"\)\.delete\(\)\.eq\("mitfahrt_id", m\.id\)\.eq\("eingetragen_von", ich\.person_id\)/.test(p), "Platz frei → eigene Gäste fahren nicht mehr mit");
  const g = fall("mitfahrt_gast");
  assert.ok(/mitfahrtLaufbandVergessen\(\);/.test(g), "Laufband neu");
  assert.ok(/if \(!mitfahrtGastDarfEntfernen\(ich, g, m\)\) throw new Fehler\([^)]*, 403\);/.test(g), "Entfernen nur Eintragender/Fahrer/Admin");
  assert.ok(/if \(!platz\) throw new Fehler\("Buche zuerst deinen eigenen Platz/.test(g), "Gast nur mit eigenem Platz (oder als Fahrer)");
  assert.ok(/await mitfahrtErlaubt\(ich, m\.bezug_art, m\.bezug_id\);/.test(g), "nur nach Zusage / offener Termin");
  assert.ok(/if \(meine >= MITFAHRT_GAST_MAX\) throw new Fehler\(/.test(g), "höchstens 2 je Mitglied");
  assert.ok(/if \(mitfahrtFrei\(m\.plaetze, count \?\? 0, gae\.length\) <= 0\) throw new Fehler\("Leider ist kein Platz mehr frei\.", 409\);/.test(g), "Gast nur bei freiem Platz");
  assert.ok(/kurz: `\$\{ich\.name\} nimmt \$\{name\} \(Gast\) mit: \$\{titel\}`/.test(g), "Fahrer: „Karla nimmt Ruth (Gast) mit“");
  for (const pr of g.match(/await protokoll\([^;]+;/g) || []) assert.ok(!/\bname\b|g\.name/.test(pr), "Gast-Name nie ins Protokoll: " + pr);
  assert.ok(/await protokoll\(ich\.person_id, "mitfahrt_gast", \{ mitfahrt: m\.id, anzahl: meine \+ 1, versand \}\);/.test(g), "Protokoll nur mit Anzahl");
  const zu = srv.slice(srv.indexOf("async function mitfahrtenZu("), srv.indexOf("// KC-CLUB-MITFAHRT-GAST (Wunsch Hansi"));
  assert.ok(/frei: mitfahrtFrei\(m\.plaetze, mit\.length, gaeste\.length\)/.test(zu) && /gaeste: gaeste\.map\(/.test(zu), "Anzeige „x von y frei“ und Termin-Kachel zählen Gäste");
  const lb = srv.slice(srv.indexOf("async function mitfahrtLaufbandLaden("), srv.indexOf("async function mitfahrtLaufband(ich"));
  assert.ok(/\.\.\.await mitfahrtGaeste\(mids\)\]\) belegt\.set/.test(lb), "Laufband zählt Gäste");
  assert.ok(/mitfahrtFrei\(m\.plaetze, \(pl \?\? \[\]\)\.filter\(.*?\)\.length, gae\.filter\(.*?\)\.length\) > 0/.test(fall("mitfahrt_suchen")), "Suche: Fahrer mit freiem Platz (Gäste mitgezählt)");
  const mg = srv.slice(srv.indexOf("async function mitfahrtGaeste("), srv.indexOf("async function mitfahrtGaeste(") + 500);
  assert.ok(/if \(error\) \{ console\.error\("mitfahrt_gast", String\(error\.code \?\? ""\)\); return \[\]; \}/.test(mg), "fehlt die Tabelle noch, bleibt der Termin-Abruf heil (ohne Inhalte im Log)");
}
// 5. Migration: Rechte, RLS, Spiegel
{
  assert.ok(/create table if not exists public\.kc_club_mitfahrt_gast \(/.test(mig));
  assert.ok(/mitfahrt_id uuid not null references public\.kc_club_mitfahrt\(id\) on delete cascade/.test(mig), "fällt mit der Fahrt weg");
  assert.ok(/eingetragen_von text not null references public\.kc_core_people\(person_id\)/.test(mig) && /name text not null check \(length\(name\) between 1 and 40\)/.test(mig) && /am timestamptz not null default now\(\)/.test(mig));
  assert.ok(/alter table public\.kc_club_mitfahrt_gast enable row level security;/.test(mig), "RLS");
  assert.ok(/revoke all on public\.kc_club_mitfahrt_gast from public, anon, authenticated;/.test(mig), "keine Rechte für App/Unangemeldete");
  assert.ok(/grant select, insert, update, delete on public\.kc_club_mitfahrt_gast to service_role;/.test(mig), "Club-Server darf (KC-SUPABASE-GRANTS)");
  assert.ok(/insert into public\.kc_db_mirror_table_rules[^;]*'kc_club_mitfahrt_gast'[^;]*on conflict \(table_name\) do nothing;/.test(mig), "gespiegelt/gesichert");
  assert.ok(/insert into public\.kc_neon_resume_tables \(table_name\) values \('kc_club_mitfahrt_gast'\) on conflict/.test(mig), "Neon-Fortsetzung");
}
// 6. App: Anzeige (Beispieldaten) – Vertretung „für Ruth“, Gast „Ruth (Gast von Karla)“, Platzzählung
{
  const code = app.slice(app.indexOf("const mfVt = "), app.indexOf("// KC-CLUB-MITFAHRT-BESCHEID (1.41.0", app.indexOf("const mfVt = ")));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const jsArg = (s) => esc(JSON.stringify(s));
  const bau = (VT, ICH) => new Function("esc", "jsArg", "VT", "ICH", code + "\nreturn { mitfahrtBlock, mfGastText };")(esc, jsArg, VT, ICH);
  const fahrt = (x) => ({ id: "M1", fahrer: { person_id: "KC-P-HANSI", name: "Hansi Beispiel" }, plaetze: 3, treffpunkt: "", notiz: "", mitfahrer: [], gaeste: [], frei: 3, eigen: false, dabei: false, darfLoeschen: false, ...x });
  // Karla selbst, mit Gast
  let f = bau({ fuer: null }, { name: "Karla Beispiel", person_id: "KC-P-KARLA" });
  let h = f.mitfahrtBlock("treffen", "T1", [fahrt({ mitfahrer: ["Karla Beispiel"], dabei: true, gaeste: [{ id: "G1", name: "Ruth", von: "Karla", eigen: true, darfEntfernen: true }], frei: 1 })], true, [], true);
  assert.match(h, /Ruth \(Gast von Karla\)/, "Anzeige „Ruth (Gast von Karla)“");
  assert.match(h, /1 von 3 Plätzen frei/, "Platzzählung mit Gast");
  assert.match(h, /＋ Gast mitnehmen/, "noch Platz, 1 Gast → zweiter Gast möglich");
  assert.match(h, /aria-label="Gast Ruth austragen"/, "✖ für den, der ihn eingetragen hat");
  h = f.mitfahrtBlock("treffen", "T1", [fahrt({ plaetze: 2, mitfahrer: ["Karla Beispiel"], dabei: true, gaeste: [{ id: "G1", name: "Ruth", von: "Karla", eigen: true, darfEntfernen: true }], frei: 0 })], true, [], true);
  assert.match(h, /0 von 2 Plätzen frei/); assert.ok(!/noch Platz/.test(h)); assert.ok(!/＋ Gast mitnehmen/.test(h), "voll → kein Gast-Knopf");
  h = f.mitfahrtBlock("treffen", "T1", [fahrt({ plaetze: 5, mitfahrer: ["Karla Beispiel"], dabei: true, gaeste: [{ id: "G1", name: "A", von: "Karla", eigen: true }, { id: "G2", name: "B", von: "Karla", eigen: true }], frei: 2 })], true, [], true);
  assert.ok(!/＋ Gast mitnehmen/.test(h), "höchstens 2 Gäste");
  h = f.mitfahrtBlock("treffen", "T1", [fahrt({ frei: 3 })], true, [], true);
  assert.ok(!/＋ Gast mitnehmen/.test(h), "ohne eigenen Platz kein Gast");
  // Karla handelt für Ruth
  f = bau({ fuer: { person_id: "KC-P-RUTH", name: "Ruth Beispiel", vorname: "Ruth" } }, { name: "Karla Beispiel", person_id: "KC-P-KARLA" });
  h = f.mitfahrtBlock("treffen", "T1", [fahrt({ frei: 3 })], true, [], true);
  assert.match(h, /🤝 für Ruth/, "Block klar „für Ruth“ beschriftet");
  assert.match(h, /onclick="mfSitzBuchen\('M1'/, "freier Platz für Ruth buchbar");
  assert.match(h, /Mitfahrgelegenheit für Ruth suchen/);
  assert.ok(!/Ich biete eine Mitfahrgelegenheit/.test(h), "in Vertretung nie anbieten");
  h = f.mitfahrtBlock("treffen", "T1", [fahrt({ mitfahrer: ["Ruth Beispiel"], dabei: true, frei: 2, darfLoeschen: true })], true, [], true);
  assert.match(h, /✔ Ruth fährt mit/); assert.match(h, /Platz von Ruth/);
  assert.ok(!/＋ Gast mitnehmen/.test(h) && !/mitfahrtLoeschen\(/.test(h), "in Vertretung kein Gast, kein Löschen");
  h = f.mitfahrtBlock("treffen", "T1", [fahrt({ fahrer: { person_id: "KC-P-RUTH", name: "Ruth Beispiel" }, eigen: true, darfLoeschen: true })], true, [], true);
  assert.ok(!/mitfahrtAnbieten\(/.test(h) && !/mitfahrtLoeschen\(/.test(h), "Ruths Fahrt: nicht ändern/löschen in Vertretung");
  // Aktionen: eigene Liste, nie „für Ruth“
  h = f.mitfahrtBlock("aktion", "A1", [fahrt({ frei: 3 })], true, [], true);
  assert.ok(!/für Ruth/.test(h) && /Ich biete eine Mitfahrgelegenheit/.test(h), "Aktion bleibt die eigene");
  assert.ok(/const mfFuerMich = \(art\) => \(art === "aktion" && VT\.fuer && ICH\?\.person_id \? \{ fuer: ICH\.person_id \} : \{\}\);/.test(app), "Aktion schickt ausdrücklich „für mich“");
  assert.ok(/api\("mitfahrt_platz", \{ id, dabei, \.\.\.mfFuerMich\(art\) \}\)/.test(app));
}
// 7. App: Antwort „Kann nicht“ in Vertretung löscht nie Ruths Fahrt als Karla; Hilfe; CSS; Ansage
{
  assert.ok(/eigen = VT\.fuer \? null : mf\.find\(\(m\) => m\.eigen\)/.test(app), "fremde Fahrt nie löschen");
  assert.ok(/\{ id: "vertretung", thema: "termine"[^\n]*🚗 Mitfahrten/.test(app) && /\{ id: "mitfahrt_gast", thema: "termine"/.test(app), "Hilfe ergänzt");
  assert.ok(/<input id="mfGastName" maxlength="\$\{MF_GAST_LEN\}"/.test(app) && /const MF_GAST_MAX = 2, MF_GAST_LEN = 40;/.test(app), "Eingabe höchstens 40 Zeichen");
  assert.ok(/\.mf-gaeste \{/.test(html) && /\.mf-block\[data-vt\] \{/.test(html), "CSS");
  assert.ok(/hat für \(\.\+\?\) einen Platz gebucht/.test(app) && /nimmt \(\.\+\?\) \\\(Gast\\\) mit/.test(app), "Sprachansage versteht die neuen Meldungen");
}
console.log("mitfahrt-vertretung-gast: alle Prüfungen bestanden");
