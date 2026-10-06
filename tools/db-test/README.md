# Datenbank-Tests KC-CORE-PERSON-UEBERNAHME (lokal, ohne Echtdaten)

Prüft `supabase/migrations/20261006_kc_core_person_uebernahme_v1.sql` auf einem lokalen PostgreSQL (16+).

```
createdb t1
psql -d t1 -f tools/db-test/00_supabase_nachbau.sql      # Nachbau der benötigten Supabase-Strukturen, keine Daten
psql -d t1 -f supabase/migrations/20261006_kc_core_person_uebernahme_v1.sql
psql -d t1 -f tools/db-test/10_person_uebernahme_faelle.sql   # 30 Fälle, Ausgabe „Name → Ergebnis“
```

`20_supabase_rollback_test.sql` läuft vor dem Einspielen in Supabase **nach** der Migration in derselben Transaktion
(`begin; <Migration>; <Test>`) und endet mit `raise exception 'TESTBERICHT …'` – dadurch wird alles zurückgerollt.
Testperson `KC-P-ZZTEST1`, keine Echtdaten.
