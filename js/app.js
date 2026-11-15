const $=(s,r=document)=>r.querySelector(s),peso=n=>"₱"+(isFinite(n)?n:0).toLocaleString("en-PH",{maximumFractionDigits:2});
const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.i);toast.i=setTimeout(()=>t.classList.remove("on"),2200)};
let store={};try{store=JSON.parse(localStorage.getItem("kuya")||"{}")}catch(e){}
store.custom=store.custom||[];store.pins=store.pins||["krudo"];store.exp=store.exp||[];
const save=()=>{try{localStorage.setItem("kuya",JSON.stringify(store))}catch(e){}};
// tiny safe expression parser
function ev(s,v){const t=s.match(/[A-Za-z_]\w*|\d*\.?\d+|[()+\-*\/%]/g)||[];let i=0;
const E=()=>{let a=T();while(t[i]=="+"||t[i]=="-"){const o=t[i++],b=T();a=o=="+"?a+b:a-b}return a},
T=()=>{let a=F();while(t[i]=="*"||t[i]=="/"){const o=t[i++],b=F();a=o=="*"?a*b:(b?a/b:0)}return a},
F=()=>{let x=t[i++];if(x=="-")return-F();if(x=="("){const r=E();i++;return r}
let r=/^[A-Za-z_]/.test(x||"")?(v[x]??0):parseFloat(x);if(isNaN(r))r=0;while(t[i]=="%"){i++;r/=100}return r};
try{return E()}catch(e){return 0}}
const F_=(id,label,def,type="peso",min,max)=>({id,label,def,type,min,max});
const PRE=[
{id:"krudo",name:"Krudo at trip cost",f:[F_("dist","Layo (km)",120,"num"),F_("kml","Km kada litro",10,"num"),F_("price","Presyo/litro",62),F_("buf","Traffic buffer (%)",15,"slider",0,50),F_("pax","Ilan ang maghahati",3,"num")],
 o:[["Krudo kailangan (L)","dist/kml*(1+buf/100)",1],["Kabuuang gastos","dist/kml*(1+buf/100)*price",2],["Ambagan bawat isa","dist/kml*(1+buf/100)*price/pax",0]]},
{id:"sweldo",name:"Sweldo, OT at allowance",f:[F_("rate","Daily rate",800),F_("days","Araw na pumasok",12,"num"),F_("ot","OT hours",6,"num"),F_("allow","Out-of-town allowance",300),F_("meal","Meal allowance",150),F_("bale","Bale/cash advance",500)],
 o:[["Gross","rate*days+ot*rate/8*125%+allow+meal*days",0],["Take-home","rate*days+ot*rate/8*125%+allow+meal*days-bale",2]]},
{id:"toll",name:"Toll at RFID load",f:[F_("toll","Toll isang biyahe",170),F_("trips","Bilang ng round trip",2,"num"),F_("load","Natitirang RFID load",1000)],
 o:[["Toll (round trip)","toll*2*trips",0],["Matitirang load","load-toll*2*trips",2]]},
{id:"pms",name:"Boundary at net take-home",f:[F_("inc","Kita bawat araw",2200),F_("bound","Boundary",1100),F_("fuel","Krudo bawat araw",600),F_("pms","PMS bawat buwan",3000),F_("days","Araw na pumasok",26,"num")],
 o:[["Net bawat araw","inc-bound-fuel-pms/days",1],["Net bawat buwan","(inc-bound-fuel)*days-pms",2]]}];
const all=()=>[...PRE,...store.custom];
function card(c,pinBtn=true){const el=document.createElement("section");el.className="card";const vals={};
 el.innerHTML=`<h3><span class="ellip">${c.name}</span>${pinBtn?`<button class="ghost" data-pin aria-label="I-pin sa Car HUD">${store.pins.includes(c.id)?"Naka-pin":"Pin"}</button>`:""}</h3>`+
 c.f.map(f=>`<label for="${c.id}_${f.id}">${f.label}${f.type=="slider"?` <b data-v="${f.id}"></b>`:""}</label>${f.type=="toggle"?`<select id="${c.id}_${f.id}" data-f="${f.id}"><option value="0">Hindi</option><option value="1">Oo</option></select>`:`<input id="${c.id}_${f.id}" data-f="${f.id}" type="${f.type=="slider"?"range":"number"}" inputmode="decimal" ${f.type=="slider"?`min="${f.min??0}" max="${f.max??100}"`:`min="0" step="any"`} value="${f.def}">`}`).join("")+
 `<div class="out" aria-live="polite"></div><div class="row" style="margin-top:8px"><button class="gold" data-say>Basahin</button></div>`;
 const run=()=>{el.querySelectorAll("[data-f]").forEach(i=>{vals[i.dataset.f]=parseFloat(i.value)||0;const b=el.querySelector(`[data-v="${i.dataset.f}"]`);if(b)b.textContent=i.value});
  const rows=c.o.map(([l,f,k])=>{const r=ev(f,vals);return{l,r,k,txt:(k==2||k==0&&/[₱]/.test(l)?0:0,/\(L\)/.test(l)?r.toFixed(1)+" L":peso(r))}});
  el.querySelector(".out").innerHTML=rows.map((r,i)=>`<div class="${i==rows.length-1?"main":""}"><span>${r.l}</span><b>${r.txt}</b></div>`).join("");el._say=rows.map(r=>r.l+": "+r.txt).join(". ")};
 el.addEventListener("input",run);run();
 el.querySelector("[data-say]").onclick=()=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(el._say.replace(/₱/g,"piso "));u.lang="fil-PH";speechSynthesis.speak(u)}catch(e){toast("Walang voice readout sa device na ito")}};
 const pb=el.querySelector("[data-pin]");if(pb)pb.onclick=()=>{const i=store.pins.indexOf(c.id);i<0?store.pins.push(c.id):store.pins.splice(i,1);save();pb.textContent=i<0?"Naka-pin":"Pin";toast(i<0?"Na-pin sa Car HUD":"Inalis sa Car HUD")};
 return el}
// coding checker
const CODE={1:[1,2],2:[3,4],3:[5,6],4:[7,8],5:[9,0]},DAYS=["Linggo","Lunes","Martes","Miyerkules","Huwebes","Biyernes","Sabado"];
function coding(){const el=document.createElement("section");el.className="card";
 el.innerHTML=`<h3>Number coding (MMDA)</h3><label for="plate">Huling numero ng plaka</label><input id="plate" type="number" min="0" max="9" value="5"><div class="out" aria-live="polite"></div><p style="color:var(--mute);font-size:.82rem;margin:8px 0 0">Karaniwang window: 7–10 AM at 5–8 PM, Lunes–Biyernes. I-check ang MMDA para sa updates at exemptions.</p>`;
 const run=()=>{const p=parseInt($("#plate",el).value),d=Object.keys(CODE).find(k=>CODE[k].includes(p)),today=new Date().getDay(),no=today==d;
  $(".out",el).innerHTML=isNaN(p)||p<0||p>9?"Maglagay ng 0–9":`<div><span>Coded tuwing</span><b>${DAYS[d]}</b></div><div class="status ${no?"no":"yes"}">${no?"Coded ka ngayon. Iwasan ang 7–10 AM at 5–8 PM.":"Hindi ka coded ngayon ("+DAYS[today]+")."}</div>`};
 el.addEventListener("input",run);run();return el}
// views
const V={};
V.calc=m=>{m.innerHTML="<h2>Mga calculator</h2><div class='grid'></div>";const g=$(".grid",m);all().forEach(c=>g.append(card(c)));g.append(coding())};
let draft={name:"",f:[],formula:""};
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"").slice(0,10)||"x"+Math.random().toString(36).slice(2,5);
const KEYS=[[/krudo|gas|fuel|gasolina/,[["dist","Layo (km)",100,"num"],["kml","Km kada litro",10,"num"],["price","Presyo/litro",62,"peso"]],"dist/kml*price"],
[/toll|skyway|calax|slex|nlex|expressway/,[["toll","Toll",200,"peso"]],"toll"],[/meal|kain|pagkain/,[["meal","Meal allowance ng driver",300,"peso"]],"meal"],
[/overnight|hotel|stay/,[["hotel","Overnight/stay",800,"peso"]],"hotel"],[/parking|park/,[["parking","Parking",100,"peso"]],"parking"],[/tip/,[["tip","Tip",100,"peso"]],"tip"]];
V.build=m=>{m.innerHTML=`<h2>Calculator Builder</h2><div class="grid"><section class="card"><h3>1. Sabihin ang goal</h3><label for="goal">Halimbawa: Tagaytay weekend trip na may gas, toll, at meal ng driver</label><textarea id="goal" rows="3"></textarea><div class="row" style="margin-top:8px"><button id="auto" class="gold">Auto-build</button></div><label for="nm">Pangalan</label><input id="nm" value="${draft.name}"></section>
<section class="card"><h3>2. Mga input</h3><div id="fl"></div><div class="row" style="margin-top:8px"><input id="nf" placeholder="Bagong input, hal. Parking" style="flex:1"><select id="nt" style="width:auto"><option value="peso">₱ Peso</option><option value="num">Numero</option><option value="slider">Slider</option><option value="toggle">Toggle</option></select><button id="addf">Dagdag</button></div></section>
<section class="card"><h3>3. Formula</h3><div class="row" id="pills"></div><div class="row" style="margin:8px 0">${["+","-","*","/","%","(",")"].map(o=>`<button class="op" data-op="${o}" aria-label="operator ${o}">${o=="*"?"×":o=="/"?"÷":o}</button>`).join("")}<button class="ghost" id="clr">Burahin</button></div><input id="fm" aria-label="Formula" value="${draft.formula}"><div class="out" id="pv" aria-live="polite"></div><div class="row" style="margin-top:8px"><button id="sv">I-save</button></div></section></div>`;
 const fl=$("#fl",m),fm=$("#fm",m),sync=()=>{draft.formula=fm.value;draft.name=$("#nm",m).value;
  fl.innerHTML=draft.f.length?draft.f.map((f,i)=>`<div class="row" style="margin-bottom:6px"><input data-l="${i}" value="${f.label}" style="flex:1" aria-label="Pangalan ng input"><button class="ghost" data-up="${i}" aria-label="Itaas">↑</button><button class="red" data-del="${i}" aria-label="Alisin">✕</button></div>`).join(""):`<div class="empty">Wala pang input. Mag-Auto-build o magdagdag.</div>`;
  $("#pills",m).innerHTML=draft.f.map(f=>`<button class="pill" data-v="${f.id}">${f.label}</button>`).join("");
  const v={};draft.f.forEach(f=>v[f.id]=f.def);$("#pv",m).innerHTML=`<div class="main"><span>Preview (default na halaga)</span><b>${peso(ev(draft.formula,v))}</b></div>`};
 m.onclick=e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset;
  if(b.id=="auto"){const g=$("#goal",m).value.toLowerCase();draft.f=[];let fs=[];KEYS.forEach(k=>{if(k[0].test(g)){k[1].forEach(x=>draft.f.push(F_(x[0],x[1],x[2],x[3])));fs.push(k[2])}});
   if(!draft.f.length){toast("Walang nakitang keyword. Magdagdag ng input manu-mano.");return}
   fm.value=fs.join("+");if(!$("#nm",m).value)$("#nm",m).value=g.slice(0,32);sync();toast("Na-build! I-edit kung gusto.")}
  else if(b.id=="addf"){const l=$("#nf",m).value.trim();if(!l){toast("Lagyan ng pangalan ang input");return}const t=$("#nt",m).value;draft.f.push(F_(slug(l),l,t=="slider"?50:0,t,0,100));$("#nf",m).value="";sync()}
  else if(d.del!=null){draft.f.splice(+d.del,1);sync()}else if(d.up!=null&&+d.up>0){const i=+d.up;[draft.f[i-1],draft.f[i]]=[draft.f[i],draft.f[i-1]];sync()}
  else if(d.v){fm.value+=(fm.value&&!/[+\-*\/(]$/.test(fm.value)?"+":"")+d.v;sync()}else if(d.op){fm.value+=d.op;sync()}else if(b.id=="clr"){fm.value="";sync()}
  else if(b.id=="sv"){if(!draft.name||!draft.f.length||!draft.formula){toast("Kumpletuhin ang pangalan, input at formula");return}
   store.custom.push({id:"c"+Date.now(),name:draft.name,f:draft.f,o:[["Resulta",draft.formula,2]]});save();draft={name:"",f:[],formula:""};toast("Na-save! Nasa Calculators na.");go("calc")}};
 m.oninput=e=>{if(e.target.dataset.l!=null)draft.f[+e.target.dataset.l].label=e.target.value;if(e.target.id=="fm"||e.target.id=="nm"){draft.formula=fm.value;draft.name=$("#nm",m).value}
  if(e.target.id=="fm"){const v={};draft.f.forEach(f=>v[f.id]=f.def);$("#pv",m).innerHTML=`<div class="main"><span>Preview</span><b>${peso(ev(fm.value,v))}</b></div>`}};sync()};
let tm=null,t0=0,wid=null;
V.hud=m=>{document.body.classList.add("car");
 m.innerHTML=`<div class="row" style="justify-content:space-between"><h2>Car HUD</h2><button class="ghost" id="ex">Labas</button></div><div class="hud-grid"><section class="card"><label>Oras ng biyahe</label><div class="big" id="tm">00:00:00</div><div class="row" style="margin-top:12px"><button id="tg" style="flex:1" class="gold">Simulan</button></div><label style="margin-top:16px">Bilis (GPS)</label><div class="big" id="sp">-- <small style="font-size:1.2rem">km/h</small></div></section>
 <section class="card"><label>Mabilis na gastos</label><div class="exp">${[["Parking",50],["Toll",100],["Krudo",500],["Tip",50]].map(x=>`<button data-x="${x[1]}" data-n="${x[0]}" class="${x[0]=="Tip"?"gold":""}">+${peso(x[1])} ${x[0]}</button>`).join("")}</div><div class="out"><div class="main"><span>Kabuuan</span><b id="et">₱0</b></div></div><button class="ghost" id="ec" style="margin-top:8px">I-reset</button></section></div><div id="pins" class="grid" style="margin-top:16px"></div>`;
 const pr=$("#pins",m);const ps=all().filter(c=>store.pins.includes(c.id));ps.length?ps.forEach(c=>pr.append(card(c,false))):pr.innerHTML="<div class='empty'>Wala pang naka-pin. Pindutin ang Pin sa isang calculator.</div>";
 const upd=()=>$("#et",m).textContent=peso(store.exp.reduce((a,b)=>a+b,0));upd();
 const tick=()=>{const s=Math.floor((Date.now()-t0)/1000),p=n=>String(n).padStart(2,"0");$("#tm",m).textContent=`${p(s/3600|0)}:${p(s/60%60|0)}:${p(s%60)}`};
 $("#tg",m).onclick=e=>{if(tm){clearInterval(tm);tm=null;e.target.textContent="Simulan";if(wid!=null)navigator.geolocation.clearWatch(wid);wid=null}else{t0=Date.now();tm=setInterval(tick,1000);e.target.textContent="Itigil";
  if(navigator.geolocation)wid=navigator.geolocation.watchPosition(p=>{$("#sp",m).firstChild.textContent=p.coords.speed!=null?Math.round(p.coords.speed*3.6)+" ":"-- "},()=>toast("Walang GPS. Hindi gagana ang speedometer."),{enableHighAccuracy:true})}};
 m.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{store.exp.push(+b.dataset.x);save();upd();toast("Naitala: "+b.dataset.n)});
 $("#ec",m).onclick=()=>{store.exp=[];save();upd();toast("Na-reset ang gastos")};$("#ex",m).onclick=()=>go("calc")};
function logo(c,s,mask){const x=c.getContext("2d"),r=s/2;x.fillStyle="#0038A8";if(mask)x.fillRect(0,0,s,s);else{x.beginPath();x.roundRect(0,0,s,s,s*.22);x.fill()}
 const k=mask?.8:1;x.save();x.translate(r,r);x.scale(k,k);x.strokeStyle="#FCD116";x.lineWidth=s*.07;x.beginPath();x.arc(0,0,s*.3,0,7);x.stroke();
 x.fillStyle="#CE1126";x.beginPath();x.arc(0,0,s*.07,0,7);x.fill();x.strokeStyle="#FCD116";x.lineWidth=s*.05;[[0,-.3,0,-.07],[-.26,.15,-.06,.04],[.26,.15,.06,.04]].forEach(l=>{x.beginPath();x.moveTo(l[0]*s,l[1]*s);x.lineTo(l[2]*s,l[3]*s);x.stroke()});
 x.fillStyle="#FCD116";[[-.36,-.36],[.36,-.36],[0,.4]].forEach(p=>{x.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,d=i%2?s*.025:s*.06;x.lineTo(p[0]*s+Math.cos(a)*d,p[1]*s+Math.sin(a)*d)}x.fill()});x.restore()}
V.icons=m=>{m.innerHTML=`<h2>Mga icon at OG image</h2><p style="color:var(--mute)">I-download ang buong icon set, maskable icons, apple-touch-icon at og-image. Ilagay sa <b>icons/</b> folder.</p><button class=\"gold\" id=\"dl\">I-download lahat</button><div class="grid" id="ig"></div>`;const g=$("#ig",m);
 [[512,0],[192,0],[512,1],[180,0],[72,0]].forEach(([s,mk])=>{const d=document.createElement("div");d.className="card";const c=document.createElement("canvas");c.width=c.height=s;c.style.width=Math.min(s,160)+"px";logo(c,s,mk);d.append(c);d.insertAdjacentHTML("beforeend",`<p style="margin:8px 0 0">${s}×${s}${mk?" maskable":""}</p>`);g.append(d)});
 const d=document.createElement("div"),c=document.createElement("canvas");c.width=1200;c.height=630;const x=c.getContext("2d");x.fillStyle="#0B0F19";x.fillRect(0,0,1200,630);const lg=document.createElement("canvas");lg.width=lg.height=340;logo(lg,340,0);x.drawImage(lg,80,145);
 x.fillStyle="#fff";x.font="bold 84px Trebuchet MS,sans-serif";x.fillText("Kuya Driver AI",460,280);x.fillStyle="#FCD116";x.font="36px Trebuchet MS,sans-serif";x.fillText("Calculator at dashboard ng Pinoy driver",460,350);x.fillStyle="#CE1126";x.fillRect(460,390,220,10);
 d.className="card";d.style.gridColumn="1/-1";d.append(c);d.insertAdjacentHTML("beforeend","<p style='margin:8px 0 0'>og-image 1200×630</p>");g.append(d);$("#dl",m).onclick=()=>window.exportAll?exportAll(logo,toast):toast("Hindi na-load ang generator")};
function go(t){if(tm&&t!="hud"){}document.body.classList.toggle("car",t=="hud");$("#view").innerHTML="";V[t]($("#view"));document.querySelectorAll("nav button").forEach(b=>b.toggleAttribute("aria-current",b.dataset.t==t)||b.removeAttribute("aria-current"));document.querySelectorAll("nav button").forEach(b=>b.dataset.t==t?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current"));scrollTo(0,0)}
document.querySelector("nav").onclick=e=>{const b=e.target.closest("button");if(b)go(b.dataset.t)};
$("#themeBtn").onclick=()=>{const r=document.documentElement,d=getComputedStyle(r).colorScheme.includes("dark");r.dataset.theme=d?"light":"dark";document.querySelector('meta[name=theme-color]').content=d?"#0038A8":"#0B0F19"};
const nt=()=>{const o=navigator.onLine;$("#net").textContent=o?"Online":"Offline";if(!o)toast("Walang internet? Gumagana pa rin ang mga calculator mo.")};addEventListener("online",nt);addEventListener("offline",nt);nt();
go("calc");

if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
