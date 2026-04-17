import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionManager } from "@/components/common/session-manager";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

const listSessionsMock = vi.fn();
const revokeSessionMock = vi.fn();
const logoutMock = vi.fn();
const logoutAllSessionsMock = vi.fn();

vi.mock("@/modules/auth/auth-client", () => ({
  authClient: {
    listSessions: (...args: unknown[]) => listSessionsMock(...args),
    revokeSession: (...args: unknown[]) => revokeSessionMock(...args),
    logout: (...args: unknown[]) => logoutMock(...args),
    logoutAllSessions: (...args: unknown[]) => logoutAllSessionsMock(...args),
  },
}));

describe("SessionManager", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    listSessionsMock.mockReset();
    revokeSessionMock.mockReset();
    logoutMock.mockReset();
    logoutAllSessionsMock.mockReset();
  });

  it("renders active sessions and revokes a session", async () => {
    listSessionsMock.mockResolvedValue([
      {
        id: "s1",
        fingerprint: "fp-1",
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
    ]);

    revokeSessionMock.mockResolvedValue([]);

    render(<SessionManager />);

    await waitFor(() => {
      expect(screen.getByText("fp-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    await waitFor(() => {
      expect(screen.getByText("No active sessions.")).toBeInTheDocument();
    });
  });

  it("logs out and redirects to login", async () => {
    listSessionsMock.mockResolvedValue([]);
    logoutMock.mockResolvedValue(undefined);

    render(<SessionManager />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("logs out all devices and redirects to login", async () => {
    listSessionsMock.mockResolvedValue([]);
    logoutAllSessionsMock.mockResolvedValue(undefined);

    render(<SessionManager />);

    fireEvent.click(screen.getByRole("button", { name: "Logout All Devices" }));

    await waitFor(() => {
      expect(logoutAllSessionsMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith("/auth/login");
    });
  });
});
