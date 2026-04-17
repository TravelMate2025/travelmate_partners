"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/auth-client";
import { onboardingProgress } from "@/modules/profile/checklist";
import type { OnboardingStepKey, PartnerOnboarding, PartnerProfileData } from "@/modules/profile/contracts";
import { profileClient } from "@/modules/profile/profile-client";

const STEP_ORDER: OnboardingStepKey[] = ["business", "contact", "operations"];

const STEP_LABELS: Record<OnboardingStepKey, string> = {
  business: "Business Details",
  contact: "Contact Details",
  operations: "Operations & Settlement",
};

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [onboarding, setOnboarding] = useState<PartnerOnboarding | null>(null);
  const [formData, setFormData] = useState<PartnerProfileData | null>(null);
  const [serviceRegionsInput, setServiceRegionsInput] = useState("");
  const [operatingCitiesInput, setOperatingCitiesInput] = useState("");

  useEffect(() => {
    let active = true;

    authClient
      .me()
      .then(async (user) => {
        const data = await profileClient.getOnboarding(user.id);

        if (!active) {
          return;
        }

        if (data.status === "completed") {
          router.replace("/dashboard");
          return;
        }

        setOnboarding(data);
        setFormData(data.data);
        setServiceRegionsInput(data.data.serviceRegions.join(", "));
        setOperatingCitiesInput(data.data.operatingCities.join(", "));
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

  const progress = useMemo(() => onboardingProgress(onboarding?.completedSteps ?? []), [onboarding]);
  const currentStep = STEP_ORDER[stepIndex];

  if (loading || !onboarding || !formData) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading onboarding...</p>
        </div>
      </main>
    );
  }

  async function saveCurrentStep(nextIndex?: number) {
    if (!formData || !onboarding) {
      return;
    }

    const currentData = formData;
    const currentOnboarding = onboarding;
    setSaving(true);
    setMessage("");

    try {
      const payload: Partial<PartnerProfileData> =
        currentStep === "business"
          ? {
              businessType: currentData.businessType,
              legalName: currentData.legalName,
              tradeName: currentData.tradeName,
              registrationNumber: currentData.registrationNumber,
            }
          : currentStep === "contact"
            ? {
                primaryContactName: currentData.primaryContactName,
                primaryContactEmail: currentData.primaryContactEmail,
                supportContactEmail: currentData.supportContactEmail,
              }
            : {
                serviceRegions: splitCsv(serviceRegionsInput),
                operatingCities: splitCsv(operatingCitiesInput),
                payoutSchedule: currentData.payoutSchedule,
              };

      const updated = await profileClient.saveStep(currentOnboarding.userId, currentStep, payload);
      setOnboarding(updated);
      setFormData(updated.data);
      setServiceRegionsInput(updated.data.serviceRegions.join(", "));
      setOperatingCitiesInput(updated.data.operatingCities.join(", "));

      if (typeof nextIndex === "number") {
        setStepIndex(nextIndex);
      }

      setMessage("Progress saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save step.");
    } finally {
      setSaving(false);
    }
  }

  async function submitOnboardingFlow() {
    if (!onboarding) {
      return;
    }

    const currentOnboarding = onboarding;
    setSaving(true);
    setMessage("");

    try {
      await saveCurrentStep();
      const submitted = await profileClient.submitOnboarding(currentOnboarding.userId);
      setOnboarding(submitted);
      router.replace("/verification");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit onboarding.");
      setSaving(false);
    }
  }

  return (
    <main className="tm-page">
      <div className="tm-shell max-w-5xl space-y-5">
        <section className="tm-panel p-6">
          <p className="tm-kicker">TravelMate Partner</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Partner Onboarding</h1>
          <p className="tm-muted mt-1 text-sm">Complete your profile before accessing the dashboard.</p>

          <div className="mt-4 h-2 rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[#033D89]" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="tm-muted mt-2 text-sm">
            Checklist progress: {progress.completed}/{progress.total} steps complete ({progress.percent}%)
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-[260px_1fr]">
          <aside className="tm-panel p-4">
            <ul className="space-y-2">
              {STEP_ORDER.map((step, index) => {
                const complete = onboarding.completedSteps.includes(step);
                const active = index === stepIndex;

                return (
                  <li key={step}>
                    <button
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                        active
                          ? "border-[#033D89] bg-blue-50 text-slate-900"
                          : complete
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-slate-200/90 bg-white/70 text-slate-700"
                      }`}
                      onClick={() => setStepIndex(index)}
                      type="button"
                    >
                      <span className="font-medium">{STEP_LABELS[step]}</span>
                      <span className="block text-xs opacity-80">{complete ? "Complete" : "Pending"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="tm-panel p-6">
            <h2 className="text-lg font-semibold text-slate-900">{STEP_LABELS[currentStep]}</h2>

            {currentStep === "business" ? (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Business Type</span>
                  <select
                    className="tm-input"
                    value={formData.businessType}
                    onChange={(event) => setFormData((prev) => (prev ? { ...prev, businessType: event.target.value as PartnerProfileData["businessType"] } : prev))}
                  >
                    <option value="">Select business type</option>
                    <option value="individual">Individual</option>
                    <option value="agency">Agency</option>
                    <option value="business">Business</option>
                  </select>
                </label>
                <input className="tm-input" placeholder="Legal name" value={formData.legalName} onChange={(event) => setFormData((prev) => (prev ? { ...prev, legalName: event.target.value } : prev))} />
                <input className="tm-input" placeholder="Trade name (optional)" value={formData.tradeName} onChange={(event) => setFormData((prev) => (prev ? { ...prev, tradeName: event.target.value } : prev))} />
                <input className="tm-input" placeholder="Registration number" value={formData.registrationNumber} onChange={(event) => setFormData((prev) => (prev ? { ...prev, registrationNumber: event.target.value } : prev))} />
              </div>
            ) : null}

            {currentStep === "contact" ? (
              <div className="mt-4 space-y-3">
                <input className="tm-input" placeholder="Primary contact name" value={formData.primaryContactName} onChange={(event) => setFormData((prev) => (prev ? { ...prev, primaryContactName: event.target.value } : prev))} />
                <input className="tm-input" placeholder="Primary contact email" value={formData.primaryContactEmail} onChange={(event) => setFormData((prev) => (prev ? { ...prev, primaryContactEmail: event.target.value } : prev))} />
                <input className="tm-input" placeholder="Support contact email (optional)" value={formData.supportContactEmail} onChange={(event) => setFormData((prev) => (prev ? { ...prev, supportContactEmail: event.target.value } : prev))} />
              </div>
            ) : null}

            {currentStep === "operations" ? (
              <div className="mt-4 space-y-3">
                <input
                  className="tm-input"
                  placeholder="Service regions (comma separated)"
                  value={serviceRegionsInput}
                  onChange={(event) => setServiceRegionsInput(event.target.value)}
                />
                <input
                  className="tm-input"
                  placeholder="Operating cities (comma separated)"
                  value={operatingCitiesInput}
                  onChange={(event) => setOperatingCitiesInput(event.target.value)}
                />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Settlement Preference</span>
                  <select
                    className="tm-input"
                    value={formData.payoutSchedule}
                    onChange={(event) =>
                      setFormData((prev) =>
                        prev
                          ? {
                              ...prev,
                              payoutSchedule: event.target.value as PartnerProfileData["payoutSchedule"],
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="">Select settlement preference</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                className="tm-btn tm-btn-outline"
                disabled={saving || stepIndex === 0}
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                type="button"
              >
                Back
              </button>

              {stepIndex < STEP_ORDER.length - 1 ? (
                <button
                  className="tm-btn tm-btn-primary"
                  disabled={saving}
                  onClick={() => void saveCurrentStep(stepIndex + 1)}
                  type="button"
                >
                  {saving ? "Saving..." : "Save and Continue"}
                </button>
              ) : (
                <button className="tm-btn tm-btn-accent" disabled={saving} onClick={submitOnboardingFlow} type="button">
                  {saving ? "Submitting..." : "Submit Onboarding"}
                </button>
              )}
            </div>

            {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
