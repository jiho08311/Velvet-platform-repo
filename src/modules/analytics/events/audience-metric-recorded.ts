import { randomUUID } from "crypto"
import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"

export type AudienceMetricRecordedPayload = {
  rollupId: string
  creatorId: string
  periodStart: string
  periodEnd: string
  subscriberCount: number
  activeSubscribers: number
  newSubscribers: number
  churnedSubscribers: number
  sourceEventId: string | null
  occurredAt: string
}

export async function emitAudienceMetricRecordedEvent(
  payload: AudienceMetricRecordedPayload
): Promise<void> {
  const now = new Date().toISOString()
  const eventId = randomUUID()

  const envelope: DomainEventEnvelope<AudienceMetricRecordedPayload> = {
    eventId,
    eventType: "AudienceMetricRecorded",
    eventVersion: 1,
    aggregate: {
      aggregateType: "projection",
      aggregateId: payload.rollupId,
    },
    source: {
      producerModule: "analytics",
      producerSurface: "audience_rollup_worker",
      sourceFile: "src/modules/analytics/workers/audience-rollup-worker.ts",
      sourceTable: "audience_metric_rollups",
      sourceRowId: payload.rollupId,
    },
    actor: {
      actorType: "system",
      actorId: null,
    },
    subject: {
      creatorId: payload.creatorId,
    },
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
      idempotencyKey: `AudienceMetricRecorded:${payload.rollupId}:${payload.sourceEventId ?? "manual"}`,
      outboxRequired: false,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload,
    metadata: {
      eventFamily: "analytics",
      legacyRuntimePreserved: true,
      shadowMode: false,
      schemaName: "analytics.audience_metric_recorded.v1",
    },
  }

  await writeDomainEventWithOutbox(envelope)
}
