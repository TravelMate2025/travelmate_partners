export const stayPropertyTypeOptions = [
  { value: "hotel", label: "Hotel" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "resort", label: "Resort" },
  { value: "hostel", label: "Hostel" },
  { value: "guesthouse", label: "Guesthouse" },
  { value: "lodge", label: "Lodge" },
  { value: "homestay", label: "Homestay" },
] as const;

const PROPERTY_TYPE_ALIASES: Record<string, string> = {
  "guest house": "guesthouse",
  "guest-house": "guesthouse",
  "home stay": "homestay",
  "home-stay": "homestay",
  "serviced apartment": "apartment",
  "serviced-apartment": "apartment",
  airbnb: "apartment",
};

const VALID_PROPERTY_TYPES: Set<string> = new Set(
  stayPropertyTypeOptions.map((item) => item.value),
);

export function normalizeStayPropertyType(value: string): string {
  const parsed = value.trim();
  if (!parsed) {
    return "";
  }
  const canonical = parsed.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (VALID_PROPERTY_TYPES.has(canonical)) {
    return canonical;
  }
  return PROPERTY_TYPE_ALIASES[parsed.toLowerCase()] ?? canonical;
}
