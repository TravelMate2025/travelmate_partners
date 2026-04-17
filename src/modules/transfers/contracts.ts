export type TransferStatus =
  | "draft"
  | "pending"
  | "approved"
  | "live"
  | "paused"
  | "rejected"
  | "archived";

export type TransferType = "one_way" | "return" | "hourly" | "airport";

export type TransferImage = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  order: number;
  uploadedAt: string;
};

export type TransferListing = {
  id: string;
  userId: string;
  status: TransferStatus;
  name: string;
  description: string;
  transferType: TransferType | "";
  pickupPoint: string;
  dropoffPoint: string;
  vehicleClass: string;
  passengerCapacity: number;
  luggageCapacity: number;
  features: string[];
  coverageArea: string;
  operatingHours: string;
  currency: string;
  baseFare: number;
  nightSurcharge: number;
  images: TransferImage[];
  moderationFeedback?: string;
  submissionCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateTransferInput = {
  name: string;
  baseFare?: number;
  transferType: TransferType;
  pickupPoint: string;
  dropoffPoint: string;
  vehicleClass: string;
  passengerCapacity: number;
  luggageCapacity: number;
  coverageArea: string;
};

export type UpdateTransferInput = Partial<
  Pick<
    TransferListing,
    | "name"
    | "description"
    | "transferType"
    | "pickupPoint"
    | "dropoffPoint"
    | "vehicleClass"
    | "passengerCapacity"
    | "luggageCapacity"
    | "features"
    | "coverageArea"
    | "operatingHours"
    | "currency"
    | "baseFare"
    | "nightSurcharge"
  >
>;

export type AddTransferImageInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
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
};
