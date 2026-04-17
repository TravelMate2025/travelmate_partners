import {
  canSubmitVerification,
  resolvePending,
  shouldAutoResolvePending,
} from "@/modules/verification/state-machine";
import { recordAuditEvent } from "@/modules/audit/audit-log";
import { validateMediaFile } from "@/modules/media/file-validation";
import type {
  AddVerificationDocumentInput,
  PartnerVerification,
  ReplaceVerificationDocumentInput,
  VerificationApi,
} from "@/modules/verification/contracts";

type MockVerificationState = {
  byUserId: Record<string, PartnerVerification>;
};

const STORAGE_KEY = "tm_partner_verification_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDefault(userId: string): PartnerVerification {
  return {
    userId,
    status: "pending",
    documents: [],
    submissionCount: 0,
    updatedAt: nowIso(),
  };
}

function readState(): MockVerificationState {
  if (typeof window === "undefined") {
    return { byUserId: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { byUserId: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MockVerificationState>;
    return {
      byUserId:
        parsed && parsed.byUserId && typeof parsed.byUserId === "object" ? parsed.byUserId : {},
    };
  } catch {
    return { byUserId: {} };
  }
}

function writeState(state: MockVerificationState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensure(state: MockVerificationState, userId: string) {
  const existing = state.byUserId[userId] ?? createDefault(userId);

  if (shouldAutoResolvePending(existing)) {
    state.byUserId[userId] = resolvePending(existing);
    return state.byUserId[userId];
  }

  state.byUserId[userId] = existing;
  return existing;
}

function validateDocumentInput(input: AddVerificationDocumentInput) {
  validateMediaFile("verification_document", input);
}

export const mockVerificationApi: VerificationApi = {
  async getVerification(userId: string) {
    const state = readState();
    const item = ensure(state, userId);
    writeState(state);
    return item;
  },

  async addDocument(userId: string, input: AddVerificationDocumentInput) {
    const state = readState();
    const item = ensure(state, userId);

    validateMediaFile("verification_document", { ...input, currentCount: item.documents.length });

    item.documents.push({
      id: makeId(),
      category: input.category,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      uploadedAt: nowIso(),
    });

    item.updatedAt = nowIso();

    if (item.status === "approved") {
      item.status = "rejected";
      item.rejectionReason = "Profile changed after approval. Re-submit verification.";
    }

    recordAuditEvent({
      userId,
      action: "verification_document_added",
      entityType: "verification",
      entityId: userId,
      metadata: { category: input.category },
    });

    writeState(state);
    return item;
  },

  async replaceDocument(userId: string, documentId: string, input: ReplaceVerificationDocumentInput) {
    validateDocumentInput(input);

    const state = readState();
    const item = ensure(state, userId);

    const index = item.documents.findIndex((doc) => doc.id === documentId);
    if (index === -1) {
      throw new Error("Document not found.");
    }

    item.documents[index] = {
      ...item.documents[index],
      category: input.category,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      uploadedAt: nowIso(),
    };
    item.updatedAt = nowIso();

    if (item.status === "approved") {
      item.status = "rejected";
      item.rejectionReason = "Profile changed after approval. Re-submit verification.";
    }

    recordAuditEvent({
      userId,
      action: "verification_document_replaced",
      entityType: "verification",
      entityId: userId,
      metadata: { category: input.category },
    });

    writeState(state);
    return item;
  },

  async removeDocument(userId: string, documentId: string) {
    const state = readState();
    const item = ensure(state, userId);
    item.documents = item.documents.filter((doc) => doc.id !== documentId);
    item.updatedAt = nowIso();
    recordAuditEvent({
      userId,
      action: "verification_document_removed",
      entityType: "verification",
      entityId: userId,
      metadata: { documentId },
    });
    writeState(state);
    return item;
  },

  async submitVerification(userId: string) {
    const state = readState();
    const item = ensure(state, userId);

    if (!canSubmitVerification(item)) {
      throw new Error("Cannot submit verification in current status or without documents.");
    }

    item.status = "in_review";
    item.rejectionReason = undefined;
    item.submissionCount += 1;
    item.submittedAt = nowIso();
    item.updatedAt = nowIso();
    recordAuditEvent({
      userId,
      action: "verification_submitted",
      entityType: "verification",
      entityId: userId,
      metadata: { submissionCount: item.submissionCount },
    });

    writeState(state);
    return item;
  },
};
