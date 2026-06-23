import { randomUUID } from "crypto"
import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"

function toReportSubmittedTargetType(targetType: string) {
  switch (targetType) {
    case "post":
      return "POST"
    case "message":
      return "MESSAGE"
    case "creator":
    case "user":
      return "PROFILE"
    default:
      return "PROFILE"
  }
}

export function buildReportSubmittedEnvelope(input: {
  reportCaseKey: string
  reporterId: string
  targetType: string
  targetId: string
  reasonCode: string
  occurredAt: string
}): DomainEventEnvelope<{
  eventId: string
  reportId: string
  reporterId: string
  targetType: "POST" | "STORY" | "MESSAGE" | "PROFILE" | "MEDIA"
  targetId: string
  reasonCode: string
  occurredAt: string
}> {
  const eventId = randomUUID()

  return {
    eventId,
    eventType: "ReportSubmitted",
    eventVersion: 1,
    aggregate: {
      aggregateType: "report",
      aggregateId: input.reportCaseKey,
    },
    source: {
      producerModule: "report",
      producerSurface: "report.submit",
      sourceTable: "canonical_report_cases",
      sourceRowId: input.reportCaseKey,
    },
    actor: {
      actorType: "user",
      actorId: input.reporterId,
    },
    subject: {
      userId: input.reporterId,
    },
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
      idempotencyKey: `ReportSubmitted:${input.reportCaseKey}`,
      outboxRequired: true,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload: {
      eventId,
      reportId: input.reportCaseKey,
      reporterId: input.reporterId,
      targetType: toReportSubmittedTargetType(input.targetType),
      targetId: input.targetId,
      reasonCode: input.reasonCode,
      occurredAt: input.occurredAt,
    },
    metadata: {
      eventFamily: "trust_safety",
      legacyRuntimePreserved: true,
      shadowMode: true,
      schemaName: "trust_safety.report_submitted.v1",
    },
  }
}
