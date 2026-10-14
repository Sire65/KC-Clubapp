-- KC-CLUB-EXPRESS-ZUSTELLUNG (2.385.0, Wunsch Hansi „bei Express eine Meldung: per Express versandt, beim Empfänger angekommen um x Uhr
-- und gelesen um y Uhr“): je Empfänger der Zeitpunkt, an dem die Express-Sendung in seiner App ankam (Express-Fenster/Start der App)
-- und an dem er den Chat mit ihr geöffnet hat. Die Push-Anzeige auf dem Handy kommt zusätzlich aus den Versand-Rückmeldungen.
-- Nur der Server (service_role) liest und schreibt – RLS an, keine Richtlinien für Nutzer. Rückweg: drop table.
create table if not exists public.kc_club_express_zustellung (
  message_id uuid not null references public.kc_club_express(message_id) on delete cascade,
  person_id text not null,
  angekommen_am timestamptz,
  gelesen_am timestamptz,
  primary key (message_id, person_id)
);
alter table public.kc_club_express_zustellung enable row level security;
revoke all on public.kc_club_express_zustellung from anon, authenticated;
grant select, insert, update, delete on public.kc_club_express_zustellung to service_role;
