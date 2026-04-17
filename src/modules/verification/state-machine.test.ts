import { describe, expect, it } from "vitest";

import { canSubmitVerification, resolvePending, shouldAutoResolvePending } from "@/modules/verification/state-machine";
import type { PartnerVerification } from "@/modules/verification/contracts";

function base(status: PartnerVerification["status"]): PartnerVerification {
  return {
    userId: "u1",
    status,
    documents: [],
    submissionCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

describe("verification state machine", () => {
  it("validates submit eligibility", () => {
    const item = base("not_started");
    expect(canSubmitVerification(item)).toBe(false);

    item.documents.push({
      id: "d1",
      category: "identity",
      fileName: "id.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
      uploadedAt: new Date().toISOString(),
    });

    expect(canSubmitVerification(item)).toBe(true);

    item.status = "pending";
    expect(canSubmitVerification(item)).toBe(false);
  });

  it("resolves pending to rejected first and approved after resubmission", () => {
    const first: PartnerVerification = {
      ...base("pending"),
      documents: [
        {
          id: "d1",
          category: "identity",
          fileName: "id.pdf",
          fileType: "application/pdf",
          fileSize: 1024,
          uploadedAt: new Date().toISOString(),
        },
      ],
      submissionCount: 1,
      submittedAt: new Date(Date.now() - 2000).toISOString(),
    };

    expect(shouldAutoResolvePending(first)).toBe(true);
    const firstResult = resolvePending(first);
    expect(firstResult.status).toBe("rejected");
    expect(firstResult.rejectionReason).toContain("Document quality check failed");

    const second = {
      ...first,
      submissionCount: 2,
      submittedAt: new Date(Date.now() - 2000).toISOString(),
    };

    const secondResult = resolvePending(second);
    expect(secondResult.status).toBe("approved");
    expect(secondResult.rejectionReason).toBeUndefined();
  });
});
