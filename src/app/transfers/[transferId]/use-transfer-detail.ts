"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchCatalogOptions } from "@/modules/catalog/catalog-options-client";
import { buildTransferQualityReport } from "@/modules/data-quality/listing-quality";
import { useToastMessage } from "@/components/common/use-toast-message";
import { localityOptionsByCountry, operatingCountryOptions } from "@/modules/profile/location-options";
import type { ListingAppeal, TransferListing, TransferStatus, TransferType } from "@/modules/transfers/contracts";
import { transfersClient } from "@/modules/transfers/transfers-client";
import { normalizeTransferVehicleClass, transferVehicleClassOptions } from "@/modules/transfers/vehicle-options";
import { stayTimeOptions } from "@/modules/stays/time-options";

export const DEFAULT_OPEN = "06:00";
export const DEFAULT_CLOSE = "23:00";
export const knownTimeValues = new Set(stayTimeOptions.map((opt) => opt.value));

export const TRANSFER_FEATURE_OPTIONS = [
  { value: "AC", label: "Air Conditioning" },
  { value: "Wi-Fi", label: "Wi-Fi" },
  { value: "Child seat", label: "Child Seat" },
  { value: "Meet and greet", label: "Meet & Greet" },
  { value: "Airport signage", label: "Airport Signage" },
  { value: "Luggage assistance", label: "Luggage Assistance" },
  { value: "Wheelchair accessible", label: "Wheelchair Accessible" },
  { value: "Professional driver", label: "Professional Driver" },
  { value: "Water onboard", label: "Water Onboard" },
];

export const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
];

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
  if (!raw) return "";
  const aliased = COUNTRY_ALIASES[raw.toLowerCase()];
  if (aliased) return aliased;
  return operatingCountryOptions.find((c) => c.toLowerCase() === raw.toLowerCase()) ?? "";
}

function parseCoverageArea(value: string): { country: string; city: string } | null {
  const parts = value.split(",").map((s) => s.trim());
  if (parts.length !== 2) return null;
  const [cityRaw, countryRaw] = parts;
  const country = normalizeCountry(countryRaw);
  if (!country) return null;
  const localities = localityOptionsByCountry[country as keyof typeof localityOptionsByCountry] ?? [];
  const city = localities.find((entry) => entry.toLowerCase() === cityRaw.toLowerCase()) ?? "";
  if (!city) return null;
  return { country, city };
}

export function parseOperatingHours(value: string): { open: string; close: string } {
  const parts = value.trim().split("-");
  if (parts.length === 2) {
    const [open, close] = parts.map((p) => p.trim());
    const valid = (t: string) => /^\d{2}:\d{2}$/.test(t);
    if (valid(open) && valid(close)) return { open, close };
  }
  return { open: DEFAULT_OPEN, close: DEFAULT_CLOSE };
}

function normalizeTransferListing(entry: TransferListing): TransferListing {
  return {
    ...entry,
    features: Array.isArray(entry.features) ? entry.features : [],
    images: Array.isArray(entry.images) ? entry.images : [],
  };
}

export function useTransferDetail(userId: string | undefined, transferId: string) {
  const router = useRouter();

  const [item, setItem] = useState<TransferListing | null>(null);
  const [allTransfers, setAllTransfers] = useState<TransferListing[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [appeal, setAppeal] = useState<ListingAppeal | null>(null);
  const [appealMessage, setAppealMessage] = useState("");
  const [appealMessageTouched, setAppealMessageTouched] = useState(false);
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState("NGN");
  const [openTime, setOpenTime] = useState(DEFAULT_OPEN);
  const [closeTime, setCloseTime] = useState(DEFAULT_CLOSE);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedVehicleClass, setSelectedVehicleClass] = useState("");
  const [vehicleClassOptions, setVehicleClassOptions] = useState<Array<{ value: string; label: string }>>(
    [...transferVehicleClassOptions],
  );

  const availableCities = selectedCountry
    ? (localityOptionsByCountry[selectedCountry as keyof typeof localityOptionsByCountry] ?? [])
    : [];
  const knownVehicleClassValues = new Set(vehicleClassOptions.map((opt) => opt.value));
  const knownFeatureValues = new Set(TRANSFER_FEATURE_OPTIONS.map((opt) => opt.value));
  const filteredCities = citySearch.trim()
    ? availableCities.filter((city) => city.toLowerCase().includes(citySearch.trim().toLowerCase()))
    : availableCities;

  useEffect(() => {
    if (!userId) return;

    let active = true;
    setItem(null);
    setAppeal(null);
    setShowAppealForm(false);
    setAppealMessage("");
    setAppealMessageTouched(false);
    setMessage("");

    fetchCatalogOptions().then((catalogOptions) => {
      if (!active) return;
      if (catalogOptions.vehicleClasses.length > 0) {
        setVehicleClassOptions(
          catalogOptions.vehicleClasses.map((opt) => ({ value: opt.code, label: opt.label })),
        );
      }
    });

    transfersClient
      .listTransfers(userId)
      .then(async (listings) => {
        const result =
          listings.find((entry) => entry.id === transferId) ??
          (await transfersClient.getTransfer(userId, transferId));
        if (!active) return;

        const normalizedResult = normalizeTransferListing(result);
        const normalizedListings = listings.map(normalizeTransferListing);
        const parsedCoverage = parseCoverageArea(normalizedResult.coverageArea);

        setItem(normalizedResult);
        setAllTransfers(normalizedListings.length > 0 ? normalizedListings : [normalizedResult]);
        setSelectedFeatures(normalizedResult.features);
        setSelectedCurrency(normalizedResult.currency || "NGN");
        const parsedHours = parseOperatingHours(normalizedResult.operatingHours);
        setOpenTime(parsedHours.open);
        setCloseTime(parsedHours.close);
        setSelectedCountry(parsedCoverage?.country ?? "");
        setSelectedCity(parsedCoverage?.city ?? "");
        setCitySearch("");
        setSelectedVehicleClass(normalizeTransferVehicleClass(normalizedResult.vehicleClass));

        if (normalizedResult.status === "paused_by_admin") {
          const existingAppeal = await transfersClient.getAppeal(userId, transferId).catch(() => null);
          if (active) {
            setAppeal(existingAppeal);
            setShowAppealForm(false);
            setAppealMessage("");
            setAppealMessageTouched(false);
          }
        } else if (active) {
          setAppeal(null);
        }
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof Error && error.message.includes("Transfer not found")) {
          router.replace("/transfers");
          return;
        }
        setMessage(error instanceof Error ? error.message : "Failed to load transfer.");
      });

    return () => {
      active = false;
    };
  }, [router, transferId, userId]);

  const canSubmit = useMemo(
    () => item?.status === "draft" || item?.status === "rejected",
    [item?.status],
  );
  const canEditDetails = useMemo(
    () => item?.status === "draft" || item?.status === "rejected",
    [item?.status],
  );
  const qualityReport = useMemo(
    () => (item ? buildTransferQualityReport(item, allTransfers) : null),
    [allTransfers, item],
  );

  function syncTransfer(updated: TransferListing) {
    const normalized = normalizeTransferListing(updated);
    setSelectedVehicleClass(normalizeTransferVehicleClass(normalized.vehicleClass));
    setItem(normalized);
    setAllTransfers((prev) => {
      const index = prev.findIndex((entry) => entry.id === normalized.id);
      if (index === -1) return [normalized, ...prev];
      const next = [...prev];
      next[index] = normalized;
      return next;
    });
  }

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !item) return;

    setSaving(true);
    setUploadState("uploading");
    setMessage("");

    const form = new FormData(event.currentTarget);
    try {
      if (!canEditDetails) {
        throw new Error("Only draft or rejected transfers can be edited.");
      }
      const updated = await transfersClient.updateTransfer(userId, item.id, {
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? ""),
        transferType: String(form.get("transferType") ?? "") as TransferType,
        pickupPoint: String(form.get("pickupPoint") ?? ""),
        dropoffPoint: String(form.get("dropoffPoint") ?? ""),
        vehicleClass: selectedVehicleClass,
        passengerCapacity: Number(form.get("passengerCapacity") ?? 0),
        luggageCapacity: Number(form.get("luggageCapacity") ?? 0),
        features: selectedFeatures,
        coverageArea: `${selectedCity}, ${selectedCountry}`,
        operatingHours: `${openTime}-${closeTime}`,
        currency: selectedCurrency,
        baseFare: Number(form.get("baseFare") ?? 0),
        nightSurcharge: Number(form.get("nightSurcharge") ?? 0),
        cancellationPolicy: String(form.get("cancellationPolicy") ?? ""),
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
    if (!userId || !item) return;
    setSaving(true);
    setUploadState("uploading");
    setMessage("");
    try {
      const updated = await transfersClient.updateStatus(userId, item.id, next);
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
    if (!userId || !item) return;
    const updated = await transfersClient.archiveTransfer(userId, item.id);
    syncTransfer(updated);
    setMessage("Transfer archived.");
  }

  function toggleFeature(value: string) {
    if (!canEditDetails) return;
    setSelectedFeatures((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    );
  }

  async function addImage(file: File) {
    if (!userId || !item) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await transfersClient.addImage(userId, item.id, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        file,
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
    if (!userId || !item) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await transfersClient.replaceImage(userId, item.id, imageId, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        file,
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
    if (!userId || !item) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await transfersClient.removeImage(userId, item.id, imageId);
      syncTransfer(updated);
      setMessage("Image removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove image.");
    } finally {
      setSaving(false);
    }
  }

  async function submitAppeal() {
    if (!userId || !item || !showAppealForm || !appealMessageTouched || !appealMessage.trim()) return;
    setSubmittingAppeal(true);
    try {
      const submitted = await transfersClient.submitAppeal(userId, item.id, appealMessage.trim());
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

  async function moveImage(imageId: string, direction: "up" | "down") {
    if (!userId || !item) return;
    const currentIds = (Array.isArray(item.images) ? item.images : [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((img) => img.id);
    const index = currentIds.findIndex((id) => id === imageId);
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= currentIds.length) return;

    const copy = [...currentIds];
    const [target] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, target);

    const updated = await transfersClient.reorderImages(userId, item.id, copy);
    syncTransfer(updated);
  }

  return {
    item,
    saving,
    appeal,
    appealMessage,
    appealMessageTouched,
    submittingAppeal,
    showAppealForm,
    uploadState,
    selectedFeatures,
    selectedCurrency,
    openTime,
    closeTime,
    selectedCountry,
    selectedCity,
    citySearch,
    selectedVehicleClass,
    vehicleClassOptions,
    availableCities,
    knownVehicleClassValues,
    knownFeatureValues,
    filteredCities,
    canSubmit,
    canEditDetails,
    qualityReport,
    setShowAppealForm,
    setAppealMessage,
    setAppealMessageTouched,
    setSelectedCurrency,
    setOpenTime,
    setCloseTime,
    setSelectedCountry,
    setSelectedCity,
    setCitySearch,
    setSelectedVehicleClass,
    saveDetails,
    changeStatus,
    archive,
    toggleFeature,
    addImage,
    replaceImage,
    removeImage,
    submitAppeal,
    moveImage,
  };
}
