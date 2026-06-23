import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type StorageAction = "upload" | "download" | "create_signed_url" | "delete"

type CanUseCanonicalStorageAuthorizationInput = {
  bucketName: string
  storageAction: StorageAction
}

export async function canUseCanonicalStorageAuthorization({
  bucketName,
  storageAction,
}: CanUseCanonicalStorageAuthorizationInput): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("storage_authorization_lineage")
    .select("id")
    .eq("bucket_name", bucketName)
    .eq("storage_action", storageAction)
    .eq("authority_mode", "canonical")
    .eq("promotion_allowed", true)
    .eq("synchronized_candidate_serving", true)
    .eq("runtime_finalized_serving_authoritative", true)
    .limit(1)

  if (error) {
    logger.warn({
      event: "media.storage_canonical_authorization_read_failed_open",
      context: {
        bucketName,
        storageAction,
      },
      error,
    })
    return false
  }

  return (data?.length ?? 0) > 0
}
