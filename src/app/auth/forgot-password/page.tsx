"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { AuthShell } from "@/components/common/auth-shell";
import { showToast } from "@/components/common/toast";
import { authClient } from "@/modules/auth/auth-client";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      await authClient.requestPasswordReset({ email: String(form.get("email") ?? "") });
      showToast({ message: "If this email is registered, a reset code has been sent — check your email.", kind: "info" });
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Reset request failed.", kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Request a password reset code for your partner account."
      footer={
        <>
          Already have a reset code? <Link className="underline" href="/auth/reset-password">Reset now</Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email" required className="tm-input" />
        <button
          disabled={loading}
          className="tm-btn tm-btn-accent w-full disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Sending reset code…
            </span>
          ) : "Send reset code"}
        </button>
      </form>
    </AuthShell>
  );
}
