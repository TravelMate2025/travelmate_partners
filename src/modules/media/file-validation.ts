type SupportedMediaType = "stay_image" | "transfer_image" | "verification_document";

type MediaValidationInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
  currentCount?: number;
};

const MB = 1024 * 1024;

const MEDIA_RULES: Record<
  SupportedMediaType,
  {
    maxCount: number;
    maxSize: number;
    allowedTypes: string[];
    typeError: string;
    sizeError: string;
    countError: string;
  }
> = {
  stay_image: {
    maxCount: 12,
    maxSize: 8 * MB,
    allowedTypes: ["image/png", "image/jpeg", "image/webp"],
    typeError: "Invalid image format. Allowed: PNG, JPEG, WEBP.",
    sizeError: "Image size must be between 1 byte and 8MB.",
    countError: "Maximum image count reached.",
  },
  transfer_image: {
    maxCount: 12,
    maxSize: 8 * MB,
    allowedTypes: ["image/png", "image/jpeg", "image/webp"],
    typeError: "Invalid image format. Allowed: PNG, JPEG, WEBP.",
    sizeError: "Image size must be between 1 byte and 8MB.",
    countError: "Maximum image count reached.",
  },
  verification_document: {
    maxCount: 12,
    maxSize: 8 * MB,
    allowedTypes: ["application/pdf", "image/png", "image/jpeg"],
    typeError: "Unsupported file type. Allowed: PDF, PNG, JPEG.",
    sizeError: "File size must be between 1 byte and 8MB.",
    countError: "Maximum document count reached.",
  },
};

export function validateMediaFile(type: SupportedMediaType, input: MediaValidationInput) {
  const rules = MEDIA_RULES[type];
  const fileName = input.fileName.trim();
  const fileType = input.fileType.trim().toLowerCase();

  if (!fileName) {
    throw new Error("Filename is required.");
  }

  if (!rules.allowedTypes.includes(fileType)) {
    throw new Error(rules.typeError);
  }

  if (input.fileSize <= 0 || input.fileSize > rules.maxSize) {
    throw new Error(rules.sizeError);
  }

  if (typeof input.currentCount === "number" && input.currentCount >= rules.maxCount) {
    throw new Error(rules.countError);
  }
}
