import type {
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
    updatedAt: new Date().toISOString(),
  };
}
