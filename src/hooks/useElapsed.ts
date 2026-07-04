"use client";

import { useEffect, useState } from "react";

/** Ticks every second while `active` so running timers stay live. */
export function useElapsed(startedAt: number | null, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || startedAt == null) return;
    setNow(Date.now());
    const id = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => globalThis.clearInterval(id);
  }, [active, startedAt]);

  if (startedAt == null) return 0;
  return Math.max(0, now - startedAt);
}
