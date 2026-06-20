import type {
  CancellationOption,
  TransferPricingScheduling,
  TransferScheduleDay,
  UpsertScheduleWindowInput,
  UpsertTransferPricingSchedulingInput,
} from "@/modules/transfer-pricing-scheduling/contracts";

const DAY_VALUES: TransferScheduleDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function assertIsoDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }
}

function assertTime(value: string, label: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error(`${label} must use HH:MM format.`);
  }
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeDays(days: TransferScheduleDay[]) {
  const unique = Array.from(new Set(days));
  if (unique.length === 0) {
    throw new Error("Schedule window must include at least one day.");
  }

  for (const day of unique) {
    if (!DAY_VALUES.includes(day)) {
      throw new Error(`Invalid schedule day: ${day}`);
    }
  }

  return unique;
}

function validateScheduleWindow(input: UpsertScheduleWindowInput) {
  assertTime(input.startTime, "Window start time");
  assertTime(input.endTime, "Window end time");

  const start = toMinutes(input.startTime);
  const end = toMinutes(input.endTime);
  if (start >= end) {
    throw new Error("Schedule window start time must be before end time.");
  }

  normalizeDays(input.days);
}

function validateWindowsNoOverlap(windows: UpsertScheduleWindowInput[]) {
  for (const day of DAY_VALUES) {
    const dayWindows = windows
      .filter((window) => window.days.includes(day))
      .map((window) => ({
        start: toMinutes(window.startTime),
        end: toMinutes(window.endTime),
      }))
      .sort((a, b) => a.start - b.start);

    for (let i = 1; i < dayWindows.length; i += 1) {
      const prev = dayWindows[i - 1];
      const current = dayWindows[i];
      if (current.start < prev.end) {
        throw new Error(`Schedule windows cannot overlap on ${day.toUpperCase()}.`);
      }
    }
  }
}

function validateBlackoutDates(dates: string[]) {
  const seen = new Set<string>();
  for (const date of dates) {
    assertIsoDate(date, "Blackout date");
    if (seen.has(date)) {
      throw new Error("Duplicate blackout dates are not allowed.");
    }
    seen.add(date);
  }
}

function validateCancellationOptions(options: CancellationOption[] | undefined) {
  if (!options || options.length === 0) {
    return;
  }
  const ids = new Set(options.map((option) => option.optionId ?? option.id));
  if (options.length !== 2 || !ids.has("NON_CANCELLABLE") || !ids.has("FREE_CANCELLATION")) {
    throw new Error("Cancellation options must include non-cancellable and free-cancellation entries.");
  }
  for (const option of options) {
    if (!Number.isFinite(option.amount) || option.amount < 0) {
      throw new Error("Cancellation option amounts must be valid non-negative numbers.");
    }
    const optionId = option.optionId ?? option.id;
    if (optionId === "FREE_CANCELLATION") {
      if (
        option.cancelDeadlineHoursBeforeCheckIn !== undefined
        && option.cancelDeadlineHoursBeforeCheckIn !== null
        && (!Number.isInteger(option.cancelDeadlineHoursBeforeCheckIn) || option.cancelDeadlineHoursBeforeCheckIn < 0)
      ) {
        throw new Error("Free-cancellation cutoff hours must be a non-negative integer.");
      }
    }
  }
  const nonCancellable = options.find((option) => (option.optionId ?? option.id) === "NON_CANCELLABLE");
  const freeCancellation = options.find((option) => (option.optionId ?? option.id) === "FREE_CANCELLATION");
  if (nonCancellable && freeCancellation && freeCancellation.amount < nonCancellable.amount) {
    throw new Error("Free-cancellation amount cannot be below non-cancellable amount.");
  }
}

export function validateTransferPricingSchedulingInput(
  input: UpsertTransferPricingSchedulingInput,
) {
  if (!input.currency || input.currency.trim().length < 3) {
    throw new Error("Currency must be a valid code (e.g. NGN, USD).");
  }

  if (input.baseFare <= 0) {
    throw new Error("Base fare must be greater than 0.");
  }

  if (input.distanceRatePerKm < 0 || input.timeRatePerMinute < 0) {
    throw new Error("Distance and time rates must be 0 or greater.");
  }

  if (input.peakSurcharge < 0 || input.nightSurcharge < 0) {
    throw new Error("Surcharges must be 0 or greater.");
  }

  input.scheduleWindows.forEach(validateScheduleWindow);
  validateWindowsNoOverlap(input.scheduleWindows);
  validateBlackoutDates(input.blackoutDates);
  validateCancellationOptions(input.cancellationOptions);
}

export function createDefaultTransferPricingScheduling(
  userId: string,
  transferId: string,
): TransferPricingScheduling {
  return {
    userId,
    transferId,
    currency: "NGN",
    baseFare: 10000,
    distanceRatePerKm: 0,
    timeRatePerMinute: 0,
    peakSurcharge: 0,
    nightSurcharge: 0,
    blackoutDates: [],
    scheduleWindows: [],
    cancellationOptions: [
      { optionId: "NON_CANCELLABLE", label: "Non-refundable", amount: 9000 },
      { optionId: "FREE_CANCELLATION", label: "Free cancellation", amount: 10000 },
    ],
    isConfigured: false,
    updatedAt: new Date().toISOString(),
  };
}
