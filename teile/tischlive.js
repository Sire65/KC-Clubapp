// ---------- 2.766.0 KC-CLUB-RUNDER-TISCH-LIVE (Wunsch Hansi 30.10.2026 „Runden Tisch weiterbauen mit allen Möglichkeiten: Ton, Video,
// Bildschirm zeigen, Unterlagen senden – das muss super werden“; Spezifikation docs/RUNDER_TISCH.md, Abschnitte 5, 7 und 17) ----------
// Nachladbarer Programmteil (KC-CLUB-TEILE). Baut nur auf Vorhandenem auf (Vertrag Regel 3):
//   • Live-Leitung je Tisch = fhLeitung (Supabase Realtime Broadcast, AES-GCM) – Kanal/Schlüssel gibt der Server nur Sitzenden (tisch_platz).
//     Über die Leitung laufen nur Signale (wer ist live, Mikro/Kamera/Bildschirm, ✋, 🥄 Redestab, gezeigte Unterlage + Seite, Verbindungsaufbau).
//     Keine Datenbank-Abfragen dafür (KC-DB-SPARSAM).
//   • Ton/Bild = WebRTC wie beim App-Anruf (Wege inkl. Umleitungs-Server aus rufIce, gleiche Mikrofon-Einstellungen).
//     Nur wer sendet, baut Verbindungen auf – zu jedem, der live ist (1 → viele). Zuhörer senden nichts.
//   • Unterlagen = Anlage im Tisch-Chat (vorhandener Weg, Zugriff prüft der Server) + „Allen zeigen“: alle sehen dieselbe Seite.
// Wer sprechen darf: bis TL_FREI Personen live ist es ein offenes Gespräch (alle dürfen), darüber gilt der 🥄 Redestab (Leitung + wem sie ihn gibt).
// Zustand unbekannt (kein Lebenszeichen seit TL_WEG_MS) wird grau gezeigt, nie als „da“ (Vertrag Regel 11). Keine Aufzeichnung.
const TL_FREI = 6, TL_HERZ_MS = 15000, TL_WEG_MS = 45000, TL_VIDEO_KBIT = 2400, TL_MIN_KBIT = 150, TL_MAX_KBIT = 1000;
const TL = { freiBis: TL_FREI, id: null, L: null, ich: null, live: false, mic: null, micAn: false, cam: null, schirm: null, hand: false, stab: null, peers: new Map(),
  pcs: new Map(), baue: new Set(), iceVorab: new Map(), musik: null, uhr: new Map(), zeige: null, folgen: true, seite: 1, pdf: null, pdfFuer: null, herz: null, ctx: null, pegel: new Map(), takt: null, mess: { pcs: 0, fehl: 0, relay: 0 }, root: null };
// Reine Regeln (Test: tests/runder-tisch.test.mjs) – wer darf senden, welche Datenrate je Empfänger
function tlRegeln(o) {
  const n = o.liveAnzahl, frei = n <= (o.freiBis ?? TL_FREI), leiter = o.ich === o.gastgeber, stab = o.stab === o.ich;
  const darfSprechen = frei || leiter || stab;
  return { frei, darfSprechen, darfZeigen: darfSprechen, modus: frei ? "frei" : "stab" };
}
const tlKbit = (empfaenger) => Math.max(TL_MIN_KBIT, Math.min(TL_MAX_KBIT, Math.round(TL_VIDEO_KBIT / Math.max(1, empfaenger))));
const tlTisch = () => (TL.id ? rundTisch(TL.id) : null);
const tlLiveIds = () => [...TL.peers.keys()].filter((pid) => Date.now() - TL.peers.get(pid).zeit < TL_WEG_MS);
const tlLiveLeute = () => tlLiveIds().map((pid) => TL.peers.get(pid));
const tlRegel = () => { const t = tlTisch(); return tlRegeln({ liveAnzahl: tlLiveLeute().length + 1, ich: TL.ich, gastgeber: t?.gastgeber, stab: TL.stab, freiBis: TL.freiBis }); };
const tlSende = (o) => TL.L?.senden({ v: 1, von: TL.ich, ...o });
const tlName = (pid) => { const t = tlTisch(), p = t?.amTisch?.find((x) => x.id === pid); return p ? p.name.split(" ")[0] : TL.peers.get(pid)?.name || "Jemand"; };
const tlSender = () => !!((TL.micAn && tlRegel().darfSprechen) || TL.cam || TL.schirm);

// ---- Einstieg: Live dazuschalten / verlassen ----
async function tlStart(id) {
  const t = rundTisch(id);
  if (!t || RUND.sitze !== id || !fhGueltig(RUND.live)) return melde("Live geht nur, wenn du am Tisch sitzt.", true);
  if (TL.live && TL.id === id) return tlZeichnen();
  if (TL.live) await tlStopp(true);
  if (!window.RTCPeerConnection) return melde("Dieses Gerät kann kein Live – du kannst im Tisch-Chat schreiben und 🎤 Sprachnachrichten schicken.", true);
  Object.assign(TL, { id, ich: ICH.person_id, live: true, stab: null, hand: false, zeige: null, folgen: true, seite: 1, mess: { pcs: 0, fehl: 0, relay: 0, start: Date.now() } });
  TL.peers.clear(); TL.pcs.clear(); TL.iceVorab.clear();
  try { TL.ctx = new (window.AudioContext || window.webkitAudioContext)(); TL.ctx.resume?.(); } catch { TL.ctx = null; } // nach dem Antippen: Ton darf spielen
  rufIce().catch(() => {}); // Wege (inkl. Umleitung) schon holen
  TL.L = fhLeitung(RUND.live, tlEmpfang, () => { tlDa(true); tlZeichnen(); });
  const r = tlRegel();
  if (r.darfSprechen) await tlMikro(true, true);
  else melde("🔴 Du hörst live zu. Wenn du etwas sagen möchtest: ✋ melden.");
  clearInterval(TL.herz); TL.herz = setInterval(() => { tlDa(false); tlAufraeumen(); }, TL_HERZ_MS);
  clearInterval(TL.takt); TL.takt = setInterval(tlPegel, 250);
  tlZeichnen(); if (typeof rundTischZeichnen === "function") rundTischZeichnen();
}
async function tlStopp(still) {
  if (!TL.live) return;
  TL.live = false; // sofort: keine neuen Verbindungen mehr
  try { await Promise.race([tlSende({ typ: "tschuess" }), new Promise((ok) => setTimeout(ok, 800))]); } catch {} // erst Abschied senden (verschlüsselt), dann Leitung zu
  const dauer = Math.round((Date.now() - (TL.mess.start || Date.now())) / 1000);
  api("diagnose", { art: "tisch_live", daten: { sek: dauer, pcs: TL.mess.pcs, fehl: TL.mess.fehl, relay: TL.mess.relay, max_live: TL.mess.max || 0 } }).catch(() => {}); // Messwerte (nur Zahlen)
  for (const k of [...TL.pcs.keys()]) tlPcZu(k);
  for (const s of [TL.mic, TL.cam, TL.schirm]) s?.getTracks().forEach((x) => x.stop());
  tlMusikAus();
  clearInterval(TL.herz); clearInterval(TL.takt); TL.L?.schliessen();
  try { TL.ctx?.close(); } catch {}
  TL.pdf?.destroy?.();
  Object.assign(TL, { live: false, L: null, mic: null, micAn: false, cam: null, schirm: null, hand: false, zeige: null, pdf: null, pdfFuer: null, ctx: null, root: null, buehneStand: "" });
  TL.peers.clear(); TL.pegel.clear();
  document.getElementById("tlTon")?.remove();
  if (!still) melde("🔴 Live beendet – du sitzt weiter am Tisch.");
  tlZeichnen(); if (typeof rundTischZeichnen === "function") rundTischZeichnen();
}
// Lebenszeichen: alle 15 s und bei jeder Änderung; neu = „ich bin gerade gekommen“ → alle melden sich sofort zurück
function tlDa(neu) {
  if (!TL.live) return;
  const t = tlTisch();
  tlSende({ typ: "da", neu: neu ? 1 : 0, name: (ICH.vorname || ICH.name || "").split(" ")[0], mic: TL.micAn ? 1 : 0, cam: TL.cam ? 1 : 0, schirm: TL.schirm ? 1 : 0, hand: TL.hand ? 1 : 0,
    ...(t?.gastgeber === TL.ich ? { stab: TL.stab || "" } : {}), ...(TL.zeige?.von === TL.ich ? { zeige: TL.zeige } : {}),
    ...(TL.musik?.von === TL.ich ? { musik: tlMusikStand() } : {}), t: Date.now() });
}
function tlAufraeumen() {
  const jetzt = Date.now();
  for (const [pid, p] of TL.peers) if (jetzt - p.zeit > 3 * TL_WEG_MS) { TL.peers.delete(pid); tlPeerWeg(pid); }
  TL.mess.max = Math.max(TL.mess.max || 0, tlLiveLeute().length + 1);
  // Darf ich (noch) senden? Wechsel offenes Gespräch ↔ Redestab, Stab weg
  if (TL.micAn && !tlRegel().darfSprechen) { tlMikro(false); melde("🥄 Jetzt sind es mehr als " + TL.freiBis + " – es spricht, wer den Redestab hat. ✋ melden zum Sprechen."); }
  tlSendenAbgleichen(); tlZeichnen();
}

// ---- Nachrichten auf der Live-Leitung ----
async function tlEmpfang(d) {
  if (!TL.live || !d || d.v !== 1 || typeof d.von !== "string" || d.von === TL.ich) return;
  if (d.an && d.an !== TL.ich) return;
  const t = tlTisch(), vomLeiter = d.von === t?.gastgeber;
  if (d.typ === "da") {
    const war = TL.peers.get(d.von), neu = !war || Date.now() - war.zeit > TL_WEG_MS;
    tlUhr(d.von, d.t);
    if (d.musik && (!TL.musik || TL.musik.von === d.von) && !(TL.musikAus?.a === d.musik.a && Date.now() < TL.musikAus.bis)) tlMusikEmpfangen(d.musik, d.von); // 2.774.0: gerade ausgeschaltet → nicht wieder starten
    TL.peers.set(d.von, { ...(war || {}), zeit: Date.now(), name: String(d.name || "").slice(0, 30), mic: !!d.mic, cam: !!d.cam, schirm: !!d.schirm, hand: !!d.hand });
    if (vomLeiter && "stab" in d) tlStabSetzen(d.stab || null);
    if (d.zeige && (!TL.zeige || TL.zeige.von === d.von)) tlZeigeEmpfangen(d.zeige, d.von);
    if (d.neu) tlDa(false); // Neue sollen mich auch gleich kennen
    if (neu) tlSendenAbgleichen();
    tlZeichnen(); return;
  }
  if (d.typ === "tschuess") { TL.peers.delete(d.von); tlPeerWeg(d.von); tlZeichnen(); return; }
  if (d.typ === "stab" && vomLeiter) { tlStabSetzen(d.stab || null); tlZeichnen(); return; }
  if (d.typ === "zeige") { tlZeigeEmpfangen(d.zeige || null, d.von); return; }
  if (d.typ === "seite" && TL.zeige?.von === d.von) { TL.zeige.s = Math.max(1, Number(d.s) || 1); if (TL.folgen) { TL.seite = TL.zeige.s; tlBuehneZeichnen(); } return; }
  if (d.typ === "musik") { tlUhr(d.von, d.t); return tlMusikEmpfangen(d.musik || null, d.von); }
  if (d.typ === "sdp" || d.typ === "ice" || d.typ === "zu") return tlSignal(d);
}
function tlStabSetzen(pid) {
  const vorher = TL.stab; TL.stab = pid;
  if (pid === TL.ich && vorher !== TL.ich) { TL.hand = false; melde("🥄 Du hast den Redestab – du kannst jetzt sprechen."); tlMikro(true); }
  else if (vorher === TL.ich && pid !== TL.ich && !tlRegel().darfSprechen) { tlMikro(false); melde("🥄 Redestab weitergegeben – danke!"); }
}

// ---- Senden: Mikro, Kamera, Bildschirm ----
async function tlMikro(an, still) {
  if (an && !tlRegel().darfSprechen) { if (!still) melde("🥄 Gerade spricht, wer den Redestab hat – bitte ✋ melden.", true); return; }
  if (an && !TL.mic) {
    try { TL.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch { melde("🎙️ Ohne Mikrofon-Freigabe hörst du nur zu. Erlauben: Schloss-Symbol oben im Browser → Mikrofon.", true); TL.micAn = false; tlZeichnen(); return; }
    tlPegelQuelle(TL.ich, TL.mic);
    const spur = TL.mic.getAudioTracks()[0]; // schon offene Verbindungen (z. B. wegen Kamera) bekommen jetzt den Ton
    for (const v of TL.pcs.values()) if (v.raus && v.audio) v.audio.sender.replaceTrack(spur).catch(() => {});
  }
  TL.micAn = !!an && !!TL.mic;
  TL.mic?.getAudioTracks().forEach((x) => (x.enabled = TL.micAn));
  tlSendenAbgleichen(); tlDa(false); tlZeichnen();
}
async function tlKamera() {
  if (TL.cam) { TL.cam.getTracks().forEach((x) => x.stop()); TL.cam = null; }
  else {
    if (!tlRegel().darfSprechen) return melde("📷 Kamera geht im Redestab-Modus nur mit dem Redestab.", true);
    try { TL.cam = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 20 } } }); }
    catch { return melde("📷 Bitte die Kamera erlauben – sonst geht es ohne Bild weiter.", true); }
  }
  tlVideoTauschen(); tlSendenAbgleichen(); tlDa(false); tlZeichnen();
}
const tlSchirmGeht = () => !!navigator.mediaDevices?.getDisplayMedia && !/Android|iPhone|iPad/i.test(navigator.userAgent);
async function tlSchirm() {
  if (TL.schirm) { TL.schirm.getTracks().forEach((x) => x.stop()); TL.schirm = null; }
  else {
    if (!tlSchirmGeht()) return melde("🖥️ Bildschirm zeigen geht am PC oder Laptop (Chrome, Edge, Firefox). Am Handy: 📎 Unterlagen zeigen.", true);
    if (!tlRegel().darfSprechen) return melde("🖥️ Bildschirm zeigen geht im Redestab-Modus nur mit dem Redestab.", true);
    try { TL.schirm = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 8, max: 12 } }, audio: false }); }
    catch { return; } // abgebrochen
    const tr = TL.schirm.getVideoTracks()[0]; try { tr.contentHint = "detail"; } catch {}
    tr.onended = () => { if (TL.schirm) { TL.schirm = null; tlVideoTauschen(); tlSendenAbgleichen(); tlDa(false); tlZeichnen(); } };
  }
  tlVideoTauschen(); tlSendenAbgleichen(); tlDa(false); tlZeichnen();
}
const tlVideoSpur = () => TL.schirm?.getVideoTracks()[0] || TL.cam?.getVideoTracks()[0] || null;
// 2.772.0 KC-CLUB-RUNDER-TISCH-ECKE (Wunsch #47, Hansi 30.10.2026 „im Seminar das Kassenprogramm vorstellen und zwischen Kamera und Programm
// umschalten – ja, mich in der Ecke, aber umschaltbar, denn auf dem kleinen Handy-Bildschirm könnte das stören“): Zeige ich den Bildschirm UND die
// Kamera ist an, geht die Kamera zusätzlich als zweites, kleines Bild mit (eigener Kanal, wenig Datenrate). Jeder Zuschauer entscheidet selbst,
// ob er mich klein in der Ecke der Bühne sieht (Knopf „🙂 Ecke“, je Gerät gemerkt; Standard an, auf schmalen Handys aus).
const tlEckSpur = () => (TL.schirm && TL.cam ? TL.cam.getVideoTracks()[0] || null : null);
const TL_ECK = "kc_club_tl_ecke";
const tlEckAn = () => { const w = lsLesen(TL_ECK); return w ? w === "an" : (window.innerWidth || 400) >= 600; };
function tlEckUmschalten() { lsSetzen(TL_ECK, tlEckAn() ? "aus" : "an"); TL.buehneStand = ""; tlBuehneZeichnen(); }
function tlVideoTauschen() {
  const spur = tlVideoSpur(), eck = tlEckSpur();
  for (const v of TL.pcs.values()) if (v.raus && v.video) { v.video.sender.replaceTrack(spur).then(() => tlRate(v)).catch(() => {}); v.eck?.sender.replaceTrack(eck).catch(() => {}); }
}
function tlRate(v) {
  try {
    const raus = [...TL.pcs.values()].filter((x) => x.raus).length, p = v.video.sender.getParameters(); p.encodings = p.encodings?.length ? p.encodings : [{}];
    p.encodings[0].maxBitrate = tlKbit(raus) * 1000; if (TL.schirm) p.degradationPreference = "maintain-resolution";
    v.video.sender.setParameters(p).catch(() => {});
    if (v.eck) { const e = v.eck.sender.getParameters(); e.encodings = e.encodings?.length ? e.encodings : [{}]; // Ecke: klein und sparsam
      e.encodings[0].maxBitrate = Math.min(180, tlKbit(raus)) * 1000; e.encodings[0].scaleResolutionDownBy = 2; v.eck.sender.setParameters(e).catch(() => {}); }
  } catch {}
}
// Ich sende → zu jedem, der live ist, eine Verbindung (raus). Sende ich nicht mehr → alle meine raus-Verbindungen zu.
function tlSendenAbgleichen() {
  if (!TL.live) return;
  const soll = new Set(tlSender() ? tlLiveIds() : []);
  for (const [k, v] of TL.pcs) if (v.raus && !soll.has(v.an)) { tlSende({ typ: "zu", an: v.an, pc: k }); tlPcZu(k); }
  for (const pid of soll) if (!TL.baue.has(pid) && ![...TL.pcs.values()].some((v) => v.raus && v.an === pid)) tlRausAufbauen(pid);
}
async function tlRausAufbauen(an) {
  const k = `${TL.ich}>${an}#${Date.now().toString(36)}`;
  TL.baue.add(an); let ice; try { ice = await rufIce(); } finally { TL.baue.delete(an); } // nie zweimal gleichzeitig für dieselbe Person
  if (!TL.live || [...TL.pcs.values()].some((v) => v.raus && v.an === an)) return;
  const pc = new RTCPeerConnection({ iceServers: ice });
  const v = { pc, an, raus: true, audio: null, video: null };
  TL.pcs.set(k, v); TL.mess.pcs++;
  const mic = TL.mic?.getAudioTracks()[0] || null;
  v.audio = pc.addTransceiver(mic || "audio", { direction: "sendonly", streams: TL.mic ? [TL.mic] : [] });
  v.video = pc.addTransceiver(tlVideoSpur() || "video", { direction: "sendonly" });
  v.eck = pc.addTransceiver(tlEckSpur() || "video", { direction: "sendonly" }); // 2.772.0: Kamera klein, während ich den Bildschirm zeige
  pc.onicecandidate = (e) => { if (e.candidate) tlSende({ typ: "ice", an, pc: k, c: e.candidate.toJSON() }); };
  pc.onconnectionstatechange = () => tlPcZustand(k);
  try { await pc.setLocalDescription(await pc.createOffer()); tlSende({ typ: "sdp", an, pc: k, sdp: pc.localDescription.toJSON() }); tlRate(v); }
  catch { tlPcZu(k); TL.mess.fehl++; }
}
// Gegenseite: Angebot annehmen (nur empfangen), Antwort und Wege zurück
async function tlSignal(d) {
  const k = String(d.pc || ""); if (!k.startsWith(d.von + ">") && !k.startsWith(TL.ich + ">")) return;
  if (d.typ === "zu") return tlPcZu(k);
  let v = TL.pcs.get(k);
  if (d.typ === "sdp" && d.sdp?.type === "offer" && !v) {
    // Platz sofort belegen (vor dem Warten auf die Wege) – Verbindungsdaten, die gleich danach kommen, werden gesammelt statt verworfen
    v = { pc: null, an: d.von, raus: false, strom: null, ice: TL.iceVorab.get(k) || [] }; TL.iceVorab.delete(k); TL.pcs.set(k, v); TL.mess.pcs++;
    const pc = new RTCPeerConnection({ iceServers: await rufIce() });
    if (TL.pcs.get(k) !== v) { pc.close(); return; } // inzwischen beendet
    v.pc = pc;
    pc.onicecandidate = (e) => { if (e.candidate) tlSende({ typ: "ice", an: d.von, pc: k, c: e.candidate.toJSON() }); };
    pc.onconnectionstatechange = () => tlPcZustand(k);
    pc.ontrack = (e) => {
      // 2.772.0 KC-CLUB-RUNDER-TISCH-ECKE: zweiter Video-Kanal = Kamera klein (nur solange der andere den Bildschirm zeigt)
      if (e.track.kind === "video" && pc.getTransceivers().filter((x) => x.receiver.track?.kind === "video").indexOf(e.transceiver) === 1) {
        v.eckStrom = new MediaStream([e.track]); e.track.onunmute = e.track.onmute = () => { TL.buehneStand = ""; tlZeichnen(); }; return; }
      v.strom = v.strom || new MediaStream(); v.strom.addTrack(e.track); e.track.onunmute = () => tlZeichnen(); if (e.track.kind === "audio") { tlTonSpielen(k, v.strom); tlPegelQuelle(d.von, v.strom); } tlZeichnen(); };
    try { await pc.setRemoteDescription(d.sdp); await pc.setLocalDescription(await pc.createAnswer()); tlSende({ typ: "sdp", an: d.von, pc: k, sdp: pc.localDescription.toJSON() });
      for (const c of v.ice.splice(0)) pc.addIceCandidate(c).catch(() => {}); } catch { tlPcZu(k); TL.mess.fehl++; }
    return;
  }
  if (!v) { if (d.typ === "ice" && d.c) { const l = TL.iceVorab.get(k) || []; if (l.length < 50) l.push(d.c); TL.iceVorab.set(k, l); if (TL.iceVorab.size > 60) TL.iceVorab.delete(TL.iceVorab.keys().next().value); } return; }
  if (!v.pc) { if (d.typ === "ice" && d.c) v.ice.push(d.c); return; } // Verbindung wird gerade angelegt
  if (d.typ === "sdp" && d.sdp?.type === "answer" && v.raus && v.pc.signalingState === "have-local-offer") { try { await v.pc.setRemoteDescription(d.sdp); for (const c of (v.ice || []).splice(0)) v.pc.addIceCandidate(c).catch(() => {}); } catch { TL.mess.fehl++; } return; }
  if (d.typ === "ice" && d.c) { if (!v.pc.remoteDescription) (v.ice = v.ice || []).push(d.c); else v.pc.addIceCandidate(d.c).catch(() => {}); }
}
function tlPcZustand(k) {
  const v = TL.pcs.get(k); if (!v?.pc) return;
  const s = v.pc.connectionState;
  if (s === "connected") { v.ok = true; v.pc.getStats?.().then((st) => st.forEach((x) => { if (x.type === "candidate-pair" && x.state === "succeeded" && x.nominated) { const l = st.get(x.localCandidateId); if (l?.candidateType === "relay") TL.mess.relay++; } })).catch(() => {}); }
  if (s === "failed" || s === "closed") {
    v.ok = false; TL.mess.fehl += s === "failed" ? 1 : 0;
    if (v.raus && s === "failed") { const an = v.an; tlPcZu(k); setTimeout(() => tlSendenAbgleichen(), 2000 + Math.random() * 1500); return void an; }
  }
  tlZeichnen();
}
function tlPcZu(k) {
  const v = TL.pcs.get(k); if (!v) return;
  TL.pcs.delete(k); try { v.pc?.close(); } catch {}
  document.getElementById("tlTon_" + tlSicher(k))?.remove();
  tlZeichnen();
}
function tlPeerWeg(pid) { if (TL.musik?.von === pid) tlMusikAus(); tlPeerWegAlt(pid); }
function tlPeerWegAlt(pid) { for (const [k, v] of TL.pcs) if (v.an === pid) tlPcZu(k); TL.pegel.delete(pid); if (TL.zeige?.von === pid) { TL.zeige = null; tlBuehneZeichnen(); } }
const tlSicher = (k) => String(k).replace(/[^A-Za-z0-9_-]/g, "_");
function tlTonSpielen(k, strom) {
  let box = document.getElementById("tlTon"); if (!box) { box = document.createElement("div"); box.id = "tlTon"; box.hidden = true; document.body.appendChild(box); }
  let a = document.getElementById("tlTon_" + tlSicher(k)); if (!a) { a = document.createElement("audio"); a.id = "tlTon_" + tlSicher(k); a.autoplay = true; a.setAttribute("playsinline", ""); box.appendChild(a); }
  a.srcObject = strom; a.play?.().catch(() => { melde("🔊 Zum Hören bitte einmal auf „🔴 Live“ tippen.", true); });
}
// Wer spricht gerade? (Pegel je Stimme, nur zur Anzeige – grün pulsierend)
function tlPegelQuelle(pid, strom) {
  if (!TL.ctx || !strom.getAudioTracks().length) return;
  try { const q = TL.ctx.createMediaStreamSource(strom), an = TL.ctx.createAnalyser(); an.fftSize = 256; q.connect(an); TL.pegel.set(pid, { an, buf: new Uint8Array(an.fftSize), wert: 0 }); } catch {}
}
function tlPegel() {
  let neu = false;
  for (const [pid, p] of TL.pegel) {
    p.an.getByteTimeDomainData(p.buf); let s = 0; for (const x of p.buf) s += (x - 128) * (x - 128);
    const spricht = Math.sqrt(s / p.buf.length) > 6 && (pid !== TL.ich || TL.micAn);
    if (spricht !== p.spricht) { p.spricht = spricht; neu = true; }
  }
  if (neu) tlPlaetzeMarkieren();
}
function tlPlaetzeMarkieren() {
  document.querySelectorAll("#rundTischInhalt .rund-platz[data-pid]").forEach((el) => { const k = tlPlatz(el.dataset.pid); el.classList.toggle("spricht", k.includes("spricht")); });
  document.querySelectorAll("#tlLeute [data-pid]").forEach((el) => el.classList.toggle("spricht", !!TL.pegel.get(el.dataset.pid)?.spricht));
}
// Für die Plätze am Tisch (Hauptprogramm): zusätzliche Klasse
function tlPlatz(pid) {
  if (!TL.live) return "";
  const p = pid === TL.ich ? { mic: TL.micAn, hand: TL.hand } : TL.peers.get(pid);
  if (!p) return "";
  return [TL.pegel.get(pid)?.spricht ? "spricht" : "", p.hand ? "hand" : "", TL.stab === pid ? "stab" : "", "live"].filter(Boolean).join(" ");
}

// ---- Melden und Redestab ----
function tlHand() {
  if (tlRegel().darfSprechen) return melde("Du darfst schon sprechen – 🎙️ Mikro an.");
  TL.hand = !TL.hand; tlDa(false); tlZeichnen();
  melde(TL.hand ? "✋ Gemeldet – die Leitung sieht es und gibt dir den Redestab." : "✋ Meldung zurückgenommen.");
}
function tlStab(pid) {
  const t = tlTisch(); if (t?.gastgeber !== TL.ich) return melde("Den Redestab vergibt, wer den Tisch leitet.", true);
  const neu = TL.stab === pid ? null : pid; tlStabSetzen(neu); tlSende({ typ: "stab", stab: neu || "" }); tlDa(false); tlZeichnen();
  melde(neu ? `🥄 ${tlName(neu)} hat jetzt den Redestab` : "🥄 Redestab zurückgenommen");
}

// ---- 📎 Unterlagen zeigen: Datei vom Gerät oder aus dem Archiv → in den Tisch-Chat (alle haben sie danach) → allen zeigen ----
async function tlUnterlagen() {
  const t = tlTisch(); if (!t?.chat) return melde("Der Tisch-Chat ist nicht erreichbar.", true);
  if (!tlRegel().darfZeigen) return melde("📎 Zeigen geht im Redestab-Modus mit dem Redestab – oder schick die Datei im Tisch-Chat.", true);
  const f = dlgOeffnen(`<button type="button" class="dlg-x" data-a="zu" aria-label="Schließen">✕</button><h3 class="dlg-kopf">📎 Unterlagen zeigen</h3>
    <p class="dlg-text">Die Datei kommt in den Tisch-Chat (alle haben sie danach) und erscheint bei allen groß – ihr seht dieselbe Seite.</p>
    ${tlTasche(["pdf", "foto"]).length ? `<div class="tl-tasche-wahl"><b>💼 Aus meiner Tasche</b>${tlTasche(["pdf", "foto"]).map((x) => `<button type="button" class="knopf" data-tasche="${esc(x.id)}">${x.art === "pdf" ? "📄" : "🖼️"} ${esc(x.name)}${x.gezeigt ? " ✓" : ""}</button>`).join("")}</div>` : ""}
    <div class="ca-wahl"><button type="button" class="knopf haupt" data-a="geraet">📄 PDF oder Foto vom Gerät</button><button type="button" class="knopf" data-a="archiv">🗄️ Aus dem Archiv</button>
    ${TL.zeige?.von === TL.ich ? '<button type="button" class="knopf" data-a="aus">⏹️ Zeigen beenden</button>' : ""}</div>`, () => f.remove());
  f.querySelector('[data-a="zu"]').onclick = () => f.remove();
  f.querySelector('[data-a="aus"]')?.addEventListener("click", () => { f.remove(); tlZeigeSetzen(null); });
  f.querySelectorAll("[data-tasche]").forEach((b) => (b.onclick = () => { f.remove(); tlAusTasche(tlTasche().find((x) => x.id === b.dataset.tasche)); }));
  f.querySelector('[data-a="geraet"]').onclick = () => { f.remove(); const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/pdf,.pdf,image/*";
    inp.onchange = () => { const d = inp.files?.[0]; if (d) tlTeilen(d); }; inp.click(); };
  f.querySelector('[data-a="archiv"]').onclick = async () => { f.remove(); let r; try { r = await api("archiv_liste"); } catch (e) { return meldeFehler(e); }
    const docs = (r.dokumente || []).filter((d) => d.status === "ok" && d.datei && (istPdf(d.name, d.mime) || /^image\//.test(d.mime || "")));
    if (!docs.length) return melde("Im Archiv liegen keine PDFs oder Fotos.", true);
    const b = blattAuf("tlArchivBlatt", `<h3 style="margin:0 0 6px">🗄️ Was zeigen?</h3><input id="tlArchivSuche" placeholder="🔍 Suchen …" autocomplete="off" style="width:100%"><div id="tlArchivListe" style="margin-top:8px"></div>
      <div class="knoepfe bs-fuss"><button class="knopf" onclick="$('tlArchivBlatt').remove()">Abbrechen</button></div>`);
    const zeichnen = () => { const q = $("tlArchivSuche").value.trim().toLowerCase(), l = docs.filter((d) => !q || `${d.titel} ${d.name}`.toLowerCase().includes(q)).slice(0, 50);
      $("tlArchivListe").innerHTML = l.map((d) => `<button type="button" class="knopf" style="text-align:left;width:100%;margin:3px 0" data-id="${esc(d.id)}">${arDateiSym(d.mime)} <b>${esc(d.titel || d.name)}</b></button>`).join("") || '<p class="hinweis">Nichts gefunden.</p>';
      $("tlArchivListe").querySelectorAll("[data-id]").forEach((x) => (x.onclick = async () => { const d = docs.find((y) => y.id === x.dataset.id); b.remove();
        try { melde("⏳ Wird geholt …"); const { blob, mime } = await anlageAlsDatei({ id: d.datei, name: d.name, mime: d.mime }); await tlTeilen(new File([blob], d.name || "Unterlage.pdf", { type: mime || blob.type })); }
        catch (e) { meldeFehler(e); } })); };
    $("tlArchivSuche").oninput = zeichnen; zeichnen(); };
}
async function tlTeilen(datei) {
  const t = tlTisch(); if (!t?.chat) return;
  if (datei.size > 8 * 1024 * 1024) return melde("📎 Höchstens 8 MB je Datei.", true);
  try {
    melde(`⏳ ${datei.name} wird hochgeladen …`);
    const a = await anlageHochladen(datei);
    await api("nachricht_senden", { id: t.chat, text: `📎 Unterlage: ${datei.name}`, anlagen: [a.id], wege: [] });
    tlZeigeSetzen({ a: a.id, n: String(datei.name).slice(0, 80), m: datei.type || "", s: 1 });
    melde("📎 Alle sehen jetzt: " + datei.name);
  } catch (e) { meldeFehler(e); }
}
function tlZeigeSetzen(z) {
  TL.zeige = z ? { ...z, von: TL.ich } : null; TL.seite = 1; TL.folgen = true; TL.pdf = null; TL.pdfFuer = null;
  tlSende({ typ: "zeige", zeige: TL.zeige }); tlBuehneZeichnen(); tlZeichnen();
}
function tlZeigeEmpfangen(z, von) {
  if (!z) { if (TL.zeige?.von === von) { TL.zeige = null; tlBuehneZeichnen(); tlZeichnen(); } return; }
  if (typeof z.a !== "string" || !/^[0-9a-f-]{36}$/i.test(z.a)) return;
  const neu = TL.zeige?.a !== z.a;
  TL.zeige = { a: z.a, n: String(z.n || "Unterlage").slice(0, 80), m: String(z.m || ""), s: Math.max(1, Number(z.s) || 1), von };
  if (neu) { TL.folgen = true; TL.pdf = null; TL.pdfFuer = null; melde(`📎 ${tlName(von)} zeigt: ${TL.zeige.n}`); }
  if (TL.folgen) TL.seite = TL.zeige.s;
  tlBuehneZeichnen(); tlZeichnen();
}
function tlBlaettern(d) {
  const z = TL.zeige; if (!z) return;
  const max = TL.pdf?.numPages || 1; TL.seite = Math.max(1, Math.min(max, TL.seite + d));
  if (z.von === TL.ich) { z.s = TL.seite; tlSende({ typ: "seite", s: TL.seite }); } else TL.folgen = TL.seite === z.s;
  tlBuehneZeichnen();
}
function tlFolgen() { if (!TL.zeige) return; TL.folgen = true; TL.seite = TL.zeige.s; tlBuehneZeichnen(); }
let tlBuehneLauf = 0;
// Die Bühne bleibt dasselbe Element (wird beim Neuzeichnen nur umgehängt) – gezeichnet wird nur, wenn sich Unterlage, Seite oder Bild ändern
function tlBuehneEl() { if (!TL.root) { TL.root = document.createElement("div"); TL.root.id = "tlBuehne"; TL.root.className = "tl-buehne"; TL.root.hidden = true; } return TL.root; }
async function tlBuehneZeichnen() {
  const el = tlBuehneEl(), z = TL.zeige, video = tlGrossVideo(), medien = !video && TL.musik?.art === "video" && TL.medienEl;
  const stand = video ? "v:" + video.pid + ":" + video.strom.id + ":" + (video.eck?.id || "") + ":" + tlEckAn() : medien ? "m:" + TL.musik.a : z ? `z:${z.a}:${TL.seite}:${TL.folgen}:${z.von === TL.ich}` : "";
  if (stand === TL.buehneStand) return;
  TL.buehneStand = stand; const lauf = ++tlBuehneLauf;
  if (video) { tlVideoAnzeigen(el, video); return; }
  if (medien) { el.hidden = false; el.innerHTML = `<div class="tl-buehne-kopf">🎬 <b>${esc(TL.musik.n)}</b> <small>· ${esc(TL.musik.von === TL.ich ? "du spielst" : tlName(TL.musik.von) + " spielt")}</small>${tlVollKnopf()}</div>`;
    el.appendChild(TL.medienEl); const al = tlAlbumKnopf(TL.musik.von, TL.musik.a, TL.musik.n, "video/mp4"); if (al) el.insertAdjacentHTML("beforeend", `<div class="tl-buehne-leiste">${al}</div>`); return; }
  if (!z) { el.innerHTML = ""; el.hidden = true; return; }
  el.hidden = false;
  const kopf = `<div class="tl-buehne-kopf">📎 <b>${esc(z.n)}</b> <small>· zeigt ${esc(z.von === TL.ich ? "du" : tlName(z.von))}</small>${tlVollKnopf()}</div>`;
  const leiste = (max) => `<div class="tl-buehne-leiste"><button class="knopf klein" onclick="tlBlaettern(-1)" aria-label="Seite zurück">‹</button><span>Seite ${TL.seite}${max ? ` / ${max}` : ""}</span>
    <button class="knopf klein" onclick="tlBlaettern(1)" aria-label="Seite weiter">›</button>${z.von !== TL.ich && !TL.folgen ? '<button class="knopf klein haupt" onclick="tlFolgen()">↩︎ Folgen</button>' : ""}
    ${z.von === TL.ich ? '<button class="knopf klein" onclick="tlZeigeSetzen(null)">⏹️ Beenden</button>' : ""}</div>`;
  try {
    if (/^image\//.test(z.m)) {
      if (TL.pdfFuer !== z.a) { el.innerHTML = kopf + '<p class="hinweis">Wird geladen …</p>'; const r = await api("anlage_url", { id: z.a }, { still: true }); if (lauf !== tlBuehneLauf) return; TL.pdfFuer = z.a; TL.bildUrl = r.url; }
      el.innerHTML = kopf + `<img class="tl-seite" src="${esc(TL.bildUrl)}" alt="${esc(z.n)}">` + `<div class="tl-buehne-leiste">${tlAlbumKnopf(z.von, z.a, z.n, z.m)}${z.von === TL.ich ? '<button class="knopf klein" onclick="tlZeigeSetzen(null)">⏹️ Beenden</button>' : ""}</div>`;
      return;
    }
    if (TL.pdfFuer !== z.a) {
      el.innerHTML = kopf + '<p class="hinweis">Wird geladen …</p>';
      const r = await api("anlage_url", { id: z.a }, { still: true }), pdfjs = await pdfjsHolen();
      const pdf = await pdfjs.getDocument({ url: r.url, isEvalSupported: false }).promise;
      if (lauf !== tlBuehneLauf) return pdf.destroy();
      TL.pdf?.destroy?.(); TL.pdf = pdf; TL.pdfFuer = z.a;
    }
    TL.seite = Math.min(TL.seite, TL.pdf.numPages);
    const src = await pdfSeiteAlsBild(TL.pdf, TL.seite, Math.min(1400, Math.round((el.clientWidth || 360) * Math.min(2, devicePixelRatio || 1))));
    if (lauf !== tlBuehneLauf) return;
    el.innerHTML = kopf + `<img class="tl-seite" src="${src}" alt="Seite ${TL.seite}">` + leiste(TL.pdf.numPages);
  } catch (e) { TL.buehneStand = ""; if (lauf === tlBuehneLauf) el.innerHTML = kopf + `<p class="hinweis">⚠️ Konnte nicht geladen werden – im Tisch-Chat liegt die Datei auch. ${esc(String(e?.message || "").slice(0, 80))}</p>`; }
}
// ⛶ Vollbild für die Bühne (Bildschirm, PDF, Foto) – wo der Browser es kann; Zurück mit „Esc“ oder der Zurück-Geste
const tlVollKnopf = () => (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen ? '<button class="knopf klein tl-voll" onclick="tlVollbild()" aria-label="Vollbild">⛶</button>' : "");
function tlVollbild() {
  const el = tlBuehneEl(); if (document.fullscreenElement) return document.exitFullscreen?.();
  (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => melde("Vollbild geht hier nicht.", true));
}
// Großes Bild: geteilter Bildschirm geht vor; sonst nichts (Kameras stehen klein bei den Leuten)
function tlGrossVideo() {
  // nur, solange er laut Leitung die Kamera an hat (der Browser meldet ein abgeschaltetes Bild erst spät als stumm)
  const eckVon = (v) => (v.eckStrom && TL.peers.get(v.an)?.cam && v.eckStrom.getVideoTracks().some((x) => x.readyState === "live" && !x.muted) ? v.eckStrom : null);
  for (const [, v] of TL.pcs) if (!v.raus && v.strom && TL.peers.get(v.an)?.schirm && v.strom.getVideoTracks().some((x) => !x.muted)) return { strom: v.strom, pid: v.an, eck: eckVon(v) };
  if (TL.schirm) return { strom: TL.schirm, pid: TL.ich, selbst: true, eck: TL.cam || null };
  return null;
}
function tlVideoAnzeigen(el, g) {
  el.hidden = false;
  let v = el.querySelector("video.tl-gross");
  if (!v) { el.innerHTML = `<div class="tl-buehne-kopf">🖥️ <b id="tlGrossName"></b><span id="tlEckKnopf"></span>${tlVollKnopf()}</div><div class="tl-gross-rahmen"><video class="tl-gross" autoplay playsinline muted></video><video class="tl-eck" autoplay playsinline muted hidden></video></div>`; v = el.querySelector("video.tl-gross"); }
  el.querySelector("#tlGrossName").textContent = g.selbst ? "Du zeigst deinen Bildschirm" : `${tlName(g.pid)} zeigt den Bildschirm`;
  if (v.srcObject !== g.strom) { v.srcObject = g.strom; v.play?.().catch(() => {}); }
  // 2.772.0 KC-CLUB-RUNDER-TISCH-ECKE: Kamera klein in der Ecke – jeder schaltet selbst (Knopf nur, wenn es eine Kamera gibt)
  const eck = el.querySelector("video.tl-eck"), an = tlEckAn();
  el.querySelector("#tlEckKnopf").innerHTML = g.eck ? `<button class="knopf klein tl-eck-knopf${an ? " haupt" : ""}" onclick="tlEckUmschalten()" aria-pressed="${an}" title="${g.selbst ? "Dich" : tlName(g.pid)} klein in der Ecke zeigen oder ausblenden">🙂 Ecke ${an ? "an" : "aus"}</button>` : "";
  eck.hidden = !(g.eck && an);
  if (!eck.hidden && eck.srcObject !== g.eck) { eck.srcObject = g.eck; eck.play?.().catch(() => {}); }
  if (eck.hidden && eck.srcObject) eck.srcObject = null;
}

// ---- Anzeige im Tisch-Fenster (#tlBereich, vom Hauptprogramm angelegt) ----
function tlZeichnen() {
  const box = document.getElementById("tlBereich"); if (!box) return;
  const t = tlTisch();
  if (!TL.live || !t || TL.id !== RUND.offen) { box.innerHTML = ""; return; }
  const r = tlRegel(), leute = tlLiveLeute(), ichLeiter = t.gastgeber === TL.ich, alle = [...TL.peers.entries()];
  const zeichen = (p, pid) => [p.mic ? "🎙️" : "🔇", p.cam ? "📷" : "", p.schirm ? "🖥️" : "", p.hand ? "✋" : "", TL.stab === pid ? "🥄" : ""].filter(Boolean).join(" ");
  const verbunden = (pid) => [...TL.pcs.values()].some((v) => v.an === pid && v.ok);
  const person = (pid, p, unsicher) => `<div class="tl-person${unsicher ? " unsicher" : ""}${TL.pegel.get(pid)?.spricht ? " spricht" : ""}" data-pid="${esc(pid)}" ${ichLeiter && pid !== TL.ich ? `role="button" tabindex="0" onclick="tlStab(${jsArg(pid)})" title="Antippen: Redestab geben/nehmen"` : ""}>
      ${p.cam ? `<video class="tl-kamera" data-cam="${esc(pid)}" autoplay playsinline muted></video>` : `<span class="tl-ini">${esc(initialen(p.name || "?"))}</span>`}
      <span class="tl-pname">${esc(pid === TL.ich ? "Du" : p.name || tlName(pid))}</span><span class="tl-zeichen">${zeichen(p, pid)}${unsicher ? " ⚪" : pid !== TL.ich && (p.mic || p.cam || p.schirm) && !verbunden(pid) ? " ⏳" : ""}</span></div>`;
  const ich = { name: ICH.name || "Du", mic: TL.micAn, cam: !!TL.cam, schirm: !!TL.schirm, hand: TL.hand };
  const hand = alle.filter(([, p]) => p.hand).map(([pid]) => tlName(pid));
  box.innerHTML = `<div class="tl-kopf"><span class="tl-rot">🔴 Live</span> ${leute.length + 1} dabei · ${r.frei ? `offenes Gespräch (bis ${TL.freiBis} reden alle)` : `🥄 Redestab: ${esc(TL.stab ? tlName(TL.stab) : "nur die Leitung")}`}
      ${!TL.L?.ok ? ' · <span class="tl-warn">⏳ Leitung wird aufgebaut</span>' : ""}</div>
    ${hand.length && ichLeiter ? `<div class="tl-hand">✋ Gemeldet: ${esc(hand.join(", "))} – auf die Person tippen, um den Redestab zu geben.</div>` : ""}
    ${TL.musik ? tlMusikZeile() : ""}
    <div id="tlBuehneHier"></div>
    <div id="tlLeute" class="tl-leute">${person(TL.ich, ich, false)}${alle.map(([pid, p]) => person(pid, p, Date.now() - p.zeit > TL_WEG_MS)).join("")}</div>
    <div class="tl-leiste">
      <button class="knopf${TL.micAn ? " haupt" : ""}" onclick="tlMikro(${!TL.micAn})" ${r.darfSprechen ? "" : "disabled"}><span>${TL.micAn ? "🎙️" : "🔇"}</span>${TL.micAn ? "Mikro an" : "Mikro aus"}</button>
      <button class="knopf${TL.cam ? " haupt" : ""}" onclick="tlKamera()" ${r.darfSprechen ? "" : "disabled"}><span>📷</span>Kamera</button>
      ${tlSchirmGeht() ? `<button class="knopf${TL.schirm ? " haupt" : ""}" onclick="tlSchirm()" ${r.darfSprechen ? "" : "disabled"}><span>🖥️</span>Bildschirm</button>` : ""}
      ${t.chat ? `<button class="knopf${TL.zeige?.von === TL.ich ? " haupt" : ""}" onclick="tlUnterlagen()"><span>📎</span>Zeigen</button>
      <button class="knopf${TL.musik ? " haupt" : ""}" onclick="tlMusik()"><span>🎵</span>Lied/Video</button>
      ${tlTasche().some((x) => !x.gezeigt) ? `<button class="knopf" onclick="tlTascheNaechstes()"><span>💼</span>Nächstes</button>` : ""}` : ""}
      ${r.darfSprechen ? "" : `<button class="knopf${TL.hand ? " haupt" : ""}" onclick="tlHand()"><span>✋</span>${TL.hand ? "Gemeldet" : "Melden"}</button>`}
      <button class="knopf" onclick="tlStopp()"><span>⏹️</span>Live aus</button>
    </div>
    ${tlSchirmGeht() ? "" : '<p class="hinweis tl-tipp">🖥️ Bildschirm zeigen geht vom PC oder Laptop aus. Am Handy zeigst du Unterlagen mit 📎.</p>'}`;
  box.querySelector("#tlBuehneHier").replaceWith(tlBuehneEl());
  // Kamerabilder einhängen (ohne die Verbindung anzufassen)
  box.querySelectorAll("video[data-cam]").forEach((v) => {
    const pid = v.dataset.cam, x = [...TL.pcs.values()].find((y) => !y.raus && y.an === pid && y.strom);
    const s = pid === TL.ich ? TL.cam : (TL.peers.get(pid)?.schirm && x?.eckStrom?.getVideoTracks().some((t) => !t.muted) ? x.eckStrom : x?.strom); // 2.772.0: zeigt er den Bildschirm, steht in seiner Kachel die Kamera
    if (s) { v.srcObject = s; v.play?.().catch(() => {}); }
  });
  tlBuehneZeichnen(); tlMusikMini(); // 2.774.0: Musik-Leiste unten nur, wenn der Tisch nicht zu sehen ist
}

// ---- 🎵 Musik für alle (z. B. der Club-Song – Hansi: „ein externes Lied, nicht der Platzhalter-Song der Bühne“) ----
// Das Lied ist eine Audiodatei (MP3 o. ä., höchstens 8 MB) vom Gerät oder aus dem Archiv. Sie kommt wie jede Unterlage in den Tisch-Chat
// (alle dürfen sie laden), jedes Gerät lädt sie vorab und spielt sie selbst – es läuft kein Ton über die Leitung (spart Datenvolumen, klingt gut).
// Gleichzeitig: Startzeit in der Uhr dessen, der abspielt; jedes Gerät rechnet sie mit dem gemessenen Uhrenabstand um (kleinster Wert aus den
// Lebenszeichen = Uhrenabstand + kürzeste Laufzeit). Wer später kommt, steigt an der richtigen Stelle ein. Lautstärke stellt jeder selbst.
const TL_MUSIK_VORLAUF = 3000, tlIstAudio = (name, mime) => /^audio\//.test(mime || "") || /\.(mp3|m4a|aac|ogg|oga|opus|wav)$/i.test(name || "");
// 2.773.0 KC-CLUB-RUNDER-TISCH-VIDEO: kurze Videos (≤ 8 MB, wie alle Anlagen) laufen genauso – gleichzeitig, aber groß auf der Bühne
const tlIstVideo = (name, mime) => /^video\//.test(mime || "") || /\.(mp4|m4v|webm|mov)$/i.test(name || "");
const tlMedienArt = (name, mime) => (tlIstVideo(name, mime) ? "video" : tlIstAudio(name, mime) ? "audio" : null);
function tlUhr(pid, t) { const x = Number(t); if (!x) return; const d = Date.now() - x, alt = TL.uhr.get(pid); if (alt === undefined || d < alt) TL.uhr.set(pid, d); }
const tlInMeinerZeit = (pid, t) => t + (TL.uhr.get(pid) ?? 0);
const tlMusikStand = () => { const m = TL.musik; return m ? { a: m.a, n: m.n, art: m.art || "audio", start: m.start, pause: m.pause ?? null } : null; };
async function tlMusik() {
  const t = tlTisch(); if (!t?.chat) return;
  if (TL.musik?.von === TL.ich) { // läuft von mir: Pause / weiter / aus
    const f = dlgOeffnen(`<button type="button" class="dlg-x" data-a="zu" aria-label="Schließen">✕</button><h3 class="dlg-kopf">🎵 ${esc(TL.musik.n)}</h3>
      <div class="ca-wahl"><button type="button" class="knopf haupt" data-a="pause">${TL.musik.pause != null ? "▶️ Weiter" : "⏸️ Pause"}</button><button type="button" class="knopf" data-a="neu">⏮️ Von vorn</button><button type="button" class="knopf" data-a="aus">⏹️ Aus</button></div>`, () => f.remove());
    f.querySelector('[data-a="zu"]').onclick = () => f.remove();
    f.querySelector('[data-a="pause"]').onclick = () => { f.remove(); tlMusikPause(); };
    f.querySelector('[data-a="neu"]').onclick = () => { f.remove(); tlMusikSetzen({ ...TL.musik, start: Date.now() + TL_MUSIK_VORLAUF, pause: null }); };
    f.querySelector('[data-a="aus"]').onclick = () => { f.remove(); tlMusikSetzen(null); };
    return;
  }
  if (!tlRegel().darfZeigen) return melde("🎵 Musik für alle startet im Redestab-Modus die Leitung oder wer den Redestab hat.", true);
  const f = dlgOeffnen(`<button type="button" class="dlg-x" data-a="zu" aria-label="Schließen">✕</button><h3 class="dlg-kopf">🎵 Musik für alle</h3>
    <p class="dlg-text">Ein Lied (MP3) oder ein kurzes Video (MP4), höchstens 8 MB – alle hören bzw. sehen es gleichzeitig. Es kommt in den Tisch-Chat.${TL.musik ? `<br>Gerade läuft: „${esc(TL.musik.n)}“ von ${esc(tlName(TL.musik.von))} – deins ersetzt es.` : ""}</p>
    ${tlTasche(["musik"]).length ? `<div class="tl-tasche-wahl"><b>💼 Aus meiner Tasche</b>${tlTasche(["musik"]).map((x) => `<button type="button" class="knopf" data-tasche="${esc(x.id)}">🎵 ${esc(x.name)}${x.gezeigt ? " ✓" : ""}</button>`).join("")}</div>` : ""}
    <div class="ca-wahl"><button type="button" class="knopf haupt" data-a="archiv">🗄️ Aus dem Archiv (z. B. Club-Song)</button><button type="button" class="knopf" data-a="kamera">🎬 Video aufnehmen</button><button type="button" class="knopf" data-a="geraet">📱 Vom Gerät</button></div>`, () => f.remove());
  f.querySelector('[data-a="zu"]').onclick = () => f.remove();
  f.querySelectorAll("[data-tasche]").forEach((b) => (b.onclick = () => { f.remove(); tlAusTasche(tlTasche().find((x) => x.id === b.dataset.tasche)); })); // 2.774.0
  f.querySelector('[data-a="geraet"]').onclick = () => { f.remove(); const inp = document.createElement("input"); inp.type = "file"; inp.accept = "audio/*,video/*,.mp3,.m4a,.ogg,.wav,.mp4,.webm,.mov";
    inp.onchange = () => { const d = inp.files?.[0]; if (d) tlMusikTeilen(d); }; inp.click(); };
  f.querySelector('[data-a="kamera"]').onclick = () => { f.remove(); const inp = document.createElement("input"); inp.type = "file"; inp.accept = "video/*"; inp.setAttribute("capture", "environment");
    inp.onchange = () => { const d = inp.files?.[0]; if (d) tlMusikTeilen(d); }; inp.click(); };
  f.querySelector('[data-a="archiv"]').onclick = async () => { f.remove(); let r; try { r = await api("archiv_liste"); } catch (e) { return meldeFehler(e); }
    const docs = (r.dokumente || []).filter((d) => d.status === "ok" && d.datei && tlMedienArt(d.name, d.mime));
    if (!docs.length) return melde("Im Archiv liegt noch kein Lied und kein Video. Einmal ins Archiv legen (z. B. Ordner „Club-Song“), dann geht es mit einem Tipp.", true);
    const b = blattAuf("tlArchivBlatt", `<h3 style="margin:0 0 6px">🎵 Welches Lied?</h3><div id="tlArchivListe"></div><div class="knoepfe bs-fuss"><button class="knopf" onclick="$('tlArchivBlatt').remove()">Abbrechen</button></div>`);
    $("tlArchivListe").innerHTML = docs.slice(0, 60).map((d) => `<button type="button" class="knopf" style="text-align:left;width:100%;margin:3px 0" data-id="${esc(d.id)}">${tlMedienArt(d.name, d.mime) === "video" ? "🎬" : "🎵"} <b>${esc(d.titel || d.name)}</b></button>`).join("");
    $("tlArchivListe").querySelectorAll("[data-id]").forEach((x) => (x.onclick = async () => { const d = docs.find((y) => y.id === x.dataset.id); b.remove();
      try { melde("⏳ Lied wird geholt …"); const { blob, mime } = await anlageAlsDatei({ id: d.datei, name: d.name, mime: d.mime }); await tlMusikTeilen(new File([blob], d.name || "Lied.mp3", { type: mime || blob.type || "audio/mpeg" })); }
      catch (e) { meldeFehler(e); } })); };
}
async function tlMusikTeilen(datei) {
  const t = tlTisch(); if (!t?.chat) return;
  const art = tlMedienArt(datei.name, datei.type);
  if (!art) return melde("🎵 Bitte ein Lied (MP3, M4A, OGG, WAV) oder ein Video (MP4, WEBM, MOV) wählen.", true);
  if (datei.size > 8 * 1024 * 1024) return melde(art === "video" ? "🎬 Höchstens 8 MB je Video – das sind etwa 60 Sekunden. Bitte kürzer aufnehmen." : "🎵 Höchstens 8 MB je Lied.", true);
  try {
    melde(`⏳ ${datei.name} wird hochgeladen …`);
    const a = await anlageHochladen(datei);
    await api("nachricht_senden", { id: t.chat, text: `${art === "video" ? "🎬 Video" : "🎵 Musik"} für alle: ${datei.name}`, anlagen: [a.id], wege: [] });
    TL.musikDatei = { a: a.id, url: URL.createObjectURL(datei) }; // ich habe die Datei schon
    tlMusikSetzen({ a: a.id, n: String(datei.name).slice(0, 80), art, start: Date.now() + TL_MUSIK_VORLAUF, pause: null });
    melde("🎵 Gleich hören alle: " + datei.name);
  } catch (e) { meldeFehler(e); }
}
function tlMusikSetzen(m) {
  TL.musik = m ? { ...m, von: TL.ich } : null;
  tlSende({ typ: "musik", musik: tlMusikStand(), t: Date.now() }); tlMusikSpielen(); tlZeichnen();
}
function tlMusikPause() {
  const m = TL.musik; if (!m || m.von !== TL.ich) return;
  if (m.pause != null) tlMusikSetzen({ ...m, start: Date.now() + 600 - m.pause, pause: null }); // weiter ab der Pausenstelle
  else tlMusikSetzen({ ...m, pause: Math.max(0, Date.now() - m.start) });
}
function tlMusikEmpfangen(m, von) {
  // 2.774.0 KC-CLUB-TISCH-MUSIK-STOPP: aus schaltet, wer abspielt – oder die Leitung des Tisches für alle
  if (!m) { if (TL.musik && (TL.musik.von === von || von === tlTisch()?.gastgeber)) { if (TL.musik.von !== von) melde(`⏹️ ${tlName(von)} hat die Musik ausgeschaltet`); tlMusikAus(); } tlZeichnen(); return; }
  if (typeof m.a !== "string" || !/^[0-9a-f-]{36}$/i.test(m.a) || !Number(m.start)) return;
  const neu = TL.musik?.a !== m.a || TL.musik?.von !== von;
  TL.musik = { a: m.a, n: String(m.n || "Lied").slice(0, 80), art: m.art === "video" ? "video" : "audio", start: tlInMeinerZeit(von, Number(m.start)), pause: m.pause == null ? null : Math.max(0, Number(m.pause) || 0), von };
  if (neu) melde(`${TL.musik.art === "video" ? "🎬" : "🎵"} ${tlName(von)} spielt für alle: ${TL.musik.n}`);
  tlMusikSpielen(); tlZeichnen();
}
let tlMusikLauf = 0;
async function tlMusikSpielen() {
  const m = TL.musik, lauf = ++tlMusikLauf;
  let el = TL.medienEl || document.getElementById("tlMusikTon"); // Video hängt an der Bühne (evtl. gerade nicht im Fenster)
  if (!m) { if (el) { el.pause(); el.remove(); } TL.medienEl = null; tlBuehneZeichnen(); return; }
  const tag = m.art === "video" ? "VIDEO" : "AUDIO";
  if (el && el.tagName !== tag) { el.pause(); el.remove(); el = null; }
  if (!el) { el = document.createElement(tag.toLowerCase()); el.id = "tlMusikTon"; el.preload = "auto"; el.setAttribute("playsinline", ""); el.volume = TL.musikLaut ?? 0.8;
    if (tag === "VIDEO") { el.className = "tl-gross"; TL.medienEl = el; } else { el.hidden = true; document.body.appendChild(el); } }
  if (tag === "VIDEO") tlBuehneZeichnen();
  el.muted = !!TL.musikStumm; tlMusikMini(); // 2.774.0 KC-CLUB-TISCH-MUSIK-STOPP
  try {
    if (TL.musikDatei?.a !== m.a) { // einmal laden (der Link gilt nur kurz) – dann aus dem Speicher spielen
      const { blob } = await anlageAlsDatei({ id: m.a, name: m.n }); if (lauf !== tlMusikLauf) return;
      if (TL.musikDatei?.url) URL.revokeObjectURL(TL.musikDatei.url);
      TL.musikDatei = { a: m.a, url: URL.createObjectURL(blob) };
    }
    if (el.dataset.a !== m.a) { el.src = TL.musikDatei.url; el.dataset.a = m.a; await new Promise((ok) => { if (el.readyState >= 1) ok(); else { el.onloadedmetadata = ok; el.onerror = ok; } }); }
    if (lauf !== tlMusikLauf) return;
    if (m.pause != null) { el.pause(); el.currentTime = Math.min(m.pause / 1000, el.duration || 1e9); return; }
    const warten = m.start - Date.now();
    clearTimeout(TL.musikUhr);
    const los = () => { if (lauf !== tlMusikLauf) return; const pos = Math.max(0, (Date.now() - m.start) / 1000);
      if (el.duration && pos >= el.duration) { el.pause(); return; }
      if (Math.abs(el.currentTime - pos) > 0.25) el.currentTime = pos; el.play?.().catch(() => melde("🔊 Zum Hören bitte einmal auf „🎵 Musik“ tippen.", true)); };
    if (warten > 0) { el.pause(); el.currentTime = 0; TL.musikUhr = setTimeout(los, warten); } else los();
  } catch (e) { if (lauf === tlMusikLauf) melde("🎵 Das Lied konnte nicht geladen werden – im Tisch-Chat liegt es auch.", true); }
}
function tlMusikAus() {
  if (TL.musik) TL.musikAus = { a: TL.musik.a, bis: Date.now() + 15000 }; // 2.774.0: gleich danach nicht durch Lebenszeichen wieder starten
  clearTimeout(TL.musikUhr); tlMusikLauf++; TL.musik = null; TL.musikStumm = false; const el = document.getElementById("tlMusikTon") || TL.medienEl; if (el) { el.pause(); el.remove(); } TL.medienEl = null; tlBuehneZeichnen();
  tlMusikMini();
}
// 2.774.0 KC-CLUB-TISCH-MUSIK-STOPP (Fund Hansi 30.10.: „beim Musik abspielen konnte ich nicht Stop drücken – es gab keinen Knopf“):
// Die Knöpfe stehen jetzt direkt an der laufenden Musik – wer abspielt: ⏸️/▶️, ⏮️, ⏹️ Aus (für alle); die Leitung: ⏹️ Für alle aus;
// jeder: 🔇 Für mich aus (nur das eigene Gerät). Ist der Tisch nicht offen (z. B. im Chat), hängt eine kleine Musik-Leiste unten am Bildschirm.
function tlMusikKnoepfe(m, klein) {
  const k = (fn, t, haupt) => `<button type="button" class="knopf klein${haupt ? " haupt" : ""}" onclick="${fn}">${t}</button>`;
  const leiter = tlTisch()?.gastgeber === TL.ich, meins = m.von === TL.ich;
  return [meins ? k("tlMusikPause()", m.pause != null ? "▶️ Weiter" : "⏸️ Pause", true) : "",
    meins && !klein ? k("tlMusikSetzen({ ...TL.musik, start: Date.now() + TL_MUSIK_VORLAUF, pause: null })", "⏮️ Von vorn") : "",
    meins ? k("tlMusikSetzen(null)", "⏹️ Aus") : leiter ? k("tlMusikFuerAlleAus()", "⏹️ Für alle aus") : "",
    meins ? "" : k("tlMusikStumm()", TL.musikStumm ? "🔈 Für mich an" : "🔇 Für mich aus")].join("");
}
function tlMusikFuerAlleAus() { if (!TL.musik || tlTisch()?.gastgeber !== TL.ich) return; tlSende({ typ: "musik", musik: null, t: Date.now() }); tlMusikAus(); tlZeichnen(); melde("⏹️ Musik für alle aus"); }
function tlMusikStumm() { TL.musikStumm = !TL.musikStumm; const el = TL.medienEl || document.getElementById("tlMusikTon"); if (el) el.muted = TL.musikStumm; tlZeichnen(); tlMusikMini(); }
function tlMusikMini() {
  const m = TL.musik, bereich = document.getElementById("tlBereich"), sichtbar = !!bereich && bereich.getClientRects().length > 0;
  let el = document.getElementById("tlMusikMini");
  if (!m || sichtbar) { el?.remove(); clearInterval(TL.musikMiniUhr); TL.musikMiniUhr = m ? setInterval(tlMusikMini, 1500) : null; return; }
  if (!el) { el = document.createElement("div"); el.id = "tlMusikMini"; el.className = "tl-musik-mini"; el.setAttribute("role", "region"); el.setAttribute("aria-label", "Musik am Runden Tisch"); document.body.appendChild(el); }
  el.innerHTML = `<span class="tl-musik-titel">${m.art === "video" ? "🎬" : "🎵"} <b>${esc(m.n)}</b>${m.pause != null ? " · ⏸️" : TL.musikStumm ? " · 🔇" : ""}</span><span class="tl-musik-knoepfe">${tlMusikKnoepfe(m, true)}</span>`;
  if (!TL.musikMiniUhr) TL.musikMiniUhr = setInterval(tlMusikMini, 1500);
}
function tlMusikLaut(v) { TL.musikLaut = Math.max(0, Math.min(1, Number(v))); const el = TL.medienEl || document.getElementById("tlMusikTon"); if (el) el.volume = TL.musikLaut; }
function tlMusikZeile() {
  const m = TL.musik;
  return `<div class="tl-musik">${m.art === "video" ? "🎬" : "🎵"} <b>${esc(m.n)}</b> <small>· ${esc(m.von === TL.ich ? "du spielst" : tlName(m.von) + " spielt")}${m.pause != null ? " · ⏸️ Pause" : ""}${TL.musikStumm ? " · 🔇 bei dir aus" : ""}</small>
    <div class="tl-musik-knoepfe">${tlMusikKnoepfe(m)}</div>
    <label class="tl-laut">🔈<input type="range" min="0" max="1" step="0.05" value="${TL.musikLaut ?? 0.8}" oninput="tlMusikLaut(this.value)" aria-label="Lautstärke Musik"></label></div>`;
}

// ---- 📸 Ins Fotoalbum übernehmen (Spezifikation Abschnitt 6): Fotos und Videos im Tisch-Chat werden nach 7 Tagen gelöscht – was bleiben soll,
// übernimmt wer es zeigt oder wer den Tisch leitet. Vorhandener Weg wie beim Ablagekorb: Datei holen → Hochlade-Formular des Albums (Thema wählen,
// „Hochladen“). Erst dann ist es im Album – und gehört dann zum Album, nicht mehr zum Tisch.
function tlAlbumKnopf(von, a, n, mime) {
  const t = tlTisch(); if (von !== TL.ich && t?.gastgeber !== TL.ich) return "";
  return `<button class="knopf klein" onclick="tlInsAlbum(${jsArg(a)}, ${jsArg(n)}, ${jsArg(mime || "")})">📸 Ins Album</button>`;
}
async function tlInsAlbum(a, n, mime) {
  try {
    melde("⏳ Wird für das Fotoalbum geholt …");
    const { blob, mime: m } = await anlageAlsDatei({ id: a, name: n, mime });
    faFilter = {}; faPapierkorb = false; faGeteilt = [new File([blob], n || "Foto", { type: m || mime || blob.type })];
    zeige("fotos"); melde("📸 Thema wählen und unten „Hochladen“ tippen – erst dann ist es im Album. Live läuft weiter.");
  } catch (e) { meldeFehler(e); }
}

// ---- 2.774.0 KC-CLUB-TISCH-TASCHE: vorher Gepacktes mit einem Tipp zeigen bzw. abspielen (Datei liegt schon hochgeladen, meist schon auf dem Gerät) ----
// Zeigen = derselbe Weg wie „Vom Gerät“: Anlage in den Tisch-Chat (alle haben sie danach), dann „Zeigen“ bzw. „Musik für alle“.
function tlTasche(arten) { const T = typeof RUND !== "undefined" ? RUND.tasche?.[TL.id] : null; return (T?.meine || []).filter((x) => !arten || arten.includes(x.art)); }
function tlTascheNaechstes() { const x = tlTasche().find((y) => !y.gezeigt); if (!x) return melde("💼 In deiner Tasche ist nichts mehr, was noch nicht gezeigt wurde."); tlAusTasche(x); }
async function tlAusTasche(x) {
  const t = tlTisch(); if (!x || !t?.chat) return;
  if (!tlRegel().darfZeigen) return melde("💼 Zeigen geht im Redestab-Modus mit dem Redestab – frag die Leitung.", true);
  try {
    const musik = x.art === "musik";
    await api("nachricht_senden", { id: t.chat, text: musik ? `🎵 Musik für alle: ${x.name}` : `📎 Unterlage: ${x.name}`, anlagen: [x.a], wege: [] });
    if (musik) {
      const c = RUND_DATEIEN.get(x.a); if (c) { if (TL.musikDatei?.url) URL.revokeObjectURL(TL.musikDatei.url); TL.musikDatei = { a: x.a, url: URL.createObjectURL(c.blob) }; }
      tlMusikSetzen({ a: x.a, n: String(x.name).slice(0, 80), start: Date.now() + TL_MUSIK_VORLAUF, pause: null });
    } else { tlZeigeSetzen({ a: x.a, n: String(x.name).slice(0, 80), m: x.mime || "", s: 1 }); melde("📎 Alle sehen jetzt: " + x.name); }
    x.gezeigt = true; rundTascheTun(TL.id, x.id, "gezeigt"); tlZeichnen();
  } catch (e) { meldeFehler(e); }
}
