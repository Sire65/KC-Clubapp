// KC-CORE-NOTFALL-TRESOR (13.10.2026): gibt den Sicherungsschlüssel und die Neon-Verbindung NUR an den GitHub-Ablauf
// „Notfall – Sicherung lesen“ (Sire65/KC-Clubapp, Zweig main) heraus – geprüft über das von GitHub signierte OIDC-Token
// (RS256, Herausgeber token.actions.githubusercontent.com, Zielgruppe kc-notfall-tresor, höchstens 10 Min. alt).
// Jeder andere Aufruf: 401 ohne Inhalt. GET /status: nur ob befüllt (ja/nein), nie Werte. Läuft ohne Supabase.
const GITHUB = "https://token.actions.githubusercontent.com";
const antwort = (status, daten) => new Response(JSON.stringify(daten), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const json64 = (s) => JSON.parse(new TextDecoder().decode(b64url(s)));

async function pruefeToken(token, env, jetzt = Date.now() / 1000, holeSchluessel = holeJwks) {
  const teile = String(token || "").split(".");
  if (teile.length !== 3) return null;
  let kopf, p;
  try { kopf = json64(teile[0]); p = json64(teile[1]); } catch { return null; }
  if (kopf.alg !== "RS256" || !kopf.kid) return null;
  const jwk = (await holeSchluessel()).find((k) => k.kid === kopf.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(teile[2]), new TextEncoder().encode(teile[0] + "." + teile[1]));
  if (!ok) return null;
  const erlaubt = String(env.ABLAEUFE || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (p.iss !== GITHUB || p.aud !== "kc-notfall-tresor" || !(p.exp > jetzt) || !(p.iat > jetzt - 600) || p.repository !== env.REPO || p.ref !== "refs/heads/main" || !erlaubt.includes(p.workflow_ref)) return null;
  return p;
}
async function holeJwks() {
  const r = await fetch(GITHUB + "/.well-known/jwks", { cf: { cacheTtl: 3600 } });
  return (await r.json()).keys || [];
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/status") return antwort(200, { tresor: true, befuellt: !!(env.KC_BACKUP_KEY && env.KC_NEON_URL) });
    if (req.method !== "POST") return antwort(405, { fehler: "POST erforderlich" });
    const p = await pruefeToken((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""), env).catch(() => null);
    if (!p) return antwort(401, { fehler: "nicht berechtigt" });
    if (!env.KC_BACKUP_KEY || !env.KC_NEON_URL) return antwort(404, { fehler: "noch nicht befüllt" });
    return antwort(200, { schluessel: env.KC_BACKUP_KEY, neon: env.KC_NEON_URL });
  },
};
