import { randomUUID } from "crypto"
import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import type {
  TrustSafetyActionTargetType,
  TrustSafetyActionType,
} from "@/modules/governance/repositories/trust-safety-action-repository"

type ReviewedDecision = "APPROVED" | "REJECTED" | "ESCALATED"

function toReviewedDecision(decision: string): ReviewedDecision {
  if (decision === "approved") return "APPROVED"
  if (decision === "rejected") return "REJECTED"
  return "ESCALATED"
}

export function buildModerationCaseOpenedEnvelope(input: {
  moderationCaseKey: string
  targetType: string
  targetId: string
  reason: string | null
  occurredAt: string
  sourceEventId?: string | null
  sourceReportId?: string | null
}): DomainEventEnvelope<{
  eventId: string
  caseId: string
  targetType: string
  targetId: string
  reason: string | null
  occurredAt: string
}> {
  const eventId = randomUUID()

  return {
    eventId,
    eventType: "ModerationCaseOpened",
    eventVersion: 1,
    aggregate: {
      aggregateType: "moderation",
      aggregateId: input.moderationCaseKey,
    },
    source: {
      producerModule: "moderation",
      producerSurface: "moderation.case.open",
      sourceTable: "canonical_moderation_cases",
      sourceRowId: input.moderationCaseKey,
    },
    actor: {
      actorType: "system",
      actorId: null,
    },
    subject: {},
    correlation: {
      correlationId: input.sourceEventId ?? eventId,
      causationId: input.sourceEventId ?? null,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt: input.occurredAt,
      recordedAt: new Date().toISOString(),
    },
    delivery: {
      idempotencyKey: `ModerationCaseOpened:${input.moderationCaseKey}`,
      outboxRequired: true,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload: {
      eventId,
      caseId: input.moderationCaseKey,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      occurredAt: input.occurredAt,
    },
    metadata: {
      eventFamily: "trust_safety",
      legacyRuntimePreserved: true,
      shadowMode: true,
      schemaName: "trust_safety.moderation_case_opened.v1",
      provenance: {
        sourceReportId: input.sourceReportId ?? null,
      },
    },
  }
}

export function buildModerationCaseReviewedEnvelope(input: {
  moderationCaseKey: string
  reviewerId: string | null
  decision: string
  occurredAt: string
}): DomainEventEnvelope<{
  eventId: string
  caseId: string
  reviewerId: string
  decision: ReviewedDecision
  policyIds: string[]
  occurredAt: string
}> {
  const eventId = randomUUID()

  return {
    eventId,
    eventType: "ModerationCaseReviewed",
    eventVersion: 1,
    aggregate: {
      aggregateType: "moderation",
      aggregateId: input.moderationCaseKey,
    },
    source: {
      producerModule: "moderation",
      producerSurface: "moderation.case.review",
      sourceTable: "canonical_moderation_cases",
      sourceRowId: input.moderationCaseKey,
    },
    actor: {
      actorType: input.reviewerId ? "user" : "system",
      actorId: input.reviewerId,
    },
    subject: {},
    correlation: {
      correlationId: eventId,
      causationId: null,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt: input.occurredAt,
      recordedAt: new Date().toISOString(),
    },
    delivery: {
      idempotencyKey: `ModerationCaseReviewed:${input.moderationCaseKey}:${input.decision}`,
      outboxRequired: true,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload: {
      eventId,
      caseId: input.moderationCaseKey,
      reviewerId: input.reviewerId ?? "system",
      decision: toReviewedDecision(input.decision),
      policyIds: ["platform_governance.moderation.v1"],
      occurredAt: input.occurredAt,
    },
    metadata: {
      eventFamily: "trust_safety",
      legacyRuntimePreserved: true,
      shadowMode: true,
      schemaName: "trust_safety.moderation_case_reviewed.v1",
    },
  }
}

export function buildTrustSafetyActionIssuedEnvelope(input: {
  actionId: string
  actionType: TrustSafetyActionType
  targetType: TrustSafetyActionTargetType
  targetId: string
  sourceCaseId: string
  occurredAt: string
}): DomainEventEnvelope<{
  eventId: string
  actionId: string
  actionType: TrustSafetyActionType
  targetType: TrustSafetyActionTargetType
  targetId: string
  sourceCaseId: string
  occurredAt: string
}> {
  const eventId = randomUUID()

  return {
    eventId,
    eventType: "TrustSafetyActionIssued",
    eventVersion: 1,
    aggregate: {
      aggregateType: "moderation",
      aggregateId: input.actionId,
    },
    source: {
      producerModule: "moderation",
      producerSurface: "moderation.action.issue",
      sourceTable: "trust_safety_actions",
      sourceRowId: input.actionId,
    },
    actor: {
      actorType: "system",
      actorId: null,
    },
    subject: {},
    correlation: {
      correlationId: eventId,
      causationId: input.sourceCaseId,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt: input.occurredAt,
      recordedAt: new Date().toISOString(),
    },
    delivery: {
      idempotencyKey: `TrustSafetyActionIssued:${input.actionId}`,
      outboxRequired: true,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload: {
      eventId,
      actionId: input.actionId,
      actionType: input.actionType,
      targetType: input.targetType,
      targetId: input.targetId,
      sourceCaseId: input.sourceCaseId,
      occurredAt: input.occurredAt,
    },
    metadata: {
      eventFamily: "trust_safety",
      legacyRuntimePreserved: true,
      shadowMode: true,
      schemaName: "trust_safety.action_issued.v1",
    },
  }
}
