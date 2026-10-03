// Baut die Club-App-Anleitung als PDF – Gestaltung wie „Kurzanleitung Bilderrechner“ (Kasse)
import { launch } from './basis.mjs';
import fs from 'fs';
import { VERSION, INHALT, GUT_ZU_WISSEN, START_SCHRITTE, TEILE } from './inhalt.mjs';
const S = process.env.S, D = `${S}/anl`, B = `${D}/bild`;
const MARKEN = JSON.parse(fs.readFileSync(`${D}/marken.json`, 'utf8'));
const datei = (n) => n === '@icon' ? `file://${B}/icon.png` : `file://${B}/${n}.png`;
const NEU = '<span class="neu">NEU</span>';
const bildMitNummern = (name, breite = 74) => {
  const m = (MARKEN[name] || []);
  return `<div class="tel" style="width:${breite}mm"><img src="${datei(name)}">${m.map((r, i) => r ? `<span class="nr" style="left:${r.x}%;top:${r.y}%">${i + 1}</span>` : '').join('')}</div>`;
};
const legende = (l) => `<table class="leg">${l.map(([t, x], i) => `<tr><td><span class="nrk">${i + 1}</span></td><td><b>${t}</b> – ${x}</td></tr>`).join('')}</table>`;
const zeilen = (z) => `<table class="zeilen">${z.map(([b, t, x, neu]) => `<tr><td class="b">${b ? `<img src="${datei(b)}"${/^s-(k-|haken|modus|aktualisieren|herz|vorlesen|pfeile|na-)/.test(b) ? ' class="kl"' : ''}>` : ''}</td><td><div class="zt">${t}${neu ? ' ' + NEU : ''}</div><div>${x}</div></td></tr>`).join('')}</table>`;
const abschnitt = (a) => `<h3 class="ab"><span class="nrk">${a.nr}</span> ${a.titel}</h3>${zeilen(a.zeilen)}`;
const seiteBild = (bild, leg, text) => `<div class="bs">${bildMitNummern(bild)}<div class="bs-r">${legende(leg)}${text ? `<p class="txt">${text}</p>` : ''}</div></div>`;
let html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
@font-face { font-family: Lato; src: url(file://${D}/fonts/Lato-Regular.ttf); font-weight: 400; }
@font-face { font-family: Lato; src: url(file://${D}/fonts/Lato-Bold.ttf); font-weight: 700; }
@font-face { font-family: Lato; src: url(file://${D}/fonts/Lato-Italic.ttf); font-style: italic; }
@page { size: A4; margin: 24mm 16mm 18mm 16mm; }
* { box-sizing: border-box; } body { font-family: Lato, sans-serif; font-size: 10.5pt; color: #222; margin: 0; line-height: 1.32; }
:root { --blau: #1f3a5f; --gruen: #2e7d32; --linie: #d9d9d9; }
.titel { text-align: center; padding-top: 18mm; } .titel img { width: 22mm; filter: brightness(0); } .titel h1 { font-size: 30pt; color: var(--blau); font-weight: 400; margin: 6mm 0 2mm; }
.titel h2 { font-size: 15pt; color: #555; margin: 0 0 2mm; } .titel .klein { color: #777; font-size: 9pt; }
h2.ih { color: var(--gruen); font-size: 14pt; margin: 10mm 0 3mm; } .inhalt { margin: 0 0 0 10mm; } .inhalt div { margin: 1.6mm 0; } .inhalt span { color: #666; }
.gut { margin-top: 10mm; border-left: 5px solid var(--gruen); background: #e8f5e9; border-radius: 2px; padding: 4mm 5mm; font-size: 9.5pt; } .gut p { margin: 0 0 2.5mm; }
.neu { background: var(--gruen); color: #fff; font-size: 6.5pt; font-weight: 700; padding: 1px 4px; border-radius: 2px; vertical-align: middle; letter-spacing: .03em; }
.teil { page-break-before: always; } h1.t { color: var(--blau); font-weight: 400; font-size: 20pt; margin: 0; } .unter { font-style: italic; color: #666; margin: 0 0 5mm; }
.schritte td { border-bottom: 1px solid var(--linie); padding: 3mm 2mm; vertical-align: middle; } .schritte { border-collapse: collapse; width: 100%; }
.sn { background: var(--gruen); color: #fff; font-weight: 700; font-size: 14pt; width: 8mm; height: 8mm; display: inline-flex; align-items: center; justify-content: center; }
.schritte .b { width: 62mm; text-align: center; } .schritte .b img { max-width: 58mm; max-height: 34mm; } .zt { color: var(--blau); font-weight: 700; margin-bottom: 1mm; }
.bs { display: flex; gap: 7mm; align-items: flex-start; margin-bottom: 4mm; } .bs-r { flex: 1; }
.tel { position: relative; flex: none; } .tel img { width: 100%; border: 1px solid #bbb; border-radius: 3mm; display: block; }
.nr { position: absolute; transform: translate(-45%, -55%); background: var(--blau); color: #fff; font-weight: 700; font-size: 8.5pt; min-width: 5mm; height: 5mm; border-radius: 1.2mm; display: inline-flex; align-items: center; justify-content: center; padding: 0 1px; box-shadow: 0 0 0 1.2px #fff; }
.nrk { background: var(--blau); color: #fff; font-weight: 700; font-size: 9pt; min-width: 5.2mm; height: 5.2mm; display: inline-flex; align-items: center; justify-content: center; border-radius: 1px; }
table.leg { border-collapse: collapse; width: 100%; } table.leg td { border-bottom: 1px solid var(--linie); padding: 1.6mm 1.5mm; vertical-align: top; font-size: 9.6pt; } table.leg td:first-child { width: 8mm; } table.leg b { color: var(--blau); }
h3.ab { color: var(--gruen); font-weight: 400; font-size: 13pt; margin: 6mm 0 1mm; display: flex; gap: 2.5mm; align-items: center; break-after: avoid; }
table.zeilen { border-collapse: collapse; width: 100%; } table.zeilen tr { break-inside: avoid; } table.zeilen td { border-bottom: 1px solid var(--linie); padding: 2.6mm 2mm; vertical-align: middle; }
table.zeilen td.b { width: 60mm; text-align: center; } table.zeilen td.b img { max-width: 56mm; max-height: 30mm; } table.zeilen td.b img.kl { max-height: 13mm; }
p.txt { margin: 3mm 0 0; } h2.w { color: var(--blau); font-weight: 400; font-size: 15pt; margin: 7mm 0 3mm; break-after: avoid; } .weiter { break-inside: avoid; }
.reihe { display: flex; gap: 4mm; justify-content: space-between; margin-bottom: 3mm; } .reihe img { width: 56mm; border: 1px solid #bbb; border-radius: 3mm; }
</style></head><body>
<section class="titel"><img src="file://${B}/muetze.webp"><h1>Köcheclub Werne</h1><h2>Club-App — Anleitung</h2><div class="klein">Anleitung Version ${VERSION.anleitung} · Club-App ${VERSION.app} · Stand ${VERSION.stand}</div></section>
<h2 class="ih">Inhalt</h2><div class="inhalt">${INHALT.map(([t, u]) => `<div><b>${t}</b> <span>– ${u}</span></div>`).join('')}</div>
<div class="gut">${GUT_ZU_WISSEN.map((x) => `<p>${x}</p>`).join('')}</div>
<section class="teil"><h1 class="t">So fängst du an</h1><p class="unter">Vom Link bis zur fertigen App – in ${START_SCHRITTE.length} Schritten</p>
<table class="schritte">${START_SCHRITTE.map(([b, t, x], i) => `<tr><td style="width:12mm"><span class="sn">${i + 1}</span></td><td class="b"><img src="${datei(b)}"${b === '@icon' ? ' style="max-height:20mm"' : ''}></td><td><div class="zt">${t}</div>${x}</td></tr>`).join('')}</table></section>`;
for (const t of TEILE) {
  html += `<section class="teil"><h1 class="t">${t.titel}</h1><p class="unter">${t.unter}</p>`;
  if (t.bild) html += seiteBild(t.bild, t.legende, t.text);
  if (t.bilderReihe) html += `<div class="reihe">${t.bilderReihe.map((b) => `<img src="${datei(b)}">`).join('')}</div>`;
  for (const a of t.abschnitte || []) html += abschnitt(a);
  for (const w of t.weiter || []) {
    html += `<div class="weiter"><h2 class="w">${w.titel}</h2>${w.legende ? seiteBild(w.bild, w.legende, w.text) : `<div class="bs">${bildMitNummern(w.bild, 66)}<div class="bs-r"><p class="txt" style="margin-top:0">${w.text}</p></div></div>`}</div>`;
    for (const a of w.abschnitte || []) html += abschnitt(a);
  }
  html += `</section>`;
}
html += `</body></html>`;
fs.writeFileSync(`${D}/anleitung.html`, html);
const muetze = fs.readFileSync(`${B}/muetze.webp`).toString('base64');
const b = await launch(); const p = await (await b.newContext()).newPage();
await p.goto(`file://${D}/anleitung.html`); await p.waitForTimeout(1500);
await p.pdf({ path: `${D}/Koecheclub-App_Anleitung.pdf`, format: 'A4', printBackground: true, displayHeaderFooter: true, preferCSSPageSize: true,
  headerTemplate: `<div style="width:100%;margin:0 16mm;font-family:Lato,sans-serif;font-size:9px;display:flex;align-items:flex-end;justify-content:space-between;border-bottom:1.6px solid #1f3a5f;padding-bottom:5px"><span style="display:flex;align-items:center;gap:8px;color:#1f3a5f;font-weight:700;font-size:11px"><img src="data:image/webp;base64,${muetze}" style="height:18px;filter:brightness(0)">Köcheclub Werne</span><span style="color:#555">Club-App · Anleitung · Version ${VERSION.anleitung}</span></div>`,
  footerTemplate: `<div style="width:100%;text-align:center;font-family:Lato,sans-serif;font-size:9px;color:#666">Seite <span class="pageNumber" style="font-size:11px;color:#222"></span> von <span class="totalPages" style="font-size:11px;color:#222"></span></div>` });
await b.close(); console.log('PDF fertig');
