"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/common/auth-shell";
import { showToast } from "@/components/common/toast";
import { authClient } from "@/modules/auth/auth-client";

function LoginPageInner() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

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
      const message = error instanceof Error ? error.message : "Login failed.";
      setErrorMessage(message);
      showToast({ message, kind: "error" });
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
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            className="tm-input pr-10"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? (
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        </div>
        {errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errorMessage}
          </div>
        ) : null}
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
