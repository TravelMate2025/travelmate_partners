import { beforeEach, describe, expect, it } from "vitest";

import { authClient } from "@/modules/auth/auth-client";
import { dashboardClient } from "@/modules/dashboard/dashboard-client";
import { profileClient } from "@/modules/profile/profile-client";
import { staysClient } from "@/modules/stays/stays-client";
import { verificationClient } from "@/modules/verification/verification-client";

function resetStorage() {
  window.localStorage.clear();
}

async function createAndLoginPartner(email = "partner@example.com") {
  const otp = await authClient.requestSignupOtp({
    email,
    phone: "+2348000000000",
  });

  expect(otp.otpCodeHint).toBeTruthy();

  const signup = await authClient.signup({
    email,
    phone: "+2348000000000",
    password: "Password123!",
    otpCode: otp.otpCodeHint ?? "",
  });

  expect(signup.verificationCodeHint).toBeTruthy();

  await authClient.verifyEmail({
    email,
    code: signup.verificationCodeHint ?? "",
  });

  const login = await authClient.login({
    email,
    password: "Password123!",
  });
  expect(login.suspiciousLogin).toBe(false);

  return authClient.me();
}

describe("partner app flow integrations (2.1 - 2.5)", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("Flow 2.1 auth: supports signup, verify, login, session, and password reset lifecycle", async () => {
    const email = "flow21@example.com";
    const user = await createAndLoginPartner(email);

    expect(user.emailVerified).toBe(true);
    expect(user.email).toBe(email);

    const sessions = await authClient.listSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(1);

    const reset = await authClient.requestPasswordReset({ email });
    expect(reset.resetCodeHint).toBeTruthy();

    await authClient.resetPassword({
      email,
      resetCode: reset.resetCodeHint ?? "",
      newPassword: "Password456!",
    });

    await expect(authClient.me()).rejects.toThrow("Unauthorized");

    await authClient.login({
      email,
      password: "Password456!",
    });

    const relogged = await authClient.me();
    expect(relogged.email).toBe(email);
  });

  it("Flow 2.2 onboarding and Flow 2.3 verification complete end-to-end", async () => {
    const user = await createAndLoginPartner("flow23@example.com");

    await expect(profileClient.submitOnboarding(user.id)).rejects.toThrow(
      "Complete all onboarding steps before submission.",
    );

    let onboarding = await profileClient.saveStep(user.id, "business", {
      businessType: "business",
      legalName: "TravelMate Ltd",
      tradeName: "TravelMate",
      registrationNumber: "RC123456",
    });
    expect(onboarding.status).toBe("in_progress");

    onboarding = await profileClient.saveStep(user.id, "contact", {
      primaryContactName: "Jane Doe",
      primaryContactEmail: "jane@example.com",
      supportContactEmail: "support@example.com",
    });
    expect(onboarding.status).toBe("in_progress");

    onboarding = await profileClient.saveStep(user.id, "operations", {
      operatingCountries: ["Nigeria"],
      operatingRegions: ["Lagos", "Federal Capital Territory"],
      operatingCities: ["Ikeja", "Abuja"],
      coverageNotes: "",
      payoutMethod: "bank_transfer",
      settlementCurrency: "NGN",
      payoutSchedule: "weekly",
    });
    expect(onboarding.status).toBe("in_progress");

    onboarding = await profileClient.submitOnboarding(user.id);
    expect(onboarding.status).toBe("completed");

    let verification = await verificationClient.addDocument(user.id, {
      category: "identity",
      fileName: "id.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
    });
    expect(verification.documents.length).toBe(1);

    verification = await verificationClient.submitVerification(user.id);
    expect(verification.status).toBe("in_review");

    await new Promise((resolve) => setTimeout(resolve, 1600));
    verification = await verificationClient.getVerification(user.id);
    expect(verification.status).toBe("rejected");
    expect(verification.rejectionReason).toBeTruthy();

    await verificationClient.addDocument(user.id, {
      category: "business",
      fileName: "registration.pdf",
      fileType: "application/pdf",
      fileSize: 2048,
    });

    await verificationClient.submitVerification(user.id);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    verification = await verificationClient.getVerification(user.id);
    expect(verification.status).toBe("approved");
  });

  it("Flow 2.4 dashboard and Flow 2.5 stays work through status lifecycle", async () => {
    const user = await createAndLoginPartner("flow25@example.com");

    await profileClient.saveStep(user.id, "business", {
      businessType: "business",
      legalName: "TravelMate Ltd",
      tradeName: "TravelMate",
      registrationNumber: "RC123456",
    });
    await profileClient.saveStep(user.id, "contact", {
      primaryContactName: "Jane Doe",
      primaryContactEmail: "jane@example.com",
      supportContactEmail: "support@example.com",
    });
    await profileClient.saveStep(user.id, "operations", {
      operatingCountries: ["Nigeria"],
      operatingRegions: ["Lagos"],
      operatingCities: ["Lekki"],
      coverageNotes: "",
      payoutMethod: "bank_transfer",
      settlementCurrency: "NGN",
      payoutSchedule: "weekly",
    });
    await profileClient.submitOnboarding(user.id);

    await verificationClient.addDocument(user.id, {
      category: "identity",
      fileName: "id.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
    });
    await verificationClient.submitVerification(user.id);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    await verificationClient.getVerification(user.id);
    await verificationClient.addDocument(user.id, {
      category: "business",
      fileName: "registration.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
    });
    await verificationClient.submitVerification(user.id);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    const verification = await verificationClient.getVerification(user.id);
    expect(verification.status).toBe("approved");

    let dashboard = await dashboardClient.getDashboard(user.id);
    expect(dashboard.summary.activeListings).toBeGreaterThanOrEqual(0);
    expect(dashboard.alerts.length).toBeGreaterThan(0);

    dashboard = await dashboardClient.recordQuickAction(user.id, "add_stay");
    expect(dashboard.recentActivity[0].title).toContain("Add Stay");

    let stay = await staysClient.createStay(user.id, {
      propertyType: "hotel",
      name: "Ocean View Hotel",
      description: "Seaside rooms",
      address: "1 Marina Road",
      city: "Lagos",
      country: "Nigeria",
    });
    expect(stay.status).toBe("draft");

    stay = await staysClient.updateStay(user.id, stay.id, {
      amenities: ["wifi", "pool"],
      checkInTime: "14:00",
      checkOutTime: "11:00",
      cancellationPolicy: "Flexible",
    });
    expect(stay.amenities).toContain("wifi");

    stay = await staysClient.upsertRoom(user.id, stay.id, {
      name: "Deluxe Suite",
      occupancy: 2,
      bedConfiguration: "1 King Bed",
      baseRate: 120,
    });
    expect(stay.rooms.length).toBe(1);

    stay = await staysClient.addImage(user.id, stay.id, {
      fileName: "front.jpg",
      fileType: "image/jpeg",
      fileSize: 100_000,
    });
    expect(stay.images.length).toBe(1);

    stay = await staysClient.updateStatus(user.id, stay.id, "pending");
    expect(stay.status).toBe("rejected");

    stay = await staysClient.updateStatus(user.id, stay.id, "pending");
    expect(stay.status).toBe("approved");

    stay = await staysClient.updateStatus(user.id, stay.id, "live");
    expect(stay.status).toBe("live");

    stay = await staysClient.updateStatus(user.id, stay.id, "paused");
    expect(stay.status).toBe("paused");

    stay = await staysClient.archiveStay(user.id, stay.id);
    expect(stay.status).toBe("archived");
  });
});
