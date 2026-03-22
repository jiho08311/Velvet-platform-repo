export type AuthUserId = string;

export type AuthSessionStatus = "active" | "expired" | "revoked";

export type AuthSession = {
  id: string;
  userId: AuthUserId;
  status: AuthSessionStatus;
  expiresAt: string;
};

export type AuthIdentity = {
  userId: AuthUserId;
  email: string;
  emailVerified: boolean;
};