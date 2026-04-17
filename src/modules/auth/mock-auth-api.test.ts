import { beforeEach, describe, expect, it } from "vitest";

import { mockAuthApi } from "@/modules/auth/mock-auth-api";

function resetStorage() {
  window.localStorage.clear();
}

describe("mockAuthApi", () => {
  beforeEach(() => {
    resetStorage();
  });

  async function signupPartner() {
    const otp = await mockAuthApi.requestSignupOtp({
      email: "partner@example.com",
      phone: "+2348011112222",
    });

    return mockAuthApi.signup({
      email: "partner@example.com",
      phone: "+2348011112222",
      password: "StrongPass1!",
      otpCode: String(otp.otpCodeHint),
    });
  }

  it("supports signup, verify, and login", async () => {
    const signup = await signupPartner();

    expect(signup.verificationCodeHint).toBeDefined();

    await mockAuthApi.verifyEmail({
      email: "partner@example.com",
      code: String(signup.verificationCodeHint),
    });

    const login = await mockAuthApi.login({
      email: "partner@example.com",
      password: "StrongPass1!",
    });

    expect(login.suspiciousLogin).toBe(false);

    const me = await mockAuthApi.me();
    expect(me.email).toBe("partner@example.com");
    expect(me.emailVerified).toBe(true);
    expect(me.otpEnabled).toBe(false);
  });

  it("does not require OTP at login", async () => {
    const signup = await signupPartner();

    await mockAuthApi.verifyEmail({
      email: "partner@example.com",
      code: String(signup.verificationCodeHint),
    });

    await mockAuthApi.login({
      email: "partner@example.com",
      password: "StrongPass1!",
    });
    await expect(
      mockAuthApi.login({
        email: "partner@example.com",
        password: "StrongPass1!",
      }),
    ).resolves.toMatchObject({ suspiciousLogin: false });
  });

  it("handles password reset lifecycle", async () => {
    const signup = await signupPartner();

    await mockAuthApi.verifyEmail({
      email: "partner@example.com",
      code: String(signup.verificationCodeHint),
    });

    await mockAuthApi.login({
      email: "partner@example.com",
      password: "StrongPass1!",
    });

    const reset = await mockAuthApi.requestPasswordReset({
      email: "partner@example.com",
    });

    await mockAuthApi.resetPassword({
      email: "partner@example.com",
      resetCode: String(reset.resetCodeHint),
      newPassword: "NewStrongPass2@",
    });

    await expect(
      mockAuthApi.login({
        email: "partner@example.com",
        password: "StrongPass1!",
      }),
    ).rejects.toThrow("Invalid credentials.");

    await expect(
      mockAuthApi.login({
        email: "partner@example.com",
        password: "NewStrongPass2@",
      }),
    ).resolves.toMatchObject({ suspiciousLogin: false });
  });

  it("supports session list and revoke", async () => {
    const signup = await signupPartner();

    await mockAuthApi.verifyEmail({
      email: "partner@example.com",
      code: String(signup.verificationCodeHint),
    });

    await mockAuthApi.login({
      email: "partner@example.com",
      password: "StrongPass1!",
    });

    await mockAuthApi.login({
      email: "partner@example.com",
      password: "StrongPass1!",
    });

    const sessions = await mockAuthApi.listSessions();
    expect(sessions.length).toBe(2);

    const updated = await mockAuthApi.revokeSession(sessions[0].id);
    expect(updated.length).toBe(1);
  });

  it("supports logout-all-devices", async () => {
    const signup = await signupPartner();

    await mockAuthApi.verifyEmail({
      email: "partner@example.com",
      code: String(signup.verificationCodeHint),
    });

    await mockAuthApi.login({
      email: "partner@example.com",
      password: "StrongPass1!",
    });
    await mockAuthApi.login({
      email: "partner@example.com",
      password: "StrongPass1!",
    });

    await mockAuthApi.logoutAllSessions();

    await expect(mockAuthApi.me()).rejects.toThrow("Unauthorized");
  });

  it("requires signup OTP", async () => {
    await expect(
      mockAuthApi.signup({
        email: "partner@example.com",
        phone: "+2348011112222",
        password: "StrongPass1!",
        otpCode: "000000",
      }),
    ).rejects.toThrow("Invalid signup OTP code.");
  });

  it("handles legacy localStorage state without crashing", async () => {
    window.localStorage.setItem(
      "tm_partner_mock_state_v1",
      JSON.stringify({
        users: [
          {
            id: "old-user",
            email: "old@example.com",
            phone: "+2348011112222",
            password: "OldPass1!",
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }),
    );

    const otp = await mockAuthApi.requestSignupOtp({
      email: "new@example.com",
      phone: "+2348010009999",
    });

    await expect(
      mockAuthApi.signup({
        email: "new@example.com",
        phone: "+2348010009999",
        password: "StrongPass1!",
        otpCode: String(otp.otpCodeHint),
      }),
    ).resolves.toMatchObject({ verificationCodeHint: expect.any(String) });
  });
});
