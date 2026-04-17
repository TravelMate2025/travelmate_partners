"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PartnerShell } from "@/components/common/partner-shell";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type { TransferListing, TransferStatus, TransferType } from "@/modules/transfers/contracts";
import { transfersClient } from "@/modules/transfers/transfers-client";

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export default function TransferDetailPage() {
  const { user, loading } = usePartnerAccess();
  const router = useRouter();
  const params = useParams<{ transferId: string }>();
  const transferId = params.transferId;

  const [item, setItem] = useState<TransferListing | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [featuresText, setFeaturesText] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    transfersClient
      .getTransfer(user.id, transferId)
      .then((result) => {
        if (!active) {
          return;
        }
        setItem(result);
        setFeaturesText(result.features.join(", "));
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        if (error instanceof Error && error.message.includes("Transfer not found")) {
          router.replace("/transfers");
          return;
        }

        setMessage(error instanceof Error ? error.message : "Failed to load transfer.");
      });

    return () => {
      active = false;
    };
  }, [router, transferId, user]);

  const canSubmit = useMemo(
    () => item?.status === "draft" || item?.status === "rejected",
    [item?.status],
  );

  if (loading || !item || !user) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading transfer...</p>
        </div>
      </main>
    );
  }

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !item) {
      return;
    }

    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);

    try {
      const updated = await transfersClient.updateTransfer(user.id, item.id, {
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? ""),
        transferType: String(form.get("transferType") ?? "") as TransferType,
        pickupPoint: String(form.get("pickupPoint") ?? ""),
        dropoffPoint: String(form.get("dropoffPoint") ?? ""),
        vehicleClass: String(form.get("vehicleClass") ?? ""),
        passengerCapacity: Number(form.get("passengerCapacity") ?? 0),
        luggageCapacity: Number(form.get("luggageCapacity") ?? 0),
        features: splitCsv(featuresText),
        coverageArea: String(form.get("coverageArea") ?? ""),
        operatingHours: String(form.get("operatingHours") ?? ""),
        currency: String(form.get("currency") ?? ""),
        baseFare: Number(form.get("baseFare") ?? 0),
        nightSurcharge: Number(form.get("nightSurcharge") ?? 0),
      });
      setItem(updated);
      setMessage("Transfer details saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save transfer.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(next: TransferStatus) {
    if (!user || !item) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updated = await transfersClient.updateStatus(user.id, item.id, next);
      setItem(updated);
      setMessage(`Status updated to ${updated.status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status change failed.");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!user || !item) {
      return;
    }

    const updated = await transfersClient.archiveTransfer(user.id, item.id);
    setItem(updated);
    setMessage("Transfer archived.");
  }

  return (
    <PartnerShell
      title={item.name || "Transfer Draft"}
      description="Edit route, vehicle, pricing, and listing lifecycle details."
      headerExtra={<p className="tm-muted text-sm">Status: {item.status}</p>}
    >
      <section className="tm-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Listing Actions</h2>
            {item.moderationFeedback ? (
              <p className="mt-2 text-sm text-rose-700">Feedback: {item.moderationFeedback}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {canSubmit ? (
              <button
                className="tm-btn tm-btn-accent"
                disabled={saving}
                onClick={() => void changeStatus("pending")}
                type="button"
              >
                Submit for Review
              </button>
            ) : null}
            {item.status === "approved" ? (
              <button
                className="tm-btn tm-btn-primary"
                disabled={saving}
                onClick={() => void changeStatus("live")}
                type="button"
              >
                Go Live
              </button>
            ) : null}
            {item.status === "live" ? (
              <button
                className="tm-btn tm-btn-outline"
                disabled={saving}
                onClick={() => void changeStatus("paused")}
                type="button"
              >
                Pause
              </button>
            ) : null}
            {item.status === "paused" ? (
              <button
                className="tm-btn tm-btn-primary"
                disabled={saving}
                onClick={() => void changeStatus("live")}
                type="button"
              >
                Resume
              </button>
            ) : null}
            {item.status !== "archived" ? (
              <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => void archive()} type="button">
                Archive
              </button>
            ) : null}
            <button
              className="tm-btn tm-btn-outline"
              onClick={() =>
                router.push(`/transfer-pricing-scheduling?transferId=${item.id}`)
              }
              type="button"
            >
              Pricing & Schedule
            </button>
            <button className="tm-btn tm-btn-outline" onClick={() => router.push("/transfers")} type="button">
              Back to Transfers
            </button>
          </div>
        </div>
      </section>

      <form className="tm-panel p-6" onSubmit={saveDetails}>
        <h2 className="text-2xl font-semibold text-slate-900">Transfer Details</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
            <input className="tm-input" name="name" defaultValue={item.name} placeholder="Transfer name" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Base Fare</span>
            <input className="tm-input" name="baseFare" defaultValue={item.baseFare} placeholder="Base fare" type="number" />
          </label>
          <select className="tm-input" name="transferType" defaultValue={item.transferType || ""}>
            <option value="">Select transfer type</option>
            <option value="one_way">One-way</option>
            <option value="return">Return</option>
            <option value="hourly">Hourly</option>
            <option value="airport">Airport transfer</option>
          </select>
          <input className="tm-input" name="pickupPoint" defaultValue={item.pickupPoint} placeholder="Pickup point" />
          <input className="tm-input" name="dropoffPoint" defaultValue={item.dropoffPoint} placeholder="Dropoff point" />
          <input className="tm-input" name="vehicleClass" defaultValue={item.vehicleClass} placeholder="Vehicle class/type" />
          <input className="tm-input" name="coverageArea" defaultValue={item.coverageArea} placeholder="Coverage area" />
          <input
            className="tm-input"
            name="passengerCapacity"
            defaultValue={item.passengerCapacity}
            placeholder="Passenger capacity"
            type="number"
          />
          <input
            className="tm-input"
            name="luggageCapacity"
            defaultValue={item.luggageCapacity}
            placeholder="Luggage capacity"
            type="number"
          />
          <input className="tm-input" name="operatingHours" defaultValue={item.operatingHours} placeholder="Operating hours (e.g. 06:00-23:00)" />
          <input className="tm-input" name="currency" defaultValue={item.currency} placeholder="Currency (NGN, USD...)" />
          <input
            className="tm-input"
            name="nightSurcharge"
            defaultValue={item.nightSurcharge}
            placeholder="Night surcharge"
            type="number"
          />
        </div>
        <textarea
          className="tm-input mt-3 min-h-24"
          name="description"
          defaultValue={item.description}
          placeholder="Description"
        />
        <textarea
          className="tm-input mt-3 min-h-20"
          value={featuresText}
          onChange={(event) => setFeaturesText(event.target.value)}
          placeholder="Features (comma separated: AC, Wi-Fi, child seat...)"
        />

        <div className="mt-4">
          <button className="tm-btn tm-btn-primary" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save Details"}
          </button>
        </div>
      </form>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </PartnerShell>
  );
}
