"use client";

import { FormEvent } from "react";

import type { SettlementRecord, WalletSummary } from "@/modules/wallet-payouts/contracts";

type Props = {
  settlements: SettlementRecord[];
  summary: WalletSummary | null;
  selectedSettlementId: string;
  showFullSettlements: boolean;
  statementPreview: string;
  busy: boolean;
  onSetSelectedSettlementId: (v: string) => void;
  onSetShowFullSettlements: (v: boolean) => void;
  onTrackRefund: (event: FormEvent<HTMLFormElement>) => void;
  onDownloadStatement: (settlementId: string) => void;
};

export function SettlementHistorySection({
  settlements,
  summary,
  selectedSettlementId,
  showFullSettlements,
  statementPreview,
  busy,
  onSetSelectedSettlementId,
  onSetShowFullSettlements,
  onTrackRefund,
  onDownloadStatement,
}: Props) {
  return (
    <>
      <form className="tm-panel p-6" onSubmit={onTrackRefund}>
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
              onChange={(e) => onSetSelectedSettlementId(e.target.value)}
            >
              <option value="">Select settlement</option>
              {settlements.map((item) => (
                <option key={item.id} value={item.id}>{item.settlementReference}</option>
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
              onClick={() => onSetShowFullSettlements(!showFullSettlements)}
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
                  <button
                    className="tm-btn tm-btn-outline"
                    type="button"
                    disabled={busy}
                    onClick={() => void onDownloadStatement(item.id)}
                  >
                    Download Statement
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {settlements.length === 0 ? <p className="tm-soft-note mt-3 text-sm">No settlements yet.</p> : null}
      </section>

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Statement Preview</h2>
        <textarea className="tm-input mt-3 min-h-32 font-mono text-xs" value={statementPreview} readOnly />
      </section>
    </>
  );
}
