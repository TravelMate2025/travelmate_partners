"use client";

import { FormEvent, useEffect, useState } from "react";

import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import { appConfig } from "@/lib/config";
import { apiAccessClient } from "@/modules/api-access/api-access-client";
import type { PartnerApiAccessOverview, PartnerApiCatalog } from "@/modules/api-access/contracts";

function statusLabel(status: PartnerApiAccessOverview["statusOptions"][number]) {
  switch (status) {
    case "no_application":
      return "No application";
    case "pending_review":
      return "Pending review";
    case "under_review":
      return "Under review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "blocked":
      return "Suspended";
    default:
      return status;
  }
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <rect height="13" rx="2" stroke="currentColor" strokeWidth="1.5" width="13" x="8" y="8" />
      <rect height="13" rx="2" stroke="currentColor" strokeWidth="1.5" width="13" x="3" y="3" />
    </svg>
  );
}

export default function ApiAccessPage() {
  const { user, loading } = usePartnerAccess();
  const [overview, setOverview] = useState<PartnerApiAccessOverview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [catalog, setCatalog] = useState<PartnerApiCatalog | null>(null);
  const [message, setMessage] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<{ keyId: string; clientSecret: string; issuedAt: string; warning: string } | null>(null);
  const [revealing, setRevealing] = useState(false);
  useToastMessage(message);

  useEffect(() => {
    if (!user) {
      return;
    }
    let active = true;
    apiAccessClient.getOverview(user.id)
      .then((payload) => {
        if (active) {
          setOverview(payload);
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Failed to load API access.");
        }
      });
    apiAccessClient.getCatalog(user.id)
      .then((payload) => {
        if (active) {
          setCatalog(payload);
        }
      })
      .catch(() => {
        // Keep API access page resilient when catalog module is unavailable.
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || !user) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading API access...</p>
        </div>
      </main>
    );
  }

  const status = overview?.application?.status ?? "no_application";
  const canSubmit = status === "no_application" || status === "rejected" || status === "blocked";
  const primaryEndpoint = catalog?.endpoints?.[0];
  const sampleCatalogCurl = primaryEndpoint
    ? `curl -sS "${appConfig.apiBaseUrl}${primaryEndpoint.path}" \\\n  -H "X-API-Key-Id: <your_key_id>" \\\n  -H "X-API-Client-Secret: <your_client_secret>"`
    : `curl -sS "${appConfig.apiBaseUrl}/api/v1/public/catalog" \\\n  -H "X-API-Key-Id: <your_key_id>" \\\n  -H "X-API-Client-Secret: <your_client_secret>"`;
  const sampleIntrospectCurl = `curl -sS "${appConfig.apiBaseUrl}/public/auth/introspect" \\\n  -H "X-API-Key-Id: <your_key_id>" \\\n  -H "X-API-Client-Secret: <your_client_secret>"`;
  const sampleBookingsCurl = `curl -sS "${appConfig.apiBaseUrl}/public/bookings?page=1&pageSize=10&status=completed&bookingReference=BOOK&completedFrom=2026-04-01T00:00:00Z&completedTo=2026-05-01T23:59:59Z" \\\n  -H "X-API-Key-Id: <your_key_id>" \\\n  -H "X-API-Client-Secret: <your_client_secret>"`;

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setMessage(`Unable to copy ${label.toLowerCase()}.`);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !canSubmit) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSubmitting(true);
    setMessage("");
    try {
      const application = await apiAccessClient.submitApplication(user.id, {
        companyName: String(form.get("companyName") ?? ""),
        applicantName: String(form.get("applicantName") ?? ""),
        email: String(form.get("email") ?? ""),
        useCase: String(form.get("useCase") ?? ""),
        region: String(form.get("region") ?? ""),
        requestedRateLimitPerMinute: Number(form.get("requestedRateLimitPerMinute") ?? 60),
      });
      setOverview((current) => ({
        application,
        statusOptions: current?.statusOptions ?? ["no_application", "pending_review", "under_review", "approved", "rejected", "blocked"],
      }));
      const latestCatalog = await apiAccessClient.getCatalog(user.id);
      setCatalog(latestCatalog);
      setRevealedSecret(null);
      setMessage("API client application submitted. Our team will review and update your status.");
      formElement.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit API application.");
    } finally {
      setSubmitting(false);
    }
  }

  async function revealSecret() {
    if (!user) return;
    setRevealing(true);
    setMessage("");
    try {
      const payload = await apiAccessClient.revealSecret(user.id);
      setRevealedSecret(payload);
      setOverview((current) =>
        current?.application
          ? {
              ...current,
              application: {
                ...current.application,
                credentialMetadata: {
                  ...(current.application.credentialMetadata ?? {
                    keyId: payload.keyId,
                    secretFingerprint: null,
                    issuedAt: payload.issuedAt,
                    rotatedAt: null,
                    revokedAt: null,
                    revealConsumedAt: new Date().toISOString(),
                    revealExpiresAt: null,
                    revealAvailable: false,
                  }),
                  revealAvailable: false,
                  revealConsumedAt: new Date().toISOString(),
                },
              },
            }
          : current,
      );
      const latestCatalog = await apiAccessClient.getCatalog(user.id);
      setCatalog(latestCatalog);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reveal credentials.");
    } finally {
      setRevealing(false);
    }
  }

  function downloadCatalogExport(format: "openapi" | "postman") {
    if (!user) return;
    const path =
      format === "openapi"
        ? `/partners/${user.id}/api-client-catalog/export/openapi`
        : `/partners/${user.id}/api-client-catalog/export/postman`;
    const href = `${appConfig.apiBaseUrl}${path}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <PartnerShell
      title="API Access"
      description="Apply for business API access and track review status."
      headerExtra={<p className="tm-muted text-sm">Current status: {statusLabel(status)}</p>}
    >
      <section className="tm-panel min-w-0 p-6 overflow-hidden">
        <h2 className="tm-section-title">Application Status</h2>
        <p className="mt-2 min-w-0 break-words text-sm text-slate-700">
          {overview?.application
            ? `Application ${overview.application.id} is ${statusLabel(overview.application.status).toLowerCase()}.`
            : "No API client application has been submitted yet."}
        </p>
        {overview?.application?.partnerPolicy ? (
          <div className="mt-3 min-w-0 break-words text-sm text-slate-700">
            Policy: {overview.application.partnerPolicy.environment} / {overview.application.partnerPolicy.tier} /{" "}
            {overview.application.partnerPolicy.alertProfile}
          </div>
        ) : null}
        {overview?.application?.status === "approved" && overview.application.credentialMetadata?.revealAvailable ? (
          <div className="mt-4">
            <button className="tm-btn tm-btn-primary" disabled={revealing} onClick={() => void revealSecret()} type="button">
              {revealing ? "Revealing..." : "Reveal API Credentials (One Time)"}
            </button>
            <p className="mt-2 text-xs text-amber-700">Warning: the client secret is shown once and cannot be retrieved again.</p>
          </div>
        ) : null}
        {revealedSecret ? (
          <div className="mt-4 min-w-0 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-slate-900">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 break-all font-semibold">Client Key ID: {revealedSecret.keyId}</p>
              <button className="tm-btn tm-btn-outline inline-flex items-center gap-1 px-2 py-1 text-xs" onClick={() => void copyText("Client key ID", revealedSecret.keyId)} type="button">
                <CopyIcon /> Copy
              </button>
            </div>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 break-all font-mono">Client Secret: {revealedSecret.clientSecret}</p>
              <button className="tm-btn tm-btn-outline inline-flex items-center gap-1 px-2 py-1 text-xs" onClick={() => void copyText("Client secret", revealedSecret.clientSecret)} type="button">
                <CopyIcon /> Copy
              </button>
            </div>
            <p className="mt-2 text-xs text-amber-700">{revealedSecret.warning}</p>
          </div>
        ) : null}
        {overview?.application?.limitState?.isOverLimit ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {overview.application.limitState.warning} Retry after {overview.application.limitState.retryAfterSeconds} seconds.
          </div>
        ) : null}
        {overview?.application?.pendingPolicyChange?.effectiveAt ? (
          <div className="mt-3 min-w-0 break-words text-sm text-slate-700">
            Scheduled policy change: {overview.application.pendingPolicyChange.plan} /{" "}
            {overview.application.pendingPolicyChange.rateLimitPerMinute}/min at{" "}
            {new Date(overview.application.pendingPolicyChange.effectiveAt).toLocaleString()}
          </div>
        ) : null}
      </section>

      <section className="tm-panel min-w-0 p-6 overflow-hidden">
        <h2 className="tm-section-title">Developer Portal</h2>
        <p className="tm-muted mt-1 text-sm">See exactly which API modules and endpoints your account can use.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="min-w-0 rounded-md border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">My Access</p>
            <p className="mt-2 text-sm text-slate-700">Environment: {catalog?.access.environment ?? "Not assigned"}</p>
            <p className="mt-1 text-sm text-slate-700">Key status: {catalog?.access.keyStatus ?? "Not issued"}</p>
            <p className="mt-1 text-sm text-slate-700">
              Scopes: {catalog?.access.scopes.length ? catalog.access.scopes.join(", ") : "None"}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Products: {catalog?.access.productLanes.length ? catalog.access.productLanes.join(", ") : "None"}
            </p>
          </div>
          <div className="min-w-0 rounded-md border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">API Catalog</p>
            <p className="mt-2 text-sm text-slate-700">
              Authorized endpoints: {catalog?.endpoints.length ?? 0}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                onClick={() => downloadCatalogExport("openapi")}
                style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a" }}
                type="button"
              >
                Download OpenAPI
              </button>
              <button
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                onClick={() => downloadCatalogExport("postman")}
                style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a" }}
                type="button"
              >
                Download Postman
              </button>
            </div>
            {catalog?.access.status !== "approved" ? (
              <p className="mt-2 text-sm text-amber-700">Catalog endpoints will appear after your API access is approved.</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {(catalog?.endpoints ?? []).map((endpoint) => (
            <article className="min-w-0 rounded-md border border-slate-200 p-3" key={endpoint.id}>
              <p className="break-all text-sm font-semibold text-slate-900">
                {endpoint.method} {endpoint.path}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Lane: {endpoint.productLane} · Scope: {endpoint.requiredScope} · Envs: {endpoint.environments.join(", ")}
              </p>
              <p className="mt-1 text-sm text-slate-700">{endpoint.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scope Explainer</p>
          <p className="mt-2 text-sm text-slate-700">
            {catalog?.policyExplainer?.blockedGuidance ?? "Scope guidance will appear after your catalog is loaded."}
          </p>
          <div className="mt-3 space-y-2">
            {(catalog?.policyExplainer?.scopeGuide ?? []).map((item) => (
              <article className="rounded-md border border-slate-200 p-2" key={item.scope}>
                <p className="text-sm font-semibold text-slate-900">
                  {item.scope} ({item.endpointCount})
                </p>
                <p className="mt-1 text-xs text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
        {catalog?.access.keyStatus === "active" ? (
          <div className="mt-5 rounded-md border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Try It</p>
            <p className="mt-2 text-sm text-slate-700">Start with key introspection, then call one authorized endpoint.</p>
            <p className="mt-3 text-xs font-semibold text-slate-600">1) Introspect key</p>
            <button className="tm-btn tm-btn-outline mt-1 inline-flex w-full items-center justify-center gap-1 px-2 py-1 text-xs sm:w-auto" onClick={() => void copyText("Introspection curl", sampleIntrospectCurl)} type="button">
              <CopyIcon /> Copy
            </button>
            <pre className="mt-1 overflow-x-auto rounded bg-slate-100 p-2 text-xs text-slate-800">{sampleIntrospectCurl}</pre>
            <p className="mt-3 text-xs font-semibold text-slate-600">2) Call authorized endpoint</p>
            <button className="tm-btn tm-btn-outline mt-1 inline-flex w-full items-center justify-center gap-1 px-2 py-1 text-xs sm:w-auto" onClick={() => void copyText("Catalog curl", sampleCatalogCurl)} type="button">
              <CopyIcon /> Copy
            </button>
            <pre className="mt-1 overflow-x-auto rounded bg-slate-100 p-2 text-xs text-slate-800">{sampleCatalogCurl}</pre>
            <p className="mt-3 text-xs font-semibold text-slate-600">3) Filter bookings (if bookings scope is assigned)</p>
            <button className="tm-btn tm-btn-outline mt-1 inline-flex w-full items-center justify-center gap-1 px-2 py-1 text-xs sm:w-auto" onClick={() => void copyText("Filtered bookings curl", sampleBookingsCurl)} type="button">
              <CopyIcon /> Copy
            </button>
            <pre className="mt-1 overflow-x-auto rounded bg-slate-100 p-2 text-xs text-slate-800">{sampleBookingsCurl}</pre>
            <div className="mt-3 text-xs text-slate-700">
              <p><strong>401</strong>: Key/secret invalid, revoked, or not active. Regenerate/reissue credentials.</p>
              <p><strong>403</strong>: Requested endpoint/scope/environment is not authorized for your key.</p>
              <p><strong>429</strong>: Rate limit exceeded. Back off and retry using your assigned limit policy.</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="tm-panel min-w-0 overflow-hidden p-6">
        <h2 className="tm-section-title">Submit API Client Application</h2>
        <p className="tm-muted mt-1 text-sm">Provide business and integration context for review.</p>
        {!canSubmit ? (
          <p className="mt-3 text-sm text-amber-700">
            You already have an active application. New submissions are allowed after rejection/suspension only.
          </p>
        ) : null}
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => void submit(event)}>
          <input className="tm-input" name="companyName" placeholder="Company name" required type="text" />
          <input className="tm-input" name="applicantName" placeholder="Applicant name" required type="text" />
          <input className="tm-input md:col-span-2" name="email" placeholder="Contact email" required type="email" />
          <input className="tm-input" name="region" placeholder="Primary region (e.g. West Africa)" type="text" />
          <div>
            <input className="tm-input" defaultValue={60} min={1} name="requestedRateLimitPerMinute" required type="number" />
            <p className="tm-muted mt-1 text-xs">
              Hint: Enter your expected API request volume per minute (for example, 60 means about 1 request per second).
            </p>
          </div>
          <div className="md:col-span-2">
            <textarea className="tm-input min-h-28" minLength={24} name="useCase" placeholder="Describe your integration use case and expected traffic..." required />
            <p className="tm-muted mt-1 text-xs">
              Hint: Briefly state what your app will use the API for, which endpoints you expect to call, and your estimated traffic (requests/minute and monthly volume).
            </p>
          </div>
          <div className="md:col-span-2">
            <button className="tm-btn tm-btn-primary" disabled={!canSubmit || submitting} type="submit">
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </section>
    </PartnerShell>
  );
}
