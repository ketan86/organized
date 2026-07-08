export type NotificationSupport = {
  supported: boolean;
  pushSupported: boolean;
  permission: NotificationPermission | "unsupported";
};

function isEmbeddedContext(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { supported: false, pushSupported: false, permission: "unsupported" };
  }
  if (isEmbeddedContext()) {
    return { supported: false, pushSupported: false, permission: "unsupported" };
  }
  const pushSupported =
    "serviceWorker" in navigator && "PushManager" in window;
  return {
    supported: true,
    pushSupported,
    permission: Notification.permission,
  };
}

const FIRED_KEY = "organized-reminder-fired";

function firedStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function hasLocalReminderFired(dedupeKey: string): boolean {
  const storage = firedStorage();
  if (!storage) return false;
  return storage.getItem(`${FIRED_KEY}:${dedupeKey}`) === "1";
}

export function markLocalReminderFired(dedupeKey: string): void {
  const storage = firedStorage();
  if (!storage) return;
  storage.setItem(`${FIRED_KEY}:${dedupeKey}`, "1");
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function subscribeToPush(
  publicKey: string,
): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();
  if (!registration || !("PushManager" in window)) return null;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }
  return subscription;
}

export function subscriptionToJson(subscription: PushSubscription) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Invalid push subscription");
  }
  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  };
}

/**
 * Prefer the service worker notification API (standard for PWAs).
 * Falling back to `new Notification` only if no SW is available.
 */
export function showLocalNotification(
  title: string,
  options?: NotificationOptions,
): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const payload: NotificationOptions = {
    icon: "/globe.svg",
    badge: "/globe.svg",
    ...options,
  };

  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.ready
      .then((registration) => registration.showNotification(title, payload))
      .catch(() => {
        try {
          new Notification(title, payload);
        } catch {
          /* browser blocked */
        }
      });
    return;
  }

  try {
    new Notification(title, payload);
  } catch {
    /* browser blocked */
  }
}
