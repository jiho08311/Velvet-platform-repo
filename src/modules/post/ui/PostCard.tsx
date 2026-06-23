"use client"

import type {
  PostCommerceState,
  PostRenderInput,
} from "@/modules/post/types"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  buildCreatorMessageHref,
  buildCreatorRoutePath,
} from "@/modules/creator/public/creator-identity"
import { LockedPostCard } from "./LockedPostCard"
import {
  readLikeInteractionResult,
  readViewerHasLikedFromCompatibility,
} from "@/shared/lib/like-interaction-result"
import { PostCardCommentsPanel } from "./PostCardCommentsPanel"
import { PostCardActions } from "./PostCardActions"
import { PostCardHeader } from "./PostCardHeader"
import { PostCardLockedAction } from "./PostCardLockedAction"
import { PostCardRenderSections } from "./PostCardRenderSections"
import { usePostCardComments } from "./use-post-card-comments"

export type PostCardCreator = {
  username: string
  displayName: string | null
  avatarUrl: string | null
}

export type PostCardSurfaceProps = {
  commentsCount?: number
  postId?: string
  createdAt: string
  renderInput: PostRenderInput
  canView: boolean
  isLocked: boolean
  lockReason?: "none" | "subscription" | "purchase"
  commerce: PostCommerceState
  price?: number
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  likesCount?: number
  viewerHasLiked?: boolean
  isLiked?: boolean
  creator: PostCardCreator
}

export function PostCard({
  postId,
  createdAt,
  renderInput,
  canView,
  isLocked,
  lockReason = "none",
  commerce,
  price,
  creatorId,
  creatorUserId,
  currentUserId,
  likesCount = 0,
  viewerHasLiked,
  commentsCount = 0,
  isLiked = false,
  creator,
}: PostCardSurfaceProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [currentViewerHasLiked, setCurrentViewerHasLiked] = useState(
    readViewerHasLikedFromCompatibility({ viewerHasLiked, isLiked })
  )
  const [currentLikesCount, setCurrentLikesCount] = useState(likesCount)
  const [isLikeLoading, setIsLikeLoading] = useState(false)

  const {
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
  } = usePostCardComments({
    postId,
    isLocked,
    commentsCount,
  })

  const resolvedRenderInput = renderInput

  async function handleLike(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()

    if (!postId || isLikeLoading) return

    try {
      setIsLikeLoading(true)

      const response = await fetch(`/api/post/${postId}/like`, {
        method: currentViewerHasLiked ? "DELETE" : "POST",
      })

      if (!response.ok) {
        return
      }

      const data = readLikeInteractionResult(await response.json().catch(() => null))

      if (!data || data.targetType !== "post" || data.targetId !== postId) {
        return
      }

      setCurrentViewerHasLiked(data.viewerHasLiked)
      setCurrentLikesCount(data.likesCount)
    } catch {
      return
    } finally {
      setIsLikeLoading(false)
    }
  }

  useEffect(() => {
    setCurrentViewerHasLiked(
      readViewerHasLikedFromCompatibility({ viewerHasLiked, isLiked })
    )
  }, [viewerHasLiked, isLiked])

  useEffect(() => {
    setCurrentLikesCount(likesCount)
  }, [likesCount])

  function handleCardClick() {
    return
  }

  function handleCreatorClick(event: React.MouseEvent) {
    event.stopPropagation()
    router.push(buildCreatorRoutePath({ username: creator.username }))
  }

  function handleCreatorMessageClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()

    if (!creatorUserId) return

    router.push(buildCreatorMessageHref({ creatorUserId }))
  }

  return (
    <article onClick={handleCardClick} className="group w-full">
      <PostCardHeader
        creator={creator}
        postId={postId}
        pathname={pathname}
        currentUserId={currentUserId}
        onCreatorClick={handleCreatorClick}
      />

      {isLocked ? (
        <div className="mt-2">
          <LockedPostCard
            renderInput={resolvedRenderInput}
            createdAt={createdAt}
            price={price}
            lockReason={lockReason === "none" ? undefined : lockReason}
            action={
              <PostCardLockedAction
                postId={postId}
                isLocked={isLocked}
                lockReason={lockReason}
                commerce={commerce}
                price={price}
                creatorId={creatorId}
                creatorUserId={creatorUserId}
                currentUserId={currentUserId}
                creator={creator}
              />
            }
          />
        </div>
      ) : (
        <>
          <PostCardRenderSections renderInput={resolvedRenderInput} />

          <PostCardActions
            createdAt={createdAt}
            currentLikesCount={currentLikesCount}
            currentViewerHasLiked={currentViewerHasLiked}
            displayCommentCount={displayCommentCount}
            isLikeLoading={isLikeLoading}
            onLike={handleLike}
            onCommentsToggle={handleCommentsToggle}
            onCreatorMessageClick={handleCreatorMessageClick}
          />

          <PostCardCommentsPanel
            showComments={showComments}
            comments={comments}
            visibleComments={visibleComments}
            expandedComments={expandedComments}
            isCommentsLoading={isCommentsLoading}
            commentInput={commentInput}
            isCommentSubmitting={isCommentSubmitting}
            commentError={commentError}
            deletingCommentId={deletingCommentId}
            likingCommentId={likingCommentId}
            pathname={pathname}
            currentUserId={currentUserId}
            onCommentInputChange={setCommentInput}
            onCommentSubmit={handleCommentSubmit}
            onExpandedCommentsToggle={handleExpandedCommentsToggle}
            onLikeComment={handleLikeComment}
            onDeleteComment={handleDeleteComment}
          />
        </>
      )}
    </article>
  )
}
