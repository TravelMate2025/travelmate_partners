export type OnboardingStepKey = "business" | "contact" | "operations";

export type PartnerProfileData = {
  businessType: "individual" | "agency" | "business" | "";
  legalName: string;
  tradeName: string;
  registrationNumber: string;
  primaryContactName: string;
  primaryContactEmail: string;
  supportContactEmail: string;
  operatingCountries: string[];
  operatingRegions: string[];
  operatingCities: string[];
  operatingCoverage?: Array<{ country: string; adminLevel1: string; city: string }>;
  coverageNotes: string;
  payoutMethod: "bank_transfer" | "mobile_money" | "";
  settlementCurrency: "GBP" | "NGN" | "USD" | "";
  payoutSchedule: "manual" | "daily" | "weekly" | "";
  settlementTrigger?: "service_completion";
};

export type PartnerLocationOptions = {
  supportedCountries: string[];
  regionsByCountry: Record<string, string[]>;
  citiesByCountryRegion: Record<string, Record<string, string[]>>;
};

export type PartnerOnboarding = {
  userId: string;
  data: PartnerProfileData;
  options?: PartnerLocationOptions;
  completedSteps: OnboardingStepKey[];
  status: "not_started" | "in_progress" | "completed";
  updatedAt: string;
};

export type ProfileApi = {
  getOnboarding(userId: string): Promise<PartnerOnboarding>;
  saveStep(userId: string, step: OnboardingStepKey, data: Partial<PartnerProfileData>): Promise<PartnerOnboarding>;
  submitOnboarding(userId: string): Promise<PartnerOnboarding>;
  listGeographyCountries(userId: string, q?: string): Promise<string[]>;
  listGeographyAdminLevel1(userId: string, country: string, q?: string): Promise<string[]>;
};
