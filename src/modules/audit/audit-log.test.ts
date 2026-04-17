import { beforeEach, describe, expect, it } from "vitest";

import { clearAuditEvents, listAuditEvents, recordAuditEvent } from "@/modules/audit/audit-log";

describe("audit log", () => {
  beforeEach(() => {
    clearAuditEvents();
  });

  it("records and filters audit events by user", () => {
    recordAuditEvent({
      userId: "u1",
      action: "verification_submitted",
      entityType: "verification",
      entityId: "u1",
    });
    recordAuditEvent({
      userId: "u2",
      action: "listing_published",
      entityType: "stay",
      entityId: "stay-1",
    });

    const user1Events = listAuditEvents("u1");
    expect(user1Events).toHaveLength(1);
    expect(user1Events[0].action).toBe("verification_submitted");
  });
});
