import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearAuditEvents, listAuditEvents } from "@/modules/audit/audit-log";
import { mockVerificationApi } from "@/modules/verification/mock-verification-api";

function resetStorage() {
  window.localStorage.clear();
}

describe("mockVerificationApi", () => {
  beforeEach(() => {
    resetStorage();
    clearAuditEvents();
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
    expect(item.status).toBe("in_review");

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
    expect(item.status).toBe("in_review");

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

  it("replaces an uploaded document while preserving document id", async () => {
    const userId = "u1";
    let item = await mockVerificationApi.addDocument(userId, {
      category: "identity",
      fileName: "id-old.pdf",
      fileType: "application/pdf",
      fileSize: 1100,
    });

    const documentId = item.documents[0].id;
    item = await mockVerificationApi.replaceDocument(userId, documentId, {
      category: "identity",
      fileName: "id-new.pdf",
      fileType: "application/pdf",
      fileSize: 1500,
    });

    expect(item.documents).toHaveLength(1);
    expect(item.documents[0].id).toBe(documentId);
    expect(item.documents[0].fileName).toBe("id-new.pdf");
  });

  it("requires documents before submission", async () => {
    await expect(mockVerificationApi.submitVerification("u1")).rejects.toThrow(
      "Cannot submit verification in current status or without documents.",
    );
  });

  it("records audit events for verification document updates and submission", async () => {
    const userId = "u1";
    let item = await mockVerificationApi.addDocument(userId, {
      category: "identity",
      fileName: "id.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
    });
    item = await mockVerificationApi.replaceDocument(userId, item.documents[0].id, {
      category: "identity",
      fileName: "id-new.pdf",
      fileType: "application/pdf",
      fileSize: 1030,
    });
    await mockVerificationApi.submitVerification(userId);

    const audit = listAuditEvents(userId);
    expect(audit.some((event) => event.action === "verification_document_added")).toBe(true);
    expect(audit.some((event) => event.action === "verification_document_replaced")).toBe(true);
    expect(audit.some((event) => event.action === "verification_submitted")).toBe(true);
  });
});
