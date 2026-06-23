import type { User } from "@supabase/supabase-js";
import { getSupabaseAuthUser } from "@/modules/auth/repositories/auth-session-repository";

export async function getCurrentUser(): Promise<User | null> {
  return getSupabaseAuthUser();
}
