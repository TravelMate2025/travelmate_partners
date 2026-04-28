import { afterEach, describe, expect, it, vi } from "vitest";

import { realStaysApi } from "@/modules/stays/real-stays-api";

describe("realStaysApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("surfaces archive errors without automatic fallback transitions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            message: "Cannot archive a stay with status 'paused'.",
          }),
      }),
    );

    await expect(realStaysApi.archiveStay("user-1", "stay-1")).rejects.toThrow(
      "Cannot archive a stay with status 'paused'.",
    );
  });

  it("surfaces edit-policy errors without automatic status changes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            message: "Only draft or rejected stays can be edited.",
          }),
      }),
    );

    await expect(realStaysApi.updateStay("user-1", "stay-2", { name: "Updated name" })).rejects.toThrow(
      "Only draft or rejected stays can be edited.",
    );
  });
});
