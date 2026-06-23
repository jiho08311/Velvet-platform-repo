import { randomUUID } from "crypto"

import type { DomainEventEnvelope } from "@/modules/events/contracts"
import { PHASE_5_SHADOW_AUTHORITY } from "@/modules/events/contracts/domain-event-envelope"
import type { MediaDomainEventType } from "@/modules/events/contracts/domain-event-types"

type BuildMediaEventEnvelopeInput<TPayload extends Record<string, unknown>> = {
  eventType: MediaDomainEventType
  aggregateId: string
  payload: TPayload
  producerSurface: string
  sourceFile?: string
  sourceTable?: string | null
  sourceRowId?: string | null
  actorId?: string | null
  subjectUserId?: string | null
  subjectCreatorId?: string | null
  correlationId?: string | null
  causationId?: string | null
  commandId?: string | null
  requestId?: string | null
  outboxRequired?: boolean
  replayable?: boolean
  idempotencyKey?: string
  shadowMode?: boolean
}

export function buildMediaEventEnvelope<TPayload extends Record<string, unknown>>(
  input: BuildMediaEventEnvelopeInput<TPayload>,
): DomainEventEnvelope<TPayload> {
  const now = new Date().toISOString()
  const eventId = randomUUID()
  const correlationId = input.correlationId ?? randomUUID()

  return {
    eventId,
    eventType: input.eventType,
    eventVersion: 1,

    aggregate: {
      aggregateType: "media",
      aggregateId: input.aggregateId,
    },

    source: {
      producerModule: "media",
      producerSurface: input.producerSurface,
      sourceFile: input.sourceFile,
      sourceTable: input.sourceTable ?? null,
      sourceRowId: input.sourceRowId ?? null,
    },

    actor: {
      actorType: input.actorId ? "user" : "system",
      actorId: input.actorId ?? null,
    },

    subject: {
      userId: input.subjectUserId ?? null,
      creatorId: input.subjectCreatorId ?? null,
    },

    correlation: {
      correlationId,
      causationId: input.causationId ?? null,
      commandId: input.commandId ?? null,
      requestId: input.requestId ?? null,
    },

    timing: {
      occurredAt: now,
      recordedAt: now,
    },

    delivery: {
      idempotencyKey:
        input.idempotencyKey ??
        `media:${input.eventType}:${input.aggregateId}:${eventId}`,
      outboxRequired: input.outboxRequired ?? true,
      replayable: input.replayable ?? true,
    },

    authority: PHASE_5_SHADOW_AUTHORITY,

    payload: input.payload,

    metadata: {
      eventFamily: "media",
      legacyRuntimePreserved: true,
      shadowMode: input.shadowMode ?? true,
      schemaName: "media_event_v1",
    },
  }
}