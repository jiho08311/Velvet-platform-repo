// src/modules/media/runtime/media-moderation-runtime.ts

import {
  queueMediaModeration,
  recordMediaModerationResult,
  findLatestMediaModerationResultByMediaId,
  type MediaModerationDecision,
  type MediaModerationResultRow,
} from "@/modules/media/repositories/media-moderation-result-repository"

export type MediaModerationDecisionContract = {
  mediaId: string
  decision: MediaModerationDecision | null
  flagged: boolean | null
  provider: string | null
  providerModel: string | null
}

export async function queueMediaModerationRuntime(input: {
  mediaId: string
  targetType: string
  targetId: string
  reason: string
}) {
  return queueMediaModeration({
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
  })
}

export async function recordMediaModerationResultRuntime(input: {
  mediaId: string
  targetType: string
  targetId: string
  provider: string
  providerModel: string
  decision: MediaModerationDecision
  flagged: boolean
  scoreSummary?: Record<string, unknown> | null
  rawResult?: Record<string, unknown> | null
  postId?: string | null
}) {
  return recordMediaModerationResult({
    mediaId: input.mediaId,
    targetType: input.targetType,
    targetId: input.targetId,
    provider: input.provider,
    providerModel: input.providerModel,
    decision: input.decision,
    flagged: input.flagged,
    scoreSummary: input.scoreSummary ?? null,
    rawResult: input.rawResult ?? null,
    postId: input.postId ?? null,
  })
}

function toDecisionContract(
  row: MediaModerationResultRow | null,
  mediaId: string
): MediaModerationDecisionContract {
  if (!row) {
    return {
      mediaId,
      decision: null,
      flagged: null,
      provider: null,
      providerModel: null,
    }
  }

  return {
    mediaId,
    decision: row.decision,
    flagged: row.flagged,
    provider: row.provider,
    providerModel: row.provider_model,
  }
}

export async function getMediaModerationDecisionRuntime(input: {
  mediaId: string
}): Promise<MediaModerationDecisionContract> {
  const row = await findLatestMediaModerationResultByMediaId(
    input.mediaId
  )

  return toDecisionContract(row, input.mediaId)
}