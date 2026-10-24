/* KC Club: technische Supabase-Fruehwarnung aus KC System Check.
   Adminbereich dauerhaft, Startseite nur bei bestaetigter Warnung.
   Kein geschaetzter Egress wird als offizieller Supabase-Verbrauch ausgegeben. */
(function () {
  "use strict";
  const URL="https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-traffic-guard";
  const TTL=5*60*1000;
  let last=0, loading=false, current=null;
  function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
  function dateText(s){const t=Date.parse(s||"");return Number.isFinite(t)?new Date(t).toLocaleString("de-DE"):"noch keine Messung";}
  function isLoggedIn(){return !!window.KCFP?.angemeldet && !document.getElementById("app")?.classList.contains("versteckt");}
  function adminNode(){
    const admin=document.getElementById("adminBereich");
    if(!admin)return null;
    let el=document.getElementById("kcTrafficGuardClub");
    if(!el){
      el=document.createElement("div");
      el.id="kcTrafficGuardClub";
      el.style.cssText="margin:12px 0;padding:12px;border:1px solid var(--linie,#ccc);border-radius:14px;background:var(--karte,#fff);";
      el.innerHTML='<strong>🚦 Supabase-Frühwarnung (KC Check)</strong>'+
        '<p id="kcTrafficGuardClubDetail" class="hinweis" aria-live="polite">Messstatus wird geladen …</p>'+
        '<div class="knoepfe"><button type="button" class="knopf klein" id="kcTrafficGuardClubReload">↻ Prüfen</button>'+
        '<a class="knopf klein" href="https://supabase.com/dashboard/org/_/usage#egress" target="_blank" rel="noopener noreferrer">Supabase-Verbrauch</a></div>'+
        '<p class="hinweis" style="font-size:.8rem">Die Frühwarnung erfasst SQL-Aufrufe und Ergebnismengen. Der tatsächlich abgerechnete Datenverkehr (GB) ist noch nicht automatisch angebunden.</p>';
      admin.insertBefore(el,admin.children[1]||null);
      el.querySelector("#kcTrafficGuardClubReload").addEventListener("click",()=>check(true));
    }
    return el;
  }
  function banner(status){
    const start=document.getElementById("v-start");
    if(!start)return;
    let b=document.getElementById("kcTrafficGuardHome");
    const admin=document.getElementById("adminBereich");
    // KC-TRAFFIC-GEPLANT-STILL (24.10.2026, Fund Hansi: gelber Kasten „ungewöhnlich hohe Datenbanklast … Ursache (geplant): Datensicherung“ um 3 Uhr):
    // Der Wächter erkennt geplante Spitzen (Datensicherung, neue Version, Notpaket, Rundnachricht) und schickt dafür keinen Push –
    // dann auch kein Warnkasten auf der Startseite. Im Admin-Bereich steht es weiter, als „geplante Last“. Kritische Last zeigt immer.
    const show=isLoggedIn() && !!admin && !admin.classList.contains("versteckt") && (status?.level==="critical"||(status?.level==="warning"&&status?.geplant!==true));
    if(!show){b?.remove();return;}
    if(!b){b=document.createElement("div");b.id="kcTrafficGuardHome";b.style.cssText="margin:10px 12px;padding:10px 12px;border:2px solid #a15a22;border-radius:12px;background:var(--gelbbg,#fff0c9);color:var(--text,#222);";const hero=start.querySelector(".hero");if(hero)hero.insertAdjacentElement("afterend",b);else start.prepend(b);}
    const red=status.level==="critical";b.style.borderColor=red?"#c62828":"#b47b00";
    b.innerHTML='<strong>'+(red?"🚨":"⚠️")+' Supabase: ungewöhnlich hohe Datenbanklast</strong>'+
       '<div style="font-size:.85rem;margin:4px 0">'+esc(status.detail||"Bitte KC Check prüfen.")+'</div>'+
       '<small>Prüfung '+esc(dateText(status.measured_at))+' · Keine Abrechnungs-GB</small>';
  }
  function render(){
    const el=adminNode();if(!el)return;
    const out=el.querySelector("#kcTrafficGuardClubDetail");
    const d=current||{level:"unknown",detail:"Keine Messung"};
    const labels={normal:"🟢 Last unauffällig",warning:"🟡 Erhöhte Last",critical:"🔴 Kritische Last",unknown:"⚪ Noch keine verlässliche Messung"};
    const stufe=d.geplant===true&&d.level==="warning"?"🔵 Geplante Last – kein Grund zur Sorge":(labels[d.level]||labels.unknown); // KC-TRAFFIC-GEPLANT-STILL
    if(out)out.innerHTML='<b>'+esc(stufe)+'</b><br>'+
      esc(d.detail||"Keine Details")+'<br><small>SQL-Aufrufe / 15 Min.: '+(d.calls_15m==null?'—':Math.round(Number(d.calls_15m)).toLocaleString("de-DE"))+
      ' · Ergebniszeilen / 15 Min.: '+(d.rows_15m==null?'—':Math.round(Number(d.rows_15m)).toLocaleString("de-DE"))+
      ' · Letzte Messung: '+esc(dateText(d.measured_at))+
      ' · Egress-GB: nicht angebunden</small>';
    banner(d);
  }
  async function check(force){
    const admin=document.getElementById("adminBereich");
    if(!isLoggedIn()||!admin||admin.classList.contains("versteckt")||loading||(!force&&Date.now()-last<TTL))return;
    loading=true;last=Date.now();
    try{const res=await fetch(URL,{cache:"no-store",signal:AbortSignal.timeout(7000)});
      if(!res.ok)throw Error("HTTP "+res.status);
      const data=await res.json();current=data?.ok?data:{level:"unknown",detail:"Messung derzeit nicht erreichbar"};
    }catch(e){current={level:"unknown",detail:"KC-Frühwarnung derzeit nicht erreichbar. In KC Check nachsehen."};}
    finally{loading=false;render();}
  }
  function start(){adminNode();render();check(false);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)check(false);});
  setInterval(()=>{if(isLoggedIn()){render();check(false);}},15000);
})();