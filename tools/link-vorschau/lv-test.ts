// KC-CLUB-LINK-VORSCHAU (2.486.0): Test des echten Server-Codes (Auszug aus supabase/functions/kc-club/index.ts).
// Start: deno run -A tools/link-vorschau/lv-test.ts  [--netz]   (--netz: zusätzlich echte Webseiten abrufen)
const src = await Deno.readTextFile(new URL("../../supabase/functions/kc-club/index.ts", import.meta.url));
const a = src.indexOf("const LV_MAX_MIN ="), b = src.indexOf("// ---------- Hauptprogramm ----------");
const datei = await Deno.makeTempFile({ suffix: ".ts" });
await Deno.writeTextFile(datei, src.slice(a, b) + "\nexport { lvAdresseOk, lvAuswerten, lvHolen, lvBremse, lvKurz, LV_URL_RE };");
const L: any = await import("file://" + datei);
const ok = (x: boolean, t: string) => { if (!x) { console.error("FEHLER:", t); Deno.exit(1); } console.log("ok:", t); };

// 1. Adressen: nur öffentliche http(s)-Namen
for (const u of ["https://www.chefkoch.de/rezepte/1", "http://example.org/x?y=1", "https://de.wikipedia.org/wiki/Roulade"]) ok(!!L.lvAdresseOk(u), "erlaubt: " + u);
for (const u of ["javascript:alert(1)", "file:///etc/passwd", "ftp://x.de/a", "http://127.0.0.1/", "http://10.0.0.5/", "http://169.254.169.254/latest/meta-data", "http://[::1]/",
  "http://localhost/", "http://intranet/", "http://drucker.local/", "https://x.internal/", "https://user:pw@example.org/", "https://example.org:8443/", "https://ptblnpiroqftcvlsrhac.supabase.co/rest/v1/",
  "http://0x7f000001/", "http://2130706433/", "nonsense"]) ok(!L.lvAdresseOk(u), "abgelehnt: " + u);

// 2. Auswerten: og-Angaben, Entities, Schutz vor HTML, relative Bilder, nur https-Bilder
const basis = new URL("https://www.beispiel.de/rezept/rouladen");
let v = L.lvAuswerten(`<html><head><meta property="og:title" content="Rinderrouladen &amp; Rotkohl"><meta property="og:description" content="Omas Rezept &#8211; mit Speck"><meta property="og:site_name" content="Beispiel Küche"><meta property="og:image" content="/bilder/r.jpg"></head></html>`, basis);
ok(v.titel === "Rinderrouladen & Rotkohl" && v.text === "Omas Rezept – mit Speck" && v.seite === "Beispiel Küche" && v.bild === "https://www.beispiel.de/bilder/r.jpg", "og-Angaben, Entities, relatives Bild");
v = L.lvAuswerten(`<head><title>Nur Titel <b>fett</b></title><meta name="description" content='Text mit "Zitat"'></head>`, basis);
ok(v.titel === "Nur Titel fett" && v.text === 'Text mit "Zitat"' && v.seite === "beispiel.de" && v.bild === null, "Rückfall <title>/description, Seite = Name");
v = L.lvAuswerten(`<meta property="og:title" content="&lt;script&gt;alert(1)&lt;/script&gt;Hallo"><meta property="og:image" content="http://unsicher.de/b.jpg">`, basis);
ok(!/<script/i.test(v.titel) && v.bild === null, "kein HTML im Titel, http-Bild abgelehnt");
v = L.lvAuswerten(`<meta property="og:title" content="x"><meta property="og:image" content="javascript:alert(1)">`, basis); ok(v.bild === null, "javascript-Bild abgelehnt");
v = L.lvAuswerten(`<meta property="og:title" content="${"A".repeat(500)}">`, basis); ok(v.titel.length === 200, "Titel gekürzt auf 200");
ok(L.lvAuswerten(`<html><body>nichts</body></html>`, basis) === null, "ohne Angaben keine Vorschau");

// 3. Bremse je Person
let n = 0; for (let i = 0; i < 40; i++) if (L.lvBremse("KC-P-X")) n++; ok(n === 30, "höchstens 30 Abrufe je 10 Min. und Person");

// 4. Link im Text erkennen
ok(("Schau mal https://www.chefkoch.de/rezepte/123 lecker".match(L.LV_URL_RE) || [])[0] === "https://www.chefkoch.de/rezepte/123", "Link im Text erkannt");

// 5. Holen: abgelehnte Adressen gehen gar nicht ins Netz
ok((await L.lvHolen("http://127.0.0.1:9/")) === null && (await L.lvHolen("http://169.254.169.254/")) === null, "interne Adressen: kein Abruf");

if (Deno.args.includes("--netz")) {
  for (const u of ["https://de.wikipedia.org/wiki/Rinderroulade", "https://www.tagesschau.de/", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"]) {
    const t0 = Date.now(), x = await L.lvHolen(u); console.log("   ", u, "→", JSON.stringify(x)?.slice(0, 220), `(${Date.now() - t0} ms)`);
    ok(!!x?.titel, "echte Seite hat Titel: " + u);
  }
  const t0 = Date.now(); await L.lvHolen("https://de.wikipedia.org/wiki/Rinderroulade"); ok(Date.now() - t0 < 5, "zweiter Abruf aus dem Merker (kein Netz)");
}
console.log("ALLE TESTS GRÜN"); Deno.exit(0);
