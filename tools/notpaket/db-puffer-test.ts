// KC-CLUB-NOTPAKET-PUFFER: Lauf-Test des echten dbFetch-Codes aus kc-club/index.ts (Deno 2.1.x wie Supabase Edge Runtime).
// Start: deno run -A tools/notpaket/db-puffer-test.ts   – keine Echtdaten, lokaler Nachbau-Server.
import { createClient } from "npm:@supabase/supabase-js@2";
import { DB_PUFFER } from "../../supabase/functions/kc-club/db-puffer.js"; // dieselbe Instanz wie im Testmodul
const quelle = await Deno.readTextFile(new URL("../../supabase/functions/kc-club/index.ts", import.meta.url));
const teil = quelle.slice(quelle.indexOf("const DB_ZEIT_MS"), quelle.indexOf("const dbWeg"));
const anfragen: string[] = [];
let zeilen = [{ id: 1 }];
const srv = Deno.serve({ port: 8788, onListen() {} }, async (req) => {
  const u = new URL(req.url); anfragen.push(req.method + " " + u.pathname + u.search);
  if (u.pathname.endsWith("/fehler")) return new Response('{"message":"x"}', { status: 500, headers: { "content-type": "application/json" } });
  if (req.method === "PATCH") { zeilen = [{ id: 2 }]; return new Response(null, { status: 204 }); }
  if (req.method === "HEAD") return new Response(null, { status: 200, headers: { "content-range": "0-0/42" } });
  return new Response(JSON.stringify(zeilen), { headers: { "content-type": "application/json" } });
});
const tmp = await Deno.makeTempFile({ suffix: ".ts" });
await Deno.writeTextFile(tmp, `import { DB_PUFFER } from ${JSON.stringify(new URL("../../supabase/functions/kc-club/db-puffer.js", import.meta.url).href)};\n${teil}\nexport { dbFetch };\n`);
const { dbFetch } = await import("file://" + tmp);
const db = createClient("http://localhost:8788", "x", { auth: { persistSession: false }, global: { fetch: dbFetch } });
const ok = (b: boolean, t: string) => { if (!b) { console.error("FEHLER:", t, anfragen); Deno.exit(1); } console.log("ok:", t); };
const zaehle = (f: string) => anfragen.filter((a) => a.includes(f)).length;

const pf = { antworten: new Map(), netz: 0, puffer: 0 };
await DB_PUFFER.run(pf, async () => {
  const a = await db.from("t").select("*").eq("x", 1);
  const [b, c] = await Promise.all([db.from("t").select("*").eq("x", 1), db.from("t").select("*").eq("x", 1)]);
  ok(JSON.stringify(a.data) === '[{"id":1}]' && JSON.stringify(b.data) === JSON.stringify(a.data) && JSON.stringify(c.data) === JSON.stringify(a.data), "gleiche Antwort aus dem Puffer");
  ok(zaehle("GET /rest/v1/t?") === 1, "gleiche Leseabfrage nur einmal an die Datenbank");
  const h1 = await db.from("t").select("*", { count: "exact", head: true }), h2 = await db.from("t").select("*", { count: "exact", head: true });
  ok(h1.count === 42 && h2.count === 42 && zaehle("HEAD") === 1, "Zählabfrage (HEAD) gepuffert, Anzahl richtig");
  const f1 = await db.from("fehler").select("*"), f2 = await db.from("fehler").select("*");
  ok(!!f1.error && !!f2.error && zaehle("/fehler") === 2, "Fehler werden nie gepuffert");
  const vorRpc = zaehle("GET /rest/v1/t?select=*&x=eq.1");
  await db.rpc("kc_club_ungelesen_je_chat", { p_person: "KC-P-ZZ" });
  await db.from("t").select("*").eq("x", 1);
  ok(zaehle("GET /rest/v1/t?select=*&x=eq.1") === vorRpc && zaehle("/rpc/kc_club_ungelesen_je_chat") === 1, "geprüfte Lese-Funktion lässt den Puffer stehen");
  await db.rpc("irgendwas_schreibt", {});
  await db.from("t").select("*").eq("x", 1);
  ok(zaehle("GET /rest/v1/t?select=*&x=eq.1") === vorRpc + 1, "unbekannte Funktion leert den Puffer");
  const w = await db.from("t").update({ y: 1 }).eq("x", 1);
  ok(!w.error && w.status === 204, "Schreiben (204 ohne Inhalt) geht durch");
  const d = await db.from("t").select("*").eq("x", 1);
  ok(JSON.stringify(d.data) === '[{"id":2}]' && zaehle("GET /rest/v1/t?select=*&x=eq.1") === 3, "nach dem Schreiben frisch gelesen");
});
ok(pf.netz === 9 && pf.puffer === 4 && anfragen.length === 9, `Zähler netz=${pf.netz} puffer=${pf.puffer}`);
const vorher = zaehle("GET /rest/v1/t?select=*&x=eq.1");
await db.from("t").select("*").eq("x", 1); await db.from("t").select("*").eq("x", 1);
ok(zaehle("GET /rest/v1/t?select=*&x=eq.1") === vorher + 2, "außerhalb eines Notpaket-Teils nie gepuffert");
const pf2 = { antworten: new Map(), netz: 0, puffer: 0 };
let fremd = 0;
await Promise.all([
  DB_PUFFER.run(pf2, async () => { await db.from("p").select("*"); await new Promise((r) => setTimeout(r, 30)); await db.from("p").select("*"); }),
  (async () => { await new Promise((r) => setTimeout(r, 10)); const v = zaehle("/rest/v1/p?"); await db.from("p").select("*"); fremd = zaehle("/rest/v1/p?") - v; })(),
]);
ok(fremd === 1 && pf2.puffer === 1 && pf2.netz === 1, "gleichzeitige fremde Anfrage sieht den Puffer nicht");
await srv.shutdown();
console.log("ALLE TESTS GRÜN");
