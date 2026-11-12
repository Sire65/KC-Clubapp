// ---------- KC-CLUB-PREISETIKETTEN (12.11.2026, Wunsch Hansi „Preisetiketten in die Club-App – Formate 8x8, 7x7, 6x6, 5x5; mit oder ohne Foto,
// Allergene, Preis usw., völlig flexibel, auch nach Warengruppen wie Getränke, Speisen; Anzahl und Vorschau“, „die Club-App muss auch die aktuellen
// Preise übernehmen“; Wahl: PC-Manager veröffentlicht + im Dialog änderbar; nur Clubleitung) ----------
// Büro → 🖨️ Drucker → 🏷️ Preisetiketten. Aufbau wie die erprobten Kesselschild-Etiketten der Kasse (werkzeuge/etiketten, 6x6 vom 12.11.):
// oben der Name, links Foto und darunter Allergene/Zusatzstoffe, rechts der Preis inkl. Pfand OHNE €-Zeichen und darunter der QR-Code
// (enthält genau die Artikelnummer – der Kassen-Scanner tippt sie). Jeder Baustein ist abwählbar; die anderen nutzen dann den Platz.
// Artikel: zuerst der vom PC-Manager veröffentlichte Stand (aktuelle Preise, Aktion etiketten_artikel), sonst der Grundstand der Kasse
// (/Kasse/etiketten/artikel.json). Preise lassen sich für diesen Druck von Hand ändern. Gezeichnet wird als Bild in 300 dpi
// (wie der Händler-Ausweis) – so kann kein PDF-Betrachter Fotos weglassen. Fehlende Angaben: rot „⚠ nicht erfasst“ (UNKNOWN nie als OK).
const PE = { artikel: null, quelle: null, stand: null, format: 6, anzahl: {}, preis: {}, gruppe: "alle", vorschauId: null, bilder: new Map(),
  aus: { name: true, foto: true, preis: true, pfand: true, qr: true, nummer: true, allergene: true, zusatz: true, alkohol: true, rahmen: true } };
const PE_MM = 300 / 25.4, PE_SCHRIFT = '"Carlito","Lato","Helvetica Neue",Arial,sans-serif';
const PE_FORMATE = [8, 7, 6, 5];
const PE_BAUSTEINE = [["name", "Name"], ["foto", "Foto"], ["preis", "Preis"], ["pfand", "„inkl. Pfand“"], ["qr", "QR-Code"], ["nummer", "Art.-Nr. unter QR"],
  ["allergene", "Allergene"], ["zusatz", "Zusatzstoffe"], ["alkohol", "„Enthält Alkohol“"], ["rahmen", "Farbiger Rahmen"]];
const peKasse = () => new URL("../Kasse/", location.href).href; // Kasse liegt auf derselben Adresse (sire65.github.io/Kasse/)
const peZahl = (b) => (b < 0 ? "−" : "") + (Math.round(Math.abs(b) * 100) / 100).toFixed(2).replace(".", ","); // Rückgabe: „−2,00“
// 12.11.2026 (Wunsch Hansi „auch der BAR-Barcode, der den Kassiervorgang abschließt“): Kassen-Steuercodes als eigene Etiketten. CMD-CHECKOUT = genau
// das, was die Kasse beim Scannen als „bar kassieren / Verkauf abschließen“ versteht (Kasse pos/app.js, SCANNER_WEGE_LIESMICH.md).
const PE_CODES = [{ id: "cmd-bar", name: "BAR – bezahlen", nummer: "CMD-CHECKOUT", kategorie: "Kassen-Codes", spezial: "bar", farbe: "#1b5e20", preis: 0, pfand: [], sortierung: 0 }];
const pePfand = (a) => (a.pfand || []).reduce((s, k) => s + (Number(k.betrag) || 0), 0);
const pePreis = (a) => (Number.isFinite(PE.preis[a.id]) ? PE.preis[a.id] : Number(a.preis) || 0);
// Bogen A4: Etiketten stoßen aneinander (nur ein Schnitt dazwischen), rundum mindestens 6 mm Rand für die Schnittmarken
const peRaster = (k) => { const K = k * 10; return { K, sp: Math.floor(198 / K), ze: Math.floor(285 / K) }; };

async function peStart() {
  try { await peLaden(); } catch (e) { return meldeFehler(e); }
  peZeigen();
}
async function peLaden() {
  if (PE.artikel) return;
  let r = null; try { r = await api("etiketten_artikel", {}, { warten: true }); } catch (e) { if (e?.status === 403) throw e; }
  if (Array.isArray(r?.artikel) && r.artikel.length) { PE.artikel = r.artikel; PE.quelle = "manager"; PE.stand = r.stand; }
  else {
    const d = await (await fetch(peKasse() + "etiketten/artikel.json?x=" + Date.now(), { cache: "no-store", signal: zeitSignal(15000) })).json();
    PE.artikel = d.artikel || []; PE.quelle = "kasse"; PE.stand = d.stand || null;
  }
  PE.artikel = [...PE.artikel.filter((a) => a && a.nummer && a.name), ...PE_CODES].sort((x, y) => String(x.kategorie).localeCompare(String(y.kategorie), "de") || (x.sortierung ?? 999) - (y.sortierung ?? 999) || String(x.name).localeCompare(String(y.name), "de"));
}
function peGruppen() { return [...new Set(PE.artikel.map((a) => a.kategorie || "Sonstiges"))]; }
function peSichtbar() { return PE.artikel.filter((a) => PE.gruppe === "alle" || (a.kategorie || "Sonstiges") === PE.gruppe); }
function peSumme() { return PE.artikel.reduce((s, a) => s + (PE.anzahl[a.id] || 0), 0); }

function peZeigen() {
  const r = peRaster(PE.format), n = peSumme(), je = r.sp * r.ze, blaetter = Math.ceil(n / je);
  const stand = PE.stand ? new Date(PE.stand).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
  const quelle = PE.quelle === "manager" ? `✅ Aktuelle Preise aus dem PC-Manager${stand ? ` (veröffentlicht ${stand})` : ""}`
    : "⚠️ Grundstand aus der Kasse – noch nicht vom PC-Manager veröffentlicht. Im PC-Manager „🏷️ Für Preisetiketten in der Club-App veröffentlichen“ antippen, dann stehen hier die aktuellen Preise. Preise bitte prüfen.";
  const liste = peSichtbar().map((a) => `<div class="pe-zeile${PE.anzahl[a.id] ? " pe-an" : ""}" data-id="${esc(a.id)}">
      <button type="button" class="pe-name" data-vorschau="${esc(a.id)}" title="In der Vorschau zeigen"><b>${esc(a.name)}</b><small>${esc(a.kategorie || "")} · ${esc(a.nummer)}${pePfand(a) ? ` · inkl. ${peZahl(pePfand(a))} Pfand` : ""}</small></button>
      ${a.spezial ? '<span class="pe-preis hinweis">Kassen-Code</span>' : `<label class="pe-preis" title="Artikelpreis ohne Pfand – nur für diesen Druck">€ <input type="text" inputmode="decimal" data-preis="${esc(a.id)}" value="${peZahl(pePreis(a))}"></label>`}
      <span class="pe-anz"><button type="button" class="knopf klein" data-minus="${esc(a.id)}" aria-label="weniger">−</button><b>${PE.anzahl[a.id] || 0}</b><button type="button" class="knopf klein" data-plus="${esc(a.id)}" aria-label="mehr">＋</button></span></div>`).join("");
  const f = blattAuf("peBlatt", `<h3 style="margin-top:0">🏷️ Preisetiketten</h3>
    <p class="hinweis" style="margin:0 0 8px">${esc(quelle)}</p>
    <div class="pe-reihe"><b>Größe</b>${PE_FORMATE.map((k) => `<button type="button" class="chip${PE.format === k ? " an" : ""}" data-format="${k}">${k} × ${k} cm</button>`).join("")}</div>
    <div class="pe-reihe"><b>Auf dem Etikett</b>${PE_BAUSTEINE.map(([k, t]) => `<label class="pe-haken"><input type="checkbox" data-aus="${k}" ${PE.aus[k] ? "checked" : ""}> ${esc(t)}</label>`).join("")}</div>
    <div class="pe-oben"><div class="pe-vorschau"><canvas id="peVorschau" aria-label="Vorschau"></canvas><small class="hinweis" id="peVorschauText"></small></div>
      <div class="pe-info"><b>${n} Etikett${n === 1 ? "" : "en"}</b><br><span class="hinweis">${r.sp} × ${r.ze} = ${je} je A4-Blatt${n ? ` · ${blaetter} Blatt` : ""}</span>
        <div class="knoepfe" style="margin-top:8px"><button class="knopf haupt" data-a="druck" ${n ? "" : "disabled"}>🖨️ Drucken</button><button class="knopf" data-a="probe">🎯 Probe ${PE.format} × ${PE.format} cm (1 Etikett + 5-cm-Maß)</button></div>
        <p class="hinweis" style="margin:6px 0 0;font-size:.85rem">Probe: das Etikett aus der Vorschau in der gewählten Größe – Größe oben umstellen, dann erneut. Drucken mit <b>100 %</b> (nicht „an Seite anpassen“). Der QR-Code enthält die Artikelnummer – bitte einmal an der Kasse scannen.</p></div></div>
    <div class="pe-reihe"><b>Warengruppe</b>${["alle", ...peGruppen()].map((g) => `<button type="button" class="chip${PE.gruppe === g ? " an" : ""}" data-gruppe="${esc(g)}">${g === "alle" ? "Alle" : esc(g)}</button>`).join("")}
      <span style="margin-left:auto"><button type="button" class="knopf klein" data-alle="1">＋1 für alle hier</button> <button type="button" class="knopf klein" data-alle="0">Alle auf 0</button></span></div>
    <div class="pe-liste">${liste || '<p class="hinweis">Keine Artikel.</p>'}</div>
    <div class="knoepfe"><button class="knopf" data-zu="1">Schließen</button></div>
    <style>#peBlatt .pe-reihe{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}#peBlatt .pe-reihe>b{min-width:100%;font-size:.9rem}
      #peBlatt .pe-haken{display:inline-flex;gap:4px;align-items:center;font-size:.9rem;padding:3px 8px;border:1px solid var(--linie);border-radius:14px}
      #peBlatt .pe-oben{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;margin:8px 0}#peBlatt .pe-vorschau canvas{width:220px;height:220px;display:block;background:#fff;border-radius:6px;box-shadow:0 1px 4px #0003}
      #peBlatt .pe-info{flex:1;min-width:180px}#peBlatt .pe-liste{display:grid;gap:4px}
      #peBlatt .pe-zeile{display:flex;gap:6px;align-items:center;padding:4px 6px;border-radius:8px;background:var(--karte2)}#peBlatt .pe-zeile.pe-an{outline:2px solid var(--gruen,#2e7d32)}
      #peBlatt .pe-name{flex:1;text-align:left;border:0;background:none;cursor:pointer;display:flex;flex-direction:column;color:inherit;font:inherit}#peBlatt .pe-name small{opacity:.75}
      #peBlatt .pe-preis{white-space:nowrap}#peBlatt .pe-preis input{width:4.2em;text-align:right}#peBlatt .pe-anz{display:inline-flex;gap:4px;align-items:center}#peBlatt .pe-anz b{min-width:1.6em;text-align:center}</style>`);
  const neu = () => { const y = f.querySelector(".blatt-innen")?.scrollTop || 0; peZeigen(); const g = document.querySelector("#peBlatt .blatt-innen"); if (g) g.scrollTop = y; };
  f.querySelector("[data-zu]").onclick = () => f.remove();
  f.querySelectorAll("[data-format]").forEach((b) => (b.onclick = () => { PE.format = Number(b.dataset.format); neu(); }));
  f.querySelectorAll("[data-aus]").forEach((b) => (b.onchange = () => { PE.aus[b.dataset.aus] = b.checked; peVorschau(); }));
  f.querySelectorAll("[data-gruppe]").forEach((b) => (b.onclick = () => { PE.gruppe = b.dataset.gruppe; neu(); }));
  f.querySelectorAll("[data-plus],[data-minus]").forEach((b) => (b.onclick = () => { const id = b.dataset.plus || b.dataset.minus;
    PE.anzahl[id] = Math.max(0, Math.min(200, (PE.anzahl[id] || 0) + (b.dataset.plus ? 1 : -1))); PE.vorschauId = id; neu(); }));
  f.querySelectorAll("[data-alle]").forEach((b) => (b.onclick = () => { peSichtbar().forEach((a) => (PE.anzahl[a.id] = b.dataset.alle === "1" ? Math.min(200, (PE.anzahl[a.id] || 0) + 1) : 0)); neu(); }));
  f.querySelectorAll("[data-vorschau]").forEach((b) => (b.onclick = () => { PE.vorschauId = b.dataset.vorschau; peVorschau(); }));
  f.querySelectorAll("[data-preis]").forEach((i) => (i.onchange = () => { const v = Number(String(i.value).replace("−", "-").replace(",", ".")); const a = PE.artikel.find((x) => x.id === i.dataset.preis);
    if (Number.isFinite(v) && v > -1000 && v < 1000) PE.preis[i.dataset.preis] = Math.round(v * 100) / 100; else delete PE.preis[i.dataset.preis];
    i.value = peZahl(pePreis(a)); PE.vorschauId = i.dataset.preis; peVorschau(); }));
  f.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => peDrucken(b.dataset.a === "probe", b)));
  peVorschau();
}
function peVorschauArtikel() { return PE.artikel.find((a) => a.id === PE.vorschauId) || PE.artikel.find((a) => PE.anzahl[a.id]) || peSichtbar()[0] || PE.artikel[0]; }
async function peVorschau() {
  const c = $("peVorschau"), a = peVorschauArtikel(); if (!c || !a) return;
  const K = PE.format * 10, px = Math.round(K * PE_MM); c.width = c.height = px;
  const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, px, px);
  try { await qrLaden(); } catch {}
  await peEtikett(g, a, 0, 0, K);
  if ($("peVorschauText")) $("peVorschauText").textContent = `Vorschau: ${a.name} (${PE.format} × ${PE.format} cm)`;
}

// Foto vorbereiten: Kachelbilder der Kasse ohne Namensbalken (bildAusschnitt) und ohne i-Symbol (bildSymbol, mit der Farbe drumherum übermalt)
async function peFoto(a) {
  if (!a.bild) return null;
  if (PE.bilder.has(a.id)) return PE.bilder.get(a.id);
  const p = new Promise((ok) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = peKasse() + a.bild; }).then((img) => {
    if (!img) return null;
    const W = img.naturalWidth, H = img.naturalHeight, [ax, ay, aw, ah] = a.bildAusschnitt || (() => { const k = Math.min(W, H); return [(W - k) / 2 / W, (H - k) / 2 / H, k / W, k / H]; })();
    const N = 600, NH = Math.round(N * (ah * H) / (aw * W)), c = document.createElement("canvas"); c.width = N; c.height = NH;
    const g = c.getContext("2d"); g.drawImage(img, ax * W, ay * H, aw * W, ah * H, 0, 0, N, NH);
    if (a.bildSymbol) { const [sx, sy, sr] = a.bildSymbol, cx = sx * N, cy = sy * N, px = g.getImageData(0, 0, N, NH).data, f = [[], [], []];
      for (let w = 0; w < 360; w += 6) { const x = Math.round(cx + Math.cos(w * Math.PI / 180) * N * (sr + 0.018)), y = Math.round(cy + Math.sin(w * Math.PI / 180) * N * (sr + 0.018));
        if (x < 0 || y < 0 || x >= N || y >= NH) continue; const o = (y * N + x) * 4; for (let k = 0; k < 3; k++) f[k].push(px[o + k]); }
      const med = (z) => z.sort((u, v) => u - v)[z.length >> 1]; if (f[0].length) { g.fillStyle = `rgb(${med(f[0])},${med(f[1])},${med(f[2])})`; g.beginPath(); g.arc(cx, cy, sr * N, 0, 7); g.fill(); } }
    return c;
  });
  PE.bilder.set(a.id, p); return p;
}
function peRund(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
// Text in Zeilen umbrechen (Wörter), zurück: [{t, rot, fett}] je Zeile als Stücke
function peUmbruch(g, stuecke, breite) {
  const zeilen = [[]]; let x = 0;
  for (const s of stuecke) for (const wort of String(s.t).split(/(\s+)/)) {
    if (!wort) continue; g.font = `${s.fett ? 700 : 400} ${g._gr}px ${PE_SCHRIFT}`; const w = g.measureText(wort).width;
    if (/^\s+$/.test(wort)) { if (x > 0) { zeilen[zeilen.length - 1].push({ ...s, t: " " }); x += w; } continue; }
    if (x + w > breite && x > 0) { zeilen.push([]); x = 0; }
    zeilen[zeilen.length - 1].push({ ...s, t: wort }); x += w;
  }
  return zeilen;
}
// Ein Etikett zeichnen; x0/y0/K in mm (Maße wie das 7x7-Etikett, mal K/70)
async function peEtikett(g, a, x0, y0, K) {
  const M = PE_MM, u = K / 70, O = PE.aus, farbe = /^#[0-9a-f]{3,8}$/i.test(a.farbe || "") ? a.farbe : "#173765";
  const X = (mm) => (x0 + mm) * M, Y = (mm) => (y0 + mm) * M;
  if (a.spezial === "bar") return peBarEtikett(g, a, X, Y, K, u, farbe);
  g.save(); g.fillStyle = "#fff"; g.fillRect(X(0), Y(0), K * M, K * M);
  if (O.rahmen) { g.lineWidth = 0.8 * u * M; g.strokeStyle = farbe; peRund(g, X(0.4 * u), Y(0.4 * u), (K - 0.8 * u) * M, (K - 0.8 * u) * M, 5 * u * M); g.stroke(); }
  const L = 3.6 * u, R = 3.2 * u, T = 2.4 * u, B = 2 * u, innen = K - L - R;
  let y = T;
  if (O.name) { let gr = 4.8 * u; g.font = `800 ${gr * M}px ${PE_SCHRIFT}`; while (g.measureText(a.name).width > innen * M && gr > 2.4 * u) { gr -= 0.1 * u; g.font = `800 ${gr * M}px ${PE_SCHRIFT}`; }
    g.fillStyle = farbe; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText(a.name, X(L + innen / 2), Y(y + gr * 0.9)); y += gr * 1.05 + 0.8 * u; }
  // Pfand und Sonstiges (Glas, Becher, Wertmarke …) sind keine Lebensmittel – dort keine Allergen-/Zusatzstoff-Zeilen
  const essbar = !/^(Pfand|Sonstiges)$/i.test(String(a.kategorie || ""));
  const textAn = essbar && (O.allergene || O.zusatz || (O.alkohol && a.alkohol)), unten = K - B, links = O.foto || textAn, rechts = O.preis || O.qr;
  const lw = links && rechts ? 26.5 * u : innen, rx = links && rechts ? L + lw + 2 * u : L, rw = links && rechts ? innen - lw - 2 * u : innen;
  // links: Foto, darunter Allergene/Zusatzstoffe
  if (links) {
    let ly = y; const foto = O.foto ? await peFoto(a) : null;
    if (O.foto) {
      const verh = foto ? foto.height / foto.width : 0.83, fw = lw, fh = Math.min(fw * verh, (unten - ly) * (textAn ? 0.55 : 1)), fbr = fh / verh;
      const fx = L + (lw - fbr) / 2;
      g.save(); peRund(g, X(fx), Y(ly), fbr * M, fh * M, 2.4 * u * M); g.clip();
      if (foto) g.drawImage(foto, X(fx), Y(ly), fbr * M, fh * M); else { g.fillStyle = "#eef1f5"; g.fillRect(X(fx), Y(ly), fbr * M, fh * M); }
      g.restore();
      if (!foto) { g.fillStyle = "#b91c1c"; g.font = `700 ${2.4 * u * M}px ${PE_SCHRIFT}`; g.textAlign = "center"; g.fillText("⚠ Foto fehlt", X(fx + fbr / 2), Y(ly + fh / 2)); }
      ly += fh + 1.4 * u;
    }
    if (textAn) {
      const st = [];
      const fehlt = { t: "⚠ nicht erfasst", rot: true, fett: true };
      if (O.allergene) st.push([{ t: "Allergene: ", fett: true }, a.allergene ? { t: a.allergene } : fehlt]);
      if (O.zusatz) st.push([{ t: "Zusatzstoffe: ", fett: true }, a.zusatz ? { t: a.zusatz } : fehlt]);
      if (O.alkohol && a.alkohol) st.push([{ t: "Enthält Alkohol", fett: true }]);
      let gr = 3 * u, zeilen;
      for (;;) { g._gr = gr * M; zeilen = st.map((s) => peUmbruch(g, s, lw * M)); const h = zeilen.reduce((s, z) => s + z.length, 0) * gr * 1.22 + (st.length - 1) * 0.8 * u;
        if (h <= unten - ly || gr <= 1.7 * u) break; gr -= 0.1 * u; }
      g.textAlign = "left"; g.textBaseline = "alphabetic";
      for (const absatz of zeilen) { for (const z of absatz) { let x = X(L); ly += gr * 1.22;
          for (const s of z) { g.font = `${s.fett ? 700 : 400} ${gr * M}px ${PE_SCHRIFT}`; g.fillStyle = s.rot ? "#b91c1c" : "#111"; g.fillText(s.t, x, Y(ly - gr * 0.25)); x += g.measureText(s.t).width; } }
        ly += 0.8 * u; }
    }
  }
  // rechts: Preis inkl. Pfand (ohne €-Zeichen), darunter QR-Code mit Artikelnummer
  if (rechts) {
    let ry = y; const pfand = pePfand(a), gesamt = pePreis(a) + pfand;
    if (O.preis) { let gr = 12 * u; const t = peZahl(gesamt); g.font = `900 ${gr * M}px ${PE_SCHRIFT}`; while (g.measureText(t).width > rw * M && gr > 5 * u) { gr -= 0.2 * u; g.font = `900 ${gr * M}px ${PE_SCHRIFT}`; }
      g.fillStyle = "#111"; g.textAlign = "center"; g.fillText(t, X(rx + rw / 2), Y(ry + gr * 0.82)); ry += gr * 0.92;
      if (O.pfand && pfand > 0) { const gp = 3.2 * u; g.font = `800 ${gp * M}px ${PE_SCHRIFT}`; g.fillStyle = farbe; g.fillText(`inkl. ${peZahl(pfand)} Pfand`, X(rx + rw / 2), Y(ry + gp * 1.1), rw * M); ry += gp * 1.5; }
      ry += 1 * u; }
    if (O.qr && window.qrcode) {
      const nh = O.nummer ? 3.4 * u : 0, s = Math.min(rw, 34 * u, unten - ry - nh), q = qrcode(0, "M"); q.addData(String(a.nummer)); q.make();
      const n = q.getModuleCount(), rand = 2, z = (s * M) / (n + 2 * rand), qx = X(rx + (rw - s) / 2), qy = Y(unten - nh - s);
      g.fillStyle = "#000"; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(Math.floor(qx + (c + rand) * z), Math.floor(qy + (r + rand) * z), Math.ceil(z), Math.ceil(z));
      if (O.nummer) { g.font = `700 ${2.5 * u * M}px ${PE_SCHRIFT}`; g.fillStyle = "#111"; g.textAlign = "center"; g.fillText(String(a.nummer), X(rx + rw / 2), Y(unten - 0.6 * u)); }
    }
  }
  g.restore();
}
// BAR-Etikett: großes „BAR“, QR-Code CMD-CHECKOUT so groß wie möglich, kurzer Hinweis – Bausteine (Foto, Allergene …) gelten hier nicht
function peBarEtikett(g, a, X, Y, K, u, farbe) {
  const M = PE_MM; g.save(); g.fillStyle = "#fff"; g.fillRect(X(0), Y(0), K * M, K * M);
  g.lineWidth = 0.8 * u * M; g.strokeStyle = farbe; peRund(g, X(0.4 * u), Y(0.4 * u), (K - 0.8 * u) * M, (K - 0.8 * u) * M, 5 * u * M); g.stroke();
  g.textAlign = "center"; g.fillStyle = farbe; g.font = `900 ${11 * u * M}px ${PE_SCHRIFT}`; g.fillText("BAR", X(K / 2), Y(12.5 * u));
  g.fillStyle = "#333"; g.font = `700 ${3 * u * M}px ${PE_SCHRIFT}`; g.fillText("Scannen = bar kassieren", X(K / 2), Y(17 * u));
  if (window.qrcode) { const q = qrcode(0, "M"); q.addData(String(a.nummer)); q.make(); const n = q.getModuleCount(), s = Math.min(K - 14 * u, K - 26 * u), z = (s * M) / (n + 4);
    const qx = X((K - s) / 2), qy = Y(19 * u); g.fillStyle = "#000";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(Math.floor(qx + (c + 2) * z), Math.floor(qy + (r + 2) * z), Math.ceil(z), Math.ceil(z)); }
  g.fillStyle = "#555"; g.font = `400 ${2.5 * u * M}px ${PE_SCHRIFT}`; g.fillText("Verkauf abschließen · " + a.nummer, X(K / 2), Y(K - 2.6 * u));
  g.restore();
}
// A4-Seiten (300 dpi) mit Schnittmarken außen; Probe: 1 Etikett + 5-cm-Messbalken
async function peDrucken(probe, knopf) {
  const r = peRaster(PE.format), K = r.K, je = r.sp * r.ze;
  const liste = probe ? [peVorschauArtikel()] : PE.artikel.flatMap((a) => Array(PE.anzahl[a.id] || 0).fill(a));
  if (!liste.length) return melde("Bitte zuerst bei den Artikeln die Anzahl wählen.", true);
  const alt = knopf.textContent; knopf.disabled = true; knopf.textContent = "⏳ Einen Moment …";
  try {
    await qrLaden(); const bilder = [], W = Math.round(210 * PE_MM), H = Math.round(297 * PE_MM);
    for (let i = 0; i < liste.length; i += je) {
      const teil = liste.slice(i, i + je), c = document.createElement("canvas"); c.width = W; c.height = H;
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
      const sp = probe ? 1 : r.sp, ze = probe ? 1 : Math.ceil(teil.length / r.sp), x0 = (210 - sp * K) / 2, y0 = probe ? 40 : (297 - r.ze * K) / 2;
      for (let k = 0; k < teil.length; k++) await peEtikett(g, teil[k], x0 + (k % sp) * K, y0 + Math.floor(k / sp) * K, K);
      // Schnittmarken: an jeder Schnittlinie außen (2–6 mm vom Raster), nie auf einem Etikett
      g.fillStyle = "#000"; const D = 0.25 * PE_MM, mk = (x, y, w, h) => g.fillRect(x * PE_MM, y * PE_MM, w * PE_MM, h * PE_MM);
      for (let c2 = 0; c2 <= sp; c2++) { const x = x0 + c2 * K; mk(x - 0.125, y0 - 6, 0.25, 4); mk(x - 0.125, y0 + ze * K + 2, 0.25, 4); }
      for (let z = 0; z <= ze; z++) { const y = y0 + z * K; mk(x0 - 6, y - 0.125, 4, 0.25); mk(x0 + sp * K + 2, y - 0.125, 4, 0.25); }
      if (probe) { const mx = 80, my = y0 + K + 20; g.lineWidth = D; g.strokeStyle = "#000"; g.beginPath(); g.moveTo(mx * PE_MM, (my - 2) * PE_MM); g.lineTo(mx * PE_MM, my * PE_MM); g.lineTo((mx + 50) * PE_MM, my * PE_MM); g.lineTo((mx + 50) * PE_MM, (my - 2) * PE_MM); g.stroke();
        g.font = `400 ${3 * PE_MM}px ${PE_SCHRIFT}`; g.textAlign = "center"; g.fillText("Messbalken: muss genau 5 cm lang sein", (mx + 25) * PE_MM, (my + 5) * PE_MM);
        g.fillText(`Probe ${PE.format} × ${PE.format} cm – mit 100 % drucken. QR-Code an der Kasse scannen: „${liste[0].nummer}“`, 105 * PE_MM, (my + 12) * PE_MM); }
      bilder.push(c.toDataURL("image/jpeg", 0.92));
      if (probe) break;
    }
    document.getElementById("peBlatt")?.remove();
    druckStarten("preisetiketten", { bilder, n: liste.length, format: PE.format, probe });
  } catch (e) { meldeFehler(e); }
  finally { knopf.disabled = false; knopf.textContent = alt; }
}
