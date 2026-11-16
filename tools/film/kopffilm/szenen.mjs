// Drehbuch „Der Kopf der Club-App“ (KC-CLUB-KOPFFILM, neu aufgebaut 15.11.2026 für App 2.954.0): je Szene (id wie in texte.json) die Bilder aus der echten App.
// h.foto({ finger, tipp, ringe, zoom, bei }) – finger/ringe: CSS-Wahl oder {x,y} in % des Bildschirms; zoom: { um: Wahl | x,y, f: Faktor }.
const OBEN = { x: 50, y: 0, f: 1.6 };
const start = async (h) => { await h.js(() => { if (aktuelleAnsicht !== "start") zeige("start", true); window.scrollTo(0, 0); }); await h.warte(400); };
const stufe = async (h, s) => { await h.js((s) => kopfRolloSetzen(s), s); await h.warte(900); };
const tippen = async (h) => { await h.js(() => kopfRollo("weiter")); await h.s.waitForFunction(() => !document.querySelector("#v-start .hero")?.dataset.rollt, null, { timeout: 8000 }).catch(() => {}); await h.warte(500); };
const einstellung = async (h, bereich, id) => {
  await h.js(([b, id]) => { zeige("einstellungen"); setTimeout(() => { euOeffnen(b); setTimeout(() => { const e = document.getElementById(id); (e?.closest(".schalter, label, .zeile") || e)?.scrollIntoView({ block: "center" }); }, 300); }, 300); }, [bereich, id]);
  await h.warte(1500);
};
export default {
  aufbau: async (h) => { await start(h); await stufe(h, "offen"); await h.karte("treffen");
    return [await h.foto({ ringe: ["#v-start .kopfzeile"] }), await h.foto({ ringe: ["#v-start .statusleiste"] }), await h.foto({ ringe: ["#infoFeld"] }), await h.foto({ ringe: ["#infoPunkte"] })]; },
  kopfzeile: async (h) => [await h.foto({ zoom: OBEN, finger: "#v-start .kopflogo .logo" }), await h.foto({ zoom: OBEN, finger: "#modusKnopf" }), await h.foto({ zoom: OBEN, finger: "#aktualisierenKnopf", tipp: true })],
  rand: async (h) => [await h.foto({ zoom: { x: 100, y: 0, f: 1.6 } }), await h.foto({ zoom: { x: 100, y: 0, f: 1.6 }, ringe: ["#kopfPfeil", "#spKnopf", "#netzBalken"] })],
  knopf: async (h) => [await h.foto({ zoom: { um: "#kopfPfeil", f: 2.6 }, ringe: ["#kopfPfeil"] }), await h.foto({ ringe: ["#kopfPfeil"] })],
  stufe1: async (h) => { const a = await h.foto({ finger: "#kopfPfeil", tipp: true }); await tippen(h); return [a, await h.foto({ ringe: ["#kopfPfeil"], bei: 0.25 })]; },
  stufe2: async (h) => { const a = await h.foto({ finger: "#kopfPfeil", tipp: true }); await tippen(h); return [a, await h.foto({ ringe: ["#kopfPfeil"], bei: 0.2 })]; },
  stufe3: async (h) => { const a = await h.foto({ finger: "#kopfPfeil", tipp: true }); await tippen(h); return [a, await h.foto({ ringe: ["#kopfPfeil"], bei: 0.2 })]; },
  stufe4: async (h) => {
    const a = await h.foto({ finger: "#kopfPfeil", tipp: true }); await tippen(h); const b = await h.foto({ ringe: ["#kopfPfeil"] });
    await stufe(h, "ganz"); await h.js(() => { KPN.an = true; kopfPfeilNeuZeigen("ganz"); }); await h.warte(700);
    const c = await h.foto({ zoom: { x: 50, y: 0, f: 1.8 }, ringe: ["#kopfPfeil"] });
    await h.js(() => { KPN.an = false; kopfPfeilNeuZeigen("ganz"); }); const d = await h.foto({ finger: "#kopfPfeil", tipp: true, warte: 100 });
    await stufe(h, "offen"); return [a, b, c, d];
  },
  netz: async (h) => { await start(h); const a = await h.foto({ zoom: { x: 100, y: 0, f: 2.2 }, finger: "#netzBalken", tipp: true });
    await h.js(() => netzBlatt()); await h.warte(900); const b = await h.foto({ vorher: () => h.js(() => netzBlatt()) });
    await h.weg(); return [a, b]; },
  flagge: async (h) => { await start(h); const a = await h.foto({ zoom: { x: 100, y: 0, f: 2 }, finger: "#spKnopf", tipp: true });
    await h.js(() => spracheUmschalten()); await h.warte(2500); const b = await h.foto({ ringe: ["#spKnopf"] });
    await h.js(() => spracheUmschalten()); await h.warte(1500); const c = await h.foto({ finger: "#spKnopf", tipp: true, bei: 0.82 }); return [a, b, c]; },
  status: async (h) => { await start(h); const a = await h.foto({ zoom: OBEN, finger: "#statusChip", tipp: true });
    const b = await h.foto({ vorher: async () => { await h.js(() => statusBlatt()); await h.warte(700); } }); await h.weg();
    const c = await h.foto({ zoom: OBEN, ringe: ["#leds"], bei: 0.68 }); return [a, b, c]; },
  treffen: async (h) => { await h.karte("treffen"); return [await h.foto({ ringe: ["#infoLaufband"] }), await h.foto({ ringe: ["#heroInfo .kacheln3"] }), await h.foto({ finger: "#heroInfo .mini-neu", tipp: true })]; },
  blaettern: async (h) => { await h.karte("treffen"); const a = await h.foto({ finger: ".ipfeil.rechts.mit-sprung", tipp: true });
    await h.js(() => infoBlaettern(1)); await h.warte(1300); const b = await h.foto({ finger: ".ipfeil.rechts.sprung", tipp: true });
    await h.karte("zentrale"); const c = await h.foto({ finger: ".ipfeil.links.sprung", tipp: true }); await h.karte("treffen"); return [a, b, c]; },
  punkte: async (h) => { await h.karte("treffen"); const a = await h.foto({ ringe: ["#infoPunkte"] }); const b = await h.foto({ finger: "#infoPunkte .ipunkt:nth-child(6)", tipp: true });
    await h.karte("fotos"); return [a, b, await h.foto({ ringe: ["#infoPunkte .ipunkt.an"] })]; },
  schnellstart: async (h) => { await h.karte("schnellstart"); return [await h.foto({ ringe: ["#infoFeld"] }), await h.foto({ finger: "#infoFeld .ss-stift, #infoFeld button[title*='ählen'], #infoFeld button[aria-label*='ählen']", tipp: true, bei: 0.7 })]; },
  wetter: async (h) => { await h.karte("wetter"); await h.warte(1500); const a = await h.foto({ ringe: ["#infoFeld .wtage"] });
    const b = await h.foto({ finger: "#infoFeld .wtag:nth-child(2)", tipp: true });
    await h.js(() => wetterTagWahl(1)); await h.warte(700); const c = await h.foto({ finger: "#infoFeld .wtag:nth-child(2)" });
    await h.js(() => wetterTagDetails(1)); await h.warte(900); const d = await h.foto({ vorher: async () => { await h.js(() => wetterTagDetails(1)); await h.warte(600); }, bei: 0.6 });
    await h.weg(); await h.js(() => wetterTagWahl(0)); return [a, b, c, d]; },
  fuerdich: async (h) => { await h.karte("fuerdich"); return [await h.foto({ ringe: ["#infoFeld"] }), await h.foto({ finger: "#infoFeld .ifz", tipp: true })]; },
  demnaechst: async (h) => { await h.karte("demnaechst"); await h.warte(800); return [await h.foto({ ringe: ["#infoFeld"] }), await h.foto({ finger: "#infoFeld button", tipp: true })]; },
  fotos: async (h) => { await h.karte("fotos"); await h.warte(800); return [await h.foto({ ringe: ["#infoFeld .ifotos"] }), await h.foto({ finger: "#infoFeld .ifoto:nth-child(2)", tipp: true }), await h.foto({ finger: "#infoFeld .wlink", tipp: true })]; },
  zentrale: async (h) => { await h.karte("zentrale"); await h.warte(800); return [await h.foto({ ringe: ["#infoFeld .zdisplay"] }), await h.foto({ finger: "#infoFeld .zknopf", ringe: ["#infoFeld .zknopf"] }), await h.foto({ ringe: ["#infoFeld .zweg"] })]; },
  startkarte: async (h) => { await h.karte("treffen"); const a = await h.foto({ finger: "button[data-v='einstellungen']", tipp: true });
    await einstellung(h, "startseite", "setInfoStart"); return [a, await h.foto({ ringe: ["#setInfoStart"], bei: 0.3 })]; },
  szenen: async (h) => { await start(h); const a = await h.foto({ zoom: { x: 50, y: 0, f: 1.25 } });
    await einstellung(h, "effekte", "setJahreszeit"); const b = await h.foto({ ringe: ["#setJahreszeit"], bei: 0.45 }); await start(h); return [a, b]; },
  eselsohr: async (h) => { await start(h); await h.karte("treffen"); const a = await h.foto({ finger: "#eselsohr", tipp: true });
    await h.js(() => esOeffnen()); await h.warte(2600); const b = await h.foto({ bei: 0.4 });
    await h.js(() => { try { esDrehen(false); } catch {} }); await h.warte(1800); return [a, b]; },
  schluss: async (h) => { await h.js(() => ansichtSetzen("einfach")); await h.warte(1800); await start(h); const a = await h.foto({ ringe: ["#infoFeld"] });
    await h.js(() => ansichtSetzen("erweitert")); await h.warte(1800); await h.js(() => { zeige("start", true); register("programme"); document.querySelector("#register").scrollIntoView({ block: "start" }); }); await h.warte(800);
    return [a, await h.foto({ ringe: ["#raster .kachel[data-id='erklaer']"], bei: 0.45 })]; },
};
