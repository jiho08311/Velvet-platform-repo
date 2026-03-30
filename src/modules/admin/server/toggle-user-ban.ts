import { requireAdmin } from "./require-admin"
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

  const { data: targetAdmin, error: adminCheckError } =
    await supabaseAdmin
      .from("admin_role_assignments")
      .select("id")
      .eq("profile_id", targetUserId)
      .maybeSingle()

  if (adminCheckError) {
    throw adminCheckError
  }

  if (targetAdmin) {
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