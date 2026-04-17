"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type {
  RefundStatus,
  SettlementRecord,
  SettlementSettings,
  WalletSummary,
} from "@/modules/wallet-payouts/contracts";
import { walletPayoutsClient } from "@/modules/wallet-payouts/wallet-payouts-client";

export default function WalletPayoutsPage() {
  const { user, loading } = usePartnerAccess();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [settings, setSettings] = useState<SettlementSettings | null>(null);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [statementPreview, setStatementPreview] = useState("");
  const [selectedSettlementId, setSelectedSettlementId] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    setBusy(true);
    setMessage("");

    Promise.all([
      walletPayoutsClient.getWalletSummary(user.id),
      walletPayoutsClient.getSettlementSettings(user.id),
      walletPayoutsClient.listSettlements(user.id),
    ])
      .then(([summaryResult, settingsResult, settlementsResult]) => {
        if (!active) {
          return;
        }
        setSummary(summaryResult);
        setSettings(settingsResult);
        setSettlements(settlementsResult);
        if (settlementsResult.length > 0) {
          setSelectedSettlementId(settlementsResult[0].id);
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Failed to load wallet and settlement data.",
          );
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
  }, [user]);

  async function refreshWallet() {
    if (!user) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const [summaryResult, settlementResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(user.id),
        walletPayoutsClient.listSettlements(user.id),
      ]);
      setSummary(summaryResult);
      setSettlements(settlementResult);
      setMessage("Wallet refreshed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to refresh wallet.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !settings) {
      return;
    }

    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const updated = await walletPayoutsClient.updateSettlementSettings(user.id, {
        autoSettleOnBookingCompletion:
          form.get("autoSettleOnBookingCompletion") === "on",
        reserveHoldDays: Number(form.get("reserveHoldDays") ?? settings.reserveHoldDays),
        requireAdminRefundNotification:
          form.get("requireAdminRefundNotification") === "on",
      });
      setSettings(updated);
      setMessage("Settlement settings updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update settlement settings.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function recordBookingCompletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }
    const formElement = event.currentTarget;

    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    const bookingReference = String(form.get("bookingReference") ?? "");
    const grossAmount = Number(form.get("grossAmount") ?? 0);

    try {
      const created = await walletPayoutsClient.recordBookingCompletion(user.id, {
        bookingReference,
        grossAmount,
      });
      const [summaryResult, settlementResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(user.id),
        walletPayoutsClient.listSettlements(user.id),
      ]);
      setSummary(summaryResult);
      setSettlements(settlementResult);
      setSelectedSettlementId(created.id);
      setMessage("Completed booking recorded for settlement.");
      formElement.reset();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to record booking completion.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function trackRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !selectedSettlementId) {
      return;
    }
    const formElement = event.currentTarget;

    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    const refundAmount = Number(form.get("refundAmount") ?? 0);
    const reason = String(form.get("reason") ?? "");
    const status = String(form.get("status") ?? "partner_notified") as RefundStatus;

    try {
      await walletPayoutsClient.recordCancellationRefund(user.id, {
        settlementId: selectedSettlementId,
        refundAmount,
        reason,
        status,
      });
      const [summaryResult, settlementResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(user.id),
        walletPayoutsClient.listSettlements(user.id),
      ]);
      setSummary(summaryResult);
      setSettlements(settlementResult);
      setMessage("Cancellation refund status tracked.");
      formElement.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to track refund status.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadStatement(settlementId: string) {
    if (!user) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const csv = await walletPayoutsClient.downloadSettlementStatement(user.id, settlementId);
      setStatementPreview(csv);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `settlement-statement-${settlementId}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setMessage("Settlement statement downloaded.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to download settlement statement.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading wallet...</p>
        </div>
      </main>
    );
  }

  return (
    <PartnerShell
      title="Wallet & Settlements"
      description="Track booking-completion settlements, monitor deductions, and follow cancellation refund resolution."
      headerExtra={
        <div className="tm-inline-actions">
          <button className="tm-btn tm-btn-primary" type="button" disabled={busy} onClick={() => void refreshWallet()}>
            Refresh Wallet
          </button>
          <Link href="/dashboard" className="tm-btn tm-btn-outline">
            Back to Dashboard
          </Link>
        </div>
      }
    >
      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Balances</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Pending</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {summary?.pendingBalance ?? 0} {summary?.currency ?? "NGN"}
            </p>
          </div>
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Available</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {summary?.availableBalance ?? 0} {summary?.currency ?? "NGN"}
            </p>
          </div>
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Paid</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {summary?.paidBalance ?? 0} {summary?.currency ?? "NGN"}
            </p>
          </div>
        </div>
      </section>

      <form className="tm-panel p-6" onSubmit={saveSettings}>
        <h2 className="tm-section-title">Settlement Settings</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="tm-tag-pill inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="autoSettleOnBookingCompletion"
              defaultChecked={settings?.autoSettleOnBookingCompletion ?? true}
            />
            Auto-settle on booking completion
          </label>
          <label className="tm-tag-pill inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="requireAdminRefundNotification"
              defaultChecked={settings?.requireAdminRefundNotification ?? true}
            />
            Require admin refund notification
          </label>
          <label className="tm-field md:col-span-2">
            <span className="tm-field-label">Reserve Hold (days)</span>
            <input
              className="tm-input"
              type="number"
              name="reserveHoldDays"
              min={0}
              defaultValue={settings?.reserveHoldDays ?? 0}
            />
          </label>
        </div>
        <div className="tm-inline-actions mt-4">
          <button className="tm-btn tm-btn-primary" disabled={busy} type="submit">
            Save Settlement Settings
          </button>
        </div>
      </form>

      <form className="tm-panel p-6" onSubmit={recordBookingCompletion}>
        <h2 className="tm-section-title">Record Completed Booking</h2>
        <p className="tm-muted mt-1 text-sm">
          This local/mock action simulates booking completion and triggers settlement lifecycle updates.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="tm-field">
            <span className="tm-field-label">Booking Reference</span>
            <input className="tm-input" name="bookingReference" placeholder="TM-BOOK-10020030" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Gross Amount ({summary?.currency ?? "NGN"})</span>
            <input className="tm-input" type="number" name="grossAmount" min={1} />
          </label>
        </div>
        <div className="tm-inline-actions mt-4">
          <button className="tm-btn tm-btn-accent" disabled={busy} type="submit">
            Record Completion
          </button>
        </div>
      </form>

      <form className="tm-panel p-6" onSubmit={trackRefund}>
        <h2 className="tm-section-title">Cancellation Refund Tracking</h2>
        <p className="tm-muted mt-1 text-sm">
          Use this to track admin-notified partner refund actions after a traveler cancellation.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="tm-field">
            <span className="tm-field-label">Settlement</span>
            <select
              className="tm-input"
              value={selectedSettlementId}
              onChange={(event) => setSelectedSettlementId(event.target.value)}
            >
              <option value="">Select settlement</option>
              {settlements.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.settlementReference}
                </option>
              ))}
            </select>
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Refund Status</span>
            <select className="tm-input" name="status" defaultValue="partner_notified">
              <option value="requested">Requested</option>
              <option value="partner_notified">Partner Notified</option>
              <option value="refunded">Refunded</option>
              <option value="disputed">Disputed</option>
              <option value="recovered">Recovered</option>
            </select>
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Refund Amount ({summary?.currency ?? "NGN"})</span>
            <input className="tm-input" type="number" name="refundAmount" min={1} />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Reason</span>
            <input className="tm-input" name="reason" placeholder="Traveler cancelled after settlement." />
          </label>
        </div>
        <div className="tm-inline-actions mt-4">
          <button className="tm-btn tm-btn-outline" disabled={busy || !selectedSettlementId} type="submit">
            Track Refund
          </button>
        </div>
      </form>

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Settlement History</h2>
        <ul className="tm-list-stack mt-4">
          {settlements.map((item) => (
            <li key={item.id} className="tm-list-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.settlementReference}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {item.status} • {new Date(item.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">Booking: {item.bookingReference}</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Gross: {item.grossAmount} {item.currency} • Net: {item.netAmount} {item.currency}
                  </p>
                  <p className="text-xs text-slate-600">
                    Deductions: commission {item.commissionFee}, tax {item.taxWithholding}, total {item.totalDeductions}
                  </p>
                  {item.refundStatus ? (
                    <p className="mt-2 text-xs text-slate-700">
                      Refund: {item.refundStatus}
                      {item.refundedAmount ? ` (${item.refundedAmount} ${item.currency})` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="tm-inline-actions">
                  <button className="tm-btn tm-btn-outline" type="button" disabled={busy} onClick={() => void downloadStatement(item.id)}>
                    Download Statement
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {settlements.length === 0 ? (
          <p className="tm-soft-note mt-3 text-sm">No settlements yet.</p>
        ) : null}
      </section>

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Statement Preview</h2>
        <textarea className="tm-input mt-3 min-h-32 font-mono text-xs" value={statementPreview} readOnly />
      </section>

      {busy ? <p className="tm-soft-note text-sm">Processing wallet action...</p> : null}
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </PartnerShell>
  );
}
