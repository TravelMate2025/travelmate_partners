import { beforeEach, describe, expect, it } from "vitest";

import { staysClient } from "@/modules/stays/stays-client";
import { transfersClient } from "@/modules/transfers/transfers-client";
import { verificationClient } from "@/modules/verification/verification-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.9 strict alignment (media and document management)", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("supports upload, validation, reorder, replace, and remove with linked records updated", async () => {
    const userId = "flow29-strict-user";

    // User uploads image/document assets from listing/editor screens.
    let stay = await staysClient.createStay(userId, {
      propertyType: "hotel",
      name: "Flow 2.9 Stay",
      description: "Media lifecycle",
      address: "17 Marina",
      city: "Lagos",
      country: "Nigeria",
    });
    stay = await staysClient.addImage(userId, stay.id, {
      fileName: "front.jpg",
      fileType: "image/jpeg",
      fileSize: 90_000,
    });
    stay = await staysClient.addImage(userId, stay.id, {
      fileName: "pool.png",
      fileType: "image/png",
      fileSize: 92_000,
    });

    let verification = await verificationClient.addDocument(userId, {
      category: "identity",
      fileName: "passport.pdf",
      fileType: "application/pdf",
      fileSize: 80_000,
    });
    let transfer = await transfersClient.createTransfer(userId, {
      name: "Flow 2.9 Transfer",
      transferType: "airport",
      pickupPoint: "Airport",
      dropoffPoint: "Victoria Island",
      vehicleClass: "SUV",
      passengerCapacity: 4,
      luggageCapacity: 3,
      coverageArea: "Lagos",
    });
    transfer = await transfersClient.addImage(userId, transfer.id, {
      fileName: "vehicle.jpg",
      fileType: "image/jpeg",
      fileSize: 95_000,
    });
    expect(stay.images.length).toBe(2);
    expect(verification.documents.length).toBe(1);
    expect(transfer.images.length).toBe(1);

    // System validates files and stores metadata.
    await expect(
      staysClient.addImage(userId, stay.id, {
        fileName: "script.gif",
        fileType: "image/gif",
        fileSize: 1234,
      }),
    ).rejects.toThrow("Invalid image format");
    await expect(
      verificationClient.addDocument(userId, {
        category: "business",
        fileName: "malware.exe",
        fileType: "application/x-msdownload",
        fileSize: 1234,
      }),
    ).rejects.toThrow("Unsupported file type");
    await expect(
      transfersClient.addImage(userId, transfer.id, {
        fileName: "vehicle.bmp",
        fileType: "image/bmp",
        fileSize: 2000,
      }),
    ).rejects.toThrow("Invalid image format");

    // User reorders, replaces, or removes files.
    const firstOrder = stay.images.sort((a, b) => a.order - b.order).map((img) => img.id);
    stay = await staysClient.reorderImages(userId, stay.id, [...firstOrder].reverse());
    expect(stay.images.sort((a, b) => a.order - b.order)[0].id).toBe(firstOrder[1]);

    const replaceImageTarget = stay.images[0];
    stay = await staysClient.replaceImage(userId, stay.id, replaceImageTarget.id, {
      fileName: "front-updated.webp",
      fileType: "image/webp",
      fileSize: 101_000,
    });
    expect(stay.images.find((img) => img.id === replaceImageTarget.id)?.fileName).toBe(
      "front-updated.webp",
    );

    verification = await verificationClient.replaceDocument(
      userId,
      verification.documents[0].id,
      {
        category: "identity",
        fileName: "passport-renewed.pdf",
        fileType: "application/pdf",
        fileSize: 88_000,
      },
    );
    expect(verification.documents[0].fileName).toBe("passport-renewed.pdf");
    const transferImageId = transfer.images[0].id;
    transfer = await transfersClient.replaceImage(userId, transfer.id, transferImageId, {
      fileName: "vehicle-new.webp",
      fileType: "image/webp",
      fileSize: 90_000,
    });
    expect(transfer.images[0].fileName).toBe("vehicle-new.webp");

    stay = await staysClient.removeImage(userId, stay.id, stay.images[1].id);
    verification = await verificationClient.removeDocument(userId, verification.documents[0].id);
    transfer = await transfersClient.removeImage(userId, transfer.id, transfer.images[0].id);

    // System updates linked listing/verification records.
    const refreshedStay = await staysClient.getStay(userId, stay.id);
    const refreshedVerification = await verificationClient.getVerification(userId);
    const refreshedTransfer = await transfersClient.getTransfer(userId, transfer.id);
    expect(refreshedStay.images.length).toBe(1);
    expect(refreshedVerification.documents.length).toBe(0);
    expect(refreshedTransfer.images.length).toBe(0);
  });
});
