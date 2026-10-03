// Bildschirmfotos + Lage der Nummern + Ausschnitte einzelner Knöpfe für die Anleitung
import { launch, seite, S } from './basis.mjs';
import fs from 'fs';
const B = `${S}/anl/bild`, marken = {}, fehler = [];
const FINDE = `window.__finde = (z) => { let l = [];
  if (z.sel) l = [...document.querySelectorAll(z.sel)];
  else { l = [...document.querySelectorAll(z.in || '*')].filter((e) => e.offsetParent !== null && (e.textContent || '').includes(z.text)); l = l.filter((e) => !l.some((k) => k !== e && e.contains(k))); }
  l = l.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  return l[z.i || 0] || null; };`;
async function bild(p, name, ziele = []) {
  await p.waitForTimeout(700);
  await p.evaluate(() => { document.getElementById('updateBanner')?.remove(); document.querySelectorAll('.meldung').forEach((m) => m.remove()); });
  await p.evaluate(FINDE);
  await p.screenshot({ path: `${B}/${name}.png` });
  marken[name] = [];
  for (const z of ziele) {
    const r = await p.evaluate((z) => { const e = window.__finde(z); if (!e) return null; const r = e.getBoundingClientRect(); return { x: (r.left + r.width * (z.fx ?? 0)) / innerWidth * 100, y: (r.top + r.height * (z.fy ?? 0)) / innerHeight * 100 }; }, z);
    if (!r) fehler.push(`${name}: Ziel fehlt ${JSON.stringify(z)}`);
    marken[name].push(r ? { ...r, dx: z.dx || 0, dy: z.dy || 0 } : null);
  }
}
async function stueck(p, name, z, rand = 4) {
  await p.evaluate(FINDE);
  const ok = await p.evaluate((z) => { const e = window.__finde(z); if (!e) return false; e.scrollIntoView({ block: 'center' }); return true; }, z);
  if (!ok) { fehler.push(`Ausschnitt fehlt: ${name} ${JSON.stringify(z)}`); return; }
  await p.waitForTimeout(250);
  const r = await p.evaluate((z) => { const r = window.__finde(z).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, z);
  await p.screenshot({ path: `${B}/s-${name}.png`, clip: { x: Math.max(0, r.x - rand), y: Math.max(0, r.y - rand), width: r.w + 2 * rand, height: r.h + 2 * rand } });
}
const b = await launch();
// ---- ohne Link
let p = await seite(b, { ohneKey: true });
await stueck(p, 'ohne-link', { text: 'Persönlicher Link nötig', in: '.karte, section > div, div' });
await p.close();
// ---- Startseite einfach
p = await seite(b, { ansicht: 'einfach' });
await bild(p, 'start-einfach', [{ sel: '#statusChip' }, { sel: '#heroInfo h2' }, { sel: '.kacheln3 .mini', i: 0 }, { sel: '.kacheln3 .mini', i: 1 }, { sel: '.kacheln3 .mini', i: 2 },
  { sel: '.ansichtname.ein' }, { sel: '#versionMarke' }, { sel: '.kachel', i: 0, fx: 0.08 }, { sel: '.su-klein' }, { sel: '#fuss', fx: 0.04, fy: 0.15 }]);
await stueck(p, 'status', { sel: '#statusChip' }, 6);
await stueck(p, 'termin-karte', { sel: '#heroInfo' }, 2);
for (const i of [0, 1, 2]) await stueck(p, 'mini' + i, { sel: '.kacheln3 .mini', i }, 8);
await stueck(p, 'ansicht', { sel: '.ansichtname.ein' }); await stueck(p, 'version', { sel: '#versionMarke' });
await stueck(p, 'lupe', { sel: '.su-klein' }, 6); await stueck(p, 'fuss', { sel: '#fuss' }, 2);
const kach = ['Termine', 'Nachrichten', 'Pinnwand', 'Mein Dienst', 'Mitglieder', 'Meine Dokumente', 'SOS'];
for (const [i, t] of kach.entries()) await stueck(p, 'kachel' + i, { text: t, in: '.kachel' }, 2);
await stueck(p, 'heute-wichtig', { text: 'Heute wichtig', in: '.karte, div' }, 2);
await stueck(p, 'benachr-ein', { text: 'Benachrichtigungen', in: '.zeile, div' }, 4);
await stueck(p, 'mehr-funktionen', { text: 'Mehr Funktionen anzeigen', in: 'button' });
await stueck(p, 'app-schliessen', { text: 'App schließen', in: 'button' });
await p.evaluate(() => window.scrollTo(0, 0));
await p.close();
// ---- Startseite erweitert
p = await seite(b, { ansicht: 'erweitert' });
await bild(p, 'start-erweitert', [{ sel: '#leds' }, { sel: '#modusKnopf' }, { sel: '#aktualisierenKnopf' }, { sel: '.ipfeil.rechts.mit-sprung' }, { sel: '.ipfeil.rechts.sprung' },
  { sel: '#infoPunkte' }, { sel: '#register', fx: 0.05 }, { sel: '.kachel', i: 0, fx: 0.1 }]);
await stueck(p, 'leds', { sel: '#leds' }, 6); await stueck(p, 'modus', { sel: '#modusKnopf' }, 6); await stueck(p, 'aktualisieren', { sel: '#aktualisierenKnopf' }, 6);
await stueck(p, 'pfeile', { sel: '.ipfeil.rechts.mit-sprung' }, 6); await stueck(p, 'punkte', { sel: '#infoPunkte' }, 6); await stueck(p, 'register', { sel: '#register' }, 4);
// ---- Nachrichten
await p.evaluate(() => { window.scrollTo(0, 0); zeige('nachrichten'); });
await bild(p, 'nachrichten', [{ text: 'Neu', in: 'button' }, { text: 'Gruppe', in: 'button' }, { text: 'Gemerkt', in: 'button' }, { text: 'Test', in: 'button' },
  { sel: '.unterh', i: 0, fx: 0.15 }, { sel: '.unterh .punkt.wichtig' }, { sel: '.unterh', i: 1, fx: 0.15 }]);
await stueck(p, 'chat-zeile', { sel: '.unterh', i: 0 }, 2);
// ---- Chat
await p.evaluate(() => chatOeffnen('C1'));
await bild(p, 'chat', [{ text: '‹', in: '#v-chat .zurueck' }, { sel: '#chatTitel' }, { sel: '#chatTeilnehmer', fx: 0.2 }, { sel: '#chatVorlesenKnopf' }, { sel: '#chatSuchKnopf' }, { sel: '#chatMenueKnopf' },
  { sel: '#msg-M1', fx: 0.1 }, { sel: '#msg-M2', fx: 0.15 }, { sel: '#msg-M3', fx: 0.9 }, { sel: '#msg-M4 .zitat', fx: 0.1 }, { sel: '#msg-M1 .na-seite' }, { sel: '#text', fx: 0.1 }, { sel: '#sendenKnopf' }, { sel: '#mikroKnopf' }]);
const leiste = [['anlage', '#eingabe .innen > button.rund'], ['mikro', '#mikroKnopf'], ['emoji', '#emoKnopf'], ['zustell', '#zustellKnopf'], ['wichtig', '#wichtigKnopf'], ['wa', '#waKnopf'], ['waein', '#waEinfKnopf'], ['bf', '#bfChatKnopf'], ['senden', '#sendenKnopf']];
for (const [n, s] of leiste) await stueck(p, 'k-' + n, { sel: s }, 5);
await stueck(p, 'haken-1', { sel: '#msg-M5 .haken' }, 3); await stueck(p, 'haken-2', { sel: '#msg-M4 .haken' }, 3); await stueck(p, 'haken-3', { sel: '#msg-M2 .haken' }, 3);
await stueck(p, 'blase-wichtig', { sel: '#msg-M3' }, 6); await stueck(p, 'zitat', { sel: '#msg-M4' }, 4); await stueck(p, 'blase-reaktion', { sel: '#msg-M2' }, 6);
await stueck(p, 'na-seite', { sel: '#msg-M1 .na-seite' }, 4); await stueck(p, 'vorlesen', { sel: '#chatVorlesenKnopf' }, 6);
await p.evaluate(() => window.scrollTo(0, 0)); await stueck(p, 'chat-kopf', { sel: '#chatKopf .kopf2' }, 2);
await p.evaluate(() => wichtigUmschalten(true)); await stueck(p, 'wichtig-an', { sel: '#eingabe .innen' }, 4); await p.evaluate(() => wichtigUmschalten(false));
await p.evaluate(() => nachrichtMenue('M3')); await bild(p, 'chat-menue', []);
await p.evaluate(() => document.getElementById('naMenue')?.remove());
// ---- Termine
await p.evaluate(() => zeige('termine'));
await bild(p, 'termine', [{ text: 'Neu', in: '#v-termine button' }, { sel: '#v-termine .kopf2 button', i: 2 }, { text: 'Kalender', in: 'button' }, { text: 'Clubabend Oktober', in: '.klick, div', fx: 0.2, fy: 0.2 }, { text: 'Du kommst', in: 'span, div, b' }, { text: 'Geburtstage', in: 'h3, b, div', fx: 0.1 }]);
await p.evaluate(() => zumTreffen()); await p.waitForTimeout(1200);
await p.evaluate(() => { const k = [...document.querySelectorAll('button')].find((x) => /Ich\\s*komme/.test(x.textContent) && x.offsetParent); k?.scrollIntoView({ block: 'center' }); });
await bild(p, 'termin-offen', [{ text: 'Ich', in: 'button', fx: 0.3 }, { text: 'Vielleicht', in: 'button' }, { text: 'Kann', in: 'button' }, { text: 'Erika Beispiel, Max', in: 'div, span', fx: 0.1 }, { text: 'Mitfahren', in: 'b, h4, div', fx: 0.1 }, { text: 'In meinen Kalender', in: 'button', fx: 0.1 }]);
// ---- Mitglieder
await p.evaluate(() => { window.scrollTo(0, 0); zeige('mitglieder'); });
await bild(p, 'mitglieder', [{ sel: '#meinStatusKnopf' }, { sel: '#mgAnsichtOben', fx: 0.25 }, { text: 'Alle', in: 'button' }, { text: 'Online (2)', in: 'button' }, { text: 'Küchenteam', in: 'button' }, { text: 'online', in: 'p, div', fx: 0.05 },
  { text: 'Max Mustermann', in: '.mg-kachel, .kachel, div', fy: 0.15 }, { text: 'Erika Beispiel', in: '.mg-kachel, .kachel, div', fy: 0.15 }, { text: '💬', in: 'button' }, { text: '👋', in: 'button' }]);
// ---- Pinnwand (mit wichtigem Zettel)
await p.close();
const wichtigPw = JSON.parse(JSON.stringify((await import('./demo.mjs')).ANTWORTEN.pinnwand)); wichtigPw.zettel[0].wichtig = true;
p = await seite(b, { ansicht: 'erweitert', antworten: { pinnwand: wichtigPw } });
await p.evaluate(() => zeige('pinnwand'));
await bild(p, 'pinnwand', [{ text: 'Zettel', in: 'button' }, { text: 'Ein wichtiger Zettel', in: 'div, p', fx: 0.1 }, { text: 'WICHTIG', in: 'span, b, div' }, { text: 'Antworten', in: 'button' }, { text: 'erl.', in: 'button' }, { text: 'gelesen 1/2', in: 'summary, div, span' }, { text: 'abnehmen', in: 'button' }]);
// ---- SOS
await p.evaluate(() => sosStart()); await p.waitForTimeout(800);
await bild(p, 'sos', [{ text: 'Bei Lebensgefahr', in: 'div, p, b', fx: 0.1 }, { text: 'Feuerwehr', in: 'a, button, div', fx: 0.1 }, { text: 'Polizei', in: 'a, button, div', fx: 0.1 }, { text: 'Ärztlicher', in: 'a, button, div', fx: 0.1 }]);
await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => /Notfallpass ausfüllen/.test(x.textContent)); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -120); });
await bild(p, 'sos-unten', [{ text: 'Notfallpass ausfüllen', in: 'button' }, { text: 'Clubleitung', in: 'h3, h4, div', fx: 0.1 }, { text: 'Mitglieder im', in: 'h3, h4, div', fx: 0.1 }, { text: 'Max', in: '.sos-k, div', fy: 0.2 }]);
// ---- Einstellungen (erweitert)
for (const [name, klappe] of [['einst-ansagen', 'ansagen'], ['einst-benachrichtigung', 'benachrichtigung'], ['einst-privat', 'privat']]) {
  await p.evaluate((k) => { zeige('einstellungen'); const d = document.querySelector(`details[data-klappe="${k}"]`); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -10); } }, klappe);
  await bild(p, name, []);
}
// ---- Notbetrieb
await p.evaluate(() => { zeige('start'); window.scrollTo(0, 0); NOT.an = true; NOT.grund = 'auto'; NOT.stand = new Date(Date.now() - 20 * 60000).toISOString(); notBandZeigen(); });
await bild(p, 'notbetrieb', [{ sel: '#notBand', fx: 0.1 }]);
await stueck(p, 'not-band', { sel: '#notBand' }, 0);
await p.evaluate(() => { NOT.an = false; document.getElementById('notBand')?.remove(); });
fehler.push(...p.fehler.map((x) => 'Seite: ' + x));
await p.close(); await b.close();
fs.writeFileSync(`${S}/anl/marken.json`, JSON.stringify(marken, null, 1));
console.log(fehler.length ? fehler.join('\n') : 'alles gefunden');
