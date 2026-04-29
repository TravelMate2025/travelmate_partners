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
const meMock = vi.fn();
const requestPhoneVerificationOtpMock = vi.fn();
const verifyPhoneMock = vi.fn();

vi.mock("@/modules/auth/auth-client", () => ({
  authClient: {
    listSessions: (...args: unknown[]) => listSessionsMock(...args),
    revokeSession: (...args: unknown[]) => revokeSessionMock(...args),
    logout: (...args: unknown[]) => logoutMock(...args),
    logoutAllSessions: (...args: unknown[]) => logoutAllSessionsMock(...args),
    me: (...args: unknown[]) => meMock(...args),
    requestPhoneVerificationOtp: (...args: unknown[]) => requestPhoneVerificationOtpMock(...args),
    verifyPhone: (...args: unknown[]) => verifyPhoneMock(...args),
  },
}));

describe("SessionManager", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    listSessionsMock.mockReset();
    revokeSessionMock.mockReset();
    logoutMock.mockReset();
    logoutAllSessionsMock.mockReset();
    meMock.mockReset();
    requestPhoneVerificationOtpMock.mockReset();
    verifyPhoneMock.mockReset();
    meMock.mockResolvedValue({
      id: "u1",
      email: "partner@example.com",
      phone: "+2348012345678",
      emailVerified: true,
      phoneVerified: false,
      otpEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
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

  it("requests and verifies phone code", async () => {
    listSessionsMock.mockResolvedValue([]);
    requestPhoneVerificationOtpMock.mockResolvedValue(undefined);
    verifyPhoneMock.mockResolvedValue(undefined);

    render(<SessionManager />);

    fireEvent.click(screen.getByRole("button", { name: "Request Code" }));
    await waitFor(() => {
      expect(requestPhoneVerificationOtpMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByPlaceholderText("Enter 6-digit code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify Phone" }));
    await waitFor(() => {
      expect(verifyPhoneMock).toHaveBeenCalledWith({ code: "123456" });
      expect(screen.getByText("Phone number verified.")).toBeInTheDocument();
    });
  });
});
