"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { fetchCatalogOptions } from "@/modules/catalog/catalog-options-client";
import { localityOptionsByCountry, operatingCountryOptions } from "@/modules/profile/location-options";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type { TransferType } from "@/modules/transfers/contracts";
import { transfersClient } from "@/modules/transfers/transfers-client";
import { transferVehicleClassOptions } from "@/modules/transfers/vehicle-options";

export default function NewTransferPage() {
  const { user, loading } = usePartnerAccess();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [vehicleClassOptions, setVehicleClassOptions] = useState<Array<{ value: string; label: string }>>(
    [...transferVehicleClassOptions],
  );

  const availableCities = selectedCountry
    ? (localityOptionsByCountry[selectedCountry as keyof typeof localityOptionsByCountry] ?? [])
    : [];
  const filteredCities = citySearch.trim()
    ? availableCities.filter((city) => city.toLowerCase().includes(citySearch.trim().toLowerCase()))
    : availableCities;

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
        dropoffPoint: String(form.get("dropoffPoint") ?? ""),
        vehicleClass: String(form.get("vehicleClass") ?? ""),
        passengerCapacity: Number(form.get("passengerCapacity") ?? 0),
        luggageCapacity: Number(form.get("luggageCapacity") ?? 0),
        coverageArea: `${selectedCity}, ${selectedCountry}`,
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

          <div className="grid gap-3 md:grid-cols-2">
            <label className="tm-field">
              <span className="tm-field-label">Pickup Point</span>
              <input className="tm-input" name="pickupPoint" placeholder="Pickup point" required />
            </label>
            <label className="tm-field">
              <span className="tm-field-label">Dropoff Point</span>
              <input className="tm-input" name="dropoffPoint" placeholder="Dropoff point" required />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
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
