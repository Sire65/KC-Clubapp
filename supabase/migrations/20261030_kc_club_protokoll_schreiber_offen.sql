-- KC-CLUB-PROTOKOLL-SCHREIBER-OFFEN (Wunsch Hansi 30.10.2026 kurz vor der Sitzung: „wenn das Protokoll geöffnet wird, steht da, dass ich es schreibe –
-- das steht aber nicht fest; da muss ‚wird noch geklärt‘ hin bzw. die Zeile erst mal leer lassen“).
-- verfasser bleibt wie bisher (Rechte: wer bearbeitet); verfasser_offen = true → die App zeigt „— wird noch geklärt —“, Ansicht/Druck lassen die Zeile leer,
-- bis jemand ausdrücklich gewählt wird. Neue Protokolle starten offen. Veröffentlichen geht erst, wenn feststeht, wer geschrieben hat.
-- Keine neue Tabelle → keine neuen Rechte. Rückweg: alter table public.kc_club_sitzungsprotokolle drop column verfasser_offen;
alter table public.kc_club_sitzungsprotokolle add column if not exists verfasser_offen boolean not null default false;
-- heutige (und künftige, schon angelegte) Entwürfe: Schreiber steht noch nicht fest
update public.kc_club_sitzungsprotokolle set verfasser_offen = true where status = 'entwurf' and datum >= '2026-10-30' and verfasser_offen = false;
