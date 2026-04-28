export const transferVehicleClassOptions = [
  { value: "economy_sedan", label: "Economy Sedan" },
  { value: "standard_sedan", label: "Standard Sedan" },
  { value: "premium_sedan", label: "Premium Sedan" },
  { value: "economy_suv", label: "Economy SUV" },
  { value: "suv", label: "SUV" },
  { value: "executive_suv", label: "Executive SUV" },
  { value: "luxury_suv", label: "Luxury SUV" },
  { value: "van", label: "Van" },
  { value: "minibus", label: "Minibus" },
  { value: "bus", label: "Bus" },
] as const;

const VEHICLE_CLASS_ALIASES: Record<string, string> = {
  sedan: "standard_sedan",
  suv: "suv",
  "executive suv": "executive_suv",
  "executive-suv": "executive_suv",
  van: "van",
  minibus: "minibus",
  bus: "bus",
};

const VALID_VEHICLE_CLASSES: Set<string> = new Set(
  transferVehicleClassOptions.map((item) => item.value),
);

export function normalizeTransferVehicleClass(value: string): string {
  const parsed = value.trim();
  if (!parsed) {
    return "";
  }
  const canonical = parsed.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (VALID_VEHICLE_CLASSES.has(canonical)) {
    return canonical;
  }
  return VEHICLE_CLASS_ALIASES[parsed.toLowerCase()] ?? canonical;
}
