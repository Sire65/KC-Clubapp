// KC-CLUB-SICHERHEIT-WAECHTER (2.726.0): Regeln des Sicherheits-Wächters – Link-Prüfer, Geräteklasse, neues Gerät. Offline.
import assert from "node:assert/strict";
import fs from "node:fs";
import { siLinkGruende, siLinksVerdacht, siGeraetKlasse, siGeraetMerken, SI } from "../supabase/functions/kc-club/sicherheit.js";

const ok = ["https://sire65.github.io/KC-Clubapp/#zu=avatar", "https://www.google.com/maps?q=Werne", "https://docs.google.com/x", "https://www.paypal.com/de/home",
  "https://www.werne.de/veranstaltungen", "https://www.youtube.com/watch?v=abc", "https://de.wikipedia.org/wiki/Werne", "https://github.com/Sire65", "https://www.chefkoch.de/rezepte/1",
  "https://lh3.googleusercontent.com/a.jpg", "https://www.ruhrnachrichten.de/werne/", "https://www.sparkasse-werne.de/", "https://wa.me/49123"];
for (const u of ok) assert.deepEqual(siLinkGruende(u), [], `unauffällig: ${u} → ${siLinkGruende(u).join(", ")}`);
const boese = [["http://werne.de", /http/], ["https://192.168.1.10/login", /Zahlen/], ["https://bit.ly/3abc", /Kurz-Link/], ["https://xn--pypal-4ve.com", /Sonderzeichen/],
  ["https://k0echeclub-werne.de/login", /koecheclub/], ["https://paypa1.com", /paypal/], ["https://supabase-login.xyz", /supabase/], ["https://googIe.com".toLowerCase().replace("i", "l") + "/a", null],
  ["https://sicher-konto.info/passwort-bestaetigen", /Passwort/], ["https://www.google.com@boese.ru/x", /@/]];
for (const [u, m] of boese) { if (!m) continue; const g = siLinkGruende(u); assert.ok(g.some((x) => m.test(x)), `verdächtig: ${u} → ${g.join(", ") || "nichts"}`); }
assert.deepEqual(siLinksVerdacht("Schau mal https://www.werne.de und http://1.2.3.4/x."), [{ url: "http://1.2.3.4/x", gruende: ["Zahlen-Adresse statt Name", "ohne Verschlüsselung (http)"] }]); // wichtigster Grund zuerst
assert.deepEqual(siLinkGruende("kein link"), []);

// Geräteklasse ohne Versionen
assert.equal(siGeraetKlasse("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36"), "Android · Chrome");
assert.equal(siGeraetKlasse("Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/15E148 Safari/604.1"), "iPhone · Safari");
assert.equal(siGeraetKlasse("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0.1 Safari/605.1.15"), "Mac · Safari");
assert.equal(siGeraetKlasse("curl/8.4.0"), "Programm");
// Neues Gerät: erstes Gerät → keine Frage; zweites → Frage; bekanntes → nichts
let r = siGeraetMerken([], "Android · Chrome", "2026-10-28T10:00:00Z"); assert.deepEqual([r.neu, r.frage, r.liste.length], [true, false, 1]);
r = siGeraetMerken(r.liste, "Mac · Safari", "2026-10-28T11:00:00Z"); assert.deepEqual([r.neu, r.frage, r.liste.length], [true, true, 2]);
r = siGeraetMerken(r.liste, "Android · Chrome", "2026-10-28T12:00:00Z"); assert.deepEqual([r.neu, r.frage], [false, false]);
assert.equal(siGeraetMerken([{ k: "Android · Chrome" }], "Programm", "x").frage, false, "Programme fragt nicht (Angriffs-Wächter)");
assert.ok(Date.parse(SI.bremsenAb) > Date.parse("2026-10-28T00:00:00Z"), "erst beobachten, dann bremsen");

// Gleiche Link-Prüfung in der App (Kopie) – Quelltext der Regeln identisch
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), mod = fs.readFileSync(new URL("../supabase/functions/kc-club/sicherheit.js", import.meta.url), "utf8");
const block = (t, von, bis) => t.slice(t.indexOf(von), t.indexOf(bis, t.indexOf(von)));
const regeln = (t) => block(t, "const KURZ = ", "export const SI_LINK_RE").replace(/export /g, "").replace(/\bsi([A-Z])/g, "na$1");
assert.equal(regeln(block(app, "// >>> SI-LINK-REGELN", "// <<< SI-LINK-REGELN") + "export const SI_LINK_RE"), regeln(mod), "App und Server prüfen Links gleich");
console.log("OK – Sicherheits-Wächter-Regeln");
