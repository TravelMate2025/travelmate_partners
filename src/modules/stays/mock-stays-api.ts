import { transitionStatus } from "@/modules/stays/state-machine";
import type {
  AddStayImageInput,
  StayImage,
  StayListing,
  StayRoom,
  StaysApi,
  UpdateStayInput,
} from "@/modules/stays/contracts";

type MockStaysState = {
  byUserId: Record<string, StayListing[]>;
};

const STORAGE_KEY = "tm_partner_stays_state_v1";
const MAX_IMAGES = 12;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readState(): MockStaysState {
  if (typeof window === "undefined") {
    return { byUserId: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { byUserId: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MockStaysState>;
    return {
      byUserId:
        parsed && parsed.byUserId && typeof parsed.byUserId === "object" ? parsed.byUserId : {},
    };
  } catch {
    return { byUserId: {} };
  }
}

function writeState(state: MockStaysState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensure(state: MockStaysState, userId: string) {
  const items = state.byUserId[userId] ?? [];
  state.byUserId[userId] = items;
  return items;
}

function findStay(items: StayListing[], stayId: string) {
  const item = items.find((stay) => stay.id === stayId);
  if (!item) {
    throw new Error("Stay not found.");
  }
  return item;
}

function validateImage(input: AddStayImageInput) {
  if (!ALLOWED_IMAGE_TYPES.includes(input.fileType)) {
    throw new Error("Invalid image format. Allowed: PNG, JPEG, WEBP.");
  }

  if (input.fileSize <= 0 || input.fileSize > MAX_IMAGE_SIZE) {
    throw new Error("Image size must be between 1 byte and 8MB.");
  }
}

function patch(item: StayListing, input: UpdateStayInput) {
  const next = {
    ...item,
    ...input,
    amenities: input.amenities ?? item.amenities,
    updatedAt: nowIso(),
  };

  return next;
}

export const mockStaysApi: StaysApi = {
  async listStays(userId) {
    const state = readState();
    const items = ensure(state, userId);
    return [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  },

  async getStay(userId, stayId) {
    const state = readState();
    const items = ensure(state, userId);
    return findStay(items, stayId);
  },

  async createStay(userId, input) {
    const state = readState();
    const items = ensure(state, userId);
    const ts = nowIso();

    const stay: StayListing = {
      id: makeId(),
      userId,
      status: "draft",
      propertyType: input.propertyType,
      name: input.name,
      description: input.description,
      address: input.address,
      city: input.city,
      country: input.country,
      amenities: [],
      houseRules: "",
      checkInTime: "",
      checkOutTime: "",
      cancellationPolicy: "",
      images: [],
      rooms: [],
      createdAt: ts,
      updatedAt: ts,
    };

    items.push(stay);
    writeState(state);
    return stay;
  },

  async updateStay(userId, stayId, input) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findStay(items, stayId);
    const next = patch(current, input);
    const index = items.findIndex((item) => item.id === stayId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async updateStatus(userId, stayId, status) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findStay(items, stayId);

    let next = transitionStatus(current, status);

    // Mock moderation behavior: immediately resolve pending for local dev.
    if (status === "pending") {
      const submissionCount = (current.submissionCount ?? 0) + 1;
      if (submissionCount === 1) {
        next = transitionStatus(next, "rejected");
        next.moderationFeedback =
          "First review rejected: please add at least one room and clearer property description.";
      } else {
        next = transitionStatus(next, "approved");
        next.moderationFeedback = undefined;
      }
      next.submissionCount = submissionCount;
    }

    const index = items.findIndex((item) => item.id === stayId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async addImage(userId, stayId, input) {
    validateImage(input);
    const state = readState();
    const items = ensure(state, userId);
    const current = findStay(items, stayId);

    if (current.images.length >= MAX_IMAGES) {
      throw new Error("Maximum image count reached.");
    }

    const image: StayImage = {
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

    const index = items.findIndex((item) => item.id === stayId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async removeImage(userId, stayId, imageId) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findStay(items, stayId);

    const images = current.images
      .filter((img) => img.id !== imageId)
      .map((img, index) => ({ ...img, order: index }));

    const next = {
      ...current,
      images,
      updatedAt: nowIso(),
    };

    const index = items.findIndex((item) => item.id === stayId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async reorderImages(userId, stayId, imageIds) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findStay(items, stayId);

    const byId = new Map(current.images.map((img) => [img.id, img]));
    const reordered: StayImage[] = [];

    for (const imageId of imageIds) {
      const img = byId.get(imageId);
      if (img) {
        reordered.push(img);
      }
    }

    for (const img of current.images) {
      if (!reordered.find((item) => item.id === img.id)) {
        reordered.push(img);
      }
    }

    const images = reordered.map((img, index) => ({ ...img, order: index }));

    const next = {
      ...current,
      images,
      updatedAt: nowIso(),
    };

    const index = items.findIndex((item) => item.id === stayId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async upsertRoom(userId, stayId, input) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findStay(items, stayId);

    if (!input.name.trim()) {
      throw new Error("Room name is required.");
    }

    if (input.occupancy <= 0 || input.baseRate < 0) {
      throw new Error("Invalid room occupancy or base rate.");
    }

    const rooms: StayRoom[] = [...current.rooms];

    if (input.id) {
      const idx = rooms.findIndex((room) => room.id === input.id);
      if (idx === -1) {
        throw new Error("Room not found.");
      }
      rooms[idx] = {
        id: input.id,
        name: input.name,
        occupancy: input.occupancy,
        bedConfiguration: input.bedConfiguration,
        baseRate: input.baseRate,
      };
    } else {
      rooms.push({
        id: makeId(),
        name: input.name,
        occupancy: input.occupancy,
        bedConfiguration: input.bedConfiguration,
        baseRate: input.baseRate,
      });
    }

    const next = {
      ...current,
      rooms,
      updatedAt: nowIso(),
    };

    const index = items.findIndex((item) => item.id === stayId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async removeRoom(userId, stayId, roomId) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findStay(items, stayId);

    const next = {
      ...current,
      rooms: current.rooms.filter((room) => room.id !== roomId),
      updatedAt: nowIso(),
    };

    const index = items.findIndex((item) => item.id === stayId);
    items[index] = next;
    writeState(state);
    return next;
  },

  async archiveStay(userId, stayId) {
    const state = readState();
    const items = ensure(state, userId);
    const current = findStay(items, stayId);
    const next = transitionStatus(current, "archived");

    const index = items.findIndex((item) => item.id === stayId);
    items[index] = next;
    writeState(state);
    return next;
  },
};
