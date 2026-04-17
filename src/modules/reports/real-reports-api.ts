import { apiRequest } from "@/lib/http-client";
import type { ReportsApi, ReportsSummary } from "@/modules/reports/contracts";

type Envelope<T> = { data: T };

export const realReportsApi: ReportsApi = {
  async getSummary(userId: string, fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) {
      params.set("from", fromDate);
    }
    if (toDate) {
      params.set("to", toDate);
    }
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await apiRequest<Envelope<ReportsSummary>>(
      `/partners/${userId}/reports/summary${suffix}`,
    );
    return response.data;
  },

  async exportCsv(userId: string) {
    const response = await apiRequest<Envelope<{ csv: string }>>(`/partners/${userId}/reports/export`, {
      method: "POST",
    });
    return response.data.csv;
  },
};
