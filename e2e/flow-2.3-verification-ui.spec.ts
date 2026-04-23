import { expect, test, type APIRequestContext } from "@playwright/test";

async function createPartnerWithCompletedOnboarding(request: APIRequestContext) {
  const unique = Date.now();
  const email = `verification-ui+${unique}@example.com`;
  const phone = `+2348${String(unique).slice(-9)}`;
  const password = "Password123!";
  const businessName = `Verification Flow ${unique}`;

  const otpResponse = await request.post("http://127.0.0.1:8000/api/v1/auth/signup/request-otp", {
    data: { email, phone },
  });
  const otpPayload = (await otpResponse.json()) as { data: { otp_code_hint?: string } };

  const signupResponse = await request.post("http://127.0.0.1:8000/api/v1/auth/signup", {
    data: {
      email,
      phone,
      password,
      otpCode: otpPayload.data.otp_code_hint,
    },
  });
  const signupPayload = (await signupResponse.json()) as {
    data: { verification_code_hint?: string };
  };

  await request.post("http://127.0.0.1:8000/api/v1/auth/verify-email", {
    data: {
      email,
      code: signupPayload.data.verification_code_hint,
    },
  });
  await request.post("http://127.0.0.1:8000/api/v1/auth/login", {
    data: { email, password },
  });

  const meResponse = await request.get("http://127.0.0.1:8000/api/v1/auth/me");
  const mePayload = (await meResponse.json()) as { data: { id: string } };
  const userId = mePayload.data.id;

  for (const [step, data] of [
    [
      "business",
      {
        businessType: "business",
        legalName: `${businessName} Ltd`,
        tradeName: businessName,
        registrationNumber: `RC${unique}`,
      },
    ],
    [
      "contact",
      {
        primaryContactName: `Verification Partner ${unique}`,
        primaryContactEmail: `partner-${unique}@example.com`,
        supportContactEmail: `support-${unique}@example.com`,
      },
    ],
    [
      "operations",
      {
        serviceRegions: ["Lagos"],
        operatingCities: ["Lekki"],
        payoutSchedule: "weekly",
      },
    ],
  ] as const) {
    await request.patch(`http://127.0.0.1:8000/api/v1/partners/${userId}/onboarding`, {
      data: { step, data },
    });
  }
  await request.post(`http://127.0.0.1:8000/api/v1/partners/${userId}/onboarding/submit`);

  return { email, password, businessName };
}

async function requestMoreInfoForLatestCase(request: APIRequestContext, businessName: string) {
  await request.post("http://127.0.0.1:8000/api/v1/admin-auth/login", {
    data: {
      email: "reviewer-lite@travelmate.test",
      password: "TravelMate!2026",
    },
  });

  const queueResponse = await request.get("http://127.0.0.1:8000/api/v1/admin/verification-cases");
  const queuePayload = (await queueResponse.json()) as {
    data: Array<{ id: string; businessName: string }>;
  };
  const caseId = queuePayload.data.find((item) => item.businessName === businessName)?.id;
  expect(caseId).toBeTruthy();

  await request.post(`http://127.0.0.1:8000/api/v1/admin/verification-cases/${caseId}/decision`, {
    data: {
      action: "request_more_info",
      note: "Please upload a clearer registration certificate.",
    },
  });
}

test.describe("TravelMate Partner verification UI flow (2.3)", () => {
  test("supports document upload, submission, rejection visibility, and resubmission", async ({
    page,
    request,
  }) => {
    const partner = await createPartnerWithCompletedOnboarding(request);

    await page.goto("/auth/login");
    await page.getByPlaceholder("Email").fill(partner.email);
    await page.getByPlaceholder("Password").fill(partner.password);
    await Promise.all([
      page.waitForURL(/\/onboarding/),
      page.getByRole("button", { name: "Sign in" }).click(),
    ]);

    await page.goto("/verification");
    await expect(page.getByText(/Partner Verification/i)).toBeVisible();

    await page.locator('input[type="file"]').first().setInputFiles({
      name: "identity-proof.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("identity-proof"),
    });
    await page.getByRole("button", { name: "Add Document" }).click();
    await expect(page.getByRole("status").getByText("Document added.")).toBeVisible();

    await page.getByRole("button", { name: "Submit Verification" }).click();
    await expect(
      page.getByRole("status").getByText("Verification submitted. Status is in_review."),
    ).toBeVisible();
    await expect(page.getByText(/Status: in_review/i)).toBeVisible();

    await requestMoreInfoForLatestCase(request, partner.businessName);

    await page.reload();
    await expect(page.getByText(/Rejection reason: Please upload a clearer registration certificate./i)).toBeVisible();

    await page.locator('input[type="file"]').first().setInputFiles({
      name: "business-registration.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("business-registration"),
    });
    await page.selectOption("select", "business");
    await page.getByRole("button", { name: "Add Document" }).click();
    await expect(page.getByRole("status").getByText("Document added.")).toBeVisible();

    await page.getByRole("button", { name: "Submit Verification" }).click();
    await expect(page.getByText(/Status: in_review/i)).toBeVisible();
  });
});
