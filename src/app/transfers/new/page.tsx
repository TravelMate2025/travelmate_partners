"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { PartnerShell } from "@/components/common/partner-shell";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type { TransferType } from "@/modules/transfers/contracts";
import { transfersClient } from "@/modules/transfers/transfers-client";

export default function NewTransferPage() {
  const { user, loading } = usePartnerAccess();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
        coverageArea: String(form.get("coverageArea") ?? ""),
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
              <span className="tm-field-label">Vehicle Class</span>
              <input className="tm-input" name="vehicleClass" placeholder="Vehicle class/type" required />
            </label>
            <label className="tm-field">
              <span className="tm-field-label">Coverage Area</span>
              <input className="tm-input" name="coverageArea" placeholder="Coverage area" required />
            </label>
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
