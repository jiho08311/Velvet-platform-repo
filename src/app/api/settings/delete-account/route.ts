import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"

type AdminRoleAssignmentRow = {
  role: "super_admin" | "moderator" | "analytics_viewer"
}

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  const { data: adminRoles, error: adminRolesError } = await supabaseAdmin
    .from("admin_role_assignments")
    .select("role")
    .eq("profile_id", user.id)
    .returns<AdminRoleAssignmentRow[]>()

  if (adminRolesError) {
    throw adminRolesError
  }

  const isSuperAdmin = (adminRoles ?? []).some(
    (assignment) => assignment.role === "super_admin"
  )

  if (isSuperAdmin) {
    return NextResponse.redirect(new URL("/settings", request.url))
  }

  const deleteScheduledFor = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      is_deactivated: true,
      is_delete_pending: true,
      delete_scheduled_for: deleteScheduledFor,
      deleted_at: null,
    })
    .eq("id", user.id)

  if (profileError) {
    throw profileError
  }

  const { error: creatorError } = await supabaseAdmin
    .from("creators")
    .update({
      status: "suspended",
    })
    .eq("user_id", user.id)

  if (creatorError) {
    throw creatorError
  }

  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL("/sign-in", request.url))
}