async function sicherGleich(a:string,b:string){const h=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));const [x,y]=await Promise.all([h(a),h(b)]);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0}
// KC-SEC-TOKEN-COMPARE – function source 6
// KC WM Umfrage - Sofort-Benachrichtigung (Admin-Mail + Dankes-Mail an Teilnehmer).
// 23.09.2026 (Betreiber: "Push leicht verzoegert ok, Email zusaetzlich, alles soll ueber
// KC Communicator laufen"): wird von einem Datenbank-Trigger auf kc_wm_umfrage_protokoll
// aufgerufen, sobald eine Person ihre Befragung abgeschlossen hat.
// 23.09.2026, zweite Fassung (Betreiber gab den echten Dankes-Mail-Text mit Spruch-Zitat und
// persoenlichem Push-Link vor): Dankes-Mail zeigt jetzt den gewaehlten Spruch im Wortlaut,
// einen zur Darstellung passenden Satz, und einen frischen persoenlichen Push-Link
// (https://sire65.github.io/KC-Spruchauswahl/push.html?t=<Token>, Format aus push.html
// bestaetigt). Der alte Token ist nur als Hash gespeichert und daher nicht wiederherstellbar -
// ein neuer Token ersetzt ihn; das macht nichts kaputt, da bereits eingerichtete
// Push-Anmeldungen an der Person haengen, nicht am Token.
// ECHTER FUND beim ersten Testversand: Zitatende und "Du erscheinst..." klebten ohne
// Zeilenumbruch aneinander - jetzt immer ein Absatz davor, auch im kein_interesse-Fall ohne
// Spruch-Zitat.
import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const ADMIN_PERSON = 'KC-P-002';
const PUSH_BASE = 'https://sire65.github.io/KC-Spruchauswahl/push.html';
const WAHL: Record<string, string> = { A: 'Version A', B: 'Version B', gleich: 'beide gleich', kein_interesse: 'kein Interesse' };
const DARST: Record<string, string> = {
  vorname_spruch: 'Vorname', vorname_spruch_foto: 'Vorname + Foto',
  vollname_spruch: 'voller Name', vollname_spruch_foto: 'voller Name + Foto', keine: 'erscheint nicht',
};
const ERSCHEINT: Record<string, string> = {
  vorname_spruch: 'Du erscheinst in der Präsentation mit deinem Vornamen und Spruch.',
  vorname_spruch_foto: 'Du erscheinst in der Präsentation mit deinem Vornamen, Spruch und Foto.',
  vollname_spruch: 'Du erscheinst in der Präsentation mit deinem vollen Namen und Spruch.',
  vollname_spruch_foto: 'Du erscheinst in der Präsentation mit deinem vollen Namen, Spruch und Foto.',
  keine: 'Du erscheinst nicht in der Präsentation.',
};

async function secret(db: any, name: string) {
  const { data, error } = await db.rpc('kc_communication_get_server_secret', { p_name: name });
  if (error) return '';
  return String(data || '');
}

async function route(url: string, serviceKey: string, eventKey: string, recipients: any[], variables: any, correlationId: string) {
  const r = await fetch(`${url}/functions/v1/kc-communication-router`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
    body: JSON.stringify({ sourceProgram: 'kc-wm', eventKey, recipients, variables, correlationId, channelOrder: ['email'] }),
  });
  const out = await r.json().catch(() => ({}));
  return { ok: r.ok && out?.ok === true, status: r.status, out };
}

async function frischerPushLink(admin: any, personId: string) {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const hash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const { error } = await admin.from('kc_wm_spruch_einladung')
    .upsert({ person_id: personId, token_hash: hash }, { onConflict: 'person_id' });
  if (error) return '';
  return `${PUSH_BASE}?t=${token}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok');
  if (req.method !== 'POST') return json({ ok: false, grund: 'POST erforderlich' }, 405);

  const supaUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const expected = await secret(admin, 'kc_wm_umfrage_notify_token');
  const given = req.headers.get('x-kc-wm-notify-token') || '';
  if (!expected || !await sicherGleich(given||'',String(expected))) return json({ ok: false, grund: 'nicht_berechtigt' }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ ok: false, grund: 'ungueltige_anfrage' }, 400); }
  const personId = String(body.personId || '');
  if (!personId) return json({ ok: false, grund: 'personId_fehlt' }, 400);

  const { data: person } = await admin.from('kc_core_people')
    .select('person_id, display_name, given_name, preferred_name').eq('person_id', personId).maybeSingle();
  if (!person) return json({ ok: false, grund: 'person_unbekannt' }, 404);
  const vorname = person.preferred_name || person.given_name || person.display_name || '';

  const { data: fb } = await admin.from('kc_wm_presentation_feedback').select('choice').eq('person_id', personId).maybeSingle();
  const { data: sp } = await admin.from('kc_wm_spruch_auswahl').select('spruch_id, darstellung').eq('person_id', personId).maybeSingle();

  let spruchText = '';
  if (sp?.spruch_id) {
    const { data: sk } = await admin.from('kc_wm_spruch_katalog').select('text').eq('spruch_id', sp.spruch_id).maybeSingle();
    spruchText = sk?.text || '';
  }

  const correlationId = `wm-instant:${personId}:${Date.now()}`;
  const dankeCorrelationId = `wm-instant:${personId}:danke`;

  const adminResult = await route(supaUrl, serviceKey, 'umfrage_admin_meldung',
    [{ personId: ADMIN_PERSON }],
    { name: person.display_name || personId, wahl: fb?.choice ? (WAHL[fb.choice] || fb.choice) : '(noch offen)', spruch: sp?.spruch_id ? String(sp.spruch_id) : '(kein Spruch)', darstellung: sp?.darstellung ? (DARST[sp.darstellung] || sp.darstellung) : '(offen)' },
    correlationId + ':admin');

  // Dankes-Mail strikt nur einmal pro Person.
  // Bereits protokollierter Versand wird übersprungen. Neue Sendungen verwenden
  // eine stabile correlationId; der KC Communicator bildet daraus einen
  // eindeutigen Idempotenz-Schlüssel.
  const { data: dankeSchon } = await admin.from('kc_wm_danke_mail')
    .select('person_id')
    .eq('person_id', personId)
    .maybeSingle();

  let dankeResult: any = {
    ok: true,
    skipped: !!dankeSchon,
    grund: dankeSchon ? 'bereits_gesendet' : null,
    status: 200,
    out: dankeSchon ? { deduplicated: true } : null,
  };

  if (!dankeSchon) {
    const pushLink = await frischerPushLink(admin, personId);
    let spruchBlock = '';
    let erscheintSatz = '';
    if (fb?.choice === 'kein_interesse') {
      erscheintSatz = 'Du erscheinst nicht in der Präsentation.';
    } else if (sp?.darstellung && sp.darstellung !== 'keine' && spruchText) {
      spruchBlock = '\n\nDein Spruch für den TV an der Nebenhütte:\n\n' + `„${spruchText}"`;
      erscheintSatz = ERSCHEINT[sp.darstellung] || '';
    } else if (sp?.darstellung === 'keine') {
      erscheintSatz = ERSCHEINT.keine;
    }
    if (erscheintSatz) erscheintSatz = '\n\n' + erscheintSatz;

    dankeResult = await route(supaUrl, serviceKey, 'umfrage_danke',
      [{ personId }],
      { vorname, spruch_block: spruchBlock, erscheint_satz: erscheintSatz, push_link: pushLink || PUSH_BASE },
      dankeCorrelationId);
  }

  return json({ ok: true, admin: { ok: adminResult.ok, status: adminResult.status, out: adminResult.out }, danke: { ok: dankeResult.ok, skipped: !!dankeResult.skipped, grund: dankeResult.grund || null, status: dankeResult.status, out: dankeResult.out } });
});

