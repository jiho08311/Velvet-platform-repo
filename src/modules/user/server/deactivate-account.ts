import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreatorIdRow = {
  id: string
}

type AdminRoleAssignmentRow = {
  role: "super_admin" | "moderator" | "analytics_viewer"
}

export async function deactivateAccount(userId: string) {
  const { data: adminRoles, error: adminRolesError } = await supabaseAdmin
    .from("admin_role_assignments")
    .select("role")
    .eq("profile_id", userId)
    .returns<AdminRoleAssignmentRow[]>()

  if (adminRolesError) {
    throw adminRolesError
  }

  const isSuperAdmin = (adminRoles ?? []).some(
    (assignment) => assignment.role === "super_admin"
  )

  if (isSuperAdmin) {
    throw new Error("Super admin accounts cannot be deactivated")
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      is_deactivated: true,
    })
    .eq("id", userId)

  if (profileError) {
    throw profileError
  }

  const { data: creatorRows, error: creatorLookupError } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("user_id", userId)
    .returns<CreatorIdRow[]>()

  if (creatorLookupError) {
    throw creatorLookupError
  }

  const creatorIds = (creatorRows ?? []).map((creator) => creator.id)

  const { error: creatorError } = await supabaseAdmin
    .from("creators")
    .update({
      status: "suspended",
    })
    .eq("user_id", userId)

  if (creatorError) {
    throw creatorError
  }

  if (creatorIds.length > 0) {
    const { error: postError } = await supabaseAdmin
      .from("posts")
      .update({
        status: "draft",
      })
      .in("creator_id", creatorIds)

    if (postError) {
      throw postError
    }

    const { error: creatorSubscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "expired",
        canceled_at: new Date().toISOString(),
      })
      .in("creator_id", creatorIds)

    if (creatorSubscriptionError) {
      throw creatorSubscriptionError
    }
  }

  const { error: userSubscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "expired",
      canceled_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (userSubscriptionError) {
    throw userSubscriptionError
  }
}