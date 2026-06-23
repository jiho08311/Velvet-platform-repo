import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { InfrastructureError } from "@/shared/errors"
export type AccessAwarePostProjectionSnapshot = {
  subjectId: string
  grantType: string
  canAccess: boolean
  projectionId: string
  grantId: string | null
  expiresAt: string | null
}

export async function listAccessAwarePostProjectionSnapshots(input: {
  viewerUserId: string | null
  postIds: string[]
}): Promise<Map<string, AccessAwarePostProjectionSnapshot>> {
  if (!input.viewerUserId || input.postIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabaseAdmin
    .from("entitlement_access_projection")
    .select("id, subject_id, grant_type, grant_id, can_access, expires_at, revoked_at")
    .eq("viewer_user_id", input.viewerUserId)
    .eq("subject_type", "post")
    .eq("can_access", true)
    .is("revoked_at", null)
    .in("subject_id", input.postIds)

if (error) {
  throw new InfrastructureError(
    "ACCESS_AWARE_PROJECTION_READ_FAILED",
    {
      cause: error,
      metadata: {
        viewerUserId: input.viewerUserId,
        postCount: input.postIds.length,
      },
    }
  )
}

  const now = Date.now()
  const map = new Map<string, AccessAwarePostProjectionSnapshot>()

  for (const row of data ?? []) {
    if (row.expires_at && new Date(row.expires_at).getTime() <= now) {
      continue
    }

    map.set(row.subject_id, {
      subjectId: row.subject_id,
      grantType: row.grant_type,
      canAccess: row.can_access,
      projectionId: row.id,
      grantId: row.grant_id,
      expiresAt: row.expires_at,
    })
  }

  return map
}
