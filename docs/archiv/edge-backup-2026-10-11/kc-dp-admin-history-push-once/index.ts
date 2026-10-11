import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const dlab=(v:string)=>({handy:'Handy',tablet:'Tablet',pc:'PC',unknown:'Gerät'} as Record<string,string>)[v]||'Gerät';
const plab=(v:string)=>({ios:'iOS',android:'Android',windows:'Windows',macos:'macOS',linux:'Linux',unknown:'unbekannt'} as Record<string,string>)[v]||v||'unbekannt';
Deno.serve(async(req)=>{
 if(req.method!=='POST')return json({error:'POST required'},405);
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const gateId='admin_history_push_once_20260819';
 const {data:gate}=await admin.from('kc_dp_cron_auth').select('id').eq('id',gateId).maybeSingle();
 if(!gate)return json({error:'one-time authorization unavailable'},403);
 await admin.from('kc_dp_cron_auth').delete().eq('id',gateId);
 const {data:rows,error:rowsErr}=await admin.from('kc_dp_installations').select('display_name,device_type,platform,app_version,installed_at,completed_at,status').eq('source','pilot').eq('status','completed').in('display_name',['Kathi','Birg','San']).order('completed_at',{ascending:true});
 if(rowsErr||!rows?.length)return json({error:'history unavailable'},503);
 const nameMap=(n:string)=>n==='Birg'?'Birgit':n;
 const parts=rows.map((r:any)=>`${nameMap(String(r.display_name||''))}: ${dlab(String(r.device_type||'unknown'))}/${plab(String(r.platform||'unknown'))}`);
 const bodyText=`Bisherige erfolgreiche Installationen: ${parts.join(' · ')}`;
 const {data:subs}=await admin.from('kc_dp_push_subscriptions').select('id,user_id,person_id,subscription').eq('org_id','KC_WERNE').eq('project_id','KC_DP').eq('person_id','KC-P-002').eq('active',true);
 if(!subs?.length)return json({error:'no active admin endpoint'},409);
 let pub=Deno.env.get('KC_DP_VAPID_PUBLIC_KEY')||'',priv=Deno.env.get('KC_DP_VAPID_PRIVATE_KEY')||'',subject=Deno.env.get('KC_DP_VAPID_SUBJECT')||'mailto:admin@koecheclub-werne.de';
 if(!pub||!priv){const {data:r}=await admin.rpc('kc_dp_get_push_runtime_secrets');if(r){pub=String(r.vapidPublicKey||'');priv=String(r.vapidPrivateKey||'');subject=String(r.vapidSubject||subject)}}
 if(!pub||!priv)return json({error:'VAPID missing'},503);
 webpush.setVapidDetails(subject,pub,priv);
 const notificationId=`ADMIN-HISTORY-${Date.now()}`;
 const message={title:'🟢 KC DP2 – Installationsübersicht',body:bodyText,data:{notificationId,route:'installation_history',test:true,type:'admin_history_test'}};
 let sent=0,failed=0;
 for(const sub of subs){
  try{await webpush.sendNotification(sub.subscription,JSON.stringify(message),{TTL:21600,urgency:'high'});sent++;await admin.from('kc_dp_push_deliveries').insert({org_id:'KC_WERNE',project_id:'KC_DP',notification_id:notificationId,subscription_id:sub.id,user_id:sub.user_id,person_id:sub.person_id,status:'sent',title:message.title,sent_at:new Date().toISOString(),delivery_meta:{test:true,type:'admin_history_test',rows:rows.length}})}
  catch(e){failed++;await admin.from('kc_dp_push_deliveries').insert({org_id:'KC_WERNE',project_id:'KC_DP',notification_id:notificationId,subscription_id:sub.id,user_id:sub.user_id,person_id:sub.person_id,status:'failed',title:message.title,error_code:String((e as any).statusCode||'push_error'),failed_at:new Date().toISOString(),delivery_meta:{test:true,type:'admin_history_test',rows:rows.length}})}
 }
 return json({ok:true,notificationId,sent,failed,rows:rows.length});
});