-- 2.536.0 KC-CLUB-KOMMUNIKATION-AUS (Wunsch Hansi 20.10.2026): Mitglieder, die aus der Kommunikation der Club-App herausgenommen werden
-- möchten. Registry statt fest im Programm: wer hier steht, bekommt von der Club-App (kc-club) und den Terminen (kc-termine) keinen Push
-- und keine E-Mail – auch nicht, wenn der Absender 🔔/✉️ ausdrücklich wählt, bei Express, ❗ Wichtig, Notfall oder als Kopie (CC/BCC).
-- Chats und Inhalte bleiben in der App sichtbar. Rückweg: drop table public.kc_club_kommunikation_aus;
create table if not exists public.kc_club_kommunikation_aus (
  person_id text primary key,
  grund text check (grund is null or char_length(grund) <= 300),
  seit timestamptz not null default now(),
  eingetragen_von text
);
alter table public.kc_club_kommunikation_aus enable row level security;
revoke all on public.kc_club_kommunikation_aus from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_kommunikation_aus to service_role;
