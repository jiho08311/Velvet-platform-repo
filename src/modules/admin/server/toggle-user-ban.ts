import { requireAdmin } from "./require-admin"
import { isAdminProfile } from "./admin-role-policy"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ToggleUserBanParams = {
  targetUserId: string
  ban: boolean
}

export async function toggleUserBan({
  targetUserId,
  ban,
}: ToggleUserBanParams) {
  const { user } = await requireAdmin()

  if (user.id === targetUserId) {
    throw new Error("You cannot ban yourself")
  }

  const targetIsAdmin = await isAdminProfile(targetUserId)

  if (targetIsAdmin) {
    throw new Error("Cannot ban admin user")
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      is_banned: ban,
    })
    .eq("id", targetUserId)

  if (error) {
    throw error
  }

  return {
    success: true,
  }
}