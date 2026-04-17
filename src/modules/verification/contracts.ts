export type VerificationStatus = "not_started" | "pending" | "approved" | "rejected";
export type VerificationDocCategory = "identity" | "business" | "address" | "permit";

export type VerificationDocument = {
  id: string;
  category: VerificationDocCategory;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
};

export type PartnerVerification = {
  userId: string;
  status: VerificationStatus;
  documents: VerificationDocument[];
  rejectionReason?: string;
  submissionCount: number;
  submittedAt?: string;
  decidedAt?: string;
  updatedAt: string;
};

export type AddVerificationDocumentInput = {
  category: VerificationDocCategory;
  fileName: string;
  fileType: string;
  fileSize: number;
};

export type VerificationApi = {
  getVerification(userId: string): Promise<PartnerVerification>;
  addDocument(userId: string, input: AddVerificationDocumentInput): Promise<PartnerVerification>;
  removeDocument(userId: string, documentId: string): Promise<PartnerVerification>;
  submitVerification(userId: string): Promise<PartnerVerification>;
};
