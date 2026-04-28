import type {
  AddTransferImageInput,
  CreateTransferInput,
  ReplaceTransferImageInput,
  TransferImage,
  TransferListing,
  TransfersApi,
  UpdateTransferInput,
} from "@/modules/transfers/contracts";
import { validateMediaFile } from "@/modules/media/file-validation";
import { transitionTransferStatus } from "@/modules/transfers/state-machine";
import { buildTransferQualityReport } from "@/modules/data-quality/listing-quality";
import { recordAuditEvent } from "@/modules/audit/audit-log";
import { notificationsClient } from "@/modules/notifications/notifications-client";

type MockTransfersState = {
  byUserId: Record<string, TransferListing[]>;
};

const STORAGE_KEY = "tm_partner_transfers_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readState(): MockTransfersState {
  if (typeof window === "undefined") {
    return { byUserId: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { byUserId: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MockTransfersState>;
    return {
      byUserId:
        parsed && parsed.byUserId && typeof parsed.byUserId === "object" ? parsed.byUserId : {},
    };
  } catch {
    return { byUserId: {} };
  }
}

function writeState(state: MockTransfersState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensure(state: MockTransfersState, userId: string) {
  const items = state.byUserId[userId] ?? [];
  state.byUserId[userId] = items;
  return items;
}

function findTransfer(items: TransferListing[], transferId: string) {
  const item = items.find((transfer) => transfer.id === transferId);
  if (!item) {
    throw new Error("Transfer not found.");
  }
  if (!Array.isArray(item.images)) {
    item.images = [];
  }
  return item;
}

function patch(item: TransferListing, input: UpdateTransferInput) {
  const next = {
    ...item,
    ...input,
    features: input.features ?? item.features,
    updatedAt: nowIso(),
  };

  return next;
}

function validateImage(input: AddTransferImageInput) {
  validateMediaFile("transfer_image", input);
}

async function emitListingModeration(userId: string, contextLabel: string) {
  try {
    await notificationsClient.emitEvent(userId, {
      eventType: "listing_moderation_updated",
      channels: ["in_app", "email"],
      contextLabel,
    });
  } catch {
    // Notification failures should never block listing workflows.
  }
}

async function emitIncompleteReminder(userId: string, contextLabel: string) {
  try {
    await notificationsClient.emitEvent(userId, {
      eventType: "incomplete_listing_reminder",
      channels: ["in_app"],
      contextLabel,
    });
  } catch {
    // Notification failures should never block listing workflows.
  }
}

function createFromInput(userId: string, input: CreateTransferInput): TransferListing {
  const ts = nowIso();
  return {
    id: makeId(),
    userId,
    status: "draft",
    name: input.name,
    description: "",
    transferType: input.transferType,
    pickupPoint: input.pickupPoint,
    dropoffPoint: input.dropoffPoint,
    vehicleClass: input.vehicleClass,
    passengerCapacity: input.passengerCapacity,
    luggageCapacity: input.luggageCapacity,
    features: [],
    coverageArea: input.coverageArea,
    operatingHours: "",
    currency: "NGN",
    baseFare: input.baseFare ?? 0,
    nightSurcharge: 0,
    cancellationPolicy: "",
    images: [],
    createdAt: ts,
    updatedAt: ts,
  };
}

export const mockTransfersApi: TransfersApi = {
  async listTransfers(userId) {
    const state = readState();
    const items = ensure(state, userId);
    return [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  },

  async getTransfer(userId, transferId) {
    const state = readState();
    const items = ensure(state, userId);
    return findTransfer(items, transferId);
  },

  async createTransfer(userId, input) {
    const state = readState();
    const items = ensure(state, userId);
    const item = createFromInput(userId, input);
    items.push(item);
    writeState(state);
    return item;
  },

  async updateTransfer(userId, transferId, input) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findTransfer(items, transferId);
    const next = patch(current, input);
    const index = items.findIndex((item) => item.id === transferId);
    items[index] = next;

    if (status === "live") {
      recordAuditEvent({
        userId,
        action: "listing_published",
        entityType: "transfer",
        entityId: transferId,
      });
    } else if (status === "paused") {
      recordAuditEvent({
        userId,
        action: "listing_paused",
        entityType: "transfer",
        entityId: transferId,
      });
    }

    writeState(state);
    return next;
  },

  async updateStatus(userId, transferId, status) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findTransfer(items, transferId);
    const qualityReport = buildTransferQualityReport(current, items);

    if (status === "pending" && qualityReport.missingRequiredFields.length > 0) {
      await emitIncompleteReminder(
        userId,
        `transfer "${current.name || "Untitled transfer"}": ${qualityReport.missingRequiredFields.join(", ")}`,
      );
      throw new Error(
        `Cannot submit transfer. Missing required fields: ${qualityReport.missingRequiredFields.join(", ")}.`,
      );
    }

    let next = transitionTransferStatus(current, status);

    if (status === "pending") {
      const submissionCount = (current.submissionCount ?? 0) + 1;
      if (submissionCount === 1) {
        next = transitionTransferStatus(next, "rejected");
        next.moderationFeedback =
          "First review rejected: add clearer route coverage and vehicle details.";
      } else {
        next = transitionTransferStatus(next, "approved");
        next.moderationFeedback = undefined;
      }
      next.submissionCount = submissionCount;

      if (qualityReport.duplicateWarnings.length > 0) {
        next.moderationFeedback = [
          next.moderationFeedback,
          ...qualityReport.duplicateWarnings,
        ]
          .filter(Boolean)
          .join(" ");
      }

      await emitListingModeration(
        userId,
        `transfer "${next.name || "Untitled transfer"}" moved to ${next.status}`,
      );
    }

    const index = items.findIndex((item) => item.id === transferId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async archiveTransfer(userId, transferId) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findTransfer(items, transferId);
    const next = transitionTransferStatus(current, "archived");

    const index = items.findIndex((item) => item.id === transferId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async addImage(userId, transferId, input) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findTransfer(items, transferId);
    validateMediaFile("transfer_image", { ...input, currentCount: current.images.length });

    const image: TransferImage = {
      id: makeId(),
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      order: current.images.length,
      uploadedAt: nowIso(),
    };

    const next = {
      ...current,
      images: [...current.images, image],
      updatedAt: nowIso(),
    };
    const index = items.findIndex((item) => item.id === transferId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async replaceImage(userId, transferId, imageId, input: ReplaceTransferImageInput) {
    validateImage(input);
    const state = readState();
    const items = ensure(state, userId);
    const current = findTransfer(items, transferId);

    const targetIndex = current.images.findIndex((img) => img.id === imageId);
    if (targetIndex === -1) {
      throw new Error("Image not found.");
    }

    const existing = current.images[targetIndex];
    const images = [...current.images];
    images[targetIndex] = {
      ...existing,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      uploadedAt: nowIso(),
    };

    const next = {
      ...current,
      images,
      updatedAt: nowIso(),
    };
    const index = items.findIndex((item) => item.id === transferId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async removeImage(userId, transferId, imageId) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findTransfer(items, transferId);

    const images = current.images
      .filter((img) => img.id !== imageId)
      .map((img, index) => ({ ...img, order: index }));

    const next = {
      ...current,
      images,
      updatedAt: nowIso(),
    };
    const index = items.findIndex((item) => item.id === transferId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async reorderImages(userId, transferId, imageIds) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findTransfer(items, transferId);

    const byId = new Map(current.images.map((img) => [img.id, img]));
    const reordered: TransferImage[] = [];

    for (const imageId of imageIds) {
      const image = byId.get(imageId);
      if (image) {
        reordered.push(image);
      }
    }

    for (const image of current.images) {
      if (!reordered.find((item) => item.id === image.id)) {
        reordered.push(image);
      }
    }

    const images = reordered.map((image, index) => ({ ...image, order: index }));
    const next = {
      ...current,
      images,
      updatedAt: nowIso(),
    };
    const index = items.findIndex((item) => item.id === transferId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async submitAppeal(userId, transferId, message) {
    return {
      id: `mock-appeal-${transferId}`,
      listingKind: "transfer" as const,
      listingId: transferId,
      partnerId: userId,
      message,
      status: "pending" as const,
      resolution: null,
      resolutionNote: "",
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async getAppeal(_userId, _transferId) {
    return null;
  },
};
