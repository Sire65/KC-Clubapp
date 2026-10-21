-- KC-COMM-WARTEN, Nachschärfung (20.10.2026, Freigabe Hansi „Ja“): Erster Echtbetrieb der Warteschlange 10:01–10:12 Uhr – 3 Rundnachrichten,
-- web.de nahm 26 Mails in 9 Minuten an (je Minute höchstens 5) und lehnte ab 10:10 Uhr ab; Brevo übernahm die übrigen 14, alle kamen an.
-- web.de hat also zusätzlich eine Grenze von etwa 25 Mails in 10 Minuten. Neue Bremse: höchstens 3 je Minute und 20 je Stunde
-- (Rundmail an 16 Leute ≈ 5 Minuten, komplett über web.de; mehr in einer Stunde → nach 15 Min. Wartezeit Brevo).
update public.kc_communication_providers
   set public_config = public_config || jsonb_build_object('bremseProMinute', 3, 'bremseProStunde', 20,
         'bremseGrund2', 'KC-COMM-WARTEN 20.10.: web.de lehnte nach 26 Mails in 9 Min. ab (5/Min. zu viel) – jetzt 3/Min., 20/Std.'),
       updated_at = now()
 where id = 'email-webde';
