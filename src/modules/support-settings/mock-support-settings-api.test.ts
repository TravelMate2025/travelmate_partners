import { beforeEach, describe, expect, it } from "vitest";

import {
  clearAuditEvents,
  listAuditEvents,
} from "@/modules/audit/audit-log";
import { mockSupportSettingsApi } from "@/modules/support-settings/mock-support-settings-api";

describe("mockSupportSettingsApi", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearAuditEvents();
  });

  it("updates settings, submits support ticket, and requests deactivation with audit logs", async () => {
    const userId = "u1";

    const settings = await mockSupportSettingsApi.updateSettings(userId, {
      supportContactEmail: "support@example.com",
      security2FARequired: true,
      timezone: "Africa/Lagos",
    });
    expect(settings.supportContactEmail).toBe("support@example.com");
    expect(settings.security2FARequired).toBe(true);

    const tickets = await mockSupportSettingsApi.submitSupportTicket(userId, {
      category: "technical",
      subject: "Cannot save profile",
      message: "Saving profile fails with a validation error on submit.",
    });
    expect(tickets.length).toBe(1);
    expect(tickets[0].status).toBe("open");

    const deactivation = await mockSupportSettingsApi.requestDeactivation(userId, {
      reason: "No longer operating this business account",
    });
    expect(deactivation.deactivationRequested).toBe(true);

    const events = listAuditEvents(userId);
    expect(events.some((event) => event.action === "settings_updated")).toBe(true);
    expect(
      events.some((event) => event.action === "support_ticket_submitted"),
    ).toBe(true);
    expect(
      events.some((event) => event.action === "account_deactivation_requested"),
    ).toBe(true);
  });
});
