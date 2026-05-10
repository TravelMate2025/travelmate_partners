import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./page";

const loginMock = vi.fn();
const pushMock = vi.fn();
const toastMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("@/modules/auth/auth-client", () => ({
  authClient: {
    login: (...args: unknown[]) => loginMock(...args),
  },
}));

vi.mock("@/components/common/toast", () => ({
  showToast: (...args: unknown[]) => toastMock(...args),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    loginMock.mockReset();
    pushMock.mockReset();
    toastMock.mockReset();
  });

  it("shows a visible inline error when login fails", async () => {
    loginMock.mockRejectedValue(new Error("Request timed out after 20s. Please try again."));

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "partner@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(
        screen.getByText("Request timed out after 20s. Please try again."),
      ).toBeInTheDocument();
    });

    expect(toastMock).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
