// KC-CORE-NOTFALL-TRESOR (13.10.2026): reicht den Sicherungsschlüssel (Vault kc_db_backup_key_v1) und die Neon-Verbindung
// (Vault kc_neon_mirror_connection) EINMAL an den GitHub-Ablauf „Notfall einrichten“ weiter, der sie in den Cloudflare-Tresor legt.
// Nur dieser Ablauf darf (GitHub-OIDC-Token, Zweig main). Die Funktion wird vom Ablauf hochgeladen und danach IMMER wieder gelöscht.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const GITHUB = "https://token.actions.githubusercontent.com";
const JWKS = createRemoteJWKSet(new URL(GITHUB + "/.well-known/jwks"));
const ABLAUF = "Sire65/KC-Clubapp/.github/workflows/notfall-einrichten.yml@refs/heads/main";
const antwort = (status: number, daten: unknown) => new Response(JSON.stringify(daten), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function berechtigt(req: Request) {
  const t = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!t) return false;
  try {
    const { payload: p } = await jwtVerify(t, JWKS, { issuer: GITHUB, audience: "kc-notfall-schluessel", maxTokenAge: "10m" });
    return p.repository === "Sire65/KC-Clubapp" && p.repository_id === "1392489961" && p.repository_owner_id === "297908448" && p.ref === "refs/heads/main" && p.workflow_ref === ABLAUF && ["workflow_dispatch", "schedule", "push"].includes(String(p.event_name));
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return antwort(405, { error: "POST erforderlich" });
  if (!(await berechtigt(req))) return antwort(401, { error: "nicht berechtigt" });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  const [k, n] = await Promise.all([sb.rpc("kc_db_backup_key_v1"), sb.rpc("kc_db_mirror_neon_connection")]);
  if (k.error || n.error || !k.data || !n.data) return antwort(500, { error: "Tresor nicht lesbar" });
  return antwort(200, { schluessel: k.data, neon: n.data });
});
