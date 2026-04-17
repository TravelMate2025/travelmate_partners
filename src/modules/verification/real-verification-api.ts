import { apiRequest } from "@/lib/http-client";
import type {
  AddVerificationDocumentInput,
  PartnerVerification,
  VerificationApi,
} from "@/modules/verification/contracts";

type Envelope<T> = { data: T };

export const realVerificationApi: VerificationApi = {
  async getVerification(userId: string) {
    const response = await apiRequest<Envelope<PartnerVerification>>(`/partners/${userId}/verification`);
    return response.data;
  },

  async addDocument(userId: string, input: AddVerificationDocumentInput) {
    const response = await apiRequest<Envelope<PartnerVerification>>(`/partners/${userId}/verification/documents`, {
      method: "POST",
      body: input,
    });

    return response.data;
  },

  async removeDocument(userId: string, documentId: string) {
    const response = await apiRequest<Envelope<PartnerVerification>>(
      `/partners/${userId}/verification/documents/${documentId}`,
      {
        method: "DELETE",
      },
    );

    return response.data;
  },

  async submitVerification(userId: string) {
    const response = await apiRequest<Envelope<PartnerVerification>>(
      `/partners/${userId}/verification/submit`,
      {
        method: "POST",
      },
    );

    return response.data;
  },
};
