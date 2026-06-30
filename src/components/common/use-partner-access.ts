"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/auth-client";
import type { PartnerUser } from "@/modules/auth/contracts";
import { isAuthenticationError } from "@/modules/auth/http-errors";
import { profileClient } from "@/modules/profile/profile-client";
import { verificationClient } from "@/modules/verification/verification-client";

type UsePartnerAccessOptions = {
  requireCompletedOnboarding?: boolean;
  requireApprovedVerification?: boolean;
};

export function usePartnerAccess(options?: UsePartnerAccessOptions) {
  const requireCompletedOnboarding = options?.requireCompletedOnboarding ?? true;
  const requireApprovedVerification = options?.requireApprovedVerification ?? true;
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // Keep a ref so the effect always calls the latest router without being
  // re-triggered by router reference changes (Next.js App Router can issue a
  // new router object on internal navigation state updates, which would cause
  // the auth check to loop if router were listed as a dependency).
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    let active = true;

    authClient
      .me()
      .then(async (currentUser) => {
        if (!active) return;

        if (requireCompletedOnboarding) {
          const onboarding = await profileClient.getOnboarding(currentUser.id);
          if (!active) return;
          if (onboarding.status !== "completed") {
            routerRef.current.replace("/onboarding");
            return;
          }
        }

        if (requireApprovedVerification) {
          const verification = await verificationClient.getVerification(currentUser.id);
          if (!active) return;
          if (verification.status !== "approved") {
            routerRef.current.replace("/verification");
            return;
          }
        }

        setUser(currentUser);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        if (!isAuthenticationError(err)) {
          setError(err instanceof Error ? err.message : "Failed to load account. Please refresh.");
          setLoading(false);
          return;
        }
        routerRef.current.replace("/auth/login");
      });

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireApprovedVerification, requireCompletedOnboarding]);

  return { user, loading, error };
}
