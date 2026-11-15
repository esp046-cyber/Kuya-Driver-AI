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
function logo(c,s,mask){const x=c.getContext("2d"),r=s/2;x.fillStyle="#0038A8";if(mask)x.fillRect(0,0,s,s);else{x.beginPath();x.roundRect(0,0,s,s,s*.22);x.fill()}
 const k=mask?.8:1;x.save();x.translate(r,r);x.scale(k,k);x.strokeStyle="#FCD116";x.lineWidth=s*.07;x.beginPath();x.arc(0,0,s*.3,0,7);x.stroke();
 x.fillStyle="#CE1126";x.beginPath();x.arc(0,0,s*.07,0,7);x.fill();x.strokeStyle="#FCD116";x.lineWidth=s*.05;[[0,-.3,0,-.07],[-.26,.15,-.06,.04],[.26,.15,.06,.04]].forEach(l=>{x.beginPath();x.moveTo(l[0]*s,l[1]*s);x.lineTo(l[2]*s,l[3]*s);x.stroke()});
 x.fillStyle="#FCD116";[[-.36,-.36],[.36,-.36],[0,.4]].forEach(p=>{x.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,d=i%2?s*.025:s*.06;x.lineTo(p[0]*s+Math.cos(a)*d,p[1]*s+Math.sin(a)*d)}x.fill()});x.restore()}
// ===== v3: Maps & Biyahe, Car HUD, Calculators, Icons & Setup =====
store.exp=(store.exp||[]).filter(x=>x&&typeof x=="object");
const enc=encodeURIComponent,GM="https://www.google.com/maps/",geo=navigator.geolocation,
hav=(a,b,c,d)=>{const r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 12742*Math.asin(Math.sqrt(x))},
srch=q=>GM+"search/?api=1&query="+q,
HUBS={"NAIA T1":[14.509,121.003,90,"Skyway/NAIAx"],"NAIA T2":[14.505,121.009,90,"Skyway/NAIAx"],"NAIA T3":[14.518,121.020,90,"Skyway/NAIAx"],"BGC":[14.5507,121.0503,0,"Walang toll"],"Makati CBD":[14.5547,121.0244,0,"Walang toll"],"Ortigas":[14.5873,121.0615,0,"Walang toll"],"Quezon City":[14.676,121.0437,0,"Walang toll"],"Alabang":[14.4198,121.039,60,"SLEX/Skyway"],"Tagaytay":[14.1153,120.9621,180,"SLEX + CALAX"],"Baguio":[16.4023,120.596,750,"NLEX + SCTEX + TPLEX"],"Clark":[15.185,120.56,300,"NLEX + SCTEX"]},
PIT=[["⛽","Murang gas / pinakamalapit na krudo","gas+station+near+me"],["🔧","Vulcanizing / auto repair","vulcanizing+shop+auto+repair+near+me"],["💳","RFID reload: Autosweep at Easytrip","Autosweep+Easytrip+RFID+station+near+me"],["🅿️","Parking malapit sa destination","parking+lot+near+me"],["🚻","Restroom / stopover / drive-thru","gas+station+with+restroom+drive+thru+near+me"],["🚨","Tow truck / ospital / emergency","hospital+or+towing+service+near+me"]];
function getPos(cb,silent){if(!geo){silent||toast("Walang GPS sa device na ito");return}geo.getCurrentPosition(p=>{store.pos={la:p.coords.latitude,lo:p.coords.longitude};cb&&cb(store.pos)},()=>{silent||toast("Hindi makuha ang GPS. I-allow ang Location.")},{enableHighAccuracy:true,timeout:10000})}
const V={};
V.maps=m=>{
 m.innerHTML=`<h2>Maps at Biyahe</h2><section class="card"><div class="two"><div><label for="st">Panimulang punto</label><input id="st" value="Current GPS Location"></div><div><label for="md">Ruta</label><select id="md"><option value="toll">May toll (mabilis)</option><option value="free">Iwas toll</option></select></div></div>
 <label for="ds">Destination</label><input id="ds" placeholder="Saan ang punta?" autocomplete="off"><div class="chips" aria-label="Mabilis na destination">${Object.keys(HUBS).map(k=>`<button class="pill" data-h="${k}">${k}</button>`).join("")}</div>
 <a id="go" class="btn cta" href="#" target="_blank" rel="noopener">Buksan sa Google Maps Navigation</a><div class="out" id="es" aria-live="polite"></div>
 <h3 style="margin-top:16px">Detalye ng biyahe</h3><div class="two"><div><label for="dk">Layo (km)</label><input id="dk" type="number" inputmode="decimal" min="0" step="any" value="0"></div><div><label for="tl">Toll isang biyahe (₱)</label><input id="tl" type="number" inputmode="decimal" min="0" step="any" value="0"></div>
 <div><label for="kl">Km kada litro</label><input id="kl" type="number" inputmode="decimal" min="1" step="any" value="${store.kml||10}"></div><div><label for="pr">Presyo/litro (₱)</label><input id="pr" type="number" inputmode="decimal" min="0" step="any" value="${store.price||62}"></div></div>
 <label for="pl">Huling digit ng plaka (0–9)</label><input id="pl" type="number" inputmode="numeric" min="0" max="9" value="${store.plate??""}" placeholder="Para sa coding warning"></section>
 <h2>Pit-stop at emergency</h2><div class="pit">${PIT.map(p=>`<a href="${srch(p[2])}" target="_blank" rel="noopener"><span class="ic" aria-hidden="true">${p[0]}</span>${p[1]}</a>`).join("")}</div>`;
 const g=i=>m.querySelector("#"+i),
 url=()=>{const s=g("st").value.trim();let u=GM+"dir/?api=1&destination="+enc(g("ds").value.trim())+"&travelmode=driving";if(s&&!/^current/i.test(s))u+="&origin="+enc(s);if(g("md").value=="free")u+="&avoid=tolls";return u},
 fill=()=>{const h=HUBS[g("ds").value.trim()];if(!h)return;const o=store.pos||{la:14.5547,lo:121.0244},fr=g("md").value=="free";g("dk").value=Math.max(1,Math.round(hav(o.la,o.lo,h[0],h[1])*1.35*(fr?1.15:1)));g("tl").value=fr?0:h[2]},
 est=()=>{const km=+g("dk").value||0,tl=+g("tl").value||0,k=+g("kl").value||10,p=+g("pr").value||0,gas=km/k*p,h=HUBS[g("ds").value.trim()],pv=g("pl").value;
  store.kml=k;store.price=p;if(pv!=="")store.plate=+pv;save();
  let w="",cls="yes";if(pv!==""&&+pv>=0&&+pv<=9){const n=new Date(),cd=Object.keys(CODE).find(x=>CODE[x].includes(+pv)),hr=n.getHours()+n.getMinutes()/60,win=(hr>=7&&hr<10)||(hr>=17&&hr<20);
   if(n.getDay()==cd){cls="no";w=win?"Coded ka NGAYON at nasa window ka na (Metro Manila).":"Coded ka ngayon. Bawal sa 7–10 AM at 5–8 PM (Metro Manila)."}else w="Hindi coded ngayon ("+DAYS[n.getDay()]+")."}
  g("es").innerHTML=`<div><span>Krudo, isang biyahe</span><b>${peso(gas)}</b></div><div><span>Krudo, balikan</span><b>${peso(gas*2)}</b></div><div><span>Toll${h&&g("md").value=="toll"?" ("+h[3]+")":""}, isang biyahe</span><b>${peso(tl)}</b></div><div class="main"><span>Kabuuan, balikan</span><b>${peso((gas+tl)*2)}</b></div>`+(w?`<div class="status ${cls}">${w}</div>`:"")+`<p class="note">Tantya lang ang layo at toll. I-edit ang mga numero kung iba ang ruta mo.</p>`;
  g("go").href=url()};
 m.addEventListener("input",e=>{if(e.target.id=="ds"||e.target.id=="md")fill();est()});m.addEventListener("change",e=>{if(e.target.id=="md"){fill();est()}});
 m.addEventListener("click",e=>{const b=e.target.closest("[data-h]");if(b){g("ds").value=b.dataset.h;fill();est();return}
  if(e.target.closest("#go")&&!g("ds").value.trim()){e.preventDefault();toast("Maglagay muna ng destination")}});
 est();getPos(()=>{fill();est()},true)};
const T={run:false,t0:0,acc:0,d:0,sp:null,hd:null,last:null,wid:null},D8=["N","NE","E","SE","S","SW","W","NW"],EX=[["Parking",50],["Toll",100],["Gas",500],["Meal",150]];
const $i=i=>document.getElementById(i);
function paint(){if(!$i("tm"))return;const s=Math.floor(T.acc+(T.run?(Date.now()-T.t0)/1000:0)),p=n=>String(n).padStart(2,"0");
 $i("tm").textContent=`${p(s/3600|0)}:${p(s/60%60|0)}:${p(s%60)}`;$i("sp").textContent=T.sp==null?"--":Math.round(T.sp);
 $i("hd").textContent=T.hd==null||isNaN(T.hd)?"--":D8[Math.round(T.hd/45)%8]+" "+Math.round(T.hd)+"°";
 $i("dst").textContent=T.d.toFixed(1)+" km";$i("fb").textContent=peso(T.d/(store.kml||10)*(store.price||62));$i("tg").textContent=T.run?"Itigil":"Simulan"}
setInterval(paint,1000);
function watch(){if(T.wid!=null||!geo)return;T.wid=geo.watchPosition(p=>{const c=p.coords;T.sp=c.speed!=null?c.speed*3.6:null;T.hd=c.heading;
 if(T.run&&T.last&&c.accuracy<50){const d=hav(T.last.la,T.last.lo,c.latitude,c.longitude);if(d>.003&&d<.5)T.d+=d}
 T.last={la:c.latitude,lo:c.longitude};store.pos=T.last;paint()},()=>toast("Walang GPS signal. I-allow ang Location."),{enableHighAccuracy:true,maximumAge:1000})}
function unwatch(){if(T.wid!=null&&geo)geo.clearWatch(T.wid);T.wid=null;T.sp=null}
function expPaint(){if(!$i("et"))return;const by={};let t=0;store.exp.forEach(e=>{by[e.n]=(by[e.n]||0)+e.a;t+=e.a});$i("et").textContent=peso(t);
 $i("el").innerHTML=Object.keys(by).length?Object.keys(by).map(k=>`<div><span>${k}</span><b style="font-size:1.1rem">${peso(by[k])}</b></div>`).join(""):""}
function parkPaint(){if(!$i("pi"))return;const p=store.park;$i("pb").hidden=!p;$i("pi").textContent=p?"Naka-save: "+new Date(p.t).toLocaleString("en-PH")+" ("+p.la.toFixed(5)+", "+p.lo.toFixed(5)+")":"Wala pang naka-save na spot.";if(p)$i("pb").href=srch(p.la+","+p.lo)}
V.hud=m=>{m.innerHTML=`<h2>Car HUD</h2><div class="two" style="margin-bottom:16px"><a class="btn cta" style="margin:0" href="${GM}" target="_blank" rel="noopener">Google Maps</a><a class="btn" style="margin:0" href="${srch("gas+station+near+me")}" target="_blank" rel="noopener">Krudo malapit</a></div><div class="hud-grid"><section class="card"><div class="two"><div><label>Bilis (km/h)</label><div class="big" id="sp">--</div></div><div><label>Direksyon</label><div class="big" id="hd" style="font-size:2.2rem">--</div></div></div>
 <div class="two" style="margin-top:12px"><div><label>Oras</label><div class="num" id="tm">00:00:00</div></div><div><label>Layo</label><div class="num" id="dst">0.0 km</div></div></div>
 <div class="out"><div><span>Nagastos na krudo (GPS)</span><b id="fb">₱0</b></div></div><div class="row" style="margin-top:12px"><button class="gold" id="tg" style="flex:1">Simulan</button><button class="ghost" id="rs">I-reset</button></div></section>
 <section class="card"><label>Parking / pickup spot</label><button class="gold" id="pk" style="width:100%">I-save ang spot ko ngayon</button><p class="note" id="pi"></p><a id="pb" class="btn" target="_blank" rel="noopener" hidden>Balikan ang sasakyan sa Google Maps</a></section>
 <section class="card" style="grid-column:1/-1"><label>Mabilis na gastos</label><div class="exp">${EX.map(x=>`<button data-x="${x[1]}" data-n="${x[0]}" class="${x[0]=="Gas"?"gold":""}">+${peso(x[1])} ${x[0]}</button>`).join("")}</div><div class="out"><div class="main"><span>Kabuuan ngayon</span><b id="et">₱0</b></div><div id="el" hidden></div></div><div class="row" style="margin-top:8px"><button class="ghost" id="ec">Kopyahin ang listahan</button><button class="ghost" id="ex">I-reset</button></div></section></div>`;
 $i("el").hidden=false;paint();expPaint();parkPaint();
 $i("tg").onclick=()=>{if(T.run){T.acc+=(Date.now()-T.t0)/1000;T.run=false;unwatch()}else{if(!geo)toast("Walang GPS. Oras lang ang gagana.");T.t0=Date.now();T.run=true;watch()}paint()};
 $i("rs").onclick=()=>{T.run=false;T.acc=0;T.d=0;T.last=null;unwatch();paint();toast("Na-reset ang biyahe")};
 $i("pk").onclick=()=>getPos(p=>{store.park={la:p.la,lo:p.lo,t:Date.now()};save();parkPaint();toast("Na-save ang parking/pickup spot")});
 m.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{store.exp.push({n:b.dataset.n,a:+b.dataset.x,t:Date.now()});save();expPaint();toast("Naitala: "+b.dataset.n)});
 $i("ec").onclick=()=>{const t=store.exp.reduce((a,e)=>a+e.a,0),s=store.exp.map(e=>new Date(e.t).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})+" "+e.n+" "+peso(e.a)).join("\n")+"\nKabuuan: "+peso(t);
  navigator.clipboard?navigator.clipboard.writeText(s).then(()=>toast("Na-kopya ang listahan"),()=>toast("Hindi makopya")):toast("Hindi suportado ang copy")};
 $i("ex").onclick=()=>{store.exp=[];save();expPaint();toast("Na-reset ang gastos")}};
V.calc=m=>{m.innerHTML="<h2>Mga calculator</h2><div class='grid'></div>";const g=$(".grid",m),ids=["krudo","toll","sweldo","ambagan"];
 const AM={id:"ambagan",name:"Ambagan",f:[F_("total","Kabuuang bayarin",1500),F_("pax","Ilan ang maghahati",4,"num"),F_("tip","Tip (%)",10,"slider",0,30)],o:[["May tip","total*(1+tip/100)",1],["Bawat isa","total*(1+tip/100)/pax",2]]};
 ids.map(i=>i=="ambagan"?AM:PRE.find(c=>c.id==i)).forEach(c=>g.append(card(c,false)));const k=coding(),pi=$("#plate",k);if(store.plate!=null){pi.value=store.plate;pi.dispatchEvent(new Event("input",{bubbles:true}))}g.append(k)};
function applyTheme(t){const r=document.documentElement;t=="light"||t=="dark"?r.dataset.theme=t:delete r.dataset.theme;const d=t=="dark"||(t!="light"&&matchMedia("(prefers-color-scheme:dark)").matches);document.querySelector("meta[name=theme-color]").content=d?"#0B0F19":"#0038A8"}
V.setup=m=>{const ios=/iphone|ipad|ipod/i.test(navigator.userAgent),sa=matchMedia("(display-mode:standalone)").matches||navigator.standalone;
 m.innerHTML=`<h2>Icons at Setup</h2><div class="grid"><section class="card"><h3>I-install ang app</h3><p class="note" id="ih">${sa?"Naka-install na ang app.":ios?"Sa Safari: pindutin ang Share, tapos Add to Home Screen.":"Pindutin ang button para i-install."}</p><button class="gold" id="ib">I-install sa Home Screen</button></section>
 <section class="card"><h3>Theme</h3><select id="th" aria-label="Theme"><option value="auto">Sundan ang phone</option><option value="light">Maliwanag</option><option value="dark">Madilim</option></select></section>
 <section class="card"><h3>Status</h3><div class="out"><div><span>Internet</span><b style="font-size:1.1rem">${navigator.onLine?"Online":"Offline"}</b></div><div><span>Mode</span><b style="font-size:1.1rem">${sa?"Naka-install":"Browser"}</b></div></div><p class="note">Walang internet? Gumagana pa rin ang mga calculator mo. Kailangan ng internet ang Google Maps.</p></section></div>
 <h2>Icon at OG export</h2><p class="note">I-download ang buong icon set, maskable icons at og-image.</p><button class="gold" id="dl">I-download lahat</button><div class="thumbs" id="ig"></div>`;
 $i("th").value=store.theme||"auto";$i("th").onchange=e=>{store.theme=e.target.value;save();applyTheme(store.theme);toast("Napalitan ang theme")};
 $i("ib").onclick=()=>{if(window.dp){window.dp.prompt();window.dp=null}else toast(sa?"Naka-install na":ios?"Gamitin ang Share, tapos Add to Home Screen":"Hindi pa available ang install prompt")};
 $i("dl").onclick=()=>window.exportAll?exportAll(logo,toast):toast("Hindi na-load ang generator");
 const g=$i("ig");[[512,0],[192,0],[192,1],[180,0]].forEach(([s,mk])=>{const d=document.createElement("div"),c=document.createElement("canvas");d.className="thumb";c.width=c.height=s;logo(c,s,mk);d.append(c);d.insertAdjacentHTML("beforeend",`<span>${s}${mk?" mask":""}</span>`);g.append(d)})};
function go(t){document.body.classList.toggle("car",t=="hud");const v=$i("view");v.innerHTML="";V[t](v);document.querySelectorAll("nav button").forEach(b=>b.dataset.t==t?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current"));scrollTo(0,0)}
document.querySelector("nav").onclick=e=>{const b=e.target.closest("button");if(b)go(b.dataset.t)};
const nt=()=>{const o=navigator.onLine;$i("net").textContent=o?"Online":"Offline";if(!o)toast("Walang internet? Offline mode active. Gumagana pa rin ang mga calculator mo!")};addEventListener("online",nt);addEventListener("offline",nt);nt();
addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.dp=e});
applyTheme(store.theme||"auto");go("maps");
if("serviceWorker" in navigator&&location.protocol.startsWith("http")){const had=!!navigator.serviceWorker.controller;let rl=false;
 navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had&&!rl){rl=true;location.reload()}});
 addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{}))}
