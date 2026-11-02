-- KC-CLUB-ORDNER-KENNUNG (03.11.2026, Konzeptprüfung Ordner & Register, Wunsch Hansi „umbauen“)
-- Feste Club-Ordner (Schilder, Anleitungen, Weihnachtsmarkt, Besprechungen, Verträge, Admin, Personal, Dienstpläne, Protokolle)
-- wurden bisher über ihre Beschriftung gefunden. Wer einen davon im Büro umbenannte, verlor die Verbindung (Schilder-Druckerei,
-- „Jahr abschließen“, Server-Ablagen legten einen zweiten Ordner an). Jetzt bekommt jeder feste Ordner eine feste Kennung;
-- die Beschriftung darf sich ändern. Registry der Kennungen: FESTE_ORDNER im Club-Server (supabase/functions/kc-club/index.ts).
-- Nur eine neue, leere Spalte + Kennung für die vorhandenen festen Ordner (je Beschriftung/Jahr nur der älteste – Doppelte bleiben
-- unverändert und normal sichtbar). Keine neue Tabelle, keine Daten werden verschoben oder gelöscht.
-- Rückweg: drop index kc_club_archiv_ordner_kennung; alter table kc_club_archiv_ordner drop column kennung;
alter table public.kc_club_archiv_ordner add column if not exists kennung text
  check (kennung is null or kennung ~ '^[a-z][a-z0-9_]{1,30}$');
alter table public.kc_club_archiv_ordner drop constraint if exists kc_club_archiv_ordner_kennung_verein;
alter table public.kc_club_archiv_ordner add constraint kc_club_archiv_ordner_kennung_verein check (kennung is null or besitzer is null);

with feste(kennung, titel) as (values
  ('schilder', 'Schilder'), ('anleitungen', 'Anleitungen'), ('weihnachtsmarkt', 'Weihnachtsmarkt'), ('besprechungen', 'Besprechungen'),
  ('vertraege', 'Verträge'), ('admin', 'Admin'), ('personal', 'Personal'), ('dienstplaene', 'Dienstpläne'), ('protokolle', 'Protokolle')),
kandidat as (
  select o.id, f.kennung, row_number() over (partition by f.kennung, o.jahr order by o.erstellt_am, o.id) as nr
    from public.kc_club_archiv_ordner o join feste f on f.titel = o.titel
   where o.besitzer is null and o.geloescht_am is null and o.kennung is null)
update public.kc_club_archiv_ordner o set kennung = k.kennung
  from kandidat k
 where o.id = k.id and k.nr = 1
   and not exists (select 1 from public.kc_club_archiv_ordner x
                    where x.kennung = k.kennung and x.jahr = o.jahr and x.geloescht_am is null);

-- je Kennung und Jahr höchstens ein lebender Ordner (Papierkorb zählt nicht)
create unique index if not exists kc_club_archiv_ordner_kennung on public.kc_club_archiv_ordner (kennung, jahr)
  where kennung is not null and geloescht_am is null;
