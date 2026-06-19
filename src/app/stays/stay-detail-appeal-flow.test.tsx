import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    listGeographyCities: vi.fn().mockResolvedValue([]),
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
const updateStayMock = vi.fn();
const updateStatusMock = vi.fn();

vi.mock("@/modules/stays/stays-client", () => ({
  staysClient: {
    getStay: (...args: unknown[]) => getStayMock(...args),
    listStays: (...args: unknown[]) => listStaysMock(...args),
    getAppeal: (...args: unknown[]) => getAppealMock(...args),
    submitAppeal: (...args: unknown[]) => submitAppealMock(...args),
    updateStay: (...args: unknown[]) => updateStayMock(...args),
    updateStatus: (...args: unknown[]) => updateStatusMock(...args),
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

  it("saves the current draft details before submitting for review", async () => {
    currentStayId = "stay-3";
    meMock.mockResolvedValue({ id: 101, role: "partner" });
    onboardingMock.mockResolvedValue({ status: "completed" });
    verificationMock.mockResolvedValue({ status: "approved" });
    getStayMock.mockResolvedValue({
      id: "stay-3",
      status: "draft",
      name: "Lagoon View Suites",
      propertyType: "apartment",
      city: "Lagos",
      country: "Nigeria",
      amenities: [],
      images: [],
      rooms: [],
      description: "",
      address: "",
      moderationFeedback: "",
      houseRules: "",
      checkInTime: "",
      checkOutTime: "",
      cancellationPolicy: "",
      adminLevel1: "Lagos State",
      area: "VI",
    });
    listStaysMock.mockResolvedValue([]);
    getAppealMock.mockResolvedValue(null);
    submitAppealMock.mockResolvedValue(null);
    updateStayMock.mockImplementation(async (_userId: string, _stayId: string, input: Record<string, unknown>) => ({
      id: "stay-3",
      status: "draft",
      name: String(input.name ?? ""),
      propertyType: String(input.propertyType ?? ""),
      city: String(input.city ?? ""),
      country: String(input.country ?? ""),
      adminLevel1: String(input.adminLevel1 ?? ""),
      area: String(input.area ?? ""),
      description: String(input.description ?? ""),
      address: String(input.address ?? ""),
      amenities: Array.isArray(input.amenities) ? input.amenities : [],
      images: [],
      rooms: [],
      houseRules: String(input.houseRules ?? ""),
      checkInTime: String(input.checkInTime ?? ""),
      checkOutTime: String(input.checkOutTime ?? ""),
      cancellationPolicy: String(input.cancellationPolicy ?? ""),
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    }));
    updateStatusMock.mockResolvedValue({
      id: "stay-3",
      status: "pending",
      name: "Lagoon View Suites",
      propertyType: "apartment",
      city: "Lagos",
      country: "Nigeria",
      amenities: [],
      images: [],
      rooms: [],
      description: "Ocean-facing suites",
      address: "12 Marina Road",
      moderationFeedback: "",
      houseRules: "",
      checkInTime: "",
      checkOutTime: "",
      cancellationPolicy: "",
      adminLevel1: "Lagos State",
      area: "VI",
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });

    render(<StayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Listing Actions")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Description"), {
      target: { value: "Ocean-facing suites" },
    });
    fireEvent.change(screen.getByPlaceholderText("Address"), {
      target: { value: "12 Marina Road" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));

    await waitFor(() => {
      expect(updateStayMock).toHaveBeenCalled();
      expect(updateStatusMock).toHaveBeenCalledWith(101, "stay-3", "pending");
    });

    const [, , payload] = updateStayMock.mock.calls.at(-1) as [string, string, Record<string, unknown>];
    expect(payload.description).toBe("Ocean-facing suites");
    expect(payload.address).toBe("12 Marina Road");
  });
});
