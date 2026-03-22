import type { AuthSession } from "../types";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    return null;
  }

  const expiresAt = data.session.expires_at
    ? new Date(data.session.expires_at * 1000).toISOString()
    : new Date().toISOString();

  const status: AuthSession["status"] =
    data.session.expires_at && data.session.expires_at * 1000 < Date.now()
      ? "expired"
      : "active";

  return {
    id: data.session.access_token,
    userId: data.session.user.id,
    status,
    expiresAt,
  };
}