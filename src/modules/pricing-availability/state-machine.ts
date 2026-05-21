import type {
  CancellationOption,
  StayRatePlan,
  StayPricingAvailability,
  UpsertPricingAvailabilityInput,
  UpsertSeasonalOverrideInput,
} from "@/modules/pricing-availability/contracts";

function assertIsoDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }
}

function compareDate(a: string, b: string) {
  return a.localeCompare(b);
}

function validateOverride(input: UpsertSeasonalOverrideInput) {
  assertIsoDate(input.startDate, "Season start date");
  assertIsoDate(input.endDate, "Season end date");

  if (compareDate(input.startDate, input.endDate) > 0) {
    throw new Error("Season start date cannot be after end date.");
  }

  if (input.rate <= 0) {
    throw new Error("Seasonal override rate must be greater than 0.");
  }
}

function validateNoOverlap(overrides: UpsertSeasonalOverrideInput[]) {
  const normalized = overrides
    .map((item) => ({ startDate: item.startDate, endDate: item.endDate }))
    .sort((a, b) => compareDate(a.startDate, b.startDate));

  for (let i = 1; i < normalized.length; i += 1) {
    const prev = normalized[i - 1];
    const current = normalized[i];
    if (compareDate(current.startDate, prev.endDate) <= 0) {
      throw new Error("Seasonal date ranges cannot overlap.");
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

function validateRatePlans(ratePlans: StayRatePlan[], hasCancellationOptions: boolean) {
  if (hasCancellationOptions && (!Array.isArray(ratePlans) || ratePlans.length === 0)) {
    return;
  }
  if (!Array.isArray(ratePlans) || ratePlans.length === 0) {
    throw new Error("At least one active rate plan is required.");
  }
  const seenCodes = new Set<string>();
  let activeCount = 0;
  for (const [index, plan] of ratePlans.entries()) {
    const code = plan.code.trim().toLowerCase();
    if (!code) throw new Error(`Rate plan ${index + 1}: code is required.`);
    if (seenCodes.has(code)) throw new Error("Rate plan codes must be unique.");
    seenCodes.add(code);
    if (!plan.name.trim()) throw new Error(`Rate plan ${index + 1}: name is required.`);
    if (plan.nightlyRate <= 0) throw new Error(`Rate plan ${index + 1}: nightly rate must be greater than 0.`);
    if (plan.policyVersion < 1) throw new Error(`Rate plan ${index + 1}: policy version must be at least 1.`);
    if (plan.isActive) activeCount += 1;

    const policy = plan.cancellationPolicy;
    if (policy.policyType === "non_refundable" && policy.penaltyType === "none") {
      throw new Error("Non-refundable plans cannot use penalty type 'none'.");
    }
    if (policy.policyType === "free_cancellation_until") {
      if (policy.cancelDeadlineHoursBeforeCheckIn === null || policy.cancelDeadlineHoursBeforeCheckIn < 0) {
        throw new Error("Free-cancellation plans require a non-negative cancellation deadline.");
      }
      if (policy.penaltyType !== "none") {
        throw new Error("Free-cancellation plans must use penalty type 'none'.");
      }
    }
    if (policy.policyType === "partial_refund") {
      if (policy.cancelDeadlineHoursBeforeCheckIn === null || policy.cancelDeadlineHoursBeforeCheckIn < 0) {
        throw new Error("Partial-refund plans require a non-negative cancellation deadline.");
      }
      if (policy.penaltyType === "none") {
        throw new Error("Partial-refund plans must define a penalty.");
      }
      if (policy.penaltyType === "percent" && (policy.penaltyPercent === null || policy.penaltyPercent < 0 || policy.penaltyPercent > 100)) {
        throw new Error("Percent penalties must be between 0 and 100.");
      }
      if (policy.penaltyType === "amount" && (policy.penaltyAmount === null || policy.penaltyAmount < 0)) {
        throw new Error("Amount penalties must be non-negative.");
      }
    }
  }
  if (activeCount === 0) throw new Error("At least one active rate plan is required.");
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

function validateRoomCancellationOptions(options: UpsertPricingAvailabilityInput["roomCancellationOptions"]) {
  if (!options || options.length === 0) {
    return;
  }
  const seenRoomIds = new Set<string>();
  for (const item of options) {
    const roomId = item.roomId.trim();
    if (!roomId) {
      throw new Error("Each room cancellation option must include a room id.");
    }
    if (seenRoomIds.has(roomId)) {
      throw new Error("Duplicate room cancellation option entries are not allowed.");
    }
    seenRoomIds.add(roomId);
    validateCancellationOptions(item.cancellationOptions);
  }
}

export function validatePricingAvailabilityInput(input: UpsertPricingAvailabilityInput) {
  if (!input.currency || input.currency.trim().length < 3) {
    throw new Error("Currency must be a valid code (e.g. NGN, USD).");
  }

  if (input.baseRate <= 0) {
    throw new Error("Base rate must be greater than 0.");
  }

  if (input.weekdayRate <= 0 || input.weekendRate <= 0) {
    throw new Error("Weekday and weekend rates must be greater than 0.");
  }

  if (input.minStayNights <= 0 || input.maxStayNights <= 0) {
    throw new Error("Minimum and maximum stay nights must be greater than 0.");
  }

  if (input.minStayNights > input.maxStayNights) {
    throw new Error("Minimum stay nights cannot exceed maximum stay nights.");
  }

  input.seasonalOverrides.forEach(validateOverride);
  validateNoOverlap(input.seasonalOverrides);
  validateBlackoutDates(input.blackoutDates);
  validateCancellationOptions(input.cancellationOptions);
  validateRoomCancellationOptions(input.roomCancellationOptions);
  validateRatePlans(
    input.ratePlans,
    Boolean(input.cancellationOptions?.length || input.roomCancellationOptions?.length),
  );
}

export function createDefaultPricingAvailability(
  userId: string,
  stayId: string,
): StayPricingAvailability {
  return {
    userId,
    stayId,
    currency: "NGN",
    baseRate: 100,
    weekdayRate: 100,
    weekendRate: 120,
    minStayNights: 1,
    maxStayNights: 30,
    seasonalOverrides: [],
    blackoutDates: [],
    cancellationOptions: [
      { optionId: "NON_CANCELLABLE", label: "Non-refundable", amount: 90 },
      { optionId: "FREE_CANCELLATION", label: "Free cancellation", amount: 100 },
    ],
    roomCancellationOptions: [],
    ratePlans: [
      {
        code: "flex_free_cancel",
        name: "Flexible Free Cancel",
        roomId: null,
        planType: "refundable",
        isActive: true,
        nightlyRate: 100,
        policyVersion: 1,
        startsOn: null,
        endsOn: null,
        cancellationPolicy: {
          policyType: "free_cancellation_until",
          penaltyType: "none",
          cancelDeadlineHoursBeforeCheckIn: 48,
          penaltyPercent: null,
          penaltyAmount: null,
          terms: null,
        },
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}
