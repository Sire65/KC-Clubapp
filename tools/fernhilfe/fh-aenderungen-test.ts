// KC-CLUB-FERNHILFE F2: Test „nur Änderungen statt Vollbild“ mit dem echten Code aus app.js (fhBildSenden/fhBildEmpfangen, spgPacken).
// Start: deno run -A tools/fernhilfe/fh-aenderungen-test.ts – ohne Netz: die Leitung ist nachgebildet (JSON hin und zurück wie bei Broadcast).
const app = await Deno.readTextFile(new URL("../../app.js", import.meta.url));
const stueck = (start: string, ende: string) => { const a = app.indexOf(start); if (a < 0) throw new Error("fehlt: " + start); return app.slice(a, app.indexOf(ende, a)); };
const code = [stueck("async function spgPacken(", "// Sender: beobachtet"), stueck("const FH_VOLL_MS =", "// KC-CLUB-RT-SPARBREMSE")].join("\n");
const MSCH: any = {}, VF: any = {}; (globalThis as any).window = globalThis; // spgPacken fragt window.CompressionStream
const { fhBildSenden, fhBildEmpfangen, fhBildFolge, fhVollFaellig, spgPacken } = new Function("MSCH", "VF",
  code + "\nreturn { fhBildSenden, fhBildEmpfangen, fhBildFolge, fhVollFaellig, spgPacken };")(MSCH, VF);
const ok = (b: boolean, t: string) => { if (!b) { console.error("FEHLER:", t); Deno.exit(1); } console.log("ok:", t); };

// Nachgebildete Leitung: alles geht als JSON hin und zurück (wie über Realtime), verlieren lässt sich eine Nachricht gezielt
function paar() {
  const zumZuschauer: any[] = [], zumSender: any[] = [];
  const S: any = { f2: true, senden: async (o: any) => { zumZuschauer.push(JSON.parse(JSON.stringify(o))); return true; } };
  const Z: any = { senden: async (o: any) => { zumSender.push(JSON.parse(JSON.stringify(o))); return true; } };
  return { S, Z, zumZuschauer, zumSender };
}
async function bild(html: string, extra: any = {}) { // wie spgSenderTakt: gepacktes Bild + unsichtbares Rohbild
  const s = { html, ha: [["lang", "de"]], ba: [["class", "x"]], w: 400, h: 800, sy: extra.sy || 0 };
  const f: any = { ...(await spgPacken(s)), w: s.w, h: s.h, tipp: extra.tipp || null }; Object.defineProperty(f, "_s", { value: s }); return f;
}
const liste = (n: number, wechsel = -1) => "<ul>" + Array.from({ length: n }, (_, i) => `<li class="zeile">Mitglied ${i} · Termin ${i % 7} · ${i === wechsel ? "GEÄNDERT ✅" : "unverändert"}</li>`).join("") + "</ul>";
const groesse = (o: any) => JSON.stringify(o).length;

// 1. Ältere Gegenseite (ohne f2): weiter nur Vollbilder
{ const { S, zumZuschauer } = paar(); S.f2 = false;
  await fhBildSenden(S, await bild("<p>a</p>")); await fhBildSenden(S, await bild("<p>b</p>"));
  ok(zumZuschauer.every((n) => n.f && !n.d), "ältere App: nur Vollbilder, keine Änderungen"); }

// 2. Große Liste: erstes Bild voll, danach nur die Änderung
const { S, Z, zumZuschauer, zumSender } = paar();
const html0 = liste(6000), html1 = liste(6000, 4321), html2 = liste(6000, 17);
ok(html0.length > 300_000, `Testseite mit großer Liste: ${Math.round(html0.length / 1024)} KB Inhalt`);
await fhBildSenden(S, await bild(html0));
ok(!!zumZuschauer[0].f && zumZuschauer[0].seq === 1, "erstes Bild ist ein Vollbild");
let z = await fhBildEmpfangen(Z, zumZuschauer[0]);
ok(z?._s?.html === html0, "Vollbild beim Zuschauer richtig ausgepackt");
await fhBildSenden(S, await bild(html1, { tipp: { x: 0.1, y: 0.2, n: 1 } }));
const n1 = zumZuschauer[1];
ok(!!n1.d && !n1.f && groesse(n1) < 2000, `Änderung statt Vollbild: ${groesse(n1)} Zeichen statt ${groesse(zumZuschauer[0])}`);
z = await fhBildEmpfangen(Z, n1);
ok(z?._s?.html === html1 && z.tipp?.n === 1, "Änderung zusammengesetzt = genau das neue Bild (mit Tipp-Punkt)");
await fhBildSenden(S, await bild(html1, { sy: 640 }));
z = await fhBildEmpfangen(Z, zumZuschauer[2]);
ok(!!zumZuschauer[2].d && zumZuschauer[2].d.m === "" && z?._s?.sy === 640, "nur gescrollt: leere Änderung mit neuer Position");

// 3. Verlust: eine Änderung geht verloren → Zuschauer fordert Vollbild an → wieder vollständig
await fhBildSenden(S, await bild(html2)); zumZuschauer.pop(); // verloren
await fhBildSenden(S, await bild(html0));
z = await fhBildEmpfangen(Z, zumZuschauer.at(-1));
ok(z === null && zumSender.at(-1)?.hallo === 1 && zumSender.at(-1)?.f2 === 1, "Lücke erkannt: kein falsches Bild, Vollbild angefordert");
S.d.neu = true; // so setzt es fhLeitung beim Eingang von „hallo“
await fhBildSenden(S, await bild(html0));
z = await fhBildEmpfangen(Z, zumZuschauer.at(-1));
ok(!!zumZuschauer.at(-1).f && z?._s?.html === html0, "nach dem Verlust wieder vollständig (Vollbild)");
await fhBildSenden(S, await bild(html2));
z = await fhBildEmpfangen(Z, zumZuschauer.at(-1));
ok(!!zumZuschauer.at(-1).d && z?._s?.html === html2, "danach wieder nur Änderungen");

// 4. Selbstheilung: spätestens nach 60 s ein Vollbild
MSCH.fhL = S; ok(!fhVollFaellig(), "kurz nach dem Vollbild: kein neues nötig");
S.d.voll = Date.now() - 61_000; ok(fhVollFaellig(), "nach 60 s ist ein Vollbild fällig");
await fhBildSenden(S, await bild(html1));
ok(!!zumZuschauer.at(-1).f, "nach 60 s wird voll gesendet");
z = await fhBildEmpfangen(Z, zumZuschauer.at(-1));

// 5. Große Änderung: gepackt; mehr als die Hälfte neu → Vollbild
const html3 = html1.slice(0, 1000) + "<div>" + "neu ".repeat(3000) + "</div>" + html1.slice(1000);
await fhBildSenden(S, await bild(html3));
ok(!!zumZuschauer.at(-1).d && typeof zumZuschauer.at(-1).d.m === "object", "große Änderung wird gepackt");
z = await fhBildEmpfangen(Z, zumZuschauer.at(-1)); ok(z?._s?.html === html3, "gepackte Änderung richtig zusammengesetzt");
await fhBildSenden(S, await bild("<p>ganz andere Seite</p>"));
ok(!!zumZuschauer.at(-1).f, "andere Seite (mehr als die Hälfte neu) → Vollbild");
z = await fhBildEmpfangen(Z, zumZuschauer.at(-1));

// 6. Emoji an der Grenze (Ersatzzeichen-Paare) übersteht die Übertragung
await fhBildSenden(S, await bild("<p>a😀b</p>")); await fhBildEmpfangen(Z, zumZuschauer.at(-1));
await fhBildSenden(S, await bild("<p>a😁b</p>"));
z = await fhBildEmpfangen(Z, zumZuschauer.at(-1)); ok(z?._s?.html === "<p>a😁b</p>", "Emoji-Wechsel an der Schnittstelle korrekt");

// 7. Vorhang und Bild ohne Rohbild gehen unverändert als Vollnachricht
await fhBildSenden(S, { vorhang: true }); ok(zumZuschauer.at(-1).f?.vorhang === true, "Vorhang geht unverändert");
z = await fhBildEmpfangen(Z, zumZuschauer.at(-1)); ok(z?.vorhang === true, "Vorhang kommt beim Zuschauer an");

// 8. Reihenfolge: fhBildFolge setzt der Reihe nach zusammen, auch wenn das Auspacken dauert
{ const p = paar(); const a = "<p>" + "x".repeat(50_000) + "</p>", b = a.replace("xxx", "yyy"), c = b.replace("xxxx", "zzzz");
  for (const h of [a, b, c]) await fhBildSenden(p.S, await bild(h));
  const erg = await Promise.all(p.zumZuschauer.map((n) => fhBildFolge(p.Z, n)));
  ok(erg[2]?._s?.html === c && p.zumSender.length === 0, "drei Nachrichten kurz nacheinander: richtig der Reihe nach"); }

const m = { voll: S.vN, aend: S.aN }; ok(m.voll >= 4 && m.aend >= 5, `Zähler Vollbilder/Änderungen ${JSON.stringify(m)}`);
console.log("ALLE TESTS GRÜN"); Deno.exit(0);
