import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ApiAccessPage from "@/app/api-access/page";

vi.mock("@/components/common/use-toast-message", () => ({
  useToastMessage: () => undefined,
}));

vi.mock("@/components/common/use-partner-access", () => ({
  usePartnerAccess: () => ({
    user: { id: "101" },
    loading: false,
  }),
}));

vi.mock("@/components/common/partner-shell", () => ({
  PartnerShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/config", () => ({
  appConfig: {
    apiBaseUrl: "http://localhost:8000/api/v1",
  },
}));

const getOverviewMock = vi.fn();
const getCatalogMock = vi.fn();
const revealSecretMock = vi.fn();
const submitApplicationMock = vi.fn();

vi.mock("@/modules/api-access/api-access-client", () => ({
  apiAccessClient: {
    getOverview: (...args: unknown[]) => getOverviewMock(...args),
    getCatalog: (...args: unknown[]) => getCatalogMock(...args),
    revealSecret: (...args: unknown[]) => revealSecretMock(...args),
    submitApplication: (...args: unknown[]) => submitApplicationMock(...args),
  },
}));

describe("ApiAccessPage overflow hardening", () => {
  it("keeps long credentials and endpoint paths wrapped within the panel", async () => {
    getOverviewMock.mockResolvedValue({
      application: {
        id: "app_with_a_very_long_identifier_that_should_wrap_without_overflow_xxxxxxxxxxxxxxxxxxxxxxxxx",
        status: "approved",
        partnerPolicy: {
          environment: "production",
          tier: "enterprise_tier_with_extra_long_label_xxxxxxxxxxxxx",
          alertProfile: "critical_partner_alert_profile_with_long_name_xxxxxxxxxxxxx",
        },
        pendingPolicyChange: {
          plan: "future_enterprise_plan_with_a_long_name_xxxxxxxxxxxxx",
          rateLimitPerMinute: 600,
          effectiveAt: "2026-05-10T00:00:00Z",
        },
        credentialMetadata: {
          revealAvailable: true,
        },
      },
      statusOptions: ["approved"],
    });
    getCatalogMock.mockResolvedValue({
      access: {
        environment: "production",
        keyStatus: "active",
        scopes: ["bookings.read"],
        productLanes: ["stays"],
        status: "approved",
      },
      endpoints: [
        {
          id: "ep-1",
          method: "GET",
          path: "/public/catalog/stays/very/long/segment/that/can/overflow/without/wrapping/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          productLane: "stays",
          requiredScope: "catalog.read",
          environments: ["production"],
          description: "Endpoint description",
        },
      ],
      policyExplainer: {
        blockedGuidance: "",
        scopeGuide: [],
      },
    });
    revealSecretMock.mockResolvedValue({
      keyId: "tm_key_very_long_identifier_that_should_wrap_in_ui_xxxxxxxxxxxxxxxxxxxxxxxxx",
      clientSecret:
        "tm_secret_very_long_secret_value_that_should_wrap_in_ui_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      issuedAt: "2026-05-10T00:00:00Z",
      warning: "Shown once",
    });

    render(<ApiAccessPage />);

    await waitFor(() => {
      expect(screen.getByText("Application Status")).toBeInTheDocument();
    });

    const revealButton = screen.getByRole("button", { name: /Reveal API Credentials/i });
    fireEvent.click(revealButton);

    await waitFor(() => {
      expect(screen.getByText(/Client Secret:/i)).toBeInTheDocument();
    });

    const secretLine = screen.getByText(/Client Secret:/i);
    expect(secretLine.className).toContain("break-all");

    const applicationStatusLine = screen.getByText(/Application app_with_a_very_long_identifier/i);
    expect(applicationStatusLine.className).toContain("break-words");

    const policyLine = screen.getByText(/enterprise_tier_with_extra_long_label/i);
    expect(policyLine.className).toContain("break-words");

    const endpointMatches = screen.getAllByText(
      /\/public\/catalog\/stays\/very\/long\/segment\/that\/can\/overflow/i,
    );
    const wrappedEndpoint = endpointMatches.find((item) => item.className.includes("break-all"));
    expect(wrappedEndpoint).toBeTruthy();
  });
});
