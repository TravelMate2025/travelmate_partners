"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useToastMessage } from "@/components/common/use-toast-message";
import { authClient } from "@/modules/auth/auth-client";
import type { PartnerUser } from "@/modules/auth/contracts";
import { getErrorMessage, isAuthenticationError } from "@/modules/auth/http-errors";
import type {
  PartnerVerification,
  VerificationDocCategory,
} from "@/modules/verification/contracts";
import { verificationClient } from "@/modules/verification/verification-client";

const CATEGORY_OPTIONS: Array<{ label: string; value: VerificationDocCategory }> = [
  { label: "Identity Document", value: "identity" },
  { label: "Business Document", value: "business" },
  { label: "Address Proof", value: "address" },
  { label: "Operating Permit", value: "permit" },
];

export default function VerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [verification, setVerification] = useState<PartnerVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");
  const [category, setCategory] = useState<VerificationDocCategory>("identity");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const currentUser = await authClient.me();
        const item = await verificationClient.getVerification(currentUser.id);
        if (!active) {
          return;
        }

        setUser(currentUser);
        setVerification(item);
        setLoadError("");
        setLoading(false);
      } catch (error) {
        if (!active) {
          return;
        }

        if (isAuthenticationError(error)) {
          router.replace("/auth/login");
          return;
        }

        setLoadError(getErrorMessage(error, "Failed to load verification."));
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const statusTone = useMemo(() => {
    switch (verification?.status) {
      case "approved":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "rejected":
        return "text-rose-700 bg-rose-50 border-rose-200";
      case "in_review":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "pending":
        return "text-amber-700 bg-amber-50 border-amber-200";
      default:
        return "text-slate-700 bg-slate-50 border-slate-200";
    }
  }, [verification?.status]);

  if (loading || !user || !verification) {
    if (!loading && loadError) {
      return (
        <main className="tm-page">
          <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
            <p className="text-sm font-medium text-rose-700">{loadError}</p>
            <p className="mt-2 text-sm text-slate-600">
              We could not load your verification data yet, but you were not signed out.
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading verification...</p>
        </div>
      </main>
    );
  }

  async function refresh() {
    if (!user) {
      return;
    }

    const item = await verificationClient.getVerification(user.id);
    setVerification(item);
  }

  async function addDocument() {
    if (!user) {
      return;
    }

    if (!selectedFile) {
      setMessage("Select a file to upload.");
      return;
    }

    setBusy(true);
    setUploadState("uploading");
    setMessage("");

    try {
      const item = await verificationClient.addDocument(user.id, {
        category,
        file: selectedFile,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
      });

      setVerification(item);
      setSelectedFile(null);
      setMessage("Document added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add document.");
    } finally {
      setBusy(false);
      setUploadState("idle");
    }
  }

  async function removeDocument(id: string) {
    if (!user) {
      return;
    }

    setBusy(true);
    setUploadState("uploading");
    setMessage("");

    try {
      const item = await verificationClient.removeDocument(user.id, id);
      setVerification(item);
      setMessage("Document removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove document.");
    } finally {
      setBusy(false);
      setUploadState("idle");
    }
  }

  async function replaceDocument(id: string, categoryForDocument: VerificationDocCategory, file: File) {
    if (!user) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const item = await verificationClient.replaceDocument(user.id, id, {
        category: categoryForDocument,
        file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      setVerification(item);
      setMessage("Document replaced.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to replace document.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!user) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const item = await verificationClient.submitVerification(user.id);
      setVerification(item);
      setMessage("Verification submitted. Status is in_review.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit verification.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="tm-page">
      <div className="tm-shell max-w-5xl space-y-5">
        <section className="tm-panel p-6">
          <p className="tm-kicker">TravelMate Partner</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Partner Verification (KYC/KYB)</h1>
          <p className="tm-muted mt-1 text-sm">
            Upload required documents, submit for review, and monitor approval status.
          </p>

          <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-medium ${statusTone}`}>
            Status: {verification.status}
          </p>

          {verification.rejectionReason ? (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Rejection reason: {verification.rejectionReason}
            </p>
          ) : null}
        </section>

        <section className="tm-panel p-6">
          <h2 className="text-lg font-semibold text-slate-900">Upload Documents</h2>
          <p className="tm-muted mt-1 text-sm">Allowed: PDF, PNG, JPEG (up to 8MB each)</p>
          {uploadState === "uploading" ? (
            <p className="mt-2 text-sm text-blue-700">Upload in progress...</p>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <select className="tm-input" value={category} onChange={(event) => setCategory(event.target.value as VerificationDocCategory)}>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              className="tm-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />

            <button className="tm-btn tm-btn-primary" disabled={busy} onClick={addDocument} type="button">
              Add Document
            </button>
          </div>

          <ul className="mt-4 space-y-2">
            {verification.documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white/70 p-3 text-sm text-slate-700">
                <div>
                  <p className="font-medium">{doc.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {doc.category} • {(doc.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    className="hidden"
                    id={`replace-doc-${doc.id}`}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void replaceDocument(doc.id, doc.category, file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                  <label className="tm-btn tm-btn-outline cursor-pointer" htmlFor={`replace-doc-${doc.id}`}>
                    Replace
                  </label>
                  <button className="tm-btn tm-btn-outline" disabled={busy} onClick={() => void removeDocument(doc.id)} type="button">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {verification.documents.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No documents uploaded yet.</p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="tm-btn tm-btn-accent" disabled={busy} onClick={submit} type="button">
              {verification.status === "rejected" ? "Re-submit Verification" : "Submit Verification"}
            </button>
            <button className="tm-btn tm-btn-outline" disabled={busy} onClick={() => void refresh()} type="button">
              Refresh Status
            </button>
            {verification.status === "approved" ? (
              <button className="tm-btn tm-btn-primary" onClick={() => router.push("/dashboard")} type="button">
                Continue to Dashboard
              </button>
            ) : null}
          </div>

          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
        </section>
      </div>
    </main>
  );
}
