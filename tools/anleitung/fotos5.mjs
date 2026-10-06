// Anleitung V6: Bilder der Neuerungen ab 2.23.43 (Demodaten) – ergänzt bild/ und marken.json
import { launch, seite, S } from './basis.mjs';
import { ANTWORTEN } from './demo.mjs';
import fs from 'fs';
const B = `${S}/anl/bild`, marken = JSON.parse(fs.readFileSync(`${S}/anl/marken.json`, 'utf8')), fehler = [];
const sauber = (p) => p.evaluate(() => { document.getElementById('updateBanner')?.remove(); document.querySelectorAll('.meldung,.einw-karte').forEach((m) => m.remove()); document.querySelectorAll('.neu-puls').forEach((k) => k.classList.remove('neu-puls')); });
async function bild(p, name, ziele = [], scroll = 0) {
  await sauber(p); await p.evaluate((y) => window.scrollTo(0, y), scroll); await p.waitForTimeout(700); await sauber(p);
  await p.screenshot({ path: `${B}/${name}.png` });
  marken[name] = [];
  for (const z of ziele) {
    const r = await p.evaluate((z) => { const e = z.sel ? document.querySelectorAll(z.sel)[z.i || 0] : [...document.querySelectorAll(z.in || 'button')].find((x) => x.offsetParent && x.textContent.includes(z.text));
      if (!e) return null; const r = e.getBoundingClientRect(); return { x: (r.left + r.width * (z.fx ?? 0)) / innerWidth * 100, y: (r.top + r.height * (z.fy ?? 0)) / innerHeight * 100 }; }, z);
    if (!r) fehler.push(`${name}: Ziel fehlt ${JSON.stringify(z)}`);
    marken[name].push(r ? { ...r, dx: 0, dy: 0 } : null);
  }
}
async function stueck(p, name, sel, rand = 4) {
  await sauber(p);
  const ok = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center' }); return true; }, sel);
  if (!ok) { fehler.push('Ausschnitt fehlt: ' + name); return; }
  await p.waitForTimeout(400); await sauber(p);
  const r = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
  await p.screenshot({ path: `${B}/s-${name}.png`, clip: { x: Math.max(0, r.x - rand), y: Math.max(0, r.y - rand), width: Math.min(390, r.w + 2 * rand), height: Math.min(844, r.h + 2 * rand) } });
}
const zu = (p) => p.evaluate(() => document.querySelectorAll('.blatt:not(.versteckt)').forEach((b) => fensterZu(b)));
// Demo: Figuren und Zustände (erfundene Daten)
const FIG = ['m05', 'w03', 'm11', 'w08', 'm02', 'w12', 'm09', 'w05'];
const mg = (q) => { const r = typeof ANTWORTEN.mitglieder === 'function' ? ANTWORTEN.mitglieder(q) : ANTWORTEN.mitglieder; const c = JSON.parse(JSON.stringify(r));
  (c.mitglieder || c).forEach((m, i) => { if (i < FIG.length) m.avatar = FIG[i]; if (i === 1 || i === 4) m.online = true; if (i === 2) m.heute = true; }); return c; };
const b = await launch();
const p = await seite(b, { antworten: { mitglieder: mg, mitglied_details: (q) => ({ person_id: q.person_id, name: 'Erika Beispiel', vorname: 'Erika', aemter: ['Clubsprecher'], avatar: 'w03', kontakt: { handy: '0170 1234567' }, freigegeben: null, darfKontakte: true, selbst: false, status: null }) } });
// 1) Mitglieder-Kacheln mit Bild, Abzeichen, 📞/🎥 und 📋
await p.evaluate(() => { mgAnsichtSetzen('kacheln'); zeige('mitglieder'); }); await p.waitForTimeout(1200);
await p.evaluate(() => document.querySelector('.mg-kacheln')?.scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
const yK = await p.evaluate(() => window.scrollY - 70);
await bild(p, 'neu-mitglieder', [{ sel: '.mg-kachel .avatar.mit-figur', i: 1, fx: .5, fy: .1 }, { sel: '.mg-kachel .k-abz.a-online', fx: .9, fy: .5 }, { sel: '.mg-kachel .mg-knoepfe button[title="Anrufen"]', i: 0, fx: .5, fy: .1 }, { sel: '.mg-kachel .mg-knoepfe button[title="Videoanruf"]', i: 0, fx: .5, fy: .1 }], yK);
// 2) Anwesenheitstafel
await p.evaluate(() => mgAnsichtSetzen('tafel')); await p.waitForTimeout(800);
await p.evaluate(() => document.querySelector('#mgAnsichtOben')?.scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
const yT = await p.evaluate(() => window.scrollY - 10);
await bild(p, 'neu-tafel', [{ sel: '#mgAnsichtOben button[data-a="tafel"]', fx: .5, fy: .5 }, { sel: '.mg-tafel .mg-led', fx: .5, fy: .5 }, { sel: '.mg-tafel button', i: 2, fx: .88, fy: .5 }], yT);
await p.evaluate(() => mgAnsichtSetzen('kacheln'));
// 3) Mitglied öffnen: Bild oben, antippen = groß
const pid = await p.evaluate(() => MITGLIEDER[1].person_id);
await p.evaluate((pid) => mitgliedOeffnen(pid), pid); await p.waitForTimeout(900);
await stueck(p, 'mitglied-bild', '#mitgliedInhalt .karte');
await p.evaluate((pid) => avGross(pid), pid); await p.waitForTimeout(600);
await stueck(p, 'bild-gross', '#avGrossBlatt .blatt-inhalt, #avGrossBlatt > div', 2);
await zu(p);
// 4) Mein Bild – Figuren
await p.evaluate(() => avWahl()); await p.waitForTimeout(600);
await stueck(p, 'mein-bild', '#avBlatt .av-raster', 4);
await zu(p);
// 5) Chat: Pfeil-Menü und ⋮ „Ganzer Chat“
await p.evaluate(() => chatOeffnen('C1')); await p.waitForTimeout(1500);
const mid = await p.evaluate(() => [...document.querySelectorAll('.na-pfeil')].map((b) => b.getAttribute('onclick')).find(Boolean)?.match(/'([^']+)'/)?.[1]);
if (mid) { await p.evaluate((id) => naPfeilMenue(id), mid); await p.waitForTimeout(700); await stueck(p, 'pfeil-menue', '.blatt:not(.versteckt) .na-pfeil-knoepfe', 6); await zu(p); } else fehler.push('kein Pfeil im Demo-Chat');
await p.evaluate(() => chatMenue()); await p.waitForTimeout(700);
await stueck(p, 'chat-ganz', '#chatBlatt .na-pfeil-knoepfe', 30);
await p.evaluate(() => $('chatBlatt').classList.add('versteckt'));
fs.writeFileSync(`${S}/anl/marken.json`, JSON.stringify(marken));
console.log(fehler.length ? fehler.join('\n') : 'alles gefunden', p.fehler);
await b.close();
