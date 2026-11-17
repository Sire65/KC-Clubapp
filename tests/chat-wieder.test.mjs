// KC-CLUB-CHAT-WIEDER (16.11.2026, Wunsch Hansi „schnell, auch wenn mehrere drin sind – nicht immer alles lesen“): Chat erneut öffnen –
// unveränderter, vollständig gemerkter Chat (≤ 5 Min. seit dem letzten vollen Laden) wird nicht ganz neu geladen, nur der Fingerabdruck gefragt.
// Aufruf: node tests/chat-wieder.test.mjs (offline)
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const oe = app.slice(app.indexOf("async function chatOeffnen("), app.indexOf("let chatStand = \"\";"));
assert.ok(/if \(merk\.voll && merk\.u\?\.stand && Date\.now\(\) - merk\.zeit < CHAT_VOLL_MS\) try \{ const r = await api\("unterhaltung_stand", \{ id \}\); gleich = chatId === offenId && !!r\?\.stand && r\.stand === merk\.u\.stand; \}/.test(oe), "nur vollständig gemerkt, frisch, gleicher Fingerabdruck");
assert.ok(oe.includes("if (gleich) { CHAT_VOLL_AM = merk.zeit; $(\"chatTeilnehmer\").textContent = CHAT_TN_NORMAL; }"), "Takt lädt spätestens 5 Min. nach dem letzten vollen Laden wieder ganz; Hinweis „wird aktualisiert“ verschwindet");
assert.ok(app.includes("CHAT_TN_NORMAL = $(\"chatTeilnehmer\").textContent;"), "normaler Teilnehmer-Text gemerkt");
assert.ok(oe.includes("else { chatStand = s0; NA.idStand = i0; await chatLaden(true); }") && oe.includes("} else await chatLaden(true);"), "sonst wie bisher ganz laden");
assert.ok(app.includes("voll: u.nachrichten.length <= CHAT_MERK_NACHR"), "Merker weiß, ob er vollständig ist");
assert.ok(app.includes("const CHAT_VOLL_MS = 5 * 60000;"), "5 Minuten");
// Ablauf nachspielen
const lauf = async ({ merk, stand, alter = 60000 }) => {
  let voll = 0, standFragen = 0; const CHAT_VOLL_MS = 300000;
  const m = merk ? { zeit: Date.now() - alter, voll: merk.voll, u: { stand: "S1" } } : null;
  const chatLaden = async (s, mk) => { if (!mk) voll++; };
  const api = async (a) => { standFragen++; return { stand }; };
  let gleich = false; const chatId = "c", offenId = "c", id = "c";
  if (m) { await chatLaden(true, m);
    if (m.voll && m.u?.stand && Date.now() - m.zeit < CHAT_VOLL_MS) try { const r = await api("unterhaltung_stand", { id }); gleich = chatId === offenId && !!r?.stand && r.stand === m.u.stand; } catch {}
    if (!gleich) await chatLaden(true);
  } else await chatLaden(true);
  return { voll, standFragen };
};
assert.deepEqual(await lauf({ merk: { voll: true }, stand: "S1" }), { voll: 0, standFragen: 1 }, "unverändert → nur Fingerabdruck");
assert.deepEqual(await lauf({ merk: { voll: true }, stand: "S2" }), { voll: 1, standFragen: 1 }, "geändert → ganz laden");
assert.deepEqual(await lauf({ merk: { voll: false }, stand: "S1" }), { voll: 1, standFragen: 0 }, "langer Chat (Merker gekürzt) → ganz laden");
assert.deepEqual(await lauf({ merk: { voll: true }, stand: "S1", alter: 400000 }), { voll: 1, standFragen: 0 }, "älter als 5 Min. → ganz laden");
assert.deepEqual(await lauf({ merk: null, stand: "S1" }), { voll: 1, standFragen: 0 }, "ohne Merker → ganz laden");
console.log("✅ chat-wieder: alle Prüfungen bestanden");
