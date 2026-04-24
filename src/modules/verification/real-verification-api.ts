import { apiRequest } from "@/lib/http-client";
import type {
  AddVerificationDocumentInput,
  PartnerVerification,
  ReplaceVerificationDocumentInput,
  VerificationApi,
} from "@/modules/verification/contracts";

type Envelope<T> = { data: T };

function buildDocumentFormData(input: AddVerificationDocumentInput | ReplaceVerificationDocumentInput) {
  const formData = new FormData();
  formData.set("category", input.category);
  if (!input.file) {
    throw new Error("Select a file to upload.");
  }
  formData.set("file", input.file);
  return formData;
}

export const realVerificationApi: VerificationApi = {
  async getVerification(userId: string) {
    const response = await apiRequest<Envelope<PartnerVerification>>(`/partners/${userId}/verification`);
    return response.data;
  },

  async addDocument(userId: string, input: AddVerificationDocumentInput) {
    const response = await apiRequest<Envelope<PartnerVerification>>(`/partners/${userId}/verification/documents`, {
      method: "POST",
      body: buildDocumentFormData(input),
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

  async replaceDocument(userId: string, documentId: string, input: ReplaceVerificationDocumentInput) {
    const response = await apiRequest<Envelope<PartnerVerification>>(
      `/partners/${userId}/verification/documents/${documentId}`,
      {
        method: "PUT",
        body: buildDocumentFormData(input),
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
