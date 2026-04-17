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
  const views = days * 74;
  const impressions = views * 8;
  const searchAppearances = Math.round(impressions * 0.11);
  const missingFieldsCount = days > 90 ? 3 : 2;
  const pausedListingsCount = days > 45 ? 2 : 1;

  return {
    views,
    impressions,
    searchAppearances,
    missingFieldsCount,
    pausedListingsCount,
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
    return [
      "from,to,metric,value",
      `${from},${to},views,${summary.views}`,
      `${from},${to},impressions,${summary.impressions}`,
      `${from},${to},searchAppearances,${summary.searchAppearances}`,
      `${from},${to},missingFieldsCount,${summary.missingFieldsCount}`,
      `${from},${to},pausedListingsCount,${summary.pausedListingsCount}`,
    ].join("\n");
  },
};
