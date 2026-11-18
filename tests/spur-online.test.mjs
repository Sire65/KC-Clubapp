// KC-CLUB-SPUR-ONLINE (Wunsch Hansi 18.11.2026 „Wenn ich in der Liste Wege der Mitglieder bin, wo alles aufgelistet ist, was sie angesehen haben,
// oben noch die grüne LED anzeigen, dass sie noch online sind“). Aufruf: node tests/spur-online.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8"), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
// Server: nur heute, gleiche 3-Minuten-Regel wie die Übersicht, nur ja/nein + verborgen
const i = server.indexOf("// KC-CLUB-SPUR-ONLINE"), s = server.slice(i, server.indexOf("return json({ tag, name: name(pid!), online,", i) + 60);
assert.ok(i > 0 && /if \(pid && tag === berlinTag\(new Date\(\)\)\)/.test(s), "nur heute");
assert.ok(/from\("kc_club_zugang"\)\.select\("person_id"\)\.eq\("person_id", pid\)\.gt\("zuletzt_gesehen", new Date\(Date\.now\(\) - 180000\)/.test(s), "letzte 3 Minuten, nur diese Person");
assert.ok(/online = \{ da, verborgen: /.test(s) && /return json\(\{ tag, name: name\(pid!\), online,/.test(s), "Antwort enthält online");
const fall = server.slice(server.indexOf('case "spur_liste"'), server.indexOf('case "spur_liste"') + 600);
assert.ok(/nurAdmin\(ich\)/.test(fall), "nur der Admin");
// App: LED oben in den Wegen einer Person
const a = app.slice(app.indexOf("// KC-CLUB-SPUR-ONLINE"), app.indexOf("inhalt = led + "));
assert.ok(/const onP = heuteDa && \(!!r\.online\?\.da \|\|/.test(a), "Server-Angabe oder Online-Takt");
assert.ok(/class="spur-online\$\{onP \? " an" : ""\}"/.test(a) && /<span class="spur-led" aria-hidden="true"><\/span>/.test(a) && /gerade in der App/.test(a) && /nicht mehr in der App/.test(a), "LED mit Text");
assert.ok(/inhalt = led \+ /.test(app), "steht oben, vor der Liste");
assert.ok(/\.spur-online\.an \.spur-led \{ background: radial-gradient\([^}]*#22c55e/.test(html) && /prefers-reduced-motion: reduce\) \{ \.spur-online\.an \.spur-led \{ animation: none; \}/.test(html), "grün leuchtend, ruhig bei reduzierter Bewegung");
console.log("✅ spur-online: alle Prüfungen bestanden");
