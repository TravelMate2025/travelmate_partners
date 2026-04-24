import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/lib/http-client";
import { realVerificationApi } from "@/modules/verification/real-verification-api";

const fetchMock = vi.fn();

describe("realVerificationApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("loads verification state from the backend contract", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            userId: "42",
            status: "in_review",
            documents: [],
            submissionCount: 1,
            submittedAt: "2026-04-23T10:00:00.000Z",
            decidedAt: null,
            updatedAt: "2026-04-23T10:00:00.000Z",
          },
        }),
    });

    const verification = await realVerificationApi.getVerification("42");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/partners/42/verification",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
    expect(verification.status).toBe("in_review");
    expect(verification.submissionCount).toBe(1);
  });

  it("posts new document metadata to the backend", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            userId: "42",
            status: "pending",
            documents: [
              {
                id: "doc-1",
                category: "identity",
                fileName: "id.pdf",
                fileType: "application/pdf",
                fileSize: 2048,
                uploadedAt: "2026-04-23T10:00:00.000Z",
              },
            ],
            submissionCount: 0,
            updatedAt: "2026-04-23T10:00:00.000Z",
          },
        }),
    });

    const file = new File(["hello"], "id.pdf", { type: "application/pdf" });

    await realVerificationApi.addDocument("42", {
      category: "identity",
      file,
      fileName: "id.pdf",
      fileType: "application/pdf",
      fileSize: 2048,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/partners/42/verification/documents",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );

    const [, options] = fetchMock.mock.calls[0];
    const formData = options.body as FormData;
    expect(formData.get("category")).toBe("identity");
    expect(formData.get("file")).toBe(file);
  });

  it("surfaces backend validation failures", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          message: "Cannot submit verification in current status or without documents.",
        }),
    });

    await expect(realVerificationApi.submitVerification("42")).rejects.toEqual(
      expect.objectContaining<HttpError>({
        message: "Cannot submit verification in current status or without documents.",
        status: 400,
      }),
    );
  });
});
