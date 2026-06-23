import type {
  DomainAggregateType,
  DomainEventType,
} from "./domain-event-types"

export type DomainEventActorType = "user" | "system" | "provider"

export type DomainEventAuthority = {
  runtimeAuthoritative: boolean
  canonicalAuthoritative: boolean
  projectionAuthoritative: boolean
  servingAuthoritative: boolean
  replayAuthoritative: boolean
  promotionAllowed: boolean
  rollbackSafe: boolean
  failOpen: boolean
}

export const PHASE_5_SHADOW_AUTHORITY: DomainEventAuthority = {
  runtimeAuthoritative: true,
  canonicalAuthoritative: false,
  projectionAuthoritative: false,
  servingAuthoritative: false,
  replayAuthoritative: false,
  promotionAllowed: false,
  rollbackSafe: true,
  failOpen: true,
}

export type DomainEventEnvelope<TPayload extends Record<string, unknown>> = {
  eventId: string
  eventType: DomainEventType
  eventVersion: number

  aggregate: {
    aggregateType: DomainAggregateType
    aggregateId: string
  }

  source: {
    producerModule: string
    producerSurface: string
    sourceFile?: string
    sourceTable?: string | null
    sourceRowId?: string | null
  }

  actor: {
    actorType: DomainEventActorType
    actorId: string | null
  }

  subject: {
    userId?: string | null
    creatorId?: string | null
    recipientUserId?: string | null
  }

  correlation: {
    correlationId: string
    causationId: string | null
    commandId: string | null
    requestId: string | null
  }

  timing: {
    occurredAt: string
    recordedAt: string
  }

  delivery: {
    idempotencyKey: string
    outboxRequired: boolean
    replayable: boolean
  }

  authority: DomainEventAuthority

  payload: TPayload

  metadata: {
    eventFamily?: string
    legacyRuntimePreserved: boolean
    shadowMode: boolean
    schemaName?: string
    provenance?: Record<string, unknown>
    diagnostics?: Record<string, unknown>
  }
}
