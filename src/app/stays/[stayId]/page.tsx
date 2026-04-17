"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/auth-client";
import { PartnerShell } from "@/components/common/partner-shell";
import type { PartnerUser } from "@/modules/auth/contracts";
import { buildStayQualityReport } from "@/modules/data-quality/listing-quality";
import { profileClient } from "@/modules/profile/profile-client";
import { staysClient } from "@/modules/stays/stays-client";
import type { StayListing, StayStatus } from "@/modules/stays/contracts";
import { verificationClient } from "@/modules/verification/verification-client";

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export default function StayDetailPage() {
  const router = useRouter();
  const params = useParams<{ stayId: string }>();
  const stayId = params.stayId;

  const [user, setUser] = useState<PartnerUser | null>(null);
  const [stay, setStay] = useState<StayListing | null>(null);
  const [allStays, setAllStays] = useState<StayListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");

  const [amenitiesText, setAmenitiesText] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomOccupancy, setRoomOccupancy] = useState("2");
  const [roomBed, setRoomBed] = useState("");
  const [roomRate, setRoomRate] = useState("0");

  useEffect(() => {
    let active = true;

    authClient
      .me()
      .then(async (currentUser) => {
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

        const [item, listings] = await Promise.all([
          staysClient.getStay(currentUser.id, stayId),
          staysClient.listStays(currentUser.id),
        ]);

        if (!active) {
          return;
        }

        setUser(currentUser);
        setStay(item);
        setAllStays(listings);
        setAmenitiesText(item.amenities.join(", "));
        setLoading(false);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        if (error instanceof Error && error.message.includes("Stay not found")) {
          router.replace("/stays");
          return;
        }

        router.replace("/auth/login");
      });

    return () => {
      active = false;
    };
  }, [router, stayId]);

  const canSubmit = useMemo(() => stay?.status === "draft" || stay?.status === "rejected", [stay?.status]);
  const qualityReport = useMemo(() => {
    if (!stay) {
      return null;
    }
    return buildStayQualityReport(stay, allStays);
  }, [allStays, stay]);

  function syncStay(updated: StayListing) {
    setStay(updated);
    setAllStays((prev) => {
      const index = prev.findIndex((item) => item.id === updated.id);
      if (index === -1) {
        return [updated, ...prev];
      }
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  if (loading || !stay || !user) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading stay...</p>
        </div>
      </main>
    );
  }

  async function refresh() {
    if (!user || !stay) {
      return;
    }

    const [item, listings] = await Promise.all([
      staysClient.getStay(user.id, stayId),
      staysClient.listStays(user.id),
    ]);
    setStay(item);
    setAllStays(listings);
    setAmenitiesText(item.amenities.join(", "));
  }

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    if (!user || !stay) {
      return;
    }

    event.preventDefault();
    setSaving(true);
    setUploadState("uploading");
    setMessage("");

    const form = new FormData(event.currentTarget);

    try {
      const updated = await staysClient.updateStay(user.id, stay.id, {
        propertyType: String(form.get("propertyType") ?? ""),
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? ""),
        address: String(form.get("address") ?? ""),
        city: String(form.get("city") ?? ""),
        country: String(form.get("country") ?? ""),
        latitude: String(form.get("latitude") ?? ""),
        longitude: String(form.get("longitude") ?? ""),
        amenities: splitCsv(amenitiesText),
        houseRules: String(form.get("houseRules") ?? ""),
        checkInTime: String(form.get("checkInTime") ?? ""),
        checkOutTime: String(form.get("checkOutTime") ?? ""),
        cancellationPolicy: String(form.get("cancellationPolicy") ?? ""),
      });

      syncStay(updated);
      setMessage("Stay details saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save details.");
    } finally {
      setSaving(false);
      setUploadState("idle");
    }
  }

  async function addImage(file: File) {
    if (!user || !stay) {
      return;
    }

    setSaving(true);
    setUploadState("uploading");
    setMessage("");

    try {
      const updated = await staysClient.addImage(user.id, stay.id, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      syncStay(updated);
      setMessage("Image added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add image.");
    } finally {
      setSaving(false);
      setUploadState("idle");
    }
  }

  async function moveImage(imageId: string, direction: "up" | "down") {
    if (!user || !stay) {
      return;
    }

    const currentIds = [...stay.images].sort((a, b) => a.order - b.order).map((img) => img.id);
    const index = currentIds.findIndex((id) => id === imageId);
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= currentIds.length) {
      return;
    }

    const copy = [...currentIds];
    const [item] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, item);

    const updated = await staysClient.reorderImages(user.id, stay.id, copy);
    syncStay(updated);
  }

  async function replaceImage(imageId: string, file: File) {
    if (!user || !stay) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updated = await staysClient.replaceImage(user.id, stay.id, imageId, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      syncStay(updated);
      setMessage("Image replaced.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to replace image.");
    } finally {
      setSaving(false);
    }
  }

  async function removeImage(imageId: string) {
    if (!user || !stay) {
      return;
    }

    const updated = await staysClient.removeImage(user.id, stay.id, imageId);
    syncStay(updated);
  }

  async function addRoom() {
    if (!user || !stay) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updated = await staysClient.upsertRoom(user.id, stay.id, {
        name: roomName,
        occupancy: Number(roomOccupancy),
        bedConfiguration: roomBed,
        baseRate: Number(roomRate),
      });
      syncStay(updated);
      setRoomName("");
      setRoomBed("");
      setRoomOccupancy("2");
      setRoomRate("0");
      setMessage("Room added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add room.");
    } finally {
      setSaving(false);
    }
  }

  async function removeRoom(roomId: string) {
    if (!user || !stay) {
      return;
    }

    const updated = await staysClient.removeRoom(user.id, stay.id, roomId);
    syncStay(updated);
  }

  async function changeStatus(next: StayStatus) {
    if (!user || !stay) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updated = await staysClient.updateStatus(user.id, stay.id, next);
      syncStay(updated);
      setMessage(`Status updated to ${updated.status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status change failed.");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!user || !stay) {
      return;
    }

    const updated = await staysClient.archiveStay(user.id, stay.id);
    syncStay(updated);
    setMessage("Stay archived.");
  }

  return (
    <PartnerShell
      title={stay.name || "Stay Draft"}
      description="Edit listing details, media, rooms, and lifecycle status."
      headerExtra={<p className="tm-muted text-sm">Status: {stay.status}</p>}
    >
        <section className="tm-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="tm-section-title">Listing Actions</h2>
              {stay.moderationFeedback ? (
                <p className="mt-2 text-sm text-rose-700">Feedback: {stay.moderationFeedback}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {canSubmit ? (
                <button className="tm-btn tm-btn-accent" disabled={saving} onClick={() => void changeStatus("pending")} type="button">
                  Submit for Review
                </button>
              ) : null}
              {stay.status === "approved" ? (
                <button className="tm-btn tm-btn-primary" disabled={saving} onClick={() => void changeStatus("live")} type="button">
                  Go Live
                </button>
              ) : null}
              {stay.status === "live" ? (
                <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => void changeStatus("paused")} type="button">
                  Pause
                </button>
              ) : null}
              {stay.status === "paused" ? (
                <button className="tm-btn tm-btn-primary" disabled={saving} onClick={() => void changeStatus("live")} type="button">
                  Resume
                </button>
              ) : null}
              {stay.status !== "archived" ? (
                <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => void archive()} type="button">
                  Archive
                </button>
              ) : null}
              <button className="tm-btn tm-btn-outline" onClick={() => router.push("/stays")} type="button">
                Back to Stays
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
          {stay.status === "rejected" && stay.moderationFeedback ? (
            <p className="mt-3 text-sm text-slate-700">
              Correction workflow: apply moderation feedback, resolve quality warnings, then re-submit.
            </p>
          ) : null}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <form className="tm-panel p-6" onSubmit={saveDetails}>
              <h2 className="tm-section-title">Property Details</h2>
              <div className="tm-field-grid mt-4">
                <label className="tm-field">
                  <span className="tm-field-label">Property Type</span>
                  <input className="tm-input" name="propertyType" defaultValue={stay.propertyType} placeholder="Property type" />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Stay Name</span>
                  <input className="tm-input" name="name" defaultValue={stay.name} placeholder="Stay name" />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Description</span>
                  <textarea className="tm-input min-h-28" name="description" defaultValue={stay.description} placeholder="Description" />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Address</span>
                  <input className="tm-input" name="address" defaultValue={stay.address} placeholder="Address" />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="tm-field">
                    <span className="tm-field-label">City</span>
                    <input className="tm-input" name="city" defaultValue={stay.city} placeholder="City" />
                  </label>
                  <label className="tm-field">
                    <span className="tm-field-label">Country</span>
                    <input className="tm-input" name="country" defaultValue={stay.country} placeholder="Country" />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="tm-field">
                    <span className="tm-field-label">Latitude</span>
                    <input className="tm-input" name="latitude" defaultValue={stay.latitude ?? ""} placeholder="Latitude (optional)" />
                  </label>
                  <label className="tm-field">
                    <span className="tm-field-label">Longitude</span>
                    <input className="tm-input" name="longitude" defaultValue={stay.longitude ?? ""} placeholder="Longitude (optional)" />
                  </label>
                </div>
                <label className="tm-field">
                  <span className="tm-field-label">Amenities</span>
                  <textarea className="tm-input min-h-20" placeholder="Comma separated" value={amenitiesText} onChange={(event) => setAmenitiesText(event.target.value)} />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">House Rules</span>
                  <textarea className="tm-input min-h-20" name="houseRules" defaultValue={stay.houseRules} placeholder="House rules" />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="tm-field">
                    <span className="tm-field-label">Check-in Time</span>
                    <input className="tm-input" name="checkInTime" defaultValue={stay.checkInTime} placeholder="Check-in time" />
                  </label>
                  <label className="tm-field">
                    <span className="tm-field-label">Check-out Time</span>
                    <input className="tm-input" name="checkOutTime" defaultValue={stay.checkOutTime} placeholder="Check-out time" />
                  </label>
                </div>
                <label className="tm-field">
                  <span className="tm-field-label">Cancellation Policy</span>
                  <textarea className="tm-input min-h-20" name="cancellationPolicy" defaultValue={stay.cancellationPolicy} placeholder="Cancellation policy" />
                </label>
              </div>
              <div className="tm-inline-actions mt-4">
                <button className="tm-btn tm-btn-primary" disabled={saving} type="submit">
                  {saving ? "Saving..." : "Save Details"}
                </button>
                <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => void refresh()} type="button">
                  Reload
                </button>
              </div>
            </form>

            <section className="tm-panel p-6">
              <h2 className="tm-section-title">Rooms / Units</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="tm-field">
                  <span className="tm-field-label">Room Name</span>
                  <input className="tm-input" placeholder="Room name" value={roomName} onChange={(event) => setRoomName(event.target.value)} />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Occupancy</span>
                  <input className="tm-input" placeholder="Occupancy" type="number" value={roomOccupancy} onChange={(event) => setRoomOccupancy(event.target.value)} />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Bed Configuration</span>
                  <input className="tm-input" placeholder="Bed configuration" value={roomBed} onChange={(event) => setRoomBed(event.target.value)} />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Base Rate</span>
                  <input className="tm-input" placeholder="Base rate" type="number" value={roomRate} onChange={(event) => setRoomRate(event.target.value)} />
                </label>
              </div>
              <button className="tm-btn tm-btn-accent mt-3" onClick={() => void addRoom()} type="button">
                Add Room
              </button>

              <ul className="tm-list-stack mt-4">
                {stay.rooms.map((room) => (
                  <li key={room.id} className="tm-list-card flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-slate-700">
                      <p className="font-medium">{room.name}</p>
                      <p className="text-xs text-slate-500">
                        Occupancy: {room.occupancy} • {room.bedConfiguration} • Rate: {room.baseRate}
                      </p>
                    </div>
                    <button className="tm-btn tm-btn-outline" onClick={() => void removeRoom(room.id)} type="button">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>

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
                  event.currentTarget.value = "";
                }
              }}
            />

            <ul className="tm-list-stack mt-4">
              {[...stay.images]
                .sort((a, b) => a.order - b.order)
                .map((img, index) => (
                  <li key={img.id} className="tm-list-card">
                    <p className="text-sm font-medium text-slate-800">{img.fileName}</p>
                    <p className="text-xs text-slate-500">Order: {index + 1}</p>
                    <input
                      className="hidden"
                      id={`replace-image-${img.id}`}
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
                      <button className="tm-btn tm-btn-outline" onClick={() => void moveImage(img.id, "up")} type="button">
                        Up
                      </button>
                      <button className="tm-btn tm-btn-outline" onClick={() => void moveImage(img.id, "down")} type="button">
                        Down
                      </button>
                      <label className="tm-btn tm-btn-outline cursor-pointer" htmlFor={`replace-image-${img.id}`}>
                        Replace
                      </label>
                      <button className="tm-btn tm-btn-outline" onClick={() => void removeImage(img.id)} type="button">
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
            </ul>

            {stay.images.length === 0 ? <p className="tm-soft-note mt-2 text-sm">No images uploaded yet.</p> : null}
          </section>
        </section>

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </PartnerShell>
  );
}
