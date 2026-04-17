import { apiRequest } from "@/lib/http-client";
import type {
  PartnerSettings,
  SubmitSupportTicketInput,
  SupportSettingsApi,
  SupportTicket,
  UpdatePartnerSettingsInput,
} from "@/modules/support-settings/contracts";

type Envelope<T> = { data: T };

export const realSupportSettingsApi: SupportSettingsApi = {
  async getSettings(userId: string) {
    const response = await apiRequest<Envelope<PartnerSettings>>(
      `/partners/${userId}/settings`,
    );
    return response.data;
  },

  async updateSettings(userId: string, input: UpdatePartnerSettingsInput) {
    const response = await apiRequest<Envelope<PartnerSettings>>(
      `/partners/${userId}/settings`,
      {
        method: "PATCH",
        body: input,
      },
    );
    return response.data;
  },

  async listSupportTickets(userId: string) {
    const response = await apiRequest<Envelope<SupportTicket[]>>(
      `/partners/${userId}/support/tickets`,
    );
    return response.data;
  },

  async submitSupportTicket(userId: string, input: SubmitSupportTicketInput) {
    const response = await apiRequest<Envelope<SupportTicket[]>>(
      `/partners/${userId}/support/tickets`,
      {
        method: "POST",
        body: input,
      },
    );
    return response.data;
  },

  async requestDeactivation(userId: string, input) {
    const response = await apiRequest<Envelope<PartnerSettings>>(
      `/partners/${userId}/settings/deactivation`,
      {
        method: "POST",
        body: input,
      },
    );
    return response.data;
  },
};
