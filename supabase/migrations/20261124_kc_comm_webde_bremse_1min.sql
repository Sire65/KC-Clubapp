-- KC-COMM-BREMSE-CLUBPOSTFACH (24.11.2026, Freigabe Hansi „ja stell das so ein“):
-- Das Club-Postfach koecheclub-werne@web.de lehnte am 24.11. schon die 4. Mail innerhalb einer Minute ab (450 „Try again later“) –
-- 4 von 7 Mails einer Nachricht gingen dadurch über Brevo (Spam-Gefahr). Bremse für web.de jetzt 1 Mail je Minute, 20 je Stunde
-- (vorher 3/Min., 20/Std.). Nur Einstellung, kein Programmcode. Bereits direkt in der Datenbank gesetzt; diese Datei hält es fest
-- und kann gefahrlos noch einmal laufen. Rückweg: bremseProMinute wieder auf 3.
update public.kc_communication_providers
   set public_config = public_config || jsonb_build_object(
         'bremseProMinute', 1,
         'bremseProStunde', 20,
         'bremseGrund3', 'KC-COMM-BREMSE-CLUBPOSTFACH 24.11.2026: Club-Postfach lehnte die 4. Mail in 1 Min. ab (450) – jetzt 1/Min., 20/Std.',
         'bremseVorher', '3/Min., 20/Std.'),
       updated_at = now()
 where id = 'email-webde';
