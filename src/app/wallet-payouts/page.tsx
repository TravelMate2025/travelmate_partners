"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type {
  EligibleBooking,
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
  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>([]);
  const [selectedBookingRefs, setSelectedBookingRefs] = useState<string[]>([]);
  const [eligibleSearch, setEligibleSearch] = useState("");
  const [eligiblePage, setEligiblePage] = useState(1);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [eligibleHasNext, setEligibleHasNext] = useState(false);
  const [eligibleHasPrevious, setEligibleHasPrevious] = useState(false);
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [accountHistory, setAccountHistory] = useState<SettlementAccountHistoryEntry[]>([]);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submittingPayoutMethod, setSubmittingPayoutMethod] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [statementPreview, setStatementPreview] = useState("");
  const [showFullSettlements, setShowFullSettlements] = useState(false);
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

  async function loadEligibleBookings(userId: string, page: number, search: string) {
    const response = await walletPayoutsClient.listEligibleBookings(userId, {
      page,
      pageSize: eligiblePageSize,
      search,
    });
    setEligibleBookings(response.results);
    setEligibleCount(response.count);
    setEligibleHasNext(response.hasNext);
    setEligibleHasPrevious(response.hasPrevious);
  }
  const eligiblePageSize = 10;
  const eligiblePageCount = Math.max(1, Math.ceil(eligibleCount / eligiblePageSize));
  const allOnPageSelected =
    eligibleBookings.length > 0 &&
    eligibleBookings.every((item) => selectedBookingRefs.includes(item.bookingReference));

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
      walletPayoutsClient.listEligibleBookings(user.id),
      walletPayoutsClient.listSettlementAccounts(user.id),
      walletPayoutsClient.listSettlementAccountHistory(user.id),
    ])
      .then(([summaryResult, settingsResult, settlementsResult, eligibleBookingsResult, accountsResult, historyResult]) => {
        if (!active) {
          return;
        }
        setSummary(summaryResult);
        setSettings(settingsResult);
        setSettlements(settlementsResult);
        setEligibleBookings(eligibleBookingsResult.results);
        setEligibleCount(eligibleBookingsResult.count);
        setEligibleHasNext(eligibleBookingsResult.hasNext);
        setEligibleHasPrevious(eligibleBookingsResult.hasPrevious);
        setEligiblePage(1);
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
      const [summaryResult, settlementResult, eligibleBookingsResult, accountsResult, historyResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(user.id),
        walletPayoutsClient.listSettlements(user.id),
        walletPayoutsClient.listEligibleBookings(user.id),
        walletPayoutsClient.listSettlementAccounts(user.id),
        walletPayoutsClient.listSettlementAccountHistory(user.id),
      ]);
      setSummary(summaryResult);
      setSettlements(settlementResult);
      setEligibleBookings(eligibleBookingsResult.results);
      setEligibleCount(eligibleBookingsResult.count);
      setEligibleHasNext(eligibleBookingsResult.hasNext);
      setEligibleHasPrevious(eligibleBookingsResult.hasPrevious);
      setEligiblePage(1);
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

    setBusy(true);
    setMessage("");

    try {
      const result = await walletPayoutsClient.createSettlementsFromBookings(user.id, {
        bookingReferences: selectedBookingRefs,
      });
      const [summaryResult, settlementResult, eligibleBookingsResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(user.id),
        walletPayoutsClient.listSettlements(user.id),
        walletPayoutsClient.listEligibleBookings(user.id),
      ]);
      setSummary(summaryResult);
      setSettlements(settlementResult);
      setEligibleBookings(eligibleBookingsResult.results);
      setEligibleCount(eligibleBookingsResult.count);
      setEligibleHasNext(eligibleBookingsResult.hasNext);
      setEligibleHasPrevious(eligibleBookingsResult.hasPrevious);
      setSelectedBookingRefs([]);
      setEligiblePage(1);
      if (result.created.length > 0) {
        setSelectedSettlementId(result.created[0].id);
      }
      setMessage(
        `Settlement creation completed. Created: ${result.created.length}, Skipped: ${result.skipped.length}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to create settlements from selected bookings.",
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
    setSubmittingPayoutMethod(true);
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
      const isDev = process.env.NODE_ENV !== "production";
      const channels = result.otpDeliveryChannels?.length
        ? result.otpDeliveryChannels.join(" and ")
        : "email";
      setMessage(
        isDev && result.otpCodeHint
          ? `Settlement account submitted. Verification code sent via ${channels}. Dev hint: ${result.otpCodeHint}`
          : `Settlement account submitted. Check your ${channels} for the verification code.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit settlement account.");
    } finally {
      setSubmittingPayoutMethod(false);
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

  async function archiveSettlementAccount(accountId: string) {
    if (!user) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await walletPayoutsClient.archiveSettlementAccount(user.id, accountId);
      const [accountsResult, historyResult] = await Promise.all([
        walletPayoutsClient.listSettlementAccounts(user.id),
        walletPayoutsClient.listSettlementAccountHistory(user.id),
      ]);
      setAccounts(accountsResult);
      setAccountHistory(historyResult);
      if (selectedAccountId === accountId) {
        setSelectedAccountId(accountsResult[0]?.id ?? "");
      }
      setMessage("Payout method archived.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to archive payout method.");
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
                {submittingPayoutMethod ? "Submitting payout method..." : "Submit Payout Method"}
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
                  <button className="tm-btn tm-btn-outline" type="button" disabled={busy} onClick={() => void archiveSettlementAccount(account.id)}>
                    Archive
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="tm-section-title">Payout Method History</h2>
          {accountHistory.length > 5 ? (
            <button
              className="tm-btn tm-btn-outline px-3 py-1.5 text-xs"
              onClick={() => setShowFullHistory((current) => !current)}
              type="button"
            >
              {showFullHistory ? "Show Recent Only" : "Show Full History"}
            </button>
          ) : null}
        </div>
        <ul className="tm-list-stack mt-4 max-h-80 overflow-y-auto pr-1">
          {(showFullHistory ? accountHistory : accountHistory.slice(0, 5)).map((item) => (
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
        <h2 className="tm-section-title">Create Settlements From Completed Bookings</h2>
        <p className="tm-muted mt-1 text-sm">
          Select one or more completed bookings from the server-provided list.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            className="tm-input max-w-sm"
            onChange={async (event) => {
              const nextSearch = event.target.value;
              setEligibleSearch(nextSearch);
              setEligiblePage(1);
              if (user) {
                await loadEligibleBookings(user.id, 1, nextSearch);
              }
            }}
            placeholder="Search booking reference"
            value={eligibleSearch}
          />
          <span className="text-xs text-slate-500">Selected: {selectedBookingRefs.length}</span>
          <button
            className="tm-btn tm-btn-outline px-3 py-1.5 text-xs"
            disabled={eligibleBookings.length === 0}
            onClick={() => {
              if (allOnPageSelected) {
                setSelectedBookingRefs((current) =>
                  current.filter(
                    (ref) => !eligibleBookings.some((item) => item.bookingReference === ref),
                  ),
                );
                return;
              }
              setSelectedBookingRefs((current) => {
                const next = new Set(current);
                for (const item of eligibleBookings) {
                  next.add(item.bookingReference);
                }
                return Array.from(next);
              });
            }}
            type="button"
          >
            {allOnPageSelected ? "Clear Page" : "Select Page"}
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {eligibleBookings.length === 0 ? (
            <p className="text-sm text-slate-500">No eligible completed bookings found.</p>
          ) : (
            eligibleBookings.map((booking) => (
              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2" key={booking.id}>
                <span className="text-sm text-slate-700">
                  {booking.bookingReference} • {booking.grossAmount} {booking.currency}
                  {booking.sourceCurrency && booking.sourceCurrency !== booking.currency ? (
                    <span className="ml-1 text-xs text-slate-500">
                      (from {booking.sourceGrossAmount} {booking.sourceCurrency})
                    </span>
                  ) : null}
                  {booking.convertible === false ? (
                    <span className="ml-1 text-xs text-rose-700">
                      {booking.conversionError ?? "Missing conversion rate"}
                    </span>
                  ) : null}
                </span>
                <input
                  checked={selectedBookingRefs.includes(booking.bookingReference)}
                  disabled={booking.convertible === false}
                  onChange={(event) => {
                    setSelectedBookingRefs((current) =>
                      event.target.checked
                        ? [...current, booking.bookingReference]
                        : current.filter((ref) => ref !== booking.bookingReference),
                    );
                  }}
                  type="checkbox"
                />
              </label>
            ))
          )}
        </div>
        {eligibleCount > 0 ? (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {eligiblePage} of {eligiblePageCount} ({eligibleCount} booking
              {eligibleCount === 1 ? "" : "s"})
            </span>
            <div className="flex gap-2">
              <button
                className="tm-btn tm-btn-outline px-3 py-1.5 text-xs"
                disabled={!eligibleHasPrevious}
                onClick={async () => {
                  if (!user || !eligibleHasPrevious) return;
                  const nextPage = Math.max(1, eligiblePage - 1);
                  setEligiblePage(nextPage);
                  await loadEligibleBookings(user.id, nextPage, eligibleSearch);
                }}
                type="button"
              >
                Previous
              </button>
              <button
                className="tm-btn tm-btn-outline px-3 py-1.5 text-xs"
                disabled={!eligibleHasNext}
                onClick={async () => {
                  if (!user || !eligibleHasNext) return;
                  const nextPage = Math.min(eligiblePageCount, eligiblePage + 1);
                  setEligiblePage(nextPage);
                  await loadEligibleBookings(user.id, nextPage, eligibleSearch);
                }}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
        <div className="tm-inline-actions mt-4">
          <button className="tm-btn tm-btn-accent" disabled={busy || selectedBookingRefs.length === 0} type="submit">
            Create Settlements
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="tm-section-title">Settlement History</h2>
          {settlements.length > 8 ? (
            <button
              className="tm-btn tm-btn-outline px-3 py-1.5 text-xs"
              onClick={() => setShowFullSettlements((current) => !current)}
              type="button"
            >
              {showFullSettlements ? "Show Recent Only" : "Show Full History"}
            </button>
          ) : null}
        </div>
        <ul className="tm-list-stack mt-4 max-h-[28rem] overflow-y-auto pr-1">
          {(showFullSettlements ? settlements : settlements.slice(0, 8)).map((item) => (
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
