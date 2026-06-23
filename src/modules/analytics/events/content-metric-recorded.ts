import { randomUUID } from "crypto"
import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"

export type ContentMetricRecordedPayload = {
  rollupId: string
  contentId: string | null
  creatorId: string
  periodStart: string
  periodEnd: string
  views: number
  likes: number
  comments: number
  engagementRate: number
  sourceEventId: string | null
  occurredAt: string
}

export async function emitContentMetricRecordedEvent(
  payload: ContentMetricRecordedPayload
): Promise<void> {
  const now = new Date().toISOString()
  const eventId = randomUUID()

  const envelope: DomainEventEnvelope<ContentMetricRecordedPayload> = {
    eventId,
    eventType: "ContentMetricRecorded",
    eventVersion: 1,
    aggregate: {
      aggregateType: "projection",
      aggregateId: payload.rollupId,
    },
    source: {
      producerModule: "analytics",
      producerSurface: "content_rollup_worker",
      sourceFile: "src/modules/analytics/workers/content-rollup-worker.ts",
      sourceTable: "content_metric_rollups",
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
      idempotencyKey: `ContentMetricRecorded:${payload.rollupId}:${payload.sourceEventId ?? "manual"}`,
      outboxRequired: false,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload,
    metadata: {
      eventFamily: "analytics",
      legacyRuntimePreserved: true,
      shadowMode: false,
      schemaName: "analytics.content_metric_recorded.v1",
    },
  }

  await writeDomainEventWithOutbox(envelope)
}
