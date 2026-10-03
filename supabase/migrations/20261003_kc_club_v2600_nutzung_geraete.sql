-- KC Club-App – Version 2.6.0
-- KC-CLUB-NUTZUNG-PERSONEN (Wunsch Hansi: „sehen, welche Funktionen sie nutzen“ – ausdrücklich OHNE Namen):
--   Je Tag + Bereich wird eine ZUFÄLLIGE Geräte-Kennung gespeichert (in der App erzeugt, mit keiner Person verknüpft,
--   nicht der Zugangsschlüssel, nicht die Fehlerprotokoll-Kennung). Daraus zählt der Server „von wie vielen verschiedenen
--   Geräten“ ein Bereich genutzt wurde. Keine Uhrzeit, keine Person, keine Inhalte. Aufbewahrung 100 Tage (Wartungslauf).
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies).
-- Rückweg: drop function kc_club_nutzung_geraete_zahlen(date); drop table kc_club_nutzung_geraete;
create table if not exists kc_club_nutzung_geraete (
  tag date not null,
  bereich text not null check (bereich ~ '^[a-z_]{2,30}$'),
  geraet text not null check (geraet ~ '^[a-z0-9]{16,40}$'),
  primary key (tag, bereich, geraet)
);
alter table kc_club_nutzung_geraete enable row level security;
-- verschiedene Geräte je Bereich seit p_von; Zeile bereich = '*' = verschiedene Geräte insgesamt
create or replace function kc_club_nutzung_geraete_zahlen(p_von date)
returns table (bereich text, geraete integer) language sql stable security definer set search_path = public as $$
  select g.bereich, count(distinct g.geraet)::int from kc_club_nutzung_geraete g where g.tag >= p_von group by g.bereich
  union all
  select '*', count(distinct g.geraet)::int from kc_club_nutzung_geraete g where g.tag >= p_von;
$$;
revoke all on function kc_club_nutzung_geraete_zahlen(date) from public, anon, authenticated;
