"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { listAuditEvents } from "@/modules/audit/audit-log";
import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type {
  PartnerSettings,
  SubmitSupportTicketInput,
  SupportTicket,
} from "@/modules/support-settings/contracts";
import { supportSettingsClient } from "@/modules/support-settings/support-settings-client";

export default function SettingsPage() {
  const { user, loading } = usePartnerAccess();
  const [settings, setSettings] = useState<PartnerSettings | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditItems, setAuditItems] = useState(() => [] as ReturnType<typeof listAuditEvents>);
  const [busy, setBusy] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    setBusy(true);
    setSubmittingTicket(true);
    setMessage("");

    Promise.all([
      supportSettingsClient.getSettings(user.id),
      supportSettingsClient.listSupportTickets(user.id),
    ])
      .then(([settingsResult, ticketResult]) => {
        if (!active) {
          return;
        }
        setSettings(settingsResult);
        setTickets(ticketResult);
        setAuditItems(listAuditEvents(user.id).slice(-8).reverse());
      })
      .catch((error) => {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Failed to load support and settings.",
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

  async function refreshAudit() {
    if (!user) {
      return;
    }
    setAuditItems(listAuditEvents(user.id).slice(-8).reverse());
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !settings) {
      return;
    }

    setBusy(true);
    setMessage("");

    const form = new FormData(event.currentTarget);

    try {
      const updated = await supportSettingsClient.updateSettings(user.id, {
        supportContactEmail: String(form.get("supportContactEmail") ?? ""),
        language: String(form.get("language") ?? "en") as PartnerSettings["language"],
        timezone: String(form.get("timezone") ?? "Africa/Lagos"),
        security2FARequired: form.get("security2FARequired") === "on",
        notificationsInApp: form.get("notificationsInApp") === "on",
        notificationsEmail: form.get("notificationsEmail") === "on",
      });
      setSettings(updated);
      await refreshAudit();
      setMessage("Settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save settings.");
    } finally {
      setSubmittingTicket(false);
      setBusy(false);
    }
  }

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }

    setBusy(true);
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const payload: SubmitSupportTicketInput = {
      category: String(form.get("category") ?? "general") as SubmitSupportTicketInput["category"],
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
    };

    try {
      const updated = await supportSettingsClient.submitSupportTicket(user.id, payload);
      setTickets(updated);
      await refreshAudit();
      setMessage("Support ticket submitted.");
      formElement.reset();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to submit support ticket.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function requestDeactivation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !settings) {
      return;
    }

    setBusy(true);
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const updated = await supportSettingsClient.requestDeactivation(user.id, {
        reason: String(form.get("deactivationReason") ?? ""),
      });
      setSettings(updated);
      await refreshAudit();
      setMessage("Account deactivation request submitted.");
      formElement.reset();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to request deactivation.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading settings...</p>
        </div>
      </main>
    );
  }

  return (
    <PartnerShell
      title="Support & Settings"
      description="Update preferences, submit support requests, and manage account deactivation."
      headerExtra={
        <div className="tm-inline-actions">
          <Link href="/dashboard" className="tm-btn tm-btn-outline">
            Back to Dashboard
          </Link>
        </div>
      }
    >
      <form className="tm-panel p-6" onSubmit={savePreferences}>
        <h2 className="tm-section-title">Profile & Security Preferences</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="tm-field">
            <span className="tm-field-label">Support Contact Email</span>
            <input
              className="tm-input"
              name="supportContactEmail"
              defaultValue={settings?.supportContactEmail ?? ""}
              placeholder="support@yourcompany.com"
            />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Language</span>
            <select
              className="tm-input"
              name="language"
              defaultValue={settings?.language ?? "en"}
            >
              <option value="en">English</option>
              <option value="fr">French</option>
            </select>
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Timezone</span>
            <select
              className="tm-input"
              name="timezone"
              defaultValue={settings?.timezone ?? "Africa/Lagos"}
            >
              <option value="Africa/Lagos">Africa/Lagos</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="tm-tag-pill flex items-center gap-2">
            <input
              type="checkbox"
              name="security2FARequired"
              defaultChecked={settings?.security2FARequired ?? false}
            />
            Require 2FA
          </label>
          <label className="tm-tag-pill flex items-center gap-2">
            <input
              type="checkbox"
              name="notificationsInApp"
              defaultChecked={settings?.notificationsInApp ?? true}
            />
            In-app alerts
          </label>
          <label className="tm-tag-pill flex items-center gap-2">
            <input
              type="checkbox"
              name="notificationsEmail"
              defaultChecked={settings?.notificationsEmail ?? true}
            />
            Email alerts
          </label>
        </div>
        <div className="tm-inline-actions mt-4">
          <button className="tm-btn tm-btn-primary" disabled={busy} type="submit">
            Save Preferences
          </button>
        </div>
      </form>

      <form className="tm-panel p-6" onSubmit={submitTicket}>
        <h2 className="tm-section-title">Support Request</h2>
        <p className="tm-muted mt-1 text-sm">
          Submit a support ticket and track status updates.
        </p>
        <div className="mt-4 grid gap-3">
          <label className="tm-field">
            <span className="tm-field-label">Category</span>
            <select className="tm-input" name="category" defaultValue="general">
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="verification">Verification</option>
              <option value="listing">Listing</option>
              <option value="payout">Settlement / Refund</option>
            </select>
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Subject</span>
            <input className="tm-input" name="subject" placeholder="Short issue summary" />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">Message</span>
            <textarea
              className="tm-input min-h-24"
              name="message"
              placeholder="Describe the issue and expected behavior."
            />
          </label>
        </div>
        <div className="tm-inline-actions mt-4">
          <button className="tm-btn tm-btn-accent" disabled={busy || submittingTicket} type="submit">
            {submittingTicket ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>

        <ul className="tm-list-stack mt-4">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="tm-list-card">
              <p className="text-sm font-semibold text-slate-900">{ticket.subject}</p>
              <p className="mt-1 text-xs text-slate-600">
                {ticket.category} • {ticket.status} •{" "}
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
        {tickets.length === 0 ? (
          <p className="tm-soft-note mt-3 text-sm">No support tickets yet.</p>
        ) : null}
      </form>

      <form className="tm-panel p-6" onSubmit={requestDeactivation}>
        <h2 className="tm-section-title">Account Deactivation</h2>
        <p className="tm-muted mt-1 text-sm">
          Request account deactivation. This action is reviewed by support.
        </p>
        <label className="tm-field mt-4">
          <span className="tm-field-label">Reason</span>
          <textarea
            className="tm-input min-h-20"
            name="deactivationReason"
            placeholder="Provide your reason for deactivation."
          />
        </label>
        <div className="tm-inline-actions mt-4">
          <button className="tm-btn tm-btn-outline" disabled={busy} type="submit">
            Request Deactivation
          </button>
        </div>
        {settings?.deactivationRequested ? (
          <p className="tm-soft-note mt-3 text-sm">
            Deactivation requested. Reason: {settings.deactivationReason}
          </p>
        ) : null}
      </form>

      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Audit Trail</h2>
        <ul className="tm-list-stack mt-4">
          {auditItems.map((event) => (
            <li key={event.id} className="tm-list-card">
              <p className="text-sm font-semibold text-slate-900">{event.action}</p>
              <p className="mt-1 text-xs text-slate-600">
                {event.entityType} • {new Date(event.occurredAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
        {auditItems.length === 0 ? (
          <p className="tm-soft-note mt-3 text-sm">No recent audit events.</p>
        ) : null}
      </section>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </PartnerShell>
  );
}
