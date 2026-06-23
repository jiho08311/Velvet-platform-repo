import { createHash } from "crypto"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type {
  EvaluateAccessDecision,
  EvaluateAccessInput,
} from "@/modules/entitlement/public/evaluate-access"
import type {
  LegacyAccessDecisionSnapshot,
  ShadowEvaluateAccessResult,
} from "@/modules/entitlement/runtime/shadow-evaluate-access-runtime"
import { InfrastructureError } from "@/shared/errors"

function hashViewerUserId(viewerUserId: string | null): string | null {
  if (!viewerUserId) return null

  return createHash("sha256").update(viewerUserId).digest("hex")
}

function getSubjectId(subject: EvaluateAccessInput["subject"]): string {
  if (subject.type === "creator") return subject.creatorId
  if (subject.type === "post") return subject.postId
  return subject.messageId
}

function normalizeLegacyAllowed(
  legacyDecision: LegacyAccessDecisionSnapshot | undefined
): boolean | null {
  if (!legacyDecision) return null
  if (typeof legacyDecision.allowed === "boolean") {
    return legacyDecision.allowed
  }
  if (typeof legacyDecision.canAccess === "boolean") {
    return legacyDecision.canAccess
  }
  if (typeof legacyDecision.canView === "boolean") {
    return legacyDecision.canView
  }
  return null
}

export type RecordAccessDecisionAuditInput = {
  accessInput: EvaluateAccessInput
  legacyDecision?: LegacyAccessDecisionSnapshot
  entitlementDecision: EvaluateAccessDecision | null
  shadowResult: ShadowEvaluateAccessResult
  mode?: "shadow" | "dual" | "authoritative"
}

export async function recordAccessDecisionAudit(
  input: RecordAccessDecisionAuditInput
): Promise<void> {
  const subject = input.accessInput.subject
  const viewerUserId = input.accessInput.viewerUserId

  const { error } = await supabaseAdmin
    .from("access_decision_audit_logs")
    .insert({
      correlation_id: input.accessInput.correlationId ?? null,
      viewer_user_id: viewerUserId,
      viewer_user_id_hash: hashViewerUserId(viewerUserId),
      subject_type: subject.type,
      subject_id: getSubjectId(subject),
      surface: input.accessInput.surface,
      legacy_allowed: normalizeLegacyAllowed(input.legacyDecision),
      entitlement_allowed: input.entitlementDecision?.allowed ?? null,
      matched: input.shadowResult.matched,
      legacy_decision: input.legacyDecision ?? null,
      entitlement_decision: input.entitlementDecision ?? null,
      diff: input.shadowResult.diff,
      decision_version:
        input.entitlementDecision?.decisionVersion ?? "entitlement_v1",
      mode: input.mode ?? "shadow",
    })

  if (error) {
    throw new InfrastructureError(
      "ACCESS_DECISION_AUDIT_INSERT_FAILED",
      {
        cause: error,
        metadata: {
          surface: input.accessInput.surface,
          subjectType: subject.type,
          subjectId: getSubjectId(subject),
          viewerUserId,
          mode: input.mode ?? "shadow",
        },
      }
    )
  }
}

/**
 * @deprecated Use recordAccessDecisionAudit in critical access paths.
 */
export async function recordAccessDecisionAuditNoThrow(
  input: RecordAccessDecisionAuditInput
): Promise<void> {
  await recordAccessDecisionAudit(input)
}