"use client";

export const PARTNER_SESSION_COOKIE = "tm_partner_session";

const ONE_DAY_SECONDS = 24 * 60 * 60;

export function setPartnerSessionCookie(active: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  if (active) {
    document.cookie = `${PARTNER_SESSION_COOKIE}=1; path=/; max-age=${ONE_DAY_SECONDS}; samesite=lax`;
    return;
  }

  document.cookie = `${PARTNER_SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
