import type { AuthSession } from "../types";
import { getSupabaseAuthSession } from "@/modules/auth/repositories/auth-session-repository";

export async function getSession(): Promise<AuthSession | null> {
  const session = await getSupabaseAuthSession();

  if (!session) {
    return null;
  }

  const expiresAt = session.expires_at
    ? new Date(session.expires_at * 1000).toISOString()
    : new Date().toISOString();

  const status: AuthSession["status"] =
    session.expires_at && session.expires_at * 1000 < Date.now()
      ? "expired"
      : "active";

  return {
    id: session.access_token,
    userId: session.user.id,
    status,
    expiresAt,
  };
}
