import {
  findLatestModerationCaseByTarget,
  recordModerationDecision,
  requestModerationCase,
} from "@/modules/governance/public/moderation-governance-contract"

export type MediaModerationDecision = "approved" | "rejected" | "needs_review"

export type MediaModerationQueueRow = {
  id: string
  target_type: string
  target_id: string
  reason: string
  status: string
  created_at: string
}

export type MediaModerationResultRow = {
  id: string
  post_id: string | null
  media_id: string | null
  target_type: string
  target_id: string
  provider: string
  provider_model: string
  decision: MediaModerationDecision
  flagged: boolean
  score_summary: Record<string, unknown> | null
  raw_result: Record<string, unknown> | null
  created_at: string
}

export async function queueMediaModeration(input: {
  targetType: string
  targetId: string
  reason: string
}): Promise<MediaModerationQueueRow> {
  const moderationCase = await requestModerationCase({
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    sourceMetadata: {
      sourceSurface: "media.queueMediaModeration",
    },
  })

  return {
    id: moderationCase.moderation_case_key,
    target_type: moderationCase.target_type,
    target_id: moderationCase.target_id,
    reason: moderationCase.reason ?? input.reason,
    status: moderationCase.case_status,
    created_at: moderationCase.created_at,
  }
}

export async function recordMediaModerationResult(input: {
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
}): Promise<MediaModerationResultRow> {
  const existing =
    await findLatestModerationCaseByTarget({
      targetType: input.targetType,
      targetId: input.targetId,
    })

  const moderationCase =
    existing ??
    (await requestModerationCase({
      targetType: input.targetType,
      targetId: input.targetId,
      reason: "media_moderation",
      sourceMetadata: {
        mediaId: input.mediaId,
        postId: input.postId ?? null,
        sourceSurface: "media.recordMediaModerationResult",
      },
    }))

  const updated = await recordModerationDecision({
    moderationCaseKey: moderationCase.moderation_case_key,
    decision: input.decision,
    provider: input.provider,
    providerModel: input.providerModel,
    flagged: input.flagged,
    scoreSummary: input.scoreSummary ?? {},
    rawResult: {
      ...(input.rawResult ?? {}),
      mediaId: input.mediaId,
      postId: input.postId ?? null,
    },
  })

  return {
    id: updated.moderation_case_key,
    post_id: input.postId ?? null,
    media_id: input.mediaId,
    target_type: updated.target_type,
    target_id: updated.target_id,
    provider: updated.provider ?? input.provider,
    provider_model: updated.provider_model ?? input.providerModel,
    decision: updated.decision ?? input.decision,
    flagged: updated.flagged ?? input.flagged,
    score_summary: updated.score_summary,
    raw_result: updated.raw_result,
    created_at: updated.updated_at,
  }
}

export async function findLatestMediaModerationResultByMediaId(
  mediaId: string
): Promise<MediaModerationResultRow | null> {
  const moderationCase = await findLatestModerationCaseByTarget({
    targetType: "media",
    targetId: mediaId,
  })

  if (!moderationCase?.decision) {
    return null
  }

  return {
    id: moderationCase.moderation_case_key,
    post_id: null,
    media_id: mediaId,
    target_type: moderationCase.target_type,
    target_id: moderationCase.target_id,
    provider: moderationCase.provider ?? "canonical_moderation_case",
    provider_model: moderationCase.provider_model ?? "canonical_authority",
    decision: moderationCase.decision,
    flagged: moderationCase.flagged ?? moderationCase.decision !== "approved",
    score_summary: moderationCase.score_summary,
    raw_result: moderationCase.raw_result,
    created_at: moderationCase.updated_at,
  }
}
