"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/common/auth-shell";
import { authClient } from "@/modules/auth/auth-client";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") ?? "";
  const codeHint = searchParams.get("codeHint");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = new FormData(event.currentTarget);
    try {
      await authClient.verifyEmail({
        email: String(form.get("email") ?? ""),
        code: String(form.get("code") ?? ""),
      });
      setMessage("Email verified successfully. You can now sign in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification failed.");
    }
  }

  return (
    <AuthShell
      title="Verify email"
      description="Enter the 6-digit code sent after signup."
      footer={
        <>
          Ready to sign in? <Link className="underline" href="/auth/login">Go to login</Link>
        </>
      }
    >
      {codeHint ? (
        <p className="tm-note text-sm">
          Mock/dev verification code: {codeHint}
        </p>
      ) : null}
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
        <button className="tm-btn tm-btn-accent w-full" type="submit">
          Verify email
        </button>
      </form>
      {message ? <p className="tm-note text-sm">{message}</p> : null}
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
