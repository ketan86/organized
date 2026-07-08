self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json?.() ?? {};
  } catch {
    payload = { body: event.data?.text?.() ?? "" };
  }

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
      renotify: true,
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
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client && url) {
              return client.navigate(url);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
