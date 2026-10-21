// KC-CLUB-ANRUF-TURN (2.563.0, 21.10.2026, Wunsch Hansi „als Sicherheit beim Anrufen und Video“): Entscheidungen zum Vorrat an
// Zugangsdaten für den Umleitungs-Server (Metered). Neue Zugangsdaten gelten bei Metered erst nach bis zu 2 Min. – darum hält der
// Club-Server einen Vorrat (kc_club_turn_vorrat): 7 Tage gültig, ab 2 Tagen Restlaufzeit kommt ein neuer dazu (nutzbar ab +3 Min.),
// der alte gilt bis dahin weiter. Rein (ohne Datenbank und Netz) – getestet in tests/anruf-turn.test.mjs.

export const TURN = { gueltigSek: 7 * 86400, erneuernMs: 2 * 86400000, wartenMs: 3 * 60000, sperreMs: 10 * 60000, cacheMs: 10 * 60000, fehlerPauseMs: 10 * 60000, restMs: 3600000 };

// liste: Vorrat mit mehr als TURN.restMs Restlaufzeit, neueste zuerst ({ username, password, gueltig_bis, nutzbar_ab, erstellt_am })
// Ergebnis: nutzbar = die neueste Zeile, die schon gilt (oder null); neu = jetzt neue Zugangsdaten bei Metered anlegen?
export function turnPlan(liste, t, fehlerBis = 0) {
  const ms = (x) => Date.parse(x);
  const gueltig = (liste || []).filter((z) => z && z.username && z.password && ms(z.gueltig_bis) - t > TURN.restMs);
  const nutzbar = gueltig.find((z) => ms(z.nutzbar_ab) <= t) || null;
  const neueste = gueltig[0];
  const brauchtNeu = !neueste || ms(neueste.gueltig_bis) - t < TURN.erneuernMs;
  const gesperrt = !!neueste && t - ms(neueste.erstellt_am) < TURN.sperreMs; // gerade erst angelegt (auch von einer anderen Server-Instanz)
  return { nutzbar, neu: brauchtNeu && !gesperrt && t >= fehlerBis };
}

// neue Vorrats-Zeile aus der Antwort von Metered (POST /api/v1/turn/credential)
export function turnZeile(antwort, t) {
  if (!antwort || typeof antwort.username !== "string" || typeof antwort.password !== "string" || !antwort.username || !antwort.password) return null;
  return { username: antwort.username, password: antwort.password, gueltig_bis: new Date(t + TURN.gueltigSek * 1000).toISOString(), nutzbar_ab: new Date(t + TURN.wartenMs).toISOString() };
}

// ICE-Server für die App: nur die Umleitung über UDP/TCP 80, UDP 443 und TLS 443 (geht auch durch strenge Firmen-WLANs).
// Kein zusätzlicher STUN-Server von Metered – die App hat ihre STUN-Server schon (weniger Anfragen an Dritte).
export function turnIce(host, username, credential) {
  return [{ urls: [`turn:${host}:80`, `turn:${host}:80?transport=tcp`, `turn:${host}:443`, `turns:${host}:443?transport=tcp`], username, credential }];
}

// wie lange die App die Wege merken darf: höchstens bis 1 Std. vor Ablauf, höchstens 6 Std.
export const turnAppBis = (gueltigBis, t) => new Date(Math.min(Date.parse(gueltigBis) - TURN.restMs, t + 6 * 3600000)).toISOString();
