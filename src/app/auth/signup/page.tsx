"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/common/auth-shell";
import { authClient } from "@/modules/auth/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [message, setMessage] = useState("");

  async function onRequestOtp(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault();
    setMessage("");
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
      const result = await authClient.requestSignupOtp({ email, phone });
      setMessage(`Signup OTP sent. Mock/dev OTP code: ${result.otpCodeHint ?? "N/A"}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to request OTP.");
    } finally {
      setRequestingOtp(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formEl = event.currentTarget;

    const form = new FormData(formEl);
    const payload = {
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
      otpCode: String(form.get("otpCode") ?? ""),
    };

    try {
      const result = await authClient.signup(payload);
      const params = new URLSearchParams({
        email: payload.email,
      });

      if (result.verificationCodeHint) {
        params.set("codeHint", result.verificationCodeHint);
      }

      router.push(`/auth/verify-email?${params.toString()}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your partner account"
      description="Use your business email and phone, request signup OTP, then create account."
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
          className="tm-btn tm-btn-outline w-full"
          disabled={requestingOtp}
          onClick={onRequestOtp}
          type="button"
        >
          {requestingOtp ? "Requesting OTP..." : "Send OTP"}
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
          disabled={loading}
          className="tm-btn tm-btn-primary w-full disabled:opacity-70"
          type="submit"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      {message ? <p className="tm-note text-sm">{message}</p> : null}
    </AuthShell>
  );
}
