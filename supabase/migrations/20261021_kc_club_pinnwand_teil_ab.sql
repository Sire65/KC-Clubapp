-- 2.554.0 KC-CLUB-PINNWAND-TEIL-AB (Wunsch Hansi): Zettel nur bei denen abnehmen, die ihn schon gelesen haben; wer ihn noch nicht gesehen hat, behält ihn.
-- Rückweg: alter table public.kc_club_pinnwand drop column if exists teil_ab, drop column if exists teil_von;
alter table public.kc_club_pinnwand add column if not exists teil_ab timestamptz, add column if not exists teil_von text;
comment on column public.kc_club_pinnwand.teil_ab is 'KC-CLUB-PINNWAND-TEIL-AB: ab hier bei allen abgenommen, die ihn gesehen haben (nach dem Lesen fällt er ab).';
