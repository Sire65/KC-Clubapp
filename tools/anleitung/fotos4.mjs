// Anleitung V4: Bilder der Funktionen ab 2.2 (Demodaten) – ergänzt bild/ und marken.json
import { launch, seite, S } from './basis.mjs';
import { ANTWORTEN } from './demo.mjs';
import fs from 'fs';
const B = `${S}/anl/bild`, marken = JSON.parse(fs.readFileSync(`${S}/anl/marken.json`, 'utf8')), fehler = [];
const sauber = (p, mitKa) => p.evaluate((mitKa) => { document.getElementById('updateBanner')?.remove(); document.querySelectorAll('.meldung').forEach((m) => m.remove()); if (!mitKa) document.querySelectorAll('.einw-karte').forEach((e) => e.remove()); }, !!mitKa);
async function bild(p, name, ziele = []) {
  await sauber(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(700); await sauber(p);
  await p.screenshot({ path: `${B}/${name}.png` });
  marken[name] = [];
  for (const z of ziele) {
    const r = await p.evaluate((z) => { const e = z.sel ? document.querySelectorAll(z.sel)[z.i || 0] : [...document.querySelectorAll(z.in || 'button')].find((x) => x.offsetParent && x.textContent.includes(z.text));
      if (!e) return null; const r = e.getBoundingClientRect(); return { x: (r.left + r.width * (z.fx ?? 0)) / innerWidth * 100, y: (r.top + r.height * (z.fy ?? 0)) / innerHeight * 100 }; }, z);
    if (!r) fehler.push(`${name}: Ziel fehlt ${JSON.stringify(z)}`);
    marken[name].push(r ? { ...r, dx: 0, dy: 0 } : null);
  }
}
async function stueck(p, name, sel, rand = 4, holen) {
  if (name !== 'kurz-erklaert') await sauber(p);
  const ok = await p.evaluate(([s, h]) => { const e = h ? document.querySelector(s)?.closest(h) : document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center' }); return true; }, [sel, holen]);
  if (!ok) { fehler.push('Ausschnitt fehlt: ' + name); return; }
  await p.waitForTimeout(350); await sauber(p, name === 'kurz-erklaert');
  const r = await p.evaluate(([s, h]) => { const e = h ? document.querySelector(s).closest(h) : document.querySelector(s); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, [sel, holen]);
  await p.screenshot({ path: `${B}/s-${name}.png`, clip: { x: Math.max(0, r.x - rand), y: Math.max(0, r.y - rand), width: Math.min(390, r.w + 2 * rand), height: Math.min(844, r.h + 2 * rand) } });
}
const zu = (p) => p.evaluate(() => document.querySelectorAll('.blatt:not(.versteckt)').forEach((b) => fensterZu(b)));
const oben = (p) => p.evaluate(() => window.scrollTo(0, 0));
const morgen = new Date(Date.now() + 2 * 86400000); morgen.setHours(18, 0, 0, 0);
const SPIELE = { ichBereit: true, meineSpiele: ['ttt', 'schach', 'bsk', 'kt'], spiele: [], rangliste: [{ person_id: 'P2', vorname: 'Erika', siege: 5, remis: 1, niederlagen: 2, spiele: 8, punkte: 11 }, { person_id: 'P1', vorname: 'Max', siege: 3, remis: 2, niederlagen: 3, spiele: 8, punkte: 8 }],
  monat: { name: 'Oktober 2026', liste: [{ person_id: 'P2', vorname: 'Erika', siege: 2, remis: 0, niederlagen: 0, spiele: 2, punkte: 4 }] }, pokalVormonat: { name: 'September 2026', sieger: [{ person_id: 'P3', vorname: 'Otto', siege: 4, punkte: 9 }] },
  bereit: [{ person_id: 'P2', vorname: 'Erika', name: 'Erika Beispiel', spiele: ['ttt', 'schach'] }, { person_id: 'P3', vorname: 'Otto', name: 'Otto Muster', spiele: ['ttt', 'bsk', 'kt'] }] };
const TA = { id: 'T1', anlass: '🍽️ Planung Grünkohlessen', beginn: morgen.toISOString(), ende: null, ort: 'Vereinsheim', status: 'offen', vonMir: false, von: { name: 'Erika Beispiel', vorname: 'Erika' },
  empfaenger: [{ person_id: 'P1', name: 'Max Mustermann', antwort: 'ja' }, { person_id: 'P3', name: 'Otto Muster', antwort: null }], meine: 'ja', frist: null, erinnerung: null, erinnerungStandard: 60 };
const UNT = JSON.parse(JSON.stringify(ANTWORTEN.unterhaltungen.unterhaltungen)); if (UNT[2]) UNT[2].archiviert = '2026-10-04T10:00:00Z';
const DW = { vertrag: 'KC_DP_WISH_INBOX_V1', veranstaltung: 'KC-WM-2026', name: 'Weihnachtsmarkt Werne 2026', ich: { personId: 'P1', name: 'Max Mustermann' }, wunschphase: { status: 'open' }, tage: [], meine: null, kollegen: [], teilen: [], schichten: [] };
const AN = ['Clubsprecher', 'Kassenwart', 'Hansi'];
const AE = { arten: [['anschrift', '🏠', 'Neue Anschrift'], ['name', '🪪', 'Neuer Name'], ['handy', '📱', 'Neue Handynummer'], ['festnetz', '☎️', 'Neue Festnetznummer'], ['mail', '✉️', 'Neue E-Mail-Adresse'],
  ['bank', '🏦', 'Neue Bankverbindung', true], ['geburtstag', '🎂', 'Geburtsdatum falsch'], ['notfall', '🆘', 'Notfallkontakt'], ['kleidung', '👕', 'Kleidergröße'], ['mitgliedschaft', '⏸️', 'Mitgliedschaft ruhen lassen / austreten'], ['sonstiges', '💬', 'Sonstiges']]
  .map(([id, sym, t, aus]) => ({ id, sym, t, an: [], anText: AN, felder: [], ...(aus ? { aus: true } : {}) })), anNamen: {}, stand: {}, meine: [] };
const b = await launch();
let p = await seite(b, { ansicht: 'erweitert', antworten: { spiele_liste: SPIELE, terminanfragen_liste: { anfragen: [TA] }, unterhaltungen: { unterhaltungen: UNT }, dienstwunsch_laden: DW, aenderung_start: AE, init: { ...ANTWORTEN.init, sosFuerAlle: true } } });
await zu(p);
// ---- Spiele
await p.evaluate(() => spStart()); await p.waitForTimeout(1500); await zu(p);
await p.evaluate(() => { document.querySelectorAll('.einw-karte').forEach((e) => e.remove()); zeige('spiele'); }); await p.waitForTimeout(800); await zu(p); await oben(p);
await bild(p, 'spiele', [{ sel: '.sp-kachel', i: 0 }, { sel: '.sp-kachel', i: 1 }, { sel: '.sp-kachel', i: 2 }, { sel: '.sp-kachel', i: 3 }]);
await p.evaluate(() => spStart('pc', 'ttt')); await p.waitForTimeout(900); await zu(p); await oben(p);
await p.evaluate(() => document.querySelectorAll('.sp-brett .sp-feld.frei')[4]?.click()); await p.waitForTimeout(1800);
await stueck(p, 'ttt', '.sp-brett', 10);
await p.evaluate(() => spStart('pc', 'schach')); await p.waitForTimeout(900); await zu(p);
await stueck(p, 'schach', '.sch-brett, .sp-brett', 8);
await p.evaluate(() => spStart('pc', 'bsk')); await p.waitForTimeout(1200); await zu(p);
await bild(p, 'bauernskat', []);
await p.evaluate(() => spStart('mg', 'ttt')); await p.waitForTimeout(1200); await zu(p); await oben(p);
await bild(p, 'spiele-mg', []);
// ---- Hilfe-Zentrum + „?“ + Kurz erklärt
await p.evaluate(() => zeige('hilfezentrum')); await p.waitForTimeout(900); await zu(p); await oben(p);
await bild(p, 'hilfezentrum', [{ sel: '#hzSuche' }]);
{ const q = await seite(b, { ansicht: 'erweitert', mitEinweisung: true }); await zu(q);
  await q.evaluate(() => zeige('nachrichten')); await q.waitForTimeout(1200); await zu(q);
  await stueck(q, 'kurz-erklaert', '.einw-karte', 6); await q.context().close(); }
await p.evaluate(() => zeige('nachrichten')); await p.waitForTimeout(900);
await zu(p); await stueck(p, 'frage-lupe', '#hzFrage', 40);
// ---- Chats archivieren
await p.evaluate(() => { document.querySelectorAll('.einw-karte').forEach((e) => e.remove()); unterhLaden(); }); await p.waitForTimeout(800);
await stueck(p, 'chat-archiv-zeile', '.uh-archiv-zeile', 8);
await p.evaluate(() => unterhTipp(UH.liste.find((u) => !u.archiviert).id)); await p.waitForTimeout(500);
await stueck(p, 'chat-aktionen', '.uhaktion', 6);
// ---- Terminanfrage + Erinnerung
await p.evaluate(() => { termineArt = 'liste'; zeige('termine'); }); await p.waitForTimeout(1200); await zu(p);
await p.evaluate(() => document.querySelectorAll('.einw-karte').forEach((e) => e.remove()));
await stueck(p, 'terminanfrage', '#ta-T1', 6);
await p.evaluate((t) => erinFragen(t), TA); await p.waitForTimeout(700);
await bild(p, 'erinnerung', [{ sel: '.erin-wahl button', i: 3 }, { sel: '#erinVortag' }, { sel: '.erin-weg', i: 0 }, { sel: '.erin-weg', i: 2 }, { sel: '#erinOk' }]);
await zu(p);
// ---- Meine Daten haben sich geändert
await p.evaluate(() => aeStart()); await p.waitForTimeout(900);
await bild(p, 'meine-daten', []);
await zu(p);
// ---- SOS an alle
await p.evaluate(() => notfallMeldung()); await p.waitForTimeout(700);
await bild(p, 'sos-alle', [{ sel: '#notfallText' }, { text: 'JETZT AN ALLE SENDEN' }]);
await zu(p);
// ---- Über die App
await p.evaluate(() => entwicklerZeigen()); await p.waitForTimeout(800);
await stueck(p, 'ueber-app', '.ew-kopf', 10);
await zu(p);
// ---- Dienstwünsche: Kopf + leerer Bogen
await p.evaluate(() => dwOeffnen()); await p.waitForTimeout(3500);
await stueck(p, 'dw-kopf', '.dw-kopf', 0);
await bild(p, 'dienstwuensche', [{ sel: '[data-k="zu"]' }, { sel: '[data-k="bogen"]' }, { sel: '[data-k="fertig"]' }]);
await p.click('[data-k="bogen"]'); await p.waitForSelector('#wbSeiten img', { timeout: 30000 }).catch(() => fehler.push('Bogen nicht erstellt'));
await p.waitForTimeout(600);
await stueck(p, 'bogen-seite', '#wbSeiten img', 4);
await stueck(p, 'bogen-knoepfe', '.wb-knoepfe', 6);
console.log('Seitenfehler', JSON.stringify(p.fehler.slice(0, 5)));
await b.close();
fs.writeFileSync(`${S}/anl/marken.json`, JSON.stringify(marken, null, 1));
console.log(fehler.length ? fehler.join('\n') : 'alles gefunden');
