import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StayRoomsSection } from "./stay-rooms-section";
import type { StayListing } from "@/modules/stays/contracts";

function makeStay(overrides: Partial<StayListing> = {}): StayListing {
  return {
    id: "stay-1",
    userId: "user-1",
    status: "live",
    propertyType: "apartment",
    saleMode: "unit_level",
    name: "Lagoon View Suites",
    description: "",
    address: "",
    city: "Lagos",
    country: "Nigeria",
    adminLevel1: "Lagos",
    area: "Lekki",
    cityReviewStatus: "approved",
    latitude: "",
    longitude: "",
    amenities: [],
    houseRules: "",
    checkInTime: "",
    checkOutTime: "",
    cancellationPolicy: "",
    images: [],
    rooms: [
      {
        id: "room-1",
        name: "Deluxe Room",
        occupancy: 2,
        bedConfiguration: "King bed",
        baseRate: 50000,
        isBookable: true,
        totalInventory: 1,
        maxPerBooking: 1,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("StayRoomsSection", () => {
  it("disables room editing when the stay is not draft or rejected", () => {
    render(
      <StayRoomsSection
        stay={makeStay({ status: "live" })}
        canEditDetails={false}
        roomName=""
        roomOccupancy="2"
        roomBed=""
        roomRate="0"
        roomIsBookable
        roomTotalInventory="1"
        roomMaxPerBooking="1"
        roomFormMessage=""
        onSetRoomName={vi.fn()}
        onSetRoomOccupancy={vi.fn()}
        onSetRoomBed={vi.fn()}
        onSetRoomRate={vi.fn()}
        onSetRoomIsBookable={vi.fn()}
        onSetRoomTotalInventory={vi.fn()}
        onSetRoomMaxPerBooking={vi.fn()}
        onAddRoom={vi.fn()}
        onRemoveRoom={vi.fn()}
        onAddRoomImage={vi.fn()}
        onMoveImageToProperty={vi.fn()}
        onRemoveImage={vi.fn()}
      />,
    );

    expect(screen.getByText("Add Room")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
    expect(screen.getByPlaceholderText("Room name")).toBeDisabled();
  });

  it("blocks adding a bookable room with zero base rate", () => {
    render(
      <StayRoomsSection
        stay={makeStay({ status: "draft", saleMode: "room_level", propertyType: "hotel" })}
        canEditDetails
        roomName="Deluxe Room"
        roomOccupancy="2"
        roomBed="King bed"
        roomRate="0"
        roomIsBookable
        roomTotalInventory="1"
        roomMaxPerBooking="1"
        roomFormMessage=""
        onSetRoomName={vi.fn()}
        onSetRoomOccupancy={vi.fn()}
        onSetRoomBed={vi.fn()}
        onSetRoomRate={vi.fn()}
        onSetRoomIsBookable={vi.fn()}
        onSetRoomTotalInventory={vi.fn()}
        onSetRoomMaxPerBooking={vi.fn()}
        onAddRoom={vi.fn()}
        onRemoveRoom={vi.fn()}
        onAddRoomImage={vi.fn()}
        onMoveImageToProperty={vi.fn()}
        onRemoveImage={vi.fn()}
      />,
    );

    expect(screen.getByText("Add Room")).toBeDisabled();
    expect(screen.getByText(/Bookable rooms must have Base Rate greater than 0/i)).toBeInTheDocument();
  });
});
