import { apiRequest } from "@/lib/http-client";
import type {
  AuthApi,
  LoginInput,
  PartnerSession,
  PartnerUser,
  RequestResetInput,
  ResetPasswordInput,
  SignupInput,
  VerifyEmailInput,
} from "@/modules/auth/contracts";

type Envelope<T> = { data: T };
type EmptyData = Record<string, never>;

export const realAuthApi: AuthApi = {
  async requestSignupOtp(input) {
    const response = await apiRequest<Envelope<{ otp_code_hint?: string }>>("/auth/signup/request-otp", {
      method: "POST",
      body: input,
    });

    return {
      otpCodeHint: response.data.otp_code_hint,
    };
  },

  async signup(input: SignupInput) {
    const response = await apiRequest<Envelope<{ verification_code_hint?: string }>>("/auth/signup", {
      method: "POST",
      body: input,
    });

    return {
      verificationCodeHint: response.data.verification_code_hint,
    };
  },

  async verifyEmail(input: VerifyEmailInput) {
    await apiRequest<Envelope<EmptyData>>("/auth/verify-email", {
      method: "POST",
      body: input,
    });
  },

  async login(input: LoginInput) {
    const response = await apiRequest<Envelope<{ suspicious_login?: boolean }>>("/auth/login", {
      method: "POST",
      body: input,
    });

    return {
      suspiciousLogin: Boolean(response.data.suspicious_login),
    };
  },

  async requestPasswordReset(input: RequestResetInput) {
    const response = await apiRequest<Envelope<{ reset_code_hint?: string }>>("/auth/request-password-reset", {
      method: "POST",
      body: input,
    });

    return {
      resetCodeHint: response.data.reset_code_hint,
    };
  },

  async resetPassword(input: ResetPasswordInput) {
    await apiRequest<Envelope<EmptyData>>("/auth/reset-password", {
      method: "POST",
      body: input,
    });
  },

  async me() {
    const response = await apiRequest<Envelope<PartnerUser>>("/auth/me");
    return response.data;
  },

  async listSessions() {
    const response = await apiRequest<Envelope<PartnerSession[]>>("/auth/sessions");
    return response.data;
  },

  async revokeSession(sessionId: string) {
    const response = await apiRequest<Envelope<PartnerSession[]>>(`/auth/sessions/${sessionId}`, {
      method: "DELETE",
    });

    return response.data;
  },

  async logout() {
    await apiRequest<Envelope<EmptyData>>("/auth/logout", {
      method: "POST",
    });
  },

  async logoutAllSessions() {
    await apiRequest<Envelope<EmptyData>>("/auth/sessions/logout-all", {
      method: "POST",
    });
  },
};
