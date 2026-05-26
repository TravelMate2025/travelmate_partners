import { apiRequest } from "@/lib/http-client";
import type {
  OnboardingStepKey,
  PartnerOnboarding,
  PartnerProfileData,
  ProfileApi,
} from "@/modules/profile/contracts";

type Envelope<T> = { data: T };

export const realProfileApi: ProfileApi = {
  async getOnboarding(userId: string) {
    const response = await apiRequest<Envelope<PartnerOnboarding>>(`/partners/${userId}/onboarding`);
    return response.data;
  },

  async saveStep(userId: string, step: OnboardingStepKey, data: Partial<PartnerProfileData>) {
    const response = await apiRequest<Envelope<PartnerOnboarding>>(`/partners/${userId}/onboarding`, {
      method: "PATCH",
      body: { step, data },
    });

    return response.data;
  },

  async submitOnboarding(userId: string) {
    const response = await apiRequest<Envelope<PartnerOnboarding>>(
      `/partners/${userId}/onboarding/submit`,
      {
        method: "POST",
      },
    );

    return response.data;
  },

  async listGeographyCountries(userId: string, q?: string) {
    const query = new URLSearchParams();
    if (q && q.trim()) query.set("q", q.trim());
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiRequest<Envelope<string[]>>(`/partners/${userId}/geography/countries${suffix}`);
    return response.data;
  },

  async listGeographyAdminLevel1(userId: string, country: string, q?: string) {
    const query = new URLSearchParams();
    query.set("country", country);
    if (q && q.trim()) query.set("q", q.trim());
    const response = await apiRequest<Envelope<string[]>>(
      `/partners/${userId}/geography/admin-level-1?${query.toString()}`,
    );
    return response.data;
  },
};
