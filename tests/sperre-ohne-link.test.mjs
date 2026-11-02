// KC-CLUB-SPERRE-OHNE-LINK (02.11.2026, Fund Hansi „Er ist gesperrt und müsste Wartung angezeigt bekommen“):
// Link-Anforderung ohne Link: gesperrt → kein neuer Link, sondern die Sperr-Anzeige (wie beim Öffnen mit Link).
// Aufruf: node tests/sperre-ohne-link.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const za = server.slice(server.indexOf('if (a === "zugang_anfordern") {'), server.indexOf('if (a === "zugang_hilfe") {'));
const iSp = za.indexOf("const sp = await sperreFuer(pe.person_id);"), iLink = za.indexOf("neuenLinkMailen(pe.person_id)");
assert.ok(iSp > 0 && iLink > iSp, "erst Sperre prüfen, dann Link");
assert.ok(/if \(sp\) \{\s*await sperreVersuchMerken\(pe\.person_id, sp\.art, a\)\.catch\(\(\) => \{\}\);\s*return json\(\{ ok: true, text, gesperrt: sp\.art, sperreText: SPERRE_TEXT\[sp\.art\] \|\| SPERRE_TEXT\.wartung, bis: sp\.bis \}\);/.test(za), "gesperrt: kein Link, Sperr-Anzeige");
assert.ok(/versand = await neuenLinkMailen\(t\.pid\);/.test(server), "andere Wege (Hilfe) unverändert");
assert.ok(/if \(r\.ok && j\.gesperrt\) return sperreZeigen\(j\.gesperrt, j\.sperreText, j\.bis\);/.test(app), "App zeigt die Sperre");
console.log("sperre-ohne-link: ok");
// KC-CLUB-KOMM-AUS-HINWEIS: „keine Benachrichtigungen“ → ehrlicher Hinweis statt „Mail kommt gleich“ (vor der Sperre geprüft)
{
  const iK = za.indexOf("if ((await kommunikationAus()).has(pe.person_id)) {");
  assert.ok(iK > 0 && iK < iSp, "Kommunikation-aus zuerst");
  assert.ok(/return json\(\{ ok: true, text, kommAus: true, vorname: [^\n]*admin: await adminVorname\(\) \}\);/.test(za), "Antwort mit Vorname und Admin");
  assert.ok(/if \(r\.ok && j\.kommAus\) return sperreZeigen\("kommaus", `Hallo\$\{j\.vorname \? " " \+ j\.vorname : ""\}\. Du hast einen neuen Link angefordert\. Den kann ich dir leider nicht zusenden, weil du selbst darum gebeten hast/.test(app), "Text im Fenster");
  assert.ok(/kommaus: \{ sym: "🔕", t: "Kommunikation ausgeschaltet"/.test(app), "eigenes Fenster");
  console.log("komm-aus-hinweis: ok");
}
