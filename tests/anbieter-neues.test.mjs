// KC-CLUB-ANBIETER-NEUES (2.842.0, Wunschliste #78): Admin-Kachel „📰 Anbieter“ – Wartungen, Störungen, Neuerungen aus öffentlichen Feeds.
// Aufruf: node tests/anbieter-neues.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const teil = readFileSync(new URL("../teile/anbieter.js", import.meta.url), "utf8"), app = readFileSync(new URL("../app.js", import.meta.url), "utf8"), sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
// Server: nur Admin, gemerkt, nur https-Quellen ohne Schlüssel
assert.ok(/case "anbieter_neues": \{[^]{0,200}nurAdmin\(ich\);\s*return json\(await anbieterNeues\(p\.frisch === true\)\);/.test(srv), "nur Admin");
const reg = srv.slice(srv.indexOf("const ANBIETER_QUELLEN"), srv.indexOf("const ANB_MERK_MS"));
const urls = reg.match(/"https?:\/\/[^"]+"/g) || [];
assert.ok(urls.length >= 12 && urls.every((u) => u.startsWith('"https://')), "nur https");
assert.ok(!/key|token|secret|apikey/i.test(reg), "keine Schlüssel");
for (const n of ["Supabase", "Neon", "Cloudflare", "GitHub", "Deno", "Backblaze B2"]) assert.ok(reg.includes(`name: "${n}"`), "Anbieter " + n);
// Server-Teil echt ausführen (ohne Netz: fetch wird ersetzt)
const code = stripTypeScriptTypes(srv.slice(srv.indexOf("const ANBIETER_QUELLEN"), srv.indexOf("const TEMPO_LOG_MS")), { mode: "transform" });
const jetzt = new Date(), vor = (t) => new Date(jetzt - t * 86400000).toUTCString();
const RSS = (items) => `<?xml version="1.0"?><rss><channel><title>X</title>${items.map(([t, d, desc, l]) => `<item><title><![CDATA[${t}]]></title><link>${l || "https://x.example/" + encodeURIComponent(t)}</link><pubDate>${d}</pubDate><description><![CDATA[${desc}]]></description></item>`).join("")}</channel></rss>`;
const ANT = {
  "https://status.supabase.com/history.rss": RSS([["Storage uploads failing in us-east-1", vor(1), "<b>Status: Investigating</b>"], ["Logs degraded in multiple regions", vor(1), "<b>Status: Resolved</b> fixed"], ["Alt", vor(40), "x"]]),
  "https://supabase.com/changelog/rss.xml": RSS([["Neue Funktion &amp; mehr", vor(3), "<p>Text</p>"], ["Uralt", vor(90), ""]]),
  "https://www.cloudflarestatus.com/api/v2/scheduled-maintenances/upcoming.json": JSON.stringify({ scheduled_maintenances: [{ name: "FRA (Frankfurt) on 2026-11-09", scheduled_for: "2026-11-09T01:00:00Z", scheduled_until: "2026-11-09T05:00:00Z", shortlink: "https://stspg.io/a" }, { name: "NRT (Tokyo) on 2026-11-09", scheduled_for: "x", shortlink: "https://stspg.io/b" }] }),
  "https://www.cloudflarestatus.com/history.rss": RSS([["FRA (Frankfurt) on 2026-11-09", vor(0), "Scheduled", "https://stspg.io/a"], ["Network performance issues", vor(0), "Investigating"]]),
  "https://neonstatus.com/pages/6878fc85709daa75be6c7e3c/rss": RSS([["ES-123456", vor(0), "<small>November 2, 2026 10:27PM UTC</small><br /><b>Resolved</b> - Between 21:45 UTC and 22:11 UTC customers may have experienced errors"]]),
};
const fetchErsatz = async (url) => { if (!(url in ANT)) throw new Error("offline"); return { ok: true, status: 200, text: async () => ANT[url] }; };
const holen = new Function("txt", "AbortSignal", "fetch", code + "\nreturn anbieterNeues;")((x, n) => String(x ?? "").slice(0, n), { timeout: () => undefined }, fetchErsatz);
const d = await holen(true), A = Object.fromEntries(d.anbieter.map((a) => [a.id, a]));
assert.equal(A.supabase.status.length, 1, "Supabase: fremde Region (us-east-1) ausgeblendet, alte Meldung weg");
assert.equal(A.supabase.ausgeblendet, 1);
assert.ok(A.supabase.status[0].erledigt && A.supabase.status[0].art === "stoerung", "behoben erkannt");
assert.deepEqual(A.supabase.neu.map((e) => e.t), ["Neue Funktion & mehr"], "Neuerungen: 30 Tage, Zeichen entschlüsselt");
assert.deepEqual(A.cloudflare.wartung.map((w) => w.t), ["FRA (Frankfurt) on 2026-11-09"], "Cloudflare: nur nahe Rechenzentren");
assert.deepEqual(A.cloudflare.status.map((s) => s.t), ["Network performance issues"], "angekündigte Wartung nicht doppelt");
assert.match(A.neon.status[0].t, /^Between 21:45 UTC/, "Neon: Nummer-Titel → Beschreibung ohne Datum");
assert.ok(A.neon.status[0].erledigt, "Neon: behoben");
assert.ok(A.github.fehler.length === 3 && A.github.status.length === 0, "nicht erreichbar → Fehler genannt, nichts erfunden");
assert.ok(A.b2.feeds === false && !A.b2.fehler.length, "B2: nur Link");
const d2 = await holen(false); assert.equal(d2, d, "30 Min. gemerkt");
// App: Teil, Kachel, Lage (UNKNOWN nie OK)
assert.ok(/anbieter: \{ einstieg: \["anbStart"\], sri: "sha384-[A-Za-z0-9+/=]{64}" \}/.test(app) && /anbieter: "/.test(sw.match(/const TEILE = \{[^}]*\}/)[0]), "Teil registriert (App + Service Worker)");
assert.ok(/\["anbieter", "📰", "Anbieter", "app"\]/.test(app) && /if \(id === "anbieter"\) return anbStart\(\);/.test(app), "Admin-Kachel");
assert.ok(/case "anbieter": return typeof anbLage === "function" \? anbLage\(\) : \["keine", /.test(app), "Kachel ohne Daten: grau, nie OK");
const l0 = teil.indexOf("const anbAktuell"), lcode = teil.slice(l0, teil.indexOf("async function anbStart"));
const lage = new Function("ANB", lcode + "\nreturn anbLage;")({ daten: null });
assert.equal(lage(null)[0], "keine");
const h = new Date().toISOString(), alt = new Date(Date.now() - 5 * 86400000).toISOString();
assert.equal(lage({ anbieter: [{ name: "A", status: [{ art: "stoerung", erledigt: false, zeit: h }] }] })[0], "gelb", "offene Störung");
assert.equal(lage({ anbieter: [{ name: "A", status: [{ art: "stoerung", erledigt: false, zeit: alt }] }] })[0], "gruen", "alte unklare Meldung ist kein Alarm");
assert.equal(lage({ anbieter: [{ name: "A", status: [], fehler: ["x"] }] })[0], "grau", "nicht abrufbar → grau");
assert.equal(lage({ anbieter: [{ name: "A", status: [], wartung: [{ bis: new Date(Date.now() + 86400000).toISOString() }] }] })[0], "gelb", "Wartung angekündigt");
assert.ok(/api\("wl_speichern", \{ text: `Anbieter-Neuerung prüfen/.test(teil), "„Prüfen lassen“ → Wunschliste");
assert.ok(/\{ id: "anbieter_neues", thema: "technik"/.test(app), "Hilfe-Eintrag");
console.log("anbieter-neues: alle Prüfungen bestanden");
