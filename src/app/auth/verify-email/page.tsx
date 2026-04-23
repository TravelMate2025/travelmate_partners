"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/common/auth-shell";
import { showToast } from "@/components/common/toast";
import { authClient } from "@/modules/auth/auth-client";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") ?? "";
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      await authClient.verifyEmail({
        email: String(form.get("email") ?? ""),
        code: String(form.get("code") ?? ""),
      });
      showToast({ message: "Email verified — sign in to continue.", kind: "success" });
      router.push("/auth/login");
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Verification failed.", kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Verify email"
      description="Enter the 6-digit code sent to your email."
      footer={
        <>
          Ready to sign in? <Link className="underline" href="/auth/login">Go to login</Link>
        </>
      }
    >
      <p className="tm-note text-sm">Check your email for the 6-digit verification code.</p>
      <form className="space-y-4" onSubmit={onSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          defaultValue={prefilledEmail}
          className="tm-input"
        />
        <input name="code" type="text" placeholder="Verification code" required className="tm-input" />
        <button
          disabled={loading}
          className="tm-btn tm-btn-accent w-full disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Verifying…
            </span>
          ) : "Verify email"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="tm-page">
          <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
            <p className="text-sm text-slate-600">Loading verify email...</p>
          </div>
        </main>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
