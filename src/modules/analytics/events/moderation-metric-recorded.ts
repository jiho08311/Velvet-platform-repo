import { randomUUID } from "crypto"
import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"

export type ModerationMetricRecordedPayload = {
  rollupId: string
  periodStart: string
  periodEnd: string
  reportsReceived: number
  casesReviewed: number
  actionsIssued: number
  contentRemoved: number
  usersSuspended: number
  sourceEventId: string | null
  occurredAt: string
}

export async function emitModerationMetricRecordedEvent(
  payload: ModerationMetricRecordedPayload
): Promise<void> {
  const now = new Date().toISOString()
  const eventId = randomUUID()

  const envelope: DomainEventEnvelope<ModerationMetricRecordedPayload> = {
    eventId,
    eventType: "ModerationMetricRecorded",
    eventVersion: 1,
    aggregate: {
      aggregateType: "projection",
      aggregateId: payload.rollupId,
    },
    source: {
      producerModule: "analytics",
      producerSurface: "moderation_rollup_worker",
      sourceFile: "src/modules/analytics/workers/moderation-rollup-worker.ts",
      sourceTable: "trust_safety_metric_rollups",
      sourceRowId: payload.rollupId,
    },
    actor: {
      actorType: "system",
      actorId: null,
    },
    subject: {},
    correlation: {
      correlationId: eventId,
      causationId: payload.sourceEventId,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt: payload.occurredAt,
      recordedAt: now,
    },
    delivery: {
      idempotencyKey: `ModerationMetricRecorded:${payload.rollupId}:${payload.sourceEventId ?? "manual"}`,
      outboxRequired: false,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload,
    metadata: {
      eventFamily: "analytics",
      legacyRuntimePreserved: true,
      shadowMode: false,
      schemaName: "analytics.moderation_metric_recorded.v1",
    },
  }

  await writeDomainEventWithOutbox(envelope)
}
