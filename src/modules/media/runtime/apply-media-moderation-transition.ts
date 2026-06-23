import { findMediaAssetsByLegacyMediaIds } from "@/modules/media/repositories/media-asset-repository"
import { recordMediaModerationResult } from "@/modules/media/repositories/media-moderation-result-repository"

type MediaModerationDecision = "approved" | "rejected" | "needs_review"

async function resolveMediaAssetId(mediaId: string): Promise<string> {
  const assets = await findMediaAssetsByLegacyMediaIds([mediaId])
  return assets[0]?.id ?? mediaId
}

async function writeMediaModerationResult(input: {
  mediaId: string
  decision: MediaModerationDecision
  summary: Record<string, unknown>
}) {
  const mediaAssetId = await resolveMediaAssetId(input.mediaId)

  await recordMediaModerationResult({
    mediaId: mediaAssetId,
    targetType: "media",
    targetId: mediaAssetId,
    provider: "media_moderation_transition",
    providerModel: "new_authority",
    decision: input.decision,
    flagged: input.decision !== "approved",
    scoreSummary: input.summary,
    rawResult: {
      inputMediaId: input.mediaId,
      sourceSurface: "media_moderation_new_authority",
    },
  })
}

export async function applyMediaApprovedForModeration(input: {
  mediaId: string
  summary: Record<string, unknown>
}) {
  await writeMediaModerationResult({
    mediaId: input.mediaId,
    decision: "approved",
    summary: input.summary,
  })
}

export async function applyMediaRejectedForModeration(input: {
  mediaId: string
  summary: Record<string, unknown>
}) {
  await writeMediaModerationResult({
    mediaId: input.mediaId,
    decision: "rejected",
    summary: input.summary,
  })
}

export async function applyMediaNeedsReviewForModeration(input: {
  mediaId: string
  summary: Record<string, unknown>
}) {
  await writeMediaModerationResult({
    mediaId: input.mediaId,
    decision: "needs_review",
    summary: input.summary,
  })
}

export async function applyMediaModerationTransition(input: {
  mediaId: string
  decision: MediaModerationDecision
  summary: Record<string, unknown>
}) {
  if (input.decision === "approved") {
    await applyMediaApprovedForModeration(input)
    return
  }

  if (input.decision === "rejected") {
    await applyMediaRejectedForModeration(input)
    return
  }

  await applyMediaNeedsReviewForModeration(input)
}