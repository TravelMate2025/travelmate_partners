"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { buildTransferQualityReport } from "@/modules/data-quality/listing-quality";
import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type { TransferListing, TransferStatus, TransferType } from "@/modules/transfers/contracts";
import { transfersClient } from "@/modules/transfers/transfers-client";

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeTransferListing(entry: TransferListing): TransferListing {
  return {
    ...entry,
    features: Array.isArray(entry.features) ? entry.features : [],
    images: Array.isArray(entry.images) ? entry.images : [],
  };
}

export default function TransferDetailPage() {
  const { user, loading } = usePartnerAccess();
  const router = useRouter();
  const params = useParams<{ transferId: string }>();
  const transferId = params.transferId;

  const [item, setItem] = useState<TransferListing | null>(null);
  const [allTransfers, setAllTransfers] = useState<TransferListing[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");
  const [featuresText, setFeaturesText] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    transfersClient
      .listTransfers(user.id)
      .then(async (listings) => {
        const result = listings.find((entry) => entry.id === transferId)
          ?? await transfersClient.getTransfer(user.id, transferId);
        if (!active) {
          return;
        }
        const normalizedResult = normalizeTransferListing(result);
        const normalizedListings = listings.map(normalizeTransferListing);
        setItem(normalizedResult);
        setAllTransfers(normalizedListings.length > 0 ? normalizedListings : [normalizedResult]);
        setFeaturesText(normalizedResult.features.join(", "));
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
  const qualityReport = useMemo(() => {
    if (!item) {
      return null;
    }
    return buildTransferQualityReport(item, allTransfers);
  }, [allTransfers, item]);

  function syncTransfer(updated: TransferListing) {
    const normalized = normalizeTransferListing(updated);
    setItem(normalized);
    setAllTransfers((prev) => {
      const index = prev.findIndex((entry) => entry.id === normalized.id);
      if (index === -1) {
        return [normalized, ...prev];
      }
      const next = [...prev];
      next[index] = normalized;
      return next;
    });
  }

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
    setUploadState("uploading");
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
      syncTransfer(updated);
      setMessage("Transfer details saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save transfer.");
    } finally {
      setSaving(false);
      setUploadState("idle");
    }
  }

  async function changeStatus(next: TransferStatus) {
    if (!user || !item) {
      return;
    }

    setSaving(true);
    setUploadState("uploading");
    setMessage("");

    try {
      const updated = await transfersClient.updateStatus(user.id, item.id, next);
      syncTransfer(updated);
      setMessage(`Status updated to ${updated.status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status change failed.");
    } finally {
      setSaving(false);
      setUploadState("idle");
    }
  }

  async function archive() {
    if (!user || !item) {
      return;
    }

    const updated = await transfersClient.archiveTransfer(user.id, item.id);
    syncTransfer(updated);
    setMessage("Transfer archived.");
  }

  async function addImage(file: File) {
    if (!user || !item) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updated = await transfersClient.addImage(user.id, item.id, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      syncTransfer(updated);
      setMessage("Image added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add image.");
    } finally {
      setSaving(false);
    }
  }

  async function replaceImage(imageId: string, file: File) {
    if (!user || !item) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updated = await transfersClient.replaceImage(user.id, item.id, imageId, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      syncTransfer(updated);
      setMessage("Image replaced.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to replace image.");
    } finally {
      setSaving(false);
    }
  }

  async function removeImage(imageId: string) {
    if (!user || !item) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updated = await transfersClient.removeImage(user.id, item.id, imageId);
      syncTransfer(updated);
      setMessage("Image removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove image.");
    } finally {
      setSaving(false);
    }
  }

  async function moveImage(imageId: string, direction: "up" | "down") {
    if (!user || !item) {
      return;
    }

    const currentIds = (Array.isArray(item.images) ? item.images : [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((img) => img.id);
    const index = currentIds.findIndex((id) => id === imageId);
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= currentIds.length) {
      return;
    }

    const copy = [...currentIds];
    const [target] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, target);

    const updated = await transfersClient.reorderImages(user.id, item.id, copy);
    syncTransfer(updated);
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
            <h2 className="tm-section-title">Listing Actions</h2>
            {item.moderationFeedback ? (
              <p className="mt-2 text-sm text-rose-700">Feedback: {item.moderationFeedback}</p>
            ) : null}
          </div>

          <div className="tm-inline-actions">
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

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Data Quality</h2>
        <p className="tm-muted mt-1 text-sm">Submission readiness checks, completeness score, and duplicate warnings.</p>
        <p className="mt-3 text-sm font-semibold text-slate-800">
          Completeness score: {qualityReport?.completenessScore ?? 0}%
        </p>
        {qualityReport && qualityReport.missingRequiredFields.length > 0 ? (
          <p className="mt-2 text-sm text-rose-700">
            Missing required fields: {qualityReport.missingRequiredFields.join(", ")}.
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-700">Required submission fields are complete.</p>
        )}
        {qualityReport && qualityReport.duplicateWarnings.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {qualityReport.duplicateWarnings.map((warning) => (
              <li key={warning} className="text-sm text-amber-700">
                {warning}
              </li>
            ))}
          </ul>
        ) : null}
        {item.status === "rejected" && item.moderationFeedback ? (
          <p className="mt-3 text-sm text-slate-700">
            Correction workflow: apply moderation feedback, resolve quality warnings, then re-submit.
          </p>
        ) : null}
      </section>

      <form className="tm-panel p-6" onSubmit={saveDetails}>
        <h2 className="tm-section-title">Transfer Details</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="tm-field">
            <span className="tm-field-label">Name</span>
            <input className="tm-input" name="name" defaultValue={item.name} placeholder="Transfer name" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Base Fare</span>
            <input className="tm-input" name="baseFare" defaultValue={item.baseFare} placeholder="Base fare" type="number" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Transfer Type</span>
            <select className="tm-input" name="transferType" defaultValue={item.transferType || ""}>
              <option value="">Select transfer type</option>
              <option value="one_way">One-way</option>
              <option value="return">Return</option>
              <option value="hourly">Hourly</option>
              <option value="airport">Airport transfer</option>
            </select>
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Pickup Point</span>
            <input className="tm-input" name="pickupPoint" defaultValue={item.pickupPoint} placeholder="Pickup point" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Dropoff Point</span>
            <input className="tm-input" name="dropoffPoint" defaultValue={item.dropoffPoint} placeholder="Dropoff point" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Vehicle Class</span>
            <input className="tm-input" name="vehicleClass" defaultValue={item.vehicleClass} placeholder="Vehicle class/type" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Coverage Area</span>
            <input className="tm-input" name="coverageArea" defaultValue={item.coverageArea} placeholder="Coverage area" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Passenger Capacity</span>
            <input
              className="tm-input"
              name="passengerCapacity"
              defaultValue={item.passengerCapacity}
              placeholder="Passenger capacity"
              type="number"
            />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Luggage Capacity</span>
            <input
              className="tm-input"
              name="luggageCapacity"
              defaultValue={item.luggageCapacity}
              placeholder="Luggage capacity"
              type="number"
            />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Operating Hours</span>
            <input className="tm-input" name="operatingHours" defaultValue={item.operatingHours} placeholder="06:00-23:00" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Currency</span>
            <input className="tm-input" name="currency" defaultValue={item.currency} placeholder="NGN, USD, GBP" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Night Surcharge</span>
            <input
              className="tm-input"
              name="nightSurcharge"
              defaultValue={item.nightSurcharge}
              placeholder="Night surcharge"
              type="number"
            />
          </label>
        </div>
        <label className="tm-field mt-3 block">
          <span className="tm-field-label">Description</span>
          <textarea
            className="tm-input min-h-24"
            name="description"
            defaultValue={item.description}
            placeholder="Description"
          />
        </label>
        <label className="tm-field mt-3 block">
          <span className="tm-field-label">Features</span>
          <textarea
            className="tm-input min-h-20"
            value={featuresText}
            onChange={(event) => setFeaturesText(event.target.value)}
            placeholder="Comma separated: AC, Wi-Fi, child seat..."
          />
        </label>

        <div className="mt-4">
          <button className="tm-btn tm-btn-primary" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save Details"}
          </button>
        </div>
      </form>

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Images</h2>
        <p className="mt-1 text-sm text-slate-600">PNG, JPEG, WEBP up to 8MB.</p>
        {uploadState === "uploading" ? (
          <p className="mt-2 text-sm text-blue-700">Upload in progress...</p>
        ) : null}

        <input
          className="tm-input mt-3"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void addImage(file);
            }
            event.currentTarget.value = "";
          }}
        />

        <ul className="tm-list-stack mt-4">
          {(Array.isArray(item.images) ? item.images : [])
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((img, index) => (
              <li key={img.id} className="tm-list-card">
                <p className="text-sm font-medium text-slate-800">{img.fileName}</p>
                <p className="text-xs text-slate-500">Order: {index + 1}</p>
                <input
                  className="hidden"
                  id={`replace-transfer-image-${img.id}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void replaceImage(img.id, file);
                    }
                    event.currentTarget.value = "";
                  }}
                />
                <div className="tm-inline-actions mt-2">
                  <button
                    className="tm-btn tm-btn-outline"
                    onClick={() => void moveImage(img.id, "up")}
                    type="button"
                  >
                    Up
                  </button>
                  <button
                    className="tm-btn tm-btn-outline"
                    onClick={() => void moveImage(img.id, "down")}
                    type="button"
                  >
                    Down
                  </button>
                  <label className="tm-btn tm-btn-outline cursor-pointer" htmlFor={`replace-transfer-image-${img.id}`}>
                    Replace
                  </label>
                  <button
                    className="tm-btn tm-btn-outline"
                    onClick={() => void removeImage(img.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
        </ul>

        {(Array.isArray(item.images) ? item.images.length : 0) === 0 ? <p className="tm-soft-note mt-2 text-sm">No images uploaded yet.</p> : null}
      </section>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </PartnerShell>
  );
}
