-- KC-CLUB-PINNWAND-FARBEN (0.60.0): bis zu 4 Zettel je Person, jeder mit fester Farbe wie echte Post-its:
-- 1 gelb · 2 rosé · 3 hellgrün · 4 hellblau. Der Platz bleibt, wenn ein anderer Zettel abgenommen wird (kein Nachrücken);
-- ein neuer Zettel bekommt die kleinste freie Farbe. Eindeutig je Person unter den hängenden Zetteln (schützt gegen Doppelvergabe).
alter table public.kc_club_pinnwand add column if not exists farbe smallint;
alter table public.kc_club_pinnwand drop constraint if exists kc_club_pinnwand_farbe_check;
alter table public.kc_club_pinnwand add constraint kc_club_pinnwand_farbe_check check (farbe between 1 and 4);
-- vorhandene hängende Zettel: je Person in Reihenfolge des Anheftens
update public.kc_club_pinnwand p set farbe = x.n
  from (select id, row_number() over (partition by person_id order by erstellt_am, id) n from public.kc_club_pinnwand where entfernt_am is null) x
 where p.id = x.id and p.farbe is null and x.n <= 4;
create unique index if not exists kc_club_pinnwand_farbe_frei on public.kc_club_pinnwand (person_id, farbe) where entfernt_am is null;
