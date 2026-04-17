import { beforeEach, describe, expect, it } from "vitest";

import {
  clearAuditEvents,
  listAuditEvents,
} from "@/modules/audit/audit-log";
import { supportSettingsClient } from "@/modules/support-settings/support-settings-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.13 strict alignment (partner support and settings)", () => {
  beforeEach(() => {
    resetStorage();
    clearAuditEvents();
  });

  it("supports opening settings, updating preferences, submitting support request, and recording audit trail", async () => {
    const userId = "flow213-user";

    const initial = await supportSettingsClient.getSettings(userId);
    expect(initial.userId).toBe(userId);

    const updated = await supportSettingsClient.updateSettings(userId, {
      supportContactEmail: "support@travelmate-partner.com",
      language: "en",
      timezone: "Africa/Lagos",
      security2FARequired: true,
      notificationsInApp: true,
      notificationsEmail: true,
    });
    expect(updated.supportContactEmail).toBe("support@travelmate-partner.com");
    expect(updated.security2FARequired).toBe(true);

    const tickets = await supportSettingsClient.submitSupportTicket(userId, {
      category: "listing",
      subject: "Need help with listing rejection",
      message: "Please help me understand why the listing keeps being rejected.",
    });
    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets[0].status).toBe("open");

    const deactivation = await supportSettingsClient.requestDeactivation(userId, {
      reason: "Business operations are paused indefinitely this quarter.",
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
