// KC-CLUB-DIENSTWUNSCH (0.59.0): lädt Club-Daten und danach die unveränderten DP2-Twinkey-Dateien in DP2s Reihenfolge
// (aus dp2/QUELLE.json – eine Quelle für Liste und Reihenfolge). daten.js steht dort, wo DP2 twinkey-test-data.js lädt,
// start.js dort, wo DP2 twinkey-test-boot.js lädt. Die Seite hat <base href="dp2/">: Pfade sind relativ zu dp2/.
(function () {
  "use strict";
  const API = "https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club", APP_VERSION = "2.23.40";
  const laden = document.getElementById("dwLaden");
  // CSP ohne Inline-Skripte: Knopf per addEventListener
  const zurueck = () => (parent !== window ? parent.postMessage("dienstwunsch-zu", location.origin) : history.back());
  const fehler = (t) => { laden.innerHTML = `<div><div style="font-size:2.4rem">🧑‍🍳</div>${t}<br><br><button type="button" id="dwZurueck" style="min-height:44px;padding:8px 18px;border-radius:12px;border:1px solid #c9a37a;background:#fff;font:inherit">Zurück zur Club-App</button></div>`;
    document.getElementById("dwZurueck").addEventListener("click", zurueck); };
  let key = ""; try { key = localStorage.getItem("kc_club_key") || ""; } catch {}
  if (!key) return fehler("Bitte die Club-App mit deinem persönlichen Link öffnen.");
  // KC-CLUB-NAHE-REGION (1.16.0): wie die Club-App – Server neben der Datenbank; antwortet die Region nicht, Standardweg
  let regionAus = false;
  window.KC_CLUB_DW_API = async (action, daten = {}) => {
    const anfrage = (url) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-club-token": key, "x-club-version": APP_VERSION }, body: JSON.stringify({ action, ...daten }) });
    let r;
    if (!regionAus) {
      try { r = await anfrage(API + "?forceFunctionRegion=eu-west-2"); if (r.status >= 502 && r.status <= 504) { regionAus = true; r = null; } }
      catch { regionAus = true; r = null; }
    }
    if (!r) r = await anfrage(API);
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || j.error) throw new Error(j?.error || "Keine Verbindung zum Server.");
    return j;
  };
  const skript = (src) => new Promise((ok, nein) => { const s = document.createElement("script"); s.src = src; s.async = false; s.onload = ok; s.onerror = () => nein(new Error("Datei fehlt: " + src)); document.body.appendChild(s); });
  (async () => {
    try {
      const [quelle, daten] = await Promise.all([fetch("QUELLE.json?v=" + APP_VERSION, { cache: "no-cache" }).then((r) => r.json()), window.KC_CLUB_DW_API("dienstwunsch_laden")]);
      window.KC_CLUB_DW = daten;
      const v = "?v=" + encodeURIComponent(quelle.dp2Version + "-" + String(quelle.commit || "").slice(0, 7)); // 1.16.1: Commit im Schlüssel – Nachträge bei gleicher Build-Nummer kommen sicher an
      for (const f of quelle.reihenfolge.filter((f) => f.endsWith(".css"))) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = f + v; document.head.appendChild(l); }
      const js = quelle.reihenfolge.filter((f) => f.endsWith(".js"));
      const reihe = [];
      for (const f of js) {
        if (f === "src/ui/original-brand.js") reihe.push("../dp2-club/start.js?v=" + APP_VERSION); // DP2: twinkey-test-boot.js steht vor original-brand.js
        reihe.push(f + v);
        if (f === "src/core/model.js") reihe.push("../dp2-club/daten.js?v=" + APP_VERSION);   // DP2: twinkey-test-data.js direkt nach model.js
      }
      for (const s of reihe) await skript(s);
      laden.remove();
    } catch (e) { fehler("Twinkey konnte nicht geladen werden:<br>" + String(e.message || e).replace(/[<>&]/g, "")); }
  })();
})();
