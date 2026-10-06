// KC-CLUB-DB-EINSPIELEN (06.10.2026, Wunsch Hansi, Weg B): Datenbank-Migration einspielen, ohne zusätzlichen Schlüssel.
// Aufrufen darf NUR der GitHub-Ablauf .github/workflows/db-einspielen.yml aus Sire65/KC-Clubapp auf main – geprüft über das
// von GitHub signierte OIDC-Token (kein Geheimnis im Repository). Die Funktion kennt nur den Auftrag aus auftrag.ts, der
// im Ablauf kurz befüllt und danach wieder geleert wird. Ablauf: erst Probelauf (Transaktion bricht mit TESTBERICHT ab = alles
// zurückgerollt), nur bei grünem Probelauf einspielen (eine Transaktion) und Nachprüfung. Antworten enthalten keine Daten.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";
import { AUFTRAG } from "./auftrag.ts";

const JSON_KOPF = { "Content-Type": "application/json" };
const antwort = (status: number, daten: unknown) => new Response(JSON.stringify(daten), { status, headers: JSON_KOPF });
const GITHUB = "https://token.actions.githubusercontent.com";
const JWKS = createRemoteJWKSet(new URL(GITHUB + "/.well-known/jwks"));
const ABLAUF = "Sire65/KC-Clubapp/.github/workflows/db-einspielen.yml@refs/heads/main";

async function berechtigt(req: Request) {
  const t = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!t) return false;
  try {
    const { payload: p } = await jwtVerify(t, JWKS, { issuer: GITHUB, audience: "kc-db-einspielen", maxTokenAge: "10m" });
    return p.repository === "Sire65/KC-Clubapp" && p.ref === "refs/heads/main" && p.workflow_ref === ABLAUF && p.event_name === "workflow_dispatch";
  } catch { return false; }
}

async function probelauf(sql: postgres.Sql, a: NonNullable<typeof AUFTRAG>) {
  const test = a.test || "do $p$ begin raise exception 'TESTBERICHT (alles wird zurückgerollt): | einspielbar'; end $p$;";
  let bericht = "";
  try { await sql.unsafe(`begin;\n${a.migration}\n${test}`); bericht = "kein Abbruch – Test unvollständig"; }
  catch (e) { const x = e as { message?: string; where?: string; position?: string }; bericht = String(x?.message || e) + (x?.where ? " | Stelle: " + x.where : "") + (x?.position ? " | Position: " + x.position : ""); }
  finally { await sql.unsafe("rollback").catch(() => {}); }
  const fehlt = a.erwartet.filter((z) => !bericht.includes(z));
  const ok = bericht.includes("TESTBERICHT") && !bericht.includes("KEIN FEHLER") && fehlt.length === 0;
  return { ok, bericht: bericht.slice(0, 2000), fehlt };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return antwort(405, { error: "POST erforderlich" });
  if (!(await berechtigt(req))) return antwort(401, { error: "nicht berechtigt" });
  if (!AUFTRAG) return antwort(410, { error: "kein Auftrag" });
  let modus = "";
  try { modus = String((await req.json())?.modus || ""); } catch { /* leer */ }
  if (modus !== "pruefen" && modus !== "einspielen") return antwort(400, { error: "modus: pruefen oder einspielen" });
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false, connect_timeout: 15, idle_timeout: 10 });
  try {
    const probe = await probelauf(sql, AUFTRAG);
    if (!probe.ok || modus === "pruefen") return antwort(probe.ok ? 200 : 409, { modus, probelauf: probe });
    const version = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    await sql.begin(async (tx) => {
      await tx.unsafe(AUFTRAG.migration);
      await tx.unsafe("insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, $3)",
        [version, AUFTRAG.name, ["eingespielt über KC-CLUB-DB-EINSPIELEN"]]);
    });
    const r = await sql.unsafe(AUFTRAG.nachpruefung || "select true as ok");
    const nach = r?.[0] ? Object.values(r[0])[0] === true : false;
    return antwort(nach ? 200 : 500, { modus, probelauf: probe, eingespielt: true, version, nachpruefung: nach });
  } catch (e) {
    return antwort(500, { modus, error: String((e as Error)?.message || e).slice(0, 500) });
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }
});
