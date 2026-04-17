import { recordAuditEvent } from "@/modules/audit/audit-log";
import type {
  PartnerSettings,
  SubmitSupportTicketInput,
  SupportSettingsApi,
  SupportTicket,
  UpdatePartnerSettingsInput,
} from "@/modules/support-settings/contracts";

type State = {
  settingsByUserId: Record<string, PartnerSettings>;
  ticketsByUserId: Record<string, SupportTicket[]>;
};

const STORAGE_KEY = "tm_partner_support_settings_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readState(): State {
  if (typeof window === "undefined") {
    return { settingsByUserId: {}, ticketsByUserId: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { settingsByUserId: {}, ticketsByUserId: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      settingsByUserId:
        parsed.settingsByUserId && typeof parsed.settingsByUserId === "object"
          ? parsed.settingsByUserId
          : {},
      ticketsByUserId:
        parsed.ticketsByUserId && typeof parsed.ticketsByUserId === "object"
          ? parsed.ticketsByUserId
          : {},
    };
  } catch {
    return { settingsByUserId: {}, ticketsByUserId: {} };
  }
}

function writeState(state: State) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createDefaultSettings(userId: string): PartnerSettings {
  return {
    userId,
    supportContactEmail: "",
    language: "en",
    timezone: "Africa/Lagos",
    security2FARequired: false,
    notificationsInApp: true,
    notificationsEmail: true,
    deactivationRequested: false,
    updatedAt: nowIso(),
  };
}

function ensureSettings(state: State, userId: string) {
  const current = state.settingsByUserId[userId] ?? createDefaultSettings(userId);
  state.settingsByUserId[userId] = current;
  return current;
}

function ensureTickets(state: State, userId: string) {
  const current = state.ticketsByUserId[userId] ?? [];
  state.ticketsByUserId[userId] = current;
  return current;
}

function validateEmail(value: string) {
  if (!value.includes("@") || value.trim().length < 5) {
    throw new Error("Support contact email is invalid.");
  }
}

function validateTicketInput(input: SubmitSupportTicketInput) {
  if (input.subject.trim().length < 4) {
    throw new Error("Support ticket subject must be at least 4 characters.");
  }
  if (input.message.trim().length < 12) {
    throw new Error("Support ticket message must be at least 12 characters.");
  }
}

export const mockSupportSettingsApi: SupportSettingsApi = {
  async getSettings(userId) {
    const state = readState();
    const settings = ensureSettings(state, userId);
    writeState(state);
    return settings;
  },

  async updateSettings(userId, input: UpdatePartnerSettingsInput) {
    const state = readState();
    const current = ensureSettings(state, userId);

    if (
      typeof input.supportContactEmail === "string" &&
      input.supportContactEmail.trim().length > 0
    ) {
      validateEmail(input.supportContactEmail);
    }

    const next: PartnerSettings = {
      ...current,
      ...input,
      updatedAt: nowIso(),
    };

    state.settingsByUserId[userId] = next;
    recordAuditEvent({
      userId,
      action: "settings_updated",
      entityType: "settings",
      entityId: userId,
    });
    writeState(state);
    return next;
  },

  async listSupportTickets(userId) {
    const state = readState();
    const tickets = ensureTickets(state, userId);
    writeState(state);
    return [...tickets].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async submitSupportTicket(userId, input: SubmitSupportTicketInput) {
    validateTicketInput(input);
    const state = readState();
    const tickets = ensureTickets(state, userId);
    const ts = nowIso();
    const created: SupportTicket = {
      id: makeId(),
      userId,
      category: input.category,
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: "open",
      createdAt: ts,
      updatedAt: ts,
    };

    tickets.unshift(created);
    state.ticketsByUserId[userId] = tickets;
    recordAuditEvent({
      userId,
      action: "support_ticket_submitted",
      entityType: "support",
      entityId: created.id,
      metadata: { category: created.category },
    });
    writeState(state);
    return [...tickets];
  },

  async requestDeactivation(userId, input) {
    if (input.reason.trim().length < 10) {
      throw new Error("Deactivation reason must be at least 10 characters.");
    }

    const state = readState();
    const current = ensureSettings(state, userId);
    const next: PartnerSettings = {
      ...current,
      deactivationRequested: true,
      deactivationReason: input.reason.trim(),
      updatedAt: nowIso(),
    };
    state.settingsByUserId[userId] = next;
    recordAuditEvent({
      userId,
      action: "account_deactivation_requested",
      entityType: "account",
      entityId: userId,
    });
    writeState(state);
    return next;
  },
};
