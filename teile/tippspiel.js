// KC-CLUB-TIPPSPIEL (2.971.0, Wunschliste #96 – Antworten Hansi 17.11.2026: „Bundesliga, Mitglieder und Aushilfen, alle Spiele und Vereine“) –
// Programmteil, wird erst beim Öffnen geladen (KC-CLUB-TEILE). Spiele/Ergebnisse liefert der Club-Server (OpenLigaDB, kostenlos), hier nur Anzeige und Tippen.
// Punkte: 3 genau · 2 Tordifferenz · 1 Tendenz. Tipps der anderen erst ab Anpfiff. Tippen bis zum Anpfiff.
const TP = { d: null, tag: null, reiter: "spiele" };
const TP_CACHE = "kc_club_tipp_cache";
function tpCacheSchreiben(d) { try { localStorage.setItem(TP_CACHE, JSON.stringify({ am: Date.now(), dabei: !!d.dabei, bald: d.bald || [] })); } catch {} }
async function tpStart(tag) {
  TP.tag = tag ?? null;
  const f = blattAuf("tpBlatt", `<h3 style="margin-top:0">⚽ Bundesliga-Tippspiel</h3><div id="tpInhalt"><div class="karte hinweis">Wird geladen …</div></div>`);
  await tpLaden();
  return f;
}
async function tpLaden() {
  try { TP.d = await api("tipp_stand", TP.tag ? { spieltag: TP.tag } : {}, { warten: true }); } catch (e) { if ($("tpInhalt")) $("tpInhalt").innerHTML = `<div class="karte hinweis">⚠️ ${esc(e.message || "Gerade nicht erreichbar.")}</div>`; return; }
  TP.tag = TP.d.spieltag; tpCacheSchreiben(TP.d); tpZeigen();
}
const tpZeit = (iso) => new Date(iso).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const tpPunkteMarke = (p) => p === null || p === undefined ? "" : `<span class="tp-pkt tp-p${p}">${p === 3 ? "🎯 3" : p} P.</span>`;
function tpZeigen() {
  const d = TP.d, z = $("tpInhalt"); if (!d || !z) return;
  if (!d.dabei) {
    z.innerHTML = `<div class="karte" style="border:2px solid var(--gruen)"><b>⚽ Tippst du mit?</b><p style="margin:6px 0">Vor jedem Bundesliga-Spiel tippst du das Ergebnis – zwei Zahlen, bis zum Anpfiff.
      Für das genaue Ergebnis gibt es <b>3 Punkte</b>, für die richtige Tordifferenz <b>2</b>, für den richtigen Sieger bzw. Unentschieden <b>1</b>. Wer am Ende vorn liegt, ist 🏆 Tippkönig im Köcheclub.</p>
      <div class="knoepfe"><button class="knopf haupt" onclick="einmal(this, () => tpMitmachen(true))">⚽ Ja, ich tippe mit</button><button class="knopf" onclick="fensterZu($('tpBlatt'))">Später</button></div></div>
      ${tpTabelleHtml(d, 5)}`;
    return;
  }
  const tage = d.tage || [], i = tage.indexOf(d.spieltag);
  const reiter = (w, t) => `<button class="chip${TP.reiter === w ? " an" : ""}" onclick="TP.reiter='${w}';tpZeigen()">${t}</button>`;
  z.innerHTML = `<div class="hl-chips">${reiter("spiele", "⚽ Spiele")}${reiter("tabelle", "🏆 Tabelle")}</div>
    ${TP.reiter === "tabelle" ? tpTabelleHtml(d) : `
    <div class="tp-tagwahl"><button class="knopf klein" ${i > 0 ? "" : "disabled"} onclick="tpTag(${tage[i - 1] || 0})" aria-label="Spieltag davor">◀</button>
      <b>${d.spieltag ? d.spieltag + ". Spieltag" : "Noch keine Spiele"}</b><button class="knopf klein" ${i >= 0 && i < tage.length - 1 ? "" : "disabled"} onclick="tpTag(${tage[i + 1] || 0})" aria-label="Spieltag danach">▶</button></div>
    ${(d.spiele || []).map(tpSpielHtml).join("") || '<p class="hinweis">Für diesen Spieltag sind noch keine Spiele da.</p>'}
    <p class="hinweis" style="margin:8px 0 0">Tippen bis zum Anpfiff. Die Tipps der anderen siehst du ab Anpfiff. Spiele und Ergebnisse: OpenLigaDB.</p>
    <div class="knoepfe"><button class="knopf klein" onclick="einmal(this, () => tpMitmachen(false))">Nicht mehr mittippen</button></div>`}`;
}
function tpSpielHtml(s) {
  const tipp = s.mein ? `${s.mein[0]}:${s.mein[1]}` : "–";
  const kopf = `<div class="tp-teams"><span>${esc(s.heim)}</span><b class="tp-erg">${s.tore ? `${s.tore[0]}:${s.tore[1]}` : s.los ? "läuft" : "–:–"}</b><span>${esc(s.gast)}</span></div>`;
  if (!s.los) return `<div class="karte tp-spiel">${kopf}<div class="hinweis tp-zeit">${esc(tpZeit(s.anpfiff))}</div>
    <div class="tp-eingabe"><input type="number" inputmode="numeric" min="0" max="20" id="tpH${s.id}" value="${s.mein ? s.mein[0] : ""}" aria-label="Tore ${esc(s.heim)}"><span>:</span>
      <input type="number" inputmode="numeric" min="0" max="20" id="tpG${s.id}" value="${s.mein ? s.mein[1] : ""}" aria-label="Tore ${esc(s.gast)}">
      <button class="knopf klein ${s.mein ? "" : "haupt"}" onclick="einmal(this, () => tpTippen(${s.id}))">${s.mein ? "✔ Ändern" : "Tippen"}</button></div></div>`;
  const andere = (s.andere || []).map((a) => `<span class="tp-anderer">${esc(a.name)} ${a.tipp[0]}:${a.tipp[1]}${a.punkte !== null ? ` <small>(${a.punkte})</small>` : ""}</span>`).join("");
  return `<div class="karte tp-spiel">${kopf}<div class="hinweis tp-zeit">${esc(tpZeit(s.anpfiff))}${s.fertig ? " · beendet" : " · ⏱️ läuft"}</div>
    <div>Dein Tipp: <b>${tipp}</b> ${tpPunkteMarke(s.meinePunkte)}</div>${andere ? `<div class="tp-andere">${andere}</div>` : ""}</div>`;
}
function tpTabelleHtml(d, max) {
  const t = (d.tabelle || []).slice(0, max || 999);
  if (!t.length) return '<p class="hinweis">Noch niemand dabei – sei der Erste!</p>';
  return `<div class="karte"><h4 style="margin:0 0 6px">🏆 Tabelle ${d.saison}/${String(d.saison + 1).slice(2)}</h4>
    ${t.map((r, i) => `<div class="zeile tp-tab${r.ich ? " tp-ich" : ""}"><b style="width:2em">${i === 0 && r.punkte > 0 ? "🏆" : i + 1 + "."}</b><span style="flex:1">${esc(r.name)}</span>
      <small class="hinweis">🎯 ${r.genau} · Spieltag ${r.tag}</small><b style="min-width:3.2em;text-align:right">${r.punkte} P.</b></div>`).join("")}</div>`;
}
async function tpTag(tag) { if (!tag) return; TP.tag = tag; TP.reiter = "spiele"; await tpLaden(); }
async function tpMitmachen(an) {
  try { await api("tipp_mitmachen", { an }, { warten: true }); } catch (e) { return meldeFehler(e); }
  melde(an ? "⚽ Schön, dass du mittippst!" : "Du tippst nicht mehr mit – jederzeit wieder möglich."); await tpLaden();
}
async function tpTippen(id) {
  const h = Number($("tpH" + id)?.value), g = Number($("tpG" + id)?.value);
  if (!Number.isInteger(h) || !Number.isInteger(g) || h < 0 || g < 0 || h > 20 || g > 20 || $("tpH" + id)?.value === "" || $("tpG" + id)?.value === "") return melde("Bitte zwei Zahlen eingeben, z. B. 2 und 1.", true);
  try { await api("tipp_abgeben", { spiel_id: id, heim: h, gast: g }, { warten: true }); } catch (e) { return meldeFehler(e); }
  melde(`✔ Getippt: ${h}:${g}`); await tpLaden();
}
