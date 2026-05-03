export type PartnerApiClientStatus =
  | "no_application"
  | "pending_review"
  | "under_review"
  | "approved"
  | "rejected"
  | "blocked";

export type PartnerApiClientApplication = {
  id: string;
  companyName: string;
  applicantName: string;
  email: string;
  useCase: string;
  region: string;
  status: Exclude<PartnerApiClientStatus, "no_application">;
  plan: "starter" | "growth" | "enterprise";
  keyStatus: "not_issued" | "active" | "revoked";
  riskLevel: "low" | "medium" | "high";
  submittedAt: string;
  approvedAt: string | null;
  usage: {
    monthlyRequests: number;
    rateLimitPerMinute: number;
    errorRatePercent: number;
    lastActiveAt: string;
  };
  requestedRateLimitPerMinute: number;
  note: string;
  partnerPolicy?: {
    environment: "sandbox" | "production";
    tier: "standard" | "elevated" | "strategic";
    alertProfile: "balanced" | "strict" | "critical_only";
  };
  credentialMetadata?: {
    keyId: string | null;
    secretFingerprint: string | null;
    issuedAt: string | null;
    rotatedAt: string | null;
    revokedAt: string | null;
    revealConsumedAt: string | null;
    revealExpiresAt: string | null;
    revealAvailable: boolean;
  };
  limitState?: {
    isOverLimit: boolean;
    retryAfterSeconds: number;
    warning: string;
  };
  pendingPolicyChange?: {
    effectiveAt: string | null;
    plan: "starter" | "growth" | "enterprise" | null;
    rateLimitPerMinute: number | null;
  };
};

export type PartnerApiAccessOverview = {
  application: PartnerApiClientApplication | null;
  statusOptions: PartnerApiClientStatus[];
};

export type PartnerApiCatalogEndpoint = {
  id: string;
  productLane: "stays" | "transfers" | "bookings";
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  requiredScope: "inventory.read" | "pricing.read" | "bookings.read";
  environments: Array<"sandbox" | "production">;
  description: string;
};

export type PartnerApiCatalog = {
  access: {
    status: PartnerApiClientStatus;
    environment: "sandbox" | "production" | null;
    scopes: Array<"inventory.read" | "pricing.read" | "bookings.read">;
    productLanes: Array<"stays" | "transfers">;
    keyStatus: "not_issued" | "active" | "revoked" | null;
  };
  endpoints: PartnerApiCatalogEndpoint[];
  policyExplainer?: {
    scopeGuide: Array<{
      scope: "inventory.read" | "pricing.read" | "bookings.read";
      description: string;
      endpointCount: number;
      endpoints: string[];
    }>;
    blockedGuidance: string;
  };
};

export type SubmitPartnerApiApplicationInput = {
  companyName: string;
  applicantName: string;
  email: string;
  useCase: string;
  region: string;
  requestedRateLimitPerMinute: number;
};

export type ApiAccessApi = {
  getOverview(userId: string): Promise<PartnerApiAccessOverview>;
  getCatalog(userId: string): Promise<PartnerApiCatalog>;
  submitApplication(userId: string, input: SubmitPartnerApiApplicationInput): Promise<PartnerApiClientApplication>;
  revealSecret(userId: string): Promise<{ keyId: string; clientSecret: string; issuedAt: string; warning: string }>;
};
