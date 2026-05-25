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

const ROOM_LEVEL_PROPERTY_TYPES = new Set(["hotel", "guest_house", "guesthouse", "resort"]);

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

export function resolveStaySaleMode(propertyType: string): "unit_level" | "room_level" {
  const normalized = normalizeStayPropertyType(propertyType);
  return ROOM_LEVEL_PROPERTY_TYPES.has(normalized) ? "room_level" : "unit_level";
}

export function getSaleModeContent(propertyType: string) {
  const saleMode = resolveStaySaleMode(propertyType);
  if (saleMode === "room_level") {
    return {
      saleMode,
      title: "Room-level listing",
      summary: "Guests book individual rooms.",
      implications: [
        "Bookable rooms with inventory are required.",
        "Per-room cancellation pricing is required in Pricing & Availability.",
      ],
    };
  }
  return {
    saleMode,
    title: "Unit-level listing",
    summary: "Guests book the full property as one unit.",
    implications: [
      "One stay-level price applies in Pricing & Availability.",
      "Room entries are descriptive and not sold individually.",
    ],
  };
}
