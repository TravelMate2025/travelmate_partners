import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RefundTimelineSection } from "@/modules/bookings/refund-timeline-section";

describe("RefundTimelineSection", () => {
  it("renders nothing when the timeline is empty", () => {
    const { container } = render(<RefundTimelineSection timeline={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the badge, no history list, for a single-entry timeline", () => {
    render(
      <RefundTimelineSection
        timeline={[{ status: "pending", amount: 60000, maxRefundableAmount: 60000, currency: "NGN", updatedAt: "2026-06-15T00:00:00Z" }]}
      />,
    );
    expect(screen.getByText("Refund pending")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows the eligible ceiling when amount differs from maxRefundableAmount", () => {
    render(
      <RefundTimelineSection
        timeline={[{ status: "requested", amount: 40000, maxRefundableAmount: 60000, currency: "NGN", updatedAt: "2026-06-15T00:00:00Z" }]}
      />,
    );
    expect(screen.getByText(/of ₦60,000 eligible/)).toBeInTheDocument();
  });

  it("does not show an amount for a not_required refund", () => {
    render(
      <RefundTimelineSection timeline={[{ status: "not_required", amount: 0, currency: "NGN", updatedAt: "2026-06-15T00:00:00Z" }]} />,
    );
    expect(screen.getByText("No refund required")).toBeInTheDocument();
    expect(screen.queryByText(/₦0/)).not.toBeInTheDocument();
  });

  it("renders every transition in a multi-entry timeline, most recent status as the headline badge", () => {
    render(
      <RefundTimelineSection
        timeline={[
          { refundId: "rf_1", status: "requested", amount: 60000, currency: "NGN", updatedAt: "2026-06-15T00:00:00Z" },
          { refundId: "rf_1", status: "approved", amount: 60000, currency: "NGN", updatedAt: "2026-06-16T00:00:00Z" },
          { refundId: "rf_1", status: "rejected", amount: 60000, currency: "NGN", updatedAt: "2026-06-17T00:00:00Z" },
        ]}
      />,
    );
    expect(screen.getByText("Refund rejected")).toBeInTheDocument();
    expect(screen.getByText("requested")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
  });

  it("shows the reason for the latest transition when present", () => {
    render(
      <RefundTimelineSection
        timeline={[
          {
            status: "rejected",
            amount: 60000,
            currency: "NGN",
            reason: "Duplicate refund request",
            updatedAt: "2026-06-15T00:00:00Z",
          },
        ]}
      />,
    );
    expect(screen.getByText("Reason: Duplicate refund request")).toBeInTheDocument();
  });
});
