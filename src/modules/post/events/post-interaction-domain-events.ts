import { randomUUID } from "crypto"

import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"

export type PostLikedNotificationPayload = {
  postId: string
  actorUserId: string
  recipientUserId: string
  creatorId?: string | null
}

export type CommentLikedNotificationPayload = {
  commentId: string
  postId?: string | null
  actorUserId: string
  recipientUserId: string
}

export type CommentCreatedNotificationPayload = {
  postId: string
  commentId: string
  actorUserId: string
  recipientUserId: string
  creatorId?: string | null
}

function createCorrelationId(): string {
  return randomUUID()
}

function createPostInteractionEnvelope<TPayload extends Record<string, unknown>>(
  input: {
    eventType: "PostLiked" | "CommentLiked" | "CommentCreated"
    aggregateId: string
    actorUserId: string
    recipientUserId: string
    correlationId?: string
    payload: TPayload
  },
): DomainEventEnvelope<TPayload> {
  const now = new Date().toISOString()
  const eventId = randomUUID()
  const correlationId = input.correlationId ?? createCorrelationId()

  return {
    eventId,
    eventType: input.eventType,
    eventVersion: 1,
    aggregate: {
      aggregateType:
        input.eventType === "CommentLiked" ||
        input.eventType === "CommentCreated"
          ? "comment"
          : "post",
      aggregateId: input.aggregateId,
    },
    source: {
      producerModule: "post",
      producerSurface: "post_interaction_runtime",
      sourceFile: "src/modules/post/runtime/execute-post-interaction-runtime.ts",
      sourceTable: null,
      sourceRowId: input.aggregateId,
    },
    actor: {
      actorType: "user",
      actorId: input.actorUserId,
    },
    subject: {
      userId: input.actorUserId,
      recipientUserId: input.recipientUserId,
    },
    correlation: {
      correlationId,
      causationId: null,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt: now,
      recordedAt: now,
    },
    delivery: {
      idempotencyKey: `${input.eventType}:${input.aggregateId}:${input.actorUserId}:${input.recipientUserId}`,
      outboxRequired: true,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload: input.payload,
    metadata: {
      eventFamily: "post_interaction_notification",
      legacyRuntimePreserved: false,
      shadowMode: false,
      schemaName: "post_interaction_notification_v1",
    },
  }
}

export async function emitPostLikedNotificationEvent(
  payload: PostLikedNotificationPayload,
): Promise<void> {
  await writeDomainEventWithOutbox(
    createPostInteractionEnvelope({
      eventType: "PostLiked",
      aggregateId: payload.postId,
      actorUserId: payload.actorUserId,
      recipientUserId: payload.recipientUserId,
      payload,
    }),
  )
}

export async function emitCommentLikedNotificationEvent(
  payload: CommentLikedNotificationPayload,
): Promise<void> {
  await writeDomainEventWithOutbox(
    createPostInteractionEnvelope({
      eventType: "CommentLiked",
      aggregateId: payload.commentId,
      actorUserId: payload.actorUserId,
      recipientUserId: payload.recipientUserId,
      payload,
    }),
  )
}

export async function emitCommentCreatedNotificationEvent(
  payload: CommentCreatedNotificationPayload,
): Promise<void> {
  await writeDomainEventWithOutbox(
    createPostInteractionEnvelope({
      eventType: "CommentCreated",
      aggregateId: payload.commentId,
      actorUserId: payload.actorUserId,
      recipientUserId: payload.recipientUserId,
      payload,
    }),
  )
}
