"use client";

import type { StayListing } from "@/modules/stays/contracts";

type Props = {
  stay: StayListing;
  roomName: string;
  roomOccupancy: string;
  roomBed: string;
  roomRate: string;
  roomIsBookable: boolean;
  roomTotalInventory: string;
  roomMaxPerBooking: string;
  roomFormMessage: string;
  onSetRoomName: (v: string) => void;
  onSetRoomOccupancy: (v: string) => void;
  onSetRoomBed: (v: string) => void;
  onSetRoomRate: (v: string) => void;
  onSetRoomIsBookable: (v: boolean) => void;
  onSetRoomTotalInventory: (v: string) => void;
  onSetRoomMaxPerBooking: (v: string) => void;
  onAddRoom: () => void;
  onRemoveRoom: (roomId: string) => void;
  onAddRoomImage: (file: File, roomId: string) => void;
  onMoveImageToProperty: (imageId: string) => void;
  onRemoveImage: (imageId: string) => void;
};

export function StayRoomsSection({
  stay,
  roomName,
  roomOccupancy,
  roomBed,
  roomRate,
  roomIsBookable,
  roomTotalInventory,
  roomMaxPerBooking,
  roomFormMessage,
  onSetRoomName,
  onSetRoomOccupancy,
  onSetRoomBed,
  onSetRoomRate,
  onSetRoomIsBookable,
  onSetRoomTotalInventory,
  onSetRoomMaxPerBooking,
  onAddRoom,
  onRemoveRoom,
  onAddRoomImage,
  onMoveImageToProperty,
  onRemoveImage,
}: Props) {
  const isRoomLevel = stay.saleMode === "room_level";
  const totalInventory = Number(roomTotalInventory);
  const maxPerBooking = Number(roomMaxPerBooking);
  const roomLevelHints: string[] = [];
  if (isRoomLevel && roomIsBookable && totalInventory < 1) {
    roomLevelHints.push("Bookable rooms must have Total Inventory of at least 1.");
  }
  if (isRoomLevel && roomIsBookable && maxPerBooking < 1) {
    roomLevelHints.push("Bookable rooms must have Max Per Booking of at least 1.");
  }
  if (isRoomLevel && roomIsBookable && totalInventory >= 1 && maxPerBooking > totalInventory) {
    roomLevelHints.push("Max Per Booking cannot be greater than Total Inventory.");
  }
  return (
    <section className="tm-panel p-6">
      <h2 className="tm-section-title">Rooms / Units</h2>
      {isRoomLevel ? (
        <div className="tm-note mt-3 text-xs">
          Hotels, guest houses, and resorts require <strong>Bookable</strong>, <strong>Total Inventory</strong>, and{" "}
          <strong>Max Per Booking</strong> for room setup and go-live readiness.
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="tm-field">
          <span className="tm-field-label">Room Name</span>
          <input className="tm-input" placeholder="Room name" value={roomName} onChange={(e) => onSetRoomName(e.target.value)} />
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Occupancy</span>
          <input className="tm-input" placeholder="Occupancy" type="number" value={roomOccupancy} onChange={(e) => onSetRoomOccupancy(e.target.value)} />
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Bed Configuration</span>
          <input className="tm-input" placeholder="Bed configuration" value={roomBed} onChange={(e) => onSetRoomBed(e.target.value)} />
        </label>
        <label className="tm-field">
          <span className="tm-field-label">Base Rate</span>
          <input className="tm-input" placeholder="Base rate" type="number" value={roomRate} onChange={(e) => onSetRoomRate(e.target.value)} />
        </label>
        {isRoomLevel ? (
          <>
            <label className="tm-field">
              <span className="tm-field-label">Bookable</span>
              <select
                className="tm-input"
                value={roomIsBookable ? "true" : "false"}
                onChange={(e) => onSetRoomIsBookable(e.target.value === "true")}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">Set to No to keep this room unavailable for booking.</p>
            </label>
            <label className="tm-field">
              <span className="tm-field-label">Total Inventory</span>
              <input
                className="tm-input"
                placeholder="Total inventory"
                type="number"
                min={0}
                value={roomTotalInventory}
                onChange={(e) => onSetRoomTotalInventory(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">Total rooms of this type available for sale.</p>
            </label>
            <label className="tm-field">
              <span className="tm-field-label">Max Per Booking</span>
              <input
                className="tm-input"
                placeholder="Max per booking"
                type="number"
                min={0}
                value={roomMaxPerBooking}
                onChange={(e) => onSetRoomMaxPerBooking(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">Maximum rooms a guest can book in one reservation.</p>
            </label>
          </>
        ) : null}
      </div>
      <button className="tm-btn tm-btn-accent mt-3" onClick={() => void onAddRoom()} type="button">
        Add Room
      </button>
      {roomFormMessage ? <p className="mt-2 text-sm text-rose-700">{roomFormMessage}</p> : null}
      {roomLevelHints.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {roomLevelHints.map((hint) => (
            <li key={hint} className="text-sm text-amber-700">
              {hint}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="tm-list-stack mt-4">
        {stay.rooms.map((room) => {
          const roomImages = [...stay.images]
            .filter((img) => img.roomId === room.id)
            .sort((a, b) => a.order - b.order);
          return (
            <li key={room.id} className="tm-list-card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-slate-700">
                  <p className="font-medium">{room.name}</p>
                  <p className="text-xs text-slate-500">
                    Occupancy: {room.occupancy} • {room.bedConfiguration} • Rate: {room.baseRate}
                  </p>
                  <p className="text-xs text-slate-500">
                    Bookable: {room.isBookable ? "Yes" : "No"} • Inventory: {room.totalInventory} • Max/booking: {room.maxPerBooking}
                  </p>
                </div>
                <button
                  className="tm-btn tm-btn-outline"
                  onClick={() => void onRemoveRoom(room.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-medium text-slate-600">Room Images</p>
                <input
                  className="tm-input mt-2"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void onAddRoomImage(file, room.id);
                      event.currentTarget.value = "";
                    }
                  }}
                />
                {roomImages.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {roomImages.map((img) => (
                      <li
                        key={img.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-50 px-3 py-2 text-xs text-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          {img.secureUrl ? (
                            <img
                              src={img.secureUrl}
                              alt={img.fileName}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : null}
                          <span className="truncate font-medium">{img.fileName}</span>
                        </div>
                        <div className="tm-inline-actions">
                          <button
                            className="tm-btn tm-btn-outline"
                            onClick={() => void onMoveImageToProperty(img.id)}
                            type="button"
                          >
                            Move to property
                          </button>
                          <button
                            className="tm-btn tm-btn-outline"
                            onClick={() => void onRemoveImage(img.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">No images for this room yet.</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
