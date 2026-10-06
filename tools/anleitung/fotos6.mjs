// Anleitung V7: Bilder der Neuerungen ab 2.23.96 (Demodaten) – ergänzt bild/ und marken.json
import { launch, seite, S } from './basis.mjs';
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
const b = await launch();
const p = await seite(b);
// 1) 👋 Meldung beim Öffnen (erfundene Zahlen: 3 Nachrichten, davon 1 in Gruppen, 1 Zettel, 1 Spiel)
await p.evaluate(() => { zeige('start'); INIT.ungelesen = 3; INIT.ungelesenGruppen = 1; INIT.spieleDran = 1; RUHE_INFO = false; START_HASH = ''; window.scrollTo(0, 0);
  wasNeuZeigen([{ id: 'Z8', text: 'Schürzen abgeben' }]); });
await p.waitForTimeout(900);
await bild(p, 'neu7-wasneu', [{ sel: '#wasNeuBlatt .wn-zeile', i: 0, fx: .95, fy: .5 }, { sel: '#wasNeuBlatt [data-wn="n"]', fx: .95, fy: .5 }, { sel: '#wasNeuBlatt [data-wn="p"]', fx: .95, fy: .5 }, { sel: '#wasNeuBlatt [data-wn="sp"]', fx: .95, fy: .5 }, { sel: '#wasNeuBlatt [data-wn="aus"]', fx: 1.05, fy: .5 }]);
await zu(p);
// 2) 🃏 Bauernskat: ich bin Vorhand und sage Trumpf an
await p.evaluate(() => { lsSetzen(SP_HINWEIS, '1'); spStart('pc', 'bsk'); }); await p.waitForTimeout(800);
await p.evaluate(() => { BSK.runde = 0; BSK.stand = { ich: 2, pc: 1 }; bskPcNeu(false); bskTeilenEnde(); bskPcZeigen(); }); await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('.sp-karte .sp-status')?.scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
const yB = await p.evaluate(() => window.scrollY - 60);
await bild(p, 'neu7-bsk', [{ sel: '.bsk-ansage button', i: 0, fx: .1, fy: .15 }, { sel: '.bsk-tisch', i: 0, fx: .02, fy: .05 }, { sel: '.bsk-trumpf', fx: .1, fy: .15 }, { sel: '.bsk-tisch', i: 1, fx: .02, fy: .05 }], yB);
// 3) 👑 Gruppen-Admin: Gruppe bearbeiten mit Krone je Mitglied (erfundene Gruppe)
await p.evaluate(() => gruppeForm({ id: 'G7', teilnehmer: [{ person_id: 'P1', name: 'Max Mustermann' }, { person_id: 'P2', name: 'Erika Beispiel' }, { person_id: 'P3', name: 'Paul Probe' }, { person_id: 'P5', name: 'Otto Muster' }],
  gruppe: { name: 'Küchenteam', symbol: '🍳', erstellt_von: 'P1', admins: ['P2'] } })); await p.waitForTimeout(1200);
await p.evaluate(() => document.querySelector('#grListe')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
await stueck(p, 'gruppen-admin', '#grListe', 6);
// 4) 👑 Nachfolger beim Verlassen
await p.evaluate(() => { grNachfolgerWahl([{ person_id: 'P2', name: 'Erika Beispiel' }, { person_id: 'P3', name: 'Paul Probe' }, { person_id: 'P5', name: 'Otto Muster' }], { erstellt_von: 'P1', admins: ['P2'] }); }); await p.waitForTimeout(700);
await stueck(p, 'gruppe-uebergeben', '.gr-nachfolger', 70);
fs.writeFileSync(`${S}/anl/marken.json`, JSON.stringify(marken));
console.log(fehler.length ? fehler.join('\n') : 'alles gefunden', p.fehler);
await b.close();
