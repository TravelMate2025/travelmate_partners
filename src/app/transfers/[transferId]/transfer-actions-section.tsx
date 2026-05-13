"use client";

import { formatDateTimeUTC } from "@/lib/format";
import type { ListingAppeal, TransferListing, TransferStatus } from "@/modules/transfers/contracts";

type Props = {
  item: TransferListing;
  saving: boolean;
  canSubmit: boolean;
  appeal: ListingAppeal | null;
  showAppealForm: boolean;
  appealMessage: string;
  appealMessageTouched: boolean;
  submittingAppeal: boolean;
  onSetShowAppealForm: (v: boolean) => void;
  onSetAppealMessage: (v: string) => void;
  onSetAppealMessageTouched: (v: boolean) => void;
  onSubmitAppeal: () => void;
  onChangeStatus: (next: TransferStatus) => void;
  onArchive: () => void;
  onNavigatePricing: () => void;
  onBack: () => void;
};

export function TransferActionsSection({
  item,
  saving,
  canSubmit,
  appeal,
  showAppealForm,
  appealMessage,
  appealMessageTouched,
  submittingAppeal,
  onSetShowAppealForm,
  onSetAppealMessage,
  onSetAppealMessageTouched,
  onSubmitAppeal,
  onChangeStatus,
  onArchive,
  onNavigatePricing,
  onBack,
}: Props) {
  return (
    <section className="tm-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="tm-section-title">Listing Actions</h2>
          {item.status === "paused_by_admin" ? (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-amber-700">
                {item.moderationFeedback
                  ? `Reason: ${item.moderationFeedback}`
                  : "This listing has been suspended by the platform. No changes can be made until the restriction is lifted."}
              </p>
              {appeal === null || appeal.status === "resolved" ? (
                showAppealForm ? (
                  <div className="space-y-2">
                    <textarea
                      className="tm-input w-full text-sm"
                      placeholder="Explain why this listing should be reinstated..."
                      rows={3}
                      value={appealMessage}
                      onChange={(event) => {
                        onSetAppealMessage(event.target.value);
                        if (!appealMessageTouched) onSetAppealMessageTouched(true);
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        className="tm-btn tm-btn-primary text-sm"
                        disabled={submittingAppeal || !appealMessageTouched || !appealMessage.trim()}
                        onClick={() => void onSubmitAppeal()}
                        type="button"
                      >
                        {submittingAppeal ? "Submitting..." : "Submit Appeal"}
                      </button>
                      <button
                        className="tm-btn tm-btn-outline text-sm"
                        disabled={submittingAppeal}
                        onClick={() => {
                          onSetShowAppealForm(false);
                          onSetAppealMessage("");
                          onSetAppealMessageTouched(false);
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {appeal?.resolution === "dismissed" ? (
                      <p className="text-sm text-rose-700">
                        Previous appeal was dismissed
                        {appeal.resolutionNote ? ` (${appeal.resolutionNote})` : ""}.
                      </p>
                    ) : null}
                    <button
                      className="tm-btn tm-btn-outline text-sm"
                      onClick={() => onSetShowAppealForm(true)}
                      type="button"
                    >
                      {appeal ? "Submit New Appeal" : "Submit Appeal"}
                    </button>
                  </div>
                )
              ) : (
                <p className="text-sm text-amber-600">
                  Existing appeal {appeal.status === "under_review" ? "is under review" : "is pending review"}.{" "}
                  Submitted on {formatDateTimeUTC(appeal.createdAt)}.
                </p>
              )}
            </div>
          ) : null}
          {item.status === "rejected" && item.moderationFeedback ? (
            <p className="mt-2 text-sm text-rose-700">Feedback: {item.moderationFeedback}</p>
          ) : null}
          {item.status !== "paused_by_admin" && item.status !== "draft" && item.status !== "rejected" ? (
            <p className="mt-2 text-sm text-amber-700">
              Editing is only available in draft or rejected status. Move this listing to draft before editing.
            </p>
          ) : null}
        </div>

        <div className="tm-inline-actions">
          {canSubmit ? (
            <button
              className="tm-btn tm-btn-accent"
              disabled={saving}
              onClick={() => void onChangeStatus("pending")}
              type="button"
            >
              Submit for Review
            </button>
          ) : null}
          {item.status === "approved" ? (
            <button
              className="tm-btn tm-btn-primary"
              disabled={saving}
              onClick={() => void onChangeStatus("live")}
              type="button"
            >
              Go Live
            </button>
          ) : null}
          {item.status === "live" ? (
            <button
              className="tm-btn tm-btn-outline"
              disabled={saving}
              onClick={() => void onChangeStatus("paused")}
              type="button"
            >
              Pause
            </button>
          ) : null}
          {item.status === "paused" ? (
            <>
              <button
                className="tm-btn tm-btn-primary"
                disabled={saving}
                onClick={() => void onChangeStatus("live")}
                type="button"
              >
                Resume
              </button>
              <button
                className="tm-btn tm-btn-outline"
                disabled={saving}
                onClick={() => void onChangeStatus("draft")}
                type="button"
              >
                Move to Draft
              </button>
            </>
          ) : null}
          {item.status !== "archived" && item.status !== "paused_by_admin" ? (
            <button
              className="tm-btn tm-btn-outline"
              disabled={saving}
              onClick={() => void onArchive()}
              type="button"
            >
              Archive
            </button>
          ) : null}
          {item.status === "archived" ? (
            <button
              className="tm-btn tm-btn-outline"
              disabled={saving}
              onClick={() => void onChangeStatus("draft")}
              type="button"
            >
              Restore to Draft
            </button>
          ) : null}
          <button className="tm-btn tm-btn-outline" onClick={onNavigatePricing} type="button">
            Pricing & Schedule
          </button>
          <button className="tm-btn tm-btn-outline" onClick={onBack} type="button">
            Back to Transfers
          </button>
        </div>
      </div>
    </section>
  );
}
