import type {
  RecordModerationDecisionInput,
  RequestModerationCaseInput,
} from "@/modules/governance/model/moderation-case"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"
import {
  findLatestCanonicalModerationCaseByTarget,
  insertCanonicalModerationCase,
  listCanonicalModerationCases,
  updateCanonicalModerationCaseDecision,
} from "@/modules/governance/repositories/moderation-case-repository"
import { recordModerationDecisionSideEffects } from "@/modules/governance/runtime/moderation-decision-side-effects"
import { buildModerationCaseOpenedEnvelope } from "@/modules/governance/runtime/moderation-governance-events"

function readSourceMetadataId(
  sourceMetadata: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = sourceMetadata?.[key]
  return typeof value === "string" ? value : null
}

export async function executeRequestModerationCaseRuntime(
  input: RequestModerationCaseInput
) {
  const moderationCase = await insertCanonicalModerationCase(input)

  await writeDomainEventWithOutbox(
    buildModerationCaseOpenedEnvelope({
      moderationCaseKey: moderationCase.moderation_case_key,
      targetType: moderationCase.target_type,
      targetId: moderationCase.target_id,
      reason: moderationCase.reason,
      occurredAt: moderationCase.created_at,
      sourceEventId: readSourceMetadataId(
        input.sourceMetadata,
        "sourceEventId"
      ),
      sourceReportId: readSourceMetadataId(
        input.sourceMetadata,
        "sourceReportId"
      ),
    })
  )

  return moderationCase
}

export async function executeListModerationCasesRuntime() {
  return listCanonicalModerationCases()
}

export async function executeRecordModerationDecisionRuntime(
  input: RecordModerationDecisionInput
) {
  const updated = await updateCanonicalModerationCaseDecision(input)

  await recordModerationDecisionSideEffects(updated)

  return updated
}

export async function executeFindLatestModerationCaseByTargetRuntime(input: {
  targetType: string
  targetId: string
}) {
  return findLatestCanonicalModerationCaseByTarget(input)
}
