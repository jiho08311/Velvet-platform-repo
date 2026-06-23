import { canCreateMediaSignedUrl } from "@/modules/media/policies/media-access-policy"
import {
  readCanonicalCapabilityDecision,
  upsertCanonicalCapabilityState,
} from "@/modules/media/repositories/canonical-capability-state-repository"
import type {
  MediaSignedUrlCapabilityDecision,
  NormalizedMediaSignedUrlInput,
} from "@/modules/media/capabilities/media-signed-url-capability-types"

export async function validateMediaSignedUrlCapability(
  input: NormalizedMediaSignedUrlInput
): Promise<MediaSignedUrlCapabilityDecision> {
  if (!input.storagePath) {
    return {
      allowed: false,
      reason: "storage_path_empty",
      runtimeCanSignUrl: false,
      canonicalCanSignUrl: null,
      isOwner: false,
      input,
    }
  }

  const isOwner =
    input.viewerUserId.length > 0 &&
    input.creatorUserId.length > 0 &&
    input.viewerUserId === input.creatorUserId

  const runtimeCanSignUrl = canCreateMediaSignedUrl({
    viewerUserId: input.viewerUserId,
    creatorUserId: input.creatorUserId,
    visibility: input.visibility,
    canView: input.canView,
    isSubscribed: input.isSubscribed,
    hasPurchased: input.hasPurchased,
    allowPreview: input.allowPreview,
  })

  void upsertCanonicalCapabilityState({
    mediaId: input.mediaId || null,
    viewerUserId: input.viewerUserId || null,
    creatorUserId: input.creatorUserId || null,
    capabilityKind: input.capabilityKind,
    visibility: input.visibility,
    canView: runtimeCanSignUrl,
    isOwner,
    isSubscribed: input.isSubscribed,
    hasPurchased: input.hasPurchased,
    allowPreview: input.allowPreview,
    sourceSurface: "createMediaSignedUrl.shadow_write",
  })

  const canonicalCanSignUrl = await readCanonicalCapabilityDecision({
    mediaId: input.mediaId || null,
    viewerUserId: input.viewerUserId || null,
    creatorUserId: input.creatorUserId || null,
    capabilityKind: input.capabilityKind,
  })

  const allowed = canonicalCanSignUrl ?? runtimeCanSignUrl

  return {
    allowed,
    reason:
      canonicalCanSignUrl === true
        ? "canonical_allowed"
        : canonicalCanSignUrl === false
          ? "canonical_denied"
          : runtimeCanSignUrl
            ? "runtime_policy_allowed"
            : "runtime_policy_denied",
    runtimeCanSignUrl,
    canonicalCanSignUrl,
    isOwner,
    input,
  }
}
