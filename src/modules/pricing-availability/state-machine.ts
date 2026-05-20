import type {
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

function validateRatePlans(ratePlans: StayRatePlan[]) {
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
  validateRatePlans(input.ratePlans);
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
