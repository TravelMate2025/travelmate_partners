import { describe, expect, it } from "vitest";

import { resetOriginAreaOnCityChange } from "./selection-utils";

describe("resetOriginAreaOnCityChange", () => {
  it("clears area when city changes", () => {
    expect(resetOriginAreaOnCityChange("Ikeja")).toEqual({
      city: "Ikeja",
      area: "",
    });
  });
});
