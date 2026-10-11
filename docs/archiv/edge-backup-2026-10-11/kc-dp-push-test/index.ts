import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'Content-Type':'application/json'}});
const sha256=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,'0')).join('');
Deno.serve(async(req)=>{
 if(req.method!=='POST') return json({error:'POST required'},405);
 const url=Deno.env.get('SUPABASE_URL')!, service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const admin=createClient(url,service); let body:any={}; try{body=await req.json();}catch{return json({error:'invalid json'},400)}
 const {data:key}=await admin.from('kc_dp_cron_auth').select('secret_hash').eq('id','nightly_push').maybeSingle();
 if(!key || await sha256(String(body.cronSecret||''))!==key.secret_hash) return json({error:'forbidden'},403);
 let pub=Deno.env.get('KC_DP_VAPID_PUBLIC_KEY')||'', priv=Deno.env.get('KC_DP_VAPID_PRIVATE_KEY')||'', subject=Deno.env.get('KC_DP_VAPID_SUBJECT')||'mailto:admin@koecheclub-werne.de';
 if(!pub||!priv){const {data:r}=await admin.rpc('kc_dp_get_push_runtime_secrets'); if(r){pub=String(r.vapidPublicKey||'');priv=String(r.vapidPrivateKey||'');subject=String(r.vapidSubject||subject)}}
 if(!pub||!priv)return json({error:'VAPID missing'},503); webpush.setVapidDetails(subject,pub,priv);
 const personId=String(body.personId||''); const {data:subs}=await admin.from('kc_dp_push_subscriptions').select('id,user_id,person_id,subscription').eq('org_id','KC_WERNE').eq('project_id','KC_DP').eq('person_id',personId).eq('active',true);
 const notificationId=`TEST-${Date.now()}`; const message={title:'KC DP2 – Push-Test',body:'Test der gehärteten Push-Zustellung. Bitte antippen, wenn diese Meldung sichtbar ist.',data:{notificationId,route:'personal_plan',test:true}}; let sent=0,failed=0;
 for(const sub of subs||[]){await admin.from('kc_dp_push_deliveries').upsert({org_id:'KC_WERNE',project_id:'KC_DP',notification_id:notificationId,subscription_id:sub.id,user_id:sub.user_id,person_id:sub.person_id,title:message.title,status:'queued',delivery_meta:{urgency:'high',ttlSeconds:21600,test:true}},{onConflict:'notification_id,subscription_id'}); try{await webpush.sendNotification(sub.subscription,JSON.stringify(message),{TTL:21600,urgency:'high'});sent++;await admin.from('kc_dp_push_deliveries').update({status:'sent',sent_at:new Date().toISOString()}).eq('notification_id',notificationId).eq('subscription_id',sub.id)}catch(e){failed++;await admin.from('kc_dp_push_deliveries').update({status:'failed',failed_at:new Date().toISOString(),error_code:String((e as any).statusCode||'push_error')}).eq('notification_id',notificationId).eq('subscription_id',sub.id)}}
 return json({ok:true,notificationId,sent,failed,urgency:'high',ttlSeconds:21600});
});