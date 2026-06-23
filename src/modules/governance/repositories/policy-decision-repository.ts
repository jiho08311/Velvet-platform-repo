import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { ReportStatus } from "@/modules/report/types"

export async function recordReportPolicyDecision(input: {
  reportCaseKey: string
  status: ReportStatus
  actorProfileId?: string | null
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
        policy_decision_key: `report-policy:${input.reportCaseKey}:${input.status}`,
        case_type: "report_case",
        case_key: input.reportCaseKey,
        policy_name: "report_review_policy",
        policy_version: input.policyVersion,
        decision: input.status,
        decision_status: "recorded",
        actor_profile_id: input.actorProfileId ?? null,
        target_type: input.targetType,
        target_id: input.targetId,
        reason: input.reason,
        decision_metadata: input.metadata ?? {},
        migration_source: "runtime",
        source_metadata: {
          sourceSurface: "governance.policy_decision.runtime",
        },
        decided_at: new Date().toISOString(),
      },
      { onConflict: "policy_decision_key" }
    )

  if (error) {
    throw error
  }
}
