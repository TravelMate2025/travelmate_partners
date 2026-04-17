export type SupportTicketCategory =
  | "general"
  | "technical"
  | "verification"
  | "listing"
  | "payout";

export type SupportTicketStatus = "open" | "in_review" | "resolved";

export type PartnerSettings = {
  userId: string;
  supportContactEmail: string;
  language: "en" | "fr";
  timezone: string;
  security2FARequired: boolean;
  notificationsInApp: boolean;
  notificationsEmail: boolean;
  deactivationRequested: boolean;
  deactivationReason?: string;
  updatedAt: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  category: SupportTicketCategory;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
};

export type UpdatePartnerSettingsInput = Partial<
  Pick<
    PartnerSettings,
    | "supportContactEmail"
    | "language"
    | "timezone"
    | "security2FARequired"
    | "notificationsInApp"
    | "notificationsEmail"
  >
>;

export type SubmitSupportTicketInput = {
  category: SupportTicketCategory;
  subject: string;
  message: string;
};

export type RequestDeactivationInput = {
  reason: string;
};

export type SupportSettingsApi = {
  getSettings(userId: string): Promise<PartnerSettings>;
  updateSettings(
    userId: string,
    input: UpdatePartnerSettingsInput,
  ): Promise<PartnerSettings>;
  listSupportTickets(userId: string): Promise<SupportTicket[]>;
  submitSupportTicket(
    userId: string,
    input: SubmitSupportTicketInput,
  ): Promise<SupportTicket[]>;
  requestDeactivation(
    userId: string,
    input: RequestDeactivationInput,
  ): Promise<PartnerSettings>;
};
