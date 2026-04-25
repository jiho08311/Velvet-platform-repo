import { User } from "@supabase/supabase-js"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { readActiveUserState } from "@/modules/auth/server/read-active-user-state"

export async function requireActiveUser(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const state = await readActiveUserState({
    userId: user.id,
  })

  if (!state.ok) {
    if (state.reason === "profile_not_found") {
      throw new Error("Profile not found")
    }

    if (state.reason === "account_deleted") {
      throw new Error("Account deleted")
    }

    if (state.reason === "account_requires_reactivation") {
      throw new Error("Account requires reactivation")
    }
  }

  return user
}