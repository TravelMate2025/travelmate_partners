import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockVerificationApi } from "@/modules/verification/mock-verification-api";

function resetStorage() {
  window.localStorage.clear();
}

describe("mockVerificationApi", () => {
  beforeEach(() => {
    resetStorage();
    vi.useRealTimers();
  });

  it("supports upload, submit, reject, resubmit, approve lifecycle", async () => {
    const userId = "u1";

    let item = await mockVerificationApi.addDocument(userId, {
      category: "identity",
      fileName: "id.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
    });

    expect(item.documents.length).toBe(1);

    item = await mockVerificationApi.submitVerification(userId);
    expect(item.status).toBe("pending");

    // Wait for auto-resolution threshold
    await new Promise((resolve) => setTimeout(resolve, 1600));
    item = await mockVerificationApi.getVerification(userId);
    expect(item.status).toBe("rejected");
    expect(item.rejectionReason).toBeTruthy();

    item = await mockVerificationApi.addDocument(userId, {
      category: "business",
      fileName: "registration.pdf",
      fileType: "application/pdf",
      fileSize: 2048,
    });
    expect(item.documents.length).toBe(2);

    item = await mockVerificationApi.submitVerification(userId);
    expect(item.status).toBe("pending");

    await new Promise((resolve) => setTimeout(resolve, 1600));
    item = await mockVerificationApi.getVerification(userId);
    expect(item.status).toBe("approved");
  });

  it("rejects invalid document file types", async () => {
    await expect(
      mockVerificationApi.addDocument("u1", {
        category: "identity",
        fileName: "id.exe",
        fileType: "application/x-msdownload",
        fileSize: 1200,
      }),
    ).rejects.toThrow("Unsupported file type");
  });

  it("requires documents before submission", async () => {
    await expect(mockVerificationApi.submitVerification("u1")).rejects.toThrow(
      "Cannot submit verification in current status or without documents.",
    );
  });
});
