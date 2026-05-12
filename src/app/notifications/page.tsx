"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import { notificationsClient } from "@/modules/notifications/notifications-client";
import type {
  NotificationEventType,
  PartnerNotification,
} from "@/modules/notifications/contracts";

type ViewFilter = "all" | "unread" | "read";

type EventPreset = {
  eventType: NotificationEventType;
  label: string;
  contextLabel: string;
};

const EVENT_PRESETS: EventPreset[] = [
  {
    eventType: "verification_status_updated",
    label: "Verification Update",
    contextLabel: "in_review",
  },
  {
    eventType: "listing_moderation_updated",
    label: "Moderation Update",
    contextLabel: "Stay listing flagged for correction",
  },
  {
    eventType: "settlement_refund_status_updated",
    label: "Settlement/Refund Update",
    contextLabel: "processing",
  },
  {
    eventType: "settlement_account_updated",
    label: "Settlement Account Update",
    contextLabel: "Acct ******7890 verified",
  },
  {
    eventType: "incomplete_listing_reminder",
    label: "Listing Reminder",
    contextLabel: "your transfer draft",
  },
];

function eventLabel(eventType: NotificationEventType) {
  switch (eventType) {
    case "verification_status_updated":
      return "Verification";
    case "listing_moderation_updated":
      return "Moderation";
    case "settlement_refund_status_updated":
      return "Settlement/Refund";
    case "settlement_account_updated":
      return "Settlement Account";
    case "incomplete_listing_reminder":
      return "Reminder";
    case "admin_triggered_message":
      return "Message";
    default: {
      const _exhaustive: never = eventType;
      return _exhaustive;
    }
  }
}

export default function NotificationsPage() {
  const { user, loading } = usePartnerAccess();
  const [items, setItems] = useState<PartnerNotification[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    setBusy(true);
    setMessage("");

    notificationsClient
      .listNotifications(user.id)
      .then((notifications) => {
        if (active) {
          setItems(notifications);
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Failed to load notifications.",
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

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );
  const acknowledgedCount = useMemo(
    () => items.filter((item) => item.acknowledged).length,
    [items],
  );
  const filteredItems = useMemo(() => {
    if (filter === "unread") {
      return items.filter((item) => !item.read);
    }
    if (filter === "read") {
      return items.filter((item) => item.read);
    }
    return items;
  }, [filter, items]);

  async function emit(event: EventPreset) {
    if (!user) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const updated = await notificationsClient.emitEvent(user.id, {
        eventType: event.eventType,
        channels: sendEmail ? ["in_app", "email"] : ["in_app"],
        contextLabel: event.contextLabel,
      });
      setItems(updated);
      setMessage(`${event.label} notification emitted.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to emit notification event.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function markAsRead(notificationId: string) {
    if (!user) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const updated = await notificationsClient.markAsRead(user.id, notificationId);
      setItems(updated);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to mark as read.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function markAsUnread(notificationId: string) {
    if (!user) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const updated = await notificationsClient.markAsUnread(
        user.id,
        notificationId,
      );
      setItems(updated);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to mark as unread.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function acknowledge(notificationId: string) {
    if (!user) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const updated = await notificationsClient.acknowledge(
        user.id,
        notificationId,
      );
      setItems(updated);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to acknowledge.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function markAllAsRead() {
    if (!user) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const updated = await notificationsClient.markAllAsRead(user.id);
      setItems(updated);
      setMessage("All notifications marked as read.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to mark all as read.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading notifications...</p>
        </div>
      </main>
    );
  }

  return (
    <PartnerShell
      title="Notifications"
      description="Track verification, moderation, settlement/refund, and reminder communication in one place."
      headerExtra={
        <div className="tm-inline-actions">
          <button
            className="tm-btn tm-btn-primary"
            type="button"
            disabled={busy || unreadCount === 0}
            onClick={() => void markAllAsRead()}
          >
            Mark All Read
          </button>
          <Link href="/dashboard" className="tm-btn tm-btn-outline">
            Back to Dashboard
          </Link>
        </div>
      }
    >
      <section className="tm-panel p-6">
        <div className="tm-section-head">
          <h2 className="tm-section-title">Notification Center</h2>
          <div className="tm-inline-actions">
            <button
              className={`tm-tag-pill ${filter === "all" ? "tm-tag-pill-active" : ""}`}
              type="button"
              onClick={() => setFilter("all")}
            >
              All ({items.length})
            </button>
            <button
              className={`tm-tag-pill ${filter === "unread" ? "tm-tag-pill-active" : ""}`}
              type="button"
              onClick={() => setFilter("unread")}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`tm-tag-pill ${filter === "read" ? "tm-tag-pill-active" : ""}`}
              type="button"
              onClick={() => setFilter("read")}
            >
              Read ({items.length - unreadCount})
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
              Unread
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{unreadCount}</p>
          </div>
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
              Acknowledged
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {acknowledgedCount}
            </p>
          </div>
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
              Email Dispatch
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              Optional per event simulation
            </p>
          </div>
        </div>
      </section>

      <section className="tm-panel p-6">
        <div className="tm-section-head">
          <h2 className="tm-section-title">Event Simulator</h2>
          <label className="tm-tag-pill flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
            />
            Send email
          </label>
        </div>
        <p className="tm-muted mt-1 text-sm">
          Simulate events to validate in-app and optional email notification routing.
        </p>
        <div className="tm-inline-actions mt-4">
          {EVENT_PRESETS.map((event) => (
            <button
              key={event.eventType}
              className="tm-btn tm-btn-outline"
              type="button"
              disabled={busy}
              onClick={() => void emit(event)}
            >
              Emit {event.label}
            </button>
          ))}
        </div>
      </section>

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Timeline</h2>
        <ul className="tm-list-stack mt-4">
          {filteredItems.map((item) => (
            <li key={item.id} className="tm-list-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="tm-tag-pill">{eventLabel(item.eventType)}</span>
                    <span className="tm-tag-pill">
                      {item.channels.includes("in_app") ? "In-app" : "No in-app"}
                    </span>
                    <span className="tm-tag-pill">
                      {item.emailDispatched ? "Email sent" : "Email skipped"}
                    </span>
                    <span
                      className={`tm-tag-pill ${
                        item.read ? "tm-tag-pill-active" : ""
                      }`}
                    >
                      {item.read ? "Read" : "Unread"}
                    </span>
                    {item.acknowledged ? (
                      <span className="tm-tag-pill tm-tag-pill-active">
                        Acknowledged
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="tm-inline-actions">
                  {item.actionUrl ? (
                    <Link href={item.actionUrl} className="tm-btn tm-btn-outline">
                      {item.actionLabel ?? "Open"}
                    </Link>
                  ) : null}
                  {item.read ? (
                    <button
                      className="tm-btn tm-btn-outline"
                      type="button"
                      disabled={busy}
                      onClick={() => void markAsUnread(item.id)}
                    >
                      Mark Unread
                    </button>
                  ) : (
                    <button
                      className="tm-btn tm-btn-outline"
                      type="button"
                      disabled={busy}
                      onClick={() => void markAsRead(item.id)}
                    >
                      Mark Read
                    </button>
                  )}
                  {!item.acknowledged ? (
                    <button
                      className="tm-btn tm-btn-primary"
                      type="button"
                      disabled={busy}
                      onClick={() => void acknowledge(item.id)}
                    >
                      Acknowledge
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredItems.length === 0 ? (
          <p className="tm-soft-note mt-3 text-sm">
            No notifications for this filter.
          </p>
        ) : null}
        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      </section>
    </PartnerShell>
  );
}
