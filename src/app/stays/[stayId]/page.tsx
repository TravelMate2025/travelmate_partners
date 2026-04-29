"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { authClient } from "@/modules/auth/auth-client";
import { FALLBACK_SPACE_TYPES, fetchCatalogOptions } from "@/modules/catalog/catalog-options-client";
import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import type { PartnerUser } from "@/modules/auth/contracts";
import { HttpError } from "@/lib/http-client";
import { buildStayQualityReport } from "@/modules/data-quality/listing-quality";
import { localityOptionsByCountry, operatingCountryOptions } from "@/modules/profile/location-options";
import { profileClient } from "@/modules/profile/profile-client";
import { stayAmenityOptions } from "@/modules/stays/amenity-options";
import { normalizeStayPropertyType, stayPropertyTypeOptions } from "@/modules/stays/property-type-options";
import { stayTimeOptions } from "@/modules/stays/time-options";
import { staysClient } from "@/modules/stays/stays-client";
import type { ListingAppeal, StayListing, StayStatus } from "@/modules/stays/contracts";
import { verificationClient } from "@/modules/verification/verification-client";

const COUNTRY_ALIASES: Record<string, string> = {
  ng: "Nigeria",
  nigeria: "Nigeria",
  us: "United States",
  usa: "United States",
  "united states": "United States",
  uk: "United Kingdom",
  gb: "United Kingdom",
  "united kingdom": "United Kingdom",
};

function normalizeCountry(value: string): string {
  const raw = value.trim();
  if (!raw) {
    return "";
  }
  const aliased = COUNTRY_ALIASES[raw.toLowerCase()];
  if (aliased) {
    return aliased;
  }
  return operatingCountryOptions.find((country) => country.toLowerCase() === raw.toLowerCase()) ?? "";
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
  useToastMessage(message);
  const [appeal, setAppeal] = useState<ListingAppeal | null>(null);
  const [appealMessage, setAppealMessage] = useState("");
  const [appealMessageTouched, setAppealMessageTouched] = useState(false);
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [roomName, setRoomName] = useState("");
  const [roomOccupancy, setRoomOccupancy] = useState("2");
  const [roomBed, setRoomBed] = useState("");
  const [roomRate, setRoomRate] = useState("0");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedPropertyType, setSelectedPropertyType] = useState("");
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<Array<{ value: string; label: string }>>(
    [...stayPropertyTypeOptions],
  );
  const [amenityOptions, setAmenityOptions] = useState<Array<{ value: string; label: string }>>(
    [...stayAmenityOptions],
  );
  const [spaceTypeOptions, setSpaceTypeOptions] = useState<Array<{ value: string; label: string }>>(
    FALLBACK_SPACE_TYPES.map((item) => ({ value: item.code, label: item.label })),
  );

  const availableCities = selectedCountry
    ? (localityOptionsByCountry[selectedCountry as keyof typeof localityOptionsByCountry] ?? [])
    : [];
  const knownPropertyTypeValues = new Set(propertyTypeOptions.map((item) => item.value));
  const knownAmenityValues = new Set(amenityOptions.map((item) => item.value));
  const knownTimeValues = new Set(stayTimeOptions.map((item) => item.value));
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
        if (catalogOptions.amenities.length > 0) {
          setAmenityOptions(
            catalogOptions.amenities.map((item) => ({
              value: item.code,
              label: item.label,
            })),
          );
        }
        if (catalogOptions.spaceTypes.length > 0) {
          setSpaceTypeOptions(
            catalogOptions.spaceTypes.map((item) => ({
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

        if (item.status === "paused_by_admin") {
          const existingAppeal = await staysClient.getAppeal(currentUser.id, stayId).catch(() => null);
          if (active) setAppeal(existingAppeal);
        }
        setSelectedAmenities(item.amenities);
        setSelectedPropertyType(normalizeStayPropertyType(item.propertyType));
        const normalizedCountry = normalizeCountry(item.country);
        setSelectedCountry(normalizedCountry);
        if (normalizedCountry) {
          const localities =
            localityOptionsByCountry[normalizedCountry as keyof typeof localityOptionsByCountry] ?? [];
          setSelectedCity(
            localities.find((locality) => locality.toLowerCase() === item.city.trim().toLowerCase()) ?? "",
          );
          setCitySearch("");
        } else {
          setSelectedCity("");
          setCitySearch("");
        }
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

        if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
          router.replace("/auth/login");
          return;
        }

        setMessage(error instanceof Error ? error.message : "Failed to load stay. Please refresh.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router, stayId]);

  const canSubmit = useMemo(() => stay?.status === "draft" || stay?.status === "rejected", [stay?.status]);
  const canEditDetails = useMemo(
    () => stay?.status === "draft" || stay?.status === "rejected",
    [stay?.status],
  );
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
    setSelectedAmenities(item.amenities);
    setSelectedPropertyType(normalizeStayPropertyType(item.propertyType));
    const normalizedCountry = normalizeCountry(item.country);
    setSelectedCountry(normalizedCountry);
    if (normalizedCountry) {
      const localities =
        localityOptionsByCountry[normalizedCountry as keyof typeof localityOptionsByCountry] ?? [];
      setSelectedCity(
        localities.find((locality) => locality.toLowerCase() === item.city.trim().toLowerCase()) ?? "",
      );
      setCitySearch("");
    } else {
      setSelectedCity("");
      setCitySearch("");
    }
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
      if (!canEditDetails) {
        throw new Error("Only draft or rejected stays can be edited. Move listing to draft and try again.");
      }

      const updated = await staysClient.updateStay(user.id, stay.id, {
        propertyType: selectedPropertyType,
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? ""),
        address: String(form.get("address") ?? ""),
        city: selectedCity,
        country: selectedCountry,
        latitude: String(form.get("latitude") ?? ""),
        longitude: String(form.get("longitude") ?? ""),
        amenities: selectedAmenities,
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

  function toggleAmenity(value: string) {
    setSelectedAmenities((prev) => (
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    ));
  }

  async function addImage(file: File, roomId?: string) {
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
        roomId: roomId ?? null,
      });
      syncStay(updated);
      setMessage(roomId ? "Room image added." : "Property image added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add image.");
    } finally {
      setSaving(false);
      setUploadState("idle");
    }
  }

  async function assignImageToRoom(imageId: string, roomId: string | null) {
    if (!user || !stay) {
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const updated = await staysClient.assignImageToRoom(user.id, stay.id, imageId, roomId);
      syncStay(updated);
      setMessage(roomId ? "Image assigned to room." : "Image moved to property gallery.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to reassign image.");
    } finally {
      setSaving(false);
    }
  }

  async function assignImageSpaceType(imageId: string, spaceType: string | null) {
    if (!user || !stay) {
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const updated = await staysClient.assignImageSpaceType(user.id, stay.id, imageId, spaceType);
      syncStay(updated);
      setMessage(spaceType ? `Space type set to "${spaceType}".` : "Space type cleared.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update space type.");
    } finally {
      setSaving(false);
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
      const fallback = "Status change failed.";
      const rawMessage = error instanceof Error ? error.message : fallback;
      if (rawMessage.toLowerCase().includes("cannot transition stay")) {
        setMessage(`${rawMessage} Use the allowed workflow actions on this page.`);
      } else {
        setMessage(rawMessage);
      }
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!user || !stay) {
      return;
    }

    try {
      const updated = await staysClient.archiveStay(user.id, stay.id);
      syncStay(updated);
      setMessage("Stay archived.");
    } catch (error) {
      const fallback = "Archive failed.";
      const rawMessage = error instanceof Error ? error.message : fallback;
      if (rawMessage.toLowerCase().includes("cannot archive a stay with status")) {
        setMessage(`${rawMessage} Move the listing to an allowed state first.`);
      } else {
        setMessage(rawMessage);
      }
    }
  }

  async function submitAppeal() {
    if (!user || !stay || !showAppealForm || !appealMessageTouched || !appealMessage.trim()) {
      return;
    }
    setSubmittingAppeal(true);
    try {
      const submitted = await staysClient.submitAppeal(user.id, stay.id, appealMessage.trim());
      setAppeal(submitted);
      setShowAppealForm(false);
      setAppealMessage("");
      setAppealMessageTouched(false);
      setMessage("Appeal submitted. We will review it and notify you of the outcome.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit appeal. Please try again.");
    } finally {
      setSubmittingAppeal(false);
    }
  }

  return (
    <PartnerShell
      title={stay.name || "Stay Draft"}
      description="Edit listing details, media, rooms, and lifecycle status."
      headerExtra={
        <p className="tm-muted text-sm">
          Status: {stay.status === "paused_by_admin" ? "Suspended by platform" : stay.status}
        </p>
      }
    >
        <section className="tm-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="tm-section-title">Listing Actions</h2>
              {stay.status === "paused_by_admin" ? (
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-amber-700">
                    {stay.moderationFeedback
                      ? `Reason: ${stay.moderationFeedback}`
                      : "This listing has been suspended by the platform. No changes can be made until the restriction is lifted."}
                  </p>
                  {appeal === null || appeal.status === "resolved" ? (
                    showAppealForm ? (
                      <div className="space-y-2">
                        <textarea
                          className="tm-input w-full text-sm"
                          placeholder="Explain why this listing should be reinstated…"
                          rows={3}
                          value={appealMessage}
                          onChange={(e) => {
                            setAppealMessage(e.target.value);
                            if (!appealMessageTouched) setAppealMessageTouched(true);
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            className="tm-btn tm-btn-primary text-sm"
                            disabled={submittingAppeal || !appealMessageTouched || !appealMessage.trim()}
                            onClick={() => void submitAppeal()}
                            type="button"
                          >
                            {submittingAppeal ? "Submitting…" : "Submit Appeal"}
                          </button>
                          <button
                            className="tm-btn tm-btn-outline text-sm"
                            disabled={submittingAppeal}
                            onClick={() => { setShowAppealForm(false); setAppealMessage(""); setAppealMessageTouched(false); }}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {appeal?.resolution === "dismissed" ? (
                          <p className="text-sm text-rose-700">
                            Previous appeal was dismissed
                            {appeal.resolutionNote ? ` (${appeal.resolutionNote})` : ""}.
                          </p>
                        ) : null}
                        <button
                          className="tm-btn tm-btn-outline text-sm"
                          onClick={() => setShowAppealForm(true)}
                          type="button"
                        >
                          {appeal ? "Submit New Appeal" : "Submit Appeal"}
                        </button>
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-amber-600">
                      Existing appeal {appeal.status === "under_review" ? "is under review" : "is pending review"}.
                      {" "}Submitted on {new Date(appeal.createdAt).toLocaleString()}.
                    </p>
                  )}
                </div>
              ) : null}
              {stay.status === "rejected" && stay.moderationFeedback ? (
                <p className="mt-2 text-sm text-rose-700">Feedback: {stay.moderationFeedback}</p>
              ) : null}
              {!canEditDetails ? (
                <p className="mt-2 text-sm text-amber-700">
                  Editing is only available in draft or rejected status. Move this listing to draft before editing.
                </p>
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
              {stay.status === "paused" ? (
                <button
                  className="tm-btn tm-btn-outline"
                  disabled={saving}
                  onClick={() => void changeStatus("draft")}
                  type="button"
                >
                  Move to Draft
                </button>
              ) : null}
              {stay.status !== "archived" && stay.status !== "paused_by_admin" && stay.status !== "paused" ? (
                <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => void archive()} type="button">
                  Archive
                </button>
              ) : null}
              {stay.status === "archived" ? (
                <button
                  className="tm-btn tm-btn-outline"
                  disabled={saving}
                  onClick={() => void changeStatus("draft")}
                  type="button"
                >
                  Restore to Draft
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
          {stay.status === "paused_by_admin" ? (
            <p className="mt-3 text-sm text-amber-700">
              This listing is suspended. Quality improvements cannot be submitted until the platform releases the restriction.
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
                  <select
                    className="tm-input"
                    name="propertyType"
                    value={selectedPropertyType}
                    onChange={(event) => setSelectedPropertyType(event.target.value)}
                    disabled={!canEditDetails || saving}
                    required
                  >
                    <option value="" disabled>
                      Select property type
                    </option>
                    {selectedPropertyType && !knownPropertyTypeValues.has(selectedPropertyType) ? (
                      <option value={selectedPropertyType}>
                        {selectedPropertyType.replace(/_/g, " ")}
                      </option>
                    ) : null}
                    {propertyTypeOptions.map((propertyType) => (
                      <option key={propertyType.value} value={propertyType.value}>
                        {propertyType.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Stay Name</span>
                  <input className="tm-input" name="name" defaultValue={stay.name} disabled={!canEditDetails || saving} placeholder="Stay name" />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Description</span>
                  <textarea className="tm-input min-h-28" name="description" defaultValue={stay.description} disabled={!canEditDetails || saving} placeholder="Description" />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Address</span>
                  <input className="tm-input" name="address" defaultValue={stay.address} disabled={!canEditDetails || saving} placeholder="Address" />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="tm-field">
                    <span className="tm-field-label">City</span>
                    <input
                      className="tm-input mb-2"
                      placeholder="Search city"
                      value={citySearch}
                      disabled={!canEditDetails || saving}
                      onChange={(event) => setCitySearch(event.target.value)}
                    />
                    <select
                      className="tm-input"
                      name="city"
                      value={selectedCity}
                      disabled={!canEditDetails || saving}
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
                      disabled={!canEditDetails || saving}
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
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="tm-field">
                    <span className="tm-field-label">Latitude</span>
                    <input className="tm-input" name="latitude" defaultValue={stay.latitude ?? ""} disabled={!canEditDetails || saving} placeholder="Latitude (optional)" />
                  </label>
                  <label className="tm-field">
                    <span className="tm-field-label">Longitude</span>
                    <input className="tm-input" name="longitude" defaultValue={stay.longitude ?? ""} disabled={!canEditDetails || saving} placeholder="Longitude (optional)" />
                  </label>
                </div>
                <label className="tm-field">
                  <span className="tm-field-label">Amenities</span>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {amenityOptions.map((amenity) => (
                      <label key={amenity.value} className="tm-tag-pill flex items-center gap-2">
                        <input
                          checked={selectedAmenities.includes(amenity.value)}
                          disabled={!canEditDetails || saving}
                          onChange={() => toggleAmenity(amenity.value)}
                          type="checkbox"
                        />
                        {amenity.label}
                      </label>
                    ))}
                    {selectedAmenities
                      .filter((value) => !knownAmenityValues.has(value))
                      .map((value) => (
                        <label key={value} className="tm-tag-pill flex items-center gap-2">
                          <input
                            checked
                            disabled={!canEditDetails || saving}
                            onChange={() => toggleAmenity(value)}
                            type="checkbox"
                          />
                          {value.replace(/_/g, " ")}
                        </label>
                      ))}
                  </div>
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">House Rules</span>
                  <textarea className="tm-input min-h-20" name="houseRules" defaultValue={stay.houseRules} disabled={!canEditDetails || saving} placeholder="House rules" />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="tm-field">
                    <span className="tm-field-label">Check-in Time</span>
                    <select className="tm-input" name="checkInTime" defaultValue={stay.checkInTime || ""} disabled={!canEditDetails || saving}>
                      <option value="">Select check-in time</option>
                      {stay.checkInTime && !knownTimeValues.has(stay.checkInTime) ? (
                        <option value={stay.checkInTime}>{stay.checkInTime}</option>
                      ) : null}
                      {stayTimeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="tm-field">
                    <span className="tm-field-label">Check-out Time</span>
                    <select className="tm-input" name="checkOutTime" defaultValue={stay.checkOutTime || ""} disabled={!canEditDetails || saving}>
                      <option value="">Select check-out time</option>
                      {stay.checkOutTime && !knownTimeValues.has(stay.checkOutTime) ? (
                        <option value={stay.checkOutTime}>{stay.checkOutTime}</option>
                      ) : null}
                      {stayTimeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="tm-field">
                  <span className="tm-field-label">Cancellation Policy</span>
                  <textarea className="tm-input min-h-20" name="cancellationPolicy" defaultValue={stay.cancellationPolicy} disabled={!canEditDetails || saving} placeholder="Cancellation policy" />
                </label>
              </div>
              <div className="tm-inline-actions mt-4">
                <button className="tm-btn tm-btn-primary" disabled={saving || !canEditDetails} type="submit">
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
                {stay.rooms.map((room) => {
                  const roomImages = [...stay.images]
                    .filter((img) => img.roomId === room.id)
                    .sort((a, b) => a.order - b.order);
                  return (
                    <li key={room.id} className="tm-list-card space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm text-slate-700">
                          <p className="font-medium">{room.name}</p>
                          <p className="text-xs text-slate-500">
                            Occupancy: {room.occupancy} • {room.bedConfiguration} • Rate: {room.baseRate}
                          </p>
                        </div>
                        <button className="tm-btn tm-btn-outline" onClick={() => void removeRoom(room.id)} type="button">
                          Remove
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-xs font-medium text-slate-600">Room Images</p>
                        <input
                          className="tm-input mt-2"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void addImage(file, room.id);
                              event.currentTarget.value = "";
                            }
                          }}
                        />
                        {roomImages.length > 0 ? (
                          <ul className="mt-2 space-y-1">
                            {roomImages.map((img) => (
                              <li key={img.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                <span className="truncate font-medium">{img.fileName}</span>
                                <div className="tm-inline-actions">
                                  <button
                                    className="tm-btn tm-btn-outline"
                                    onClick={() => void assignImageToRoom(img.id, null)}
                                    type="button"
                                  >
                                    Move to property
                                  </button>
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
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">No images for this room yet.</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <section className="tm-panel p-6">
            <h2 className="tm-section-title">Property Images</h2>
            <p className="mt-1 text-sm text-slate-600">
              Exterior, lobby, common areas. PNG, JPEG, WEBP up to 8MB.
            </p>
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
                .filter((img) => img.roomId === null)
                .sort((a, b) => a.order - b.order)
                .map((img, index) => (
                  <li key={img.id} className="tm-list-card">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{img.fileName}</p>
                        <p className="text-xs text-slate-500">Order: {index + 1}</p>
                      </div>
                      {img.spaceType ? (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {spaceTypeOptions.find((o) => o.value === img.spaceType)?.label ?? img.spaceType}
                        </span>
                      ) : (
                        <span className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-400">
                          No space type
                        </span>
                      )}
                    </div>
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
                      <button className="tm-btn tm-btn-outline" onClick={() => void moveImage(img.id, "up")} type="button">Up</button>
                      <button className="tm-btn tm-btn-outline" onClick={() => void moveImage(img.id, "down")} type="button">Down</button>
                      <label className="tm-btn tm-btn-outline cursor-pointer" htmlFor={`replace-image-${img.id}`}>Replace</label>
                      <select
                        aria-label="Set space type"
                        className="tm-input text-xs"
                        value={img.spaceType ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          void assignImageSpaceType(img.id, value || null);
                        }}
                      >
                        <option value="">— Space type —</option>
                        {spaceTypeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {stay.rooms.length > 0 ? (
                        <select
                          className="tm-input text-xs"
                          defaultValue=""
                          onChange={(event) => {
                            const roomId = event.target.value || null;
                            if (roomId !== "") void assignImageToRoom(img.id, roomId);
                            event.currentTarget.value = "";
                          }}
                        >
                          <option value="" disabled>Move to room…</option>
                          {stay.rooms.map((room) => (
                            <option key={room.id} value={room.id}>{room.name}</option>
                          ))}
                        </select>
                      ) : null}
                      <button className="tm-btn tm-btn-outline" onClick={() => void removeImage(img.id)} type="button">Remove</button>
                    </div>
                  </li>
                ))}
            </ul>

            {stay.images.filter((img) => img.roomId === null).length === 0 ? (
              <p className="tm-soft-note mt-2 text-sm">No property images uploaded yet.</p>
            ) : null}
          </section>
        </section>

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </PartnerShell>
  );
}
