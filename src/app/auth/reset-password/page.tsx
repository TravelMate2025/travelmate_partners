"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { AuthShell } from "@/components/common/auth-shell";
import { authClient } from "@/modules/auth/auth-client";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = new FormData(event.currentTarget);
    try {
      await authClient.resetPassword({
        email: String(form.get("email") ?? ""),
        resetCode: String(form.get("resetCode") ?? ""),
        newPassword: String(form.get("newPassword") ?? ""),
      });
      setMessage("Password updated. Sign in with the new password.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reset failed.");
    }
  }

  return (
    <AuthShell
      title="Set new password"
      description="Provide your email, reset code, and new password."
      footer={
        <>
          Back to <Link className="underline" href="/auth/login">sign in</Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email" required className="tm-input" />
        <input name="resetCode" type="text" placeholder="Reset code" required className="tm-input" />
        <input name="newPassword" type="password" placeholder="New password" required className="tm-input" />
        <button className="tm-btn tm-btn-primary w-full" type="submit">
          Update password
        </button>
      </form>
      {message ? <p className="tm-note text-sm">{message}</p> : null}
    </AuthShell>
  );
}
