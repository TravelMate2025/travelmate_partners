export type PartnerUser = {
  id: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  otpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartnerSession = {
  id: string;
  fingerprint: string;
  createdAt: string;
  lastSeenAt: string;
};

export type SignupInput = { email: string; phone: string; password: string; otpCode: string };
export type VerifyEmailInput = { email: string; code: string };
export type LoginInput = { email: string; password: string };
export type RequestResetInput = { email: string };
export type ResetPasswordInput = { email: string; resetCode: string; newPassword: string };
export type RequestSignupOtpInput = { email: string; phone: string };

export type AuthApi = {
  requestSignupOtp(input: RequestSignupOtpInput): Promise<{ otpCodeHint?: string }>;
  signup(input: SignupInput): Promise<{ verificationCodeHint?: string }>;
  verifyEmail(input: VerifyEmailInput): Promise<void>;
  login(input: LoginInput): Promise<{ suspiciousLogin: boolean }>;
  requestPasswordReset(input: RequestResetInput): Promise<{ resetCodeHint?: string }>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
  me(): Promise<PartnerUser>;
  listSessions(): Promise<PartnerSession[]>;
  revokeSession(sessionId: string): Promise<PartnerSession[]>;
  logoutAllSessions(): Promise<void>;
  logout(): Promise<void>;
};
