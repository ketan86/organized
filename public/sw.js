self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() ?? {};
  const title = payload.title ?? "Organized";
  const body = payload.body ?? "";
  const url = payload.url ?? "/";
  const tag =
    payload.taskId ??
    payload.areaId ??
    payload.kind ??
    "organized-reminder";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/globe.svg",
      badge: "/globe.svg",
      tag,
      data: {
        url,
        taskId: payload.taskId,
        areaId: payload.areaId,
        kind: payload.kind,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
