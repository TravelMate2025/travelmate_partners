import type { ReportsApi, ReportsSummary } from "@/modules/reports/contracts";

export const mockReportsApi: ReportsApi = {
  async getSummary(_userId: string, _fromDate?: string, _toDate?: string): Promise<ReportsSummary> {
    return {
      views: 2300,
      impressions: 18000,
      searchAppearances: 1200,
      missingFieldsCount: 2,
      pausedListingsCount: 1,
    };
  },

  async exportCsv(_userId: string): Promise<string> {
    return "metric,value\nviews,2300\nimpressions,18000\nsearchAppearances,1200\n";
  },
};
