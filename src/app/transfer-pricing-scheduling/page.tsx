"use client";

import { useEffect, useMemo, useState } from "react";

import { InfoHint } from "@/components/common/info-hint";
import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import { formatDateTimeUTC } from "@/lib/format";
import { transferPricingSchedulingClient } from "@/modules/transfer-pricing-scheduling/transfer-pricing-scheduling-client";
import type {
  TransferPricingScheduling,
  TransferScheduleDay,
  UpsertScheduleWindowInput,
} from "@/modules/transfer-pricing-scheduling/contracts";
import { transfersClient } from "@/modules/transfers/transfers-client";
import type { TransferListing } from "@/modules/transfers/contracts";

const CURRENCY_OPTIONS = ["NGN", "USD", "GBP"];
const DAY_OPTIONS: TransferScheduleDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<TransferScheduleDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

type WindowDraft = {
  id?: string;
  startTime: string;
  endTime: string;
  days: TransferScheduleDay[];
};

function formatNumber(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

export default function TransferPricingSchedulingPage() {
  const { user, loading } = usePartnerAccess();
  const [transfers, setTransfers] = useState<TransferListing[]>([]);
  const [selectedTransferId, setSelectedTransferId] = useState("");
  const [config, setConfig] = useState<TransferPricingScheduling | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);

  const [currency, setCurrency] = useState("NGN");
  const [baseFare, setBaseFare] = useState("0");
  const [distanceRatePerKm, setDistanceRatePerKm] = useState("0");
  const [timeRatePerMinute, setTimeRatePerMinute] = useState("0");
  const [peakSurcharge, setPeakSurcharge] = useState("0");
  const [nightSurcharge, setNightSurcharge] = useState("0");
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [blackoutDateInput, setBlackoutDateInput] = useState("");
  const [scheduleWindows, setScheduleWindows] = useState<WindowDraft[]>([]);

  const selectedTransfer = useMemo(
    () => transfers.find((item) => item.id === selectedTransferId) ?? null,
    [selectedTransferId, transfers],
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
    transfersClient
      .listTransfers(user.id)
      .then((items) => {
        if (!active) {
          return;
        }

        setTransfers(items);
        const fallbackId = items[0]?.id ?? "";
        setSelectedTransferId((current) => current || fallbackId);
      })
      .catch((error) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Failed to load transfers.");
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !selectedTransferId) {
      return;
    }

    let active = true;
    setBusy(true);
    setMessage("");

    transferPricingSchedulingClient
      .getPricingScheduling(user.id, selectedTransferId)
      .then((item) => {
        if (!active) {
          return;
        }

        setConfig(item);
        setCurrency((item.currency ?? "NGN").toUpperCase());
        setBaseFare(formatNumber(item.baseFare));
        setDistanceRatePerKm(formatNumber(item.distanceRatePerKm));
        setTimeRatePerMinute(formatNumber(item.timeRatePerMinute));
        setPeakSurcharge(formatNumber(item.peakSurcharge));
        setNightSurcharge(formatNumber(item.nightSurcharge));
        setBlackoutDates(item.blackoutDates);
        setBlackoutDateInput("");
        setScheduleWindows(
          item.scheduleWindows.map((window) => ({
            id: window.id,
            startTime: window.startTime,
            endTime: window.endTime,
            days: window.days,
          })),
        );
      })
      .catch((error) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Failed to load transfer pricing.");
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
  }, [selectedTransferId, user]);

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  function addWindow() {
    setScheduleWindows((prev) => [
      ...prev,
      {
        startTime: "",
        endTime: "",
        days: ["mon", "tue", "wed", "thu", "fri"],
      },
    ]);
  }

  function updateWindow(index: number, patch: Partial<WindowDraft>) {
    setScheduleWindows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  }

  function removeWindow(index: number) {
    setScheduleWindows((prev) => prev.filter((_, current) => current !== index));
  }

  function toggleWindowDay(index: number, day: TransferScheduleDay) {
    setScheduleWindows((prev) => {
      const copy = [...prev];
      const current = copy[index];
      const hasDay = current.days.includes(day);
      copy[index] = {
        ...current,
        days: hasDay
          ? current.days.filter((item) => item !== day)
          : [...current.days, day],
      };
      return copy;
    });
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

  async function saveConfig() {
    if (!user || !selectedTransferId) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const saved = await transferPricingSchedulingClient.upsertPricingScheduling(
        user.id,
        selectedTransferId,
        {
          currency: currency.trim().toUpperCase(),
          baseFare: Number(baseFare),
          distanceRatePerKm: Number(distanceRatePerKm),
          timeRatePerMinute: Number(timeRatePerMinute),
          peakSurcharge: Number(peakSurcharge),
          nightSurcharge: Number(nightSurcharge),
          blackoutDates,
          scheduleWindows: scheduleWindows.map((window) => ({
            id: window.id,
            startTime: window.startTime,
            endTime: window.endTime,
            days: window.days,
          })),
        },
      );

      setConfig(saved);
      setMessage("Transfer pricing and scheduling saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save transfer pricing and scheduling.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PartnerShell
      title="Transfer Pricing & Scheduling"
      description="Configure fares, surcharges, operation windows, and blackout dates."
      headerExtra={
        config ? (
          <p className="tm-muted text-sm">
            Last updated: {formatDateTimeUTC(config.updatedAt)}
          </p>
        ) : null
      }
    >
      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Transfer Selection</h2>
        <p className="tm-muted mt-1 text-sm">
          Pick a transfer listing to manage route-specific fare and schedule rules.
        </p>
        <div className="mt-4 max-w-md">
          <select
            className="tm-input"
            value={selectedTransferId}
            onChange={(event) => setSelectedTransferId(event.target.value)}
          >
            <option value="">Select transfer</option>
            {transfers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name || "Untitled transfer"} ({item.pickupPoint} - {item.dropoffPoint})
              </option>
            ))}
          </select>
        </div>
      </section>

      {selectedTransfer ? (
        <section className="tm-panel p-6">
          <h2 className="tm-section-title flex items-center gap-2">
            Fare Model & Schedule
            <InfoHint text="Configure base transfer fares, surcharge rules, operating windows, and blocked dates." />
          </h2>
          <p className="tm-muted mt-1 text-sm">
            Configuring:{" "}
            <span className="font-semibold text-slate-900">
              {selectedTransfer.name || selectedTransfer.id}
            </span>
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="tm-field">
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Currency</span>
                <InfoHint text="The currency used for all transfer fare values." />
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
                <span>Base Fare</span>
                <InfoHint text="Starting fare charged before distance, time, and surcharge calculations." />
              </span>
              <input
                className="tm-input"
                type="number"
                value={baseFare}
                onChange={(event) => setBaseFare(event.target.value)}
              />
            </label>

            <label className="tm-field">
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Distance Rate / km</span>
                <InfoHint text="Extra amount charged for each kilometer traveled." />
              </span>
              <input
                className="tm-input"
                type="number"
                value={distanceRatePerKm}
                onChange={(event) => setDistanceRatePerKm(event.target.value)}
              />
            </label>

            <label className="tm-field">
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Time Rate / minute</span>
                <InfoHint text="Extra amount charged for each minute of trip duration." />
              </span>
              <input
                className="tm-input"
                type="number"
                value={timeRatePerMinute}
                onChange={(event) => setTimeRatePerMinute(event.target.value)}
              />
            </label>

            <label className="tm-field">
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Peak Surcharge</span>
                <InfoHint text="Additional flat charge applied during high-demand periods." />
              </span>
              <input
                className="tm-input"
                type="number"
                value={peakSurcharge}
                onChange={(event) => setPeakSurcharge(event.target.value)}
              />
            </label>

            <label className="tm-field">
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Night Surcharge</span>
                <InfoHint text="Additional flat charge applied for late-night trips." />
              </span>
              <input
                className="tm-input"
                type="number"
                value={nightSurcharge}
                onChange={(event) => setNightSurcharge(event.target.value)}
              />
            </label>
          </div>

          <section className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                Schedule Windows
                <InfoHint text="Define available pickup time ranges and the days of week each range applies to." />
              </h3>
              <button className="tm-btn tm-btn-outline" onClick={addWindow} type="button">
                Add Window
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {scheduleWindows.map((window, index) => (
                <div
                  key={`${window.id ?? "new"}-${index}`}
                  className="tm-list-card"
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <input
                      className="tm-input"
                      type="time"
                      value={window.startTime}
                      onChange={(event) =>
                        updateWindow(index, { startTime: event.target.value })
                      }
                    />
                    <input
                      className="tm-input"
                      type="time"
                      value={window.endTime}
                      onChange={(event) => updateWindow(index, { endTime: event.target.value })}
                    />
                    <button
                      className="tm-btn tm-btn-outline"
                      onClick={() => removeWindow(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((day) => {
                      const active = window.days.includes(day);
                      return (
                        <button
                          key={`${window.id ?? "new"}-${index}-${day}`}
                          className={`tm-tag-pill ${
                            active
                              ? "tm-tag-pill-active"
                              : ""
                          }`}
                          onClick={() => toggleWindowDay(index, day)}
                          type="button"
                        >
                          {DAY_LABELS[day]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {scheduleWindows.length === 0 ? (
                <p className="tm-muted text-sm">No schedule windows configured.</p>
              ) : null}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              Blackout Dates
              <InfoHint text="Dates when this transfer cannot be booked." />
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
            <button
              className="tm-btn tm-btn-primary"
              type="button"
              onClick={() => void saveConfig()}
              disabled={busy}
            >
              {busy ? "Saving..." : "Save Pricing & Scheduling"}
            </button>
          </div>

          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
        </section>
      ) : (
        <section className="tm-panel p-6">
          <p className="tm-muted text-sm">
            No transfer listings found yet. Create a transfer first, then configure pricing and
            scheduling.
          </p>
        </section>
      )}
    </PartnerShell>
  );
}
