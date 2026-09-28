// KC Club-App (Köcheclub Werne) – Server (Edge Function kc-club), ab App-Version 0.1.0
// Zugang: persönlicher Link ?k=<token> → Kopfzeile x-club-token (nur SHA-256 in kc_club_zugang gespeichert).
// Zeitplaner (pg_cron): action "wartung" mit cronSecret aus dem Vault (kc_club_cron_secret) → Erinnerungen am Vortag.
// Nutzt vorhandene Kerne: kc_core_people, kc_communication_threads/_thread_participants/_messages,
// kc_communication_attachments (+ Bucket), kc_member_push_subscriptions, KC Communicator Router (Push/Mail über web.de).
// Features: KC-CLUB-STATUS, KC-CLUB-ZUGANG, KC-CLUB-TREFFEN, KC-CLUB-NACHRICHTEN, KC-CLUB-ANLAGEN, KC-CLUB-PUSH, KC-CLUB-ADMIN,
//           KC-CLUB-VORSCHLAG (0.2.0), KC-CLUB-OHNEAPP (0.2.0), KC-CLUB-DIENSTE (0.2.0),
//           KC-CLUB-BENACHRICHTIGUNG (0.3.0), KC-CLUB-DIENSTERINNERUNG (0.3.0)
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPA = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPA, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const SERVER_VERSION = "0.3.0";
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
  const { data } = await db.from("kc_core_people").select("person_id,display_name,given_name,preferred_name,email")
    .eq("active", true).eq("org_id", ORG).not("person_id", "like", "KC-P-TEST%").order("display_name");
  return (data ?? []) as Person[];
}
async function protokoll(person: string | null, aktion: string, details: Record<string, unknown> = {}) {
  await db.from("kc_club_protokoll").insert({ person_id: person, aktion, details });
}

// Versand über den KC Communicator (Push, sonst/zusätzlich Mail über web.de).
async function routerSenden(eventKey: string, personIds: string[], vars: Record<string, unknown>, korrelation: string) {
  const r = await fetch(`${SUPA}/functions/v1/kc-communication-router`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE}`, apikey: SERVICE },
    body: JSON.stringify({ sourceProgram: "kc-club", eventKey, recipients: personIds.map((personId) => ({ personId })), variables: vars, correlationId: korrelation }),
  });
  const out = await r.json().catch(() => ({}));
  return { gesendet: Number(out?.sent || 0), fehler: Number(out?.failed || 0) };
}
// KC-CLUB-BENACHRICHTIGUNG: Ereignis → Bereich, den das Mitglied in den Einstellungen steuert
const BEREICH_VON: Record<string, string> = { club_treffen: "termine", club_erinnerung: "termine", club_nachricht: "nachrichten", club_vorschlag: "vorschlaege", club_dienst: "dienste" };
const BEREICHE = ["termine", "nachrichten", "vorschlaege", "dienste"];
// Anzeige-Standard, solange nichts gespeichert ist (Server nutzt dann die bisherige Standardregel)
const STANDARD_WAHL: Record<string, { push: boolean; email: boolean }> = { termine: { push: true, email: true }, nachrichten: { push: true, email: false }, vorschlaege: { push: true, email: false }, dienste: { push: false, email: false } };
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
  // Gruppen je Regel; Mitglieder ohne App getrennt (sie bekommen den Hinweis auf den Link)
  const gruppen = new Map<string, { key: string; ohne: boolean; ids: string[] }>();
  for (const id of personIds) {
    const ohne = !mitApp.has(id);
    let key: string | null;
    if (ohne) key = eventKey + "_mail";
    else {
      const x: any = w.get(id);
      key = !x ? eventKey : x.push && x.email ? eventKey + "_beide" : x.push ? eventKey + "_push" : x.email ? eventKey + "_mail" : null;
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
  return { gesendet, fehler };
}

// ---------- Anmeldung ----------
type Ich = { person_id: string; name: string; vorname: string; admin: boolean; vorstand: boolean; aemter: string[] };
async function anmelden(req: Request): Promise<Ich> {
  const token = req.headers.get("x-club-token") ?? "";
  if (!/^[0-9a-f]{32,96}$/.test(token)) throw new Fehler("Kein Zugang – bitte den persönlichen Link neu öffnen.", 401);
  const { data: z } = await db.from("kc_club_zugang").select("person_id,aktiv").eq("token_hash", await sha256(token)).maybeSingle();
  if (!z?.aktiv) throw new Fehler("Kein Zugang – bitte den persönlichen Link neu öffnen.", 401);
  const [{ data: p }, { data: r }] = await Promise.all([
    db.from("kc_core_people").select("person_id,display_name,given_name,preferred_name,active").eq("person_id", z.person_id).maybeSingle(),
    db.from("kc_club_rollen").select("*").eq("person_id", z.person_id).maybeSingle(),
  ]);
  if (!p?.active) throw new Fehler("Kein Zugang – bitte bei Hansi melden.", 401);
  db.from("kc_club_zugang").update({ zuletzt_gesehen: jetzt(), app_version: txt(req.headers.get("x-club-version"), 20) || null }).eq("person_id", z.person_id).then(() => {});
  return { person_id: p.person_id, name: p.display_name, vorname: vorname(p), admin: !!r?.ist_admin, vorstand: !!(r?.ist_vorstand || r?.ist_admin), aemter: r?.aemter ?? [] };
}
const nurVorstand = (ich: Ich) => { if (!ich.vorstand) throw new Fehler("Das dürfen nur Vorstand und Admin.", 403); };
const nurAdmin = (ich: Ich) => { if (!ich.admin) throw new Fehler("Das darf nur der Admin.", 403); };

// ---------- Eigener Status ----------
const STATUS = ["verfuegbar", "beschaeftigt", "urlaub", "krank", "abwesend"];
async function statusMap(ids?: string[]) {
  let q = db.from("kc_club_status").select("person_id,status,hinweis,bis,geaendert_am");
  if (ids) q = q.in("person_id", ids);
  const { data } = await q;
  const heute = berlinTag(new Date());
  // abgelaufener Status („bis“ vorbei) gilt wieder als verfügbar
  return new Map((data ?? []).map((x: any) => [x.person_id, x.bis && x.bis < heute ? { status: "verfuegbar", hinweis: null, bis: null } : { status: x.status, hinweis: x.hinweis, bis: x.bis }]));
}

// ---------- Treffen ----------
async function treffenListe(ich: Ich, nurNaechstes = false) {
  let q = db.from("kc_club_treffen").select("*").order("beginn");
  q = nurNaechstes ? q.gte("beginn", new Date(Date.now() - 3 * 3600000).toISOString()).eq("status", "geplant").limit(1)
    : q.gte("beginn", new Date(Date.now() - 30 * 86400000).toISOString()).limit(60);
  const { data: treffen } = await q;
  const ids = (treffen ?? []).map((t: any) => t.id);
  const { data: teil } = ids.length ? await db.from("kc_club_teilnahme").select("*").in("treffen_id", ids) : { data: [] as any[] };
  const leute = await personen([...(teil ?? []).map((x: any) => x.person_id), ...(treffen ?? []).map((t: any) => t.gastgeber_person_id)]);
  return (treffen ?? []).map((t: any) => {
    const tn = (teil ?? []).filter((x: any) => x.treffen_id === t.id)
      .map((x: any) => ({ person_id: x.person_id, name: leute.get(x.person_id)?.display_name || x.person_id, antwort: x.antwort, notiz: x.notiz }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
    const zahl = (a: string) => tn.filter((x: any) => x.antwort === a).length;
    return {
      id: t.id, titel: t.titel, beginn: t.beginn, ende: t.ende, ort: t.ort, beschreibung: t.beschreibung, status: t.status,
      gastgeber: t.gastgeber_person_id ? { person_id: t.gastgeber_person_id, name: leute.get(t.gastgeber_person_id)?.display_name } : null,
      teilnahme: tn, ja: zahl("ja"), nein: zahl("nein"), vielleicht: zahl("vielleicht"),
      meine: tn.find((x: any) => x.person_id === ich.person_id)?.antwort ?? null,
    };
  });
}
function treffenText(t: any, gastgeber: string, anlass: "neu" | "geaendert" | "abgesagt") {
  const ort = t.ort || (gastgeber ? `bei ${gastgeber}` : "");
  const kopf = anlass === "abgesagt" ? "das Köcheclub-Treffen fällt leider aus:" : anlass === "geaendert" ? "das Köcheclub-Treffen hat sich geändert:" : "hiermit lade ich dich herzlich zum Köcheclub-Treffen ein:";
  return {
    betreff: `Köcheclub Werne – ${anlass === "abgesagt" ? "abgesagt: " : anlass === "geaendert" ? "geändert: " : ""}${t.titel}, ${wann(t.beginn)}`,
    titel: anlass === "abgesagt" ? "❌ Treffen abgesagt" : "📅 " + t.titel,
    kurz: `${wann(t.beginn)}${ort ? " – " + ort : ""}${anlass === "abgesagt" ? " fällt aus." : ". Bitte in der App zu- oder absagen."}`,
    text: ["Hallo,", "", kopf, "", `📅 ${wann(t.beginn, true)}`, ort ? `📍 ${ort}` : "", t.beschreibung ? "\n" + t.beschreibung : "", "",
      anlass === "abgesagt" ? "" : `Bitte sag in der Köcheclub-App zu oder ab: ${APP_URL}#termine`, "", "Viele Grüße", "Köcheclub Werne"]
      .filter((z, i, a) => !(z === "" && a[i - 1] === "")).join("\n"),
    url: APP_URL + "#termine",
  };
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
    const optionen = v.art === "thema" ? ["dafuer"] : v.optionen;
    // geheim: Ergebnis erst nach Abschluss und nie mit Namen
    const ergebnis = !v.geheim || v.status !== "offen" ? optionen.map((o: string) => ({
      option: o,
      anzahl: v.geheim ? (geh ?? []).filter((g: any) => g.vorschlag_id === v.id && g.wahl === o).length : s.filter((x: any) => x.wahl === o).length,
      ...(v.geheim ? {} : { namen: s.filter((x: any) => x.wahl === o).map((x: any) => leute.get(x.person_id)?.display_name || x.person_id).sort() }),
    })) : null;
    const eigener = v.erstellt_von === ich.person_id;
    const t: any = v.treffen_id ? treffen.get(v.treffen_id) : null;
    return {
      id: v.id, art: v.art, titel: v.titel, beschreibung: v.beschreibung, optionen: v.art === "thema" ? [] : v.optionen, geheim: v.geheim,
      status: v.status, frist: v.frist, erstellt_am: v.erstellt_am, abgeschlossen_am: v.abgeschlossen_am,
      von: { person_id: v.erstellt_von, name: leute.get(v.erstellt_von)?.display_name || v.erstellt_von },
      treffen: t ? { id: t.id, titel: t.titel, beginn: t.beginn } : null,
      abgestimmt: !!mein, meine: v.geheim ? null : mein?.wahl ?? null, stimmen: s.length, berechtigt, ergebnis,
      darfAbschliessen: v.status === "offen" && (ich.vorstand || (eigener && v.art === "thema")),
      darfZurueckziehen: v.status === "offen" && (ich.vorstand || eigener),
    };
  });
}
async function vorschlagAbschliessen(v: any, von: string | null) {
  const { data: ok } = await db.from("kc_club_vorschlaege").update({ status: "abgeschlossen", abgeschlossen_am: jetzt(), abgeschlossen_von: von })
    .eq("id", v.id).eq("status", "offen").select("id");
  if (!ok?.length) return null;
  if (v.art !== "abstimmung") return { gesendet: 0 };
  const { data: s } = await db.from(v.geheim ? "kc_club_geheime_stimmen" : "kc_club_stimmen").select("wahl").eq("vorschlag_id", v.id);
  const zaehl = new Map<string, number>();
  (s ?? []).forEach((x: any) => x.wahl && zaehl.set(x.wahl, (zaehl.get(x.wahl) ?? 0) + 1));
  const erg = v.optionen.map((o: string) => `${o}: ${zaehl.get(o) ?? 0}`).join(" · ");
  const ziel = (await aktiveMitglieder()).map((x) => x.person_id);
  return await senden("club_vorschlag", ziel, {
    titel: "🗳️ Ergebnis: " + v.titel, kurz: erg,
    betreff: `Köcheclub Werne – Ergebnis der Abstimmung: ${v.titel}`,
    text: `Hallo,\n\ndie Abstimmung „${v.titel}“ ist beendet.\n\nErgebnis: ${erg}\n\nDetails in der Köcheclub-App: ${APP_URL}#vorschlaege\n\nViele Grüße\nKöcheclub Werne`,
    url: APP_URL + "#vorschlaege",
  }, `club-ergebnis:${v.id}`);
}

// ---------- Nachrichten ----------
async function binTeilnehmer(threadId: string, person: string) {
  const { data } = await db.from("kc_communication_thread_participants").select("thread_id").eq("thread_id", threadId).eq("person_id", person).maybeSingle();
  if (!data) throw new Fehler("Unterhaltung nicht gefunden.", 404);
}
async function empfaengerAufloesen(ich: Ich, e: any): Promise<string[]> {
  const ids = new Set<string>((Array.isArray(e?.personen) ? e.personen : []).map(String));
  if (e?.alle) { nurVorstand(ich); (await aktiveMitglieder()).forEach((p) => ids.add(p.person_id)); }
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

// ---------- Hauptprogramm ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST erwartet" }, 405);
  let p: any; try { p = await req.json(); } catch { return json({ error: "Ungültige Anfrage" }, 400); }
  const a = String(p?.action || "");
  try {
    // ----- Zeitplaner: Erinnerung am Vortag (ab 9 Uhr) an alle, die nicht abgesagt haben -----
    if (a === "wartung") {
      const { data: geheim } = await db.rpc("kc_communication_get_server_secret", { p_name: "kc_club_cron_secret" });
      if (!geheim || p.cronSecret !== geheim) return json({ error: "Kein Zugang" }, 401);
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
      const { data: ts } = await db.from("kc_club_treffen").select("*").eq("status", "geplant").is("erinnerung_gesendet_am", null)
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
      return json({ ok: true, erinnerungen: n, beendet, dienst });
    }

    const ich = await anmelden(req);

    switch (a) {
      case "init": {
        const [naechstes, { data: teil }, mitglieder] = await Promise.all([
          treffenListe(ich, true),
          db.from("kc_communication_thread_participants").select("thread_id,last_read_at").eq("person_id", ich.person_id).is("hidden_at", null),
          aktiveMitglieder(),
        ]);
        let ungelesen = 0;
        for (const t of teil ?? []) {
          let q = db.from("kc_communication_messages").select("id", { count: "exact", head: true }).eq("thread_id", t.thread_id).neq("sender_person_id", ich.person_id);
          if (t.last_read_at) q = q.gt("created_at", t.last_read_at);
          const { count } = await q; ungelesen += count ?? 0;
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
        const benachrichtigung = Object.fromEntries(BEREICHE.map((b) => { const x: any = (wahl ?? []).find((y: any) => y.bereich === b); return [b, x ? { push: x.push, email: x.email } : STANDARD_WAHL[b]]; }));
        return json({ ich, status: meinStatus, server: SERVER_VERSION, ungelesen, offeneAbstimmungen, naechsterDienst, benachrichtigung, hatMail: !!pm?.email, naechstesTreffen: naechstes[0] ?? null, mitgliederAnzahl: mitglieder.length, vapidPublicKey: pk || null });
      }

      case "mitglieder": {
        const [leute, { data: rollen }, { data: zug }, { data: push }, st] = await Promise.all([
          aktiveMitglieder(), db.from("kc_club_rollen").select("*"), db.from("kc_club_zugang").select("person_id,aktiv,zuletzt_gesehen"),
          db.from("kc_member_push_subscriptions").select("person_id").eq("active", true), statusMap(),
        ]);
        const r = new Map((rollen ?? []).map((x: any) => [x.person_id, x]));
        const z = new Map((zug ?? []).map((x: any) => [x.person_id, x]));
        const ps = new Set((push ?? []).map((x: any) => x.person_id));
        const aemter = [...new Set((rollen ?? []).flatMap((x: any) => x.aemter || []))].sort();
        return json({
          aemter,
          mitglieder: leute.map((m) => ({
            person_id: m.person_id, name: m.display_name, vorname: vorname(m),
            vorstand: !!(r.get(m.person_id) as any)?.ist_vorstand, aemter: (r.get(m.person_id) as any)?.aemter ?? [],
            status: st.get(m.person_id) ?? null,
            // für alle nur grob: in den letzten 14 Tagen in der App gewesen (genaue Zeit nur für den Admin)
            aktiv: !!(z.get(m.person_id) as any)?.zuletzt_gesehen && Date.now() - new Date((z.get(m.person_id) as any).zuletzt_gesehen).getTime() < 14 * 86400000,
            ...(ich.admin ? { app: !!(z.get(m.person_id) as any)?.aktiv, zuletzt: (z.get(m.person_id) as any)?.zuletzt_gesehen ?? null, push: ps.has(m.person_id), mail: !!m.email } : {}),
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
      case "treffen_liste": return json({ treffen: await treffenListe(ich) });

      case "treffen_speichern": {
        nurVorstand(ich);
        const titel = txt(p.titel, 120) || "Köcheclub-Treffen";
        const beginn = new Date(String(p.beginn || ""));
        if (isNaN(beginn.getTime())) throw new Fehler("Bitte Datum und Uhrzeit angeben.");
        if (beginn.getTime() < Date.now() - 3600000) throw new Fehler("Das Treffen liegt in der Vergangenheit.");
        const zeile = { titel, beginn: beginn.toISOString(), ende: p.ende ? new Date(String(p.ende)).toISOString() : null, ort: txt(p.ort, 200) || null,
          gastgeber_person_id: p.gastgeber_person_id ? String(p.gastgeber_person_id) : null, beschreibung: txt(p.beschreibung, 2000) || null, geaendert_am: jetzt() };
        let t: any, anlass: "neu" | "geaendert" = "neu";
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
        nurVorstand(ich);
        const { data: t } = await db.from("kc_club_treffen").update({ status: "abgesagt", geaendert_am: jetzt() }).eq("id", p.id).select().single();
        if (!t) throw new Fehler("Treffen nicht gefunden.", 404);
        const g = t.gastgeber_person_id ? (await personen([t.gastgeber_person_id])).get(t.gastgeber_person_id) : null;
        const ziel = (await aktiveMitglieder()).map((x) => x.person_id).filter((id) => id !== ich.person_id);
        const versand = await senden("club_treffen", ziel, treffenText(t, vorname(g), "abgesagt"), `club-treffen-absage:${t.id}`);
        await protokoll(ich.person_id, "treffen_abgesagt", { treffen: t.id, versand });
        return json({ ok: true, versand });
      }

      case "treffen_antwort": {
        const antwort = String(p.antwort || "");
        if (!["ja", "nein", "vielleicht"].includes(antwort)) throw new Fehler("Bitte zusagen, absagen oder vielleicht wählen.");
        const { data: t } = await db.from("kc_club_treffen").select("id,status,beginn").eq("id", p.id).maybeSingle();
        if (!t || t.status !== "geplant") throw new Fehler("Dieses Treffen ist nicht mehr offen.", 409);
        await db.from("kc_club_teilnahme").upsert({ treffen_id: t.id, person_id: ich.person_id, antwort, notiz: txt(p.notiz, 300) || null, geaendert_am: jetzt() });
        await protokoll(ich.person_id, "treffen_antwort", { treffen: t.id, antwort });
        return json({ ok: true, treffen: (await treffenListe(ich)).find((x: any) => x.id === t.id) });
      }

      // ----- Vorschläge & Abstimmungen -----
      case "vorschlaege_liste": {
        const { data: kommend } = await db.from("kc_club_treffen").select("id,titel,beginn").eq("status", "geplant").gte("beginn", jetzt()).order("beginn").limit(10);
        return json({ vorschlaege: await vorschlaegeListe(ich), treffen: kommend ?? [] });
      }

      case "vorschlag_speichern": {
        const art = p.art === "abstimmung" ? "abstimmung" : "thema";
        if (art === "abstimmung") nurVorstand(ich);
        const titel = txt(p.titel, 150);
        if (!titel) throw new Fehler("Bitte ein Thema bzw. eine Frage eingeben.");
        let optionen: string[] = [];
        if (art === "abstimmung") {
          optionen = [...new Set((Array.isArray(p.optionen) ? p.optionen : STANDARD_OPTIONEN).map((o: unknown) => txt(o, 60)).filter(Boolean))] as string[];
          if (optionen.length < 2 || optionen.length > 8) throw new Fehler("Bitte 2 bis 8 Antworten angeben.");
        }
        const frist = p.frist ? new Date(String(p.frist)) : null;
        if (frist && (isNaN(frist.getTime()) || frist.getTime() < Date.now())) throw new Fehler("Die Frist liegt in der Vergangenheit.");
        const { data: v, error } = await db.from("kc_club_vorschlaege").insert({
          art, titel, beschreibung: txt(p.beschreibung, 2000) || null, optionen, geheim: art === "abstimmung" && !!p.geheim,
          treffen_id: p.treffen_id ? String(p.treffen_id) : null, frist: art === "abstimmung" && frist ? frist.toISOString() : null, erstellt_von: ich.person_id,
        }).select().single();
        if (error || !v) throw new Fehler("Speichern fehlgeschlagen.", 500);
        // Abstimmung → alle; Themenvorschlag → Vorstand
        let versand = null;
        if (p.benachrichtigen !== false) {
          const ziel = art === "abstimmung" ? (await aktiveMitglieder()).map((x) => x.person_id)
            : ((await db.from("kc_club_rollen").select("person_id").eq("ist_vorstand", true)).data ?? []).map((r: any) => r.person_id);
          const fristText = v.frist ? ` Abstimmen bis ${wann(v.frist)}.` : "";
          versand = await senden("club_vorschlag", ziel.filter((id: string) => id !== ich.person_id), art === "abstimmung" ? {
            titel: "🗳️ Abstimmung: " + titel, kurz: `Bitte in der App abstimmen.${fristText}`,
            betreff: `Köcheclub Werne – Abstimmung: ${titel}`,
            text: `Hallo,\n\nes gibt eine neue Abstimmung${v.geheim ? " (geheim)" : ""}:\n\n🗳️ ${titel}${v.beschreibung ? "\n\n" + v.beschreibung : ""}\n\nAntworten: ${optionen.join(" / ")}${fristText ? "\n" + fristText.trim() : ""}\n\nAbstimmen in der Köcheclub-App: ${APP_URL}#vorschlaege\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#vorschlaege",
          } : {
            titel: "💡 Themenvorschlag", kurz: `${ich.name}: ${titel}`,
            betreff: `Köcheclub Werne – neuer Themenvorschlag: ${titel}`,
            text: `Hallo,\n\n${ich.name} schlägt ein Thema für die nächste Sitzung vor:\n\n💡 ${titel}${v.beschreibung ? "\n\n" + v.beschreibung : ""}\n\nAnsehen in der Köcheclub-App: ${APP_URL}#vorschlaege\n\nViele Grüße\nKöcheclub Werne`,
            url: APP_URL + "#vorschlaege",
          }, `club-vorschlag:${v.id}`);
        }
        await protokoll(ich.person_id, "vorschlag_angelegt", { vorschlag: v.id, art, geheim: v.geheim, versand });
        return json({ ok: true, id: v.id, versand });
      }

      case "vorschlag_stimme": {
        const { data: v } = await db.from("kc_club_vorschlaege").select("*").eq("id", String(p.id || "")).maybeSingle();
        if (!v) throw new Fehler("Vorschlag nicht gefunden.", 404);
        if (v.status !== "offen") throw new Fehler("Hier kann nicht mehr abgestimmt werden.", 409);
        if (v.art === "thema") {
          // Unterstützen an/aus
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
          if (!ich.vorstand && !eigener) throw new Fehler("Das darf nur, wer den Vorschlag gemacht hat, oder der Vorstand.", 403);
          await db.from("kc_club_vorschlaege").update({ status: "zurueckgezogen", abgeschlossen_am: jetzt(), abgeschlossen_von: ich.person_id }).eq("id", v.id);
        } else if (p.status === "abgeschlossen") {
          if (!ich.vorstand && !(eigener && v.art === "thema")) throw new Fehler("Abstimmungen beendet der Vorstand.", 403);
          versand = await vorschlagAbschliessen(v, ich.person_id);
        } else throw new Fehler("Unbekannter Status.");
        await protokoll(ich.person_id, "vorschlag_" + p.status, { vorschlag: v.id, versand });
        return json({ ok: true, versand });
      }

      // ----- Dienstzeiten aus dem Dienstplan (nur veröffentlichter Sollplan) -----
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

      case "benachrichtigung_setzen": {
        const bereich = String(p.bereich || "");
        if (!BEREICHE.includes(bereich)) throw new Fehler("Unbekannter Bereich.");
        await db.from("kc_club_benachrichtigung").upsert({ person_id: ich.person_id, bereich, push: !!p.push, email: !!p.email, geaendert_am: jetzt() });
        await protokoll(ich.person_id, "benachrichtigung_gesetzt", { bereich, push: !!p.push, email: !!p.email });
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
        const liste = (th ?? []).map((t: any) => {
          const m = (msgs ?? []).filter((x: any) => x.thread_id === t.id);
          const lr = gelesen.get(t.id);
          const andere = (tn ?? []).filter((x: any) => x.thread_id === t.id && x.person_id !== ich.person_id).map((x: any) => leute.get(x.person_id)?.display_name || x.person_id);
          return {
            id: t.id, betreff: t.subject, teilnehmer: andere, anzahl: andere.length + 1,
            letzte: m[0] ? { von: m[0].sender_person_id === ich.person_id ? "Du" : vorname(leute.get(m[0].sender_person_id)), text: String(m[0].body).slice(0, 120), zeit: m[0].created_at } : null,
            ungelesen: m.filter((x: any) => x.sender_person_id !== ich.person_id && (!lr || x.created_at > lr)).length,
            aktualisiert: m[0]?.created_at || t.updated_at,
          };
        }).sort((x: any, y: any) => String(y.aktualisiert).localeCompare(String(x.aktualisiert)));
        return json({ unterhaltungen: liste });
      }

      case "unterhaltung": {
        const id = String(p.id || "");
        await binTeilnehmer(id, ich.person_id);
        const [{ data: t }, { data: tn }, { data: msgs }] = await Promise.all([
          db.from("kc_communication_threads").select("id,subject").eq("id", id).single(),
          db.from("kc_communication_thread_participants").select("person_id,last_read_at").eq("thread_id", id),
          db.from("kc_communication_messages").select("id,sender_person_id,body,created_at").eq("thread_id", id).order("created_at").limit(500),
        ]);
        const mids = (msgs ?? []).map((m: any) => m.id);
        const { data: ma } = mids.length ? await db.from("kc_communication_message_attachments").select("message_id,attachment_id").in("message_id", mids) : { data: [] as any[] };
        const aids = (ma ?? []).map((x: any) => x.attachment_id);
        const { data: att } = aids.length ? await db.from("kc_communication_attachments").select("id,file_name,mime_type,size_bytes").in("id", aids) : { data: [] as any[] };
        const leute = await personen([...(tn ?? []).map((x: any) => x.person_id), ...(msgs ?? []).map((m: any) => m.sender_person_id)]);
        const andere = (tn ?? []).filter((x: any) => x.person_id !== ich.person_id);
        const nachrichten = (msgs ?? []).map((m: any) => {
          const eigen = m.sender_person_id === ich.person_id;
          const gelesenVon = eigen ? andere.filter((x: any) => x.last_read_at && x.last_read_at >= m.created_at).map((x: any) => vorname(leute.get(x.person_id))) : [];
          return {
            id: m.id, eigen, von: eigen ? "Du" : leute.get(m.sender_person_id)?.display_name || m.sender_person_id, text: m.body, zeit: m.created_at,
            anlagen: (ma ?? []).filter((x: any) => x.message_id === m.id).map((x: any) => (att ?? []).find((y: any) => y.id === x.attachment_id)).filter(Boolean)
              .map((y: any) => ({ id: y.id, name: y.file_name, mime: y.mime_type, groesse: y.size_bytes })),
            ...(eigen ? { gelesenVon, gelesenAlle: andere.length > 0 && gelesenVon.length === andere.length } : {}),
          };
        });
        await db.from("kc_communication_thread_participants").update({ last_read_at: jetzt() }).eq("thread_id", id).eq("person_id", ich.person_id);
        return json({ id, betreff: t?.subject ?? "", teilnehmer: (tn ?? []).map((x: any) => ({ person_id: x.person_id, name: leute.get(x.person_id)?.display_name || x.person_id })), nachrichten });
      }

      case "nachricht_senden": {
        const text = txt(p.text, 4000);
        const anlagen = (Array.isArray(p.anlagen) ? p.anlagen : []).map(String).slice(0, 10);
        if (!text && !anlagen.length) throw new Fehler("Bitte eine Nachricht schreiben oder eine Anlage anhängen.");
        let threadId = String(p.id || ""), neu = false;
        if (threadId) await binTeilnehmer(threadId, ich.person_id);
        else {
          const ziel = await empfaengerAufloesen(ich, p.empfaenger);
          if (!ziel.length) throw new Fehler("Bitte mindestens einen Empfänger wählen.");
          const betreff = txt(p.betreff, 120);
          // Zweiergespräch ohne Betreff: vorhandene Unterhaltung weiterführen
          if (ziel.length === 1 && !betreff) {
            const { data: a1 } = await db.from("kc_communication_thread_participants").select("thread_id").eq("person_id", ich.person_id);
            const { data: a2 } = await db.from("kc_communication_thread_participants").select("thread_id").eq("person_id", ziel[0]);
            const gemeinsam = (a1 ?? []).map((x: any) => x.thread_id).filter((id: string) => (a2 ?? []).some((y: any) => y.thread_id === id));
            for (const id of gemeinsam) {
              const { count } = await db.from("kc_communication_thread_participants").select("person_id", { count: "exact", head: true }).eq("thread_id", id);
              const { data: th } = await db.from("kc_communication_threads").select("subject").eq("id", id).single();
              if (count === 2 && !th?.subject) { threadId = id; break; }
            }
          }
          if (!threadId) {
            const { data: th, error } = await db.from("kc_communication_threads").insert({ org_id: ORG, subject: betreff, created_by_person_id: ich.person_id }).select("id").single();
            if (error || !th) throw new Fehler("Unterhaltung konnte nicht angelegt werden.", 500);
            threadId = th.id; neu = true;
            await db.from("kc_communication_thread_participants").insert([ich.person_id, ...ziel].map((person_id) => ({ thread_id: threadId, person_id })));
          }
        }
        // Anlagen: nur eigene, noch nicht verknüpfte
        if (anlagen.length) {
          const { data: att } = await db.from("kc_communication_attachments").select("id,object_path").in("id", anlagen);
          if ((att ?? []).length !== anlagen.length || (att ?? []).some((x: any) => !String(x.object_path).startsWith(`club/${ich.person_id}/`)))
            throw new Fehler("Anlage nicht gefunden – bitte erneut anhängen.");
        }
        const { data: m, error: me } = await db.from("kc_communication_messages").insert({ thread_id: threadId, sender_person_id: ich.person_id, body: text || "📎" }).select("id,created_at").single();
        if (me || !m) throw new Fehler("Nachricht konnte nicht gespeichert werden.", 500);
        if (anlagen.length) await db.from("kc_communication_message_attachments").insert(anlagen.map((attachment_id: string) => ({ message_id: m.id, attachment_id, hochgeladen_von_person_id: ich.person_id })));
        await Promise.all([
          db.from("kc_communication_threads").update({ updated_at: jetzt() }).eq("id", threadId),
          db.from("kc_communication_thread_participants").update({ last_read_at: m.created_at }).eq("thread_id", threadId).eq("person_id", ich.person_id),
        ]);
        const { data: tn } = await db.from("kc_communication_thread_participants").select("person_id").eq("thread_id", threadId).neq("person_id", ich.person_id).is("hidden_at", null);
        const { data: th } = await db.from("kc_communication_threads").select("subject").eq("id", threadId).single();
        const ziel = (tn ?? []).map((x: any) => x.person_id);
        const versand = await senden("club_nachricht", ziel, {
          titel: `💬 ${ich.name}`, kurz: th?.subject ? `Neue Nachricht in „${th.subject}“` : "Neue Nachricht im Köcheclub",
          betreff: `Köcheclub Werne – neue Nachricht von ${ich.name}${th?.subject ? ": " + th.subject : ""}`,
          text: `Hallo,\n\n${ich.name} hat dir im Köcheclub geschrieben${th?.subject ? ` („${th.subject}“)` : ""}:\n\n${text}${anlagen.length ? `\n\n📎 ${anlagen.length} Anlage(n) – in der App ansehen.` : ""}\n\nAntworten in der Köcheclub-App: ${APP_URL}#nachricht=${threadId}\n\nViele Grüße\nKöcheclub Werne`,
          url: `${APP_URL}#nachricht=${threadId}`,
        }, `club-nachricht:${m.id}`);
        await protokoll(ich.person_id, "nachricht_gesendet", { thread: threadId, neu, empfaenger: ziel.length, anlagen: anlagen.length, versand });
        return json({ ok: true, id: threadId, versand });
      }

      // ----- Anlagen -----
      case "anlage_hochladen": {
        const name = txt(p.name, 150).replace(/[\\/]/g, "_") || "Anlage";
        const mime = txt(p.mime, 100) || "application/octet-stream";
        if (/(x-msdownload|x-sh|javascript|x-executable|html)/i.test(mime) || /\.(exe|bat|cmd|js|sh|html?)$/i.test(name)) throw new Fehler("Dieser Dateityp ist nicht erlaubt.");
        const b64 = String(p.daten || "");
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
        if (error || !att) throw new Fehler("Anlage konnte nicht gespeichert werden.", 500);
        return json({ ok: true, id: att.id, name, groesse: bytes.length });
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
        if (!erlaubt) throw new Fehler("Anlage nicht gefunden.", 404);
        const { data: s } = await db.storage.from(att.bucket).createSignedUrl(att.object_path, 600, p.herunterladen ? { download: att.file_name } : undefined);
        if (!s?.signedUrl) throw new Fehler("Anlage kann gerade nicht geöffnet werden.", 500);
        return json({ url: s.signedUrl, name: att.file_name });
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
        await db.from("kc_club_zugang").upsert({ person_id: pid, token_hash: await sha256(token), aktiv: true, erstellt_am: jetzt(), erstellt_von: ich.person_id });
        await protokoll(ich.person_id, "link_erzeugt", { fuer: pid });
        return json({ ok: true, link: `${APP_URL}?k=${token}` });
      }
      case "rolle_setzen": {
        nurAdmin(ich);
        const pid = String(p.person_id || "");
        const aemter = (Array.isArray(p.aemter) ? p.aemter : []).map((x: unknown) => txt(x, 40)).filter(Boolean).slice(0, 5);
        await db.from("kc_club_rollen").upsert({ person_id: pid, ist_vorstand: !!p.vorstand, ...(pid === ich.person_id ? {} : { ist_admin: !!p.admin }), aemter, geaendert_am: jetzt() });
        await protokoll(ich.person_id, "rolle_gesetzt", { fuer: pid, vorstand: !!p.vorstand, aemter });
        return json({ ok: true });
      }

      default: return json({ error: "Unbekannte Aktion" }, 400);
    }
  } catch (e) {
    if (e instanceof Fehler) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
