import type {
  ScheduleWindow,
  TransferPricingScheduling,
  TransferPricingSchedulingApi,
  UpsertTransferPricingSchedulingInput,
} from "@/modules/transfer-pricing-scheduling/contracts";
import {
  createDefaultTransferPricingScheduling,
  validateTransferPricingSchedulingInput,
} from "@/modules/transfer-pricing-scheduling/state-machine";

type MockTransferPricingSchedulingState = {
  byUserId: Record<string, Record<string, TransferPricingScheduling>>;
};

const STORAGE_KEY = "tm_partner_transfer_pricing_scheduling_state_v1";

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readState(): MockTransferPricingSchedulingState {
  if (typeof window === "undefined") {
    return { byUserId: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { byUserId: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MockTransferPricingSchedulingState>;
    return {
      byUserId:
        parsed && parsed.byUserId && typeof parsed.byUserId === "object" ? parsed.byUserId : {},
    };
  } catch {
    return { byUserId: {} };
  }
}

function writeState(state: MockTransferPricingSchedulingState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensure(state: MockTransferPricingSchedulingState, userId: string, transferId: string) {
  const userStore = state.byUserId[userId] ?? {};
  state.byUserId[userId] = userStore;

  const existing = userStore[transferId];
  const config = existing
    ? {
        ...createDefaultTransferPricingScheduling(userId, transferId),
        ...existing,
        currency: existing.currency ?? "NGN",
      }
    : createDefaultTransferPricingScheduling(userId, transferId);

  userStore[transferId] = config;
  return config;
}

function mapWindows(input: UpsertTransferPricingSchedulingInput): ScheduleWindow[] {
  return input.scheduleWindows.map((window) => ({
    id: window.id ?? makeId(),
    startTime: window.startTime,
    endTime: window.endTime,
    days: Array.from(new Set(window.days)),
  }));
}

export const mockTransferPricingSchedulingApi: TransferPricingSchedulingApi = {
  async getPricingScheduling(userId, transferId) {
    const state = readState();
    const config = ensure(state, userId, transferId);
    writeState(state);
    return config;
  },

  async upsertPricingScheduling(userId, transferId, input) {
    validateTransferPricingSchedulingInput(input);
    const state = readState();
    const current = ensure(state, userId, transferId);

    const next: TransferPricingScheduling = {
      ...current,
      currency: input.currency.toUpperCase(),
      baseFare: input.baseFare,
      distanceRatePerKm: input.distanceRatePerKm,
      timeRatePerMinute: input.timeRatePerMinute,
      peakSurcharge: input.peakSurcharge,
      nightSurcharge: input.nightSurcharge,
      blackoutDates: [...input.blackoutDates].sort(),
      scheduleWindows: mapWindows(input),
      updatedAt: new Date().toISOString(),
    };

    state.byUserId[userId][transferId] = next;
    writeState(state);
    return next;
  },
};
