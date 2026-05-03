import type {
  ApiAccessApi,
  PartnerApiCatalog,
  PartnerApiAccessOverview,
  PartnerApiClientApplication,
  SubmitPartnerApiApplicationInput,
} from "@/modules/api-access/contracts";

const STORAGE_KEY = "tm_partner_api_access_application_v1";

function readStorage(userId: string): PartnerApiClientApplication | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}:${userId}`);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PartnerApiClientApplication;
  } catch {
    return null;
  }
}

function writeStorage(userId: string, value: PartnerApiClientApplication) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(value));
}

export const mockApiAccessApi: ApiAccessApi = {
  async getOverview(userId: string) {
    const application = readStorage(userId);
    return {
      application,
      statusOptions: ["no_application", "pending_review", "under_review", "approved", "rejected", "blocked"],
    } satisfies PartnerApiAccessOverview;
  },
  async getCatalog(userId: string) {
    const application = readStorage(userId);
    if (!application) {
      return {
        access: {
          status: "no_application",
          environment: null,
          scopes: [],
          productLanes: [],
          keyStatus: null,
        },
        endpoints: [],
        policyExplainer: {
          scopeGuide: [],
          blockedGuidance: "Submit and approve an API client application to unlock endpoint access.",
        },
      } satisfies PartnerApiCatalog;
    }
    return {
      access: {
        status: application.status,
        environment: application.partnerPolicy?.environment ?? "sandbox",
        scopes: ["inventory.read", "pricing.read", "bookings.read"],
        productLanes: ["stays", "transfers"],
        keyStatus: application.keyStatus,
      },
      endpoints:
        application.status === "approved"
          ? [
              {
                id: "stays-search",
                productLane: "stays",
                method: "GET",
                path: "/api/v1/catalog/stays",
                requiredScope: "inventory.read",
                environments: ["sandbox", "production"],
                description: "List stays with core inventory metadata for storefront search.",
              },
              {
                id: "transfers-search",
                productLane: "transfers",
                method: "GET",
                path: "/api/v1/catalog/transfers",
                requiredScope: "inventory.read",
                environments: ["sandbox", "production"],
                description: "List transfer products for route pickup and drop-off coverage.",
              },
            ]
          : [],
      policyExplainer: {
        scopeGuide: [
          {
            scope: "inventory.read",
            description: "Read stays and transfers inventory metadata.",
            endpointCount: 2,
            endpoints: ["/api/v1/catalog/stays", "/api/v1/catalog/transfers"],
          },
        ],
        blockedGuidance: "All configured product lanes currently have matching scope coverage.",
      },
    } satisfies PartnerApiCatalog;
  },

  async submitApplication(userId: string, input: SubmitPartnerApiApplicationInput) {
    const existing = readStorage(userId);
    if (existing && (existing.status === "pending_review" || existing.status === "approved")) {
      throw new Error("An active API client application already exists for this partner.");
    }

    const next: PartnerApiClientApplication = {
      id: `api-client-${Date.now()}`,
      companyName: input.companyName,
      applicantName: input.applicantName,
      email: input.email,
      useCase: input.useCase,
      region: input.region || "Global",
      status: "pending_review",
      plan: "starter",
      keyStatus: "not_issued",
      riskLevel: "medium",
      submittedAt: new Date().toISOString(),
      approvedAt: null,
      usage: {
        monthlyRequests: 0,
        rateLimitPerMinute: input.requestedRateLimitPerMinute,
        errorRatePercent: 0,
        lastActiveAt: "Not active yet",
      },
      requestedRateLimitPerMinute: input.requestedRateLimitPerMinute,
      note: "",
    };
    writeStorage(userId, next);
    return next;
  },
  async revealSecret(_userId: string) {
    throw new Error("One-time credential reveal is only available in real API mode.");
  },
};
