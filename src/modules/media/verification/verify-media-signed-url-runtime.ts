import type { NormalizedMediaSignedUrlInput } from "@/modules/media/capabilities/media-signed-url-capability-types"
import type { MediaSignedUrlIssuanceResult } from "@/modules/media/contracts/media-signed-url-contract"
import { logger } from "@/shared/observability/structured-logger"

export function verifyMediaSignedUrlRuntimeNoThrow({
  input,
  issuanceResult,
}: {
  input: NormalizedMediaSignedUrlInput
  issuanceResult: MediaSignedUrlIssuanceResult
}) {
  try {

  } catch (error) {
    logger.warn({
      event: "media.signed_url_runtime_verification_failed_open",
      context: {
        mediaId: input.mediaId || null,
        capabilityKind: input.capabilityKind,
      },
      error,
    })
  }
}
