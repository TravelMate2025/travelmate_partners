export type ToastKind = "success" | "error" | "info";

export type ToastPayload = {
  id?: string;
  message: string;
  kind?: ToastKind;
};

const TOAST_EVENT = "tm:toast";

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function inferKind(message: string): ToastKind {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("failed")
    || normalized.includes("invalid")
    || normalized.includes("error")
    || normalized.includes("cannot")
    || normalized.includes("unauthorized")
  ) {
    return "error";
  }
  if (
    normalized.includes("saved")
    || normalized.includes("submitted")
    || normalized.includes("updated")
    || normalized.includes("created")
    || normalized.includes("archived")
    || normalized.includes("added")
    || normalized.includes("removed")
    || normalized.includes("exported")
    || normalized.includes("downloaded")
    || normalized.includes("refreshed")
    || normalized.includes("approved")
    || normalized.includes("live")
  ) {
    return "success";
  }
  return "info";
}

export function showToast(input: ToastPayload) {
  if (typeof window === "undefined") {
    return;
  }
  const payload: ToastPayload = {
    id: input.id ?? makeId(),
    message: input.message,
    kind: input.kind ?? inferKind(input.message),
  };
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
}

export function toastEventName() {
  return TOAST_EVENT;
}
