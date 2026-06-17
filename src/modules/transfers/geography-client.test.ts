import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchCatalogAreas,
  fetchCatalogSubAreas,
  submitLocalitySuggestion,
} from "@/modules/transfers/geography-client";

function mockOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  });
}

function mockError(message: string, status = 400) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: async () => JSON.stringify({ message }),
  });
}

describe("fetchCatalogAreas", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls GET /partners/{userId}/geography/areas with correct query params", async () => {
    const fetchMock = mockOk({ data: ["Lekki Phase 1", "Victoria Island"] });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchCatalogAreas("user-1", "Nigeria", "Lagos", "Lagos");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/partners/user-1/geography/areas");
    expect(url).toContain("country=Nigeria");
    expect(url).toContain("adminLevel1=Lagos");
    expect(url).toContain("city=Lagos");
    expect(init.method).toBe("GET"); // http-client always passes method explicitly
    expect(result).toEqual(["Lekki Phase 1", "Victoria Island"]);
  });

  it("throws when the backend returns an error", async () => {
    vi.stubGlobal("fetch", mockError("city is required.", 400));

    await expect(
      fetchCatalogAreas("user-1", "Nigeria", "Lagos", ""),
    ).rejects.toThrow("city is required.");
  });

  it("returns empty array when no catalog areas exist for city", async () => {
    vi.stubGlobal("fetch", mockOk({ data: [] }));

    const result = await fetchCatalogAreas("user-1", "Nigeria", "Lagos", "Ikeja");

    expect(result).toEqual([]);
  });
});

describe("fetchCatalogSubAreas", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls GET /partners/{userId}/geography/sub-areas with correct query params", async () => {
    const fetchMock = mockOk({ data: ["Zone 1", "Zone 2"] });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchCatalogSubAreas("user-1", "Nigeria", "Lagos", "Ikeja", "Ikeja GRA");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/partners/user-1/geography/sub-areas");
    expect(url).toContain("country=Nigeria");
    expect(url).toContain("adminLevel1=Lagos");
    expect(url).toContain("city=Ikeja");
    expect(url).toContain("area=Ikeja+GRA");
    expect(result).toEqual(["Zone 1", "Zone 2"]);
  });

  it("throws when area is missing", async () => {
    vi.stubGlobal("fetch", mockError("area is required.", 400));

    await expect(
      fetchCatalogSubAreas("user-1", "Nigeria", "Lagos", "Ikeja", ""),
    ).rejects.toThrow("area is required.");
  });
});

describe("submitLocalitySuggestion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls POST /partners/{userId}/locality-suggestions with correct body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ data: { id: "sug-1", status: "pending" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await submitLocalitySuggestion("user-1", {
      country: "Nigeria",
      adminLevel1: "Lagos",
      city: "Ikeja",
      area: "New GRA",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/partners/user-1/locality-suggestions");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.country).toBe("Nigeria");
    expect(body.adminLevel1).toBe("Lagos");
    expect(body.city).toBe("Ikeja");
    expect(body.area).toBe("New GRA");
    expect(body.subArea).toBe("");
  });

  it("includes subArea when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ data: { id: "sug-2", status: "pending" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await submitLocalitySuggestion("user-1", {
      country: "Nigeria",
      adminLevel1: "Lagos",
      city: "Ikeja",
      area: "Ikeja GRA",
      subArea: "Zone A",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.subArea).toBe("Zone A");
  });

  it("throws when the backend rejects the suggestion", async () => {
    vi.stubGlobal("fetch", mockError("Duplicate area suggestion already pending.", 400));

    await expect(
      submitLocalitySuggestion("user-1", {
        country: "Nigeria",
        adminLevel1: "Lagos",
        city: "Ikeja",
        area: "Ikeja GRA",
      }),
    ).rejects.toThrow("Duplicate area suggestion already pending.");
  });
});
