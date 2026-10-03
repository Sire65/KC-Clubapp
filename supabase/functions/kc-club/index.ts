// KC Club-App (Köcheclub Werne) – Server (Edge Function kc-club), ab App-Version 0.1.0
// Zugang: persönlicher Link ?k=<token> → Kopfzeile x-club-token (nur SHA-256 in kc_club_zugang gespeichert).
// Zeitplaner (pg_cron): action "wartung" mit cronSecret aus dem Vault (kc_club_cron_secret) → Erinnerungen am Vortag.
// Nutzt vorhandene Kerne: kc_core_people, kc_communication_threads/_thread_participants/_messages,
// kc_communication_attachments (+ Bucket), kc_member_push_subscriptions, KC Communicator Router (Push/Mail über web.de).
// Features: KC-CLUB-STATUS, KC-CLUB-ZUGANG, KC-CLUB-TREFFEN, KC-CLUB-NACHRICHTEN, KC-CLUB-ANLAGEN, KC-CLUB-PUSH, KC-CLUB-ADMIN,
//           KC-CLUB-VORSCHLAG (0.2.0), KC-CLUB-OHNEAPP (0.2.0), KC-CLUB-DIENSTE (0.2.0),
//           KC-CLUB-BENACHRICHTIGUNG (0.3.0), KC-CLUB-DIENSTERINNERUNG (0.3.0), KC-CLUB-KALENDER (0.6.0),
//           KC-CLUB-GEBURTSTAG-FREIGABE (0.7.0), KC-CLUB-GEBURTSTAG-PUSH (0.8.0), KC-CLUB-VERANSTALTUNG (0.8.0),
//           KC-CLUB-PROTOKOLLE (0.9.0), KC-CLUB-AUFGABEN (0.9.0), KC-CLUB-AKTIONEN (0.10.0), KC-CLUB-LOESCHEN (0.11.0),
//           KC-CLUB-KONTAKT (0.13.0), KC-CLUB-TERMINFINDUNG, KC-CLUB-NACHFASSEN, KC-CLUB-MITFAHREN, KC-CLUB-NOTFALL, KC-CLUB-KALENDERABO (0.14.0),
//           KC-CLUB-FOTOALBUM (0.15.0), KC-CLUB-VERBINDUNG (0.16.0),
//           KC-CLUB-COMMUNICATOR-STATUS (0.17.0), KC-CLUB-FEEDBACK (0.18.0),
//           KC-CLUB-KACHELN (0.19.0), KC-CLUB-ZUGANG-SELBST (0.21.0),
//           KC-CLUB-GRUPPEN, KC-CLUB-ZUSTELLWAHL (0.23.0)
//           KC-CLUB-DESIGN (0.24.0), KC-CLUB-PINNWAND (0.25.0), KC-CLUB-KACHELN-ZIEHEN (0.26.0), KC-CLUB-FEEDBACK-NEU (0.27.1), KC-CLUB-BEGRUESSUNG (0.28.0), KC-CLUB-ONLINE (0.29.0), KC-CLUB-ANRUF (0.31.0), KC-CLUB-VIDEO (0.32.0), KC-CLUB-QUITTUNG (0.34.0), KC-CLUB-TODO + KC-CLUB-REGISTER-ZIEHEN (0.36.0), KC-CLUB-SPRACHE + KC-CLUB-TODO-ZUSTAENDIG (0.37.0), KC-CLUB-ERSTATTUNG (0.38.0), KC-CLUB-KMSATZ (0.39.0), KC-CLUB-FEEDBACK-DAUERHAFT (0.40.0), KC-CLUB-INFOFELD + KC-CLUB-WETTER (0.42.0), KC-CLUB-INFOFELD-DEMNAECHST/-FOTOS (0.43.0), KC-CLUB-ZENTRALE (0.44.0), KC-CLUB-FOTO-META (0.45.0), KC-CLUB-WETTER-TAGE (0.46.0), KC-CLUB-ADMINLAGE (0.47.0), KC-CLUB-ADMIN-SPIEGEL (0.48.0/0.49.0), KC-CLUB-TODO-MEHRERE (0.52.0), KC-CLUB-DRUCK + KC-CLUB-AUFGABEN-MEHRERE (0.53.0)
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPA = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPA, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const SERVER_VERSION = "1.73.0";
const ORG = "KC_WERNE";
const TZ = "Europe/Berlin";
const APP_URL = "https://sire65.github.io/KC-Clubapp/";
const BUCKET = "kc-communication-attachments";
const MAX_ANLAGE = 8 * 1024 * 1024;
const SYSTEM_UPLOADER = "KC-P-002"; // Pflichtfeld uploaded_by (Benutzer-ID) – die eigentliche Person steht im Pfad und in der Verknüpfung

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-club-token, x-club-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
class Fehler extends Error { constructor(msg: string, public status = 400) { super(msg); } }

// ---------- Hilfen ----------
async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function zufall(bytes = 24) { const a = new Uint8Array(bytes); crypto.getRandomValues(a); return [...a].map((x) => x.toString(16).padStart(2, "0")).join(""); }
const jetzt = () => new Date().toISOString();
const fTag = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit" });
const fTagLang = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
const fZeit = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const berlinTag = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const berlinStunde = (d: Date) => Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", hour: "2-digit" }).format(d));
const wann = (iso: string, lang = false) => `${(lang ? fTagLang : fTag).format(new Date(iso))}, ${fZeit.format(new Date(iso))} Uhr`;
const txt = (v: unknown, max: number) => String(v ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").trim().slice(0, max);

type Person = { person_id: string; display_name: string; given_name?: string; preferred_name?: string; email?: string };
const vorname = (p?: Person | null) => (p ? p.preferred_name || p.given_name || p.display_name : "");
async function personen(ids: string[]): Promise<Map<string, Person>> {
  const u = [...new Set(ids.filter(Boolean))];
  if (!u.length) return new Map();
  const { data } = await db.from("kc_core_people").select("person_id,display_name,given_name,preferred_name,email").in("person_id", u);
  return new Map((data ?? []).map((p: Person) => [p.person_id, p]));
}
async function aktiveMitglieder() {
  // birth_date nur für „Geburtstag heute“ – wird nie ungefiltert an die App gegeben
  const { data } = await db.from("kc_core_people").select("person_id,display_name,given_name,family_name,preferred_name,email,birth_date")
    .eq("active", true).eq("org_id", ORG).not("person_id", "like", "KC-P-TEST%").order("display_name");
  return (data ?? []) as (Person & { birth_date?: string })[];
}
async function protokoll(person: string | null, aktion: string, details: Record<string, unknown> = {}) {
  await db.from("kc_club_protokoll").insert({ person_id: person, aktion, details });
}
// KC-CLUB-LOESCHEN: vor jedem Löschen eine vollständige Sicherung ins Änderungsprotokoll (Wiederherstellungspunkt)
async function geloescht(ich: { person_id: string }, was: string, sicherung: Record<string, unknown>) {
  const { error } = await db.from("kc_club_protokoll").insert({ person_id: ich.person_id, aktion: was + "_geloescht", details: { sicherung } });
  if (error) throw new Fehler("Sicherung fehlgeschlagen – es wurde nichts gelöscht.", 500);
}

// Versand über den KC Communicator (Push, sonst/zusätzlich Mail über web.de).
async function routerSenden(eventKey: string, personIds: string[], vars: Record<string, unknown>, korrelation: string, kopie?: { cc?: string[]; bcc?: string[] }) {
  const r = await fetch(`${SUPA}/functions/v1/kc-communication-router`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE}`, apikey: SERVICE },
    body: JSON.stringify({ sourceProgram: "kc-club", eventKey, recipients: personIds.map((personId) => ({ personId })), variables: vars, correlationId: korrelation,
      // 0.38.0: Kopien (Mitgliedsnummern) – der Communicator löst sie zu Mail-Adressen auf
      ...(kopie?.cc?.length ? { cc: kopie.cc.map((personId) => ({ personId })) } : {}), ...(kopie?.bcc?.length ? { bcc: kopie.bcc.map((personId) => ({ personId })) } : {}) }),
  });
  const out = await r.json().catch(() => ({}));
  return { gesendet: Number(out?.sent || 0), fehler: Number(out?.failed || 0) };
}
// KC-CLUB-BENACHRICHTIGUNG: Ereignis → Bereich, den das Mitglied in den Einstellungen steuert
const BEREICH_VON: Record<string, string> = { club_treffen: "termine", club_erinnerung: "termine", club_nachricht: "nachrichten", club_vorschlag: "vorschlaege", club_dienst: "dienste", club_geburtstag: "geburtstage",
  club_protokoll: "termine", club_aufgabe: "termine", club_pinnwand: "pinnwand" };
const BEREICHE = ["termine", "nachrichten", "vorschlaege", "dienste", "geburtstage", "pinnwand"];
// Anzeige-Standard, solange nichts gespeichert ist (Server nutzt dann die bisherige Standardregel)
const STANDARD_WAHL: Record<string, { push: boolean; email: boolean }> = { termine: { push: true, email: true }, nachrichten: { push: true, email: false }, vorschlaege: { push: true, email: false }, dienste: { push: false, email: false }, geburtstage: { push: true, email: false }, pinnwand: { push: true, email: false } };
// ---------- KC-CLUB-RUHEZEIT (0.98.0): „Nicht stören“ ----------
// Wer „Nicht stören“ eingeschaltet hat, bekommt in dieser Zeit keinen Push. Mail geht weiter (stört nachts nicht).
// Was dabei ausfällt, wird gezählt; nach dem Ende der Ruhezeit schickt die Wartung EINE Sammelmeldung.
// Anrufe/Anklopfen laufen nicht über senden() und kommen deshalb immer durch; @Erwähnungen, wenn so eingestellt.
const minutenBerlin = (d = new Date()) => { const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d).split(":").map(Number); return h * 60 + m; };
const hhmm = (x: string) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3, 5));
function inRuhezeit(r: any, jetztMin = minutenBerlin()) {
  if (!r?.an) return false;
  const v = hhmm(r.von), b = hhmm(r.bis);
  return v === b ? false : v < b ? jetztMin >= v && jetztMin < b : jetztMin >= v || jetztMin < b;
}
async function ruhendePersonen(ids: string[], erwaehnung = false): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const { data } = await db.from("kc_club_person_einstellung").select("person_id,wert").eq("schluessel", "ruhezeit").in("person_id", ids);
  return new Set((data ?? []).filter((x: any) => inRuhezeit(x.wert) && !(erwaehnung && x.wert?.erwaehnung)).map((x: any) => x.person_id));
}
async function ruhezeitVerpasst(ids: string[], titel: string) {
  for (const id of ids) {
    const { data } = await db.from("kc_club_person_einstellung").select("wert").eq("person_id", id).eq("schluessel", "ruhezeit_verpasst").maybeSingle();
    const w: any = data?.wert || { anzahl: 0, titel: [] };
    await db.from("kc_club_person_einstellung").upsert({ person_id: id, schluessel: "ruhezeit_verpasst", wert: { anzahl: (w.anzahl || 0) + 1, titel: [txt(titel, 80), ...(w.titel || [])].slice(0, 5) }, geaendert_am: jetzt() }, { onConflict: "person_id,schluessel" });
  }
}

// KC-CLUB-OHNEAPP: Wer die Club-App noch nie geöffnet hat, bekommt nur eine Mail (Regel <eventKey>_mail) –
// ein Push über eine Anmeldung aus einem anderen Programm würde auf die gesperrte App führen.
async function senden(eventKey: string, personIds: string[], vars: Record<string, unknown>, korrelation: string) {
  if (!personIds.length) return { gesendet: 0 };
  const [{ data: zug }, { data: wahl }] = await Promise.all([
    db.from("kc_club_zugang").select("person_id").eq("aktiv", true).not("zuletzt_gesehen", "is", null).in("person_id", personIds),
    db.from("kc_club_benachrichtigung").select("person_id,push,email").eq("bereich", BEREICH_VON[eventKey] ?? "-").in("person_id", personIds),
  ]);
  const mitApp = new Set((zug ?? []).map((z: any) => z.person_id));
  const w = new Map((wahl ?? []).map((x: any) => [x.person_id, x]));
  const hinweis = "\n\n(Die Köcheclub-App hast du noch nicht geöffnet – deinen persönlichen Link bekommst du von Hansi.)";
  const ruhe = await ruhendePersonen(personIds.filter((id) => mitApp.has(id))), verpasst: string[] = []; // KC-CLUB-RUHEZEIT
  // Gruppen je Regel; Mitglieder ohne App getrennt (sie bekommen den Hinweis auf den Link)
  const gruppen = new Map<string, { key: string; ohne: boolean; ids: string[] }>();
  for (const id of personIds) {
    const ohne = !mitApp.has(id);
    let key: string | null;
    if (ohne) key = eventKey + "_mail";
    else {
      const x: any = w.get(id);
      key = !x ? eventKey : x.push && x.email ? eventKey + "_beide" : x.push ? eventKey + "_push" : x.email ? eventKey + "_mail" : null;
      // Ruhezeit: Push fällt weg, Mail bleibt; ohne Mail wird die Meldung für die Sammelmeldung gezählt
      if (key && ruhe.has(id) && key !== eventKey + "_mail") { if (key === eventKey + "_beide") key = eventKey + "_mail"; else { verpasst.push(id); key = null; } }
    }
    if (!key) continue; // Mitglied hat für diesen Bereich alles ausgeschaltet
    const g = gruppen.get(`${ohne}|${key}`) ?? { key, ohne, ids: [] };
    g.ids.push(id); gruppen.set(`${ohne}|${key}`, g);
  }
  let gesendet = 0, fehler = 0;
  for (const g of gruppen.values()) {
    const r = await routerSenden(g.key, g.ids, g.ohne ? { ...vars, text: String(vars.text ?? "") + hinweis } : vars, korrelation);
    gesendet += r.gesendet; fehler += r.fehler;
  }
  if (verpasst.length) await ruhezeitVerpasst(verpasst, String(vars.titel ?? vars.kurz ?? "Meldung"));
  return { gesendet, fehler, ruhezeit: verpasst.length };
}

// KC-CLUB-ZUSTELLWAHL: Absender wählt ausdrücklich, wie benachrichtigt wird (🔔 Push und/oder ✉️ E-Mail).
// Leer = wie jedes Mitglied es eingestellt hat (senden). Wer die App noch nie geöffnet hat, bekommt immer eine Mail.
const ZUSTELLWEGE = ["push", "email"];
async function sendenGewaehlt(eventKey: string, personIds: string[], wege: string[], vars: Record<string, unknown>, korrelation: string, opt: { erwaehnung?: boolean } = {}) {
  const w = [...new Set(wege.filter((x) => ZUSTELLWEGE.includes(x)))];
  if (!w.length) return await senden(eventKey, personIds, vars, korrelation);
  if (!personIds.length) return { gesendet: 0 };
  // KC-CLUB-RUHEZEIT: wer gerade „Nicht stören“ hat, bekommt keinen Push – Mail, wenn gewählt; sonst später gesammelt
  if (w.includes("push")) {
    const ruhe = await ruhendePersonen(personIds, !!opt.erwaehnung);
    if (ruhe.size) {
      const still = personIds.filter((id) => ruhe.has(id)); personIds = personIds.filter((id) => !ruhe.has(id));
      if (w.includes("email")) await routerSenden(eventKey + "_mail", still, vars, korrelation + ":ruhe");
      else await ruhezeitVerpasst(still, String(vars.titel ?? vars.kurz ?? "Meldung"));
      if (!personIds.length) return { gesendet: 0, ruhezeit: still.length };
    }
  }
  const { data: zug } = await db.from("kc_club_zugang").select("person_id").eq("aktiv", true).not("zuletzt_gesehen", "is", null).in("person_id", personIds);
  const mitApp = new Set((zug ?? []).map((z: any) => z.person_id));
  const key = w.length === 2 ? eventKey + "_beide" : w[0] === "push" ? eventKey + "_push" : eventKey + "_mail";
  const hinweis = "\n\n(Die Köcheclub-App hast du noch nicht geöffnet – deinen persönlichen Link bekommst du von Hansi.)";
  const mit = personIds.filter((id) => mitApp.has(id)), ohne = personIds.filter((id) => !mitApp.has(id));
  let gesendet = 0, fehler = 0;
  if (mit.length) { const r = await routerSenden(key, mit, vars, korrelation); gesendet += r.gesendet; fehler += r.fehler; }
  if (ohne.length) { const r = await routerSenden(eventKey + "_mail", ohne, { ...vars, text: String(vars.text ?? "") + hinweis }, korrelation); gesendet += r.gesendet; fehler += r.fehler; }
  // 0.32.1: Push ausdrücklich gewählt → auch Mitglieder ohne geöffnete Club-App, die schon ein aktives Push-Abo haben
  // (z. B. von der früheren Push-Seite), bekommen den Push zusätzlich zur Mail. Der Text weist auf den persönlichen Link hin.
  if (ohne.length && w.includes("push")) {
    const { data: abo } = await db.from("kc_member_push_subscriptions").select("person_id").eq("active", true).in("person_id", ohne);
    const mitAbo = [...new Set((abo ?? []).map((x: any) => x.person_id))] as string[];
    if (mitAbo.length) { const r = await routerSenden(eventKey + "_push", mitAbo, { ...vars, kurz: String(vars.kurz ?? "") + " (Club-App: bitte deinen persönlichen Link öffnen)" }, korrelation + ":push"); gesendet += r.gesendet; fehler += r.fehler; }
  }
  return { gesendet, fehler, wege: w };
}
const zustellwege = (v: unknown) => (Array.isArray(v) ? v : []).map(String).filter((x) => ZUSTELLWEGE.includes(x));

// Vorhandenes Zweiergespräch (genau zwei Teilnehmer, ohne Betreff) zwischen a und b – sonst null
async function zweierGespraech(a: string, b: string): Promise<string | null> {
  const { data: a1 } = await db.from("kc_communication_thread_participants").select("thread_id").eq("person_id", a);
  const { data: a2 } = await db.from("kc_communication_thread_participants").select("thread_id").eq("person_id", b);
  const gemeinsam = (a1 ?? []).map((x: any) => x.thread_id).filter((id: string) => (a2 ?? []).some((y: any) => y.thread_id === id));
  for (const id of gemeinsam) {
    const { count } = await db.from("kc_communication_thread_participants").select("person_id", { count: "exact", head: true }).eq("thread_id", id);
    const { data: th } = await db.from("kc_communication_threads").select("subject").eq("id", id).single();
    if (count === 2 && !th?.subject) return id;
  }
  return null;
}

// ---------- KC-CLUB-ONLINE (0.29.0): wer ist gerade online + Anklopfen ----------
// Online = in den letzten ONLINE_SEK Sekunden in der App (zuletzt_gesehen wird bei jedem Aufruf gesetzt; die App meldet sich
// alle 60 s, solange sie offen ist). Einstellung „online“ (Standard: an). Wer sich verbirgt, sieht auch andere nicht.
const ONLINE_SEK = 150, ANKLOPFEN_SEK = 180;
// KC-CLUB-TIPPT (0.54.0): „schreibt …“ – die App meldet beim Tippen alle paar Sekunden, das Zeichen gilt TIPPT_SEK lang
const TIPPT_SEK = 6, LIVE_TIPPEN_ZEICHEN = 300;
async function onlineZeigenMap(ids?: string[]) {
  let q = db.from("kc_club_person_einstellung").select("person_id,wert").eq("schluessel", "online");
  if (ids) q = q.in("person_id", ids);
  const { data } = await q;
  return new Map((data ?? []).map((x: any) => [x.person_id, x.wert?.zeigen !== false]));
}
// KC-CLUB-STUMM (1.9.0): wer hat diese Unterhaltung gerade stummgeschaltet? („immer“ oder bis Zeitpunkt in der Zukunft)
const stummJetzt = (wert: any, threadId: string) => { const b = wert?.threads?.[threadId]; return b === "immer" || (typeof b === "string" && Date.parse(b) > Date.now()); };
async function stummFuer(ids: string[], threadId: string) {
  if (!ids.length) return new Set<string>();
  const { data } = await db.from("kc_club_person_einstellung").select("person_id,wert").eq("schluessel", "stumm").in("person_id", ids);
  return new Set((data ?? []).filter((x: any) => stummJetzt(x.wert, threadId)).map((x: any) => x.person_id as string));
}
// KC-CLUB-BEARBEITEN (1.9.0): eigene Nachricht bis zu 15 Minuten nach dem Senden ändern (wie WhatsApp)
const BEARBEITEN_MIN = 15;
// KC-CLUB-ANKLOPFEN-ERLAUBEN (1.8.0): wer Anklopfen ausgeschaltet hat (Standard: erlaubt)
async function anklopfenErlaubtMap(ids: string[]) {
  if (!ids.length) return new Map<string, boolean>();
  const { data } = await db.from("kc_club_person_einstellung").select("person_id,wert").eq("schluessel", "anklopfen").in("person_id", ids);
  return new Map((data ?? []).map((x: any) => [x.person_id as string, x.wert?.erlaubt !== false]));
}
// KC-CLUB-ANKLOPFEN-ANTWORT (1.8.0): Kurzantworten im Anklopf-Fenster – beendet das Anklopfen sofort, der andere sieht den Text
const KLOPF_ANTWORTEN: Record<string, string> = {
  beschaeftigt: "⏳ Bin gerade beschäftigt", spaeter: "🔁 Melde mich später", anrufen: "📞 Ruf mich kurz an",
  schreiben: "💬 Schreib mir lieber", unterwegs: "🚗 Bin unterwegs", kochen: "🍳 Stehe gerade am Herd",
};
// KC-CLUB-ZULETZT-DA (1.20.0, Wunsch Hansi): „zuletzt da“ wie WhatsApp „zuletzt online“. Gegenseitig: wer Online- oder
// Zuletzt-Anzeige verbirgt, sieht sie auch bei anderen nicht. Grob: Uhrzeit nur für heute, sonst nur der Tag; älter als
// ZULETZT_TAGE nur „länger nicht da“. Quelle ist zuletzt_gesehen (setzt sich nur, solange die App wirklich offen ist).
const ZULETZT_TAGE = 30;
async function zuletztDaMap(ich: Ich, ids: string[]) {
  const aus = new Map<string, { online: boolean; tag?: string; zeit?: string | null; lange?: boolean } | null>();
  const ziel = [...new Set(ids)].filter((id) => id && id !== ich.person_id);
  if (!ziel.length) return aus;
  const [{ data: e }, { data: z }] = await Promise.all([
    db.from("kc_club_person_einstellung").select("person_id,wert").in("schluessel", ["online", "zuletzt"]).in("person_id", [...ziel, ich.person_id]),
    db.from("kc_club_zugang").select("person_id,zuletzt_gesehen").in("person_id", ziel),
  ]);
  const verborgen = (pid: string) => (e ?? []).some((x: any) => x.person_id === pid && x.wert?.zeigen === false);
  if (verborgen(ich.person_id)) return aus;
  const heute = berlinTag(new Date()), grenze = Date.now() - ZULETZT_TAGE * 86400000;
  for (const pid of ziel) {
    const zg = (z ?? []).find((x: any) => x.person_id === pid)?.zuletzt_gesehen;
    if (verborgen(pid) || !zg || pid.startsWith("KC-P-TEST")) { aus.set(pid, null); continue; }
    const t = new Date(zg).getTime();
    if (t < grenze) { aus.set(pid, { online: false, lange: true }); continue; }
    const tag = berlinTag(new Date(zg));
    aus.set(pid, { online: Date.now() - t < ONLINE_SEK * 1000, tag,
      zeit: tag === heute ? new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(zg)) : null });
  }
  return aus;
}
// ---------- KC-CLUB-FP-UEBERWACHUNG (1.58.0, Wunsch Hansi): Fehlerprotokoll einstufen, leeren, überwachen ----------
// Eine Regel für die Einstufung (Server liefert sie der App mit): 🔴 schwer – sofort Push an den Admin; 🟡 Hinweis; ⚪ Info.
// „Script error.“ ohne Einzelheiten (Safari/fremde Skripte) ist nur ein Hinweis; Sicherheitsbericht nur mit Problemen schwer.
const FP_FILTER = "aktion.like.fehler_%,aktion.eq.hilferuf,aktion.eq.diagnose_start,aktion.eq.zugang_angefordert";
const FP_SCHWER = new Set(["hilferuf", "hilferuf_anonym", "start_kaputt"]);
const FP_INFO = new Set(["alte_version", "update_getippt", "umgebung", "hinweis", "link_kopiert", "diagnose_start", "zugang_angefordert", "offline", "anonym_admin_benachrichtigt"]);
const FP_VOLL = 300; // ab so vielen Einträgen fragt die Tagesinfo, ob geleert werden soll
function fpStufe(aktion: string, d: any): "schwer" | "hinweis" | "info" {
  const art = String(aktion).replace(/^fehler_anonym_/, "").replace(/^fehler_/, "");
  if (FP_SCHWER.has(art)) return "schwer";
  if (art === "skript") return /^Script error\.?$/i.test(String(d?.text ?? "").trim()) ? "hinweis" : "schwer";
  if (art === "sicherheit") return Array.isArray(d?.probleme) && d.probleme.length ? "schwer" : "info";
  return FP_INFO.has(art) ? "info" : "hinweis";
}
async function fpZaehlen() {
  const z = { anzahl: 0, schwer: 0, hinweis: 0, info: 0 };
  for (let ab = 0; ab < 20000; ab += 1000) {
    const { data } = await db.from("kc_club_protokoll").select("aktion,details").or(FP_FILTER).range(ab, ab + 999);
    for (const x of data ?? []) { z.anzahl++; z[fpStufe(x.aktion, x.details)]++; }
    if ((data ?? []).length < 1000) break;
  }
  return z;
}
async function fpUeberwachen() {
  const { data: letzte } = await db.from("kc_club_protokoll").select("zeit").eq("aktion", "fp_schwer_gemeldet").order("zeit", { ascending: false }).limit(1);
  const seit = letzte?.[0]?.zeit ?? new Date(Date.now() - 3600000).toISOString();
  const { data: neu } = await db.from("kc_club_protokoll").select("zeit,person_id,aktion,details").or(FP_FILTER).gt("zeit", seit).order("zeit").limit(500);
  const schwer = (neu ?? []).filter((x: any) => fpStufe(x.aktion, x.details) === "schwer");
  if (!schwer.length) return { schwer: 0 };
  const { data: ad } = await db.from("kc_club_rollen").select("person_id").eq("ist_admin", true);
  const ids = (ad ?? []).map((x: any) => x.person_id as string), ruhe = await ruhendePersonen(ids);
  const an = ids.filter((id) => !ruhe.has(id));
  if (!an.length) return { schwer: schwer.length, wartet: "Ruhezeit" }; // Marke nicht setzen → nach der Ruhezeit melden
  const leute = await personen(schwer.map((x: any) => x.person_id).filter(Boolean));
  const was = [...new Set(schwer.map((x: any) => `${x.person_id ? vorname(leute.get(x.person_id)) || "Mitglied" : "ohne Anmeldung"}: ${String(x.details?.text || x.aktion.replace(/^fehler_/, "")).slice(0, 60)}`))].slice(0, 3).join(" · ");
  await routerSenden("club_fehler", an, { titel: `🔴 ${schwer.length} schwerwiegende${schwer.length === 1 ? "s Problem" : " Probleme"} in der Club-App`, kurz: was,
    betreff: "Köcheclub-App – schwerwiegendes Problem", text: `Im Fehlerprotokoll steht Neues:\n\n${was}\n\nEinzelheiten: Admin-Zentrale → 🩺 Fehlerprotokoll\n${APP_URL}`, url: APP_URL },
    `club-fehler:${schwer[schwer.length - 1].zeit}`);
  await protokoll(null, "fp_schwer_gemeldet", { anzahl: schwer.length, bis: schwer[schwer.length - 1].zeit });
  return { schwer: schwer.length, gemeldet: an.length };
}

// ---------- KC-CLUB-ONLINE-PUSH (1.57.0, Wunsch Hansi): „🟢 Klaus ist jetzt online“ als Push an Admins ----------
// Auch bei geschlossener App (dann mit dem normalen Benachrichtigungston des Handys). Nicht an Admins, deren App gerade offen ist
// (die hören Ton/Ansage in der App), nicht in deren Ruhezeit, nicht für Mitglieder, die ihren Online-Status verbergen.
// Abschaltbar je Admin (Einstellung online_push). Nur Push – keine Mail.
const ONLINE_PUSH_PAUSE_MS = 10 * 60000;
async function onlinePushMelden(wer: Ich) {
  if (wer.person_id.startsWith("KC-P-TEST")) return;
  if ((await onlineZeigenMap([wer.person_id])).get(wer.person_id) === false) return;
  const { data: ad } = await db.from("kc_club_rollen").select("person_id").eq("ist_admin", true).neq("person_id", wer.person_id);
  let ids = (ad ?? []).map((x: any) => x.person_id as string);
  if (!ids.length) return;
  const { data: wahl } = await db.from("kc_club_person_einstellung").select("person_id,wert").eq("schluessel", "online_push").in("person_id", ids);
  const aus = new Set((wahl ?? []).filter((x: any) => x.wert?.an === false).map((x: any) => x.person_id));
  // 1.64.0 (Fund Hansi): auch wenn der Admin gerade „online“ ist – bei mehreren Geräten (Handy + Tablet) entscheidet jedes Gerät
  // selbst: App sichtbar → Ton/Ansage in der App (Service Worker), sonst normale Mitteilung.
  const ruhe = await ruhendePersonen(ids);
  ids = ids.filter((id) => !aus.has(id) && !ruhe.has(id));
  if (!ids.length) return;
  const name = wer.vorname || wer.name;
  await routerSenden("club_online", ids, { titel: `🟢 ${name} ist jetzt online`, kurz: `${wer.name} ist gerade in der Köcheclub-App`,
    betreff: `Köcheclub Werne – ${name} ist online`, text: `${wer.name} ist gerade in der Köcheclub-App.`, url: APP_URL },
    `club-online:${wer.person_id}:${Math.floor(Date.now() / ONLINE_PUSH_PAUSE_MS)}`);
}
async function onlineJetzt(): Promise<Set<string>> {
  const seit = new Date(Date.now() - ONLINE_SEK * 1000).toISOString();
  const { data } = await db.from("kc_club_zugang").select("person_id").eq("aktiv", true).gte("zuletzt_gesehen", seit).not("person_id", "like", "KC-P-TEST%");
  const ids = (data ?? []).map((x: any) => x.person_id), zeigen = await onlineZeigenMap(ids);
  return new Set(ids.filter((id: string) => zeigen.get(id) !== false));
}

// ---------- KC-CLUB-ANRUF (0.31.0, Test): Sprechen per Ton, App zu App (WebRTC) ----------
// Der Server vermittelt nur Angebot/Antwort (SDP-Text, max. 20 kB); Sprache läuft direkt zwischen den Handys.
// Klingeln höchstens ANRUF_KLINGEL_SEK; nur Anrufer und Angerufener sehen den Anruf.
const ANRUF_KLINGEL_SEK = 45, SDP_MAX = 20000;
const sdpText = (v: unknown) => { const t = String(v ?? ""); if (!t.startsWith("v=0") || t.length > SDP_MAX) throw new Fehler("Verbindungsdaten ungültig."); return t; };
async function anrufHolen(ich: Ich, id: unknown) {
  const { data: a } = await db.from("kc_club_anruf").select("*").eq("id", String(id || "")).maybeSingle();
  if (!a || (a.von !== ich.person_id && a.an !== ich.person_id)) throw new Fehler("Anruf nicht gefunden.", 404);
  // Klingeln abgelaufen → verpasst
  if (a.status === "klingelt" && Date.now() - new Date(a.erstellt_am).getTime() > ANRUF_KLINGEL_SEK * 1000) {
    await db.from("kc_club_anruf").update({ status: "verpasst", beendet_am: jetzt() }).eq("id", a.id).eq("status", "klingelt");
    a.status = "verpasst";
  }
  return a;
}

// KC-CLUB-KONFERENZ (0.82.0): Konferenz = alle Beine (kc_club_anruf) mit derselben konferenz_id. Teilnehmer = wer in einem
// angenommenen Bein steckt; Eingeladene = klingelnde, nicht automatische Beine. Jedes Handy verbindet sich direkt mit jedem
// anderen (bis KONFERENZ_MAX Personen, nur Ton) – die Querverbindungen („automatisch“) bauen die Apps selbst auf.
const KONFERENZ_MAX = 4;
async function konferenzBeine(k: string) {
  const { data } = await db.from("kc_club_anruf").select("id,von,an,status,angebot,antwort,automatisch,erstellt_am,angenommen_am,kurzantwort").eq("konferenz_id", k).in("status", ["klingelt", "angenommen"]);
  const grenze = Date.now() - ANRUF_KLINGEL_SEK * 1000, alt = (data ?? []).filter((b: any) => b.status === "klingelt" && new Date(b.erstellt_am).getTime() < grenze);
  if (alt.length) await db.from("kc_club_anruf").update({ status: "verpasst", beendet_am: jetzt() }).in("id", alt.map((b: any) => b.id)).eq("status", "klingelt");
  const beine = (data ?? []).filter((b: any) => !alt.includes(b));
  const teilnehmer = new Set<string>(), eingeladen = new Set<string>();
  for (const b of beine) if (b.status === "angenommen") { teilnehmer.add(b.von); teilnehmer.add(b.an); }
  for (const b of beine) if (b.status === "klingelt" && !b.automatisch && !teilnehmer.has(b.an)) eingeladen.add(b.an);
  return { beine, teilnehmer, eingeladen };
}

// KC-CLUB-ANRUF-KURZANTWORT (0.81.0): Schnellantworten beim Ablehnen – vom Admin einstellbar (kc_club_konfig „anruf_antworten“)
const ANRUF_ANTWORTEN_STANDARD = ["⏳ Bin gerade beschäftigt", "📞 Ich melde mich gleich", "🔁 Versuch es bitte später nochmal", "📅 Ich melde mich morgen", "🚗 Bin unterwegs"];
const ANRUF_ANTWORTEN_MAX = 8, ANRUF_ANTWORT_ZEICHEN = 60, ANRUF_EIGEN_ZEICHEN = 160;
async function anrufAntworten() {
  const { data } = await db.from("kc_club_konfig").select("wert,geaendert_am").eq("schluessel", "anruf_antworten").maybeSingle();
  const texte = Array.isArray((data?.wert as any)?.texte) ? (data!.wert as any).texte.map((x: unknown) => txt(x, ANRUF_ANTWORT_ZEICHEN)).filter(Boolean).slice(0, ANRUF_ANTWORTEN_MAX) : [];
  return { texte: texte.length ? texte : ANRUF_ANTWORTEN_STANDARD, geaendertAm: data?.geaendert_am ?? null };
}

// ---------- Gruppen (KC-CLUB-GRUPPEN) ----------
const GRUPPEN_SYMBOLE = ["👥", "👨‍🍳", "🍳", "🎖️", "🧳", "🎉", "📋", "🍷", "⭐", "🏠"];
async function gruppeHolen(ich: Ich, id: unknown) {
  const tid = String(id || "");
  const { data: g } = await db.from("kc_club_gruppen").select("*").eq("thread_id", tid).maybeSingle();
  if (!g) throw new Fehler("Gruppe nicht gefunden.", 404);
  return { g, darfVerwalten: g.erstellt_von === ich.person_id || ich.vorstand };
}

// ---------- Dateien (KC-CLUB-ANLAGEN) ----------
// Eine Datei in den Anlagen-Kern legen (Bucket + kc_communication_attachments) – für Nachrichten, Protokolle und das Fotoalbum.
async function dateiAblegen(ich: Ich, nameRoh: unknown, mimeRoh: unknown, datenRoh: unknown, erlaubt?: RegExp) {
  const name = txt(nameRoh, 150).replace(/[\\/]/g, "_") || "Anlage";
  const mime = txt(mimeRoh, 100) || "application/octet-stream";
  if (/(x-msdownload|x-sh|javascript|x-executable|html)/i.test(mime) || /\.(exe|bat|cmd|js|sh|html?)$/i.test(name)) throw new Fehler("Dieser Dateityp ist nicht erlaubt.");
  if (erlaubt && !erlaubt.test(mime)) throw new Fehler("Dieser Dateityp ist hier nicht erlaubt.");
  const b64 = String(datenRoh || "");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  if (!bytes.length) throw new Fehler("Leere Datei.");
  if (bytes.length > MAX_ANLAGE) throw new Fehler("Die Datei ist zu groß (höchstens 8 MB).");
  const pfad = `club/${ich.person_id}/${crypto.randomUUID()}-${name.replace(/[^\w.\-äöüÄÖÜß ]/g, "_")}`;
  const up = await db.storage.from(BUCKET).upload(pfad, bytes, { contentType: mime, upsert: false });
  if (up.error) throw new Fehler("Hochladen fehlgeschlagen.", 500);
  const { data: link } = await db.from("kc_core_user_links").select("user_id").eq("person_id", SYSTEM_UPLOADER).eq("active", true).limit(1).maybeSingle();
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((x) => x.toString(16).padStart(2, "0")).join("");
  const { data: att, error } = await db.from("kc_communication_attachments").insert({
    org_id: ORG, uploaded_by: link?.user_id, bucket: BUCKET, object_path: pfad, file_name: name, mime_type: mime, size_bytes: bytes.length, sha256: hash,
  }).select("id").single();
  if (error || !att) { await db.storage.from(BUCKET).remove([pfad]); throw new Fehler("Anlage konnte nicht gespeichert werden.", 500); }
  return { id: att.id as string, name, groesse: bytes.length };
}
// Dateien endgültig entfernen (Speicher wird frei) – nur für Dateien, die sonst nirgends verknüpft sind
async function dateienEntfernen(ids: (string | null | undefined)[]) {
  const u = ids.filter(Boolean) as string[];
  if (!u.length) return;
  const { data: att } = await db.from("kc_communication_attachments").select("id,bucket,object_path").in("id", u);
  for (const b of new Set((att ?? []).map((x: any) => x.bucket))) await db.storage.from(b).remove((att ?? []).filter((x: any) => x.bucket === b).map((x: any) => x.object_path));
  await db.from("kc_communication_attachments").delete().in("id", u);
}

// ---------- Fotoalbum (KC-CLUB-FOTOALBUM) ----------
// Kostenloser Supabase-Plan: 1 GB Dateispeicher. Ab 95 % nimmt das Album keine Fotos mehr an (Rest bleibt für Anlagen/Protokolle).
const SPEICHER_GRENZE = 1024 * 1024 * 1024;
const FOTO_STOPP = 0.95;
const FOTO_SCHNITT = 260 * 1024; // durchschnittliche Größe Foto + Vorschau – nur für „ca. x weitere Fotos“
const PAPIERKORB_TAGE = 30;
const THEMEN_VORSCHLAG = ["Clubabend", "Kochen", "Ausflug", "Reise", "Feier", "Veranstaltung"];
async function speicherStand() {
  const { data } = await db.rpc("kc_club_speicher_belegt");
  const belegt = Number(data) || 0;
  return { belegt, grenze: SPEICHER_GRENZE, prozent: Math.round((belegt / SPEICHER_GRENZE) * 1000) / 10,
    fotosMoeglich: Math.max(0, Math.floor((SPEICHER_GRENZE * FOTO_STOPP - belegt) / FOTO_SCHNITT)) };
}
const darfFotoAendern = (ich: Ich, f: any) => f.hochgeladen_von === ich.person_id || ich.vorstand;
// KC-CLUB-FOTO-ALBEN (1.63.0, Wunsch Hansi): benannte Alben aus Fotos des Fotoalbums (nur Verweise, keine Kopien).
// privat = nur Besitzer · alle = alle Mitglieder; ändern: Besitzer, bei Club-Alben auch die Clubleitung. Sichtbarkeit nur der Besitzer.
const ALBUM_MAX_FOTOS = 600, ALBUM_MAX_JE_PERSON = 200, ALBUM_JE_AUFRUF = 300;
const UUID_ALBUM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const darfAlbumSehen = (ich: Ich, a: any) => !a.geloescht_am && (a.besitzer === ich.person_id || a.sichtbar === "alle");
const darfAlbumAendern = (ich: Ich, a: any) => a.besitzer === ich.person_id || (a.sichtbar === "alle" && ich.vorstand);
const albumFotoIds = (v: unknown) => [...new Set((Array.isArray(v) ? v : []).map(String).filter((x) => UUID_ALBUM.test(x)))].slice(0, ALBUM_JE_AUFRUF);
async function albumHolen(ich: Ich, id: unknown, aendern = false) {
  if (!UUID_ALBUM.test(String(id || ""))) throw new Fehler("Album nicht gefunden.", 404);
  const { data: a } = await db.from("kc_club_foto_alben").select("*").eq("id", String(id)).maybeSingle();
  if (!a || !darfAlbumSehen(ich, a)) throw new Fehler("Album nicht gefunden.", 404);
  if (aendern && !darfAlbumAendern(ich, a)) throw new Fehler("Ändern darf nur, wer das Album angelegt hat (bei Club-Alben auch die Clubleitung).", 403);
  return a;
}
// sichtbare Alben mit Anzahl (nur Fotos außerhalb des Papierkorbs) und Deckblatt-Vorschau
async function albenFuer(ich: Ich) {
  const [{ data: eigene }, { data: club }] = await Promise.all([
    db.from("kc_club_foto_alben").select("*").is("geloescht_am", null).eq("besitzer", ich.person_id),
    db.from("kc_club_foto_alben").select("*").is("geloescht_am", null).eq("sichtbar", "alle"),
  ]);
  const alben = [...new Map([...(eigene ?? []), ...(club ?? [])].map((a: any) => [a.id, a])).values()];
  if (!alben.length) return [];
  const [{ data: zu }, { data: imKorb }] = await Promise.all([
    db.from("kc_club_foto_album_fotos").select("album_id,foto_id,hinzugefuegt_am").in("album_id", alben.map((a: any) => a.id)).order("hinzugefuegt_am", { ascending: true }),
    db.from("kc_club_fotos").select("id").not("geloescht_am", "is", null), // Papierkorb (wenige) zählt nicht mit
  ]);
  const weg = new Set((imKorb ?? []).map((f: any) => f.id)), je = new Map<string, string[]>();
  for (const z of zu ?? []) { if (weg.has(z.foto_id)) continue; if (!je.has(z.album_id)) je.set(z.album_id, []); je.get(z.album_id)!.push(z.foto_id); }
  // Deckblatt: gewähltes Titelfoto, sonst das zuerst hineingelegte
  const deckelId = new Map(alben.map((a: any) => { const l = je.get(a.id) ?? []; return [a.id, l.includes(a.titelfoto) ? a.titelfoto : l[0] ?? null]; }));
  const dIds = [...new Set([...deckelId.values()].filter(Boolean))] as string[];
  const { data: df } = dIds.length ? await db.from("kc_club_fotos").select("id,vorschau_id,attachment_id").in("id", dIds) : { data: [] as any[] };
  const dfm = new Map<string, any>((df ?? []).map((f: any) => [f.id, f]));
  const deckel = new Map<string, any>([...deckelId.entries()].map(([k, v]) => [k, v ? dfm.get(v) ?? null : null]));
  const attIds = [...new Set([...deckel.values()].filter(Boolean).map((f: any) => f.vorschau_id || f.attachment_id))];
  const { data: att } = attIds.length ? await db.from("kc_communication_attachments").select("id,object_path").in("id", attIds) : { data: [] as any[] };
  const pfad = new Map((att ?? []).map((x: any) => [x.id, x.object_path])), pfade = [...new Set([...pfad.values()])] as string[];
  const { data: urls } = pfade.length ? await db.storage.from(BUCKET).createSignedUrls(pfade, 3600) : { data: [] as any[] };
  const url = new Map((urls ?? []).map((u: any) => [u.path, u.signedUrl]));
  const leute = await personen(alben.map((a: any) => a.besitzer));
  return alben.map((a: any) => {
    const d = deckel.get(a.id);
    return { id: a.id, name: a.name, jahr: a.jahr, sichtbar: a.sichtbar, eigen: a.besitzer === ich.person_id, von: leute.get(a.besitzer)?.display_name ?? "",
      darfAendern: darfAlbumAendern(ich, a), anzahl: (je.get(a.id) ?? []).length, titelfoto: a.titelfoto, deckel: d ? url.get(pfad.get(d.vorschau_id || d.attachment_id)) ?? null : null, geaendert: a.geaendert_am };
  }).sort((x, y) => y.jahr - x.jahr || x.name.localeCompare(y.name));
}
async function albumFotosEintragen(ich: Ich, albumId: string, ids: string[]) {
  if (!ids.length) return 0;
  const { data: ok } = await db.from("kc_club_fotos").select("id").in("id", ids).is("geloescht_am", null);
  const gueltig = (ok ?? []).map((f: any) => f.id);
  const { count } = await db.from("kc_club_foto_album_fotos").select("foto_id", { count: "exact", head: true }).eq("album_id", albumId);
  if ((count ?? 0) + gueltig.length > ALBUM_MAX_FOTOS) throw new Fehler(`Ein Album fasst höchstens ${ALBUM_MAX_FOTOS} Fotos.`, 409);
  if (gueltig.length) {
    const { error } = await db.from("kc_club_foto_album_fotos").upsert(gueltig.map((foto_id: string) => ({ album_id: albumId, foto_id, hinzugefuegt_von: ich.person_id })), { onConflict: "album_id,foto_id", ignoreDuplicates: true });
    if (error) throw new Fehler("Fotos konnten nicht ins Album gelegt werden.", 500);
  }
  return gueltig.length;
}
// ----- KC-CLUB-FOTO-META (0.45.0): Aufnahmedaten eines Fotos (von der App aus dem Original gelesen) prüfen und begrenzen -----
function fotoMetaPruefen(roh: any, mitOrt: boolean) {
  if (!roh || typeof roh !== "object") return null;
  const zahl = (v: unknown, min: number, max: number) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : undefined; };
  const m: Record<string, unknown> = {
    aufnahme: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(String(roh.aufnahme || "")) ? String(roh.aufnahme) : undefined,
    kamera: txt(roh.kamera, 80) || undefined, objektiv: txt(roh.objektiv, 80) || undefined,
    breite: zahl(roh.breite, 1, 100000), hoehe: zahl(roh.hoehe, 1, 100000),
    blende: zahl(roh.blende, 0.5, 64), belichtung: /^(1\/\d{1,5}|\d{1,3}(\.\d{1,2})?)$/.test(String(roh.belichtung || "")) ? String(roh.belichtung) : undefined,
    iso: zahl(roh.iso, 1, 1000000), brennweite: zahl(roh.brennweite, 0.1, 5000), blitz: typeof roh.blitz === "boolean" ? roh.blitz : undefined,
    datei: txt(roh.datei, 120) || undefined, groesse: zahl(roh.groesse, 1, 500 * 1024 * 1024), typ: txt(roh.typ, 40) || undefined,
  };
  // Ort nur, wenn der Hochladende es erlaubt hat; auf ~10 m gerundet
  const lat = zahl(roh.gps?.lat, -90, 90), lon = zahl(roh.gps?.lon, -180, 180);
  if (mitOrt && lat !== undefined && lon !== undefined && !(lat === 0 && lon === 0)) {
    const hoehe = zahl(roh.gps?.hoehe, -500, 9000);
    m.gps = { lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4, ...(hoehe !== undefined ? { hoehe: Math.round(hoehe) } : {}) };
  }
  for (const k of Object.keys(m)) if (m[k] === undefined) delete m[k];
  return Object.keys(m).length ? m : null;
}
// Ortsname zu GPS-Daten (Adapter, kostenlos: OpenStreetMap/Nominatim, höchstens 1 Anfrage je Sekunde, Ergebnis wird gemerkt)
// genau = mit Hausnummer und PLZ (SOS „Wo bin ich?“ zum Vorlesen am Telefon); ohne = kurzer Ortsname wie bisher (Fotos).
// Ist genau eine Zahl (GPS-Genauigkeit in m), nennt Photon zusätzlich Nachbarhäuser derselben Straße in diesem Umkreis.
const ORTSNAMEN: Record<string, (lat: number, lon: number, genau?: number | boolean) => Promise<string | null>> = {
  nominatim: async (lat, lon, genau) => {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=${genau ? 18 : 17}&accept-language=de`,
      { headers: { "User-Agent": "KC-Clubapp (Koecheclub Werne, sire65.github.io/KC-Clubapp)" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error("Nominatim " + r.status);
    const d = await r.json(), a = d.address ?? {};
    const ort = a.town || a.city || a.village || a.hamlet || a.municipality || "";
    if (genau) {
      const strasse = [a.road || a.pedestrian || a.footway || a.path || "", a.house_number || ""].filter(Boolean).join(" ");
      const teileG = [d.name && d.name !== a.road ? d.name : "", strasse, [a.postcode || "", ort].filter(Boolean).join(" "), a.country_code && a.country_code !== "de" ? a.country : ""];
      return [...new Set(teileG.filter(Boolean))].join(", ") || d.display_name || null;
    }
    const teile = [d.name && d.name !== a.road ? d.name : "", a.road || "", a.suburb && a.suburb !== ort ? a.suburb : "", ort, a.country_code && a.country_code !== "de" ? a.country : ""];
    return [...new Set(teile.filter(Boolean))].join(", ") || d.display_name || null;
  },
  // KC-CLUB-SOS-WO (1.7.1): Photon (komoot, kostenlos, OpenStreetMap-Daten) – Nominatim lehnt Anfragen aus Rechenzentren
  // (Supabase) mit 403/429 ab; deshalb Photon zuerst, Nominatim bleibt als Ausweichweg.
  photon: async (lat, lon, genau) => {
    const r = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=de&limit=${genau ? 6 : 1}`,
      { headers: { "User-Agent": "KC-Clubapp (Koecheclub Werne, sire65.github.io/KC-Clubapp)" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error("Photon " + r.status);
    const alle: any[] = (await r.json())?.features ?? [], a = alle[0]?.properties;
    if (!a) return null;
    const ort = a.city || a.town || a.village || a.locality || "";
    const strasse = [a.street || "", genau ? a.housenumber || "" : ""].filter(Boolean).join(" ");
    const name = a.name && a.name !== a.street && a.type !== "house" ? a.name : "";
    const teile = genau ? [name, strasse, [a.postcode || "", ort].filter(Boolean).join(" ")] : [name, strasse, a.district && a.district !== ort ? a.district : "", ort];
    if (a.countrycode && a.countrycode !== "DE") teile.push(a.country || "");
    let text = [...new Set(teile.filter(Boolean))].join(", ");
    if (typeof genau === "number" && a.housenumber && a.street) {
      // KC-CLUB-SOS-WO (1.7.2, Live-Test Hansi): GPS liegt oft ein Haus daneben → Nachbarhäuser im Messumkreis (10–40 m) nennen
      const umkreis = Math.min(40, Math.max(10, genau)), m = (c: number[]) => Math.hypot((c[0] - lon) * 111320 * Math.cos(lat * Math.PI / 180), (c[1] - lat) * 110540);
      const nachbarn = alle.slice(1).filter((f) => f.properties?.street === a.street && f.properties?.housenumber && f.properties.housenumber !== a.housenumber && Array.isArray(f.geometry?.coordinates) && m(f.geometry.coordinates) <= umkreis)
        .map((f) => String(f.properties.housenumber)).filter((x, i, l) => l.indexOf(x) === i).slice(0, 2);
      if (nachbarn.length) text += ` (oder Nachbarhaus Nr. ${nachbarn.join(", ")})`;
    }
    return text || null;
  },
};
const ORTSNAME_QUELLEN = ["photon", "nominatim"]; // Reihenfolge = Ausweichweg
async function ortsnameHolen(lat: number, lon: number, genau?: number | boolean) {
  let fehler: unknown = null;
  for (const q of ORTSNAME_QUELLEN) {
    try { const n = await ORTSNAMEN[q](lat, lon, genau); if (n) return n; } catch (e) { fehler = e; console.error("ortsname", q, String(e)); }
  }
  if (fehler) throw fehler;
  return null;
}
let ortsnameZuletzt = 0;
const sosOrtZuletzt = new Map<string, number>(); // KC-CLUB-SOS-WO: höchstens 1 Adressabfrage je Person in 5 s
// KC-CLUB-BESTAETIGUNG (1.69.0/1.69.1): Text der Erstattungs-Bestätigung (beim Senden und aus dem Postausgang – eine Regel)
const ERSTATTUNG_VORBEHALT = "Unter Vorbehalt: Dein Antrag wird vom Kassenwart geprüft – die Erstattung erfolgt nach Freigabe.";
function erstattungBestaetigung(vorname: string, a: any, hinweis = "") {
  const pos = (a.positionen || []) as any[], summe = Number(a.summe || 0), d = (iso: string) => String(iso || "").split("-").reverse().join(".");
  const zeilen = pos.map((x, i) => x.art === "fahrt" ? `${i + 1}. 🚗 ${d(x.datum)}: ${String(x.km).replace(".", ",")} km × ${euro(x.satz)} = ${euro(x.betrag)} · ${x.grund}${x.ziel ? " · " + x.ziel : ""}`
    : `${i + 1}. ${x.art === "einkauf" ? "🛒" : "📦"} ${d(x.datum)}: ${euro(x.betrag)} · ${x.was || ""}`).join("\n");
  const url = `${APP_URL}#bestaetigung=erstattung:${a.id}`;
  return { titel: `✅ Dein Erstattungsantrag über ${euro(summe)} ist eingegangen`, kurz: `${pos.length} Position${pos.length === 1 ? "" : "en"} · ${euro(summe)} · unter Vorbehalt – 📄 Aufstellung öffnen`,
    betreff: `Köcheclub Werne – Bestätigung deines Erstattungsantrags (${euro(summe)})`, url,
    text: `Hallo ${vorname},\n\ndein Antrag über ${euro(summe)} ist beim Kassenwart eingegangen.\n\n${zeilen}\n\nSumme: ${euro(summe)} · Auszahlung: ${a.auszahlung === "bar" ? "bar" : "per Überweisung"}\n\n${hinweis ? hinweis + "\n" : ""}${ERSTATTUNG_VORBEHALT}\n\nAufstellung: ${url}\n\nViele Grüße\nKöcheclub-App` };
}
// KC-CLUB-EINGABEN-ARCHIV (1.69.2, Wunsch Hansi): Aufstellungen als Textdatei in den persönlichen Archiv-Ordner des Mitglieds.
// Selbst abgelegt (von = Besitzer) → sofort sichtbar; von jemand anderem (Clubleitung) → „zur Prüfung“, der Besitzer entscheidet.
// Register aus ABLAGE_REGISTER; fehlt es im Ordner, wird es vor „Sonstiges“ ergänzt (nichts geht verloren).
const ABLAGE_REGISTER: Record<string, string> = { erstattung: "Rechnungen", dienstwunsch: "Dienstplan" };
async function eingabenArchivieren(besitzer: Ich, teile: string[], von: string) {
  const jahr = Number(berlinTag(new Date()).slice(0, 4));
  const oid = await archivEigenerOrdner(besitzer, jahr); if (!oid) throw new Error("Ordner konnte nicht angelegt werden");
  const { data: o } = await db.from("kc_club_archiv_ordner").select("id,register,geloescht_am").eq("id", oid).single();
  if (o?.geloescht_am) throw new Error("Ordner liegt im Papierkorb");
  const docs: any[] = [];
  for (const teil of teile.slice(0, 5)) {
    const [art, id] = teil.split(":");
    if (art === "erstattung") {
      const { data: a } = await db.from("kc_club_erstattung").select("id,person_id,positionen,summe,auszahlung,erstellt_am").eq("id", String(id || "")).maybeSingle();
      if (!a || a.person_id !== besitzer.person_id) continue;
      const tag = berlinTag(new Date(a.erstellt_am));
      docs.push({ art, titel: `Erstattungsantrag ${euro(Number(a.summe))} vom ${tag.split("-").reverse().join(".")}`, datum: tag, name: `Erstattungsantrag-${tag}.txt`, stichworte: "Erstattung, Fahrtkosten",
        text: erstattungBestaetigung(besitzer.vorname, a).text });
    } else if (art === "dienstwunsch") {
      const auf = await dienstwunschAufstellung(besitzer); if (!auf.tage.length) continue;
      docs.push({ art, titel: `Dienstwünsche ${DW.name} (Stand ${auf.stand})`, datum: berlinTag(new Date()), name: `Dienstwuensche-${DW.veranstaltung}.txt`, stichworte: "Dienstwunsch, Dienstplan",
        text: `Köcheclub-App – Meine Dienstwünsche\n${DW.name} · ${besitzer.name} · Stand ${auf.stand}\n────────────────────\n${auf.hinweis}\n\n${auf.tage.map((t: any) => `${t.tag}\n${t.zeilen.map((z: string) => "   " + z).join("\n")}`).join("\n\n")}\n` });
    }
  }
  if (!docs.length) return { abgelegt: 0 };
  const reg = [...(o?.register ?? [])];
  for (const d of docs) { const r = ABLAGE_REGISTER[d.art]; if (r && !reg.includes(r)) reg.splice(Math.max(0, reg.indexOf("Sonstiges") < 0 ? reg.length : reg.indexOf("Sonstiges")), 0, r); }
  if (reg.length !== (o?.register ?? []).length) await db.from("kc_club_archiv_ordner").update({ register: reg.slice(0, 12), geaendert_am: jetzt() }).eq("id", oid);
  const selbst = von === besitzer.person_id;
  for (const d of docs) {
    const bytes = new TextEncoder().encode("\ufeff" + d.text); let b = ""; for (const x of bytes) b += String.fromCharCode(x);
    const datei = await dateiAblegen(besitzer, d.name, "text/plain", btoa(b), ARCHIV_DATEITYPEN);
    const { error } = await db.from("kc_club_archiv_dokumente").insert({ ordner_id: oid, register: ABLAGE_REGISTER[d.art], titel: d.titel.slice(0, 120), datum: d.datum,
      stichworte: archivStichworte(d.stichworte), attachment_id: datei.id, datei_name: datei.name, mime: "text/plain", groesse: datei.groesse, hochgeladen_von: von, status: selbst ? "ok" : "pruefung" });
    if (error) { await dateienEntfernen([datei.id]); throw new Error(error.message); }
  }
  await protokoll(von, "eingaben_archiviert", { besitzer: besitzer.person_id, ordner: oid, dokumente: docs.map((d) => d.art), pruefung: !selbst });
  if (!selbst) {
    const vn = (await personen([von])).get(von)?.display_name || "Die Clubleitung", url = `${APP_URL}#archiv`;
    await senden("club_nachricht", [besitzer.person_id], {
      titel: "📥 Neu in deinem Archiv-Ordner – bitte prüfen", kurz: `${vn} hat ${docs.length === 1 ? "1 Dokument" : `${docs.length} Dokumente`} (${docs.map((d) => d.art === "erstattung" ? "Erstattungsantrag" : "Dienstwünsche").join(", ")}) in deinen Ordner ${jahr} gelegt – annehmen oder ablehnen`,
      betreff: "Köcheclub Werne – neue Dokumente in deinem Archiv-Ordner",
      text: `Hallo ${besitzer.vorname},\n\n${vn} hat dir folgende Aufstellungen in deinen persönlichen Archiv-Ordner ${jahr} gelegt:\n\n${docs.map((d) => "📄 " + d.titel).join("\n")}\n\nSie sind erst sichtbar, wenn du sie annimmst (Archiv → Mein Ordner ${jahr}). Ablehnen löscht sie.\n\n${url}\n\nViele Grüße\nKöcheclub-App`,
      url,
    }, `club-eingaben-archiv:${besitzer.person_id}:${Date.now()}`).catch(() => null);
  }
  return { abgelegt: docs.length, ordner: oid, pruefung: !selbst };
}
// KC-CLUB-POSTAUSGANG (1.69.1): beim Wartungslauf offene Einträge verschicken (je Lauf höchstens 20; Ergebnis bleibt als Audit stehen)
async function postausgangLauf() {
  const { data: offen } = await db.from("kc_club_postausgang").select("*").is("gesendet_am", null).order("erstellt_am").limit(20);
  for (const o of offen ?? []) {
    let ergebnis: any = null;
    try {
      if (o.art === "erstattung_bestaetigung") {
        const { data: a } = await db.from("kc_club_erstattung").select("id,person_id,positionen,summe,auszahlung").eq("id", o.bezug).maybeSingle();
        if (!a || a.person_id !== o.person_id) ergebnis = { fehler: "Antrag nicht gefunden oder gehört jemand anderem" };
        else {
          const p = (await personen([o.person_id])).get(o.person_id);
          ergebnis = await routerSenden("club_nachricht_beide", [o.person_id], erstattungBestaetigung(vorname(p), a, txt(o.hinweis, 500)), `club-postausgang:${o.id}`);
        }
      } else if (o.art === "archiv_ablage") {
        // bezug: Teile durch „|“ getrennt, z. B. „erstattung:<id>|dienstwunsch“ – landet „zur Prüfung“ im Ordner des Mitglieds
        const p = (await personen([o.person_id])).get(o.person_id);
        const besitzer: any = { person_id: o.person_id, name: p?.display_name || o.person_id, vorname: vorname(p) };
        ergebnis = await eingabenArchivieren(besitzer, String(o.bezug).split("|"), o.veranlasst_von);
      } else ergebnis = { fehler: "unbekannte Art" };
    } catch (e) { ergebnis = { fehler: String(e).slice(0, 200) }; }
    await db.from("kc_club_postausgang").update({ gesendet_am: jetzt(), ergebnis }).eq("id", o.id);
    await protokoll(o.veranlasst_von, "postausgang_gesendet", { eintrag: o.id, art: o.art, an: o.person_id, ergebnis });
  }
}
async function fotoHolen(id: unknown) {
  const { data: f } = await db.from("kc_club_fotos").select("*").eq("id", String(id || "")).maybeSingle();
  if (!f) throw new Fehler("Foto nicht gefunden.", 404);
  return f;
}
// Anlässe für die Auswahl: Treffen/Veranstaltungen (letzte 3 Jahre bis heute+1 Jahr) und Aktionen aus dem KC Manager
async function fotoAnlaesse() {
  const [{ data: tr }, { liste }] = await Promise.all([
    db.from("kc_club_treffen").select("id,titel,beginn").neq("status", "abgesagt")
      .gte("beginn", new Date(Date.now() - 3 * 365 * 86400000).toISOString()).lte("beginn", new Date(Date.now() + 365 * 86400000).toISOString()).order("beginn", { ascending: false }),
    aktionenRoh(),
  ]);
  return [
    ...(liste as any[]).map((a) => ({ art: "aktion", id: String(a.id), titel: txt(a.activity, 120) || "Aktion", datum: a.dateFrom })),
    ...(tr ?? []).map((t: any) => ({ art: "treffen", id: t.id, titel: t.titel, datum: berlinTag(new Date(t.beginn)) })),
  ].sort((x, y) => String(y.datum).localeCompare(String(x.datum)));
}
async function fotoBezugPruefen(art: unknown, id: unknown) {
  if (!art) return { bezug_art: null, bezug_id: null };
  const a = String(art), i = String(id || "");
  if (a !== "treffen" && a !== "aktion") throw new Fehler("Unbekannter Anlass.");
  if (!(await fotoAnlaesse()).some((x) => x.art === a && x.id === i)) throw new Fehler("Anlass nicht gefunden.");
  return { bezug_art: a, bezug_id: i };
}
const fotoDatum = (v: unknown) => { const d = String(v || ""); if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < "1950-01-01" || d > berlinTag(new Date(Date.now() + 86400000))) throw new Fehler("Bitte ein gültiges Datum wählen."); return d; };

// ---------- Verbindung & Wartung (KC-CLUB-VERBINDUNG) ----------
// Wartungsmodus steht in der zentralen Programm-Registry (kc_core_app_registry, Eintrag KC_CLUBAPP).
const APP_ID = "KC_CLUBAPP";

// ----- KC-CLUB-FEEDBACK: Fragebogen (eine Stelle; neue Fragen → neue Bogen-Kennung, alte Antworten bleiben auswertbar) -----
// KC-CLUB-FEEDBACK-DAUERHAFT (0.40.0): zu bestimmten Antworten fragt die App nach dem Warum (Text landet in antworten["<id>_grund"])
type FbGrund = { bei: string[]; pflicht: string[]; t: string };
const FB_GRUND_MAX = 500;
const FEEDBACK_BOGEN = "2026-2"; // 1.73.0 (Wunsch Hansi): Bogen an die vielen neuen Funktionen angepasst und gekürzt → neue Kennung (Runde 2026-1 liegt im Archiv)
type FbFrage = { id: string; schritt: 1 | 2; t: string; art: "eins" | "mehr"; optionen: string[]; grund?: FbGrund };
// Bewusst kurz („nicht zu viel fragen“): Schritt 1 sechs Fragen, Schritt 2 nur offene Wünsche – Gebautes steht unter „Schon umgesetzt“
const FEEDBACK_FRAGEN: FbFrage[] = [
  { id: "gefallen", schritt: 1, art: "eins", t: "Gefällt dir die App?", optionen: ["👍 Ja", "🤏 Teils", "👎 Nein"] },
  { id: "zurecht", schritt: 1, art: "eins", t: "Findest du dich gut zurecht?", optionen: ["Ja, einfach", "Geht so", "Nein, zu viel"],
    grund: { bei: ["Geht so", "Nein, zu viel"], pflicht: [], t: "Was ist dir zu viel oder unklar? Tipp: ⚙️ → „Einfache Ansicht“ zeigt nur das Wichtigste" } },
  { id: "tempo", schritt: 1, art: "eins", t: "Ist die App schnell genug?", optionen: ["Ja", "Manchmal langsam", "Oft langsam"] },
  { id: "genutzt", schritt: 1, art: "mehr", t: "Was nutzt du am meisten? (mehrere möglich)",
    optionen: ["📅 Termine", "💬 Nachrichten", "👥 Mitglieder", "📌 Pinnwand", "📷 Fotos & Alben", "🗄️ Archiv & Chronik", "🤝 Helfen, Leihen & Börse",
      "🗓️ Dienste & Dienstwünsche", "🗳️ Vorschläge & Abstimmungen", "📄 Protokolle"] },
  { id: "probleme", schritt: 1, art: "mehr", t: "Hattest du schon Probleme? (mehrere möglich)",
    optionen: ["✅ Keine Probleme", "🔑 Anmeldung / Link", "🔔 Benachrichtigungen kommen nicht", "💬 WhatsApp / Route öffnen", "📷 Fotos hochladen",
      "⏳ App lädt nicht / hängt", "🔍 Etwas nicht gefunden", "🤯 Zu viele Funktionen"] },
  { id: "dauerhaft", schritt: 1, art: "eins", t: "Ich halte die Club-App für sinnvoll und werde sie dauerhaft einsetzen.", optionen: ["👍 Ja", "🤔 Vielleicht", "👎 Nein"],
    grund: { bei: ["🤔 Vielleicht", "👎 Nein"], pflicht: ["👎 Nein"], t: "Warum nicht? Gib doch einen hilfreichen Kommentar ab – was müsste anders sein?" } },
  { id: "wuensche", schritt: 2, art: "mehr", t: "Was fehlt dir noch? (mehrere möglich)",
    optionen: ["🍲 Rezepte-Sammlung vom Club", "🛒 Mitbring-/Einkaufsliste für Treffen", "💶 Beiträge / Kasse einsehen", "🔁 Dienste untereinander tauschen",
      "▶️ Fotos als automatische Diashow", "📴 Auch ohne Internet lesen", "📰 Club-Rundbrief (monatlich)", "📊 Meine Dienste & Teilnahmen im Überblick"] },
];
// Wünsche aus dem Fragebogen und Funktionen, die inzwischen gebaut sind – die App zeigt sie als „✅ Schon umgesetzt“ (0.26.0, 1.73.0 aktualisiert)
const FEEDBACK_UMGESETZT = ["🔀 Kacheln selbst anordnen (lange drücken & ziehen)", "🎨 Farbdesigns mit Tag-/Nachtmodus", "🔠 Große Schrift",
  "📆 Monatskalender", "👥 Gruppen-Chats", "📌 Pinnwand", "📂 Dokumente & Archiv (Satzung, Formulare)", "🎤 Sprachnachricht, Diktieren & Vorlesen",
  "🗣️ Sprachansagen", "🖍️ Tippfehler rot unterstreichen", "🖼️ Fotoalben & Blättern", "📖 Clubchronik", "🎂 Geburtstage im Kalender",
  "🎓 Schulungsunterlagen (Kasse)", "🚗 Fahrgemeinschaften", "✅ Aufgaben aus Protokollen", "🤝 Helfen & Leihen", "🛍️ Club-Börse",
  "🆘 SOS & Notfallpass", "📍 Standort teilen", "👋 Anklopfen", "📲 Termine im Handy-Kalender"];
const FB_TEXT_MAX = 2000;
function feedbackPruefen(roh: unknown) {
  const a = (roh && typeof roh === "object" ? roh : {}) as Record<string, unknown>, aus: Record<string, string | string[]> = {};
  for (const f of FEEDBACK_FRAGEN) {
    const v = a[f.id];
    if (f.art === "eins") { if (typeof v === "string" && f.optionen.includes(v)) aus[f.id] = v; }
    const g = a[`${f.id}_grund`];
    if (f.grund && typeof aus[f.id] === "string" && f.grund.bei.includes(aus[f.id] as string) && typeof g === "string" && g.trim()) aus[`${f.id}_grund`] = g.trim().slice(0, FB_GRUND_MAX);
    else if (Array.isArray(v)) { const l = [...new Set(v.filter((x) => typeof x === "string" && f.optionen.includes(x)))] as string[]; if (l.length) aus[f.id] = l; }
  }
  return aus;
}
// Antworten ins Archiv kopieren und erst dann löschen; schlägt die Kopie fehl, wird nichts gelöscht
async function feedbackArchivieren(ich: Ich, grund: string, nurPerson: string | null) {
  let q = db.from("kc_club_feedback").select("id,person_id,fragebogen,antworten,idee,mitteilung,anonym,erstellt_am,geaendert_am").eq("fragebogen", FEEDBACK_BOGEN);
  if (nurPerson) q = q.eq("person_id", nurPerson);
  const { data, error } = await q;
  if (error) throw new Fehler("Feedback konnte nicht gelesen werden.", 500);
  const rows = data ?? [];
  if (!rows.length) return 0;
  const { error: fa } = await db.from("kc_club_feedback_archiv").insert(rows.map((r: any) => ({ ...r, archiviert_von: ich.person_id, grund })));
  if (fa) throw new Fehler("Sicherungskopie fehlgeschlagen – es wurde nichts gelöscht.", 500);
  const { error: fd } = await db.from("kc_club_feedback").delete().in("id", rows.map((r: any) => r.id));
  if (fd) throw new Fehler("Löschen fehlgeschlagen (Sicherungskopie ist vorhanden).", 500);
  return rows.length;
}
// ----- KC-CLUB-KACHELN: persönliche Einstellungen der Oberfläche (je Mitglied, geräteübergreifend) -----
// Erlaubte Schlüssel mit Prüfung; neue Einstellungen (z. B. Farben) kommen hier dazu.
const KA_ID = /^[a-z0-9_-]{1,30}$/;
const kaIds = (v: unknown) => [...new Set((Array.isArray(v) ? v : []).filter((x) => typeof x === "string" && KA_ID.test(x)))].slice(0, 50) as string[];
const EINSTELLUNGEN: Record<string, (w: any) => unknown> = {
  kacheln: (w) => ({
    reihenfolge: Object.fromEntries(Object.entries(w?.reihenfolge && typeof w.reihenfolge === "object" ? w.reihenfolge : {})
      .filter(([r]) => KA_ID.test(r)).slice(0, 10).map(([r, l]) => [r, kaIds(l)])),
    aus: kaIds(w?.aus),
    // KC-CLUB-REGISTER-ZIEHEN (0.36.0): eigene Reihenfolge der Register (Verein, Mein Bereich, Programme)
    register: kaIds(w?.register).slice(0, 10),
  }),
  // KC-CLUB-INFOFELD (0.44.0): welche Karte oben beim Start erscheint („zuletzt“ = die zuletzt gezeigte)
  infofeld: (w) => ({ start: typeof w?.start === "string" && KA_ID.test(w.start) ? w.start : "zuletzt" }),
  // KC-CLUB-ONLINE (0.29.0): anderen zeigen, wann ich online bin (Standard: an)
  online: (w) => ({ zeigen: w?.zeigen !== false }),
  // KC-CLUB-ONLINE-PUSH (1.57.0): Admin bekommt eine Push, wenn ein Mitglied online kommt (Standard: an)
  online_push: (w) => ({ an: w?.an !== false }),
  // KC-CLUB-ZULETZT-DA (1.20.0): anderen zeigen, wann ich zuletzt in der App war (Standard: an, gegenseitig wie WhatsApp)
  zuletzt: (w) => ({ zeigen: w?.zeigen !== false }),
  // KC-CLUB-BRIEFBOGEN (1.26.0): eigene Absenderzeile/Fußzeile und Unterschrift je Person (Clubleitung)
  briefbogen: (w) => ({ absender: txt(w?.absender, 200), fuss: txt(w?.fuss, 300), name: txt(w?.name, 80), amt: txt(w?.amt, 80) }),
  // KC-CLUB-STUMM (1.9.0): Unterhaltungen stummschalten – je Unterhaltung „immer“ oder bis Zeitpunkt (höchstens 200)
  stumm: (w) => ({ threads: Object.fromEntries(Object.entries(w?.threads && typeof w.threads === "object" ? w.threads : {})
    .filter(([id, b]) => /^[0-9a-f-]{36}$/.test(id) && (b === "immer" || (typeof b === "string" && !isNaN(Date.parse(b)) && Date.parse(b) > Date.now())))
    .slice(0, 200).map(([id, b]) => [id, b === "immer" ? "immer" : new Date(String(b)).toISOString()])) }),
  // KC-CLUB-ANKLOPFEN-ERLAUBEN (1.8.0): darf man bei mir anklopfen (Standard: ja) + welcher Anklopfton (Registry in der App)
  anklopfen: (w) => ({ erlaubt: w?.erlaubt !== false, ton: typeof w?.ton === "string" && /^[a-z]{1,15}$/.test(w.ton) ? w.ton : "klopf" }),
  // KC-CLUB-SCHNELLSTART (1.8.0): große Kachel mit Symbolen (nur erweiterte Ansicht) – an/aus und eigene Auswahl (höchstens 8,
  // Reihenfolge = Auswahl; null = Grundeinstellung der App)
  schnellstart: (w) => ({ an: w?.an !== false,
    ids: Array.isArray(w?.ids) ? [...new Set(w.ids.filter((x: unknown) => typeof x === "string" && /^[a-z_]{1,20}$/.test(x)))].slice(0, 8) : null }),
  // KC-CLUB-LIVETIPPEN (0.56.0): andere sehen live, was ich in einer Unterhaltung tippe (Standard: aus – freiwillig)
  live_tippen: (w) => ({ an: w?.an === true }),
  // KC-CLUB-RUHEZEIT (0.98.0): „Nicht stören“ – in diesem Zeitraum kein Push (Anrufe kommen weiter durch)
  ruhezeit: (w) => {
    const zeit = (x: unknown, std: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(x)) ? String(x) : std;
    return { an: w?.an === true, von: zeit(w?.von, "22:00"), bis: zeit(w?.bis, "07:00"), erwaehnung: w?.erwaehnung !== false };
  },
  // KC-CLUB-PINNWAND-ERINNERUNG (0.64.0): „hängen lassen“ je eigenem Zettel – wann frühestens wieder erinnern (höchstens 20)
  pinnwand_erinnert: (w) => ({ bis: Object.fromEntries(Object.entries(w?.bis && typeof w.bis === "object" ? w.bis : {})
    .filter(([id, d]) => /^[0-9a-f-]{36}$/.test(id) && typeof d === "string" && !isNaN(Date.parse(d))).slice(-20)) }),
  // KC-CLUB-EINSTIEG (0.70.0): Tipps nach und nach (Farbe, Privatsphäre, erweiterte Ansicht) – je Schritt Antwort + Zeitpunkt
  // KC-CLUB-TIPP (1.6.0): Tipp des Tages – an/aus (Standard an), „kenne ich“ und „später“ je Tipp, zuletzt gezeigt (höchstens 1× am Tag)
  tipps: (w) => {
    const liste = (x: any) => Object.fromEntries(Object.entries(x && typeof x === "object" ? x : {})
      .filter(([k, v]) => /^[a-z0-9_-]{1,30}$/.test(k) && !isNaN(Date.parse(String(v)))).slice(0, 80).map(([k, v]) => [k, new Date(String(v)).toISOString()]));
    return { an: w?.an !== false, bekannt: liste(w?.bekannt), spaeter: liste(w?.spaeter), zuletzt: !isNaN(Date.parse(String(w?.zuletzt))) ? new Date(String(w.zuletzt)).toISOString() : null };
  },
  einstieg: (w) => ({ schritte: Object.fromEntries(Object.entries(w?.schritte && typeof w.schritte === "object" ? w.schritte : {})
    .filter(([k, v]: [string, any]) => ["farbe", "privat", "erweitert", "feedback", "geraete"].includes(k) && ["ja", "nein", "spaeter"].includes(v?.antwort) && !isNaN(Date.parse(v?.am)))
    .map(([k, v]: [string, any]) => [k, { antwort: v.antwort, am: new Date(v.am).toISOString() }])) }),
  // KC-CLUB-WETTERORT (0.74.0): eigener Wetterort je Mitglied (null = Club-Vorgabe des Admins)
  wetterort: (w) => ({ ort: w?.ort ? wetterOrtPruefen(w.ort) : null }),
  // KC-CLUB-ANSICHT (0.62.0): einfache oder erweiterte Ansicht – beim ersten Start einmal gefragt, jederzeit umschaltbar
  ansicht: (w) => ({ art: w?.art === "erweitert" ? "erweitert" : "einfach", gewaehlt: w?.gewaehlt === true, am: new Date().toISOString() }),
  // KC-CLUB-BEGRUESSUNG (0.28.0): Begrüßung beim ersten Start einmal je Mitglied (geräteübergreifend)
  begruessung: (w) => ({ gesehen: !!w?.gesehen, am: new Date().toISOString() }),
  // KC-CLUB-DESIGN (0.24.0): fertiges Farbdesign + Tag/Nacht (automatisch, immer Tag, immer Nacht)
  design: (w) => ({
    design: typeof w?.design === "string" && KA_ID.test(w.design) ? w.design : "klassik",
    modus: ["auto", "tag", "nacht"].includes(w?.modus) ? w.modus : "auto",
  }),
};
// ----- KC-CLUB-TODO (0.36.0): Kategorien der To-do-Liste (Registry – neue Kategorie = neuer Eintrag) -----
const TODO_KATEGORIEN = [
  { id: "einkaufen", sym: "🛒", name: "Einkaufen" }, { id: "bestellung", sym: "📦", name: "Bestellung" }, { id: "erledigen", sym: "🧹", name: "Erledigen" },
  { id: "anrufen", sym: "📞", name: "Anrufen" }, { id: "vorbereiten", sym: "🍳", name: "Vorbereiten" }, { id: "sonstiges", sym: "📝", name: "Sonstiges" },
];
// KC-CLUB-TODO-ZUSTAENDIG (0.37.0): nur aktive Mitglieder; Zuständige bekommen Bescheid (Bereich „Termine“ wie Protokoll-Aufgaben)
async function todoZustaendig(v: unknown): Promise<string | null> {
  const id = String(v || ""); if (!id) return null;
  if (!(await aktiveMitglieder()).some((m) => m.person_id === id)) throw new Fehler("Mitglied nicht gefunden.", 404);
  return id;
}
// KC-CLUB-TODO-MEHRERE (0.52.0): mehrere Zuständige (Liste oder einzelne ID wie bisher), höchstens TODO_MAX_ZUSTAENDIGE
const TODO_MAX_ZUSTAENDIGE = 10;
async function todoZustaendige(v: unknown): Promise<string[]> {
  const roh = (Array.isArray(v) ? v : v ? [v] : []).map((x) => String(x || "")).filter(Boolean);
  const ids = [...new Set(roh)].slice(0, TODO_MAX_ZUSTAENDIGE);
  if (!ids.length) return [];
  const aktiv = new Set((await aktiveMitglieder()).map((m) => m.person_id));
  if (ids.some((id) => !aktiv.has(id))) throw new Fehler("Mitglied nicht gefunden.", 404);
  return ids;
}
async function todoBenachrichtigen(ich: Ich, an: string, text: string, faellig: string | null, id: string) {
  const bis = faellig ? ` – bis ${faellig.split("-").reverse().join(".")}` : "";
  const r = await senden("club_aufgabe", [an], {
    titel: `✅ Neue Aufgabe von ${ich.vorname}`, kurz: text + bis,
    betreff: `Köcheclub Werne – neue Aufgabe für dich`, text: `Hallo,\n\n${ich.name} hat dir eine Aufgabe in der To-do-Liste zugewiesen:\n\n„${text}“${bis}\n\nAbhaken kannst du sie in der Köcheclub-App unter Termine → ✅ To-do.\n\nViele Grüße\nKöcheclub Werne`,
    url: `${APP_URL}#todo`,
  }, `club-todo:${id}:${an}`);
  await protokoll(ich.person_id, "todo_zugewiesen", { an, versand: r });
  return r;
}
// ----- KC-CLUB-ERSTATTUNG (0.38.0): Fahrtkosten, vorgestreckter Einkauf, sonstige Auslagen (Registry) -----
const ERSTATTUNG = {
  kmSatzStandard: 0.38, // € je km, nur falls in kc_club_km_satz nichts eingetragen ist (0.39.0: Satz pflegt der Admin mit „gilt ab“)
  gruende: ["Kochen in Dortmund", "Fahrt zum Budendienst", "Einkaufsfahrt für den Club", "Club-Treffen / Sitzung", "Veranstaltung / Weihnachtsmarkt", "Schulung / Fortbildung", "Abholen / Liefern von Material"],
  arten: [{ id: "fahrt", sym: "🚗", name: "Fahrtkosten" }, { id: "einkauf", sym: "🛒", name: "Einkauf vorgestreckt" }, { id: "sonstiges", sym: "📦", name: "Sonstige Auslage" }],
  empfaenger: { an: "Kassenwart", cc: "Clubsprecher" }, // Ämter aus kc_club_rollen
};
const euro = (n: number) => n.toFixed(2).replace(".", ",") + " €";
// KC-CLUB-KMSATZ (0.39.0): Sätze mit „gilt ab“ – für eine Fahrt gilt der letzte Satz, dessen Datum nicht nach der Fahrt liegt
type KmSatz = { id: string; satz: number; ab: string };
// ----- KC-CLUB-WETTER (0.42.0): Wetter im Info-Feld der Startseite. Datenquelle und Wetter-App über Registry + Adapter,
// Ort und App stellt der Admin ein (kc_club_konfig „wetter“). Kostenlos: Open-Meteo braucht keinen Schlüssel.
// Der Server holt das Wetter (Mitglieder-Handys sprechen nicht mit fremden Diensten) und merkt es sich 30 Minuten.
type WetterOrt = { name: string; lat: number; lon: number; region: string };
type WetterDaten = { jetzt: { temp: number; gefuehlt: number; code: number; wind: number; boeen: number; regen: number; tag: boolean };
  tage: { datum: string; code: number; max: number; min: number; regenWkt: number | null; sonnenauf: string; sonnenunter: string;
    regenMm?: number | null; windMax?: number | null; boeenMax?: number | null; uv?: number | null; sonneStd?: number | null;
    stunden?: { zeit: string; code: number; temp: number; regenWkt: number | null; tag: boolean }[] }[] };
const WETTER_STUNDEN = [6, 9, 12, 15, 18, 21], WETTER_STUNDEN_TAGE = 7; // Tagesdetails: alle 3 Stunden, für die nächsten 7 Tage
const WETTER = { standardOrt: { name: "Werne", lat: 51.6639, lon: 7.6337, region: "Nordrhein-Westfalen" } as WetterOrt,
  standardQuelle: "open-meteo", standardApp: "wetteronline", cacheMin: 30, zeitzone: "Europe/Berlin" };
const WETTER_QUELLEN: Record<string, { name: string; hinweis: string; holen: (o: WetterOrt) => Promise<WetterDaten>; suchen: (q: string) => Promise<WetterOrt[]> }> = {
  "open-meteo": {
    name: "Open-Meteo", hinweis: "kostenlos, ohne Anmeldung, Daten u. a. vom Deutschen Wetterdienst",
    holen: async (o) => {
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${o.lat}&longitude=${o.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,precipitation,is_day`
        + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunshine_duration`
        + `&hourly=temperature_2m,weather_code,precipitation_probability,is_day&timezone=${encodeURIComponent(WETTER.zeitzone)}&forecast_days=16`;
      const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error("Open-Meteo " + r.status);
      const d = await r.json(), c = d.current ?? {}, t = d.daily ?? {}, h = d.hourly ?? {};
      const zahlOd = (v: unknown) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
      const stunden = (datum: string) => (h.time ?? []).map((zeit: string, i: number) => ({ zeit, i }))
        .filter((x: any) => x.zeit.startsWith(datum) && WETTER_STUNDEN.includes(Number(x.zeit.slice(11, 13))))
        .map(({ zeit, i }: any) => ({ zeit: zeit.slice(11, 16), code: Number(h.weather_code[i]), temp: Number(h.temperature_2m[i]), regenWkt: zahlOd(h.precipitation_probability?.[i]), tag: h.is_day?.[i] === 1 }));
      return {
        jetzt: { temp: Number(c.temperature_2m), gefuehlt: Number(c.apparent_temperature), code: Number(c.weather_code), wind: Number(c.wind_speed_10m), boeen: Number(c.wind_gusts_10m), regen: Number(c.precipitation ?? 0), tag: c.is_day === 1 },
        tage: (t.time ?? []).map((datum: string, i: number) => ({ datum, code: Number(t.weather_code[i]), max: Number(t.temperature_2m_max[i]), min: Number(t.temperature_2m_min[i]),
          regenWkt: t.precipitation_probability_max?.[i] ?? null, sonnenauf: String(t.sunrise?.[i] ?? "").slice(11, 16), sonnenunter: String(t.sunset?.[i] ?? "").slice(11, 16),
          regenMm: zahlOd(t.precipitation_sum?.[i]), windMax: zahlOd(t.wind_speed_10m_max?.[i]), boeenMax: zahlOd(t.wind_gusts_10m_max?.[i]), uv: zahlOd(t.uv_index_max?.[i]),
          sonneStd: zahlOd(t.sunshine_duration?.[i]) === null ? null : Math.round(Number(t.sunshine_duration[i]) / 360) / 10,
          ...(i < WETTER_STUNDEN_TAGE ? { stunden: stunden(datum) } : {}) })),
      };
    },
    suchen: async (q) => {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=de`, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error("Ortssuche " + r.status);
      return ((await r.json()).results ?? []).map((x: any) => ({ name: String(x.name), lat: Number(x.latitude), lon: Number(x.longitude),
        region: [x.admin3 || x.admin2, x.admin1, x.country_code !== "DE" ? x.country : ""].filter(Boolean).join(", ") }));
    },
  },
};
// Wetter-Apps/-Seiten zum Weiterlesen (Link beim Antippen); {ort} = Ortsname, {slug} = Ortsname für Adressen, {lat}/{lon}
const WETTER_APPS: Record<string, { name: string; url: string }> = {
  wetteronline: { name: "WetterOnline", url: "https://www.wetteronline.de/wetter/{slug}" },
  windy: { name: "Windy (Wetterkarte)", url: "https://www.windy.com/{lat}/{lon}?{lat},{lon},10" },
  dwd: { name: "DWD Unwetterwarnungen", url: "https://www.dwd.de/DE/wetter/warnungen/warnWetter_node.html" },
  google: { name: "Google Wetter", url: "https://www.google.com/search?q=Wetter+{ort}" },
};
const wetterSlug = (n: string) => n.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function wetterAppLink(appId: string, o: WetterOrt) {
  const a = WETTER_APPS[appId] ?? WETTER_APPS[WETTER.standardApp];
  return { id: WETTER_APPS[appId] ? appId : WETTER.standardApp, name: a.name, url: a.url.replaceAll("{slug}", wetterSlug(o.name)).replaceAll("{ort}", encodeURIComponent(o.name))
    .replaceAll("{lat}", o.lat.toFixed(3)).replaceAll("{lon}", o.lon.toFixed(3)) };
}
function wetterOrtPruefen(roh: any): WetterOrt {
  const o = { name: txt(roh?.name, 80), lat: Number(roh?.lat), lon: Number(roh?.lon), region: txt(roh?.region, 120) };
  if (!o.name || !(o.lat >= -90 && o.lat <= 90) || !(o.lon >= -180 && o.lon <= 180)) throw new Fehler("Bitte einen Ort aus der Suche auswählen.");
  return o;
}
async function wetterKonfig() {
  const { data } = await db.from("kc_club_konfig").select("wert,geaendert_am").eq("schluessel", "wetter").maybeSingle();
  const w = data?.wert ?? {};
  let ort = WETTER.standardOrt; try { if (w.ort) ort = wetterOrtPruefen(w.ort); } catch { /* Voreinstellung */ }
  return { ort, quelle: WETTER_QUELLEN[w.quelle] ? String(w.quelle) : WETTER.standardQuelle, app: WETTER_APPS[w.app] ? String(w.app) : WETTER.standardApp, geaendert: data?.geaendert_am ?? null };
}
const wetterCache = new Map<string, { zeit: number; daten: WetterDaten }>();
async function kmSaetze(): Promise<KmSatz[]> {
  const { data } = await db.from("kc_club_km_satz").select("id,satz,gilt_ab").order("gilt_ab", { ascending: true });
  return (data ?? []).map((x: any) => ({ id: x.id, satz: Number(x.satz), ab: x.gilt_ab }));
}
const satzFuer = (saetze: KmSatz[], datum: string) => { let s = ERSTATTUNG.kmSatzStandard; for (const x of saetze) if (x.ab <= datum) s = x.satz; return s; };
function erstattungPruefen(roh: unknown, ich: Ich, saetze: KmSatz[]) {
  const liste = (Array.isArray(roh) ? roh : []).slice(0, 20), pos: any[] = [], heute = Date.now();
  for (const x of liste as any[]) {
    const datum = /^\d{4}-\d{2}-\d{2}$/.test(String(x?.datum || "")) ? String(x.datum) : "";
    if (!datum || new Date(datum + "T00:00:00Z").getTime() > heute + 86400000) throw new Fehler("Bitte bei jeder Position ein gültiges Datum angeben (nicht in der Zukunft).");
    const beleg = (Array.isArray(x?.belege) ? x.belege : []).map(String).slice(0, 5);
    if (x?.art === "fahrt") {
      const km = Math.round(Number(x.km) * 10) / 10;
      if (!(km > 0 && km <= 3000)) throw new Fehler("Bitte die gefahrenen Kilometer angeben (1 bis 3000).");
      const grund = txt(x.grund, 120); if (!grund) throw new Fehler("Bitte den Grund der Fahrt angeben.");
      const satz = satzFuer(saetze, datum);
      pos.push({ art: "fahrt", datum, km, satz, grund, ziel: txt(x.ziel, 120), betrag: Math.round(km * satz * 100) / 100, belege: beleg });
    } else if (x?.art === "einkauf" || x?.art === "sonstiges") {
      const betrag = Math.round(Number(String(x.betrag).replace(",", ".")) * 100) / 100;
      if (!(betrag > 0 && betrag <= 5000)) throw new Fehler("Bitte einen Betrag zwischen 0,01 € und 5.000 € angeben.");
      const was = txt(x.was, 200); if (!was) throw new Fehler(x.art === "einkauf" ? "Bitte angeben, was eingekauft wurde." : "Bitte die Auslage kurz beschreiben.");
      pos.push({ art: x.art, datum, betrag, was, geschaeft: txt(x.geschaeft, 120), belege: beleg });
    } else throw new Fehler("Unbekannte Art der Erstattung.");
  }
  if (!pos.length) throw new Fehler("Bitte mindestens eine Position hinzufügen.");
  return pos;
}
// ----- KC-CLUB-PINNWAND (0.25.0): höchstens PINNWAND_MAX Zettel je Person, je Zettel höchstens 200 Zeichen -----
// KC-CLUB-PINNWAND-FARBEN (0.60.0): 4 statt 3; jeder Zettel behält seine Farbe 1–4 (gelb, rosé, hellgrün, hellblau), ein neuer
// bekommt die kleinste freie – abgenommene Zettel machen ihre Farbe frei, die anderen rücken nicht nach.
const PINNWAND_MAX = 4, PINNWAND_ZEICHEN = 200;
// KC-CLUB-PINNWAND-LIVE (0.57.0): eine Formulierung für Push und Einblendung. „privat“ nur, wenn der Zettel wirklich nur
// für diese eine Person ist (für bestimmte Personen, genau ein Empfänger) – bei „für alle“ oder mehreren Empfängern ohne „privat“.
// KC-CLUB-PINNWAND-FRISTEN (0.65.0): Erinnerung an eigene Zettel – vom Admin einstellbar (kc_club_konfig „pinnwand“)
const PINNWAND_FRISTEN_STANDARD = { erinnernTage: 3, pauseTage: 7 };
const PINNWAND_FRISTEN_GRENZEN = { erinnernTage: [1, 30], pauseTage: [1, 60] } as const;
async function pinnwandFristen() {
  const { data } = await db.from("kc_club_konfig").select("wert,geaendert_am").eq("schluessel", "pinnwand").maybeSingle();
  const w: any = data?.wert ?? {}, zahl = (k: keyof typeof PINNWAND_FRISTEN_GRENZEN) => {
    const n = Math.round(Number(w[k])), [lo, hi] = PINNWAND_FRISTEN_GRENZEN[k];
    return Number.isFinite(n) && n >= lo && n <= hi ? n : PINNWAND_FRISTEN_STANDARD[k]; };
  return { erinnernTage: zahl("erinnernTage"), pauseTage: zahl("pauseTage"), geaendertAm: data?.geaendert_am ?? null };
}
// KC-CLUB-EINSTIEG-FRISTEN (0.71.0): Zeitpunkte der Einstiegs-Tipps – vom Admin einstellbar (kc_club_konfig „einstieg“)
const EINSTIEG_STANDARD = { aktiv: true, farbeTage: 3, privatTage: 3, erweitertTage: 14, spaeterTage: 3, feedbackTage: 28, geraeteTage: 21 };
const EINSTIEG_GRENZEN = { farbeTage: [1, 20], privatTage: [1, 30], erweitertTage: [1, 90], spaeterTage: [1, 30], feedbackTage: [1, 180], geraeteTage: [1, 120] } as const;
async function einstiegFristen() {
  const { data } = await db.from("kc_club_konfig").select("wert,geaendert_am").eq("schluessel", "einstieg").maybeSingle();
  const w: any = data?.wert ?? {}, zahl = (k: keyof typeof EINSTIEG_GRENZEN) => {
    const n = Math.round(Number(w[k])), [lo, hi] = EINSTIEG_GRENZEN[k];
    return Number.isFinite(n) && n >= lo && n <= hi ? n : EINSTIEG_STANDARD[k]; };
  return { aktiv: w.aktiv !== false, farbeTage: zahl("farbeTage"), privatTage: zahl("privatTage"), erweitertTage: zahl("erweitertTage"), spaeterTage: zahl("spaeterTage"), feedbackTage: zahl("feedbackTage"), geraeteTage: zahl("geraeteTage"), geaendertAm: data?.geaendert_am ?? null };
}
const pinnwandPrivat = (z: { fuer: string; personen?: string[] | null }) => z.fuer === "personen" && (z.personen ?? []).length === 1;
const pinnwandHinweis = (von: string, privat: boolean, wichtig: boolean) => `Du hast ein neues ${wichtig ? "wichtiges " : ""}${privat ? "privates " : ""}Post-it von ${von} bekommen`;
async function pinnwandSichtbar(ich: Ich) {
  const { data } = await db.from("kc_club_pinnwand").select("id,person_id,text,wichtig,fuer,personen,erstellt_am,farbe").is("entfernt_am", null)
    .or(`person_id.eq.${ich.person_id},fuer.eq.alle,personen.cs.{${ich.person_id}}`)
    .order("wichtig", { ascending: false }).order("erstellt_am", { ascending: false }).limit(100);
  return data ?? [];
}
const MAX_TESTDATEN = 2 * 1024 * 1024; // Verbindungstest: höchstens 2 MB je Richtung
async function wartungLesen() {
  const { data } = await db.from("kc_core_app_registry").select("wartung,wartung_hinweis,wartung_seit").eq("app_id", APP_ID).maybeSingle();
  return { an: !!data?.wartung, hinweis: data?.wartung_hinweis ?? null, seit: data?.wartung_seit ?? null };
}
// zufällige, kaum komprimierbare Testdaten (sonst misst der Test die Kompression statt der Leitung)
function testDaten(n: number) {
  const b = new Uint8Array(Math.ceil(n * 3 / 4)); for (let i = 0; i < b.length; i += 65536) crypto.getRandomValues(b.subarray(i, i + 65536));
  let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s).slice(0, n);
}

// ---------- Zustand KC Communicator (KC-CLUB-COMMUNICATOR-STATUS) ----------
// Nur lesen: Einstellungen, Versandwege (provider_routes), Gesundheitsbericht (alle 5 Min.) und die eigenen Versandaufträge.
// Farbe: rot = Störung · blau = Versand pausiert (Wartung) · gelb = eingeschränkt · grün = läuft · grau = unbekannt/veraltet.
const COMM_BERICHT_VERALTET_MIN = 15;
const COMM_OK = ["sent", "displayed", "opened", "delivered", "acknowledged"];
const COMM_OFFEN = ["queued", "pending", "processing", "retry_scheduled", "scheduled"];
const COMM_FEHLER = ["failed", "dead_lettered", "error"];
// KC-CLUB-LED-EMPFAENGER (0.85.0): Fehler auf Empfängerseite (kein Push-Gerät, keine Adresse) sind keine Störung des Versands –
// dieselbe Liste wie im KC Communicator (kc-communication-router/-dispatch „empfaengerFehler“). Sie färben die LED nicht.
const COMM_EMPFAENGER_FEHLER = /^(PUSH_NO_ACTIVE_SUBSCRIPTION|PUSH_SUBSCRIPTION_NOT_FOUND|PUSH_USER_RECIPIENT_MISSING|EMAIL_RECIPIENT_MISSING)/;
const commSystemFehler = (x: any) => COMM_FEHLER.includes(x.status) && !COMM_EMPFAENGER_FEHLER.test(String(x.error_code || ""));
async function communicatorStatus(ich: Ich, erreichbarkeit = false) {
  const seit7 = new Date(Date.now() - 7 * 86400000).toISOString(), seit24 = new Date(Date.now() - 86400000).toISOString();
  const [{ data: st }, { data: wege }, { data: bericht }, { data: auftr }, erreichbar, { data: alle24 }] = await Promise.all([
    db.from("kc_communication_settings").select("enabled,dispatch_enabled").eq("id", "global").maybeSingle(),
    db.from("kc_communication_provider_routes").select("channel,provider_id,role,enabled,health_status,last_success_at,last_failure_at,consecutive_failures").eq("enabled", true).in("channel", ["push", "email"]),
    db.from("kc_communication_health_snapshots").select("created_at,success_rate,avg_push_ms,avg_email_ms,queued,retrying,failed,active_devices").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("kc_communication_requests").select("status,channel,sent_at,created_at,error_code").eq("source_program", "kc-club").gte("created_at", seit7).order("created_at", { ascending: false }).limit(500),
    erreichbarkeit ? (async () => {
      const t0 = Date.now();
      try { const r = await fetch(`${SUPA}/functions/v1/kc-communication-router`, { method: "OPTIONS", signal: AbortSignal.timeout(4000) }); return { ok: r.status < 500, ms: Date.now() - t0 }; }
      catch { return { ok: false, ms: null }; }
    })() : Promise.resolve(null),
    // fehlgeschlagene Aufträge aller Programme (24 h) – ersetzt den Zähler „failed“ des Zustandsberichts, der Empfängerfehler mitzählt
    db.from("kc_communication_requests").select("status,error_code").in("status", COMM_FEHLER).gte("created_at", seit24).limit(500),
  ]);
  const liste = auftr ?? [];
  const systemFehler24 = (alle24 ?? []).filter(commSystemFehler).length;
  const zahl = (arr: string[]) => liste.filter((x: any) => arr.includes(x.status)).length;
  const club = { gesendet: zahl(COMM_OK), offen: zahl(COMM_OFFEN), fehler: zahl(COMM_FEHLER),
    fehler24: liste.filter((x: any) => commSystemFehler(x) && x.created_at >= seit24).length,
    ohneWeg24: liste.filter((x: any) => COMM_FEHLER.includes(x.status) && !commSystemFehler(x) && x.created_at >= seit24).length,
    letzte: liste.find((x: any) => COMM_OK.includes(x.status))?.sent_at ?? null };
  const kanal = (k: string) => {
    const w = (wege ?? []).filter((x: any) => x.channel === k);
    if (!w.length) return { zustand: "aus", letzterErfolg: null };
    const gut = w.some((x: any) => x.health_status === "healthy" && (x.consecutive_failures ?? 0) < 3);
    const kaputt = w.every((x: any) => (x.consecutive_failures ?? 0) >= 3 || ["down", "unhealthy", "failed"].includes(x.health_status));
    return { zustand: kaputt ? "stoerung" : gut ? "ok" : "unbekannt", letzterErfolg: w.map((x: any) => x.last_success_at).filter(Boolean).sort().pop() ?? null,
      ...(ich.admin ? { wege: w.map((x: any) => ({ anbieter: x.provider_id, rolle: x.role, zustand: x.health_status, fehlerInFolge: x.consecutive_failures })) } : {}) };
  };
  const push = kanal("push"), email = kanal("email");
  const alterMin = bericht ? (Date.now() - new Date(bericht.created_at).getTime()) / 60000 : null;
  let farbe: string, text: string;
  if (!st?.enabled) { farbe = "rot"; text = "KC Communicator ist ausgeschaltet – es gehen keine Benachrichtigungen raus"; }
  else if (erreichbar && !erreichbar.ok) { farbe = "rot"; text = "KC Communicator antwortet nicht"; }
  else if (!st.dispatch_enabled) { farbe = "blau"; text = "Versand pausiert (Wartung) – Benachrichtigungen werden gesammelt und später verschickt"; }
  else if (push.zustand === "stoerung" && email.zustand === "stoerung") { farbe = "rot"; text = "Störung: weder Push noch E-Mail kommen an"; }
  else if (alterMin == null || alterMin > COMM_BERICHT_VERALTET_MIN) { farbe = "grau"; text = alterMin == null ? "Kein Zustandsbericht vorhanden" : `Zustandsbericht veraltet (${Math.round(alterMin)} Min. alt)`; }
  else if (push.zustand === "stoerung" || email.zustand === "stoerung" || systemFehler24 > 0 || club.fehler24 > 0 || Number(bericht?.success_rate ?? 100) < 90) {
    farbe = "gelb"; text = push.zustand === "stoerung" ? "Eingeschränkt: Push gestört – es geht per E-Mail raus" : email.zustand === "stoerung" ? "Eingeschränkt: E-Mail gestört – Push läuft" : "Eingeschränkt: einzelne Benachrichtigungen fehlgeschlagen";
  }
  else { farbe = "gruen"; text = "KC Communicator läuft – Push und E-Mail werden zugestellt"; }
  return { farbe, text, erreichbar, push, email, club,
    bericht: bericht ? { zeit: bericht.created_at, erfolg: Number(bericht.success_rate), pushMs: Math.round(Number(bericht.avg_push_ms) || 0) || null, mailMs: Math.round(Number(bericht.avg_email_ms) || 0) || null,
      warteschlange: (bericht.queued ?? 0) + (bericht.retrying ?? 0), fehler: bericht.failed ?? 0, geraete: bericht.active_devices ?? null } : null };
}

// ----- KC-CLUB-ADMINLAGE (0.47.0): Admin-Kommandozentrale – KC-Programme über ihr Lebenszeichen (kicc_program_heartbeats)
// und ihren Datenstand. Neue Programme = neuer Eintrag hier. Die App bewertet das Alter (läuft / zuletzt vor … / keine Meldung).
const ADMIN_PROGRAMME: { id: string; name: string; stand?: () => Promise<string | null> }[] = [
  { id: "kc-pc-manager", name: "KC Verwaltung (PC-Manager)", stand: async () => (await db.from("kc_manager_state_sections").select("updated_at").eq("org_id", ORG).order("updated_at", { ascending: false }).limit(1).maybeSingle()).data?.updated_at ?? null },
  { id: "kc-dp2", name: "KC Dienstplan", stand: async () => (await db.from("kc_dp_plan_published").select("updated_at").eq("org_id", ORG).order("updated_at", { ascending: false }).limit(1).maybeSingle()).data?.updated_at ?? null },
  { id: "kc-system-check", name: "KC System-Check" },
  { id: "kicc", name: "KICC Kontrollzentrum" },
];
const ADMIN_DB_GRENZE = 500 * 1024 * 1024;
// KC-CLUB-DIENSTWUNSCH (0.59.0): Veranstaltung/Vertrag des DP2-Wunsch-Eingangs (DP2 ist Eigentümer; Club-App liefert nur an)
const DW = { vertrag: "KC_DP_WISH_INBOX_V1", projekt: "KC_DP", veranstaltung: "KC-WM-2026", name: "Weihnachtsmarkt Werne 2026",
  typen: ["available", "preferred", "if_needed", "unavailable"], zonen: ["V", "H", "B", "Z"], maxEintraege: 400 };
// KC-CLUB-BESTAETIGUNG (1.69.0): eigene Dienstwünsche lesbar aufbereitet – je Tag „Kann / Am liebsten / Wenn nötig / Kann nicht / Bereitschaft“
// Wortlaut Hansi (1.69.3): steht in Bestätigung, Aufstellung und Archiv-Datei – eine Stelle für alle
const DW_HINWEIS = (name: string) => `Vielen Dank für die Übermittlung deiner Dienstzeiten für den ${name}. Bitte beachte, dass es sich um deine Wünsche handelt – eine Abstimmung mit allen Clubmitgliedern erfolgt noch.`;
const DW_ART: Record<string, string> = { available: "Kann", preferred: "Am liebsten", if_needed: "Wenn nötig", unavailable: "Kann nicht" };
const DW_ZONE: Record<string, string> = { V: "Bereich V", H: "Bereich H", B: "Bereich B", Z: "Bereich Z" };
async function dienstwunschAufstellung(ich: Ich) {
  const { data: m } = await db.from("kc_dp_wish_inbox").select("revision,status,entries,standby,share_with_colleagues,submitted_at,taken_at")
    .eq("org_id", ORG).eq("event_id", DW.veranstaltung).eq("person_id", ich.person_id).eq("source", "club_app").maybeSingle();
  const h = (x: unknown) => `${String(x).padStart(2, "0")}:00`;
  const wt = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
  const je = new Map<string, any[]>();
  for (const e of (m?.entries ?? []) as any[]) { if (!je.has(e.date)) je.set(e.date, []); je.get(e.date)!.push(e); }
  for (const [tag, b] of Object.entries(m?.standby ?? {}) as [string, any][]) if (b?.answer === "yes" && !je.has(tag)) je.set(tag, []);
  const bereit = (tag: string, liste: any[]) => {
    const b: any = (m?.standby ?? {})[tag] ?? liste.map((e) => e.assistantDay?.standby).find((x: any) => x?.answer === "yes");
    return b?.answer === "yes" ? (b.slots?.length ? b.slots.map((s: any) => `${h(s.start)}–${h(s.end)}`).join(", ") : "ja") : null;
  };
  const tage = [...je.keys()].sort().map((tag) => {
    const liste = je.get(tag)!.slice().sort((a, b) => a.start - b.start);
    const zeilen = liste.map((e) => `${DW_ART[e.wishType] ?? e.wishType}: ${e.scope === "day" ? "ganzer Tag" : `${h(e.start)}–${h(e.end)} Uhr`}${e.wishType !== "unavailable" && e.wishZone ? ` (${DW_ZONE[e.wishZone] ?? e.wishZone})` : ""}${e.comment ? ` – ${txt(e.comment, 120)}` : ""}`);
    const bs = bereit(tag, liste); if (bs) zeilen.push(`Bereitschaft: ${bs}`);
    return { datum: tag, tag: wt.format(new Date(tag + "T12:00:00Z")), zeilen,
      spalten: Object.fromEntries(Object.keys(DW_ART).map((k) => [k, liste.filter((e) => e.wishType === k).map((e) => (e.scope === "day" ? "ganzer Tag" : `${h(e.start)}–${h(e.end)}`) + (k !== "unavailable" && e.wishZone ? ` ${e.wishZone}` : ""))])),
      bereitschaft: bs };
  });
  const stand = m?.submitted_at ? new Intl.DateTimeFormat("de-DE", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(m.submitted_at)) + " Uhr" : "–";
  return { veranstaltung: DW.name, hinweis: DW_HINWEIS(DW.name), name: ich.name, stand, revision: m?.revision ?? 0, status: m?.status ?? null, uebernommen: !!m?.taken_at, freigabe: !!m?.share_with_colleagues, tage };
}
const NEON_GRENZE = 512 * 1024 * 1024; // Neon kostenlos: 0,5 GB Speicher je Projekt
// Neon-Spiegel und Backup (0.48.0): liest nur die Protokolle des KC-Spiegels (kc_db_mirror_*, kc_neon_compute_policy) – steuert nichts
async function adminSpiegel() {
  const letzter = (typ: string) => db.from("kc_db_mirror_runs").select("started_at,message").eq("run_type", typ).eq("status", "ok").order("started_at", { ascending: false }).limit(1).maybeSingle();
  const [{ data: pol }, { data: compute }, { data: snap }, { data: backup }, { data: restore }, { data: pause }, { data: abdeckung }, { data: wd }, { data: ng }] = await Promise.all([
    db.from("kc_db_mirror_policies").select("name,mode,target,enabled,lag_threshold_sec,updated_at"),
    db.from("kc_neon_compute_policy").select("mode,maintenance_until,updated_at").eq("id", "primary").maybeSingle(),
    letzter("snapshot"), letzter("backup"), letzter("restore_test"),
    db.from("kc_db_mirror_audit").select("happened_at,action,detail").or("action.ilike.%paus%,action.ilike.%resum%,action.ilike.%fortgesetzt%").order("happened_at", { ascending: false }).limit(1).maybeSingle(),
    db.rpc("kc_db_mirror_abdeckung"),
    db.from("kc_db_mirror_runs").select("started_at,status,message").eq("run_type", "watchdog").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    // KC-CLUB-NEON-GROESSE (0.54.0): misst der Spiegel-Worker nebenbei, wenn er ohnehin mit Neon verbunden ist (keine Extra-Rechenzeit)
    db.from("kc_db_mirror_runs").select("started_at,metrics").eq("run_type", "neon_groesse").eq("status", "ok").order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const p = pol ?? [], neon = p.filter((x: any) => x.target === "neon" && x.mode !== "realtime"), bk = p.filter((x: any) => x.mode === "backup");
  const aktivLag = neon.filter((x: any) => x.enabled).map((x: any) => Number(x.lag_threshold_sec) || 720);
  return {
    // Verzögerungsgrenze der eingeschalteten Regel (Sparmodus: alle 6 Std. → 6,5 Std.); ohne eingeschaltete Regel 12 Min.
    neon: { aktiv: aktivLag.length > 0, lagSek: aktivLag.length ? Math.min(...aktivLag) : 720, letzter: snap?.started_at ?? null,
      regeln: neon.map((x: any) => ({ name: x.name, an: !!x.enabled })) },
    backup: { aktiv: bk.some((x: any) => x.enabled), letztes: backup?.started_at ?? null, restoreTest: restore?.started_at ?? null },
    compute: compute ? { modus: compute.mode, bis: compute.maintenance_until } : null,
    // Abdeckung: Tabellen ohne Spiegel-Regel (werden weder gespiegelt noch gesichert) + letzter Watchdog-Lauf
    abdeckung: abdeckung ? { tabellen: abdeckung.tabellen, ohne: abdeckung.ohne_regel, liste: abdeckung.liste } : null,
    watchdog: wd ? { zeit: wd.started_at, status: wd.status, text: wd.message } : null,
    groesse: ng ? { bytes: Number(ng.metrics?.bytes) || null, zeit: ng.started_at, grenze: NEON_GRENZE } : null,
    pause: pause && /paus/i.test(pause.action) ? { zeit: pause.happened_at, text: pause.detail } : null,
  };
} // kostenloser Supabase-Tarif (falls der System-Check keinen Wert liefert)

// ---------- Anmeldung ----------
type Ich = { person_id: string; name: string; vorname: string; admin: boolean; vorstand: boolean; aemter: string[]; protokolle: boolean; kontakte: boolean; buero: BueroRecht;
  nurLesen?: boolean }; // KC-CLUB-NOTBETRIEB: true = Antwort nur für das Notfall-Paket berechnen, nichts schreiben
// KC-CLUB-BUERO-RECHTE (1.37.0): Büro je Mitglied vom Admin freigeschaltet – null = kein Büro; Admin immer „schreiben“
type BueroRecht = "lesen" | "schreiben" | null;
const BUERO_RECHTE = ["lesen", "schreiben"] as const;
// KC-CLUB-ANMELDECACHE (0.56.0): geprüfte Anmeldung je Server-Instanz ANMELDUNG_CACHE_MS lang merken (spart je Anfrage
// 2 Datenbank-Runden). Schlüssel = SHA-256 des Tokens (nie das Token selbst). Rollen-/Zugangsänderungen leeren den Speicher
// dieser Instanz sofort; andere Instanzen übernehmen sie spätestens nach ANMELDUNG_CACHE_MS. „zuletzt gesehen“ höchstens
// alle ZULETZT_TAKT_MS schreiben (Online-Anzeige rechnet mit ONLINE_SEK = 150 s).
const ANMELDUNG_CACHE_MS = 60_000, ZULETZT_TAKT_MS = 30_000, ANMELDUNG_CACHE_MAX = 300;
const ANMELDUNGEN = new Map<string, { ich: Ich; bis: number; gesehen: number; version: string | null }>();
const anmeldungenVergessen = () => ANMELDUNGEN.clear();
const INSTANZ = crypto.randomUUID().slice(0, 8); let ANMELDUNG_TREFFER = false; // Messung: welche Instanz, Speicher getroffen?
async function anmelden(req: Request): Promise<Ich> {
  const token = req.headers.get("x-club-token") ?? "";
  if (!/^[0-9a-f]{32,96}$/.test(token)) throw new Fehler("Kein Zugang – bitte den persönlichen Link neu öffnen.", 401);
  const hash = await sha256(token), jetztMs = Date.now(), version = txt(req.headers.get("x-club-version"), 20) || null;
  const c = ANMELDUNGEN.get(hash);
  if (c && c.bis > jetztMs) {
    if (jetztMs - c.gesehen > ZULETZT_TAKT_MS || c.version !== version) {
      c.gesehen = jetztMs; c.version = version;
      db.from("kc_club_zugang").update({ zuletzt_gesehen: jetzt(), app_version: version }).eq("person_id", c.ich.person_id).then(() => {});
    }
    ANMELDUNG_TREFFER = true;
    return { ...c.ich, aemter: [...c.ich.aemter] };
  }
  ANMELDUNG_TREFFER = false;
  const ich = await anmeldenDb(hash, version);
  if (ANMELDUNGEN.size >= ANMELDUNG_CACHE_MAX) for (const [k, v] of ANMELDUNGEN) if (v.bis <= jetztMs) ANMELDUNGEN.delete(k);
  if (ANMELDUNGEN.size < ANMELDUNG_CACHE_MAX) ANMELDUNGEN.set(hash, { ich: { ...ich, aemter: [...ich.aemter] }, bis: jetztMs + ANMELDUNG_CACHE_MS, gesehen: jetztMs, version });
  return ich;
}
async function anmeldenDb(hash: string, version: string | null): Promise<Ich> {
  // 0.56.1: eine Datenbank-Runde (kc_club_anmeldung: Token-Hash prüfen, „zuletzt gesehen“ setzen, Person + Rollen liefern)
  const { data: a, error } = await db.rpc("kc_club_anmeldung", { p_hash: hash, p_version: version });
  if (error) throw new Fehler("Anmeldung gerade nicht möglich – bitte gleich noch einmal versuchen.", 503);
  if (!a) throw new Fehler("Kein Zugang – bitte den persönlichen Link neu öffnen.", 401);
  const p = a.person, r = a.rollen;
  if (!p?.active) throw new Fehler("Kein Zugang – bitte bei Hansi melden.", 401);
  // KC-CLUB-ONLINE-PUSH (1.57.0): nach ≥ 10 Min. Pause (oder zum ersten Mal) wieder da → Admins benachrichtigen (im Hintergrund)
  if (!a.vorher || Date.now() - Date.parse(a.vorher) >= ONLINE_PUSH_PAUSE_MS) {
    const lauf = onlinePushMelden(ichAus(p, r)).catch((e) => console.error("online push", String(e)));
    try { (globalThis as any).EdgeRuntime?.waitUntil?.(lauf); } catch { /* ohne Hintergrund-Hilfe läuft es trotzdem an */ }
  }
  return ichAus(p, r);
}
// Person + Rollen → angemeldetes Mitglied (gemeinsam für Anmeldung und Notfall-Paket – eine Regel, nicht zwei)
function ichAus(p: any, r: any): Ich {
  return { person_id: p.person_id, name: p.display_name, vorname: vorname(p), admin: !!r?.ist_admin, vorstand: !!(r?.ist_vorstand || r?.ist_admin), aemter: r?.aemter ?? [],
    // Sitzungsprotokolle: Recht aus der Rollen-Registry (Standard ja; Aushilfen nein)
    protokolle: r ? r.protokolle_lesen !== false : true,
    // Kontaktdaten anderer (sofern freigegeben): Rollen-Registry (Standard ja; Aushilfen nein)
    kontakte: r ? r.kontakte_sehen !== false : true,
    buero: r?.ist_admin ? "schreiben" : (BUERO_RECHTE as readonly string[]).includes(r?.buero_recht) ? r.buero_recht : null };
}
// „vorstand“ ist intern das Recht, Treffen/Veranstaltungen/Abstimmungen anzulegen (im Club: Clubsprecher, Kassenwart, Admin)
const nurVorstand = (ich: Ich) => { if (!ich.vorstand) throw new Fehler("Das dürfen nur Clubsprecher, Kassenwart und Admin.", 403); };
const nurBueroLesen = (ich: Ich) => { if (!ich.buero) throw new Fehler("Das Büro ist für dich nicht freigeschaltet – bitte beim Admin melden.", 403); };
const nurBueroSchreiben = (ich: Ich) => { nurBueroLesen(ich); if (ich.buero !== "schreiben") throw new Fehler("Im Büro hast du nur Leserechte – Ändern und Versenden schaltet der Admin frei.", 403); };
// Termine anlegen/ändern/absagen: Clubleitung wie bisher – oder Büro mit Schreibrecht (endgültig löschen bleibt Clubleitung)
const nurTermineSchreiben = (ich: Ich) => { if (!ich.vorstand && ich.buero !== "schreiben") nurVorstand(ich); };
const nurAdmin = (ich: Ich) => { if (!ich.admin) throw new Fehler("Das darf nur der Admin.", 403); };

// ---------- Eigener Status ----------
const STATUS = ["verfuegbar", "beschaeftigt", "urlaub", "krank", "abwesend"];
async function statusMap(ids?: string[], mitRuhe = false) {
  let q = db.from("kc_club_status").select("person_id,status,hinweis,bis,geaendert_am");
  if (ids) q = q.in("person_id", ids);
  const { data } = await q;
  const heute = berlinTag(new Date());
  // abgelaufener Status („bis“ vorbei) gilt wieder als verfügbar
  const m = new Map<string, any>((data ?? []).map((x: any) => [x.person_id, x.bis && x.bis < heute ? { status: "verfuegbar", hinweis: null, bis: null } : { status: x.status, hinweis: x.hinweis, bis: x.bis }]));
  // KC-CLUB-STATUS-RUHE (1.50.0): wer gerade in seiner „Nicht stören“-Zeit ist und sonst „verfügbar“ wäre, zeigt „🌙 nicht stören bis …“
  // (nur Anzeige – gespeichert wird nichts; Urlaub/krank/… haben Vorrang)
  if (mitRuhe) {
    let rq = db.from("kc_club_person_einstellung").select("person_id,wert").eq("schluessel", "ruhezeit");
    if (ids) rq = rq.in("person_id", ids);
    const { data: rz } = await rq;
    for (const x of rz ?? []) {
      const alt = m.get((x as any).person_id);
      if (inRuhezeit((x as any).wert) && (!alt || alt.status === "verfuegbar")) m.set((x as any).person_id, { status: "ruhe", hinweis: null, bis: null, uhr: (x as any).wert.bis });
    }
  }
  return m;
}

// ---------- Geburtstage (KC-CLUB-GEBURTSTAG-FREIGABE) ----------
// Nur wer „Meinen Geburtstag anzeigen“ eingeschaltet hat (eigener immer für sich selbst); nur Tag/Monat, nie das Jahr.
async function geburtstageSichtbar(ich: Ich) {
  const [leute, { data: fr }] = await Promise.all([
    aktiveMitglieder(),
    db.from("kc_club_freigaben").select("person_id").eq("bereich", "geburtstag").eq("erlaubt", true),
  ]);
  const frei = new Set((fr ?? []).map((x: any) => x.person_id));
  return leute.filter((m: any) => m.birth_date && (frei.has(m.person_id) || m.person_id === ich.person_id))
    .map((m: any) => ({ person_id: m.person_id, name: m.display_name, vorname: vorname(m), md: String(m.birth_date).slice(5, 10) }));
}

// ---------- Treffen ----------
async function treffenListe(ich: Ich, nurNaechstes = false, zeitraum?: { von: string; bis: string }) {
  let q = db.from("kc_club_treffen").select("*").order("beginn");
  // Zeitraum: alles, was ihn berührt (auch mehrtägige Veranstaltungen, die vorher beginnen)
  q = zeitraum ? q.lt("beginn", zeitraum.bis).or(`ende.gte.${zeitraum.von},and(ende.is.null,beginn.gte.${zeitraum.von})`).limit(100)
    : nurNaechstes ? q.gte("beginn", new Date(Date.now() - 3 * 3600000).toISOString()).eq("status", "geplant").eq("art", "treffen").limit(1)
    : q.gte("beginn", new Date(Date.now() - 30 * 86400000).toISOString()).limit(60);
  const { data: treffen } = await q;
  const ids = (treffen ?? []).map((t: any) => t.id);
  const { data: teil } = ids.length ? await db.from("kc_club_teilnahme").select("*").in("treffen_id", ids) : { data: [] as any[] };
  const [leute, mitfahrten, suche] = await Promise.all([
    personen([...(teil ?? []).map((x: any) => x.person_id), ...(treffen ?? []).map((t: any) => t.gastgeber_person_id)]),
    nurNaechstes ? Promise.resolve(new Map<string, any[]>()) : mitfahrtenZu(ich, "treffen", ids),
    nurNaechstes ? Promise.resolve(new Map<string, any[]>()) : suchendeZu(ich, "treffen", ids),
  ]);
  return (treffen ?? []).map((t: any) => {
    const tn = (teil ?? []).filter((x: any) => x.treffen_id === t.id)
      .map((x: any) => ({ person_id: x.person_id, name: leute.get(x.person_id)?.display_name || x.person_id, antwort: x.antwort, notiz: x.notiz }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
    const zahl = (a: string) => tn.filter((x: any) => x.antwort === a).length;
    return {
      id: t.id, titel: t.titel, beginn: t.beginn, ende: t.ende, ort: t.ort, beschreibung: t.beschreibung, status: t.status, art: t.art, ganztaegig: t.ganztaegig,
      gastgeber: t.gastgeber_person_id ? { person_id: t.gastgeber_person_id, name: leute.get(t.gastgeber_person_id)?.display_name } : null,
      teilnahme: tn, ja: zahl("ja"), nein: zahl("nein"), vielleicht: zahl("vielleicht"),
      meine: tn.find((x: any) => x.person_id === ich.person_id)?.antwort ?? null,
      mitfahrten: mitfahrten.get(t.id) ?? [], mitfahrtSuche: suche.get(t.id) ?? [],
    };
  });
}
function treffenText(t: any, gastgeber: string, anlass: "neu" | "geaendert" | "abgesagt") {
  const ort = t.ort || (gastgeber ? `bei ${gastgeber}` : "");
  const va = t.art === "veranstaltung"; // Veranstaltung (Aufbau, Markt …): keine Einladung, keine Zu-/Absage
  const kopf = anlass === "abgesagt" ? (va ? "dieser Termin fällt leider aus:" : "das Köcheclub-Treffen fällt leider aus:") : anlass === "geaendert" ? (va ? "dieser Termin hat sich geändert:" : "das Köcheclub-Treffen hat sich geändert:") : (va ? "neuer Termin im Köcheclub:" : "hiermit lade ich dich herzlich zum Köcheclub-Treffen ein:");
  return {
    betreff: `Köcheclub Werne – ${anlass === "abgesagt" ? "abgesagt: " : anlass === "geaendert" ? "geändert: " : ""}${t.titel}, ${wann(t.beginn)}`,
    titel: anlass === "abgesagt" ? "❌ Treffen abgesagt" : "📅 " + t.titel,
    kurz: `${wann(t.beginn)}${ort ? " – " + ort : ""}${anlass === "abgesagt" ? " fällt aus." : va ? "" : ". Bitte in der App zu- oder absagen."}`,
    text: ["Hallo,", "", kopf, "", `📅 ${wann(t.beginn, true)}`, ort ? `📍 ${ort}` : "", t.beschreibung ? "\n" + t.beschreibung : "", "",
      anlass === "abgesagt" ? "" : va ? `Alle Termine in der Köcheclub-App: ${APP_URL}#termine` : `Bitte sag in der Köcheclub-App zu oder ab: ${APP_URL}#termine`, "", "Viele Grüße", "Köcheclub Werne"]
      .filter((z, i, a) => !(z === "" && a[i - 1] === "")).join("\n"),
    url: APP_URL + "#termine",
  };
}

// ---------- Archiv (KC-CLUB-ARCHIV, 1.2.0) ----------
// Aktenordner mit Registern und Jahreszahl. Ordner „nur Vorstand“ sehen Clubsprecher, Kassenwart und Admin (Recht „vorstand“).
// Anlegen/Hochladen/Ändern/Löschen: Clubsprecher und Admin (Wunsch Hansi 30.09.2026). Dateien liegen im Anlagen-Kern.
// Der automatische Teil wird nur gelesen (vergangene Treffen, Protokolle, Abstimmungen, Aktionen, Pinnwand, Anhänge, Dienste).
const ARCHIV_ARTEN: Record<string, { t: string; sym: string; register: string[]; vorstand?: boolean }> = {
  satzung: { t: "Satzung & Recht", sym: "📜", register: ["Satzung", "Geschäftsordnung", "Vereinsregister", "Sonstiges"] },
  versammlung: { t: "Versammlungen", sym: "🏛️", register: ["Einladung", "Protokoll", "Anwesenheit", "Anlagen"] },
  vertraege: { t: "Verträge & Versicherungen", sym: "🤝", register: ["Verträge", "Versicherungen", "Genehmigungen", "Sonstiges"], vorstand: true },
  finanzen: { t: "Finanzen", sym: "💶", register: ["Kassenbericht", "Kassenprüfung", "Belege", "Sonstiges"], vorstand: true },
  presse: { t: "Presse", sym: "📰", register: ["Zeitung", "Internet", "Sonstiges"] },
  // KC-CLUB-CHRONIK (1.64.0, Vorschlag + Freigabe Hansi): Register nach Themen; Einträge tragen das Ereignisdatum
  chronik: { t: "Chronik", sym: "📖", register: ["Gründung", "Presse", "Rekorde & Höhepunkte", "Feste & Jubiläen", "Mitglieder im Wandel", "In Gedenken", "Ehrungen & Urkunden", "Sonstiges"] },
  sonstiges: { t: "Sonstiges", sym: "🗂️", register: ["Allgemein"] },
};
const ARCHIV_DATEITYPEN = /^(application\/pdf|image\/(jpeg|png|webp)|text\/plain|application\/msword|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet))$/;
const ARCHIV_STOPP = 0.98; // Speicher: Archiv nimmt bis 98 % an (Fotos stoppen schon bei 95 %)
const darfArchivPflegen = (ich: Ich) => ich.admin || ich.aemter.includes("Clubsprecher");
const nurArchivPflege = (ich: Ich) => { if (!darfArchivPflegen(ich)) throw new Fehler("Das Archiv pflegen Clubsprecher und Admin.", 403); };
const darfOrdnerSehen = (ich: Ich, o: any) => !o.nur_vorstand || ich.vorstand;
// KC-CLUB-CHRONIK (1.64.0): Vereinsordner mit „einreichen“ – alle Mitglieder dürfen etwas hineinlegen, sichtbar erst nach Prüfung
// durch die Archiv-Pflege (Clubsprecher/Admin). Wer prüfen darf, bekommt Bescheid.
async function archivPflegerIds(): Promise<string[]> {
  const { data } = await db.from("kc_club_rollen").select("person_id,ist_admin,aemter");
  return (data ?? []).filter((r: any) => r.ist_admin || (r.aemter ?? []).includes("Clubsprecher")).map((r: any) => r.person_id);
}
function archivRegister(roh: unknown, art: string): string[] {
  const liste = (Array.isArray(roh) ? roh : []).map((x) => txt(x, 30)).filter(Boolean);
  const eindeutig = [...new Set(liste)].slice(0, 12);
  return eindeutig.length ? eindeutig : [...(ARCHIV_ARTEN[art]?.register ?? ["Allgemein"])];
}
const archivDatum = (v: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) && !isNaN(Date.parse(String(v))) ? String(v) : null;
const archivStichworte = (v: unknown) => [...new Set((Array.isArray(v) ? v : String(v || "").split(/[,;]/)).map((x) => txt(x, 30)).filter(Boolean))].slice(0, 10);
// ----- KC-CLUB-ARCHIV-PERSOENLICH (1.5.0): eigene Ordner je Mitglied und Jahr, Zugriff nur Besitzer + gültige Freigaben -----
// Auch Admin und Clubsprecher kommen NICHT hinein (Entscheidung Hansi). Fremdversuch → Protokoll + Meldung an Besitzer und Admins.
const PERSOENLICH_REGISTER = ["Urkunden", "Schulungen", "Rechnungen", "Fotos", "Sonstiges"];
const PERSOENLICH_GRENZE = 50 * 1024 * 1024; // je Mitglied (kostenloser Speicher ist begrenzt)
const FREIGABE_MAX_TAGE = 365;
type ArchivRecht = "lesen" | "pflegen" | "hochladen";
async function meineGruppenIds(pid: string): Promise<string[]> {
  const { data } = await db.from("kc_communication_thread_participants").select("thread_id").eq("person_id", pid);
  return (data ?? []).map((x: any) => x.thread_id);
}
// gültige Freigaben für mich (optional nur bestimmte Ordner); abgelaufen/beendet zählt nicht
async function archivFreigabenFuer(pid: string, ordnerIds?: string[], auchAbgelaufen = false) {
  const gr = await meineGruppenIds(pid);
  let q = db.from("kc_club_archiv_freigaben").select("*").or(gr.length ? `an_person.eq.${pid},an_gruppe.in.(${gr.join(",")})` : `an_person.eq.${pid}`);
  if (ordnerIds) { if (!ordnerIds.length) return []; q = q.in("ordner_id", ordnerIds); }
  if (!auchAbgelaufen) q = q.is("beendet_am", null).gt("bis", jetzt());
  const { data } = await q;
  return (data ?? []) as any[];
}
const freigabeDeckt = (f: any, d: any) => (!f.dokument_id || f.dokument_id === d.id) && (!f.register || f.register === d.register);
function darfDokSehen(ich: Ich, o: any, d: any, freigaben: any[]) {
  if (!o.besitzer) return darfOrdnerSehen(ich, o) && (d.status !== "pruefung" || d.hochgeladen_von === ich.person_id || darfArchivPflegen(ich)); // 1.64.0: Einreichung erst nach Prüfung für alle
  if (o.besitzer === ich.person_id) return true;
  if (d.status === "pruefung") return d.hochgeladen_von === ich.person_id;
  return freigaben.some((f) => f.ordner_id === o.id && freigabeDeckt(f, d));
}
// KC-CLUB-SICHERHEIT-ARCHIV (1.22.1): Vereinsordner „Admin <Jahr>“ (art sonstiges, nur Clubleitung) – entsteht beim ersten Bericht
const ADMIN_ORDNER = { art: "sonstiges", titel: "Admin", farbe: 8, register: ["Sicherheitscheck", "Sonstiges"] };
async function adminOrdner(jahr: number, register: string) {
  const { data: da } = await db.from("kc_club_archiv_ordner").select("id,register").is("besitzer", null).eq("art", ADMIN_ORDNER.art).eq("titel", ADMIN_ORDNER.titel)
    .eq("jahr", jahr).is("geloescht_am", null).order("erstellt_am").limit(1).maybeSingle();
  if (da) {
    if (!(da.register || []).includes(register)) await db.from("kc_club_archiv_ordner").update({ register: [register, ...(da.register || [])], geaendert_am: jetzt() }).eq("id", da.id);
    return da.id as string;
  }
  const [admin] = await adminIds();
  const { data: neu, error } = await db.from("kc_club_archiv_ordner").insert({ art: ADMIN_ORDNER.art, jahr, titel: ADMIN_ORDNER.titel, farbe: ADMIN_ORDNER.farbe,
    register: [...new Set([register, ...ADMIN_ORDNER.register])], nur_vorstand: true, erstellt_von: admin }).select("id").single();
  if (error || !neu) throw new Error("Admin-Ordner konnte nicht angelegt werden");
  await protokoll(null, "archiv_ordner_angelegt", { ordner: neu.id, art: ADMIN_ORDNER.art, jahr, titel: ADMIN_ORDNER.titel, nur_vorstand: true, automatisch: true });
  return neu.id as string;
}
async function sicherheitAblegen(ich: Ich, zeilen: string[], probleme: number, ms: number | null, notiz: string, version: string) {
  const heute = berlinTag(new Date()), zeit = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date());
  const ordner = await adminOrdner(Number(heute.slice(0, 4)), "Sicherheitscheck");
  const text = `Köcheclub-App – Sicherheits-Check\n${ich.name} · ${heute.split("-").reverse().join(".")} ${zeit} Uhr\nErgebnis: ${probleme ? `${probleme} Punkt(e) nicht bestätigt` : "alles in Ordnung"}\n────────────────────\n\n${zeilen.join("\n")}\n\nAntwortzeit beim Mitglied: ${ms ?? "?"} ms · App ${version || "?"}${notiz ? `\nNotiz: ${notiz}` : ""}\n\n(Der Server hat beim Absenden selbst neu geprüft.)\n`;
  const bytes = new TextEncoder().encode("\ufeff" + text);
  let b = ""; for (const x of bytes) b += String.fromCharCode(x);
  const name = `Sicherheitscheck-${heute}-${ich.vorname || "Mitglied"}.txt`.replace(/[^\w.\-äöüÄÖÜß]/g, "_");
  const datei = await dateiAblegen(ich, name, "text/plain", btoa(b), ARCHIV_DATEITYPEN);
  try {
    const { error } = await db.from("kc_club_archiv_dokumente").insert({ ordner_id: ordner, register: "Sicherheitscheck",
      titel: `Sicherheits-Check ${ich.name} – ${probleme ? `${probleme} offen` : "alles OK"}`.slice(0, 120), datum: heute, stichworte: archivStichworte(`Sicherheitscheck, ${ich.vorname || ich.name}`),
      attachment_id: datei.id, datei_name: datei.name, mime: "text/plain", groesse: datei.groesse, hochgeladen_von: ich.person_id, status: "ok" });
    if (error) throw new Error(error.message);
  } catch (e) { await dateienEntfernen([datei.id]); throw e; }
}
async function adminIds(): Promise<string[]> {
  const { data } = await db.from("kc_club_rollen").select("person_id").eq("ist_admin", true);
  return (data ?? []).map((x: any) => x.person_id);
}
async function archivFremdversuch(ich: Ich, o: any, was: string) {
  // je Person und Ordner höchstens eine Meldung pro Stunde (Protokoll immer)
  const { count } = await db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).eq("aktion", "archiv_fremdzugriff")
    .eq("person_id", ich.person_id).gte("zeit", new Date(Date.now() - 3600_000).toISOString()).contains("details", { ordner: o.id });
  await protokoll(ich.person_id, "archiv_fremdzugriff", { ordner: o.id, besitzer: o.besitzer, jahr: o.jahr, was });
  if (count) return;
  const b = (await personen([o.besitzer])).get(o.besitzer), bName = b?.display_name || "ein Mitglied", zeit = wann(jetzt());
  const url = `${APP_URL}#archiv`;
  await senden("club_nachricht", [o.besitzer], {
    titel: "🔐 Zugriffsversuch auf deinen Ordner", kurz: `${ich.name} wollte ${was} in deinem Ordner ${o.jahr} öffnen – abgewiesen.`,
    betreff: "Köcheclub Werne – Zugriffsversuch auf deinen persönlichen Ordner",
    text: `Hallo ${vorname(b)},\n\n${ich.name} hat am ${zeit} versucht, ${was} in deinem persönlichen Archiv-Ordner ${o.jahr} zu öffnen.\nDer Zugriff wurde abgewiesen – es wurde nichts angezeigt.\n\nWenn das so gewollt war, kannst du im Archiv eine Freigabe auf Zeit erteilen.\n${url}\n\nViele Grüße\nKöcheclub-App`,
    url,
  }, `club-archiv-fremd:${o.id}:${ich.person_id}:${Date.now()}`).catch(() => null);
  const admins = (await adminIds()).filter((x) => x !== o.besitzer && x !== ich.person_id);
  if (admins.length) await senden("club_nachricht", admins, {
    titel: "🔐 Zugriffsversuch im Archiv", kurz: `${ich.name} → persönlicher Ordner ${o.jahr} von ${bName} – abgewiesen.`,
    betreff: "Köcheclub-App: Zugriffsversuch auf einen persönlichen Ordner",
    text: `Hallo,\n\n${ich.name} hat am ${zeit} versucht, ${was} im persönlichen Archiv-Ordner ${o.jahr} von ${bName} zu öffnen.\nDer Zugriff wurde abgewiesen. ${bName} wurde ebenfalls benachrichtigt.\n\nViele Grüße\nKöcheclub-App`,
    url: APP_URL,
  }, `club-archiv-fremd-admin:${o.id}:${ich.person_id}:${Date.now()}`).catch(() => null);
}
async function archivKeinZugriff(ich: Ich, o: any, was: string): Promise<never> {
  // gültige Freigabe, die dieses Dokument nicht umfasst → Hinweis; abgelaufene/zurückgenommene Freigabe → Hinweis; beides kein Alarm
  const alt = await archivFreigabenFuer(ich.person_id, [o.id], true);
  if (alt.some((f: any) => !f.beendet_am && new Date(f.bis).getTime() > Date.now())) throw new Fehler("Dieses Dokument ist für dich nicht freigegeben.", 403);
  if (alt.length) throw new Fehler("Deine Freigabe für diesen Ordner ist abgelaufen oder wurde beendet.", 403);
  await archivFremdversuch(ich, o, was);
  throw new Fehler("Das ist ein persönlicher Ordner – kein Zugriff. Der Besitzer wurde informiert.", 403);
}
async function archivOrdnerHolen(ich: Ich, id: unknown, geloeschteAuch = false, recht: ArchivRecht = "lesen") {
  const { data: o } = await db.from("kc_club_archiv_ordner").select("*").eq("id", String(id || "")).maybeSingle();
  if (!o) throw new Fehler("Ordner nicht gefunden.", 404);
  if (o.besitzer) {
    if (o.besitzer === ich.person_id) {
      if (o.geloescht_am && !geloeschteAuch) throw new Fehler("Ordner nicht gefunden.", 404);
      return { ...o, _eigen: true, _freigaben: [] as any[] };
    }
    const fr = o.geloescht_am ? [] : await archivFreigabenFuer(ich.person_id, [o.id]);
    if (!fr.length) return await archivKeinZugriff(ich, o, "den Ordner");
    if (recht === "pflegen") throw new Fehler("Das kann nur der Besitzer des Ordners.", 403);
    if (recht === "hochladen" && !fr.some((f) => f.hochladen && !f.dokument_id)) throw new Fehler("Für diesen Ordner hast du nur eine Freigabe zum Ansehen.", 403);
    return { ...o, _eigen: false, _freigaben: fr };
  }
  if (!darfOrdnerSehen(ich, o) || (o.geloescht_am && !geloeschteAuch)) throw new Fehler("Ordner nicht gefunden.", 404);
  if (recht === "hochladen" && o.einreichen && !darfArchivPflegen(ich)) return { ...o, _eigen: false, _freigaben: [] as any[], _einreichung: true }; // KC-CLUB-CHRONIK
  if (recht !== "lesen") nurArchivPflege(ich);
  return { ...o, _eigen: false, _freigaben: [] as any[] };
}
async function archivDokHolen(ich: Ich, id: unknown, recht: ArchivRecht = "lesen") {
  const { data: d } = await db.from("kc_club_archiv_dokumente").select("*").eq("id", String(id || "")).maybeSingle();
  if (!d) throw new Fehler("Dokument nicht gefunden.", 404);
  // Einreicher darf seine noch nicht geprüfte Einreichung zurückziehen
  const eigeneEinreichung = d.status === "pruefung" && d.hochgeladen_von === ich.person_id;
  const o = await archivOrdnerHolen(ich, d.ordner_id, true, eigeneEinreichung ? "lesen" : recht);
  if (o.besitzer && !darfDokSehen(ich, o, d, o._freigaben)) return await archivKeinZugriff(ich, o, "ein Dokument");
  if (!o.besitzer && !darfDokSehen(ich, o, d, [])) throw new Fehler("Dokument nicht gefunden.", 404); // KC-CLUB-CHRONIK: fremde Einreichung
  return { d, o };
}
async function archivEigenerOrdner(ich: Ich, jahr: number) {
  const { data: da } = await db.from("kc_club_archiv_ordner").select("id").eq("besitzer", ich.person_id).eq("jahr", jahr).maybeSingle();
  if (da) return da.id as string;
  const { data: neu } = await db.from("kc_club_archiv_ordner").insert({ art: "persoenlich", besitzer: ich.person_id, jahr, titel: ich.name, farbe: 6,
    register: PERSOENLICH_REGISTER, erstellt_von: ich.person_id }).select("id").maybeSingle();
  if (neu) await protokoll(ich.person_id, "archiv_eigener_ordner_angelegt", { ordner: neu.id, jahr });
  return neu?.id as string | undefined;
}
async function archivBelegtVon(pid: string) {
  const { data: oo } = await db.from("kc_club_archiv_ordner").select("id").eq("besitzer", pid);
  const ids = (oo ?? []).map((x: any) => x.id);
  if (!ids.length) return 0;
  const { data: dd } = await db.from("kc_club_archiv_dokumente").select("groesse").in("ordner_id", ids);
  return (dd ?? []).reduce((s: number, x: any) => s + Number(x.groesse || 0), 0);
}
// Automatischer Teil: alles, was vorbei ist – nur das, was ich auch sonst sehen darf
async function archivAuto(ich: Ich) {
  const heute = berlinTag(new Date()), leer = { data: [] as any[] };
  const e: any[] = [];
  const sicher = async (f: () => Promise<void>) => { try { await f(); } catch (x) { console.error("archivAuto", String(x)); } };
  await Promise.all([
    sicher(async () => {
      const { data: tr } = await db.from("kc_club_treffen").select("id,titel,beginn,ort,art").neq("status", "abgesagt").lt("beginn", jetzt()).order("beginn", { ascending: false }).limit(1000);
      const ids = (tr ?? []).map((t: any) => t.id);
      const { data: tn } = ids.length ? await db.from("kc_club_teilnahme").select("treffen_id").eq("antwort", "ja").in("treffen_id", ids) : leer;
      for (const t of tr ?? []) {
        const n = (tn ?? []).filter((x: any) => x.treffen_id === t.id).length;
        e.push({ art: "treffen", id: t.id, titel: t.titel, datum: berlinTag(new Date(t.beginn)), text: [t.art === "veranstaltung" ? "🎪 Veranstaltung" : "", t.ort ? "📍 " + t.ort : "", t.art === "veranstaltung" ? "" : `${n} dabei`].filter(Boolean).join(" · ") });
      }
    }),
    sicher(async () => {
      if (!ich.protokolle) return;
      const { data: pr } = await db.from("kc_club_sitzungsprotokolle").select("id,titel,datum,ort").eq("status", "veroeffentlicht").order("datum", { ascending: false }).limit(500);
      for (const x of pr ?? []) e.push({ art: "protokoll", id: x.id, titel: x.titel, datum: x.datum, text: x.ort ? "📍 " + x.ort : "" });
    }),
    sicher(async () => {
      const { data: vs } = await db.from("kc_club_vorschlaege").select("id,titel,optionen,geheim,abgeschlossen_am,erstellt_am").eq("art", "abstimmung").eq("status", "abgeschlossen").order("abgeschlossen_am", { ascending: false }).limit(300);
      const ids = (vs ?? []).map((v: any) => v.id);
      const [{ data: st }, { data: geh }] = ids.length ? await Promise.all([
        db.from("kc_club_stimmen").select("vorschlag_id,wahl").in("vorschlag_id", ids), db.from("kc_club_geheime_stimmen").select("vorschlag_id,wahl").in("vorschlag_id", ids),
      ]) : [leer, leer];
      for (const v of vs ?? []) {
        const s = (v.geheim ? geh : st) ?? [];
        const erg = (v.optionen ?? []).map((o: string) => `${o}: ${s.filter((x: any) => x.vorschlag_id === v.id && x.wahl === o).length}`).join(" · ");
        e.push({ art: "abstimmung", id: v.id, titel: v.titel, datum: berlinTag(new Date(v.abgeschlossen_am || v.erstellt_am)), text: (v.geheim ? "🔒 " : "") + erg });
      }
    }),
    sicher(async () => {
      const { liste } = await aktionenRoh();
      for (const a of liste) if (String(a.dateTo || a.dateFrom) < heute) e.push({ art: "aktion", id: String(a.id), titel: txt(a.activity, 200) || "Aktion", datum: a.dateFrom, text: a.dateTo && a.dateTo !== a.dateFrom ? "bis " + fTag.format(new Date(a.dateTo + "T12:00:00Z")) : "" });
    }),
    sicher(async () => {
      const { data: pw } = await db.from("kc_club_pinnwand").select("id,text,erstellt_am,person_id").not("entfernt_am", "is", null)
        .or(`person_id.eq.${ich.person_id},fuer.eq.alle,personen.cs.{${ich.person_id}}`).order("erstellt_am", { ascending: false }).limit(300);
      const leute = await personen((pw ?? []).map((z: any) => z.person_id));
      for (const z of pw ?? []) e.push({ art: "pinnwand", id: z.id, titel: txt(z.text, 80), datum: berlinTag(new Date(z.erstellt_am)), text: "von " + (vorname(leute.get(z.person_id) ?? null) || "?"), voll: z.text });
    }),
    sicher(async () => {
      // Anhänge nur aus Unterhaltungen, in denen ich dabei bin (wie anlage_url)
      const { data: meine } = await db.from("kc_communication_thread_participants").select("thread_id").eq("person_id", ich.person_id);
      const tids = new Set((meine ?? []).map((x: any) => x.thread_id));
      if (!tids.size) return;
      const { data: ma } = await db.from("kc_communication_message_attachments").select("message_id,attachment_id").limit(3000);
      const mids = [...new Set((ma ?? []).map((x: any) => x.message_id))];
      const msgs: any[] = [];
      for (let i = 0; i < mids.length; i += 200) { const { data } = await db.from("kc_communication_messages").select("id,thread_id,created_at,sender_person_id").in("id", mids.slice(i, i + 200)); msgs.push(...(data ?? [])); }
      const mm = new Map(msgs.filter((m) => tids.has(m.thread_id)).map((m) => [m.id, m]));
      const paare = (ma ?? []).filter((x: any) => mm.has(x.message_id));
      if (!paare.length) return;
      const aids = [...new Set(paare.map((x: any) => x.attachment_id))];
      const atts: any[] = [];
      for (let i = 0; i < aids.length; i += 200) { const { data } = await db.from("kc_communication_attachments").select("id,file_name,mime_type,size_bytes").in("id", aids.slice(i, i + 200)); atts.push(...(data ?? [])); }
      const { data: th } = await db.from("kc_communication_threads").select("id,subject").in("id", [...new Set(msgs.map((m) => m.thread_id))].filter((t) => tids.has(t)));
      const betreff = new Map((th ?? []).map((t: any) => [t.id, t.subject]));
      const am = new Map(atts.map((a) => [a.id, a]));
      for (const x of paare) {
        const a = am.get(x.attachment_id), m: any = mm.get(x.message_id);
        if (a) e.push({ art: "anhang", id: a.id, titel: a.file_name, datum: berlinTag(new Date(m.created_at)), text: "💬 " + (betreff.get(m.thread_id) || "Unterhaltung"), mime: a.mime_type, groesse: a.size_bytes, chat: m.thread_id,
          nachricht: m.id, vonMir: m.sender_person_id === ich.person_id }); // 1.64.2: eigene Anlage → auch „im Chat löschen“ möglich
      }
    }),
    sicher(async () => {
      const { data: dp } = await db.from("kc_dp_plan_published").select("event_id,work_date,start_time,end_time,area").eq("person_id", ich.person_id).lt("work_date", heute).order("work_date", { ascending: false }).limit(500);
      for (const d of dp ?? []) e.push({ art: "dienst", id: `${d.event_id}:${d.work_date}:${d.start_time}`, titel: txt(d.event_id, 80) || "Dienst", datum: d.work_date, text: `${String(d.start_time || "").slice(0, 5)}–${String(d.end_time || "").slice(0, 5)} Uhr${d.area ? " · " + d.area : ""}` });
    }),
  ]);
  return e.filter((x) => x.datum).sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
}

// ---------- Globale Suche (KC-CLUB-SUCHE, 1.4.0) ----------
// Schnellsuche (Lupe, ab 2 Buchstaben) und erweiterte Suche. Datenbank-Teil: kc_club_suche() mit denselben Sichtbarkeitsregeln
// wie die einzelnen Seiten. Mitglieder, Aktionen und Gruppennamen sucht der Server hier selbst. Suchbegriffe werden nie gespeichert.
const SUCHE_BEREICHE = ["mitglieder", "nachrichten", "termine", "pinnwand", "protokolle", "vorschlaege", "aktionen", "archiv", "fotos", "dienste"];
// gleiche Vereinheitlichung wie kc_club_norm() in der Datenbank
const suchNorm = (t: unknown) => String(t ?? "").toLowerCase().replace(/[äöüéèêàáâëïçñ]/g, (c) => ({ ä: "a", ö: "o", ü: "u", é: "e", è: "e", ê: "e", à: "a", á: "a", â: "a", ë: "e", ï: "i", ç: "c", ñ: "n" } as Record<string, string>)[c])
  .replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
const suchPasst = (woerter: string[], ...felder: unknown[]) => { const n = suchNorm(felder.filter(Boolean).join(" ")); return woerter.every((w) => n.includes(suchNorm(w))); };
function suchTag(v: unknown, plus = 0) {
  const d = archivDatum(v); if (!d) return null;
  const [y, m, t] = d.split("-").map(Number);
  return berlinZuUtc(y, m, t + plus, 0, 0);
}

// ---------- Vorschläge & Abstimmungen (KC-CLUB-VORSCHLAG) ----------
const STANDARD_OPTIONEN = ["Ja", "Nein", "Enthaltung"];
async function vorschlaegeListe(ich: Ich) {
  const [{ data: offen }, { data: fertig }] = await Promise.all([
    db.from("kc_club_vorschlaege").select("*").eq("status", "offen").order("erstellt_am", { ascending: false }).limit(100),
    db.from("kc_club_vorschlaege").select("*").neq("status", "offen").order("abgeschlossen_am", { ascending: false, nullsFirst: false }).limit(30),
  ]);
  const alle = [...(offen ?? []), ...(fertig ?? [])];
  const ids = alle.map((v: any) => v.id);
  const tids = [...new Set(alle.map((v: any) => v.treffen_id).filter(Boolean))];
  const leer = { data: [] as any[] };
  const [{ data: st }, { data: geh }, { data: tr }] = await Promise.all([
    ids.length ? db.from("kc_club_stimmen").select("vorschlag_id,person_id,wahl").in("vorschlag_id", ids) : Promise.resolve(leer),
    ids.length ? db.from("kc_club_geheime_stimmen").select("vorschlag_id,wahl").in("vorschlag_id", ids) : Promise.resolve(leer),
    tids.length ? db.from("kc_club_treffen").select("id,titel,beginn").in("id", tids) : Promise.resolve(leer),
  ]);
  const leute = await personen([...alle.map((v: any) => v.erstellt_von), ...(st ?? []).map((x: any) => x.person_id)]);
  const treffen = new Map((tr ?? []).map((t: any) => [t.id, t]));
  const berechtigt = (await aktiveMitglieder()).length;
  return alle.map((v: any) => {
    const s = (st ?? []).filter((x: any) => x.vorschlag_id === v.id);
    const mein = s.find((x: any) => x.person_id === ich.person_id);
    const optionen = unterstuetzbar(v.art) ? ["dafuer"] : v.optionen;
    // geheim: Ergebnis erst nach Abschluss und nie mit Namen
    const ergebnis = !v.geheim || v.status !== "offen" ? optionen.map((o: string) => ({
      option: o,
      anzahl: v.geheim ? (geh ?? []).filter((g: any) => g.vorschlag_id === v.id && g.wahl === o).length : s.filter((x: any) => x.wahl === o).length,
      ...(v.geheim ? {} : { namen: s.filter((x: any) => x.wahl === o).map((x: any) => leute.get(x.person_id)?.display_name || x.person_id).sort() }),
    })) : null;
    const eigener = v.erstellt_von === ich.person_id;
    const t: any = v.treffen_id ? treffen.get(v.treffen_id) : null;
    return {
      id: v.id, art: v.art, titel: v.titel, beschreibung: v.beschreibung, optionen: unterstuetzbar(v.art) ? [] : v.optionen, geheim: v.geheim,
      ...(v.art === "spende" ? { spenden: v.spenden ?? [], summe: spendenSumme(v.spenden) } : {}),
      status: v.status, frist: v.frist, erstellt_am: v.erstellt_am, abgeschlossen_am: v.abgeschlossen_am,
      von: { person_id: v.erstellt_von, name: leute.get(v.erstellt_von)?.display_name || v.erstellt_von },
      treffen: t ? { id: t.id, titel: t.titel, beginn: t.beginn } : null,
      abgestimmt: !!mein, meine: v.geheim ? null : mein?.wahl ?? null, stimmen: s.length, berechtigt, ergebnis,
      darfAbschliessen: v.status === "offen" && (ich.vorstand || (eigener && unterstuetzbar(v.art))),
      darfZurueckziehen: v.status === "offen" && (ich.vorstand || eigener),
      // löschen: Organisation immer; wer ihn gemacht hat, solange niemand sonst abgestimmt/unterstützt hat
      darfLoeschen: ich.vorstand || (eigener && !s.some((x: any) => x.person_id !== ich.person_id) && !(geh ?? []).some((g: any) => g.vorschlag_id === v.id)),
    };
  });
}
async function vorschlagAbschliessen(v: any, von: string | null) {
  const { data: ok } = await db.from("kc_club_vorschlaege").update({ status: "abgeschlossen", abgeschlossen_am: jetzt(), abgeschlossen_von: von })
    .eq("id", v.id).eq("status", "offen").select("id");
  if (!ok?.length) return null;
  if (v.art !== "abstimmung") return { gesendet: 0 };
  const erg = await abstimmungsErgebnis(v);
  const ziel = (await aktiveMitglieder()).map((x) => x.person_id);
  return await senden("club_vorschlag", ziel, {
    titel: "🗳️ Ergebnis: " + v.titel, kurz: erg,
    betreff: `Köcheclub Werne – Ergebnis der Abstimmung: ${v.titel}`,
    text: `Hallo,\n\ndie Abstimmung „${v.titel}“ ist beendet.\n\nErgebnis: ${erg}\n\nDetails in der Köcheclub-App: ${APP_URL}#vorschlaege\n\nViele Grüße\nKöcheclub Werne`,
    url: APP_URL + "#vorschlaege",
  }, `club-ergebnis:${v.id}`);
}

async function abstimmungsErgebnis(v: any) {
  const { data: s } = await db.from(v.geheim ? "kc_club_geheime_stimmen" : "kc_club_stimmen").select("wahl").eq("vorschlag_id", v.id);
  const zaehl = new Map<string, number>();
  (s ?? []).forEach((x: any) => x.wahl && zaehl.set(x.wahl, (zaehl.get(x.wahl) ?? 0) + 1));
  return v.optionen.map((o: string) => `${o}: ${zaehl.get(o) ?? 0}`).join(" · ");
}

// ---------- KC-CLUB-SPENDE (1.23.0): Spendenprojekte als Vorschlag (Empfänger + Betrag, ein oder mehrere) ----------
// Wird wie ein Thema behandelt (unterstützen 👍, landet in der Tagesordnung). Vorschläge für Empfänger: die Registry
// plus alles, was schon einmal vorgeschlagen wurde – so wächst die Auswahl von selbst, Tippen nur beim ersten Mal.
const SPENDEN_VORSCHLAEGE = ["Kinderhospiz Lünen/Werne"];
const SPENDEN_BETRAEGE = [50, 100, 250, 500, 1000];
const SPENDE_MAX = 100000;
const unterstuetzbar = (art: string) => art === "thema" || art === "spende";
const euroRund = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
const spendenSumme = (s: any[]) => (s ?? []).reduce((x: number, y: any) => x + Number(y.betrag || 0), 0);
function spendenPruefen(roh: unknown) {
  const liste = (Array.isArray(roh) ? roh : []).map((x: any) => ({ empfaenger: txt(x?.empfaenger, 100), betrag: Math.round(Number(x?.betrag) * 100) / 100 }))
    .filter((x) => x.empfaenger);
  if (!liste.length) throw new Fehler("Bitte mindestens ein Spendenprojekt auswählen.");
  if (liste.length > 10) throw new Fehler("Höchstens 10 Spendenprojekte auf einmal.");
  for (const x of liste) if (!(x.betrag > 0 && x.betrag <= SPENDE_MAX)) throw new Fehler(`Bitte für „${x.empfaenger}“ einen Betrag zwischen 1 und ${euroRund(SPENDE_MAX)} wählen.`);
  return liste;
}
const spendenTitel = (s: any[]) => (s.length === 1 ? `💝 Spende: ${s[0].empfaenger} – ${euroRund(s[0].betrag)}` : `💝 Spenden: ${s.length} Projekte – zusammen ${euroRund(spendenSumme(s))}`).slice(0, 150);
async function spendenEmpfaenger() {
  const { data } = await db.from("kc_club_vorschlaege").select("spenden").eq("art", "spende").order("erstellt_am", { ascending: false }).limit(50);
  const alle = [...SPENDEN_VORSCHLAEGE, ...(data ?? []).flatMap((v: any) => (v.spenden ?? []).map((x: any) => String(x.empfaenger || "")))].filter(Boolean);
  const gesehen = new Set<string>();
  return alle.filter((n) => { const k = n.toLowerCase(); if (gesehen.has(k)) return false; gesehen.add(k); return true; }).slice(0, 12);
}

// ---------- KC-CLUB-LEIHEN & KC-CLUB-HELFEN (1.23.0, Wunsch Hansi) ----------
// Auswahl statt Freitext: Zeitfenster, Zwecke und Hilfe-Arten kommen aus diesen Registries (die App zeigt sie als Kacheln).
const ZEITFENSTER: Record<string, string> = { vormittag: "🌅 Vormittag (8–12 Uhr)", mittag: "☀️ Mittag (12–14 Uhr)", nachmittag: "🌤️ Nachmittag (14–18 Uhr)", abend: "🌙 Abend (18–22 Uhr)" };
// 1.23.3: wie mit Hansi besprochen ergänzt (Schlüssel bleiben, damit alte Einträge lesbar bleiben)
const LEIH_ZWECKE: Record<string, string> = { vereinsfest: "🎉 Vereinsveranstaltung", feier: "🎂 Private Feier", nachbarschaft: "🏡 Nachbarschaftsfest", markt: "🏪 Markt / Stand", verein: "🤝 Anderer Verein", sonstiges: "✏️ Sonstiges" };
const HILFE_ARTEN: Record<string, string> = { aufbau: "🧱 Aufbauen", abbau: "📦 Abbauen", tragen: "🪑 Tische tragen", kochen: "🍳 Kochen", spuelen: "🧽 Spülen & Putzen", verkauf: "🏪 Verkauf am Stand", service: "🍽️ Service", einkauf: "🛒 Einkauf", fahren: "🚗 Fahrdienst", sonstiges: "🙋 Sonstiges",
  abordnung: "🕊️ Abordnung / Begleitung" }; // 1.32.0: KC-CLUB-FREUD-LEID (z. B. Beerdigung)
const LEIH_STATUS: Record<string, string> = { angefragt: "⏳ angefragt", genehmigt: "✅ genehmigt", abgelehnt: "❌ abgelehnt", abgeholt: "📦 abgeholt", zurueck: "↩️ zurückgegeben", storniert: "🚫 storniert" };
const LEIH_BELEGT = ["genehmigt", "abgeholt"], LEIH_OFFEN = ["angefragt", "genehmigt", "abgeholt"];
const LEIH_MAX_TAGE = 30, LEIH_VORLAUF_TAGE = 365, HILFE_VORLAUF_TAGE = 180;
const fWt = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC", weekday: "short" });
const leihTag = (iso: string, slot?: string | null) => `${fWt.format(new Date(iso + "T12:00:00Z"))} ${iso.split("-").reverse().join(".")}${slot && ZEITFENSTER[slot] ? " · " + ZEITFENSTER[slot] : ""}`;
const tagDazu = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const isoTag = (v: unknown) => { const s = String(v || ""); return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + "T12:00:00Z")) ? s : ""; };
const slotWahl = (v: unknown) => { const s = String(v || ""); if (s && !ZEITFENSTER[s]) throw new Fehler("Unbekanntes Zeitfenster."); return s || null; };
// Clubleitung = Clubsprecher, Kassenwart (Recht „Organisation“) und Admin – Testpersonen nie
async function leitungIds(): Promise<string[]> {
  const { data } = await db.from("kc_club_rollen").select("person_id").or("ist_vorstand.eq.true,ist_admin.eq.true");
  return [...new Set<string>((data ?? []).map((x: any) => x.person_id as string))].filter((id) => !id.startsWith("KC-P-TEST"));
}
// Belegung im Zeitraum (überschneidende Ausleihen): belegt = genehmigt/abgeholt, angefragt = noch offen
async function leihBelegung(von: string, bis: string, ohne?: string) {
  const { data } = await db.from("kc_club_ausleihen").select("id,positionen,status").in("status", LEIH_OFFEN).lte("abholung", bis).gte("rueckgabe", von);
  const belegt = new Map<string, number>(), angefragt = new Map<string, number>();
  for (const a of data ?? []) {
    if (a.id === ohne) continue;
    const m = LEIH_BELEGT.includes(a.status) ? belegt : angefragt;
    for (const x of a.positionen ?? []) m.set(x.id, (m.get(x.id) ?? 0) + Number(x.anzahl || 0));
  }
  return { belegt, angefragt };
}
async function leihFreiPruefen(positionen: any[], von: string, bis: string, ohne?: string) {
  const { data: g } = await db.from("kc_club_leih_gegenstaende").select("id,name,anzahl").in("id", positionen.map((x) => x.id));
  const { belegt } = await leihBelegung(von, bis, ohne);
  for (const x of positionen) {
    const ge = (g ?? []).find((y: any) => y.id === x.id), frei = Math.max(0, Number(ge?.anzahl ?? 0) - (belegt.get(x.id) ?? 0));
    if (x.anzahl > frei) throw new Fehler(`${x.name}: im Zeitraum ${frei ? `nur noch ${frei} frei` : "nichts mehr frei"}.`, 409);
  }
}
const leihZeilen = (a: any) => (a.positionen ?? []).map((x: any) => `${x.anzahl} × ${x.sym || "📦"} ${x.name}`);
function leihText(a: any, wer: string, art: "Antrag" | "Bescheid", entscheider?: string) {
  const heute = berlinTag(new Date()).split("-").reverse().join(".");
  return [`Köcheclub Werne – ${art === "Antrag" ? "Anfrage Ausleihe" : "Bescheid Ausleihe"}`, `${wer} · ${heute}`, "────────────────────", "",
    "Gegenstände:", ...leihZeilen(a).map((z: string) => "  • " + z), "",
    `Abholung:  ${leihTag(a.abholung, a.abholung_slot)}`, `Rückgabe:  ${leihTag(a.rueckgabe, a.rueckgabe_slot)}`,
    ...(a.zweck ? [`Zweck:     ${LEIH_ZWECKE[a.zweck] ?? a.zweck}`] : []), ...(a.notiz ? [`Notiz:     ${a.notiz}`] : []), "",
    `Status:    ${LEIH_STATUS[a.status] ?? a.status}${entscheider ? ` (von ${entscheider})` : ""}`, ...(a.grund ? [`Begründung: ${a.grund}`] : []), "",
    art === "Antrag" ? "Die Anfrage ging an Clubsprecher, Kassenwart und Admin – eine Zusage genügt." : "", `Vorgang: ${a.id}`, ""].join("\n");
}
// Textdatei ins Archiv legen (eigene Datei je Ablage, damit Löschen an einer Stelle die andere nicht trifft)
async function archivTextAblegen(ich: Ich, ordner: string, register: string, titel: string, dateiname: string, text: string, stichworte: string) {
  const bytes = new TextEncoder().encode("﻿" + text);
  let b = ""; for (const x of bytes) b += String.fromCharCode(x);
  const datei = await dateiAblegen(ich, dateiname.replace(/[^\w.\-äöüÄÖÜß]/g, "_"), "text/plain", btoa(b), ARCHIV_DATEITYPEN);
  const { error } = await db.from("kc_club_archiv_dokumente").insert({ ordner_id: ordner, register, titel: titel.slice(0, 120), datum: berlinTag(new Date()),
    stichworte: archivStichworte(stichworte), attachment_id: datei.id, datei_name: datei.name, mime: "text/plain", groesse: datei.groesse, hochgeladen_von: ich.person_id, status: "ok" });
  if (error) { await dateienEntfernen([datei.id]); throw new Error(error.message); }
}
// persönlicher Ordner des Jahres (anlegen, wenn es ihn noch nicht gibt) + Register sicherstellen; im Papierkorb → null
async function persoenlicherOrdner(pid: string, name: string, jahr: number, register: string) {
  const { data: da } = await db.from("kc_club_archiv_ordner").select("id,register,geloescht_am").eq("besitzer", pid).eq("jahr", jahr).maybeSingle();
  if (da?.geloescht_am) return null;
  if (da) {
    if (!(da.register || []).includes(register)) await db.from("kc_club_archiv_ordner").update({ register: [...(da.register || []), register], geaendert_am: jetzt() }).eq("id", da.id);
    return da.id as string;
  }
  const { data: neu } = await db.from("kc_club_archiv_ordner").insert({ art: "persoenlich", besitzer: pid, jahr, titel: name, farbe: 6,
    register: [...PERSOENLICH_REGISTER, register], erstellt_von: pid }).select("id").maybeSingle();
  if (neu) await protokoll(pid, "archiv_eigener_ordner_angelegt", { ordner: neu.id, jahr, automatisch: "ausleihe" });
  return neu?.id as string | undefined ?? null;
}
// Antrag/Bescheid → Vereinsordner „Admin <Jahr>“ (Register Ausleihe) + persönlicher Ordner des Mitglieds (Register Ausleihe)
async function leihAblegen(ich: Ich, a: any, art: "Antrag" | "Bescheid") {
  const jahr = Number(berlinTag(new Date()).slice(0, 4));
  const p = (await personen([a.person_id, a.entschieden_von])), wer = p.get(a.person_id)?.display_name || a.person_id;
  const entscheider = a.entschieden_von ? p.get(a.entschieden_von)?.display_name || a.entschieden_von : undefined;
  const text = leihText(a, wer, art, art === "Bescheid" ? entscheider : undefined);
  const kurz = (a.positionen ?? []).map((x: any) => `${x.anzahl}× ${x.name}`).join(", ");
  const titel = `${art === "Antrag" ? "Anfrage" : "Bescheid"} Ausleihe ${a.abholung.split("-").reverse().join(".")}${art === "Bescheid" ? ` – ${LEIH_STATUS[a.status] ?? a.status}` : ""}: ${kurz}`;
  const dateiname = `Ausleihe-${art}-${a.abholung}-${vorname(p.get(a.person_id) ?? null) || "Mitglied"}.txt`;
  const stichworte = `Ausleihe, ${(a.positionen ?? []).map((x: any) => x.name).join(", ")}, ${wer}`;
  const erg = { verein: false, persoenlich: false };
  try { await archivTextAblegen(ich, await adminOrdner(jahr, "Ausleihe"), "Ausleihe", `${wer}: ${titel}`, dateiname, text, stichworte); erg.verein = true; }
  catch (e) { console.error("ausleihe ablegen verein", String(e)); }
  try {
    const o = await persoenlicherOrdner(a.person_id, wer, jahr, "Ausleihe");
    if (o) { await archivTextAblegen(ich, o, "Ausleihe", titel, dateiname, text, stichworte); erg.persoenlich = true; }
  } catch (e) { console.error("ausleihe ablegen persoenlich", String(e)); }
  return erg;
}
async function leihenListe(ich: Ich) {
  const heute = berlinTag(new Date());
  const [{ data: g }, { data: offen }, { data: meine }, { data: fertig }] = await Promise.all([
    db.from("kc_club_leih_gegenstaende").select("*").order("sort").order("name"),
    db.from("kc_club_ausleihen").select("*").in("status", LEIH_OFFEN).gte("rueckgabe", tagDazu(heute, -LEIH_MAX_TAGE)).order("abholung").limit(300),
    db.from("kc_club_ausleihen").select("*").eq("person_id", ich.person_id).order("erstellt_am", { ascending: false }).limit(20),
    ich.vorstand ? db.from("kc_club_ausleihen").select("*").not("status", "in", `(${LEIH_OFFEN.join(",")})`).order("geaendert_am", { ascending: false }).limit(20) : Promise.resolve({ data: [] as any[] }),
  ]);
  const zeigen = [...(meine ?? []), ...(ich.vorstand ? [...(offen ?? []), ...(fertig ?? [])] : [])];
  const leute = await personen([...zeigen.map((a: any) => a.person_id), ...zeigen.map((a: any) => a.entschieden_von)]);
  const karte = (a: any) => ({ id: a.id, positionen: a.positionen, abholung: a.abholung, abholung_slot: a.abholung_slot, rueckgabe: a.rueckgabe, rueckgabe_slot: a.rueckgabe_slot,
    zweck: a.zweck, notiz: a.notiz, status: a.status, grund: a.grund, erstellt_am: a.erstellt_am, entschieden_am: a.entschieden_am, eigen: a.person_id === ich.person_id,
    wer: leute.get(a.person_id)?.display_name || a.person_id, entschieden_von: a.entschieden_von ? leute.get(a.entschieden_von)?.display_name || a.entschieden_von : null });
  const eindeutig = new Map<string, any>(); zeigen.forEach((a: any) => eindeutig.set(a.id, a));
  return {
    gegenstaende: (g ?? []).filter((x: any) => x.aktiv || ich.vorstand).map((x: any) => ({ id: x.id, name: x.name, sym: x.sym, anzahl: x.anzahl, aktiv: x.aktiv, sort: x.sort })),
    // für „noch X frei“ – ohne Namen
    belegungen: (offen ?? []).filter((a: any) => a.rueckgabe >= heute).map((a: any) => ({ von: a.abholung, bis: a.rueckgabe, belegt: LEIH_BELEGT.includes(a.status), positionen: (a.positionen ?? []).map((x: any) => ({ id: x.id, anzahl: x.anzahl })) })),
    ausleihen: [...eindeutig.values()].map(karte),
    zeitfenster: ZEITFENSTER, zwecke: LEIH_ZWECKE, status: LEIH_STATUS, maxTage: LEIH_MAX_TAGE, darfEntscheiden: ich.vorstand,
  };
}
async function leihErinnern() {
  // KC-CLUB-LEIHEN: am Rückgabetag (ab 9 Uhr) einmal erinnern
  const heute = berlinTag(new Date());
  const { data } = await db.from("kc_club_ausleihen").select("*").in("status", LEIH_BELEGT).eq("rueckgabe", heute).is("erinnert_am", null).limit(50);
  let n = 0;
  for (const a of data ?? []) {
    const { data: ok } = await db.from("kc_club_ausleihen").update({ erinnert_am: jetzt() }).eq("id", a.id).is("erinnert_am", null).select("id");
    if (!ok?.length) continue;
    await senden("club_nachricht", [a.person_id], {
      titel: "📦 Heute Rückgabe", kurz: `${leihZeilen(a).join(", ")} – bitte heute zurückbringen${a.rueckgabe_slot ? " (" + ZEITFENSTER[a.rueckgabe_slot] + ")" : ""}.`,
      betreff: "Köcheclub Werne – Erinnerung: Rückgabe heute",
      text: `Hallo,\n\nkleine Erinnerung: heute ist die Rückgabe der ausgeliehenen Sachen fällig:\n\n${leihZeilen(a).map((z: string) => "• " + z).join("\n")}\n\nRückgabe: ${leihTag(a.rueckgabe, a.rueckgabe_slot)}\n\nDanke!\nKöcheclub Werne`,
      url: APP_URL + "#helfen",
    }, `club-leihe-rueckgabe:${a.id}`).catch(() => null);
    n++;
  }
  return n;
}
// ---------- KC-CLUB-BOERSE (1.43.0, Wunsch Hansi): Club-Börse – Biete / Suche ----------
const BOERSE_RUBRIKEN: Record<string, string> = { kueche: "🍳 Küche", musik: "📀 Musik & Bücher", sport: "⛸️ Sport & Freizeit", kleidung: "👕 Kleidung", haushalt: "🏠 Haushalt", sonstiges: "📦 Sonstiges" };
const BOERSE_PREIS: Record<string, string> = { verschenken: "🎁 zu verschenken", preis: "💶 Festpreis", vb: "🤝 Verhandlungsbasis", tausch: "🔄 Tausch" };
const BOERSE_TAGE = 30, BOERSE_ERINNERN_TAGE = 3, BOERSE_VERLAENGERN = [7, 14, 30], BOERSE_MAX_VORLAUF = 60, BOERSE_AUFBEWAHREN_TAGE = 30;
// Stichwörter für Treffer: Wörter ab 3 Zeichen, ohne Füllwörter; Umlaute vereinheitlicht („Größe“ = „groesse“)
const BOERSE_FUELL = new Set(["und", "oder", "der", "die", "das", "ein", "eine", "einen", "von", "mit", "für", "fuer", "suche", "biete", "gebe", "ab", "gut", "neu", "alt", "gross", "groesse", "grosse", "klein", "sehr", "wie", "auch", "nur", "noch", "aus", "zum", "zur", "bei", "set", "stück", "stueck", "paar", "ähnlich", "aehnlich", "etc"]);
const boerseWorte = (t: string) => new Set(String(t || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !BOERSE_FUELL.has(w) && !/^\d+$/.test(w)));
const boersePasst = (a: any, b: any) => { const wa = boerseWorte(a.titel); for (const w of boerseWorte(b.titel)) if (wa.has(w)) return true; return false; };
async function boerseHolen(id: unknown) {
  const { data } = await db.from("kc_club_boerse").select("*").eq("id", String(id || "")).maybeSingle();
  if (!data || data.status === "geloescht") throw new Fehler("Anzeige nicht gefunden.", 404);
  return data;
}
async function boerseListe(ich: Ich) {
  const heute = berlinTag(new Date()), seit = tagDazu(heute, -BOERSE_AUFBEWAHREN_TAGE);
  const [{ data: aktiv }, { data: meine }] = await Promise.all([
    db.from("kc_club_boerse").select("*").eq("status", "aktiv").gte("laeuft_bis", heute).order("erstellt_am", { ascending: false }).limit(200),
    db.from("kc_club_boerse").select("*").eq("von", ich.person_id).neq("status", "geloescht").gte("geaendert_am", seit + "T00:00:00Z").order("erstellt_am", { ascending: false }).limit(50),
  ]);
  const alle = new Map([...(aktiv ?? []), ...(meine ?? [])].map((x: any) => [x.id, x]));
  const leute = await personen([...alle.values()].map((x: any) => x.von));
  const zeig = (x: any) => ({ id: x.id, art: x.art, rubrik: x.rubrik, titel: x.titel, text: x.text, preis_art: x.preis_art, preis: x.preis === null ? null : Number(x.preis),
    fotos: x.fotos ?? [], laeuft_bis: x.laeuft_bis, erstellt_am: x.erstellt_am, status: x.status === "aktiv" && x.laeuft_bis < heute ? "abgelaufen" : x.status,
    von: { person_id: x.von, name: leute.get(x.von)?.display_name || x.von, vorname: vorname(leute.get(x.von)) }, eigen: x.von === ich.person_id,
    darfEntfernen: x.von === ich.person_id || ich.vorstand });
  return { anzeigen: [...alle.values()].map(zeig), rubriken: BOERSE_RUBRIKEN, preisArten: BOERSE_PREIS, tage: BOERSE_TAGE, verlaengern: BOERSE_VERLAENGERN, heute };
}
// Wartung: 3 Tage vor Ablauf einmal erinnern; Abgelaufenes markieren; Erledigtes/Abgelaufenes nach 30 Tagen samt Fotos entfernen
async function boerseWartung() {
  const heute = berlinTag(new Date());
  const { data: bald } = await db.from("kc_club_boerse").select("*").eq("status", "aktiv").is("erinnert_am", null).gte("laeuft_bis", heute).lte("laeuft_bis", tagDazu(heute, BOERSE_ERINNERN_TAGE)).limit(50);
  let erinnert = 0;
  for (const a of bald ?? []) {
    const { data: ok } = await db.from("kc_club_boerse").update({ erinnert_am: jetzt() }).eq("id", a.id).is("erinnert_am", null).select("id");
    if (!ok?.length) continue;
    const bis = String(a.laeuft_bis).split("-").reverse().join(".");
    await senden("club_nachricht", [a.von], {
      titel: "🛍️ Deine Anzeige läuft bald ab", kurz: `„${a.titel}“ läuft am ${bis} ab – verlängern oder auslaufen lassen?`,
      betreff: `Köcheclub Werne – Börse: „${a.titel}“ läuft am ${bis} ab`,
      text: `Hallo,\n\ndeine Anzeige „${a.titel}“ in der Club-Börse läuft am ${bis} ab.\n\nIn der Köcheclub-App kannst du sie mit einem Tipp verlängern – oder einfach auslaufen lassen, dann musst du nichts tun.\n\n${APP_URL}#boerse=${a.id}\n\nViele Grüße\nKöcheclub Werne`,
      url: `${APP_URL}#boerse=${a.id}`,
    }, `club-boerse-ablauf:${a.id}:${a.laeuft_bis}`).catch(() => null);
    erinnert++;
  }
  await db.from("kc_club_boerse").update({ status: "abgelaufen", geaendert_am: jetzt() }).eq("status", "aktiv").lt("laeuft_bis", heute);
  const alt = new Date(Date.now() - BOERSE_AUFBEWAHREN_TAGE * 86400000).toISOString();
  const { data: weg } = await db.from("kc_club_boerse").select("id,fotos").in("status", ["erledigt", "abgelaufen", "geloescht"]).lt("geaendert_am", alt).limit(100);
  for (const a of weg ?? []) { await dateienEntfernen(a.fotos ?? []); await db.from("kc_club_boerse").delete().eq("id", a.id); }
  return { erinnert, entfernt: (weg ?? []).length };
}

async function hilfeListe(ich: Ich) {
  const heute = berlinTag(new Date());
  const { data: auf } = await db.from("kc_club_hilfe_aufrufe").select("*").gte("datum", tagDazu(heute, -14)).order("datum").order("erstellt_am").limit(100);
  const ids = (auf ?? []).map((x: any) => x.id);
  const { data: ant } = ids.length ? await db.from("kc_club_hilfe_antworten").select("*").in("aufruf_id", ids) : { data: [] as any[] };
  // KC-CLUB-HILFE-ANGEBOT (1.42.0): aktive Angebote („Ich biete Hilfe an“)
  const { data: ang } = await db.from("kc_club_hilfe_angebote").select("*").eq("aktiv", true).order("erstellt_am").limit(60);
  const leute = await personen([...(auf ?? []).map((x: any) => x.von), ...(ant ?? []).map((x: any) => x.person_id), ...(ang ?? []).map((x: any) => x.von)]);
  const { data: orte } = await db.from("kc_club_hilfe_aufrufe").select("ort").not("ort", "is", null).order("erstellt_am", { ascending: false }).limit(50);
  const ortListe: string[] = []; for (const o of orte ?? []) if (o.ort && !ortListe.some((x) => x.toLowerCase() === o.ort.toLowerCase()) && ortListe.length < 6) ortListe.push(o.ort);
  const n = (pid: string) => leute.get(pid)?.display_name || pid;
  return {
    aufrufe: (auf ?? []).map((x: any) => {
      const a = (ant ?? []).filter((y: any) => y.aufruf_id === x.id), komme = a.filter((y: any) => y.antwort === "komme");
      const vorbei = x.datum < heute || !!x.geschlossen_am;
      return { id: x.id, art: x.art, datum: x.datum, slot: x.slot, anzahl: x.anzahl, ort: x.ort, notiz: x.notiz, ziel: x.ziel, erstellt_am: x.erstellt_am,
        von: { person_id: x.von, name: n(x.von) }, eigen: x.von === ich.person_id, offen: !vorbei, geschlossen: !!x.geschlossen_am,
        komme: komme.map((y: any) => n(y.person_id)).sort(), kannNicht: a.filter((y: any) => y.antwort === "kann_nicht").length,
        meine: a.find((y: any) => y.person_id === ich.person_id)?.antwort ?? null, darfSchliessen: !vorbei && (x.von === ich.person_id || ich.vorstand) };
    }).filter((x: any) => x.offen || x.eigen || ich.vorstand),
    angebote: (ang ?? []).map((x: any) => ({ id: x.id, sym: x.sym, titel: x.titel, text: x.text, erstellt_am: x.erstellt_am,
      von: { person_id: x.von, name: n(x.von), vorname: vorname(leute.get(x.von)) || n(x.von).split(" ")[0] }, eigen: x.von === ich.person_id, darfAendern: x.von === ich.person_id || ich.vorstand })),
    angebotSymbole: HILFE_ANGEBOT_SYMBOLE,
    arten: HILFE_ARTEN, zeitfenster: ZEITFENSTER, orte: ortListe,
  };
}
const HILFE_ANGEBOT_SYMBOLE = ["🤲", "📱", "🧮", "💻", "🍳", "🔪", "🚗", "🛠️", "📸", "🎓", "🧾", "🌿"];

// ---------- KC-CLUB-BUERO (1.25.0, Wunsch Hansi): Büro für die Clubleitung (Clubsprecher, Kassenwart, Admin) ----------
// Sitzung vorbereiten (Anwesenheit, Anmerkung zum letzten Protokoll, Tagesordnung, Schreiblinien) → Protokoll-Entwurf →
// Ausdruck → Einladung mit Tagesordnung → Erinnerung an alle ohne Antwort. Dazu der Eingang auf einen Blick.
// Feste Tagesordnungspunkte (Freigabe Hansi „passt“); die Vorschläge kommen vor „Verschiedenes“.
const BUERO_TOP_VORNE = ["Begrüßung", "Genehmigung des letzten Protokolls", "Bericht des Kassenwarts"];
const BUERO_TOP_HINTEN = ["Verschiedenes"];
const BUERO_ZEILEN = [0, 3, 5, 8, 12];
// KC-CLUB-TAGESINFO: Grenze der Datenbank im Supabase-Tarif „Free“ (500 MB) – bei Tarifwechsel hier anpassen
const DB_GRENZE_BYTES = 500 * 1024 * 1024;
const topVorschlag = (v: any) => v.art === "spende" ? `${v.titel}${(v.spenden ?? []).length > 1 ? ` (zusammen ${euroRund(spendenSumme(v.spenden))})` : ""}` : v.art === "abstimmung" ? `🗳️ ${v.titel}` : v.titel;
async function bueroNaechste() {
  const { data } = await db.from("kc_club_treffen").select("id,titel,beginn,ort,art,status").eq("status", "geplant").neq("art", "veranstaltung")
    .gte("beginn", new Date(Date.now() - 6 * 3600000).toISOString()).order("beginn").limit(6);
  return data ?? [];
}
async function bueroSitzung(ich: Ich, tid: string) {
  const { data: t } = await db.from("kc_club_treffen").select("*").eq("id", tid).maybeSingle();
  if (!t) throw new Fehler("Sitzung nicht gefunden.", 404);
  const [mitglieder, { data: teil }, { data: vs }, { data: prep }, { data: pr }, { data: letzt }] = await Promise.all([
    aktiveMitglieder(),
    db.from("kc_club_teilnahme").select("person_id,antwort,notiz").eq("treffen_id", tid),
    db.from("kc_club_vorschlaege").select("*").or(`treffen_id.eq.${tid},and(treffen_id.is.null,status.eq.offen)`).neq("status", "zurueckgezogen").order("erstellt_am"),
    db.from("kc_club_buero_sitzung").select("*").eq("treffen_id", tid).maybeSingle(),
    db.from("kc_club_sitzungsprotokolle").select("id,status,version").eq("treffen_id", tid).maybeSingle(),
    db.from("kc_club_sitzungsprotokolle").select("id,titel,datum,status,einspruch_bis,veroeffentlicht_am").lt("datum", berlinTag(new Date(t.beginn))).order("datum", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const { data: auf } = letzt ? await db.from("kc_club_aufgaben").select("person_id,text,faellig,erledigt_am").eq("protokoll_id", letzt.id) : { data: [] as any[] };
  const leute = await personen((auf ?? []).map((a: any) => a.person_id));
  const ant = new Map<string, any>((teil ?? []).map((x: any) => [x.person_id as string, x]));
  const unterst = new Map<string, number>();
  if ((vs ?? []).length) {
    const { data: st } = await db.from("kc_club_stimmen").select("vorschlag_id").in("vorschlag_id", (vs ?? []).map((v: any) => v.id));
    (st ?? []).forEach((s: any) => unterst.set(s.vorschlag_id, (unterst.get(s.vorschlag_id) ?? 0) + 1));
  }
  const vorschlaege: any[] = (vs ?? []).map((v: any) => ({ id: v.id, art: v.art, titel: v.titel, text: topVorschlag(v), fuerDiese: v.treffen_id === tid, status: v.status, unterstuetzt: unterst.get(v.id) ?? 0 }));
  // Vorschlag für die Anmerkung: Stand des letzten Protokolls
  let anmerkungVorschlag = "";
  if (letzt) {
    const d = letzt.datum.split("-").reverse().join(".");
    anmerkungVorschlag = letzt.status === "entwurf" ? `Protokoll vom ${d} ist noch nicht veröffentlicht.`
      : letzt.einspruch_bis && new Date(letzt.einspruch_bis).getTime() > Date.now() ? `Protokoll vom ${d}: Einspruchsfrist läuft bis ${wann(letzt.einspruch_bis)}.`
      : `Protokoll vom ${d} ist genehmigt (keine Einsprüche).`;
  }
  // KC-CLUB-FREUD-LEID: verstorbene Mitglieder der letzten 90 Tage → „Gedenken / Schweigeminute“ direkt nach der Begrüßung
  const { data: tod } = await db.from("kc_club_fl_faelle").select("person_id").eq("art", "tod_mitglied").gte("datum", tagDazu(berlinTag(new Date(t.beginn)), -90)).lte("datum", berlinTag(new Date(t.beginn)));
  const totNamen = [...(await personen((tod ?? []).map((x: any) => x.person_id))).values()].map((x: any) => x.display_name);
  const gedenken = totNamen.length ? [{ t: `Gedenken an ${totNamen.join(", ")} (Schweigeminute)`, art: "fest" }] : [];
  const standardTop = [{ t: BUERO_TOP_VORNE[0], art: "fest" }, ...gedenken, ...BUERO_TOP_VORNE.slice(1).map((x) => ({ t: x, art: "fest" })), ...vorschlaege.filter((v) => v.fuerDiese).map((v) => ({ t: v.text, art: "vorschlag", id: v.id })), ...BUERO_TOP_HINTEN.map((x) => ({ t: x, art: "fest" }))];
  return {
    treffen: { id: t.id, titel: t.titel, beginn: t.beginn, ort: t.ort },
    mitglieder: mitglieder.map((m) => ({ person_id: m.person_id, name: m.display_name, antwort: ant.get(m.person_id)?.antwort ?? null, notiz: ant.get(m.person_id)?.notiz ?? null })),
    vorschlaege, anmerkungVorschlag,
    letztes: letzt ? { titel: letzt.titel, datum: letzt.datum, status: letzt.status } : null,
    aufgaben: (auf ?? []).map((a: any) => ({ wer: leute.get(a.person_id)?.display_name || a.person_id, text: a.text, faellig: a.faellig, erledigt: !!a.erledigt_am })),
    vorbereitung: prep ? { anwesend: prep.anwesend, anmerkung: prep.anmerkung, tagesordnung: prep.tagesordnung, zeilen: prep.zeilen, einladung_am: prep.einladung_am, erinnerung_am: prep.erinnerung_am } : null,
    standard: { anwesend: mitglieder.filter((m) => ant.get(m.person_id)?.antwort === "ja").map((m) => m.person_id), tagesordnung: standardTop, zeilen: 5 },
    protokoll: pr ? { id: pr.id, status: pr.status } : null,
    zeilenWahl: BUERO_ZEILEN,
  };
}
async function bueroEingang() {
  const leer = { count: 0 };
  const zahl = async (q: any) => { try { const r = await q; return r.count ?? 0; } catch { return 0; } };
  const [ausleihen, vorschlaege, hilfe, archiv, aufgaben, entwuerfe] = await Promise.all([
    zahl(db.from("kc_club_ausleihen").select("id", { count: "exact", head: true }).eq("status", "angefragt")),
    zahl(db.from("kc_club_vorschlaege").select("id", { count: "exact", head: true }).eq("status", "offen")),
    zahl(db.from("kc_club_hilfe_aufrufe").select("id", { count: "exact", head: true }).is("geschlossen_am", null).gte("datum", berlinTag(new Date()))),
    zahl(db.from("kc_club_archiv_dokumente").select("id", { count: "exact", head: true }).eq("status", "pruefung").is("geloescht_am", null)),
    zahl(db.from("kc_club_aufgaben").select("id", { count: "exact", head: true }).is("erledigt_am", null)),
    zahl(db.from("kc_club_sitzungsprotokolle").select("id", { count: "exact", head: true }).eq("status", "entwurf")),
  ]);
  void leer;
  return { ausleihen, vorschlaege, hilfe, archiv, aufgaben, entwuerfe };
}
function bueroTopListe(roh: unknown) {
  const l = (Array.isArray(roh) ? roh : []).map((x: any) => ({ t: txt(x?.t, 200), art: ["fest", "vorschlag", "eigen"].includes(x?.art) ? x.art : "eigen", ...(x?.id ? { id: String(x.id).slice(0, 40) } : {}) }))
    .filter((x) => x.t);
  if (l.length > 40) throw new Fehler("Höchstens 40 Tagesordnungspunkte.");
  return l;
}

// ---------- KC-CLUB-FREUD-LEID (1.32.0, Wunsch Hansi): Freud & Leid – nur Clubleitung ----------
// Registry: Art → Symbol, Titel, Gruppe, Standardbetrag (Freigabe Hansi: 100 € bei Todesfall, sonst offen) und Checkliste.
// wer: Rolle (clubsprecher/kassenwart/admin) oder „alle“ (= Aufruf an die Mitglieder, z. B. Abordnung); bis: sofort, Tage, termin, sitzung.
type FlSchritt = { t: string; wer?: string; bis?: string };
const FL_GLUECKWUNSCH: FlSchritt[] = [
  { t: "💬 Glückwunsch schicken (Nachricht oder Anruf)", wer: "clubsprecher", bis: "sofort" },
  { t: "✉️ Glückwunschkarte besorgen und unterschreiben lassen", bis: "sitzung" },
  { t: "🎁 Geschenk besorgen (Betrag festlegen)", wer: "kassenwart", bis: "7" },
  { t: "📌 Gruß an die Pinnwand", wer: "clubsprecher", bis: "sofort" },
];
const FL_GENESUNG: FlSchritt[] = [
  { t: "💬 Gute Besserung wünschen (Anruf oder Nachricht)", wer: "clubsprecher", bis: "sofort" },
  { t: "✉️ Genesungskarte besorgen und unterschreiben lassen", bis: "3" },
  { t: "🍎 Besuch oder kleiner Gruß (z. B. Obstkorb)", bis: "7" },
  { t: "📞 In 2 Wochen nachfragen, wie es geht", wer: "clubsprecher", bis: "14" },
];
const FL_ARTEN: Record<string, { sym: string; t: string; gruppe: "freude" | "leid"; betrag?: number; schritte: FlSchritt[] }> = {
  geburtstag_rund: { sym: "🎂", t: "Runder Geburtstag", gruppe: "freude", schritte: FL_GLUECKWUNSCH },
  jubilaeum: { sym: "🏅", t: "Vereinsjubiläum", gruppe: "freude", schritte: FL_GLUECKWUNSCH },
  geburt: { sym: "👶", t: "Geburt / Enkel", gruppe: "freude", schritte: [FL_GLUECKWUNSCH[0], FL_GLUECKWUNSCH[1], { t: "🧸 Kleines Geschenk fürs Baby besorgen", wer: "kassenwart", bis: "14" }, FL_GLUECKWUNSCH[3]] },
  hochzeit: { sym: "💍", t: "Hochzeit", gruppe: "freude", schritte: FL_GLUECKWUNSCH },
  ehejubilaeum: { sym: "🥂", t: "Silber-/Goldhochzeit", gruppe: "freude", schritte: FL_GLUECKWUNSCH },
  pruefung: { sym: "🎓", t: "Prüfung / Meister", gruppe: "freude", schritte: [FL_GLUECKWUNSCH[0], FL_GLUECKWUNSCH[1], FL_GLUECKWUNSCH[3]] },
  ruhestand: { sym: "🌅", t: "Ruhestand", gruppe: "freude", schritte: FL_GLUECKWUNSCH },
  genesung: { sym: "💪", t: "Wieder gesund", gruppe: "freude", schritte: [FL_GLUECKWUNSCH[0], FL_GLUECKWUNSCH[3]] },
  tod_mitglied: { sym: "🕊️", t: "Tod eines Mitglieds", gruppe: "leid", betrag: 100, schritte: [
    { t: "📞 Der Familie persönlich kondolieren", wer: "clubsprecher", bis: "sofort" },
    { t: "💐 Kranz mit Schleife „Köcheclub Werne“ bestellen (100 €)", wer: "kassenwart", bis: "termin" },
    { t: "✉️ Beileidskarte besorgen und unterschreiben lassen", bis: "3" },
    { t: "🚶 Abordnung zur Beerdigung – Mitglieder fragen, wer mitkommt", wer: "alle", bis: "termin" },
    { t: "📝 Nachruf schreiben", wer: "clubsprecher", bis: "7" },
    { t: "🕯️ Schweigeminute bei der nächsten Sitzung", wer: "clubsprecher", bis: "sitzung" },
    { t: "🗂️ Mitglied im KC Manager als ausgeschieden eintragen", wer: "admin", bis: "28" },
    { t: "📞 In 4 Wochen bei der Familie nachfragen", wer: "clubsprecher", bis: "28" },
  ] },
  tod_angehoeriger: { sym: "🕯️", t: "Tod eines nahen Angehörigen", gruppe: "leid", betrag: 100, schritte: [
    { t: "📞 Persönlich kondolieren (Anruf oder Besuch)", wer: "clubsprecher", bis: "sofort" },
    { t: "✉️ Beileidskarte besorgen", bis: "3" },
    { t: "✍️ Karte von allen unterschreiben lassen", bis: "sitzung" },
    { t: "💐 Blumen/Gesteck bestellen (100 €)", wer: "kassenwart", bis: "termin" },
    { t: "🚶 Wer geht zur Beerdigung? – Mitglieder fragen", wer: "alle", bis: "termin" },
    { t: "📞 In 4 Wochen nachfragen, wie es geht", wer: "clubsprecher", bis: "28" },
  ] },
  krankheit: { sym: "🏥", t: "Schwere Krankheit / Krankenhaus", gruppe: "leid", schritte: FL_GENESUNG },
  unfall: { sym: "🚑", t: "Unfall", gruppe: "leid", schritte: FL_GENESUNG },
};
async function flRollen() {
  const { data } = await db.from("kc_club_rollen").select("person_id,aemter,ist_admin");
  const mit = (wort: string) => (data ?? []).filter((r: any) => (r.aemter ?? []).some((a: string) => a.toLowerCase().startsWith(wort))).map((r: any) => r.person_id);
  return { clubsprecher: mit("clubsprecher"), kassenwart: mit("kassenwart"), admin: (data ?? []).filter((r: any) => r.ist_admin).map((r: any) => r.person_id) };
}
async function flFallHolen(id: unknown) {
  const { data: f } = await db.from("kc_club_fl_faelle").select("*").eq("id", String(id || "")).maybeSingle();
  if (!f) throw new Fehler("Fall nicht gefunden.", 404);
  return f;
}
const flTitel = (f: any, name?: string) => `${FL_ARTEN[f.art]?.sym ?? "🤍"} ${FL_ARTEN[f.art]?.t ?? f.art}${name ? ` – ${name}` : ""}`;
// Schritt mit Zuständigem → Aufgabe (wird wie alle Aufgaben mitgeteilt, erinnert und unter „Meine Aufgaben“ abgehakt)
async function flAufgabe(ich: Ich, f: any, s: { text: string; wer: string | null; bis: string | null }, name: string) {
  if (!s.wer) return null;
  const { data: a } = await db.from("kc_club_aufgaben").insert({ protokoll_id: null, person_id: s.wer, text: `${FL_ARTEN[f.art]?.sym ?? "🤍"} ${name}: ${s.text}`.slice(0, 300), faellig: s.bis, erstellt_von: ich.person_id }).select().single();
  return a ?? null;
}
async function flListe(ich: Ich) {
  const [{ data: offen }, { data: zu }] = await Promise.all([
    db.from("kc_club_fl_faelle").select("*").eq("status", "offen").order("erstellt_am", { ascending: false }).limit(50),
    db.from("kc_club_fl_faelle").select("*").eq("status", "abgeschlossen").order("abgeschlossen_am", { ascending: false }).limit(20),
  ]);
  const faelle = [...(offen ?? []), ...(zu ?? [])], ids = faelle.map((f: any) => f.id);
  const { data: sch } = ids.length ? await db.from("kc_club_fl_schritte").select("*").in("fall_id", ids).order("sort") : { data: [] as any[] };
  const aids = (sch ?? []).map((s: any) => s.aufgabe_id).filter(Boolean);
  const { data: auf } = aids.length ? await db.from("kc_club_aufgaben").select("id,erledigt_am,mitgeteilt_am").in("id", aids) : { data: [] as any[] };
  const aufrufIds = faelle.map((f: any) => f.aufruf_id).filter(Boolean);
  const [{ data: ant }, leute] = await Promise.all([
    aufrufIds.length ? db.from("kc_club_hilfe_antworten").select("aufruf_id,person_id,antwort").in("aufruf_id", aufrufIds) : Promise.resolve({ data: [] as any[] }),
    personen([...faelle.map((f: any) => f.person_id), ...(sch ?? []).map((s: any) => s.wer)]),
  ]);
  const n = (pid: string | null) => (pid ? leute.get(pid)?.display_name || pid : null);
  return {
    arten: Object.fromEntries(Object.entries(FL_ARTEN).map(([k, v]) => [k, { sym: v.sym, t: v.t, gruppe: v.gruppe, betrag: v.betrag ?? null, schritte: v.schritte }])),
    rollen: await flRollen(),
    faelle: faelle.map((f: any) => {
      const s = (sch ?? []).filter((x: any) => x.fall_id === f.id).map((x: any) => {
        const a = (auf ?? []).find((y: any) => y.id === x.aufgabe_id);
        return { id: x.id, text: x.text, wer: x.wer, werName: n(x.wer), alle: x.alle, bis: x.bis, erledigt: !!(x.erledigt_am || a?.erledigt_am), mitgeteilt: !!a?.mitgeteilt_am };
      });
      const kommen = (ant ?? []).filter((y: any) => y.aufruf_id === f.aufruf_id && y.antwort === "komme").map((y: any) => n(y.person_id));
      return { id: f.id, art: f.art, person_id: f.person_id, name: n(f.person_id), notiz: f.notiz, datum: f.datum, termin: f.termin, termin_ort: f.termin_ort,
        betrag: f.betrag === null ? null : Number(f.betrag), status: f.status, informiert_am: f.informiert_am, aufruf: f.aufruf_id ? { id: f.aufruf_id, kommen } : null,
        erstellt_am: f.erstellt_am, abgeschlossen_am: f.abgeschlossen_am, schritte: s, erledigt: s.filter((x: any) => x.erledigt).length };
    }),
  };
}

// ---------- Sitzungsprotokolle (KC-CLUB-PROTOKOLLE) & Aufgaben (KC-CLUB-AUFGABEN) ----------
// Schreiben darf jedes Mitglied mit Leserecht (der Schriftführer wechselt); ändern: Verfasser oder Organisation.
// Ablauf: Vorlage → Entwurf (Foto/Datei anhängen) → veröffentlichen → 7 Tage Einspruch → genehmigt.
const EINSPRUCH_TAGE = 7;
const nurProtokolle = (ich: Ich) => { if (!ich.protokolle) throw new Fehler("Protokolle sind nur für Mitglieder.", 403); };
const darfBearbeiten = (ich: Ich, pr: any) => pr.verfasser === ich.person_id || ich.vorstand;
// Entwurf (nie veröffentlicht): Verfasser oder Organisation; veröffentlicht: nur Organisation (Clubsprecher, Kassenwart, Admin)
const darfProtokollLoeschen = (ich: Ich, pr: any) => ich.vorstand || (pr.verfasser === ich.person_id && pr.status === "entwurf" && pr.version === 1);
async function protokollLeser(): Promise<string[]> {
  const [leute, { data: r }] = await Promise.all([aktiveMitglieder(), db.from("kc_club_rollen").select("person_id").eq("protokolle_lesen", false)]);
  const aus = new Set((r ?? []).map((x: any) => x.person_id));
  return leute.map((m) => m.person_id).filter((id) => !aus.has(id));
}
async function protokollHolen(id: unknown) {
  const { data } = await db.from("kc_club_sitzungsprotokolle").select("*").eq("id", String(id || "")).maybeSingle();
  if (!data) throw new Fehler("Protokoll nicht gefunden.", 404);
  return data;
}
function protokollStatus(pr: any, offeneEinwaende: number) {
  if (pr.status === "entwurf") return "entwurf";
  if (offeneEinwaende > 0) return "einwand";
  return pr.einspruch_bis && pr.einspruch_bis > jetzt() ? "einspruch" : "genehmigt";
}
const tagText = (d: string) => fTag.format(new Date(d + "T12:00:00Z"));
async function aufgabenMitteilen(aufgaben: any[], von: Ich, titel: string | null) {
  // je Person eine Benachrichtigung; nur einmal (mitgeteilt_am)
  const jePerson = new Map<string, any[]>();
  for (const a of aufgaben) {
    if (a.erledigt_am || a.mitgeteilt_am) continue;
    const { data: ok } = await db.from("kc_club_aufgaben").update({ mitgeteilt_am: jetzt() }).eq("id", a.id).is("mitgeteilt_am", null).select("id");
    if (!ok?.length || a.person_id === von.person_id) continue;
    jePerson.set(a.person_id, [...(jePerson.get(a.person_id) ?? []), a]);
  }
  for (const [pid, liste] of jePerson) {
    const zeilen = liste.map((a) => `📌 ${a.text}${a.faellig ? ` (bis ${tagText(a.faellig)})` : ""}`);
    await senden("club_aufgabe", [pid], {
      titel: liste.length === 1 ? "📌 Neue Aufgabe für dich" : `📌 ${liste.length} neue Aufgaben für dich`, kurz: liste.map((a) => a.text).join(" · ").slice(0, 150),
      betreff: `Köcheclub Werne – ${liste.length === 1 ? "neue Aufgabe" : "neue Aufgaben"} für dich`,
      text: `Hallo,\n\n${von.name} hat dir ${titel ? `im Protokoll „${titel}“ ` : ""}${liste.length === 1 ? "eine Aufgabe" : "Aufgaben"} eingetragen:\n\n${zeilen.join("\n")}\n\nAbhaken in der Köcheclub-App: ${APP_URL}#protokolle\n\nViele Grüße\nKöcheclub Werne`,
      url: APP_URL + "#protokolle",
    }, `club-aufgabe:${pid}:${liste.map((a) => a.id).join(",").slice(0, 80)}`);
  }
}
async function aufgabeHolen(ich: Ich, id: unknown) {
  const { data: a } = await db.from("kc_club_aufgaben").select("*").eq("id", String(id || "")).maybeSingle();
  if (!a) throw new Fehler("Aufgabe nicht gefunden.", 404);
  const pr = a.protokoll_id ? await protokollHolen(a.protokoll_id) : null;
  const verwalten = ich.vorstand || a.erstellt_von === ich.person_id || (pr ? darfBearbeiten(ich, pr) : false);
  return { a, pr, verwalten };
}

// ---------- Aktionen / Ausflüge (KC-CLUB-AKTIONEN) ----------
// Quelle ist der KC Manager (Bereich „Aktivitäten / Ausflüge“) – die Club-App liest nur, keine zweite Datenhaltung.
// Teilnehmer: Mitglied im KC Manager (m_kc_…) → kc_core_people über Nachname + Anfang des Vornamens (Anne/Annegret).
const AKTIONEN_QUELLE = { tabelle: "kc_manager_state_sections", aktionen: "activities", mitglieder: "members" };
const namensSchluessel = (vor: string, nach: string) => `${String(nach || "").trim().toLowerCase()}|${String(vor || "").trim().toLowerCase().slice(0, 3)}`;
// Reiseverlauf aus der Beschreibung („11.05.2027 Bremerhaven - 12.05.2027 Seetag - …“); Preiszeilen werden abgeschnitten
function reiseverlauf(beschreibung: unknown) {
  const t = String(beschreibung ?? "").replace(/\s*\n\s*/g, " ");
  const schnitt = t.search(/[A-ZÄÖÜ]{2,}-Tarif|\bTarif\b|\d+\s*x\s|€/);
  const kurz = schnitt >= 0 ? t.slice(0, schnitt) : t;
  return [...kurz.matchAll(/(\d{2})\.(\d{2})\.(\d{4})\s+(.+?)(?=\s+-\s+\d{2}\.\d{2}\.\d{4}|\s*-?\s*$)/g)]
    .map((m) => ({ datum: `${m[3]}-${m[2]}-${m[1]}`, ort: m[4].trim() }));
}
async function aktionenRoh() {
  const { data } = await db.from(AKTIONEN_QUELLE.tabelle).select("payload,updated_at").eq("org_id", ORG).eq("section_key", AKTIONEN_QUELLE.aktionen).maybeSingle();
  const liste = (Array.isArray(data?.payload?.data) ? data.payload.data : []).filter((a: any) => /^\d{4}-\d{2}-\d{2}$/.test(String(a?.dateFrom || "")));
  return { liste, stand: data?.updated_at ?? null };
}
async function aktionenLesen(ich: Ich) {
  const [{ liste, stand }, { data: mg }, leute] = await Promise.all([
    aktionenRoh(),
    db.from(AKTIONEN_QUELLE.tabelle).select("payload").eq("org_id", ORG).eq("section_key", AKTIONEN_QUELLE.mitglieder).maybeSingle(),
    aktiveMitglieder(),
  ]);
  const kern = new Map(leute.map((p) => [namensSchluessel(p.given_name || p.display_name.split(" ")[0], (p as any).family_name || p.display_name.split(" ").slice(-1)[0]), p]));
  const mgMap = new Map((Array.isArray(mg?.payload?.data) ? mg.payload.data : []).map((m: any) => [m.id, m]));
  const aktionen = liste.map((a: any) => {
    const teilnehmer = (Array.isArray(a.participants) ? a.participants : []).map((t: any) => {
      const m: any = mgMap.get(t.memberId);
      const p: any = m ? kern.get(namensSchluessel(m.firstName, m.lastName)) : null;
      return { person_id: p?.person_id ?? null, name: p?.display_name || [m?.preferredName || m?.firstName, m?.lastName].filter(Boolean).join(" ") || "unbekannt", bestaetigt: !!t.confirmed };
    }).sort((x: any, y: any) => x.name.localeCompare(y.name));
    const dabei = teilnehmer.some((t: any) => t.person_id === ich.person_id);
    return {
      id: String(a.id), titel: txt(a.activity, 200) || "Aktion", veranstalter: txt(a.organizer, 120) || null, von: a.dateFrom, bis: a.dateTo || a.dateFrom,
      status: txt(a.status, 40) || null, stattgefunden: !!a.tookPlace, anreise: txt(a.mobility, 60) || null, verlauf: reiseverlauf(a.description), teilnehmer, dabei,
      // Kosten und Reisebüro nur für Teilnehmende und Admin; Bemerkungen (z. B. Versicherungen einzelner) nur für den Admin
      ...(dabei || ich.admin ? {
        kosten: { proPerson: Number(a.costPerPerson) || null, zusatz: Number(a.extraCostPerPerson) || null },
        reisebuero: a.travelAgency ? { name: txt(a.travelAgency, 120), kontakt: txt(a.travelAgencyContact, 120) || null, telefon: txt(a.travelAgencyPhone, 40) || null } : null,
      } : {}),
      ...(ich.admin ? { bemerkung: txt(a.remarks, 1000) || null } : {}),
    };
  }).sort((x: any, y: any) => String(x.von).localeCompare(String(y.von)));
  const mf = await mitfahrtenZu(ich, "aktion", aktionen.map((a: any) => a.id));
  const su = await suchendeZu(ich, "aktion", aktionen.map((a: any) => String(a.id)));
  for (const a of aktionen as any[]) { a.mitfahrten = mf.get(a.id) ?? []; a.mitfahrtSuche = su.get(String(a.id)) ?? []; }
  return { aktionen, stand };
}

// ---------- Mitglieder-Details (KC-CLUB-KONTAKT) ----------
// Handy, E-Mail, Adresse aus kc_core_people (führend); Festnetz nur aus dem KC Manager (Mitglieder, gleiche Zuordnung wie bei Aktionen).
// Sichtbar: eigene Daten immer; Admin alles; sonst nur, was das Mitglied freigegeben hat – und nur mit Recht „Kontakte sehen“.
const KONTAKT_FELDER = ["handy", "festnetz", "mail", "adresse"];
async function festnetzAusManager(p: any) {
  const { data: mg } = await db.from(AKTIONEN_QUELLE.tabelle).select("payload").eq("org_id", ORG).eq("section_key", AKTIONEN_QUELLE.mitglieder).maybeSingle();
  const schluessel = namensSchluessel(p.given_name || p.display_name.split(" ")[0], p.family_name || p.display_name.split(" ").slice(-1)[0]);
  const m: any = (Array.isArray(mg?.payload?.data) ? mg.payload.data : []).find((x: any) => namensSchluessel(x.firstName, x.lastName) === schluessel);
  return txt(m?.phone, 40) || null;
}

// ---------- Mitfahrgelegenheiten (KC-CLUB-MITFAHREN) ----------
// Bezug: Treffen/Veranstaltung (kc_club_treffen) oder Aktion (ID aus dem KC Manager).
async function mitfahrtenZu(ich: Ich, art: "treffen" | "aktion", ids: string[]) {
  if (!ids.length) return new Map<string, any[]>();
  const { data: mf } = await db.from("kc_club_mitfahrt").select("*").eq("bezug_art", art).in("bezug_id", ids).order("erstellt_am");
  const mids = (mf ?? []).map((m: any) => m.id);
  const { data: pl } = mids.length ? await db.from("kc_club_mitfahrt_platz").select("mitfahrt_id,person_id").in("mitfahrt_id", mids) : { data: [] as any[] };
  const leute = await personen([...(mf ?? []).map((m: any) => m.fahrer), ...(pl ?? []).map((x: any) => x.person_id)]);
  const aus = new Map<string, any[]>();
  for (const m of mf ?? []) {
    const mit = (pl ?? []).filter((x: any) => x.mitfahrt_id === m.id);
    aus.set(m.bezug_id, [...(aus.get(m.bezug_id) ?? []), {
      id: m.id, fahrer: { person_id: m.fahrer, name: leute.get(m.fahrer)?.display_name || m.fahrer }, plaetze: m.plaetze, treffpunkt: m.treffpunkt, notiz: m.notiz,
      mitfahrer: mit.map((x: any) => leute.get(x.person_id)?.display_name || x.person_id), frei: Math.max(0, m.plaetze - mit.length),
      eigen: m.fahrer === ich.person_id, dabei: mit.some((x: any) => x.person_id === ich.person_id), darfLoeschen: m.fahrer === ich.person_id || ich.vorstand,
    }]);
  }
  return aus;
}
// KC-CLUB-MITFAHRT-SUCHE (0.87.0): wer zu einem Termin/einer Aktion eine Mitfahrgelegenheit sucht
async function suchendeZu(ich: Ich, art: "treffen" | "aktion", ids: string[]) {
  const aus = new Map<string, any[]>();
  if (!ids.length) return aus;
  const { data: s } = await db.from("kc_club_mitfahrt_suche").select("bezug_id,person_id,notiz").eq("bezug_art", art).in("bezug_id", ids).order("erstellt_am");
  const leute = await personen((s ?? []).map((x: any) => x.person_id));
  for (const x of s ?? []) aus.set(x.bezug_id, [...(aus.get(x.bezug_id) ?? []), { person_id: x.person_id, name: leute.get(x.person_id)?.display_name || x.person_id, notiz: x.notiz, eigen: x.person_id === ich.person_id }]);
  return aus;
}
// Mitfahren (suchen, anbieten, Platz buchen) bei Treffen nur nach Zusage („Ich komme“); Veranstaltungen/Aktionen ohne Zusage
async function mitfahrtErlaubt(ich: Ich, art: string, bid: string) {
  if (art !== "treffen") return;
  const { data: t } = await db.from("kc_club_treffen").select("art,status").eq("id", bid).maybeSingle();
  if (!t || t.status !== "geplant") throw new Fehler("Dieser Termin ist nicht mehr offen.", 409);
  if (t.art === "veranstaltung") return;
  const { data: tn } = await db.from("kc_club_teilnahme").select("antwort").eq("treffen_id", bid).eq("person_id", ich.person_id).maybeSingle();
  if (tn?.antwort !== "ja") throw new Fehler("Bitte zuerst „✅ Ich komme“ antippen – dann kannst du mitfahren oder eine Fahrt anbieten.", 409);
}
async function mitfahrtBezugTitel(art: string, id: string) {
  if (art === "treffen") {
    const { data: t } = await db.from("kc_club_treffen").select("id,titel,beginn").eq("id", id).maybeSingle();
    return t ? `${t.titel} (${wann(t.beginn)})` : null;
  }
  const a: any = (await aktionenRoh()).liste.find((x: any) => String(x.id) === id);
  return a ? txt(a.activity, 200) : null;
}

// ---------- Terminfindung (KC-CLUB-TERMINFINDUNG) ----------
async function terminumfragenListe(ich: Ich) {
  const [{ data: offen }, { data: fertig }] = await Promise.all([
    db.from("kc_club_terminumfragen").select("*").eq("status", "offen").order("erstellt_am", { ascending: false }).limit(20),
    db.from("kc_club_terminumfragen").select("*").neq("status", "offen").order("geaendert_am", { ascending: false }).limit(5),
  ]);
  const alle = [...(offen ?? []), ...(fertig ?? [])];
  const ids = alle.map((u: any) => u.id);
  const { data: opt } = ids.length ? await db.from("kc_club_terminumfrage_optionen").select("*").in("umfrage_id", ids).order("beginn") : { data: [] as any[] };
  const oids = (opt ?? []).map((o: any) => o.id);
  const { data: ant } = oids.length ? await db.from("kc_club_terminumfrage_antworten").select("option_id,person_id,antwort").in("option_id", oids) : { data: [] as any[] };
  const leute = await personen([...alle.map((u: any) => u.erstellt_von), ...(ant ?? []).map((x: any) => x.person_id)]);
  const name = (id: string) => leute.get(id)?.display_name || id;
  return alle.map((u: any) => {
    const o = (opt ?? []).filter((x: any) => x.umfrage_id === u.id);
    const a = (ant ?? []).filter((x: any) => o.some((y: any) => y.id === x.option_id));
    return {
      id: u.id, titel: u.titel, beschreibung: u.beschreibung, ort: u.ort, art: u.art, status: u.status, frist: u.frist, festgelegt_option: u.festgelegt_option,
      von: name(u.erstellt_von), antwortende: new Set(a.map((x: any) => x.person_id)).size,
      optionen: o.map((x: any) => {
        const z = (w: string) => a.filter((y: any) => y.option_id === x.id && y.antwort === w).map((y: any) => name(y.person_id)).sort();
        return { id: x.id, beginn: x.beginn, ja: z("ja"), vielleicht: z("vielleicht"), nein: z("nein"), meine: a.find((y: any) => y.option_id === x.id && y.person_id === ich.person_id)?.antwort ?? null };
      }),
      darfFestlegen: u.status === "offen" && (ich.vorstand || u.erstellt_von === ich.person_id),
      darfLoeschen: ich.vorstand || u.erstellt_von === ich.person_id,
    };
  });
}

// ---------- Handy-Kalender (KC-CLUB-KALENDERABO) ----------
// Persönlicher, geheimer Abo-Link (nur Hash gespeichert). Enthält Treffen/Veranstaltungen, Aktionen und freigegebene Geburtstage.
const icsText = (s: unknown) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsZeit = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsTag = (d: string) => d.replace(/-/g, "");
const tagDanach = (d: string) => new Date(new Date(d + "T12:00:00Z").getTime() + 86400000).toISOString().slice(0, 10);
function icsFalten(zeile: string) {
  // Zeilen über 75 Zeichen umbrechen (RFC 5545)
  const teile: string[] = []; let rest = zeile;
  while (rest.length > 74) { teile.push(rest.slice(0, 74)); rest = " " + rest.slice(74); }
  teile.push(rest); return teile.join("\r\n");
}
async function kalenderIcs(token: string) {
  const { data: abo } = await db.from("kc_club_kalender_abo").select("person_id").eq("token_hash", await sha256(token)).maybeSingle();
  if (!abo) return new Response("Kalender-Link ungültig – bitte in der App neu erzeugen.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const { data: pe } = await db.from("kc_core_people").select("person_id,display_name,given_name,preferred_name,active").eq("person_id", abo.person_id).maybeSingle();
  if (!pe?.active) return new Response("Kein Zugang.", { status: 403 });
  db.from("kc_club_kalender_abo").update({ zuletzt_abgerufen: jetzt() }).eq("person_id", abo.person_id).then(() => {});
  const ich = { person_id: pe.person_id, name: pe.display_name, vorname: vorname(pe), admin: false, vorstand: false, aemter: [], protokolle: false, kontakte: false, buero: null } as Ich;
  const [{ data: tr }, akt, geb] = await Promise.all([
    db.from("kc_club_treffen").select("*").gte("beginn", new Date(Date.now() - 60 * 86400000).toISOString()).lte("beginn", new Date(Date.now() + 500 * 86400000).toISOString()).order("beginn"),
    aktionenRoh(), geburtstageSichtbar(ich),
  ]);
  const stamp = icsZeit(jetzt()), z: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Koecheclub Werne//Club-App//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Köcheclub Werne", "X-WR-TIMEZONE:Europe/Berlin", "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H"];
  for (const t of tr ?? []) {
    const ort = t.ort || "";
    z.push("BEGIN:VEVENT", `UID:treffen-${t.id}@koecheclub-werne`, `DTSTAMP:${stamp}`, `SUMMARY:${icsText((t.art === "veranstaltung" ? "🎪 " : "🍳 ") + t.titel)}`);
    if (t.ganztaegig) z.push(`DTSTART;VALUE=DATE:${icsTag(berlinTag(new Date(t.beginn)))}`, `DTEND;VALUE=DATE:${icsTag(tagDanach(berlinTag(new Date(t.ende || t.beginn))))}`);
    else z.push(`DTSTART:${icsZeit(t.beginn)}`, `DTEND:${icsZeit(t.ende || new Date(new Date(t.beginn).getTime() + 3 * 3600000).toISOString())}`);
    if (ort) z.push(`LOCATION:${icsText(ort)}`);
    z.push(`DESCRIPTION:${icsText((t.beschreibung ? t.beschreibung + "\n\n" : "") + APP_URL + "#termine")}`, `STATUS:${t.status === "abgesagt" ? "CANCELLED" : "CONFIRMED"}`, "END:VEVENT");
  }
  for (const a of akt.liste as any[]) {
    z.push("BEGIN:VEVENT", `UID:aktion-${icsText(a.id)}@koecheclub-werne`, `DTSTAMP:${stamp}`, `SUMMARY:${icsText("🧳 " + txt(a.activity, 200))}`,
      `DTSTART;VALUE=DATE:${icsTag(a.dateFrom)}`, `DTEND;VALUE=DATE:${icsTag(tagDanach(a.dateTo || a.dateFrom))}`, `DESCRIPTION:${icsText(APP_URL + "#aktion=" + a.id)}`, "END:VEVENT");
  }
  // KC-CLUB-TERMINANFRAGE (0.92.0): eigene Anfragen und die, denen ich zugesagt habe (Ja/Vielleicht)
  for (const x of await terminanfragenListe(ich, { von: new Date(Date.now() - 60 * 86400000).toISOString(), bis: new Date(Date.now() + 500 * 86400000).toISOString() })) {
    if (!x.vonMir && x.meine !== "ja" && x.meine !== "vielleicht") continue;
    z.push("BEGIN:VEVENT", `UID:anfrage-${x.id}@koecheclub-werne`, `DTSTAMP:${stamp}`, `SUMMARY:${icsText("📨 " + x.anlass + (x.vonMir ? "" : " (" + x.von.vorname + ")"))}`,
      `DTSTART:${icsZeit(x.beginn)}`, `DTEND:${icsZeit(x.ende || new Date(new Date(x.beginn).getTime() + 3600000).toISOString())}`);
    if (x.ort) z.push(`LOCATION:${icsText(x.ort)}`);
    z.push(`DESCRIPTION:${icsText((x.notiz ? x.notiz + "\n\n" : "") + APP_URL + "#termine")}`, `STATUS:${x.status === "abgesagt" ? "CANCELLED" : x.meine === "vielleicht" ? "TENTATIVE" : "CONFIRMED"}`, "END:VEVENT");
  }
  // KC-CLUB-PRIVATTERMIN (1.0.0): eigene private Einträge im eigenen Abo
  const { data: pReihen } = await db.from("kc_club_privattermine").select("*").eq("person_id", ich.person_id).neq("wiederholung", "keine").limit(200);
  const lokal = (iso: string) => { const t = berlinTeile(new Date(iso)); return `${t.y}${String(t.m).padStart(2, "0")}${String(t.d).padStart(2, "0")}T${String(t.h).padStart(2, "0")}${String(t.mi).padStart(2, "0")}00`; };
  for (const r of pReihen ?? []) {
    const t0 = berlinTeile(new Date(r.beginn)), wt = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][new Date(Date.UTC(t0.y, t0.m - 1, t0.d)).getUTCDay()];
    const nth = t0.d + 7 > new Date(Date.UTC(t0.y, t0.m, 0)).getUTCDate() ? -1 : Math.ceil(t0.d / 7);
    const rr = { taeglich: "FREQ=DAILY", werktags: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", woechentlich: "FREQ=WEEKLY", zweiwoechentlich: "FREQ=WEEKLY;INTERVAL=2",
      monatlich: "FREQ=MONTHLY", monatlich_wochentag: `FREQ=MONTHLY;BYDAY=${nth}${wt}`, jaehrlich: "FREQ=YEARLY" }[r.wiederholung as string];
    if (!rr) continue;
    z.push("BEGIN:VEVENT", `UID:privat-${r.id}@koecheclub-werne`, `DTSTAMP:${stamp}`, `SUMMARY:${icsText("🔒 " + r.titel)}`, "CLASS:PRIVATE");
    if (r.ganztaegig) z.push(`DTSTART;VALUE=DATE:${icsTag(berlinTag(new Date(r.beginn)))}`, `DTEND;VALUE=DATE:${icsTag(tagDanach(berlinTag(new Date(r.beginn))))}`);
    else z.push(`DTSTART;TZID=Europe/Berlin:${lokal(r.beginn)}`, `DTEND;TZID=Europe/Berlin:${lokal(r.ende || new Date(new Date(r.beginn).getTime() + 3600000).toISOString())}`);
    z.push(`RRULE:${rr}${r.wiederholung_bis ? ";UNTIL=" + String(r.wiederholung_bis).replace(/-/g, "") + "T225959Z" : ""}`);
    for (const a of r.ausnahmen || []) z.push(r.ganztaegig ? `EXDATE;VALUE=DATE:${String(a).replace(/-/g, "")}` : `EXDATE;TZID=Europe/Berlin:${String(a).replace(/-/g, "")}T${lokal(r.beginn).slice(9)}`);
    if (r.ort) z.push(`LOCATION:${icsText(r.ort)}`);
    if (r.notiz) z.push(`DESCRIPTION:${icsText(r.notiz)}`);
    z.push("END:VEVENT");
  }
  for (const x of (await privatListe(ich, new Date(Date.now() - 60 * 86400000).toISOString(), new Date(Date.now() + 500 * 86400000).toISOString())).filter((x: any) => !x.serienBeginn)) {
    z.push("BEGIN:VEVENT", `UID:privat-${x.id}@koecheclub-werne`, `DTSTAMP:${stamp}`, `SUMMARY:${icsText("🔒 " + x.titel)}`, "CLASS:PRIVATE");
    if (x.ganztaegig) z.push(`DTSTART;VALUE=DATE:${icsTag(berlinTag(new Date(x.beginn)))}`, `DTEND;VALUE=DATE:${icsTag(tagDanach(berlinTag(new Date(x.ende || x.beginn))))}`);
    else z.push(`DTSTART:${icsZeit(x.beginn)}`, `DTEND:${icsZeit(x.ende || new Date(new Date(x.beginn).getTime() + 3600000).toISOString())}`);
    if (x.ort) z.push(`LOCATION:${icsText(x.ort)}`);
    if (x.notiz) z.push(`DESCRIPTION:${icsText(x.notiz)}`);
    z.push("END:VEVENT");
  }
  const jahr = Number(berlinTag(new Date()).slice(0, 4));
  for (const g of geb) {
    if (g.person_id === ich.person_id) continue;
    const d = `${jahr}-${g.md}`;
    if (g.md === "02-29") continue; // Schalttag: im Abo ausgelassen (App zeigt ihn am 28.02.)
    z.push("BEGIN:VEVENT", `UID:geburtstag-${g.person_id}@koecheclub-werne`, `DTSTAMP:${stamp}`, `SUMMARY:${icsText("🎂 " + g.name)}`,
      `DTSTART;VALUE=DATE:${icsTag(d)}`, `DTEND;VALUE=DATE:${icsTag(tagDanach(d))}`, "RRULE:FREQ=YEARLY", "TRANSP:TRANSPARENT", "END:VEVENT");
  }
  z.push("END:VCALENDAR");
  return new Response(z.map(icsFalten).join("\r\n") + "\r\n", { headers: { ...cors, "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": 'inline; filename="koecheclub.ics"' } });
}

// ---------- Nachrichten ----------
async function binTeilnehmer(threadId: string, person: string) {
  const { data } = await db.from("kc_communication_thread_participants").select("thread_id").eq("thread_id", threadId).eq("person_id", person).maybeSingle();
  if (!data) throw new Fehler("Unterhaltung nicht gefunden.", 404);
}
// KC-CLUB-ZENTRALE (0.44.0): Wer darf wen erreichen? Beschluss Admin 29.09.2026: alle Mitglieder dürfen alle anschreiben,
// anrufen und anklopfen (vorher „Alle“ nur Clubleitung). Umschaltbar an dieser einen Stelle.
const KOMMUNIKATION = { alleDarfJeder: true };
async function empfaengerAufloesen(ich: Ich, e: any): Promise<string[]> {
  const ids = new Set<string>((Array.isArray(e?.personen) ? e.personen : []).map(String));
  if (e?.alle) { if (!KOMMUNIKATION.alleDarfJeder) nurVorstand(ich); (await aktiveMitglieder()).forEach((p) => ids.add(p.person_id)); }
  const aemter = (Array.isArray(e?.aemter) ? e.aemter : []).map(String);
  if (aemter.length) {
    const { data } = await db.from("kc_club_rollen").select("person_id,aemter").overlaps("aemter", aemter);
    (data ?? []).forEach((r: any) => ids.add(r.person_id));
  }
  if (e?.vorstand) { const { data } = await db.from("kc_club_rollen").select("person_id").eq("ist_vorstand", true); (data ?? []).forEach((r: any) => ids.add(r.person_id)); }
  ids.delete(ich.person_id);
  const aktiv = new Set((await aktiveMitglieder()).map((p) => p.person_id));
  return [...ids].filter((id) => aktiv.has(id));
}


// ---------- KC-CLUB-TERMINANFRAGE (0.92.0) ----------
// Jedes Mitglied fragt Einzelne, mehrere oder eine Gruppe persönlich an (Anlass, Datum/Uhrzeit, Ort) – Antwort ja / vielleicht / nein.
// Eigene Tabellen (nicht kc_club_treffen): eine private Anfrage darf nie in Liste, Kalender-Abo oder „Demnächst“ aller landen.
// Sichtbar nur für Absender und Empfänger; die Antworten sehen alle Beteiligten (wie bei Treffen).
const ANFRAGE_MAX_EMPFAENGER = 100, ANFRAGE_MAX_JE_TAG = 30;
// Empfänger: einzelne Personen und/oder eine Gruppe (= Teilnehmer der Gruppen-Unterhaltung) – ohne mich, nur aktive Mitglieder
async function zielPersonen(ich: Ich, an: any): Promise<string[]> {
  const ids = new Set<string>((Array.isArray(an?.personen) ? an.personen : []).map(String).slice(0, 300));
  const gruppe = String(an?.gruppe || "");
  if (gruppe) {
    await binTeilnehmer(gruppe, ich.person_id);
    const { data: g } = await db.from("kc_club_gruppen").select("thread_id").eq("thread_id", gruppe).maybeSingle();
    if (!g) throw new Fehler("Gruppe nicht gefunden.", 404);
    const { data: tn } = await db.from("kc_communication_thread_participants").select("person_id").eq("thread_id", gruppe);
    (tn ?? []).forEach((x: any) => ids.add(String(x.person_id)));
  }
  ids.delete(ich.person_id);
  const aktiv = new Set((await aktiveMitglieder()).map((x) => x.person_id));
  return [...ids].filter((id) => aktiv.has(id));
}
async function terminanfragenListe(ich: Ich, zeitraum?: { von: string; bis: string }) {
  const von = zeitraum?.von ?? new Date(Date.now() - 14 * 86400000).toISOString();
  const { data: empf } = await db.from("kc_club_terminanfrage_empfaenger").select("anfrage_id").eq("person_id", ich.person_id);
  const empfIds = [...new Set((empf ?? []).map((x: any) => String(x.anfrage_id)))];
  const basis = () => { let q = db.from("kc_club_terminanfragen").select("*").gte("beginn", von); if (zeitraum?.bis) q = q.lte("beginn", zeitraum.bis); return q; };
  const [{ data: eigene }, { data: fremde }] = await Promise.all([
    basis().eq("erstellt_von", ich.person_id),
    empfIds.length ? basis().in("id", empfIds.slice(0, 500)) : Promise.resolve({ data: [] as any[] }),
  ]);
  const alle = new Map<string, any>();
  for (const a of [...(eigene ?? []), ...(fremde ?? [])]) alle.set(a.id, a);
  const liste = [...alle.values()].sort((a, b) => String(a.beginn).localeCompare(String(b.beginn)));
  if (!liste.length) return [];
  const { data: zeilen } = await db.from("kc_club_terminanfrage_empfaenger").select("*").in("anfrage_id", liste.map((a) => a.id));
  const leute = await personen([...liste.map((a) => a.erstellt_von), ...(zeilen ?? []).map((z: any) => z.person_id)]);
  const name = (id: string) => leute.get(id)?.display_name || "Mitglied";
  return liste.map((a) => {
    const e = (zeilen ?? []).filter((z: any) => z.anfrage_id === a.id);
    const mein = e.find((z: any) => z.person_id === ich.person_id);
    return {
      id: a.id, anlass: a.anlass, beginn: a.beginn, ende: a.ende, ort: a.ort, notiz: a.notiz, frist: a.frist, status: a.status,
      vonMir: a.erstellt_von === ich.person_id, von: { person_id: a.erstellt_von, name: name(a.erstellt_von), vorname: vorname(leute.get(a.erstellt_von)) || name(a.erstellt_von) },
      meine: mein?.antwort ?? null, meineNotiz: mein?.notiz ?? null,
      empfaenger: e.map((z: any) => ({ person_id: z.person_id, name: name(z.person_id), antwort: z.antwort, notiz: z.notiz, geantwortet_am: z.geantwortet_am }))
        .sort((x: any, y: any) => x.name.localeCompare(y.name, "de")),
    };
  });
}
const ANTWORT_TEXT: Record<string, string> = { ja: "✅ Ja", vielleicht: "🤔 Vielleicht", nein: "❌ Nein" };
function anfrageWann(a: any) { return wann(a.beginn, true) + (a.ende ? ` bis ${fZeit.format(new Date(a.ende))} Uhr` : ""); }

// ---------- KC-CLUB-STANDORT (0.92.0) ----------
// Live teilen: nur an Gewählte, nur für die gewählte Dauer (höchstens 8 Std.), danach löscht die Wartung die Zeile.
// Beenden löscht sofort. Einmal senden läuft ohne Tabelle als normale Nachricht mit Kartenlink.
const STANDORT_MAX_MIN = 480;
function koordinaten(p: any) {
  const lat = Number(p.lat), lon = Number(p.lon), gen = p.genauigkeit == null ? null : Number(p.genauigkeit);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Fehler("Standort ungültig – bitte erneut versuchen.");
  return { lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6, genauigkeit: gen != null && Number.isFinite(gen) ? Math.min(Math.max(0, gen), 100000) : null };
}


// ---------- KC-CLUB-FEHLERPROTOKOLL (0.93.0) ----------
// Die App schreibt jede Kleinigkeit mit, die beim Start oder in der Bedienung schiefgeht (Skriptfehler, Serverantworten,
// Start hängt, alte Version, falscher Browser …). Einträge werden auf dem Gerät gesammelt und gebündelt geschickt –
// nach der Anmeldung mit Namen, vorher (Link fehlt/ungültig) anonym mit Geräte-Kennung. Nie Zugangsdaten oder Inhalte.
const FP_MAX_JE_SENDUNG = 25, FP_ANONYM_JE_STUNDE = 150, FP_GERAET_JE_STUNDE = 40;
function fpSauber(d: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!d || typeof d !== "object") return out;
  for (const [k, v] of Object.entries(d).slice(0, 25)) {
    const key = txt(k, 30).replace(/[^A-Za-z0-9_]/g, "");
    if (!key || /token|key|schluessel|passwort|password/i.test(key)) continue;
    out[key] = typeof v === "number" || typeof v === "boolean" ? v : txt(typeof v === "object" ? JSON.stringify(v) : v, 400).replace(/[?&]k=[0-9a-f]{16,}/gi, "?k=…");
  }
  return out;
}
const fpArt = (x: unknown) => txt(x, 24).toLowerCase().replace(/[^a-z_]/g, "") || "allg";

// ---------- KC-CLUB-WIEDERHOLUNG (1.1.0): Termine wiederholen – immer in deutscher Ortszeit (18:00 bleibt 18:00, auch nach der Zeitumstellung) ----------
const WDH = ["keine", "taeglich", "werktags", "woechentlich", "zweiwoechentlich", "monatlich", "monatlich_wochentag", "jaehrlich"];
const WDH_TEXT: Record<string, string> = { taeglich: "täglich", werktags: "werktags (Mo–Fr)", woechentlich: "wöchentlich", zweiwoechentlich: "alle 2 Wochen",
  monatlich: "monatlich", monatlich_wochentag: "monatlich am gleichen Wochentag", jaehrlich: "jährlich" };
function berlinTeile(d: Date) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const g = (t: string) => Number(f.find((x) => x.type === t)?.value);
  return { y: g("year"), m: g("month"), d: g("day"), h: g("hour"), mi: g("minute") };
}
function berlinZuUtc(y: number, m: number, d: number, h: number, mi: number) {
  const probe = Date.UTC(y, m - 1, d, h, mi), t = berlinTeile(new Date(probe));
  return new Date(probe - (Date.UTC(t.y, t.m - 1, t.d, t.h, t.mi) - probe));
}
// Alle Termine einer Reihe zwischen von und bis (ISO-Zeiten der Beginne), höchstens max
function wiederholungen(beginnIso: string, regel: string, von: Date, bis: Date, grenze?: string | null, ausnahmen: string[] = [], max = 400): string[] {
  const s0 = berlinTeile(new Date(beginnIso)), aus = new Set(ausnahmen.map(String)), out: string[] = [];
  const ende = grenze ? berlinZuUtc(Number(grenze.slice(0, 4)), Number(grenze.slice(5, 7)), Number(grenze.slice(8, 10)), 23, 59) : null;
  const tagZahl = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const nterWochentag = Math.ceil(s0.d / 7), wtag = new Date(Date.UTC(s0.y, s0.m - 1, s0.d)).getUTCDay(), letzter = s0.d + 7 > tagZahl(s0.y, s0.m);
  for (let k = 0, n = 0; k < 6000 && n < max; k++) {
    let y = s0.y, m = s0.m, d = s0.d;
    if (regel === "taeglich" || regel === "werktags") { const t = new Date(Date.UTC(s0.y, s0.m - 1, s0.d + k)); y = t.getUTCFullYear(); m = t.getUTCMonth() + 1; d = t.getUTCDate();
      if (regel === "werktags" && [0, 6].includes(t.getUTCDay())) continue; }
    else if (regel === "woechentlich" || regel === "zweiwoechentlich") { const t = new Date(Date.UTC(s0.y, s0.m - 1, s0.d + k * (regel === "woechentlich" ? 7 : 14))); y = t.getUTCFullYear(); m = t.getUTCMonth() + 1; d = t.getUTCDate(); }
    else if (regel === "monatlich" || regel === "monatlich_wochentag") {
      const t = new Date(Date.UTC(s0.y, s0.m - 1 + k, 1)); y = t.getUTCFullYear(); m = t.getUTCMonth() + 1;
      if (regel === "monatlich") d = Math.min(s0.d, tagZahl(y, m));
      else { const erster = (wtag - new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 7) % 7 + 1; d = erster + 7 * (nterWochentag - 1);
        if (letzter || d > tagZahl(y, m)) { d = erster; while (d + 7 <= tagZahl(y, m)) d += 7; } }
    }
    else if (regel === "jaehrlich") { y = s0.y + k; d = Math.min(s0.d, tagZahl(y, s0.m)); }
    else { if (k > 0) break; }
    const t = berlinZuUtc(y, m, d, s0.h, s0.mi);
    if (t > bis || (ende && t > ende)) break;
    const tag = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (t >= von && !aus.has(tag)) { out.push(t.toISOString()); n++; }
  }
  return out;
}

// KC-CLUB-PRIVATTERMIN (1.0.0): persönliche Einträge – immer nur die eigenen (person_id = ich)
async function privatListe(ich: Ich, von: string, bis?: string) {
  const felder = "id,titel,beginn,ende,ganztaegig,ort,notiz,erinnerung_min,wiederholung,wiederholung_bis,ausnahmen";
  const bisD = bis ? new Date(bis) : new Date(Date.now() + 500 * 86400000);
  let q = db.from("kc_club_privattermine").select(felder).eq("person_id", ich.person_id).eq("wiederholung", "keine").gte("beginn", von).order("beginn").limit(300);
  if (bis) q = q.lte("beginn", bis);
  const [{ data: einzel }, { data: reihen }] = await Promise.all([q,
    db.from("kc_club_privattermine").select(felder).eq("person_id", ich.person_id).neq("wiederholung", "keine").lte("beginn", bisD.toISOString())
      .or(`wiederholung_bis.is.null,wiederholung_bis.gte.${von.slice(0, 10)}`).limit(200)]);
  const out: any[] = [...(einzel ?? [])];
  // KC-CLUB-WIEDERHOLUNG (1.1.0): Reihen im Zeitraum ausrechnen; id bleibt die der Reihe, serienBeginn für „Ändern“
  for (const r of reihen ?? []) {
    const dauer = r.ende ? new Date(r.ende).getTime() - new Date(r.beginn).getTime() : 0;
    for (const b of wiederholungen(r.beginn, r.wiederholung, new Date(von), bisD, r.wiederholung_bis, r.ausnahmen || [], 400))
      out.push({ ...r, beginn: b, ende: r.ende ? new Date(new Date(b).getTime() + dauer).toISOString() : null, serienBeginn: r.beginn, serienEnde: r.ende });
  }
  return out.sort((a, b) => String(a.beginn).localeCompare(String(b.beginn))).slice(0, 600);
}

// KC-CLUB-NUTZUNG (0.99.0): nur diese Bereiche werden gezählt (Ansichten der App)
const NUTZUNG_BEREICHE = new Set(["start", "termine", "nachrichten", "chat", "neu", "pinnwand", "fotos", "mitglieder", "mitglied", "einstellungen", "dienste",
  "aktionen", "aktion", "protokolle", "protokoll", "vorschlaege", "dokumente", "standort", "erstattung", "feedback", "programme", "ueberblick", "gruppe", "archiv", "suche"]);

// ---------- Hauptprogramm ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  // KC-CLUB-KALENDERABO: Handy-Kalender holt die Termine per GET ?kalender=<geheimer Link>
  if (req.method === "GET") {
    const k = new URL(req.url).searchParams.get("kalender") ?? "";
    if (!/^[0-9a-f]{32,96}$/.test(k)) return new Response("Nicht gefunden", { status: 404 });
    try { return await kalenderIcs(k); } catch (e) { console.error(e); return new Response("Fehler", { status: 500 }); }
  }
  if (req.method !== "POST") return json({ error: "POST erwartet" }, 405);
  const t0Anfrage = Date.now(); // KC-CLUB-ANMELDECACHE: Server-Zeit im ping zurückmelden
  let p: any; try { p = await req.json(); } catch { return json({ error: "Ungültige Anfrage" }, 400); }
  const a = String(p?.action || "");
  try {
    // ----- KC-CLUB-NOTBETRIEB (1.52.0): Notfall-Paket bauen und beim Ersatz-Server ablegen (Zeitplaner, alle 15 Min.) -----
    if (a === "notpaket") {
      const { data: geheim } = await db.rpc("kc_communication_get_server_secret", { p_name: "kc_club_cron_secret" });
      if (!geheim || p.cronSecret !== geheim) return json({ error: "Kein Zugang" }, 401);
      // KC-CLUB-NOTBETRIEB-STUFE2 (1.54.0): zuerst nachtragen, was im Notbetrieb geschrieben wurde – dann das Paket bauen
      const nachtrag = await notEingangLauf().catch((e) => ({ ok: false, fehler: txt(String(e?.message || e), 200) }));
      return json({ ...(await notpaketLauf(!!p.erzwingen)), nachtrag });
    }
    // ----- Zeitplaner: Erinnerung am Vortag (ab 9 Uhr) an alle, die nicht abgesagt haben -----
    if (a === "wartung") {
      const { data: geheim } = await db.rpc("kc_communication_get_server_secret", { p_name: "kc_club_cron_secret" });
      if (!geheim || p.cronSecret !== geheim) return json({ error: "Kein Zugang" }, 401);
      // KC-CLUB-FP-UEBERWACHUNG (1.58.0): neue schwerwiegende Einträge im Fehlerprotokoll → Push an den Admin
      await fpUeberwachen().catch((e) => console.error("fp ueberwachung", String(e)));
      await postausgangLauf().catch((e) => console.error("postausgang", String(e))); // KC-CLUB-POSTAUSGANG (1.69.1)
      // Abstimmungen mit abgelaufener Frist beenden (Ergebnis geht an alle)
      const { data: abgelaufen } = await db.from("kc_club_vorschlaege").select("*").eq("status", "offen").lt("frist", jetzt());
      let beendet = 0;
      for (const v of abgelaufen ?? []) if (await vorschlagAbschliessen(v, null)) { beendet++; await protokoll(null, "vorschlag_frist_beendet", { vorschlag: v.id }); }
      const stunde = berlinStunde(new Date());
      const morgen = berlinTag(new Date(Date.now() + 86400000));
      // KC-CLUB-DIENSTERINNERUNG: am Vorabend ab 17 Uhr, nur wer es in den Einstellungen eingeschaltet hat
      let dienst = 0;
      if (stunde >= 17) {
        const { data: an } = await db.from("kc_club_benachrichtigung").select("person_id").eq("bereich", "dienste").or("push.eq.true,email.eq.true");
        const ids = (an ?? []).map((x: any) => x.person_id);
        const { data: sch } = ids.length ? await db.from("kc_dp_plan_published").select("person_id,start_time,end_time,area")
          .eq("org_id", ORG).eq("status", "published").eq("work_date", morgen).in("person_id", ids).order("start_time") : { data: [] as any[] };
        const jePerson = new Map<string, any[]>();
        (sch ?? []).forEach((s: any) => jePerson.set(s.person_id, [...(jePerson.get(s.person_id) ?? []), s]));
        for (const [pid, liste] of jePerson) {
          const { data: neu } = await db.from("kc_club_dienst_erinnerung").upsert({ person_id: pid, datum: morgen }, { onConflict: "person_id,datum", ignoreDuplicates: true }).select("person_id");
          if (!neu?.length) continue;
          const zeiten = liste.map((s: any) => `${String(s.start_time).slice(0, 5)}–${String(s.end_time).slice(0, 5)} Uhr${s.area ? " · " + s.area : ""}`);
          await senden("club_dienst", [pid], {
            titel: "🗓️ Morgen hast du Dienst", kurz: zeiten.join(", "),
            betreff: `Köcheclub Werne – Erinnerung: morgen Dienst ${zeiten[0]}`,
            text: `Hallo,\n\nkurze Erinnerung – morgen hast du Dienst:\n\n${zeiten.map((z) => "🗓️ " + z).join("\n")}\n\nDein Dienstplan in der Köcheclub-App: ${APP_URL}#dienste\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#dienste",
          }, `club-dienst:${pid}:${morgen}`);
          dienst++;
        }
      }
      if (stunde < 9) return json({ ok: true, erinnerungen: 0, beendet, dienst });
      // KC-CLUB-GEBURTSTAG-PUSH: 2 Tage vorher und am Tag – nur freigegebene Geburtstage, nur an Mitglieder mit geöffneter App
      let geb = 0;
      {
        const heute = berlinTag(new Date()), in2 = berlinTag(new Date(Date.now() + 2 * 86400000));
        const [leute, { data: fr }, { data: nutzer }] = await Promise.all([
          aktiveMitglieder(),
          db.from("kc_club_freigaben").select("person_id").eq("bereich", "geburtstag").eq("erlaubt", true),
          db.from("kc_club_zugang").select("person_id").eq("aktiv", true).not("zuletzt_gesehen", "is", null),
        ]);
        const frei = new Set((fr ?? []).map((x: any) => x.person_id)), mitApp = new Set((nutzer ?? []).map((x: any) => x.person_id));
        const trifft = (bd: string, tag: string) => { const md = bd.slice(5, 10), t = tag.slice(5), schalt = new Date(Date.UTC(+tag.slice(0, 4), 1, 29)).getUTCDate() === 29; return md === t || (!schalt && t === "02-28" && md === "02-29"); };
        for (const m of leute as any[]) {
          if (!m.birth_date || !frei.has(m.person_id)) continue;
          for (const [art, tag] of [["heute", heute], ["vorher", in2]] as const) {
            if (!trifft(String(m.birth_date), tag)) continue;
            const { data: neu } = await db.from("kc_club_geburtstag_hinweis").upsert({ person_id: m.person_id, datum: tag, art }, { onConflict: "person_id,datum,art", ignoreDuplicates: true }).select("person_id");
            if (!neu?.length) continue;
            const ziel = leute.map((x) => x.person_id).filter((id) => id !== m.person_id && mitApp.has(id));
            const wtag = fTag.format(new Date(tag + "T12:00:00Z"));
            await senden("club_geburtstag", ziel, art === "heute" ? {
              titel: `🎂 ${m.display_name} hat heute Geburtstag`, kurz: "Möchtest du gratulieren? Hier antippen.",
              betreff: `Köcheclub Werne – ${m.display_name} hat heute Geburtstag`,
              text: `Hallo,\n\nheute hat ${m.display_name} Geburtstag! 🎂\n\nGratulieren in der Köcheclub-App: ${APP_URL}#gratulieren=${m.person_id}\n\nViele Grüße\nKöcheclub Werne`,
              url: `${APP_URL}#gratulieren=${m.person_id}`,
            } : {
              titel: `🎂 In 2 Tagen: ${vorname(m)} hat Geburtstag`, kurz: `${m.display_name} hat am ${wtag} Geburtstag.`,
              betreff: `Köcheclub Werne – ${m.display_name} hat in 2 Tagen Geburtstag`,
              text: `Hallo,\n\nkleine Erinnerung: ${m.display_name} hat übermorgen (${wtag}) Geburtstag. 🎂\n\nViele Grüße\nKöcheclub Werne`,
              url: `${APP_URL}#termine`,
            }, `club-geburtstag:${m.person_id}:${tag}:${art}`);
            geb++;
          }
        }
      }
      // KC-CLUB-NACHFASSEN: 3 Tage vor dem Treffen einmal an alle, die noch nicht zu- oder abgesagt haben
      let nachfass = 0;
      {
        const in3 = berlinTag(new Date(Date.now() + 3 * 86400000));
        const { data: tf } = await db.from("kc_club_treffen").select("*").eq("status", "geplant").eq("art", "treffen").is("nachfass_gesendet_am", null)
          .gte("beginn", new Date().toISOString()).lte("beginn", new Date(Date.now() + 4 * 86400000).toISOString());
        for (const t of tf ?? []) {
          if (berlinTag(new Date(t.beginn)) !== in3) continue;
          const { data: ok } = await db.from("kc_club_treffen").update({ nachfass_gesendet_am: jetzt() }).eq("id", t.id).is("nachfass_gesendet_am", null).select("id");
          if (!ok?.length) continue;
          const { data: an } = await db.from("kc_club_teilnahme").select("person_id").eq("treffen_id", t.id);
          const geantwortet = new Set((an ?? []).map((x: any) => x.person_id));
          const ziel = (await aktiveMitglieder()).map((x) => x.person_id).filter((id) => !geantwortet.has(id));
          if (ziel.length) await senden("club_erinnerung", ziel, {
            titel: "❔ Kommst du?", kurz: `${t.titel} am ${wann(t.beginn)} – bitte kurz zu- oder absagen.`,
            betreff: `Köcheclub Werne – bitte zu- oder absagen: ${t.titel}, ${wann(t.beginn)}`,
            text: `Hallo,

in 3 Tagen ist unser Treffen „${t.titel}“ (${wann(t.beginn, true)}${t.ort ? ", " + t.ort : ""}).

Du hast noch nicht zu- oder abgesagt – bitte kurz in der Köcheclub-App antippen: ${APP_URL}#termine

Viele Grüße
Köcheclub Werne`,
            url: APP_URL + "#termine",
          }, `club-nachfass:${t.id}`);
          await protokoll(null, "treffen_nachfass", { treffen: t.id, empfaenger: ziel.length });
          nachfass++;
        }
      }
      // KC-CLUB-AUFGABEN: Erinnerung am Tag vor der Fälligkeit (nur mitgeteilte Aufgaben, höchstens einmal)
      let aufg = 0;
      {
        const { data: fa } = await db.from("kc_club_aufgaben").select("*").is("erledigt_am", null).is("erinnert_am", null).not("mitgeteilt_am", "is", null).eq("faellig", morgen);
        for (const x of fa ?? []) {
          const { data: ok } = await db.from("kc_club_aufgaben").update({ erinnert_am: jetzt() }).eq("id", x.id).is("erinnert_am", null).select("id");
          if (!ok?.length) continue;
          await senden("club_aufgabe", [x.person_id], {
            titel: "📌 Aufgabe bis morgen", kurz: x.text,
            betreff: `Köcheclub Werne – Erinnerung: Aufgabe bis morgen`,
            text: `Hallo,\n\nkurze Erinnerung – bis morgen (${tagText(morgen)}) ist deine Aufgabe fällig:\n\n📌 ${x.text}\n\nErledigt? Abhaken in der Köcheclub-App: ${APP_URL}#protokolle\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#protokolle",
          }, `club-aufgabe-erinnerung:${x.id}`);
          aufg++;
        }
      }
      const { data: ts } = await db.from("kc_club_treffen").select("*").eq("status", "geplant").eq("art", "treffen").is("erinnerung_gesendet_am", null)
        .gte("beginn", new Date().toISOString()).lte("beginn", new Date(Date.now() + 2 * 86400000).toISOString());
      let n = 0;
      for (const t of ts ?? []) {
        if (berlinTag(new Date(t.beginn)) !== morgen) continue;
        const { data: ok } = await db.from("kc_club_treffen").update({ erinnerung_gesendet_am: jetzt() }).eq("id", t.id).is("erinnerung_gesendet_am", null).select("id");
        if (!ok?.length) continue;
        const { data: abs } = await db.from("kc_club_teilnahme").select("person_id").eq("treffen_id", t.id).eq("antwort", "nein");
        const nein = new Set((abs ?? []).map((x: any) => x.person_id));
        const ziel = (await aktiveMitglieder()).map((x) => x.person_id).filter((id) => !nein.has(id));
        const g = t.gastgeber_person_id ? (await personen([t.gastgeber_person_id])).get(t.gastgeber_person_id) : null;
        const ort = t.ort || (g ? `bei ${vorname(g)}` : "");
        await senden("club_erinnerung", ziel, {
          betreff: `Köcheclub Werne – Erinnerung: morgen ${t.titel}, ${fZeit.format(new Date(t.beginn))} Uhr`,
          titel: "⏰ Morgen: " + t.titel, kurz: `${wann(t.beginn)}${ort ? " – " + ort : ""}`,
          text: `Hallo,\n\nkurze Erinnerung an unser Treffen morgen:\n\n📅 ${wann(t.beginn, true)}${ort ? "\n📍 " + ort : ""}\n\nZu- oder absagen in der Köcheclub-App: ${APP_URL}#termine\n\nViele Grüße\nKöcheclub Werne`,
          url: APP_URL + "#termine",
        }, `club-erinnerung:${t.id}`);
        await protokoll(null, "treffen_erinnerung", { treffen: t.id, empfaenger: ziel.length });
        n++;
      }
      // KC-CLUB-TERMINANFRAGE (0.92.0): am Vortag ab 9 Uhr – Zugesagte (Ja/Vielleicht) und Absender erinnern,
      // wer noch nicht geantwortet hat, bekommt „bitte noch antworten“
      let anfr = 0;
      if (stunde >= 9) {
        const { data: fa } = await db.from("kc_club_terminanfragen").select("*").eq("status", "offen").is("erinnerung_gesendet_am", null)
          .gte("beginn", new Date().toISOString()).lte("beginn", new Date(Date.now() + 2 * 86400000).toISOString());
        for (const x of fa ?? []) {
          if (berlinTag(new Date(x.beginn)) !== morgen) continue;
          const { data: ok } = await db.from("kc_club_terminanfragen").update({ erinnerung_gesendet_am: jetzt() }).eq("id", x.id).is("erinnerung_gesendet_am", null).select("id");
          if (!ok?.length) continue;
          const { data: e } = await db.from("kc_club_terminanfrage_empfaenger").select("person_id,antwort").eq("anfrage_id", x.id);
          const dabei = [x.erstellt_von, ...(e ?? []).filter((y: any) => y.antwort === "ja" || y.antwort === "vielleicht").map((y: any) => y.person_id)];
          const offen = (e ?? []).filter((y: any) => !y.antwort).map((y: any) => y.person_id);
          const ort = x.ort ? "\n📍 " + x.ort : "";
          await senden("club_erinnerung", dabei, {
            betreff: `Köcheclub Werne – Erinnerung: morgen ${x.anlass}, ${fZeit.format(new Date(x.beginn))} Uhr`,
            titel: "⏰ Morgen: " + x.anlass, kurz: `${wann(x.beginn)}${x.ort ? " – " + x.ort : ""}`,
            text: `Hallo,\n\nkurze Erinnerung an morgen:\n\n📌 ${x.anlass}\n📅 ${anfrageWann(x)}${ort}\n\nDetails in der Köcheclub-App: ${APP_URL}#termine\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#termine",
          }, `club-terminanfrage-erinnerung:${x.id}`);
          if (offen.length) await senden("club_erinnerung", offen, {
            betreff: `Köcheclub Werne – bitte noch antworten: ${x.anlass} morgen`,
            titel: "📨 Bitte noch antworten", kurz: `${x.anlass} – ${wann(x.beginn)}`,
            text: `Hallo,\n\ndu hast auf diese Terminanfrage noch nicht geantwortet – sie ist schon morgen:\n\n📌 ${x.anlass}\n📅 ${anfrageWann(x)}${ort}\n\nJa, Vielleicht oder Nein in der Köcheclub-App: ${APP_URL}#termine\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#termine",
          }, `club-terminanfrage-nachfass:${x.id}`);
          anfr++;
        }
      }
      // KC-CLUB-PRIVATTERMIN (1.0.0): Erinnerung an private Einträge (nur an die Person selbst)
      let privErinnert = 0;
      {
        const { data: pe } = await db.from("kc_club_privattermine").select("id,person_id,titel,beginn,ort,erinnerung_min,ganztaegig").gt("erinnerung_min", 0).is("erinnert_am", null)
          .gte("beginn", new Date(Date.now() - 3600000).toISOString()).lte("beginn", new Date(Date.now() + 2 * 86400000 + 3600000).toISOString());
        for (const x of pe ?? []) {
          if (new Date(x.beginn).getTime() - x.erinnerung_min * 60000 > Date.now()) continue;
          const { data: ok } = await db.from("kc_club_privattermine").update({ erinnert_am: jetzt() }).eq("id", x.id).is("erinnert_am", null).select("id");
          if (!ok?.length) continue;
          await senden("club_erinnerung", [x.person_id], {
            titel: `⏰ ${x.titel}`, kurz: `${x.ganztaegig ? fTag.format(new Date(x.beginn)) + " (ganztägig)" : wann(x.beginn)}${x.ort ? " – " + x.ort : ""}`,
            betreff: `Köcheclub-App – Erinnerung: ${x.titel}`, text: `Erinnerung an deinen privaten Termin:\n\n🔒 ${x.titel}\n📅 ${x.ganztaegig ? fTagLang.format(new Date(x.beginn)) + " (ganztägig)" : wann(x.beginn, true)}${x.ort ? "\n📍 " + x.ort : ""}\n\n${APP_URL}#termine`,
            url: APP_URL + "#termine",
          }, `club-privat:${x.id}:${x.beginn}`);
          privErinnert++;
        }
        // KC-CLUB-WIEDERHOLUNG: Reihen – nächsten fälligen Termin erinnern, erinnert_bis merkt sich, bis wohin schon erinnert wurde
        const { data: pr } = await db.from("kc_club_privattermine").select("*").gt("erinnerung_min", 0).neq("wiederholung", "keine").limit(500);
        for (const r of pr ?? []) {
          const faellig = wiederholungen(r.beginn, r.wiederholung, new Date(Date.now() - 3600000), new Date(Date.now() + r.erinnerung_min * 60000 + 60000), r.wiederholung_bis, r.ausnahmen || [], 5)
            .filter((b) => new Date(b).getTime() - r.erinnerung_min * 60000 <= Date.now() && (!r.erinnert_bis || b > r.erinnert_bis));
          const b = faellig[faellig.length - 1]; if (!b) continue;
          const { data: ok } = await db.from("kc_club_privattermine").update({ erinnert_bis: b }).eq("id", r.id).or(`erinnert_bis.is.null,erinnert_bis.lt.${b}`).select("id");
          if (!ok?.length) continue;
          await senden("club_erinnerung", [r.person_id], {
            titel: `⏰ ${r.titel}`, kurz: `${r.ganztaegig ? fTag.format(new Date(b)) + " (ganztägig)" : wann(b)}${r.ort ? " – " + r.ort : ""}`,
            betreff: `Köcheclub-App – Erinnerung: ${r.titel}`, text: `Erinnerung an deinen privaten Termin:\n\n🔒 ${r.titel} (🔁 ${WDH_TEXT[r.wiederholung] || ""})\n📅 ${r.ganztaegig ? fTagLang.format(new Date(b)) + " (ganztägig)" : wann(b, true)}${r.ort ? "\n📍 " + r.ort : ""}\n\n${APP_URL}#termine`,
            url: APP_URL + "#termine",
          }, `club-privat:${r.id}:${b}`);
          privErinnert++;
        }
      }
      // KC-CLUB-RUHEZEIT (0.98.0): nach „Nicht stören“ EINE Sammelmeldung mit dem, was ausgefallen ist
      let ruheMeldungen = 0;
      {
        const { data: vp } = await db.from("kc_club_person_einstellung").select("person_id,wert").eq("schluessel", "ruhezeit_verpasst");
        const offen = (vp ?? []).filter((x: any) => (x.wert?.anzahl || 0) > 0);
        if (offen.length) {
          const { data: rz } = await db.from("kc_club_person_einstellung").select("person_id,wert").eq("schluessel", "ruhezeit").in("person_id", offen.map((x: any) => x.person_id));
          const ruht = new Set((rz ?? []).filter((x: any) => inRuhezeit(x.wert)).map((x: any) => x.person_id));
          for (const x of offen) {
            if (ruht.has(x.person_id)) continue;
            await db.from("kc_club_person_einstellung").delete().eq("person_id", x.person_id).eq("schluessel", "ruhezeit_verpasst");
            const n = x.wert.anzahl, t = (x.wert.titel || []).slice(0, 3).join(" · ");
            await routerSenden("club_nachricht_push", [x.person_id], { titel: `🌅 Während „Nicht stören“: ${n} ${n === 1 ? "Meldung" : "Meldungen"}`, kurz: t || "Alles in der Köcheclub-App",
              betreff: "Köcheclub Werne – verpasste Meldungen", text: `Während „Nicht stören“ kamen ${n} Meldungen: ${t}\n\n${APP_URL}`, url: APP_URL }, `club-ruhezeit:${x.person_id}:${Date.now()}`);
            ruheMeldungen++;
          }
        }
      }
      // KC-CLUB-STANDORT (0.92.0): abgelaufene Freigaben löschen – Koordinaten nicht länger als nötig speichern
      const { data: stWeg } = await db.from("kc_club_standort_live").delete().lt("bis", jetzt()).select("id");
      // KC-CLUB-FOTOALBUM: Papierkorb nach 30 Tagen endgültig leeren (Dateien entfernen → Speicher wird frei)
      let fotosEntfernt = 0;
      {
        const { data: alt } = await db.from("kc_club_fotos").select("id,attachment_id,vorschau_id")
          .lt("geloescht_am", new Date(Date.now() - PAPIERKORB_TAGE * 86400000).toISOString()).limit(200);
        for (const f of alt ?? []) {
          await db.from("kc_club_fotos").delete().eq("id", f.id);
          await dateienEntfernen([f.attachment_id, f.vorschau_id]);
          fotosEntfernt++;
        }
        if (fotosEntfernt) await protokoll(null, "fotos_endgueltig_entfernt", { anzahl: fotosEntfernt });
      }
      // KC-CLUB-ARCHIV: Papierkorb nach 30 Tagen endgültig leeren (Dokumente, dann leere gelöschte Ordner)
      let archivEntfernt = 0;
      {
        const alt = new Date(Date.now() - PAPIERKORB_TAGE * 86400000).toISOString();
        const { data: altOrdner } = await db.from("kc_club_archiv_ordner").select("id").lt("geloescht_am", alt).limit(50);
        const aoIds = (altOrdner ?? []).map((o: any) => o.id);
        const [{ data: d1 }, { data: d2 }] = await Promise.all([
          db.from("kc_club_archiv_dokumente").select("id,attachment_id").lt("geloescht_am", alt).limit(200),
          aoIds.length ? db.from("kc_club_archiv_dokumente").select("id,attachment_id").in("ordner_id", aoIds).limit(500) : Promise.resolve({ data: [] as any[] }),
        ]);
        const weg = new Map([...(d1 ?? []), ...(d2 ?? [])].map((d: any) => [d.id, d]));
        for (const d of weg.values()) {
          await db.from("kc_club_archiv_dokumente").delete().eq("id", d.id);
          await dateienEntfernen([d.attachment_id]);
          archivEntfernt++;
        }
        if (aoIds.length) await db.from("kc_club_archiv_ordner").delete().in("id", aoIds);
        if (archivEntfernt || aoIds.length) await protokoll(null, "archiv_endgueltig_entfernt", { dokumente: archivEntfernt, ordner: aoIds.length });
      }
      const leiheErinnert = await leihErinnern().catch((e) => { console.error("leihe erinnern", String(e)); return 0; }); // KC-CLUB-LEIHEN
      const boerse = await boerseWartung().catch((e) => { console.error("boerse wartung", String(e)); return null; }); // KC-CLUB-BOERSE
      return json({ ok: true, erinnerungen: n, beendet, dienst, geb, aufg, nachfass, fotosEntfernt, archivEntfernt, anfragenErinnert: anfr, standorteGeloescht: (stWeg ?? []).length, ruheMeldungen, privErinnert, leiheErinnert, boerse });
    }

    // ----- KC-CLUB-ZUGANG-SELBST: Link verloren → neuen Link an die hinterlegte Mail-Adresse (ohne Anmeldung) -----
    // Antwort immer gleich (verrät nicht, ob die Adresse existiert); höchstens 1× je 15 Min. je Person, 20× je Stunde insgesamt.
    if (a === "zugang_anfordern") {
      const mail = txt(p.email, 200).toLowerCase();
      const text = "Wenn die Adresse bei uns hinterlegt ist, kommt gleich eine Mail mit deinem neuen Link.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) throw new Fehler("Bitte eine gültige E-Mail-Adresse eingeben.");
      const seit15 = new Date(Date.now() - 15 * 60000).toISOString(), seit60 = new Date(Date.now() - 3600000).toISOString();
      const { count: gesamt } = await db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).eq("aktion", "zugang_angefordert").gte("zeit", seit60);
      if ((gesamt ?? 0) >= 20) return json({ ok: true, text });
      const { data: leute } = await db.from("kc_core_people").select("person_id,email,active,org_id").eq("active", true).eq("org_id", ORG).ilike("email", mail);
      const pe = (leute ?? []).find((x: any) => String(x.email || "").trim().toLowerCase() === mail);
      if (!pe || String(pe.person_id).startsWith("KC-P-TEST")) { await protokoll(null, "zugang_angefordert", { treffer: false }); return json({ ok: true, text }); }
      const { count: kuerzlich } = await db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).eq("aktion", "zugang_angefordert").eq("person_id", pe.person_id).gte("zeit", seit15);
      if ((kuerzlich ?? 0) > 0) return json({ ok: true, text });
      const token = zufall();
      await db.from("kc_club_zugang").upsert({ person_id: pe.person_id, token_hash: await sha256(token), aktiv: true, erstellt_am: jetzt(), erstellt_von: pe.person_id }); anmeldungenVergessen(); // KC-CLUB-ANMELDECACHE: Änderung sofort wirksam
      const link = `${APP_URL}?k=${token}`;
      const versand = await routerSenden("club_nachricht_mail", [pe.person_id], {
        titel: "🔑 Dein Link zur Köcheclub-App", kurz: "Hier ist dein neuer persönlicher Link.",
        betreff: "Köcheclub Werne – dein persönlicher Link zur App",
        text: `Hallo,\n\nhier ist dein neuer persönlicher Link zur Köcheclub-App:\n\n${link}\n\nBitte antippen (am besten im Browser Chrome öffnen). Danach kannst du die App über ⋮ → „App installieren“ auf den Startbildschirm legen.\n\nDer Link ist nur für dich – bitte nicht weitergeben. Ein früherer Link gilt ab jetzt nicht mehr.\nDu hast keinen neuen Link angefordert? Dann bitte kurz Hansi Bescheid geben.\n\nViele Grüße\nKöcheclub Werne`,
        url: link,
      }, `club-zugang:${pe.person_id}:${Date.now()}`);
      await db.rpc("kc_club_zugangslinks_schwaerzen").then(() => {}, () => {}); // KC-CLUB-LINKSCHUTZ: Schlüssel nicht im Mail-Speicher lassen
      await protokoll(pe.person_id, "zugang_angefordert", { treffer: true, versand });
      return json({ ok: true, text });
    }

    // ----- KC-CLUB-FEHLERPROTOKOLL (0.93.0): Fehler VOR der Anmeldung (Link fehlt/ungültig) – anonym, mit Geräte-Kennung -----
    if (a === "fehler_anonym") {
      const geraet = txt(p.geraet, 40).replace(/[^A-Za-z0-9-]/g, "");
      const liste = (Array.isArray(p.eintraege) ? p.eintraege : []).slice(0, FP_MAX_JE_SENDUNG);
      if (!geraet || !liste.length) return json({ ok: true, gespeichert: 0 });
      const seit = new Date(Date.now() - 3600000).toISOString();
      const [{ count: gesamt }, { count: vomGeraet }] = await Promise.all([
        db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).like("aktion", "fehler_anonym%").gte("zeit", seit),
        db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).like("aktion", "fehler_anonym%").eq("details->>geraet", geraet).gte("zeit", seit),
      ]);
      const platz = Math.max(0, Math.min(FP_ANONYM_JE_STUNDE - (gesamt ?? 0), FP_GERAET_JE_STUNDE - (vomGeraet ?? 0), liste.length));
      if (!platz) return json({ ok: true, gespeichert: 0 });
      const ua = txt(req.headers.get("user-agent"), 200), version = txt(req.headers.get("x-club-version"), 20);
      const neu = liste.slice(0, platz);
      // App startet gar nicht / Hilferuf ohne Anmeldung → Admins sofort Bescheid geben (höchstens 1× am Tag je Gerät)
      const alarm = neu.find((e: any) => ["start_kaputt", "hilferuf_anonym"].includes(fpArt(e?.art)));
      let schonGemeldet = true;
      if (alarm) {
        const { count: c } = await db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).eq("aktion", "fehler_anonym_admin_benachrichtigt")
          .eq("details->>geraet", geraet).gte("zeit", new Date(Date.now() - 86400000).toISOString());
        schonGemeldet = (c ?? 0) > 0;
      }
      await db.from("kc_club_protokoll").insert(neu.map((e: any) => ({ person_id: null, aktion: "fehler_anonym_" + fpArt(e?.art), details: { ...fpSauber(e), geraet, ua, version } })));
      if (alarm && !schonGemeldet) {
        await db.from("kc_club_protokoll").insert({ person_id: null, aktion: "fehler_anonym_admin_benachrichtigt", details: { geraet } });
        const { data: admins } = await db.from("kc_club_rollen").select("person_id").eq("ist_admin", true);
        const was = fpArt(alarm.art) === "start_kaputt" ? "Die Club-App startet bei jemandem gar nicht" : "Jemand meldet ohne Anmeldung ein Problem";
        await senden("club_nachricht", (admins ?? []).map((x: any) => x.person_id), {
          titel: "🆘 " + was, kurz: `${txt(alarm.text, 120)} · Gerät ${geraet}`,
          betreff: `Köcheclub-App: ${was}`,
          text: `Hallo,\n\n${was}.\n\n${txt(alarm.text, 300)}\nGerät-Kennung: ${geraet}\nHandy/Browser: ${ua}\nApp-Version: ${version || "?"}\n\nEinzelheiten: Admin-Zentrale → 🩺 Fehlerprotokoll\n${APP_URL}\n\nViele Grüße\nKöcheclub-App`,
          url: APP_URL,
        }, `club-fehler-alarm:${geraet}:${berlinTag(new Date())}`).catch(() => null);
      }
      return json({ ok: true, gespeichert: platz });
    }

    const tAnm = Date.now();
    const ich = await anmelden(req);
    const anmeldungMs = Date.now() - tAnm;
    return await aktionAusfuehren(a, p, ich, req, t0Anfrage, anmeldungMs);
  } catch (e) {
    if (e instanceof Fehler) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

// KC-CLUB-NOTBETRIEB (1.52.0): alle angemeldeten Aktionen in einer Funktion – so kann der Server dieselben Antworten
// auch intern (nur lesend) für das Notfall-Paket berechnen. Inhalt unverändert aus Deno.serve übernommen.
async function aktionAusfuehren(a: string, p: any, ich: Ich, req: Request, t0Anfrage: number, anmeldungMs: number): Promise<Response> {
    switch (a) {
      case "init": {
        const [naechstes, { data: teil }, mitglieder] = await Promise.all([
          treffenListe(ich, true),
          db.from("kc_communication_thread_participants").select("thread_id,last_read_at").eq("person_id", ich.person_id).is("hidden_at", null),
          aktiveMitglieder(),
        ]);
        let ungelesen = 0, ungelesenLaut = 0;
        const { data: stummE } = await db.from("kc_club_person_einstellung").select("wert").eq("person_id", ich.person_id).eq("schluessel", "stumm").maybeSingle();
        // KC-CLUB-SCHNELLSTART-SERVER (1.16.0): alle Unterhaltungen gleichzeitig zählen statt nacheinander (spart je Chat eine Runde)
        const zahlen = await Promise.all((teil ?? []).map(async (t: any) => {
          let q = db.from("kc_communication_messages").select("id", { count: "exact", head: true }).eq("thread_id", t.thread_id).neq("sender_person_id", ich.person_id);
          if (t.last_read_at) q = q.gt("created_at", t.last_read_at);
          const { count } = await q; return { t, n: count ?? 0 };
        }));
        for (const { t, n } of zahlen) {
          ungelesen += n;
          if (!stummJetzt(stummE?.wert, t.thread_id)) ungelesenLaut += n; // KC-CLUB-STUMM: stumme Chats ohne Ton
        }
        const { data: pk } = await db.rpc("kc_communication_get_server_secret", { p_name: "kc_communication_vapid_public_key" });
        const meinStatus = (await statusMap([ich.person_id])).get(ich.person_id) ?? { status: "verfuegbar", hinweis: null, bis: null };
        // offene Abstimmungen, bei denen ich noch nicht abgestimmt habe
        const { data: abst } = await db.from("kc_club_vorschlaege").select("id").eq("status", "offen").eq("art", "abstimmung");
        const { data: meineSt } = (abst ?? []).length ? await db.from("kc_club_stimmen").select("vorschlag_id").eq("person_id", ich.person_id).in("vorschlag_id", (abst ?? []).map((x: any) => x.id)) : { data: [] as any[] };
        const offeneAbstimmungen = (abst ?? []).length - (meineSt ?? []).length;
        const { data: nd } = await db.from("kc_dp_plan_published").select("work_date,start_time,end_time,area").eq("org_id", ORG).eq("status", "published")
          .eq("person_id", ich.person_id).gte("work_date", berlinTag(new Date())).order("work_date").order("start_time").limit(1);
        const naechsterDienst = nd?.[0] ? { datum: nd[0].work_date, start: String(nd[0].start_time).slice(0, 5), ende: String(nd[0].end_time).slice(0, 5), bereich: nd[0].area } : null;
        const [{ data: wahl }, { data: pm }] = await Promise.all([
          db.from("kc_club_benachrichtigung").select("bereich,push,email").eq("person_id", ich.person_id),
          db.from("kc_core_people").select("email").eq("person_id", ich.person_id).maybeSingle(),
        ]);
        // Geburtstage heute – nur freigegebene (nur Tag/Monat; 29.02. wird in Nicht-Schaltjahren am 28.02. gefeiert)
        const heuteMd = berlinTag(new Date()).slice(5), schalt = new Date(Number(berlinTag(new Date()).slice(0, 4)), 1, 29).getDate() === 29;
        const geb = await geburtstageSichtbar(ich);
        const geburtstageHeute = geb.filter((g) => g.md === heuteMd || (!schalt && heuteMd === "02-28" && g.md === "02-29"))
          .map((g) => ({ person_id: g.person_id, name: g.name, vorname: g.vorname }));
        const { data: gfs } = await db.from("kc_club_freigaben").select("bereich,erlaubt").eq("person_id", ich.person_id).in("bereich", ["geburtstag", "runder_geburtstag"]);
        const gf = (gfs ?? []).find((x: any) => x.bereich === "geburtstag"), rgf = (gfs ?? []).find((x: any) => x.bereich === "runder_geburtstag");
        const hatGeburtstag = !!(mitglieder.find((m: any) => m.person_id === ich.person_id) as any)?.birth_date;
        // KC-CLUB-AUFGABEN / KC-CLUB-PROTOKOLLE: meine offenen Aufgaben, ungelesene Protokolle
        let meineAufgaben: any[] = [], protokolleUngelesen = 0;
        if (ich.protokolle) {
          const [{ data: au }, { data: pv }] = await Promise.all([
            db.from("kc_club_aufgaben").select("id,text,faellig,protokoll_id").eq("person_id", ich.person_id).is("erledigt_am", null).order("faellig", { nullsFirst: false }).limit(30),
            db.from("kc_club_sitzungsprotokolle").select("id,status,version").eq("status", "veroeffentlicht").gte("veroeffentlicht_am", new Date(Date.now() - 180 * 86400000).toISOString()),
          ]);
          const pids = [...new Set((au ?? []).map((x: any) => x.protokoll_id).filter(Boolean))];
          const { data: ap } = pids.length ? await db.from("kc_club_sitzungsprotokolle").select("id,status,titel").in("id", pids) : { data: [] as any[] };
          const apm = new Map((ap ?? []).map((x: any) => [x.id, x]));
          meineAufgaben = (au ?? []).filter((x: any) => !x.protokoll_id || (apm.get(x.protokoll_id) as any)?.status === "veroeffentlicht")
            .map((x: any) => ({ id: x.id, text: x.text, faellig: x.faellig, protokoll: x.protokoll_id ? (apm.get(x.protokoll_id) as any)?.titel : null }));
          const vids = (pv ?? []).map((x: any) => x.id);
          const { data: gl } = vids.length ? await db.from("kc_club_sitzungsprotokoll_gelesen").select("protokoll_id,version").eq("person_id", ich.person_id).in("protokoll_id", vids) : { data: [] as any[] };
          protokolleUngelesen = (pv ?? []).filter((x: any) => !(gl ?? []).some((g: any) => g.protokoll_id === x.id && g.version >= x.version)).length;
        }
        const { data: kf } = await db.from("kc_club_freigaben").select("bereich,erlaubt").eq("person_id", ich.person_id).like("bereich", "kontakt_%");
        // KC-CLUB-TERMINFINDUNG: offene Umfragen, bei denen ich noch nichts angekreuzt habe
        const { data: tu } = await db.from("kc_club_terminumfragen").select("id,titel").eq("status", "offen");
        let terminfindungOffen: any[] = [];
        if ((tu ?? []).length) {
          const { data: to } = await db.from("kc_club_terminumfrage_optionen").select("id,umfrage_id").in("umfrage_id", (tu ?? []).map((x: any) => x.id));
          const { data: ta } = (to ?? []).length ? await db.from("kc_club_terminumfrage_antworten").select("option_id").eq("person_id", ich.person_id).in("option_id", (to ?? []).map((x: any) => x.id)) : { data: [] as any[] };
          const beantwortet = new Set((ta ?? []).map((x: any) => (to ?? []).find((o: any) => o.id === x.option_id)?.umfrage_id));
          terminfindungOffen = (tu ?? []).filter((x: any) => !beantwortet.has(x.id)).map((x: any) => ({ id: x.id, titel: x.titel }));
        }
        const [{ data: nf }, { data: kab }, wartung, { data: pe }, pwFristen, starts, eiFristen, { count: fbAnzahl }, anrufAntw] = await Promise.all([
          db.from("kc_club_notfall").select("name,telefon,beziehung").eq("person_id", ich.person_id).maybeSingle(),
          db.from("kc_club_kalender_abo").select("erstellt_am,zuletzt_abgerufen").eq("person_id", ich.person_id).maybeSingle(),
          wartungLesen(),
          db.from("kc_club_person_einstellung").select("schluessel,wert").eq("person_id", ich.person_id),
          pinnwandFristen().catch(() => ({ ...PINNWAND_FRISTEN_STANDARD, geaendertAm: null })),
          // KC-CLUB-EINSTIEG: an wie vielen Tagen die App genutzt wurde (Start je Sitzung = diagnose_start) und seit wann –
          // Tage statt Starts, damit mehrfaches Öffnen am ersten Tag nicht schon Tipps auslöst
          db.from("kc_club_protokoll").select("zeit").eq("person_id", ich.person_id).eq("aktion", "diagnose_start").order("zeit").limit(1000),
          einstiegFristen().catch(() => ({ ...EINSTIEG_STANDARD, geaendertAm: null })),
          // KC-CLUB-EINSTIEG-FEEDBACK (0.73.0): schon Feedback abgegeben? Dann nicht mehr danach fragen
          db.from("kc_club_feedback").select("person_id", { count: "exact", head: true }).eq("person_id", ich.person_id),
          anrufAntworten().catch(() => ({ texte: ANRUF_ANTWORTEN_STANDARD, geaendertAm: null })),
        ]);
        const einstellungen = Object.fromEntries((pe ?? []).map((x: any) => [x.schluessel, x.wert]));
        const communicator = await communicatorStatus(ich).catch(() => null);
        const kontaktFreigabe = Object.fromEntries(KONTAKT_FELDER.map((f) => [f, !!(kf ?? []).find((x: any) => x.bereich === "kontakt_" + f)?.erlaubt]));
        const benachrichtigung = Object.fromEntries(BEREICHE.map((b) => { const x: any = (wahl ?? []).find((y: any) => y.bereich === b); return [b, x ? { push: x.push, email: x.email } : STANDARD_WAHL[b]]; }));
        return json({ ich, status: meinStatus, server: SERVER_VERSION, ungelesen, ungelesenLaut, offeneAbstimmungen, naechsterDienst, benachrichtigung, hatMail: !!pm?.email, geburtstageHeute, geburtstagFreigabe: !!gf?.erlaubt, runderGeburtstagFreigabe: !!rgf?.erlaubt, hatGeburtstag, kontaktFreigabe, terminfindungOffen, wartung, communicator, notfall: nf ?? null, einstellungen, kalenderAbo: kab ?? null, meineAufgaben, protokolleUngelesen, naechstesTreffen: naechstes[0] ?? null, mitgliederAnzahl: mitglieder.length, vapidPublicKey: pk || null, pinnwandFristen: pwFristen, anrufAntworten: anrufAntw,
          einstieg: { tage: new Set((starts.data ?? []).map((x: any) => new Date(x.zeit).toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }))).size,
            ersterStart: starts.data?.[0]?.zeit ?? null, feedbackAbgegeben: (fbAnzahl ?? 0) > 0, fristen: eiFristen,
            // KC-CLUB-GERAETE-TIPP: wohin der Link ginge – nur teilweise (z. B. „h…@web.de“)
            mailMaske: pm?.email ? String(pm.email).replace(/^(.)[^@]*(@.*)$/, "$1…$2") : null } });
      }

      case "mitglieder": {
        const [leute, { data: rollen }, { data: zug }, { data: push }, st, { data: tel }, { data: hfr }] = await Promise.all([
          aktiveMitglieder(), db.from("kc_club_rollen").select("*"), db.from("kc_club_zugang").select("person_id,aktiv,zuletzt_gesehen"),
          db.from("kc_member_push_subscriptions").select("person_id").eq("active", true), statusMap(undefined, true),
          db.from("kc_core_people").select("person_id").eq("active", true).eq("org_id", ORG).not("phone", "is", null).neq("phone", ""),
          db.from("kc_club_freigaben").select("person_id").eq("bereich", "kontakt_handy").eq("erlaubt", true),
        ]);
        // KC-CLUB-ZUSTELLWAHL: wie ist jemand erreichbar? (nur ja/nein – keine Nummern/Adressen)
        const hatTel = new Set((tel ?? []).map((x: any) => x.person_id)), handyFrei = new Set((hfr ?? []).map((x: any) => x.person_id));
        const r = new Map((rollen ?? []).map((x: any) => [x.person_id, x]));
        const z = new Map((zug ?? []).map((x: any) => [x.person_id, x]));
        const ps = new Set((push ?? []).map((x: any) => x.person_id));
        const aemter = [...new Set((rollen ?? []).flatMap((x: any) => x.aemter || []))].sort();
        const ichZeige = (await onlineZeigenMap([ich.person_id])).get(ich.person_id) !== false, on = ichZeige ? await onlineJetzt() : new Set<string>();
        // KC-CLUB-KREISE (0.60.0): Farbe der Namenskreise. „heute da“ und „verborgen“ folgen derselben Regel wie online
        // (wer sich verbirgt, sieht auch andere nicht). Zustellfehler (rot) nur für den Admin.
        const zd = await zuletztDaMap(ich, leute.map((m) => m.person_id)); // KC-CLUB-ZULETZT-DA (1.20.0)
        const zeigen = await onlineZeigenMap(), tag = (d: string | Date) => new Date(d).toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }), heute = tag(new Date());
        const fehler = new Map<string, string>(), ansicht = new Map<string, string>();
        if (ich.admin) {
          // KC-CLUB-ANSICHT: wer nutzt welche Ansicht (nur für den Admin – zeigt, ob die einfache Ansicht angenommen wird)
          const { data: an } = await db.from("kc_club_person_einstellung").select("person_id,wert").eq("schluessel", "ansicht");
          for (const x of an ?? []) if ((x as any).wert?.gewaehlt) ansicht.set((x as any).person_id, (x as any).wert.art === "erweitert" ? "erweitert" : "einfach");
          // KC-CLUB-ZUSTELLFEHLER (1.49.2): rot nur, wenn nach dem Fehler auf demselben Weg nichts mehr angekommen ist
          // (vorher blieb z. B. ein einzelner alter Push-Fehler 7 Tage rot, obwohl danach alles ankam)
          const seit = new Date(Date.now() - 7 * 86400000).toISOString();
          const [{ data: fx }, { data: ok }] = await Promise.all([
            db.from("kc_communication_requests").select("recipient_refs,channel,status,created_at").eq("source_program", "kc-club").in("status", COMM_FEHLER).gte("created_at", seit).limit(500),
            db.from("kc_communication_requests").select("recipient_refs,channel,created_at").eq("source_program", "kc-club").in("status", COMM_OK).gte("created_at", seit).order("created_at", { ascending: false }).limit(2000),
          ]);
          const perMail = new Map(leute.filter((m) => m.email).map((m) => [String(m.email).toLowerCase(), m.person_id]));
          const wer = (r: any) => r?.personId ?? perMail.get(String(r?.email ?? "").toLowerCase());
          const zuletztOk = new Map<string, string>(); // person|kanal → letzte Zustellung
          for (const x of ok ?? []) for (const r of (Array.isArray(x.recipient_refs) ? x.recipient_refs : []) as any[]) {
            const id = wer(r), k = id + "|" + x.channel; if (id && !(zuletztOk.get(k)! >= x.created_at)) zuletztOk.set(k, x.created_at);
          }
          for (const x of fx ?? []) for (const r of (Array.isArray(x.recipient_refs) ? x.recipient_refs : []) as any[]) {
            const id = wer(r); if (!id || fehler.has(id) || zuletztOk.get(id + "|" + x.channel)! > x.created_at) continue;
            fehler.set(id, x.channel === "push" ? "Push kam nicht an (letzte 7 Tage)" : "E-Mail kam nicht an (letzte 7 Tage)");
          }
        }
        return json({
          aemter, onlineSichtbar: ichZeige,
          mitglieder: leute.map((m) => ({
            person_id: m.person_id, name: m.display_name, vorname: vorname(m),
            vorstand: !!(r.get(m.person_id) as any)?.ist_vorstand, aemter: (r.get(m.person_id) as any)?.aemter ?? [], admin: !!(r.get(m.person_id) as any)?.ist_admin,
            status: st.get(m.person_id) ?? null, online: on.has(m.person_id) && m.person_id !== ich.person_id, zuletztDa: zd.get(m.person_id) ?? null,
            verborgen: m.person_id !== ich.person_id && (!ichZeige || zeigen.get(m.person_id) === false),
            heute: ichZeige && (zeigen.get(m.person_id) !== false || m.person_id === ich.person_id) && !!(z.get(m.person_id) as any)?.zuletzt_gesehen && tag((z.get(m.person_id) as any).zuletzt_gesehen) === heute,
            wege: { push: ps.has(m.person_id), mail: !!m.email, whatsapp: hatTel.has(m.person_id) && (ich.admin || m.person_id === ich.person_id || (ich.kontakte && handyFrei.has(m.person_id))) },
            // für alle nur grob: in den letzten 14 Tagen in der App gewesen (genaue Zeit nur für den Admin)
            aktiv: !!(z.get(m.person_id) as any)?.zuletzt_gesehen && Date.now() - new Date((z.get(m.person_id) as any).zuletzt_gesehen).getTime() < 14 * 86400000,
            ...(ich.admin ? { kontakte: (r.get(m.person_id) as any)?.kontakte_sehen !== false, protokolle: (r.get(m.person_id) as any)?.protokolle_lesen !== false, app: !!(z.get(m.person_id) as any)?.aktiv, zuletzt: (z.get(m.person_id) as any)?.zuletzt_gesehen ?? null, push: ps.has(m.person_id), mail: !!m.email, fehler: fehler.get(m.person_id) ?? null,
              unerreichbar: !ps.has(m.person_id) && !m.email, /* kein Push, keine E-Mail: Hinweis statt roter Kreis */ ansicht: ansicht.get(m.person_id) ?? null } : {}),
          })),
        });
      }

      case "status_setzen": {
        const status = String(p.status || "");
        if (!STATUS.includes(status)) throw new Fehler("Unbekannter Status.");
        const bis = /^\d{4}-\d{2}-\d{2}$/.test(String(p.bis || "")) ? String(p.bis) : null;
        await db.from("kc_club_status").upsert({ person_id: ich.person_id, status, hinweis: txt(p.hinweis, 120) || null, bis: status === "verfuegbar" ? null : bis, geaendert_am: jetzt() });
        await protokoll(ich.person_id, "status_gesetzt", { status, bis });
        return json({ ok: true });
      }

      // ----- Treffen -----
      case "treffen_liste": {
        const [treffen, geburtstage] = await Promise.all([treffenListe(ich), geburtstageSichtbar(ich)]);
        return json({ treffen, geburtstage });
      }

      case "treffen_speichern": {
        nurTermineSchreiben(ich);
        const titel = txt(p.titel, 120) || "Köcheclub-Treffen";
        const beginn = new Date(String(p.beginn || ""));
        if (isNaN(beginn.getTime())) throw new Fehler("Bitte Datum und Uhrzeit angeben.");
        if (beginn.getTime() < Date.now() - 3600000) throw new Fehler("Das Treffen liegt in der Vergangenheit.");
        const zeile = { titel, beginn: beginn.toISOString(), ende: p.ende ? new Date(String(p.ende)).toISOString() : null, ort: txt(p.ort, 200) || null,
          gastgeber_person_id: p.gastgeber_person_id ? String(p.gastgeber_person_id) : null, beschreibung: txt(p.beschreibung, 2000) || null, geaendert_am: jetzt(),
          art: p.art === "veranstaltung" ? "veranstaltung" : "treffen", ganztaegig: p.art === "veranstaltung" && !!p.ganztaegig };
        if (zeile.ende && zeile.ende < zeile.beginn) throw new Fehler("Das Ende liegt vor dem Beginn.");
        let t: any, anlass: "neu" | "geaendert" = "neu";
        // KC-CLUB-WIEDERHOLUNG (1.1.0): neue Terminreihe = viele einzelne Treffen (jedes mit eigenen Zu-/Absagen), EINE Sammel-Einladung
        const wdh = !p.id && WDH.includes(String(p.wiederholung)) && p.wiederholung !== "keine" ? String(p.wiederholung) : null;
        if (wdh) {
          const bisTag = /^\d{4}-\d{2}-\d{2}$/.test(String(p.wiederholung_bis || "")) ? String(p.wiederholung_bis) : null;
          if (!bisTag) throw new Fehler("Bitte angeben, bis wann die Terminreihe laufen soll.");
          if (new Date(bisTag).getTime() - beginn.getTime() > 400 * 86400000) throw new Fehler("Eine Terminreihe darf höchstens ein Jahr lang sein.");
          const beginne = wiederholungen(beginn.toISOString(), wdh, new Date(beginn.getTime() - 1000), new Date(bisTag + "T23:59:59Z"), bisTag, [], 60);
          if (beginne.length < 2) throw new Fehler("Bis zu diesem Datum gibt es nur einen Termin – bitte das Ende später wählen.");
          const dauer = zeile.ende ? new Date(zeile.ende).getTime() - beginn.getTime() : 0;
          const { data: reihe, error: re } = await db.from("kc_club_treffen").insert(beginne.map((b) => ({ ...zeile, beginn: b, ende: zeile.ende ? new Date(new Date(b).getTime() + dauer).toISOString() : null, erstellt_von: ich.person_id }))).select();
          if (re || !reihe?.length) throw new Fehler("Speichern fehlgeschlagen.", 500);
          let versand = null;
          if (p.benachrichtigen !== false) {
            const ziel = (await aktiveMitglieder()).map((x) => x.person_id).filter((id) => id !== ich.person_id);
            const liste = reihe.slice(0, 6).map((x: any) => "📅 " + wann(x.beginn, true)).join("\n") + (reihe.length > 6 ? `\n… und ${reihe.length - 6} weitere` : "");
            versand = await senden("club_treffen", ziel, {
              titel: `📅 Neue Terminreihe: ${titel}`, kurz: `${WDH_TEXT[wdh]} – ${reihe.length} Termine ab ${wann(reihe[0].beginn)}`,
              betreff: `Köcheclub Werne – neue Terminreihe: ${titel} (${WDH_TEXT[wdh]})`,
              text: `Hallo,\n\nes gibt eine neue Terminreihe „${titel}“ (${WDH_TEXT[wdh]}, ${reihe.length} Termine):\n\n${liste}${zeile.ort ? "\n\n📍 " + zeile.ort : ""}\n\nZu- und absagen kannst du für jeden Termin einzeln in der Köcheclub-App: ${APP_URL}#termine\n\nViele Grüße\nKöcheclub Werne`,
              url: APP_URL + "#termine",
            }, `club-treffen-reihe:${reihe[0].id}`);
          }
          await protokoll(ich.person_id, "treffen_reihe_angelegt", { anzahl: reihe.length, wiederholung: wdh, titel, versand });
          return json({ ok: true, id: reihe[0].id, anzahl: reihe.length, versand });
        }
        if (p.id) {
          ({ data: t } = await db.from("kc_club_treffen").update({ ...zeile, erinnerung_gesendet_am: null }).eq("id", p.id).select().single());
          anlass = "geaendert";
        } else ({ data: t } = await db.from("kc_club_treffen").insert({ ...zeile, erstellt_von: ich.person_id }).select().single());
        if (!t) throw new Fehler("Speichern fehlgeschlagen.", 500);
        let versand = null;
        if (p.benachrichtigen !== false) {
          const g = t.gastgeber_person_id ? (await personen([t.gastgeber_person_id])).get(t.gastgeber_person_id) : null;
          const ziel = (await aktiveMitglieder()).map((x) => x.person_id).filter((id) => id !== ich.person_id);
          versand = await senden("club_treffen", ziel, treffenText(t, vorname(g), anlass), `club-treffen:${t.id}:${Date.now()}`);
        }
        await protokoll(ich.person_id, anlass === "neu" ? "treffen_angelegt" : "treffen_geaendert", { treffen: t.id, titel, beginn: t.beginn, versand });
        return json({ ok: true, id: t.id, versand });
      }

      case "treffen_absagen": {
        nurTermineSchreiben(ich);
        const { data: t } = await db.from("kc_club_treffen").update({ status: "abgesagt", geaendert_am: jetzt() }).eq("id", p.id).select().single();
        if (!t) throw new Fehler("Treffen nicht gefunden.", 404);
        const g = t.gastgeber_person_id ? (await personen([t.gastgeber_person_id])).get(t.gastgeber_person_id) : null;
        const ziel = (await aktiveMitglieder()).map((x) => x.person_id).filter((id) => id !== ich.person_id);
        const versand = await senden("club_treffen", ziel, treffenText(t, vorname(g), "abgesagt"), `club-treffen-absage:${t.id}`);
        await protokoll(ich.person_id, "treffen_abgesagt", { treffen: t.id, versand });
        return json({ ok: true, versand });
      }

      case "treffen_loeschen": {
        // endgültig entfernen (z. B. Test oder doppelt angelegt) – ohne Benachrichtigung; Absagen bleibt der Weg mit Nachricht an alle
        nurVorstand(ich);
        const { data: t } = await db.from("kc_club_treffen").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!t) throw new Fehler("Termin nicht gefunden.", 404);
        const { data: teil } = await db.from("kc_club_teilnahme").select("*").eq("treffen_id", t.id);
        await geloescht(ich, "treffen", { treffen: t, teilnahme: teil ?? [] });
        await db.from("kc_club_treffen").delete().eq("id", t.id);
        return json({ ok: true });
      }

      case "treffen_antwort": {
        const antwort = String(p.antwort || "");
        // KC-CLUB-ANTWORT-ZURUECK (0.90.0): "keine" nimmt die eigene Antwort zurück (Zeile weg = wieder ohne Antwort)
        if (!["ja", "nein", "vielleicht", "keine"].includes(antwort)) throw new Fehler("Bitte zusagen, absagen oder vielleicht wählen.");
        const { data: t } = await db.from("kc_club_treffen").select("id,status,beginn").eq("id", p.id).maybeSingle();
        if (!t || t.status !== "geplant") throw new Fehler("Dieses Treffen ist nicht mehr offen.", 409);
        if (antwort === "keine") await db.from("kc_club_teilnahme").delete().eq("treffen_id", t.id).eq("person_id", ich.person_id);
        else await db.from("kc_club_teilnahme").upsert({ treffen_id: t.id, person_id: ich.person_id, antwort, notiz: txt(p.notiz, 300) || null, geaendert_am: jetzt() });
        if (antwort !== "ja") await db.from("kc_club_mitfahrt_suche").delete().eq("bezug_art", "treffen").eq("bezug_id", t.id).eq("person_id", ich.person_id); // KC-CLUB-MITFAHRT-SUCHE
        await protokoll(ich.person_id, "treffen_antwort", { treffen: t.id, antwort });
        return json({ ok: true, treffen: (await treffenListe(ich)).find((x: any) => x.id === t.id) });
      }

      // ----- KC-CLUB-TERMINANFRAGE (0.92.0) -----
      case "terminanfrage_senden": {
        const anlass = txt(p.anlass, 120);
        if (!anlass) throw new Fehler("Bitte einen Anlass angeben.");
        const beginn = new Date(String(p.beginn || ""));
        if (isNaN(beginn.getTime())) throw new Fehler("Bitte Datum und Uhrzeit angeben.");
        if (beginn.getTime() < Date.now() - 3600000) throw new Fehler("Der Termin liegt in der Vergangenheit.");
        const ende = p.ende ? new Date(String(p.ende)) : null;
        if (ende && (isNaN(ende.getTime()) || ende < beginn)) throw new Fehler("Das Ende liegt vor dem Beginn.");
        const frist = p.frist ? new Date(String(p.frist)) : null;
        if (frist && (isNaN(frist.getTime()) || frist.getTime() < Date.now())) throw new Fehler("Die Antwortfrist liegt in der Vergangenheit.");
        const ziel = await zielPersonen(ich, p.an);
        if (!ziel.length) throw new Fehler("Bitte mindestens ein Mitglied oder eine Gruppe wählen.");
        if (ziel.length > ANFRAGE_MAX_EMPFAENGER) throw new Fehler(`Höchstens ${ANFRAGE_MAX_EMPFAENGER} Empfänger je Anfrage.`);
        const { count } = await db.from("kc_club_terminanfragen").select("id", { count: "exact", head: true }).eq("erstellt_von", ich.person_id).gte("erstellt_am", new Date(Date.now() - 86400000).toISOString());
        if ((count ?? 0) >= ANFRAGE_MAX_JE_TAG) throw new Fehler("Heute sind schon sehr viele Anfragen verschickt worden – bitte morgen weiter.", 429);
        const ort = txt(p.ort, 200) || null, notiz = txt(p.notiz, 1000) || null;
        const { data: a, error } = await db.from("kc_club_terminanfragen").insert({ erstellt_von: ich.person_id, anlass, beginn: beginn.toISOString(), ende: ende ? ende.toISOString() : null,
          ort, notiz, frist: frist ? frist.toISOString() : null }).select().single();
        if (error || !a) throw new Fehler("Speichern fehlgeschlagen.", 500);
        const { error: e2 } = await db.from("kc_club_terminanfrage_empfaenger").insert(ziel.map((person_id) => ({ anfrage_id: a.id, person_id })));
        if (e2) { await db.from("kc_club_terminanfragen").delete().eq("id", a.id); throw new Fehler("Speichern fehlgeschlagen.", 500); }
        const versand = await senden("club_treffen", ziel, {
          titel: `📨 Terminanfrage von ${ich.vorname}`, kurz: `${anlass} – ${wann(a.beginn)}${ort ? " – " + ort : ""}`,
          betreff: `Köcheclub Werne – Terminanfrage von ${ich.name}: ${anlass}`,
          text: `Hallo,\n\n${ich.name} fragt dich an:\n\n📌 ${anlass}\n📅 ${anfrageWann(a)}${ort ? "\n📍 " + ort : ""}${notiz ? "\n📝 " + notiz : ""}${frist ? `\n⏳ Bitte antworten bis ${wann(a.frist)}` : ""}\n\nBitte in der Köcheclub-App antworten: Ja, Vielleicht oder Nein.\n${APP_URL}#termine\n\nViele Grüße\nKöcheclub Werne`,
          url: APP_URL + "#termine",
        }, `club-terminanfrage:${a.id}`);
        await protokoll(ich.person_id, "terminanfrage_gesendet", { anfrage: a.id, empfaenger: ziel.length, beginn: a.beginn, versand });
        return json({ ok: true, id: a.id, empfaenger: ziel.length, versand });
      }

      case "terminanfragen_liste": {
        return json({ anfragen: await terminanfragenListe(ich) });
      }

      case "terminanfrage_antwort": {
        const antwort = String(p.antwort || "");
        if (!["ja", "nein", "vielleicht", "keine"].includes(antwort)) throw new Fehler("Bitte Ja, Vielleicht oder Nein wählen.");
        const { data: a } = await db.from("kc_club_terminanfragen").select("*").eq("id", String(p.id || "")).maybeSingle();
        const { data: z } = a ? await db.from("kc_club_terminanfrage_empfaenger").select("*").eq("anfrage_id", a.id).eq("person_id", ich.person_id).maybeSingle() : { data: null };
        if (!a || !z) throw new Fehler("Anfrage nicht gefunden.", 404);
        if (a.status !== "offen") throw new Fehler("Diese Anfrage wurde abgesagt.", 409);
        if (new Date(a.ende || a.beginn).getTime() < Date.now() - 3 * 3600000) throw new Fehler("Der Termin ist schon vorbei.", 409);
        const notiz = antwort === "keine" ? null : txt(p.notiz, 300) || null;
        await db.from("kc_club_terminanfrage_empfaenger").update({ antwort: antwort === "keine" ? null : antwort, notiz, geantwortet_am: antwort === "keine" ? null : jetzt() })
          .eq("anfrage_id", a.id).eq("person_id", ich.person_id);
        if (antwort !== "keine" && (antwort !== z.antwort || notiz !== z.notiz)) {
          await senden("club_treffen", [a.erstellt_von], {
            titel: `${ANTWORT_TEXT[antwort]} von ${ich.vorname}`, kurz: `${a.anlass} – ${wann(a.beginn)}${notiz ? " · „" + notiz + "“" : ""}`,
            betreff: `Köcheclub Werne – ${ich.name} antwortet: ${ANTWORT_TEXT[antwort].slice(2)} (${a.anlass})`,
            text: `Hallo,\n\n${ich.name} hat auf deine Terminanfrage geantwortet:\n\n${ANTWORT_TEXT[antwort]}${notiz ? `\n📝 „${notiz}“` : ""}\n\n📌 ${a.anlass}\n📅 ${anfrageWann(a)}\n\nAlle Antworten in der Köcheclub-App: ${APP_URL}#termine\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#termine",
          }, `club-terminanfrage-antwort:${a.id}:${ich.person_id}:${Date.now()}`);
        }
        await protokoll(ich.person_id, "terminanfrage_antwort", { anfrage: a.id, antwort });
        return json({ ok: true, anfrage: (await terminanfragenListe(ich, { von: new Date(new Date(a.beginn).getTime() - 1000).toISOString(), bis: new Date(new Date(a.beginn).getTime() + 1000).toISOString() })).find((x: any) => x.id === a.id) });
      }

      case "terminanfrage_absagen": {
        const { data: a } = await db.from("kc_club_terminanfragen").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!a) throw new Fehler("Anfrage nicht gefunden.", 404);
        if (a.erstellt_von !== ich.person_id) throw new Fehler("Absagen kann nur, wer angefragt hat.", 403);
        if (a.status === "abgesagt") return json({ ok: true });
        await db.from("kc_club_terminanfragen").update({ status: "abgesagt", geaendert_am: jetzt() }).eq("id", a.id);
        const { data: e } = await db.from("kc_club_terminanfrage_empfaenger").select("person_id,antwort").eq("anfrage_id", a.id);
        const ziel = (e ?? []).filter((x: any) => x.antwort !== "nein").map((x: any) => x.person_id);
        const grund = txt(p.grund, 300);
        const versand = ziel.length ? await senden("club_treffen", ziel, {
          titel: `🚫 Abgesagt: ${a.anlass}`, kurz: `${ich.vorname} hat die Anfrage für ${wann(a.beginn)} abgesagt${grund ? " – " + grund : ""}`,
          betreff: `Köcheclub Werne – abgesagt: ${a.anlass} (${wann(a.beginn)})`,
          text: `Hallo,\n\n${ich.name} hat die Terminanfrage abgesagt:\n\n📌 ${a.anlass}\n📅 ${anfrageWann(a)}${grund ? "\n📝 " + grund : ""}\n\nViele Grüße\nKöcheclub Werne`,
          url: APP_URL + "#termine",
        }, `club-terminanfrage-absage:${a.id}`) : null;
        await protokoll(ich.person_id, "terminanfrage_abgesagt", { anfrage: a.id, versand });
        return json({ ok: true, versand });
      }

      // ----- KC-CLUB-STANDORT (0.92.0) -----
      case "standort_start": {
        const k = koordinaten(p);
        const minuten = Math.round(Number(p.minuten));
        if (!Number.isFinite(minuten) || minuten < 5 || minuten > STANDORT_MAX_MIN) throw new Fehler("Bitte eine Dauer wählen.");
        const ziel = await zielPersonen(ich, p.an);
        if (!ziel.length) throw new Fehler("Bitte mindestens ein Mitglied oder eine Gruppe wählen.");
        if (ziel.length > ANFRAGE_MAX_EMPFAENGER) throw new Fehler(`Höchstens ${ANFRAGE_MAX_EMPFAENGER} Empfänger.`);
        // je Person nur EINE laufende Freigabe – eine neue ersetzt die alte
        await db.from("kc_club_standort_live").delete().eq("person_id", ich.person_id);
        const bis = new Date(Date.now() + minuten * 60000).toISOString();
        const { data: z, error } = await db.from("kc_club_standort_live").insert({ person_id: ich.person_id, empfaenger: ziel, ...k, bis }).select("id,bis").single();
        if (error || !z) throw new Fehler("Standort konnte nicht geteilt werden.", 500);
        const bisText = fZeit.format(new Date(bis));
        const versand = await senden("club_nachricht", ziel, {
          titel: `📍 ${ich.name}`, kurz: `teilt den Standort mit dir – bis ${bisText} Uhr`,
          betreff: `Köcheclub Werne – ${ich.name} teilt den Standort mit dir`,
          text: `Hallo,\n\n${ich.name} teilt den Standort mit dir bis ${bisText} Uhr.\nAnsehen in der Köcheclub-App: ${APP_URL}#standort\n\nViele Grüße\nKöcheclub Werne`,
          url: APP_URL + "#standort",
        }, `club-standort:${z.id}`);
        await protokoll(ich.person_id, "standort_geteilt", { empfaenger: ziel.length, minuten, versand }); // ohne Koordinaten
        return json({ ok: true, id: z.id, bis: z.bis, empfaenger: ziel.length, versand });
      }

      case "standort_update": {
        const k = koordinaten(p);
        const { data: z } = await db.from("kc_club_standort_live").update({ ...k, aktualisiert_am: jetzt() })
          .eq("id", String(p.id || "")).eq("person_id", ich.person_id).gt("bis", jetzt()).select("id,bis").maybeSingle();
        if (!z) return json({ ok: false, beendet: true });
        return json({ ok: true, bis: z.bis });
      }

      case "standort_ende": {
        await db.from("kc_club_standort_live").delete().eq("person_id", ich.person_id);
        await protokoll(ich.person_id, "standort_beendet", {});
        return json({ ok: true });
      }

      case "standort_liste": {
        const { data } = await db.from("kc_club_standort_live").select("*").gt("bis", jetzt())
          .or(`person_id.eq.${JSON.stringify(ich.person_id)},empfaenger.cs.{${JSON.stringify(ich.person_id)}}`);
        const liste = data ?? [];
        const leute = await personen([...liste.map((x: any) => x.person_id), ...liste.filter((x: any) => x.person_id === ich.person_id).flatMap((x: any) => x.empfaenger)]);
        const name = (id: string) => leute.get(id)?.display_name || "Mitglied";
        return json({ standorte: liste.map((x: any) => ({ id: x.id, vonMir: x.person_id === ich.person_id, von: { person_id: x.person_id, name: name(x.person_id) },
          lat: x.lat, lon: x.lon, genauigkeit: x.genauigkeit, aktualisiert_am: x.aktualisiert_am, bis: x.bis,
          ...(x.person_id === ich.person_id ? { an: x.empfaenger.map(name) } : {}) })) });
      }

      // ----- KC-CLUB-NACHRICHT-INFO (0.94.0): Details zu einer Nachricht – wann, auf welchem Weg raus, angekommen, gelesen -----
      // Teilnehmer sehen Zeit und Lesestand; die Zustellwege (Push/Mail mit Zeiten, Fehlern, Versuchen) nur der Absender und der Admin.
      // Mail-Adressen werden nie gezeigt – nur der Name des Empfängers.
      case "nachricht_details": {
        const mid = String(p.id || "");
        const { data: m } = await db.from("kc_communication_messages").select("id,thread_id,sender_person_id,created_at").eq("id", mid).maybeSingle();
        if (!m) throw new Fehler("Nachricht nicht gefunden.", 404);
        await binTeilnehmer(m.thread_id, ich.person_id);
        const { data: tn } = await db.from("kc_communication_thread_participants").select("person_id,last_read_at").eq("thread_id", m.thread_id);
        const leute = await personen([m.sender_person_id, ...(tn ?? []).map((x: any) => x.person_id)]);
        const name = (id: string) => leute.get(id)?.display_name || "Mitglied";
        const eigen = m.sender_person_id === ich.person_id, darfWege = eigen || ich.admin;
        const empfaenger = (tn ?? []).filter((x: any) => x.person_id !== m.sender_person_id).map((x: any) => ({
          person_id: x.person_id, name: name(x.person_id), gelesen: !!(x.last_read_at && x.last_read_at >= m.created_at), zuletztGeoeffnet: x.last_read_at || null,
        })).sort((a: any, b: any) => a.name.localeCompare(b.name, "de"));
        let wege: any[] = [];
        if (darfWege) {
          const { data: req } = await db.from("kc_communication_requests").select("id,channel,status,recipient_refs,created_at,sent_at,error_code,error_message,attempt_count,next_attempt_at,dead_lettered_at")
            .like("correlation_id", `club-nachricht:${mid}%`).order("created_at");
          const rids = (req ?? []).map((r: any) => r.id);
          const { data: ev } = rids.length ? await db.from("kc_communication_delivery_events").select("request_id,event_type,provider,created_at").in("request_id", rids).order("created_at") : { data: [] as any[] };
          const perMail = new Map<string, string>();
          for (const [id, pe] of leute) if (pe.email) perMail.set(String(pe.email).trim().toLowerCase(), id);
          wege = (req ?? []).map((r: any) => ({
            kanal: r.channel, status: r.status,
            an: (Array.isArray(r.recipient_refs) ? r.recipient_refs : []).map((x: any) => x?.personId ? name(x.personId) : x?.email ? (perMail.has(String(x.email).toLowerCase()) ? name(perMail.get(String(x.email).toLowerCase())!) : "E-Mail-Empfänger") : "?"),
            erstellt: r.created_at, gesendet: r.sent_at, fehler: txt(r.error_message || r.error_code, 200) || null, versuche: r.attempt_count ?? 0,
            naechsterVersuch: r.status !== "sent" && r.next_attempt_at ? r.next_attempt_at : null, aufgegeben: r.dead_lettered_at,
            ereignisse: (ev ?? []).filter((e: any) => e.request_id === r.id).map((e: any) => ({ typ: e.event_type, anbieter: e.provider, zeit: e.created_at })),
          }));
        }
        // KC-CLUB-WICHTIG (1.53.1, Wunsch Hansi): in den Infos zeigen, dass es eine wichtige Nachricht ist
        const { data: wi } = await db.from("kc_club_nachricht_wichtig").select("am").eq("message_id", m.id).maybeSingle();
        return json({ id: m.id, zeit: m.created_at, von: eigen ? "Du" : name(m.sender_person_id), eigen, empfaenger, wege, wegeSichtbar: darfWege, wichtig: !!wi });
      }

      // ----- KC-CLUB-FEHLERPROTOKOLL (0.93.0) -----
      case "fehler_melden": {
        const liste = (Array.isArray(p.eintraege) ? p.eintraege : []).slice(0, FP_MAX_JE_SENDUNG);
        if (!liste.length) return json({ ok: true, gespeichert: 0 });
        const { count } = await db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).eq("person_id", ich.person_id).like("aktion", "fehler_%").gte("zeit", new Date(Date.now() - 3600000).toISOString());
        const platz = Math.max(0, Math.min(200 - (count ?? 0), liste.length));
        if (!platz) return json({ ok: true, gespeichert: 0 });
        const ua = txt(req.headers.get("user-agent"), 200), version = txt(req.headers.get("x-club-version"), 20);
        await db.from("kc_club_protokoll").insert(liste.slice(0, platz).map((e: any) => ({ person_id: ich.person_id, aktion: "fehler_" + fpArt(e?.art), details: { ...fpSauber(e), ua, version } })));
        return json({ ok: true, gespeichert: platz });
      }

      case "hilfe_anfordern": {
        const { count } = await db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).eq("person_id", ich.person_id).eq("aktion", "hilferuf").gte("zeit", new Date(Date.now() - 3600000).toISOString());
        if ((count ?? 0) >= 3) throw new Fehler("Deine Meldung ist schon angekommen – Hansi meldet sich bei dir.", 429);
        const text = txt(p.text, 600), info = fpSauber(p.info);
        await protokoll(ich.person_id, "hilferuf", { text, ...info, ua: txt(req.headers.get("user-agent"), 200), version: txt(req.headers.get("x-club-version"), 20) });
        const { data: admins } = await db.from("kc_club_rollen").select("person_id").eq("ist_admin", true);
        const ziel = (admins ?? []).map((x: any) => x.person_id).filter((id: string) => id !== ich.person_id);
        const versand = ziel.length ? await senden("club_nachricht", ziel, {
          titel: `🆘 ${ich.name} braucht Hilfe mit der App`, kurz: text || "Problem gemeldet – Einzelheiten im Fehlerprotokoll",
          betreff: `Köcheclub-App: ${ich.name} meldet ein Problem`,
          text: `Hallo,\n\n${ich.name} hat in der Club-App „Problem melden“ getippt.\n\n${text ? "Nachricht: " + text + "\n\n" : ""}Gerät: ${info.system ?? "?"} · ${info.browser ?? "?"} · läuft als ${info.start ?? "?"} · App ${txt(req.headers.get("x-club-version"), 20)}\n\nAlle Einzelheiten: Admin-Zentrale → 🩺 Fehlerprotokoll\n${APP_URL}\n\nViele Grüße\nKöcheclub-App`,
          url: APP_URL,
        }, `club-hilfe:${ich.person_id}:${Date.now()}`) : null;
        return json({ ok: true, versand });
      }

      case "fehlerprotokoll": {
        nurAdmin(ich);
        const tage = Math.min(14, Math.max(1, Math.round(Number(p.tage) || 2)));
        const seit = new Date(Date.now() - tage * 86400000).toISOString();
        let q = db.from("kc_club_protokoll").select("zeit,person_id,aktion,details").gte("zeit", seit)
          .or(FP_FILTER)
          .order("zeit", { ascending: false }).limit(600);
        if (p.person_id) q = q.eq("person_id", String(p.person_id));
        const { data } = await q;
        const leute = await personen((data ?? []).map((x: any) => x.person_id).filter(Boolean));
        return json({ tage, gesamt: await fpZaehlen(), voll: FP_VOLL, eintraege: (data ?? []).map((x: any) => ({ zeit: x.zeit, person_id: x.person_id, name: x.person_id ? (leute.get(x.person_id)?.display_name || x.person_id) : null,
          aktion: x.aktion, details: x.details, stufe: fpStufe(x.aktion, x.details) })) });
      }

      // KC-CLUB-FP-UEBERWACHUNG (1.58.0): Fehlerprotokoll leeren (Admin). Recovery-Punkt: alle Einträge als Sicherung in EINEN
      // Protokolleintrag („fp_geleert“), erst danach löschen. Nur Technik-Einträge, keine anderen Protokollzeilen.
      case "fehlerprotokoll_leeren": {
        nurAdmin(ich);
        const alle: any[] = [];
        for (let ab = 0; ab < 20000; ab += 1000) {
          const { data } = await db.from("kc_club_protokoll").select("id,zeit,person_id,aktion,details").or(FP_FILTER).order("id").range(ab, ab + 999);
          alle.push(...(data ?? [])); if ((data ?? []).length < 1000) break;
        }
        if (!alle.length) return json({ ok: true, geloescht: 0 });
        const z = { schwer: 0, hinweis: 0, info: 0 } as Record<string, number>;
        for (const x of alle) z[fpStufe(x.aktion, x.details)]++;
        const { error: se } = await db.from("kc_club_protokoll").insert({ person_id: ich.person_id, aktion: "fp_geleert", details: { anzahl: alle.length, ...z, sicherung: alle } });
        if (se) throw new Fehler("Sicherung fehlgeschlagen – es wurde nichts gelöscht.", 500);
        const maxId = alle[alle.length - 1].id;
        const { error: de } = await db.from("kc_club_protokoll").delete().or(FP_FILTER).lte("id", maxId);
        if (de) throw new Fehler("Löschen fehlgeschlagen – die Sicherung ist angelegt.", 500);
        return json({ ok: true, geloescht: alle.length, ...z });
      }

      // ----- Vorschläge & Abstimmungen -----
      case "vorschlaege_liste": {
        const { data: kommend } = await db.from("kc_club_treffen").select("id,titel,beginn").eq("status", "geplant").gte("beginn", jetzt()).order("beginn").limit(10);
        return json({ vorschlaege: await vorschlaegeListe(ich), treffen: kommend ?? [], spenden: { empfaenger: await spendenEmpfaenger(), betraege: SPENDEN_BETRAEGE, max: SPENDE_MAX } });
      }

      case "vorschlag_speichern": {
        const art = p.art === "abstimmung" ? "abstimmung" : p.art === "spende" ? "spende" : "thema";
        if (art === "abstimmung") nurVorstand(ich);
        // KC-CLUB-SPENDE: Titel entsteht aus den gewählten Projekten, wenn keiner eingegeben ist
        const spenden = art === "spende" ? spendenPruefen(p.spenden) : null;
        const titel = txt(p.titel, 150) || (spenden ? spendenTitel(spenden) : "");
        if (!titel) throw new Fehler("Bitte ein Thema bzw. eine Frage eingeben.");
        let optionen: string[] = [];
        if (art === "abstimmung") {
          optionen = [...new Set((Array.isArray(p.optionen) ? p.optionen : STANDARD_OPTIONEN).map((o: unknown) => txt(o, 60)).filter(Boolean))] as string[];
          if (optionen.length < 2 || optionen.length > 8) throw new Fehler("Bitte 2 bis 8 Antworten angeben.");
        }
        const frist = p.frist ? new Date(String(p.frist)) : null;
        if (frist && (isNaN(frist.getTime()) || frist.getTime() < Date.now())) throw new Fehler("Die Frist liegt in der Vergangenheit.");
        const { data: v, error } = await db.from("kc_club_vorschlaege").insert({
          art, titel, beschreibung: txt(p.beschreibung, 2000) || null, optionen, geheim: art === "abstimmung" && !!p.geheim, spenden,
          treffen_id: p.treffen_id ? String(p.treffen_id) : null, frist: art === "abstimmung" && frist ? frist.toISOString() : null, erstellt_von: ich.person_id,
        }).select().single();
        if (error || !v) throw new Fehler("Speichern fehlgeschlagen.", 500);
        // Abstimmung → alle; Themenvorschlag → Clubsprecher/Kassenwart (Recht „Organisation“)
        let versand = null;
        if (p.benachrichtigen !== false) {
          const ziel = art === "abstimmung" ? (await aktiveMitglieder()).map((x) => x.person_id)
            : ((await db.from("kc_club_rollen").select("person_id").eq("ist_vorstand", true)).data ?? []).map((r: any) => r.person_id);
          const fristText = v.frist ? ` Abstimmen bis ${wann(v.frist)}.` : "";
          const spText = spenden ? "\n\n" + spenden.map((x) => `💝 ${x.empfaenger}: ${euroRund(x.betrag)}`).join("\n") + (spenden.length > 1 ? `\nZusammen: ${euroRund(spendenSumme(spenden))}` : "") : "";
          versand = await senden("club_vorschlag", ziel.filter((id: string) => id !== ich.person_id), art === "abstimmung" ? {
            titel: "🗳️ Abstimmung: " + titel, kurz: `Bitte in der App abstimmen.${fristText}`,
            betreff: `Köcheclub Werne – Abstimmung: ${titel}`,
            text: `Hallo,\n\nes gibt eine neue Abstimmung${v.geheim ? " (geheim)" : ""}:\n\n🗳️ ${titel}${v.beschreibung ? "\n\n" + v.beschreibung : ""}\n\nAntworten: ${optionen.join(" / ")}${fristText ? "\n" + fristText.trim() : ""}\n\nAbstimmen in der Köcheclub-App: ${APP_URL}#vorschlaege\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#vorschlaege",
          } : {
            titel: spenden ? "💝 Spendenvorschlag" : "💡 Themenvorschlag", kurz: `${ich.name}: ${titel}`,
            betreff: `Köcheclub Werne – neuer ${spenden ? "Spendenvorschlag" : "Themenvorschlag"}: ${titel}`,
            text: `Hallo,\n\n${ich.name} schlägt ${spenden ? "eine Spende" : "ein Thema"} für die nächste Sitzung vor:\n\n${spenden ? "" : "💡 "}${titel}${spText}${v.beschreibung ? "\n\n" + v.beschreibung : ""}\n\nAnsehen in der Köcheclub-App: ${APP_URL}#vorschlaege\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#vorschlaege",
          }, `club-vorschlag:${v.id}`);
        }
        await protokoll(ich.person_id, "vorschlag_angelegt", { vorschlag: v.id, art, geheim: v.geheim, versand, ...(spenden ? { spenden: spenden.length, summe: spendenSumme(spenden) } : {}) });
        return json({ ok: true, id: v.id, versand });
      }

      case "vorschlag_stimme": {
        const { data: v } = await db.from("kc_club_vorschlaege").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!v) throw new Fehler("Vorschlag nicht gefunden.", 404);
        if (v.status !== "offen") throw new Fehler("Hier kann nicht mehr abgestimmt werden.", 409);
        if (unterstuetzbar(v.art)) {
          // Unterstützen an/aus (Thema und Spendenprojekt)
          if (p.wahl) await db.from("kc_club_stimmen").upsert({ vorschlag_id: v.id, person_id: ich.person_id, wahl: "dafuer", geaendert_am: jetzt() });
          else await db.from("kc_club_stimmen").delete().eq("vorschlag_id", v.id).eq("person_id", ich.person_id);
        } else {
          const wahl = String(p.wahl || "");
          if (!v.optionen.includes(wahl)) throw new Fehler("Bitte eine der Antworten wählen.");
          if (v.geheim) {
            const { data: ok, error } = await db.rpc("kc_club_geheim_abstimmen", { p_vorschlag: v.id, p_person: ich.person_id, p_wahl: wahl });
            if (error) throw new Fehler("Stimme konnte nicht gespeichert werden.", 500);
            if (!ok) throw new Fehler("Du hast hier schon abgestimmt – bei geheimen Abstimmungen geht das nur einmal.", 409);
          } else await db.from("kc_club_stimmen").upsert({ vorschlag_id: v.id, person_id: ich.person_id, wahl, geaendert_am: jetzt() });
        }
        // bei geheimer Abstimmung keine Wahl ins Protokoll
        await protokoll(ich.person_id, "vorschlag_stimme", { vorschlag: v.id, ...(v.geheim ? {} : { wahl: p.wahl ?? null }) });
        return json({ ok: true });
      }

      case "vorschlag_status": {
        const { data: v } = await db.from("kc_club_vorschlaege").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!v || v.status !== "offen") throw new Fehler("Vorschlag nicht gefunden oder schon erledigt.", 404);
        const eigener = v.erstellt_von === ich.person_id;
        let versand = null;
        if (p.status === "zurueckgezogen") {
          if (!ich.vorstand && !eigener) throw new Fehler("Das darf nur, wer den Vorschlag gemacht hat, oder Clubsprecher/Kassenwart.", 403);
          await db.from("kc_club_vorschlaege").update({ status: "zurueckgezogen", abgeschlossen_am: jetzt(), abgeschlossen_von: ich.person_id }).eq("id", v.id);
        } else if (p.status === "abgeschlossen") {
          if (!ich.vorstand && !(eigener && unterstuetzbar(v.art))) throw new Fehler("Abstimmungen beenden Clubsprecher, Kassenwart oder Admin.", 403);
          versand = await vorschlagAbschliessen(v, ich.person_id);
        } else throw new Fehler("Unbekannter Status.");
        await protokoll(ich.person_id, "vorschlag_" + p.status, { vorschlag: v.id, versand });
        return json({ ok: true, versand });
      }

      case "vorschlag_loeschen": {
        const { data: v } = await db.from("kc_club_vorschlaege").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!v) throw new Fehler("Vorschlag nicht gefunden.", 404);
        const [{ data: st }, { data: geh }] = await Promise.all([
          db.from("kc_club_stimmen").select("*").eq("vorschlag_id", v.id),
          db.from("kc_club_geheime_stimmen").select("wahl").eq("vorschlag_id", v.id),
        ]);
        const fremd = (st ?? []).some((x: any) => x.person_id !== ich.person_id) || (geh ?? []).length > 0;
        if (!ich.vorstand && !(v.erstellt_von === ich.person_id && !fremd)) throw new Fehler("Löschen dürfen Clubsprecher, Kassenwart oder Admin – oder du selbst, solange noch niemand abgestimmt hat.", 403);
        // geheime Stimmen ohne Person – nur die Anzahl je Antwort wird gesichert
        await geloescht(ich, "vorschlag", { vorschlag: v, stimmen: v.geheim ? [] : st ?? [], geheim: (geh ?? []).map((g: any) => g.wahl) });
        await db.from("kc_club_vorschlaege").delete().eq("id", v.id);
        return json({ ok: true });
      }

      // ----- KC-CLUB-BUERO (1.25.0): Büro für die Clubleitung -----
      case "buero_start": {
        nurBueroLesen(ich);
        const [sitzungen, eingang] = await Promise.all([bueroNaechste(), bueroEingang()]);
        const ids = sitzungen.map((t: any) => t.id);
        const [{ data: prep }, { data: teil }] = ids.length ? await Promise.all([
          db.from("kc_club_buero_sitzung").select("treffen_id,einladung_am,erinnerung_am,geaendert_am").in("treffen_id", ids),
          db.from("kc_club_teilnahme").select("treffen_id,antwort").in("treffen_id", ids),
        ]) : [{ data: [] as any[] }, { data: [] as any[] }];
        const anzahl = (await aktiveMitglieder()).length;
        return json({
          sitzungen: sitzungen.map((t: any) => {
            const p = (prep ?? []).find((x: any) => x.treffen_id === t.id), a = (teil ?? []).filter((x: any) => x.treffen_id === t.id);
            return { ...t, vorbereitet: !!p, einladung_am: p?.einladung_am ?? null, erinnerung_am: p?.erinnerung_am ?? null,
              ja: a.filter((x: any) => x.antwort === "ja").length, nein: a.filter((x: any) => x.antwort === "nein").length, ohne: Math.max(0, anzahl - a.filter((x: any) => x.antwort && x.antwort !== "keine").length) };
          }),
          eingang,
        });
      }

      case "buero_sitzung": nurBueroLesen(ich); return json(await bueroSitzung(ich, String(p.treffen_id || "")));

      case "buero_speichern": {
        nurBueroSchreiben(ich);
        const tid = String(p.treffen_id || "");
        const { data: t } = await db.from("kc_club_treffen").select("*").eq("id", tid).maybeSingle();
        if (!t) throw new Fehler("Sitzung nicht gefunden.", 404);
        const aktiv = new Set((await aktiveMitglieder()).map((m) => m.person_id));
        const anwesend = [...new Set<string>((Array.isArray(p.anwesend) ? p.anwesend : []).map(String))].filter((id) => aktiv.has(id));
        const tagesordnung = bueroTopListe(p.tagesordnung);
        const zeilen = BUERO_ZEILEN.includes(Number(p.zeilen)) ? Number(p.zeilen) : 5;
        const anmerkung = txt(p.anmerkung, 1000) || null;
        const { error } = await db.from("kc_club_buero_sitzung").upsert({ treffen_id: tid, anwesend, anmerkung, tagesordnung, zeilen, geaendert_von: ich.person_id, geaendert_am: jetzt() });
        if (error) throw new Fehler("Speichern fehlgeschlagen.", 500);
        // Protokoll-Entwurf anlegen bzw. (solange nie veröffentlicht) mitführen – veröffentlichte Protokolle bleiben unberührt
        const { data: teil } = await db.from("kc_club_teilnahme").select("person_id,antwort").eq("treffen_id", tid);
        const entschuldigt = (teil ?? []).filter((x: any) => x.antwort === "nein").map((x: any) => x.person_id).filter((id: string) => !anwesend.includes(id));
        const g = t.gastgeber_person_id ? (await personen([t.gastgeber_person_id])).get(t.gastgeber_person_id) : null;
        const felder = { titel: t.titel, datum: berlinTag(new Date(t.beginn)), ort: t.ort || (g ? `bei ${g.display_name}` : null), anwesend, entschuldigt, tagesordnung: tagesordnung.map((x) => x.t) };
        const { data: pr } = await db.from("kc_club_sitzungsprotokolle").select("id,status,version").eq("treffen_id", tid).maybeSingle();
        let protokollId = pr?.id ?? null, protokollStand = "unveraendert";
        if (!pr) {
          const { data: neu } = await db.from("kc_club_sitzungsprotokolle").insert({ ...felder, treffen_id: tid, verfasser: ich.person_id }).select("id").single();
          protokollId = neu?.id ?? null; protokollStand = neu ? "angelegt" : "fehler";
          if (neu) await protokoll(ich.person_id, "sitzungsprotokoll_angelegt", { protokoll: neu.id, treffen: tid, buero: true });
        } else if (pr.status === "entwurf" && pr.version === 1 && new Date(t.beginn).getTime() > Date.now()) {
          // nur vor der Sitzung – danach gehört der Entwurf dem Schriftführer
          await db.from("kc_club_sitzungsprotokolle").update({ ...felder, geaendert_am: jetzt() }).eq("id", pr.id).eq("status", "entwurf");
          protokollStand = "aktualisiert";
        }
        await protokoll(ich.person_id, "buero_sitzung_vorbereitet", { treffen: tid, punkte: tagesordnung.length, anwesend: anwesend.length, protokoll: protokollStand });
        return json({ ok: true, protokoll_id: protokollId, protokollStand });
      }

      case "buero_einladung": {
        nurBueroSchreiben(ich);
        const tid = String(p.treffen_id || "");
        const nurOffen = !!p.nur_offen;
        const { data: t } = await db.from("kc_club_treffen").select("*").eq("id", tid).maybeSingle();
        if (!t || t.status !== "geplant") throw new Fehler("Sitzung nicht gefunden oder abgesagt.", 404);
        const { data: prep } = await db.from("kc_club_buero_sitzung").select("*").eq("treffen_id", tid).maybeSingle();
        const top = (prep?.tagesordnung ?? []).map((x: any, i: number) => `${i + 1}. ${x.t}`);
        const alle = (await aktiveMitglieder()).map((m) => m.person_id);
        const { data: teil } = await db.from("kc_club_teilnahme").select("person_id,antwort").eq("treffen_id", tid);
        const geantwortet = new Set((teil ?? []).filter((x: any) => x.antwort && x.antwort !== "keine").map((x: any) => x.person_id));
        const ziel = (nurOffen ? alle.filter((id) => !geantwortet.has(id)) : alle).filter((id) => id !== ich.person_id);
        if (!ziel.length) return json({ ok: true, versand: { gesendet: 0 }, empfaenger: 0 });
        const g = t.gastgeber_person_id ? (await personen([t.gastgeber_person_id])).get(t.gastgeber_person_id) : null;
        const ort = t.ort || (g ? `bei ${g.display_name}` : "");
        const zusatz = txt(p.text, 500);
        const url = APP_URL + "#termine";
        const vars = nurOffen ? {
          titel: `🔔 Kommst du? ${t.titel}`, kurz: `${wann(t.beginn)}${ort ? " · " + ort : ""} – bitte kurz zu- oder absagen.`,
          betreff: `Köcheclub Werne – Erinnerung: ${t.titel} am ${wann(t.beginn)}`,
          text: `Hallo,\n\nkleine Erinnerung an unsere Sitzung:\n\n${t.titel}\n${wann(t.beginn, true)}${ort ? `\n${ort}` : ""}\n\nBitte sag kurz in der App zu oder ab – das hilft bei der Vorbereitung.${zusatz ? `\n\n${zusatz}` : ""}\n\n${url}\n\nViele Grüße\n${ich.name}\nKöcheclub Werne`,
          url,
        } : {
          titel: `📨 Einladung: ${t.titel}`, kurz: `${wann(t.beginn)}${ort ? " · " + ort : ""}${top.length ? ` · ${top.length} Tagesordnungspunkte` : ""}`,
          betreff: `Köcheclub Werne – Einladung: ${t.titel} am ${wann(t.beginn)}`,
          text: `Hallo,\n\nhiermit lade ich herzlich ein zu unserer Sitzung:\n\n${t.titel}\n${wann(t.beginn, true)}${ort ? `\n${ort}` : ""}${top.length ? `\n\nTagesordnung:\n${top.join("\n")}` : ""}${zusatz ? `\n\n${zusatz}` : ""}\n\nBitte in der App kurz zu- oder absagen. Themen kannst du jederzeit unter „Vorschläge“ einreichen.\n${url}\n\nViele Grüße\n${ich.name}\nKöcheclub Werne`,
          url,
        };
        const wege = zustellwege(p.wege);
        const versand = await sendenGewaehlt("club_treffen", ziel, wege, vars, `club-buero-${nurOffen ? "erinnerung" : "einladung"}:${tid}:${Date.now()}`);
        await db.from("kc_club_buero_sitzung").upsert({ treffen_id: tid, ...(prep ? {} : { geaendert_von: ich.person_id }), [nurOffen ? "erinnerung_am" : "einladung_am"]: jetzt() }, { onConflict: "treffen_id" });
        await protokoll(ich.person_id, nurOffen ? "buero_erinnerung" : "buero_einladung", { treffen: tid, empfaenger: ziel.length, wege, versand });
        return json({ ok: true, versand, empfaenger: ziel.length });
      }

      // ----- KC-CLUB-BUERO-NACHHER (1.28.0): nach der Sitzung – Foto der Mitschrift, Aufgaben verteilen, veröffentlichen -----
      case "buero_nachher": {
        nurBueroLesen(ich);
        const { data: tr } = await db.from("kc_club_treffen").select("id,titel,beginn,ort,art,status").neq("art", "veranstaltung").neq("status", "abgesagt")
          .gte("beginn", new Date(Date.now() - 90 * 86400000).toISOString()).lte("beginn", new Date(Date.now() + 6 * 3600000).toISOString()).order("beginn", { ascending: false }).limit(6);
        const ids = (tr ?? []).map((t: any) => t.id);
        const { data: prs } = ids.length ? await db.from("kc_club_sitzungsprotokolle").select("id,treffen_id,status,version,einspruch_bis").in("treffen_id", ids) : { data: [] as any[] };
        const pids = (prs ?? []).map((x: any) => x.id);
        const [{ data: anl }, { data: auf }] = pids.length ? await Promise.all([
          db.from("kc_club_sitzungsprotokoll_anlagen").select("protokoll_id").in("protokoll_id", pids),
          db.from("kc_club_aufgaben").select("protokoll_id,mitgeteilt_am,erledigt_am").in("protokoll_id", pids),
        ]) : [{ data: [] as any[] }, { data: [] as any[] }];
        return json({ sitzungen: (tr ?? []).map((t: any) => {
          const pr = (prs ?? []).find((x: any) => x.treffen_id === t.id), a = pr ? (auf ?? []).filter((x: any) => x.protokoll_id === pr.id) : [];
          return { ...t, protokoll: pr ? { id: pr.id, status: pr.status, version: pr.version } : null, fotos: pr ? (anl ?? []).filter((x: any) => x.protokoll_id === pr.id).length : 0,
            aufgaben: a.length, nichtMitgeteilt: a.filter((x: any) => !x.mitgeteilt_am && !x.erledigt_am).length };
        }) });
      }

      case "buero_aufgaben_mitteilen": {
        nurBueroSchreiben(ich);
        const pr = await protokollHolen(p.protokoll_id);
        const { data: auf } = await db.from("kc_club_aufgaben").select("*").eq("protokoll_id", pr.id);
        const offen = (auf ?? []).filter((a: any) => !a.mitgeteilt_am && !a.erledigt_am);
        await aufgabenMitteilen(offen, ich, pr.titel);
        await protokoll(ich.person_id, "buero_aufgaben_mitgeteilt", { protokoll: pr.id, aufgaben: offen.length });
        return json({ ok: true, mitgeteilt: offen.length, personen: new Set(offen.filter((a: any) => a.person_id !== ich.person_id).map((a: any) => a.person_id)).size });
      }

      // ----- KC-CLUB-BUERO-FESTE (1.29.0): Geburtstage (nur freigegebene, nur Tag/Monat) & Vereinsjubiläen (Eintritt aus dem KC Manager) -----
      case "buero_feste": {
        nurBueroLesen(ich);
        const heute = berlinTag(new Date()), tage = Math.min(366, Math.max(7, Math.floor(Number(p.tage) || 60)));
        const [leute, { data: fr }, { data: mg }] = await Promise.all([
          aktiveMitglieder(),
          db.from("kc_club_freigaben").select("person_id,bereich").in("bereich", ["geburtstag", "runder_geburtstag"]).eq("erlaubt", true),
          db.from(AKTIONEN_QUELLE.tabelle).select("payload").eq("org_id", ORG).eq("section_key", AKTIONEN_QUELLE.mitglieder).maybeSingle(),
        ]);
        const frei = new Set((fr ?? []).filter((x: any) => x.bereich === "geburtstag").map((x: any) => x.person_id));
        // KC-CLUB-RUNDER-GEBURTSTAG: Alter nur, wenn das Mitglied es freigegeben hat – und nur bei runden Geburtstagen
        const rundFrei = new Set((fr ?? []).filter((x: any) => x.bereich === "runder_geburtstag").map((x: any) => x.person_id));
        const rundesAlter = (a: number) => a >= 18 && (a % 10 === 0 || (a >= 65 && a % 5 === 0));
        // nächster Jahrestag eines MM-TT ab (heute − 7 Tage); 29.02. → 28.02. in Nicht-Schaltjahren
        const naechster = (md: string) => {
          const ab = tagDazu(heute, -7), j0 = Number(ab.slice(0, 4));
          for (const j of [j0, j0 + 1]) {
            const schalt = (j % 4 === 0 && j % 100 !== 0) || j % 400 === 0;
            const d = `${j}-${md === "02-29" && !schalt ? "02-28" : md}`;
            if (d >= ab) return d;
          }
          return null;
        };
        const tageBis = (d: string) => Math.round((Date.parse(d + "T12:00:00Z") - Date.parse(heute + "T12:00:00Z")) / 86400000);
        const geburtstage: any[] = [];
        let ohneFreigabe = 0;
        for (const m of leute as any[]) {
          if (!m.birth_date) continue;
          const d = naechster(String(m.birth_date).slice(5, 10)); if (!d) continue;
          const alter = Number(d.slice(0, 4)) - Number(String(m.birth_date).slice(0, 4));
          const rund = ich.vorstand && rundFrei.has(m.person_id) && rundesAlter(alter); // 1.37.0: Alter nur für die Clubleitung (auch bei Büro-Freigabe)
          if (!frei.has(m.person_id) && m.person_id !== ich.person_id && !rund) { ohneFreigabe++; continue; }
          const t = tageBis(d); if (t > tage) continue;
          geburtstage.push({ person_id: m.person_id, name: m.display_name, vorname: vorname(m), datum: d, tage: t, ...(rund ? { rund: true, alter } : {}) });
        }
        const kern = new Map((leute as any[]).map((p) => [namensSchluessel(p.given_name || p.display_name.split(" ")[0], p.family_name || p.display_name.split(" ").slice(-1)[0]), p]));
        const jubilaeen: any[] = [];
        for (const m of Array.isArray(mg?.payload?.data) ? mg.payload.data : []) {
          const ein = String(m?.joinedAt || "").slice(0, 10);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(ein) || m?.exitDate) continue;
          const pp: any = kern.get(namensSchluessel(m.firstName, m.lastName)); if (!pp) continue;
          const d = naechster(ein.slice(5, 10)); if (!d) continue;
          const t = tageBis(d), jahre = Number(d.slice(0, 4)) - Number(ein.slice(0, 4));
          if (t > tage || jahre < 1) continue;
          jubilaeen.push({ person_id: pp.person_id, name: pp.display_name, vorname: vorname(pp), datum: d, tage: t, jahre, eintritt: ein.slice(0, 4), rund: jahre % 5 === 0 });
        }
        const sort = (a: any, b: any) => a.datum.localeCompare(b.datum) || a.name.localeCompare(b.name);
        return json({ heute, tage, geburtstage: geburtstage.sort(sort), jubilaeen: jubilaeen.sort(sort), ohneFreigabe });
      }

      // ----- KC-CLUB-BUERO-MITGLIEDERLISTE (1.31.0): Liste zum Drucken – Kontaktdaten nach denselben Regeln wie die Mitglieder-Seite -----
      case "buero_mitgliederliste": {
        nurVorstand(ich);
        const leute = await aktiveMitglieder();
        const ids = leute.map((m) => m.person_id);
        const [{ data: pe }, { data: fr }, { data: rollen }, { data: mg }] = await Promise.all([
          db.from("kc_core_people").select("person_id,phone,email,street,postal_code,city,birth_date,given_name,family_name,display_name").in("person_id", ids),
          db.from("kc_club_freigaben").select("person_id,bereich,erlaubt").in("person_id", ids).eq("erlaubt", true),
          db.from("kc_club_rollen").select("person_id,aemter").in("person_id", ids),
          db.from(AKTIONEN_QUELLE.tabelle).select("payload").eq("org_id", ORG).eq("section_key", AKTIONEN_QUELLE.mitglieder).maybeSingle(),
        ]);
        const mgListe = Array.isArray(mg?.payload?.data) ? mg.payload.data : [];
        const ausManager = (p: any) => mgListe.find((x: any) => namensSchluessel(x.firstName, x.lastName) === namensSchluessel(p.given_name || p.display_name.split(" ")[0], p.family_name || p.display_name.split(" ").slice(-1)[0]));
        let verborgen = 0;
        const liste = leute.map((m) => {
          const p: any = (pe ?? []).find((x: any) => x.person_id === m.person_id) ?? {}, km: any = ausManager({ ...m, ...p });
          const frei = (b: string) => (fr ?? []).some((x: any) => x.person_id === m.person_id && x.bereich === b);
          const darf = (f: string) => m.person_id === ich.person_id || ich.admin || (ich.kontakte && frei("kontakt_" + f));
          const werte: Record<string, unknown> = { handy: txt(p.phone, 40) || null, festnetz: txt(km?.phone, 40) || null, mail: txt(p.email, 120) || null,
            adresse: p.street || p.city ? `${txt(p.street, 120)}, ${txt(p.postal_code, 10)} ${txt(p.city, 80)}`.replace(/^, |, $/g, "").trim() : null };
          const kontakt: Record<string, unknown> = {};
          for (const f of KONTAKT_FELDER) { if (!werte[f]) continue; if (darf(f)) kontakt[f] = werte[f]; else verborgen++; }
          return { person_id: m.person_id, name: m.display_name, nachname: txt(p.family_name, 80) || m.display_name.split(" ").slice(-1)[0], aemter: (rollen ?? []).find((r: any) => r.person_id === m.person_id)?.aemter ?? [],
            eintritt: /^\d{4}-\d{2}-\d{2}/.test(String(km?.joinedAt || "")) ? String(km.joinedAt).slice(0, 10) : null,
            geburtstag: p.birth_date && (frei("geburtstag") || m.person_id === ich.person_id) ? String(p.birth_date).slice(5, 10) : null, kontakt };
        });
        await protokoll(ich.person_id, "buero_mitgliederliste", { anzahl: liste.length, verborgen });
        return json({ liste, verborgen, admin: ich.admin });
      }

      // ----- KC-CLUB-FREUD-LEID (1.32.0): nur Clubleitung -----
      case "fl_liste": nurVorstand(ich); return json(await flListe(ich));

      case "fl_anlegen": {
        nurVorstand(ich);
        const art = String(p.art || "");
        if (!FL_ARTEN[art]) throw new Fehler("Bitte antippen, was passiert ist.");
        const aktiv = new Set((await aktiveMitglieder()).map((m) => m.person_id));
        const person = p.person_id && aktiv.has(String(p.person_id)) ? String(p.person_id) : null;
        if (!person) throw new Fehler("Bitte antippen, wen es betrifft.");
        const termin = p.termin && !isNaN(Date.parse(String(p.termin))) ? new Date(String(p.termin)).toISOString() : null;
        const betrag = p.betrag === null || p.betrag === undefined || p.betrag === "" ? null : Math.round(Number(p.betrag) * 100) / 100;
        if (betrag !== null && !(betrag >= 0 && betrag <= 10000)) throw new Fehler("Betrag 0 bis 10.000 €.");
        const { data: f, error } = await db.from("kc_club_fl_faelle").insert({ art, person_id: person, notiz: txt(p.notiz, 500) || null, datum: isoTag(p.datum) || berlinTag(new Date()),
          termin, termin_ort: txt(p.termin_ort, 120) || null, betrag, erstellt_von: ich.person_id }).select().single();
        if (error || !f) throw new Fehler("Speichern fehlgeschlagen.", 500);
        const name = (await personen([person])).get(person)?.display_name || person;
        const liste = (Array.isArray(p.schritte) ? p.schritte : []).slice(0, 20);
        const aufgaben: any[] = [];
        let i = 0;
        for (const x of liste) {
          const text = txt(x?.text, 200); if (!text) continue;
          const alle = !!x?.alle, wer = !alle && x?.wer && aktiv.has(String(x.wer)) ? String(x.wer) : null, bis = isoTag(x?.bis) || null;
          const a = await flAufgabe(ich, f, { text, wer, bis }, name);
          if (a) aufgaben.push(a);
          await db.from("kc_club_fl_schritte").insert({ fall_id: f.id, text, wer, alle, bis, aufgabe_id: a?.id ?? null, sort: i++ });
        }
        if (p.mitteilen !== false && aufgaben.length) await aufgabenMitteilen(aufgaben, ich, null);
        await protokoll(ich.person_id, "fl_angelegt", { fall: f.id, art, schritte: i, aufgaben: aufgaben.length });
        return json({ ok: true, id: f.id });
      }

      case "fl_aendern": {
        nurVorstand(ich);
        const f = await flFallHolen(p.id);
        const was = String(p.was || "");
        if (was === "schritt_erledigt") {
          const { data: s } = await db.from("kc_club_fl_schritte").select("*").eq("id", String(p.schritt_id || "")).eq("fall_id", f.id).maybeSingle();
          if (!s) throw new Fehler("Schritt nicht gefunden.", 404);
          const an = p.erledigt !== false;
          await db.from("kc_club_fl_schritte").update({ erledigt_am: an ? jetzt() : null, erledigt_von: an ? ich.person_id : null }).eq("id", s.id);
          if (s.aufgabe_id) await db.from("kc_club_aufgaben").update({ erledigt_am: an ? jetzt() : null }).eq("id", s.aufgabe_id);
        } else if (was === "schritt_neu") {
          const text = txt(p.text, 200); if (!text) throw new Fehler("Bitte kurz eintragen, was zu tun ist.");
          const aktiv = new Set((await aktiveMitglieder()).map((m) => m.person_id));
          const wer = p.wer && aktiv.has(String(p.wer)) ? String(p.wer) : null, bis = isoTag(p.bis) || null;
          const { count } = await db.from("kc_club_fl_schritte").select("id", { count: "exact", head: true }).eq("fall_id", f.id);
          if ((count ?? 0) >= 30) throw new Fehler("Höchstens 30 Schritte je Fall.");
          const name = (await personen([f.person_id])).get(f.person_id)?.display_name || "";
          const a = await flAufgabe(ich, f, { text, wer, bis }, name);
          await db.from("kc_club_fl_schritte").insert({ fall_id: f.id, text, wer, bis, aufgabe_id: a?.id ?? null, sort: count ?? 0 });
          if (a) await aufgabenMitteilen([a], ich, null);
        } else if (was === "schritt_weg") {
          const { data: s } = await db.from("kc_club_fl_schritte").select("*").eq("id", String(p.schritt_id || "")).eq("fall_id", f.id).maybeSingle();
          if (!s) throw new Fehler("Schritt nicht gefunden.", 404);
          await geloescht(ich, "fl_schritt", { schritt: s });
          await db.from("kc_club_fl_schritte").delete().eq("id", s.id);
          if (s.aufgabe_id) await db.from("kc_club_aufgaben").delete().eq("id", s.aufgabe_id).is("erledigt_am", null);
        } else if (was === "angaben") {
          const betrag = p.betrag === null || p.betrag === "" || p.betrag === undefined ? null : Math.round(Number(p.betrag) * 100) / 100;
          if (betrag !== null && !(betrag >= 0 && betrag <= 10000)) throw new Fehler("Betrag 0 bis 10.000 €.");
          const termin = p.termin && !isNaN(Date.parse(String(p.termin))) ? new Date(String(p.termin)).toISOString() : null;
          await db.from("kc_club_fl_faelle").update({ notiz: txt(p.notiz, 500) || null, termin, termin_ort: txt(p.termin_ort, 120) || null, betrag }).eq("id", f.id);
        } else throw new Fehler("Unbekannte Änderung.");
        await protokoll(ich.person_id, "fl_" + was, { fall: f.id });
        return json({ ok: true });
      }

      // Mitglieder informieren (bei Leid nur nach Absprache mit der Familie) – optional mit „Wer kommt mit?“ (Abordnung)
      case "fl_informieren": {
        nurVorstand(ich);
        const f = await flFallHolen(p.id);
        const leid = FL_ARTEN[f.art]?.gruppe === "leid";
        if (leid && p.abgesprochen !== true) throw new Fehler("Bitte bestätigen, dass es mit der Familie abgesprochen ist.");
        const text = txt(p.text, 1000); if (!text) throw new Fehler("Bitte einen Text eingeben.");
        const ziel = (await aktiveMitglieder()).map((m) => m.person_id).filter((id) => id !== ich.person_id && (!leid || id !== f.person_id));
        let aufrufId: string | null = f.aufruf_id;
        if (p.abordnung && !aufrufId) {
          if (!f.termin) throw new Fehler("Für die Abordnung bitte zuerst den Termin (z. B. Beerdigung) eintragen.");
          const { data: h } = await db.from("kc_club_hilfe_aufrufe").insert({ von: ich.person_id, art: "abordnung", datum: berlinTag(new Date(f.termin)), slot: null,
            anzahl: Math.min(20, Math.max(1, Math.floor(Number(p.anzahl) || 5))), ort: f.termin_ort, notiz: txt(p.aufruf_notiz, 300) || null, ziel: "alle" }).select("id").single();
          aufrufId = h?.id ?? null;
        }
        const url = aufrufId ? APP_URL + "#helfen" : APP_URL;
        const vars = { titel: leid ? "🕊️ Nachricht aus dem Club" : "🎉 Neuigkeit aus dem Club", kurz: text.slice(0, 150),
          betreff: `Köcheclub Werne – ${leid ? "traurige Nachricht" : "gute Nachricht"}`,
          text: `Hallo,\n\n${text}${aufrufId ? `\n\nWer zur ${f.art.startsWith("tod") ? "Beerdigung" : "Begleitung"} mitkommen möchte, sagt bitte kurz in der App zu: ${APP_URL}#helfen` : ""}\n\nViele Grüße\n${ich.name}\nKöcheclub Werne`, url };
        const versand = await sendenGewaehlt("club_nachricht", ziel, zustellwege(p.wege), vars, `club-fl:${f.id}:${Date.now()}`);
        await db.from("kc_club_fl_faelle").update({ informiert_am: jetzt(), aufruf_id: aufrufId }).eq("id", f.id);
        if (aufrufId) await db.from("kc_club_fl_schritte").update({ erledigt_am: jetzt(), erledigt_von: ich.person_id }).eq("fall_id", f.id).eq("alle", true).is("erledigt_am", null);
        await protokoll(ich.person_id, "fl_informiert", { fall: f.id, empfaenger: ziel.length, abordnung: !!aufrufId, versand });
        return json({ ok: true, empfaenger: ziel.length, versand, aufruf: aufrufId });
      }

      case "fl_abschliessen": {
        nurVorstand(ich);
        const f = await flFallHolen(p.id);
        if (f.status === "abgeschlossen") return json({ ok: true });
        const l = await flListe(ich), x: any = l.faelle.find((y: any) => y.id === f.id);
        await db.from("kc_club_fl_faelle").update({ status: "abgeschlossen", abgeschlossen_am: jetzt() }).eq("id", f.id);
        // Ablage im Vereinsordner „Admin <Jahr>“, Register „Freud & Leid“
        let abgelegt = false;
        try {
          const jahr = Number(berlinTag(new Date()).slice(0, 4));
          const zeilen = [`Köcheclub Werne – Freud & Leid`, flTitel(f, x?.name), "────────────────────", "",
            `Datum: ${f.datum ? f.datum.split("-").reverse().join(".") : "–"}`, ...(f.termin ? [`Termin: ${wann(f.termin, true)}${f.termin_ort ? " · " + f.termin_ort : ""}`] : []),
            ...(f.notiz ? [`Notiz: ${f.notiz}`] : []), ...(f.betrag !== null ? [`Betrag: ${euro(Number(f.betrag))}`] : []), "", "Schritte:",
            ...(x?.schritte ?? []).map((s: any) => `  ${s.erledigt ? "✔" : "☐"} ${s.text}${s.werName ? ` – ${s.werName}` : s.alle ? " – alle" : ""}${s.bis ? ` (bis ${s.bis.split("-").reverse().join(".")})` : ""}`),
            ...(x?.aufruf ? ["", `Begleitung/Abordnung: ${x.aufruf.kommen.join(", ") || "–"}`] : []), "", `Abgeschlossen von ${ich.name}, ${wann(jetzt())}`, ""];
          await archivTextAblegen(ich, await adminOrdner(jahr, "Freud & Leid"), "Freud & Leid", flTitel(f, x?.name), `FreudLeid-${f.datum || berlinTag(new Date())}-${(x?.name || "Mitglied").split(" ")[0]}.txt`, zeilen.join("\n"), `Freud & Leid, ${FL_ARTEN[f.art]?.t ?? f.art}, ${x?.name ?? ""}`);
          abgelegt = true;
        } catch (e) { console.error("fl ablegen", String(e)); }
        await protokoll(ich.person_id, "fl_abgeschlossen", { fall: f.id, abgelegt });
        return json({ ok: true, abgelegt });
      }

      // ----- KC-CLUB-TAGESINFO (1.33.0, Wunsch Hansi): Tages-Übersicht beim Start – Clubleitung; Kassenwart/Admin mit Extras -----
      // Nur lesend. „seit“ = letzter Blick auf die Übersicht (vom Gerät, höchstens 7 Tage zurück). Fehlende Messwerte = null (nie grün).
      case "tagesinfo": {
        nurVorstand(ich);
        const jetztMs = Date.now(), seitRoh = Date.parse(String(p.seit || ""));
        const seit = new Date(Number.isFinite(seitRoh) ? Math.max(seitRoh, jetztMs - 7 * 86400000) : jetztMs - 86400000).toISOString();
        const heute = berlinTag(new Date());
        const [eingang, { data: auf }] = await Promise.all([
          bueroEingang(),
          db.from("kc_club_aufgaben").select("id,text,faellig").eq("person_id", ich.person_id).is("erledigt_am", null).order("faellig", { nullsFirst: false }).limit(30),
        ]);
        const aufgaben = (auf ?? []).filter((a: any) => a.faellig && a.faellig <= heute).map((a: any) => ({ text: a.text, faellig: a.faellig, ueberfaellig: a.faellig < heute }));
        const aus: any = { seit, jetzt: jetzt(), rolle: ich.admin ? "admin" : (ich.aemter || []).some((a: string) => /^kassenwart/i.test(a)) ? "kassenwart" : "leitung",
          eingang, aufgaben, aufgabenOffen: (auf ?? []).length };
        const kassenwart = ich.admin || (ich.aemter || []).some((a: string) => /^kassenwart/i.test(a));
        if (kassenwart) {
          const [{ data: lei }, { data: ers }, { data: sp }, { data: fl }] = await Promise.all([
            db.from("kc_club_ausleihen").select("id,person_id,positionen,rueckgabe,status").in("status", ["genehmigt", "abgeholt"]),
            db.from("kc_club_erstattung").select("summe").eq("status", "eingereicht"),
            db.from("kc_club_vorschlaege").select("spenden").eq("art", "spende").eq("status", "offen"),
            db.from("kc_club_fl_faelle").select("betrag").eq("status", "offen").not("betrag", "is", null),
          ]);
          const leute = await personen((lei ?? []).map((a: any) => a.person_id));
          aus.kasse = {
            verliehen: (lei ?? []).length,
            rueckgabe: (lei ?? []).filter((a: any) => a.rueckgabe <= heute).map((a: any) => ({ wer: leute.get(a.person_id)?.display_name || a.person_id, was: (a.positionen ?? []).map((x: any) => `${x.anzahl}× ${x.name}`).join(", "), bis: a.rueckgabe, ueberfaellig: a.rueckgabe < heute })),
            erstattungen: (ers ?? []).length, erstattungenSumme: (ers ?? []).reduce((s: number, x: any) => s + Number(x.summe || 0), 0),
            spendenSumme: (sp ?? []).reduce((s: number, v: any) => s + spendenSumme(v.spenden), 0), spendenAnzahl: (sp ?? []).length,
            freudLeidSumme: (fl ?? []).reduce((s: number, x: any) => s + Number(x.betrag || 0), 0),
          };
        }
        if (ich.admin) {
          const PROGRAMMFEHLER = ["fehler_skript", "fehler_versprechen", "fehler_api", "fehler_laden"];
          const [{ data: pr }, { count: fehler }, groesse, status, { data: zug }] = await Promise.all([
            db.from("kc_club_protokoll").select("person_id,aktion,zeit,details").in("aktion", ["hilferuf", "fehler_sicherheit", "feedback_gesendet"]).gte("zeit", seit).order("zeit", { ascending: false }).limit(30),
            db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).in("aktion", PROGRAMMFEHLER).gte("zeit", seit),
            db.rpc("kc_club_db_groesse"),
            db.rpc("kc_club_sicherheit_status"),
            db.from("kc_club_zugang").select("person_id,app_version,zuletzt_gesehen").eq("aktiv", true).gte("zuletzt_gesehen", new Date(jetztMs - 30 * 86400000).toISOString()).not("person_id", "like", "KC-P-TEST%"),
          ]);
          const neuer = (a: string, b: string) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
          const alt = (zug ?? []).filter((z: any) => z.app_version && /^\d+\.\d+\.\d+$/.test(z.app_version) && neuer(SERVER_VERSION, z.app_version));
          const leute = await personen([...(pr ?? []).map((x: any) => x.person_id), ...alt.map((z: any) => z.person_id)]);
          const n = (pid: string) => leute.get(pid)?.display_name || pid;
          const st: any = status.data ?? null, bytes = typeof groesse.data === "number" ? groesse.data : Number(groesse.data);
          aus.technik = {
            meldungen: (pr ?? []).map((x: any) => ({ art: x.aktion === "hilferuf" ? "problem" : x.aktion === "fehler_sicherheit" ? "sicherheit" : "feedback", wer: n(x.person_id), zeit: x.zeit,
              text: x.aktion === "hilferuf" ? txt(x.details?.text, 120) || null : x.aktion === "fehler_sicherheit" ? (Number(x.details?.probleme) ? `${x.details.probleme} Punkt(e) offen` : "alles in Ordnung") : null })),
            programmfehler: fehler ?? null,
            db: Number.isFinite(bytes) && bytes > 0 ? { bytes, grenze: DB_GRENZE_BYTES, prozent: Math.round((bytes / DB_GRENZE_BYTES) * 100) } : null,
            spiegelMin: typeof st?.spiegel_min === "number" ? st.spiegel_min : null, sicherungMin: typeof st?.sicherung_min === "number" ? st.sicherung_min : null,
            sicherungAm: st?.sicherung_am ?? null, ueberwachungMin: typeof st?.ueberwachung_min === "number" ? st.ueberwachung_min : null,
            alteVersionen: alt.map((z: any) => ({ wer: n(z.person_id), version: z.app_version })).sort((a: any, b: any) => a.version.localeCompare(b.version, undefined, { numeric: true })),
            aktuell: SERVER_VERSION,
          };
        }
        // KC-CLUB-BEGRUESSUNG (1.51.0): wer heute zum ersten Mal in der App war und noch nicht begrüßt wurde (nur Admin)
        if (ich.admin) {
          const [{ data: neu }, { data: schon }] = await Promise.all([
            db.from("kc_club_zugang").select("person_id,erstmals_gesehen").gte("erstmals_gesehen", new Date(jetztMs - 26 * 3600000).toISOString()).not("person_id", "like", "KC-P-TEST%").neq("person_id", ich.person_id),
            db.from("kc_club_protokoll").select("details").eq("aktion", "begruessung_gesendet").gte("zeit", new Date(jetztMs - 7 * 86400000).toISOString()),
          ]);
          const begruesst = new Set((schon ?? []).map((x: any) => x.details?.fuer));
          const heuteNeu = (neu ?? []).filter((z: any) => berlinTag(new Date(z.erstmals_gesehen)) === heute && !begruesst.has(z.person_id));
          const lp = await personen(heuteNeu.map((z: any) => z.person_id));
          aus.neuDa = heuteNeu.map((z: any) => ({ person_id: z.person_id, name: lp.get(z.person_id)?.display_name || z.person_id, vorname: vorname(lp.get(z.person_id) ?? null), zeit: z.erstmals_gesehen }));
          // KC-CLUB-FP-UEBERWACHUNG (1.58.0): Fehlerprotokoll zu voll → fragen, ob geleert werden soll
          const fz = await fpZaehlen(); if (fz.anzahl >= FP_VOLL) aus.fpVoll = fz;
          // KC-CLUB-NOTBETRIEB-STUFE2 (1.54.0): was in den letzten 26 Std. aus dem Notbetrieb nachgetragen wurde – Probleme einzeln
          const { data: nt } = await db.from("kc_club_notbetrieb_eingang").select("person_id,aktion,status,ergebnis,geschrieben_am").gte("angenommen_am", new Date(jetztMs - 26 * 3600000).toISOString()).limit(500);
          if ((nt ?? []).length) {
            const ln = await personen((nt ?? []).map((x: any) => x.person_id).filter(Boolean));
            aus.notNachtrag = { erledigt: (nt ?? []).filter((x: any) => x.status === "erledigt").length, offen: (nt ?? []).filter((x: any) => x.status === "offen").length,
              probleme: (nt ?? []).filter((x: any) => x.status === "abgelehnt").slice(0, 20).map((x: any) => ({ name: ln.get(x.person_id)?.display_name || "Unbekannt", aktion: x.aktion, grund: x.ergebnis, zeit: x.geschrieben_am })) };
          }
        }
        return json(aus);
      }

      // KC-CLUB-BEGRUESSUNG (1.51.0): Begrüßung ist als Nachricht verschickt → in der Tages-Übersicht nicht mehr anbieten
      case "begruessung_vermerken": {
        nurAdmin(ich);
        const pid = String(p.person_id || "");
        if (!(await aktiveMitglieder()).some((m) => m.person_id === pid)) throw new Fehler("Mitglied nicht gefunden.", 404);
        await protokoll(ich.person_id, "begruessung_gesendet", { fuer: pid });
        return json({ ok: true });
      }

      // ----- KC-CLUB-LEIHEN (1.23.0): Vereinsgegenstände ausleihen – Anfrage an die Clubleitung, eine Zusage genügt -----
      case "leihen_liste": return json(await leihenListe(ich));

      case "leihen_anfrage": {
        const heute = berlinTag(new Date());
        const von = isoTag(p.abholung), bis = isoTag(p.rueckgabe);
        if (!von || !bis) throw new Fehler("Bitte Abholung und Rückgabe wählen.");
        if (von < heute) throw new Fehler("Die Abholung liegt in der Vergangenheit.");
        if (bis < von) throw new Fehler("Die Rückgabe liegt vor der Abholung.");
        if (von > tagDazu(heute, LEIH_VORLAUF_TAGE)) throw new Fehler("Bitte höchstens ein Jahr im Voraus anfragen.");
        if (bis > tagDazu(von, LEIH_MAX_TAGE)) throw new Fehler(`Höchstens ${LEIH_MAX_TAGE} Tage am Stück.`);
        const abSlot = slotWahl(p.abholung_slot), rueSlot = slotWahl(p.rueckgabe_slot);
        const zweck = p.zweck ? String(p.zweck) : null;
        if (zweck && !LEIH_ZWECKE[zweck]) throw new Fehler("Unbekannter Zweck.");
        const wunsch = new Map<string, number>();
        for (const x of Array.isArray(p.positionen) ? p.positionen : []) {
          const n = Math.floor(Number(x?.anzahl)); if (x?.id && n > 0) wunsch.set(String(x.id), (wunsch.get(String(x.id)) ?? 0) + n);
        }
        if (!wunsch.size) throw new Fehler("Bitte mindestens einen Gegenstand auswählen.");
        const { data: g } = await db.from("kc_club_leih_gegenstaende").select("id,name,sym,anzahl,aktiv").in("id", [...wunsch.keys()]);
        const positionen = [...wunsch].map(([id, anzahl]) => {
          const ge = (g ?? []).find((y: any) => y.id === id);
          if (!ge || !ge.aktiv) throw new Fehler("Ein Gegenstand ist nicht mehr verfügbar – bitte neu laden.", 409);
          return { id, name: ge.name, sym: ge.sym, anzahl };
        });
        await leihFreiPruefen(positionen, von, bis);
        const { data: a, error } = await db.from("kc_club_ausleihen").insert({ person_id: ich.person_id, positionen, abholung: von, abholung_slot: abSlot,
          rueckgabe: bis, rueckgabe_slot: rueSlot, zweck, notiz: txt(p.notiz, 500) || null }).select().single();
        if (error || !a) throw new Fehler("Anfrage konnte nicht gespeichert werden.", 500);
        const ziel = (await leitungIds()).filter((id) => id !== ich.person_id);
        const liste = leihZeilen(a);
        const versand = await sendenGewaehlt("club_nachricht", ziel, ["push", "email"], {
          titel: "📦 Anfrage Ausleihe", kurz: `${ich.name}: ${liste.join(", ")} · ${leihTag(von)}–${leihTag(bis)}`,
          betreff: `Köcheclub Werne – Anfrage Ausleihe von ${ich.name}`,
          text: `Hallo,\n\n${ich.name} möchte folgende Vereinssachen ausleihen:\n\n${liste.map((z: string) => "• " + z).join("\n")}\n\nAbholung: ${leihTag(von, abSlot)}\nRückgabe: ${leihTag(bis, rueSlot)}${zweck ? `\nZweck: ${LEIH_ZWECKE[zweck]}` : ""}${a.notiz ? `\nNotiz: ${a.notiz}` : ""}\n\nDie Anfrage ging an Clubsprecher, Kassenwart und Admin – eine Zusage genügt.\nGenehmigen oder ablehnen in der Köcheclub-App: ${APP_URL}#helfen\n\nViele Grüße\nKöcheclub-App`,
          url: APP_URL + "#helfen",
        }, `club-leihe:${a.id}`).catch(() => null);
        const abgelegt = await leihAblegen(ich, a, "Antrag");
        await protokoll(ich.person_id, "leihe_angefragt", { leihe: a.id, positionen: positionen.map((x) => ({ id: x.id, anzahl: x.anzahl })), von, bis, versand, abgelegt });
        return json({ ok: true, id: a.id, versand, abgelegt });
      }

      case "leihen_entscheiden": {
        nurVorstand(ich);
        const wahl = p.wahl === "genehmigt" ? "genehmigt" : p.wahl === "abgelehnt" ? "abgelehnt" : "";
        if (!wahl) throw new Fehler("Bitte genehmigen oder ablehnen.");
        const { data: a } = await db.from("kc_club_ausleihen").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!a) throw new Fehler("Anfrage nicht gefunden.", 404);
        if (a.status !== "angefragt") throw new Fehler("Darüber wurde schon entschieden.", 409);
        if (a.person_id === ich.person_id && (await leitungIds()).some((id) => id !== ich.person_id)) throw new Fehler("Über die eigene Anfrage entscheidet jemand anderes aus der Clubleitung.", 403);
        if (wahl === "genehmigt") await leihFreiPruefen(a.positionen ?? [], a.abholung, a.rueckgabe, a.id);
        const grund = txt(p.grund, 300) || null;
        // eine Zusage genügt: nur wer zuerst entscheidet, ändert den Status
        const { data: neu } = await db.from("kc_club_ausleihen").update({ status: wahl, entschieden_von: ich.person_id, entschieden_am: jetzt(), grund, geaendert_am: jetzt() })
          .eq("id", a.id).eq("status", "angefragt").select().maybeSingle();
        if (!neu) throw new Fehler("Darüber hat gerade schon jemand anderes entschieden.", 409);
        const liste = leihZeilen(neu);
        const versand = await sendenGewaehlt("club_nachricht", [a.person_id], ["push", "email"], {
          titel: wahl === "genehmigt" ? "✅ Ausleihe genehmigt" : "❌ Ausleihe abgelehnt", kurz: `${liste.join(", ")}${grund ? " – " + grund : ""}`,
          betreff: `Köcheclub Werne – deine Ausleihe wurde ${wahl === "genehmigt" ? "genehmigt" : "abgelehnt"}`,
          text: `Hallo,\n\n${ich.name} hat deine Anfrage ${wahl === "genehmigt" ? "genehmigt ✅" : "abgelehnt ❌"}:\n\n${liste.map((z: string) => "• " + z).join("\n")}\n\nAbholung: ${leihTag(neu.abholung, neu.abholung_slot)}\nRückgabe: ${leihTag(neu.rueckgabe, neu.rueckgabe_slot)}${grund ? `\n\nBegründung: ${grund}` : ""}\n\nIn der Köcheclub-App: ${APP_URL}#helfen\n\nViele Grüße\nKöcheclub Werne`,
          url: APP_URL + "#helfen",
        }, `club-leihe-bescheid:${a.id}`).catch(() => null);
        const abgelegt = await leihAblegen(ich, neu, "Bescheid");
        await protokoll(ich.person_id, "leihe_" + wahl, { leihe: a.id, fuer: a.person_id, versand, abgelegt });
        return json({ ok: true, versand, abgelegt });
      }

      case "leihen_status": {
        const status = ["abgeholt", "zurueck", "storniert"].includes(String(p.status)) ? String(p.status) : "";
        if (!status) throw new Fehler("Unbekannter Status.");
        const { data: a } = await db.from("kc_club_ausleihen").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!a) throw new Fehler("Ausleihe nicht gefunden.", 404);
        const eigen = a.person_id === ich.person_id;
        const erlaubt = status === "storniert" ? ["angefragt", "genehmigt"].includes(a.status) && (eigen || ich.vorstand)
          : status === "abgeholt" ? a.status === "genehmigt" && ich.vorstand
          : ["genehmigt", "abgeholt"].includes(a.status) && ich.vorstand;
        if (!erlaubt) throw new Fehler(ich.vorstand || eigen ? "Das passt nicht zum aktuellen Stand – bitte neu laden." : "Das darf nur die Clubleitung.", ich.vorstand || eigen ? 409 : 403);
        const { data: ok } = await db.from("kc_club_ausleihen").update({ status, geaendert_am: jetzt() }).eq("id", a.id).eq("status", a.status).select("id");
        if (!ok?.length) throw new Fehler("Der Stand hat sich gerade geändert – bitte neu laden.", 409);
        // Mitglied storniert eine schon genehmigte Ausleihe → wer genehmigt hat, erfährt es
        if (status === "storniert" && eigen && a.status === "genehmigt" && a.entschieden_von && a.entschieden_von !== ich.person_id) {
          await senden("club_nachricht", [a.entschieden_von], { titel: "🚫 Ausleihe storniert", kurz: `${ich.name}: ${leihZeilen(a).join(", ")}`,
            betreff: "Köcheclub Werne – Ausleihe storniert", text: `Hallo,\n\n${ich.name} braucht die genehmigte Ausleihe doch nicht:\n\n${leihZeilen(a).map((z: string) => "• " + z).join("\n")}\nAbholung war: ${leihTag(a.abholung, a.abholung_slot)}\n\nViele Grüße\nKöcheclub-App`,
            url: APP_URL + "#helfen" }, `club-leihe-storno:${a.id}`).catch(() => null);
        }
        await protokoll(ich.person_id, "leihe_" + status, { leihe: a.id, vorher: a.status });
        return json({ ok: true });
      }

      case "leihen_gegenstand": {
        nurVorstand(ich);
        const name = txt(p.name, 60), sym = txt(p.sym, 8) || "📦";
        const anzahl = Math.floor(Number(p.anzahl));
        if (!name) throw new Fehler("Bitte einen Namen angeben.");
        if (!(anzahl >= 0 && anzahl <= 999)) throw new Fehler("Anzahl 0 bis 999.");
        const daten: any = { name, sym, anzahl, aktiv: p.aktiv !== false, geaendert_am: jetzt() };
        if (p.sort !== undefined && Number.isFinite(Number(p.sort))) daten.sort = Math.floor(Number(p.sort));
        let alt: any = null;
        if (p.id) {
          ({ data: alt } = await db.from("kc_club_leih_gegenstaende").select("*").eq("id", String(p.id)).maybeSingle());
          if (!alt) throw new Fehler("Gegenstand nicht gefunden.", 404);
        }
        const { data: g, error } = alt ? await db.from("kc_club_leih_gegenstaende").update(daten).eq("id", alt.id).select().single()
          : await db.from("kc_club_leih_gegenstaende").insert({ ...daten, sort: daten.sort ?? 1000 }).select().single();
        if (error || !g) throw new Fehler(String(error?.message || "").includes("duplicate") ? "Diesen Gegenstand gibt es schon." : "Speichern fehlgeschlagen.", error?.code === "23505" ? 409 : 500);
        await protokoll(ich.person_id, alt ? "leihe_gegenstand_geaendert" : "leihe_gegenstand_neu", { gegenstand: g.id, vorher: alt, nachher: daten });
        return json({ ok: true, id: g.id });
      }

      // ----- KC-CLUB-HELFEN (1.23.0): „Wer kann helfen?“ – Aufruf an alle oder an alle gerade online -----
      case "hilfe_liste": return json(await hilfeListe(ich));

      // ----- KC-CLUB-BOERSE (1.43.0) -----
      case "boerse_liste": return json(await boerseListe(ich));
      case "boerse_speichern": {
        const art = p.art === "suche" ? "suche" : p.art === "biete" ? "biete" : "";
        if (!art) throw new Fehler("Bitte „Biete“ oder „Suche“ wählen.");
        const rubrik = String(p.rubrik || ""); if (!BOERSE_RUBRIKEN[rubrik]) throw new Fehler("Bitte eine Rubrik wählen.");
        const titel = txt(p.titel, 80); if (!titel || titel.length < 2) throw new Fehler("Bitte kurz schreiben, was du anbietest oder suchst.");
        const preis_art = BOERSE_PREIS[String(p.preis_art)] ? String(p.preis_art) : "vb";
        let preis: number | null = null;
        if (preis_art === "preis" || preis_art === "vb") {
          if (p.preis !== null && p.preis !== undefined && p.preis !== "") { preis = Math.round(Number(String(p.preis).replace(",", ".")) * 100) / 100; if (!(preis >= 0 && preis <= 99999)) throw new Fehler("Bitte einen Preis zwischen 0 und 99 999 € angeben."); }
          if (preis_art === "preis" && preis === null) throw new Fehler("Bitte den Preis eintragen – oder „Verhandlungsbasis“ wählen.");
        }
        const fotosRoh = (Array.isArray(p.fotos) ? p.fotos : []).map((x: unknown) => String(x)).slice(0, 3);
        let fotos: string[] = [];
        if (fotosRoh.length) { // nur eigene hochgeladene Bilder
          const { data: att } = await db.from("kc_communication_attachments").select("id,object_path,mime_type").in("id", fotosRoh);
          fotos = fotosRoh.filter((id: string) => (att ?? []).some((x: any) => x.id === id && String(x.object_path).startsWith(`club/${ich.person_id}/`) && /^image\//.test(String(x.mime_type))));
        }
        const zeile = { art, rubrik, titel, text: txt(p.text, 600) || null, preis_art, preis, fotos, geaendert_am: jetzt() };
        let id: string, alt: any = null;
        if (p.id) {
          alt = await boerseHolen(p.id);
          if (alt.von !== ich.person_id) throw new Fehler("Ändern darf nur, wer die Anzeige eingestellt hat.", 403);
          await db.from("kc_club_boerse").update(zeile).eq("id", alt.id); id = alt.id;
          const wegFotos = (alt.fotos ?? []).filter((f: string) => !fotos.includes(f)); if (wegFotos.length) await dateienEntfernen(wegFotos);
        } else {
          const { count } = await db.from("kc_club_boerse").select("id", { count: "exact", head: true }).eq("von", ich.person_id).eq("status", "aktiv");
          if ((count ?? 0) >= 15) throw new Fehler("Du hast schon 15 aktive Anzeigen – bitte erst eine erledigen.");
          const { data: neu, error } = await db.from("kc_club_boerse").insert({ ...zeile, von: ich.person_id, laeuft_bis: tagDazu(berlinTag(new Date()), BOERSE_TAGE) }).select("id").single();
          if (error || !neu) throw new Fehler("Anzeige konnte nicht gespeichert werden.", 500);
          id = neu.id;
        }
        // Treffer (Freigabe 3b): passende Gegen-Anzeigen anderer – deren Ersteller bekommt EINMAL Bescheid
        const heute = berlinTag(new Date());
        const { data: gegen } = await db.from("kc_club_boerse").select("*").eq("status", "aktiv").eq("art", art === "biete" ? "suche" : "biete").neq("von", ich.person_id).gte("laeuft_bis", heute).limit(300);
        const passend = (gegen ?? []).filter((g: any) => boersePasst({ titel }, g));
        let gemeldet = 0;
        for (const g of passend) {
          const { error: dopp } = await db.from("kc_club_boerse_treffer").insert({ anzeige_id: id, gegen_id: g.id });
          if (dopp) continue; // schon gemeldet
          await senden("club_nachricht", [g.von], {
            titel: art === "biete" ? "🛍️ Passt zu deiner Suche!" : "🛍️ Jemand sucht, was du anbietest",
            kurz: art === "biete" ? `${ich.name} bietet „${titel}“ – du suchst „${g.titel}“` : `${ich.name} sucht „${titel}“ – du bietest „${g.titel}“`,
            betreff: `Köcheclub Werne – Börse: ${art === "biete" ? "passendes Angebot" : "passende Suche"} zu „${g.titel}“`,
            text: `Hallo,\n\nin der Club-Börse gibt es etwas Passendes zu deiner Anzeige „${g.titel}“:\n\n${ich.name} ${art === "biete" ? "bietet" : "sucht"}: ${titel}\n\nAnsehen und Kontakt aufnehmen in der Köcheclub-App:\n${APP_URL}#boerse=${id}\n\nViele Grüße\nKöcheclub Werne`,
            url: `${APP_URL}#boerse=${id}`,
          }, `club-boerse-treffer:${id}:${g.id}`).catch(() => null);
          gemeldet++;
        }
        await protokoll(ich.person_id, p.id ? "boerse_geaendert" : "boerse_angelegt", { anzeige: id, art, rubrik, titel, fotos: fotos.length, treffer: passend.length, gemeldet });
        return json({ ok: true, id, treffer: passend.length, gemeldet });
      }
      case "boerse_status": {
        const a = await boerseHolen(p.id), was = String(p.was || "");
        const eigen = a.von === ich.person_id;
        if (was === "verlaengern") {
          if (!eigen) throw new Fehler("Verlängern darf nur, wer die Anzeige eingestellt hat.", 403);
          const tage = Number(p.tage); if (!BOERSE_VERLAENGERN.includes(tage)) throw new Fehler("Bitte 7, 14 oder 30 Tage wählen.");
          const heute = berlinTag(new Date()), basis = a.status === "aktiv" && a.laeuft_bis >= heute ? a.laeuft_bis : heute;
          const bis = tagDazu(basis, tage);
          if (bis > tagDazu(heute, BOERSE_MAX_VORLAUF)) throw new Fehler(`Höchstens ${BOERSE_MAX_VORLAUF} Tage im Voraus – bitte später nochmal verlängern.`);
          await db.from("kc_club_boerse").update({ status: "aktiv", laeuft_bis: bis, erinnert_am: null, geaendert_am: jetzt() }).eq("id", a.id);
          await protokoll(ich.person_id, "boerse_verlaengert", { anzeige: a.id, bis });
          return json({ ok: true, laeuft_bis: bis });
        }
        if (was === "auslaufen") { // „auslaufen lassen“ – nichts ändern, nur Erinnerung abhaken
          if (!eigen) throw new Fehler("Nur für deine eigene Anzeige.", 403);
          await protokoll(ich.person_id, "boerse_auslaufen", { anzeige: a.id });
          return json({ ok: true });
        }
        if (was === "erledigt") {
          if (!eigen) throw new Fehler("Als erledigt markieren darf nur, wer die Anzeige eingestellt hat.", 403);
          await db.from("kc_club_boerse").update({ status: "erledigt", geaendert_am: jetzt() }).eq("id", a.id);
          await protokoll(ich.person_id, "boerse_erledigt", { anzeige: a.id });
          return json({ ok: true });
        }
        if (was === "loeschen") {
          if (!eigen && !ich.vorstand) throw new Fehler("Löschen darf nur, wer die Anzeige eingestellt hat (oder die Clubleitung).", 403);
          await db.from("kc_club_boerse").update({ status: "geloescht", geaendert_am: jetzt() }).eq("id", a.id);
          await dateienEntfernen(a.fotos ?? []);
          await protokoll(ich.person_id, eigen ? "boerse_geloescht" : "boerse_entfernt_leitung", { anzeige: a.id, von: a.von, titel: a.titel });
          return json({ ok: true });
        }
        throw new Fehler("Unbekannte Aktion.");
      }

      // KC-CLUB-HILFE-ANGEBOT (1.42.0): eigenes Angebot anlegen/ändern – es wird nichts verschickt
      case "hilfe_angebot_speichern": {
        const titel = txt(p.titel, 80), text = txt(p.text, 600) || null;
        if (!titel || titel.length < 2) throw new Fehler("Bitte kurz schreiben, wobei du helfen kannst.");
        const sym = HILFE_ANGEBOT_SYMBOLE.includes(String(p.sym)) ? String(p.sym) : "🤲";
        if (p.id) {
          const { data: a } = await db.from("kc_club_hilfe_angebote").select("von,aktiv").eq("id", String(p.id)).maybeSingle();
          if (!a || !a.aktiv) throw new Fehler("Angebot nicht gefunden.", 404);
          if (a.von !== ich.person_id && !ich.vorstand) throw new Fehler("Ändern darf nur, wer das Angebot eingestellt hat.", 403);
          await db.from("kc_club_hilfe_angebote").update({ sym, titel, text, geaendert_am: jetzt() }).eq("id", String(p.id));
          await protokoll(ich.person_id, "hilfe_angebot_geaendert", { angebot: p.id, titel });
          return json({ ok: true, id: p.id });
        }
        const { count } = await db.from("kc_club_hilfe_angebote").select("id", { count: "exact", head: true }).eq("von", ich.person_id).eq("aktiv", true);
        if ((count ?? 0) >= 10) throw new Fehler("Du hast schon 10 Angebote – bitte erst eines beenden.");
        const { data: neu, error } = await db.from("kc_club_hilfe_angebote").insert({ von: ich.person_id, sym, titel, text }).select("id").single();
        if (error || !neu) throw new Fehler("Angebot konnte nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, "hilfe_angebot_angelegt", { angebot: neu.id, titel });
        return json({ ok: true, id: neu.id });
      }
      case "hilfe_angebot_beenden": {
        const { data: a } = await db.from("kc_club_hilfe_angebote").select("von,titel,aktiv").eq("id", String(p.id || "")).maybeSingle();
        if (!a || !a.aktiv) throw new Fehler("Angebot nicht gefunden.", 404);
        if (a.von !== ich.person_id && !ich.vorstand) throw new Fehler("Beenden darf nur, wer das Angebot eingestellt hat.", 403);
        await db.from("kc_club_hilfe_angebote").update({ aktiv: false, geaendert_am: jetzt() }).eq("id", String(p.id));
        await protokoll(ich.person_id, "hilfe_angebot_beendet", { angebot: p.id, titel: a.titel });
        return json({ ok: true });
      }

      case "hilfe_aufruf": {
        const heute = berlinTag(new Date());
        const art = String(p.art || "");
        if (!HILFE_ARTEN[art]) throw new Fehler("Bitte auswählen, wobei geholfen werden soll.");
        const datum = isoTag(p.datum);
        if (!datum || datum < heute) throw new Fehler("Bitte einen Tag ab heute wählen.");
        if (datum > tagDazu(heute, HILFE_VORLAUF_TAGE)) throw new Fehler("Bitte höchstens ein halbes Jahr im Voraus.");
        const slot = slotWahl(p.slot), anzahl = Math.min(20, Math.max(1, Math.floor(Number(p.anzahl) || 1)));
        const ziel = p.ziel === "online" ? "online" : "alle";
        const { data: h, error } = await db.from("kc_club_hilfe_aufrufe").insert({ von: ich.person_id, art, datum, slot, anzahl, ort: txt(p.ort, 80) || null,
          notiz: txt(p.notiz, 300) || null, ziel }).select().single();
        if (error || !h) throw new Fehler("Aufruf konnte nicht gespeichert werden.", 500);
        const empf = (ziel === "online" ? [...await onlineJetzt()] : (await aktiveMitglieder()).map((m) => m.person_id)).filter((id) => id !== ich.person_id);
        const was = HILFE_ARTEN[art], wann2 = leihTag(datum, slot);
        const vars = {
          titel: `🙋 Wer kann helfen? ${was}`, kurz: `${ich.name} sucht ${anzahl} Helfer · ${wann2}${h.ort ? " · " + h.ort : ""}`,
          betreff: `Köcheclub Werne – Wer kann helfen? ${was.replace(/^\S+\s/, "")} am ${datum.split("-").reverse().join(".")}`,
          text: `Hallo,\n\n${ich.name} sucht Hilfe:\n\n${was}\nWann: ${wann2}\nGesucht: ${anzahl} ${anzahl === 1 ? "Person" : "Personen"}${h.ort ? `\nWo: ${h.ort}` : ""}${h.notiz ? `\n\n${h.notiz}` : ""}\n\nMit einem Tipp zusagen in der Köcheclub-App: ${APP_URL}#helfen\n\nViele Grüße\nKöcheclub Werne`,
          url: APP_URL + "#helfen",
        };
        const versand = !empf.length ? { gesendet: 0 } : ziel === "online" ? await sendenGewaehlt("club_nachricht", empf, ["push"], vars, `club-hilfe:${h.id}`).catch(() => null)
          : await senden("club_nachricht", empf, vars, `club-hilfe:${h.id}`).catch(() => null);
        await protokoll(ich.person_id, "hilfe_aufruf", { aufruf: h.id, art, datum, anzahl, ziel, empfaenger: empf.length, versand });
        return json({ ok: true, id: h.id, versand, empfaenger: empf.length });
      }

      case "hilfe_antwort": {
        const { data: h } = await db.from("kc_club_hilfe_aufrufe").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!h) throw new Fehler("Aufruf nicht gefunden.", 404);
        if (h.geschlossen_am || h.datum < berlinTag(new Date())) throw new Fehler("Dieser Aufruf ist schon geschlossen.", 409);
        const antwort = p.antwort === "komme" ? "komme" : p.antwort === "kann_nicht" ? "kann_nicht" : null;
        const { data: vorher } = await db.from("kc_club_hilfe_antworten").select("antwort").eq("aufruf_id", h.id).eq("person_id", ich.person_id).maybeSingle();
        if (antwort) await db.from("kc_club_hilfe_antworten").upsert({ aufruf_id: h.id, person_id: ich.person_id, antwort, am: jetzt() });
        else await db.from("kc_club_hilfe_antworten").delete().eq("aufruf_id", h.id).eq("person_id", ich.person_id);
        if (antwort === "komme" && vorher?.antwort !== "komme" && h.von !== ich.person_id) {
          const { count } = await db.from("kc_club_hilfe_antworten").select("person_id", { count: "exact", head: true }).eq("aufruf_id", h.id).eq("antwort", "komme");
          const voll = (count ?? 0) >= h.anzahl;
          // „voll“ nur einmal melden
          const vollNeu = voll && !h.voll_gemeldet_am ? !!(await db.from("kc_club_hilfe_aufrufe").update({ voll_gemeldet_am: jetzt() }).eq("id", h.id).is("voll_gemeldet_am", null).select("id")).data?.length : false;
          await senden("club_nachricht", [h.von], {
            titel: vollNeu ? "🎉 Genug Helfer!" : "✋ Zusage", kurz: `${ich.name} kommt – ${HILFE_ARTEN[h.art]} ${leihTag(h.datum, h.slot)} (${count ?? 0} von ${h.anzahl})`,
            betreff: `Köcheclub Werne – ${vollNeu ? "genug Helfer" : "Zusage"}: ${HILFE_ARTEN[h.art].replace(/^\S+\s/, "")}`,
            text: `Hallo,\n\n${ich.name} hat für deinen Aufruf zugesagt:\n${HILFE_ARTEN[h.art]} · ${leihTag(h.datum, h.slot)}\n\nZusagen: ${count ?? 0} von ${h.anzahl}${vollNeu ? "\n\n🎉 Damit sind genug Helfer zusammen." : ""}\n\n${APP_URL}#helfen\n\nViele Grüße\nKöcheclub-App`,
            url: APP_URL + "#helfen",
          }, `club-hilfe-zusage:${h.id}:${ich.person_id}`).catch(() => null);
        }
        await protokoll(ich.person_id, "hilfe_antwort", { aufruf: h.id, antwort });
        return json({ ok: true });
      }

      case "hilfe_schliessen": {
        const { data: h } = await db.from("kc_club_hilfe_aufrufe").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!h) throw new Fehler("Aufruf nicht gefunden.", 404);
        if (h.von !== ich.person_id && !ich.vorstand) throw new Fehler("Schließen kann nur, wer den Aufruf gestartet hat – oder die Clubleitung.", 403);
        await db.from("kc_club_hilfe_aufrufe").update({ geschlossen_am: jetzt() }).eq("id", h.id).is("geschlossen_am", null);
        await protokoll(ich.person_id, "hilfe_geschlossen", { aufruf: h.id });
        return json({ ok: true });
      }

      // ----- Dienstzeiten aus dem Dienstplan (nur veröffentlichter Sollplan) -----
      // ----- KC-CLUB-DIENSTWUNSCH (0.59.0): Twinkey aus DP2 in der Club-App – Daten laden / Wunschstand in den Eingang legen -----
      // ----- KC-CLUB-BESTAETIGUNG (1.69.0, Wunsch Hansi): Aufstellung der eigenen Eingaben als Bestätigung (App-Nachricht + E-Mail) -----
      case "meine_eingaben": {
        if (p.art === "erstattung") {
          const { data: a } = await db.from("kc_club_erstattung").select("id,positionen,summe,auszahlung,bemerkung,status,erstellt_am").eq("id", String(p.id || "")).eq("person_id", ich.person_id).maybeSingle();
          if (!a) throw new Fehler("Antrag nicht gefunden.", 404);
          return json({ art: "erstattung", antrag: { id: a.id, summe: Number(a.summe), anzahl: (a.positionen || []).length, status: a.status, zeit: a.erstellt_am, auszahlung: a.auszahlung, positionen: a.positionen || [], bemerkung: a.bemerkung ?? null } });
        }
        return json({ art: "dienstwunsch", ...(await dienstwunschAufstellung(ich)) });
      }
      case "eingaben_bestaetigen": {
        // nur Dienstwünsche (Erstattung bestätigt sich beim Senden selbst); höchstens 1× je 2 Minuten
        const a = await dienstwunschAufstellung(ich);
        if (!a.tage.length) throw new Fehler("Es sind noch keine Dienstwünsche gespeichert.", 409);
        const { count } = await db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).eq("person_id", ich.person_id).eq("aktion", "dienstwunsch_bestaetigt").gte("zeit", new Date(Date.now() - 120_000).toISOString());
        if (count) throw new Fehler("Die Bestätigung ist gerade erst verschickt worden – bitte kurz warten.", 429);
        const zeilen = a.tage.map((t: any) => `${t.tag}:\n${t.zeilen.map((z: string) => "   " + z).join("\n")}`).join("\n\n");
        const url = `${APP_URL}#bestaetigung=dienstwunsch`;
        const text = `Hallo ${ich.vorname},\n\n${a.hinweis}\n\nDeine Dienstwünsche (Stand ${a.stand}):\n\n${zeilen}\n\n────────────\n${a.tage.length} Tag${a.tage.length === 1 ? "" : "e"} · ${a.freigabe ? "Kollegen dürfen deine Zeiten sehen" : "nur für die Planung sichtbar"}\n\nDie Aufstellung zum Ansehen, Drucken oder als PDF:\n${url}\n\nÄnderungen sind jederzeit möglich, solange die Wunschphase läuft.\n\nViele Grüße\nKöcheclub-App`;
        const versand = await routerSenden("club_nachricht_beide", [ich.person_id], {
          titel: "✅ Deine Dienstwünsche sind gespeichert", kurz: `${a.tage.length} Tage · Stand ${a.stand} – 📄 Aufstellung öffnen`,
          betreff: `Köcheclub Werne – Bestätigung deiner Dienstwünsche (${DW.name})`, text, url,
        }, `club-bestaetigung-dw:${ich.person_id}:${a.revision}:${Date.now()}`);
        await protokoll(ich.person_id, "dienstwunsch_bestaetigt", { revision: a.revision, tage: a.tage.length, versand });
        return json({ ok: true, ...versand });
      }

      case "eingaben_ablegen": {
        // KC-CLUB-EINGABEN-ARCHIV (1.69.2): eigene Aufstellung in den eigenen Archiv-Ordner (sofort sichtbar)
        const teil = p.art === "erstattung" ? `erstattung:${txt(p.id, 60)}` : "dienstwunsch";
        const r = await eingabenArchivieren(ich, [teil], ich.person_id);
        if (!r.abgelegt) throw new Fehler("Es gibt noch nichts zum Ablegen.", 409);
        return json({ ok: true, ...r });
      }

      case "dienstwunsch_laden": {
        const [{ data: phase }, { data: tage }, { data: meine }, { data: geteilt }, { data: freigaben }, { data: schichten }, { data: verz }] = await Promise.all([
          db.from("kc_dp_wish_phase_settings").select("status,close_at,deadline_date").eq("org_id", ORG).eq("project_id", DW.projekt).maybeSingle(),
          db.from("kc_dp_days_published").select("work_date,day_type,day_start,day_end,core_start,core_end,pre_open_minutes,demand,program,label,published_at")
            .eq("org_id", ORG).eq("event_id", DW.veranstaltung).eq("status", "published").order("work_date"),
          db.from("kc_dp_wish_inbox").select("revision,status,entries,standby,comment,share_with_colleagues,submitted_at,taken_at,result")
            .eq("org_id", ORG).eq("event_id", DW.veranstaltung).eq("person_id", ich.person_id).eq("source", "club_app").maybeSingle(),
          db.from("kc_dp_wish_inbox").select("person_id,entries").eq("org_id", ORG).eq("event_id", DW.veranstaltung).eq("share_with_colleagues", true).neq("person_id", ich.person_id),
          db.from("kc_dp_plan_sharing").select("person_id,plan_kind,allow_view,allow_copy").eq("org_id", ORG),
          db.from("kc_dp_plan_published").select("source_shift_id,work_date,start_time,end_time,break_minutes,zone,area,published_at")
            .eq("org_id", ORG).eq("event_id", DW.veranstaltung).eq("person_id", ich.person_id).eq("status", "published"),
          db.from("kc_core_operational_directory").select("person_id,display_name,active").eq("org_id", ORG).eq("person_id", ich.person_id).maybeSingle(),
        ]);
        // Freigaben „Kollegen dürfen meine Zeiten sehen/übernehmen“: DP2-Tabelle + was Mitglieder in der Club-App gewählt haben
        const kollegen = (geteilt ?? []).map((x: any) => ({ personId: x.person_id, entries: (x.entries ?? []).filter((e: any) => ["available", "if_needed", "preferred"].includes(e.wishType)) }));
        const teilen = [...(freigaben ?? [])];
        for (const k of kollegen) for (const art of ["can", "wish", "standby"]) if (!teilen.some((r: any) => r.person_id === k.personId && r.plan_kind === art))
          teilen.push({ person_id: k.personId, plan_kind: art, allow_view: true, allow_copy: true });
        return json({ vertrag: DW.vertrag, veranstaltung: DW.veranstaltung, name: DW.name,
          ich: { personId: ich.person_id, name: ich.name, imDienstplan: !!verz?.active },
          wunschphase: phase ? { status: phase.status, bis: phase.close_at, frist: phase.deadline_date } : null,
          tage: tage ?? [], meine: meine ?? null, kollegen, teilen, schichten: schichten ?? [] });
      }

      case "dienstwunsch_speichern": {
        const { data: phase } = await db.from("kc_dp_wish_phase_settings").select("status").eq("org_id", ORG).eq("project_id", DW.projekt).maybeSingle();
        if (phase?.status !== "open") throw new Fehler("Die Wunschphase ist geschlossen – Wünsche können gerade nicht geändert werden.", 409);
        const { data: tage } = await db.from("kc_dp_days_published").select("work_date").eq("org_id", ORG).eq("event_id", DW.veranstaltung).eq("status", "published");
        const erlaubt = new Set((tage ?? []).map((t: any) => t.work_date));
        const zahl = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n <= 24 ? Math.round(n * 100) / 100 : null; };
        const roh = Array.isArray(p.entries) ? p.entries : [];
        if (roh.length > DW.maxEintraege) throw new Fehler("Zu viele Einträge.", 400);
        // Bereitschaft wie DP2 (answer yes/no/offen, Zeitfenster) – für standby je Tag und assistantDay.standby je Wunsch
        const bereitschaft = (b: any) => ({ answer: b?.answer === "yes" ? "yes" : b?.answer === "no" ? "no" : null,
          slots: (Array.isArray(b?.slots) ? b.slots : []).slice(0, 10).map((x: any) => ({ start: zahl(x?.start), end: zahl(x?.end),
            ...(DW.zonen.includes(String(x?.wishZone)) ? { wishZone: x.wishZone } : {}), ...(typeof x?.reserve === "boolean" ? { reserve: x.reserve } : {}) })) }); // nur Felder, die DP2 gesetzt hat
        const entries = roh.map((e: any) => {
          const w: Record<string, unknown> = { date: String(e?.date ?? ""), start: zahl(e?.start), end: zahl(e?.end), wishType: String(e?.wishType ?? ""),
            wishZone: DW.zonen.includes(String(e?.wishZone)) ? String(e.wishZone) : "B", scope: e?.scope === "day" ? "day" : "time", comment: txt(e?.comment, 300) };
          if (e?.onlyIfNeeded === true) w.onlyIfNeeded = true;
          // Twinkey-Tagesstatus („Fertig“) unverändert mitführen, damit DP2 und Club denselben Stand zeigen
          const a = e?.assistantDay;
          if (a && typeof a === "object") w.assistantDay = { completed: a.completed === true,
            completedSignature: typeof a.completedSignature === "string" ? a.completedSignature.slice(0, 8000) : null,
            ...(a.standby && typeof a.standby === "object" ? { standby: bereitschaft(a.standby) } : {}) };
          return w as any;
        });
        for (const e of entries) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || (erlaubt.size && !erlaubt.has(e.date))) throw new Fehler(`Tag ${e.date} gehört nicht zur Veranstaltung.`, 400);
          if (!DW.typen.includes(e.wishType) || e.start === null || e.end === null || !(e.end > e.start)) throw new Fehler(`Ungültige Zeit am ${e.date}.`, 400);
          if (e.scope === "day" && e.wishType !== "unavailable") throw new Fehler("Ganztägig geht nur als Sperrtag.", 400);
        }
        const standby: Record<string, unknown> = {};
        for (const [tag, b] of Object.entries(p.standby && typeof p.standby === "object" ? p.standby : {}).slice(0, 60) as [string, any][]) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(tag)) continue;
          standby[tag] = bereitschaft(b);
        }
        const teilen = typeof p.teilen === "boolean" ? p.teilen : null;
        const { data: alt } = await db.from("kc_dp_wish_inbox").select("id,revision").eq("org_id", ORG).eq("event_id", DW.veranstaltung).eq("person_id", ich.person_id).eq("source", "club_app").maybeSingle();
        const zeile = { org_id: ORG, event_id: DW.veranstaltung, person_id: ich.person_id, source: "club_app", status: "offen", entries, standby,
          comment: txt(p.comment, 500) || null, share_with_colleagues: teilen, submitted_at: jetzt(), updated_at: jetzt() };
        const r = alt ? await db.from("kc_dp_wish_inbox").update({ ...zeile, revision: alt.revision + 1 }).eq("id", alt.id).select("revision").single()
          : await db.from("kc_dp_wish_inbox").insert({ ...zeile, revision: 1 }).select("revision").single();
        if (r.error) throw new Fehler("Wünsche konnten nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, "dienstwunsch_gespeichert", { eintraege: entries.length, bereitschaftTage: Object.keys(standby).length, revision: r.data.revision });
        return json({ ok: true, revision: r.data.revision, status: "offen" });
      }

      case "dienste": {
        const datum = (s: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) ? String(s) : null;
        const von = datum(p.von) ?? berlinTag(new Date());
        const bis = datum(p.bis) ?? berlinTag(new Date(Date.now() + 13 * 86400000));
        if (bis < von || (new Date(bis).getTime() - new Date(von).getTime()) > 62 * 86400000) throw new Fehler("Bitte höchstens zwei Monate auf einmal anzeigen.");
        const [mitglieder, { data: fr }] = await Promise.all([
          aktiveMitglieder(),
          db.from("kc_club_freigaben").select("person_id,erlaubt").eq("bereich", "dienstzeiten").eq("erlaubt", true),
        ]);
        const freigegeben = new Set((fr ?? []).map((x: any) => x.person_id));
        // sichtbar: ich selbst immer, andere nur mit eigener Freigabe
        const sichtbar = mitglieder.filter((m) => m.person_id === ich.person_id || freigegeben.has(m.person_id));
        const erlaubt = new Set(sichtbar.map((m) => m.person_id));
        const gewaehlt = (Array.isArray(p.personen) && p.personen.length ? p.personen.map(String) : [ich.person_id]).filter((id: string) => erlaubt.has(id)).slice(0, 8);
        const { data: sch } = gewaehlt.length ? await db.from("kc_dp_plan_published")
          .select("person_id,work_date,start_time,end_time,break_minutes,zone,area,published_at")
          .eq("org_id", ORG).eq("status", "published").in("person_id", gewaehlt).gte("work_date", von).lte("work_date", bis)
          .order("work_date").order("start_time") : { data: [] as any[] };
        const { data: letzte } = await db.from("kc_dp_plan_published").select("published_at").eq("org_id", ORG).eq("status", "published").order("published_at", { ascending: false }).limit(1);
        return json({
          von, bis, freigabe: freigegeben.has(ich.person_id),
          personen: sichtbar.map((m) => ({ person_id: m.person_id, name: m.display_name, vorname: vorname(m), ich: m.person_id === ich.person_id })),
          gewaehlt,
          dienste: (sch ?? []).map((s: any) => ({ person_id: s.person_id, datum: s.work_date, start: String(s.start_time ?? "").slice(0, 5), ende: String(s.end_time ?? "").slice(0, 5), pause: s.break_minutes ?? 0, bereich: s.area, zone: s.zone })),
          stand: letzte?.[0]?.published_at ?? null,
        });
      }

      // ----- Kalender (KC-CLUB-KALENDER): Treffen, eigene Dienste, Abstimmungsfristen, Tagesordnung, Geburtstage -----
      case "kalender": {
        const datum = (s: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) ? String(s) : null;
        const von = datum(p.von), bis = datum(p.bis);
        if (!von || !bis || bis < von || (new Date(bis).getTime() - new Date(von).getTime()) > 62 * 86400000) throw new Fehler("Ungültiger Zeitraum.");
        // Tagesgrenzen in deutscher Zeit (großzügig ±1 Tag, genaue Zuordnung macht die App)
        const zeitraum = { von: new Date(new Date(von).getTime() - 86400000).toISOString(), bis: new Date(new Date(bis).getTime() + 2 * 86400000).toISOString() };
        const [treffen, { data: dienste }, { data: fristen }, geburtstage, akt, anfragen, privat] = await Promise.all([
          treffenListe(ich, false, zeitraum),
          db.from("kc_dp_plan_published").select("work_date,start_time,end_time,area").eq("org_id", ORG).eq("status", "published")
            .eq("person_id", ich.person_id).gte("work_date", von).lte("work_date", bis).order("work_date").order("start_time"),
          db.from("kc_club_vorschlaege").select("id,titel,frist,status").eq("art", "abstimmung").neq("status", "zurueckgezogen").gte("frist", zeitraum.von).lt("frist", zeitraum.bis),
          geburtstageSichtbar(ich),
          aktionenRoh(),
          terminanfragenListe(ich, zeitraum), // KC-CLUB-TERMINANFRAGE (0.92.0)
          privatListe(ich, zeitraum.von, zeitraum.bis), // KC-CLUB-PRIVATTERMIN (1.0.0) – nur meine
        ]);
        const tids = treffen.map((t: any) => t.id);
        const { data: themen } = tids.length ? await db.from("kc_club_vorschlaege").select("treffen_id,titel").in("art", ["thema", "spende"]).neq("status", "zurueckgezogen").in("treffen_id", tids) : { data: [] as any[] };
        return json({
          treffen: treffen.map((t: any) => ({ ...t, themen: (themen ?? []).filter((x: any) => x.treffen_id === t.id).map((x: any) => x.titel) })),
          dienste: (dienste ?? []).map((s: any) => ({ datum: s.work_date, start: String(s.start_time).slice(0, 5), ende: String(s.end_time).slice(0, 5), bereich: s.area })),
          fristen: (fristen ?? []).map((v: any) => ({ id: v.id, titel: v.titel, frist: v.frist, offen: v.status === "offen" })),
          // Datenschutz: nur freigegebene, nur Tag und Monat, kein Geburtsjahr
          geburtstage,
          // KC-CLUB-AKTIONEN: nur Titel und Zeitraum (Details unter „Aktionen“)
          aktionen: akt.liste.filter((a: any) => a.dateFrom <= bis && (a.dateTo || a.dateFrom) >= von)
            .map((a: any) => ({ id: String(a.id), titel: txt(a.activity, 200) || "Aktion", veranstalter: txt(a.organizer, 120) || null, von: a.dateFrom, bis: a.dateTo || a.dateFrom })),
          // KC-CLUB-TERMINANFRAGE: eigene und empfangene, abgelehnte (Nein) nicht
          anfragen: anfragen.filter((x: any) => x.status !== "abgesagt" && (x.vonMir || x.meine !== "nein")),
          privat,
        });
      }

      case "benachrichtigung_setzen": {
        const bereich = String(p.bereich || "");
        if (!BEREICHE.includes(bereich)) throw new Fehler("Unbekannter Bereich.");
        await db.from("kc_club_benachrichtigung").upsert({ person_id: ich.person_id, bereich, push: !!p.push, email: !!p.email, geaendert_am: jetzt() });
        await protokoll(ich.person_id, "benachrichtigung_gesetzt", { bereich, push: !!p.push, email: !!p.email });
        return json({ ok: true });
      }

      case "kontakt_freigabe": {
        const feld = String(p.feld || "");
        if (!KONTAKT_FELDER.includes(feld)) throw new Fehler("Unbekannte Angabe.");
        await db.from("kc_club_freigaben").upsert({ person_id: ich.person_id, bereich: "kontakt_" + feld, erlaubt: !!p.erlaubt, geaendert_am: jetzt() });
        await protokoll(ich.person_id, "kontakt_freigabe", { feld, erlaubt: !!p.erlaubt });
        return json({ ok: true });
      }

      case "mitglied_details": {
        const pid = String(p.person_id || "");
        const { data: pe } = await db.from("kc_core_people").select("person_id,display_name,given_name,family_name,preferred_name,phone,email,street,postal_code,city,birth_date,active,org_id")
          .eq("person_id", pid).maybeSingle();
        if (!pe?.active || pe.org_id !== ORG) throw new Fehler("Mitglied nicht gefunden.", 404);
        const selbst = pid === ich.person_id;
        const [{ data: fr }, { data: rolle }, st] = await Promise.all([
          db.from("kc_club_freigaben").select("bereich,erlaubt").eq("person_id", pid),
          db.from("kc_club_rollen").select("aemter").eq("person_id", pid).maybeSingle(),
          statusMap([pid], true),
        ]);
        const frei = (b: string) => !!(fr ?? []).find((x: any) => x.bereich === b)?.erlaubt;
        const darf = (f: string) => selbst || ich.admin || (ich.kontakte && frei("kontakt_" + f));
        const festnetz = darf("festnetz") ? await festnetzAusManager(pe) : null;
        const werte: Record<string, unknown> = {
          handy: txt(pe.phone, 40) || null, festnetz, mail: txt(pe.email, 120) || null,
          adresse: pe.street || pe.city ? { strasse: txt(pe.street, 120), plz: txt(pe.postal_code, 10), ort: txt(pe.city, 80) } : null,
        };
        const kontakt: Record<string, unknown> = {};
        for (const f of KONTAKT_FELDER) if (darf(f) && werte[f]) kontakt[f] = werte[f];
        // KC-CLUB-NOTFALL: nur man selbst und die Organisation (Clubsprecher, Kassenwart, Admin)
        const { data: nf } = selbst || ich.vorstand ? await db.from("kc_club_notfall").select("name,telefon,beziehung").eq("person_id", pid).maybeSingle() : { data: null };
        await protokoll(ich.person_id, "mitglied_details", { fuer: pid, felder: Object.keys(kontakt), notfall: !!nf });
        return json({
          person_id: pid, name: pe.display_name, vorname: vorname(pe), aemter: rolle?.aemter ?? [], status: st.get(pid) ?? null, selbst,
          geburtstag: pe.birth_date && (selbst || frei("geburtstag")) ? String(pe.birth_date).slice(5, 10) : null,
          kontakt,
          // welche Angaben freigegeben sind (nur für mich selbst bzw. Admin – für „nur für dich sichtbar“)
          ...(selbst || ich.admin ? { freigegeben: Object.fromEntries(KONTAKT_FELDER.map((f) => [f, frei("kontakt_" + f)])) } : {}),
          darfKontakte: ich.kontakte || ich.admin,
          notfall: nf ?? null,
          zuletztDa: selbst ? null : (await zuletztDaMap(ich, [pid])).get(pid) ?? null, // KC-CLUB-ZULETZT-DA (1.20.0)
        });
      }

      case "sos_kontakte": {
        // KC-CLUB-SOS (1.6.0): Kontaktangaben der aktiven Mitglieder – nur was das Mitglied freigegeben hat (bzw. Admin/man selbst),
        // Notfallkontakte wie bisher nur für die Clubleitung (Clubsprecher, Kassenwart, Admin) und für sich selbst.
        const leute = await aktiveMitglieder();
        const ids = leute.map((m) => m.person_id);
        const [{ data: pe }, { data: fr }, { data: rollen }, { data: nf }, { data: mg }] = await Promise.all([
          db.from("kc_core_people").select("person_id,phone,email").in("person_id", ids),
          db.from("kc_club_freigaben").select("person_id,bereich,erlaubt").in("person_id", ids).like("bereich", "kontakt_%"),
          db.from("kc_club_rollen").select("person_id,aemter,ist_admin,ist_vorstand").in("person_id", ids),
          ich.vorstand ? db.from("kc_club_notfall").select("person_id,name,telefon,beziehung").in("person_id", ids) : db.from("kc_club_notfall").select("person_id,name,telefon,beziehung").eq("person_id", ich.person_id),
          db.from(AKTIONEN_QUELLE.tabelle).select("payload").eq("org_id", ORG).eq("section_key", AKTIONEN_QUELLE.mitglieder).maybeSingle(),
        ]);
        const pm = new Map((pe ?? []).map((x: any) => [x.person_id, x])), rm = new Map((rollen ?? []).map((x: any) => [x.person_id, x])), nm = new Map((nf ?? []).map((x: any) => [x.person_id, x]));
        const mgl: any[] = Array.isArray(mg?.payload?.data) ? mg.payload.data : [];
        const festnetzVon = (p2: any) => { const k = namensSchluessel(p2.given_name || p2.display_name.split(" ")[0], p2.family_name || p2.display_name.split(" ").slice(-1)[0]);
          return txt(mgl.find((x: any) => namensSchluessel(x.firstName, x.lastName) === k)?.phone, 40) || null; };
        const frei = (pid: string, f: string) => !!(fr ?? []).find((x: any) => x.person_id === pid && x.bereich === "kontakt_" + f)?.erlaubt;
        const liste = leute.map((m) => {
          const selbst = m.person_id === ich.person_id, darf = (f: string) => selbst || ich.admin || (ich.kontakte && frei(m.person_id, f));
          const r: any = rm.get(m.person_id) || {}, x: any = pm.get(m.person_id) || {};
          const kontakt: Record<string, string> = {};
          if (darf("handy") && x.phone) kontakt.handy = txt(x.phone, 40);
          if (darf("festnetz")) { const f = festnetzVon(m); if (f) kontakt.festnetz = f; }
          if (darf("mail") && x.email) kontakt.mail = txt(x.email, 120);
          const n: any = nm.get(m.person_id);
          return { id: m.person_id, name: m.display_name, selbst, aemter: r.aemter ?? [], leitung: !!(r.ist_vorstand || r.ist_admin), kontakt,
            notfall: n ? { name: txt(n.name, 120), telefon: txt(n.telefon, 40), beziehung: txt(n.beziehung, 60) } : null };
        });
        if (!ich.nurLesen) await protokoll(ich.person_id, "sos_geoeffnet", { notfallkontakte: ich.vorstand });
        return json({ mitglieder: liste, siehtNotfall: ich.vorstand });
      }

      case "sos_ort": {
        // KC-CLUB-SOS-WO (1.7.0, Wunsch Hansi): Adresse zum eigenen Standort – nur auf Knopfdruck, nichts wird gespeichert,
        // Koordinaten kommen nicht ins Protokoll. Gleicher Ortsnamen-Adapter wie bei Fotos (kostenlos, max. 1 Anfrage/s).
        const lat = Number(p.lat), lon = Number(p.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) throw new Fehler("Kein gültiger Standort.");
        const zuletzt = sosOrtZuletzt.get(ich.person_id) ?? 0;
        if (Date.now() - zuletzt < 5000) throw new Fehler("Bitte einen Moment warten und dann noch einmal tippen.", 429);
        sosOrtZuletzt.set(ich.person_id, Date.now());
        if (Date.now() - ortsnameZuletzt < 1100) await new Promise((r) => setTimeout(r, 1100)); // Nutzungsregel: max. 1 Anfrage/s
        ortsnameZuletzt = Date.now();
        let adresse: string | null = null;
        const messung = Number(p.genau);
        try { adresse = await ortsnameHolen(Math.round(lat * 1e5) / 1e5, Math.round(lon * 1e5) / 1e5, Number.isFinite(messung) && messung > 0 ? messung : true); }
        catch (e) { console.error("sos_ort", String(e)); return json({ adresse: null, fehler: "Adresse gerade nicht abrufbar – die Koordinaten gelten trotzdem." }); }
        await protokoll(ich.person_id, "sos_wo_bin_ich", {});
        return json({ adresse });
      }

      case "geburtstag_freigabe": {
        await db.from("kc_club_freigaben").upsert({ person_id: ich.person_id, bereich: "geburtstag", erlaubt: !!p.erlaubt, geaendert_am: jetzt() });
        await protokoll(ich.person_id, "geburtstag_freigabe", { erlaubt: !!p.erlaubt });
        return json({ ok: true });
      }

      // KC-CLUB-RUNDER-GEBURTSTAG (1.30.0): freiwillig – Clubleitung darf bei runden Geburtstagen das Alter sehen
      case "runder_geburtstag_freigabe": {
        await db.from("kc_club_freigaben").upsert({ person_id: ich.person_id, bereich: "runder_geburtstag", erlaubt: !!p.erlaubt, geaendert_am: jetzt() });
        await protokoll(ich.person_id, "runder_geburtstag_freigabe", { erlaubt: !!p.erlaubt });
        return json({ ok: true });
      }

      case "dienst_freigabe": {
        await db.from("kc_club_freigaben").upsert({ person_id: ich.person_id, bereich: "dienstzeiten", erlaubt: !!p.erlaubt, geaendert_am: jetzt() });
        await protokoll(ich.person_id, "dienst_freigabe", { erlaubt: !!p.erlaubt });
        return json({ ok: true });
      }

      // ----- Nachrichten -----
      case "unterhaltungen": {
        const { data: meine } = await db.from("kc_communication_thread_participants").select("thread_id,last_read_at").eq("person_id", ich.person_id).is("hidden_at", null);
        const ids = (meine ?? []).map((x: any) => x.thread_id);
        if (!ids.length) return json({ unterhaltungen: [] });
        const [{ data: th }, { data: tn }, { data: msgs }] = await Promise.all([
          db.from("kc_communication_threads").select("id,subject,created_by_person_id,updated_at").in("id", ids),
          db.from("kc_communication_thread_participants").select("thread_id,person_id").in("thread_id", ids),
          db.from("kc_communication_messages").select("id,thread_id,sender_person_id,body,created_at").in("thread_id", ids).order("created_at", { ascending: false }).limit(1000),
        ]);
        const leute = await personen([...(tn ?? []).map((x: any) => x.person_id), ...(msgs ?? []).map((m: any) => m.sender_person_id)]);
        const gelesen = new Map((meine ?? []).map((x: any) => [x.thread_id, x.last_read_at]));
        const { data: gr } = await db.from("kc_club_gruppen").select("thread_id,name,symbol").in("thread_id", ids);
        const gruppe = new Map((gr ?? []).map((g: any) => [g.thread_id, g]));
        // KC-CLUB-WICHTIG (1.53.0): ungelesene wichtige Nachrichten je Chat
        const ungelesenIds = (msgs ?? []).filter((x: any) => x.sender_person_id !== ich.person_id && (!gelesen.get(x.thread_id) || x.created_at > gelesen.get(x.thread_id))).map((x: any) => x.id).slice(0, 300);
        const { data: wi } = ungelesenIds.length ? await db.from("kc_club_nachricht_wichtig").select("message_id").in("message_id", ungelesenIds) : { data: [] as any[] };
        const wichtigSet = new Set((wi ?? []).map((x: any) => x.message_id));
        const liste = (th ?? []).map((t: any) => {
          const m = (msgs ?? []).filter((x: any) => x.thread_id === t.id);
          const lr = gelesen.get(t.id);
          const andere = (tn ?? []).filter((x: any) => x.thread_id === t.id && x.person_id !== ich.person_id).map((x: any) => leute.get(x.person_id)?.display_name || x.person_id);
          return {
            id: t.id, betreff: t.subject, teilnehmer: andere, anzahl: andere.length + 1,
            gruppe: gruppe.has(t.id) ? { name: (gruppe.get(t.id) as any).name, symbol: (gruppe.get(t.id) as any).symbol } : null,
            // KC-CLUB-MG-GRUPPEN (1.34.0): bei Gruppen die person_ids (inkl. mir) – für den Gruppen-Filter in „Aktive Mitglieder“
            ...(gruppe.has(t.id) ? { personen: (tn ?? []).filter((x: any) => x.thread_id === t.id).map((x: any) => x.person_id) } : {}),
            letzte: m[0] ? { von: m[0].sender_person_id === ich.person_id ? "Du" : vorname(leute.get(m[0].sender_person_id)), text: String(m[0].body).slice(0, 120), zeit: m[0].created_at } : null,
            ungelesen: m.filter((x: any) => x.sender_person_id !== ich.person_id && (!lr || x.created_at > lr)).length,
            wichtigNeu: m.filter((x: any) => wichtigSet.has(x.id)).length,
            aktualisiert: m[0]?.created_at || t.updated_at,
          };
        }).sort((x: any, y: any) => String(y.aktualisiert).localeCompare(String(x.aktualisiert)));
        return json({ unterhaltungen: liste });
      }

      case "unterhaltung": {
        const id = String(p.id || "");
        await binTeilnehmer(id, ich.person_id);
        const [{ data: t }, { data: tn }, { data: msgsRoh }] = await Promise.all([
          db.from("kc_communication_threads").select("id,subject").eq("id", id).single(),
          db.from("kc_communication_thread_participants").select("person_id,last_read_at").eq("thread_id", id),
          db.from("kc_communication_messages").select("id,sender_person_id,body,created_at,reply_to_message_id").eq("thread_id", id).order("created_at").limit(500),
        ]);
        // KC-CLUB-WISCHEN (1.6.0): „nur für mich gelöscht“ (kc_communication_message_hidden) nicht anzeigen
        const alleIds = (msgsRoh ?? []).map((m: any) => m.id);
        const { data: weg } = alleIds.length ? await db.from("kc_communication_message_hidden").select("message_id").eq("person_id", ich.person_id).in("message_id", alleIds) : { data: [] as any[] };
        const wegIds = new Set((weg ?? []).map((x: any) => x.message_id));
        const msgs = (msgsRoh ?? []).filter((m: any) => !wegIds.has(m.id));
        const mids = (msgs ?? []).map((m: any) => m.id);
        const { data: ma } = mids.length ? await db.from("kc_communication_message_attachments").select("message_id,attachment_id").in("message_id", mids) : { data: [] as any[] };
        const aids = (ma ?? []).map((x: any) => x.attachment_id);
        const { data: att } = aids.length ? await db.from("kc_communication_attachments").select("id,file_name,mime_type,size_bytes").in("id", aids) : { data: [] as any[] };
        const leute = await personen([...(tn ?? []).map((x: any) => x.person_id), ...(msgs ?? []).map((m: any) => m.sender_person_id)]);
        const andere = (tn ?? []).filter((x: any) => x.person_id !== ich.person_id);
        // KC-CLUB-QUITTUNG (0.34.0): Zustellung meiner Nachrichten aus dem Communicator (Push angezeigt/geöffnet, Mail verschickt)
        const eigeneIds = (msgs ?? []).filter((m: any) => m.sender_person_id === ich.person_id).slice(-60).map((m: any) => m.id);
        const kor = eigeneIds.flatMap((mid: string) => [`club-nachricht:${mid}`, `club-nachricht:${mid}:push`]);
        const { data: auftr } = kor.length ? await db.from("kc_communication_requests").select("correlation_id,channel,status,recipient_refs").in("correlation_id", kor) : { data: [] };
        const RANG: Record<string, number> = { sent: 1, delivered: 2, displayed: 3, opened: 4 };
        // KC-CLUB-HAKEN (1.55.0, Wunsch Hansi „wie WhatsApp“): je Empfänger „auf dem Handy angekommen“ – Push dort angezeigt/geöffnet
        // (Rückmeldung des Handys) oder seine App war nach der Nachricht online (hat sie geladen). Gelesen = Chat geöffnet.
        const pushDa = new Map<string, Set<string>>();
        for (const x of (auftr ?? []) as any[]) {
          if (x.channel !== "push" || (RANG[x.status] ?? 0) < 3) continue;
          const mid = String(x.correlation_id).split(":")[1], set = pushDa.get(mid) ?? new Set<string>();
          for (const r of Array.isArray(x.recipient_refs) ? x.recipient_refs : []) if (r?.personId) set.add(String(r.personId));
          pushDa.set(mid, set);
        }
        const { data: zgAndere } = eigeneIds.length && andere.length ? await db.from("kc_club_zugang").select("person_id,zuletzt_gesehen").in("person_id", andere.map((x: any) => x.person_id)).not("zuletzt_gesehen", "is", null) : { data: [] as any[] };
        const zuletztDa = new Map<string, string>();
        for (const z of zgAndere ?? []) if (!zuletztDa.has(z.person_id) || String(z.zuletzt_gesehen) > String(zuletztDa.get(z.person_id))) zuletztDa.set(z.person_id, String(z.zuletzt_gesehen));
        const angekommenBei = (m: any) => andere.filter((x: any) => (x.last_read_at && x.last_read_at >= m.created_at) || pushDa.get(m.id)?.has(x.person_id) || (zuletztDa.get(x.person_id) ?? "") >= m.created_at).length;
        const zustellung = (mid: string) => {
          const a = (auftr ?? []).filter((x: any) => String(x.correlation_id).startsWith(`club-nachricht:${mid}`));
          if (!a.length) return null;
          const push = a.filter((x: any) => x.channel === "push").reduce((b: number, x: any) => Math.max(b, RANG[x.status] ?? 0), 0);
          return { push: push >= 4 ? "geoeffnet" : push === 3 ? "angezeigt" : push >= 1 ? "gesendet" : null, mail: a.some((x: any) => x.channel === "email" && (RANG[x.status] ?? 0) >= 1) };
        };
        // KC-CLUB-REAKTION / -ANTWORT / -ERWAEHNUNG (0.97.0)
        const [{ data: rk }, { data: ew }] = mids.length ? await Promise.all([
          db.from("kc_club_reaktionen").select("message_id,person_id,emoji").in("message_id", mids),
          db.from("kc_club_erwaehnungen").select("message_id,person_id").in("message_id", mids),
        ]) : [{ data: [] as any[] }, { data: [] as any[] }];
        const rkLeute = await personen([...(rk ?? []).map((x: any) => x.person_id), ...(ew ?? []).map((x: any) => x.person_id)]);
        // KC-CLUB-BEARBEITEN (1.9.0): Kennzeichen „bearbeitet“
        const { data: bearb } = mids.length ? await db.from("kc_club_nachricht_bearbeitet").select("message_id,bearbeitet_am").in("message_id", mids) : { data: [] as any[] };
        const bearbMap = new Map((bearb ?? []).map((x: any) => [x.message_id, x.bearbeitet_am]));
        // KC-CLUB-ANHEFTEN / -MERKEN / -CHATUMFRAGE / -KONTAKT (1.10.0)
        const leer = { data: [] as any[] };
        const [{ data: pins }, { data: gem }, { data: umf }, { data: stim }, { data: kon }, { data: wicht }] = mids.length ? await Promise.all([
          db.from("kc_club_angeheftet").select("message_id,am").eq("thread_id", id).order("am", { ascending: false }),
          db.from("kc_club_gemerkt").select("message_id").eq("person_id", ich.person_id).in("message_id", mids),
          db.from("kc_club_chat_umfrage").select("message_id,frage,optionen,mehrfach").in("message_id", mids),
          db.from("kc_club_chat_stimme").select("message_id,person_id,option").in("message_id", mids),
          db.from("kc_club_chat_kontakt").select("message_id,person_id").in("message_id", mids),
          db.from("kc_club_nachricht_wichtig").select("message_id").in("message_id", mids), // KC-CLUB-WICHTIG (1.53.0)
        ]) : [leer, leer, leer, leer, leer, leer];
        const wichtigIds = new Set((wicht ?? []).map((x: any) => x.message_id));
        const midSet = new Set(mids), pinIds = (pins ?? []).map((x: any) => x.message_id).filter((x: string) => midSet.has(x)).slice(0, 3);
        const gemSet = new Set((gem ?? []).map((x: any) => x.message_id));
        const xLeute = await personen([...(stim ?? []).map((x: any) => x.person_id), ...(kon ?? []).map((x: any) => x.person_id)]);
        const umfrageVon = (mid: string) => {
          const u: any = (umf ?? []).find((x: any) => x.message_id === mid); if (!u) return null;
          const st = (stim ?? []).filter((x: any) => x.message_id === mid);
          return { frage: u.frage, mehrfach: u.mehrfach, gesamt: new Set(st.map((x: any) => x.person_id)).size,
            optionen: (u.optionen as string[]).map((t, i) => { const s2 = st.filter((x: any) => x.option === i);
              return { text: t, stimmen: s2.length, meine: s2.some((x: any) => x.person_id === ich.person_id),
                namen: s2.map((x: any) => x.person_id === ich.person_id ? "Du" : vorname(xLeute.get(x.person_id)) || "?") }; }) };
        };
        const kontaktVon = (mid: string) => { const k: any = (kon ?? []).find((x: any) => x.message_id === mid); return k ? { person_id: k.person_id, name: xLeute.get(k.person_id)?.display_name || "Mitglied" } : null; };
        const nachMid = new Map((msgs ?? []).map((m: any) => [m.id, m]));
        const reaktionen = (mid: string) => {
          const g = new Map<string, { emoji: string; namen: string[]; meine: boolean }>();
          for (const x of (rk ?? []).filter((y: any) => y.message_id === mid)) {
            const e = g.get(x.emoji) ?? { emoji: x.emoji, namen: [], meine: false };
            e.namen.push(x.person_id === ich.person_id ? "Du" : vorname(rkLeute.get(x.person_id)) || "?"); if (x.person_id === ich.person_id) e.meine = true; g.set(x.emoji, e);
          }
          return [...g.values()].map((e) => ({ ...e, anzahl: e.namen.length })).sort((a, b) => b.anzahl - a.anzahl);
        };
        const nachrichten = (msgs ?? []).map((m: any) => {
          const eigen = m.sender_person_id === ich.person_id;
          const bezug: any = m.reply_to_message_id ? nachMid.get(m.reply_to_message_id) : null;
          const erw = (ew ?? []).filter((x: any) => x.message_id === m.id);
          const gelesenVon = eigen ? andere.filter((x: any) => x.last_read_at && x.last_read_at >= m.created_at).map((x: any) => vorname(leute.get(x.person_id))) : [];
          return {
            id: m.id, eigen, von: eigen ? "Du" : leute.get(m.sender_person_id)?.display_name || m.sender_person_id, text: m.body, zeit: m.created_at,
            anlagen: (ma ?? []).filter((x: any) => x.message_id === m.id).map((x: any) => (att ?? []).find((y: any) => y.id === x.attachment_id)).filter(Boolean)
              .map((y: any) => ({ id: y.id, name: y.file_name, mime: y.mime_type, groesse: y.size_bytes })),
            ...(eigen ? { gelesenVon, gelesenAlle: andere.length > 0 && gelesenVon.length === andere.length, zustellung: zustellung(m.id),
              // ✓ gesendet · ✓✓ auf allen Handys angekommen · blaue ✓✓ von allen gelesen (wie WhatsApp; Gruppe: erst wenn alle)
              haken: andere.length > 0 && gelesenVon.length === andere.length ? "gelesen" : andere.length > 0 && angekommenBei(m) === andere.length ? "angekommen" : "gesendet" } : {}),
            reaktionen: reaktionen(m.id),
            antwortAuf: bezug ? { id: bezug.id, von: bezug.sender_person_id === ich.person_id ? "Du" : vorname(leute.get(bezug.sender_person_id)) || "?", text: txt(bezug.body, 90) } : null,
            erwaehnt: erw.map((x: any) => x.person_id === ich.person_id ? "dich" : vorname(rkLeute.get(x.person_id)) || "?"), erwaehntMich: erw.some((x: any) => x.person_id === ich.person_id),
            bearbeitet: bearbMap.get(m.id) ?? null,
            gemerkt: gemSet.has(m.id), angeheftet: pinIds.includes(m.id), umfrage: umfrageVon(m.id), kontakt: kontaktVon(m.id), wichtig: wichtigIds.has(m.id),
            ...(eigen && m.body !== "📎" && !(umf ?? []).some((x: any) => x.message_id === m.id) && !(kon ?? []).some((x: any) => x.message_id === m.id) && Date.now() - Date.parse(m.created_at) < BEARBEITEN_MIN * 60000 ? { bearbeitbarBis: new Date(Date.parse(m.created_at) + BEARBEITEN_MIN * 60000).toISOString() } : {}),
          };
        });
        if (!ich.nurLesen) await db.from("kc_communication_thread_participants").update({ last_read_at: jetzt() }).eq("thread_id", id).eq("person_id", ich.person_id);
        const [{ data: gr }, { data: tippen }] = await Promise.all([
          db.from("kc_club_gruppen").select("*").eq("thread_id", id).maybeSingle(),
          db.from("kc_club_tippen").select("person_id,text,art").eq("thread_id", id).neq("person_id", ich.person_id).gt("bis", jetzt()),
        ]);
        const tippt = (tippen ?? []).filter((x: any) => x.art !== "sprache").map((x: any) => vorname(leute.get(x.person_id)) || x.person_id);
        const spricht = (tippen ?? []).filter((x: any) => x.art === "sprache").map((x: any) => vorname(leute.get(x.person_id)) || x.person_id); // KC-CLUB-SPRICHT
        // KC-CLUB-LIVETIPPEN: Entwurf nur von denen, die es freiwillig eingeschaltet haben (Server speichert sonst keinen Text)
        const entwurf = (tippen ?? []).filter((x: any) => x.text).map((x: any) => ({ name: vorname(leute.get(x.person_id)) || x.person_id, text: x.text }));
        const angeheftet = pinIds.map((pid: string) => { const m: any = nachMid.get(pid); return { id: pid, von: m.sender_person_id === ich.person_id ? "Du" : vorname(leute.get(m.sender_person_id)) || "?", text: txt(m.body, 90) }; });
        // KC-CLUB-NEU-LINIE (1.12.0): bis wann hatte ich gelesen (vor diesem Öffnen) – für die Linie „Neue Nachrichten“
        const gelesenBis = (tn ?? []).find((x: any) => x.person_id === ich.person_id)?.last_read_at ?? null;
        // KC-CLUB-ZULETZT-DA (1.20.0): im Einzel-Chat „online“ / „zuletzt da …“ des Gegenübers (gleiche Regeln wie überall)
        const partnerDa = andere.length === 1 ? (await zuletztDaMap(ich, [andere[0].person_id])).get(andere[0].person_id) ?? null : null;
        return json({ id, betreff: t?.subject ?? "", tippt, entwurf, spricht, angeheftet, gelesenBis, partnerDa,
          gruppe: gr ? { name: gr.name, symbol: gr.symbol, erstellt_von: gr.erstellt_von, darfVerwalten: gr.erstellt_von === ich.person_id || ich.vorstand } : null, teilnehmer: (tn ?? []).map((x: any) => ({ person_id: x.person_id, name: leute.get(x.person_id)?.display_name || x.person_id })), nachrichten });
      }

      // KC-CLUB-TIPPT (0.54.0): ich tippe gerade (aus: true = Feld geleert/verlassen). Nur Teilnehmer der Unterhaltung.
      case "tippen": {
        const id = String(p.id || "");
        await binTeilnehmer(id, ich.person_id);
        if (p.aus) { await db.from("kc_club_tippen").delete().eq("thread_id", id).eq("person_id", ich.person_id); return json({ ok: true }); }
        // KC-CLUB-LIVETIPPEN (0.56.0): Entwurfstext nur, wenn ich es selbst eingeschaltet habe (sonst nur „schreibt …“)
        let text: string | null = null;
        if (typeof p.text === "string" && p.text.trim()) {
          const { data: e } = await db.from("kc_club_person_einstellung").select("wert").eq("person_id", ich.person_id).eq("schluessel", "live_tippen").maybeSingle();
          if (e?.wert?.an === true) text = [...p.text].slice(-LIVE_TIPPEN_ZEICHEN).join("");
        }
        // KC-CLUB-SPRICHT (1.11.0): „nimmt eine Sprachnachricht auf“ statt „schreibt …“ (ohne Text)
        const art = p.sprache ? "sprache" : "text";
        await db.from("kc_club_tippen").upsert({ thread_id: id, person_id: ich.person_id, bis: new Date(Date.now() + TIPPT_SEK * 1000).toISOString(), text: art === "sprache" ? null : text, art });
        return json({ ok: true });
      }

      case "nachricht_senden": {
        let text = txt(p.text, 4000);
        const anlagen = (Array.isArray(p.anlagen) ? p.anlagen : []).map(String).slice(0, 10);
        // KC-CLUB-CHATUMFRAGE / KC-CLUB-KONTAKT (1.10.0): Abstimmung bzw. Kontaktkarte als Nachricht (Text = Kurzform für
        // Vorschau, Push, Mail und Suche). Die Kontaktkarte speichert nur die Person – keine Telefonnummer, keine Mail.
        let umfrage: { frage: string; optionen: string[]; mehrfach: boolean } | null = null, kontaktPid: string | null = null;
        if (p.umfrage) {
          const frage = txt(p.umfrage.frage, 200);
          const optionen = [...new Set((Array.isArray(p.umfrage.optionen) ? p.umfrage.optionen : []).map((o: unknown) => txt(o, 80)).filter(Boolean))].slice(0, 8) as string[];
          if (!frage) throw new Fehler("Bitte eine Frage eingeben.");
          if (optionen.length < 2) throw new Fehler("Bitte mindestens zwei verschiedene Antworten eingeben.");
          umfrage = { frage, optionen, mehrfach: !!p.umfrage.mehrfach };
          text = `📊 ${frage}`;
        } else if (p.kontakt) {
          const k = (await aktiveMitglieder()).find((x) => x.person_id === String(p.kontakt));
          if (!k) throw new Fehler("Mitglied nicht gefunden.", 404);
          kontaktPid = k.person_id; text = `👤 Kontakt: ${k.display_name}`;
        }
        if (!text && !anlagen.length) throw new Fehler("Bitte eine Nachricht schreiben oder eine Anlage anhängen.");
        // KC-CLUB-WICHTIG (1.53.0): „Wichtigkeit hoch“ – nur für normale Nachrichten (nicht Abstimmung/Kontaktkarte)
        const wichtig = !!p.wichtig && !umfrage && !kontaktPid;
        let threadId = String(p.id || ""), neu = false;
        if (threadId) await binTeilnehmer(threadId, ich.person_id);
        else {
          // Test an mich selbst: nur ich als Empfänger → eigene Unterhaltung, Benachrichtigung an mich (prüft Push/Mail)
          const e = p.empfaenger ?? {};
          const nurIch = !e.alle && !e.vorstand && !(Array.isArray(e.aemter) && e.aemter.length) && Array.isArray(e.personen) && e.personen.length === 1 && String(e.personen[0]) === ich.person_id;
          const ziel = nurIch ? [] : await empfaengerAufloesen(ich, e);
          if (!ziel.length && !nurIch) throw new Fehler("Bitte mindestens einen Empfänger wählen.");
          const betreff = txt(p.betreff, 120) || (nurIch ? "🧪 Test an mich" : "");
          if (nurIch) {
            const { data: eigene } = await db.from("kc_communication_threads").select("id").eq("created_by_person_id", ich.person_id).eq("subject", betreff);
            for (const t of eigene ?? []) {
              const { count } = await db.from("kc_communication_thread_participants").select("person_id", { count: "exact", head: true }).eq("thread_id", t.id);
              if (count === 1) { threadId = t.id; break; }
            }
          }
          // Zweiergespräch ohne Betreff: vorhandene Unterhaltung weiterführen
          if (ziel.length === 1 && !betreff) threadId = (await zweierGespraech(ich.person_id, ziel[0])) || "";
          if (!threadId) {
            const { data: th, error } = await db.from("kc_communication_threads").insert({ org_id: ORG, subject: betreff, created_by_person_id: ich.person_id }).select("id").single();
            if (error || !th) throw new Fehler("Unterhaltung konnte nicht angelegt werden.", 500);
            threadId = th.id; neu = true;
            await db.from("kc_communication_thread_participants").insert([ich.person_id, ...ziel].map((person_id) => ({ thread_id: threadId, person_id })));
          }
        }
        // Anlagen: nur eigene, noch nicht verknüpfte – beim Weiterleiten (KC-CLUB-WEITERLEITEN 0.98.0) auch die der
        // Quell-Nachricht, sofern ich Teilnehmer ihrer Unterhaltung bin
        let weiterVon: any = null;
        if (p.weiterleiten_von) {
          const { data: q } = await db.from("kc_communication_messages").select("id,thread_id,sender_person_id").eq("id", String(p.weiterleiten_von)).maybeSingle();
          if (!q) throw new Fehler("Die weitergeleitete Nachricht gibt es nicht mehr.", 404);
          await binTeilnehmer(q.thread_id, ich.person_id); weiterVon = q;
        }
        if (anlagen.length) {
          const { data: att } = await db.from("kc_communication_attachments").select("id,object_path").in("id", anlagen);
          const { data: qa } = weiterVon ? await db.from("kc_communication_message_attachments").select("attachment_id").eq("message_id", weiterVon.id) : { data: [] as any[] };
          const ausQuelle = new Set((qa ?? []).map((x: any) => x.attachment_id));
          if ((att ?? []).length !== anlagen.length || (att ?? []).some((x: any) => !String(x.object_path).startsWith(`club/${ich.person_id}/`) && !ausQuelle.has(x.id)))
            throw new Fehler("Anlage nicht gefunden – bitte erneut anhängen.");
        }
        // KC-CLUB-ANTWORT (0.97.0): Antwort auf eine Nachricht derselben Unterhaltung (vorhandene Spalte reply_to_message_id)
        let antwortAuf: string | null = null;
        if (p.antwort_auf) {
          const { data: b } = await db.from("kc_communication_messages").select("id,thread_id").eq("id", String(p.antwort_auf)).maybeSingle();
          if (b && b.thread_id === threadId) antwortAuf = b.id;
        }
        const { data: m, error: me } = await db.from("kc_communication_messages").insert({ thread_id: threadId, sender_person_id: ich.person_id, body: text || "📎", reply_to_message_id: antwortAuf }).select("id,created_at").single();
        db.from("kc_club_tippen").delete().eq("thread_id", threadId).eq("person_id", ich.person_id).then(() => {}); // „schreibt …“ endet mit dem Senden
        if (me || !m) throw new Fehler("Nachricht konnte nicht gespeichert werden.", 500);
        if (anlagen.length) await db.from("kc_communication_message_attachments").insert(anlagen.map((attachment_id: string) => ({ message_id: m.id, attachment_id, hochgeladen_von_person_id: ich.person_id })));
        if (umfrage || kontaktPid) {
          const { error: ze } = umfrage ? await db.from("kc_club_chat_umfrage").insert({ message_id: m.id, ...umfrage, erstellt_von: ich.person_id })
            : await db.from("kc_club_chat_kontakt").insert({ message_id: m.id, person_id: kontaktPid });
          if (ze) { await db.from("kc_communication_messages").delete().eq("id", m.id); throw new Fehler(umfrage ? "Abstimmung konnte nicht gespeichert werden." : "Kontakt konnte nicht gesendet werden.", 500); }
        }
        if (wichtig) {
          const { error: we } = await db.from("kc_club_nachricht_wichtig").insert({ message_id: m.id, person_id: ich.person_id });
          if (we) { await db.from("kc_communication_messages").delete().eq("id", m.id); throw new Fehler("Wichtige Nachricht konnte nicht gespeichert werden.", 500); }
        }
        const wMarke = wichtig ? "❗ Wichtig – " : "";
        await Promise.all([
          // neue Nachricht: wer die Unterhaltung ausgeblendet hatte, sieht sie wieder (wie bei WhatsApp)
          db.from("kc_communication_thread_participants").update({ hidden_at: null }).eq("thread_id", threadId).not("hidden_at", "is", null),
          db.from("kc_communication_threads").update({ updated_at: jetzt() }).eq("id", threadId),
          db.from("kc_communication_thread_participants").update({ last_read_at: m.created_at }).eq("thread_id", threadId).eq("person_id", ich.person_id),
        ]);
        const { data: tn } = await db.from("kc_communication_thread_participants").select("person_id").eq("thread_id", threadId).neq("person_id", ich.person_id).is("hidden_at", null);
        const { data: th } = await db.from("kc_communication_threads").select("subject").eq("id", threadId).single();
        const ziel = (tn ?? []).map((x: any) => x.person_id);
        if (!ziel.length) {
          const { count } = await db.from("kc_communication_thread_participants").select("person_id", { count: "exact", head: true }).eq("thread_id", threadId);
          if (count === 1) ziel.push(ich.person_id); // Test-Unterhaltung nur mit mir
        }
        const wege = zustellwege(p.wege);
        const { data: grp } = await db.from("kc_club_gruppen").select("name,symbol").eq("thread_id", threadId).maybeSingle();
        // KC-CLUB-ERWAEHNUNG (0.97.0): @Erwähnte (nur Teilnehmer dieser Unterhaltung) bekommen eine eigene, deutliche Meldung –
        // immer aufs Handy (bzw. Mail, wenn sie die App noch nie geöffnet haben), statt der normalen Nachrichten-Meldung.
        const { data: alleTn } = await db.from("kc_communication_thread_participants").select("person_id").eq("thread_id", threadId);
        const tnIds = new Set((alleTn ?? []).map((x: any) => x.person_id));
        const erwaehnt = [...new Set((Array.isArray(p.erwaehnt) ? p.erwaehnt : []).map(String))].filter((id) => id !== ich.person_id && tnIds.has(id)).slice(0, 50);
        let versandErw: any = null;
        if (erwaehnt.length) {
          await db.from("kc_club_erwaehnungen").insert(erwaehnt.map((person_id) => ({ message_id: m.id, person_id })));
          versandErw = await sendenGewaehlt("club_nachricht", erwaehnt, ["push"], {
            titel: `${wMarke}📣 ${ich.vorname} hat dich erwähnt${grp ? ` – ${grp.symbol} ${grp.name}` : ""}`, kurz: txt(text, 140) || "Neue Nachricht",
            betreff: `Köcheclub Werne – ${ich.name} hat dich erwähnt${grp ? " in " + grp.name : ""}`,
            text: `Hallo,\n\n${ich.name} hat dich${grp ? ` in der Gruppe „${grp.name}“` : ""} erwähnt:\n\n${text}\n\nAntworten in der Köcheclub-App: ${APP_URL}#nachricht=${threadId}\n\nViele Grüße\nKöcheclub Werne`,
            url: `${APP_URL}#nachricht=${threadId}`,
          }, `club-nachricht:${m.id}:erwaehnt`, { erwaehnung: true });
          for (let i = ziel.length - 1; i >= 0; i--) if (erwaehnt.includes(ziel[i])) ziel.splice(i, 1);
        }
        // KC-CLUB-STUMM (1.9.0): wer diese Unterhaltung stummgeschaltet hat, bekommt keinen Push/keine Mail (@Erwähnung kommt trotzdem)
        const stumm = await stummFuer(ziel.filter((x: string) => x !== ich.person_id), threadId);
        for (let i = ziel.length - 1; i >= 0; i--) if (stumm.has(ziel[i])) ziel.splice(i, 1);
        const versand = await sendenGewaehlt("club_nachricht", ziel, wege, {
          titel: wMarke + (grp ? `${grp.symbol} ${grp.name}: ${ich.vorname}` : `💬 ${ich.name}`), kurz: wichtig ? txt(text, 140) || "Wichtige Nachricht im Köcheclub" : th?.subject ? `Neue Nachricht in „${th.subject}“` : "Neue Nachricht im Köcheclub",
          betreff: `${wMarke}Köcheclub Werne – ${wichtig ? "wichtige" : "neue"} Nachricht von ${ich.name}${th?.subject ? ": " + th.subject : ""}`,
          text: `Hallo,\n\n${ich.name} hat dir im Köcheclub geschrieben${th?.subject ? ` („${th.subject}“)` : ""}:\n\n${text}${anlagen.length ? `\n\n📎 ${anlagen.length} Anlage(n) – in der App ansehen.` : ""}\n\nAntworten in der Köcheclub-App: ${APP_URL}#nachricht=${threadId}\n\nViele Grüße\nKöcheclub Werne`,
          url: `${APP_URL}#nachricht=${threadId}`,
        }, `club-nachricht:${m.id}`);
        await protokoll(ich.person_id, weiterVon ? "nachricht_weitergeleitet" : "nachricht_gesendet", { thread: threadId, neu, empfaenger: ziel.length, stumm: stumm.size, umfrage: !!umfrage, kontakt: !!kontaktPid, anlagen: anlagen.length, wege, versand, antwort: !!antwortAuf, erwaehnt: erwaehnt.length, versandErw, wichtig, ...(weiterVon ? { von_nachricht: weiterVon.id } : {}) });
        return json({ ok: true, id: threadId, versand });
      }

      // ----- KC-CLUB-PRIVATTERMIN (1.0.0): nur für mich sichtbar – jeder darf, jeder nur seine eigenen -----
      case "privattermin_speichern": {
        const titel = txt(p.titel, 120);
        if (!titel) throw new Fehler("Bitte einen Titel eingeben.");
        const beginn = new Date(String(p.beginn || ""));
        if (isNaN(beginn.getTime())) throw new Fehler("Bitte Datum und Uhrzeit angeben.");
        const ende = p.ende ? new Date(String(p.ende)) : null;
        if (ende && (isNaN(ende.getTime()) || ende < beginn)) throw new Fehler("Das Ende liegt vor dem Beginn.");
        const erinnerung = [0, 15, 30, 60, 120, 1440, 2880].includes(Number(p.erinnerung_min)) ? Number(p.erinnerung_min) : 0;
        const wiederholung = WDH.includes(String(p.wiederholung)) ? String(p.wiederholung) : "keine";
        const wBis = /^\d{4}-\d{2}-\d{2}$/.test(String(p.wiederholung_bis || "")) ? String(p.wiederholung_bis) : null;
        if (wBis && wBis < berlinTag(beginn)) throw new Fehler("„Wiederholen bis“ liegt vor dem ersten Termin.");
        const zeile = { titel, beginn: beginn.toISOString(), ende: ende ? ende.toISOString() : null, ganztaegig: !!p.ganztaegig, ort: txt(p.ort, 200) || null,
          notiz: txt(p.notiz, 1000) || null, erinnerung_min: erinnerung, erinnert_am: null, erinnert_bis: null, geaendert_am: jetzt(),
          wiederholung, wiederholung_bis: wiederholung === "keine" ? null : wBis };
        let id = String(p.id || "");
        if (id) {
          const { data } = await db.from("kc_club_privattermine").update(zeile).eq("id", id).eq("person_id", ich.person_id).select("id");
          if (!data?.length) throw new Fehler("Eintrag nicht gefunden.", 404);
        } else {
          const { count } = await db.from("kc_club_privattermine").select("id", { count: "exact", head: true }).eq("person_id", ich.person_id).gte("beginn", jetzt());
          if ((count ?? 0) >= 500) throw new Fehler("Du hast schon sehr viele private Einträge – bitte alte löschen.");
          const { data, error } = await db.from("kc_club_privattermine").insert({ ...zeile, person_id: ich.person_id }).select("id").single();
          if (error || !data) throw new Fehler("Speichern fehlgeschlagen.", 500);
          id = data.id;
        }
        return json({ ok: true, id }); // bewusst kein Protokoll mit Inhalt – privat
      }
      case "privattermin_loeschen": {
        // KC-CLUB-WIEDERHOLUNG: nur_tag = nur diesen einen Termin der Reihe weglassen (Ausnahme), sonst ganze Reihe/Eintrag löschen
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(p.nur_tag || ""))) {
          const { data: r } = await db.from("kc_club_privattermine").select("ausnahmen").eq("id", String(p.id || "")).eq("person_id", ich.person_id).maybeSingle();
          if (!r) throw new Fehler("Eintrag nicht gefunden.", 404);
          await db.from("kc_club_privattermine").update({ ausnahmen: [...new Set([...(r.ausnahmen || []), String(p.nur_tag)])], geaendert_am: jetzt() }).eq("id", String(p.id)).eq("person_id", ich.person_id);
          return json({ ok: true, nurEiner: true });
        }
        const { data } = await db.from("kc_club_privattermine").delete().eq("id", String(p.id || "")).eq("person_id", ich.person_id).select("id");
        if (!data?.length) throw new Fehler("Eintrag nicht gefunden.", 404);
        return json({ ok: true });
      }
      case "privattermine_liste": {
        return json({ privat: await privatListe(ich, new Date(Date.now() - 6 * 3600000).toISOString(), new Date(Date.now() + 60 * 86400000).toISOString()) });
      }

      // ----- KC-CLUB-NUTZUNG (0.99.0): Statistik OHNE Namen – nur Tag + Bereich + Anzahl. Wer meldet, wird NICHT gespeichert
      // (kein protokoll(), keine Person, kein Gerät). Nur bekannte Bereiche, gedeckelt gegen Ausreißer.
      case "nutzung_melden": {
        const z = (p.zaehler && typeof p.zaehler === "object") ? p.zaehler : {};
        const paare = Object.entries(z).filter(([b, n]) => NUTZUNG_BEREICHE.has(String(b)) && Number.isFinite(Number(n)) && Number(n) > 0).slice(0, 40)
          .map(([b, n]) => [String(b), Math.min(200, Math.round(Number(n)))] as [string, number]);
        if (paare.length) await db.rpc("kc_club_nutzung_zaehlen", { p_tag: berlinTag(new Date()), p_bereiche: paare.map((x) => x[0]), p_anzahlen: paare.map((x) => x[1]) });
        return json({ ok: true });
      }
      case "nutzung_statistik": {
        nurAdmin(ich);
        const tage = Math.min(90, Math.max(1, Math.round(Number(p.tage) || 7)));
        const von = berlinTag(new Date(Date.now() - (tage - 1) * 86400000));
        const { data } = await db.from("kc_club_nutzung").select("tag,bereich,anzahl").gte("tag", von).order("tag");
        return json({ tage, von, zeilen: data ?? [] });
      }

      // ----- KC-CLUB-REAKTION (0.97.0): je Person eine Reaktion je Nachricht; gleiche nochmal = weg; Autor bekommt Bescheid -----
      case "reaktion_setzen": {
        const { data: m } = await db.from("kc_communication_messages").select("id,thread_id,sender_person_id,body").eq("id", String(p.id || "")).maybeSingle();
        if (!m) throw new Fehler("Nachricht nicht gefunden.", 404);
        await binTeilnehmer(m.thread_id, ich.person_id);
        const emoji = txt(p.emoji, 16);
        const { data: alt } = await db.from("kc_club_reaktionen").select("emoji").eq("message_id", m.id).eq("person_id", ich.person_id).maybeSingle();
        if (!emoji || alt?.emoji === emoji) {
          await db.from("kc_club_reaktionen").delete().eq("message_id", m.id).eq("person_id", ich.person_id);
          return json({ ok: true, emoji: null });
        }
        if (!/\p{Extended_Pictographic}|[\u2600-\u27BF]/u.test(emoji)) throw new Fehler("Bitte ein Emoji wählen.");
        await db.from("kc_club_reaktionen").upsert({ message_id: m.id, person_id: ich.person_id, emoji, zeit: jetzt() });
        if (m.sender_person_id !== ich.person_id && !alt) {
          await senden("club_nachricht", [m.sender_person_id], {
            titel: `${emoji} ${ich.vorname} hat reagiert`, kurz: `auf: „${txt(m.body, 80)}“`,
            betreff: `Köcheclub Werne – ${ich.name} hat auf deine Nachricht reagiert`,
            text: `Hallo,\n\n${ich.name} hat mit ${emoji} auf deine Nachricht reagiert:\n\n„${txt(m.body, 300)}“\n\n${APP_URL}#nachricht=${m.thread_id}\n\nViele Grüße\nKöcheclub Werne`,
            url: `${APP_URL}#nachricht=${m.thread_id}`,
          }, `club-reaktion:${m.id}:${ich.person_id}`).catch(() => null);
        }
        return json({ ok: true, emoji });
      }

      case "nachricht_loeschen": {
        // eigene Nachricht (Admin: jede) für alle entfernen, samt Anlagen-Verknüpfung
        const { data: m } = await db.from("kc_communication_messages").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!m) throw new Fehler("Nachricht nicht gefunden.", 404);
        await binTeilnehmer(m.thread_id, ich.person_id);
        if (m.sender_person_id !== ich.person_id && !ich.admin) throw new Fehler("Du kannst nur deine eigenen Nachrichten löschen.", 403);
        const { data: ma } = await db.from("kc_communication_message_attachments").select("attachment_id").eq("message_id", m.id);
        await geloescht(ich, "nachricht", { nachricht: m, anlagen: (ma ?? []).map((x: any) => x.attachment_id) });
        await db.from("kc_communication_messages").delete().eq("id", m.id);
        return json({ ok: true });
      }

      case "nachricht_bearbeiten": {
        // KC-CLUB-BEARBEITEN (1.9.0): nur eigene Nachrichten mit Text, bis BEARBEITEN_MIN Minuten nach dem Senden.
        // Kein neuer Push/keine neue Mail (wie WhatsApp); im Protokoll steht nur, DASS bearbeitet wurde – nicht der Text.
        const text = txt(p.text, 4000);
        if (!text) throw new Fehler("Bitte einen Text eingeben – zum Entfernen „Löschen“ benutzen.");
        const { data: m } = await db.from("kc_communication_messages").select("id,thread_id,sender_person_id,body,created_at").eq("id", String(p.id || "")).maybeSingle();
        if (!m) throw new Fehler("Nachricht nicht gefunden.", 404);
        await binTeilnehmer(m.thread_id, ich.person_id);
        if (m.sender_person_id !== ich.person_id) throw new Fehler("Du kannst nur deine eigenen Nachrichten bearbeiten.", 403);
        if (m.body === "📎") throw new Fehler("Nachrichten nur mit Anlage haben keinen Text zum Bearbeiten.");
        const [{ data: uf }, { data: kk }] = await Promise.all([
          db.from("kc_club_chat_umfrage").select("message_id").eq("message_id", m.id).maybeSingle(),
          db.from("kc_club_chat_kontakt").select("message_id").eq("message_id", m.id).maybeSingle(),
        ]);
        if (uf || kk) throw new Fehler("Abstimmungen und Kontaktkarten lassen sich nicht bearbeiten.");
        if (Date.now() - Date.parse(m.created_at) > BEARBEITEN_MIN * 60000) throw new Fehler(`Bearbeiten geht nur ${BEARBEITEN_MIN} Minuten nach dem Senden.`, 409);
        if (text === m.body) return json({ ok: true, unveraendert: true });
        const { error } = await db.from("kc_communication_messages").update({ body: text }).eq("id", m.id).eq("sender_person_id", ich.person_id);
        if (error) throw new Fehler("Konnte nicht gespeichert werden.", 500);
        const am = jetzt();
        await db.from("kc_club_nachricht_bearbeitet").upsert({ message_id: m.id, bearbeitet_am: am }, { onConflict: "message_id" });
        await protokoll(ich.person_id, "nachricht_bearbeitet", { nachricht: m.id, thread: m.thread_id });
        return json({ ok: true, bearbeitet: am });
      }

      // ----- KC-CLUB-ANHEFTEN (1.10.0): Nachricht oben im Chat anheften – höchstens 3, jeder Teilnehmer darf -----
      case "nachricht_anheften": {
        const { data: m } = await db.from("kc_communication_messages").select("id,thread_id").eq("id", String(p.id || "")).maybeSingle();
        if (!m) throw new Fehler("Nachricht nicht gefunden.", 404);
        await binTeilnehmer(m.thread_id, ich.person_id);
        if (!p.an) { await db.from("kc_club_angeheftet").delete().eq("message_id", m.id); await protokoll(ich.person_id, "nachricht_geloest", { nachricht: m.id, thread: m.thread_id }); return json({ ok: true }); }
        await db.from("kc_club_angeheftet").upsert({ message_id: m.id, thread_id: m.thread_id, von: ich.person_id, am: jetzt() }, { onConflict: "message_id" });
        const { data: alle } = await db.from("kc_club_angeheftet").select("message_id").eq("thread_id", m.thread_id).order("am", { ascending: false });
        const zuViel = (alle ?? []).slice(3).map((x: any) => x.message_id);
        if (zuViel.length) await db.from("kc_club_angeheftet").delete().in("message_id", zuViel); // älteste fällt heraus
        await protokoll(ich.person_id, "nachricht_angeheftet", { nachricht: m.id, thread: m.thread_id });
        return json({ ok: true, ersetzt: zuViel.length });
      }

      // ----- KC-CLUB-MERKEN (1.10.0): eigene Merkliste – nur für mich -----
      case "nachricht_merken": {
        const { data: m } = await db.from("kc_communication_messages").select("id,thread_id").eq("id", String(p.id || "")).maybeSingle();
        if (!m) throw new Fehler("Nachricht nicht gefunden.", 404);
        await binTeilnehmer(m.thread_id, ich.person_id);
        if (p.an) await db.from("kc_club_gemerkt").upsert({ person_id: ich.person_id, message_id: m.id, am: jetzt() }, { onConflict: "person_id,message_id" });
        else await db.from("kc_club_gemerkt").delete().eq("person_id", ich.person_id).eq("message_id", m.id);
        return json({ ok: true });
      }
      case "gemerkte_nachrichten": {
        const { data: gm } = await db.from("kc_club_gemerkt").select("message_id,am").eq("person_id", ich.person_id).order("am", { ascending: false }).limit(200);
        const ids = (gm ?? []).map((x: any) => x.message_id);
        if (!ids.length) return json({ liste: [] });
        const [{ data: ms }, { data: meineTn }, { data: weg }] = await Promise.all([
          db.from("kc_communication_messages").select("id,thread_id,sender_person_id,body,created_at").in("id", ids),
          db.from("kc_communication_thread_participants").select("thread_id").eq("person_id", ich.person_id),
          db.from("kc_communication_message_hidden").select("message_id").eq("person_id", ich.person_id).in("message_id", ids),
        ]);
        const darf = new Set((meineTn ?? []).map((x: any) => x.thread_id)), versteckt = new Set((weg ?? []).map((x: any) => x.message_id));
        const sichtbar = (ms ?? []).filter((x: any) => darf.has(x.thread_id) && !versteckt.has(x.id));
        const tids = [...new Set(sichtbar.map((x: any) => x.thread_id))];
        const [{ data: th }, { data: gr }, { data: tn }] = tids.length ? await Promise.all([
          db.from("kc_communication_threads").select("id,subject").in("id", tids),
          db.from("kc_club_gruppen").select("thread_id,name,symbol").in("thread_id", tids),
          db.from("kc_communication_thread_participants").select("thread_id,person_id").in("thread_id", tids).neq("person_id", ich.person_id),
        ]) : [{ data: [] as any[] }, { data: [] as any[] }, { data: [] as any[] }];
        const leute = await personen([...sichtbar.map((x: any) => x.sender_person_id), ...(tn ?? []).map((x: any) => x.person_id)]);
        const chatName = (tid: string) => { const g: any = (gr ?? []).find((x: any) => x.thread_id === tid); if (g) return `${g.symbol} ${g.name}`;
          const t: any = (th ?? []).find((x: any) => x.id === tid); if (t?.subject) return t.subject;
          return (tn ?? []).filter((x: any) => x.thread_id === tid).map((x: any) => leute.get(x.person_id)?.display_name || "?").join(", ") || "Nur du"; };
        const am = new Map((gm ?? []).map((x: any) => [x.message_id, x.am]));
        return json({ liste: sichtbar.sort((a: any, b: any) => String(am.get(b.id)).localeCompare(String(am.get(a.id)))).map((x: any) => ({
          id: x.id, thread: x.thread_id, chat: chatName(x.thread_id), von: x.sender_person_id === ich.person_id ? "Du" : leute.get(x.sender_person_id)?.display_name || "?",
          text: txt(x.body, 300), zeit: x.created_at })) });
      }

      // ----- KC-CLUB-CHATUMFRAGE (1.10.0): abstimmen (ersetzt meine bisherigen Stimmen; leer = Stimme zurücknehmen) -----
      case "chat_umfrage_stimmen": {
        const { data: u } = await db.from("kc_club_chat_umfrage").select("message_id,optionen,mehrfach").eq("message_id", String(p.id || "")).maybeSingle();
        if (!u) throw new Fehler("Abstimmung nicht gefunden.", 404);
        const { data: m } = await db.from("kc_communication_messages").select("thread_id").eq("id", u.message_id).single();
        await binTeilnehmer(m.thread_id, ich.person_id);
        let wahl = [...new Set<number>((Array.isArray(p.optionen) ? p.optionen : []).map(Number))].filter((i: number) => Number.isInteger(i) && i >= 0 && i < (u.optionen as unknown[]).length);
        if (!u.mehrfach) wahl = wahl.slice(0, 1);
        await db.from("kc_club_chat_stimme").delete().eq("message_id", u.message_id).eq("person_id", ich.person_id);
        if (wahl.length) {
          const { error } = await db.from("kc_club_chat_stimme").insert(wahl.map((option) => ({ message_id: u.message_id, person_id: ich.person_id, option })));
          if (error) throw new Fehler("Stimme konnte nicht gespeichert werden.", 500);
        }
        return json({ ok: true });
      }

      // ----- KC-CLUB-SICHERHEIT (1.14.0): Sicherheits-Check für alle Mitglieder – nur Ja/Nein + Zeitabstände, keine Namen -----
      // Regel 11: fehlt ein Wert, kommt null (App: „nicht geprüft“) – nie ein erfundenes OK.
      case "sicherheit_pruefen": {
        const t0 = performance.now();
        const { data: s0, error } = await db.rpc("kc_club_sicherheit_status");
        const dbMs = Math.round(performance.now() - t0);
        if (error || !s0) { console.error("sicherheit", error?.message); return json({ dbMs: null, schutz: null, spiegel: null, sicherung: null, wiederherstellung: null, ueberwachung: null }); }
        const s1: any = s0, frisch = (min: unknown, grenze: number) => (typeof min === "number" ? min <= grenze : null);
        return json({
          dbMs,
          schutz: typeof s1.ohne_schutz === "number" && s1.tabellen > 0 ? s1.ohne_schutz === 0 : null,
          spiegel: frisch(s1.spiegel_min, 8 * 60), spiegelMin: s1.spiegel_min ?? null,           // Spiegel läuft alle paar Stunden
          sicherung: frisch(s1.sicherung_min, 30 * 60), sicherungAm: s1.sicherung_am ?? null,      // nächtlich
          wiederherstellung: s1.wiederherstellung_min == null ? null : frisch(s1.wiederherstellung_min, 8 * 24 * 60) && !s1.wiederherstellung_fehler_danach,
          ueberwachung: frisch(s1.ueberwachung_min, 120), ueberwachungMin: s1.ueberwachung_min ?? null, // alle 30 Minuten
        });
      }

      // KC-CLUB-SICHERHEIT-MELDEN (1.15.0, Wunsch Hansi): Prüfergebnis an die Admins (Push + Mail, gleicher Weg wie „Problem
      // melden“). Der Server prüft dabei SELBST erneut – nur App-seitige Punkte (Verbindung, Version, Antwortzeit) kommen vom Gerät.
      case "sicherheit_melden": {
        const { count } = await db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).eq("person_id", ich.person_id).eq("aktion", "fehler_sicherheit").gte("zeit", new Date(Date.now() - 3600000).toISOString());
        if ((count ?? 0) >= 3) throw new Fehler("Dein Prüfergebnis ist schon angekommen – Hansi meldet sich bei dir.", 429);
        const { data: s0 } = await db.rpc("kc_club_sicherheit_status");
        const st: any = s0 ?? {}, frisch = (min: unknown, grenze: number) => (typeof min === "number" ? min <= grenze : null);
        const geraet: any = p.geraet && typeof p.geraet === "object" ? p.geraet : {};
        const ja = (v: unknown) => (v === true ? true : v === false ? false : null);
        const punkte: [string, boolean | null][] = [
          ["Verbindung verschlüsselt (Gerät)", ja(geraet.verbindung)],
          ["Server erreichbar", true],
          ["Daten-Speicher antwortet", s0 ? true : null],
          ["Zugriffsschutz auf allen Daten", typeof st.ohne_schutz === "number" ? st.ohne_schutz === 0 : null],
          ["Sicherungskopie aktuell", frisch(st.spiegel_min, 8 * 60)],
          ["Nächtliche Sicherung", frisch(st.sicherung_min, 30 * 60)],
          ["Wiederherstellung getestet", st.wiederherstellung_min == null ? null : frisch(st.wiederherstellung_min, 8 * 24 * 60) && !st.wiederherstellung_fehler_danach],
          ["Überwachung aktiv", frisch(st.ueberwachung_min, 120)],
          ["App auf dem neuesten Stand (Gerät)", ja(geraet.version)],
        ];
        const zeichen = (v: boolean | null) => (v === true ? "✅" : v === false ? "⚠️" : "❔");
        const probleme = punkte.filter(([, v]) => v !== true).length;
        const ms = Number.isFinite(Number(geraet.serverMs)) ? Math.round(Number(geraet.serverMs)) : null;
        const notiz = txt(p.notiz, 300);
        await protokoll(ich.person_id, "fehler_sicherheit", { probleme, punkte: Object.fromEntries(punkte), serverMs: ms, version: txt(req.headers.get("x-club-version"), 20), notiz });
        const ziel = await adminIds();
        // KC-CLUB-SICHERHEIT-ZUSTELLUNG (1.22.1, Wunsch Hansi „der Bericht muss mich erreichen“): immer Push UND E-Mail an den Admin
        const versand = ziel.length ? await sendenGewaehlt("club_nachricht", ziel, ["push", "email"], {
          titel: probleme ? `🛡️ Sicherheits-Check: ${probleme} Punkt${probleme === 1 ? "" : "e"} nicht bestätigt` : "🛡️ Sicherheits-Check: alles in Ordnung",
          kurz: `${ich.name} hat das Prüfergebnis geschickt${probleme ? " – bitte ansehen" : ""}`,
          betreff: `Köcheclub-App: Sicherheits-Check von ${ich.name}${probleme ? ` – ${probleme} Punkt${probleme === 1 ? "" : "e"} offen` : " – alles OK"}`,
          text: `Hallo,

${ich.name} hat in der Club-App das Ergebnis des Sicherheits-Checks geschickt (Server hat neu geprüft):

${punkte.map(([t, v]) => `${zeichen(v)} ${t}`).join("\n")}

Antwortzeit beim Mitglied: ${ms ?? "?"} ms · App ${txt(req.headers.get("x-club-version"), 20)}${notiz ? `

Notiz: ${notiz}` : ""}

Einzelheiten: Admin-Zentrale → 🩺 Fehlerprotokoll
${APP_URL}

Viele Grüße
Köcheclub-App`,
          url: APP_URL,
        }, `club-sicherheit:${ich.person_id}:${Date.now()}`) : null;
        // KC-CLUB-SICHERHEIT-ARCHIV (1.22.1): zusätzlich als Textdatei in den Vereinsordner „Admin <Jahr>“, Register „Sicherheitscheck“
        // (nur Clubleitung). Fehler beim Ablegen stoppen die Meldung nie – der Bericht ist dann trotzdem verschickt.
        const abgelegt = await sicherheitAblegen(ich, punkte.map(([t, v]) => `${zeichen(v)} ${t}`), probleme, ms, notiz, txt(req.headers.get("x-club-version"), 20))
          .then(() => true).catch((e) => { console.error("sicherheit ablegen", String(e)); return false; });
        return json({ ok: true, probleme, versand, abgelegt });
      }

      case "nachricht_ausblenden": {
        // KC-CLUB-WISCHEN (1.6.0): Nachricht nur für mich löschen (wie WhatsApp „Für mich löschen“) – die anderen sehen sie weiter
        const { data: m } = await db.from("kc_communication_messages").select("id,thread_id").eq("id", String(p.id || "")).maybeSingle();
        if (!m) throw new Fehler("Nachricht nicht gefunden.", 404);
        await binTeilnehmer(m.thread_id, ich.person_id);
        const { error } = await db.from("kc_communication_message_hidden").upsert({ person_id: ich.person_id, message_id: m.id, hidden_at: jetzt() }, { onConflict: "person_id,message_id" });
        if (error) throw new Fehler("Konnte nicht gelöscht werden.", 500);
        await protokoll(ich.person_id, "nachricht_fuer_mich_geloescht", { nachricht: m.id });
        return json({ ok: true });
      }

      case "unterhaltung_ausblenden": {
        // nur für mich entfernen; schreibt jemand wieder, erscheint sie erneut
        const id = String(p.id || "");
        await binTeilnehmer(id, ich.person_id);
        await db.from("kc_communication_thread_participants").update({ hidden_at: jetzt() }).eq("thread_id", id).eq("person_id", ich.person_id);
        await protokoll(ich.person_id, "unterhaltung_ausgeblendet", { thread: id });
        return json({ ok: true });
      }

      case "unterhaltung_loeschen": {
        // für alle löschen: nur Admin (z. B. Test-Unterhaltungen); vollständige Sicherung vorher
        nurAdmin(ich);
        const id = String(p.id || "");
        await binTeilnehmer(id, ich.person_id);
        const [{ data: t }, { data: tn }, { data: msgs }] = await Promise.all([
          db.from("kc_communication_threads").select("*").eq("id", id).single(),
          db.from("kc_communication_thread_participants").select("*").eq("thread_id", id),
          db.from("kc_communication_messages").select("*").eq("thread_id", id).order("created_at").limit(2000),
        ]);
        await geloescht(ich, "unterhaltung", { unterhaltung: t, teilnehmer: tn ?? [], nachrichten: msgs ?? [] });
        await db.from("kc_communication_threads").delete().eq("id", id);
        return json({ ok: true });
      }

      // ----- Gruppen (KC-CLUB-GRUPPEN) -----
      case "gruppe_anlegen": {
        const name = txt(p.name, 60);
        if (!name) throw new Fehler("Bitte einen Namen für die Gruppe eingeben (z. B. „Küchenteam“).");
        const symbol = GRUPPEN_SYMBOLE.includes(String(p.symbol)) ? String(p.symbol) : "👥";
        const aktiv = new Set((await aktiveMitglieder()).map((m) => m.person_id));
        const mitglieder = ([...new Set((Array.isArray(p.personen) ? p.personen : []).map(String))] as string[]).filter((id) => aktiv.has(id) && id !== ich.person_id).slice(0, 60);
        if (!mitglieder.length) throw new Fehler("Bitte mindestens ein Mitglied für die Gruppe auswählen.");
        const { data: th, error } = await db.from("kc_communication_threads").insert({ org_id: ORG, subject: name, created_by_person_id: ich.person_id }).select("id").single();
        if (error || !th) throw new Fehler("Gruppe konnte nicht angelegt werden.", 500);
        await db.from("kc_communication_thread_participants").insert([ich.person_id, ...mitglieder].map((person_id) => ({ thread_id: th.id, person_id })));
        await db.from("kc_club_gruppen").insert({ thread_id: th.id, name, symbol, erstellt_von: ich.person_id });
        const versand = await sendenGewaehlt("club_nachricht", mitglieder, zustellwege(p.wege), {
          titel: `${symbol} Neue Gruppe: ${name}`, kurz: `${ich.name} hat dich zur Gruppe „${name}“ hinzugefügt.`,
          betreff: `Köcheclub Werne – neue Gruppe „${name}“`,
          text: `Hallo,\n\n${ich.name} hat dich zur Gruppe „${name}“ in der Köcheclub-App hinzugefügt.\n\nZur Gruppe: ${APP_URL}#nachricht=${th.id}\n\nViele Grüße\nKöcheclub Werne`,
          url: `${APP_URL}#nachricht=${th.id}`,
        }, `club-gruppe-neu:${th.id}`);
        await protokoll(ich.person_id, "gruppe_angelegt", { gruppe: th.id, name, mitglieder: mitglieder.length, versand });
        return json({ ok: true, id: th.id });
      }

      case "gruppe_aendern": {
        const { g, darfVerwalten } = await gruppeHolen(ich, p.id);
        if (!darfVerwalten) throw new Fehler("Die Gruppe verwaltet, wer sie angelegt hat (oder Clubsprecher/Kassenwart).", 403);
        const upd: Record<string, unknown> = { geaendert_am: jetzt() };
        if (p.name !== undefined) { const n = txt(p.name, 60); if (!n) throw new Fehler("Bitte einen Namen eingeben."); upd.name = n; await db.from("kc_communication_threads").update({ subject: n }).eq("id", g.thread_id); }
        if (p.symbol !== undefined && GRUPPEN_SYMBOLE.includes(String(p.symbol))) upd.symbol = String(p.symbol);
        const aktiv = new Set((await aktiveMitglieder()).map((m) => m.person_id));
        const hinzu = ([...new Set((Array.isArray(p.hinzu) ? p.hinzu : []).map(String))] as string[]).filter((id) => aktiv.has(id)).slice(0, 60);
        const weg = ([...new Set((Array.isArray(p.weg) ? p.weg : []).map(String))] as string[]).filter((id) => id !== g.erstellt_von);
        await db.from("kc_club_gruppen").update(upd).eq("thread_id", g.thread_id);
        let neu: string[] = [];
        if (hinzu.length) {
          const { data: da } = await db.from("kc_communication_thread_participants").select("person_id").eq("thread_id", g.thread_id).in("person_id", hinzu);
          const schon = new Set((da ?? []).map((x: any) => x.person_id));
          neu = hinzu.filter((id) => !schon.has(id));
          if (neu.length) await db.from("kc_communication_thread_participants").insert(neu.map((person_id) => ({ thread_id: g.thread_id, person_id })));
        }
        if (weg.length) await db.from("kc_communication_thread_participants").delete().eq("thread_id", g.thread_id).in("person_id", weg);
        const name = String(upd.name ?? g.name), symbol = String(upd.symbol ?? g.symbol);
        if (neu.length) await senden("club_nachricht", neu, {
          titel: `${symbol} Gruppe: ${name}`, kurz: `${ich.name} hat dich zur Gruppe „${name}“ hinzugefügt.`,
          betreff: `Köcheclub Werne – Gruppe „${name}“`,
          text: `Hallo,\n\n${ich.name} hat dich zur Gruppe „${name}“ in der Köcheclub-App hinzugefügt.\n\nZur Gruppe: ${APP_URL}#nachricht=${g.thread_id}\n\nViele Grüße\nKöcheclub Werne`,
          url: `${APP_URL}#nachricht=${g.thread_id}`,
        }, `club-gruppe-dazu:${g.thread_id}:${Date.now()}`);
        await protokoll(ich.person_id, "gruppe_geaendert", { gruppe: g.thread_id, vorher: { name: g.name, symbol: g.symbol }, hinzu: neu, weg });
        return json({ ok: true });
      }

      // KC-CLUB-GRUPPE-LOESCHEN (1.3.0, Wunsch Hansi „Angelegte Gruppen müssen löschbar sein“): für alle auflösen –
      // wer die Gruppe angelegt hat oder Clubsprecher/Kassenwart/Admin; vollständige Sicherung im Änderungsprotokoll vorher
      case "gruppe_loeschen": {
        const { g, darfVerwalten } = await gruppeHolen(ich, p.id);
        if (!darfVerwalten) throw new Fehler("Löschen darf, wer die Gruppe angelegt hat (oder Clubsprecher/Kassenwart).", 403);
        const [{ data: t }, { data: tn }, { data: msgs }] = await Promise.all([
          db.from("kc_communication_threads").select("*").eq("id", g.thread_id).single(),
          db.from("kc_communication_thread_participants").select("*").eq("thread_id", g.thread_id),
          db.from("kc_communication_messages").select("*").eq("thread_id", g.thread_id).order("created_at").limit(2000),
        ]);
        await geloescht(ich, "gruppe", { gruppe: g, unterhaltung: t, teilnehmer: tn ?? [], nachrichten: msgs ?? [] });
        const { error } = await db.from("kc_communication_threads").delete().eq("id", g.thread_id); // Teilnehmer, Nachrichten, Gruppe: ON DELETE CASCADE
        if (error) throw new Fehler("Gruppe konnte nicht gelöscht werden.", 500);
        const andere = (tn ?? []).map((x: any) => x.person_id).filter((id: string) => id !== ich.person_id);
        if (andere.length) await senden("club_nachricht", andere, {
          titel: `${g.symbol} Gruppe aufgelöst: ${g.name}`, kurz: `${ich.name} hat die Gruppe „${g.name}“ gelöscht.`,
          betreff: `Köcheclub Werne – Gruppe „${g.name}“ aufgelöst`,
          text: `Hallo,\n\n${ich.name} hat die Gruppe „${g.name}“ in der Köcheclub-App gelöscht. Sie steht nicht mehr in deinen Nachrichten.\n\nViele Grüße\nKöcheclub Werne`,
          url: `${APP_URL}#nachrichten`,
        }, `club-gruppe-weg:${g.thread_id}`).catch((e) => console.error("gruppe_loeschen senden", String(e)));
        return json({ ok: true });
      }

      case "gruppe_verlassen": {
        const { g } = await gruppeHolen(ich, p.id);
        await binTeilnehmer(g.thread_id, ich.person_id);
        const { count } = await db.from("kc_communication_thread_participants").select("person_id", { count: "exact", head: true }).eq("thread_id", g.thread_id);
        if (g.erstellt_von === ich.person_id && (count ?? 0) > 1) throw new Fehler("Du hast die Gruppe angelegt – bitte erst die anderen entfernen oder die Gruppe behalten.", 409);
        await db.from("kc_communication_thread_participants").delete().eq("thread_id", g.thread_id).eq("person_id", ich.person_id);
        await protokoll(ich.person_id, "gruppe_verlassen", { gruppe: g.thread_id, name: g.name });
        return json({ ok: true });
      }

      // ----- Online & Anklopfen (KC-CLUB-ONLINE) -----
      case "online": {
        const zeigen = (await onlineZeigenMap([ich.person_id])).get(ich.person_id) !== false;
        const seit = new Date(Date.now() - ANKLOPFEN_SEK * 1000).toISOString();
        const [on, { data: anMich }, { data: vonMir }] = await Promise.all([
          zeigen ? onlineJetzt() : Promise.resolve(new Set<string>()),
          db.from("kc_club_anklopfen").select("id,von,erstellt_am").eq("an", ich.person_id).eq("status", "offen").gte("erstellt_am", seit).order("erstellt_am", { ascending: false }).limit(3),
          db.from("kc_club_anklopfen").select("id,an,status,thread_id,beantwortet_am,antwort").eq("von", ich.person_id).gte("erstellt_am", new Date(Date.now() - 600000).toISOString()),
        ]);
        const { data: rufe } = await db.from("kc_club_anruf").select("id,von,art,erstellt_am").eq("an", ich.person_id).eq("status", "klingelt").eq("automatisch", false).gte("erstellt_am", new Date(Date.now() - ANRUF_KLINGEL_SEK * 1000).toISOString()).order("erstellt_am", { ascending: false }).limit(1);
        // KC-CLUB-ANRUF-VERPASST (0.81.0): nicht angenommen, nicht selbst abgelehnt, Hinweis noch nicht gesehen (letzte 24 h).
        // Nicht melden, wenn wir danach doch miteinander telefoniert haben (z. B. nach gleichzeitigem Anrufen).
        const klingelEnde = new Date(Date.now() - ANRUF_KLINGEL_SEK * 1000).toISOString();
        const { data: verp0 } = await db.from("kc_club_anruf").select("id,von,art,erstellt_am").eq("an", ich.person_id).eq("automatisch", false).is("angenommen_am", null).is("verpasst_gesehen_am", null)
          .gte("erstellt_am", new Date(Date.now() - 86400000).toISOString()).or(`status.eq.verpasst,and(status.eq.klingelt,erstellt_am.lt."${klingelEnde}")`).order("erstellt_am", { ascending: false }).limit(5);
        let verp: any[] = verp0 ?? [];
        if (verp.length) {
          const { data: spaeter } = await db.from("kc_club_anruf").select("von,an,angenommen_am").not("angenommen_am", "is", null).gte("angenommen_am", verp[verp.length - 1].erstellt_am)
            .or(`von.eq.${ich.person_id},an.eq.${ich.person_id}`);
          verp = verp.filter((v) => !(spaeter ?? []).some((s: any) => [s.von, s.an].includes(v.von) && s.angenommen_am > v.erstellt_am));
        }
        on.delete(ich.person_id);
        const klopfbar = await anklopfenErlaubtMap([...on]);
        const leute = await personen([...on, ...(anMich ?? []).map((x: any) => x.von), ...(vonMir ?? []).map((x: any) => x.an), ...(rufe ?? []).map((x: any) => x.von), ...verp.map((x: any) => x.von)]);
        const wer = (id: string) => ({ person_id: id, name: leute.get(id)?.display_name || id, vorname: vorname(leute.get(id) ?? null) || id });
        return json({ zeigen, verpasst: verp.map((x: any) => ({ id: x.id, von: wer(x.von), art: x.art, zeit: x.erstellt_am })), online: [...on].map((id) => ({ ...wer(id), klopfbar: klopfbar.get(id) !== false })), klopfen: (anMich ?? []).map((x: any) => ({ id: x.id, von: wer(x.von), zeit: x.erstellt_am })),
          klopfAntworten: (anMich ?? []).length ? Object.entries(KLOPF_ANTWORTEN).map(([id, text]) => ({ id, text })) : undefined,
          antworten: (vonMir ?? []).map((x: any) => ({ id: x.id, an: wer(x.an), status: x.status, thread: x.thread_id, antwort: x.antwort ?? null })),
          anrufe: (rufe ?? []).map((x: any) => ({ id: x.id, von: wer(x.von), art: x.art, zeit: x.erstellt_am })) });
      }

      case "anklopfen": {
        const an = String(p.an || "");
        if (an === ich.person_id) throw new Fehler("Bei dir selbst kannst du nicht anklopfen 🙂");
        if (!(await aktiveMitglieder()).some((m) => m.person_id === an)) throw new Fehler("Mitglied nicht gefunden.", 404);
        if ((await anklopfenErlaubtMap([an])).get(an) === false) {
          const pa = (await personen([an])).get(an) ?? null;
          throw new Fehler(`${vorname(pa) || "Das Mitglied"} hat Anklopfen ausgeschaltet – schreib einfach eine Nachricht.`, 409);
        }
        // Bremse: ein offenes Anklopfen je Person reicht (innerhalb von 3 Minuten)
        const { data: offen } = await db.from("kc_club_anklopfen").select("id").eq("von", ich.person_id).eq("an", an).eq("status", "offen").gte("erstellt_am", new Date(Date.now() - ANKLOPFEN_SEK * 1000).toISOString()).limit(1);
        if (offen?.length) return json({ ok: true, id: offen[0].id, schon: true });
        const { data: k, error } = await db.from("kc_club_anklopfen").insert({ von: ich.person_id, an }).select("id").single();
        if (error || !k) throw new Fehler("Anklopfen hat nicht geklappt.", 500);
        // Push (nur wer die App schon benutzt; keine Mail – Anklopfen ist nur jetzt sinnvoll)
        const { data: zug } = await db.from("kc_club_zugang").select("person_id").eq("person_id", an).eq("aktiv", true).not("zuletzt_gesehen", "is", null);
        let versand = { gesendet: 0, fehler: 0 };
        if (zug?.length) versand = await routerSenden("club_nachricht_push", [an], {
          titel: `👋 ${ich.vorname} klopft an`, kurz: "Möchtest du das Gespräch annehmen? Hier antippen.",
          betreff: `${ich.vorname} klopft an`, text: `${ich.name} möchte kurz mit dir schreiben.`, url: `${APP_URL}#anklopfen=${k.id}`,
        }, `club-anklopfen:${k.id}`);
        await protokoll(ich.person_id, "angeklopft", { an, versand });
        return json({ ok: true, id: k.id, push: versand.gesendet > 0 });
      }

      // KC-CLUB-ANKLOPFEN-WARTEN (1.51.0): wer anklopft, legt auf → beim Gegenüber verschwindet die Frage
      case "anklopfen_abbrechen": {
        const { data: k } = await db.from("kc_club_anklopfen").select("id,status").eq("id", String(p.id || "")).eq("von", ich.person_id).maybeSingle();
        if (!k) throw new Fehler("Anklopfen nicht gefunden.", 404);
        if (k.status === "offen") await db.from("kc_club_anklopfen").update({ status: "abgebrochen", beantwortet_am: jetzt() }).eq("id", k.id).eq("status", "offen");
        return json({ ok: true });
      }

      case "anklopfen_antwort": {
        const { data: k } = await db.from("kc_club_anklopfen").select("*").eq("id", String(p.id || "")).eq("an", ich.person_id).maybeSingle();
        if (!k) throw new Fehler("Anklopfen nicht gefunden.", 404);
        if (k.status !== "offen") return json({ ok: true, status: k.status, thread: k.thread_id });
        if (!p.annehmen) {
          const antwort = typeof p.antwort === "string" && KLOPF_ANTWORTEN[p.antwort] ? KLOPF_ANTWORTEN[p.antwort] : null;
          await db.from("kc_club_anklopfen").update({ status: "spaeter", beantwortet_am: jetzt(), ...(antwort ? { antwort } : {}) }).eq("id", k.id);
          return json({ ok: true, status: "spaeter", antwort });
        }
        let thread = await zweierGespraech(k.von, ich.person_id);
        if (!thread) {
          const { data: th, error } = await db.from("kc_communication_threads").insert({ org_id: ORG, subject: "", created_by_person_id: k.von }).select("id").single();
          if (error || !th) throw new Fehler("Gespräch konnte nicht geöffnet werden.", 500);
          thread = th.id as string;
          await db.from("kc_communication_thread_participants").insert([k.von, ich.person_id].map((person_id) => ({ thread_id: thread, person_id })));
        }
        await db.from("kc_club_anklopfen").update({ status: "angenommen", beantwortet_am: jetzt(), thread_id: thread }).eq("id", k.id);
        await protokoll(ich.person_id, "anklopfen_angenommen", { von: k.von });
        return json({ ok: true, status: "angenommen", thread });
      }

      // ----- Anruf per Ton (KC-CLUB-ANRUF, Test) -----
      case "anruf_start": {
        const an = String(p.an || "");
        if (an === ich.person_id) throw new Fehler("Dich selbst kannst du nicht anrufen 🙂");
        if (!(await aktiveMitglieder()).some((m) => m.person_id === an)) throw new Fehler("Mitglied nicht gefunden.", 404);
        const angebot = sdpText(p.angebot);
        // alte, noch klingelnde Anrufe von mir beenden (nur einer gleichzeitig)
        // KC-CLUB-KONFERENZ (0.82.0): aus einem laufenden Gespräch jemanden dazuholen → Einladung gehört zur Konferenz
        let konferenz: string | null = null;
        if (p.konferenz_mit) {
          const a0 = await anrufHolen(ich, p.konferenz_mit);
          if (a0.status !== "angenommen") throw new Fehler("Dazuholen geht nur während eines Gesprächs.", 409);
          const kid: string = a0.konferenz_id || crypto.randomUUID(); konferenz = kid;
          const k = await konferenzBeine(kid); k.teilnehmer.add(a0.von); k.teilnehmer.add(a0.an);
          if (k.teilnehmer.has(an) || k.eingeladen.has(an)) throw new Fehler("Ist schon in der Konferenz.", 409);
          if (k.teilnehmer.size + k.eingeladen.size >= KONFERENZ_MAX) throw new Fehler(`Eine Konferenz geht mit höchstens ${KONFERENZ_MAX} Personen.`, 409);
          if (!a0.konferenz_id) await db.from("kc_club_anruf").update({ konferenz_id: konferenz }).eq("id", a0.id);
        }
        await db.from("kc_club_anruf").update({ status: "beendet", beendet_am: jetzt(), beendet_von: ich.person_id }).eq("von", ich.person_id).eq("status", "klingelt").eq("automatisch", false);
        // KC-CLUB-GEGENANRUF (0.80.0): ruft mich die Gegenseite gerade selbst an, keinen zweiten Anruf anlegen –
        // sonst warten beide auf ihren eigenen Anruf, und keiner sieht „Annehmen“. Die App nimmt stattdessen den der Gegenseite an.
        const { data: gegen } = konferenz ? { data: [] as any[] } : await db.from("kc_club_anruf").select("id").eq("von", an).eq("an", ich.person_id).eq("status", "klingelt").eq("automatisch", false)
          .gte("erstellt_am", new Date(Date.now() - ANRUF_KLINGEL_SEK * 1000).toISOString()).order("erstellt_am", { ascending: false }).limit(1);
        if (gegen?.length) { await protokoll(ich.person_id, "anruf_gegenanruf", { an, anruf: gegen[0].id }); return json({ ok: true, gegenanruf: gegen[0].id }); }
        const art = p.art === "video" && !konferenz ? "video" : "ton"; // KC-CLUB-VIDEO (0.32.0) · Konferenz nur mit Ton
        const { data: a, error } = await db.from("kc_club_anruf").insert({ von: ich.person_id, an, art, angebot, konferenz_id: konferenz }).select("id").single();
        if (error || !a) throw new Fehler("Anruf konnte nicht gestartet werden.", 500);
        const { data: zug } = await db.from("kc_club_zugang").select("person_id").eq("person_id", an).eq("aktiv", true).not("zuletzt_gesehen", "is", null);
        let versand = { gesendet: 0, fehler: 0 };
        if (zug?.length) versand = await routerSenden("club_nachricht_push", [an], {
          titel: konferenz ? `👥 ${ich.vorname} holt dich in eine Konferenz` : art === "video" ? `🎥 ${ich.vorname} ruft per Video an` : `📞 ${ich.vorname} ruft an`, kurz: "Antippen zum Annehmen (Köcheclub-App).",
          betreff: `${ich.vorname} ruft an`, text: `${ich.name} ruft dich über die Köcheclub-App an.`, url: `${APP_URL}#anruf=${a.id}`,
        }, `club-anruf:${a.id}`);
        await protokoll(ich.person_id, "anruf_gestartet", { an, art, versand, ...(konferenz ? { konferenz } : {}) });
        return json({ ok: true, id: a.id, push: versand.gesendet > 0, konferenz });
      }

      case "anruf_status": {
        const a = await anrufHolen(ich, p.id), ichRufe = a.von === ich.person_id;
        const leute = await personen([a.von, a.an]), gegen = ichRufe ? a.an : a.von;
        return json({ id: a.id, status: a.status, ichRufe, art: a.art, erstellt_am: a.erstellt_am, konferenz: a.konferenz_id ?? null,
          gegenueber: { person_id: gegen, name: leute.get(gegen)?.display_name || gegen, vorname: vorname(leute.get(gegen) ?? null) || gegen },
          // SDP nur an die jeweils andere Seite
          ...(ichRufe ? { antwort: a.antwort, kurzantwort: a.kurzantwort ?? null } : { angebot: a.angebot }) });
      }

      case "anruf_annehmen": {
        const a = await anrufHolen(ich, p.id);
        if (a.an !== ich.person_id) throw new Fehler("Nur der Angerufene kann annehmen.", 403);
        if (a.status !== "klingelt") throw new Fehler(a.status === "verpasst" ? "Der Anruf ist schon vorbei." : "Der Anruf wurde schon beendet.", 409);
        await db.from("kc_club_anruf").update({ status: "angenommen", antwort: sdpText(p.antwort), angenommen_am: jetzt() }).eq("id", a.id);
        return json({ ok: true });
      }

      // KC-CLUB-ANRUF-KURZANTWORT (0.81.0): Anruf ablehnen (oder verpassten beantworten) und dem Anrufer kurz schreiben.
      // Die Antwort steht sofort in seinem Anrufbildschirm und zusätzlich als Nachricht in eurer Unterhaltung.
      case "anruf_antwort": {
        const a = await anrufHolen(ich, p.id);
        if (a.an !== ich.person_id) throw new Fehler("Nur der Angerufene kann antworten.", 403);
        if (a.angenommen_am) throw new Fehler("Der Anruf wurde schon angenommen.", 409);
        const text = txt(p.text, ANRUF_EIGEN_ZEICHEN);
        if (!text) throw new Fehler("Bitte eine Antwort wählen oder schreiben.");
        await db.from("kc_club_anruf").update({ kurzantwort: text, verpasst_gesehen_am: jetzt(),
          ...(a.status === "klingelt" ? { status: "abgelehnt", beendet_am: jetzt(), beendet_von: ich.person_id } : {}) }).eq("id", a.id);
        // als Nachricht in die Zweier-Unterhaltung (anlegen, falls es noch keine gibt)
        let threadId = await zweierGespraech(ich.person_id, a.von);
        if (!threadId) {
          const { data: th } = await db.from("kc_communication_threads").insert({ org_id: ORG, subject: "", created_by_person_id: ich.person_id }).select("id").single();
          if (th) { threadId = th.id; await db.from("kc_communication_thread_participants").insert([ich.person_id, a.von].map((person_id) => ({ thread_id: th.id, person_id }))); }
        }
        let versand = { gesendet: 0, fehler: 0 } as any;
        if (threadId) {
          const body = `📞 Zu deinem Anruf: ${text}`;
          const { data: m } = await db.from("kc_communication_messages").insert({ thread_id: threadId, sender_person_id: ich.person_id, body }).select("id,created_at").single();
          await Promise.all([
            db.from("kc_communication_thread_participants").update({ hidden_at: null }).eq("thread_id", threadId).not("hidden_at", "is", null),
            db.from("kc_communication_threads").update({ updated_at: jetzt() }).eq("id", threadId),
            m ? db.from("kc_communication_thread_participants").update({ last_read_at: m.created_at }).eq("thread_id", threadId).eq("person_id", ich.person_id) : Promise.resolve(),
          ]);
          if (m) versand = await senden("club_nachricht", [a.von], {
            titel: `💬 ${ich.name}`, kurz: text, betreff: `Köcheclub Werne – ${ich.name} zu deinem Anruf`,
            text: `Hallo,\n\n${ich.name} konnte deinen Anruf gerade nicht annehmen und schreibt:\n\n${text}\n\nIn der Köcheclub-App: ${APP_URL}#nachricht=${threadId}\n\nViele Grüße\nKöcheclub Werne`,
            url: `${APP_URL}#nachricht=${threadId}`,
          }, `club-anruf-antwort:${a.id}`);
        }
        await protokoll(ich.person_id, "anruf_kurzantwort", { anruf: a.id, an: a.von, versand });
        return json({ ok: true, thread: threadId });
      }

      // KC-CLUB-KONFERENZ (0.82.0): klingelnden Anruf in das laufende Gespräch dazunehmen (statt auflegen)
      case "konferenz_dazu": {
        const a0 = await anrufHolen(ich, p.laufend), n = await anrufHolen(ich, p.neu);
        if (a0.status !== "angenommen") throw new Fehler("Dazunehmen geht nur während eines Gesprächs.", 409);
        if (n.an !== ich.person_id || n.status !== "klingelt" || n.automatisch) throw new Fehler("Der Anruf ist schon vorbei.", 409);
        if (n.art !== "ton") throw new Fehler("Konferenz geht zurzeit nur mit Ton – bitte als Videoanruf einzeln annehmen.", 409);
        if (n.konferenz_id && n.konferenz_id !== a0.konferenz_id) throw new Fehler("Das ist eine Einladung in eine andere Konferenz – bitte erst auflegen.", 409);
        const konferenz = a0.konferenz_id || crypto.randomUUID();
        const k = await konferenzBeine(konferenz); k.teilnehmer.add(a0.von); k.teilnehmer.add(a0.an); k.teilnehmer.add(n.von);
        if (k.teilnehmer.size + k.eingeladen.size > KONFERENZ_MAX) throw new Fehler(`Eine Konferenz geht mit höchstens ${KONFERENZ_MAX} Personen.`, 409);
        await db.from("kc_club_anruf").update({ konferenz_id: konferenz }).in("id", [a0.id, n.id]);
        await protokoll(ich.person_id, "konferenz_dazu", { konferenz, dazu: n.von });
        return json({ ok: true, konferenz });
      }

      // KC-CLUB-KONFERENZ (0.82.0): Stand der Konferenz – Teilnehmer, Eingeladene und meine Beine (Verbindungsdaten nur an die jeweils andere Seite)
      case "konferenz_status": {
        const konferenz = String(p.konferenz || "");
        if (!/^[0-9a-f-]{36}$/.test(konferenz)) throw new Fehler("Konferenz nicht gefunden.", 404);
        const k = await konferenzBeine(konferenz);
        const meine = k.beine.filter((b: any) => b.von === ich.person_id || b.an === ich.person_id);
        if (!k.teilnehmer.has(ich.person_id) && !meine.length) return json({ dabei: false });
        const leute = await personen([...k.teilnehmer, ...k.eingeladen]);
        const wer = (id: string) => ({ person_id: id, name: leute.get(id)?.display_name || id, vorname: vorname(leute.get(id) ?? null) || id });
        return json({ dabei: true, konferenz, max: KONFERENZ_MAX, teilnehmer: [...k.teilnehmer].map(wer), eingeladen: [...k.eingeladen].map(wer),
          beine: meine.map((b: any) => ({ id: b.id, von: b.von, an: b.an, status: b.status, auto: b.automatisch,
            ...(b.an === ich.person_id && b.status === "klingelt" ? { angebot: b.angebot } : {}),
            ...(b.von === ich.person_id && b.status === "angenommen" ? { antwort: b.antwort } : {}) })) });
      }

      // KC-CLUB-KONFERENZ (0.82.0): Querverbindung zu einem anderen Teilnehmer (klingelt nicht – die andere App nimmt selbst an)
      case "konferenz_bein": {
        const konferenz = String(p.konferenz || ""), an = String(p.an || "");
        const k = await konferenzBeine(konferenz);
        if (!k.teilnehmer.has(ich.person_id) || !k.teilnehmer.has(an) || an === ich.person_id) throw new Fehler("Nicht in dieser Konferenz.", 403);
        const da = k.beine.find((b: any) => (b.von === ich.person_id && b.an === an) || (b.von === an && b.an === ich.person_id));
        if (da) return json({ ok: true, id: da.id, schonDa: true });
        const { data: b, error } = await db.from("kc_club_anruf").insert({ von: ich.person_id, an, art: "ton", angebot: sdpText(p.angebot), konferenz_id: konferenz, automatisch: true }).select("id").single();
        if (error || !b) throw new Fehler("Verbindung konnte nicht angelegt werden.", 500);
        return json({ ok: true, id: b.id });
      }

      // KC-CLUB-HEARTBEAT (0.84.0): Lebenszeichen der Club-App im KICC-Format an den gemeinsamen Empfänger
      // kicc-program-heartbeat weiterreichen (Erlaubt-Liste, Nonce, Frische, Takt und Ablage in kicc_program_heartbeats
      // macht dieser) – so braucht die App keinen Schlüssel im Browser. Nur Technik, keine Namen/Inhalte.
      case "lebenszeichen": {
        const geraet = String(p.geraet || "");
        if (!/^[A-Za-z0-9._:-]{6,120}$/.test(geraet)) throw new Fehler("Gerät unbekannt.");
        const zeit = new Date().toISOString(), version = txt(req.headers.get("x-club-version"), 20) || null, hinten = p.sichtbar === false;
        // KC-CLUB-DATENSTROM (0.89.0): Zählerstand der Datenabrufe des Geräts (nur steigend, nur Zahl) → trafficTx; sourceId =
        // Programm, damit der KC System Check die Linie „KC Club-App → Supabase“ zuordnet (das Gerät steht in instanceId).
        const verkehr = Number.isSafeInteger(p.verkehr) && p.verkehr >= 0 ? p.verkehr : null;
        const umschlag = { schema: "kicc.remote-program-heartbeat.v1", nonce: crypto.randomUUID(), sentAt: zeit, authState: "AUTHENTICATED", sourceId: "kc-clubapp",
          heartbeat: { schema: "kicc.program-heartbeat.v1", programId: "kc-clubapp", instanceId: geraet, deviceId: `program:kc-clubapp:${geraet}`, name: "KC Club-App",
            deviceType: "PROGRAM", version, build: version, status: hinten ? "DEGRADED" : "ONLINE", measuredAt: zeit, latencyMs: null, trafficRx: null, trafficTx: verkehr,
            queueDepth: 0, errorCount: 0, source: "KC_PROGRAM_SELF_HEARTBEAT", trust: "SELF_REPORTED", message: hinten ? "KC Club-App im Hintergrund" : "KC Club-App aktiv" } };
        try {
          const r = await fetch(`${SUPA}/functions/v1/kicc-program-heartbeat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE}`, apikey: SERVICE }, body: JSON.stringify(umschlag) });
          const out: any = await r.json().catch(() => ({}));
          return json({ ok: r.ok && out?.ok !== false, grund: r.ok ? null : String(out?.error || `HTTP ${r.status}`) });
        } catch { return json({ ok: false, grund: "KICC nicht erreichbar" }); }
      }

      // KC-CLUB-ANRUF-VERPASST (0.81.0): Hinweis „Verpasster Anruf“ gesehen
      case "anruf_verpasst_gesehen": {
        const ids = (Array.isArray(p.ids) ? p.ids : []).map(String).slice(0, 20);
        if (ids.length) await db.from("kc_club_anruf").update({ verpasst_gesehen_am: jetzt() }).eq("an", ich.person_id).in("id", ids).is("verpasst_gesehen_am", null);
        return json({ ok: true });
      }

      case "anruf_ende": {
        const a = await anrufHolen(ich, p.id);
        if (["klingelt", "angenommen"].includes(a.status)) {
          const status = a.status === "klingelt" ? (a.an === ich.person_id ? "abgelehnt" : "verpasst") : "beendet";
          await db.from("kc_club_anruf").update({ status, beendet_am: jetzt(), beendet_von: ich.person_id }).eq("id", a.id);
          if (a.status === "angenommen") await protokoll(ich.person_id, "anruf_beendet", { dauer_s: a.angenommen_am ? Math.round((Date.now() - new Date(a.angenommen_am).getTime()) / 1000) : 0, verbunden: !!p.verbunden });
          return json({ ok: true, status });
        }
        return json({ ok: true, status: a.status });
      }

      // ----- To-do-Liste (KC-CLUB-TODO) -----
      case "todo_liste": {
        const { data } = await db.from("kc_club_todo").select("id,person_id,text,kategorie,fuer,faellig,erstellt_am,erledigt_am,erledigt_von,zustaendig,zustaendige").is("entfernt_am", null)
          .or(`person_id.eq.${ich.person_id},fuer.eq.alle,zustaendig.eq.${ich.person_id},zustaendige.cs.{${ich.person_id}}`).order("erstellt_am", { ascending: true }).limit(300);
        const zust = (x: any): string[] => (x.zustaendige?.length ? x.zustaendige : x.zustaendig ? [x.zustaendig] : []);
        const leute = await personen([...(data ?? []).map((x: any) => x.person_id), ...(data ?? []).map((x: any) => x.erledigt_von).filter(Boolean), ...(data ?? []).flatMap(zust)]);
        const vn = (id: string) => vorname(leute.get(id) ?? null) || id;
        return json({ kategorien: TODO_KATEGORIEN, eintraege: (data ?? []).map((x: any) => ({ id: x.id, text: x.text, kategorie: x.kategorie, fuer: x.fuer, faellig: x.faellig,
          vonMir: x.person_id === ich.person_id, von: vn(x.person_id), erledigt: x.erledigt_am, erledigtVon: x.erledigt_von ? vn(x.erledigt_von) : null,
          darfLoeschen: x.person_id === ich.person_id || ich.vorstand,
          // KC-CLUB-TODO-ZUSTAENDIG (0.37.0): wer soll es machen
          zustaendig: x.zustaendig ? { person_id: x.zustaendig, vorname: vn(x.zustaendig), ich: x.zustaendig === ich.person_id } : null,
          // KC-CLUB-TODO-MEHRERE (0.52.0): alle Zuständigen
          zustaendige: zust(x).map((id) => ({ person_id: id, vorname: vn(id), ich: id === ich.person_id })),
          darfZuweisen: x.person_id === ich.person_id || ich.vorstand })) });
      }

      case "todo_anlegen": {
        const text = txt(p.text, 200);
        if (!text) throw new Fehler("Bitte kurz aufschreiben, was zu tun ist.");
        const kategorie = TODO_KATEGORIEN.some((k) => k.id === p.kategorie) ? String(p.kategorie) : "sonstiges";
        const faellig = /^\d{4}-\d{2}-\d{2}$/.test(String(p.faellig || "")) ? String(p.faellig) : null;
        const { count } = await db.from("kc_club_todo").select("id", { count: "exact", head: true }).eq("person_id", ich.person_id).is("entfernt_am", null).is("erledigt_am", null);
        if ((count ?? 0) >= 100) throw new Fehler("Du hast schon 100 offene Einträge – bitte erst etwas abhaken oder löschen.", 409);
        const zustaendige = await todoZustaendige(p.zustaendige ?? p.zustaendig);
        const { data: t, error } = await db.from("kc_club_todo").insert({ person_id: ich.person_id, text, kategorie, fuer: p.fuer === "alle" ? "alle" : "ich", faellig,
          zustaendig: zustaendige[0] ?? null, zustaendige }).select("id").single();
        if (error || !t) throw new Fehler("Eintrag konnte nicht gespeichert werden.", 500);
        const benachrichtigt: string[] = [];
        for (const an of zustaendige.filter((id) => id !== ich.person_id)) { await todoBenachrichtigen(ich, an, text, faellig, t.id); benachrichtigt.push(an); }
        return json({ ok: true, id: t.id, versand: benachrichtigt.length ? { benachrichtigt: benachrichtigt.length } : null });
      }

      case "todo_erledigt": {
        const { data: t } = await db.from("kc_club_todo").select("id,person_id,fuer,zustaendig,zustaendige").eq("id", String(p.id || "")).is("entfernt_am", null).maybeSingle();
        if (!t || (t.person_id !== ich.person_id && t.fuer !== "alle" && t.zustaendig !== ich.person_id && !(t.zustaendige ?? []).includes(ich.person_id))) throw new Fehler("Eintrag nicht gefunden.", 404);
        await db.from("kc_club_todo").update(p.erledigt ? { erledigt_am: jetzt(), erledigt_von: ich.person_id } : { erledigt_am: null, erledigt_von: null }).eq("id", t.id);
        return json({ ok: true });
      }

      case "todo_zuweisen": {
        const { data: t } = await db.from("kc_club_todo").select("id,person_id,text,faellig,zustaendig,zustaendige").eq("id", String(p.id || "")).is("entfernt_am", null).maybeSingle();
        if (!t) throw new Fehler("Eintrag nicht gefunden.", 404);
        if (t.person_id !== ich.person_id && !ich.vorstand) throw new Fehler("Zuweisen darf nur, wer den Eintrag angelegt hat.", 403);
        const vorher: string[] = t.zustaendige?.length ? t.zustaendige : t.zustaendig ? [t.zustaendig] : [];
        const zustaendige = await todoZustaendige(p.zustaendige ?? p.zustaendig);
        await db.from("kc_club_todo").update({ zustaendig: zustaendige[0] ?? null, zustaendige }).eq("id", t.id);
        // Bescheid nur an neu Hinzugekommene (nicht an mich, nicht an bisherige)
        const neu = zustaendige.filter((id) => id !== ich.person_id && !vorher.includes(id));
        for (const an of neu) await todoBenachrichtigen(ich, an, t.text, t.faellig, t.id);
        await protokoll(ich.person_id, "todo_zustaendige", { todo: t.id, vorher, nachher: zustaendige });
        return json({ ok: true, versand: neu.length ? { benachrichtigt: neu.length } : null });
      }

      case "todo_loeschen": {
        const { data: t } = await db.from("kc_club_todo").select("id,person_id").eq("id", String(p.id || "")).is("entfernt_am", null).maybeSingle();
        if (!t) throw new Fehler("Eintrag nicht gefunden.", 404);
        if (t.person_id !== ich.person_id && !ich.vorstand) throw new Fehler("Löschen darf nur, wer den Eintrag angelegt hat.", 403);
        await db.from("kc_club_todo").update({ entfernt_am: jetzt() }).eq("id", t.id);
        return json({ ok: true });
      }

      // ----- Erstattung (KC-CLUB-ERSTATTUNG) -----
      case "erstattung_meine": {
        const { data } = await db.from("kc_club_erstattung").select("id,positionen,summe,auszahlung,bemerkung,status,erstellt_am").eq("person_id", ich.person_id).order("erstellt_am", { ascending: false }).limit(20);
        const { data: rollen } = await db.from("kc_club_rollen").select("person_id,aemter");
        const hat = (amt: string) => (rollen ?? []).some((r: any) => (r.aemter || []).includes(amt));
        const saetze = await kmSaetze();
        return json({ kmSatz: satzFuer(saetze, new Date().toISOString().slice(0, 10)), standard: ERSTATTUNG.kmSatzStandard, saetze, gruende: ERSTATTUNG.gruende, arten: ERSTATTUNG.arten, empfaengerDa: hat(ERSTATTUNG.empfaenger.an) || hat(ERSTATTUNG.empfaenger.cc),
          // KC-CLUB-DRUCK (0.53.0): Positionen und Bemerkung mitliefern – eigener Antrag lässt sich später ausdrucken
          antraege: (data ?? []).map((a: any) => ({ id: a.id, summe: Number(a.summe), anzahl: (a.positionen || []).length, status: a.status, zeit: a.erstellt_am, auszahlung: a.auszahlung,
            positionen: a.positionen || [], bemerkung: a.bemerkung ?? null })) });
      }

      // KC-CLUB-KMSATZ (0.39.0): Kilometerpauschale mit „gilt ab“ – nur Admin
      case "km_satz_setzen": {
        nurAdmin(ich);
        const satz = Math.round(Number(String(p.satz ?? "").replace(",", ".")) * 100) / 100;
        if (!(satz > 0 && satz <= 2)) throw new Fehler("Bitte einen Satz zwischen 0,01 € und 2,00 € je km angeben.");
        const ab = /^\d{4}-\d{2}-\d{2}$/.test(String(p.ab || "")) ? String(p.ab) : "";
        if (!ab) throw new Fehler("Bitte angeben, ab wann der Satz gilt.");
        const { error } = await db.from("kc_club_km_satz").upsert({ satz, gilt_ab: ab, erstellt_von: ich.person_id, erstellt_am: jetzt() }, { onConflict: "gilt_ab" });
        if (error) throw new Fehler("Satz konnte nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, "km_satz_gesetzt", { satz, ab });
        return json({ ok: true, saetze: await kmSaetze() });
      }

      case "km_satz_loeschen": {
        nurAdmin(ich);
        await db.from("kc_club_km_satz").delete().eq("id", String(p.id || ""));
        await protokoll(ich.person_id, "km_satz_geloescht", { id: String(p.id || "") });
        return json({ ok: true, saetze: await kmSaetze() });
      }

      // ----- KC-CLUB-WETTER (0.42.0) -----
      case "wetter": {
        const k = await wetterKonfig();
        // KC-CLUB-WETTERORT: eigener Ort des Mitglieds vor der Club-Vorgabe (Zwischenspeicher je Ort)
        const { data: eo } = await db.from("kc_club_person_einstellung").select("wert").eq("person_id", ich.person_id).eq("schluessel", "wetterort").maybeSingle();
        let eigen = false; try { if ((eo as any)?.wert?.ort) { k.ort = wetterOrtPruefen((eo as any).wert.ort); eigen = true; } } catch { /* Club-Vorgabe */ }
        const q = WETTER_QUELLEN[k.quelle], schl = `${k.quelle}:${k.ort.lat},${k.ort.lon}`;
        let c = wetterCache.get(schl), fehler: string | null = null;
        if (!c || Date.now() - c.zeit > WETTER.cacheMin * 60000) {
          try { c = { zeit: Date.now(), daten: await q.holen(k.ort) }; wetterCache.set(schl, c); }
          catch (e) { fehler = "Wetterdienst gerade nicht erreichbar"; console.error("wetter", String(e)); }
        }
        // Rule 11: „stand“ ist der Abrufzeitpunkt – die App markiert alte Daten; ohne Daten kein Schein-Wetter
        return json({ ort: k.ort, eigenerOrt: eigen, quelle: { id: k.quelle, name: q.name }, app: wetterAppLink(k.app, k.ort), stand: c ? new Date(c.zeit).toISOString() : null, daten: c?.daten ?? null, fehler });
      }

      case "wetter_konfig": {
        nurAdmin(ich);
        const k = await wetterKonfig();
        return json({ ...k, quellen: Object.entries(WETTER_QUELLEN).map(([id, x]) => ({ id, name: x.name, hinweis: x.hinweis })),
          apps: Object.entries(WETTER_APPS).map(([id, x]) => ({ id, name: x.name })), link: wetterAppLink(k.app, k.ort).url });
      }

      case "wetter_ort_suchen": {
        // 0.74.0: auch Mitglieder suchen (eigener Wetterort); eine andere Datenquelle wählt nur der Admin
        const q = txt(p.q, 60); if (q.length < 2) throw new Fehler("Bitte mindestens 2 Buchstaben eingeben.");
        const k = await wetterKonfig(), quelle = (ich.admin && WETTER_QUELLEN[String(p.quelle || "")]) || WETTER_QUELLEN[k.quelle];
        try { return json({ orte: await quelle.suchen(q) }); } catch { throw new Fehler("Ortssuche gerade nicht erreichbar – bitte später noch einmal.", 502); }
      }

      // KC-CLUB-GERAETE-TIPP (0.77.0): „Club-App auch auf Tablet/PC“ – den eigenen Link an die eigene hinterlegte Adresse mailen.
      // Der Link ist der Schlüssel, mit dem diese Anfrage kam (nichts Neues erzeugt, der bisherige bleibt gültig); höchstens
      // 1× je 15 Min.; im Mail-Speicher wird der Schlüssel direkt danach geschwärzt (KC-CLUB-LINKSCHUTZ).
      case "zugang_link_mailen": {
        const schluessel = req.headers.get("x-club-token") || "";
        if (!/^[A-Za-z0-9_-]{16,200}$/.test(schluessel)) throw new Fehler("Link konnte nicht ermittelt werden.", 400);
        const { data: pe } = await db.from("kc_core_people").select("email").eq("person_id", ich.person_id).maybeSingle();
        if (!pe?.email) throw new Fehler("Für dich ist keine E-Mail-Adresse hinterlegt – bitte Hansi Bescheid geben.", 409);
        const seit15 = new Date(Date.now() - 15 * 60000).toISOString();
        const { count } = await db.from("kc_club_protokoll").select("id", { count: "exact", head: true }).eq("person_id", ich.person_id).eq("aktion", "zugang_link_gemailt").gte("zeit", seit15);
        if ((count ?? 0) > 0) throw new Fehler("Die Mail ist schon unterwegs – bitte ein paar Minuten warten und im Posteingang (auch im Spam-Ordner) nachsehen.", 429);
        const link = `${APP_URL}?k=${schluessel}`;
        const versand = await routerSenden("club_nachricht_mail", [ich.person_id], {
          titel: "💻 Die Club-App auf Tablet und PC", kurz: "Dein persönlicher Link für dein weiteres Gerät.",
          betreff: "Köcheclub Werne – die Club-App auf Tablet und PC",
          text: `Hallo ${ich.vorname},\n\nhier ist dein persönlicher Link zur Köcheclub-App für dein Tablet oder deinen PC:\n\n${link}\n\nÖffne diese Mail auf dem Tablet oder PC und tippe auf den Link – fertig. Deine Einstellungen kommen mit (Ansicht, Farbe, Benachrichtigungen); Schriftgröße und Ton stellst du auf jedem Gerät selbst ein.\n\nDer Link gilt auch weiter auf deinem Handy. Bitte nicht weitergeben – er gehört nur dir.\n\nViele Grüße\nKöcheclub Werne`,
          url: link,
        }, `club-zugang-geraet:${ich.person_id}:${Date.now()}`);
        await db.rpc("kc_club_zugangslinks_schwaerzen").then(() => {}, () => {});
        await protokoll(ich.person_id, "zugang_link_gemailt", { versand });
        return json({ ok: (versand.gesendet ?? 0) > 0, versand });
      }

      // KC-CLUB-ANRUF-KURZANTWORT (0.81.0): Schnellantworten für alle einstellen (Admin)
      case "anruf_antworten_setzen": {
        nurAdmin(ich);
        const alt = await anrufAntworten();
        const texte = (Array.isArray(p.texte) ? p.texte : []).map((x: unknown) => txt(x, ANRUF_ANTWORT_ZEICHEN)).filter(Boolean);
        if (!texte.length) throw new Fehler("Bitte mindestens eine Antwort eintragen.");
        if (texte.length > ANRUF_ANTWORTEN_MAX) throw new Fehler(`Höchstens ${ANRUF_ANTWORTEN_MAX} Antworten.`);
        const { error } = await db.from("kc_club_konfig").upsert({ schluessel: "anruf_antworten", wert: { texte }, geaendert_von: ich.person_id, geaendert_am: jetzt() });
        if (error) throw new Fehler("Antworten konnten nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, "anruf_antworten_gesetzt", { vorher: alt.texte, nachher: texte });
        return json({ ok: true, texte });
      }

      case "pinnwand_fristen_setzen": {
        nurAdmin(ich);
        const alt = await pinnwandFristen(), neu: Record<string, number> = {};
        for (const k of Object.keys(PINNWAND_FRISTEN_GRENZEN) as (keyof typeof PINNWAND_FRISTEN_GRENZEN)[]) {
          const n = Math.round(Number(p[k] ?? alt[k])), [lo, hi] = PINNWAND_FRISTEN_GRENZEN[k];
          if (!Number.isFinite(n) || n < lo || n > hi) throw new Fehler(k === "erinnernTage" ? `Erinnern nach: bitte ${lo} bis ${hi} Tage.` : `Wieder fragen nach: bitte ${lo} bis ${hi} Tage.`);
          neu[k] = n;
        }
        const { error } = await db.from("kc_club_konfig").upsert({ schluessel: "pinnwand", wert: neu, geaendert_von: ich.person_id, geaendert_am: jetzt() });
        if (error) throw new Fehler("Fristen konnten nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, "pinnwand_fristen_gesetzt", { vorher: { erinnernTage: alt.erinnernTage, pauseTage: alt.pauseTage }, nachher: neu });
        return json({ ok: true, ...neu });
      }

      case "einstieg_fristen_setzen": {
        nurAdmin(ich);
        const alt = await einstiegFristen(), neu: Record<string, unknown> = { aktiv: p.aktiv === undefined ? alt.aktiv : p.aktiv !== false };
        const namen: Record<string, string> = { farbeTage: "Farb-Tipp ab dem … Nutzungstag", privatTage: "Voreinstellungs-Tipp nach … Tagen", erweitertTage: "Tipp erweiterte Ansicht nach … Tagen", spaeterTage: "„Später“ fragt wieder nach … Tagen", feedbackTage: "Feedback-Frage nach … Tagen", geraeteTage: "Tablet/PC-Tipp nach … Tagen" };
        for (const k of Object.keys(EINSTIEG_GRENZEN) as (keyof typeof EINSTIEG_GRENZEN)[]) {
          const n = Math.round(Number(p[k] ?? alt[k])), [lo, hi] = EINSTIEG_GRENZEN[k];
          if (!Number.isFinite(n) || n < lo || n > hi) throw new Fehler(`${namen[k]}: bitte ${lo} bis ${hi}.`);
          neu[k] = n;
        }
        const { error } = await db.from("kc_club_konfig").upsert({ schluessel: "einstieg", wert: neu, geaendert_von: ich.person_id, geaendert_am: jetzt() });
        if (error) throw new Fehler("Einstellung konnte nicht gespeichert werden.", 500);
        const { geaendertAm: _g, ...vorher } = alt;
        await protokoll(ich.person_id, "einstieg_fristen_gesetzt", { vorher, nachher: neu });
        return json({ ok: true, ...neu });
      }

      case "wetter_setzen": {
        nurAdmin(ich);
        const alt = await wetterKonfig();
        const ort = p.ort ? wetterOrtPruefen(p.ort) : alt.ort;
        const quelle = p.quelle ? String(p.quelle) : alt.quelle, app = p.app ? String(p.app) : alt.app;
        if (!WETTER_QUELLEN[quelle]) throw new Fehler("Unbekannte Wetter-Datenquelle.");
        if (!WETTER_APPS[app]) throw new Fehler("Unbekannte Wetter-App.");
        const { error } = await db.from("kc_club_konfig").upsert({ schluessel: "wetter", wert: { ort, quelle, app }, geaendert_von: ich.person_id, geaendert_am: jetzt() });
        if (error) throw new Fehler("Wetter-Einstellung konnte nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, "wetter_gesetzt", { vorher: { ort: alt.ort.name, quelle: alt.quelle, app: alt.app }, nachher: { ort: ort.name, quelle, app } });
        return json({ ok: true });
      }

      case "erstattung_senden": {
        const saetze = await kmSaetze(), pos = erstattungPruefen(p.positionen, ich, saetze);
        // Belege: nur eigene, frisch hochgeladene Dateien
        const belege = [...new Set(pos.flatMap((x) => x.belege))] as string[];
        if (belege.length) {
          const { data: att } = await db.from("kc_communication_attachments").select("id,object_path").in("id", belege);
          if ((att ?? []).length !== belege.length || (att ?? []).some((x: any) => !String(x.object_path).startsWith(`club/${ich.person_id}/`))) throw new Fehler("Beleg nicht gefunden – bitte erneut anhängen.");
        }
        const summe = Math.round(pos.reduce((a, x) => a + x.betrag, 0) * 100) / 100;
        const auszahlung = p.auszahlung === "bar" ? "bar" : "ueberweisung", bemerkung = txt(p.bemerkung, 1000);
        // Empfänger aus den Ämtern: An = Kassenwart (sonst Clubsprecher), CC = Clubsprecher, BCC = Antragsteller + Admin
        const [{ data: rollen }, aktiv] = await Promise.all([db.from("kc_club_rollen").select("person_id,aemter,ist_admin"), aktiveMitglieder()]);
        const aktivIds = new Set(aktiv.map((m) => m.person_id)), mitAmt = (amt: string) => (rollen ?? []).filter((r: any) => (r.aemter || []).includes(amt) && aktivIds.has(r.person_id)).map((r: any) => r.person_id);
        let an: string[] = mitAmt(ERSTATTUNG.empfaenger.an), cc: string[] = mitAmt(ERSTATTUNG.empfaenger.cc);
        if (!an.length) { an = cc; cc = []; }
        if (!an.length) throw new Fehler("Es ist noch kein Kassenwart oder Clubsprecher eingetragen – bitte bei Hansi melden.", 409);
        cc = cc.filter((id) => !an.includes(id));
        const admins = (rollen ?? []).filter((r: any) => r.ist_admin && aktivIds.has(r.person_id)).map((r: any) => r.person_id);
        const bcc = [...new Set([ich.person_id, ...admins])].filter((id) => !an.includes(id) && !cc.includes(id));
        const d = (iso: string) => iso.split("-").reverse().join(".");
        const zeilen = pos.map((x, i) => x.art === "fahrt"
          ? `${i + 1}. 🚗 Fahrtkosten ${d(x.datum)}: ${String(x.km).replace(".", ",")} km × ${euro(x.satz)} = ${euro(x.betrag)}\n   Grund: ${x.grund}${x.ziel ? " · Ziel: " + x.ziel : ""}`
          : `${i + 1}. ${x.art === "einkauf" ? "🛒 Einkauf vorgestreckt" : "📦 Sonstige Auslage"} ${d(x.datum)}: ${euro(x.betrag)}\n   ${x.was}${x.geschaeft ? " · " + x.geschaeft : ""}${x.belege.length ? " · Beleg anbei" : ""}`).join("\n\n");
        const text = `Hallo,\n\n${ich.name} beantragt eine Erstattung über die Köcheclub-App:\n\n${zeilen}\n\n────────────\nSumme: ${euro(summe)}\nAuszahlung: ${auszahlung === "bar" ? "bar" : "per Überweisung"}${bemerkung ? "\nBemerkung: " + bemerkung : ""}\n\n(Kilometerpauschale je nach Fahrtdatum laut Club-Einstellung. Belege, falls vorhanden, sind angehängt.)\n\nViele Grüße\nKöcheclub Werne`;
        const { data: a, error } = await db.from("kc_club_erstattung").insert({ person_id: ich.person_id, positionen: pos, summe, km_satz: satzFuer(saetze, new Date().toISOString().slice(0, 10)), auszahlung, bemerkung: bemerkung || null }).select("id").single();
        if (error || !a) throw new Fehler("Antrag konnte nicht gespeichert werden.", 500);
        const versand = await routerSenden("club_nachricht_mail", an, {
          titel: `💶 Erstattung von ${ich.vorname}: ${euro(summe)}`, kurz: `${pos.length} Position${pos.length === 1 ? "" : "en"} · ${euro(summe)}`,
          betreff: `Köcheclub Werne – Erstattungsantrag ${ich.name}: ${euro(summe)}`, text, url: APP_URL, attachmentIds: belege,
        }, `club-erstattung:${a.id}`, { cc, bcc });
        await db.from("kc_club_erstattung").update({ versand: { an, cc, bcc: bcc.length, ...versand } }).eq("id", a.id);
        await protokoll(ich.person_id, "erstattung_beantragt", { antrag: a.id, summe, positionen: pos.length, versand });
        // KC-CLUB-BESTAETIGUNG (1.69.0): Antragsteller bekommt zusätzlich eine App-Nachricht mit Link zur Aufstellung (Mail kommt als BCC)
        if (versand.gesendet) await routerSenden("club_nachricht_push", [ich.person_id], erstattungBestaetigung(ich.vorname, { id: a.id, positionen: pos, summe, auszahlung }), `club-bestaetigung-ers:${a.id}`).catch(() => null);
        if (!versand.gesendet) throw new Fehler("Der Antrag ist gespeichert, aber die Mail konnte nicht verschickt werden – bitte später nochmal versuchen oder Hansi Bescheid geben.", 502);
        const leute = await personen([...an, ...cc]);
        return json({ ok: true, id: a.id, summe, an: an.map((id) => leute.get(id)?.display_name || id), cc: cc.map((id) => leute.get(id)?.display_name || id) });
      }

      // ----- Pinnwand (KC-CLUB-PINNWAND) -----
      case "pinnwand": {
        const zettel = await pinnwandSichtbar(ich);
        // „gesehen“ beim ersten Anzeigen erfassen (erste Zeit bleibt stehen); eigene Zettel zählen nicht
        const fremd = zettel.filter((z: any) => z.person_id !== ich.person_id);
        if (fremd.length && !ich.nurLesen) await db.from("kc_club_pinnwand_gelesen").upsert(fremd.map((z: any) => ({ zettel_id: z.id, person_id: ich.person_id })), { onConflict: "zettel_id,person_id", ignoreDuplicates: true });
        const ids = zettel.map((z: any) => z.id);
        const { data: gl } = ids.length ? await db.from("kc_club_pinnwand_gelesen").select("zettel_id,person_id,gesehen_am,erledigt_am").in("zettel_id", ids) : { data: [] };
        const aktiv = await aktiveMitglieder();
        const leute = await personen([...zettel.map((z: any) => z.person_id), ...zettel.flatMap((z: any) => z.personen || []), ...(gl ?? []).map((g: any) => g.person_id)]);
        const nm = (id: string) => leute.get(id)?.display_name || aktiv.find((m) => m.person_id === id)?.display_name || id;
        return json({ max: PINNWAND_MAX, zeichen: PINNWAND_ZEICHEN, zettel: zettel.map((z: any) => {
          const vonMir = z.person_id === ich.person_id, meine = (gl ?? []).find((g: any) => g.zettel_id === z.id && g.person_id === ich.person_id);
          const empf = z.fuer === "alle" ? aktiv.map((m) => m.person_id).filter((id) => id !== z.person_id) : z.fuer === "personen" ? (z.personen || []) : [];
          const lese = (gl ?? []).filter((g: any) => g.zettel_id === z.id && g.person_id !== z.person_id);
          return { id: z.id, text: z.text, wichtig: z.wichtig, fuer: z.fuer, erstellt_am: z.erstellt_am, vonMir, farbe: z.farbe ?? 1,
            von: { person_id: z.person_id, vorname: vorname(leute.get(z.person_id) ?? null) || nm(z.person_id) },
            empfaenger: z.fuer === "personen" ? empf.map(nm) : [],
            erledigt: z.fuer === "ich" ? null : meine?.erledigt_am ?? null,
            // wer wann gelesen / erledigt hat: nur für den Verfasser (und Clubsprecher/Kassenwart/Admin)
            ...(vonMir || ich.vorstand ? { leser: lese.map((g: any) => ({ name: nm(g.person_id), gesehen: g.gesehen_am, erledigt: g.erledigt_am })).sort((a: any, b: any) => String(a.gesehen).localeCompare(String(b.gesehen))),
              offen: empf.filter((id: string) => !lese.some((g: any) => g.person_id === id)).map(nm).sort(), anzahl: empf.length } : {}) };
        }), meine: zettel.filter((z: any) => z.person_id === ich.person_id).length });
      }

      case "pinnwand_anheften": {
        const roh = String(p.text ?? "").trim();
        if (!roh) throw new Fehler("Bitte einen kurzen Text schreiben.");
        if ([...roh].length > PINNWAND_ZEICHEN) throw new Fehler(`Höchstens ${PINNWAND_ZEICHEN} Zeichen – bitte kürzer fassen.`);
        const text = txt(roh, 400);
        const fuer = ["ich", "alle", "personen"].includes(p.fuer) ? p.fuer : "";
        if (!fuer) throw new Fehler("Bitte wählen: nur für mich, für alle oder für bestimmte Personen.");
        let empf: string[] = [];
        if (fuer === "personen") {
          const aktiv = new Set((await aktiveMitglieder()).map((m) => m.person_id));
          empf = ([...new Set((Array.isArray(p.personen) ? p.personen : []).map(String))] as string[]).filter((id) => aktiv.has(id) && id !== ich.person_id).slice(0, 60);
          if (!empf.length) throw new Fehler("Bitte mindestens eine Person auswählen.");
        }
        const { data: haengt } = await db.from("kc_club_pinnwand").select("farbe").eq("person_id", ich.person_id).is("entfernt_am", null);
        if ((haengt ?? []).length >= PINNWAND_MAX) throw new Fehler(`Du hast schon ${PINNWAND_MAX} Zettel an der Pinnwand – bitte erst einen abnehmen.`, 409);
        const belegt = new Set((haengt ?? []).map((x: any) => x.farbe));
        const farbe = [1, 2, 3, 4].find((n) => !belegt.has(n)) ?? 1;
        const antwortAuf = p.antwort_auf ? String(p.antwort_auf).slice(0, 40) : null; // nur fürs Protokoll
        const { data: z, error } = await db.from("kc_club_pinnwand").insert({ person_id: ich.person_id, text, wichtig: !!p.wichtig, fuer, personen: empf, farbe }).select("id").single();
        if (error?.code === "23505") throw new Fehler("Gerade wurde schon ein Zettel angeheftet – bitte kurz neu laden.", 409);
        if (error || !z) throw new Fehler("Zettel konnte nicht angeheftet werden.", 500);
        // Push an alle Empfänger, die die App schon geöffnet haben (Bereich „pinnwand“, jedes Mitglied steuert es selbst)
        const ziel = fuer === "alle" ? (await aktiveMitglieder()).map((m) => m.person_id).filter((id) => id !== ich.person_id) : empf;
        let versand: any = { gesendet: 0 };
        if (ziel.length) {
          const { data: mitApp } = await db.from("kc_club_zugang").select("person_id").eq("aktiv", true).not("zuletzt_gesehen", "is", null).in("person_id", ziel);
          const an = (mitApp ?? []).map((x: any) => x.person_id);
          const kopf = pinnwandHinweis(ich.vorname, pinnwandPrivat({ fuer, personen: empf }), !!p.wichtig);
          if (an.length) versand = await senden("club_pinnwand", an, { titel: `📌 ${kopf}`, kurz: text, betreff: `Köcheclub Werne – ${kopf}`,
            text: `Hallo,\n\n${kopf}:\n\n„${text}“\n\nAnsehen in der Köcheclub-App: ${APP_URL}#pinnwand\n\nViele Grüße\nKöcheclub Werne`, url: `${APP_URL}#pinnwand` }, `club-pinnwand:${z.id}`)
              .catch((e) => { console.error("pinnwand push", String(e)); return { gesendet: 0, fehler: an.length }; });
        }
        await protokoll(ich.person_id, "pinnwand_angeheftet", { zettel: z.id, fuer, wichtig: !!p.wichtig, personen: empf.length, zeichen: [...text].length, versand, farbe, ...(antwortAuf ? { antwortAuf } : {}) });
        return json({ ok: true, id: z.id, farbe, versand });
      }

      // KC-CLUB-PINNWAND-LIVE (0.57.0): nur lesen – neue, von mir noch nicht gesehene fremde Zettel (markiert NICHTS als gesehen;
      // „gesehen“ setzt weiterhin nur das Öffnen der Pinnwand). Für die Einblendung „Du hast ein neues … Post-it von … bekommen“.
      case "pinnwand_neu": {
        const fremd = (await pinnwandSichtbar(ich)).filter((z: any) => z.person_id !== ich.person_id);
        if (!fremd.length) return json({ neu: [] });
        const { data: gl } = await db.from("kc_club_pinnwand_gelesen").select("zettel_id").eq("person_id", ich.person_id).in("zettel_id", fremd.map((z: any) => z.id));
        const gesehen = new Set((gl ?? []).map((g: any) => g.zettel_id));
        const neu = fremd.filter((z: any) => !gesehen.has(z.id)).slice(0, 10);
        const leute = await personen(neu.map((z: any) => z.person_id));
        return json({ neu: neu.map((z: any) => { const von = vorname(leute.get(z.person_id)) || "jemandem";
          return { id: z.id, von, vonId: z.person_id, farbe: z.farbe ?? 1, wichtig: !!z.wichtig, privat: pinnwandPrivat(z), hinweis: pinnwandHinweis(von, pinnwandPrivat(z), !!z.wichtig), text: z.text, zeit: z.erstellt_am }; }) });
      }
      // KC-CLUB-PINNWAND-DIREKT (0.58.0): der Zettel wurde im Post-it-Fenster angezeigt → als gesehen erfassen (nur sichtbare fremde Zettel)
      case "pinnwand_gesehen": {
        const ids = new Set((Array.isArray(p.ids) ? p.ids : []).map(String).slice(0, 20));
        const z = (await pinnwandSichtbar(ich)).filter((x: any) => ids.has(x.id) && x.person_id !== ich.person_id);
        if (z.length) await db.from("kc_club_pinnwand_gelesen").upsert(z.map((x: any) => ({ zettel_id: x.id, person_id: ich.person_id })), { onConflict: "zettel_id,person_id", ignoreDuplicates: true });
        return json({ ok: true, gesehen: z.length });
      }

      case "pinnwand_erledigt": {
        const z = (await pinnwandSichtbar(ich)).find((x: any) => x.id === String(p.id));
        if (!z) throw new Fehler("Zettel nicht gefunden (vielleicht schon abgenommen).", 404);
        const erledigt_am = p.zurueck ? null : jetzt();
        await db.from("kc_club_pinnwand_gelesen").upsert({ zettel_id: z.id, person_id: ich.person_id, erledigt_am }, { onConflict: "zettel_id,person_id" });
        return json({ ok: true, erledigt: erledigt_am });
      }

      case "pinnwand_abnehmen": {
        const { data: z } = await db.from("kc_club_pinnwand").select("id,person_id").eq("id", String(p.id)).is("entfernt_am", null).maybeSingle();
        if (!z) throw new Fehler("Zettel nicht gefunden (vielleicht schon abgenommen).", 404);
        if (z.person_id !== ich.person_id && !ich.vorstand) throw new Fehler("Abnehmen darf nur, wer den Zettel angeheftet hat.", 403);
        await db.from("kc_club_pinnwand").update({ entfernt_am: jetzt(), entfernt_von: ich.person_id }).eq("id", z.id);
        await protokoll(ich.person_id, "pinnwand_abgenommen", { zettel: z.id, fremd: z.person_id !== ich.person_id });
        return json({ ok: true });
      }

      // ----- Terminfindung (KC-CLUB-TERMINFINDUNG) -----
      case "terminumfragen_liste": {
        return json({ umfragen: await terminumfragenListe(ich) });
      }

      case "terminumfrage_speichern": {
        nurVorstand(ich);
        const titel = txt(p.titel, 120);
        if (!titel) throw new Fehler("Bitte einen Titel eingeben (z. B. „Nächstes Treffen“).");
        const optionen = [...new Set((Array.isArray(p.optionen) ? p.optionen : []).map((x: unknown) => new Date(String(x))).filter((d: Date) => !isNaN(d.getTime()) && d.getTime() > Date.now()).map((d: Date) => d.toISOString()))].sort() as string[];
        if (optionen.length < 2 || optionen.length > 10) throw new Fehler("Bitte 2 bis 10 Terminvorschläge in der Zukunft angeben.");
        const frist = p.frist ? new Date(String(p.frist)) : null;
        if (frist && (isNaN(frist.getTime()) || frist.getTime() < Date.now())) throw new Fehler("Die Antwortfrist liegt in der Vergangenheit.");
        const { data: u, error } = await db.from("kc_club_terminumfragen").insert({ titel, beschreibung: txt(p.beschreibung, 2000) || null, ort: txt(p.ort, 200) || null,
          art: p.art === "veranstaltung" ? "veranstaltung" : "treffen", frist: frist ? frist.toISOString() : null, erstellt_von: ich.person_id }).select().single();
        if (error || !u) throw new Fehler("Speichern fehlgeschlagen.", 500);
        await db.from("kc_club_terminumfrage_optionen").insert(optionen.map((beginn, i) => ({ umfrage_id: u.id, beginn, reihenfolge: i })));
        let versand = null;
        if (p.benachrichtigen !== false) {
          const ziel = (await aktiveMitglieder()).map((x) => x.person_id).filter((id) => id !== ich.person_id);
          versand = await senden("club_vorschlag", ziel, {
            titel: "🗓️ Welcher Termin passt dir?", kurz: `${titel} – bitte ${optionen.length} Termine ankreuzen.`,
            betreff: `Köcheclub Werne – Terminfindung: ${titel}`,
            text: `Hallo,\n\n${ich.name} sucht einen Termin für „${titel}“:\n\n${optionen.map((o) => "🗓️ " + wann(o, true)).join("\n")}\n\nBitte in der Köcheclub-App ankreuzen, was dir passt (ja / vielleicht / nein)${frist ? ` – bis ${wann(frist.toISOString())}` : ""}: ${APP_URL}#termine\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#termine",
          }, `club-terminumfrage:${u.id}`);
        }
        await protokoll(ich.person_id, "terminumfrage_angelegt", { umfrage: u.id, optionen: optionen.length, versand });
        return json({ ok: true, id: u.id, versand });
      }

      case "terminumfrage_antwort": {
        const { data: o } = await db.from("kc_club_terminumfrage_optionen").select("id,umfrage_id").eq("id", String(p.option_id || "")).maybeSingle();
        if (!o) throw new Fehler("Terminvorschlag nicht gefunden.", 404);
        const { data: u } = await db.from("kc_club_terminumfragen").select("status").eq("id", o.umfrage_id).single();
        if (u?.status !== "offen") throw new Fehler("Diese Terminfindung ist schon abgeschlossen.", 409);
        const antwort = String(p.antwort || "");
        if (!antwort) await db.from("kc_club_terminumfrage_antworten").delete().eq("option_id", o.id).eq("person_id", ich.person_id);
        else if (["ja", "vielleicht", "nein"].includes(antwort)) await db.from("kc_club_terminumfrage_antworten").upsert({ option_id: o.id, person_id: ich.person_id, antwort, geaendert_am: jetzt() });
        else throw new Fehler("Bitte ja, vielleicht oder nein wählen.");
        return json({ ok: true });
      }

      case "terminumfrage_festlegen": {
        const { data: u } = await db.from("kc_club_terminumfragen").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!u) throw new Fehler("Terminfindung nicht gefunden.", 404);
        if (!ich.vorstand && u.erstellt_von !== ich.person_id) throw new Fehler("Festlegen darf, wer die Terminfindung gestartet hat, oder Clubsprecher/Kassenwart.", 403);
        if (u.status !== "offen") throw new Fehler("Diese Terminfindung ist schon abgeschlossen.", 409);
        const { data: o } = await db.from("kc_club_terminumfrage_optionen").select("*").eq("id", String(p.option_id || "")).eq("umfrage_id", u.id).maybeSingle();
        if (!o) throw new Fehler("Terminvorschlag nicht gefunden.", 404);
        // Termin anlegen; Antworten werden als Zu-/Absagen übernommen (ja → komme, vielleicht → vielleicht, nein → kann nicht)
        const { data: t, error } = await db.from("kc_club_treffen").insert({ titel: u.titel, beginn: o.beginn, ort: u.ort, beschreibung: u.beschreibung, art: u.art, ganztaegig: false,
          erstellt_von: ich.person_id, geaendert_am: jetzt() }).select().single();
        if (error || !t) throw new Fehler("Termin konnte nicht angelegt werden.", 500);
        const { data: an } = await db.from("kc_club_terminumfrage_antworten").select("person_id,antwort").eq("option_id", o.id);
        if (u.art === "treffen" && (an ?? []).length) await db.from("kc_club_teilnahme").insert((an ?? []).map((x: any) => ({ treffen_id: t.id, person_id: x.person_id, antwort: x.antwort, notiz: null, geaendert_am: jetzt() })));
        await db.from("kc_club_terminumfragen").update({ status: "festgelegt", festgelegt_option: o.id, festgelegt_treffen_id: t.id, geaendert_am: jetzt() }).eq("id", u.id);
        let versand = null;
        if (p.benachrichtigen !== false) {
          const ziel = (await aktiveMitglieder()).map((x) => x.person_id).filter((id) => id !== ich.person_id);
          versand = await senden("club_treffen", ziel, treffenText(t, "", "neu"), `club-treffen:${t.id}:festgelegt`);
        }
        await protokoll(ich.person_id, "terminumfrage_festgelegt", { umfrage: u.id, treffen: t.id, beginn: o.beginn, versand });
        return json({ ok: true, treffen_id: t.id, versand });
      }

      case "terminumfrage_loeschen": {
        const { data: u } = await db.from("kc_club_terminumfragen").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!u) throw new Fehler("Terminfindung nicht gefunden.", 404);
        if (!ich.vorstand && u.erstellt_von !== ich.person_id) throw new Fehler("Löschen darf, wer die Terminfindung gestartet hat, oder Clubsprecher/Kassenwart.", 403);
        const { data: o } = await db.from("kc_club_terminumfrage_optionen").select("*").eq("umfrage_id", u.id);
        const { data: an } = (o ?? []).length ? await db.from("kc_club_terminumfrage_antworten").select("*").in("option_id", (o ?? []).map((x: any) => x.id)) : { data: [] as any[] };
        await geloescht(ich, "terminumfrage", { umfrage: u, optionen: o ?? [], antworten: an ?? [] });
        await db.from("kc_club_terminumfragen").delete().eq("id", u.id);
        return json({ ok: true });
      }

      // ----- Mitfahrgelegenheiten (KC-CLUB-MITFAHREN) -----
      case "mitfahrt_anbieten": {
        const art = p.bezug_art === "aktion" ? "aktion" : "treffen", bid = String(p.bezug_id || "");
        const titel = await mitfahrtBezugTitel(art, bid);
        if (!titel) throw new Fehler("Termin nicht gefunden.", 404);
        await mitfahrtErlaubt(ich, art, bid);
        const plaetze = Math.round(Number(p.plaetze));
        if (!(plaetze >= 1 && plaetze <= 8)) throw new Fehler("Bitte 1 bis 8 freie Plätze angeben.");
        const zeile = { plaetze, treffpunkt: txt(p.treffpunkt, 150) || null, notiz: txt(p.notiz, 300) || null };
        const { data: vorh } = await db.from("kc_club_mitfahrt").select("id").eq("bezug_art", art).eq("bezug_id", bid).eq("fahrer", ich.person_id).maybeSingle();
        if (vorh) await db.from("kc_club_mitfahrt").update(zeile).eq("id", vorh.id);
        else await db.from("kc_club_mitfahrt").insert({ ...zeile, bezug_art: art, bezug_id: bid, fahrer: ich.person_id });
        // KC-CLUB-MITFAHRT-SUCHE: wer fährt, sucht nicht mehr; neue Fahrt → Suchende bekommen Bescheid
        await db.from("kc_club_mitfahrt_suche").delete().eq("bezug_art", art).eq("bezug_id", bid).eq("person_id", ich.person_id);
        let versandSuche = null;
        if (!vorh) {
          const { data: su } = await db.from("kc_club_mitfahrt_suche").select("person_id").eq("bezug_art", art).eq("bezug_id", bid);
          const ziel = (su ?? []).map((x: any) => x.person_id).filter((id: string) => id !== ich.person_id);
          if (ziel.length) versandSuche = await senden("club_treffen", ziel, {
            titel: "🚗 Mitfahrgelegenheit gefunden", kurz: `${ich.name} bietet ${plaetze} ${plaetze === 1 ? "Platz" : "Plätze"} an: ${titel}`,
            betreff: `Köcheclub Werne – Mitfahrgelegenheit: ${titel}`,
            text: `Hallo,\n\ndu suchst eine Mitfahrgelegenheit – ${ich.name} fährt zu „${titel}“ und hat ${plaetze} ${plaetze === 1 ? "freien Platz" : "freie Plätze"}${zeile.treffpunkt ? ` (Treffpunkt: ${zeile.treffpunkt})` : ""}.\n\nPlatz buchen in der Köcheclub-App: ${APP_URL}${art === "aktion" ? "#aktion=" + bid : "#termine"}\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + (art === "aktion" ? "#aktion=" + bid : "#termine"),
          }, `club-mitfahrt-angebot:${art}:${bid}:${ich.person_id}`);
        }
        await protokoll(ich.person_id, "mitfahrt_angeboten", { bezug_art: art, bezug_id: bid, plaetze, versandSuche });
        return json({ ok: true });
      }

      case "mitfahrt_platz": {
        const { data: m } = await db.from("kc_club_mitfahrt").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!m) throw new Fehler("Mitfahrgelegenheit nicht gefunden.", 404);
        if (m.fahrer === ich.person_id) throw new Fehler("Das ist deine eigene Fahrt.");
        const titel = (await mitfahrtBezugTitel(m.bezug_art, m.bezug_id)) || "Termin";
        if (p.dabei === false) {
          await db.from("kc_club_mitfahrt_platz").delete().eq("mitfahrt_id", m.id).eq("person_id", ich.person_id);
        } else {
          await mitfahrtErlaubt(ich, m.bezug_art, m.bezug_id);
          const { count } = await db.from("kc_club_mitfahrt_platz").select("person_id", { count: "exact", head: true }).eq("mitfahrt_id", m.id);
          if ((count ?? 0) >= m.plaetze) throw new Fehler("Leider sind schon alle Plätze vergeben.", 409);
          await db.from("kc_club_mitfahrt_platz").upsert({ mitfahrt_id: m.id, person_id: ich.person_id });
          await db.from("kc_club_mitfahrt_suche").delete().eq("bezug_art", m.bezug_art).eq("bezug_id", m.bezug_id).eq("person_id", ich.person_id); // gefunden
        }
        const versand = await senden("club_treffen", [m.fahrer], {
          titel: p.dabei === false ? "🚗 Mitfahrt abgesagt" : "🚗 Neue Mitfahrt", kurz: `${ich.name} ${p.dabei === false ? "fährt doch nicht mit" : "fährt bei dir mit"}: ${titel}`,
          betreff: `Köcheclub Werne – ${p.dabei === false ? "Mitfahrt abgesagt" : "neue Mitfahrt"}: ${titel}`,
          text: `Hallo,\n\n${ich.name} ${p.dabei === false ? "fährt doch nicht bei dir mit" : "fährt bei dir mit"} – ${titel}.\n\nAlle Mitfahrer siehst du in der Köcheclub-App: ${APP_URL}#termine\n\nViele Grüße\nKöcheclub Werne`,
          url: APP_URL + (m.bezug_art === "aktion" ? "#aktion=" + m.bezug_id : "#termine"),
        }, `club-mitfahrt:${m.id}:${ich.person_id}:${Date.now()}`);
        await protokoll(ich.person_id, p.dabei === false ? "mitfahrt_abgesagt" : "mitfahrt_zugesagt", { mitfahrt: m.id, versand });
        return json({ ok: true });
      }

      // KC-CLUB-MITFAHRT-SUCHE (0.87.0): „Ich suche eine Mitfahrgelegenheit“ an/aus – Fahrer mit freien Plätzen bekommen Bescheid
      case "mitfahrt_suchen": {
        const art = p.bezug_art === "aktion" ? "aktion" : "treffen", bid = String(p.bezug_id || "");
        const titel = await mitfahrtBezugTitel(art, bid);
        if (!titel) throw new Fehler("Termin nicht gefunden.", 404);
        if (p.an === false) {
          await db.from("kc_club_mitfahrt_suche").delete().eq("bezug_art", art).eq("bezug_id", bid).eq("person_id", ich.person_id);
          await protokoll(ich.person_id, "mitfahrt_suche_beendet", { bezug_art: art, bezug_id: bid });
          return json({ ok: true });
        }
        await mitfahrtErlaubt(ich, art, bid);
        const { data: eigene } = await db.from("kc_club_mitfahrt").select("id").eq("bezug_art", art).eq("bezug_id", bid).eq("fahrer", ich.person_id).maybeSingle();
        if (eigene) throw new Fehler("Du bietest selbst eine Fahrt an.", 409);
        const { error } = await db.from("kc_club_mitfahrt_suche").upsert({ bezug_art: art, bezug_id: bid, person_id: ich.person_id, notiz: txt(p.notiz, 200) || null });
        if (error) throw new Fehler("Konnte nicht gespeichert werden.", 500);
        const { data: mf } = await db.from("kc_club_mitfahrt").select("id,fahrer,plaetze").eq("bezug_art", art).eq("bezug_id", bid);
        const { data: pl } = (mf ?? []).length ? await db.from("kc_club_mitfahrt_platz").select("mitfahrt_id").in("mitfahrt_id", (mf ?? []).map((m: any) => m.id)) : { data: [] as any[] };
        const fahrer = (mf ?? []).filter((m: any) => (pl ?? []).filter((x: any) => x.mitfahrt_id === m.id).length < m.plaetze).map((m: any) => m.fahrer).filter((id: string) => id !== ich.person_id);
        const versand = fahrer.length ? await senden("club_treffen", fahrer, {
          titel: "🙋 Sucht Mitfahrgelegenheit", kurz: `${ich.name} sucht eine Mitfahrgelegenheit: ${titel}`,
          betreff: `Köcheclub Werne – ${ich.name} sucht eine Mitfahrgelegenheit`,
          text: `Hallo,\n\n${ich.name} sucht eine Mitfahrgelegenheit zu „${titel}“ – du hast noch freie Plätze.\n\nIn der Köcheclub-App: ${APP_URL}${art === "aktion" ? "#aktion=" + bid : "#termine"}\n\nViele Grüße\nKöcheclub Werne`,
          url: APP_URL + (art === "aktion" ? "#aktion=" + bid : "#termine"),
        }, `club-mitfahrt-suche:${art}:${bid}:${ich.person_id}`) : null;
        await protokoll(ich.person_id, "mitfahrt_gesucht", { bezug_art: art, bezug_id: bid, versand });
        return json({ ok: true, fahrerBenachrichtigt: fahrer.length });
      }

      case "mitfahrt_loeschen": {
        const { data: m } = await db.from("kc_club_mitfahrt").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!m) throw new Fehler("Mitfahrgelegenheit nicht gefunden.", 404);
        if (m.fahrer !== ich.person_id && !ich.vorstand) throw new Fehler("Löschen darf nur, wer die Fahrt anbietet.", 403);
        const { data: pl } = await db.from("kc_club_mitfahrt_platz").select("person_id").eq("mitfahrt_id", m.id);
        await geloescht(ich, "mitfahrt", { mitfahrt: m, mitfahrer: (pl ?? []).map((x: any) => x.person_id) });
        await db.from("kc_club_mitfahrt").delete().eq("id", m.id);
        const ziel = (pl ?? []).map((x: any) => x.person_id).filter((id: string) => id !== ich.person_id);
        if (ziel.length) {
          const titel = (await mitfahrtBezugTitel(m.bezug_art, m.bezug_id)) || "Termin";
          await senden("club_treffen", ziel, {
            titel: "🚗 Mitfahrt entfällt", kurz: `Die Fahrt zu „${titel}“ fällt aus – bitte eine andere Mitfahrt suchen.`,
            betreff: `Köcheclub Werne – Mitfahrt entfällt: ${titel}`,
            text: `Hallo,\n\ndie Mitfahrgelegenheit zu „${titel}“ fällt leider aus. Bitte schau in der Köcheclub-App nach einer anderen Fahrt: ${APP_URL}#termine\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#termine",
          }, `club-mitfahrt-entfaellt:${m.id}`);
        }
        return json({ ok: true });
      }

      // ----- Notfallkontakt (KC-CLUB-NOTFALL) & Kalender-Abo (KC-CLUB-KALENDERABO) -----
      case "notfall_setzen": {
        const zeile = { name: txt(p.name, 120) || null, telefon: txt(p.telefon, 40) || null, beziehung: txt(p.beziehung, 60) || null };
        if (!zeile.name && !zeile.telefon) await db.from("kc_club_notfall").delete().eq("person_id", ich.person_id);
        else await db.from("kc_club_notfall").upsert({ person_id: ich.person_id, ...zeile, geaendert_am: jetzt() });
        await protokoll(ich.person_id, "notfall_gesetzt", { gesetzt: !!(zeile.name || zeile.telefon) });
        return json({ ok: true });
      }

      case "kalender_abo": {
        // neuer Link (der alte wird ungültig) – gespeichert wird nur der Hash
        const token = zufall();
        await db.from("kc_club_kalender_abo").upsert({ person_id: ich.person_id, token_hash: await sha256(token), erstellt_am: jetzt(), zuletzt_abgerufen: null });
        await protokoll(ich.person_id, "kalender_abo_erzeugt", {});
        return json({ ok: true, url: `${SUPA}/functions/v1/kc-club?kalender=${token}` });
      }

      // ----- Aktionen / Ausflüge (KC-CLUB-AKTIONEN) -----
      case "aktionen_liste": {
        return json(await aktionenLesen(ich));
      }

      // ----- Sitzungsprotokolle (KC-CLUB-PROTOKOLLE) -----
      case "protokolle_liste": {
        nurProtokolle(ich);
        const { data: alle } = await db.from("kc_club_sitzungsprotokolle")
          .select("id,treffen_id,titel,datum,ort,status,version,verfasser,veroeffentlicht_am,einspruch_bis,geaendert_am").order("datum", { ascending: false }).limit(100);
        const ids = (alle ?? []).map((x: any) => x.id);
        const leer = { data: [] as any[] };
        const [{ data: gel }, { data: ew }, { data: an }, { data: auf }, { data: tr }] = await Promise.all([
          ids.length ? db.from("kc_club_sitzungsprotokoll_gelesen").select("protokoll_id,version").eq("person_id", ich.person_id).in("protokoll_id", ids) : Promise.resolve(leer),
          ids.length ? db.from("kc_club_sitzungsprotokoll_einwaende").select("protokoll_id").is("erledigt_am", null).in("protokoll_id", ids) : Promise.resolve(leer),
          ids.length ? db.from("kc_club_sitzungsprotokoll_anlagen").select("protokoll_id").in("protokoll_id", ids) : Promise.resolve(leer),
          db.from("kc_club_aufgaben").select("*").is("erledigt_am", null).order("faellig", { nullsFirst: false }).limit(200),
          db.from("kc_club_treffen").select("id,titel,beginn,ort").eq("art", "treffen").neq("status", "abgesagt")
            .gte("beginn", new Date(Date.now() - 120 * 86400000).toISOString()).lte("beginn", jetzt()).order("beginn", { ascending: false }),
        ]);
        const zahl = (liste: any[] | null, id: string) => (liste ?? []).filter((x: any) => x.protokoll_id === id).length;
        const prot = new Map((alle ?? []).map((x: any) => [x.id, x]));
        // offene Aufgaben: aus veröffentlichten Protokollen, ohne Protokoll, oder aus Entwürfen, die ich bearbeiten darf
        const aufgaben = (auf ?? []).filter((a: any) => { const pr: any = a.protokoll_id ? prot.get(a.protokoll_id) : null; return !pr || pr.status === "veroeffentlicht" || darfBearbeiten(ich, pr); });
        const leute = await personen([...(alle ?? []).map((x: any) => x.verfasser), ...aufgaben.map((a: any) => a.person_id)]);
        const mitProtokoll = new Set((alle ?? []).map((x: any) => x.treffen_id).filter(Boolean));
        return json({
          darfOrganisieren: ich.vorstand,
          protokolle: (alle ?? []).map((pr: any) => {
            const g: any = (gel ?? []).find((x: any) => x.protokoll_id === pr.id);
            return {
              id: pr.id, titel: pr.titel, datum: pr.datum, ort: pr.ort, version: pr.version, status: protokollStatus(pr, zahl(ew, pr.id)), einspruch_bis: pr.einspruch_bis,
              verfasser: { person_id: pr.verfasser, name: leute.get(pr.verfasser)?.display_name || pr.verfasser }, eigen: pr.verfasser === ich.person_id,
              darfBearbeiten: darfBearbeiten(ich, pr), darfLoeschen: darfProtokollLoeschen(ich, pr), gelesen: pr.status === "entwurf" || (!!g && g.version >= pr.version),
              anlagen: zahl(an, pr.id), einwaende: zahl(ew, pr.id), aufgabenOffen: aufgaben.filter((a: any) => a.protokoll_id === pr.id).length,
            };
          }),
          aufgaben: aufgaben.map((a: any) => ({ id: a.id, text: a.text, faellig: a.faellig, person_id: a.person_id, gruppe: a.gruppe ?? null, name: leute.get(a.person_id)?.display_name || a.person_id,
            protokoll: a.protokoll_id ? { id: a.protokoll_id, titel: (prot.get(a.protokoll_id) as any)?.titel ?? "" } : null, meine: a.person_id === ich.person_id,
            verwalten: ich.vorstand || a.erstellt_von === ich.person_id || (a.protokoll_id && prot.get(a.protokoll_id) ? darfBearbeiten(ich, prot.get(a.protokoll_id)) : false) })),
          treffenOhneProtokoll: (tr ?? []).filter((t: any) => !mitProtokoll.has(t.id)),
        });
      }

      case "protokoll_vorlage": {
        // Vorlage automatisch befüllen – getippt wird auf dem Handy fast nichts
        nurProtokolle(ich);
        const tid = p.treffen_id ? String(p.treffen_id) : null;
        const zeile: any = { titel: txt(p.titel, 120) || "Sitzung des Köcheclubs", datum: berlinTag(new Date()), verfasser: ich.person_id };
        if (tid) {
          const { data: vorh } = await db.from("kc_club_sitzungsprotokolle").select("id").eq("treffen_id", tid).maybeSingle();
          if (vorh) return json({ ok: true, id: vorh.id, vorhanden: true });
          const { data: t } = await db.from("kc_club_treffen").select("*").eq("id", tid).maybeSingle();
          if (!t) throw new Fehler("Treffen nicht gefunden.", 404);
          const [{ data: teil }, { data: vs }] = await Promise.all([
            db.from("kc_club_teilnahme").select("person_id,antwort").eq("treffen_id", tid),
            db.from("kc_club_vorschlaege").select("*").eq("treffen_id", tid).neq("status", "zurueckgezogen").order("erstellt_am"),
          ]);
          const g = t.gastgeber_person_id ? (await personen([t.gastgeber_person_id])).get(t.gastgeber_person_id) : null;
          const beschluesse: string[] = [];
          for (const v of (vs ?? []).filter((x: any) => x.art === "abstimmung")) {
            // geheime Abstimmungen erst nach Abschluss, nie mit Namen
            beschluesse.push(v.status === "abgeschlossen" ? `${v.titel} – ${await abstimmungsErgebnis(v)}` : `${v.titel} – Abstimmung läuft noch`);
          }
          Object.assign(zeile, {
            treffen_id: tid, titel: t.titel, datum: berlinTag(new Date(t.beginn)), ort: t.ort || (g ? `bei ${g.display_name}` : null),
            anwesend: (teil ?? []).filter((x: any) => x.antwort === "ja").map((x: any) => x.person_id),
            entschuldigt: (teil ?? []).filter((x: any) => x.antwort === "nein").map((x: any) => x.person_id),
            tagesordnung: (vs ?? []).filter((x: any) => unterstuetzbar(x.art)).map((x: any) => x.titel), beschluesse,
          });
        }
        const { data: neu, error } = await db.from("kc_club_sitzungsprotokolle").insert(zeile).select("id").single();
        if (error || !neu) {
          // gleichzeitig angelegt (Doppel-Tipp): vorhandenes öffnen
          const { data: vorh } = tid ? await db.from("kc_club_sitzungsprotokolle").select("id").eq("treffen_id", tid).maybeSingle() : { data: null };
          if (vorh) return json({ ok: true, id: vorh.id, vorhanden: true });
          throw new Fehler("Protokoll konnte nicht angelegt werden.", 500);
        }
        await protokoll(ich.person_id, "sitzungsprotokoll_angelegt", { protokoll: neu.id, treffen: tid });
        return json({ ok: true, id: neu.id });
      }

      case "protokoll_laden": {
        nurProtokolle(ich);
        const pr = await protokollHolen(p.id);
        const bearb = darfBearbeiten(ich, pr);
        if (pr.status === "entwurf" && !bearb) throw new Fehler("Dieses Protokoll wird gerade noch geschrieben.", 403);
        const [{ data: pa }, { data: ew }, { data: auf }, { data: gel }, { data: fa }] = await Promise.all([
          db.from("kc_club_sitzungsprotokoll_anlagen").select("attachment_id,reihenfolge").eq("protokoll_id", pr.id).order("reihenfolge"),
          db.from("kc_club_sitzungsprotokoll_einwaende").select("*").eq("protokoll_id", pr.id).order("erstellt_am"),
          db.from("kc_club_aufgaben").select("*").eq("protokoll_id", pr.id).order("erstellt_am"),
          db.from("kc_club_sitzungsprotokoll_gelesen").select("person_id,version").eq("protokoll_id", pr.id),
          db.from("kc_club_sitzungsprotokoll_fassungen").select("version,gesichert_am").eq("protokoll_id", pr.id).order("version"),
        ]);
        const aids = (pa ?? []).map((x: any) => x.attachment_id);
        const { data: att } = aids.length ? await db.from("kc_communication_attachments").select("id,file_name,mime_type,size_bytes").in("id", aids) : { data: [] as any[] };
        const leser = bearb && pr.status === "veroeffentlicht" ? await protokollLeser() : [];
        const leute = await personen([pr.verfasser, ...pr.anwesend, ...pr.entschuldigt, ...(ew ?? []).map((x: any) => x.person_id), ...(auf ?? []).map((x: any) => x.person_id), ...leser]);
        const name = (id: string) => leute.get(id)?.display_name || id;
        if (pr.status === "veroeffentlicht" && !(gel ?? []).some((x: any) => x.person_id === ich.person_id && x.version >= pr.version))
          await db.from("kc_club_sitzungsprotokoll_gelesen").upsert({ protokoll_id: pr.id, person_id: ich.person_id, version: pr.version, gelesen_am: jetzt() });
        const aktuell = new Set((gel ?? []).filter((x: any) => x.version >= pr.version).map((x: any) => x.person_id));
        aktuell.add(ich.person_id);
        return json({
          protokoll: {
            id: pr.id, treffen_id: pr.treffen_id, titel: pr.titel, datum: pr.datum, ort: pr.ort, gaeste: pr.gaeste, kurzfassung: pr.kurzfassung,
            tagesordnung: pr.tagesordnung, beschluesse: pr.beschluesse, version: pr.version, veroeffentlicht_am: pr.veroeffentlicht_am, einspruch_bis: pr.einspruch_bis,
            status: protokollStatus(pr, (ew ?? []).filter((x: any) => !x.erledigt_am).length), roh: pr.status,
            verfasser: { person_id: pr.verfasser, name: name(pr.verfasser) },
            anwesend: pr.anwesend.map((id: string) => ({ person_id: id, name: name(id) })), entschuldigt: pr.entschuldigt.map((id: string) => ({ person_id: id, name: name(id) })),
          },
          anlagen: aids.map((id: string) => (att ?? []).find((y: any) => y.id === id)).filter(Boolean).map((y: any) => ({ id: y.id, name: y.file_name, mime: y.mime_type, groesse: y.size_bytes })),
          einwaende: (ew ?? []).map((x: any) => ({ id: x.id, name: name(x.person_id), text: x.text, erstellt_am: x.erstellt_am, erledigt_am: x.erledigt_am, eigen: x.person_id === ich.person_id })),
          aufgaben: (auf ?? []).map((a: any) => ({ id: a.id, person_id: a.person_id, gruppe: a.gruppe ?? null, name: name(a.person_id), text: a.text, faellig: a.faellig, erledigt_am: a.erledigt_am, meine: a.person_id === ich.person_id,
            verwalten: bearb || a.erstellt_von === ich.person_id })),
          // Lesestand nur für Verfasser/Organisation
          gelesen: leser.length ? { von: leser.filter((id) => aktuell.has(id)).map(name).sort(), fehlt: leser.filter((id) => !aktuell.has(id)).map(name).sort() } : null,
          fassungen: fa ?? [], darfBearbeiten: bearb, darfLoeschen: darfProtokollLoeschen(ich, pr), eigen: pr.verfasser === ich.person_id,
          schreiber: bearb ? (await protokollLeser()) : [],
        });
      }

      case "protokoll_speichern": {
        nurProtokolle(ich);
        const pr = await protokollHolen(p.id);
        if (!darfBearbeiten(ich, pr)) throw new Fehler("Ändern darf nur, wer das Protokoll schreibt (oder Clubsprecher/Kassenwart).", 403);
        if (pr.status !== "entwurf") throw new Fehler("Das Protokoll ist veröffentlicht – bitte erst „Korrigieren“ tippen.", 409);
        const aktiv = new Set((await aktiveMitglieder()).map((m) => m.person_id));
        const ids = (v: unknown) => [...new Set((Array.isArray(v) ? v : []).map(String))].filter((id) => aktiv.has(id)).slice(0, 60);
        const zeilen = (v: unknown) => (Array.isArray(v) ? v : String(v ?? "").split("\n")).map((x: unknown) => txt(x, 300)).filter(Boolean).slice(0, 40);
        const datum = /^\d{4}-\d{2}-\d{2}$/.test(String(p.datum || "")) ? String(p.datum) : pr.datum;
        const anwesend = ids(p.anwesend);
        const upd: any = {
          titel: txt(p.titel, 120) || pr.titel, datum, ort: txt(p.ort, 200) || null, anwesend, entschuldigt: ids(p.entschuldigt).filter((id) => !anwesend.includes(id)),
          gaeste: txt(p.gaeste, 300) || null, tagesordnung: zeilen(p.tagesordnung), beschluesse: zeilen(p.beschluesse), kurzfassung: txt(p.kurzfassung, 4000) || null, geaendert_am: jetzt(),
        };
        // Schriftführer wechseln (wer das Protokoll schreibt)
        if (p.verfasser && String(p.verfasser) !== pr.verfasser) {
          if (!(await protokollLeser()).includes(String(p.verfasser))) throw new Fehler("Diese Person kann keine Protokolle schreiben.");
          upd.verfasser = String(p.verfasser);
        }
        await db.from("kc_club_sitzungsprotokolle").update(upd).eq("id", pr.id);
        await protokoll(ich.person_id, "sitzungsprotokoll_gespeichert", { protokoll: pr.id, verfasser: upd.verfasser ?? pr.verfasser });
        return json({ ok: true });
      }

      case "protokoll_anlage": {
        nurProtokolle(ich);
        const pr = await protokollHolen(p.id);
        if (!darfBearbeiten(ich, pr)) throw new Fehler("Anhängen darf nur, wer das Protokoll schreibt.", 403);
        if (pr.status !== "entwurf") throw new Fehler("Das Protokoll ist veröffentlicht – bitte erst „Korrigieren“ tippen.", 409);
        const aid = String(p.attachment_id || "");
        if (p.entfernen) await db.from("kc_club_sitzungsprotokoll_anlagen").delete().eq("protokoll_id", pr.id).eq("attachment_id", aid);
        else {
          const { data: att } = await db.from("kc_communication_attachments").select("id,object_path").eq("id", aid).maybeSingle();
          if (!att || !String(att.object_path).startsWith(`club/${ich.person_id}/`)) throw new Fehler("Anlage nicht gefunden – bitte erneut anhängen.");
          const { count } = await db.from("kc_club_sitzungsprotokoll_anlagen").select("attachment_id", { count: "exact", head: true }).eq("protokoll_id", pr.id);
          if ((count ?? 0) >= 20) throw new Fehler("Höchstens 20 Anlagen je Protokoll.");
          await db.from("kc_club_sitzungsprotokoll_anlagen").upsert({ protokoll_id: pr.id, attachment_id: aid, reihenfolge: count ?? 0 });
        }
        await db.from("kc_club_sitzungsprotokolle").update({ geaendert_am: jetzt() }).eq("id", pr.id);
        await protokoll(ich.person_id, p.entfernen ? "sitzungsprotokoll_anlage_entfernt" : "sitzungsprotokoll_anlage", { protokoll: pr.id, anlage: aid });
        return json({ ok: true });
      }

      case "protokoll_veroeffentlichen": {
        nurProtokolle(ich);
        const pr = await protokollHolen(p.id);
        if (!darfBearbeiten(ich, pr)) throw new Fehler("Veröffentlichen darf nur, wer das Protokoll schreibt.", 403);
        const { count } = await db.from("kc_club_sitzungsprotokoll_anlagen").select("attachment_id", { count: "exact", head: true }).eq("protokoll_id", pr.id);
        if (!count && !pr.kurzfassung && !pr.beschluesse.length) throw new Fehler("Bitte zuerst ein Foto oder eine Datei vom Protokoll anhängen (oder eine Kurzfassung schreiben).");
        const bis = new Date(Date.now() + EINSPRUCH_TAGE * 86400000).toISOString();
        const { data: ok } = await db.from("kc_club_sitzungsprotokolle").update({ status: "veroeffentlicht", veroeffentlicht_am: jetzt(), einspruch_bis: bis, geaendert_am: jetzt() })
          .eq("id", pr.id).eq("status", "entwurf").select("id");
        if (!ok?.length) throw new Fehler("Das Protokoll ist schon veröffentlicht.", 409);
        // neue Fassung nach Korrektur: bisherige Einwände gelten als bearbeitet
        if (pr.version > 1) await db.from("kc_club_sitzungsprotokoll_einwaende").update({ erledigt_am: jetzt(), erledigt_von: ich.person_id }).eq("protokoll_id", pr.id).is("erledigt_am", null);
        await db.from("kc_club_sitzungsprotokoll_gelesen").upsert({ protokoll_id: pr.id, person_id: ich.person_id, version: pr.version, gelesen_am: jetzt() });
        const ziel = (await protokollLeser()).filter((id) => id !== ich.person_id);
        const bisText = fTag.format(new Date(bis));
        const versand = p.benachrichtigen === false ? null : await senden("club_protokoll", ziel, {
          titel: `📝 Protokoll${pr.version > 1 ? " (korrigiert)" : ""}: ${pr.titel}`, kurz: `Bitte lesen – Einwände bis ${bisText} möglich.`,
          betreff: `Köcheclub Werne – Protokoll${pr.version > 1 ? " (korrigierte Fassung)" : ""}: ${pr.titel} vom ${tagText(pr.datum)}`,
          text: `Hallo,\n\n${ich.name} hat das Protokoll${pr.version > 1 ? " (korrigierte Fassung)" : ""} „${pr.titel}“ vom ${tagText(pr.datum)} veröffentlicht.\n\nBitte lesen. Wer etwas zu beanstanden hat, kann bis ${bisText} in der App einen Einwand schreiben – danach gilt das Protokoll als genehmigt.\n\nZum Protokoll: ${APP_URL}#protokoll=${pr.id}\n\nViele Grüße\nKöcheclub Werne`,
          url: `${APP_URL}#protokoll=${pr.id}`,
        }, `club-protokoll:${pr.id}:${pr.version}`);
        const { data: auf } = await db.from("kc_club_aufgaben").select("*").eq("protokoll_id", pr.id);
        await aufgabenMitteilen(auf ?? [], ich, pr.titel);
        await protokoll(ich.person_id, "sitzungsprotokoll_veroeffentlicht", { protokoll: pr.id, version: pr.version, einspruch_bis: bis, versand });
        return json({ ok: true, einspruch_bis: bis, versand });
      }

      case "protokoll_korrigieren": {
        nurProtokolle(ich);
        const pr = await protokollHolen(p.id);
        if (!darfBearbeiten(ich, pr)) throw new Fehler("Korrigieren darf nur, wer das Protokoll schreibt (oder Clubsprecher/Kassenwart).", 403);
        if (pr.status !== "veroeffentlicht") throw new Fehler("Das Protokoll ist noch ein Entwurf.", 409);
        // alte Fassung bleibt erhalten
        const { data: pa } = await db.from("kc_club_sitzungsprotokoll_anlagen").select("attachment_id").eq("protokoll_id", pr.id);
        await db.from("kc_club_sitzungsprotokoll_fassungen").upsert({ protokoll_id: pr.id, version: pr.version, inhalt: { ...pr, anlagen: (pa ?? []).map((x: any) => x.attachment_id) } });
        const { data: ok } = await db.from("kc_club_sitzungsprotokolle").update({ status: "entwurf", version: pr.version + 1, veroeffentlicht_am: null, einspruch_bis: null, geaendert_am: jetzt() })
          .eq("id", pr.id).eq("version", pr.version).select("id");
        if (!ok?.length) throw new Fehler("Das Protokoll wurde gerade geändert – bitte neu laden.", 409);
        await protokoll(ich.person_id, "sitzungsprotokoll_korrektur", { protokoll: pr.id, alte_version: pr.version });
        return json({ ok: true });
      }

      case "protokoll_loeschen": {
        // Entwurf: Verfasser oder Organisation; veröffentlichtes Protokoll (z. B. Test): nur Organisation. Sicherung vorher.
        nurProtokolle(ich);
        const pr = await protokollHolen(p.id);
        if (!darfProtokollLoeschen(ich, pr)) throw new Fehler(pr.status === "entwurf" && pr.version === 1 ? "Löschen darf nur, wer das Protokoll schreibt." : "Veröffentlichte Protokolle löschen nur Clubsprecher, Kassenwart oder Admin.", 403);
        const [{ data: pa }, { data: auf }, { data: ew }, { data: fa }] = await Promise.all([
          db.from("kc_club_sitzungsprotokoll_anlagen").select("attachment_id,reihenfolge").eq("protokoll_id", pr.id),
          db.from("kc_club_aufgaben").select("*").eq("protokoll_id", pr.id),
          db.from("kc_club_sitzungsprotokoll_einwaende").select("*").eq("protokoll_id", pr.id),
          db.from("kc_club_sitzungsprotokoll_fassungen").select("*").eq("protokoll_id", pr.id),
        ]);
        await geloescht(ich, "sitzungsprotokoll", { protokoll: pr, anlagen: pa ?? [], aufgaben: auf ?? [], einwaende: ew ?? [], fassungen: fa ?? [] });
        await db.from("kc_club_sitzungsprotokolle").delete().eq("id", pr.id);
        return json({ ok: true });
      }

      case "einwand_loeschen": {
        nurProtokolle(ich);
        const { data: e } = await db.from("kc_club_sitzungsprotokoll_einwaende").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!e) throw new Fehler("Einwand nicht gefunden.", 404);
        const pr = await protokollHolen(e.protokoll_id);
        if (e.person_id !== ich.person_id && !darfBearbeiten(ich, pr)) throw new Fehler("Löschen darf nur, wer den Einwand geschrieben hat.", 403);
        await geloescht(ich, "sitzungsprotokoll_einwand", { einwand: e });
        await db.from("kc_club_sitzungsprotokoll_einwaende").delete().eq("id", e.id);
        return json({ ok: true });
      }

      case "protokoll_einwand": {
        nurProtokolle(ich);
        const pr = await protokollHolen(p.id);
        if (pr.status !== "veroeffentlicht") throw new Fehler("Das Protokoll ist noch nicht veröffentlicht.", 409);
        if (!pr.einspruch_bis || pr.einspruch_bis < jetzt()) throw new Fehler("Die Einspruchsfrist ist abgelaufen – bitte direkt mit dem Verfasser sprechen.", 409);
        const text = txt(p.text, 1000);
        if (!text) throw new Fehler("Bitte kurz schreiben, was nicht stimmt.");
        await db.from("kc_club_sitzungsprotokoll_einwaende").insert({ protokoll_id: pr.id, person_id: ich.person_id, text });
        const { data: org } = await db.from("kc_club_rollen").select("person_id").eq("ist_vorstand", true);
        const ziel = [...new Set([pr.verfasser, ...(org ?? []).map((r: any) => r.person_id)])].filter((id) => id !== ich.person_id);
        const versand = await senden("club_protokoll", ziel, {
          titel: `⚠️ Einwand zum Protokoll ${pr.titel}`, kurz: `${ich.name}: ${text}`.slice(0, 150),
          betreff: `Köcheclub Werne – Einwand zum Protokoll: ${pr.titel}`,
          text: `Hallo,\n\n${ich.name} hat einen Einwand zum Protokoll „${pr.titel}“ vom ${tagText(pr.datum)}:\n\n„${text}“\n\nAnsehen in der Köcheclub-App: ${APP_URL}#protokoll=${pr.id}\n\nViele Grüße\nKöcheclub Werne`,
          url: `${APP_URL}#protokoll=${pr.id}`,
        }, `club-einwand:${pr.id}:${Date.now()}`);
        await protokoll(ich.person_id, "sitzungsprotokoll_einwand", { protokoll: pr.id, versand });
        return json({ ok: true, versand });
      }

      case "einwand_erledigt": {
        nurProtokolle(ich);
        const { data: e } = await db.from("kc_club_sitzungsprotokoll_einwaende").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!e) throw new Fehler("Einwand nicht gefunden.", 404);
        const pr = await protokollHolen(e.protokoll_id);
        if (!darfBearbeiten(ich, pr) && e.person_id !== ich.person_id) throw new Fehler("Das darf nur, wer das Protokoll schreibt.", 403);
        await db.from("kc_club_sitzungsprotokoll_einwaende").update({ erledigt_am: jetzt(), erledigt_von: ich.person_id }).eq("id", e.id);
        await protokoll(ich.person_id, "sitzungsprotokoll_einwand_erledigt", { protokoll: pr.id, einwand: e.id });
        return json({ ok: true });
      }

      // ----- Aufgaben (KC-CLUB-AUFGABEN) -----
      case "aufgabe_speichern": {
        nurProtokolle(ich);
        const text = txt(p.text, 300);
        if (!text) throw new Fehler("Bitte eintragen, was zu tun ist.");
        // KC-CLUB-AUFGABEN-MEHRERE (0.53.0): neue Aufgabe für mehrere Personen (person_ids) → je Person eine Zeile, gemeinsame Gruppe
        const aktiv = new Set((await aktiveMitglieder()).map((m) => m.person_id));
        const personen_: string[] = [...new Set<string>((Array.isArray(p.person_ids) ? p.person_ids : [p.person_id]).map((x: unknown) => String(x || "")).filter(Boolean))].slice(0, 10);
        if (!personen_.length || personen_.some((x) => !aktiv.has(x))) throw new Fehler("Bitte auswählen, wer die Aufgabe übernimmt.");
        if (p.id && personen_.length > 1) throw new Fehler("Eine bestehende Aufgabe gehört einer Person – für weitere bitte eine neue Aufgabe eintragen.");
        const person = personen_[0];
        const faellig = /^\d{4}-\d{2}-\d{2}$/.test(String(p.faellig || "")) ? String(p.faellig) : null;
        let a: any, pr: any = null;
        if (p.id) {
          const x = await aufgabeHolen(ich, p.id);
          if (!x.verwalten) throw new Fehler("Ändern darf nur, wer die Aufgabe eingetragen hat.", 403);
          pr = x.pr;
          const neuePerson = person !== x.a.person_id;
          ({ data: a } = await db.from("kc_club_aufgaben").update({ text, person_id: person, faellig, erinnert_am: null, ...(neuePerson ? { mitgeteilt_am: null } : {}) }).eq("id", x.a.id).select().single());
        } else {
          if (p.protokoll_id) {
            pr = await protokollHolen(p.protokoll_id);
            if (!darfBearbeiten(ich, pr)) throw new Fehler("Aufgaben im Protokoll trägt ein, wer es schreibt.", 403);
          } else if (!ich.vorstand && personen_.some((x) => x !== ich.person_id)) throw new Fehler("Aufgaben für andere tragen Clubsprecher/Kassenwart ein.", 403);
          const gruppe = personen_.length > 1 ? crypto.randomUUID() : null;
          const { data: neu } = await db.from("kc_club_aufgaben").insert(personen_.map((person_id) => ({ protokoll_id: pr?.id ?? null, person_id, text, faellig, erstellt_von: ich.person_id, gruppe }))).select();
          a = neu?.[0] ?? null; if (a) a.alle = neu;
        }
        if (!a) throw new Fehler("Speichern fehlgeschlagen.", 500);
        const zeilen = a.alle ?? [a];
        // mitteilen sofort – außer das Protokoll ist noch ein Entwurf (dann beim Veröffentlichen)
        if (!pr || pr.status === "veroeffentlicht") await aufgabenMitteilen(zeilen, ich, pr?.titel ?? null);
        await protokoll(ich.person_id, p.id ? "aufgabe_geaendert" : "aufgabe_angelegt", { aufgabe: a.id, protokoll: pr?.id ?? null, fuer: zeilen.map((x: any) => x.person_id), gruppe: a.gruppe ?? null });
        return json({ ok: true, id: a.id, ids: zeilen.map((x: any) => x.id) });
      }

      case "aufgabe_erledigt": {
        nurProtokolle(ich);
        const x = await aufgabeHolen(ich, p.id);
        if (!x.verwalten && x.a.person_id !== ich.person_id) throw new Fehler("Abhaken darf, wer die Aufgabe hat oder eingetragen hat.", 403);
        await db.from("kc_club_aufgaben").update({ erledigt_am: p.erledigt === false ? null : jetzt() }).eq("id", x.a.id);
        await protokoll(ich.person_id, p.erledigt === false ? "aufgabe_wieder_offen" : "aufgabe_erledigt", { aufgabe: x.a.id });
        return json({ ok: true });
      }

      case "aufgabe_loeschen": {
        nurProtokolle(ich);
        const x = await aufgabeHolen(ich, p.id);
        if (!x.verwalten) throw new Fehler("Löschen darf nur, wer die Aufgabe eingetragen hat.", 403);
        await geloescht(ich, "aufgabe", { aufgabe: x.a });
        await db.from("kc_club_aufgaben").delete().eq("id", x.a.id);
        return json({ ok: true });
      }

      // ----- Anlagen -----
      case "anlage_hochladen": {
        const r = await dateiAblegen(ich, p.name, p.mime, p.daten);
        return json({ ok: true, ...r });
      }

      case "anlage_url": {
        const { data: att } = await db.from("kc_communication_attachments").select("id,bucket,object_path,file_name").eq("id", String(p.id || "")).maybeSingle();
        if (!att) throw new Fehler("Anlage nicht gefunden.", 404);
        let erlaubt = String(att.object_path).startsWith(`club/${ich.person_id}/`);
        if (!erlaubt) {
          const { data: ma } = await db.from("kc_communication_message_attachments").select("message_id").eq("attachment_id", att.id);
          const { data: msgs } = (ma ?? []).length ? await db.from("kc_communication_messages").select("thread_id").in("id", (ma ?? []).map((x: any) => x.message_id)) : { data: [] as any[] };
          for (const m of msgs ?? []) {
            const { data: tp } = await db.from("kc_communication_thread_participants").select("thread_id").eq("thread_id", m.thread_id).eq("person_id", ich.person_id).maybeSingle();
            if (tp) { erlaubt = true; break; }
          }
        }
        if (!erlaubt) {
          // KC-CLUB-BOERSE (1.43.0): Fotos aktiver Börsen-Anzeigen dürfen alle Mitglieder sehen
          const { data: bo } = await db.from("kc_club_boerse").select("id").eq("status", "aktiv").contains("fotos", JSON.stringify([att.id])).limit(1); // jsonb: JSON-Text, kein {…}-Array
          if (bo?.length) erlaubt = true;
        }
        if (!erlaubt && ich.protokolle) {
          // Anlage eines Sitzungsprotokolls: veröffentlicht → alle Leser; Entwurf → wer es bearbeiten darf
          const { data: pa } = await db.from("kc_club_sitzungsprotokoll_anlagen").select("protokoll_id").eq("attachment_id", att.id);
          for (const x of pa ?? []) {
            const { data: pr } = await db.from("kc_club_sitzungsprotokolle").select("status,verfasser").eq("id", x.protokoll_id).maybeSingle();
            if (pr && (pr.status === "veroeffentlicht" || darfBearbeiten(ich, pr))) { erlaubt = true; break; }
          }
        }
        if (!erlaubt) {
          // KC-CLUB-ARCHIV: Dokument in einem Ordner, den ich sehen darf (auch im Papierkorb nur für die Pflege)
          // KC-CLUB-ARCHIV-PERSOENLICH (1.5.0): persönliche Ordner nur Besitzer bzw. gültige Freigabe; sonst Fremdversuch-Meldung
          const { data: ad } = await db.from("kc_club_archiv_dokumente").select("id,ordner_id,register,status,hochgeladen_von,geloescht_am").eq("attachment_id", att.id);
          let fremd: any = null;
          for (const x of ad ?? []) {
            const { data: o } = await db.from("kc_club_archiv_ordner").select("id,besitzer,jahr,nur_vorstand,geloescht_am").eq("id", x.ordner_id).maybeSingle();
            if (!o) continue;
            if (o.besitzer) {
              const eigen = o.besitzer === ich.person_id;
              const fr = eigen || x.geloescht_am || o.geloescht_am ? [] : await archivFreigabenFuer(ich.person_id, [o.id]);
              if (eigen || (!x.geloescht_am && !o.geloescht_am && darfDokSehen(ich, o, x, fr))) { erlaubt = true; break; }
              fremd = o;
            } else if (darfDokSehen(ich, o, x, []) && ((!x.geloescht_am && !o.geloescht_am) || darfArchivPflegen(ich))) { erlaubt = true; break; }
          }
          if (!erlaubt && fremd) await archivKeinZugriff(ich, fremd, "ein Dokument");
        }
        if (!erlaubt) throw new Fehler("Anlage nicht gefunden.", 404);
        const { data: s } = await db.storage.from(att.bucket).createSignedUrl(att.object_path, 600, p.herunterladen ? { download: att.file_name } : undefined);
        if (!s?.signedUrl) throw new Fehler("Anlage kann gerade nicht geöffnet werden.", 500);
        return json({ url: s.signedUrl, name: att.file_name });
      }

      // ----- Fotoalbum (KC-CLUB-FOTOALBUM) -----
      // KC-CLUB-INFOFELD (0.43.0): die neuesten Fotos fürs Info-Feld – klein und schnell (nicht die ganze Liste)
      case "fotos_neueste": {
        const n = Math.min(6, Math.max(1, Math.round(Number(p.anzahl) || 4)));
        const [{ data: fotos }, { count }] = await Promise.all([
          db.from("kc_club_fotos").select("id,thema,datum,beschreibung,vorschau_id,attachment_id,hochgeladen_am").is("geloescht_am", null).order("hochgeladen_am", { ascending: false }).limit(n),
          db.from("kc_club_fotos").select("id", { count: "exact", head: true }).is("geloescht_am", null),
        ]);
        const liste = fotos ?? [];
        const { data: att } = liste.length ? await db.from("kc_communication_attachments").select("id,object_path").in("id", liste.map((f: any) => f.vorschau_id || f.attachment_id)) : { data: [] as any[] };
        const pfad = new Map((att ?? []).map((a: any) => [a.id, a.object_path])), pfade = [...new Set([...pfad.values()])] as string[];
        const { data: urls } = pfade.length ? await db.storage.from(BUCKET).createSignedUrls(pfade, 3600) : { data: [] as any[] };
        const url = new Map((urls ?? []).map((u: any) => [u.path, u.signedUrl]));
        return json({ anzahl: count ?? 0, fotos: liste.map((f: any) => ({ id: f.id, thema: f.thema, datum: f.datum, beschreibung: f.beschreibung, hochgeladen: f.hochgeladen_am,
          vorschau: url.get(pfad.get(f.vorschau_id || f.attachment_id)) ?? null })) });
      }

      case "fotos_liste": {
        const papierkorb = !!p.papierkorb && ich.admin;
        let q = db.from("kc_club_fotos").select("*");
        q = papierkorb ? q.not("geloescht_am", "is", null) : q.is("geloescht_am", null);
        if (p.thema) q = q.eq("thema", txt(p.thema, 60));
        if (/^\d{4}$/.test(String(p.jahr || ""))) q = q.gte("datum", `${p.jahr}-01-01`).lte("datum", `${p.jahr}-12-31`);
        if (p.bezug_art && p.bezug_id) q = q.eq("bezug_art", String(p.bezug_art)).eq("bezug_id", String(p.bezug_id));
        // KC-CLUB-FOTO-ALBEN (1.63.0): nur Fotos eines Albums (Sichtbarkeit prüft albumHolen)
        const album = p.album_id ? await albumHolen(ich, p.album_id) : null;
        let albumFotos: any[] | null = null;
        if (album) {
          const { data: zu } = await db.from("kc_club_foto_album_fotos").select("foto_id").eq("album_id", album.id).limit(ALBUM_MAX_FOTOS);
          const ids = (zu ?? []).map((z: any) => z.foto_id); albumFotos = [];
          for (let i = 0; i < ids.length; i += 150) { const { data } = await db.from("kc_club_fotos").select("*").in("id", ids.slice(i, i + 150)).is("geloescht_am", null); albumFotos.push(...(data ?? [])); }
          albumFotos.sort((a, b) => String(b.datum).localeCompare(String(a.datum)) || String(b.hochgeladen_am).localeCompare(String(a.hochgeladen_am)));
        }
        const [{ data: fotos }, { data: alle }, anlaesse, speicher, { count: imKorb }, alben, { count: albenKorb }] = await Promise.all([
          q.order("datum", { ascending: false }).order("hochgeladen_am", { ascending: false }).limit(600),
          db.from("kc_club_fotos").select("thema,datum,bezug_art,bezug_id").is("geloescht_am", null),
          fotoAnlaesse(), speicherStand(),
          ich.admin ? db.from("kc_club_fotos").select("id", { count: "exact", head: true }).not("geloescht_am", "is", null) : Promise.resolve({ count: 0 }),
          albenFuer(ich).catch((e) => { console.error("alben", String(e)); return [] as any[]; }),
          db.from("kc_club_foto_alben").select("id", { count: "exact", head: true }).eq("besitzer", ich.person_id).not("geloescht_am", "is", null).gt("geloescht_am", new Date(Date.now() - PAPIERKORB_TAGE * 86400000).toISOString()),
        ]);
        const liste = albumFotos ?? fotos ?? [];
        const [leute, { data: att }] = await Promise.all([
          personen(liste.map((f: any) => f.hochgeladen_von)),
          liste.length ? db.from("kc_communication_attachments").select("id,object_path").in("id", liste.map((f: any) => f.vorschau_id || f.attachment_id)) : Promise.resolve({ data: [] as any[] }),
        ]);
        const pfad = new Map((att ?? []).map((a: any) => [a.id, a.object_path]));
        const pfade = [...new Set([...pfad.values()])] as string[];
        const { data: urls } = pfade.length ? await db.storage.from(BUCKET).createSignedUrls(pfade, 3600) : { data: [] as any[] };
        const url = new Map((urls ?? []).map((u: any) => [u.path, u.signedUrl]));
        const zaehle = (key: (f: any) => string | null) => { const m = new Map<string, number>(); for (const f of alle ?? []) { const k = key(f); if (k) m.set(k, (m.get(k) ?? 0) + 1); } return m; };
        const themen = zaehle((f) => f.thema || null), jahre = zaehle((f) => String(f.datum).slice(0, 4)), bez = zaehle((f) => f.bezug_art ? `${f.bezug_art}|${f.bezug_id}` : null);
        const alleThemen = [...new Set([...themen.keys(), ...THEMEN_VORSCHLAG])];
        return json({
          fotos: liste.map((f: any) => ({
            id: f.id, thema: f.thema, datum: f.datum, beschreibung: f.beschreibung, bezug_art: f.bezug_art, bezug_id: f.bezug_id,
            von: { person_id: f.hochgeladen_von, name: leute.get(f.hochgeladen_von)?.display_name ?? "" },
            vorschau: url.get(pfad.get(f.vorschau_id || f.attachment_id)) ?? null, darfAendern: darfFotoAendern(ich, f),
            meta: f.meta ?? null, hochgeladen: f.hochgeladen_am,
            ...(papierkorb ? { geloescht_am: f.geloescht_am, endgueltig_am: new Date(new Date(f.geloescht_am).getTime() + PAPIERKORB_TAGE * 86400000).toISOString() } : {}),
          })),
          themen: alleThemen.map((t) => ({ thema: t, anzahl: themen.get(t) ?? 0 })).sort((a, b) => b.anzahl - a.anzahl || a.thema.localeCompare(b.thema)),
          jahre: [...jahre.entries()].map(([jahr, anzahl]) => ({ jahr, anzahl })).sort((a, b) => b.jahr.localeCompare(a.jahr)),
          anlaesse: anlaesse.map((x) => ({ ...x, anzahl: bez.get(`${x.art}|${x.id}`) ?? 0 })),
          speicher, papierkorb: imKorb ?? 0,
          alben, albenKorb: albenKorb ?? 0, album: album ? (alben.find((a: any) => a.id === album.id) ?? null) : null,
        });
      }

      // ----- KC-CLUB-FOTO-ALBEN (1.63.0) -----
      case "foto_album_speichern": {
        const name = txt(p.name, 60);
        if (!name) throw new Fehler("Bitte dem Album einen Namen geben, z. B. „Weihnachtsmarkt 2026“.");
        const jahr = Math.round(Number(p.jahr)) || Number(berlinTag(new Date()).slice(0, 4));
        if (!(jahr >= 1950 && jahr <= 2100)) throw new Fehler("Bitte ein gültiges Jahr wählen.");
        const sichtbar = p.sichtbar === "alle" ? "alle" : "privat";
        if (p.id) {
          const a = await albumHolen(ich, p.id, true);
          if (a.besitzer !== ich.person_id && sichtbar !== a.sichtbar) throw new Fehler("Wer das Album sieht, legt nur fest, wer es angelegt hat.", 403);
          const upd: Record<string, unknown> = { name, jahr, sichtbar, geaendert_am: jetzt() };
          if (p.titelfoto !== undefined) {
            const t = String(p.titelfoto || "");
            if (t) { const { data: drin } = await db.from("kc_club_foto_album_fotos").select("foto_id").eq("album_id", a.id).eq("foto_id", t).maybeSingle(); if (!drin) throw new Fehler("Das Deckblatt muss ein Foto aus dem Album sein."); }
            upd.titelfoto = t || null;
          }
          await db.from("kc_club_foto_alben").update(upd).eq("id", a.id);
          await protokoll(ich.person_id, "foto_album_geaendert", { album: a.id, vorher: { name: a.name, jahr: a.jahr, sichtbar: a.sichtbar, titelfoto: a.titelfoto } });
          return json({ ok: true, id: a.id });
        }
        const { count } = await db.from("kc_club_foto_alben").select("id", { count: "exact", head: true }).eq("besitzer", ich.person_id).is("geloescht_am", null);
        if ((count ?? 0) >= ALBUM_MAX_JE_PERSON) throw new Fehler(`Höchstens ${ALBUM_MAX_JE_PERSON} Alben je Person – bitte alte Alben löschen.`, 409);
        const { data: neu, error } = await db.from("kc_club_foto_alben").insert({ name, jahr, sichtbar, besitzer: ich.person_id }).select("id").single();
        if (error || !neu) throw new Fehler("Album konnte nicht angelegt werden.", 500);
        const n = await albumFotosEintragen(ich, neu.id, albumFotoIds(p.fotos));
        await protokoll(ich.person_id, "foto_album_angelegt", { album: neu.id, name, jahr, sichtbar, fotos: n });
        return json({ ok: true, id: neu.id, hinzu: n });
      }

      case "foto_album_fotos": {
        const a = await albumHolen(ich, p.album_id, true);
        const hinzu = await albumFotosEintragen(ich, a.id, albumFotoIds(p.hinzu));
        const weg = albumFotoIds(p.weg);
        if (weg.length) await db.from("kc_club_foto_album_fotos").delete().eq("album_id", a.id).in("foto_id", weg);
        if (weg.length && a.titelfoto && weg.includes(a.titelfoto)) await db.from("kc_club_foto_alben").update({ titelfoto: null }).eq("id", a.id);
        await db.from("kc_club_foto_alben").update({ geaendert_am: jetzt() }).eq("id", a.id);
        await protokoll(ich.person_id, "foto_album_fotos", { album: a.id, hinzu, weg });
        return json({ ok: true, hinzu, weg: weg.length });
      }

      case "foto_album_loeschen": {
        // Papierkorb: die Fotos bleiben im Fotoalbum, nur die Sammlung verschwindet (30 Tage wiederherstellbar)
        const a = await albumHolen(ich, p.id, true);
        const { data: inhalt } = await db.from("kc_club_foto_album_fotos").select("foto_id").eq("album_id", a.id);
        await geloescht(ich, "foto_album", { album: a, fotos: (inhalt ?? []).map((x: any) => x.foto_id) });
        await db.from("kc_club_foto_alben").update({ geloescht_am: jetzt(), geloescht_von: ich.person_id }).eq("id", a.id);
        return json({ ok: true, papierkorbTage: PAPIERKORB_TAGE });
      }

      case "foto_alben_papierkorb": {
        const { data } = await db.from("kc_club_foto_alben").select("id,name,jahr,sichtbar,geloescht_am").eq("besitzer", ich.person_id).not("geloescht_am", "is", null)
          .gt("geloescht_am", new Date(Date.now() - PAPIERKORB_TAGE * 86400000).toISOString()).order("geloescht_am", { ascending: false });
        return json({ alben: data ?? [] });
      }

      case "foto_album_wiederherstellen": {
        const { data: a } = await db.from("kc_club_foto_alben").select("*").eq("id", String(p.id || "")).eq("besitzer", ich.person_id).maybeSingle();
        if (!a || !a.geloescht_am) throw new Fehler("Album nicht im Papierkorb.", 404);
        await db.from("kc_club_foto_alben").update({ geloescht_am: null, geloescht_von: null }).eq("id", a.id);
        await protokoll(ich.person_id, "foto_album_wiederhergestellt", { album: a.id });
        return json({ ok: true });
      }

      case "foto_hochladen": {
        const sp = await speicherStand();
        if (sp.belegt >= SPEICHER_GRENZE * FOTO_STOPP) throw new Fehler("Der kostenlose Speicher ist fast voll – bitte zuerst alte Fotos löschen oder Hansi Bescheid geben.", 507);
        const datum = fotoDatum(p.datum);
        const bezug = await fotoBezugPruefen(p.bezug_art, p.bezug_id);
        const bild = await dateiAblegen(ich, p.name, p.mime, p.daten, /^image\/(jpeg|png|webp)$/);
        let vorschau: { id: string; groesse: number } | null = null;
        try {
          if (p.vorschau) vorschau = await dateiAblegen(ich, "vorschau-" + txt(p.name, 120), "image/jpeg", p.vorschau, /^image\/jpeg$/);
          const { data: f, error } = await db.from("kc_club_fotos").insert({
            attachment_id: bild.id, vorschau_id: vorschau?.id ?? null, thema: txt(p.thema, 60), datum, ...bezug,
            beschreibung: txt(p.beschreibung, 300), groesse: bild.groesse + (vorschau?.groesse ?? 0), hochgeladen_von: ich.person_id,
            meta: fotoMetaPruefen(p.meta, p.mitOrt !== false),
          }).select("id").single();
          if (error || !f) throw new Fehler("Foto konnte nicht gespeichert werden.", 500);
          await protokoll(ich.person_id, "foto_hochgeladen", { foto: f.id, groesse: bild.groesse + (vorschau?.groesse ?? 0) });
          return json({ ok: true, id: f.id });
        } catch (e) { await dateienEntfernen([bild.id, vorschau?.id]); throw e; }
      }

      case "foto_oeffnen": {
        const f = await fotoHolen(p.id);
        if (f.geloescht_am && !ich.admin) throw new Fehler("Foto nicht gefunden.", 404);
        const { data: att } = await db.from("kc_communication_attachments").select("bucket,object_path,file_name").eq("id", f.attachment_id).maybeSingle();
        if (!att) throw new Fehler("Foto nicht gefunden.", 404);
        const { data: su } = await db.storage.from(att.bucket).createSignedUrl(att.object_path, 3600, p.herunterladen ? { download: att.file_name } : undefined);
        if (!su?.signedUrl) throw new Fehler("Foto kann gerade nicht geöffnet werden.", 500);
        return json({ url: su.signedUrl, name: att.file_name });
      }

      // KC-CLUB-FOTO-META (0.45.0): Ortsname ermitteln (einmal, dann gemerkt) oder den Ort entfernen (nur wer ändern darf)
      case "foto_ort": {
        const f = await fotoHolen(p.id), meta = { ...(f.meta ?? {}) };
        if (p.entfernen) {
          if (!darfFotoAendern(ich, f)) throw new Fehler("Den Ort entfernen darf nur, wer das Foto hochgeladen hat.", 403);
          delete meta.gps; delete meta.ort;
          await db.from("kc_club_fotos").update({ meta: Object.keys(meta).length ? meta : null }).eq("id", f.id);
          await protokoll(ich.person_id, "foto_ort_entfernt", { foto: f.id });
          return json({ ok: true, meta: Object.keys(meta).length ? meta : null });
        }
        if (!meta.gps || meta.ort) return json({ meta: f.meta ?? null });
        if (Date.now() - ortsnameZuletzt < 1100) await new Promise((r) => setTimeout(r, 1100)); // Nutzungsregel: max. 1 Anfrage/s
        ortsnameZuletzt = Date.now();
        try { meta.ort = await ortsnameHolen(meta.gps.lat, meta.gps.lon); }
        catch (e) { console.error("foto_ort", String(e)); return json({ meta: f.meta, fehler: "Ortsname gerade nicht abrufbar" }); }
        if (meta.ort) await db.from("kc_club_fotos").update({ meta }).eq("id", f.id);
        return json({ meta });
      }

      case "foto_aendern": {
        const f = await fotoHolen(p.id);
        if (f.geloescht_am) throw new Fehler("Das Foto liegt im Papierkorb.", 409);
        if (!darfFotoAendern(ich, f)) throw new Fehler("Ändern darf nur, wer das Foto hochgeladen hat (oder Clubsprecher/Kassenwart).", 403);
        const upd: Record<string, unknown> = {};
        if (p.thema !== undefined) upd.thema = txt(p.thema, 60);
        if (p.beschreibung !== undefined) upd.beschreibung = txt(p.beschreibung, 300);
        if (p.datum !== undefined) upd.datum = fotoDatum(p.datum);
        if (p.bezug_art !== undefined) Object.assign(upd, await fotoBezugPruefen(p.bezug_art, p.bezug_id));
        await db.from("kc_club_fotos").update(upd).eq("id", f.id);
        await protokoll(ich.person_id, "foto_geaendert", { foto: f.id, vorher: { thema: f.thema, datum: f.datum, beschreibung: f.beschreibung, bezug_art: f.bezug_art, bezug_id: f.bezug_id } });
        return json({ ok: true });
      }

      case "foto_loeschen": {
        // Papierkorb: 30 Tage wiederherstellbar (Admin), danach entfernt die Wartung die Dateien
        const f = await fotoHolen(p.id);
        if (f.geloescht_am) return json({ ok: true });
        if (!darfFotoAendern(ich, f)) throw new Fehler("Löschen darf nur, wer das Foto hochgeladen hat (oder Clubsprecher/Kassenwart).", 403);
        await geloescht(ich, "foto", { foto: f });
        await db.from("kc_club_fotos").update({ geloescht_am: jetzt(), geloescht_von: ich.person_id }).eq("id", f.id);
        return json({ ok: true, papierkorbTage: PAPIERKORB_TAGE });
      }

      case "foto_wiederherstellen": {
        nurAdmin(ich);
        const f = await fotoHolen(p.id);
        await db.from("kc_club_fotos").update({ geloescht_am: null, geloescht_von: null }).eq("id", f.id);
        await protokoll(ich.person_id, "foto_wiederhergestellt", { foto: f.id });
        return json({ ok: true });
      }

      // ----- Globale Suche (KC-CLUB-SUCHE, 1.4.0) -----
      case "suche": {
        const roh = txt(p.q, 80);
        if (suchNorm(roh).replace(/\s/g, "").length < 2) return json({ bereiche: [] });
        const woerter = p.genau ? [roh] : roh.split(/\s+/).filter(Boolean).slice(0, 6);
        const bereiche = Array.isArray(p.bereiche) ? SUCHE_BEREICHE.filter((b) => p.bereiche.includes(b)) : SUCHE_BEREICHE;
        const grenze = p.schnell ? 6 : 60;
        const von = suchTag(p.von), bis = suchTag(p.bis, 1), autor = txt(p.autor, 60) || null, anhang = !!p.anhang;
        const imZeitraum = (d: unknown) => { const t = d ? new Date(String(d).length === 10 ? String(d) + "T12:00:00Z" : String(d)) : null; return !t || ((!von || t >= von) && (!bis || t < bis)); };
        const treffer: any[] = [];
        const [{ data: db1, error }] = await Promise.all([
          db.rpc("kc_club_suche", { p_woerter: woerter, p_bereiche: bereiche, p_person: ich.person_id, p_protokolle: ich.protokolle, p_vorstand: ich.vorstand,
            p_von: von?.toISOString() ?? null, p_bis: bis?.toISOString() ?? null, p_autor: autor, p_anhang: anhang, p_grenze: grenze }),
          (async () => {
            if (anhang) return;
            if (bereiche.includes("mitglieder") && !autor && !von && !bis) {
              const [leute, { data: rollen }] = await Promise.all([aktiveMitglieder(), db.from("kc_club_rollen").select("person_id,aemter")]);
              const am = new Map((rollen ?? []).map((r: any) => [r.person_id, (r.aemter ?? []) as string[]]));
              for (const m of leute) {
                const aemter = am.get(m.person_id) ?? [];
                if (suchPasst(woerter, m.display_name, m.preferred_name, ...aemter))
                  treffer.push({ bereich: "mitglieder", id: m.person_id, titel: m.display_name, inhalt: aemter.join(" · "), datum: null, autor: null, extra: {}, rang: suchNorm(m.display_name).startsWith(suchNorm(woerter[0])) ? 5 : 3 });
              }
            }
            if (bereiche.includes("aktionen") && !autor) {
              const { liste } = await aktionenRoh();
              for (const a of liste) if (imZeitraum(a.dateFrom) && suchPasst(woerter, a.activity, a.organizer, a.mobility, typeof a.description === "string" ? a.description : ""))
                treffer.push({ bereich: "aktionen", id: String(a.id), titel: txt(a.activity, 200) || "Aktion", inhalt: [txt(a.organizer, 120), a.dateTo && a.dateTo !== a.dateFrom ? "bis " + a.dateTo : ""].filter(Boolean).join(" · "), datum: a.dateFrom, autor: null, extra: {}, rang: 2 });
            }
            if (bereiche.includes("nachrichten") && !autor) {
              // Gruppen und Unterhaltungen nach Namen/Betreff (nur meine)
              const { data: tp } = await db.from("kc_communication_thread_participants").select("thread_id").eq("person_id", ich.person_id);
              const ids = (tp ?? []).map((x: any) => x.thread_id);
              const { data: th } = ids.length ? await db.from("kc_communication_threads").select("id,subject,updated_at").in("id", ids) : { data: [] as any[] };
              const { data: gr } = ids.length ? await db.from("kc_club_gruppen").select("thread_id,name,symbol").in("thread_id", ids) : { data: [] as any[] };
              const gm = new Map((gr ?? []).map((g: any) => [g.thread_id, g]));
              for (const t of th ?? []) {
                const g: any = gm.get(t.id);
                if (imZeitraum(t.updated_at) && suchPasst(woerter, g?.name || t.subject))
                  treffer.push({ bereich: "nachrichten", id: "u:" + t.id, titel: g ? `${g.symbol} ${g.name}` : t.subject || "Unterhaltung", inhalt: g ? "Gruppe" : "Unterhaltung", datum: t.updated_at, autor: null, extra: { thread: t.id, unterhaltung: true }, rang: 4 });
              }
            }
          })(),
        ]);
        if (error) { console.error("suche", error.message); throw new Fehler("Die Suche hat gerade nicht geklappt – bitte gleich nochmal versuchen.", 500); }
        treffer.push(...(db1 ?? []));
        const leute = await personen(treffer.map((t) => t.autor).filter(Boolean));
        const relevanz = p.sortierung === "relevanz";
        const gruppen = bereiche.map((b) => {
          const alle = treffer.filter((t) => t.bereich === b)
            .sort((x, y) => (relevanz ? (y.rang ?? 1) - (x.rang ?? 1) : 0) || String(y.datum ?? "").localeCompare(String(x.datum ?? "")));
          // gleiche Nachricht über Text und Anhang nur einmal
          const gesehen = new Set<string>(), liste = alle.filter((t) => { const k = t.bereich + t.id; if (gesehen.has(k)) return false; gesehen.add(k); return true; });
          const zeigen = p.schnell ? 4 : grenze;
          return { bereich: b, mehr: liste.length > zeigen || liste.length >= grenze, treffer: liste.slice(0, zeigen).map((t) => ({
            id: t.id, titel: txt(t.titel, 160) || "–", text: txt(t.inhalt, 600), datum: t.datum, von: t.autor ? leute.get(t.autor)?.display_name || null : null, extra: t.extra ?? {} })) };
        }).filter((g) => g.treffer.length);
        return json({ bereiche: gruppen });
      }

      // ----- Archiv (KC-CLUB-ARCHIV, 1.2.0) -----
      case "archiv_liste": {
        // KC-CLUB-ARCHIV-PERSOENLICH (1.5.0): eigener Ordner des laufenden Jahres entsteht beim ersten Öffnen von selbst
        await archivEigenerOrdner(ich, Number(berlinTag(new Date()).slice(0, 4))).catch((e) => console.error("eigener Ordner", String(e)));
        const [{ data: or }, autoAlle, fr, alben, { data: ausW }] = await Promise.all([
          db.from("kc_club_archiv_ordner").select("*").is("geloescht_am", null).order("jahr", { ascending: false }).order("titel"),
          archivAuto(ich),
          archivFreigabenFuer(ich.person_id),
          albenFuer(ich).catch((e) => { console.error("alben", String(e)); return [] as any[]; }), // KC-CLUB-FOTO-ALBEN (1.63.0): Alben als Rücken im Regal
          db.from("kc_club_person_einstellung").select("wert").eq("person_id", ich.person_id).eq("schluessel", "archiv_ausgeblendet").maybeSingle(),
        ]);
        // KC-CLUB-ARCHIV-AUSBLENDEN (1.64.2, Wunsch Hansi „Löschen muss in allen Ordnern möglich sein“): Vereinsleben zeigt Daten
        // anderer Bereiche – „🗑️“ blendet sie nur für mich aus (Termine, Protokolle … bleiben unangetastet; zurückholbar).
        const ausgeblendet = new Set<string>((ausW?.wert?.ids ?? []) as string[]);
        const auto = autoAlle.filter((x: any) => !ausgeblendet.has(`${x.art}:${x.id}`));
        const autoWeg = autoAlle.filter((x: any) => ausgeblendet.has(`${x.art}:${x.id}`)).map((x: any) => ({ art: x.art, id: x.id, titel: x.titel, datum: x.datum }));
        const geteiltIds = new Set(fr.map((f: any) => f.ordner_id));
        const ordner = (or ?? []).filter((o: any) => o.besitzer ? (o.besitzer === ich.person_id || geteiltIds.has(o.id)) : darfOrdnerSehen(ich, o));
        const oids = ordner.map((o: any) => o.id), om = new Map(ordner.map((o: any) => [o.id, o]));
        const { data: dkRoh } = oids.length ? await db.from("kc_club_archiv_dokumente").select("*").is("geloescht_am", null).in("ordner_id", oids).order("datum", { ascending: false, nullsFirst: false }) : { data: [] as any[] };
        const dk = (dkRoh ?? []).filter((d: any) => darfDokSehen(ich, om.get(d.ordner_id), d, fr));
        // Freigaben meiner eigenen Ordner (zum Verwalten) + Namen für Anzeige
        const eigeneIds = ordner.filter((o: any) => o.besitzer === ich.person_id).map((o: any) => o.id);
        const { data: meineFr } = eigeneIds.length ? await db.from("kc_club_archiv_freigaben").select("*").in("ordner_id", eigeneIds).is("beendet_am", null).gt("bis", jetzt()).order("bis") : { data: [] as any[] };
        const grIds = [...new Set([...(meineFr ?? []), ...fr].map((f: any) => f.an_gruppe).filter(Boolean))];
        const [{ data: grNamen }, meineGr, aktiv] = await Promise.all([
          grIds.length ? db.from("kc_club_gruppen").select("thread_id,name,symbol").in("thread_id", grIds) : Promise.resolve({ data: [] as any[] }),
          meineGruppenIds(ich.person_id).then(async (ids) => ids.length ? (await db.from("kc_club_gruppen").select("thread_id,name,symbol").in("thread_id", ids)).data ?? [] : []),
          aktiveMitglieder(),
        ]);
        const gm = new Map([...(grNamen ?? []), ...meineGr].map((g: any) => [g.thread_id, `${g.symbol || "👥"} ${g.name}`]));
        const leute = await personen([...dk.map((d: any) => d.hochgeladen_von), ...ordner.map((o: any) => o.besitzer).filter(Boolean), ...(meineFr ?? []).map((f: any) => f.an_person).filter(Boolean)]);
        const fAnzeige = (f: any) => ({ id: f.id, register: f.register, dokument: f.dokument_id, hochladen: f.hochladen, bis: f.bis,
          an: f.an_person ? (leute.get(f.an_person)?.display_name || f.an_person) : (gm.get(f.an_gruppe) || "Gruppe"), gruppe: !!f.an_gruppe });
        // Admin: nur dass es persönliche Ordner gibt und wie voll sie sind – nie der Inhalt
        let persoenlich: any[] | undefined;
        if (ich.admin) {
          const { data: alleP } = await db.from("kc_club_archiv_ordner").select("id,besitzer,jahr").not("besitzer", "is", null).is("geloescht_am", null);
          const pIds = (alleP ?? []).map((o: any) => o.id);
          const { data: pDok } = pIds.length ? await db.from("kc_club_archiv_dokumente").select("ordner_id,groesse").in("ordner_id", pIds).is("geloescht_am", null) : { data: [] as any[] };
          const pl = await personen((alleP ?? []).map((o: any) => o.besitzer));
          persoenlich = (alleP ?? []).map((o: any) => { const x = (pDok ?? []).filter((d: any) => d.ordner_id === o.id); return { name: pl.get(o.besitzer)?.display_name || o.besitzer, jahr: o.jahr, anzahl: x.length, groesse: x.reduce((s: number, d: any) => s + Number(d.groesse || 0), 0) }; })
            .sort((a: any, b: any) => a.name.localeCompare(b.name) || b.jahr - a.jahr);
        }
        return json({
          darf: darfArchivPflegen(ich), vorstand: ich.vorstand, ich: ich.person_id, arten: ARCHIV_ARTEN, papierkorbTage: PAPIERKORB_TAGE,
          speicher: { belegt: await archivBelegtVon(ich.person_id), grenze: PERSOENLICH_GRENZE }, register: PERSOENLICH_REGISTER, freigabeMaxTage: FREIGABE_MAX_TAGE,
          personen: aktiv.filter((m) => m.person_id !== ich.person_id).map((m) => ({ id: m.person_id, name: m.display_name })),
          gruppen: meineGr.map((g: any) => ({ id: g.thread_id, name: `${g.symbol || "👥"} ${g.name}` })),
          ordner: ordner.map((o: any) => {
            const eigen = o.besitzer === ich.person_id, inhalt = dk.filter((d: any) => d.ordner_id === o.id);
            return { id: o.id, art: o.art, jahr: o.jahr, titel: o.besitzer ? (leute.get(o.besitzer)?.display_name || o.titel) : o.titel, farbe: o.farbe, register: o.register, nur_vorstand: o.nur_vorstand, einreichen: !!o.einreichen,
              besitzer: o.besitzer || null, eigen, anzahl: inhalt.filter((d: any) => d.status === "ok").length, pruefung: inhalt.filter((d: any) => d.status === "pruefung").length,
              freigaben: eigen ? (meineFr ?? []).filter((f: any) => f.ordner_id === o.id).map(fAnzeige) : undefined,
              geteilt: !eigen && o.besitzer ? fr.filter((f: any) => f.ordner_id === o.id).map(fAnzeige) : undefined };
          }),
          dokumente: dk.map((d: any) => ({ id: d.id, ordner_id: d.ordner_id, register: d.register, titel: d.titel, datum: d.datum, stichworte: d.stichworte, status: d.status, beschreibung: d.beschreibung || "",
            name: d.datei_name, mime: d.mime, groesse: d.groesse, datei: d.attachment_id, von: leute.get(d.hochgeladen_von)?.display_name || d.hochgeladen_von, vonIch: d.hochgeladen_von === ich.person_id, am: d.hochgeladen_am })),
          auto, persoenlich, alben, autoWeg,
        });
      }

      case "archiv_mein_ordner": {
        // weiteres Jahr für den eigenen Ordner (z. B. Unterlagen aus dem Vorjahr)
        const jahr = Math.round(Number(p.jahr));
        if (!(jahr >= 1950 && jahr <= new Date().getFullYear() + 1)) throw new Fehler("Bitte ein gültiges Jahr wählen.");
        const id = await archivEigenerOrdner(ich, jahr);
        if (!id) throw new Fehler("Ordner konnte nicht angelegt werden.", 500);
        const { data: o } = await db.from("kc_club_archiv_ordner").select("geloescht_am").eq("id", id).single();
        if (o?.geloescht_am) throw new Fehler(`Dein Ordner ${jahr} liegt im Papierkorb – dort mit ♻️ zurückholen.`, 409);
        return json({ ok: true, id });
      }

      case "archiv_ordner_speichern": {
        if (p.id) {
          const o = await archivOrdnerHolen(ich, p.id, false, "pflegen");
          if (o.besitzer) {
            // eigener Ordner: Jahr und Beschriftung (Name) bleiben fest – Register und Farbe frei
            const register = archivRegister(p.register, "sonstiges"), farbe = Math.min(8, Math.max(1, Math.round(Number(p.farbe)) || 6));
            await db.from("kc_club_archiv_ordner").update({ register: register.length ? register : PERSOENLICH_REGISTER, farbe, geaendert_am: jetzt() }).eq("id", o.id);
            const { data: weg } = await db.from("kc_club_archiv_dokumente").select("id,register").eq("ordner_id", o.id);
            const fehlt = (weg ?? []).filter((d: any) => !register.includes(d.register)).map((d: any) => d.id);
            if (fehlt.length) await db.from("kc_club_archiv_dokumente").update({ register: register[0] }).in("id", fehlt);
            await protokoll(ich.person_id, "archiv_eigener_ordner_geaendert", { ordner: o.id, umgehaengt: fehlt.length });
            return json({ ok: true, id: o.id });
          }
        }
        nurArchivPflege(ich);
        const art = String(p.art || "");
        if (!ARCHIV_ARTEN[art]) throw new Fehler("Bitte eine Art für den Ordner wählen.");
        const jahr = Math.round(Number(p.jahr));
        if (!(jahr >= 1950 && jahr <= new Date().getFullYear() + 1)) throw new Fehler("Bitte ein gültiges Jahr wählen.");
        const werte = { art, jahr, titel: txt(p.titel, 60) || ARCHIV_ARTEN[art].t, farbe: Math.min(8, Math.max(1, Math.round(Number(p.farbe)) || 1)),
          register: archivRegister(p.register, art), nur_vorstand: !!p.nur_vorstand, geaendert_am: jetzt(),
          einreichen: p.einreichen === undefined ? art === "chronik" : !!p.einreichen && !p.nur_vorstand }; // KC-CLUB-CHRONIK: Chronik standardmäßig „alle dürfen einreichen“
        if (p.id) {
          const o = await archivOrdnerHolen(ich, p.id, false, "pflegen");
          await db.from("kc_club_archiv_ordner").update(werte).eq("id", o.id);
          // Dokumente in einem entfernten Register → ins erste Register (nichts geht verloren)
          const { data: weg } = await db.from("kc_club_archiv_dokumente").select("id,register").eq("ordner_id", o.id);
          const fehlt = (weg ?? []).filter((d: any) => !werte.register.includes(d.register)).map((d: any) => d.id);
          if (fehlt.length) await db.from("kc_club_archiv_dokumente").update({ register: werte.register[0] }).in("id", fehlt);
          await protokoll(ich.person_id, "archiv_ordner_geaendert", { ordner: o.id, vorher: { art: o.art, jahr: o.jahr, titel: o.titel, register: o.register, nur_vorstand: o.nur_vorstand, einreichen: o.einreichen }, umgehaengt: fehlt.length });
          return json({ ok: true, id: o.id });
        }
        const { data: neu, error } = await db.from("kc_club_archiv_ordner").insert({ ...werte, erstellt_von: ich.person_id }).select("id").single();
        if (error || !neu) throw new Fehler("Ordner konnte nicht angelegt werden.", 500);
        await protokoll(ich.person_id, "archiv_ordner_angelegt", { ordner: neu.id, art, jahr, titel: werte.titel, nur_vorstand: werte.nur_vorstand });
        return json({ ok: true, id: neu.id });
      }

      case "archiv_ordner_loeschen": {
        // Papierkorb: Ordner samt Inhalt 30 Tage wiederherstellbar, danach entfernt die Wartung alles endgültig
        const o = await archivOrdnerHolen(ich, p.id, false, "pflegen");
        await geloescht(ich, "archiv_ordner", { ordner: o });
        await db.from("kc_club_archiv_ordner").update({ geloescht_am: jetzt(), geloescht_von: ich.person_id }).eq("id", o.id);
        if (o.besitzer) await db.from("kc_club_archiv_freigaben").update({ beendet_am: jetzt() }).eq("ordner_id", o.id).is("beendet_am", null);
        return json({ ok: true, papierkorbTage: PAPIERKORB_TAGE });
      }

      case "archiv_hochladen": {
        const o: any = await archivOrdnerHolen(ich, p.ordner_id, false, "hochladen");
        const vereinEinreichung = !!o._einreichung; // KC-CLUB-CHRONIK (1.64.0): Mitglied legt in einen Vereinsordner zur Prüfung
        const einreichung = (!!o.besitzer && !o._eigen) || vereinEinreichung;
        if (o.besitzer && (await archivBelegtVon(o.besitzer)) >= PERSOENLICH_GRENZE)
          throw new Fehler(einreichung ? "Der Ordner ist voll (50 MB) – bitte dem Besitzer Bescheid geben." : "Dein persönlicher Speicher ist voll (50 MB) – bitte zuerst Altes löschen.", 507);
        const sp = await speicherStand();
        if (sp.belegt >= SPEICHER_GRENZE * ARCHIV_STOPP) throw new Fehler("Der kostenlose Speicher ist voll – bitte zuerst Altes löschen oder Hansi Bescheid geben.", 507);
        const datei = await dateiAblegen(ich, p.name, p.mime, p.daten, ARCHIV_DATEITYPEN);
        try {
          // Einreichung: nur in das freigegebene Register (bei Register-Freigabe), Status „zur Prüfung“
          const erlaubteReg = einreichung ? o._freigaben.filter((f: any) => f.hochladen && !f.dokument_id).map((f: any) => f.register) : [];
          let register = o.register.includes(String(p.register)) ? String(p.register) : o.register[0] ?? null;
          if (einreichung && !vereinEinreichung && !erlaubteReg.includes(null) && !erlaubteReg.includes(register)) register = erlaubteReg[0];
          const { data: d, error } = await db.from("kc_club_archiv_dokumente").insert({
            ordner_id: o.id, register, titel: txt(p.titel, 120) || datei.name, datum: archivDatum(p.datum), stichworte: archivStichworte(p.stichworte), beschreibung: txt(p.beschreibung, 1000),
            attachment_id: datei.id, datei_name: datei.name, mime: txt(p.mime, 100), groesse: datei.groesse, hochgeladen_von: ich.person_id,
            status: einreichung ? "pruefung" : "ok",
          }).select("id").single();
          if (error || !d) throw new Fehler("Dokument konnte nicht gespeichert werden.", 500);
          await protokoll(ich.person_id, einreichung ? "archiv_eingereicht" : "archiv_hochgeladen", { dokument: d.id, ordner: o.id, register, groesse: datei.groesse });
          if (vereinEinreichung) {
            const titel = txt(p.titel, 120) || datei.name, url = `${APP_URL}#archiv`, an = (await archivPflegerIds()).filter((x) => x !== ich.person_id);
            if (an.length) await senden("club_nachricht", an, {
              titel: `📥 Neu für „${txt(o.titel, 40)}“ – bitte prüfen`, kurz: `${ich.name}: „${titel}“${register ? ` (${register})` : ""} – annehmen oder ablehnen`,
              betreff: `Köcheclub Werne – ein Beitrag für „${txt(o.titel, 40)}“ wartet auf Prüfung`,
              text: `Hallo,

${ich.name} hat „${titel}“ für den Ordner „${txt(o.titel, 60)}“${register ? ` (Register ${register})` : ""} eingereicht.
Alle sehen den Beitrag erst, wenn ihn jemand aus der Clubleitung annimmt.

${url}

Viele Grüße
Köcheclub-App`,
              url,
            }, `club-archiv-pruefung:${d.id}`).catch(() => null);
          } else if (einreichung) {
            const b = (await personen([o.besitzer])).get(o.besitzer), titel = txt(p.titel, 120) || datei.name, url = `${APP_URL}#archiv`;
            await senden("club_nachricht", [o.besitzer], {
              titel: "📥 Neues Dokument zur Prüfung", kurz: `${ich.name}: „${titel}“ in deinem Ordner ${o.jahr} – annehmen oder ablehnen`,
              betreff: "Köcheclub Werne – ein Dokument wartet auf deine Prüfung",
              text: `Hallo ${vorname(b)},\n\n${ich.name} hat „${titel}“ in deinen persönlichen Ordner ${o.jahr}${register ? ` (Register ${register})` : ""} gelegt.\nEs ist erst sichtbar, wenn du es annimmst. Du kannst es auch ablehnen – dann wird es gelöscht.\n\n${url}\n\nViele Grüße\nKöcheclub-App`,
              url,
            }, `club-archiv-pruefung:${d.id}`).catch(() => null);
          }
          return json({ ok: true, id: d.id, pruefung: einreichung });
        } catch (e) { await dateienEntfernen([datei.id]); throw e; }
      }

      case "archiv_ausblenden": {
        // KC-CLUB-ARCHIV-AUSBLENDEN (1.64.2): Eintrag aus „Vereinsleben“ nur für mich aus- oder wieder einblenden
        const key = `${txt(p.art, 20)}:${txt(p.id, 120)}`;
        if (!/^(treffen|protokoll|abstimmung|aktion|pinnwand|anhang|dienst):.+/.test(key)) throw new Fehler("Unbekannter Eintrag.");
        const { data: w } = await db.from("kc_club_person_einstellung").select("wert").eq("person_id", ich.person_id).eq("schluessel", "archiv_ausgeblendet").maybeSingle();
        const ids = new Set<string>((w?.wert?.ids ?? []) as string[]);
        if (p.zurueck) ids.delete(key); else ids.add(key);
        const { error } = await db.from("kc_club_person_einstellung").upsert({ person_id: ich.person_id, schluessel: "archiv_ausgeblendet", wert: { ids: [...ids].slice(-2000) }, geaendert_am: jetzt() }, { onConflict: "person_id,schluessel" });
        if (error) throw new Fehler("Konnte nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, p.zurueck ? "archiv_eingeblendet" : "archiv_ausgeblendet", { eintrag: key });
        return json({ ok: true });
      }

      // KC-CLUB-BLAETTERN (1.64.0): alle sichtbaren Dokumente eines Ordners mit Link (1 Stunde) – für „📖 Blättern“ in einem Rutsch
      case "archiv_blaettern": {
        const o: any = await archivOrdnerHolen(ich, p.ordner_id, false, "lesen");
        const { data: dk } = await db.from("kc_club_archiv_dokumente").select("id,register,titel,datum,beschreibung,mime,datei_name,attachment_id,status,hochgeladen_von")
          .eq("ordner_id", o.id).is("geloescht_am", null).eq("status", "ok").order("datum", { ascending: true, nullsFirst: false }).limit(400);
        const sicht = (dk ?? []).filter((d: any) => darfDokSehen(ich, o, d, o._freigaben));
        const ids = sicht.map((d: any) => d.attachment_id), att: any[] = [];
        for (let i = 0; i < ids.length; i += 100) { const { data } = await db.from("kc_communication_attachments").select("id,bucket,object_path").in("id", ids.slice(i, i + 100)); att.push(...(data ?? [])); }
        const url = new Map<string, string>();
        for (const bucket of [...new Set(att.map((a) => a.bucket))]) {
          const liste = att.filter((a) => a.bucket === bucket);
          const { data: su } = await db.storage.from(bucket).createSignedUrls(liste.map((a) => a.object_path), 3600);
          for (const u of su ?? []) { const a = liste.find((x) => x.object_path === u.path); if (a && u.signedUrl) url.set(a.id, u.signedUrl); }
        }
        return json({ ordner: { id: o.id, titel: o.besitzer ? undefined : o.titel, jahr: o.jahr, art: o.art, register: o.register },
          seiten: sicht.map((d: any) => ({ id: d.id, register: d.register, titel: d.titel, datum: d.datum, beschreibung: d.beschreibung || "", mime: d.mime, name: d.datei_name, url: url.get(d.attachment_id) ?? null })) });
      }

      case "archiv_pruefung": {
        // Besitzer entscheidet über eine Einreichung: annehmen (sichtbar wie alles andere) oder ablehnen (wird gelöscht)
        const { d, o } = await archivDokHolen(ich, p.id, "pflegen");
        // KC-CLUB-CHRONIK (1.64.0): im Vereinsordner prüft die Archiv-Pflege (Clubsprecher/Admin)
        if (o.besitzer ? !o._eigen : !darfArchivPflegen(ich)) throw new Fehler(o.besitzer ? "Das kann nur der Besitzer des Ordners." : "Prüfen dürfen Clubsprecher und Admin.", 403);
        if (d.status !== "pruefung") return json({ ok: true, schon: true });
        const ja = p.annehmen === true, url = `${APP_URL}#archiv`;
        if (ja) await db.from("kc_club_archiv_dokumente").update({ status: "ok", geaendert_am: jetzt() }).eq("id", d.id);
        else {
          await geloescht(ich, "archiv_einreichung", { dokument: d });
          await db.from("kc_club_archiv_dokumente").delete().eq("id", d.id);
          await dateienEntfernen([d.attachment_id]);
        }
        await protokoll(ich.person_id, ja ? "archiv_einreichung_angenommen" : "archiv_einreichung_abgelehnt", { dokument: d.id, ordner: o.id, von: d.hochgeladen_von });
        if (d.hochgeladen_von !== ich.person_id) await senden("club_nachricht", [d.hochgeladen_von], {
          titel: ja ? "✅ Dokument angenommen" : "✖ Dokument abgelehnt", kurz: `${ich.name} hat „${txt(d.titel, 80)}“ ${ja ? "angenommen" : "abgelehnt"}.`,
          betreff: `Köcheclub Werne – dein Dokument wurde ${ja ? "angenommen" : "abgelehnt"}`,
          text: `Hallo,\n\n${ich.name} hat dein Dokument „${txt(d.titel, 120)}“ ${ja ? (o.besitzer ? "angenommen – es liegt jetzt in seinem/ihrem Ordner" : `angenommen – es steht jetzt für alle im Ordner „${txt(o.titel, 60)}“`) : "abgelehnt – es wurde gelöscht"}.\n\n${url}\n\nViele Grüße\nKöcheclub-App`,
          url,
        }, `club-archiv-entscheid:${d.id}`).catch(() => null);
        return json({ ok: true, angenommen: ja });
      }

      case "archiv_freigeben": {
        // Freigabe auf Zeit: ganzer Ordner / ein Register / ein Dokument – an Personen und/oder Gruppen
        const o = await archivOrdnerHolen(ich, p.ordner_id, false, "pflegen");
        if (!o.besitzer || !o._eigen) throw new Fehler("Freigeben kann man nur den eigenen Ordner.", 403);
        let register: string | null = null, dokument: string | null = null;
        if (p.dokument_id) {
          const { data: d } = await db.from("kc_club_archiv_dokumente").select("id,ordner_id,status,titel").eq("id", String(p.dokument_id)).maybeSingle();
          if (!d || d.ordner_id !== o.id || d.status !== "ok") throw new Fehler("Dokument nicht gefunden.", 404);
          dokument = d.id;
        } else if (p.register) {
          if (!o.register.includes(String(p.register))) throw new Fehler("Dieses Register gibt es im Ordner nicht.");
          register = String(p.register);
        }
        const bis = new Date(String(p.bis || ""));
        if (isNaN(bis.getTime()) || bis.getTime() < Date.now() + 15 * 60_000) throw new Fehler("Bitte ein Ende in der Zukunft wählen.");
        if (bis.getTime() > Date.now() + FREIGABE_MAX_TAGE * 86400_000) throw new Fehler(`Höchstens ${FREIGABE_MAX_TAGE} Tage – eine Freigabe „für immer“ gibt es nicht.`);
        const hochladen = !dokument && p.hochladen === true;
        const aktiv = new Set((await aktiveMitglieder()).map((m) => m.person_id));
        const leute = [...new Set<string>((Array.isArray(p.personen) ? p.personen : []).map((x: unknown) => String(x)))].filter((x) => aktiv.has(x) && x !== ich.person_id).slice(0, 40);
        const meineGr = new Set(await meineGruppenIds(ich.person_id));
        const { data: grOk } = meineGr.size ? await db.from("kc_club_gruppen").select("thread_id,name,symbol").in("thread_id", [...meineGr]) : { data: [] as any[] };
        const gruppen = [...new Set<string>((Array.isArray(p.gruppen) ? p.gruppen : []).map((x: unknown) => String(x)))].filter((g) => (grOk ?? []).some((x: any) => x.thread_id === g)).slice(0, 10);
        if (!leute.length && !gruppen.length) throw new Fehler("Bitte mindestens eine Person oder Gruppe wählen.");
        const zeilen = [...leute.map((x) => ({ an_person: x })), ...gruppen.map((g) => ({ an_gruppe: g }))]
          .map((z) => ({ ...z, ordner_id: o.id, register, dokument_id: dokument, hochladen, bis: bis.toISOString(), erstellt_von: ich.person_id }));
        const { error } = await db.from("kc_club_archiv_freigaben").insert(zeilen);
        if (error) throw new Fehler("Freigabe konnte nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, "archiv_freigegeben", { ordner: o.id, register, dokument, hochladen, bis: bis.toISOString(), personen: leute, gruppen });
        // Benachrichtigen: Personen + Mitglieder der Gruppen (ohne mich)
        const { data: tp } = gruppen.length ? await db.from("kc_communication_thread_participants").select("person_id").in("thread_id", gruppen) : { data: [] as any[] };
        const ziel = [...new Set([...leute, ...(tp ?? []).map((x: any) => x.person_id)])].filter((x) => x !== ich.person_id && aktiv.has(x));
        let wasText = `meinen Ordner ${o.jahr}`;
        if (register) wasText = `das Register „${register}“ in meinem Ordner ${o.jahr}`;
        if (dokument) { const { data: d } = await db.from("kc_club_archiv_dokumente").select("titel").eq("id", dokument).single(); wasText = `das Dokument „${txt(d?.titel, 80)}“ aus meinem Ordner ${o.jahr}`; }
        const bisText = wann(bis.toISOString()), url = `${APP_URL}#archiv`;
        const versand = ziel.length ? await senden("club_nachricht", ziel, {
          titel: `🔓 ${ich.vorname} hat dir etwas freigegeben`, kurz: `${wasText} – bis ${bisText}${hochladen ? " · du darfst auch etwas hineinlegen" : ""}`,
          betreff: `Köcheclub Werne – ${ich.name} hat dir etwas im Archiv freigegeben`,
          text: `Hallo,\n\n${ich.name} hat dir ${wasText} freigegeben – bis ${bisText}.\n${hochladen ? "Du darfst auch Dokumente hineinlegen; sie werden erst nach Prüfung sichtbar.\n" : ""}\nDu findest es im Archiv unter „🤝 Mit mir geteilt“.\n${url}\n\nViele Grüße\nKöcheclub-App`,
          url,
        }, `club-archiv-freigabe:${o.id}:${Date.now()}`).catch(() => null) : null;
        return json({ ok: true, anzahl: zeilen.length, benachrichtigt: ziel.length, versand });
      }

      case "archiv_freigabe_beenden": {
        const { data: f } = await db.from("kc_club_archiv_freigaben").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!f) throw new Fehler("Freigabe nicht gefunden.", 404);
        const o = await archivOrdnerHolen(ich, f.ordner_id, true, "pflegen");
        if (!o._eigen) throw new Fehler("Das kann nur der Besitzer des Ordners.", 403);
        await db.from("kc_club_archiv_freigaben").update({ beendet_am: jetzt() }).eq("id", f.id).is("beendet_am", null);
        await protokoll(ich.person_id, "archiv_freigabe_beendet", { freigabe: f.id, ordner: o.id });
        return json({ ok: true });
      }

      case "archiv_aendern": {
        const { d, o: quelle } = await archivDokHolen(ich, p.id, "pflegen");
        if (d.geloescht_am) throw new Fehler("Das Dokument liegt im Papierkorb.", 409);
        if (d.status === "pruefung") throw new Fehler("Bitte zuerst annehmen oder ablehnen.", 409);
        const ziel = p.ordner_id && p.ordner_id !== d.ordner_id ? await archivOrdnerHolen(ich, p.ordner_id, false, "pflegen") : quelle;
        // nie zwischen persönlichem und Vereins-Archiv (oder fremden Ordnern) verschieben
        if ((ziel.besitzer || null) !== (quelle.besitzer || null)) throw new Fehler("Dokumente bleiben im eigenen Bereich – zwischen persönlichem Ordner und Vereinsarchiv wird nicht verschoben.");
        const upd: Record<string, unknown> = { ordner_id: ziel.id, geaendert_am: jetzt() };
        if (p.titel !== undefined) upd.titel = txt(p.titel, 120) || d.titel;
        if (p.datum !== undefined) upd.datum = archivDatum(p.datum);
        if (p.stichworte !== undefined) upd.stichworte = archivStichworte(p.stichworte);
        if (p.beschreibung !== undefined) upd.beschreibung = txt(p.beschreibung, 1000); // KC-CLUB-CHRONIK
        const reg = p.register !== undefined ? String(p.register) : d.register;
        upd.register = ziel.register.includes(reg) ? reg : ziel.register[0] ?? null;
        await db.from("kc_club_archiv_dokumente").update(upd).eq("id", d.id);
        await protokoll(ich.person_id, "archiv_geaendert", { dokument: d.id, vorher: { ordner: d.ordner_id, register: d.register, titel: d.titel, datum: d.datum, stichworte: d.stichworte, beschreibung: d.beschreibung } });
        return json({ ok: true });
      }

      case "archiv_loeschen": {
        const { d, o } = await archivDokHolen(ich, p.id, "pflegen");
        if (d.status === "pruefung" && d.hochgeladen_von === ich.person_id && !o._eigen) {
          // Einreicher zieht seine noch nicht geprüfte Einreichung zurück → sofort weg
          await geloescht(ich, "archiv_einreichung", { dokument: d });
          await db.from("kc_club_archiv_dokumente").delete().eq("id", d.id);
          await dateienEntfernen([d.attachment_id]);
          await protokoll(ich.person_id, "archiv_einreichung_zurueckgezogen", { dokument: d.id, ordner: o.id });
          return json({ ok: true });
        }
        if (!o.besitzer) nurArchivPflege(ich);
        else if (!o._eigen) throw new Fehler("Das kann nur der Besitzer des Ordners.", 403);
        if (d.geloescht_am) return json({ ok: true });
        await geloescht(ich, "archiv_dokument", { dokument: d });
        await db.from("kc_club_archiv_dokumente").update({ geloescht_am: jetzt(), geloescht_von: ich.person_id }).eq("id", d.id);
        return json({ ok: true, papierkorbTage: PAPIERKORB_TAGE });
      }

      case "archiv_papierkorb": {
        // Vereinsordner: Clubsprecher/Admin · persönliche Ordner: nur der Besitzer
        const pflege = darfArchivPflegen(ich);
        const grenze = (t: string) => new Date(new Date(t).getTime() + PAPIERKORB_TAGE * 86400000).toISOString();
        const [{ data: or }, { data: dk }] = await Promise.all([
          db.from("kc_club_archiv_ordner").select("id,art,jahr,titel,nur_vorstand,besitzer,geloescht_am").not("geloescht_am", "is", null).order("geloescht_am", { ascending: false }),
          db.from("kc_club_archiv_dokumente").select("id,ordner_id,titel,datum,geloescht_am").not("geloescht_am", "is", null).order("geloescht_am", { ascending: false }),
        ]);
        const { data: alleOrdner } = await db.from("kc_club_archiv_ordner").select("id,titel,jahr,nur_vorstand,besitzer,geloescht_am");
        const om = new Map((alleOrdner ?? []).map((o: any) => [o.id, o]));
        const meins = (o: any) => o.besitzer ? o.besitzer === ich.person_id : pflege && darfOrdnerSehen(ich, o);
        return json({
          ordner: (or ?? []).filter(meins).map((o: any) => ({ ...o, titel: o.besitzer ? "👤 Mein Ordner" : o.titel, endgueltig_am: grenze(o.geloescht_am) })),
          dokumente: (dk ?? []).filter((d: any) => { const o: any = om.get(d.ordner_id); return o && meins(o) && !o.geloescht_am; })
            .map((d: any) => { const o: any = om.get(d.ordner_id); return { ...d, ordner: `${o.besitzer ? "👤 Mein Ordner" : o.titel} ${o.jahr}`, endgueltig_am: grenze(d.geloescht_am) }; }),
        });
      }

      case "archiv_wiederherstellen": {
        if (p.ordner) {
          const o = await archivOrdnerHolen(ich, p.ordner, true, "pflegen");
          await db.from("kc_club_archiv_ordner").update({ geloescht_am: null, geloescht_von: null }).eq("id", o.id);
          await protokoll(ich.person_id, "archiv_ordner_wiederhergestellt", { ordner: o.id });
        } else {
          const { d, o } = await archivDokHolen(ich, p.id, "pflegen");
          if (o.geloescht_am) throw new Fehler("Zuerst den Ordner wiederherstellen.", 409);
          await db.from("kc_club_archiv_dokumente").update({ geloescht_am: null, geloescht_von: null }).eq("id", d.id);
          await protokoll(ich.person_id, "archiv_wiederhergestellt", { dokument: d.id });
        }
        return json({ ok: true });
      }

      case "archiv_endgueltig": {
        // KC-CLUB-ARCHIV-ENDGUELTIG (1.19.0, Wunsch Hansi): aus dem Papierkorb sofort endgültig entfernen – macht den Speicher
        // (persönlich 50 MB) gleich frei statt nach 30 Tagen. Nur was schon im Papierkorb liegt; gleiche Rechte wie Wiederherstellen.
        // Kritische Aktion: Rückfrage in der App, Metadaten-Sicherung (geloescht), Protokoll. Die Datei selbst ist danach weg.
        if (p.ordner) {
          const o = await archivOrdnerHolen(ich, p.ordner, true, "pflegen");
          if (!o.geloescht_am) throw new Fehler("Der Ordner liegt nicht im Papierkorb – bitte zuerst löschen.", 409);
          const { data: dd } = await db.from("kc_club_archiv_dokumente").select("*").eq("ordner_id", o.id);
          await geloescht(ich, "archiv_ordner_endgueltig", { ordner: o, dokumente: dd ?? [] });
          if ((dd ?? []).length) await db.from("kc_club_archiv_dokumente").delete().eq("ordner_id", o.id);
          await dateienEntfernen((dd ?? []).map((d: any) => d.attachment_id));
          await db.from("kc_club_archiv_ordner").delete().eq("id", o.id);
          await protokoll(ich.person_id, "archiv_ordner_endgueltig", { ordner: o.id, dokumente: (dd ?? []).length });
          return json({ ok: true, dokumente: (dd ?? []).length });
        }
        const { d, o } = await archivDokHolen(ich, p.id, "pflegen");
        if (!d.geloescht_am) throw new Fehler("Das Dokument liegt nicht im Papierkorb – bitte zuerst löschen.", 409);
        await geloescht(ich, "archiv_dokument_endgueltig", { dokument: d });
        await db.from("kc_club_archiv_dokumente").delete().eq("id", d.id);
        await dateienEntfernen([d.attachment_id]);
        await protokoll(ich.person_id, "archiv_dokument_endgueltig", { dokument: d.id, ordner: o.id, groesse: d.groesse });
        return json({ ok: true });
      }

      // ----- Verbindung (KC-CLUB-VERBINDUNG) -----
      case "ping": {
        // Antwortzeit der Datenbank messen; optional Testdaten herunter- (groesse) bzw. hochladen (last)
        const t0 = Date.now();
        const wartung = await wartungLesen();
        const dbMs = Date.now() - t0;
        const groesse = Math.min(MAX_TESTDATEN, Math.max(0, Math.round(Number(p.groesse) || 0)));
        const last = typeof p.last === "string" ? p.last.length : 0;
        if (last > MAX_TESTDATEN * 1.1) throw new Fehler("Testdaten zu groß.");
        return json({ ok: true, server: SERVER_VERSION, zeit: jetzt(), dbMs, anmeldungMs, serverMs: Date.now() - t0Anfrage, instanz: INSTANZ, speicher: ANMELDUNG_TREFFER, wartung, empfangen: last, ...(groesse ? { daten: testDaten(groesse) } : {}) });
      }

      // Fehlersuche (KC-CLUB-EXTERN-DIAGNOSE): was beim Öffnen anderer Apps auf dem Handy passiert – nur technische Angaben, ins Änderungsprotokoll
      case "diagnose": {
        const d = (p.daten && typeof p.daten === "object") ? p.daten : {};
        const sauber: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(d).slice(0, 20)) sauber[txt(k, 30)] = typeof v === "number" || typeof v === "boolean" ? v : txt(v, 200);
        await protokoll(ich.person_id, "diagnose_" + (txt(p.art, 20).replace(/[^a-z_]/g, "") || "allg"), { ...sauber, ua: txt(req.headers.get("user-agent"), 200), version: txt(req.headers.get("x-club-version"), 20) });
        return json({ ok: true });
      }

      case "admin_lage": {
        nurAdmin(ich);
        const t0 = Date.now();
        const { data: dbBytes, error: dbFehler } = await db.rpc("kc_club_db_groesse");
        const dbMs = Date.now() - t0;
        const [{ data: health }, speicher, comm, leute, { data: zug }, { data: push }, { data: hb }, staende, wartung] = await Promise.all([
          db.from("kc_core_system_health").select("status,last_check_at,database_bytes,free_db_reference_bytes,warning_threshold_pct,critical_threshold_pct").limit(1).maybeSingle(),
          speicherStand(), communicatorStatus(ich, true), aktiveMitglieder(),
          db.from("kc_club_zugang").select("person_id,aktiv,zuletzt_gesehen,app_version").not("person_id", "like", "KC-P-TEST%"),
          db.from("kc_member_push_subscriptions").select("person_id").eq("active", true),
          db.from("kicc_program_heartbeats").select("program_id,received_at,version,status").in("program_id", ADMIN_PROGRAMME.map((x) => x.id)).order("received_at", { ascending: false }).limit(400),
          Promise.all(ADMIN_PROGRAMME.map((x) => (x.stand ? x.stand().catch(() => null) : Promise.resolve(null)))),
          wartungLesen(),
        ]);
        const spiegel = await adminSpiegel().catch((e) => { console.error("adminSpiegel", String(e)); return null; });
        const namen = new Map(leute.map((x) => [x.person_id, x.display_name])), aktivIds = new Set(leute.map((x) => x.person_id));
        const mz = (zug ?? []).filter((x: any) => x.aktiv && aktivIds.has(x.person_id));
        const alter = (x: any) => (x.zuletzt_gesehen ? Date.now() - new Date(x.zuletzt_gesehen).getTime() : Infinity);
        const pushIds = new Set((push ?? []).map((x: any) => x.person_id));
        return json({
          zeit: jetzt(), server: { version: SERVER_VERSION, dbMs, ok: !dbFehler },
          datenbank: { bytes: dbFehler ? null : Number(dbBytes), grenze: Number(health?.free_db_reference_bytes) || ADMIN_DB_GRENZE,
            warnPct: health?.warning_threshold_pct ?? 75, kritPct: health?.critical_threshold_pct ?? 90, check: health ? { status: health.status, zeit: health.last_check_at } : null },
          speicher, wartung, spiegel,
          communicator: { farbe: comm.farbe, text: comm.text, erreichbar: comm.erreichbar, push: comm.push.zustand, email: comm.email.zustand, club: comm.club, bericht: comm.bericht },
          mitglieder: {
            gesamt: leute.length, mitZugang: mz.length, ohneZugang: leute.length - mz.length, nieAngemeldet: mz.filter((x: any) => !x.zuletzt_gesehen).length,
            online: mz.filter((x: any) => alter(x) < ONLINE_SEK * 1000).length, heute: mz.filter((x: any) => alter(x) < 86400000).length, woche: mz.filter((x: any) => alter(x) < 7 * 86400000).length,
            pushAbos: leute.filter((x) => pushIds.has(x.person_id)).length, alteVersion: mz.filter((x: any) => x.zuletzt_gesehen && x.app_version && x.app_version !== SERVER_VERSION).length,
            zuletzt: mz.filter((x: any) => x.zuletzt_gesehen).sort((a: any, b: any) => alter(a) - alter(b)).slice(0, 8)
              .map((x: any) => ({ name: namen.get(x.person_id) ?? x.person_id, zuletzt: x.zuletzt_gesehen, version: x.app_version ?? null, online: alter(x) < ONLINE_SEK * 1000 })),
          },
          programme: ADMIN_PROGRAMME.map((x, i) => { const h = (hb ?? []).find((y: any) => y.program_id === x.id);
            return { id: x.id, name: x.name, letzte: h?.received_at ?? null, version: h?.version ?? null, status: h?.status ?? null, datenstand: staende[i] }; }),
        });
      }

      // KC-CLUB-ADMIN-SPIEGEL (0.49.0): Notfall – Spiegel sofort anstoßen (vorhandener Sparmodus-Ablauf, beachtet Neon-Wartung)
      case "admin_spiegeln": {
        nurAdmin(ich);
        const { data, error } = await db.rpc("kc_neon_low_compute_cycle");
        if (error) throw new Fehler("Spiegel konnte nicht angestoßen werden.", 500);
        await protokoll(ich.person_id, "admin_spiegel_notfall", { ergebnis: data });
        return json({ ok: true, ergebnis: data });
      }

      case "communicator_status": {
        return json(await communicatorStatus(ich, true));
      }

      case "wartung_setzen": {
        nurAdmin(ich);
        const an = !!p.an;
        const { error } = await db.from("kc_core_app_registry").update({ wartung: an, wartung_hinweis: an ? txt(p.hinweis, 200) || null : null, wartung_seit: an ? jetzt() : null, updated_at: jetzt() }).eq("app_id", APP_ID);
        if (error) throw new Fehler("Wartungsmodus konnte nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, an ? "wartung_an" : "wartung_aus", { hinweis: p.hinweis ?? null });
        return json({ ok: true, wartung: await wartungLesen() });
      }

      // ----- KC-CLUB-KACHELN: persönliche Einstellung speichern -----
      case "einstellung_setzen": {
        const schluessel = String(p.schluessel || "");
        const pruefen = EINSTELLUNGEN[schluessel];
        if (!pruefen) throw new Fehler("Unbekannte Einstellung.");
        const wert = pruefen(p.wert);
        const { error } = await db.from("kc_club_person_einstellung").upsert({ person_id: ich.person_id, schluessel, wert, geaendert_am: jetzt() }, { onConflict: "person_id,schluessel" });
        if (error) throw new Fehler("Einstellung konnte nicht gespeichert werden.", 500);
        return json({ ok: true, wert });
      }

      // ----- KC-CLUB-FEEDBACK -----
      case "feedback_meins": {
        const { data } = await db.from("kc_club_feedback").select("antworten,idee,mitteilung,anonym,geaendert_am").eq("person_id", ich.person_id).eq("fragebogen", FEEDBACK_BOGEN).maybeSingle();
        return json({ bogen: FEEDBACK_BOGEN, fragen: FEEDBACK_FRAGEN, umgesetzt: FEEDBACK_UMGESETZT, antwort: data ?? null });
      }
      case "feedback_senden": {
        const antworten = feedbackPruefen(p.antworten), idee = txt(p.idee, FB_TEXT_MAX), mitteilung = txt(p.mitteilung, FB_TEXT_MAX);
        if (!Object.keys(antworten).length && !idee && !mitteilung) throw new Fehler("Bitte beantworte mindestens eine Frage oder schreib etwas.");
        const { error } = await db.from("kc_club_feedback").upsert({ person_id: ich.person_id, fragebogen: FEEDBACK_BOGEN, antworten, idee: idee || null, mitteilung: mitteilung || null,
          anonym: !!p.anonym, geaendert_am: jetzt() }, { onConflict: "person_id,fragebogen" });
        if (error) throw new Fehler("Feedback konnte nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, "feedback_gesendet", { bogen: FEEDBACK_BOGEN, fragen: Object.keys(antworten).length, text: !!(idee || mitteilung) });
        return json({ ok: true });
      }
      // KC-CLUB-FEEDBACK-NEU (0.27.1), KC-CLUB-BEGRUESSUNG (0.28.0): alte Antworten löschen – vorher Kopie ins Archiv (Recovery-Punkt)
      case "feedback_neu": {
        const n = await feedbackArchivieren(ich, "neu_ausfuellen", ich.person_id);
        await protokoll(ich.person_id, "feedback_neu", { archiviert: n });
        return json({ ok: true, geloescht: n });
      }

      case "feedback_runde_neu": {
        nurAdmin(ich);
        const n = await feedbackArchivieren(ich, "neue_runde", null);
        await protokoll(ich.person_id, "feedback_runde_neu", { archiviert: n, bogen: FEEDBACK_BOGEN });
        return json({ ok: true, geloescht: n });
      }

      case "feedback_auswertung": {
        nurAdmin(ich);
        const [{ data }, mitglieder] = await Promise.all([
          db.from("kc_club_feedback").select("person_id,antworten,idee,mitteilung,anonym,geaendert_am").eq("fragebogen", FEEDBACK_BOGEN).not("person_id", "like", "KC-P-TEST%").order("geaendert_am", { ascending: false }),
          aktiveMitglieder(),
        ]);
        const liste = data ?? [], leute = await personen(liste.filter((r: any) => !r.anonym).map((r: any) => r.person_id));
        const fragen = FEEDBACK_FRAGEN.map((f) => {
          const n = new Map(f.optionen.map((o) => [o, 0])); let beantwortet = 0;
          for (const r of liste) { const v = (r as any).antworten?.[f.id]; const l = Array.isArray(v) ? v : v ? [v] : []; if (l.length) beantwortet++; for (const o of l) if (n.has(o)) n.set(o, n.get(o)! + 1); }
          return { id: f.id, t: f.t, art: f.art, beantwortet, ergebnis: f.optionen.map((o) => ({ option: o, anzahl: n.get(o) })) };
        });
        // Freitexte: Name nur, wenn nicht „anonym“ gewählt
        // Begründungen zu Fragen mit „Warum?“ (z. B. „Nein, werde sie nicht dauerhaft nutzen“) – ebenfalls ohne Namen, wenn anonym
        const gruende = FEEDBACK_FRAGEN.filter((f) => f.grund).map((f) => ({ id: f.id, t: f.t, liste: liste.filter((r: any) => r.antworten?.[`${f.id}_grund`])
          .map((r: any) => ({ wer: r.anonym ? null : leute.get(r.person_id)?.display_name ?? r.person_id, zeit: r.geaendert_am, antwort: r.antworten[f.id], text: r.antworten[`${f.id}_grund`] })) }));
        const texte = liste.filter((r: any) => r.idee || r.mitteilung).map((r: any) => ({ wer: r.anonym ? null : leute.get(r.person_id)?.display_name ?? r.person_id, zeit: r.geaendert_am, idee: r.idee, mitteilung: r.mitteilung }));
        return json({ bogen: FEEDBACK_BOGEN, antworten: liste.length, mitglieder: mitglieder.length, fragen, texte, gruende });
      }

      // ----- Push -----
      case "push_anmelden": {
        const sub = p.subscription;
        if (!sub?.endpoint || !/^https:\/\//.test(String(sub.endpoint)) || !sub?.keys?.p256dh || !sub?.keys?.auth) throw new Fehler("Push-Anmeldung unvollständig.");
        const { error } = await db.from("kc_member_push_subscriptions").upsert({
          person_id: ich.person_id, endpoint: String(sub.endpoint), subscription: sub, user_agent: txt(p.userAgent, 400), quelle: "kc-clubapp", active: true, updated_at: jetzt(),
        }, { onConflict: "endpoint" });
        if (error) throw new Fehler("Push konnte nicht gespeichert werden.", 500);
        await protokoll(ich.person_id, "push_angemeldet", {});
        return json({ ok: true });
      }
      // ----- KC-CLUB-GERAETE (0.98.0): welche Geräte bekommen meine Push-Meldungen? (nur eigene) -----
      case "geraete_liste": {
        const { data } = await db.from("kc_member_push_subscriptions").select("id,endpoint,user_agent,quelle,created_at,updated_at,last_success_at,last_error")
          .eq("person_id", ich.person_id).eq("active", true).order("updated_at", { ascending: false });
        const eigen = String(p.endpoint || "");
        return json({ geraete: (data ?? []).map((x: any) => ({ id: x.id, ua: txt(x.user_agent, 300), quelle: x.quelle, seit: x.created_at, zuletztAngemeldet: x.updated_at,
          zuletztZugestellt: x.last_success_at, fehler: txt(x.last_error, 160) || null, diesesGeraet: !!eigen && x.endpoint === eigen })) });
      }
      case "geraet_entfernen": {
        const { data } = await db.from("kc_member_push_subscriptions").update({ active: false, updated_at: jetzt() }).eq("person_id", ich.person_id).eq("id", String(p.id || "")).select("id");
        if (!data?.length) throw new Fehler("Gerät nicht gefunden.", 404);
        await protokoll(ich.person_id, "geraet_entfernt", {});
        return json({ ok: true });
      }
      case "push_abmelden": {
        await db.from("kc_member_push_subscriptions").update({ active: false, updated_at: jetzt() }).eq("person_id", ich.person_id).eq("endpoint", String(p.endpoint || ""));
        return json({ ok: true });
      }
      case "push_test": {
        // bewusst ohne persönliche Auswahl: Test soll immer als Push gehen
        const v = await routerSenden("club_nachricht_push", [ich.person_id], { titel: "🔔 Köcheclub Werne", kurz: `Hallo ${ich.vorname}, Push funktioniert!`, betreff: "Köcheclub Werne – Test", text: "Test", url: APP_URL }, `club-pushtest:${ich.person_id}:${Date.now()}`);
        return json({ ok: v.gesendet > 0, versand: v });
      }

      // ----- Admin -----
      case "link_erzeugen": {
        nurAdmin(ich);
        const pid = String(p.person_id || "");
        const { data: pe } = await db.from("kc_core_people").select("person_id,active").eq("person_id", pid).maybeSingle();
        if (!pe?.active) throw new Fehler("Mitglied nicht gefunden.", 404);
        const token = zufall();
        await db.from("kc_club_zugang").upsert({ person_id: pid, token_hash: await sha256(token), aktiv: true, erstellt_am: jetzt(), erstellt_von: ich.person_id }); anmeldungenVergessen(); // KC-CLUB-ANMELDECACHE: Änderung sofort wirksam
        await protokoll(ich.person_id, "link_erzeugt", { fuer: pid });
        return json({ ok: true, link: `${APP_URL}?k=${token}` });
      }
      // KC-CLUB-BUERO-RECHTE (1.37.0): Admin legt fest, wer das Büro sieht (lesen) oder darin arbeitet (schreiben)
      case "buero_rechte": {
        nurAdmin(ich);
        const [mg, { data: ro }] = await Promise.all([aktiveMitglieder(), db.from("kc_club_rollen").select("person_id,ist_admin,ist_vorstand,aemter,buero_recht")]);
        const rm = new Map((ro ?? []).map((x: any) => [x.person_id, x]));
        return json({ mitglieder: mg.map((m: any) => { const x: any = rm.get(m.person_id);
          return { person_id: m.person_id, name: m.display_name, admin: !!x?.ist_admin, leitung: !!(x?.ist_vorstand || x?.ist_admin), aemter: x?.aemter ?? [],
            recht: x?.ist_admin ? "schreiben" : (BUERO_RECHTE as readonly string[]).includes(x?.buero_recht) ? x.buero_recht : null }; })
          .sort((a: any, b: any) => a.name.localeCompare(b.name, "de")) });
      }
      case "buero_rechte_setzen": {
        nurAdmin(ich);
        const recht = p.recht === null || p.recht === "keins" ? null : String(p.recht);
        if (recht !== null && !(BUERO_RECHTE as readonly string[]).includes(recht)) throw new Fehler("Bitte „nur lesen“, „lesen & schreiben“ oder „kein Zugang“ wählen.");
        const ids = [...new Set((Array.isArray(p.personen) ? p.personen : []).map((x: unknown) => String(x)))].slice(0, 100);
        if (!ids.length) throw new Fehler("Bitte mindestens ein Mitglied auswählen.");
        const gueltig = new Set((await aktiveMitglieder()).map((m: any) => m.person_id));
        const { data: ro } = await db.from("kc_club_rollen").select("person_id,ist_admin").in("person_id", ids);
        const admins = new Set((ro ?? []).filter((x: any) => x.ist_admin).map((x: any) => x.person_id));
        const ziel = ids.filter((id) => gueltig.has(id) && !admins.has(id)); // Admin hat immer vollen Zugang
        if (!ziel.length) throw new Fehler("Für diese Auswahl ist nichts zu ändern (der Admin hat immer vollen Zugang).");
        const vorhanden = new Set((ro ?? []).map((x: any) => x.person_id));
        const neu = ziel.filter((id) => !vorhanden.has(id)), alt = ziel.filter((id) => vorhanden.has(id));
        if (alt.length) { const { error } = await db.from("kc_club_rollen").update({ buero_recht: recht, geaendert_am: jetzt() }).in("person_id", alt); if (error) throw error; }
        if (neu.length) { const { error } = await db.from("kc_club_rollen").insert(neu.map((person_id) => ({ person_id, buero_recht: recht, geaendert_am: jetzt() }))); if (error) throw error; }
        anmeldungenVergessen(); // sofort wirksam
        await protokoll(ich.person_id, "buero_rechte_gesetzt", { recht: recht ?? "keins", fuer: ziel });
        return json({ ok: true, geaendert: ziel.length });
      }

      case "rolle_setzen": {
        nurAdmin(ich);
        const pid = String(p.person_id || "");
        const aemter = (Array.isArray(p.aemter) ? p.aemter : []).map((x: unknown) => txt(x, 40)).filter(Boolean).slice(0, 5);
        await db.from("kc_club_rollen").upsert({ person_id: pid, ist_vorstand: !!p.vorstand, ...(pid === ich.person_id ? {} : { ist_admin: !!p.admin }), aemter,
          ...(typeof p.protokolle === "boolean" ? { protokolle_lesen: p.protokolle } : {}), ...(typeof p.kontakte === "boolean" ? { kontakte_sehen: p.kontakte } : {}), geaendert_am: jetzt() });
        anmeldungenVergessen(); // KC-CLUB-ANMELDECACHE: neue Rolle sofort wirksam
        await protokoll(ich.person_id, "rolle_gesetzt", { fuer: pid, vorstand: !!p.vorstand, aemter, protokolle: p.protokolle ?? null });
        return json({ ok: true });
      }

      // KC-CLUB-NOTBETRIEB-STUFE2 (1.54.0): die App ist zurück aus dem Notbetrieb → Eingang sofort nachtragen (nicht erst
      // beim nächsten Zeitplaner-Lauf) und dem Mitglied sagen, was aus seinen Einträgen geworden ist
      case "notbetrieb_nachtragen": {
        const lauf = await notEingangLauf().catch((e) => ({ ok: false, fehler: txt(String(e?.message || e), 200) }));
        const ids = (Array.isArray(p.notIds) ? p.notIds : []).map((x: unknown) => txt(x, 64)).filter(Boolean).slice(0, 100);
        const { data: meine } = ids.length ? await db.from("kc_club_notbetrieb_eingang").select("not_id,aktion,status,ergebnis").eq("person_id", ich.person_id).in("not_id", ids) : { data: [] as any[] };
        return json({ ok: true, lauf: { ok: !!(lauf as any).ok }, eintraege: (meine ?? []).filter((x: any) => x.status !== "offen").map((x: any) => ({ notId: x.not_id, aktion: x.aktion, status: x.status, grund: x.status === "abgelehnt" ? x.ergebnis : null })) });
      }

      // KC-CLUB-NOTBETRIEB (1.52.0): Stand des Notfall-Pakets + öffentlicher Prüfschlüssel für den Ersatz-Server (Admin)
      case "notbetrieb_info": {
        nurAdmin(ich);
        const st = await notStand();
        return json({ eingerichtet: !!st.url, url: st.url, hochgeladen_am: st.hochgeladen_am, groesse: st.groesse, mitglieder: st.mitglieder, fehler: st.fehler,
          pruefschluessel: (await notSchluessel()).oeffentlich });
      }

      default: return json({ error: "Unbekannte Aktion" }, 400);
    }
}

// ---------- KC-CLUB-NOTBETRIEB (1.52.0): Notfall-Paket für den Ersatz-Server (Cloudflare) ----------
// Fällt Supabase aus, schaltet die App auf den Ersatz-Server um. Der rechnet NICHTS selbst: Er gibt jedem Mitglied die
// Antworten zurück, die dieser Server vorher genau für dieses Mitglied berechnet hat (gleiche Rechte, eine Regel).
// Nur lesende Aktionen; ich.nurLesen verhindert Schreiben (gelesen-Markierungen, Protokoll). Gebaut wird nur, wenn sich
// seit dem letzten Paket etwas geändert hat (Fingerabdruck in der Datenbank) – sonst nur „Stand ist aktuell“ melden.
// Signiert (Ed25519): der private Schlüssel bleibt hier, der Ersatz-Server prüft nur mit dem öffentlichen.
const NOT_AKTIONEN: [string, Record<string, unknown>][] = [["init", {}], ["mitglieder", {}], ["treffen_liste", {}], ["sos_kontakte", {}], ["pinnwand", {}],
  ["unterhaltungen", {}], ["todo_liste", {}]];
const NOT_CHATS = 12, NOT_DIENST_TAGE = 45;
async function notStand(): Promise<any> {
  const { data } = await db.from("kc_club_notbetrieb").select("*").eq("id", 1).maybeSingle();
  return data ?? {};
}
async function notSchluessel(): Promise<{ privat: CryptoKey; oeffentlich: JsonWebKey }> {
  const st = await notStand();
  if (st.privat && st.oeffentlich) return { privat: await crypto.subtle.importKey("jwk", st.privat, { name: "Ed25519" }, false, ["sign"]), oeffentlich: st.oeffentlich };
  const paar = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as CryptoKeyPair;
  const privat = await crypto.subtle.exportKey("jwk", paar.privateKey), oeffentlich = await crypto.subtle.exportKey("jwk", paar.publicKey);
  await db.from("kc_club_notbetrieb").upsert({ id: 1, privat, oeffentlich, geaendert_am: jetzt() });
  return { privat: paar.privateKey, oeffentlich };
}
const b64 = (u: Uint8Array) => { let x = ""; for (let i = 0; i < u.length; i += 0x8000) x += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(x); };
async function gzip(text: string): Promise<Uint8Array> {
  const s = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
async function notpaketBauen() {
  const { data: zug } = await db.from("kc_club_zugang").select("person_id,token_hash").eq("aktiv", true).not("token_hash", "is", null).not("person_id", "like", "KC-P-TEST%");
  const ids = (zug ?? []).map((z: any) => z.person_id);
  const [{ data: pe }, { data: ro }] = await Promise.all([
    db.from("kc_core_people").select("person_id,display_name,given_name,preferred_name,active").in("person_id", ids),
    db.from("kc_club_rollen").select("*").in("person_id", ids),
  ]);
  const pm = new Map<string, any>((pe ?? []).map((x: any) => [x.person_id, x])), rm = new Map<string, any>((ro ?? []).map((x: any) => [x.person_id, x]));
  const heute = berlinTag(new Date()), bis = tagDazu(heute, NOT_DIENST_TAGE), anfrage = new Request(APP_URL, { method: "POST" });
  const mitglieder: Record<string, unknown> = {};
  const holen = async (ich: Ich, a: string, prm: Record<string, unknown>) => {
    try { const r = await aktionAusfuehren(a, prm, ich, anfrage, 0, 0); return r.ok ? await r.json() : null; } catch { return null; }
  };
  for (const z of zug ?? []) {
    const p0 = pm.get(z.person_id); if (!p0?.active) continue;
    const ich: Ich = { ...ichAus(p0, rm.get(z.person_id) ?? null), nurLesen: true };
    const antworten: Record<string, unknown> = {};
    for (const [a, prm] of NOT_AKTIONEN) { const j = await holen(ich, a, prm); if (j) antworten[a] = j; }
    const d = await holen(ich, "dienste", { von: heute, bis, personen: [] }); if (d) antworten.dienste = d;
    const chats = ((antworten.unterhaltungen as any)?.unterhaltungen ?? []).slice(0, NOT_CHATS);
    for (const c of chats) { const j = await holen(ich, "unterhaltung", { id: c.id }); if (j) antworten["unterhaltung:" + c.id] = j; }
    mitglieder[z.token_hash] = { person_id: z.person_id, antworten };
  }
  return { mitglieder, anzahl: Object.keys(mitglieder).length };
}
// ---------- KC-CLUB-NOTBETRIEB-STUFE2 (1.54.0): im Notbetrieb Geschriebenes nachtragen ----------
// Der Ersatz-Server hat Nachricht/Zu-/Absage/Status/Pinnwand-Zettel nur in seinen Eingang gelegt. Hier wird jeder Eintrag
// genau einmal (Merkzettel kc_club_notbetrieb_eingang, Schlüssel des Ersatz-Servers) über die NORMALE Aktion nachgetragen –
// gleiche Prüfungen und Rechte, Push/Mail wie sonst. Was nicht mehr passt (z. B. Treffen inzwischen abgesagt), wird nicht still
// verworfen: Ergebnis „abgelehnt“ mit Grund → Tagesinfo des Admins und Rückmeldung an das Mitglied.
// Erst danach wird der Eintrag beim Ersatz-Server gelöscht (quittiert). Technische Fehler → beim nächsten Lauf erneut.
const NOT_NACHTRAG = new Set(["nachricht_senden", "treffen_antwort", "status_setzen", "pinnwand_anheften"]);
const NOT_UHR = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
async function notSigniert(pfad: string, inhalt: Record<string, unknown>) {
  const st = await notStand(), { privat } = await notSchluessel();
  const roh = new TextEncoder().encode(JSON.stringify({ ...inhalt, zeit: jetzt() }));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, privat, roh as BufferSource));
  const r = await fetch(String(st.url).replace(/\/+$/, "") + pfad, { method: "POST", headers: { "content-type": "application/json", "x-kc-signatur": b64(sig) }, body: roh as unknown as BodyInit });
  if (!r.ok) throw new Error(`Ersatz-Server antwortet ${r.status}`);
  return await r.json();
}
async function notEingangLauf() {
  const st = await notStand();
  if (!st.url) return { ok: true, aus: "Ersatz-Server noch nicht eingerichtet" };
  // nicht zweimal gleichzeitig (Zeitplaner + zurückkehrende Apps): Lauf-Marke, höchstens alle 30 s
  const { data: frei } = await db.from("kc_club_notbetrieb").update({ nachtrag_am: jetzt() }).eq("id", 1)
    .or(`nachtrag_am.is.null,nachtrag_am.lt.${new Date(Date.now() - 30000).toISOString()}`).select("id");
  if (!(frei ?? []).length) return { ok: true, laeuft_schon: true };
  const { eintraege = [] } = await notSigniert("/eingang/abholen", { zweck: "abholen" });
  if (!eintraege.length) return { ok: true, anzahl: 0 };
  const fertig: string[] = [], z = { erledigt: 0, abgelehnt: 0, fehler: 0 };
  const merken = (schluessel: string, status: string, ergebnis: string | null, person_id: string | null) =>
    db.from("kc_club_notbetrieb_eingang").update({ status, ergebnis, ...(person_id ? { person_id } : {}), nachgetragen_am: jetzt() }).eq("schluessel", schluessel);
  for (const e of [...eintraege].sort((a: any, b: any) => String(a.zeit).localeCompare(String(b.zeit)))) {
    const schluessel = txt(e.schluessel, 120);
    if (!schluessel.startsWith("e:")) continue;
    const { data: neu } = await db.from("kc_club_notbetrieb_eingang").upsert({ schluessel, not_id: txt(e.notId, 64) || schluessel, aktion: txt(e.aktion, 40), daten: e.daten ?? {}, geschrieben_am: e.zeit ?? null },
      { onConflict: "schluessel", ignoreDuplicates: true }).select("schluessel");
    if (!(neu ?? []).length) {
      // schon bekannt: fertig → nur noch quittieren; hängengeblieben (> 10 Min. „offen“) → nicht blind wiederholen, sondern melden
      const { data: alt } = await db.from("kc_club_notbetrieb_eingang").select("status,angenommen_am").eq("schluessel", schluessel).maybeSingle();
      if (alt && alt.status !== "offen") fertig.push(schluessel);
      else if (alt && Date.now() - Date.parse(alt.angenommen_am) > 600000) {
        await merken(schluessel, "abgelehnt", "Nachtragen wurde unterbrochen – bitte prüfen, ob es angekommen ist.", null); z.abgelehnt++; fertig.push(schluessel);
      }
      continue;
    }
    const ablehnen = async (grund: string, pid: string | null = null) => { await merken(schluessel, "abgelehnt", grund, pid); z.abgelehnt++; fertig.push(schluessel); };
    if (!NOT_NACHTRAG.has(e.aktion)) { await ablehnen("Im Notbetrieb nicht vorgesehen."); continue; }
    const { data: zg } = await db.from("kc_club_zugang").select("person_id").eq("token_hash", String(e.hash || "")).eq("aktiv", true).maybeSingle();
    if (!zg) { await ablehnen("Der persönliche Link gilt nicht mehr."); continue; }
    const [{ data: pe }, { data: ro }] = await Promise.all([
      db.from("kc_core_people").select("person_id,display_name,given_name,preferred_name,active").eq("person_id", zg.person_id).maybeSingle(),
      db.from("kc_club_rollen").select("*").eq("person_id", zg.person_id).maybeSingle(),
    ]);
    if (!pe?.active) { await ablehnen("Mitglied nicht mehr aktiv.", zg.person_id); continue; }
    const ich = ichAus(pe, ro ?? null), daten: any = { ...(e.daten ?? {}) };
    // im Chat erkennbar: wann es wirklich geschrieben wurde (die Nachricht erscheint erst jetzt)
    if (e.aktion === "nachricht_senden" && daten.text) daten.text = `${daten.text}\n\n🟠 im Notbetrieb geschrieben um ${NOT_UHR.format(new Date(e.zeit || Date.now()))} Uhr`;
    try {
      const r = await aktionAusfuehren(e.aktion, daten, ich, new Request(APP_URL, { method: "POST" }), Date.now(), 0);
      if (r.ok) { await merken(schluessel, "erledigt", null, zg.person_id); z.erledigt++; fertig.push(schluessel); }
      else { const j: any = await r.json().catch(() => ({})); await ablehnen(txt(j?.error, 200) || `Abgelehnt (${r.status}).`, zg.person_id); }
    } catch (x) {
      if (x instanceof Fehler) { await ablehnen(x.message, zg.person_id); continue; }
      // technischer Fehler: Merkzettel wieder weg → beim nächsten Lauf neu versuchen (Ersatz-Server behält den Eintrag)
      await db.from("kc_club_notbetrieb_eingang").delete().eq("schluessel", schluessel).eq("status", "offen"); z.fehler++;
      console.error("notbetrieb nachtrag", e.aktion, String(x));
    }
  }
  for (let i = 0; i < fertig.length; i += 400) await notSigniert("/eingang/quittieren", { zweck: "quittieren", schluessel: fertig.slice(i, i + 400) });
  const bericht = { am: jetzt(), anzahl: eintraege.length, ...z };
  await db.from("kc_club_notbetrieb").update({ nachtrag: bericht }).eq("id", 1);
  await protokoll(null, "notbetrieb_nachgetragen", bericht);
  return { ok: true, ...bericht };
}
async function notpaketLauf(erzwingen: boolean) {
  await notSchluessel(); // Schlüsselpaar gleich anlegen – den öffentlichen Teil braucht der Ersatz-Server schon beim Einrichten
  const st = await notStand();
  if (!st.url) return { ok: true, aus: "Ersatz-Server noch nicht eingerichtet" };
  const { data: fp } = await db.rpc("kc_club_notpaket_fingerabdruck");
  const ziel = String(st.url).replace(/\/+$/, "");
  const { privat } = await notSchluessel();
  const senden = async (pfad: string, roh: Uint8Array, art: string) => {
    const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, privat, roh as BufferSource));
    const r = await fetch(ziel + pfad, { method: "POST", headers: { "content-type": art, "x-kc-signatur": b64(sig) }, body: roh as unknown as BodyInit });
    if (!r.ok) throw new Error(`Ersatz-Server antwortet ${r.status}`);
  };
  try {
    const erstellt = jetzt();
    if (!erzwingen && fp && st.fingerabdruck === fp) {
      // nichts geändert: nur „Stand ist aktuell bis jetzt“ melden (klein, signiert)
      await senden("/stand", new TextEncoder().encode(JSON.stringify({ stand: erstellt, fingerabdruck: fp })), "application/json");
      await db.from("kc_club_notbetrieb").update({ bestaetigt_am: erstellt, fehler: null }).eq("id", 1);
      return { ok: true, unveraendert: true };
    }
    const t0 = Date.now(), paket = await notpaketBauen();
    const roh = await gzip(JSON.stringify({ format: 1, erstellt, stand: erstellt, fingerabdruck: fp, server: SERVER_VERSION, mitglieder: paket.mitglieder }));
    await senden("/paket", roh, "application/gzip");
    await db.from("kc_club_notbetrieb").update({ fingerabdruck: fp, hochgeladen_am: erstellt, bestaetigt_am: erstellt, groesse: roh.length, mitglieder: paket.anzahl, dauer_ms: Date.now() - t0, fehler: null }).eq("id", 1);
    return { ok: true, mitglieder: paket.anzahl, groesse: roh.length, ms: Date.now() - t0 };
  } catch (e) {
    const fehler = txt(e instanceof Error ? e.message : String(e), 300);
    await db.from("kc_club_notbetrieb").update({ fehler, fehler_am: jetzt() }).eq("id", 1);
    return { ok: false, fehler };
  }
}
