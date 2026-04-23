import { computeCompletedSteps } from "@/modules/profile/checklist";
import type {
  OnboardingStepKey,
  PartnerOnboarding,
  PartnerProfileData,
  ProfileApi,
} from "@/modules/profile/contracts";

type MockProfileState = {
  onboardingByUserId: Record<string, PartnerOnboarding>;
};

const STORAGE_KEY = "tm_partner_profile_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function createDefaultData(): PartnerProfileData {
  return {
    businessType: "",
    legalName: "",
    tradeName: "",
    registrationNumber: "",
    primaryContactName: "",
    primaryContactEmail: "",
    supportContactEmail: "",
    serviceRegions: [],
    operatingCities: [],
    payoutSchedule: "",
  };
}

function createOnboarding(userId: string): PartnerOnboarding {
  return {
    userId,
    data: createDefaultData(),
    completedSteps: [],
    status: "not_started",
    updatedAt: nowIso(),
  };
}

function deriveStatus(completedSteps: OnboardingStepKey[], currentStatus: PartnerOnboarding["status"]) {
  if (completedSteps.length === 0) {
    return "not_started";
  }

  if (currentStatus === "completed" && completedSteps.length === 3) {
    return "completed";
  }

  return "in_progress";
}

function readState(): MockProfileState {
  if (typeof window === "undefined") {
    return { onboardingByUserId: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { onboardingByUserId: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MockProfileState>;
    return {
      onboardingByUserId:
        parsed && parsed.onboardingByUserId && typeof parsed.onboardingByUserId === "object"
          ? parsed.onboardingByUserId
          : {},
    };
  } catch {
    return { onboardingByUserId: {} };
  }
}

function writeState(state: MockProfileState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function mergeData(current: PartnerProfileData, incoming: Partial<PartnerProfileData>): PartnerProfileData {
  return {
    ...current,
    ...incoming,
    serviceRegions:
      incoming.serviceRegions !== undefined
        ? normalizeStringList(incoming.serviceRegions)
        : current.serviceRegions,
    operatingCities:
      incoming.operatingCities !== undefined
        ? normalizeStringList(incoming.operatingCities)
        : current.operatingCities,
  };
}

function touch(onboarding: PartnerOnboarding) {
  onboarding.completedSteps = computeCompletedSteps(onboarding.data);
  onboarding.status = deriveStatus(onboarding.completedSteps, onboarding.status);
  onboarding.updatedAt = nowIso();
  return onboarding;
}

export const mockProfileApi: ProfileApi = {
  async getOnboarding(userId: string) {
    const state = readState();
    const onboarding = state.onboardingByUserId[userId] ?? createOnboarding(userId);
    state.onboardingByUserId[userId] = touch(onboarding);
    writeState(state);
    return state.onboardingByUserId[userId];
  },

  async saveStep(userId: string, step: OnboardingStepKey, data: Partial<PartnerProfileData>) {
    const state = readState();
    const current = state.onboardingByUserId[userId] ?? createOnboarding(userId);

    current.data = mergeData(current.data, data);

    // Force recalculation using central checklist and preserve step intent.
    const recalculated = touch(current);

    if (!recalculated.completedSteps.includes(step)) {
      recalculated.status = recalculated.completedSteps.length === 0 ? "not_started" : "in_progress";
    }

    state.onboardingByUserId[userId] = recalculated;
    writeState(state);
    return recalculated;
  },

  async submitOnboarding(userId: string) {
    const state = readState();
    const current = state.onboardingByUserId[userId] ?? createOnboarding(userId);
    const recalculated = touch(current);

    if (recalculated.completedSteps.length < 3) {
      throw new Error("Complete all onboarding steps before submission.");
    }

    recalculated.status = "completed";
    recalculated.updatedAt = nowIso();
    state.onboardingByUserId[userId] = recalculated;
    writeState(state);
    return recalculated;
  },
};
