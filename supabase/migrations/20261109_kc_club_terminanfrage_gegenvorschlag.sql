-- KC-CLUB-ANFRAGE-GEGENVORSCHLAG (09.11.2026, Wunsch Hansi „Baue ein bei Terminanfrage ob Gegenvorschlag erlaubt ist“)
-- Wer eine Terminanfrage schickt, legt fest, ob die Angefragten eine andere Zeit vorschlagen dürfen. Standard: ja (wie bisher).
alter table public.kc_club_terminanfragen add column if not exists gegenvorschlag boolean not null default true;
comment on column public.kc_club_terminanfragen.gegenvorschlag is 'false = Zeit steht fest, Gegenvorschläge nicht möglich (KC-CLUB-ANFRAGE-GEGENVORSCHLAG)';
