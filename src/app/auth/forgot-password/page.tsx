"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { AuthShell } from "@/components/common/auth-shell";
import { authClient } from "@/modules/auth/auth-client";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = new FormData(event.currentTarget);
    try {
      const result = await authClient.requestPasswordReset({ email: String(form.get("email") ?? "") });
      setMessage(
        `If this email exists, a reset code is issued. Mock/dev reset code: ${result.resetCodeHint || "N/A"}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reset request failed.");
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
        <button className="tm-btn tm-btn-accent w-full" type="submit">
          Send reset code
        </button>
      </form>
      {message ? <p className="tm-note text-sm">{message}</p> : null}
    </AuthShell>
  );
}
