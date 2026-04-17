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
};
