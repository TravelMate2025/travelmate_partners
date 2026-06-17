"use client";

export const PARTNER_SESSION_COOKIE = "tm_partner_session";

const ONE_DAY_SECONDS = 24 * 60 * 60;

// This cookie is a client-side UX redirect guard only — it cannot carry HttpOnly
// because it must be written from browser JS. Real data protection is enforced by
// Bearer auth on every API call. Add `Secure` so it is never sent over plain HTTP.
const SECURE_ATTR = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";

export function setPartnerSessionCookie(active: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  if (active) {
    document.cookie = `${PARTNER_SESSION_COOKIE}=1; path=/; max-age=${ONE_DAY_SECONDS}; samesite=lax${SECURE_ATTR}`;
    return;
  }

  document.cookie = `${PARTNER_SESSION_COOKIE}=; path=/; max-age=0; samesite=lax${SECURE_ATTR}`;
}
