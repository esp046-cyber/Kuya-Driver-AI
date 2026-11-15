const V="kuya-v1",ASSETS=["./","index.html","offline.html","css/styles.css","js/app.js","js/pwa-asset-generator.js","manifest.webmanifest","favicon.svg","icons/icon-192.png","icons/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
if(r.mode==="navigate"){e.respondWith(fetch(r).catch(()=>caches.match(r).then(m=>m||caches.match("offline.html"))));return}
if(/\.(png|svg|css|js|webmanifest)$/.test(r.url)&&!/sw\.js/.test(r.url)){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x})));return}
e.respondWith(caches.match(r).then(m=>{const f=fetch(r).then(x=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x});return m||f}))});
