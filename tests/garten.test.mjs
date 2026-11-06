// KC-CLUB-SAMEN „🌱 Mein Garten“ (Wunschliste #84): Wachstum gleich in App und Server, nie tot, Samen-Schwellen, Registry gleich, sparsam, erst nur Admin
import assert from "node:assert/strict";
import fs from "node:fs";
const srv = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8"), gt = fs.readFileSync("teile/garten.js", "utf8"), app = fs.readFileSync("app.js", "utf8");
const mig = fs.readFileSync("supabase/migrations/20261105_kc_club_garten.sql", "utf8");
// 1) Wachstumsrechnung: App (gtWachs) und Server (gartenWachs) rechnen gleich
const koerper = (src, name) => src.match(new RegExp(`function ${name}\\(p[^)]*\\) \\{\\n([\\s\\S]*?)\\n\\}`))[1].replace(/: (any|number|boolean)/g, "");
const wApp = new Function("p", "jetztMs", "auto", "GT_WASSER_TAGE", koerper(gt, "gtWachs")), wSrv = new Function("p", "jetztMs", "auto", "GARTEN_WASSER_TAGE", koerper(srv, "gartenWachs"));
const T = 864e5, t0 = Date.parse("2026-11-01T10:00:00Z"), p = { stand: new Date(t0).toISOString(), gegossen: new Date(t0).toISOString(), wachs: 2 };
for (const [tage, auto, soll] of [[0, false, 2], [2, false, 4], [3, false, 5], [7, false, 7], [7, true, 9], [30, false, 18.5]]) {
  assert.equal(wApp(p, t0 + tage * T, auto, 3), soll, `App: ${tage} Tage auto=${auto}`);
  assert.equal(wSrv(p, t0 + tage * T, auto, 3), soll, `Server: ${tage} Tage auto=${auto}`);
}
assert.ok(wApp(p, t0 + 365 * T, false, 3) > wApp(p, t0 + 30 * T, false, 3), "ohne Wasser wächst sie weiter (halb so schnell) – nie tot");
// 2) Registry: gleiche Arten und Tage in App und Server; 12 Pflanzen in 4 Gruppen
const artenSrv = Object.fromEntries([...srv.match(/const GARTEN_ARTEN[^{]*\{([^}]*)\}/)[1].matchAll(/(\w+): (\d+)/g)].map((m) => [m[1], Number(m[2])]));
const artenApp = Object.fromEntries([...gt.matchAll(/\{ id: "(\w+)", t: "[^"]+", sym: "[^"]+", gruppe: "\w+", tage: (\d+)/g)].map((m) => [m[1], Number(m[2])]));
assert.deepEqual(artenApp, artenSrv, "GT_ARTEN = GARTEN_ARTEN"); assert.equal(Object.keys(artenApp).length, 12);
// 3) Samen-Schwellen 7/25/50/100/200/365, danach je 365; höchstens 3 nachträglich
const schw = JSON.parse(srv.match(/const GARTEN_SCHWELLEN = (\[[^\]]*\])/)[1]); assert.deepEqual(schw, [7, 25, 50, 100, 200, 365]);
const bis = new Function("GARTEN_SCHWELLEN", "return " + srv.match(/const gartenSchwellenBis = (\(tage: number\) => [^;]*);/)[1].replace(": number", ""))(schw);
assert.deepEqual([6, 7, 24, 50, 364, 365, 729, 730, 1095].map(bis), [0, 1, 1, 3, 5, 6, 6, 7, 8]);
assert.ok(/GARTEN_NACHTRAG_MAX = 3/.test(srv) && /geoeffnet: Math\.max\(0, gartenSchwellenBis\(tage\) - GARTEN_NACHTRAG_MAX\)/.test(srv), "höchstens 3 Samen nachträglich");
// 4) Besondere Taten (Antwort Hansi 1 „ja“): Rezept und Club-Küche, wartet nicht und stört nie
assert.ok(/gartenTat\(ich\.person_id, "rezept"\)/.test(srv) && /gartenTat\(ich\.person_id, "magazin"\)/.test(srv), "Haken an Rezept und Magazin");
// 5) Sparsam: eine Zeile je Person, Tag zählen höchstens einmal je Tag und Gerät, kein Push
assert.ok(/person_id text primary key/.test(mig) && /enable row level security/.test(mig) && /revoke all on public\.kc_club_garten from public, anon, authenticated/.test(mig), "eine Zeile je Person, RLS, keine Rechte für anon");
assert.ok(/gartenSpeicher\(\)\?\.tag === heuteIso\(\)\) return;/.test(app), "Start: nur wenn heute noch nicht gezählt");
assert.ok(/if \(!g\.letzter_tag \|\| g\.letzter_tag < heute\)/.test(srv), "Server zählt jeden Tag nur einmal");
assert.ok(!/senden\(|pushSenden|webpush/i.test(gt) && !/garten[^\n]*senden\(/.test(srv.match(/KC-CLUB-SAMEN \(#84\): „Mein Garten“ – je Aufruf[\s\S]*?case "rezept_bewerten"/)[0]), "kein Push (Antwort Hansi 4)");
assert.ok(/GT\.club \|\| Date\.now\(\) - GT\.clubZeit > 600000/.test(gt), "Club-Garten 10 Min. gemerkt");
// 6) Erst nur Admin (Wunsch Hansi „noch nicht veröffentlichen“); Kachel nur mit Freigabe; Club-Garten nur Freigegebenes
assert.ok(/garten: \{ t: "🌱 Mein Garten", [^}]*standard: "admin" \}/.test(srv), "Freigabe Standard nur Admin");
assert.ok(/\{ id: "garten", sym: "🌱", t: "Mein Garten",[^\n]*nur: \(\) => frei\("garten"\) \}/.test(app), "Kachel nur mit Freigabe");
assert.ok(/\.from\("kc_club_garten"\)\.select\("person_id,pflanzen,automatik"\)\.eq\("club", true\)/.test(srv), "Club-Garten nur freigegebene");
assert.ok(/if \(!GT\.g\.clubGefragt\)/.test(gt), "nach dem Säen fragen (Antwort Hansi 5)");
// 7) Teil-Liste und Service Worker kennen „garten“
assert.ok(/garten: \{ einstieg: \["gartenStart", "gartenTag"\], sri: "sha384-/.test(app) && /garten: "[\w-]{16}"/.test(fs.readFileSync("sw.js", "utf8")));
console.log("garten: ok");
