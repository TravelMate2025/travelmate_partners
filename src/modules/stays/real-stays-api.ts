import { apiRequest } from "@/lib/http-client";
import type {
  AddStayImageInput,
  CreateStayInput,
  ListingAppeal,
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
    const formData = new FormData();
    formData.append("fileName", input.fileName);
    formData.append("fileType", input.fileType);
    formData.append("fileSize", String(input.fileSize));
    if (input.roomId !== undefined) {
      formData.append("roomId", input.roomId === null ? "" : input.roomId);
    }
    if (input.spaceType !== undefined) {
      formData.append("spaceType", input.spaceType === null ? "" : input.spaceType);
    }
    if (input.file) {
      formData.append("file", input.file);
    }
    const response = await apiRequest<Envelope<StayListing>>(
      `/partners/${userId}/stays/${stayId}/images`,
      {
        method: "POST",
        body: formData,
      },
    );
    return response.data;
  },

  async replaceImage(userId, stayId, imageId, input: ReplaceStayImageInput) {
    const formData = new FormData();
    formData.append("fileName", input.fileName);
    formData.append("fileType", input.fileType);
    formData.append("fileSize", String(input.fileSize));
    if (input.spaceType !== undefined) {
      formData.append("spaceType", input.spaceType === null ? "" : input.spaceType);
    }
    if (input.file) {
      formData.append("file", input.file);
    }
    const response = await apiRequest<Envelope<StayListing>>(
      `/partners/${userId}/stays/${stayId}/images/${imageId}`,
      {
        method: "PUT",
        body: formData,
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

  async assignImageToRoom(userId, stayId, imageId, roomId) {
    const response = await apiRequest<Envelope<StayListing>>(
      `/partners/${userId}/stays/${stayId}/images/${imageId}/room`,
      {
        method: "PATCH",
        body: { roomId },
      },
    );
    return response.data;
  },

  async assignImageSpaceType(userId, stayId, imageId, spaceType) {
    const response = await apiRequest<Envelope<StayListing>>(
      `/partners/${userId}/stays/${stayId}/images/${imageId}/space-type`,
      {
        method: "PATCH",
        body: { spaceType },
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

  async submitAppeal(userId, stayId, message) {
    const response = await apiRequest<Envelope<ListingAppeal>>(
      `/partners/${userId}/stays/${stayId}/appeal`,
      {
        method: "POST",
        headers: { "X-TravelMate-Intent": "submit_listing_appeal" },
        body: { message },
      },
    );
    return response.data;
  },

  async getAppeal(userId, stayId) {
    try {
      const response = await apiRequest<Envelope<ListingAppeal>>(
        `/partners/${userId}/stays/${stayId}/appeal`,
        { method: "GET" },
      );
      return response.data;
    } catch {
      return null;
    }
  },
};
