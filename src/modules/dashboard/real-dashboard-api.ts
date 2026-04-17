import { apiRequest } from "@/lib/http-client";
import type { DashboardApi, PartnerDashboardData, QuickActionType } from "@/modules/dashboard/contracts";

type Envelope<T> = { data: T };

export const realDashboardApi: DashboardApi = {
  async getDashboard(userId: string) {
    const response = await apiRequest<Envelope<PartnerDashboardData>>(`/partners/${userId}/dashboard`);
    return response.data;
  },

  async recordQuickAction(userId: string, action: QuickActionType) {
    const response = await apiRequest<Envelope<PartnerDashboardData>>(
      `/partners/${userId}/dashboard/quick-actions`,
      {
        method: "POST",
        body: { action },
      },
    );

    return response.data;
  },
};
