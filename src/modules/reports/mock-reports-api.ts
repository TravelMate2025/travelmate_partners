import type { ReportsApi, ReportsSummary } from "@/modules/reports/contracts";

function normalizeDate(value?: string) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
}

function diffDays(from?: string, to?: string) {
  const toDate = normalizeDate(to) ?? new Date();
  const fromDate = normalizeDate(from);
  if (!fromDate) {
    return 30;
  }
  const ms = toDate.getTime() - fromDate.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  if (!Number.isFinite(days) || days <= 0) {
    return 1;
  }
  return Math.min(days, 365);
}

function buildSummary(fromDate?: string, toDate?: string): ReportsSummary {
  const days = diffDays(fromDate, toDate);
  const totalBookings = Math.max(1, Math.floor(days * 0.8));
  const cancelledBookings = Math.floor(totalBookings * 0.1);
  const grossRevenue = totalBookings * 45000;
  const total = totalBookings + cancelledBookings;
  const cancellationRate = total > 0 ? Math.round((cancelledBookings / total) * 10000) / 100 : 0;
  const views = totalBookings * 120;
  const impressions = views * 8;
  const searchAppearances = Math.round(impressions * 0.15);
  const missingFieldsCount = days > 90 ? 3 : 2;
  const pausedListingsCount = days > 45 ? 2 : 1;

  return {
    views,
    impressions,
    searchAppearances,
    missingFieldsCount,
    pausedListingsCount,
    totalBookings,
    cancelledBookings,
    grossRevenue,
    cancellationRate,
    topListings: [
      { listingId: "stay-001", listingKind: "stay", listingName: "Lekki Luxury Villa", bookingCount: Math.ceil(totalBookings * 0.4) },
      { listingId: "stay-002", listingKind: "stay", listingName: "VI Serviced Apartment", bookingCount: Math.ceil(totalBookings * 0.35) },
      { listingId: "tr-001", listingKind: "transfer", listingName: "Airport Express", bookingCount: Math.ceil(totalBookings * 0.25) },
    ],
  };
}

export const mockReportsApi: ReportsApi = {
  async getSummary(_userId: string, fromDate?: string, toDate?: string) {
    return buildSummary(fromDate, toDate);
  },

  async exportCsv(_userId: string, fromDate?: string, toDate?: string) {
    const summary = buildSummary(fromDate, toDate);
    const from = fromDate ?? "";
    const to = toDate ?? "";
    const rows = [
      "from,to,metric,value",
      `${from},${to},views,${summary.views}`,
      `${from},${to},impressions,${summary.impressions}`,
      `${from},${to},searchAppearances,${summary.searchAppearances}`,
      `${from},${to},missingFieldsCount,${summary.missingFieldsCount}`,
      `${from},${to},pausedListingsCount,${summary.pausedListingsCount}`,
      `${from},${to},totalBookings,${summary.totalBookings}`,
      `${from},${to},cancelledBookings,${summary.cancelledBookings}`,
      `${from},${to},grossRevenue,${summary.grossRevenue}`,
      `${from},${to},cancellationRate,${summary.cancellationRate}`,
    ];
    summary.topListings.forEach((l, i) => {
      rows.push(`${from},${to},topListing_${i + 1}_id,${l.listingId}`);
      rows.push(`${from},${to},topListing_${i + 1}_name,${l.listingName}`);
      rows.push(`${from},${to},topListing_${i + 1}_bookingCount,${l.bookingCount}`);
    });
    return rows.join("\n");
  },
};
