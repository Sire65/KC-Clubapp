// KC-CLUB-ZUGANG-HILFE (26.10.2026, Wunsch Hansi „freundlicher Hinweis bei altem Link, Taste → Hansi bekommt Info“): statische Prüfung (offline).
// Aufruf: node tests/zugang-hilfe.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), seite = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts");
const block = (von, bis) => { const i = server.indexOf(von); assert.ok(i > 0, von); return server.slice(i, server.indexOf(bis, i + 10)); };

// 1. Server: Grund bei „Kein Zugang“, Name nur bei Links, die die Person wirklich hatte
assert.ok(/class Fehler extends Error \{ constructor\(msg: string, public status = 400, public extra\?: Record<string, unknown>\)/.test(server) && /json\(\{ error: e\.message, \.\.\.\(e\.extra \?\? \{\}\) \}, e\.status\)/.test(server), "Grund wird mitgeschickt");
const info = block("async function zugangHilfeInfo(", "// ---------- KC-CLUB-KURZCODE");
assert.ok(/from\("kc_club_zugang_alt"\)\.select\("person_id,ersetzt_am,grund"\)\.eq\("token_hash", hash\)/.test(info) && /if \(!pid\) return \{ art \};/.test(info), "unbekannter Schlüssel: kein Name");
assert.ok(/if \(!pe\?\.active\) return \{ art: "unbekannt" \};/.test(info) && /mail: art === "alt" && mail \? mailMaske\(mail\) : null/.test(info), "ausgetretene Mitglieder ohne Namen, Mail nur maskiert");
assert.ok(/token\.length !== 48\) e\.extra = \{ hilfe: \{ art: "unvollstaendig" \} \}/.test(server), "abgeschnittene Links erkannt");
// 2. Hilfe-Kennung: unterschrieben, kurzlebig, zeitkonstanter Vergleich
assert.ok(/"kc-zugang-hilfe\|" \+ SERVICE/.test(server) && /ZH_GUELTIG_MS = 30 \* 60000/.test(server) && /Number\(m\[3\]\) < Date\.now\(\)\) return null/.test(server) && /d \|= soll\.charCodeAt\(i\) \^ m\[4\]\.charCodeAt\(i\)/.test(server), "Kennung");
// 3. Aktion zugang_hilfe: ohne Anmeldung, Bremse, Mail nur bei altem Link, nie den Link zurückgeben
const zh = block('if (a === "zugang_hilfe") {', 'if (a === "kurzcode_einloesen") {');
assert.ok(server.indexOf('if (a === "zugang_hilfe")') < server.indexOf("const ich = await anmelden(req);"), "vor der Anmeldung");
assert.ok(/zhTicketPruefen\(txt\(p\.ticket, 120\)\)/.test(zh) && /if \(weg === "mail" && t\.art !== "alt"\)/.test(zh), "nur mit Kennung, Mail nur bei altem Link");
assert.ok(/ZH_JE_PERSON_STD \* 3600000/.test(zh) && /\(heute \?\? 0\) >= ZH_MAX_TAG/.test(zh), "Bremse");
assert.ok(/neuenLinkMailen\(t\.pid\)/.test(zh) && /routerSenden\("club_nachricht_beide", adm,/.test(zh) && !/\?k=/.test(zh), "Mail an hinterlegte Adresse oder Admins – kein Link in der Antwort");
// 4. App: Karte je Grund, Knöpfe, Tipps ohne Link, kein falsches „Start hängt“
assert.ok(/zugangHilfeZeigen\(j\?\.hilfe\)/.test(app) && /Hallo \$\{esc\(h\.vorname\)\}, schön, dass du da bist!/.test(app) && /knopf\("hansi", "📨 Hansi Bescheid geben", true\)/.test(app), "Begrüßung und Hansi-Knopf");
assert.ok(/Dein Link ist nicht vollständig angekommen/.test(app) && /SamsungBrowser/.test(app) && /Privater Modus/.test(app) && /id="ohneLinkTipp"/.test(seite), "Tipps je Ursache");
assert.ok(/if \(window\.KCFP\.startOk \|\| window\.KCFP\.ohneLink\) return;/.test(seite) && /window\.KCFP\.ohneLink = true; ohneLinkTipp\(\);/.test(app), "kein falsches „Start hängt“");
// 5. Mail mit neuem Link: Link ganz oben, altes Symbol löschen, Schritte; WhatsApp-Vorlage mit demselben Hinweis
const nl = block("async function neuenLinkMailen(", "// ---------- KC-CLUB-KURZCODE");
assert.ok(/👉 Hier tippen, um die Köcheclub-App zu öffnen:\\n\$\{link\}/.test(nl) && /1\. Altes Köcheclub-Symbol löschen/.test(nl) && /Zum Home-Bildschirm/.test(nl) && /App installieren/.test(nl), "Mail-Anleitung");
assert.ok(/zuerst das \*alte Köcheclub-Symbol\* vom Startbildschirm löschen/.test(app), "WhatsApp-Vorlage mit Symbol-Hinweis");
assert.ok(/!FP_IOS && !\/Android\|Mobile\/i\.test\(ua\) \? "💻 <b>Am PC:<\/b>/.test(app) && /Code für ein anderes Gerät/.test(app), "PC-Tipp (KC-CLUB-ZUGANG-HILFE-PC)");
console.log("zugang-hilfe: alle Prüfungen bestanden");
