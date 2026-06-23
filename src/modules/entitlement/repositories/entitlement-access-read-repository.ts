import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ActiveEntitlementProjectionRow = {
  id: string
  viewer_user_id: string
  subject_type: "creator" | "post" | "message"
  subject_id: string
  creator_id: string | null
  grant_type:
    | "creator_membership"
    | "content_access"
    | "message_access"
    | "owner"
    | "public"
  grant_id: string | null
  can_access: boolean
  starts_at: string
  expires_at: string | null
  revoked_at: string | null
}

export async function findActiveEntitlementProjection(input: {
  viewerUserId: string
  subjectType: "creator" | "post" | "message"
  subjectId: string
  grantTypes?: ActiveEntitlementProjectionRow["grant_type"][]
}): Promise<ActiveEntitlementProjectionRow | null> {
  let query = supabaseAdmin
    .from("entitlement_access_projection")
    .select(
      "id, viewer_user_id, subject_type, subject_id, creator_id, grant_type, grant_id, can_access, starts_at, expires_at, revoked_at"
    )
    .eq("viewer_user_id", input.viewerUserId)
    .eq("subject_type", input.subjectType)
    .eq("subject_id", input.subjectId)
    .eq("can_access", true)
    .is("revoked_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)

  if (input.grantTypes && input.grantTypes.length > 0) {
    query = query.in("grant_type", input.grantTypes)
  }

  const { data, error } = await query.maybeSingle<ActiveEntitlementProjectionRow>()

  if (error) {
    throw error
  }

  if (!data) return null

  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
    return null
  }

  return data
}
