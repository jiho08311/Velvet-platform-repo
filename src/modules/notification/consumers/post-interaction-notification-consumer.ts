import type { DomainEventEnvelope } from "@/modules/events/contracts"
import {
  createInteractionNotificationInput,
} from "@/modules/notification/public/create-interaction-notification-input"
import {
  insertCanonicalNotification,
} from "@/modules/notification/repositories/canonical-notification-write-repository"

type PostLikedPayload = {
  postId: string
  actorUserId: string
  recipientUserId: string
  creatorId?: string | null
}

type CommentLikedPayload = {
  commentId: string
  postId?: string | null
  actorUserId: string
  recipientUserId: string
}

type CommentCreatedPayload = {
  postId: string
  commentId: string
  actorUserId: string
  recipientUserId: string
  creatorId?: string | null
}

type PostInteractionNotificationPayload =
  | PostLikedPayload
  | CommentLikedPayload
  | CommentCreatedPayload

function isPostLikedEvent(
  event: DomainEventEnvelope<Record<string, unknown>>,
): event is DomainEventEnvelope<PostLikedPayload> {
  return event.eventType === "PostLiked"
}

function isCommentLikedEvent(
  event: DomainEventEnvelope<Record<string, unknown>>,
): event is DomainEventEnvelope<CommentLikedPayload> {
  return event.eventType === "CommentLiked"
}

function isCommentCreatedEvent(
  event: DomainEventEnvelope<Record<string, unknown>>,
): event is DomainEventEnvelope<CommentCreatedPayload> {
  return event.eventType === "CommentCreated"
}

export async function consumePostInteractionNotificationEvent(
  event: DomainEventEnvelope<Record<string, unknown>>,
): Promise<void> {
  if (isPostLikedEvent(event)) {
    const notificationInput = createInteractionNotificationInput({
      type: "post_liked",
      actorUserId: event.payload.actorUserId,
      recipientUserId: event.payload.recipientUserId,
      postId: event.payload.postId,
    creatorId: event.payload.creatorId ?? event.payload.recipientUserId,
    })

    if (!notificationInput) return

    await insertCanonicalNotification({
      userId: notificationInput.userId,
      type: notificationInput.type,
      title: notificationInput.title,
      body: notificationInput.body,
      data: notificationInput.data ?? {},
      sourceDomain: "post",
      sourceEntityType: "post",
      sourceEntityId: event.payload.postId,
      actorUserId: event.payload.actorUserId,
      correlationId: event.correlation.correlationId,
    })

    return
  }

  if (isCommentLikedEvent(event)) {
    const notificationInput = createInteractionNotificationInput({
      type: "comment_liked",
      actorUserId: event.payload.actorUserId,
      recipientUserId: event.payload.recipientUserId,
postId: event.payload.postId ?? event.payload.commentId,
      commentId: event.payload.commentId,
    })

    if (!notificationInput) return

    await insertCanonicalNotification({
      userId: notificationInput.userId,
      type: notificationInput.type,
      title: notificationInput.title,
      body: notificationInput.body,
      data: notificationInput.data ?? {},
      sourceDomain: "post",
      sourceEntityType: "comment",
      sourceEntityId: event.payload.commentId,
      actorUserId: event.payload.actorUserId,
      correlationId: event.correlation.correlationId,
    })

    return
  }

  if (isCommentCreatedEvent(event)) {
    const notificationInput = createInteractionNotificationInput({
      type: "comment_created",
      actorUserId: event.payload.actorUserId,
      recipientUserId: event.payload.recipientUserId,
      postId: event.payload.postId,
      commentId: event.payload.commentId,
creatorId: event.payload.creatorId ?? event.payload.recipientUserId,
    })

    if (!notificationInput) return

    await insertCanonicalNotification({
      userId: notificationInput.userId,
      type: notificationInput.type,
      title: notificationInput.title,
      body: notificationInput.body,
      data: notificationInput.data ?? {},
      sourceDomain: "post",
      sourceEntityType: "comment",
      sourceEntityId: event.payload.commentId,
      actorUserId: event.payload.actorUserId,
      correlationId: event.correlation.correlationId,
    })
  }
}