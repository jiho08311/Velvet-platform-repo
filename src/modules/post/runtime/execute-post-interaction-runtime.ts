import {
  emitCommentCreatedNotificationEvent,
  emitCommentLikedNotificationEvent,
  emitPostLikedNotificationEvent,
} from "@/modules/post/events/post-interaction-domain-events"
import {
  countPostLikes,
  deletePostLike,
  findCreatorUser,
  findPostOwner,
  insertPostLike,
} from "@/modules/post/public/post-like"
import {
  countCommentLikes,
  createCommentLike,
  deleteCommentLike,
  findCommentOwnerForNotification,
} from "@/modules/post/public/comment-like"
import { createLikeInteractionResult } from "@/shared/lib/like-interaction-result"
import { logger } from "@/shared/observability/structured-logger"
import { refreshCanonicalPostInteractionCounts } from "@/modules/post/repositories/canonical-post-interaction-count-repository"

import {
  createComment,
  findCommentAuthorProfile,
} from "@/modules/post/public/comment-data"
import {
  createCommentItem,
  type CommentItemProfile,
  type CommentRow,
} from "@/modules/post/public/comment-item"
import { canDeleteComment } from "@/modules/post/public/comment-permissions"

async function shadowRefreshInteractionCounts(
  postId: string,
  operation: string
) {
  try {
    await refreshCanonicalPostInteractionCounts(postId)
  } catch (error) {
    logger.warn({
      event: "post.interaction.canonical_shadow_write_failed",
      context: { operation, postId },
      error,
    })
  }
}

export async function executePostLike(input: {
  postId: string
  userId: string
}) {
  await insertPostLike({
    postId: input.postId,
    userId: input.userId,
  })

  await shadowRefreshInteractionCounts(input.postId, "executePostLike")

  try {
    const post = await findPostOwner(input.postId)

    if (post?.creator_id) {
      const creator = await findCreatorUser(post.creator_id)

      if (creator?.user_id) {
        await emitPostLikedNotificationEvent({
          postId: input.postId,
          actorUserId: input.userId,
          recipientUserId: creator.user_id,
          creatorId: post.creator_id,
        })
      }
    }
  } catch (error) {
    logger.warn({
      event: "post.interaction.post_liked_event_emit_failed",
      context: { postId: input.postId, actorUserId: input.userId },
      error,
    })
  }

  const likesCount = await countPostLikes(input.postId)

  return createLikeInteractionResult({
    targetType: "post",
    targetId: input.postId,
    viewerHasLiked: true,
    likesCount,
  })
}

export async function executePostUnlike(input: {
  postId: string
  userId: string
}) {
  await deletePostLike({
    postId: input.postId,
    userId: input.userId,
  })

  await shadowRefreshInteractionCounts(input.postId, "executePostUnlike")

  const likesCount = await countPostLikes(input.postId)

  return createLikeInteractionResult({
    targetType: "post",
    targetId: input.postId,
    viewerHasLiked: false,
    likesCount,
  })
}

export async function executeCommentLike(input: {
  commentId: string
  userId: string
}) {
  await createCommentLike({
    commentId: input.commentId,
    userId: input.userId,
  })

  try {
    const comment = await findCommentOwnerForNotification(input.commentId)

    if (comment?.post_id) {
      await shadowRefreshInteractionCounts(
        comment.post_id,
        "executeCommentLike"
      )
    }

    if (comment?.user_id) {
      await emitCommentLikedNotificationEvent({
        commentId: comment.id,
        postId: comment.post_id,
        actorUserId: input.userId,
        recipientUserId: comment.user_id,
      })
    }
  } catch (error) {
    logger.warn({
      event: "post.interaction.comment_liked_event_emit_failed",
      context: { commentId: input.commentId, actorUserId: input.userId },
      error,
    })
  }

  const likesCount = await countCommentLikes(input.commentId)

  return createLikeInteractionResult({
    targetType: "comment",
    targetId: input.commentId,
    viewerHasLiked: true,
    likesCount,
  })
}

export async function executeCommentUnlike(input: {
  commentId: string
  userId: string
}) {
  await deleteCommentLike({
    commentId: input.commentId,
    userId: input.userId,
  })

  try {
    const comment = await findCommentOwnerForNotification(input.commentId)

    if (comment?.post_id) {
      await shadowRefreshInteractionCounts(
        comment.post_id,
        "executeCommentUnlike"
      )
    }
  } catch {
    // Preserve unlike success even if count lookup fails.
  }

  const likesCount = await countCommentLikes(input.commentId)

  return createLikeInteractionResult({
    targetType: "comment",
    targetId: input.commentId,
    viewerHasLiked: false,
    likesCount,
  })
}

export async function executeCreatePostComment(input: {
  postId: string
  userId: string
  content: string
}) {
  const insertedComment: CommentRow = await createComment({
    postId: input.postId,
    userId: input.userId,
    content: input.content,
  })

  await shadowRefreshInteractionCounts(
    input.postId,
    "executeCreatePostComment"
  )

  const profile: CommentItemProfile = await findCommentAuthorProfile(
    input.userId
  )

  try {
    const post = await findPostOwner(input.postId)

    if (post?.creator_id) {
      const creator = await findCreatorUser(post.creator_id)

      if (creator?.user_id) {
        await emitCommentCreatedNotificationEvent({
          postId: input.postId,
          commentId: insertedComment.id,
          actorUserId: input.userId,
          recipientUserId: creator.user_id,
          creatorId: post.creator_id,
        })
      }
    }
  } catch (error) {
    logger.warn({
      event: "post.interaction.comment_created_event_emit_failed",
      context: { postId: input.postId, actorUserId: input.userId },
      error,
    })
  }

  const item = createCommentItem({
    comment: insertedComment,
    profile,
    likesCount: 0,
    viewerHasLiked: false,
    canDelete: canDeleteComment({
      currentUserId: input.userId,
      commentUserId: insertedComment.user_id,
    }),
  })

  return {
    ok: true,
    item,
  }
}
