import { apiRequest } from "@/lib/http-client";
import type {
  AddStayImageInput,
  CreateStayInput,
  ReplaceStayImageInput,
  StayListing,
  StayStatus,
  StaysApi,
  UpdateStayInput,
  UpsertStayRoomInput,
} from "@/modules/stays/contracts";

type Envelope<T> = { data: T };

export const realStaysApi: StaysApi = {
  async listStays(userId) {
    const response = await apiRequest<Envelope<StayListing[]>>(`/partners/${userId}/stays`);
    return response.data;
  },

  async getStay(userId, stayId) {
    const response = await apiRequest<Envelope<StayListing>>(`/partners/${userId}/stays/${stayId}`);
    return response.data;
  },

  async createStay(userId, input: CreateStayInput) {
    const response = await apiRequest<Envelope<StayListing>>(`/partners/${userId}/stays`, {
      method: "POST",
      body: input,
    });
    return response.data;
  },

  async updateStay(userId, stayId, input: UpdateStayInput) {
    const response = await apiRequest<Envelope<StayListing>>(`/partners/${userId}/stays/${stayId}`, {
      method: "PATCH",
      body: input,
    });
    return response.data;
  },

  async updateStatus(userId, stayId, status: StayStatus) {
    const response = await apiRequest<Envelope<StayListing>>(
      `/partners/${userId}/stays/${stayId}/status`,
      {
        method: "POST",
        body: { status },
      },
    );
    return response.data;
  },

  async addImage(userId, stayId, input: AddStayImageInput) {
    const response = await apiRequest<Envelope<StayListing>>(
      `/partners/${userId}/stays/${stayId}/images`,
      {
        method: "POST",
        body: input,
      },
    );
    return response.data;
  },

  async replaceImage(userId, stayId, imageId, input: ReplaceStayImageInput) {
    const response = await apiRequest<Envelope<StayListing>>(
      `/partners/${userId}/stays/${stayId}/images/${imageId}`,
      {
        method: "PUT",
        body: input,
      },
    );
    return response.data;
  },

  async removeImage(userId, stayId, imageId) {
    const response = await apiRequest<Envelope<StayListing>>(
      `/partners/${userId}/stays/${stayId}/images/${imageId}`,
      {
        method: "DELETE",
      },
    );
    return response.data;
  },

  async reorderImages(userId, stayId, imageIds) {
    const response = await apiRequest<Envelope<StayListing>>(
      `/partners/${userId}/stays/${stayId}/images/reorder`,
      {
        method: "POST",
        body: { imageIds },
      },
    );
    return response.data;
  },

  async upsertRoom(userId, stayId, input: UpsertStayRoomInput) {
    const response = await apiRequest<Envelope<StayListing>>(`/partners/${userId}/stays/${stayId}/rooms`, {
      method: "POST",
      body: input,
    });
    return response.data;
  },

  async removeRoom(userId, stayId, roomId) {
    const response = await apiRequest<Envelope<StayListing>>(
      `/partners/${userId}/stays/${stayId}/rooms/${roomId}`,
      {
        method: "DELETE",
      },
    );
    return response.data;
  },

  async archiveStay(userId, stayId) {
    const response = await apiRequest<Envelope<StayListing>>(`/partners/${userId}/stays/${stayId}/archive`, {
      method: "POST",
    });
    return response.data;
  },
};
