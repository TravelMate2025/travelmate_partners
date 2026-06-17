"use client";

import { FormEvent } from "react";

import { TypeaheadInput } from "@/components/common/typeahead-input";
import { operatingCountryOptions } from "@/modules/profile/location-options";
import { stayTimeOptions } from "@/modules/stays/time-options";
import type { TransferListing } from "@/modules/transfers/contracts";
import {
  CURRENCY_OPTIONS,
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
  citySearch: string;
  availableRegions: string[];
  selectedVehicleClass: string;
  vehicleClassOptions: Array<{ value: string; label: string }>;
  filteredCities: string[];
  knownVehicleClassValues: Set<string>;
  knownFeatureValues: Set<string>;
  selectedTransferType: string;
  selectedDestinationCity: string;
  selectedDestinationArea: string;
  selectedDestinationSubArea: string;
  destinationCityOptions: string[];
  originAreaOptions: string[];
  originAreaOptionsLoaded: boolean;
  destinationAreaOptions: string[];
  destinationAreaOptionsLoaded: boolean;
  destinationSubAreaOptions: string[];
  destinationSubAreaOptionsLoaded: boolean;
  originAreaSuggestionPending: boolean;
  destinationAreaSuggestionPending: boolean;
  destinationSubAreaSuggestionPending: boolean;
  onSaveDetails: (event: FormEvent<HTMLFormElement>) => void;
  onToggleFeature: (value: string) => void;
  onSetCurrency: (v: string) => void;
  onSetOpenTime: (v: string) => void;
  onSetCloseTime: (v: string) => void;
  onSetCountry: (v: string) => void;
  onSetAdminLevel1: (v: string) => void;
  onSetCity: (v: string) => void;
  onSetArea: (v: string) => void;
  onSetCitySearch: (v: string) => void;
  onSetVehicleClass: (v: string) => void;
  onSetTransferType: (v: string) => void;
  onSetDestinationCity: (v: string) => void;
  onSetDestinationArea: (v: string) => void;
  onSetDestinationSubArea: (v: string) => void;
  onSuggestOriginArea: () => void;
  onSuggestDestinationArea: () => void;
  onSuggestDestinationSubArea: () => void;
};

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
  citySearch,
  availableRegions,
  selectedVehicleClass,
  vehicleClassOptions,
  filteredCities,
  knownVehicleClassValues,
  knownFeatureValues,
  selectedTransferType,
  selectedDestinationCity,
  selectedDestinationArea,
  selectedDestinationSubArea,
  destinationCityOptions,
  originAreaOptions,
  originAreaOptionsLoaded,
  destinationAreaOptions,
  destinationAreaOptionsLoaded,
  destinationSubAreaOptions,
  destinationSubAreaOptionsLoaded,
  originAreaSuggestionPending,
  destinationAreaSuggestionPending,
  destinationSubAreaSuggestionPending,
  onSaveDetails,
  onToggleFeature,
  onSetCurrency,
  onSetOpenTime,
  onSetCloseTime,
  onSetCountry,
  onSetAdminLevel1,
  onSetCity,
  onSetArea,
  onSetCitySearch,
  onSetVehicleClass,
  onSetTransferType,
  onSetDestinationCity,
  onSetDestinationArea,
  onSetDestinationSubArea,
  onSuggestOriginArea,
  onSuggestDestinationArea,
  onSuggestDestinationSubArea,
}: Props) {
  const disabled = !canEditDetails || saving;

  const showOriginSuggestButton =
    !disabled &&
    originAreaOptionsLoaded &&
    selectedArea &&
    !originAreaOptions.includes(selectedArea) &&
    !originAreaSuggestionPending;

  const showDestinationAreaSuggestButton =
    !disabled &&
    destinationAreaOptionsLoaded &&
    selectedDestinationArea &&
    !destinationAreaOptions.includes(selectedDestinationArea) &&
    !destinationAreaSuggestionPending;

  const showDestinationSubAreaSuggestButton =
    !disabled &&
    destinationSubAreaOptionsLoaded &&
    selectedDestinationSubArea &&
    !destinationSubAreaOptions.includes(selectedDestinationSubArea) &&
    !destinationSubAreaSuggestionPending;

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
          <span className="tm-field-label">Dropoff Point</span>
          <input className="tm-input" name="dropoffPoint" defaultValue={item.dropoffPoint} disabled={disabled} placeholder="Dropoff point" />
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
            <option value="" disabled>Select vehicle class</option>
            {selectedVehicleClass && !knownVehicleClassValues.has(selectedVehicleClass) ? (
              <option value={selectedVehicleClass}>{selectedVehicleClass.replace(/_/g, " ")}</option>
            ) : null}
            {vehicleClassOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
        <label className="tm-field">
          <span className="tm-field-label">City</span>
          <input
            className="tm-input mb-2"
            placeholder="Search city"
            value={citySearch}
            disabled={disabled}
            onChange={(e) => onSetCitySearch(e.target.value)}
          />
          <select
            className="tm-input"
            name="city"
            value={selectedCity}
            disabled={disabled}
            onChange={(e) => onSetCity(e.target.value)}
            required
          >
            <option value="" disabled>Select city</option>
            {filteredCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
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
        </label>
        <div className="tm-field">
          <TypeaheadInput
            label="Area"
            placeholder={originAreaOptionsLoaded ? "Search or type area name" : "Loading areas…"}
            value={selectedArea}
            disabled={disabled}
            options={originAreaOptions}
            allowCustomValue
            onSelect={onSetArea}
          />
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
              {openTime && !knownTimeValues.has(openTime) ? (
                <option value={openTime}>{openTime}</option>
              ) : null}
              {stayTimeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="shrink-0 text-sm text-slate-500">to</span>
            <select
              className="tm-input flex-1"
              value={closeTime}
              disabled={disabled}
              onChange={(e) => onSetCloseTime(e.target.value)}
            >
              {closeTime && !knownTimeValues.has(closeTime) ? (
                <option value={closeTime}>{closeTime}</option>
              ) : null}
              {stayTimeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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

      {/* Destination Section */}
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-semibold text-slate-800">Destination Route</h3>
        <p className="mt-1 text-xs text-slate-500">
          Set the destination for this transfer. Required for submission.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <TypeaheadInput
            label="Destination City"
            placeholder={selectedCountry ? "Search destination city" : "Select country first"}
            value={selectedDestinationCity}
            disabled={disabled || !selectedCountry}
            options={destinationCityOptions}
            onSelect={onSetDestinationCity}
          />
          <div className="tm-field">
            <TypeaheadInput
              label="Destination Area"
              placeholder={
                !selectedDestinationCity
                  ? "Select destination city first"
                  : destinationAreaOptionsLoaded
                    ? "Search or type area name"
                    : "Loading areas…"
              }
              value={selectedDestinationArea}
              disabled={disabled || !selectedDestinationCity}
              options={destinationAreaOptions}
              allowCustomValue
              onSelect={onSetDestinationArea}
            />
            {showDestinationAreaSuggestButton ? (
              <button
                type="button"
                className="mt-1 text-xs font-medium text-[#033D89] hover:underline"
                onClick={onSuggestDestinationArea}
              >
                Suggest &ldquo;{selectedDestinationArea}&rdquo; as a new area
              </button>
            ) : null}
            {destinationAreaSuggestionPending ? (
              <p className="mt-1 text-xs text-amber-700">
                This destination area is awaiting catalog approval. You cannot submit this listing until it is approved.
              </p>
            ) : null}
          </div>
          <div className="tm-field">
            <TypeaheadInput
              label="Destination Sub-area (optional)"
              placeholder={
                !selectedDestinationArea
                  ? "Select destination area first"
                  : destinationSubAreaOptionsLoaded
                    ? "Search or type sub-area name"
                    : "Loading sub-areas…"
              }
              value={selectedDestinationSubArea}
              disabled={disabled || !selectedDestinationArea}
              options={destinationSubAreaOptions}
              allowCustomValue
              onSelect={onSetDestinationSubArea}
            />
            {showDestinationSubAreaSuggestButton ? (
              <button
                type="button"
                className="mt-1 text-xs font-medium text-[#033D89] hover:underline"
                onClick={onSuggestDestinationSubArea}
              >
                Suggest &ldquo;{selectedDestinationSubArea}&rdquo; as a new sub-area
              </button>
            ) : null}
            {destinationSubAreaSuggestionPending ? (
              <p className="mt-1 text-xs text-amber-700">
                This sub-area is awaiting catalog approval.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Route Summary Card — shown only for return transfers */}
      {selectedTransferType === "return" && selectedCity && selectedDestinationCity ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Route Summary</h3>
          <p className="mt-1 text-xs text-slate-500">Both directions are published for return transfers.</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">A → B</span>
              <span>
                {selectedCity}{selectedArea ? ` (${selectedArea})` : ""}
                {" → "}
                {selectedDestinationCity}{selectedDestinationArea ? ` (${selectedDestinationArea})` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">B → A</span>
              <span>
                {selectedDestinationCity}{selectedDestinationArea ? ` (${selectedDestinationArea})` : ""}
                {" → "}
                {selectedCity}{selectedArea ? ` (${selectedArea})` : ""}
              </span>
            </div>
          </div>
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
