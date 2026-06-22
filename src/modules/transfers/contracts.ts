export type TransferStatus =
  | "draft"
  | "pending"
  | "approved"
  | "live"
  | "paused"
  | "paused_by_admin"
  | "rejected"
  | "archived";

export type { ListingAppeal, ListingAppealStatus, ListingAppealResolution } from "@/modules/stays/contracts";

export type TransferType = "one_way" | "return" | "hourly" | "airport";

export type TransferImage = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  secureUrl?: string | null;
  publicId?: string | null;
  order: number;
  uploadedAt: string;
};

export type TransferDestinationRoute = {
  destinationCity: string;
  destinationArea: string;
  destinationSubArea?: string;
};

export type TransferProvider = {
  displayName: string;
  contactPhone: string;
  contactWhatsApp?: string;
  supportEmail?: string;
  websiteUrl?: string;
  arrivalInstructions?: string;
};

export type TransferListing = {
  id: string;
  userId: string;
  status: TransferStatus;
  name: string;
  description: string;
  transferType: TransferType | "";
  pickupPoint: string;
  vehicleClass: string;
  passengerCapacity: number;
  luggageCapacity: number;
  features: string[];
  coverageArea: string;
  country?: string;
  adminLevel1?: string;
  city?: string;
  area?: string;
  destinationRoutes?: TransferDestinationRoute[];
  cityReviewStatus?: "pending" | "approved" | "rejected" | null;
  operatingHours: string;
  currency: string;
  baseFare: number;
  nightSurcharge: number;
  cancellationPolicy: string;
  images: TransferImage[];
  moderationFeedback?: string;
  provider?: TransferProvider;
  submissionCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateTransferInput = {
  name: string;
  baseFare?: number;
  transferType: TransferType;
  pickupPoint: string;
  vehicleClass: string;
  passengerCapacity: number;
  luggageCapacity: number;
  coverageArea?: string;
  country?: string;
  adminLevel1?: string;
  city?: string;
  area?: string;
  destinationRoutes?: TransferDestinationRoute[];
  providerDisplayName?: string;
  providerContactPhone?: string;
  providerContactWhatsApp?: string;
  providerSupportEmail?: string;
  providerWebsiteUrl?: string;
  contactOnArrivalInstructions?: string;
};

export type UpdateTransferInput = Partial<
  Pick<
    TransferListing,
    | "name"
    | "description"
    | "transferType"
    | "pickupPoint"
    | "vehicleClass"
    | "passengerCapacity"
    | "luggageCapacity"
    | "features"
    | "coverageArea"
    | "country"
    | "adminLevel1"
    | "city"
    | "area"
    | "destinationRoutes"
    | "operatingHours"
    | "currency"
    | "baseFare"
    | "nightSurcharge"
    | "cancellationPolicy"
  > & {
    providerDisplayName?: string;
    providerContactPhone?: string;
    providerContactWhatsApp?: string;
    providerSupportEmail?: string;
    providerWebsiteUrl?: string;
    contactOnArrivalInstructions?: string;
  }
>;

export type AddTransferImageInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
  file?: File;
};

export type ReplaceTransferImageInput = AddTransferImageInput;

export type TransfersApi = {
  listTransfers(userId: string): Promise<TransferListing[]>;
  getTransfer(userId: string, transferId: string): Promise<TransferListing>;
  createTransfer(userId: string, input: CreateTransferInput): Promise<TransferListing>;
  updateTransfer(
    userId: string,
    transferId: string,
    input: UpdateTransferInput,
  ): Promise<TransferListing>;
  updateStatus(
    userId: string,
    transferId: string,
    status: TransferStatus,
  ): Promise<TransferListing>;
  addImage(userId: string, transferId: string, input: AddTransferImageInput): Promise<TransferListing>;
  replaceImage(
    userId: string,
    transferId: string,
    imageId: string,
    input: ReplaceTransferImageInput,
  ): Promise<TransferListing>;
  removeImage(userId: string, transferId: string, imageId: string): Promise<TransferListing>;
  reorderImages(userId: string, transferId: string, imageIds: string[]): Promise<TransferListing>;
  archiveTransfer(userId: string, transferId: string): Promise<TransferListing>;
  submitAppeal(userId: string, transferId: string, message: string): Promise<import("@/modules/stays/contracts").ListingAppeal>;
  getAppeal(userId: string, transferId: string): Promise<import("@/modules/stays/contracts").ListingAppeal | null>;
};
