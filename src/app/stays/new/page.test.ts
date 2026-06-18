import { describe, expect, it } from "vitest";

import { canSuggestNewStayCity } from "./page";
import { mergeUniqueOptions } from "@/modules/profile/location-options";

describe("canSuggestNewStayCity", () => {
  it("returns true for a custom city after options are loaded", () => {
    expect(
      canSuggestNewStayCity({
        city: "Ajah",
        cityOptionsLoaded: true,
        cityOptions: ["Ikeja", "Lekki"],
        citySuggestionPending: false,
      }),
    ).toBe(true);
  });

  it("returns false for an approved catalog city", () => {
    expect(
      canSuggestNewStayCity({
        city: "Lekki",
        cityOptionsLoaded: true,
        cityOptions: ["Ikeja", "Lekki"],
        citySuggestionPending: false,
      }),
    ).toBe(false);
  });

  it("returns false until city options are loaded", () => {
    expect(
      canSuggestNewStayCity({
        city: "Ajah",
        cityOptionsLoaded: false,
        cityOptions: [],
        citySuggestionPending: false,
      }),
    ).toBe(false);
  });

  it("merges city options without dropping approved catalog cities", () => {
    expect(mergeUniqueOptions(["Ikeja", "Lekki"], ["Lekki", "Ajah"])).toEqual(["Ikeja", "Lekki", "Ajah"]);
  });
});
