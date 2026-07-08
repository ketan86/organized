import type { ReminderSoundId } from "@/lib/notifications/reminder-sound";

export type ReminderSoundPrefs = {
  enabled: boolean;
  soundId: ReminderSoundId;
};

const STORAGE_KEY = "organized-reminder-sound";

export const DEFAULT_REMINDER_SOUND_PREFS: ReminderSoundPrefs = {
  enabled: true,
  soundId: "bells",
};

export function loadReminderSoundPrefs(): ReminderSoundPrefs {
  if (typeof window === "undefined") return DEFAULT_REMINDER_SOUND_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REMINDER_SOUND_PREFS;
    const parsed = JSON.parse(raw) as Partial<ReminderSoundPrefs>;
    const soundId = parsed.soundId;
    const validIds: ReminderSoundId[] = ["bells", "chime", "pulse", "gentle"];
    return {
      enabled: parsed.enabled !== false,
      soundId: validIds.includes(soundId as ReminderSoundId)
        ? (soundId as ReminderSoundId)
        : DEFAULT_REMINDER_SOUND_PREFS.soundId,
    };
  } catch {
    return DEFAULT_REMINDER_SOUND_PREFS;
  }
}

export function saveReminderSoundPrefs(prefs: ReminderSoundPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota errors */
  }
}
