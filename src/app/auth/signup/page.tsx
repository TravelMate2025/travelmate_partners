"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/common/auth-shell";
import { showToast } from "@/components/common/toast";
import { authClient } from "@/modules/auth/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onRequestOtp(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault();
    setRequestingOtp(true);

    const form = event.currentTarget.form;
    if (!form) {
      setRequestingOtp(false);
      return;
    }

    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const phone = String(formData.get("phone") ?? "");

    try {
      await authClient.requestSignupOtp({ email, phone });
      showToast({ message: "Signup code sent — check your email.", kind: "success" });
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Failed to request OTP.", kind: "error" });
    } finally {
      setRequestingOtp(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formEl = event.currentTarget;

    const form = new FormData(formEl);
    const payload = {
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
      otpCode: String(form.get("otpCode") ?? ""),
    };

    try {
      await authClient.signup(payload);
      showToast({ message: "Account created — sign in to continue.", kind: "success" });
      router.push("/auth/login");
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Signup failed.", kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your partner account"
      description="Enter your business email and phone, verify with the OTP sent to your email, then set your password."
      footer={
        <>
          Already have an account? <Link className="underline" href="/auth/login">Sign in</Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
          <input name="email" type="email" required className="tm-input" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Phone</span>
          <input name="phone" type="tel" required className="tm-input" />
        </label>

        <button
          className="tm-btn tm-btn-outline w-full disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={requestingOtp || loading}
          onClick={onRequestOtp}
          type="button"
        >
          {requestingOtp ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Sending code…
            </span>
          ) : "Send OTP to email"}
        </button>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Signup OTP</span>
          <input name="otpCode" type="text" required className="tm-input" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
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
          <span className="mt-1 block text-xs text-slate-500">
            Must be 10+ chars with upper, lower, number, and symbol.
          </span>
        </label>

        <button
          disabled={loading || requestingOtp}
          className="tm-btn tm-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating account…
            </span>
          ) : "Create account"}
        </button>
      </form>

    </AuthShell>
  );
}
