"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/common/auth-shell";
import { showToast } from "@/components/common/toast";
import { authClient } from "@/modules/auth/auth-client";

function LoginPageInner() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      const result = await authClient.login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });

      if (result.suspiciousLogin) {
        showToast({ message: "Signed in — new device detected on your account.", kind: "info" });
      }

      const redirectPath = searchParams.get("redirect") || "/onboarding";
      router.push(redirectPath);
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Login failed.", kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Use verified account credentials to access TravelMate Partner."
      footer={
        <>
          <Link className="underline" href="/auth/forgot-password">Forgot password?</Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email" required className="tm-input" />
        <input name="password" type="password" placeholder="Password" required className="tm-input" />
        <button disabled={loading} className="tm-btn tm-btn-primary w-full disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing in…
            </span>
          ) : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="tm-page">
          <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
            <p className="text-sm text-slate-600">Loading sign in...</p>
          </div>
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
