import { profileClient } from "@/modules/profile/profile-client";
import { notificationsClient } from "@/modules/notifications/notifications-client";
import type {
  EligibleBooking,
  EligibleBookingPage,
  RefundStatus,
  SettlementAccount,
  SettlementAccountHistoryEntry,
  SettlementAccountUpsertInput,
  SettlementRecord,
  SettlementSettings,
  SettlementStatus,
  SubmitSettlementAccountResult,
  WalletPayoutsApi,
  WalletSummary,
} from "@/modules/wallet-payouts/contracts";
import {
  computeNameMatchStatus,
  formatSettlementAccountSummary,
  maskSensitiveValue,
  validateSettlementAccountInput,
} from "@/modules/wallet-payouts/settlement-accounts";

type SettlementAccountInternal = SettlementAccount & {
  accountNumber?: string;
  iban?: string;
  routingCode?: string;
  swiftCode?: string;
  mobileNumber?: string;
  otpCode?: string;
};

type State = {
  byUserId: Record<
    string,
    {
      summary: WalletSummary;
      settings: SettlementSettings;
      settlements: Array<SettlementRecord & { lifecycleStep: number }>;
      settlementAccounts: SettlementAccountInternal[];
      settlementAccountHistory: SettlementAccountHistoryEntry[];
      eligibleBookings: EligibleBooking[];
    }
  >;
};

const STORAGE_KEY = "tm_partner_wallet_payouts_state_v4";

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildReference(prefix: "BOOK" | "SETTLE") {
  return `TM-${prefix}-${Date.now().toString().slice(-8)}`;
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

function makeSettlement(input: {
  id?: string;
  bookingReference?: string;
  settlementReference?: string;
  grossAmount: number;
  currency: string;
  status: SettlementStatus;
  lifecycleStep: number;
  createdAt?: string;
  completedAt?: string;
}): SettlementRecord & { lifecycleStep: number } {
  const commissionFee = Math.round(input.grossAmount * 0.1);
  const taxWithholding = Math.round(input.grossAmount * 0.05);
  const totalDeductions = commissionFee + taxWithholding;
  const netAmount = input.grossAmount - totalDeductions;
  const ts = input.createdAt ?? nowIso();
  const completedAt = input.completedAt ?? ts;

  return {
    id: input.id ?? makeId(),
    bookingReference: input.bookingReference ?? buildReference("BOOK"),
    settlementReference: input.settlementReference ?? buildReference("SETTLE"),
    grossAmount: input.grossAmount,
    commissionFee,
    taxWithholding,
    totalDeductions,
    netAmount,
    currency: input.currency,
    status: input.status,
    completedAt,
    createdAt: ts,
    updatedAt: ts,
    lifecycleStep: input.lifecycleStep,
    paidAt: input.status === "paid" ? ts : undefined,
  };
}

function makeHistoryEntry(
  accountId: string,
  action: SettlementAccountHistoryEntry["action"],
  message: string,
): SettlementAccountHistoryEntry {
  return {
    id: makeId(),
    accountId,
    action,
    message,
    createdAt: nowIso(),
  };
}

function publicAccount(account: SettlementAccountInternal): SettlementAccount {
  const { accountNumber: _accountNumber, iban: _iban, routingCode: _routingCode, swiftCode: _swiftCode, mobileNumber: _mobileNumber, otpCode: _otpCode, ...rest } =
    account;
  return rest;
}

function ensureUser(state: State, userId: string) {
  if (!state.byUserId[userId]) {
    const summary: WalletSummary = {
      pendingBalance: 0,
      availableBalance: 0,
      paidBalance: 0,
      currency: "NGN",
      reserveHoldDays: 2,
    };
    const settings: SettlementSettings = {
      autoSettleOnBookingCompletion: true,
      reserveHoldDays: 2,
      requireAdminRefundNotification: true,
      updatedAt: nowIso(),
    };
    const settlements = [
      makeSettlement({
        id: "settlement-1",
        bookingReference: "TM-BOOK-70014521",
        settlementReference: "TM-SETTLE-70014521",
        grossAmount: 125000,
        currency: "NGN",
        status: "paid",
        lifecycleStep: 2,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      makeSettlement({
        id: "settlement-2",
        bookingReference: "TM-BOOK-70014522",
        settlementReference: "TM-SETTLE-70014522",
        grossAmount: 98000,
        currency: "NGN",
        status: "processing",
        lifecycleStep: 1,
      }),
    ];
    state.byUserId[userId] = {
      summary,
      settings,
      settlements,
      settlementAccounts: [],
      settlementAccountHistory: [],
      eligibleBookings: [
        {
          id: 1,
          bookingReference: "TM-BOOK-80014521",
          grossAmount: 110000,
          currency: "NGN",
          completedAt: nowIso(),
          sourceLabel: "mock_feed",
        },
        {
          id: 2,
          bookingReference: "TM-BOOK-80014522",
          grossAmount: 85000,
          currency: "NGN",
          completedAt: nowIso(),
          sourceLabel: "mock_feed",
        },
      ],
    };
  }
  return state.byUserId[userId];
}

function syncSummaryFromSettlements(
  summary: WalletSummary,
  settlements: Array<SettlementRecord & { lifecycleStep: number }>,
) {
  const pendingBalance = settlements
    .filter((item) => item.status === "pending_completion" || item.status === "processing")
    .reduce((sum, item) => sum + item.netAmount, 0);
  const paidBalance = settlements
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => {
      const refundReduction =
        item.refundStatus === "refunded" || item.refundStatus === "recovered"
          ? item.refundedAmount ?? 0
          : 0;
      return sum + Math.max(0, item.netAmount - refundReduction);
    }, 0);

  summary.pendingBalance = pendingBalance;
  summary.paidBalance = paidBalance;
  summary.availableBalance = 0;
}

function advanceLifecycle(
  settlements: Array<SettlementRecord & { lifecycleStep: number }>,
) {
  let changed = false;
  const updated = settlements.map((item) => {
    if (item.lifecycleStep >= 2 || item.status === "failed" || item.status === "reversed") {
      return item;
    }
    const nextStep = item.lifecycleStep + 1;
    const nextStatus: SettlementStatus = nextStep === 1 ? "processing" : "paid";
    changed = true;
    return {
      ...item,
      lifecycleStep: nextStep,
      status: nextStatus,
      paidAt: nextStatus === "paid" ? nowIso() : item.paidAt,
      updatedAt: nowIso(),
    };
  });
  return { updated, changed };
}

async function emitSettlementStatus(userId: string, label: string) {
  try {
    await notificationsClient.emitEvent(userId, {
      eventType: "settlement_refund_status_updated",
      channels: ["in_app", "email"],
      contextLabel: label,
    });
  } catch {
    // Notification failures should not block settlement reads.
  }
}

async function emitSettlementAccountStatus(userId: string, label: string) {
  try {
    await notificationsClient.emitEvent(userId, {
      eventType: "settlement_account_updated",
      channels: ["in_app", "email"],
      contextLabel: label,
    });
  } catch {
    // Notification failures should not block settlement account updates.
  }
}

function stripLifecycle(item: SettlementRecord & { lifecycleStep: number }): SettlementRecord {
  const { lifecycleStep: _lifecycleStep, ...record } = item;
  return record;
}

export const mockWalletPayoutsApi: WalletPayoutsApi = {
  async getWalletSummary(userId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    userState.summary.reserveHoldDays = userState.settings.reserveHoldDays;
    syncSummaryFromSettlements(userState.summary, userState.settlements);
    writeState(state);
    return userState.summary;
  },

  async listSettlements(userId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    const { updated, changed } = advanceLifecycle(userState.settlements);
    userState.settlements = updated;
    userState.summary.reserveHoldDays = userState.settings.reserveHoldDays;
    syncSummaryFromSettlements(userState.summary, userState.settlements);

    if (changed) {
      const moving = updated.find((item) => item.lifecycleStep === 1 || item.lifecycleStep === 2);
      if (moving) {
        await emitSettlementStatus(userId, `${moving.settlementReference} is ${moving.status}`);
      }
    }

    writeState(state);
    return [...userState.settlements]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map(stripLifecycle);
  },

  async getSettlementSettings(userId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    writeState(state);
    return userState.settings;
  },

  async updateSettlementSettings(userId, input) {
    const state = readState();
    const userState = ensureUser(state, userId);
    if (typeof input.reserveHoldDays === "number" && input.reserveHoldDays < 0) {
      throw new Error("Reserve hold days cannot be negative.");
    }
    userState.settings = {
      ...userState.settings,
      ...input,
      updatedAt: nowIso(),
    };
    userState.summary.reserveHoldDays = userState.settings.reserveHoldDays;
    writeState(state);
    return userState.settings;
  },

  async recordBookingCompletion(userId, input) {
    const state = readState();
    const userState = ensureUser(state, userId);

    if (!input.bookingReference.trim()) {
      throw new Error("Booking reference is required.");
    }
    const event = userState.eligibleBookings.find(
      (item) => item.bookingReference === input.bookingReference.trim(),
    );
    if (!event) {
      throw new Error("Booking completion is not available for settlement yet.");
    }

    const created = makeSettlement({
      bookingReference: input.bookingReference.trim(),
      grossAmount: event.grossAmount,
      currency: event.currency,
      status: "pending_completion",
      lifecycleStep: 0,
    });

    userState.settlements.unshift(created);
    userState.eligibleBookings = userState.eligibleBookings.filter(
      (item) => item.bookingReference !== event.bookingReference,
    );
    syncSummaryFromSettlements(userState.summary, userState.settlements);
    writeState(state);

    await emitSettlementStatus(userId, `${created.settlementReference} is pending_completion`);
    return stripLifecycle(created);
  },

  async listEligibleBookings(userId, input = {}): Promise<EligibleBookingPage> {
    const state = readState();
    const userState = ensureUser(state, userId);
    const page = Math.max(1, Number(input.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(input.pageSize ?? 20)));
    const search = String(input.search ?? "").trim().toLowerCase();
    const filtered = search
      ? userState.eligibleBookings.filter((item) => item.bookingReference.toLowerCase().includes(search))
      : userState.eligibleBookings;
    const start = (page - 1) * pageSize;
    const results = filtered.slice(start, start + pageSize);
    writeState(state);
    return {
      results: [...results],
      count: filtered.length,
      page,
      pageSize,
      hasNext: start + pageSize < filtered.length,
      hasPrevious: page > 1,
    };
  },

  async createSettlementsFromBookings(userId, input) {
    const state = readState();
    const userState = ensureUser(state, userId);
    const refs = (input.bookingReferences ?? []).map((item) => String(item).trim()).filter(Boolean);
    if (refs.length === 0) {
      throw new Error("Select at least one booking reference.");
    }
    const created: SettlementRecord[] = [];
    const skipped: Array<{ bookingReference: string; reason: string }> = [];
    for (const ref of refs) {
      const event = userState.eligibleBookings.find((item) => item.bookingReference === ref);
      if (!event) {
        skipped.push({ bookingReference: ref, reason: "completion_event_missing" });
        continue;
      }
      const settlement = makeSettlement({
        bookingReference: event.bookingReference,
        grossAmount: event.grossAmount,
        currency: event.currency,
        status: "pending_completion",
        lifecycleStep: 0,
      });
      userState.settlements.unshift(settlement);
      created.push(stripLifecycle(settlement));
      userState.eligibleBookings = userState.eligibleBookings.filter((item) => item.bookingReference !== ref);
    }
    syncSummaryFromSettlements(userState.summary, userState.settlements);
    writeState(state);
    return { created, skipped, failed: [] };
  },

  async recordCancellationRefund(userId, input) {
    const state = readState();
    const userState = ensureUser(state, userId);
    const target = userState.settlements.find((item) => item.id === input.settlementId);
    if (!target) {
      throw new Error("Settlement not found.");
    }
    if (input.refundAmount <= 0) {
      throw new Error("Refund amount must be greater than zero.");
    }
    if (!input.reason.trim()) {
      throw new Error("Refund reason is required.");
    }

    target.refundedAmount = input.refundAmount;
    target.refundReason = input.reason.trim();
    target.refundStatus = input.status ?? "partner_notified";
    target.updatedAt = nowIso();

    syncSummaryFromSettlements(userState.summary, userState.settlements);
    writeState(state);

    await emitSettlementStatus(userId, `${target.settlementReference} refund is ${target.refundStatus}`);
    return stripLifecycle(target);
  },

  async downloadSettlementStatement(userId, settlementId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    const settlement = userState.settlements.find((item) => item.id === settlementId);
    if (!settlement) {
      throw new Error("Settlement not found.");
    }

    return [
      "field,value",
      `bookingReference,${settlement.bookingReference}`,
      `settlementReference,${settlement.settlementReference}`,
      `status,${settlement.status}`,
      `grossAmount,${settlement.grossAmount}`,
      `commissionFee,${settlement.commissionFee}`,
      `taxWithholding,${settlement.taxWithholding}`,
      `totalDeductions,${settlement.totalDeductions}`,
      `netAmount,${settlement.netAmount}`,
      `refundStatus,${settlement.refundStatus ?? ""}`,
      `refundedAmount,${settlement.refundedAmount ?? 0}`,
      `currency,${settlement.currency}`,
      `completedAt,${settlement.completedAt}`,
      `paidAt,${settlement.paidAt ?? ""}`,
      `createdAt,${settlement.createdAt}`,
    ].join("\n");
  },

  async listSettlementAccounts(userId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    writeState(state);
    return userState.settlementAccounts
      .map(publicAccount)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async archiveSettlementAccount(userId, accountId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    const target = userState.settlementAccounts.find((item) => item.id === accountId);
    if (!target) {
      throw new Error("Settlement account not found.");
    }
    if (target.isDefault && userState.settlementAccounts.length === 1) {
      throw new Error("Add another payout method before archiving your default method.");
    }
    userState.settlementAccounts = userState.settlementAccounts.filter((item) => item.id !== accountId);
    if (target.isDefault && userState.settlementAccounts.length > 0) {
      userState.settlementAccounts[0] = {
        ...userState.settlementAccounts[0],
        isDefault: true,
        updatedAt: nowIso(),
      };
      userState.settlementAccountHistory.unshift(
        makeHistoryEntry(
          userState.settlementAccounts[0].id,
          "set_default",
          "Default payout method reassigned after archiving another method.",
        ),
      );
    }
    userState.settlementAccountHistory.unshift(
      makeHistoryEntry(accountId, "updated", "Partner archived payout method."),
    );
    writeState(state);
    await emitSettlementAccountStatus(userId, `${target.maskedSummary} archived`);
    return { archivedAccountId: accountId };
  },

  async listSettlementAccountHistory(userId) {
    const state = readState();
    const userState = ensureUser(state, userId);
    writeState(state);
    return [...userState.settlementAccountHistory].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  },

  async submitSettlementAccount(userId, input): Promise<SubmitSettlementAccountResult> {
    validateSettlementAccountInput(input);

    const state = readState();
    const userState = ensureUser(state, userId);
    const onboarding = await profileClient.getOnboarding(userId);
    const existing = input.accountId
      ? userState.settlementAccounts.find((item) => item.id === input.accountId)
      : undefined;

    const accountId = existing?.id ?? makeId();
    const ts = nowIso();
    const accountNumber = input.accountNumber?.trim() ?? existing?.accountNumber ?? "";
    const iban = input.iban?.trim().toUpperCase() ?? existing?.iban ?? "";
    const routingCode = input.routingCode?.trim() ?? existing?.routingCode ?? "";
    const swiftCode = input.swiftCode?.trim().toUpperCase() ?? existing?.swiftCode ?? "";
    const mobileNumber = input.mobileNumber?.trim() ?? existing?.mobileNumber ?? "";
    const nameMatchStatus = computeNameMatchStatus(onboarding.data, input.accountHolderName);
    const otpCode = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");

    if (input.isDefault) {
      userState.settlementAccounts = userState.settlementAccounts.map((item) => ({
        ...item,
        isDefault: false,
      }));
    }

    const next: SettlementAccountInternal = {
      id: accountId,
      methodType: input.methodType,
      country: input.country.trim().toUpperCase(),
      currency: input.currency.trim().toUpperCase(),
      accountHolderName: input.accountHolderName.trim(),
      bankName: input.bankName?.trim() || undefined,
      accountNumber: accountNumber || undefined,
      accountNumberMasked: accountNumber ? maskSensitiveValue(accountNumber) : undefined,
      iban: iban || undefined,
      ibanMasked: iban ? maskSensitiveValue(iban) : undefined,
      routingCode: routingCode || undefined,
      routingCodeMasked: routingCode ? maskSensitiveValue(routingCode) : undefined,
      swiftCode: swiftCode || undefined,
      swiftCodeMasked: swiftCode ? maskSensitiveValue(swiftCode) : undefined,
      mobileMoneyProvider: input.mobileMoneyProvider?.trim() || undefined,
      mobileNumber: mobileNumber || undefined,
      mobileNumberMasked: mobileNumber ? maskSensitiveValue(mobileNumber) : undefined,
      status: "pending",
      nameMatchStatus,
      isDefault: input.isDefault ?? existing?.isDefault ?? userState.settlementAccounts.length === 0,
      maskedSummary: formatSettlementAccountSummary(input.methodType, accountNumber, mobileNumber),
      rejectionReason: undefined,
      verificationSubmittedAt: ts,
      verifiedAt: undefined,
      updatedAt: ts,
      createdAt: existing?.createdAt ?? ts,
      otpCode,
    };

    userState.settlementAccounts = existing
      ? userState.settlementAccounts.map((item) => (item.id === accountId ? next : item))
      : [next, ...userState.settlementAccounts];

    if (existing) {
      userState.settlementAccountHistory.unshift(
        makeHistoryEntry(accountId, "reverification_required", "Account change requires re-verification."),
      );
    }
    userState.settlementAccountHistory.unshift(
      makeHistoryEntry(
        accountId,
        existing ? "updated" : "submitted",
        existing
          ? "Settlement account details updated and re-submitted for verification."
          : "Settlement account submitted for verification.",
      ),
    );
    userState.settlementAccountHistory.unshift(
      makeHistoryEntry(accountId, "otp_sent", "Verification OTP issued for settlement account."),
    );
    if (next.isDefault) {
      userState.settlementAccountHistory.unshift(
        makeHistoryEntry(accountId, "set_default", "Settlement account set as default payout method."),
      );
    }

    writeState(state);
    await emitSettlementAccountStatus(
      userId,
      `${next.maskedSummary} submitted with ${next.status} verification status`,
    );

    return {
      account: publicAccount(next),
      otpCodeHint: otpCode,
      otpDeliveryChannels: ["email", "sms"],
    };
  },

  async verifySettlementAccountOtp(userId, input) {
    const state = readState();
    const userState = ensureUser(state, userId);
    const target = userState.settlementAccounts.find((item) => item.id === input.accountId);

    if (!target) {
      throw new Error("Settlement account not found.");
    }
    if (!target.otpCode) {
      throw new Error("No OTP challenge is available for this settlement account.");
    }
    if (target.otpCode !== input.otpCode.trim()) {
      throw new Error("Invalid settlement account OTP code.");
    }

    target.otpCode = undefined;
    target.updatedAt = nowIso();

    if (target.nameMatchStatus === "matched") {
      target.status = "verified";
      target.verifiedAt = target.updatedAt;
      target.rejectionReason = undefined;
      userState.settlementAccountHistory.unshift(
        makeHistoryEntry(target.id, "verified", "Settlement account verified successfully."),
      );
      await emitSettlementAccountStatus(userId, `${target.maskedSummary} verified successfully`);
    } else {
      target.status = "rejected";
      target.verifiedAt = undefined;
      target.rejectionReason =
        "Account holder name does not match your onboarding profile. Update details and retry.";
      userState.settlementAccountHistory.unshift(
        makeHistoryEntry(
          target.id,
          "rejected",
          "Settlement account verification failed due to ownership name mismatch.",
        ),
      );
      await emitSettlementAccountStatus(userId, `${target.maskedSummary} verification was rejected`);
    }

    writeState(state);
    return publicAccount(target);
  },
};
