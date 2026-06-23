import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

export async function insertMediaServingAuthorization(input: {
  assetId?: string | null
  storagePath: string
  principalId?: string | null
  creatorUserId?: string | null
  contentType?: string | null
  contentId?: string | null
  decision: "allowed" | "denied"
  accessReason: string
  capabilityKind?: string | null
  capabilitySurface?: string | null
  expiresAt?: string | null
  correlationId?: string | null
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("media_serving_authorizations")
    .insert({
      asset_id: input.assetId ?? null,
      storage_path: input.storagePath,
      principal_id: input.principalId ?? null,
      creator_user_id: input.creatorUserId ?? null,
      content_type: input.contentType ?? null,
      content_id: input.contentId ?? null,
      decision: input.decision,
      access_reason: input.accessReason,
      capability_kind: input.capabilityKind ?? null,
      capability_surface: input.capabilitySurface ?? null,
      expires_at: input.expiresAt ?? null,
      correlation_id: input.correlationId ?? null,
    })

  if (error) {
    logger.warn({
      event: "media.serving_authorization_insert_failed",
      context: {
        assetId: input.assetId ?? null,
        principalId: input.principalId ?? null,
        contentType: input.contentType ?? null,
        contentId: input.contentId ?? null,
        decision: input.decision,
      },
      error,
    })
  }
}
