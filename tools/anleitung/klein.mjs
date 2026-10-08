import { chromium } from 'playwright'; import fs from 'fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage();
for (const n of process.argv.slice(2)) {
  const src = 'data:image/png;base64,' + fs.readFileSync(`bild-orig/${n}.png`).toString('base64');
  const F = Number(process.env.F || 0.62); const out = await p.evaluate(async ([src, F]) => { const i = new Image(); i.src = src; await i.decode(); const w = Math.round(i.width * F), h = Math.round(i.height * F);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(i, 0, 0, w, h); return c.toDataURL("image/jpeg", 0.86); }, [src, F]);
  fs.writeFileSync(`bild/${n}.png`, Buffer.from(out.split(',')[1], 'base64'));
}
await b.close();
