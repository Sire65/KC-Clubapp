// ---------- 3.45.0 KC-CLUB-AUFBAU-CHECK (Wunsch Hansi 26.11.2026 „Wenn am 03.12. der Stand aufgebaut ist und das ganze System steht, checken ob alles
// läuft – Mini-PC, Router, 3 Kassen, TV mit Präsentation usw. Alles checken und abhaken“). Admin-Zentrale → 🧰 Aufbau-Check (nur Clubleitung).
// Oben „Automatisch geprüft“ aus den Technik-Meldungen des Mini-PCs (Server aufbau_check: Mini-PC, Manager-Dienst, Kassen gekoppelt und aktiv,
// WLAN-Verzögerung, Fernseher holt die Präsentation, Kassen-QR, PC-Manager, Preise). Darunter die Liste zum Abhaken – je Tag gespeichert,
// alle aus der Clubleitung sehen denselben Stand (wer, wann). Solange die Seite offen ist: alle 30 Sekunden neu prüfen.

const AC = { daten: null, uhr: 0, fehler: "" };
const AC_KASSEN = ["KASSE-01", "KASSE-02", "KASSE-03"];
const AC_LISTE = [
  ["⚡ Strom & Netz", [["strom", "Strom da, Kabel und Mehrfachstecker sicher verlegt (keine Stolperfallen)"], ["router", "Router an, WLAN des Stands sichtbar"],
    ["internet", "Internet am Router (Mini-PC meldet sich oben grün)"]]],
  ["🖥️ Mini-PC", [["minipc", "„KC Kasse starten“ läuft"], ["pcmanager", "PC-Manager offen und oben rechts angemeldet"],
    ["zugaenge", "Zeiterfassung → „Zugänge holen“: „An die Kassen gesendet“"]]],
  ["🧾 Kassen", [["kasse1", "Kasse 1: Tablet an, Ladekabel dran, verbunden"], ["kasse2", "Kasse 2: Tablet an, Ladekabel dran, verbunden"], ["kasse3", "Kasse 3: Tablet an, Ladekabel dran, verbunden"],
    ["scanner1", "Kasse 1: Barcode-Scanner aufgeladen, Testscan – Scanner-Symbol oben links grün"], ["scanner2", "Kasse 2: Barcode-Scanner aufgeladen, Testscan – Scanner-Symbol oben links grün"],
    ["scanner3", "Kasse 3: Barcode-Scanner aufgeladen, Testscan – Scanner-Symbol oben links grün"], ["scannerladen", "Ladekabel und Ersatz-Akku/Powerbank für die Scanner am Stand"],
    ["anmelden", "Anmelden mit Ausweis-QR vom Handy klappt (Notlösung Geburtsdatum über das Zahlenfeld)"], ["testbon", "An jeder Kasse eine Testbuchung und wieder storniert"],
    ["pfand", "Pfand- und Rückgabe-Etiketten lassen sich scannen"], ["bar", "BAR-Code scannen = bar kassieren klappt"], ["stechuhr", "Stechuhr: Kommen und Gehen getestet"],
    ["wechselgeld", "Wechselgeld in allen Kassen gezählt"]]],
  ["📺 Fernseher", [["tv", "Fernseher an, Präsentation läuft"], ["tvton", "Ton und Lautstärke passen"], ["tvprogramm", "Bühnenprogramm und Preise auf dem Fernseher stimmen"]]],
  ["🏷️ Aushänge & Ausgabe", [["preisliste", "Kundenpreisliste hängt"], ["allergene", "Allergen-Aushang hängt"], ["etiketten", "Preisetiketten an der Ware"],
    ["glaeser", "Gläser und Feuerzangen da"], ["schalen", "Einwegschalen, Thermobecher und Servietten da"]]],
];
const acMin = (iso) => (iso ? (Date.now() - Date.parse(iso)) / 60000 : Infinity);
const acZeit = (iso) => (iso ? new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "");
// Ampel: ok (grün), warn (gelb), fehlt (rot), info (grau – nur Hinweis)
function acAuto(d) {
  const z = [], s = d?.stand;
  const alter = (iso, gut, warn) => { const m = acMin(iso); return m <= gut ? "ok" : m <= warn ? "warn" : "fehlt"; };
  z.push(["Mini-PC meldet sich (Internet über den Router)", s ? alter(s.zuletzt, 3, 15) : "fehlt", s?.zuletzt ? `zuletzt ${acZeit(s.zuletzt)} Uhr${s.version ? ` · Stand ${s.version}` : ""}` : "noch keine Meldung"]);
  z.push(["Manager-Dienst auf dem Mini-PC", s?.manager === true ? "ok" : s?.manager === false ? "fehlt" : "warn", s?.manager === true ? "läuft" : "keine Angabe"]);
  if (s?.rueckstand) z.push(["Meldungen vom Stand nachgereicht", s.rueckstand > 50 ? "warn" : "ok", `${s.rueckstand} warten noch`]);
  for (const k of AC_KASSEN) {
    const x = (d?.kassen || []).find((y) => y.kasse === k), nr = k.slice(-1);
    if (!x) { z.push([`Kasse ${nr}`, "fehlt", "nicht gekoppelt"]); continue; }
    const st = !x.gekoppelt ? "fehlt" : alter(x.zuletzt, 3, 15);
    z.push([`Kasse ${nr}`, st, `${x.gekoppelt ? "gekoppelt" : "nicht gekoppelt"}${x.zuletzt ? ` · zuletzt ${acZeit(x.zuletzt)} Uhr` : ""}`]);
    if (x.lag_ms != null) z.push([`Kasse ${nr}: WLAN`, x.lag_ms <= 300 ? "ok" : x.lag_ms <= 1000 ? "warn" : "fehlt", `Verzögerung ${x.lag_ms} ms`]);
  }
  z.push(["Fernseher holt die Präsentation", s?.tv ? alter(s.tv.zuletzt, 10, 30) : "info", s?.tv ? `zuletzt ${acZeit(s.tv.zuletzt)} Uhr` : "meldet (noch) nicht – unten von Hand abhaken"]);
  z.push(["Kassen-QR-Codes zum Koppeln", (d?.qr || 0) >= 3 ? "ok" : (d?.qr || 0) ? "warn" : "fehlt", `${d?.qr || 0} von 3 gemeldet`]);
  z.push(["PC-Manager meldet sich", alter(d?.pc_manager, 30, 240), d?.pc_manager ? `zuletzt ${acZeit(d.pc_manager)} Uhr` : "noch keine Meldung"]);
  z.push(["Preise und Allergene veröffentlicht", d?.preise ? "ok" : "fehlt", d?.preise ? `am ${new Date(d.preise).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr` : "noch nie"]);
  if (s?.sperre) z.push(["Update-Sperre während des Markts", "info", `${s.sperre.aktiv ? "aktiv" : "noch nicht aktiv"} · ${s.sperre.von || "?"} bis ${s.sperre.bis || "?"}`]);
  return z;
}
const AC_SYM = { ok: "✅", warn: "⚠️", fehlt: "❌", info: "ℹ️" };
function acHtml() {
  const d = AC.daten;
  if (!d) return AC.fehler ? `<p class="hinweis">⚠️ ${esc(AC.fehler)}</p>` : '<p class="hinweis">⏳ Wird geprüft …</p>';
  const auto = acAuto(d), gut = auto.filter((x) => x[1] === "ok").length, schlecht = auto.filter((x) => x[1] === "fehlt").length;
  const haken = new Map((d.haken || []).map((h) => [h.punkt, h])), alle = AC_LISTE.flatMap(([, l]) => l), erledigt = alle.filter(([id]) => haken.get(id)?.erledigt).length;
  const fertig = schlecht === 0 && erledigt === alle.length;
  return `<p class="hinweis" style="margin:0 0 8px">${fertig ? "🎉 <b>Alles geprüft – der Stand ist startklar.</b>" : `Automatisch: <b>${gut} von ${auto.filter((x) => x[1] !== "info").length}</b> grün · Abgehakt: <b>${erledigt} von ${alle.length}</b>`}
      <br><small>Stand ${acZeit(d.jetzt)} Uhr · prüft alle 30 Sekunden neu</small></p>
    <h4 class="ac-h">🤖 Automatisch geprüft</h4>
    <div class="ac-liste">${auto.map(([t, st, u]) => `<div class="ac-z ac-${st}"><span class="ac-sym" aria-hidden="true">${AC_SYM[st]}</span><span><b>${esc(t)}</b><small>${esc(u)}</small></span></div>`).join("")}</div>
    ${AC_LISTE.map(([titel, liste]) => `<h4 class="ac-h">${esc(titel)}</h4><div class="ac-liste">${liste.map(([id, t]) => { const h = haken.get(id);
      return `<label class="ac-z ac-haken${h?.erledigt ? " ac-ok" : ""}"><input type="checkbox" data-ac="${id}" ${h?.erledigt ? "checked" : ""}><span><b>${esc(t)}</b>${h?.erledigt ? `<small>✓ ${esc(h.von || "")} ${acZeit(h.am)} Uhr</small>` : ""}</span></label>`; }).join("")}</div>`).join("")}
    <div class="knoepfe" style="margin-top:10px"><button class="knopf" onclick="acLaden()">↻ Neu prüfen</button><button class="knopf" onclick="$('acBlatt').remove()">Schließen</button></div>
    <style>#acBlatt .ac-h{margin:12px 0 4px;color:var(--textRot,#741521)}#acBlatt .ac-liste{display:grid;gap:4px}
      #acBlatt .ac-z{display:flex;gap:10px;align-items:flex-start;padding:7px 8px;border-radius:10px;background:var(--karte2,#efe5d6);color:var(--text,#2b1a1c)}
      #acBlatt .ac-z span{display:flex;flex-direction:column;min-width:0}#acBlatt .ac-z small{opacity:.8}#acBlatt .ac-sym{font-size:1.1rem}
      #acBlatt .ac-fehlt{outline:2px solid var(--textNotruf,#c0392b)}#acBlatt .ac-warn{outline:2px dashed var(--textOrange,#8a5200)}
      #acBlatt .ac-haken{cursor:pointer}#acBlatt .ac-haken input{width:22px;height:22px;flex:none;margin-top:1px}#acBlatt .ac-ok{opacity:.85}</style>`;
}
function acZeichnen() {
  const f = $("acInhalt"); if (!f) { clearInterval(AC.uhr); AC.uhr = 0; return; }
  f.innerHTML = acHtml();
  f.querySelectorAll("[data-ac]").forEach((c) => c.addEventListener("change", () => acHaken(c.dataset.ac, c.checked)));
}
async function acLaden() {
  try { AC.daten = await api("aufbau_check", {}, { warten: true }); AC.fehler = ""; } catch (e) { AC.fehler = e?.message || "Prüfung gerade nicht möglich."; }
  acZeichnen();
}
async function acHaken(punkt, erledigt) {
  try { await api("aufbau_haken", { punkt, erledigt }); } catch (e) { meldeFehler(e); }
  await acLaden();
}
async function acStart() {
  blattAuf("acBlatt", `<div class="kopf2" style="margin:0 0 6px"><h3 style="margin:0;flex:1">🧰 Aufbau-Check</h3><button class="knopf klein" onclick="$('acBlatt').remove()" aria-label="Schließen" title="Schließen">✕</button></div><div id="acInhalt"></div>`);
  AC.daten = null; acZeichnen();
  clearInterval(AC.uhr); AC.uhr = setInterval(() => { if (!$("acInhalt")) { clearInterval(AC.uhr); AC.uhr = 0; return; } if (!document.hidden && !ruht()) acLaden(); }, 30000);
  await acLaden();
}
