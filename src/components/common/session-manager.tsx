"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    let active = true;

    authClient
      .listSessions()
      .then((data) => {
        if (active) {
          setSessions(data);
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
    await authClient.logout();
    router.replace("/auth/login");
  }

  async function logoutAllDevices() {
    try {
      await authClient.logoutAllSessions();
      router.replace("/auth/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to logout all sessions.");
    }
  }

  return (
    <section className="tm-panel p-5">
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
            <p className="mt-1 text-xs text-slate-500">Last seen: {new Date(session.lastSeenAt).toLocaleString()}</p>
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
