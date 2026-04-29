import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TransferDetailPage from "@/app/transfers/[transferId]/page";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ transferId: "transfer-1" }),
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => "/transfers/transfer-1",
}));

vi.mock("@/components/common/use-toast-message", () => ({
  useToastMessage: () => undefined,
}));

vi.mock("@/modules/catalog/catalog-options-client", () => ({
  fetchCatalogOptions: async () => ({
    vehicleClasses: [],
  }),
}));

vi.mock("@/components/common/use-partner-access", () => ({
  usePartnerAccess: () => ({
    user: { id: 101, role: "partner" },
    loading: false,
  }),
}));

const listTransfersMock = vi.fn();
const getTransferMock = vi.fn();
const getAppealMock = vi.fn();
const submitAppealMock = vi.fn();

vi.mock("@/modules/transfers/transfers-client", () => ({
  transfersClient: {
    listTransfers: (...args: unknown[]) => listTransfersMock(...args),
    getTransfer: (...args: unknown[]) => getTransferMock(...args),
    getAppeal: (...args: unknown[]) => getAppealMock(...args),
    submitAppeal: (...args: unknown[]) => submitAppealMock(...args),
  },
}));

describe("Transfer detail appeal flow", () => {
  it("does not auto-submit an appeal when opening a paused_by_admin listing", async () => {
    const pausedTransfer = {
      id: "transfer-1",
      status: "paused_by_admin",
      name: "Airport Express",
      transferType: "airport",
      pickupPoint: "Airport",
      dropoffPoint: "Hotel",
      moderationFeedback: "Policy review",
      features: [],
      images: [],
      coverageArea: "Lagos, Nigeria",
      vehicleClass: "suv",
      currency: "NGN",
      operatingHours: "06:00-23:00",
      baseFare: 0,
    };
    listTransfersMock.mockResolvedValue([pausedTransfer]);
    getTransferMock.mockResolvedValue(pausedTransfer);
    getAppealMock.mockResolvedValue(null);
    submitAppealMock.mockResolvedValue(null);

    render(<TransferDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Listing Actions")).toBeInTheDocument();
    });

    expect(getAppealMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(submitAppealMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalledWith("/auth/login");
  });
});
