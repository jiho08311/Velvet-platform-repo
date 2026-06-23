import type { MediaSignedUrlCapabilityDecision } from "@/modules/media/capabilities/media-signed-url-capability-types"
import type { MediaSignedUrlIssuanceResult } from "@/modules/media/contracts/media-signed-url-contract"
import { createMediaStorageSignedUrl } from "@/modules/media/repositories/media-storage-repository"

export type MediaSignedUrlIssuanceContract = {
  url: string
  issuanceResult: MediaSignedUrlIssuanceResult
}

export async function issueMediaSignedUrl(
  decision: MediaSignedUrlCapabilityDecision
): Promise<MediaSignedUrlIssuanceContract> {
  if (!decision.allowed) {
    return {
      url: "",
      issuanceResult:
        decision.reason === "storage_path_empty" ? "empty" : "denied",
    }
  }

  const signedUrl = await createMediaStorageSignedUrl({
    storagePath: decision.input.storagePath,
    expiresIn: decision.input.expiresIn,
  })

  return {
    url: signedUrl,
    issuanceResult: signedUrl ? "issued" : "empty",
  }
}
