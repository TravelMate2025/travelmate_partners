import type {
  AuthApi,
  LoginInput,
  PartnerSession,
  PartnerUser,
  RequestSignupOtpInput,
  RequestResetInput,
  ResetPasswordInput,
  SignupInput,
  VerifyEmailInput,
} from "@/modules/auth/contracts";

type MockUser = PartnerUser & {
  password: string;
  verificationCode: string;
  resetCode?: string;
  otpCode?: string;
  knownFingerprints: string[];
};

type MockState = {
  users: MockUser[];
  sessions: Array<PartnerSession & { userId: string; token: string }>;
  signupOtps: Array<{ email: string; phone: string; code: string }>;
  currentToken?: string;
};

const STORAGE_KEY = "tm_partner_mock_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function createEmptyState(): MockState {
  return { users: [], sessions: [], signupOtps: [] };
}

function normalizeState(value: unknown): MockState {
  if (!value || typeof value !== "object") {
    return createEmptyState();
  }

  const candidate = value as Partial<MockState>;

  const users = Array.isArray(candidate.users)
    ? candidate.users
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const user = item as Partial<MockUser>;
          return {
            id: typeof user.id === "string" ? user.id : makeId(),
            email: typeof user.email === "string" ? user.email : "",
            phone: typeof user.phone === "string" ? user.phone : "",
            password: typeof user.password === "string" ? user.password : "",
            emailVerified: Boolean(user.emailVerified),
            otpEnabled: Boolean(user.otpEnabled),
            createdAt: typeof user.createdAt === "string" ? user.createdAt : nowIso(),
            updatedAt: typeof user.updatedAt === "string" ? user.updatedAt : nowIso(),
            verificationCode:
              typeof user.verificationCode === "string" ? user.verificationCode : "",
            resetCode: typeof user.resetCode === "string" ? user.resetCode : undefined,
            otpCode: typeof user.otpCode === "string" ? user.otpCode : undefined,
            knownFingerprints: Array.isArray(user.knownFingerprints)
              ? user.knownFingerprints.filter(
                  (fingerprint): fingerprint is string => typeof fingerprint === "string",
                )
              : [],
          } satisfies MockUser;
        })
    : [];

  const sessions = Array.isArray(candidate.sessions)
    ? candidate.sessions
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const session = item as Partial<PartnerSession & { userId: string; token: string }>;
          return {
            id: typeof session.id === "string" ? session.id : makeId(),
            userId: typeof session.userId === "string" ? session.userId : "",
            token: typeof session.token === "string" ? session.token : "",
            fingerprint: typeof session.fingerprint === "string" ? session.fingerprint : "unknown",
            createdAt: typeof session.createdAt === "string" ? session.createdAt : nowIso(),
            lastSeenAt: typeof session.lastSeenAt === "string" ? session.lastSeenAt : nowIso(),
          };
        })
        .filter((session) => session.userId && session.token)
    : [];

  return {
    users,
    sessions,
    signupOtps: Array.isArray(candidate.signupOtps) ? candidate.signupOtps : [],
    currentToken:
      typeof candidate.currentToken === "string" ? candidate.currentToken : undefined,
  };
}

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readState(): MockState {
  if (typeof window === "undefined") {
    return createEmptyState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyState();
  }
  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return createEmptyState();
  }
}

function writeState(state: MockState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function fingerprint() {
  if (typeof window === "undefined") {
    return "server::mock";
  }

  return `${window.navigator.language}::${window.navigator.userAgent.slice(0, 60)}`;
}

function requireCurrentUser(state: MockState) {
  const token = state.currentToken;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const session = state.sessions.find((item) => item.token === token);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = state.users.find((item) => item.id === session.userId);
  if (!user) {
    throw new Error("Unauthorized");
  }

  session.lastSeenAt = nowIso();
  return { user, session };
}

export const mockAuthApi: AuthApi = {
  async requestSignupOtp(input: RequestSignupOtpInput) {
    const state = readState();
    const email = input.email.toLowerCase();
    const phone = input.phone;

    if (!email || !phone) {
      throw new Error("Email and phone are required to request OTP.");
    }

    const code = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");

    state.signupOtps = state.signupOtps.filter((item) => item.email !== email);
    state.signupOtps.push({ email, phone, code });
    writeState(state);

    return { otpCodeHint: code };
  },

  async signup(input: SignupInput) {
    const state = readState();
    const email = input.email.toLowerCase();

    if (state.users.find((item) => item.email.toLowerCase() === email)) {
      throw new Error("An account already exists for this email.");
    }

    const challenge = state.signupOtps.find(
      (item) => item.email === email && item.phone === input.phone,
    );

    if (!challenge || challenge.code !== input.otpCode) {
      throw new Error("Invalid signup OTP code.");
    }

    const code = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");
    const ts = nowIso();

    const user: MockUser = {
      id: makeId(),
      email,
      phone: input.phone,
      password: input.password,
      emailVerified: false,
      otpEnabled: false,
      createdAt: ts,
      updatedAt: ts,
      verificationCode: code,
      knownFingerprints: [],
    };

    state.users.push(user);
    state.signupOtps = state.signupOtps.filter((item) => item.email !== email);
    writeState(state);

    return { verificationCodeHint: code };
  },

  async verifyEmail(input: VerifyEmailInput) {
    const state = readState();
    const user = state.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());

    if (!user || user.verificationCode !== input.code) {
      throw new Error("Invalid verification code.");
    }

    user.emailVerified = true;
    user.verificationCode = "";
    user.updatedAt = nowIso();

    writeState(state);
  },

  async login(input: LoginInput) {
    const state = readState();
    const user = state.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());

    if (!user || user.password !== input.password) {
      throw new Error("Invalid credentials.");
    }

    if (!user.emailVerified) {
      throw new Error("Verify your email before logging in.");
    }

    const fp = fingerprint();
    const suspiciousLogin = user.knownFingerprints.length > 0 && !user.knownFingerprints.includes(fp);

    if (!user.knownFingerprints.includes(fp)) {
      user.knownFingerprints.push(fp);
    }

    const ts = nowIso();
    const session = {
      id: makeId(),
      userId: user.id,
      token: makeId(),
      fingerprint: fp,
      createdAt: ts,
      lastSeenAt: ts,
    };

    state.sessions.push(session);
    state.currentToken = session.token;
    user.updatedAt = ts;
    writeState(state);

    return { suspiciousLogin };
  },

  async requestPasswordReset(input: RequestResetInput) {
    const state = readState();
    const user = state.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());

    if (!user) {
      return {};
    }

    const code = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");

    user.resetCode = code;
    user.updatedAt = nowIso();
    writeState(state);

    return { resetCodeHint: code };
  },

  async resetPassword(input: ResetPasswordInput) {
    const state = readState();
    const user = state.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());

    if (!user || !user.resetCode || user.resetCode !== input.resetCode) {
      throw new Error("Invalid reset code.");
    }

    user.password = input.newPassword;
    user.resetCode = undefined;
    user.updatedAt = nowIso();

    state.sessions = state.sessions.filter((item) => item.userId !== user.id);
    state.currentToken = undefined;
    writeState(state);
  },

  async me() {
    const state = readState();
    const { user } = requireCurrentUser(state);
    writeState(state);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      otpEnabled: user.otpEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  async listSessions() {
    const state = readState();
    const { user } = requireCurrentUser(state);
    const sessions = state.sessions
      .filter((item) => item.userId === user.id)
      .map((item) => ({
        id: item.id,
        fingerprint: item.fingerprint,
        createdAt: item.createdAt,
        lastSeenAt: item.lastSeenAt,
      }));

    writeState(state);
    return sessions;
  },

  async revokeSession(sessionId: string) {
    const state = readState();
    const { user } = requireCurrentUser(state);

    state.sessions = state.sessions.filter((item) => !(item.userId === user.id && item.id === sessionId));

    const tokenStillValid = state.sessions.some((item) => item.token === state.currentToken);
    if (!tokenStillValid) {
      state.currentToken = undefined;
    }

    writeState(state);
    return this.listSessions();
  },

  async logout() {
    const state = readState();
    state.currentToken = undefined;
    writeState(state);
  },

  async logoutAllSessions() {
    const state = readState();
    const { user } = requireCurrentUser(state);
    state.sessions = state.sessions.filter((item) => item.userId !== user.id);
    state.currentToken = undefined;
    writeState(state);
  },
};
