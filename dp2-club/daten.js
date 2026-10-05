// KC-CLUB-DIENSTWUNSCH (0.59.0): Datenanschluss für den unveränderten DP2-Twinkey – an der Stelle von DP2s twinkey-test-data.js.
// Setzt dieselben Felder wie dort, aber mit echten Daten: Tage/Kernzeit/Bedarf von DP2 (kc_dp_days_published; solange DP2 sie
// noch nicht veröffentlicht hat, gelten DP2s eigene Grundeinstellungen aus model.js), der eigene Wunschstand aus dem Wunsch-Eingang,
// freigegebene Zeiten von Kollegen, der eigene Sollplan. Speichern (K.persistAll) legt den aktuellen Stand in den Wunsch-Eingang,
// den DP2 abholt. Personen, Regeln und Oberfläche bleiben die von DP2.
(function () {
  "use strict";
  const K = window.KCDP, D = window.KC_CLUB_DW || {}, ich = D.ich?.personId;
  const stunden = (t) => { if (t == null) return null; const [h, m] = String(t).split(":"); return Number(h) + Number(m || 0) / 60; };
  const kopie = (x) => JSON.parse(JSON.stringify(x));
  // Supabase (jsonb) sortiert Objektschlüssel um. DP2 vergleicht beim Tagesstatus („Fertig“) Text-Signaturen, deren Reihenfolge zählt.
  // Die Signatur selbst bleibt als Text unverändert – aus ihr wird die Original-Reihenfolge wiederhergestellt (keine DP2-Logik nachgebaut).
  const kanon = (x) => JSON.stringify(x, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v));
  const vorlagen = new Map();
  const sammeln = (x) => { if (x && typeof x === "object") { if (!Array.isArray(x)) vorlagen.set(kanon(x), x); Object.values(x).forEach(sammeln); } };
  for (const e of [...(D.meine?.entries || []), ...(D.kollegen || []).flatMap((k) => k.entries || [])])
    if (typeof e?.assistantDay?.completedSignature === "string") try { sammeln(JSON.parse(e.assistantDay.completedSignature)); } catch {}
  const ordnen = (x) => (x && typeof x === "object" && vorlagen.has(kanon(x)) ? kopie(vorlagen.get(kanon(x))) : x);
  const tagStatus = (a) => ({ ...(a.standby !== undefined ? { standby: ordnen(a.standby) } : {}), completed: a.completed === true, completedSignature: a.completedSignature ?? null });

  // --- Tage: DP2-Grundeinstellung (model.js) + veröffentlichter Stand von DP2 ---
  const neutral = { temp: 5, condition: "trocken", impact: "neutral", factor: 1 };
  const grund = new Map((K.days || []).map((d) => [d.date, d]));
  const pub = new Map((D.tage || []).map((t) => [t.work_date, t]));
  if (pub.size) {
    K.days = [...pub.values()].map((t) => {
      const g = grund.get(t.work_date) || {};
      return { ...g, date: t.work_date, type: t.day_type === "other" ? "prep" : t.day_type, start: Number(t.day_start), end: Number(t.day_end),
        open: t.core_start == null ? null : Number(t.core_start), close: t.core_end == null ? null : Number(t.core_end),
        preOpenMinutes: Number(t.pre_open_minutes || 0), weather: g.weather || { ...neutral }, program: Array.isArray(t.program) ? t.program : (g.program || []) };
    });
    // Bedarf je Stunde so, wie DP2 ihn veröffentlicht (Grundbedarf; Wetter-/Programmzuschlag rechnet DP2s requirementFor wie gewohnt)
    const dp2Grund = K.baseRequirementFor;
    K.baseRequirementFor = (day, hour) => {
      const bl = pub.get(day.date)?.demand;
      if (Array.isArray(bl) && bl.length) { const b = bl.find((x) => hour >= Number(x.start) && hour < Number(x.end));
        return b ? { total: Number(b.total) || 0, front: b.front == null ? null : Number(b.front), back: b.back == null ? null : Number(b.back) } : { total: 0, front: null, back: null }; }
      return dp2Grund(day, hour);
    };
  } else K.days = kopie(K.days);
  K.clubTageVonDp2 = pub.size > 0; // nur Anzeige in der Club-App

  // --- Person: DP2-Personenliste (model.js) – fehlt das Mitglied dort, wird es wie in DP2 als Mitglied ergänzt ---
  if (ich && !(K.people || []).some((p) => p.personId === ich))
    K.people = [...(K.people || []), { personId: ich, name: D.ich.name, skills: "", personType: "member", active: true, expanded: false, maxHours: 8, preferences: {}, availability: [] }];
  // KC-CLUB-WUNSCHBOGEN (2.23.28, Wunsch Hansi): Profil-Nummer im QR-Code des Papierbogens = Mitglieds-ID (KC-P-…) –
  // fest, ohne Zufallsnummer; damit wird ein abgegebener Bogen beim Einlesen eindeutig zugeordnet. DP2-Code bleibt unverändert.
  if (ich) K.people = (K.people || []).map((p) => (p.personId === ich ? { ...p, formProfileId: ich } : p));
  K.currentUser = { personId: ich, displayName: D.ich?.name || "", role: "employee" };
  K.state = { ...K.state, wishPhase: D.wunschphase?.status === "open" ? "open" : "closed", date: K.days[0]?.date, dayIndex: 0, view: "day", layer: "wish" };
  K.day = () => K.days[0]; K.person = (id) => K.people.find((p) => p.personId === id);
  K.eventConfig = { eventId: D.veranstaltung || "KC-WM-2026", name: D.name || "Weihnachtsmarkt Werne 2026" };
  K.workflow = { status: "draft" }; K.personRules = {}; K.auditLog = []; K.swapRequests = []; K.standby = []; K.absences = [];

  // --- Wünsche: eigener Stand aus dem Eingang + freigegebene Zeiten der Kollegen ---
  const alsWunsch = (personId, e, i, vorsilbe) => ({ id: `${vorsilbe}-${personId}-${i}`, personId, date: e.date, start: Number(e.start), end: Number(e.end), wishType: e.wishType,
    wishZone: e.wishZone || "B", scope: e.scope || "time", comment: e.comment || "", ...(e.onlyIfNeeded ? { onlyIfNeeded: true } : {}), ...(e.assistantDay ? { assistantDay: tagStatus(e.assistantDay) } : {}),
    status: "confirmed", source: "club_app", contract: "KC_DP3_WISH_V1", version: 1 });
  K.wishes = [...(D.meine?.entries || []).map((e, i) => alsWunsch(ich, e, i, "CLUB")), ...(D.kollegen || []).flatMap((k) => (k.entries || []).map((e, i) => alsWunsch(k.personId, e, i, "CLUB-K")))];
  K.memberUxData = { assistantStandby: { [ich]: Object.fromEntries(Object.entries(D.meine?.standby || {}).map(([t, b]) => [t, ordnen(kopie(b))])) } };
  if (typeof D.meine?.share_with_colleagues === "boolean") K.memberUxData.colleagueSharing = { [ich]: { allow: D.meine.share_with_colleagues } };
  K.planSharing = kopie(D.teilen || []);

  // --- Eigener Sollplan (von DP2 veröffentlicht) ---
  K.shifts = (D.schichten || []).map((s) => ({ id: s.source_shift_id, personId: ich, date: s.work_date, start: stunden(s.start_time), end: stunden(s.end_time),
    layer: "planned", status: "published", zone: s.zone, area: s.area, breakMinutes: Number(s.break_minutes || 0) }));
  K.actualShifts = [];
  K.planVersions = K.shifts.length ? [{ version: 1, shifts: kopie(K.shifts), publishedAt: D.schichten[0]?.published_at }] : [];

  // --- Speichern: aktueller Stand → Wunsch-Eingang (nur bei Änderung; mehrere Aufrufe hintereinander werden zusammengefasst) ---
  const stand = () => ({
    entries: (K.wishes || []).filter((w) => w.personId === ich && w.status !== "deleted")
      .map((w) => ({ date: w.date, start: Number(w.start), end: Number(w.end), wishType: w.wishType, wishZone: w.wishZone || "B", scope: w.scope || "time", comment: w.comment || "",
        ...(w.onlyIfNeeded ? { onlyIfNeeded: true } : {}), ...(w.assistantDay ? { assistantDay: kopie(w.assistantDay) } : {}) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start || a.wishType.localeCompare(b.wishType)),
    standby: K.memberUxData?.assistantStandby?.[ich] || {},
    teilen: typeof K.memberUxData?.colleagueSharing?.[ich]?.allow === "boolean" ? K.memberUxData.colleagueSharing[ich].allow : null,
  });
  let zuletzt = JSON.stringify(stand()), laeuft = null, nochmal = false;
  async function senden() {
    const s = stand(), j = JSON.stringify(s);
    if (j === zuletzt) return true;
    await window.KC_CLUB_DW_API("dienstwunsch_speichern", s);
    zuletzt = j;
    try { parent !== window && parent.postMessage("dienstwunsch-gespeichert", location.origin); } catch {}
    sperrePruefen(s.entries);
    return true;
  }
  // KC-CLUB-SPERRZEIT-PRUEFUNG (2.23.75, Fund Hansi): Nach jedem gespeicherten Tag prüfen, ob eine Sperrzeit außerhalb der Kann-Zeit
  // liegt (z. B. Kann 10–14, Sperre 14–22). Das ist unnötig – außerhalb der Kann-Zeit plant DP2 ohnehin nicht. Nur ein Hinweis an die
  // Club-App (je Tag + Sperre einmal pro Sitzung); die Angaben bleiben unverändert – ändern kann sie nur das Mitglied selbst in Twinkey.
  const gemeldet = new Set();
  const uhr = (h) => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}${m % 60 ? ":" + String(m % 60).padStart(2, "0") : ""}`; };
  function sperrePruefen(eintraege) {
    const funde = [];
    for (const sp of eintraege.filter((e) => e.wishType === "unavailable" && e.scope !== "day")) {
      const kann = eintraege.filter((e) => e.date === sp.date && (e.wishType === "available" || e.wishType === "if_needed") && e.scope !== "day");
      if (kann.some((k) => sp.start < k.end && sp.end > k.start)) continue; // liegt (teilweise) in der Kann-Zeit → sinnvoll
      const schluessel = `${sp.date}|${sp.start}|${sp.end}`;
      if (gemeldet.has(schluessel)) continue;
      gemeldet.add(schluessel);
      funde.push({ datum: sp.date, sperre: `${uhr(sp.start)}–${uhr(sp.end)}`, kann: kann.map((k) => `${uhr(k.start)}–${uhr(k.end)}`).join(", ") });
    }
    if (funde.length) try { parent !== window && parent.postMessage({ art: "dw-sperre", funde }, location.origin); } catch {}
  }
  K.persistAll = async () => {
    if (laeuft) { nochmal = true; return laeuft; }
    laeuft = (async () => { do { nochmal = false; await senden(); } while (nochmal); return true; })().finally(() => { laeuft = null; });
    return laeuft;
  };
  // KC-CLUB-WUNSCHBOGEN (2.23.28): leerer persönlicher Bogen (DP2s „Persönliche Verfügbarkeitsmatrix“, Name + QR oben rechts) auf
  // Anfrage der Club-App erzeugen – mit DP2s eigenem Druckteil (personalizedForms + pdfAdapter); die Club-App zeigt/druckt/mailt ihn.
  const bogenBauen = async () => {
    for (let i = 0; i < 100 && !(K.personalizedForms?.downloadPdf && K.pdfAdapter?.bytes && K.pdfAdapter?.download); i++) await new Promise((ok) => setTimeout(ok, 200));
    const F = K.personalizedForms, P = K.pdfAdapter;
    if (!F?.downloadPdf || !P?.bytes) throw new Error("Der Druckteil von DP2 ist nicht geladen.");
    let doc = null; const herunterladen = P.download;
    P.download = (d) => { doc = d; return null; }; // DP2s Weg „Matrix als PDF“ – nur das fertige Dokument abgreifen, nicht herunterladen
    try { await F.downloadPdf("matrix", ich); } finally { P.download = herunterladen; }
    if (!doc) throw new Error("Der Bogen konnte nicht erstellt werden.");
    return { bytes: await P.bytes(doc), name: doc.fileName || "Wunschbogen.pdf" };
  };
  window.addEventListener("message", async (e) => {
    if (e.origin !== location.origin || e.source !== parent || e.data?.art !== "wunschbogen") return;
    parent.postMessage({ art: "wunschbogen-start" }, location.origin);
    try { const r = await bogenBauen(); parent.postMessage({ art: "wunschbogen-fertig", bytes: r.bytes, name: r.name }, location.origin); }
    catch (f) { parent.postMessage({ art: "wunschbogen-fehler", text: String(f?.message || f) }, location.origin); }
  });
  K.sync = { enqueue() {}, snapshot: () => ({ outbox: [] }) };
  K.memberAccess = { configured: () => false, cachePublicConfig() {} };
  // Freigabe „Kollegen dürfen meine Zeiten sehen“ (Twinkey-Frage): wie DP2 über supabaseConnection, gespeichert mit dem Wunschstand
  K.supabaseConnection = { state: { authStatus: "authenticated" },
    readPlanSharing: async () => K.planSharing,
    savePlanSharing: async (p) => ["can", "wish", "standby"].map((art) => ({ person_id: ich, plan_kind: art, allow_view: !!p?.[art]?.view, allow_copy: !!p?.[art]?.copy })) };
})();
