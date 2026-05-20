"use client";

import { useEffect, useMemo, useState } from "react";

import { InfoHint } from "@/components/common/info-hint";
import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import { formatDateTimeUTC } from "@/lib/format";
import { pricingAvailabilityClient } from "@/modules/pricing-availability/pricing-availability-client";
import type {
  StayRatePlan,
  StayPricingAvailability,
  UpsertSeasonalOverrideInput,
} from "@/modules/pricing-availability/contracts";
import { staysClient } from "@/modules/stays/stays-client";
import type { StayListing } from "@/modules/stays/contracts";

const CURRENCY_OPTIONS = [
  "NGN",
  "USD",
  "GBP",
];

function formatNumber(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

export default function PricingAvailabilityPage() {
  const { user, loading } = usePartnerAccess();
  const [stays, setStays] = useState<StayListing[]>([]);
  const [selectedStayId, setSelectedStayId] = useState("");
  const [pricing, setPricing] = useState<StayPricingAvailability | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);

  const [baseRate, setBaseRate] = useState("0");
  const [currency, setCurrency] = useState("NGN");
  const [weekdayRate, setWeekdayRate] = useState("0");
  const [weekendRate, setWeekendRate] = useState("0");
  const [minStayNights, setMinStayNights] = useState("1");
  const [maxStayNights, setMaxStayNights] = useState("30");
  const [seasonalOverrides, setSeasonalOverrides] = useState<UpsertSeasonalOverrideInput[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [blackoutDateInput, setBlackoutDateInput] = useState("");
  const [ratePlans, setRatePlans] = useState<StayRatePlan[]>([]);

  const selectedStay = useMemo(
    () => stays.find((item) => item.id === selectedStayId) ?? null,
    [selectedStayId, stays],
  );
  const currencyOptions = useMemo(() => {
    const normalized = (currency ?? "").trim().toUpperCase();
    if (!normalized || CURRENCY_OPTIONS.includes(normalized)) {
      return CURRENCY_OPTIONS;
    }

    return [normalized, ...CURRENCY_OPTIONS];
  }, [currency]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    staysClient
      .listStays(user.id)
      .then(async (items) => {
        if (!active) {
          return;
        }

        setStays(items);
        const fallbackStayId = items[0]?.id ?? "";
        setSelectedStayId((current) => current || fallbackStayId);
      })
      .catch((error) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Failed to load stays.");
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !selectedStayId) {
      return;
    }

    let active = true;
    setBusy(true);
    setMessage("");

    pricingAvailabilityClient
      .getPricing(user.id, selectedStayId)
      .then((item) => {
        if (!active) {
          return;
        }
        setPricing(item);
        setCurrency((item.currency ?? "NGN").toUpperCase());
        setBaseRate(formatNumber(item.baseRate));
        setWeekdayRate(formatNumber(item.weekdayRate));
        setWeekendRate(formatNumber(item.weekendRate));
        setMinStayNights(formatNumber(item.minStayNights));
        setMaxStayNights(formatNumber(item.maxStayNights));
        setSeasonalOverrides(
          item.seasonalOverrides.map((override) => ({
            id: override.id,
            startDate: override.startDate,
            endDate: override.endDate,
            rate: override.rate,
          })),
        );
        setBlackoutDates(item.blackoutDates);
        setRatePlans(item.ratePlans ?? []);
        setBlackoutDateInput("");
      })
      .catch((error) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Failed to load pricing data.");
        }
      })
      .finally(() => {
        if (active) {
          setBusy(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user, selectedStayId]);

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  function addSeasonOverride() {
    setSeasonalOverrides((prev) => [
      ...prev,
      {
        startDate: "",
        endDate: "",
        rate: 0,
      },
    ]);
  }

  function updateOverride(
    index: number,
    patch: Partial<UpsertSeasonalOverrideInput>,
  ) {
    setSeasonalOverrides((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  }

  function removeOverride(index: number) {
    setSeasonalOverrides((prev) => prev.filter((_, current) => current !== index));
  }

  function addBlackoutDate() {
    if (!blackoutDateInput) {
      return;
    }

    setBlackoutDates((prev) => {
      if (prev.includes(blackoutDateInput)) {
        return prev;
      }
      return [...prev, blackoutDateInput].sort();
    });
    setBlackoutDateInput("");
  }

  function removeBlackoutDate(date: string) {
    setBlackoutDates((prev) => prev.filter((item) => item !== date));
  }

  function addRatePlan() {
    setRatePlans((prev) => [
      ...prev,
      {
        code: "",
        name: "",
        roomId: selectedStay?.saleMode === "room_level" ? selectedStay.rooms[0]?.id ?? null : null,
        planType: "refundable",
        isActive: true,
        nightlyRate: Number(baseRate) || 0,
        policyVersion: 1,
        startsOn: null,
        endsOn: null,
        cancellationPolicy: {
          policyType: "free_cancellation_until",
          penaltyType: "none",
          cancelDeadlineHoursBeforeCheckIn: 48,
          penaltyPercent: null,
          penaltyAmount: null,
        },
      },
    ]);
  }

  function updateRatePlan(index: number, patch: Partial<StayRatePlan>) {
    setRatePlans((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  }

  function updateRatePlanPolicy(index: number, patch: Partial<StayRatePlan["cancellationPolicy"]>) {
    setRatePlans((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        cancellationPolicy: {
          ...copy[index].cancellationPolicy,
          ...patch,
        },
      };
      return copy;
    });
  }

  function removeRatePlan(index: number) {
    setRatePlans((prev) => prev.filter((_, current) => current !== index));
  }

  async function savePricing() {
    if (!user || !selectedStayId) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const saved = await pricingAvailabilityClient.upsertPricing(user.id, selectedStayId, {
        currency: currency.trim().toUpperCase(),
        baseRate: Number(baseRate),
        weekdayRate: Number(weekdayRate),
        weekendRate: Number(weekendRate),
        minStayNights: Number(minStayNights),
        maxStayNights: Number(maxStayNights),
        seasonalOverrides: seasonalOverrides.map((item) => ({
          ...item,
          rate: Number(item.rate),
        })),
        blackoutDates,
        ratePlans,
      });

      setPricing(saved);
      setMessage("Pricing and availability saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save pricing and availability.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PartnerShell
      title="Pricing & Availability"
      description="Set base rates, seasonal date overrides, and booking blackout controls."
      headerExtra={
        pricing ? (
          <p className="tm-muted text-sm">Last updated: {formatDateTimeUTC(pricing.updatedAt)}</p>
        ) : null
      }
    >
      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Stay Selection</h2>
        <p className="tm-muted mt-1 text-sm">Choose the stay listing to configure downstream availability data.</p>
        <div className="mt-4 max-w-md">
          <select
            className="tm-input"
            value={selectedStayId}
            onChange={(event) => setSelectedStayId(event.target.value)}
          >
            <option value="">Select stay</option>
            {stays.map((stay) => (
              <option key={stay.id} value={stay.id}>
                {stay.name || "Untitled stay"} ({stay.city})
              </option>
            ))}
          </select>
        </div>
      </section>

      {selectedStay ? (
        <section className="tm-panel p-6">
          <h2 className="tm-section-title">Pricing Rules</h2>
          <p className="tm-muted mt-1 text-sm">
            Configuring: <span className="font-semibold text-slate-900">{selectedStay.name || selectedStay.id}</span>
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="tm-field">
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Currency</span>
                <InfoHint text="The currency guests will see for all stay rates." />
              </span>
              <select
                className="tm-input"
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              >
                {currencyOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>

            <label className="tm-field">
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Base Rate</span>
                <InfoHint text="Default nightly amount used before weekday, weekend, and seasonal adjustments." />
              </span>
              <input
                className="tm-input"
                type="number"
                value={baseRate}
                onChange={(event) => setBaseRate(event.target.value)}
              />
            </label>

            <label className="tm-field">
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Weekday Rate</span>
                <InfoHint text="Nightly price applied on Monday to Thursday when no override exists." />
              </span>
              <input
                className="tm-input"
                type="number"
                value={weekdayRate}
                onChange={(event) => setWeekdayRate(event.target.value)}
              />
            </label>

            <label className="tm-field">
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Weekend Rate</span>
                <InfoHint text="Nightly price used for weekend bookings when no seasonal override applies." />
              </span>
              <input
                className="tm-input"
                type="number"
                value={weekendRate}
                onChange={(event) => setWeekendRate(event.target.value)}
              />
            </label>

            <label className="tm-field">
              <span className="mb-1 block text-sm font-medium text-slate-700">Minimum Stay Nights</span>
              <input
                className="tm-input"
                type="number"
                value={minStayNights}
                onChange={(event) => setMinStayNights(event.target.value)}
              />
            </label>

            <label className="tm-field">
              <span className="mb-1 block text-sm font-medium text-slate-700">Maximum Stay Nights</span>
              <input
                className="tm-input"
                type="number"
                value={maxStayNights}
                onChange={(event) => setMaxStayNights(event.target.value)}
              />
            </label>
          </div>

          <section className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                Seasonal Overrides
                <InfoHint text="Set special rates for specific date ranges. These rates override weekday and weekend defaults." />
              </h3>
              <button className="tm-btn tm-btn-outline" type="button" onClick={addSeasonOverride}>
                Add Override
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {seasonalOverrides.map((item, index) => (
                <div key={`${item.id ?? "new"}-${index}`} className="tm-list-card">
                  <div className="grid gap-3 md:grid-cols-4">
                    <input
                      className="tm-input"
                      type="date"
                      value={item.startDate}
                      onChange={(event) => updateOverride(index, { startDate: event.target.value })}
                    />
                    <input
                      className="tm-input"
                      type="date"
                      value={item.endDate}
                      onChange={(event) => updateOverride(index, { endDate: event.target.value })}
                    />
                    <input
                      className="tm-input"
                      type="number"
                      value={formatNumber(Number(item.rate))}
                      onChange={(event) => updateOverride(index, { rate: Number(event.target.value) })}
                      placeholder="Override rate"
                    />
                    <button className="tm-btn tm-btn-outline" type="button" onClick={() => removeOverride(index)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {seasonalOverrides.length === 0 ? (
                <p className="tm-muted text-sm">No seasonal overrides set.</p>
              ) : null}
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                Stay Rate Plans
                <InfoHint text="Create refundable and non-refundable plans with explicit cancellation penalties." />
              </h3>
              <button className="tm-btn tm-btn-outline" type="button" onClick={addRatePlan}>
                Add Rate Plan
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {ratePlans.map((plan, index) => (
                <div key={`${plan.id ?? "new"}-${index}`} className="tm-list-card">
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      className="tm-input"
                      placeholder="Code (e.g. flex_48)"
                      value={plan.code}
                      onChange={(event) => updateRatePlan(index, { code: event.target.value })}
                    />
                    <input
                      className="tm-input"
                      placeholder="Display name"
                      value={plan.name}
                      onChange={(event) => updateRatePlan(index, { name: event.target.value })}
                    />
                    <select
                      className="tm-input"
                      value={plan.planType}
                      onChange={(event) => {
                        const nextPlanType = event.target.value as StayRatePlan["planType"];
                        updateRatePlan(index, { planType: nextPlanType });
                        if (nextPlanType === "non_refundable") {
                          updateRatePlanPolicy(index, {
                            policyType: "non_refundable",
                            penaltyType: "full_charge",
                            cancelDeadlineHoursBeforeCheckIn: null,
                          });
                        }
                      }}
                    >
                      <option value="refundable">Refundable</option>
                      <option value="non_refundable">Non-refundable</option>
                    </select>
                    {selectedStay?.saleMode === "room_level" ? (
                      <select
                        className="tm-input"
                        value={plan.roomId ?? ""}
                        onChange={(event) => updateRatePlan(index, { roomId: event.target.value || null })}
                      >
                        <option value="">Select room</option>
                        {selectedStay.rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <input
                      className="tm-input"
                      type="number"
                      placeholder="Nightly rate"
                      value={formatNumber(plan.nightlyRate)}
                      onChange={(event) => updateRatePlan(index, { nightlyRate: Number(event.target.value) })}
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        checked={plan.isActive}
                        onChange={(event) => updateRatePlan(index, { isActive: event.target.checked })}
                        type="checkbox"
                      />
                      Active
                    </label>
                    <select
                      className="tm-input"
                      value={plan.cancellationPolicy.policyType}
                      onChange={(event) =>
                        updateRatePlanPolicy(index, {
                          policyType: event.target.value as StayRatePlan["cancellationPolicy"]["policyType"],
                        })
                      }
                    >
                      <option value="non_refundable">Non-refundable</option>
                      <option value="free_cancellation_until">Free cancellation until cutoff</option>
                      <option value="partial_refund">Partial refund</option>
                    </select>
                    <select
                      className="tm-input"
                      value={plan.cancellationPolicy.penaltyType}
                      onChange={(event) =>
                        updateRatePlanPolicy(index, {
                          penaltyType: event.target.value as StayRatePlan["cancellationPolicy"]["penaltyType"],
                        })
                      }
                    >
                      <option value="none">None</option>
                      <option value="full_charge">Full charge</option>
                      <option value="percent">Percent</option>
                      <option value="amount">Amount</option>
                    </select>
                    <input
                      className="tm-input"
                      type="number"
                      placeholder="Cancel deadline (hours before check-in)"
                      value={plan.cancellationPolicy.cancelDeadlineHoursBeforeCheckIn ?? ""}
                      onChange={(event) =>
                        updateRatePlanPolicy(index, {
                          cancelDeadlineHoursBeforeCheckIn: event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                    />
                    <input
                      className="tm-input"
                      type="number"
                      placeholder="Penalty percent"
                      value={plan.cancellationPolicy.penaltyPercent ?? ""}
                      onChange={(event) =>
                        updateRatePlanPolicy(index, {
                          penaltyPercent: event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                    />
                    <input
                      className="tm-input"
                      type="number"
                      placeholder="Penalty amount"
                      value={plan.cancellationPolicy.penaltyAmount ?? ""}
                      onChange={(event) =>
                        updateRatePlanPolicy(index, {
                          penaltyAmount: event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                    />
                    <button className="tm-btn tm-btn-outline" type="button" onClick={() => removeRatePlan(index)}>
                      Remove Plan
                    </button>
                  </div>
                </div>
              ))}
              {ratePlans.length === 0 ? (
                <p className="tm-muted text-sm">No rate plans yet. Add at least one active plan.</p>
              ) : null}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              Blackout Dates
              <InfoHint text="Dates when bookings are blocked entirely for this stay." />
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                className="tm-input max-w-xs"
                type="date"
                value={blackoutDateInput}
                onChange={(event) => setBlackoutDateInput(event.target.value)}
              />
              <button className="tm-btn tm-btn-outline" onClick={addBlackoutDate} type="button">
                Add Date
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {blackoutDates.map((date) => (
                <button
                  key={date}
                  className="tm-tag-pill"
                  onClick={() => removeBlackoutDate(date)}
                  type="button"
                >
                  {date} ×
                </button>
              ))}
              {blackoutDates.length === 0 ? (
                <p className="tm-muted text-sm">No blackout dates added.</p>
              ) : null}
            </div>
          </section>

          <div className="mt-6 flex gap-2">
            <button className="tm-btn tm-btn-primary" type="button" onClick={() => void savePricing()} disabled={busy}>
              {busy ? "Saving..." : "Save Pricing & Availability"}
            </button>
          </div>

          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
        </section>
      ) : (
        <section className="tm-panel p-6">
          <p className="tm-muted text-sm">
            No stays found yet. Create a stay first, then come back to configure pricing and availability.
          </p>
        </section>
      )}
    </PartnerShell>
  );
}
