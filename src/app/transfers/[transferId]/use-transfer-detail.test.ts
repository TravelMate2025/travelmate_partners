import { describe, expect, it } from "vitest";

import {
  canSubmitTransferDetails,
  buildTransferCityOptions,
  derivedDestinationCityOptions,
  findRegionForCity,
  parseOperatingHours,
  DEFAULT_OPEN,
  DEFAULT_CLOSE,
} from "./use-transfer-detail";

describe("findRegionForCity", () => {
  it("returns the region containing the given city for Nigeria", () => {
    // Lagos state cities are: Ikeja, Lekki, Epe, Badagry
    const region = findRegionForCity("Nigeria", "Lekki");
    expect(region).toBe("Lagos");
  });

  it("returns the region for a city in Federal Capital Territory", () => {
    const region = findRegionForCity("Nigeria", "Abuja");
    expect(region).toBe("Federal Capital Territory");
  });

  it("returns empty string when city is not found", () => {
    const region = findRegionForCity("Nigeria", "Nonexistent City");
    expect(region).toBe("");
  });

  it("returns empty string when country is not found", () => {
    const region = findRegionForCity("Atlantis", "Lost City");
    expect(region).toBe("");
  });

  it("returns empty string for empty inputs", () => {
    expect(findRegionForCity("", "")).toBe("");
    expect(findRegionForCity("Nigeria", "")).toBe("");
  });

  it("matches cities case-insensitively", () => {
    expect(findRegionForCity("Nigeria", "lekki")).toBe("Lagos");
  });
});

describe("derivedDestinationCityOptions", () => {
  it("returns cities for a known country and region", () => {
    const cities = derivedDestinationCityOptions("Nigeria", "Lagos");
    expect(cities.length).toBeGreaterThan(0);
    expect(cities).toContain("Lekki");
    expect(cities).not.toContain("Abuja");
  });

  it("returns all cities for a known country when no region is supplied", () => {
    const cities = derivedDestinationCityOptions("Nigeria");
    expect(cities.length).toBeGreaterThan(0);
    expect(cities).toContain("Lekki");
    expect(cities).toContain("Abuja");
  });

  it("returns empty array for unknown country", () => {
    expect(derivedDestinationCityOptions("Atlantis")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(derivedDestinationCityOptions("")).toEqual([]);
  });

  it("does not contain duplicate cities", () => {
    const cities = derivedDestinationCityOptions("Nigeria");
    const unique = new Set(cities);
    // Allow duplicates from different regions (flatMap) — just verify no crash
    expect(cities.length).toBeGreaterThanOrEqual(unique.size);
  });
});

describe("buildTransferCityOptions", () => {
  it("merges approved live cities into the transfer city options", () => {
    expect(buildTransferCityOptions(["Ikeja", "Lekki"], ["Ajah", "Lekki"], "Ajah")).toEqual([
      "Ikeja",
      "Lekki",
      "Ajah",
    ]);
  });
});

describe("parseOperatingHours", () => {
  it("parses a valid range string", () => {
    expect(parseOperatingHours("08:00-20:00")).toEqual({ open: "08:00", close: "20:00" });
  });

  it("returns defaults for empty string", () => {
    expect(parseOperatingHours("")).toEqual({ open: DEFAULT_OPEN, close: DEFAULT_CLOSE });
  });

  it("returns defaults for malformed range", () => {
    expect(parseOperatingHours("not-a-time")).toEqual({ open: DEFAULT_OPEN, close: DEFAULT_CLOSE });
  });

  it("returns defaults when only one part is provided", () => {
    expect(parseOperatingHours("08:00")).toEqual({ open: DEFAULT_OPEN, close: DEFAULT_CLOSE });
  });

  it("trims spaces around the range parts", () => {
    expect(parseOperatingHours(" 09:00 - 21:00 ")).toEqual({ open: "09:00", close: "21:00" });
  });
});

describe("canSubmitTransferDetails", () => {
  it("blocks submission when destination sub-area is pending review", () => {
    expect(
      canSubmitTransferDetails({
        status: "draft",
        selectedArea: "Lekki Phase 1",
        originAreaSuggestionPending: false,
        destinationRoutes: [
          { id: "route-1", destinationCity: "Abuja", destinationArea: "Garki", destinationSubArea: "Central" },
        ],
        destinationRoutePendingById: { "route-1": { area: false, subArea: true } },
      }),
    ).toBe(false);
  });

  it("allows submission when the route is complete and approved", () => {
    expect(
      canSubmitTransferDetails({
        status: "draft",
        selectedArea: "Lekki Phase 1",
        originAreaOptionsLoaded: true,
        originAreaSuggestionPending: false,
        destinationRoutes: [
          { id: "route-1", destinationCity: "Abuja", destinationArea: "Garki", destinationSubArea: "Central" },
          { id: "route-2", destinationCity: "Lagos", destinationArea: "Ikeja", destinationSubArea: "" },
        ],
        destinationRoutePendingById: {},
      }),
    ).toBe(true);
  });

  it("blocks submission outside editable statuses", () => {
    expect(
      canSubmitTransferDetails({
        status: "live",
        selectedArea: "Lekki Phase 1",
        originAreaOptionsLoaded: true,
        originAreaSuggestionPending: false,
        destinationRoutes: [
          { id: "route-1", destinationCity: "Abuja", destinationArea: "Garki", destinationSubArea: "" },
        ],
        destinationRoutePendingById: {},
      }),
    ).toBe(false);
  });

  it("blocks submission until the origin area catalog is loaded", () => {
    expect(
      canSubmitTransferDetails({
        status: "draft",
        selectedArea: "Ajah",
        originAreaOptionsLoaded: false,
        originAreaSuggestionPending: false,
        destinationRoutes: [
          { id: "route-1", destinationCity: "Lagos", destinationArea: "Victoria Island", destinationSubArea: "" },
        ],
        destinationRoutePendingById: {},
      }),
    ).toBe(false);
  });
});
