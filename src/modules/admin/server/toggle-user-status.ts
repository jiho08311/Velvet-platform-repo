import { requireAdmin } from "./require-admin"
import { isAdminProfile } from "./admin-role-policy"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ToggleUserStatusParams = {
  targetUserId: string
  deactivate: boolean
}

export async function toggleUserStatus({
  targetUserId,
  deactivate,
}: ToggleUserStatusParams) {
  const { user } = await requireAdmin()

  if (user.id === targetUserId) {
    throw new Error("You cannot modify your own account")
  }

  const targetIsAdmin = await isAdminProfile(targetUserId)

  if (targetIsAdmin) {
    throw new Error("Cannot deactivate admin user")
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      is_deactivated: deactivate,
    })
    .eq("id", targetUserId)

  if (error) {
    throw error
  }

  return {
    success: true,
  }
}