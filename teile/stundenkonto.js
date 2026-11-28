// KICC-F-113 / KC-CLUB-STUNDENKONTO (Wunsch Hansi 24.11.2026: „ein Stundenkonto pro Person. Unter Meins eine Kachel Mein Stundenkonto mit Filter nach Tag,
// Monat, Jahr, Anlass … mit ausdrucken als PDF. ID, Datum, Zeit, = x Stunden, Anlass oder Tätigkeit, km, oben Logo und Kopfbogen und CD, unten Addition
// der Stunden und km. Und evtl. Balken, Säulen, Linien und Kreis-Diagramme.“). Konzept: KICC docs/KONZEPT-CLUB-STUNDENKONTO.md (Phase 1).
// Entscheidungen: vorläufige Zeiten zählen nicht in die Summe (eigene Summe ⏳) · km ab „eingereicht“ (gekennzeichnet) · Soll als gestrichelte Linie ·
// Clubleitung und Planer dürfen andere Konten ansehen und drucken (Server prüft und protokolliert).
// Daten vom Server (Aktion „stundenkonto“), gefiltert wird hier. Diagramme als SVG selbst gezeichnet – kein fremder Dienst, hell und dunkel lesbar;
// jede Zahl steht auch in der Liste. Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const SKS = { zr: "jahr", tag: null, monat: null, jahr: null, anlass: "", art: "", status: "beide", dia: "saeulen", pid: null, d: null };
const SK_ART = { stand: "Dienst am Stand", sonder: "Sondereinsatz", erstattung: "Erstattung" };
const SK_ARTEN = ["stand", "sonder", "erstattung"];
const SK_FARBE_DRUCK = { stand: "#741521", sonder: "#c9a227", erstattung: "#2f6f8f", vorl: "#b9a8a3" }; // CD: Weinrot, Gold + ein Blau für den Unterschied
const SK_MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const skStd = (min) => (Math.round(min / 60 * 100) / 100).toLocaleString("de-DE", { maximumFractionDigits: 2 });
const skKm = (km) => (Math.round(km * 10) / 10).toLocaleString("de-DE", { maximumFractionDigits: 1 });
const skDatum = (iso) => { try { return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return iso; } };
const skTaet = (t) => (t ? (typeof ERS_TAET !== "undefined" && ERS_TAET[t]) || t : "");

// ---------- Laden ----------
async function skStart(pid) {
  SKS.pid = pid && pid !== ICH?.person_id ? pid : null;
  if (!$("skBlatt")) {
    blattAuf("skBlatt", `<h3 style="margin:0">⏱️ <span id="skTitel">Mein Stundenkonto</span></h3><div id="skInhalt"><p class="hinweis">Wird geladen …</p></div>`);
    $("skBlatt").addEventListener("click", (e) => { const z = e.target.closest("[data-z]"); if (z) melde(z.dataset.z); });
  }
  try { SKS.d = await api("stundenkonto", SKS.pid ? { person: SKS.pid } : {}, { warten: true }); }
  catch (e) { if ($("skInhalt")) $("skInhalt").innerHTML = `<div class="karte">⚠️ ${esc(fehlerText(e, "Nicht geladen"))}</div>`; return; }
  const h = heuteIso();
  if (!SKS.jahr) SKS.jahr = h.slice(0, 4);
  if (!SKS.monat) SKS.monat = h.slice(0, 7);
  if (!SKS.tag) SKS.tag = h;
  skZeichnen();
}

// ---------- Filter ----------
function skZeitraum() {
  if (SKS.zr === "tag") return [SKS.tag, SKS.tag];
  if (SKS.zr === "monat") { const [j, m] = SKS.monat.split("-").map(Number), ende = new Date(Date.UTC(j, m, 0)).getUTCDate(); return [`${SKS.monat}-01`, `${SKS.monat}-${String(ende).padStart(2, "0")}`]; }
  if (SKS.zr === "jahr") return [`${SKS.jahr}-01-01`, `${SKS.jahr}-12-31`];
  return ["0000-01-01", "9999-12-31"];
}
function skZeitraumText() {
  if (SKS.zr === "tag") return skDatum(SKS.tag);
  if (SKS.zr === "monat") { const [j, m] = SKS.monat.split("-"); return `${SK_MONATE[Number(m) - 1]} ${j}`; }
  if (SKS.zr === "jahr") return `Jahr ${SKS.jahr}`;
  return "alle Einträge";
}
function skPasst(z, mitStatus = true) {
  const [von, bis] = skZeitraum();
  if (z.datum < von || z.datum > bis) return false;
  if (SKS.anlass) { const [w, t] = [SKS.anlass.slice(0, 2), SKS.anlass.slice(2)]; if (w === "v:" ? z.veranstaltung !== t : z.anlass !== t) return false; }
  if (SKS.art && z.art !== SKS.art) return false;
  if (mitStatus && SKS.status !== "beide" && z.status !== (SKS.status === "bestaetigt" ? "bestaetigt" : "vorlaeufig")) return false;
  return true;
}
function skSummen(zeilen) {
  const s = { min: 0, minVorl: 0, km: 0, kmErst: 0, artMin: { stand: 0, sonder: 0, erstattung: 0 }, anzahl: zeilen.length };
  for (const z of zeilen) {
    if (z.status === "bestaetigt") { s.min += z.min; s.artMin[z.art] = (s.artMin[z.art] || 0) + z.min; } else s.minVorl += z.min; // Entscheidung 1: vorläufig nicht in der Summe
    s.km += z.km || 0; if (z.kmErstattet) s.kmErst += z.km || 0; // Entscheidung 2: km ab „eingereicht“
  }
  return s;
}
function skSoll() { // Entscheidung 3: Soll nur zum Vergleich (Dienste am Stand der Veranstaltung)
  if (SKS.art && SKS.art !== "stand") return [];
  if (SKS.anlass && !(SKS.anlass.startsWith("v:") || SKS.anlass === "a:Dienst am Stand")) return [];
  const [von, bis] = skZeitraum();
  return (SKS.d?.soll || []).filter((x) => x.datum >= von && x.datum <= bis && (!SKS.anlass.startsWith("v:") || x.veranstaltung === SKS.anlass.slice(2)));
}
function skFilterHtml() {
  const d = SKS.d, alle = d.zeilen || [], jahre = [...new Set([heuteIso().slice(0, 4), ...alle.map((z) => z.datum.slice(0, 4))])].sort().reverse();
  const monate = [...new Set([heuteIso().slice(0, 7), ...alle.map((z) => z.datum.slice(0, 7))])].sort().reverse();
  const veranst = [...new Set(alle.map((z) => z.veranstaltung))].sort(), anlaesse = [...new Set(alle.map((z) => z.anlass))].sort();
  const knopf = (feld, w, t) => `<button type="button" class="knopf klein${SKS[feld] === w ? " haupt" : ""}" onclick="skSetze('${feld}','${w}')">${t}</button>`;
  return `${d.darfAndere ? `<label class="feld" style="margin:6px 0 2px">Mitglied<select id="skPerson" onchange="skStart(this.value)">${(d.mitglieder || []).map((m) => `<option value="${esc(m.id)}" ${m.id === d.person.id ? "selected" : ""}>${esc(m.name)}${m.id === ICH?.person_id ? " (ich)" : ""}</option>`).join("")}</select></label>` : ""}
    <div class="np-filter" role="group" aria-label="Zeitraum">${knopf("zr", "tag", "Tag")}${knopf("zr", "monat", "Monat")}${knopf("zr", "jahr", "Jahr")}${knopf("zr", "alles", "Alles")}</div>
    ${SKS.zr === "tag" ? `<label class="feld" style="margin:2px 0">Tag<input type="date" id="skTag" value="${esc(SKS.tag)}" onchange="skSetze('tag',this.value)"></label>` : ""}
    ${SKS.zr === "monat" ? `<label class="feld" style="margin:2px 0">Monat<select onchange="skSetze('monat',this.value)">${monate.map((m) => `<option value="${m}" ${m === SKS.monat ? "selected" : ""}>${SK_MONATE[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}</option>`).join("")}</select></label>` : ""}
    ${SKS.zr === "jahr" ? `<label class="feld" style="margin:2px 0">Jahr<select onchange="skSetze('jahr',this.value)">${jahre.map((j) => `<option ${j === SKS.jahr ? "selected" : ""}>${j}</option>`).join("")}</select></label>` : ""}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <label class="feld" style="margin:2px 0">Anlass<select onchange="skSetze('anlass',this.value)"><option value="">Alle</option>
        ${veranst.length ? `<optgroup label="Veranstaltung">${veranst.map((v) => `<option value="v:${esc(v)}" ${SKS.anlass === "v:" + v ? "selected" : ""}>${esc(v)}</option>`).join("")}</optgroup>` : ""}
        ${anlaesse.length ? `<optgroup label="Einsatz / Anlass">${anlaesse.map((a) => `<option value="a:${esc(a)}" ${SKS.anlass === "a:" + a ? "selected" : ""}>${esc(a)}</option>`).join("")}</optgroup>` : ""}</select></label>
      <label class="feld" style="margin:2px 0">Art<select onchange="skSetze('art',this.value)"><option value="">Alle</option>${SK_ARTEN.map((a) => `<option value="${a}" ${SKS.art === a ? "selected" : ""}>${SK_ART[a]}</option>`).join("")}</select></label></div>
    <div class="np-filter" role="group" aria-label="Stand">${knopf("status", "beide", "Alle")}${knopf("status", "bestaetigt", "✅ bestätigt")}${knopf("status", "vorlaeufig", "⏳ vorläufig")}</div>`;
}
function skSetze(feld, wert) { SKS[feld] = wert; skZeichnen(); }

// ---------- Diagramme (SVG) ----------
const skFarbe = (art, druck) => (druck ? SK_FARBE_DRUCK[art] : `var(--sk-${art === "vorl" ? "vorl" : art})`);
function skSaeulen(zeilen, druck) {
  const nachTag = SKS.zr === "monat" || SKS.zr === "tag", schluessel = (z) => (nachTag ? z.datum : z.datum.slice(0, 7));
  const gruppen = new Map();
  for (const z of zeilen) { const k = schluessel(z), g = gruppen.get(k) || { stand: 0, sonder: 0, erstattung: 0, vorl: 0 }; if (z.status === "bestaetigt") g[z.art] += z.min; else g.vorl += z.min; gruppen.set(k, g); }
  const keys = [...gruppen.keys()].sort(); if (!keys.length) return "";
  const max = Math.max(...keys.map((k) => Object.values(gruppen.get(k)).reduce((a, b) => a + b, 0)), 60), W = 320, H = 170, unten = 22, bw = Math.min(28, (W - 30) / keys.length - 4);
  let x = 30, out = "";
  for (const k of keys) {
    let y = H - unten; const g = gruppen.get(k);
    for (const a of [...SK_ARTEN, "vorl"]) {
      if (!g[a]) continue; const h = g[a] / max * (H - unten - 10); y -= h;
      out += `<rect x="${x}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${skFarbe(a, druck)}" ${a === "vorl" ? 'fill-opacity=".45"' : ""} data-z="${esc(`${nachTag ? skDatum(k) : SK_MONATE[Number(k.slice(5)) - 1] + " " + k.slice(0, 4)}: ${skStd(g[a])} Std. ${a === "vorl" ? "vorläufig" : SK_ART[a]}`)}"><title>${skStd(g[a])} Std.</title></rect>`;
    }
    out += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" font-size="9" text-anchor="middle" fill="currentColor">${nachTag ? k.slice(8, 10) : SK_MONATE[Number(k.slice(5)) - 1].slice(0, 3)}</text>`;
    x += (W - 30) / keys.length;
  }
  return skAchse(out, max, H, unten, W);
}
function skAchse(innen, max, H, unten, W) {
  const stufe = max / 60 > 40 ? 20 : max / 60 > 16 ? 8 : max / 60 > 6 ? 2 : 1;
  let achse = ""; for (let v = 0; v * 60 <= max; v += stufe) { const y = H - unten - v * 60 / max * (H - unten - 10); achse += `<line x1="28" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-opacity=".15"/><text x="24" y="${(y + 3).toFixed(1)}" font-size="9" text-anchor="end" fill="currentColor">${v}</text>`; }
  return `<svg viewBox="0 0 ${W} ${H}" class="sk-dia" role="img" aria-label="Diagramm Stunden">${achse}${innen}</svg>`;
}
function skBalken(zeilen, druck) {
  const m = new Map(); for (const z of zeilen) if (z.status === "bestaetigt" && z.min) m.set(z.anlass, (m.get(z.anlass) || 0) + z.min);
  const liste = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8); if (!liste.length) return "";
  const max = liste[0][1], W = 320, zh = 22;
  return `<svg viewBox="0 0 ${W} ${liste.length * zh + 4}" class="sk-dia" role="img" aria-label="Stunden je Anlass">${liste.map(([a, min], i) => {
    const w = min / max * 150, y = i * zh + 2;
    return `<text x="0" y="${y + 14}" font-size="10" fill="currentColor">${esc(a.length > 24 ? a.slice(0, 23) + "…" : a)}</text><rect x="130" y="${y + 3}" width="${w.toFixed(1)}" height="15" rx="3" fill="${skFarbe("stand", druck)}" data-z="${esc(`${a}: ${skStd(min)} Std.`)}"><title>${skStd(min)} Std.</title></rect><text x="${(134 + w).toFixed(1)}" y="${y + 14}" font-size="10" fill="currentColor">${skStd(min)}</text>`;
  }).join("")}</svg>`;
}
function skLinie(zeilen, druck) {
  const best = zeilen.filter((z) => z.status === "bestaetigt" && z.min).sort((a, b) => a.datum.localeCompare(b.datum)), soll = skSoll();
  const tage = [...new Set([...best.map((z) => z.datum), ...soll.map((x) => x.datum)])].sort(); if (tage.length < 2) return "";
  let a = 0, s = 0; const ist = [], so = [];
  for (const t of tage) { a += best.filter((z) => z.datum === t).reduce((n, z) => n + z.min, 0); s += soll.filter((x) => x.datum === t).reduce((n, x) => n + x.min, 0); ist.push(a); so.push(s); }
  const max = Math.max(a, s, 60), W = 320, H = 170, unten = 22, px = (i) => 30 + i / (tage.length - 1) * (W - 36), py = (v) => H - unten - v / max * (H - unten - 10);
  const pfad = (werte) => werte.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const innen = `<path d="${pfad(ist)}" fill="none" stroke="${skFarbe("stand", druck)}" stroke-width="2.5"/>${s ? `<path d="${pfad(so)}" fill="none" stroke="${skFarbe("vorl", druck)}" stroke-width="2" stroke-dasharray="5 4"/>` : ""}
    <circle cx="${px(tage.length - 1).toFixed(1)}" cy="${py(a).toFixed(1)}" r="4" fill="${skFarbe("stand", druck)}" data-z="${esc(`Bis ${skDatum(tage[tage.length - 1])}: ${skStd(a)} Std. bestätigt${s ? ` · Soll ${skStd(s)} Std.` : ""}`)}"/>
    <text x="30" y="${H - 8}" font-size="9" fill="currentColor">${esc(skDatum(tage[0]))}</text><text x="${W - 4}" y="${H - 8}" font-size="9" text-anchor="end" fill="currentColor">${esc(skDatum(tage[tage.length - 1]))}</text>`;
  return skAchse(innen, max, H, unten, W);
}
function skKreis(s, druck) {
  const teile = SK_ARTEN.map((a) => [a, s.artMin[a] || 0]).filter(([, v]) => v); if (s.minVorl) teile.push(["vorl", s.minVorl]);
  const summe = teile.reduce((n, [, v]) => n + v, 0); if (!summe || teile.length > 5) return "";
  let w = -Math.PI / 2, out = "";
  const r = 60, ri = 34, cx = 80, cy = 75, pt = (rad, w) => `${(cx + rad * Math.cos(w)).toFixed(2)},${(cy + rad * Math.sin(w)).toFixed(2)}`;
  for (const [a, v] of teile) {
    const dw = v / summe * Math.PI * 2 - (teile.length > 1 ? 0.0001 : 0.001), gross = dw > Math.PI ? 1 : 0, w2 = w + dw;
    out += `<path d="M${pt(r, w)} A${r},${r} 0 ${gross} 1 ${pt(r, w2)} L${pt(ri, w2)} A${ri},${ri} 0 ${gross} 0 ${pt(ri, w)} Z" fill="${skFarbe(a, druck)}" ${a === "vorl" ? 'fill-opacity=".45"' : ""} data-z="${esc(`${a === "vorl" ? "⏳ vorläufig" : SK_ART[a]}: ${skStd(v)} Std. (${Math.round(v / summe * 100)} %)`)}"><title>${Math.round(v / summe * 100)} %</title></path>`;
    w = w2;
  }
  return `<svg viewBox="0 0 320 150" class="sk-dia" role="img" aria-label="Anteile">${out}<text x="${cx}" y="${cy + 4}" font-size="12" font-weight="700" text-anchor="middle" fill="currentColor">${skStd(summe)} Std.</text>
    ${teile.map(([a, v], i) => `<rect x="170" y="${30 + i * 22}" width="12" height="12" rx="2" fill="${skFarbe(a, druck)}" ${a === "vorl" ? 'fill-opacity=".45"' : ""}/><text x="188" y="${40 + i * 22}" font-size="10" fill="currentColor">${a === "vorl" ? "⏳ vorläufig" : SK_ART[a]} · ${Math.round(v / summe * 100)} %</text>`).join("")}</svg>`;
}
function skDiagramm(art, zeilen, s, druck) {
  const svg = art === "balken" ? skBalken(zeilen, druck) : art === "linie" ? skLinie(zeilen, druck) : art === "kreis" ? skKreis(s, druck) : skSaeulen(zeilen, druck);
  return svg || `<p class="hinweis" style="margin:6px 0">Für dieses Diagramm gibt es im gewählten Zeitraum zu wenig Einträge.</p>`;
}
// Legende mit festen Abständen im Element selbst – das Druckblatt übernimmt nur die #druck-Regeln
const skPunkt = (farbe, op = 1) => `<i style="display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px;background:${farbe};opacity:${op}"></i>`;
const skLegende = (druck) => `<div class="sk-legende" style="display:flex;flex-wrap:wrap;gap:4px 12px;font-size:${druck ? "8pt" : ".8rem"}">${SK_ARTEN.map((a) => `<span>${skPunkt(skFarbe(a, druck))}${SK_ART[a]}</span>`).join("")}<span>${skPunkt(skFarbe("vorl", druck), 0.45)}⏳ vorläufig</span></div>`;
const skAnlassText = (z) => { const t = skTaet(z.taetigkeit) || z.ort || ""; return t && t.toLowerCase() !== String(z.anlass).toLowerCase() ? `${z.anlass} · ${t}` : z.anlass; };

// KICC-F-113 Phase 2: „Stand DP2“ = letzte Veröffentlichung des Kontoauszugs aus DP2; älter als 7 Tage → orange (AGENTS 11: veraltet sichtbar)
function skStandText(d) {
  if (!d.standDp2) return `${d.stand ? `Stand der Daten: ${esc(wann(d.stand))} · ` : ""}Dienste am Stand sind ⏳ vorläufig, bis der Planer sie in DP2 prüft.`;
  const alt = Date.now() - Date.parse(d.standDp2) > 7 * 86400000;
  return `<span${alt ? ' style="color:var(--textOrange)"' : ""}>📅 Stand DP2: ${esc(wann(d.standDp2))}${alt ? " – vielleicht nicht mehr aktuell" : ""}</span> · Tage, die DP2 noch nicht hat, stehen als ⏳ vorläufig da.`;
}

// ---------- Ansicht ----------
function skZeichnen() {
  const d = SKS.d; if (!d || !$("skInhalt")) return;
  $("skTitel").textContent = d.person.id === ICH?.person_id ? "Mein Stundenkonto" : `Stundenkonto ${d.person.name}`;
  const zeilen = (d.zeilen || []).filter((z) => skPasst(z)), s = skSummen(zeilen), soll = skSoll().reduce((n, x) => n + x.min, 0);
  const dia = [["saeulen", "📊 Säulen"], ["balken", "📶 Balken"], ["linie", "📈 Linie"], ["kreis", "🍩 Kreis"]];
  $("skInhalt").innerHTML = `${skFilterHtml()}
    <p class="hinweis" style="margin:4px 0">${esc(skZeitraumText())} · ${skStandText(d)}</p>
    ${hmKarteHtml(d)}
    <div class="sk-summen">
      <div class="karte" data-z="Bestätigte Stunden – nur diese zählen"><b>${skStd(s.min)}</b><small>Std. bestätigt</small></div>
      <div class="karte" data-z="Vorläufig: noch nicht vom Planer geprüft – zählt nicht in die Summe"><b>${skStd(s.minVorl)}</b><small>⏳ vorläufig</small></div>
      <div class="karte" data-z="${esc(`km eingereicht, davon ${skKm(s.kmErst)} km schon erstattet`)}"><b>${skKm(s.km)}</b><small>km${s.km > s.kmErst ? ` · ${skKm(s.km - s.kmErst)} offen` : ""}</small></div>
      ${soll ? `<div class="karte" data-z="Geplante Dienste (Soll) – nur zum Vergleich"><b>${skStd(soll)}</b><small>Std. Soll</small></div>` : ""}</div>
    <div class="karte" style="padding:8px 10px">
      <div class="np-filter" role="group" aria-label="Diagramm">${dia.map(([w, t]) => `<button type="button" class="knopf klein${SKS.dia === w ? " haupt" : ""}" onclick="skSetze('dia','${w}')">${t}</button>`).join("")}</div>
      ${skDiagramm(SKS.dia, zeilen, s, false)}${SKS.dia !== "balken" ? skLegende(false) : ""}${SKS.dia === "linie" && soll ? '<p class="hinweis" style="margin:2px 0">Gestrichelt: Soll (geplante Dienste), aufsummiert.</p>' : ""}</div>
    <div class="knopfreihe" style="margin:8px 0"><button type="button" class="knopf haupt" onclick="skDrucken()">📄 Als PDF / Drucken</button></div>
    <div class="karte" style="padding:4px 10px">${zeilen.length ? zeilen.map(skZeileHtml).join("") : '<p class="hinweis">Keine Einträge für diese Auswahl.</p>'}
      ${zeilen.length ? `<div class="sk-zeile sk-summe"><span><b>Summe</b> (${zeilen.length} Einträge)</span><span><b>${skStd(s.min)} Std.</b>${s.minVorl ? ` <small>+ ${skStd(s.minVorl)} ⏳</small>` : ""} · <b>${skKm(s.km)} km</b></span></div>` : ""}</div>`;
}
function skZeileHtml(z) {
  const zeit = z.von ? `${z.von}–${z.bis}` : "–";
  return `<div class="sk-zeile${z.status === "bestaetigt" ? "" : " sk-vorl"}"><span><b>${esc(skDatum(z.datum))}</b> · ${esc(zeit)}<br><small>${esc(skAnlassText(z))}${z.km ? ` · 🚗 ${skKm(z.km)} km${z.kmErstattet === false ? " (noch nicht erstattet)" : ""}` : ""}${z.hinweis ? ` · ⏳ ${esc(z.hinweis)}` : ""} · <span class="sk-id">${esc(z.id)}</span></small></span>
    <span class="sk-std">${z.min ? skStd(z.min) + " Std." : "–"}${z.status === "bestaetigt" ? "" : " ⏳"}${z.rid ? `<br><button type="button" class="knopf klein" onclick="hmOeffnen(${jsArg(z.einsatz)}, ${jsArg(z.rid)})">✏️ ändern</button>` : ""}</span></div>`;
}

// ---------- Drucken (Club-Kopfbogen über das Druck-System, KC-CLUB-CD) ----------
function skDrucken() {
  if (!SKS.d) return;
  DRUCKARTEN.stundenkonto = { titel: "🖨️ Stundenkonto drucken", optionen: () => `<label class="schalter"><span>Diagramm mit drucken</span><input type="checkbox" id="skDrDia" checked></label>
    <label class="schalter"><span>Nur bestätigte Einträge</span><input type="checkbox" id="skDrBest"></label>`, bauen: () => skDruckSeite() };
  druckStarten("stundenkonto");
}
function skDruckSeite() {
  const d = SKS.d, nurBest = !!$("skDrBest")?.checked, mitDia = $("skDrDia") ? $("skDrDia").checked : true;
  const zeilen = (d.zeilen || []).filter((z) => skPasst(z) && (!nurBest || z.status === "bestaetigt")).sort((a, b) => a.datum.localeCompare(b.datum) || String(a.von || "").localeCompare(String(b.von || "")));
  const s = skSummen(zeilen), soll = skSoll().reduce((n, x) => n + x.min, 0);
  const filter = [SKS.anlass ? `Anlass: ${SKS.anlass.slice(2)}` : "alle Anlässe", SKS.art ? `Art: ${SK_ART[SKS.art]}` : "", nurBest ? "nur bestätigte" : SKS.status === "beide" ? "" : SKS.status === "bestaetigt" ? "nur bestätigte" : "nur vorläufige"].filter(Boolean).join(" · ");
  const html = `<table class="dinfo"><tbody><tr><th style="width:38mm">Mitglied</th><td>${esc(d.person.name)} <small>(${esc(d.person.id)})</small></td></tr>
      <tr><th>Zeitraum</th><td>${esc(skZeitraumText())}</td></tr><tr><th>Auswahl</th><td>${esc(filter)}</td></tr>
      <tr><th>Stand der Daten</th><td>${d.standDp2 ? `DP2-Kontoauszug vom ${esc(wann(d.standDp2))}` : d.stand ? esc(wann(d.stand)) : "–"}</td></tr></tbody></table>
    ${mitDia && zeilen.length ? `<div style="display:flex;gap:6mm;align-items:flex-start;margin:3mm 0 1mm;color:#1d1a17;max-height:55mm"><div style="flex:3">${skSaeulen(zeilen, true)}</div><div style="flex:2">${skKreis(s, true)}</div></div>${skLegende(true)}` : ""}
    <table style="margin-top:3mm"><thead><tr><th style="width:21mm">ID</th><th style="width:25mm">Datum</th><th style="width:21mm">Zeit</th><th style="width:11mm;text-align:right">Std.</th><th>Anlass / Tätigkeit</th><th style="width:10mm;text-align:right">km</th><th style="width:10mm;text-align:center">Stand</th></tr></thead><tbody>
      ${zeilen.map((z) => `<tr${z.status === "bestaetigt" ? "" : ' style="color:#7a6f69;font-style:italic"'}><td style="white-space:nowrap;font-size:8pt">${esc(z.id)}</td><td style="white-space:nowrap">${esc(z.datum.split("-").reverse().join("."))}</td><td>${z.von ? esc(`${z.von}–${z.bis}`) : "–"}</td><td style="text-align:right">${z.min ? skStd(z.min) : "–"}</td>
        <td>${esc(skAnlassText(z))}</td><td style="text-align:right">${z.km ? skKm(z.km) + (z.kmErstattet === false ? "*" : "") : ""}</td><td style="text-align:center">${z.status === "bestaetigt" ? "✓" : "⏳"}</td></tr>`).join("") || '<tr><td colspan="7">Keine Einträge.</td></tr>'}
      <tr><td colspan="3" style="text-align:right"><b>Summe bestätigt</b></td><td style="text-align:right"><b>${skStd(s.min)}</b></td><td></td><td style="text-align:right"><b>${skKm(s.km)}</b></td><td></td></tr>
      ${s.minVorl ? `<tr><td colspan="3" style="text-align:right">⏳ vorläufig (nicht in der Summe)</td><td style="text-align:right">${skStd(s.minVorl)}</td><td colspan="3"></td></tr>` : ""}
      ${soll ? `<tr><td colspan="3" style="text-align:right">Soll zum Vergleich</td><td style="text-align:right">${skStd(soll)}</td><td colspan="3"></td></tr>` : ""}</tbody></table>
    <p class="dklein">✓ bestätigt (wie im DP2-Kontoauszug) · ⏳ vorläufig = vom Planer in DP2 noch nicht geprüft, zählt nicht in die Summe.${s.km > s.kmErst ? " * km eingereicht, noch nicht erstattet." : ""} Stunden in Dezimal (1,5 = 1 Std. 30 Min.).</p>`;
  return { titel: "Stundenkonto", unter: d.person.name, rechts: esc(skZeitraumText()), html, fuss: `${skStd(s.min)} Std. · ${skKm(s.km)} km` };
}

// ---------- 3.54.0 KC-CLUB-HEIMARBEIT (Wunsch Hansi 28.11.2026: „Andrea arbeitet zu Hause … Stunden täglich über die App, angebunden an Mein Stundenkonto“) ----------
// Nur wer in einem laufenden Heimarbeit-Einsatz vorgesehen ist, sieht den Knopf (Server liefert d.heimarbeit). Gespeichert als Sonderstunden („gemeldet“),
// der Planer bestätigt in DP2 – bis dahin ⏳ vorläufig, selbst änderbar oder zurückziehbar.
const HM_WAS = ["Mischung gemacht"]; // 3.55.0 (Hansi 28.11.: „beim Was gemacht muss Mischung gemacht hin“) – antippen füllt das Feld
const HMS = { e: null, rid: null, datum: null, von: 9, bis: 12, pause: 0, text: "" };
const hmUhr = (h) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
const hmStdText = () => (Math.max(0, HMS.bis - HMS.von - HMS.pause / 60)).toLocaleString("de-DE", { maximumFractionDigits: 2 });
function hmKarteHtml(d) {
  if (!d?.heimarbeit?.length || d.person?.id !== ICH?.person_id) return "";
  const heute = heuteIso();
  return d.heimarbeit.map((e) => {
    const eigene = (d.zeilen || []).filter((z) => z.einsatz === e.id || (z.anlass === e.titel && z.art === "sonder")), heuteZ = eigene.filter((z) => z.datum === heute);
    const imZeitraum = heute >= e.von && heute <= e.bis;
    return `<div class="karte" style="margin:8px 0;border:2px solid var(--gruen,#2e7d4f)"><b>🏠 ${esc(e.titel)}</b>
      <div class="hinweis" style="margin:2px 0 6px">${esc(skDatum(e.von))} – ${esc(skDatum(e.bis))}${heuteZ.length ? ` · heute eingetragen: ${heuteZ.map((z) => `${esc(z.von)}–${esc(z.bis)}`).join(", ")}` : imZeitraum ? " · heute noch nichts eingetragen" : ""}</div>
      <button type="button" class="knopf haupt" onclick="hmOeffnen(${jsArg(e.id)})">➕ Stunden eintragen</button></div>`;
  }).join("");
}
function hmOeffnen(einsatz, rid) {
  const e = (SKS.d?.heimarbeit || []).find((x) => x.id === einsatz); if (!e) return melde("Diese Heimarbeit ist gerade nicht eingerichtet.", true);
  const z = rid ? (SKS.d.zeilen || []).find((x) => x.rid === rid) : null, zahl = (t) => { const [h, m] = String(t || "0:0").split(":").map(Number); return h + (m || 0) / 60; };
  const heute = heuteIso();
  Object.assign(HMS, { e, rid: rid || null, datum: z ? z.datum : heute > e.bis ? e.bis : heute, von: z ? zahl(z.von) : 9, bis: z ? zahl(z.bis) : 12, pause: z ? z.pause || 0 : 0, text: z ? z.text || "" : "" });
  blattAuf("hmBlatt", '<div id="hmInhalt"></div>'); hmZeichnen();
}
function hmTage() { // heute, gestern, vorgestern … – nur im Zeitraum, nicht in der Zukunft, höchstens 3 Tage zurück
  const out = [], h = heuteIso();
  for (let i = 0; i <= 3; i++) { const d = new Date(h + "T12:00:00"); d.setDate(d.getDate() - i); const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (iso >= HMS.e.von && iso <= HMS.e.bis) out.push([iso, i === 0 ? "heute" : i === 1 ? "gestern" : i === 2 ? "vorgestern" : skDatum(iso)]); }
  return out;
}
function hmZeichnen() {
  const el = $("hmInhalt"); if (!el || !HMS.e) return;
  // 3.55.0 (Hansi 28.11.: „Die Uhrzeit muss sich verstellen lassen … mach unten die plus eine Stunde etc. weg“): Von/Bis direkt antippen – Uhrzeit-Auswahl des Handys, Viertelstunden
  const uhr = (feld, titel) => `<label class="ds-uhr-feld" style="display:block;text-align:center"><div class="ds-uhr-titel">${titel}</div>
    <input type="time" step="900" class="hm-zeit" value="${hmUhr(HMS[feld] >= 24 ? 0 : HMS[feld])}" onchange="hmZeitSetzen('${feld}', this.value)" aria-label="${titel}"
      style="font-size:2rem;font-weight:800;text-align:center;width:100%;max-width:300px;padding:6px 8px;border-radius:14px;border:2px solid var(--linie);background:var(--karte);color:var(--text)"></label>`;
  const tage = hmTage();
  el.innerHTML = `<h3 style="margin-top:0">🏠 ${HMS.rid ? "Eintrag ändern" : "Stunden eintragen"}</h3><p class="hinweis" style="margin:0 0 8px">${esc(HMS.e.titel)}</p>
    <div class="ds-gruende" style="margin-bottom:8px">${tage.map(([iso, t]) => `<button type="button" class="chip${HMS.datum === iso ? " an" : ""}" onclick="HMS.datum='${iso}';hmZeichnen()">${esc(t)}</button>`).join("") || '<span class="hinweis">Kein Tag im Zeitraum.</span>'}</div>
    ${uhr("von", "Von")}${uhr("bis", "Bis")}
    <label class="feld">☕ Pause<select onchange="HMS.pause=Number(this.value);hmZeichnen()">${[0, 15, 30, 45, 60].map((m) => `<option value="${m}"${m === HMS.pause ? " selected" : ""}>${m ? m + " Min." : "keine"}</option>`).join("")}</select></label>
    <p style="text-align:center;font-size:1.15rem;margin:6px 0"><b>= ${hmStdText()} Std.</b></p>
    <label class="feld">Was gemacht? <small class="hinweis">(freiwillig)</small><input id="hmText" maxlength="300" value="${esc(HMS.text)}" placeholder="z. B. Mischung gemacht" oninput="HMS.text=this.value"></label>
    <div class="ds-gruende" style="margin:-4px 0 8px">${HM_WAS.map((w) => `<button type="button" class="chip${HMS.text === w ? " an" : ""}" onclick="HMS.text=${jsArg(w)};hmZeichnen()">${esc(w)}</button>`).join("")}</div>
    <div class="knoepfe" style="flex-direction:column;align-items:stretch;margin-top:8px"><button class="knopf haupt" onclick="hmSpeichern(this)">✅ ${HMS.rid ? "Änderung speichern" : "Eintragen"}</button>
      ${HMS.rid ? '<button class="knopf" onclick="hmZurueck(this)">🗑️ Eintrag zurückziehen</button>' : ""}<button class="knopf" onclick="fensterZu($('hmBlatt'))">Abbrechen</button></div>
    <p class="hinweis" style="margin:8px 0 0">Deine Stunden werden noch bestätigt – bis dahin stehen sie mit ⏳ in deinem Stundenkonto und du kannst sie noch ändern.</p>`;
}
function hmZeitSetzen(feld, wert) { // „HH:MM“ → Stunden (auf Viertelstunden gerundet); Bis 00:00 = Mitternacht (24 Uhr)
  const [h, m] = String(wert || "").split(":").map(Number); if (!Number.isFinite(h)) return;
  let x = Math.round((h + (m || 0) / 60) * 4) / 4; if (feld === "bis" && x === 0) x = 24;
  HMS[feld] = Math.min(24, Math.max(0, x)); hmZeichnen();
}
async function hmSpeichern(knopf) {
  if (!(HMS.bis > HMS.von)) return melde("Bis muss nach Von liegen – bitte die Uhrzeiten prüfen.", true);
  await einmal(knopf, async () => {
    const daten = { datum: HMS.datum, von: HMS.von, bis: HMS.bis, pause: HMS.pause, text: HMS.text.trim() };
    try { await api(HMS.rid ? "heimarbeit_aendern" : "heimarbeit_melden", HMS.rid ? { id: HMS.rid, ...daten } : { einsatz: HMS.e.id, ...daten }, { warten: true });
      fensterZu($("hmBlatt")); melde(`✅ ${HMS.rid ? "Geändert" : "Eingetragen"}: ${hmUhr(HMS.von)}–${hmUhr(HMS.bis)} Uhr (${hmStdText()} Std.) – danke!`); skStart(); }
    catch (e) { meldeFehler(e); }
  });
}
async function hmZurueck(knopf) {
  if (!(await frage("Diesen Eintrag zurückziehen?", { ja: "🗑️ Zurückziehen", nein: "Abbrechen" }))) return;
  await einmal(knopf, async () => {
    try { await api("heimarbeit_aendern", { id: HMS.rid, zurueck: true }, { warten: true }); fensterZu($("hmBlatt")); melde("🗑️ Zurückgezogen"); skStart(); }
    catch (e) { meldeFehler(e); }
  });
}
