export type TransferScheduleDay =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type ScheduleWindow = {
  id: string;
  startTime: string;
  endTime: string;
  days: TransferScheduleDay[];
};

export type TransferPricingScheduling = {
  userId: string;
  transferId: string;
  currency: string;
  baseFare: number;
  distanceRatePerKm: number;
  timeRatePerMinute: number;
  peakSurcharge: number;
  nightSurcharge: number;
  blackoutDates: string[];
  scheduleWindows: ScheduleWindow[];
  cancellationOptions?: CancellationOption[];
  isConfigured: boolean;
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

export type UpsertScheduleWindowInput = {
  id?: string;
  startTime: string;
  endTime: string;
  days: TransferScheduleDay[];
};

export type UpsertTransferPricingSchedulingInput = {
  currency: string;
  baseFare: number;
  distanceRatePerKm: number;
  timeRatePerMinute: number;
  peakSurcharge: number;
  nightSurcharge: number;
  blackoutDates: string[];
  scheduleWindows: UpsertScheduleWindowInput[];
  cancellationOptions?: CancellationOption[];
};

export type TransferPricingSchedulingApi = {
  getPricingScheduling(
    userId: string,
    transferId: string,
  ): Promise<TransferPricingScheduling>;
  upsertPricingScheduling(
    userId: string,
    transferId: string,
    input: UpsertTransferPricingSchedulingInput,
  ): Promise<TransferPricingScheduling>;
};
