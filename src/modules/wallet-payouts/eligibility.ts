export type PayoutEligibilityInput = {
  availableBalance: number;
  minimumThreshold: number;
  reserveHoldBalance?: number;
};

export function canRequestPayout(input: PayoutEligibilityInput) {
  const reserveHold = input.reserveHoldBalance ?? 0;
  const eligibleAmount = input.availableBalance - reserveHold;
  return eligibleAmount >= input.minimumThreshold && eligibleAmount > 0;
}
