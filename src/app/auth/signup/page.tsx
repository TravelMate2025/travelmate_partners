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
          <input name="password" type="password" required className="tm-input" />
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
