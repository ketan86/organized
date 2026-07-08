import type { AreaWeight } from "@/components/screens/onboarding/WeightageScreen";
import type {
  AreaDef,
  IntentId,
  Session,
  Task,
  TimeWindow,
  UsualWeekBlock,
} from "@/lib/mock-data";

/** Application data loaded from the API (excludes ephemeral UI). */
export type PersistedAppState = {
  onboardingComplete: boolean;
  intents: IntentId[];
  areas: AreaDef[];
  selectedIds: string[];
  weights: AreaWeight[];
  protectedIds: string[];
  tasks: Task[];
  usualWeek: UsualWeekBlock[];
  sessions: Session[];
  timeWindow: TimeWindow;
};

export type BootstrapResponse = PersistedAppState & {
  userId: string;
};
