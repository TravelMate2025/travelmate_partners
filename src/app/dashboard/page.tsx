"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardWidgets } from "@/components/common/dashboard/dashboard-widgets";
import { PartnerShell } from "@/components/common/partner-shell";
import { SessionManager } from "@/components/common/session-manager";
import type { PartnerUser } from "@/modules/auth/contracts";
import { authClient } from "@/modules/auth/auth-client";
import { getErrorMessage, isAuthenticationError } from "@/modules/auth/http-errors";
import type { PartnerDashboardData, QuickActionType } from "@/modules/dashboard/contracts";
import { dashboardClient } from "@/modules/dashboard/dashboard-client";
import { profileClient } from "@/modules/profile/profile-client";
import { verificationClient } from "@/modules/verification/verification-client";

export default function DashboardPage() {
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const currentUser = await authClient.me();
        const onboarding = await profileClient.getOnboarding(currentUser.id);

        if (!active) {
          return;
        }

        if (onboarding.status !== "completed") {
          router.replace("/onboarding");
          return;
        }

        const verification = await verificationClient.getVerification(currentUser.id);
        if (verification.status !== "approved") {
          router.replace("/verification");
          return;
        }

        const dashboard = await dashboardClient.getDashboard(currentUser.id);

        setUser(currentUser);
        setDashboardData(dashboard);
        setLoadError("");
        setLoading(false);
      } catch (error) {
        if (!active) {
          return;
        }

        if (isAuthenticationError(error)) {
          router.replace("/auth/login");
          return;
        }

        setLoadError(getErrorMessage(error, "Failed to load dashboard."));
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading || !dashboardData) {
    if (!loading && loadError) {
      return (
        <main className="tm-page">
          <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
            <p className="text-sm font-medium text-rose-700">{loadError}</p>
            <p className="mt-2 text-sm text-slate-600">
              Your session is still intact. Retry once the dependent API route is healthy.
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PartnerShell
      title="Partner Dashboard"
      description="Track listing performance, alerts, and operational actions."
      headerExtra={
        <p className="tm-muted text-sm">
          Signed in as {user.email} • Email verification: {user.emailVerified ? "Verified" : "Pending"}
        </p>
      }
    >
      <DashboardWidgets
        data={dashboardData}
        onNavigateQuickAction={(action: QuickActionType) => {
          if (!user) {
            return;
          }

          if (action === "add_stay") {
            router.push("/stays/new");
            return;
          }

          if (action === "add_transfer") {
            void dashboardClient.recordQuickAction(user.id, action).then(setDashboardData);
            router.push("/transfers");
            return;
          }

          if (action === "update_availability") {
            void dashboardClient.recordQuickAction(user.id, action).then(setDashboardData);
            router.push("/pricing-availability");
          }
        }}
        onRefresh={async () => {
          if (!user) {
            return;
          }

          const next = await dashboardClient.getDashboard(user.id);
          setDashboardData(next);
        }}
      />

      <SessionManager />
    </PartnerShell>
  );
}
