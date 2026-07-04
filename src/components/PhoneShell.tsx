import type { ReactNode } from "react";

export function PhoneShell({
  children,
  overlay,
}: {
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-app-shell p-4 sm:p-8">
      <div className="relative h-[100dvh] w-full max-w-[390px] overflow-hidden border-app bg-app text-app shadow-2xl shadow-black/20 sm:h-[844px] sm:rounded-[2.5rem] sm:border">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-11 items-end justify-between px-6 pb-1 text-[11px] font-medium text-app-status">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-sm bg-app-status" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-app-status" />
            <span className="inline-block h-2.5 w-5 rounded-sm bg-app-status" />
          </div>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-2 z-20 hidden h-7 w-28 -translate-x-1/2 rounded-full bg-black/80 sm:block" />

        <div className="h-full overflow-y-auto overscroll-contain">{children}</div>

        {/* Overlays sit on the phone frame, not inside scroll content */}
        {overlay ? (
          <div className="absolute inset-0 z-50 overflow-hidden">{overlay}</div>
        ) : null}
      </div>
    </div>
  );
}
