"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/auth-client";
import { getErrorMessage, isAuthenticationError } from "@/modules/auth/http-errors";
import { onboardingProgress } from "@/modules/profile/checklist";
import type { OnboardingStepKey, PartnerOnboarding, PartnerProfileData } from "@/modules/profile/contracts";
import {
  operatingCityOptionsByRegion,
  operatingCountryOptions,
  operatingRegionOptionsByCountry,
  payoutScheduleOptions,
  payoutMethodOptions,
  settlementCurrencyOptions,
} from "@/modules/profile/location-options";
import { profileClient } from "@/modules/profile/profile-client";

const STEP_ORDER: OnboardingStepKey[] = ["business", "contact", "operations"];

const STEP_LABELS: Record<OnboardingStepKey, string> = {
  business: "Business Details",
  contact: "Contact Details",
  operations: "Operations & Settlement",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [onboarding, setOnboarding] = useState<PartnerOnboarding | null>(null);
  const [formData, setFormData] = useState<PartnerProfileData | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const user = await authClient.me();
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

        setLoadError(getErrorMessage(error, "Failed to load onboarding."));
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const progress = useMemo(() => onboardingProgress(onboarding?.completedSteps ?? []), [onboarding]);
  const currentStep = STEP_ORDER[stepIndex];
  const countryOptions = onboarding?.options?.supportedCountries ?? [...operatingCountryOptions];
  const availableRegions = useMemo(
    () =>
      formData
        ? formData.operatingCountries.flatMap(
            (country) =>
              onboarding?.options?.regionsByCountry[country] ??
              [...(operatingRegionOptionsByCountry[country as keyof typeof operatingRegionOptionsByCountry] ?? [])],
          )
        : [],
    [formData, onboarding],
  );
  const availableCities = useMemo(
    () =>
      formData
        ? formData.operatingRegions.flatMap(
            (region) =>
              onboarding?.options?.citiesByRegion[region] ??
              [...(operatingCityOptionsByRegion[region as keyof typeof operatingCityOptionsByRegion] ?? [])],
          )
        : [],
    [formData, onboarding],
  );

  if (loading || !onboarding || !formData) {
    if (!loading && loadError) {
      return (
        <main className="tm-page">
          <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
            <p className="text-sm font-medium text-rose-700">{loadError}</p>
            <p className="mt-2 text-sm text-slate-600">
              We kept you signed in. Refresh after the profile API is available again.
            </p>
          </div>
        </main>
      );
    }

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
                operatingCountries: currentData.operatingCountries,
                operatingRegions: currentData.operatingRegions,
                operatingCities: currentData.operatingCities,
                coverageNotes: currentData.coverageNotes,
                payoutMethod: currentData.payoutMethod,
                settlementCurrency: currentData.settlementCurrency,
                payoutSchedule: currentData.payoutSchedule,
              };

      const updated = await profileClient.saveStep(currentOnboarding.userId, currentStep, payload);
      setOnboarding(updated);
      setFormData(updated.data);

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

  function toggleListValue(field: "operatingCountries" | "operatingRegions" | "operatingCities", value: string) {
    setFormData((prev) => {
      if (!prev) return prev;
      const current = prev[field];
      const nextValues = current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value];

      if (field === "operatingCountries") {
        const allowedRegions: string[] = nextValues.flatMap(
          (country) =>
            onboarding?.options?.regionsByCountry[country] ??
            [...(operatingRegionOptionsByCountry[country as keyof typeof operatingRegionOptionsByCountry] ?? [])],
        );
        const filteredRegions = prev.operatingRegions.filter((region) => allowedRegions.includes(region));
        const allowedCities: string[] = filteredRegions.flatMap(
          (region) =>
            onboarding?.options?.citiesByRegion[region] ??
            [...(operatingCityOptionsByRegion[region as keyof typeof operatingCityOptionsByRegion] ?? [])],
        );
        return {
          ...prev,
          operatingCountries: nextValues,
          operatingRegions: filteredRegions,
          operatingCities: prev.operatingCities.filter((city) => allowedCities.includes(city)),
        };
      }

      if (field === "operatingRegions") {
        const allowedCities: string[] = nextValues.flatMap(
          (region) =>
            onboarding?.options?.citiesByRegion[region] ??
            [...(operatingCityOptionsByRegion[region as keyof typeof operatingCityOptionsByRegion] ?? [])],
        );
        return {
          ...prev,
          operatingRegions: nextValues,
          operatingCities: prev.operatingCities.filter((city) => allowedCities.includes(city)),
        };
      }

      return {
        ...prev,
        operatingCities: nextValues,
      };
    });
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">Operating coverage</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Select the countries, regions, and cities you actively serve. This keeps coverage structured for routing, compliance, and reporting.
                  </p>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Operating countries</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {countryOptions.map((country) => (
                      <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" key={country}>
                        <input
                          checked={formData.operatingCountries.includes(country)}
                          onChange={() => toggleListValue("operatingCountries", country)}
                          type="checkbox"
                        />
                        <span>{country}</span>
                      </label>
                    ))}
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Operating states / regions</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableRegions.length > 0 ? (
                      availableRegions.map((region) => (
                        <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" key={region}>
                          <input
                            checked={formData.operatingRegions.includes(region)}
                            onChange={() => toggleListValue("operatingRegions", region)}
                            type="checkbox"
                          />
                          <span>{region}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Select at least one country to choose states or regions.</p>
                    )}
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Operating cities</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableCities.length > 0 ? (
                      availableCities.map((city) => (
                        <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" key={city}>
                          <input
                            checked={formData.operatingCities.includes(city)}
                            onChange={() => toggleListValue("operatingCities", city)}
                            type="checkbox"
                          />
                          <span>{city}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Select at least one region to choose cities.</p>
                    )}
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Coverage notes (optional)</span>
                  <textarea
                    className="tm-input min-h-[110px]"
                    placeholder="Add exceptions or service-area notes that are not captured by the structured selections."
                    value={formData.coverageNotes}
                    onChange={(event) => setFormData((prev) => (prev ? { ...prev, coverageNotes: event.target.value } : prev))}
                  />
                </label>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">Payout setup</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Earnings become available only after completed service events, such as a guest checking out or a transfer being completed. Your payout schedule only controls when available balances are sent.
                  </p>
                </div>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Payout method</span>
                  <select
                    className="tm-input"
                    value={formData.payoutMethod}
                    onChange={(event) =>
                      setFormData((prev) =>
                        prev ? { ...prev, payoutMethod: event.target.value as PartnerProfileData["payoutMethod"] } : prev,
                      )
                    }
                  >
                    <option value="">Select payout method</option>
                    {payoutMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Settlement currency</span>
                  <select
                    className="tm-input"
                    value={formData.settlementCurrency}
                    onChange={(event) =>
                      setFormData((prev) =>
                        prev
                          ? {
                              ...prev,
                              settlementCurrency: event.target.value as PartnerProfileData["settlementCurrency"],
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="">Select settlement currency</option>
                    {settlementCurrencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Payout schedule</span>
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
                    <option value="">Select payout schedule</option>
                    {payoutScheduleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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
