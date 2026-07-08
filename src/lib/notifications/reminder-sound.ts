let audioContext: AudioContext | null = null;
let unlocked = false;
let unlockListenersAttached = false;

export type ReminderSoundId = "bells" | "chime" | "pulse" | "gentle";

export const REMINDER_SOUND_OPTIONS: {
  id: ReminderSoundId;
  label: string;
  hint: string;
}[] = [
  { id: "bells", label: "Bells", hint: "Ascending bell melody" },
  { id: "chime", label: "Chime", hint: "Bright two-note chime" },
  { id: "pulse", label: "Pulse", hint: "Rhythmic alert pattern" },
  { id: "gentle", label: "Gentle", hint: "Soft low harp notes" },
];

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

type ToneSpec = {
  freq: number;
  at: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  detune?: number;
};

function playTone(ctx: AudioContext, baseTime: number, spec: ToneSpec) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = spec.type ?? "triangle";
  osc.frequency.value = spec.freq;
  if (spec.detune) osc.detune.value = spec.detune;
  osc.connect(gain);
  gain.connect(ctx.destination);

  const volume = spec.volume ?? 0.12;
  const start = baseTime + spec.at;
  const attack = 0.02;
  const release = Math.max(0.08, spec.duration * 0.45);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.setValueAtTime(volume * 0.9, start + spec.duration - release);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);

  osc.start(start);
  osc.stop(start + spec.duration + 0.04);
}

function playBellTone(ctx: AudioContext, baseTime: number, spec: ToneSpec) {
  playTone(ctx, baseTime, {
    ...spec,
    type: "sine",
    volume: (spec.volume ?? 0.12) * 0.75,
  });
  playTone(ctx, baseTime, {
    ...spec,
    freq: spec.freq * 2.01,
    type: "sine",
    duration: spec.duration * 0.55,
    volume: (spec.volume ?? 0.12) * 0.22,
    detune: 4,
  });
  playTone(ctx, baseTime, {
    ...spec,
    type: "triangle",
    volume: (spec.volume ?? 0.12) * 0.3,
    detune: -6,
  });
}

function playMotif(ctx: AudioContext, motif: ToneSpec[], useBell = true) {
  const now = ctx.currentTime;
  for (const tone of motif) {
    if (useBell) playBellTone(ctx, now, tone);
    else playTone(ctx, now, tone);
  }
}

function playBellsSound(ctx: AudioContext) {
  playMotif(ctx, [
    { freq: 523.25, at: 0, duration: 0.34 },
    { freq: 659.25, at: 0.26, duration: 0.34 },
    { freq: 783.99, at: 0.52, duration: 0.38 },
    { freq: 987.77, at: 0.8, duration: 0.46 },
    { freq: 783.99, at: 1.38, duration: 0.4, volume: 0.1 },
    { freq: 987.77, at: 1.64, duration: 0.48, volume: 0.1 },
    { freq: 1174.66, at: 1.92, duration: 0.58, volume: 0.095 },
    { freq: 987.77, at: 2.58, duration: 0.72, volume: 0.085 },
  ]);
}

function playChimeSound(ctx: AudioContext) {
  playMotif(
    ctx,
    [
      { freq: 880, at: 0, duration: 0.55, type: "sine", volume: 0.14 },
      { freq: 1174.66, at: 0.42, duration: 0.65, type: "sine", volume: 0.13 },
      { freq: 1318.51, at: 1.1, duration: 0.75, type: "sine", volume: 0.11 },
      { freq: 1567.98, at: 1.72, duration: 0.9, type: "sine", volume: 0.1 },
    ],
    false,
  );
}

function playPulseSound(ctx: AudioContext) {
  const pairs = [
    { low: 440, high: 554.37 },
    { low: 493.88, high: 622.25 },
    { low: 523.25, high: 659.25 },
  ];
  const motif: ToneSpec[] = [];
  let at = 0;
  for (const pair of pairs) {
    motif.push(
      { freq: pair.low, at, duration: 0.22, type: "square", volume: 0.06 },
      { freq: pair.high, at: at + 0.24, duration: 0.22, type: "square", volume: 0.06 },
    );
    at += 0.52;
  }
  motif.push(
    { freq: 659.25, at: at + 0.1, duration: 0.35, type: "sine", volume: 0.12 },
    { freq: 880, at: at + 0.38, duration: 0.5, type: "sine", volume: 0.11 },
    { freq: 1046.5, at: at + 0.72, duration: 0.65, type: "sine", volume: 0.1 },
  );
  playMotif(ctx, motif, false);
}

function playGentleSound(ctx: AudioContext) {
  playMotif(
    ctx,
    [
      { freq: 261.63, at: 0, duration: 0.7, type: "sine", volume: 0.09 },
      { freq: 329.63, at: 0.55, duration: 0.75, type: "sine", volume: 0.085 },
      { freq: 392, at: 1.15, duration: 0.8, type: "sine", volume: 0.08 },
      { freq: 523.25, at: 1.8, duration: 1.1, type: "sine", volume: 0.075 },
    ],
    false,
  );
}

const SOUND_PLAYERS: Record<ReminderSoundId, (ctx: AudioContext) => void> = {
  bells: playBellsSound,
  chime: playChimeSound,
  pulse: playPulseSound,
  gentle: playGentleSound,
};

async function ensureRunningContext(): Promise<AudioContext | null> {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  if (ctx.state === "running") {
    unlocked = true;
    return ctx;
  }
  return null;
}

/** Call after a user gesture so later reminders can play sound. */
export function unlockReminderAudio(): void {
  void ensureRunningContext();
}

/**
 * Attach one-time gesture listeners (click / key / touch) so browsers allow
 * AudioContext without requiring the user to open Settings → Preview.
 */
export function armReminderAudioUnlock(): void {
  if (typeof window === "undefined" || unlockListenersAttached) return;
  unlockListenersAttached = true;

  const unlock = () => {
    unlockReminderAudio();
    if (unlocked) {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
    }
  };

  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
  window.addEventListener("touchstart", unlock, { capture: true, passive: true });
}

export function isReminderAudioUnlocked(): boolean {
  return unlocked && audioContext?.state === "running";
}

export function playReminderSound(soundId: ReminderSoundId = "bells"): void {
  void (async () => {
    const ctx = await ensureRunningContext();
    if (!ctx) return;
    SOUND_PLAYERS[soundId](ctx);
  })();
}
