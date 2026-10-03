import { chromium } from 'playwright';
import { ANTWORTEN } from './demo.mjs';
export const S = process.env.S;
export async function seite(b, opt = {}) {
  const ctx = await b.newContext({ viewport: { width: opt.w || 390, height: opt.h || 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const p = await ctx.newPage();
  p.fehler = []; p.on('pageerror', (e) => p.fehler.push(String(e).slice(0, 160)));
  const antw = { ...ANTWORTEN, ...(opt.antworten || {}) };
  if (opt.ansicht) antw.init = { ...antw.init, einstellungen: { ...antw.init.einstellungen, ansicht: { art: opt.ansicht, gewaehlt: true } } };
  await p.route('**/functions/v1/kc-club*', async (r) => {
    let a = ''; try { a = JSON.parse(r.request().postData() || '{}').action; } catch {}
    const body = antw[a] ?? { ok: true };
    await r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: JSON.stringify(body) });
  });
  await p.route('**/notbetrieb.json*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"modus":"aus","url":""}' }));
  await p.addInitScript((ohne) => { try { if (!ohne) localStorage.setItem('kc_club_key', 'a'.repeat(32)); localStorage.setItem('kc_club_begruesst_P1', '1'); localStorage.setItem('kc_club_version_gesehen', '9.9.9'); sessionStorage.setItem('kc_buero_gefragt', '1'); sessionStorage.setItem('kc_club_start_gemeldet', '1'); } catch {} }, !!opt.ohneKey);
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll('.blatt').forEach((x) => x.classList.add('versteckt')); document.getElementById('updateBanner')?.remove(); });
  return p;
}
// Position eines Elements in Prozent der Bildschirmansicht (für die Nummern im Bild)
export async function lage(p, sel) {
  return p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: (r.left + r.width / 2) / innerWidth * 100, y: (r.top + r.height / 2) / innerHeight * 100, l: r.left / innerWidth * 100, t: r.top / innerHeight * 100 }; }, sel);
}
export const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
