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
  ratePlans: StayRatePlan[];
  cancellationOptions?: CancellationOption[];
  updatedAt: string;
};

export type CancellationOptionId = "NON_CANCELLABLE" | "FREE_CANCELLATION";

export type CancellationOption = {
  optionId: CancellationOptionId;
  id?: CancellationOptionId;
  label: string;
  amount: number;
  currency?: string;
  policyCopy?: string;
  cancelDeadlineHoursBeforeCheckIn?: number | null;
};

export type RatePlanType = "refundable" | "non_refundable";
export type CancellationPolicyType = "non_refundable" | "free_cancellation_until" | "partial_refund";
export type PenaltyType = "none" | "full_charge" | "percent" | "amount";

export type StayRatePlan = {
  id?: string;
  roomId: string | null;
  code: string;
  name: string;
  planType: RatePlanType;
  isActive: boolean;
  nightlyRate: number;
  policyVersion: number;
  startsOn: string | null;
  endsOn: string | null;
  cancellationPolicy: {
    policyType: CancellationPolicyType;
    penaltyType: PenaltyType;
    cancelDeadlineHoursBeforeCheckIn: number | null;
    penaltyPercent: number | null;
    penaltyAmount: number | null;
    terms?: string | null;
  };
};

export type UpsertSeasonalOverrideInput = {
  id?: string;
  startDate: string;
  endDate: string;
  rate: number;
};

export type UpsertPricingAvailabilityInput = {
  saleMode?: "unit_level" | "room_level";
  currency: string;
  baseRate: number;
  weekdayRate: number;
  weekendRate: number;
  minStayNights: number;
  maxStayNights: number;
  seasonalOverrides: UpsertSeasonalOverrideInput[];
  blackoutDates: string[];
  ratePlans: StayRatePlan[];
  cancellationOptions?: CancellationOption[];
};

export type PricingAvailabilityApi = {
  getPricing(userId: string, stayId: string): Promise<StayPricingAvailability>;
  upsertPricing(
    userId: string,
    stayId: string,
    input: UpsertPricingAvailabilityInput,
  ): Promise<StayPricingAvailability>;
};
