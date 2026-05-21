import type {
  PricingAvailabilityApi,
  SeasonalOverride,
  StayPricingAvailability,
  UpsertPricingAvailabilityInput,
} from "@/modules/pricing-availability/contracts";
import {
  createDefaultPricingAvailability,
  validatePricingAvailabilityInput,
} from "@/modules/pricing-availability/state-machine";

type MockPricingState = {
  byUserId: Record<string, Record<string, StayPricingAvailability>>;
};

const STORAGE_KEY = "tm_partner_pricing_availability_state_v1";

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readState(): MockPricingState {
  if (typeof window === "undefined") {
    return { byUserId: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { byUserId: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MockPricingState>;
    return {
      byUserId:
        parsed && parsed.byUserId && typeof parsed.byUserId === "object" ? parsed.byUserId : {},
    };
  } catch {
    return { byUserId: {} };
  }
}

function writeState(state: MockPricingState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensure(state: MockPricingState, userId: string, stayId: string) {
  const userStore = state.byUserId[userId] ?? {};
  state.byUserId[userId] = userStore;

  const existing = userStore[stayId];
  const pricing = existing
    ? {
        ...createDefaultPricingAvailability(userId, stayId),
        ...existing,
        currency: existing.currency ?? "NGN",
      }
    : createDefaultPricingAvailability(userId, stayId);
  userStore[stayId] = pricing;
  return pricing;
}

function mapOverrides(input: UpsertPricingAvailabilityInput): SeasonalOverride[] {
  return input.seasonalOverrides.map((item) => ({
    id: item.id ?? makeId(),
    startDate: item.startDate,
    endDate: item.endDate,
    rate: item.rate,
  }));
}

export const mockPricingAvailabilityApi: PricingAvailabilityApi = {
  async getPricing(userId, stayId) {
    const state = readState();
    const pricing = ensure(state, userId, stayId);
    writeState(state);
    return pricing;
  },

  async upsertPricing(userId, stayId, input) {
    const normalizedInput = input.saleMode === "unit_level"
      ? { ...input, ratePlans: [] }
      : input;
    validatePricingAvailabilityInput(normalizedInput);
    const state = readState();
    const current = ensure(state, userId, stayId);

    const next: StayPricingAvailability = {
      ...current,
      currency: normalizedInput.currency,
      baseRate: normalizedInput.baseRate,
      weekdayRate: normalizedInput.weekdayRate,
      weekendRate: normalizedInput.weekendRate,
      minStayNights: normalizedInput.minStayNights,
      maxStayNights: normalizedInput.maxStayNights,
      seasonalOverrides: mapOverrides(normalizedInput),
      blackoutDates: [...normalizedInput.blackoutDates].sort(),
      ratePlans: normalizedInput.ratePlans,
      cancellationOptions: normalizedInput.cancellationOptions,
      updatedAt: new Date().toISOString(),
    };

    state.byUserId[userId][stayId] = next;
    writeState(state);
    return next;
  },
};
