import { requireAdmin } from "./require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  buildAdminUserOperationalModel,
  type AdminUserOperationalModel,
  type AdminUserOperationalRow,
} from "@/modules/admin/lib/admin-user-operational-policy"

type GetUserDetailParams = {
  userId: string
}

type CreatorDetail = {
  id: string
  status: string
  subscription_price: number
}

type GetUserDetailResult = {
  profile: AdminUserOperationalModel
  creator: CreatorDetail | null
}

export async function getUserDetail({
  userId,
}: GetUserDetailParams): Promise<GetUserDetailResult> {
  await requireAdmin()

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, email, username, display_name, is_deactivated, is_banned, is_delete_pending, delete_scheduled_for, deleted_at, created_at"
    )
    .eq("id", userId)
    .single()
    .returns<AdminUserOperationalRow>()

  if (error) {
    throw error
  }

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id, status, subscription_price")
    .eq("user_id", userId)
    .maybeSingle()
    .returns<CreatorDetail | null>()

  return {
    profile: buildAdminUserOperationalModel(profile),
    creator: creator ?? null,
  }
}
