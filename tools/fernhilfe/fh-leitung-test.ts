// KC-CLUB-FERNHILFE F1: Lauf-Test des echten fhLeitung-Codes aus app.js gegen Supabase Realtime (Broadcast, öffentlicher Browser-Schlüssel).
// Start: deno run -A tools/fernhilfe/fh-leitung-test.ts – nutzt einen zufälligen Test-Kanal, keine Datenbank, keine Echtdaten.
const app = await Deno.readTextFile(new URL("../../app.js", import.meta.url));
const stueck = (start: string, ende: string) => app.slice(app.indexOf(start), app.indexOf(ende, app.indexOf(start)));
const code = [stueck("const RT_URL =", "const RT = {"), stueck("const FH_TEIL =", "// Der Sender schickt nach einem")].join("\n");
const { fhLeitung, fhGueltig } = new Function(code + "\nreturn { fhLeitung, fhGueltig };")();
const ok = (b: boolean, t: string) => { if (!b) { console.error("FEHLER:", t); Deno.exit(1); } console.log("ok:", t); };
const hex = [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, "0")).join("");
const schl = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
const fh = { kanal: "kc-fh-" + hex, schluessel: schl() };
ok(fhGueltig(fh) && !fhGueltig({ kanal: "kc-fh-x", schluessel: "a" }) && !fhGueltig(null), "Kanal-Prüfung");
const warte = (b: () => boolean, ms = 10000) => new Promise<boolean>((r) => { const t0 = Date.now(); const i = setInterval(() => { if (b() || Date.now() - t0 > ms) { clearInterval(i); r(b()); } }, 50); });
const beimSender: any[] = [], beimZuschauer: any[] = [], beimFremden: any[] = [];
const sender = fhLeitung(fh, (d: any) => beimSender.push(d));
ok(await warte(() => sender.ok), "Sender verbunden");
const zuschauer = fhLeitung(fh, (d: any) => beimZuschauer.push(d), () => zuschauer.senden({ hallo: 1 }));
const fremd = fhLeitung({ kanal: fh.kanal, schluessel: schl() }, (d: any) => beimFremden.push(d)); // gleicher Kanal, falscher Schlüssel
ok(await warte(() => zuschauer.ok && fremd.ok), "Zuschauer und Fremder verbunden");
ok(await warte(() => beimSender.some((d) => d?.hallo === 1)), "Zuschauer meldet sich mit hallo beim Sender");
const gross = { f: { d: "A".repeat(450_000), z: "gzip", w: 400, h: 800 }, z: { art: "pfeil", x: 0.5, y: 0.25 } };
ok(await sender.senden(gross), "großes Bild gesendet");
ok(await warte(() => beimZuschauer.some((d) => d?.f?.d?.length === 450_000)), "großes Bild vollständig angekommen (in Teilen)");
ok(beimZuschauer.find((d) => d?.f)?.z?.x === 0.5, "Zeiger kam mit");
await new Promise((r) => setTimeout(r, 800));
ok(beimFremden.length === 0, "falscher Schlüssel: nichts lesbar");
const m = sender.mess(); ok(m.n >= 3 && m.max_kb > 200 && m.weg === "broadcast", `Messwerte ${JSON.stringify(m)}`);
ok(!(await sender.senden({ f: { d: "B".repeat(4_000_000) } })), "zu großes Bild (> 20 Teile) wird nicht gesendet");
for (const l of [sender, zuschauer, fremd]) l.schliessen();
ok(await warte(() => !sender.ok && !zuschauer.ok), "Leitungen geschlossen");
console.log("ALLE TESTS GRÜN"); Deno.exit(0);
