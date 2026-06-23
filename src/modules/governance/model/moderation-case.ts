export type ModerationDecision = "approved" | "rejected" | "needs_review"

export type CanonicalModerationCaseRow = {
  id: string
  moderation_case_key: string
  source_queue_id: string | null
  target_type: string
  target_id: string
  reason: string | null
  case_status: string
  decision: ModerationDecision | null
  provider: string | null
  provider_model: string | null
  flagged: boolean | null
  score_summary: Record<string, unknown>
  raw_result: Record<string, unknown>
  target_snapshot: Record<string, unknown>
  decision_metadata: Record<string, unknown>
  policy_version: string
  governance_event_key: string | null
  governance_timeline_key: string | null
  governance_enforcement_key: string | null
  created_at: string
  updated_at: string
}

export type RequestModerationCaseInput = {
  targetType: string
  targetId: string
  reason?: string | null
  sourceMetadata?: Record<string, unknown>
}

export type RecordModerationDecisionInput = {
  moderationCaseKey: string
  decision: ModerationDecision
  provider: string
  providerModel: string
  flagged: boolean
  scoreSummary?: Record<string, unknown> | null
  rawResult?: Record<string, unknown> | null
}
