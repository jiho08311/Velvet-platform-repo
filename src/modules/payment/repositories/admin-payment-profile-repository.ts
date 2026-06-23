import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type AdminPaymentProfileRow = {
  id: string
  username: string | null
  display_name: string | null
}

export async function listAdminPaymentProfileRowsByIds(
  userIds: string[]
): Promise<AdminPaymentProfileRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, username, display_name")
    .in("profile_id", userIds)
    .returns<
      Array<{
        profile_id: string
        username: string | null
        display_name: string | null
      }>
    >()

  if (error) {
    throw error
  }

  return (data ?? []).map((user) => ({
    id: user.profile_id,
    username: user.username,
    display_name: user.display_name,
  }))
}
