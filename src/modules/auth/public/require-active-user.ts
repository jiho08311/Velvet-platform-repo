import type { User } from "@supabase/supabase-js"
import {
  requireActiveUser as requireActiveUserRuntime,
} from "@/modules/auth/runtime/require-active-user"

export const PUBLIC_CONTRACT = true

export async function requireActiveUser(): Promise<User> {
  return requireActiveUserRuntime()
}
