"use client";

import { FormEvent } from "react";

import { formatDateTimeUTC } from "@/lib/format";
import type {
  SettlementAccount,
  SettlementAccountHistoryEntry,
  SettlementAccountMethodType,
} from "@/modules/wallet-payouts/contracts";
import {
  listSupportedMobileMoneyProviders,
  listSupportedSettlementCurrencies,
  listSupportedSettlementCountries,
} from "@/modules/wallet-payouts/settlement-accounts";
import type { SettlementAccountFormState } from "./use-wallet-payouts-detail";

const COUNTRY_OPTIONS = listSupportedSettlementCountries();

type Props = {
  accounts: SettlementAccount[];
  accountHistory: SettlementAccountHistoryEntry[];
  accountForm: SettlementAccountFormState;
  selectedAccountId: string;
  otpCode: string;
  busy: boolean;
  submittingPayoutMethod: boolean;
  showFullHistory: boolean;
  currencyOptions: string[];
  mobileMoneyProviders: string[];
  onSetAccountForm: React.Dispatch<React.SetStateAction<SettlementAccountFormState>>;
  onSetSelectedAccountId: (v: string) => void;
  onSetOtpCode: (v: string) => void;
  onSetShowFullHistory: (v: boolean) => void;
  onSubmitAccount: (event: FormEvent<HTMLFormElement>) => void;
  onVerifyAccount: (event: FormEvent<HTMLFormElement>) => void;
  onArchiveAccount: (accountId: string) => void;
  onStartNew: () => void;
  onChooseEditable: (accountId: string) => void;
};

export function SettlementAccountSection({
  accounts,
  accountHistory,
  accountForm,
  selectedAccountId,
  otpCode,
  busy,
  submittingPayoutMethod,
  showFullHistory,
  currencyOptions,
  mobileMoneyProviders,
  onSetAccountForm,
  onSetSelectedAccountId,
  onSetOtpCode,
  onSetShowFullHistory,
  onSubmitAccount,
  onVerifyAccount,
  onArchiveAccount,
  onStartNew,
  onChooseEditable,
}: Props) {
  return (
    <>
      <section className="tm-panel p-6">
        <div className="tm-section-head">
          <div>
            <h2 className="tm-section-title">Settlement Account Verification</h2>
            <p className="tm-muted mt-1 text-sm">
              Add bank or mobile money payout methods, verify them with OTP, and keep sensitive details masked.
            </p>
          </div>
          <button className="tm-btn tm-btn-outline" type="button" onClick={onStartNew}>
            Add New Payout Method
          </button>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <form className="space-y-4" onSubmit={onSubmitAccount}>
            <label className="tm-field">
              <span className="tm-field-label">Edit Existing Account</span>
              <select
                className="tm-input"
                value={accountForm.accountId}
                onChange={(e) => onChooseEditable(e.target.value)}
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
                  onChange={(e) => {
                    const methodType = e.target.value as SettlementAccountMethodType;
                    onSetAccountForm((current) => ({
                      ...current,
                      methodType,
                      mobileMoneyProvider:
                        methodType === "mobile_money"
                          ? current.mobileMoneyProvider || listSupportedMobileMoneyProviders(current.country)[0] || ""
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
                  onChange={(e) => {
                    const country = e.target.value;
                    const currencies = listSupportedSettlementCurrencies(country);
                    const providers = listSupportedMobileMoneyProviders(country);
                    onSetAccountForm((current) => ({
                      ...current,
                      country,
                      currency: currencies[0] ?? current.currency,
                      mobileMoneyProvider:
                        current.methodType === "mobile_money" ? providers[0] ?? "" : "",
                    }));
                  }}
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </label>
              <label className="tm-field">
                <span className="tm-field-label">Currency</span>
                <select
                  className="tm-input"
                  value={accountForm.currency}
                  onChange={(e) => onSetAccountForm((current) => ({ ...current, currency: e.target.value }))}
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </label>
              <label className="tm-field">
                <span className="tm-field-label">Account Holder Name</span>
                <input
                  className="tm-input"
                  value={accountForm.accountHolderName}
                  onChange={(e) => onSetAccountForm((current) => ({ ...current, accountHolderName: e.target.value }))}
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
                    onChange={(e) => onSetAccountForm((current) => ({ ...current, bankName: e.target.value }))}
                  />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Account Number</span>
                  <input
                    className="tm-input"
                    value={accountForm.accountNumber}
                    onChange={(e) => onSetAccountForm((current) => ({ ...current, accountNumber: e.target.value }))}
                    placeholder="Leave blank to retain existing masked value on update"
                  />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">IBAN</span>
                  <input
                    className="tm-input"
                    value={accountForm.iban}
                    onChange={(e) => onSetAccountForm((current) => ({ ...current, iban: e.target.value }))}
                    placeholder="Optional"
                  />
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Routing Code</span>
                  <input
                    className="tm-input"
                    value={accountForm.routingCode}
                    onChange={(e) => onSetAccountForm((current) => ({ ...current, routingCode: e.target.value }))}
                    placeholder="Routing / sort code where required"
                  />
                </label>
                <label className="tm-field md:col-span-2">
                  <span className="tm-field-label">SWIFT Code</span>
                  <input
                    className="tm-input"
                    value={accountForm.swiftCode}
                    onChange={(e) => onSetAccountForm((current) => ({ ...current, swiftCode: e.target.value }))}
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
                    onChange={(e) => onSetAccountForm((current) => ({ ...current, mobileMoneyProvider: e.target.value }))}
                  >
                    <option value="">Select provider</option>
                    {mobileMoneyProviders.map((provider) => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </label>
                <label className="tm-field">
                  <span className="tm-field-label">Mobile Number</span>
                  <input
                    className="tm-input"
                    value={accountForm.mobileNumber}
                    onChange={(e) => onSetAccountForm((current) => ({ ...current, mobileNumber: e.target.value }))}
                    placeholder="+2348012345678"
                  />
                </label>
              </div>
            )}

            <label className="tm-tag-pill inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={accountForm.isDefault}
                onChange={(e) => onSetAccountForm((current) => ({ ...current, isDefault: e.target.checked }))}
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

          <form className="tm-panel bg-white/40 p-4" onSubmit={onVerifyAccount}>
            <h3 className="text-base font-semibold text-slate-900">Verify OTP</h3>
            <p className="tm-muted mt-1 text-sm">
              Complete verification after submission. A name mismatch may cause the payout method to be rejected.
            </p>
            <div className="mt-4 space-y-3">
              <label className="tm-field">
                <span className="tm-field-label">Settlement Account</span>
                <select
                  className="tm-input"
                  value={selectedAccountId}
                  onChange={(e) => onSetSelectedAccountId(e.target.value)}
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
                  onChange={(e) => onSetOtpCode(e.target.value)}
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
                  <button className="tm-btn tm-btn-outline" type="button" onClick={() => onChooseEditable(account.id)}>
                    Edit
                  </button>
                  <button className="tm-btn tm-btn-outline" type="button" disabled={busy} onClick={() => void onArchiveAccount(account.id)}>
                    Archive
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {accounts.length === 0 ? <p className="tm-soft-note mt-3 text-sm">No payout methods yet.</p> : null}
      </section>

      <section className="tm-panel p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="tm-section-title">Payout Method History</h2>
          {accountHistory.length > 5 ? (
            <button
              className="tm-btn tm-btn-outline px-3 py-1.5 text-xs"
              onClick={() => onSetShowFullHistory(!showFullHistory)}
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
              <p className="mt-1 text-xs text-slate-500">{formatDateTimeUTC(item.createdAt)}</p>
            </li>
          ))}
        </ul>
        {accountHistory.length === 0 ? <p className="tm-soft-note mt-3 text-sm">No payout method history yet.</p> : null}
      </section>
    </>
  );
}
