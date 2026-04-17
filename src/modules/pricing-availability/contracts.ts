export type DateRange = {
  startDate: string;
  endDate: string;
};

export type SeasonalOverride = DateRange & {
  id: string;
  rate: number;
};

export type StayPricingAvailability = {
  userId: string;
  stayId: string;
  currency: string;
  baseRate: number;
  weekdayRate: number;
  weekendRate: number;
  minStayNights: number;
  maxStayNights: number;
  seasonalOverrides: SeasonalOverride[];
  blackoutDates: string[];
  updatedAt: string;
};

export type UpsertSeasonalOverrideInput = {
  id?: string;
  startDate: string;
  endDate: string;
  rate: number;
};

export type UpsertPricingAvailabilityInput = {
  currency: string;
  baseRate: number;
  weekdayRate: number;
  weekendRate: number;
  minStayNights: number;
  maxStayNights: number;
  seasonalOverrides: UpsertSeasonalOverrideInput[];
  blackoutDates: string[];
};

export type PricingAvailabilityApi = {
  getPricing(userId: string, stayId: string): Promise<StayPricingAvailability>;
  upsertPricing(
    userId: string,
    stayId: string,
    input: UpsertPricingAvailabilityInput,
  ): Promise<StayPricingAvailability>;
};
