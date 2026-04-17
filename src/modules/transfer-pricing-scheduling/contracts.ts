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
  updatedAt: string;
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
