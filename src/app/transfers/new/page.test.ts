import { describe, expect, it } from "vitest";

import { canSuggestNewTransferCity } from "./page";

describe("canSuggestNewTransferCity", () => {
  it("returns true for a custom city after options are loaded", () => {
    expect(
      canSuggestNewTransferCity({
        city: "Ajah",
        cityOptionsLoaded: true,
        cityOptions: ["Ikeja", "Lekki"],
        citySuggestionPending: false,
      }),
    ).toBe(true);
  });

  it("returns false for an approved catalog city", () => {
    expect(
      canSuggestNewTransferCity({
        city: "Lekki",
        cityOptionsLoaded: true,
        cityOptions: ["Ikeja", "Lekki"],
        citySuggestionPending: false,
      }),
    ).toBe(false);
  });

  it("returns false until city options are loaded", () => {
    expect(
      canSuggestNewTransferCity({
        city: "Ajah",
        cityOptionsLoaded: false,
        cityOptions: [],
        citySuggestionPending: false,
      }),
    ).toBe(false);
  });
});
