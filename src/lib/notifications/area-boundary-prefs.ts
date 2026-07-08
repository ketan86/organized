const STORAGE_KEY = "organized-area-boundary-prefs";

export type AreaBoundaryPrefs = {
  enabled: boolean;
};

export const DEFAULT_AREA_BOUNDARY_PREFS: AreaBoundaryPrefs = {
  enabled: true,
};

export function loadAreaBoundaryPrefs(): AreaBoundaryPrefs {
  if (typeof window === "undefined") return DEFAULT_AREA_BOUNDARY_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AREA_BOUNDARY_PREFS;
    const parsed = JSON.parse(raw) as Partial<AreaBoundaryPrefs>;
    return {
      enabled: parsed.enabled !== false,
    };
  } catch {
    return DEFAULT_AREA_BOUNDARY_PREFS;
  }
}

export function saveAreaBoundaryPrefs(prefs: AreaBoundaryPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota errors */
  }
}
