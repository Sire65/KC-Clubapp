-- KC Club-App – Version 0.42.0
-- KC-CLUB-WETTER: clubweite Einstellungen (Schlüssel → JSON), zuerst für den Wetter-Ort und die Wetter-App (nur Admin änderbar).
-- Zugriff nur über die Edge Function (Service-Rolle); RLS ohne Richtlinien sperrt direkte Zugriffe.
create table if not exists kc_club_konfig (
  schluessel text primary key check (schluessel ~ '^[a-z_]{2,40}$'),
  wert jsonb not null,
  geaendert_von text not null,
  geaendert_am timestamptz not null default now()
);
alter table kc_club_konfig enable row level security;
insert into kc_club_konfig (schluessel, wert, geaendert_von) values
  ('wetter', '{"ort":{"name":"Werne","lat":51.6639,"lon":7.6337,"region":"Nordrhein-Westfalen"},"quelle":"open-meteo","app":"wetteronline"}', 'KC-P-002')
on conflict (schluessel) do nothing;
