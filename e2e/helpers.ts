import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";
const apiDir = path.resolve(__dirname, "../../api");
const apiPython = path.resolve(apiDir, "venv/bin/python");

function readLatestSignupOtpCode(email: string): string {
  return execFileSync(
    apiPython,
    [
      "manage.py",
      "shell",
      "-c",
      [
        "from apps.users.models import SignupOtpRequest",
        `request = SignupOtpRequest.objects.filter(email='${email}').order_by('-created_at').first()`,
        "print(request.otp_code if request else '')",
      ].join("; "),
    ],
    { cwd: apiDir, encoding: "utf-8" },
  ).trim();
}

function readUserIdByEmail(email: string): string {
  return execFileSync(
    apiPython,
    [
      "manage.py",
      "shell",
      "-c",
      [
        "from apps.users.models import User",
        `user = User.objects.filter(email='${email}').first()`,
        "print(user.id if user else '')",
      ].join("; "),
    ],
    { cwd: apiDir, encoding: "utf-8" },
  ).trim();
}

function seedBackendPartnerState(userId: string): void {
  execFileSync(
    apiPython,
    [
      "manage.py",
      "shell",
      "-c",
      [
        "from django.utils import timezone",
        "from apps.users.models import User",
        "from apps.partners.models import PartnerOnboardingProfile, PartnerVerificationProfile",
        `user = User.objects.get(id='${userId}')`,
        "onboarding, _ = PartnerOnboardingProfile.objects.get_or_create(partner=user)",
        "onboarding.business_type = 'business'",
        "onboarding.legal_name = onboarding.legal_name or 'TravelMate Ltd'",
        "onboarding.registration_number = onboarding.registration_number or 'RC123456'",
        "onboarding.primary_contact_name = onboarding.primary_contact_name or 'Jane Doe'",
        "onboarding.primary_contact_email = onboarding.primary_contact_email or 'jane@example.com'",
        "onboarding.operating_countries = onboarding.operating_countries or ['Nigeria']",
        "onboarding.operating_regions = onboarding.operating_regions or ['Lagos']",
        "onboarding.operating_cities = onboarding.operating_cities or ['Lekki']",
        "onboarding.payout_method = onboarding.payout_method or 'bank_transfer'",
        "onboarding.settlement_currency = onboarding.settlement_currency or 'NGN'",
        "onboarding.disbursement_cadence = onboarding.disbursement_cadence or 'weekly'",
        "onboarding.status = 'completed'",
        "onboarding.submitted_at = onboarding.submitted_at or timezone.now()",
        "onboarding.save()",
        "verification, _ = PartnerVerificationProfile.objects.get_or_create(partner=user)",
        "verification.status = 'approved'",
        "verification.lifecycle_state = 'active'",
        "verification.submission_count = max(verification.submission_count, 1)",
        "verification.submitted_at = verification.submitted_at or timezone.now()",
        "verification.decided_at = timezone.now()",
        "verification.save()",
        "print('ok')",
      ].join("; "),
    ],
    { cwd: apiDir, encoding: "utf-8" },
  );
}

/**
 * Does a full real-API signup → login flow.
 * Returns the real userId from /auth/me so callers can key mock
 * feature state by the correct user.
 */
export async function signupAndLoginGetUserId(
  page: Page,
  email: string,
  phone: string,
  password: string,
): Promise<string> {
  await page.goto("/auth/signup");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").fill(phone);
  const sendOtpButton = page.getByRole("button", { name: /Send OTP/i });
  await sendOtpButton.click();
  await expect(sendOtpButton).toBeEnabled();

  const signupOtp = readLatestSignupOtpCode(email);
  expect(signupOtp).toMatch(/^\d{6}$/);
  await page.getByLabel("Signup OTP").fill(signupOtp);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/auth\/login/);

  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/onboarding");

  const userId = readUserIdByEmail(email);
  expect(userId).toBeTruthy();

  return userId;
}

export function seedProfileAndVerification(
  page: Page,
  userId: string,
  ts: string,
): Promise<void> {
  seedBackendPartnerState(userId);
  return page.evaluate(
    ({ seededUserId, seededTs }) => {
      window.localStorage.setItem(
        "tm_partner_profile_state_v1",
        JSON.stringify({
          onboardingByUserId: {
            [seededUserId]: {
              userId: seededUserId,
              data: {
                businessType: "business",
                legalName: "TravelMate Ltd",
                tradeName: "TravelMate",
                registrationNumber: "RC123456",
                primaryContactName: "Jane Doe",
                primaryContactEmail: "jane@example.com",
                supportContactEmail: "support@example.com",
                operatingCountries: ["Nigeria"],
                operatingRegions: ["Lagos"],
                operatingCities: ["Lekki"],
                coverageNotes: "",
                payoutMethod: "bank_transfer",
                settlementCurrency: "NGN",
                payoutSchedule: "weekly",
              },
              completedSteps: ["business", "contact", "operations"],
              status: "completed",
              updatedAt: seededTs,
            },
          },
        }),
      );

      window.localStorage.setItem(
        "tm_partner_verification_state_v1",
        JSON.stringify({
          byUserId: {
            [seededUserId]: {
              userId: seededUserId,
              status: "approved",
              documents: [],
              submissionCount: 1,
              submittedAt: seededTs,
              decidedAt: seededTs,
              updatedAt: seededTs,
            },
          },
        }),
      );
    },
    { seededUserId: userId, seededTs: ts },
  );
}
