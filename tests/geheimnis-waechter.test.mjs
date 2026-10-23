// KC-CLUB-GEHEIMNIS-WAECHTER (2.607.0, 23.10.2026, Wunsch Hansi „Sicherheit Punkt 5“): Kein Passwort, kein geheimer Schlüssel im Programmcode.
// Das Repo ist öffentlich – ein versehentlich hochgeladener Schlüssel wäre sofort für jeden lesbar. Dieser Test läuft vor jedem Einspielen;
// ein Fund macht ihn rot und verhindert das Einspielen. Erlaubt sind nur die öffentlichen Supabase-Schlüssel (Rolle „anon“ bzw. sb_publishable_).
// Aufruf: node tests/geheimnis-waechter.test.mjs (offline)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import assert from "node:assert/strict";

export const MUSTER = [
  ["Supabase-Geheimschlüssel", /sb_secret_[A-Za-z0-9_-]{10,}/],
  ["privater Schlüssel", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["GitHub-Token", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/],
  ["AWS-Schlüssel", /\bAKIA[0-9A-Z]{16}\b/],
  ["Stripe-Schlüssel", /\b(sk|rk)_live_[0-9a-zA-Z]{20,}/],
  ["Slack-Token", /\bxox[baprs]-[0-9A-Za-z-]{10,}/],
  ["Google-API-Schlüssel", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Datenbank-Adresse mit Passwort", /\bpostgres(?:ql)?:\/\/[^:@\/\s"'`]+:(?!\$\{|\[|<|\*{3})[^@\/\s"'`]{6,}@/],
  ["SendGrid-Schlüssel", /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/],
  ["Resend-Schlüssel", /\bre_[A-Za-z0-9]{8}_[A-Za-z0-9]{16,}/],
  ["Backblaze-Schlüssel", /\bK00[0-9][A-Za-z0-9+/]{27}\b/],
];
// JWT: nur erlaubt, wenn die Rolle „anon“ ist (öffentlicher Schlüssel, steht ohnehin in jeder Web-App)
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;
export function jwtRolle(teil) { try { return JSON.parse(Buffer.from(teil, "base64url").toString("utf8")).role ?? "?"; } catch { return "?"; } }

export function pruefeText(text) {
  const funde = [];
  for (const [name, re] of MUSTER) { const m = re.exec(text); if (m) funde.push(`${name} (${m[0].slice(0, 12)}…)`); }
  for (const m of text.matchAll(JWT)) { const r = jwtRolle(m[1]); if (r !== "anon") funde.push(`JWT mit Rolle „${r}“`); }
  return funde;
}

// Selbsttest: die Muster schlagen an, die erlaubten Dinge nicht (Beispiele hier zusammengesetzt, damit der Test sich nicht selbst findet)
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const kopf = b64({ alg: "HS256", typ: "JWT" }), unter = "x".repeat(20);
assert.equal(pruefeText(`${kopf}.${b64({ role: "anon", ref: "abc" })}.${unter}`).length, 0, "anon-Schlüssel erlaubt");
assert.match(pruefeText(`${kopf}.${b64({ role: "service_role" })}.${unter}`)[0], /service_role/, "service_role fällt auf");
assert.equal(pruefeText("sb_" + "publishable_abcdefghijklmnop").length, 0, "publishable erlaubt");
assert.equal(pruefeText("sb_" + "secret_abcdefghijklmnop").length, 1);
assert.equal(pruefeText("-----BEGIN " + "PRIVATE KEY-----").length, 1);
assert.equal(pruefeText("postgres" + "://kc:Geheim123@db.example.com/x").length, 1);
assert.equal(pruefeText("postgres" + "://kc:${PASS}@db.example.com/x").length, 0, "Platzhalter erlaubt");
assert.equal(pruefeText("gh" + "p_" + "a".repeat(36)).length, 1);

// alle Dateien im Repo (ohne Bilder/Schriften/Fremdbibliotheken)
const dateien = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean)
  .filter((f) => !/\.(png|jpe?g|gif|webp|ico|woff2?|ttf|mp3|mp4|ogg|wav|pdf|zip|wasm)$/i.test(f) && !/(^|\/)(vendor|node_modules)\//.test(f));
const funde = [];
for (const f of dateien) {
  let t; try { t = fs.readFileSync(f, "utf8"); } catch { continue; }
  for (const x of pruefeText(t)) funde.push(`${f}: ${x}`);
}
assert.deepEqual(funde, [], "Geheimnis im Programmcode gefunden – NICHT einspielen, Schlüssel sofort beim Anbieter erneuern:\n" + funde.join("\n"));
console.log(`OK – Geheimnis-Wächter: ${dateien.length} Dateien ohne Geheimnisse`);
