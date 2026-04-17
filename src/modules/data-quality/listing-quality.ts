import type { StayListing } from "@/modules/stays/contracts";
import type { TransferListing } from "@/modules/transfers/contracts";

export type ListingQualityReport = {
  completenessScore: number;
  missingRequiredFields: string[];
  duplicateWarnings: string[];
};

type QualityCheck = {
  passed: boolean;
  required?: boolean;
  label: string;
};

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hasText(value: unknown) {
  return normalize(value).length > 0;
}

function hasItems(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function scoreChecks(checks: QualityCheck[]) {
  const passed = checks.filter((item) => item.passed).length;
  const total = checks.length || 1;
  return Math.round((passed / total) * 100);
}

export function buildStayQualityReport(
  stay: StayListing,
  allStays: StayListing[],
): ListingQualityReport {
  const checks: QualityCheck[] = [
    { label: "Property Type", passed: hasText(stay.propertyType), required: true },
    { label: "Name", passed: hasText(stay.name), required: true },
    { label: "Description", passed: hasText(stay.description), required: true },
    { label: "Address", passed: hasText(stay.address), required: true },
    { label: "City", passed: hasText(stay.city), required: true },
    { label: "Country", passed: hasText(stay.country), required: true },
    { label: "Amenities", passed: hasItems(stay.amenities) },
    { label: "House Rules", passed: hasText(stay.houseRules) },
    { label: "Check-in Time", passed: hasText(stay.checkInTime) },
    { label: "Check-out Time", passed: hasText(stay.checkOutTime) },
    { label: "Cancellation Policy", passed: hasText(stay.cancellationPolicy) },
    { label: "Images", passed: hasItems(stay.images) },
    { label: "Rooms/Units", passed: hasItems(stay.rooms) },
  ];

  const missingRequiredFields = checks
    .filter((item) => item.required && !item.passed)
    .map((item) => item.label);

  const duplicates = allStays.filter(
    (item) =>
      item.id !== stay.id &&
      normalize(item.name) === normalize(stay.name) &&
      normalize(item.address) === normalize(stay.address) &&
      normalize(item.city) === normalize(stay.city),
  );

  return {
    completenessScore: scoreChecks(checks),
    missingRequiredFields,
    duplicateWarnings: duplicates.map((item) => {
      const name = item.name || "Untitled stay";
      return `Possible duplicate stay found: "${name}" in ${item.city}.`;
    }),
  };
}

export function buildTransferQualityReport(
  transfer: TransferListing,
  allTransfers: TransferListing[],
): ListingQualityReport {
  const checks: QualityCheck[] = [
    { label: "Name", passed: hasText(transfer.name), required: true },
    { label: "Transfer Type", passed: hasText(transfer.transferType), required: true },
    { label: "Pickup Point", passed: hasText(transfer.pickupPoint), required: true },
    { label: "Dropoff Point", passed: hasText(transfer.dropoffPoint), required: true },
    { label: "Vehicle Class", passed: hasText(transfer.vehicleClass), required: true },
    { label: "Coverage Area", passed: hasText(transfer.coverageArea), required: true },
    { label: "Description", passed: hasText(transfer.description) },
    { label: "Features", passed: hasItems(transfer.features) },
    { label: "Operating Hours", passed: hasText(transfer.operatingHours) },
    { label: "Images", passed: hasItems(transfer.images) },
    { label: "Base Fare", passed: transfer.baseFare >= 0 },
  ];

  const missingRequiredFields = checks
    .filter((item) => item.required && !item.passed)
    .map((item) => item.label);

  const duplicates = allTransfers.filter(
    (item) =>
      item.id !== transfer.id &&
      normalize(item.transferType) === normalize(transfer.transferType) &&
      normalize(item.pickupPoint) === normalize(transfer.pickupPoint) &&
      normalize(item.dropoffPoint) === normalize(transfer.dropoffPoint) &&
      normalize(item.vehicleClass) === normalize(transfer.vehicleClass),
  );

  return {
    completenessScore: scoreChecks(checks),
    missingRequiredFields,
    duplicateWarnings: duplicates.map((item) => {
      const name = item.name || "Untitled transfer";
      return `Possible duplicate transfer found: "${name}" (${item.pickupPoint} -> ${item.dropoffPoint}).`;
    }),
  };
}
