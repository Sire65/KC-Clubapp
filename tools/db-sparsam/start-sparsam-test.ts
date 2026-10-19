// KC-CLUB-START-SPARSAM (2.489.0): Gleichwertigkeit alt ↔ neu für die zusammengefassten Start-Abfragen (Vorschläge, Freigaben, Einstellungen).
// Die neuen Filter werden aus dem echten Server-Code gelesen und gegen die alten Datenbank-Bedingungen (nachgebaut) mit Zufallsdaten geprüft.
// Start: deno run -A tools/db-sparsam/start-sparsam-test.ts
const src = await Deno.readTextFile(new URL("../../supabase/functions/kc-club/index.ts", import.meta.url));
const ok = (b: boolean, t: string) => { if (!b) { console.error("FEHLER:", t); Deno.exit(1); } console.log("ok:", t); };
// Die Filter stehen wörtlich so im Code – sonst schlägt der Test fehl (dann bitte hier anpassen)
const muss = (x: string) => ok(src.includes(x), "im Code: " + x.slice(0, 90));
muss(`const abstAlle = (vo ?? []).filter((x: any) => x.art === "abstimmung");`);
muss(`.filter((x: any) => x.art === "thema" && (x.treffen_id === s0.id || x.treffen_id == null)).slice(0, 100);`);
muss(`(r.data ?? []).filter((x: any) => x.bereich === "geburtstag" || x.bereich === "runder_geburtstag")`);
muss(`(r.data ?? []).filter((x: any) => String(x.bereich).startsWith("kontakt_"))`);
muss(`(r.data ?? []).find((x: any) => x.schluessel === "stumm") ?? null`);
muss(`db.from("kc_club_vorschlaege").select("id,art,ziel_ids,erstellt_von,treffen_id").eq("status", "offen").limit(1000)`);
const zuf = (n: number) => Math.floor(Math.random() * n);
const sortiert = (l: any[]) => JSON.stringify(l.map((x) => JSON.stringify(x)).sort());
let n = 0;
for (let lauf = 0; lauf < 500; lauf++) {
  const ich = "P1", s0 = { id: "T" + zuf(3) };
  const vorschlaege = Array.from({ length: zuf(30) }, (_, i) => ({ id: "v" + i, status: ["offen", "beendet"][zuf(2)], art: ["abstimmung", "thema", "idee"][zuf(3)],
    ziel_ids: Math.random() < 0.5 ? null : ["P1", "P2", "P3"].filter(() => Math.random() < 0.5), erstellt_von: ["P1", "P2"][zuf(2)], treffen_id: Math.random() < 0.4 ? null : "T" + zuf(3) }));
  const offen = vorschlaege.filter((v) => v.status === "offen");
  // alt: drei Abfragen
  const abstAlt = offen.filter((v) => v.art === "abstimmung").map(({ id, ziel_ids }) => ({ id, ziel_ids }));
  const anzAlt = offen.slice(0, 500).filter((v: any) => !v.ziel_ids || v.ziel_ids.includes(ich) || v.erstellt_von === ich).length;
  const themenAlt = offen.filter((v) => v.art === "thema" && (v.treffen_id === s0.id || v.treffen_id === null)).slice(0, 100).map((v) => v.id);
  // neu: eine Abfrage + Filter wie im Code
  const vo = offen.slice(0, 1000).map(({ id, art, ziel_ids, erstellt_von, treffen_id }) => ({ id, art, ziel_ids, erstellt_von, treffen_id }));
  const abstNeu = vo.filter((x: any) => x.art === "abstimmung").map(({ id, ziel_ids }) => ({ id, ziel_ids }));
  const anzNeu = vo.filter((v: any) => !v.ziel_ids || v.ziel_ids.includes(ich) || v.erstellt_von === ich).length;
  const themenNeu = vo.filter((x: any) => x.art === "thema" && (x.treffen_id === s0.id || x.treffen_id == null)).slice(0, 100).map((v) => v.id);
  if (sortiert(abstAlt) !== sortiert(abstNeu) || anzAlt !== anzNeu || JSON.stringify(themenAlt) !== JSON.stringify(themenNeu)) ok(false, `Lauf ${lauf}: Vorschläge gleich`);
  // Freigaben
  const bereiche = ["geburtstag", "runder_geburtstag", "kontakt_handy", "kontakt_mail", "kontakt_adresse", "dienstzeiten", "kontaktdaten"];
  const frei = bereiche.filter(() => Math.random() < 0.6).map((b) => ({ person_id: ich, bereich: b, erlaubt: Math.random() < 0.5 }));
  const gfsAlt = frei.filter((x) => ["geburtstag", "runder_geburtstag"].includes(x.bereich)), kfAlt = frei.filter((x) => /^kontakt_/.test(x.bereich));
  const gfsNeu = frei.filter((x: any) => x.bereich === "geburtstag" || x.bereich === "runder_geburtstag"), kfNeu = frei.filter((x: any) => String(x.bereich).startsWith("kontakt_"));
  if (sortiert(gfsAlt) !== sortiert(gfsNeu) || sortiert(kfAlt) !== sortiert(kfNeu)) ok(false, `Lauf ${lauf}: Freigaben gleich`);
  // Einstellungen: stumm aus der gemeinsamen Abfrage (ohne avatar_verlauf)
  const einst = ["stumm", "online", "avatar_verlauf", "studio_recht"].filter(() => Math.random() < 0.6).map((k) => ({ schluessel: k, wert: { x: zuf(9) } }));
  const stummAlt = einst.find((x) => x.schluessel === "stumm") ?? null, pe = einst.filter((x) => x.schluessel !== "avatar_verlauf");
  const stummNeu = pe.find((x: any) => x.schluessel === "stumm") ?? null;
  if (JSON.stringify(stummAlt?.wert ?? null) !== JSON.stringify(stummNeu?.wert ?? null)) ok(false, `Lauf ${lauf}: stumm gleich`);
  n++;
}
ok(n === 500, "500 Zufallsdaten: Abstimmungen, Vorschlags-Zahl, Themen, Freigaben, stumm – alt = neu");
console.log("ALLE TESTS GRÜN"); Deno.exit(0);
