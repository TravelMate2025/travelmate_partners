import { apiRequest } from "@/lib/http-client";
import type {
  CreateTransferInput,
  TransferListing,
  TransferStatus,
  TransfersApi,
  UpdateTransferInput,
} from "@/modules/transfers/contracts";

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

  async archiveTransfer(userId, transferId) {
    const response = await apiRequest<Envelope<TransferListing>>(
      `/partners/${userId}/transfers/${transferId}/archive`,
      {
        method: "POST",
      },
    );
    return response.data;
  },
};
