// KC-CLUB-FILME-NEU (15.11.2026): baut einen Erklärfilm aus Drehbuch (tools/film/<name>/szenen.mjs), Texten (texte.json) und Sprecher.
// Aufruf:  node tools/film/film.mjs <kopffilm|ansichtfilm> [probe|voll]
//   probe – nur Bilder (tools/film/<name>/arbeit/bilder/*.png) zum Ansehen, ohne Stimme und Film
//   voll  – Stimme (Piper) → Bilder → bild.mp4 (25 fps) → Ton → film/<datei>.mp4 und Vorschaubild film/<vorschau>.webp
// Browser: echte App dieses Ordners mit Beispieldaten; Netzsperre und Abschirmung in gemeinsam.mjs (KC-TESTS-OHNE-ECHTSERVER).
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
import { serverStarten, browserStarten, appSeite, aufraeumen, lage, rahmenHtml, stimmeErzeugen, WURZEL } from "./gemeinsam.mjs";

const name = process.argv[2], modus = process.argv[3] || "voll";
const ORDNER = path.join(WURZEL, "tools/film", name), ARBEIT = path.join(ORDNER, "arbeit"), BILDER = path.join(ARBEIT, "bilder");
if (!name || !fs.existsSync(path.join(ORDNER, "texte.json"))) { console.error("Aufruf: node tools/film/film.mjs <kopffilm|ansichtfilm> [probe|voll]"); process.exit(1); }
const T = JSON.parse(fs.readFileSync(path.join(ORDNER, "texte.json"), "utf8"));
const DREHBUCH = (await import(path.join(ORDNER, "szenen.mjs"))).default;
fs.rmSync(BILDER, { recursive: true, force: true }); fs.mkdirSync(BILDER, { recursive: true });
const ff = (args) => { const r = spawnSync("ffmpeg", ["-y", "-v", "error", ...args], { stdio: "inherit" }); if (r.status) throw new Error("ffmpeg: " + args.join(" ")); };
const VOR = 0.35, NACH = 0.9; // Pause vor und nach dem Sprecher je Szene (Sekunden)

// 1) Stimme
const szenen = T.szenen;
let dauer = szenen.map(() => 7);
if (modus === "voll") {
  const vo = stimmeErzeugen(ARBEIT, szenen);
  dauer = vo.map((d, i) => Math.max(szenen[i].min || 0, VOR + d + NACH));
}

// 2) Aufnahmen aus der App
const srv = serverStarten(); const browser = await browserStarten();
const seite = await appSeite(browser, { w: 412, h: 816, ansicht: T.ansicht || "erweitert" });
await seite.waitForTimeout(1500); await aufraeumen(seite);
let nr = 0;
const h = {
  s: seite, weg: () => aufraeumen(seite), warte: (ms) => seite.waitForTimeout(ms), lage: (sel) => lage(seite, sel),
  js: (f, a) => seite.evaluate(f, a),
  // ersten sichtbaren Knopf mit diesem Text als #film-<name> markieren (für Finger/Ring)
  markiere: (text, id, bereich = "body") => seite.evaluate(([t, id, b]) => { document.getElementById("film-" + id)?.removeAttribute("id");
    const k = [...document.querySelectorAll(`${b} button, ${b} [role=button]`)].find((e) => e.getClientRects().length && e.textContent.includes(t)); if (k) k.id = "film-" + id; return !!k; }, [text, id, bereich]),
  // Info-Feld auf eine Karte blättern
  karte: async (id) => { await seite.evaluate((id) => { const i = INFO_FELDER.findIndex((f) => f.id === id); if (i >= 0) infoGehe(i, 1); }, id); await seite.waitForTimeout(1300); },
  // Bildschirmfoto der App (+ Finger, Ringe, Vergrößerung) – bei = Anteil der Szene, ab dem das Bild steht
  foto: async (o = {}) => {
    await aufraeumen(seite); if (o.vorher) await o.vorher(); await seite.waitForTimeout(o.warte ?? 250);
    const datei = path.join(BILDER, `app-${String(++nr).padStart(3, "0")}.png`); await seite.screenshot({ path: datei });
    const pos = async (z) => (typeof z === "string" ? await lage(seite, z) : z);
    const fl = o.finger ? await pos(o.finger) : null, finger = fl ? { ...fl, tipp: !!o.tipp } : null;
    if (o.finger && !fl) console.log("  ! Finger-Ziel nicht gefunden:", o.finger);
    const ringe = []; for (const r of o.ringe || []) { const l = await pos(r); if (l && l.w) ringe.push(l); else console.log("  ! Ring-Ziel nicht gefunden:", r); }
    let zoom = o.zoom || null; if (typeof zoom?.um === "string") { const l = await lage(seite, zoom.um); zoom = { x: l.x, y: l.y, f: zoom.f }; }
    return { bild: datei, finger, ringe, zoom, bei: o.bei };
  },
};
const plan = [];
for (const [i, sz] of szenen.entries()) {
  let shots = [];
  if (sz.art === "titel" || sz.art === "karten") shots = [{}];
  else { const f = DREHBUCH[sz.id]; if (!f) throw new Error("Drehbuch fehlt: " + sz.id); shots = await f(h); }
  plan.push({ sz, dauer: dauer[i], shots });
  console.log(`Szene ${i + 1}/${szenen.length} ${sz.id}: ${shots.length} Bild(er)`);
}
if (seite.fehler.length) console.log("Hinweis – Meldungen der Seite:", seite.fehler.join(" | "));

// 3) Filmbilder zusammensetzen (Kopfleiste, Etikett, Handy, Finger, Untertitel)
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const rahmen = await ctx.newPage();
await rahmen.route("**/*", (r) => (/^(data:|blob:|about:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: Rahmen braucht nichts von außen
await rahmen.setContent(rahmenHtml()); await rahmen.evaluate(() => document.fonts.ready);
const liste = []; let fnr = 0;
for (const p of plan) {
  const n = p.shots.length;
  const starts = p.shots.map((s, i) => s.bei ?? (n === 1 ? 0 : i === 0 ? 0 : (VOR + (p.dauer - VOR - NACH) * i / n) / p.dauer));
  for (const [i, s] of p.shots.entries()) {
    const o = { unter: T.unter, text: p.sz.text, etikett: p.sz.etikett, art: p.sz.art, titel: p.sz.titel, dauer: p.sz.dauer, zeilen: p.sz.zeilen, karten: p.sz.karten,
      bild: s.bild ? "data:image/png;base64," + fs.readFileSync(s.bild).toString("base64") : null, finger: s.finger, ringe: s.ringe, zoom: s.zoom };
    await rahmen.evaluate((o) => zeige(o), o); await rahmen.evaluate(() => Promise.all([...document.images].map((b) => b.decode().catch(() => {}))));
    const datei = path.join(BILDER, `bild-${String(++fnr).padStart(3, "0")}-${p.sz.id}.png`); await rahmen.screenshot({ path: datei });
    const ende = i + 1 < n ? starts[i + 1] : 1; liste.push({ datei, d: Math.max(0.2, (ende - starts[i]) * p.dauer) });
  }
}
await browser.close(); srv.close();
if (modus !== "voll") { console.log(`Probe fertig: ${liste.length} Bilder in ${BILDER}`); process.exit(0); }

// 4) Bildspur
const txt = liste.map((l) => `file '${l.datei}'\nduration ${l.d.toFixed(3)}`).join("\n") + `\nfile '${liste.at(-1).datei}'\n`;
fs.writeFileSync(path.join(ARBEIT, "bilder.txt"), txt);
ff(["-f", "concat", "-safe", "0", "-i", path.join(ARBEIT, "bilder.txt"), "-vf", "fps=25,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-tune", "stillimage", "-crf", String(T.crf || 24), "-r", "25", path.join(ARBEIT, "bild.mp4")]);

// 5) Tonspur: Sprecher je Szene mit Pausen, Lautheit angleichen
const RATE = 22050, teile = [];
for (const [i, p] of plan.entries()) {
  const wav = fs.readFileSync(path.join(ARBEIT, "vo", String(i).padStart(2, "0") + ".wav")); const daten = wav.subarray(wav.indexOf("data") + 8);
  const ges = Buffer.alloc(Math.round(p.dauer * RATE) * 2); daten.copy(ges, Math.round(VOR * RATE) * 2, 0, Math.min(daten.length, ges.length - Math.round(VOR * RATE) * 2)); teile.push(ges);
}
const pcm = Buffer.concat(teile), kopf = Buffer.alloc(44);
kopf.write("RIFF", 0); kopf.writeUInt32LE(36 + pcm.length, 4); kopf.write("WAVEfmt ", 8); kopf.writeUInt32LE(16, 16); kopf.writeUInt16LE(1, 20); kopf.writeUInt16LE(1, 22);
kopf.writeUInt32LE(RATE, 24); kopf.writeUInt32LE(RATE * 2, 28); kopf.writeUInt16LE(2, 32); kopf.writeUInt16LE(16, 34); kopf.write("data", 36); kopf.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(path.join(ARBEIT, "ton.wav"), Buffer.concat([kopf, pcm]));
const ziel = path.join(WURZEL, "film", T.datei);
ff(["-i", path.join(ARBEIT, "bild.mp4"), "-i", path.join(ARBEIT, "ton.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
  "-af", "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100", "-ac", "2", "-c:a", "aac", "-b:a", "112k", "-movflags", "+faststart", "-shortest", ziel]);
// 6) Vorschaubild (540×960) aus der gewählten Szene
const [vsz, vnr] = String(T.vorschauSzene || "").split("#"); // „szene“ oder „szene#2“ (zweites Bild der Szene)
const vb = liste.filter((l) => l.datei.endsWith(`-${vsz}.png`))[(Number(vnr) || 1) - 1] || liste[0];
ff(["-i", vb.datei, "-vf", "scale=540:960", "-quality", "82", path.join(WURZEL, "film", T.vorschau)]);
const gesamt = plan.reduce((s, p) => s + p.dauer, 0);
console.log(`Fertig: film/${T.datei} (${Math.floor(gesamt / 60)}:${String(Math.round(gesamt % 60)).padStart(2, "0")} Min., ${(fs.statSync(ziel).size / 1e6).toFixed(1)} MB), film/${T.vorschau}`);
