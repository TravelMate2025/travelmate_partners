import { describe, expect, it } from "vitest";

import { HttpError } from "@/lib/http-client";
import { getErrorMessage, isAuthenticationError } from "@/modules/auth/http-errors";

describe("auth http error helpers", () => {
  it("identifies authentication failures", () => {
    expect(isAuthenticationError(new HttpError("Authentication required.", 401))).toBe(true);
    expect(isAuthenticationError(new HttpError("Forbidden.", 403))).toBe(false);
    expect(isAuthenticationError(new Error("boom"))).toBe(false);
  });

  it("returns a safe display message", () => {
    expect(getErrorMessage(new Error("Profile load failed."), "Fallback")).toBe("Profile load failed.");
    expect(getErrorMessage("bad", "Fallback")).toBe("Fallback");
  });
});
