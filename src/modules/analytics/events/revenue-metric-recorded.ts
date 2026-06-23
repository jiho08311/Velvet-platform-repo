import { randomUUID } from "crypto"
import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"

export type RevenueMetricRecordedPayload = {
  rollupId: string
  creatorId: string | null
  periodStart: string
  periodEnd: string
  grossRevenue: number
  netRevenue: number
  platformFee: number
  refundAmount: number
  currency: string
  sourceEventId: string | null
  occurredAt: string
}

export async function emitRevenueMetricRecordedEvent(
  payload: RevenueMetricRecordedPayload
): Promise<void> {
  const now = new Date().toISOString()
  const eventId = randomUUID()

  const envelope: DomainEventEnvelope<RevenueMetricRecordedPayload> = {
    eventId,
    eventType: "RevenueMetricRecorded",
    eventVersion: 1,
    aggregate: {
      aggregateType: "projection",
      aggregateId: payload.rollupId,
    },
    source: {
      producerModule: "analytics",
      producerSurface: "revenue_rollup_worker",
      sourceFile: "src/modules/analytics/workers/revenue-rollup-worker.ts",
      sourceTable: "revenue_metric_rollups",
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
      idempotencyKey: `RevenueMetricRecorded:${payload.rollupId}:${payload.sourceEventId ?? "manual"}`,
      outboxRequired: false,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload,
    metadata: {
      eventFamily: "analytics",
      legacyRuntimePreserved: true,
      shadowMode: false,
      schemaName: "analytics.revenue_metric_recorded.v1",
    },
  }

  await writeDomainEventWithOutbox(envelope)
}
