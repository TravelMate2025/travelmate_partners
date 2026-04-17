"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/auth-client";
import { PartnerShell } from "@/components/common/partner-shell";
import type { PartnerUser } from "@/modules/auth/contracts";
import { profileClient } from "@/modules/profile/profile-client";
import { staysClient } from "@/modules/stays/stays-client";
import type { StayListing, StayStatus } from "@/modules/stays/contracts";
import { verificationClient } from "@/modules/verification/verification-client";

export default function StaysPage() {
  const router = useRouter();
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [items, setItems] = useState<StayListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    authClient
      .me()
      .then(async (currentUser) => {
        const onboarding = await profileClient.getOnboarding(currentUser.id);
        if (onboarding.status !== "completed") {
          router.replace("/onboarding");
          return;
        }

        const verification = await verificationClient.getVerification(currentUser.id);
        if (verification.status !== "approved") {
          router.replace("/verification");
          return;
        }

        const stays = await staysClient.listStays(currentUser.id);
        if (!active) {
          return;
        }

        setUser(currentUser);
        setItems(stays);
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
  }, [router]);

  async function refresh(currentUser: PartnerUser) {
    const stays = await staysClient.listStays(currentUser.id);
    setItems(stays);
  }

  async function changeStatus(stayId: string, nextStatus: StayStatus) {
    if (!user) {
      return;
    }

    setBusyId(stayId);
    setMessage("");

    try {
      await staysClient.updateStatus(user.id, stayId, nextStatus);
      await refresh(user);
      setMessage(`Stay moved to ${nextStatus}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function archive(stayId: string) {
    if (!user) {
      return;
    }

    setBusyId(stayId);
    setMessage("");

    try {
      await staysClient.archiveStay(user.id, stayId);
      await refresh(user);
      setMessage("Stay archived.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Archive failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading stays...</p>
        </div>
      </main>
    );
  }

  return (
    <PartnerShell
      title="Stay Listings"
      description="Create, review, publish, and maintain your stay inventory."
      headerExtra={
        <div className="flex flex-wrap gap-2">
          <Link href="/stays/new" className="tm-btn tm-btn-primary">
            Create Stay
          </Link>
          <Link href="/dashboard" className="tm-btn tm-btn-outline">
            Back to Dashboard
          </Link>
        </div>
      }
    >
        <section className="tm-panel p-6">
          <div className="tm-section-head">
            <div>
              <h2 className="tm-section-title">Listings</h2>
              <p className="tm-muted text-sm">Manage listing readiness, moderation, and live status.</p>
            </div>
            <Link href="/stays/new" className="tm-btn tm-btn-primary">
              Create Stay
            </Link>
          </div>
        </section>

        <section className="tm-panel p-6">
          <ul className="tm-list-stack">
            {items.map((stay) => (
              <li key={stay.id} className="tm-list-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{stay.name || "Untitled stay"}</h2>
                    <p className="text-sm text-slate-600">
                      {stay.propertyType || "Property type not set"} • {stay.city || "City"}, {stay.country || "Country"}
                    </p>
                    <p className="tm-status-inline mt-2">Status: {stay.status}</p>
                    {stay.moderationFeedback ? (
                      <p className="mt-2 text-xs text-rose-700">Feedback: {stay.moderationFeedback}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/stays/${stay.id}`} className="tm-btn tm-btn-outline">
                      Edit
                    </Link>

                    {(stay.status === "draft" || stay.status === "rejected") ? (
                      <button className="tm-btn tm-btn-accent" disabled={busyId === stay.id} onClick={() => void changeStatus(stay.id, "pending")} type="button">
                        Submit Review
                      </button>
                    ) : null}

                    {stay.status === "approved" ? (
                      <button className="tm-btn tm-btn-primary" disabled={busyId === stay.id} onClick={() => void changeStatus(stay.id, "live")} type="button">
                        Go Live
                      </button>
                    ) : null}

                    {stay.status === "live" ? (
                      <button className="tm-btn tm-btn-outline" disabled={busyId === stay.id} onClick={() => void changeStatus(stay.id, "paused")} type="button">
                        Pause
                      </button>
                    ) : null}

                    {stay.status === "paused" ? (
                      <button className="tm-btn tm-btn-primary" disabled={busyId === stay.id} onClick={() => void changeStatus(stay.id, "live")} type="button">
                        Resume
                      </button>
                    ) : null}

                    {stay.status !== "archived" ? (
                      <button className="tm-btn tm-btn-outline" disabled={busyId === stay.id} onClick={() => void archive(stay.id)} type="button">
                        Archive
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {items.length === 0 ? <p className="text-sm text-slate-500">No stays yet. Create your first listing.</p> : null}
          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
        </section>
    </PartnerShell>
  );
}
