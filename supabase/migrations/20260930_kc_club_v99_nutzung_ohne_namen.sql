-- KC Club-App – Version 0.99.0
-- KC-CLUB-NUTZUNG: Nutzungsstatistik OHNE Namen (Freigabe Hansi: „Statistik ohne Namen“).
--   Gezählt wird nur: Tag + Bereich (z. B. „termine“) + Anzahl Öffnungen. Keine Person, kein Gerät, keine Uhrzeit.
--   Die App sammelt auf dem Gerät und schickt gebündelt; der Server addiert nur auf – wer geschickt hat, wird nicht gespeichert.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Rückweg: drop function …; drop table kc_club_nutzung;
create table if not exists kc_club_nutzung (
  tag date not null,
  bereich text not null check (bereich ~ '^[a-z_]{2,30}$'),
  anzahl integer not null default 0 check (anzahl >= 0),
  primary key (tag, bereich)
);
alter table kc_club_nutzung enable row level security;
-- Zählen in einem Schritt (mehrere Geräte gleichzeitig → kein verlorener Zähler)
create or replace function kc_club_nutzung_zaehlen(p_tag date, p_bereiche text[], p_anzahlen integer[])
returns void language sql security definer set search_path = public as $$
  insert into kc_club_nutzung (tag, bereich, anzahl)
  select p_tag, b, greatest(0, least(a, 200)) from unnest(p_bereiche, p_anzahlen) as t(b, a)
  on conflict (tag, bereich) do update set anzahl = kc_club_nutzung.anzahl + excluded.anzahl;
$$;
revoke all on function kc_club_nutzung_zaehlen(date, text[], integer[]) from public, anon, authenticated;
