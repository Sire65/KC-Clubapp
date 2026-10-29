# KICC-F-110 Spiegel-Zeitblöcke – lokaler Test ohne Echtdaten: Datenbank „src“ spielt Supabase (Migrationen F-109 + F-110),
# „ziel“ spielt Neon; der Block-Abgleich des Spiegel-Arbeiters (supabase/functions/kc-db-mirror-worker) ist hier nachgebaut.
# Aufruf (lokales PostgreSQL 16+, Datenbanken src und ziel leer anlegen, Rolle service_role/anon/authenticated vorhanden):
#   PGHOST=… PGPORT=… python3 tools/db-test/90_spiegel_zeitbloecke_test.py      → endet mit „ERGEBNIS: GRÜN“
import subprocess, json, sys, os
MIG=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","..","supabase","migrations")+os.sep
def psql(db, sql, file=None):
    a=["psql","-U",os.environ.get("PGUSER","postgres"),"-d",db,"-v","ON_ERROR_STOP=1","-tA","-q"]
    a+= ["-f",file] if file else ["-c",sql]
    r=subprocess.run(a,capture_output=True,text=True)
    if r.returncode: print("FEHLER",db,(sql or file)[:200],r.stderr); sys.exit(1)
    return r.stdout.strip()
for db in ("src","ziel"):
    psql(db,"drop schema public cascade; create schema public;")
psql("src","""create extension if not exists pgcrypto;
create table kc_db_mirror_table_rules(table_name text primary key, mirror_enabled boolean, sensitivity text);
create table kc_db_mirror_redaction(table_name text, column_name text, muster text, ersatz text);""")
psql("src",None,MIG+"20261019_kicc_f109_spiegel_bloecke.sql")
psql("src",None,MIG+"20261029_kicc_f110_spiegel_zeitbloecke.sql")
ddl="""create table t_uuid(id uuid primary key, created_at timestamptz not null, status text, meta jsonb);
create table t_last(zeit timestamptz, quelle text, aufrufe bigint, ms bigint, primary key(quelle, zeit));
create table t_int(id bigint primary key, txt text);
create table t_none(id uuid primary key, x text, created_at timestamptz);
create table t_red(id uuid primary key, created_at timestamptz not null, x text);"""
psql("src",ddl); psql("ziel",ddl)
psql("src","""insert into kc_db_mirror_table_rules select t,true,'normal' from unnest(array['t_uuid','t_last','t_int','t_none','t_red']) t;
insert into kc_db_mirror_redaction values ('t_red','created_at',null,null);
insert into t_uuid select gen_random_uuid(), now() - (g||' hours')::interval, 'sent', jsonb_build_object('n',g,'t','Grüße ä') from generate_series(1,400) g;
insert into t_uuid select gen_random_uuid(), date_trunc('day',now()) - interval '3 days', 'gleich', '{}' from generate_series(1,5);
insert into t_last select now() - (g*30||' minutes')::interval, q, g, g*2 from generate_series(1,500) g, unnest(array['api','db']) q;
insert into t_int select g, 'x'||g from generate_series(1,3000) g;
insert into t_none select gen_random_uuid(), 'n', now() from generate_series(1,10);
insert into t_red select gen_random_uuid(), now(), 'r' from generate_series(1,10);""")
for t in ("t_uuid","t_last","t_int","t_none","t_red"):
    rows=psql("src",f"select coalesce(jsonb_agg(to_jsonb(zz)),'[]')::text from {t} zz")
    psql("ziel",f"insert into {t} select * from jsonb_populate_recordset(null::{t}, $${rows}$$::jsonb)")
def bh(t): r=psql("src",f"select public.kc_db_mirror_block_hashes('{t}',500)"); return json.loads(r) if r else None
def qi(s): return '"'+s.replace('"','""')+'"'
def abgleich(t):
    b=bh(t)
    if not b or not (b.get("pk") or b.get("zeit")): return ("ganz",None)
    w=int(b["width"]); sp=qi(b.get("pk") or b["zeit"])
    blk=f"({sp}/{w})::bigint" if b.get("pk") else f"floor(extract(epoch from {sp})/{w})::bigint"
    ord_=sp if b.get("pk") else f'{sp}, row_to_json(t)::text collate "C"'
    z=psql("ziel",f"select coalesce(json_agg(json_build_array(b,n,h)),'[]') from (select {blk}::text b,count(*)::bigint::text n,md5(string_agg(row_to_json(t)::text,'' order by {ord_})) h from public.{qi(t)} t group by 1) x")
    zm={x[0]:f"{x[1]}|{x[2]}" for x in json.loads(z)}
    quelle=set(); anders=[]
    for bb,n,h in b["blocks"]:
        k=str(bb); quelle.add(k)
        if zm.get(k)!=f"{n}|{h}": anders.append(k)
    for k in zm:
        if k not in quelle: anders.append(k)
    if anders:
        rows=json.loads(psql("src",f"select public.kc_db_mirror_block_rows('{t}',{w},array[{','.join(anders)}]::bigint[])"))
        psql("ziel",f"begin; delete from public.{qi(t)} where {blk} = any(array[{','.join(anders)}]::bigint[]); insert into public.{qi(t)} select x.* from jsonb_populate_recordset(null::public.{qi(t)}, $${rows['payload_text']}$$::jsonb) x; commit;")
    return (("zeit" if b.get("zeit") else "schluessel"), (len(anders), len(b["blocks"])))
def gleich(t):
    h=lambda db: psql(db,f"select count(*)||':'||md5(coalesce(string_agg(row_to_json(t)::text,'' order by row_to_json(t)::text collate \"C\"),'')) from {t} t")
    return h("src")==h("ziel")
ok=True
def pruef(name, cond):
    global ok; print(("OK   " if cond else "ROT  ")+name); ok&=bool(cond)
# 1. unverändert: kein Block anders
for t,modus in (("t_uuid","zeit"),("t_last","zeit"),("t_int","schluessel")):
    m,(n,ges)=abgleich(t); pruef(f"{t}: Modus {m}, unverändert 0 von {ges} Blöcken",m==modus and n==0 and gleich(t))
pruef("t_none (uuid ohne NOT-NULL-Zeit): ganze Tabelle", abgleich("t_none")[0]=="ganz")
pruef("t_red (Zeitspalte geschwärzt): ganze Tabelle", abgleich("t_red")[0]=="ganz")
# 2. Änderungen: neue Zeilen heute, Status-Änderung, Löschen alter Tag
psql("src","""insert into t_uuid select gen_random_uuid(), now(), 'neu', '{}' from generate_series(1,7);
update t_uuid set status='geaendert' where id=(select id from t_uuid where status='gleich' limit 1);
delete from t_last where zeit < now() - interval '9 days';
insert into t_last values (now(),'api',1,1),(now(),'db',2,2);
update t_int set txt='neu' where id=42; insert into t_int values (3001,'z');""")
for t in ("t_uuid","t_last","t_int"):
    m,(n,ges)=abgleich(t); pruef(f"{t}: nach Änderung {n} von {ges} Blöcken übertragen, danach identisch", 0<n<=3 and gleich(t))
    m,(n,ges)=abgleich(t); pruef(f"{t}: zweiter Lauf 0 Blöcke", n==0)
# 3. Gleiche Zeit, mehrere Zeilen: Reihenfolge stabil
pruef("t_uuid: 5 Zeilen mit gleicher Zeit – Prüfsumme gleich", gleich("t_uuid"))
print("ERGEBNIS:", "GRÜN" if ok else "ROT"); sys.exit(0 if ok else 1)
