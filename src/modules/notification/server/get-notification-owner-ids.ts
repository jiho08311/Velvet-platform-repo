import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreatorRow = {
  id: string
}

export async function getNotificationOwnerIds(
  userId: string,
): Promise<string[]> {
  const safeUserId = userId.trim()

  if (!safeUserId) {
    return []
  }

  const ownerIds = new Set<string>([safeUserId])

  const { data, error } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("user_id", safeUserId)
    .maybeSingle<CreatorRow>()

  if (error) {
    throw error
  }

  if (data?.id) {
    ownerIds.add(data.id)
  }

  return Array.from(ownerIds)
}