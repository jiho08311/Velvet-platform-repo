import type { CanonicalModerationCaseRow } from "@/modules/governance/model/moderation-case"
import { insertTrustSafetyAction } from "@/modules/governance/repositories/trust-safety-action-repository"
import { recordModerationPolicyDecision } from "@/modules/governance/repositories/moderation-policy-decision-repository"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"
import {
  buildModerationCaseReviewedEnvelope,
  buildTrustSafetyActionIssuedEnvelope,
} from "@/modules/governance/runtime/moderation-governance-events"
import {
  toTrustSafetyActionTargetType,
  toTrustSafetyActionType,
} from "@/modules/governance/runtime/moderation-trust-safety-action-policy"

export async function recordModerationDecisionSideEffects(
  updated: CanonicalModerationCaseRow
) {
  if (!updated.decision) {
    return
  }

  const decision = updated.decision

  await recordModerationPolicyDecision({
    moderationCaseKey: updated.moderation_case_key,
    decision,
    targetType: updated.target_type,
    targetId: updated.target_id,
    reason: updated.reason ?? "moderation",
    policyVersion: updated.policy_version,
    metadata: {
      provider: updated.provider,
      providerModel: updated.provider_model,
      flagged: updated.flagged,
      scoreSummary: updated.score_summary,
    },
  })

  await writeDomainEventWithOutbox(
    buildModerationCaseReviewedEnvelope({
      moderationCaseKey: updated.moderation_case_key,
      reviewerId: null,
      decision,
      occurredAt: updated.updated_at,
    })
  )

  const actionType = toTrustSafetyActionType({
    decision,
    targetType: updated.target_type,
  })

  if (!actionType) {
    return
  }

  const actionId = [
    "trust-safety-action",
    updated.moderation_case_key,
    actionType,
  ].join(":")
  const targetType = toTrustSafetyActionTargetType(updated.target_type)

  await insertTrustSafetyAction({
    actionId,
    actionType,
    targetType,
    targetId: updated.target_id,
    sourceCaseId: updated.moderation_case_key,
    reason: updated.reason ?? "moderation",
    payload: {
      decision,
      policyVersion: updated.policy_version,
    },
  })

  await writeDomainEventWithOutbox(
    buildTrustSafetyActionIssuedEnvelope({
      actionId,
      actionType,
      targetType,
      targetId: updated.target_id,
      sourceCaseId: updated.moderation_case_key,
      occurredAt: updated.updated_at,
    })
  )
}
