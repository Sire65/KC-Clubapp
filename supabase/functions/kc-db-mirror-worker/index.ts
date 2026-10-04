import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.5";

const jsonHeaders={"Content-Type":"application/json"};
const fail=(s:number,e:string)=>new Response(JSON.stringify({error:e}),{status:s,headers:jsonHeaders});
const qi=(n:string)=>{if(!/^[a-z0-9_]+$/.test(n))throw new Error(`unsafe identifier: ${n}`);return `"${n}"`;};
const personRefTables=new Set(["kc_core_club_memberships","kc_core_operational_directory","kc_core_pos_aliases","kc_core_app_access","kc_core_user_links","kc_dp_daily_push_preview"]);
const userRefTables=new Set(["kc_core_user_links","kc_dp_memberships","kc_manager_memberships"]);
const redactedTables=new Set(["kc_core_people","kc_dp_memberships","kc_manager_memberships","kc_dp_pilot_testers","kc_dp_push_deliveries","kng_keys","kng_key_assignments","kng_key_movements"]);
const stableHashTables=new Set(["kc_communication_templates","kc_dp_entity_versions","kc_manager_serving_materials","kc_manager_recipe_serving_materials"]);

Deno.serve(async(req)=>{
  if(req.method!=="POST")return fail(405,"POST required");
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
  const tok=req.headers.get("x-kc-mirror-token")??"";
  const {data:expectedToken,error:te}=await sb.rpc("kc_db_mirror_worker_token");
  let body:any; try{body=await req.json()}catch{return fail(400,"invalid JSON body")}
  // KC-CORE-SPIEGEL-EXTERN (04.10.2026, Freigabe Hansi): Wächter von außen (GitHub-Zeitplan, ohne Schlüssel).
  // Entscheidet allein die Datenbank (kc_db_mirror_extern_plan: Wartung, letzter Lauf älter als 390 Min., Sperre 60 Min.).
  // Nur dann werden die Pakete direkt an diesen Arbeiter geschickt – ohne pg_net. Antwort enthält nie den Schlüssel.
  if(body?.aktion==="extern_pruefen"){
    const {data:plan,error:pe}=await sb.rpc("kc_db_mirror_extern_plan");
    if(pe||!plan)return fail(503,"mirror plan unavailable");
    if(plan.status!=="angestossen")return new Response(JSON.stringify({ok:true,status:plan.status,letzter_lauf:plan.letzter_lauf??null}),{status:200,headers:jsonHeaders});
    if(te||!expectedToken)return fail(503,"mirror worker token unavailable");
    const ziel=`${Deno.env.get("SUPABASE_URL")}/functions/v1/kc-db-mirror-worker`;
    const pakete:string[][]=Array.isArray(plan.pakete)?plan.pakete:[];
    const auftraege=pakete.map(p=>fetch(ziel,{method:"POST",headers:{...jsonHeaders,"x-kc-mirror-token":String(expectedToken)},body:JSON.stringify({tables:p})}).then(r=>r.status).catch(()=>0));
    EdgeRuntime.waitUntil(Promise.allSettled(auftraege));
    return new Response(JSON.stringify({ok:true,status:"angestossen",letzter_lauf:plan.letzter_lauf??null,tabellen:plan.tabellen,pakete:pakete.length}),{status:202,headers:jsonHeaders});
  }
  if(te||!expectedToken||tok.length<32||tok!==expectedToken)return fail(401,"mirror worker authentication failed");
  const requested=[...new Set<string>(Array.isArray(body.tables)?body.tables:[])];
  if(!requested.length||requested.length>48)return fail(400,"tables must contain 1..48 names");
  for(const t of requested) if(!/^[a-z0-9_]+$/.test(t)) return fail(400,`invalid table name: ${t}`);
  const {data:conn,error:ce}=await sb.rpc("kc_db_mirror_neon_connection");
  if(ce||!conn)return fail(500,"mirror target unavailable");
  let neon:any=null;
  const getNeon=()=>neon??=postgres(conn as string,{max:1,prepare:false,connect_timeout:15,idle_timeout:20,ssl:{rejectUnauthorized:true}});
  const results:any[]=[]; let prs=false,urs=false;
  const batchId=crypto.randomUUID(); const batchTotal=requested.length;
  const syncP=async()=>{const {data,error}=await sb.from("kc_core_people").select("org_id,person_id,active,updated_at");if(error)throw new Error("person refs unavailable");for(const r of data??[])await getNeon().unsafe('insert into public.kc_mirror_person_refs(org_id,person_id,active,source_updated_at,mirrored_at) values ($1,$2,$3,$4::timestamptz,now()) on conflict (org_id,person_id) do update set active=excluded.active,source_updated_at=excluded.source_updated_at,mirrored_at=now()',[r.org_id,r.person_id,r.active,r.updated_at]);};
  const syncU=async()=>{for(const s of ["kc_core_user_links","kc_dp_memberships","kc_manager_memberships"]){const {data,error}=await sb.from(s).select("org_id,user_id,active");if(error)throw new Error("user refs unavailable");for(const r of data??[])await getNeon().unsafe('insert into public.kc_mirror_user_refs(org_id,user_id,active,mirrored_at) values ($1,$2::uuid,$3,now()) on conflict (org_id,user_id) do update set active=excluded.active,mirrored_at=now()',[r.org_id,r.user_id,r.active]);}};
  // KC-SPIEGEL-AUTO (01.10.2026, Freigabe Hansi): fehlende Neon-Tabelle bzw. fehlende Spalten vor dem Kopieren anlegen –
  // nur additiv (nie löschen, nie Typ ändern). Abweichende Typen werden nur gemeldet (metrics.schema_sync.type_mismatch).
  // Spalten und Typen liefert Supabase (kc_db_mirror_spalten, Reihenfolge wie dort → gleicher Prüf-Hash).
  const typSicher=(t:string)=>/^[a-z0-9 _(),\[\]"]+$/i.test(t)&&!/--|;/.test(t);
  const schemaAbgleich=async(table:string)=>{
    const {data:spalten,error}=await sb.rpc("kc_db_mirror_spalten",{p_table_name:table});
    if(error||!Array.isArray(spalten)||!spalten.length)throw new Error("source columns unavailable");
    for(const s of spalten){qi(String(s.name));if(!typSicher(String(s.type)))throw new Error(`unsafe column type: ${s.type}`)}
    const ziel=await getNeon().unsafe(`select a.attname as name, format_type(a.atttypid,a.atttypmod) as type from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=$1 and a.attnum>0 and not a.attisdropped order by a.attnum`,[table]);
    // Datenschutz-Tabellen mit fester Spaltenliste in kc_db_mirror_snapshot (redactedTables): neue Spalten dort nur melden –
    // der Snapshot liefert sie nicht, eine ergänzte Neon-Spalte würde die Prüfsumme brechen.
    const q=`"public".${qi(table)}`,neu:string[]=[],abweichend:string[]=[],fehlend:string[]=[];let angelegt=false;
    if(!ziel.length){await getNeon().unsafe(`create table if not exists ${q} (${spalten.map((s:any)=>`${qi(s.name)} ${s.type}`).join(", ")})`);angelegt=true}
    else{const vorhanden=new Map(ziel.map((z:any)=>[String(z.name),String(z.type)]));for(const s of spalten){if(!vorhanden.has(s.name)){if(redactedTables.has(table)){fehlend.push(s.name);continue}await getNeon().unsafe(`alter table ${q} add column if not exists ${qi(s.name)} ${s.type}`);neu.push(s.name)}else if(vorhanden.get(s.name)!==s.type)abweichend.push(`${s.name}: ${vorhanden.get(s.name)} ≠ ${s.type}`)}}
    if(angelegt||neu.length)await sb.from("kc_db_mirror_audit").insert({severity:"info",action:"mirror_schema_auto",detail:angelegt?`Neon-Tabelle ${table} automatisch angelegt (${spalten.length} Spalten)`:`Neon-Tabelle ${table}: Spalten ergänzt (${neu.join(", ")})`,metadata:{table,created:angelegt,columns_added:neu,batch_id:batchId}});
    return {created:angelegt,columns_added:neu,type_mismatch:abweichend,not_added_privacy:fehlend};
  };
  try{
    for(let i=0;i<requested.length;i++){
      const table=requested[i];
      const startMs=Date.now(),started=new Date(startMs).toISOString();
      const {data:snap,error:se}=await sb.rpc("kc_db_mirror_snapshot",{p_table_name:table});if(se||!snap){results.push({table,status:"error",stage:"source_snapshot"});continue}
      const sc=String(snap.row_count??"0"),payload=String(snap.payload_text??"[]");let sh=String(snap.content_hash??"");
      if(stableHashTables.has(table)){const {data:stableHash,error:stableErr}=await sb.rpc("kc_db_mirror_stable_hash",{p_table_name:table});if(stableErr||!stableHash){results.push({table,status:"error",stage:"source_stable_hash"});continue}sh=String(stableHash)}
      const hashMode=stableHashTables.has(table)?"stable_row_hash_v1":"legacy_row_json_v1";
      const {data:lastOk,error:lastErr}=await sb.from("kc_db_mirror_runs").select("source_rows,metrics,finished_at").eq("run_type","snapshot").eq("status","ok").eq("metrics->>table",table).order("started_at",{ascending:false}).limit(1).maybeSingle();
      const {data:lastVerified,error:lastVerifiedErr}=await sb.from("kc_db_mirror_runs").select("finished_at,metrics").eq("run_type","snapshot").eq("status","ok").eq("metrics->>table",table).not("metrics->>target_hash","is",null).order("started_at",{ascending:false}).limit(1).maybeSingle();
      const verifiedAt=lastVerified?.finished_at?Date.parse(String(lastVerified.finished_at)):NaN;
      const verifyIntervalHours=Math.max(1,Number(Deno.env.get("KC_MIRROR_VERIFY_INTERVAL_HOURS")||"24"));
      const verificationFresh=!lastVerifiedErr&&Number.isFinite(verifiedAt)&&(Date.now()-verifiedAt)<verifyIntervalHours*60*60*1000;
      const unchanged=!lastErr&&lastOk&&String(lastOk.source_rows??"")===sc&&String((lastOk.metrics as any)?.source_hash??"")===sh&&String((lastOk.metrics as any)?.hash_mode??"")===hashMode;
      if(unchanged&&verificationFresh){
        const skipMetrics={table,batch_id:batchId,batch_index:i+1,batch_total:batchTotal,source_hash:sh,hash_mode:hashMode,transfer_mode:"unchanged_source_skip",target_verified:false,last_target_verified_at:lastVerified.finished_at,verify_interval_hours:verifyIntervalHours};
        const {error:skipErr}=await sb.from("kc_db_mirror_runs").insert({run_type:"snapshot",status:"ok",started_at:started,finished_at:new Date().toISOString(),source_rows:Number(sc),target_rows:Number(lastOk.source_rows??sc),mismatch_count:0,message:`${table}: source unchanged; target verification still fresh`,metrics:skipMetrics});
        if(skipErr){results.push({table,status:"error",stage:"skip_audit",message:"unchanged run could not be persisted"});continue}
        results.push({table,status:"skipped",reason:"source_unchanged",source_rows:sc,source_hash:sh,last_verified_at:lastVerified.finished_at,batch_id:batchId,batch_index:i+1,batch_total:batchTotal});
        continue;
      }
      if(personRefTables.has(table)&&!prs){await syncP();prs=true}if(userRefTables.has(table)&&!urs){await syncU();urs=true}
      const bytes=new TextEncoder().encode(payload).byteLength,q=`"public".${qi(table)}`;
      const runningMetrics={table,batch_id:batchId,batch_index:i+1,batch_total:batchTotal,payload_bytes:bytes,privacy_redacted:redactedTables.has(table),write_mode:table==="kc_core_organizations"?"upsert":"replace",hash_mode:hashMode};
      const {data:runRow,error:runErr}=await sb.from("kc_db_mirror_runs").insert({run_type:"snapshot",status:"running",started_at:started,source_rows:Number(sc),mismatch_count:0,message:`${table}: transfer running`,metrics:runningMetrics}).select("id").single();const runId=runErr?null:runRow?.id;
      try{
        const schema=await schemaAbgleich(table);if(schema.created||schema.columns_added.length||schema.type_mismatch.length||schema.not_added_privacy.length)(runningMetrics as any).schema_sync=schema;
        await getNeon().begin(async tx=>{if(table==="kc_core_organizations"){if(sc!=="0")await tx.unsafe(`insert into ${q}(org_id,name,active,created_at,updated_at) select x.org_id,x.name,x.active,x.created_at,x.updated_at from jsonb_populate_recordset(null::${q},(($1::jsonb #>> '{}')::jsonb)) x on conflict(org_id) do update set name=excluded.name,active=excluded.active,created_at=excluded.created_at,updated_at=excluded.updated_at`,[payload])}else{await tx.unsafe(`delete from ${q}`);if(sc!=="0")await tx.unsafe(`insert into ${q} overriding system value select x.* from jsonb_populate_recordset(null::${q},(($1::jsonb #>> '{}')::jsonb)) x`,[payload])}});
        const verifySql=stableHashTables.has(table)?`select count(*)::bigint row_count,md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' order by md5(to_jsonb(t)::text) collate "C"),'')) content_hash from ${q} t`:`select count(*)::bigint row_count,md5(coalesce(string_agg(row_to_json(t)::text,'' order by row_to_json(t)::text),'')) content_hash from ${q} t`;
        const v=await getNeon().unsafe(verifySql);const tc=String(v[0]?.row_count??"0"),th=String(v[0]?.content_hash??""),ok=sc===tc&&sh===th,endMs=Date.now(),durationMs=Math.max(1,endMs-startMs),bps=Math.round(bytes/(durationMs/1000));
        const metrics={...runningMetrics,source_hash:sh,target_hash:th,duration_ms:durationMs,bytes_per_second:bps,kilobytes_per_second:Number((bps/1024).toFixed(2)),megabytes_per_second:Number((bps/1048576).toFixed(4))};
        const finalRow={status:ok?"ok":"warning",finished_at:new Date(endMs).toISOString(),target_rows:Number(tc),mismatch_count:ok?0:1,message:ok?`${table}: source and target identical`:`${table}: verification mismatch`,metrics};
        if(runId)await sb.from("kc_db_mirror_runs").update(finalRow).eq("id",runId);else await sb.from("kc_db_mirror_runs").insert({run_type:"snapshot",started_at:started,source_rows:Number(sc),...finalRow});if(ok&&bytes>0){const {error:flowErr}=await sb.rpc("kicc_report_program_flow",{p_program_id:"kc-db-mirror-worker",p_instance_id:batchId,p_source_id:"supabase-kc-core",p_target_id:"neon-mirror",p_flow_type:"mirror",p_event_count:1,p_byte_count:bytes,p_status:"OK",p_measured_at:new Date(endMs).toISOString()});if(flowErr)results.push({table,status:"warning",stage:"flow_telemetry",message:"mirror succeeded but flow telemetry failed",batch_id:batchId,batch_index:i+1,batch_total:batchTotal})}results.push({table,status:ok?"ok":"warning",source_rows:sc,target_rows:tc,hash_match:sh===th,payload_bytes:bytes,duration_ms:durationMs,bytes_per_second:bps,batch_id:batchId,batch_index:i+1,batch_total:batchTotal});
      }catch(e){const m=e instanceof Error?e.message:String(e),finalRow={status:"error",finished_at:new Date().toISOString(),mismatch_count:1,message:`${table}: mirror failed`,metrics:{...runningMetrics,error:m.slice(0,1000)}};if(runId)await sb.from("kc_db_mirror_runs").update(finalRow).eq("id",runId);else await sb.from("kc_db_mirror_runs").insert({run_type:"snapshot",started_at:started,source_rows:Number(sc),...finalRow});results.push({table,status:"error",stage:"target_write",message:m,batch_id:batchId,batch_index:i+1,batch_total:batchTotal})}
    }
    // KC-NEON-GROESSE (29.09.2026): Datenbankgröße messen, solange die Neon-Verbindung ohnehin offen ist – keine Extra-Rechenzeit.
    // Höchstens einmal je 30 Min. (parallele Pakete eines Laufs schreiben sonst mehrfach). Für die Admin-Zentrale der Club-App.
    if(neon){try{const {data:zuletzt}=await sb.from("kc_db_mirror_runs").select("started_at").eq("run_type","neon_groesse").gte("started_at",new Date(Date.now()-30*60000).toISOString()).limit(1).maybeSingle();
      if(!zuletzt){const g=await neon.unsafe("select pg_database_size(current_database())::bigint as b");const now=new Date().toISOString();
        await sb.from("kc_db_mirror_runs").insert({run_type:"neon_groesse",status:"ok",started_at:now,finished_at:now,source_rows:0,target_rows:0,mismatch_count:0,message:"Neon-Datenbankgröße gemessen",metrics:{bytes:Number(g[0]?.b??0),batch_id:batchId}})}}catch(e){console.error("neon_groesse",String(e))}}
  }finally{if(neon)await neon.end({timeout:5})}
  const failed=results.some(r=>r.status==="error");return new Response(JSON.stringify({ok:!failed,batch_id:batchId,batch_total:batchTotal,results}),{status:failed?500:200,headers:jsonHeaders});
});
