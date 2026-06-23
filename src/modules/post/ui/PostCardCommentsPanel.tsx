"use client"

import {
  HeartIcon as HeartOutline,
} from "@heroicons/react/24/outline"
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid"
import { buildReportTriggerPayload } from "@/modules/report/report-trigger"
import { ReportButton } from "@/modules/report/public/report-button-ui"
import type { CommentItem } from "@/modules/post/mappers/comment-item"

const POST_CARD_COMMENT_CLASSES = {
  root: "space-y-3 px-3 pt-3",
  input:
    "w-full border-b border-zinc-800 bg-black px-0 py-3 text-sm text-white outline-none placeholder:text-zinc-500",
  error: "text-xs text-red-500",
  loadingList: "space-y-2",
  loadingItem: "animate-pulse px-0 py-3",
  loadingAuthor: "mb-2 h-3 w-1/3 rounded bg-zinc-700",
  loadingContent: "h-3 w-2/3 rounded bg-zinc-700",
  empty: "text-xs text-zinc-500",
  list: "space-y-2",
  item: "bg-black px-1 py-2",
  itemRow: "flex items-start justify-between gap-3",
  itemContent: "min-w-0 text-sm leading-6 text-zinc-300",
  itemAuthor: "mr-2 text-sm font-semibold text-white",
  itemActions: "flex shrink-0 items-center gap-2",
  likeButton:
    "inline-flex items-center gap-1.5 px-0 py-1 text-sm text-zinc-300 transition hover:text-white active:scale-95",
  likedIcon: "h-4 w-4 text-pink-500",
  likeIcon: "h-6 w-6 stroke-[2.5]",
  deleteButton:
    "px-0 py-1 text-sm font-medium text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
  expandButton: "text-sm text-zinc-400 hover:text-white",
} as const

type PostCardCommentsPanelProps = {
  showComments: boolean
  comments: CommentItem[]
  visibleComments: CommentItem[]
  expandedComments: boolean
  isCommentsLoading: boolean
  commentInput: string
  isCommentSubmitting: boolean
  commentError: string | null
  deletingCommentId: string | null
  likingCommentId: string | null
  pathname: string
  currentUserId?: string
  onCommentInputChange: (value: string) => void
  onCommentSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onExpandedCommentsToggle: (event: React.MouseEvent<HTMLButtonElement>) => void
  onLikeComment: (
    event: React.MouseEvent<HTMLButtonElement>,
    commentId: string,
    likedByMe: boolean
  ) => void
  onDeleteComment: (
    event: React.MouseEvent<HTMLButtonElement>,
    commentId: string
  ) => void
}

function getCommentUsername(comment: CommentItem) {
  return comment.profiles?.username ?? "user"
}

function CommentsLoadingState() {
  return (
    <div className={POST_CARD_COMMENT_CLASSES.loadingList}>
      {[1, 2, 3].map((index) => (
        <div key={index} className={POST_CARD_COMMENT_CLASSES.loadingItem}>
          <div className={POST_CARD_COMMENT_CLASSES.loadingAuthor} />
          <div className={POST_CARD_COMMENT_CLASSES.loadingContent} />
        </div>
      ))}
    </div>
  )
}

export function PostCardCommentsPanel({
  showComments,
  comments,
  visibleComments,
  expandedComments,
  isCommentsLoading,
  commentInput,
  isCommentSubmitting,
  commentError,
  deletingCommentId,
  likingCommentId,
  pathname,
  currentUserId,
  onCommentInputChange,
  onCommentSubmit,
  onExpandedCommentsToggle,
  onLikeComment,
  onDeleteComment,
}: PostCardCommentsPanelProps) {
  if (!showComments) {
    return null
  }

  return (
    <div
      className={POST_CARD_COMMENT_CLASSES.root}
      onClick={(event) => event.stopPropagation()}
    >
      <form onSubmit={onCommentSubmit}>
        <input
          value={commentInput}
          onChange={(event) => onCommentInputChange(event.target.value)}
          placeholder="Write a comment..."
          className={POST_CARD_COMMENT_CLASSES.input}
          disabled={isCommentSubmitting}
        />
      </form>

      {commentError ? (
        <p className={POST_CARD_COMMENT_CLASSES.error}>{commentError}</p>
      ) : null}

      {isCommentsLoading ? (
        <CommentsLoadingState />
      ) : comments.length === 0 ? (
        <p className={POST_CARD_COMMENT_CLASSES.empty}>No comments yet.</p>
      ) : (
        <div className={POST_CARD_COMMENT_CLASSES.list}>
          {visibleComments.map((comment) => {
            const canShowDeleteButton = comment.canDelete === true

            return (
              <div key={comment.id} className={POST_CARD_COMMENT_CLASSES.item}>
                <div className={POST_CARD_COMMENT_CLASSES.itemRow}>
                  <p className={POST_CARD_COMMENT_CLASSES.itemContent}>
                    <span className={POST_CARD_COMMENT_CLASSES.itemAuthor}>
                      @{getCommentUsername(comment)}
                    </span>
                    {comment.content}
                  </p>

                  <div className={POST_CARD_COMMENT_CLASSES.itemActions}>
                    <button
                      type="button"
                      onClick={(event) =>
                        onLikeComment(event, comment.id, Boolean(comment.is_liked))
                      }
                      disabled={likingCommentId === comment.id}
                      className={POST_CARD_COMMENT_CLASSES.likeButton}
                    >
                      {comment.is_liked ? (
                        <HeartSolid className={POST_CARD_COMMENT_CLASSES.likedIcon} />
                      ) : (
                        <HeartOutline className={POST_CARD_COMMENT_CLASSES.likeIcon} />
                      )}
                      <span>{comment.likes_count ?? 0}</span>
                    </button>

                    <div onClick={(event) => event.stopPropagation()}>
                      <ReportButton
                        payload={buildReportTriggerPayload({
                          targetType: "comment",
                          targetId: comment.id,
                          pathname,
                        })}
                        currentUserId={currentUserId}
                      />
                    </div>

                    {canShowDeleteButton ? (
                      <button
                        type="button"
                        onClick={(event) => onDeleteComment(event, comment.id)}
                        disabled={deletingCommentId === comment.id}
                        className={POST_CARD_COMMENT_CLASSES.deleteButton}
                      >
                        {deletingCommentId === comment.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}

          {comments.length > 3 ? (
            <button
              type="button"
              onClick={onExpandedCommentsToggle}
              className={POST_CARD_COMMENT_CLASSES.expandButton}
            >
              {expandedComments
                ? "Hide comments"
                : `View ${comments.length - 3} more comments`}
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
