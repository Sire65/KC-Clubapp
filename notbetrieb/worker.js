// KC-CLUB-NOTBETRIEB (1.52.0): Ersatz-Server der Club-App bei Cloudflare (kostenlos).
// Fällt Supabase aus, schaltet die App hierher um. Dieser Server rechnet nichts selbst: Er gibt jedem Mitglied die
// Antworten zurück, die der Club-Server vorher genau für dieses Mitglied berechnet hat (gleiche Rechte, eine Regel).
// - POST /paket  Notfall-Paket vom Club-Server (gzip, Ed25519-signiert) → Speicher (KV „PAKET“)
// - POST /stand  „nichts geändert, Stand ist aktuell“ (signiert, klein)
// - GET  /status Ist der Ersatz-Server da, wie alt ist der Stand? (ohne Daten)
// - POST /       Anfrage der App wie beim Club-Server ({ action, … } + Kopfzeile x-club-token)
// - POST /eingang/abholen, /eingang/quittieren  nur für den Club-Server (signiert, mit Zeitstempel)
// Lesen wie beim Club-Server. Stufe 2 (1.54.0): Nachricht in einem bestehenden Chat, Zu-/Absage, Status und Pinnwand-Zettel
// werden NICHT ausgeführt, sondern in einen Eingang gelegt (KV „e:…“). Sobald der Club-Server wieder läuft, holt er den
// Eingang ab und trägt jeden Eintrag über seine normalen Funktionen nach (gleiche Prüfungen, Push/Mail, nichts doppelt).
// Alles andere bekommt eine klare Meldung (UNKNOWN nie als OK). Keine Geheimnisse hier: der Prüfschlüssel ist öffentlich,
// der Zugang des Mitglieds wird nur als Prüfwert (SHA-256) gespeichert und verglichen.
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
// KC-CLUB-NOTBETRIEB-STUFE2: was im Notbetrieb angenommen wird – nur die nötigen Felder, geprüft und gekürzt.
// Die eigentliche Prüfung (Rechte, Treffen noch offen, …) macht beim Nachtragen der Club-Server mit seinen normalen Regeln.
const STATUS_WERTE = ["verfuegbar", "beschaeftigt", "urlaub", "krank", "abwesend"];
const kurz = (v, n) => String(v ?? "").trim().slice(0, n);
const SCHREIBEN = {
  nachricht_senden: (p, m) => {
    const id = kurz(p.id, 60), text = kurz(p.text, 4000);
    if (!id || !m.antworten?.["unterhaltung:" + id]) return "Neue Chats gehen im Notbetrieb nicht – bitte einen Chat aus der Liste öffnen und dort schreiben.";
    if (p.umfrage || p.kontakt || (Array.isArray(p.anlagen) && p.anlagen.length)) return "Im Notbetrieb geht nur Text – Fotos, Anlagen, Abstimmungen und Kontakte später.";
    if (!text) return "Bitte eine Nachricht schreiben.";
    return { id, text, wichtig: !!p.wichtig, wege: (Array.isArray(p.wege) ? p.wege : []).filter((w) => w === "push" || w === "email") };
  },
  treffen_antwort: (p) => {
    const antwort = kurz(p.antwort, 12);
    if (!["ja", "nein", "vielleicht", "keine"].includes(antwort)) return "Bitte zusagen, absagen oder vielleicht wählen.";
    return { id: kurz(p.id, 60), antwort, notiz: kurz(p.notiz, 300) };
  },
  status_setzen: (p) => {
    const status = kurz(p.status, 20);
    if (!STATUS_WERTE.includes(status)) return "Unbekannter Status.";
    return { status, bis: /^\d{4}-\d{2}-\d{2}$/.test(String(p.bis || "")) ? String(p.bis) : "", hinweis: kurz(p.hinweis, 120) };
  },
  pinnwand_anheften: (p) => {
    const text = kurz(p.text, 400), fuer = ["ich", "alle", "personen"].includes(p.fuer) ? p.fuer : "";
    if (!text) return "Bitte einen kurzen Text schreiben.";
    if (!fuer) return "Bitte wählen: nur für mich, für alle oder für bestimmte Personen.";
    return { text, fuer, wichtig: !!p.wichtig, personen: (Array.isArray(p.personen) ? p.personen : []).map((x) => kurz(x, 40)).filter(Boolean).slice(0, 60) };
  },
};
const EINGANG_JE_MITGLIED = 40, ABHOLEN_MAX = 500, SIGNATUR_ZEIT_MS = 5 * 60000;

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

// Signierte Anfrage des Club-Servers (Abholen/Quittieren): Zweck und Zeitstempel prüfen – alte Anfragen gelten nicht
async function serverAnfrage(req, env, zweck) {
  const roh = new Uint8Array(await req.arrayBuffer());
  if (!(await signaturOk(env, roh, req.headers.get("x-kc-signatur")))) return null;
  let j; try { j = JSON.parse(new TextDecoder().decode(roh)); } catch { return null; }
  if (j?.zweck !== zweck || Math.abs(Date.now() - Date.parse(j.zeit)) > SIGNATUR_ZEIT_MS) return null;
  return j;
}
async function eingangAbholen(req, env) {
  if (!(await serverAnfrage(req, env, "abholen"))) return antwort(env, { error: "Signatur ungültig" }, 401);
  const liste = await env.PAKET.list({ prefix: "e:", limit: ABHOLEN_MAX });
  const eintraege = [];
  for (const k of liste.keys) { const v = await env.PAKET.get(k.name, "json"); if (v) eintraege.push({ schluessel: k.name, ...v }); }
  return antwort(env, { ok: true, eintraege, weitere: !liste.list_complete });
}
async function eingangQuittieren(req, env) {
  const j = await serverAnfrage(req, env, "quittieren");
  if (!j) return antwort(env, { error: "Signatur ungültig" }, 401);
  const ids = (Array.isArray(j.schluessel) ? j.schluessel : []).filter((k) => typeof k === "string" && k.startsWith("e:")).slice(0, ABHOLEN_MAX);
  for (const k of ids) await env.PAKET.delete(k);
  return antwort(env, { ok: true, geloescht: ids.length });
}
// Eintrag in den Eingang legen. notId (von der App) macht Wiederholungen harmlos: derselbe Eintrag wird nicht doppelt gelegt.
async function eingangLegen(env, hash, m, a, p, nb) {
  const daten = SCHREIBEN[a](p, m);
  if (typeof daten === "string") return antwort(env, { error: daten, notbetrieb: true, _notbetrieb: nb }, 409);
  const notId = /^[0-9a-zA-Z-]{8,64}$/.test(String(p.notId || "")) ? String(p.notId) : crypto.randomUUID();
  const vorne = "e:" + hash.slice(0, 16) + ":", schluessel = vorne + notId;
  if (!(await env.PAKET.get(schluessel))) {
    const meine = await env.PAKET.list({ prefix: vorne, limit: EINGANG_JE_MITGLIED + 1 });
    if (meine.keys.length >= EINGANG_JE_MITGLIED) return antwort(env, { error: "Im Notbetrieb sind schon sehr viele Einträge von dir gespeichert – bitte warten, bis alles wieder läuft.", notbetrieb: true, _notbetrieb: nb }, 429);
    await env.PAKET.put(schluessel, JSON.stringify({ notId, hash, person_id: m.person_id || null, aktion: a, daten, zeit: new Date().toISOString() }));
  }
  return antwort(env, { ok: true, gespeichert: true, notId, id: a === "nachricht_senden" ? daten.id : undefined, hinweis: "📨 Gespeichert – wird übertragen, sobald alles wieder läuft.", _notbetrieb: nb });
}

async function appAnfrage(req, env) {
  let p; try { p = await req.json(); } catch { return antwort(env, { error: "Ungültige Anfrage" }, 400); }
  const a = String(p?.action || ""), token = req.headers.get("x-club-token") || "";
  if (!/^[0-9a-f]{32,96}$/.test(token)) return antwort(env, { error: "Kein Zugang – bitte den persönlichen Link neu öffnen.", notbetrieb: true }, 401);
  if (STILL[a]) return antwort(env, { ...STILL[a](), _notbetrieb: true });
  const paket = await paketHolen(env);
  if (!paket) return antwort(env, { error: "Der Notbetrieb ist noch nicht bereit.", notbetrieb: true }, 503);
  const hash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))), m = paket.mitglieder[hash];
  if (!m) return antwort(env, { error: "Kein Zugang – bitte den persönlichen Link neu öffnen.", notbetrieb: true }, 401);
  const nb = { stand: paket.stand };
  if (SCHREIBEN[a]) return await eingangLegen(env, hash, m, a, p, nb); // KC-CLUB-NOTBETRIEB-STUFE2
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
      if (req.method === "POST" && url.pathname === "/eingang/abholen") return await eingangAbholen(req, env);
      if (req.method === "POST" && url.pathname === "/eingang/quittieren") return await eingangQuittieren(req, env);
      if (req.method === "POST" && url.pathname === "/") return await appAnfrage(req, env);
      return antwort(env, { error: "Nicht gefunden" }, 404);
    } catch (e) {
      return antwort(env, { error: "Ersatz-Server: " + String(e?.message || e).slice(0, 200), notbetrieb: true }, 500);
    }
  },
};
