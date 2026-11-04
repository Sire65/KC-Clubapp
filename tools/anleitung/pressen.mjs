// V10: große Bildschirmfotos in bild/ verkleinern (wie klein.mjs, aber direkt in bild/), damit die PDF unter ~10 MB bleibt.
// Aufruf im Arbeitsordner $S/anl:  node <repo>/tools/anleitung/pressen.mjs   (F = Faktor, Standard 0.75; GRENZE in Bytes, Standard 150000)
// Nur ganze Seiten (ohne „s-“-Ausschnitte); schon verkleinerte JPEG-Bilder (aus klein.mjs) werden übersprungen.
import { chromium } from 'playwright'; import fs from 'fs';
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const F = Number(process.env.F || 0.75), GRENZE = Number(process.env.GRENZE || 150000);
const liste = fs.readdirSync('bild').filter((n) => n.endsWith('.png') && !n.startsWith('s-') && fs.statSync(`bild/${n}`).size > GRENZE)
  .filter((n) => fs.readFileSync(`bild/${n}`).subarray(0, 4).toString('hex') === '89504e47'); // echtes PNG
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: [OHNE_ECHTSERVER, "--no-proxy-server"] }); const p = await b.newPage();
let vorher = 0, nachher = 0;
for (const n of liste) {
  const roh = fs.readFileSync(`bild/${n}`); vorher += roh.length;
  const out = await p.evaluate(async ([src, F]) => { const i = new Image(); i.src = src; await i.decode(); const w = Math.round(i.width * F), h = Math.round(i.height * F);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(i, 0, 0, w, h); return c.toDataURL('image/jpeg', 0.86); }, ['data:image/png;base64,' + roh.toString('base64'), F]);
  const neu = Buffer.from(out.split(',')[1], 'base64'); nachher += neu.length; fs.writeFileSync(`bild/${n}`, neu);
}
await b.close(); console.log(`${liste.length} Bilder: ${(vorher / 1e6).toFixed(1)} MB → ${(nachher / 1e6).toFixed(1)} MB`);
