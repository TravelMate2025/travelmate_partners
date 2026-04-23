"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/common/auth-shell";
import { showToast } from "@/components/common/toast";
import { authClient } from "@/modules/auth/auth-client";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      await authClient.resetPassword({
        email: String(form.get("email") ?? ""),
        resetCode: String(form.get("resetCode") ?? ""),
        newPassword: String(form.get("newPassword") ?? ""),
      });
      showToast({ message: "Password updated — sign in with your new password.", kind: "success" });
      router.push("/auth/login");
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Reset failed.", kind: "error" });
    } finally {
      setLoading(false);
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
        <button
          disabled={loading}
          className="tm-btn tm-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Updating password…
            </span>
          ) : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
