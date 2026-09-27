/* Replaces the DS 0.1.0 worker that was scoped to /drawin/. Paint now lives at /drawin/paint/. */
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("klecks-app-cache-")).map((key) => caches.delete(key)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: "window" });
    for (const client of windows) {
      if (client.url.includes("/drawin/") && typeof client.navigate === "function") {
        client.navigate(client.url);
      }
    }
  })());
});
