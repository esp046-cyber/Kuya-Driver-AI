const V="kuya-driver-v3",ASSETS=["./","./index.html","./offline.html","./css/styles.css","./js/app.js","./js/pwa-asset-generator.js","./manifest.webmanifest","./favicon.svg","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
if(r.mode==="navigate"){e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x}).catch(()=>caches.match(r).then(m=>m||caches.match("./index.html")).then(m=>m||caches.match("./offline.html"))));return}
e.respondWith(caches.match(r).then(m=>{const f=fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(k=>k.put(r,c))}return x}).catch(()=>m);return m||f}))});
