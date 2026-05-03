"use client";

import Link from "next/link";

import { PartnerShell } from "@/components/common/partner-shell";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import { SettlementAccountSection } from "./settlement-account-section";
import { SettlementBookingsSection } from "./settlement-bookings-section";
import { SettlementHistorySection } from "./settlement-history-section";
import { useWalletPayoutsDetail } from "./use-wallet-payouts-detail";

export default function WalletPayoutsPage() {
  const { user, loading } = usePartnerAccess();
  const detail = useWalletPayoutsDetail(user?.id);

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading wallet...</p>
        </div>
      </main>
    );
  }

  const { summary, settings } = detail;

  return (
    <PartnerShell
      title="Wallet & Settlements"
      description="Track booking-completion settlements, monitor deductions, and manage payout method verification."
      headerExtra={
        <div className="tm-inline-actions">
          <button
            className="tm-btn tm-btn-primary"
            type="button"
            disabled={detail.busy}
            onClick={() => void detail.refreshWallet()}
          >
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

      <SettlementAccountSection
        accounts={detail.accounts}
        accountHistory={detail.accountHistory}
        accountForm={detail.accountForm}
        selectedAccountId={detail.selectedAccountId}
        otpCode={detail.otpCode}
        busy={detail.busy}
        submittingPayoutMethod={detail.submittingPayoutMethod}
        showFullHistory={detail.showFullHistory}
        currencyOptions={detail.currencyOptions}
        mobileMoneyProviders={detail.mobileMoneyProviders}
        onSetAccountForm={detail.setAccountForm}
        onSetSelectedAccountId={detail.setSelectedAccountId}
        onSetOtpCode={detail.setOtpCode}
        onSetShowFullHistory={detail.setShowFullHistory}
        onSubmitAccount={detail.submitSettlementAccount}
        onVerifyAccount={detail.verifySettlementAccount}
        onArchiveAccount={detail.archiveSettlementAccount}
        onStartNew={detail.startNewSettlementAccount}
        onChooseEditable={detail.chooseEditableAccount}
      />

      <form className="tm-panel p-6" onSubmit={detail.saveSettings}>
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
          <button className="tm-btn tm-btn-primary" disabled={detail.busy} type="submit">
            Save Settlement Settings
          </button>
        </div>
      </form>

      <SettlementBookingsSection
        eligibleBookings={detail.eligibleBookings}
        selectedBookingRefs={detail.selectedBookingRefs}
        eligibleSearch={detail.eligibleSearch}
        eligiblePage={detail.eligiblePage}
        eligibleCount={detail.eligibleCount}
        eligiblePageCount={detail.eligiblePageCount}
        eligibleHasNext={detail.eligibleHasNext}
        eligibleHasPrevious={detail.eligibleHasPrevious}
        allOnPageSelected={detail.allOnPageSelected}
        busy={detail.busy}
        onCreateSettlements={detail.createSettlements}
        onSetSelectedBookingRefs={detail.setSelectedBookingRefs}
        onSearchChange={(search) => {
          detail.setEligibleSearch(search);
          detail.setEligiblePage(1);
          if (user) void detail.loadEligibleBookings(user.id, 1, search);
        }}
        onPageChange={(page) => {
          detail.setEligiblePage(page);
          if (user) void detail.loadEligibleBookings(user.id, page, detail.eligibleSearch);
        }}
      />

      <SettlementHistorySection
        settlements={detail.settlements}
        summary={summary}
        selectedSettlementId={detail.selectedSettlementId}
        showFullSettlements={detail.showFullSettlements}
        statementPreview={detail.statementPreview}
        busy={detail.busy}
        onSetSelectedSettlementId={detail.setSelectedSettlementId}
        onSetShowFullSettlements={detail.setShowFullSettlements}
        onTrackRefund={detail.trackRefund}
        onDownloadStatement={detail.downloadStatement}
      />

      {detail.busy ? <p className="tm-soft-note text-sm">Processing wallet action...</p> : null}
    </PartnerShell>
  );
}
