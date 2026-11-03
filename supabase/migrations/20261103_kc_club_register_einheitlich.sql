-- KC-CLUB-REGISTER-EINHEITLICH (03.11.2026, Wunsch Hansi „alles soll gleich sein“)
-- 1. Alte Registernamen in Vereinsordnern → einheitliche Namen (gleiche Liste wie REGISTER_EINHEITLICH im Club-Server und
--    AR_REG_EINHEITLICH in der App). Ordner-Register und Dokumente werden gemeinsam umbenannt, nichts wird gelöscht.
--    Auch „Jahr › Unterregister“ (nur der Teil hinter dem letzten „ › “). Persönliche Ordner fasst die Migration nicht an –
--    dort vereinheitlicht der Server beim nächsten Speichern durch den Besitzer.
-- 2. Alter Ordner „Mitglieder <Jahr>“ (vor 2.22.19 der Name von „Personal“): Dokumente wandern in „Personal <Jahr>“
--    (Kennung personal), der leere alte Ordner kommt in den Papierkorb (30 Tage wiederherstellbar).
-- Nur Namen/Zuordnung – es werden keine Inhalte gelesen. Rückweg: Namen im Büro zurück umbenennen bzw. Ordner aus dem Papierkorb holen.
create or replace function pg_temp.reg_einheitlich(r text) returns text language sql immutable as $f$
  with m(alt, neu) as (values ('Allgemein', 'Sonstiges'), ('Einladung', 'Einladungen'), ('Protokoll', 'Protokolle'),
         ('Sitzungsprotokolle', 'Protokolle'), ('Kassenbericht', 'Kassenberichte'), ('Kassenprüfung', 'Kassenprüfungen')),
  t as (select case when position(' › ' in r) > 0 then substring(r from '^(.* › )') else '' end as kopf,
               case when position(' › ' in r) > 0 then substring(r from '^.* › (.*)$') else r end as rest)
  select coalesce((select t.kopf || m.neu from t join m on m.alt = t.rest), r)
$f$;

-- Dokumente zuerst (sie hängen am Namen), dann die Register-Listen der Ordner (Reihenfolge bleibt, Doppelte fallen weg)
update public.kc_club_archiv_dokumente d set register = pg_temp.reg_einheitlich(d.register), geaendert_am = now()
  from public.kc_club_archiv_ordner o
 where o.id = d.ordner_id and o.besitzer is null and d.register is not null and pg_temp.reg_einheitlich(d.register) <> d.register;

update public.kc_club_archiv_ordner o
   set register = (select array_agg(n order by i) from (select n, min(i) as i from unnest(o.register) with ordinality as u(r, i)
                     cross join lateral (select pg_temp.reg_einheitlich(u.r) as n) x group by n) y),
       geaendert_am = now()
 where o.besitzer is null and exists (select 1 from unnest(o.register) r where pg_temp.reg_einheitlich(r) <> r);

-- „Mitglieder <Jahr>“ → „Personal <Jahr>“ (nur wenn es den Personal-Ordner desselben Jahres gibt)
do $m$
declare alt record; ziel uuid; regs text[];
begin
  for alt in select * from public.kc_club_archiv_ordner
              where besitzer is null and geloescht_am is null and titel = 'Mitglieder' and art = 'sonstiges' and kennung is null loop
    select id into ziel from public.kc_club_archiv_ordner
     where kennung = 'personal' and jahr = alt.jahr and geloescht_am is null limit 1;
    continue when ziel is null;
    select array_agg(distinct d.register) into regs from public.kc_club_archiv_dokumente d where d.ordner_id = alt.id and d.register is not null;
    update public.kc_club_archiv_ordner z set register = z.register || array(select r from unnest(coalesce(regs, '{}')) r where not r = any(z.register)),
           geaendert_am = now() where z.id = ziel;
    update public.kc_club_archiv_dokumente set ordner_id = ziel, geaendert_am = now() where ordner_id = alt.id;
    update public.kc_club_archiv_ordner set geloescht_am = now(), geloescht_von = alt.erstellt_von where id = alt.id;
  end loop;
end $m$;
