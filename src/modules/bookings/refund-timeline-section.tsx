import type { RefundTimelineEntry, RefundTimelineStatus } from "@/modules/bookings/contracts";

function refundStatusBadgeClass(status: RefundTimelineStatus): string {
  const map: Record<RefundTimelineStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    requested: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    settled: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700",
    not_required: "bg-slate-100 text-slate-600",
  };
  return map[status] ?? "bg-slate-100 text-slate-700";
}

function refundStatusLabel(status: RefundTimelineStatus): string {
  const map: Record<RefundTimelineStatus, string> = {
    pending: "Refund pending",
    requested: "Refund requested",
    approved: "Refund approved",
    settled: "Refund settled",
    rejected: "Refund rejected",
    not_required: "No refund required",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  timeline: RefundTimelineEntry[];
};

export function RefundTimelineSection({ timeline }: Props) {
  if (!timeline || timeline.length === 0) return null;
  const latest = timeline[timeline.length - 1];

  return (
    <section className="tm-panel p-6" data-testid="refund-timeline-section">
      <h2 className="tm-section-title">Refund Status</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${refundStatusBadgeClass(latest.status)}`}
        >
          {refundStatusLabel(latest.status)}
        </span>
        {latest.status !== "not_required" && (
          <span className="text-sm text-slate-700">
            {formatCurrency(latest.amount, latest.currency)}
            {latest.maxRefundableAmount && latest.maxRefundableAmount !== latest.amount
              ? ` of ${formatCurrency(latest.maxRefundableAmount, latest.currency)} eligible`
              : ""}
          </span>
        )}
      </div>

      {timeline.length > 1 && (
        <ol className="mt-4 space-y-2 border-l border-slate-200 pl-4">
          {timeline.map((entry, index) => (
            <li key={`${entry.status}-${index}`} className="text-xs text-slate-600">
              <span className="font-medium capitalize text-slate-800">{entry.status.replace(/_/g, " ")}</span>
              {" — "}
              {formatDateTime(entry.updatedAt)}
            </li>
          ))}
        </ol>
      )}

      {latest.reason ? <p className="mt-3 text-xs text-slate-500">Reason: {latest.reason}</p> : null}
    </section>
  );
}
