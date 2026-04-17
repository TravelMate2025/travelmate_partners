export type ReportsSummary = {
  views: number;
  impressions: number;
  searchAppearances: number;
  missingFieldsCount: number;
  pausedListingsCount: number;
};

export type ReportsApi = {
  getSummary(userId: string, fromDate?: string, toDate?: string): Promise<ReportsSummary>;
  exportCsv(userId: string, fromDate?: string, toDate?: string): Promise<string>;
};
