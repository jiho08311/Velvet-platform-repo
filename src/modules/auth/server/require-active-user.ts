import { User } from "@supabase/supabase-js"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"

type ProfileStatusRow = {
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  delete_scheduled_for: string | null
  deleted_at: string | null
}

export async function requireActiveUser(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("is_deactivated, is_delete_pending, delete_scheduled_for, deleted_at")
    .eq("id", user.id)
    .maybeSingle<ProfileStatusRow>()

  if (error) {
    throw error
  }

  if (!profile) {
    throw new Error("Profile not found")
  }

  if (profile.deleted_at) {
    throw new Error("Account deleted")
  }

  const now = new Date()
  const isDeleteExpired =
    profile.is_delete_pending &&
    profile.delete_scheduled_for &&
    new Date(profile.delete_scheduled_for).getTime() <= now.getTime()

  if (isDeleteExpired) {
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        deleted_at: now.toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      throw updateError
    }

    throw new Error("Account deleted")
  }

  if (profile.is_deactivated || profile.is_delete_pending) {
    throw new Error("Account requires reactivation")
  }

  return user
}