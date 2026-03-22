import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "./get-current-user";

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}