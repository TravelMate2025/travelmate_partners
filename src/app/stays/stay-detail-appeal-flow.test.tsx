import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import StayDetailPage from "@/app/stays/[stayId]/page";

const replaceMock = vi.fn();
let currentStayId = "stay-1";

vi.mock("next/navigation", () => ({
  useParams: () => ({ stayId: currentStayId }),
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => `/stays/${currentStayId}`,
}));

const meMock = vi.fn();
vi.mock("@/modules/auth/auth-client", () => ({
  authClient: {
    me: () => meMock(),
  },
}));

const onboardingMock = vi.fn();
vi.mock("@/modules/profile/profile-client", () => ({
  profileClient: {
    getOnboarding: () => onboardingMock(),
  },
}));

const verificationMock = vi.fn();
vi.mock("@/modules/verification/verification-client", () => ({
  verificationClient: {
    getVerification: () => verificationMock(),
  },
}));

vi.mock("@/components/common/use-toast-message", () => ({
  useToastMessage: () => undefined,
}));

vi.mock("@/modules/catalog/catalog-options-client", () => ({
  FALLBACK_SPACE_TYPES: [],
  fetchCatalogOptions: async () => ({
    propertyTypes: [],
    amenities: [],
    spaceTypes: [],
  }),
}));

const getStayMock = vi.fn();
const listStaysMock = vi.fn();
const getAppealMock = vi.fn();
const submitAppealMock = vi.fn();

vi.mock("@/modules/stays/stays-client", () => ({
  staysClient: {
    getStay: (...args: unknown[]) => getStayMock(...args),
    listStays: (...args: unknown[]) => listStaysMock(...args),
    getAppeal: (...args: unknown[]) => getAppealMock(...args),
    submitAppeal: (...args: unknown[]) => submitAppealMock(...args),
  },
}));

describe("Stay detail appeal flow", () => {
  it("does not auto-submit an appeal when opening a paused_by_admin listing", async () => {
    currentStayId = "stay-1";
    meMock.mockResolvedValue({ id: 101, role: "partner" });
    onboardingMock.mockResolvedValue({ status: "completed" });
    verificationMock.mockResolvedValue({ status: "approved" });
    getStayMock.mockResolvedValue({
      id: "stay-1",
      status: "paused_by_admin",
      name: "Lagoon View Suites",
      propertyType: "apartment",
      city: "Lagos",
      country: "Nigeria",
      amenities: [],
      images: [],
      rooms: [],
      description: "",
      address: "",
      moderationFeedback: "Policy review",
    });
    listStaysMock.mockResolvedValue([]);
    getAppealMock.mockResolvedValue(null);
    submitAppealMock.mockResolvedValue(null);

    render(<StayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Listing Actions")).toBeInTheDocument();
    });

    expect(getAppealMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(submitAppealMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalledWith("/auth/login");
  });

  it("clears stale appeal UI when navigating from suspended stay to live stay", async () => {
    currentStayId = "stay-1";
    meMock.mockResolvedValue({ id: 101, role: "partner" });
    onboardingMock.mockResolvedValue({ status: "completed" });
    verificationMock.mockResolvedValue({ status: "approved" });

    getStayMock.mockImplementation(async (_userId: string, stayId: string) => {
      if (stayId === "stay-1") {
        return {
          id: "stay-1",
          status: "paused_by_admin",
          name: "Lagoon View Suites",
          propertyType: "apartment",
          city: "Lagos",
          country: "Nigeria",
          amenities: [],
          images: [],
          rooms: [],
          description: "",
          address: "",
          moderationFeedback: "Policy review",
        };
      }
      return {
        id: "stay-2",
        status: "live",
        name: "Ocean View Suites",
        propertyType: "apartment",
        city: "Lagos",
        country: "Nigeria",
        amenities: [],
        images: [],
        rooms: [],
        description: "",
        address: "",
        moderationFeedback: "",
      };
    });
    listStaysMock.mockResolvedValue([]);
    getAppealMock.mockResolvedValue({
      id: "appeal-1",
      listingKind: "stay",
      listingId: "stay-1",
      partnerId: "101",
      message: "Please review.",
      status: "pending",
      resolution: null,
      resolutionNote: "",
      resolvedAt: null,
      createdAt: "2026-04-29T04:39:17Z",
      updatedAt: "2026-04-29T04:39:17Z",
    });

    const view = render(<StayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Existing appeal is pending review/i)).toBeInTheDocument();
    });

    currentStayId = "stay-2";
    view.rerender(<StayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Status: live")).toBeInTheDocument();
    });
    expect(screen.queryByText(/Existing appeal is pending review/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Submit Appeal/i)).not.toBeInTheDocument();
  });
});
