import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'Content-Type':'application/json'}});
Deno.serve(async(req)=>{
 if(req.method!=='POST') return json({error:'POST required'},405);
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data:key}=await admin.from('kc_dp_cron_auth').select('id').eq('id','pilot_admin_resend_once').maybeSingle();
 if(!key) return json({error:'one-time authorization unavailable'},403);
 await admin.from('kc_dp_cron_auth').delete().eq('id','pilot_admin_resend_once');
 const {data:tester}=await admin.from('kc_dp_pilot_testers').select('id,first_name,expected_device').eq('first_name','Kathi').maybeSingle();
 if(!tester) return json({error:'tester not found'},404);
 const {data:subs}=await admin.from('kc_dp_pilot_push_subscriptions').select('id,subscription').eq('tester_id',tester.id).eq('active',true);
 if(!subs?.length) return json({error:'no active subscription'},409);
 let pub=Deno.env.get('KC_DP_VAPID_PUBLIC_KEY')||'',priv=Deno.env.get('KC_DP_VAPID_PRIVATE_KEY')||'',subject=Deno.env.get('KC_DP_VAPID_SUBJECT')||'mailto:admin@koecheclub-werne.de';
 if(!pub||!priv){const {data:r}=await admin.rpc('kc_dp_get_push_runtime_secrets');if(r){pub=String(r.vapidPublicKey||'');priv=String(r.vapidPrivateKey||'');subject=String(r.vapidSubject||subject)}}
 if(!pub||!priv)return json({error:'VAPID missing'},503);
 webpush.setVapidDetails(subject,pub,priv);
 const remove='KC DP2 entfernen: App-Symbol lange drücken → App entfernen → Vom Home-Bildschirm entfernen. Mitteilungen können zusätzlich in Einstellungen → Mitteilungen → KC DP2 deaktiviert werden.';
 const message={title:'💐 Danke für deine Unterstützung!',body:`Hallo ${tester.first_name}, der Entwickler bedankt sich herzlich für deinen KC-DP2-Test. 💐🌷🌸`,data:{route:'pilot_complete',pilot:true,type:'complete',uninstallHelp:remove}};
 let sent=0,failed=0;
 for(const row of subs){try{await webpush.sendNotification(row.subscription,JSON.stringify(message),{TTL:21600,urgency:'high'});sent++}catch(e){failed++;const code=Number((e as any).statusCode||0);if([404,410].includes(code))await admin.from('kc_dp_pilot_push_subscriptions').update({active:false,updated_at:new Date().toISOString()}).eq('id',row.id)}}
 await admin.from('kc_dp_pilot_events').insert({tester_id:tester.id,event_type:'completion_push_sent_admin',detail:{sent,failed}});
 return json({ok:true,sent,failed});
});