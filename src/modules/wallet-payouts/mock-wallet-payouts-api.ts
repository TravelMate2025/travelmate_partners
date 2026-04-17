import { notificationsClient } from "@/modules/notifications/notifications-client";
import type {
  PayoutRecord,
  PayoutSettings,
  PayoutStatus,
  WalletPayoutsApi,
  WalletSummary,
} from "@/modules/wallet-payouts/contracts";

type State = {
  byUserId: Record<
    string,
    {
      summary: WalletSummary;
      settings: PayoutSettings;
      payouts: Array<PayoutRecord & { lifecycleStep: number }>;
    }
  >;
};

const STORAGE_KEY = "tm_partner_wallet_payouts_state_v2";

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildReference() {
  return `TM-${Date.now().toString().slice(-8)}`;
}

function readState(): State {
  if (typeof window === "undefined") {
    return { byUserId: {} };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { byUserId: {} };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      byUserId: parsed.byUserId && typeof parsed.byUserId === "object" ? parsed.byUserId : {},
    };
  } catch {
    return { byUserId: {} };
  }
}

function writeState(state: State) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeRecord(input: {
  id?: string;
  reference?: string;
  amount: number;
  currency: string;
  status: PayoutRecord["status"];
  lifecycleStep: number;
  createdAt?: string;
}): PayoutRecord & { lifecycleStep: number } {
  const grossAmount = input.amount;
  const commissionFee = Math.round(grossAmount * 0.1);
  const taxWithholding = Math.round(grossAmount * 0.05);
  const totalDeductions = commissionFee + taxWithholding;
  const netAmount = grossAmount - totalDeductions;
  const ts = input.createdAt ?? nowIso();

  return {
    id: input.id ?? makeId(),
    reference: input.reference ?? buildReference(),
    grossAmount,
    commissionFee,
    taxWithholding,
    totalDeductions,
    netAmount,
    amount: netAmount,
    currency: input.currency,
    status: input.status,
    createdAt: ts,
    updatedAt: ts,
    lifecycleStep: input.lifecycleStep,
  };
}

function ensureUser(state: State, userId: string) {
  if (!state.byUserId[userId]) {
    const summary: WalletSummary = {
      pendingBalance: 45000,
      availableBalance: 120000,
      paidBalance: 830000,
      currency: "NGN",
      reserveHoldDays: 7,
    };
    const settings: PayoutSettings = {
      schedule: "bi-weekly",
      minimumThreshold: 50000,
      manualModeEnabled: true,
      updatedAt: nowIso(),
    };
    const payouts = [
      makeRecord({
        id: "payout-1",
        reference: "TM-70014521",
        amount: 50000,
        currency: "NGN",
        status: "paid",
        lifecycleStep: 2,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      makeRecord({
        id: "payout-2",
        reference: "TM-70014522",
        amount: 75000,
        currency: "NGN",
        status: "processing",
        lifecycleStep: 1,
      }),
    ];
    state.byUserId[userId] = { summary, settings, payouts };
  }
  return state.byUserId[userId];
}

function syncSummarySummaryFromPayouts(
  summary: WalletSummary,
  payouts: Array<PayoutRecord & { lifecycleStep: number }>,
) {
  const pendingTotal = payouts
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.netAmount, 0);
  summary.pendingBalance = pendingTotal;
}

function advanceLifecycle(
  payouts: Array<PayoutRecord & { lifecycleStep: number }>,
) {
  let changed = false;
  const updated: Array<PayoutRecord & { lifecycleStep: number }> = payouts.map((payout) => {
    if (payout.lifecycleStep >= 2) {
      return payout;
    }
    const nextStep = payout.lifecycleStep + 1;
    const nextStatus: PayoutStatus = nextStep === 1 ? "processing" : "paid";
    changed = true;
    return {
      ...payout,
      lifecycleStep: nextStep,
      status: nextStatus,
      updatedAt: nowIso(),
    };
  });
  return { updated, changed };
}

async function emitStatus(userId: string, label: string) {
  try {
    await notificationsClient.emitEvent(userId, {
      eventType: "payout_status_updated",
      channels: ["in_app", "email"],
      contextLabel: label,
    });
  } catch {
    // Notification failures should not block payout reads.
  }
}

export const mockWalletPayoutsApi: WalletPayoutsApi = {
  async getWalletSummary(userId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    syncSummarySummaryFromPayouts(userState.summary, userState.payouts);
    writeState(state);
    return userState.summary;
  },

  async listPayouts(userId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    const { updated, changed } = advanceLifecycle(userState.payouts);
    userState.payouts = updated;
    syncSummarySummaryFromPayouts(userState.summary, userState.payouts);

    if (changed) {
      const moving = updated.find((item) => item.lifecycleStep === 1 || item.lifecycleStep === 2);
      if (moving) {
        await emitStatus(userId, `${moving.reference} is ${moving.status}`);
      }
    }

    writeState(state);
    return [...userState.payouts]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map(({ lifecycleStep: _lifecycleStep, ...item }) => item);
  },

  async getPayoutSettings(userId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    writeState(state);
    return userState.settings;
  },

  async updatePayoutSettings(userId, input) {
    const state = readState();
    const userState = ensureUser(state, userId);
    if (typeof input.minimumThreshold === "number" && input.minimumThreshold < 0) {
      throw new Error("Minimum threshold cannot be negative.");
    }
    userState.settings = {
      ...userState.settings,
      ...input,
      updatedAt: nowIso(),
    };
    writeState(state);
    return userState.settings;
  },

  async requestPayout(userId, amount) {
    const state = readState();
    const userState = ensureUser(state, userId);

    if (!userState.settings.manualModeEnabled) {
      throw new Error("Manual payout mode is disabled.");
    }
    if (amount < userState.settings.minimumThreshold) {
      throw new Error(
        `Payout amount must be at least ${userState.settings.minimumThreshold}.`,
      );
    }
    if (amount > userState.summary.availableBalance) {
      throw new Error("Insufficient available balance.");
    }

    const created = makeRecord({
      amount,
      currency: userState.summary.currency,
      status: "pending",
      lifecycleStep: 0,
    });
    userState.payouts.unshift(created);
    userState.summary.availableBalance -= created.netAmount;
    syncSummarySummaryFromPayouts(userState.summary, userState.payouts);
    writeState(state);

    await emitStatus(userId, `${created.reference} is pending`);
    const { lifecycleStep: _lifecycleStep, ...record } = created;
    return record;
  },

  async downloadPayoutStatement(userId, payoutId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    const payout = userState.payouts.find((item) => item.id === payoutId);
    if (!payout) {
      throw new Error("Payout not found.");
    }

    return [
      "field,value",
      `reference,${payout.reference}`,
      `status,${payout.status}`,
      `grossAmount,${payout.grossAmount}`,
      `commissionFee,${payout.commissionFee}`,
      `taxWithholding,${payout.taxWithholding}`,
      `totalDeductions,${payout.totalDeductions}`,
      `netAmount,${payout.netAmount}`,
      `currency,${payout.currency}`,
      `createdAt,${payout.createdAt}`,
    ].join("\n");
  },
};
