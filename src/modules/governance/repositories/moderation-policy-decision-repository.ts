import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { ModerationDecision } from "@/modules/governance/model/moderation-case"

export async function recordModerationPolicyDecision(input: {
  moderationCaseKey: string
  decision: ModerationDecision
  targetType: string
  targetId: string
  reason: string
  policyVersion: string
  metadata?: Record<string, unknown>
}) {
  const { error } = await supabaseAdmin
    .from("canonical_policy_decisions")
    .upsert(
      {
        policy_decision_key: `moderation-policy:${input.moderationCaseKey}:${input.decision}`,
        case_type: "moderation_case",
        case_key: input.moderationCaseKey,
        policy_name: "moderation_decision_policy",
        policy_version: input.policyVersion,
        decision: input.decision,
        decision_status: "recorded",
        target_type: input.targetType,
        target_id: input.targetId,
        reason: input.reason,
        decision_metadata: input.metadata ?? {},
        migration_source: "runtime",
        source_metadata: {
          sourceSurface: "governance.moderation_policy_decision.runtime",
        },
        decided_at: new Date().toISOString(),
      },
      { onConflict: "policy_decision_key" }
    )

  if (error) {
    throw error
  }
}
