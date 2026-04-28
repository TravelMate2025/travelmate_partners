import { apiRequest } from "@/lib/http-client";
import { stayAmenityOptions } from "@/modules/stays/amenity-options";
import { stayPropertyTypeOptions } from "@/modules/stays/property-type-options";
import { transferVehicleClassOptions } from "@/modules/transfers/vehicle-options";

type CatalogOption = {
  code: string;
  label: string;
};

type CatalogOptionsResponse = {
  data: {
    amenities: CatalogOption[];
    propertyTypes: CatalogOption[];
    vehicleClasses: CatalogOption[];
    spaceTypes: CatalogOption[];
  };
};

const FALLBACK_SPACE_TYPES: CatalogOption[] = [
  { code: "exterior", label: "Exterior" },
  { code: "lobby", label: "Lobby" },
  { code: "living_area", label: "Living Area" },
  { code: "dining_area", label: "Dining Area" },
  { code: "kitchen", label: "Kitchen" },
  { code: "pool", label: "Pool" },
  { code: "gym", label: "Gym" },
  { code: "garden", label: "Garden" },
  { code: "terrace", label: "Terrace" },
  { code: "parking", label: "Parking" },
  { code: "other", label: "Other" },
];

function fallbackOptions() {
  return {
    amenities: stayAmenityOptions.map((item) => ({
      code: item.value,
      label: item.label,
    })),
    propertyTypes: stayPropertyTypeOptions.map((item) => ({
      code: item.value,
      label: item.label,
    })),
    vehicleClasses: transferVehicleClassOptions.map((item) => ({
      code: item.value,
      label: item.label,
    })),
    spaceTypes: FALLBACK_SPACE_TYPES,
  };
}

export async function fetchCatalogOptions() {
  try {
    const response = await apiRequest<CatalogOptionsResponse>("/catalog/options");
    const amenities =
      response.data.amenities.length > 0
        ? response.data.amenities
        : fallbackOptions().amenities;
    const propertyTypes =
      response.data.propertyTypes.length > 0
        ? response.data.propertyTypes
        : fallbackOptions().propertyTypes;
    const vehicleClasses =
      response.data.vehicleClasses.length > 0
        ? response.data.vehicleClasses
        : fallbackOptions().vehicleClasses;
    const spaceTypes =
      response.data.spaceTypes?.length > 0
        ? response.data.spaceTypes
        : fallbackOptions().spaceTypes;
    return { amenities, propertyTypes, vehicleClasses, spaceTypes };
  } catch {
    return fallbackOptions();
  }
}

export { FALLBACK_SPACE_TYPES };
