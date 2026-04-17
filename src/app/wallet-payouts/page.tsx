"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type {
  RefundStatus,
  SettlementAccount,
  SettlementAccountHistoryEntry,
  SettlementAccountMethodType,
  SettlementSettings,
  WalletSummary,
  SettlementRecord,
} from "@/modules/wallet-payouts/contracts";
import {
  listSupportedMobileMoneyProviders,
  listSupportedSettlementCountries,
  listSupportedSettlementCurrencies,
} from "@/modules/wallet-payouts/settlement-accounts";
import { walletPayoutsClient } from "@/modules/wallet-payouts/wallet-payouts-client";

type SettlementAccountFormState = {
  accountId: string;
  methodType: SettlementAccountMethodType;
  country: string;
  currency: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  routingCode: string;
  swiftCode: string;
  mobileMoneyProvider: string;
  mobileNumber: string;
  isDefault: boolean;
};

const COUNTRY_OPTIONS = listSupportedSettlementCountries();

function createInitialAccountForm(): SettlementAccountFormState {
  return {
    accountId: "",
    methodType: "bank_account",
    country: "NG",
    currency: "NGN",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    iban: "",
    routingCode: "",
    swiftCode: "",
    mobileMoneyProvider: "",
    mobileNumber: "",
    isDefault: true,
  };
}

function mapAccountToForm(account: SettlementAccount): SettlementAccountFormState {
  return {
    accountId: account.id,
    methodType: account.methodType,
    country: account.country,
    currency: account.currency,
    accountHolderName: account.accountHolderName,
    bankName: account.bankName ?? "",
    accountNumber: "",
    iban: "",
    routingCode: "",
    swiftCode: "",
    mobileMoneyProvider: account.mobileMoneyProvider ?? "",
    mobileNumber: "",
    isDefault: account.isDefault,
  };
}

export default function WalletPayoutsPage() {
  const { user, loading } = usePartnerAccess();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [settings, setSettings] = useState<SettlementSettings | null>(null);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [accountHistory, setAccountHistory] = useState<SettlementAccountHistoryEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [statementPreview, setStatementPreview] = useState("");
  const [selectedSettlementId, setSelectedSettlementId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [accountForm, setAccountForm] = useState<SettlementAccountFormState>(
    createInitialAccountForm(),
  );

  const currencyOptions = useMemo(
    () => listSupportedSettlementCurrencies(accountForm.country),
    [accountForm.country],
  );
  const mobileMoneyProviders = useMemo(
    () => listSupportedMobileMoneyProviders(accountForm.country),
    [accountForm.country],
  );

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
      walletPayoutsClient.listSettlementAccounts(user.id),
      walletPayoutsClient.listSettlementAccountHistory(user.id),
    ])
      .then(([summaryResult, settingsResult, settlementsResult, accountsResult, historyResult]) => {
        if (!active) {
          return;
        }
        setSummary(summaryResult);
        setSettings(settingsResult);
        setSettlements(settlementsResult);
        setAccounts(accountsResult);
        setAccountHistory(historyResult);
        if (settlementsResult.length > 0) {
          setSelectedSettlementId(settlementsResult[0].id);
        }
        if (accountsResult.length > 0) {
          setSelectedAccountId(accountsResult[0].id);
          setAccountForm(mapAccountToForm(accountsResult[0]));
        } else {
          setSelectedAccountId("");
          setAccountForm(createInitialAccountForm());
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
      const [summaryResult, settlementResult, accountsResult, historyResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(user.id),
        walletPayoutsClient.listSettlements(user.id),
        walletPayoutsClient.listSettlementAccounts(user.id),
        walletPayoutsClient.listSettlementAccountHistory(user.id),
      ]);
      setSummary(summaryResult);
      setSettlements(settlementResult);
      setAccounts(accountsResult);
      setAccountHistory(historyResult);
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

  async function submitSettlementAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const result = await walletPayoutsClient.submitSettlementAccount(user.id, {
        accountId: accountForm.accountId || undefined,
        methodType: accountForm.methodType,
        country: accountForm.country,
        currency: accountForm.currency,
        accountHolderName: accountForm.accountHolderName,
        bankName: accountForm.bankName,
        accountNumber: accountForm.accountNumber,
        iban: accountForm.iban,
        routingCode: accountForm.routingCode,
        swiftCode: accountForm.swiftCode,
        mobileMoneyProvider: accountForm.mobileMoneyProvider,
        mobileNumber: accountForm.mobileNumber,
        isDefault: accountForm.isDefault,
      });
      const [accountsResult, historyResult] = await Promise.all([
        walletPayoutsClient.listSettlementAccounts(user.id),
        walletPayoutsClient.listSettlementAccountHistory(user.id),
      ]);
      setAccounts(accountsResult);
      setAccountHistory(historyResult);
      setSelectedAccountId(result.account.id);
      setAccountForm(mapAccountToForm(result.account));
      setOtpCode("");
      setMessage(
        result.otpCodeHint
          ? `Settlement account submitted. Mock OTP: ${result.otpCodeHint}`
          : "Settlement account submitted.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit settlement account.");
    } finally {
      setBusy(false);
    }
  }

  async function verifySettlementAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !selectedAccountId) {
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const verified = await walletPayoutsClient.verifySettlementAccountOtp(user.id, {
        accountId: selectedAccountId,
        otpCode,
      });
      const [accountsResult, historyResult] = await Promise.all([
        walletPayoutsClient.listSettlementAccounts(user.id),
        walletPayoutsClient.listSettlementAccountHistory(user.id),
      ]);
      setAccounts(accountsResult);
      setAccountHistory(historyResult);
      setAccountForm(mapAccountToForm(verified));
      setOtpCode("");
      setMessage(
        verified.status === "verified"
          ? "Settlement account verified."
          : verified.rejectionReason ?? "Settlement account verification was rejected.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to verify settlement account.");
    } finally {
      setBusy(false);
    }
  }

  function startNewSettlementAccount() {
    setSelectedAccountId("");
    setAccountForm(createInitialAccountForm());
    setOtpCode("");
    setMessage("Preparing a new settlement account entry.");
  }

  function chooseEditableAccount(accountId: string) {
    setSelectedAccountId(accountId);
    const target = accounts.find((item) => item.id === accountId);
    if (!target) {
      return;
    }
    setAccountForm(mapAccountToForm(target));
    setOtpCode("");
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
      description="Track booking-completion settlements, monitor deductions, and manage payout method verification."
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

      <section className="tm-panel p-6">
        <div className="tm-section-head">
          <div>
            <h2 className="tm-section-title">Settlement Account Verification</h2>
            <p className="tm-muted mt-1 text-sm">
              Add bank or mobile money payout methods, verify them with OTP, and keep sensitive details masked.
            </p>
          </div>
          <button className="tm-btn tm-btn-outline" type="button" onClick={startNewSettlementAccount}>
            Add New Payout Method
          </button>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <form className="space-y-4" onSubmit={submitSettlementAccount}>
            <label className="tm-field">
              <span className="tm-field-label">Edit Existing Account</span>
              <select
                className="tm-input"
                value={accountForm.accountId}
                onChange={(event) => chooseEditableAccount(event.target.value)}
              >
                <option value="">Create new payout method</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.maskedSummary} ({account.status})
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="tm-field">
                <span className="tm-field-label">Method Type</span>
                <select
                  className="tm-input"
                  value={accountForm.methodType}
                  onChange={(event) => {
                    const methodType = event.target.value as SettlementAccountMethodType;
                    setAccountForm((current) => ({
                      ...current,
                      methodType,
                      mobileMoneyProvider:
                        methodType === "mobile_money"
                          ? current.mobileMoneyProvider || mobileMoneyProviders[0] || ""
                          : "",
                    }));
                  }}
                >
                  <option value="bank_account">Bank Account</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </label>
              <label className="tm-field">
                <span className="tm-field-label">Country</span>
                <select
                  className="tm-input"
                  value={accountForm.country}
                  onChange={(event) => {
                    const country = event.target.value;
                    const currencies = listSupportedSettlementCurrencies(country);
                    const providers = listSupportedMobileMoneyProviders(country);
                    setAccountForm((current) => ({
                      ...current,
                      country,
                      currency: currencies[0] ?? current.currency,
                      mobileMoneyProvider:
                        current.methodType === "mobile_money" ? providers[0] ?? "" : "",
                    }));
                  }}
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tm-field">
                <span className="tm-field-label">Currency</span>
                <select
                  className="tm-input"
                  value={accountForm.currency}
                  onChange={(event) =>
                    setAccountForm((current) => ({ ...current, currency: event.target.value }))
                  }
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tm-field">
                <span className="tm-field-label">Account Holder Name</span>
                <input
                  className="tm-input"
                  value={accountForm.accountHolderName}
                  onChange={(event) =>
                    setAccountForm((current) => ({
                      ...current,
                      accountHolderName: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            {accountForm.methodType === "bank_account" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="tm-field">
                  <span className="tm-field-label">Bank Name</span>
                  <input
                    className="tm-input"
                    value={accountForm.bankName}
                    onChange={(event) =>
                      setAccountForm((current) => ({ ...current, bankName: event.target.value }))
                    }
                  />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Account Number</span>
                  <input
                    className="tm-input"
                    value={accountForm.accountNumber}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        accountNumber: event.target.value,
                      }))
                    }
                    placeholder="Leave blank to retain existing masked value on update"
                  />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">IBAN</span>
                  <input
                    className="tm-input"
                    value={accountForm.iban}
                    onChange={(event) =>
                      setAccountForm((current) => ({ ...current, iban: event.target.value }))
                    }
                    placeholder="Optional"
                  />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Routing Code</span>
                  <input
                    className="tm-input"
                    value={accountForm.routingCode}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        routingCode: event.target.value,
                      }))
                    }
                    placeholder="Routing / sort code where required"
                  />
                </label>
                <label className="tm-field md:col-span-2">
                  <span className="tm-field-label">SWIFT Code</span>
                  <input
                    className="tm-input"
                    value={accountForm.swiftCode}
                    onChange={(event) =>
                      setAccountForm((current) => ({ ...current, swiftCode: event.target.value }))
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="tm-field">
                  <span className="tm-field-label">Mobile Money Provider</span>
                  <select
                    className="tm-input"
                    value={accountForm.mobileMoneyProvider}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        mobileMoneyProvider: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select provider</option>
                    {mobileMoneyProviders.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Mobile Number</span>
                  <input
                    className="tm-input"
                    value={accountForm.mobileNumber}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        mobileNumber: event.target.value,
                      }))
                    }
                    placeholder="+2348012345678"
                  />
                </label>
              </div>
            )}

            <label className="tm-tag-pill inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={accountForm.isDefault}
                onChange={(event) =>
                  setAccountForm((current) => ({ ...current, isDefault: event.target.checked }))
                }
              />
              Set as default payout method
            </label>

            <p className="tm-soft-note text-sm">
              Sensitive fields stay masked after submission. Updating a verified payout method triggers re-verification.
            </p>

            <div className="tm-inline-actions">
              <button className="tm-btn tm-btn-accent" disabled={busy} type="submit">
                Submit Payout Method
              </button>
            </div>
          </form>

          <form className="tm-panel bg-white/40 p-4" onSubmit={verifySettlementAccount}>
            <h3 className="text-base font-semibold text-slate-900">Verify OTP</h3>
            <p className="tm-muted mt-1 text-sm">
              Complete mock verification after submission. Name mismatch will reject the payout method.
            </p>
            <div className="mt-4 space-y-3">
              <label className="tm-field">
                <span className="tm-field-label">Settlement Account</span>
                <select
                  className="tm-input"
                  value={selectedAccountId}
                  onChange={(event) => setSelectedAccountId(event.target.value)}
                >
                  <option value="">Select payout method</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.maskedSummary} ({account.status})
                    </option>
                  ))}
                </select>
              </label>
              <label className="tm-field">
                <span className="tm-field-label">OTP Code</span>
                <input
                  className="tm-input"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  placeholder="6-digit OTP"
                />
              </label>
              <button className="tm-btn tm-btn-primary" disabled={busy || !selectedAccountId} type="submit">
                Verify Payout Method
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Payout Methods</h2>
        <ul className="tm-list-stack mt-4">
          {accounts.map((account) => (
            <li key={account.id} className="tm-list-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {account.maskedSummary} {account.isDefault ? "• Default" : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {account.methodType === "bank_account" ? account.bankName : account.mobileMoneyProvider} •{" "}
                    {account.country}/{account.currency}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Status: {account.status} • Name match: {account.nameMatchStatus}
                  </p>
                  {account.rejectionReason ? (
                    <p className="mt-2 text-xs text-rose-700">{account.rejectionReason}</p>
                  ) : null}
                </div>
                <div className="tm-inline-actions">
                  <button className="tm-btn tm-btn-outline" type="button" onClick={() => chooseEditableAccount(account.id)}>
                    Edit
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {accounts.length === 0 ? (
          <p className="tm-soft-note mt-3 text-sm">No payout methods yet.</p>
        ) : null}
      </section>

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Payout Method History</h2>
        <ul className="tm-list-stack mt-4">
          {accountHistory.map((item) => (
            <li key={item.id} className="tm-list-card">
              <p className="text-sm font-semibold text-slate-900">{item.action}</p>
              <p className="mt-1 text-sm text-slate-700">{item.message}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
        {accountHistory.length === 0 ? (
          <p className="tm-soft-note mt-3 text-sm">No payout method history yet.</p>
        ) : null}
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
