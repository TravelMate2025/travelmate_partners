import { describe, expect, it } from "vitest";

import { canSuggestDestinationArea, canSuggestDestinationCity } from "./transfer-details-form";

describe("transfer destination review helpers", () => {
  it("allows suggesting a custom destination city", () => {
    expect(
      canSuggestDestinationCity({
        city: "Oregun",
        cityOptions: ["Ikeja", "Lekki"],
        citySuggestionPending: false,
        disabled: false,
      }),
    ).toBe(true);
  });

  it("hides destination city suggestion for approved cities", () => {
    expect(
      canSuggestDestinationCity({
        city: "Ikeja",
        cityOptions: ["Ikeja", "Lekki"],
        citySuggestionPending: false,
        disabled: false,
      }),
    ).toBe(false);
  });

  it("allows suggesting a destination area even before area options finish loading", () => {
    expect(
      canSuggestDestinationArea({
        area: "Oregun",
        areaOptionsLoaded: false,
        areaOptions: [],
        city: "Ikeja",
        cityOptions: ["Ikeja", "Lekki"],
        areaNeedsReview: true,
        areaSuggestionPending: false,
        disabled: false,
      }),
    ).toBe(true);
  });

  it("hides destination area suggestion for approved areas", () => {
    expect(
      canSuggestDestinationArea({
        area: "Ikeja GRA",
        areaOptionsLoaded: true,
        areaOptions: ["Ikeja GRA", "Allen Avenue"],
        city: "Ikeja",
        cityOptions: ["Ikeja", "Lekki"],
        areaNeedsReview: false,
        areaSuggestionPending: false,
        disabled: false,
      }),
    ).toBe(false);
  });

  it("hides destination area suggestion until the destination city is approved", () => {
    expect(
      canSuggestDestinationArea({
        area: "Oregun",
        areaOptionsLoaded: false,
        areaOptions: [],
        city: "Nonexistent City",
        cityOptions: ["Ikeja", "Lekki"],
        areaNeedsReview: true,
        areaSuggestionPending: false,
        disabled: false,
      }),
    ).toBe(false);
  });
});
