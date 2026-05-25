"use client";

import { useEffect, useMemo, useState } from "react";

import { InfoHint } from "@/components/common/info-hint";
import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import { formatDateTimeUTC } from "@/lib/format";
import { pricingAvailabilityClient } from "@/modules/pricing-availability/pricing-availability-client";
import type {
  CancellationOption,
  RoomCancellationOption,
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

type RoomCancellationDraft = {
  roomId: string;
  roomLabel: string;
  nonCancellableAmount: string;
  freeCancellationAmount: string;
  freeCancellationCutoffHours: string;
};

function findOption(options: CancellationOption[] | undefined, id: "NON_CANCELLABLE" | "FREE_CANCELLATION") {
  return options?.find((option) => (option.optionId ?? option.id) === id);
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
  const [nonCancellableAmount, setNonCancellableAmount] = useState("0");
  const [freeCancellationAmount, setFreeCancellationAmount] = useState("0");
  const [freeCancellationCutoffHours, setFreeCancellationCutoffHours] = useState("24");
  const [roomCancellationDrafts, setRoomCancellationDrafts] = useState<RoomCancellationDraft[]>([]);

  const selectedStay = useMemo(
    () => stays.find((item) => item.id === selectedStayId) ?? null,
    [selectedStayId, stays],
  );
  const selectedStaySaleMode = useMemo(() => {
    if (selectedStay?.saleMode) {
      return selectedStay.saleMode;
    }
    const type = (selectedStay?.propertyType ?? "").trim().toLowerCase();
    return ["hotel", "guest_house", "resort"].includes(type) ? "room_level" : "unit_level";
  }, [selectedStay?.propertyType, selectedStay?.saleMode]);
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
        const nonCancellable = findOption(item.cancellationOptions, "NON_CANCELLABLE");
        const freeCancellation = findOption(item.cancellationOptions, "FREE_CANCELLATION");
        setNonCancellableAmount(formatNumber(nonCancellable?.amount ?? item.baseRate));
        setFreeCancellationAmount(formatNumber(freeCancellation?.amount ?? item.baseRate));
        const freeCutoff = freeCancellation?.cancelDeadlineHoursBeforeCheckIn;
        setFreeCancellationCutoffHours(
          freeCutoff === null || freeCutoff === undefined ? "24" : formatNumber(Number(freeCutoff)),
        );
        const roomEntries: RoomCancellationOption[] = item.roomCancellationOptions ?? [];
        const byRoomId = new Map(roomEntries.map((entry) => [entry.roomId, entry.cancellationOptions]));
        const roomDrafts: RoomCancellationDraft[] = (selectedStay?.rooms ?? [])
          .filter((room) => room.isBookable)
          .map((room) => {
            const options = byRoomId.get(room.id);
            const roomNonCancellable = findOption(options, "NON_CANCELLABLE");
            const roomFreeCancellation = findOption(options, "FREE_CANCELLATION");
            const fallbackBase = Number(room.baseRate || item.baseRate || 0);
            const fallbackFree = Number(room.baseRate || item.baseRate || 0);
            return {
              roomId: room.id,
              roomLabel: room.name || room.bedConfiguration || room.id,
              nonCancellableAmount: formatNumber(roomNonCancellable?.amount ?? fallbackBase),
              freeCancellationAmount: formatNumber(roomFreeCancellation?.amount ?? fallbackFree),
              freeCancellationCutoffHours: formatNumber(
                Number(roomFreeCancellation?.cancelDeadlineHoursBeforeCheckIn ?? 24),
              ),
            };
          });
        setRoomCancellationDrafts(roomDrafts);
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
  }, [user, selectedStayId, selectedStay?.rooms]);

  function updateRoomCancellationDraft(roomId: string, patch: Partial<RoomCancellationDraft>) {
    setRoomCancellationDrafts((prev) => prev.map((draft) => (draft.roomId === roomId ? { ...draft, ...patch } : draft)));
  }

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

  async function savePricing() {
    if (!user || !selectedStayId) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const parsedBaseRate = Number(baseRate);
      if (!Number.isFinite(parsedBaseRate) || parsedBaseRate <= 0) {
        throw new Error("Base rate must be greater than 0.");
      }

      if (selectedStaySaleMode === "unit_level") {
        const parsedNonCancellable = Number(nonCancellableAmount);
        const parsedFreeCancellation = Number(freeCancellationAmount);
        if (!Number.isFinite(parsedNonCancellable) || parsedNonCancellable <= 0) {
          throw new Error("Non-cancellable amount must be greater than 0.");
        }
        if (!Number.isFinite(parsedFreeCancellation) || parsedFreeCancellation <= 0) {
          throw new Error("Free-cancellation amount must be greater than 0.");
        }
      }

      if (selectedStaySaleMode === "room_level") {
        for (const room of roomCancellationDrafts) {
          const parsedRoomNonCancellable = Number(room.nonCancellableAmount);
          const parsedRoomFreeCancellation = Number(room.freeCancellationAmount);
          if (!Number.isFinite(parsedRoomNonCancellable) || parsedRoomNonCancellable <= 0) {
            throw new Error(`Room \"${room.roomLabel}\": non-cancellable amount must be greater than 0.`);
          }
          if (!Number.isFinite(parsedRoomFreeCancellation) || parsedRoomFreeCancellation <= 0) {
            throw new Error(`Room \"${room.roomLabel}\": free-cancellation amount must be greater than 0.`);
          }
        }
      }

      const saved = await pricingAvailabilityClient.upsertPricing(user.id, selectedStayId, {
        saleMode: selectedStaySaleMode,
        currency: currency.trim().toUpperCase(),
        baseRate: parsedBaseRate,
        weekdayRate: Number(weekdayRate),
        weekendRate: Number(weekendRate),
        minStayNights: Number(minStayNights),
        maxStayNights: Number(maxStayNights),
        seasonalOverrides: seasonalOverrides.map((item) => ({
          ...item,
          rate: Number(item.rate),
        })),
        blackoutDates,
        ratePlans: [],
        cancellationOptions: selectedStaySaleMode === "unit_level"
          ? [
              {
                optionId: "NON_CANCELLABLE",
                label: "Non-refundable",
                amount: Number(nonCancellableAmount),
              },
              {
                optionId: "FREE_CANCELLATION",
                label: "Free cancellation",
                amount: Number(freeCancellationAmount),
                cancelDeadlineHoursBeforeCheckIn: Number(freeCancellationCutoffHours || "24"),
              },
            ]
          : [],
        roomCancellationOptions: selectedStaySaleMode === "room_level"
          ? roomCancellationDrafts.map((room) => ({
              roomId: room.roomId,
              cancellationOptions: [
                {
                  optionId: "NON_CANCELLABLE",
                  label: "Non-refundable",
                  amount: Number(room.nonCancellableAmount),
                },
                {
                  optionId: "FREE_CANCELLATION",
                  label: "Free cancellation",
                  amount: Number(room.freeCancellationAmount),
                  cancelDeadlineHoursBeforeCheckIn: Number(room.freeCancellationCutoffHours || "24"),
                },
              ],
            }))
          : [],
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
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              Cancellation Pricing
              <InfoHint text="Set the two amounts guests can choose: lower non-refundable price and higher free-cancellation price." />
            </h3>
            {selectedStaySaleMode === "room_level" ? (
              <div className="mt-3 space-y-3">
                {roomCancellationDrafts.map((room) => (
                  <div key={room.roomId} className="tm-list-card">
                    <p className="text-sm font-semibold text-slate-900">{room.roomLabel}</p>
                    <div className="mt-2 grid gap-3 md:grid-cols-3">
                      <label className="tm-field">
                        <span className="mb-1 block text-sm font-medium text-slate-700">Non-refundable Amount</span>
                        <input
                          className="tm-input"
                          type="number"
                          min={0}
                          value={room.nonCancellableAmount}
                          onChange={(event) => updateRoomCancellationDraft(room.roomId, { nonCancellableAmount: event.target.value })}
                        />
                      </label>
                      <label className="tm-field">
                        <span className="mb-1 block text-sm font-medium text-slate-700">Free-cancellation Amount</span>
                        <input
                          className="tm-input"
                          type="number"
                          min={0}
                          value={room.freeCancellationAmount}
                          onChange={(event) => updateRoomCancellationDraft(room.roomId, { freeCancellationAmount: event.target.value })}
                        />
                      </label>
                      <label className="tm-field">
                        <span className="mb-1 block text-sm font-medium text-slate-700">Free-cancel Cutoff (hours)</span>
                        <input
                          className="tm-input"
                          type="number"
                          min={0}
                          value={room.freeCancellationCutoffHours}
                          onChange={(event) => updateRoomCancellationDraft(room.roomId, { freeCancellationCutoffHours: event.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                ))}
                {roomCancellationDrafts.length === 0 ? (
                  <p className="tm-muted text-sm">No bookable rooms found. Add bookable rooms first.</p>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="tm-field">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Non-refundable Amount</span>
                  <input
                    className="tm-input"
                    type="number"
                    min={0}
                    value={nonCancellableAmount}
                    onChange={(event) => setNonCancellableAmount(event.target.value)}
                  />
                </label>
                <label className="tm-field">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Free-cancellation Amount</span>
                  <input
                    className="tm-input"
                    type="number"
                    min={0}
                    value={freeCancellationAmount}
                    onChange={(event) => setFreeCancellationAmount(event.target.value)}
                  />
                </label>
                <label className="tm-field">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Free-cancel Cutoff (hours)</span>
                  <input
                    className="tm-input"
                    type="number"
                    min={0}
                    value={freeCancellationCutoffHours}
                    onChange={(event) => setFreeCancellationCutoffHours(event.target.value)}
                  />
                </label>
              </div>
            )}
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
