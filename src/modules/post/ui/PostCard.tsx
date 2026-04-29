"use client"

import type {
  PostBlock,
  PostCommerceState,
  PostNormalizedRenderGroup,
  PostRenderInput,
  PostRenderMediaItem,
} from "@/modules/post/types"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  HeartIcon as HeartOutline,
  ChatBubbleOvalLeftIcon,
} from "@heroicons/react/24/outline"
import { PaperAirplaneIcon } from "@heroicons/react/24/outline"
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid"
import { formatInUserTimeZone } from "@/shared/lib/date-time"
import SubscribeButton from "@/modules/creator/ui/SubscribeButton"
import {
  buildCreatorMessageHref,
  buildCreatorRoutePath,
} from "@/modules/creator/lib/creator-identity"
import { buildReportTriggerPayload } from "@/modules/report/report-trigger"
import PostPurchaseButton from "./PostPurchaseButton"
import { ReportButton } from "@/modules/report/ui/ReportButton"
import { LockedPostCard } from "./LockedPostCard"
import { PostMoreMenu } from "./PostMoreMenu"
import { getPostCommerceCtaDecision } from "@/modules/post/lib/post-commerce-policy"
import {
  createCommentLikeCompatibilityFields,
  readLikeInteractionResult,
  readViewerHasLikedFromCompatibility,
} from "@/shared/lib/like-interaction-result"
import { isCommentItem, type CommentItem } from "@/modules/post/lib/comment-item"

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

type PostCardRenderSection =
  | {
      kind: "text"
      key: string
      text: string
      containerClassName: string
      textClassName: string
    }
  | {
      kind: "media"
      key: string
      items: PostRenderMediaItem[]
      mediaEntries?: Array<{
        media: PostRenderMediaItem
        block?: PostBlock
      }>
      isCarousel: boolean
      hasVideoBlock: boolean
    }

function formatPostDate(value: string) {
  return formatInUserTimeZone(value, { withTime: false })
}

function getFilterStyle(filter?: string) {
  switch (filter) {
    case "warm":
      return { filter: "sepia(0.3) saturate(1.2)" }
    case "cool":
      return { filter: "hue-rotate(180deg) saturate(1.1)" }
    case "mono":
      return { filter: "grayscale(1)" }
    case "vivid":
      return { filter: "contrast(1.2) saturate(1.4)" }
    default:
      return { filter: "none" }
  }
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


// CommentItem is the shared render contract for comment consumers.
// Do not redefine a local post comment shape here.
const [comments, setComments] = useState<CommentItem[]>([])



  const [commentInput, setCommentInput] = useState("")
  const [isCommentsLoading, setIsCommentsLoading] = useState(false)
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null)
  const [optimisticCommentCountDelta, setOptimisticCommentCountDelta] = useState(0)
  const [expandedComments, setExpandedComments] = useState(false)

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const previousServerCommentsCountRef = useRef(commentsCount)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const resolvedRenderInput = renderInput

  const {
    hasBlocks,
    blockText,
    blockMedia,
    normalizedGroups,
    resolvedMediaEntries,
    lockedPreviewText,
    primaryLockedPreviewMedia,
  } = resolvedRenderInput

  const hasNormalizedGroups = normalizedGroups.length > 0
  const shouldRenderNormalizedGroups = hasBlocks && hasNormalizedGroups
  const displayCommentCount = Math.max(0, commentsCount + optimisticCommentCountDelta)

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
        setComments((prev) => [item, ...prev.filter((comment) => comment.id !== item.id)])
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

  useEffect(() => {
    if (!showComments) {
      setExpandedComments(false)
    }
  }, [showComments])

  useEffect(() => {
    setCurrentViewerHasLiked(
      readViewerHasLikedFromCompatibility({ viewerHasLiked, isLiked })
    )
  }, [viewerHasLiked, isLiked])

  useEffect(() => {
    setCurrentLikesCount(likesCount)
  }, [likesCount])


useEffect(() => {
  if (previousServerCommentsCountRef.current === commentsCount) {
    return
  }

  previousServerCommentsCountRef.current = commentsCount
  setOptimisticCommentCountDelta(0)
}, [commentsCount])


  function handleCardClick() {
    return
  }

  function renderSingleMedia(
    item: PostRenderMediaItem,
    alt: string,
    block?: PostBlock
  ) {
    const mediaUrl = item.url?.trim() ?? ""
    if (!mediaUrl) return null

    if (item.type === "video") {
      const trimStart = block?.editorState?.video?.trimStart ?? 0
      const trimEnd = block?.editorState?.video?.trimEnd ?? null
      const muted = block?.editorState?.video?.muted ?? true
      const videoKey = item.id ?? item.url

      return (
        <video
          ref={(node) => {
            videoRefs.current[videoKey] = node
          }}
          src={mediaUrl}
          muted={muted}
          loop={trimEnd === null}
          playsInline
          autoPlay
          onClick={(event) => {
            const video = event.currentTarget
            if (video.paused) video.play()
            else video.pause()
          }}
          preload="metadata"
          onLoadedData={() => setIsVideoReady(true)}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget
            if (trimStart > 0) {
              video.currentTime = trimStart
            }
          }}
          onTimeUpdate={(event) => {
            const video = event.currentTarget

            if (
              trimEnd !== null &&
              trimEnd > trimStart &&
              video.currentTime >= trimEnd
            ) {
              video.pause()
            }
          }}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isVideoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      )
    }

    if (item.type === "audio") {
      return (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-4">
          <audio controls className="w-full">
            <source src={mediaUrl} />
          </audio>
        </div>
      )
    }

    if (item.type === "file") {
      return (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-4">
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            Open file
          </a>
        </div>
      )
    }

    return (
      <div className="relative h-full w-full">
        <img
          src={mediaUrl}
          alt={alt}
          style={getFilterStyle(block?.editorState?.image?.filter)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />

        {block?.editorState?.image?.overlayText?.text ? (
          <div
            className="pointer-events-none absolute left-1/2 top-[15%] -translate-x-1/2"
            style={{
              left: `${block.editorState.image.overlayText.x * 100}%`,
              top: `${block.editorState.image.overlayText.y * 100}%`,
              transform: `translate(-50%, -50%) scale(${
                block.editorState.image.overlayText.scale ?? 1
              })`,
            }}
          >
            <p className="whitespace-pre-wrap text-base font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
              {block.editorState.image.overlayText.text}
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const scrollLeft = event.currentTarget.scrollLeft
    const width = event.currentTarget.clientWidth
    const index = Math.round(scrollLeft / width)
    setCurrentIndex(index)
  }

  function renderMedia(
    items: PostRenderMediaItem[] = blockMedia,
    mediaEntries?: Array<{
      media: PostRenderMediaItem
      block?: PostBlock
    }>,
    isCarousel = false
  ) {
    if (items.length === 0) return null

    const resolvedEntries =
      mediaEntries && mediaEntries.length > 0
        ? mediaEntries
        : resolvedMediaEntries.filter((entry) =>
            items.some((item) => item.id === entry.media.id)
          )

    if (isCarousel) {
      return (
        <div className="relative">
          <div
            className="flex snap-x snap-mandatory overflow-x-auto"
            onScroll={handleScroll}
          >
            {items.map((item, index) => {
              const matchedEntry = resolvedEntries.find(
                (entry) => entry.media.id === item.id
              )

              return (
                <div
                  key={`${item.id ?? item.url}-${index}`}
                  className="min-w-full snap-center"
                >
                  <div className="aspect-[91/100] w-full overflow-hidden">
                    {renderSingleMedia(
                      item,
                      `Post media ${index + 1}`,
                      matchedEntry?.block
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {items.length > 1 ? (
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {items.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition ${
                    index === currentIndex ? "bg-[#C2185B]" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div className="mt-2">
        {items.map((item, index) => {
          const matchedEntry = resolvedEntries.find(
            (entry) => entry.media.id === item.id
          )

          return (
            <div
              key={`${item.id ?? item.url}-${index}`}
              className="aspect-[91/100] w-full overflow-hidden"
            >
              {renderSingleMedia(
                item,
                `Post media ${index + 1}`,
                matchedEntry?.block
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function renderNormalizedGroup(
    group: PostNormalizedRenderGroup,
    index: number
  ): PostCardRenderSection {
    if (group.type === "text") {
      return {
        kind: "text",
        key: group.block.id,
        text: group.block.content ?? "",
        containerClassName: "px-3 pt-3",
        textClassName:
          "whitespace-pre-wrap text-[15px] leading-7 text-white font-medium",
      }
    }

    return {
      kind: "media",
      key: `media-group-${index}`,
      items: group.mediaEntries.map((entry) => entry.media),
      mediaEntries: group.mediaEntries,
      isCarousel: group.variant === "carousel",
      hasVideoBlock: group.blocks.some((block) => block.type === "video"),
    }
  }

  function renderSection(section: PostCardRenderSection) {
    if (section.kind === "text") {
      return (
        <div key={section.key} className={section.containerClassName}>
          <p className={section.textClassName}>
            {section.text}
          </p>
        </div>
      )
    }

    const mediaItems = section.items
    return (
      <div key={section.key} className="overflow-hidden">
        {mediaItems.length > 0 ? (
          renderMedia(mediaItems, section.mediaEntries, section.isCarousel)
        ) : (
          <div className="mt-2 flex min-h-[220px] items-center justify-center bg-zinc-900 text-sm text-zinc-500">
            {section.hasVideoBlock
              ? "Video is processing..."
              : "Media not available"}
          </div>
        )}
      </div>
    )
  }

  function renderLockedAction() {
    const ctaDecision = getPostCommerceCtaDecision({
      isLocked,
      lockReason,
      commerce,
    })

    if (ctaDecision.showSubscribeCta) {
      return (
        <div onClick={(event) => event.stopPropagation()}>
          <SubscribeButton
            creatorId={creatorId}
            creatorUserId={creatorUserId}
            currentUserId={currentUserId}
            creatorUsername={creator.username}
            embedded
          />
        </div>
      )
    }

    if (ctaDecision.showPurchaseCta && postId) {
      return (
        <div onClick={(event) => event.stopPropagation()}>
          <PostPurchaseButton
            postId={postId}
            price={price}
            creatorUsername={creator.username}
            embedded
          />
        </div>
      )
    }

    return null
  }

   const creatorName = creator.displayName ?? creator.username

  const creatorInitial = creatorName.slice(0, 1).toUpperCase()
  const visibleComments = expandedComments ? comments : comments.slice(0, 3)
  const renderSections: PostCardRenderSection[] = shouldRenderNormalizedGroups
    ? normalizedGroups.map(renderNormalizedGroup)
    : [
        ...(blockMedia.length > 0
          ? [
              {
                kind: "media" as const,
                key: "fallback-media",
                items: blockMedia,
                isCarousel: false,
                hasVideoBlock: false,
              },
            ]
          : []),
        ...(blockText
          ? [
              {
                kind: "text" as const,
                key: "fallback-text",
                text: blockText,
                containerClassName: "px-0 pt-3",
                textClassName:
                  "whitespace-pre-wrap text-[16px] leading-7 text-white font-medium",
              },
            ]
          : []),
      ]

  function getCommentUsername(comment: CommentItem) {
    return comment.profiles?.username ?? "user"
  }

  function handleCreatorClick(event: React.MouseEvent) {
    event.stopPropagation()
    router.push(buildCreatorRoutePath({ username: creator.username }))
  }

  return (
    <article onClick={handleCardClick} className="group w-full">
      <div className="flex items-center justify-between px-0">
        <button
          type="button"
          onClick={handleCreatorClick}
          className="flex items-center gap-3 text-left"
        >
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creatorName}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
              {creatorInitial}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-white">
              {creatorName}
            </p>
          </div>
        </button>

        {postId ? (
          <div onClick={(event) => event.stopPropagation()}>
            <PostMoreMenu
              postId={postId}
              pathname={pathname}
              currentUserId={currentUserId}
            />
          </div>
        ) : null}
      </div>

      {isLocked ? (
        <div className="mt-2">
          <LockedPostCard
            renderInput={resolvedRenderInput}
            createdAt={createdAt}
            price={price}
            lockReason={lockReason === "none" ? undefined : lockReason}
            action={renderLockedAction()}
          />
        </div>
      ) : (
        <>
          {renderSections.map(renderSection)}

          <div className="flex items-center gap-4 px-0 pt-3">
            <button
              type="button"
              onClick={handleLike}
              disabled={isLikeLoading}
              className="flex items-center gap-1.5 p-2 text-zinc-300 hover:text-white active:scale-95"
            >
              {currentViewerHasLiked ? (
                <HeartSolid className="h-6 w-6 text-pink-500" />
              ) : (
                <HeartOutline className="h-6 w-6 stroke-[2.5]" />
              )}
              <span className="text-[14px] font-semibold">
                {currentLikesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()

                const nextShow = !showComments
                setShowComments(nextShow)

                if (nextShow && comments.length === 0) {
                  loadComments()
                }
              }}
              className="flex items-center gap-1.5 p-2 text-zinc-300 hover:text-white active:scale-95"
            >
              <ChatBubbleOvalLeftIcon className="h-6 w-6 stroke-[2.5]" />
              <span className="text-[14px] font-semibold">
                {displayCommentCount}
              </span>
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()

                if (!creatorUserId) return

                router.push(buildCreatorMessageHref({ creatorUserId }))
              }}
              className="flex items-center gap-1.5 p-2 text-zinc-300 hover:text-white active:scale-95"
            >
              <PaperAirplaneIcon className="h-6 w-6 stroke-[2.5]" />
            </button>

            <p className="text-[13px] text-zinc-400">
              {formatPostDate(createdAt)}
            </p>
          </div>

          {showComments ? (
            <div
              className="space-y-3 px-3 pt-3"
              onClick={(event) => event.stopPropagation()}
            >
              <form onSubmit={handleCommentSubmit}>
                <input
                  value={commentInput}
                  onChange={(event) => setCommentInput(event.target.value)}
                  placeholder="Write a comment..."
                  className="w-full border-b border-zinc-800 bg-black px-0 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                  disabled={isCommentSubmitting}
                />
              </form>

              {commentError ? (
                <p className="text-xs text-red-500">{commentError}</p>
              ) : null}

              {isCommentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="animate-pulse px-0 py-3">
                      <div className="mb-2 h-3 w-1/3 rounded bg-zinc-700" />
                      <div className="h-3 w-2/3 rounded bg-zinc-700" />
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-zinc-500">No comments yet.</p>
              ) : (
                <div className="space-y-2">
{visibleComments.map((comment) => {
  const canShowDeleteButton = comment.canDelete === true

  return (
    <div key={comment.id} className="bg-black px-1 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 text-sm leading-6 text-zinc-300">
                          <span className="mr-2 text-sm font-semibold text-white">
                            @{getCommentUsername(comment)}
                          </span>
                          {comment.content}
                        </p>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) =>
                              handleLikeComment(
                                event,
                                comment.id,
                                Boolean(comment.is_liked)
                              )
                            }
                            disabled={likingCommentId === comment.id}
                            className="inline-flex items-center gap-1.5 px-0 py-1 text-sm text-zinc-300 transition hover:text-white active:scale-95"
                          >
                            {comment.is_liked ? (
                              <HeartSolid className="h-4 w-4 text-pink-500" />
                            ) : (
                              <HeartOutline className="h-6 w-6 stroke-[2.5]" />
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
                              onClick={(event) =>
                                handleDeleteComment(event, comment.id)
                              }
                              disabled={deletingCommentId === comment.id}
                              className="px-0 py-1 text-sm font-medium text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                      onClick={(event) => {
                        event.stopPropagation()
                        setExpandedComments((prev) => !prev)
                      }}
                      className="text-sm text-zinc-400 hover:text-white"
                    >
                      {expandedComments
                        ? "Hide comments"
                        : `View ${comments.length - 3} more comments`}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </article>
  )
}