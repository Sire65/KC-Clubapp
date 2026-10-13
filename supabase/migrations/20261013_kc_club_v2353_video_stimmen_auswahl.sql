-- KC Club-App – Version 2.353.0 (Wunsch Hansi „Thorsten und Dii, die anderen schrecklichen weg“)
-- Download-Stimmen: Kerstin, Eva, Ramona, Karlsson abgeschaltet (Zeilen bleiben, aktiv = false); Dii (Frau, OpenVoiceOS, CC BY-NC-ND 4.0) neu.
update public.kc_club_video_stimmen set aktiv = false, geaendert_am = now()
  where art = 'download' and datei in ('de_DE-kerstin-low', 'de_DE-eva_k-x_low', 'de_DE-ramona-low', 'de_DE-karlsson-low');
update public.kc_club_video_stimmen set text = 'Männerstimme, klar und natürlich', geaendert_am = now() where art = 'download' and datei = 'de_DE-thorsten-medium';
insert into public.kc_club_video_stimmen (plattform, art, datei, groesse_mb, name, geschlecht, guete, tempo, hoehe, text, reihenfolge)
  select 'alle', 'download', 'de_DE-dii-medium', 63, 'Dii', 'w', 3, 1, 1, 'Frauenstimme, freundlich und klar', 2
  where not exists (select 1 from public.kc_club_video_stimmen where datei = 'de_DE-dii-medium');
