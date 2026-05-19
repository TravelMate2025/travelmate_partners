export type TopListing = {
  listingId: string;
  listingKind: string;
  listingName: string;
  bookingCount: number;
};

export type ReportsSummary = {
  views: number;
  impressions: number;
  searchAppearances: number;
  missingFieldsCount: number;
  pausedListingsCount: number;
  totalBookings: number;
  cancelledBookings: number;
  grossRevenue: number;
  cancellationRate: number;
  topListings: TopListing[];
};

export type ReportsApi = {
  getSummary(userId: string, fromDate?: string, toDate?: string): Promise<ReportsSummary>;
  exportCsv(userId: string, fromDate?: string, toDate?: string): Promise<string>;
};
