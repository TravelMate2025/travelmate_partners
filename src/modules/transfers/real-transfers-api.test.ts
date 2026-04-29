import { afterEach, describe, expect, it, vi } from "vitest";

import { realTransfersApi } from "@/modules/transfers/real-transfers-api";

describe("realTransfersApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads appeal status with GET (never submits on view)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: {
            id: "appeal-1",
            listingKind: "transfer",
            listingId: "transfer-1",
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

    await realTransfersApi.getAppeal("user-1", "transfer-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(requestInit.method).toBe("GET");
  });
});

