import { apiRequest } from "@/lib/http-client";

type Envelope<T> = { data: T };

export async function fetchCatalogAreas(
  userId: string,
  country: string,
  adminLevel1: string,
  city: string,
): Promise<string[]> {
  const params = new URLSearchParams({ country, adminLevel1, city });
  const response = await apiRequest<Envelope<string[]>>(
    `/partners/${userId}/geography/areas?${params.toString()}`,
  );
  return response.data;
}

export async function fetchCatalogSubAreas(
  userId: string,
  country: string,
  adminLevel1: string,
  city: string,
  area: string,
): Promise<string[]> {
  const params = new URLSearchParams({ country, adminLevel1, city, area });
  const response = await apiRequest<Envelope<string[]>>(
    `/partners/${userId}/geography/sub-areas?${params.toString()}`,
  );
  return response.data;
}

export async function submitLocalitySuggestion(
  userId: string,
  payload: {
    country: string;
    adminLevel1: string;
    city: string;
    area: string;
    subArea?: string;
  },
): Promise<void> {
  await apiRequest(`/partners/${userId}/locality-suggestions`, {
    method: "POST",
    body: {
      country: payload.country,
      adminLevel1: payload.adminLevel1,
      city: payload.city,
      area: payload.area,
      subArea: payload.subArea ?? "",
    },
  });
}
