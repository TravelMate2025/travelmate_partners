import {
  canSubmitVerification,
  resolvePending,
  shouldAutoResolvePending,
} from "@/modules/verification/state-machine";
import type {
  AddVerificationDocumentInput,
  PartnerVerification,
  VerificationApi,
} from "@/modules/verification/contracts";

type MockVerificationState = {
  byUserId: Record<string, PartnerVerification>;
};

const STORAGE_KEY = "tm_partner_verification_state_v1";
const MAX_DOCS = 12;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

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
    status: "not_started",
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
  if (!input.fileName.trim()) {
    throw new Error("Document filename is required.");
  }

  if (!ALLOWED_TYPES.includes(input.fileType)) {
    throw new Error("Unsupported file type. Allowed: PDF, PNG, JPEG.");
  }

  if (input.fileSize <= 0 || input.fileSize > MAX_FILE_SIZE) {
    throw new Error("File size must be between 1 byte and 8MB.");
  }
}

export const mockVerificationApi: VerificationApi = {
  async getVerification(userId: string) {
    const state = readState();
    const item = ensure(state, userId);
    writeState(state);
    return item;
  },

  async addDocument(userId: string, input: AddVerificationDocumentInput) {
    validateDocumentInput(input);

    const state = readState();
    const item = ensure(state, userId);

    if (item.documents.length >= MAX_DOCS) {
      throw new Error("Maximum document count reached.");
    }

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

    writeState(state);
    return item;
  },

  async removeDocument(userId: string, documentId: string) {
    const state = readState();
    const item = ensure(state, userId);
    item.documents = item.documents.filter((doc) => doc.id !== documentId);
    item.updatedAt = nowIso();
    writeState(state);
    return item;
  },

  async submitVerification(userId: string) {
    const state = readState();
    const item = ensure(state, userId);

    if (!canSubmitVerification(item)) {
      throw new Error("Cannot submit verification in current status or without documents.");
    }

    item.status = "pending";
    item.rejectionReason = undefined;
    item.submissionCount += 1;
    item.submittedAt = nowIso();
    item.updatedAt = nowIso();

    writeState(state);
    return item;
  },
};
