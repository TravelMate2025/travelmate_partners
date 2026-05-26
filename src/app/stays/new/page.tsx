"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/auth-client";
import { fetchCatalogOptions } from "@/modules/catalog/catalog-options-client";
import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { TypeaheadInput } from "@/components/common/typeahead-input";
import type { PartnerUser } from "@/modules/auth/contracts";
import { HttpError } from "@/lib/http-client";
import { profileClient } from "@/modules/profile/profile-client";
import { operatingCityOptionsByCountryRegion, operatingCountryOptions, operatingRegionOptionsByCountry } from "@/modules/profile/location-options";
import { getSaleModeContent, stayPropertyTypeOptions } from "@/modules/stays/property-type-options";
import { staysClient } from "@/modules/stays/stays-client";
import { verificationClient } from "@/modules/verification/verification-client";

export default function NewStayPage() {
  const router = useRouter();
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedAdminLevel1, setSelectedAdminLevel1] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [area, setArea] = useState("");
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  const [adminLevel1Suggestions, setAdminLevel1Suggestions] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [liveCities, setLiveCities] = useState<string[]>([]);
  const [selectedPropertyType, setSelectedPropertyType] = useState("");
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<Array<{ value: string; label: string }>>(
    [...stayPropertyTypeOptions],
  );

  const availableCities = selectedCountry && selectedAdminLevel1
    ? (operatingCityOptionsByCountryRegion[selectedCountry]?.[selectedAdminLevel1] ?? [])
    : [];
  const cityOptions = citySuggestions.length > 0 ? citySuggestions : (liveCities.length > 0 ? liveCities : availableCities);
  const saleModeContent = getSaleModeContent(selectedPropertyType);

  useEffect(() => {
    let active = true;

    authClient
      .me()
      .then(async (currentUser) => {
        const catalogOptions = await fetchCatalogOptions();
        if (!active) {
          return;
        }
        if (catalogOptions.propertyTypes.length > 0) {
          setPropertyTypeOptions(
            catalogOptions.propertyTypes.map((item) => ({
              value: item.code,
              label: item.label,
            })),
          );
        }
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
      .catch((error) => {
        if (!active) {
          return;
        }
        if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
          router.replace("/auth/login");
          return;
        }
        setMessage(error instanceof Error ? error.message : "Failed to load page. Please refresh.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;
    if (!user || !selectedCountry || !selectedAdminLevel1) {
      setLiveCities([]);
      return () => {
        active = false;
      };
    }
    profileClient
      .listGeographyCities(user.id, selectedCountry, selectedAdminLevel1)
      .then((rows) => {
        if (!active) return;
        setLiveCities(rows);
      })
      .catch(() => {
        if (!active) return;
        setLiveCities([]);
      });
    return () => {
      active = false;
    };
  }, [user, selectedCountry, selectedAdminLevel1]);

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
        propertyType: selectedPropertyType,
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? ""),
        address: String(form.get("address") ?? ""),
        city: selectedCity,
        country: selectedCountry,
        adminLevel1: selectedAdminLevel1,
        area,
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
              <select
                className="tm-input"
                name="propertyType"
                value={selectedPropertyType}
                onChange={(event) => setSelectedPropertyType(event.target.value)}
                required
              >
                <option value="" disabled>
                  Select property type
                </option>
                {propertyTypeOptions.map((propertyType) => (
                  <option key={propertyType.value} value={propertyType.value}>
                    {propertyType.label}
                  </option>
                ))}
              </select>
              {selectedPropertyType ? (
                <div className="tm-note mt-2 text-xs">
                  <p className="font-semibold text-slate-800">{saleModeContent.title}</p>
                  <p className="text-slate-600">{saleModeContent.summary}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600">
                    {saleModeContent.implications.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
              <TypeaheadInput
                label="Country"
                placeholder="Type country"
                value={selectedCountry}
                options={countrySuggestions.length > 0 ? countrySuggestions : [...operatingCountryOptions]}
                onQueryChange={(query) => {
                  const raw = query.trim().toLowerCase();
                  const rows = [...operatingCountryOptions];
                  setCountrySuggestions(raw ? rows.filter((entry) => entry.toLowerCase().includes(raw)) : rows);
                }}
                onSelect={(value) => {
                  setSelectedCountry(value);
                  setSelectedAdminLevel1("");
                  setSelectedCity("");
                  setArea("");
                  setAdminLevel1Suggestions([]);
                  setCitySuggestions([]);
                  setLiveCities([]);
                }}
              />
              <TypeaheadInput
                label="State / Region"
                placeholder="Type state or region"
                value={selectedAdminLevel1}
                options={adminLevel1Suggestions.length > 0 ? adminLevel1Suggestions : [...(operatingRegionOptionsByCountry[selectedCountry as keyof typeof operatingRegionOptionsByCountry] ?? [])]}
                disabled={!selectedCountry}
                onQueryChange={(query) => {
                  const source = [...(operatingRegionOptionsByCountry[selectedCountry as keyof typeof operatingRegionOptionsByCountry] ?? [])];
                  const raw = query.trim().toLowerCase();
                  setAdminLevel1Suggestions(raw ? source.filter((entry) => entry.toLowerCase().includes(raw)) : source);
                }}
                onSelect={(value) => {
                  setSelectedAdminLevel1(value);
                  setSelectedCity("");
                  setArea("");
                  setCitySuggestions([]);
                  setLiveCities([]);
                }}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TypeaheadInput
                label="City"
                placeholder="Type city"
                value={selectedCity}
                options={cityOptions}
                allowCustomValue
                disabled={!selectedAdminLevel1}
                onQueryChange={async (query) => {
                  const raw = query.trim().toLowerCase();
                  if (user && selectedCountry && selectedAdminLevel1) {
                    try {
                      const rows = await profileClient.listGeographyCities(
                        user.id,
                        selectedCountry,
                        selectedAdminLevel1,
                        query,
                      );
                      setCitySuggestions(rows);
                      return;
                    } catch {
                      // Fallback to local options below.
                    }
                  }
                  const fallback = liveCities.length > 0 ? liveCities : availableCities;
                  setCitySuggestions(raw ? fallback.filter((entry) => entry.toLowerCase().includes(raw)) : fallback);
                }}
                onSelect={(value) => {
                  setSelectedCity(value);
                  setArea(value);
                }}
              />
              <label className="tm-field">
                <span className="tm-field-label">Area</span>
                <input className="tm-input" name="area" value={area} onChange={(event) => setArea(event.target.value)} required />
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
