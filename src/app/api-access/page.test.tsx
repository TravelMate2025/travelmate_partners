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

describe("ApiAccessPage payment endpoints and responseFields", () => {
  it("renders payment endpoint cards with responseFields", async () => {
    getOverviewMock.mockResolvedValue({
      application: { id: "app-1", status: "approved", credentialMetadata: { revealAvailable: false } },
      statusOptions: ["approved"],
    });
    getCatalogMock.mockResolvedValue({
      access: {
        environment: "production",
        keyStatus: "active",
        scopes: ["payments.read", "payments.write"],
        productLanes: ["bookings"],
        status: "approved",
      },
      endpoints: [
        {
          id: "payments-intents-create",
          method: "POST",
          path: "/api/v1/public/payments/intents",
          productLane: "bookings",
          requiredScope: "payments.write",
          environments: ["sandbox", "production"],
          description: "Create a payment intent for booking checkout.",
          responseFields: ["paymentIntentId", "paymentLink", "flutterwaveRef", "nextAction", "status"],
        },
        {
          id: "payments-intents-read",
          method: "GET",
          path: "/api/v1/public/payments/intents/{id}",
          productLane: "bookings",
          requiredScope: "payments.read",
          environments: ["sandbox", "production"],
          description: "Read the current status of a payment intent.",
          responseFields: ["paymentIntentId", "status", "paymentState", "flutterwaveRef"],
        },
      ],
      policyExplainer: { blockedGuidance: "", scopeGuide: [] },
    });

    render(<ApiAccessPage />);

    await waitFor(() => {
      expect(screen.getByText(/Create a payment intent for booking checkout/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/paymentIntentId, paymentLink, flutterwaveRef, nextAction, status/)).toBeInTheDocument();
    expect(screen.getByText(/paymentIntentId, status, paymentState, flutterwaveRef/)).toBeInTheDocument();
    expect(screen.getByText(/POST \/api\/v1\/public\/payments\/intents/)).toBeInTheDocument();
    expect(screen.getByText(/GET \/api\/v1\/public\/payments\/intents\/{id}/)).toBeInTheDocument();
  });

  it("does not render responseFields line when endpoint has no responseFields", async () => {
    getOverviewMock.mockResolvedValue({
      application: { id: "app-2", status: "approved", credentialMetadata: { revealAvailable: false } },
      statusOptions: ["approved"],
    });
    getCatalogMock.mockResolvedValue({
      access: {
        environment: "sandbox",
        keyStatus: "active",
        scopes: ["inventory.read"],
        productLanes: ["stays"],
        status: "approved",
      },
      endpoints: [
        {
          id: "stays-search",
          method: "GET",
          path: "/api/v1/catalog/stays",
          productLane: "stays",
          requiredScope: "inventory.read",
          environments: ["sandbox", "production"],
          description: "List stays with core inventory metadata.",
        },
      ],
      policyExplainer: { blockedGuidance: "", scopeGuide: [] },
    });

    render(<ApiAccessPage />);

    await waitFor(() => {
      expect(screen.getByText(/List stays with core inventory metadata/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Response fields:/i)).toBeNull();
  });

  it("shows payments scopes in the scopes line", async () => {
    getOverviewMock.mockResolvedValue({
      application: { id: "app-3", status: "approved", credentialMetadata: { revealAvailable: false } },
      statusOptions: ["approved"],
    });
    getCatalogMock.mockResolvedValue({
      access: {
        environment: "production",
        keyStatus: "active",
        scopes: ["inventory.read", "payments.read", "payments.write"],
        productLanes: ["stays", "bookings"],
        status: "approved",
      },
      endpoints: [],
      policyExplainer: { blockedGuidance: "", scopeGuide: [] },
    });

    render(<ApiAccessPage />);

    await waitFor(() => {
      expect(screen.getByText(/inventory.read, payments.read, payments.write/i)).toBeInTheDocument();
    });
  });

  it("renders corrected curl snippets for catalog fallback and quote examples", async () => {
    getOverviewMock.mockResolvedValue({
      application: { id: "app-4", status: "approved", credentialMetadata: { revealAvailable: false } },
      statusOptions: ["approved"],
    });
    getCatalogMock.mockResolvedValue({
      access: {
        environment: "production",
        keyStatus: "active",
        scopes: ["bookings.write"],
        productLanes: ["bookings"],
        status: "approved",
      },
      endpoints: [],
      policyExplainer: { blockedGuidance: "", scopeGuide: [] },
    });

    render(<ApiAccessPage />);

    await waitFor(() => {
      expect(screen.getByText(/Start with key introspection/i)).toBeInTheDocument();
    });

    const snippets = screen.getAllByText((content, node) => {
      if (node?.tagName !== "PRE") {
        return false;
      }
      return content.includes("curl -sS");
    });

    expect(snippets.some((node) => node.textContent?.includes("http://localhost:8000/api/v1/public/catalog"))).toBe(true);
    expect(snippets.some((node) => node.textContent?.includes("/api/v1/api/v1/public/catalog"))).toBe(false);

    const quoteSnippet = snippets.find((node) => node.textContent?.includes("/public/bookings/quote"));
    expect(quoteSnippet?.textContent).toContain('"cancellationOptionId":"FREE_CANCELLATION"');
    expect(quoteSnippet?.textContent).not.toContain('"baseAmount"');
    expect(quoteSnippet?.textContent).not.toContain('"taxAmount"');
    expect(quoteSnippet?.textContent).not.toContain('"feeAmount"');
  });

  it("does not crash when catalog payload is partial", async () => {
    getOverviewMock.mockResolvedValue({
      application: { id: "app-5", status: "approved", credentialMetadata: { revealAvailable: false } },
      statusOptions: ["approved"],
    });
    getCatalogMock.mockResolvedValue({
      endpoints: [],
    });

    render(<ApiAccessPage />);

    await waitFor(() => {
      expect(screen.getByText(/Authorized endpoints: 0/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Environment: Not assigned/i)).toBeInTheDocument();
    expect(screen.getByText(/Key status: Not issued/i)).toBeInTheDocument();
    expect(screen.getByText(/Scopes: None/i)).toBeInTheDocument();
    expect(screen.getByText(/Products: None/i)).toBeInTheDocument();
  });
});

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
