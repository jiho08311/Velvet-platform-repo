import type { User } from "@supabase/supabase-js"
import { getCurrentUser as getCurrentUserRuntime } from "@/modules/auth/runtime/get-current-user"

export const PUBLIC_CONTRACT = true

export async function getCurrentUser(): Promise<User | null> {
  return getCurrentUserRuntime()
}
