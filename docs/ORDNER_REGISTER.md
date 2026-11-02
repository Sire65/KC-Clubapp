# Ordner & Register – Konzept (KC-CLUB-ORDNER-KENNUNG, KC-CLUB-REGISTER-UMBENENNEN)

Stand 03.11.2026 · Konzeptprüfung auf Wunsch Hansi („prüfen“ → „umbauen“) · App/Server 2.824.0

## Bausteine

| Baustein | Wo | Was |
|---|---|---|
| Ordner | `kc_club_archiv_ordner` | Vereinsordner (`besitzer` leer) oder persönlicher Ordner je Mitglied und Jahr |
| Register | Spalte `register text[]` am Ordner | Reiter im Ordner; „Jahr › Unterregister“ für mehrjährige Ordner (Weihnachtsmarkt) |
| Dokument | `kc_club_archiv_dokumente` | liegt in einem Ordner und einem Register (Name) |
| Freigabe | `kc_club_archiv_freigaben` | persönlicher Ordner, optional nur ein Register oder ein Dokument |
| Eingangskorb | Dokument mit `status = 'pruefung'` im persönlichen Ordner | Mitglied legt ab oder löscht |
| Ablagekorb, Aktentasche | eigene Tabellen | verteilen in Eingangskörbe (`archiv_eingang_verteilen`) |

## Feste Ordner (Registry `FESTE_ORDNER` im Club-Server)

Feste Ordner haben eine **Kennung** (Spalte `kennung`, je Kennung und Jahr höchstens ein lebender Ordner). App und Server finden sie
nur über die Kennung, die Beschriftung darf sich ändern.

| Kennung | ursprüngliche Beschriftung | Art |
|---|---|---|
| `admin` | Admin | je Jahr |
| `personal` | Personal | je Jahr |
| `dienstplaene` | Dienstpläne | je Jahr |
| `protokolle` | Protokolle | je Jahr |
| `weihnachtsmarkt` | Weihnachtsmarkt | Dauerordner (Jahre als Register) |
| `besprechungen` | Besprechungen | Dauerordner |
| `vertraege` | Verträge | Dauerordner |
| `schilder` | Schilder | Dauerordner |
| `anleitungen` | Anleitungen | Dauerordner |

- `archiv_liste` liefert je Ordner `kennung` und `dauerhaft`. Dauerordner tragen keine Jahreszahl im Namen und fallen nie aus Jahres-Filtern.
- Neue Kennungen nur über die Registry (kein Freitext). `archiv_ordner_speichern` nimmt `kennung` nur beim Anlegen und nur aus der Registry.
- **Neuer fester Ordner:** Eintrag in `FESTE_ORDNER` (Server) und `AR_FEST_TITEL` (App, nur Rückfall) + Migration, die den Ordner mit `kennung` anlegt.
  `tests/ordner-kennung.test.mjs` prüft, dass Migration, Server und App dieselben Kennungen kennen.
- Rückfall: Schickt der Server keine Kennung (Spalte fehlt noch), suchen App und Server wie früher nach Beschriftung + Art.

## Register

- **Umbenennen** (`archiv_ordner_speichern` mit `umbenennen: [{ alt, neu }]`): Dokumente und Freigaben ziehen mit. Nur gültige Paare
  (alt war da, neu ist da, alt ist weg, keine Doppelten) – der Server prüft selbst.
- **Entfernen:** Dokumente wandern ins erste Register (wie bisher), die App fragt vorher.
- **Ablegen in ein Register, das es nicht mehr gibt:** der Server nimmt das erste Register und meldet `registerErsetzt`; die App sagt es.

## Offen (Entscheidung Hansi)

1. Registernamen vereinheitlichen? Heute gibt es „Protokoll“ (Art Versammlungen), „Protokolle“ und „Sitzungsprotokolle“ nebeneinander.
   Vorhandene Ablagen werden dafür nicht umbenannt, ohne dass Hansi es will.
2. Register-Vorgaben stehen zweimal (Server `ARCHIV_ARTEN`, App `ARCHIV_ABLAGE_ARTEN` + Vorschlagsregeln `AR_VORSCHLAG`) – zusammenlegen in einer späteren Etappe.
3. Fast alle festen Ordner haben die Art „sonstiges“ – die Kennung ersetzt diese Unterscheidung; eine eigene Art ist nicht nötig.
