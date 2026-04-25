import type { CreateNotificationInput } from "../types"
import type { ReportTargetType } from "@/modules/report/types"
import {
  createCommentCreatedNotificationInput,
  createCommentLikedNotificationInput,
  createPostLikedNotificationInput,
} from "./create-notification-inputs"

export type PostLikedInteractionEvent = {
  type: "post_liked"
  actorUserId: string
  recipientUserId: string
  postId: string
  creatorId: string
}

export type CommentCreatedInteractionEvent = {
  type: "comment_created"
  actorUserId: string
  recipientUserId: string
  postId: string
  commentId: string
  creatorId: string
}

export type CommentLikedInteractionEvent = {
  type: "comment_liked"
  actorUserId: string
  recipientUserId: string
  postId: string
  commentId: string
}

export type ReportCreatedInteractionEvent = {
  type: "report_created"
  actorUserId: string
  reportId: string
  targetType: ReportTargetType
  targetId: string
}

export type InteractionNotificationEvent =
  | PostLikedInteractionEvent
  | CommentCreatedInteractionEvent
  | CommentLikedInteractionEvent
  | ReportCreatedInteractionEvent

export function createInteractionNotificationInput(
  event: InteractionNotificationEvent,
): CreateNotificationInput | null {
  switch (event.type) {
    case "post_liked":
      if (event.actorUserId === event.recipientUserId) {
        return null
      }

      return createPostLikedNotificationInput({
        userId: event.recipientUserId,
        postId: event.postId,
        creatorId: event.creatorId,
      })

    case "comment_created":
      if (event.actorUserId === event.recipientUserId) {
        return null
      }

      return createCommentCreatedNotificationInput({
        userId: event.recipientUserId,
        postId: event.postId,
        commentId: event.commentId,
        creatorId: event.creatorId,
      })

    case "comment_liked":
      if (event.actorUserId === event.recipientUserId) {
        return null
      }

      return createCommentLikedNotificationInput({
        userId: event.recipientUserId,
        postId: event.postId,
        commentId: event.commentId,
      })

    case "report_created":
      // Reports stay within moderation/admin flows and do not fan out to user notifications.
      return null
  }
}
