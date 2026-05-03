"use client";

import { FormEvent } from "react";

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
  selectedCity: string;
  citySearch: string;
  selectedVehicleClass: string;
  vehicleClassOptions: Array<{ value: string; label: string }>;
  filteredCities: string[];
  knownVehicleClassValues: Set<string>;
  knownFeatureValues: Set<string>;
  onSaveDetails: (event: FormEvent<HTMLFormElement>) => void;
  onToggleFeature: (value: string) => void;
  onSetCurrency: (v: string) => void;
  onSetOpenTime: (v: string) => void;
  onSetCloseTime: (v: string) => void;
  onSetCountry: (v: string) => void;
  onSetCity: (v: string) => void;
  onSetCitySearch: (v: string) => void;
  onSetVehicleClass: (v: string) => void;
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
  selectedCity,
  citySearch,
  selectedVehicleClass,
  vehicleClassOptions,
  filteredCities,
  knownVehicleClassValues,
  knownFeatureValues,
  onSaveDetails,
  onToggleFeature,
  onSetCurrency,
  onSetOpenTime,
  onSetCloseTime,
  onSetCountry,
  onSetCity,
  onSetCitySearch,
  onSetVehicleClass,
}: Props) {
  const disabled = !canEditDetails || saving;

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
          <select className="tm-input" name="transferType" defaultValue={item.transferType || ""} disabled={disabled}>
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
        <label className="tm-field">
          <span className="tm-field-label">Country</span>
          <select
            className="tm-input"
            name="country"
            value={selectedCountry}
            disabled={disabled}
            onChange={(e) => {
              onSetCountry(e.target.value);
              onSetCity("");
              onSetCitySearch("");
            }}
            required
          >
            <option value="" disabled>Select country</option>
            {operatingCountryOptions.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>
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
        </label>
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

      <label className="tm-field mt-3 block">
        <span className="tm-field-label">Description</span>
        <textarea className="tm-input min-h-24" name="description" defaultValue={item.description} disabled={disabled} placeholder="Description" />
      </label>
      <label className="tm-field mt-3 block">
        <span className="tm-field-label">Cancellation Policy</span>
        <textarea
          className="tm-input min-h-20"
          name="cancellationPolicy"
          defaultValue={item.cancellationPolicy}
          disabled={disabled}
          placeholder="Describe your cancellation terms (e.g. free cancellation up to 24 hours before pickup)"
        />
      </label>

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
