"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type { TransferListing, TransferStatus } from "@/modules/transfers/contracts";
import { transfersClient } from "@/modules/transfers/transfers-client";

export default function TransfersPage() {
  const { user, loading } = usePartnerAccess();
  const [items, setItems] = useState<TransferListing[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  useToastMessage(message);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    transfersClient
      .listTransfers(user.id)
      .then((result) => {
        if (active) {
          setItems(result);
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Failed to load transfers.");
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  async function refresh() {
    if (!user) {
      return;
    }

    const updated = await transfersClient.listTransfers(user.id);
    setItems(updated);
  }

  async function changeStatus(transferId: string, nextStatus: TransferStatus) {
    if (!user) {
      return;
    }

    setBusyId(transferId);
    setMessage("");

    try {
      await transfersClient.updateStatus(user.id, transferId, nextStatus);
      await refresh();
      setMessage(`Transfer moved to ${nextStatus}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function archive(transferId: string) {
    if (!user) {
      return;
    }

    setBusyId(transferId);
    setMessage("");

    try {
      await transfersClient.archiveTransfer(user.id, transferId);
      await refresh();
      setMessage("Transfer archived.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Archive failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading transfers...</p>
        </div>
      </main>
    );
  }

  return (
    <PartnerShell
      title="Transfer Listings"
      description="Create, submit, and manage transfer/taxi inventory lifecycle."
      headerExtra={
        <div className="flex flex-wrap gap-2">
          <Link href="/transfers/new" className="tm-btn tm-btn-primary">
            Create Transfer
          </Link>
          <Link href="/dashboard" className="tm-btn tm-btn-outline">
            Back to Dashboard
          </Link>
        </div>
      }
    >
      <section className="tm-panel p-6">
        <div className="tm-section-head">
          <div>
            <h2 className="tm-section-title">Listings</h2>
            <p className="tm-muted text-sm">Track lifecycle, moderation, and publish state for transfer inventory.</p>
          </div>
        </div>
        <ul className="tm-list-stack mt-4">
          {items.map((item) => (
            <li key={item.id} className="tm-list-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.name || "Untitled transfer"}</h3>
                  <p className="text-sm text-slate-600">
                    {item.transferType || "Transfer type not set"} • {item.pickupPoint || "Pickup"} to{" "}
                    {item.dropoffPoint || "Dropoff"}
                  </p>
                  <p className="tm-status-inline mt-2">Status: {item.status}</p>
                  {item.moderationFeedback ? (
                    <p className="mt-2 text-xs text-rose-700">Feedback: {item.moderationFeedback}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/transfers/${item.id}`} className="tm-btn tm-btn-outline">
                    Edit
                  </Link>

                  {(item.status === "draft" || item.status === "rejected") ? (
                    <button
                      className="tm-btn tm-btn-accent"
                      disabled={busyId === item.id}
                      onClick={() => void changeStatus(item.id, "pending")}
                      type="button"
                    >
                      Submit Review
                    </button>
                  ) : null}

                  {item.status === "approved" ? (
                    <button
                      className="tm-btn tm-btn-primary"
                      disabled={busyId === item.id}
                      onClick={() => void changeStatus(item.id, "live")}
                      type="button"
                    >
                      Go Live
                    </button>
                  ) : null}

                  {item.status === "live" ? (
                    <button
                      className="tm-btn tm-btn-outline"
                      disabled={busyId === item.id}
                      onClick={() => void changeStatus(item.id, "paused")}
                      type="button"
                    >
                      Pause
                    </button>
                  ) : null}

                  {item.status === "paused" ? (
                    <button
                      className="tm-btn tm-btn-primary"
                      disabled={busyId === item.id}
                      onClick={() => void changeStatus(item.id, "live")}
                      type="button"
                    >
                      Resume
                    </button>
                  ) : null}

                  {item.status !== "archived" ? (
                    <button
                      className="tm-btn tm-btn-outline"
                      disabled={busyId === item.id}
                      onClick={() => void archive(item.id)}
                      type="button"
                    >
                      Archive
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {items.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No transfers yet. Create your first listing.</p>
        ) : null}
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </section>
    </PartnerShell>
  );
}
