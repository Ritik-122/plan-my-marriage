export type TeamRole = "ADMIN" | "MANAGER";
export type TeamMemberDTO = {
  id: string;
  displayName: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
};
export type TeamInvitationDTO = {
  id: string;
  email: string;
  role: TeamRole;
  createdAt: string;
  expiresAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  deliveryState: "SENDING" | "SENT" | "FAILED";
};
export type InvitationContextDTO = {
  brideName: string;
  groomName: string;
  city: string;
  role: TeamRole;
  expiresAt: string;
  accepted: boolean;
  user: { id: string; displayName: string; email: string } | null;
  emailMatches: boolean;
};
