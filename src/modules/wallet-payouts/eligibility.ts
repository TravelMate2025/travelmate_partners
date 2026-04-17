export type SettlementEligibilityInput = {
  grossAmount: number;
  minimumSettleAmount: number;
  reserveHoldBalance?: number;
};

export function canSettleBooking(input: SettlementEligibilityInput) {
  const reserveHold = input.reserveHoldBalance ?? 0;
  const eligibleAmount = input.grossAmount - reserveHold;
  return eligibleAmount >= input.minimumSettleAmount && eligibleAmount > 0;
}
