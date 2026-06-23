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
  applyContentModerationVisibility,
  type ContentModerationVisibility,
} from "@/modules/post/public/apply-content-moderation-visibility"

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

function toContentVisibility(
  actionType: TrustSafetyActionIssuedPayload["actionType"]
): ContentModerationVisibility | null {
  if (actionType === "HIDE_CONTENT") return "HIDDEN"
  if (actionType === "REMOVE_CONTENT") return "REMOVED"
  if (actionType === "LIMIT_VISIBILITY") return "LIMITED"

  return null
}

function buildContentVisibilityChangedEnvelope(input: {
  sourceEventId: string
  contentId: string
  visibility: ContentModerationVisibility
  reason: string
  occurredAt: string
}): DomainEventEnvelope<{
  eventId: string
  contentId: string
  visibility: ContentModerationVisibility
  reason: string
  occurredAt: string
}> {
  const eventId = randomUUID()

  return {
    eventId,
    eventType: "ContentVisibilityChanged",
    eventVersion: 1,
    aggregate: {
      aggregateType: "post",
      aggregateId: input.contentId,
    },
    source: {
      producerModule: "post",
      producerSurface: "post.content_visibility",
      sourceTable: "canonical_posts",
      sourceRowId: input.contentId,
    },
    actor: {
      actorType: "system",
      actorId: null,
    },
    subject: {},
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
      idempotencyKey: `ContentVisibilityChanged:${input.contentId}:${input.visibility}:${input.sourceEventId}`,
      outboxRequired: true,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload: {
      eventId,
      contentId: input.contentId,
      visibility: input.visibility,
      reason: input.reason,
      occurredAt: input.occurredAt,
    },
    metadata: {
      eventFamily: "trust_safety",
      legacyRuntimePreserved: true,
      shadowMode: true,
      schemaName: "trust_safety.content_visibility_changed.v1",
    },
  }
}

export const trustSafetyActionContentVisibilityHandler: EventHandler = {
  handlerName: "trust-safety-action-content-visibility-handler",
  eventTypes: ["TrustSafetyActionIssued"],

  async handle(event): Promise<EventHandlerResult> {
    const payload = readPayload(event)

    if (!payload) {
      return {
        status: "skipped",
        reason: "INVALID_TRUST_SAFETY_ACTION_PAYLOAD",
      }
    }

    if (payload.targetType !== "POST") {
      return {
        status: "skipped",
        reason: "TARGET_NOT_POST",
      }
    }

    const visibility = toContentVisibility(payload.actionType)

    if (!visibility) {
      return {
        status: "skipped",
        reason: "ACTION_NOT_CONTENT_VISIBILITY",
      }
    }

    await applyContentModerationVisibility({
      postId: payload.targetId,
      visibility,
      reason: payload.actionType,
      occurredAt: payload.occurredAt,
    })

    await writeDomainEventWithOutbox(
      buildContentVisibilityChangedEnvelope({
        sourceEventId: payload.eventId,
        contentId: payload.targetId,
        visibility,
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
