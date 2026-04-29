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

  it("loads appeal status with GET (never submits on view)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: {
            id: "appeal-1",
            listingKind: "stay",
            listingId: "stay-1",
            partnerId: "user-1",
            message: "Appeal text",
            status: "pending",
            resolution: null,
            resolutionNote: "",
            resolvedAt: null,
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await realStaysApi.getAppeal("user-1", "stay-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(requestInit.method).toBe("GET");
  });
});
