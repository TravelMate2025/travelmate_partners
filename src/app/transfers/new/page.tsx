"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { TypeaheadInput } from "@/components/common/typeahead-input";
import { fetchCatalogOptions } from "@/modules/catalog/catalog-options-client";
import { profileClient } from "@/modules/profile/profile-client";
import { operatingCityOptionsByCountryRegion, operatingCountryOptions, operatingRegionOptionsByCountry } from "@/modules/profile/location-options";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type { TransferType } from "@/modules/transfers/contracts";
import { fetchCatalogAreas, submitLocalitySuggestion } from "@/modules/transfers/geography-client";
import { transfersClient } from "@/modules/transfers/transfers-client";
import { transferVehicleClassOptions } from "@/modules/transfers/vehicle-options";

export default function NewTransferPage() {
  const { user, loading } = usePartnerAccess();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedAdminLevel1, setSelectedAdminLevel1] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [area, setArea] = useState("");
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  const [adminLevel1Suggestions, setAdminLevel1Suggestions] = useState<string[]>([]);
  const [liveCities, setLiveCities] = useState<string[]>([]);
  const [originAreaOptions, setOriginAreaOptions] = useState<string[]>([]);
  const [originAreaOptionsLoaded, setOriginAreaOptionsLoaded] = useState(false);
  const [originAreaOptionsLoadFailed, setOriginAreaOptionsLoadFailed] = useState(false);
  const [originAreaSuggestionPending, setOriginAreaSuggestionPending] = useState(false);
  const [vehicleClassOptions, setVehicleClassOptions] = useState<Array<{ value: string; label: string }>>(
    [...transferVehicleClassOptions],
  );

  const availableCities = selectedCountry && selectedAdminLevel1
    ? (operatingCityOptionsByCountryRegion[selectedCountry]?.[selectedAdminLevel1] ?? [])
    : [];
  const cityOptions = liveCities.length > 0 ? liveCities : availableCities;

  useEffect(() => {
    let active = true;
    fetchCatalogOptions().then((catalogOptions) => {
      if (!active) {
        return;
      }
      if (catalogOptions.vehicleClasses.length > 0) {
        setVehicleClassOptions(
          catalogOptions.vehicleClasses.map((item) => ({
            value: item.code,
            label: item.label,
          })),
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

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

  useEffect(() => {
    if (!user || !selectedCountry || !selectedAdminLevel1 || !selectedCity) {
      setOriginAreaOptions([]);
      setOriginAreaOptionsLoaded(false);
      setOriginAreaOptionsLoadFailed(false);
      setOriginAreaSuggestionPending(false);
      return;
    }

    let active = true;
    setOriginAreaOptionsLoadFailed(false);
    fetchCatalogAreas(user.id, selectedCountry, selectedAdminLevel1, selectedCity)
      .then((rows) => {
        if (!active) return;
        setOriginAreaOptions(rows);
        setOriginAreaOptionsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setOriginAreaOptions([]);
        setOriginAreaOptionsLoaded(false);
        setOriginAreaOptionsLoadFailed(true);
      });

    return () => {
      active = false;
    };
  }, [selectedAdminLevel1, selectedCity, selectedCountry, user]);

  useEffect(() => {
    if (!originAreaOptionsLoaded || !area) {
      setOriginAreaSuggestionPending(false);
      return;
    }
    setOriginAreaSuggestionPending(
      !originAreaOptions.some((option) => option.toLowerCase() === area.trim().toLowerCase()),
    );
  }, [area, originAreaOptions, originAreaOptionsLoaded]);

  const showOriginSuggestButton =
    !!user &&
    !saving &&
    area &&
    (!originAreaOptionsLoaded ||
      !originAreaOptions.some((option) => option.toLowerCase() === area.trim().toLowerCase())) &&
    !originAreaSuggestionPending;

  async function suggestOriginArea() {
    if (!user || !selectedCountry || !selectedAdminLevel1 || !selectedCity || !area) return;
    await submitLocalitySuggestion(user.id, {
      country: selectedCountry,
      adminLevel1: selectedAdminLevel1,
      city: selectedCity,
      area,
    });
    setOriginAreaSuggestionPending(true);
    setMessage(`Submitted "${area}" for catalog review.`);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }

    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);

    try {
      const item = await transfersClient.createTransfer(user.id, {
        name: String(form.get("name") ?? ""),
        baseFare: Number(form.get("baseFare") ?? 0),
        transferType: String(form.get("transferType") ?? "") as TransferType,
        pickupPoint: String(form.get("pickupPoint") ?? ""),
        vehicleClass: String(form.get("vehicleClass") ?? ""),
        passengerCapacity: Number(form.get("passengerCapacity") ?? 0),
        luggageCapacity: Number(form.get("luggageCapacity") ?? 0),
        country: selectedCountry,
        adminLevel1: selectedAdminLevel1,
        city: selectedCity,
        area,
      });

      router.push(`/transfers/${item.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create transfer.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <PartnerShell
      title="Create Transfer"
      description="Start with core route and vehicle details. Listing is saved as draft."
    >
      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Core Details</h2>
        <form className="tm-field-grid mt-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="tm-field">
              <span className="tm-field-label">Name</span>
              <input className="tm-input" name="name" placeholder="Transfer name" required />
            </label>
            <label className="tm-field">
              <span className="tm-field-label">Base Fare</span>
              <input
                className="tm-input"
                name="baseFare"
                type="number"
                min={0}
                placeholder="Base fare"
                required
              />
            </label>
          </div>

          <label className="tm-field">
            <span className="tm-field-label">Transfer Type</span>
            <select className="tm-input" name="transferType" required defaultValue="">
              <option value="" disabled>
                Select transfer type
              </option>
              <option value="one_way">One-way</option>
              <option value="return">Return</option>
              <option value="hourly">Hourly</option>
              <option value="airport">Airport transfer</option>
            </select>
          </label>

          <label className="tm-field">
            <span className="tm-field-label">Pickup Point</span>
            <input className="tm-input" name="pickupPoint" placeholder="Pickup point" required />
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
                setLiveCities([]);
              }}
            />
            <TypeaheadInput
              label="State / Region"
              placeholder="Type state or region"
              value={selectedAdminLevel1}
              options={
                adminLevel1Suggestions.length > 0
                  ? adminLevel1Suggestions
                  : [...(operatingRegionOptionsByCountry[selectedCountry as keyof typeof operatingRegionOptionsByCountry] ?? [])]
              }
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
              disabled={!selectedAdminLevel1}
              onSelect={(value) => {
                setSelectedCity(value);
                setArea(value);
                setOriginAreaOptions([]);
                setOriginAreaOptionsLoaded(false);
                setOriginAreaOptionsLoadFailed(false);
                setOriginAreaSuggestionPending(false);
              }}
            />
            <div className="tm-field">
              <TypeaheadInput
                label="Area"
                placeholder={
                  !selectedCity
                    ? "Select city first"
                    : originAreaOptionsLoadFailed
                    ? "Catalog unavailable right now"
                    : originAreaOptionsLoaded
                      ? "Search or type area name"
                      : "Loading areas…"
                }
                value={area}
                disabled={!selectedCity}
                options={originAreaOptions}
                allowCustomValue
                onSelect={setArea}
              />
              <input type="hidden" name="area" value={area} />
              {originAreaOptionsLoadFailed ? (
                <p className="mt-1 text-xs text-amber-700">
                  We could not load catalog areas right now. You can keep editing, but catalog validation will be checked again on save.
                </p>
              ) : null}
              {showOriginSuggestButton ? (
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-[#033D89] hover:underline"
                  onClick={suggestOriginArea}
                >
                  Suggest &ldquo;{area}&rdquo; as a new area
                </button>
              ) : null}
              {originAreaSuggestionPending ? (
                <p className="mt-1 text-xs text-amber-700">
                  This area is awaiting catalog approval. You can save a draft but cannot submit until it is reviewed.
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="tm-field">
              <span className="tm-field-label">Vehicle Class</span>
              <select className="tm-input" name="vehicleClass" required defaultValue="">
                <option value="" disabled>
                  Select vehicle class
                </option>
                {vehicleClassOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="tm-field">
              <span className="tm-field-label">Coverage Area</span>
              <p className="tm-input">{selectedCity && selectedCountry ? `${selectedCity}, ${selectedCountry}` : "Select city and country"}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="tm-field">
              <span className="tm-field-label">Passenger Capacity</span>
              <input
                className="tm-input"
                name="passengerCapacity"
                type="number"
                min={1}
                placeholder="Passenger capacity"
                required
              />
            </label>
            <label className="tm-field">
              <span className="tm-field-label">Luggage Capacity</span>
              <input
                className="tm-input"
                name="luggageCapacity"
                type="number"
                min={0}
                placeholder="Luggage capacity"
                required
              />
            </label>
          </div>

          <div className="tm-inline-actions">
            <button className="tm-btn tm-btn-primary" disabled={saving} type="submit">
              {saving ? "Creating..." : "Create Transfer Draft"}
            </button>
            <button
              className="tm-btn tm-btn-outline"
              onClick={() => router.push("/transfers")}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>

        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </section>
    </PartnerShell>
  );
}
