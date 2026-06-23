import type {
  MediaSignedUrlCapabilityDecision,
  NormalizedMediaSignedUrlInput,
} from "@/modules/media/capabilities/media-signed-url-capability-types"

export type MediaSignedUrlIssuanceResult = "issued" | "denied" | "empty"

export type MediaSignedUrlContract = {
  url: string
  issued: boolean
  issuanceResult: MediaSignedUrlIssuanceResult
  decision: MediaSignedUrlCapabilityDecision
  lineage: {
    mediaId: string | null
    viewerUserId: string | null
    creatorUserId: string | null
    storagePath: string
    visibility: NormalizedMediaSignedUrlInput["visibility"]
    capabilitySurface: NormalizedMediaSignedUrlInput["capabilitySurface"]
    capabilityKind: NormalizedMediaSignedUrlInput["capabilityKind"]
    storageBoundary: "media-storage"
  }
}

export function createMediaSignedUrlContract({
  url,
  decision,
  issuanceResult,
}: {
  url: string
  decision: MediaSignedUrlCapabilityDecision
  issuanceResult: MediaSignedUrlIssuanceResult
}): MediaSignedUrlContract {
  const { input } = decision

  return {
    url,
    issued: issuanceResult === "issued",
    issuanceResult,
    decision,
    lineage: {
      mediaId: input.mediaId || null,
      viewerUserId: input.viewerUserId || null,
      creatorUserId: input.creatorUserId || null,
      storagePath: input.storagePath,
      visibility: input.visibility,
      capabilitySurface: input.capabilitySurface,
      capabilityKind: input.capabilityKind,
      storageBoundary: "media-storage",
    },
  }
}

export function toMediaSignedUrlResponse(
  contract: MediaSignedUrlContract
): string {
  return contract.url
}