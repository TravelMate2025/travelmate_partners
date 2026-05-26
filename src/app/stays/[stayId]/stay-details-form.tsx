"use client";

import { FormEvent } from "react";

import { TypeaheadInput } from "@/components/common/typeahead-input";
import { operatingCountryOptions } from "@/modules/profile/location-options";
import { getSaleModeContent } from "@/modules/stays/property-type-options";
import { stayTimeOptions } from "@/modules/stays/time-options";
import type { StayListing } from "@/modules/stays/contracts";
import { knownTimeValues } from "./use-stay-detail";

type Props = {
  stay: StayListing;
  saving: boolean;
  canEditDetails: boolean;
  selectedAmenities: string[];
  selectedPropertyType: string;
  selectedCountry: string;
  selectedAdminLevel1: string;
  selectedCity: string;
  selectedArea: string;
  citySearch: string;
  availableRegions: string[];
  propertyTypeOptions: Array<{ value: string; label: string }>;
  amenityOptions: Array<{ value: string; label: string }>;
  filteredCities: string[];
  knownPropertyTypeValues: Set<string>;
  knownAmenityValues: Set<string>;
  onSaveDetails: (event: FormEvent<HTMLFormElement>) => void;
  onRefresh: () => void;
  onToggleAmenity: (value: string) => void;
  onSetPropertyType: (v: string) => void;
  onSetCountry: (v: string) => void;
  onSetAdminLevel1: (v: string) => void;
  onSetCity: (v: string) => void;
  onSetArea: (v: string) => void;
  onSetCitySearch: (v: string) => void;
};

export function StayDetailsForm({
  stay,
  saving,
  canEditDetails,
  selectedAmenities,
  selectedPropertyType,
  selectedCountry,
  selectedAdminLevel1,
  selectedCity,
  selectedArea,
  citySearch,
  availableRegions,
  propertyTypeOptions,
  amenityOptions,
  filteredCities,
  knownPropertyTypeValues,
  knownAmenityValues,
  onSaveDetails,
  onRefresh,
  onToggleAmenity,
  onSetPropertyType,
  onSetCountry,
  onSetAdminLevel1,
  onSetCity,
  onSetArea,
  onSetCitySearch,
}: Props) {
  const disabled = !canEditDetails || saving;
  const saleModeContent = getSaleModeContent(selectedPropertyType || stay.propertyType);

  return (
    <form className="tm-panel p-6" onSubmit={onSaveDetails}>
      <h2 className="tm-section-title">Property Details</h2>
      <div className="tm-field-grid mt-4">
        <label className="tm-field">
          <span className="tm-field-label">Property Type</span>
          <select
            className="tm-input"
            name="propertyType"
            value={selectedPropertyType}
            onChange={(e) => onSetPropertyType(e.target.value)}
            disabled={disabled}
            required
          >
            <option value="" disabled>Select property type</option>
            {selectedPropertyType && !knownPropertyTypeValues.has(selectedPropertyType) ? (
              <option value={selectedPropertyType}>{selectedPropertyType.replace(/_/g, " ")}</option>
            ) : null}
            {propertyTypeOptions.map((pt) => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
          <div className="tm-note mt-2 text-xs">
            <p className="font-semibold text-slate-800">{saleModeContent.title}</p>
            <p className="text-slate-600">{saleModeContent.summary}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600">
              {saleModeContent.implications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Stay Name</span>
          <input className="tm-input" name="name" defaultValue={stay.name} disabled={disabled} placeholder="Stay name" />
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Description</span>
          <textarea className="tm-input min-h-28" name="description" defaultValue={stay.description} disabled={disabled} placeholder="Description" />
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Address</span>
          <input className="tm-input" name="address" defaultValue={stay.address} disabled={disabled} placeholder="Address" />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
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
            {stay.cityReviewStatus === "pending" ? (
              <p className="mt-2 text-xs text-amber-700">
                This city is pending moderation review. You can submit this listing, but admin cannot approve it until city review is completed.
              </p>
            ) : null}
            {stay.cityReviewStatus === "rejected" ? (
              <p className="mt-2 text-xs text-rose-700">
                This city was rejected during moderation. Select an approved city before submitting.
              </p>
            ) : null}
          </label>
          <TypeaheadInput
            label="Country"
            placeholder="Search country"
            value={selectedCountry}
            disabled={disabled}
            options={[...operatingCountryOptions]}
            onSelect={onSetCountry}
          />
          <label className="tm-field">
            <span className="tm-field-label">Area</span>
            <input className="tm-input" name="area" value={selectedArea} disabled={disabled} onChange={(e) => onSetArea(e.target.value)} required />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="tm-field">
            <span className="tm-field-label">Latitude</span>
            <input className="tm-input" name="latitude" defaultValue={stay.latitude ?? ""} disabled={disabled} placeholder="Latitude (optional)" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Longitude</span>
            <input className="tm-input" name="longitude" defaultValue={stay.longitude ?? ""} disabled={disabled} placeholder="Longitude (optional)" />
          </label>
        </div>
        <label className="tm-field">
          <span className="tm-field-label">Amenities</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {amenityOptions.map((amenity) => (
              <label key={amenity.value} className="tm-tag-pill flex items-center gap-2">
                <input
                  checked={selectedAmenities.includes(amenity.value)}
                  disabled={disabled}
                  onChange={() => onToggleAmenity(amenity.value)}
                  type="checkbox"
                />
                {amenity.label}
              </label>
            ))}
            {selectedAmenities
              .filter((value) => !knownAmenityValues.has(value))
              .map((value) => (
                <label key={value} className="tm-tag-pill flex items-center gap-2">
                  <input checked disabled={disabled} onChange={() => onToggleAmenity(value)} type="checkbox" />
                  {value.replace(/_/g, " ")}
                </label>
              ))}
          </div>
        </label>
        <label className="tm-field">
          <span className="tm-field-label">House Rules</span>
          <textarea className="tm-input min-h-20" name="houseRules" defaultValue={stay.houseRules} disabled={disabled} placeholder="House rules" />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="tm-field">
            <span className="tm-field-label">Check-in Time</span>
            <select className="tm-input" name="checkInTime" defaultValue={stay.checkInTime || ""} disabled={disabled}>
              <option value="">Select check-in time</option>
              {stay.checkInTime && !knownTimeValues.has(stay.checkInTime) ? (
                <option value={stay.checkInTime}>{stay.checkInTime}</option>
              ) : null}
              {stayTimeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Check-out Time</span>
            <select className="tm-input" name="checkOutTime" defaultValue={stay.checkOutTime || ""} disabled={disabled}>
              <option value="">Select check-out time</option>
              {stay.checkOutTime && !knownTimeValues.has(stay.checkOutTime) ? (
                <option value={stay.checkOutTime}>{stay.checkOutTime}</option>
              ) : null}
              {stayTimeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="tm-field rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="tm-field-label">Cancellation Policy</span>
          <p className="tm-muted mt-1 text-sm">
            Cancellation terms are generated from your pricing choices:
            <span className="font-medium text-slate-800"> Non-cancellable</span> and
            <span className="font-medium text-slate-800"> Free cancellation</span>.
          </p>
        </div>
      </div>
      <div className="tm-inline-actions mt-4">
        <button className="tm-btn tm-btn-primary" disabled={saving || !canEditDetails} type="submit">
          {saving ? "Saving..." : "Save Details"}
        </button>
        <button className="tm-btn tm-btn-outline" disabled={saving} onClick={() => void onRefresh()} type="button">
          Reload
        </button>
      </div>
    </form>
  );
}
