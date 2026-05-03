"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useToastMessage } from "@/components/common/use-toast-message";
import type {
  EligibleBooking,
  RefundStatus,
  SettlementAccount,
  SettlementAccountHistoryEntry,
  SettlementAccountMethodType,
  SettlementRecord,
  SettlementSettings,
  WalletSummary,
} from "@/modules/wallet-payouts/contracts";
import {
  listSupportedMobileMoneyProviders,
  listSupportedSettlementCurrencies,
} from "@/modules/wallet-payouts/settlement-accounts";
import { walletPayoutsClient } from "@/modules/wallet-payouts/wallet-payouts-client";

export type SettlementAccountFormState = {
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

export function createInitialAccountForm(): SettlementAccountFormState {
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

export function mapAccountToForm(account: SettlementAccount): SettlementAccountFormState {
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

const ELIGIBLE_PAGE_SIZE = 10;

export function useWalletPayoutsDetail(userId: string | undefined) {
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
  const eligiblePageCount = Math.max(1, Math.ceil(eligibleCount / ELIGIBLE_PAGE_SIZE));
  const allOnPageSelected =
    eligibleBookings.length > 0 &&
    eligibleBookings.every((item) => selectedBookingRefs.includes(item.bookingReference));

  async function loadEligibleBookings(uid: string, page: number, search: string) {
    const response = await walletPayoutsClient.listEligibleBookings(uid, {
      page,
      pageSize: ELIGIBLE_PAGE_SIZE,
      search,
    });
    setEligibleBookings(response.results);
    setEligibleCount(response.count);
    setEligibleHasNext(response.hasNext);
    setEligibleHasPrevious(response.hasPrevious);
  }

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setBusy(true);
    setMessage("");

    Promise.all([
      walletPayoutsClient.getWalletSummary(userId),
      walletPayoutsClient.getSettlementSettings(userId),
      walletPayoutsClient.listSettlements(userId),
      walletPayoutsClient.listEligibleBookings(userId),
      walletPayoutsClient.listSettlementAccounts(userId),
      walletPayoutsClient.listSettlementAccountHistory(userId),
    ])
      .then(([summaryResult, settingsResult, settlementsResult, eligibleResult, accountsResult, historyResult]) => {
        if (!active) return;
        setSummary(summaryResult);
        setSettings(settingsResult);
        setSettlements(settlementsResult);
        setEligibleBookings(eligibleResult.results);
        setEligibleCount(eligibleResult.count);
        setEligibleHasNext(eligibleResult.hasNext);
        setEligibleHasPrevious(eligibleResult.hasPrevious);
        setEligiblePage(1);
        setAccounts(accountsResult);
        setAccountHistory(historyResult);
        if (settlementsResult.length > 0) setSelectedSettlementId(settlementsResult[0].id);
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
          setMessage(error instanceof Error ? error.message : "Failed to load wallet and settlement data.");
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  async function refreshWallet() {
    if (!userId) return;
    setBusy(true);
    setMessage("");
    try {
      const [summaryResult, settlementResult, eligibleResult, accountsResult, historyResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(userId),
        walletPayoutsClient.listSettlements(userId),
        walletPayoutsClient.listEligibleBookings(userId),
        walletPayoutsClient.listSettlementAccounts(userId),
        walletPayoutsClient.listSettlementAccountHistory(userId),
      ]);
      setSummary(summaryResult);
      setSettlements(settlementResult);
      setEligibleBookings(eligibleResult.results);
      setEligibleCount(eligibleResult.count);
      setEligibleHasNext(eligibleResult.hasNext);
      setEligibleHasPrevious(eligibleResult.hasPrevious);
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
    if (!userId || !settings) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const updated = await walletPayoutsClient.updateSettlementSettings(userId, {
        autoSettleOnBookingCompletion: form.get("autoSettleOnBookingCompletion") === "on",
        reserveHoldDays: Number(form.get("reserveHoldDays") ?? settings.reserveHoldDays),
        requireAdminRefundNotification: form.get("requireAdminRefundNotification") === "on",
      });
      setSettings(updated);
      setMessage("Settlement settings updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update settlement settings.");
    } finally {
      setBusy(false);
    }
  }

  async function createSettlements(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await walletPayoutsClient.createSettlementsFromBookings(userId, {
        bookingReferences: selectedBookingRefs,
      });
      const [summaryResult, settlementResult, eligibleResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(userId),
        walletPayoutsClient.listSettlements(userId),
        walletPayoutsClient.listEligibleBookings(userId),
      ]);
      setSummary(summaryResult);
      setSettlements(settlementResult);
      setEligibleBookings(eligibleResult.results);
      setEligibleCount(eligibleResult.count);
      setEligibleHasNext(eligibleResult.hasNext);
      setEligibleHasPrevious(eligibleResult.hasPrevious);
      setSelectedBookingRefs([]);
      setEligiblePage(1);
      if (result.created.length > 0) setSelectedSettlementId(result.created[0].id);
      setMessage(`Settlement creation completed. Created: ${result.created.length}, Skipped: ${result.skipped.length}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create settlements from selected bookings.");
    } finally {
      setBusy(false);
    }
  }

  async function trackRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !selectedSettlementId) return;
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    try {
      await walletPayoutsClient.recordCancellationRefund(userId, {
        settlementId: selectedSettlementId,
        refundAmount: Number(form.get("refundAmount") ?? 0),
        reason: String(form.get("reason") ?? ""),
        status: String(form.get("status") ?? "partner_notified") as RefundStatus,
      });
      const [summaryResult, settlementResult] = await Promise.all([
        walletPayoutsClient.getWalletSummary(userId),
        walletPayoutsClient.listSettlements(userId),
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
    if (!userId) return;
    setBusy(true);
    setMessage("");
    try {
      const csv = await walletPayoutsClient.downloadSettlementStatement(userId, settlementId);
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
      setMessage(error instanceof Error ? error.message : "Failed to download settlement statement.");
    } finally {
      setBusy(false);
    }
  }

  async function submitSettlementAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setBusy(true);
    setSubmittingPayoutMethod(true);
    setMessage("");
    try {
      const result = await walletPayoutsClient.submitSettlementAccount(userId, {
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
        walletPayoutsClient.listSettlementAccounts(userId),
        walletPayoutsClient.listSettlementAccountHistory(userId),
      ]);
      setAccounts(accountsResult);
      setAccountHistory(historyResult);
      setSelectedAccountId(result.account.id);
      setAccountForm(mapAccountToForm(result.account));
      setOtpCode("");
      const isDev = process.env.NODE_ENV !== "production";
      const channels = result.otpDeliveryChannels?.length ? result.otpDeliveryChannels.join(" and ") : "email";
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
    if (!userId || !selectedAccountId) return;
    setBusy(true);
    setMessage("");
    try {
      const verified = await walletPayoutsClient.verifySettlementAccountOtp(userId, {
        accountId: selectedAccountId,
        otpCode,
      });
      const [accountsResult, historyResult] = await Promise.all([
        walletPayoutsClient.listSettlementAccounts(userId),
        walletPayoutsClient.listSettlementAccountHistory(userId),
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
    if (!userId) return;
    setBusy(true);
    setMessage("");
    try {
      await walletPayoutsClient.archiveSettlementAccount(userId, accountId);
      const [accountsResult, historyResult] = await Promise.all([
        walletPayoutsClient.listSettlementAccounts(userId),
        walletPayoutsClient.listSettlementAccountHistory(userId),
      ]);
      setAccounts(accountsResult);
      setAccountHistory(historyResult);
      if (selectedAccountId === accountId) setSelectedAccountId(accountsResult[0]?.id ?? "");
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
    if (!target) return;
    setAccountForm(mapAccountToForm(target));
    setOtpCode("");
  }

  return {
    summary,
    settings,
    settlements,
    eligibleBookings,
    selectedBookingRefs,
    eligibleSearch,
    eligiblePage,
    eligibleCount,
    eligibleHasNext,
    eligibleHasPrevious,
    eligiblePageCount,
    allOnPageSelected,
    accounts,
    accountHistory,
    showFullHistory,
    busy,
    submittingPayoutMethod,
    statementPreview,
    showFullSettlements,
    selectedSettlementId,
    selectedAccountId,
    otpCode,
    accountForm,
    currencyOptions,
    mobileMoneyProviders,
    setSelectedBookingRefs,
    setEligibleSearch,
    setEligiblePage,
    setShowFullHistory,
    setShowFullSettlements,
    setSelectedSettlementId,
    setSelectedAccountId,
    setOtpCode,
    setAccountForm,
    loadEligibleBookings,
    refreshWallet,
    saveSettings,
    createSettlements,
    trackRefund,
    downloadStatement,
    submitSettlementAccount,
    verifySettlementAccount,
    archiveSettlementAccount,
    startNewSettlementAccount,
    chooseEditableAccount,
  };
}
