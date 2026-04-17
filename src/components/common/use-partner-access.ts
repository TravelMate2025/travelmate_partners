"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/auth-client";
import type { PartnerUser } from "@/modules/auth/contracts";
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
  const router = useRouter();

  useEffect(() => {
    let active = true;

    authClient
      .me()
      .then(async (currentUser) => {
        if (requireCompletedOnboarding) {
          const onboarding = await profileClient.getOnboarding(currentUser.id);
          if (onboarding.status !== "completed") {
            router.replace("/onboarding");
            return;
          }
        }

        if (requireApprovedVerification) {
          const verification = await verificationClient.getVerification(currentUser.id);
          if (verification.status !== "approved") {
            router.replace("/verification");
            return;
          }
        }

        if (!active) {
          return;
        }

        setUser(currentUser);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          router.replace("/auth/login");
        }
      });

    return () => {
      active = false;
    };
  }, [requireApprovedVerification, requireCompletedOnboarding, router]);

  return { user, loading };
}
