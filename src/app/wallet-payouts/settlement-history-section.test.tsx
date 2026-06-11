import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettlementHistorySection } from "./settlement-history-section";
import type { SettlementRecord, WalletSummary } from "@/modules/wallet-payouts/contracts";

const settlements: SettlementRecord[] = [
  {
    id: "settlement-1",
    bookingReference: "TM-BOOK-1001",
    settlementReference: "TM-SETTLE-1001",
    grossAmount: 100000,
    commissionFee: 10000,
    taxWithholding: 5000,
    totalDeductions: 15000,
    netAmount: 85000,
    currency: "NGN",
    status: "paid",
    refundStatus: "partner_notified",
    refundAmountTotal: 8000,
    refundRecoveredAmount: 0,
    refundOutstandingAmount: 8000,
    refundedAmount: 8000,
    refundReason: "Traveler cancelled after settlement.",
    completedAt: "2026-06-11T08:00:00Z",
    disbursedAt: null,
    createdAt: "2026-06-11T08:00:00Z",
    updatedAt: "2026-06-11T08:10:00Z",
  },
];

const summary: WalletSummary = {
  pendingBalance: 0,
  availableBalance: 0,
  paidBalance: 85000,
  disbursedBalance: 0,
  refundOutstandingBalance: 8000,
  currency: "NGN",
  reserveHoldDays: 2,
};

describe("SettlementHistorySection", () => {
  it("shows explicit settlement stages and refund exposure", () => {
    const onTrackRefund = vi.fn();
    const onDownloadStatement = vi.fn();

    render(
      <SettlementHistorySection
        busy={false}
        onDownloadStatement={onDownloadStatement}
        onSetSelectedSettlementId={vi.fn()}
        onSetShowFullSettlements={vi.fn()}
        onTrackRefund={onTrackRefund}
        selectedSettlementId="settlement-1"
        settlements={settlements}
        showFullSettlements={true}
        statementPreview=""
        summary={summary}
      />,
    );

    expect(screen.getByText(/stage: paid \/ awaiting disbursement/i)).toBeInTheDocument();
    expect(screen.getByText(/refund: partner_notified/i)).toBeInTheDocument();
    expect(screen.getByText(/outstanding 8000 ngn/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /download statement/i }));
    expect(onDownloadStatement).toHaveBeenCalledWith("settlement-1");
  });
});
