-- KC Club-App – Version 1.96.0
-- KC-CLUB-ZUGANG-VORMERKEN (Sicherheitsprüfung, Paket 1): „Link verloren?“ darf niemanden aussperren.
--   Der neue Link wird nur VORGEMERKT (neu_token_hash, gültig bis neu_bis). Der bisherige Link bleibt gültig, bis der neue
--   zum ersten Mal benutzt wird – erst dann wird er übernommen (der alte gilt dann nicht mehr).
-- Nur neue Spalten ohne Standardwert-Zwang; vorhandene Daten bleiben unverändert.
-- Rückweg: alter table kc_club_zugang drop column neu_token_hash; alter table kc_club_zugang drop column neu_bis;

alter table kc_club_zugang add column if not exists neu_token_hash text;
alter table kc_club_zugang add column if not exists neu_bis timestamptz;
create index if not exists kc_club_zugang_neu_token on kc_club_zugang (neu_token_hash) where neu_token_hash is not null;
