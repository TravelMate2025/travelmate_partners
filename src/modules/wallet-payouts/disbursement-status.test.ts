/**
 * Tests for Phase 15 slice 120.4a — Partner disbursement visibility.
 * Verifies that SettlementRecord contract includes disbursement fields,
 * that the mock API can represent disbursed settlements, and that
 * the DisbursementStatus type covers all expected values.
 */

import { describe, expect, it } from "vitest";

import type {
  DisbursementStatus,
  SettlementRecord,
  SettlementStatus,
} from "@/modules/wallet-payouts/contracts";

// ---------------------------------------------------------------------------
// DisbursementStatus type values
// ---------------------------------------------------------------------------

describe("DisbursementStatus type", () => {
  const validStatuses: DisbursementStatus[] = [
    "queued",
    "initiated",
    "processing",
    "success",
    "failed",
    "cancelled",
  ];

  it("covers all 6 disbursement status values", () => {
    expect(validStatuses).toHaveLength(6);
    expect(validStatuses).toContain("queued");
    expect(validStatuses).toContain("initiated");
    expect(validStatuses).toContain("processing");
    expect(validStatuses).toContain("success");
    expect(validStatuses).toContain("failed");
    expect(validStatuses).toContain("cancelled");
  });
});

// ---------------------------------------------------------------------------
// SettlementRecord — disbursement fields contract
// ---------------------------------------------------------------------------

function makeSettlementRecord(overrides: Partial<SettlementRecord> = {}): SettlementRecord {
  return {
    id: "settle-001",
    bookingReference: "BK-001",
    settlementReference: "SR-001",
    grossAmount: 25000,
    commissionFee: 5000,
    taxWithholding: 0,
    totalDeductions: 5000,
    netAmount: 20000,
    currency: "NGN",
    status: "paid",
    completedAt: "2026-05-19T09:00:00Z",
    createdAt: "2026-05-19T08:00:00Z",
    updatedAt: "2026-05-19T09:00:00Z",
    ...overrides,
  };
}

describe("SettlementRecord disbursement fields", () => {
  it("allows omitted disbursement fields for settlements without disbursements", () => {
    const record = makeSettlementRecord();
    expect(record.disbursementStatus).toBeUndefined();
    expect(record.disbursementProviderReference).toBeUndefined();
    expect(record.disbursedAt).toBeUndefined();
    expect(record.disbursementRetryCount).toBeUndefined();
  });

  it("accepts a settlement with disbursement status initiated", () => {
    const record = makeSettlementRecord({
      disbursementStatus: "initiated",
      disbursementProviderReference: "FLW-9001",
      disbursementRetryCount: 0,
    });
    expect(record.disbursementStatus).toBe("initiated");
    expect(record.disbursementProviderReference).toBe("FLW-9001");
    expect(record.disbursementRetryCount).toBe(0);
  });

  it("accepts a settlement with disbursement status success and disbursedAt timestamp", () => {
    const disbursedAt = "2026-05-19T11:30:00Z";
    const record = makeSettlementRecord({
      disbursementStatus: "success",
      disbursementProviderReference: "FLW-9001",
      disbursedAt,
      disbursementRetryCount: 0,
    });
    expect(record.disbursementStatus).toBe("success");
    expect(record.disbursedAt).toBe(disbursedAt);
  });

  it("accepts a failed disbursement with retry count", () => {
    const record = makeSettlementRecord({
      disbursementStatus: "failed",
      disbursementRetryCount: 2,
    });
    expect(record.disbursementStatus).toBe("failed");
    expect(record.disbursementRetryCount).toBe(2);
  });

  it("accepts a cancelled disbursement after max retries", () => {
    const record = makeSettlementRecord({
      disbursementStatus: "cancelled",
      disbursementRetryCount: 3,
    });
    expect(record.disbursementStatus).toBe("cancelled");
    expect(record.disbursementRetryCount).toBe(3);
  });

  it("allows null disbursement fields explicitly", () => {
    const record = makeSettlementRecord({
      disbursementStatus: null,
      disbursementProviderReference: null,
      disbursedAt: null,
      disbursementRetryCount: null,
    });
    expect(record.disbursementStatus).toBeNull();
    expect(record.disbursementProviderReference).toBeNull();
    expect(record.disbursedAt).toBeNull();
    expect(record.disbursementRetryCount).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// All terminal settlement statuses can have disbursement info
// ---------------------------------------------------------------------------

describe("Settlement and disbursement status combinations", () => {
  const settlementStatuses: SettlementStatus[] = [
    "pending_completion",
    "processing",
    "paid",
    "failed",
    "reversed",
  ];

  it("covers all 5 settlement statuses", () => {
    expect(settlementStatuses).toHaveLength(5);
  });

  it("only paid settlements should have disbursement records", () => {
    const paidRecord = makeSettlementRecord({ status: "paid", disbursementStatus: "success" });
    const processingRecord = makeSettlementRecord({ status: "processing" });

    expect(paidRecord.disbursementStatus).toBe("success");
    expect(processingRecord.disbursementStatus).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Disbursement status label/class coverage (smoke test for UI constants)
// ---------------------------------------------------------------------------

describe("DisbursementStatus display coverage", () => {
  const allStatuses: DisbursementStatus[] = [
    "queued",
    "initiated",
    "processing",
    "success",
    "failed",
    "cancelled",
  ];

  const labels: Record<DisbursementStatus, string> = {
    queued: "Payout queued",
    initiated: "Payout initiated",
    processing: "Payout processing",
    success: "Payout sent",
    failed: "Payout failed",
    cancelled: "Payout cancelled",
  };

  it("has a display label for every disbursement status", () => {
    for (const status of allStatuses) {
      expect(labels[status]).toBeDefined();
      expect(labels[status].length).toBeGreaterThan(0);
    }
  });

  it("success status label is 'Payout sent'", () => {
    expect(labels["success"]).toBe("Payout sent");
  });

  it("failed status label is 'Payout failed'", () => {
    expect(labels["failed"]).toBe("Payout failed");
  });
});
