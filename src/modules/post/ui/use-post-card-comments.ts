"use client"

import { useEffect, useRef, useState } from "react"
import {
  createCommentLikeCompatibilityFields,
  readLikeInteractionResult,
} from "@/shared/lib/like-interaction-result"
import {
  isCommentItem,
  type CommentItem,
} from "@/modules/post/mappers/comment-item"

type UsePostCardCommentsInput = {
  postId?: string
  isLocked: boolean
  commentsCount: number
}

export function usePostCardComments({
  postId,
  isLocked,
  commentsCount,
}: UsePostCardCommentsInput) {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [isCommentsLoading, setIsCommentsLoading] = useState(false)
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null)
  const [optimisticCommentCountDelta, setOptimisticCommentCountDelta] =
    useState(0)
  const [expandedComments, setExpandedComments] = useState(false)
  const previousServerCommentsCountRef = useRef(commentsCount)

  const displayCommentCount = Math.max(
    0,
    commentsCount + optimisticCommentCountDelta
  )
  const visibleComments = expandedComments ? comments : comments.slice(0, 3)

  async function loadComments() {
    if (!postId || isLocked) return

    try {
      setIsCommentsLoading(true)

      const response = await fetch(`/api/post/${postId}/comments`, {
        method: "GET",
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()
      const items = Array.isArray(data?.items) ? data.items : []
      setComments(items)
    } catch {
      return
    } finally {
      setIsCommentsLoading(false)
    }
  }

  async function handleCommentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()

    const content = commentInput.trim()

    if (!postId || !content || isCommentSubmitting) return

    try {
      setIsCommentSubmitting(true)

      const response = await fetch(`/api/post/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        setCommentError(
          "부적절한 텍스트가 포함되어 있어 메시지를 보낼 수 없습니다."
        )
        return
      }

      const data = await response.json().catch(() => null)
      const item = data?.item

      if (isCommentItem(item)) {
        setComments((prev) => [
          item,
          ...prev.filter((comment) => comment.id !== item.id),
        ])
        setOptimisticCommentCountDelta((prev) => prev + 1)
      } else {
        await loadComments()
      }

      setCommentInput("")
      setCommentError(null)
    } catch {
      return
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  async function handleDeleteComment(
    event: React.MouseEvent<HTMLButtonElement>,
    commentId: string
  ) {
    event.stopPropagation()

    if (!commentId || deletingCommentId) return

    try {
      setDeletingCommentId(commentId)

      const response = await fetch(`/api/comment/${commentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        return
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentId))
      setOptimisticCommentCountDelta((prev) => prev - 1)
    } finally {
      setDeletingCommentId(null)
    }
  }

  async function handleLikeComment(
    event: React.MouseEvent<HTMLButtonElement>,
    commentId: string,
    likedByMe: boolean
  ) {
    event.stopPropagation()

    if (!commentId || likingCommentId) return

    try {
      setLikingCommentId(commentId)

      const response = await fetch(`/api/comment/${commentId}/like`, {
        method: likedByMe ? "DELETE" : "POST",
      })

      if (!response.ok) {
        return
      }

      const data = readLikeInteractionResult(await response.json().catch(() => null))

      if (!data || data.targetType !== "comment" || data.targetId !== commentId) {
        return
      }

      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id !== commentId) {
            return comment
          }

          return {
            ...comment,
            ...createCommentLikeCompatibilityFields(data),
          }
        })
      )
    } finally {
      setLikingCommentId(null)
    }
  }

  function handleCommentsToggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()

    const nextShow = !showComments
    setShowComments(nextShow)

    if (nextShow && comments.length === 0) {
      loadComments()
    }
  }

  function handleExpandedCommentsToggle(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation()
    setExpandedComments((prev) => !prev)
  }

  useEffect(() => {
    if (!showComments) {
      setExpandedComments(false)
    }
  }, [showComments])

  useEffect(() => {
    if (previousServerCommentsCountRef.current === commentsCount) {
      return
    }

    previousServerCommentsCountRef.current = commentsCount
    setOptimisticCommentCountDelta(0)
  }, [commentsCount])

  return {
    comments,
    visibleComments,
    expandedComments,
    isCommentsLoading,
    commentInput,
    isCommentSubmitting,
    commentError,
    deletingCommentId,
    likingCommentId,
    showComments,
    displayCommentCount,
    setCommentInput,
    handleCommentSubmit,
    handleCommentsToggle,
    handleExpandedCommentsToggle,
    handleLikeComment,
    handleDeleteComment,
  }
}
