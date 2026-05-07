export type StayStatus = "draft" | "pending" | "approved" | "live" | "paused" | "paused_by_admin" | "rejected" | "archived";

export type ListingAppealStatus = "pending" | "under_review" | "resolved";
export type ListingAppealResolution = "reinstated" | "dismissed";

export type ListingAppeal = {
  id: string;
  listingKind: "stay" | "transfer";
  listingId: string;
  partnerId: string;
  message: string;
  status: ListingAppealStatus;
  resolution: ListingAppealResolution | null;
  resolutionNote: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StayImage = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  order: number;
  roomId: string | null;
  spaceType: string | null;
  uploadedAt: string;
};

export type StayRoom = {
  id: string;
  name: string;
  occupancy: number;
  bedConfiguration: string;
  baseRate: number;
  isBookable: boolean;
  totalInventory: number;
  maxPerBooking: number;
};

export type StayListing = {
  id: string;
  userId: string;
  status: StayStatus;
  propertyType: string;
  saleMode?: "unit_level" | "room_level";
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude?: string;
  longitude?: string;
  amenities: string[];
  houseRules: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  images: StayImage[];
  rooms: StayRoom[];
  moderationFeedback?: string;
  submissionCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateStayInput = {
  propertyType: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
};

export type UpdateStayInput = Partial<
  Pick<
    StayListing,
    | "propertyType"
    | "name"
    | "description"
    | "address"
    | "city"
    | "country"
    | "latitude"
    | "longitude"
    | "amenities"
    | "houseRules"
    | "checkInTime"
    | "checkOutTime"
    | "cancellationPolicy"
  >
>;

export type AddStayImageInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
  roomId?: string | null;
  spaceType?: string | null;
};

export type ReplaceStayImageInput = Omit<AddStayImageInput, "roomId">;

export type UpsertStayRoomInput = {
  id?: string;
  name: string;
  occupancy: number;
  bedConfiguration: string;
  baseRate: number;
};

export type StaysApi = {
  listStays(userId: string): Promise<StayListing[]>;
  getStay(userId: string, stayId: string): Promise<StayListing>;
  createStay(userId: string, input: CreateStayInput): Promise<StayListing>;
  updateStay(userId: string, stayId: string, input: UpdateStayInput): Promise<StayListing>;
  updateStatus(userId: string, stayId: string, status: StayStatus): Promise<StayListing>;
  addImage(userId: string, stayId: string, input: AddStayImageInput): Promise<StayListing>;
  replaceImage(
    userId: string,
    stayId: string,
    imageId: string,
    input: ReplaceStayImageInput,
  ): Promise<StayListing>;
  removeImage(userId: string, stayId: string, imageId: string): Promise<StayListing>;
  reorderImages(userId: string, stayId: string, imageIds: string[]): Promise<StayListing>;
  assignImageToRoom(
    userId: string,
    stayId: string,
    imageId: string,
    roomId: string | null,
  ): Promise<StayListing>;
  assignImageSpaceType(
    userId: string,
    stayId: string,
    imageId: string,
    spaceType: string | null,
  ): Promise<StayListing>;
  upsertRoom(userId: string, stayId: string, input: UpsertStayRoomInput): Promise<StayListing>;
  removeRoom(userId: string, stayId: string, roomId: string): Promise<StayListing>;
  archiveStay(userId: string, stayId: string): Promise<StayListing>;
  submitAppeal(userId: string, stayId: string, message: string): Promise<ListingAppeal>;
  getAppeal(userId: string, stayId: string): Promise<ListingAppeal | null>;
};
