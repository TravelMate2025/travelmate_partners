"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { TypeaheadInput } from "@/components/common/typeahead-input";
import { operatingCountryOptions } from "@/modules/profile/location-options";
import { stayTimeOptions } from "@/modules/stays/time-options";
import type { TransferListing } from "@/modules/transfers/contracts";
import { fetchCatalogAreas, fetchCatalogSubAreas, submitLocalitySuggestion } from "@/modules/transfers/geography-client";
import {
  CURRENCY_OPTIONS,
  DestinationRouteDraft,
  knownTimeValues,
  TRANSFER_FEATURE_OPTIONS,
} from "./use-transfer-detail";

type Props = {
  item: TransferListing;
  saving: boolean;
  canEditDetails: boolean;
  selectedFeatures: string[];
  selectedCurrency: string;
  openTime: string;
  closeTime: string;
  selectedCountry: string;
  selectedAdminLevel1: string;
  selectedCity: string;
  selectedArea: string;
  availableRegions: string[];
  selectedVehicleClass: string;
  vehicleClassOptions: Array<{ value: string; label: string }>;
  cityOptions: string[];
  knownVehicleClassValues: Set<string>;
  knownFeatureValues: Set<string>;
  selectedTransferType: string;
  destinationRoutes: DestinationRouteDraft[];
  destinationRouteNeedsReviewById: Record<string, { area: boolean; subArea: boolean }>;
  destinationRoutePendingById: Record<string, { area: boolean; subArea: boolean }>;
  destinationCityOptions: string[];
  originAreaOptions: string[];
  originAreaOptionsLoaded: boolean;
  originAreaOptionsLoadFailed: boolean;
  originAreaSuggestionPending: boolean;
  onSaveDetails: (event: FormEvent<HTMLFormElement>) => void;
  onToggleFeature: (value: string) => void;
  onSetCurrency: (v: string) => void;
  onSetOpenTime: (v: string) => void;
  onSetCloseTime: (v: string) => void;
  onSetCountry: (v: string) => void;
  onSetAdminLevel1: (v: string) => void;
  onSetCity: (v: string) => void;
  onSetArea: (v: string) => void;
  onSetVehicleClass: (v: string) => void;
  onSetTransferType: (v: string) => void;
  onAddDestinationRoute: () => void;
  onRemoveDestinationRoute: (routeId: string) => void;
  onMoveDestinationRoute: (routeId: string, direction: "up" | "down") => void;
  onSetDestinationRoute: (routeId: string, patch: Partial<DestinationRouteDraft>) => void;
  onSetDestinationRouteNeedsReview: (routeId: string, area: boolean, subArea: boolean) => void;
  onSetDestinationRoutePending: (routeId: string, area: boolean, subArea: boolean) => void;
  onSuggestOriginArea: () => void;
};

type DestinationRouteEditorProps = {
  userId?: string;
  route: DestinationRouteDraft;
  index: number;
  count: number;
  disabled: boolean;
  selectedCountry: string;
  selectedAdminLevel1: string;
  cityOptions: string[];
  needsReview?: { area: boolean; subArea: boolean };
  pending?: { area: boolean; subArea: boolean };
  onRemove: (routeId: string) => void;
  onMove: (routeId: string, direction: "up" | "down") => void;
  onSetRoute: (routeId: string, patch: Partial<DestinationRouteDraft>) => void;
  onSetNeedsReview: (routeId: string, area: boolean, subArea: boolean) => void;
  onSetPending: (routeId: string, area: boolean, subArea: boolean) => void;
};

export function canSuggestDestinationCity(input: {
  city: string;
  cityOptions: string[];
  citySuggestionPending: boolean;
  disabled: boolean;
}): boolean {
  const selectedCity = input.city.trim();
  if (input.disabled || !selectedCity || input.citySuggestionPending) {
    return false;
  }
  return !input.cityOptions.some((option) => option.toLowerCase() === selectedCity.toLowerCase());
}

export function canSuggestDestinationArea(input: {
  area: string;
  areaOptionsLoaded: boolean;
  areaOptions: string[];
  city: string;
  cityOptions: string[];
  areaNeedsReview: boolean;
  areaSuggestionPending: boolean;
  disabled: boolean;
}): boolean {
  const selectedArea = input.area.trim();
  const selectedCity = input.city.trim();
  const cityApproved = input.cityOptions.some((option) => option.toLowerCase() === selectedCity.toLowerCase());
  if (input.disabled || !selectedArea || input.areaSuggestionPending || !cityApproved) {
    return false;
  }
  if (!input.areaOptionsLoaded) {
    return true;
  }
  return input.areaNeedsReview && !input.areaOptions.some((option) => option.toLowerCase() === selectedArea.toLowerCase());
}

function DestinationRouteEditor({
  userId,
  route,
  index,
  count,
  disabled,
  selectedCountry,
  selectedAdminLevel1,
  cityOptions,
  pending,
  onRemove,
  onMove,
  onSetRoute,
  onSetNeedsReview,
  onSetPending,
}: DestinationRouteEditorProps) {
  const [destinationAreaOptions, setDestinationAreaOptions] = useState<string[]>([]);
  const [destinationAreaOptionsLoaded, setDestinationAreaOptionsLoaded] = useState(false);
  const [destinationAreaOptionsLoadFailed, setDestinationAreaOptionsLoadFailed] = useState(false);
  const [destinationSubAreaOptions, setDestinationSubAreaOptions] = useState<string[]>([]);
  const [destinationSubAreaOptionsLoaded, setDestinationSubAreaOptionsLoaded] = useState(false);
  const [destinationSubAreaOptionsLoadFailed, setDestinationSubAreaOptionsLoadFailed] = useState(false);
  const [destinationAreaNeedsReview, setDestinationAreaNeedsReview] = useState(false);
  const [destinationSubAreaNeedsReview, setDestinationSubAreaNeedsReview] = useState(false);
  const [destinationAreaSuggestionPending, setDestinationAreaSuggestionPending] = useState(false);
  const [destinationSubAreaSuggestionPending, setDestinationSubAreaSuggestionPending] = useState(false);
  const [destinationCitySuggestionPending, setDestinationCitySuggestionPending] = useState(false);
  const [destinationCityDraft, setDestinationCityDraft] = useState(route.destinationCity);
  const [destinationAreaDraft, setDestinationAreaDraft] = useState(route.destinationArea);
  const [destinationSubAreaDraft, setDestinationSubAreaDraft] = useState(route.destinationSubArea);

  useEffect(() => {
    setDestinationCitySuggestionPending(false);
  }, [route.destinationCity]);

  useEffect(() => {
    setDestinationCityDraft(route.destinationCity);
  }, [route.destinationCity]);

  useEffect(() => {
    setDestinationCitySuggestionPending(false);
  }, [destinationCityDraft]);

  useEffect(() => {
    setDestinationAreaDraft(route.destinationArea);
    setDestinationAreaSuggestionPending(false);
  }, [route.destinationArea]);

  useEffect(() => {
    setDestinationAreaSuggestionPending(false);
  }, [destinationAreaDraft]);

  useEffect(() => {
    setDestinationSubAreaDraft(route.destinationSubArea);
    setDestinationSubAreaSuggestionPending(false);
  }, [route.destinationSubArea]);

  useEffect(() => {
    setDestinationSubAreaSuggestionPending(false);
  }, [destinationSubAreaDraft]);

  const destinationCityOptions = cityOptions;

  const showDestinationCitySuggestButton = canSuggestDestinationCity({
    city: route.destinationCity,
    cityOptions: destinationCityOptions,
    citySuggestionPending: destinationCitySuggestionPending,
    disabled,
  });

  useEffect(() => {
    const activeDestinationCity = route.destinationCity || destinationCityDraft;
    if (!userId || !selectedCountry || !selectedAdminLevel1 || !activeDestinationCity) {
      setDestinationAreaOptions([]);
      setDestinationAreaOptionsLoaded(false);
      setDestinationAreaOptionsLoadFailed(false);
      setDestinationAreaNeedsReview(false);
      onSetNeedsReview(route.id, false, false);
      return;
    }

    let active = true;
    setDestinationAreaOptionsLoadFailed(false);
    fetchCatalogAreas(userId, selectedCountry, selectedAdminLevel1, activeDestinationCity)
      .then((areas) => {
        if (!active) return;
        setDestinationAreaOptions(areas);
        setDestinationAreaOptionsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setDestinationAreaOptions([]);
        setDestinationAreaOptionsLoaded(false);
        setDestinationAreaOptionsLoadFailed(true);
      });

    return () => {
      active = false;
    };
  }, [destinationCityDraft, route.destinationCity, route.id, selectedAdminLevel1, selectedCountry, userId]);

  useEffect(() => {
    const activeDestinationArea = route.destinationArea || destinationAreaDraft;
    if (!activeDestinationArea) {
      setDestinationAreaNeedsReview(false);
      onSetNeedsReview(route.id, false, destinationSubAreaNeedsReview);
      return;
    }

    if (!destinationAreaOptionsLoaded) {
      setDestinationAreaNeedsReview(true);
      onSetNeedsReview(route.id, true, destinationSubAreaNeedsReview);
      return;
    }

    const needsReview = !destinationAreaOptions.some(
      (option) => option.toLowerCase() === activeDestinationArea.trim().toLowerCase(),
    );
    setDestinationAreaNeedsReview(needsReview);
    onSetNeedsReview(route.id, needsReview, destinationSubAreaNeedsReview);
  }, [
    destinationAreaOptions,
    destinationAreaOptionsLoaded,
    destinationAreaDraft,
    route.destinationArea,
    route.id,
    destinationSubAreaNeedsReview,
  ]);

  useEffect(() => {
    const activeDestinationCity = route.destinationCity || destinationCityDraft;
    const activeDestinationArea = route.destinationArea || destinationAreaDraft;
    if (!userId || !selectedCountry || !selectedAdminLevel1 || !activeDestinationCity || !activeDestinationArea) {
      setDestinationSubAreaOptions([]);
      setDestinationSubAreaOptionsLoaded(false);
      setDestinationSubAreaOptionsLoadFailed(false);
      setDestinationSubAreaNeedsReview(false);
      onSetNeedsReview(route.id, destinationAreaNeedsReview, false);
      return;
    }

    let active = true;
    setDestinationSubAreaOptionsLoadFailed(false);
    fetchCatalogSubAreas(userId, selectedCountry, selectedAdminLevel1, activeDestinationCity, activeDestinationArea)
      .then((subAreas) => {
        if (!active) return;
        setDestinationSubAreaOptions(subAreas);
        setDestinationSubAreaOptionsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setDestinationSubAreaOptions([]);
        setDestinationSubAreaOptionsLoaded(false);
        setDestinationSubAreaOptionsLoadFailed(true);
      });

    return () => {
      active = false;
    };
  }, [
    destinationAreaDraft,
    destinationAreaNeedsReview,
    destinationCityDraft,
    route.destinationArea,
    route.destinationCity,
    route.id,
    selectedAdminLevel1,
    selectedCountry,
    userId,
  ]);

  useEffect(() => {
    const activeDestinationSubArea = route.destinationSubArea || destinationSubAreaDraft;
    if (!activeDestinationSubArea) {
      setDestinationSubAreaNeedsReview(false);
      onSetNeedsReview(route.id, destinationAreaNeedsReview, false);
      return;
    }

    if (!destinationSubAreaOptionsLoaded) {
      setDestinationSubAreaNeedsReview(true);
      onSetNeedsReview(route.id, destinationAreaNeedsReview, true);
      return;
    }

    const needsReview = !destinationSubAreaOptions.some(
      (option) => option.toLowerCase() === activeDestinationSubArea.trim().toLowerCase(),
    );
    setDestinationSubAreaNeedsReview(needsReview);
    onSetNeedsReview(route.id, destinationAreaNeedsReview, needsReview);
  }, [
    destinationSubAreaOptions,
    destinationSubAreaOptionsLoaded,
    destinationSubAreaDraft,
    route.destinationSubArea,
    route.id,
    destinationAreaNeedsReview,
  ]);

  const activeDestinationCity = route.destinationCity || destinationCityDraft;
  const activeDestinationArea = route.destinationArea || destinationAreaDraft;
  const activeDestinationSubArea = route.destinationSubArea || destinationSubAreaDraft;

  const showDestinationAreaSuggestButton =
    canSuggestDestinationArea({
      area: activeDestinationArea,
      areaOptionsLoaded: destinationAreaOptionsLoaded,
      areaOptions: destinationAreaOptions,
      city: activeDestinationCity,
      cityOptions: destinationCityOptions,
      areaNeedsReview: destinationAreaNeedsReview,
      areaSuggestionPending: destinationAreaSuggestionPending,
      disabled,
    });

  const showDestinationSubAreaSuggestButton =
    !disabled &&
    destinationSubAreaOptionsLoaded &&
    activeDestinationSubArea &&
    destinationSubAreaNeedsReview &&
    !destinationSubAreaSuggestionPending;

  async function suggestDestinationArea() {
    if (!userId || !selectedCountry || !selectedAdminLevel1 || !activeDestinationCity || !activeDestinationArea) return;
    await submitLocalitySuggestion(userId, {
      country: selectedCountry,
      adminLevel1: selectedAdminLevel1,
      city: activeDestinationCity,
      area: activeDestinationArea,
    });
    setDestinationAreaSuggestionPending(true);
    onSetPending(route.id, true, destinationSubAreaSuggestionPending);
  }

  async function suggestDestinationCity() {
    if (!userId || !selectedCountry || !selectedAdminLevel1 || !activeDestinationCity) return;
    await submitLocalitySuggestion(userId, {
      country: selectedCountry,
      adminLevel1: selectedAdminLevel1,
      city: activeDestinationCity,
      area: activeDestinationCity,
    });
    setDestinationCitySuggestionPending(true);
  }

  async function suggestDestinationSubArea() {
    if (
      !userId ||
      !selectedCountry ||
      !selectedAdminLevel1 ||
      !route.destinationCity ||
      !route.destinationArea ||
      !route.destinationSubArea
    ) {
      return;
    }
    await submitLocalitySuggestion(userId, {
      country: selectedCountry,
      adminLevel1: selectedAdminLevel1,
      city: route.destinationCity,
      area: route.destinationArea,
      subArea: route.destinationSubArea,
    });
    setDestinationSubAreaSuggestionPending(true);
    onSetPending(route.id, destinationAreaSuggestionPending, true);
  }

  const routeLocationLabel = [activeDestinationCity, activeDestinationArea].filter(Boolean).join(" / ") || "Unspecified";
  const pendingArea = pending?.area ?? destinationAreaSuggestionPending;
  const pendingSubArea = pending?.subArea ?? destinationSubAreaSuggestionPending;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Route {index + 1}</p>
          <p className="mt-1 text-xs text-slate-500">{routeLocationLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || index === 0}
            onClick={() => onMove(route.id, "up")}
          >
            Move up
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || index === count - 1}
            onClick={() => onMove(route.id, "down")}
          >
            Move down
          </button>
          <button
            type="button"
            className="rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || count === 1}
            onClick={() => onRemove(route.id)}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TypeaheadInput
          label="Destination City"
          placeholder={selectedCountry ? "Search destination city" : "Select country first"}
          value={route.destinationCity}
          disabled={disabled || !selectedCountry || !selectedAdminLevel1}
          options={destinationCityOptions}
          allowCustomValue
          autoSelectSingleMatchOnBlur={false}
          onQueryChange={setDestinationCityDraft}
          onSelect={(value) =>
            onSetRoute(route.id, {
              destinationCity: value,
              destinationArea: "",
              destinationSubArea: "",
            })
          }
        />
          {showDestinationCitySuggestButton ? (
            <button
              type="button"
              className="mt-1 text-xs font-medium text-[#033D89] hover:underline"
              onClick={suggestDestinationCity}
            >
            Suggest this city for review
            </button>
          ) : null}
        {destinationCitySuggestionPending ? (
          <p className="mt-1 text-xs text-amber-700">
            This destination city is awaiting review. You can submit the transfer, but admin cannot approve it until the city is reviewed.
          </p>
        ) : null}
        <div className="tm-field">
          <TypeaheadInput
            label="Destination Area"
            placeholder={
              !route.destinationCity
                ? "Select destination city first"
                : destinationAreaOptionsLoadFailed
                  ? "Catalog unavailable right now"
                  : destinationAreaOptionsLoaded
                    ? "Search or type area name"
                    : "Loading areas…"
            }
            value={route.destinationArea}
            disabled={disabled || !route.destinationCity}
            options={destinationAreaOptions}
            allowCustomValue
            onQueryChange={setDestinationAreaDraft}
            onSelect={(value) =>
              onSetRoute(route.id, {
                destinationArea: value,
                destinationSubArea: "",
              })
            }
          />
          {destinationAreaOptionsLoadFailed ? (
            <p className="mt-1 text-xs text-amber-700">
              We could not load destination areas right now. Validation will be retried when you save.
            </p>
          ) : null}
        {showDestinationAreaSuggestButton ? (
          <button
            type="button"
            className="mt-1 text-xs font-medium text-[#033D89] hover:underline"
            onClick={suggestDestinationArea}
          >
            Suggest &ldquo;{activeDestinationArea}&rdquo; as a new area
          </button>
        ) : null}
          {pendingArea ? (
            <p className="mt-1 text-xs text-amber-700">
              This destination area is awaiting review. You can submit the transfer, but admin cannot approve it until the area is reviewed.
            </p>
          ) : null}
        </div>
        <div className="tm-field">
          <TypeaheadInput
            label="Destination Sub-area (optional)"
            placeholder={
              !route.destinationArea
                ? "Select destination area first"
                : destinationSubAreaOptionsLoadFailed
                  ? "Catalog unavailable right now"
                  : destinationSubAreaOptionsLoaded
                    ? "Search or type sub-area name"
                    : "Loading sub-areas…"
            }
            value={route.destinationSubArea}
            disabled={disabled || !route.destinationArea}
            options={destinationSubAreaOptions}
            allowCustomValue
            onQueryChange={setDestinationSubAreaDraft}
            onSelect={(value) => onSetRoute(route.id, { destinationSubArea: value })}
          />
          {destinationSubAreaOptionsLoadFailed ? (
            <p className="mt-1 text-xs text-amber-700">
              We could not load destination sub-areas right now. Validation will be retried when you save.
            </p>
          ) : null}
          {showDestinationSubAreaSuggestButton ? (
            <button
              type="button"
              className="mt-1 text-xs font-medium text-[#033D89] hover:underline"
              onClick={suggestDestinationSubArea}
            >
              Suggest &ldquo;{activeDestinationSubArea}&rdquo; as a new sub-area
            </button>
          ) : null}
          {pendingSubArea ? (
            <p className="mt-1 text-xs text-amber-700">This destination sub-area is awaiting review.</p>
          ) : null}
        </div>
        <div className="tm-field">
          <span className="tm-field-label">Route Scope</span>
          <p className="tm-input text-sm">
            {selectedCountry && selectedAdminLevel1
              ? `${selectedAdminLevel1}, ${selectedCountry}`
              : "Select country and region first"}
          </p>
        </div>
      </div>
    </article>
  );
}

export function TransferDetailsForm({
  item,
  saving,
  canEditDetails,
  selectedFeatures,
  selectedCurrency,
  openTime,
  closeTime,
  selectedCountry,
  selectedAdminLevel1,
  selectedCity,
  selectedArea,
  availableRegions,
  selectedVehicleClass,
  vehicleClassOptions,
  cityOptions,
  knownVehicleClassValues,
  knownFeatureValues,
  selectedTransferType,
  destinationRoutes,
  destinationRouteNeedsReviewById,
  destinationRoutePendingById,
  destinationCityOptions,
  originAreaOptions,
  originAreaOptionsLoaded,
  originAreaOptionsLoadFailed,
  originAreaSuggestionPending,
  onSaveDetails,
  onToggleFeature,
  onSetCurrency,
  onSetOpenTime,
  onSetCloseTime,
  onSetCountry,
  onSetAdminLevel1,
  onSetCity,
  onSetArea,
  onSetVehicleClass,
  onSetTransferType,
  onAddDestinationRoute,
  onRemoveDestinationRoute,
  onMoveDestinationRoute,
  onSetDestinationRoute,
  onSetDestinationRouteNeedsReview,
  onSetDestinationRoutePending,
  onSuggestOriginArea,
}: Props) {
  const disabled = !canEditDetails || saving;
  const destinationLabel = selectedAdminLevel1 && selectedCountry ? `${selectedAdminLevel1}, ${selectedCountry}` : "the selected state/region";

  const showOriginSuggestButton =
    !disabled &&
    selectedArea &&
    (!originAreaOptionsLoaded ||
      !originAreaOptions.some((option) => option.toLowerCase() === selectedArea.trim().toLowerCase())) &&
    !originAreaSuggestionPending;

  const destinationSummary = useMemo(() => {
    if (destinationRoutes.length === 0) return "Add at least one destination route.";
    return destinationRoutes
      .map((route, index) => {
        const summary = [route.destinationCity, route.destinationArea].filter(Boolean).join(" / ") || "Unspecified";
        return `${index + 1}. ${summary}${route.destinationSubArea ? ` — ${route.destinationSubArea}` : ""}`;
      })
      .join(" • ");
  }, [destinationRoutes]);

  return (
    <form className="tm-panel p-6" onSubmit={onSaveDetails}>
      <h2 className="tm-section-title">Transfer Details</h2>
      {!canEditDetails ? (
        <p className="mt-2 text-sm text-amber-700">
          Editing is only available in draft or rejected status. Move this listing to draft before editing.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="tm-field">
          <span className="tm-field-label">Name</span>
          <input className="tm-input" name="name" defaultValue={item.name} disabled={disabled} placeholder="Transfer name" />
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Base Fare</span>
          <input className="tm-input" name="baseFare" defaultValue={item.baseFare} disabled={disabled} placeholder="Base fare" type="number" />
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Transfer Type</span>
          <select
            className="tm-input"
            name="transferType"
            value={selectedTransferType}
            disabled={disabled}
            onChange={(e) => onSetTransferType(e.target.value)}
          >
            <option value="">Select transfer type</option>
            <option value="one_way">One-way</option>
            <option value="return">Return</option>
            <option value="hourly">Hourly</option>
            <option value="airport">Airport transfer</option>
          </select>
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Pickup Point</span>
          <input className="tm-input" name="pickupPoint" defaultValue={item.pickupPoint} disabled={disabled} placeholder="Pickup point" />
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Vehicle Class</span>
          <select
            className="tm-input"
            name="vehicleClass"
            value={selectedVehicleClass}
            disabled={disabled}
            onChange={(e) => onSetVehicleClass(e.target.value)}
            required
          >
            <option value="" disabled>
              Select vehicle class
            </option>
            {selectedVehicleClass && !knownVehicleClassValues.has(selectedVehicleClass) ? (
              <option value={selectedVehicleClass}>{selectedVehicleClass.replace(/_/g, " ")}</option>
            ) : null}
            {vehicleClassOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <TypeaheadInput
          label="Country"
          placeholder="Search country"
          value={selectedCountry}
          disabled={disabled}
          options={[...operatingCountryOptions]}
          onSelect={onSetCountry}
        />
        <TypeaheadInput
          label="State / Region"
          placeholder="Search state or region"
          value={selectedAdminLevel1}
          disabled={disabled || !selectedCountry}
          options={availableRegions}
          onSelect={onSetAdminLevel1}
        />
        <div className="tm-field">
          <TypeaheadInput
            label="City"
            placeholder="Search city"
            value={selectedCity}
            disabled={disabled || !selectedAdminLevel1}
            options={cityOptions}
            onSelect={onSetCity}
          />
          <input type="hidden" name="city" value={selectedCity} />
          {item.cityReviewStatus === "pending" ? (
            <p className="mt-2 text-xs text-amber-700">
              This city is pending moderation review. You can submit this listing, but admin cannot approve it until city review is completed.
            </p>
          ) : null}
          {item.cityReviewStatus === "rejected" ? (
            <p className="mt-2 text-xs text-rose-700">
              This city was rejected during moderation. Select an approved city before submitting.
            </p>
          ) : null}
        </div>
        <div className="tm-field">
          <TypeaheadInput
            label="Area"
            placeholder={
              !selectedCity
                ? "Select city first"
                : originAreaOptionsLoadFailed
                ? "Catalog unavailable right now"
                : originAreaOptionsLoaded
                  ? "Search or type area name"
                  : "Loading areas…"
            }
            value={selectedArea}
            disabled={disabled}
            options={originAreaOptions}
            allowCustomValue
            onSelect={onSetArea}
          />
          {originAreaOptionsLoadFailed ? (
            <p className="mt-1 text-xs text-amber-700">
              We could not load catalog areas right now. You can keep editing, but catalog validation will be checked again on save.
            </p>
          ) : null}
          {showOriginSuggestButton ? (
            <button
              type="button"
              className="mt-1 text-xs font-medium text-[#033D89] hover:underline"
              onClick={onSuggestOriginArea}
            >
              Suggest &ldquo;{selectedArea}&rdquo; as a new area
            </button>
          ) : null}
          {originAreaSuggestionPending ? (
            <p className="mt-1 text-xs text-amber-700">
              This area is awaiting catalog approval. You cannot submit this listing until it is approved.
            </p>
          ) : null}
        </div>
        <div className="tm-field">
          <span className="tm-field-label">Coverage Area</span>
          <p className="tm-input">{selectedCity && selectedCountry ? `${selectedCity}, ${selectedCountry}` : "Select city and country"}</p>
        </div>
        <label className="tm-field">
          <span className="tm-field-label">Passenger Capacity</span>
          <input className="tm-input" name="passengerCapacity" defaultValue={item.passengerCapacity} disabled={disabled} placeholder="Passenger capacity" type="number" />
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Luggage Capacity</span>
          <input className="tm-input" name="luggageCapacity" defaultValue={item.luggageCapacity} disabled={disabled} placeholder="Luggage capacity" type="number" />
        </label>
        <div className="tm-field">
          <span className="tm-field-label">Operating Hours</span>
          <div className="mt-1 flex items-center gap-2">
            <select
              className="tm-input flex-1"
              value={openTime}
              disabled={disabled}
              onChange={(e) => onSetOpenTime(e.target.value)}
            >
              {openTime && !knownTimeValues.has(openTime) ? <option value={openTime}>{openTime}</option> : null}
              {stayTimeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="shrink-0 text-sm text-slate-500">to</span>
            <select
              className="tm-input flex-1"
              value={closeTime}
              disabled={disabled}
              onChange={(e) => onSetCloseTime(e.target.value)}
            >
              {closeTime && !knownTimeValues.has(closeTime) ? <option value={closeTime}>{closeTime}</option> : null}
              {stayTimeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="tm-field">
          <span className="tm-field-label">Currency</span>
          <select
            className="tm-input"
            value={selectedCurrency}
            disabled={disabled}
            onChange={(e) => onSetCurrency(e.target.value)}
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {!CURRENCY_OPTIONS.some((opt) => opt.value === selectedCurrency) ? (
              <option value={selectedCurrency}>{selectedCurrency}</option>
            ) : null}
          </select>
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Night Surcharge</span>
          <input className="tm-input" name="nightSurcharge" defaultValue={item.nightSurcharge} disabled={disabled} placeholder="Night surcharge" type="number" />
        </label>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Destination Routes</h3>
            <p className="mt-1 text-xs text-slate-500">
              Add one or more destination rows. Every route stays within {destinationLabel}.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-[#033D89] px-3 py-1.5 text-xs font-semibold text-[#033D89] hover:bg-[#033D89] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            onClick={onAddDestinationRoute}
          >
            Add route
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">{destinationSummary}</p>

        <div className="mt-4 space-y-4">
          {destinationRoutes.map((route, index) => (
            <DestinationRouteEditor
              key={route.id}
              userId={item.userId}
              route={route}
              index={index}
              count={destinationRoutes.length}
              disabled={disabled}
              selectedCountry={selectedCountry}
              selectedAdminLevel1={selectedAdminLevel1}
              cityOptions={destinationCityOptions}
              pending={destinationRoutePendingById[route.id]}
              needsReview={destinationRouteNeedsReviewById[route.id]}
              onRemove={onRemoveDestinationRoute}
              onMove={onMoveDestinationRoute}
              onSetRoute={onSetDestinationRoute}
              onSetNeedsReview={onSetDestinationRouteNeedsReview}
              onSetPending={onSetDestinationRoutePending}
            />
          ))}
        </div>
      </div>

      {selectedTransferType === "return" && destinationRoutes.length > 0 ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Return Route Summary</h3>
          <p className="mt-1 text-xs text-slate-500">
            Return transfers publish each destination route in both directions.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {destinationRoutes.map((route, index) => (
              <li key={route.id} className="rounded-md bg-white px-3 py-2">
                <span className="mr-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                  {index + 1}
                </span>
                {selectedCity}
                {selectedArea ? ` (${selectedArea})` : ""}
                {" → "}
                {[route.destinationCity, route.destinationArea].filter(Boolean).join(" / ") || "Unspecified"}
                {route.destinationSubArea ? ` — ${route.destinationSubArea}` : ""}
                {" → "}
                {selectedCity}
                {selectedArea ? ` (${selectedArea})` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="tm-field mt-3 block">
        <span className="tm-field-label">Description</span>
        <textarea className="tm-input min-h-24" name="description" defaultValue={item.description} disabled={disabled} placeholder="Description" />
      </label>
      <div className="tm-field mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <span className="tm-field-label">Cancellation Policy</span>
        <p className="tm-muted mt-1 text-sm">
          Cancellation terms are generated from your transfer pricing choices:
          <span className="font-medium text-slate-800"> Non-cancellable</span> and
          <span className="font-medium text-slate-800"> Free cancellation</span>.
        </p>
      </div>

      <div className="tm-field mt-3">
        <span className="tm-field-label">Features</span>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TRANSFER_FEATURE_OPTIONS.map((opt) => (
            <label key={opt.value} className="tm-tag-pill flex items-center gap-2">
              <input
                checked={selectedFeatures.includes(opt.value)}
                disabled={disabled}
                onChange={() => onToggleFeature(opt.value)}
                type="checkbox"
              />
              {opt.label}
            </label>
          ))}
          {selectedFeatures
            .filter((value) => !knownFeatureValues.has(value))
            .map((value) => (
              <label key={value} className="tm-tag-pill flex items-center gap-2">
                <input checked disabled={disabled} onChange={() => onToggleFeature(value)} type="checkbox" />
                {value}
              </label>
            ))}
        </div>
      </div>

      <div className="mt-4">
        <button className="tm-btn tm-btn-primary" disabled={saving || !canEditDetails} type="submit">
          {saving ? "Saving..." : "Save Details"}
        </button>
      </div>
    </form>
  );
}
