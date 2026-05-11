"use client";

import type { StayListing } from "@/modules/stays/contracts";

type Props = {
  stay: StayListing;
  roomName: string;
  roomOccupancy: string;
  roomBed: string;
  roomRate: string;
  onSetRoomName: (v: string) => void;
  onSetRoomOccupancy: (v: string) => void;
  onSetRoomBed: (v: string) => void;
  onSetRoomRate: (v: string) => void;
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
  onSetRoomName,
  onSetRoomOccupancy,
  onSetRoomBed,
  onSetRoomRate,
  onAddRoom,
  onRemoveRoom,
  onAddRoomImage,
  onMoveImageToProperty,
  onRemoveImage,
}: Props) {
  return (
    <section className="tm-panel p-6">
      <h2 className="tm-section-title">Rooms / Units</h2>
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
      </div>
      <button className="tm-btn tm-btn-accent mt-3" onClick={() => void onAddRoom()} type="button">
        Add Room
      </button>

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
