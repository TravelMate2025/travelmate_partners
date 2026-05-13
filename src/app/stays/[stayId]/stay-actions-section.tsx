"use client";

import { formatDateTimeUTC } from "@/lib/format";
import type { ListingAppeal, StayListing, StayStatus } from "@/modules/stays/contracts";

type Props = {
  stay: StayListing;
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
  onChangeStatus: (next: StayStatus) => void;
  onArchive: () => void;
  onBack: () => void;
};

export function StayActionsSection({
  stay,
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
  onBack,
}: Props) {
  return (
    <section className="tm-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="tm-section-title">Listing Actions</h2>
          {stay.status === "paused_by_admin" ? (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-amber-700">
                {stay.moderationFeedback
                  ? `Reason: ${stay.moderationFeedback}`
                  : "This listing has been suspended by the platform. No changes can be made until the restriction is lifted."}
              </p>
              {appeal === null || appeal.status === "resolved" ? (
                showAppealForm ? (
                  <div className="space-y-2">
                    <textarea
                      className="tm-input w-full text-sm"
                      placeholder="Explain why this listing should be reinstated…"
                      rows={3}
                      value={appealMessage}
                      onChange={(e) => {
                        onSetAppealMessage(e.target.value);
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
                        {submittingAppeal ? "Submitting…" : "Submit Appeal"}
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
          {stay.status === "rejected" && stay.moderationFeedback ? (
            <p className="mt-2 text-sm text-rose-700">Feedback: {stay.moderationFeedback}</p>
          ) : null}
          {!canSubmit && stay.status !== "paused_by_admin" && stay.status !== "draft" && stay.status !== "rejected" ? (
            <p className="mt-2 text-sm text-amber-700">
              Editing is only available in draft or rejected status. Move this listing to draft before editing.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
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
          {stay.status === "approved" ? (
            <button
              className="tm-btn tm-btn-primary"
              disabled={saving}
              onClick={() => void onChangeStatus("live")}
              type="button"
            >
              Go Live
            </button>
          ) : null}
          {stay.status === "live" ? (
            <button
              className="tm-btn tm-btn-outline"
              disabled={saving}
              onClick={() => void onChangeStatus("paused")}
              type="button"
            >
              Pause
            </button>
          ) : null}
          {stay.status === "paused" ? (
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
          {stay.status !== "archived" && stay.status !== "paused_by_admin" && stay.status !== "paused" ? (
            <button
              className="tm-btn tm-btn-outline"
              disabled={saving}
              onClick={() => void onArchive()}
              type="button"
            >
              Archive
            </button>
          ) : null}
          {stay.status === "archived" ? (
            <button
              className="tm-btn tm-btn-outline"
              disabled={saving}
              onClick={() => void onChangeStatus("draft")}
              type="button"
            >
              Restore to Draft
            </button>
          ) : null}
          <button className="tm-btn tm-btn-outline" onClick={onBack} type="button">
            Back to Stays
          </button>
        </div>
      </div>
    </section>
  );
}
