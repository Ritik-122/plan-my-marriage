export type GuestEmailContent = {
  recipient: string;
  guestName: string;
  couple: string;
  subject: string;
  weddingDate: string;
  city: string;
  greeting: string;
  introduction: string;
  events: { name: string; when: string; venue: string }[];
  expiresAt: string;
};
export type GuestEmailPreview = GuestEmailContent & { previewHash: string };
export type GuestEmailAttempt = {
  id: string;
  recipient: string;
  status: "SENDING" | "SENT" | "FAILED";
  createdAt: string;
  sentAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
};
export type GuestEmailState = {
  preview: GuestEmailPreview;
  attempts: GuestEmailAttempt[];
  localOnly: boolean;
};
