"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchCatalogOptions } from "@/modules/catalog/catalog-options-client";
import { buildTransferQualityReport } from "@/modules/data-quality/listing-quality";
import { useToastMessage } from "@/components/common/use-toast-message";
import {
  operatingCityOptionsByCountryRegion,
  operatingCountryOptions,
  operatingRegionOptionsByCountry,
} from "@/modules/profile/location-options";
import type { ListingAppeal, TransferListing, TransferStatus, TransferType } from "@/modules/transfers/contracts";
import { transfersClient } from "@/modules/transfers/transfers-client";
import { normalizeTransferVehicleClass, transferVehicleClassOptions } from "@/modules/transfers/vehicle-options";
import { stayTimeOptions } from "@/modules/stays/time-options";
import {
  fetchCatalogAreas,
  submitLocalitySuggestion,
} from "@/modules/transfers/geography-client";

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
  const regions = operatingRegionOptionsByCountry[country] ?? [];
  const cities = regions.flatMap((region) => operatingCityOptionsByCountryRegion[country]?.[region] ?? []);
  const city = cities.find((entry) => entry.toLowerCase() === cityRaw.toLowerCase()) ?? cityRaw;
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

export function findRegionForCity(country: string, city: string): string {
  const regions = operatingRegionOptionsByCountry[country] ?? [];
  const normalizedCity = city.trim().toLowerCase();
  if (!normalizedCity) return "";
  for (const region of regions) {
    const cities = operatingCityOptionsByCountryRegion[country]?.[region] ?? [];
    if (cities.some((entry) => entry.toLowerCase() === normalizedCity)) return region;
  }
  return "";
}

export function derivedDestinationCityOptions(country: string, adminLevel1 = ""): string[] {
  const regions = adminLevel1 ? [adminLevel1] : operatingRegionOptionsByCountry[country] ?? [];
  return regions.flatMap((r) => operatingCityOptionsByCountryRegion[country]?.[r] ?? []);
}

export type DestinationRouteDraft = {
  id: string;
  destinationCity: string;
  destinationArea: string;
  destinationSubArea: string;
};

function makeDestinationRouteDraft(route?: Partial<DestinationRouteDraft>): DestinationRouteDraft {
  return {
    id: route?.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    destinationCity: route?.destinationCity ?? "",
    destinationArea: route?.destinationArea ?? "",
    destinationSubArea: route?.destinationSubArea ?? "",
  };
}

function normalizeDestinationRouteDrafts(
  entry: TransferListing | null,
): DestinationRouteDraft[] {
  if (!entry) return [];
  if (Array.isArray(entry.destinationRoutes) && entry.destinationRoutes.length > 0) {
    return entry.destinationRoutes.map((route) =>
      makeDestinationRouteDraft({
        destinationCity: route.destinationCity ?? "",
        destinationArea: route.destinationArea ?? "",
        destinationSubArea: route.destinationSubArea ?? "",
      }),
    );
  }
  if (entry.destinationCity || entry.destinationArea || entry.destinationSubArea) {
    return [
      makeDestinationRouteDraft({
        destinationCity: entry.destinationCity ?? "",
        destinationArea: entry.destinationArea ?? "",
        destinationSubArea: entry.destinationSubArea ?? "",
      }),
    ];
  }
  return [makeDestinationRouteDraft()];
}

export function canSubmitTransferDetails(input: {
  status?: string;
  selectedArea: string;
  originAreaSuggestionPending: boolean;
  destinationRoutes: DestinationRouteDraft[];
  destinationRoutePendingById: Record<string, { area: boolean; subArea: boolean }>;
}): boolean {
  if (input.status !== "draft" && input.status !== "rejected") return false;
  if (!input.selectedArea || input.originAreaSuggestionPending) return false;
  if (input.destinationRoutes.length < 1) return false;
  for (const route of input.destinationRoutes) {
    if (!route.destinationCity || !route.destinationArea) return false;
    const pending = input.destinationRoutePendingById[route.id];
    if (pending?.area || pending?.subArea) return false;
  }
  return true;
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
  const [selectedAdminLevel1, setSelectedAdminLevel1] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedVehicleClass, setSelectedVehicleClass] = useState("");
  const [selectedTransferType, setSelectedTransferType] = useState("");
  const [vehicleClassOptions, setVehicleClassOptions] = useState<Array<{ value: string; label: string }>>(
    [...transferVehicleClassOptions],
  );

  const [originAreaOptions, setOriginAreaOptions] = useState<string[]>([]);
  const [originAreaOptionsLoaded, setOriginAreaOptionsLoaded] = useState(false);
  const [originAreaOptionsLoadFailed, setOriginAreaOptionsLoadFailed] = useState(false);

  // Pending suggestion flags
  const [originAreaSuggestionPending, setOriginAreaSuggestionPending] = useState(false);
  const [destinationRoutes, setDestinationRoutes] = useState<DestinationRouteDraft[]>([
    makeDestinationRouteDraft(),
  ]);
  const [destinationRoutePendingById, setDestinationRoutePendingById] = useState<
    Record<string, { area: boolean; subArea: boolean }>
  >({});

  const availableRegions = selectedCountry ? (operatingRegionOptionsByCountry[selectedCountry] ?? []) : [];
  const availableCities =
    selectedCountry && selectedAdminLevel1
      ? (operatingCityOptionsByCountryRegion[selectedCountry]?.[selectedAdminLevel1] ?? [])
      : [];
  const knownVehicleClassValues = new Set(vehicleClassOptions.map((opt) => opt.value));
  const knownFeatureValues = new Set(TRANSFER_FEATURE_OPTIONS.map((opt) => opt.value));
  const filteredCitiesBase = citySearch.trim()
    ? availableCities.filter((city) => city.toLowerCase().includes(citySearch.trim().toLowerCase()))
    : availableCities;
  const filteredCities =
    selectedCity && !filteredCitiesBase.some((city) => city.toLowerCase() === selectedCity.toLowerCase())
      ? [selectedCity, ...filteredCitiesBase]
      : filteredCitiesBase;

  const destinationCityOptions = useMemo(
    () => derivedDestinationCityOptions(selectedCountry, selectedAdminLevel1),
    [selectedAdminLevel1, selectedCountry],
  );

  function setCountrySelection(value: string) {
    setSelectedCountry(value);
    setSelectedAdminLevel1("");
    setSelectedCity("");
    setSelectedArea("");
    setCitySearch("");
    setDestinationRoutes([makeDestinationRouteDraft()]);
    setDestinationRoutePendingById({});
  }

  function setAdminLevel1Selection(value: string) {
    setSelectedAdminLevel1(value);
    setSelectedCity("");
    setSelectedArea("");
    setCitySearch("");
  }

  function setDestinationRoute(routeId: string, patch: Partial<DestinationRouteDraft>) {
    setDestinationRoutes((previous) =>
      previous.map((route) => (route.id === routeId ? { ...route, ...patch } : route)),
    );
  }

  function addDestinationRoute() {
    setDestinationRoutes((previous) => [...previous, makeDestinationRouteDraft()]);
  }

  function removeDestinationRoute(routeId: string) {
    setDestinationRoutes((previous) => {
      const next = previous.filter((route) => route.id !== routeId);
      return next.length > 0 ? next : [makeDestinationRouteDraft()];
    });
    setDestinationRoutePendingById((previous) => {
      const next = { ...previous };
      delete next[routeId];
      return next;
    });
  }

  function moveDestinationRoute(routeId: string, direction: "up" | "down") {
    setDestinationRoutes((previous) => {
      const index = previous.findIndex((route) => route.id === routeId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }
      const next = [...previous];
      const [route] = next.splice(index, 1);
      next.splice(targetIndex, 0, route);
      return next;
    });
  }

  function setDestinationRoutePending(routeId: string, area: boolean, subArea: boolean) {
    setDestinationRoutePendingById((previous) => ({
      ...previous,
      [routeId]: { area, subArea },
    }));
  }

  // Load origin area options
  useEffect(() => {
    if (!userId || !selectedCountry || !selectedAdminLevel1 || !selectedCity) {
      setOriginAreaOptions([]);
      setOriginAreaOptionsLoaded(false);
      setOriginAreaOptionsLoadFailed(false);
      return;
    }
    let active = true;
    setOriginAreaOptionsLoadFailed(false);
    fetchCatalogAreas(userId, selectedCountry, selectedAdminLevel1, selectedCity)
      .then((areas) => {
        if (!active) return;
        setOriginAreaOptions(areas);
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
  }, [userId, selectedCountry, selectedAdminLevel1, selectedCity]);

  // Detect origin area pending: non-empty value not in loaded catalog
  useEffect(() => {
    if (!originAreaOptionsLoaded || !selectedArea) {
      setOriginAreaSuggestionPending(false);
      return;
    }
    setOriginAreaSuggestionPending(
      !originAreaOptions.some((option) => option.toLowerCase() === selectedArea.trim().toLowerCase()),
    );
  }, [originAreaOptions, originAreaOptionsLoaded, selectedArea]);

  useEffect(() => {
    if (!userId) return;

    let active = true;
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
        setSelectedCountry(parsedCoverage?.country ?? normalizeCountry(normalizedResult.country ?? "") ?? "");
        setSelectedCity(parsedCoverage?.city ?? (normalizedResult.city ?? ""));
        setSelectedAdminLevel1(normalizedResult.adminLevel1 ?? "");
        setSelectedArea(normalizedResult.area ?? normalizedResult.city ?? "");
        setCitySearch("");
        setSelectedVehicleClass(normalizeTransferVehicleClass(normalizedResult.vehicleClass));
        setSelectedTransferType(normalizedResult.transferType ?? "");
        setDestinationRoutes(normalizeDestinationRouteDrafts(normalizedResult));
        setDestinationRoutePendingById({});

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

  const canSubmit = useMemo(() => {
    return canSubmitTransferDetails({
      status: item?.status,
      selectedArea,
      originAreaSuggestionPending,
      destinationRoutes,
      destinationRoutePendingById,
    });
  }, [
    item?.status,
    selectedArea,
    originAreaSuggestionPending,
    destinationRoutes,
    destinationRoutePendingById,
  ]);

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
    setSelectedTransferType(normalized.transferType ?? "");
    setDestinationRoutes(normalizeDestinationRouteDrafts(normalized));
    setDestinationRoutePendingById({});
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
        transferType: selectedTransferType as TransferType,
        pickupPoint: String(form.get("pickupPoint") ?? ""),
        vehicleClass: selectedVehicleClass,
        passengerCapacity: Number(form.get("passengerCapacity") ?? 0),
        luggageCapacity: Number(form.get("luggageCapacity") ?? 0),
        features: selectedFeatures,
        coverageArea: `${selectedCity}, ${selectedCountry}`,
        country: selectedCountry,
        adminLevel1: selectedAdminLevel1,
        city: selectedCity,
        area: selectedArea,
        destinationRoutes: destinationRoutes.map((route) => ({
          destinationCity: route.destinationCity,
          destinationArea: route.destinationArea,
          destinationSubArea: route.destinationSubArea,
        })),
        destinationCity: destinationRoutes[0]?.destinationCity ?? "",
        destinationArea: destinationRoutes[0]?.destinationArea ?? "",
        destinationSubArea: destinationRoutes[0]?.destinationSubArea ?? "",
        operatingHours: `${openTime}-${closeTime}`,
        currency: selectedCurrency,
        baseFare: Number(form.get("baseFare") ?? 0),
        nightSurcharge: Number(form.get("nightSurcharge") ?? 0),
        cancellationPolicy: item.cancellationPolicy ?? "",
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

  async function suggestOriginArea() {
    if (!userId || !selectedArea || !selectedCountry || !selectedAdminLevel1 || !selectedCity) return;
    try {
      await submitLocalitySuggestion(userId, {
        country: selectedCountry,
        adminLevel1: selectedAdminLevel1,
        city: selectedCity,
        area: selectedArea,
      });
      setOriginAreaSuggestionPending(true);
      setMessage("Area suggestion submitted. Awaiting catalog approval.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit area suggestion.");
    }
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
    selectedAdminLevel1,
    selectedCity,
    selectedArea,
    citySearch,
    availableRegions,
    selectedVehicleClass,
    vehicleClassOptions,
    availableCities,
    knownVehicleClassValues,
    knownFeatureValues,
    filteredCities,
    selectedTransferType,
    destinationRoutes,
    destinationCityOptions,
    originAreaOptions,
    originAreaOptionsLoaded,
    originAreaOptionsLoadFailed,
    originAreaSuggestionPending,
    destinationRoutePendingById,
    canSubmit,
    canEditDetails,
    qualityReport,
    setShowAppealForm,
    setAppealMessage,
    setAppealMessageTouched,
    setSelectedCurrency,
    setOpenTime,
    setCloseTime,
    setSelectedCountry: setCountrySelection,
    setSelectedAdminLevel1: setAdminLevel1Selection,
    setSelectedCity,
    setSelectedArea,
    setCitySearch,
    setSelectedVehicleClass,
    setSelectedTransferType,
    addDestinationRoute,
    removeDestinationRoute,
    moveDestinationRoute,
    setDestinationRoute,
    setDestinationRoutePending,
    suggestOriginArea,
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
