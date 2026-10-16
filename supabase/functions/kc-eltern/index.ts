// KC-CLUB-ELTERN (2.431.0, Wunsch Hansi): Eltern-Handy für Kinder – Edge Function „kc-eltern“.
// Sachte, die Kinder brauchen Privatsphäre: Eltern bekommen NUR einen Push, wenn das Kind einen Termin hat (Club-Treffen neu/geändert/
// abgesagt, Erinnerung, Schulungen) oder eine Nachricht der Clubleitung/des Admins bekommt (nur ein Hinweis, ohne Text). Chats unter
// Mitgliedern, Anklopfen, Spiele, Pinnwand gehen nie an Eltern – das entscheiden die Aufrufer (kc-club, kc-termine), hier gibt es keinen
// Weg, beliebigen Text an Eltern zu schicken, außer für den Server selbst (Dienstschlüssel).
// Öffentlich (Elternseite eltern/, ohne Anmeldung, nur mit dem Schlüssel aus dem WhatsApp-Link – gespeichert nur als SHA-256):
//   info · anmelden (Push-Anmeldung speichern) · abmelden (Benachrichtigungen aus).
// Intern (nur mit dem Dienstschlüssel des Projekts): senden { kinder, art, titel, text, url }.
// Versand wie im KC Communicator (gleicher VAPID-Schlüssel, web-push 3.6.7); abgelaufene Anmeldungen werden entfernt.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPA = Deno.env.get("SUPABASE_URL")!, SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPA, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization, apikey", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "7200" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const TZ = "Europe/Berlin";
// erlaubte Push-Dienste der Browser (wie kc-club PUSH_DIENSTE)
const PUSH_DIENSTE = ["googleapis.com", "mozilla.com", "push.apple.com", "notify.windows.com"];
// Arten, die Eltern bekommen dürfen – sonst nichts
const ARTEN = new Set(["termin", "erinnerung", "absage", "schulung", "nachricht", "notfall"]);
const NACHRICHT_PAUSE_MS = 20 * 60000; // Hinweis „Nachricht der Clubleitung“ höchstens alle 20 Min. je Eltern-Handy (sachte)

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function gleichZeit(a: unknown, b: string) {
  const x = new TextEncoder().encode(String(a ?? "")), y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < y.length; i++) d |= (x[i] ?? 0) ^ y[i];
  return d === 0;
}
const txt = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const stundeBerlin = () => Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(new Date()));
const nachts = () => { const h = stundeBerlin(); return h >= 22 || h < 7; };
const geheim = async (name: string) => (await db.rpc("kc_communication_get_server_secret", { p_name: name })).data as string | null;
const vorname = (p: any) => String(p?.preferred_name || p?.given_name || String(p?.display_name || "").split(" ")[0] || "dein Kind");

async function elternZumSchluessel(e: unknown) {
  const s = String(e ?? "");
  if (!/^[0-9a-f]{40,96}$/.test(s)) return null;
  const { data } = await db.from("kc_club_eltern").select("id,kind,name,aktiv,angemeldet_am,subscription").eq("token_hash", await sha256(s)).maybeSingle();
  return data && data.aktiv ? data : null;
}

let VAPID_GESETZT = false;
async function vapidSetzen() {
  if (VAPID_GESETZT) return true;
  const [pub, priv, subject] = await Promise.all([geheim("kc_communication_vapid_public_key"), geheim("kc_communication_vapid_private_key"), geheim("kc_communication_vapid_subject")]);
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject || "mailto:admin@koecheclub-werne.de", pub, priv); VAPID_GESETZT = true; return true;
}

async function senden(kinder: string[], art: string, titel: string, text: string, url: string) {
  const ids = [...new Set(kinder.filter((x) => /^KC-P-[A-Z0-9-]{1,30}$/i.test(x)))].slice(0, 500);
  if (!ids.length || !ARTEN.has(art)) return { gesendet: 0, fehler: 0 };
  if (art !== "notfall" && nachts()) return { gesendet: 0, fehler: 0, nachts: true }; // sachte: nachts (22–7 Uhr) nichts an Eltern
  const { data: liste } = await db.from("kc_club_eltern").select("id,kind,subscription,letzter_nachricht_hinweis").in("kind", ids).eq("aktiv", true).not("subscription", "is", null);
  if (!(liste ?? []).length || !(await vapidSetzen())) return { gesendet: 0, fehler: 0 };
  // „{kind}“ im Text → Vorname des Kindes (je Eltern-Handy das eigene Kind)
  const { data: leute } = await db.from("kc_core_people").select("person_id,display_name,given_name,preferred_name").in("person_id", [...new Set((liste ?? []).map((x: any) => x.kind))]);
  const vn = new Map((leute ?? []).map((x: any) => [x.person_id, vorname(x)]));
  let gesendet = 0, fehler = 0;
  for (const e of liste ?? []) {
    if (art === "nachricht" && e.letzter_nachricht_hinweis && Date.now() - Date.parse(e.letzter_nachricht_hinweis) < NACHRICHT_PAUSE_MS) continue;
    const k = vn.get(e.kind) || "dein Kind", fuell = (t: string) => t.replaceAll("{kind}", k);
    const nutzlast = JSON.stringify({ title: txt(fuell(titel), 140), body: txt(fuell(text), 300), data: { url: url || "./" } });
    try {
      await webpush.sendNotification(e.subscription, nutzlast, { TTL: 86400, urgency: art === "notfall" ? "high" : "normal" });
      gesendet++;
      await db.from("kc_club_eltern").update({ letzter_push: new Date().toISOString(), ...(art === "nachricht" ? { letzter_nachricht_hinweis: new Date().toISOString() } : {}) }).eq("id", e.id);
    } catch (x: any) {
      fehler++;
      // Anmeldung abgelaufen (404/410) → entfernen; die Eltern sehen auf ihrer Seite „ausgeschaltet“ und können neu einschalten
      if (x?.statusCode === 404 || x?.statusCode === 410) await db.from("kc_club_eltern").update({ subscription: null, endpoint: null }).eq("id", e.id);
      else console.error("kc-eltern push", x?.statusCode, String(x?.body || x?.message || x).slice(0, 200));
    }
  }
  return { gesendet, fehler };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST erwartet" }, 405);
  let p: any; try { p = await req.json(); } catch { return json({ error: "Ungültige Anfrage" }, 400); }
  const a = String(p?.action || "");
  try {
    // ----- intern: nur der Server selbst (Dienstschlüssel), nie die App -----
    if (a === "senden") {
      const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!auth || !gleichZeit(auth, SERVICE)) return json({ error: "Kein Zugang" }, 401);
      return json({ ok: true, ...(await senden(Array.isArray(p.kinder) ? p.kinder.map(String) : [], String(p.art || ""), String(p.titel || ""), String(p.text || ""), txt(p.url, 300))) });
    }
    // ----- öffentlich: Elternseite mit dem Schlüssel aus dem Link -----
    const e = await elternZumSchluessel(p.e);
    if (!e) return json({ error: "Dieser Link gilt nicht (mehr). Bitte beim Köcheclub einen neuen anfordern." }, 404);
    if (a === "info") {
      const [{ data: k }, pub] = await Promise.all([db.from("kc_core_people").select("display_name,given_name,preferred_name").eq("person_id", e.kind).maybeSingle(), geheim("kc_communication_vapid_public_key")]);
      return json({ ok: true, kind: vorname(k), name: e.name, an: !!e.subscription, vapidPublicKey: pub || null });
    }
    if (a === "anmelden") {
      const s = p.subscription;
      const endpunkt = String(s?.endpoint || ""), p256 = String(s?.keys?.p256dh || ""), auth = String(s?.keys?.auth || "");
      if (!/^https:\/\//.test(endpunkt) || !p256 || !auth || endpunkt.length > 1000 || p256.length > 200 || auth.length > 100) return json({ error: "Anmeldung unvollständig – bitte nochmal versuchen." }, 400);
      let host = ""; try { host = new URL(endpunkt).hostname.toLowerCase(); } catch {}
      if (!PUSH_DIENSTE.some((d) => host === d || host.endsWith("." + d))) return json({ error: "Dieser Browser nutzt einen unbekannten Push-Dienst – bitte Chrome, Firefox, Safari, Edge oder Samsung Internet verwenden." }, 400);
      const sub = { endpoint: endpunkt, expirationTime: null, keys: { p256dh: p256, auth } };
      const { error } = await db.from("kc_club_eltern").update({ subscription: sub, endpoint: endpunkt, angemeldet_am: new Date().toISOString() }).eq("id", e.id);
      if (error) return json({ error: "Das hat gerade nicht geklappt – bitte gleich nochmal versuchen." }, 500);
      await db.from("kc_club_protokoll").insert({ person_id: e.kind, aktion: "eltern_angemeldet", details: { eltern: e.id } });
      return json({ ok: true, an: true });
    }
    if (a === "abmelden") {
      await db.from("kc_club_eltern").update({ subscription: null, endpoint: null }).eq("id", e.id);
      await db.from("kc_club_protokoll").insert({ person_id: e.kind, aktion: "eltern_abgemeldet", details: { eltern: e.id } });
      return json({ ok: true, an: false });
    }
    return json({ error: "Unbekannte Aktion" }, 400);
  } catch (x) {
    console.error("kc-eltern", x);
    return json({ error: "Das hat gerade nicht geklappt – bitte gleich nochmal versuchen." }, 500);
  }
});
