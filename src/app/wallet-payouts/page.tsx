"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { PartnerShell } from "@/components/common/partner-shell";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type {
  PayoutRecord,
  PayoutSettings,
  WalletSummary,
} from "@/modules/wallet-payouts/contracts";
import { walletPayoutsClient } from "@/modules/wallet-payouts/wallet-payouts-client";

export default function WalletPayoutsPage() {
  const { user, loading } = usePartnerAccess();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [statementPreview, setStatementPreview] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    setBusy(true);
    setMessage("");

    Promise.all([
      walletPayoutsClient.getWalletSummary(user.id),
      walletPayoutsClient.getPayoutSettings(user.id),
      walletPayoutsClient.listPayouts(user.id),
    ])
      .then(([summaryResult, settingsResult, payoutResult]) => {
        if (!active) {
          return;
        }
        setSummary(summaryResult);
        setSettings(settingsResult);
        setPayouts(payoutResult);
      })
      .catch((error) => {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Failed to load wallet and payouts.",
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
      const [summaryResult, payoutResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(user.id),
        walletPayoutsClient.listPayouts(user.id),
      ]);
      setSummary(summaryResult);
      setPayouts(payoutResult);
      setMessage("Wallet refreshed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to refresh wallet.");
    } finally {
      setBusy(false);
    }
  }

  async function savePayoutSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !settings) {
      return;
    }

    setBusy(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    try {
      const updated = await walletPayoutsClient.updatePayoutSettings(user.id, {
        schedule: String(form.get("schedule") ?? settings.schedule) as PayoutSettings["schedule"],
        minimumThreshold: Number(form.get("minimumThreshold") ?? settings.minimumThreshold),
        manualModeEnabled: form.get("manualModeEnabled") === "on",
      });
      setSettings(updated);
      setMessage("Payout settings updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update payout settings.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function requestPayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !summary) {
      return;
    }

    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount") ?? 0);

    try {
      await walletPayoutsClient.requestPayout(user.id, amount);
      const [summaryResult, payoutsResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(user.id),
        walletPayoutsClient.listPayouts(user.id),
      ]);
      setSummary(summaryResult);
      setPayouts(payoutsResult);
      setMessage("Payout request submitted.");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to request payout.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadStatement(payoutId: string) {
    if (!user) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const csv = await walletPayoutsClient.downloadPayoutStatement(user.id, payoutId);
      setStatementPreview(csv);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `payout-statement-${payoutId}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setMessage("Payout statement downloaded.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to download payout statement.",
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
      title="Wallet & Payouts"
      description="Monitor balances, configure payout rules, request payouts, and download statements."
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
        <p className="mt-3 text-sm text-slate-700">
          Reserve hold period: {summary?.reserveHoldDays ?? 0} days
        </p>
      </section>

      <form className="tm-panel p-6" onSubmit={savePayoutSettings}>
        <h2 className="tm-section-title">Payout Settings</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="tm-field">
            <span className="tm-field-label">Schedule</span>
            <select
              className="tm-input"
              name="schedule"
              defaultValue={settings?.schedule ?? "bi-weekly"}
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Minimum Threshold</span>
            <input
              className="tm-input"
              type="number"
              name="minimumThreshold"
              min={0}
              defaultValue={settings?.minimumThreshold ?? 0}
            />
          </label>
        </div>
        <label className="tm-tag-pill mt-4 inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="manualModeEnabled"
            defaultChecked={settings?.manualModeEnabled ?? true}
          />
          Enable manual payout requests
        </label>
        <div className="tm-inline-actions mt-4">
          <button className="tm-btn tm-btn-primary" disabled={busy} type="submit">
            Save Payout Settings
          </button>
        </div>
      </form>

      <form className="tm-panel p-6" onSubmit={requestPayout}>
        <h2 className="tm-section-title">Request Payout</h2>
        <p className="tm-muted mt-1 text-sm">
          Submit a manual payout request when eligible.
        </p>
        <div className="mt-4 max-w-sm">
          <label className="tm-field">
            <span className="tm-field-label">Amount ({summary?.currency ?? "NGN"})</span>
            <input className="tm-input" type="number" name="amount" min={0} />
          </label>
        </div>
        <div className="tm-inline-actions mt-4">
          <button className="tm-btn tm-btn-accent" disabled={busy} type="submit">
            Request Payout
          </button>
        </div>
      </form>

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Payout History</h2>
        <ul className="tm-list-stack mt-4">
          {payouts.map((payout) => (
            <li key={payout.id} className="tm-list-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{payout.reference}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {payout.status} • {new Date(payout.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Gross: {payout.grossAmount} {payout.currency} • Net: {payout.netAmount} {payout.currency}
                  </p>
                  <p className="text-xs text-slate-600">
                    Deductions: commission {payout.commissionFee}, tax {payout.taxWithholding}, total {payout.totalDeductions}
                  </p>
                </div>
                <div className="tm-inline-actions">
                  <button className="tm-btn tm-btn-outline" type="button" disabled={busy} onClick={() => void downloadStatement(payout.id)}>
                    Download Statement
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {payouts.length === 0 ? (
          <p className="tm-soft-note mt-3 text-sm">No payouts yet.</p>
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
