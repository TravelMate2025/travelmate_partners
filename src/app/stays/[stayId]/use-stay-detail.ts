"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FALLBACK_SPACE_TYPES, fetchCatalogOptions } from "@/modules/catalog/catalog-options-client";
import { useToastMessage } from "@/components/common/use-toast-message";
import { buildStayQualityReport } from "@/modules/data-quality/listing-quality";
import { localityOptionsByCountry, operatingCountryOptions } from "@/modules/profile/location-options";
import { stayAmenityOptions } from "@/modules/stays/amenity-options";
import { normalizeStayPropertyType, stayPropertyTypeOptions } from "@/modules/stays/property-type-options";
import { stayTimeOptions } from "@/modules/stays/time-options";
import { staysClient } from "@/modules/stays/stays-client";
import type { ListingAppeal, StayListing, StayStatus } from "@/modules/stays/contracts";

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

export const knownTimeValues = new Set(stayTimeOptions.map((item) => item.value));

function normalizeCountry(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const aliased = COUNTRY_ALIASES[raw.toLowerCase()];
  if (aliased) return aliased;
  return operatingCountryOptions.find((c) => c.toLowerCase() === raw.toLowerCase()) ?? "";
}

export function useStayDetail(userId: string | undefined, stayId: string) {
  const router = useRouter();

  const [stay, setStay] = useState<StayListing | null>(null);
  const [allStays, setAllStays] = useState<StayListing[]>([]);
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
  const filteredCities = citySearch.trim()
    ? availableCities.filter((city) => city.toLowerCase().includes(citySearch.trim().toLowerCase()))
    : availableCities;

  function applyStayToState(item: StayListing) {
    setSelectedAmenities(item.amenities);
    setSelectedPropertyType(normalizeStayPropertyType(item.propertyType));
    const normalizedCountry = normalizeCountry(item.country);
    setSelectedCountry(normalizedCountry);
    if (normalizedCountry) {
      const localities =
        localityOptionsByCountry[normalizedCountry as keyof typeof localityOptionsByCountry] ?? [];
      setSelectedCity(
        localities.find((l) => l.toLowerCase() === item.city.trim().toLowerCase()) ?? "",
      );
    } else {
      setSelectedCity("");
    }
    setCitySearch("");
  }

  useEffect(() => {
    if (!userId) return;

    let active = true;
    setStay(null);
    setAppeal(null);
    setShowAppealForm(false);
    setAppealMessage("");
    setAppealMessageTouched(false);
    setMessage("");

    fetchCatalogOptions().then((catalogOptions) => {
      if (!active) return;
      if (catalogOptions.propertyTypes.length > 0) {
        setPropertyTypeOptions(
          catalogOptions.propertyTypes.map((item) => ({ value: item.code, label: item.label })),
        );
      }
      if (catalogOptions.amenities.length > 0) {
        setAmenityOptions(
          catalogOptions.amenities.map((item) => ({ value: item.code, label: item.label })),
        );
      }
      if (catalogOptions.spaceTypes.length > 0) {
        setSpaceTypeOptions(
          catalogOptions.spaceTypes.map((item) => ({ value: item.code, label: item.label })),
        );
      }
    });

    Promise.all([
      staysClient.getStay(userId, stayId),
      staysClient.listStays(userId),
    ])
      .then(async ([item, listings]) => {
        if (!active) return;

        setStay(item);
        setAllStays(listings);
        applyStayToState(item);

        if (item.status === "paused_by_admin") {
          const existingAppeal = await staysClient.getAppeal(userId, stayId).catch(() => null);
          if (active) setAppeal(existingAppeal);
        }
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof Error && error.message.includes("Stay not found")) {
          router.replace("/stays");
          return;
        }
        setMessage(error instanceof Error ? error.message : "Failed to load stay. Please refresh.");
      });

    return () => {
      active = false;
    };
  }, [router, stayId, userId]);

  const canSubmit = useMemo(() => stay?.status === "draft" || stay?.status === "rejected", [stay?.status]);
  const canEditDetails = useMemo(
    () => stay?.status === "draft" || stay?.status === "rejected",
    [stay?.status],
  );
  const qualityReport = useMemo(
    () => (stay ? buildStayQualityReport(stay, allStays) : null),
    [allStays, stay],
  );

  function syncStay(updated: StayListing) {
    setStay(updated);
    setAllStays((prev) => {
      const index = prev.findIndex((item) => item.id === updated.id);
      if (index === -1) return [updated, ...prev];
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  async function refresh() {
    if (!userId || !stay) return;
    const [item, listings] = await Promise.all([
      staysClient.getStay(userId, stayId),
      staysClient.listStays(userId),
    ]);
    setStay(item);
    setAllStays(listings);
    applyStayToState(item);
    if (item.status === "paused_by_admin") {
      const existingAppeal = await staysClient.getAppeal(userId, stayId).catch(() => null);
      setAppeal(existingAppeal);
    } else {
      setAppeal(null);
    }
  }

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    if (!userId || !stay) return;
    event.preventDefault();
    setSaving(true);
    setUploadState("uploading");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      if (!canEditDetails) {
        throw new Error("Only draft or rejected stays can be edited. Move listing to draft and try again.");
      }
      const updated = await staysClient.updateStay(userId, stay.id, {
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
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  }

  async function addImage(file: File, roomId?: string) {
    if (!userId || !stay) return;
    setSaving(true);
    setUploadState("uploading");
    setMessage("");
    try {
      const updated = await staysClient.addImage(userId, stay.id, {
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
    if (!userId || !stay) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await staysClient.assignImageToRoom(userId, stay.id, imageId, roomId);
      syncStay(updated);
      setMessage(roomId ? "Image assigned to room." : "Image moved to property gallery.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to reassign image.");
    } finally {
      setSaving(false);
    }
  }

  async function assignImageSpaceType(imageId: string, spaceType: string | null) {
    if (!userId || !stay) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await staysClient.assignImageSpaceType(userId, stay.id, imageId, spaceType);
      syncStay(updated);
      setMessage(spaceType ? `Space type set to "${spaceType}".` : "Space type cleared.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update space type.");
    } finally {
      setSaving(false);
    }
  }

  async function moveImage(imageId: string, direction: "up" | "down") {
    if (!userId || !stay) return;
    const currentIds = [...stay.images].sort((a, b) => a.order - b.order).map((img) => img.id);
    const index = currentIds.findIndex((id) => id === imageId);
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= currentIds.length) return;

    const copy = [...currentIds];
    const [item] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, item);

    const updated = await staysClient.reorderImages(userId, stay.id, copy);
    syncStay(updated);
  }

  async function replaceImage(imageId: string, file: File) {
    if (!userId || !stay) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await staysClient.replaceImage(userId, stay.id, imageId, {
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
    if (!userId || !stay) return;
    const updated = await staysClient.removeImage(userId, stay.id, imageId);
    syncStay(updated);
  }

  async function addRoom() {
    if (!userId || !stay) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await staysClient.upsertRoom(userId, stay.id, {
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
    if (!userId || !stay) return;
    const updated = await staysClient.removeRoom(userId, stay.id, roomId);
    syncStay(updated);
  }

  async function changeStatus(next: StayStatus) {
    if (!userId || !stay) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await staysClient.updateStatus(userId, stay.id, next);
      syncStay(updated);
      setMessage(`Status updated to ${updated.status}.`);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Status change failed.";
      setMessage(
        rawMessage.toLowerCase().includes("cannot transition stay")
          ? `${rawMessage} Use the allowed workflow actions on this page.`
          : rawMessage,
      );
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!userId || !stay) return;
    try {
      const updated = await staysClient.archiveStay(userId, stay.id);
      syncStay(updated);
      setMessage("Stay archived.");
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Archive failed.";
      setMessage(
        rawMessage.toLowerCase().includes("cannot archive a stay with status")
          ? `${rawMessage} Move the listing to an allowed state first.`
          : rawMessage,
      );
    }
  }

  async function submitAppeal() {
    if (!userId || !stay || !showAppealForm || !appealMessageTouched || !appealMessage.trim()) return;
    setSubmittingAppeal(true);
    try {
      const submitted = await staysClient.submitAppeal(userId, stay.id, appealMessage.trim());
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

  return {
    stay,
    saving,
    appeal,
    appealMessage,
    appealMessageTouched,
    submittingAppeal,
    showAppealForm,
    uploadState,
    selectedAmenities,
    roomName,
    roomOccupancy,
    roomBed,
    roomRate,
    selectedCountry,
    selectedCity,
    citySearch,
    selectedPropertyType,
    propertyTypeOptions,
    amenityOptions,
    spaceTypeOptions,
    availableCities,
    filteredCities,
    knownPropertyTypeValues,
    knownAmenityValues,
    canSubmit,
    canEditDetails,
    qualityReport,
    setShowAppealForm,
    setAppealMessage,
    setAppealMessageTouched,
    setSelectedAmenities,
    setRoomName,
    setRoomOccupancy,
    setRoomBed,
    setRoomRate,
    setSelectedCountry,
    setSelectedCity,
    setCitySearch,
    setSelectedPropertyType,
    refresh,
    saveDetails,
    toggleAmenity,
    addImage,
    assignImageToRoom,
    assignImageSpaceType,
    moveImage,
    replaceImage,
    removeImage,
    addRoom,
    removeRoom,
    changeStatus,
    archive,
    submitAppeal,
  };
}
