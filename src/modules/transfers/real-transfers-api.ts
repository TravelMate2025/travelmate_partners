import { apiRequest } from "@/lib/http-client";
import type {
  AddTransferImageInput,
  CreateTransferInput,
  ReplaceTransferImageInput,
  TransferListing,
  TransferStatus,
  TransfersApi,
  UpdateTransferInput,
} from "@/modules/transfers/contracts";
import type { ListingAppeal } from "@/modules/stays/contracts";

type Envelope<T> = { data: T };

export const realTransfersApi: TransfersApi = {
  async listTransfers(userId) {
    const response = await apiRequest<Envelope<TransferListing[]>>(
      `/partners/${userId}/transfers`,
    );
    return response.data;
  },

  async getTransfer(userId, transferId) {
    const response = await apiRequest<Envelope<TransferListing>>(
      `/partners/${userId}/transfers/${transferId}`,
    );
    return response.data;
  },

  async createTransfer(userId, input: CreateTransferInput) {
    const response = await apiRequest<Envelope<TransferListing>>(
      `/partners/${userId}/transfers`,
      {
        method: "POST",
        body: input,
      },
    );
    return response.data;
  },

  async updateTransfer(userId, transferId, input: UpdateTransferInput) {
    const response = await apiRequest<Envelope<TransferListing>>(
      `/partners/${userId}/transfers/${transferId}`,
      {
        method: "PATCH",
        body: input,
      },
    );
    return response.data;
  },

  async updateStatus(userId, transferId, status: TransferStatus) {
    const response = await apiRequest<Envelope<TransferListing>>(
      `/partners/${userId}/transfers/${transferId}/status`,
      {
        method: "POST",
        body: { status },
      },
    );
    return response.data;
  },

  async addImage(userId, transferId, input: AddTransferImageInput) {
    const formData = new FormData();
    formData.append("fileName", input.fileName);
    formData.append("fileType", input.fileType);
    formData.append("fileSize", String(input.fileSize));
    if (input.file) {
      formData.append("file", input.file);
    }
    const response = await apiRequest<Envelope<TransferListing>>(
      `/partners/${userId}/transfers/${transferId}/images`,
      {
        method: "POST",
        body: formData,
      },
    );
    return response.data;
  },

  async replaceImage(userId, transferId, imageId, input: ReplaceTransferImageInput) {
    const formData = new FormData();
    formData.append("fileName", input.fileName);
    formData.append("fileType", input.fileType);
    formData.append("fileSize", String(input.fileSize));
    if (input.file) {
      formData.append("file", input.file);
    }
    const response = await apiRequest<Envelope<TransferListing>>(
      `/partners/${userId}/transfers/${transferId}/images/${imageId}`,
      {
        method: "PUT",
        body: formData,
      },
    );
    return response.data;
  },

  async removeImage(userId, transferId, imageId) {
    const response = await apiRequest<Envelope<TransferListing>>(
      `/partners/${userId}/transfers/${transferId}/images/${imageId}`,
      {
        method: "DELETE",
      },
    );
    return response.data;
  },

  async reorderImages(userId, transferId, imageIds) {
    const response = await apiRequest<Envelope<TransferListing>>(
      `/partners/${userId}/transfers/${transferId}/images/reorder`,
      {
        method: "POST",
        body: { imageIds },
      },
    );
    return response.data;
  },

  async archiveTransfer(userId, transferId) {
    const response = await apiRequest<Envelope<TransferListing>>(
      `/partners/${userId}/transfers/${transferId}/archive`,
      {
        method: "POST",
      },
    );
    return response.data;
  },

  async submitAppeal(userId, transferId, message) {
    const response = await apiRequest<Envelope<ListingAppeal>>(
      `/partners/${userId}/transfers/${transferId}/appeal`,
      {
        method: "POST",
        headers: { "X-TravelMate-Intent": "submit_listing_appeal" },
        body: { message },
      },
    );
    return response.data;
  },

  async getAppeal(userId, transferId) {
    try {
      const response = await apiRequest<Envelope<ListingAppeal>>(
        `/partners/${userId}/transfers/${transferId}/appeal`,
        { method: "GET" },
      );
      return response.data;
    } catch {
      return null;
    }
  },
};
