import { appConfig } from "@/lib/config";
import type { AuthApi } from "@/modules/auth/contracts";
import { mockAuthApi } from "@/modules/auth/mock-auth-api";
import { realAuthApi } from "@/modules/auth/real-auth-api";
import { setPartnerSessionCookie } from "@/modules/auth/session-cookie";

const baseClient: AuthApi = appConfig.useRealAuthApi || !appConfig.useMockApi ? realAuthApi : mockAuthApi;

export const authClient: AuthApi = {
  requestSignupOtp: (input) => baseClient.requestSignupOtp(input),
  signup: (input) => baseClient.signup(input),
  verifyEmail: (input) => baseClient.verifyEmail(input),
  requestPhoneVerificationOtp: () => baseClient.requestPhoneVerificationOtp(),
  verifyPhone: (input) => baseClient.verifyPhone(input),

  async login(input) {
    const result = await baseClient.login(input);
    setPartnerSessionCookie(true);
    return result;
  },

  requestPasswordReset: (input) => baseClient.requestPasswordReset(input),

  async resetPassword(input) {
    await baseClient.resetPassword(input);
    setPartnerSessionCookie(false);
  },

  async me() {
    try {
      return await baseClient.me();
    } catch (error) {
      setPartnerSessionCookie(false);
      throw error;
    }
  },

  listSessions: () => baseClient.listSessions(),

  async revokeSession(sessionId) {
    const sessions = await baseClient.revokeSession(sessionId);
    if (sessions.length === 0) {
      setPartnerSessionCookie(false);
    }
    return sessions;
  },

  async logout() {
    await baseClient.logout();
    setPartnerSessionCookie(false);
  },

  async logoutAllSessions() {
    await baseClient.logoutAllSessions();
    setPartnerSessionCookie(false);
  },
};
