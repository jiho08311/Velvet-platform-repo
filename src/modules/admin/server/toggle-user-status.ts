import { requireAdmin } from "./require-admin"
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