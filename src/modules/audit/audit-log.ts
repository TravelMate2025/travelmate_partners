export type AuditAction =
  | "verification_document_added"
  | "verification_document_replaced"
  | "verification_document_removed"
  | "verification_submitted"
  | "listing_published"
  | "listing_paused"
  | "settings_updated"
  | "support_ticket_submitted"
  | "account_deactivation_requested";

export type AuditEntityType =
  | "verification"
  | "stay"
  | "transfer"
  | "settings"
  | "support"
  | "account";

export type AuditEvent = {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  occurredAt: string;
  metadata?: Record<string, string | number | boolean>;
};

type AuditState = {
  events: AuditEvent[];
};

const STORAGE_KEY = "tm_partner_audit_state_v1";
let memoryState: AuditState = { events: [] };

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readState(): AuditState {
  if (typeof window === "undefined") {
    return memoryState;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { events: [] };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AuditState>;
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { events: [] };
  }
}

function writeState(state: AuditState) {
  if (typeof window === "undefined") {
    memoryState = state;
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function recordAuditEvent(input: Omit<AuditEvent, "id" | "occurredAt">) {
  const state = readState();
  const event: AuditEvent = {
    id: makeId(),
    occurredAt: new Date().toISOString(),
    ...input,
  };
  state.events.push(event);
  writeState(state);
  return event;
}

export function listAuditEvents(userId: string) {
  const state = readState();
  return state.events.filter((event) => event.userId === userId);
}

export function clearAuditEvents() {
  memoryState = { events: [] };
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
