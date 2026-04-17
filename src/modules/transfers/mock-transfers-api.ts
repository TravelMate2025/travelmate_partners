import type {
  CreateTransferInput,
  TransferListing,
  TransfersApi,
  UpdateTransferInput,
} from "@/modules/transfers/contracts";
import { transitionTransferStatus } from "@/modules/transfers/state-machine";

type MockTransfersState = {
  byUserId: Record<string, TransferListing[]>;
};

const STORAGE_KEY = "tm_partner_transfers_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readState(): MockTransfersState {
  if (typeof window === "undefined") {
    return { byUserId: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { byUserId: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MockTransfersState>;
    return {
      byUserId:
        parsed && parsed.byUserId && typeof parsed.byUserId === "object" ? parsed.byUserId : {},
    };
  } catch {
    return { byUserId: {} };
  }
}

function writeState(state: MockTransfersState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensure(state: MockTransfersState, userId: string) {
  const items = state.byUserId[userId] ?? [];
  state.byUserId[userId] = items;
  return items;
}

function findTransfer(items: TransferListing[], transferId: string) {
  const item = items.find((transfer) => transfer.id === transferId);
  if (!item) {
    throw new Error("Transfer not found.");
  }
  return item;
}

function patch(item: TransferListing, input: UpdateTransferInput) {
  const next = {
    ...item,
    ...input,
    features: input.features ?? item.features,
    updatedAt: nowIso(),
  };

  return next;
}

function createFromInput(userId: string, input: CreateTransferInput): TransferListing {
  const ts = nowIso();
  return {
    id: makeId(),
    userId,
    status: "draft",
    name: input.name,
    description: "",
    transferType: input.transferType,
    pickupPoint: input.pickupPoint,
    dropoffPoint: input.dropoffPoint,
    vehicleClass: input.vehicleClass,
    passengerCapacity: input.passengerCapacity,
    luggageCapacity: input.luggageCapacity,
    features: [],
    coverageArea: input.coverageArea,
    operatingHours: "",
    currency: "NGN",
    baseFare: input.baseFare ?? 0,
    nightSurcharge: 0,
    createdAt: ts,
    updatedAt: ts,
  };
}

export const mockTransfersApi: TransfersApi = {
  async listTransfers(userId) {
    const state = readState();
    const items = ensure(state, userId);
    return [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  },

  async getTransfer(userId, transferId) {
    const state = readState();
    const items = ensure(state, userId);
    return findTransfer(items, transferId);
  },

  async createTransfer(userId, input) {
    const state = readState();
    const items = ensure(state, userId);
    const item = createFromInput(userId, input);
    items.push(item);
    writeState(state);
    return item;
  },

  async updateTransfer(userId, transferId, input) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findTransfer(items, transferId);
    const next = patch(current, input);
    const index = items.findIndex((item) => item.id === transferId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async updateStatus(userId, transferId, status) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findTransfer(items, transferId);

    let next = transitionTransferStatus(current, status);

    if (status === "pending") {
      const submissionCount = (current.submissionCount ?? 0) + 1;
      if (submissionCount === 1) {
        next = transitionTransferStatus(next, "rejected");
        next.moderationFeedback =
          "First review rejected: add clearer route coverage and vehicle details.";
      } else {
        next = transitionTransferStatus(next, "approved");
        next.moderationFeedback = undefined;
      }
      next.submissionCount = submissionCount;
    }

    const index = items.findIndex((item) => item.id === transferId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async archiveTransfer(userId, transferId) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findTransfer(items, transferId);
    const next = transitionTransferStatus(current, "archived");

    const index = items.findIndex((item) => item.id === transferId);
    items[index] = next;
    writeState(state);
    return next;
  },
};
