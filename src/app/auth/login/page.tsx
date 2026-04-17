"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/common/auth-shell";
import { authClient } from "@/modules/auth/auth-client";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    try {
      const result = await authClient.login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });

      if (result.suspiciousLogin) {
        setMessage("Login successful. Suspicious login alert: new device fingerprint detected.");
      } else {
        setMessage("Login successful.");
      }

      router.push("/onboarding");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
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
        <button disabled={loading} className="tm-btn tm-btn-primary w-full disabled:opacity-70" type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {message ? <p className="tm-note text-sm">{message}</p> : null}
    </AuthShell>
  );
}
