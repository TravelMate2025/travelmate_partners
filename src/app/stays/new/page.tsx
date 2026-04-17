"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/auth-client";
import { PartnerShell } from "@/components/common/partner-shell";
import type { PartnerUser } from "@/modules/auth/contracts";
import { profileClient } from "@/modules/profile/profile-client";
import { staysClient } from "@/modules/stays/stays-client";
import { verificationClient } from "@/modules/verification/verification-client";

export default function NewStayPage() {
  const router = useRouter();
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }

    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);

    try {
      const stay = await staysClient.createStay(user.id, {
        propertyType: String(form.get("propertyType") ?? ""),
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? ""),
        address: String(form.get("address") ?? ""),
        city: String(form.get("city") ?? ""),
        country: String(form.get("country") ?? ""),
      });

      router.push(`/stays/${stay.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create stay.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-4xl p-6">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <PartnerShell
      title="Create Stay"
      description="Start with core details. The listing is saved as draft first."
    >
        <section className="tm-panel p-6">
          <h2 className="tm-section-title">Core Details</h2>
          <p className="tm-muted mt-1 text-sm">Start with essential stay information. Save as draft automatically.</p>

          <form className="tm-field-grid mt-4" onSubmit={onSubmit}>
            <label className="tm-field">
              <span className="tm-field-label">Property Type</span>
              <input className="tm-input" name="propertyType" placeholder="Hotel, apartment, villa..." required />
            </label>
            <label className="tm-field">
              <span className="tm-field-label">Stay Name</span>
              <input className="tm-input" name="name" placeholder="Enter listing name" required />
            </label>
            <label className="tm-field">
              <span className="tm-field-label">Description</span>
              <textarea className="tm-input min-h-28" name="description" placeholder="Short description" />
            </label>
            <label className="tm-field">
              <span className="tm-field-label">Address</span>
              <input className="tm-input" name="address" placeholder="Street address" required />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="tm-field">
                <span className="tm-field-label">City</span>
                <input className="tm-input" name="city" placeholder="City" required />
              </label>
              <label className="tm-field">
                <span className="tm-field-label">Country</span>
                <input className="tm-input" name="country" placeholder="Country" required />
              </label>
            </div>

            <div className="tm-inline-actions">
              <button className="tm-btn tm-btn-primary" disabled={saving} type="submit">
                {saving ? "Creating..." : "Create Stay Draft"}
              </button>
              <button className="tm-btn tm-btn-outline" onClick={() => router.push("/stays")} type="button">
                Cancel
              </button>
            </div>
          </form>

          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
        </section>
    </PartnerShell>
  );
}
