// KC-CLUB-NOTBETRIEB (1.52.0): Ersatz-Server der Club-App bei Cloudflare (kostenlos).
// Fällt Supabase aus, schaltet die App hierher um. Dieser Server rechnet nichts selbst: Er gibt jedem Mitglied die
// Antworten zurück, die der Club-Server vorher genau für dieses Mitglied berechnet hat (gleiche Rechte, eine Regel).
// - POST /paket  Notfall-Paket vom Club-Server (gzip, Ed25519-signiert) → Speicher (KV „PAKET“)
// - POST /stand  „nichts geändert, Stand ist aktuell“ (signiert, klein)
// - GET  /status Ist der Ersatz-Server da, wie alt ist der Stand? (ohne Daten)
// - POST /       Anfrage der App wie beim Club-Server ({ action, … } + Kopfzeile x-club-token)
// Nur lesende Aktionen; alles andere bekommt eine klare Meldung (UNKNOWN nie als OK). Keine Geheimnisse hier:
// der Prüfschlüssel ist öffentlich, der Zugang des Mitglieds wird nur als Prüfwert (SHA-256) verglichen.
const LESEN = new Set(["init", "mitglieder", "treffen_liste", "sos_kontakte", "pinnwand", "unterhaltungen", "todo_liste", "dienste", "unterhaltung"]);
// Hintergrund-Abfragen der App: im Notbetrieb still mit „nichts Neues“ beantworten (sonst Fehlermeldungen im Sekundentakt)
const STILL = {
  ping: () => ({ ok: true }),
  lebenszeichen: () => ({ ok: true }),
  online: () => ({ zeigen: false, online: [], klopfen: [], antworten: [], anrufe: [], verpasst: [] }),
  tippen: () => ({ ok: true }),
  fehler_melden: () => ({ ok: true, gespeichert: 0 }),
  fehler_anonym: () => ({ ok: true, gespeichert: 0 }),
};
const NICHT_MOEGLICH = "Im Notbetrieb gerade nicht möglich – bitte später noch einmal versuchen.";

let CACHE = null; // { stand, erstellt, mitglieder } je Server-Instanz

const kopf = (env, extra = {}) => ({
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": env.APP_HERKUNFT || "*",
  "access-control-allow-headers": "content-type, x-club-token, x-club-version",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "cache-control": "no-store",
  ...extra,
});
const antwort = (env, daten, status = 200) => new Response(JSON.stringify(daten), { status, headers: kopf(env) });
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
const b64bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function signaturOk(env, roh, sigB64) {
  if (!sigB64 || !env.PRUEFSCHLUESSEL) return false;
  try {
    // nur kty/crv/x verwenden: Deno schreibt alg „Ed25519“, Cloudflare erwartet „EdDSA“ – ohne alg passt beides
    const { kty, crv, x } = JSON.parse(env.PRUEFSCHLUESSEL);
    const schluessel = await crypto.subtle.importKey("jwk", { kty, crv, x }, { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify({ name: "Ed25519" }, schluessel, b64bytes(sigB64), roh);
  } catch { return false; }
}
async function entpacken(roh) {
  const s = new Blob([roh]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(s).text());
}
async function paketHolen(env) {
  const stand = await env.PAKET.get("stand", "json");
  if (CACHE && stand && CACHE.erstellt === stand.erstellt) { CACHE.stand = stand.stand; return CACHE; }
  const roh = await env.PAKET.get("paket", "arrayBuffer");
  if (!roh) return null;
  const p = await entpacken(roh);
  CACHE = { erstellt: p.erstellt, stand: stand?.stand || p.stand, mitglieder: p.mitglieder || {} };
  return CACHE;
}

async function paketAnnehmen(req, env) {
  const roh = new Uint8Array(await req.arrayBuffer());
  if (roh.length > 20 * 1024 * 1024) return antwort(env, { error: "zu groß" }, 413);
  if (!(await signaturOk(env, roh, req.headers.get("x-kc-signatur")))) return antwort(env, { error: "Signatur ungültig" }, 401);
  const p = await entpacken(roh);
  const alt = await env.PAKET.get("stand", "json");
  if (alt && String(p.erstellt) <= String(alt.erstellt)) return antwort(env, { error: "älter als der vorhandene Stand" }, 409);
  await env.PAKET.put("paket", roh);
  await env.PAKET.put("stand", JSON.stringify({ erstellt: p.erstellt, stand: p.stand, fingerabdruck: p.fingerabdruck || null }));
  CACHE = null;
  return antwort(env, { ok: true, mitglieder: Object.keys(p.mitglieder || {}).length });
}
async function standAnnehmen(req, env) {
  const roh = new Uint8Array(await req.arrayBuffer());
  if (!(await signaturOk(env, roh, req.headers.get("x-kc-signatur")))) return antwort(env, { error: "Signatur ungültig" }, 401);
  const neu = JSON.parse(new TextDecoder().decode(roh)), alt = await env.PAKET.get("stand", "json");
  if (!alt) return antwort(env, { error: "noch kein Paket" }, 409);
  if (neu.fingerabdruck !== alt.fingerabdruck) return antwort(env, { error: "Fingerabdruck passt nicht – bitte neues Paket" }, 409);
  if (String(neu.stand) <= String(alt.stand)) return antwort(env, { ok: true });
  await env.PAKET.put("stand", JSON.stringify({ ...alt, stand: neu.stand }));
  return antwort(env, { ok: true });
}

async function appAnfrage(req, env) {
  let p; try { p = await req.json(); } catch { return antwort(env, { error: "Ungültige Anfrage" }, 400); }
  const a = String(p?.action || ""), token = req.headers.get("x-club-token") || "";
  if (!/^[0-9a-f]{32,96}$/.test(token)) return antwort(env, { error: "Kein Zugang – bitte den persönlichen Link neu öffnen.", notbetrieb: true }, 401);
  if (STILL[a]) return antwort(env, { ...STILL[a](), _notbetrieb: true });
  const paket = await paketHolen(env);
  if (!paket) return antwort(env, { error: "Der Notbetrieb ist noch nicht bereit.", notbetrieb: true }, 503);
  const m = paket.mitglieder[hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))];
  if (!m) return antwort(env, { error: "Kein Zugang – bitte den persönlichen Link neu öffnen.", notbetrieb: true }, 401);
  const nb = { stand: paket.stand };
  if (!LESEN.has(a)) return antwort(env, { error: NICHT_MOEGLICH, notbetrieb: true, _notbetrieb: nb }, 409);
  const daten = m.antworten?.[a === "unterhaltung" ? "unterhaltung:" + String(p.id || "") : a];
  if (!daten) return antwort(env, { error: a === "unterhaltung" ? "Dieser Chat ist im Notbetrieb nicht dabei." : NICHT_MOEGLICH, notbetrieb: true, _notbetrieb: nb }, 409);
  return antwort(env, { ...daten, _notbetrieb: nb });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: kopf(env) });
    try {
      if (req.method === "GET" && url.pathname === "/status") {
        // ohne Daten → für jede Herkunft lesbar (KC Check prüft den Notbetrieb auch lokal vom PC aus)
        const st = await env.PAKET.get("stand", "json");
        return new Response(JSON.stringify({ ok: !!st, notbetrieb: true, stand: st?.stand || null }), { headers: kopf(env, { "access-control-allow-origin": "*" }) });
      }
      if (req.method === "POST" && url.pathname === "/paket") return await paketAnnehmen(req, env);
      if (req.method === "POST" && url.pathname === "/stand") return await standAnnehmen(req, env);
      if (req.method === "POST" && url.pathname === "/") return await appAnfrage(req, env);
      return antwort(env, { error: "Nicht gefunden" }, 404);
    } catch (e) {
      return antwort(env, { error: "Ersatz-Server: " + String(e?.message || e).slice(0, 200), notbetrieb: true }, 500);
    }
  },
};
