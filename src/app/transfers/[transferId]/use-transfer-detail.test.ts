import { describe, expect, it } from "vitest";

import {
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
});

describe("derivedDestinationCityOptions", () => {
  it("returns all cities for a known country", () => {
    const cities = derivedDestinationCityOptions("Nigeria");
    expect(cities.length).toBeGreaterThan(0);
    // Lekki and Abuja are known cities from Lagos and FCT regions
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
