
self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open("fae-v1").then(c=>c.addAll(["/","/manifest.json"]))); 
});
self.addEventListener("fetch", (e)=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
self.addEventListener("push", (e)=>{
  const data = e.data ? e.data.json() : { title:"FindAllEasy", body:"Yeni fırsat!" };
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icon-192.png" }));
});
