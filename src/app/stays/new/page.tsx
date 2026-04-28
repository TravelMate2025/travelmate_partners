"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/auth-client";
import { fetchCatalogOptions } from "@/modules/catalog/catalog-options-client";
import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import type { PartnerUser } from "@/modules/auth/contracts";
import { HttpError } from "@/lib/http-client";
import { profileClient } from "@/modules/profile/profile-client";
import { localityOptionsByCountry, operatingCountryOptions } from "@/modules/profile/location-options";
import { stayPropertyTypeOptions } from "@/modules/stays/property-type-options";
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
  const [selectedCity, setSelectedCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedPropertyType, setSelectedPropertyType] = useState("");
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<Array<{ value: string; label: string }>>(
    [...stayPropertyTypeOptions],
  );

  const availableCities = selectedCountry
    ? (localityOptionsByCountry[selectedCountry as keyof typeof localityOptionsByCountry] ?? [])
    : [];
  const filteredCities = citySearch.trim()
    ? availableCities.filter((city) => city.toLowerCase().includes(citySearch.trim().toLowerCase()))
    : availableCities;

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
                <input
                  className="tm-input mb-2"
                  placeholder="Search city"
                  value={citySearch}
                  onChange={(event) => setCitySearch(event.target.value)}
                />
                <select
                  className="tm-input"
                  name="city"
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select city
                  </option>
                  {filteredCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tm-field">
                <span className="tm-field-label">Country</span>
                <select
                  className="tm-input"
                  name="country"
                  value={selectedCountry}
                  onChange={(event) => {
                    const nextCountry = event.target.value;
                    setSelectedCountry(nextCountry);
                    setSelectedCity("");
                    setCitySearch("");
                  }}
                  required
                >
                  <option value="" disabled>
                    Select country
                  </option>
                  {operatingCountryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
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
