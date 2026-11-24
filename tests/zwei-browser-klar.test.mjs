// 3.22.0 KC-CLUB-ZWEI-BROWSER-KLAR (Fund Hansi 24.11.2026: Marianne – iPhone, App-Icon und zusätzlich Chrome offen, Meldung „2 × offen“ unklar):
// Die App meldet mit, ob das Fenster das App-Icon ist (a = 1); der Server merkt es sich je Fenster und gibt es beim „anderen Fenster“ zurück.
// Die Meldung sagt dann genau, was zu tun ist (Browser-Tab schließen, nur noch das Icon benutzen). Aufruf: node tests/zwei-browser-klar.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
assert.ok(app.includes('const fensterIstApp = () => { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }'), "App-Icon erkennen (auch iOS)");
assert.ok(app.includes("...(fensterIstApp() ? { a: 1 } : {}) });"), "Kennung meldet a = 1 nur beim Icon");
const fn = app.slice(app.indexOf("function zweiBrowserMelden(a)"), app.indexOf("async function onlinePing("));
assert.ok(fn.length > 500);
assert.ok(/const hierApp = fensterIstApp\(\), dortApp = a\.a === 1/.test(fn), "unterscheidet Icon/Browser auf beiden Seiten");
assert.ok(/hierApp && !dortApp/.test(fn) && /Club-App-Tab auf <b>✕<\/b>/.test(fn) && /nur noch über das Icon/.test(fn), "Icon hier, Browser dort → dort Tab schließen");
assert.ok(/!hierApp && dortApp/.test(fn) && /Bitte diesen Tab schließen/.test(fn), "Browser hier, Icon dort → diesen Tab schließen");
assert.ok(/Bitte \$\{a\.b && a\.b !== "unbekannt" \? esc\(a\.b\) : "den anderen Browser"\} schließen/.test(fn), "sonst wie bisher");
assert.ok(/data-w="anderes">📲 Das ist ein anderes Gerät/.test(fn), "„anderes Gerät“ bleibt");
const ab = srv.slice(srv.indexOf("async function fensterAbgleich("), srv.indexOf("// ---------- KC-CLUB-FP-UEBERWACHUNG"));
assert.ok(/const ap = f\.a === 1 \? 1 : 0;/.test(ab) && /\.\.\.\(ap \? \{ a: 1 \} : \{\}\) \}, \.\.\.alt\]/.test(ab), "Server merkt a je Fenster");
assert.ok(/\(ich0\.a \|\| 0\) === ap/.test(ab), "Wechsel Icon/Browser wird neu geschrieben");
assert.equal((ab.match(/\.\.\.\(anders\.a === 1 \? \{ a: 1 \} : \{\}\) \} : null;/g) || []).length, 2, "beide Rückgaben melden a");
console.log("zwei-browser-klar: ok");
