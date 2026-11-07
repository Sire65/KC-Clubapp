// KC-CLUB-FILM-KURZ (2.879.0, Wunsch Hansi 07.11.2026): Film unter 60 s geschlossen → nochmal anbieten (mit Hinweis), höchstens 3-mal.
// Aufruf: node tests/film-kurz.test.mjs (offline)
import assert from "node:assert/strict";
import fs from "node:fs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), srv = lies("supabase/functions/kc-club/index.ts");
// Logik echt ausführen: filmErledigt + filmMerken (Speichern ersetzt)
const teil = app.slice(app.indexOf("const FILM_KURZ_S = 60, FILM_KURZ_MAX = 3;"), app.indexOf("async function filmHinweisPruefen()"));
const welt = { INIT: { einstellungen: {} }, gespeichert: [] };
const { filmErledigt, filmMerken } = new Function("welt", `let INIT = welt.INIT; const einstSpeichern = async (k, w) => { welt.gespeichert.push(w); }; const FILM_START = {};
  ${teil.replace("const FILM_START = { versuche: 0 };", "")}; return { filmErledigt, filmMerken };`)(welt);
assert.equal(filmErledigt("x"), false, "noch nie gezeigt → anbieten");
await filmMerken("x", "kurz"); assert.equal(welt.INIT.einstellungen.filme.x.wie, "kurz"); assert.equal(welt.INIT.einstellungen.filme.x.n, 1);
assert.equal(filmErledigt("x"), false, "1× kurz → wieder anbieten");
await filmMerken("x", "kurz"); assert.equal(welt.INIT.einstellungen.filme.x.n, 2); assert.equal(filmErledigt("x"), false, "2× kurz → wieder anbieten");
await filmMerken("x", "kurz"); assert.equal(welt.INIT.einstellungen.filme.x.n, 3); assert.equal(filmErledigt("x"), true, "3× kurz → nicht mehr von selbst");
await filmMerken("y", "angesehen"); await filmMerken("y", "kurz"); assert.equal(welt.INIT.einstellungen.filme.y.wie, "angesehen", "schon gesehen bleibt gesehen");
assert.equal(filmErledigt("y"), true);
await filmMerken("z", "kurz"); await filmMerken("z", "angesehen"); assert.equal(welt.INIT.einstellungen.filme.z.wie, "angesehen", "später länger geschaut → gesehen");
await filmMerken("z", "ende"); await filmMerken("z", "angesehen"); assert.equal(welt.INIT.einstellungen.filme.z.wie, "ende", "ende bleibt");
// Abspielen: „angesehen“ erst ab 60 s, ✕ vorher → „kurz“; kein „angesehen“ mehr beim ersten ▶
assert.ok(!app.includes('v.onplay = () => filmMerken(f.id, "angesehen")'), "nicht mehr beim ersten ▶");
assert.ok(app.includes('let lang = false; v.ontimeupdate = () => { if (!lang && (v.currentTime || 0) >= FILM_KURZ_S) { lang = true; filmMerken(f.id, "angesehen"); } };'), "ab 60 s");
assert.ok(app.includes('s.querySelector("[data-zu]").onclick = () => { ende(false); if (!lang) filmMerken(f.id, "kurz"); zu(); };'), "✕ unter 60 s → kurz");
// Hinweis mit Hansis Text, Zuschauerliste, Server lässt „kurz“ + n durch
assert.ok(app.includes("Letztes Mal ist der Film unter 60 Sekunden gelaufen. Falls es ein technisches Problem gab, kannst du den Film hier nochmal starten."), "Hinweistext");
assert.ok(app.includes('block("⏱️", "Unter 1 Minute geschlossen – wird nochmal angeboten", gruppe("kurz"))'), "Zuschauerliste");
assert.ok(srv.includes('["angesehen", "ende", "nein", "kurz"].includes(String(v?.wie))') && srv.includes('...(String(v?.wie) === "kurz" ? { n: Math.min(9, Math.max(1, Math.round(Number(v?.n) || 1))) } : {})'), "Server");
console.log("film-kurz: ok");
