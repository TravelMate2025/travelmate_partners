import { describe, expect, it } from "vitest";

import { buildRoomUpsertPayload, resolveRoomBookableForSaleMode } from "./use-stay-detail";

describe("resolveRoomBookableForSaleMode", () => {
  it("forces unit-level rooms to non-bookable", () => {
    expect(resolveRoomBookableForSaleMode("unit_level", true)).toBe(false);
    expect(resolveRoomBookableForSaleMode("unit_level", false)).toBe(false);
  });

  it("preserves room-level bookable selection", () => {
    expect(resolveRoomBookableForSaleMode("room_level", true)).toBe(true);
    expect(resolveRoomBookableForSaleMode("room_level", false)).toBe(false);
  });

  it("sends unit-level rooms as non-bookable payloads", () => {
    expect(
      buildRoomUpsertPayload({
        saleMode: "unit_level",
        roomName: "Living Room",
        roomOccupancy: "2",
        roomBed: "Sofa",
        roomRate: "0",
        roomIsBookable: true,
        roomTotalInventory: "1",
        roomMaxPerBooking: "1",
      }),
    ).toEqual({
      name: "Living Room",
      occupancy: 2,
      bedConfiguration: "Sofa",
      baseRate: 0,
      isBookable: false,
    });
  });
});
