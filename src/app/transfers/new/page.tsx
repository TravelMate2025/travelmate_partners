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
        <h2 className="text-2xl font-semibold text-slate-900">Core Details</h2>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
              <input className="tm-input" name="name" placeholder="Transfer name" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Base Fare</span>
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

          <select className="tm-input" name="transferType" required defaultValue="">
            <option value="" disabled>
              Select transfer type
            </option>
            <option value="one_way">One-way</option>
            <option value="return">Return</option>
            <option value="hourly">Hourly</option>
            <option value="airport">Airport transfer</option>
          </select>

          <div className="grid gap-3 md:grid-cols-2">
            <input className="tm-input" name="pickupPoint" placeholder="Pickup point" required />
            <input className="tm-input" name="dropoffPoint" placeholder="Dropoff point" required />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input className="tm-input" name="vehicleClass" placeholder="Vehicle class/type" required />
            <input className="tm-input" name="coverageArea" placeholder="Coverage area" required />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="tm-input"
              name="passengerCapacity"
              type="number"
              min={1}
              placeholder="Passenger capacity"
              required
            />
            <input
              className="tm-input"
              name="luggageCapacity"
              type="number"
              min={0}
              placeholder="Luggage capacity"
              required
            />
          </div>

          <div className="flex gap-2">
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
