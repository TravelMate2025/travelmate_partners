"use client";

import type { StayListing } from "@/modules/stays/contracts";

type Props = {
  stay: StayListing;
  uploadState: "idle" | "uploading";
  spaceTypeOptions: Array<{ value: string; label: string }>;
  onAddImage: (file: File) => void;
  onReplaceImage: (imageId: string, file: File) => void;
  onRemoveImage: (imageId: string) => void;
  onMoveImage: (imageId: string, direction: "up" | "down") => void;
  onAssignImageToRoom: (imageId: string, roomId: string | null) => void;
  onAssignImageSpaceType: (imageId: string, spaceType: string | null) => void;
};

export function StayImagesSection({
  stay,
  uploadState,
  spaceTypeOptions,
  onAddImage,
  onReplaceImage,
  onRemoveImage,
  onMoveImage,
  onAssignImageToRoom,
  onAssignImageSpaceType,
}: Props) {
  const propertyImages = [...stay.images]
    .filter((img) => img.roomId === null)
    .sort((a, b) => a.order - b.order);

  return (
    <section className="tm-panel p-6">
      <h2 className="tm-section-title">Property Images</h2>
      <p className="mt-1 text-sm text-slate-600">Exterior, lobby, common areas. PNG, JPEG, WEBP up to 8MB.</p>
      {uploadState === "uploading" ? (
        <p className="mt-2 text-sm text-blue-700">Upload in progress...</p>
      ) : null}

      <input
        className="tm-input mt-3"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void onAddImage(file);
            event.currentTarget.value = "";
          }
        }}
      />

      <ul className="tm-list-stack mt-4">
        {propertyImages.map((img, index) => (
          <li key={img.id} className="tm-list-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{img.fileName}</p>
                <p className="text-xs text-slate-500">Order: {index + 1}</p>
              </div>
              {img.spaceType ? (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {spaceTypeOptions.find((o) => o.value === img.spaceType)?.label ?? img.spaceType}
                </span>
              ) : (
                <span className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-400">
                  No space type
                </span>
              )}
            </div>
            <input
              className="hidden"
              id={`replace-image-${img.id}`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onReplaceImage(img.id, file);
                event.currentTarget.value = "";
              }}
            />
            <div className="tm-inline-actions mt-2">
              <button className="tm-btn tm-btn-outline" onClick={() => void onMoveImage(img.id, "up")} type="button">Up</button>
              <button className="tm-btn tm-btn-outline" onClick={() => void onMoveImage(img.id, "down")} type="button">Down</button>
              <label className="tm-btn tm-btn-outline cursor-pointer" htmlFor={`replace-image-${img.id}`}>Replace</label>
              <select
                aria-label="Set space type"
                className="tm-input text-xs"
                value={img.spaceType ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  void onAssignImageSpaceType(img.id, value || null);
                }}
              >
                <option value="">— Space type —</option>
                {spaceTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {stay.rooms.length > 0 ? (
                <select
                  className="tm-input text-xs"
                  defaultValue=""
                  onChange={(event) => {
                    const roomId = event.target.value || null;
                    if (roomId !== "") void onAssignImageToRoom(img.id, roomId);
                    event.currentTarget.value = "";
                  }}
                >
                  <option value="" disabled>Move to room…</option>
                  {stay.rooms.map((room) => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              ) : null}
              <button className="tm-btn tm-btn-outline" onClick={() => void onRemoveImage(img.id)} type="button">Remove</button>
            </div>
          </li>
        ))}
      </ul>

      {propertyImages.length === 0 ? (
        <p className="tm-soft-note mt-2 text-sm">No property images uploaded yet.</p>
      ) : null}
    </section>
  );
}
