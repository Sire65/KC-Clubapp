-- KC-CLUB-ZEITUNGSARTIKEL (09.11.2026, Wunsch Hansi „Ordner Zeitungsartikel – auch im Büro“): fester Club-Ordner „Zeitungsartikel“
-- (für alle Mitglieder sichtbar) bekommt die Kennung wie die anderen festen Ordner (FESTE_ORDNER im Club-Server). Nur eine Kennung –
-- keine Tabelle, nichts gelöscht. Am 09.11. bereits direkt gesetzt (Ordner 175f3250…); diese Datei hält es fest und ist wiederholbar.
-- Rückweg: update public.kc_club_archiv_ordner set kennung = null where kennung = 'zeitungsartikel';
with feste(kennung, titel) as (values ('zeitungsartikel', 'Zeitungsartikel')),
kandidat as (
  select o.id, f.kennung, row_number() over (partition by f.kennung, o.jahr order by o.erstellt_am, o.id) as nr
    from public.kc_club_archiv_ordner o join feste f on f.titel = o.titel
   where o.besitzer is null and o.geloescht_am is null and o.kennung is null)
update public.kc_club_archiv_ordner o set kennung = k.kennung
  from kandidat k
 where o.id = k.id and k.nr = 1
   and not exists (select 1 from public.kc_club_archiv_ordner x where x.kennung = k.kennung and x.geloescht_am is null);
