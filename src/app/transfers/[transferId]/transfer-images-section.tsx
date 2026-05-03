"use client";

import type { TransferListing } from "@/modules/transfers/contracts";

type Props = {
  item: TransferListing;
  saving: boolean;
  uploadState: "idle" | "uploading";
  onAddImage: (file: File) => void;
  onReplaceImage: (imageId: string, file: File) => void;
  onRemoveImage: (imageId: string) => void;
  onMoveImage: (imageId: string, direction: "up" | "down") => void;
};

export function TransferImagesSection({
  item,
  saving,
  uploadState,
  onAddImage,
  onReplaceImage,
  onRemoveImage,
  onMoveImage,
}: Props) {
  const images = (Array.isArray(item.images) ? item.images : [])
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <section className="tm-panel p-6">
      <h2 className="tm-section-title">Images</h2>
      <p className="mt-1 text-sm text-slate-600">PNG, JPEG, WEBP up to 8MB.</p>
      {uploadState === "uploading" ? (
        <p className="mt-2 text-sm text-blue-700">Upload in progress...</p>
      ) : null}

      <input
        className="tm-input mt-3"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onAddImage(file);
          event.currentTarget.value = "";
        }}
      />

      <ul className="tm-list-stack mt-4">
        {images.map((img, index) => (
          <li key={img.id} className="tm-list-card">
            <p className="text-sm font-medium text-slate-800">{img.fileName}</p>
            <p className="text-xs text-slate-500">Order: {index + 1}</p>
            <input
              className="hidden"
              id={`replace-transfer-image-${img.id}`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onReplaceImage(img.id, file);
                event.currentTarget.value = "";
              }}
            />
            <div className="tm-inline-actions mt-2">
              <button
                className="tm-btn tm-btn-outline"
                disabled={saving}
                onClick={() => void onMoveImage(img.id, "up")}
                type="button"
              >
                Up
              </button>
              <button
                className="tm-btn tm-btn-outline"
                disabled={saving}
                onClick={() => void onMoveImage(img.id, "down")}
                type="button"
              >
                Down
              </button>
              <label className="tm-btn tm-btn-outline cursor-pointer" htmlFor={`replace-transfer-image-${img.id}`}>
                Replace
              </label>
              <button
                className="tm-btn tm-btn-outline"
                disabled={saving}
                onClick={() => void onRemoveImage(img.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {images.length === 0 ? (
        <p className="tm-soft-note mt-2 text-sm">No images uploaded yet.</p>
      ) : null}
    </section>
  );
}
