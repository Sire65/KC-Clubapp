import { chromium } from 'playwright';
import { ANTWORTEN } from './demo.mjs';
export const S = process.env.S;
export async function seite(b, opt = {}) {
  const ctx = await b.newContext({ viewport: { width: opt.w || 390, height: opt.h || 844 }, deviceScaleFactor: 2, serviceWorkers: 'block', locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const p = await ctx.newPage();
  p.fehler = []; p.on('pageerror', (e) => p.fehler.push(String(e).slice(0, 160)));
  const antw = { ...ANTWORTEN, ...(opt.antworten || {}) };
  if (opt.ansicht) antw.init = { ...antw.init, einstellungen: { ...antw.init.einstellungen, ansicht: { art: opt.ansicht, gewaehlt: true } } };
  // V4: Startfenster (Kurz erklärt, Spiel-Einladung) verdecken sonst die Bilder – nur wo gewollt (opt.mitEinweisung) an
  antw.init = { ...antw.init, einstellungen: { ...antw.init.einstellungen, ...(opt.mitEinweisung ? {} : { einweisung: { an: false, gesehen: {} } }), spiel_einladung: { an: false } } };
  // KC-TESTS-OHNE-ECHTSERVER: zuerst alles abschirmen – eigene Seite durch, alles andere abbrechen; die Regeln darunter beantworten Club-Server und Notbetrieb mit Testdaten
  await p.route("**/*", (r) => { const u = r.request().url(); return /^(http:\/\/localhost:8765\/|data:|blob:)/.test(u) ? r.continue() : r.abort(); });
  await p.routeWebSocket(/.*/, (ws) => ws.close()); // keine direkte Leitung (Supabase Realtime)
  await p.route('**/functions/v1/kc-club*', async (r) => {
    let a = '', q = {}; try { q = JSON.parse(r.request().postData() || '{}'); a = q.action; } catch {}
    const body = typeof antw[a] === 'function' ? antw[a](q) : antw[a] ?? { ok: true };
    await r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: JSON.stringify(body) });
  });
  await p.route('**/notbetrieb.json*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"modus":"aus","url":""}' }));
  await p.addInitScript((ohne) => { try { if (!ohne) localStorage.setItem('kc_club_key', 'a'.repeat(32)); localStorage.setItem('kc_club_begruesst_P1', '1'); localStorage.setItem('kc_club_version_gesehen', '9.9.9'); sessionStorage.setItem('kc_buero_gefragt', '1'); sessionStorage.setItem('kc_club_start_gemeldet', '1'); localStorage.setItem('kc_club_kuckuck', '0'); /* V10: keine Stunden-Uhr über den Bildern */ } catch {} }, !!opt.ohneKey);
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2500);
  await p.addStyleTag({ content: 'body > .meldung { display: none !important; } body.knoepfe-weg :is(.su-klein, .hz-frage, .hz-klick, .sb-knopf) { translate: none !important; opacity: 1 !important; transition: none !important; } /* Knöpfe gleiten beim Scrollen nicht weg (2.725.0) */' }); // V10: kurze Meldungen („Im Moment sind … online“) verdecken sonst Teile der Bilder
  await p.evaluate(() => { document.querySelectorAll('.blatt').forEach((x) => x.classList.add('versteckt')); document.getElementById('updateBanner')?.remove(); });
  return p;
}
// Position eines Elements in Prozent der Bildschirmansicht (für die Nummern im Bild)
export async function lage(p, sel) {
  return p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: (r.left + r.width / 2) / innerWidth * 100, y: (r.top + r.height / 2) / innerHeight * 100, l: r.left / innerWidth * 100, t: r.top / innerHeight * 100 }; }, sel);
}
// KC-TESTS-OHNE-ECHTSERVER: Netzsperre im Browser – außer localhost wird kein Name aufgelöst. Schützt auch vor Sendungen, die die App beim Schließen
// einer Seite noch mit keepalive verschickt (Wege, app.js spurSenden) – dann ist die Abschirmung der Seite schon weg.
export const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
export const NETZSPERRE = [OHNE_ECHTSERVER, "--no-proxy-server"];
export const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: [OHNE_ECHTSERVER, "--no-proxy-server"] });
