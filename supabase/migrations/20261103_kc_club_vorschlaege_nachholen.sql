-- 2.833.0 KC-CLUB-VORSCHLAG-BEHANDELT nachholen (Wunsch #76 Hansi, „Ja, 1, 2 und 3 bauen“): Das Protokoll vom 30.10. wurde am 01.11. veröffentlicht,
-- die Automatik (2.802.0, vorschlaegeBehandelt) gab es erst ab 02.11. Gleiche Regel wie dort: Themen-Vorschläge, die als TOP auf der Büro-Tagesordnung
-- einer Sitzung mit veröffentlichtem Protokoll standen und nicht vertagt sind → abgeschlossen, behandelt_in = Protokoll. Einmalig (idempotent: nur „offen“).
-- Rückweg: update kc_club_vorschlaege set status = 'offen', abgeschlossen_am = null, abgeschlossen_von = null, behandelt_in = null
--          where behandelt_in = '6ef28b5b-59ff-4830-a0a0-61bec4c3808f' and abgeschlossen_von = 'KC-P-002';
with pr as (select id, treffen_id, coalesce(vertagt, '{}') vertagt, veroeffentlicht_am from kc_club_sitzungsprotokolle where status = 'veroeffentlicht' and treffen_id is not null),
 tops as (select pr.id prot, pr.veroeffentlicht_am, x->>'id' vid, x->>'t' t, pr.vertagt from pr join kc_club_buero_sitzung b on b.treffen_id = pr.treffen_id,
          jsonb_array_elements(to_jsonb(b.tagesordnung)) x where x->>'art' = 'vorschlag' and x->>'id' is not null)
update kc_club_vorschlaege v set status = 'abgeschlossen', abgeschlossen_am = tops.veroeffentlicht_am, abgeschlossen_von = 'KC-P-002', behandelt_in = tops.prot
  from tops where v.id::text = tops.vid and v.art = 'thema' and v.status = 'offen'
   and not exists (select 1 from unnest(tops.vertagt) vt where lower(trim(vt)) = lower(trim(tops.t)) or lower(trim(vt)) like lower(trim(tops.t)) || '%');
