import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type Visibility = "public" | "subscribers" | "paid"

type UpsertCanonicalCapabilityStateInput = {
  mediaId?: string | null
  viewerUserId?: string | null
  creatorUserId?: string | null
  capabilityKind: string
  visibility: Visibility
  canView: boolean
  isOwner: boolean
  isSubscribed: boolean
  hasPurchased: boolean
  allowPreview: boolean
  sourceSurface: string
}

type ReadCanonicalCapabilityStateInput = {
  mediaId?: string | null
  viewerUserId?: string | null
  creatorUserId?: string | null
  capabilityKind: string
}

type CanonicalCapabilityStateRow = {
  can_view: boolean
  serving_authoritative: boolean
}

function normalizeNullableId(value?: string | null): string | null {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

export async function upsertCanonicalCapabilityState({
  mediaId,
  viewerUserId,
  creatorUserId,
  capabilityKind,
  visibility,
  canView,
  isOwner,
  isSubscribed,
  hasPurchased,
  allowPreview,
  sourceSurface,
}: UpsertCanonicalCapabilityStateInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_capability_state")
    .insert({
      media_id: normalizeNullableId(mediaId),
      viewer_user_id: normalizeNullableId(viewerUserId),
      creator_user_id: normalizeNullableId(creatorUserId),
      capability_kind: capabilityKind,
      visibility,
      can_view: canView,
      is_owner: isOwner,
      is_subscribed: isSubscribed,
      has_purchased: hasPurchased,
      allow_preview: allowPreview,
      serving_authoritative: false,
      source_surface: sourceSurface,
    })

  if (error) {
    logger.warn({
      event: "media.canonical_capability_shadow_write_failed_open",
      context: {
        mediaId,
        viewerUserId,
        creatorUserId,
        capabilityKind,
      },
      error,
    })
  }
}

export async function readCanonicalCapabilityDecision({
  mediaId,
  viewerUserId,
  creatorUserId,
  capabilityKind,
}: ReadCanonicalCapabilityStateInput): Promise<boolean | null> {
  let query = supabaseAdmin
    .from("canonical_capability_state")
    .select("can_view, serving_authoritative")
    .eq("capability_kind", capabilityKind)
    .eq("serving_authoritative", true)
    .order("created_at", { ascending: false })
    .limit(1)

  const resolvedMediaId = normalizeNullableId(mediaId)
  const resolvedViewerUserId = normalizeNullableId(viewerUserId)
  const resolvedCreatorUserId = normalizeNullableId(creatorUserId)

  query = resolvedMediaId
    ? query.eq("media_id", resolvedMediaId)
    : query.is("media_id", null)

  query = resolvedViewerUserId
    ? query.eq("viewer_user_id", resolvedViewerUserId)
    : query.is("viewer_user_id", null)

  query = resolvedCreatorUserId
    ? query.eq("creator_user_id", resolvedCreatorUserId)
    : query.is("creator_user_id", null)

  const { data, error } = await query

  if (error) {
    logger.warn({
      event: "media.canonical_capability_read_failed_open",
      context: {
        mediaId,
        viewerUserId,
        creatorUserId,
        capabilityKind,
      },
      error,
    })
    return null
  }

  const row = (data?.[0] ?? null) as CanonicalCapabilityStateRow | null

  if (!row?.serving_authoritative) {
    return null
  }

  return row.can_view
}
