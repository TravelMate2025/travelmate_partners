import { apiRequest } from "@/lib/http-client";
import type {
  ApiAccessApi,
  PartnerApiCatalog,
  PartnerApiAccessOverview,
  PartnerApiClientApplication,
  SubmitPartnerApiApplicationInput,
} from "@/modules/api-access/contracts";

type Envelope<T> = { data: T };

export const realApiAccessApi: ApiAccessApi = {
  async getOverview(userId: string) {
    const response = await apiRequest<Envelope<PartnerApiAccessOverview>>(
      `/partners/${userId}/api-client-application`,
    );
    return response.data;
  },
  async getCatalog(userId: string) {
    const response = await apiRequest<Envelope<PartnerApiCatalog>>(
      `/partners/${userId}/api-client-catalog`,
    );
    return response.data;
  },

  async submitApplication(userId: string, input: SubmitPartnerApiApplicationInput) {
    const response = await apiRequest<Envelope<PartnerApiClientApplication>>(
      `/partners/${userId}/api-client-application`,
      {
        method: "POST",
        body: input,
      },
    );
    return response.data;
  },
  async revealSecret(userId: string) {
    const response = await apiRequest<Envelope<{ keyId: string; clientSecret: string; issuedAt: string; warning: string }>>(
      `/partners/${userId}/api-client-application/reveal-secret`,
      {
        method: "POST",
      },
    );
    return response.data;
  },
};
