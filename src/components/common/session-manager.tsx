"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { formatDateTimeUTC } from "@/lib/format";

import { authClient } from "@/modules/auth/auth-client";

type Session = {
  id: string;
  fingerprint: string;
  createdAt: string;
  lastSeenAt: string;
};

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [message, setMessage] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    Promise.all([authClient.listSessions(), authClient.me()])
      .then(([sessionData, user]) => {
        if (active) {
          setSessions(sessionData);
          setPhoneVerified(Boolean(user.phoneVerified));
        }
      })
      .catch(() => {
        if (active) {
          setMessage("Please sign in to view active sessions.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function revoke(id: string) {
    try {
      const updatedSessions = await authClient.revokeSession(id);
      setSessions(updatedSessions);
      setMessage("Session revoked.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to revoke session.");
    }
  }

  async function logout() {
    try {
      await authClient.logout();
      router.replace("/auth/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to logout.");
      // Keep navigation deterministic for the user even if upstream logout fails.
      router.replace("/auth/login");
    }
  }

  async function logoutAllDevices() {
    try {
      await authClient.logoutAllSessions();
      router.replace("/auth/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to logout all sessions.");
    }
  }

  async function requestPhoneCode() {
    try {
      setIsSendingCode(true);
      setMessage("");
      await authClient.requestPhoneVerificationOtp();
      setMessage("Verification code sent. Check your email for now while SMS is being enabled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to request phone verification code.");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function verifyPhoneCode() {
    try {
      setIsVerifyingCode(true);
      setMessage("");
      await authClient.verifyPhone({ code: verificationCode.trim() });
      setPhoneVerified(true);
      setVerificationCode("");
      setMessage("Phone number verified.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to verify phone code.");
    } finally {
      setIsVerifyingCode(false);
    }
  }

  return (
    <section className="tm-panel p-5">
      <div className="mb-4 rounded-xl border border-slate-200/90 bg-white/70 p-3">
        <h3 className="text-sm font-semibold text-slate-900">Phone Verification</h3>
        <p className="mt-1 text-xs text-slate-600">
          Status: {phoneVerified ? "Verified" : "Not verified"}
        </p>
        {phoneVerified ? null : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className="tm-btn tm-btn-outline px-3 py-1.5 text-xs"
              disabled={isSendingCode}
              onClick={requestPhoneCode}
              type="button"
            >
              {isSendingCode ? "Sending..." : "Request Code"}
            </button>
            <input
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
              maxLength={6}
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="Enter 6-digit code"
              value={verificationCode}
            />
            <button
              className="tm-btn tm-btn-primary px-3 py-1.5 text-xs"
              disabled={isVerifyingCode || verificationCode.trim().length !== 6}
              onClick={verifyPhoneCode}
              type="button"
            >
              {isVerifyingCode ? "Verifying..." : "Verify Phone"}
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Active Sessions</h2>
        <div className="flex gap-2">
          <button className="tm-btn tm-btn-outline" onClick={logout} type="button">
            Logout
          </button>
          <button className="tm-btn tm-btn-accent" onClick={logoutAllDevices} type="button">
            Logout All Devices
          </button>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {sessions.map((session) => (
          <li className="rounded-xl border border-slate-200/90 bg-white/70 p-3" key={session.id}>
            <p className="text-xs text-slate-600 break-all">{session.fingerprint}</p>
            <p className="mt-1 text-xs text-slate-500">Last seen: {formatDateTimeUTC(session.lastSeenAt)}</p>
            <button className="tm-btn tm-btn-primary mt-2 px-3 py-1.5 text-xs" onClick={() => revoke(session.id)} type="button">
              Revoke
            </button>
          </li>
        ))}
      </ul>
      {sessions.length === 0 ? <p className="mt-3 text-sm text-slate-500">No active sessions.</p> : null}
      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </section>
  );
}
