import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')||'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const ORG='KC_WERNE';
const APP='KC_MONEY_BUTLER';
const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods':'POST,OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store','X-KC-Function-Version':'3'}
});
const admin=()=>createClient(SUPABASE_URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST')return json({error:'POST_REQUIRED'},405);

  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(!token)return json({error:'UNAUTHORIZED'},401);

  const db=admin();
  const {data:userData,error:userError}=await db.auth.getUser(token);
  const user=userData?.user;
  if(userError||!user?.id||!user.email||!user.email_confirmed_at)return json({error:'UNAUTHORIZED'},401);

  const email=String(user.email).trim().toLowerCase();
  const {data:candidates,error:peopleError}=await db.from('kc_core_people')
    .select('org_id,person_id,display_name,email,active')
    .eq('org_id',ORG).eq('active',true);
  const people=(candidates||[]).filter((p:any)=>String(p.email||'').trim().toLowerCase()===email);
  if(peopleError)return json({error:'PEOPLE_LOOKUP_FAILED'},500);
  if(!people?.length)return json({error:'NO_ELIGIBLE_KC_PERSON'},403);
  if(people.length!==1)return json({error:'AMBIGUOUS_EMAIL_MATCH'},409);

  const person=people[0];
  const {data:access,error:accessError}=await db.from('kc_core_app_access')
    .select('access_role,active')
    .eq('org_id',ORG).eq('person_id',person.person_id).eq('app_id',APP).maybeSingle();
  if(accessError)return json({error:'APP_ACCESS_LOOKUP_FAILED'},500);
  if(!access?.active||!['admin','manager','operator'].includes(String(access.access_role))){
    return json({error:'MONEY_BUTLER_NOT_ENABLED'},403);
  }

  const {data:existing,error:existingError}=await db.from('kc_core_user_links')
    .select('org_id,user_id,person_id,core_role,active')
    .eq('org_id',ORG).eq('person_id',person.person_id).maybeSingle();
  if(existingError)return json({error:'LINK_LOOKUP_FAILED'},500);

  if(existing&&String(existing.user_id)!==String(user.id)){
    return json({error:'PERSON_ALREADY_LINKED'},409);
  }

  if(existing&&existing.active!==true){console.info(JSON.stringify({feature:'KC-SEC-MONEY-IDENTITY',event:'disabled_link_rejected',userId:user.id}));return json({error:'LINK_DISABLED'},403)}
  let link=existing;
  if(!existing){
    const {data:created,error:createError}=await db.from('kc_core_user_links')
      .insert({org_id:ORG,user_id:user.id,person_id:person.person_id,core_role:'member',active:true})
      .select('org_id,user_id,person_id,core_role,active').single();
    if(createError)return json({error:'LINK_CREATE_FAILED',detail:createError.message},500);
    link=created;
  }
  console.info(JSON.stringify({feature:'KC-SEC-MONEY-IDENTITY',event:'confirmed_link',userId:user.id,personId:person.person_id,existing:!!existing}));

  return json({
    ok:true,
    orgId:ORG,
    personId:person.person_id,
    displayName:person.display_name||email,
    email,
    coreRole:link?.core_role||'member',
    accessRole:String(access.access_role),
    appId:APP,
    active:true
  });
});

