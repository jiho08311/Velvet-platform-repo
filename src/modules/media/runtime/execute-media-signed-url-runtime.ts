import { resolveMediaSignedUrlCapability } from "@/modules/media/capabilities/resolve-media-signed-url-capability"
import type {
  CreateMediaSignedUrlInput,
  NormalizedMediaSignedUrlInput,
} from "@/modules/media/capabilities/media-signed-url-capability-types"
import {
  createMediaSignedUrlContract,
  type MediaSignedUrlContract,
} from "@/modules/media/contracts/media-signed-url-contract"
import { issueMediaSignedUrl } from "@/modules/media/issuance/issue-media-signed-url"
import { verifyMediaSignedUrlRuntimeNoThrow } from "@/modules/media/verification/verify-media-signed-url-runtime"

function normalizeMediaSignedUrlInput({
  storagePath,
  viewerUserId,
  creatorUserId,
  visibility,
  canView,
  isSubscribed = false,
  hasPurchased = false,
  expiresIn = 60 * 60,
  allowPreview = false,
  mediaId,
  capabilitySurface,
  capabilityKind,
}: CreateMediaSignedUrlInput): NormalizedMediaSignedUrlInput {
  return {
    storagePath: storagePath?.trim() ?? "",
    viewerUserId: viewerUserId?.trim() ?? "",
    creatorUserId: creatorUserId?.trim() ?? "",
    mediaId: mediaId?.trim() ?? "",
    visibility,
    canView,
    isSubscribed,
    hasPurchased,
    expiresIn,
    allowPreview,
    capabilitySurface:
      capabilitySurface ?? (allowPreview ? "locked_preview" : "post_media_signing"),
    capabilityKind:
      capabilityKind ??
      (allowPreview
        ? "locked_preview_media_signed_url"
        : "post_media_signed_url"),
  }
}

export async function executeMediaSignedUrlRuntime(
  rawInput: CreateMediaSignedUrlInput
): Promise<MediaSignedUrlContract> {
  const input = normalizeMediaSignedUrlInput(rawInput)
  const decision = await resolveMediaSignedUrlCapability(input)
  const issuance = await issueMediaSignedUrl(decision)

  verifyMediaSignedUrlRuntimeNoThrow({
    input,
    issuanceResult: issuance.issuanceResult,
  })

  return createMediaSignedUrlContract({
    url: issuance.url,
    decision,
    issuanceResult: issuance.issuanceResult,
  })
}
