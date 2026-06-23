import { randomUUID } from "crypto"

import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/runtime/event-handler-registry"
import { writeDomainEventWithOutbox } from "@/modules/events/runtime/write-domain-event-with-outbox"
import {
  applyUserTrustState,
  type UserTrustState,
} from "@/modules/identity/public/apply-user-trust-state"

type TrustSafetyActionIssuedPayload = {
  eventId: string
  actionId: string
  actionType:
    | "HIDE_CONTENT"
    | "REMOVE_CONTENT"
    | "LIMIT_VISIBILITY"
    | "SUSPEND_USER"
    | "BAN_USER"
    | "WARN_USER"
  targetType: "POST" | "STORY" | "MEDIA" | "USER" | "CREATOR"
  targetId: string
  sourceCaseId: string
  occurredAt: string
}

function readPayload(event: {
  payload: Record<string, unknown> | null
}): TrustSafetyActionIssuedPayload | null {
  const payload = event.payload

  if (!payload) return null

  if (
    typeof payload.eventId !== "string" ||
    typeof payload.actionId !== "string" ||
    typeof payload.actionType !== "string" ||
    typeof payload.targetType !== "string" ||
    typeof payload.targetId !== "string" ||
    typeof payload.sourceCaseId !== "string" ||
    typeof payload.occurredAt !== "string"
  ) {
    return null
  }

  return payload as TrustSafetyActionIssuedPayload
}

function toUserTrustState(
  actionType: TrustSafetyActionIssuedPayload["actionType"]
): UserTrustState | null {
  if (actionType === "WARN_USER") return "WARNED"
  if (actionType === "SUSPEND_USER") return "SUSPENDED"
  if (actionType === "BAN_USER") return "BANNED"

  return null
}

function buildUserTrustStateChangedEnvelope(input: {
  sourceEventId: string
  userId: string
  trustState: UserTrustState
  reason: string
  occurredAt: string
}): DomainEventEnvelope<{
  eventId: string
  userId: string
  trustState: UserTrustState
  reason: string
  occurredAt: string
}> {
  const eventId = randomUUID()

  return {
    eventId,
    eventType: "UserTrustStateChanged",
    eventVersion: 1,
    aggregate: {
      aggregateType: "user",
      aggregateId: input.userId,
    },
    source: {
      producerModule: "identity",
      producerSurface: "identity.user_trust_state",
      sourceTable: "canonical_profiles",
      sourceRowId: input.userId,
    },
    actor: {
      actorType: "system",
      actorId: null,
    },
    subject: {
      userId: input.userId,
    },
    correlation: {
      correlationId: input.sourceEventId,
      causationId: input.sourceEventId,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt: input.occurredAt,
      recordedAt: new Date().toISOString(),
    },
    delivery: {
      idempotencyKey: `UserTrustStateChanged:${input.userId}:${input.trustState}:${input.sourceEventId}`,
      outboxRequired: true,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload: {
      eventId,
      userId: input.userId,
      trustState: input.trustState,
      reason: input.reason,
      occurredAt: input.occurredAt,
    },
    metadata: {
      eventFamily: "trust_safety",
      legacyRuntimePreserved: true,
      shadowMode: true,
      schemaName: "trust_safety.user_trust_state_changed.v1",
    },
  }
}

export const trustSafetyActionUserTrustHandler: EventHandler = {
  handlerName: "trust-safety-action-user-trust-handler",
  eventTypes: ["TrustSafetyActionIssued"],

  async handle(event): Promise<EventHandlerResult> {
    const payload = readPayload(event)

    if (!payload) {
      return {
        status: "skipped",
        reason: "INVALID_TRUST_SAFETY_ACTION_PAYLOAD",
      }
    }

    if (payload.targetType !== "USER" && payload.targetType !== "CREATOR") {
      return {
        status: "skipped",
        reason: "TARGET_NOT_USER_OR_CREATOR",
      }
    }

    const trustState = toUserTrustState(payload.actionType)

    if (!trustState) {
      return {
        status: "skipped",
        reason: "ACTION_NOT_USER_TRUST_STATE",
      }
    }

    await applyUserTrustState({
      userId: payload.targetId,
      trustState,
      reason: payload.actionType,
      occurredAt: payload.occurredAt,
    })

    await writeDomainEventWithOutbox(
      buildUserTrustStateChangedEnvelope({
        sourceEventId: payload.eventId,
        userId: payload.targetId,
        trustState,
        reason: payload.actionType,
        occurredAt: payload.occurredAt,
      })
    )

    return {
      status: "completed",
      resultHash: payload.actionId,
    }
  },
}
